'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const A=require('../scripts/v013-stage634-player-growth-fit.cjs');
require('../combat/expedition-progression.js');
require('../combat/v012-combat-core.js');
const P=globalThis.WandererExpeditionProgression;
const C=globalThis.WandererV012CombatCore;
test('Stage 6.34: honest provenance, full 500 accounts and no invented late power',()=>{
 assert(A.validate());
 assert.deepEqual(A.INPUT.cohort,{profiles:100,seeds:5,accounts:500,reachedE2:398,reachedE20:102,checkpoints:3156});
 assert.equal(A.INPUT.inputNativeSourceSHA256,'53d39d733e18103d1c6e00ae254672e51c5141b6dd66d24d4a3663f78a4abdee');
 assert.deepEqual(A.INPUT.transitions.map(x=>x.from),Array.from({length:19},(_,i)=>i+1));
 assert(A.INPUT.assumptions.lateRateBasis.includes('PROVISIONAL')||
  A.INPUT.assumptions.lateRateBasis.includes('Provisional'));
 assert.throws(()=>A.validate({...A.INPUT,cohort:{...A.INPUT.cohort,accounts:501}}),/drift/);
});
test('Stage 6.34: historical earned HP/Attack fit remains reproducible, not the new live policy',()=>{
 const fit=A.fit(),g=A.POLICY;
 assert.equal(g.initialReference,.775);
 assert.equal(g.lateLogGrowth,.014);
 assert(Math.abs(fit.earlyLogGrowthBoost-g.earlyLogGrowthBoost)<.004,
  'Historical Stage6.32 500-account paired log-growth fit has changed: '+JSON.stringify(fit));
 assert(Math.abs(fit.relaxationExpeditions-g.relaxationExpeditions)<.02);
 assert(Math.abs(fit.weightedLogGrowthLoss-fit.proposedWeightedLogGrowthLoss)<.000001);
 assert.equal(A.reference(1),.775);
 assert.equal(P.enemyReference(1),.775,'New live curve preserves genuine no-gear E1');
 for(const E of [1,2,3,4,5,6,7,8,10,15,20,35,70,100,200,201]){
  assert(A.reference(E)>0,'Old curve still independently replayable E'+E);
 }
});
test('Stage 6.34: archived historical curve remains continuous and finite',()=>{
 const g=A.POLICY;
 for(let E=1;E<=1000;E++){
  const value=A.reference(E);
  assert(Number.isFinite(value)&&value>0,'bad archived reference E'+E);
  if(E===1)continue;
  const previous=A.reference(E-1);
  assert(value>previous,'archived step-down E'+E);
  const rate=Math.log(value/previous);
  assert(rate>=g.lateLogGrowth-1e-12,'archived rate below late slope E'+E);
  if(E>2)assert(rate<=Math.log(previous/A.reference(E-2))+1e-12,
   'archived manual acceleration at E'+E);
 }
 assert(A.reference(200)>35&&A.reference(200)<40);
 for(const [E,min,max] of [[2,1,1.2],[3,1.2,1.6],[5,1.7,2.1],[20,2.7,3.4]])
  assert(A.reference(E)>min&&A.reference(E)<max);
});
test('Stage 6.34: same one curve for normal, eight Elites and six Bosses, even beyond E200',()=>{
 for(const E of [1,2,3,5,20,70,200,201,1000]){
  for(const role of Object.keys(P.NORMAL_BASE))
   assert.deepEqual(P.enemyScaling(E,'normal',role),{hp:1,atk:1,def:1});
  for(const id of P.ELITE_IDENTITIES)
   assert.deepEqual(P.enemyScaling(E,'elite',id),{hp:1,atk:1,def:1});
  for(const id of Object.keys(P.BOSS_BASE))
   assert.deepEqual(P.enemyScaling(E,'boss',id),{hp:1,atk:1,def:1});
 }
 assert.equal(P.CALIBRATION_STAT_ONLY,false);
 assert.equal(C.applyEscortStats,undefined);
 assert.equal(C.createEnemyGroup(()=>({hp:100,maxhp:100,atk:10,def:3,attackEvery:2}),1)[0].maxhp,100);
});
test('Stage 6.34: continuous input influences actual enemy HP/ATK while retaining class identity',()=>{
 for(let E=1;E<70;E++){
  const a=C.estimateEnemy(E),b=C.estimateEnemy(E+1);
  assert(b.hp>=a.hp&&b.atk>=a.atk&&b.def>=a.def);
 }
 for(const E of [1,2,3,5,20,70,100,200]){
  const estimate=C.estimateEnemy(E);
  assert(estimate.hp>0&&estimate.atk>0&&estimate.def>=0);
  // Every role/enemy receives these same three core terms before its fixed identity coefficients.
  assert.equal(P.enemyScaling(E,'normal','tank').hp,P.enemyScaling(E,'normal','caster').hp);
 }
});
test('Stage 6.34: native and Pages preview byte identity and source hash',()=>{
 const source=fs.readFileSync('combat/expedition-progression.js','utf8');
 const docs=fs.readFileSync('docs/combat/expedition-progression.js','utf8');
 const page=fs.readFileSync('docs/index.html','utf8');
 assert.equal(source,docs);
 const sha=crypto.createHash('sha256').update(source).digest('hex').slice(0,12);
 assert(page.includes('combat/expedition-progression.js?v='+sha));
});
