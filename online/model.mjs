// Shared validation and conflict policy. No Firebase or DOM dependencies.
export const SEASON = 'test-open-1'; // Namespace only: no resets or scheduled seasons.
export const MILESTONES = [10,20,30,40,50,60,70,80,90,100];
export const CHARACTERS = [
  ['wanderer','Original Wanderer'],['ranger','Forest Wanderer'],['knight','Iron Wanderer'],
  ['spellblade','Arcane Wanderer'],['duelist','Desert Wanderer']
].map(([id,name])=>({id,name,fullBody:`assets/characters/full/${id}.webp`,avatar:`assets/characters/avatars/${id}.webp`}));
export const character = id => CHARACTERS.find(c=>c.id===id)||CHARACTERS[0];
export function nicknameKey(name){const key=String(name).trim().toLowerCase();if(!/^[a-z0-9_]{3,20}$/.test(key))throw new Error('Use 3–20 letters, numbers or underscores.');return key;}
export function validateSave(value){
  const s=typeof value==='string'?JSON.parse(value):structuredClone(value);
  if(!s||typeof s!=='object'||Array.isArray(s)||!Array.isArray(s.stash)||!s.equip||typeof s.equip!=='object'||Array.isArray(s.equip))throw new Error('This is not a valid Wanderer save.');
 const record=x=>x&&typeof x==='object'&&!Array.isArray(x);
 for(const key of ['onlineProgress','offersByLevel','merchant'])if(s[key]!=null&&!record(s[key]))throw Error('Invalid saved '+key+'.');
 if(s.onlineProgress){const p=s.onlineProgress;if(p.milestones!=null&&!record(p.milestones))throw Error('Invalid saved milestones.');for(const k of ['activeMs','deepestCleared'])if(p[k]!=null&&(!Number.isFinite(Number(p[k]))||Number(p[k])<0))throw Error('Invalid saved progress.');}
 if(s.valuables!=null&&(!Array.isArray(s.valuables)||s.valuables.some(v=>!record(v)||!Number.isFinite(Number(v.worth))||Number(v.worth)<0)))throw Error('Invalid saved valuables.');
  for(const field of ['gold','fragments'])if(!Number.isFinite(s[field])||s[field]<0)throw new Error(`Invalid ${field}.`);
  if(!Number.isInteger(s.maxDungeon)||s.maxDungeon<1||s.maxDungeon>100)throw new Error('Invalid dungeon progress.');
  if(s.run)throw new Error('Finish or extract from the expedition before switching saves.');
  if(s.stash.length>5000||Object.keys(s.equip).some(k=>!['helm','amulet','armor','gloves','weapon','offhand','ring1','ring2','boots','ring'].includes(k)))throw new Error('Invalid equipment.');
  const itemIds=new Set();
  for(const item of [...s.stash,...Object.values(s.equip).filter(Boolean)]){
    if(!item||typeof item!=='object'||typeof item.name!=='string'||typeof item.slot!=='string'||!Number.isFinite(Number(item.tier)))throw new Error('Invalid item data.');
    for(const key of ['atk','def','hp','spd','str','agi','int','end','cha','mana','spell'])if(item[key]!=null&&!Number.isFinite(Number(item[key])))throw new Error('Invalid item stats.');
    if(item.id){if(itemIds.has(item.id))throw new Error('Duplicate item identity.');itemIds.add(item.id);}
  }
  if(s.characterId&&!CHARACTERS.some(c=>c.id===s.characterId))throw new Error('Unknown character.');
  if(JSON.stringify(s).length>700000)throw new Error('Save is too large for cloud storage. Export a backup.');
  return s;
}
// Applied only when reloading a browser with a saved, unfinished expedition.
export function recoverInterruptedSave(value){
 const original=typeof value==='string'?JSON.parse(value):structuredClone(value);
 const interrupted=!!original?.run&&typeof original.run==='object'&&!Array.isArray(original.run);
 return {save:validateSave(interrupted?{...original,run:null}:original),interrupted};
}
export function summary(s){if(!s)return 'No save';return `D${s.maxDungeon} unlocked · ${s.stash.length} stored items · ${s.gold} Gold · ${s.fragments} Fragments`;}
export function syncDecision(local,remote){
  if(!remote)return 'choose-upload';
  if(!local)return 'choose-download';
  return JSON.stringify(local)===remote.payload?'identical':'choose-conflict';
}
export function cloudRecord(payload,revision){validateSave(payload);if(!Number.isInteger(revision)||revision<0)throw new Error('Invalid cloud revision.');return {payload:JSON.stringify(payload),revision:revision+1,schemaVersion:1};}
export function compareRevision(remote,expected){if((remote?.revision||0)!==expected)throw new Error('cloud-conflict');}
export function safeProgress(s){const p=s?.onlineProgress||{};return {deepestCleared:Math.max(0,Math.min(100,Number(p.deepestCleared)||Math.max(0,(s?.maxDungeon||1)-1))),activeMs:Math.max(0,Number(p.activeMs)||0),timingEligible:p.timingEligible===true,milestones:p.milestones&&typeof p.milestones==='object'?p.milestones:{}};}
