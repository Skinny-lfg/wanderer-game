'use strict';
// Test helper for the actual v15 Talent Graph. No retired save or attribute APIs.
const assert=require('node:assert/strict');
require('../combat/v012-buildcraft.js');
require('../combat/talent-catalog.js');
require('../combat/talent-graph-next.js');
require('../combat/talent-graph-bridge.js');
require('../combat/talent-graph-runtime.js');
const T=globalThis.WandererAutomaticTalents,byId=new Map(T.NODES.map(node=>[node.id,node]));
function buy(ids,options={}){
 let progress={...T.create(),xp:options.xp??10000,...(options.element?{element:options.element}:{})};
 assert(T.valid(progress),'The fresh v15 progress must validate');
 const visiting=new Set();
 function purchase(id){
  if(progress.nodes.includes(id))return;
  const node=byId.get(id);assert(node,'Unknown current v15 Talent node '+id);
  assert(!visiting.has(id),'Cyclic v15 requirement '+id);
  visiting.add(id);
  for(const dep of [node.requires,...(node.prerequisites||[])].filter(Boolean))purchase(dep);
  if(node.anyRequires?.length&&!node.anyRequires.some(dep=>progress.nodes.includes(dep))){
   let resolved=false;
   for(const choice of node.anyRequires){
    const before=progress;
    try{purchase(choice);resolved=true;break;}catch{progress=before;}
   }
   assert(resolved,'No valid v15 alternate prerequisite for '+id);
  }
  visiting.delete(id);
  const next=T.allocate(progress,id);
  assert(next,'Current v15 allocation rejected '+id);
  progress=next;
 }
 for(const id of ids)purchase(id);
 assert(T.valid(progress),'The purchased v15 progress must validate');
 return progress;
}
module.exports={T,buy,byId};
