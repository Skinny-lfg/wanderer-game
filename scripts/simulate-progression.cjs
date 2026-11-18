'use strict';
// Wanderer v0.13 combat simulation, driven by the real HTML runtime.
// No Firebase, player saves, altered combat constants or fake enemy levels.
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const create=require('../tests/v012-economy-harness.cjs');
require('../combat/v012-buildcraft.js');
require('../combat/automatic-talents.js');
require('../combat/talent-graph-next.js');
require('../combat/talent-graph-bridge.js');
require('../combat/talent-graph-runtime.js');
require('../combat/expedition-progression.js');
require('../combat/v013-expedition-foundation.js');
require('../online/v013-boss-modifiers.js');
require('../online/v013-boss-preparation.js');
require('../online/v013-boss-infrastructure.js');
require('../online/v013-boss-abilities.js');
require('../online/v013-enemy-abilities.js');
require('../online/v013-elite-abilities.js');
const F=globalThis.WandererV013ExpeditionFoundation;
const A=globalThis.WandererV013BossAbilities;
const M=globalThis.WandererV013BossModifiers;
const AFFINITIES=Object.freeze(Object.keys(A.PROFILES));
const GROUP_SIZES=Object.freeze([3,12,20]);
const RISKS=Object.freeze([0,1,2]);
const T=globalThis.WandererAutomaticTalents;
const P=globalThis.WandererExpeditionProgression;
const byNode=new Map(T.NODES.map(n=>[n.id,n]));
const BUILDS=Object.freeze([
 {id:'blood-fury',name:'Blood/Fury',weapon:'Daggers',families:['blood','fury'],skills:['bleeding_edge','deep_cuts','quick_hands','double_strike','crimson_rush']},
 {id:'aegis-vitality',name:'Aegis/Vitality',weapon:'Mace',families:['aegis','vitality'],skills:['guarded_block','barrier_pulse','strong_heart','renewal','sanctuary']},
 {id:'magic-decay',name:'Magic/Decay',weapon:'Wand',families:['magic','decay'],skills:['arcane_focus','mana_spring','toxic_touch','virulent_rot','hex_bolt'],element:'fire'},
 {id:'blood-decay',name:'Blood/Decay',weapon:'Two-Handed',families:['blood','decay'],skills:['bleeding_edge','deep_cuts','toxic_touch','virulent_rot','plague_spread']}
]);
const DEFAULTS=Object.freeze({mode:'encounter',levels:[1,5,15,35,70,100,250,1000],seeds:[9101,9102,9103],builds:BUILDS.map(b=>b.id),points:24,rarity:'Rare',gear:'current',runes:false,tickLimit:4500,
 affinities:[...AFFINITIES],risks:[1],groupSizes:[...GROUP_SIZES],boons:'none',contracts:'none',output:'reports/v013-simulation-results.json'});
const finitePositive=value=>Number.isSafeInteger(value)&&value>=1;
function parseIntegers(value,label){const values=value.split(',').map(Number);if(!values.length||values.some(n=>!finitePositive(n)))throw Error('Invalid '+label+': '+value);return [...new Set(values)];}
function parseArgs(args){
 const result={...DEFAULTS,levels:[...DEFAULTS.levels],seeds:[...DEFAULTS.seeds],builds:[...DEFAULTS.builds],affinities:[...DEFAULTS.affinities],risks:[...DEFAULTS.risks],groupSizes:[...DEFAULTS.groupSizes]};
 for(const arg of args){
  const match=/^--([a-z-]+)=(.*)$/.exec(arg);if(!match)throw Error('Expected --option=value: '+arg);
  const [,key,value]=match;
  if(key==='mode'&&['encounter','dungeon','both','traits','bossmods','bossprep','conditions','bosses','enemies','elites'].includes(value))result.mode=value;
  else if(key==='levels')result.levels=parseIntegers(value,'levels');
  else if(key==='seeds')result.seeds=parseIntegers(value,'seeds');
  else if(key==='builds'){
   result.builds=[...new Set(value.split(','))];if(!result.builds.length||result.builds.some(id=>!BUILDS.some(b=>b.id===id)))throw Error('Invalid builds: '+value);
  }
  else if(key==='points'){
   result.points=Number(value);if(!Number.isSafeInteger(result.points)||result.points<0||result.points>100)throw Error('Points must be 0–100 (fixed synthetic account budget): '+value);
  }
  else if(key==='rarity'&&['Common','Uncommon','Rare','Epic'].includes(value))result.rarity=value;
  else if(key==='gear'&&['current','previous'].includes(value))result.gear=value;
  else if(key==='affinities'){result.affinities=[...new Set(value.split(','))];if(!result.affinities.length||result.affinities.some(f=>!AFFINITIES.includes(f)))throw Error('Invalid affinities: '+value);}
  else if(key==='risks'){result.risks=[...new Set(value.split(',').map(Number))];if(!result.risks.length||result.risks.some(r=>!RISKS.includes(r)))throw Error('Invalid risks: '+value);}
  else if(key==='group-sizes'){result.groupSizes=parseIntegers(value,'group-sizes');if(result.groupSizes.some(n=>n<2||n>22))throw Error('Group sizes must be 2–22');}
  else if(key==='boons'&&['none','first'].includes(value))result.boons=value;
  else if(key==='contracts'&&['none','first'].includes(value))result.contracts=value;
  else if(key==='runes'&&['true','false'].includes(value))result.runes=value==='true';
  else if(key==='tick-limit'){result.tickLimit=Number(value);if(!finitePositive(result.tickLimit)||result.tickLimit>100000)throw Error('Invalid tick-limit: '+value);}
  else if(key==='out'&&value)result.output=value;
  else throw Error('Unsupported option: '+arg);
 }
 const base=result.levels.length*result.seeds.length*result.builds.length;
 const factor=result.mode==='bosses'?result.affinities.length*result.risks.length:result.mode==='enemies'?result.groupSizes.length:result.mode==='bossmods'?1+F.CATALOG.bossModifiers.length:result.mode==='traits'?1+F.CATALOG.encounterTraits.length:result.mode==='bossprep'?4:result.mode==='both'?3:result.mode==='encounter'||result.mode==='conditions'?3:1;
 if(base*factor>3000)throw Error('Simulation matrix too large (maximum 3000 native scenarios)');
 return result;
}
function talentPlan(build,points){
 if(!Number.isSafeInteger(points)||points<0||points>100)throw Error('Invalid Talent Tree point budget');
 let progress={...T.create(),xp:points*T.POINT_XP};
 if(points===0)return progress; // The real first Expedition starts with zero permanent points.
 for(const id of build.skills){
  const saved=progress,visiting=new Set();
  function add(key){
   if(progress.nodes.includes(key))return;
   const n=byNode.get(key);if(!n)throw Error('Unknown current Talent Tree node: '+key);
   if(visiting.has(key))throw Error('Talent graph dependency cycle: '+key);
   visiting.add(key);
   if(n.requires)add(n.requires);
   for(const dep of n.prerequisites||[])add(dep);
   if(n.anyRequires&&!n.anyRequires.some(dep=>progress.nodes.includes(dep)))add(n.anyRequires[0]);
   if(n.element&&n.element!=='arcane'&&progress.element!==n.element){
    add('element_choice');
    const selected=T.selectElement(progress,n.element);
    if(!selected)throw Error('Talent element selection failed: '+n.element);
    progress=selected;
   }
   const next=T.allocate(progress,key);
   if(!next)throw Error('INSUFFICIENT_POINTS '+key);
   progress=next;visiting.delete(key);
  }
  try{add(id);}catch(error){
   if(!String(error.message).startsWith('INSUFFICIENT_POINTS'))throw error;
   // Insufficient points are not free talents. Preserve valid partial builds instead.
   progress=saved;
  }
 }
 if(build.element&&progress.nodes.includes('element_choice')){
  const selected=T.selectElement(progress,build.element);
  if(!selected)throw Error('Invalid build element '+build.element);
  progress=selected;
 }
 if(!T.valid(progress))throw Error('Invalid v0.13 permanent talent allocation');
 return progress;
}
function gearLevel(level,mode){
 if(mode!=='previous')return level;
 const tiers=P.tiers;const index=tiers.findIndex(t=>t.id===P.gearTier(level).id);
 if(index<=0)return Math.max(1,level-1);
 return tiers[index-1].minimum;
}
function prepare(level,build,seed,opts,desiredRisk=undefined,desiredFamily=undefined){
 if(desiredFamily!==undefined&&!AFFINITIES.includes(desiredFamily))throw Error('Unknown Boss Affinity '+desiredFamily);
 if(desiredRisk!==undefined&&!RISKS.includes(desiredRisk))throw Error('Unknown Realm risk '+desiredRisk);
 const gearE=gearLevel(level,opts.gear),talents=talentPlan(build,opts.points);
 for(let attempt=0;attempt<(desiredFamily?48:1);attempt++){
  const resolvedSeed=(seed+attempt)>>>0||1;
  const a=create(resolvedSeed,undefined,{}, {skipPersistence:true});
  a.setup(gearE,build.weapon,opts.rarity);
  a.state().automaticTalents={...talents,nodes:[...talents.nodes]};
  if(opts.runes){const st=a.state();st.runes=['vitality','warding',build.weapon==='Wand'?'wisdom':'might'].map(k=>a.makeRune(k,gearE));st.runeSlots=st.runes.map(r=>r.id);}
  a.setUnlocked(level);a.start(level,true);
  const c=a.controller(),g=c.state;
  if(g.expedition!==level||!g.dungeon?.cards?.length)throw Error('Current native v0.13 Dungeon unavailable at E'+level);
  const cards=g.dungeon.cards;
  const card=desiredRisk!==undefined?(cards[desiredRisk]?.family===desiredFamily||desiredFamily===undefined?cards[desiredRisk]:null):
   desiredFamily?cards.find(x=>x.family===desiredFamily):
   [...cards].sort((x,y)=>Number(x.family!==build.families[0])-Number(y.family!==build.families[0])||x.risk-y.risk)[0];
  if(!card)continue; // Keep the real generated Realm card: never rewrite its Affinity.
  c.chooseRealm(card.id);
  if(opts.contracts==='first'){
   const offer=c.offerContracts(a.state().crafting?.learnedRecipes||[]);
   if(!offer?.ids?.length)throw Error('Native Contract offers unavailable');
   c.chooseContract(offer.ids[0]);
  }
  const boss=A.profileFor(card.family);
  if(!boss||boss.style!==F.BOSS_STYLE_BY_AFFINITY[card.family])throw Error('Boss roster drift for '+card.family);
  return {a,c,g,card,gearE,resolvedSeed,seedShift:attempt,plannedPoints:opts.points,allocatedPoints:talents.nodes.length};
 }
 throw Error('No natural Realm card matches '+desiredFamily+' and risk '+desiredRisk+' within 48 deterministic seeds');
}
function fight(a,c,limit){
 const r=a.state().run;
 if(!r||r.status!=='fight')throw Error('Expected native combat encounter');
 const startHp=r.hp,startMp=r.mp,startedTier=r.tier,leader=r.encounterLeader||r.enemy;
 const profile=A.profileForStyle(leader?.bossStyle),sourceActors=[...(r.enemies||[r.enemy]),...(r.groupReserve||[])].filter(Boolean);
 const initialRoles=Object.fromEntries(['minion','tank','skirmisher','caster','boss','elite'].map(role=>[role,sourceActors.filter(e=>(e.boss?'boss':e.miniboss?'elite':e.role)===role).length]));
 const initialEnemies=r.initialMobCount||r.totalMobCount||sourceActors.length;
 let peakLiving=sourceActors.filter(e=>e.hp>0).length,peakVisible=(r.enemies||[r.enemy]).filter(e=>e?.hp>0).length;
 let ticks=0,minimumHp=r.maxhp>0?r.hp/r.maxhp:0;
 while(r.status==='fight'&&c.state.stage==='combat'&&r.hp>0&&ticks<limit){a.tick();ticks++;minimumHp=Math.min(minimumHp,Math.max(0,r.hp)/(r.maxhp||1));peakLiving=Math.max(peakLiving,(r.enemies||[r.enemy]).filter(e=>e?.hp>0).length+(r.groupReserve||[]).filter(e=>e?.hp>0).length);peakVisible=Math.max(peakVisible,(r.enemies||[r.enemy]).filter(e=>e?.hp>0).length);}
 const metrics=r.metrics||{},died=c.state.stage==='failed'||r.hp<=0,timedOut=!died&&r.status==='fight'&&ticks>=limit;
 const row={tier:startedTier,type:leader?.boss?'boss':leader?.miniboss?'elite':'combat',bossId:profile?.id||null,bossAffinity:profile?Object.keys(A.PROFILES).find(f=>A.PROFILES[f]===profile):null,bossName:profile?.name||null,bossStyle:leader?.bossStyle||null,eliteType:leader?.eliteType||null,initialRoles,peakLivingEnemies:peakLiving,peakVisibleEnemies:peakVisible,traitId:r.encounterTraitId||null,traitRegrowthHealing:Math.round(metrics.traitRegrowthHealing||0),traitDeathPulse:Math.round(metrics.traitDeathPulse||0),bossModifierIds:[...(r.bossModifierIds||[])],bossPulseTriggers:Math.round(metrics.bossPulseTriggers||0),bossFrenzyTriggers:Math.round(metrics.bossFrenzyTriggers||0),bossPreparation:r.bossPreparation?JSON.parse(JSON.stringify(r.bossPreparation)):null,status:died?'died':timedOut?'timeout':r.status,timedOut,died,won:!died&&r.status==='cleared',seconds:+(ticks*.11).toFixed(2),ticks,hpStart:+startHp.toFixed(2),hpEnd:+Math.max(0,r.hp).toFixed(2),hpMax:r.maxhp,mpStart:+startMp.toFixed(2),mpEnd:+Math.max(0,r.mp).toFixed(2),mpMax:r.maxmp,minHpPct:+(minimumHp*100).toFixed(1),conditionId:r.conditionId||null,conditionMarked:!!r.conditionMarked,conditionBarrierGranted:Math.round(r.conditionBarrierGranted||0),conditionRiteTriggers:Math.round(metrics.conditionRiteTriggers||0),damageDealt:Math.round(metrics.damageDealt||0),damageTaken:Math.round(metrics.damageTaken||0),absorbed:Math.round(metrics.absorbed||0),manaSpent:Math.round(metrics.manaSpent||0),initialEnemies,enemies:r.totalMobCount||initialEnemies,reinforcementsSpawned:Math.max(0,(r.totalMobCount||initialEnemies)-initialEnemies),bossSummons:Math.round(metrics.bossSummons||0),bossHealing:Math.round(metrics.bossHealing||0),bossMinionDeaths:Math.round(metrics.bossMinionDeaths||0),bossWards:Math.round(metrics.bossWards||0),bossArcanePulses:Math.round(metrics.bossArcanePulses||0),bossCastInterruptions:Math.round(metrics.bossCastInterruptions||0),bossNodeDestroyed:Math.round(metrics.bossNodeDestroyed||0),enemyAbilityCasts:Math.round(metrics.enemyAbilityCasts||0),eliteSummons:Math.round(metrics.eliteSummons||0),bossCastPreparations:Math.round(metrics.bossCastPreparations||0)};
 return row;
}
function shortestRoute(card){
 const boss=card.nodes.findIndex(x=>x.kind==='boss');
 if(boss<0)throw Error('Dungeon boss missing');
 // Shortcut is intentionally blocked until explored; don't count inaccessible routes.
 const links=card.edges.filter(([a,b])=>!(a===card.shortcut&&b===a+1));
 const queue=[[0]],seen=new Set([0]);
 for(const path of queue){const last=path.at(-1);if(last===boss)return path;
  for(const [a,b]of links){const next=a===last?b:b===last?a:-1;if(next>=0&&!seen.has(next)){seen.add(next);queue.push([...path,next]);}}
 }
 throw Error('No route to boss');
}
function resolveEvent(a){
 if(!a.events.run()?.event)return false;
 const bag=a.bag.items(),item=bag[0],passive=a.build()?.picks?.[0],family=a.controller().allowed()[0],target=Object.values(a.state().equip).find(Boolean);
 for(const choice of [2,0,1])if(a.events.choose(choice,item?.id,passive,family,target?.id))return true;
 throw Error('Could not resolve real event');
}
// Controlled diagnostic: real native combat/stats/ability scheduler, but an encounter
// is deliberately staged in a first-ring room. Use dungeon() for actual travel/extraction.
function encounter(level,build,seed,kind,opts,forcedTrait=undefined,forcedBossMod=undefined,forcedFamily=undefined,desiredRisk=undefined,groupSize=undefined){
 if(!['normal','boss','elite'].includes(kind))throw Error('Unknown controlled encounter '+kind);
 if(groupSize!==undefined&&(!Number.isSafeInteger(groupSize)||groupSize<2||groupSize>22||kind!=='normal'))throw Error('Invalid controlled group size');
 const {a,c,g,card,gearE,resolvedSeed,seedShift,allocatedPoints}=prepare(level,build,seed,opts,desiredRisk,forcedFamily);
 const candidate=card.edges.filter(([x])=>x===0).map(([,y])=>y).find(n=>card.nodes[n]?.kind==='combat');
 if(candidate===undefined)throw Error('No first-ring native combat encounter');
 if(forcedTrait!==undefined){if(kind!=='normal'||forcedTrait!==null&&!F.CATALOG.encounterTraits.some(x=>x.id===forcedTrait))throw Error('Unknown forced encounter trait');card.nodes[candidate].traitId=forcedTrait;}
 if(forcedBossMod!==undefined){
  if(kind!=='boss'||forcedBossMod!==null&&!F.CATALOG.bossModifiers.some(x=>x.id===forcedBossMod))throw Error('Unknown forced Boss property');
  // Stage 8.4: never override g.bossId to the old Rift Harbinger. The selected
  // real Affinity decides the Boss, and only compatible properties are injected.
  const selectedStyle=A.profileFor(card.family).style;
  if(forcedBossMod&&!M.check([forcedBossMod],selectedStyle,'relentless_hunt'))throw Error('Boss property not compatible with '+card.family);
  const plan=g.dungeon.foundationManifest.cards.find(x=>x.realmId===card.id);
  plan.bossModifierIds=forcedBossMod?[forcedBossMod]:[];
  g.dungeon.foundationState.conditionId='relentless_hunt';
 }
 if(!c.visitRoom(candidate)||!a.enter())throw Error('Cannot enter controlled native combat encounter');
 const count=groupSize??(kind==='normal'?3:1);
 const run=a.encounter({count,boss:kind==='boss',elite:kind==='elite'});
 if(run.tier!==level)throw Error('Incorrect encounter tier '+run.tier+' vs '+level);
 if(kind==='boss'&&run.encounterLeader?.bossStyle!==A.profileFor(card.family).style)throw Error('Native Boss mismatch for '+card.family);
 const result=fight(a,c,opts.tickLimit);
 const mode=forcedBossMod!==undefined?'bossmods':forcedTrait!==undefined?'traits':opts.mode==='bosses'?'bosses':opts.mode==='enemies'?'enemies':opts.mode==='elites'?'elites':'encounter';
 const label=forcedBossMod!==undefined?(forcedBossMod||'baseline'):forcedTrait!==undefined?(forcedTrait||'baseline'):mode==='bosses'?card.family:mode==='enemies'?'swarm-'+count:kind;
 return {mode,kind:label,level,build:build.id,seed,resolvedSeed,seedShift,gearE,gearTier:P.gearTier(gearE).name,
  gearRarity:opts.rarity,runes:opts.runes,pointsBudget:opts.points,pointsSpent:allocatedPoints,
  realm:card.name,affinity:card.family,risk:card.risk,nativeEncounter:kind,groupSize:count,unlocked:level,...result};
}
function bossPreparationEncounter(level,build,seed,opts,strategy){
 if(!['baseline','marked_elite','reliquary','both'].includes(strategy))throw Error('Unknown boss preparation strategy');
 // Controlled matched-seed native boss in a first-ring room. The selected Realm Card
 // is Dangerous so the marked Elite removes one guard rather than lowering Attack.
 const {a,c,g,card,gearE,resolvedSeed,seedShift,allocatedPoints}=prepare(level,build,seed,opts,1);
 const P4=globalThis.WandererV013BossPreparation;
 const state=g.dungeon.foundationState,manifest=g.dungeon.foundationManifest;
 const candidate=card.edges.filter(([x])=>x===0).map(([,y])=>y).find(n=>card.nodes[n]?.kind==='combat');
 if(candidate===undefined)throw Error('No first ring combat to host controlled boss');
 card.nodes[candidate].kind='boss';card.nodes[candidate].event=null;card.nodes[candidate].escorts=card.risk;
 if(strategy==='marked_elite'||strategy==='both')g.dungeon.foundationState=F.applyDecision(g.dungeon.foundationState,{type:'prepare_boss',source:'markedElite'},manifest);
 let sacrifice=0;
 if(strategy==='reliquary'||strategy==='both'){
  const first=state.bossModifierIds[0];g.dungeon.disabledBossModifierId=first;
  g.dungeon.foundationState=F.applyDecision(g.dungeon.foundationState,{type:'prepare_boss',source:'reliquary'},manifest);
  const vitals=a.vitals();sacrifice=Math.ceil(vitals.maxhp*.15);
  if(vitals.hp<=sacrifice)throw Error('Reliquary cannot be paid: insufficient HP');
  a.setVitals({...vitals,hp:vitals.hp-sacrifice});
 }
 if(!c.visitRoom(candidate)||!a.enter())throw Error('Cannot enter prepared native boss');
 const run=a.encounter({count:1,boss:true});
 const result=fight(a,c,opts.tickLimit);
 return {mode:'bossprep',kind:strategy,level,build:build.id,seed,gearE,gearTier:P.gearTier(gearE).name,
  risk:card.risk,affinity:card.family,resolvedSeed,seedShift,preparationCostHp:sacrifice,pointsBudget:opts.points,pointsSpent:allocatedPoints,
  realm:card.name,unlocked:level,...result};
}
function dungeon(level,build,seed,opts,desiredRisk=undefined){
 const {a,c,g,card,gearE,resolvedSeed,seedShift,allocatedPoints}=prepare(level,build,seed,opts,desiredRisk);
 const conditionId=g.dungeon?.foundationState?.conditionId||null;
 const route=shortestRoute(card),events=[],rooms=[],initial={gold:a.state().gold,fragments:a.state().fragments,essence:a.state().crafting.essence,
  cores:{...a.state().crafting.cores},xp:a.state().automaticTalents.xp};
 let error=null;
 for(const node of route.slice(1)){
  if(g.stage==='failed'||g.stage==='finished')break;
  try{
   if(!c.visitRoom(node))throw Error('Room unreachable or insufficient steps: '+node);
   if(g.dungeon?.boonOffer){
    // Shrines are map rooms, never combat. The baseline simulator declines
    // optional powers; this is route coverage, not a Boon-balance experiment.
    const chosen=opts.boons==='first'?g.dungeon.boonOffer.ids[0]:null;
     c.chooseBoon(chosen);events.push(chosen?'boon:'+chosen:'boon_shrine_skipped');continue;
   }
   if(!a.enter())throw Error('Native entry rejected for room '+node);
   if(a.events.run()?.event){events.push(a.events.run().event.id);resolveEvent(a);continue;}
   const entry=fight(a,c,opts.tickLimit);rooms.push({room:node,kind:card.nodes[node].kind,...entry});
   if(entry.timedOut||g.stage==='failed')break;
   if(a.state().run?.status==='cleared'||a.results().eventExitPending||a.results().review){if(!a.exitResult())throw Error('Failed to exit resolved room '+node);}
  }catch(e){error=e.message;break;}
 }
 const s=a.state();
 const hpLast=rooms.at(-1),survival=rooms.length?hpLast.hpEnd/hpLast.hpMax:null;
 return {mode:desiredRisk===undefined?'dungeon':'conditions',kind:conditionId||'unknown',conditionId,conditionMarkedRooms:rooms.filter(r=>r.conditionMarked).length,conditionPassagesCrossed:g.dungeon?.conditionEdgesUsed?.length||0,level,build:build.id,seed,resolvedSeed,seedShift,gearE,gearTier:P.gearTier(gearE).name,gearRarity:opts.rarity,
  pointsBudget:opts.points,pointsSpent:allocatedPoints,affinity:card.family,bossAffinity:card.family,bossName:A.profileFor(card.family).name,
  bossStyle:A.profileFor(card.family).style,boonsTaken:[...(g.dungeon?.foundationState?.boonIds||[])],contractId:g.dungeon?.foundationState?.contractId||null,
  contractReward:g.dungeon?.stage7RewardPaid||null,realm:card.name,risk:card.risk,route,rooms,events,stage:g.stage,won:g.stage==='finished',bossReached:rooms.some(r=>r.kind==='boss'),timedOut:rooms.some(r=>r.timedOut),error,seconds:+rooms.reduce((v,r)=>v+r.seconds,0).toFixed(2),damageDealt:rooms.reduce((v,r)=>v+r.damageDealt,0),damageTaken:rooms.reduce((v,r)=>v+r.damageTaken,0),manaSpent:rooms.reduce((v,r)=>v+r.manaSpent,0),minHpPct:rooms.length?Math.min(...rooms.map(r=>r.minHpPct)):null,lastHpPct:survival===null?null:+(100*survival).toFixed(1),goldNet:s.gold-initial.gold,fragmentsNet:s.fragments-initial.fragments,essenceNet:s.crafting.essence-initial.essence,coresNet:Object.fromEntries(Object.keys(initial.cores).map(k=>[k,(s.crafting.cores[k]||0)-(initial.cores[k]||0)])),
  talentXpNet:s.automaticTalents.xp-initial.xp,enemyAbilityCasts:rooms.reduce((n,x)=>n+x.enemyAbilityCasts,0),
  bossSummons:rooms.reduce((n,x)=>n+x.bossSummons,0),bossHealing:rooms.reduce((n,x)=>n+x.bossHealing,0),
  eliteSummons:rooms.reduce((n,x)=>n+x.eliteSummons,0),stepsLeft:g.dungeon?.steps};
}
function summarize(rows){
 const keyOf=r=>JSON.stringify([r.level,r.build,r.mode,r.kind||'all',r.bossAffinity||r.affinity||null,r.risk??null,r.pointsBudget??null,r.gearRarity||null]);
 const keys=[...new Set(rows.map(keyOf))],groups=[];
 for(const key of keys){
  const selected=rows.filter(r=>keyOf(r)===key),first=selected[0],mean=name=>+(selected.reduce((n,r)=>n+(Number(r[name])||0),0)/selected.length).toFixed(2);
  const wins=selected.filter(r=>r.won).length;
  groups.push({level:first.level,build:first.build,mode:first.mode,kind:first.kind||'all',affinity:first.bossAffinity||first.affinity||null,risk:first.risk??null,
   n:selected.length,wins,deaths:selected.filter(r=>r.died||r.stage==='failed').length,winPct:+(100*wins/selected.length).toFixed(1),
   errors:selected.filter(r=>r.error).length,timeouts:selected.filter(r=>r.timedOut).length,meanSeconds:mean('seconds'),meanDamageTaken:mean('damageTaken'),
   meanMinHpPct:mean('minHpPct'),meanBossHealing:mean('bossHealing'),meanBossSummons:mean('bossSummons'),meanEnemyAbilityCasts:mean('enemyAbilityCasts')});
 }
 return groups;
}
function simulate(opts){
 const rows=[],start=Date.now(),builds=opts.builds.map(id=>BUILDS.find(b=>b.id===id));
 const add=(mode,kind,level,build,seed,run,affinity=undefined,risk=undefined)=>{
  try{rows.push(run());}
  catch(e){rows.push({level,build:build.id,seed,kind,mode,affinity,risk,won:false,error:e.message});}
 };
 for(const level of opts.levels)for(const build of builds)for(const seed of opts.seeds){
  if(['encounter','both'].includes(opts.mode))for(const kind of ['normal','boss'])
   add('encounter',kind,level,build,seed,()=>encounter(level,build,seed,kind,opts));
  if(opts.mode==='enemies')for(const count of opts.groupSizes)
   add('enemies','swarm-'+count,level,build,seed,()=>encounter(level,build,seed,'normal',opts,undefined,undefined,undefined,undefined,count));
  if(opts.mode==='elites')
   add('elites','elite',level,build,seed,()=>encounter(level,build,seed,'elite',opts));
  if(opts.mode==='bosses')for(const affinity of opts.affinities)for(const risk of opts.risks)
   add('bosses',affinity,level,build,seed,()=>encounter(level,build,seed,'boss',opts,undefined,undefined,affinity,risk),affinity,risk);
  if(opts.mode==='bossprep')for(const strategy of ['baseline','marked_elite','reliquary','both'])
   add('bossprep',strategy,level,build,seed,()=>bossPreparationEncounter(level,build,seed,opts,strategy));
  if(opts.mode==='bossmods')for(const affinity of opts.affinities)for(const risk of opts.risks){
   const bossStyle=A.profileFor(affinity).style;
   for(const modifier of [null,...F.CATALOG.bossModifiers.filter(x=>M.check([x.id],bossStyle,'relentless_hunt')).map(x=>x.id)]){
    add('bossmods',modifier||'baseline',level,build,seed,
     ()=>encounter(level,build,seed,'boss',opts,undefined,modifier,affinity,risk),affinity,risk);
   }
  }
  if(opts.mode==='traits')for(const trial of [null,...F.CATALOG.encounterTraits.map(x=>x.id)])
   add('traits',trial||'baseline',level,build,seed,()=>encounter(level,build,seed,'normal',opts,trial));
  if(['dungeon','both'].includes(opts.mode))
   add('dungeon','route',level,build,seed,()=>dungeon(level,build,seed,opts));
  if(opts.mode==='conditions')for(const risk of RISKS)
   add('conditions','risk-'+risk,level,build,seed,()=>dungeon(level,build,seed,opts,risk),undefined,risk);
 }
 const distinct=field=>[...new Set(rows.map(r=>r[field]).filter(x=>x!==null&&x!==undefined))].sort(),
  sum=field=>rows.reduce((n,r)=>n+(Number(r[field])||0),0);
 const summary={cases:rows.length,wins:rows.filter(r=>r.won).length,deaths:rows.filter(r=>r.died||r.stage==='failed').length,
  errors:rows.filter(r=>r.error).length,timeouts:rows.filter(r=>r.timedOut).length,
  exposures:{bossAffinities:distinct('bossAffinity'),bossStyles:distinct('bossStyle'),eliteTypes:distinct('eliteType'),affinities:distinct('affinity'),
   conditions:distinct('conditionId'),totalBossSummons:sum('bossSummons'),totalBossHealing:sum('bossHealing'),
   totalBossWards:sum('bossWards'),totalBossCastInterruptions:sum('bossCastInterruptions'),
   totalArcanePulses:sum('bossArcanePulses'),totalEnemyAbilityCasts:sum('enemyAbilityCasts'),totalEliteSummons:sum('eliteSummons')},
  groups:summarize(rows)};
 const notes=[];
 if(opts.mode==='bosses'&&opts.affinities.some(x=>!summary.exposures.bossAffinities.includes(x)))notes.push('Not every requested Boss Affinity entered combat. Check errors and scenario seed search.');
 if(opts.points>0)notes.push('Fixed '+opts.points+'-point Talent Tree debug build is synthetic at all E levels, not earned account XP. Compare an explicit --points=0 baseline for E1.');
 if(['bosses','bossmods','enemies','elites','encounter','traits','bossprep'].includes(opts.mode))notes.push('Controlled first-ring encounter injection: uses native combat but not natural room placement, 15-Realm progression or earned equipment.');
 if(['dungeon','conditions','both'].includes(opts.mode))notes.push('Natural Dungeon route uses shortest accessible path and explicit Boon/Contract selection policies; potions are not automatically spent.');
 if(rows.length<100)notes.push('Small samples: do not infer final balance from win rates without larger seed cohorts and player tests.');
 return {schemaVersion:3,engine:'Wanderer v0.13 native combat/dungeon + Stage 7 economy + Stages 8.0–8.4 actors and abilities',mode:opts.mode,
  assumptions:{levels:opts.levels,seeds:opts.seeds,builds:opts.builds,pointsAvailable:opts.points,rarity:opts.rarity,gear:opts.gear,runes:opts.runes,
   affinities:opts.affinities,risks:opts.risks,groupSizes:opts.groupSizes,boons:opts.boons,contracts:opts.contracts,mode:opts.mode,potions:'not automatically selected',
   talents:'Tree v15, synthetic fixed budget; real E1 starts with zero points. XP rewards in natural Dungeon are reported but cannot be spent during this single simulated route.',
   gearProgression:'Current native item tiers and stat rolls; equipment held constant throughout the scenario (no auto-equipping drops).',
   controlled:'Boss, modifier, elite and swarm diagnostics deliberately replace a first-ring encounter; native skills, defender AI, six-Boss lookup, status effects, damage, rewards and summon limits remain unmodified.',
   dungeon:'Native three-card Realm and shortest accessible route; persistent HP/Mana and resource ledger, native Boon and Contract selection optional; not all 15 Realms or an account-level campaign.',
   bossmods:'Only Boss-compatible properties are tested on each selected real Affinity Boss. Legacy Rift-only forced boss ID removed.',
   visualVfx:'Present in browser but not simulated (visual-only, cannot change combat RNG or numbers).',
   limits:'No automatic potions, intelligent target swapping, conditional boon optimization, trading/crafting between rooms or manual player strategy. Not a complete player-behavior model; not all 15 Realms and cross-Expedition build investments are modeled.',
   warnings:notes},
  sourceSha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,'../index.html'))).digest('hex'),durationMs:Date.now()-start,summary,rows};
}
function main(args=process.argv.slice(2)){
 const opts=parseArgs(args),report=simulate(opts),dest=path.resolve(process.cwd(),opts.output);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({out:dest,cases:report.summary.cases,wins:report.summary.wins,deaths:report.summary.deaths,errors:report.summary.errors,timeouts:report.summary.timeouts,groups:report.summary.groups},null,2));
 if(report.summary.errors||report.summary.timeouts)process.exitCode=1;
 return report;
}
module.exports={BUILDS,DEFAULTS,parseArgs,talentPlan,gearLevel,shortestRoute,encounter,bossPreparationEncounter,dungeon,simulate,main};
if(require.main===module)main();
