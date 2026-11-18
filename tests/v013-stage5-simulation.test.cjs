'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const S=require('../scripts/simulate-progression.cjs');
test('Stage 5 CLI accepts real Conditions mode and refuses nonexistent mode',()=>{
 const opts=S.parseArgs(['--mode=conditions','--levels=1','--seeds=9101,9102','--builds=blood-fury','--gear=current']);
 assert.equal(opts.mode,'conditions');assert.deepEqual(opts.levels,[1]);assert.deepEqual(opts.seeds,[9101,9102]);
 assert.throws(()=>S.parseArgs(['--mode=conditions-fake']));
});
test('Stage 5 simulator exercises each real Realm Card with deterministic conditions and actual combat',()=>{
 const opts={...S.DEFAULTS,mode:'conditions',levels:[15],seeds:[9101],builds:['blood-fury'],tickLimit:4500};
 const a=S.simulate(opts),b=S.simulate(opts);
 assert.equal(a.summary.cases,3);
 assert.deepEqual(a.rows,b.rows,'Condition comparisons must be repeatable with same seeds');
 assert.equal(new Set(a.rows.map(x=>x.risk)).size,3,'All three real risk tiers must be simulated');
 assert.equal(new Set(a.rows.map(x=>x.conditionId)).size,3,'Different Conditions are offered');
 assert(a.rows.every(x=>x.conditionId&&Number.isFinite(x.seconds)&&x.rooms?.length>0));
 assert.equal(a.summary.timeouts,0,'The real combat engine must not stall');
 assert.equal(a.summary.errors,0,'The natural chosen route should not crash or silently lose rewards');
});
