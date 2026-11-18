'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
require('../combat/v013-expedition-foundation.js');
const F=globalThis.WandererV013ExpeditionFoundation;
require('../online/v013-boss-modifiers.js');
const M=globalThis.WandererV013BossModifiers;
require('../online/v012-expedition-controller.js');
const E=globalThis.WandererV012Expedition;
const themes=Object.entries(E.REALMS).map(([id,[family,name]])=>({id,family,name}));
const seeded=seed=>{let s=seed>>>0;return()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296);};
const boss=(style='leech')=>({boss:true,bossStyle:style,hp:1000,maxhp:1000,barrier:0,atk:100,def:100,baseDef:100,attackEvery:2});
test('six approved boss modifiers retain lore naming and parameters',()=>{
 assert.deepEqual(F.CATALOG.bossModifiers.map(m=>m.name),['Bone Ward','Graven Hide','Sanguine Frenzy','Soul Drain','Profane Pulse','Gravebound Retinue']);
 assert.equal(M.get('invalid'),null);
 assert(Object.isFrozen(F.CATALOG.bossModifiers[0]));
});
test('10k real plans retain 1/2/3 compatible modifiers and reveal only first',()=>{
 for(let seed=0;seed<10000;seed++){
  const ctrl=E.create(themes,seeded(seed));ctrl.start(1,{freeBuild:true,dungeon:true});
  const g=ctrl.state;
  for(const [i,card] of g.dungeon.cards.entries()){
   const plan=g.dungeon.foundationManifest.cards[i],known=M.known(g,card.id);
   assert.equal(plan.bossModifierIds.length,i+1);
   assert(known&&known.id===plan.bossModifierIds[0]);
   assert.equal(M.check(plan.bossModifierIds,plan.bossStyle,plan.conditionId),true);
  }
 }
});
test('reject incompatible modifiers and duplicate IDs',()=>{
 assert.equal(M.check(['bone_ward'],'guardian',null),false);
 assert.equal(M.check(['sanguine_frenzy'],'berserker',null),false);
 assert.equal(M.check(['bone_ward'],'leech','unbroken_ward'),false);
 assert.equal(M.check(['sanguine_frenzy'],'leech','sanguine_rite'),false);
 assert.equal(M.check(['graven_hide','graven_hide'],'leech',null),false);
 assert.equal(M.check(['gravebound_retinue'],'leech','relentless_hunt'),true);
 assert.equal(M.check(['unknown'],'leech',null),false);
});
test('Bone Ward adds initial barrier and Graven Hide scales both defense fields exactly once',()=>{
 const b=boss(),r={status:'ready',bossModifierIds:[]};
 assert.equal(M.activate(r,b,['bone_ward','graven_hide']),true);
 assert.deepEqual([b.barrier,b.def,b.baseDef,r.bossModifierIds],[150,112,112,['bone_ward','graven_hide']]);
 assert.throws(()=>M.activate(r,b,['bone_ward']));
});
test('Sanguine Frenzy accelerates only below 50% HP and only once',()=>{
 const b=boss(),r={status:'fight',enemy:b,combatSeconds:0};M.activate(r,b,['sanguine_frenzy']);
 b.hp=500;assert.equal(M.tick(r).frenzy,false);assert.equal(b.attackEvery,2);
 b.hp=499;assert.equal(M.tick(r).frenzy,true);assert.equal(b.sanguineFrenzyActive,true);
 assert(Math.abs(b.attackEvery-2/1.12)<1e-8);
 b.hp=100;assert.equal(M.tick(r).frenzy,false);assert(Math.abs(b.attackEvery-2/1.12)<1e-8);
});
test('Soul Drain reduces player healing only while fighting boss',()=>{
 const b=boss(),r={status:'ready',enemy:b};M.activate(r,b,['soul_drain']);
 assert.equal(M.healingFactor(r),1);r.status='fight';assert.equal(M.healingFactor(r),.85);
 r.status='cleared';assert.equal(M.healingFactor(r),1);
 r.status='fight';b.hp=0;assert.equal(M.healingFactor(r),.85); // fight has not resolved until controller settles it
});
test('Profane Pulse applies 4% max HP, absorbs Barrier first, and does not double fire',()=>{
 const b=boss(),r={status:'ready',enemy:b,hp:150,maxhp:200,barrier:5,combatSeconds:0};
 M.activate(r,b,['profane_pulse']);r.status='fight';r.combatSeconds=14.99;
 assert.equal(M.tick(r).pulse,false);
 r.combatSeconds=15;assert.deepEqual(M.tick(r),{frenzy:false,pulse:true,damage:3,absorbed:5});
 assert.equal(r.hp,147);assert.equal(r.bossNextPulseAt,30);
 assert.equal(M.tick(r).pulse,false);r.combatSeconds=30;
 assert.deepEqual(M.tick(r),{frenzy:false,pulse:true,damage:8,absorbed:0});
 assert.equal(r.hp,139);
});
test('Profane Pulse stops with dead boss and Gravebound Retinue respects four slots',()=>{
 const b=boss(),r={status:'ready',enemy:b,hp:100,maxhp:100,barrier:0,combatSeconds:30};
 M.activate(r,b,['profane_pulse']);r.status='fight';b.hp=0;
 assert.equal(M.tick(r).pulse,false);
 assert.deepEqual([0,1,2,3].map(n=>M.extraEscorts(['gravebound_retinue'],n)),[1,2,3,3]);
 assert.equal(M.extraEscorts([],2),2);
 assert.throws(()=>M.extraEscorts(['gravebound_retinue'],-1));
});
