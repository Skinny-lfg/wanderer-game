'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {rotSource,manaRuntime,weaponBase,magicTalent,ROT}=require('../scripts/v013-stage648c2e-rot-mana.cjs');
const {T,buy}=require('./v013-current-talent-helper.cjs');
test('all research sources compile and four Magic profiles allocate legally',()=>{for(const m of ROT)new Function(rotSource(m));new Function(manaRuntime());for(const m of ['arcane','fire','frost','lightning'])assert(T.valid(magicTalent(m)));});
test('nominal weapon potency distinguishes weapons',()=>{const s={attack:40,spellPower:25};assert.equal(weaponBase({...s,main:{subtype:'Daggers'}}),32);assert.equal(weaponBase({...s,main:{subtype:'Two-Handed'}}),68);assert.equal(weaponBase({...s,main:{subtype:'Staff'}}),33);});
function fixture(mode,weapon='Daggers'){
 const root={WandererAutomaticTalents:T};new Function('globalThis',rotSource(mode))(root);
 const B=root.WandererV012Buildcraft,b=B.create();B.syncPermanent(b,buy(['toxic_touch']));
 const e={hp:10000,maxhp:10000,v012Rot:[],dots:{bleed:[],burn:[]}},r={hp:100,maxhp:100,mp:100,maxmp:100,enemies:[e],stats:{attack:40,spellPower:25,main:{subtype:weapon}}},m={};
 const c={enemy:e,player:r,now:1,base:999,power:25,random:()=>0,log(){},dot(){},chill(){},heal(){return 0;},barrier(){},damage(n){e.hp-=n;},dotDamage(n){e.hp-=n;},metric(k,n){m[k]=(m[k]||0)+n;},mana(n){r.mp=Math.min(r.maxmp,r.mp+n);},waveKey:'one'};
 return {B,b,e,r,c,m};
}
test('primary stacks retain fractional potency, add linearly and persist',()=>{for(const w of ['Daggers','Two-Handed','Staff']){const h=fixture('rot4',w);for(let i=0;i<6;i++){h.c.now=1+i*2;h.c.base=10+i*100;h.B.onAttack(h.b,h.c);assert.equal(h.e.v012Rot.length,i+1);}const d=h.e.v012Rot[0].damage;assert(d>0);assert(h.e.v012Rot.every(x=>Math.abs(x.damage-d)<1e-9));assert(Math.abs(h.e.v012Rot.reduce((n,x)=>n+x.damage,0)-6*d)<1e-9);for(let i=0;i<12;i++)h.B.tickRot(h.b,h.c);assert.equal(h.e.v012Rot.length,6);assert.equal(h.r.mp,94);}});
test('Cycle ablation does not consume stacks',()=>{const h=fixture('rot4-no-cycle');h.B.syncPermanent(h.b,buy(['toxic_touch','corruption_cycle']));for(let i=0;i<6;i++){h.c.now=1+i*2;h.B.onAttack(h.b,h.c);}assert.equal(h.e.v012Rot.length,6);assert.equal(h.m.corruptionCycleActivations||0,0);});
