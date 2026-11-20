'use strict';
// Stage 01 checkpoint: natural account E1–E5 progression, no synthetic XP,
// gear, unlocks or forced encounters. This is an integrity smoke, NOT balance.
const fs=require('node:fs'),path=require('node:path');
const N=require('./v013-natural-progression.cjs');
const opts=N.parseArgs([
 '--seeds=9701,9702','--profiles=daring,plate-warden,magic-fire,hexblade-hybrid',
 '--max-level=5','--max-attempts=18','--max-total-attempts=80',
 '--out=reports/stage01-e3-e5-smoke.json'
]);
const report=N.run(opts,{decisionModel:'risk-aware'});
const accounts=report.accounts.map(a=>({seed:a.seed,profile:a.profile,unlocked:a.endLevel,
 attempts:a.attempts.length,stopReason:a.stopReason,
 highestLevelReached:Math.max(...a.reached),advancedPrepared:a.attempts.filter(x=>x.before?.prepared).length,
 errors:a.attempts.filter(x=>x.error||x.status==='error').map(x=>({
  level:x.level,attempt:x.attempt,error:x.error,diagnostic:x.diagnostic||null
 }))}));
const summary={source:report.source,settings:opts,accounts,errors:report.coverage.errors,
 levels:report.levels.map(l=>({E:l.level,accountsReached:l.accountsReached,
  attempts:l.attempts,wins:l.wins,deaths:l.deaths,errors:l.errors}))};
const dest=path.resolve(opts.output);
fs.mkdirSync(path.dirname(dest),{recursive:true});
fs.writeFileSync(dest,JSON.stringify(summary,null,2)+'\n');
console.log('STAGE01_EXTENDED='+JSON.stringify(summary));
if(summary.errors)process.exitCode=1;
