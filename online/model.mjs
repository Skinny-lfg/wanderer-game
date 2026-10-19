// Shared validation and conflict policy. No Firebase or DOM dependencies.
// Global v0.9.2 fresh start: old season and saves remain inaccessible to new clients.
export const SEASON = 'v092-launch-1';
export const SAVE_NAMESPACE = 'v092';
export const PUBLIC_LOADOUTS = 'publicLoadoutsV092';
// Hotfix v0.9.2: combat-only timing uses a new leaderboard collection.
export const SPEEDRUN_METRIC = 'combat-v1';
export const SPEEDRUN_BOARD = 'combatSpeedruns';
export const MILESTONES = Array.from({length:20},(_,i)=>(i+1)*10);
export const CHARACTERS = [
  ['wanderer','Paladin'],['ranger','Ranger'],['knight','Warrior'],
  ['spellblade','Wizard'],['duelist','Rogue']
].map(([id,name])=>({id,name,fullBody:`assets/characters/full/${id}.webp`,avatar:`assets/characters/avatars/${id}.png`}));
export const character = id => CHARACTERS.find(c=>c.id===id)||CHARACTERS[0];
export function nicknameKey(name){const key=String(name).trim().toLowerCase();if(!/^[a-z0-9_]{3,20}$/.test(key))throw new Error('Use 3–20 letters, numbers or underscores.');return key;}
export function validateSave(value){
  const s=typeof value==='string'?JSON.parse(value):structuredClone(value);
  if(!s||typeof s!=='object'||Array.isArray(s)||!Array.isArray(s.stash)||!s.equip||typeof s.equip!=='object'||Array.isArray(s.equip))throw new Error('This is not a valid Wanderer save.');
  for(const field of ['gold','fragments'])if(!Number.isFinite(s[field])||s[field]<0)throw new Error(`Invalid ${field}.`);
  if(!Number.isInteger(s.maxDungeon)||s.maxDungeon<1||s.maxDungeon>200)throw new Error('Invalid dungeon progress.');
  if(s.run)throw new Error('Finish or extract from the expedition before switching saves.');
  if(s.stash.length>5000||Object.keys(s.equip).some(k=>!['helm','amulet','armor','gloves','weapon','offhand','ring1','ring2','boots','belt','ring'].includes(k)))throw new Error('Invalid equipment.');
  for(const item of [...s.stash,...Object.values(s.equip).filter(Boolean)]){
    if(!item||typeof item!=='object'||typeof item.name!=='string'||typeof item.slot!=='string'||!Number.isFinite(Number(item.tier)))throw new Error('Invalid item data.');
  }
  const seen=new Set();
  for(const item of [...s.stash,...Object.values(s.equip).filter(Boolean)]){
    if(item.id!==undefined){if(typeof item.id!=='string'||!item.id.trim()||seen.has(item.id))throw new Error('Duplicate or invalid item ID.');seen.add(item.id);}
    if(item.armorType!==undefined&&(!['helm','armor','gloves','boots','belt'].includes(item.slot)||!['Cloth','Leather','Plate'].includes(item.armorType)))throw new Error('Invalid armor type.');
    for(const field of ['atk','def','hp','spd','str','agi','int','end','cha','mana','spell']){
      if(item[field]!==undefined&&(item[field]===null||item[field]===''||!Number.isFinite(Number(item[field]))))throw new Error('Invalid item '+field+'.');
    }
  }
  if(s.valuables!==undefined&&(!Array.isArray(s.valuables)||s.valuables.some(x=>!x||typeof x!=='object'||(x.worth!==undefined&&!Number.isFinite(Number(x.worth))))))throw new Error('Invalid valuables.');
  if(s.onlineProgress!==undefined){
    const p=s.onlineProgress;
    if(p?.attemptId!==undefined&&(typeof p.attemptId!=='string'||p.attemptId.length<1||p.attemptId.length>100||!/^[A-Za-z0-9_-]+$/.test(p.attemptId)))throw new Error('Invalid speedrun attempt ID.');
    if(!p||typeof p!=='object'||Array.isArray(p)||p.deepestCleared!==undefined&&(!Number.isInteger(p.deepestCleared)||p.deepestCleared<0||p.deepestCleared>200)||p.activeMs!==undefined&&(!Number.isFinite(p.activeMs)||p.activeMs<0)||p.milestones!==undefined&&(!p.milestones||typeof p.milestones!=='object'||Array.isArray(p.milestones)))throw new Error('Invalid online progress.');
  }
  if(s.offersByLevel!==undefined&&(!s.offersByLevel||typeof s.offersByLevel!=='object'||Array.isArray(s.offersByLevel)))throw new Error('Invalid dungeon offers.');
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
export function safeProgress(s){
 const p=s?.onlineProgress||{};
 return {
  attemptId:typeof p.attemptId==='string'&&/^[A-Za-z0-9_-]{1,100}$/.test(p.attemptId)?p.attemptId:'legacy',
  deepestCleared:Math.max(0,Math.min(200,p.deepestCleared==null?Math.max(0,(s?.maxDungeon||1)-1):(Number(p.deepestCleared)||0))),
  activeMs:Math.max(0,Number(p.activeMs)||0),
  timingEligible:p.timingEligible===true,
  timerMetric:p.timerMetric==='combat-v1'?'combat-v1':'legacy-active',
  milestones:p.milestones&&typeof p.milestones==='object'&&!Array.isArray(p.milestones)?p.milestones:{}
 };
}
// Only timed D200 clears are eligible. Untimed imports and incomplete attempts have no score.
export function completedD200Time(save){
 const p=safeProgress(save),clear=p.milestones[200];
 if(p.deepestCleared!==200||!p.timingEligible||p.timerMetric!==SPEEDRUN_METRIC||!clear||!Number.isFinite(clear.activeMs)||clear.activeMs<0)return null;
 return Math.floor(clear.activeMs);
}
