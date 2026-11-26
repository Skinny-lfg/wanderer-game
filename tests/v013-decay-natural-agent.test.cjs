'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),create=require('./v012-economy-harness.cjs');
const N=require('../scripts/v013-natural-progression.cjs'),P=require('../scripts/v013-build-planner.cjs'),A=require('../scripts/v013-agent-strategy.cjs');
require('../combat/v012-runes.js');const R=globalThis.WandererV012Runes;
test('Decay agents have distinct legal talent plans, without other specialization drift',()=>{
 const a=create(123),T=a.talents,progress=T.award(a.state().automaticTalents,3000);
 for(const [id,p] of Object.entries(P.BUILDS).filter(([id,p])=>p.decayRole)){
  const x=P.propose(T,progress,id);assert(T.valid({...progress,nodes:x.expectedNodes}));
  assert(x.expectedNodes.includes('affinity_decay'));assert(x.expectedNodes.includes('blightburst'));
  assert.equal(x.expectedNodes.includes('corruption_cycle'),['cycle','hybrid'].includes(p.decayRole));
  assert.equal(x.expectedNodes.includes('corruption_nova'),['overflow','hybrid'].includes(p.decayRole));
 }
});
test('Rune score checks all 23 actual stat fields and rejects inactive resource and cap effects',()=>{
 const a=create(132),s=a.state();a.setup(1,'Sword','Common');
 const base=a.baseStats(s.equip,[],[]);
 for(const f of R.FAMILIES){
  const rune=a.makeRune(f.id,1,'Rare'),projected=a.baseStats(s.equip,[rune],[rune.id]);
  const score=N.runeScore(rune,N.PROFILES.daring,{base,projected,nodes:[],weapon:'Sword',offhand:null,evasionGain:0});
  assert(Number.isFinite(score),f.id);
  if(['abyss','clarity','efficiency','archmage','corruption','bastion','renewal','phantom'].includes(f.id))assert.equal(score,0,f.id);
 }
 const rune=a.makeRune('corruption',1,'Rare'),context={base:{...base,mana:100,dotPower:0},projected:{...base,mana:100,dotPower:.135},nodes:['affinity_decay','corruption_cycle','blightburst'],weapon:'Sword',evasionGain:0};
 assert(N.runeScore(rune,N.PROFILES['smart-decay-cycle-twohand'],context)>0);
});
test('Agent chooses prepared Rot target only when Cycle is affordable and ready',()=>{
 const first={hp:100,maxhp:100,v012Rot:[]},second={hp:90,maxhp:100,v012Rot:[{damage:3,remaining:4,spread:true}]};
 const run={status:'fight',enemies:[first,second],enemy:first,mp:20};
 assert.equal(A.selectTarget(run,{rotCycle:true,rotCycleReady:true},first),second);
 assert.equal(A.selectTarget(run,{rotCycle:true,rotCycleReady:false},first),first);
 run.mp=3;assert.equal(A.selectTarget(run,{rotCycle:true,rotCycleReady:true},first),first);
});
