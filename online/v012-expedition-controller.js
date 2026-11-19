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
const BOSSES=Object.freeze([{id:'guardian',name:"Abyssal Guardian’s Citadel",style:'guardian',affinity:'aegis'},{id:'rift',name:"Harbinger’s Rift",style:'leech',affinity:'blood'},{id:'ember',name:"Ember Sovereign’s Throne",style:'berserker',affinity:'fury'},{id:'carrion',name:"Matriarch’s Brood",style:'matriarch',affinity:'decay'},{id:'heartroot',name:"Heartroot’s Hollow",style:'devourer',affinity:'vitality'},{id:'stormglass',name:"Stormglass Spire",style:'conductor',affinity:'magic'}]);
const bossForAffinity=family=>BOSSES.find(b=>b.affinity===family);
const EVENT_GROUPS=[['traveling_merchant','relic_collector'],['cursed_altar','whispering_idol'],['forgotten_arsenal','bounty_writ'],['restless_spring','oracle_of_paths']];
const ROOMS=Object.freeze(['combat','combat','combat','combat','combat','combat','combat','elite','elite','chest','chest','event','event','altar']);
const I=root.WandererV013MapIntelligence,F=root.WandererV013ExpeditionFoundation,T=root.WandererV013EncounterTraits,P=root.WandererV013BossPreparation,C=root.WandererV013ExpeditionConditions,B=root.WandererV013ExpeditionBoons,K=root.WandererV013ExpeditionContracts;
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
 function makeRouteMobCounts(routeMap){return routeMap.map(row=>{const choices=shuffle([3,12,18+Math.floor(routeRng()*5)],routeRng);let next=0;return row.map(kind=>kind==='combat'?choices[next++%choices.length]:1);});}
 function allowedMobCount(value){return value===3||value===12||Number.isInteger(value)&&value>=18&&value<=22;}
 function allowed(){
  const eligible=FAMILIES.filter(f=>game.freeBuild||game.families.length<3||game.families.includes(f));
  // The final boss can belong to a fourth affinity; expose it only for the boss Realm.
  if(game.version===2&&game.planeIndex===15&&FAMILIES.includes(game.bossFamily)&&!eligible.includes(game.bossFamily))eligible.push(game.bossFamily);
  return eligible;
 }
 function makeOffer(family,excluded=[],lane=null){
  const kind=game.routeMap&&lane!==null?game.routeMap[game.planeIndex-1][lane]:game.rooms[game.planeIndex-1],list=(game.version===2?expeditionThemes:byFamily[family]).filter(t=>t.family===family&&!excluded.includes(t.id)),theme=list[Math.floor(routeRng()*list.length)];
  if(!theme)throw Error('No distinct Realm available for '+family);
  return {id:theme.id,name:kind==='boss'&&game.version===2?bossForAffinity(family).name:theme.name,image:theme.image,family,
   waves:kind==='event'?0:1,
   elite:kind==='elite'||kind==='boss'||!game.routeMap&&kind!=='event'&&routeRng()<.2,boss:kind==='boss',
   event:game.version===2?(kind==='event'?game.eventsByRealm[game.planeIndex-1]:null):(['chest','event','altar'].includes(kind)?kind:null),...(lane===null?{}:{lane}),...(kind==='combat'&&game.routeMobCounts&&lane!==null?{mobCount:game.routeMobCounts[game.planeIndex-1][lane]}:{})};
 }
 function offerRealms(){
  if(game.stage!=='choice'||(!game.freeBuild&&!game.initialFamily)||game.rewardPending)throw Error('Realm selection unavailable');
  if(game.version===2&&game.planeIndex===15){game.offers=[makeOffer(game.bossFamily,[],game.routeMap?0:null)];return game.offers;}
  const previous=game.history[game.history.length-1],laneOrder=game.projectFamily&&previous?[previous.lane,...[0,1,2].filter(n=>n!==previous.lane)]:previous?.lane===2?[1,2,0]:[1,0,2];
  const offers=[],required=game.freeBuild&&game.projectFamily?game.projectFamily:game.history.length===0?game.initialFamily:game.version===2&&allowed().includes(game.pathInfluence)?game.pathInfluence:null;
  if(required)offers.push(makeOffer(required,[],game.routeMap?laneOrder[offers.length]:null));
  // Planned routes create opportunities only; a family is unlocked only when its Realm is entered.
  // Offer the second family from Realm 2 through its Realm 4 deadline and the third from Realm 3 through Realm 7.
  const plannedIndex=game.planeIndex>=2&&game.planeIndex<=4&&!game.affinityPlanSeen[1]?1:
   game.planeIndex>=3&&game.planeIndex<=7&&!game.affinityPlanSeen[2]?2:-1;
  const planned=game.affinityPlan&&plannedIndex>=0&&!game.affinityPlanSeen[plannedIndex]?game.affinityPlan[plannedIndex]:null;
  if(planned&&!offers.some(p=>p.family===planned)&&allowed().includes(planned))offers.push(makeOffer(planned,offers.map(p=>p.id),game.routeMap?laneOrder[offers.length]:null));
  game.pathInfluence=null;
  while(offers.length<3){
   const used=offers.map(p=>p.id);
   const candidates=allowed().filter(f=>expeditionThemes.some(t=>t.family===f&&!used.includes(t.id)));
   if(!candidates.length)throw Error('Cannot construct three distinct Realm offers');
   const family=candidates[Math.floor(routeRng()*candidates.length)];
   offers.push(makeOffer(family,used,game.routeMap?laneOrder[offers.length]:null));
  }
  game.offers=game.routeMap?offers.sort((a,b)=>a.lane-b.lane):shuffle(offers,routeRng);
  if(game.affinityPlan)for(let i=0;i<3;i++)if(game.planeIndex>=(i===0?1:i===1?2:3)&&game.offers.some(p=>p.family===game.affinityPlan[i]&&reachable(p)))game.affinityPlanSeen[i]=true;
  return game.offers;
 }
  function start(level=1,options={}){
  if(!Number.isInteger(level)||level<1||level>game.unlocked)throw Error('Expedition locked');
  if(!['camp','finished','failed'].includes(game.stage))throw Error('Expedition already active');
  if(options.dungeon)return startDungeon(level,options.targetFamily);
  delete game.dungeon;
  const count=3+Math.floor(routeRng()*2),events=shuffle(EVENT_GROUPS,routeRng).slice(0,count).map(group=>group[Math.floor(routeRng()*group.length)]);
  const windows=count===4?[[3,4,5],[6,7,8],[9,10,11],[12,13,14]]:[[3,4,5],[7,8,9],[11,12,13]],rooms=Array(15).fill('combat');rooms[14]='boss';
  for(const window of windows)rooms[window[Math.floor(routeRng()*window.length)]-1]='event';
  const eliteSlots=shuffle(Array.from({length:13},(_,i)=>i+1).filter(i=>rooms[i]==='combat'),routeRng).slice(0,2);for(const i of eliteSlots)rooms[i]='elite';let eventIndex=0;
  Object.assign(game,{version:2,freeBuild:options.freeBuild===true,rerolls:3,bossId:BOSSES[Math.floor(routeRng()*BOSSES.length)].id,eventsByRealm:rooms.map(k=>k==='event'?events[eventIndex++]:null),expedition:level,planeIndex:1,families:[],lastFamily:null,initialFamily:null,affinityPlanSeen:[false,false,false],
   rooms,routeMap:rooms.map((kind,i)=>{if(i===14)return ['boss'];const row=[kind,kind,kind];if(options.freeBuild&&kind==='event')row[Math.floor(routeRng()*3)]='combat';if(i>0&&kind==='combat'&&routeRng()<.55)row[Math.floor(routeRng()*3)]='elite';return row;}),offers:[],selected:null,wave:0,history:[],
   rewardPending:null,rerollsByRealm:Array.from({length:15},()=>[3,3,3]),stage:'choice'});
  game.projectFamily=FAMILIES.includes(options.targetFamily)?options.targetFamily:null;game.bossFamily=FAMILIES.includes(options.targetFamily)?options.targetFamily:FAMILIES[Math.floor(routeRng()*FAMILIES.length)];game.bossId=bossForAffinity(game.bossFamily).id;game.encounterVersion=1;game.routeMobVersion=1;game.routeMobCounts=makeRouteMobCounts(game.routeMap);
  delete game.routeGroups;
  if(game.freeBuild){
   const crossings=[[2,3,4],[6,7,8],[10,11,12]].map(window=>window[Math.floor(routeRng()*window.length)]);
   const directions=crossings.map(()=>routeRng()<.5?-1:1);
   game.routeEdges=Array.from({length:14},(_,i)=>Array.from({length:3},(_,lane)=>{
    if(i===13)return [0];
    if(!crossings.includes(i))return [lane];
    const other=lane+directions[crossings.indexOf(i)];return other>=0&&other<3?[lane,other]:[lane];
   }));
   game.routePositions=game.routeMap.map((row,i)=>row.map((_,lane)=>i===14?150:Math.round(50+lane*100+(routeRng()-.5)*32)));
  }else{delete game.routeEdges;delete game.routePositions;}
  if(game.freeBuild)offerRealms();
  return game;
 }
 function startDungeon(level, targetFamily){
  if(!Number.isInteger(level)||level<1||level>game.unlocked||!['camp','finished','failed'].includes(game.stage))throw Error('Expedition unavailable');
  const families=shuffle(FAMILIES,routeRng);
  if(FAMILIES.includes(targetFamily)){families.splice(families.indexOf(targetFamily),1);families.unshift(targetFamily);}
  const cards=shuffle(families.slice(0,3),routeRng).map((family,risk)=>{
   const theme=shuffle(expeditionThemes.filter(t=>t.family===family),routeRng)[0];
   const events=[...shuffle(['whispering_idol','traveling_merchant','cursed_altar'],routeRng),'forgotten_arsenal'];
   // Convert a known ritual event into an Oracle encounter without advancing map RNG.
   if(events.includes('cursed_altar')&&risk>=1)events[events.indexOf('cursed_altar')]='oracle_of_paths';
   const size=18+risk*2;
   const kinds=Array(size).fill('combat');kinds[0]='entrance';kinds[size-1]='boss';
   const slots=shuffle(Array.from({length:size-6},(_,i)=>i+5),routeRng);
   kinds[slots.pop()]='spring';kinds[slots.pop()]='event';kinds[slots.pop()]='event';
   // Elites occupy a single corridor so the opposite corridor always bypasses them.
   const eliteSlots=shuffle(slots.filter(i=>i%2===slots[0]%2),routeRng);
   for(const i of eliteSlots.slice(0,risk===2?2:1))kinds[i]='elite';
   const horde=risk===2?slots.find(i=>kinds[i]==='combat'):-1;
   const nodes=kinds.map((kind,i)=>{
    const range=i===1?[1,1]:i===2?[2,4]:i===horde?[18,22]:routeRng()<.45?[6,12]:[2,4];
    const count=range[0]+Math.floor(routeRng()*(range[1]-range[0]+1));
    return {kind,offset:Math.round((routeRng()-.5)*22),range,count,escorts:kind==='boss'?risk:kind==='elite'?Math.floor(routeRng()*(risk+1)):0,event:kind==='spring'?'restless_spring':kind==='event'?events.pop():null};
   });
   const edges=[],positions=[[50,50]],rotation=routeRng()*Math.PI*2;
   const place=(angle,radius)=>positions.push([50+radius*Math.cos(angle+rotation),50+radius*Math.sin(angle+rotation)]);
   for(let ring=0;ring<4;ring++){
    const cross=Math.floor(routeRng()*4);
    for(let arm=0;arm<4;arm++){
     const id=1+ring*4+arm;
     place((arm+ring*.24)*Math.PI/2,12+ring*9);
     edges.push([ring?id-4:0,id]);
     if(ring&&(arm===cross||arm===(cross+2)%4&&routeRng()<.55))edges.push([1+(ring-1)*4+(arm+1)%4,id]);
    }
   }
   const sectors=shuffle([0,1,2,3],routeRng),bossSector=sectors[0];
   for(let id=17;id<size;id++){
    const arm=id===size-1?bossSector:sectors[(id-16)%4];
    place((arm+1.1+(id===21?.4:0))*Math.PI/2,44);
    edges.push([13+arm,id]);
   }
   const shortcut=5+4*Math.floor(routeRng()*3)+Math.floor(routeRng()*3);edges.push([shortcut,shortcut+1]);
   const secondSector=(bossSector+1)%4;edges.push([(routeRng()<.5?9:13)+secondSector,size-1]);
   const clueRoom=5+bossSector;
   const pools={blood:[['weapon','Sword'],['weapon','Two-Handed']],decay:[['weapon','Daggers'],['armor','Leather']],vitality:[['weapon','Wand'],['armor','Plate']],aegis:[['offhand','Shield'],['armor','Cloth']],fury:[['weapon','Bow'],['weapon','Daggers']],magic:[['weapon','Staff'],['offhand','Orb']]};
   const [slot,subtype]=shuffle(pools[family],routeRng)[0];
   const objective=shuffle(nodes.map((n,i)=>n.kind==='elite'?i:-1).filter(i=>i>=0),routeRng)[0];
   return {id:theme.id,name:theme.name,family,image:theme.image,risk,nodes,edges,shortcut,positions,objective,favoured:{slot,subtype},bossSector,secondSector,clueRoom,stepLimit:14-risk};
  });
  const legacyBossOrder=shuffle(BOSSES.slice(0,3),routeRng); // Preserve deterministic map/seed RNG draw count from Stage 8.3.
   const bossId=bossForAffinity(cards[0].family).id,seed=Math.floor(routeRng()*4294967296)>>>0;
  const manifest=F?.createManifest(cards,{seed,expeditionLevel:level,bossStyle:BOSSES.find(b=>b.id===bossId).style})||null;
  if(P&&manifest)for(const card of cards)P.planRoom(card,seed);
  if(B&&manifest)for(const card of cards)B.placeShrines(card,seed);
  if(T&&manifest)for(const card of cards)for(const {room,traitId} of T.assign(card,seed))card.nodes[room].traitId=traitId;
  Object.assign(game,{version:2,expedition:level,planeIndex:1,stage:'choice',freeBuild:true,offers:[],selected:null,wave:0,history:[],rooms:[],rewardPending:null,families:[],initialFamily:null,lastFamily:null,rerolls:0,rerollsByRealm:Array.from({length:15},()=>[0,0,0]),bossId,encounterVersion:1,dungeon:{cards,realm:null,current:0,cleared:[0],visited:[0],scouted:[],discoveredSecrets:[],...(manifest?{foundationManifest:manifest}:{})}});
  for(const k of ['routeMap','routeEdges','routePositions','routeMobCounts'])delete game[k];
  return game;
 }
 function realmMap(){return game.dungeon.cards.find(c=>c.id===game.dungeon.realm);}
 function chooseRealm(id){
  const d=game.dungeon,card=d.cards.find(c=>c.id===id);
  if(!card||d.realm||game.stage!=='choice')throw Error('Realm unavailable');
  d.realm=id;if(card.stepLimit)d.steps=card.stepLimit;d.conditionEdgesUsed=[];game.bossFamily=card.family;
  if(F&&d.foundationManifest)d.foundationState=F.createExpeditionState(d.foundationManifest,id);
 }
 // Stage 7 contracts use the Dungeon seed but never consume map or combat RNG.
 function offerContracts(learnedRecipes=[]){
  const d=game.dungeon,card=d?.cards?.find(c=>c.id===d.realm);
  if(!d?.foundationState||!card||!K||game.stage!=='choice'||game.selected||game.history.length||game.rewardPending)return null;
  if(K.decision(d.foundationState))return null;
  if(d.contractOffer)return d.contractOffer;
  d.contractOffer=K.plan(d.foundationManifest.seed,card,learnedRecipes);return d.contractOffer;
 }
 function chooseContract(id=null){
  const d=game.dungeon,o=d?.contractOffer;
  if(!o||!K?.validateOffer(game)||game.stage!=='choice'||game.selected||
    id!==null&&!o.ids.includes(id))throw Error('Contract selection unavailable');
  const action=id===null?{type:'skip_contract'}:{type:'select_contract',id};
  const rewardPlan=id===null?null:JSON.parse(JSON.stringify(o));
  d.foundationState=F.applyDecision(d.foundationState,action,d.foundationManifest);
  if(rewardPlan)d.stage72RewardPlan=rewardPlan;
  delete d.contractOffer;return id;
 }
 // Stage 7.3: Boons are found in Shrine rooms, not offered on entry or after fights.
 function offerBoons(families=[]){
  const d=game.dungeon,card=realmMap(),room=d?.current,round=card?.boonShrines?.indexOf(room)??-1;
  if(d?.boonOffer)return d.boonOffer;
  if(!d?.realm||!d.foundationState||round<0||game.stage!=='choice'||
    game.selected||game.rewardPending||d.contractOffer||!B||!d.cleared.includes(room)||
    B.resolutions(d.foundationState).some(a=>a.room===room)||d.foundationState.boonIds.length>=2)return null;
  const ids=B.offer(d.foundationManifest.seed,d.realm,round,families,d.foundationState.boonIds);
  d.boonOffer={room,round,families:[...families],ids,rerolled:false};
  return d.boonOffer;
 }
 function chooseBoon(id=null){
  const d=game.dungeon,o=d?.boonOffer;
  if(!o||game.stage!=='choice'||game.selected||game.rewardPending||
    id!==null&&!o.ids.includes(id)||d.contractOffer||!B?.validateOffer(d,game))
    throw Error('Boon Shrine selection unavailable');
  const next=F.applyDecision(d.foundationState,id===null?
    {type:'skip_boon',room:o.room}:
    {type:'choose_boon',id,room:o.room,families:o.families},d.foundationManifest);
  if(id!==null){const bonus=B.stepsAdded(id);if(bonus)d.steps+=bonus;}
  d.foundationState=next;delete d.boonOffer;
  return id;
 }
 function rerollBoon(){
  const d=game.dungeon,o=d?.boonOffer;
  if(!o||o.rerolled||game.stage!=='choice'||game.selected||game.rewardPending||d.contractOffer||!B?.validateOffer(d,game))return false;
  const next=B.rerollOffer(d.foundationManifest.seed,d.realm,o.round,o.families,d.foundationState.boonIds);
  d.foundationState=F.applyDecision(d.foundationState,{type:'reroll_boon',room:o.room},d.foundationManifest);
  o.ids=next;o.rerolled=true;return true;
 }
 // Potion discoveries must use the same replayable ledger as Oracle scouting.
 function scoutPotion(kind,mode='shrine'){
  const d=game.dungeon,card=realmMap();
  if(!d?.realm||!card||game.stage!=='choice'||game.selected||game.rewardPending||d.boonOffer||d.contractOffer||
     !['scout','veilsight'].includes(kind)||!['shrine','treasure','threat'].includes(mode))return null;
  const pathTo=target=>{
   const queue=[[d.current]],seen=new Set([d.current]);
   for(const path of queue){
    if(path.at(-1)===target)return path;
    for(const other of I.neighbors(card,d,path.at(-1)))if(!seen.has(other)){
     seen.add(other);queue.push([...path,other]);
    }
   }
   return [];
  };
  const unknown=i=>!d.visited.includes(i)&&!d.scouted.includes(i);
  const candidates=kind==='veilsight'||mode==='shrine'?card.boonShrines:
   card.nodes.map((node,i)=>(mode==='treasure'&&node.event==='forgotten_arsenal'||mode==='threat'&&['elite','boss'].includes(node.kind))?i:-1).filter(i=>i>=0);
  const targets=candidates.filter(unknown).map(i=>({id:i,path:pathTo(i)})).filter(x=>x.path.length>0)
    .sort((a,b)=>a.path.length-b.path.length||a.id-b.id);
  if(!targets.length)return null;
  const destinations=kind==='veilsight'?targets:targets.slice(0,1);
  const reveals=new Set();
  for(const item of destinations)for(const room of item.path.slice(1))if(unknown(room))reveals.add(room);
  if(!reveals.size)return null;
  for(const room of reveals){
   d.scouted.push(room);
   d.foundationState=F.applyDecision(d.foundationState,{type:'reveal_room',room},d.foundationManifest);
  }
  return {rooms:[...reveals],shrines:destinations.map(x=>x.id)};
 }
 function travelPath(target){
  const d=game.dungeon,card=realmMap();
  if(I)return I.route(card,d,target);
  const paths=[[d.current]],seen=new Set([d.current]);
  for(const path of paths){
   const last=path[path.length-1];if(last===target)return path;
   if(!d.visited.includes(last))continue;
   for(const [a,b] of card.edges){
    if(a===card.shortcut&&b===a+1&&!d.visited.includes(b))continue;
    const next=a===last?b:b===last?a:null;
    if(next!==null&&!seen.has(next)){seen.add(next);paths.push([...path,next]);}
   }
  }
  return [];
 }
 function exitCount(id){return I?I.exitCount(realmMap(),game.dungeon,id):0;}
 function scoutPreview(amount=2){
  if(!I||!game.dungeon?.realm)return {rooms:[],secret:null};
  const d=game.dungeon,origin=game.selected?.node??d.current;
  return I.scout(realmMap(),{...d,current:origin},amount);
 }
 function scoutRooms(amount=2){
  const d=game.dungeon;
  if(!d?.realm||d.boonOffer||d.contractOffer||!I||!['choice','combat'].includes(game.stage))return {rooms:[],secret:null};
  const selection=scoutPreview(amount);d.scouted??=[];d.discoveredSecrets??=[];
  for(const room of selection.rooms)if(!d.scouted.includes(room)){
   d.scouted.push(room);
   if(F&&d.foundationManifest&&d.foundationState&&!d.foundationState.knownRooms.includes(room))d.foundationState=F.applyDecision(d.foundationState,{type:'reveal_room',room},d.foundationManifest);
  }
  if(selection.secret&&!d.discoveredSecrets.includes(selection.secret)){
   d.discoveredSecrets.push(selection.secret);
   if(F&&d.foundationManifest&&d.foundationState)d.foundationState=F.applyDecision(d.foundationState,{type:'discover_secret',edgeId:selection.secret},d.foundationManifest);
  }
  return selection;
 }
 function deferEvent(){
  const d=game.dungeon,p=game.selected;
  if(!d||game.stage!=='combat'||!p?.event)return false;
  d.current=p.node;if(!d.visited.includes(p.node))d.visited.push(p.node);
  game.stage='choice';game.wave=0;game.offers=[];game.selected=null;return true;
 }
 function travelCost(path){if(I&&game.dungeon){const base=I.travelCost(path,game.dungeon.cleared),card=realmMap();return base+(C&&card?C.travelSurcharge(card,game.dungeon,path):0);}const d=game.dungeon;let cost=0,cleared=0;for(const room of path.slice(1)){if(d.cleared.includes(room))cleared++;else{cost+=Math.min(2,cleared)+1;cleared=0;}}return cost+Math.min(2,cleared);}
 function visitRoom(i,families=[]){
  const d=game.dungeon,card=realmMap(),path=travelPath(i);
  if(game.stage!=='choice'||!path.length||game.rewardPending||d.boonOffer||d.contractOffer)return false;
  const cost=travelCost(path);
  if(d.steps!==undefined){if(cost>d.steps)return false;d.steps-=cost;}
  if(C)C.markTraversed(card,d,path);
  if(!Array.isArray(d.traversedEdges))d.traversedEdges=[];
  for(let j=1;j<path.length;j++){const a=Math.min(path[j-1],path[j]),b=Math.max(path[j-1],path[j]),id=a+'-'+b;if(!d.traversedEdges.includes(id))d.traversedEdges.push(id);}
  if(d.cleared.includes(i)){d.current=i;return true;}
  if(path.length>1)d.current=path[path.length-2];
  const n=card.nodes[i],boss=n.kind==='boss';
  if(n.kind==='shrine'){
   d.current=i;d.visited.push(i);d.cleared.push(i);
   game.history.push({plane:game.planeIndex,id:card.id,name:card.name,family:card.family,image:card.image,
     node:i,waves:0,boss:false,elite:false,event:'boon_shrine',mobCount:0,escorts:0,risk:card.risk});
   if(!offerBoons(families)&&d.foundationState.boonIds.length<2)
     throw Error('Boon Shrine offer could not be generated');
   return true;
  }
  const p={id:card.id,family:card.family,image:card.image,name:card.name,node:i,waves:n.event?0:1,boss,elite:boss||n.kind==='elite',event:n.event,mobCount:n.count,escorts:n.escorts,risk:card.risk,...(n.traitId?{traitId:n.traitId}:{})};
  game.planeIndex=boss?15:game.history.length+(game.history.length>=14?2:1);game.offers=[p];game.selected=p;return true;
 }
 function planAffinities(plan){
  if(!['camp','finished','failed'].includes(game.stage))throw Error('Affinity plan can only change between Expeditions');
  if(plan===null){game.affinityPlan=null;game.affinityPlanSeen=[false,false,false];return null;}
  if(!Array.isArray(plan)||plan.length!==3||new Set(plan).size!==3||!plan.every(f=>FAMILIES.includes(f)))throw Error('Affinity plan must contain three distinct affinities');
  game.affinityPlan=[...plan];game.affinityPlanSeen=[false,false,false];return game.affinityPlan;
 }
 function chooseInitial(family){
  if(game.freeBuild||game.stage!=='choice'||game.initialFamily||!FAMILIES.includes(family))throw Error('Initial affinity unavailable');
  if(!game.freeBuild&&game.affinityPlan&&family!==game.affinityPlan[0])throw Error('Initial affinity must match the plan');
  game.initialFamily=family;game.families.push(family);offerRealms();return family;
 }
 function reroll(index){
  if(game.stage!=='choice'||(!game.freeBuild&&!game.initialFamily)||game.rewardPending||!Number.isInteger(index)||index<0||index>2||(game.version===2?(game.rerolls<=0||game.planeIndex===15):game.rerollsByRealm[game.planeIndex-1][index]<=0))throw Error('No Realm rerolls remaining');
  const other=game.offers.filter((_,i)=>i!==index),old=game.offers[index];
  if(!old||!reachable(old))throw Error('Realm is not connected');
  // Keep all other cards and their counters intact. Guarantee the initial route even after rerolling it.
  const mustInitial=!game.freeBuild&&game.history.length===0&&!other.some(o=>o.family===game.initialFamily);
  const used=[...other.map(o=>o.id),old.id];
  const candidates=allowed().filter(f=>(!mustInitial||f===game.initialFamily)&&expeditionThemes.some(t=>t.family===f&&!used.includes(t.id)));
  if(!candidates.length)throw Error('No eligible replacement Realm');
  if(game.version===2)game.rerolls--;else game.rerollsByRealm[game.planeIndex-1][index]--;
  game.offers[index]=makeOffer(candidates[Math.floor(routeRng()*candidates.length)],used,game.routeMap?old.lane:null);
  if(game.selected===old)game.selected=null;
  return game.offers[index];
 }
 function reachable(realm){const previous=game.history[game.history.length-1];return !game.routeMap||!previous||(game.routeEdges?game.routeEdges[game.planeIndex-2][previous.lane].includes(realm.lane):game.planeIndex===15||Math.abs(previous.lane-realm.lane)<=1);}
 function select(id){
  if(game.stage!=='choice'||(!game.freeBuild&&!game.initialFamily)||game.rewardPending)throw Error('Realm not available');
  const realm=game.offers.find(p=>p.id===id);
  if(!realm||!reachable(realm))throw Error('Not a reachable Realm');
  if(!allowed().includes(realm.family))throw Error('Affinity choice no longer eligible');
  game.selected=realm;return realm;
 }
 function enter(){
  if(game.stage!=='choice'||game.rewardPending||game.dungeon?.boonOffer||game.dungeon?.contractOffer||!game.selected||!game.offers.includes(game.selected))throw Error('Select an offered Realm before entering');
  const realm=game.selected;
  if(!reachable(realm)||!allowed().includes(realm.family))throw Error('Realm no longer eligible');
  if(!game.freeBuild&&game.planeIndex!==15&&!game.families.includes(realm.family))game.families.push(realm.family);
  game.lastFamily=realm.family;game.wave=1;game.stage='combat';return realm;
 }
 function claimReward(){
  if(game.stage!=='choice'||!game.rewardPending)throw Error('No Realm passive pending');
  game.rewardPending=null;if(!game.dungeon)offerRealms();return game.offers;
 }
 function waveWon(){
  if(game.stage!=='combat'||!game.selected||game.selected.eventId)throw Error('No active combat wave');
  if(game.dungeon){
   if(P)P.markElite(game);
   game.dungeon.current=game.selected.node;game.dungeon.cleared.push(game.selected.node);if(!game.dungeon.visited.includes(game.selected.node))game.dungeon.visited.push(game.selected.node);
  }
  game.history.push({plane:game.planeIndex,...game.selected});
  if(game.selected.boss){
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
  if(game.dungeon?.boonOffer){
   const d=game.dungeon,o=d.boonOffer;
   d.foundationState=F.applyDecision(d.foundationState,{type:'skip_boon',room:o.room},d.foundationManifest);
   delete d.boonOffer;
  }
  game.stage='failed';game.selected=null;game.offers=[];game.wave=0;game.families=[];game.lastFamily=null;game.rewardPending=null;
 }
 function validateDungeonCheckpoint(g){
  const d=g.dungeon,integer=(n,min,max)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
  const unique=a=>Array.isArray(a)&&new Set(a).size===a.length;
  const roomList=(a,size)=>unique(a)&&a.every(i=>integer(i,0,size-1));
  if(!g.freeBuild||g.encounterVersion!==1||!integer(g.expedition,1,Number.MAX_SAFE_INTEGER)||!integer(g.unlocked,g.expedition,Number.MAX_SAFE_INTEGER)||
    !['choice','combat','finished','failed'].includes(g.stage)||!Array.isArray(g.offers)||!Array.isArray(g.history)||!Array.isArray(d.cards)||d.cards.length!==3||
    !integer(d.current,0,21)||!unique(d.cleared)||!unique(d.visited)||!unique(d.scouted)||!unique(d.discoveredSecrets))throw Error('Invalid dungeon checkpoint');
  for(let risk=0;risk<3;risk++){
   const c=d.cards[risk],size=18+risk*2;
   if(!c||c.risk!==risk||REALMS[c.id]?.[0]!==c.family||!Array.isArray(c.nodes)||c.nodes.length!==size||
      !Array.isArray(c.edges)||!Array.isArray(c.positions)||c.positions.length!==size||
      c.nodes[0]?.kind!=='entrance'||c.nodes[size-1]?.kind!=='boss'||c.stepLimit!==14-risk||
      !integer(c.objective,1,size-2)||c.nodes[c.objective]?.kind!=='elite'||
      !integer(c.reliquaryRoom,5,12)||c.nodes[c.reliquaryRoom]?.event!=='forgotten_reliquary'||
      !integer(c.shortcut,0,size-2)||!integer(c.clueRoom,0,size-1)||
      c.edges.some(edge=>!Array.isArray(edge)||edge.length!==2||!integer(edge[0],0,size-1)||!integer(edge[1],0,size-1)||edge[0]===edge[1])||
      !unique(c.edges.map(([a,b])=>Math.min(a,b)+'-'+Math.max(a,b)))||
      c.nodes.some(n=>!n||!['entrance','combat','elite','event','spring','boss','shrine'].includes(n.kind)||n.traitId!==undefined&&(!T?.get(n.traitId)||n.kind!=='combat'))||
      c.positions.some(v=>!Array.isArray(v)||v.length!==2||v.some(x=>!Number.isFinite(x))))throw Error('Invalid dungeon map topology');
  }
  const selectedCard=d.cards.find(c=>c.id===d.realm),size=selectedCard?.nodes?.length;
  const manifest=d.foundationManifest;
  if(!F||!manifest||!integer(manifest.seed,0,0xffffffff)||manifest.expeditionLevel!==g.expedition||
    !Array.isArray(manifest.cards)||manifest.cards.length!==3||
    !BOSSES.some(b=>b.style===manifest.bossStyle&&b.id===g.bossId)||
    manifest.cards.some((v,i)=>v.realmId!==d.cards[i].id||v.family!==d.cards[i].family||v.risk!==i||
     !F.lookup('conditions',v.conditionId)?.families.includes(v.family)||
     !Array.isArray(v.bossModifierIds)||v.bossModifierIds.length!==i+1||new Set(v.bossModifierIds).size!==v.bossModifierIds.length||
     v.bossModifierIds.some(id=>!F.lookup('bossModifiers',id))||
     F.lookup('conditions',v.conditionId).conflicts?.some(id=>v.bossModifierIds.includes(id))||
     v.bossStyle!==bossForAffinity(v.family).style||v.bossModifierIds.some(id=>F.lookup('bossModifiers',id).conflicts?.includes(v.conditionId)||F.lookup('bossModifiers',id).excludeBossStyles?.includes(v.bossStyle)))||
    new Set(manifest.cards.map(c=>c.conditionId)).size!==3)throw Error('Invalid dungeon manifest');
  if(!B||d.cards.some(card=>!B.validateTopology(card,manifest.seed)))throw Error('Invalid deterministic Boon Shrines');
  const expectedManifest=F.createManifest(d.cards,{seed:manifest.seed,expeditionLevel:g.expedition,bossStyle:manifest.bossStyle});
  if(JSON.stringify(expectedManifest)!==JSON.stringify(manifest))throw Error('Invalid deterministic dungeon manifest');
  if(d.realm===null){
   if(d.current!==0||d.steps!==undefined||d.conditionEdgesUsed!==undefined||d.traversedEdges!==undefined||d.foundationState!==undefined||d.boonOffer!==undefined||d.contractOffer!==undefined||d.stage72RewardPlan!==undefined||d.stage7RewardPaid!==undefined||d.disabledBossModifierId!==undefined||
      d.visited.length!==1||d.visited[0]!==0||d.cleared.length!==1||d.cleared[0]!==0||d.scouted.length||d.discoveredSecrets.length||g.selected!==null||g.offers.length)throw Error('Invalid unselected dungeon');
  }else{
   if(!integer(d.steps,0,selectedCard.stepLimit+(d.foundationState?.boonIds?.includes('wayfarers_bargain')?1:0))||!B?.validateOffer(d,g)||!K?.validate(g)||!C?.validLedger(selectedCard,d)||!roomList(d.visited,size)||!roomList(d.cleared,size)||!roomList(d.scouted,size)||
      !d.visited.includes(d.current)||!d.cleared.includes(0)||!d.visited.includes(0)||d.cleared.some(i=>!d.visited.includes(i)))throw Error('Invalid dungeon progress');
   if(d.traversedEdges!==undefined&&(!unique(d.traversedEdges)||d.traversedEdges.some(e=>typeof e!=='string'||!selectedCard.edges.some(([a,b])=>e===Math.min(a,b)+'-'+Math.max(a,b)))))throw Error('Invalid traversed passages');
   if(!unique(d.discoveredSecrets)||d.discoveredSecrets.some(e=>typeof e!=='string'||!selectedCard.edges.some(([a,b])=>e===Math.min(a,b)+'-'+Math.max(a,b)&&I?.secretEdge(selectedCard,a,b))))throw Error('Invalid hidden passage state');
   if(!F||!d.foundationManifest||!d.foundationState||!F.validateExpeditionState(d.foundationState,d.foundationManifest)||
      d.foundationState.realmId!==d.realm||d.foundationState.seed!==d.foundationManifest.seed||
      d.foundationManifest.expeditionLevel!==g.expedition||d.foundationManifest.cards.length!==3||
      d.foundationManifest.cards.some((v,i)=>v.realmId!==d.cards[i].id||v.family!==d.cards[i].family||v.risk!==i||
      v.conditionId!==d.foundationState.conditionId&&v.realmId===d.realm||
      !F.lookup('conditions',v.conditionId)?.families.includes(v.family)||
      !Array.isArray(v.bossModifierIds)||v.bossModifierIds.length!==i+1||new Set(v.bossModifierIds).size!==v.bossModifierIds.length||
      v.bossModifierIds.some(id=>!F.lookup('bossModifiers',id))||v.bossStyle!==bossForAffinity(v.family).style||v.bossModifierIds.some(id=>F.lookup('bossModifiers',id).excludeBossStyles?.includes(v.bossStyle)))||
      !BOSSES.some(b=>b.style===d.foundationManifest.bossStyle&&b.id===g.bossId))throw Error('Invalid dungeon manifest');
   if(!d.foundationState.decisions.every((x,i)=>x?.seq===i)||
     !roomList(d.foundationState.knownRooms,size)||
     JSON.stringify(d.scouted)!==JSON.stringify(d.foundationState.knownRooms.slice(1).filter(i=>!d.visited.includes(i)||d.scouted.includes(i)))||
     JSON.stringify(d.discoveredSecrets)!==JSON.stringify(d.foundationState.discoveredSecrets))throw Error('Invalid dungeon scouting ledger');
   let replay;
   try{replay=F.replayDecisions(d.foundationManifest,d.realm,d.foundationState.decisions.map(({seq,...action})=>action));}catch{throw Error('Invalid dungeon decision history');}
   if(JSON.stringify(replay)!==JSON.stringify(d.foundationState))throw Error('Invalid dungeon decision history');
   if((d.foundationState.bossPreparation.reliquary&&d.disabledBossModifierId!==d.foundationState.bossModifierIds[0])||
     (!d.foundationState.bossPreparation.reliquary&&d.disabledBossModifierId!==undefined)||
     (d.foundationState.bossPreparation.markedElite&&!d.cleared.includes(selectedCard.objective)))throw Error('Invalid dungeon boss preparation');
  }
  if(!Array.isArray(g.offers)||g.offers.length>1||g.offers.some(p=>!selectedCard||!integer(p.node,0,size-1)))throw Error('Invalid dungeon offers');
  if(g.selected!==null){
   const p=g.selected,node=selectedCard?.nodes[p?.node];
   if(!node||g.offers.length!==1||g.offers[0].node!==p.node||p.id!==selectedCard.id||
     p.boss!==(node.kind==='boss')||p.elite!==(node.kind==='boss'||node.kind==='elite')||p.event!==(node.event||null))throw Error('Invalid dungeon selection');
  }else if(g.offers.length)throw Error('Invalid dungeon selection');
  if(g.stage==='combat'&&!g.selected)throw Error('Invalid dungeon combat');
  if(['finished','failed'].includes(g.stage)&&(g.selected!==null||g.offers.length))throw Error('Invalid terminal dungeon state');
  if(g.stage==='finished'&&(!selectedCard||!d.cleared.includes(size-1)))throw Error('Invalid dungeon completion');
 }
 function restore(input){
  if(input?.version!==2)throw Error('Unsupported historical Expedition checkpoint (requires calendar version 2)');
  const g=JSON.parse(JSON.stringify(input));
  if(g.dungeon){validateDungeonCheckpoint(g);Object.assign(game,g);if(g.selected)game.selected=game.offers.find(p=>p.node===g.selected.node);return game;}
  delete game.dungeon;
  if(!FAMILIES.includes(g.bossFamily)||g.encounterVersion!==1)throw Error('Invalid encounter version');
  g.affinityPlan??=null;g.affinityPlanSeen??=[false,false,false];
  const integer=(v,min,max)=>Number.isInteger(v)&&v>=min&&v<=max;
  if(!g||!integer(g.unlocked,1,Number.MAX_SAFE_INTEGER)||!integer(g.expedition,1,g.unlocked)||!integer(g.planeIndex,1,15)||!['choice','combat','finished','failed'].includes(g.stage)||!Array.isArray(g.rooms)||g.rooms.length!==15||g.rooms[0]!=='combat'||g.rooms[14]!=='boss'||g.rooms.slice(0,14).some(k=>!(g.version===2?['combat','elite','event']:ROOMS).includes(k)))throw Error('Invalid Realm checkpoint');
  if(g.version===2){if(!integer(g.rerolls,0,3)||!BOSSES.some(b=>b.id===g.bossId)||!Array.isArray(g.eventsByRealm)||g.eventsByRealm.length!==15||g.rooms.filter(k=>k==='event').length<3||g.rooms.filter(k=>k==='event').length>4||g.rooms.filter(k=>k==='elite').length!==2)throw Error('Invalid integration schedule');const ids=g.eventsByRealm.filter(Boolean),groups=ids.map(id=>EVENT_GROUPS.findIndex(group=>group.includes(id)));if(new Set(ids).size!==ids.length||new Set(groups).size!==groups.length||groups.includes(-1)||g.eventsByRealm.some((id,i)=>(g.rooms[i]==='event')!==!!id))throw Error('Invalid event schedule');}
  if(g.routeMap!==undefined&&(!Array.isArray(g.routeMap)||g.routeMap.length!==15||g.routeMap.some((row,i)=>!Array.isArray(row)||row.length!==(i===14?1:3)||row.some(k=>k!==g.rooms[i]&&!(i>0&&g.rooms[i]==='combat'&&k==='elite')&&!(g.freeBuild&&g.rooms[i]==='event'&&k==='combat')))))throw Error('Invalid route map');
  if(g.routeMap===undefined){delete g.routeMobCounts;delete g.routeMobVersion;for(const p of [...(g.offers||[]),...(g.history||[]),...(g.selected?[g.selected]:[]),...(g.rewardPending?[g.rewardPending]:[])])delete p.mobCount;}
  if(g.routeEdges!==undefined&&(!g.routeMap||!Array.isArray(g.routeEdges)||g.routeEdges.length!==14||g.routeEdges.some((row,i)=>!Array.isArray(row)||row.length!==3||row.some((links,lane)=>!Array.isArray(links)||!links.length||new Set(links).size!==links.length||links.some(n=>!integer(n,0,i===13?0:2)||(i<13&&Math.abs(lane-n)>1))))))throw Error('Invalid route connections');
  if(g.routePositions!==undefined&&(!g.routeMap||!Array.isArray(g.routePositions)||g.routePositions.length!==15||g.routePositions.some((row,i)=>!Array.isArray(row)||row.length!==g.routeMap[i].length||row.some(x=>!integer(x,1,299)))))throw Error('Invalid route positions');
  if(!g.routeMap||!g.routeMobCounts)throw Error('Current route format required');
  if(g.routeMobCounts!==undefined&&(!g.routeMap||g.routeMobVersion!==undefined&&g.routeMobVersion!==1||!Array.isArray(g.routeMobCounts)||g.routeMobCounts.length!==15||g.routeMobCounts.some((row,i)=>!Array.isArray(row)||row.length!==g.routeMap[i].length||row.some((n,lane)=>g.routeMap[i][lane]==='combat'?!allowedMobCount(n):n!==1))))throw Error('Invalid route mob counts');
  if(g.routeMobCounts){g.routeMobVersion=1;const updateMobCount=(p,index)=>{if(!p)return;const kind=g.routeMap[index]?.[p.lane];if(kind==='combat')p.mobCount=g.routeMobCounts[index][p.lane];else delete p.mobCount;delete p.groupSize;};
   g.offers?.forEach(p=>updateMobCount(p,g.planeIndex-1));g.history?.forEach((p,i)=>updateMobCount(p,i));if(g.selected)updateMobCount(g.selected,g.planeIndex-1);if(g.rewardPending)updateMobCount(g.rewardPending,(g.rewardPending.plane||g.planeIndex)-1);delete g.routeGroups;
  }
  if(g.version!==2&&JSON.stringify([...g.rooms.slice(0,14)].sort())!==JSON.stringify([...ROOMS].sort()))throw Error('Invalid Realm schedule');
  if(!Array.isArray(g.families)||g.families.length>3||new Set(g.families).size!==g.families.length||!g.families.every(f=>FAMILIES.includes(f))||g.initialFamily!==null&&!FAMILIES.includes(g.initialFamily))throw Error('Invalid saved affinities');
  if(g.affinityPlan!==null&&(!Array.isArray(g.affinityPlan)||g.affinityPlan.length!==3||new Set(g.affinityPlan).size!==3||!g.affinityPlan.every(f=>FAMILIES.includes(f)))||!Array.isArray(g.affinityPlanSeen)||g.affinityPlanSeen.length!==3||!g.affinityPlanSeen.every(v=>typeof v==='boolean'))throw Error('Invalid affinity plan');
  if(!Array.isArray(g.rerollsByRealm)||g.rerollsByRealm.length!==15||!g.rerollsByRealm.every(row=>Array.isArray(row)&&row.length===3&&row.every(n=>integer(n,0,3))))throw Error('Invalid Realm rerolls');
  function realm(p,index){
   const theme=(g.version===2?expeditionThemes:themes).find(t=>t.id===p?.id),kind=g.routeMap&&integer(p?.lane,0,g.routeMap[index-1].length-1)?g.routeMap[index-1][p.lane]:g.rooms[index-1];
   if(g.routeMap&&!integer(p?.lane,0,g.routeMap[index-1].length-1))throw Error('Invalid route lane');
   if(kind==='combat'&&g.routeMobCounts&&p.mobCount!==g.routeMobCounts[index-1][p.lane])throw Error('Invalid Realm mob count');
   if(p.mobCount!==undefined&&(kind!=='combat'||!allowedMobCount(p.mobCount)))throw Error('Invalid Realm mob count');
   if(g.routeMap&&(p.elite!==(kind==='elite'||kind==='boss')||(kind==='event'&&p.waves!==0)))throw Error('Invalid route encounter');
   if(!theme||(g.version===2?REALMS[p.id]?.[0]:THEME_FAMILIES[p.id])!==p.family||!integer(p.waves,g.version===2&&kind==='event'?0:1,3)||typeof p.elite!=='boolean'||p.boss!==(index===15)||p.event!==(g.version===2?(kind==='event'?g.eventsByRealm[index-1]:null):(['chest','event','altar'].includes(kind)?kind:null))||p.waves!==(kind==='event'?0:1))throw Error('Invalid saved Realm');
   return {...p,name:p.boss&&g.version===2?bossForAffinity(p.family).name:theme.name,image:theme.image};
  }
  if(!Array.isArray(g.offers)||!(g.version===2&&g.planeIndex===15?[0,1]:[0,3]).includes(g.offers.length)||new Set(g.offers.map(p=>p.id)).size!==g.offers.length )throw Error('Invalid Realm offers');
  g.offers=g.offers.map(p=>realm(p,g.planeIndex));
  if(!Array.isArray(g.history)||g.history.length>15)throw Error('Invalid Realm history');
  g.history=g.history.map((p,i)=>{if(p.plane!==i+1)throw Error('Invalid Realm history');return realm(p,i+1);});
  if(g.routeMap&&(g.history.some((p,i)=>i>0&&(g.routeEdges?!g.routeEdges[i-1][g.history[i-1].lane].includes(p.lane):i<14&&Math.abs(p.lane-g.history[i-1].lane)>1))||g.selected&&g.history.length&&(g.routeEdges?!g.routeEdges[g.planeIndex-2][g.history[g.history.length-1].lane].includes(g.selected.lane):g.planeIndex<15&&Math.abs(g.selected.lane-g.history[g.history.length-1].lane)>1)||new Set(g.offers.map(p=>p.lane)).size!==g.offers.length))throw Error('Invalid route path');
  if(g.stage==='choice'||g.stage==='combat'){
   if(g.history.length!==g.planeIndex-1||g.initialFamily&&!g.families.includes(g.initialFamily))throw Error('Invalid Realm progress');
   if(g.rewardPending)g.rewardPending=realm(g.rewardPending,g.planeIndex-1);
   if(g.stage==='combat'){
    const selected=g.offers.find(p=>p.id===g.selected?.id),bossAffinity=g.planeIndex===15&&selected?.boss&&selected.family===g.bossFamily;if(!selected||!g.freeBuild&&!g.families.includes(selected.family)&&!bossAffinity||!integer(g.wave,1,Math.max(1,selected.waves)))throw Error('Invalid combat checkpoint');g.selected=selected;
   }else{
    if(g.wave!==0||g.rewardPending&&(g.offers.length||g.selected)||!g.freeBuild&&!g.initialFamily&&g.offers.length)throw Error('Invalid choice checkpoint');
    if(g.selected){const selected=g.offers.find(p=>p.id===g.selected.id);if(!selected)throw Error('Invalid selected Realm');g.selected=selected;}
   }
  }
  if(['choice','combat'].includes(g.stage)){
   const acquired=new Set([g.initialFamily,...(g.freeBuild?[]:g.history.map(p=>p.family)),...(!g.freeBuild&&g.stage==='combat'?[g.selected.family]:[])].filter(Boolean));
   if(acquired.size!==g.families.length||!g.families.every(f=>acquired.has(f)))throw Error('Invalid affinity provenance');
   if(!g.freeBuild&&g.stage==='choice'&&g.offers.some(p=>(g.families.length===3&&!g.families.includes(p.family)) ))throw Error('Invalid affinity offer');
   if(!g.freeBuild&&g.affinityPlan&&g.initialFamily&&g.affinityPlan[0]!==g.initialFamily)throw Error('Invalid active affinity plan');
  }
  if(g.routeMap===undefined){delete game.routeMap;delete g.routeMobCounts;delete g.routeMobVersion;for(const p of [...(g.offers||[]),...(g.history||[]),...(g.selected?[g.selected]:[]),...(g.rewardPending?[g.rewardPending]:[])])delete p.mobCount;}if(g.routeEdges===undefined)delete game.routeEdges;if(g.routePositions===undefined)delete game.routePositions;if(g.routeMobCounts===undefined){delete game.routeMobCounts;delete game.routeMobVersion;}Object.assign(game,g);return game;
 }
 function influence(family){if(!allowed().includes(family))throw Error('Affinity influence unavailable');game.pathInfluence=family;}
 function setSimulationRandomStreams(route,draft){if(typeof route!=='function'||typeof draft!=='function')throw Error('Simulation RNG streams must be functions');routeRng=route;draftRng=draft;}
 function passiveRandom(){return draftRng;}
 
 return Object.freeze({deferEvent,chooseRealm,offerContracts,chooseContract,offerBoons,chooseBoon,rerollBoon,scoutPotion,realmMap,visitRoom,travelPath,travelCost,exitCount,scoutPreview,scoutRooms,influence,state:game,start,restore,planAffinities,chooseInitial:chooseInitial,select:select,enter:enter,claimReward:claimReward,reroll:reroll,waveWon:waveWon,eventWon:()=>{throw Error('Resolve the offered integrated event');},defeat:defeat,abandon:abandon,allowed:allowed,reachable,setSimulationRandomStreams,passiveRandom});
}
root.WandererV012Expedition=Object.freeze({create,FAMILIES,FAMILY_NAMES,THEME_FAMILIES,REALMS,BOSSES,bossForAffinity,EVENT_GROUPS});
})(globalThis);
