'use strict';
// Stage 2: exact Aegis HP/SP formulas and native cap, without synthetic buffs
// or changes to unrelated defensive sources.
const {test}=require('node:test'),assert=require('node:assert/strict');
const create=require('./v012-economy-harness.cjs');
const {T,buy}=require('./v013-current-talent-helper.cjs');
const B=globalThis.WandererV012Buildcraft;
function build(ids){
 const progress=buy(ids);const b=B.create();B.syncPermanent(b,progress);return b;
}
function combatContext(power=100){
 const events=[],player={hp:200,maxhp:200,mp:100,maxmp:100,barrier:30,stats:{spellPower:power}},enemy={hp:1000,maxhp:1000,bleedStacks:0,dots:{bleed:[],burn:[]},v012Rot:[],slowTime:0};
 const c={player,enemy,now:0,base:75,power,funded:true,amp:1,critical:false,random:()=>.5,
  damage:(n,label)=>events.push(['damage',label,n]),
  barrier:n=>events.push(['barrier',n]),
  mana:n=>events.push(['mana',n]),
  dot:()=>{},heal:n=>n,chill:()=>{},log:()=>{},
  spendMana:amount=>{if(player.mp<amount)return false;player.mp-=amount;return true;}};
 return {player,enemy,events,c};
}
test('Stage 2 formulas keep zero-SP Aegis and non-Aegis caps identical to v0.13 baseline',()=>{
 for(const hp of [0,20,200,1000]){
  assert.equal(B.barrierAmount(hp,0,.05,.08),hp*.05);
  assert.equal(B.barrierCap(hp,0,true),Math.max(8,Math.round(hp*.3)));
  assert.equal(B.barrierCap(hp,300,false),Math.max(8,Math.round(hp*.3)));
 }
 assert.equal(B.barrierAmount(200,100,.05,.08),18);
 assert.equal(B.barrierAmount(200,100,.03,.06),12);
 assert.equal(B.barrierCap(200,100,true),85);
 assert.equal(B.barrierCap(200,100,false),60);
 assert.equal(B.barrierAmount(200,-50,.05,.08),10);
 assert(Number.isFinite(B.barrierAmount(0,0,.1,.2)));
});
test('Stage 2 native Barrier cap belongs to Aegis, remains bounded and applies Ward Strength once',()=>{
 const a=create(9101);
 a.state().automaticTalents=buy(['affinity_aegis']);
 const r={barrier:0,maxhp:200,stats:{spellPower:100,wardBonus:.2}};
 assert(Math.abs(a.grantBarrier(10,r)-12)<1e-8,'Ward Strength only once');
 assert.equal(a.grantBarrier(9999,r),73);
 assert.equal(r.barrier,85);
 assert.equal(a.grantBarrier(12,r),0);
 a.state().automaticTalents=buy(['affinity_magic']);
 const nonAegis={barrier:0,maxhp:200,stats:{spellPower:100,wardBonus:0}};
 assert.equal(a.grantBarrier(9999,nonAegis),60);
 assert.equal(nonAegis.barrier,60);
});
test('Stage 2 Barrier Pulse and Runic Shield scale with SP, respecting the original 6s/3s cooldowns',()=>{
 for(const power of [0,100]){
  const b=build(['barrier_pulse']),{events,c}=combatContext(power);
  B.onSecond(b,c);
  assert.equal(events.find(x=>x[0]==='barrier')[1],6+power*.06);
  c.now=1;B.onSecond(b,c);
  assert.equal(events.filter(x=>x[0]==='barrier').length,1);
  c.now=6;B.onSecond(b,c);assert.equal(events.filter(x=>x[0]==='barrier').length,2);
  const r=build(['runic_shield']),x=combatContext(power);
  B.onCast(r,x.c);
  assert.equal(x.events.find(e=>e[0]==='barrier')[1],4+power*.08);
  x.c.now=1;B.onCast(r,x.c);assert.equal(x.events.filter(e=>e[0]==='barrier').length,1);
  x.c.now=3;B.onCast(r,x.c);assert.equal(x.events.filter(e=>e[0]==='barrier').length,2);
  x.c.now=7;x.c.funded=false;B.onCast(r,x.c);
  assert.equal(x.events.filter(e=>e[0]==='barrier').length,2,'unfunded spells cannot grant Barrier');
 }
});
test('Stage 2 Arcane Bastion and Prismatic Rebound retain their defensive trigger and bounded charge',()=>{
 for(const spell of [0,100]){
  const bastion=build(['arcane_bastion']),x=combatContext(spell);
  bastion.runtime.prepared='arcane_bastion';
  x.c.now=10;B.onDefend(bastion,x.c,0,10);B.onCast(bastion,x.c);
  const events=x.events.filter(e=>e[0]==='barrier');
  assert.equal(events.length,1);assert.equal(events[0][1],6+spell*.06);
  x.c.now=11;B.onCast(bastion,x.c);
  assert.equal(x.events.filter(e=>e[0]==='barrier').length,1);
  const rebound=build(['prismatic_rebound']),y=combatContext(spell);
  B.onDefend(rebound,y.c,0,1000);
  assert.equal(rebound.runtime.prismaticCharge,12+spell*.10);
  B.onDefend(rebound,y.c,0,1000);
  assert.equal(rebound.runtime.prismaticCharge,12+spell*.10,'charge is bounded');
  B.onCast(rebound,y.c);
  assert.equal(rebound.runtime.prismaticCharge,0,'rebound is consumed by next funded cast');
 }
});
