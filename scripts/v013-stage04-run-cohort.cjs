'use strict';
// Stage 04: fresh native accounts per shared seed/profile, three surgical
// decision policies. No added XP, gear, loot, scripted enemies or stat buffs.
// Each account has the actual game's persistence *within* its simulation.
const fs=require('node:fs'),path=require('node:path');
const N=require('./v013-natural-progression.cjs');
const SEEDS=Object.freeze(Array.from({length:12},(_,i)=>11001+i));
const PROFILES=Object.freeze(Object.keys(N.PROFILES));
const POLICIES=Object.freeze(['adaptive','adaptive-no-targets','adaptive-no-rooms']);
const LIMITS=Object.freeze({maxLevel:20,maxAttempts:18,maxTotalAttempts:360,tickLimit:12000});
function configuration(seed,policy){
 if(!SEEDS.includes(seed))throw Error('Unscheduled native Stage 04 seed: '+seed);
 if(!POLICIES.includes(policy))throw Error('Unscheduled native Stage 04 decision policy: '+policy);
 return N.parseArgs(['--seeds='+seed,'--profiles='+PROFILES.join(','),
  '--max-level='+LIMITS.maxLevel,'--max-attempts='+LIMITS.maxAttempts,
  '--max-total-attempts='+LIMITS.maxTotalAttempts,'--tick-limit='+LIMITS.tickLimit,
  '--out=reports/stage04/raw-'+seed+'-'+policy+'.json']);
}
function shard(seed,policy){
 const opts=configuration(seed,policy);
 const result=N.run(opts,{decisionModel:policy});
 const ids=result.accounts.map(a=>a.profile);
 if(result.accounts.length!==10||new Set(ids).size!==10||
  !PROFILES.every(p=>ids.includes(p))||result.accounts.some(a=>a.seed!==seed))
  throw Error('Stage 04 native source returned incomplete starting accounts');
 result.stage04={seed,policy,kind:'natural-native-E1-E20-decision-ablation',
  accounts:10,maxExpedition:20,maxAttemptsPerLevel:18,maxTotalAttempts:360,
  tickLimit:12000,independentPersistedAccounts:true};
 return result;
}
function main(argv=process.argv.slice(2)){
 const args=Object.fromEntries(argv.map(arg=>{
  const m=/^--([a-z-]+)=(.+)$/.exec(arg);
  if(!m)throw Error('Expected --seed=11001 --policy=adaptive [--out=...]');
  return [m[1],m[2]];
 }));
 const seed=Number(args.seed),policy=args.policy,report=shard(seed,policy);
 const dest=path.resolve(args.out||report.settings.output);
 if(!dest.endsWith('.json'))throw Error('JSON output file required');
 fs.mkdirSync(path.dirname(dest),{recursive:true});
 fs.writeFileSync(dest,JSON.stringify(report,null,2)+'\n');
 const accounts=report.accounts.map(a=>({seed:a.seed,profile:a.profile,
  entered:E=>a.reached.includes(E),reachedHighest:Math.max(...a.reached),
  clearedE5:a.attempts.some(t=>t.level===5&&t.bossWon),
  clearedE20:a.attempts.some(t=>t.level===20&&t.bossWon),
  attempts:a.attempts.length,errors:a.attempts.filter(t=>t.error||t.status==='error')
   .map(t=>({E:t.level,attempt:t.attempt,error:t.error,diagnostic:t.diagnostic||null})),
  stopReason:a.stopReason}));
 // Remove helper function before JSON emission to avoid misleading "entered".
 const summary={seed,policy,accounts:10,attempts:report.coverage.attempts,
  errors:report.coverage.errors,reachedE5:report.accounts.filter(a=>a.reached.includes(5)).length,
  clearedE5:accounts.filter(a=>a.clearedE5).length,
  reachedE20:report.accounts.filter(a=>a.reached.includes(20)).length,
  clearedE20:accounts.filter(a=>a.clearedE20).length,
  profiles:accounts.map(({entered,...rest})=>rest)};
 fs.writeFileSync(dest.replace(/\.json$/,'.summary.json'),JSON.stringify(summary,null,2)+'\n');
 console.log('STAGE04_SHARD='+JSON.stringify(summary));
 if(summary.errors)process.exitCode=1;
 return summary;
}
if(require.main===module)main();
module.exports={SEEDS,PROFILES,POLICIES,LIMITS,configuration,shard,main};
