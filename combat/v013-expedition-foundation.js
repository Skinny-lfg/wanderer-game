// v0.13 Stage 0. Data and deterministic planning only: does not modify combat, travel, loot or saves.
(function(root){'use strict';
const VERSION=1;
const AFFINITIES=Object.freeze(['blood','decay','vitality','aegis','fury','magic']);
const BOSS_STYLES=Object.freeze(['guardian','leech','berserker']);
const DIFFICULTIES=Object.freeze([
 {id:'guarded',name:'Guarded',risk:0,rooms:18,steps:14,elites:1,escorts:0,bonus:0,traits:1,bossModifiers:1},
 {id:'dangerous',name:'Dangerous',risk:1,rooms:20,steps:13,elites:1,escorts:1,bonus:.12,traits:2,bossModifiers:2},
 {id:'brutal',name:'Brutal',risk:2,rooms:22,steps:12,elites:2,escorts:2,bonus:.24,traits:3,bossModifiers:3}
]);
const row=(id,name,families,params={},extra={})=>({id,name,families,params,...extra});
const CONDITIONS=[
 row('relentless_hunt','Relentless Hunt',['blood','decay','vitality','fury'],{markedEncounters:2,attackSpeedMult:1.15}),
 row('carrion_swarm','Carrion Swarm',['blood','decay','vitality','fury'],{markedEncounters:2,minMobs:18,maxMobs:22}),
 row('unbroken_ward','Unbroken Ward',['aegis','magic','vitality'],{bossBarrierMaxHpPct:.15}, {conflicts:['bone_ward']}),
 row('blighted_ground','Blighted Ground',['decay','vitality','magic'],{markedEncounters:2,healingReceivedMult:.85}),
 row('veiled_passages','Veiled Passages',['decay','aegis','vitality','magic'],{markedEdges:2,firstPassExtraSteps:1}),
 row('sanguine_rite','Sanguine Rite',['blood','decay','fury'],{bossHpThreshold:.5,attackMult:1.12,attackSpeedMult:1.08},{conflicts:['sanguine_frenzy']})
];
const ENCOUNTER_TRAITS=[
 row('armored','Armored',AFFINITIES,{defenseMult:1.20,hpMult:.92}),
 row('frenzied','Frenzied',AFFINITIES,{attackSpeedMult:1.15,hpMult:.90}),
 row('ambush','Ambush',AFFINITIES,{firstAttackAdvanceSec:.75}),
 row('sigilbound','Sigilbound',['aegis','magic','decay'],{barrierMaxHpPct:.12,attackMult:.90}),
 row('unhallowed_regrowth','Unhallowed Regrowth',['decay','vitality','blood'],{healMaxHpPct:.02,intervalSec:5,maxTotalHealMaxHpPct:.10}),
 row('death_throes','Death Throes',['blood','decay','fury'],{deathDamagePlayerMaxHpPct:.02,maxPerEncounterPlayerMaxHpPct:.04})
];
const BOSS_MODIFIERS=[
 row('bone_ward','Bone Ward',AFFINITIES,{barrierMaxHpPct:.15},{excludeBossStyles:['guardian'],conflicts:['unbroken_ward']}),
 row('graven_hide','Graven Hide',AFFINITIES,{defenseMult:1.12}),
 row('sanguine_frenzy','Sanguine Frenzy',AFFINITIES,{hpThreshold:.5,attackSpeedMult:1.12},{excludeBossStyles:['berserker'],conflicts:['sanguine_rite']}),
 row('soul_drain','Soul Drain',AFFINITIES,{healingReceivedMult:.85}),
 row('profane_pulse','Profane Pulse',AFFINITIES,{intervalSec:15,damagePlayerMaxHpPct:.04}),
 row('gravebound_retinue','Gravebound Retinue',AFFINITIES,{extraEscorts:1,maxEscorts:3})
];
const BOONS=[
 row('blood_tribute','Blood Tribute',['blood','decay'],{dotDamageMult:1.20,directDamageMult:.90}),
 row('predators_focus',"Predator's Focus",['fury','blood','aegis'],{singleTargetDamageMult:1.15,areaDamageMult:.90}),
 row('bastion_oath','Bastion Oath',['aegis','vitality'],{damageTakenMult:.88,attackSpeedMult:.90}),
 row('aetherbound_pact','Aetherbound Pact',['magic'],{spellPowerMult:1.18,manaCostMult:1.20}),
 row('rotbound_echo','Rotbound Echo',['decay','blood'],{firstDeathDotSpreadPotency:.30,directDamageMult:.90,maxTriggersPerEncounter:1}),
 row('wayfarers_bargain',"Wayfarer's Bargain",AFFINITIES,{extraSteps:1,maxHpMult:.90})
];
const CONTRACTS=[
 row('bounty_writ','Bounty Writ',AFFINITIES,{target:'marked_elite'}),
 row('pathfinder','Pathfinder',AFFINITIES,{distinctSectors:2}),
 row('purification','Purification',AFFINITIES,{disables:1}),
 row('oath_of_defiance','Oath of Defiance',AFFINITIES,{disabledBossProperties:0})
];
const ROOMS=[
 row('forgotten_reliquary','Forgotten Reliquary',AFFINITIES,{sacrificePlayerMaxHpPct:.15,healPlayerMaxHpPct:.15,restorePlayerMaxMpPct:.25,maxBossModifiersDisabled:1})
];
const CATALOG=Object.freeze({conditions:CONDITIONS,encounterTraits:ENCOUNTER_TRAITS,bossModifiers:BOSS_MODIFIERS,boons:BOONS,contracts:CONTRACTS,rooms:ROOMS});
function freezeDeep(value){if(value&&typeof value==='object'){Object.values(value).forEach(freezeDeep);Object.freeze(value);}return value;}
freezeDeep(CATALOG);freezeDeep(DIFFICULTIES);
const byId=Object.freeze(Object.fromEntries(Object.entries(CATALOG).map(([key,items])=>[key,new Map(items.map(i=>[i.id,i]))])));
function validateCatalog(){
 const idNames=new Map();
 for(const [group,items]of Object.entries(CATALOG))for(const item of items){
  if(!/^[a-z][a-z0-9_]*$/.test(item.id)||!item.name||!Array.isArray(item.families)||!item.families.length||item.families.some(f=>!AFFINITIES.includes(f)))throw Error('Invalid catalog entry: '+group+'/'+item.id);
  if(idNames.has(item.id))throw Error('Duplicate catalog ID: '+item.id);idNames.set(item.id,group);
  if(Object.values(item.params).some(n=>typeof n==='number'?(!Number.isFinite(n)||n<0):(typeof n!=='string'||!n)))throw Error('Invalid catalog parameter '+item.id);
  if(item.excludeBossStyles?.some(s=>!BOSS_STYLES.includes(s)))throw Error('Unknown boss style '+item.id);
 }
 for(const item of [...CONDITIONS,...BOSS_MODIFIERS])for(const incompatible of item.conflicts||[])if(!byId.conditions.has(incompatible)&&!byId.bossModifiers.has(incompatible))throw Error('Unknown conflict: '+incompatible);
 for(const f of AFFINITIES)if(CONDITIONS.filter(c=>c.families.includes(f)).length<2)throw Error('Condition coverage: '+f);
 return true;
}
validateCatalog();
// Stable 32-bit seed derivation. Channel streams do not consume each other's random draws.
function deriveSeed(seed,channel){
 if(!Number.isSafeInteger(seed)||seed<0||seed>0xffffffff)throw Error('Seed must be an unsigned 32-bit integer');
 if(typeof channel!=='string'||!/^[a-z][a-z0-9_]*$/.test(channel))throw Error('Invalid RNG channel');
 let h=2166136261;for(const char of (String(seed)+':'+channel)){h^=char.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;
}
function rng(seed,channel){let value=deriveSeed(seed,channel);return()=>((value=(Math.imul(value,1664525)+1013904223)>>>0)/4294967296);}
function createStreams(seed){return Object.freeze({map:rng(seed,'map'),choice:rng(seed,'choice'),combat:rng(seed,'combat'),loot:rng(seed,'loot'),boss:rng(seed,'boss')});}
function shuffle(source,random){const items=[...source];for(let i=items.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[items[i],items[j]]=[items[j],items[i]];}return items;}
function validateCards(cards){
 if(!Array.isArray(cards)||cards.length!==3||new Set(cards.map(x=>x?.id)).size!==3)throw Error('Expected three different Realm Cards');
 for(const c of cards)if(!c||typeof c.id!=='string'||!AFFINITIES.includes(c.family)||!Number.isInteger(c.risk)||c.risk<0||c.risk>2)throw Error('Invalid Realm Card');
}
function chooseConditions(cards,random){
 const eligible=cards.map(c=>shuffle(CONDITIONS.filter(x=>x.families.includes(c.family)),random));
 function visit(i,chosen,used){if(i===cards.length)return chosen;
  for(const c of eligible[i])if(!used.has(c.id)){const found=visit(i+1,[...chosen,c],new Set([...used,c.id]));if(found)return found;}return null;
 }
 const result=visit(0,[],new Set());if(!result)throw Error('No distinct applicable conditions for Realm cards');return result;
}
function chooseBossModifiers(conditionId,risk,style,random){
 const condition=byId.conditions.get(conditionId),difficulty=DIFFICULTIES[risk];
 const eligible=shuffle(BOSS_MODIFIERS.filter(m=>!m.excludeBossStyles?.includes(style)&&!m.conflicts?.includes(conditionId)&&!condition.conflicts?.includes(m.id)),random);
 if(eligible.length<difficulty.bossModifiers)throw Error('Insufficient compatible boss modifiers');
 return eligible.slice(0,difficulty.bossModifiers).map(x=>x.id);
}
function createManifest(cards,{seed,expeditionLevel,bossStyle}={}){
 validateCards(cards);
 if(!Number.isSafeInteger(expeditionLevel)||expeditionLevel<1)throw Error('Invalid Expedition Level');
 if(!BOSS_STYLES.includes(bossStyle))throw Error('Invalid boss style');
 const streams=createStreams(seed),selected=chooseConditions(cards,streams.map);
 return {version:VERSION,seed,expeditionLevel,bossStyle,cards:cards.map((card,i)=>({realmId:card.id,family:card.family,risk:card.risk,difficulty:DIFFICULTIES[card.risk].id,conditionId:selected[i].id,bossModifierIds:chooseBossModifiers(selected[i].id,card.risk,bossStyle,streams.boss)}))};
}
function createExpeditionState(manifest,realmId){
 if(!manifest||manifest.version!==VERSION||!Array.isArray(manifest.cards))throw Error('Invalid manifest');
 const c=manifest.cards.find(x=>x.realmId===realmId);if(!c)throw Error('Unknown Realm Card');
 return {version:VERSION,seed:manifest.seed,expeditionLevel:manifest.expeditionLevel,realmId,risk:c.risk,conditionId:c.conditionId,bossModifierIds:[...c.bossModifierIds],contractId:null,boonIds:[],knownRooms:[0],discoveredSecrets:[],completedObjectives:[],revealedBossModifiers:[],bossPreparation:{markedElite:false,reliquary:false},decisions:[]};
}
function validateExpeditionState(state,manifest){
 if(!state||state.version!==VERSION||!manifest||state.seed!==manifest.seed||state.expeditionLevel!==manifest.expeditionLevel)return false;
 const card=manifest.cards.find(x=>x.realmId===state.realmId);if(!card||state.risk!==card.risk||state.conditionId!==card.conditionId||JSON.stringify(state.bossModifierIds)!==JSON.stringify(card.bossModifierIds))return false;
 const validIds=(arr,table,max)=>Array.isArray(arr)&&arr.length<=max&&new Set(arr).size===arr.length&&arr.every(x=>table.has(x));
 if(state.contractId!==null&&!byId.contracts.has(state.contractId)||!validIds(state.boonIds,byId.boons,2))return false;
 if(!Array.isArray(state.knownRooms)||state.knownRooms[0]!==0||new Set(state.knownRooms).size!==state.knownRooms.length||!state.knownRooms.every(n=>Number.isInteger(n)&&n>=0&&n<DIFFICULTIES[card.risk].rooms))return false;
 if(!Array.isArray(state.discoveredSecrets)||!Array.isArray(state.completedObjectives)||!Array.isArray(state.revealedBossModifiers||[])||new Set(state.revealedBossModifiers||[]).size!==(state.revealedBossModifiers||[]).length||(state.revealedBossModifiers||[]).some(id=>!card.bossModifierIds.includes(id))||!Array.isArray(state.decisions)||!state.bossPreparation||typeof state.bossPreparation.markedElite!=='boolean'||typeof state.bossPreparation.reliquary!=='boolean')return false;
 return true;
}
// The Stage 0 ledger records intentions for later adapters; it applies no combat or economy effects.
const DECISION_TYPES=Object.freeze(['reveal_room','discover_secret','reveal_boss','select_contract','skip_contract','complete_contract','choose_boon','skip_boon','prepare_boss']);
function lookup(group,id){return Object.hasOwn(CATALOG,group)?byId[group].get(id)||null:null;}
function applyDecision(state,decision,manifest){
 if(!validateExpeditionState(state,manifest)||!decision||typeof decision!=='object'||!DECISION_TYPES.includes(decision.type))throw Error('Invalid foundation decision');
 const c=manifest.cards.find(x=>x.realmId===state.realmId),next=JSON.parse(JSON.stringify(state));
 let recorded;
 if(decision.type==='reveal_room'){
  if(!Number.isInteger(decision.room)||decision.room<0||decision.room>=DIFFICULTIES[c.risk].rooms||next.knownRooms.includes(decision.room))throw Error('Invalid or repeated room reveal');
  next.knownRooms.push(decision.room);recorded={type:decision.type,room:decision.room};
 }else if(decision.type==='discover_secret'){
  if(typeof decision.edgeId!=='string'||!/^\d+-\d+$/.test(decision.edgeId)||next.discoveredSecrets.includes(decision.edgeId))throw Error('Invalid or repeated secret');
  next.discoveredSecrets.push(decision.edgeId);recorded={type:decision.type,edgeId:decision.edgeId};
 }else if(decision.type==='reveal_boss'){
  if(!c.bossModifierIds.includes(decision.id)||decision.id===c.bossModifierIds[0]||next.revealedBossModifiers?.includes(decision.id))throw Error('Invalid or repeated boss reveal');
  next.revealedBossModifiers??=[];next.revealedBossModifiers.push(decision.id);recorded={type:decision.type,id:decision.id};
 }else if(decision.type==='select_contract'){
  if(next.contractId!==null||next.decisions.some(x=>x.type==='skip_contract')||!byId.contracts.has(decision.id))throw Error('Invalid or repeated contract');
  next.contractId=decision.id;recorded={type:decision.type,id:decision.id};
 }else if(decision.type==='skip_contract'){
  if(next.contractId!==null||next.decisions.some(x=>x.type==='skip_contract'))throw Error('Invalid or repeated contract skip');
  recorded={type:decision.type};
 }else if(decision.type==='complete_contract'){
  if(next.contractId===null||decision.id!==next.contractId||next.completedObjectives.includes(decision.id)||next.decisions.some(x=>x.type==='skip_contract'))throw Error('Invalid contract completion');
  next.completedObjectives.push(decision.id);recorded={type:decision.type,id:decision.id};
 }else if(decision.type==='choose_boon'||decision.type==='skip_boon'){
  if(!Number.isInteger(decision.room)||decision.room<1||decision.room>=DIFFICULTIES[c.risk].rooms||
     next.decisions.some(x=>(x.type==='choose_boon'||x.type==='skip_boon')&&x.room===decision.room))
     throw Error('Invalid or repeated Boon Shrine resolution');
  if(decision.type==='choose_boon'){
   const boon=lookup('boons',decision.id);
   if(!boon||next.boonIds.length>=2||next.boonIds.includes(decision.id)||
      !Array.isArray(decision.families)||new Set(decision.families).size!==decision.families.length||
      decision.families.some(f=>!AFFINITIES.includes(f)))throw Error('Invalid or duplicate Boon');
   next.boonIds.push(decision.id);
   recorded={type:decision.type,id:decision.id,room:decision.room,families:[...decision.families]};
  }else recorded={type:decision.type,room:decision.room};
 }else if(decision.type==='prepare_boss'){
  if(!['markedElite','reliquary'].includes(decision.source)||next.bossPreparation[decision.source])throw Error('Invalid or repeated boss preparation');
  next.bossPreparation[decision.source]=true;recorded={type:decision.type,source:decision.source};
 }
 next.decisions.push({seq:next.decisions.length,...recorded});
 if(!validateExpeditionState(next,manifest))throw Error('Invalid resulting foundation state');
 return next;
}
function replayDecisions(manifest,realmId,decisions){
 if(!Array.isArray(decisions))throw Error('Invalid decisions');
 return decisions.reduce((state,action)=>applyDecision(state,action,manifest),createExpeditionState(manifest,realmId));
}
const API={VERSION,AFFINITIES,BOSS_STYLES,DIFFICULTIES,CATALOG,DECISION_TYPES,lookup,validateCatalog,deriveSeed,rng,createStreams,chooseConditions,chooseBossModifiers,createManifest,createExpeditionState,validateExpeditionState,applyDecision,replayDecisions};
root.WandererV013ExpeditionFoundation=Object.freeze(API);
if(typeof module==='object'&&module.exports)module.exports=root.WandererV013ExpeditionFoundation;
})(globalThis);
