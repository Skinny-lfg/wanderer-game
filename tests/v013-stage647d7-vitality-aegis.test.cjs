'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {T,buy}=require('./v013-current-talent-helper.cjs');
require('../combat/v012-combat-runtime.js');
const B=WandererV012Buildcraft;
function fixture(ids){
 const progress=buy(ids),metrics={},hits=[],b=B.create();B.syncPermanent(b,progress);
 const enemies=Array.from({length:4},()=>({hp:1000,maxhp:1000,barrier:0,dots:{bleed:[],burn:[]},v012Rot:[]}));
 const reserve={hp:1000,maxhp:1000},r={hp:100,maxhp:200,barrier:20,stats:{defense:40,bonus:{}},mp:50,maxmp:100,combatSeconds:0,enemy:enemies[0],enemies,groupReserve:[reserve]};
 const ports={state:{automaticTalents:progress},phase6Metric(r,k,n){metrics[k]=(metrics[k]||0)+n;},phase6Proc(){},floatText(){},addLog(){},setDirectEnemyDamage(r,n,label){return runtime.setDirectEnemyDamage(r,n,label);}};
 const runtime=WandererV012CombatRuntime.create(ports);
 const c={player:r,enemy:enemies[0],now:0,waveKey:'first',base:100,power:0,random:()=>.99999,dot(){},damage(n,label){return runtime.talentPulseDamage(r,c.enemy,n,label);},dotDamage(){},heal(){return 0;},barrier(){},mana(){},log(){},metric(k,n){metrics[k]=(metrics[k]||0)+n;},talentPulseDamage(target,n,id){hits.push({target,n,id});return runtime.talentPulseDamage(r,target,n,id);}};
 const at=t=>{c.now=t;r.combatSeconds=t;B.onSecond(b,c);};
 return {progress,b,r,c,enemies,reserve,metrics,hits,runtime,at};
}
test('Four new defensive talents are available at legal six/seven point budgets',()=>{
 for(const [id,cost] of [['vital_pulse',6],['living_force',7],['grasping_roots',7],['ward_echo',6]]){
  const p=buy([id],{xp:cost*100});assert.equal(p.nodes.length,cost);assert(T.valid(p));assert(p.nodes.includes(id));
 }
});
test('Vital Pulse waits four seconds, hits only four living active targets and observes leader caps',()=>{
 const h=fixture(['vital_pulse']);h.enemies[1].maxhp=200;h.enemies[1].hp=200;h.enemies[1].boss=true;
 h.enemies[2].maxhp=200;h.enemies[2].hp=200;h.enemies[2].miniboss=true;h.enemies[3].hp=0;
 h.at(3);assert.equal(h.hits.length,0);h.at(4);
 assert.deepEqual(h.hits.map(x=>x.n),[4,1,2.5]);assert.equal(h.reserve.hp,1000);
 assert.equal(h.metrics.vital_pulseActivations,1);assert.equal(h.metrics.vital_pulseTargets,3);
 assert.equal(h.r.enemy,h.enemies[0]);h.at(4);assert.equal(h.hits.length,3);h.at(8);assert.equal(h.hits.length,6);
});
test('Ward Echo requires current Barrier, does not bank missed pulses or scale from Barrier size',()=>{
 const h=fixture(['ward_echo']);h.r.barrier=0;h.at(4);assert.equal(h.hits.length,0);
 h.r.barrier=10;h.at(5);assert.equal(h.hits.length,0);h.at(8);assert.equal(h.hits.length,4);assert(h.hits.every(x=>x.n===8));
 h.r.barrier=100000;h.at(12);assert.equal(h.hits.length,8);assert(h.hits.every(x=>x.n===8));
});
test('Grasping Roots is bounded damage plus two-second normal-only slow, not multiplicative Chill',()=>{
 const h=fixture(['grasping_roots']);h.enemies[1].boss=true;h.enemies[2].miniboss=true;
 h.at(7);assert.equal(h.hits.length,0);h.at(8);assert.equal(h.hits.length,4);
 assert.equal(h.enemies[0].graspingRootsUntil,10);assert.equal(h.enemies[1].graspingRootsUntil,undefined);assert.equal(h.enemies[2].graspingRootsUntil,undefined);
 assert.equal(h.runtime.enemySlowFactor(h.enemies[0],h.r.stats,9),1.15);h.enemies[0].slowTime=1;
 assert.equal(h.runtime.enemySlowFactor(h.enemies[0],h.r.stats,9),1.22);
 h.enemies[0].slowTime=0;assert.equal(h.runtime.enemySlowFactor(h.enemies[0],h.r.stats,10),1);
});
test('Living Force uses effective healing only, releases one capped charge, respects cooldown and encounter reset',()=>{
 const h=fixture(['living_force']),{b,c,r}=h;
 B.onHeal(b,c,0);assert.equal(r.livingForceCharge,undefined);
 B.onHeal(b,c,25);assert.equal(r.livingForceCharge,5);B.onAttack(b,c);assert.equal(h.hits.length,0);
 B.onHeal(b,c,25);assert.equal(r.livingForceCharge,10);
 B.onAttack(b,{...c,offhand:true});assert.equal(h.hits.length,0);
 B.onAttack(b,{...c,proc:true});assert.equal(h.hits.length,0);
 B.onAttack(b,c);assert.equal(h.hits.length,1);assert.equal(h.hits[0].n,10);assert.equal(r.livingForceCharge,0);
 B.onHeal(b,c,100);B.onAttack(b,c);assert.equal(h.hits.length,1);c.now=4;B.onAttack(b,c);assert.equal(h.hits.length,2);
 B.onHeal(b,c,100);c.waveKey='next';c.now=10;B.onAttack(b,c);assert.equal(h.hits.length,2);assert.equal(r.livingForceCharge,0);
});
test('Stored Force preserves 30% input and 25% Max HP threshold and records native telemetry',()=>{
 const h=fixture(['stored_force']);let area=0;h.c.areaDamage=n=>area+=n;
 B.onDefend(h.b,h.c,20,30);assert.equal(h.b.runtime.storedForce,15);assert.equal(area,0);
 B.onDefend(h.b,h.c,100,50);assert.equal(area,50);assert.equal(h.b.runtime.storedForce,0);
 assert.equal(h.metrics.storedForceChargeGenerated,60);assert.equal(h.metrics.storedForceChargeAccepted,50);assert.equal(h.metrics.storedForceActivations,1);
});
test('Native pulse resolver rejects reserve and dead targets, consumes Barrier and restores selected target',()=>{
 const h=fixture(['vital_pulse']);const e=h.enemies[1];e.barrier=5;
 assert.equal(h.runtime.talentPulseDamage(h.r,e,3,'vital_pulse'),0);assert.equal(e.barrier,2);
 assert.equal(h.runtime.talentPulseDamage(h.r,e,5,'vital_pulse'),3);assert.equal(h.r.enemy,h.enemies[0]);
 assert.equal(h.metrics.secondaryTargetDamage,3);assert.equal(h.runtime.talentPulseDamage(h.r,h.reserve,100,'vital_pulse'),0);
 e.hp=0;assert.equal(h.runtime.talentPulseDamage(h.r,e,10,'vital_pulse'),0);
});
test('Simulator reports the new actual defensive metrics and canonical mirrors match',()=>{
 assert(fs.readFileSync('scripts/simulate-progression.cjs','utf8').includes('defensiveTalentMetrics:'));
 for(const p of ['combat/v012-buildcraft.js','combat/v012-combat-runtime.js','combat/talent-graph-next.js'])assert.equal(fs.readFileSync(p,'utf8'),fs.readFileSync('docs/'+p,'utf8'));
});
