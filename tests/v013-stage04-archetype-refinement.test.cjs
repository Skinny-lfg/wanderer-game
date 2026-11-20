'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const N=require('../scripts/v013-natural-progression.cjs');
const create=require('./v012-economy-harness.cjs');
const combat=require('../combat/v012-buildcraft.js');

test('Leather Duelist now develops native Blood sustain without any flat stat injection',()=>{
 const p=N.PROFILES['leather-duelist'];
 assert.equal(p.armor,'Leather');
 assert.deepEqual(p.weapons,['Daggers','Bow']);
 assert.deepEqual(p.families,['fury','blood']);
 assert(p.targets.indexOf('bleeding_edge')<p.targets.indexOf('blood_drinker'));
 assert(p.targets.indexOf('blood_drinker')<p.targets.indexOf('blood_harvest'));
 assert(p.targets.indexOf('blood_drinker')<p.targets.indexOf('crimson_rush'));
 assert(p.targets.includes('quick_hands')&&p.targets.includes('double_strike'));
 assert.equal(p.preparedTargets[0],'red_guillotine');
 assert.equal(p.healAt,.42);assert.equal(p.retreatAt,.25);assert.equal(p.risk,1);
 const a=create(11001,undefined,{}, {skipPersistence:true});
 const nodes=a.talents.NODES;
 for(const id of ['bleeding_edge','blood_drinker','blood_harvest'])
  assert(nodes.some(n=>n.id===id),'native tree lacks '+id);
 assert.equal(a.talents.create().xp,0);
});
test('Hexblade uses Arcane as the default Magic mode and native no-shield Aegis',()=>{
 const p=N.PROFILES['hexblade-hybrid'];
 assert.equal(p.armor,'Leather');assert.deepEqual(p.weapons,['Daggers','Wand']);
 assert.deepEqual(p.families,['decay','magic']);
 assert(p.targets.includes('affinity_aegis'));
 assert(p.targets.indexOf('affinity_aegis')<p.targets.indexOf('arcane_resonance'));
 // The Aegis dip must not alter the Hexblade's preferred Realm affinities.
 assert(!Object.hasOwn(p,'element'),'no Frost override; native default is Arcane');
 assert(p.targets.includes('hex_bolt')&&p.preparedTargets.includes('grave_bloom'));
 assert(p.targets.includes('arcane_resonance'));
 assert(p.targets.includes('arcane_surge'));
 assert(p.targets.includes('arcane_mastery'));
 assert(p.targets.includes('guarded_block'));
 assert(p.targets.includes('barrier_pulse'));
 assert(!p.targets.includes('deep_winter'));
 assert.equal(p.healAt,.5);assert.equal(p.retreatAt,.29);assert.equal(p.risk,1);
 const a=create(11001,undefined,{}, {skipPersistence:true});
 const T=a.talents,nodes=T.NODES;
 for(const id of ['arcane_resonance','arcane_surge','arcane_mastery',
  'guarded_block','barrier_pulse','hex_bolt'])
  assert(nodes.some(n=>n.id===id),'native talent graph lacks '+id);
 const initial=T.create();
 assert(!Object.hasOwn(initial,'element'));
 assert(T.valid(initial));
 const graph=nodes.find(n=>n.id==='arcane_resonance');
 assert.equal(graph.element,'arcane');
});
test('Existing game Blood Drinker/Harvest and Aegis effects remain unchanged',()=>{
 const a=create(11001,undefined,{}, {skipPersistence:true});
 const graph=a.talents.NODES;
 const blood=graph.find(x=>x.id==='blood_drinker');
 const harvest=graph.find(x=>x.id==='blood_harvest');
 assert.equal(blood.family,'blood');
 assert.equal(harvest.family,'blood');
 assert.match(blood.description,/heal/i);
 assert.match(harvest.description,/3%/);
 assert.match(graph.find(x=>x.id==='arcane_surge').description,/8%/);
 assert.match(graph.find(x=>x.id==='barrier_pulse').description,/Barrier/i);
});
