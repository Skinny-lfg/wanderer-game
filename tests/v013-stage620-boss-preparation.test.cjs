'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const E=require('../scripts/v013-stage620-boss-preparation.cjs');
const H=require('../scripts/v013-stage615-enemy-hierarchy.cjs');
const T=globalThis.WandererAutomaticTalents;
test('Six real names, two policies, and four legal preparation-effect arms are pre-registered',()=>{
 assert.equal(Object.keys(E.BOSSES).length,6);
 assert.deepEqual(Object.keys(E.BOSSES),H.FAMILIES);
 assert.deepEqual(E.POLICIES,['focus','mechanics']);
 assert.deepEqual(E.STRATEGIES,['baseline','marked_elite','reliquary','both']);
 assert.equal(new Set(Object.values(E.BOSSES_ID)).size,6);
});
test('Pilot is contained in full legal matched per-Realm synthetic cohort',()=>{
 const pilot=E.plan(E.DEFAULTS),full=E.plan({...E.DEFAULTS,seedsPerCell:2});
 assert.equal(pilot.sets,96);assert.equal(pilot.fights,384);
 assert.equal(full.sets,192);assert.equal(full.fights,768);
 for(const row of full.rows){
  assert(T.valid(row.talents));
  assert.equal(T.earned(row.talents),row.budget);
 }
 for(const row of pilot.rows){
  const same=full.rows.find(x=>x.id===row.id);
  assert(same);
  assert.equal(same.seed,row.seed);
  assert.deepEqual(same.gear,row.gear);
  assert.deepEqual(same.talents,row.talents);
 }
});
test('Native prepared Boss uses actual payable Reliquary HP cost and removes the intended game effects',()=>{
 const row=E.plan(E.DEFAULTS).rows.find(x=>x.budget===36&&x.policy==='mechanics');
 const tested=E.matched(row,E.DEFAULTS),a=tested.arms;
 assert(Object.values(tested.checks).every(Boolean));
 assert.equal(Object.keys(a).length,4);
 assert(a.reliquary.costHp>0);
 assert.equal(a.baseline.initialEnemies-a.marked_elite.initialEnemies,1);
 assert.equal(a.reliquary.initialEnemies-a.both.initialEnemies,1);
 assert.equal(a.baseline.bossModifiers.length-a.reliquary.bossModifiers.length,1);
 assert.equal(a.baseline.hpStart-a.reliquary.hpStart,a.reliquary.costHp);
 assert.equal(a.both.hpStart,a.reliquary.hpStart);
 for(const variant of Object.values(a)){
  assert(variant.won||variant.died);
  assert.equal(variant.bossId,E.BOSSES_ID[row.realm]);
  assert(variant.bossName.includes(E.BOSSES[row.realm]));
 }
});
test('Risk, policy, gear, output and synthetic points are sealed',()=>{
 assert.throws(()=>E.settingsSafe({...E.DEFAULTS,risk:2}),/Invalid/);
 assert.throws(()=>E.settingsSafe({...E.DEFAULTS,rarity:'Epic'}),/Invalid/);
 assert.throws(()=>E.settingsSafe({...E.DEFAULTS,budgets:[12,36]}),/Invalid/);
 assert.throws(()=>E.settingsSafe({...E.DEFAULTS,tickLimit:100}),/Invalid/);
 assert.throws(()=>E.settingsSafe({...E.DEFAULTS,seedsPerCell:12}),/Invalid/);
 assert.throws(()=>E.parse(['--out=../unsafe.json']),/Invalid/);
 assert.throws(()=>E.parse(['--mode=nerf']),/Unsupported|Invalid/);
});
