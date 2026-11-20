'use strict';
// Stage 6.6: read-only native longitudinal diagnostic. No balance mutations.
// Input: the ORIGINAL six stage65-native-* account JSON files.
const fs=require('node:fs'),path=require('node:path');
require('../combat/expedition-progression.js');
require('../combat/v012-combat-core.js');
const E=globalThis.WandererExpeditionProgression,C=globalThis.WandererV012CombatCore;
const sum=(a,fn)=>a.reduce((n,v)=>n+(Number(fn(v))||0),0);
const avg=a=>a.length?+(a.reduce((n,v)=>n+v,0)/a.length).toFixed(2):null;
const percent=(n,d)=>d?+(100*n/d).toFixed(1):null;
const count=(a,fn)=>a.filter(fn).length;
const unique=a=>[...new Set(a)];
const total=(a,key)=>sum(a,r=>r[key]||0);
function summarize(reports,opts={}){
 if(!reports.length||reports.some(r=>!r.accounts?.length))throw Error('Original full native account traces required');
 const sources=unique(reports.map(r=>r.source)),runner=unique(reports.map(r=>r.runnerSha256));
 if(sources.length!==1||runner.length!==1)throw Error('Different Stage 6.5 runtime/agent revisions');
 const accounts=reports.flatMap(r=>r.accounts);
 if(opts.expectedAccounts!==undefined&&accounts.length!==opts.expectedAccounts)throw Error('Missing native accounts: '+accounts.length);
 const seen=new Set(),attempts=[],fights=[];
 for(const a of accounts){
  const key=a.seed+':'+a.profile;
  if(seen.has(key))throw Error('Duplicate native account '+key);
  seen.add(key);
  if(a.startXp!==0||a.initialGear?.starter!==a.initialGear?.total||!a.initialGear?.total)
   throw Error('Account did not start from native clean slate: '+key);
  for(const t of a.attempts||[]){
   if(t.error||t.status==='error')throw Error('Native attempt failed: '+key+' E'+t.level+' '+t.error);
   if(t.level>1&&!a.attempts.some(x=>x.level===t.level-1&&x.bossWon))
    throw Error('Non-native Expedition unlock: '+key+' E'+t.level);
   if(t.before?.earned<t.before?.spent)throw Error('Unpaid talent points: '+key);
   attempts.push({account:a,...t});
   for(const r of t.rooms||[])fights.push({account:a,attempt:t,...r});
  }
 }
 const sourceReference=Array.from({length:10},(_,i)=>{
  const level=i+1,reference=E.enemyReference(level),core=C.estimateEnemy(level,1);
  return {level,reference:+reference.toFixed(5),baseHp:+(27+14*reference).toFixed(2),
   baseAtk:+(4+3*reference).toFixed(2),normalStageOneHp:core.hp,normalStageOneAttack:core.atk,
   gearTier:E.gearTier(level).id};
 });
 const levels=sourceReference.map(({level})=>{
  const at=attempts.filter(t=>t.level===level),ff=fights.filter(f=>f.attempt.level===level);
  const bossEntries=at.filter(t=>t.bossReached);
  const first=at.map(t=>t.rooms?.[0]).filter(r=>r?.hpMax>0);
  const snap=at.map(t=>t.before).filter(Boolean);
  const byKind=Object.fromEntries(['combat','elite','boss'].map(kind=>{
   const a=ff.filter(f=>f.roomType===kind);
   return [kind,{fights:a.length,wins:count(a,x=>x.won),deaths:count(a,x=>x.died),
    deathPct:percent(count(a,x=>x.died),a.length),
    meanHpLostPct:avg(a.filter(x=>x.hpMax>0).map(x=>100*(x.hpStart-x.hpEnd)/x.hpMax)),
    meanDamageTaken:avg(a.map(x=>x.damageTaken)),meanSeconds:avg(a.map(x=>x.seconds))}];
  }));
  return {level,accountsEntered:unique(at.map(x=>x.account.seed+':'+x.account.profile)).length,
   attempts:at.length,bossClears:count(at,t=>t.bossWon),
   deaths:count(at,t=>t.status==='defeat'),extractions:count(at,t=>t.status==='extracted'),
   bossEntries:bossEntries.length,
   bossPrepared:count(bossEntries,t=>!!(t.prepAtBoss?.markedElite||t.prepAtBoss?.reliquary)),
   firstFightHpLossPct:avg(first.map(r=>100*(r.hpStart-r.hpEnd)/r.hpMax)),
   firstFightCount:first.length,
   meanTalentNodesAtEntry:avg(snap.map(x=>x.spent)),
   meanStarterGearAtEntry:avg(snap.map(x=>x.gear?.starter??0)),
   meanGearPiecesAtEntry:avg(snap.map(x=>x.gear?.total??0)),
   meanXpAtEntry:avg(snap.map(x=>x.xp)),
   encounters:byKind};
 });
 const e1First=accounts.map(a=>{
  const t=a.attempts.find(t=>t.level===1&&t.attempt===1);
  if(!t?.rooms?.[0]||!t.before)throw Error('Missing genuine fresh E1 fight: '+a.profile+'/'+a.seed);
  const r=t.rooms[0];
  return {seed:a.seed,profile:a.profile,hpLostPct:100*(r.hpStart-r.hpEnd)/r.hpMax,
   nodes:t.before.spent,starter:t.before.gear?.starter,weapon:t.before.gear?.items?.find(i=>i.slot==='weapon')?.subtype};
 });
 const freshProfiles=unique(e1First.map(r=>r.profile)).sort().map(p=>{
  const x=e1First.filter(r=>r.profile===p);
  return {profile:p,n:x.length,meanHpLostPct:avg(x.map(r=>r.hpLostPct)),
   zeroNodes:x.every(r=>r.nodes===0),starterWeapons:unique(x.map(r=>r.weapon))};
 });
 const freshBySeed=unique(e1First.map(r=>r.seed)).map(seed=>{
  const x=e1First.filter(r=>r.seed===seed);
  return {seed,n:x.length,uniqueHpLossPct:unique(x.map(r=>r.hpLostPct)).length};
 });
 const e1=attempts.filter(t=>t.level===1);
 const extractReasons={};
 for(const t of e1)for(const x of t.decisions||[])if(x.type==='extract')
  extractReasons[x.reason||'unknown']=(extractReasons[x.reason||'unknown']||0)+1;
 const bossFamily=[];
 for(let level=1;level<=10;level++)for(const family of ['aegis','blood','decay','fury','magic','vitality']){
  const a=fights.filter(f=>f.attempt.level===level&&f.roomType==='boss'&&f.attempt.affinity===family);
  bossFamily.push({level,family,fights:a.length,wins:count(a,x=>x.won),deaths:count(a,x=>x.died)});
 }
 const survivor=accounts.filter(a=>a.attempts.some(t=>t.level===10&&t.bossWon));
 const survivorStages=[1,3,5,6,7,10].map(level=>{
  const at=survivor.map(a=>a.attempts.find(t=>t.level===level)).filter(Boolean);
  const first=at.map(t=>t.rooms?.[0]).filter(r=>r?.hpMax);
  return {level,n:at.length,meanTalents:avg(at.map(t=>t.before.spent)),
   meanXp:avg(at.map(t=>t.before.xp)),meanStarterItems:avg(at.map(t=>t.before.gear.starter)),
   firstFightHpLostPct:avg(first.map(r=>100*(r.hpStart-r.hpEnd)/r.hpMax)),
   firstAttemptBossEntries:count(at,t=>t.bossReached),firstAttemptBossWins:count(at,t=>t.bossWon)};
 });
 const cohorts=[{id:'E1-E5',levels:[1,2,3,4,5]},{id:'E6-E10',levels:[6,7,8,9,10]},
  {id:'E7-E10',levels:[7,8,9,10]}].map(k=>{
  const ff=fights.filter(f=>k.levels.includes(f.attempt.level));
  return {id:k.id,encounters:Object.fromEntries(['combat','elite','boss'].map(kind=>{
   const f=ff.filter(x=>x.roomType===kind);
   return [kind,{n:f.length,wins:count(f,x=>x.won),deaths:count(f,x=>x.died),
    deathPct:percent(count(f,x=>x.died),f.length)}];
  }))};
 });
 const summaries={source:sources[0],runnerSha256:runner[0],inputs:reports.length,
  accounts:accounts.length,seeds:unique(accounts.map(a=>a.seed)),profiles:unique(accounts.map(a=>a.profile)),
  attempts:attempts.length,fights:fights.length,
  accountClearE1:count(accounts,a=>a.attempts.some(t=>t.level===1&&t.bossWon)),
  accountClearE10:survivor.length,
  sourceReference,levels,e1FirstAttempt:{byProfile:freshProfiles,bySeed:freshBySeed},
  e1ExtractReasons:extractReasons,bossFamily,survivorStages,cohorts,
  caveats:[
   'Encounter outcomes are repeated correlated fights, not independent randomized trials or human win rates.',
   'E6-E10 account cohort is survivor-selected. A matched survivor profile still gains legal gear/talents between levels.',
   'Boss preparation/HP correlations are observational and do not identify their causal combat effects.',
   'The native enemyReference curve affects raw enemy HP/Attack/Defense, but roles, group budgets, abilities, traits, risk and gear contribute independently.',
   'Normal combat rooms include Tanks and other roles. They are not a controlled Tank-vs-Elite benchmark.',
   'E1 first-attempt parity reflects identical starter gear and zero earned talents across the shared seeds; it does not imply later build parity.',
   'This read-only audit changes no gameplay coefficients, loot odds, talent costs, or combat mechanics.'
  ]};
 return summaries;
}
function markdown(r){
 const fmt=v=>v===null||v===undefined?'—':v;
 const out=['# Wanderer Stage 6.6 — Global Expedition difficulty audit (E1–E10)','',
 '**Read-only source diagnosis and actual native Stage 6.5 account traces. No balance changes.**','',
 'Source SHA-256: '+r.source+'. '+r.accounts+' native accounts across '+r.seeds.length+' shared seeds and '+r.profiles.length+' profiles; '+r.attempts+' attempts, '+r.fights+' real encounters.',
 '','## 1. Actual native enemy scaling',
 '','| E | Enemy reference | Raw HP | Raw Attack | Named gear tier |',
 '|---|---:|---:|---:|---|',
 ...r.sourceReference.map(x=>'| E'+x.level+' | '+x.reference+' | '+x.baseHp+' | '+x.baseAtk+' | '+x.gearTier+' |'),
 '', '**Verified mechanic:** E1–E5 enemy reference rises by 4.00 (1 → 5); E5–E10 rises by only '+(r.sourceReference[9].reference-r.sourceReference[4].reference).toFixed(2)+' (5 → '+r.sourceReference[9].reference+'). This source curve is a structural candidate for the observed late-game decline, not the only possible cause.',
 '','## 2. Native progression and encounter lethality','',
 '| E | Accounts entering | Attempts | Boss clears | Extractions | First fight HP loss | Normal deaths/fights | Elite deaths/fights | Boss deaths/fights | Nodes on entry |',
 '|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|',
 ...r.levels.map(x=>'| E'+x.level+' | '+x.accountsEntered+' | '+x.attempts+' | '+x.bossClears+
  ' | '+x.extractions+' | '+fmt(x.firstFightHpLossPct)+'% | '+
  x.encounters.combat.deaths+'/'+x.encounters.combat.fights+' | '+
  x.encounters.elite.deaths+'/'+x.encounters.elite.fights+' | '+
  x.encounters.boss.deaths+'/'+x.encounters.boss.fights+' | '+
  fmt(x.meanTalentNodesAtEntry)+' |'),
 '','## 3. Encounter hierarchy changes','',
 '| Natural cohort | Normal deaths/fights | Elite deaths/fights | Boss deaths/fights |',
 '|---|---:|---:|---:|',
 ...r.cohorts.map(x=>'| '+x.id+' | '+x.encounters.combat.deaths+'/'+x.encounters.combat.n+
  ' | '+x.encounters.elite.deaths+'/'+x.encounters.elite.n+
  ' | '+x.encounters.boss.deaths+'/'+x.encounters.boss.n+' |'),
 '', 'By E7–E10, no naturally selected ordinary or Elite fights caused deaths; Bosses still caused deaths. Do not equate this to numerical Tank/Elite parity: normal encounters include mixed roles and the agent selects which routes to take.',
 '','## 4. E1 is a system-wide starting difficulty, not a Magic-only issue','',
 'Fresh first attempt: each profile starts with zero talent nodes and native starter gear. Means across the four shared seeds:',
 '','| Profile | First E1 fight HP lost | Seed samples |', '|---|---:|---:|',
 ...r.e1FirstAttempt.byProfile.map(x=>'| '+x.profile+' | '+x.meanHpLostPct+'% | '+x.n+' |'),
 '','Across each given seed, the first-fight HP loss is equal across profiles in the traces: '+r.e1FirstAttempt.bySeed.every(x=>x.uniqueHpLossPct===1)+'.',
 'E1 extractions: '+r.levels[0].extractions+'; Boss entries: '+r.levels[0].bossEntries+'/'+r.levels[0].attempts+' attempts. E1 extraction reasons (logged native decisions): '+JSON.stringify(r.e1ExtractReasons)+'.',
 'A failed E1 campaign can reflect early attrition, legitimate loot preservation, repeated Camp investment or Boss failure; these cannot be collapsed into a single enemy HP coefficient.',
 '','## 5. Survivor-matched early versus late entry','',
 'The following subset contains the same '+r.accountClearE10+' eventual E10-winning accounts, but their talents and gear evolved legally:',
 '','| Level | Accounts | Nodes at entry | First fight HP loss | Boss wins on first attempt |',
 '|---|---:|---:|---:|---:|',
 ...r.survivorStages.map(x=>'| E'+x.level+' | '+x.n+' | '+x.meanTalents+' | '+x.firstFightHpLostPct+'% | '+x.firstAttemptBossWins+'/'+x.firstAttemptBossEntries+' |'),
 '','## 6. Diagnostic interpretation for Stage 6.7','',
 '1. **Priority A:** experimentally smooth the *global* enemy reference curve, preserving native Boss/Elite/normal roles. Contrast at least three deterministic reference variants against a frozen baseline with identical seeds and gear. Do not immediately increase all Boss HP or reduce all E1 damage.',
 '2. **Priority A:** independently audit first-room E1 survival and native Boss-entry HP; no investment in Magic talents exists in the first-ever encounter.',
 '3. **Priority B:** distinguish tactical extraction decisions from combat deaths. E1 Boss-reaching attempts are a minority; a Boss-only nerf may not fix the number of attempts required.',
 '4. **Priority B:** verify the Elite vs Tank hierarchy with matched native fixtures at E1/E5/E7/E10 rather than calling all ordinary mobs Tanks.',
 '5. **Priority C:** only after the Expedition curve is stable, measure fine-grained Magic, physical and hybrid build strength with more independent seeds.',
 '','## Limitations',...r.caveats.map(x=>'- '+x),'',
 '**No gameplay changes / merge / deploy were performed by Stage 6.6.**',''];
 return out.join('\n')+'\n';
}
function main(args=process.argv.slice(2)){
 const [out,...files]=args;
 if(!out?.endsWith('.json')||files.length!==6)throw Error('Usage: node scripts/v013-stage66-expedition-audit.cjs OUT.json SIX_STAGE65_NATIVE_JSON_FILES');
 const reports=files.map(f=>JSON.parse(fs.readFileSync(f,'utf8')));
 const r=summarize(reports,{expectedAccounts:48});
 fs.mkdirSync(path.dirname(out),{recursive:true});
 fs.writeFileSync(out,JSON.stringify(r,null,2)+'\n');
 fs.writeFileSync(out.replace(/\.json$/,'.md'),markdown(r));
 console.log('STAGE66_AUDIT='+JSON.stringify({accounts:r.accounts,attempts:r.attempts,fights:r.fights,
  e1FirstHpPct:r.e1FirstAttempt.byProfile[0].meanHpLostPct,
  identicalFreshE1PerSeed:r.e1FirstAttempt.bySeed.every(x=>x.uniqueHpLossPct===1),
  referenceE5:r.sourceReference[4].reference,referenceE10:r.sourceReference[9].reference,
  early:r.cohorts[0].encounters,late:r.cohorts[1].encounters,levels:r.levels.map(x=>({
   E:x.level,entered:x.accountsEntered,attempts:x.attempts,bossClears:x.bossClears,
   extracted:x.extractions,bossDeaths:x.encounters.boss.deaths,
   eliteDeaths:x.encounters.elite.deaths,normalDeaths:x.encounters.combat.deaths,
   firstHp:x.firstFightHpLossPct,nodes:x.meanTalentNodesAtEntry
  }))}));
 return r;
}
if(require.main===module)main();
module.exports={summarize,markdown,main};
