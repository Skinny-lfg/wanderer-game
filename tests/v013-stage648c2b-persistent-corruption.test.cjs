'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {diagnosticSource,MODES}=require('../scripts/v013-stage648c2b-persistent-corruption.cjs');
const {T,buy}=require('./v013-current-talent-helper.cjs');
function fixture(mode,ids){
 const root={WandererAutomaticTalents:T};new Function('globalThis',diagnosticSource(mode))(root);
 const B=root.WandererV012Buildcraft,b=B.create();B.syncPermanent(b,buy(ids));
 const e={hp:10000,maxhp:10000,v012Rot:[],dots:{bleed:[],burn:[]}},r={hp:100,maxhp:100,mp:100,maxmp:100,enemies:[e],stats:{spellPower:100}},m={};
 const c={enemy:e,player:r,now:1,base:100,power:100,random:()=>0,log(){},dot(){},chill(){},heal(){return 0;},barrier(){},damage(n){e.hp-=n;},dotDamage(n){e.hp-=n;},metric(k,n){m[k]=(m[k]||0)+n;},mana(n){r.mp=Math.min(r.maxmp,r.mp+n);},waveKey:'one'};
 return {B,b,e,r,c,m};
}
test('all arms compile and only paid primary stacks survive repeated ticks',()=>{
 for(const mode of MODES){
  new Function(diagnosticSource(mode));
  const h=fixture(mode,['toxic_touch']);
  h.B.applyRot(h.b,h.c,20,'paid_primary_toxic_touch');
  h.B.applyRot(h.b,h.c,20);
  h.e.v012Rot.push({damage:5,remaining:2,primaryPaid:false,transferred:true});
  h.e.v012Rot.push({damage:5,remaining:2,spread:true,secondaryOrigin:'test'});
  const original=h.e.v012Rot[0].remaining,damage=h.e.v012Rot[0].damage;
  for(let i=0;i<12;i++)h.B.tickRot(h.b,h.c);
  assert.equal(h.e.v012Rot.length,mode==='baseline'?0:1);
  if(mode!=='baseline'){assert.equal(h.e.v012Rot[0].remaining,original);assert.equal(h.e.v012Rot[0].damage,damage);assert.equal(h.e.v012Rot[0].ticks,12);}
  h.B.resetWave(h.b,h.e);assert.equal(h.e.v012Rot.length,0);
 }
});
test('native cap and per-application damage are preserved',()=>{
 const a=fixture('baseline',['toxic_touch']),b=fixture('persistent',['toxic_touch']);
 for(const h of [a,b])for(let i=0;i<9;i++)h.B.applyRot(h.b,h.c,20+i,'paid_primary_toxic_touch');
 assert.deepEqual(b.e.v012Rot,a.e.v012Rot);assert.equal(b.e.v012Rot.length,6);assert.equal(b.m.decayPrimaryPaidPersistentPrimaryCapReached,1);
});
test('Cycle order isolated and three-stack burst is finite with unchanged mana and cooldown',()=>{
 for(const mode of ['persistent','persistent-after','persistent-burst']){
  const h=fixture(mode,['toxic_touch','corruption_cycle']);
  h.e.v012Rot=[{damage:10,remaining:4,primaryPaid:true},{damage:10,remaining:4,primaryPaid:true}];
  h.B.onAttack(h.b,h.c);
  assert.equal(h.m.corruptionCycleActivations||0,mode==='persistent'?0:1);
  assert.equal(h.e.v012Rot.length,mode==='persistent'?3:mode==='persistent-after'?2:0);
  assert.equal(h.r.mp,mode==='persistent'?99:95);
  if(mode!=='persistent')assert.equal(h.b.cooldowns.corruptionCycle,6);
  if(mode==='persistent-burst'){assert.equal(h.m.decayPrimaryPaidPersistentBurstStacksConsumed,3);assert(Number.isFinite(h.m.corruptionCycleRawBurst));}
 }
 const h=fixture('persistent-burst',['toxic_touch','corruption_cycle']);
 h.c.random=()=>1;h.e.v012Rot=Array.from({length:3},()=>({damage:10,remaining:5,primaryPaid:true}));
 h.B.onAttack(h.b,h.c);assert.equal(h.m.corruptionCycleRawBurst,80);assert.equal(h.r.mp,96);
});
