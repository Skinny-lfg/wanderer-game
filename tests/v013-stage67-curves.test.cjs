'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const A=require('../scripts/v013-stage67-enemy-curve-sweep.cjs');
const C=require('../scripts/v013-stage67-compare-curves.cjs');
const N=require('../scripts/v013-natural-progression.cjs');
test('Only the E6–E10 enemy reference can change in isolated variants',()=>{
 const refs=A.checkCurves();
 for(let E=1;E<=5;E++)for(const id of Object.keys(refs))assert.equal(refs[id][E-1],E);
 for(let E=6;E<=10;E++)
  assert(refs.baseline[E-1]<refs.mild[E-1]&&refs.mild[E-1]<refs.firm[E-1]&&refs.firm[E-1]<refs.linear[E-1]);
 assert.equal(refs.baseline[9],5.693);
 assert.equal(refs.mild[9],8);
 assert.equal(refs.firm[9],9.5);
 assert.equal(refs.linear[9],10);
});
test('Production source file is completely unchanged by the experimental override',()=>{
 const original=fs.readFileSync('combat/expedition-progression.js','utf8');
 assert.equal(A.sourceFor('baseline'),original);
 for(const id of ['mild','firm','linear']){
  assert.equal(A.sourceFor(id).length>0,true);
  assert.notEqual(A.sourceFor(id),original);
  assert(A.sourceFor(id).includes('level<=5?level:'));
 }
 assert.equal(fs.readFileSync('combat/expedition-progression.js','utf8'),original);
 assert.throws(()=>A.sourceFor('unknown'),/Unknown curve/);
});
test('Natural E1–E5 accounts are byte-identical even when the E6+ curve is overridden',()=>{
 const cfg=N.parseArgs(['--profiles=balanced,magic-fire','--seeds=9301','--max-level=6','--max-attempts=2','--max-total-attempts=8']);
 const baseline=A.summarize(N.run(cfg),'baseline');
 for(const id of ['mild','firm','linear']){
  const result=A.summarize(N.run(cfg,{moduleOverrides:{'combat/expedition-progression.js':A.sourceFor(id)}}),id);
  A.proveSamePreE6(baseline,result);
  assert.deepEqual(result.levels.slice(0,5).map(x=>x.clears),baseline.levels.slice(0,5).map(x=>x.clears));
 }
});
test('Native account reconciliation rejects modified E1 or pre-E6 earned gear',()=>{
 const key={seed:1,profile:'balanced',earlyHash:'same',E6Reached:true,firstE6:{spent:10,gear:'abc',xp:400,gold:20}};
 const a={id:'baseline',entries:[key]};
 A.proveSamePreE6(a,{id:'mild',entries:[{...key}]});
 assert.throws(()=>A.proveSamePreE6(a,{id:'mild',entries:[{...key,earlyHash:'altered'}]}),/E1-E5 diverged/);
 assert.throws(()=>A.proveSamePreE6(a,{id:'mild',entries:[{...key,firstE6:{...key.firstE6,xp:401}}]}),/E6 initial earned account changed/);
 assert.throws(()=>C.aggregate([]),/three distinct/);
});
test('Stage 6.7 scripts are diagnostic-only and do not write gameplay source or forge rewards',()=>{
 for(const file of ['scripts/v013-stage67-enemy-curve-sweep.cjs','scripts/v013-stage67-compare-curves.cjs']){
  const s=fs.readFileSync(file,'utf8');
  for(const forbidden of ['setUnlocked(','.makeItem(','.award(','.encounter(','.hp=0','fs.writeFileSync(PROGRESSION_FILE'])
   assert(!s.includes(forbidden),file+': '+forbidden);
 }
});

test('Real native 4500-tick stalemates are censored explicitly, never counted as death or win',()=>{
 const timeout={level:10,attempt:5,status:'error',error:'Native combat timeout',bossWon:false,
  rooms:[{roomType:'boss',timedOut:true,died:false,won:false,hpStart:150,hpEnd:140,hpMax:150,seconds:495}]};
 const prior=Array.from({length:9},(_,i)=>({level:i+1,attempt:1,status:'victory',
  bossWon:true,rooms:[]}));
 const account={seed:9703,profile:'plate-warden',startXp:0,initialGear:{total:3,starter:3},
  attempts:[...prior,timeout],reached:[1,2,3,4,5,6,7,8,9,10],endLevel:10};
 const run={coverage:{attempts:10,errors:1},accounts:[account],source:'mock'};
 // Synthetic unit fixture tests classification; actual cohorts are genuine native accounts.
 const result=A.summarize(run,'mild');
 assert.equal(result.errors,0);assert.equal(result.stalls.length,1);
 assert.equal(result.levels[9].clears,0);assert.equal(result.levels[9].kinds.boss.deaths,0);
 assert.equal(result.stalls[0].profile,'plate-warden');
 timeout.error='Invalid talent progress';
 assert.throws(()=>A.summarize(run,'mild'),/Non-timeout native runtime error/);
});
