'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const N=require('../scripts/v013-natural-progression.cjs'),A=require('../scripts/v013-agent-strategy.cjs'),S=require('../scripts/simulate-progression.cjs'),B=require('../scripts/v013-build-planner.cjs'),create=require('./v012-economy-harness.cjs');
const P=globalThis.WandererV012Consumables,C=globalThis.WandererV013Crafting,T=globalThis.WandererAutomaticTalents;
const clone=x=>JSON.parse(JSON.stringify(x));
function setup(seed=8801){const a=create(seed,undefined,{}, {skipPersistence:true}),s=a.state();s.crafting=C.create();s.crafting.essence=20;for(const f of C.FAMILIES)s.crafting.cores[f]=3;s.gold=100;s.fragments=1000;s.consumables={};s.potionSelection=[];return {a,s};}
test('all active controlled and strategic profile goals refer to current non-pending native nodes',()=>{
 const ids=new Set(T.NODES.filter(n=>!n.pending).map(n=>n.id));
 for(const b of S.BUILDS)for(const id of b.skills)assert(ids.has(id),b.id+': '+id);
 for(const [name,b] of Object.entries(B.BUILDS))for(const id of b.milestones)assert(ids.has(id),name+': '+id);
 for(const [name,b] of Object.entries(N.PROFILES))for(const id of [...(b.targets||[]),...(b.preparedTargets||[])])assert(ids.has(id),name+': '+id);
 for(const b of Object.values(N.PIVOTS))for(const id of [...(b.targets||[]),...(b.preparedTargets||[])])assert(ids.has(id),id);
});
test('retired focus names and old draft picks cannot grant agent capabilities',()=>{
 const equipment={weapon:{subtype:'Staff'}};
 const clean=A.classify({equipment,talents:{nodes:['overcharge'],element:'lightning'}});
 const stale=A.classify({equipment,talents:{nodes:['overcharge','lightning_focus','fire_focus','frost_focus','rot_focus'],element:'lightning'},build:{picks:['vital_pulse','ward_echo']}});
 assert.deepEqual(stale,clean);
 const actual=A.classify({equipment,talents:{nodes:['overcharge','static_focus','storm_conductor'],element:'lightning'}});
 assert(actual.areaReady);assert(actual.focus>clean.focus);
});
test('scores every native potion and reserves resources while crafting through native API',()=>{
 const {a,s}=setup();for(const profile of [N.PROFILES.cautious,N.PROFILES['smart-decay-cycle-staff'],N.PROFILES['arcane-fire']])for(const p of P.CATALOG)assert(Number.isFinite(N.potionScore(p.id,profile,a.vitals())),p.id);
 const before=clone(s),actions=N.craftEarnedPotions(a,N.PROFILES['arcane-fire']);
 assert(actions.length>0&&actions.length<=2);assert(actions.every(x=>x.action==='craft'));
 assert.equal(s.gold,before.gold);assert.equal(s.fragments,before.fragments);
 assert.equal(s.crafting.essence,before.crafting.essence-actions.reduce((n,x)=>n+x.essenceSpent,0));
 for(const f of C.FAMILIES)assert.equal(s.crafting.cores[f],before.crafting.cores[f]-actions.reduce((n,x)=>n+(x.reagentsSpent[f]||0),0));
 for(const p of actions)assert.equal(s.consumables[p.kind],1);
 assert(s.potionSelection.length<=3);
});
test('agent loadout respects full-Stash restrictions without fake inventory or exception',()=>{
 const {a,s}=setup();s.consumables={prospector:1,wisdom:1,fortune:1,health:1};s.potionSelection=['prospector','wisdom','fortune'];s.stash=Array.from({length:a.storage.capacity()-1},()=>a.makeItem(1,'belt',null,'loot','Belt','Common'));
 const before=clone(s.consumables);assert.equal(a.storage.occupied(),a.storage.capacity());
 assert.doesNotThrow(()=>N.selectEarnedPotions(a,N.PROFILES.cautious));assert.equal(s.potionSelection.length,3);assert.deepEqual(clone(s.consumables),before);assert.equal(a.storage.occupied(),a.storage.capacity());
});
test('agent refines the actual missing secondary Reagent through Forge only',()=>{
 const {a,s}=setup(),r=C.RECIPES.find(r=>r.rarity==='Epic'),cost=C.cost(r.id,1);
 s.crafting.learnedRecipes=[r.id];s.crafting.essence=cost.essence+6;s.fragments=cost.fragments;
 const family=Object.keys(cost.reagents)[1];assert(family);for(const [f,n] of Object.entries(cost.reagents))s.crafting.cores[f]=n;
 s.crafting.cores[family]=cost.reagents[family]-1;s.crafting.dryRooms[family]=3;
 const actions=N.refineEarnedReagents(a,{...N.PROFILES.cautious,families:[r.family]},1);
 assert.equal(actions.length,1);assert.equal(actions[0].family,family);assert.equal(s.crafting.essence,cost.essence);assert.equal(s.crafting.cores[family],cost.reagents[family]);assert.equal(s.crafting.dryRooms[family],0);assert(a.forge.progress(r.id,1).ready);
});
test('auto potion telemetry is emitted once per native used slot, never before start',()=>{
 const {a,s}=setup();s.consumables={fortune:1,wisdom:1,prospector:1};s.potionSelection=['fortune','wisdom','prospector'];
 const history=[];a.start(1,true);N.recordAutomaticPotions(a,history);assert.equal(history.length,0);
 assert(a.potions.start());N.recordAutomaticPotions(a,history);N.recordAutomaticPotions(a,history);
 assert.deepEqual(history.map(x=>x.kind),['fortune','wisdom','prospector']);assert(history.every(x=>x.automatic));assert.deepEqual(clone(s.consumables),{fortune:0,wisdom:0,prospector:0});
});
test('controlled fingerprint includes current native potion, crafting, rewards and equipment modules',()=>{
 const f=S.sourceFingerprint();for(const path of ['online/v012-consumables.js','economy/v013-crafting.js','economy/v012-equipment-runtime.js','online/v012-persistence-runtime.js','scripts/v013-agent-strategy.cjs'])assert(f.files.includes(path),path);
});
