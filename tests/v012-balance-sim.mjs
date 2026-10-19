// Non-production exploratory Monte Carlo of the isolated v0.12 combat engine.
// Uses the game engine directly. The choices are an illustrative bot, NOT a player model.
import {newProfile,begin,choosePassive,choosePath,resolveRoom,usePotion,tick,PATHS,PASSIVES,stats} from '../online/v012-engine.mjs';
const priorities={
 strong_heart:8,iron_skin:7,renewal:6,first_guard:7,second_wind:5,
 open_wound:7,hemorrhage:8,deep_cuts:6,crimson_recovery:5,
 precision:6,twin_strike:5,battle_focus:6,momentum:6,adrenal_recovery:5,
 spell_focus:6,mana_spring:5,spellblade:5,razorstorm:5,
 deflect:3,sunder:5,shield_wall:3,rupture:5,sanguine_ward:6
};
const passivesById=new Map(PASSIVES.map(p=>[p.id,p]));
function chooseReward(r){
 const passives=r.passiveOffers;
 if(!passives?.length)throw Error('No passives available on room '+r.room+' '+r.selectedPath);
 return [...passives].sort((a,b)=>(priorities[b]||1)-(priorities[a]||1))[0];
}
function buildProfile(seed,count){
 const p=newProfile(seed);
 const slots=['armor','helm','gloves','boots','amulet','ring','offhand'];
 for(let i=0;i<Math.max(0,count-1);i++){
  const slot=slots[i],id=p.nextId++;
  p.inventory.push({id,slot,name:'Test '+slot,rarity:'Uncommon',level:1,
   atk:slot==='gloves'||slot==='ring'?3:0,armor:['armor','helm','boots','offhand'].includes(slot)?3:0,
   hp:['armor','helm','boots','amulet'].includes(slot)?10:0,
   mana:slot==='amulet'?5:0,material:slot==='armor'?'Leather':null,affinity:null});
  p.equipped[slot]=id;
 }
 return p;
}
function runSim(seed,gearCount,level,family){
 const p=buildProfile(seed,gearCount);p.unlocked=level;
 begin(p,family,2,level);
 const r=p.run;
 let ticks=0;
 for(let guard=0;guard<500&&r.stage!=='finished';guard++){
  if(r.stage==='startReward'||r.stage==='reward'){choosePassive(p,chooseReward(r));continue;}
  if(r.stage==='path'){
   // Prefer a focus on the initial family when offered, then an active family.
   const options=r.pathOffers.map(id=>PATHS.find(x=>x.id===id));
   const active=options.find(x=>x.affinity===r.initial)||options.find(x=>r.affinities.includes(x.affinity));
   choosePath(p,(active||options[0]).id);continue;
  }
  if(r.stage==='combat'){
   for(let i=0;i<1500&&r.stage==='combat';i++){
    if(r.potions.mana>0&&r.mp<stats(p).mana*.18)usePotion(p,'mana');
    tick(p,.2);ticks++;
   }
   if(r.stage==='combat')throw Error('Stuck in combat '+r.room);
   continue;
  }
  if(r.stage==='chest'){resolveRoom(p,r.hp<stats(p).hp*.45?'heal':'treasure');continue;}
  if(r.stage==='event'){resolveRoom(p,r.hp<stats(p).hp*.7?'safe':'risk');continue;}
  if(r.stage==='altar'){resolveRoom(p,r.hp<stats(p).hp*.92?'heal':'mana');continue;}
  throw Error('Unexpected stage '+r.stage);
 }
 if(r.stage!=='finished')throw Error('Expedition not finished');
 if(r.affinities.length>3)throw Error('Exceeded affinity cap');
 return {win:r.result.startsWith('Victory'),room:r.room,ticks,affinities:r.affinities.length,passives:r.passives.length,loot:r.loot.length,remaining:r.hp};
}
for(const gearCount of [1,3,5,8]){
 for(const level of [1,2,3]){
  const values=[];
  for(let i=0;i<160;i++)values.push(runSim(10001+level*100000+gearCount*1000+i,gearCount,level,['blood','vitality','aegis','fury','arcane'][i%5]));
  const wins=values.filter(x=>x.win);
  console.log(JSON.stringify({gearCount,level,runs:values.length,wins:wins.length,winPct:Math.round(wins.length/values.length*1000)/10,meanLastRoom:Math.round(values.reduce((a,x)=>a+x.room,0)/values.length*10)/10,avgLoot:Math.round(values.reduce((a,x)=>a+x.loot.length,0)/values.length*10)/10,avgAffinities:Math.round(values.reduce((a,x)=>a+x.affinities,0)/values.length*10)/10}));
 }
}
