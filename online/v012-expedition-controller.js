// Wanderer v0.12 Phase 1: scheduling only. NO combat, inventory, save or Firebase implementation.
// This is intentionally independent of online/v012-engine.mjs (the disposable prototype simulator).
(function(root){
'use strict';
const FAMILIES=Object.freeze(['blood','decay','vitality','aegis','fury','magic']);
const FAMILY_NAMES=Object.freeze({blood:'Blood',decay:'Decay',vitality:'Vitality',aegis:'Aegis',fury:'Fury',magic:'Magic'});
const THEME_FAMILIES=Object.freeze({
 temple:'decay',forge:'blood',crypt:'fury',bastion:'fury',frost:'magic',ash:'magic',
 void:'decay',ward:'aegis',grove:'vitality',shrine:'vitality',storm:'magic',
 drowned:'aegis',quarry:'aegis',bloodscar:'blood'
});
const REALMS=Object.freeze({forge:['blood','Crimson Dominion'],bloodscar:['blood','Bloodscar Wastes'],temple:['decay','Venomreach'],void:['decay','Umbral Hollow'],grove:['vitality','Verdant Wilds'],shrine:['vitality','Everroot Vale'],ward:['aegis','Warded Marches'],drowned:['aegis','Drowned Bastion'],crypt:['fury','Gravewind Barrens'],bastion:['fury','Ironbound Frontier'],ash:['magic','Ashen Aether'],storm:['magic','Stormglass Beyond']});
const BOSSES=Object.freeze([{id:'guardian',name:"Abyssal Guardian’s Citadel",style:'guardian'},{id:'rift',name:"Harbinger’s Rift",style:'leech'},{id:'ember',name:"Ember Sovereign’s Throne",style:'berserker'}]);
const EVENT_GROUPS=[['traveling_merchant','smugglers_caravan','relic_collector','cursed_artificer'],['cursed_altar','soul_mirror','whispering_idol','echo_shrine'],['cursed_chest','forgotten_arsenal','runic_vault','bounty_writ'],['restless_spring','fallen_wanderer','oracle_of_paths','last_ember']];
const ROOMS=Object.freeze(['combat','combat','combat','combat','combat','combat','combat','elite','elite','chest','chest','event','event','altar']);
function shuffle(values,rng){
 const arr=[...values];
 for(let i=arr.length-1;i>0;i--){const j=Math.min(i,Math.floor(rng()*(i+1)));[arr[i],arr[j]]=[arr[j],arr[i]];}
 return arr;
}
function create(themes,rng=Math.random){
 if(!Array.isArray(themes)||!themes.length||!themes.every(t=>typeof t?.id==='string'&&THEME_FAMILIES[t.id]))throw Error('Classic themes required');
 if(typeof rng!=='function')throw Error('Invalid RNG');
 const expeditionThemes=Object.entries(REALMS).map(([id,[family,name]])=>({...(themes.find(t=>t.id===id)||themes.find(t=>t.id==='forge')),id,name,family}));
 const byFamily=Object.fromEntries(FAMILIES.map(f=>[f,themes.filter(t=>THEME_FAMILIES[t.id]===f)]));
 if(FAMILIES.some(f=>!byFamily[f].length))throw Error('Missing classic themes for affinity '+FAMILIES.find(f=>!byFamily[f].length));
 const game={unlocked:1,expedition:0,planeIndex:0,stage:'camp',families:[],lastFamily:null,rooms:[],offers:[],selected:null,wave:0,history:[],initialFamily:null,rewardPending:null,rerollsByRealm:[],eventIds:[],affinityPlan:null,affinityPlanSeen:[false,false,false]};
 let routeRng=rng,draftRng=rng;
 function allowed(){
  return FAMILIES.filter(f=>game.families.length<3||game.families.includes(f));
 }
 function makeOffer(family,excluded=[]){
  const kind=game.rooms[game.planeIndex-1],list=(game.version===2?expeditionThemes:byFamily[family]).filter(t=>t.family===family&&!excluded.includes(t.id)),theme=list[Math.floor(routeRng()*list.length)];
  if(!theme)throw Error('No distinct Realm available for '+family);
  return {id:theme.id,name:kind==='boss'&&game.version===2?BOSSES.find(b=>b.id===game.bossId).name:theme.name,image:theme.image,family,
   waves:game.version===2&&kind==='event'?0:kind==='boss'?3:kind==='elite'?2+Math.floor(routeRng()*2):1+Math.floor(routeRng()*3),
   elite:kind==='elite'||kind==='boss'||kind!=='event'&&routeRng()<.2,boss:kind==='boss',
   event:game.version===2?(kind==='event'?game.eventsByRealm[game.planeIndex-1]:null):(['chest','event','altar'].includes(kind)?kind:null)};
 }
 function offerRealms(){
  if(game.stage!=='choice'||!game.initialFamily||game.rewardPending)throw Error('Realm selection unavailable');
  if(game.version===2&&game.planeIndex===15){game.offers=[makeOffer(game.families[Math.floor(routeRng()*game.families.length)])];return game.offers;}
  const offers=[],required=game.history.length===0?game.initialFamily:game.version===2&&allowed().includes(game.pathInfluence)?game.pathInfluence:null;
  if(required)offers.push(makeOffer(required));
  // Planned routes create opportunities only; a family is unlocked only when its Realm is entered.
  // Offer the second family from Realm 2 through its Realm 4 deadline and the third from Realm 3 through Realm 7.
  const plannedIndex=game.planeIndex>=2&&game.planeIndex<=4&&!game.affinityPlanSeen[1]?1:
   game.planeIndex>=3&&game.planeIndex<=7&&!game.affinityPlanSeen[2]?2:-1;
  const planned=game.affinityPlan&&plannedIndex>=0&&!game.affinityPlanSeen[plannedIndex]?game.affinityPlan[plannedIndex]:null;
  if(planned&&!offers.some(p=>p.family===planned)&&allowed().includes(planned))offers.push(makeOffer(planned,offers.map(p=>p.id)));
  game.pathInfluence=null;
  while(offers.length<3){
   const used=offers.map(p=>p.id);
   const candidates=allowed().filter(f=>expeditionThemes.some(t=>t.family===f&&!used.includes(t.id)));
   if(!candidates.length)throw Error('Cannot construct three distinct Realm offers');
   const family=candidates[Math.floor(routeRng()*candidates.length)];
   offers.push(makeOffer(family,used));
  }
  game.offers=shuffle(offers,routeRng);
  if(game.affinityPlan)for(let i=0;i<3;i++)if(game.offers.some(p=>p.family===game.affinityPlan[i]))game.affinityPlanSeen[i]=true;
  return game.offers;
 }
  function start(level=1){
  if(!Number.isInteger(level)||level<1||level>game.unlocked)throw Error('Expedition locked');
  if(!['camp','finished','failed'].includes(game.stage))throw Error('Expedition already active');
  const count=3+Math.floor(routeRng()*2),events=shuffle(EVENT_GROUPS,routeRng).slice(0,count).map(group=>group[Math.floor(routeRng()*group.length)]);
  const windows=count===4?[[3,4,5],[6,7,8],[9,10,11],[12,13,14]]:[[3,4,5],[7,8,9],[11,12,13]],rooms=Array(15).fill('combat');rooms[14]='boss';
  for(const window of windows)rooms[window[Math.floor(routeRng()*window.length)]-1]='event';
  const eliteSlots=shuffle(Array.from({length:13},(_,i)=>i+1).filter(i=>rooms[i]==='combat'),routeRng).slice(0,2);for(const i of eliteSlots)rooms[i]='elite';let eventIndex=0;
  Object.assign(game,{version:2,rerolls:3,bossId:BOSSES[Math.floor(routeRng()*3)].id,eventsByRealm:rooms.map(k=>k==='event'?events[eventIndex++]:null),expedition:level,planeIndex:1,families:[],lastFamily:null,initialFamily:null,affinityPlanSeen:[false,false,false],
   rooms,offers:[],selected:null,wave:0,history:[],
   rewardPending:null,rerollsByRealm:Array.from({length:15},()=>[3,3,3]),stage:'choice'});
  return game;
 }
 function planAffinities(plan){
  if(!['camp','finished','failed'].includes(game.stage))throw Error('Affinity plan can only change between Expeditions');
  if(plan===null){game.affinityPlan=null;game.affinityPlanSeen=[false,false,false];return null;}
  if(!Array.isArray(plan)||plan.length!==3||new Set(plan).size!==3||!plan.every(f=>FAMILIES.includes(f)))throw Error('Affinity plan must contain three distinct affinities');
  game.affinityPlan=[...plan];game.affinityPlanSeen=[false,false,false];return game.affinityPlan;
 }
 function chooseInitial(family){
  if(game.stage!=='choice'||game.initialFamily||!FAMILIES.includes(family))throw Error('Initial affinity unavailable');
  if(game.affinityPlan&&family!==game.affinityPlan[0])throw Error('Initial affinity must match the plan');
  game.initialFamily=family;game.families.push(family);offerRealms();return family;
 }
 function reroll(index){
  if(game.stage!=='choice'||!game.initialFamily||game.rewardPending||!Number.isInteger(index)||index<0||index>2||(game.version===2?(game.rerolls<=0||game.planeIndex===15):game.rerollsByRealm[game.planeIndex-1][index]<=0))throw Error('No Realm rerolls remaining');
  const other=game.offers.filter((_,i)=>i!==index),old=game.offers[index];
  // Keep all other cards and their counters intact. Guarantee the initial route even after rerolling it.
  const mustInitial=game.history.length===0&&!other.some(o=>o.family===game.initialFamily);
  const used=[...other.map(o=>o.id),old.id];
  const candidates=allowed().filter(f=>(!mustInitial||f===game.initialFamily)&&expeditionThemes.some(t=>t.family===f&&!used.includes(t.id)));
  if(!candidates.length)throw Error('No eligible replacement Realm');
  if(game.version===2)game.rerolls--;else game.rerollsByRealm[game.planeIndex-1][index]--;
  game.offers[index]=makeOffer(candidates[Math.floor(routeRng()*candidates.length)],used);
  if(game.selected===old)game.selected=null;
  return game.offers[index];
 }
 function select(id){
  if(game.stage!=='choice'||!game.initialFamily||game.rewardPending)throw Error('Realm not available');
  const realm=game.offers.find(p=>p.id===id);
  if(!realm)throw Error('Not an offered Realm');
  if(!allowed().includes(realm.family))throw Error('Affinity choice no longer eligible');
  game.selected=realm;return realm;
 }
 function enter(){
  if(game.stage!=='choice'||game.rewardPending||!game.selected||!game.offers.includes(game.selected))throw Error('Select an offered Realm before entering');
  const realm=game.selected;
  if(!allowed().includes(realm.family))throw Error('Affinity choice no longer eligible');
  if(!game.families.includes(realm.family))game.families.push(realm.family);
  game.lastFamily=realm.family;game.wave=1;game.stage='combat';return realm;
 }
 function claimReward(){
  if(game.stage!=='choice'||!game.rewardPending)throw Error('No Realm passive pending');
  game.rewardPending=null;offerRealms();return game.offers;
 }
 function waveWon(){
  if(game.stage!=='combat'||!game.selected||game.selected.eventId)throw Error('No active combat wave');
  if(game.wave<game.selected.waves){game.wave++;return {planeComplete:false,nextWave:game.wave};}
  game.history.push({plane:game.planeIndex,...game.selected});
  if(game.planeIndex===15){
   if(!game.selected.boss)throw Error('Realm 15 must contain the Expedition boss');
   game.unlocked=Math.max(game.unlocked,game.expedition+1);
   game.stage='finished';game.selected=null;game.offers=[];game.wave=0;game.families=[];game.lastFamily=null;game.rewardPending=null;
   return {planeComplete:true,expeditionComplete:true};
  }
  game.rewardPending={...game.selected,plane:game.planeIndex};
  game.planeIndex++;game.stage='choice';game.selected=null;game.wave=0;game.offers=[];
  return {planeComplete:true,expeditionComplete:false,offers:game.offers};
 }
 function defeat(){
  if(game.stage!=='combat')throw Error('No active combat');
  game.stage='failed';game.selected=null;game.offers=[];game.wave=0;game.families=[];game.lastFamily=null;game.rewardPending=null;
 }
 function abandon(){
  if(!['choice','combat'].includes(game.stage))throw Error('No active Expedition');
  game.stage='failed';game.selected=null;game.offers=[];game.wave=0;game.families=[];game.lastFamily=null;game.rewardPending=null;
 }
 function restore(input){
  if(input?.version!==2)throw Error('Unsupported historical Expedition checkpoint (requires calendar version 2)');
  const g=JSON.parse(JSON.stringify(input));
  g.affinityPlan??=null;g.affinityPlanSeen??=[false,false,false];
  const integer=(v,min,max)=>Number.isInteger(v)&&v>=min&&v<=max;
  if(!g||!integer(g.unlocked,1,Number.MAX_SAFE_INTEGER)||!integer(g.expedition,1,g.unlocked)||!integer(g.planeIndex,1,15)||!['choice','combat','finished','failed'].includes(g.stage)||!Array.isArray(g.rooms)||g.rooms.length!==15||g.rooms[0]!=='combat'||g.rooms[14]!=='boss'||g.rooms.slice(0,14).some(k=>!(g.version===2?['combat','elite','event']:ROOMS).includes(k)))throw Error('Invalid Realm checkpoint');
  if(g.version===2){if(!integer(g.rerolls,0,3)||!BOSSES.some(b=>b.id===g.bossId)||!Array.isArray(g.eventsByRealm)||g.eventsByRealm.length!==15||g.rooms.filter(k=>k==='event').length<3||g.rooms.filter(k=>k==='event').length>4||g.rooms.filter(k=>k==='elite').length!==2)throw Error('Invalid integration schedule');const ids=g.eventsByRealm.filter(Boolean),groups=ids.map(id=>EVENT_GROUPS.findIndex(group=>group.includes(id)));if(new Set(ids).size!==ids.length||new Set(groups).size!==groups.length||groups.includes(-1)||g.eventsByRealm.some((id,i)=>(g.rooms[i]==='event')!==!!id))throw Error('Invalid event schedule');}
  if(g.version!==2&&JSON.stringify([...g.rooms.slice(0,14)].sort())!==JSON.stringify([...ROOMS].sort()))throw Error('Invalid Realm schedule');
  if(!Array.isArray(g.families)||g.families.length>3||new Set(g.families).size!==g.families.length||!g.families.every(f=>FAMILIES.includes(f))||g.initialFamily!==null&&!FAMILIES.includes(g.initialFamily))throw Error('Invalid saved affinities');
  if(g.affinityPlan!==null&&(!Array.isArray(g.affinityPlan)||g.affinityPlan.length!==3||new Set(g.affinityPlan).size!==3||!g.affinityPlan.every(f=>FAMILIES.includes(f)))||!Array.isArray(g.affinityPlanSeen)||g.affinityPlanSeen.length!==3||!g.affinityPlanSeen.every(v=>typeof v==='boolean'))throw Error('Invalid affinity plan');
  if(!Array.isArray(g.rerollsByRealm)||g.rerollsByRealm.length!==15||!g.rerollsByRealm.every(row=>Array.isArray(row)&&row.length===3&&row.every(n=>integer(n,0,3))))throw Error('Invalid Realm rerolls');
  function realm(p,index){
   const theme=(g.version===2?expeditionThemes:themes).find(t=>t.id===p?.id),kind=g.rooms[index-1];
   if(!theme||(g.version===2?REALMS[p.id]?.[0]:THEME_FAMILIES[p.id])!==p.family||!integer(p.waves,g.version===2&&kind==='event'?0:1,3)||typeof p.elite!=='boolean'||p.boss!==(index===15)||p.event!==(g.version===2?(kind==='event'?g.eventsByRealm[index-1]:null):(['chest','event','altar'].includes(kind)?kind:null))||p.boss&&p.waves!==3)throw Error('Invalid saved Realm');
   return {...p,name:p.boss&&g.version===2?BOSSES.find(b=>b.id===g.bossId).name:theme.name,image:theme.image};
  }
  if(!Array.isArray(g.offers)||!(g.version===2&&g.planeIndex===15?[0,1]:[0,3]).includes(g.offers.length)||new Set(g.offers.map(p=>p.id)).size!==g.offers.length )throw Error('Invalid Realm offers');
  g.offers=g.offers.map(p=>realm(p,g.planeIndex));
  if(!Array.isArray(g.history)||g.history.length>15)throw Error('Invalid Realm history');
  g.history=g.history.map((p,i)=>{if(p.plane!==i+1)throw Error('Invalid Realm history');return realm(p,i+1);});
  if(g.stage==='choice'||g.stage==='combat'){
   if(g.history.length!==g.planeIndex-1||g.initialFamily&&!g.families.includes(g.initialFamily))throw Error('Invalid Realm progress');
   if(g.rewardPending)g.rewardPending=realm(g.rewardPending,g.planeIndex-1);
   if(g.stage==='combat'){
    const selected=g.offers.find(p=>p.id===g.selected?.id);if(!selected||!g.families.includes(selected.family)||!integer(g.wave,1,Math.max(1,selected.waves)))throw Error('Invalid combat checkpoint');g.selected=selected;
   }else{
    if(g.wave!==0||g.rewardPending&&(g.offers.length||g.selected)||!g.initialFamily&&g.offers.length)throw Error('Invalid choice checkpoint');
    if(g.selected){const selected=g.offers.find(p=>p.id===g.selected.id);if(!selected)throw Error('Invalid selected Realm');g.selected=selected;}
   }
  }
  if(['choice','combat'].includes(g.stage)){
   const acquired=new Set([g.initialFamily,...g.history.map(p=>p.family),...(g.stage==='combat'?[g.selected.family]:[])].filter(Boolean));
   if(acquired.size!==g.families.length||!g.families.every(f=>acquired.has(f)))throw Error('Invalid affinity provenance');
   if(g.stage==='choice'&&g.offers.some(p=>(g.families.length===3&&!g.families.includes(p.family)) ))throw Error('Invalid affinity offer');
   if(g.affinityPlan&&g.initialFamily&&g.affinityPlan[0]!==g.initialFamily)throw Error('Invalid active affinity plan');
  }
  Object.assign(game,g);return game;
 }
 function influence(family){if(!allowed().includes(family))throw Error('Affinity influence unavailable');game.pathInfluence=family;}
 function setSimulationRandomStreams(route,draft){if(typeof route!=='function'||typeof draft!=='function')throw Error('Simulation RNG streams must be functions');routeRng=route;draftRng=draft;}
 function passiveRandom(){return draftRng;}
 
 return Object.freeze({influence,state:game,start,restore,planAffinities,chooseInitial:chooseInitial,select:select,enter:enter,claimReward:claimReward,reroll:reroll,waveWon:waveWon,eventWon:()=>{throw Error('Resolve the offered integrated event');},defeat:defeat,abandon:abandon,allowed:allowed,setSimulationRandomStreams,passiveRandom});
}
root.WandererV012Expedition=Object.freeze({create,FAMILIES,FAMILY_NAMES,THEME_FAMILIES,REALMS,BOSSES,EVENT_GROUPS});
})(globalThis);
