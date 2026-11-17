// Wanderer v0.13 — item affixes. Pure, seeded for previews; native RNG for drops/crafting.
// v0.12 is unchanged. Item quality determines total stat BUDGET, not a fixed number of stats.
(function(root){'use strict';
const KEYS=Object.freeze(['atk','def','hp','spd','str','agi','int','end','cha','mana','spell','evasionRating','critBonus','blockBonus','manaRegenBonus','wardBonus']);
const PRIMARY=Object.freeze(['str','agi','int','end','cha']);
const COST=Object.freeze({atk:1,def:1.1,hp:.25,spd:2.4,str:2.2,agi:2.2,int:2.2,end:2.2,cha:2.2,mana:.25,spell:1.1,evasionRating:1,critBonus:2.4,blockBonus:2.4,manaRegenBonus:7,wardBonus:30});
const BUDGET=Object.freeze({Common:1,Uncommon:1.35,Rare:1.7,Epic:2.13,Legendary:2.55});
const PROFILES=Object.freeze({
 Sword:{main:'atk',attrs:['str','int','end'],extras:['hp','def','spd','critBonus','spell']},
 Mace:{main:'atk',attrs:['end','str'],extras:['hp','def','blockBonus','critBonus']},
 Bow:{main:'atk',attrs:['agi','str'],extras:['spd','hp','critBonus']},
 Daggers:{main:'atk',attrs:['agi','int','str'],extras:['spd','critBonus','hp']},
 'Off-Hand Dagger':{main:'atk',attrs:['agi','int','str'],extras:['spd','critBonus','hp']},
 'Two-Handed':{main:'atk',attrs:['str','end'],extras:['hp','critBonus','def']},
 Wand:{main:'spell',attrs:['int'],extras:['mana','manaRegenBonus','wardBonus','hp']},
 Staff:{main:'spell',attrs:['int'],extras:['mana','manaRegenBonus','wardBonus','hp']},
 Orb:{main:'spell',attrs:['int','cha'],extras:['mana','manaRegenBonus','wardBonus','hp']},
 Shield:{main:'def',attrs:['end','str'],extras:['hp','blockBonus','wardBonus']},
 Ring:{main:'hp',attrs:['str','agi','int','end','cha'],extras:['atk','spell','def','critBonus','mana','spd','manaRegenBonus','wardBonus']},
 Amulet:{main:'hp',attrs:['str','agi','int','end','cha'],extras:['atk','spell','def','critBonus','mana','spd','manaRegenBonus','wardBonus']}
});
const ARMOR=Object.freeze({
 Cloth:{main:'def',attrs:['int'],extras:['hp','spell','mana','manaRegenBonus','wardBonus']},
 Leather:{main:'def',attrs:['agi'],extras:['hp','evasionRating','spd','critBonus','atk']},
 Plate:{main:'def',attrs:['end','str'],extras:['hp','blockBonus','atk']}
});
const ordinaryArmor=Object.freeze({helm:{main:'def',attrs:['end','int','agi','str'],extras:['hp','wardBonus']},armor:{main:'def',attrs:['end','int','agi','str'],extras:['hp']},gloves:{main:'atk',attrs:['str','agi','int'],extras:['hp','def']},boots:{main:'hp',attrs:['agi','end','int'],extras:['def','spd']},belt:{main:'hp',attrs:['end','str','int','agi'],extras:['def','atk']}});
function profileFor(item){return item.armorType?ARMOR[item.armorType]:PROFILES[item.subtype]||ordinaryArmor[item.slot]||PROFILES.Ring;}
function statCount(rarity,random){return rarity==='Common'?1:rarity==='Uncommon'?2:rarity==='Rare'?2+Math.floor(random()*3):rarity==='Epic'?3+Math.floor(random()*2):4+Math.floor(random()*2);}
function choose(pool,random){return pool[Math.min(pool.length-1,Math.floor(random()*pool.length))];}
function apply(item,basePower,random){
 if(!item||!BUDGET[item.rarity]||typeof random!=='function'||!Number.isFinite(basePower)||basePower<=0)throw Error('Invalid v0.13 item roll');
 const spec=profileFor(item);if(!spec)throw Error('Unrecognised gear profile');
 const attrs=[...spec.attrs],extra=[...spec.extras];
 for(const field of KEYS)if(Object.hasOwn(item,field))item[field]=0;
 const number=statCount(item.rarity,random),selected=[spec.main];
 if(number>1){
  const attr=choose(attrs,random);
  selected.push(attr);
 }
 while(selected.length<number){
  const available=[...extra,...attrs].filter(k=>!selected.includes(k)&&!(k==='atk'&&selected.includes('spell'))&&!(k==='spell'&&selected.includes('atk')));
  if(!available.length)break;
  // Accessories can be offensive, defensive, caster or resource focused; avoid fixed CHA rolls.
  selected.push(choose(available,random));
 }
 const total=Math.max(1,basePower*BUDGET[item.rarity]);
 const weights=selected.length===1?[1]:selected.length===2?[.56,.44]:selected.length===3?[.45,.30,.25]:selected.length===4?[.40,.23,.20,.17]:[.35,.22,.18,.14,.11];
 for(let i=0;i<selected.length;i++){
  const key=selected[i],amount=total*weights[i]/COST[key];
  const value=['manaRegenBonus','wardBonus'].includes(key)?Math.round(amount*100)/100:Math.max(1,Math.round(amount));
  item[key]=(item[key]||0)+value;
 }
 if(item.subtype==='Wand'||item.subtype==='Staff')item.atk=0;
 if(item.subtype==='Orb')item.orbSpellB4=true;
 item.affixes=[...selected];item.v013StatCount=selected.length;
 item.v013Budget=Math.round(total*100)/100;
 if(item.rarity!=='Common')item.craftingProfile=selected.find(x=>PRIMARY.includes(x))||null;
 else {item.craftingProfile=null;for(const k of PRIMARY)item[k]=0;}
 return item;
}
function starter(slot,id,now=0){
 const base={id,slot,rarity:'Common',tier:1,source:'starter',startingGear:true,recoveryStarter:true,obtainedAt:now,crafted:false,locked:false};
 if(slot==='weapon')return {...base,subtype:'Sword',name:'Old Sword',atk:3};
 if(slot==='armor')return {...base,subtype:'Armor',armorType:'Cloth',name:'Worn Tunic',def:1};
 if(slot==='helm')return {...base,subtype:'Helm',armorType:'Cloth',name:'Worn Hood',hp:4};
 throw Error('Not a starter equipment slot');
}
const API=Object.freeze({KEYS,PRIMARY,COST,BUDGET,PROFILES,ARMOR,profileFor,statCount,apply,starter});
root.WandererV013GearRolls=API;
if(typeof module==='object'&&module.exports)module.exports=API;
})(globalThis);
