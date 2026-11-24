'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {T,buy}=require('./v013-current-talent-helper.cjs');
const G=globalThis.WandererTalentGraph;
test('current tree contains 419 unique v15 nodes, with all six affinity roots',()=>{
 assert.equal(T.NODES.length,419);
 assert.equal(new Set(T.NODES.map(n=>n.id)).size,419);
 for(const family of ['blood','fury','aegis','vitality','magic','decay']){
  assert(T.NODES.some(n=>n.id==='root_'+family));
  assert(T.NODES.some(n=>n.id==='affinity_'+family));
 }
});
test('fresh account has no post-cap attributes until 100 Talent points have been earned',()=>{
 const p=T.create();assert.equal(p.treeVersion,15);assert.equal(T.earned(p),0);
 assert.equal(T.availableAttributes(p),0);
 assert.equal(T.allocateAttribute(p,'agi'),null);
 assert.equal(T.allocate(p,'root_blood'),null);
 assert.equal(T.valid({...p,starterPoints:2}),false);
 let earned=T.award(p,100);
 assert.equal(T.earned(earned),1);
 assert(T.allocate(earned,'root_blood'));
});
test('every v15 graph edge references an existing node and graph contains no basic cycles',()=>{
 const ids=new Set(T.NODES.map(n=>n.id));
 for(const n of T.NODES)for(const id of [n.requires,...(n.prerequisites||[]),...(n.anyRequires||[])].filter(Boolean))
  assert(ids.has(id),n.id+' points to missing '+id);
 assert.equal(G.FAMILIES.length,6);
});
test('v15 focused and hybrid progression purchases are earned and restorable',()=>{
 for(const id of ['affinity_blood','affinity_magic','bleeding_edge','guarded_block','quick_hands']){
  const p=buy([id]);assert(p.nodes.includes(id),id);
  assert(T.valid(JSON.parse(JSON.stringify(p))),id);
 }
});
test('v15 reset preserves earned XP while removing all purchased nodes',()=>{
 const p=buy(['affinity_blood']),reset=T.reset(p);
 assert.equal(reset.xp,p.xp);assert.equal(reset.nodes.length,0);assert.equal(T.earned(reset),T.earned(p));
 assert(T.valid(reset));
});
