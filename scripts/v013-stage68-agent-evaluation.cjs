'use strict';
// Audit new native, earned-account agents. Never edits balance or accounts.
const fs=require('node:fs'),path=require('node:path');
const PLANNER=require('./v013-build-planner.cjs');
const avg=a=>a.length?Number((a.reduce((s,x)=>s+x,0)/a.length).toFixed(2)):null;
const count=(a,fn)=>a.filter(fn).length;
const sum=(a,fn)=>a.reduce((s,x)=>s+(Number(fn(x))||0),0);
const uniq=a=>[...new Set(a)];
function evaluate(reports,opts={}){
 if(!reports.length||reports.some(x=>!x.accounts?.length))throw Error('Missing native agent shards');
 const sources=uniq(reports.map(x=>x.source)),runners=uniq(reports.map(x=>x.runnerSha256));
 if(sources.length!==1||runners.length!==1)throw Error('Mixed native gameplay/agent revisions');
 const accounts=reports.flatMap(r=>r.accounts),identity=new Set();
 const profiles=Object.keys(PLANNER.BUILDS).map(x=>'smart-'+x);
 for(const account of accounts){
  const k=account.profile+':'+account.seed;
  if(identity.has(k))throw Error('Duplicate native strategic account '+k);
  identity.add(k);
  if(!profiles.includes(account.profile))throw Error('Unrecognized strategic account '+k);
  if(account.startXp!==0||account.initialGear?.total!==account.initialGear?.starter)
   throw Error('Non-native starter '+k);
  for(const attempt of account.attempts){
   if(attempt.error||attempt.status==='error')throw Error('Native agent error '+k+' E'+attempt.level+': '+attempt.error);
   if(attempt.level>1&&!account.attempts.some(t=>t.level===attempt.level-1&&t.bossWon))
    throw Error('Artificial unlock '+k+' E'+attempt.level);
   const before=attempt.before||{},camp=attempt.camp||{},plan=camp.plan;
   if(!plan||plan.id!==account.profile.slice(6))throw Error('Missing planned native Camp transaction '+k);
   if(before.earned<before.spent||before.xp<0||camp.plan.points!==before.earned)
    throw Error('Invented Talents '+k+' E'+attempt.level);
   const actual=before.talentNodes||[],allowed=new Set(plan.allowed);
   for(const id of actual)if(id.startsWith('affinity_')&&!allowed.has(id.slice('affinity_'.length)))
    throw Error('Outside available affinity threshold '+k+' '+id);
   if(before.spent>plan.points)throw Error('Invalid spent points '+k);
  }
 }
 if(opts.expectedAccounts!==undefined&&accounts.length!==opts.expectedAccounts)
  throw Error('Incomplete account cohort '+accounts.length);
 const overview=[];
 for(const profile of profiles){
  const aa=accounts.filter(a=>a.profile===profile),attempts=aa.flatMap(a=>a.attempts);
  const plan=PLANNER.getPlan(profile.slice(6)),earnedAttempts=attempts.filter(t=>t.before?.earned>0);
  const used=attempts.flatMap(t=>t.potions||[]),weapon=attempts.map(t=>t.before?.gear?.items?.find(i=>i.slot==='weapon')?.subtype||'Unarmed');
  const stages=Object.fromEntries([1,3,5,6,7,10].map(E=>['E'+E,
   {entered:count(aa,a=>a.reached.includes(E)),cleared:count(aa,a=>a.attempts.some(t=>t.level===E&&t.bossWon))}]));
  const milestones=uniq(attempts.map(t=>t.camp?.plan?.milestone).filter(Boolean));
  const openedAffinity=Object.fromEntries(['blood','fury','radiance','aegis','arcane','decay'].map(f=>[f,
   count(attempts,t=>t.before?.talentNodes?.includes('affinity_'+f))]));
  const changes=sum(attempts,t=>(t.camp?.resets||[]).length),resets=attempts.flatMap(t=>t.camp?.resets||[]);
  const meaningfulWeapon=weapon.filter(w=>plan.weapons.includes(w)).length;
  const paths=attempts.map(t=>t.camp?.plan?.allowed||[]),ability=attempts.map(t=>t.before?.prepared).filter(Boolean);
  overview.push({profile,model:plan.model,primary:plan.primary,second:plan.secondary||null,third:plan.third||null,
   wantsMixed:!!plan.mix,preferWeapons:plan.weapons,
   stages,accounts:aa.length,attempts:attempts.length,
   meanEarnedOnEntry:avg(earnedAttempts.map(t=>t.before.earned)),maxEarnedOnEntry:Math.max(0,...attempts.map(t=>t.before?.earned||0)),
   secondEligible:count(attempts,t=>t.before?.earned>=(plan.secondAt||Infinity)),
   secondSelected:count(attempts,t=>t.before?.talentNodes?.includes('affinity_'+plan.secondary)),
   thirdEligible:count(attempts,t=>t.camp?.plan?.allowed?.includes(plan.third)&&!!plan.third),
   thirdSelected:count(attempts,t=>t.before?.talentNodes?.includes('affinity_'+plan.third)),
   pureFocus:count(paths,x=>x.length===1),mixedAffinities:count(paths,x=>x.length===2),
   triAffinities:count(paths,x=>x.length===3),
   milestones,openedAffinity,preparedAbilityCount:ability.length,
   resets:changes,resetReasons:uniq(resets.map(x=>x.reason)),weapons:Object.fromEntries(uniq(weapon).map(w=>[w,count(weapon,x=>x===w)])),
   preferredWeaponRatio:weapon.length?Number((100*meaningfulWeapon/weapon.length).toFixed(1)):null,
   potions:used.length,potionsByKind:Object.fromEntries(uniq(used.map(x=>x.kind)).map(k=>[k,count(used,x=>x.kind===k)])),
   preBossPotions:count(used,x=>/boss/.test(x.reason||'')),preElitePotions:count(used,x=>/elite/.test(x.reason||'')),
   errors:0});
 }
 return {stage:'6.8-native-strategic-agents',source:sources[0],runnerSha256:runners[0],
  accounts:accounts.length,profiles:profiles.length,seeds:uniq(accounts.map(a=>a.seed)).sort((a,b)=>a-b),
  attempts:sum(accounts,a=>a.attempts.length),
  errors:0,check:'All native talents, map unlocks and camp spend are legal, no synthetic gear/XP',
  overview,caveats:[
   'Only four shared RNG seeds; these 80 account runs are not 80 independent map seeds.',
   'Some accounts never reach the 12–14 or 28–30 point Affinity thresholds because E1–E5 are difficult.',
   'Weapon preferences cannot grant or force loot; preferred-weapon exposure must be reported.',
   'Strategic potion policies only affect genuinely available purchased doses and legal map preparation, not mid-combat consumption.',
   'These agents are better-structured transparent heuristics, not mathematically optimal builds or experienced human players.',
   'Do not rebalance enemy stats based solely on agents that never obtained their intended functional equipment.',
   'No game balance, rewards, talents or saves were modified.' ]};
}
function markdown(r){
 const out=['# Wanderer v0.13 — Stage 6.8: Strategic build agents native audit','',
  '**No balance changes, synthetic XP, forced loot, level jumps, merge or deploy.**',
  '',r.accounts+' native accounts; '+r.profiles+' distinct strategies; '+r.seeds.length+' shared seeds; '+r.attempts+' attempts; '+r.errors+' runtime errors.',
  '','## Real natural progression from E1 (not pre-geared test accounts)','',
  '| Agent | E1 clears | E3 clears | E5 clears | E10 clears | Max real points at Camp | Affinities attempted (1/2/3) | Resets | Preferred weapon equipped |',
  '|---|---:|---:|---:|---:|---:|---:|---:|---:|',
  ...r.overview.map(x=>'| '+x.profile+' | '+x.stages.E1.cleared+'/'+x.accounts+
   ' | '+x.stages.E3.cleared+'/'+x.accounts+' | '+x.stages.E5.cleared+'/'+x.accounts+
   ' | '+x.stages.E10.cleared+'/'+x.accounts+' | '+x.maxEarnedOnEntry+
   ' | '+x.pureFocus+'/'+x.mixedAffinities+'/'+x.triAffinities+' | '+x.resets+
   ' | '+x.preferredWeaponRatio+'% |'),
  '','## Agent behavior and actual equipment vs intended loadout','',
  ...r.overview.flatMap(x=>[
   '### '+x.profile,
   '- Strategy: '+x.model+'; Affinities '+[x.primary,x.second,x.third].filter(Boolean).join(' → ')+
    '; intended weapon(s): '+x.preferWeapons.join(', ')+'.',
   '- Second Affinity threshold reached in '+x.secondEligible+' attempt starts; unlocked in '+x.secondSelected+
    '. Third eligible in '+x.thirdEligible+', actually unlocked in '+x.thirdSelected+'.',
   '- Actual weapons: '+JSON.stringify(x.weapons)+'. Real milestones considered: '+(x.milestones.join(', ')||'none')+
    '. Prepared ability entries: '+x.preparedAbilityCount+'.',
   '- Native resets '+x.resets+' ('+(x.resetReasons.join(', ')||'none')+'). Potions used '+x.potions+
    '; before Boss '+x.preBossPotions+', before Elite '+x.preElitePotions+
    '. Potion mix '+JSON.stringify(x.potionsByKind)+'.',
   '' ]),
  '## Interpretation constraints','',...r.caveats.map(x=>'- '+x),''];
 return out.join('\n')+'\n';
}
function main(args=process.argv.slice(2)){
 const [output,...paths]=args;
 if(!output?.endsWith('.json')||paths.length!==5)throw Error('Expected OUT.json and five native strategic account report files');
 const r=evaluate(paths.map(p=>JSON.parse(fs.readFileSync(p,'utf8'))),{expectedAccounts:84});
 fs.mkdirSync(path.dirname(output),{recursive:true});
 fs.writeFileSync(output,JSON.stringify(r,null,2)+'\n');
 fs.writeFileSync(output.replace(/\.json$/,'.md'),markdown(r));
 console.log('STAGE68_AUDIT='+JSON.stringify({accounts:r.accounts,profiles:r.profiles,attempts:r.attempts,
  baseline:r.overview.map(x=>({profile:x.profile,E1:x.stages.E1.cleared,E5:x.stages.E5.cleared,
   E10:x.stages.E10.cleared,prefs:x.preferredWeaponRatio,
   points:x.maxEarnedOnEntry,resets:x.resets,second:x.secondSelected,third:x.thirdSelected,
   preBoss:x.preBossPotions,preElite:x.preElitePotions}))}));
 return r;
}
if(require.main===module)main();
module.exports={evaluate,markdown,main};
