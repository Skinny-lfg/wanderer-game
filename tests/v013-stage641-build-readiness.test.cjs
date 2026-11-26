'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
require('../scripts/v013-natural-progression.cjs');
const T=globalThis.WandererAutomaticTalents;
const P=require('../scripts/v013-build-planner.cjs');
const E=require('../scripts/v013-stage641-e10-consensus.cjs');
function hypotheticalBudget(points){return T.award(T.create(),points*T.POINT_XP);}
// These are pure planner fixtures, NOT earned native-account progress or combat.
test('Lightning AoE unlock precedes its amplifier at E10-size legal point budgets',()=>{
 const plan=P.propose(T,hypotheticalBudget(15),'arcane-lightning-pure');
 assert(T.valid({...hypotheticalBudget(15),nodes:plan.expectedNodes,element:plan.expectedElement}));
 assert.equal(plan.expectedElement,'lightning');
 assert(plan.expectedNodes.includes('overcharge'));
 assert(!plan.expectedNodes.includes('storm_mastery'));
});
test('Fire AoE planner follows the ordered Kindling -> Wildfire route',()=>{
 const first=P.propose(T,hypotheticalBudget(15),'arcane-fire-pure');
 const advanced=P.propose(T,hypotheticalBudget(20),'arcane-fire-pure');
 assert(first.expectedNodes.includes('kindling'));
 assert(!first.expectedNodes.includes('fire_spread'));
 assert(advanced.expectedNodes.includes('kindling'));
 assert(advanced.expectedNodes.includes('fire_spread'));
 assert.equal(advanced.expectedElement,'fire');
});
test('E10 calibration agents keep the chosen elements and use safer early routing',()=>{
 for(const id of ['arcane-fire','arcane-lightning']){
  const c=E.CALIBRATED_PROFILES[id];
  assert.equal(c.element,id==='arcane-fire'?'fire':'lightning');
  assert.equal(c.risk,0);
  assert(c.plan);
  assert.equal(c.researchGearPreference,true);
 }
 assert(E.PROFILES['smart-blood-two-handed']==='aoe');
});
