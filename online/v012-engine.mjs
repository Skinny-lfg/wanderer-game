// Wanderer v0.12 isolated gameplay prototype. No imports from production save/auth modules.
export const STORAGE_KEY='wanderer_v012_prototype_local_v1';
export const FAMILIES={
 blood:{name:'Blood',icon:'🩸',kind:'DoT',color:'#dc777d'},
 vitality:{name:'Vitality',icon:'💚',kind:'Health',color:'#6fd49b'},
 aegis:{name:'Aegis',icon:'🛡️',kind:'Defense',color:'#89b8e8'},
 fury:{name:'Fury',icon:'⚔️',kind:'Attack',color:'#ecad69'},
 arcane:{name:'Arcane',icon:'✦',kind:'Magic',color:'#bd9de9'}
};
export const PATHS=[
 ['temple','Venomous Temple','blood'],['forge','Blood Forge','blood'],
 ['grove','Serpent Grove','vitality'],['shrine','Lost Sanctuary','vitality'],
 ['ward','Warded Catacombs','aegis'],['drowned','Drowned Vault','aegis'],['quarry','Obsidian Quarry','aegis'],
 ['crypt','Echo Crypt','fury'],['bastion','Iron Bastion','fury'],
 ['frost','Frostbound Catacombs','arcane'],['ash','Ashen Sanctum','arcane'],
 ['void','Umbral Reliquary','arcane'],['storm','Stormglass Spire','arcane']
].map(([id,name,affinity])=>({id,name,affinity,background:'assets/dungeons/backgrounds/'+id+'.webp'}));
const P=[
 ['blood','open_wound','Open Wound','Bleed deals 20% more damage.'],['blood','deep_cuts','Deep Cuts','Deal 7% more direct damage to bleeding enemies.'],['blood','hemorrhage','Hemorrhage','Bleed builds up more reliably.'],['blood','rupture','Rupture','Bleeding enemies under 35% HP take extra damage.'],['blood','contagion','Contagion','On kill, carry half the Bleed stacks to the next wave.'],['blood','blood_pressure','Blood Pressure','Bleeding enemies deal slightly less damage.'],
 ['vitality','strong_heart','Strong Heart','Increase maximum HP by 12%.'],['vitality','renewal','Renewal','Regenerate limited HP during combat.'],['vitality','second_wind','Second Wind','Once per combat, survive a lethal blow at 15% HP.'],['vitality','vital_flow','Vital Flow','Gain 8% maximum HP.'],['vitality','herbalist','Herbalist','Health potions are 20% more effective.'],['vitality','endurance','Endurance','Take 6% less damage.'],
 ['aegis','iron_skin','Iron Skin','Increase armor by 12%.'],['aegis','first_guard','First Guard','Begin each fight with a small Barrier.'],['aegis','reactive_ward','Reactive Ward','Some damage taken creates Barrier.'],['aegis','shield_wall','Shield Wall','Reduce elite and boss damage by 9%.'],['aegis','deflect','Deflect','Chance to prevent some incoming damage.'],['aegis','riposte','Riposte','Taking damage improves your next strike.'],
 ['fury','precision','Precision','Increase critical strike chance.'],['fury','keen_edge','Keen Edge','Critical strikes deal more damage.'],['fury','momentum','Momentum','Increase attack speed.'],['fury','twin_strike','Twin Strike','Chance for a smaller extra hit.'],['fury','executioner','Executioner','Deal more damage to weakened enemies.'],['fury','battle_focus','Battle Focus','Repeated hits gradually increase damage.'],
 ['arcane','spell_focus','Spell Focus','Increase spell damage.'],['arcane','mana_spring','Mana Spring','Regenerate Mana during battle.'],['arcane','efficient_casting','Efficient Casting','Spend less Mana per cast.'],['arcane','arcane_echo','Arcane Echo','Chance to echo a spell.'],['arcane','runic_pressure','Runic Pressure','Casting strengthens your next attack.'],['arcane','arcane_reservoir','Arcane Reservoir','Increase maximum Mana.'],
 ['blood','crimson_recovery','Crimson Recovery','A portion of Bleed damage heals you.',['blood','vitality']],
 ['blood','sanguine_ward','Sanguine Ward','Bleed damage occasionally grants Barrier.',['blood','aegis']],
 ['blood','razorstorm','Razorstorm','Critical hits add an extra Bleed stack.',['blood','fury']],
 ['blood','hex_plague','Hex Plague','Spell hits extend Bleed.',['blood','arcane']],
 ['vitality','sanctuary','Sanctuary','Excess healing can become Barrier.',['vitality','aegis']],
 ['vitality','adrenal_recovery','Adrenal Recovery','Critical strikes heal a small amount.',['vitality','fury']],
 ['vitality','life_conduit','Life Conduit','Recover a little Mana when healed.',['vitality','arcane']],
 ['aegis','counterstrike','Counterstrike','Barrier absorbs damage and empowers attacks.',['aegis','fury']],
 ['aegis','runic_shield','Runic Shield','Spell casts may create Barrier.',['aegis','arcane']],
 ['fury','spellblade','Spellblade','Spell casts empower your next physical attack.',['fury','arcane']]
];
export const PASSIVES=P.map(([affinity,id,name,description,requires])=>({affinity,id,name,description,requires:requires||[]}));
const RARITY=['Common','Uncommon','Rare','Epic','Legendary'];
const BONUS={Common:1,Uncommon:1.26,Rare:1.58,Epic:2.12,Legendary:2.64};
export const SLOTS=['weapon','armor','helm','gloves','boots','amulet','ring','offhand'];
const ROOM_TYPES=['combat','combat','combat','combat','combat','combat','combat','elite','elite','chest','chest','event','event','altar'];
const AFFINITY_IDS=Object.keys(FAMILIES);
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
function rand(s){let x=s.seed|0;x^=x<<13;x^=x>>>17;x^=x<<5;s.seed=x|0;return (x>>>0)/4294967296;}
function choice(s,a){return a[Math.floor(rand(s)*a.length)];}
function shuffle(s,a){const b=[...a];for(let i=b.length-1;i>0;i--){let j=Math.floor(rand(s)*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;}
function count(run,id){return run?.passives.filter(p=>p===id).length||0;}
const has=(run,id)=>count(run,id)>0;
const names={weapon:'Weapon',armor:'Armor',helm:'Helm',gloves:'Gloves',boots:'Boots',amulet:'Amulet',ring:'Ring',offhand:'Off-hand'};
export function newProfile(seed=0x12345){return {version:1,seed:seed|0,unlocked:1,gold:0,fragments:0,nextId:2,inventory:[{id:1,slot:'weapon',name:'Training Sword',rarity:'Common',level:1,atk:7,armor:0,hp:0,mana:0,material:null,affinity:null}],equipped:{weapon:1},record:[],run:null};}
function itemRoll(profile,run,guarantee=false){
 const r=rand(run),rarity=r<(guarantee?.0:.43)?'Common':r<(guarantee?.14:.76)?'Uncommon':r<(guarantee?.61:.945)?'Rare':r<(guarantee?.92:.992)?'Epic':'Legendary';
 const slot=choice(run,SLOTS),power=BONUS[rarity]*(4+run.level*2.5),material=slot==='armor'?choice(run,['Cloth','Leather','Plate']):null;
 const atk=slot==='weapon'?Math.round(power*1.6):(['gloves','ring'].includes(slot)?Math.round(power*.35):0);
 const armor=['armor','helm','offhand','boots'].includes(slot)?Math.round(power*.8):0;
 const hp=['armor','helm','amulet','boots'].includes(slot)?Math.round(power*2.1):0;
 const mana=slot==='armor'&&material==='Cloth'?Math.round(power*2):slot==='amulet'?Math.round(power):0;
 const affinity=(rarity==='Epic'&&rand(run)<.17)||(rarity==='Legendary'&&rand(run)<.8)?choice(run,AFFINITY_IDS):null;
 const label=(material?material+' ':'')+(slot==='weapon'?choice(run,['Sword','Wand','Staff','Bow','Daggers']):names[slot]);
 return {id:profile.nextId++,slot,name:rarity+' '+label,rarity,level:run.level,atk,armor,hp,mana,material,affinity};
}
function gear(profile){return Object.values(profile.equipped).map(id=>profile.inventory.find(x=>x.id===id)).filter(Boolean);}
export function stats(profile){
 const run=profile.run,items=gear(profile);
 const armorItem=items.find(x=>x.slot==='armor');
 const material=armorItem?.material;
 let hp=68+items.reduce((a,x)=>a+x.hp,0),mana=34+items.reduce((a,x)=>a+x.mana,0),attack=5+items.reduce((a,x)=>a+x.atk,0),armor=2+items.reduce((a,x)=>a+x.armor,0);
 const f=run?.affinities||[];
 if(f.includes('vitality'))hp*=1.1;
 if(f.includes('fury'))attack*=1.10;
 if(f.includes('aegis'))armor*=1.12;
 hp*=1+.12*count(run,'strong_heart')+.08*count(run,'vital_flow');
 mana*=1+.12*count(run,'arcane_reservoir');
 armor*=1+.12*count(run,'iron_skin');
 const speed=(material==='Leather'?.90:1)*Math.pow(.94,count(run,'momentum'));
 return {hp:Math.round(hp),mana:Math.round(mana),attack,armor,speed,material,magical:!!items.some(x=>x.slot==='weapon'&&/Wand|Staff/.test(x.name))};
}
function passiveOptions(run,family){
 const unlocked=new Set(run.affinities.concat(family));
 const pool=PASSIVES.filter(p=>p.affinity===family&&p.requires.every(a=>unlocked.has(a)));
 const unseen=pool.filter(p=>!run.passives.includes(p.id));
 const selected=shuffle(run,unseen.length>=3?unseen:pool).slice(0,3);
 return selected.map(x=>x.id);
}
export function begin(profile,affinity,healthPots=2){
 if(profile.run&&!['finished'].includes(profile.run.stage))throw Error('Finish current expedition first');
 if(!FAMILIES[affinity])throw Error('Invalid affinity');
 if(!Number.isInteger(healthPots)||healthPots<0||healthPots>3)throw Error('Three potion slots available');
 const seed=(profile.seed+0x9e3779b9+profile.record.length*31337)|0;profile.seed=seed;
 const run={level:profile.unlocked,room:1,seed,initial:affinity,affinities:[affinity],passives:[],potions:{hp:healthPots,mana:3-healthPots},rerolls:3,stage:'startReward',lastPathAffinity:null,selectedPath:null,pathOffers:[],passiveOffers:[],rooms:['combat',...shuffle({seed:seed^7312},ROOM_TYPES.slice(1)),'boss'],history:[],hp:0,mp:0,barrier:0,fight:null,loot:[],result:null,log:['Expedition started.']};
 profile.run=run;const s=stats(profile);run.hp=s.hp;run.mp=s.mana;run.passiveOffers=passiveOptions(run,affinity);return profile;
}
function makePathOffers(run){
 const allowed=AFFINITY_IDS.filter(f=>run.room===1||f!==run.lastPathAffinity);
 let families;
 if(run.room===1){families=[run.initial,...shuffle(run,allowed.filter(x=>x!==run.initial)).slice(0,2)];}
 else families=shuffle(run,allowed).slice(0,3);
 run.pathOffers=families.map(f=>choice(run,PATHS.filter(p=>p.affinity===f)).id);
}
export function choosePassive(profile,id){
 const r=profile.run;if(!r||!['reward','startReward'].includes(r.stage)||!r.passiveOffers.includes(id))throw Error('Passive not offered');
 const p=PASSIVES.find(x=>x.id===id);if(!p)throw Error('Unknown passive');
 const old=stats(profile);
 if(!r.affinities.includes(p.affinity))r.affinities.push(p.affinity);
 r.passives.push(id);const fresh=stats(profile);
 r.hp=clamp(r.hp+(fresh.hp-old.hp),1,fresh.hp);r.mp=clamp(r.mp+(fresh.mana-old.mana),0,fresh.mana);
 r.log=['Learned '+p.name+'.',...r.log].slice(0,14);
 if(r.stage==='reward')r.room++;
 r.stage='path';r.passiveOffers=[];makePathOffers(r);
 return profile;
}
export function rerollPath(profile,index){
 const r=profile.run;if(!r||r.stage!=='path'||r.rerolls<=0||index<0||index>=3)throw Error('Reroll unavailable');
 if(r.room===1&&PATHS.find(p=>p.id===r.pathOffers[index]).affinity===r.initial)throw Error('Initial affinity option is guaranteed and cannot be rerolled');
 const used=new Set(r.pathOffers.map(id=>PATHS.find(p=>p.id===id).affinity));
 const available=AFFINITY_IDS.filter(f=>!used.has(f)&&(r.room===1||f!==r.lastPathAffinity));
 if(!available.length)throw Error('No other affinity available');
 const family=choice(r,available);r.pathOffers[index]=choice(r,PATHS.filter(p=>p.affinity===family)).id;r.rerolls--;
 return profile;
}
function enemyFor(r,wave,total){
 const path=PATHS.find(p=>p.id===r.selectedPath);
 const type=r.rooms[r.room-1],boss=type==='boss'&&wave===total-1,elite=type==='elite'||type==='boss';
 const strength=r.level+(r.room/15)*.95;
 const scale=boss?2.25:elite?1.55:1;
 return {name:boss?'The Wanderer Warden':elite?'Elite '+FAMILIES[path.affinity].name+' Guardian':FAMILIES[path.affinity].name+' Marauder',
 maxhp:Math.round((28+strength*23)*scale),hp:Math.round((28+strength*23)*scale),
 attack:Math.round((5+strength*3.3)*(boss?1.35:elite?1.25:1)),armor:Math.round((1+strength*1.4)*(boss?1.5:1)),interval:boss?2.3:elite?2.5:2.8,bleed:0,boss,elite};
}
function startCombat(profile){
 const r=profile.run,type=r.rooms[r.room-1],waves=type==='boss'?2:(type==='elite'?2:(rand(r)<.34?2:1));
 r.stage='combat';r.barrier=r.affinities.includes('aegis')?stats(profile).hp*.07:0;
 if(has(r,'first_guard'))r.barrier+=stats(profile).hp*.05;
 r.fight={wave:0,waves,enemy:enemyFor(r,0,waves),pt:0,et:0,dt:0,hits:0,secondWindUsed:false,counters:{bleedCarry:0},log:[]};
 r.log=['Entered '+type+' encounter.',...r.log].slice(0,14);
}
export function choosePath(profile,id){
 const r=profile.run;if(!r||r.stage!=='path'||!r.pathOffers.includes(id))throw Error('Path unavailable');
 const path=PATHS.find(p=>p.id===id);if(r.room>1&&path.affinity===r.lastPathAffinity)throw Error('Chosen affinity locked for one room');
 r.selectedPath=id;r.lastPathAffinity=path.affinity;r.history.push({room:r.room,path:id,affinity:path.affinity,type:r.rooms[r.room-1]});
 const type=r.rooms[r.room-1];
 if(['combat','elite','boss'].includes(type))startCombat(profile);
 else r.stage=type;
 return profile;
}
function loot(profile,guarantee=false){
 const r=profile.run,item=itemRoll(profile,r,guarantee);profile.inventory.push(item);r.loot.push(item);r.log=['Found '+item.name+'.',...r.log].slice(0,14);
 if(!profile.equipped[item.slot] || (item.atk+item.armor+item.hp*.1+item.mana*.1)>(()=>{let old=profile.inventory.find(x=>x.id===profile.equipped[item.slot]);return old?old.atk+old.armor+old.hp*.1+old.mana*.1:0})()*1.12)profile.equipped[item.slot]=item.id;
 return item;
}
function award(profile,guarantee=false){
 const r=profile.run,t=r.rooms[r.room-1];
 const gold=Math.round(8+r.level*4+r.room*.65+(t==='boss'?35:t==='elite'?14:0)),frag=Math.round(2+r.level*.9+(t==='boss'?12:0));
 profile.gold+=gold;profile.fragments+=frag;
 const odds=t==='boss'?1:t==='chest'?.68:t==='elite'?.38:t==='combat'?.06:t==='event'?.16:0;
 if(guarantee||rand(r)<odds)loot(profile,t==='boss');
 r.log=['+'+gold+' Gold, +'+frag+' Fragments.',...r.log].slice(0,14);
}
function completeRoom(profile){
 const r=profile.run;
 if(r.stage==='reward'||r.stage==='finished')return;
 award(profile);
 if(r.room===15){
  const before=profile.unlocked;profile.unlocked=Math.max(before,r.level+1);
  profile.record.push({level:r.level,won:true,affinities:[...r.affinities],passives:[...r.passives],gear:gear(profile).length});
  r.result='Victory! Difficulty '+profile.unlocked+' unlocked.';r.stage='finished';r.fight=null;return;
 }
 r.stage='reward';r.fight=null;r.passiveOffers=passiveOptions(r,PATHS.find(p=>p.id===r.selectedPath).affinity);
}
export function resolveRoom(profile,action='safe'){
 const r=profile.run;if(!r||!['chest','event','altar'].includes(r.stage))throw Error('Room action unavailable');
 const s=stats(profile),stage=r.stage;
 if(stage==='chest'){if(action==='treasure')loot(profile,true);else if(action==='heal')r.hp=Math.min(s.hp,r.hp+s.hp*.25);else throw Error('Invalid chest choice');}
 if(stage==='event'){if(action==='risk'){r.hp=Math.max(1,r.hp-s.hp*.17);loot(profile,true);}else if(action==='safe')r.hp=Math.min(s.hp,r.hp+s.hp*.12);else throw Error('Invalid event choice');}
 if(stage==='altar'){if(action==='heal')r.hp=Math.min(s.hp,r.hp+s.hp*.35);else if(action==='mana')r.mp=Math.min(s.mana,r.mp+s.mana*.65);else throw Error('Invalid altar choice');}
 completeRoom(profile);return profile;
}
export function usePotion(profile,kind){
 const r=profile.run;if(!r||r.stage==='finished'||!['hp','mana'].includes(kind)||r.potions[kind]<1)throw Error('Potion unavailable');
 const s=stats(profile);if(kind==='hp'){if(r.hp>=s.hp)return false;r.hp=Math.min(s.hp,r.hp+s.hp*(.30+.06*count(r,'herbalist')));}else{if(r.mp>=s.mana)return false;r.mp=Math.min(s.mana,r.mp+s.mana*.35);}
 r.potions[kind]--;return true;
}
function finishDeath(profile){
 const r=profile.run;r.stage='finished';r.result='Defeat. Permanent equipment is safe; Sigils and passives expire.';
 profile.record.push({level:r.level,won:false,affinities:[...r.affinities],passives:[...r.passives],gear:gear(profile).length});r.fight=null;
}
export function tick(profile,dt=.2){
 const r=profile.run;if(!r||r.stage!=='combat')return profile;
 if(!Number.isFinite(dt)||dt<=0||dt>1)throw Error('Invalid tick');
 const f=r.fight,s=stats(profile),e=f.enemy;
 f.pt+=dt;f.et+=dt;f.dt+=dt;
 const cast=s.magical&&r.mp>=4;
 const haste=s.speed;
 const attackInterval=1.8*haste;
 if(f.pt>=attackInterval){
  f.pt-=attackInterval;f.hits++;
  let hit=s.attack*(1+.07*count(r,'deep_cuts')*(e.bleed>0?1:0));
  if(has(r,'battle_focus'))hit*=1+Math.min(5,f.hits)*.025;
  const critChance=.08+.045*count(r,'precision');
  const crit=rand(r)<critChance;if(crit)hit*=1.5+.16*count(r,'keen_edge');
  if(e.hp/e.maxhp<.35)hit*=1+.13*count(r,'executioner')+.10*count(r,'rupture')*(e.bleed>0?1:0);
  let wasSpell=false;
  if(cast){wasSpell=true;r.mp=Math.max(0,r.mp-4/(1+.15*count(r,'efficient_casting')));hit*=1+.12*count(r,'spell_focus');if(rand(r)<.10+.07*count(r,'arcane_echo'))hit*=1.35;}
  if(r.affinities.includes('blood')&&rand(r)<.28+.09*count(r,'hemorrhage'))e.bleed=Math.min(9,e.bleed+1+(crit&&has(r,'razorstorm')?1:0));
  hit=Math.max(1,hit-e.armor*.35);e.hp-=hit;
  if(crit&&has(r,'adrenal_recovery'))r.hp=Math.min(s.hp,r.hp+s.hp*.012);
  if(wasSpell&&has(r,'runic_shield'))r.barrier=Math.min(s.hp*.35,r.barrier+s.hp*.014);
  if(rand(r)<.07*count(r,'twin_strike'))e.hp-=hit*.45;
 }
 if(e.hp>0&&f.dt>=1){
  f.dt-=1;
  if(e.bleed>0){
   const dot=Math.max(1,s.attack*.085*e.bleed*(1+.20*count(r,'open_wound')));
   e.hp-=dot;
   if(has(r,'crimson_recovery'))r.hp=Math.min(s.hp,r.hp+Math.min(s.hp*.012,dot*.12));
   if(has(r,'sanguine_ward'))r.barrier=Math.min(s.hp*.3,r.barrier+Math.min(s.hp*.01,dot*.08));
  }
  const regen=Math.min(s.hp*.006,.2*count(r,'renewal')+ (s.material==='Cloth'?0:0));
  r.hp=Math.min(s.hp,r.hp+regen);
 }
 r.mp=Math.min(s.mana,r.mp+dt*(s.material==='Cloth'?1.45:0.65)+dt*.65*count(r,'mana_spring'));
 if(e.hp<=0){
  const carry=has(r,'contagion')?Math.floor(e.bleed*.5):0;
  if(f.wave+1<f.waves){
   f.wave++;f.enemy=enemyFor(r,f.wave,f.waves);f.enemy.bleed=carry;f.pt=0;f.et=0;f.dt=0;
   r.log=['Wave '+(f.wave+1)+'/'+f.waves+' begins.',...r.log].slice(0,14);
  }else completeRoom(profile);
  return profile;
 }
 if(f.et>=e.interval){
  f.et-=e.interval;
  let dmg=Math.max(1,e.attack-s.armor*.43);
  if(has(r,'endurance'))dmg*=.94;
  if(has(r,'blood_pressure')&&e.bleed>0)dmg*=.92;
  if(e.elite&&has(r,'shield_wall'))dmg*=.91;
  if(rand(r)<.045*count(r,'deflect'))dmg*=.35;
  const absorbed=Math.min(r.barrier,dmg);r.barrier-=absorbed;dmg-=absorbed;
  r.hp-=dmg;
  if(absorbed>0&&has(r,'counterstrike'))e.hp-=Math.min(s.attack*.35,absorbed*.18);
  if(has(r,'reactive_ward'))r.barrier=Math.min(s.hp*.25,r.barrier+dmg*.08);
  if(r.hp<=0){
   if(has(r,'second_wind')&&!f.secondWindUsed){f.secondWindUsed=true;r.hp=s.hp*.15;}
   else finishDeath(profile);
  }
 }
 return profile;
}
export function abandon(profile){if(!profile.run||profile.run.stage==='finished')throw Error('No active expedition');finishDeath(profile);return profile;}
export function leaveFinished(profile){if(!profile.run||profile.run.stage!=='finished')throw Error('Expedition still running');profile.run=null;return profile;}
export function equip(profile,id){
 if(profile.run&&profile.run.stage==='combat')throw Error('Cannot change gear during combat');
 const item=profile.inventory.find(x=>x.id===id);if(!item)throw Error('Missing equipment');
 profile.equipped[item.slot]=id;return profile;
}
export function inventoryScore(profile){return gear(profile).reduce((n,x)=>n+x.atk*.85+x.armor*.8+x.hp*.1+x.mana*.1,0);}
export function stageName(profile){const r=profile.run;return !r?'Camp':r.stage;}
