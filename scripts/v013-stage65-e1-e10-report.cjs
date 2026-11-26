'use strict';
// Read-only analysis of genuine E1–E10 account traces. Never injects game state.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const mean=a=>a.length?+(a.reduce((n,x)=>n+x,0)/a.length).toFixed(2):null;
const count=(a,fn)=>a.filter(fn).length;
const sum=(a,fn)=>a.reduce((n,x)=>n+(Number(fn(x))||0),0);
const unique=a=>[...new Set(a)];
function summarize(reports){
 if(!reports.length||reports.some(x=>!x||!Array.isArray(x.accounts)))throw Error('Expected native-account reports');
 const srcs=unique(reports.map(x=>x.source)),runnerSha=unique(reports.map(x=>x.runnerSha256));
 if(srcs.length!==1||runnerSha.length!==1)throw Error('Mixed native revisions within one E1-E10 cohort');
 const keys=new Set(),accounts=reports.flatMap(report=>report.accounts);
 for(const a of accounts){
  const id=a.profile+':'+a.seed;
  if(keys.has(id))throw Error('Repeated natural account '+id);keys.add(id);
  if(!a.reached?.includes(1)||!Array.isArray(a.attempts))throw Error('Incomplete native account '+id);
  for(const t of a.attempts){
   if(t.level>1&&!a.attempts.some(prior=>prior.level===t.level-1&&prior.bossWon))
    throw Error('Impossible native unlock at E'+t.level+' '+id);
   if(t.before?.unlocked<t.level)throw Error('Started locked Expedition '+id);
   if(t.before?.earned<t.before?.spent)throw Error('Synthetic Talent points '+id);
   if(t.before?.xp<0)throw Error('Negative XP '+id);
  }
 }
 const attempts=accounts.flatMap(a=>a.attempts.map(t=>({...t,accountSeed:a.seed,accountProfile:a.profile})));
 const fights=attempts.flatMap(t=>(t.rooms||[]).map(r=>({...r,level:t.level,profile:t.accountProfile,seed:t.accountSeed,weapon:t.before?.gear?.items?.find(i=>i.slot==='weapon')?.subtype||'unarmed',nodes:t.before?.talentNodes||[],element:t.before?.element||'unattuned'})));
 const stats=Array.from({length:10},(_,i)=>{
  const level=i+1,group=attempts.filter(t=>t.level===level);
  const reached=accounts.filter(a=>a.reached.includes(level));
  const roomFights=group.flatMap(t=>t.rooms||[]);
  const boss=roomFights.filter(r=>r.roomType==='boss');
  const valid=group.filter(t=>t.status!=='error'&&!t.error);
  const mana=roomFights.filter(r=>Number(r.mpMax)>0),caster=mana.filter(r=>r.unfundedCasterAttacks>0||r.fundedCasts>0);
  return {level,accountsReached:reached.length,attempts:group.length,validAttempts:valid.length,
   clears:count(group,t=>t.bossWon),bossReached:count(group,t=>t.bossReached),bossFights:boss.length,
   bossDeaths:count(boss,r=>r.died),deaths:count(group,t=>t.status==='defeat'),
   extractions:count(group,t=>t.status==='extracted'),errors:count(group,t=>t.error||t.status==='error'),
   lootDrops:sum(roomFights,r=>(r.loot||[]).length),
   greyDrops:sum(roomFights,r=>count(r.loot||[],item=>item.rarity==='Common')),
   forged:sum(group,t=>(t.camp?.crafted||[]).length),
   purchased:sum(group,t=>(t.camp?.bought||[]).length),
   nativeXp:sum(group,t=>t.xpEarned),
   firstFightHpLostMeanPct:mean(group.map(t=>(t.rooms||[])[0]).filter(r=>r&&r.hpMax>0).map(r=>100*(r.hpStart-r.hpEnd)/r.hpMax)),
   manaFights:mana.length,casterFights:caster.length,
   manaSpent:sum(mana,r=>r.manaSpent),fundedCasts:sum(mana,r=>r.fundedCasts),
   infusionActivations:sum(mana,r=>r.infusionActivations),infusionHits:sum(mana,r=>r.infusionHits),
   infusionDamage:sum(mana,r=>r.infusionDamage),
   lowManaFallbackAttacks:sum(mana,r=>r.unfundedCasterAttacks),
   manaEndingZero:count(mana,r=>r.mpEnd===0),manaEndingBelow25Pct:count(mana,r=>r.mpMax>0&&r.mpEnd/r.mpMax<.25),
   meanMpAtEndPct:mean(mana.map(r=>100*r.mpEnd/r.mpMax)),
   observed:reached.length?'observed':'not_reached'
  };
 });
 const names=unique(accounts.map(a=>a.profile)).sort();
 const profiles=names.map(profile=>{
  const aa=accounts.filter(a=>a.profile===profile),all=aa.flatMap(a=>a.attempts),
   room=all.flatMap(a=>a.rooms||[]),mana=room.filter(r=>r.mpMax>0);
  const clears=Array.from({length:10},(_,i)=>count(aa,a=>a.attempts.some(t=>t.level===i+1&&t.bossWon)));
  const weapons={};
  for(const attempt of all){
   const weapon=attempt.before?.gear?.items?.find(item=>item.slot==='weapon')?.subtype||'unarmed';
   weapons[weapon]=(weapons[weapon]||0)+1;
  }
  return {profile,accounts:aa.length,clears,highestExpeditionStarted:Math.max(1,...aa.flatMap(a=>a.reached)),
   attempts:all.length,meanAttempts:mean(aa.map(a=>a.attempts.length)),
   nativeErrors:count(all,t=>t.error||t.status==='error'),
   deaths:count(all,t=>t.status==='defeat'),extractions:count(all,t=>t.status==='extracted'),
   medianBestUnlocked:(()=>{const x=aa.map(a=>a.endLevel).sort((a,b)=>a-b);return x.length%2?x[(x.length-1)/2]:(x[x.length/2-1]+x[x.length/2])/2;})(),
   maxUnlocked:Math.max(...aa.map(a=>a.endLevel)),
   meanFinalTalents:mean(aa.map(a=>a.talents.length)),meanFinalStarterItems:mean(aa.map(a=>a.finalGear?.starter||0)),
   weaponUsageOnExpeditionEntry:weapons,
   arcane:{fights:mana.length,manaSpent:sum(mana,r=>r.manaSpent),
    casts:sum(mana,r=>r.fundedCasts),infusionActivations:sum(mana,r=>r.infusionActivations),
    infusionHits:sum(mana,r=>r.infusionHits),infusionDamage:sum(mana,r=>r.infusionDamage),
    noManaAttacks:sum(mana,r=>r.unfundedCasterAttacks),
    fightsEndingBelow25Pct:count(mana,r=>r.mpMax>0&&r.mpEnd/r.mpMax<.25)},
   accountOutcomes:aa.map(a=>({seed:a.seed,reached:a.reached,unlocked:a.endLevel,attempts:a.attempts.length,
    stop:a.stopReason,spentTalents:a.talents.length,finalStarter:a.finalGear?.starter||0}))};
 });
 const errors=attempts.filter(t=>t.error||t.status==='error').map(t=>({seed:t.accountSeed,profile:t.accountProfile,level:t.level,
  attempt:t.attempt,error:t.error||t.status,diagnostic:t.diagnostic||null}));
 const stops={};for(const a of accounts){const reason=a.stopReason||'completed';stops[reason]=(stops[reason]||0)+1;}
 const result={stage:'6.5',title:'Wanderer v0.13 natural E1-E10 account progression after Stage 6.4',
  source:srcs[0],runnerSha256:runnerSha[0],cohortReports:reports.length,
  settings:reports.map(r=>r.settings),integrity:reports.map(r=>r.integrity),
  accounts:accounts.length,uniqueSeeds:unique(accounts.map(a=>a.seed)).length,
  attempts:attempts.length,fights:fights.length,errors,stops,levels:stats,profiles,
  reachedE10:count(accounts,a=>a.reached.includes(10)),
  clearedE10:count(accounts,a=>a.attempts.some(t=>t.level===10&&t.bossWon)),
  limitations:[
   'Each account starts at E1 with native starter gear and zero talent points, and keeps earned loot, XP and gold across attempts.',
   'Only native Boss wins unlock subsequent Expeditions. Unreached E levels are CENSORED, not simulated defeats or zero win rates.',
   'Accounts are repeated deterministic policy variants over shared seeds, not independent players or measured human win rates.',
   'Two/three-digit repeat attempts per profile are not independent samples.',
   'Preferred Wand or Staff does not guarantee the desired weapon drops or is purchased: observed weapon usage is reported.',
   'A player may use better combat and routing choices; agent weaknesses must be assessed before balancing enemy stats.',
   'No gameplay stat, XP, gear or level was modified by the diagnostic.' ]};
 return result;
}
function markdown(r){
 const out=['# Wanderer v0.13 — Natural progression E1–E10 after Stage 6.4','',
 '## Integrity', 'Source: '+r.source+'. '+r.accounts+' native accounts, '+r.uniqueSeeds+' shared seeds, '+r.attempts+' attempts, '+r.fights+' fights. Errors: '+r.errors.length+'.',
 '', '| E | Accounts entered | Attempts | Native Boss wins | Deaths | Extractions | First fight HP lost | Mana encounters | Infusion casts | Caster fallback attacks |',
 '|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|',
 ...r.levels.map(x=>'| E'+x.level+' | '+x.accountsReached+' | '+x.attempts+' | '+x.clears+' | '+x.deaths+' | '+x.extractions+' | '+(x.firstFightHpLostMeanPct??'n/a')+'% | '+x.manaFights+' | '+x.infusionActivations+' | '+x.lowManaFallbackAttacks+' |'),
 '','## Profiles','',
 '| Profile | Accounts | E1 | E2 | E3 | E5 | E8 | E10 | Max unlock | Attempts | Mana spent | Infusion hits | Unfunded attacks |',
 '|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|',
 ...r.profiles.map(p=>'| '+p.profile+' | '+p.accounts+' | '+p.clears[0]+' | '+p.clears[1]+' | '+p.clears[2]+' | '+p.clears[4]+' | '+p.clears[7]+' | '+p.clears[9]+' | E'+p.maxUnlocked+' | '+p.attempts+' | '+p.magic.manaSpent+' | '+p.magic.infusionHits+' | '+p.magic.noManaAttacks+' |'),
 '','## Observed weapon choice by profile',...r.profiles.map(p=>'- '+p.profile+': '+JSON.stringify(p.weaponUsageOnExpeditionEntry)),
 '','## Important interpretation','- E10 reached: '+r.reachedE10+'/'+r.accounts+' accounts; E10 cleared: '+r.clearedE10+'/'+r.accounts+'.',
 ...r.limitations.map(x=>'- '+x),'',
 '## Native errors',...r.errors.map(x=>'- '+x.profile+' seed '+x.seed+' E'+x.level+' attempt '+x.attempt+': '+x.error)];
 return out.join('\n')+'\n';
}
function main(args=process.argv.slice(2)){
 const output=args[0],files=args.slice(1);
 if(!output||!files.length)throw Error('Usage: node stage65-e1-e10-report.cjs OUT.json IN1.json [IN2.json ...]');
 const reports=files.map(file=>JSON.parse(fs.readFileSync(file,'utf8'))),r=summarize(reports);
 fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(r,null,2)+'\n');
 fs.writeFileSync(output.replace(/\.json$/,'.md'),markdown(r));
 console.log('STAGE65_E1_E10='+JSON.stringify({accounts:r.accounts,seeds:r.uniqueSeeds,attempts:r.attempts,
  errors:r.errors.length,reachedE10:r.reachedE10,clearedE10:r.clearedE10,levels:r.levels.map(x=>({E:x.level,n:x.accountsReached,attempts:x.attempts,wins:x.clears,errors:x.errors,
   mana:x.manaSpent,infusionHits:x.infusionHits,fallbacks:x.lowManaFallbackAttacks})),
  profiles:r.profiles.map(x=>({profile:x.profile,E1:x.clears[0],E3:x.clears[2],E5:x.clears[4],E10:x.clears[9],max:x.maxUnlocked,attempts:x.attempts,noMana:x.magic.noManaAttacks}))}));
 if(r.errors.length)process.exitCode=2;return r;
}
if(require.main===module)main();
module.exports={summarize,markdown,main};
