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
 affinities:[...AFFINITIES],risks:[1],groupSizes:[...GROUP_SIZES],boons:'none',output:'reports/v013-simulation-results.json'});
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
 let p={...T.create(),xp:points*T.POINT_XP},visiting=new Set();
 function add(id){
  if(p.nodes.includes(id))return;
  const n=byNode.get(id);if(!n)throw Error('Unknown v0.13 Talent Tree node: '+id);
  if(visiting.has(id))throw Error('Talent dependency cycle: '+id);visiting.add(id);
  if(n.requires)add(n.requires);
  for(const dep of n.prerequisites||[])add(dep);
  if(n.anyRequires&&!n.anyRequires.some(dep=>p.nodes.includes(dep)))add(n.anyRequires[0]);
  if(n.element&&n.element!=='arcane'&&p.element!==n.element){add('element_choice');p=T.selectElement(p,n.element);if(!p)throw Error('Cannot select element '+n.element);}
  const next=T.allocate(p,id);if(!next)throw Error('Cannot purchase '+id+' with '+points+' points; spent '+p.nodes.length);
  p=next;visiting.delete(id);
 }
 for(const id of build.skills)add(id);
 if(build.element){add('element_choice');p=T.selectElement(p,build.element);if(!p)throw Error('Cannot select '+build.element);}
 if(!T.valid(p))throw Error('Invalid current talent tree progress');
 return p;
}
function gearLevel(level,mode){
 if(mode!=='previous')return level;
 const tiers=P.tiers;const index=tiers.findIndex(t=>t.id===P.gearTier(level).id);
 if(index<=0)return Math.max(1,level-1);
 return tiers[index-1].minimum;
}
function prepare(level,build,seed,opts,desiredRisk=undefined){
 const a=create(seed,undefined,{}, {skipPersistence:true});
 const gearE=gearLevel(level,opts.gear);
 a.setup(gearE,build.weapon,opts.rarity);
 a.state().automaticTalents=talentPlan(build,opts.points);
 if(opts.runes){const s=a.state();s.runes=['vitality','warding',build.weapon==='Wand'?'wisdom':'might'].map(k=>a.makeRune(k,gearE));s.runeSlots=s.runes.map(r=>r.id);}
 a.setUnlocked(level);a.start(level,true);
 const c=a.controller(),g=c.state;
 if(g.expedition!==level||!g.dungeon?.cards?.length)throw Error('Current v0.13 dungeon unavailable at E'+level);
 const card=desiredRisk===undefined?[...g.dungeon.cards].sort((x,y)=>(Number(x.family!==build.families[0])-Number(y.family!==build.families[0]))||x.risk-y.risk)[0]:g.dungeon.cards[desiredRisk];
 c.chooseRealm(card.id);
 return {a,c,g,card,gearE};
}
function fight(a,c,limit){
 const r=a.state().run;
 if(!r||r.status!=='fight')throw Error('Expected native combat encounter');
 const startHp=r.hp,startMp=r.mp,startedTier=r.tier;
 let ticks=0,minimumHp=r.maxhp>0?r.hp/r.maxhp:0;
 while(r.status==='fight'&&c.state.stage==='combat'&&r.hp>0&&ticks<limit){a.tick();ticks++;minimumHp=Math.min(minimumHp,Math.max(0,r.hp)/(r.maxhp||1));}
 const metrics=r.metrics||{},died=c.state.stage==='failed'||r.hp<=0,timedOut=!died&&r.status==='fight'&&ticks>=limit;
 const row={tier:startedTier,type:r.enemy?.boss?'boss':r.enemy?.miniboss?'elite':'combat',traitId:r.encounterTraitId||null,traitRegrowthHealing:Math.round(metrics.traitRegrowthHealing||0),traitDeathPulse:Math.round(metrics.traitDeathPulse||0),bossModifierIds:[...(r.bossModifierIds||[])],bossPulseTriggers:Math.round(metrics.bossPulseTriggers||0),bossFrenzyTriggers:Math.round(metrics.bossFrenzyTriggers||0),bossPreparation:r.bossPreparation?JSON.parse(JSON.stringify(r.bossPreparation)):null,status:died?'died':timedOut?'timeout':r.status,timedOut,died,won:!died&&r.status==='cleared',seconds:+(ticks*.11).toFixed(2),ticks,hpStart:+startHp.toFixed(2),hpEnd:+Math.max(0,r.hp).toFixed(2),hpMax:r.maxhp,mpStart:+startMp.toFixed(2),mpEnd:+Math.max(0,r.mp).toFixed(2),mpMax:r.maxmp,minHpPct:+(minimumHp*100).toFixed(1),conditionId:r.conditionId||null,conditionMarked:!!r.conditionMarked,conditionBarrierGranted:Math.round(r.conditionBarrierGranted||0),conditionRiteTriggers:Math.round(metrics.conditionRiteTriggers||0),damageDealt:Math.round(metrics.damageDealt||0),damageTaken:Math.round(metrics.damageTaken||0),absorbed:Math.round(metrics.absorbed||0),manaSpent:Math.round(metrics.manaSpent||0),initialEnemies:r.initialMobCount||r.totalMobCount||1,enemies:r.totalMobCount||1};
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
function encounter(level,build,seed,kind,opts,forcedTrait=undefined,forcedBossMod=undefined){
 const {a,c,g,card,gearE}=prepare(level,build,seed,opts);
 const candidate=card.edges.filter(([x])=>x===0).map(([,y])=>y).find(n=>card.nodes[n]?.kind==='combat');
 if(candidate===undefined)throw Error('Cannot find native v0.13 encounter');
 if(forcedTrait!==undefined){if(forcedTrait!==null&&!F.CATALOG.encounterTraits.some(x=>x.id===forcedTrait))throw Error('Unknown forced encounter trait');card.nodes[candidate].traitId=forcedTrait;}
 if(forcedBossMod!==undefined){
  if(kind!=='boss'||forcedBossMod!==null&&!F.CATALOG.bossModifiers.some(x=>x.id===forcedBossMod))throw Error('Unknown forced boss modifier');
  // Diagnostic-only native boss. Rift Harbinger has no built-in Barrier or Enrage,
  // allowing all six boss properties to be tested under one matched boss archetype.
  g.bossId='rift';
  const plan=g.dungeon.foundationManifest.cards.find(x=>x.realmId===card.id);
  plan.bossModifierIds=forcedBossMod?[forcedBossMod]:[];
  g.dungeon.foundationState.conditionId='relentless_hunt';
 }
 if(!c.visitRoom(candidate)||!a.enter())throw Error('Cannot enter native v0.13 encounter');
 const run=a.encounter({count:kind==='boss'?1:3,boss:kind==='boss'});
 if(run.tier!==level)throw Error('Incorrect encounter tier: '+run.tier+' vs '+level);
 const result=fight(a,c,opts.tickLimit);
 return {mode:forcedBossMod!==undefined?'bossmods':forcedTrait===undefined?'encounter':'traits',kind:forcedBossMod!==undefined?(forcedBossMod||'baseline'):forcedTrait===undefined?kind:(forcedTrait||'baseline'),level,build:build.id,seed,gearE,gearTier:P.gearTier(gearE).name,pointsSpent:a.state().automaticTalents.nodes.length,realm:card.name,unlocked:level,...result};
}
function bossPreparationEncounter(level,build,seed,opts,strategy){
 if(!['baseline','marked_elite','reliquary','both'].includes(strategy))throw Error('Unknown boss preparation strategy');
 // Controlled matched-seed native boss in a first-ring room. The selected Realm Card
 // is Dangerous so the marked Elite removes one guard rather than lowering Attack.
 const {a,c,g,card,gearE}=prepare(level,build,seed,opts,1);
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
  risk:card.risk,preparationCostHp:sacrifice,pointsSpent:a.state().automaticTalents.nodes.length,
  realm:card.name,unlocked:level,...result};
}
function dungeon(level,build,seed,opts,desiredRisk=undefined){
 const {a,c,g,card,gearE}=prepare(level,build,seed,opts,desiredRisk);
 const conditionId=g.dungeon?.foundationState?.conditionId||null;
 const route=shortestRoute(card),events=[],rooms=[],initial={gold:a.state().gold,fragments:a.state().fragments,essence:a.state().crafting.essence};
 let error=null;
 for(const node of route.slice(1)){
  if(g.stage==='failed'||g.stage==='finished')break;
  try{
   if(!c.visitRoom(node))throw Error('Room unreachable or insufficient steps: '+node);
   if(g.dungeon?.boonOffer){
    // Shrines are map rooms, never combat. The baseline simulator declines
    // optional powers; this is route coverage, not a Boon-balance experiment.
    c.chooseBoon(null);events.push('boon_shrine');continue;
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
 return {mode:desiredRisk===undefined?'dungeon':'conditions',kind:conditionId||'unknown',conditionId,conditionMarkedRooms:rooms.filter(r=>r.conditionMarked).length,conditionPassagesCrossed:g.dungeon?.conditionEdgesUsed?.length||0,level,build:build.id,seed,gearE,gearTier:P.gearTier(gearE).name,pointsSpent:s.automaticTalents.nodes.length,realm:card.name,risk:card.risk,route,rooms,events,stage:g.stage,won:g.stage==='finished',bossReached:rooms.some(r=>r.kind==='boss'),timedOut:rooms.some(r=>r.timedOut),error,seconds:+rooms.reduce((v,r)=>v+r.seconds,0).toFixed(2),damageDealt:rooms.reduce((v,r)=>v+r.damageDealt,0),damageTaken:rooms.reduce((v,r)=>v+r.damageTaken,0),manaSpent:rooms.reduce((v,r)=>v+r.manaSpent,0),minHpPct:rooms.length?Math.min(...rooms.map(r=>r.minHpPct)):null,lastHpPct:survival===null?null:+(100*survival).toFixed(1),goldNet:s.gold-initial.gold,fragmentsNet:s.fragments-initial.fragments,essenceNet:s.crafting.essence-initial.essence,stepsLeft:g.dungeon?.steps};
}
function summarize(rows){
 const groups=[];const keys=[...new Set(rows.map(r=>[r.level,r.build,r.mode,r.kind||'all'].join('|')))];
 for(const key of keys){const selected=rows.filter(r=>[r.level,r.build,r.mode,r.kind||'all'].join('|')===key),first=selected[0],mean=name=>+(selected.reduce((n,r)=>n+(Number(r[name])||0),0)/selected.length).toFixed(2);
  groups.push({level:first.level,build:first.build,mode:first.mode,kind:first.kind||'all',n:selected.length,wins:selected.filter(r=>r.won).length,deaths:selected.filter(r=>r.died||r.stage==='failed').length,winPct:+(100*selected.filter(r=>r.won).length/selected.length).toFixed(1),errors:selected.filter(r=>r.error).length,timeouts:selected.filter(r=>r.timedOut).length,meanSeconds:mean('seconds'),meanDamageTaken:mean('damageTaken'),meanMinHpPct:mean('minHpPct')});
 }
 return groups;
}
function simulate(opts){
 const rows=[],start=Date.now();const builds=opts.builds.map(id=>BUILDS.find(b=>b.id===id));
 for(const level of opts.levels)for(const build of builds)for(const seed of opts.seeds){
  if(['encounter','both'].includes(opts.mode))for(const kind of ['normal','boss']){
   try{rows.push(encounter(level,build,seed,kind,opts));}
   catch(e){rows.push({level,build:build.id,seed,kind,mode:'encounter',won:false,error:e.message});}
  }
  if(opts.mode==='bossprep')for(const strategy of ['baseline','marked_elite','reliquary','both']){
   try{rows.push(bossPreparationEncounter(level,build,seed,opts,strategy));}
   catch(e){rows.push({level,build:build.id,seed,kind:strategy,mode:'bossprep',won:false,error:e.message});}
  }
  if(opts.mode==='bossmods')for(const modifier of [null,...F.CATALOG.bossModifiers.map(x=>x.id)]){
   try{rows.push(encounter(level,build,seed,'boss',opts,undefined,modifier));}
   catch(e){rows.push({level,build:build.id,seed,kind:modifier||'baseline',mode:'bossmods',won:false,error:e.message});}
  }
  if(opts.mode==='traits')for(const trial of [null,...F.CATALOG.encounterTraits.map(x=>x.id)]){
   try{rows.push(encounter(level,build,seed,'normal',opts,trial));}
   catch(e){rows.push({level,build:build.id,seed,kind:trial||'baseline',mode:'traits',won:false,error:e.message});}
  }
  if(['dungeon','both'].includes(opts.mode)){
   try{rows.push(dungeon(level,build,seed,opts));}
   catch(e){rows.push({level,build:build.id,seed,mode:'dungeon',won:false,error:e.message});}
  }
  if(opts.mode==='conditions')for(const risk of [0,1,2]){
   try{rows.push(dungeon(level,build,seed,opts,risk));}
   catch(e){rows.push({level,build:build.id,seed,mode:'conditions',risk,won:false,error:e.message});}
  }
 }
 const summary={cases:rows.length,wins:rows.filter(r=>r.won).length,deaths:rows.filter(r=>r.died||r.stage==='failed').length,errors:rows.filter(r=>r.error).length,timeouts:rows.filter(r=>r.timedOut).length,groups:summarize(rows)};
 return {schemaVersion:2,engine:'Wanderer v0.13 native HTML combat + current permanent talent tree + dungeon controller',mode:opts.mode,
  assumptions:{levels:opts.levels,seeds:opts.seeds,builds:opts.builds,pointsAvailable:opts.points,rarity:opts.rarity,gear:opts.gear,runes:opts.runes,mode:opts.mode,potions:'none',lootUpgrades:'none',talents:'current tree version 15, fixed scenario budget; not earned progression',encounter:'native wave at selected Expedition Level; boss case injects a boss into an otherwise normal room for matched combat comparison',dungeon:'shortest accessible route through one real Realm map; persistent HP/Mana across rooms; no manual healing or artificial resets',traits:'controlled diagnostic: baseline plus six injected traits in one initial-ring normal room; unlike natural maps this deliberately bypasses affinity and first-ring placement restrictions to compare identical combat scenarios, not to model exploration',bossmods:'controlled diagnostic: baseline plus six injected boss modifiers against Rift Harbinger in an initial-ring room; bypasses regular map boss placement and multi-modifier counts for matched-seed comparison only',bossprep:'controlled Dangerous boss baseline versus Marked Elite, Forgotten Reliquary sacrifice and both; applies real boss mechanics but injects preparation state and first-ring boss placement without actual optional-room exploration',conditions:'Natural three-card Realm selection and six condition effects, without modifying the map or combat formulas. Selected paths follow the shortest topology, not optimal player choices.',limits:'Synthetic fixed gear and permanent points. Conditions mode follows one natural route per each of the three Realm cards, not all 15 Realms or multi-expedition economic progression. No production balance conclusions on small seed counts.'},
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
