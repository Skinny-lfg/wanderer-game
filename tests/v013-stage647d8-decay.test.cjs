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
 const paid=t=>{at(t);r.mp--;B.applyRot(b,c,20,'paid_primary_corrupting_touch');};
 return {p,b,r,c,enemies,reserve,metrics,hits,runtime,at,attack,paid};
}
test('Decay extension nodes retain legal access and Overflow reuses Nova id',()=>{for(const [id,cost] of [['contagious_touch',6],['corruption_nova',7],['soul_drain',7]])assert.equal(buy([id]).nodes.length,cost);assert.equal(T.NODES.find(n=>n.id==='corruption_nova').name,'Corruption Overflow');});
test('Corrupting Touch costs four Mana, persists for six ticks, caps at six, and preserves finite secondary Rot',()=>{const h=fixture(['corrupting_touch']);h.attack(1);assert.equal(h.r.mp,96);assert.equal(h.metrics.decayPrimaryPaidApplications,1);const stack=h.enemies[0].v012Rot[0];assert(stack.primaryPaid);for(let i=0;i<7;i++){h.at(2+i);B.tickRot(h.b,h.c);}assert.equal(h.enemies[0].v012Rot.length,1);for(let i=0;i<7;i++)h.paid(10+i);assert.equal(h.enemies[0].v012Rot.length,6);h.c.enemy=h.enemies[1];h.at(20);B.onSecondaryWeaponStatus(h.b,h.c);assert.equal(h.enemies[1].v012Rot[0].secondaryOrigin,'weapon');for(let i=0;i<4;i++)B.tickRot(h.b,h.c);assert.equal(h.enemies[1].v012Rot.length,0);});
test('Contagious Touch spreads to three active targets, not reserve or full targets; Soul Drain credits only paid primary actions',()=>{const h=fixture(['contagious_touch','soul_drain']);h.paid(1);h.paid(2);assert.equal(h.metrics.contagiousTouchSpread,3);assert.equal(h.enemies[1].v012Rot[0].damage,h.enemies[0].v012Rot[0].damage);assert.equal(h.reserve.v012Rot.length,0);h.paid(3);h.paid(4);assert.equal(h.metrics.soulDrainMana,4);});
test('Overflow independently seeds Rot, checks three stacks, splits damage and does not consume',()=>{
 for(const count of [0,1,2,3]){
  const h=fixture(['corruption_nova']);h.c.random=()=>.9999;
  h.r.enemies=h.enemies.slice(0,count+1);
  h.enemies[0].v012Rot=Array.from({length:2},()=>({damage:20,remaining:4,spread:true}));
  for(const target of h.r.enemies.slice(1))target.v012Rot=[{damage:10,remaining:4,spread:true}];
  h.attack(2);
  assert.equal(h.metrics.anchorSpreadSource_ability_overflow,1);assert.equal(h.metrics.corruptionOverflowActivations,1);assert.equal(h.metrics.corruptionOverflowMana,6);
  assert.equal(h.r.mp,94);assert.equal(h.enemies[0].v012Rot.length,3);assert.equal(h.hits.length,count);assert.equal(h.reserve.hp,1000);
  assert.equal(h.metrics.anchorSpreadOverflowBudget||0,count?h.metrics.anchorSpreadOverflowPrimary:0);
  assert((h.metrics.anchorSpreadOverflowSecondary||0)<=(h.metrics.anchorSpreadOverflowBudget||0));
  h.attack(3);assert.equal(h.metrics.corruptionOverflowActivations,1);assert.equal(h.r.mp,94);
 }
 const h=fixture(['corruption_nova']);h.c.random=()=>.9999;h.attack(1);assert.equal(h.enemies[0].v012Rot.length,1);assert.equal(h.metrics.corruptionOverflowActivations||0,0);assert.equal(h.r.mp,94);
});
test('Cycle pays independently, adds two persistent Rot, consumes three only when available',()=>{
 const h=fixture(['corruption_cycle']);h.r.enemies=[h.enemies[0]];h.c.random=()=>.9999;
 h.attack(2);assert.equal(h.enemies[0].v012Rot.length,2);assert.equal(h.metrics.decayPrimaryPaidApplications||0,0);assert.equal(h.metrics.anchorSpreadCycleSeedOnly,1);assert.equal(h.r.mp,90);
 for(let i=0;i<8;i++){h.at(3+i);B.tickRot(h.b,h.c);}assert.equal(h.enemies[0].v012Rot.length,2);
 h.attack(11);assert.equal(h.enemies[0].v012Rot.length,1);assert.equal(h.metrics.corruptionCycleStacksConsumed,3);assert.equal(h.metrics.corruptionCycleMana,20);assert.equal(h.r.mp,80);
});
test('Blight seeds persistent Rot on a clean enemy without Corrupting Touch credit',()=>{
 const h=fixture(['blightburst']);h.c.random=()=>.9999;h.attack(1);
 assert.equal(h.metrics.anchorSpreadSource_ability_blightburst,1);assert.equal(h.enemies[0].v012Rot.length,1);assert.equal(h.r.mp,92);assert.equal(h.metrics.decayPrimaryPaidApplications||0,0);
});
test('Mixed AoE safeguards prevent duplicate spread and Overflow',()=>{for(const mixed of ['carrion_detonation','grave_bloom']){const h=fixture(['contagious_touch','corruption_nova']);h.b.runtime.specializations.push(mixed);if(mixed==='grave_bloom')h.b.runtime.prepared=mixed;for(let i=0;i<6;i++)h.attack(2+i*2);assert.equal(h.metrics.contagiousTouchActivations,undefined);assert.equal(h.metrics.corruptionOverflowActivations,undefined);}});
test('Plagueheart shared tick budget and reserve; adding another affinity refunds Plagueheart',()=>{const h=fixture(['plagueheart']);for(const e of h.enemies){e.v012Rot=[{damage:4,remaining:4,primaryPaid:true},{damage:2,remaining:4,secondaryOrigin:'weapon'}];h.c.enemy=e;h.at(1);B.tickRot(h.b,h.c);}assert.equal(h.r.mp,94);assert.equal(h.metrics.decayPrimaryPaidPlagueheartActivations,1);h.r.mp=20;h.at(2);B.tickRot(h.b,h.c);assert.equal(h.r.mp,20);let p=T.allocate(h.p,'root_arcane');assert(p);p=T.allocate(p,'affinity_arcane');assert(p&&T.valid(p));assert(!p.nodes.includes('plagueheart'));assert.equal(T.allocate(p,'plagueheart'),null);});
test('Native simulator exports Decay telemetry and canonical mirrors match',()=>{assert(fs.readFileSync('scripts/simulate-progression.cjs','utf8').includes('corruptionOverflow'));for(const p of ['combat/v012-buildcraft.js','combat/v012-combat-runtime.js','combat/talent-graph-next.js','combat/talent-catalog.js','combat/talent-graph-runtime.js'])assert.equal(fs.readFileSync(p,'utf8'),fs.readFileSync('docs/'+p,'utf8'));});
