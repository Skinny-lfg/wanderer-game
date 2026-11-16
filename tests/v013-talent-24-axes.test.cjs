'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
require('../combat/v012-buildcraft.js');
require('../combat/automatic-talents.js');
require('../combat/automatic-talent-layout.js');

const nodes=WandererAutomaticTalents.NODES;
const layout=WandererTalentLayout.create(nodes);

test('six affinity sectors contain four unique axes each, spaced 15 degrees apart',()=>{
 assert.equal(layout.axes.length,24);
 const families=['blood','fury','aegis','vitality','magic','decay'];
 for(const family of families)assert.deepEqual(layout.axes.filter(a=>a.family===family).map(a=>a.lane),[0,1,2,3]);
 const sorted=layout.axes.map(a=>(a.angle%(Math.PI*2)+Math.PI*2)%(Math.PI*2)).sort((a,b)=>a-b);
 for(let i=0;i<24;i++){
  const next=sorted[(i+1)%24]+(i===23?Math.PI*2:0);
  assert(Math.abs(next-sorted[i]-Math.PI/12)<1e-9,'axis spacing at '+i);
 }
});

test('every catalog node has a finite position and primary lanes stay inside their sector',()=>{
 const catalog=new Map(nodes.map(n=>[n.id,n]));
 for(const node of nodes){
  const position=layout.positions[node.id];
  assert(position&&Number.isFinite(position.x)&&Number.isFinite(position.y),node.id);
  assert(position.x>0&&position.x<layout.width&&position.y>0&&position.y<layout.height,node.id);
 }
 for(const [id,axis] of Object.entries(layout.axisByNode)){
  assert.equal(catalog.get(id)?.family,axis.family,id);
  assert(axis.lane>=0&&axis.lane<4,id);
  const p=layout.positions[id],angle=Math.atan2(p.y-layout.center.y,p.x-layout.center.x);
  const intended=layout.axes.find(a=>a.family===axis.family&&a.lane===axis.lane).angle;
  assert(Math.abs(Math.atan2(Math.sin(angle-intended),Math.cos(angle-intended)))<.07,id);
 }
});

test('node circles do not intersect in the complete talent catalog',()=>{
 const circles=nodes.map(n=>({id:n.id,...layout.positions[n.id],r:n.affinity?75:28}));
 for(let i=0;i<circles.length;i++)for(let j=i+1;j<circles.length;j++){
  const a=circles[i],b=circles[j];
  assert(Math.hypot(a.x-b.x,a.y-b.y)>=a.r+b.r+12,a.id+' overlaps '+b.id);
 }
});
