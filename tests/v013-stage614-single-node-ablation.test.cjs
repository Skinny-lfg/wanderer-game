'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const M=require('../scripts/v013-stage614-single-node-ablation.cjs');
const T=globalThis.WandererAutomaticTalents;

test('Stage 6.14 derives genuine legal terminal-node and rank ablations from current v15 snapshots',()=>{
 const data=M.legalCandidates();
 assert.equal(data.sourceSnapshots,192);
 assert(data.eligible>100,'Expected multiple naturally legal one-purchase variants');
 assert(data.rejections.invalidAfterRemoval>0,'Removing required prerequisites must be rejected');
 assert(data.candidates.some(c=>c.rank>1),'Current graph exposes genuine ranked skill purchases');
 assert(data.candidates.some(c=>c.nodeKind!=='stat'));
 for(const x of data.candidates){
  assert(T.valid(x.before)&&T.valid(x.after),x.base);
  assert.equal(x.after.nodes.length,x.before.nodes.length+1);
  assert.equal(T.earned(x.before),x.budget);
  assert.equal(T.earned(x.after),x.budget);
  assert.deepEqual(x.before.element||'arcane',x.after.element||'arcane');
  assert.equal(x.before.prepared||null,x.after.prepared||null);
  assert(M.verifyAblation(x.before,x.after,x.target));
 }
});
test('A single node really differs: no second node, no prerequisite bypass, no free rank',()=>{
 const x=M.legalCandidates([24]).candidates.find(c=>c.nodeKind!=='stat');
 assert(x);
 assert.throws(()=>M.verifyAblation(x.after,x.before,x.target),/exactly one spent/);
 assert.throws(()=>M.verifyAblation(x.before,
  {...x.after,xp:x.after.xp+100},x.target),/XP/);
 const illegal={...x.after,nodes:[...x.after.nodes,'imaginary_node']};
 assert.throws(()=>M.verifyAblation(x.before,illegal,x.target),/Invalid|one spent/);
});
test('Six seeds per case, deterministic distinct seed coverage and representative weapon/realm/armor sampling',()=>{
 const p=M.plan({...M.DEFAULTS,mode:'matrix',cases:24,seedsPerCase:6,seedStart:614001});
 assert.equal(p.selected.length,24);
 assert.equal(p.rows.length,144);
 assert.equal(p.totalNativeFights,288);
 assert.equal(new Set(p.rows.map(x=>x.seed)).size,144);
 assert.equal(p.distinctNodes.length,24);
 assert.equal(p.budgets.length,4);
 assert.equal(p.families.length,6);
 assert.equal(p.encounters.length,3);
 assert.equal(p.armor.length,3);
 assert.equal(p.weapons.length,7);
 assert.equal(p.ranks,12,'Six-seed cohort must include exactly twelve rank upgrades');
 assert.equal(p.firstPurchases,12,'Other half must isolate first purchase of a new legal node');
 for(const c of p.selected){
  const rows=p.rows.filter(r=>r.caseId===c.caseId);
  assert.equal(rows.length,6);
  assert(rows.every(r=>r.beforeHash===c.beforeHash&&r.afterHash===c.afterHash));
  assert(rows.every(r=>r.spentAfter===r.spentBefore+1));
 }
 const q=M.plan({...M.DEFAULTS,mode:'matrix',cases:24,seedsPerCase:6,seedStart:614001});
 assert.deepEqual(p.rows.map(x=>x.id+'='+x.seed),q.rows.map(x=>x.id+'='+x.seed));
});
test('Native fixture differs ONLY in exact v15 Talent snapshot and fixes target policy',()=>{
 const x=M.plan({...M.DEFAULTS,cases:1,seedsPerCase:1}).rows[0];
 const a=M.fixture(x,x.before,M.DEFAULTS),b=M.fixture(x,x.after,M.DEFAULTS);
 assert.deepEqual(a.build,b.build);
 const {controlledTalents:_,...baseA}=a.options,{controlledTalents:__,...baseB}=b.options;
 assert.deepEqual(baseA,baseB);
 assert.equal(a.options.targetPolicy,'focus');
 assert.notDeepEqual(a.options.controlledTalents.nodes,b.options.controlledTalents.nodes);
 assert.equal(a.options.points,b.options.points);
});
test('One real paired combat holds all equipment, initial roster and seed fixed, with one unspent baseline point',()=>{
 const row=M.plan({...M.DEFAULTS,cases:1,seedsPerCase:1}).rows[0];
 const r=M.paired(row,M.DEFAULTS);
 assert.equal(r.sameNonTalentSetup,true);
 assert(Object.values(r.checks).every(Boolean));
 assert.equal(r.before.spent+1,r.after.spent);
 assert.equal(r.before.native.gearFingerprint,r.after.native.gearFingerprint);
 assert.equal(r.before.native.resolvedSeed,r.after.native.resolvedSeed);
 assert.deepEqual(r.before.native.roster,r.after.native.roster);
 assert.deepEqual(r.change.added,[row.target]);
 assert(['both-win','both-lose','baseline-only-win','node-only-win'].includes(r.outcome));
 assert(Number.isFinite(r.delta.durationSeconds));
});
test('Paired result refuses any equipment, seed, actor or unexpected point drift',()=>{
 const row=M.plan({...M.DEFAULTS,cases:1,seedsPerCase:1}).rows[0];
 const r=M.paired(row,M.DEFAULTS);
 const mutate=(k,v)=>({...r.after,native:{...r.after.native,[k]:v}});
 assert.throws(()=>M.assertMatched(r.before,mutate('gearFingerprint','bad'),row),/completeGear/);
 assert.throws(()=>M.assertMatched(r.before,mutate('resolvedSeed',99999),row),/sameSeed/);
 assert.throws(()=>M.assertMatched(r.before,mutate('roster',[]),row),/sameInitialEnemyRoster/);
 assert.throws(()=>M.assertMatched(r.before,mutate('pointsSpent',row.spentBefore+5),row),
  /exactlyOnePurchasedPoint/);
});
test('Repeated seeds are grouped by exact node and track both-win separately from flipped outcomes',()=>{
 const p=M.plan({...M.DEFAULTS,cases:1,seedsPerCase:2});
 const x=M.paired(p.rows[0],M.DEFAULTS),y=M.paired(p.rows[1],M.DEFAULTS);
 const s=M.summarize([x,y]);
 assert.equal(s.nativePairs,2);
 assert.equal(s.nativeFights,4);
 assert.equal(s.distinctAblations,1);
 assert.equal(s.uniqueNativeSeeds,2);
 assert.equal(s.caseResults[0].totalSeeds,2);
 assert.equal(s.caseResults[0].distinctSeeds,2);
 assert.equal(s.nodeOnlyWins+s.baselineOnlyWins+s.bothWin+s.bothLose,2);
});
test('Atomic checkpoint evidence rejects mutated source, plan and unverified match',()=>{
 const p=M.plan({...M.DEFAULTS,cases:1,seedsPerCase:1}),r=M.paired(p.rows[0],M.DEFAULTS);
 const input={stage:'6.14',configHash:'abc',plannedIds:[r.id]};
 const previous={...input,completed:1,results:[r]};
 assert.doesNotThrow(()=>M.checkpointGuard(previous,input));
 assert.throws(()=>M.checkpointGuard(previous,{...input,configHash:'new'}),/resume/);
 assert.throws(()=>M.checkpointGuard({...previous,results:[{...r,sameNonTalentSetup:false}]},input),/Invalid/);
 assert.throws(()=>M.checkpointGuard({...previous,results:[{...r,spentAfter:r.spentAfter+2}]},input),/Invalid/);
});
test('CLI rejects fake budgets, excessive seeded workloads, malformed syntax and incompatible modes',()=>{
 assert.throws(()=>M.parse(['--cases=1000']),/Invalid case/);
 assert.throws(()=>M.parse(['--seeds-per-case=99']),/Invalid native/);
 assert.throws(()=>M.parse(['--budgets=200']),/Invalid v15/);
 assert.throws(()=>M.parse(['--mode=production']),/Unknown/);
 assert.throws(()=>M.parse(['--out=invalid.txt']),/Unknown/);
 const x=M.parse(['--mode=matrix','--cases=24','--seeds-per-case=6']);
 assert.equal(x.mode,'matrix');assert.equal(x.cases*x.seedsPerCase,144);
});
