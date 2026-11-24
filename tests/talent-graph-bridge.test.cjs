'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');require('../combat/v012-buildcraft.js');require('../combat/talent-catalog.js');require('../combat/talent-graph-next.js');require('../combat/talent-graph-bridge.js');
const G=WandererTalentGraph,B=WandererTalentGraphBridge,C=WandererV012Buildcraft,graph=G.createGraph(C.CATALOG,WandererTalentCatalog.NODES),node=id=>graph.find(n=>n.id===id);
function buy(p,id){const n=node(id);for(const dep of [n.requires,...(n.prerequisites||[])].filter(Boolean))if(!p.ranks[dep])p=buy(p,dep);if(n.anyRequires&&!n.anyRequires.some(x=>p.ranks[x]))p=buy(p,n.anyRequires[0]);return G.allocate(graph,p,id);}
test('basic ranks project into the real buildcraft rank calculation',()=>{let p=buy({points:100,ranks:{}},'deep_cuts');p=G.allocate(graph,p,'deep_cuts');const projection=B.project(graph,p),build=C.create();build.runtime.permanentTalents=projection.permanentTalents;assert.equal(C.rank(build,'deep_cuts'),2);assert.equal(C.rank(build,'bleeding_edge'),2);});
test('innate rank plus invested ranks stays within engine maximum',()=>{let p=buy({points:100,ranks:{}},'bleeding_edge');for(let i=1;i<node('bleeding_edge').maxRank;i++)p=G.allocate(graph,p,'bleeding_edge');const build=C.create();build.runtime.permanentTalents=B.project(graph,p).permanentTalents;assert.equal(C.rank(build,'bleeding_edge'),5);});
test('minor stat and magic focused bonuses alter derived values',()=>{let p=buy({points:100,ranks:{}},'arcane_mastery');const stats={attack:10,defense:10,maxhp:100,evasionRating:0,spellPower:100,manaRegen:2};const out=B.apply(stats,graph,p);assert(out.spellPower>125);assert.equal(stats.spellPower,100);});
test('specializations and prepared mixed skills project to existing runtime identifiers',()=>{let p=buy({points:100,ranks:{}},'blood_harvest');p=buy(p,'red_guillotine');const x=B.project(graph,p,'fire','red_guillotine');assert(x.nodes.includes('blood_harvest'));assert.equal(x.prepared,'red_guillotine');assert.throws(()=>B.project(graph,p,'fire','blood_harvest'));});



test('percentage stat nodes preserve IDs, tiers, census and truthful tooltips',()=>{
 const counts={pctAttack:32,pctArmor:18,pctLife:36,pctSpell:15};
 for(const [key,count] of Object.entries(counts)){
  const nodes=graph.filter(n=>n.kind==='stat'&&n[key]!==undefined);
  assert.equal(nodes.length,count,key);
  for(const n of nodes){const expected=[.02,.03,.04][(n.tier||1)-1];assert.equal(n[key],expected,n.id);assert(n.description.startsWith('+'+expected*100+'% '),n.id);}
 }
 for(const n of graph)for(const key of ['flatAttack','flatArmor','flatLife','flatSpell'])assert.equal(n[key],undefined,n.id);
});
test('percentage stat nodes are additive on the pre-graph stat; other spell modifiers remain separate',()=>{
 const fields={pctAttack:'attack',pctArmor:'defense',pctLife:'maxhp',pctSpell:'spellPower'};
 for(const [key,stat] of Object.entries(fields)){
  const nodes=graph.filter(n=>n.kind==='stat'&&n[key]&&(!n.element||n.element==='fire'));
  let p={points:100,ranks:{}};for(const n of nodes.slice(0,3))if(!p.ranks[n.id])p=buy(p,n.id);
  const selected=graph.filter(n=>p.ranks[n.id]),pct=selected.reduce((a,n)=>a+(n[key]||0)*p.ranks[n.id],0);
  const base={attack:20,defense:40,maxhp:120,spellPower:100,mana:100,manaRegen:10,attacksPerSec:1,evasionRating:10};
  for(const scale of [1,10]){
   const input={...base,[stat]:base[stat]*scale},out=B.apply(input,graph,p);
   let expected=input[stat]*(1+pct);
   if(stat==='spellPower')expected=Math.round(expected*(1+selected.reduce((a,n)=>a+(n.spell||0)*p.ranks[n.id],0)));
   if(stat==='maxhp'){const h=selected.reduce((a,n)=>a+(n.health||0)*p.ranks[n.id],0);if(h)expected=Math.round(expected*(1+h));}
   assert(Math.abs(out[stat]-expected)<1e-8,key);assert.equal(input[stat],base[stat]*scale);
  }
 }
});
