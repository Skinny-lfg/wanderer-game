'use strict';
// Preserve the original baseline. Reproduce the one censored account exactly,
// then extend only its technical observation limit; no new gameplay rules.
const fs=require('node:fs'),zlib=require('node:zlib'),assert=require('node:assert/strict');
const D=require('./v013-b12d-clean-natural-rebaseline.cjs'),S=require('./simulate-progression.cjs'),Balance=require('./v013-balance-criteria.cjs');
const id='smart-radiance-pure',index=99,seed=98210000,originalCommit='8941150e278f5f12676358cedbeb2a21f92941d7',out='reports/b12d-recovery';
const sum=(a,f)=>a.reduce((n,x)=>n+f(x),0),keys=['normal','elite','boss'];
const original=JSON.parse(fs.readFileSync('baseline/summary.json','utf8')),batch=JSON.parse(zlib.gunzipSync(fs.readFileSync('raw/batch-19.json.gz')));
assert.equal(original.fingerprint.commit,originalCommit);assert.deepEqual(batch.fingerprint,original.fingerprint);
assert.equal(S.sourceFingerprint().sha256,original.fingerprint.native);assert.equal(original.coverage.accounts,2800);assert.equal(original.coverage.naturalErrors,1);assert.equal(original.coverage.timeouts,1);assert.equal(original.coverage.issues,0);
const old=batch.accounts.find(a=>a.id===id&&a.index===index);assert(old);assert.equal(old.seed,seed);
const originalRecord=original.accounts.find(a=>a.id===id&&a.seed===seed);
assert.deepEqual(D.accountRecord(old),originalRecord);
const errors=old.attempts.filter(t=>t.error);assert.equal(errors.length,1);assert.equal(errors[0].error,'Native combat timeout');assert.equal(errors[0].level,6);assert.equal(errors[0].attempt,1);
const oldRoom=errors[0].rooms.find(r=>r.timedOut);assert(oldRoom);assert.equal(oldRoom.timeoutDiagnostic.trace.at(-1).active[0].name,'Breakwater Sentinel');
const oldReplayed=D.account(id,index);
assert.deepEqual(oldReplayed,old,'original 6500-tick trajectory failed exact replay');
const extended=D.account(id,index,{...D.CONFIG,tickLimit:13000});
assert.deepEqual(extended.attempts.slice(0,old.attempts.length-1),old.attempts.slice(0,-1),'trajectory before censored attempt changed');
const t=extended.attempts[old.attempts.length-1];assert.equal(t.level,6);assert.equal(t.attempt,1);
assert.deepEqual(t.camp,errors[0].camp,'Camp decisions before censored fight changed');
const recovered=t.rooms.find(r=>r.room===oldRoom.room&&r.roomType===oldRoom.roomType);
assert(recovered,'original encounter missing');assert.deepEqual(recovered.stats,oldRoom.stats);assert.equal(recovered.hpStart,oldRoom.hpStart);assert.equal(recovered.initialEnemies,oldRoom.initialEnemies);
const newRecord=D.accountRecord(extended),records=original.accounts.map(a=>a===originalRecord?newRecord:a);
const clean=!newRecord.errors.length&&!newRecord.issues.length&&!newRecord.timeouts;
const coverage={...original.coverage,reachedE10:records.filter(a=>a.reachedE10).length,enteredE10:records.filter(a=>a.enteredE10).length,clearedE10:records.filter(a=>a.clearedE10).length,accountsWithErrors:records.filter(a=>a.errors.length).length,naturalErrors:sum(records,a=>a.errors.length),issues:sum(records,a=>a.issues.length),timeouts:sum(records,a=>a.timeouts),surrenders:sum(records,a=>a.surrenders)};
const metrics=Object.fromEntries(keys.map(k=>{
 const c=Object.fromEntries(Object.keys(D.counts([])).map(field=>[field,sum(records,a=>a.e10[k][field])]));
 const v=D.outcomes(c);
 return [k,{...v,contributingAccounts:records.filter(a=>a.e10[k].resolved>0).length,clusterCI95:D.clusterCI(records,a=>a.e10[k]),balance:Balance.classify(k,v.winPct,v.resolved)}];
}));
const report={originalRun:45912095509,originalCommit,recoveryCommit:process.env.GITHUB_SHA||null,profile:id,index,seed,originalTickLimit:D.CONFIG.tickLimit,extendedTickLimit:13000,exactReplay:true,priorAttemptsMatch:true,originalRecord,newRecord,originalEncounter:{seconds:oldRoom.seconds,enemy:oldRoom.timeoutDiagnostic.trace.at(-1).active[0],player:oldRoom.timeoutDiagnostic.trace.at(-1).player},recoveredEncounter:{seconds:recovered.seconds,won:recovered.won,died:recovered.died,surrendered:recovered.surrendered,timedOut:recovered.timedOut},clean,originalCoverage:original.coverage,recoverySensitivityCoverage:coverage,originalE10:original.naturalBalance,recoverySensitivityE10:metrics,scope:'Single-account extended observation sensitivity only; original fixed-cap baseline is immutable. No mixed-budget claim of exact homogeneous baseline. Review before approval.'};
fs.mkdirSync(out,{recursive:true});fs.writeFileSync(out+'/recovery.json',JSON.stringify(report,null,2));fs.writeFileSync(out+'/account-extended.json.gz',zlib.gzipSync(JSON.stringify(extended)));
console.log('B12D_RECOVERY='+JSON.stringify({seed,id,exactReplay:true,priorAttemptsMatch:true,clean,originalEncounter:report.originalEncounter,recoveredEncounter:report.recoveredEncounter,originalEndLevel:old.endLevel,extendedEndLevel:extended.endLevel,errors:newRecord.errors.map(e=>({level:e.level,attempt:e.attempt,error:e.error})),issues:newRecord.issues,coverage,metrics}));
if(!clean)process.exitCode=1;
