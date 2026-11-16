'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');require('../combat/v012-buildcraft.js');require('../combat/automatic-talents.js');require('../combat/automatic-talent-layout.js');const T=WandererAutomaticTalents,L=WandererTalentLayout.create(T.NODES),list=T.NODES;
const pairs=[['blood_focus','blood_transfer'],['rot_focus','plague_spread'],['vitality_recovery','vitality_reserve'],['aegis_bulwark','aegis_reprisal'],['single_target_mastery','fury_momentum'],['fire_focus','fire_spread'],['frost_focus','frost_spread'],['lightning_focus','storm_mastery']];
function buy(progress,id){for(const step of T.path(progress,id)||[]) {progress=T.allocate(progress,step);assert(progress,step);}return progress;}
test('starter points buy a foundation and family, never attribute points',()=>{let p={...T.create(),starterPoints:2};assert.equal(T.earned(p),2);assert.equal(T.attributePoints(p),0);p=T.allocate(p,'might');p=T.allocate(p,'affinity_blood');assert(p);assert.equal(T.allocate(p,'path_bleeding_edge_1'),null);assert.equal(T.earned(p)-p.nodes.length,0);});
test('every talent is reachable within the permanent point budget with no cyclic requirements',()=>{for(const node of list){const route=T.path(T.create(),node.id);assert(route,node.id);assert(route.length<=T.MAX_POINTS,node.id);assert(T.valid(buy({...T.create(),xp:10000},node.id)),node.id);}});
test('all competing specializations have equal access cost and a shared stat approach',()=>{for(const [a,b]of pairs){const pa=T.path(T.create(),a),pb=T.path(T.create(),b);assert.equal(pa.length,pb.length,a);assert.deepEqual(pa.slice(0,-1),pb.slice(0,-1),a);assert.equal(list.find(n=>n.id===pa.at(-2)).attribute,list.find(n=>n.id===pa.at(-3)).attribute);const p=buy({...T.create(),xp:10000},a);assert.equal(T.path(p,b),null);assert.equal(T.allocate(p,b),null);}});
test('an optional ability rank does not gate the next ability; elemental and mixed abilities retain their gates',()=>{let p=buy({...T.create(),xp:10000},'passive_deep_cuts');assert(!p.nodes.includes('passive_bleeding_edge_rank2'));assert(p.nodes.includes('passive_bleeding_edge'));assert.equal(T.allocate({...T.create(),xp:10000},'passive_kindling'),null);const mixed=T.path(T.create(),'passive_hemovore');assert(mixed.includes('affinity_blood'));assert(mixed.includes('affinity_vitality'));assert(!mixed.includes('path_hemovore_2'));assert(!mixed.includes('bridge_hemovore_2'));});
const circles=[...list.map(n=>({id:n.id,...L.positions[n.id],r:n.affinity?75:28})),...Object.entries(L.proxies).flatMap(([id,p])=>Object.entries(p).map(([family,pos])=>({id:'copy_'+id+'_'+family,...pos,r:38})))];
test('all nodes and repeated mixed-family circles have distinct readable positions',()=>{for(const c of circles){assert(Number.isFinite(c.x)&&Number.isFinite(c.y),c.id);assert(c.x>0&&c.x<L.width&&c.y>0&&c.y<L.height,c.id);}for(let i=0;i<circles.length;i++)for(let j=i+1;j<circles.length;j++){const a=circles[i],b=circles[j];assert(Math.hypot(a.x-b.x,a.y-b.y)>=a.r+b.r+12,a.id+' overlaps '+b.id);}});
function distance(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy)));return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);}
test('the visible talent atlas routes prerequisites without passing through unrelated talent circles',()=>{
 const adjacent=['blood:fury','aegis:fury','aegis:vitality','magic:vitality','decay:magic','blood:decay'];
 const visible=list.filter(n=>{
  if(n.rank>1)return false;
  if(!n.hybridFor)return true;
  const catalog=WandererV012Buildcraft.CATALOG.find(p=>p.id===n.hybridFor);
  return catalog&&adjacent.includes([...catalog.requires].sort().join(':'));
 });
 const tree=WandererTalentLayout.create(visible);
 const markers=visible.map(n=>({id:n.id,...tree.positions[n.id],r:n.affinity?88:n.advanced||n.hybridFor&&n.passiveId?63:n.passiveId||n.skillKey||n.specialisationTier?50:39}));
 let edges=0;
 for(const node of visible)for(const required of node.prerequisites||node.anyRequires||[node.requires].filter(Boolean)){
  const route=tree.waypoints(node,required);
  if(route.length<2)continue;
  edges++;
  assert.equal(route[0],tree.positions[required]);
  assert.equal(route[route.length-1],tree.positions[node.id]);
  for(let i=1;i<route.length;i++)for(const other of markers){
   if(other.id===node.id||other.id===required)continue;
   assert(distance(other,route[i-1],route[i])>=other.r+8,required+' → '+node.id+' crosses '+other.id);
  }
 }
 assert(edges>350,'A representative set of visible talent links must be checked');
});
