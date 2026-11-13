// Permanent, deliberately bounded progression for the isolated automatic RPG branch.
(function(root){'use strict';
const CORE=Object.freeze([
 {id:'might',name:'Might',description:'Increase Attack and Spell Power by 5%.',attack:.05,spell:.05},
 {id:'precision',name:'Precision',description:'Increase critical chance by 2%.',requires:'might',crit:2},
 {id:'execution',name:'Execution',description:'Increase Attack and Spell Power by 8%.',requires:'precision',attack:.08,spell:.08},
 {id:'vitality',name:'Vitality',description:'Increase maximum Health by 8%.',health:.08},
 {id:'guard',name:'Guard',description:'Increase Defense by 8%.',requires:'vitality',defense:.08},
 {id:'fortitude',name:'Fortitude',description:'Increase maximum Health by 12%.',requires:'guard',health:.12},
 {id:'haste',name:'Haste',description:'Increase attack speed by 5%.',speed:.05},
 {id:'flow',name:'Flow',description:'Increase Mana and Mana regeneration by 8%.',requires:'haste',mana:.08},
 {id:'mastery',name:'Mastery',description:'Increase attack speed by 8%.',requires:'flow',speed:.08},
 ...Array.from({length:15},(_,i)=>{const roots=['might','vitality','haste'],types=['attack','health','speed'],names=['Force','Resilience','Swiftness'],branch=i%3,step=Math.floor(i/3);return {id:'minor_'+types[branch]+'_'+(step+1),name:names[branch],description:'Increase '+(branch===0?'Attack and Spell Power by 2%.':branch===1?'maximum Health by 3%.':'attack speed by 2%.'),requires:step?'minor_'+types[branch]+'_'+step:roots[branch],...(branch===0?{attack:.02,spell:.02}:branch===1?{health:.03}:{speed:.02})};})
].map(Object.freeze));
const ATTRIBUTES=Object.freeze(['str','agi','int','end','cha']);
const POINT_XP=100,ROOTS={blood:'might',decay:'might',vitality:'vitality',aegis:'vitality',fury:'haste',magic:'flow'};
let cachedCatalog=null,cachedNodes=CORE;
function nodes(){const catalogue=root.WandererV012Buildcraft?.CATALOG;if(!catalogue)return CORE;if(catalogue!==cachedCatalog){cachedCatalog=catalogue;cachedNodes=Object.freeze([...CORE,...catalogue.flatMap(p=>Array.from({length:p.max},(_,i)=>{const rank=i+1,base='passive_'+p.id,previous=rank===2?base:base+'_rank'+(rank-1);return Object.freeze({id:rank===1?base:base+'_rank'+rank,passiveId:p.id,rank,maxRank:p.max,family:p.family,name:p.name,description:p.description,prerequisites:rank===1?[...new Set((p.requires.length?p.requires:[p.family]).map(f=>ROOTS[f]))]:[previous]});}))]);}return cachedNodes;}
function requirements(node){return node.prerequisites||[node.requires].filter(Boolean);}
function valid(v){
 if(!v||!Number.isSafeInteger(v.xp)||v.xp<0||v.xp>Number.MAX_SAFE_INTEGER||!Array.isArray(v.nodes)||new Set(v.nodes).size!==v.nodes.length)return false;
 if(v.element!==undefined&&!['fire','frost','lightning'].includes(v.element))return false;
 const attrs=v.attributes??{};if(!attrs||typeof attrs!=='object'||Array.isArray(attrs)||Object.keys(attrs).some(k=>!ATTRIBUTES.includes(k)||!Number.isSafeInteger(attrs[k])||attrs[k]<0)||Object.values(attrs).reduce((a,b)=>a+b,0)>Math.floor(v.xp/POINT_XP))return false;
 const list=nodes(),points=Math.min(list.length,Math.floor(v.xp/POINT_XP));
 return v.nodes.length<=points&&v.nodes.every(id=>{const node=list.find(n=>n.id===id);return node&&requirements(node).every(required=>v.nodes.includes(required));});
}
function create(){return {xp:0,nodes:[]};}
function earned(v){if(!valid(v))throw Error('Invalid talent progress');return Math.min(nodes().length,Math.floor(v.xp/POINT_XP));}
function award(v,amount){if(!valid(v)||!Number.isSafeInteger(amount)||amount<0)throw Error('Invalid experience award');return {...v,xp:Math.min(Number.MAX_SAFE_INTEGER,v.xp+amount),nodes:[...v.nodes]};}
function allocate(v,id){if(!valid(v))throw Error('Invalid talent progress');const node=nodes().find(n=>n.id===id);if(!node||v.nodes.includes(id)||v.nodes.length>=earned(v)||requirements(node).some(required=>!v.nodes.includes(required)))return null;return {...v,nodes:[...v.nodes,id]};}
function reset(v){if(!valid(v))throw Error('Invalid talent progress');return {...v,nodes:[]};}
function attributePoints(v){if(!valid(v))throw Error('Invalid talent progress');return Math.floor(v.xp/POINT_XP)-Object.values(v.attributes||{}).reduce((a,b)=>a+b,0);}
function allocateAttribute(v,key){if(!valid(v))throw Error('Invalid talent progress');if(!ATTRIBUTES.includes(key)||attributePoints(v)<1)return null;return {...v,attributes:{...v.attributes,[key]:(v.attributes?.[key]||0)+1}};}
function passiveIds(v){if(!valid(v))throw Error('Invalid talent progress');const byId=new Map(nodes().filter(n=>n.passiveId).map(n=>[n.id,n.passiveId]));return v.nodes.filter(id=>byId.has(id)).map(id=>byId.get(id));}
function apply(stats,v){if(!v)return stats;if(!valid(v))throw Error('Invalid talent progress');const bonuses={attack:0,spell:0,health:0,defense:0,crit:0,speed:0,mana:0};for(const id of v.nodes){const node=nodes().find(n=>n.id===id);for(const key of Object.keys(bonuses))bonuses[key]+=node[key]||0;}
 stats.attack=Math.round(stats.attack*(1+bonuses.attack));stats.spellPower=Math.round(stats.spellPower*(1+bonuses.spell));stats.maxhp=Math.round(stats.maxhp*(1+bonuses.health));stats.defense=Math.round(stats.defense*(1+bonuses.defense));stats.crit=Math.min(55,stats.crit+bonuses.crit);stats.attacksPerSec=Math.min(4.2,stats.attacksPerSec*(1+bonuses.speed));stats.mana=Math.round(stats.mana*(1+bonuses.mana));stats.manaRegen=+(stats.manaRegen*(1+bonuses.mana)).toFixed(1);
 stats.power=Math.round(stats.attack*2+stats.defense*4+stats.maxhp*.15+stats.attacksPerSec*35+stats.crit*1.2+stats.blockChance*2+(stats.caster?stats.spellPower*1.7:0)+(stats.synergyPower||0));return stats;}
root.WandererAutomaticTalents=Object.freeze({get NODES(){return nodes();},get MAX_POINTS(){return nodes().length;},POINT_XP,ATTRIBUTES,create,valid,earned,award,allocate,reset,attributePoints,allocateAttribute,passiveIds,apply});
})(globalThis);
