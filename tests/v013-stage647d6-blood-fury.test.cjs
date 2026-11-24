'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {T,buy}=require('./v013-current-talent-helper.cjs');
require('../combat/v012-combat-runtime.js');
const B=WandererV012Buildcraft;
function fixture(ids=[]){
 const progress=buy(ids),metrics={},hits=[];
 const ports={state:{automaticTalents:progress},setNow:r=>r.combatSeconds||0,phase6Metric(r,k,n){metrics[k]=(metrics[k]||0)+n;},floatText(){},synchronizeDots(e){runtime.synchronizeDots(e);}};
 const runtime=WandererV012CombatRuntime.create(ports);
 const e={hp:1000,maxhp:1000,dots:{bleed:[],burn:[]}},r={hp:50,maxhp:200,enemy:e,enemies:[e],groupReserve:[]};
 const b=B.create();B.syncPermanent(b,progress);
 const c={player:r,enemy:e,now:0,waveKey:'first',base:100,power:0,random:()=>.99999,dot(){},damage(n,label){hits.push([label,n]);e.hp-=n;return n;},heal(){return 0;},barrier(){},log(){},metric(k,n){metrics[k]=(metrics[k]||0)+n;}};
 return {progress,r,e,b,c,runtime,metrics,hits};
}
test('New Blood talents are genuinely purchasable at the approved budgets',()=>{
 for(const [id,cost] of [['accelerated_bleeding',6],['sanguine_reserve',7]]){
  const p=buy([id],{xp:cost*100});assert.equal(p.nodes.length,cost);assert(T.valid(p));assert(p.nodes.includes(id));
 }
});
test('Accelerated primary Bleed has equal total damage and tick count; spread and Burn remain on the ordinary clock',()=>{
 const h=fixture(['accelerated_bleeding']),{e,r,runtime,metrics}=h;
 e.dots.bleed=[{damage:10,remaining:3},{damage:5,remaining:3,spread:true}];e.dots.burn=[{damage:7,remaining:3}];runtime.synchronizeDots(e);
 runtime.advanceAcceleratedBleed(r,.74);assert.equal(e.hp,1000);
 runtime.advanceAcceleratedBleed(r,.01);assert.equal(e.hp,990);
 assert.equal(runtime.tickDots(e),12);assert.equal(e.dots.bleed[0].remaining,2);
 runtime.advanceAcceleratedBleed(r,.75);runtime.advanceAcceleratedBleed(r,.75);
 assert.equal(e.hp,970);assert.equal(metrics.acceleratedBleedTicks,3);assert.equal(metrics.acceleratedBleedDamage,30);
 assert.equal(e.dots.bleed.length,1);assert.equal(e.dots.bleed[0].remaining,2);
 assert.equal(runtime.tickDots(e),12);
 const plain=fixture();plain.e.dots.bleed=[{damage:10,remaining:3}];plain.runtime.advanceAcceleratedBleed(plain.r,3);
 assert.equal(plain.e.hp,1000);assert.equal(plain.runtime.tickDots(plain.e),10);
});
test('Sanguine Reserve uses only effective healing, isolated physical hits, one original tick, class caps and cooldown',()=>{
 const h=fixture(['sanguine_reserve']),{e,r,b,c,hits}=h;
 e.dots.bleed=[{damage:30,remaining:3},{damage:999,remaining:3,spread:true}];e.bleedStacks=2;
 B.onHeal(b,c,0);assert.equal(r.sanguineReserve,undefined);
 B.onHeal(b,c,20);assert.equal(r.sanguineReserve,5);B.onAttack(b,c);assert(!hits.length);
 B.onHeal(b,c,20);assert.equal(r.sanguineReserve,10);
 r.groupReserve=[{}];B.onAttack(b,c);assert(!hits.length);r.groupReserve=[];
 c.magical=true;B.onAttack(b,c);assert(!hits.length);c.magical=false;
 e.boss=true;B.onAttack(b,c);assert.deepEqual(hits,[['🩸 Sanguine Reserve',5]]);assert.equal(r.sanguineReserve,0);assert.equal(e.dots.bleed[0].remaining,3);
 B.onHeal(b,c,100);B.onAttack(b,c);assert.equal(hits.length,1);c.now=4;B.onAttack(b,c);assert.equal(hits.length,2);
 B.onHeal(b,c,100);c.waveKey='second';c.now=10;B.onAttack(b,c);assert.equal(hits.length,2);assert.equal(r.sanguineReserve,0);
});
test('Focused Assault only multiplies physical weapon damage with one living enemy and no reserve',()=>{
 const h=fixture(['single_target_mastery']),{r,runtime}=h;
 assert.equal(runtime.focusedWeaponDamage(r,100,true),115);assert.equal(runtime.focusedWeaponDamage(r,100,false),100);
 r.groupReserve=[{}];assert.equal(runtime.focusedWeaponDamage(r,100,true),100);r.groupReserve=[];
 r.enemies.push({hp:1});assert.equal(runtime.focusedWeaponDamage(r,100,true),100);
 r.enemies[1].hp=0;assert.equal(runtime.focusedWeaponDamage(r,100,true),115);
});
test('Existing weapon area configurations remain unchanged and spell path does not use Focused Assault',()=>{
 const s=fs.readFileSync('combat/v012-combat-runtime.js','utf8');
 assert(s.includes("includes('cleave_mastery')?.6:.4"));
 assert(s.includes("groupSecondaryDamage(r,base,[.22,.22]"));
 assert(s.includes("includes('bow_pierce')?[1]:[.66]"));
 assert(!s.includes("spellDamage=Math.max(1,Math.round(spellDamage*1.15))"));
});
