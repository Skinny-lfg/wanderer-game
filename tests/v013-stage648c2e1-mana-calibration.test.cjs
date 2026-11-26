'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {T,buy}=require('./v013-current-talent-helper.cjs');
const R=require('../scripts/v013-stage648c2e1-mana-calibration.cjs'),E=require('../scripts/v013-stage648c2e-rot-mana.cjs');
test('research sources compile and all profiles are legal',()=>{
 for(const a of Object.values(R.DECAY_ARMS)){new Function(R.decaySource(a.cost));new Function(R.gearSource(a.regen));}
 for(const a of Object.values(R.MAGIC_ARMS))new Function(R.magicSource(a.infusion));
 for(const a of Object.values(R.FOCUS_ARMS))new Function(R.decaySource(a.cost,a.focus));
 for(const id of R.IDS)assert(R.profile(id));
});
function fixture(other,mp=100){
 const root={WandererAutomaticTalents:T};new Function('globalThis',R.decaySource('A',10))(root);
 const B=root.WandererV012Buildcraft,b=B.create();B.syncPermanent(b,R.focusTalent(other),true);
 const e={hp:1000,maxhp:1000,v012Rot:[{damage:4,remaining:4,ticks:0,primaryPaid:true}],incubationTicks:2},r={hp:100,maxhp:100,mp,maxmp:100,enemies:[e]},m={};
 const c={player:r,enemy:e,now:3,log(){},dotDamage(n){e.hp-=n;},metric(k,n){m[k]=(m[k]||0)+n;}};
 return {B,b,e,r,m,c};
}
test('pure Decay Plagueheart spends Mana once for primary tick bonus; no cooldown on failure',()=>{
 const h=fixture(null);h.B.tickRot(h.b,h.c);assert.equal(h.r.mp,90);assert.equal(h.m.decayPrimaryPaidStageE1FocusActivations,1);assert.equal(h.m.decayPrimaryPaidStageE1FocusRawBonus,4);
 h.e.incubationTicks=2;h.c.now=4;h.B.tickRot(h.b,h.c);assert.equal(h.r.mp,90);
 const low=fixture(null,2);low.B.tickRot(low.b,low.c);assert.equal(low.r.mp,2);assert.equal(low.m.decayPrimaryPaidStageE1FocusDenied,1);assert.equal(low.b.cooldowns.plagueheartFunded,undefined);
});
test('Magic and Blood hybrid owners cannot use funded Plagueheart',()=>{for(const f of ['arcane','blood']){const h=fixture(f);h.B.tickRot(h.b,h.c);assert.equal(h.r.mp,100);assert.equal(h.m.decayPrimaryPaidStageE1FocusHybridBlocked,1);assert.equal(h.m.decayPrimaryPaidStageE1FocusActivations||0,0);}});
test('native normal and boss ledger with varied costs and regen reconciles',()=>{for(const sc of E.SC.filter(s=>s.id==='solo'||s.id==='boss')){const a=R.cell('decay-daggers','base',sc,0),b=R.cell('decay-daggers','Aregen75',sc,0);R.verify(a,b,R.DECAY_ARMS.Aregen75);assert(b.ledger.regenPotential>0);}});
