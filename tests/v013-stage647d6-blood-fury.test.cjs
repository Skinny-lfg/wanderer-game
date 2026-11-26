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
 ports.state.run=r;r.combatSeconds=0;const b=B.create();B.syncPermanent(b,progress);
 const c={player:r,enemy:e,now:0,waveKey:'first',base:100,power:0,random:()=>.99999,dot(){},damage(n,label){hits.push([label,n]);e.hp-=n;return n;},heal(){return 0;},barrier(){},log(){},metric(k,n){metrics[k]=(metrics[k]||0)+n;}};
 return {progress,r,e,b,c,runtime,metrics,hits};
}
test('New Blood talents are genuinely purchasable at the approved budgets',()=>{
 for(const [id,cost] of [['accelerated_bleeding',6],['sanguine_reserve',7]]){
  const p=buy([id],{xp:cost*100});assert.equal(p.nodes.length,cost);assert(T.valid(p));assert(p.nodes.includes(id));
 }
});
test('Bleed has four seconds, independent cadence, uncapped refresh, and separate Burn ticks',()=>{
 const {e,r,runtime,metrics}=fixture(['accelerated_bleeding']);
 const advance=now=>{r.combatSeconds=now;runtime.advanceBleed(r);};
 e.dots.bleed=[{damage:10,remaining:3},{damage:5,remaining:3,spread:true}];e.dots.burn=[{damage:7,remaining:3}];runtime.synchronizeDots(e);
 advance(.74);assert.equal(e.hp,1000);advance(.75);assert.equal(e.hp,990);advance(1);assert.equal(e.hp,985);assert.equal(runtime.tickDots(e),7);
 advance(1.5);assert.equal(e.hp,975);
 e.dots.bleed.push(...Array.from({length:13},()=>({damage:2,remaining:3})));runtime.synchronizeDots(e);
 assert.equal(e.bleedStacks,15);advance(4);assert.equal(e.bleedStacks,15);advance(5.5);assert.equal(e.bleedStacks,0);assert(metrics.acceleratedBleedTicks>0);
 const plain=fixture();plain.e.dots.bleed=[{damage:10,remaining:3}];plain.runtime.synchronizeDots(plain.e);plain.r.combatSeconds=4;plain.runtime.advanceBleed(plain.r);assert.equal(plain.e.hp,960);assert.equal(plain.e.bleedStacks,0);
});
test('Blood Pursuit gives two physical attacks after a bleeding kill, expires and does not cross encounters',()=>{
 const {e,b,c}=fixture(['sanguine_reserve']);const dots=[];c.dot=(kind,amount)=>dots.push([kind,amount]);e.bleedStacks=1;
 B.onHeal(b,c,100);B.onAttack(b,c);assert.equal(dots.length,0);
 B.onKill(b,c);c.magical=true;B.onAttack(b,c);assert.equal(dots.length,0);c.magical=false;
 B.onAttack(b,c);B.onAttack(b,c);B.onAttack(b,c);assert.deepEqual(dots,[['bleed',8],['bleed',8]]);
 B.onKill(b,c);c.now=5;B.onAttack(b,c);assert.equal(dots.length,2);
 c.now=6;B.onKill(b,c);c.waveKey='second';B.onAttack(b,c);assert.equal(dots.length,2);
});
test('Executioner deals 150% of combined tick without consuming stacks',()=>{
 const {e,b,c,hits}=fixture(['executioner']);e.hp=300;e.dots.bleed=[{damage:10,remaining:2},{damage:20,remaining:3}];e.bleedStacks=2;
 B.onAttack(b,c);assert.deepEqual(hits,[['🩸 Execute',45]]);assert.equal(e.dots.bleed.length,2);
 B.onAttack(b,c);assert.equal(hits.length,1);c.now=4;B.onAttack(b,c);assert.equal(hits.length,2);
});
test('Blood Transfer copies all active stacks at half potency, including previously transferred stacks, to active targets only',()=>{
 const {e,r,b,c}=fixture(['sanguine_echo']);e.hp=0;e.dots.bleed=[{damage:10,remaining:2},{damage:8,remaining:3,transferred:true},{damage:1,remaining:1}];e.bleedStacks=3;
 const target={hp:100,dots:{bleed:[{damage:3,remaining:2}]}},reserve={hp:100,dots:{bleed:[]}};r.enemies=[e,target];r.groupReserve=[reserve];let sync=0;
 c.synchronizeDots=()=>sync++;c.secondaryHit=(mob,amount)=>{assert.equal(mob,target);mob.hp-=amount;return amount;};
 B.onKill(b,c);assert.equal(target.hp,91);assert.deepEqual(target.dots.bleed.map(d=>d.damage),[3,5,4]);assert.equal(sync,1);assert.equal(reserve.dots.bleed.length,0);
});
test('A reserved Bleed starts ticking on arrival and not during the wait',()=>{
 const {r,runtime}=fixture(),reserve={hp:100,maxhp:100,dots:{bleed:[{damage:10,remaining:2}],burn:[]}};
 r.groupReserve=[reserve];runtime.synchronizeDots(reserve);r.combatSeconds=10;runtime.advanceBleed(r);assert.equal(reserve.hp,100);
 r.groupReserve=[];r.enemies.push(reserve);runtime.advanceBleed(r);assert.equal(reserve.hp,100);r.combatSeconds=11;runtime.advanceBleed(r);assert.equal(reserve.hp,90);
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
