'use strict';
// Current-only v15 catalog contract; no historical golden-master dependency.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {T,buy}=require('./v013-current-talent-helper.cjs');
const C=globalThis.WandererTalentCatalog,G=globalThis.WandererTalentGraph,B=globalThis.WandererTalentGraphBridge;
const graph=G.createGraph(globalThis.WandererV012Buildcraft.CATALOG,C.NODES);
test('C1 clean sheet: source catalog uniquely generates the current 343-node v15 graph',()=>{
 assert.equal(graph.length,343);assert.equal(T.NODES.length,343);
 assert.deepEqual(JSON.parse(JSON.stringify(graph)),JSON.parse(JSON.stringify(T.NODES)));
 assert.equal(new Set(graph.map(n=>n.id)).size,graph.length);
 assert(C.ATTRIBUTES&&typeof C.ATTRIBUTES==='object');
});
test('C1 clean sheet: representative physical, spell and mixed paths use the native runtime',()=>{
 const baseline={attack:35,defense:22,maxhp:220,spellPower:36,manaRegen:2,mana:70,attacksPerSec:1.1};
 for(const id of ['affinity_blood','affinity_decay','affinity_vitality','affinity_aegis','affinity_fury','affinity_magic','bleeding_edge','arcane_resonance']){
  const p=buy([id]);
  assert(T.valid(p));
  const next=T.apply({...baseline},p);
  assert(Number.isFinite(next.attack)&&Number.isFinite(next.spellPower)&&Number.isFinite(next.maxhp),id);
  assert(B.bonuses(graph,{points:T.earned(p),ranks:T.graphProgress(p).ranks}),id);
 }
});
test('C1 clean sheet: only current catalog/runtime are loaded into root and Talent iframe',()=>{
 const page=fs.readFileSync('index.html','utf8'),iframe=fs.readFileSync('preview/talent-rebuild/index.html','utf8');
 assert.match(page,/src="combat\/talent-catalog\.js"/);
 assert.match(iframe,/src="\.\.\/\.\.\/combat\/talent-catalog\.js"/);
 assert(!page.includes('src="combat/automatic-talents.js"'));
 assert(!iframe.includes('src="../../combat/automatic-talents.js"'));
 assert.equal(T.create().treeVersion,15);
 for(const old of [8,9,10,11,12,13,14])assert.equal(T.valid({...T.create(),treeVersion:old}),false);
});
