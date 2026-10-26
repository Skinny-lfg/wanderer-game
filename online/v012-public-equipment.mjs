/* Explicit public-only v0.12 equipment snapshot. Never serialise a cloud save,
   inventory, currencies, gear recovery, or session state into a public document. */
export const V012_PUBLIC_EQUIPMENT_VERSION='v012-equipped-1';
export const V012_PUBLIC_SLOTS=Object.freeze(['helm','amulet','armor','gloves','weapon','offhand','ring1','ring2','boots','belt']);
const RARITIES=new Set(['Common','Uncommon','Rare','Epic','Legendary']);
const ARMOR_TYPES=new Set(['Cloth','Leather','Plate']);
const AFFINITIES=new Set(['poison','bleed','crit','sunder','shield','regen','burn','slow','drain','nature','shock','tide','crystal']);
const STATS=['atk','def','hp','spd','str','agi','int','end','cha','mana','spell','evasionRating'];
const safeText=(value,max)=>typeof value==='string'?value.slice(0,max):'';
const safeId=value=>safeText(value,100).replace(/[^A-Za-z0-9_-]/g,'');
function cleanItem(value,slot){
 if(value===null||value===undefined)return null;
 if(!value||typeof value!=='object'||Array.isArray(value)||value.slot!==slot||
   !RARITIES.has(value.rarity)||!Number.isInteger(value.tier)||value.tier<1||value.tier>200)return null;
 const name=safeText(value.name,100),subtype=safeText(value.subtype,40);
 if(!name||!subtype)return null;
 const item={slot,id:safeId(value.id)||slot,name,subtype,rarity:value.rarity,tier:value.tier};
 for(const field of STATS){
  const n=value[field];
  if(typeof n==='number'&&Number.isFinite(n)&&n>=-10000&&n<=100000)item[field]=n;
 }
 if(ARMOR_TYPES.has(value.armorType)&&['helm','armor','gloves','boots','belt'].includes(slot))item.armorType=value.armorType;
 if(AFFINITIES.has(value.effect))item.effect=value.effect;
 if(AFFINITIES.has(value.magic))item.magic=value.magic;
 if(value.rarity==='Legendary'){
  const id=safeId(value.legendaryId);
  if(id)item.legendaryId=id;
  if(Number.isInteger(value.upgradeRank)&&value.upgradeRank>=0&&value.upgradeRank<=10)item.upgradeRank=value.upgradeRank;
 }
 if(value.crafted===true)item.crafted=true;
 return item;
}
export function cleanV012Equipment(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('Public equipment is unavailable.');
 const out={};
 for(const slot of V012_PUBLIC_SLOTS)out[slot]=cleanItem(raw[slot],slot);
 if(['Two-Handed','Bow','Staff'].includes(out.weapon?.subtype))out.offhand=null;
 return out;
}
const RUNE_FAMILIES=new Set(['might','swiftness','wisdom','fortitude','fortune','fury','warding','vitality']);
export function cleanV012EquippedRunes(rawRunes,rawSlots){
 const source=Array.isArray(rawRunes)?rawRunes:[];
 const slots=Array.isArray(rawSlots)?rawSlots.slice(0,3):[];
 const seenIds=new Set(),seenFamilies=new Set(),runes=[],runeSlots=[];
 for(let i=0;i<3;i++){
  const uid=slots[i];
  const rune=typeof uid==='string'?source.find(item=>item?.id===uid):null;
  if(!rune||typeof rune.id!=='string'||rune.id.length>120||seenIds.has(rune.id)||
     !RUNE_FAMILIES.has(rune.family)||seenFamilies.has(rune.family)||
     !Number.isInteger(rune.tier)||rune.tier<1||rune.tier>200){runeSlots.push(null);continue;}
  seenIds.add(rune.id);seenFamilies.add(rune.family);
  runes.push({id:rune.id,family:rune.family,tier:rune.tier,progression:'expedition'});
  runeSlots.push(rune.id);
 }
 return {runes,runeSlots};
}
export function publishableV012Equipment(save){
 if(save?.format!=='wanderer-expedition'||!save?.profile?.equip)throw Error('Invalid v0.12 public equipment source.');
 return {version:V012_PUBLIC_EQUIPMENT_VERSION,equipment:cleanV012Equipment(save.profile.equip),...cleanV012EquippedRunes(save.profile.runes,save.profile.runeSlots)};
}
export function parseV012Equipment(json){
 if(typeof json!=='string'||json.length>30000)return null;
 try{
  const payload=JSON.parse(json);
  if(!payload||payload.version!==V012_PUBLIC_EQUIPMENT_VERSION||!payload.equipment)return null;
 return {version:V012_PUBLIC_EQUIPMENT_VERSION,equipment:cleanV012Equipment(payload.equipment),...cleanV012EquippedRunes(payload.runes,payload.runeSlots)};
 }catch{return null;}
}
