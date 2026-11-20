'use strict';
// Compare only the two refined strategic profiles, not artificially powered-up
// characters. Both profiles still start E1 with zero XP and weak native gear.
const N=require('./v013-natural-progression.cjs');
const fs=require('node:fs'),path=require('node:path');
const SEEDS=Object.freeze(Array.from({length:12},(_,i)=>11001+i));
const PROFILES=Object.freeze(['leather-duelist','hexblade-hybrid']);
function configuration(seed){
 if(!SEEDS.includes(seed))throw Error('Unknown A/B seed '+seed);
 return N.parseArgs(['--seeds='+seed,'--profiles='+PROFILES.join(','),
  '--max-level=20','--max-attempts=18','--max-total-attempts=360',
  '--tick-limit=12000','--out=reports/stage04/refinement-'+seed+'.json']);
}
const includes=(a,id)=>a.talents?.includes(id)||false;
function summarizeAccount(a){
 return {seed:a.seed,profile:a.profile,highestReached:Math.max(...a.reached),
  highestCleared:a.endLevel-1,attempts:a.attempts.length,
  clearedE1:a.attempts.some(t=>t.level===1&&t.bossWon),
  clearedE5:a.attempts.some(t=>t.level===5&&t.bossWon),
  clearedE20:a.attempts.some(t=>t.level===20&&t.bossWon),
  finalXp:a.xp,nativeTalentNodes:a.talents?.length||0,
  talentsObserved:Object.fromEntries([
   'affinity_blood','blood_drinker','blood_harvest','crimson_rush',
   'affinity_magic','affinity_decay','affinity_aegis',
   'arcane_resonance','arcane_surge','arcane_mastery',
   'guarded_block','barrier_pulse','hex_bolt','grave_bloom'
  ].map(id=>[id,includes(a,id)])),
  errorCount:a.attempts.filter(t=>t.error||t.status==='error').length,
  stopReason:a.stopReason,initialGear:a.initialGear};
}
function main(argv=process.argv.slice(2)){
 const args=Object.fromEntries(argv.map(v=>{const m=/^--([a-z-]+)=(.+)$/.exec(v);
  if(!m)throw Error('Expected --seed=11001 --out=reports/stage04/refinement-11001.json');
  return [m[1],m[2]];}));
 const seed=Number(args.seed),opts=configuration(seed);
 const result=N.run(opts,{decisionModel:'adaptive'});
 if(result.accounts?.length!==2||result.accounts.some(a=>a.seed!==seed)||
  PROFILES.some(p=>!result.accounts.some(a=>a.profile===p)))
  throw Error('Missing real native dual-profile cohort');
 result.refinement={seed,kind:'natural-archetype-refinement-only',
  profiles:[...PROFILES],nativeE1Start:true,maxAttempts:18,maxTotalAttempts:360,
  decisionModel:'adaptive',noStatOrGearInjection:true};
 const out=path.resolve(args.out||opts.output);
 fs.mkdirSync(path.dirname(out),{recursive:true});
 fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n');
 const summary={seed,accounts:result.accounts.length,attempts:result.coverage.attempts,
  errors:result.coverage.errors,profiles:result.accounts.map(summarizeAccount)};
 fs.writeFileSync(out.replace(/\.json$/,'.summary.json'),JSON.stringify(summary,null,2)+'\n');
 console.log('ARCHETYPE_AB='+JSON.stringify(summary));
 if(summary.errors)process.exitCode=1;
}
if(require.main===module)main();
module.exports={SEEDS,PROFILES,configuration,summarizeAccount,main};
