'use strict';
// Current-only v15 catalog contract; no historical golden-master dependency.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {T,buy}=require('./v013-current-talent-helper.cjs');
const C=globalThis.WandererTalentCatalog,G=globalThis.WandererTalentGraph,B=globalThis.WandererTalentGraphBridge;
const graph=G.createGraph(globalThis.WandererV012Buildcraft.CATALOG,C.NODES);
test('C1 clean sheet: source catalog uniquely generates the current 420-node v15 graph',()=>{
 assert.equal(graph.length,420);assert.equal(T.NODES.length,420);
 assert.deepEqual(JSON.parse(JSON.stringify(graph)),JSON.parse(JSON.stringify(T.NODES)));
 assert.equal(new Set(graph.map(n=>n.id)).size,graph.length);
 assert(C.ATTRIBUTES&&typeof C.ATTRIBUTES==='object');
});
test('C1 clean sheet: representative physical, spell and mixed paths use the native runtime',()=>{
 const baseline={attack:35,defense:22,maxhp:220,spellPower:36,manaRegen:2,mana:70,attacksPerSec:1.1};
 for(const id of ['affinity_blood','affinity_decay','affinity_radiance','affinity_aegis','affinity_fury','affinity_arcane','bleeding_edge','arcane_resonance']){
  const p=buy([id]);
  assert(T.valid(p));
  const next=T.apply({...baseline},p);
  assert(Number.isFinite(next.attack)&&Number.isFinite(next.spellPower)&&Number.isFinite(next.maxhp),id);
  assert(B.bonuses(graph,{points:T.earned(p),ranks:T.graphProgress(p).ranks}),id);
 }
});
test('C1 clean sheet: only current catalog/runtime are loaded into root and Talent iframe',()=>{
 const page=fs.readFileSync('index.html','utf8'),iframe=fs.readFileSync('preview/talent-rebuild/index.html','utf8');
 // Compare script paths rather than cache-busting query strings. Require
 // exactly one current catalog in each page and no retired runtime.
 const scripts=html=>[...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)].map(m=>m[1].split(/[?#]/,1)[0]);
 for(const [html,prefix] of [[page,''],[iframe,'../../']]){
  const loaded=scripts(html);
  assert.equal(loaded.filter(src=>src===prefix+'combat/talent-catalog.js').length,1);
  assert(!loaded.includes(prefix+'combat/automatic-talents.js'));
 }
 assert.equal(T.create().treeVersion,15);
 for(const old of [8,9,10,11,12,13,14])assert.equal(T.valid({...T.create(),treeVersion:old}),false);
});
