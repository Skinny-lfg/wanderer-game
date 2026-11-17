'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const F=require('../combat/v013-expedition-foundation.js');
const I=require('../online/v013-map-intelligence.js');
const C=require('../online/v013-expedition-conditions.js');
const create=require('./v012-economy-harness.cjs');
function card(family='decay'){
 const nodes=Array.from({length:22},(_,i)=>({kind:i===0?'entrance':i===21?'boss':'combat',count:3}));
 const edges=Array.from({length:21},(_,i)=>[i,i+1]);
 return {id:'forge',family,risk:2,nodes,edges,shortcut:4};
}
function dungeon(c,id,seed=9101){
 const d={foundationManifest:{seed,cards:[{realmId:c.id,conditionId:id}]},conditionEdgesUsed:[]};
 return d;
}
test('Stage 5: six lore-approved Conditions are deterministic and each has gameplay counterplay text',()=>{
 for(const item of F.CATALOG.conditions){
  const c=card(item.families[0]);
  const a=C.plan(c,1811,item.id),b=C.plan(c,1811,item.id);
  assert.deepEqual(a,b,item.id);
  assert.equal(a.id,item.id);assert.equal(a.name,item.name);
  assert(C.GUIDE[item.id]?.danger&&C.GUIDE[item.id]?.counter,item.id);
  if(item.params.markedEncounters)assert.equal(a.rooms.length,2);
  if(item.params.markedEdges)assert.equal(a.edges.length,2);
 }
});
test('Stage 5: Relentless Hunt affects exactly two normal encounters and speed by +15%',()=>{
 const c=card('blood'),d=dungeon(c,'relentless_hunt'),p=C.forDungeon(c,d);
 const group=[{atk:100,maxhp:1000,hp:1000,attackEvery:2,boss:false},{atk:100,maxhp:1000,hp:1000,attackEvery:2,boss:false}];
 const run={status:'fight'};C.applyEncounter(run,group,{node:p.rooms[0],boss:false},c,d);
 assert.equal(run.conditionMarked,true);assert(Math.abs(group[0].attackEvery-2/1.15)<1e-10);
 assert(Math.abs(group[1].attackEvery-2/1.15)<1e-10);
 const other=group.map(e=>({...e,attackEvery:2})),r={status:'fight'};
 C.applyEncounter(r,other,{node:2,boss:false},c,d);
 assert.equal(r.conditionMarked,false);assert.equal(other[0].attackEvery,2);
});
test('Stage 5: Carrion Swarm produces exactly two distinct fights with 18–22 enemies',()=>{
 const c=card('blood'),d=dungeon(c,'carrion_swarm'),p=C.forDungeon(c,d);
 assert.equal(p.rooms.length,2);assert.notEqual(p.rooms[0],p.rooms[1]);
 for(const room of p.rooms){const count=C.countFor({node:room,mobCount:3},c,d);assert(count>=18&&count<=22);}
 assert.equal(C.countFor({node:1,mobCount:3},c,d),3);
});
test('Stage 5: Unbroken Ward grants 15% boss HP Barrier once and never to ordinary mobs',()=>{
 const c=card('aegis'),d=dungeon(c,'unbroken_ward');
 const boss={boss:true,hp:1000,maxhp:1000,barrier:22,atk:100,attackEvery:2};
 const guard={boss:false,hp:100,maxhp:100,barrier:0,atk:10,attackEvery:2};
 const run={status:'fight'};
 C.applyEncounter(run,[boss,guard],{boss:true,node:21},c,d);
 assert.equal(boss.barrier,172);assert.equal(run.conditionBarrierGranted,150);assert.equal(guard.barrier,0);
});
test('Stage 5: Blighted Ground reduces player healing by 15% only in marked rooms',()=>{
 const c=card('decay'),d=dungeon(c,'blighted_ground'),p=C.forDungeon(c,d);
 const run={status:'fight'};
 C.applyEncounter(run,[{atk:100,maxhp:1000,hp:1000,attackEvery:2}],{boss:false,node:p.rooms[0]},c,d);
 assert.equal(C.healingFactor(run),.85);
 C.applyEncounter(run,[{atk:100,maxhp:1000,hp:1000,attackEvery:2}],{boss:false,node:1},c,d);
 assert.equal(C.healingFactor(run),1);
});
test('Stage 5: Veiled Passages add one step on first traversal only; preserve map topology',()=>{
 const c=card('decay'),d=dungeon(c,'veiled_passages'),p=C.forDungeon(c,d);
 const original=JSON.stringify(c.edges);
 assert.equal(p.edges.length,2);assert(!p.edges.includes('4-5'),'No secret edge markers');
 for(const edge of p.edges){
  const path=edge.split('-').map(Number),charge=C.travelSurcharge(c,d,path);
  assert.equal(charge,1);
  assert.equal(C.markTraversed(c,d,path),1);
  assert.equal(C.travelSurcharge(c,d,path),0);
  assert.equal(C.markTraversed(c,d,path),0);
 }
 assert.equal(d.conditionEdgesUsed.length,2);assert.equal(C.validLedger(c,d),true);
 assert.equal(JSON.stringify(c.edges),original);
 assert.equal(C.validLedger(c,{...d,conditionEdgesUsed:[...d.conditionEdgesUsed,'0-1']}),false);
});
test('Stage 5: Sanguine Rite fires once under 50% boss HP; +12% Attack and +8% speed',()=>{
 const c=card('blood'),d=dungeon(c,'sanguine_rite');
 const enemy={boss:true,hp:500,maxhp:1000,atk:100,attackEvery:2};
 const r={status:'fight'};
 C.applyEncounter(r,[enemy],{boss:true,node:21},c,d);
 assert.equal(C.tick(r),false);
 enemy.hp=499;assert.equal(C.tick(r),true);
 assert.equal(enemy.atk,112);
 assert(Math.abs(enemy.attackEvery-2/1.08)<1e-9);
 assert.equal(C.tick(r),false);assert.equal(enemy.atk,112);
 const normal={status:'fight'};C.applyEncounter(normal,[{...enemy,boss:false}],{boss:false,node:1},c,d);assert.equal(C.tick(normal),false);
});
test('Stage 5: native controller exposes 3 different affinity-valid Conditions; no map reduction',()=>{
 const a=create(58291,undefined,{}, {skipPersistence:true});
 a.setup(20,'Sword','Rare');a.setUnlocked(20);a.start(20,true);
 const g=a.controller().state;
 assert.equal(g.dungeon.cards.length,3);
 assert.equal(new Set(g.dungeon.foundationManifest.cards.map(m=>m.conditionId)).size,3);
 for(const c of g.dungeon.cards){
  const p=C.forGame(g,c);
  assert(p);assert(F.lookup('conditions',p.id).families.includes(c.family));
  assert.equal(c.nodes.length,18+c.risk*2);assert(c.edges.length>=c.nodes.length-1);
 }
 const c=g.dungeon.cards[0];a.controller().chooseRealm(c.id);
 assert.deepEqual(Array.from(g.dungeon.conditionEdgesUsed),[]);
 assert.equal(a.controller().visitRoom(1),true);
 assert.equal(a.enter(),true);
 assert.equal(a.state().run.conditionId,C.forDungeon(c,g.dungeon).id);
 assert.equal(a.controller().validate(g),undefined);
});
