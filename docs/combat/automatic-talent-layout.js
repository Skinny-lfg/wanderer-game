// Shared layout data for rendering and geometric checks. No character state is changed.
(function(root){'use strict';
const CENTER={x:4300,y:4300},ANGLES={blood:-Math.PI/2,fury:-Math.PI/6,aegis:Math.PI/6,vitality:Math.PI/2,magic:Math.PI*5/6,decay:Math.PI*7/6},ROOT_ANGLES={insight:Math.PI*1.35,might:-Math.PI/2,vitality:Math.PI/3,haste:Math.PI};
function create(list){
 const positions={},proxies={},center={...CENTER},point=(angle,r)=>({x:center.x+Math.cos(angle)*r,y:center.y+Math.sin(angle)*r}),local=(family,t,r)=>{const angle=ANGLES[family];return{x:center.x+Math.cos(angle)*r-Math.sin(angle)*t,y:center.y+Math.sin(angle)*r+Math.cos(angle)*t};};
 for(const id of ['might','vitality','haste','insight'])positions[id]=point(ROOT_ANGLES[id],210);
 for(const [id,second,third,type]of [['might','precision','execution','attack'],['vitality','guard','fortitude','health'],['haste','flow','mastery','speed']]){
  const angle=ROOT_ANGLES[id],at=(t,r)=>({x:center.x+Math.cos(angle)*r-Math.sin(angle)*t,y:center.y+Math.sin(angle)*r+Math.cos(angle)*t});positions[second]=at(85,210);positions[third]=at(170,210);
  [[-80,210],[-80,290],[-160,290],[-160,370],[-80,370]].forEach(([t,r],i)=>positions['minor_'+type+'_'+(i+1)]=at(t,r));
 }
 for(const family of Object.keys(ANGLES))positions['affinity_'+family]=point(ANGLES[family],650);
 for(const node of list){if(node.hybridFor)continue;const t=((node.branchLane??1)-1)*510,r=1200+(node.branchDepth||0)*550;
  if(node.pathFor)positions[node.id]=local(node.family,t+(node.pathStep===1?-75:0),r-(node.pathStep===1?150:225));
  if(node.passiveId){const offsets=[[0,0],[90,0],[180,0],[180,90],[90,90]],o=offsets[node.rank-1];positions[node.id]=local(node.family,t+o[0],r+o[1]);}
  if(node.elementBranch){const lane=['fire','frost','lightning'].indexOf(node.elementBranch);positions[node.id]=local('magic',(lane-1)*450,1990);}
 }
 for(const node of list.filter(n=>n.forkAnchor)){const anchor=list.find(n=>n.id===node.forkAnchor);if(!anchor)continue;const t=((anchor.branchLane??1)-1)*510,r=1200+(anchor.branchDepth||0)*550;positions[node.id]=local(node.family,t+(node.forkStep<3?(node.forkStep===1?-105:105):(node.forkSide||0)*190),r+(node.forkStep<3?170:320));}
 const hybrids=list.filter(n=>n.hybridFor&&n.passiveId&&n.rank===1);
 for(const family of Object.keys(ANGLES)){
  const skills=list.filter(n=>n.family===family&&n.skillKey&&n.rank===1);
  skills.forEach((n,i)=>{const origin=positions[n.requires];positions[n.id]={x:origin.x+Math.cos(ANGLES[family])*410-Math.sin(ANGLES[family])*(i?150:-150),y:origin.y+Math.sin(ANGLES[family])*410+Math.cos(ANGLES[family])*(i?150:-150)};});
 }

 // Fixed coordinates in each corridor, rotated around the centre.
 const corridors=[
  ['blood','fury'],['fury','aegis'],['aegis','vitality'],
  ['vitality','magic'],['magic','decay'],['decay','blood']
 ];
 for(const [first,second] of corridors){
  const delta=Math.atan2(Math.sin(ANGLES[second]-ANGLES[first]),Math.cos(ANGLES[second]-ANGLES[first]));
  const angle=ANGLES[first]+delta/2,radial={x:Math.cos(angle),y:Math.sin(angle)},tangent={x:-radial.y,y:radial.x};
  const at=(along,side)=>({x:center.x+radial.x*along+tangent.x*side,y:center.y+radial.y*along+tangent.y*side});
  const group=hybrids.filter(n=>[n.family,n.hybridOther].includes(first)&&[n.family,n.hybridOther].includes(second)).sort((a,b)=>a.id.localeCompare(b.id));
  group.forEach((n,index)=>{
   const radius=1800+index*460,id=n.passiveId;positions[n.id]=at(radius,0);proxies[id]={};
   for(const [prefix,family] of [['path',n.family],['bridge',n.hybridOther]]){
    const side=family===first?-1:1;
    positions[prefix+'_'+id+'_1']=at(radius-180,side*290);
    positions[prefix+'_'+id+'_2']=at(radius,side*145);
   }
  });
  const advanced=list.find(n=>n.advanced&&[n.left,n.right].every(id=>[first,second].includes(list.find(x=>x.id===id)?.family)));
  if(advanced){
   const radius=2950;positions[advanced.id]=at(radius,0);
   for(const link of list.filter(n=>n.outerLink===advanced.id)){
    const side=list.find(x=>x.id===link.side).family===first?-1:1;
    positions[link.id]=at(radius-240+link.step*120,side*(3-link.step)*130);
   }
  }
 }
 for(const n of list.filter(n=>n.junction)){const p=positions[n.requires];if(p)positions[n.id]={x:p.x+(p.x-center.x)*.10,y:p.y+(p.y-center.y)*.10};}
 // Every ordinary branch uses fixed, radial lanes.
 for(const family of Object.keys(ANGLES)){
  const skills=list.filter(n=>n.family===family&&n.skillKey&&n.rank===1);
  skills.forEach((n,i)=>{positions[n.id]=local(family,i?210:-210,2450);});
 }
 const visible=list.filter(n=>n.rank===undefined||n.rank===1).filter(n=>positions[n.id]);
 const obstacles=visible.map(n=>({...positions[n.id],radius:n.affinity?86:39}));
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
