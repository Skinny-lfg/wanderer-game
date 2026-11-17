// Finds one valid sequence of missing nodes, respecting ALL and ANY prerequisites.
(function(root){'use strict';
function plan(graph,ranks,target){
 const byId=new Map(graph.map(n=>[n.id,n]));if(!byId.has(target))return null;
 const clone=s=>({owned:new Set(s.owned),steps:[...s.steps],edges:s.edges.map(e=>[...e])});
 function walk(id,state,visiting){
  if(state.owned.has(id))return state;
  const n=byId.get(id);if(!n||visiting.has(id))return null;
  const next=new Set(visiting);next.add(id);
  for(const dep of [n.requires,...(n.prerequisites||[])].filter(Boolean)){
   state=walk(dep,state,next);if(!state)return null;state.edges.push([dep,id]);
  }
  if(n.anyRequires?.length){
   let best=null;for(const dep of n.anyRequires){const candidate=walk(dep,clone(state),next);if(candidate){candidate.edges.push([dep,id]);if(!best||candidate.steps.length<best.steps.length)best=candidate;}}
   if(!best)return null;state=best;
  }
  state.owned.add(id);state.steps.push(id);return state;
 }
 const initial={owned:new Set(Object.keys(ranks||{}).filter(id=>ranks[id]>0)),steps:[],edges:[]};
 const result=walk(target,initial,new Set());return result?{steps:result.steps,edges:result.edges}:null;
}
root.WandererTalentRequirements=Object.freeze({plan});
})(globalThis);
