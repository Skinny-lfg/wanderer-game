// Runtime adapter for the rebuilt talent graph. Progress uses the existing XP/node envelope.
(function(root){'use strict';
const old=root.WandererAutomaticTalents,G=root.WandererTalentGraph,B=root.WandererTalentGraphBridge,graph=G.createGraph(root.WandererV012Buildcraft.CATALOG,old.NODES),legacyGraph=G.createGraph(root.WandererV012Buildcraft.CATALOG,old.NODES,{legacyFocused:true}),legacyById=new Map(legacyGraph.map(n=>[n.id,n])),byId=new Map(graph.map(n=>[n.id,n]));
const MAX_POINTS=100,POINT_XP=100,ATTRIBUTES=old.ATTRIBUTES;
function ranks(v){const out={};for(const id of v.nodes){const m=id.match(/^(.*)_rank(\d+)$/),base=m?m[1]:id,n=m?+m[2]:1;if(n!==(out[base]||0)+1)return null;out[base]=n;}return out;}
function points(v){return Math.min(MAX_POINTS,Math.floor(v.xp/POINT_XP)+(v.starterPoints||0));}
function valid(v){if(!v||v.treeVersion!==12||!Number.isSafeInteger(v.xp)||v.xp<0||!Array.isArray(v.nodes)||(v.starterPoints!==undefined&&v.starterPoints!==2)||v.element!==undefined&&!['fire','frost','lightning'].includes(v.element))return false;const rs=ranks(v),mode=v.element||'arcane';return !!rs&&G.valid(graph,{points:points(v),ranks:rs})&&Object.keys(rs).every(id=>!byId.get(id)?.element||byId.get(id).element===mode)&&(!v.prepared||!!rs[v.prepared]&&!!byId.get(v.prepared)?.advanced);}
function create(){return {xp:0,nodes:[],treeVersion:12};}
function migrate(v){if(!v||![9,10,11].includes(v.treeVersion)||!Number.isSafeInteger(v.xp)||v.xp<0||!Array.isArray(v.nodes))return v;if(v.treeVersion!==11)return {...v,treeVersion:12,nodes:[],prepared:null};if((v.starterPoints!==undefined&&v.starterPoints!==2)||v.element!==undefined&&!['fire','frost','lightning'].includes(v.element))return v;const rs=ranks(v),mode=v.element||'arcane';if(!rs||!G.valid(legacyGraph,{points:points(v),ranks:rs})||Object.keys(rs).some(id=>legacyById.get(id)?.element&&legacyById.get(id).element!==mode)||v.prepared&&(!rs[v.prepared]||!legacyById.get(v.prepared)?.advanced))return v;const keep={...rs};let changed;do{changed=false;for(const id of Object.keys(keep)){const node=byId.get(id);if(!node||!G.requirements(node,keep)){delete keep[id];changed=true;}}}while(changed);const out={...v,treeVersion:12,nodes:v.nodes.filter(id=>keep[id.replace(/_rank\d+$/,'')])};if(out.prepared&&!keep[out.prepared])out.prepared=null;return valid(out)?out:v;}

function earned(v){if(!valid(v))throw Error('Invalid talent progress');return points(v);}
function allocate(v,id){if(!valid(v))return null;const m=id.match(/^(.*)_rank\d+$/),base=m?m[1]:id,node=byId.get(base);if(node?.element&&node.element!==(v.element||'arcane'))return null;const rs=ranks(v),p=G.allocate(graph,{points:points(v),ranks:rs},base);if(!p)return null;const rank=p.ranks[base];return {...v,nodes:[...v.nodes,rank===1?base:base+'_rank'+rank]};}
function selectElement(v,mode){if(!valid(v)||!v.nodes.includes('element_choice')||!['arcane','fire','frost','lightning'].includes(mode))return null;if(mode===(v.element||'arcane'))return v;const next={...v,nodes:v.nodes.filter(id=>{const base=id.replace(/_rank\d+$/,'');return !byId.get(base)?.element;})};if(mode==='arcane')delete next.element;else next.element=mode;if(next.prepared&&!next.nodes.includes(next.prepared))next.prepared=null;return valid(next)?next:null;}
function award(v,amount){if(!valid(v)||!Number.isSafeInteger(amount)||amount<0)throw Error('Invalid experience award');return {...v,xp:Math.min(Number.MAX_SAFE_INTEGER,v.xp+amount)};}
function reset(v){if(!valid(v))throw Error('Invalid talent progress');return {...v,nodes:[],prepared:null};}
function graphProgress(v){return {points:points(v),ranks:ranks(v)};}
function passiveIds(v){if(!valid(v))throw Error('Invalid talent progress');return B.project(graph,graphProgress(v),v.element||'arcane',v.prepared||null).permanentTalents;}
function apply(stats,v){if(!valid(v))throw Error('Invalid talent progress');Object.assign(stats,B.apply(stats,graph,graphProgress(v)));return stats;}
function bonuses(v){if(!valid(v))throw Error('Invalid talent progress');return B.bonuses(graph,graphProgress(v));}
function attributeBonuses(v){if(!v)return {};const all=bonuses(v),out={};for(const key of ATTRIBUTES)if(all[key])out[key]=all[key];return out;}
function attributePoints(v){return Math.max(0,Math.floor(v.xp/POINT_XP)-Object.values(v.attributes||{}).reduce((a,b)=>a+b,0));}
function allocateAttribute(v,key){if(!valid(v)||!ATTRIBUTES.includes(key)||!attributePoints(v))return null;return {...v,attributes:{...v.attributes,[key]:(v.attributes?.[key]||0)+1}};}
root.WandererAutomaticTalents=Object.freeze({NODES:graph,MAX_POINTS,POINT_XP,ATTRIBUTES,create,valid,migrate,earned,allocate,selectElement,award,reset,passiveIds,apply,bonuses,attributePoints,allocateAttribute,attributeBonuses,cap:()=>MAX_POINTS,graphProgress});
})(globalThis);

