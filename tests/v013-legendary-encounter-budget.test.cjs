'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
require('../combat/legendary.js');
require('../combat/v012-combat-runtime.js');

// Exercise the canonical runtime's Legendary functions independently of RNG,
// navigation, unrelated talents and the historical combat harness.
function fixture(id,family){
 const r={phase1:true,phase1Plane:1,enc:1,path:'test-realm',maxhp:1000,hp:100,barrier:0,
  stats:{spellPower:200,healingPower:0,wardBonus:0,barrierPower:0,bonus:{}},enemy:{},combatSeconds:0};
 const procs={};
 const ports={phase1Controller:{state:{dungeon:{realm:r.path}}},
  phase1Build:{unlockedFamilies:family?[family]:[]},
  activeLegendarySignatures:()=>[{identity:{id}}],
  isPhase1Run:()=>false,
  phase6Metric:()=>{},phase6Proc:(_r,name)=>{procs[name]=(procs[name]||0)+1;},addLog:()=>{}};
 const api=globalThis.WandererV012CombatRuntime.create(ports);
 for(const name of ['legendaryRuntime','legendaryHas','legendaryEmpowered','legendaryProc','legendaryReady','legendaryRealmStart','setNow','setReady','setHeal','setBarrier'])ports[name]=api[name];
 return {r,ports,api,procs};
}
test('Heartroot spends at most 4% per encounter and 16% across all rooms of the same Realm',()=>{
 for(const affinity of [null,'radiance']){
  const {r,ports,api}=fixture('heartroot-carapace',affinity);
  for(let room=1;room<=5;room++){
   r.phase1Plane=room;r.hp=100;
   api.legendaryTick(r,100);
   assert.equal(r.hp,room<=4?140:100);
   assert.equal(r.legendaryState.heartrootEncounterHeal,room<=4?40:0);
   assert.equal(r.legendaryState.heartrootHealed,Math.min(room,4)*40);
   api.legendaryTick(r,100);
   assert.equal(r.hp,room<=4?140:100,'same encounter cannot exceed its cap');
  }
  ports.phase1Controller.state.dungeon.realm='another-realm';r.phase1Plane=6;r.hp=100;
  api.legendaryTick(r,100);
  assert.equal(r.hp,140);assert.equal(r.legendaryState.heartrootHealed,40);
 }
});
test('Veil grants once per encounter, not once per tick or target',()=>{
 for(const [family,expected] of [[null,40],['aegis',56]]){
  const {r,api,procs}=fixture('veil-thousand-seals',family);
  api.legendaryRealmStart(r);assert.equal(r.barrier,expected);
  r.enemy={};api.legendaryTick(r,.1);assert.equal(r.barrier,expected);
  r.phase1Plane++;r.barrier=0;api.legendaryRealmStart(r);
  assert.equal(r.barrier,expected);
  assert.equal(procs['Legendary: veil-thousand-seals: barrier'],2);
 }
});
test('Oathwall uses a 2.5s Sword cooldown and a 3s Mace cooldown',()=>{
 for(const [subtype,seconds] of [['Sword',2.5],['Mace',3]]){
  const {r,api}=fixture('oathwall','aegis');r.stats.main={subtype};
  assert(api.legendaryReady(r,'oathwall'));assert.equal(r.cooldownPeriods['legendary:oathwall'],seconds);
  r.combatSeconds=seconds-.01;assert(!api.legendaryReady(r,'oathwall'));
  r.combatSeconds=seconds;assert(api.legendaryReady(r,'oathwall'));
 }
});
