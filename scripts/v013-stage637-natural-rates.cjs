'use strict';
// Stage 6.37 — real E1-born E1–E5 success by named Elite and group size.
// No synthetic XP, items, Boss unlocks or forced encounter wins.
// Must not reuse Stage6.34's prior native source fingerprint after these edits.
const fs=require('node:fs'),path=require('node:path');
const N=require('./v013-natural-progression.cjs');
const A=require('./v013-stage632-player-power.cjs');
const V=require('./v013-stage634-natural-rates.cjs');
const S=require('./simulate-progression.cjs');
const E=['tank','berserker','vampire','caster','gravecaller','oathbound_exarch','the_gilded','ashen_executioner'];
const F=['blood','decay','radiance','aegis','fury','arcane'];
const LV=[1,2,3,4,5];
function options(argv=process.argv.slice(2)){
 const cfg={mode:'cohort',batch:0,seed:9861,take:5,maxLevel:5,maxAttempts:12,
  maxTotalAttempts:60,out:'reports/v013-stage637-cohort-0-9861.json',
  inputs:'reports/stage637-shards'};
 for(const arg of argv){
  const m=/^--([a-z-]+)=(.+)$/.exec(arg);
  if(!m)throw Error('Invalid Stage6.37 option '+arg);
  if(['mode','out','inputs'].includes(m[1]))cfg[m[1]]=m[2];
  else if(['batch','seed','take','max-level','max-attempts','max-total-attempts'].includes(m[1]))
   cfg[m[1].replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=Number(m[2]);
  else throw Error('Unsupported Stage6.37 flag '+m[1]);
 }
 if(!['cohort','aggregate'].includes(cfg.mode)||
  !/^reports\/v013-stage637-[a-z0-9-]+\.json$/.test(cfg.out)||
  !/^reports\/[a-z0-9/-]+$/.test(cfg.inputs)||cfg.inputs.includes('..'))
  throw Error('Unsafe Stage6.37 output mode');
 if(cfg.mode==='cohort'&&(!Number.isInteger(cfg.batch)||cfg.batch<0||cfg.batch>=20||
  !A.SEEDS.includes(cfg.seed)||!Number.isInteger(cfg.take)||cfg.take<1||cfg.take>5||
  !Number.isInteger(cfg.maxLevel)||cfg.maxLevel<1||cfg.maxLevel>5||
  !Number.isInteger(cfg.maxAttempts)||cfg.maxAttempts<1||cfg.maxAttempts>36||
  !Number.isInteger(cfg.maxTotalAttempts)||cfg.maxTotalAttempts<1||cfg.maxTotalAttempts>180))
  throw Error('Unsafe Stage6.37 natural account limit');
 return cfg;
}
function cohort(cfg){
 if(A.IDS.length!==100||A.BATCHES.length!==20||A.SEEDS.length!==5)
  throw Error('Stage6.37 legal native agent catalog changed');
 const accounts=[];
 for(const id of A.BATCHES[cfg.batch].slice(0,cfg.take)){
  const profile=A.PROFILES[id];
  const run=N.simulateAccount(cfg.seed,id,{...N.DEFAULTS,seeds:[cfg.seed],
   profiles:[id],maxLevel:cfg.maxLevel,maxAttempts:cfg.maxAttempts,
   maxTotalAttempts:cfg.maxTotalAttempts},{researchProfiles:A.PROFILES,decisionModel:'adaptive'});
  const r=V.summaryAccount(run,id,profile,cfg.seed);
  for(const room of r.rooms){
   if(room.kind==='elite'&&!E.includes(room.eliteType))
    throw Error('Natural Elite missing actual identity '+id+' '+JSON.stringify(room));
  }
  accounts.push(r);
  console.log('STAGE637_ACCOUNT='+JSON.stringify({id,seed:cfg.seed,endLevel:r.endLevel,
   roomCount:r.rooms.length}));
 }
 return {stage:'6.37',kind:'cohort',source:S.sourceFingerprint().sha256,
  settings:cfg,complete:cfg.take===5&&cfg.maxLevel===5&&cfg.maxAttempts===12&&
   cfg.maxTotalAttempts===60,errors:0,accounts};
}
function aggregate(shards){
 const expected=new Set(A.IDS.flatMap(id=>A.SEEDS.map(seed=>id+'|'+seed)));
 const seen=new Set(),sources=new Set(),accounts=[];
 for(const shard of shards){
  if(shard.stage!=='6.37'||shard.kind!=='cohort'||shard.errors||
   !shard.complete||shard.accounts.length!==5||shard.settings.maxLevel!==5||
   shard.settings.maxAttempts!==12||shard.settings.maxTotalAttempts!==60)
   throw Error('Incomplete Stage6.37 shard');
  sources.add(shard.source);
  for(const a of shard.accounts){
   const key=a.id+'|'+a.seed;
   if(!expected.has(key)||seen.has(key))throw Error('Unexpected duplicate Stage6.37 E1 account '+key);
   seen.add(key);accounts.push(a);
  }
 }
 if(seen.size!==expected.size||sources.size!==1)
  throw Error('Missing or mixed Stage6.37 E1 native cohort '+seen.size+'/500 / fingerprints '+sources.size);
 const levels=LV.map(level=>{
  const reached=accounts.filter(a=>a.reached.includes(level)),
   rooms=reached.flatMap(a=>a.rooms.filter(r=>r.E===level)),
   normal=rooms.filter(r=>r.kind==='combat');
  const byElite=Object.fromEntries(E.map(id=>[id,V.rate(rooms.filter(r=>r.kind==='elite'&&r.eliteType===id))]));
  const byFamily=Object.fromEntries(F.map(f=>{
   const a=reached.filter(x=>x.family===f),r=a.flatMap(x=>x.rooms.filter(q=>q.E===level));
   return [f,{accounts:a.length,normal:V.rate(r.filter(x=>x.kind==='combat')),
    elite:V.rate(r.filter(x=>x.kind==='elite')),boss:V.rate(r.filter(x=>x.kind==='boss'))}];
  }));
  return {E:level,accountsReached:reached.length,totalRooms:rooms.length,
   normal:V.rate(normal),solo:V.rate(normal.filter(r=>r.enemies===1)),
   small:V.rate(normal.filter(r=>r.enemies>=2&&r.enemies<=4)),
   swarm:V.rate(normal.filter(r=>r.enemies>=5)),
   elite:V.rate(rooms.filter(r=>r.kind==='elite')),
   boss:V.rate(rooms.filter(r=>r.kind==='boss')),
   byElite,byFamily};
 });
 return {stage:'6.37',kind:'aggregate',source:[...sources][0],
  cohort:{profiles:100,seeds:A.SEEDS,accounts:500,legitimateE2:levels[1].accountsReached,
   legitimateE5:levels[4].accountsReached},levels,
  comparison:{priorStage634:{E1:{normal:66.9,solo:96.2,small:24.1,swarm:0,elite:76.9,boss:37.1},
    E5:{normal:74.1,solo:100,small:68.3,swarm:8.3,elite:100,boss:97.9}},
   caution:'Previous figures are distinct-account before-change baselines, NOT paired causal E1 observations.'},
  limits:[
   'All 500 native accounts originate at real E1 with legal earned equipment, currency, XP, decisions, and Boss unlocks. No made-up levels.',
   'E2–E5 includes only the agents that legitimately unlocked those Expeditions; missing accounts are censored, not losses.',
   'Elite rooms are optional and influenced by agents, so per-Elite win rates have selection bias and within-account correlated attempts.',
   'Minion relief is for PRINCIPAL normal mobs in 5+ rooms with minions; 2–4 groups remain unmodified and still need separate calibration.',
   'A single E1 Elite coefficient change is shared across all Expeditions. Per-identity balance may still require tuning after this 100x5 natural matrix.',
   'Stage6.34 baseline figures were measured on a different game fingerprint. E1 comparison is diagnostic only, not an exact paired before/after experiment.',
   'No Boss, gear, loot, talents, global enemy reference, or live Pages deployment was altered.'
  ]};
}
const fmt=x=>x?.resolved?x.wins+'/'+x.resolved+' ('+x.winPct+'%)':'—';
function markdown(d){
 const out=['# Wanderer Stage 6.37 — Minion-relative principals and E1 Elite bases','',
  'Native source fingerprint: '+d.source,'',
  '**Accounts:** 500 E1-born, E2 legitimately unlocked '+d.cohort.legitimateE2+
  ', E5 legitimately unlocked '+d.cohort.legitimateE5,'',
  '| E | Accounts | Normal solo | Group 2–4 | Group 5+ | Elite all | Boss all |',
  '|---:|---:|---|---|---|---|---|'];
 for(const r of d.levels)out.push('| E'+r.E+' | '+r.accountsReached+
  ' | '+[r.solo,r.small,r.swarm,r.elite,r.boss].map(fmt).join(' | ')+' |');
 out.push('','## Eight native named Elites: resolved win rates by Expedition','',
  '| Elite | E1 | E2 | E3 | E4 | E5 |',
  '|---|---|---|---|---|---|');
 for(const id of E)out.push('| '+id+' | '+d.levels.map(r=>fmt(r.byElite[id])).join(' | ')+' |');
 out.push('','## Limits and calibration policy','',
  ...d.limits.map(x=>'- '+x),'',
  'Targets for typical natural progression: 80–90% normal encounter wins, 60–70% Elite wins, 35–45% Boss wins; these are ACCEPTANCE TARGETS, not guaranteed by this single stat update. Larger groups need dedicated count-wise acceptance bands.','');
 return out.join('\n');
}
function main(argv=process.argv.slice(2)){
 const cfg=options(argv),d=cfg.mode==='cohort'?cohort(cfg):aggregate(
  fs.readdirSync(cfg.inputs).filter(x=>/^v013-stage637-cohort-\d+-\d+\.json$/.test(x))
   .map(name=>JSON.parse(fs.readFileSync(path.join(cfg.inputs,name),'utf8'))));
 fs.mkdirSync(path.dirname(cfg.out),{recursive:true});
 fs.writeFileSync(cfg.out,JSON.stringify(d,null,2)+'\n');
 if(cfg.mode==='aggregate')fs.writeFileSync(cfg.out.replace(/\.json$/,'.md'),markdown(d)+'\n');
 console.log('STAGE637='+JSON.stringify(cfg.mode==='aggregate'?d.cohort:{
  accounts:d.accounts.length,complete:d.complete,seed:cfg.seed,batch:cfg.batch}));
 return d;
}
module.exports={E,F,LV,options,cohort,aggregate,markdown,main};
if(require.main===module){try{main();}catch(e){console.error('STAGE637_ERROR '+String(e.stack||e));process.exitCode=1;}}
