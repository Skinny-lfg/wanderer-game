'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const N=require('../scripts/v013-natural-progression.cjs');
const B=require('../scripts/v013-stage5-build-audit.cjs');
const T=B.nativeTalentAPI;

test('S1 profiles only target actual v15 talent nodes and valid earned Magic branches',()=>{
 const ids=new Set(T.NODES.map(n=>n.id));
 for(const id of ['strong_heart','deep_cuts','quick_hands','element_choice','kindling','deep_winter','overcharge'])
  assert(ids.has(id),'missing native talent: '+id);
 for(const id of ['passive_strong_heart','passive_deep_cuts','passive_quick_hands','guard','might','haste','vitality'])
  assert(!ids.has(id),'retired alias unexpectedly in native tree: '+id);
 for(const [key,profile] of Object.entries(N.PROFILES)){
  assert(profile.targets.length>0,key+' has no targets');
  for(const id of [...profile.targets,...(profile.preparedTargets||[])])
   assert(ids.has(id),key+' uses a nonexistent talent '+id);
  if(profile.element){
   assert(profile.targets.includes('element_choice'),key+' must unlock elemental mode');
   assert(['fire','frost','lightning'].includes(profile.element));
  }
 }
});
test('v15 reset refunds node investments without a manual primary-attribute mechanic',()=>{
 let p={...T.create(),xp:1000};
 p=T.allocate(p,'root_blood');
 assert(p);
 const q=T.reset(p);
 assert.equal(q.nodes.length,0,'native VM array must be empty after respec');
 assert.equal(q.xp,p.xp);
 assert.equal(T.earned(q),T.earned(p));
 assert.equal(T.valid(q),true);
 assert.equal(Object.hasOwn(q,'attributes'),false);
 assert.equal(typeof T.attributePoints,'undefined');
 assert.equal(typeof T.allocateAttribute,'undefined');
});
test('classify natural physical, caster, agility and multi-affinity loadouts',()=>{
 const item=(slot,subtype,armorType,stats={})=>({slot,subtype,armorType,stats});
 const mage=B.classifyGear({total:2,starter:0,
  items:[item('weapon','Wand',null,{spell:18,int:3}),item('armor','Armor','Cloth',{int:4})]},
 ['affinity_magic','arcane_focus']);
 assert(mage.matchingExamples.includes('cloth_magic'));
 const agile=B.classifyGear({total:2,starter:0,
  items:[item('weapon','Bow',null,{atk:12,agi:3}),item('armor','Armor','Leather',{agi:2})]},
 ['affinity_fury','quick_hands']);
 assert(agile.matchingExamples.includes('leather_agility'));
 const tank=B.classifyGear({total:2,starter:0,
  items:[item('weapon','Sword',null,{atk:11,str:3}),item('armor','Armor','Plate',{end:3})]},
 ['affinity_aegis','affinity_vitality']);
 assert(tank.matchingExamples.includes('plate_strength_endurance'));
 assert(tank.matchingExamples.includes('multi_affinity'));
});
test('deep prerequisites have more route length than core first-level talents',()=>{
 assert(B.talentDepth(['strong_heart']).deepestLegalRoute>=3);
 assert(B.talentDepth(['strong_heart']).deepestLegalRoute>B.talentDepth(['root_vitality']).deepestLegalRoute);
});
test('real native account report captures full gear attributes, talent nodes and respec audit',()=>{
 const opts=N.parseArgs(['--seeds=9304','--profiles=cautious','--max-level=1','--max-attempts=1']);
 const raw=N.run(opts);
 assert.equal(raw.coverage.errors,0);
 const a=raw.accounts[0],attempt=a.attempts[0];
 assert(Array.isArray(attempt.before.talentNodes));
 assert(attempt.before.gear.items.every(item=>item.stats&&Object.hasOwn(item.stats,'atk')));
 assert.deepEqual(attempt.camp.resets,[]);
 const audited=B.summarize(raw);
 assert.equal(audited.cohort.accounts,1);
 assert.equal(audited.resets,0);
 assert.equal(audited.cohort.errors,0);
});
