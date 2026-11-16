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
   const radius=1850+index*560,id=n.passiveId;positions[n.id]=at(radius,0);proxies[id]={};
   for(const [prefix,family] of [['path',n.family],['bridge',n.hybridOther]]){
    const side=family===first?-1:1;
    positions[prefix+'_'+id+'_1']=at(radius-180,side*290);
    positions[prefix+'_'+id+'_2']=at(radius,side*145);
   }
  });
  const advanced=list.find(n=>n.advanced&&[n.left,n.right].every(id=>[first,second].includes(list.find(x=>x.id===id)?.family)));
  if(advanced){
   const radius=3250;positions[advanced.id]=at(radius,0);
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
 const obstacles=visible.map(n=>({...positions[n.id],radius:n.affinity?86:n.advanced||n.hybridFor&&n.passiveId?62:n.passiveId||n.skillKey?49:39}));


 const cache=new Map();
 function waypoints(node,required){
  const key=required+'>'+node.id;if(cache.has(key))return cache.get(key);
  const from=positions[required],to=positions[node.id];if(!from||!to)return [];
  const dx=to.x-from.x,dy=to.y-from.y,length=Math.hypot(dx,dy);
  if(length<1)return [from,to];
  const candidates=[[from,to]];
  for(const shift of [100,-100,200,-200,320,-320]){
   const px=-dy/length*shift,py=dx/length*shift;
   candidates.push([from,{x:from.x+dx*.33+px,y:from.y+dy*.33+py},{x:from.x+dx*.67+px,y:from.y+dy*.67+py},to]);
  }
  const score=route=>{let cost=0;for(let i=1;i<route.length;i++){
   const a=route[i-1],b=route[i],vx=b.x-a.x,vy=b.y-a.y,d2=vx*vx+vy*vy;
   cost+=Math.sqrt(d2);
   for(const p of obstacles){if(Math.hypot(p.x-from.x,p.y-from.y)<1||Math.hypot(p.x-to.x,p.y-to.y)<1)continue;const t=Math.max(0,Math.min(1,((p.x-a.x)*vx+(p.y-a.y)*vy)/(d2||1)));if(Math.hypot(p.x-a.x-t*vx,p.y-a.y-t*vy)<p.radius+10)cost+=100000;}
  }return cost;};
  candidates.sort((a,b)=>score(a)-score(b));cache.set(key,candidates[0]);return candidates[0];
 }
 return {positions,proxies,hybrids,center,angles:ANGLES,rootAngles:ROOT_ANGLES,point,waypoints,width:12300,height:8600};
}
root.WandererTalentLayout=Object.freeze({create});
})(globalThis);
