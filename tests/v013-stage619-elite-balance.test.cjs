'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const crypto=require('node:crypto');
require('../online/v013-elite-abilities.js');
const A=globalThis.WandererV013EliteAbilities;
const E=require('../scripts/v013-stage619-elite-balance.cjs');
const T=globalThis.WandererAutomaticTalents;
test('Eight independent curves, finite, clamped, non-regressive, and strict identity',()=>{
 assert.deepEqual(Object.keys(A.ELITE_SCALING).sort(),[...E.IDS].sort());
 const high=new Set(E.IDS.map(id=>JSON.stringify(A.ELITE_SCALING[id])));
 assert.equal(high.size,8,'do not blanket-buff Elite types');
 for(const id of E.IDS){
  for(const level of [1,5])assert.deepEqual(A.scalingFor(id,level),{hp:1,atk:1,def:1});
  const p15=A.scalingFor(id,15),p35=A.scalingFor(id,35),p70=A.scalingFor(id,70);
  for(const k of ['hp','atk','def']){
   assert(p15[k]>1&&p15[k]<p35[k],'progressive E15–E35');
   assert(p70[k]>p35[k],'additional type-specific E35–E70 challenge');
   assert(p70[k]<2.6,'no runaway scaling');
   assert.equal(A.scalingFor(id,200)[k],p70[k],'endgame cap E70+');
  }
 }
 assert.throws(()=>A.scalingFor('not-an-elite',35),/Invalid/);
 assert.throws(()=>A.scalingFor('tank',NaN),/Invalid/);
});
test('Stage 6.19 A/B changes only Elite extra growth in the CURRENT native combat runtime',()=>{
 const extra=' const eliteGrowth=elite?root.WandererV013EliteAbilities.scalingFor(elite.id,level):null;';
 const baseline=' const eliteGrowth=elite?{hp:1,atk:1,def:1}:null;';
 assert.equal(E.LIVE_RUNTIME.split(extra).length,2);
 assert.equal(E.BASELINE_RUNTIME,E.LIVE_RUNTIME.replace(extra,baseline));
 assert.notEqual(E.SOURCE_HASH.before,E.SOURCE_HASH.after);
 assert(E.BASELINE_RUNTIME.includes('root.WandererV013BossAbilities.earlyScale'));
 assert(E.BASELINE_RUNTIME.includes('Math.round(hit*.33)'),'preserves approved Wraith lifesteal fix');
});
test('Registered pilot/matrix cover all eight per Elite with legally constructed player Talents',()=>{
 const pilot=E.plan(E.DEFAULTS),full=E.plan({...E.DEFAULTS,seedsPerCell:2});
 assert.equal(pilot.sets,48);assert.equal(pilot.fights,768);
 assert.equal(full.sets,96);assert.equal(full.fights,1536);
 for(const row of full.rows){
  assert(T.valid(row.talents));
  assert.equal(T.earned(row.talents),row.budget);
 }
 assert.throws(()=>E.safe({...E.DEFAULTS,risk:2}),/Invalid/);
 assert.throws(()=>E.safe({...E.DEFAULTS,rarity:'Epic'}),/Invalid/);
});
test('All eight real Elites spawn in a matched native E5 before/after comparison with zero combat drift',()=>{
 const one=E.plan(E.DEFAULTS).rows.find(r=>r.budget===12);
 const matched=E.matched(one,E.DEFAULTS);
 assert(Object.values(matched.checks).every(Boolean));
 assert.equal(Object.keys(matched.arms).length,16);
 for(const id of E.IDS){
  const before=matched.arms[id+'_before'],after=matched.arms[id+'_after'];
  assert(before.won||before.died);assert(after.won||after.died);
  assert.equal(before.eliteType,id);assert.equal(after.eliteType,id);
  assert.equal(before.eliteHp,after.eliteHp);
  assert.equal(before.eliteAttack,after.eliteAttack);
  assert.equal(before.eliteDefense,after.eliteDefense);
 }
});
test('Individual E35 native Elite stats rise vs previous game, independently of normal mobs/Bosses',()=>{
 const one=E.plan(E.DEFAULTS).rows.find(r=>r.budget===36);
 const matched=E.matched(one,E.DEFAULTS);
 for(const id of E.IDS){
  const before=matched.arms[id+'_before'],after=matched.arms[id+'_after'];
  assert(after.eliteHp>before.eliteHp,id+' max HP must rise');
  assert(after.eliteAttack>=before.eliteAttack,id+' ATK should not regress');
  assert(after.eliteDefense>=before.eliteDefense,id+' DEF should not regress');
 }
});
