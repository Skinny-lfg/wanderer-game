'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const create=require('./v012-economy-harness.cjs');

test('equipping gear clears NEW only on the equipped item and persists it with the equip',()=>{
 const a=create(441),s=a.state(),chosen=a.makeItem(2,'belt',null,'loot','Leather','Rare'),untouched=a.makeItem(2,'boots',null,'loot','Leather','Rare');
 chosen.isNew=true;untouched.isNew=true;s.stash.push(chosen,untouched);
 assert.equal(a.equip(chosen.id),true);
 assert.equal(s.equip.belt.isNew,false);
 assert.equal(s.stash.find(item=>item.id===untouched.id).isNew,true);
});

test('Merchant always stocks four Weapons, four Armor and four Accessories',()=>{
 const a=create(98),state=a.state();state.gold=100000;a.rollShop();
 const groups={weapons:['weapon','offhand'],armor:['helm','armor','gloves','boots','belt'],accessories:['ring1','ring2','amulet']};
 const check=()=>{assert.equal(state.merchant.stock.length,12);for(const slots of Object.values(groups))assert.equal(state.merchant.stock.filter(o=>slots.includes(o.slot)).length,4);};
 check();a.refresh('gear');check();
 const item=state.merchant.stock[0];const category=Object.values(groups).find(slots=>slots.includes(item.slot));a.buy(0);check();assert(category.includes(state.merchant.stock[0].slot));
});

test('Merchant category restock replaces only the active four offers at the existing full-restock price',()=>{
 const a=create(912),state=a.state();state.gold=100000;a.rollShop();
 const groups={weapons:['weapon','offhand'],armor:['helm','armor','gloves','boots','belt'],accessories:['ring1','ring2','amulet']};
 const ids=category=>state.merchant.stock.filter(item=>groups[category].includes(item.slot)).map(item=>item.id),before=Object.fromEntries(Object.keys(groups).map(category=>[category,ids(category)]));
 const gold=state.gold,cost=state.merchant.refreshCost,refreshes=state.merchant.refreshes;a.refresh('gear','armor');
 assert.equal(state.gold,gold-cost);assert.equal(state.merchant.refreshes,refreshes+1);
 assert.notDeepEqual(ids('armor'),before.armor);assert.deepEqual(ids('weapons'),before.weapons);assert.deepEqual(ids('accessories'),before.accessories);
 for(const [category,slots]of Object.entries(groups))assert.equal(state.merchant.stock.filter(item=>slots.includes(item.slot)).length,4,category);
 const unchanged=JSON.stringify(state.merchant.stock),remaining=state.gold;a.refresh('gear','unknown');assert.equal(JSON.stringify(state.merchant.stock),unchanged);assert.equal(state.gold,remaining);
});

test('Merchant sells a Belt; obsolete Sigil rerolls cannot spend Gold',()=>{
 const a=create(9),s=a.state();s.gold=10000;a.rollShop();
 const belt=a.makeItem(1,'belt',null,'merchant','Leather','Rare');belt.goldPrice=a.merchantCost(belt);s.merchant.stock=[belt];
 const before=s.gold;assert.equal(a.purchaseNative(0),true);assert(s.stash.some(i=>i.id===belt.id));assert.equal(s.gold,before-belt.goldPrice);
 const after=s.gold;a.refresh('sigils');assert.equal(s.gold,after);assert.equal(s.merchant.sigils.length,0);
});

test('Phase A.2 Sword/Shield reduction matches the public PvP stat projection',async()=>{
 const {totalStats}=await import('../online/pvp-stats.mjs');
 const sword={slot:'weapon',subtype:'Sword',tier:50,rarity:'Rare',atk:20,str:5};
 const shield={slot:'offhand',subtype:'Shield',tier:50,rarity:'Rare',def:20,end:5};
 assert.equal(totalStats({weapon:sword,offhand:shield}).blockReduction,.62);
});

test('daggers equip in either hand with 50% offhand offense and retain 2H lock',()=>{
 const a=create(27),s=a.state();
 assert(a.types.includes('Daggers'));assert(!a.offhandTypes.includes('Off-Hand Dagger'));
 assert(!a.gear.dungeonEquipmentOdds({}).some(x=>x.subtype==='Off-Hand Dagger'));
 const item=a.makeItem(20,'weapon',null,'loot','Daggers','Rare');
 const main=a.baseStats({weapon:item}),off=a.baseStats({offhand:item});
 assert.equal(off.agi-5,(main.agi-5)/2);
 assert.equal(off.atkFlat,main.atkFlat/2);assert.equal(off.spdFlat,main.spdFlat/2);
 s.stash.push(item);assert.equal(a.equip(item.id,'offhand'),true);
 assert.equal(s.equip.offhand.slot,'offhand');assert.equal(a.unequip('offhand'),true);
 assert.equal(a.equip(item.id,'weapon'),true);assert.equal(s.equip.weapon.slot,'weapon');
 assert.equal(a.unequip('weapon'),true);
 s.equip.weapon=a.makeItem(20,'weapon',null,'loot','Bow','Rare');
 assert.equal(a.equip(item.id,'offhand'),false);assert(s.stash.some(x=>x.id===item.id));
});
