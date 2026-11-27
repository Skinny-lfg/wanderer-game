'use strict';
// Stage 5: native real-account progression, with optional E1–E20 horizon.
// Absolutely no synthetic talent XP, fabricated gear, forced unlocks, forced
// encounters, instant-kill enemies or direct state mutation of rewards.
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const create=require('../tests/v012-economy-harness.cjs');
const S=require('./simulate-progression.cjs');
const CAPTURE=require('./v013-capture-assistance.cjs');
const AGENT=require('./v013-agent-strategy.cjs');
const PLANNER=require('./v013-build-planner.cjs');
const EQUIPMENT_AI=require('./v013-b32c-equipment-policy.cjs');
const TRANSITION=require('./v013-b32d2-transition-policy.cjs');
const ACQUISITION=require('./v013-b32d3-acquisition-policy.cjs');
require('../combat/v012-gear-stats.js');
const GEAR_STATS=globalThis.WandererV012GearStats;
require('../online/v013-map-intelligence.js');
const I=globalThis.WandererV013MapIntelligence;
require('../economy/v012-loot-rules.js');
const LOOT=globalThis.WandererV012LootRules;
require('../combat/v012-runes.js');
const RUNES=globalThis.WandererV012Runes;
require('../online/v012-consumables.js');
const POTIONS=globalThis.WandererV012Consumables;
// Native Stage 7 ledger and objective progress, read-only in the simulation.
require('../online/v013-expedition-contracts.js');
const K=globalThis.WandererV013ExpeditionContracts;
const PROFILES=Object.freeze({
 cautious:{name:'Cautious',risk:0,targets:['strong_heart','guarded_block','renewal'],families:['aegis','radiance'],preparedTargets:['last_bastion'],armor:'Plate',weapons:['Mace','Sword'],style:'mixed',healAt:.72,retreatAt:.5,target:'mechanics',shop:true},
 balanced:{name:'Balanced',risk:0,targets:['bleeding_edge','deep_cuts','guarded_block'],families:['blood','aegis'],preparedTargets:[],armor:'Plate',weapons:['Sword','Mace'],style:'mixed',healAt:.53,retreatAt:.34,target:'mechanics',shop:true},
 daring:{name:'Daring',risk:1,targets:['quick_hands','double_strike','bleeding_edge'],families:['fury','blood'],preparedTargets:['red_guillotine'],armor:'Leather',weapons:['Daggers','Bow'],style:'mixed',healAt:.35,retreatAt:.16,target:'focus',shop:true},
 'arcane-fire':{name:'Fire Caster',risk:0,targets:['element_choice','arcane_focus','mana_spring','kindling','fire_spread'],families:['arcane'],element:'fire',armor:'Cloth',weapons:['Wand','Staff'],style:'focused',preparedTargets:[],healAt:.57,retreatAt:.36,target:'mechanics',shop:true},
 'arcane-frost':{name:'Frost Caster',risk:0,targets:['element_choice','arcane_focus','mana_spring','deep_winter','frost_spread'],families:['arcane'],element:'frost',armor:'Cloth',weapons:['Wand','Staff'],style:'focused',preparedTargets:[],healAt:.62,retreatAt:.41,target:'mechanics',shop:true},
 'arcane-lightning':{name:'Lightning Caster',risk:0,targets:['element_choice','arcane_focus','mana_spring','overcharge','forked_lightning'],families:['arcane'],element:'lightning',armor:'Cloth',weapons:['Staff','Wand'],style:'focused',preparedTargets:[],healAt:.54,retreatAt:.34,target:'mechanics',shop:true},
 'arcane-arcane':{name:'Arcane Caster',risk:0,targets:['element_choice','arcane_focus','mana_spring','arcane_resonance','arcane_surge','arcane_mastery'],families:['arcane'],element:'arcane',armor:'Cloth',weapons:['Wand','Staff'],style:'focused',preparedTargets:[],healAt:.58,retreatAt:.37,target:'mechanics',shop:true},
 'arcane-wand':{name:'Wand Specialist (Fire)',risk:0,targets:['element_choice','arcane_focus','mana_spring','kindling','fire_spread'],families:['arcane'],element:'fire',armor:'Cloth',weapons:['Wand'],style:'focused',preparedTargets:[],healAt:.57,retreatAt:.36,target:'mechanics',shop:true},
 'arcane-staff':{name:'Staff Specialist (Fire)',risk:0,targets:['element_choice','arcane_focus','mana_spring','kindling','fire_spread'],families:['arcane'],element:'fire',armor:'Cloth',weapons:['Staff'],style:'focused',preparedTargets:[],healAt:.57,retreatAt:.36,target:'mechanics',shop:true},
 'plate-warden':{name:'Plate Warden',risk:0,targets:['guarded_block','barrier_pulse','steadfast_guard','strong_heart'],families:['aegis','radiance'],armor:'Plate',weapons:['Mace','Sword'],style:'mixed',preparedTargets:['last_bastion'],healAt:.68,retreatAt:.46,target:'mechanics',shop:true},
 'leather-duelist':{name:'Leather Duelist',risk:1,targets:['quick_hands','bleeding_edge','blood_drinker','precision','double_strike','blood_harvest','crimson_onslaught'],families:['fury','blood'],armor:'Leather',weapons:['Daggers','Bow'],style:'mixed',preparedTargets:['red_guillotine'],healAt:.42,retreatAt:.25,target:'focus',shop:true},
 'cloth-battlemage':{name:'Cloth Battlemage',risk:0,targets:['element_choice','arcane_focus','mana_spring','runic_shield','guarded_block','arcane_bastion'],families:['arcane','aegis'],element:'fire',armor:'Cloth',weapons:['Wand','Staff'],style:'mixed',preparedTargets:['arcane_bastion'],healAt:.61,retreatAt:.39,target:'mechanics',shop:true},
 'hexblade-hybrid':{name:'Hexblade Hybrid',risk:1,targets:['corrupting_touch','arcane_focus','mana_spring','arcane_resonance','hex_bolt','arcane_surge','arcane_mastery'],families:['decay','arcane'],armor:'Leather',weapons:['Sword','Daggers','Wand'],offhands:['Daggers','Orb','Tome'],style:'mixed',preparedTargets:['grave_bloom'],healAt:.5,retreatAt:.29,target:'mechanics',shop:true},
 // New catalog-aware agents exist alongside old frozen Stage 6.5 profiles.
 // Their point progression and gear are strictly earned, never injected.
 ...Object.fromEntries(Object.entries(PLANNER.BUILDS).map(([id,build])=>[
  'smart-'+id,Object.freeze({name:'Strategic '+id,plan:id,risk:build.primary==='fury'?1:0,
   targets:[],families:[build.primary,...[build.secondary,build.third].filter(Boolean)],
   preparedTargets:[...(build.milestones||[])],element:build.element||undefined,
   armor:build.armor,weapons:[...build.weapons],style:build.mix?'mixed':'focused',
   healAt:(build.primary==='aegis'||build.primary==='radiance')?0.69:0.59,retreatAt:.38,
   target:build.primary==='fury'?'focus':'mechanics',shop:true})
 ]))
});
// A single deliberate retraining after two unsuccessful attempts at the same E.
// Uses the game's free full reset; it never creates XP or talent points.
const PIVOTS=Object.freeze({
 cautious:{targets:['quick_hands','bleeding_edge','deep_cuts'],families:['fury','blood'],preparedTargets:['red_guillotine']},
 balanced:{targets:['strong_heart','guarded_block','renewal'],families:['radiance','aegis'],preparedTargets:['last_bastion']},
 daring:{targets:['guarded_block','barrier_pulse','strong_heart'],families:['aegis','radiance'],preparedTargets:['last_bastion']},
 'arcane-fire':{targets:['element_choice','arcane_focus','mana_spring','deep_winter','frost_spread'],element:'frost'},
 'arcane-frost':{targets:['element_choice','arcane_focus','mana_spring','overcharge','forked_lightning'],element:'lightning'},
 'arcane-lightning':{targets:['element_choice','arcane_focus','mana_spring','kindling','fire_spread'],element:'fire'}
});
function pivotProfile(id){return {...PROFILES[id],...PIVOTS[id],variantId:id+'-pivot'};}
const DEFAULTS=Object.freeze({seeds:[9101,9201],profiles:['cautious','balanced'],maxLevel:8,maxAttempts:6,maxTotalAttempts:null,tickLimit:4500,maxRooms:34,output:'reports/v013-stage93-natural-e1-e8.json'});
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const POLICY_MODES=Object.freeze({
 'risk-aware':{realm:false,rooms:false,targets:false,retreat:false},
 adaptive:{realm:true,rooms:true,targets:true,retreat:true},
 // Native-account targeting/route ablations: all else remains identical.
 'adaptive-no-targets':{realm:true,rooms:true,targets:false,retreat:true},
 'adaptive-no-rooms':{realm:true,rooms:false,targets:true,retreat:true},
 'adaptive-realms':{realm:true,rooms:false,targets:false,retreat:false},
 'adaptive-rooms':{realm:false,rooms:true,targets:false,retreat:false},
 'adaptive-targets':{realm:false,rooms:false,targets:true,retreat:false},
 'adaptive-retreat':{realm:false,rooms:false,targets:false,retreat:true},
 legacy:{realm:false,rooms:false,targets:false,retreat:false}
});
function policyFlags(name){const flags=POLICY_MODES[name];if(!flags)throw Error('Unknown simulation decision policy: '+name);return flags;}
const round=(n,places=2)=>Number(Number(n).toFixed(places));
function parseArgs(args=[]){
 const v={...DEFAULTS,seeds:[...DEFAULTS.seeds],profiles:[...DEFAULTS.profiles]};
 for(const arg of args){
  const m=/^--([a-z-]+)=(.+)$/.exec(arg);if(!m)throw Error('Expected --key=value: '+arg);
  const [,k,value]=m;
  if(k==='seeds'){v.seeds=[...new Set(value.split(',').map(Number))];if(!v.seeds.length||v.seeds.some(x=>!Number.isSafeInteger(x)||x<1))throw Error('Invalid seeds');}
  else if(k==='profiles'){v.profiles=[...new Set(value.split(','))];if(!v.profiles.length||v.profiles.some(x=>!PROFILES[x]))throw Error('Invalid profiles');}
  else if(k==='max-level'){v.maxLevel=Number(value);if(!Number.isInteger(v.maxLevel)||v.maxLevel<1||v.maxLevel>20)throw Error('Levels are E1–E20 only');}
  else if(k==='max-attempts'){v.maxAttempts=Number(value);if(!Number.isInteger(v.maxAttempts)||v.maxAttempts<1||v.maxAttempts>36)throw Error('Max attempts must be 1–36');}
  else if(k==='max-total-attempts'){v.maxTotalAttempts=Number(value);if(!Number.isInteger(v.maxTotalAttempts)||v.maxTotalAttempts<1||v.maxTotalAttempts>400)throw Error('Total attempt budget must be 1–400');}
  else if(k==='tick-limit'){v.tickLimit=Number(value);if(!Number.isInteger(v.tickLimit)||v.tickLimit<100||v.tickLimit>100000)throw Error('Invalid tick limit');}
  else if(k==='out'&&value.endsWith('.json'))v.output=value;
  else throw Error('Unsupported option: '+arg);
 }
 const potential=v.seeds.length*v.profiles.length*Math.min(v.maxAttempts*v.maxLevel,v.maxTotalAttempts||Infinity);
 if(potential>(v.maxLevel<=8&&v.maxAttempts<=12?192:10000))throw Error('Natural cohort too large. Narrow the pilot.');
 return v;
}
// Strategic valuation of actual item affixes; these are decision weights,
// never invented gameplay stats. Archetype alignment matters but cannot turn a
// Common E1 item into a forged higher-tier item.
// Optional 9F research policy uses actual equipped stats/owned nodes as decision context.
// Scoring remains a heuristic and never changes native gear or grants a legendary.
function synergyGearBonus(item,profile,slot){
 const c=profile.synergyContext||{},stats=c.stats||{},owned=new Set(c.nodes||[]);
 const families=profile.families||[],has=f=>owned.has('affinity_'+f)||families.includes(f);
 const weapon=slot==='weapon'?item.subtype:c.weapon,off=slot==='offhand'?item.subtype:c.offhand;
 const caster=['Staff','Wand'].includes(weapon),rot=has('decay'),magic=has('arcane'),aegis=has('aegis'),blood=has('blood'),fury=has('fury'),radiance=has('radiance');
 const spellUser=caster||rot||magic||aegis||off==='Orb',manaUser=caster||rot||magic;
 const hasGuard=off==='Shield'||stats.blockChance>0||aegis;
 const critSynergy=blood||fury||owned.has('sanguine_fury')||owned.has('brutal_crit')||owned.has('adrenaline');
 let value=0;
 // Guard gear contributes only after Shield or an actual talent unlock enables Guard.
 value+=Number(item.blockBonus||0)*(hasGuard?(off==='Shield'?2.5:1.7):-2);
 value+=Number(item.critBonus||0)*(critSynergy&&stats.crit<95?2.2:stats.crit>=100?-2:.25);
 value+=Number(item.spell||0)*(spellUser?(rot?2.1:aegis?1.1:.4):-1.4);
 if(rot){const physical=!caster;value+=Number(item.atk||0)*(physical?2.2:.15)+Number(item.str||0)*(physical?1.3:0)+Number(item.int||0)*1.8+Number(item.mana||0)*.35;}
 value+=Number(item.manaRegenBonus||0)*(manaUser?8:-15);
 value+=Number(item.wardBonus||0)*(aegis||off==='Orb'?36:0);
 value+=Number(item.spd||0)*(fury||blood?1.8:0);
 if(slot==='offhand'&&off==='Shield'&&aegis)value+=5;
 if(slot==='offhand'&&off==='Tome'&&manaUser)value+=4;
 if(slot==='offhand'&&off==='Orb'&&spellUser)value+=4;
 if(slot==='offhand'&&off==='Charm'&&(blood||radiance))value+=5;
 if(slot==='offhand'&&profile.offhands?.length)value+=profile.offhands.includes(off)?15:-8;
 // Signature value is provisional and conditional, not rarity-only or a claimed DPS estimate.
 const signature={
  'crimson-fang':blood?14:7,'chalice-hollow-king':blood?12:0,
  gravewake:rot?14:5,'eye-of-morrow':rot?13:0,
  'graft':radiance?14:8,'heartroot-carapace':radiance?12:7,
  oathwall:hasGuard?14:0,'veil-thousand-seals':aegis?12:7,
  kingsbreaker:fury?14:9,'tempest-talon':critSynergy?14:4,
  astrafall:caster||magic?14:0,voidglass:caster||magic?14:0
 };
 if(item.rarity==='Legendary')value+=signature[item.legendaryId]||0;
 return value;
}
function refreshSynergyContext(a,profile){
 if(!profile.synergyAudit)return;
 const s=a.state();profile.synergyContext={stats:a.baseStats(),nodes:[...s.automaticTalents.nodes],weapon:s.equip.weapon?.subtype,offhand:s.equip.offhand?.subtype};
}
function gearScore(item,profile,targetSlot=item?.slot){
 if(!item)return -1;
 // Native gear accepts Daggers in either hand. Off-hand offensive stats
 // have 50% effect. B2.3 uses independent strikes; pair utility is evaluated separately.
 const slot=targetSlot||item.slot;
 const offDagger=slot==='offhand'&&['Daggers','Off-Hand Dagger'].includes(item.subtype);
 const daggerFactor=offDagger?.5:1;
 const rarity={Common:0,Uncommon:1,Rare:2,Epic:3,Legendary:4};
 const magic=profile.families.includes('arcane'),decay=profile.families.includes('decay'),
  aegis=profile.families.includes('aegis'),radiance=profile.families.includes('radiance'),
  agile=profile.armor==='Leather',tank=profile.armor==='Plate';
 const manaUser=magic||decay||(profile.weapons||[]).some(w=>w==='Wand'||w==='Staff');
 const barrierUser=aegis||item.subtype==='Orb';
 // Decision score, NOT a hidden native buff or DPS prediction. Off-Hand
 // stat weights are counted only when the profile can use those resources.
 const offhandUtility=slot!=='offhand'?0:{
  Shield:(tank?14:7)+(aegis?4:0),
  Orb:(aegis?16:magic?14:decay?12:7)+(item.v013Trait==='ward'&&manaUser?5:0)
   +(profile.offhands?.includes('Orb')?3:0),
  Tome:(manaUser?12+(magic?5:0)+(item.v013Trait==='echoing_recall'?5:0):-10)
   +(profile.offhands?.includes('Tome')?3:0),
  Charm:11+(radiance?6:0)+(item.v013Trait==='heartbloom'?4:0),
  Daggers:profile.offhands?.includes('Daggers')?6:0,
  'Off-Hand Dagger':profile.offhands?.includes('Daggers')?6:0
 }[item.subtype]||0;
 const s=Number(item.atk||0)*daggerFactor*(agile?3.4:magic?2.1:2.8)+
  Number(item.def||0)*(tank?4.2:magic?2.1:3.2)+
  Number(item.hp||0)*(tank?.32:.24)+
  Number(item.spell||item.spellPower||0)*daggerFactor*(magic?4.1:barrierUser||decay?2.5:1.4)+
  Number(item.attack||0)*2+Number(item.armor||0)*3+
  Number(item.str||0)*daggerFactor*(tank?3.3:magic?1.1:2)+
  Number(item.end||0)*(tank?3.9:2.5)+
  Number(item.int||0)*daggerFactor*(magic?3.8:1.2)+
  Number(item.agi||0)*daggerFactor*(agile?3.7:1.3)+
  Number(item.cha||0)*daggerFactor*1.3+
  Number(item.block||0)*(tank?3.6:2)+
  Number(item.blockChance||0)*(tank?3.5:2)+
  Number(item.evasionRating||0)*(agile?2.6:1.15)+
  Number(item.wardBonus||0)*(barrierUser?21:15)+
  Number(item.manaRegenBonus||0)*(manaUser?15:0)+
  Number(item.mana||0)*(manaUser?1.5:0)+Number(item.spd||0)*daggerFactor*(agile?2:1.4);
 const armor=item.armorType||(['Cloth','Leather','Plate'].includes(item.subtype)?item.subtype:null);
 const isArmor=['helm','armor','gloves','boots','belt'].includes(slot);
 const alignment=isArmor&&armor===profile.armor?7:isArmor&&armor&&armor!==profile.armor?-3:0;
 const weapon=slot==='weapon'&&profile.weapons?.includes(item.subtype)?9:
  slot==='weapon'&&profile.weapons?.length?-5:0;
 const baseline=round(s+Number(item.tier||1)*.5+(rarity[item.rarity]||0)*1.5+
  alignment+weapon+offhandUtility+Number(item.critBonus||0)*(agile?2.5:1.8)+
  Number(item.blockBonus||0)*(tank?2.5:1.2));
 const adjusted=baseline+(profile.synergyAudit?synergyGearBonus(item,profile,slot):0);
 return profile.plan?PLANNER.evaluateGear(item,profile,adjusted,slot):adjusted;
}
// Stage 6.48C.1: research-only identity priority, not a gameplay stat.
function identityMatch(item,profile,slot){
 if(!profile.strictResearchIdentity)return null;
 const choices=slot==='weapon'?profile.weapons:slot==='offhand'?profile.offhands:
  ['helm','armor','gloves','boots','belt'].includes(slot)?[profile.armor]:null;
 if(!choices?.length)return null;
 const type=slot==='offhand'&&item?.subtype==='Off-Hand Dagger'?'Daggers':
  ['helm','armor','gloves','boots','belt'].includes(slot)?item?.armorType||item?.subtype:item?.subtype;
 return !!item&&choices.includes(type);
}
function identityGain(item,prior,profile,slot){
 const gain=gearScore(item,profile,slot)-gearScore(prior,profile,slot);
 const next=identityMatch(item,profile,slot),before=identityMatch(prior,profile,slot);
 if(next===false&&before===true)return -1000000;
 if(next===true&&before!==true)return Math.max(10,gain);
 return gain;
}
function identityPurchase(item,profile,slot){return identityMatch(item,profile,slot)!==false;}
// B1.2C.2 candidate policy. Match the native isTwoHanded predicate.
// Legal temporary loot remains available; do not BUY or CRAFT a blocked slot.
const TWO_HAND_WEAPONS=new Set(['Two-Handed','Bow','Staff']);
const decisionQuality=p=>p?.agentDecisionQuality==='b12c2-v1';
// B1.2C.3 isolates the off-hand compatibility gate from other B1.2C.2 changes.
const compatibilityGuard=p=>decisionQuality(p)||p?.agentCompatibilityOnly===true;
const adaptiveCommitment=p=>p?.adaptiveEquipment==='b12c4-v1';
// Pure B1.2C.5 factors: keep all extra F target enumeration and
// purchase rechecks off. The legacy F bundle remains unchanged.
const softIdentityEnabled=p=>adaptiveCommitment(p)||['identity','both'].includes(p?.decisionIsolation);
const handPairEnabled=p=>adaptiveCommitment(p)||['hands','both'].includes(p?.decisionIsolation);
const isolatedAdaptive=p=>softIdentityEnabled(p)||handPairEnabled(p);
// Add bounded identity preference to B's existing score; never prohibit
// otherwise legal gear. Count only actually owned native nodes, not goals.
function commitmentWeight(profile){
 const nodes=profile.adaptiveNodes||[],owned=new Set(nodes.map(x=>x.replace(/_rank\d+$/,'')));
 const families=profile.families||[];
 if(!families.some(f=>owned.has('affinity_'+f)))return 0;
 const points=nodes.length;
 return points<=5?0:points<=10?5:points<=20?10:15;
}
function commitmentBonus(item,profile,slot,weapon=null){
 if(!item||profile.decisionIsolation==='hands')return 0;
 const weight=commitmentWeight(profile),type=item.subtype==='Off-Hand Dagger'?'Daggers':item.subtype;
 if(slot==='weapon')return profile.weapons.includes(type)?weight:0;
 if(['helm','armor','gloves','boots','belt'].includes(slot))return (item.armorType||item.subtype)===profile.armor?weight*.4:0;
 if(slot!=='offhand')return 0;
 if(profile.offhands?.includes(type))return weight*.6;
 if(profile.preferDualDaggers&&type==='Daggers'&&weapon?.subtype==='Daggers'&&profile.adaptiveNodes?.includes('affinity_fury'))return weight*.6;
 return 0;
}
// Compare equipped hand pairs under the same owned nodes and score context.
// No unowned future offhand is credited; displaced item is not destroyed.
// Score is an agent heuristic, never damage or actual projected native stats.
// B2.3: modest bounded heuristic; never add fictional stats or force a Dagger.
// Estimate its own strike rate and relative damage contribution; credit only
// owned status skills (not goals), and current Mana/recovery for paid Rot.
function offhandPairUtility(weapon,off,profile){
 if(profile?.offhandPolicy!=='b23'||!weapon||!['Daggers','Off-Hand Dagger'].includes(off?.subtype)||TWO_HAND_WEAPONS.has(weapon.subtype))return 0;
 const stats=profile.synergyContext?.stats||{},nodes=new Set((profile.adaptiveNodes||profile.synergyContext?.nodes||[]).map(id=>id.replace(/_rank\d+$/,'')));
 const raw=GEAR_STATS.attackSpeed(weapon.subtype,stats.agi,stats.spdFlat,stats.int),rate=GEAR_STATS.offhandDaggerRate({...stats,main:weapon,off,rawAttackSpeed:raw,attacksPerSec:raw});
 const ap=Math.max(1,Number(stats.attack)||15),sp=Math.max(0,Number(stats.spellPower)||0);
 const nominal=['Wand','Staff'].includes(weapon.subtype)&&stats.mana>0?Math.max(1,sp*1.05):ap*({Sword:1.12,Mace:1.4,Daggers:.8,Wand:.55}[weapon.subtype]||1);
 const relative=(ap*.4*rate)/Math.max(1,nominal*raw);
 let utility=Math.min(8,relative*12);
 if(nodes.has('bleeding_edge'))utility+=Math.min(3,rate*.42*12);
 if(nodes.has('corrupting_touch')&&stats.mana>0&&stats.manaRegen>0)utility+=Math.min(3,rate*.42*12,stats.manaRegen*1.5);
 return round(Math.min(14,utility));
}
function handPairScore(equip,profile){
 const weapon=equip?.weapon||null,off=TWO_HAND_WEAPONS.has(weapon?.subtype)?null:equip?.offhand||null;
 const p={...profile,synergyContext:{...profile.synergyContext,weapon:weapon?.subtype,offhand:off?.subtype,nodes:profile.adaptiveNodes||[]}};
 return (weapon?gearScore(weapon,p,'weapon')+commitmentBonus(weapon,p,'weapon'):0)
  +(off?gearScore(off,p,'offhand')+commitmentBonus(off,p,'offhand',weapon):0)+offhandPairUtility(weapon,off,p);
}
function adaptiveGearGain(item,profile,slot,equip){
 if(!item)return -Infinity;
 const prior=equip?.[slot];
 if(slot==='offhand'&&TWO_HAND_WEAPONS.has(equip?.weapon?.subtype))return -Infinity;
 if(slot==='weapon'||slot==='offhand'){
  const next={...equip,[slot]:item};
  if(slot==='weapon'&&TWO_HAND_WEAPONS.has(item.subtype))next.offhand=null;
  return handPairScore(next,profile)-handPairScore(equip,profile);
 }
 return gearScore(item,profile,slot)-gearScore(prior,profile,slot)
  +commitmentBonus(item,profile,slot)-commitmentBonus(prior,profile,slot);
}
function refreshAdaptiveNodes(a,profile){
 if(isolatedAdaptive(profile))profile.adaptiveNodes=[...(a.state().automaticTalents?.nodes||[])];
}
// For pure cells, non-hand slots retain B's score unless the identity
// factor is active. No global context refresh, extra target or merchant recheck.
function isolatedGearGain(item,profile,slot,equip){
 if(handPairEnabled(profile)&&(slot==='weapon'||slot==='offhand'))return adaptiveGearGain(item,profile,slot,equip);
 const prior=equip?.[slot],gain=identityGain(item,prior,profile,slot);
 if(!softIdentityEnabled(profile))return gain;
 const weapon=equip?.weapon;
 return gain+commitmentBonus(item,profile,slot,weapon)-commitmentBonus(prior,profile,slot,weapon);
}
function merchantDecisionTargets(item,profile){
 if(profile.decisionIsolation==='ring'&&['ring1','ring2'].includes(item?.slot))return ['ring1','ring2'];
 return adaptiveCommitment(profile)?adaptiveTargets(item,profile):decisionQuality(profile)?gearDecisionTargets(item,profile):[item?.slot];
}
function adaptiveTargets(item,profile){
 if(['ring1','ring2'].includes(item.slot))return ['ring1','ring2'];
 if((profile.offhands?.includes('Daggers')||profile.preferDualDaggers)&&['Daggers','Off-Hand Dagger'].includes(item.subtype))
  return item.subtype==='Off-Hand Dagger'?['offhand']:['weapon','offhand'];
 return [item.slot];
}
function gearDecisionTargets(item,profile){
 if(['ring1','ring2'].includes(item.slot))return ['ring1','ring2'];
 if(decisionQuality(profile)&&profile.offhands?.includes('Daggers')&&['Daggers','Off-Hand Dagger'].includes(item.subtype))
  return item.subtype==='Off-Hand Dagger'?['offhand']:['weapon','offhand'];
 return [item.slot];
}
function investmentAllowed(item,profile,slot,equip){
 if(!identityPurchase(item,profile,slot))return false;
 if(!compatibilityGuard(profile))return true;
 if(slot==='offhand'&&(TWO_HAND_WEAPONS.has(equip?.weapon?.subtype)||
   (profile.weapons?.length&&profile.weapons.every(w=>TWO_HAND_WEAPONS.has(w)))))return false;
 return true;
}
function investmentGain(item,profile,slot,equip,a=null){
 if(!investmentAllowed(item,profile,slot,equip))return -Infinity;
 if(a){const g=EQUIPMENT_AI.gain(a,profile,item,slot,equip);if(g!==null)return g;}
 if(adaptiveCommitment(profile))return adaptiveGearGain(item,profile,slot,equip);
 if(isolatedAdaptive(profile))return isolatedGearGain(item,profile,slot,equip);
 const prior=equip?.[slot],gain=identityGain(item,prior,profile,slot);
 // Same displacement check as equipEarned; a deliberate identity transition
 // can replace a temporary off-hand, but a tiny stat upgrade may not.
 if(decisionQuality(profile)&&slot==='weapon'&&TWO_HAND_WEAPONS.has(item.subtype)&&equip?.offhand&&
   !(identityMatch(item,profile,slot)===true&&identityMatch(prior,profile,slot)!==true)&&
   gain<gearScore(equip.offhand,profile)*.6+5)return -Infinity;
 return gain;
}
function gearSnapshot(a){
 const items=Object.values(a.state().equip).filter(Boolean);
 return {total:items.length,starter:items.filter(x=>x.startingGear).length,
  rarity:Object.fromEntries([...new Set(items.map(x=>x.rarity))].sort().map(r=>[r,items.filter(x=>x.rarity===r).length])),
  items:items.map(x=>({slot:x.slot,subtype:x.subtype,armorType:x.armorType||null,
   name:x.name,rarity:x.rarity,tier:x.tier,startingGear:!!x.startingGear,
   source:x.source||null,crafted:!!x.crafted,recipeId:x.recipeId||null,v013Trait:x.v013Trait||null,legendaryId:x.legendaryId||null,
   stats:Object.fromEntries(['atk','def','hp','spd','str','agi','int','end','cha','mana',
    'spell','evasionRating','critBonus','blockBonus','manaRegenBonus','wardBonus']
    .map(key=>[key,Number(x[key])||0]))}))};
}
// Current v15 graph has no T.path helper; walk its real prerequisites and let
// T.allocate enforce every purchase, point cap, rank and exclusion.
// Use the same native graph route planner for explicit profiles and smart profiles.
function profilePlan(profile,progress){
 return {primary:profile.families[0],secondary:profile.families[1],mix:profile.style!=='focused'&&profile.families.length>1,element:profile.element||progress.element||'arcane',weapons:profile.weapons,focus:{blood:'bleed',fury:'speed',arcane:'spell',decay:'rot',aegis:'defense',radiance:'defense'}[profile.families[0]],milestones:profile.targets||[]};
}
function spendEarnedTalents(a,profile){
 const T=a.talents,s=a.state(),before=s.automaticTalents;
 if(!T.valid(before))throw Error('Invalid natural talent account before spending');
 if(!a.talentActions?.available())throw Error('Talents may only be changed in Camp');
 let progress=before;const bought=[],elements=[];
 const targets=[...(profile.targets||[]),...(profile.preparedTargets||[]),...profile.families.map(x=>'affinity_'+x),...profile.families.map(x=>'root_'+x)];
 function tuneElement(){
  if(!profile.element||!progress.nodes.includes('element_choice')||(progress.element||'arcane')===profile.element)return;
  if(!a.talentActions.element(profile.element))throw Error('Native element choice rejected: '+profile.element);
  progress=s.automaticTalents;elements.push(profile.element);
 }
 for(let attempts=0;attempts<40&&T.earned(progress)>progress.nodes.length;attempts++){
  tuneElement();
  let changed=false;
  for(const target of targets){
   const route=PLANNER.routeTo(T,progress,target,profilePlan(profile,progress),profile.families);if(!route?.length)continue;
   if(!a.talentActions.allocate(route[0]))continue;
   progress=s.automaticTalents;bought.push(route[0]);changed=true;break;
  }
  if(!changed){
   const plan=profilePlan(profile,progress);
   const legal=T.NODES.filter(n=>!n.pending&&!progress.nodes.includes(n.id)&&(!n.family||profile.families.includes(n.family))&&(!n.pair||(plan.mix&&n.pair.every(f=>profile.families.includes(f))))&&
    (!n.element||n.element===(progress.element||'arcane'))&&T.allocate(progress,n.id));
   if(profile.synergyAudit){const focus={blood:'bleed',fury:'speed',arcane:'spell',decay:'rot',aegis:'defense',radiance:'defense'}[profile.families[0]],plan={primary:profile.families[0],secondary:profile.families[1],focus,element:profile.element,mix:profile.families.length>1,milestones:profile.targets||[],statContext:profile.synergyContext?.stats||{}};legal.sort((a,b)=>PLANNER.scoreNode(b,plan,profile.families)-PLANNER.scoreNode(a,plan,profile.families)||a.id.localeCompare(b.id));}
   const alt=legal[0];
   if(!alt)break;
   if(!a.talentActions.allocate(alt.id))throw Error('Native talent allocation rejected '+alt.id);
   progress=s.automaticTalents;bought.push(alt.id);
  }
 }
 tuneElement();
 if(!T.valid(progress)||progress.xp!==before.xp)throw Error('Natural talent spending forged XP');
 return {bought,elements,earned:T.earned(progress),spent:progress.nodes.length,xp:progress.xp};
}
function spendEarnedAttributes(a,profile){
 const T=a.talents,s=a.state(),before=s.automaticTalents;
 if(!T.valid(before)||!a.talentActions?.available())throw Error('Attributes require valid Camp state');
 const first=profile.families[0]||'blood';
 const rotations={
  blood:['str','str','end','str','cha'],
  fury:['agi','agi','str','agi','cha'],
  radiance:['end','end','str','end','cha'],
  aegis:['end','end','int','end','str'],
  arcane:['int','int','end','int','cha'],
  decay:['int','int','agi','int','end']};
 const caster=['Wand','Staff'].includes(profile.weapons?.[0]);
 const order=first==='decay'&&!caster?['str','int','end','int',profile.weapons?.[0]==='Daggers'?'agi':'str']:rotations[first]||rotations.blood;
 const choices=[];
 while(T.availableAttributes(s.automaticTalents)>0){
  const spent=T.spentAttributes(s.automaticTalents),ranked=EQUIPMENT_AI.attributes(profile)?EQUIPMENT_AI.attributeChoices(a,profile):[],best=ranked[0],key=best?.key||order[spent%order.length];
  if(!a.talentActions.attribute(key))throw Error('Native attribute purchase rejected '+key);
  if(best){const actual=EQUIPMENT_AI.utility(a,profile,s.equip,Math.max(1,a.controller().state.unlocked||1));EQUIPMENT_AI.trace(profile,{phase:'attributes',kind:'attribute',key,gain:best.gain,expected:best.score,actual,projectionMatch:Math.abs(actual-best.score)<1e-6,alternatives:ranked});}
  choices.push(key);
 }
 if(s.automaticTalents.xp!==before.xp||!T.valid(s.automaticTalents))
  throw Error('Natural attribute spending forged XP or state');
 return {chosen:choices,spent:T.spentAttributes(s.automaticTalents),unspent:T.availableAttributes(s.automaticTalents)};
}
function prepareEarnedAbility(a,profile){
 const T=a.talents,p=a.state().automaticTalents;
 if(!T.valid(p))throw Error('Invalid talent progress for prepared ability');
 const all=new Map(T.NODES.map(n=>[n.id,n]));
 const available=p.nodes.filter(id=>all.get(id)?.advanced);
 const preferred=(profile.preparedTargets||[]).find(id=>available.includes(id));
 const eligible=id=>{const n=all.get(id);return n&&!n.pending&&(!n.family||profile.families.includes(n.family))&&(!n.pair||n.pair.every(f=>profile.families.includes(f)));};
 const chosen=(preferred&&eligible(preferred)?preferred:null)||available.find(eligible)||null;
 if(chosen===p.prepared||(!chosen&&!p.prepared))return chosen;
 if(!a.talentActions.prepare(chosen))throw Error('Native prepared ability rejected '+chosen);
 if(a.state().automaticTalents.prepared!==chosen)throw Error('Native prepared ability did not persist');
 return chosen;
}
function handGain(a,profile,item,slot){const equip=a.state().equip,prior=equip[slot];const g=EQUIPMENT_AI.gain(a,profile,item,slot,equip);return g!==null?g:adaptiveCommitment(profile)?adaptiveGearGain(item,profile,slot,equip):isolatedAdaptive(profile)?isolatedGearGain(item,profile,slot,equip):identityGain(item,prior,profile,slot);}
function handTargets(item,profile){return EQUIPMENT_AI.full(profile)?EQUIPMENT_AI.gearTargets(item):EQUIPMENT_AI.enabled(profile)&&['weapon','offhand'].includes(item?.slot)?EQUIPMENT_AI.targets(item):null;}
function equipEarned(a,profile,between=false){
 const actions=[];
 if(decisionQuality(profile))refreshSynergyContext(a,profile);
 refreshAdaptiveNodes(a,profile);
 const source=between?a.bag.items().filter(x=>x.kind!=='valuable'):[...a.state().stash];
 // Rank visible native items, re-checking after each actual equip.
 const items=[...source].filter(x=>x?.slot&&x.id).sort((x,y)=>gearScore(y,profile)-gearScore(x,profile));
 // The adaptive arm revisits visible hand items after each accepted change;
 // no transaction is made without a positive single-step gain.
 if(EQUIPMENT_AI.stable(profile)&&a.state().equip.weapon){
  const phase=between?'bag':'stash',handItems=()=> (between?a.bag.items().filter(x=>x.kind!=='valuable'):a.state().stash).filter(x=>x?.id&&['weapon','offhand'].includes(x.slot));
  const choices=EQUIPMENT_AI.plans(a,profile,handItems(),between),best=choices.find(x=>x.gain>=x.minimum);
  EQUIPMENT_AI.trace(profile,{phase,kind:'opportunities',candidates:choices.map(x=>({ids:x.steps.map(y=>y.item.id),subtypes:x.steps.map(y=>y.item.subtype),gain:x.gain,minimum:x.minimum}))});
  if(best){
   const start={...a.state().equip},before=EQUIPMENT_AI.key(start),level=Math.max(1,a.controller().state.unlocked||1);let completed=true;
   for(const {item,slot:target} of best.steps){
    const prior=a.state().equip[target],weaponAtDecision=a.state().equip.weapon?.subtype||null,oldKey=EQUIPMENT_AI.key(a.state().equip),ok=a.equip(item.id,target);
    EQUIPMENT_AI.trace(profile,{phase,kind:'equip',id:item.id,subtype:item.subtype,slot:target,gain:best.gain,accepted:!!ok,weaponAtDecision,from:oldKey,to:EQUIPMENT_AI.key(a.state().equip),planSize:best.steps.length});
    if(!ok){completed=false;break;}
    actions.push({slot:target,item:item.name,rarity:item.rarity,previous:prior?.name||null,gain:round(best.gain),subtype:item.subtype,trait:item.v013Trait||null,previousSubtype:prior?.subtype||null});
   }
   const actual=EQUIPMENT_AI.utility(a,profile,a.state().equip,level)-best.scoreBefore,expectedKey=EQUIPMENT_AI.key(best.next),actualKey=EQUIPMENT_AI.key(a.state().equip);
   EQUIPMENT_AI.trace(profile,{phase,kind:'plan',from:before,to:actualKey,expected:expectedKey,gain:best.gain,actualGain:actual,steps:best.steps.length,completed,minimum:best.minimum,projectionMatch:completed&&actualKey===expectedKey&&Math.abs(actual-best.gain)<1e-6});
   if(decisionQuality(profile))refreshSynergyContext(a,profile);
  }
 }else if(EQUIPMENT_AI.enabled(profile)){
  const handItems=()=> (between?a.bag.items().filter(x=>x.kind!=='valuable'):a.state().stash).filter(x=>x?.id&&['weapon','offhand'].includes(x.slot));
  const used=new Set();
  for(let step=0;step<6;step++){
   const choices=handItems().filter(x=>!used.has(x.id)).flatMap(item=>EQUIPMENT_AI.targets(item).map(target=>({item,target,gain:handGain(a,profile,item,target)}))).filter(x=>Number.isFinite(x.gain)).sort((x,y)=>y.gain-x.gain||String(x.item.id).localeCompare(String(y.item.id))||x.target.localeCompare(y.target));
   EQUIPMENT_AI.trace(profile,{phase:between?'bag':'stash',kind:'opportunities',candidates:choices.map(x=>({id:x.item.id,subtype:x.item.subtype,slot:x.target,gain:x.gain}))});
   const best=choices.find(x=>x.gain>=2.5);if(!best)break;
   const {item,target,gain}=best,prior=a.state().equip[target],before=a.state().equip.weapon?.subtype||null;used.add(item.id);
   const ok=a.equip(item.id,target);
   EQUIPMENT_AI.trace(profile,{phase:between?'bag':'stash',kind:'equip',id:item.id,subtype:item.subtype,slot:target,gain,accepted:!!ok,weaponAtDecision:before});
   if(ok){actions.push({slot:target,item:item.name,rarity:item.rarity,previous:prior?.name||null,gain:round(gain),subtype:item.subtype,trait:item.v013Trait||null,previousSubtype:prior?.subtype||null});if(decisionQuality(profile))refreshSynergyContext(a,profile);}
  }
 }

 if(EQUIPMENT_AI.full(profile)&&a.state().equip.weapon){
  const phase=between?'bag':'stash',used=new Set();
  for(let step=0;step<6;step++){
   const visible=(between?a.bag.items().filter(x=>x.kind!=='valuable'):a.state().stash).filter(x=>x?.id&&x.slot&&!['weapon','offhand'].includes(x.slot)&&!used.has(x.id));
   const choices=visible.flatMap(item=>EQUIPMENT_AI.gearTargets(item).map(target=>({item,target,gain:EQUIPMENT_AI.gain(a,profile,item,target)}))).filter(x=>Number.isFinite(x.gain)).sort((x,y)=>y.gain-x.gain||String(x.item.id).localeCompare(String(y.item.id))||x.target.localeCompare(y.target));
   const best=choices.find(x=>x.gain>=2.5);if(!best)break;
   const {item,target,gain}=best,prior=a.state().equip[target],level=Math.max(1,a.controller().state.unlocked||1),before=EQUIPMENT_AI.utility(a,profile,a.state().equip,level);used.add(item.id);
   const ok=a.equip(item.id,target),actual=ok?EQUIPMENT_AI.utility(a,profile,a.state().equip,level)-before:null;
   EQUIPMENT_AI.trace(profile,{phase,kind:'nonhandEquip',id:item.id,subtype:item.subtype,armorType:item.armorType||null,slot:target,gain,actualGain:actual,accepted:!!ok,projectionMatch:!ok||Math.abs(actual-gain)<1e-6});
   if(ok){actions.push({slot:target,item:item.name,rarity:item.rarity,previous:prior?.name||null,gain:round(gain)});if(decisionQuality(profile))refreshSynergyContext(a,profile);}
  }
  return actions;
 }
 for(const item of items){
  if(EQUIPMENT_AI.enabled(profile)&&['weapon','offhand'].includes(item.slot))continue;
  const offhandDagger=(profile.offhandPolicy==='b23'||profile.offhands?.includes('Daggers'))&&
   ['Daggers','Off-Hand Dagger'].includes(item.subtype);
  // Daggers can be legally equipped in either hand. Compare both native
  // slots, rather than always consuming the item in main hand first.
  const targets=adaptiveCommitment(profile)?adaptiveTargets(item,profile):['ring1','ring2'].includes(item.slot)?['ring1','ring2']:
   offhandDagger?((profile.offhandPolicy==='b23'||profile.strictResearchIdentity)&&item.subtype==='Off-Hand Dagger'?['offhand']:['weapon','offhand']):[item.slot];
  const options=targets.map(target=>{
   const prior=a.state().equip[target];
   return {target,prior,gain:adaptiveCommitment(profile)?adaptiveGearGain(item,profile,target,a.state().equip):isolatedAdaptive(profile)?isolatedGearGain(item,profile,target,a.state().equip):identityGain(item,prior,profile,target)};
  }).sort((x,y)=>y.gain-x.gain);
  for(const {target,prior,gain} of options){
   if(gain<2.5)continue;
   if(target==='offhand'&&['Two-Handed','Bow','Staff'].includes(a.state().equip.weapon?.subtype))continue;
   if(!handPairEnabled(profile)&&target==='weapon'&&['Two-Handed','Bow','Staff'].includes(item.subtype)&&a.state().equip.offhand){
    // Do not delete a strong earned shield/secondary weapon to chase a tiny weapon score.
    if(!(identityMatch(item,profile,'weapon')===true&&identityMatch(prior,profile,'weapon')!==true)&&gain<gearScore(a.state().equip.offhand,profile)*.6+5)continue;
   }
   if(a.equip(item.id,target)){actions.push({slot:target,item:item.name,rarity:item.rarity,previous:prior?.name||null,gain:round(gain),
    ...(target==='offhand'?{subtype:item.subtype,trait:item.v013Trait||null,previousSubtype:prior?.subtype||null}: {})});if(decisionQuality(profile))refreshSynergyContext(a,profile);break;}
  }
 }
 return actions;
}
function craftEarned(a,profile,level){
 const actions=[],forge=a.forge;
 if(!forge||!a.economyCanAct())return actions;
 for(let attempt=0;attempt<2;attempt++){
  const state=a.state();
  const candidates=forge.recipes.map(recipe=>{
   const progress=forge.progress(recipe.id,level);
   if(!progress?.ready)return null;
   const preview=forge.preview(recipe.id,level);
   if(!preview)return null;
   const targets=adaptiveCommitment(profile)?adaptiveTargets(preview,profile):decisionQuality(profile)?gearDecisionTargets(preview,profile):['ring1','ring2'].includes(recipe.slot)?['ring1','ring2']:[recipe.slot];
   const best=targets.filter(slot=>investmentAllowed(preview,profile,slot,state.equip)).map(slot=>({slot,gain:investmentGain(preview,profile,slot,state.equip)}))
    .sort((a,b)=>b.gain-a.gain)[0];
   return best?{...best,recipe,fragments:progress.cost.fragments}:null;
  }).filter(Boolean).filter(x=>x.gain>=5)
   .sort((a,b)=>b.gain-a.gain||a.fragments-b.fragments);
  const best=candidates[0];if(!best)break;
  const before={fragments:state.fragments,essence:state.crafting.essence};
  const item=forge.craft(best.recipe.id,level);
  if(!item)break;
  if(state.fragments!==before.fragments-best.fragments||state.crafting.essence>=before.essence)
   throw Error('Native Forge did not consume Fragments and Essence');
  const equipped=equipEarned(a,profile,false);
  actions.push({recipe:best.recipe.id,item:item.name,slot:best.slot,
   fragmentsSpent:best.fragments,essenceSpent:before.essence-state.crafting.essence,
   expectedGain:round(best.gain),equipped:equipped.some(x=>x.item===item.name)});
 }
 return actions;
}
// Compare two legal native Camp investments using expected gear-score gain per
// Camp crafting is an intentional gamble: the preview is an EXAMPLE stat roll,
// not a guaranteed attribute selection. The native Forge owns actual materials,
// RNG, inventory insertion and persistence; this agent cannot force a preferred roll.
// Read-only candidates; influence is optional and its preview is not a guaranteed roll.
function gearInvestmentCandidates(a,profile,level){
 const s=a.state(),forge=a.forge,options=[];
 if(!forge||!a.economyCanAct()||forge.canCraft&&!forge.canCraft())return options;
 const acquisition=ACQUISITION.context(a,profile);
 const efficiency=(gain,fragments,essence,reagents)=>gain/(Math.max(1,fragments)+4*Math.max(0,essence)+12*Object.values(reagents||{}).reduce((a,b)=>a+b,0));
 for(const recipe of forge.recipes){
  const base=forge.progress(recipe.id,level);if(!base?.ready)continue;
  const variants=[{influence:null,progress:base}];
  // Consider only one compatible preferred family to keep native preview work bounded.
  if(['Rare','Epic'].includes(recipe.rarity))for(const family of profile.families||[]){
   const progress=forge.progress(recipe.id,level,family);
   if(!progress?.ready||Object.entries(progress.cost.reagents).some(([f,n])=>s.crafting.cores[f]-n<1))continue;
   variants.push({influence:family,progress});break;
  }
  for(const {influence,progress} of variants){
   const example=forge.preview(recipe.id,level,influence);if(!example)continue;
   const targets=handTargets(example,profile)||(adaptiveCommitment(profile)?adaptiveTargets(example,profile):decisionQuality(profile)?gearDecisionTargets(example,profile):['ring1','ring2'].includes(recipe.slot)?['ring1','ring2']:[recipe.slot]);
   const target=targets.filter(slot=>investmentAllowed(example,profile,slot,s.equip)).map(slot=>({slot,...ACQUISITION.value(a,profile,example,slot,investmentGain(example,profile,slot,s.equip,a),acquisition,'forge')}))
    .sort((x,y)=>y.gain-x.gain)[0];
   if(target&&EQUIPMENT_AI.enabled(profile))EQUIPMENT_AI.trace(profile,{phase:'forge',kind:'offer',recipe:recipe.id,slot:target.slot,subtype:example.subtype,gain:Number.isFinite(target.gain)?target.gain:null,fragments:progress.cost.fragments,essence:progress.cost.essence,reagents:progress.cost.reagents});
   if(!target||target.gain<5)continue;
   options.push({recipe,target,influence,gain:target.gain,acquisition,fragments:progress.cost.fragments,essence:progress.cost.essence,reagents:progress.cost.reagents,efficiency:efficiency(target.gain,progress.cost.fragments,progress.cost.essence,progress.cost.reagents)});
  }
 }
 return options;
}
function investEarnedGear(a,profile,level){
 const outcome={crafted:[]},forge=a.forge;
 if(!forge||!a.economyCanAct()||forge.canCraft&&!forge.canCraft())return outcome;
 for(let attempt=0;attempt<2;attempt++){
  if(forge.canCraft&&!forge.canCraft())break;
  const s=a.state(),options=gearInvestmentCandidates(a,profile,level);
  options.sort((x,y)=>y.efficiency-x.efficiency||y.gain-x.gain);
  const best=options[0];if(!best)break;
  const before={fragments:s.fragments,essence:s.crafting.essence,cores:{...s.crafting.cores}};
  const item=forge.craft(best.recipe.id,level,best.influence);
  if(!item)throw Error('Native Forge craft rejected after valid Camp preview');
  if(s.fragments!==before.fragments-best.fragments||
     s.crafting.essence!==before.essence-best.essence||Object.keys(before.cores).some(f=>s.crafting.cores[f]!==before.cores[f]-(best.reagents[f]||0)))
   throw Error('Native Forge cost mismatch');
  const actual=EQUIPMENT_AI.enabled(profile)?handGain(a,profile,item,best.target.slot):gearScore(item,profile,best.target.slot)-gearScore(s.equip[best.target.slot],profile,best.target.slot);
  const weaponAtDecision=s.equip.weapon?.subtype||null;
  const actualEvaluation=ACQUISITION.value(a,profile,item,best.target.slot,actual,best.acquisition,'forge');
  if(ACQUISITION.risk(profile)){
   ACQUISITION.learn(a,item,best.target.slot,best.target.immediate,actual);
   EQUIPMENT_AI.trace(profile,{phase:'acquisition',kind:'forecast',source:'forge',id:item.id,rarity:item.rarity,slot:best.target.slot,subtype:item.subtype,predicted:best.target.immediate,actual:Number.isFinite(actual)?actual:null,decisionGain:best.gain,penalty:best.target.penalty,strategicGain:best.target.strategicGain,actualPackageCredit:actualEvaluation.strategicGain});
  }
  const equipped=equipEarned(a,profile,false);
  if(ACQUISITION.strategic(profile))equipped.push(...TRANSITION.execute(a,profile));
  EQUIPMENT_AI.trace(profile,{phase:'forge',kind:'craft',id:item.id,recipe:best.recipe.id,slot:best.target.slot,subtype:item.subtype,gain:best.gain,actualGain:Number.isFinite(actual)?actual:null,accepted:true,equipped:Object.values(s.equip).some(x=>x?.id===item.id),fragments:best.fragments,essence:best.essence,reagents:best.reagents});
  outcome.crafted.push({recipe:best.recipe.id,item:item.name,slot:best.target.slot,
   fragmentsSpent:best.fragments,essenceSpent:best.essence,reagentsSpent:{...best.reagents},influence:best.influence,
   estimatedGain:round(best.gain),actualRolledGain:round(actual),
   ...(compatibilityGuard(profile)?{weaponAtDecision,subtype:item.subtype}:{}),
   equipped:EQUIPMENT_AI.enabled(profile)||decisionQuality(profile)||adaptiveCommitment(profile)?Object.values(s.equip).some(x=>x?.id===item.id):equipped.some(x=>x.item===item.name)});
 }
 return outcome;
}
// Native Anchor Rune valuation is a build policy, never an additional combat stat.
// All 23 families use canonical magnitude divided by their own Common Adventurer baseline.
function runeScore(rune,profile,context=null){
 if(!rune)return -Infinity;
 const f=RUNES.FAMILIES.find(x=>x.id===rune.family);if(!f)return -Infinity;
 const families=profile.families||[],magic=families.includes('arcane'),decay=families.includes('decay'),aegis=families.includes('aegis'),blood=families.includes('blood'),radiance=families.includes('radiance'),fury=families.includes('fury'),leather=profile.armor==='Leather',plate=profile.armor==='Plate',caster=(profile.weapons||[]).some(w=>['Wand','Staff'].includes(w));
 const mana=magic||decay||caster,spell=mana||aegis||(profile.offhands||[]).includes('Orb'),guard=aegis||(profile.weapons||[]).some(w=>['Sword','Mace'].includes(w));
 const weights={might:caster?1:plate?5:3,swiftness:leather?5:2,wisdom:spell?5:1,fortitude:plate?5:3,fortune:2,fury:caster?2:4,warding:plate?5:3,radiance:4,
 execution:fury?6:3,devastation:fury?6:3,haste:fury||blood?6:3,assault:caster?2:5,archmage:spell?6:0,abyss:mana?5:0,clarity:mana?6:0,efficiency:mana?5:0,corruption:blood||decay||profile.element==='fire'?6:1,bastion:aegis||decay?6:1,renewal:radiance?6:blood?4:2,phantom:leather?6:3,bulwark:plate?6:3,heart:radiance||aegis?6:4,guard:guard?6:0};
 const magnitude=RUNES.runeValue(f.id,rune.tier,RUNES.rarity(rune))/f.base;
 if(!context)return round((weights[f.id]||0)*magnitude,3);
 const {base,projected,nodes,weapon,offhand,evasionGain}=context,owned=new Set(nodes||[]),has=id=>owned.has(id);
 const actualDecay=has('affinity_decay')&&['corrupting_touch','blightburst','corruption_cycle','corruption_nova','rotguard','grave_bloom'].some(has);
 const actualBlood=has('affinity_blood')||has('bleeding_edge'),actualFire=has('affinity_arcane')&&context.element==='fire';
 const actualCaster=['Wand','Staff'].includes(weapon),actualMana=base.mana>0,actualBarrier=offhand==='Orb'||has('affinity_aegis')||has('rotguard')||has('runic_shield')||has('overflowing_life');
 const actualHeal=has('affinity_radiance')||has('blood_drinker')||has('blood_harvest')||offhand==='Charm';
 const actualCycle=has('corruption_cycle'),actualOverflow=has('corruption_nova');
 const key={atkFlat:'attack',defFlat:'defense',hpFlat:'maxhp'}[f.field]||f.field;
 const delta=Number(projected[key])-Number(base[key]);
 if(!(delta>0))return 0;
 const expected=RUNES.runeValue(f.id,rune.tier,RUNES.rarity(rune));
 const effective=f.kind==='percent'?delta/Math.max(.01,Number(base[key])*expected):f.kind==='flat'&&['atkFlat','defFlat','hpFlat'].includes(f.field)?1:delta/Math.max(.00001,expected);
 const efficiency=Math.min(1,Math.max(0,effective));
 if(['abyss','clarity','efficiency'].includes(f.id)&&!actualMana)return 0;
 if(f.id==='archmage'&&!(actualCaster||actualDecay||has('affinity_arcane')||actualBarrier))return 0;
 if(f.id==='bastion'&&!actualBarrier||f.id==='renewal'&&!actualHeal||f.id==='corruption'&&!(actualDecay||actualBlood||actualFire))return 0;
 if(f.id==='phantom'&&!(evasionGain>0))return 0;
 if(f.id==='corruption')weights.corruption=actualDecay?8:actualBlood||actualFire?6:0;
 if(actualDecay){weights.wisdom=7;weights.archmage=7;weights.might=actualCaster?1:6;weights.fury=actualCaster?1:6;weights.assault=actualCaster?1:6;weights.haste=actualCycle?6:4;weights.clarity=actualCycle||actualOverflow?8:6;weights.efficiency=actualCycle||actualOverflow?7:5;weights.abyss=5;}
 if(actualCaster){weights.fury=1;weights.might=1;weights.assault=1;}
 if(base.blockChance>0)weights.guard=6;
 if(actualMana){weights.abyss=Math.max(4,weights.abyss);weights.clarity=Math.max(5,weights.clarity);weights.efficiency=Math.max(4,weights.efficiency);}
 if(actualBarrier)weights.bastion=6;
 if(actualHeal)weights.renewal=6;
 if(projected.spellPower>base.spellPower&&(actualCaster||actualDecay||has('affinity_arcane')||actualBarrier))weights.archmage=6;
 if(f.id==='phantom')return round(weights.phantom*magnitude*Math.min(1,evasionGain/Math.max(.01,expected*.4)),3);
 return round((weights[f.id]||0)*magnitude*efficiency,3);
}
function manageEarnedRunes(a,profile,{equip=true}={}){
 const s=a.state(),actions=[];
 if(!a.economyCanAct())return actions;
 const base=a.baseStats(s.equip,[],[]),nodes=s.automaticTalents.nodes,weapon=s.equip.weapon?.subtype,offhand=s.equip.offhand?.subtype;
 const level=Math.max(1,a.controller().state.unlocked||1),scores=new Map();
 const score=r=>{
  if(scores.has(r.id))return scores.get(r.id);
  const projected=a.baseStats(s.equip,[r],[r.id]);
  const evasionGain=a.gear.evasionChance(projected.evasionRating,level)-a.gear.evasionChance(base.evasionRating,level);
  const result=runeScore(r,profile,{base,projected,nodes,weapon,offhand,element:s.automaticTalents.element,evasionGain});
  scores.set(r.id,result);return result;
 };
 const available=(equip?[...s.runes]:[]).filter(r=>r?.id&&score(r)>0).sort((x,y)=>score(y)-score(x)||y.tier-x.tier||x.id.localeCompare(y.id));
 const used=new Set(),desired=[];
 for(const rune of available){
  if(used.has(rune.family))continue;
  used.add(rune.family);desired.push(rune);
  if(desired.length===3)break;
 }
 for(let i=0;i<3;i++){
  const current=s.runeSlots[i],wanted=desired[i]?.id||null;
  if(current===wanted)continue;
  if(current!==null){
   if(!a.runes.unequip(i))throw Error('Native Rune unequip rejected in Camp');
   actions.push({action:'unequip',slot:i,id:current});
  }
 }
 for(let i=0;i<desired.length;i++){
  const rune=desired[i];
  if(s.runeSlots[i]===rune.id)continue;
  if(!a.runes.equip(rune.id,i))throw Error('Native Rune equip rejected in Camp');
  actions.push({action:'equip',slot:i,id:rune.id,family:rune.family,score:score(rune),rarity:RUNES.rarity(rune),tier:rune.tier,value:RUNES.runeValue(rune.family,rune.tier,RUNES.rarity(rune))});
 }
 if(JSON.stringify(s.runeSlots)!==JSON.stringify(Array.from({length:3},(_,i)=>desired[i]?.id||null)))throw Error('Native Rune final slot mismatch');
 // Native recycling never destroys an equipped or strongest rune per family.
 if(s.runes.length>5){
  const before={count:s.runes.length,fragments:s.fragments};
  if(a.runes.recycle()){
   a.runes.confirm();
   if(s.runes.length>=before.count||s.fragments<=before.fragments)
    throw Error('Native Rune recycling did not settle');
   actions.push({action:'recycle',count:before.count-s.runes.length,fragments:s.fragments-before.fragments});
  }
 }
 return actions;
}
// Agent scores are heuristics, not combat formulas. All doses and prices are native.
function potionScore(kind,profile,vitals={}){
 const families=profile.families||[],magic=families.includes('arcane'),dot=families.some(f=>['blood','decay'].includes(f)),manaUser=magic||families.includes('decay')||profile.weapons?.some(w=>['Wand','Staff'].includes(w)),leather=profile.armor==='Leather',plate=profile.armor==='Plate';
 const hpRatio=vitals.maxhp?Math.max(0,vitals.hp)/vitals.maxhp:1, manaRatio=vitals.maxmp?Math.max(0,vitals.mp)/vitals.maxmp:1;
 const score={health:hpRatio<.65?92:75,mana:manaUser?(manaRatio<.5?70:51):12,
  might:magic?13:plate?54:48,arcane:manaUser?62:20,ironhide:plate?57:46,haste:leather?59:magic?45:49,
  fortune:52,barrier:plate?53:56,trail:48,scout:47,purifying:32,veilsight:51,fate:38,
  wisdom:48,prospector:43,rejuvenation:manaUser?79:55,withering:dot?65:12,precision:leather?62:49,
  phantom:leather?63:36,executioner:64,renewal:hpRatio<.75?78:60};
 const base=score[kind]??-Infinity;
 return profile.plan?PLANNER.potionPriority(kind,profile,base):base;
}
function selectEarnedPotions(a,profile){
 const s=a.state(),actions=[],v=a.vitals();
 const available=POTIONS.CATALOG.map(p=>p.id).filter(kind=>(s.consumables?.[kind]||0)>0&&potionScore(kind,profile,v)>0);
 const wanted=available.sort((x,y)=>potionScore(y,profile,v)-potionScore(x,profile,v)||x.localeCompare(y)).slice(0,3);
 const before=[...(s.potionSelection||[])],kept=new Set();
 // Do not churn retained doses or bypass the native full-Stash removal gate.
 for(const kind of before){
  if(wanted.includes(kind)&&!kept.has(kind)){kept.add(kind);continue;}
  a.potions.select(kind,true);
 }
 for(const kind of wanted){
  if((s.potionSelection||[]).length>=3)break;
  if(!(s.potionSelection||[]).includes(kind))a.potions.select(kind);
 }
 if(JSON.stringify(before)!==JSON.stringify(s.potionSelection))actions.push({action:'loadout',kinds:[...s.potionSelection]});
 return actions;
}
function craftEarnedPotions(a,profile){
 const s=a.state(),actions=[];
 if(!profile.shop||!a.economyCanAct()||!a.potions.progress||!a.potions.craft)return actions;
 // Forge is considered first in Camp. Keep a small material reserve for permanent gear;
 // cheap missing emergency healing can take precedence over that reserve.
 for(let i=0;i<2;i++){
  const candidates=POTIONS.CATALOG.filter(p=>!(s.consumables?.[p.id]>0)).map(p=>{
   const project=a.potions.progress(p.id),score=potionScore(p.id,profile,a.vitals());
   if(!project?.ready||score<35)return null;
   const cost=project.recipe,emergency=p.id==='health';
   if(!emergency&&s.crafting.essence-cost.essence<4)return null;
   if(Object.entries(cost.reagents).some(([f,n])=>s.crafting.cores[f]-n<1))return null;
   return {id:p.id,cost,score};
  }).filter(Boolean);
  // Rank by the correct candidate's own native cost, then stable ID.
  candidates.sort((x,y)=>y.score/(y.cost.essence+4*Object.keys(y.cost.reagents).length)-x.score/(x.cost.essence+4*Object.keys(x.cost.reagents).length)||x.id.localeCompare(y.id));
  const best=candidates[0];if(!best)break;
  const before={essence:s.crafting.essence,cores:{...s.crafting.cores},gold:s.gold,fragments:s.fragments,count:s.consumables?.[best.id]||0};
  if(!a.potions.craft(best.id))break;
  if(s.crafting.essence!==before.essence-best.cost.essence||s.gold!==before.gold||s.fragments!==before.fragments||s.consumables[best.id]!==before.count+1||Object.keys(before.cores).some(f=>s.crafting.cores[f]!==before.cores[f]-(best.cost.reagents[f]||0)))throw Error('Native potion craft cost mismatch');
  actions.push({action:'craft',kind:best.id,essenceSpent:best.cost.essence,reagentsSpent:{...best.cost.reagents}});
 }
 return actions;
}
function buyEarnedPotions(a,profile,level){
 const s=a.state(),actions=[];
 if(!profile.shop||!a.economyCanAct())return actions;
 if(!s.apothecary)s.apothecary=a.potions.shop(level);
 const owned=kind=>(s.consumables?.[kind]||0)>0;
 // Only buy available offers at their actual dynamic prices; replacement
 // stock is drawn by the native Apothecary and may contain any of the current native potion types.
 for(let n=0;n<3;n++){
  const offers=(s.apothecary?.stock||[]).filter(p=>p.price<=s.gold&&!owned(p.kind))
   .map(p=>({...p,score:potionScore(p.kind,profile,a.vitals())}))
   .filter(p=>p.score>=35)
   .sort((x,y)=>y.score/y.price-x.score/x.price);
  const best=offers[0];if(!best)break;
  const before=s.gold;
  if(!a.potions.buy(best.id))break;
  if(s.gold!==before-best.price||!owned(best.kind))
   throw Error('Native Apothecary purchase not settled');
  actions.push({action:'buy',kind:best.kind,cost:best.price});
 }
 const healthPrice=Math.ceil(POTIONS.CATALOG.find(p=>p.id==='health').base*(1+.12*level));
 if(!owned('health')&&s.gold>=s.apothecary.refreshCost+healthPrice){
  const before=s.gold,cost=s.apothecary.refreshCost;
  if(a.potions.reroll()){
   if(s.gold!==before-cost)throw Error('Native Apothecary restock cost mismatch');
   actions.push({action:'restock',cost});
   const heal=s.apothecary.stock.find(p=>p.kind==='health'&&p.price<=s.gold);
   if(heal&&a.potions.buy(heal.id))actions.push({action:'buy',kind:'health',cost:heal.price});
  }
 }
 actions.push(...selectEarnedPotions(a,profile));
 return actions;
}
function refineEarnedReagents(a,profile,level){
 const s=a.state(),out=[],forge=a.forge;
 if(!forge||!a.economyCanAct())return out;
 // Forge-only refinement for learned Epic recipes, each missing family checked
 // against the actual multi-Reagent cost; no separate Apothecary conversion.
 const epic=forge.recipes.filter(r=>r.rarity==='Epic'&&(profile.families.includes(r.family)||r.subtype===profile.armor)&&(!compatibilityGuard(profile)||r.slot!=='offhand'||investmentAllowed(r,profile,'offhand',s.equip)));
 for(const recipe of epic){
  const p=forge.progress(recipe.id,level);if(!p?.unlocked||s.fragments<p.cost.fragments||s.crafting.essence<p.cost.essence+6)continue;
  for(const [family,need] of Object.entries(p.cost.reagents||{})){
   if(s.crafting.cores[family]>=need||(s.crafting.dryRooms?.[family]||0)<3)continue;
   const before={essence:s.crafting.essence,cores:{...s.crafting.cores}};
   if(!forge.refine(recipe.id,family))continue;
   if(s.crafting.essence!==before.essence-6||Object.keys(before.cores).some(f=>s.crafting.cores[f]!==before.cores[f]+(f===family?1:0)))throw Error('Native reagent refinement settlement mismatch');
   out.push({family,recipe:recipe.id,essenceSpent:6,coresGained:1});return out;
  }
 }
 return out;
}
// Free Stash capacity through actual Camp salvage, not state mutation.
function consolidateStash(a,profile,reserve=4){
 const s=a.state(),capacity=a.storage?.capacity?.()??Number(s.stashCapacity);
 // The actual native Stash counts equipped-potion stacks as well as items.
 // Counting only gear misses a full Stash at later E levels.
 const occupied=a.storage?.occupied?.()??s.stash.length;
 const action={capacity,occupiedBefore:occupied,overflowBefore:(s.expeditionOverflow||[]).length,
  salvaged:0,fragmentsGained:0,claimedOverflow:0,occupiedAfter:null,overflowAfter:null};
 if(!a.economyCanAct()||!Number.isInteger(capacity)||capacity<1)return action;
 const overflow=(s.expeditionOverflow||[]).length;
 const keepSpace=Math.min(Math.max(1,Math.floor(capacity/4)),Math.max(2,reserve));
 const excess=Math.max(0,occupied+overflow-(capacity-keepSpace));
 if(excess>0){
  const reserved=TRANSITION.retain(a,profile,'storage-pressure');
  const candidate=s.stash.filter(item=>item?.id&&!item.locked&&
   !item.startingGear&&!item.recoveryStarter).sort((left,right)=>{
   function priority(item){
    const equipped=s.equip[item.slot];
    const hand=handTargets(item,profile),gains=hand?.map(slot=>handGain(a,profile,item,slot)).filter(Number.isFinite)||[];
    const weakRelative=gains.length?Math.max(...gains):identityGain(item,equipped,profile,item.slot);
    return (reserved.has(item.id)?1000000:0)+weakRelative-(item.recoveryStarter?200:0)-(item.rarity==='Common'?10:0);
   }
   return priority(left)-priority(right);
  });
  const selected=candidate.slice(0,excess);
  if(selected.length){
   const before=s.fragments,ids=selected.map(item=>item.id);
   const expected=selected.reduce((n,item)=>n+a.sale(item),0);
   if(EQUIPMENT_AI.transition(profile))EQUIPMENT_AI.trace(profile,{phase:'transition',kind:'pressureSalvage',ids,reservedLost:ids.filter(id=>reserved.has(id))});
   a.salvage(ids);
   const found=ids.filter(id=>s.stash.some(item=>item.id===id));
   if(found.length||s.fragments-before!==expected)
    throw Error('Native Stash salvage transaction mismatch');
   action.salvaged=selected.length;action.fragmentsGained=s.fragments-before;
  }
 }
 if((s.expeditionOverflow||[]).length)action.claimedOverflow=a.claimOverflow();
 action.occupiedAfter=a.storage?.occupied?.()??s.stash.length;
 action.overflowAfter=(s.expeditionOverflow||[]).length;
 return action;
}
function prepareCamp(a,profile,level,decisionModel='risk-aware',options={}){
 const actions={talents:[],attributes:[],resets:[],elementChoices:[],prepared:null,equipped:[],bought:[],crafted:[],refined:[],potions:[],runes:[],storage:[],soldTreasures:false,restocks:0,salvagedGrey:0,salvageFragments:0};
 const s=a.state();a.potions.inventory();refreshSynergyContext(a,profile);
 if(typeof profile.equipmentTrace==='function')profile.equipmentTrace({phase:'camp',kind:'beforeCamp',level,weapon:s.equip.weapon?.subtype||null,offhand:s.equip.offhand?.subtype||null,hands:[s.equip.weapon,s.equip.offhand].filter(Boolean).map(x=>({id:x.id,subtype:x.subtype,rarity:x.rarity,atk:x.atk,spell:x.spell})),nodes:[...s.automaticTalents.nodes],stats:a.baseStats()});
 for(let i=0;i<3&&a.results().review;i++)a.exitResult();
 actions.soldTreasures=!!(s.valuables?.length&&a.treasures.sell());
 if(decisionModel!=='legacy')actions.storage.push(consolidateStash(a,profile));
 actions.equipped.push(...equipEarned(a,profile,false));
 // Native Camp decision: obsolete Expedition Grey gear funds the Forge.
 // Never sell starter, equipped or locked items or create resources artificially.
 if(a.economyCanAct()){
  const reserved=TRANSITION.retain(a,profile,'grey-salvage');
  const surplus=s.stash.filter(item=>item.source==='loot'&&item.rarity==='Common'&&!reserved.has(item.id)&&
   !item.locked&&!item.recoveryStarter&&item.id&&
   (EQUIPMENT_AI.stable(profile)&&['weapon','offhand'].includes(item.slot)?false:EQUIPMENT_AI.full(profile)?EQUIPMENT_AI.gearTargets(item).every(slot=>{const gain=EQUIPMENT_AI.gain(a,profile,item,slot);return Number.isFinite(gain)&&gain<=-2.5;}):EQUIPMENT_AI.enabled(profile)&&['weapon','offhand'].includes(item.slot)?EQUIPMENT_AI.targets(item).every(slot=>{const gain=handGain(a,profile,item,slot);return Number.isFinite(gain)&&gain<=-2.5;}):identityGain(item,s.equip[item.slot],profile,item.slot)<=-2.5));
  if(surplus.length){
   const ids=surplus.map(item=>item.id),expected=surplus.reduce((sum,item)=>sum+a.sale(item),0);
   const before=s.fragments;
   a.salvage(ids);
   const received=s.fragments-before;
   if(received!==expected||surplus.some(item=>s.stash.some(x=>x.id===item.id)))
    throw Error('Grey salvage was not settled by native Camp economy');
   actions.salvagedGrey=surplus.length;actions.salvageFragments=received;
  }
 }
 if(options.resetReason){
  const xpBefore=s.automaticTalents.xp,spentBefore=s.automaticTalents.nodes.length;
  if(!a.talentActions.reset())throw Error('Native talent reset rejected at Camp');
  if(s.automaticTalents.xp!==xpBefore||s.automaticTalents.nodes.length!==0)
   throw Error('Native reset changed earned XP or retained talent nodes');
  actions.resets.push({reason:options.resetReason,previousNodes:spentBefore,xpRetained:xpBefore});
 }
 if(profile.plan){
  const plan=PLANNER.getPlan(profile.plan),xpBeforePlan=s.automaticTalents.xp;
  // Element selection uses the exact native Camp action and refunds
  // incompatible element nodes, never manually mutates the save.
  if(plan.element&&s.automaticTalents.nodes.includes('element_choice')&&
     (s.automaticTalents.element||'arcane')!==plan.element){
   if(!a.talentActions.element(plan.element))throw Error('Smart agent native attunement rejected');
   actions.elementChoices.push(plan.element);
  }
  const proposed=PLANNER.propose(a.talents,s.automaticTalents,profile.plan,
   options.history||[],options.priorResets||0,profile.synergyAudit?profile.synergyContext?.stats:null);
  if(proposed.resetReason){
   const beforeReset={xp:s.automaticTalents.xp,nodes:s.automaticTalents.nodes.length};
   if(!a.talentActions.reset())throw Error('Strategic native reset rejected');
   if(s.automaticTalents.xp!==beforeReset.xp||s.automaticTalents.nodes.length)
    throw Error('Strategic native reset must preserve earned XP');
   actions.resets.push({reason:proposed.resetReason,previousNodes:beforeReset.nodes,
    xpRetained:beforeReset.xp});
  }
  for(const id of proposed.purchases){
   if(!a.talentActions.allocate(id))throw Error('Strategic native talent buy rejected '+id);
   actions.talents.push(id);
   if(id==='element_choice'&&plan.element&&plan.element!=='arcane'&&
      s.automaticTalents.element!==plan.element){
    if(!a.talentActions.element(plan.element))throw Error('Strategic native element selection rejected');
    actions.elementChoices.push(plan.element);
   }
  }
  const actual=s.automaticTalents;
  if(JSON.stringify(actual.nodes)!==JSON.stringify(proposed.expectedNodes)||
     (actual.element||'arcane')!==proposed.expectedElement||
     !a.talents.valid(actual)||actual.xp!==xpBeforePlan)
   throw Error('Strategic planning/native Camp parity failure');
  actions.plan={id:profile.plan,model:proposed.model,allowed:proposed.allowed,
   pressure:proposed.pressure,milestone:proposed.milestone,
   points:proposed.earned,spent:proposed.spent,reset:proposed.resetReason};
 }else{
  const talentInvestment=spendEarnedTalents(a,profile);
  actions.talents.push(...talentInvestment.bought);
  actions.elementChoices.push(...talentInvestment.elements);
 }
 actions.attributes.push(...spendEarnedAttributes(a,profile).chosen);
 actions.prepared=prepareEarnedAbility(a,profile);refreshSynergyContext(a,profile);refreshAdaptiveNodes(a,profile);
 if(EQUIPMENT_AI.enabled(profile))actions.equipped.push(...equipEarned(a,profile,false));
 if(EQUIPMENT_AI.transition(profile)){actions.equipped.push(...TRANSITION.execute(a,profile));refreshSynergyContext(a,profile);}
 if(decisionModel!=='legacy'){
  actions.refined.push(...refineEarnedReagents(a,profile,level));
  const investment=investEarnedGear(a,profile,level);
  actions.crafted.push(...investment.crafted);
 }
 if(decisionModel!=='legacy')actions.potions.push(...craftEarnedPotions(a,profile));
 actions.potions.push(...buyEarnedPotions(a,profile,level));
 if(profile.shop&&a.economyCanAct()){
  const owns=kind=>(s.consumables?.[kind]||0)>0;
  // Spend spare Gold on permanent upgrade only if the expected item-stat gain
  // outweighs the real opportunity cost of an emergency 14+ Gold potion.
  if(!s.merchant)a.rollShop();
  // Keep Gold for an actually offered Health dose; don't permanently
  // block affordable gear just because an unavailable potion might appear.
  const healthOffer=s.apothecary?.stock?.find(p=>p.kind==='health'&&p.price<=s.gold);
  const reserve=decisionModel==='legacy'?(owns('health')?0:14):
   owns('health')||!healthOffer?0:healthOffer.price;
  const acquisition=ACQUISITION.context(a,profile);
  const candidates=(s.merchant?.stock||[]).map((item,index)=>{
   const slots=handTargets(item,profile)||merchantDecisionTargets(item,profile);
   const best=slots.map(slot=>({slot,...ACQUISITION.value(a,profile,item,slot,investmentGain(item,profile,slot,s.equip,a),acquisition,'merchant')})).sort((a,b)=>b.gain-a.gain)[0];
   if(EQUIPMENT_AI.enabled(profile))EQUIPMENT_AI.trace(profile,{phase:'merchant',kind:'offer',id:item.id,subtype:item.subtype,slot:best?.slot,gain:Number.isFinite(best?.gain)?best.gain:null,cost:item.goldPrice,affordable:item.goldPrice<=s.gold-reserve});
   return {item,index,...best};
  }).filter(x=>Number.isFinite(x.gain)&&x.item?.goldPrice<=s.gold-reserve&&x.gain>(decisionModel==='legacy'?8:5))
    .sort((x,y)=>ACQUISITION.strategic(profile)?y.gain/Math.max(1,y.item.goldPrice)-x.gain/Math.max(1,x.item.goldPrice)||y.gain-x.gain:y.gain-x.gain||x.item.goldPrice-y.item.goldPrice);
  for(const {item,index} of candidates.slice(0,decisionModel==='legacy'?1:2)){
   if(s.gold<item.goldPrice+reserve||s.merchant?.stock?.[index]?.id!==item.id)continue;
   if(decisionQuality(profile)&&!gearDecisionTargets(item,profile).some(slot=>investmentGain(item,profile,slot,s.equip)>5))continue;
   if(adaptiveCommitment(profile)&&!adaptiveTargets(item,profile).some(slot=>investmentGain(item,profile,slot,s.equip)>5))continue;
   if(compatibilityGuard(profile)&&!decisionQuality(profile)&&item.slot==='offhand'&&!investmentAllowed(item,profile,item.slot,s.equip))continue;
   const weaponAtDecision=s.equip.weapon?.subtype||null;
   const refreshed=ACQUISITION.context(a,profile);
   const adaptiveBest=EQUIPMENT_AI.enabled(profile)?(handTargets(item,profile)||merchantDecisionTargets(item,profile)).map(slot=>({slot,...ACQUISITION.value(a,profile,item,slot,investmentGain(item,profile,slot,s.equip,a),refreshed,'merchant')})).sort((x,y)=>y.gain-x.gain)[0]:null;
   if(EQUIPMENT_AI.enabled(profile)&&!(adaptiveBest?.gain>5))continue;
   if(a.purchaseNative(index)){
    if(ACQUISITION.risk(profile))EQUIPMENT_AI.trace(profile,{phase:'acquisition',kind:'forecast',source:'merchant',id:item.id,rarity:item.rarity,slot:adaptiveBest.slot,subtype:item.subtype,predicted:adaptiveBest.immediate,actual:adaptiveBest.immediate,decisionGain:adaptiveBest.gain,penalty:0,strategicGain:adaptiveBest.strategicGain});
    if(adaptiveBest)EQUIPMENT_AI.trace(profile,{phase:'merchant',kind:'buy',id:item.id,subtype:item.subtype,slot:adaptiveBest.slot,gain:adaptiveBest.gain,cost:item.goldPrice,accepted:true});
    actions.bought.push({name:item.name,cost:item.goldPrice,gain:round(adaptiveBest?adaptiveBest.gain:gearScore(item,profile)-gearScore(s.equip[item.slot],profile)),...(compatibilityGuard(profile)?{slot:adaptiveBest?.slot||item.slot,subtype:item.subtype,weaponAtDecision}:{})});
    actions.equipped.push(...equipEarned(a,profile,false));
    if(ACQUISITION.strategic(profile))actions.equipped.push(...TRANSITION.execute(a,profile));
   }
  }
 }
 // Re-rank all genuinely owned doses and use the real 3-slot Camp UI API.
 actions.potions.push(...selectEarnedPotions(a,profile));
 if(decisionModel!=='legacy'){
  actions.storage.push(consolidateStash(a,profile));
  actions.equipped.push(...equipEarned(a,profile,false));
 }
 if(decisionModel!=='legacy')actions.runes.push(...manageEarnedRunes(a,profile,{equip:options.equipEarnedRunes!==false}));
 if(EQUIPMENT_AI.transition(profile)){actions.equipped.push(...TRANSITION.execute(a,profile));refreshSynergyContext(a,profile);}
 actions.unspentGold=s.gold;
 actions.unspentFragments=s.fragments;
 actions.unspentEssence=s.crafting?.essence||0;
 actions.unspentReagents={...s.crafting?.cores};
 if(typeof profile.equipmentTrace==='function')profile.equipmentTrace({phase:'camp',kind:'afterCamp',level,weapon:s.equip.weapon?.subtype||null,offhand:s.equip.offhand?.subtype||null,hands:[s.equip.weapon,s.equip.offhand].filter(Boolean).map(x=>({id:x.id,subtype:x.subtype,rarity:x.rarity,atk:x.atk,spell:x.spell})),nodes:[...s.automaticTalents.nodes],stats:a.baseStats(),armor:gearSnapshot(a).items.filter(x=>['helm','armor','gloves','boots','belt'].includes(x.slot)),preferredWeapons:[...profile.weapons],equippedIds:Object.values(s.equip).filter(Boolean).map(x=>x.id),crafts:actions.crafted,buys:actions.bought,equips:actions.equipped});
 return actions;
}
function capabilities(a){
 return AGENT.classify({equipment:a.state().equip,talents:a.state().automaticTalents,
  build:a.build(),stats:a.baseStats()});
}
function rankRealms(cards,profile,gear,context={}){
 const hasUpgrades=gear.starter<=1,wanted=profile.risk===1&&hasUpgrades?1:0;
 return cards.map(card=>{
  const base=Math.abs(card.risk-wanted)*12+Math.max(0,card.risk-wanted)*10+
   (profile.families.includes(card.family)?-3:0)+(card.family==='radiance'?-1:0);
  const visible=context.visible?.[card.id]||{};
  const fit=AGENT.realmPreference(context.capabilities,card,visible);
  return {card,score:round(base-fit.score),baseScore:base,fit};
 }).sort((a,b)=>a.score-b.score||a.card.risk-b.card.risk);
}
function choiceRealm(cards,profile,gear,context={}){
 return rankRealms(cards,profile,gear,context)[0].card;
}
function pathLength(card,d,start,dest){
 if(start===dest)return 0;
 const q=[[start,0]],seen=new Set([start]);
 for(const [id,depth] of q){for(const n of I.neighbors(card,d,id)){
  if(n===dest)return depth+1;
  if(!seen.has(n)){seen.add(n);q.push([n,depth+1]);}
 }}
 return Infinity;
}
// Distances use traversable graph topology; decisions only inspect details of
// rooms the native map UI currently exposes through travelPath/scouting.
// Heuristic decision utility (not currency, not guaranteed drops). Read the
// exact live loot tables: Elite stage 4 vs ordinary Dungeon stages 1-3.
// Never create items / inspect RNG / force outcomes when evaluating a route.
function eliteOpportunity(game,card,node,profile,vitals,context={}){
 const hpRatio=vitals.maxhp>0?vitals.hp/vitals.maxhp:0;
 const cha=Number.isFinite(context.cha)?context.cha:5;
 const regularStage=Math.min(3,1+Math.floor(Math.max(0,game.history?.length||0)/5));
 const normal=LOOT.v013DungeonWaveOdds(regularStage,cha);
 const elite=LOOT.v013DungeonWaveOdds(4,cha);
 const quality={Common:.35,Uncommon:.85,Rare:1.6,Epic:2.8,Legendary:4.5};
 const weighted=rarities=>Object.entries(rarities).reduce((total,[r,prob])=>
  total+(quality[r]||0)*prob,0);
 const firstRoom=game.dungeon?.cleared?.length===1;
 const eliteDrop=elite.drop,normalDrop=normal.drop;
 const eliteGear=eliteDrop*weighted(elite.rarities);
 const normalGear=normalDrop*weighted(normal.rarities);
 const equipment=context.equipment?Object.values(context.equipment).filter(Boolean):[];
 const starter=equipment.filter(x=>x.startingGear).length;
 const need=equipment.length?1+Math.min(.65,starter/10):1.25;
 const marked=card.objective===context.room&&!game.dungeon?.foundationState?.bossPreparation?.markedElite;
 const escorts=Number(node.escorts||0);
 const lootUtility=22*need*Math.max(0,eliteGear-normalGear);
 const goldFragmentUtility=6; // Native Elite adds +4 Gold and +3 Fragments before modifiers.
 const favoredUtility=marked?3:0; // 55% favoured equipment slot, conditional on an actual drop.
 const extractionUtility=marked?10:0; // Native settlement: 1 Affinity reagent and 2+2*risk Essence.
 const bossPrepUtility=marked?9:0; // Native -10% Guarded boss attack / -1 higher-risk escort.
 const recent=(context.recentFights||[]).slice(-3).filter(x=>x.hpMax>0);
 const avgDamage=recent.length?recent.reduce((n,x)=>n+
   Math.max(0,(x.hpStart-x.hpEnd)/x.hpMax),0)/recent.length:0;
 // An E1 Elite has no escorts at Guarded risk. It is one stronger enemy,
 // not a 12- or 22-mob swarm; penalize its real potential HP loss rather than
 // classifying all Elites as extremely dangerous.
 const baseThreat=8+escorts*13+(profile.name==='Cautious'?3:profile.name==='Daring'?-2:0);
 const injuryPenalty=hpRatio<.48?40:hpRatio<.64?19:hpRatio<.77?7:0;
 const historyPenalty=avgDamage>.65?11:avgDamage>.4?5:0;
 const threat=baseThreat+injuryPenalty+historyPenalty;
 const benefit=lootUtility+goldFragmentUtility+favoredUtility+extractionUtility+bossPrepUtility;
 return {
  scoreDelta:round(threat-benefit),benefit:round(benefit),threat:round(threat),
  marked,escorts,firstRoom,
  loot:{eliteDrop:round(eliteDrop,4),normalDrop:round(normalDrop,4),
   eliteRarePlus:round((elite.rarities.Rare||0)+(elite.rarities.Epic||0)+(elite.rarities.Legendary||0),4),
   normalRarePlus:round((normal.rarities.Rare||0)+(normal.rarities.Epic||0)+(normal.rarities.Legendary||0),4)},
  breakdown:{lootUtility:round(lootUtility),goldFragmentUtility,favoredUtility,
   extractionUtility,bossPrepUtility,baseThreat,injuryPenalty,historyPenalty}
 };
}
function selectRoom(c,profile,vitals,context={}){
 const g=c.state,d=g.dungeon,card=c.realmMap(),boss=card.nodes.findIndex(n=>n.kind==='boss');
 const hpRatio=vitals.maxhp>0?vitals.hp/vitals.maxhp:0,prep=d.foundationState?.bossPreparation||{};
 const currentDist=pathLength(card,d,d.current,boss),options=[];
 for(let i=0;i<card.nodes.length;i++){
  if(d.cleared.includes(i)||i===d.current)continue;
  const route=c.travelPath(i);if(!route?.length)continue;
  const cost=c.travelCost(route);if(cost>d.steps)continue;
  const visible=!!route.length||d.scouted?.includes(i);
  const n=visible?card.nodes[i]:null,type=n?.kind||'unknown';
  const dist=pathLength(card,d,i,boss);
  const remaining=d.steps-cost;
  const slack=Number.isFinite(dist)?remaining-dist:-10;
  let score=dist*1.35+cost*2+(dist<currentDist?-2:5);
  if(!Number.isFinite(score))score=100;
  if(i!==boss&&slack<0)score+=30+Math.abs(slack)*7;
  else if(i!==boss&&slack<2)score+=8;
  if(type==='combat'){
   const count=Number(n.range?.[1]??n.count??4);
   if(context.carriedBagItems===0&&hpRatio<.5){
    if(count<=1)score-=20;else score+=Math.min(60,count*7);
   }
   if(context.carriedBagItems>0&&hpRatio<.72&&count>1)score+=22;
   if(count<=1)score-=context.capabilities?.areaReady?5:18;
   else if(context.capabilities?.areaReady){
    // Only earned AoE tools justify the risk of groups; their native
    // combat and drop odds are untouched.
    const base=count<=4?(profile.name==='Daring'?1:7):
     count<=12?(profile.name==='Daring'?12:22):(profile.name==='Daring'?22:36);
    score+=base*.18-AGENT.groupPreference(context.capabilities,count,{
     hpRatio,bagItems:context.carriedBagItems||0});
   }else if(count<=4)score+=profile.name==='Daring'?1:7;
   else if(count<=12)score+=profile.name==='Daring'?12:22;
   else score+=profile.name==='Daring'?22:36;
   if(hpRatio<.65&&count>1)score+=12;
  }
  if(type==='shrine')score-=19;
  if(type==='spring')score-=hpRatio<.8?27:5;
  if(type==='event')score-=3;
  let elite=null;
  if(type==='elite'){
   elite=eliteOpportunity(g,card,n,profile,vitals,{...context,room:i});
   score+=elite.scoreDelta;
   // Reward does not justify spending the last steps on a side corridor
   // that cannot lead to the native Boss.
   if(slack<1)score+=12;
   if(hpRatio<Math.max(.58,profile.retreatAt+.08))score+=22;
  }
  if(type==='boss')score+=hpRatio<.7?16:1;
  // The map decision sees only an ACCEPTED Contract and reachable target rooms.
  // Bonuses guide travel but never forge completed fights, Boons or prizes.
  const contractId=d.foundationState?.contractId,progress=K.progress(g);
  if(contractId&&progress&&!progress.done){
   const marked=d.stage72RewardPlan?.markedRooms||[];
   if(contractId==='boon_collector'&&type==='shrine'&&card.boonShrines?.includes(i))score-=25;
   if(contractId==='marked_chambers'&&type==='combat'&&marked.includes(i))score-=23;
   if(contractId==='skirmish_clear'&&type==='combat')score-=12;
   if(contractId==='monster_hunt'&&type==='combat')score-=Math.min(18,7+Number(n.count||0));
   if(contractId==='bounty_writ'&&type==='elite'&&i===card.objective)score-=19;
   if(contractId==='purification'&&type==='event'&&i===card.reliquaryRoom&&hpRatio>.83)score-=17;
   if(contractId==='oath_of_defiance'&&type==='boss'&&hpRatio>.72)score-=6;
  }
  const objective=i===card.objective&&!prep.markedElite&&type==='elite';
  const reliquary=i===card.reliquaryRoom&&!prep.reliquary&&n?.event==='forgotten_reliquary';
  if(reliquary)score+=hpRatio>.83&&slack>=0?-15:12;
  if(type==='boss'&&((prep.markedElite||prep.reliquary)&&hpRatio>.75))score-=4;
  if(i!==boss&&d.steps<dist+2)score+=6;
  options.push({room:i,score,dist,cost,slack,known:visible,type,objective,reliquary,elite,
   ...(type==='combat'?{visibleMobRange:n.range||[n.count,n.count]}:{})});
 }
 options.sort((a,b)=>a.score-b.score||a.room-b.room);
 const best=options[0];
 if(best)best.eligibleEliteAlternatives=options.filter(x=>x.type==='elite')
  .map(({room,cost,slack,score,elite})=>({room,cost,slack,score:round(score),...elite}));
 return best||null;
}
// Gold, Fragments and earned XP are already secured after completed rooms.
// On death only physical Expedition Bag contents are lost.
function evaluateRetreat({hp,maxhp,bag=[],next,profile,gold=0,fragments=0,essence=0,recentFights=[],capabilities=null}){
 const hpRatio=maxhp>0?hp/maxhp:0,carried=bag.length;
 const value=item=>item.kind==='valuable'?Math.max(1,Number(item.worth)||5):
  Math.max(2,Number(item.tier||1)*2+Math.max(0,gearScore(item,profile))+
  (item.rarity==='Rare'?10:item.rarity==='Epic'?22:item.rarity==='Uncommon'?5:0));
 const bagValue=round(bag.reduce((n,item)=>n+value(item),0));
 const safe=!!next&&['spring','shrine'].includes(next.type);
 const visibleEnemies=next?.type==='combat'?Number(next.visibleMobRange?.[1]??4):0;
 const solo=next?.type==='combat'&&visibleEnemies<=1;
 const canInvest=gold>=20||fragments>=14&&essence>=4;
 const prior=recentFights.filter(x=>x.hpMax>0).slice(-2);
 const meanLoss=prior.length?prior.reduce((n,x)=>n+Math.max(0,(x.hpStart-x.hpEnd)/x.hpMax),0)/prior.length:0;
 // Do not classify all groups as intrinsically dangerous when the character
 // has real AoE capability and survived the latest fights comfortably.
 const manageableGroup=capabilities?.areaReady&&hpRatio>.72&&meanLoss<.30&&visibleEnemies<=12;
 const dangerous=next?.type==='boss'||next?.type==='elite'||
  next?.type==='combat'&&visibleEnemies>1&&!manageableGroup;
 let extract=false,reason='continue';
 if(!next){extract=true;reason='no_legal_path';}
 else if(safe){reason='recover_at_safe_room';}
 else if(carried&&hpRatio<Math.max(.52,profile.retreatAt+.10)){extract=true;reason='protect_carried_loot';}
 else if(carried&&dangerous&&hpRatio<Math.min(.85,meanLoss+.12)){extract=true;reason='protect_bag_from_known_threat';}
 else if(!carried&&hpRatio<profile.retreatAt){
  if(solo&&hpRatio>=.16&&!canInvest)reason='risk_easy_room_no_bag';
  else {extract=true;reason=canInvest?'return_to_camp_to_invest':'avoid_very_dangerous_room';}
 }else if(!carried&&hpRatio<.32&&canInvest&&dangerous){extract=true;reason='return_to_camp_to_invest';}
 return {extract,reason,hpRatio:round(hpRatio),bagItems:carried,bagValue,
  gold,fragments,essence,canInvest,visibleNextKind:next?.type||null,
  visibleEnemies,meanRecentHpLossPct:round(meanLoss*100)};
}
function boonScore(id,profile,context={}){
 const hp=context.vitals?.maxhp?context.vitals.hp/context.vitals.maxhp:1;
 const mana=context.vitals?.maxmp??0,steps=context.steps??10;
 const blood=context.owned?context.owned.includes('affinity_blood'):profile.families.includes('blood'),decay=context.owned?context.owned.includes('affinity_decay'):profile.families.includes('decay');
 const rotReady=context.owned?decay&&['corrupting_touch','blightburst','corruption_cycle','corruption_nova','rotguard','grave_bloom'].some(x=>context.owned.includes(x)):decay;
 const fireReady=context.owned?context.owned.includes('affinity_arcane')&&context.element==='fire':profile.element==='fire';
 const dotReady=context.bleedReady||blood||rotReady||fireReady;
 switch(id){
  case 'bastion_oath':return 28+(hp<.75?9:0)-(profile.name==='Daring'?3:0);
  case 'predators_focus':return 26+(context.bossSoon?5:0)-(context.cap?.areaReady?9:0);
  case 'blood_tribute':return dotReady?24:2;
  case 'rotbound_echo':return dotReady?18+(context.cap?.areaReady?4:0):2;
  case 'aetherbound_pact':return mana>0?22-(context.vitals?.mp/mana<.35?12:0):0;
  case 'wayfarers_bargain':return steps<=4&&hp>.7?24:steps<7&&hp>.85?16:-8;
  default:return 0;
 }
}
function chooseBoon(offer,profile,context={}){
 const ids=offer.ids||[];
 return [...ids].sort((a,b)=>boonScore(b,profile,context)-boonScore(a,profile,context)||a.localeCompare(b))[0]||null;
}
// Rank only the two real options and their precommitted, SINGLE prize.
// A Blueprint offered here is guaranteed on completion + safe settlement.
function contractScore(id,prize,profile,card){
 if(!K.get(id)||!prize||!card)return -Infinity;
 const loot={blueprint:35,reagent:13,essence:11,gold:10,fragments:9,potion:7};
 const base={bounty_writ:7,purification:8,oath_of_defiance:-6,
  monster_hunt:13,skirmish_clear:11,marked_chambers:5,boon_collector:14};
 let score=(loot[prize.kind]||0)+(base[id]||0);
 if(id==='bounty_writ')score+=profile.name==='Daring'?6:profile.name==='Cautious'?-12:0;
 if(id==='purification')score+=profile.name==='Cautious'?-6:2;
 if(id==='oath_of_defiance')score+=profile.name==='Cautious'?-8:-2;
 if(['monster_hunt','skirmish_clear','boon_collector'].includes(id))score-=card.risk*2;
 return score;
}
function chooseContract(offer,profile,card){
 if(!offer?.ids?.length)return null;
 return [...offer.ids].filter(id=>K.get(id)&&offer.rewards?.[id])
  .sort((a,b)=>contractScore(b,offer.rewards[b],profile,card)-
    contractScore(a,offer.rewards[a],profile,card)||a.localeCompare(b))[0]||null;
}
// Never treat a completed Contract as paid until a successful native exit.
// Saving a guaranteed rare Blueprint can justify a conservative extraction.
function contractExitDecision(game,next,vitals){
 const d=game?.dungeon,id=d?.foundationState?.contractId,p=K.progress(game);
 if(game?.stage!=='choice'||game.planeIndex<=1||!id||!p?.done)return null;
 const prize=d.stage72RewardPlan?.rewards?.[id];
 if(!prize)return null;
 const hpRatio=vitals.maxhp>0?vitals.hp/vitals.maxhp:0;
 const dangerous=['boss','elite'].includes(next?.type)||
  next?.type==='combat'&&Number(next.visibleMobRange?.[1]||1)>1;
 if(prize.kind==='blueprint'&&(hpRatio<.88||
   next?.type==='boss'&&hpRatio<.95))
  return {extract:true,reason:'secure_guaranteed_blueprint'};
 if(dangerous&&hpRatio<.65)
  return {extract:true,reason:'secure_completed_contract'};
 return null;
}
function eventOptions(id,v,profile,context={}){
 const ratio=v.maxhp?v.hp/v.maxhp:1;
 if(id==='forgotten_reliquary'){
  // Sacrifice 15% Max Health only with sufficient remaining HP and a boss
  // worth weakening; otherwise use the event's native supplies option.
  return ratio>.83&&!context.reliquaryCompleted?[0,1,2]:[1,2,0];
 }
 if(id==='restless_spring'||id==='traveling_merchant')return ratio<.92?[0,1,2]:[1,2,0];
 if(id==='oracle_of_paths')return [0,2,1];
 if(id==='whispering_idol'||id==='cursed_altar')return [2,1,0];
 return profile.name==='Daring'?[0,2,1]:[2,0,1];
}
function potionSlots(a){
 const run=a.events.run?.();
 return run?.started?(run.potions||[]):(a.state().potionSelection||[]).map(kind=>({kind,used:false}));
}
function usePotionKind(a,kind,reason,history,mode){
 const slots=potionSlots(a);
 const index=slots.findIndex(p=>p?.kind===kind&&!p.used);
 if(index<0)return false;
 if(!a.potions.use(index,mode))return false; // Only native legal actions succeed.
 history.push({kind,slot:index,reason});
 return true;
}
function recordAutomaticPotions(a,history){
 const run=a.events.run?.();if(!run?.started)return;
 for(const [slot,p] of (run.potions||[]).entries())if(p.used&&POTIONS.AUTO.includes(p.kind)&&!history.some(x=>x.automatic&&x.slot===slot))
  history.push({kind:p.kind,slot,reason:'native_expedition_start',automatic:true});
}
function usePotionsBetween(a,profile,history,next){
 const v=a.vitals(),g=a.controller().state,d=g.dungeon;
 if(!next||!d?.realm)return false;
 const ratio=v.maxhp>0?v.hp/v.maxhp:1,mpRatio=v.maxmp?v.mp/v.maxmp:1;
 const magic=profile.families.includes('arcane'),dot=profile.families.some(f=>['blood','decay'].includes(f));
 const dangerous=next.type==='boss'||next.type==='elite'||
  next.type==='combat'&&(Number(next.visibleMobRange?.[1]??4)>3);
 let changed=false;
 // Reveal otherwise hidden shrines only by actual map utility. Both Scout
 // and Veilsight have to satisfy the game's native map legality check.
 const hasVisibleShrine=a.controller().realmMap().boonShrines?.some(i=>
  d.scouted?.includes(i)||a.controller().travelPath(i).length>0);
 if(!hasVisibleShrine&&d.steps>=7&&
  !history.some(x=>['scout','veilsight'].includes(x.kind))){
  changed=usePotionKind(a,'veilsight','reveal_shrine_before_route',history)||changed;
  if(!changed)changed=usePotionKind(a,'scout','discover_real_shrine',history,'shrine')||changed;
 }
 if(d.steps<=4&&next.type!=='boss'&&next.slack<1)
  changed=usePotionKind(a,'trail','avoid_exhausting_map_steps',history)||changed;
 // Potions are never used mid-fight: the real runtime only accepts them at
 // map utility windows, shrine decisions or valid inter-plane preparations.
 const safe=['shrine','spring'].includes(next.type);
 if(!safe&&ratio<profile.healAt&&mpRatio<.65&&v.maxmp>0)
  changed=usePotionKind(a,'rejuvenation','missing_hp_and_mana',history)||changed;
 let current=a.vitals();
 if(current.hp/current.maxhp<profile.healAt&&!safe&&(dangerous||next.type==='combat'||ratio<.4)){
  if(usePotionKind(a,'health','low_hp_before_threat',history))changed=true;
  else if(usePotionKind(a,'rejuvenation','low_hp_before_threat',history))changed=true;
  else if(dangerous&&usePotionKind(a,'renewal','sustain_next_encounter',history))changed=true;
 }
 current=a.vitals();
 if(current.maxmp>0&&current.mp/current.maxmp<.35&&dangerous)
  changed=usePotionKind(a,'mana','low_mana_before_threat',history)||changed;
 if(dangerous&&ratio>.32){
  if(dot)changed=usePotionKind(a,'withering','dot_preparation',history)||changed;
  if(profile.armor==='Leather')changed=usePotionKind(a,'phantom','physical_evasion_preparation',history)||changed;
  changed=usePotionKind(a,'precision','critical_preparation',history)||changed;
  if(['boss','elite'].includes(next.type))changed=usePotionKind(a,'executioner','leader_damage_preparation',history)||changed;
  const defensive=next.type==='boss'?'barrier':'ironhide';
  changed=usePotionKind(a,defensive,'prepare_for_'+next.type,history)||changed;
  if(next.type==='boss'){
   changed=usePotionKind(a,magic?'arcane':'might',magic?'boss_spell_power':'boss_attack_power',history)||changed;
   changed=usePotionKind(a,'haste','boss_attack_speed',history)||changed;
   changed=usePotionKind(a,'ironhide','boss_defense',history)||changed;
   if(d.foundationState?.conditionId&&d.foundationState.conditionId!=='veiled_passages')
    changed=usePotionKind(a,'purifying','boss_condition_mitigation',history)||changed;
  }else if(next.type==='elite'){
   changed=usePotionKind(a,magic?'arcane':'might','elite_damage_preparation',history)||changed;
  }
 }
 return changed;
}
function rerollPoorBoonAtShrine(a,offer,profile,history){
 const g=a.controller().state;
 const context={vitals:a.vitals(),steps:g.dungeon.steps,
  bleedReady:a.state().automaticTalents.nodes.includes('affinity_blood'),owned:[...a.state().automaticTalents.nodes],element:a.state().automaticTalents.element,cap:capabilities(a)};
 const best=chooseBoon(offer,profile,context);
 if(best&&boonScore(best,profile,context)>=12)return false;
 return usePotionKind(a,'fate','reroll_weak_boon_offer',history);
}
// The player can switch to another real enemy while The Gilded's
// Solar Rebuke reflection is active. This is a target decision, not an invulnerability
// window, attack-speed change or artificial loss of DPS.
function selectThornAwareTarget(run,profile){
 const normal=S.selectTarget(run,profile.target),stage=normal?.stage82;
 if(stage?.type!=='the_gilded'||!(stage.rebukeUntil>(run.combatSeconds||0)))return normal;
 return (run.enemies||[]).find(enemy=>enemy?.hp>0&&enemy!==normal&&
  enemy.stage82?.type!=='the_gilded')||normal;
}
function fightNatural(a,profile,tickLimit,context={}){
 const r=a.state().run;
 if(!r||r.status!=='fight')throw Error('Combat entry missing');
 const scaler=CAPTURE.createScaler(context.level||r.tier||1,context.captureMode||'natural');scaler.apply(r);
 const startedAt=r.combatSeconds||0;
 const start=r.hp,first=r.encounterLeader||r.enemy,initial=r.totalMobCount||r.initialMobCount||r.enemies?.length||1;
 const fullInitialRoster=[...(r.enemies?.length?r.enemies:[r.enemy]),...(r.groupReserve||[])];
 const initialMinions=fullInitialRoster.filter(e=>e?.role==='minion').length;
 const initialNormals=fullInitialRoster.filter(e=>e&&!e.boss&&!e.miniboss&&e.role!=='minion').length;
 const initialRoleCounts=Object.fromEntries(['minion','tank','skirmisher','caster'].map(role=>
  [role,fullInitialRoster.filter(e=>e?.role===role).length]));
 const actualNodes=[...(a.state().automaticTalents?.nodes||[])];
 const actualWeapon=a.state().equip?.weapon?.subtype||null,actualOffhand=a.state().equip?.offhand?.subtype||null;
 const actualElement=a.state().automaticTalents?.element||null;
 // One classifier, based on the actual native kit; no historical focus IDs.
 const actualCapability=capabilities(a),aoePotential=actualCapability.areaReady;
 const aoePrepared=actualNodes.filter(id=>['fan_of_blades','cleave_mastery','bow_pierce','mace_shockwave','sword_sweep','overcharge','forked_lightning','fire_spread','frost_spread','plague_spread','contagious_touch','corruption_nova','arcane_nova','frost_resonance','vital_pulse','grasping_roots','ward_echo','stored_force','grave_bloom','carrion_detonation'].includes(id));
 const activationBefore=Object.fromEntries(Object.entries(a.build()?.runtime?.passiveTelemetry||{}).map(([id,x])=>[id,Number(x.activations)||0]));
 const metricBefore=Object.fromEntries(Object.entries(r.metrics||{}).filter(([k,v])=>Number.isFinite(v)));
 const fightStats=Object.fromEntries(['attack','spellPower','defense','maxhp','mana','manaRegen','attacksPerSec','crit','blockChance','evasionRating','healingPower','barrierPower'].map(k=>[k,r.stats?.[k]??null]));
 const mpStart=r.mp,maxmp=r.maxmp,metricsBefore=Object.fromEntries(['secondaryTargetDamage','secondaryTargetHits','manaSpent','fundedCasts','infusionActivations','infusionHits','infusionDamage','unfundedCasterAttacks']
  .map(key=>[key,Number(r.metrics?.[key])||0]));
 const measured=key=>Math.max(0,(Number(r.metrics?.[key])||0)-metricsBefore[key]);
 const decayKeys=['decayPrimaryPaidApplications','anchorSpreadSource_ability_cycle','anchorSpreadSource_ability_overflow','anchorSpreadSource_ability_blightburst','anchorSpreadCycleCasts','anchorSpreadCycleSeedOnly','corruptionCycleActivations','corruptionCycleDamage','corruptionCycleMana','anchorSpreadOverflowCasts','anchorSpreadOverflowSeedOnly','corruptionOverflowActivations','anchorSpreadOverflowPrimary','anchorSpreadOverflowSecondary','anchorSpreadOverflowBudget','corruptionOverflowMana','contagiousTouchSpread','soulDrainMana','decayPrimaryPaidTotalRotDamage','rotguardReactiveRot'];
 const decayBefore=Object.fromEntries(decayKeys.map(k=>[k,Number(r.metrics?.[k])||0]));
 const cap=context.capabilities||null,adaptive=context.adaptiveTargets??context.decisionModel==='adaptive';
 let ticks=0,switches=0,thornRedirects=0,minionFocusSeconds=0,minionFocusSwitches=0,minimum=r.maxhp>0?r.hp/r.maxhp:0;
 const healthLost={boss:0,elite:0,minion:0,normal:0};
 const barrierLost={boss:0,elite:0,minion:0,normal:0};
 const healthGained={boss:0,elite:0,minion:0,normal:0},barrierGained={boss:0,elite:0,minion:0,normal:0};
 const timeoutTrace=[AGENT.combatTracePoint(r,0,a.controller().state.stage)];
 let surrenderReason=null;
 let nonFocusedHealthLost=0,observedNewEnemies=0,untrackedDisappeared=0,peakLiveEnemies=0;
 while(r.status==='fight'&&a.controller().state.stage==='combat'&&r.hp>0&&ticks<tickLimit){
  // Target selection is an ordinary player click, at most once per 8 native ticks.
  if(ticks%8===0){
   const baseline=S.selectTarget(r,profile.target);
   // Respect the player's explicit single-target focus strategy. A smart
   // agent must not silently override a chosen combat style merely because
   // another target is dangerous. Mechanics-aware profiles remain reactive.
   let next=adaptive&&profile.target!=='focus'
    ?AGENT.selectTarget(r,cap?{...cap,rotCycleReady:(a.build()?.cooldowns?.corruptionCycle??-Infinity)<=(r.combatSeconds||0)}:null,baseline):selectThornAwareTarget(r,profile);
   // Solar Rebuke counterplay uses live visible enemy status only.
   if(next?.stage82?.type==='the_gilded'&&
      next.stage82.rebukeUntil>(r.combatSeconds||0)){
    const safe=(r.enemies||[]).find(e=>e?.hp>0&&e!==next);
    if(safe){next=safe;thornRedirects++;}
   }else if(next!==baseline&&next?.stage82?.type==='the_gilded')thornRedirects++;
   if(next&&a.selectCombatTarget(r,next)){switches++;
    if(next.stage83Summoned&&next.stage83Summoner==='elite')minionFocusSwitches++;}
  }
  const focusedSummon=!!(r.enemy?.hp>0&&r.enemy.stage83Summoned&&r.enemy.stage83Summoner==='elite');
  const focused=r.enemy,before=AGENT.snapshot(r);
  peakLiveEnemies=Math.max(peakLiveEnemies,[...before.values()].filter(e=>e.hp>0).length);
  const tickStartedAt=r.combatSeconds||0;
  a.tick();ticks++;
  scaler.apply(r); // Newly materialized summons, at the next simulation tick boundary.
  const change=AGENT.changes(before,AGENT.snapshot(r),focused);
  for(const role of Object.keys(healthLost)){
   healthLost[role]+=change.roles[role];barrierLost[role]+=change.wards[role];
   healthGained[role]+=change.healthGained[role];barrierGained[role]+=change.wardGained[role];
  }
  nonFocusedHealthLost+=change.nonFocusedHp;
  observedNewEnemies+=change.newEnemies;
  untrackedDisappeared+=change.disappeared;
  if(focusedSummon)minionFocusSeconds+=Math.max(0,(r.combatSeconds||0)-tickStartedAt);
  minimum=Math.min(minimum,Math.max(0,r.hp)/(r.maxhp||1));
  if(ticks%250===0){
   timeoutTrace.push(AGENT.combatTracePoint(r,ticks,a.controller().state.stage));
   if(context.surrenderPolicy==='observed-stalemate-v1'&&initial===1&&first===r.enemy&&!first.boss&&!first.miniboss&&r.status==='fight'){
    const decision=AGENT.surrenderDecision(timeoutTrace);
    if(decision&&a.surrender(r)){surrenderReason=decision;break;}
   }
  }
 }
 const stage=a.controller().state.stage,preparedId=a.state().automaticTalents.prepared||null;
 const timedOut=!surrenderReason&&r.status==='fight'&&ticks>=tickLimit;
 if(timedOut&&timeoutTrace.at(-1)?.tick!==ticks)timeoutTrace.push(AGENT.combatTracePoint(r,ticks,stage));
 return {
  preparedId,preparedActivations:preparedId?Number(r.outerUses?.[preparedId]||0):0,
  kind:first?.boss?'boss':first?.miniboss?'elite':'combat',initialEnemies:initial,
  initialMinions,initialNormals,initialRoleCounts,
  aoePotential,aoeTalentIds:aoePrepared,actualWeapon,actualOffhand,actualElement,actualTalentNodes:actualNodes,stats:fightStats,
  passiveActivations:Object.fromEntries(Object.entries(a.build()?.runtime?.passiveTelemetry||{}).map(([id,x])=>[id,Math.max(0,(Number(x.activations)||0)-(activationBefore[id]||0))]).filter(([,n])=>n>0)),
  abilityMetrics:Object.fromEntries(Object.entries(r.metrics||{}).filter(([k,v])=>Number.isFinite(v)&&/^(arcane_nova|mana_convergence|frost_resonance|glacial_echo|controlled_burn|cinder_focus|static_focus|storm_conductor|decayPrimaryPaid|contagiousTouch|corruptionNova|corruptionOverflow|soulDrain|corruptionCycle|rotguard|vital_pulse|living_force|livingForce|grasping_roots|ward_echo|storedForce|graveBloom|secondaryBleed|secondaryRot|secondarySunder|bossHealing|bossSummons|bossNodeDestroyed|bossMinionDeaths|eliteSummons|solarRebuke|periodicDamage|offhandOrbBarrier|offhandTomeMana|offhandCharmHealing)/.test(k)).map(([k,v])=>[k,Math.max(0,v-(metricBefore[k]||0))])),

  decayMetrics:Object.fromEntries(decayKeys.map(k=>[k,Math.max(0,(Number(r.metrics?.[k])||0)-decayBefore[k])])),
  secondaryTargetDamage:Math.round(measured('secondaryTargetDamage')),
  secondaryTargetHits:Math.round(measured('secondaryTargetHits')),
  bossStyle:first?.boss?first.bossStyle:null,eliteType:first?.miniboss?first.eliteType:null,
  strategy:adaptive?'adaptive':'baseline',capabilities:cap,
  status:surrenderReason?'surrendered':r.status,died:!surrenderReason&&(r.hp<=0||stage==='failed'),
  surrendered:!!surrenderReason,...(surrenderReason?{surrenderReason,surrenderDiagnostic:{trace:timeoutTrace,observedHealthGainedByRole:healthGained,observedBarrierGainedByRole:barrierGained}}:{}),
  won:r.status==='cleared'&&stage!=='failed',timedOut,
  ...(timedOut?{timeoutDiagnostic:{tickLimit,stage,trace:timeoutTrace,
   observedHealthGainedByRole:healthGained,observedBarrierGainedByRole:barrierGained}}:{}),
  seconds:round((r.combatSeconds||0)-startedAt),updateCalls:ticks,targetSwitches:switches,thornRedirects,minionFocusSwitches,
  minionFocusSeconds:round(minionFocusSeconds),hpStart:round(start),hpEnd:round(Math.max(0,r.hp)),
  hpMax:round(r.maxhp),minHpPct:round(minimum*100,1),
  damageTaken:Math.round(r.metrics?.damageTaken||0),
  damageDealt:Math.round(r.metrics?.damageDealt||0),
  mpStart:round(mpStart),mpEnd:round(Math.max(0,r.mp)),mpMax:round(maxmp),
  manaSpent:round(measured('manaSpent')),fundedCasts:Math.round(measured('fundedCasts')),
  infusionActivations:Math.round(measured('infusionActivations')),
  infusionHits:Math.round(measured('infusionHits')),
  infusionDamage:Math.round(measured('infusionDamage')),
  unfundedCasterAttacks:Math.round(measured('unfundedCasterAttacks')),
  // Observed per-tick NET HP/barrier deltas: NOT source-attributed AoE.
  // Healing within a tick and removed enemies can undercount these values.
  observedHealthLostByRole:Object.fromEntries(Object.entries(healthLost).map(([k,v])=>[k,round(v)])),
  observedBarrierLostByRole:Object.fromEntries(Object.entries(barrierLost).map(([k,v])=>[k,round(v)])),
  observedNonFocusedHealthLost:round(nonFocusedHealthLost),
  observedNewEnemies,untrackedDisappeared,peakLiveEnemies,captureAssistance:{...scaler.metrics},
  enemyAbilityCasts:r.metrics?.enemyAbilityCasts||0,
  bossSummons:r.metrics?.bossSummons||0
 };
}
function resolveEvent(a,profile){
 const event=a.events.run()?.event;
 if(!event)return null;
 const g=a.controller().state,prior=g.dungeon?.foundationState?.bossPreparation||{};
 const v=a.vitals(),oath=g.dungeon?.foundationState?.contractId==='oath_of_defiance';
 const options=oath&&event.id==='forgotten_reliquary'?[1,2]:
  eventOptions(event.id,v,profile,{reliquaryCompleted:prior.reliquary});
 for(const choice of options){
  // Only Relic Collector consumes an optional Bag item. Passing a shard to
  // any event (even pass) is rejected by the native transaction guard.
  // Keep the existing non-valuable sacrifice policy, excluding protected shards.
  const itemId=event.id==='relic_collector'&&choice!==2
   ?a.bag.items().filter(i=>i.kind!=='valuable'&&i.kind!=='runestone_shard').at(-1)?.id
   :undefined;
  const hpBefore=v.hp;
  if(a.events.choose(choice,itemId))
   return {event:event.id,choice,hpBefore:round(hpBefore),hpAfter:round(a.vitals().hp),
    reliquaryCompleted:!!g.dungeon?.foundationState?.bossPreparation?.reliquary};
 }
 throw Error('Native event could not resolve: '+event.id);
}
function clearResults(a,profile){
 const c=a.controller();
 for(let i=0;i<3&&(a.state().run?.status==='cleared'||a.results().eventExitPending);i++){
  if(!a.exitResult())break;
 }
 if(c.state.stage==='finished'||c.state.stage==='failed'){
  for(let i=0;i<3&&a.results().review;i++)a.exitResult();
 }
}
function playDungeon(a,level,profile,opts,decisionModel='risk-aware',captureMode='natural'){
 const c=a.controller(),g=c.state,flags=policyFlags(decisionModel);
 if(g.unlocked<level)throw Error('Cannot bypass native unlock from E'+g.unlocked+' to E'+level);
 a.start(level,true);
 if(g.expedition!==level||g.stage!=='choice')throw Error('Native Expedition start rejected at E'+level+' '+JSON.stringify({
  stage:g.stage,unlocked:g.unlocked,stash:a.state().stash?.length,
  nativeOccupied:a.storage?.occupied?.(),nativeCapacity:a.storage?.capacity?.(),
  nativeHasRoom:a.storage?.hasRoom?.(),
  stashCapacity:a.state().stashCapacity,overflow:a.state().expeditionOverflow?.length,
  review:!!a.results().review}));
 if(!g.dungeon?.cards?.length)throw Error('Natural Realm Cards were not generated');
 const cap=flags.realm?capabilities(a):null;
 // Rendered 3-card information only: one publicly known omen, condition,
 // affinity, risk and favoured loot. Never read the other hidden omens.
 const visible=Object.fromEntries(g.dungeon.cards.map(card=>{
  const shown=g.dungeon.foundationManifest?.cards?.find(v=>v.realmId===card.id);
  return [card.id,{conditionId:shown?.conditionId||null,
   omenId:shown?.bossModifierIds?.[0]||null}];
 }));
 const ranks=rankRealms(g.dungeon.cards,profile,gearSnapshot(a),{capabilities:cap,visible});
 const card=ranks[0].card;
 c.chooseRealm(card.id);
 const offer=c.offerContracts(a.state().crafting?.learnedRecipes||[]);
 const contract=chooseContract(offer,profile,card);
 const contractPrize=contract?JSON.parse(JSON.stringify(offer.rewards[contract])):null;
 if(offer)c.chooseContract(contract);
 const report={level,realm:card.id,affinity:card.family,risk:card.risk,contract,
  contractOptions:offer?.ids||[],contractPrize,
  realmCondition:visible[card.id]?.conditionId||null,
  decisionModel,initialCapabilities:cap||capabilities(a),
  realmEvaluations:ranks.map(x=>({id:x.card.id,affinity:x.card.family,risk:x.card.risk,
   totalScore:x.score,baseScore:x.baseScore,...x.fit})),rooms:[],
  events:[],boons:[],potions:[],equipped:[],decisions:[],
  xpStart:a.state().automaticTalents.xp,goldStart:a.state().gold,
  fragmentsStart:a.state().fragments,essenceStart:a.state().crafting?.essence||0,
  stepsStart:g.dungeon.steps,bossReached:false,extracted:false,status:null,error:null,
  prepAtBoss:null,prepFinal:null};
 for(let iteration=0;iteration<opts.maxRooms&&g.stage==='choice';iteration++){
  clearResults(a,profile);
  if(g.stage!=='choice')break;
  if(g.dungeon.boonOffer){
   let offer=g.dungeon.boonOffer;
   rerollPoorBoonAtShrine(a,offer,profile,report.potions);recordAutomaticPotions(a,report.potions);
   offer=g.dungeon.boonOffer;
   const context={vitals:a.vitals(),steps:g.dungeon.steps,bossSoon:g.dungeon.steps<=5,
    bleedReady:a.state().automaticTalents.nodes.includes('affinity_blood'),owned:[...a.state().automaticTalents.nodes],element:a.state().automaticTalents.element,cap:capabilities(a)};
   const boon=chooseBoon(offer,profile,context);
   c.chooseBoon(boon);
   report.boons.push({id:boon,room:offer.room,score:boonScore(boon,profile,context)});
   continue;
  }
  if(g.dungeon.contractOffer){c.chooseContract(null);continue;}
  report.equipped.push(...equipEarned(a,profile,true));
  // Resolve Bag overflow using native discard (not by deleting stash objects).
  for(let discard=0;discard<10&&a.bag.overflow()>0;discard++){
   const spare=[...a.bag.items()].filter(x=>x.kind!=='valuable')
    .sort((x,y)=>gearScore(x,profile)-gearScore(y,profile))[0];
   if(!spare||!a.bag.discard(spare.id))break;
  }
  const roomContext=()=>({equipment:a.state().equip,
   ...(flags.rooms?{capabilities:capabilities(a)}:{}),
   recentFights:report.rooms,cha:a.baseStats()?.cha??5,
   ...(decisionModel!=='legacy'?{carriedBagItems:a.bag.items().length}:{})});
  let next=selectRoom(c,profile,a.vitals(),roomContext());
  if(!next&&g.dungeon.steps<=4&&usePotionKind(a,'trail','restore_route_steps',report.potions))
   next=selectRoom(c,profile,a.vitals(),roomContext());
  if(next){
   usePotionsBetween(a,profile,report.potions,next);recordAutomaticPotions(a,report.potions);
   next=selectRoom(c,profile,a.vitals(),roomContext()); // Native potions can change options.
  }
  const current=a.vitals(),ratio=current.maxhp>0?current.hp/current.maxhp:0;
  const baseline=decisionModel==='legacy'
   ?{extract:!next||ratio<profile.retreatAt&&report.rooms.length>0&&
     !['shrine','spring','event'].includes(next.type),
     reason:next?'legacy_hp_threshold':'no_legal_path',hpRatio:round(ratio)}
   :evaluateRetreat({hp:current.hp,maxhp:current.maxhp,bag:a.bag.items(),next,profile,
     gold:a.state().gold,fragments:a.state().fragments,
     essence:a.state().crafting?.essence||0,recentFights:report.rooms,
     capabilities:flags.retreat?capabilities(a):null});
  const secure=contractExitDecision(g,next,current);
  const decision=secure?{...baseline,...secure}:baseline;
  if(decision.extract){
   report.decisions.push({type:'extract',...decision,steps:g.dungeon.steps});
   if(a.checkpoint.extract()){report.extracted=true;break;}
   report.error='Native extraction rejected after route or HP decision';break;
  }
  report.decisions.push({type:'move',room:next.room,node:next.type,cost:next.cost,
   ...(decisionModel!=='legacy'?{riskAssessment:decision}:{}),
   ...(flags.rooms?{capabilities:capabilities(a)}:{}),
   visibleMobRange:next.visibleMobRange||null,stepsRemaining:g.dungeon.steps,
   hpRatio:round(ratio),slack:next.slack,objective:next.objective,reliquary:next.reliquary,
   elite:next.elite,eligibleEliteAlternatives:next.eligibleEliteAlternatives});
  if(!c.visitRoom(next.room,profile.families)){report.error='Native room travel rejected '+next.room;break;}
  if(g.dungeon.boonOffer)continue;
  const node=card.nodes[next.room];
  if(!a.enter()){report.error='Native room entry rejected '+next.room;break;}
  recordAutomaticPotions(a,report.potions);
  if(a.events.run()?.event){
   const event=resolveEvent(a,profile);
   report.events.push({room:next.room,...event});
   clearResults(a,profile);continue;
  }
  if(!a.state().run||a.state().run.status!=='fight'){
   report.error='Entered room without native fight/event at '+next.room;break;
  }
  if(node.kind==='boss'){
   report.bossReached=true;
   report.prepAtBoss=JSON.parse(JSON.stringify(g.dungeon.foundationState?.bossPreparation||{}));
   report.bossInitialModifiers=[...(a.state().run?.bossModifierIds||[])];
   report.bossInitialHP=a.state().run?.enemies?.find(e=>e?.boss)?.maxhp||
    a.state().run?.enemy?.maxhp||null;
  }
  // Record every native drop, including the first room: there is no guaranteed gear.
  const wasFirstRoom=g.dungeon?.cleared?.length===1&&!g.selected.boss;
  const fight=fightNatural(a,profile,opts.tickLimit,{adaptiveTargets:flags.targets,capabilities:capabilities(a),level,captureMode,surrenderPolicy:opts.surrenderPolicy});
  const actualDrops=(a.state().run?.loot||[]).map(item=>
   ({slot:item.slot,rarity:item.rarity,subtype:item.subtype,source:item.source}));
  report.rooms.push({room:next.room,roomType:node.kind,...fight,
   loot:actualDrops,firstRoom:!!wasFirstRoom,
   ...(node.kind==='boss'?{bossModifiers:[...(report.bossInitialModifiers||[])]}:{}),
   ...(node.kind==='elite'?{marked:next.room===card.objective}:{})});
  if(fight.timedOut){report.error='Native combat timeout';break;}
  if(fight.died||fight.surrendered)break;
  clearResults(a,profile);
 }
 if(g.stage==='choice'&&!report.extracted&&!report.error){
  if(a.checkpoint.extract())report.extracted=true;
  else report.error='Iteration cap reached without a legal native extraction';
 }
 recordAutomaticPotions(a,report.potions);
 report.prepFinal=JSON.parse(JSON.stringify(g.dungeon?.foundationState?.bossPreparation||{}));
 clearResults(a,profile);
 // Native extraction uses controller.abandon(), marking the session as failed.
 // Trust explicit native extraction success over the controller's terminal flag.
 report.status=g.stage==='finished'?'victory':report.extracted?'extracted':report.error?'error':g.stage==='failed'?'defeat':g.stage;
 const terminal=['victory','extracted','defeat'].includes(report.status)?report.status:null;
 report.contractProgress=K.progress(g);
 report.contractResult=K.inspect(g,terminal);
 report.contractPaid=g.dungeon?.stage7RewardPaid?JSON.parse(JSON.stringify(g.dungeon.stage7RewardPaid)):null;
 report.contractCompleted=!!report.contractProgress?.done;
 report.contractPayoutSecured=!!report.contractPaid;
 if(report.contractPaid&&(!['victory','extracted'].includes(report.status)||
   !report.contractCompleted||report.contractPaid.id!==contract))
  throw Error('Contract reward without a valid native completion and safe exit');
 if(contract&&(report.contractResult?.status==='completed')!==!!report.contractPaid)
  throw Error('Contract summary and native receipt disagree');
 report.xpEnd=a.state().automaticTalents.xp;
 report.xpEarned=report.xpEnd-report.xpStart;
 report.goldEnd=a.state().gold;
 report.stepsEnd=g.dungeon?.steps??null;
 report.gearAfter=gearSnapshot(a);
 report.surrendered=report.rooms.some(r=>r.surrendered);
 report.bossWon=report.status==='victory'&&report.bossReached;
 report.fightsWon=report.rooms.filter(r=>r.won).length;
 report.damageTaken=report.rooms.reduce((n,r)=>n+r.damageTaken,0);
 report.seconds=round(report.rooms.reduce((n,r)=>n+r.seconds,0));
 return report;
}
function simulateAccount(seed,id,opts,simulationOptions={}){
 // Stage 6.32: read-only research cohorts may pass an explicit, validated agent
 // profile. Native game rewards, talents, equipment and combat are unchanged.
 const sourceProfile=simulationOptions.researchProfiles?.[id]||PROFILES[id],decisionModel=simulationOptions.decisionModel||'adaptive';
 // Current ordinary adaptive agents use approved H and B2.3 knowledge. Explicit
 // research profiles keep their named experimental policy for reproducibility.
 const profile=sourceProfile&&!simulationOptions.researchProfiles?.[id]&&decisionModel==='adaptive'
  ?{...sourceProfile,synergyAudit:true,agentCompatibilityOnly:true,decisionIsolation:'hands',strictResearchIdentity:false,offhandPolicy:'b23'}
  :sourceProfile?.synergyAudit?{...sourceProfile}:sourceProfile;
 if(!profile||!profile.name||!Array.isArray(profile.families)||!profile.families.length||
  !['Cloth','Leather','Plate'].includes(profile.armor)||!Array.isArray(profile.weapons)||!profile.weapons.length||
  (profile.plan&&!Object.hasOwn(PLANNER.BUILDS,profile.plan)))throw Error('Invalid earned research profile '+id);
 policyFlags(decisionModel);
 const capturePolicy=CAPTURE.policy(simulationOptions.captureMode||'natural');
 const stopAtCamp=simulationOptions.stopAtCampLevel;
 if(stopAtCamp!==undefined&&(!Number.isInteger(stopAtCamp)||stopAtCamp<1||stopAtCamp>opts.maxLevel||typeof simulationOptions.onCamp!=='function'))throw Error('Capture stop requires valid Camp callback');
 const a=create(seed,undefined,simulationOptions.moduleOverrides||{}, {skipPersistence:true,now:1720000000000+seed});
 const initialGear=gearSnapshot(a);
 if(a.talents.earned(a.state().automaticTalents)!==0||
    !initialGear.items.length||initialGear.items.some(x=>!x.startingGear))
  throw Error('New account must start with native weak equipment and zero earned talents');
 const acc={seed,profile:id,initialGear,startXp:a.state().automaticTalents.xp,
  attempts:[],reached:[1],endLevel:null,stopReason:null,capturePolicy:{...capturePolicy}};
 let stopped=false,activeProfile=profile,pivoted=false;
 for(let level=1;level<=opts.maxLevel&&!stopped;level++){
  if(a.controller().state.unlocked<level){
   acc.stopReason='E'+level+' remains locked (prior Boss not defeated)';
   break;
  }
  if(!acc.reached.includes(level))acc.reached.push(level);
  let cleared=false;
  for(let attempt=1;attempt<=opts.maxAttempts;attempt++){
   if(opts.maxTotalAttempts&&acc.attempts.length>=opts.maxTotalAttempts){
    acc.stopReason='Total natural-attempt budget ('+opts.maxTotalAttempts+') exhausted at E'+level;
    stopped=true;break;
   }
   let entry={level,attempt,profile:id};
   try{
    const canPivot=!profile.fixedResearchBuild&&!profile.plan&&!!PIVOTS[id]&&!pivoted&&attempt>=3&&a.state().automaticTalents.nodes.length>=4&&
     acc.attempts.filter(x=>x.level===level&&!x.error&&x.status!=='error').length>=2;
    const nextProfile=canPivot?{...pivotProfile(id),...(profile.offhandPolicy==='b23'?{synergyAudit:true,agentCompatibilityOnly:true,decisionIsolation:'hands',strictResearchIdentity:false,offhandPolicy:'b23'}:{}),...(EQUIPMENT_AI.enabled(profile)?{equipmentIntelligence:profile.equipmentIntelligence,equipmentTrace:profile.equipmentTrace}:{})}:activeProfile;
    const camp=prepareCamp(a,nextProfile,level,decisionModel,
     {...(canPivot?{resetReason:'two_undefeated_attempts_at_E'+level}:profile.plan?{history:acc.attempts,priorResets:acc.attempts.reduce((n,t)=>n+(t.camp?.resets?.length||0),0)}:{}),equipEarnedRunes:simulationOptions.equipEarnedRunes!==false});
    if(canPivot){if(camp.resets.length!==1)throw Error('Expected one native profile reset');activeProfile=nextProfile;pivoted=true;}
    // Optional Stage 6.9 diagnostic splice: can only execute real Camp
    // transactions (talent reset/allocate/prepare). Hard-gate every resource,
    // inventory, earned XP and native Expedition unlock against mutation.
    let earnedProbe=null;
    if(typeof simulationOptions.onCamp==='function'){
     const state=a.state(),fixed=JSON.stringify({
      xp:state.automaticTalents.xp,gold:state.gold,fragments:state.fragments,
      essence:state.crafting?.essence||0,crafting:state.crafting,apothecary:state.apothecary,equip:state.equip,stash:state.stash,
      consumables:state.consumables,potionSelection:state.potionSelection,
      runes:state.runes,runeSlots:state.runeSlots,expeditionOverflow:state.expeditionOverflow,
      unlocked:a.controller().state.unlocked
     });
     earnedProbe=simulationOptions.onCamp({a,seed,profile:nextProfile,level,attempt,
      previousAttempts:acc.attempts,camp});
     const afterState=a.state();
     const remaining=JSON.stringify({
      xp:afterState.automaticTalents.xp,gold:afterState.gold,fragments:afterState.fragments,
      essence:afterState.crafting?.essence||0,crafting:afterState.crafting,apothecary:afterState.apothecary,equip:afterState.equip,stash:afterState.stash,
      consumables:afterState.consumables,potionSelection:afterState.potionSelection,
      runes:afterState.runes,runeSlots:afterState.runeSlots,expeditionOverflow:afterState.expeditionOverflow,
      unlocked:a.controller().state.unlocked
     });
     if(remaining!==fixed||!a.talents.valid(afterState.automaticTalents))
      throw Error('Earned checkpoint test changed equipment, resources, XP, unlocks or invalid talents');
    }
    if(stopAtCamp===level&&attempt===1){acc.stopReason='Reached requested native Camp E'+level;stopped=true;cleared=true;break;}
    const before={consumables:{...a.state().consumables},potionSelection:[...a.state().potionSelection],xp:a.state().automaticTalents.xp,earned:a.talents.earned(a.state().automaticTalents),
     spent:a.state().automaticTalents.nodes.length,
     attributeEarned:a.talents.attributeBudget(a.state().automaticTalents),
     attributeSpent:a.talents.spentAttributes(a.state().automaticTalents),
     attributes:a.talents.attributes(a.state().automaticTalents),gear:gearSnapshot(a),strategy:activeProfile.variantId||id,gold:a.state().gold,
     fragments:a.state().fragments,essence:a.state().crafting?.essence||0,reagents:{...a.state().crafting?.cores},
     talentNodes:[...a.state().automaticTalents.nodes],
     element:a.state().automaticTalents.element||null,
     prepared:a.state().automaticTalents.prepared||null,
     unlocked:a.controller().state.unlocked,runeBag:a.state().runes.map(r=>({...r})),runeSlots:[...a.state().runeSlots]};
    if(simulationOptions.equipEarnedRunes===false&&before.runeSlots.some(Boolean))throw Error('No-rune policy equipped a rune');
    const encounter=playDungeon(a,level,activeProfile,opts,decisionModel,capturePolicy.mode);
    if(encounter.xpEnd<before.xp)throw Error('Native earned XP decreased');
    entry={...entry,camp,before,...(earnedProbe?{earnedProbe}:{}),...encounter,
     after:{consumables:{...a.state().consumables},potionSelection:[...a.state().potionSelection],xp:a.state().automaticTalents.xp,earned:a.talents.earned(a.state().automaticTalents),
      spent:a.state().automaticTalents.nodes.length,
      attributeEarned:a.talents.attributeBudget(a.state().automaticTalents),
      attributeSpent:a.talents.spentAttributes(a.state().automaticTalents),
      attributes:a.talents.attributes(a.state().automaticTalents),unlocked:a.controller().state.unlocked,
      gold:a.state().gold,fragments:a.state().fragments,
      essence:a.state().crafting?.essence||0,reagents:{...a.state().crafting?.cores},
      talentNodes:[...a.state().automaticTalents.nodes],
       element:a.state().automaticTalents.element||null,
      prepared:a.state().automaticTalents.prepared||null,runeBag:a.state().runes.map(r=>({...r})),runeSlots:[...a.state().runeSlots]}};
    if(entry.status==='error'||entry.error){acc.stopReason='Simulator limitation at E'+level+': '+entry.error;stopped=true;}
    if(entry.bossWon){
     if(a.controller().state.unlocked<level+1)throw Error('Native Boss won but next Expedition is not unlocked');
     cleared=true;
    }
   }catch(err){
    // Preserve the exact native state and call site for a failed attempt.
    // This is read-only diagnosis, not a retry, save repair, reset or catch-up XP.
    const progress=a.state().automaticTalents;
    entry.error=err.message;entry.status='error';
    entry.diagnostic={stack:String(err.stack||err).slice(0,4200),
     talentValid:a.talents.valid(progress),
     talentProgress:{...progress,nodes:[...(progress?.nodes||[])]},
     priorAttempt:acc.attempts.at(-1)?{level:acc.attempts.at(-1).level,
      attempt:acc.attempts.at(-1).attempt,status:acc.attempts.at(-1).status}:null};
    acc.stopReason='Native runner error at E'+level+': '+err.message;stopped=true;
   }
   acc.attempts.push(entry);
   // Stage 6.26: stop an intact native account after the attempt that genuinely
   // reached 10,000 XP; no synthetic awards/unlocks and no replay of that attempt.
   if(simulationOptions.stopAtTalentCap===true&&
     a.talents.earned(a.state().automaticTalents)>=100){
    acc.stopReason='Native 100-point Talent cap reached at E'+level;
    stopped=true;
   }
   // Only for isolated matched combat probes: stop after a single native
   // attempt at the specified reachable E. No level is unlocked artificially.
   if(simulationOptions.probeLevel===level&&attempt===1){
    acc.stopReason='Matched earned-account probe completed at E'+level;
    stopped=true;
   }
   if(cleared||stopped)break;
  }
  if(!cleared&&!stopped){acc.stopReason='E'+level+' unbeaten after '+opts.maxAttempts+' native attempts';stopped=true;}
 }
 acc.endLevel=a.controller().state.unlocked;
 acc.xp=a.state().automaticTalents.xp;
 acc.talents=a.state().automaticTalents.nodes;
 acc.finalGear=gearSnapshot(a);
 acc.gold=a.state().gold;acc.fragments=a.state().fragments;
 acc.runeBag=a.state().runes.map(r=>({...r}));acc.runeSlots=[...a.state().runeSlots];
 return acc;
}
function analyze(accounts,opts){
 const levels=[];
 for(let E=1;E<=opts.maxLevel;E++){
  const attempts=accounts.flatMap(a=>a.attempts.filter(x=>x.level===E));
  const reached=accounts.filter(a=>a.reached.includes(E)).length;
  const wins=attempts.filter(a=>a.bossWon).length,deaths=attempts.filter(a=>a.status==='defeat').length;
  const valid=attempts.filter(a=>!a.error&&a.status!=='error');
  levels.push({level:E,accountsReached:reached,attempts:attempts.length,validAttempts:valid.length,
   wins,deaths:deaths-attempts.filter(a=>a.surrendered).length,surrenders:attempts.filter(a=>a.surrendered).length,extractions:attempts.filter(a=>a.status==='extracted').length,
   errors:attempts.filter(a=>a.status==='error'||a.error).length,
   bossReached:attempts.filter(a=>a.bossReached).length,
   roomsWon:attempts.reduce((n,a)=>n+(a.fightsWon||0),0),
   eligibleEliteDecisions:attempts.reduce((n,a)=>n+
    (a.decisions||[]).filter(x=>x.type==='move'&&x.eligibleEliteAlternatives?.length).length,0),
   eliteFights:attempts.reduce((n,a)=>n+(a.rooms||[]).filter(x=>x.roomType==='elite').length,0),
   eliteWins:attempts.reduce((n,a)=>n+(a.rooms||[]).filter(x=>x.roomType==='elite'&&x.won).length,0),
   eliteDrops:attempts.reduce((n,a)=>n+(a.rooms||[]).filter(x=>x.roomType==='elite')
    .reduce((k,x)=>k+(x.loot?.length||0),0),0),
   ordinaryGearDrops:attempts.reduce((n,a)=>n+(a.rooms||[]).filter(x=>x.roomType==='combat')
    .reduce((k,x)=>k+(x.loot?.length||0),0),0),
   ordinaryGreyDrops:attempts.reduce((n,a)=>n+(a.rooms||[]).filter(x=>x.roomType==='combat')
    .reduce((k,x)=>k+(x.loot||[]).filter(item=>item.rarity==='Common').length,0),0),
   firstRoomGearDrops:attempts.reduce((n,a)=>n+(a.rooms||[]).filter(x=>x.firstRoom)
    .reduce((k,x)=>k+(x.loot?.length||0),0),0),
   firstRoomsWithoutGear:attempts.reduce((n,a)=>n+(a.rooms||[]).filter(x=>x.firstRoom&&x.won&&!(x.loot?.length)).length,0),
   campGreySalvaged:attempts.reduce((n,a)=>n+(a.camp?.salvagedGrey||0),0),
   forgeFragmentsFromGrey:attempts.reduce((n,a)=>n+(a.camp?.salvageFragments||0),0),
   nativeXpEarned:attempts.reduce((n,a)=>n+(a.xpEarned||0),0),
   permanentAttributePointsSpent:attempts.reduce((n,a)=>n+(a.camp?.attributes?.length||0),0),
   potionsUsed:attempts.reduce((n,a)=>n+(a.potions?.length||0),0),
   boonsSelected:attempts.reduce((n,a)=>n+(a.boons?.length||0),0),
   contractsSelected:attempts.filter(a=>!!a.contract).length,
   contractsReady:attempts.filter(a=>a.contractCompleted).length,
   contractsPaid:attempts.filter(a=>a.contractPayoutSecured).length,
   contractsForfeited:attempts.filter(a=>a.contractCompleted&&!a.contractPayoutSecured&&a.status==='defeat').length,
   blueprintsSecured:attempts.filter(a=>a.contractPaid?.kind==='blueprint').length,
   contractRewardKinds:Object.fromEntries(['gold','essence','fragments','reagent','potion','blueprint']
    .map(kind=>[kind,attempts.filter(a=>a.contractPaid?.kind===kind).length])),
   markedElitePreparations:attempts.filter(a=>a.prepFinal?.markedElite).length,
   reliquaryPreparations:attempts.filter(a=>a.prepFinal?.reliquary).length,
   reachedBossWithPreparation:attempts.filter(a=>a.bossReached&&
    (a.prepAtBoss?.markedElite||a.prepAtBoss?.reliquary)).length,
   gearUpgrades:attempts.reduce((n,a)=>n+(a.equipped?.length||0)+(a.camp?.equipped?.length||0),0),
   reagentRefinements:attempts.reduce((n,a)=>n+(a.camp?.refined?.length||0),0),
   runeEquips:attempts.reduce((n,a)=>n+(a.camp?.runes||[]).filter(x=>x.action==='equip').length,0),
   runesRecycled:attempts.reduce((n,a)=>n+(a.camp?.runes||[]).filter(x=>x.action==='recycle').reduce((m,x)=>m+x.count,0),0),
   potionPurchases:attempts.reduce((n,a)=>n+(a.camp?.potions||[]).filter(x=>x.action==='buy').length,0),
   potionCrafts:attempts.reduce((n,a)=>n+(a.camp?.potions||[]).filter(x=>x.action==='craft').length,0),
   autoPotionsUsed:attempts.reduce((n,a)=>n+(a.potions||[]).filter(x=>x.automatic).length,0),
   potionKindsUsed:[...new Set(attempts.flatMap(a=>(a.potions||[]).map(x=>x.kind)))].sort(),
   thornRedirects:attempts.reduce((n,a)=>n+(a.rooms||[]).reduce((m,r)=>m+(r.thornRedirects||0),0),0),
   talentResets:attempts.reduce((n,a)=>n+(a.camp?.resets?.length||0),0),
   elementalSelections:attempts.reduce((n,a)=>n+(a.camp?.elementChoices?.length||0),0),
   advancedPrepared:attempts.filter(a=>!!a.before?.prepared).length,
   preparedActivations:attempts.reduce((n,a)=>n+(a.rooms||[]).reduce((m,r)=>m+(r.preparedActivations||0),0),0),
   strategyPivots:attempts.filter(a=>!!a.before?.strategy?.endsWith('-pivot')).length,
   observations:attempts.length?null:'not_reached; do not infer win rate'});
 }
 return {stage:'S3',schemaVersion:6,engine:'v0.13 live native account, dungeon and combat runtime',
  source:S.sourceFingerprint().sha256,
  runnerSha256:crypto.createHash('sha256').update(fs.readFileSync(__filename)).digest('hex'),
  agentStrategySha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,'v013-agent-strategy.cjs'))).digest('hex'),
  buildPlannerSha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,'v013-build-planner.cjs'))).digest('hex'),
  settings:opts,
  integrity:{
   noFabricatedXp:true,noForcedEquipment:true,noForcedEncounter:true,
   noForcedLevelUnlock:true,noDamageOverride:true,
   policy:'Finite decision heuristics, native UI-equivalent actions; no human simulation claim'
  },limitations:[
   'Profiles are transparent deterministic heuristics, not human observations or reinforcement-learned expert behavior.',
   'A completed E requires a native Boss victory. E levels not unlocked by that account are NOT simulated.',
   'No guaranteed drops, fixed rarity, synthetic starting gear, invented XP or teleporting Boss to first room.',
   'Consumables can only be used between rooms or at native Shrine windows; no mid-combat healing.',
   'The map topology and known/scouted room types guide movement; hidden room types are not read for priority scoring.',
   'No simulated manual dodging, frame-perfect casts, merchant browsing strategy or exhaustive craft optimization.',
   'S1 uses native tier upgrades, prepared talents, elemental attunement and one possible full reset after repeated legitimate failure; exact player optimization remains unvalidated.',
   'Limited seeds, attempts and behavior profiles: pilot-only, not statistical balance rates.'
  ],coverage:{accounts:accounts.length,attempts:accounts.reduce((n,a)=>n+a.attempts.length,0),
    errors:accounts.flatMap(a=>a.attempts).filter(x=>x.error||x.status==='error').length,
    completedE8:accounts.filter(a=>a.reached.includes(8)&&a.attempts.some(x=>x.level===8&&x.bossWon)).length,
    completedE10:accounts.filter(a=>a.reached.includes(10)&&a.attempts.some(x=>x.level===10&&x.bossWon)).length},
  levels,accounts};
}
function run(opts=parseArgs(),simulationOptions={}){
 const accounts=[];
 for(const seed of opts.seeds)for(const id of opts.profiles)accounts.push(simulateAccount(seed,id,opts,simulationOptions));
 return analyze(accounts,{...opts,decisionModel:simulationOptions.decisionModel||'adaptive'});
}
function markdown(data){
 const out=['# Wanderer v0.13 — Native Grey loot, salvage and progression E1–E'+data.settings.maxLevel,'',
  '**One persistent native account from E1; XP, equipment, rewards, resources and unlocks are never fabricated.**',
  '', 'Engine fingerprint: '+data.source,'', 'Natural runner SHA-256: '+data.runnerSha256,'',
  '## E1–E'+data.settings.maxLevel+' natural-account pilot','',
  '| E | Accounts reached | Attempts | Wins | Deaths | Extractions | Boss reached | Prepared bosses | Marked Elites | Elite fights | Elite wins | Elite drops | Grey drops | First-room drops | First rooms without gear | Grey salvaged | Forge Fragments from Grey | Reliquaries | Boons | Potions | Rooms won | Native XP | Gear changes | Errors |',
  '|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|'];
 for(const x of data.levels)out.push('| E'+x.level+' | '+x.accountsReached+' | '+x.attempts+' | '+x.wins+
  ' | '+x.deaths+' | '+x.extractions+' | '+x.bossReached+' | '+x.reachedBossWithPreparation+' | '+x.markedElitePreparations+' | '+x.eliteFights+' | '+x.eliteWins+' | '+x.eliteDrops+' | '+x.ordinaryGreyDrops+' | '+x.firstRoomGearDrops+' | '+x.firstRoomsWithoutGear+' | '+x.campGreySalvaged+' | '+x.forgeFragmentsFromGrey+' | '+x.reliquaryPreparations+' | '+x.boonsSelected+' | '+x.potionsUsed+' | '+x.roomsWon+' | '+x.nativeXpEarned+' | '+x.gearUpgrades+' | '+x.errors+' |');
 out.push('','## Account outcomes','');
 for(const a of data.accounts){
  out.push('- '+a.profile+' / seed '+a.seed+': unlocked E'+a.endLevel+'; '+a.attempts.length+' attempts; XP '+a.xp+
   '; talents '+a.talents.length+'; gear '+a.finalGear.total+' pieces ('+a.finalGear.starter+' starter); '+(a.stopReason||'target completed'));
 }
 out.push('','## How to interpret','',
  '- Attempts only happen at an **actually unlocked** Expedition. Unreached E levels are censored and have no win rate.',
  '- Native Grey loot, gear swaps, real Camp salvage into Forge Fragments, XP awards, talents, Contracts, Echo Fonts, events, Gold shops and potions are tracked without injecting inventory.',
  '- Combat target switching has a reaction delay; map traversal uses native movement and step costs; hidden room types are not peeked for room selection.',
  '- Boon decisions are ranked by actual trade-offs, not chosen blindly by Affinity; native Fate rerolls are conditional.',
  '- The agent selects one of the two feasible Contracts using their displayed single-prize offers; native objective progress, Boss/extraction payout and death forfeiture are recorded without fake awards.',
  '- Marked Chambers, two real Shrine Boons, normal combat targets, Elite and Reliquary influence reachable routing. A chosen Oath never intentionally disables a Boss seal.',
  '- Native potions are purchased or crafted with earned resources; automatic doses are recorded at native loadout start and manual uses are limited to legal windows.',
  '- S1: the Camp compares crafting previews with real named-tier upgrade requirements and never bypasses materials or Expedition unlocks.',
  '- S1: earned talents can select Fire/Frost/Lightning, choose an owned advanced prepared skill, and reset (without losing XP) once after two failed attempts when at least four talent nodes exist.',
  '- Elite route scores compare native Elite 60% loot odds to ordinary room odds, including extra Grey loot, Gold/Fragments, Marked Elite rewards and Boss preparation; they never guarantee a drop.',
  '- Boss preparation is earned via the real marked Elite and Severance Spire; both are separately counted, including preparation at Boss entry.',
  '- A win requires the real Boss at its natural map location. Extracting saves resources but **does not unlock E+1**.',
  '- The policy is more human-like than synthetic cohorts, but **not** a validated model of how actual players play.',
  '- Review full JSON per account and investigate runtime errors separately from player deaths before balancing.', '');
 return out.join('\n');
}
function main(args=process.argv.slice(2)){
 const opts=parseArgs(args),report=run(opts),dest=path.resolve(process.cwd(),opts.output);
 fs.mkdirSync(path.dirname(dest),{recursive:true});
 fs.writeFileSync(dest,JSON.stringify(report,null,2)+'\n');
 fs.writeFileSync(dest.replace(/\.json$/,'.md'),markdown(report));
 console.log('NATURAL_E1_E'+opts.maxLevel+'='+JSON.stringify({source:report.source,coverage:report.coverage,levels:report.levels,
  accounts:report.accounts.map(a=>({seed:a.seed,profile:a.profile,unlocked:a.endLevel,stop:a.stopReason}))}));
 if(report.coverage.errors)process.exitCode=1;
 return report;
}
module.exports={PROFILES,PIVOTS,pivotProfile,DEFAULTS,parseArgs,softIdentityEnabled,handPairEnabled,isolatedGearGain,merchantDecisionTargets,commitmentWeight,commitmentBonus,handPairScore,offhandPairUtility,adaptiveGearGain,adaptiveTargets,gearDecisionTargets,investmentAllowed,investmentGain,synergyGearBonus,spendEarnedAttributes,gearScore,identityMatch,identityGain,identityPurchase,gearSnapshot,runeScore,manageEarnedRunes,potionScore,selectEarnedPotions,buyEarnedPotions,craftEarnedPotions,recordAutomaticPotions,refineEarnedReagents,selectThornAwareTarget,spendEarnedTalents,prepareEarnedAbility,equipEarned,
 prepareCamp,craftEarned,investEarnedGear,gearInvestmentCandidates,consolidateStash,policyFlags,capabilities,rankRealms,choiceRealm,pathLength,eliteOpportunity,selectRoom,evaluateRetreat,boonScore,chooseBoon,contractScore,chooseContract,contractExitDecision,eventOptions,potionSlots,usePotionKind,usePotionsBetween,rerollPoorBoonAtShrine,
 fightNatural,resolveEvent,clearResults,playDungeon,simulateAccount,analyze,run,markdown,main};
if(require.main===module)main();
