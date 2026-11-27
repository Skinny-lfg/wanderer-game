'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const create=require('./v012-economy-harness.cjs'),{buy}=require('./v013-current-talent-helper.cjs'),L=require('../scripts/v013-b22-isolated-mechanics.cjs');
const item=(slot,subtype,stats={})=>({id:slot,slot,subtype,tier:1,rarity:'Common',...stats});
const cloth=Object.fromEntries(['helm','armor','gloves','boots','belt'].map(slot=>[slot,item(slot,'Cloth',{armorType:'Cloth'})]));
test('approved SP separation: Orb or Aegis gains Cloth SP without unlocking Mana; ordinary Fury remains resource-free',()=>{
 const a=create(28022),weapon=item('weapon','Sword'),offhand=item('offhand','Orb',{spell:10});
 const base=a.baseStats({weapon,offhand}),withCloth=a.baseStats({weapon,offhand,...cloth});
 assert.equal(base.spellPower,23);assert.equal(withCloth.spellPower,32);assert.equal(withCloth.mana,0);assert.equal(withCloth.manaRegen,0);
 a.state().automaticTalents=buy(['affinity_aegis']);
 const ae=a.baseStats({weapon}),aec=a.baseStats({weapon,...cloth});assert(aec.spellPower>ae.spellPower);assert.equal(aec.mana,0);
 a.state().automaticTalents=buy(['affinity_fury']);const fury=a.baseStats({weapon,...cloth});assert.equal(fury.mana,0);assert.equal(fury.spellPower,0);
});
test('caster Cloth scaling remains identical to original source',()=>{
 const opts={skipPersistence:true,now:1720000000000},a=create(42,undefined,{'combat/v012-gear-stats.js':L.originalGear()},opts),b=create(42,undefined,{},opts);
 for(const weapon of [item('weapon','Wand'),item('weapon','Staff')]){
  assert.deepEqual(JSON.parse(JSON.stringify(a.baseStats({weapon,...cloth}))),JSON.parse(JSON.stringify(b.baseStats({weapon,...cloth}))));
 }
});
function fight(kind,source,seed=28023){
 const a=create(seed,undefined,source?{'combat/v012-combat-runtime.js':source}:{},{skipPersistence:true,now:1720000000000});
 a.setup(5,kind,'Common');a.setUnlocked(5);a.start(5,true);
 const c=a.controller(),card=c.state.dungeon.cards[0];c.chooseRealm(card.id);assert(c.visitRoom(1));assert(a.enter());
 const r=a.encounter({count:1});r.stats.attack=100;r.stats.spellPower=100;r.stats.crit=0;r.stats.critDamage=0;r.stats.bonus={};
 r.stats.evasionRating=0;r.stats.evasionBonus=0;r.enemy.hp=r.enemy.maxhp=1e7;r.enemy.def=r.enemy.baseDef=r.enemy.barrier=0;
 r.enemy.attackEvery=1e6;r.tEnemy=0;r.tPlayer=0;r.tDot=0;r.wisdomUsed=true;a.rng(.999);
 return {a,r};
}
test('both Dagger variants compile; coupled observer does not replace native cadence',()=>{
 for(const s of [L.daggerSource(false),L.daggerSource(true),L.blockSource(false,true),L.blockSource(true,true)])new Function(s);
 assert(L.daggerSource(false).includes('r.offhandCadence=((r.offhandCadence||0)+1)%2'));
 assert(!L.daggerSource(true).includes('r.offhandCadence=((r.offhandCadence||0)+1)%2'));
});
test('independent Dagger cadence stays equal across Sword, Mace and Daggers at equal speed modifiers',()=>{
 const observed={};
 for(const w of ['Sword','Mace','Daggers']){
  observed[w]=[];
  for(const mode of [false,true]){
   const {a,r}=fight(w,L.daggerSource(mode));r.stats.off=item('offhand','Off-Hand Dagger');
   const interval={Sword:1.6,Mace:2.2,Daggers:1.15}[w];Object.assign(r.stats,{agi:5,int:5,spdFlat:0,rawAttackSpeed:1/interval,attacksPerSec:1/interval});
   for(let i=0;i<400;i++)a.tick();
   const n=r.metrics.secondaryEquipmentStatusB2OffhandStrikes||0,m=r.metrics.secondaryEquipmentStatusB2MainStrikes||0;
   assert.equal(r.metrics.secondaryEquipmentStatusB2OffhandDamage,n*40);assert(n>0&&m>0);
   if(!mode)assert.equal(n,Math.floor(m/2));
   observed[w].push({n,m});
  }
 }
 assert.equal(observed.Sword[1].n,observed.Mace[1].n);assert.equal(observed.Mace[1].n,observed.Daggers[1].n);
 assert(observed.Mace[1].n>observed.Mace[0].n);assert(observed.Sword[1].n>observed.Sword[0].n);
 console.log('B22_DAGGER_CLOCK='+JSON.stringify(observed));
});
test('zero post-mitigation damage boundary reproduces Barrier creation; clamp prevents it',()=>{
 for(const clamp of [false,true]){
  const {a,r}=fight('Mace',L.blockSource(clamp,true));
  r.hp=r.maxhp=100;r.barrier=10;r.stats.blockChance=65;r.stats.blockReduction=.67;r.stats.attacksPerSec=.1;
  r.stats.off=item('offhand','Shield');r.enemy.atk=10;r.enemy.attackEvery=1;r.tEnemy=1;r.enemy.groupClock=1;a.rng(0);
  a.tick();assert.equal(r.hp,100);
  assert.equal(r.barrier,clamp?10:11);
  assert.equal(r.metrics.shield||0,clamp?0:1);
  console.log('B22_BLOCK_BOUNDARY='+JSON.stringify({clamp,barrier:r.barrier,blocked:r.metrics.shield||0}));
 }
});
test('native positive incoming damage: mitigation, Block, Barrier, then Health; clamp does not change ordinary hit',()=>{
 const results=[];
 for(const clamp of [false,true]){
  const {a,r}=fight('Mace',L.blockSource(clamp,false));
  r.hp=r.maxhp=100;r.barrier=10;r.stats.defense=0;r.stats.blockChance=65;r.stats.blockReduction=.67;r.stats.attacksPerSec=.1;
  r.stats.off=item('offhand','Shield');r.enemy.atk=100;r.enemy.attackEvery=1;r.tEnemy=1;r.enemy.groupClock=1;r.enemy.effect=null;a.rng(0);
  a.tick();assert(r.metrics.shield>0);assert(r.hp<100);assert.equal(r.barrier,0);
  results.push({hp:r.hp,shield:r.metrics.shield,absorbed:r.metrics.absorbed,taken:r.metrics.damageTaken});
 }
 assert.deepEqual(results[0],results[1]);console.log('B22_BLOCK_POSITIVE='+JSON.stringify(results[0]));
});
