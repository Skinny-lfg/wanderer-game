'use strict';
// Stage 6.26 — genuinely earned 100-point Talent cap. Read-only native accounts.
// No injected XP, gear, Expedition unlocks, enemy multipliers or combat buffs.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const N=require('./v013-natural-progression.cjs');
const T=globalThis.WandererAutomaticTalents;
const TARGET=100;
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const mean=x=>x.length?+(x.reduce((a,b)=>a+b,0)/x.length).toFixed(2):null;
const median=x=>{if(!x.length)return null;const a=[...x].sort((x,y)=>x-y),n=a.length;return n%2?a[n>>1]:(a[n/2-1]+a[n/2])/2};
function parse(args=process.argv.slice(2)){
 const out={seed:9861,profiles:['cautious','balanced','daring'],maxLevel:200,
  maxAttempts:24,maxTotalAttempts:220,output:'reports/v013-stage626-seed9861.json'};
 for(const arg of args){
  const m=/^--([a-z-]+)=(.+)$/.exec(arg);if(!m)throw Error('Unsupported option '+arg);
  const [_,k,v]=m;
  if(k==='seed')out.seed=Number(v);
  else if(k==='profiles')out.profiles=v.split(',');
  else if(k==='max-level')out.maxLevel=Number(v);
  else if(k==='max-attempts')out.maxAttempts=Number(v);
  else if(k==='max-total-attempts')out.maxTotalAttempts=Number(v);
  else if(k==='out')out.output=v;
  else throw Error('Unknown Stage 6.26 option '+k);
 }
 if(!Number.isSafeInteger(out.seed)||out.seed<1||out.seed>1000000||
  !Number.isInteger(out.maxLevel)||out.maxLevel<20||out.maxLevel>200||
  !Number.isInteger(out.maxAttempts)||out.maxAttempts<1||out.maxAttempts>36||
  !Number.isInteger(out.maxTotalAttempts)||out.maxTotalAttempts<1||out.maxTotalAttempts>400||
  !out.profiles.length||out.profiles.some(x=>!N.PROFILES[x])||
  new Set(out.profiles).size!==out.profiles.length||
  !/^reports\/[a-z0-9-]+\.json$/.test(out.output))
  throw Error('Invalid native 100-point audit parameters');
 return out;
}
function summarizeAccount(account){
 if(account.startXp!==0)throw Error('Natural account did not begin with zero XP');
 let previous=0,first=null,firstPts=null;
 const milestones={};
 for(const attempt of account.attempts){
  const x=attempt.after?.xp,initial=attempt.before?.xp;
  if(!Number.isSafeInteger(x)||!Number.isSafeInteger(initial)||
   initial<previous||x<initial)
   throw Error('Invalid native earned XP trajectory '+account.profile+'/'+account.seed);
  if(previous>=TARGET*T.POINT_XP)throw Error('Player fought after earned 100-point stop');
  if(x>=TARGET*T.POINT_XP){
   if(!first)first={expedition:attempt.level,attempt:attempt.attempt,
    globalAttempt:account.attempts.indexOf(attempt)+1,
    beforeXp:initial,afterXp:x,pointsAfter:Math.min(TARGET,Math.floor(x/T.POINT_XP)),
    status:attempt.status,clearedBoss:!!attempt.bossWon};
  }
  for(const E of [1,5,10,20,35,50,70,100,150,200]){
   const key='E'+E;
   if(attempt.level===E&&milestones[key]===undefined)
    milestones[key]={firstEntryPoints:attempt.before.earned,
     firstEntryXp:attempt.before.xp};
  }
  previous=x;
 }
 const maxXp=account.xp;
 if(maxXp!==previous||first&&maxXp<TARGET*T.POINT_XP)
  throw Error('Earned XP summary drift');
 return {seed:account.seed,profile:account.profile,attempts:account.attempts.length,
  deepestUnlocked:account.endLevel,stopReason:account.stopReason,
  capReached:!!first,firstCap:first,lastXp:maxXp,
  lastEarnedPoints:Math.min(TARGET,Math.floor(maxXp/T.POINT_XP)),
  milestones};
}
function summarize(report,params){
 if(report.coverage.errors)throw Error('Native accounts contain errors: '+report.coverage.errors);
 const accounts=report.accounts.map(summarizeAccount),achieved=accounts.filter(x=>x.capReached);
 const e=achieved.map(x=>x.firstCap.expedition);
 return {stage:'6.26',nativeEngine:report.source,
  naturalRunnerSha256:report.runnerSha256,
  parameters:params,capPoints:TARGET,requiredXp:TARGET*T.POINT_XP,
  samples:{accounts:accounts.length,achievers:achieved.length,censored:accounts.length-achieved.length,
   attempts:accounts.reduce((n,x)=>n+x.attempts,0),errors:0},
  capExpedition:achieved.length?{mean:mean(e),median:median(e),min:Math.min(...e),
   max:Math.max(...e),observations:achieved.length}:null,
  accounts};
}
function aggregate(dir,output){
 const names=fs.readdirSync(dir).filter(x=>/^v013-stage626-seed\d+\.json$/.test(x));
 const shards=names.map(x=>JSON.parse(fs.readFileSync(path.join(dir,x),'utf8')));
 if(!shards.length)throw Error('No Stage 6.26 reports to aggregate');
 const keys=new Set(),accounts=[],engines=new Set();
 for(const s of shards){
  if(s.stage!=='6.26'||s.samples.errors||s.capPoints!==100||
   s.samples.accounts!==s.accounts.length||s.samples.achievers!==s.accounts.filter(x=>x.capReached).length)
   throw Error('Invalid Stage 6.26 shard');
  engines.add(s.nativeEngine);
  for(const a of s.accounts){const key=a.seed+'|'+a.profile;if(keys.has(key))throw Error('Duplicate native account '+key);keys.add(key);accounts.push(a);}
 }
 if(engines.size!==1)throw Error('Mixed native engine versions');
 const achievers=accounts.filter(a=>a.capReached),levels=achievers.map(a=>a.firstCap.expedition);
 const out={stage:'6.26',samples:{accounts:accounts.length,achievers:achievers.length,
  censored:accounts.length-achievers.length,attempts:accounts.reduce((n,a)=>n+a.attempts,0),errors:0},
  capPoints:100,requiredXp:10000,engine:[...engines][0],
  capExpedition:levels.length?{mean:mean(levels),median:median(levels),
   min:Math.min(...levels),max:Math.max(...levels),observations:levels.length}:null,
  accounts};
 const md=['# Wanderer v0.13 — Stage 6.26, natural 100 Talent Points','',
  '**E1 start, zero XP, no fake gear, native unlock, no synthetic combat points.**',
  'Required XP: '+out.requiredXp+', native cap: 100 points.','',
  'Completed native accounts: '+out.samples.accounts,
  'Observed cap reached: '+out.samples.achievers,
  'Censored before cap: '+out.samples.censored,
  'Total native Expedition attempts: '+out.samples.attempts,
  'Expedition of 100 points: '+JSON.stringify(out.capExpedition),'',
  '| Seed | Profile | E100 points first attained | Attempts to cap | Last XP | Deepest E | Outcome |',
  '|---:|---|---:|---:|---:|---:|---|'];
 for(const a of accounts)md.push('| '+a.seed+' | '+a.profile+' | '+(a.firstCap?.expedition??'not observed')+
  ' | '+(a.firstCap?.globalAttempt??a.attempts)+' | '+a.lastXp+' | '+a.deepestUnlocked+
  ' | '+a.stopReason+' |');
 md.push('','The mean is calculated **only among achievers**, not from censored trajectories.',
  '100 points available does not by itself mean all 100 have been allocated at the exact instant XP reaches 10,000.',
  'Stopping on the first native 100-point observation shortens runs intentionally. This is an AI agent sample, not a human estimate.',
  'All rewards and Expedition progress use the current native game runner; no synthetic XP.','');
 fs.writeFileSync(output,JSON.stringify(out,null,2)+'\n');
 fs.writeFileSync(output.replace(/\.json$/,'.md'),md.join('\n'));
 console.log('STAGE626_AGG='+JSON.stringify({samples:out.samples,capExpedition:out.capExpedition,accounts:out.accounts.map(a=>({seed:a.seed,profile:a.profile,E:a.firstCap?.expedition??null,last:a.lastEarnedPoints,stop:a.stopReason}))}));
 return out;
}
function main(args=process.argv.slice(2)){
 if(args.some(x=>x.startsWith('--aggregate-dir='))){
  const dir=args.find(x=>x.startsWith('--aggregate-dir=')).split('=').slice(1).join('=');
  const output=(args.find(x=>x.startsWith('--out='))||'--out=reports/v013-stage626-aggregate.json').slice(6);
  if(!/^reports\/[a-z0-9-]+\.json$/.test(output)||!/^reports\/[a-z0-9-]+$/.test(dir))throw Error('Invalid aggregate path');
  return aggregate(dir,output);
 }
 const p=parse(args);
 if(T.MAX_POINTS!==100||T.POINT_XP!==100)throw Error('Talent cap requirement changed: abort audit');
 const opts=N.parseArgs(['--seeds='+p.seed,'--profiles='+p.profiles.join(','),
  '--max-level=20','--max-attempts='+p.maxAttempts,
  '--max-total-attempts='+p.maxTotalAttempts,'--out='+p.output]);
 // Stage 6.26 is explicitly authorized to audit through E200. Keep the native
 // general-purpose parseArgs guard at E20 to preserve existing regression gates.
 opts.maxLevel=p.maxLevel;
 const report=N.run(opts,{decisionModel:'adaptive',stopAtTalentCap:true});
 const summary=summarize(report,p);
 fs.mkdirSync(path.dirname(p.output),{recursive:true});
 fs.writeFileSync(p.output,JSON.stringify(summary,null,2)+'\n');
 fs.writeFileSync(p.output.replace(/\.json$/,'-raw.json'),JSON.stringify(report,null,2)+'\n');
 console.log('STAGE626='+JSON.stringify({params:p,samples:summary.samples,
  capExpedition:summary.capExpedition,accounts:summary.accounts.map(a=>({
   seed:a.seed,profile:a.profile,E:a.firstCap?.expedition??null,attempts:a.attempts,
   maxXp:a.lastXp,stop:a.stopReason}))}));
 return summary;
}
module.exports={parse,summarizeAccount,summarize,aggregate,main};
if(require.main===module){try{main();}catch(e){console.error('STAGE626_ERROR '+(e.stack||e));process.exitCode=1;}}
