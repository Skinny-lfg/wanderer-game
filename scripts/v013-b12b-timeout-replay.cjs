'use strict';
// Exact B1 profile/budget and historical seed index; no combat or economy overrides.
const fs=require('node:fs'),path=require('node:path');
const B=require(path.resolve(process.cwd(),'scripts/v013-b1-e10-rebaseline.cjs'));
const label=process.argv[2],output=process.argv[3],indices=process.argv.slice(4).map(Number);
const rows=indices.map(index=>{
 const a=B.naturalAccount('smart-radiance-pure',index);
 const timeouts=a.attempts.flatMap(t=>(t.rooms||[]).filter(r=>r.timedOut).map(r=>({level:t.level,attempt:t.attempt,room:r.room,kind:r.kind,seconds:r.seconds,updateCalls:r.updateCalls,stats:r.stats,weapon:r.actualWeapon,offhand:r.actualOffhand,damageDealt:r.damageDealt,damageTaken:r.damageTaken,hpEnd:r.hpEnd,peakLiveEnemies:r.peakLiveEnemies,healthLost:r.observedHealthLostByRole,barrierLost:r.observedBarrierLostByRole,diagnostic:r.timeoutDiagnostic??null})));
 return {index,seed:a.seed,endLevel:a.endLevel,stopReason:a.stopReason,reachedE10:a.reachedE10,clearedE10:a.clearedE10,attempts:a.attempts.length,errors:a.attempts.filter(t=>t.error).map(t=>({level:t.level,attempt:t.attempt,error:t.error})),timeouts};
});
fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify({label,rows},null,2));
console.log('B12B_REPLAY='+JSON.stringify({label,rows}));
