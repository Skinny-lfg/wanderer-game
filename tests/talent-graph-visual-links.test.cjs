'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
require('../combat/v012-buildcraft.js');
require('../combat/automatic-talents.js');
require('../combat/talent-graph-next.js');

// Geometry is evaluated from the same source that renders the preview.
const source=fs.readFileSync(path.join(__dirname,'../preview/talent-rebuild/prototype.js'),'utf8');
const split=source.indexOf('const el=');
const routing=source.indexOf('function mixedCorridorRoute(');
const render=source.indexOf('\nfor(const n of graph){',routing);
assert(split>0&&routing>split&&render>routing,'Expected preview geometry and link renderer');
const geometry=source.slice(0,split)+'\n'+source.slice(routing,render);
const {graph,positions,mixedCorridorRoute,avoidIcons,clearSegment}=new Function(
 'WandererTalentGraph','WandererV012Buildcraft','WandererAutomaticTalents','document',
 geometry+';return {graph,positions,mixedCorridorRoute,avoidIcons,clearSegment};'
)(WandererTalentGraph,WandererV012Buildcraft,WandererAutomaticTalents,{querySelector:()=>null});
const get=id=>graph.find(n=>n.id===id);
const radius=n=>n.kind==='affinity'?37:n.kind==='mixed'?29:['basic','focused','element'].includes(n.kind)?23:9;
const gap=(p,a,b)=>{const dx=b.x-a.x,dy=b.y-a.y,d=dx*dx+dy*dy,t=d?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/d)):0;return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy)};

test('all 375 nodes retain a position and no talent icons overlap',()=>{
 assert.equal(graph.length,375);
 for(let i=0;i<graph.length;i++){
  const a=graph[i],p=positions[a.id];
  assert(p&&Number.isFinite(p.x)&&Number.isFinite(p.y),a.id);
  for(let j=i+1;j<graph.length;j++){
   const b=graph[j],q=positions[b.id];
   assert(Math.hypot(p.x-q.x,p.y-q.y)>=radius(a)+radius(b)+5,a.id+' intersects '+b.id);
  }
 }
});

test('the 84 intended red links are real diagonal prerequisites, not decorative lines',()=>{
 let red=0;
 for(const family of WandererTalentGraph.FAMILIES)for(const lane of [0,1])for(let tier=1;tier<=3;tier++){
  const basic=WandererTalentGraph.BASICS[family][lane*3+tier-1];
  const branch=get('focus_branch_'+family+'_'+lane+'_'+tier);
  assert.equal(branch.requires,'entry_'+basic+'_0_1');
  assert.equal(avoidIcons(branch,branch.requires).length,2,'Keep entry-to-side diagonal '+branch.id);
  red++;
  if(tier>1){
   const path=get('basic_path_'+family+'_'+lane+'_'+tier);
   assert.equal(path.requires,'focus_branch_'+family+'_'+lane+'_'+(tier-1));
   assert.equal(avoidIcons(path,path.requires).length,2,'Keep side-to-next-tier diagonal '+path.id);
   red++;
  }
 }
 for(const family of WandererTalentGraph.FAMILIES)for(let tier=2;tier<=3;tier++){
  const center=get('focus_path_'+family+'_'+tier);
  for(const lane of [0,1]){
   const side='focus_branch_'+family+'_'+lane+'_'+tier;
   assert(center.anyRequires.includes(side),'Keep same-tier diagonal '+side);
   assert.equal(avoidIcons(center,side).length,2,'Preserve the diagonal from '+side);
   red++;
  }
 }
 assert.equal(red,84);
});

test('all 54 original side/centre entry diagonals into Focused skills are retained',()=>{
 let total=0;
 for(const n of graph.filter(n=>n.kind==='focused')){
  assert.equal(n.anyRequires.length,3,n.id);
  for(const dep of n.anyRequires){
   assert.equal(get(dep).kind,'stat');
   assert.equal(avoidIcons(n,dep).length,2,'Do not erase the diagonal '+dep+' -> '+n.id);
   total++;
  }
 }
 assert.equal(total,54);
});

test('all existing prerequisite links avoid other talent icons without removing diagonals',()=>{
 let checked=0,detours=0,corridors=0;
 for(const n of graph){
  const deps=[...new Set([n.requires,...(n.prerequisites||[]),...(n.anyRequires||[])].filter(Boolean))];
  for(const dep of deps){
   const corridor=mixedCorridorRoute(n,dep),points=corridor||avoidIcons(n,dep);
   if(corridor)corridors++;
   else if(points.length>2)detours++;
   assert(points.length>=2,n.id+' missing rendered path');
   assert.deepEqual(points[0],positions[dep]);
   assert.deepEqual(points[points.length-1],positions[n.id]);
   for(let i=1;i<points.length;i++){
    if(corridor){
     for(const o of graph)if(o.id!==dep&&o.id!==n.id)
      assert(gap(positions[o.id],points[i-1],points[i])>=radius(o)+5,n.id+' corridor crosses '+o.id);
    } else assert(clearSegment(points[i-1],points[i],dep,n.id),dep+' -> '+n.id+' crosses an icon');
   }
   checked++;
  }
 }
 assert.equal(corridors,12);
 assert(checked>480);
 assert(detours>0&&detours<60,'Only necessary icon-crossing links should be detoured');
});
