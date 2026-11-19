// Versioned, pure save policy and explicitly isolated validation storage. No Firebase/auth/DOM.
(function(root){
'use strict';
const FORMAT='wanderer-expedition',VERSION=13,GENERATION='c2-clean-sheet',PREFIX='wanderer_v013_c2_clean_sheet_v1_';
const SLOTS=['helm','amulet','armor','gloves','weapon','offhand','ring1','ring2','boots','belt'];
const STATS=['atk','def','hp','spd','str','agi','int','end','cha','mana','spell','evasionRating'];
const EFFECTS=['poison','bleed','crit','sunder','shield','regen','burn','slow','drain','nature','shock','tide','crystal'];
const MERCHANT_CATEGORY_SLOTS={weapons:['weapon','offhand'],armor:['helm','armor','gloves','boots','belt'],accessories:['ring1','ring2','amulet']};
const RUNES=['might','swiftness','wisdom','fortitude','fortune','fury','warding','vitality'];
const treasures=()=>root.WandererV012Treasures;
const plain=x=>x!==null&&Object.prototype.toString.call(x)==='[object Object]';
function requireValue(ok,message){if(!ok)throw Error('Invalid Expedition save: '+message);}
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
const POTIONS=['health','mana','might','arcane','ironhide','haste','fortune','barrier','scout','trail','purifying','veilsight','fate'];
function consumablesCheck(p){
 if(p.consumables!==undefined)requireValue(plain(p.consumables)&&Object.entries(p.consumables).every(([id,q])=>POTIONS.includes(id)&&integer(q,0,99999)),'consumable inventory');
 if(p.potionSelection!==undefined){requireValue(Array.isArray(p.potionSelection)&&p.potionSelection.length<=3&&p.potionSelection.every(id=>POTIONS.includes(id))&&p.potionSelection.filter(id=>id==='fortune').length<=1,'potion selection');for(const id of p.potionSelection)requireValue((p.consumables?.[id]||0)>=p.potionSelection.filter(v=>v===id).length,'selected potion ownership');}
 if(p.apothecary!==undefined&&p.apothecary!==null){const a=p.apothecary;requireValue(plain(a)&&integer(a.refreshCost,0,Number.MAX_SAFE_INTEGER)&&Array.isArray(a.stock)&&a.stock.length<=4&&new Set(a.stock.map(v=>v.id)).size===a.stock.length&&a.stock.every(v=>plain(v)&&typeof v.id==='string'&&POTIONS.includes(v.kind)&&integer(v.price,1,Number.MAX_SAFE_INTEGER)),'Apothecary stock');}
}
function integrationCheck(r){
 requireValue(plain(r)&&r.version===1&&Array.isArray(r.events)&&r.events.length<=4&&r.events.every(i=>integer(i,2,24))&&new Set(r.events).size===r.events.length&&integer(r.combats,0,24)&&plain(r.effects),'integration checkpoint');
 requireValue(r.event===null||plain(r.event)&&typeof r.event.id==='string'&&typeof r.event.roll==='number'&&r.event.roll>=0&&r.event.roll<1&&(r.event.alternative===null||typeof r.event.alternative==='string'),'event choice checkpoint');
 for(const [k,e]of Object.entries(r.effects)){requireValue(['might','arcane','ironhide','haste','attack','defense','curse','echo','item','barrier','runeBoost','bounty','fortune','purifying'].includes(k),'temporary effect');requireValue(typeof e==='boolean'||typeof e==='number'&&Number.isFinite(e)&&e>=0&&e<=1||plain(e)&&(e.remaining===undefined||integer(e.remaining,0,3))&&(e.power===undefined||typeof e.power==='number'&&Number.isFinite(e.power)&&Math.abs(e.power)<=1)&&(e.id===undefined||typeof e.id==='string'),'temporary effect bounds');}
 if(r.potions!==undefined)requireValue(Array.isArray(r.potions)&&r.potions.length<=3&&r.potions.every(p=>plain(p)&&POTIONS.includes(p.kind)&&typeof p.used==='boolean'),'selected potion checkpoint');
 for(const k of ['started','returned'])if(r[k]!==undefined)requireValue(typeof r[k]==='boolean','consumable settlement');
}
function profileCheck(p){
 consumablesCheck(p);
 requireValue(plain(p)&&Array.isArray(p.stash)&&plain(p.equip),'profile');
 if(p.crafting!==undefined)requireValue(root.WandererV013Crafting?.valid(p.crafting),'crafting progress');
 if(p.automaticTalents!==undefined){requireValue(root.WandererAutomaticTalents?.valid(p.automaticTalents),'automatic talent progress');}
 requireValue(p.run===null,'runtime must not be in permanent profile');
 for(const f of ['gold','fragments'])requireValue(integer(p[f],0,Number.MAX_SAFE_INTEGER),f);
 requireValue(integer(p.maxDungeon,1,200),'profile progress');
 if(p.valuables!==undefined){requireValue(Array.isArray(p.valuables),'valuables');for(const v of p.valuables)requireValue(plain(v)&&typeof v.id==='string'&&v.id.length>0&&typeof v.name==='string'&&typeof v.worth==='number'&&Number.isFinite(v.worth)&&v.worth>=0&&treasures().CATALOG.some(t=>t.image===v.image),'valuable identity');}
 requireValue(integer(p.stashCapacity,1,5000)&&p.stash.length<=5000,'stash capacity');
 requireValue(Array.isArray(p.expeditionOverflow)&&p.expeditionOverflow.length<=120,'secured overflow');
 requireValue(Object.keys(p.equip).every(k=>SLOTS.includes(k)),'equipment slot');
 const ids=new Set();
 function itemCheck(item){
  requireValue(plain(item)&&typeof item.id==='string'&&item.id.length>0&&!ids.has(item.id),'duplicate/missing item ID');ids.add(item.id);
  if(item.evasionRating!==undefined)requireValue(typeof item.evasionRating==='number'&&Number.isFinite(item.evasionRating)&&item.evasionRating>=0&&(item.evasionRating===0||item.armorType==='Leather'&&['helm','armor','gloves','boots','belt'].includes(item.slot)),'Evasion Rating');
  if(item.armorType!==undefined)requireValue(['helm','armor','gloves','boots','belt'].includes(item.slot)&&['Cloth','Leather','Plate'].includes(item.armorType),'armor type');
  requireValue(SLOTS.includes(item.slot)&&integer(item.tier,1,Number.MAX_SAFE_INTEGER)&&typeof item.name==='string','item identity');
  requireValue(['Common','Uncommon','Rare','Epic','Legendary'].includes(item.rarity),'item rarity');
  if(item.v013Trait!==undefined)requireValue(['blood_transfer','focused','ward','conflagration','efficient'].includes(item.v013Trait),'item trait');
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
 for(const valuable of p.valuables||[]){requireValue(!ids.has(valuable.id),'duplicate valuable ID');ids.add(valuable.id);}
 for(const [slot,item]of Object.entries(p.equip))if(item)requireValue(item.slot===slot,'equipped slot mismatch');
 requireValue(Array.isArray(p.runes)&&p.runes.length<=300&&Array.isArray(p.runeSlots)&&p.runeSlots.length===3,'Runes');
 const runeIds=new Set();
 function runeCheck(r){requireValue(plain(r)&&typeof r.id==='string'&&!ids.has(r.id)&&!runeIds.has(r.id)&&integer(r.tier,1,Number.MAX_SAFE_INTEGER)&&(r.progression==='expedition'||r.tier>=10&&r.tier%10===0)&&RUNES.includes(r.family),'Rune identity');runeIds.add(r.id);}
 p.runes.forEach(runeCheck);
 const equippedFamilies=new Set(),equippedIds=new Set();
 for(const id of p.runeSlots){if(id===null)continue;const rune=p.runes.find(r=>r.id===id);requireValue(rune&&!equippedIds.has(id)&&!equippedFamilies.has(rune.family),'Rune slot ownership');equippedIds.add(id);equippedFamilies.add(rune.family);}
 if(p.pendingRuneReward){
  const reward=p.pendingRuneReward;requireValue(integer(reward.tier,1,Number.MAX_SAFE_INTEGER)&&Array.isArray(reward.options)&&reward.options.length===3,'Rune reward');
  reward.options.forEach(runeCheck);requireValue(reward.options.every(r=>r.tier===reward.tier)&&new Set(reward.options.map(r=>r.family)).size===3,'Rune offer');
 }
 requireValue(Array.isArray(p.sigils)&&p.sigils.length<=100,'Sigils');const sigilIds=new Set();
 for(const sigil of p.sigils){requireValue(plain(sigil)&&typeof sigil.id==='string'&&sigil.id.length>0&&!ids.has(sigil.id)&&!runeIds.has(sigil.id)&&!sigilIds.has(sigil.id)&&EFFECTS.includes(sigil.affinity),'Sigil');sigilIds.add(sigil.id);}
 requireValue(['wanderer','ranger','knight','spellblade','duelist'].includes(p.characterId),'character');
 if(p.merchant){
  requireValue(plain(p.merchant)&&Array.isArray(p.merchant.stock)&&(p.merchant.stock.length<=4||p.merchant.stock.length===12)&&Array.isArray(p.merchant.sigils)&&[0,4].includes(p.merchant.sigils.length),'Merchant');
  if(p.merchant.stock.length===12){
   const counts=Object.fromEntries(Object.keys(MERCHANT_CATEGORY_SLOTS).map(category=>[category,0]));
   for(const item of p.merchant.stock){const category=Object.keys(MERCHANT_CATEGORY_SLOTS).find(key=>MERCHANT_CATEGORY_SLOTS[key].includes(item?.slot));requireValue(category,'Merchant stock category');counts[category]++;}
   requireValue(Object.values(counts).every(count=>count===4),'Merchant stock categories');
  }
  for(const item of p.merchant.stock){requireValue(!runeIds.has(item?.id)&&!sigilIds.has(item?.id)&&integer(item?.goldPrice,0,Number.MAX_SAFE_INTEGER),'Merchant stock');itemCheck(item);}
  requireValue(p.merchant.sigils.every(e=>e===null||EFFECTS.includes(e)),'Merchant Sigils');
  requireValue(integer(p.merchant.refreshCost,0,Number.MAX_SAFE_INTEGER),'Merchant refresh');
 }
 return p;
}
function presentationCheck(p){
 requireValue(plain(p)&&p.version===1&&[null,'realm','summary'].includes(p.review),'result version/review');
 const item=i=>plain(i)&&typeof i.id==='string'&&typeof i.name==='string'&&integer(i.tier,1,Number.MAX_SAFE_INTEGER)&&SLOTS.includes(i.slot)&&['Common','Uncommon','Rare','Epic','Legendary'].includes(i.rarity);
 const treasure=i=>plain(i)&&typeof i.id==='string'&&typeof i.name==='string'&&typeof i.worth==='number'&&Number.isFinite(i.worth)&&i.worth>=0&&treasures().CATALOG.some(t=>t.image===i.image);
 requireValue(Array.isArray(p.earned)&&p.earned.length<=45&&p.earned.every(item)&&new Set(p.earned.map(i=>i.id)).size===p.earned.length&&integer(p.gold,0,Number.MAX_SAFE_INTEGER)&&integer(p.fragments,0,Number.MAX_SAFE_INTEGER),'result loot/currencies');
 if(p.treasures!==undefined)requireValue(Array.isArray(p.treasures)&&p.treasures.length<=120&&p.treasures.every(treasure),'result treasures');
 const seconds=x=>typeof x==='number'&&Number.isFinite(x)&&x>=0;
 if(p.realm!==null){const r=p.realm;requireValue(plain(r)&&integer(r.level,1,Number.MAX_SAFE_INTEGER)&&integer(r.plane,1,24)&&['cleared','defeat'].includes(r.outcome)&&typeof r.name==='string'&&typeof r.family==='string'&&typeof r.enemy==='string'&&seconds(r.seconds)&&integer(r.gold,0,Number.MAX_SAFE_INTEGER)&&integer(r.fragments,0,Number.MAX_SAFE_INTEGER)&&Array.isArray(r.log)&&r.log.every(l=>plain(l)&&typeof l.text==='string'&&typeof l.kind==='string')&&r.log.reduce((n,l)=>n+l.text.length+l.kind.length,0)<=180000,'Realm result');}
 if(p.realm?.loot!==undefined)requireValue(Array.isArray(p.realm.loot)&&p.realm.loot.length<=3&&p.realm.loot.every(item),'Realm loot result');
 if(p.realm?.treasures!==undefined)requireValue(Array.isArray(p.realm.treasures)&&p.realm.treasures.length<=3&&p.realm.treasures.every(treasure),'Realm treasures');
 if(p.summary!==null){const r=p.summary;requireValue(plain(r)&&integer(r.level,1,Number.MAX_SAFE_INTEGER)&&integer(r.realms,0,24)&&['victory','defeat','extracted','abandoned'].includes(r.outcome)&&seconds(r.seconds)&&integer(r.gold,0,Number.MAX_SAFE_INTEGER)&&integer(r.fragments,0,Number.MAX_SAFE_INTEGER)&&Array.isArray(r.families)&&r.families.length<=3&&r.families.every(f=>['blood','decay','vitality','aegis','fury','magic'].includes(f))&&Array.isArray(r.picks)&&r.picks.length<=20&&r.picks.every(id=>typeof id==='string')&&['kept','lost','discarded'].every(k=>Array.isArray(r[k])&&r[k].length<=45&&r[k].every(item))&&(r.runeTier===null||integer(r.runeTier,1,Number.MAX_SAFE_INTEGER)),'Expedition summary');
  requireValue(r.outcome!=='victory'||(r.realmMap?integer(r.realms,2,24):r.realms===15),'victory result');requireValue((r.runeTier===null||r.outcome==='victory')&&(r.runeName===undefined||r.runeTier!==null&&typeof r.runeName==='string'),'Rune result');
  for(const key of ['treasuresKept','treasuresLost'])if(r[key]!==undefined)requireValue(Array.isArray(r[key])&&r[key].length<=120&&r[key].every(treasure),'Expedition treasures');
  if(r.contract!==undefined&&r.contract!==null){
   const c=r.contract,validIds=['bounty_writ','pathfinder','purification','oath_of_defiance'],statuses=['offered','active','ready','completed','failed','ignored'];
   requireValue(plain(c)&&statuses.includes(c.status)&&
    (c.id===null||validIds.includes(c.id))&&
    typeof c.name==='string'&&c.name.length<=100&&
    integer(c.progress,0,2)&&integer(c.target,0,2)&&c.progress<=c.target&&
    integer(c.essence,0,30)&&integer(c.fragments,0,30)&&
    (c.recipeId===null||typeof c.recipeId==='string'&&c.recipeId.length<=100)&&
    (c.kind===null||['blueprint','essence','gold','fragments','reagent','potion'].includes(c.kind))&&
    (c.status!=='completed'||c.id!==null&&c.kind!==null)&&
    (c.status==='completed'||c.kind===null&&c.recipeId===null&&c.essence===0&&c.fragments===0)&&
    (c.kind!=='blueprint'||c.status==='completed'&&c.recipeId!==null&&c.essence===0&&c.fragments===0)&&
    (c.paid===undefined||c.paid===null||plain(c.paid)&&c.status==='completed'&&
      c.paid.id===c.id&&c.paid.kind===c.kind&&
      (c.paid.recipeId??null)===c.recipeId&&
      (c.paid.essence||0)===c.essence&&(c.paid.fragments||0)===c.fragments&&
      (c.kind!=='gold'||integer(c.paid.gold,0,40))&&
      (c.kind!=='reagent'||['blood','decay','vitality','aegis','fury','magic'].includes(c.paid.family)&&integer(c.paid.amount,0,2))&&
      (c.kind!=='potion'||POTIONS.includes(c.paid.potion)&&integer(c.paid.amount,0,1))),'Expedition Contract summary');
  }
 }
 requireValue(p.review!=='realm'||p.realm!==null,'missing Realm result');requireValue(p.review!=='summary'||p.summary!==null,'missing Expedition summary');
}
function sessionCheck(s,p,e){
 requireValue(plain(s)&&s.version===1&&typeof s.entry==='boolean'&&plain(s.controller),'checkpoint version');
 if(s.results!==undefined)presentationCheck(s.results);
 if(s.integration!==undefined&&s.integration!==null)integrationCheck(s.integration);
 const g=s.controller;
 requireValue(integer(g.expedition,1,e.unlocked)&&g.unlocked===e.unlocked&&integer(g.planeIndex,1,24)&&['choice','combat','failed','finished'].includes(g.stage),'checkpoint progress');
 requireValue(integer(s.seed,0,4294967295)&&typeof s.prefix==='string'&&/^[a-z0-9]+$/.test(s.prefix)&&integer(s.idCounter,0,Number.MAX_SAFE_INTEGER)&&typeof s.clock==='number'&&Number.isFinite(s.clock)&&s.clock>=0,'checkpoint RNG/counter');
 requireValue(s.stamp===null||integer(s.stamp,1,Number.MAX_SAFE_INTEGER),'checkpoint timestamp');
 requireValue(plain(s.home)&&Array.isArray(s.lootIds)&&s.lootIds.length<=120&&new Set(s.lootIds).size===s.lootIds.length,'loot provenance');
 profileCheck({...p,stash:[],equip:s.home,expeditionOverflow:[],merchant:null});
 const items=[...p.stash,...Object.values(p.equip).filter(Boolean),...p.expeditionOverflow,...(p.valuables||[])],ids=new Set(items.map(i=>i.id));
 // The player may move original gear into the risk bag, or replace original gear with earned gear.
 requireValue(s.lootIds.every(id=>typeof id==='string'&&ids.has(id)),'loot ownership');
 requireValue(plain(s.supplies)&&integer(s.supplies.health,0,2)&&integer(s.supplies.mana,0,2),'potion checkpoint');
 requireValue(s.vitals===null||plain(s.vitals)&&['hp','mp','maxmp'].every(k=>typeof s.vitals[k]==='number'&&Number.isFinite(s.vitals[k])&&s.vitals[k]>=0),'resource checkpoint');
 requireValue(s.build===null||plain(s.build)&&Array.isArray(s.build.picks)&&s.build.picks.length<=20,'build checkpoint');
 requireValue(s.draft===null||plain(s.draft)&&['initial','entry','reward'].includes(s.draft.kind)&&['element','passive'].includes(s.draft.step),'draft checkpoint');
 if(s.draft?.version===3){requireValue(s.draft.kind==='reward'&&Array.isArray(s.draft.options)&&s.draft.options.length<=3&&new Set(s.draft.options.map(o=>o.id)).size===s.draft.options.length&&s.draft.options.every(o=>plain(o)&&typeof o.id==='string'&&['Upgrade','Synergy','Discovery'].includes(o.category)&&plain(o.preview)),'contextual draft');}
 if(s.build&&root.WandererV012Buildcraft)root.WandererV012Buildcraft.validate(s.build);
 if(e.active){requireValue(g.expedition===e.active.level&&g.planeIndex===e.active.plane&&g.stage===e.active.stage,'checkpoint identity');}
 else requireValue(!s.entry&&['failed','finished'].includes(g.stage),'ended checkpoint');
 if(s.entry)requireValue(g.stage==='combat'&&g.wave===1&&s.draft===null&&e.active!==null,'Realm entry checkpoint');
 return s;
}
function validate(input,binding){
 const s=json(input);requireValue(s.format===FORMAT&&s.schemaVersion===VERSION&&s.saveGeneration===GENERATION,'unsupported schema or save generation');
 bindingName(s.binding);if(binding!==undefined)requireValue(s.binding===binding,'foreign account/validation slot');
 requireValue(integer(s.revision,0,Number.MAX_SAFE_INTEGER)&&integer(s.idCounter,0,Number.MAX_SAFE_INTEGER),'revision/ID counter');profileCheck(s.profile);
 requireValue(s.identity===null||(plain(s.identity)&&typeof s.identity.uid==='string'&&s.identity.uid.length>0&&typeof s.identity.projectId==='string'&&s.identity.projectId.length>0&&typeof s.identity.nickname==='string'&&/^[A-Za-z0-9_]{3,20}$/.test(s.identity.nickname)),'identity');
 const e=s.expedition;requireValue(plain(e)&&integer(e.completed,0,Number.MAX_SAFE_INTEGER-1)&&(e.unlocked===e.completed+1||(e.completed===5&&e.unlocked===5))&&integer(e.attempts,0,Number.MAX_SAFE_INTEGER),'Expedition progress');
 requireValue(['new','active','victory','defeat','abandoned','interrupted','extracted','cancelled'].includes(e.lastOutcome)&&e.completed<=e.attempts,'outcome/attempt count');
 if(e.lastOutcome==='new')requireValue(e.attempts===0&&e.completed===0,'new profile progress');
 requireValue(Array.isArray(e.awardKeys)&&e.awardKeys.length<=45&&new Set(e.awardKeys).size===e.awardKeys.length,'award ledger');
 for(const token of e.awardKeys){const m=typeof token==='string'&&token.match(/^(\d+):(\d+):(\d+)$/);requireValue(m&&Number(m[1])===e.attempts&&integer(Number(m[2]),1,24)&&integer(Number(m[3]),1,3),'award token');}
 requireValue((e.active!==null)===(e.lastOutcome==='active'),'active checkpoint outcome');
 if(e.attempts===0)requireValue(e.awardKeys.length===0,'rewards before entry');
 if(e.active!==null){const a=e.active;requireValue(e.attempts>0,'entry checkpoint');requireValue(plain(a)&&a.attempt===e.attempts&&integer(a.level,1,e.unlocked)&&integer(a.plane,1,24)&&integer(a.wave,0,3)&&['choice','combat'].includes(a.stage),'checkpoint');requireValue(e.lastOutcome==='active','active outcome');}
 if(e.session!==undefined&&e.session!==null)sessionCheck(e.session,s.profile,e);
 if(e.presentation!==undefined)presentationCheck(e.presentation);
 return s;
}
function create(profile,{binding='local',identity=null}={}){
 const p=json(profile);
 p.expeditionOverflow??=[];
 return validate({format:FORMAT,schemaVersion:VERSION,saveGeneration:GENERATION,binding,identity,revision:0,idCounter:0,profile:p,
  expedition:{completed:0,unlocked:1,attempts:0,active:null,awardKeys:[],lastOutcome:'new'}},binding);
}
function recover(input,binding){
 const save=validate(input,binding),interrupted=!!save.expedition.active;
 if(interrupted&&!save.expedition.session){save.expedition.active=null;save.expedition.lastOutcome='interrupted';}
 // Current session checkpoints resume without enemy runtime.
 return {save,interrupted};
}
function createStore(storage,binding='local'){
 const primary=key(binding),backup=primary+'_backup';let observed,loaded=false;
 function load(){const raw=storage.getItem(primary);const result=raw===null?null:validate(raw,binding);observed=raw;loaded=true;return result;}
 function commit(input){
  requireValue(loaded,'load before write');requireValue(storage.getItem(primary)===observed,'local revision conflict');
  const s=validate(input,binding),previous=observed===null?null:validate(observed,binding);
  requireValue(s.revision===(previous?.revision??0),'stale revision');
  requireValue(s.revision<Number.MAX_SAFE_INTEGER,'revision exhausted');
  if(previous){
   requireValue(JSON.stringify(s.identity)===JSON.stringify(previous.identity),'identity changed');
   requireValue(s.profile.maxDungeon===previous.profile.maxDungeon&&JSON.stringify(s.profile.onlineProgress)===JSON.stringify(previous.profile.onlineProgress),'account history changed');
   const old=previous.expedition,next=s.expedition;
   requireValue(next.completed>=old.completed&&next.completed<=old.completed+1&&next.attempts>=old.attempts&&next.attempts<=old.attempts+1,'progress regression/jump');
   if(next.attempts===old.attempts)requireValue(old.awardKeys.every(k=>next.awardKeys.includes(k)),'reward ledger rollback');
   else requireValue(old.active===null&&next.active!==null&&next.awardKeys.length===0,'invalid new attempt');
   if(next.attempts===old.attempts&&old.session&&next.session){
    requireValue(JSON.stringify(old.session.home)===JSON.stringify(next.session.home),'home equipment changed');
    requireValue(old.session.controller.version===2&&next.session.controller.version===2,'current checkpoint format');
    requireValue(integer(next.session.controller.rerolls,0,old.session.controller.rerolls),'reroll rollback');
    const before=old.session.controller.rerollsByRealm,after=next.session.controller.rerollsByRealm;
    requireValue(Array.isArray(before)&&Array.isArray(after)&&before.length===15&&after.length===15&&after.every((row,i)=>Array.isArray(row)&&row.length===3&&row.every((n,j)=>integer(n,0,before[i][j]))),'reroll rollback');
   }
   if(next.lastOutcome==='extracted'&&old.lastOutcome!=='extracted')requireValue(old.active?.stage==='choice'&&old.active.plane>1&&old.session&&!old.session.entry&&!old.session.controller.rewardPending&&next.completed===old.completed&&JSON.stringify(s.profile.pendingRuneReward)===JSON.stringify(previous.profile.pendingRuneReward)&&JSON.stringify(s.profile.runes)===JSON.stringify(previous.profile.runes),'invalid extraction');
   if(next.completed>old.completed)requireValue(old.active?.plane===15&&old.active.wave===1&&old.active.level===next.completed&&next.lastOutcome==='victory'&&next.awardKeys.includes(next.attempts+':15:1'),'boss checkpoint required');
  }
  if(observed!==null)storage.setItem(backup,observed);
  s.revision++;const raw=JSON.stringify(s);storage.setItem(primary,raw);
  requireValue(storage.getItem(primary)===raw,'write verification');observed=raw;return s;
 }
 return Object.freeze({key:primary,load,commit,backup:()=>{const raw=storage.getItem(backup);return raw===null?null:validate(raw,binding);}});
}
root.WandererV012Save=Object.freeze({FORMAT,VERSION,GENERATION,PREFIX,key,validate,create,recover,createStore});
})(globalThis);
