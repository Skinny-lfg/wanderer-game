/* Wanderer v0.13 — deterministic, single-target Expedition route graph. */
(function(root){'use strict';
const VERSION=1,REALMS=15;
function rng(seed){if(!Number.isSafeInteger(seed)||seed<0||seed>4294967295)throw Error('Invalid map seed');let s=seed>>>0;return()=>{s=(s+0x6d2b79f5)|0;let x=Math.imul(s^(s>>>15),1|s);x^=x+Math.imul(x^(x>>>7),61|x);return((x^(x>>>14))>>>0)/4294967296;};}
function create(seed,rooms){
 if(!Array.isArray(rooms)||rooms.length!==REALMS||rooms[0]!=='combat'||rooms[14]!=='boss'||rooms.slice(0,14).some(k=>!['combat','elite','event'].includes(k)))throw Error('Invalid encounter calendar');
 const random=rng(seed),rows=[];
 for(let i=0;i<REALMS;i++){
  const realm=i+1,count=realm===1||realm===15?1:3;
  rows.push(Array.from({length:count},(_,lane)=>({id:`r${realm}n${lane}`,realm,lane,kind:rooms[i]})));
 }
 const edges=[];
 for(let i=0;i<rows.length-1;i++)for(let lane=0;lane<rows[i].length;lane++){
  const next=rows[i+1],destinations=rows[i].length===1?next.map((_,j)=>j):next.length===1?[0]:[lane%next.length,(lane+1)%next.length];
  for(const to of new Set(destinations))edges.push({from:rows[i][lane].id,to:next[to].id});
 }
 const map={version:VERSION,seed,rows,nodes:rows.flat(),edges,currentNodeId:null,chosenNodeIds:[],completedNodeIds:[],availableNodeIds:[rows[0][0].id],autoAdvance:true};
 // Consume a map-local random word as part of the deterministic schema so later
 // graph versions can add variation without depending on browser/global RNG.
 map.generationKey=Math.floor(random()*4294967296);
 validate(map,rooms);return map;
}
function successors(map,id){return map.edges.filter(e=>e.from===id).map(e=>e.to);}
function validate(map,rooms){
 if(!map||map.version!==VERSION||!Number.isSafeInteger(map.seed)||!Number.isSafeInteger(map.generationKey)||typeof map.autoAdvance!=='boolean'||!Array.isArray(map.rows)||map.rows.length!==REALMS||!Array.isArray(map.nodes)||!Array.isArray(map.edges))throw Error('Invalid Expedition map version/shape');
 const ids=new Set(map.nodes.map(n=>n.id));if(ids.size!==41||map.rows.some((row,i)=>!Array.isArray(row)||row.length!==((i===0||i===14)?1:3)))throw Error('Invalid Expedition map nodes');
 for(let i=0;i<REALMS;i++)for(let lane=0;lane<map.rows[i].length;lane++){const node=map.rows[i][lane];if(node.id!==`r${i+1}n${lane}`||node.realm!==i+1||node.lane!==lane||node.kind!==rooms[i])throw Error('Map node/calendar mismatch');}
 const inbound=new Map(map.nodes.map(n=>[n.id,0]));for(const edge of map.edges){const a=map.nodes.find(n=>n.id===edge.from),b=map.nodes.find(n=>n.id===edge.to);if(!a||!b||b.realm!==a.realm+1)throw Error('Invalid map edge');inbound.set(b.id,inbound.get(b.id)+1);}
 if(map.nodes.some(n=>n.realm>1&&!inbound.get(n.id)))throw Error('Unreachable map node');
 const reachable=new Set([map.rows[0][0].id]);for(const row of map.rows)for(const node of row)if(reachable.has(node.id))for(const id of successors(map,node.id))reachable.add(id);
 if(reachable.size!==ids.size||!reachable.has('r15n0'))throw Error('Map cannot reach the boss');
 const backwards=new Set(['r15n0']);for(let i=13;i>=0;i--)for(const node of map.rows[i])if(successors(map,node.id).some(id=>backwards.has(id)))backwards.add(node.id);
 if(backwards.size!==ids.size)throw Error('Map contains a dead-end branch');
 if(!Array.isArray(map.chosenNodeIds)||!Array.isArray(map.completedNodeIds)||!Array.isArray(map.availableNodeIds)||new Set(map.chosenNodeIds).size!==map.chosenNodeIds.length||new Set(map.completedNodeIds).size!==map.completedNodeIds.length||map.completedNodeIds.some(id=>!map.chosenNodeIds.includes(id))||map.availableNodeIds.some(id=>!ids.has(id)))throw Error('Invalid map progress');
 if(map.currentNodeId!==null&&!ids.has(map.currentNodeId))throw Error('Invalid current map node');
 if(map.availableNodeIds.length){const allowed=map.currentNodeId===null?[map.rows[0][0].id]:successors(map,map.currentNodeId);if(map.availableNodeIds.some(id=>!allowed.includes(id))||new Set(map.availableNodeIds).size!==map.availableNodeIds.length)throw Error('Invalid available map path');}
 return true;
}
function choose(map,id){if(!map.availableNodeIds.includes(id)||map.chosenNodeIds.includes(id))return false;map.currentNodeId=id;map.chosenNodeIds.push(id);map.availableNodeIds=[];return true;}
function complete(map,id){if(map.currentNodeId!==id||map.completedNodeIds.includes(id))return false;map.completedNodeIds.push(id);map.availableNodeIds=successors(map,id);return true;}
function node(map,id){return map.nodes.find(n=>n.id===id)||null;}
function status(map,id){if(map.completedNodeIds.includes(id))return'completed';if(map.currentNodeId===id)return'selected';if(map.availableNodeIds.includes(id))return'available';return'locked';}
root.WandererV013ExpeditionMap=Object.freeze({VERSION,REALMS,rng,create,validate,successors,choose,complete,node,status});
})(globalThis);
