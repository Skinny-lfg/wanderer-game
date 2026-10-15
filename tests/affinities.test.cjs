const {test}=require('node:test'),assert=require('node:assert/strict'),A=require('../combat/affinities.js');
function run(counts={}){return {stats:{counts},hp:100,maxhp:100,barrier:0,tEnemy:0,enemy:{hp:1000,maxhp:1000,def:20,baseDef:20,barrier:0,boss:false,slowTime:0,dots:{poison:[],bleed:[],burn:[]}}};}
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
const dot=()=>({damage:10,remaining:3});
test('all nine sets retain their base at 3/5, all tiers cumulative, no bonus at 1 or extra amplification at 6',()=>{
 for(const [effect,d]of Object.entries(A.DEFINITIONS)){
  assert.deepEqual(A.bonuses({[effect]:1}),{list:[],values:{}});
  for(const n of [2,3,5,6]){const b=A.bonuses({[effect]:n});for(const [k,v]of Object.entries(d.base))assert.equal(b.values[k],v);assert.deepEqual(b.list[0].tiers,[2,3,5].filter(t=>t<=n));assert.equal(!!b.values[effect+'Mechanic'],n>=3);assert.equal(!!b.values[effect+'Signature'],n>=5);assert.ok(A.describe(effect,b.values).includes(d.tiers[2]));}
 }
});
test('Poison: weakening follows stacks; burst consumes, caps damage and cannot recur during cooldown',()=>{
 const r=run({poison:5});r.enemy.dots.poison=Array.from({length:6},dot);near(A.incomingMultiplier(r),.94);A.venomBurst(r,100);near(r.enemy.hp,900);assert.equal(r.enemy.dots.poison.length,0);near(A.incomingMultiplier(r),1);r.enemy.dots.poison=Array.from({length:6},dot);A.venomBurst(r,100);near(r.enemy.hp,900);A.tick(r,10);A.venomBurst(r,100);near(r.enemy.hp,800);
});
test('Bleed: speed stacks rate-limited, capped and expiring; wounded hit is bounded and cooldown-limited',()=>{
 const r=run({bleed:5});for(let t=0;t<3;t++){A.finishAttack(r,100,false,{extra:[]},true);A.finishAttack(r,100,false,{extra:[]},true);if(t<2)A.tick(r,1);}near(A.speedMultiplier(r),1.15);r.enemy.dots.bleed=[dot()];r.enemy.hp=301;assert.equal(A.beforeAttack(r,100).extra.length,0);r.enemy.hp=300;const p=A.beforeAttack(r,100);near(p.extra[0].damage,40);A.finishAttack(r,100,false,p,true);near(r.enemy.hp,260);assert.equal(A.beforeAttack(r,100).extra.length,0);A.tick(r,3);near(A.speedMultiplier(r),1);
});
test('Sunder: vulnerability requires original Armor; Barrier break and boss stagger bounded; shared immunity prevents chained delays',()=>{
 const r=run({sunder:5,slow:5});r.enemy.def=10;r.enemy.barrier=200;r.enemy.boss=true;A.beforeAttack(r,100);near(r.enemy.barrier,100);near(r.tEnemy,-.2);A.deal(r,100);near(r.enemy.hp,992);r.enemy.slowTime=10;A.tick(r,3);near(r.tEnemy,-.2);A.tick(r,1);near(r.tEnemy,-.45);r.enemy.baseDef=0;assert.equal(A.vulnerable(r),false);
});
test('Critical: Focus cap/rate/expiry and Perfect Strike never refills itself',()=>{
 const r=run({crit:5});for(let n=0;n<3;n++){A.finishAttack(r,100,true,{extra:[]},false);A.finishAttack(r,100,true,{extra:[]},false);if(n<2)A.tick(r,1);}assert.equal(A.state(r).focus,3);const p=A.beforeAttack(r,100);assert.equal(p.perfect,true);A.finishAttack(r,100,true,p,false);assert.equal(A.state(r).focus,0);assert.equal(A.beforeAttack(r,100).perfect,false);A.tick(r,1);A.finishAttack(r,100,true,{extra:[]},false);A.tick(r,6);assert.equal(A.state(r).focus,0);
});
test('Shield: Block counter does not stack, expires, and respects damage cap; Bastion consumes real Barrier',()=>{
 const r=run({shield:5});A.onBlock(r,1000);A.onBlock(r,1000);const p=A.beforeAttack(r,100);near(p.extra[0].damage,25);A.finishAttack(r,100,false,p,false);near(r.enemy.hp,975);A.barrier(r,1000);near(r.barrier,30);A.afterIncoming(r);const b=A.beforeAttack(r,100);near(r.barrier,15);near(b.extra[0].damage,15);A.afterIncoming(r);assert.equal(A.beforeAttack(r,100).extra.length,0);A.tick(r,4);A.onBlock(r,100);A.tick(r,4);assert.equal(A.beforeAttack(r,100).extra.length,0);
});
test('Regen: overheal limits per second, encounter and total Barrier',()=>{
 const r=run({regen:3});A.heal(r,1000);near(r.barrier,1);A.heal(r,1000);near(r.barrier,1);for(let n=0;n<20;n++){A.tick(r,1);A.heal(r,1000);}near(r.barrier,10);A.beginEncounter(r);A.heal(r,1000);near(r.barrier,11);r.barrier=30;A.tick(r,1);A.heal(r,1000);near(r.barrier,30);
});
test('Second Wind persists across encounters and serialized runs; second lethal hit still kills',()=>{
 let r=run({regen:5});r.hp=-100;A.afterIncoming(r);near(r.hp,1);near(r.barrier,8);A.beginEncounter(r);r=JSON.parse(JSON.stringify(r));r.hp=-1;A.afterIncoming(r);near(r.hp,-1);assert.equal(A.state(r).secondWindUsed,true);
});
test('Fire: one Heat per damaging tick second, cap/expiry; Flashover cannot generate Heat',()=>{
 const r=run({burn:5});A.dotTick(r,0);assert.equal(A.state(r).heat,0);for(let i=0;i<5;i++){A.dotTick(r,30);A.dotTick(r,300);if(i<4)A.tick(r,1);}assert.equal(A.state(r).heat,5);const p=A.beforeAttack(r,100);A.finishAttack(r,100,false,p,false);near(r.enemy.hp,950);assert.equal(A.state(r).heat,0);A.dotTick(r,20);A.tick(r,5);assert.equal(A.state(r).heat,0);
});
test('Frost: continuous Chill required, breaks reset progress, normal and boss delays/cooldowns limited',()=>{
 for(const boss of [false,true]){const r=run({slow:5});r.enemy.boss=boss;r.enemy.slowTime=3;A.tick(r,2);r.enemy.slowTime=0;A.tick(r,.1);r.enemy.slowTime=10;A.tick(r,2);near(r.tEnemy,0);A.tick(r,1);near(r.tEnemy,boss?-.25:-.75);A.tick(r,3);near(r.tEnemy,boss?-.25:-.75);near(A.incomingMultiplier(r),.92);}
});
test('Dark: only actual Drain heals grant charges, HP threshold strict, sacrifice and recovery capped, no recursive charges',()=>{
 const r=run({drain:5});A.heal(r,20,'drain');assert.equal(A.state(r).souls,0);for(let i=0;i<3;i++){r.hp=50;A.heal(r,1,'drain');A.heal(r,1,'drain');if(i<2)A.tick(r,1);}assert.equal(A.state(r).souls,3);r.hp=40;assert.equal(A.beforeAttack(r,100).extra.length,0);r.hp=50;const p=A.beforeAttack(r,100);near(r.hp,47);A.finishAttack(r,100,false,p,false);near(r.hp,51);assert.equal(A.state(r).souls,0);near(r.enemy.hp,960);
});
test('encounter reset clears temporary resources while cooldowns and expedition charge persist',()=>{
 const r=run({crit:5});Object.assign(A.state(r),{focus:3,heat:4,souls:2,speed:[3],secondWindUsed:true,cooldowns:{crit:10}});A.beginEncounter(r);assert.equal(A.state(r).focus,0);assert.equal(A.state(r).heat,0);assert.equal(A.state(r).souls,0);assert.equal(A.state(r).secondWindUsed,true);assert.equal(A.state(r).cooldowns.crit,10);assert.equal(A.state(r).time,0);
});
test('extra damage respects remaining health and Barrier; combined weakening bounded; no unbounded event queue',()=>{
 const r=run({poison:5,slow:5});r.enemy.dots.poison=Array.from({length:100},dot);r.enemy.slowTime=3;assert.ok(A.incomingMultiplier(r)>=.85);r.enemy.hp=5;r.enemy.barrier=10;near(A.deal(r,1000),5);near(r.enemy.hp,0);for(let i=0;i<100;i++){r.stats.counts.drain=3;r.hp=1;A.heal(r,1,'drain');A.tick(r,1);}assert.ok(A.drainEvents(r).length<=40);
});
