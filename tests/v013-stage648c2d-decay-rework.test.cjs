'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {formulaSource,MODES}=require('../scripts/v013-stage648c2d-decay-rework.cjs');
const {T,buy}=require('./v013-current-talent-helper.cjs');
function fixture(mode,ids=['toxic_touch']){
 const root={WandererAutomaticTalents:T};new Function('globalThis',formulaSource(mode))(root);
 const B=root.WandererV012Buildcraft,b=B.create();B.syncPermanent(b,buy(ids));
 const e={hp:10000,maxhp:10000,v012Rot:[],dots:{bleed:[],burn:[]}},r={hp:100,maxhp:100,mp:100,maxmp:100,enemies:[e],stats:{attack:100,spellPower:40,attacksPerSec:.5}},m={};
 const c={enemy:e,player:r,now:1,base:100,power:40,random:()=>0,log(){},dot(){},chill(){},heal(){return 0;},barrier(){},damage(n){e.hp-=n;},dotDamage(n){e.hp-=n;},metric(k,n){m[k]=(m[k]||0)+n;},mana(n){r.mp=Math.min(r.maxmp,r.mp+n);},waveKey:'one'};
 return {B,b,e,r,c,m};
}
test('all research variants compile',()=>{for(const m of MODES)new Function(formulaSource(m));});
test('formulas use AP and SP, not hit or speed; raw stack uses native modifiers',()=>{
 for(const [mode,power] of [['max',10],['sum',11.2],['hybrid',11.2]]){
  const h=fixture(mode),ref=fixture('persistent');
  ref.B.applyRot(ref.b,ref.c,power,'paid_primary_toxic_touch');
  h.c.base=900;h.B.onAttack(h.b,h.c);
  assert.equal(h.e.v012Rot[0].damage,ref.e.v012Rot[0].damage);
  assert.equal(h.r.mp,99);
 }
});
test('clock applies on seconds only, respects mana, cooldown and no attack speed dependency',()=>{
 const a=fixture('clock'),b=fixture('clock');b.r.stats.attacksPerSec=4.2;
 for(const h of [a,b]){
  h.B.onAttack(h.b,h.c);assert.equal(h.e.v012Rot.length,0);
  h.B.onSecond(h.b,h.c);assert.equal(h.e.v012Rot.length,1);
  h.c.now=2;h.B.onSecond(h.b,h.c);assert.equal(h.e.v012Rot.length,1);
  h.c.now=3;h.B.onSecond(h.b,h.c);assert.equal(h.e.v012Rot.length,2);
  h.r.mp=0;h.c.now=5;h.B.onSecond(h.b,h.c);assert.equal(h.e.v012Rot.length,2);
  assert.equal(h.m.decayPrimaryPaidApplications,2);
 }
 assert.deepEqual(a.e.v012Rot,b.e.v012Rot);
});
test('cap detonation requires primary stacks, finite burst, native mana/cooldown',()=>{
 for(const [mode,n,raw] of [['cap-one',1,48],['cap-three',3,68],['cap-none',0,68]]){
  const h=fixture(mode,['toxic_touch','corruption_cycle']);
  h.e.v012Rot=Array.from({length:5},()=>({damage:10,remaining:4,primaryPaid:true}));
  h.e.v012Rot.push({damage:99,remaining:3,spread:true});h.B.onAttack(h.b,h.c);
  assert.equal(h.m.corruptionCycleActivations||0,0);
  h.e.v012Rot[5]={damage:10,remaining:4,primaryPaid:true};h.B.onAttack(h.b,h.c);
  assert.equal(h.e.v012Rot.length,6-n);assert.equal(h.r.mp,96);
  assert.equal(h.m.corruptionCycleRawBurst,raw);assert.equal(h.b.cooldowns.corruptionCycle,6);
  h.B.onAttack(h.b,h.c);assert.equal(h.m.corruptionCycleActivations,1);
 }
});
test('Concentrated Corruption uses its own three-primary-stack cap',()=>{
 const h=fixture('cap-one',['toxic_touch','corruption_cycle']);
 h.b.runtime.specializations.push('rot_focus');
 h.e.v012Rot=Array.from({length:3},()=>({damage:10,remaining:4,primaryPaid:true}));
 h.B.onAttack(h.b,h.c);assert.equal(h.m.corruptionCycleActivations,1);assert.equal(h.e.v012Rot.length,2);
});
