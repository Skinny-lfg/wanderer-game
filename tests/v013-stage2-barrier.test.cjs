'use strict';
// B4.1 replaces uncapped generation with independent bounded sources.
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs');
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
test('Stage 2 Aegis HP/SP generation formulas remain unchanged with source capacities',()=>{
 for(const hp of [0,20,200,1000]){
  assert.equal(B.barrierAmount(hp,0,.05,.08),hp*.05);
 }
 assert.equal(B.barrierAmount(200,100,.05,.08),18);
 assert.equal(B.barrierAmount(200,100,.03,.06),12);
 assert.equal(B.barrierAmount(200,-50,.05,.08),10);
 assert(Number.isFinite(B.barrierAmount(0,0,.1,.2)));
});
test('Native Barrier is bounded and Ward Strength is applied once',()=>{
 const a=create(9101),r={barrier:0,maxhp:200,stats:{spellPower:100,wardBonus:.2}};
 assert(Math.abs(a.grantBarrier(10,r)-12)<1e-8);
 assert(Math.abs(a.grantBarrier(9999,r)-24)<1e-8);
 assert(Math.abs(r.barrier-36)<1e-8);
 assert.equal(a.grantBarrier(12,r),0);
});
test('Barrier Mastery scales initial Barrier; Runic Shield retains its funded cooldown',()=>{
 for(const power of [0,100]){
  const b=build(['barrier_pulse']),{events,c}=combatContext(power);
  assert(Math.abs(B.aegisBarrier(b,200,power)-(20+power*.16)*1.3)<1e-8);assert(Math.abs(B.aegisBarrier(B.create(),200,power)-(20+power*.16))<1e-8);
  for(const now of [0,1,6,12]){c.now=now;B.onSecond(b,c);}
  assert.equal(events.filter(x=>x[0]==='barrier').length,0);
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
  x.c.now=10;B.onDefend(bastion,x.c,0,10);
  assert.equal(B.bastionCost(bastion,20,10),14);
  assert.equal(B.bastionCost(bastion,20,10),14,'quoting a cost does not consume readiness');
  assert.equal(B.consumeBastion(bastion,10,0),false,'free action must not consume readiness');
  assert.equal(B.bastionCost(bastion,20,10),14);
  assert.equal(B.consumeBastion(bastion,10,14),true);
  assert.equal(B.bastionCost(bastion,20,10),20);
  x.c.now=15;B.onDefend(bastion,x.c,0,10);
  assert.equal(B.bastionCost(bastion,20,15),20,'absorption during cooldown does not arm a discount');
  x.c.now=16;B.onDefend(bastion,x.c,0,10);
  assert.equal(B.bastionCost(bastion,20,16),14,'new absorption after cooldown arms a new discount');
  x.c.now=16;assert.equal(B.consumeBastion(bastion,16,14),true);
  B.onCast(bastion,x.c);
  assert.equal(x.events.filter(e=>e[0]==='barrier').length,1,'only Runic Shield grants Barrier');
  assert(!x.events.some(e=>e[0]==='damage'&&e[1].includes('Arcane Bastion')));
  const rebound=build(['prismatic_rebound']),y=combatContext(spell);
  B.onDefend(rebound,y.c,0,1000);
  assert.equal(rebound.runtime.prismaticCharge,12+spell*.10);
  B.onDefend(rebound,y.c,0,1000);
  assert.equal(rebound.runtime.prismaticCharge,12+spell*.10,'charge is bounded');
  B.onCast(rebound,y.c);
  assert.equal(rebound.runtime.prismaticCharge,0,'rebound is consumed by next funded cast');
 }
});

test('Stage 2 current Talent Tree tooltips describe HP plus Spell Power, not the retired HP-only rule',()=>{
 const nodes=T.NODES;
 const aegis=nodes.find(n=>n.id==='affinity_aegis'),bastion=nodes.find(n=>n.id==='arcane_bastion');
 assert(aegis?.description?.includes('16% Spell Power'),'Aegis selection description must be accurate');
 assert(!aegis.description.includes('stacks freely'),'Aegis tooltip must not describe uncapped Barrier');
 assert(bastion?.description?.includes('30%'),'Arcane Bastion description must reflect mana discount');
});

test('Stage 2 generated Pages mirrors and current tree descriptions have no stale HP-only Aegis logic',()=>{
 for(const file of ['combat/v012-buildcraft.js','combat/v012-combat-runtime.js','combat/talent-graph-next.js','online/v012-expedition-runtime.js']){
  assert.equal(fs.readFileSync('docs/'+file,'utf8'),fs.readFileSync(file,'utf8'),'Generated Pages mirror drift: '+file);
 }
 const graph=fs.readFileSync('docs/combat/talent-graph-next.js','utf8');
 assert(graph.includes('10% Max HP + 16% Spell Power'));
 assert(!graph.includes('3% Max HP + 6% Spell Power'));
 assert(!graph.includes('grant 3% maximum Health as Barrier'));
 assert(!graph.includes('total Barrier limit'));
});
