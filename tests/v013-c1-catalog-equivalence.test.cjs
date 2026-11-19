'use strict';
// Stage C1 parity gate against the historical catalogue. No old save rules are used.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
require('../combat/v012-buildcraft.js');
require('../combat/automatic-talents.js');
const historical=WandererAutomaticTalents;
require('../combat/talent-catalog.js');
require('../combat/talent-graph-next.js');
require('../combat/talent-graph-bridge.js');
const C=WandererTalentCatalog,G=WandererTalentGraph,B=WandererTalentGraphBridge;
const original=G.createGraph(WandererV012Buildcraft.CATALOG,historical.NODES);
const extracted=G.createGraph(WandererV012Buildcraft.CATALOG,C.NODES);
const plain=obj=>JSON.parse(JSON.stringify(obj));

test('C1: extracted source catalogue is equivalent to its historical baseline',()=>{
 assert.deepEqual(plain(C.ATTRIBUTES),plain(historical.ATTRIBUTES));
 assert.deepEqual(plain(C.NODES),plain(historical.NODES));
 assert.equal(new Set(C.NODES.map(n=>n.id)).size,C.NODES.length);
});
test('C1: all 343 v15 nodes preserve ordered IDs, prerequisites and gameplay effects',()=>{
 assert.equal(original.length,343);
 assert.equal(extracted.length,343);
 assert.deepEqual(plain(extracted),plain(original));
 assert.equal(new Set(extracted.map(n=>n.id)).size,343);
 const ids=new Set(extracted.map(n=>n.id));
 for(const n of extracted)for(const dep of [n.requires,...(n.prerequisites||[]),...(n.anyRequires||[])].filter(Boolean))
   assert(ids.has(dep),n.id+' references '+dep);
});
test('C1: native stats, bonuses and projections are equal for representative builds',()=>{
 const byId=new Map(extracted.map(n=>[n.id,n]));
 const buy=(graph,id,p={points:1000,ranks:{}})=>{
  const n=byId.get(id);assert(n,id);
  for(const dep of [n.requires,...(n.prerequisites||[])].filter(Boolean))if(!p.ranks[dep])p=buy(graph,dep,p);
  if(n.anyRequires&&!n.anyRequires.some(dep=>p.ranks[dep]))p=buy(graph,n.anyRequires[0],p);
  const next=G.allocate(graph,p,id);assert(next,id);return next;
 };
 const stats={attack:35,defense:22,maxhp:220,evasionRating:4,spellPower:36,manaRegen:2,mana:70,attacksPerSec:1.1};
 for(const id of ['affinity_blood','bleeding_edge','affinity_decay','toxic_touch','affinity_vitality','affinity_aegis','affinity_fury','affinity_magic','arcane_resonance','crimson_rush','kindling']){
  const a=buy(original,id),b=buy(extracted,id);
  assert.deepEqual(plain(a),plain(b),id);
  assert.deepEqual(plain(B.bonuses(extracted,b)),plain(B.bonuses(original,a)),id);
  assert.deepEqual(plain(B.apply(stats,extracted,b)),plain(B.apply(stats,original,a)),id);
  const element=id==='kindling'?'fire':'arcane';
  assert.deepEqual(plain(B.project(extracted,b,element)),plain(B.project(original,a,element)),id);
 }
});
test('C1: active runtime and UI entrypoints depend only on the extracted catalogue',()=>{
 const page=fs.readFileSync('index.html','utf8'),iframe=fs.readFileSync('preview/talent-rebuild/index.html','utf8');
 const script=fs.readFileSync('preview/talent-rebuild/prototype.js','utf8'),runtime=fs.readFileSync('combat/talent-graph-runtime.js','utf8');
 assert.match(page,/src="combat\/talent-catalog\.js"/);
 assert.doesNotMatch(page,/src="combat\/automatic-talents\.js"/);
 assert.match(iframe,/src="\.\.\/\.\.\/combat\/talent-catalog\.js"/);
 assert.doesNotMatch(iframe,/src="\.\.\/\.\.\/combat\/automatic-talents\.js"/);
 assert.match(script,/WandererTalentCatalog\.NODES/);
 assert.doesNotMatch(runtime,/WandererAutomaticTalents\.NODES|old\.NODES/);
 require('../combat/talent-graph-runtime.js');
 assert.deepEqual(plain(WandererAutomaticTalents.NODES),plain(extracted));
 assert.deepEqual(plain(WandererAutomaticTalents.ATTRIBUTES),plain(C.ATTRIBUTES));
 assert.equal(WandererAutomaticTalents.create().treeVersion,15);
 assert(WandererAutomaticTalents.valid(WandererAutomaticTalents.create()));
});
