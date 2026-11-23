'use strict';
// Stage 6.34 — native earned-account encounter success audit, NOT a synthetic
// benchmark. Requires E1-born 100×5 cohort with real XP, gear and Boss unlocks.
// Observe combat at each E separately; NEVER infer unvisited E as 0% wins.
const fs=require('node:fs'),path=require('node:path');
const A=require('./v013-stage632-player-power.cjs');
const N=require('./v013-natural-progression.cjs');
const S=require('./simulate-progression.cjs');
const F=require('./v013-stage634-player-growth-fit.cjs');
const LEVELS=[1,2,3,4,5],KINDS=['combat','elite','boss'];
const median=a=>{const v=a.filter(Number.isFinite).sort((x,y)=>x-y);
 return v.length?(v.length&1?v[Math.floor(v.length/2)]:(v[v.length/2-1]+v[v.length/2])/2):null;};
const pct=(a,b)=>b?Math.round(1000*a/b)/10:null;
function parse(argv=process.argv.slice(2)){
 const cfg={mode:'cohort',batch:0,seed:9861,take:5,maxLevel:5,maxAttempts:12,
  maxTotalAttempts:60,out:'reports/v013-stage634-cohort-0-9861.json',inputs:'reports/stage634-shards'};
 for(const arg of argv){
  const m=/^--([a-z-]+)=(.+)$/.exec(arg);
  if(!m)throw Error('Unsupported Stage6.34 arg '+arg);
  if(['mode','out','inputs'].includes(m[1]))cfg[m[1]]=m[2];
  else if(['batch','seed','take','max-level','max-attempts','max-total-attempts'].includes(m[1]))
   cfg[m[1].replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=Number(m[2]);
  else throw Error('Unsupported Stage6.34 flag '+m[1]);
 }
 if(!['cohort','aggregate'].includes(cfg.mode)||!/^reports\/v013-stage634-[a-z0-9-]+\.json$/.test(cfg.out)||
  !/^reports\/[a-z0-9/-]+$/.test(cfg.inputs)||cfg.inputs.includes('..'))
  throw Error('Unsafe Stage6.34 output');
 if(cfg.mode==='cohort'&&(!Number.isInteger(cfg.batch)||cfg.batch<0||cfg.batch>=20||
  !A.SEEDS.includes(cfg.seed)||!Number.isInteger(cfg.take)||cfg.take<1||cfg.take>5||
  !Number.isInteger(cfg.maxLevel)||cfg.maxLevel<1||cfg.maxLevel>5||
  !Number.isInteger(cfg.maxAttempts)||cfg.maxAttempts<1||cfg.maxAttempts>36||
  !Number.isInteger(cfg.maxTotalAttempts)||cfg.maxTotalAttempts<1||cfg.maxTotalAttempts>180))
  throw Error('Invalid Stage6.34 cohort options');
 return cfg;
}
function summaryAccount(account,id,profile,seed){
 const first=account.attempts[0];
 if(!first||first.level!==1||first.attempt!==1)throw Error('Invalid earned E1 provenance '+id);
 const rooms=[];
 for(const attempt of account.attempts){
  if(!LEVELS.includes(attempt.level))throw Error('Unexpected Expedition '+attempt.level);
  for(const r of attempt.rooms||[]){
   if(!KINDS.includes(r.roomType)||typeof r.won!=='boolean'||typeof r.died!=='boolean')
    throw Error('Invalid native room outcome '+id);
   rooms.push({E:attempt.level,attempt:attempt.attempt,kind:r.roomType,
    enemies:r.initialEnemies||1,win:r.won,death:r.died,timeout:!!r.timedOut,
    eliteType:r.eliteType||null,bossStyle:r.bossStyle||null,seconds:r.seconds||0});
  }
 }
 const invalid=account.attempts.filter(a=>a.error&&a.error!=='Native combat timeout');
 if(invalid.length)throw Error('Unexpected native simulation fault '+id+' '+JSON.stringify(invalid.map(x=>x.error)));
 return {id,seed,family:profile.families[0],risk:profile.risk,variant:profile.cohortVariant||'existing',
  armor:profile.armor,weapon:profile.weapons[0],endLevel:account.endLevel,
  attempts:account.attempts.length,reached:account.reached.filter(E=>LEVELS.includes(E)),
  bossWins:account.attempts.filter(a=>a.bossWon).map(a=>a.level),
  totalXp:account.xp,stopReason:account.stopReason,rooms};
}
function cohort(cfg){
 if(A.IDS.length!==100||A.BATCHES.length!==20)throw Error('Stage 6.32 cohort drift');
 const ids=A.BATCHES[cfg.batch].slice(0,cfg.take),accounts=[];
 for(const id of ids){
  const profile=A.PROFILES[id];
  const opts={...N.DEFAULTS,seeds:[cfg.seed],profiles:[id],maxLevel:cfg.maxLevel,
   maxAttempts:cfg.maxAttempts,maxTotalAttempts:cfg.maxTotalAttempts};
  const account=N.simulateAccount(cfg.seed,id,opts,{researchProfiles:A.PROFILES,decisionModel:'adaptive'});
  const x=summaryAccount(account,id,profile,cfg.seed);
  accounts.push(x);
  console.log('STAGE634_ACCOUNT='+JSON.stringify({id,seed:cfg.seed,unlocked:x.endLevel,
   rooms:x.rooms.length,attempts:x.attempts}));
 }
 return {stage:'6.34',kind:'cohort',source:S.sourceFingerprint().sha256,
  fitInputSHA256:F.INPUT.inputFullAggregateSHA256,settings:cfg,
  complete:cfg.take===5&&cfg.maxLevel===5&&cfg.maxAttempts===12&&cfg.maxTotalAttempts===60,
  accounts,errors:0};
}
function rate(rooms){
 const wins=rooms.filter(r=>r.win).length,losses=rooms.filter(r=>r.death).length,
  censored=rooms.filter(r=>r.timeout||!r.win&&!r.death).length,n=wins+losses;
 return {fights:rooms.length,resolved:n,wins,losses,censored,winPct:pct(wins,n),
  medianSeconds:median(rooms.filter(r=>r.win).map(r=>r.seconds))};
}
function aggregate(shards){
 const expected=new Set(A.IDS.flatMap(id=>A.SEEDS.map(seed=>id+'|'+seed)));
 const seen=new Set(),accounts=[],sources=new Set();
 for(const shard of shards){
  if(shard.stage!=='6.34'||shard.kind!=='cohort'||!shard.complete||shard.errors||
   shard.accounts.length!==5||shard.settings.take!==5||
   shard.settings.maxLevel!==5||shard.settings.maxAttempts!==12||
   shard.settings.maxTotalAttempts!==60||shard.fitInputSHA256!==F.INPUT.inputFullAggregateSHA256)
   throw Error('Invalid Stage6.34 earned shard');
  sources.add(shard.source);
  for(const acc of shard.accounts){
   const key=acc.id+'|'+acc.seed;
   if(!expected.has(key)||seen.has(key))throw Error('Unexpected or duplicate account '+key);
   seen.add(key);accounts.push(acc);
  }
 }
 if(sources.size!==1||seen.size!==expected.size)
  throw Error('Incomplete/mixed Stage6.34 matrix '+seen.size+'/500, sources '+sources.size);
 const levels=LEVELS.map(E=>{
  const reached=accounts.filter(a=>a.reached.includes(E)),rooms=reached.flatMap(a=>a.rooms.filter(r=>r.E===E));
  const one=k=>rate(rooms.filter(r=>r.kind===k));
  const normal=rooms.filter(r=>r.kind==='combat');
  return {E,accountsReached:reached.length,accountsNotReached:500-reached.length,
   rooms:rooms.length,normal:one('combat'),elite:one('elite'),boss:one('boss'),
   solo:rate(normal.filter(r=>r.enemies===1)),
   small:rate(normal.filter(r=>r.enemies>=2&&r.enemies<=4)),
   swarm:rate(normal.filter(r=>r.enemies>=5)),
   byRealm:Object.fromEntries(['blood','decay','vitality','aegis','fury','magic'].map(realm=>{
    const sub=reached.filter(a=>a.family===realm).flatMap(a=>a.rooms.filter(r=>r.E===E));
    return [realm,{accounts:reached.filter(a=>a.family===realm).length,
     normal:rate(sub.filter(r=>r.kind==='combat')),
     elite:rate(sub.filter(r=>r.kind==='elite')),
     boss:rate(sub.filter(r=>r.kind==='boss'))}];
   }))};
 });
 return {stage:'6.34',kind:'aggregate',source:[...sources][0],
  inputStage632:{run:F.INPUT.inputGitHubRun,accounts:F.INPUT.cohort.accounts},
  accounts:500,levels,overview:{E2Reached:levels[1].accountsReached,E5Reached:levels[4].accountsReached},
  caveats:[
   'Real E1-born agents; every level must be genuinely unlocked. Non-reached levels are censored, not losses.',
   'Rates are per RESOLVED encounter, not expedition completion rates. Encounters within a player are correlated, so binomial precision is overstated.',
   'Elite encounters are optional and reflect agent choices: possible severe selection bias.',
   'Normal solo, 2–4 and 5+ group success separated; larger groups now consist of full-strength enemies.',
   'Results include normal game abilities and risk/Traits. The stat-only calibration must be assessed separately.',
   '500 agents are heuristic and not a random player sample. No claims of reaching 80–90 / 60–70 / 35–45 without enough successes and representative risks.',
   'No forced XP, gear, Boss defeats, talent points or unlocks. Stage6.34 curve is identical for all enemy identities.'
  ]};
}
function markdown(a){
 const out=['# Stage 6.34 — Native earned E1–E5 combat-rate audit','',
  '500 real E1-born accounts. No fake wins or unlocks. Source: '+a.source,'',
  '| Expedition | Reached accounts | Normal wins/resolved (%) | Solo (%) | Small 2–4 (%) | Swarm 5+ (%) | Elite wins/resolved (%) | Boss wins/resolved (%) |',
  '|---|---:|---|---|---|---|---|---|'];
 const fmt=x=>x.resolved?x.wins+'/'+x.resolved+' ('+x.winPct+'%)':'N/A (0 resolved)';
 for(const r of a.levels)out.push('| E'+r.E+' | '+r.accountsReached+' | '+[r.normal,r.solo,r.small,r.swarm,r.elite,r.boss].map(fmt).join(' | ')+' |');
 out.push('','## Important limits','',...a.caveats.map(x=>'- '+x),'');
 return out.join('\n');
}
function main(argv=process.argv.slice(2)){
 const cfg=parse(argv);
 const out=cfg.mode==='cohort'?cohort(cfg):
  aggregate(fs.readdirSync(cfg.inputs).filter(f=>/^v013-stage634-cohort-\d+-\d+\.json$/.test(f))
   .map(f=>JSON.parse(fs.readFileSync(path.join(cfg.inputs,f),'utf8'))));
 fs.mkdirSync(path.dirname(cfg.out),{recursive:true});
 fs.writeFileSync(cfg.out,JSON.stringify(out,null,2)+'\n');
 if(cfg.mode==='aggregate')fs.writeFileSync(cfg.out.replace(/\.json$/,'.md'),markdown(out)+'\n');
 console.log('STAGE634='+JSON.stringify(cfg.mode==='aggregate'?out.overview:
  {accounts:out.accounts.length,source:out.source,complete:out.complete}));
 return out;
}
module.exports={LEVELS,KINDS,parse,summaryAccount,rate,cohort,aggregate,markdown,main};
if(require.main===module){try{main();}catch(e){console.error('STAGE634_ERROR '+String(e.stack||e));process.exitCode=1;}}
