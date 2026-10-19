// Versioned, pure save policy and explicitly isolated validation storage. No Firebase/auth/DOM.
(function(root){
'use strict';
const FORMAT='wanderer-expedition',VERSION=12,PREFIX='wanderer_v012_validation_v1_';
const SLOTS=['helm','amulet','armor','gloves','weapon','offhand','ring1','ring2','boots','belt'];
const STATS=['atk','def','hp','spd','str','agi','int','end','cha','mana','spell'];
const EFFECTS=['poison','bleed','crit','sunder','shield','regen','burn','slow','drain','nature','shock','tide','crystal'];
const RUNES=['might','swiftness','wisdom','fortitude','fortune','fury','warding','vitality'];
const plain=x=>x!==null&&Object.prototype.toString.call(x)==='[object Object]';
function requireValue(ok,message){if(!ok)throw Error('Invalid v0.12 save: '+message);}
function integer(x,min,max){return Number.isSafeInteger(x)&&x>=min&&x<=max;}
function json(value){
 if(typeof value==='string')value=JSON.parse(value);
 const seen=new Set();
 function walk(v,depth){
  requireValue(depth<=50,'nested data');
  if(v===null||typeof v==='string'||typeof v==='boolean')return;
  if(typeof v==='number'){requireValue(Number.isFinite(v),'nonfinite number');return;}
  requireValue(Array.isArray(v)||plain(v),'JSON data only');requireValue(!seen.has(v),'cyclic data');seen.add(v);
  for(const [key,item]of Object.entries(v)){requireValue(!['__proto__','constructor','prototype'].includes(key),'unsafe property');walk(item,depth+1);}
  seen.delete(v);
 }
 walk(value,0);const raw=JSON.stringify(value);requireValue(raw.length<=700000,'payload too large');return JSON.parse(raw);
}
function bindingName(binding){requireValue(typeof binding==='string'&&/^[A-Za-z0-9_-]{1,100}$/.test(binding),'binding');return binding;}
function key(binding){return PREFIX+bindingName(binding);}
function profileCheck(p){
 requireValue(plain(p)&&Array.isArray(p.stash)&&plain(p.equip),'profile');
 requireValue(p.run===null,'runtime must not be in permanent profile');
 for(const f of ['gold','fragments'])requireValue(integer(p[f],0,Number.MAX_SAFE_INTEGER),f);
 requireValue(integer(p.maxDungeon,1,200),'legacy dungeon progress');
 if(p.chosen!==undefined)requireValue(integer(p.chosen,1,p.maxDungeon),'legacy selected dungeon');
 if(p.valuables!==undefined){requireValue(Array.isArray(p.valuables),'valuables');for(const v of p.valuables)requireValue(plain(v)&&typeof v.worth==='number'&&Number.isFinite(v.worth)&&v.worth>=0,'valuable worth');}
 requireValue(integer(p.stashCapacity,1,5000)&&p.stash.length<=5000,'stash capacity');
 requireValue(Array.isArray(p.expeditionOverflow)&&p.expeditionOverflow.length<=45,'secured overflow');
 requireValue(Object.keys(p.equip).every(k=>SLOTS.includes(k)),'equipment slot');
 const ids=new Set();
 function itemCheck(item){
  requireValue(plain(item)&&typeof item.id==='string'&&item.id.length>0&&!ids.has(item.id),'duplicate/missing item ID');ids.add(item.id);
  if(item.armorType!==undefined)requireValue(['helm','armor','gloves','boots','belt'].includes(item.slot)&&['Cloth','Leather','Plate'].includes(item.armorType),'armor type');
  requireValue(SLOTS.includes(item.slot)&&integer(item.tier,1,200)&&typeof item.name==='string','item identity');
  requireValue(['Common','Uncommon','Rare','Epic','Legendary'].includes(item.rarity),'item rarity');
  for(const f of STATS)if(item[f]!==undefined)requireValue(typeof item[f]==='number'&&Number.isFinite(item[f]),'item '+f);
  if(item.effect!==undefined&&item.effect!==null)requireValue(EFFECTS.includes(item.effect),'item effect');
  if(item.magic!==undefined&&item.magic!==null)requireValue(EFFECTS.includes(item.magic),'item magic');
  if(item.upgradeRank!==undefined){
   requireValue(item.rarity==='Legendary'&&integer(item.upgradeRank,0,10),'Legendary rank');
   if(item.upgradeRank>0)requireValue(plain(item.upgradeBase),'Legendary original stats');
   if(item.upgradeBase)for(const [f,n]of Object.entries(item.upgradeBase))requireValue(STATS.includes(f)&&typeof n==='number'&&Number.isFinite(n)&&n>=0,'Legendary base');
  }
 }
 for(const item of [...p.stash,...Object.values(p.equip).filter(Boolean),...p.expeditionOverflow])itemCheck(item);
 for(const [slot,item]of Object.entries(p.equip))if(item)requireValue(item.slot===slot,'equipped slot mismatch');
 requireValue(Array.isArray(p.runes)&&p.runes.length<=300&&Array.isArray(p.runeSlots)&&p.runeSlots.length===3,'Runes');
 const runeIds=new Set();
 function runeCheck(r){requireValue(plain(r)&&typeof r.id==='string'&&!ids.has(r.id)&&!runeIds.has(r.id)&&integer(r.tier,10,200)&&r.tier%10===0&&RUNES.includes(r.family),'Rune identity');runeIds.add(r.id);}
 p.runes.forEach(runeCheck);
 const equippedFamilies=new Set(),equippedIds=new Set();
 for(const id of p.runeSlots){if(id===null)continue;const rune=p.runes.find(r=>r.id===id);requireValue(rune&&!equippedIds.has(id)&&!equippedFamilies.has(rune.family),'Rune slot ownership');equippedIds.add(id);equippedFamilies.add(rune.family);}
 if(p.pendingRuneReward){
  const reward=p.pendingRuneReward;requireValue(integer(reward.tier,10,200)&&reward.tier%10===0&&Array.isArray(reward.options)&&reward.options.length===3,'Rune reward');
  reward.options.forEach(runeCheck);requireValue(reward.options.every(r=>r.tier===reward.tier)&&new Set(reward.options.map(r=>r.family)).size===3,'Rune offer');
 }
 requireValue(Array.isArray(p.sigils)&&p.sigils.length<=100,'Sigils');const sigilIds=new Set();
 for(const sigil of p.sigils){requireValue(plain(sigil)&&typeof sigil.id==='string'&&sigil.id.length>0&&!ids.has(sigil.id)&&!runeIds.has(sigil.id)&&!sigilIds.has(sigil.id)&&EFFECTS.includes(sigil.affinity),'Sigil');sigilIds.add(sigil.id);}
 requireValue(['wanderer','ranger','knight','spellblade','duelist'].includes(p.characterId),'character');
 if(p.merchant){
  requireValue(plain(p.merchant)&&Array.isArray(p.merchant.stock)&&p.merchant.stock.length<=4&&Array.isArray(p.merchant.sigils)&&p.merchant.sigils.length===4,'Merchant');
  for(const item of p.merchant.stock){requireValue(!runeIds.has(item?.id)&&!sigilIds.has(item?.id)&&integer(item?.goldPrice,0,Number.MAX_SAFE_INTEGER),'Merchant stock');itemCheck(item);}
  requireValue(p.merchant.sigils.every(e=>e===null||EFFECTS.includes(e)),'Merchant Sigils');
  requireValue(integer(p.merchant.refreshCost,0,Number.MAX_SAFE_INTEGER),'Merchant refresh');
 }
 return p;
}
function normalizedLegacy(input){
 const p=json(input);requireValue(plain(p)&&Array.isArray(p.stash)&&plain(p.equip),'legacy profile');
 requireValue(p.run===null||p.run===undefined||plain(p.run),'legacy runtime');p.run=null;
 p.fragments=p.fragments??p.shards??0;p.gold=p.gold??0;p.maxDungeon=p.maxDungeon??1;
 p.characterId=p.characterId??'wanderer';p.stashCapacity=p.stashCapacity??40;
 if(p.merchant&&Array.isArray(p.merchant.stock)){p.merchant.sigils=p.merchant.sigils??['poison','bleed','crit','shield'];p.merchant.refreshCost=p.merchant.refreshCost??20;}
 p.runes=p.runes??[];p.runeSlots=p.runeSlots??[null,null,null];p.sigils=p.sigils??[];p.expeditionOverflow=p.expeditionOverflow??[];
 if(['Two-Handed','Bow','Staff'].includes(p.equip.weapon?.subtype)&&p.equip.offhand){p.stash.push(p.equip.offhand);p.equip.offhand=null;}
 const items=[...p.stash,...Object.values(p.equip).filter(Boolean),...p.expeditionOverflow];
 const used=new Set([...items,...p.runes,...p.sigils,...(p.pendingRuneReward?.options||[]),...(p.merchant?.stock||[])].map(i=>i?.id).filter(Boolean));let serial=0;
 for(const item of items){
  requireValue(plain(item),'legacy item');
  if(item.slot==='ring')item.slot='ring1';
  if(!item.id){let candidate;do{candidate='legacy-item-'+serial++;}while(used.has(candidate));item.id=candidate;used.add(candidate);}
  if(item.effect==='burst')item.effect='sunder';
  item.rarity=({Comum:'Common',Incomum:'Uncommon',Raro:'Rare','Épico':'Epic',Lendário:'Legendary'})[item.rarity]||item.rarity||'Common';
  item.subtype=item.subtype??({weapon:'Sword',offhand:'Shield',ring1:'Ring',ring2:'Ring',helm:'Helm',armor:'Armor',gloves:'Gloves',boots:'Boots',belt:'Belt',amulet:'Amulet'})[item.slot];
  for(const f of STATS)if(item[f]!==undefined&&typeof item[f]==='string'&&item[f].trim()&&Number.isFinite(Number(item[f])))item[f]=Number(item[f]);
 }
 if(p.equip.ring){requireValue(!p.equip.ring1,'ambiguous legacy rings');p.equip.ring1=p.equip.ring;delete p.equip.ring;}
 return profileCheck(p);
}
function validate(input,binding){
 const s=json(input);requireValue(s.format===FORMAT&&s.schemaVersion===VERSION,'unsupported schema');
 bindingName(s.binding);if(binding!==undefined)requireValue(s.binding===binding,'foreign account/validation slot');
 requireValue(integer(s.revision,0,Number.MAX_SAFE_INTEGER)&&integer(s.idCounter,0,Number.MAX_SAFE_INTEGER),'revision/ID counter');profileCheck(s.profile);
 requireValue(s.identity===null||(plain(s.identity)&&typeof s.identity.uid==='string'&&s.identity.uid.length>0&&typeof s.identity.projectId==='string'&&s.identity.projectId.length>0&&typeof s.identity.nickname==='string'&&/^[A-Za-z0-9_]{3,20}$/.test(s.identity.nickname)),'identity');
 if(s.migration!==null)requireValue(plain(s.migration)&&s.migration.source==='classic-v092'&&s.migration.requiresApproval===true&&(s.migration.sourceRevision===null||integer(s.migration.sourceRevision,1,Number.MAX_SAFE_INTEGER)),'migration approval metadata');
 const e=s.expedition;requireValue(plain(e)&&integer(e.completed,0,200)&&e.unlocked===Math.min(200,e.completed+1)&&integer(e.attempts,0,1000000),'Expedition progress');
 requireValue(['new','active','victory','defeat','abandoned','interrupted'].includes(e.lastOutcome)&&e.completed<=e.attempts,'outcome/attempt count');
 if(e.lastOutcome==='new')requireValue(e.attempts===0&&e.completed===0,'new profile progress');
 requireValue(Array.isArray(e.awardKeys)&&e.awardKeys.length<=45&&new Set(e.awardKeys).size===e.awardKeys.length,'award ledger');
 for(const token of e.awardKeys){const m=typeof token==='string'&&token.match(/^(\d+):(\d+):(\d+)$/);requireValue(m&&Number(m[1])===e.attempts&&integer(Number(m[2]),1,15)&&integer(Number(m[3]),1,3),'award token');}
 requireValue((e.active!==null)===(e.lastOutcome==='active'),'active checkpoint outcome');
 if(e.attempts===0)requireValue(e.awardKeys.length===0,'rewards before entry');
 if(e.active!==null){const a=e.active;requireValue(e.attempts>0,'entry checkpoint');requireValue(plain(a)&&a.attempt===e.attempts&&integer(a.level,1,e.unlocked)&&integer(a.plane,1,15)&&integer(a.wave,0,3)&&['choice','combat'].includes(a.stage),'checkpoint');requireValue(e.lastOutcome==='active','active outcome');}
 requireValue(plain(s.legacyHistory)&&integer(s.legacyHistory.maxDungeon,1,200),'legacy history');
 return s;
}
function create(profile,{binding='local',identity=null}={}){
 const p=normalizedLegacy(profile);
 return validate({format:FORMAT,schemaVersion:VERSION,binding,identity,revision:0,idCounter:0,profile:p,
  legacyHistory:{maxDungeon:p.maxDungeon,onlineProgress:p.onlineProgress??null,attemptCompleted:p.attemptCompleted??false},
  migration:null,expedition:{completed:0,unlocked:1,attempts:0,active:null,awardKeys:[],lastOutcome:'new'}},binding);
}
function migrateLegacy(input,{binding='local',identity=null,expectedRevision}={}){
 const archive=typeof input==='string'?input:JSON.stringify(json(input));let old=json(input),sourceRevision=null;requireValue(plain(old),'legacy object');
 if(old.format===FORMAT)return {save:validate(old,binding),archive:null,migrated:false};
 if('schemaVersion'in old){
  requireValue(old.schemaVersion===1&&typeof old.payload==='string'&&integer(old.revision,1,Number.MAX_SAFE_INTEGER),'legacy cloud envelope');
  sourceRevision=old.revision;if(expectedRevision!==undefined)requireValue(sourceRevision===expectedRevision,'source cloud conflict');old=json(old.payload);
 }
 requireValue(!('format'in old)&&!('schemaVersion'in old)&&!('version'in old),'unsupported legacy format/version; isolated prototypes require explicit conversion approval');
 const save=create(old,{binding,identity});save.migration={source:'classic-v092',sourceRevision,requiresApproval:true};
 return {save:validate(save,binding),archive,migrated:true};
}
function recover(input,binding){
 const save=validate(input,binding),interrupted=!!save.expedition.active;
 if(interrupted){save.expedition.active=null;save.expedition.lastOutcome='interrupted';}
 // All temporary passives, HP/Mana, offers, RNG and enemy runtime are deliberately absent.
 return {save,interrupted};
}
function createStore(storage,binding='local'){
 const primary=key(binding),backup=primary+'_backup',source=primary+'_source';let observed,loaded=false;
 function load(){const raw=storage.getItem(primary);const result=raw===null?null:validate(raw,binding);observed=raw;loaded=true;return result;}
 function commit(input,archive=null){
  requireValue(loaded,'load before write');requireValue(storage.getItem(primary)===observed,'local revision conflict');
  const s=validate(input,binding),previous=observed===null?null:validate(observed,binding);
  requireValue(s.revision===(previous?.revision??0),'stale revision');
  requireValue(s.revision<Number.MAX_SAFE_INTEGER,'revision exhausted');
  if(previous){
   requireValue(JSON.stringify(s.identity)===JSON.stringify(previous.identity),'identity changed');
   requireValue(JSON.stringify(s.legacyHistory)===JSON.stringify(previous.legacyHistory)&&s.profile.maxDungeon===previous.profile.maxDungeon&&JSON.stringify(s.profile.onlineProgress)===JSON.stringify(previous.profile.onlineProgress),'legacy history changed');
   const old=previous.expedition,next=s.expedition;
   requireValue(next.completed>=old.completed&&next.completed<=old.completed+1&&next.attempts>=old.attempts&&next.attempts<=old.attempts+1,'progress regression/jump');
   if(next.attempts===old.attempts)requireValue(old.awardKeys.every(k=>next.awardKeys.includes(k)),'reward ledger rollback');
   else requireValue(old.active===null&&next.active!==null&&next.awardKeys.length===0,'invalid new attempt');
   if(next.completed>old.completed)requireValue(old.active?.plane===15&&old.active.wave===3&&old.active.level===next.completed&&next.lastOutcome==='victory'&&next.awardKeys.includes(next.attempts+':15:3'),'boss checkpoint required');
  }
  if(archive!==null){const old=storage.getItem(source);requireValue(old===null||old===archive,'source archive already exists');if(old===null)storage.setItem(source,archive);}
  if(observed!==null)storage.setItem(backup,observed);
  s.revision++;const raw=JSON.stringify(s);storage.setItem(primary,raw);
  requireValue(storage.getItem(primary)===raw,'write verification');observed=raw;return s;
 }
 return Object.freeze({key:primary,load,commit,backup:()=>{const raw=storage.getItem(backup);return raw===null?null:validate(raw,binding);}});
}
root.WandererV012Save=Object.freeze({FORMAT,VERSION,PREFIX,key,validate,create,migrateLegacy,recover,createStore});
})(globalThis);
