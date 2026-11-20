'use strict';
// Stage 01: single historical account, no synthetic gear, XP or unlocks.
// Baseline route settings match failed Stage 6 cohort B on 2026-11-20.
const fs=require('node:fs'),path=require('node:path');
const N=require('./v013-natural-progression.cjs');
const opts=N.parseArgs([
 '--seeds=9701','--profiles=daring','--max-level=3',
 '--max-attempts=18','--max-total-attempts=40',
 '--out=reports/stage6-e3-repro.json'
]);
const output=N.run(opts,{decisionModel:'risk-aware'});
const account=output.accounts[0];
const attempts=account.attempts.map(a=>({level:a.level,attempt:a.attempt,status:a.status,
 priorXp:a.before?.xp,afterXp:a.after?.xp,
 priorNodes:a.before?.talentNodes?.length,afterNodes:a.after?.talentNodes?.length,
 prepared:a.before?.prepared,reset:a.camp?.resets||[],
 error:a.error||null,
 diagnostic:a.diagnostic||null}));
const result={source:output.source,runnerSha256:output.runnerSha256,settings:opts,
 seed:account.seed,profile:account.profile,unlocked:account.endLevel,
 errors:output.coverage.errors,stop:account.stopReason,attempts};
const dest=path.resolve(opts.output);
fs.mkdirSync(path.dirname(dest),{recursive:true});
fs.writeFileSync(dest,JSON.stringify(result,null,2)+'\n');
console.log('E3_REPRO='+JSON.stringify({unlocked:account.endLevel,attempts:attempts.length,
 errors:output.coverage.errors,stop:account.stopReason,
 last:attempts.slice(-3)}));
