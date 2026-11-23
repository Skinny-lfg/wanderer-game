'use strict';
// Stage 5: native real-account progression, with optional E1–E20 horizon.
// Absolutely no synthetic talent XP, fabricated gear, forced unlocks, forced
// encounters, instant-kill enemies or direct state mutation of rewards.
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const create=require('../tests/v012-economy-harness.cjs');
const S=require('./simulate-progression.cjs');
const AGENT=require('./v013-agent-strategy.cjs');
const PLANNER=require('./v013-build-planner.cjs');
require('../online/v013-map-intelligence.js');
const I=globalThis.WandererV013MapIntelligence;
require('../economy/v012-loot-rules.js');
const LOOT=globalThis.WandererV012LootRules;
// Native Stage 7 ledger and objective progress, read-only in the simulation.
require('../online/v013-expedition-contracts.js');
const K=globalThis.WandererV013ExpeditionContracts;
const PROFILES=Object.freeze({
 cautious:{name:'Cautious',risk:0,targets:['strong_heart','guarded_block','renewal'],families:['aegis','vitality'],preparedTargets:['last_bastion'],armor:'Plate',weapons:['Mace','Sword'],style:'mixed',healAt:.72,retreatAt:.5,target:'mechanics',shop:true},
 balanced:{name:'Balanced',risk:0,targets:['bleeding_edge','deep_cuts','strong_heart'],families:['blood','aegis'],preparedTargets:['red_guillotine'],armor:'Plate',weapons:['Sword','Mace'],style:'mixed',healAt:.53,retreatAt:.34,target:'mechanics',shop:true},
 daring:{name:'Daring',risk:1,targets:['quick_hands','double_strike','bleeding_edge'],families:['fury','blood'],preparedTargets:['red_guillotine'],armor:'Leather',weapons:['Daggers','Bow'],style:'mixed',healAt:.35,retreatAt:.16,target:'focus',shop:true},
 'magic-fire':{name:'Fire Caster',risk:0,targets:['element_choice','arcane_focus','mana_spring','kindling','fire_spread'],families:['magic'],element:'fire',armor:'Cloth',weapons:['Wand','Staff'],style:'focused',preparedTargets:[],healAt:.57,retreatAt:.36,target:'mechanics',shop:true},
 'magic-frost':{name:'Frost Caster',risk:0,targets:['element_choice','arcane_focus','mana_spring','deep_winter','frost_spread'],families:['magic'],element:'frost',armor:'Cloth',weapons:['Wand','Staff'],style:'focused',preparedTargets:[],healAt:.62,retreatAt:.41,target:'mechanics',shop:true},
 'magic-lightning':{name:'Lightning Caster',risk:0,targets:['element_choice','arcane_focus','mana_spring','overcharge','storm_mastery'],families:['magic'],element:'lightning',armor:'Cloth',weapons:['Staff','Wand'],style:'focused',preparedTargets:[],healAt:.54,retreatAt:.34,target:'mechanics',shop:true},
 'magic-arcane':{name:'Arcane Caster',risk:0,targets:['element_choice','arcane_focus','mana_spring','arcane_resonance','arcane_surge','arcane_mastery'],families:['magic'],element:'arcane',armor:'Cloth',weapons:['Wand','Staff'],style:'focused',preparedTargets:[],healAt:.58,retreatAt:.37,target:'mechanics',shop:true},
 'magic-wand':{name:'Wand Specialist (Fire)',risk:0,targets:['element_choice','arcane_focus','mana_spring','kindling','fire_spread'],families:['magic'],element:'fire',armor:'Cloth',weapons:['Wand'],style:'focused',preparedTargets:[],healAt:.57,retreatAt:.36,target:'mechanics',shop:true},
 'magic-staff':{name:'Staff Specialist (Fire)',risk:0,targets:['element_choice','arcane_focus','mana_spring','kindling','fire_spread'],families:['magic'],element:'fire',armor:'Cloth',weapons:['Staff'],style:'focused',preparedTargets:[],healAt:.57,retreatAt:.36,target:'mechanics',shop:true},
 'plate-warden':{name:'Plate Warden',risk:0,targets:['guarded_block','barrier_pulse','steadfast_guard','strong_heart'],families:['aegis','vitality'],armor:'Plate',weapons:['Mace','Sword'],style:'focused',preparedTargets:['last_bastion'],healAt:.68,retreatAt:.46,target:'mechanics',shop:true},
 'leather-duelist':{name:'Leather Duelist',risk:1,targets:['quick_hands','bleeding_edge','blood_drinker','precision','double_strike','blood_harvest','crimson_rush'],families:['fury','blood'],armor:'Leather',weapons:['Daggers','Bow'],style:'mixed',preparedTargets:['red_guillotine'],healAt:.42,retreatAt:.25,target:'focus',shop:true},
 'cloth-battlemage':{name:'Cloth Battlemage',risk:0,targets:['element_choice','arcane_focus','mana_spring','runic_shield','guarded_block','arcane_bastion'],families:['magic','aegis'],element:'fire',armor:'Cloth',weapons:['Wand','Staff'],style:'mixed',preparedTargets:['arcane_bastion'],healAt:.61,retreatAt:.39,target:'mechanics',shop:true},
 'hexblade-hybrid':{name:'Hexblade Hybrid',risk:1,targets:['toxic_touch','arcane_focus','affinity_aegis','mana_spring','guarded_block','arcane_resonance','hex_bolt','barrier_pulse','arcane_surge','arcane_mastery'],families:['decay','magic'],armor:'Leather',weapons:['Sword','Daggers','Wand'],offhands:['Daggers','Orb','Tome'],style:'mixed',preparedTargets:['grave_bloom'],healAt:.5,retreatAt:.29,target:'mechanics',shop:true},
 // New catalog-aware agents exist alongside old frozen Stage 6.5 profiles.
 // Their point progression and gear are strictly earned, never injected.
 ...Object.fromEntries(Object.entries(PLANNER.BUILDS).map(([id,build])=>[
  'smart-'+id,Object.freeze({name:'Strategic '+id,plan:id,risk:build.primary==='fury'?1:0,
   targets:[],families:[build.primary,...[build.secondary,build.third].filter(Boolean)],
   preparedTargets:[...(build.milestones||[])],element:build.element||undefined,
   armor:build.armor,weapons:[...build.weapons],style:build.mix?'mixed':'focused',
   healAt:(build.primary==='aegis'||build.primary==='vitality')?0.69:0.59,retreatAt:.38,
   target:build.primary==='fury'?'focus':'mechanics',shop:true})
 ]))
});
// A single deliberate retraining after two unsuccessful attempts at the same E.
// Uses the game's free full reset; it never creates XP or talent points.
const PIVOTS=Object.freeze({
 cautious:{targets:['quick_hands','bleeding_edge','deep_cuts'],families:['fury','blood'],preparedTargets:['red_guillotine']},
 balanced:{targets:['strong_heart','guarded_block','renewal'],families:['vitality','aegis'],preparedTargets:['last_bastion']},
 daring:{targets:['guarded_block','barrier_pulse','strong_heart'],families:['aegis','vitality'],preparedTargets:['last_bastion']},
 'magic-fire':{targets:['element_choice','arcane_focus','mana_spring','deep_winter','frost_spread'],element:'frost'},
 'magic-frost':{targets:['element_choice','arcane_focus','mana_spring','overcharge','storm_mastery'],element:'lightning'},
 'magic-lightning':{targets:['element_choice','arcane_focus','mana_spring','kindling','fire_spread'],element:'fire'}
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
function gearScore(item,profile,targetSlot=item?.slot){
 if(!item)return -1;
 // Native gear accepts Daggers in either hand. Off-hand offensive stats
 // have 50% effect. Sword + Dagger has NO independent second strike.
 const slot=targetSlot||item.slot;
 const offDagger=slot==='offhand'&&['Daggers','Off-Hand Dagger'].includes(item.subtype);
 const daggerFactor=offDagger?.5:1;
 const rarity={Common:0,Uncommon:1,Rare:2,Epic:3,Legendary:4};
 const magic=profile.families.includes('magic'),decay=profile.families.includes('decay'),
  aegis=profile.families.includes('aegis'),vitality=profile.families.includes('vitality'),
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
  Charm:11+(vitality?6:0)+(item.v013Trait==='heartbloom'?4:0),
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
 return profile.plan?PLANNER.evaluateGear(item,profile,baseline,slot):baseline;
}
function gearSnapshot(a){
 const items=Object.values(a.state().equip).filter(Boolean);
 return {total:items.length,starter:items.filter(x=>x.startingGear).length,
  rarity:Object.fromEntries([...new Set(items.map(x=>x.rarity))].sort().map(r=>[r,items.filter(x=>x.rarity===r).length])),
  items:items.map(x=>({slot:x.slot,subtype:x.subtype,armorType:x.armorType||null,
   name:x.name,rarity:x.rarity,tier:x.tier,startingGear:!!x.startingGear,
   source:x.source||null,crafted:!!x.crafted,recipeId:x.recipeId||null,v013Trait:x.v013Trait||null,
   stats:Object.fromEntries(['atk','def','hp','spd','str','agi','int','end','cha','mana',
    'spell','evasionRating','critBonus','blockBonus','manaRegenBonus','wardBonus']
    .map(key=>[key,Number(x[key])||0]))}))};
}
// Current v15 graph has no T.path helper; walk its real prerequisites and let
// T.allocate enforce every purchase, point cap, rank and exclusion.
function missingPath(T,progress,target){
 const nodes=new Map(T.NODES.map(x=>[x.id,x]));
 const owned=new Set(progress.nodes),visiting=new Set(),path=[];
 function add(id){
  if(owned.has(id)||path.includes(id))return true;
  const n=nodes.get(id);
  if(!n||visiting.has(id)||n.excludes?.some(x=>owned.has(x)||path.includes(x)))return false;
  visiting.add(id);
  for(const key of [n.requires,...(n.prerequisites||[])].filter(Boolean))if(!add(key)){visiting.delete(id);return false;}
  if(n.anyRequires?.length&&!n.anyRequires.some(x=>owned.has(x)||path.includes(x))){
   const candidate=n.anyRequires.find(x=>add(x));
   if(!candidate){visiting.delete(id);return false;}
  }
  visiting.delete(id);path.push(id);return true;
 }
 return add(target)?path:null;
}
function spendEarnedTalents(a,profile){
 const T=a.talents,s=a.state(),before=s.automaticTalents;
 if(!T.valid(before))throw Error('Invalid natural talent account before spending');
 if(!a.talentActions?.available())throw Error('Talents may only be changed in Camp');
 let progress=before;const bought=[],elements=[];
 const targets=[...profile.targets,...(profile.preparedTargets||[]),...profile.families.map(x=>'affinity_'+x),...profile.families.map(x=>'root_'+x)];
 function tuneElement(){
  if(!profile.element||!progress.nodes.includes('element_choice')||progress.element===profile.element)return;
  if(!a.talentActions.element(profile.element))throw Error('Native element choice rejected: '+profile.element);
  progress=s.automaticTalents;elements.push(profile.element);
 }
 for(let attempts=0;attempts<40&&T.earned(progress)>progress.nodes.length;attempts++){
  tuneElement();
  let changed=false;
  for(const target of targets){
   const route=missingPath(T,progress,target);if(!route?.length)continue;
   if(!a.talentActions.allocate(route[0]))continue;
   progress=s.automaticTalents;bought.push(route[0]);changed=true;break;
  }
  if(!changed){
   const alt=T.NODES.find(n=>!progress.nodes.includes(n.id)&&(!n.family||profile.families.includes(n.family))&&
    (!n.element||n.element===(progress.element||'arcane'))&&T.allocate(progress,n.id));
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
  vitality:['end','end','str','end','cha'],
  aegis:['end','end','int','end','str'],
  magic:['int','int','end','int','cha'],
  decay:['int','int','agi','int','end']};
 const order=rotations[first]||rotations.blood;
 const choices=[];
 while(T.availableAttributes(s.automaticTalents)>0){
  const spent=T.spentAttributes(s.automaticTalents),key=order[spent%order.length];
  if(!a.talentActions.attribute(key))throw Error('Native attribute purchase rejected '+key);
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
 const chosen=preferred||available.find(id=>!all.get(id).family||profile.families.includes(all.get(id).family))||null;
 if(chosen===p.prepared||(!chosen&&!p.prepared))return chosen;
 if(!a.talentActions.prepare(chosen))throw Error('Native prepared ability rejected '+chosen);
 if(a.state().automaticTalents.prepared!==chosen)throw Error('Native prepared ability did not persist');
 return chosen;
}
function equipEarned(a,profile,between=false){
 const actions=[];
 const source=between?a.bag.items().filter(x=>x.kind!=='valuable'):[...a.state().stash];
 // Rank visible native items, re-checking after each actual equip.
 const items=[...source].filter(x=>x?.slot&&x.id).sort((x,y)=>gearScore(y,profile)-gearScore(x,profile));
 for(const item of items){
  const offhandDagger=profile.offhands?.includes('Daggers')&&
   ['Daggers','Off-Hand Dagger'].includes(item.subtype);
  // Daggers can be legally equipped in either hand. Compare both native
  // slots, rather than always consuming the item in main hand first.
  const targets=['ring1','ring2'].includes(item.slot)?['ring1','ring2']:
   offhandDagger?['weapon','offhand']:[item.slot];
  const options=targets.map(target=>{
   const prior=a.state().equip[target];
   return {target,prior,gain:gearScore(item,profile,target)-gearScore(prior,profile,target)};
  }).sort((x,y)=>y.gain-x.gain);
  for(const {target,prior,gain} of options){
   if(gain<2.5)continue;
   if(target==='offhand'&&['Two-Handed','Bow','Staff'].includes(a.state().equip.weapon?.subtype))continue;
   if(item.slot==='weapon'&&['Two-Handed','Bow','Staff'].includes(item.subtype)&&a.state().equip.offhand){
    // Do not delete a strong earned shield/secondary weapon to chase a tiny weapon score.
    if(gain<gearScore(a.state().equip.offhand,profile)*.6+5)continue;
   }
   if(a.equip(item.id,target)){actions.push({slot:target,item:item.name,rarity:item.rarity,previous:prior?.name||null,gain:round(gain),
    ...(target==='offhand'?{subtype:item.subtype,trait:item.v013Trait||null,previousSubtype:prior?.subtype||null}: {})});break;}
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
   const targets=['ring1','ring2'].includes(recipe.slot)?['ring1','ring2']:[recipe.slot];
   const best=targets.map(slot=>({slot,gain:gearScore(preview,profile)-gearScore(state.equip[slot],profile)}))
    .sort((a,b)=>b.gain-a.gain)[0];
   return {...best,recipe,fragments:progress.cost.fragments};
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
function investEarnedGear(a,profile,level){
 const outcome={crafted:[]},forge=a.forge;
 if(!forge||!a.economyCanAct()||forge.canCraft&&!forge.canCraft())return outcome;
 const efficiency=(gain,fragments,essence)=>gain/(Math.max(1,fragments)+4*Math.max(0,essence));
 for(let attempt=0;attempt<2;attempt++){
  // Native craftRecipe rejects a full Stash even when progress().ready is
  // true; don't treat that legal UI restriction as a broken economy.
  if(forge.canCraft&&!forge.canCraft())break;
  const s=a.state(),options=[];
  for(const recipe of forge.recipes){
   const progress=forge.progress(recipe.id,level);
   if(!progress?.ready)continue;
   const example=forge.preview(recipe.id,level);
   if(!example)continue;
   const targets=['ring1','ring2'].includes(recipe.slot)?['ring1','ring2']:[recipe.slot];
   const target=targets.map(slot=>({slot,gain:gearScore(example,profile)-gearScore(s.equip[slot],profile)}))
    .sort((x,y)=>y.gain-x.gain)[0];
   if(target.gain<5)continue;
   options.push({recipe,target,gain:target.gain,fragments:progress.cost.fragments,
    essence:progress.cost.essence,efficiency:efficiency(target.gain,progress.cost.fragments,progress.cost.essence)});
  }
  options.sort((x,y)=>y.efficiency-x.efficiency||y.gain-x.gain);
  const best=options[0];if(!best)break;
  const before={fragments:s.fragments,essence:s.crafting.essence};
  const item=forge.craft(best.recipe.id,level);
  if(!item)throw Error('Native Forge craft rejected after valid Camp preview');
  if(s.fragments!==before.fragments-best.fragments||
     s.crafting.essence!==before.essence-best.essence)
   throw Error('Native Forge cost mismatch');
  const actual=gearScore(item,profile)-gearScore(s.equip[best.target.slot],profile);
  const equipped=equipEarned(a,profile,false);
  outcome.crafted.push({recipe:best.recipe.id,item:item.name,slot:best.target.slot,
   fragmentsSpent:best.fragments,essenceSpent:best.essence,
   estimatedGain:round(best.gain),actualRolledGain:round(actual),
   equipped:equipped.some(x=>x.item===item.name)});
 }
 return outcome;
}
// Eight native Rune families. Valuation is build policy, not an additional
// player stat. The actual Rune values, slot cap, duplicates and transactions
// always come from the production game.
function runeScore(rune,profile){
 if(!rune)return -Infinity;
 const magic=profile.families.includes('magic'),leather=profile.armor==='Leather',plate=profile.armor==='Plate';
 const affinity={might:plate?5.2:leather?2.2:1.4,
  swiftness:leather?5.2:magic?1.8:2.1,
  wisdom:magic?6:1.1,
  fortitude:plate?5.1:leather?2.3:3.6,
  fortune:2.1,fury:magic?2.5:leather?4.8:3.4,
  warding:plate?5:magic?3.2:3.1,vitality:plate?5.1:4.2};
 const base={fury:3,warding:2,vitality:10}[rune.family]||1;
 const normalized=Number(rune.value||0)/base;
 return round((affinity[rune.family]||0)*(1+Math.max(0,normalized)*.08),3);
}
function chooseRuneReward(options,profile){
 return (options||[]).filter(x=>x?.id).sort((x,y)=>
  runeScore(y,profile)-runeScore(x,profile)||y.tier-x.tier)[0]||null;
}
function manageEarnedRunes(a,profile){
 const s=a.state(),actions=[];
 if(!a.economyCanAct())return actions;
 const available=[...s.runes].filter(r=>r?.id).sort((x,y)=>
  runeScore(y,profile)-runeScore(x,profile)||y.tier-x.tier);
 const used=new Set(),desired=[];
 for(const rune of available){
  if(used.has(rune.family))continue;
  used.add(rune.family);desired.push(rune);
  if(desired.length===3)break;
 }
 for(let i=0;i<3;i++){
  const current=s.runeSlots[i],wanted=desired[i]?.id||null;
  if(current===wanted)continue;
  if(current!==null&&!desired.some(r=>r.id===current)){
   if(!a.runes.unequip(i))throw Error('Native Rune unequip rejected in Camp');
   actions.push({action:'unequip',slot:i,id:current});
  }
 }
 for(let i=0;i<desired.length;i++){
  const rune=desired[i];
  if(s.runeSlots[i]===rune.id)continue;
  if(!a.runes.equip(rune.id,i))throw Error('Native Rune equip rejected in Camp');
  actions.push({action:'equip',slot:i,id:rune.id,family:rune.family,score:runeScore(rune,profile)});
 }
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
// Score every one of the game's 13 named potions; no custom stock odds or
// invented inventory. A potion still only activates in native legal windows.
function potionScore(kind,profile,vitals={}){
 const magic=profile.families.includes('magic'),leather=profile.armor==='Leather',plate=profile.armor==='Plate';
 const hpRatio=vitals.maxhp?Math.max(0,vitals.hp)/vitals.maxhp:1,
  manaRatio=vitals.maxmp?Math.max(0,vitals.mp)/vitals.maxmp:1;
 const score={health:hpRatio<.65?92:75,mana:magic?(manaRatio<.5?70:51):12,
  might:magic?13:plate?54:48,arcane:magic?62:20,
  ironhide:plate?57:46,haste:leather?59:magic?45:49,
  fortune:52,barrier:plate?53:56,trail:48,scout:47,
  purifying:32,veilsight:51,fate:38};
 const base=score[kind]??-Infinity;
 return profile.plan?PLANNER.potionPriority(kind,profile,base):base;
}
function selectEarnedPotions(a,profile){
 const s=a.state(),actions=[],v=a.vitals();
 const available=Object.keys(s.consumables||{}).filter(kind=>
  (s.consumables[kind]||0)>0&&a.potions.catalog.some(entry=>entry.id===kind));
 const wanted=available.sort((x,y)=>potionScore(y,profile,v)-potionScore(x,profile,v))
  .slice(0,3);
 if((s.potionSelection||[]).join('|')===wanted.join('|'))return actions;
 for(const kind of [...s.potionSelection||[]]){
  if(!a.potions.select(kind,true))throw Error('Native potion loadout removal rejected '+kind);
 }
 for(const kind of wanted){
  if(!a.potions.select(kind))throw Error('Native potion loadout selection rejected '+kind);
 }
 actions.push({action:'loadout',kinds:[...s.potionSelection]});
 return actions;
}
function buyEarnedPotions(a,profile,level){
 const s=a.state(),actions=[];
 if(!profile.shop||!a.economyCanAct())return actions;
 if(!s.apothecary)s.apothecary=a.potions.shop(level);
 const owned=kind=>(s.consumables?.[kind]||0)>0;
 const wantedKind=profile.families.includes('magic')?'mana':'health';
 // Only buy available offers at their actual dynamic prices; replacement
 // stock is drawn by the native Apothecary and may contain any of 13 types.
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
 if(!owned('health')&&s.gold>=s.apothecary.refreshCost+17){
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
 // Refine only to clear a real material bottleneck for an already learned
 // Epic recipe; ordinary reagent gain remains tied to completed encounters.
 const epic=forge.recipes.filter(r=>r.rarity==='Epic'&&
  (profile.families.includes(r.family)||r.subtype===profile.armor));
 for(const recipe of epic){
  const p=forge.progress(recipe.id,level);if(!p?.unlocked||!p.cost.cores)continue;
  const family=recipe.family;
  if((s.crafting.cores[family]||0)>=p.cost.cores)continue;
  if((s.crafting.dryRooms?.[family]||0)<3||s.crafting.essence<p.cost.essence+6)continue;
  const before={essence:s.crafting.essence,cores:s.crafting.cores[family]};
  if(!forge.refine(recipe.id))throw Error('Native reagent refinement rejected after legal preview');
  if(s.crafting.essence!==before.essence-6||s.crafting.cores[family]!==before.cores+1)
   throw Error('Native reagent refinement settlement mismatch');
  out.push({family,recipe:recipe.id,essenceSpent:6,coresGained:1});
  break;
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
  const candidate=s.stash.filter(item=>item?.id&&!item.locked&&
   !item.startingGear&&!item.recoveryStarter).sort((left,right)=>{
   function priority(item){
    const equipped=s.equip[item.slot];
    const weakRelative=gearScore(item,profile)-gearScore(equipped,profile);
    return weakRelative-(item.recoveryStarter?200:0)-(item.rarity==='Common'?10:0);
   }
   return priority(left)-priority(right);
  });
  const selected=candidate.slice(0,excess);
  if(selected.length){
   const before=s.fragments,ids=selected.map(item=>item.id);
   const expected=selected.reduce((n,item)=>n+a.sale(item),0);
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
 const s=a.state();a.potions.inventory();
 if(s.pendingRuneReward?.options?.length){
  const options=s.pendingRuneReward.options;
  const choice=chooseRuneReward(options,profile);
  if(a.claimRune(choice.id))actions.runes.push(choice.name||choice.id);
 }
 for(let i=0;i<3&&a.results().review;i++)a.exitResult();
 actions.soldTreasures=!!(s.valuables?.length&&a.treasures.sell());
 if(decisionModel!=='legacy')actions.storage.push(consolidateStash(a,profile));
 actions.equipped.push(...equipEarned(a,profile,false));
 // Native Camp decision: obsolete Expedition Grey gear funds the Forge.
 // Never sell starter, equipped or locked items or create resources artificially.
 if(a.economyCanAct()){
  const surplus=s.stash.filter(item=>item.source==='loot'&&item.rarity==='Common'&&
   !item.locked&&!item.recoveryStarter&&item.id&&
   gearScore(item,profile)+2.5<=gearScore(s.equip[item.slot],profile));
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
   options.history||[],options.priorResets||0);
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
 actions.prepared=prepareEarnedAbility(a,profile);
 if(decisionModel!=='legacy'){
  actions.runes.push(...manageEarnedRunes(a,profile));
  actions.refined.push(...refineEarnedReagents(a,profile,level));
  const investment=investEarnedGear(a,profile,level);
  actions.crafted.push(...investment.crafted);
 }
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
  const candidates=(s.merchant?.stock||[]).map((item,index)=>({item,index,
   gain:gearScore(item,profile)-gearScore(s.equip[item?.slot],profile)}))
   .filter(x=>x.item?.goldPrice<=s.gold-reserve&&x.gain>(decisionModel==='legacy'?8:5))
   .sort((x,y)=>y.gain-x.gain||x.item.goldPrice-y.item.goldPrice);
  for(const {item,index} of candidates.slice(0,decisionModel==='legacy'?1:2)){
   if(s.gold<item.goldPrice+reserve||s.merchant?.stock?.[index]?.id!==item.id)continue;
   if(a.purchaseNative(index)){
    actions.bought.push({name:item.name,cost:item.goldPrice,gain:round(gearScore(item,profile)-gearScore(s.equip[item.slot],profile))});
    actions.equipped.push(...equipEarned(a,profile,false));
   }
  }
 }
 // Re-rank all genuinely owned doses and use the real 3-slot Camp UI API.
 actions.potions.push(...selectEarnedPotions(a,profile));
 if(decisionModel!=='legacy'){
  actions.storage.push(consolidateStash(a,profile));
  actions.equipped.push(...equipEarned(a,profile,false));
 }
 actions.unspentGold=s.gold;
 actions.unspentFragments=s.fragments;
 actions.unspentEssence=s.crafting?.essence||0;
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
   (profile.families.includes(card.family)?-3:0)+(card.family==='vitality'?-1:0);
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
 const blood=profile.families.includes('blood'),decay=profile.families.includes('decay');
 switch(id){
  case 'bastion_oath':return 28+(hp<.75?9:0)-(profile.name==='Daring'?3:0);
  case 'predators_focus':return 26+(context.bossSoon?5:0);
  case 'blood_tribute':return blood?20+(context.bleedReady?6:0):2;
  case 'rotbound_echo':return decay||context.bleedReady?18:2;
  case 'aetherbound_pact':return mana>0?22:0;
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
function usePotionsBetween(a,profile,history,next){
 const v=a.vitals(),g=a.controller().state,d=g.dungeon;
 if(!next||!d?.realm)return false;
 const ratio=v.maxhp>0?v.hp/v.maxhp:1,mpRatio=v.maxmp?v.mp/v.maxmp:1;
 const magic=profile.families.includes('magic');
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
 if(ratio<profile.healAt&&!['shrine','spring'].includes(next.type)&&
  (dangerous||next.type==='combat'||ratio<.4))
  changed=usePotionKind(a,'health','low_hp_before_threat',history)||changed;
 if(mpRatio<.35&&v.maxmp>0&&dangerous)
  changed=usePotionKind(a,'mana','low_mana_before_threat',history)||changed;
 if(dangerous&&ratio>.32){
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
  bleedReady:a.state().automaticTalents.nodes.includes('affinity_blood')};
 const best=chooseBoon(offer,profile,context);
 if(best&&boonScore(best,profile,context)>=12)return false;
 return usePotionKind(a,'fate','reroll_weak_boon_offer',history);
}
// The player can switch to another real enemy while Briarspine Horror's
// Thornbloom reflection is active. This is a target decision, not an invulnerability
// window, attack-speed change or artificial loss of DPS.
function selectThornAwareTarget(run,profile){
 const normal=S.selectTarget(run,profile.target),stage=normal?.stage82;
 if(stage?.type!=='briarspine_horror'||!(stage.bloomUntil>(run.combatSeconds||0)))return normal;
 return (run.enemies||[]).find(enemy=>enemy?.hp>0&&enemy!==normal&&
  enemy.stage82?.type!=='briarspine_horror')||normal;
}
function fightNatural(a,profile,tickLimit,context={}){
 const r=a.state().run;
 if(!r||r.status!=='fight')throw Error('Combat entry missing');
 const startedAt=r.combatSeconds||0;
 const start=r.hp,first=r.encounterLeader||r.enemy,initial=r.totalMobCount||r.initialMobCount||r.enemies?.length||1;
 const mpStart=r.mp,maxmp=r.maxmp,metricsBefore=Object.fromEntries(['manaSpent','fundedCasts','infusionActivations','infusionHits','infusionDamage','unfundedCasterAttacks']
  .map(key=>[key,Number(r.metrics?.[key])||0]));
 const measured=key=>Math.max(0,(Number(r.metrics?.[key])||0)-metricsBefore[key]);
 const cap=context.capabilities||null,adaptive=context.adaptiveTargets??context.decisionModel==='adaptive';
 let ticks=0,switches=0,thornRedirects=0,minionFocusSeconds=0,minionFocusSwitches=0,minimum=r.maxhp>0?r.hp/r.maxhp:0;
 const healthLost={boss:0,elite:0,minion:0,normal:0};
 const barrierLost={boss:0,elite:0,minion:0,normal:0};
 let nonFocusedHealthLost=0,observedNewEnemies=0,untrackedDisappeared=0,peakLiveEnemies=0;
 while(r.status==='fight'&&a.controller().state.stage==='combat'&&r.hp>0&&ticks<tickLimit){
  // Target selection is an ordinary player click, at most once per 8 native ticks.
  if(ticks%8===0){
   const baseline=S.selectTarget(r,profile.target);
   // Respect the player's explicit single-target focus strategy. A smart
   // agent must not silently override a chosen combat style merely because
   // another target is dangerous. Mechanics-aware profiles remain reactive.
   let next=adaptive&&profile.target!=='focus'
    ?AGENT.selectTarget(r,cap,baseline):selectThornAwareTarget(r,profile);
   // Thornbloom counterplay uses live visible enemy status only.
   if(next?.stage82?.type==='briarspine_horror'&&
      next.stage82.bloomUntil>(r.combatSeconds||0)){
    const safe=(r.enemies||[]).find(e=>e?.hp>0&&e!==next);
    if(safe){next=safe;thornRedirects++;}
   }else if(next!==baseline&&next?.stage82?.type==='briarspine_horror')thornRedirects++;
   if(next&&a.selectCombatTarget(r,next)){switches++;
    if(next.stage83Summoned&&next.stage83Summoner==='elite')minionFocusSwitches++;}
  }
  const focusedSummon=!!(r.enemy?.hp>0&&r.enemy.stage83Summoned&&r.enemy.stage83Summoner==='elite');
  const focused=r.enemy,before=AGENT.snapshot(r);
  peakLiveEnemies=Math.max(peakLiveEnemies,[...before.values()].filter(e=>e.hp>0).length);
  const tickStartedAt=r.combatSeconds||0;
  a.tick();ticks++;
  const change=AGENT.changes(before,AGENT.snapshot(r),focused);
  for(const role of Object.keys(healthLost)){
   healthLost[role]+=change.roles[role];barrierLost[role]+=change.wards[role];
  }
  nonFocusedHealthLost+=change.nonFocusedHp;
  observedNewEnemies+=change.newEnemies;
  untrackedDisappeared+=change.disappeared;
  if(focusedSummon)minionFocusSeconds+=Math.max(0,(r.combatSeconds||0)-tickStartedAt);
  minimum=Math.min(minimum,Math.max(0,r.hp)/(r.maxhp||1));
 }
 const stage=a.controller().state.stage,preparedId=a.state().automaticTalents.prepared||null;
 return {
  preparedId,preparedActivations:preparedId?Number(r.outerUses?.[preparedId]||0):0,
  kind:first?.boss?'boss':first?.miniboss?'elite':'combat',initialEnemies:initial,
  bossStyle:first?.boss?first.bossStyle:null,eliteType:first?.miniboss?first.eliteType:null,
  strategy:adaptive?'adaptive':'baseline',capabilities:cap,
  status:r.status,died:r.hp<=0||stage==='failed',
  won:r.status==='cleared'&&stage!=='failed',timedOut:r.status==='fight'&&ticks>=tickLimit,
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
  observedNewEnemies,untrackedDisappeared,peakLiveEnemies,
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
  const bag=a.bag.items().filter(i=>i.kind!=='valuable'),unused=bag.at(-1);
  const target=Object.values(a.state().equip).filter(Boolean).at(-1);
  const family=profile.families[0],hpBefore=v.hp;
  if(a.events.choose(choice,unused?.id,null,family,target?.id))
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
  if(a.state().pendingRuneReward?.options?.length){
   const opts=a.state().pendingRuneReward.options;
   const option=chooseRuneReward(opts,profile||PROFILES.cautious);
   a.claimRune(option.id);
  }
  for(let i=0;i<3&&a.results().review;i++)a.exitResult();
 }
}
function playDungeon(a,level,profile,opts,decisionModel='risk-aware'){
 const c=a.controller(),g=c.state,flags=policyFlags(decisionModel);
 if(g.unlocked<level)throw Error('Cannot bypass native unlock from E'+g.unlocked+' to E'+level);
 a.start(level,true);
 if(g.expedition!==level||g.stage!=='choice')throw Error('Native Expedition start rejected at E'+level+' '+JSON.stringify({
  stage:g.stage,unlocked:g.unlocked,stash:a.state().stash?.length,
  nativeOccupied:a.storage?.occupied?.(),nativeCapacity:a.storage?.capacity?.(),
  nativeHasRoom:a.storage?.hasRoom?.(),
  stashCapacity:a.state().stashCapacity,overflow:a.state().expeditionOverflow?.length,
  pendingRune:!!a.state().pendingRuneReward,review:!!a.results().review}));
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
   rerollPoorBoonAtShrine(a,offer,profile,report.potions);
   offer=g.dungeon.boonOffer;
   const context={vitals:a.vitals(),steps:g.dungeon.steps,bossSoon:g.dungeon.steps<=5,
    bleedReady:a.state().automaticTalents.nodes.includes('affinity_blood')};
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
   usePotionsBetween(a,profile,report.potions,next);
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
  const fight=fightNatural(a,profile,opts.tickLimit,{adaptiveTargets:flags.targets,capabilities:capabilities(a)});
  const actualDrops=(a.state().run?.loot||[]).map(item=>
   ({slot:item.slot,rarity:item.rarity,subtype:item.subtype,source:item.source}));
  report.rooms.push({room:next.room,roomType:node.kind,...fight,
   loot:actualDrops,firstRoom:!!wasFirstRoom,
   ...(node.kind==='boss'?{bossModifiers:[...(report.bossInitialModifiers||[])]}:{}),
   ...(node.kind==='elite'?{marked:next.room===card.objective}:{})});
  if(fight.timedOut){report.error='Native combat timeout';break;}
  if(fight.died)break;
  clearResults(a,profile);
 }
 if(g.stage==='choice'&&!report.extracted&&!report.error){
  if(a.checkpoint.extract())report.extracted=true;
  else report.error='Iteration cap reached without a legal native extraction';
 }
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
 report.bossWon=report.status==='victory'&&report.bossReached;
 report.fightsWon=report.rooms.filter(r=>r.won).length;
 report.damageTaken=report.rooms.reduce((n,r)=>n+r.damageTaken,0);
 report.seconds=round(report.rooms.reduce((n,r)=>n+r.seconds,0));
 return report;
}
function simulateAccount(seed,id,opts,simulationOptions={}){
 const profile=PROFILES[id],decisionModel=simulationOptions.decisionModel||'adaptive';
 policyFlags(decisionModel);
 const a=create(seed,undefined,simulationOptions.moduleOverrides||{}, {skipPersistence:true,now:1720000000000+seed});
 const initialGear=gearSnapshot(a);
 if(a.talents.earned(a.state().automaticTalents)!==0||
    !initialGear.items.length||initialGear.items.some(x=>!x.startingGear))
  throw Error('New account must start with native weak equipment and zero earned talents');
 const acc={seed,profile:id,initialGear,startXp:a.state().automaticTalents.xp,
  attempts:[],reached:[1],endLevel:null,stopReason:null};
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
    const canPivot=!profile.plan&&!!PIVOTS[id]&&!pivoted&&attempt>=3&&a.state().automaticTalents.nodes.length>=4&&
     acc.attempts.filter(x=>x.level===level&&!x.error&&x.status!=='error').length>=2;
    const nextProfile=canPivot?pivotProfile(id):activeProfile;
    const camp=prepareCamp(a,nextProfile,level,decisionModel,
     canPivot?{resetReason:'two_undefeated_attempts_at_E'+level}:
      profile.plan?{history:acc.attempts,priorResets:acc.attempts.reduce((n,t)=>n+(t.camp?.resets?.length||0),0)}:undefined);
    if(canPivot){if(camp.resets.length!==1)throw Error('Expected one native profile reset');activeProfile=nextProfile;pivoted=true;}
    // Optional Stage 6.9 diagnostic splice: can only execute real Camp
    // transactions (talent reset/allocate/prepare). Hard-gate every resource,
    // inventory, earned XP and native Expedition unlock against mutation.
    let earnedProbe=null;
    if(typeof simulationOptions.onCamp==='function'){
     const state=a.state(),fixed=JSON.stringify({
      xp:state.automaticTalents.xp,gold:state.gold,fragments:state.fragments,
      essence:state.crafting?.essence||0,equip:state.equip,stash:state.stash,
      consumables:state.consumables,potionSelection:state.potionSelection,
      runes:state.runes,runeSlots:state.runeSlots,expeditionOverflow:state.expeditionOverflow,
      unlocked:a.controller().state.unlocked
     });
     earnedProbe=simulationOptions.onCamp({a,seed,profile:nextProfile,level,attempt,
      previousAttempts:acc.attempts,camp});
     const afterState=a.state();
     const remaining=JSON.stringify({
      xp:afterState.automaticTalents.xp,gold:afterState.gold,fragments:afterState.fragments,
      essence:afterState.crafting?.essence||0,equip:afterState.equip,stash:afterState.stash,
      consumables:afterState.consumables,potionSelection:afterState.potionSelection,
      runes:afterState.runes,runeSlots:afterState.runeSlots,expeditionOverflow:afterState.expeditionOverflow,
      unlocked:a.controller().state.unlocked
     });
     if(remaining!==fixed||!a.talents.valid(afterState.automaticTalents))
      throw Error('Earned checkpoint test changed equipment, resources, XP, unlocks or invalid talents');
    }
    const before={xp:a.state().automaticTalents.xp,earned:a.talents.earned(a.state().automaticTalents),
     spent:a.state().automaticTalents.nodes.length,
     attributeEarned:a.talents.attributeBudget(a.state().automaticTalents),
     attributeSpent:a.talents.spentAttributes(a.state().automaticTalents),
     attributes:a.talents.attributes(a.state().automaticTalents),gear:gearSnapshot(a),strategy:activeProfile.variantId||id,gold:a.state().gold,
     fragments:a.state().fragments,essence:a.state().crafting?.essence||0,
     talentNodes:[...a.state().automaticTalents.nodes],
     element:a.state().automaticTalents.element||null,
     prepared:a.state().automaticTalents.prepared||null,
     unlocked:a.controller().state.unlocked};
    const encounter=playDungeon(a,level,activeProfile,opts,decisionModel);
    if(encounter.xpEnd<before.xp)throw Error('Native earned XP decreased');
    entry={...entry,camp,before,...(earnedProbe?{earnedProbe}:{}),...encounter,
     after:{xp:a.state().automaticTalents.xp,earned:a.talents.earned(a.state().automaticTalents),
      spent:a.state().automaticTalents.nodes.length,
      attributeEarned:a.talents.attributeBudget(a.state().automaticTalents),
      attributeSpent:a.talents.spentAttributes(a.state().automaticTalents),
      attributes:a.talents.attributes(a.state().automaticTalents),unlocked:a.controller().state.unlocked,
      gold:a.state().gold,fragments:a.state().fragments,
      essence:a.state().crafting?.essence||0,
      talentNodes:[...a.state().automaticTalents.nodes],
       element:a.state().automaticTalents.element||null,
      prepared:a.state().automaticTalents.prepared||null}};
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
   wins,deaths,extractions:attempts.filter(a=>a.status==='extracted').length,
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
   potionKindsUsed:[...new Set(attempts.flatMap(a=>(a.potions||[]).map(x=>x.kind)))].sort(),
   thornRedirects:attempts.reduce((n,a)=>n+(a.rooms||[]).reduce((m,r)=>m+(r.thornRedirects||0),0),0),
   talentResets:attempts.reduce((n,a)=>n+(a.camp?.resets?.length||0),0),
   elementalSelections:attempts.reduce((n,a)=>n+(a.camp?.elementChoices?.length||0),0),
   advancedPrepared:attempts.filter(a=>!!a.before?.prepared).length,
   preparedActivations:attempts.reduce((n,a)=>n+(a.rooms||[]).reduce((m,r)=>m+(r.preparedActivations||0),0),0),
   strategyPivots:attempts.filter(a=>!!a.before?.strategy?.endsWith('-pivot')).length,
   observations:attempts.length?null:'not_reached; do not infer win rate'});
 }
 return {stage:'9.6',schemaVersion:5,engine:'v0.13 live native account, dungeon and combat runtime',
  source:S.sourceFingerprint().sha256,
  runnerSha256:crypto.createHash('sha256').update(fs.readFileSync(__filename)).digest('hex'),
  agentStrategySha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,'v013-agent-strategy.cjs'))).digest('hex'),
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
  '- Native Grey loot, gear swaps, real Camp salvage into Forge Fragments, XP awards, talents, Contracts, Boon Shrines, events, Gold shops and potions are tracked without injecting inventory.',
  '- Combat target switching has a reaction delay; map traversal uses native movement and step costs; hidden room types are not peeked for room selection.',
  '- Boon decisions are ranked by actual trade-offs, not chosen blindly by Affinity; native Fate rerolls are conditional.',
  '- The agent selects one of the two feasible Contracts using their displayed single-prize offers; native objective progress, Boss/extraction payout and death forfeiture are recorded without fake awards.',
  '- Marked Chambers, two real Shrine Boons, normal combat targets, Elite and Reliquary influence reachable routing. A chosen Oath never intentionally disables a Boss seal.',
  '- Native potions are purchased with earned Gold, used by exact kind only at legal map windows, and conserved before safe rooms.',
  '- S1: the Camp compares crafting previews with real named-tier upgrade requirements and never bypasses materials or Expedition unlocks.',
  '- S1: earned talents can select Fire/Frost/Lightning, choose an owned advanced prepared skill, and reset (without losing XP) once after two failed attempts when at least four talent nodes exist.',
  '- Elite route scores compare native Elite 60% loot odds to ordinary room odds, including extra Grey loot, Gold/Fragments, Marked Elite rewards and Boss preparation; they never guarantee a drop.',
  '- Boss preparation is earned via the real marked Elite and Forgotten Reliquary; both are separately counted, including preparation at Boss entry.',
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
module.exports={PROFILES,PIVOTS,pivotProfile,DEFAULTS,parseArgs,spendEarnedAttributes,gearScore,gearSnapshot,runeScore,chooseRuneReward,manageEarnedRunes,potionScore,selectEarnedPotions,buyEarnedPotions,refineEarnedReagents,selectThornAwareTarget,spendEarnedTalents,prepareEarnedAbility,equipEarned,
 prepareCamp,craftEarned,investEarnedGear,consolidateStash,policyFlags,capabilities,rankRealms,choiceRealm,pathLength,eliteOpportunity,selectRoom,evaluateRetreat,boonScore,chooseBoon,contractScore,chooseContract,contractExitDecision,eventOptions,potionSlots,usePotionKind,usePotionsBetween,rerollPoorBoonAtShrine,
 fightNatural,resolveEvent,clearResults,playDungeon,simulateAccount,analyze,run,markdown,main};
if(require.main===module)main();
