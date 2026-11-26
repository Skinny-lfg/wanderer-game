'use strict';
const fs=require('node:fs'),path=require('node:path');
const {VARIANTS}=require('./v013-stage69-earned-paired.cjs');
const NAMES=Object.keys(VARIANTS),LEVELS=[5,8,10],SEEDS=[9701,9702,9703,9704];
const sum=(a,f)=>a.reduce((n,x)=>n+(Number(f(x))||0),0);
const avg=a=>a.length?+(sum(a,x=>x)/a.length).toFixed(2):null;
function aggregate(shards){
 if(shards.length!==12)throw Error('Must receive 12 independently reproduced E5/E8/E10 seed shards');
 const source=new Set(shards.map(s=>s.gameSourceSha256));
 if(source.size!==1)throw Error('Mixed native source revisions');
 const seen=new Map();
 for(const entry of shards){
  const r=entry.result;
  if(!r||!SEEDS.includes(r.seed)||!LEVELS.includes(r.level))
   throw Error('Invalid/missing real earned checkpoint');
  const id=r.level+':'+r.seed;
  if(seen.has(id))throw Error('Duplicate native seed/Expedition '+id);
  seen.set(id,r);
  if(!r.matchedEarlyProgression||!r.matchedEarnedGear||!r.matchedEarnedXp)
   throw Error('Unmatched earned account or item state at '+id);
  if(JSON.stringify(Object.keys(r.variants))!==JSON.stringify(NAMES))throw Error('Missing native talent variant '+id);
  const baseline=r.nativeEncounterComparison.find(x=>x.variant==='baseline');
  if(!baseline)throw Error('No baseline at '+id);
  for(const item of r.nativeEncounterComparison){
   if(item.variant!=='baseline'&&item.sameFirstEncounter&&
      JSON.stringify(item.inputSignature)!==JSON.stringify(baseline.inputSignature))
    throw Error('Incorrect encounter signature classification '+id+'/'+item.variant);
   if(item.spent>r.earnedPoints)throw Error('Invented Talent points '+id);
   if(!r.variants[item.variant].actual.actualGearSha||
      r.variants[item.variant].actual.actualGearSha!==r.variants.baseline.actual.actualGearSha)
    throw Error('Modified equipped gear in paired talent test '+id);
   if(r.variants[item.variant].beforeXp!==r.earnedXp)throw Error('Changed earned XP at '+id);
  }
 }
 for(const E of LEVELS)for(const seed of SEEDS)if(!seen.has(E+':'+seed))
  throw Error('Missing native pair E'+E+' seed '+seed);
 const levels=LEVELS.map(E=>{
  const rows=SEEDS.map(seed=>seen.get(E+':'+seed)),variants=Object.fromEntries(NAMES.map(id=>{
   const vv=rows.map(r=>r.nativeEncounterComparison.find(x=>x.variant===id));
   const matched=vv.filter(v=>v.sameFirstEncounter&&v.first);
   const started=vv.filter(v=>v.first);
   return [id,{accounts:vv.length,
    identicalFirstEncounter:matched.length,firstFights:started.length,
    firstWins:matched.filter(v=>v.first.won).length,
    firstDeaths:matched.filter(v=>v.first.died).length,
    firstStalls:matched.filter(v=>v.first.timedOut).length,
    firstMeanHpLossPct:avg(matched.map(v=>v.first.hpLossPct)),
    firstMeanDamageTaken:avg(matched.map(v=>v.first.damageTaken)),
    firstMeanDps:avg(matched.filter(v=>v.first.seconds>0)
     .map(v=>v.first.damageDealt/v.first.seconds)),
    firstMeanDuration:avg(matched.map(v=>v.first.seconds)),
    bossEntries:vv.filter(v=>v.bossReached).length,
    bossWins:vv.filter(v=>v.bossWon).length,
    expeditionStatuses:Object.fromEntries(['victory','defeat','extracted'].map(status=>[
     status,vv.filter(v=>v.status===status).length])),
    meanSpent:avg(vv.map(v=>v.spent)),
    meanPotionUse:avg(vv.map(v=>v.potionsUsed)),
    meanRooms:avg(vv.map(v=>v.rooms))}];
  }));
  const firstSignatureCounts=Object.fromEntries(SEEDS.map(seed=>{
   const r=seen.get(E+':'+seed);
   return [seed,Object.fromEntries(r.nativeEncounterComparison.map(v=>[v.variant,v.sameFirstEncounter]))];
  }));
  return {level:E,pairs:rows.length,points:rows.map(x=>x.earnedPoints),
   realWeapons:rows.map(x=>x.realWeapon),variants,firstSignatureCounts};
 });
 return {stage:'6.9',purpose:'Native earned-account talent-only respec comparison',
  gameSourceSha256:[...source][0],seeds:SEEDS,levels,accounts:12,
  interventions:12*(NAMES.length-1),nativeAttempts:12*NAMES.length,sourcePolicy:'smart-blood-fury-radiance',
  matchedEquipment:true,matchedXp:true,matchedHistory:true,
  perSeed:Array.from(seen.values()),
  limitations:[
   'These 12 paired checkpoints are four shared account seeds at E5/E8/E10, not 12 independent population samples.',
   'All builds use the real original earned equipment of the Blood/Fury/Radiance account; this isolates talent selection but is NOT fair optimal gear for all archetypes.',
   'Each variant spends only actual earned Talent points via legal full Camp reset and node allocation. Reset reassigns skills without adding XP; gameplay forbids arbitrary out-of-Camp respec.',
   'Compare first-fight HP loss/DPS only where the first native encounter signature matches exactly; other fights or Boss encounters may differ due to route, RNG, Boons and tactical decisions.',
   'First-fight DPS is observed raw damage divided by combat seconds, not a fixed-target theoretical DPS benchmark.',
   'E8/E10 represent developed but NOT absolute max-point 100/100 characters. E1-E4 native failures censor weak builds.',
   'Observational Stage 6.8 Magic, Fury and weapon comparisons should not be mistaken for controlled equal-stat combat. Further equipment-stratified fixtures are needed.',
   'A forced Tower/Boss encounter, guaranteed items, synthetic character levels or gear creation is not part of this audit.',
   'No enemy HP/Attack/Defense, player stats, loot odds, talent graph, saved accounts, deploy, or main branch were changed.'
  ]};
}
function markdown(r){
 const lines=['# Wanderer v0.13 — Stage 6.9: Native earned-account build comparison','',
 '**Talent-only matched native comparison. No fabricated equipment, XP or Expedition access.**',
 '','Source policy: '+r.sourcePolicy+'. Four shared real account seeds in E5, E8 and E10.',
 'Each seed/Expedition first progresses naturally, including the real Camp, loot, equipment, resets and Boss unlocks. Five replays use exactly the same pre-intervention account state.',
 '','## Actual native Campaign checkpoint budget and weapons','',
 '| E | Real earned Talent budgets (4 seeds) | Actually equipped weapons |',
 '|---|---|---|',...r.levels.map(x=>'| E'+x.level+' | '+x.points.join(', ')+' | '+x.realWeapons.join(', ')+' |'),
 '','## Matched first native encounters and whole-Expedition observations','',
 'Values for first-fight DPS, damage and HP loss include only **identical first encounter signatures**. Whole-Expedition Boss wins are a separate observational comparison, not guaranteed matched Boss fixtures.',
 '','| E | Talent strategy | Matched first fights | First fight wins | Mean HP loss | Mean observed DPS | Mean duration | Boss reached | Boss won |',
 '|---|---|---:|---:|---:|---:|---:|---:|---:|',
 ...r.levels.flatMap(x=>Object.entries(x.variants).map(([id,v])=>
  '| E'+x.level+' | '+id+' | '+v.identicalFirstEncounter+'/'+v.accounts+
  ' | '+v.firstWins+'/'+v.identicalFirstEncounter+
  ' | '+(v.firstMeanHpLossPct??'n/a')+'% | '+(v.firstMeanDps??'n/a')+
  ' | '+(v.firstMeanDuration??'n/a')+'s | '+v.bossEntries+'/'+v.accounts+
  ' | '+v.bossWins+'/'+v.accounts+' |')),
 '','## Native encounter identity by seed (true means same first room/realm/risk/condition/count)','',
 ...r.levels.map(x=>'- E'+x.level+': '+Object.entries(x.firstSignatureCounts)
  .map(([seed,v])=>seed+' '+Object.entries(v).filter(([id])=>id!=='baseline')
   .map(([id,b])=>id+'='+b).join(', ')).join(' | ')),
 '','## Interpretation','',
 'The paired **initial earned account** is proven identical before talent reassignment. When an experimental build changes Realm or path selection, its Expedition result can still be observed, but **cannot be claimed as a like-for-like combat victory**. Use encounter-matched first fights to separate damage/survivability changes from policy/route changes.',
 '','## Limitations','',...r.limitations.map(x=>'- '+x),'',
 'The complete raw 60 native account runs and their matched digest checks are retained in the GitHub Actions artifacts.',''];
 return lines.join('\n')+'\n';
}
function main(args=process.argv.slice(2)){
 const [out,...files]=args;
 if(!out?.endsWith('.json')||files.length!==12)throw Error('Usage: node ... OUT.json 12_NATIVE_SHARD_JSON_FILES');
 const report=aggregate(files.map(f=>JSON.parse(fs.readFileSync(f,'utf8'))));
 fs.mkdirSync(path.dirname(out),{recursive:true});
 fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');
 fs.writeFileSync(out.replace(/\.json$/,'.md'),markdown(report));
 console.log('STAGE69_AGGREGATE='+JSON.stringify({accounts:report.accounts,
  pairs:report.interventions,levels:report.levels.map(x=>({E:x.level,points:x.points,
   comparisons:Object.fromEntries(Object.entries(x.variants).map(([k,v])=>
    [k,{matched:v.identicalFirstEncounter,firstHp:v.firstMeanHpLossPct,
     firstDps:v.firstMeanDps,bossWins:v.bossWins,bossReached:v.bossEntries}]))}))}));
 return report;
}
if(require.main===module)main();
module.exports={aggregate,markdown,main};
