'use strict';
// Read-only Stage 6 diagnostic on native natural-account output.
// No fabricated XP, gear, unlocks, or changes to combat coefficients.
const fs=require('node:fs');
const path=require('node:path');
const input=process.argv[2], output=process.argv[3];
if(!input||!output)throw Error('Usage: node scripts/v013-stage6-diagnostics.cjs raw.json summary.json');
const data=JSON.parse(fs.readFileSync(input,'utf8'));
const accounts=data.accounts||[];
if(!accounts.length)throw Error('Empty natural account cohort');
const sum=(xs,fn)=>xs.reduce((n,x)=>n+fn(x),0);
const round=(x)=>Number.isFinite(x)?Math.round(x*100)/100:null;
const mean=(xs)=>xs.length?round(sum(xs,x=>x)/xs.length):null;
const median=(xs)=>{
 if(!xs.length)return null;
 const a=[...xs].sort((x,y)=>x-y),m=Math.floor(a.length/2);
 return round(a.length%2?a[m]:(a[m-1]+a[m])/2);
};
const group=xs=>Object.fromEntries([...new Set(xs)].sort().map(k=>[k,xs.filter(x=>x===k).length]));
const attemptRows=accounts.flatMap(a=>(a.attempts||[]).map(t=>({...t,accountSeed:a.seed,accountProfile:a.profile})));
function stats(level, rows){
 const as=rows.filter(t=>t.level===level);
 const entering=new Set(as.map(x=>x.accountProfile+'/'+x.accountSeed));
 const fights=as.flatMap(t=>t.rooms||[]);
 const first=as.map(t=>(t.rooms||[])[0]).filter(r=>r&&r.hpMax>0);
 const losses=first.map(r=>100*(r.hpStart-r.hpEnd)/r.hpMax);
 const ended=as.filter(t=>t.status==='defeat');
 const deathRooms=ended.map(t=>(t.rooms||[]).findLast(r=>r.died)).filter(Boolean);
 const boss=as.filter(t=>t.bossReached);
 const bossRooms=fights.filter(r=>r.roomType==='boss');
 const extraction=as.flatMap(t=>(t.decisions||[]).filter(d=>d.type==='extract').map(d=>d.reason||'unspecified'));
 const oldStarter=as.map(a=>a.before?.gear?.starter).filter(Number.isFinite);
 const acquired=as.flatMap(t=>(t.rooms||[]).flatMap(r=>r.loot||[]));
 const prepBoss=boss.filter(t=>t.prepAtBoss?.markedElite||t.prepAtBoss?.reliquary);
 return {
  level,accountsEntered:entering.size,attempts:as.length,
  bossReached:boss.length,bossWins:as.filter(t=>t.bossWon).length,
  deaths:ended.length,extractions:as.filter(t=>t.status==='extracted').length,
  errors:as.filter(t=>t.error||t.status==='error').length,
  deathRoomTypes:group(deathRooms.map(r=>r.roomType||'unknown')),
  extractionReasons:group(extraction),
  firstFight:{observations:first.length,meanHpLossPct:mean(losses),
   medianHpLossPct:median(losses),meanDurationSeconds:mean(first.map(r=>r.seconds).filter(Number.isFinite)),
   meanIncomingDamage:mean(first.map(r=>r.damageTaken).filter(Number.isFinite))},
  boss:{fights:bossRooms.length,wins:bossRooms.filter(r=>r.won).length,
   enteredWithPreparation:prepBoss.length},
  encounters:Object.fromEntries(['combat','elite','boss'].map(type=>{
    const rr=fights.filter(r=>r.roomType===type);
    return [type,{fights:rr.length,wins:rr.filter(r=>r.won).length,
     deaths:rr.filter(r=>r.died).length,
     meanSeconds:mean(rr.map(r=>r.seconds).filter(Number.isFinite)),
     meanEnemyCasts:mean(rr.map(r=>r.enemyAbilityCasts).filter(Number.isFinite))}];
  })),
  loot:{total:acquired.length,grey:acquired.filter(x=>x.rarity==='Common').length,
   starterPiecesAtEntryMean:mean(oldStarter),
   firstFightNoDrop:first.filter(r=>r.won&&!(r.loot||[]).length).length,
   gearChanges:sum(as,t=>(t.equipped||[]).length+(t.camp?.equipped||[]).length)},
  economy:{xpEarned:sum(as,t=>t.xpEarned||0),
   forged:sum(as,t=>(t.camp?.crafted||[]).length),
   merchantBought:sum(as,t=>(t.camp?.bought||[]).length),
   potionUses:sum(as,t=>(t.potions||[]).length),
   talentResets:sum(as,t=>(t.camp?.resets||[]).length),
   talentsSpentMean:mean(as.map(t=>t.before?.spent).filter(Number.isFinite))}
 };
}
const profileNames=[...new Set(accounts.map(a=>a.profile))].sort();
const profiles=Object.fromEntries(profileNames.map(p=>{
 const aa=accounts.filter(a=>a.profile===p);
 return [p,{accounts:aa.length,enteredE2:aa.filter(a=>a.reached?.includes(2)).length,
  clearedE1:aa.filter(a=>a.attempts.some(t=>t.level===1&&t.bossWon)).length,
  clearedE2:aa.filter(a=>a.attempts.some(t=>t.level===2&&t.bossWon)).length,
  enteredE3:aa.filter(a=>a.reached?.includes(3)).length,
  totalAttempts:sum(aa,a=>a.attempts.length),
  attemptsToClearE1:aa.map(a=>a.attempts.findIndex(t=>t.level===1&&t.bossWon)+1).filter(x=>x>0),
  stops:group(aa.map(a=>a.stopReason||'completed_through_E3'))}];
}));
const summary={
 stage:'Stage 6 diagnostic: E1/E2 natural progression',
 testedSourceFingerprint:data.source||null,runnerSha256:data.runnerSha256||null,
 settings:data.settings, distinctSeeds:new Set(accounts.map(a=>a.seed)).size,
 accounts:accounts.length, attempts:attemptRows.length,
 errors:attemptRows.filter(x=>x.error||x.status==='error').length,
 nativeIntegrity:data.integrity,levels:[stats(1,attemptRows),stats(2,attemptRows),stats(3,attemptRows)],
 profiles,limitations:[
  'Small pilot, limited seeds; observations from scripted agents are not human win rates.',
  'Only native Boss wins unlock E2/E3; censored accounts do not count as permanent losses.',
  'Difficulty, route choice, gear acquisition and agent policy are intertwined observationally.',
  'E3 metrics are for unlock and entry only; this campaign does not measure E5/E10.',
  'No gameplay coefficients or resources are changed by this diagnostics script.'
 ]};
for(const a of accounts){
 for(const t of a.attempts||[]){
  if(t.level>1&&!a.attempts.some(x=>x.level===t.level-1&&x.bossWon))
   throw Error('Non-native level unlock '+a.profile+' '+a.seed+' E'+t.level);
 }
}
fs.mkdirSync(path.dirname(output),{recursive:true});
fs.writeFileSync(output,JSON.stringify(summary,null,2)+'\n');
const md=['# Stage 6 — E1/E2 native progression pilot','',
 'Source: '+(data.source||'unknown')+'; '+summary.distinctSeeds+' independent seeds; '+summary.accounts+' scripted accounts; '+summary.attempts+' attempts; '+summary.errors+' native errors.','',
 '| E | Accounts entered | Attempts | Boss reached | Boss won | Deaths | Extractions | First-fight HP loss mean |',
 '|---|---:|---:|---:|---:|---:|---:|---:|'];
for(const s of summary.levels)md.push('| E'+s.level+' | '+s.accountsEntered+' | '+s.attempts+
 ' | '+s.bossReached+' | '+s.bossWins+' | '+s.deaths+' | '+s.extractions+
 ' | '+(s.firstFight.meanHpLossPct??'n/a')+'% |');
md.push('','## Archetype progression','',
 '| Profile | Accounts | E1 cleared | E2 cleared | E3 entered | Attempts |',
 '|---|---:|---:|---:|---:|---:|');
for(const [p,s] of Object.entries(profiles))
 md.push('| '+p+' | '+s.accounts+' | '+s.clearedE1+' | '+s.clearedE2+' | '+s.enteredE3+' | '+s.totalAttempts+' |');
md.push('','## What the diagnostic records','',
 'Each E includes encounter type (normal/elite/boss), death room, first-fight attrition, duration, enemy ability casts, loot, starter retention, gear changes, Forge/Merchant spending, potion usage, talent resets, Boss preparation and extraction reasons. Full trajectories are in the raw JSON artifact.','',
 '## Limitations','',...summary.limitations.map(x=>'- '+x),'');
fs.writeFileSync(output.replace(/\.json$/,'.md'),md.join('\n'));
console.log('STAGE6_SUMMARY='+JSON.stringify({seeds:summary.distinctSeeds,accounts:summary.accounts,attempts:summary.attempts,errors:summary.errors,
 E1:summary.levels[0],E2:summary.levels[1],profiles:summary.profiles}));
if(summary.errors)process.exitCode=1;