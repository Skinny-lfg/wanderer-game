'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const Q=require('../scripts/v013-stage613-matched-talents.cjs');
const T=globalThis.WandererAutomaticTalents;

test('Native v15 inventory has 48 archetypes at each requested controlled budget',()=>{
 const a=Q.talentInventory([12,24,36,60]);
 assert.equal(a.length,48*4);
 assert.equal(new Set(a.map(x=>x.archetype)).size,48);
 for(const x of a){
  assert(T.valid(x.talents),x.archetype);
  assert.equal(T.earned(x.talents),x.budget);
  assert.equal(x.talents.nodes.length,x.spent);
  if(x.prepared)assert(x.talents.nodes.includes(x.prepared));
 }
});
test('Pairs only change genuine native talents with EXACT SAME spent AND earned budget',()=>{
 const {pool}=Q.pairPool([12,24,36,60]);
 assert(pool.length>=100);
 for(const p of pool){
  assert.equal(p.left.budget,p.right.budget);
  assert.equal(p.left.spent,p.right.spent);
  assert.notEqual(p.left.hash,p.right.hash);
  assert(p.diff.added.length+p.diff.removed.length>=2||p.diff.changedElement);
  assert(T.valid(p.left.talents));assert(T.valid(p.right.talents));
 }
});
test('Budgeted strategy selection deterministic, not merely an unexecuted matrix claim',()=>{
 const a=Q.choosePairs([12,24,36,60],36,613001),
  b=Q.choosePairs([12,24,36,60],36,613001);
 assert.deepEqual(a.selected.map(x=>x.id),b.selected.map(x=>x.id));
 assert.equal(a.selected.length,36);
 assert.equal(new Set(a.selected.map(x=>x.id)).size,36);
 assert.equal(a.counts.encounter.boss,12);
 assert.equal(a.counts.encounter.elite,12);
 assert.equal(a.counts.encounter.normal,12);
 assert.equal(a.counts.armor.Cloth,12);
 assert.equal(a.counts.armor.Leather,12);
 assert.equal(a.counts.armor.Plate,12);
 assert(a.distinctArchetypes>=28);
 assert(Object.keys(a.counts.budget).length===4);
});
test('Each native paired fixture keeps 100% equipment and Buildcraft settings fixed',()=>{
 const plan=Q.choosePairs([24,36],2,613022).selected[0],
  left=Q.fixture(plan,plan.left.talents),right=Q.fixture(plan,plan.right.talents);
 assert.equal(JSON.stringify(left.build),JSON.stringify(right.build));
 assert.equal(left.seed,right.seed);
 assert.equal(left.encounter,right.encounter);
 assert.equal(left.family,right.family);
 const {controlledTalents:_a,...otherA}=left.options;
 const {controlledTalents:_b,...otherB}=right.options;
 assert.deepEqual(otherA,otherB);
 assert.notDeepEqual(left.options.controlledTalents.nodes,right.options.controlledTalents.nodes);
});
test('Native measured first paired fight has identical real gear, enemy roster, seed and combat RNG',()=>{
 const row=Q.choosePairs([12,24,36,60],1,613001).selected[0];
 const x=Q.pairedResult(row);
 assert(x.sameSetup);
 assert(Object.values(x.checks).every(Boolean));
 assert(x.left.native.gearFingerprint===x.right.native.gearFingerprint);
 assert(x.left.native.resolvedSeed===x.right.native.resolvedSeed);
 assert(x.left.native.armorType===x.right.native.armorType);
 assert(x.left.points===x.right.points&&x.left.spent===x.right.spent);
 assert(x.left.talentHash!==x.right.talentHash);
 assert(['both-win','both-lose','left-only-win','right-only-win'].includes(x.outcome));
 assert(Number.isFinite(x.delta.seconds));
});
test('Pair integrity rejects silent gear, roster, resolved seed and falsely identical talent changes',()=>{
 const row=Q.choosePairs([12],1,613001).selected[0];
 const x=Q.pairedResult(row);
 const a=x.left,b=x.right;
 const altered=(prop,val)=>({...b,native:{...b.native,[prop]:val}});
 assert.throws(()=>Q.comparable(a,altered('gearFingerprint','fake')),/fullGear/);
 assert.throws(()=>Q.comparable(a,altered('roster',[{name:'fake'}])),/sameRoster/);
 assert.throws(()=>Q.comparable(a,altered('resolvedSeed',999999)),/sameSeed/);
 assert.throws(()=>Q.comparable(a,{...b,talentHash:a.talentHash}),/differentTalents/);
});
test('Synthetic talent fixture rejects extra invested points and illegal weapon/off-hand',()=>{
 const row=Q.choosePairs([24],1,613001).selected[0];
 assert.throws(()=>Q.fixture({...row,spent:row.spent+1},row.left.talents),/equal-investment/);
 assert.throws(()=>Q.fixture({...row,weapon:'Staff',offhand:'Shield'},row.left.talents),/Invalid native gear/);
});
test('Checkpoint cannot silently mix different sources/settings or duplicated matched rows',()=>{
 const row=Q.choosePairs([12],1,613001).selected[0],
  x=Q.pairedResult(row),
  input={stage:'6.13',configHash:'same',plannedIds:[row.id]};
 const prior={stage:'6.13',configHash:'same',plannedIds:[row.id],completed:1,results:[x]};
 assert.doesNotThrow(()=>Q.checkpointGuard(prior,input));
 assert.throws(()=>Q.checkpointGuard(prior,{...input,configHash:'new'}),/resume/);
 assert.throws(()=>Q.checkpointGuard({...prior,plannedIds:['different']},input),/resume/);
 assert.throws(()=>Q.checkpointGuard({...prior,results:[{...x,sameSetup:false}]},input),/Unsafe/);
});
test('Invalid CLI budget and prohibited unbounded workloads are rejected',()=>{
 assert.throws(()=>Q.parse(['--pairs=10000']),/Paired budget/);
 assert.throws(()=>Q.parse(['--budgets=100']),/Unsupported/);
 assert.throws(()=>Q.parse(['--mode=unknown']),/Unknown/);
 const v=Q.parse(['--mode=matrix','--pairs=72','--budgets=24,36','--seed-start=613444']);
 assert.equal(v.pairs,72);assert.deepEqual(v.budgets,[24,36]);
});

test('Full 72-pair plan prevents armor-vs-enemy confounding and covers all catalog dimensions',()=>{
 const plan=Q.choosePairs([12,24,36,60],72,613001),rows=plan.selected;
 assert.equal(rows.length,72);
 assert.equal(plan.distinctArchetypes,48);
 assert.equal(plan.eligible,3637,'Live native graph/profile drift must trigger a review');
 assert.deepEqual([...new Set(rows.map(x=>x.weapon))].sort(),
  ['Bow','Daggers','Mace','Staff','Sword','Two-Handed','Wand'].sort());
 assert.equal(new Set(rows.map(x=>x.affinity)).size,6);
 assert.equal(new Set(rows.map(x=>x.budget)).size,4);
 for(const encounter of ['normal','elite','boss'])
  for(const armor of ['Cloth','Leather','Plate']){
   assert.equal(rows.filter(x=>x.encounter===encounter&&x.armor===armor).length,8,
    encounter+'/'+armor+' should use eight pairs exactly');
  }
 assert(rows.filter(x=>x.left.primary===x.right.primary).length>=60);
});
