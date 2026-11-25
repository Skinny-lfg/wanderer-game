// Wanderer v0.13 — one native, seeded affix generator for loot, Merchant and Forge.
// Expedition scales the numeric power BUDGET; chance/speed/regeneration modifiers
// have explicit absolute caps instead of inheriting exponential tier scaling.
(function(root){'use strict';
const KEYS=Object.freeze(['atk','def','hp','spd','str','agi','int','end','cha','mana','spell','evasionRating','critBonus','blockBonus','manaRegenBonus','wardBonus']);
const PRIMARY=Object.freeze(['str','agi','int','end','cha']);
const COST=Object.freeze({atk:1,def:1.1,hp:.25,spd:3.5,str:2.2,agi:2.2,int:2.2,end:2.2,cha:2.2,mana:.25,spell:1.1,evasionRating:1.2,critBonus:6,blockBonus:6,manaRegenBonus:15,wardBonus:100});
const BUDGET=Object.freeze({Common:1,Uncommon:1.35,Rare:1.7,Epic:2.13,Legendary:2.55});
// These values are absolute bonuses, not level-scaled multipliers. Crit and
// Block bonuses are in percentage points, Ward is a fraction, Mana Regen flat.
const SECONDARY_CAPS=Object.freeze({
 critBonus:Object.freeze({Common:0,Uncommon:0.8,Rare:1.6,Epic:2.0,Legendary:2.4}),
 blockBonus:Object.freeze({Common:0,Uncommon:0.8,Rare:1.6,Epic:2.0,Legendary:2.4}),
 manaRegenBonus:Object.freeze({Common:0,Uncommon:0.35,Rare:0.7,Epic:1,Legendary:1.2}),
 wardBonus:Object.freeze({Common:0,Uncommon:0.03,Rare:0.06,Epic:0.08,Legendary:0.1}),
 spd:Object.freeze({Common:0,Uncommon:0.8,Rare:1.2,Epic:1.5,Legendary:1.8}),
 evasionRating:Object.freeze({Common:0,Uncommon:6,Rare:12,Epic:16,Legendary:20})
});
const WEIGHTED_PRIMARY=Object.freeze({
 Sword:[['str',45],['int',25],['end',20],['agi',10],['cha',8]],
 Mace:[['end',34],['str',34],['int',20],['cha',12],['agi',8]],
 Bow:[['agi',48],['str',28],['int',16],['end',8]],
 Daggers:[['agi',43],['str',20],['int',23],['cha',14]],
 'Two-Handed':[['str',46],['end',30],['int',16],['agi',8]],
 Wand:[['int',55],['cha',25],['end',20]],
 Staff:[['int',55],['cha',25],['end',20]],
 Orb:[['int',52],['cha',30],['end',18]],
 Tome:[['int',52],['cha',28],['end',20]],
 Charm:[['end',40],['cha',22],['int',23],['str',15]],
 Shield:[['end',42],['str',27],['int',22],['cha',9]],
 Ring:[['str',20],['agi',20],['int',20],['end',20],['cha',20]],
 Amulet:[['str',20],['agi',20],['int',20],['end',20],['cha',20]],
 Plate:[['str',32],['end',35],['int',20],['agi',8],['cha',5]],
 Leather:[['agi',40],['str',21],['int',20],['end',14],['cha',5]],
 Cloth:[['int',43],['end',24],['cha',16],['agi',11],['str',6]]
});
const PROFILES=Object.freeze({
 Sword:{main:'atk',attrs:WEIGHTED_PRIMARY.Sword,extras:['spell','hp','def','critBonus','spd','mana']},
 Mace:{main:'atk',attrs:WEIGHTED_PRIMARY.Mace,extras:['def','hp','spell','blockBonus','critBonus']},
 Bow:{main:'atk',attrs:WEIGHTED_PRIMARY.Bow,extras:['spd','hp','critBonus','spell']},
 Daggers:{main:'atk',attrs:WEIGHTED_PRIMARY.Daggers,extras:['spd','spell','critBonus','hp']},
 'Off-Hand Dagger':{main:'atk',attrs:WEIGHTED_PRIMARY.Daggers,extras:['spd','spell','critBonus','hp']},
 'Two-Handed':{main:'atk',attrs:WEIGHTED_PRIMARY['Two-Handed'],extras:['hp','critBonus','def','spell']},
 Wand:{main:'spell',attrs:WEIGHTED_PRIMARY.Wand,extras:['mana','manaRegenBonus','wardBonus','hp']},
 Staff:{main:'spell',attrs:WEIGHTED_PRIMARY.Staff,extras:['mana','manaRegenBonus','wardBonus','hp']},
 Orb:{main:'spell',attrs:WEIGHTED_PRIMARY.Orb,extras:['wardBonus','hp','mana','manaRegenBonus'],
  extraWeights:{wardBonus:50,hp:16,mana:10,manaRegenBonus:8}},
 Shield:{main:'def',attrs:WEIGHTED_PRIMARY.Shield,extras:['hp','blockBonus','wardBonus','spell']},
 Ring:{main:null,attrs:WEIGHTED_PRIMARY.Ring,extras:['atk','spell','def','hp','mana','critBonus','spd','blockBonus','manaRegenBonus','wardBonus']},
 Amulet:{main:null,attrs:WEIGHTED_PRIMARY.Amulet,extras:['atk','spell','def','hp','mana','critBonus','spd','blockBonus','manaRegenBonus','wardBonus']},
 Tome:{main:'mana',attrs:WEIGHTED_PRIMARY.Tome,extras:['manaRegenBonus','spell','hp'],
  extraWeights:{manaRegenBonus:55,spell:34,hp:12}},
 Charm:{main:'hp',attrs:WEIGHTED_PRIMARY.Charm,extras:['def','spell','wardBonus','mana'],
  extraWeights:{def:42,spell:30,wardBonus:14,mana:8}}
});
const ARMOR=Object.freeze({
 Plate:{main:'def',attrs:WEIGHTED_PRIMARY.Plate,extras:['hp','blockBonus','atk','spell','mana','critBonus']},
 Leather:{main:'def',attrs:WEIGHTED_PRIMARY.Leather,extras:['hp','evasionRating','spd','critBonus','atk','spell']},
 Cloth:{main:'def',attrs:WEIGHTED_PRIMARY.Cloth,extras:['hp','spell','mana','manaRegenBonus','wardBonus','atk'],extraWeights:{spell:6,mana:5,manaRegenBonus:10,wardBonus:2}}
});
const ordinaryArmor=Object.freeze({
 helm:{main:'def',attrs:WEIGHTED_PRIMARY.Plate,extras:['hp','wardBonus','spell']},
 armor:{main:'def',attrs:WEIGHTED_PRIMARY.Plate,extras:['hp','spell']},
 gloves:{main:'atk',attrs:WEIGHTED_PRIMARY.Leather,extras:['def','hp','spell','spd']},
 boots:{main:'hp',attrs:WEIGHTED_PRIMARY.Leather,extras:['def','spd','spell']},
 belt:{main:'hp',attrs:WEIGHTED_PRIMARY.Plate,extras:['def','atk','spell']}
});
const ACCESSORY_MAIN=Object.freeze([['str',14],['agi',14],['int',14],['end',14],['cha',14],['atk',7],['spell',7],['hp',7],['def',5],['mana',4]]);
function profileFor(item){return item.armorType?ARMOR[item.armorType]:PROFILES[item.subtype]||ordinaryArmor[item.slot]||PROFILES.Ring;}
function statCount(rarity,random){return rarity==='Common'?1:rarity==='Uncommon'?2:rarity==='Rare'?2+Math.floor(random()*3):rarity==='Epic'?3+Math.floor(random()*2):4+Math.floor(random()*2);}
function weighted(rows,random){
 const valid=rows.filter(([key,n])=>n>0),total=valid.reduce((n,[,w])=>n+w,0);
 if(!valid.length)throw Error('Empty item affix pool');
 let roll=random()*total;
 for(const [key,w]of valid){roll-=w;if(roll<0)return key;}
 return valid[valid.length-1][0];
}
function apply(item,basePower,random){
 if(!item||!BUDGET[item.rarity]||typeof random!=='function'||!Number.isFinite(basePower)||basePower<=0)throw Error('Invalid v0.13 item roll');
 const spec=profileFor(item);if(!spec)throw Error('Unrecognised gear profile');
 for(const field of KEYS)if(Object.hasOwn(item,field))item[field]=0;
 const number=statCount(item.rarity,random);
 const main=spec.main||weighted(item.rarity==='Common'?ACCESSORY_MAIN.filter(([key])=>!PRIMARY.includes(key)):ACCESSORY_MAIN,random),selected=[main];
 if(number>1){
  const attrs=spec.attrs.filter(([key])=>!selected.includes(key));
  if(attrs.length)selected.push(weighted(attrs,random));
 }
 while(selected.length<number){
  // Off-Hand identities need meaningful access to their unique secondary stats;
  // all other gear retains its existing 1.6-vs-primary affix weighting.
  const available=[...spec.extras.map(k=>[k,spec.extraWeights?.[k]??1.6]),...spec.attrs].filter(([key])=>!selected.includes(key) && !(key==='atk'&&['Wand','Staff'].includes(item.subtype)));
  if(!available.length)break;
  selected.push(weighted(available,random));
 }
 const total=Math.max(1,basePower*BUDGET[item.rarity]);
 const weights=selected.length===1?[1]:selected.length===2?[.56,.44]:selected.length===3?[.45,.30,.25]:selected.length===4?[.40,.23,.20,.17]:[.35,.22,.18,.14,.11];
 let overflow=0;
 for(let i=0;i<selected.length;i++){
  const key=selected[i],assigned=total*weights[i];
  const max=SECONDARY_CAPS[key]?.[item.rarity]??Infinity;
  const desired=assigned/COST[key];
  const capped=Math.min(max,desired);
  const value=SECONDARY_CAPS[key] ? Math.round(capped*100)/100 : Math.max(1,Math.round(capped));
  item[key]=(item[key]||0)+value;
  overflow+=Math.max(0,assigned-value*COST[key]);
 }
 // Stat-budget excess from fixed secondary caps goes into a scalable stat.
 // This ensures high Expedition gear still improves without generating +20% Crit.
 const fallback=PRIMARY.includes(main)?main:main==='spell'?'spell':main==='atk'?'atk':main==='def'?'def':main==='mana'?'mana':'hp';
 if(overflow>=COST[fallback])item[fallback]=(item[fallback]||0)+Math.floor(overflow/COST[fallback]);
 if(item.armorType){
  // Keep armor class identity independent of whether the roll chose Strength,
  // Intellect, or another attribute: Plate defends, Leather evades, Cloth casts.
  const factor={Cloth:.75,Leather:1,Plate:1.35}[item.armorType];
  item.def=Math.max(1,Math.round((item.def||0)*factor));
  if(item.armorType==='Leather')item.evasionRating=Math.min(SECONDARY_CAPS.evasionRating[item.rarity],(item.evasionRating||0)+Math.max(1,Math.round(basePower*.22)));
 }
 if(item.subtype==='Wand'||item.subtype==='Staff')item.atk=0;
 item.affixes=[...selected];item.v013StatCount=selected.length;
 item.v013Budget=Math.round(total*100)/100;
 item.craftingProfile=item.rarity==='Common'?null:selected.find(k=>PRIMARY.includes(k))||null;
 if(item.rarity==='Common')for(const k of PRIMARY)item[k]=0;
 return item;
}
function starter(slot,id,now=0){
 const base={id,slot,rarity:'Common',tier:1,source:'starter',startingGear:true,recoveryStarter:true,obtainedAt:now,crafted:false,locked:false};
 if(slot==='weapon')return {...base,subtype:'Sword',name:'Old Sword',atk:3};
 if(slot==='armor')return {...base,subtype:'Armor',armorType:'Cloth',name:'Worn Tunic',def:1};
 if(slot==='helm')return {...base,subtype:'Helm',armorType:'Cloth',name:'Worn Hood',hp:4};
 throw Error('Not a starter equipment slot');
}
const API=Object.freeze({KEYS,PRIMARY,COST,BUDGET,SECONDARY_CAPS,PROFILES,ARMOR,profileFor,statCount,apply,starter});
root.WandererV013GearRolls=API;
if(typeof module==='object'&&module.exports)module.exports=API;
})(globalThis);
