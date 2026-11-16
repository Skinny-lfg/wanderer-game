// Runtime adapter for the rebuilt talent graph. Progress uses the existing XP/node envelope.
(function(root){'use strict';
const old=root.WandererAutomaticTalents,G=root.WandererTalentGraph,B=root.WandererTalentGraphBridge,graph=G.createGraph(root.WandererV012Buildcraft.CATALOG,old.NODES),byId=new Map(graph.map(n=>[n.id,n]));
const MAX_POINTS=100,POINT_XP=100,ATTRIBUTES=old.ATTRIBUTES;
function ranks(v){const out={};for(const id of v.nodes){const m=id.match(/^(.*)_rank(\d+)$/),base=m?m[1]:id,n=m?+m[2]:1;if(n!==(out[base]||0)+1)return null;out[base]=n;}return out;}
function points(v){return Math.min(MAX_POINTS,Math.floor(v.xp/POINT_XP)+(v.starterPoints||0));}
function valid(v){if(!v||v.treeVersion!==9||!Number.isSafeInteger(v.xp)||v.xp<0||!Array.isArray(v.nodes)||(v.starterPoints!==undefined&&v.starterPoints!==2)||v.element!==undefined&&!['fire','frost','lightning'].includes(v.element))return false;const rs=ranks(v);return !!rs&&G.valid(graph,{points:points(v),ranks:rs})&&(!v.prepared||!!rs[v.prepared]&&!!byId.get(v.prepared)?.advanced);}
function create(){return {xp:0,nodes:[],treeVersion:9};}
function earned(v){if(!valid(v))throw Error('Invalid talent progress');return points(v);}
function allocate(v,id){if(!valid(v))return null;const m=id.match(/^(.*)_rank\d+$/),base=m?m[1]:id,rs=ranks(v),p=G.allocate(graph,{points:points(v),ranks:rs},base);if(!p)return null;const rank=p.ranks[base];return {...v,nodes:[...v.nodes,rank===1?base:base+'_rank'+rank]};}
function award(v,amount){if(!valid(v)||!Number.isSafeInteger(amount)||amount<0)throw Error('Invalid experience award');return {...v,xp:Math.min(Number.MAX_SAFE_INTEGER,v.xp+amount)};}
function reset(v){if(!valid(v))throw Error('Invalid talent progress');return {...v,nodes:[],prepared:null};}
function graphProgress(v){return {points:points(v),ranks:ranks(v)};}
function passiveIds(v){if(!valid(v))throw Error('Invalid talent progress');return B.project(graph,graphProgress(v),v.element||'fire',v.prepared||null).permanentTalents;}
function apply(stats,v){if(!valid(v))throw Error('Invalid talent progress');Object.assign(stats,B.apply(stats,graph,graphProgress(v)));return stats;}
function attributePoints(v){return Math.max(0,Math.floor(v.xp/POINT_XP)-Object.values(v.attributes||{}).reduce((a,b)=>a+b,0));}
function allocateAttribute(v,key){if(!valid(v)||!ATTRIBUTES.includes(key)||!attributePoints(v))return null;return {...v,attributes:{...v.attributes,[key]:(v.attributes?.[key]||0)+1}};}
root.WandererAutomaticTalents=Object.freeze({NODES:graph,MAX_POINTS,POINT_XP,ATTRIBUTES,create,valid,earned,allocate,award,reset,passiveIds,apply,attributePoints,allocateAttribute,attributeBonuses:()=>({}),cap:()=>MAX_POINTS,graphProgress});
})(globalThis);
