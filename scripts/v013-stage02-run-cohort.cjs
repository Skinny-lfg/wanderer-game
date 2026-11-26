'use strict';
// Stage 02: an actual native account from E1, never a forced-E combat fixture.
// Run one seed × five profiles per CI shard; each account has its own harness,
// XP, equipment, drops, gold, talents, potions, route RNG and Camp decisions.
const fs=require('node:fs'),path=require('node:path');
const N=require('./v013-natural-progression.cjs');
const GROUPS=Object.freeze({
 A:['cautious','balanced','arcane-fire','leather-duelist','hexblade-hybrid'],
 B:['daring','plate-warden','arcane-frost','arcane-lightning','cloth-battlemage']
});
const SEEDS=Object.freeze([9811,9812,9813,9814,9815]);
const MAX_LEVEL=20,MAX_ATTEMPTS=18,MAX_TOTAL_ATTEMPTS=360,MAX_COMBAT_TICKS=12000;
function configuration(seed,group){
 if(!Number.isSafeInteger(seed)||!SEEDS.includes(seed))throw Error('Unknown Stage 02 seed: '+seed);
 if(!Object.hasOwn(GROUPS,group))throw Error('Unknown Stage 02 group: '+group);
 return N.parseArgs([
  '--seeds='+seed,'--profiles='+GROUPS[group].join(','),
  '--max-level='+MAX_LEVEL,'--max-attempts='+MAX_ATTEMPTS,
  '--max-total-attempts='+MAX_TOTAL_ATTEMPTS,'--tick-limit='+MAX_COMBAT_TICKS,
  '--out=reports/stage02/raw-'+seed+'-'+group+'.json'
 ]);
}
function shard(seed,group){
 const cfg=configuration(seed,group);
 // Check the *actual* adaptive agent/real native economy; not 50 independent
 // artificial geared characters that start at E20.
 const data=N.run(cfg,{decisionModel:'adaptive'});
 const accounts=data.accounts||[];
 if(accounts.length!==5)throw Error('Missing native accounts in Stage 02 cohort');
 if(accounts.some(a=>a.seed!==seed||!GROUPS[group].includes(a.profile)))
  throw Error('Cohort label disagrees with native accounts');
 data.stage02={cohort:seed+'-'+group,seed,group,
  maxExpedition:MAX_LEVEL,maxAttemptsPerExpedition:MAX_ATTEMPTS,
  maxAttemptsPerAccount:MAX_TOTAL_ATTEMPTS,maxNativeCombatTicks:MAX_COMBAT_TICKS,
  decisionModel:'adaptive',genuineLevelUnlocksOnly:true,
  hadSimulationErrors:data.coverage.errors>0};
 return data;
}
function main(argv=process.argv.slice(2)){
 const args=Object.fromEntries(argv.map(x=>{
  const m=/^--([a-z-]+)=(.+)$/.exec(x);if(!m)throw Error('Usage: --seed=9811 --group=A --out=...json');
  return [m[1],m[2]];
 }));
 const seed=Number(args.seed),group=args.group;
 const data=shard(seed,group);
 const dest=path.resolve(args.out||data.settings.output);
 if(!dest.endsWith('.json'))throw Error('Cohort output must be JSON');
 fs.mkdirSync(path.dirname(dest),{recursive:true});
 fs.writeFileSync(dest,JSON.stringify(data,null,2)+'\n');
 const attempts=data.accounts.flatMap(a=>a.attempts);
 const brief={seed,group,profiles:data.accounts.map(a=>a.profile),
  accounts:data.accounts.length,attempts:attempts.length,
  errors:data.coverage.errors,highestReached:Math.max(...data.accounts.map(a=>Math.max(...a.reached))),
  reachedE5:data.accounts.filter(a=>a.reached.includes(5)).length,
  reachedE10:data.accounts.filter(a=>a.reached.includes(10)).length,
  reachedE15:data.accounts.filter(a=>a.reached.includes(15)).length,
  reachedE20:data.accounts.filter(a=>a.reached.includes(20)).length,
  clearedE20:data.accounts.filter(a=>a.attempts.some(t=>t.level===20&&t.bossWon)).length,
  accountsState:data.accounts.map(a=>({
   profile:a.profile,reachedE:Math.max(...a.reached),attempts:a.attempts.length,
   unlocked:a.endLevel,stopReason:a.stopReason,
   errors:a.attempts.filter(t=>t.error||t.status==='error').map(t=>({
    E:t.level,attempt:t.attempt,error:t.error,diagnostic:t.diagnostic||null
   }))
  }))};
 fs.writeFileSync(dest.replace(/\.json$/,'.summary.json'),JSON.stringify(brief,null,2)+'\n');
 console.log('STAGE02_COHORT='+JSON.stringify(brief));
 if(data.coverage.errors)process.exitCode=1;
 return brief;
}
if(require.main===module)main();
module.exports={GROUPS,SEEDS,MAX_LEVEL,MAX_ATTEMPTS,MAX_TOTAL_ATTEMPTS,MAX_COMBAT_TICKS,configuration,shard,main};
