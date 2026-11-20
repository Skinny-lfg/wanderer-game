'use strict';
/* Diagnose the adaptive Duelist regression by changing exactly one agent decision
 * component at a time. All comparisons use genuine native account actions; after
 * policies diverge, their future gear/RNG need not remain identical. */
const fs=require('node:fs'),path=require('node:path');
const N=require('./v013-natural-progression.cjs');
const opts=N.parseArgs(process.argv.slice(2));
const models=['risk-aware','adaptive-realms','adaptive-rooms','adaptive-targets','adaptive-retreat','adaptive'];
const summaries=[];
for(const model of models){
 const result=N.run(opts,{decisionModel:model});
 const accounts=result.accounts;
 const attempts=accounts.flatMap(a=>a.attempts);
 const rooms=attempts.flatMap(a=>a.rooms||[]);
 const perAccount=accounts.map(a=>{
  const aa=a.attempts;
  const e1=aa.filter(t=>t.level===1),e2=aa.filter(t=>t.level===2);
  return {seed:a.seed,profile:a.profile,unlocked:a.endLevel,
   E1:{attempts:e1.length,bossWon:e1.some(t=>t.bossWon),bossReached:e1.filter(t=>t.bossReached).length},
   E2:{attempts:e2.length,bossWon:e2.some(t=>t.bossWon),bossReached:e2.filter(t=>t.bossReached).length},
   firstRealms:aa.slice(0,4).map(t=>({level:t.level,realm:t.realm,affinity:t.affinity,risk:t.risk})),
   deaths:aa.filter(t=>t.status==='defeat').length,extractions:aa.filter(t=>t.status==='extracted').length,
   errors:aa.filter(t=>t.error||t.status==='error').map(t=>t.error),
   nativeXp:a.xp};
 });
 const count=xs=>Object.fromEntries([...new Set(xs)].sort().map(k=>[k,xs.filter(x=>x===k).length]));
 const summary={model,accounts:accounts.length,attempts:attempts.length,
  E1:perAccount.filter(x=>x.E1.bossWon).length,
  E2:perAccount.filter(x=>x.E2.bossWon).length,
  enteredE2:perAccount.filter(x=>x.E2.attempts).length,
  errors:result.coverage.errors,
  combats:rooms.length,
  targetSwitches:rooms.reduce((n,x)=>n+x.targetSwitches,0),
  deaths:attempts.filter(x=>x.status==='defeat').length,
  extractions:attempts.filter(x=>x.status==='extracted').length,
  groupFights:count(rooms.filter(x=>x.roomType==='combat').map(x=>x.initialEnemies<=1?'solo':x.initialEnemies<=4?'2-4':x.initialEnemies<=12?'5-12':'13+')),
  realizedRoles:count(rooms.map(x=>x.capabilities?.role||'unknown')),
  perAccount};
 summaries.push(summary);
 console.log('POLICY_ABLATION='+JSON.stringify({model,accounts:summary.accounts,attempts:summary.attempts,
  E1:summary.E1,E2:summary.E2,enteredE2:summary.enteredE2,errors:summary.errors,
  targetSwitches:summary.targetSwitches,groupFights:summary.groupFights,
  perAccount:perAccount.map(x=>({seed:x.seed,profile:x.profile,E1:x.E1,E2:x.E2}))}));
}
const report={source:'real native progression, decisions alone differ',settings:opts,
 caveat:'Identical first seed, but divergent native paths, loot, talents and future RNG after policy differences; not a perfectly controlled trial.',summaries};
const dest=path.resolve(opts.output);
fs.mkdirSync(path.dirname(dest),{recursive:true});
fs.writeFileSync(dest,JSON.stringify(report,null,2)+'\n');
const md=['# Stage 6 — Agent policy ablation','',
 'Original baseline compared with changing only Realm, room, targeting or retreat decisions, then all adaptations.','',
 '| Policy | E1 clears | E2 clears | Accounts entering E2 | Attempts | Switches | Errors |',
 '|---|---:|---:|---:|---:|---:|---:|',
 ...summaries.map(s=>'| '+s.model+' | '+s.E1+' | '+s.E2+' | '+s.enteredE2+' | '+s.attempts+' | '+s.targetSwitches+' | '+s.errors+' |'),
 '',report.caveat,'','## Per-account outcomes'];
for(const s of summaries){
 md.push('','### '+s.model);
 for(const a of s.perAccount)md.push('- '+a.profile+' / '+a.seed+' E1 '+a.E1.attempts+' attempts '+(a.E1.bossWon?'won':'not won')+
  ' / E2 '+a.E2.attempts+' attempts '+(a.E2.bossWon?'won':'not won')+'; encounters '+a.firstRealms.map(x=>x.affinity).join(', '));
}
fs.writeFileSync(dest.replace(/\.json$/,'.md'),md.join('\n')+'\n');
if(summaries.some(s=>s.errors))process.exitCode=1;
