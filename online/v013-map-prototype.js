/* Wanderer v0.13 — isolated deterministic map prototype. Not imported by the live game.
 * No persistence, rewards, Firebase, or combat integration. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.WandererV013MapPrototype=api;})(globalThis,function(){'use strict';
const KIND=Object.freeze(['combat','elite','event','boss']);
const RISK=Object.freeze(['safer','balanced','dangerous']);
const FAMILIES=Object.freeze(['blood','decay','vitality','aegis','fury','magic']);
function rng(seed){if(!Number.isSafeInteger(seed)||seed<0||seed>4294967295)throw Error('Seed must be an unsigned 32-bit integer');let state=seed>>>0;return function(){state=(state+0x6d2b79f5)|0;let x=Math.imul(state^(state>>>15),1|state);x^=x+Math.imul(x^(x>>>7),61|x);return ((x^(x>>>14))>>>0)/4294967296;};}
function sample(g,items,n){const a=items.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(g()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a.slice(0,n);}
function create(seed,{eventCount=4}={}){
 if(![3,4].includes(eventCount))throw Error('Event count must be 3 or 4');
 const random=rng(seed);
 // All branches in the same Realm share its encounter kind. This ensures current
 // schedule invariants hold irrespective of which branches the player selects.
 const positions=[3,4,5,7,8,9,11,12,13,14];
 const events=sample(random,positions,eventCount).sort((a,b)=>a-b);
 const eliteEarly=[5,6,7,8].filter(v=>!events.includes(v));
 const eliteLate=[10,11,12,13,14].filter(v=>!events.includes(v));
 const elite=[sample(random,eliteEarly,1)[0],sample(random,eliteLate,1)[0]].sort((a,b)=>a-b);
 const schedule=Array.from({length:15},(_,i)=>{const realm=i+1;return realm===15?'boss':events.includes(realm)?'event':elite.includes(realm)?'elite':'combat';});
 const rows=Array.from({length:15},(_,i)=>{const realm=i+1,size=(realm===1||realm===15)?1:3;
  const hints=sample(random,FAMILIES,Math.min(size,FAMILIES.length));
  return Array.from({length:size},(_,lane)=>({
   id:'r'+realm+'n'+lane,realm,lane,kind:schedule[i],risk:RISK[lane]||'balanced',
   // The family is only a DISPLAY PLACEHOLDER. Integration must obtain eligible
   // affinity/offer from v0.12 controller and keep maximum three unlocked.
   affinityHint:hints[lane],waves:realm===15?3:schedule[i]==='event'?0:schedule[i]==='elite'?3:1+lane,
  }));
 });
 const edges=[];
 for(let i=0;i<rows.length-1;i++){const from=rows[i],to=rows[i+1];
  for(let j=0;j<from.length;j++){const destinations=from.length===1?to.map((_,k)=>k):to.length===1?[0]:[j%to.length,(j+1)%to.length];
   for(const k of new Set(destinations))edges.push({from:from[j].id,to:to[k].id});}
 }
 const nodes=rows.flat(),byId=Object.fromEntries(nodes.map(n=>[n.id,n]));
 const map={version:13,seed,eventCount,eliteRealms:elite,eventRealms:events,rows,nodes,edges,bossId:'r15n0'};
 validate(map);
 return map;
}
function next(map,nodeId){
 return map.edges.filter(e=>e.from===nodeId).map(e=>map.nodes.find(n=>n.id===e.to));
}
function validate(map){
 if(!map||map.version!==13||map.rows?.length!==15||map.rows[0]?.length!==1||map.rows[14]?.length!==1)throw Error('Invalid map shape');
 const ids=new Set(map.nodes.map(n=>n.id));
 if(ids.size!==map.nodes.length||map.nodes.length!==41||!ids.has(map.bossId))throw Error('Invalid node IDs');
 if(map.rows[0][0].kind!=='combat'||map.rows[14][0].kind!=='boss')throw Error('Invalid endpoints');
 if(map.rows.filter(row=>row[0].kind==='elite').length!==2||map.rows.filter(row=>row[0].kind==='event').length!==map.eventCount)throw Error('Wrong event/elite count');
 const inbound=new Map(map.nodes.map(n=>[n.id,0]));
 for(const edge of map.edges){const from=map.nodes.find(n=>n.id===edge.from),to=map.nodes.find(n=>n.id===edge.to);if(!from||!to||to.realm!==from.realm+1)throw Error('Invalid forward edge');inbound.set(to.id,inbound.get(to.id)+1);}
 if(map.nodes.some(n=>n.realm>1&&!inbound.get(n.id)))throw Error('Unreachable node');
 const reach=new Set([map.rows[0][0].id]);for(const row of map.rows){for(const n of row){if(!reach.has(n.id))continue;for(const nextNode of next(map,n.id))reach.add(nextNode.id);}}
 if(reach.size!==map.nodes.length||!reach.has(map.bossId))throw Error('Map unreachable from start');
 const canReachBoss=new Set([map.bossId]);for(let i=13;i>=0;i--)for(const n of map.rows[i]){if(next(map,n.id).some(k=>canReachBoss.has(k.id)))canReachBoss.add(n.id);}
 if(canReachBoss.size!==map.nodes.length)throw Error('Node without boss route');
 return true;
}
function walk(map,laneIndices=[]){
 let current=map.rows[0][0],visited=[current];for(let i=0;i<14;i++){const offered=next(map,current.id);if(!offered.length)throw Error('Dead end');current=offered[((laneIndices[i]||0)%offered.length+offered.length)%offered.length];visited.push(current);}
 return visited;
}
return Object.freeze({KIND,RISK,FAMILIES,create,next,validate,walk});
});