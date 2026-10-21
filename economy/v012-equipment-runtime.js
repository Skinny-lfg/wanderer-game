// v0.12 equipment runtime. Canonical state transitions; UI effects are injected.
(function(root){'use strict';
function create(ports){
function chooseSubtype(slot,requested='random'){if(requested!=='random')return requested;if(slot==='weapon')return ports.sample(ports.TYPES);if(slot==='offhand')return ports.sample(ports.OFFHAND_TYPES);return ['ring1','ring2'].includes(slot)?'Ring':ports.SNAME[slot];}

function economyTier(){return Math.min(ports.DUNGEON_CAP,ports.phase1Controller?.state.unlocked||1);}

function merchantTier(){return ports.economyTier();}

function baseStatScore(o){if(!o)return 0;return [['atk',3],['def',3],['hp',.18],['spd',8],['str',2],['agi',2],['int',2],['end',2],['cha',2],['mana',.2],['spell',2]].reduce((sum,[k,w])=>sum+(Number(o[k])||0)*w,0)}

function offhandLocked(o){return o?.slot==='offhand'&&ports.isTwoHanded(ports.state.equip.weapon)}

function craftEquipment(cost,odds){
 if(!ports.economyCanAct()||ports.forgeTier>ports.economyTier())return;
 if(ports.state.fragments<cost)return;
 if(!ports.stashHasRoom()){ports.bannerMessage('Stash full. Upgrade or salvage gear first.');return;}
 ports.state.fragments-=cost;
 const o=ports.makeItem(ports.forgeTier,ports.forgeSlot,null,'forge',ports.forgeSubtype,ports.forgeQuality>0?WandererEconomyV0101.rarityFromOdds(odds):null);
 o.craftPrice=cost;o.isNew=true;ports.state.stash.push(o);ports.save();return o;
}

function reinforceEquipment(selected){
 if(!ports.economyCanAct()||ports.economyOwnedItem(selected.id)!==selected||selected.rarity!=='Legendary'||(selected.upgradeRank||0)>=10)return false;
 const price=WandererEconomyV0101.upgradeCost(selected.tier,selected.upgradeRank||0);if(ports.state.fragments<price)return false;
 WandererEconomyV0101.upgradeLegendary(selected);ports.state.fragments-=price;ports.save();return true;
}

function purchaseEquipment(m,i,item){
 if(!ports.economyCanAct()||ports.state.merchant!==m||m.stock[i]?.id!==item.id||ports.state.gold<item.goldPrice)return false;
 if(!ports.stashHasRoom()){ports.bannerMessage('Stash full. Upgrade or salvage gear first.');return false;}
 ports.state.gold-=item.goldPrice;item.isNew=true;ports.state.stash.push(item);
 const replacement=ports.makeItem(ports.merchantTier(),ports.rollEquipmentSlot(),null,'merchant');
 replacement.goldPrice=ports.merchantCost(replacement);m.stock[i]=replacement;ports.save();return true;
}

function sellValuables(){
 if(!ports.economyCanAct()||!ports.state.valuables.length)return false;
 const securedValue=ports.state.valuables.reduce((n,o)=>n+(Number(o.worth)||0),0);ports.state.gold+=securedValue;ports.state.valuables=[];ports.save();return true;
}

function markItemSeen(id){
 const item=[...ports.state.stash,...Object.values(ports.state.equip),...(ports.state.runes||[])].find(o=>o?.id===id);
 if(item?.isNew===true){item.isNew=false;ports.save();}
}

function markAllAsSeen(){
 for(const item of [...ports.state.stash,...(ports.state.expeditionOverflow||[]),...Object.values(ports.state.equip),...(ports.state.runes||[])])if(item)item.isNew=false;
 ports.save();ports.renderStash();
}

function comparisonEquip(item,target=item.slot){
 const equipment={...ports.state.equip,[target]:{...item,slot:target}};
 if(ports.isTwoHanded(item))equipment.offhand=null;
 if(target==='offhand'&&ports.isTwoHanded(ports.state.equip.weapon))return {...ports.state.equip};
 return equipment;
}

function stashCapacity(){return Math.max(ports.STASH_BASE_CAPACITY,Math.min(ports.STASH_MAX_CAPACITY,Math.round(Number(ports.state.stashCapacity)||ports.STASH_BASE_CAPACITY)))}

function potionStackCount(){return Object.values(ports.state.consumables||{}).reduce((total,quantity)=>total+Math.ceil(quantity/99),0)}
function stashItemCount(){return ports.state.stash.length+potionStackCount()}

function stashUpgradeCost(){return 60+40*Math.floor((ports.stashCapacity()-ports.STASH_BASE_CAPACITY)/ports.STASH_UPGRADE_STEP)}

function stashHasRoom(){return stashItemCount()<ports.stashCapacity()}

function upgradeStash(){if(ports.state.run||ports.stashCapacity()>=ports.STASH_MAX_CAPACITY||ports.state.gold<ports.stashUpgradeCost())return;const cost=ports.stashUpgradeCost();ports.state.gold-=cost;ports.state.stashCapacity=Math.min(ports.STASH_MAX_CAPACITY,ports.stashCapacity()+ports.STASH_UPGRADE_STEP);ports.save();ports.renderStash();ports.bannerMessage('Stash expanded by '+ports.STASH_UPGRADE_STEP+' slots for '+cost+' Gold.');}

function fresh(){ports.state={attemptCompleted:false,characterId:'wanderer',onlineProgress:{attemptId:ports.makeId(),deepestCleared:0,activeMs:0,timerMetric:'combat-v1',timingEligible:true,milestones:{}},stashCapacity:ports.STASH_BASE_CAPACITY,confirmNormalDungeons:true,maxDungeon:1,chosen:1,selectedPath:null,legendaryHuntId:null,protectedItemIds:[],runes:[],runeSlots:[null,null,null],pendingRuneReward:null,fragments:0,gold:0,stash:[ports.starter()],equip:ports.makeSlots(),valuables:[],offersByLevel:{},merchant:null,sigils:[],run:null};}

function makeSlots(){return Object.fromEntries(ports.SLOTS.map(s=>[s,null]))}

function starter(){return {id:ports.makeId(),slot:'weapon',subtype:'Sword',name:'Old Sword',tier:1,rarity:'Common',effect:null,atk:5,str:1,obtainedAt:Date.now(),crafted:false,recoveryStarter:true}}

function legendaryMatches(entry,item){
 if(!entry||!item)return false;
 if(entry.id==='crimson-fang')return ['Daggers','Off-Hand Dagger'].includes(item.subtype)&&['weapon','offhand'].includes(item.slot);
 if(entry.id==='heartroot-carapace')return item.slot==='armor'&&['Armor','Cloth','Leather','Plate'].includes(item.subtype);
 return entry.subtype===item.subtype&&(entry.slot===item.slot||(entry.slot==='ring'&&['ring1','ring2'].includes(item.slot))||(entry.subtype==='Daggers'&&['weapon','offhand'].includes(entry.slot)&&['weapon','offhand'].includes(item.slot)));
}

function legendaryFor(item){const eligible=ports.LEGENDARY_CATALOG.filter(entry=>ports.legendaryMatches(entry,item));return eligible.length?ports.sample(eligible):null;}

function legendarySignature(item){
 if(item?.rarity!=='Legendary')return null;
 const identity=ports.LEGENDARY_BY_ID[item.legendaryId]||ports.LEGENDARY_BY_NAME[item.name];
 const definition=identity&&ports.legendaryMatches(identity,item)?globalThis.WandererLegendary?.DEFINITIONS?.[identity.id]:null;
 return definition?{identity,definition}:null;
}

function makeItem(tier,slot=null,affinity=null,source='loot',subtype='random',forcedRarity=null){
slot=slot||ports.rollEquipmentSlot();
let requestedArmorType=ports.ARMOR_TYPES.includes(subtype)?subtype:null;
subtype=ports.chooseSubtype(slot,ports.ARMOR_TYPES.includes(subtype)?'random':subtype);
let rarity=forcedRarity&&ports.RARITY[forcedRarity]?forcedRarity:ports.rarityRoll(tier,source==='forge');
if(source==='merchant'&&rarity==='Legendary')rarity='Epic';
if(rarity==='Legendary'&&!ports.LEGENDARY_CATALOG.some(entry=>ports.legendaryMatches(entry,{slot,subtype}))){
 const entry=ports.sample(ports.LEGENDARY_CATALOG);
 slot=entry.slot==='ring'?ports.sample(['ring1','ring2']):entry.slot;subtype=entry.subtype;requestedArmorType=null;
}
const armorType=ports.PHASE1_PREVIEW&&ports.ARMOR_SLOTS.includes(slot)?(requestedArmorType||ports.sample(ports.ARMOR_TYPES)):null;
const magic=false,effect=null;
const legendaryIdentity=rarity==='Legendary'?ports.legendaryFor({slot,subtype}):null;
const legendaryDefinition=legendaryIdentity&&globalThis.WandererLegendary?.DEFINITIONS?.[legendaryIdentity.id];
let mult=ports.RARITY[rarity][1],progressTier=WandererV012CombatCore.referenceLevel(tier),power=Math.round((2+progressTier*.91)*mult),o={id:ports.makeId(),slot,subtype,name:(source==='loot'&&subtype==='Sword'&&rarity==='Common'&&ports.gameRandom()<.25?'Old Sword':ports.sample(ports.NAMES[subtype]||ports.NAMES[slot]||['Ancient Gear'])),rarity,tier,atk:0,def:0,hp:0,spd:0,str:0,agi:0,int:0,end:0,cha:0,mana:0,spell:0,effect,magic:magic?effect:null,crafted:source==='forge',craftPrice:source==='forge'?ports.craftCost(tier):null,obtainedAt:ports.PHASE1_PREVIEW&&ports.phase4Stamp?ports.phase4Stamp:Date.now(),locked:false,source};
if(subtype==='Sword'){o.atk=power+3;o.str=1+Math.floor(progressTier*.20)}
else if(subtype==='Mace'){o.atk=power+6;o.str=2+Math.floor(progressTier*.23);o.spd=-1}
else if(subtype==='Bow'){o.atk=Math.round(power*1.18)+5;o.agi=2+Math.floor(progressTier*.21);o.spd=1}
else if(subtype==='Daggers'){o.atk=power+1;o.agi=3+Math.floor(progressTier*.23);o.spd=2}
else if(subtype==='Two-Handed'){o.atk=Math.round(power*1.75)+7;o.str=3+Math.floor(progressTier*.29);o.spd=-2}
else if(subtype==='Staff'){o.atk=1;o.int=4+Math.floor(progressTier*.34);o.spell=Math.round(power*1.8)+8;o.mana=Math.round(power*2.4)}
else if(subtype==='Wand'){o.atk=1;o.int=2+Math.floor(progressTier*.22);o.spell=Math.round(power*1.15)+2;o.mana=power}
else if(subtype==='Shield'){o.def=power+2;o.hp=power*3;o.end=2+Math.floor(progressTier*.22)}
else if(slot==='offhand'){o.spell=subtype==='Orb'?Math.round(power*1.12):power;if(subtype==='Orb')o.orbSpellB4=true;o.int=1+Math.floor(progressTier*.2);o.mana=power}
else if(slot==='armor'){o.def=power+3;o.hp=power*4;o.end=1+Math.floor(progressTier*.23)}
else if(slot==='helm'||slot==='belt'){o.def=power+1;o.hp=power*2;o.end=1}
else if(slot==='gloves'){o.str=1+Math.floor(progressTier*.2);o.agi=1+Math.floor(progressTier*.2);o.atk=Math.round(power*.55)}
else if(slot==='boots'){o.agi=2+Math.floor(progressTier*.23);o.spd=1;o.hp=power}
else if(slot==='amulet'){o.int=1+Math.floor(progressTier*.22);o.cha=1+Math.floor(progressTier*.18);o.hp=power*2}
else if(['ring1','ring2'].includes(slot)){o.cha=1+Math.floor(progressTier*.25);o.atk=Math.round(power*.45);o.hp=power}
if(armorType){
 // Keep the existing primary-attribute budget; no new stat weights or scaling.
 const budget=o.str+o.agi+o.int+o.end;
 o.str=o.agi=o.int=o.end=0;
 o[{Cloth:'int',Leather:'agi',Plate:'str'}[armorType]]=budget;
 o.armorType=armorType;
 if(armorType==='Leather')o.evasionRating=power;
}
if(rarity==='Legendary'){const identity=legendaryIdentity;if(identity){o.legendaryId=identity.id;o.name=identity.name;}o.legendaryPower=legendaryDefinition?legendaryDefinition.name+': '+legendaryDefinition.description:'';o.atk+=subtype==='Sword'?progressTier+4:0;}
if(tier>200)for(const field of ['atk','def','hp','str','agi','int','end','cha','mana','spell','evasionRating'])if(typeof o[field]==='number'&&!(field==='atk'&&['Staff','Wand'].includes(subtype)))o[field]=WandererV012CombatCore.gearStat(tier,o[field]);
return o;}

function rarityOdds(tier,isCraft){let a={Common:.49,Uncommon:.30,Rare:.15,Epic:.045,Legendary:.015};
if(isCraft){const gap=Math.max(0,ports.economyTier()-tier),boost=Math.min(.24,gap*.012);a.Common-=boost;a.Rare+=boost*.35;a.Epic+=boost*.65;a.Epic+=a.Legendary;a.Legendary=0;}
else{const cha=ports.totalStats().cha,boost=Math.min(.040,Math.max(0,cha-5)*.0008);a.Common-=boost;a.Rare+=boost*.65;a.Epic+=boost*.35;}
return a;}

function rarityRoll(tier,craft){let x=ports.gameRandom(),p=ports.rarityOdds(tier,craft);for(let key of ['Common','Uncommon','Rare','Epic','Legendary']){x-=p[key];if(x<0)return key}return 'Common';}

function rollEquipmentSlot(){let n=ports.roll(1,ports.EQUIPMENT_DROP_WEIGHTS.reduce((sum,[,weight])=>sum+weight,0));for(const [slot,weight] of ports.EQUIPMENT_DROP_WEIGHTS){n-=weight;if(n<=0)return slot==='ring'?ports.sample(['ring1','ring2']):slot;}throw Error('Invalid drop weights');}

function merchantCost(o){return Math.round((24+o.tier*12)*ports.RARITY[o.rarity][2]);}

function saleFragments(o){if(o?.recoveryStarter===true)return 0;let raw=Math.max(2,Math.round((3+o.tier*2)*ports.RARITY[o.rarity][2]));return o.crafted?Math.min(raw,Math.max(1,Math.floor((+o.craftPrice||ports.craftCost(o.tier))*.25))):raw}

function rollShop(){const level=ports.merchantTier(),stock=Array.from({length:4},()=>{let o=ports.makeItem(level,ports.rollEquipmentSlot(),null,'merchant');o.goldPrice=ports.merchantCost(o);return o});ports.state.merchant={stock,sigils:[],refreshCost:16+level*4,refreshes:0};ports.save();}

function economyOwnedGear(){return [...Object.values(ports.state.equip).filter(Boolean),...ports.state.stash];}

function economyOwnedItem(id){return ports.economyOwnedGear().find(item=>item.id===id)||null;}

function economyCanAct(){return !ports.phase3NeedsBagResolution()&&!!ports.state&&!ports.state.run&&!ports.saveBlocked&&(!ports.PHASE1_PREVIEW||(!ports.phase1Draft&&['camp','finished','failed'].includes(ports.phase1Controller?.state.stage)));}

function refreshMerchantStock(kind='gear'){
 if(kind!=='gear'||!ports.economyCanAct()||!ports.state.merchant||ports.state.gold<ports.state.merchant.refreshCost)return;
 const merchant=ports.state.merchant;
 ports.state.gold-=merchant.refreshCost;
 {
  const level=ports.merchantTier();
  merchant.stock=Array.from({length:4},()=>{const item=ports.makeItem(level,ports.rollEquipmentSlot(),null,'merchant');item.goldPrice=ports.merchantCost(item);return item;});
 }
 merchant.refreshes=(Number(merchant.refreshes)||0)+1;
 ports.save();ports.renderMerchant();
}

function equipItem(itemId,target=null){
 if(ports.phase3NeedsBagResolution()||ports.PHASE5_VALIDATION&&(!ports.phase5Ready||ports.saveBlocked))return false;
 if(ports.state.run||(ports.PHASE1_PREVIEW&&ports.phase1Draft))return false;
 const active=ports.phase3ExpeditionActive();
 if(active&&(!ports.phase3CanPrepare()||!ports.phase3BagItems().some(o=>o.id===itemId)))return false;
 const source=active&&ports.state.expeditionOverflow.some(o=>o.id===itemId)?ports.state.expeditionOverflow:ports.state.stash;
 const i=source.findIndex(o=>o.id===itemId);if(i<0)return false;
 const item=source[i],ring=['ring1','ring2'].includes(item.slot),dagger=['Daggers','Off-Hand Dagger'].includes(item.subtype),slot=target||item.slot;
 if(!ports.SLOTS.includes(slot)||ring&&!['ring1','ring2'].includes(slot)||!ring&&target&&target!==item.slot&&!(dagger&&['weapon','offhand'].includes(target)))return false;
 if(ports.isTwoHanded(item)&&slot!=='weapon')return false;
 if(slot==='offhand'&&ports.isTwoHanded(ports.state.equip.weapon)){ports.bannerMessage('Off-Hand locked by two-handed weapon.');return false;}
 const displaced=[ports.state.equip[slot],...(ports.isTwoHanded(item)&&slot==='weapon'?[ports.state.equip.offhand]:[])].filter(Boolean);
 const remainingLegendaries=Object.values(ports.state.equip).filter(equipped=>equipped?.rarity==='Legendary'&&!displaced.includes(equipped)).length;
 if(remainingLegendaries+(item.rarity==='Legendary'?1:0)>2){ports.bannerMessage('Maximum 2 Legendaries equipped. Unequip one before equipping another.');return false;}
 if(active&&ports.phase3BagItems().length-1+displaced.length>ports.PHASE3_BAG_CAPACITY){ports.bannerMessage('Not enough Expedition Bag space for the previous equipment.');return false;}
 if(!active&&stashItemCount()-(source===ports.state.stash?1:0)+displaced.length>ports.stashCapacity()){ports.bannerMessage('Stash full.');return false;}
 source.splice(i,1);
 if(ports.isTwoHanded(item)&&slot==='weapon')ports.state.equip.offhand=null;
 if(ring||dagger)item.slot=slot;
 if(dagger&&item.subtype==='Off-Hand Dagger')item.subtype='Daggers';
 ports.state.equip[slot]=item;
 for(const old of displaced){
  if(active)ports.phase3LootIds.add(old.id);
  (ports.stashHasRoom()?ports.state.stash:ports.state.expeditionOverflow).push(old);
 }
 ports.selectedId=null;ports.phase3ClampVitals();ports.save();ports.render();
 ports.bannerMessage('Equipped '+item.name+(active?' · Previous gear returned to Expedition Bag':''));
 return true;
}

function unequipItem(slot){
 if(ports.phase3NeedsBagResolution()||ports.PHASE5_VALIDATION&&(!ports.phase5Ready||ports.saveBlocked))return false;
 if(ports.state.run||(ports.PHASE1_PREVIEW&&ports.phase1Draft)||!ports.state.equip[slot])return false;
 const active=ports.phase3ExpeditionActive();
 if(active&&(!ports.phase3CanPrepare()||ports.phase3BagItems().length>=ports.PHASE3_BAG_CAPACITY))return false;
 if(!active&&!ports.stashHasRoom())return false;
 const item=ports.state.equip[slot];ports.state.equip[slot]=null;
 if(active)ports.phase3LootIds.add(item.id);
 (ports.stashHasRoom()?ports.state.stash:ports.state.expeditionOverflow).push(item);
 ports.selectedId=null;ports.phase3ClampVitals();ports.save();ports.render();return true;
}

function bulkSell(){
 if(ports.phase3ExpeditionActive()||ports.phase3NeedsBagResolution())return false;
 if(ports.PHASE5_VALIDATION&&(!ports.phase5Ready||ports.saveBlocked))return false;
 const items=ports.state.stash.filter(o=>ports.chosenItems.has(o.id)&&!o.locked);
 if(!items.length)return;
 const total=items.reduce((n,o)=>n+ports.saleFragments(o),0);
 const ids=new Set(items.map(o=>o.id));
 ports.showConfirm('Salvage Equipment','Salvage '+items.length+' items for '+total+' Fragments? This cannot be undone.',()=>{
  if(ports.phase3ExpeditionActive()||ports.phase3NeedsBagResolution())return;
  const selling=ports.state.stash.filter(o=>ids.has(o.id)&&!o.locked);
  if(!selling.length)return;
  const value=selling.reduce((n,o)=>n+ports.saleFragments(o),0);
  const sold=new Set(selling.map(o=>o.id));
  ports.state.stash=ports.state.stash.filter(o=>!sold.has(o.id));ports.state.fragments+=value;
  ports.chosenItems.clear();ports.save();ports.renderStash();ports.bannerMessage('Salvaged '+selling.length+' items · +'+value+' Fragments');
 },'Salvage Items');
}

function salvageOne(id){
 if(ports.phase3ExpeditionActive()||ports.phase3NeedsBagResolution())return false;
 const o=ports.state.stash.find(o=>o.id===id);
 if(!o||o.locked)return;
 const n=ports.saleFragments(o);
 ports.showConfirm('Salvage Equipment','Salvage '+o.name+' for '+n+' Fragments? This cannot be undone.',()=>{
  if(ports.phase3ExpeditionActive()||ports.phase3NeedsBagResolution())return;
  const current=ports.state.stash.find(x=>x.id===id);if(!current||current.locked)return;
  const value=ports.saleFragments(current);
  ports.state.stash=ports.state.stash.filter(x=>x.id!==id);ports.state.fragments+=value;ports.selectedId=null;
  ports.save();ports.renderStash();ports.bannerMessage('Salvaged '+current.name+' · +'+value+' Fragments');
 },'Salvage');
}

function phase3BagItems(){return [...ports.state.stash,...(ports.state.expeditionOverflow||[]),...(ports.state.valuables||[])].filter(item=>ports.phase3LootIds.has(item.id));}

function phase3BagOverflow(){return Math.max(0,ports.phase3BagItems().length-ports.PHASE3_BAG_CAPACITY);}

function phase3NeedsBagResolution(){return ports.PHASE1_PREVIEW&&['finished','failed'].includes(ports.phase1Controller?.state.stage)&&ports.phase3BagOverflow()>0;}

function phase3DiscardLoot(id){
 if(ports.PHASE5_VALIDATION&&(!ports.phase5Ready||ports.saveBlocked)||!ports.phase3CanPrepare()&&!(ports.phase3NeedsBagResolution()&&!ports.state.run&&!ports.phase1Draft))return false;
 const item=ports.phase3BagItems().find(o=>o.id===id);if(!item)return false;
 ports.state.stash=ports.state.stash.filter(o=>o.id!==id);ports.state.expeditionOverflow=ports.state.expeditionOverflow.filter(o=>o.id!==id);ports.state.valuables=(ports.state.valuables||[]).filter(o=>o.id!==id);ports.phase3LootIds.delete(id);
 ports.save();ports.render();return true;
}

function phase4ClaimOverflow(){
 if(!ports.PHASE1_PREVIEW||ports.state.run||ports.phase1Draft)return 0;
 let count=0;
 while(ports.state.expeditionOverflow?.length&&ports.stashHasRoom()){ports.state.stash.push(ports.state.expeditionOverflow.shift());count++;}
 return count;
}

function phase6PotionInventory(){ports.state.consumables??={};ports.state.potionSelection??=[];return ports.state.consumables;}

function phase6SelectPotion(kind,remove=false){
 if(ports.phase3ExpeditionActive()||ports.state.run||ports.PHASE5_VALIDATION&&(!ports.phase5Ready||ports.saveBlocked))return false;
 const stock=ports.phase6PotionInventory(),selection=[...ports.state.potionSelection];if(remove){const index=selection.indexOf(kind);if(index<0)return false;selection.splice(index,1);}else selection.push(kind);
 try{WandererV012Consumables.selection(stock,selection);}catch{return false;}ports.state.potionSelection=selection;ports.save();ports.render();return true;
}

function phase6StartPotions(){
 if(!ports.phase6Run||ports.phase6Run.started)return true;
 const stock=ports.phase6PotionInventory(),ids=[...ports.state.potionSelection];try{WandererV012Consumables.selection(stock,ids);}catch{ports.bannerMessage('Selected potions are unavailable. Return to Camp.');return false;}
 ports.phase6Run.potions=ids.map(kind=>({kind,used:kind==='fortune'}));for(const kind of ids)stock[kind]--;ports.state.potionSelection=[];ports.phase6Run.started=true;
 if(ids.includes('fortune'))ports.phase6Run.effects.fortune=true;return true;
}

function phase6ReturnPotions(outcome){
 if(!ports.phase6Run?.started||ports.phase6Run.returned)return;ports.phase6Run.returned=true;
 if(!['victory','extracted'].includes(outcome))return;
 const stock=ports.phase6PotionInventory();for(const p of ports.phase6Run.potions||[])if(!p.used){stock[p.kind]=(stock[p.kind]||0)+1;p.used=true;}
}

function phase6UsePotion(index){
 if(!ports.phase3IsBetweenPlanes()||!ports.phase6Run||ports.PHASE5_VALIDATION&&(!ports.phase5Ready||ports.saveBlocked))return false;
 const potion=ports.phase6Run.potions?.[index];if(!potion||potion.used||potion.kind==='fortune')return false;
 const v=ports.phase3Vitals(),kind=potion.kind;if(kind==='barrier'&&(ports.phase6Run.effects.barrier||0)>=.3||ports.phase6Run.effects[kind]?.remaining===3)return false;if(kind==='health'&&v.hp>=v.maxhp||kind==='mana'&&v.mp>=v.maxmp)return false;
 if(!ports.phase1Vitals)ports.phase1Vitals={hp:v.hp,mp:v.mp,maxmp:v.maxmp};
 if(kind==='health')ports.phase1Vitals.hp=Math.min(v.maxhp,v.hp+Math.ceil(v.maxhp*.35));
 else if(kind==='mana')ports.phase1Vitals.mp=Math.min(v.maxmp,v.mp+Math.ceil(v.maxmp*.4));
 else if(kind==='barrier')ports.phase6Run.effects.barrier=Math.min(.3,(ports.phase6Run.effects.barrier||0)+.15);
 else ports.phase6Buff(kind,kind==='haste'?.08:.10);
 potion.used=true;ports.view='phase1';ports.save();ports.render();return true;
}

function phase6BuyPotion(id){
 if(!ports.economyCanAct())return false;const a=ports.state.apothecary,index=a?.stock.findIndex(p=>p.id===id);if(index===undefined||index<0)return false;const p=a.stock[index],stock=ports.phase6PotionInventory(),quantity=stock[p.kind]||0;if(ports.state.gold<p.price||quantity>=99999||quantity%99===0&&!ports.stashHasRoom())return false;
 ports.state.gold-=p.price;stock[p.kind]=(stock[p.kind]||0)+1;a.stock.splice(index,1);ports.save();ports.render();return true;
}

function phase6RerollPotions(){if(!ports.economyCanAct()||!ports.state.apothecary||ports.state.gold<ports.state.apothecary.refreshCost)return false;ports.state.gold-=ports.state.apothecary.refreshCost;ports.state.apothecary=WandererV012Consumables.shop(ports.economyTier(),ports.gameRandom,ports.makeId);ports.save();ports.render();return true;}

function unequipRune(index){
 if(ports.runeCheckpointLocked()||ports.PHASE1_PREVIEW&&ports.phase1Draft||ports.PHASE5_VALIDATION&&(!ports.phase5Ready||ports.saveBlocked)||ports.state.run||!Number.isInteger(index)||index<0||index>2)return false;
 ports.state.runeSlots[index]=null;ports.save();ports.renderStash();return true;
}

function salvageRune(id){
 if(ports.runeCheckpointLocked())return false;
 if(ports.PHASE5_VALIDATION&&(!ports.phase5Ready||ports.saveBlocked))return false;
 if(ports.state.run||ports.state.pendingRuneReward&&!ports.PHASE1_PREVIEW||ports.state.runeSlots.includes(id))return false;
 const rune=ports.state.runes.find(r=>r.id===id),value=rune&&ports.runeSalvageValue(rune);
 if(!value)return false;
 ports.showConfirm('Recycle Rune','Recycle '+rune.name+' (D'+rune.tier+') for '+value+' Fragments? This cannot be undone.',()=>{
  if(ports.runeCheckpointLocked()||ports.state.run||ports.state.pendingRuneReward&&!ports.PHASE1_PREVIEW||ports.state.runeSlots.includes(id))return;
  const index=ports.state.runes.findIndex(r=>r.id===id);if(index<0)return;
  const current=ports.state.runes[index],reward=ports.runeSalvageValue(current);if(!reward)return;
  ports.state.runes.splice(index,1);ports.state.fragments+=reward;
  ports.save();ports.renderStash();ports.bannerMessage('Recycled rune · +'+reward+' Fragments');
 },'Recycle Rune');
 return true;
}

function salvageDuplicateRunes(){
 if(ports.runeCheckpointLocked())return false;
 if(ports.PHASE5_VALIDATION&&(!ports.phase5Ready||ports.saveBlocked))return false;
 if(ports.state.run||ports.state.pendingRuneReward&&!ports.PHASE1_PREVIEW)return false;
 const candidates=ports.duplicateRuneCandidates();if(!candidates.length)return false;
 const ids=new Set(candidates.map(r=>r.id)),amount=candidates.reduce((sum,r)=>sum+ports.runeSalvageValue(r),0);
 ports.showConfirm('Recycle Spare Runes','Recycle '+candidates.length+' spare rune(s) for '+amount+' Fragments? The strongest rune in each family and equipped runes remain safe.',()=>{
  if(ports.runeCheckpointLocked()||ports.state.run||ports.state.pendingRuneReward&&!ports.PHASE1_PREVIEW)return;
  const safe=new Set(ports.duplicateRuneCandidates().map(r=>r.id));
  const toRecycle=ports.state.runes.filter(r=>ids.has(r.id)&&safe.has(r.id));
  if(!toRecycle.length)return;
  const reward=toRecycle.reduce((sum,r)=>sum+ports.runeSalvageValue(r),0);
  const selected=new Set(toRecycle.map(r=>r.id));
  ports.state.runes=ports.state.runes.filter(r=>!selected.has(r.id));ports.state.fragments+=reward;
  ports.save();ports.renderStash();ports.bannerMessage('Recycled '+toRecycle.length+' spare runes · +'+reward+' Fragments');
 },'Recycle Runes');
 return true;
}

function equipRune(id,index){
 if(ports.runeCheckpointLocked())return false;
 if(ports.PHASE1_PREVIEW&&ports.phase1Draft)return false;
 if(ports.PHASE5_VALIDATION&&(!ports.phase5Ready||ports.saveBlocked))return false;
 if(ports.state.run||!Number.isInteger(index)||index<0||index>2)return false;
 const rune=ports.state.runes.find(r=>r.id===id);if(!rune)return false;
 const slots=ports.state.runeSlots.slice();
 // Swap freely regardless of rune tier. Clear the rune's old slot and any other
 // rune with the same family; neither rune is destroyed or salvaged.
 for(let i=0;i<slots.length;i++){
  const other=ports.state.runes.find(r=>r.id===slots[i]);
  if(i!==index&&(slots[i]===id||other?.family===rune.family))slots[i]=null;
 }
 slots[index]=id;ports.state.runeSlots=slots;ports.phase3ClampVitals();ports.save();return true;
}

function offerBossRunes(tier){
 if(ports.state.pendingRuneReward)return;
 const pool=ports.RUNE_FAMILIES.map(x=>x.id),options=[];
 for(let i=0;i<3;i++)options.push(ports.makeRune(pool.splice(ports.roll(0,pool.length-1),1)[0],tier));
 ports.state.pendingRuneReward={tier,options};
}

function claimPendingRuneChoice(id){
 const reward=ports.state.pendingRuneReward;
 if(ports.PHASE1_PREVIEW&&ports.state.runes.length>=300){ports.bannerMessage('Recycle a spare Rune before claiming; existing Runes are preserved.');return false;}
 const picked=reward?.options.find(r=>r.id===id);
 if(!picked)return false;
 picked.isNew=true;ports.state.runes.push(picked);ports.state.pendingRuneReward=null;
 if(ports.PHASE1_PREVIEW&&ports.phase5Results.summary?.outcome==='victory'&&ports.phase5Results.summary.runeTier===picked.tier)ports.phase5Results.summary.runeName=picked.name;
 const free=ports.state.runeSlots.indexOf(null);
 if(free>=0&&!ports.state.runeSlots.some(other=>ports.state.runes.find(r=>r.id===other)?.family===picked.family))ports.state.runeSlots[free]=picked.id;
 ports.save();ports.render();
 ports.bannerMessage('Permanent rune claimed: '+picked.name+' (D'+picked.tier+').');
 return true;
}

function runeCheckpointLocked(){return ports.PHASE1_PREVIEW&&(ports.phase4Resume||ports.phase1Controller?.state.version===2&&ports.phase3ExpeditionActive());}

function phase3UsePotion(kind){
 if(ports.PHASE5_VALIDATION&&(!ports.phase5Ready||ports.saveBlocked))return false;
 // Compatibility alias: all consumption goes through the canonical Stash-backed loadout.
 const index=(ports.phase6Run?.potions||[]).findIndex(p=>p.kind===kind&&!p.used);
 return index>=0&&ports.phase6UsePotion(index);
}

function phase3ClampVitals(){
 // A lower max-HP/Mana item or Rune permanently clamps current resources in this
 // Expedition. Re-equipping stronger gear must never restore clipped HP/Mana.
 if(ports.PHASE1_PREVIEW&&ports.phase1Controller?.state.stage==='choice'&&!ports.phase1Draft&&ports.phase1Vitals){
  const next=ports.phase2Stats();
  ports.phase1Vitals.hp=Math.max(1,Math.min(next.maxhp,ports.phase1Vitals.hp));
  ports.phase1Vitals.mp=Math.max(0,Math.min(next.mana,ports.phase1Vitals.mp));
  ports.phase1Vitals.maxmp=next.mana;
 }
}
function toggleEquipmentLock(item){item.locked=!item.locked;ports.save();}
return {toggleEquipmentLock,chooseSubtype,economyTier,merchantTier,baseStatScore,offhandLocked,craftEquipment,reinforceEquipment,purchaseEquipment,sellValuables,markItemSeen,markAllAsSeen,comparisonEquip,stashCapacity,stashUpgradeCost,stashHasRoom,upgradeStash,fresh,makeSlots,starter,legendaryMatches,legendaryFor,legendarySignature,makeItem,rarityOdds,rarityRoll,rollEquipmentSlot,merchantCost,saleFragments,rollShop,economyOwnedGear,economyOwnedItem,economyCanAct,refreshMerchantStock,equipItem,unequipItem,bulkSell,salvageOne,phase3BagItems,phase3BagOverflow,phase3NeedsBagResolution,phase3DiscardLoot,phase4ClaimOverflow,phase6PotionInventory,phase6SelectPotion,phase6StartPotions,phase6ReturnPotions,phase6UsePotion,phase6BuyPotion,phase6RerollPotions,unequipRune,salvageRune,salvageDuplicateRunes,equipRune,offerBossRunes,claimPendingRuneChoice,runeCheckpointLocked,phase3UsePotion,phase3ClampVitals};
}
root.WandererV012EquipmentRuntime=Object.freeze({create});
})(globalThis);
