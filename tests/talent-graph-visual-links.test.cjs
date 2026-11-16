'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
require('../combat/v012-buildcraft.js');
require('../combat/automatic-talents.js');
require('../combat/talent-graph-next.js');

// Evaluate only the geometry portion of the actual prototype; no browser DOM required.
const source=fs.readFileSync(path.join(__dirname,'../preview/talent-rebuild/prototype.js'),'utf8');
const split=source.indexOf('const el='),routeStart=source.indexOf('function mixedCorridorRoute('),routeEnd=source.indexOf('\nfor(const n of graph){',routeStart);
assert(split>0&&routeStart>split&&routeEnd>routeStart,'Expected prototype geometry');
const geometry=source.slice(0,split)+'\n'+source.slice(routeStart,routeEnd);
const {graph,positions,mixedCorridorRoute,focusedJunction,focusedMergeRoute}=new Function('WandererTalentGraph','WandererV012Buildcraft','WandererAutomaticTalents','document',geometry+';return {graph,positions,mixedCorridorRoute};')(WandererTalentGraph,WandererV012Buildcraft,WandererAutomaticTalents,{querySelector:()=>null});
const get=id=>graph.find(n=>n.id===id);
const radius=n=>n.kind==='affinity'?37:n.kind==='mixed'?29:['basic','focused','element'].includes(n.kind)?23:9;
const distance=(p,a,b)=>{const dx=b.x-a.x,dy=b.y-a.y,d=dx*dx+dy*dy,t=d?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/d)):0;return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy)};
const intersects=(a,b,c,d)=>{const o=(p,q,r)=>(q.x-p.x)*(r.y-p.y)-(q.y-p.y)*(r.x-p.x);return o(a,b,c)*o(a,b,d)<0&&o(c,d,a)*o(c,d,b)<0};

test('all 18 Focused talents retain their three original paid stat paths',()=>{
 assert.equal(graph.length,375);
 assert.equal(graph.filter(n=>n.approachOf).length,138);
 for(const family of WandererTalentGraph.FAMILIES)for(let tier=1;tier<=3;tier++){
  const ability=get(WandererTalentGraph.FOCUSED[family][tier-1]);
  const middle=get('focus_path_'+family+'_'+tier);
  const prev=tier===1?'affinity_'+family:'focus_path_'+family+'_'+(tier-1);
  assert.equal(middle.requires,prev);
  const original=[middle.id,'focus_branch_'+family+'_0_'+tier,'focus_branch_'+family+'_1_'+tier];
  assert.deepEqual(ability.anyRequires,original.map((_,i)=>'entry_'+ability.id+'_'+i+'_1'));
  for(const [i,source] of original.entries()){
   const entry=get('entry_'+ability.id+'_'+i+'_1');
   assert.equal(entry.requires,source);
   if(i>0){
    const side=get(source),first=positions[side.id],centre=positions[middle.id],actual=positions[entry.id];
    assert.equal(side.tier,tier);
    assert(distance(actual,first,centre)<1e-6,entry.id+' must lie on its own-tier branch');
   }
  }
 }
});

test('54 Focused prerequisite routes converge after the paid stat entries without hitting nodes',()=>{
 let count=0;
 for(const ability of graph.filter(n=>n.kind==='focused')){
  const merge=focusedJunction(ability);
  for(const [i,id] of ability.anyRequires.entries()){
   const points=focusedMergeRoute(ability,id);
   assert.equal(points.length,i===0?2:3,id);
   assert.deepEqual(points[0],positions[id]);
   assert.deepEqual(points[points.length-1],merge);
   for(let k=1;k<points.length;k++)for(const other of graph){
    if(other.id===id||other.id===ability.id)continue;
    assert(distance(positions[other.id],points[k-1],points[k])>=radius(other)+5,
     id+' route crosses '+other.id);
   }
   count++;
  }
 }
 assert.equal(count,54);
});
test('talent circles remain separate after rerouting the links',()=>{
 for(let i=0;i<graph.length;i++)for(let j=i+1;j<graph.length;j++){
  const a=graph[i],b=graph[j],p=positions[a.id],q=positions[b.id];
  assert(p&&q,a.id+' / '+b.id+' need coordinates');
  assert(Math.hypot(p.x-q.x,p.y-q.y)>=radius(a)+radius(b)+5,a.id+' overlaps '+b.id);
 }
});

test('12 routed mixed-family entry connectors avoid talents and each other',()=>{
 const routes=[];
 for(const node of graph.filter(n=>n.id.startsWith('mixed_path_')&&n.tier===1)){
  const dependency='affinity_'+node.family;
  if(!node.anyRequires?.includes(dependency))continue;
  const route=mixedCorridorRoute(node,dependency);assert.equal(route.length,4,node.id);
  assert.deepEqual(route[0],positions[dependency]);assert.deepEqual(route[3],positions[node.id]);
  for(let i=1;i<route.length;i++)for(const other of graph){
   if(other.id===node.id||other.id===dependency)continue;
   assert(distance(positions[other.id],route[i-1],route[i])>=radius(other)+5,node.id+' crosses '+other.id);
  }
  routes.push({id:node.id,points:route});
 }
 assert.equal(routes.length,12);
 for(let i=0;i<routes.length;i++)for(let j=i+1;j<routes.length;j++){
  const a=routes[i],b=routes[j];
  for(let k=1;k<a.points.length;k++)for(let m=1;m<b.points.length;m++)
   assert(!intersects(a.points[k-1],a.points[k],b.points[m-1],b.points[m]),a.id+' crosses '+b.id);
 }
});
