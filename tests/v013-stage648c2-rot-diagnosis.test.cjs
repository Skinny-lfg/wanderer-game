'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {diagnosticSource,MODES}=require('../scripts/v013-stage648c2-rot-diagnosis.cjs');
const {buy}=require('./v013-current-talent-helper.cjs');
function fixture(mode,ids){
 const root={};new Function('globalThis',diagnosticSource(mode))(root);
 const B=root.WandererV012Buildcraft,b=B.create();B.syncPermanent(b,buy(ids));
 const e={hp:10000,maxhp:10000,v012Rot:[],dots:{bleed:[],burn:[]}},r={hp:100,maxhp:100,mp:100,maxmp:100,enemies:[e],stats:{spellPower:100}},m={};
 const c={enemy:e,player:r,now:1,base:100,power:100,random:()=>0,log(){},dot(){},chill(){},heal(){return 0;},barrier(){},damage(n){e.hp-=n;},dotDamage(n){e.hp-=n;},metric(k,n){m[k]=(m[k]||0)+n;},mana(n){r.mp=Math.min(r.maxmp,r.mp+n);},waveKey:'one'};
 return {B,b,e,r,c,m};
}
test('all four diagnostic variants compile, baseline trigger remains unchanged',()=>{for(const mode of MODES)new Function(diagnosticSource(mode));});
test('checking after Toxic Touch can consume the third stack on that same attack; no threshold, cost or cooldown changes',()=>{
 for(const mode of ['baseline','after']){
  const h=fixture(mode,['toxic_touch','corruption_cycle']);
  h.e.v012Rot=[{damage:10,remaining:4,primaryPaid:true},{damage:10,remaining:4,primaryPaid:true}];
  h.B.onAttack(h.b,h.c);
  assert.equal(h.m.corruptionCycleActivations||0,mode==='after'?1:0);
  assert.equal(h.e.v012Rot.length,mode==='after'?2:3);
  assert.equal(h.r.mp,mode==='after'?95:99);
  if(mode==='after'){assert.equal(h.b.cooldowns.corruptionCycle,6);assert.equal(h.m.corruptionCycleRawBurst,60);}
 }
});
test('extra tick changes paid primary duration only, not damage, free applications or native secondary duration',()=>{
 const a=fixture('baseline',['toxic_touch']),b=fixture('duration',['toxic_touch']);
 for(const h of [a,b]){h.B.applyRot(h.b,h.c,20,'paid_primary_toxic_touch');h.B.applyRot(h.b,h.c,20);}
 assert.equal(b.e.v012Rot[0].remaining,a.e.v012Rot[0].remaining+1);assert.equal(b.e.v012Rot[0].damage,a.e.v012Rot[0].damage);assert.deepEqual(b.e.v012Rot[1],a.e.v012Rot[1]);
});
test('expiry and actual Rot damage counters observe native ticks without adding damage',()=>{
 const h=fixture('baseline',['toxic_touch']);h.e.v012Rot=[{damage:10,remaining:1,primaryPaid:true}];const hp=h.e.hp;h.B.tickRot(h.b,h.c);
 assert.equal(h.m.decayPrimaryPaidDiagnosticExpired,1);assert.equal(h.m.decayPrimaryPaidDiagnosticAllRotDamage,hp-h.e.hp);assert.equal(h.e.v012Rot.length,0);
});
