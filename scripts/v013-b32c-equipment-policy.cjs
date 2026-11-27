'use strict';
// B3.2C opt-in: B3.2B held-out Adaptive Soft proxy on native projected equipment.
// No RNG, no future loot/encounter access, no mutations, no economic bypass.
const assert=require('node:assert/strict');
require('../combat/v012-gear-stats.js');require('../combat/v012-combat-core.js');require('../combat/expedition-progression.js');
const GS=globalThis.WandererV012GearStats,CORE=globalThis.WandererV012CombatCore;
const num=x=>Number(x)||0,clamp=(x,l,h)=>Math.max(l,Math.min(h,x)),ratio=(x,y)=>Math.log(Math.max(.001,x)/Math.max(.001,y));
const TWO=new Set(['Bow','Two-Handed','Staff']),HANDS=new Set(['weapon','offhand']);
function ownedRanks(nodes){const ranks={};for(const id of nodes){const m=id.match(/^(.*)_rank(\d+)$/);const key=m?m[1]:id;ranks[key]=Math.max(ranks[key]||0,m?+m[2]:1);}return ranks;}
function adaptiveFeatures({stats:s,adaptiveStats:extra,weapon:w,off:o,nodes,equipment},element='arcane',level=10){
 assert(extra&&Number.isFinite(extra.rawAttackSpeed)&&Number.isFinite(extra.spdFlat));
 const rankMap=ownedRanks(nodes),rank=k=>rankMap[k]||0,ap=Math.max(1,num(s.attack)),sp=Math.max(0,num(s.spellPower)),aps=Math.max(.01,num(s.attacksPerSec)),hp=Math.max(1,num(s.maxhp));
 const caster=w==='Staff'||w==='Wand',mana=Math.max(0,num(s.mana)),regen=Math.max(0,num(s.manaRegen));
 const daggerRate=GS.offhandDaggerRate({...s,...extra,main:equipment.weapon,off:equipment.offhand});
 const baseCost=({arcane:[9,13],fire:[13,18],frost:[10,15],lightning:[14,20]})[element]?.[w==='Staff'?1:0]||9;
 let price=baseCost*(w==='Staff'?.75:1);
 if(caster&&rank('element_choice'))price=Math.max(Math.min(3,price),price-rank('efficient_cast'));
 price=Math.ceil(price);
 if(Object.values(equipment).some(x=>x?.v013Trait==='efficient'))price=Math.max(1,price-Math.max(1,Math.floor(price*.1)));
 price=Math.max(1,Math.round(price*(1-clamp(num(s.manaCostReduction),0,.25))*100)/100);
 const rotRank=rank('corrupting_touch'),bleedRank=rank('bleeding_edge');
 const procRate=(rate,chance,icd)=>rate*chance/(1+rate*chance*icd);
 // 60s resource envelope with bounded estimates for Tome and other paid actions.
 // Reserve expected cost for acquired Rot and Arcane abilities, not planned nodes.
 const rotDemand=rotRank?4*procRate(aps+daggerRate,.42+.04*(rotRank-1),1.3):0;
 const arcaneReserve=rank('element_choice')?1.5:0;
 const tomeRate=o==='Tome'&&mana>0?Math.min((equipment.offhand?.v013Trait==='echoing_recall'?5:3)/6,(caster?aps:0)*((equipment.offhand?.v013Trait==='echoing_recall'?5:3)/3)):0;
 const budget=mana/60+regen+tomeRate;
 const funded=caster?clamp((budget-.5*rotDemand-arcaneReserve)/(price*aps),0,1):1;
 const factor={Sword:1.12,Mace:1.4,Daggers:.8,Bow:1.4,'Two-Handed':2.1,Wand:1.05,Staff:1.6}[w];
 const crit=1+clamp(num(s.crit)/100,0,1)*(.5+num(extra.critDamage));
 const nominal=caster?sp*factor:ap*factor,hit=caster?funded*nominal*(1+.12*rank('elemental_force'))+(1-funded)*ap*.55:nominal;
 const direct=Math.max(1,hit*aps*crit+ap*.4*daggerRate*crit);
 const eligible=aps*(caster?funded:1)+daggerRate;
 const bleed=bleedRank?procRate(eligible,.42+.04*(bleedRank-1),.6)*Math.max(1,(hit*aps+ap*.4*daggerRate)/Math.max(.01,aps+daggerRate))*crit*.16*4*(1+.15*rank('deep_cuts')):0;
 const rotOpportunity=rotRank?procRate(eligible,.42+.04*(rotRank-1),1.3):0;
 const rotBudget=Math.max(0,budget-(caster?price*aps*funded:0)-arcaneReserve);
 const rotPaid=Math.min(rotOpportunity,rotBudget/4);
 // Four effective tick-equivalents is only a ranking proxy, not Rot's native duration.
 const rot=rotPaid*.04*(nominal+sp)*4*(1+.15*rank('virulent_rot'));
 const dots=(bleed+rot)*(1+num(extra.dotPower));
 // Credit cleave only when the actual weapon/offhand and acquired nodes enable it.
 const secondary=w==='Bow'?(rank('bow_pierce')?1:.66):w==='Two-Handed'?(rank('cleave_mastery')?1.2:.8):w==='Daggers'&&rank('fan_of_blades')?.44:w==='Sword'&&o==='Shield'&&rank('sword_sweep')?.25:w==='Mace'&&rank('mace_shockwave')?.3:0;
 const single=direct*(rank('single_target_mastery')&&!caster?1.15:1)+dots;
 // Maximum two primary foes in the native arena. Partial simultaneous target uptime.
 const group=direct*(1+Math.min(1,secondary)*.75)+dots*(1+(w==='Bow'?.75:Math.min(1,secondary)*.25));
 const guard=clamp(num(s.blockChance)/100,0,.65),guardReduction=clamp(num(s.blockReduction),0,1);
 const eva=CORE.evasionChance(num(s.evasionRating),level,20,.45);
 const def=Math.max(0,num(s.defense)),ward=1+Math.max(0,num(s.wardBonus)+num(s.barrierPower)),heal=1+Math.max(0,num(s.healingPower));
 const pulse=rank('barrier_pulse'),renewal=rank('renewal'),drinker=rank('blood_drinker');
 const barrier=(o==='Orb'?(hp*.02+sp*.05)/6:0)+(pulse?(hp*(.03+.006*(pulse-1))+sp*(.06+.012*(pulse-1)))/6:0);
 const healing=(o==='Charm'?hp*(equipment.offhand?.v013Trait==='heartbloom'?.02:.015)/8:0)+(renewal?hp*Math.min(.0125,.0055*Math.sqrt(renewal)):0)+(drinker&&bleedRank?Math.min(hp*(.008+.0025*(drinker-1)),hit*(.10+.025*(drinker-1)))/4:0);
 const effectivePool=hp+30*(barrier*ward+healing*heal);
 const durability=enemyAtk=>effectivePool/(1-Math.min(.75,def/(def+enemyAtk*1.35)))/(1-guard*guardReduction)/(1-.6*eva);
 // Fixed reference threats, not the sampled encounter's hidden enemy stats.
 const threatScale=(2+CORE.referenceLevel(level)*.91)/(2+CORE.referenceLevel(10)*.91);
 return {single,group,normalDurability:durability(30*threatScale),bossDurability:durability(55*threatScale),funded,daggerRate,rotPaid,bleed,rot,barrier,healing,secondary};
}
function adaptiveScore(x,b,profile,weapon){
 const single=ratio(x.single,b.single),group=ratio(x.group,b.group),normal=ratio(x.normalDurability,b.normalDurability),boss=ratio(x.bossDurability,b.bossDurability);
 // Fixed expected encounter mix; a single choice for the whole Expedition.
 // 25% solo, 40% groups, 35% boss are declared test weights, not actual frequencies.
 const main=.25*(.65*single+.35*normal)+.40*(.55*group+.45*normal)+.35*(.42*single+.58*boss);
 const owned=profile.adaptiveNodes||[],commit=Math.min(1,owned.length/30);
 const preferred=profile.weapons?.includes(weapon)?1:0;
 return {adaptive:main,adaptiveSoft:main+.035*commit*preferred};
}


function enabled(p){return p?.equipmentIntelligence==='b32c-soft';}
function targets(item){if(!item)return [];if(item.subtype==='Off-Hand Dagger')return ['offhand'];if(item.subtype==='Daggers')return ['weapon','offhand'];return [item.slot];}
function projected(equip,item,slot){
 if(!HANDS.has(slot)||!targets(item).includes(slot)||!item)return null;
 if(slot==='offhand'&&TWO.has(equip.weapon?.subtype))return null;
 const next={...equip,[slot]:{...item,slot,subtype:item.subtype==='Off-Hand Dagger'?'Daggers':item.subtype}};
 if(slot==='weapon'&&TWO.has(item.subtype))next.offhand=null;
 if(Object.values(next).filter(x=>x?.rarity==='Legendary').length>2)return null;
 const ids=Object.values(next).filter(x=>x?.id).map(x=>x.id);
 if(new Set(ids).size!==ids.length)return null;
 return next;
}
function features(a,equip,level){
 const stats=a.baseStats(equip),t=a.state().automaticTalents,extra={rawAttackSpeed:stats.rawAttackSpeed,spdFlat:stats.spdFlat,critDamage:stats.critDamage||0,dotPower:stats.dotPower||0};
 return adaptiveFeatures({stats,adaptiveStats:extra,weapon:equip.weapon.subtype,off:equip.offhand?.subtype||null,nodes:[...t.nodes],equipment:equip},t.element||'arcane',level);
}
function gain(a,p,item,slot,equip=a.state().equip){
 if(!enabled(p)||!HANDS.has(slot)||!equip?.weapon)return null;
 const next=projected(equip,item,slot);if(!next)return -Infinity;
 // Legendary signatures have not been modeled. Preserve H23 for choices
 // involving an equipped or candidate legendary hand item until B4.
 if([equip.weapon,equip.offhand,next.weapon,next.offhand].some(x=>x?.rarity==='Legendary'))return null;
 const level=Math.max(1,a.controller().state.unlocked||1),profile={...p,adaptiveNodes:[...a.state().automaticTalents.nodes]},b=features(a,equip,level),x=features(a,next,level);
 const score=100*(adaptiveScore(x,b,profile,next.weapon.subtype).adaptiveSoft-adaptiveScore(b,b,profile,equip.weapon.subtype).adaptiveSoft);
 assert(Number.isFinite(score),'Non-finite adaptive hand gain');return score;
}
function trace(p,entry){if(typeof p.equipmentTrace==='function')p.equipmentTrace(entry);}
module.exports={enabled,targets,projected,gain,trace,adaptiveFeatures,adaptiveScore};
