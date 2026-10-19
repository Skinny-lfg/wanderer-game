// Wanderer v0.12 Phase 1: scheduling only. NO combat, inventory, save or Firebase implementation.
// This is intentionally independent of online/v012-engine.mjs (the disposable prototype simulator).
(function(root){
'use strict';
const FAMILIES=Object.freeze(['blood','decay','vitality','aegis','fury','magic']);
const FAMILY_NAMES=Object.freeze({blood:'Blood',decay:'Decay',vitality:'Vitality',aegis:'Aegis',fury:'Fury',magic:'Magic'});
const THEME_FAMILIES=Object.freeze({
 temple:'decay',forge:'blood',crypt:'fury',bastion:'fury',frost:'magic',ash:'magic',
 void:'decay',ward:'aegis',grove:'vitality',shrine:'vitality',storm:'magic',
 drowned:'aegis',quarry:'aegis'
});
const ROOMS=Object.freeze(['combat','combat','combat','combat','combat','combat','combat','elite','elite','chest','chest','event','event','altar']);
function shuffle(values,rng){
 const arr=[...values];
 for(let i=arr.length-1;i>0;i--){const j=Math.min(i,Math.floor(rng()*(i+1)));[arr[i],arr[j]]=[arr[j],arr[i]];}
 return arr;
}
function create(themes,rng=Math.random){
 if(!Array.isArray(themes)||!themes.length||!themes.every(t=>typeof t?.id==='string'&&THEME_FAMILIES[t.id]))throw Error('Classic themes required');
 if(typeof rng!=='function')throw Error('Invalid RNG');
 const byFamily=Object.fromEntries(FAMILIES.map(f=>[f,themes.filter(t=>THEME_FAMILIES[t.id]===f)]));
 if(FAMILIES.some(f=>!byFamily[f].length))throw Error('Missing classic themes for affinity '+FAMILIES.find(f=>!byFamily[f].length));
 const game={unlocked:1,expedition:0,planeIndex:0,stage:'camp',families:[],lastFamily:null,rooms:[],offers:[],selected:null,wave:0,history:[],initialFamily:null,rewardPending:null,rerollsByRealm:[]};
 function allowed(){
  return FAMILIES.filter(f=>(game.families.length<3||game.families.includes(f))&&
   (game.history.length===0||game.families.length!==1||f!==game.initialFamily));
 }
 function makeOffer(family){
  const kind=game.rooms[game.planeIndex-1],list=byFamily[family],theme=list[Math.floor(rng()*list.length)];
  return {id:theme.id,name:theme.name,image:theme.image,family,
   waves:kind==='boss'?3:kind==='elite'?2+Math.floor(rng()*2):1+Math.floor(rng()*3),
   elite:kind==='elite'||kind==='boss'||rng()<.2,boss:kind==='boss',
   event:['chest','event','altar'].includes(kind)?kind:null};
 }
 function offerRealms(){
  if(game.stage!=='choice'||!game.initialFamily||game.rewardPending)throw Error('Realm selection unavailable');
  const choices=shuffle(allowed(),rng).slice(0,3);
  if(game.history.length===0&&!choices.includes(game.initialFamily))choices[0]=game.initialFamily;
  if(choices.length!==3)throw Error('Cannot construct three eligible Realm offers');
  game.offers=choices.map(makeOffer);return game.offers;
 }
 function start(level=1){
  if(!Number.isInteger(level)||level<1||level>game.unlocked||level>200)throw Error('Expedition locked');
  if(!['camp','finished','failed'].includes(game.stage))throw Error('Expedition already active');
  Object.assign(game,{expedition:level,planeIndex:1,families:[],lastFamily:null,initialFamily:null,
   rooms:['combat',...shuffle(ROOMS.slice(1),rng),'boss'],offers:[],selected:null,wave:0,history:[],
   rewardPending:null,rerollsByRealm:Array.from({length:15},()=>[3,3,3]),stage:'choice'});
  return game;
 }
 function chooseInitial(family){
  if(game.stage!=='choice'||game.initialFamily||!FAMILIES.includes(family))throw Error('Initial affinity unavailable');
  game.initialFamily=family;game.families.push(family);offerRealms();return family;
 }
 function reroll(index){
  if(game.stage!=='choice'||!game.initialFamily||game.rewardPending||!Number.isInteger(index)||index<0||index>2||game.rerollsByRealm[game.planeIndex-1][index]<=0)throw Error('No Realm rerolls remaining');
  const other=game.offers.filter((_,i)=>i!==index),old=game.offers[index];
  // Keep all other cards and their counters intact. Guarantee the initial route even after rerolling it.
  const mustInitial=game.history.length===0&&!other.some(o=>o.family===game.initialFamily);
  const candidates=allowed().filter(f=>!other.some(o=>o.family===f)&&(!mustInitial||f===game.initialFamily));
  if(!candidates.length)throw Error('No eligible replacement Realm');
  game.rerollsByRealm[game.planeIndex-1][index]--;
  game.offers[index]=makeOffer(candidates[Math.floor(rng()*candidates.length)]);
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
  if(game.stage!=='combat'||!game.selected)throw Error('No active combat wave');
  if(game.wave<game.selected.waves){game.wave++;return {planeComplete:false,nextWave:game.wave};}
  game.history.push({plane:game.planeIndex,...game.selected});
  if(game.planeIndex===15){
   if(!game.selected.boss)throw Error('Realm 15 must contain the Expedition boss');
   game.unlocked=Math.min(200,Math.max(game.unlocked,game.expedition+1));
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
 return Object.freeze({state:game,start,chooseInitial,select,enter,claimReward,reroll,waveWon,defeat,abandon,allowed});
}
root.WandererV012Expedition=Object.freeze({create,FAMILIES,FAMILY_NAMES,THEME_FAMILIES});
})(globalThis);
