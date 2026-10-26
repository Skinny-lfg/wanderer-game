/* Deterministic, versioned Expedition route graphs. */
(function(root){'use strict';
const VERSION=3,PREVIOUS_VERSION=2,LEGACY_VERSION=1,REALMS=15,DECISION_REALMS_V2=[2,6,10,13];
const ROW_WIDTHS_V2=[1,3,3,3,1,3,3,3,1,3,3,1,3,3,1];
const SEGMENTS_V2=Object.freeze([
 Object.freeze({decision:1,start:2,end:4,join:5,role:'elite'}),
 Object.freeze({decision:2,start:6,end:8,join:9,role:'event'}),
 Object.freeze({decision:3,start:10,end:11,join:12,role:'elite'}),
 Object.freeze({decision:4,start:13,end:14,join:15,role:'event'})
]);
// Each entry is a different macro route, not a position variant of one graph.
// A segment has `width` parallel encounters from start..end, then merges at join.
const TOPOLOGIES=Object.freeze([
 {id:'crossroads',segments:[[2,3,3],[5,6,3],[8,9,3],[11,12,3]]},
 {id:'staggered-trails',segments:[[2,4,2],[6,7,3],[9,11,2],[13,14,3]]},
 {id:'long-outer-routes',segments:[[3,5,3],[7,9,2],[11,12,3]]},
 {id:'split-and-rejoin',segments:[[2,3,3],[5,6,2],[8,10,3],[12,13,2]]},
 {id:'late-convergence',segments:[[2,3,2],[5,7,3],[9,10,2],[12,14,3]]},
 {id:'narrow-passages',segments:[[3,5,2],[7,8,3],[10,12,2]]},
 {id:'braided-approach',segments:[[2,4,3],[6,7,2],[9,11,3],[13,14,2]]},
 {id:'deep-detours',segments:[[3,6,3],[8,10,2],[12,14,3]]},
 {id:'scattered-crossings',segments:[[2,3,2],[5,8,3],[10,11,2],[13,14,3]]}
].map(t=>Object.freeze({...t,segments:Object.freeze(t.segments.map(([start,end,width],i)=>Object.freeze({decision:i+1,start,end,width,join:end+1,role:'route'})))})));
function rng(seed){if(!Number.isSafeInteger(seed)||seed<0||seed>4294967295)throw Error('Invalid map seed');let s=seed>>>0;return()=>{s=(s+0x6d2b79f5)|0;let x=Math.imul(s^(s>>>15),1|s);x^=x+Math.imul(x^(x>>>7),61|x);return((x^(x>>>14))>>>0)/4294967296;};}
function shuffle(values,random){const out=[...values];for(let i=out.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}
function topologyForSeed(seed){const random=rng(seed);return TOPOLOGIES[Math.floor(random()*TOPOLOGIES.length)];}
function rowsFor(topology){const widths=Array(REALMS).fill(1);for(const segment of topology.segments)for(let realm=segment.start;realm<=segment.end;realm++)widths[realm-1]=segment.width;return widths.map((count,i)=>Array.from({length:count},(_,lane)=>({id:`r${i+1}n${lane}`,realm:i+1,lane,kind:i===14?'boss':'combat',eventId:null,eventGroup:null})));}
function makeSegments(topology){return topology.segments.map(segment=>({...segment,paths:Array.from({length:segment.width},(_,lane)=>Array.from({length:segment.end-segment.start+1},(_,offset)=>`r${segment.start+offset}n${lane}`))}));}
function makeEdges(rows){const edges=[];for(let realm=1;realm<REALMS;realm++){const from=rows[realm-1],to=rows[realm];for(const source of from){const destinations=from.length===1||to.length===1||from.length!==to.length?to:[to[source.lane]].filter(Boolean);for(const target of destinations)edges.push({from:source.id,to:target.id});}}return edges;}
function assignCalendar(map,plan,random,order){
 const segments=map.segments,eligibleRisk=segments.filter(segment=>segment.end>segment.start);if(!eligibleRisk.length)throw Error('Topology requires a multi-Realm route for a meaningful risk choice');
 const riskSegment=eligibleRisk[Math.floor(random()*eligibleRisk.length)];
 const guaranteedNodes=map.rows.flat().filter(node=>node.realm>1&&node.realm<REALMS&&map.rows[node.realm-1].length===1);if(!guaranteedNodes.length)throw Error('Topology needs a shared encounter before the boss');
 const guaranteed=guaranteedNodes[Math.floor(random()*guaranteedNodes.length)];guaranteed.kind='elite';
 const riskScores=riskSegment.width===3?[0,1,2]:[0,2],riskRealmSets=[];
 for(let lane=0;lane<riskSegment.width;lane++){const count=riskScores[lane],realms=shuffle(Array.from({length:riskSegment.end-riskSegment.start+1},(_,i)=>riskSegment.start+i),random).slice(0,count);riskRealmSets[lane]=new Set(realms);for(const realm of realms)map.rows[realm-1][lane].kind='elite';}
 const riskPath=riskRealmSets.findIndex(set=>set.size===Math.max(...riskScores));map.riskRealm=[...riskRealmSets[riskPath]][0]||riskSegment.start;
 const eventSegments=segments.filter(segment=>segment.decision!==riskSegment.decision);
 const singletonBlocks=map.rows.flat().filter(node=>node.realm>1&&node.realm<REALMS&&map.rows[node.realm-1].length===1&&node.id!==guaranteed.id).map(node=>({type:'single',realm:node.realm,nodeIds:[node.id]}));
 const slots=eventSegments.map(segment=>({type:'segment',start:segment.start,segment,nodeIds:segment.paths.map(path=>path[0])}));
 const eventCountFromSegments=slots.length,extra=plan.eventCount-eventCountFromSegments;
 if(extra>singletonBlocks.length)throw Error('Topology has too few distinct Event slots');
 slots.push(...shuffle(singletonBlocks,random).slice(0,extra));
 if(slots.length!==plan.eventCount)throw Error('Topology Event slot count does not match its plan');
 const eventOrder=shuffle(slots,random),eventSalt=Math.floor(random()*4);
 eventOrder.forEach((slot,index)=>{
  const groupIndex=order[index],choices=plan.eventGroups[groupIndex];if(!choices||choices.length<3)throw Error('Each existing Event group must expose at least three choices');
  if(slot.type==='single'){
   const node=map.nodes.find(n=>n.id===slot.nodeIds[0]);Object.assign(node,{kind:'event',eventGroup:groupIndex,eventId:choices[(eventSalt+index)%choices.length]});return;
  }
  const segment=slot.segment,length=segment.end-segment.start+1,offset=Math.floor(random()*length);
  for(let lane=0;lane<segment.width;lane++){
   const node=map.rows[segment.start+offset-1][lane];
   Object.assign(node,{kind:'event',eventGroup:groupIndex,eventId:choices[(eventSalt+index+lane)%choices.length]});
  }
 });
 map.riskDecision=riskSegment.decision;map.riskLaneScores=riskScores;map.guaranteedEliteNodeId=guaranteed.id;
}
function create(seed,plan){
 if(!plan||![3,4].includes(plan.eventCount)||!Array.isArray(plan.eventGroups)||plan.eventGroups.length!==4||plan.eventGroups.some(group=>!Array.isArray(group)||group.length<3||group.some(id=>typeof id!=='string'||!id)))throw Error('Invalid route event plan');
 const random=rng(seed),topology=TOPOLOGIES[Math.floor(random()*TOPOLOGIES.length)],order=shuffle([0,1,2,3],random),rows=rowsFor(topology);
 const map={version:VERSION,seed,topologyId:topology.id,rows,nodes:rows.flat(),edges:makeEdges(rows),segments:makeSegments(topology),eventCount:plan.eventCount,eventGroupOrder:order,generationKey:Math.floor(random()*4294967296),currentNodeId:null,chosenNodeIds:[],completedNodeIds:[],availableNodeIds:[rows[0][0].id],autoAdvance:true};
 assignCalendar(map,plan,random,order);validate(map,undefined,plan.eventGroups);return map;
}
function successors(map,id){return map.edges.filter(e=>e.from===id).map(e=>e.to);}
function node(map,id){return map.nodes.find(n=>n.id===id)||null;}
function walkPath(map,choices=[]){let current=map.rows[0][0],path=[current],decision=0;for(let depth=0;depth<REALMS-1;depth++){const next=successors(map,current.id);if(!next.length)throw Error('Dead-end route');let pick=0;if(next.length>1){const realm=node(map,next[0])?.realm,segment=map.segments?.find(item=>item.start===realm);pick=Math.max(0,Math.min(next.length-1,choices[segment?segment.decision-1:decision]??0));decision++;}current=node(map,next[pick]);path.push(current);}return path;}
function allPaths(map){const paths=[];function visit(current,path){if(current.realm===REALMS){paths.push(path);return;}for(const id of successors(map,current.id))visit(node(map,id),[...path,node(map,id)]);}visit(map.rows[0][0],[map.rows[0][0]]);return paths;}
function canonicalPath(map){if(map.version===PREVIOUS_VERSION)return walkPath(map,[0,0,1,0]);if(map.version===VERSION){const choices=Array(map.segments.length).fill(0),risk=map.segments.find(s=>s.decision===map.riskDecision);choices[risk.decision-1]=risk.width===3?1:1;return walkPath(map,choices);}return walkPath(map,[]);}
function calendar(map){return canonicalPath(map).map(n=>n.kind);}
function events(map){return canonicalPath(map).map(n=>n.eventId||null);}
function pathPreview(map,id){if(!isStructuredMap(map))return null;const segment=map.segments.find(item=>item.paths.some(path=>path[0]===id));if(!segment)return null;const path=segment.paths.find(candidate=>candidate[0]===id);return {decision:segment.decision,start:segment.start,end:segment.end,join:segment.join,role:segment.role,nodes:path.map(nodeId=>node(map,nodeId)),joinNode:node(map,`r${segment.join}n0`)};}
function isStructuredMap(map){return map?.version===PREVIOUS_VERSION||map?.version===VERSION;}
function validateLegacy(map,rooms){
 if(!map||map.version!==LEGACY_VERSION||!Number.isSafeInteger(map.seed)||!Number.isSafeInteger(map.generationKey)||typeof map.autoAdvance!=='boolean'||!Array.isArray(map.rows)||map.rows.length!==REALMS||!Array.isArray(map.nodes)||!Array.isArray(map.edges))throw Error('Invalid legacy Expedition map version/shape');
 const ids=new Set(map.nodes.map(n=>n.id));if(ids.size!==41||map.rows.some((row,i)=>!Array.isArray(row)||row.length!==((i===0||i===14)?1:3)))throw Error('Invalid legacy map nodes');
 for(let i=0;i<REALMS;i++)for(let lane=0;lane<map.rows[i].length;lane++){const n=map.rows[i][lane];if(n.id!==`r${i+1}n${lane}`||n.realm!==i+1||n.lane!==lane||n.kind!==rooms?.[i])throw Error('Legacy map/calendar mismatch');}
 const idsByNode=new Set(map.nodes.map(n=>n.id));for(const edge of map.edges){const a=node(map,edge.from),b=node(map,edge.to);if(!a||!b||b.realm!==a.realm+1)throw Error('Invalid legacy map edge');}
 const reachable=reachableNodes(map),backwards=backwardReachable(map);if(reachable.size!==idsByNode.size||!reachable.has('r15n0')||backwards.size!==idsByNode.size)throw Error('Legacy map cannot complete every route');return validateProgress(map,idsByNode);
}
function reachableNodes(map){const reached=new Set([map.rows[0][0].id]);for(const row of map.rows)for(const n of row)if(reached.has(n.id))for(const id of successors(map,n.id))reached.add(id);return reached;}
function backwardReachable(map){const reached=new Set(map.rows[14].map(n=>n.id));for(let i=13;i>=0;i--)for(const n of map.rows[i])if(successors(map,n.id).some(id=>reached.has(id)))reached.add(n.id);return reached;}
function validateProgress(map,ids){
 if(!Array.isArray(map.chosenNodeIds)||!Array.isArray(map.completedNodeIds)||!Array.isArray(map.availableNodeIds)||new Set(map.chosenNodeIds).size!==map.chosenNodeIds.length||new Set(map.completedNodeIds).size!==map.completedNodeIds.length||map.completedNodeIds.some((id,i)=>id!==map.chosenNodeIds[i])||map.chosenNodeIds.some(id=>!ids.has(id))||map.availableNodeIds.some(id=>!ids.has(id))||map.chosenNodeIds.length>REALMS||map.completedNodeIds.length>map.chosenNodeIds.length)throw Error('Invalid map progress');
 for(let i=1;i<map.chosenNodeIds.length;i++)if(!successors(map,map.chosenNodeIds[i-1]).includes(map.chosenNodeIds[i]))throw Error('Chosen nodes are not one connected route');
 if(map.currentNodeId!==(map.chosenNodeIds.at(-1)||null))throw Error('Invalid current map node');
 const inProgress=!!map.currentNodeId&&map.chosenNodeIds.length>map.completedNodeIds.length,allowed=inProgress?[]:map.currentNodeId?successors(map,map.currentNodeId):[map.rows[0][0].id];
 if(new Set(map.availableNodeIds).size!==map.availableNodeIds.length||JSON.stringify([...map.availableNodeIds].sort())!==JSON.stringify([...allowed].sort()))throw Error('Invalid available map path');return true;
}
function validateV2(map,rooms,eventGroups){
 if(!map||map.version!==PREVIOUS_VERSION||!Number.isSafeInteger(map.seed)||!Number.isSafeInteger(map.generationKey)||typeof map.autoAdvance!=='boolean'||!Array.isArray(map.rows)||map.rows.length!==REALMS||!Array.isArray(map.nodes)||!Array.isArray(map.edges)||!Array.isArray(map.segments)||map.segments.length!==4||![3,4].includes(map.eventCount)||!Array.isArray(map.eventGroupOrder)||map.eventGroupOrder.length!==4||new Set(map.eventGroupOrder).size!==4||!map.eventGroupOrder.every(i=>Number.isInteger(i)&&i>=0&&i<4))throw Error('Invalid v2 route map version/shape');
 if(map.rows.some((row,i)=>!Array.isArray(row)||row.length!==ROW_WIDTHS_V2[i]))throw Error('Invalid v2 route map row width');const ids=new Set(map.nodes.map(n=>n.id));if(ids.size!==35)throw Error('Invalid v2 route map node count');
 for(let i=0;i<REALMS;i++)for(let lane=0;lane<ROW_WIDTHS_V2[i];lane++){const n=map.rows[i][lane];if(n.id!==`r${i+1}n${lane}`||n.realm!==i+1||n.lane!==lane||!['combat','elite','event','boss'].includes(n.kind)||(n.kind==='boss')!==(n.realm===15)||(n.kind==='event'?!Number.isInteger(n.eventGroup)||!eventGroups?.[n.eventGroup]?.includes(n.eventId):n.eventId!==null||n.eventGroup!==null))throw Error('Invalid v2 route node/calendar');}
 for(let i=0;i<4;i++){const s=map.segments[i],e=SEGMENTS_V2[i];if(s.decision!==e.decision||s.start!==e.start||s.end!==e.end||s.join!==e.join||s.role!==e.role||!Array.isArray(s.paths)||s.paths.length!==3||s.paths.some((p,lane)=>JSON.stringify(p)!==JSON.stringify(Array.from({length:e.end-e.start+1},(_,offset)=>`r${e.start+offset}n${lane}`))))throw Error('Invalid v2 route segment');}
 const expectedEdges=makeEdges(map.rows).map(e=>e.from+'>'+e.to),actualEdges=map.edges.map(e=>{if(!node(map,e.from)||!node(map,e.to)||node(map,e.to).realm!==node(map,e.from).realm+1)throw Error('Invalid v2 route edge');return e.from+'>'+e.to;});if(new Set(actualEdges).size!==actualEdges.length||JSON.stringify([...actualEdges].sort())!==JSON.stringify([...expectedEdges].sort()))throw Error('Invalid v2 route edge topology');
 const paths=allPaths(map);if(paths.length!==81||paths.some(path=>path.length!==REALMS||path[14].kind!=='boss'||path.filter(n=>n.kind==='elite').length<1||path.filter(n=>n.kind==='elite').length>3||path.filter(n=>n.kind==='event').length!==map.eventCount||new Set(path.filter(n=>n.kind==='event').map(n=>n.eventId)).size!==map.eventCount))throw Error('Invalid v2 route calendar/economy distribution');
 if(paths.reduce((sum,path)=>sum+path.filter(n=>n.kind==='elite').length,0)!==paths.length*2)throw Error('V2 mean Elite count changed');const signatures=map.segments.map(segment=>segment.paths.map(path=>path.map(id=>{const n=node(map,id);return n.kind+':'+(n.eventId||'');}).join('|')));if(signatures.some(patterns=>new Set(patterns).size!==3))throw Error('V2 route options are not meaningfully distinct');
 if(rooms&&(JSON.stringify(rooms)!==JSON.stringify(calendar(map))))throw Error('V2 canonical schedule mismatch');return validateProgress(map,ids);
}
function validateV3(map,eventGroups){
 if(!map||map.version!==VERSION||!Number.isSafeInteger(map.seed)||!Number.isSafeInteger(map.generationKey)||typeof map.autoAdvance!=='boolean'||typeof map.topologyId!=='string'||!Array.isArray(map.rows)||map.rows.length!==REALMS||!Array.isArray(map.nodes)||!Array.isArray(map.edges)||!Array.isArray(map.segments)||map.segments.length<3||map.segments.length>4||![3,4].includes(map.eventCount)||!Array.isArray(map.eventGroupOrder)||map.eventGroupOrder.length!==4||new Set(map.eventGroupOrder).size!==4||!map.eventGroupOrder.every(i=>Number.isInteger(i)&&i>=0&&i<4))throw Error('Invalid v3 route map version/shape');
 const topology=TOPOLOGIES.find(t=>t.id===map.topologyId);if(!topology||topologyForSeed(map.seed).id!==topology.id)throw Error('Route topology does not match its deterministic seed');const expectedRows=rowsFor(topology),expectedSegments=makeSegments(topology);
 if(map.rows.some((row,i)=>!Array.isArray(row)||row.length!==expectedRows[i].length)||map.nodes.length!==expectedRows.reduce((sum,row)=>sum+row.length,0))throw Error('Invalid v3 route topology rows');
 const ids=new Set(map.nodes.map(n=>n.id)),nodesById=new Map(map.nodes.map(n=>[n.id,n]));if(ids.size!==map.nodes.length)throw Error('Duplicate v3 route node');
 for(let i=0;i<REALMS;i++)for(let lane=0;lane<expectedRows[i].length;lane++){const n=map.rows[i][lane],listed=nodesById.get(n.id);if(n.id!==`r${i+1}n${lane}`||n.realm!==i+1||n.lane!==lane||!['combat','elite','event','boss'].includes(n.kind)||(n.kind==='boss')!==(n.realm===15)||(n.kind==='event'?!Number.isInteger(n.eventGroup)||!eventGroups?.[n.eventGroup]?.includes(n.eventId):n.eventId!==null||n.eventGroup!==null)||!listed||listed.realm!==n.realm||listed.lane!==n.lane||listed.kind!==n.kind||listed.eventId!==n.eventId||listed.eventGroup!==n.eventGroup)throw Error('Invalid v3 route node/calendar');}
 if(map.segments.length!==expectedSegments.length||map.segments.some((s,i)=>{const e=expectedSegments[i];return s.decision!==e.decision||s.start!==e.start||s.end!==e.end||s.join!==e.join||s.width!==e.width||!Array.isArray(s.paths)||JSON.stringify(s.paths)!==JSON.stringify(e.paths);}))throw Error('Invalid v3 route segments');
 const expectedEdges=makeEdges(expectedRows).map(e=>e.from+'>'+e.to),actualEdges=map.edges.map(e=>{if(!node(map,e.from)||!node(map,e.to)||node(map,e.to).realm!==node(map,e.from).realm+1)throw Error('Invalid v3 route edge');return e.from+'>'+e.to;});if(new Set(actualEdges).size!==actualEdges.length||JSON.stringify([...actualEdges].sort())!==JSON.stringify([...expectedEdges].sort()))throw Error('Invalid v3 route topology edges');
 if(!Number.isInteger(map.riskDecision)||!Number.isInteger(map.riskRealm)||!Array.isArray(map.riskLaneScores)||!map.guaranteedEliteNodeId||!ids.has(map.guaranteedEliteNodeId))throw Error('Missing v3 risk schedule metadata');const riskSegment=map.segments.find(s=>s.decision===map.riskDecision),expectedRiskScores=riskSegment?.width===3?[0,1,2]:[0,2],highRiskLane=expectedRiskScores.indexOf(Math.max(...expectedRiskScores));if(!riskSegment||riskSegment.end===riskSegment.start||map.riskRealm<riskSegment.start||map.riskRealm>riskSegment.end||JSON.stringify(map.riskLaneScores)!==JSON.stringify(expectedRiskScores)||node(map,map.guaranteedEliteNodeId)?.kind!=='elite'||map.rows[node(map,map.guaranteedEliteNodeId).realm-1].length!==1||node(map,riskSegment.paths[highRiskLane].find(id=>node(map,id).realm===map.riskRealm))?.kind!=='elite')throw Error('Invalid v3 Elite schedule');for(let lane=0;lane<riskSegment.width;lane++)if(riskSegment.paths[lane].filter(id=>node(map,id)?.kind==='elite').length!==expectedRiskScores[lane])throw Error('Invalid v3 route risk by lane');
 const paths=allPaths(map),pathCount=paths.length,expectedPathCount=map.segments.reduce((count,segment)=>count*segment.width,1);if(pathCount!==expectedPathCount)throw Error('Invalid route path count');
 if(paths.some(path=>path.length!==REALMS||path[14].kind!=='boss'||path.filter(n=>n.kind==='elite').length<1||path.filter(n=>n.kind==='elite').length>3||path.filter(n=>n.kind==='event').length!==map.eventCount||new Set(path.filter(n=>n.kind==='event').map(n=>n.eventId)).size!==map.eventCount||!path.some(n=>n.id===map.guaranteedEliteNodeId)))throw Error('Invalid v3 route calendar/economy distribution');
 const eliteTotal=paths.reduce((sum,path)=>sum+path.filter(n=>n.kind==='elite').length,0);if(eliteTotal!==paths.length*2)throw Error('Mean v3 Elite count must preserve the two-Elite Expedition budget');
 const lanePatterns=map.segments.map(segment=>segment.paths.map(path=>path.map(id=>{const n=node(map,id);return n.kind+':'+(n.eventId||'');}).join('|')));if(lanePatterns.some(patterns=>new Set(patterns).size!==patterns.length))throw Error('Route fork choices are not meaningfully distinct');
 const riskCounts=paths.map(path=>path.filter(n=>n.kind==='elite'&&n.realm>=riskSegment.start&&n.realm<=riskSegment.end).length);if(riskCounts.reduce((sum,count)=>sum+count,0)!==paths.length)throw Error('Risk route premium is not balanced');
 const reachable=reachableNodes(map),backwards=backwardReachable(map);if(reachable.size!==ids.size||backwards.size!==ids.size||!backwards.has(map.rows[0][0].id))throw Error('V3 topology contains an inaccessible node or dead end');
 return validateProgress(map,ids);
}
function validate(map,rooms,eventGroups){if(map?.version===LEGACY_VERSION)return validateLegacy(map,rooms);if(map?.version===PREVIOUS_VERSION)return validateV2(map,rooms,eventGroups);if(map?.version===VERSION)return validateV3(map,eventGroups);throw Error('Unsupported Expedition map version');}
function choose(map,id){if(!map.availableNodeIds.includes(id)||map.chosenNodeIds.includes(id))return false;map.currentNodeId=id;map.chosenNodeIds.push(id);map.availableNodeIds=[];return true;}
function complete(map,id){if(map.currentNodeId!==id||map.completedNodeIds.includes(id))return false;map.completedNodeIds.push(id);map.availableNodeIds=successors(map,id);return true;}
function status(map,id){if(map.completedNodeIds.includes(id))return'completed';if(map.currentNodeId===id&&map.completedNodeIds.length<map.chosenNodeIds.length)return'selected';if(map.availableNodeIds.includes(id))return'available';return'locked';}
root.WandererV013ExpeditionMap=Object.freeze({VERSION,PREVIOUS_VERSION,LEGACY_VERSION,REALMS,DECISION_REALMS:DECISION_REALMS_V2,SEGMENTS:SEGMENTS_V2,TOPOLOGIES,rng,shuffle,create,successors,node,walkPath,allPaths,canonicalPath,calendar,events,pathPreview,isStructuredMap,validate,choose,complete,status});
})(globalThis);
