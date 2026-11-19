'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const B=require('../scripts/v013-stage98-balance-campaign.cjs');
const C=require('../scripts/v013-elite-tank-parity.cjs');

test('Stage 9.8 dimensions are validated and prohibit unbounded native workloads',()=>{
 const c=B.parseArgs(['--mode=bosses','--affinity=decay','--seeds=30',
  '--builds=blood-fury,aegis-vitality,magic-decay','--risks=0,1,2']);
 assert.deepEqual(c.builds,['blood-fury','aegis-vitality','magic-decay']);
 assert.deepEqual(B.distinctSeedList({...c,seedStart:2001},3),[2001,2101,2201]);
 for(const args of [
  [],['--mode=garbage'],['--mode=elites','--scan=10001'],
  ['--mode=elites','--target=0'],['--mode=bosses','--seeds=100'],
  ['--mode=builds','--seeds=100','--group-sizes=3,12,20'],['--mode=natural','--max-attempts=13'],
  ['--mode=summarize'],['--mode=elites','--gear=gold'],
  ['--mode=elites','--out=unsafe.txt']
 ])assert.throws(()=>B.parseArgs(args),args.join(' '));
});
test('inspect-only uses real native seed-generated roster without simulating a fight',()=>{
 const peek=C.scenario(9501,'tank','starter',{inspectOnly:true});
 const full=C.scenario(9501,'tank','starter');
 assert.equal(peek.inspected,true);
 assert.equal(peek.seed,full.seed);
 assert.equal(peek.family,full.family);
 assert.equal(peek.initial.role,full.initial.role);
 assert.equal(peek.initial.playerHp,full.initial.playerHp);
 assert.equal(peek.initial.hp,full.initial.hp);
 assert.equal(peek.gearFingerprint,true);
 assert.equal(peek.won,undefined);
});
test('stratified Elite sampler never forces an archetype or manufactures combat outcomes',()=>{
 const types=B.TYPES;
 const seedStart=1000;
 const calls=[];
 const scenario=(seed,kind,gear,opts={})=>{
  const subtype=types[(seed-seedStart)%types.length];
  calls.push({seed,kind,gear,inspectOnly:!!opts.inspectOnly});
  const initial={role:kind==='tank'?'tank':'miniboss',
   eliteType:kind==='elite'?subtype:null,playerHp:100,playerMaxHp:100};
  return {seed,gear,family:'blood',gearFingerprint:true,initial,
   ...(opts.inspectOnly?{inspected:true}:{
    won:kind==='tank',died:kind==='elite',
    status:kind==='tank'?'cleared':'died',
    seconds:kind==='tank'?20:15,damageTaken:kind==='tank'?30:100,
    hpLossFraction:kind==='tank'?.3:1
   })};
 };
 const cfg=B.parseArgs(['--mode=elites','--target=1','--scan=9',
  '--seed-start='+seedStart]);
 const r=B.runElites(cfg,{scenario});
 assert.equal(r.success,true);
 assert.equal(r.coverage.nativePairs,7);
 assert(B.TYPES.every(t=>r.coverage.perArchetype[t]===1));
 assert.equal(calls.filter(x=>!x.inspectOnly).length,14);
 assert.equal(r.errors.length,0);
 assert.equal(r.groups.filter(g=>g.eliteType!=='all').length,7);
});
test('native Boss cohort preserves risk/build cell separation and distinct resolved seeds',()=>{
 const cfg=B.parseArgs(['--mode=bosses','--affinity=blood','--seeds=2',
  '--builds=blood-fury,aegis-vitality','--risks=0']);
 const sim=o=>({
  sourceSha256:'native',
  rows:o.builds.flatMap(build=>o.seeds.map(seed=>({
   mode:'bosses',level:1,build,seed,resolvedSeed:seed,kind:'blood',
   affinity:'blood',bossAffinity:'blood',risk:0,groupSize:1,
   won:true,status:'cleared',seconds:14,damageTaken:33,
   damageDealt:50,hpMax:100,mpMax:20,minHpPct:67,
   pointsBudget:0,gearRarity:'Common',targetPolicy:'mechanics'
  })))
 });
 const r=B.runBosses(cfg,{simulate:sim});
 assert.equal(r.success,true);
 assert.equal(r.coverage.observed,4);
 assert.deepEqual(r.cells.map(x=>x.independent),[2,2]);
 assert.equal(r.cells[0].winPct,100);
});
test('real natural-account runner preserves censored levels instead of inventing E2–E8 outcomes',()=>{
 const cfg=B.parseArgs(['--mode=natural','--seed-start=9001']);
 const run=()=>({source:'native',accounts:Array(4).fill({}),
  coverage:{accounts:4,attempts:24,errors:0,completedE8:0},
  levels:Array.from({length:8},(_,i)=>({
   level:i+1,accountsReached:i===0?4:0,attempts:i===0?24:0,
   wins:0,deaths:i===0?3:0,extractions:i===0?21:0,
   bossReached:0,eliteFights:0,eliteWins:0,ordinaryGreyDrops:0,
   observations:i===0?null:'not_reached; do not infer win rate'
  }))});
 const r=B.runNatural(cfg,{run});
 assert.equal(r.success,true);
 assert.equal(r.coverage.maxEReached,1);
 assert.equal(r.levels[4].accountsReached,0);
 assert.match(r.levels[4].observation,/not_reached/);
});
test('consolidator requires complete cohorts and identical actual native source',()=>{
 const elite=gear=>({stage:'9.8',mode:'elites',gear,success:true,
  sourceSha256:'same',coverage:{nativePairs:210},groups:[]});
 const boss=affinity=>({stage:'9.8',mode:'bosses',affinity,success:true,
  sourceSha256:'same',coverage:{observed:270},cells:[]});
 const builds={stage:'9.8',mode:'builds',success:true,
  sourceSha256:'same',coverage:{observed:420},cells:[]};
 const natural={stage:'9.8',mode:'natural',success:true,
  sourceSha256:'same',coverage:{accounts:4,attempts:20,completedE8:0},levels:[]};
 const entries=[
  {file:'starter.json',report:elite('starter')},
  {file:'common.json',report:elite('common')},
  ...B.FAMILIES.map(a=>({file:a+'.json',report:boss(a)})),
  {file:'builds.json',report:builds},
  ...[1,2,3,4].map(i=>({file:'natural-'+i+'.json',report:natural}))
 ];
 const full=B.aggregate(entries);
 assert.equal(full.success,true);
 assert.equal(full.coverage.elitePairs,420);
 assert.equal(full.coverage.bossFights,1620);
 assert.equal(full.coverage.buildFights,420);
 assert.equal(full.coverage.naturalAccounts,16);
 const missing=B.aggregate(entries.slice(1));
 assert.equal(missing.success,false);
 assert(missing.failures.some(x=>x.includes('elites coverage')));
 const drift=B.aggregate(entries.map((x,i)=>i===1?{
  ...x,report:{...x.report,sourceSha256:'different'}}:x));
 assert(drift.failures.some(x=>x.includes('SHA-256 drift')));
});
