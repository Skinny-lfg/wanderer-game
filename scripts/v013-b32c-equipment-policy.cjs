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


function transition(p){return p?.equipmentIntelligence==='b32d2-transition';}
function full(p){return ['b32d-full','b32d-attributes'].includes(p?.equipmentIntelligence)||transition(p);}
function attributes(p){return p?.equipmentIntelligence==='b32d-attributes';}
function stable(p){return p?.equipmentIntelligence==='b32c1-stable'||full(p);}
function enabled(p){return p?.equipmentIntelligence==='b32c-soft'||stable(p);}
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
function features(a,equip,level,override=null){
 const stats=override||a.baseStats(equip),t=a.state().automaticTalents,extra={rawAttackSpeed:stats.rawAttackSpeed,spdFlat:stats.spdFlat,critDamage:stats.critDamage||0,dotPower:stats.dotPower||0};
 return adaptiveFeatures({stats,adaptiveStats:extra,weapon:equip.weapon.subtype,off:equip.offhand?.subtype||null,nodes:[...t.nodes],equipment:equip},t.element||'arcane',level);
}

 // One absolute utility for all legal hand sets. Legendary signatures remain
 // unmodeled; a bounded retention term acknowledges this unknown value instead
 // of mixing H23 and Adaptive scores on different edges of the same search.
function utility(a,p,equip,level,override=null){
 const x=features(a,equip,level,override),ranks=ownedRanks(a.state().automaticTalents.nodes),w=equip.weapon.subtype,o=equip.offhand?.subtype;
 const specific=(w==='Bow'?(ranks.bow_pierce||0):w==='Two-Handed'?(ranks.cleave_mastery||0):w==='Daggers'?(ranks.fan_of_blades||0):w==='Sword'&&o==='Shield'?(ranks.sword_sweep||0):w==='Mace'?(ranks.mace_shockwave||0):0);
 const owned=a.state().automaticTalents.nodes.length,commit=Math.min(1,owned/30),preferred=p.weapons?.includes(w)?1:0;
 const score=.25*(.65*Math.log(x.single)+.35*Math.log(x.normalDurability))+.40*(.55*Math.log(x.group)+.45*Math.log(x.normalDurability))+.35*(.42*Math.log(x.single)+.58*Math.log(x.bossDurability));
 // Actual acquired weapon-specialization nodes, not planned nodes. Small
 // extra value covers unknown downstream synergies; no hard weapon lock.
 const signature=full(p)?Object.values(equip).filter(x=>x?.rarity==='Legendary').length:(equip.weapon?.rarity==='Legendary'?1:0)+(equip.offhand?.rarity==='Legendary'?1:0);
 // Provisional bounded loot-quality credit, not a prediction of future drops.
 const loot=full(p)?.005*clamp(num((override||a.baseStats(equip)).lootQuality),0,10):0;
 return 100*(score+.035*commit*preferred+.025*Math.min(4,specific)+.06*signature+loot);
}
function key(equip){return [equip.weapon?.id||null,equip.offhand?.id||null].join('|');}
function stableGain(a,p,from,to){
 const level=Math.max(1,a.controller().state.unlocked||1);
 return utility(a,p,to,level)-utility(a,p,from,level);
}
function threshold(from,to){return from.weapon?.subtype===to.weapon?.subtype?2.5:5;}
function legalCapacity(a,between,from,steps){
 let occupied=between?a.bag.items().length:a.storage.occupied(),cur=from;
 const cap=between?a.bag.capacity():a.storage.capacity();
 for(const {item,slot} of steps){
  const next=projected(cur,item,slot);if(!next)return false;
  const displaced=Number(!!cur[slot])+Number(slot==='weapon'&&TWO.has(item.subtype)&&!!cur.offhand);
  occupied+=displaced-1;if(occupied>cap)return false;cur=next;
 }
 return true;
}
function plans(a,p,items,between){
 const equip=a.state().equip;if(!equip.weapon)return [];
 const visible=items.filter(x=>x?.id&&HANDS.has(x.slot)),main=visible.filter(x=>targets(x).includes('weapon')),off=visible.filter(x=>targets(x).includes('offhand'));
 const candidates=[],seen=new Set(),level=Math.max(1,a.controller().state.unlocked||1),baseline=utility(a,p,equip,level),cache=new Map();
 function add(next,steps){
  if(!next||seen.has(key(next))||!legalCapacity(a,between,equip,steps))return;seen.add(key(next));
  const k=key(next);if(!cache.has(k))cache.set(k,utility(a,p,next,level));const gain=cache.get(k)-baseline;
  assert(Number.isFinite(gain));
  candidates.push({next,steps,gain,minimum:threshold(equip,next),scoreBefore:baseline,scoreAfter:cache.get(k)});
 }
 for(const item of visible)for(const slot of targets(item)){const next=projected(equip,item,slot);if(next)add(next,[{item,slot}]);}
 // Consider complete, actually owned pairs when a one-hand switch alone
 // would lose value. No purchases or fabricated gear in this enumeration.
 for(const item of main){
  if(TWO.has(item.subtype))continue;const first=projected(equip,item,'weapon');if(!first)continue;
  for(const other of off){if(item.id===other.id)continue;const next=projected(first,other,'offhand');if(next)add(next,[{item,slot:'weapon'},{item:other,slot:'offhand'}]);}
 }
 return candidates.sort((x,y)=>y.gain-x.gain||x.steps.length-y.steps.length||key(x.next).localeCompare(key(y.next)));
}

function gearTargets(item){if(!item)return [];return ['ring1','ring2'].includes(item.slot)?['ring1','ring2']:targets(item);}
function projectGear(equip,item,slot){
 if(HANDS.has(slot))return projected(equip,item,slot);
 if(!item||!Object.hasOwn(equip,slot)||!gearTargets(item).includes(slot))return null;
 const next={...equip,[slot]:{...item,slot}};
 const ids=Object.values(next).filter(x=>x?.id).map(x=>x.id);
 if(new Set(ids).size!==ids.length||Object.values(next).filter(x=>x?.rarity==='Legendary').length>2)return null;
 return next;
}
function attributeChoices(a,p){
 const eq=a.state().equip;if(!eq.weapon)return [];
 const level=Math.max(1,a.controller().state.unlocked||1),baseline=utility(a,p,eq,level);
 return a.talents.ATTRIBUTES.map(key=>{const projected=a.projectAttributeStats(key);return projected?{key,gain:utility(a,p,eq,level,projected)-baseline,score:utility(a,p,eq,level,projected)}:null;}).filter(Boolean).sort((a,b)=>b.gain-a.gain||a.key.localeCompare(b.key));
}
function gain(a,p,item,slot,equip=a.state().equip){
 if(!enabled(p)||(!full(p)&&!HANDS.has(slot))||!equip?.weapon)return null;
 const next=full(p)?projectGear(equip,item,slot):projected(equip,item,slot);if(!next)return -Infinity;
 if(stable(p))return stableGain(a,p,equip,next);
 // Legendary signatures have not been modeled. Preserve H23 for choices
 // involving an equipped or candidate legendary hand item until B4.
 if([equip.weapon,equip.offhand,next.weapon,next.offhand].some(x=>x?.rarity==='Legendary'))return null;
 const level=Math.max(1,a.controller().state.unlocked||1),profile={...p,adaptiveNodes:[...a.state().automaticTalents.nodes]},b=features(a,equip,level),x=features(a,next,level);
 const score=100*(adaptiveScore(x,b,profile,next.weapon.subtype).adaptiveSoft-adaptiveScore(b,b,profile,equip.weapon.subtype).adaptiveSoft);
 assert(Number.isFinite(score),'Non-finite adaptive hand gain');return score;
}
function trace(p,entry){if(typeof p.equipmentTrace==='function')p.equipmentTrace(entry);}
module.exports={enabled,stable,full,attributes,transition,targets,gearTargets,projectGear,attributeChoices,projected,gain,trace,adaptiveFeatures,adaptiveScore,utility,stableGain,key,plans,threshold};
