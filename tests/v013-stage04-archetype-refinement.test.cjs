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
 assert(p.targets.indexOf('blood_drinker')<p.targets.indexOf('crimson_onslaught'));
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
 assert.equal(p.armor,'Leather');assert.deepEqual(p.weapons,['Sword','Daggers','Wand']);
 assert.deepEqual(p.offhands,['Daggers','Orb','Tome']);
 assert.deepEqual(p.families,['decay','arcane']);
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

test('Native Sword + Dagger, Orb or Tome offhand combinations are legal (compatibility fixtures only)',()=>{
 const a=create(11004,undefined,{}, {skipPersistence:true});
 const state=a.state();
 // These items are legal preview fixtures, not gifted to natural progression agents.
 const sword=a.makeItem(1,'weapon','Sword','loot','Sword','Common');
 state.stash.push(sword);
 assert(a.equip(sword.id,'weapon'),'native Sword equip rejected');
 assert.equal(state.equip.weapon.subtype,'Sword');
 const dagger=a.makeItem(1,'weapon','Daggers','loot','Daggers','Common');
 state.stash.push(dagger);
 assert(a.equip(dagger.id,'offhand'),'native off-hand Dagger equip rejected next to Sword');
 assert.equal(state.equip.weapon.subtype,'Sword');
 assert.equal(state.equip.offhand.subtype,'Daggers');
 const orb=a.makeItem(1,'offhand','Orb','loot','Orb','Common');
 state.stash.push(orb);
 assert(a.equip(orb.id,'offhand'),'native off-hand Orb equip rejected next to Sword');
 assert.equal(state.equip.offhand.subtype,'Orb');
 const effect=a.gear.offhandEffectPanel;
 assert(effect,'native offhand gear UI must exist');
 const tome=a.makeItem(1,'offhand','Tome','loot','Tome','Common');
 state.stash.push(tome);
 assert(a.equip(tome.id,'offhand'),'native off-hand Tome equip rejected next to Sword');
 assert.equal(state.equip.offhand.subtype,'Tome');
 assert.equal(state.equip.weapon.subtype,'Sword');
});
test('Hexblade evaluates native dagger half-stats in offhand and allows separate main-hand choice',()=>{
 const p=N.PROFILES['hexblade-hybrid'];
 const dagger={slot:'weapon',subtype:'Daggers',rarity:'Common',tier:1,
  atk:12,agi:3,int:4,spd:2,spell:5};
 const main=N.gearScore(dagger,p,'weapon');
 const off=N.gearScore(dagger,p,'offhand');
 assert(Number.isFinite(main)&&Number.isFinite(off));
 assert(main>off,'off-hand dagger must not get 100% main-hand stats or phantom dual attack');
 assert(N.gearScore({...dagger,slot:'offhand'},p,'offhand')===off,
  'native slot reassignment must not artificially change offensive stats');
 const outsider=N.PROFILES.cautious;
 assert.equal(outsider.offhands,undefined,'other profiles untouched');
 const sword={slot:'weapon',subtype:'Sword',rarity:'Common',tier:1,atk:4};
 assert(N.gearScore(sword,p)>N.gearScore({...sword,subtype:'Mace'},p),
  'Sword belongs to the preferred Hexblade main-hand list');
});

test('Natural Hexblade agent can equip an earned dagger in offhand while retaining a stronger Sword',()=>{
 const a=create(11011,undefined,{}, {skipPersistence:true});
 const s=a.state(),profile=N.PROFILES['hexblade-hybrid'];
 // Deterministic equipment fixture isolates the item-choice algorithm.
 // Live cohorts still roll all earned gear through the native loot system.
 const sword=a.makeItem(1,'weapon',null,'loot','Sword','Common');
 sword.atk=45; sword.spell=12; sword.int=10;
 const dagger=a.makeItem(1,'weapon',null,'loot','Daggers','Common');
 dagger.atk=8;dagger.spell=5;dagger.int=4;
 s.stash.push(sword,dagger);
 const actions=N.equipEarned(a,profile,false);
 assert.equal(s.equip.weapon?.id,sword.id,'keep the higher-value Sword in main hand');
 assert.equal(s.equip.offhand?.id,dagger.id,'equip the naturally legal dagger into offhand');
 assert(actions.some(x=>x.slot==='offhand'&&x.item===dagger.name),
  'offhand investment must be explicitly tracked in the native ledger');
});
