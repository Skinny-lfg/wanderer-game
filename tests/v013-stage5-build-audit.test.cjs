'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const N=require('../scripts/v013-natural-progression.cjs');
const B=require('../scripts/v013-stage5-build-audit.cjs');
const T=B.nativeTalentAPI;

test('current target priorities omit real IDs for several deep skills',()=>{
 const ids=new Set(T.NODES.map(n=>n.id));
 assert(ids.has('strong_heart'));
 assert(!ids.has('passive_strong_heart'));
 assert(ids.has('deep_cuts'));
 assert(!ids.has('passive_deep_cuts'));
 assert(ids.has('quick_hands'));
 assert(!ids.has('passive_quick_hands'));
 for(const profile of Object.values(N.PROFILES)){
  assert(profile.targets.some(id=>!ids.has(id)),'at least one invalid depth target');
 }
});
test('real reset removes nodes while retaining earned XP and primary attribute assignments',()=>{
 let p={...T.create(),xp:1000};
 p=T.allocate(p,'root_blood');
 p=T.allocateAttribute(p,'str');
 assert(p);
 const q=T.reset(p);
 assert.equal(q.nodes.length,0,'native VM array must be empty after respec');
 assert.equal(q.xp,p.xp);
 assert.equal(q.attributes.str,1);
 assert.equal(T.earned(q),T.earned(p));
 assert.equal(T.valid(q),true);
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
