'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
require('../combat/v012-combat-runtime.js');
const R=globalThis.WandererV012CombatRuntime;
function fixture(){
 const r={enemy:{},hp:40,maxhp:100,mp:20,maxmp:100,barrier:10,stats:{wardBonus:.1,barrierPower:.2,healingPower:.2,manaCostReduction:.2,bonus:{}}};
 const ports={state:{run:r,automaticTalents:{nodes:[]}},setNow:()=>0,phase6Metric:()=>{},legendaryReady:()=>false,isPhase1Run:()=>false,gameRandom:()=>0,phase1Build:null};
 return {r,api:R.create(ports)};
}
test('native Barrier generation scales once without rescaling stored Barrier',()=>{
 const {r,api}=fixture();assert(Math.abs(api.setBarrier(r,10)-13)<1e-9);assert(Math.abs(r.barrier-23)<1e-9);
 r.stats.barrierPower=.4;assert(Math.abs(r.barrier-23)<1e-9);assert(Math.abs(api.setBarrier(r,10)-15)<1e-9);
});
test('native combat healing scales once; reserve release is not amplified',()=>{
 const {r,api}=fixture();assert(Math.abs(api.setHeal(r,10)-12)<1e-9);assert.equal(r.hp,52);
 assert.equal(api.setHeal(r,10,true),10);assert.equal(r.hp,62);
});
test('native paid actions cap Mana discount at 25% and never become free',()=>{
 const {r,api}=fixture(),c=api.phase2Context(r);
 assert(c.spendMana(5));assert.equal(r.mp,16);assert(c.spendMana(1));assert.equal(r.mp,15);
 r.stats.manaCostReduction=1;assert(c.spendMana(4));assert.equal(r.mp,12);
 r.mp=.99;assert(!c.spendMana(1));assert.equal(r.mp,.99);
});
