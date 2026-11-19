'use strict';
// Stage 9.8: substantive native combat study. NEVER alters gameplay.
// Every selected Tank/Elite pair still runs two genuine same-seed combats.
const fs=require('node:fs'),path=require('node:path');
const S=require('./simulate-progression.cjs');
const C=require('./v013-elite-tank-parity.cjs');
const A=require('./v013-combat-balance-audit.cjs');
const N=require('./v013-natural-progression.cjs');
const TYPES=A.ALL_ELITES;
const BUILDS=S.BUILDS.map(b=>b.id);
const FAMILIES=A.ALL_BOSSES;
const round=(x,d=2)=>Number(x.toFixed(d));
const mean=a=>a.length?round(a.reduce((x,y)=>x+y,0)/a.length):null;
function parseArgs(args=process.argv.slice(2)){
 const opts={mode:null,gear:'starter',target:30,seedStart:15000,scan:3600,
  affinity:'blood',seeds:30,builds:['blood-fury','aegis-vitality','magic-decay'],
  risks:[0,1,2],groupSizes:[3,12],profiles:['cautious','balanced'],
  maxAttempts:6,output:null,inputs:null};
 for(const arg of args){
  const m=/^--([a-z-]+)=(.+)$/.exec(arg);
  if(!m)throw Error('Expected --key=value: '+arg);
  const [,k,v]=m;
  if(k==='mode'&&['elites','bosses','builds','natural','summarize'].includes(v))opts.mode=v;
  else if(k==='gear'&&['starter','common'].includes(v))opts.gear=v;
  else if(k==='target'||k==='seed-start'||k==='scan'||k==='seeds'||k==='max-attempts'){
   opts[k==='seed-start'?'seedStart':k==='max-attempts'?'maxAttempts':k]=Number(v);
  }else if(k==='affinity'&&FAMILIES.includes(v))opts.affinity=v;
  else if(k==='builds'||k==='profiles')opts[k]=[...new Set(v.split(','))];
  else if(k==='risks'||k==='group-sizes')opts[k==='risks'?'risks':'groupSizes']=v.split(',').map(Number);
  else if(k==='out')opts.output=v;
  else if(k==='inputs')opts.inputs=v;
  else throw Error('Unsupported option: '+arg);
 }
 if(!opts.mode)throw Error('--mode required');
 if(!Number.isSafeInteger(opts.seedStart)||opts.seedStart<1||opts.seedStart>4000000000||
  !Number.isSafeInteger(opts.target)||opts.target<1||opts.target>60||
  !Number.isSafeInteger(opts.scan)||opts.scan<1||opts.scan>10000||
  !Number.isSafeInteger(opts.seeds)||opts.seeds<1||opts.seeds>100||
  !Number.isSafeInteger(opts.maxAttempts)||opts.maxAttempts<1||opts.maxAttempts>12)
  throw Error('Invalid bounded campaign integers');
 if(opts.builds.some(id=>!BUILDS.includes(id))||!opts.builds.length||
  opts.profiles.some(id=>!N.PROFILES[id])||!opts.profiles.length||
  opts.risks.some(id=>![0,1,2].includes(id))||!opts.risks.length||
  opts.groupSizes.some(id=>!Number.isSafeInteger(id)||id<2||id>22)||!opts.groupSizes.length)
  throw Error('Invalid build, profile, risk or mob count');
 if(opts.output!==null&&!opts.output.endsWith('.json'))throw Error('--out must be JSON');
 if(opts.mode==='summarize'&&!opts.inputs)throw Error('--inputs required to summarize');
 if(opts.mode==='natural'&&opts.profiles.length*2*opts.maxAttempts*8>192)
  throw Error('Natural native account cohort exceeds 192 potential attempts');
 if(opts.mode==='bosses'&&opts.seeds*opts.builds.length*opts.risks.length>500)
  throw Error('Boss cohort exceeds 500 native controlled fights');
 if(opts.mode==='builds'&&opts.seeds*opts.builds.length*opts.groupSizes.length>600)
  throw Error('Build cohort exceeds 600 native controlled fights');
 return opts;
}
function distinctSeedList(opts,n=opts.seeds){
 // The Boss matching engine searches up to 48 adjacent seeds. A gap of 100
 // ensures distinct resolved native seeds across trials and across cohorts.
 return Array.from({length:n},(_,i)=>opts.seedStart+i*100);
}
function integrity(result,errors=[],other=[]){
 return {source:S.sourceFingerprint().sha256,
  errors:errors.length,detail:errors.slice(0,10),warnings:other};
}
function runElites(opts,deps={}){
 const inspect=deps.scenario||C.scenario;
 const counts=Object.fromEntries(TYPES.map(t=>[t,0]));
 const pairs=[],errors=[];let skippedNotTank=0,skippedCapped=0,inspected=0;
 for(let offset=0;offset<opts.scan&&TYPES.some(t=>counts[t]<opts.target);offset++){
  const seed=opts.seedStart+offset;
  try{
   const tankPeek=inspect(seed,'tank',opts.gear,{inspectOnly:true});
   inspected++;
   if(tankPeek.initial.role!=='tank'){skippedNotTank++;continue;}
   const elitePeek=inspect(seed,'elite',opts.gear,{inspectOnly:true});
   const type=elitePeek.initial.eliteType;
   if(!TYPES.includes(type))throw Error('Unknown native Elite archetype '+type);
   if(counts[type]>=opts.target){skippedCapped++;continue;}
   const tank=inspect(seed,'tank',opts.gear);
   const elite=inspect(seed,'elite',opts.gear);
   if(tank.family!==elite.family||tank.family!==tankPeek.family||
      tank.initial.role!=='tank'||elite.initial.role!=='miniboss'||
      elite.initial.eliteType!==type||
      tank.initial.playerHp!==elite.initial.playerHp||
      tank.initial.playerMaxHp!==elite.initial.playerMaxHp||
      !tank.gearFingerprint||!elite.gearFingerprint)
    throw Error('Native matched-pair mismatch at seed '+seed);
   if(!['win','death'].includes(A.status(tank))||
      !['win','death'].includes(A.status(elite)))
    throw Error('Unresolved native pair at seed '+seed);
   pairs.push({seed,gear:opts.gear,family:tank.family,tank,elite});
   counts[type]++;
  }catch(e){errors.push({seed,error:e.message});}
 }
 const analyzed=A.pairedGroups({pairs,errors,skippedNonTank:skippedNotTank});
 const groups=analyzed.groups.filter(g=>g.gear===opts.gear);
 const complete=TYPES.every(t=>counts[t]>=opts.target);
 const warnings=TYPES.filter(t=>counts[t]<opts.target).map(t=>'insufficient_'+t+'_'+counts[t]);
 const coverage={targetPerArchetype:opts.target,perArchetype:counts,
  nativePairs:pairs.length,inspected,skippedNotTank,skippedCapped,
  completed:complete};
 const failure=errors.length||analyzed.invalidPairs.length?true:!complete;
 return {stage:'9.8',mode:'elites',gear:opts.gear,sourceSha256:S.sourceFingerprint().sha256,
  input:{seedStart:opts.seedStart,scan:opts.scan,target:opts.target},
  coverage,groups,errors,invalidPairs:analyzed.invalidPairs,warnings,
  success:!failure,pairs,limits:['Only native true-roster solo Tanks paired to seeded Elite archetypes',
  'Player actions use the existing balanced native target policy, not human play',
  '30 true same-seed pairs per archetype are diagnostic, not a precise universal difficulty target']};
}
function summarizeNative(rows){
 return A.controlledGroups(rows);
}
function runBosses(opts,deps={}){
 const sim=deps.simulate||S.simulate;
 const seeds=distinctSeedList(opts);
 const matrix={...S.DEFAULTS,mode:'bosses',levels:[1],seeds,
  builds:opts.builds,affinities:[opts.affinity],risks:opts.risks,
  points:0,rarity:'Common',gear:'current',runes:false,targetPolicy:'mechanics'};
 const raw=sim(matrix),groups=summarizeNative(raw.rows),errors=raw.rows.filter(r=>A.status(r)==='error'),
  unresolved=raw.rows.filter(r=>['timeout','unresolved'].includes(A.status(r)));
 const cells=opts.builds.flatMap(build=>opts.risks.map(risk=>{
  const found=groups.find(g=>g.mode==='bosses'&&g.build===build&&
   g.affinity===opts.affinity&&g.risk===risk);
  return {build,risk,independent:found?.independent||0,
   winPct:found?.winPct??null,winWilson95:found?.winWilson95??null,
   deaths:found?.deaths??null,secondsP50:found?.secondsP50??null,
   damagePctMaxHpMean:found?.damagePctMaxHpMean??null,
   bossHealingMean:found?.bossHealingMean??null,
   flags:found?.flags||['missing_boss_cell']};
 }));
 const success=!errors.length&&!unresolved.length&&
  cells.every(x=>x.independent>=opts.seeds);
 return {stage:'9.8',mode:'bosses',affinity:opts.affinity,
  sourceSha256:raw.sourceSha256,settings:{seeds,builds:opts.builds,risks:opts.risks},
  coverage:{planned:seeds.length*opts.builds.length*opts.risks.length,
   observed:raw.rows.length,errors:errors.length,unresolved:unresolved.length,
   independentByCell:cells.map(x=>x.independent),complete:success},
  success,cells,groups,errors,unresolved,warnings:[
   'Native Boss forced into first-ring room, with actual Affinity/ability/condition',
   'E1 Common equipment and zero synthetic talent points; not a natural route',
   'Boss preparation and pre-Boss attrition are separately examined in earned-account runner'
  ],rows:raw.rows};
}
function runBuilds(opts,deps={}){
 const sim=deps.simulate||S.simulate;
 const seeds=distinctSeedList(opts);
 const raw=sim({...S.DEFAULTS,mode:'enemies',levels:[1],seeds,
  builds:opts.builds,groupSizes:opts.groupSizes,
  points:0,rarity:'Common',gear:'current',runes:false,targetPolicy:'mechanics'});
 const errors=raw.rows.filter(r=>A.status(r)==='error'),
  unresolved=raw.rows.filter(r=>['timeout','unresolved'].includes(A.status(r)));
 const cells=opts.builds.flatMap(build=>opts.groupSizes.map(groupSize=>{
  const subset=raw.rows.filter(r=>r.build===build&&r.groupSize===groupSize&&
   ['win','death'].includes(A.status(r)));
  const unique=new Map(subset.map(r=>[r.resolvedSeed??r.seed,r]));
  const rows=[...unique.values()],won=rows.filter(r=>r.won).length;
  return {build,groupSize,independent:rows.length,
   winPct:rows.length?round(100*won/rows.length,1):null,
   winWilson95:A.wilson(won,rows.length),
   damageTakenMean:mean(rows.map(r=>r.damageTaken)),
   secondsP50:A.percentile(rows.map(r=>r.seconds),.5),
   minHpPctP50:A.percentile(rows.map(r=>r.minHpPct),.5),
   nativeAffinities:[...new Set(rows.map(r=>r.affinity))].sort()};
 }));
 const success=!errors.length&&!unresolved.length&&
  cells.every(x=>x.independent>=opts.seeds);
 return {stage:'9.8',mode:'builds',sourceSha256:raw.sourceSha256,
  settings:{seeds,builds:opts.builds,groupSizes:opts.groupSizes},
  coverage:{planned:seeds.length*opts.builds.length*opts.groupSizes.length,
   observed:raw.rows.length,errors:errors.length,unresolved:unresolved.length,
   complete:success},success,cells,errors,unresolved,
  warnings:['Native E1 starter-equivalent Common gear with zero talent points',
   'Realm Affinity may differ across weapon/build; observational cross-build comparison, not a perfectly paired causal experiment',
   'Not natural loot/build progression and not a human player success percentage'],
  rows:raw.rows};
}
function runNatural(opts,deps={}){
 const run=deps.run||N.run;
 const seeds=[opts.seedStart,opts.seedStart+1000];
 const cfg=N.parseArgs(['--seeds='+seeds.join(','),
  '--profiles='+opts.profiles.join(','),
  '--max-level=8','--max-attempts='+opts.maxAttempts]);
 const r=run(cfg),accounts=r.accounts||[],errors=r.coverage?.errors||0;
 const levels=r.levels.map(x=>({
  level:x.level,accountsReached:x.accountsReached,attempts:x.attempts,
  wins:x.wins,deaths:x.deaths,extractions:x.extractions,
  bossReached:x.bossReached,eliteFights:x.eliteFights,eliteWins:x.eliteWins,
  ordinaryGreyDrops:x.ordinaryGreyDrops,
  observation:x.observations
 }));
 return {stage:'9.8',mode:'natural',sourceSha256:r.source,
  settings:{seeds,profiles:opts.profiles,maxAttempts:opts.maxAttempts,maxLevel:8},
  coverage:{accounts:accounts.length,attempts:r.coverage.attempts,
   errors,completedE8:r.coverage.completedE8,
   maxEReached:Math.max(0,...levels.filter(x=>x.accountsReached>0).map(x=>x.level)),
   valid:errors===0},success:errors===0,levels,
  warnings:['Real persisted native-account decisions, XP and loot, no free unlock',
   'E2–E8 with no reached accounts are CENSORED; never infer zero win rate',
   'Cautious/Balanced heuristic agents are not human playtests'],
  accounts};
}
function allReports(root){
 const out=[];
 function walk(folder){
  if(!fs.existsSync(folder))return;
  for(const item of fs.readdirSync(folder,{withFileTypes:true})){
   const file=path.join(folder,item.name);
   if(item.isDirectory())walk(file);
   else if(item.name.endsWith('.json')){
    try{const report=JSON.parse(fs.readFileSync(file,'utf8'));
     if(report.stage==='9.8'&&report.mode!=='summarize')out.push({file,report});
    }catch(e){out.push({file,error:e.message});}
   }
  }
 }
 walk(root);return out;
}
function aggregate(reports,expected={eliteGear:2,bosses:6,builds:1,natural:4}){
 const kinds=Object.fromEntries(['elites','bosses','builds','natural'].map(k=>
  [k,reports.filter(x=>x.report?.mode===k)]));
 const failures=reports.filter(x=>x.error).map(x=>x.file+': '+x.error);
 const source=[...new Set(reports.map(x=>x.report?.sourceSha256).filter(Boolean))];
 if(source.length!==1)failures.push('Source SHA-256 drift across campaign jobs');
 for(const [kind,need] of Object.entries({elites:expected.eliteGear,bosses:expected.bosses,
  builds:expected.builds,natural:expected.natural})){
  if(kinds[kind].length!==need)failures.push(kind+' coverage '+kinds[kind].length+'/'+need);
  for(const item of kinds[kind])if(!item.report.success)
   failures.push(kind+' failed: '+path.basename(item.file));
 }
 const elite=kinds.elites.flatMap(x=>x.report.groups||[]).filter(g=>g.eliteType!=='all');
 const boss=kinds.bosses.flatMap(x=>x.report.cells||[]).map(c=>({
  affinity:kinds.bosses.find(y=>(y.report.cells||[]).includes(c))?.report.affinity,...c}));
 const builds=kinds.builds.flatMap(x=>x.report.cells||[]);
 const natural=kinds.natural.flatMap(x=>(x.report.levels||[]).map(c=>({
  shard:path.basename(x.file),...c
 })));
 const summary={
  stage:'9.8',mode:'summarize',sourceSha256:source[0]||null,
  coverage:{jobs:reports.length,elites:kinds.elites.length,
   elitePairs:kinds.elites.reduce((n,x)=>n+x.report.coverage.nativePairs,0),
   bosses:kinds.bosses.length,bossFights:kinds.bosses.reduce((n,x)=>n+x.report.coverage.observed,0),
   buildFights:kinds.builds.reduce((n,x)=>n+x.report.coverage.observed,0),
   naturalAccounts:kinds.natural.reduce((n,x)=>n+x.report.coverage.accounts,0),
   naturalAttempts:kinds.natural.reduce((n,x)=>n+x.report.coverage.attempts,0),
   naturalReachedE8:kinds.natural.reduce((n,x)=>n+x.report.coverage.completedE8,0)},
  elite,bosses:boss,builds,natural,
  failures,success:!failures.length
 };
 return summary;
}
function markdown(report){
 const lines=['# Wanderer Stage 9.8 — Native combat balance research','',
  'Runtime SHA256: '+(report.sourceSha256||'n/a'),'',
  '## Coverage','',JSON.stringify(report.coverage),'',
  '## True native Tank versus Elite — independent E1 matched seeds','',
  '| Gear | Elite | Matched pairs | Tank victories | Elite victories | Extra Elite damage (HP) |',
  '|---|---|---:|---:|---:|---:|'];
 for(const x of report.elite||[])lines.push('| '+x.gear+' | '+x.eliteType+
  ' | '+x.resolvedPairs+' | '+x.tankWins+' | '+x.eliteWins+' | '+x.extraEliteDamageMean+' |');
 lines.push('','## Six native Boss Affinities by risk and build','',
  '| Boss Affinity | Build | Risk | Independent | Win % | Damage as % max HP |',
  '|---|---|---:|---:|---:|---:|');
 for(const x of report.bosses||[])lines.push('| '+x.affinity+' | '+x.build+
  ' | '+x.risk+' | '+x.independent+' | '+x.winPct+' | '+x.damagePctMaxHpMean+' |');
 lines.push('','## Weapon/build contrasts','',
  '| Build | Mob count | Independent | Wins % | Damage taken |',
  '|---|---:|---:|---:|---:|');
 for(const x of report.builds||[])lines.push('| '+x.build+' | '+x.groupSize+
  ' | '+x.independent+' | '+x.winPct+' | '+x.damageTakenMean+' |');
 lines.push('','## Earned-account natural E1–E8','',
  '| Shard | E | Accounts reached | Attempts | Boss wins | Deaths | Extracts |',
  '|---|---:|---:|---:|---:|---:|---:|');
 for(const x of report.natural||[])lines.push('| '+x.shard+' | '+x.level+
  ' | '+x.accountsReached+' | '+x.attempts+' | '+x.wins+' | '+x.deaths+' | '+x.extractions+' |');
 lines.push('','## Data quality','',
  'Failures: '+(report.failures.join('; ')||'none'),
  'Never infer natural E2–E8 defeat rates from zero reached accounts.',
  'Controlled E1 fights are not representative earned-account/Boss progression.',
  'Do not retune individual archetypes solely from pooled means.',
  '');
 return lines.join('\n');
}
function save(report,filename){
 const dest=path.resolve(process.cwd(),filename);
 fs.mkdirSync(path.dirname(dest),{recursive:true});
 fs.writeFileSync(dest,JSON.stringify(report,null,2)+'\n');
 fs.writeFileSync(dest.replace(/\.json$/,'.md'),markdown(report));
 return dest;
}
function main(args=process.argv.slice(2)){
 const opts=parseArgs(args);
 const result=opts.mode==='elites'?runElites(opts):opts.mode==='bosses'?runBosses(opts):
  opts.mode==='builds'?runBuilds(opts):opts.mode==='natural'?runNatural(opts):
  aggregate(allReports(path.resolve(process.cwd(),opts.inputs)));
 const name=opts.output||'reports/v013-stage98-'+opts.mode+'-'+
  (opts.mode==='elites'?opts.gear:opts.mode==='bosses'?opts.affinity:String(opts.seedStart))+'.json';
 const dest=save(result,name);
 const brief={
  mode:result.mode,success:result.success,coverage:result.coverage,
  elite:result.mode==='elites'?result.groups.map(g=>({elite:g.eliteType,n:g.resolvedPairs,
   tankWins:g.tankWins,eliteWins:g.eliteWins,damageDelta:g.extraEliteDamageMean})):undefined,
  boss:result.mode==='bosses'?result.cells.map(g=>({build:g.build,risk:g.risk,n:g.independent,
   wins:g.winPct,damage:g.damagePctMaxHpMean})):undefined,
  builds:result.mode==='builds'?result.cells.map(g=>({build:g.build,size:g.groupSize,
   n:g.independent,wins:g.winPct})):undefined,
  natural:result.mode==='natural'?result.levels:undefined,
  errors:result.errors?.slice(0,3),
  failures:result.failures,out:dest
 };
 console.log('STAGE98_RESULTS='+JSON.stringify(brief));
 if(!result.success)process.exitCode=1;
 return result;
}
module.exports={TYPES,BUILDS,FAMILIES,parseArgs,distinctSeedList,runElites,runBosses,
 runBuilds,runNatural,allReports,aggregate,markdown,main};
if(require.main===module)main();
