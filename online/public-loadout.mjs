export const EQUIPMENT_SLOTS=['helm','amulet','armor','gloves','weapon','offhand','ring1','ring2','boots'];
const TYPES={weapon:['Sword','Mace','Daggers','Two-Handed','Bow','Staff','Wand'],offhand:['Shield','Off-Hand Dagger','Orb','Tome','Charm']};
const EFFECTS=['poison','bleed','crit','sunder','shield','regen','burn','slow','drain'];
const FIELDS=['atk','def','hp','spd','str','agi','int','end','cha','mana','spell'];
export function cleanEquipment(input){
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Equipment is unavailable.');
 const result={};
 for(const slot of EQUIPMENT_SLOTS){
  const item=input[slot];if(!item){result[slot]=null;continue;}
  if(typeof item!=='object'||!['Common','Uncommon','Rare','Epic','Legendary'].includes(item.rarity))throw Error('Invalid equipment rarity.');
  if(TYPES[slot]&&!TYPES[slot].includes(item.subtype))throw Error('Invalid weapon type.');
  if(!Number.isInteger(item.tier)||item.tier<1||item.tier>100)throw Error('Invalid equipment level.');
  const next={slot,id:String(item.id||slot).slice(0,100),name:String(item.name||item.subtype||slot).slice(0,100),subtype:String(item.subtype||slot).slice(0,30),rarity:item.rarity,tier:item.tier,effect:EFFECTS.includes(item.effect)?item.effect:null,magic:EFFECTS.includes(item.magic)?item.magic:null};
  for(const field of FIELDS){const value=Number(item[field]||0);if(!Number.isFinite(value)||value < (field==='spd'?-10:0)||value>5000)throw Error('Invalid equipment stats.');next[field]=value;}
  result[slot]=next;
 }
 if(result.weapon?.subtype==='Two-Handed')result.offhand=null;
 return result;
}
export function publicLoadout(save){return {equipment:cleanEquipment(save.equip),maxDungeon:Math.max(1,Math.min(100,Number(save.maxDungeon)||1))};}
