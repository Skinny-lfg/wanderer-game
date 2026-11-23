'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
require('../scripts/v013-natural-progression.cjs');
const T=globalThis.WandererAutomaticTalents;
const P=require('../scripts/v013-build-planner.cjs');
const A=require('../scripts/v013-stage639-earned-aoe-comparison.cjs');
function budget(points){return T.award(T.create(),points*T.POINT_XP);}
test('Stage 6.42: earned Fury Bow research plans a legal Deep Pierce route before non-AoE milestones',()=>{
 const plan=P.BUILDS['fury-bow'];
 assert.equal(plan.orderedMilestones,true);
 assert.equal(plan.milestones[0],'bow_pierce');
 for(const points of [24,36]){
  const result=P.propose(T,budget(points),'fury-bow');
  assert(result.expectedNodes.includes('bow_pierce'), 'Deep Pierce not earned at '+points+' points');
  assert(T.valid({...budget(points),nodes:result.expectedNodes,element:result.expectedElement}));
 }
});
test('Stage 6.42: a prepared and earned Grave Bloom counts as AoE potential even with no elemental attunement',()=>{
 const nodes=['affinity_magic','affinity_decay','grave_bloom'];
 const snap={state:{automaticTalents:{nodes,prepared:'grave_bloom',element:null},
  equip:{weapon:{subtype:'Wand'},offhand:null}},xp:2500,talentSpent:25,equipPieces:10};
 const a=A.aoeState(snap);
 assert.equal(a.aoePotential,true);
 assert(a.aoeNodes.includes('grave_bloom'));
 snap.state.automaticTalents.prepared=null;
 assert.equal(A.aoeState(snap).aoePotential,false);
});
test('Stage 6.42: only one shared runtime implementation for increased AoE and native telemetry',()=>{
 const read=p=>fs.readFileSync(path.resolve(__dirname,'..',p),'utf8');
 for(const p of ['combat/v012-combat-runtime.js','combat/v012-buildcraft.js','combat/talent-catalog.js','online/v012-expedition-runtime.js'])
  assert.equal(read(p),read('docs/'+p),'Mirror mismatch: '+p);
 const runtime=read('combat/v012-combat-runtime.js');
 const expedition=read('online/v012-expedition-runtime.js');
 assert(runtime.includes("kind==='Bow')groupSecondaryDamage(r,base,ports.state.automaticTalents?.nodes?.includes('bow_pierce')?[.60,.42,.28]:[.42,.24]"));
 assert(runtime.includes("v013LightningChainFactors(){return ports.state.automaticTalents?.nodes?.includes('storm_mastery')?[.68,.52,.36]:[.60,.43,.28]"));
 assert(runtime.includes("function v013GraveBloomPulse("));
 assert(!runtime.includes("prepared('grave_bloom')&&e.v012Rot?.length"));
 assert(expedition.includes("ports.phase6Metric(r,'plagueSpreadBursts',1)"));
 assert(expedition.includes("r.enemies.includes(target)"),'Reserve must not be killed before spawning');
});
