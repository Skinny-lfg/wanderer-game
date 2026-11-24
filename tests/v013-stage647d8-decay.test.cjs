'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {T,buy}=require('./v013-current-talent-helper.cjs');
const B=WandererV012Buildcraft;
require('../combat/v012-combat-runtime.js');
function fixture(ids=[]){
 const p=buy(ids),b=B.create();B.syncPermanent(b,p);
 const enemies=Array.from({length:4},()=>({hp:1000,maxhp:1000,barrier:0,dots:{bleed:[],burn:[]},v012Rot:[]}));
 const reserve={hp:1000,maxhp:1000,v012Rot:[]},r={hp:100,maxhp:200,mp:100,maxmp:100,combatSeconds:0,enemy:enemies[0],enemies,groupReserve:[reserve],stats:{defense:10,bonus:{}}};
 const metrics={},hits=[],ports={state:{automaticTalents:p},phase6Metric(r,k,n){metrics[k]=(metrics[k]||0)+n;},phase6Proc(){},floatText(){},addLog(){},setDirectEnemyDamage(r,n,label){return runtime.setDirectEnemyDamage(r,n,label);}};
 const runtime=WandererV012CombatRuntime.create(ports);
 const c={player:r,enemy:r.enemy,now:0,waveKey:'one',base:100,power:100,random:()=>0,log(){},dot(){},chill(){},heal(){return 0;},barrier(){},link(){},trigger(){},mana(n){r.mp=Math.min(r.maxmp,r.mp+n);},damage(n,label){return runtime.setDirectEnemyDamage(r,n,label);},dotDamage(n){c.enemy.hp-=n;},metric(k,n){metrics[k]=(metrics[k]||0)+n;},talentPulseDamage(target,n,id){hits.push({target,n,id});return runtime.talentPulseDamage(r,target,n,id);}};
 const at=(t)=>{c.now=t;r.combatSeconds=t;};
 const attack=t=>{at(t);B.onAttack(b,c);};
 const paid=t=>{at(t);r.mp--;B.applyRot(b,c,20,'paid_primary_toxic_touch');};
 return {p,b,r,c,enemies,reserve,metrics,hits,runtime,at,attack,paid};
}
test('Decay extension nodes are legally available at 6/7/7 points',()=>{
 for(const [id,cost] of [['contagious_touch',6],['corruption_nova',7],['soul_drain',7]]){const p=buy([id]);assert.equal(p.nodes.length,cost);assert(T.valid(p));}
});
test('Real Toxic Touch pays before granting primary credit; free and secondary applications never count',()=>{
 const h=fixture(['contagious_touch','toxic_touch','soul_drain']);
 h.r.mp=0;h.attack(1);assert.equal(h.metrics.decayPrimaryPaidApplications,undefined);
 h.r.mp=100;h.attack(2);assert.equal(h.r.mp,99);assert.equal(h.metrics.decayPrimaryPaidApplications,1);
 B.applyRot(h.b,h.c,100);assert.equal(h.metrics.decayPrimaryPaidApplications,1);
 h.c.enemy=h.enemies[1];h.at(4);B.onSecondaryWeaponStatus(h.b,h.c);assert.equal(h.metrics.decayPrimaryPaidApplications,1);
 assert(h.enemies[1].v012Rot[0].secondaryOrigin==='weapon');
 h.c.enemy=h.enemies[0];h.attack(5);h.attack(7);assert.equal(h.metrics.contagiousTouchActivations,1);assert.equal(h.metrics.contagiousTouchSpread,2);
});
test('Contagious Touch copies a single half-strength stack to at most two living active targets without overriding caps',()=>{
 const h=fixture(['contagious_touch']);h.enemies[1].v012Rot=Array.from({length:6},()=>({damage:10,remaining:3}));h.enemies[3].hp=0;
 h.paid(1);h.paid(2);h.paid(3);const source=h.enemies[0].v012Rot.at(-1),copy=h.enemies[2].v012Rot[0];
 assert.equal(copy.damage,Math.max(1,Math.round(source.damage*.5)));assert.equal(copy.remaining,3);assert.equal(copy.secondaryOrigin,'contagious_touch');assert(!copy.primaryPaid);
 assert.equal(h.enemies[1].v012Rot.length,6);assert.equal(h.reserve.v012Rot.length,0);assert.equal(h.enemies[3].v012Rot.length,0);
 h.paid(4);h.paid(5);h.paid(6);assert.equal(h.metrics.contagiousTouchActivations,1);h.paid(7);assert.equal(h.metrics.contagiousTouchActivations,2);
});
test('Nova uses one strongest paid source and at most three active targets, not every infected enemy; leader caps and no consumption',()=>{
 const h=fixture(['corruption_nova']);h.paid(1);h.paid(2);
 h.enemies[1].boss=true;h.enemies[1].maxhp=200;h.enemies[1].hp=200;
 h.enemies[2].miniboss=true;h.enemies[2].maxhp=200;h.enemies[2].hp=200;
 h.enemies[3].v012Rot=[{damage:999,remaining:3,secondaryOrigin:'carrion',spread:true}];
 h.at(5);B.onSecond(h.b,h.c);assert.equal(h.hits.length,0);
 const raw=h.enemies[0].v012Rot.reduce((n,d)=>n+d.damage,0)*.75;
 h.at(6);B.onSecond(h.b,h.c);assert.equal(h.hits.length,3);assert.deepEqual(h.hits.map(x=>x.n),[raw,2,4]);assert.equal(h.reserve.hp,1000);
 assert.equal(h.metrics.corruptionNovaActivations,1);assert.equal(h.enemies[0].v012Rot.length,2);B.onSecond(h.b,h.c);assert.equal(h.hits.length,3);
});
test('Mixed AoE safeguards prevent new spread and Nova with Carrion or prepared Bloom, but not merely owned unprepared Bloom',()=>{
 for(const mixed of ['carrion_detonation','grave_bloom']){
  const h=fixture(['contagious_touch','corruption_nova']);h.b.runtime.specializations.push(mixed);
  if(mixed==='grave_bloom')h.b.runtime.prepared=mixed;
  h.paid(1);h.paid(2);h.paid(3);h.at(6);B.onSecond(h.b,h.c);
  assert.equal(h.metrics.contagiousTouchActivations,undefined);assert.equal(h.hits.length,0);
 }
 const h=fixture(['contagious_touch']);h.b.runtime.specializations.push('grave_bloom');h.paid(1);h.paid(2);h.paid(3);assert.equal(h.metrics.contagiousTouchActivations,1);
});
test('Soul Drain refunds up to two Mana once per four successful paid applications, global cooldown, reset by encounter',()=>{
 const h=fixture(['soul_drain']);h.paid(1);h.paid(2);h.paid(3);assert.equal(h.r.mp,97);h.paid(4);assert.equal(h.r.mp,98);assert.equal(h.metrics.soulDrainMana,2);
 h.paid(5);h.paid(6);h.paid(7);h.paid(8);assert.equal(h.metrics.soulDrainActivations,1);h.paid(9);assert.equal(h.metrics.soulDrainActivations,2);
 h.paid(10);h.paid(11);h.paid(12);h.c.waveKey='two';h.paid(15);assert.equal(h.metrics.soulDrainActivations,2);assert.equal(h.r.decayTalentState.soul,1);
});
test('Corruption Cycle preserves mana cost, stack consumption and burst, measures actual charge and does not arm cooldown on failed payment',()=>{
 const h=fixture(['corruption_cycle']);h.enemies[0].v012Rot=Array.from({length:3},()=>({damage:10,remaining:4}));
 h.c.random=()=>.999;h.c.spendMana=()=>false;h.at(1);B.onAttack(h.b,h.c);assert.equal(h.b.cooldowns.corruptionCycle,undefined);
 h.c.spendMana=n=>{h.r.mp-=n;return true;};B.onAttack(h.b,h.c);assert.equal(h.enemies[0].v012Rot.length,2);assert.equal(h.metrics.corruptionCycleMana,4);assert.equal(h.metrics.corruptionCycleConsumedRawRot,40);assert.equal(h.metrics.corruptionCycleRawBurst,60);
});
test('Native simulator exports Decay telemetry and canonical mirrors match',()=>{
 assert(fs.readFileSync('scripts/simulate-progression.cjs','utf8').includes('decayTalentMetrics:'));
 for(const p of ['combat/v012-buildcraft.js','combat/v012-combat-runtime.js','combat/talent-graph-next.js'])assert.equal(fs.readFileSync(p,'utf8'),fs.readFileSync('docs/'+p,'utf8'));
});
