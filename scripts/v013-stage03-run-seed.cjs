'use strict';
// Stage 03: 20 independent seeds x ten profiles, from authentic E1 accounts.
// Each account persists gear, XP, talents, resources and defeats *within the
// native runner*. Output one complete seed (ten accounts) per CI artifact.
const fs=require('node:fs'),path=require('node:path');
const N=require('./v013-natural-progression.cjs');
const P=require('./v013-stage02-run-cohort.cjs');
const SEEDS=Object.freeze(Array.from({length:20},(_,i)=>9901+i));
const PROFILES=Object.freeze([...P.GROUPS.A,...P.GROUPS.B]);
const MAX_LEVEL=20,MAX_ATTEMPTS=18,MAX_TOTAL_ATTEMPTS=360,TICK_LIMIT=12000;
function options(seed){
 if(!Number.isSafeInteger(seed)||!SEEDS.includes(seed))throw Error('Unscheduled Stage 03 seed '+seed);
 return N.parseArgs(['--seeds='+seed,'--profiles='+PROFILES.join(','),
  '--max-level='+MAX_LEVEL,'--max-attempts='+MAX_ATTEMPTS,
  '--max-total-attempts='+MAX_TOTAL_ATTEMPTS,'--tick-limit='+TICK_LIMIT,
  '--out=reports/stage03/raw-'+seed+'.json']);
}
function simulate(seed){
 const config=options(seed);
 const data=N.run(config,{decisionModel:'adaptive'});
 if(data.accounts.length!==10||data.accounts.some(a=>a.seed!==seed)||
  new Set(data.accounts.map(a=>a.profile)).size!==PROFILES.length)
  throw Error('Native Stage 03 cohort accounts did not match ten expected profiles');
 data.stage03={stage:'main-200-account-E20-audit',seed,profiles:[...PROFILES],
  accounts:10,policy:'adaptive',maxLevel:MAX_LEVEL,maxAttempts:MAX_ATTEMPTS,
  maxTotalAttempts:MAX_TOTAL_ATTEMPTS,tickLimit:TICK_LIMIT};
 return data;
}
function main(args=process.argv.slice(2)){
 const values=Object.fromEntries(args.map(arg=>{
  const match=/^--([a-z-]+)=(.+)$/.exec(arg);
  if(!match)throw Error('Usage: --seed=9901 --out=reports/stage03/raw-9901.json');
  return [match[1],match[2]];
 }));
 const seed=Number(values.seed),result=simulate(seed);
 const dest=path.resolve(values.out||result.settings.output);
 if(!dest.endsWith('.json'))throw Error('Output must be JSON');
 fs.mkdirSync(path.dirname(dest),{recursive:true});
 fs.writeFileSync(dest,JSON.stringify(result,null,2)+'\n');
 const profiles=result.accounts.map(a=>({seed:a.seed,profile:a.profile,
  highestReached:Math.max(...a.reached),unlocked:a.endLevel,
  clearedE20:a.attempts.some(t=>t.level===20&&t.bossWon),
  attempts:a.attempts.length,stopReason:a.stopReason,
  nativeErrors:a.attempts.filter(t=>t.status==='error'||t.error)
   .map(t=>({E:t.level,attempt:t.attempt,error:t.error,diagnostic:t.diagnostic||null}))}));
 const summary={seed,accounts:profiles.length,attempts:result.coverage.attempts,
  errors:result.coverage.errors,
  reachedE5:profiles.filter(a=>a.highestReached>=5).length,
  reachedE10:profiles.filter(a=>a.highestReached>=10).length,
  reachedE15:profiles.filter(a=>a.highestReached>=15).length,
  reachedE20:profiles.filter(a=>a.highestReached>=20).length,
  clearedE20:profiles.filter(a=>a.clearedE20).length,profiles};
 fs.writeFileSync(dest.replace(/\.json$/,'.summary.json'),JSON.stringify(summary,null,2)+'\n');
 console.log('STAGE03_SHARD='+JSON.stringify(summary));
 if(summary.errors)process.exitCode=1;
 return summary;
}
if(require.main===module)main();
module.exports={SEEDS,PROFILES,MAX_LEVEL,MAX_ATTEMPTS,MAX_TOTAL_ATTEMPTS,TICK_LIMIT,options,simulate,main};
