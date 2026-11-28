'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const B=require('../scripts/v013-b82-natural-readiness.cjs'),A=require('../scripts/v013-agent-strategy.cjs'),CA=require('../scripts/v013-b32d7-combat-aware-policy.cjs'),AI=require('../scripts/v013-b32c-equipment-policy.cjs');
test('B8.2 has an explicit common policy, valid live profile manifest and all native potion scores',()=>{
 const m=B.manifest();assert.equal(m.profiles.length,28);
 for(const id of B.IDS){const p=B.profile(id);assert(AI.full(p));assert.equal(p.offhandPolicy,'b23');assert.equal(p.equipmentIntelligence,'b32d7-combat-aware');}
 assert.equal(B.profile('smart-decay-outbreak').plan,'decay-outbreak');
});
test('Outbreak capability requires owned pure Decay and a feasible mana pool',()=>{
 const f=(nodes,mana)=>A.classify({equipment:{weapon:{subtype:'Sword'}},talents:{nodes},stats:{mana}});
 const nodes=['affinity_decay','corrupting_touch','contagious_touch','outbreak'];
 const active=f(nodes,100);assert.equal(active.rotOutbreak,true);assert(active.sources.some(s=>s.source.includes('Outbreak')));
 assert.equal(f(nodes,10).rotOutbreak,false);assert.equal(f([...nodes,'affinity_fury'],100).rotOutbreak,false);assert.equal(f(nodes.slice(0,-1),100).rotOutbreak,false);
});
test('Combat-aware proxy recognizes native Parry and independent dagger Double Attack',()=>{
 const core=globalThis.WandererV012CombatCore;
 const f=(weapon,offhand,nodes=[],mana=100,regen=20)=>CA.evaluate({stats:{attack:40,spellPower:20,attacksPerSec:1,maxhp:100,defense:10,mana,manaRegen:regen},equip:{weapon:{subtype:weapon},offhand:offhand?{subtype:offhand}:null},talents:{nodes},level:10,legacy:{daggerRate:offhand==='Off-Hand Dagger'?.5:0,bleed:0,barrier:0,healing:0,secondary:0},core}).scenarios[0];
 assert.equal(f('Sword','Shield').parry,.12);
 const single=f('Daggers',null),dual=f('Daggers','Off-Hand Dagger');assert(single.daggerDoubleAttackDps>0);assert.equal(single.daggerDoubleAttackDps,dual.daggerDoubleAttackDps);assert.equal(f('Sword','Shield').daggerDoubleAttackDps,0);
 const nodes=['affinity_decay','corrupting_touch','outbreak'],active=f('Sword','Shield',nodes);
 assert(active.outbreakPaidRate>0&&active.outbreakPaidRate<=.25);assert(active.outbreakBonusDps>0);assert(active.outbreakDemand<=4);
 assert.equal(f('Sword','Shield',[...nodes,'affinity_fury']).outbreakDemand,0);assert.equal(f('Sword','Shield',nodes,10).outbreakDemand,0);assert.equal(f('Sword','Shield',['affinity_decay','outbreak']).outbreakDemand,0);
});
