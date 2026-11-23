'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const A=require('../scripts/v013-stage639-earned-aoe-comparison.cjs');
const B=require('../scripts/v013-stage632-player-power.cjs');
test('Stage639: 30 genuinely E1-born AoE vs ST profiles, E1–E12 checkpoints only',()=>{
 assert.equal(A.PROFILES.length,15);
 assert.equal(A.SEEDS.length,2);
 assert.equal(A.JOBS.length,30);
 assert(A.PROFILES.every(id=>B.PROFILES[id]),'AoE sample profile not in real planner catalog');
 assert.deepEqual(A.CHECKPOINTS,[1,3,5,8,10,12]);
 assert.deepEqual(A.SIZES,[1,3,5,8,12]);
 assert.equal(A.options(['--batch=29','--out=reports/v013-stage639-aoe-pair-29.json']).batch,29);
 for(const bad of ['--batch=30','--batch=-1','--max-level=13','--out=../bad.json',
  '--max-attempts=13','--max-total-attempts=145'])
  assert.throws(()=>A.options([bad]));
 assert.throws(()=>A.aggregate([]),/Missing/);
});
function state(weapon,nodes=[],element='arcane',offhand=null){
 return {state:{equip:{weapon:{subtype:weapon},offhand:offhand?{subtype:offhand}:null},
  automaticTalents:{nodes,element}},talentSpent:nodes.length,xp:nodes.length*100,equipPieces:1};
}
test('Stage639: AoE inferred from actual item and earned nodes, not intended profile title',()=>{
 assert(A.aoeState(state('Two-Handed')).aoePotential);
 assert(A.aoeState(state('Bow')).aoePotential);
 assert(A.aoeState(state('Daggers',['fan_of_blades'])).aoePotential);
 assert(!A.aoeState(state('Daggers')).aoePotential);
 assert(A.aoeState(state('Mace',['mace_shockwave'])).aoePotential);
 assert(A.aoeState(state('Sword',['sword_sweep'],'arcane','Shield')).aoePotential);
 assert(!A.aoeState(state('Sword',['sword_sweep'])).aoePotential);
 assert(A.aoeState(state('Wand',['overcharge'],'lightning')).aoePotential);
 assert(!A.aoeState(state('Wand',['overcharge','lightning_focus'],'lightning')).aoePotential);
 assert(A.aoeState(state('Staff',['fire_spread'],'fire')).aoePotential);
 assert(!A.aoeState(state('Wand',['fire_spread'],'frost')).aoePotential);
});
