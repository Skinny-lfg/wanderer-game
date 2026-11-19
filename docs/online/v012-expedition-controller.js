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
 if(FAMILIES.some(f=>!expeditionThemes.some(t=>t.family===f)))throw Error('Missing themes for an affinity');
 const game={unlocked:1,expedition:0,planeIndex:0,stage:'camp',families:[],lastFamily:null,rooms:[],offers:[],selected:null,wave:0,history:[],initialFamily:null,rewardPending:null};
 let routeRng=rng,draftRng=rng;
 function start(level=1,options={}){
  if(options?.dungeon!==true)throw Error('Only the deterministic Dungeon is supported');
  return startDungeon(level,options.targetFamily);
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
    return {kind,...(kind==='combat'&&i===2?{vanguard:true}:{}),offset:Math.round((routeRng()-.5)*22),range,count,escorts:kind==='boss'?risk:kind==='elite'?Math.floor(routeRng()*(risk+1)):0,event:kind==='spring'?'restless_spring':kind==='event'?events.pop():null};
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
  shuffle(BOSSES.slice(0,3),routeRng); // Keep the active Dungeon's seeded generation sequence unchanged.
   const bossId=bossForAffinity(cards[0].family).id,seed=Math.floor(routeRng()*4294967296)>>>0;
  const manifest=F?.createManifest(cards,{seed,expeditionLevel:level,bossStyle:BOSSES.find(b=>b.id===bossId).style})||null;
  if(P&&manifest)for(const card of cards)P.planRoom(card,seed);
  if(B&&manifest)for(const card of cards)B.placeShrines(card,seed);
  if(T&&manifest)for(const card of cards)for(const {room,traitId} of T.assign(card,seed))card.nodes[room].traitId=traitId;
  Object.assign(game,{version:2,expedition:level,planeIndex:1,stage:'choice',freeBuild:true,offers:[],selected:null,wave:0,history:[],rooms:[],rewardPending:null,families:[],initialFamily:null,lastFamily:null,rerolls:0,bossId,encounterVersion:1,dungeon:{cards,realm:null,current:0,cleared:[0],visited:[0],scouted:[],discoveredSecrets:[],...(manifest?{foundationManifest:manifest}:{})}});
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
  const p={id:card.id,family:card.family,image:card.image,name:card.name,node:i,waves:n.event?0:1,boss,elite:boss||n.kind==='elite',event:n.event,mobCount:n.count,escorts:n.escorts,risk:card.risk,...(n.vanguard?{vanguard:true}:{}),...(n.traitId?{traitId:n.traitId}:{})};
  game.planeIndex=boss?15:game.history.length+(game.history.length>=14?2:1);game.offers=[p];game.selected=p;return true;
 }
 function enter(){
  if(game.stage!=='choice'||!game.dungeon?.realm||game.rewardPending||game.dungeon.boonOffer||game.dungeon.contractOffer||!game.selected||!game.offers.includes(game.selected))throw Error('Select a visited Dungeon room before entering');
  const realm=game.selected;
  if(realm.node===undefined||realm.id!==game.dungeon.realm)throw Error('Dungeon selection no longer valid');
  game.lastFamily=realm.family;game.wave=1;game.stage='combat';return realm;
 }
 function claimReward(){
  if(game.stage!=='choice'||!game.rewardPending)throw Error('No Realm passive pending');
  game.rewardPending=null;return game.offers;
 }
 function waveWon(){
  if(game.stage!=='combat'||!game.selected||game.selected.eventId)throw Error('No active combat wave');
  if(!game.dungeon)throw Error('Current Dungeon required');
  if(P)P.markElite(game);
  game.dungeon.current=game.selected.node;game.dungeon.cleared.push(game.selected.node);if(!game.dungeon.visited.includes(game.selected.node))game.dungeon.visited.push(game.selected.node);
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
      c.nodes.some(n=>!n||n.vanguard!==undefined&&(n.vanguard!==true||n.kind!=='combat')||!['entrance','combat','elite','event','spring','boss','shrine'].includes(n.kind)||n.traitId!==undefined&&(!T?.get(n.traitId)||n.kind!=='combat'))||
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
   if(!node||g.offers.length!==1||g.offers[0].node!==p.node||p.vanguard!==node.vanguard||g.offers[0].vanguard!==node.vanguard||p.id!==selectedCard.id||
     p.boss!==(node.kind==='boss')||p.elite!==(node.kind==='boss'||node.kind==='elite')||p.event!==(node.event||null))throw Error('Invalid dungeon selection');
  }else if(g.offers.length)throw Error('Invalid dungeon selection');
  if(g.stage==='combat'&&!g.selected)throw Error('Invalid dungeon combat');
  if(['finished','failed'].includes(g.stage)&&(g.selected!==null||g.offers.length))throw Error('Invalid terminal dungeon state');
  if(g.stage==='finished'&&(!selectedCard||!d.cleared.includes(size-1)))throw Error('Invalid dungeon completion');
 }
 // Clean-sheet C2: resume only the active deterministic Dungeon format.
function restore(input){
 if(input?.version!==2||!input?.dungeon)throw Error('Unsupported Expedition checkpoint: current Dungeon required');
 const g=JSON.parse(JSON.stringify(input));
 validateDungeonCheckpoint(g);
 Object.assign(game,g);
 if(g.selected)game.selected=game.offers.find(p=>p.node===g.selected.node);
 return game;
}
function setSimulationRandomStreams(route,draft){if(typeof route!=='function'||typeof draft!=='function')throw Error('Simulation RNG streams must be functions');routeRng=route;draftRng=draft;}
 function passiveRandom(){return draftRng;}
 
 return Object.freeze({deferEvent,chooseRealm,offerContracts,chooseContract,offerBoons,chooseBoon,rerollBoon,scoutPotion,realmMap,visitRoom,travelPath,travelCost,exitCount,scoutPreview,scoutRooms,state:game,start,restore,enter,claimReward,waveWon,defeat,abandon,setSimulationRandomStreams,passiveRandom});
}
root.WandererV012Expedition=Object.freeze({create,FAMILIES,FAMILY_NAMES,THEME_FAMILIES,REALMS,BOSSES,bossForAffinity});
})(globalThis);
