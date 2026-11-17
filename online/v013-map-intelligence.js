// Wanderer v0.13 Stage 1: pure map intelligence; no changes to the map generator or combat.
(function(root){'use strict';
function secretEdge(card,a,b){return Number.isInteger(card?.shortcut)&&((a===card.shortcut&&b===a+1)||(b===card.shortcut&&a===b+1));}
function edgeId(a,b){return Math.min(a,b)+'-'+Math.max(a,b);}
function unlocked(card,d,a,b){return !secretEdge(card,a,b)||Array.isArray(d?.discoveredSecrets)&&d.discoveredSecrets.includes(edgeId(a,b))||Array.isArray(d?.visited)&&d.visited.includes(card.shortcut+1);}
function neighbors(card,d,id){const found=new Set();for(const [a,b] of card.edges||[]){if(!unlocked(card,d,a,b))continue;if(a===id)found.add(b);else if(b===id)found.add(a);}return [...found].sort((a,b)=>a-b);}
function exitCount(card,d,id){if(!Number.isInteger(id)||id<0||id>=card.nodes.length)throw Error('Invalid room');return neighbors(card,d,id).length;}
// Preserve legacy travelCost exactly: a continuous series of cleared rooms costs at most 2 steps.
function travelCost(path,cleared){if(!Array.isArray(path)||!path.length)return Infinity;const safe=new Set(cleared||[]);let total=0,run=0;for(const room of path.slice(1)){if(safe.has(room))run++;else{total+=Math.min(2,run)+1;run=0;}}return total+Math.min(2,run);}
function route(card,d,target){
 if(!card||!d||!Number.isInteger(target)||target<0||target>=card.nodes.length)return [];
 const visited=new Set(d.visited||[]),cleared=new Set(d.cleared||[]),origin=d.current;
 if(!visited.has(origin))return [];
 if(target===origin)return [origin];
 // Dijkstra on (room, streak-of-cleared-rooms), rather than unweighted BFS. Intermediate rooms
 // must already have been visited; only the destination may be new.
 const pending=[{node:origin,streak:0,cost:0,path:[origin]}],best=new Map([[origin+'|0',0]]);
 let solution=null;
 while(pending.length){
  pending.sort((a,b)=>a.cost-b.cost||a.path.length-b.path.length);
  const current=pending.shift();if(current.cost!==best.get(current.node+'|'+current.streak))continue;
  if(solution&&current.cost>solution.cost)break;
  if(current.node===target){const cost=current.cost+current.streak;
   if(!solution||cost<solution.cost||cost===solution.cost&&current.path.length<solution.path.length)solution={cost,path:current.path};
   continue;
  }
  if(!visited.has(current.node))continue;
  for(const next of neighbors(card,d,current.node)){
   if(!visited.has(next)&&next!==target)continue;
   // Avoid looping through old nodes for free when the cleared-run cap has been reached.
   if(current.path.includes(next))continue;
   const safe=cleared.has(next),streak=safe?Math.min(2,current.streak+1):0;
   const cost=current.cost+(safe?0:current.streak+1),key=next+'|'+streak;
   if(cost>=(best.get(key)??Infinity))continue;
   best.set(key,cost);pending.push({node:next,streak,cost,path:[...current.path,next]});
  }
 }
 return solution?.path||[];
}
function scout(card,d,amount=2){
 if(!Number.isInteger(amount)||amount<0||amount>5)throw Error('Invalid scouting limit');
 const seen=new Set([d.current]),distance=new Map([[d.current,0]]),queue=[d.current];
 for(const room of queue){const depth=distance.get(room);if(depth>=3)continue;for(const next of neighbors(card,d,room))if(!seen.has(next)){seen.add(next);distance.set(next,depth+1);queue.push(next);}}
 const known=new Set([...(d.visited||[]),...(d.scouted||[])]);
 const candidates=[...distance.keys()].filter(id=>!known.has(id));
 candidates.sort((a,b)=>{
  const aAccessible=route(card,d,a).length>0,bAccessible=route(card,d,b).length>0;
  return Number(aAccessible)-Number(bAccessible)||distance.get(a)-distance.get(b)||a-b;
 });
 const scouted=candidates.slice(0,amount);
 // A known secret should never be included in an unknown room's exit count. A nearby
 // secret may be discovered by the Oracle, but only when its actual origin is nearby.
 const shortcut=card.shortcut,secret=Number.isInteger(shortcut)&&distance.has(shortcut)&&distance.get(shortcut)<=2&&!unlocked(card,d,shortcut,shortcut+1)?edgeId(shortcut,shortcut+1):null;
 return {rooms:scouted,secret};
}
const API=Object.freeze({secretEdge,edgeId,unlocked,neighbors,exitCount,travelCost,route,scout});
root.WandererV013MapIntelligence=API;
if(typeof module==='object'&&module.exports)module.exports=API;
})(globalThis);
