// Bridge from the next graph to the existing buildcraft contracts; not yet connected to saves or UI.
(function(root){'use strict';
function project(graph,progress,element='fire',prepared=null){
 if(!root.WandererTalentGraph.valid(graph,progress))throw Error('Invalid talent progress');
 if(!['fire','frost','lightning'].includes(element))throw Error('Invalid element');
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
 for(const n of graph){const rank=progress.ranks[n.id]||0;if(!rank)continue;for(const [property,dest] of [['flatAttack','attack'],['flatArmor','defense'],['flatLife','maxhp'],['flatAvoid','evasionRating'],['flatSpell','spellPower'],['flatRegen','manaRegen']])if(n[property])result[dest]=(result[dest]||0)+n[property]*rank;spell+=(n.spell||0)*rank;health+=(n.health||0)*rank;speed+=(n.speed||0)*rank;}
 result.spellPower=Math.round((result.spellPower||0)*(1+spell));if(health)result.maxhp=Math.round(result.maxhp*(1+health));if(speed)result.attacksPerSec=Math.min(4.2,result.attacksPerSec*(1+speed));return result;
}
root.WandererTalentGraphBridge=Object.freeze({project,apply});
})(globalThis);
