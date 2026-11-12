// Permanent, deliberately bounded progression for the isolated automatic RPG branch.
(function(root){'use strict';
const NODES=Object.freeze([
 {id:'might',name:'Might',description:'Increase Attack and Spell Power by 5%.',attack:.05,spell:.05},
 {id:'precision',name:'Precision',description:'Increase critical chance by 2%.',requires:'might',crit:2},
 {id:'execution',name:'Execution',description:'Increase Attack and Spell Power by 8%.',requires:'precision',attack:.08,spell:.08},
 {id:'vitality',name:'Vitality',description:'Increase maximum Health by 8%.',health:.08},
 {id:'guard',name:'Guard',description:'Increase Defense by 8%.',requires:'vitality',defense:.08},
 {id:'fortitude',name:'Fortitude',description:'Increase maximum Health by 12%.',requires:'guard',health:.12},
 {id:'haste',name:'Haste',description:'Increase attack speed by 5%.',speed:.05},
 {id:'flow',name:'Flow',description:'Increase Mana and Mana regeneration by 8%.',requires:'haste',mana:.08},
 {id:'mastery',name:'Mastery',description:'Increase attack speed by 8%.',requires:'flow',speed:.08}
].map(Object.freeze));
const MAX_POINTS=NODES.length,POINT_XP=100;
function valid(v){
 if(!v||!Number.isSafeInteger(v.xp)||v.xp<0||v.xp>Number.MAX_SAFE_INTEGER||!Array.isArray(v.nodes)||new Set(v.nodes).size!==v.nodes.length)return false;
 const points=Math.min(MAX_POINTS,Math.floor(v.xp/POINT_XP));
 return v.nodes.length<=points&&v.nodes.every(id=>{const node=NODES.find(n=>n.id===id);return node&&(!node.requires||v.nodes.includes(node.requires));});
}
function create(){return {xp:0,nodes:[]};}
function earned(v){if(!valid(v))throw Error('Invalid talent progress');return Math.min(MAX_POINTS,Math.floor(v.xp/POINT_XP));}
function award(v,amount){if(!valid(v)||!Number.isSafeInteger(amount)||amount<0)throw Error('Invalid experience award');return {xp:Math.min(Number.MAX_SAFE_INTEGER,v.xp+amount),nodes:[...v.nodes]};}
function allocate(v,id){if(!valid(v))throw Error('Invalid talent progress');const node=NODES.find(n=>n.id===id);if(!node||v.nodes.includes(id)||v.nodes.length>=earned(v)||node.requires&&!v.nodes.includes(node.requires))return null;return {xp:v.xp,nodes:[...v.nodes,id]};}
function reset(v){if(!valid(v))throw Error('Invalid talent progress');return {xp:v.xp,nodes:[]};}
function apply(stats,v){if(!v)return stats;if(!valid(v))throw Error('Invalid talent progress');const bonuses={attack:0,spell:0,health:0,defense:0,crit:0,speed:0,mana:0};for(const id of v.nodes){const node=NODES.find(n=>n.id===id);for(const key of Object.keys(bonuses))bonuses[key]+=node[key]||0;}
 stats.attack=Math.round(stats.attack*(1+bonuses.attack));stats.spellPower=Math.round(stats.spellPower*(1+bonuses.spell));stats.maxhp=Math.round(stats.maxhp*(1+bonuses.health));stats.defense=Math.round(stats.defense*(1+bonuses.defense));stats.crit=Math.min(55,stats.crit+bonuses.crit);stats.attacksPerSec=Math.min(4.2,stats.attacksPerSec*(1+bonuses.speed));stats.mana=Math.round(stats.mana*(1+bonuses.mana));stats.manaRegen=+(stats.manaRegen*(1+bonuses.mana)).toFixed(1);
 stats.power=Math.round(stats.attack*2+stats.defense*4+stats.maxhp*.15+stats.attacksPerSec*35+stats.crit*1.2+stats.blockChance*2+(stats.caster?stats.spellPower*1.7:0)+(stats.synergyPower||0));return stats;}
root.WandererAutomaticTalents=Object.freeze({NODES,MAX_POINTS,POINT_XP,create,valid,earned,award,allocate,reset,apply});
})(globalThis);
