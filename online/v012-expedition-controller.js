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
 const game={unlocked:1,expedition:0,planeIndex:0,stage:'camp',families:[],lastFamily:null,rooms:[],offers:[],selected:null,wave:0,history:[]};
 function allowed(){
  return FAMILIES.filter(f=>(game.families.length<3||game.families.includes(f))&&(game.families.length===0||game.families.length>=2||f!==game.lastFamily));
 }
 function offerPlanes(){
  if(game.stage!=='choice')throw Error('Plane selection unavailable');
  const familyChoices=shuffle(allowed(),rng).slice(0,3);
  if(familyChoices.length!==3)throw Error('Cannot construct three eligible Plane offers');
  const kind=game.rooms[game.planeIndex-1];
  game.offers=familyChoices.map(f=>{
   const list=byFamily[f],theme=list[Math.floor(rng()*list.length)];
   const waves=kind==='boss'?3:kind==='elite'?2+Math.floor(rng()*2):1+Math.floor(rng()*3);
   return {id:theme.id,name:theme.name,image:theme.image,family:f,waves,
    elite:kind==='elite'||kind==='boss'||rng()<.2,boss:kind==='boss',
    event:['chest','event','altar'].includes(kind)?kind:null};
  });
  // Rare themes may repeat between rooms, not within one offer.
  return game.offers;
 }
 function start(level=1){
  if(!Number.isInteger(level)||level<1||level>game.unlocked)throw Error('Expedition locked');
  if(!['camp','finished','failed'].includes(game.stage))throw Error('Expedition already active');
  game.expedition=level;game.planeIndex=1;game.families=[];game.lastFamily=null;
  game.rooms=['combat',...shuffle(ROOMS.slice(1),rng),'boss'];
  game.offers=[];game.selected=null;game.wave=0;game.history=[];game.stage='choice';offerPlanes();return game;
 }
 function select(id){
  if(game.stage!=='choice')throw Error('Plane not available');
  const plane=game.offers.find(p=>p.id===id);
  if(!plane)throw Error('Not an offered Plane');
  if(!allowed().includes(plane.family))throw Error('Affinity choice no longer eligible');
  if(!game.families.includes(plane.family))game.families.push(plane.family);
  if(game.families.length>3)throw Error('Affinity cap exceeded');
  game.lastFamily=plane.family;game.selected=plane;game.wave=1;game.stage='combat';
  return plane;
 }
 function waveWon(){
  if(game.stage!=='combat'||!game.selected)throw Error('No active combat wave');
  if(game.wave<game.selected.waves){game.wave++;return {planeComplete:false,nextWave:game.wave};}
  game.history.push({plane:game.planeIndex,...game.selected});
  if(game.planeIndex===15){
   if(!game.selected.boss)throw Error('Plane 15 must contain the Expedition boss');
   game.unlocked=Math.max(game.unlocked,game.expedition+1);
   game.stage='finished';game.selected=null;game.offers=[];game.wave=0;game.families=[];game.lastFamily=null;
   return {planeComplete:true,expeditionComplete:true};
  }
  game.planeIndex++;game.stage='choice';game.selected=null;game.wave=0;offerPlanes();
  return {planeComplete:true,expeditionComplete:false,offers:game.offers};
 }
 function defeat(){
  if(game.stage!=='combat')throw Error('No active combat');
  game.stage='failed';game.selected=null;game.offers=[];game.wave=0;game.families=[];game.lastFamily=null;
 }
 return Object.freeze({state:game,start,select,waveWon,defeat,offerPlanes,allowed});
}
root.WandererV012Expedition=Object.freeze({create,FAMILIES,FAMILY_NAMES,THEME_FAMILIES});
})(globalThis);
