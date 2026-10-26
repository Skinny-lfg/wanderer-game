/* Deterministic, versioned Expedition route graph. */
(function(root){'use strict';
const VERSION=2,LEGACY_VERSION=1,REALMS=15,DECISION_REALMS=[2,6,10,13];
const ROW_WIDTHS=[1,3,3,3,1,3,3,3,1,3,3,1,3,3,1];
const SEGMENTS=Object.freeze([
 Object.freeze({decision:1,start:2,end:4,join:5,role:'elite'}),
 Object.freeze({decision:2,start:6,end:8,join:9,role:'event'}),
 Object.freeze({decision:3,start:10,end:11,join:12,role:'elite'}),
 Object.freeze({decision:4,start:13,end:14,join:15,role:'event'})
]);
function rng(seed){if(!Number.isSafeInteger(seed)||seed<0||seed>4294967295)throw Error('Invalid map seed');let s=seed>>>0;return()=>{s=(s+0x6d2b79f5)|0;let x=Math.imul(s^(s>>>15),1|s);x^=x+Math.imul(x^(x>>>7),61|x);return((x^(x>>>14))>>>0)/4294967296;};}
function shuffle(values,random){const out=[...values];for(let i=out.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}
function create(seed,plan){
 if(!plan||![3,4].includes(plan.eventCount)||!Array.isArray(plan.eventGroups)||plan.eventGroups.length!==4||plan.eventGroups.some(group=>!Array.isArray(group)||group.length<3||group.some(id=>typeof id!=='string'||!id)))throw Error('Invalid route event plan');
 const random=rng(seed),order=shuffle([0,1,2,3],random),eventSalt=Math.floor(random()*4),rows=ROW_WIDTHS.map((count,i)=>Array.from({length:count},(_,lane)=>({id:`r${i+1}n${lane}`,realm:i+1,lane,kind:'combat',eventId:null,eventGroup:null})));
 // Fork one: choose when to take the first optional Elite risk.
 const setElite=(realm,lane)=>{rows[realm-1][lane].kind='elite';};
 setElite(2,0);setElite(3,1);
 // Fork two: each path has one Event, with a different point in the segment.
 const setEvent=(realm,lane,groupIndex,slot)=>{const choices=plan.eventGroups[groupIndex];if(choices.length<4)throw Error('Each existing Event group must expose four choices');const eventId=choices[(slot+eventSalt)%choices.length];Object.assign(rows[realm-1][lane],{kind:'event',eventId,eventGroup:groupIndex});};
 if(plan.eventCount===3){
  const blockGroups=[order[0],order[1],order[2]],lateGroups=[order[1],order[2],order[0]],sharedGroup=order[3];
  for(let lane=0;lane<3;lane++){setEvent(6+lane,lane,blockGroups[lane],0);setEvent([14,13,13][lane],lane,lateGroups[lane],1);}
  setEvent(12,0,sharedGroup,2);
 }else{
  // With four Events, the two shared Events and both branch Events use four
  // distinct existing event groups along every complete route.
  const earlyGroups=[order[0],order[0],order[1]],lateGroups=[order[1],order[1],order[0]],middleGroup=order[2],optionalGroup=order[3];
  for(let lane=0;lane<3;lane++){
   setEvent(6+lane,lane,earlyGroups[lane],0);
   setEvent(lane===1?14:13,lane,lateGroups[lane],1);
  }
  setEvent(12,0,middleGroup,2);setEvent(5,0,optionalGroup,3);
 }
 // Fork three trades one or two existing Elite encounters against Combat.
 // The extra Elite route grants the game's existing Elite payouts and drop odds.
 setElite(10,0);setElite(11,0);setElite(11,1);setElite(10,2);
 rows[14][0].kind='boss';
 const edges=[];
 for(let realm=1;realm<REALMS;realm++)for(const from of rows[realm-1]){
  const next=rows[realm];let destinations;
  if(from.realm===1||from.realm===5||from.realm===9||from.realm===12)destinations=next.map(n=>n.lane);
  else if(next.length===1)destinations=[0];
  else destinations=[from.lane];
  for(const lane of new Set(destinations)){const target=next.find(n=>n.lane===lane);if(target)edges.push({from:from.id,to:target.id});}
 }
 const map={version:VERSION,seed,rows,nodes:rows.flat(),edges,segments:SEGMENTS.map(segment=>({decision:segment.decision,start:segment.start,end:segment.end,join:segment.join,role:segment.role,paths:Array.from({length:3},(_,lane)=>Array.from({length:segment.end-segment.start+1},(_,offset)=>`r${segment.start+offset}n${lane}`))})),eventCount:plan.eventCount,eventGroupOrder:order,generationKey:Math.floor(random()*4294967296),currentNodeId:null,chosenNodeIds:[],completedNodeIds:[],availableNodeIds:[rows[0][0].id],autoAdvance:true};
 validate(map,undefined,plan.eventGroups);return map;
}
function successors(map,id){return map.edges.filter(e=>e.from===id).map(e=>e.to);}
function node(map,id){return map.nodes.find(n=>n.id===id)||null;}
function walkPath(map,choices=[]){let current=map.rows[0][0],path=[current];for(let depth=0;depth<REALMS-1;depth++){const next=successors(map,current.id);if(!next.length)throw Error('Dead-end route');let pick=0;const decisionIndex=DECISION_REALMS.indexOf(node(map,next[0])?.realm);if(next.length>1){const which=choices[decisionIndex]??0;pick=Math.max(0,Math.min(next.length-1,which));}current=node(map,next[pick]);path.push(current);}return path;}
function allPaths(map){const paths=[];function visit(current,path){if(current.realm===REALMS){paths.push(path);return;}for(const id of successors(map,current.id))visit(node(map,id),[...path,node(map,id)]);}visit(map.rows[0][0],[map.rows[0][0]]);return paths;}
function canonicalPath(map){return walkPath(map,[0,0,1,0]);}
function calendar(map){return canonicalPath(map).map(n=>n.kind);}
function events(map){return canonicalPath(map).map(n=>n.eventId||null);}
function pathPreview(map,id){if(map.version!==VERSION)return null;const segment=map.segments.find(item=>item.paths.some(path=>path[0]===id));if(!segment)return null;const path=segment.paths.find(candidate=>candidate[0]===id);return {decision:segment.decision,start:segment.start,end:segment.end,join:segment.join,role:segment.role,nodes:path.map(nodeId=>node(map,nodeId)),joinNode:node(map,`r${segment.join}n0`)};}
function validateLegacy(map,rooms){
 if(!map||map.version!==LEGACY_VERSION||!Number.isSafeInteger(map.seed)||!Number.isSafeInteger(map.generationKey)||typeof map.autoAdvance!=='boolean'||!Array.isArray(map.rows)||map.rows.length!==REALMS||!Array.isArray(map.nodes)||!Array.isArray(map.edges))throw Error('Invalid legacy Expedition map version/shape');
 const ids=new Set(map.nodes.map(n=>n.id));if(ids.size!==41||map.rows.some((row,i)=>!Array.isArray(row)||row.length!==((i===0||i===14)?1:3)))throw Error('Invalid legacy Expedition map nodes');
 for(let i=0;i<REALMS;i++)for(let lane=0;lane<map.rows[i].length;lane++){const n=map.rows[i][lane];if(n.id!==`r${i+1}n${lane}`||n.realm!==i+1||n.lane!==lane||n.kind!==rooms?.[i])throw Error('Legacy map/calendar mismatch');}
 const inbound=new Map(map.nodes.map(n=>[n.id,0]));for(const edge of map.edges){const a=node(map,edge.from),b=node(map,edge.to);if(!a||!b||b.realm!==a.realm+1)throw Error('Invalid legacy map edge');inbound.set(b.id,inbound.get(b.id)+1);}if(map.nodes.some(n=>n.realm>1&&!inbound.get(n.id)))throw Error('Unreachable legacy map node');
 const reachable=new Set([map.rows[0][0].id]);for(const row of map.rows)for(const n of row)if(reachable.has(n.id))for(const id of successors(map,n.id))reachable.add(id);if(reachable.size!==ids.size||!reachable.has('r15n0'))throw Error('Legacy map cannot reach the boss');
 const backwards=new Set(['r15n0']);for(let i=13;i>=0;i--)for(const n of map.rows[i])if(successors(map,n.id).some(id=>backwards.has(id)))backwards.add(n.id);if(backwards.size!==ids.size)throw Error('Legacy map contains a dead end');
 return validateProgress(map,ids);
}
function validateProgress(map,ids){
 if(!Array.isArray(map.chosenNodeIds)||!Array.isArray(map.completedNodeIds)||!Array.isArray(map.availableNodeIds)||new Set(map.chosenNodeIds).size!==map.chosenNodeIds.length||new Set(map.completedNodeIds).size!==map.completedNodeIds.length||map.completedNodeIds.some((id,i)=>id!==map.chosenNodeIds[i])||map.chosenNodeIds.some(id=>!ids.has(id))||map.availableNodeIds.some(id=>!ids.has(id))||map.chosenNodeIds.length>REALMS||map.completedNodeIds.length>map.chosenNodeIds.length)throw Error('Invalid map progress');
 for(let i=1;i<map.chosenNodeIds.length;i++)if(!successors(map,map.chosenNodeIds[i-1]).includes(map.chosenNodeIds[i]))throw Error('Chosen nodes are not one connected route');
 if(map.currentNodeId!==(map.chosenNodeIds.at(-1)||null))throw Error('Invalid current map node');
 const inProgress=!!map.currentNodeId&&map.chosenNodeIds.length>map.completedNodeIds.length;
 const allowed=inProgress?[]:map.currentNodeId?successors(map,map.currentNodeId):[map.rows[0][0].id];
 if(new Set(map.availableNodeIds).size!==map.availableNodeIds.length||JSON.stringify([...map.availableNodeIds].sort())!==JSON.stringify([...allowed].sort()))throw Error('Invalid available map path');
 return true;
}
function validate(map,rooms,eventGroups){
 if(map?.version===LEGACY_VERSION)return validateLegacy(map,rooms);
 if(!map||map.version!==VERSION||!Number.isSafeInteger(map.seed)||!Number.isSafeInteger(map.generationKey)||typeof map.autoAdvance!=='boolean'||!Array.isArray(map.rows)||map.rows.length!==REALMS||!Array.isArray(map.nodes)||!Array.isArray(map.edges)||!Array.isArray(map.segments)||map.segments.length!==4||![3,4].includes(map.eventCount)||!Array.isArray(map.eventGroupOrder)||map.eventGroupOrder.length!==4||new Set(map.eventGroupOrder).size!==4||!map.eventGroupOrder.every(i=>Number.isInteger(i)&&i>=0&&i<4))throw Error('Invalid route map version/shape');
 if(map.rows.some((row,i)=>!Array.isArray(row)||row.length!==ROW_WIDTHS[i]))throw Error('Invalid route map row width');
 const ids=new Set(map.nodes.map(n=>n.id));if(ids.size!==35)throw Error('Invalid route map node count');
 for(let i=0;i<REALMS;i++)for(let lane=0;lane<ROW_WIDTHS[i];lane++){const n=map.rows[i][lane];if(n.id!==`r${i+1}n${lane}`||n.realm!==i+1||n.lane!==lane||!['combat','elite','event','boss'].includes(n.kind)||(n.kind==='boss')!==(n.realm===15)||(n.kind==='event'?!Number.isInteger(n.eventGroup)||!eventGroups?.[n.eventGroup]?.includes(n.eventId):n.eventId!==null||n.eventGroup!==null))throw Error('Invalid route node/calendar');}
 const expected=SEGMENTS;for(let i=0;i<4;i++){const s=map.segments[i],e=expected[i];if(s.decision!==e.decision||s.start!==e.start||s.end!==e.end||s.join!==e.join||s.role!==e.role||!Array.isArray(s.paths)||s.paths.length!==3||s.paths.some((p,lane)=>JSON.stringify(p)!==JSON.stringify(Array.from({length:e.end-e.start+1},(_,offset)=>`r${e.start+offset}n${lane}`))))throw Error('Invalid route segment');}
 const expectedEdges=[];for(let realm=1;realm<REALMS;realm++)for(const from of map.rows[realm-1]){const next=map.rows[realm],destinations=[1,5,9,12].includes(from.realm)?next.map(n=>n.lane):next.length===1?[0]:[from.lane];for(const lane of new Set(destinations)){const target=next.find(n=>n.lane===lane);if(target)expectedEdges.push(from.id+'>'+target.id);}}
 const actualEdges=map.edges.map(e=>{if(!node(map,e.from)||!node(map,e.to)||node(map,e.to).realm!==node(map,e.from).realm+1)throw Error('Invalid route edge');return e.from+'>'+e.to;});if(new Set(actualEdges).size!==actualEdges.length||JSON.stringify([...actualEdges].sort())!==JSON.stringify(expectedEdges.sort()))throw Error('Route edge topology changed');
 const paths=allPaths(map);if(paths.length!==81||paths.some(path=>path.length!==REALMS||path[14].kind!=='boss'||path.filter(n=>n.kind==='elite').length<1||path.filter(n=>n.kind==='elite').length>3||path.filter(n=>n.kind==='event').length!==map.eventCount||new Set(path.filter(n=>n.kind==='event').map(n=>n.eventId)).size!==map.eventCount))throw Error('Route calendar/economy distribution invalid');
 const eliteCounts=paths.map(path=>path.filter(n=>n.kind==='elite').length);if(eliteCounts.reduce((sum,count)=>sum+count,0)!==paths.length*2)throw Error('Mean Elite count must preserve the existing two-Elite expedition distribution');
 const lanePatterns=map.segments.map(segment=>segment.paths.map(path=>path.map(id=>node(map,id).kind+':'+(node(map,id).eventId||'')).join('|')));if(lanePatterns.some(patterns=>new Set(patterns).size!==3))throw Error('Route fork choices are not all meaningfully distinct');
 return validateProgress(map,ids);
}
function choose(map,id){if(!map.availableNodeIds.includes(id)||map.chosenNodeIds.includes(id))return false;map.currentNodeId=id;map.chosenNodeIds.push(id);map.availableNodeIds=[];return true;}
function complete(map,id){if(map.currentNodeId!==id||map.completedNodeIds.includes(id))return false;map.completedNodeIds.push(id);map.availableNodeIds=successors(map,id);return true;}
function status(map,id){if(map.completedNodeIds.includes(id))return'completed';if(map.currentNodeId===id&&map.completedNodeIds.length<map.chosenNodeIds.length)return'selected';if(map.availableNodeIds.includes(id))return'available';return'locked';}
root.WandererV013ExpeditionMap=Object.freeze({VERSION,LEGACY_VERSION,REALMS,DECISION_REALMS,SEGMENTS,rng,shuffle,create,successors,walkPath,allPaths,canonicalPath,calendar,events,pathPreview,validate,choose,complete,node,status});
})(globalThis);
