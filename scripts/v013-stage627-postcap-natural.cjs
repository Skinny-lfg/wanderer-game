'use strict';
// Stage 6.27 — post-100 progression through E200 with EARNED XP and permanent stats.
// Never grants a level, item, stat point or combat advantage directly.
const fs=require('node:fs'),path=require('node:path');
const N=require('./v013-natural-progression.cjs');
const T=globalThis.WandererAutomaticTalents;
function parse(args=process.argv.slice(2)){
 const cfg={seed:9861,profiles:['cautious'],maxLevel:200,maxAttempts:24,
  maxTotalAttempts:360,out:'reports/v013-stage627-postcap-natural.json'};
 for(const arg of args){
  const m=/^--([a-z-]+)=(.+)$/.exec(arg);if(!m)throw Error('Invalid Stage 6.27 argument '+arg);
  const key=m[1],value=m[2];
  if(key==='seed')cfg.seed=Number(value);
  else if(key==='profile')cfg.profiles=[value];
  else if(key==='max-level')cfg.maxLevel=Number(value);
  else if(key==='max-total-attempts')cfg.maxTotalAttempts=Number(value);
  else if(key==='out')cfg.out=value;
  else throw Error('Unknown Stage 6.27 option '+key);
 }
 if(!Number.isInteger(cfg.seed)||cfg.seed<1||cfg.seed>1e6||
  cfg.profiles.some(x=>!N.PROFILES[x])||!cfg.profiles.length||
  !Number.isInteger(cfg.maxLevel)||cfg.maxLevel<40||cfg.maxLevel>200||
  !Number.isInteger(cfg.maxTotalAttempts)||cfg.maxTotalAttempts<10||cfg.maxTotalAttempts>400||
  !/^reports\/[a-z0-9-]+\.json$/.test(cfg.out))
  throw Error('Invalid Stage 6.27 parameters');
 return cfg;
}
function accountSummary(a){
 let first100=null,firstStat=null;const byE={};
 for(const attempt of a.attempts){
  if(attempt.error||attempt.status==='error')throw Error('Natural account error at E'+attempt.level+': '+attempt.error);
  const before=attempt.before,after=attempt.after;
  if(!before||!after||after.xp<before.xp||!Number.isSafeInteger(after.attributeEarned)||
    after.attributeEarned!==Math.max(0,Math.floor(after.xp/T.POINT_XP)-100)||
    before.attributeSpent>before.attributeEarned||after.attributeSpent>after.attributeEarned)
   throw Error('Invalid earned post-cap timeline at E'+attempt.level);
  if(!first100&&after.xp>=10000)first100={E:attempt.level,attempt:attempt.attempt,globalAttempt:a.attempts.indexOf(attempt)+1};
  if(!firstStat&&after.attributeEarned>=1)firstStat={E:attempt.level,attempt:attempt.attempt};
  for(const e of [1,20,35,55,70,100,125,150,175,200]){
   if(attempt.level===e&&!byE['E'+e]){
    byE['E'+e]={xp:before.xp,talentPoints:before.earned,
     attributePointsEarned:before.attributeEarned,
     attributePointsSpent:before.attributeSpent,
     attributes:before.attributes,spentOnArrival:before.attributeSpent};
   }
  }
 }
 const last=a.attempts.at(-1)?.after;
 return {seed:a.seed,profile:a.profile,attempts:a.attempts.length,
  unlockedE:a.endLevel,stopReason:a.stopReason,bossWins:a.attempts.filter(x=>x.bossWon).length,
  first100,firstPostcapAttribute:firstStat,
  final:{xp:last?.xp||0,talents:last?.earned||0,earnedStats:last?.attributeEarned||0,
   investedStats:last?.attributeSpent||0,stats:last?.attributes||{}},
  milestones:byE};
}
function main(args=process.argv.slice(2)){
 const cfg=parse(args);
 if(T.MAX_POINTS!==100||T.POINT_XP!==100)throw Error('Native 100 point cap changed');
 const opts={...N.DEFAULTS,seeds:[cfg.seed],profiles:cfg.profiles,maxLevel:cfg.maxLevel,
  maxAttempts:cfg.maxAttempts,maxTotalAttempts:cfg.maxTotalAttempts};
 const native=N.run(opts,{decisionModel:'adaptive'});
 if(native.coverage.errors)throw Error('Native engine errors '+native.coverage.errors);
 const data={stage:'6.27',provenance:native.source,parameters:cfg,
  coverage:native.coverage,accounts:native.accounts.map(accountSummary)};
 const dest=path.resolve(cfg.out);fs.mkdirSync(path.dirname(dest),{recursive:true});
 fs.writeFileSync(dest,JSON.stringify(data,null,2)+'\n');
 fs.writeFileSync(dest.replace(/\.json$/,'-raw.json'),JSON.stringify(native,null,2)+'\n');
 console.log('STAGE627='+JSON.stringify({coverage:data.coverage,accounts:data.accounts}));
 return data;
}
module.exports={parse,accountSummary,main};
if(require.main===module){try{main();}catch(e){console.error('STAGE627_ERROR '+String(e.stack||e));process.exitCode=1;}}
