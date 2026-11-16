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

 // Arrange visible nodes in affinity sectors, then place mixed talents between them.
 const shown=list.filter(n=>n.rank===undefined||n.rank===1),byId=new Map(list.map(n=>[n.id,n]));
 const centres=shown.filter(n=>!n.family&&!n.advanced);
 centres.forEach((n,i)=>{const a=-Math.PI/2+i*Math.PI*2/centres.length;positions[n.id]=point(a,350)});
 const families=Object.keys(ANGLES);
 for(const family of families){
  const angle=ANGLES[family],group=shown.filter(n=>n.family===family&&!n.hybridFor&&!n.outerLink&&!n.junction&&!n.affinity);
  const sorted=group.slice().sort((a,b)=>{const weight=n=>n.specialisationTier?500+n.specialisationTier*30:n.elementBranch?400:n.forkAnchor?300:n.skillKey?280:n.branchDepth!==undefined?80+n.branchDepth*60+(n.pathStep||3)*12:200;return weight(a)-weight(b)||a.id.localeCompare(b.id)});
  sorted.forEach((n,i)=>{const row=Math.floor(i/5),col=i%5,sector=(col-2)*.085,rad=1050+row*185;positions[n.id]=point(angle+sector,rad)});
  positions['affinity_'+family]=point(angle,700);
 }
 for(const [first,second] of corridors){
  const delta=Math.atan2(Math.sin(ANGLES[second]-ANGLES[first]),Math.cos(ANGLES[second]-ANGLES[first])),angle=ANGLES[first]+delta/2;
  const group=shown.filter(n=>n.hybridFor&&n.passiveId&&n.rank===1&&[n.family,n.hybridOther].includes(first)&&[n.family,n.hybridOther].includes(second)).sort((a,b)=>a.id.localeCompare(b.id));
  group.forEach((n,i)=>{const radius=2050+i*520;positions[n.id]=point(angle,radius);for(const prefix of ['path','bridge'])for(let step=1;step<=2;step++){const id=prefix+'_'+n.passiveId+'_'+step,entry=byId.get(id),side=entry?.family===first?-1:1;if(entry)positions[id]=point(angle+side*(3-step)*.10,radius-150*(2-step))}for(const family of [first,second])for(let step=1;step<=3;step++){const id='alternate_'+n.passiveId+'_'+family+'_'+step,side=family===first?-1:1;if(byId.has(id))positions[id]=point(angle+side*(.30-step*.035),radius-650+step*140)}});
  const advanced=shown.find(n=>n.advanced&&[n.left,n.right].every(id=>[first,second].includes(byId.get(id)?.family)));
  if(advanced){positions[advanced.id]=point(angle,3200);for(const n of shown.filter(n=>n.outerLink===advanced.id)){const side=byId.get(n.side)?.family===first?-1:1;positions[n.id]=point(angle+side*(3-n.step)*.10,2850+n.step*100)}}
 }
 for(const n of shown.filter(n=>n.junction)){const base=positions[n.requires];if(base)positions[n.id]={x:base.x+90,y:base.y+90}}
 for(const n of list.filter(n=>n.rank>1)){const base=positions[n.rank===2?(n.passiveId?'passive_'+n.passiveId:n.skillKey):n.id.replace(/_rank\d+$/,'')];if(base)positions[n.id]={x:base.x+n.rank*80,y:base.y+100}}


 // Exactly 24 radial axes: four 15-degree-spaced spokes in each 60-degree affinity sector.
 // Positions are visual only; allocation, prerequisites, XP and saves are never modified here.
 const familyOrder=Object.keys(ANGLES),axisOffsets=[-3,-1,1,3].map(n=>n*Math.PI/24),axisByNode={};
 const axes=familyOrder.flatMap(f=>axisOffsets.map((offset,lane)=>({family:f,lane,angle:ANGLES[f]+offset})));
 const visibleNodes=list.filter(n=>n.rank===undefined||n.rank===1),hiddenRanks=list.filter(n=>n.rank>1);
 const levels=new Map();
 function depth(node,stack=new Set()){
  if(!node||stack.has(node.id))return 0;
  if(levels.has(node.id))return levels.get(node.id);
  const next=new Set(stack);next.add(node.id);
  const keys=[...(node.prerequisites||[]),...(node.anyRequires||[]),...(node.requires?[node.requires]:[])];
  const value=1+Math.max(0,...keys.map(id=>depth(byId.get(id),next)));
  levels.set(node.id,value);return value;
 }
 // Keep the four foundation groups close to the centre.
 for(const id of ['might','vitality','haste','insight']){
  const angle=ROOT_ANGLES[id];
  const ancestry=(key,seen=new Set())=>{
   const n=byId.get(key);if(!n||!n.requires||seen.has(key))return false;
   if(n.requires===id)return true;seen.add(key);return ancestry(n.requires,seen);
  };
  const members=visibleNodes.filter(n=>!n.family&&!n.advanced&&n.id!==id&&ancestry(n.id)).sort((a,b)=>depth(a)-depth(b)||a.id.localeCompare(b.id));
  positions[id]=point(angle,200);
  members.forEach((n,i)=>positions[n.id]=point(angle+((i%3)-1)*.18,350+Math.floor(i/3)*140));
 }
 for(const f of familyOrder)positions['affinity_'+f]=point(ANGLES[f],760);
 const groupKey=n=>{
  if(n.hybridFor)return 'hybrid:'+n.hybridFor;
  if(n.outerLink)return 'outer:'+n.outerLink;
  if(n.pathFor)return 'route:'+Math.max(0,byId.get('passive_'+n.pathFor)?.branchLane??n.branchLane??0);
  if(n.passiveId)return 'route:'+Math.max(0,n.branchLane??0);
  if(n.forkAnchor)return 'fork:'+n.forkAnchor;
  if(n.specialisationTier)return 'special:'+(n.elementSpecialisation||n.specialisationTier);
  if(n.elementBranch)return 'element:'+n.elementBranch;
  if(n.skillKey)return 'skill:'+n.skillKey;
  if(n.branchLane!==undefined&&n.branchLane>=0)return 'route:'+n.branchLane;
  return 'chain:'+(n.requires||n.id);
 };
 const preference=key=>key.startsWith('route:')?Math.min(3,Number(key.slice(6))||0):key.includes('fire')?0:key.includes('frost')?1:key.includes('lightning')?2:3;
 const weight=key=>key.startsWith('route:')?0:key.startsWith('element:')?1:key.startsWith('skill:')?2:key.startsWith('fork:')?3:key.startsWith('special:')?4:key.startsWith('hybrid:')?5:6;
 for(const family of familyOrder){
  const groups=new Map();
  visibleNodes.filter(n=>n.family===family&&!n.affinity&&!n.advanced&&!(n.hybridFor&&n.passiveId)).forEach(n=>{
   const key=groupKey(n);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(n);
  });
  const lanes=[[],[],[],[]],loads=[0,0,0,0];
  [...groups].sort((a,b)=>b[1].length-a[1].length||a[0].localeCompare(b[0])).forEach(([key,nodes])=>{
   const pref=preference(key),lane=[0,1,2,3].sort((a,b)=>(loads[a]+Math.abs(a-pref)*.25)-(loads[b]+Math.abs(b-pref)*.25)||a-b)[0];
   nodes.sort((a,b)=>depth(a)-depth(b)||a.id.localeCompare(b.id));
   lanes[lane].push({key,nodes});loads[lane]+=nodes.length;
  });
  lanes.forEach((groups,lane)=>{
   groups.sort((a,b)=>weight(a.key)-weight(b.key)||a.key.localeCompare(b.key));
   groups.flatMap(g=>g.nodes).forEach((n,i)=>{
    positions[n.id]=point(ANGLES[family]+axisOffsets[lane],1020+i*123);
    axisByNode[n.id]={family,lane};
   });
  });
 }
 // Hybrid abilities use the six inter-affinity corridors, without generating a new spoke.
 const outside=[];
 for(const n of visibleNodes.filter(n=>n.hybridFor&&n.passiveId)){
  const key=[n.family,n.hybridOther].sort().join(':');
  const pair=corridors.find(p=>p.slice().sort().join(':')===key);
  if(!pair){outside.push(n);continue}
  const peers=visibleNodes.filter(x=>x.hybridFor&&x.passiveId&&[x.family,x.hybridOther].sort().join(':')===key).sort((a,b)=>a.id.localeCompare(b.id));
  positions[n.id]=point(ANGLES[pair[0]]+Math.PI/6,1460+peers.indexOf(n)*420);
 }
 visibleNodes.filter(n=>n.advanced).forEach((n,i)=>{
  const f1=byId.get(n.left)?.family,f2=byId.get(n.right)?.family;
  const pair=corridors.find(p=>p.slice().sort().join(':')===[f1,f2].sort().join(':'));
  positions[n.id]=point(pair?ANGLES[pair[0]]+Math.PI/6:-Math.PI/2+i*Math.PI/3,3500);
 });
 // These are not drawn on the playable preview. Reserve coordinates for integrity checks.
 [...outside,...hiddenRanks].forEach((n,i)=>{positions[n.id]={x:9000+(i%16)*155,y:500+Math.floor(i/16)*155}});
 visibleNodes.filter(n=>!positions[n.id]).forEach((n,i)=>{positions[n.id]={x:9000+(i%16)*155,y:4100+Math.floor(i/16)*155}});
 const visible=list.filter(n=>n.rank===undefined||n.rank===1).filter(n=>positions[n.id]);
 // Resolve collisions while keeping prominent affinity and mixed nodes fixed.
 const radius=n=>n.affinity?82:n.advanced||n.hybridFor&&n.passiveId?58:n.passiveId||n.skillKey||n.specialisationTier?48:32;
 const fixed=n=>!!n.affinity||!!n.advanced||!!(n.hybridFor&&n.passiveId);
 for(let pass=0;pass<250;pass++){
  let moved=false;
  for(let i=0;i<visible.length;i++)for(let j=i+1;j<visible.length;j++){
   const a=visible[i],b=visible[j],pa=positions[a.id],pb=positions[b.id],dx=pb.x-pa.x,dy=pb.y-pa.y,dist=Math.hypot(dx,dy),gap=radius(a)+radius(b)+12-dist;
   if(gap<=0)continue;
   const ux=dist>0?dx/dist:1,uy=dist>0?dy/dist:0,fa=fixed(a),fb=fixed(b),shareA=fa&&!fb?0:fb&&!fa?1:.5,shareB=1-shareA;
   pa.x-=ux*gap*shareA;pa.y-=uy*gap*shareA;pb.x+=ux*gap*shareB;pb.y+=uy*gap*shareB;moved=true;
  }
  if(!moved)break;
 }

 const obstacles=visible.map(n=>({...positions[n.id],radius:n.affinity?86:n.advanced||n.hybridFor&&n.passiveId?62:n.passiveId||n.skillKey?49:39}));



 const cache=new Map();
 function waypoints(node,required){
  const key=required+'>'+node.id;if(cache.has(key))return cache.get(key);
  const from=positions[required],to=positions[node.id];if(!from||!to)return [];
  const path=[from,to];
  cache.set(key,path);return path;
 }
 return {positions,proxies,hybrids,center,angles:ANGLES,rootAngles:ROOT_ANGLES,point,waypoints,axes,axisByNode,width:12300,height:8600};
}
root.WandererTalentLayout=Object.freeze({create});
})(globalThis);
