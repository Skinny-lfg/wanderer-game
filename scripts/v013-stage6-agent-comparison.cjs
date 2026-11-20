'use strict';
// Descriptive paired-seed native accounts. Paths and future RNG legitimately
// diverge when the two policies make different choices.
const fs=require('node:fs'),path=require('node:path');
const N=require('./v013-natural-progression.cjs');
const opts=N.parseArgs(process.argv.slice(2));
const round=n=>Math.round(n*100)/100;
const sum=(xs,f)=>xs.reduce((n,x)=>n+(f(x)||0),0);
const group=xs=>Object.fromEntries([...new Set(xs)].sort().map(k=>[k,xs.filter(v=>v===k).length]));
function summary(out){
 const accounts=out.accounts,attempts=accounts.flatMap(a=>a.attempts),rooms=attempts.flatMap(t=>t.rooms||[]);
 const encounters=(xs,key)=>Object.fromEntries([...new Set(xs.map(r=>r[key]||'unidentified'))].sort().map(k=>{
  const m=xs.filter(r=>(r[key]||'unidentified')===k);
  return [k,{fights:m.length,wins:m.filter(r=>r.won).length,deaths:m.filter(r=>r.died).length}];
 }));
 const actualRoles=Object.fromEntries([...new Set(rooms.map(r=>r.capabilities?.role||'unobserved'))].sort().map(k=>{
  const m=rooms.filter(r=>(r.capabilities?.role||'unobserved')===k);
  return [k,{fights:m.length,wins:m.filter(r=>r.won).length,groupFights:m.filter(r=>r.initialEnemies>1).length,
   observedNonfocusedNetHpLoss:round(sum(m,r=>r.observedNonFocusedHealthLost))}];
 }));
 return {accounts:accounts.length,attempts:attempts.length,errors:out.coverage.errors,
  E1:{entered:accounts.filter(a=>a.reached.includes(1)).length,cleared:attempts.filter(t=>t.level===1&&t.bossWon).length},
  E2:{entered:accounts.filter(a=>a.reached.includes(2)).length,cleared:attempts.filter(t=>t.level===2&&t.bossWon).length},
  wins:rooms.filter(r=>r.won).length,extractions:attempts.filter(t=>t.status==='extracted').length,
  deaths:attempts.filter(t=>t.status==='defeat').length,
  observedNonfocusedNetHpLoss:round(sum(rooms,r=>r.observedNonFocusedHealthLost)),
  groups:group(rooms.filter(r=>r.roomType==='combat').map(r=>r.initialEnemies===1?'solo':r.initialEnemies<=4?'2-4':r.initialEnemies<=12?'5-12':'13+')),
  actualRoles,
  affinityComposition:Object.fromEntries([...new Set(rooms.map(r=>r.capabilities?.affinityComposition||'unobserved'))].sort().map(k=>{
   const selected=rooms.filter(r=>(r.capabilities?.affinityComposition||'unobserved')===k);
   return [k,{fights:selected.length,wins:selected.filter(r=>r.won).length,
    damageModes:Object.fromEntries([...new Set(selected.map(r=>r.capabilities?.role||'unknown'))].sort().map(role=>
     [role,selected.filter(r=>r.capabilities?.role===role).length])),
    synergyStages:Object.fromEntries([...new Set(selected.map(r=>r.capabilities?.synergyStage||'unknown'))].sort().map(stage=>
     [stage,selected.filter(r=>r.capabilities?.synergyStage===stage).length]))}];
  })),
  byBossStyle:encounters(rooms.filter(r=>r.roomType==='boss'),'bossStyle'),
  byEliteType:encounters(rooms.filter(r=>r.roomType==='elite'),'eliteType'),
  byBossModifier:Object.fromEntries([...new Set(rooms.filter(r=>r.roomType==='boss')
   .flatMap(r=>r.bossModifiers||[]))].sort().map(id=>{
   const all=rooms.filter(r=>r.roomType==='boss'&&(r.bossModifiers||[]).includes(id));
   return [id,{fights:all.length,wins:all.filter(r=>r.won).length,deaths:all.filter(r=>r.died).length}];
  })),
  roleVsBoss:Object.fromEntries([...new Set(rooms.filter(r=>r.roomType==='boss')
   .map(r=>(r.capabilities?.role||'unknown')+'/'+(r.bossStyle||'unknown')))].sort().map(key=>{
   const all=rooms.filter(r=>r.roomType==='boss'&&
    (r.capabilities?.role||'unknown')+'/'+(r.bossStyle||'unknown')===key);
   return [key,{fights:all.length,wins:all.filter(r=>r.won).length,deaths:all.filter(r=>r.died).length}];
  })),
  chosenAffinities:group(attempts.map(t=>t.affinity).filter(Boolean)),
  nativeXpEarned:sum(attempts,t=>t.xpEarned),moves:sum(attempts,t=>(t.decisions||[]).filter(d=>d.type==='move').length),
  perProfile:Object.fromEntries(opts.profiles.map(id=>{
   const aa=accounts.filter(a=>a.profile===id);
   return [id,{accounts:aa.length,clearedE1:aa.filter(a=>a.attempts.some(t=>t.level===1&&t.bossWon)).length,
    clearedE2:aa.filter(a=>a.attempts.some(t=>t.level===2&&t.bossWon)).length,attempts:sum(aa,a=>a.attempts.length)}];
  }))
 };
}
const source=opts.output;
const baseline=N.run(opts,{decisionModel:'risk-aware'}),adaptive=N.run(opts,{decisionModel:'adaptive'});
for(const [name,out]of [['baseline',baseline],['adaptive',adaptive]])
 for(const a of out.accounts)for(const t of a.attempts)
  if(t.level>1&&!a.attempts.some(x=>x.level===t.level-1&&x.bossWon))
   throw Error(name+' skipped genuine level unlock');
const comparison={
 source:adaptive.source,settings:opts,pairedInitialSeeds:true,
 note:'Policies begin with the same account seeds. Native paths and RNG diverge as choices diverge, so this is NOT a controlled fight A/B test or a human win rate.',
 baseline:summary(baseline),adaptive:summary(adaptive)
};
const dest=path.resolve(source);
fs.mkdirSync(path.dirname(dest),{recursive:true});
fs.writeFileSync(dest,JSON.stringify(comparison,null,2)+'\n');
const rows=[['Accounts','accounts'],['Attempts','attempts'],['Errors','errors'],['Reached E2','E2.entered'],
 ['Cleared E1','E1.cleared'],['Cleared E2','E2.cleared'],['XP earned','nativeXpEarned'],
 ['Moves','moves'],['Nonfocused net HP loss','observedNonfocusedNetHpLoss']];
const read=(obj,key)=>key.split('.').reduce((v,k)=>v[k],obj);
const md=['# Stage 6 — Native adaptive agent vs original risk-aware policy','',
 'Paired initial seeds and native account starts; future RNG and map paths may diverge. Not a human or controlled fight comparison.',
 '','| Metric | Original | Adaptive |','|---|---:|---:|',
 ...rows.map(([label,key])=>'| '+label+' | '+read(comparison.baseline,key)+' | '+read(comparison.adaptive,key)+' |'),
 '','Further data: JSON by Boss style, individual Boss modifier, role-versus-Boss matchup, Elite subtype, live build role, independent affinity composition/synergy stage, and group-size selection.',
 '','Observational net HP loss on nonfocused enemies includes DoTs and secondary damage; heals and removed mobs may undercount it.',
 '','No gear, XP, damage or unlock is injected. Errors are never counted as deaths.',''];
fs.writeFileSync(dest.replace(/\.json$/,'.md'),md.join('\n'));
console.log('STAGE6_AGENT_COMPARE='+JSON.stringify({
 baseline:{attempts:comparison.baseline.attempts,errors:comparison.baseline.errors,E1:comparison.baseline.E1,E2:comparison.baseline.E2,groups:comparison.baseline.groups,roles:comparison.baseline.actualRoles},
 adaptive:{attempts:comparison.adaptive.attempts,errors:comparison.adaptive.errors,E1:comparison.adaptive.E1,E2:comparison.adaptive.E2,groups:comparison.adaptive.groups,roles:comparison.adaptive.actualRoles}
}));
if(comparison.baseline.errors||comparison.adaptive.errors)process.exitCode=1;
