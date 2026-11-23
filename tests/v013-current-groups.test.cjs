'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
require('../combat/v012-combat-core.js');
const C=globalThis.WandererV012CombatCore;
const make=()=>({name:'Mob',hp:100,maxhp:100,atk:20,attackEvery:2,def:5,barrier:0,dots:{bleed:[]}});
test('solo encounters preserve original enemy object and stats',()=>{
 const mob=make(),group=C.createEnemyGroup(()=>mob,1);
 assert.equal(group[0],mob);assert.equal(group[0].maxhp,100);assert.equal(group[0].atk,20);
});
test('Stage 6.33: variable groups keep exact native stats and stagger four active slots',()=>{
 for(const count of [3,12,20]){
  const g=C.createEnemyGroup(make,count,{activeSlots:Math.min(count,4)});
  assert.equal(g.length,count);
  assert(g.every(e=>e.maxhp===100&&e.atk===20&&e.def===5));
  assert.equal(new Set(g.slice(0,4).map(e=>e.groupClock)).size,Math.min(4,count));
  g[0].dots.bleed.push({damage:5});assert.equal(g[1].dots.bleed.length,0);
  assert.equal(C.nextGroupTarget(g),g[0]);g[0].hp=0;
  assert.equal(C.nextGroupTarget(g),g[1]);assert.equal(C.groupComplete(g),false);
  g.forEach(e=>e.hp=0);assert.equal(C.groupComplete(g),true);
  assert.equal(C.nextGroupTarget(g),null);
 }
});
test('rejects unsupported group sizes, multipliers and multi-boss encounters',()=>{
 assert.throws(()=>C.createEnemyGroup(make,23),/Invalid/);
 assert.throws(()=>C.createEnemyGroup(make,12,{scale:{hp:.1,atk:.1}}),/removed/);
 assert.throws(()=>C.createEnemyGroup(make,12,{scaleFor:()=>null}),/removed/);
 assert.throws(()=>C.createEnemyGroup(()=>({...make(),boss:true}),2),/solo/);
 assert.equal(C.groupComplete([]),false);
});
test('group factory rejects shared instances and invalid attack clocks',()=>{
 const shared=make();assert.throws(()=>C.createEnemyGroup(()=>shared,2),/Invalid/);
 assert.throws(()=>C.createEnemyGroup(()=>({...make(),attackEvery:0}),2),/Invalid/);
});
