// v0.13 item-roll budgets — preview only. v0.12 public gear rules stay unchanged.
(function(root){'use strict';
const ATTRS=['str','agi','int','end','cha'];
const KEYS=['atk','def','hp','spd','str','agi','int','end','cha','mana','spell','evasionRating','critBonus','blockBonus','manaRegenBonus','wardBonus'];
const WEIGHTS=Object.freeze({atk:1,def:1,hp:.35,spd:5,str:2.5,agi:2.5,int:2.5,end:2.5,cha:2.5,mana:.45,spell:1,evasionRating:1,critBonus:6,blockBonus:6,manaRegenBonus:7,wardBonus:25});
const BASE_POOLS=Object.freeze({
 Sword:['atk','str','int','agi','hp','critBonus'],
 Mace:['atk','end','hp','str','def','blockBonus'],
 Bow:['atk','agi','str','critBonus','spd'],
 Daggers:['atk','agi','int','str','spd','critBonus'],
 'Off-Hand Dagger':['atk','agi','int','str','critBonus','spd'],
 'Two-Handed':['atk','str','end','hp','critBonus'],
 Staff:['spell','int','mana','manaRegenBonus','wardBonus','hp'],
 Wand:['spell','int','mana','manaRegenBonus','wardBonus','hp'],
 Shield:['def','hp','end','blockBonus','str'],
 Orb:['spell','int','mana','wardBonus','manaRegenBonus'],
 Tome:['spell','int','mana','manaRegenBonus','cha'],
 Charm:['hp','cha','mana','wardBonus','spell'],
 Cloth:['def','hp','int','spell','mana','manaRegenBonus','wardBonus'],
 Leather:['def','hp','agi','evasionRating','spd','critBonus'],
 Plate:['def','hp','str','end','blockBonus'],
 Jewelry:['hp','mana','atk','spell','def','critBonus','blockBonus','manaRegenBonus','str','agi','int','end','cha','evasionRating','wardBonus']
});
const RARITY_BUDGET=Object.freeze({Common:.8,Uncommon:1.1,Rare:1.55,Epic:1.95,Legendary:2.3});
const COUNT=Object.freeze({Common:[1,1],Uncommon:[2,2],Rare:[2,3],Epic:[3,4],Legendary:[4,4]});
const PRIMARY=Object.freeze({Sword:'atk',Mace:'atk',Bow:'atk',Daggers:'atk','Off-Hand Dagger':'atk','Two-Handed':'atk',Staff:'spell',Wand:'spell',Shield:'def',Orb:'spell',Tome:'spell',Charm:'hp',Cloth:'def',Leather:'def',Plate:'def'});
function poolFor(item){
 if(item.slot==='ring1'||item.slot==='ring2'||item.slot==='amulet')return BASE_POOLS.Jewelry;
 if(item.armorType&&BASE_POOLS[item.armorType])return BASE_POOLS[item.armorType];
 return BASE_POOLS[item.subtype]||['def','hp','end','mana','critBonus'];
}
function budget(item,referenceLevel,tierFactor=1){
 const level=Math.max(1,Number(referenceLevel)||1),power=2+level*.9;
 const weight=(item.slot==='weapon'&&item.subtype==='Two-Handed'?1.4:item.slot==='weapon'?1.1:item.slot==='armor'?1.15:1);
 return Math.max(2,Math.round(power*(RARITY_BUDGET[item.rarity]||.8)*Math.max(1,Number(tierFactor)||1)*weight));
}
function sample(pool,random){
 const x=Math.max(0,Math.min(.999999999,Number(random())||0));
 return pool.splice(Math.floor(x*pool.length),1)[0];
}
function roll(item,{referenceLevel=1,tierFactor=1,random=Math.random}={}){
 if(!item||!RARITY_BUDGET[item.rarity]||typeof random!=='function')throw Error('Invalid v0.13 item roll');
 const options=poolFor(item).filter(key=>item.rarity!=='Common'||!ATTRS.includes(key));
 const picked=[],primary=PRIMARY[item.armorType]||PRIMARY[item.subtype];
 const count=COUNT[item.rarity],n=count[0]+(count[1]>count[0]&&random()<.5?1:0);
 if(primary&&options.includes(primary))picked.push(primary);
 const available=options.filter(key=>!picked.includes(key));
 while(picked.length<n&&available.length)picked.push(sample(available,random));
 // No accidental 14 Attack + 12 Spell Power on a budget-limited accessory.
 // Fewer affixes receive the ENTIRE budget; they are not weaker.
 const total=budget(item,referenceLevel,tierFactor);
 distribute(item,picked,total);
 return item;
}
function distribute(item,picked,total){
 for(const key of KEYS)item[key]=0;
 for(let i=0;i<picked.length;i++){
  const key=picked[i],share=picked.length===1?1:i===0?(picked.length===2?.60:picked.length===3?.50:.40):(picked.length===2?.40:picked.length===3?.25:.20);
  const units=total*share,weight=WEIGHTS[key],value=units/weight;
  item[key]=['manaRegenBonus','wardBonus'].includes(key)?Math.max(key==='wardBonus'?.01:.1,Math.round(value*100)/100):Math.max(1,Math.round(value));
 }
 item.affixes=picked;
 item.v013RollBudget=total;
 return item;
}
// A crafting recipe specifies ONE guaranteed attribute direction, not five
// simultaneous flat bonuses. The other affixes remain random and budgeted.
function applyCraftProfile(item,profile){
 if(!item||!ATTRS.includes(profile)||!poolFor(item).includes(profile)||!item.v013RollBudget)return item;
 const picked=Array.isArray(item.affixes)?[...item.affixes]:[];
 if(!picked.length||picked.includes(profile))return item;
 const mandatory=PRIMARY[item.armorType]||PRIMARY[item.subtype];
 const replace=picked.findLastIndex(key=>key!==mandatory);
 if(replace<0)return item;
 picked[replace]=profile;
 return distribute(item,picked,item.v013RollBudget);
}
const API=Object.freeze({ATTRS,KEYS,WEIGHTS,BASE_POOLS,RARITY_BUDGET,COUNT,poolFor,budget,roll,applyCraftProfile});
root.WandererV013ItemRolls=API;
if(typeof module==='object'&&module.exports)module.exports=API;
})(globalThis);
