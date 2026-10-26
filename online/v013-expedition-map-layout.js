/* Seeded presentation-only coordinates for the current Expedition graph. */
(function(root){'use strict';
const WIDTH=1000,MIN_X=160,MAX_X=840,MIN_GAP=205,MAX_LANE_GAP=230;
function hash(seed,id){let value=(seed^0x9e3779b9)>>>0;for(const char of id)value=Math.imul(value^char.charCodeAt(0),0x45d9f3b)>>>0;value^=value>>>16;value=Math.imul(value,0x45d9f3b)>>>0;value^=value>>>16;return value/4294967295;}
function clamp(value,min,max){return Math.max(min,Math.min(max,value));}
function smoothPath(a,b){const dy=b.y-a.y,control=dy*.46;return `M ${a.x} ${a.y} C ${a.x} ${a.y+control} ${b.x} ${b.y-control} ${b.x} ${b.y}`;}
function separate(values){
 const sorted=[...values].sort((a,b)=>a.node.lane-b.node.lane),gap=MIN_GAP;
 for(let i=0;i<sorted.length;i++)sorted[i].value=clamp(sorted[i].value,MIN_X,MAX_X);
 for(let i=1;i<sorted.length;i++)sorted[i].value=Math.max(sorted[i].value,sorted[i-1].value+gap);
 if(sorted.at(-1).value>MAX_X){const shift=sorted.at(-1).value-MAX_X;for(const item of sorted)item.value-=shift;}
 for(let i=sorted.length-2;i>=0;i--)sorted[i].value=Math.min(sorted[i].value,sorted[i+1].value-gap);
 if(sorted[0].value<MIN_X){const shift=MIN_X-sorted[0].value;for(const item of sorted)item.value+=shift;}
 return sorted;
}
function laneCenters(count){if(count===1)return[WIDTH/2];const gap=Math.min(MAX_LANE_GAP,(MAX_X-MIN_X)/(count-1)),start=WIDTH/2-gap*(count-1)/2;return Array.from({length:count},(_,index)=>start+gap*index);}
function layout(map,{rowHeight=44}={}){
 if(!map||!Array.isArray(map.rows)||!Array.isArray(map.nodes)||!Array.isArray(map.edges)||!Number.isFinite(rowHeight)||rowHeight<44)throw Error('Invalid route graph for visual layout');
 const rowTops=[],positions=Object.create(null);let height=0;
 for(let rowIndex=0;rowIndex<map.rows.length;rowIndex++){
  const row=map.rows[rowIndex],top=height;rowTops.push(top);height+=rowHeight;
  const rowDrift=(hash(map.seed,'row-'+rowIndex)-.5)*130,centers=laneCenters(row.length);
  const targets=row.map(node=>{
   const incoming=map.edges.filter(edge=>edge.to===node.id).map(edge=>positions[edge.from]?.x).filter(Number.isFinite),from=incoming.length?incoming.reduce((sum,x)=>sum+x,0)/incoming.length:WIDTH/2;
   let target;
   if(row.length===1){target=node.realm===15?WIDTH/2:from+(hash(map.seed,node.id)-.5)*130;target=target*.42+from*.58;}
   else{const center=centers[node.lane]+rowDrift;target=center+(hash(map.seed,node.id)-.5)*220;target=target*.60+from*.40;}
   return {node,value:target};
  });
  for(const item of separate(targets))positions[item.node.id]={x:item.value,y:top+rowHeight/2,realm:item.node.realm,lane:item.node.lane};
 }
 const edges=map.edges.map(edge=>{const from=positions[edge.from],to=positions[edge.to];if(!from||!to)throw Error('Visual layout has a dangling route edge');return {...edge,d:smoothPath(from,to)};});
 return Object.freeze({width:WIDTH,height,rowHeight,rowTops:Object.freeze(rowTops),positions:Object.freeze(positions),edges:Object.freeze(edges)});
}
root.WandererV013ExpeditionMapLayout=Object.freeze({WIDTH,MIN_X,MAX_X,MIN_GAP,laneCenters,hash,layout,smoothPath});
})(globalThis);
