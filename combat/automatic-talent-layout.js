// Shared layout data for rendering and geometric checks. No character state is changed.
(function(root){'use strict';
const CENTER={x:4300,y:4300},ANGLES={blood:-Math.PI/2,decay:-Math.PI/6,vitality:Math.PI/6,aegis:Math.PI/2,fury:Math.PI*5/6,magic:Math.PI*7/6},ROOT_ANGLES={might:-Math.PI/2,vitality:Math.PI/3,haste:Math.PI};
function create(list){
 const positions={},proxies={},center={...CENTER},point=(angle,r)=>({x:center.x+Math.cos(angle)*r,y:center.y+Math.sin(angle)*r}),local=(family,t,r)=>{const angle=ANGLES[family];return{x:center.x+Math.cos(angle)*r-Math.sin(angle)*t,y:center.y+Math.sin(angle)*r+Math.cos(angle)*t};};
 for(const id of ['might','vitality','haste'])positions[id]=point(ROOT_ANGLES[id],210);
 for(const [id,second,third,type]of [['might','precision','execution','attack'],['vitality','guard','fortitude','health'],['haste','flow','mastery','speed']]){
  const angle=ROOT_ANGLES[id],at=(t,r)=>({x:center.x+Math.cos(angle)*r-Math.sin(angle)*t,y:center.y+Math.sin(angle)*r+Math.cos(angle)*t});positions[second]=at(85,210);positions[third]=at(170,210);
  [[-80,210],[-80,290],[-160,290],[-160,370],[-80,370]].forEach(([t,r],i)=>positions['minor_'+type+'_'+(i+1)]=at(t,r));
 }
 for(const family of Object.keys(ANGLES))positions['affinity_'+family]=point(ANGLES[family],650);
 for(const node of list){if(node.hybridFor)continue;const t=((node.branchLane??1)-1)*450,r=1150+(node.branchDepth||0)*600;
  if(node.pathFor)positions[node.id]=local(node.family,t+(node.pathStep===1?-85:85),r-150);
  if(node.passiveId){const offsets=[[0,0],[90,0],[180,0],[180,90],[90,90]],o=offsets[node.rank-1];positions[node.id]=local(node.family,t+o[0],r+o[1]);}
  if(node.elementBranch){const lane=['fire','frost','lightning'].indexOf(node.elementBranch);positions[node.id]=local('magic',(lane-1)*450,1990);}
 }
 for(const node of list.filter(n=>n.forkAnchor)){const anchor=list.find(n=>n.id===node.forkAnchor);if(!anchor)continue;const t=((anchor.branchLane??1)-1)*450,r=1150+(anchor.branchDepth||0)*600;positions[node.id]=local(node.family,t+(node.forkStep<3?(node.forkStep===1?-105:105):(node.forkSide||0)*190),r+(node.forkStep<3?170:320));}
 const hybrids=list.filter(n=>n.hybridFor&&n.passiveId&&n.rank===1).sort((a,b)=>[a.family,a.hybridOther].sort().join(':').localeCompare([b.family,b.hybridOther].sort().join(':')));
 hybrids.forEach((node,i)=>{const pair=Math.floor(i/2),x=9400+(pair%3)*950,y=1000+Math.floor(pair/3)*1200+(i%2)*500,id=node.passiveId;proxies[id]={[node.family]:{x:x-270,y:y-270},[node.hybridOther]:{x:x+270,y:y-270}};positions['path_'+id+'_1']={x:x-275,y:y-140};positions['path_'+id+'_2']={x:x-145,y:y-265};positions['bridge_'+id+'_1']={x:x+275,y:y-140};positions['bridge_'+id+'_2']={x:x+145,y:y-265};list.filter(n=>n.passiveId===id).forEach((n,j)=>positions[n.id]={x:x+j*90,y});});
 
 const obstacles=list.map(n=>({...positions[n.id],radius:n.affinity?86:39}));
 const cache=new Map();
 function waypoints(node,required){
  const key=required+'>'+node.id;
  if(cache.has(key))return cache.get(key);
  const path=[positions[required],positions[node.id]];
  const active=obstacles.filter(p=>path.length&&[path[0],path.at(-1)].every(q=>Math.hypot(p.x-q.x,p.y-q.y)>1));
  for(let i=1,limit=0;i<path.length&&limit<100;i++,limit++){
   const a=path[i-1],b=path[i],dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy);
   if(!len)continue;
   let first=null,nearest=Infinity;
   for(const p of active){
    const t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(len*len)));
    if(t<nearest&&Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy)<p.radius){first=p;nearest=t;}
   }
   if(!first)continue;
   const side=((first.x-a.x)*dy-(first.y-a.y)*dx)>=0?1:-1;
   const offset=first.radius+10;
   path.splice(i,0,{x:first.x-side*dy*offset/len,y:first.y+side*dx*offset/len});
   i--;
  }
  cache.set(key,path);return path;
 }
 return {positions,proxies,hybrids,center,angles:ANGLES,rootAngles:ROOT_ANGLES,point,waypoints,width:12300,height:8600};
}
root.WandererTalentLayout=Object.freeze({create});
})(globalThis);
