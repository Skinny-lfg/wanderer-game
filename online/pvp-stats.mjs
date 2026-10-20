const state={runes:[],runeSlots:[]};const PHASE1_PREVIEW=true,phase6Run=null;const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const RARITY={Common:['#aab2bc',1,1],Uncommon:['#76d69b',1.25,1.5],Rare:['#77baff',1.57,2.4],Epic:['#d0a2fa',2.1,3.9],Legendary:['#ffc36a',2.6,6]};
const ARMOR_SLOTS=['helm','armor','gloves','boots','belt'],ARMOR_TYPES=['Cloth','Leather','Plate'];
// Generated from the shared v0.12 Gear Stats module and browser equipment adapters.
const ELEMENTS={poison:{name:'Rot',icon:'☠️',color:'#80cf8a'},bleed:{name:'Bleed',icon:'🩸',color:'#ed8590'},crit:{name:'Critical',icon:'🎯',color:'#e9c480'},sunder:{name:'Sunder',icon:'🔨',color:'#d5ab81'},shield:{name:'Shield',icon:'🛡️',color:'#90bdeb'},regen:{name:'Regen',icon:'💚',color:'#89d1ac'},burn:{name:'Fire',icon:'🔥',color:'#ffa16a'},slow:{name:'Frost',icon:'❄️',color:'#8de7ff'},drain:{name:'Dark',icon:'🌑',color:'#c8a1fd'},nature:{name:'Nature',icon:'🌿',color:'#8acb75'},shock:{name:'Storm',icon:'⚡',color:'#e5c66a'},tide:{name:'Tide',icon:'🌊',color:'#78c8df'},crystal:{name:'Crystal',icon:'💎',color:'#a9b7ff'}};
const FIELDS=[['Attack','atk'],['Defense','def'],['Health','hp'],['Speed','spd'],['Strength','str'],['Agility','agi'],['Intelligence','int'],['Endurance','end'],['Charisma','cha'],['Mana','mana'],['Spell','spell'],['Evasion Rating','evasionRating']];
const isTwoHanded=o=>['Two-Handed','Bow','Staff'].includes(o?.subtype);
const statsRuneModule={};
// Wanderer v0.12 — canonical Rune definitions, reward values and validation.
// Pure module: no DOM, storage, Firebase or player-state mutation.
(function(root){'use strict';
const FAMILIES=[
 {id:'might',name:'Rune of Might',field:'str',icon:'⚔️'},
 {id:'swiftness',name:'Rune of Swiftness',field:'agi',icon:'💨'},
 {id:'wisdom',name:'Rune of Wisdom',field:'int',icon:'✨'},
 {id:'fortitude',name:'Rune of Fortitude',field:'end',icon:'🛡️'},
 {id:'fortune',name:'Rune of Fortune',field:'cha',icon:'🍀'},
 {id:'fury',name:'Rune of Fury',field:'atkFlat',icon:'🔥'},
 {id:'warding',name:'Rune of Warding',field:'defFlat',icon:'🔰'},
 {id:'vitality',name:'Rune of Vitality',field:'hpFlat',icon:'❤️'}
];
function runeValue(family,tier){const base=+(1+tier/10).toFixed(2);return family==='fury'?base*3:family==='warding'?base*2:family==='vitality'?base*10:base;}
function makeRune(family,tier,makeId,expedition=true){
 const type=FAMILIES.find(x=>x.id===family);
 return {id:makeId(),family,tier,...(expedition?{progression:'expedition'}:{}),value:runeValue(family,tier),name:type.name};
}
function validRune(r,maxTier=200,expedition=true){
 return r&&typeof r==='object'&&FAMILIES.some(x=>x.id===r.family)&&Number.isInteger(r.tier)&&r.tier>=1&&r.tier<=maxTier&&(r.progression==='expedition'&&expedition||r.tier>=10&&r.tier%10===0)&&typeof r.id==='string'&&r.id.length>0&&r.id.length<120;
}
function safeRunes(raw,maxTier=200,expedition=true){
 const seen=new Set();
 return (Array.isArray(raw)?raw:[]).filter(r=>validRune(r,maxTier,expedition)).filter(r=>{if(seen.has(r.id))return false;seen.add(r.id);return true}).slice(0,300).map(r=>({id:r.id,family:r.family,tier:r.tier,...(r.progression==='expedition'?{progression:r.progression}:{}),value:runeValue(r.family,r.tier),name:FAMILIES.find(x=>x.id===r.family).name,isNew:r.isNew===true}));
}
function safePendingRune(raw,maxTier=200,expedition=true){
 const tier=Number(raw?.tier),options=Array.isArray(raw?.options)?raw.options:[];
 if(!Number.isInteger(tier)||tier<1||tier>maxTier||!expedition&&(tier<10||tier%10!==0)||options.length!==3)return null;
 if(options.some(r=>!validRune(r,maxTier,expedition)||r.tier!==tier)||new Set(options.map(r=>r.family)).size!==3)return null;
 return {tier,options:safeRunes(options,maxTier,expedition)};
}
function runeSalvageValue(r,maxTier=200,expedition=true){
 const tier=Number(r?.tier);
 if(!Number.isInteger(tier)||tier<1||tier>maxTier||!expedition&&(tier<10||tier%10!==0))return 0;
 return 5+2*Math.floor(tier/10);
}
function duplicateRuneCandidates(runes=[],runeSlots=[],maxTier=200,expedition=true){
 const equipped=new Set(runeSlots||[]),strongest=new Map();
 for(const r of runes||[]){
  if(!runeSalvageValue(r,maxTier,expedition))continue;
  const old=strongest.get(r.family);
  if(!old||r.tier>old.tier)strongest.set(r.family,r);
 }
 return (runes||[]).filter(r=>!equipped.has(r.id)&&strongest.get(r.family)?.id!==r.id&&runeSalvageValue(r,maxTier,expedition)>0);
}
root.WandererV012Runes=Object.freeze({FAMILIES,runeValue,makeRune,validRune,safeRunes,safePendingRune,runeSalvageValue,duplicateRuneCandidates});
})(statsRuneModule);

const RUNE_FAMILIES=statsRuneModule.WandererV012Runes.FAMILIES;
const runeValue=statsRuneModule.WandererV012Runes.runeValue;
const statsModule={};
// Wanderer v0.12 — one calculation for derived character/equipment/rune stats.
// Explicit dependencies preserve the native formulas and allow isolated testing.
(function(root){'use strict';
function gearEvasionRating(item,{ARMOR_SLOTS,RARITY,clamp}){
 if(!item||item.armorType!=='Leather'||!ARMOR_SLOTS.includes(item.slot))return 0;
 if(item.evasionRating!==undefined)return Number.isFinite(Number(item.evasionRating))?Math.max(0,Number(item.evasionRating)):0;
 // Read-only compatibility for pre-hotfix Leather, including reinforced Legendaries.
 const tier=clamp(Number(item.tier)||1,1,200),base=Math.round((2+tier*.91)*(RARITY[item.rarity]?.[1]||1));
 const rank=item.rarity==='Legendary'?clamp(Number(item.upgradeRank)||0,0,10):0;
 return Math.round(base*(1+rank*.02)*100)/100;
}
function itemStatValue(item,key,context){return key==='evasionRating'?gearEvasionRating(item,context):Number(item?.[key])||0;}
function totalStats(equipment,ownedRunes,equippedRuneIds,{isTwoHanded,FIELDS,itemStatValue,RUNE_FAMILIES,runeValue,setCounts,setBonuses,state,PHASE1_PREVIEW,phase6Run}){
 const equipped=isTwoHanded(equipment.weapon)?{...equipment,offhand:null}:equipment;
 const s={str:5,agi:5,int:5,end:5,cha:5,atkFlat:0,defFlat:0,hpFlat:0,spdFlat:0,manaFlat:0,spellFlat:0,evasionRating:0};
 for(const item of Object.values(equipped))if(item)for(const [,key]of FIELDS){
 const dest={atk:'atkFlat',def:'defFlat',hp:'hpFlat',spd:'spdFlat',mana:'manaFlat',spell:'spellFlat'}[key]||key;
 s[dest]+=itemStatValue(item,key);
 }
 s.evasionRating=Math.min(Number.MAX_SAFE_INTEGER,s.evasionRating);
 const runeItems=ownedRunes===null?(typeof state==='undefined'?[]:state.runes||[]):ownedRunes;
 const runeSlots=equippedRuneIds===null?(typeof state==='undefined'?[]:state.runeSlots||[]):equippedRuneIds;
 const usedFamilies=new Set();
 for(const id of runeSlots){const rune=runeItems.find(r=>r.id===id),type=RUNE_FAMILIES.find(x=>x.id===rune?.family);if(!rune||!type||usedFamilies.has(type.id))continue;usedFamilies.add(type.id);s[type.field]+=runeValue(type.id,rune.tier)*(PHASE1_PREVIEW&&phase6Run?.effects.runeBoost?.remaining>0?1.20:1);}
 // Read-only combat projection: legacy effects remain in stored items, but are inactive.
 const main=equipped.weapon?{...equipped.weapon,effect:null,magic:null}:null,off=equipped.offhand?{...equipped.offhand,effect:null,magic:null}:null,caster=!!main&&['Staff','Wand'].includes(main.subtype);
 const counts=setCounts(equipped),sets=setBonuses(counts),speed=.78+s.agi*.032+s.spdFlat*.046;
 const weaponMult={Sword:1,Mace:.66,Bow:1.15,Daggers:1.48,'Two-Handed':.50,Staff:.69,Wand:1.20}[main?.subtype]||1;
 s.caster=caster;s.main=main;s.off=off;s.sets=sets.list;s.bonus=sets.values;s.counts=counts;
 s.maxhp=Math.round(55+s.end*12+s.hpFlat);
 s.attack=Math.round(4+s.str*1.8+s.agi*.4+s.atkFlat);
 s.defense=Math.round(1+s.end*.8+s.str*.3+s.defFlat);
 const baseSpeed=Math.max(.25,speed*weaponMult);
 // Low-speed catch-up for Staff and Two-Handed; naturally tapers as base speed grows.
 const catchUp=main?.subtype==='Staff'?Math.max(0,.56-.25*baseSpeed):main?.subtype==='Two-Handed'?Math.max(0,.43-.25*baseSpeed):0;
 const rawSpeed=baseSpeed+catchUp;s.rawAttackSpeed=rawSpeed;
 // Diminishing returns above 2.5 attacks/sec; preserve early weapon timing.
 s.attacksPerSec=rawSpeed<=2.5?rawSpeed:2.5+(rawSpeed-2.5)/(1+(rawSpeed-2.5)*.2);
 const critRating=Math.max(0,s.cha-5)/Math.sqrt(Math.max(1,main?.tier||1));
 s.crit=Math.min(55,Math.max(9,Math.round((9+41*(1-Math.exp(-critRating/25))+counts.crit*2+(sets.values.critBonus||0))/Math.sqrt(Math.max(1,s.rawAttackSpeed/1.3)))));
 s.mana=caster?Math.round(20+s.int*7+s.manaFlat):0;
 s.manaRegen=caster?+(1.5+s.int*.23).toFixed(1):0;
 s.spellPower=caster?Math.round(3+s.int*1.9+s.spellFlat):0;
 s.blockChance=off?.subtype==='Shield'?Math.min(48,Math.round(13+s.end*.27+Math.max(0,off.tier||1)*.25+(main?.subtype==='Mace'?7:0))):0;
 s.blockReduction=off?.subtype==='Shield'?(main?.subtype==='Mace'?.67:.58):0;
 // Cumulative tier estimates: 2 pieces = 12, 3 = 30, 5 = 54.
 s.synergyPower=0;
 s.power=Math.round(s.attack*2+s.defense*4+s.maxhp*.15+s.attacksPerSec*35+s.crit*1.2+s.blockChance*2+(caster?s.spellPower*1.7:0)+s.synergyPower);
 s.lootQuality=Math.min(10,Math.round(Math.max(0,s.cha-5)*.09*10)/10);
 return s;
}
root.WandererV012GearStats=Object.freeze({gearEvasionRating,itemStatValue,totalStats});
})(statsModule);

const WandererV012GearStats=statsModule.WandererV012GearStats;
function gearEvasionRating(item){return WandererV012GearStats.gearEvasionRating(item,{ARMOR_SLOTS,RARITY,clamp});}
function itemStatValue(item,key){return WandererV012GearStats.itemStatValue(item,key,{ARMOR_SLOTS,RARITY,clamp});}
function setCounts(){return Object.fromEntries(Object.keys(ELEMENTS).map(k=>[k,0]));}


function setBonuses(){return {list:[],values:{}};}
function totalStats(equipment= {},ownedRunes=null,equippedRuneIds=null){return WandererV012GearStats.totalStats(equipment,ownedRunes,equippedRuneIds,{isTwoHanded,FIELDS,itemStatValue,RUNE_FAMILIES,runeValue,setCounts,setBonuses,state,PHASE1_PREVIEW,phase6Run});}

// Keep UI location only in this tab, scoped to the active account/save.
// Never write this to the game save or sync it to Firebase.

export {totalStats};
