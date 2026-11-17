'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
require('../combat/v013-expedition-foundation.js');
const F=globalThis.WandererV013ExpeditionFoundation;
require('../online/v013-encounter-traits.js');
const T=globalThis.WandererV013EncounterTraits;
require('../online/v012-expedition-controller.js');
const E=globalThis.WandererV012Expedition;
const themes=Object.entries(E.REALMS).map(([id,[family,name]])=>({id,family,name}));
const seeded=seed=>{let n=seed>>>0;return()=>((n=(Math.imul(n,1664525)+1013904223)>>>0)/4294967296);};
const native=seed=>{const c=E.create(themes,seeded(seed));c.start(1,{freeBuild:true,dungeon:true});return c.state.dungeon.cards;};
const creature=()=>({hp:100,maxhp:100,atk:100,def:100,baseDef:100,barrier:0,attackEvery:2,boss:false,miniboss:false});

test('traits map to six lore-aligned Stage 0 definitions and do not change any catalogue',()=>{
 assert.deepEqual(F.CATALOG.encounterTraits.map(t=>t.name),['Armored','Frenzied','Ambush','Sigilbound','Unhallowed Regrowth','Death Throes']);
 assert.equal(T.get('not_an_id'),null);
 assert(Object.isFrozen(F.CATALOG.encounterTraits[0]));
});
test('10000 deterministic native map seeds produce 1/2/3 regular-room traits, none on the starting ring',()=>{
 for(let seed=0;seed<10000;seed++){
  const cards=native(seed),repeat=native(seed);assert.deepEqual(cards.map(c=>c.nodes.map(n=>n.traitId)),repeat.map(c=>c.nodes.map(n=>n.traitId)));
  for(let risk=0;risk<3;risk++){
   const card=cards[risk],marked=card.nodes.map((n,i)=>({i,n})).filter(({n})=>n.traitId);
   assert.equal(marked.length,1+risk,'risk '+risk+' seed '+seed);
   assert.equal(new Set(marked.map(x=>x.n.traitId)).size,marked.length);
   for(const {i,n} of marked){assert(i>=5);assert.equal(n.kind,'combat');assert(T.get(n.traitId).families.includes(card.family));}
   assert(marked.length<=Math.floor(card.nodes.filter(n=>n.kind==='combat').length*.3));
  }
 }
});
test('Armored applies defense and HP modifiers without introducing bonus traits on base stats',()=>{
 const e=creature();assert.equal(T.applyGroup('armored',[e]),true);
 assert.deepEqual([e.hp,e.maxhp,e.def,e.baseDef,e.atk,e.attackEvery],[92,92,120,120,100,2]);
 assert.throws(()=>T.applyGroup('armored',[e]));
});
test('Frenzied speeds attacks and reduces HP; Ambush advances only the opening attack clock',()=>{
 const e=creature();T.applyGroup('frenzied',[e]);
 assert.deepEqual([e.hp,e.maxhp,e.atk],[90,90,100]);assert(Math.abs(e.attackEvery-2/1.15)<1e-9);
 const a=creature();T.applyGroup('ambush',[a]);
 assert.equal(T.initialClock(creature(),0),1.1);
 assert.equal(T.initialClock(a,0),1.85);
 assert.equal(T.initialClock(a,1),1.55); // per-slot initial cadence remains staggered
 assert.equal(a.attackEvery,2);
});
test('Sigilbound adds Barrier and reduces Attack, with no extra HP',()=>{
 const e=creature();e.barrier=5;T.applyGroup('sigilbound',[e]);
 assert.deepEqual([e.hp,e.atk,e.barrier],[100,90,17]);
});
test('Unhallowed Regrowth heals every 5 seconds, capped at 10% HP per enemy',()=>{
 const e=creature();T.applyGroup('unhallowed_regrowth',[e]);e.hp=50;
 const r={encounterTraitId:'unhallowed_regrowth',enemy:e,combatSeconds:0};
 assert.equal(T.regenTick(r),0);r.combatSeconds=4.99;assert.equal(T.regenTick(r),0);
 r.combatSeconds=5;assert.equal(T.regenTick(r),2);
 assert.equal(T.regenTick(r),0);
 for(let i=2;i<=10;i++){r.combatSeconds=i*5;T.regenTick(r);}
 assert.equal(e.hp,60);assert.equal(e.traitRegrown,10);
 e.hp=0;r.combatSeconds=55;assert.equal(T.regenTick(r),0);
});
test('Regrowth in a group does not heal reserve enemies until they enter active positions',()=>{
 const a=creature(),b=creature();T.applyGroup('unhallowed_regrowth',[a,b]);a.hp=b.hp=50;
 const r={encounterTraitId:'unhallowed_regrowth',enemies:[a],enemy:a,combatSeconds:0};
 T.regenTick(r);r.combatSeconds=5;assert.equal(T.regenTick(r),2);assert.equal(a.hp,52);assert.equal(b.hp,50);
 r.enemies.push(b);T.regenTick(r);r.combatSeconds=10;assert.equal(T.regenTick(r),4);assert.equal(b.hp,52);
});
test('Death Throes damage consumes Barrier, never exceeds 4% max player HP and triggers once per mob',()=>{
 const enemies=Array.from({length:4},()=>{const e=creature();T.applyGroup('death_throes',[e]);e.hp=0;return e;});
 const r={encounterTraitId:'death_throes',hp:100,maxhp:100,barrier:3};
 const result=T.deathPulse(r,enemies);
 assert.deepEqual(result,{damage:1,absorbed:3,triggers:2});
 assert.equal(r.hp,99);assert.equal(r.barrier,0);assert.equal(r.traitDeathThroesTotal,4);
 assert.deepEqual(T.deathPulse(r,enemies),{damage:0,absorbed:0,triggers:0});
});
test('No trait effects apply to bosses/elites or a run without the matching trait',()=>{
 const boss=creature();boss.boss=true;const elite=creature();elite.miniboss=true;
 assert.equal(T.applyGroup('ambush',[boss]),false);assert.equal(T.applyGroup('frenzied',[elite]),false);
 assert.equal(T.regenTick({encounterTraitId:null,enemy:creature(),combatSeconds:30}),0);
 assert.deepEqual(T.deathPulse({encounterTraitId:null},[creature()]),{damage:0,absorbed:0,triggers:0});
});
