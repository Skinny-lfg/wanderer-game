// Bridge from the next graph to the existing buildcraft contracts; not yet connected to saves or UI.
(function(root){'use strict';
function project(graph,progress,element='fire',prepared=null){
 if(!root.WandererTalentGraph.valid(graph,progress))throw Error('Invalid talent progress');
 if(!['arcane','fire','frost','lightning'].includes(element))throw Error('Invalid element');
 const selected=graph.filter(n=>progress.ranks[n.id]),nodes=[],permanentTalents=[];
 for(const n of selected){const rank=progress.ranks[n.id];for(let i=1;i<=rank;i++)nodes.push(i===1?n.id:n.id+'_rank'+i);if(n.passiveId)for(let i=0;i<rank;i++)permanentTalents.push(n.passiveId);}
 // The legacy combat engine supplies these first ranks with their affinity.
 for(const [family,id] of [['blood','bleeding_edge'],['decay','toxic_touch']])if(nodes.includes('affinity_'+family))permanentTalents.push(id);
 if(prepared!==null&&!selected.some(n=>n.id===prepared&&n.advanced))throw Error('Invalid prepared talent');
 return {nodes,permanentTalents,element,prepared};
}
function apply(stats,graph,progress){
 if(!root.WandererTalentGraph.valid(graph,progress))throw Error('Invalid talent progress');
 const result={...stats};let spell=0,health=0,speed=0;
 const percentFields=[['pctAttack','attack'],['pctArmor','defense'],['pctLife','maxhp'],['pctSpell','spellPower'],['pctSpeed','attacksPerSec'],['pctMana','mana'],['pctRegen','manaRegen']],percent={attack:0,defense:0,maxhp:0,spellPower:0,attacksPerSec:0,mana:0,manaRegen:0};let critChance=0,guardChance=0,barrierPower=0,healingPower=0,manaCostReduction=0;
 for(const n of graph){const rank=progress.ranks[n.id]||0;if(!rank)continue;for(const [property,dest] of [['flatRegen','manaRegen'],['flatMana','mana']])if(n[property])result[dest]=(result[dest]||0)+n[property]*rank;for(const [property,dest] of percentFields)percent[dest]+=(n[property]||0)*rank;critChance+=(n.critChance||0)*rank;guardChance+=(n.guardChance||0)*rank;barrierPower+=(n.barrierPower||0)*rank;healingPower+=(n.healingPower||0)*rank;manaCostReduction+=(n.manaCostReduction||0)*rank;spell+=(n.spell||0)*rank;health+=(n.health||0)*rank;speed+=(n.speed||0)*rank;}
 // Additive percentages use the same pre-graph stat, never compound per node.
 for(const [,dest] of percentFields)if(percent[dest])result[dest]=(result[dest]||0)+(stats[dest]||0)*percent[dest];
 if(critChance)result.crit=Math.min(100,Math.max(0,(stats.crit||0)+critChance));
 result.blockChance=Math.min(65,Math.max(0,(stats.blockChance||0)+guardChance));if(result.blockChance&&!result.blockReduction)result.blockReduction=.35;
 result.barrierPower=(stats.barrierPower||0)+barrierPower;result.healingPower=(stats.healingPower||0)+healingPower;result.manaCostReduction=Math.min(.25,Math.max(0,(stats.manaCostReduction||0)+manaCostReduction));
 result.spellPower=Math.round((result.spellPower||0)*(1+spell));if(health)result.maxhp=Math.round(result.maxhp*(1+health));if(speed)result.attacksPerSec*=1+speed;if(Number.isFinite(result.attacksPerSec))result.attacksPerSec=Math.min(4.2,result.attacksPerSec);return result;
}
function bonuses(graph,progress){if(!root.WandererTalentGraph.valid(graph,progress))throw Error('Invalid talent progress');const out={};for(const n of graph){const rank=progress.ranks[n.id]||0;if(!rank)continue;if(n.attribute)out[n.attribute]=(out[n.attribute]||0)+(n.attributeValue||1)*rank;for(const key of ['bleedBonus','rotBonus','rotDefense','sunderDamage','healthRegen'])if(n[key])out[key]=(out[key]||0)+n[key]*rank;}return out;}
root.WandererTalentGraphBridge=Object.freeze({project,apply,bonuses});
})(globalThis);
