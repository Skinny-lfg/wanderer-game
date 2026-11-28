// Runtime adapter for the rebuilt talent graph. Progress uses the existing XP/node envelope.
(function(root){'use strict';
const catalog=root.WandererTalentCatalog,G=root.WandererTalentGraph,B=root.WandererTalentGraphBridge,graph=G.createGraph(root.WandererV012Buildcraft.CATALOG,catalog.NODES),byId=new Map(graph.map(n=>[n.id,n]));
const MAX_POINTS=100,POINT_XP=100,ATTRIBUTES=catalog.ATTRIBUTES;
const attributeBudget=xp=>Math.max(0,Math.floor(xp/POINT_XP)-MAX_POINTS);
function attributes(v){const saved=v?.attributes||{};return Object.fromEntries(ATTRIBUTES.map(key=>[key,saved[key]||0]));}
function spentAttributes(v){return Object.values(attributes(v)).reduce((sum,n)=>sum+n,0);}
function availableAttributes(v){if(!valid(v))throw Error('Invalid Talent/attribute progress');return attributeBudget(v.xp)-spentAttributes(v);}
function ranks(v){const out={};for(const id of v.nodes){const m=id.match(/^(.*)_rank(\d+)$/),base=m?m[1]:id,n=m?+m[2]:1;if(n!==(out[base]||0)+1)return null;out[base]=n;}return out;}
function points(v){return Math.min(MAX_POINTS,Math.floor(v.xp/POINT_XP));}
function valid(v){
 if(!v||v.treeVersion!==15||!Number.isSafeInteger(v.xp)||v.xp<0||
  !Array.isArray(v.nodes)||v.starterPoints!==undefined||
  v.element!==undefined&&!['fire','frost','lightning'].includes(v.element))return false;
 const a=v.attributes;
 if(a!==undefined){
  if(!a||typeof a!=='object'||Array.isArray(a)||
   Object.keys(a).some(key=>!ATTRIBUTES.includes(key)||
     !Number.isSafeInteger(a[key])||a[key]<0))return false;
  let remaining=attributeBudget(v.xp);
  for(const key of ATTRIBUTES){const value=a[key]||0;if(value>remaining)return false;remaining-=value;}
 }
 const rs=ranks(v),mode=v.element||'arcane';
 return !!rs&&G.valid(graph,{points:points(v),ranks:rs})&&
  Object.keys(rs).every(id=>!byId.get(id)?.pending&&(!byId.get(id)?.element||byId.get(id).element===mode))&&
  (!v.prepared||!!rs[v.prepared]&&!!byId.get(v.prepared)?.advanced);
}
function create(){return {xp:0,nodes:[],treeVersion:15,attributes:{}};}

function earned(v){if(!valid(v))throw Error('Invalid talent progress');return points(v);}
function allocate(v,id){if(!valid(v))return null;const m=id.match(/^(.*)_rank\d+$/),base=m?m[1]:id,node=byId.get(base);if(node?.pending||node?.element&&node.element!==(v.element||'arcane'))return null;if(base==='outbreak'&&v.nodes.some(x=>x.startsWith('affinity_')&&x!=='affinity_decay'))return null;const rs=ranks(v),p=G.allocate(graph,{points:points(v),ranks:rs},base);if(!p)return null;const rank=p.ranks[base],next={...v,nodes:[...v.nodes,rank===1?base:base+'_rank'+rank]};if(base.startsWith('affinity_')&&base!=='affinity_decay'&&next.nodes.includes('outbreak')){next.nodes=next.nodes.filter(x=>x!=='outbreak');let changed=true;while(changed){const owned=ranks(next),filtered=next.nodes.filter(x=>G.requirements(byId.get(x.replace(/_rank\d+$/,'')),owned));changed=filtered.length!==next.nodes.length;next.nodes=filtered;}if(next.prepared&&!next.nodes.includes(next.prepared))next.prepared=null;}return valid(next)?next:null;}
function selectElement(v,mode){if(!valid(v)||!v.nodes.includes('element_choice')||!['arcane','fire','frost','lightning'].includes(mode))return null;if(mode===(v.element||'arcane'))return v;const next={...v,nodes:v.nodes.filter(id=>{const base=id.replace(/_rank\d+$/,'');return !byId.get(base)?.element;})};if(mode==='arcane')delete next.element;else next.element=mode;
 // Refund dependent nodes only when their remaining routes are no longer legal.
 let changed=true;while(changed){const rs=ranks(next);const filtered=next.nodes.filter(id=>G.requirements(byId.get(id.replace(/_rank\d+$/,'')),rs));changed=filtered.length!==next.nodes.length;next.nodes=filtered;}
 if(next.prepared&&!next.nodes.includes(next.prepared))next.prepared=null;return valid(next)?next:null;}
function award(v,amount){
 if(!valid(v)||!Number.isSafeInteger(amount)||amount<0)throw Error('Invalid experience award');
 return {...v,xp:Math.min(Number.MAX_SAFE_INTEGER,v.xp+amount)};
}
function allocateAttribute(v,key){
 if(!valid(v)||!ATTRIBUTES.includes(key)||availableAttributes(v)<1)return null;
 const a=attributes(v);
 return {...v,attributes:{...a,[key]:a[key]+1}};
}
function reset(v){if(!valid(v))throw Error('Invalid talent progress');return {...v,nodes:[],prepared:null};}
function graphProgress(v){return {points:points(v),ranks:ranks(v)};}
function passiveIds(v){if(!valid(v))throw Error('Invalid talent progress');return B.project(graph,graphProgress(v),v.element||'arcane',v.prepared||null).permanentTalents;}
function apply(stats,v){if(!valid(v))throw Error('Invalid talent progress');Object.assign(stats,B.apply(stats,graph,graphProgress(v)));return stats;}
function bonuses(v){if(!valid(v))throw Error('Invalid talent progress');return B.bonuses(graph,graphProgress(v));}
function attributeBonuses(v){
 if(!v)return {};
 const all=bonuses(v),permanent=attributes(v),out={};
 for(const key of ATTRIBUTES){
  const total=(all[key]||0)+permanent[key];
  if(total)out[key]=total;
 }
 return out;
}
root.WandererAutomaticTalents=Object.freeze({NODES:graph,MAX_POINTS,POINT_XP,ATTRIBUTES,create,valid,earned,allocate,selectElement,award,reset,passiveIds,apply,bonuses,attributeBonuses,attributeBudget:v=>{if(!valid(v))throw Error('Invalid Talent/attribute progress');return attributeBudget(v.xp);},attributes,spentAttributes,availableAttributes,allocateAttribute,cap:()=>MAX_POINTS,graphProgress});
})(globalThis);

