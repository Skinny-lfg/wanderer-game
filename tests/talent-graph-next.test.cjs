'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');
require('../combat/v012-buildcraft.js');require('../combat/automatic-talents.js');require('../combat/talent-graph-next.js');
const G=WandererTalentGraph, graph=G.createGraph(WandererV012Buildcraft.CATALOG,WandererAutomaticTalents.NODES);
const node=id=>graph.find(n=>n.id===id);
function buy(p,id){const n=node(id);assert(n,id);for(const dep of [n.requires,...(n.prerequisites||[])].filter(Boolean))if(!p.ranks[dep])p=buy(p,dep);if(n.anyRequires&&!n.anyRequires.some(x=>p.ranks[x]))p=buy(p,n.anyRequires[0]);return G.allocate(graph,p,id);}
const empty=()=>({points:1000,ranks:{}});
test('six affinities have two basic axes and one focused axis with three tiers each',()=>{assert.deepEqual(G.FAMILIES,['blood','fury','aegis','vitality','magic','decay']);for(const family of G.FAMILIES){for(const lane of [0,1])assert.deepEqual(graph.filter(n=>n.kind==='basic'&&n.family===family&&n.lane===lane).map(n=>n.tier),[1,2,3]);assert.deepEqual(graph.filter(n=>n.kind==='focused'&&n.family===family).map(n=>n.tier),[1,2,3]);}});
test('each adjacent pair has three mixed tiers requiring both sides',()=>{for(const [a,b,...ids] of G.MIXED)for(const [i,id] of ids.entries()){const n=node(id);assert.equal(n.kind,'mixed');assert.equal(n.tier,i+1);assert.deepEqual(n.pair,[a,b]);const p=buy(empty(),id);assert(p.ranks['affinity_'+a]&&p.ranks['affinity_'+b]);}});
test('mixed abilities branch into both side paths of the next tier',()=>{for(const [a,b,...ids] of G.MIXED)for(let tier=2;tier<=3;tier++){let p=buy(empty(),ids[tier-2]);for(const family of [a,b]){const next=`mixed_path_${a}_${b}_${family}_${tier}`;assert(node(next).anyRequires.includes(ids[tier-2]));p=G.allocate(graph,p,next);assert(p,`${next} via ${ids[tier-2]}`);const gate=node(ids[tier-1]).prerequisites.find(id=>node(id).requires===next);assert(gate,next);p=G.allocate(graph,p,gate);assert(p,gate);}assert(G.allocate(graph,p,ids[tier-1]));}});
test('focused skills can be reached from the centre or either lateral path',()=>{for(const family of G.FAMILIES)for(let tier=1;tier<=3;tier++){const target=node(G.FOCUSED[family][tier-1]),bases=[`focus_path_${family}_${tier}`,`focus_branch_${family}_0_${tier}`,`focus_branch_${family}_1_${tier}`];assert.deepEqual(target.anyRequires.map(id=>node(id).requires),bases);for(const base of bases){let p=buy(empty(),base);const gate=target.anyRequires.find(id=>node(id).requires===base);p=G.allocate(graph,p,gate);assert(p,gate);assert(G.allocate(graph,p,target.id),`${family} tier ${tier} via ${base}`);}}});
test('focused side branches also reach the next central passive',()=>{for(const family of G.FAMILIES)for(const tier of [2,3])for(const side of [0,1]){const p=buy(empty(),`focus_branch_${family}_${side}_${tier-1}`),next=`focus_path_${family}_${tier}`;assert(!p.ranks[G.FOCUSED[family][tier-2]]);assert(G.allocate(graph,p,next),`${family} ${tier} ${side}`);}});
test('each elemental junction accepts either affinity or an adjacent magic path',()=>{for(const element of Object.keys(G.ELEMENTS)){const junction=node(`element_junction_${element}`);assert.equal(junction.anyRequires.length,2);for(const start of junction.anyRequires){const p=buy(empty(),start);assert(G.allocate(graph,p,junction.id),`${element} via ${start}`);}}});
test('every node is reachable, focused paths need no basic skills',()=>{for(const n of graph){const p=buy(empty(),n.id);assert(p,n.id);assert(Object.keys(p.ranks).length<100,n.id);}for(const n of graph.filter(n=>n.kind==='focused')){const p=buy(empty(),n.id);assert(!graph.some(x=>x.kind==='basic'&&p.ranks[x.id]),n.id);}});
test('every basic, focused, mixed and elemental skill has a route without other skills',()=>{for(const n of graph.filter(n=>['basic','focused','mixed','element'].includes(n.kind))){const p=buy(empty(),n.id);const prior=graph.filter(x=>x.id!==n.id&&['basic','focused','mixed','element'].includes(x.kind)&&p.ranks[x.id]);assert.deepEqual(prior.map(x=>x.id),[],n.id);}});
test('ranks consume points on the same node and cap correctly',()=>{let p=buy(empty(),'deep_cuts');for(let i=1;i<node('deep_cuts').maxRank;i++)p=G.allocate(graph,p,'deep_cuts');assert.equal(p.ranks.deep_cuts,node('deep_cuts').maxRank);assert.equal(G.allocate(graph,p,'deep_cuts'),null);});
test('mixed prerequisites require both affinities and accept alternative basic approaches',()=>{const [a,b,id]=G.MIXED[0];let p=buy(empty(),'mixed_path_'+a+'_'+b+'_'+a+'_1');assert.equal(G.allocate(graph,p,id),null);p=buy(p,'mixed_path_'+a+'_'+b+'_'+b+'_1');for(const gate of node(id).prerequisites)p=buy(p,gate);assert(G.allocate(graph,p,id));let q=buy(empty(),G.BASICS[a][4]);assert(!q.ranks['mixed_path_'+a+'_'+b+'_'+a+'_1']);q=G.allocate(graph,q,'mixed_path_'+a+'_'+b+'_'+a+'_2');assert(q);});
test('three elemental branches have independently reachable entries',()=>{for(const [element,ids] of Object.entries(G.ELEMENTS)){assert(node(ids[0]),element);assert(buy(empty(),ids[0]).ranks['affinity_magic']);}});
test('skill definitions have player-facing descriptions and magic focus is elemental-neutral',()=>{for(const n of graph.filter(n=>['basic','focused','mixed','element'].includes(n.kind)))assert(n.description,n.id);for(const n of graph.filter(n=>n.kind==='focused'&&n.family==='magic'))assert(n.spell>0&&!n.element,n.id);for(const ids of Object.values(G.ELEMENTS))for(const id of ids)assert.equal(node(id).kind,'element',id);});
test('invalid progress cannot be allocated or loaded as valid',()=>{for(const p of [{points:2,ranks:{deep_cuts:1}},{points:1,ranks:{root_blood:2}},{points:0,ranks:{root_blood:1}},{points:2,ranks:{unknown:1}},{points:2,ranks:{root_blood:-1}}]){assert.equal(G.valid(graph,p),false);assert.equal(G.allocate(graph,p,'root_blood'),null);}});

test('every ability route contains two consecutive minor-stat nodes before its icon',()=>{
 const abilities=graph.filter(n=>['basic','focused','mixed','element'].includes(n.kind));
 assert.equal(abilities.length,84);
 let paths=0;
 for(const ability of abilities){
  const entries=[ability.requires,...(ability.prerequisites||[]),...(ability.anyRequires||[])].filter(Boolean);
  assert(entries.length,ability.id);
  for(const entry of entries){
   const second=node(entry),first=node(second?.requires);
   assert.equal(second?.kind,'stat',ability.id+' must have a final stat gate');
   assert.equal(first?.kind,'stat',ability.id+' requires two consecutive stat nodes');
   assert(first.family===second.family,ability.id+' crosses a wrong-family gate');
   paths++;
  }
 }
 assert.equal(paths,138);
});
test('affinity entry still costs two points and later abilities remain independently attainable',()=>{
 for(const family of G.FAMILIES){
  const root=node('root_'+family),affinity=node('affinity_'+family);
  assert.equal(affinity.requires,root.id);
  let p={points:2,ranks:{}};
  p=G.allocate(graph,p,root.id);
  p=G.allocate(graph,p,affinity.id);
  assert(p&&p.ranks[affinity.id],family);
 }
 for(const ability of graph.filter(n=>['basic','focused','mixed','element'].includes(n.kind))){
  const p=buy({points:100,ranks:{}},ability.id);
  assert(p&&G.valid(graph,p),ability.id);
  const others=graph.filter(n=>['basic','focused','mixed','element'].includes(n.kind)&&n.id!==ability.id&&p.ranks[n.id]);
  assert.equal(others.length,0,ability.id+' should not force unrelated abilities');
 }
});
