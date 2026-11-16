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
 for(const node of list){if(node.hybridFor)continue;const t=((node.branchLane??1)-1)*420,r=1100+(node.branchDepth||0)*480;
  if(node.pathFor)positions[node.id]=local(node.family,t+(node.pathStep===1?-75:0),r-(node.pathStep===1?150:225));
  if(node.passiveId){const offsets=[[0,0],[90,0],[180,0],[180,90],[90,90]],o=offsets[node.rank-1];positions[node.id]=local(node.family,t+o[0],r+o[1]);}
  if(node.elementBranch){const lane=['fire','frost','lightning'].indexOf(node.elementBranch);positions[node.id]=local('magic',(lane-1)*450,1990);}
 }
 for(const node of list.filter(n=>n.forkAnchor)){const anchor=list.find(n=>n.id===node.forkAnchor);if(!anchor)continue;const t=((anchor.branchLane??1)-1)*420,r=1100+(anchor.branchDepth||0)*480;positions[node.id]=local(node.family,t+(node.forkStep<3?(node.forkStep===1?-105:105):(node.forkSide||0)*190),r+(node.forkStep<3?170:320));}
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
   const radius=1700+index*420,id=n.passiveId;positions[n.id]=at(radius,0);proxies[id]={};
   for(const [prefix,family] of [['path',n.family],['bridge',n.hybridOther]]){
    const side=family===first?-1:1;
    positions[prefix+'_'+id+'_1']=at(radius-180,side*290);
    positions[prefix+'_'+id+'_2']=at(radius,side*145);
   }
  });
  const advanced=list.find(n=>n.advanced&&[n.left,n.right].every(id=>[first,second].includes(list.find(x=>x.id===id)?.family)));
  if(advanced){
   const radius=2800;positions[advanced.id]=at(radius,0);
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
  skills.forEach((n,i)=>{positions[n.id]=local(family,i?190:-190,2200);});
 }
 for(const node of list.filter(n=>n.specialisationTier)){const lane=node.elementSpecialisation?({fire:-1,frost:0,lightning:1}[node.elementSpecialisation]*260):0;positions[node.id]=local(node.family,350+lane,2450+node.specialisationTier*200);}
 // Compact the finished layout before routing, preserving each node's direction.
 for(const position of Object.values(positions)){
  position.x=center.x+(position.x-center.x)*.82;
  position.y=center.y+(position.y-center.y)*.82;
 }
 // Put the Aegis and Fury approaches between their two existing prerequisites.
 const arms=['path_counterstrike','bridge_counterstrike'].map(prefix=>{
  const entry=list.find(n=>n.id===prefix+'_1');
  return {prefix,start:positions[entry?.requires]};
 });
 if(positions.passive_counterstrike&&arms.every(arm=>arm.start)){
  const [a,b]=arms.map(arm=>arm.start);
  const goal={x:(a.x+b.x)/2-80,y:(a.y+b.y)/2};
  positions.passive_counterstrike=goal;
  for(const {prefix,start} of arms){
   for(const step of [1,2]){
    positions[prefix+'_'+step]={x:start.x+(goal.x-start.x)*step/3,y:start.y+(goal.y-start.y)*step/3};
   }
  }
 }
 for(const n of list.filter(n=>n.alternateFor)){const first=positions['alternate_'+n.alternateFor+'_'+n.family+'_1'],target=positions[(list.find(x=>x.id==='path_'+n.alternateFor+'_1')?.family===n.family?'path_':'bridge_')+n.alternateFor+'_1'],origin=positions['affinity_'+n.family];if(target&&origin){const t=n.alternateStep/4;positions[n.id]={x:origin.x+(target.x-origin.x)*t+45,y:origin.y+(target.y-origin.y)*t+45};}}
 const visible=list.filter(n=>n.rank===undefined||n.rank===1).filter(n=>positions[n.id]);
 const obstacles=visible.map(n=>({...positions[n.id],radius:n.affinity?86:n.advanced||n.hybridFor&&n.passiveId?62:n.passiveId||n.skillKey?49:39}));



 const cache=new Map();
 function waypoints(node,required){
  const key=required+'>'+node.id;if(cache.has(key))return cache.get(key);
  const from=positions[required],to=positions[node.id];if(!from||!to)return [];
  const active=obstacles.filter(p=>Math.hypot(p.x-from.x,p.y-from.y)>1&&Math.hypot(p.x-to.x,p.y-to.y)>1);
  const path=[from,to];
  for(let iteration=0;iteration<120;iteration++){
   let collision=null;
   for(let i=1;i<path.length&&!collision;i++){
    const a=path[i-1],b=path[i],dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy);
    if(length<1)continue;
    let first=Infinity;
    for(const p of active){
     const t=((p.x-a.x)*dx+(p.y-a.y)*dy)/(length*length);
     if(t<=.001||t>=.999||t>=first)continue;
     if(Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy)<p.radius+10){first=t;collision={i,a,b,p,dx,dy,length};}
    }
   }
   if(!collision)break;
   const {i,a,b,p,dx,dy,length}=collision,ux=dx/length,uy=dy/length;
   const side=((p.x-a.x)*dy-(p.y-a.y)*dx)>=0?1:-1,r=p.radius+32;
   const detour=[
    {x:p.x-ux*r-side*uy*r,y:p.y-uy*r+side*ux*r},
    {x:p.x-side*uy*r,y:p.y+side*ux*r},
    {x:p.x+ux*r-side*uy*r,y:p.y+uy*r+side*ux*r}
   ];
   path.splice(i,0,...detour);
  }
  cache.set(key,path);return path;
 }
 return {positions,proxies,hybrids,center,angles:ANGLES,rootAngles:ROOT_ANGLES,point,waypoints,width:12300,height:8600};
}
root.WandererTalentLayout=Object.freeze({create});
})(globalThis);
