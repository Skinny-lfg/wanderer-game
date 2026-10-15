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
 if(['Two-Handed','Bow','Staff'].includes(result.weapon?.subtype))result.offhand=null;
 return result;
}

const RUNE_IDS=['might','swiftness','wisdom','fortitude','fortune','fury','warding','vitality'];
export function cleanPublicRunes(input){
 const seen=new Set();
 return (Array.isArray(input)?input:[]).filter(r=>r&&typeof r.id==='string'&&r.id.length>0&&r.id.length<120&&RUNE_IDS.includes(r.family)&&Number.isInteger(r.tier)&&r.tier>=10&&r.tier<=100&&r.tier%10===0)
 .filter(r=>{if(seen.has(r.id))return false;seen.add(r.id);return true})
 .slice(0,3).map(r=>({id:r.id,family:r.family,tier:r.tier}));
}
export function cleanPublicRuneSlots(raw,runes){
 const used=new Set(),families=new Set();
 return Array.from({length:3},(_,i)=>{
  const id=Array.isArray(raw)?raw[i]:null,r=runes.find(x=>x.id===id);
  if(!r||used.has(id)||families.has(r.family))return null;
  used.add(id);families.add(r.family);return id;
 });
}
export function publicLoadout(save){
 const equippedIds=Array.isArray(save.runeSlots)?save.runeSlots.filter(Boolean):[];
 const runes=cleanPublicRunes((Array.isArray(save.runes)?save.runes:[]).filter(r=>equippedIds.includes(r.id)));
 return {equipment:cleanEquipment(save.equip),runes,runeSlots:cleanPublicRuneSlots(save.runeSlots,runes),maxDungeon:Math.max(1,Math.min(100,Number(save.maxDungeon)||1))};
}
