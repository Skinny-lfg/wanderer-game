'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const E=require('../scripts/v013-stage617-roster-ablation.cjs');
const T=globalThis.WandererAutomaticTalents;

test('Five pre-registered native mob ablation arms are distinct and limited',()=>{
 assert.deepEqual(E.ARMS,['four_native','six_native','six_three_principals',
  'six_small_group_scaling','six_both']);
 assert.equal(new Set(Object.values(E.VARIANT_SHA)).size,4);
 assert.equal(E.rosterSource('four_native'),E.NATIVE_SOURCE);
 assert.equal(E.rosterSource('six_native'),E.NATIVE_SOURCE);
 assert.match(E.rosterSource('six_three_principals'),/count===6\?3:/);
 assert.match(E.rosterSource('six_small_group_scaling'),/count>=6&&count!==6/);
 assert.doesNotMatch(E.rosterSource('six_three_principals'),/count>=6&&count!==6/);
 assert.doesNotMatch(E.rosterSource('six_small_group_scaling'),/count===6\?3:/);
 assert.match(E.rosterSource('six_both'),/count===6\?3:/);
 assert.match(E.rosterSource('six_both'),/count>=6&&count!==6/);
 assert.throws(()=>E.rosterSource('buff-all'),/Unknown/);
});
test('Pilot is a disjoint seeded subset of full and uses legal native players',()=>{
 const pilot=E.plan(E.DEFAULTS);
 const full=E.plan({...E.DEFAULTS,seedsPerCell:4});
 assert.equal(pilot.sets,96);assert.equal(pilot.fights,480);
 assert.equal(full.sets,192);assert.equal(full.fights,960);
 assert.equal(new Set(full.rows.map(x=>x.seed)).size,192);
 for(const row of full.rows){
  assert(T.valid(row.talents));
  assert.equal(T.earned(row.talents),row.budget);
 }
 for(const row of pilot.rows){
  const matching=full.rows.find(x=>x.id===row.id);
  assert(matching);
  assert.deepEqual(matching.talents,row.talents);
  assert.deepEqual(matching.gear,row.gear);
 }
});
test('Five arms use identical native player/gear/Talents/seed/condition and real combat',()=>{
 const row=E.plan({...E.DEFAULTS,seedsPerCell:1}).rows[0];
 const matched=E.matched(row,{...E.DEFAULTS,seedsPerCell:1});
 assert.equal(Object.keys(matched.arms).length,5);
 assert.equal(Object.keys(matched.checks).length,8);
 assert(Object.values(matched.checks).every(Boolean));
 for(const arm of E.ARMS){
  const a=matched.arms[arm];
  assert.equal(a.roster.length,a.count);
  assert.equal(a.won||a.died,true);
  assert.equal(a.moduleSha,E.VARIANT_SHA[arm]);
 }
 for(const arm of ['six_three_principals','six_both']){
  const x=matched.arms[arm].roles;
  assert.equal(x.minion,3);
  assert.equal(x.tank+x.skirmisher+x.caster,3);
 }
 const s=E.summary([matched]);
 assert.equal(s.actualFights,5);
 assert.equal(s.verified,1);
 assert.equal(s.byArm.six_native.n,1);
 assert.equal(s.byArm.four_native.n,1);
 assert.equal(s.paired.six_three_principals.damageMore+s.paired.six_three_principals.damageLess+s.paired.six_three_principals.identicalDamage,1);
});
test('Invalid scenario flags cannot silently change native risk, rarity or budgets',()=>{
 assert.throws(()=>E.parse(['--mode=balance']),/Unsupported|Invalid/);
 assert.throws(()=>E.parse(['--seeds-per-cell=99']),/Invalid/);
 assert.throws(()=>E.options({...E.DEFAULTS,risk:2}),/Invalid/);
 assert.throws(()=>E.options({...E.DEFAULTS,rarity:'Epic'}),/Invalid/);
 assert.throws(()=>E.options({...E.DEFAULTS,budgets:[12,24]}),/Invalid/);
 assert.throws(()=>E.options({...E.DEFAULTS,out:'../bad.json'}),/Invalid/);
});
