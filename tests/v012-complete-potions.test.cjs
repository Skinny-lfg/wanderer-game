const {test}=require('node:test'),assert=require('node:assert/strict'),create=require('./v012-economy-harness.cjs');require('../online/v012-consumables.js');const P=globalThis.WandererV012Consumables;
test('three individual owned potions, duplicates except Fortune, no free supplies, atomic return',()=>{
 const a=create(61),s=a.state();s.consumables={health:2,mana:1,fortune:1};assert(a.potions.select('health'));assert(a.potions.select('health'));assert(a.potions.select('mana'));assert.equal(a.potions.select('fortune'),false);a.start();assert.deepEqual(JSON.parse(JSON.stringify(a.potions.supplies())),{health:0,mana:0});assert(a.potions.start());assert.equal(s.consumables.health,0);a.potions.finish('extracted');assert.equal(s.consumables.health,2);a.potions.finish('extracted');assert.equal(s.consumables.health,2);
 assert.throws(()=>P.selection({fortune:2},['fortune','fortune']));
});
test('Apothecary and Blacksmith stocks/rerolls are independent; purchase cannot repeat',()=>{
 const a=create(62),s=a.state();s.gold=1000;a.rollShop();const smith=JSON.stringify(s.merchant);s.apothecary=a.potions.shop();assert.equal(s.apothecary.stock.length,4);assert(s.apothecary.stock.every(p=>['health','mana','might','arcane','ironhide','haste','fortune','barrier'].includes(p.kind)));
 const randomOnly=a.potions.shop(1,()=>.99,()=>String(Math.random()));assert(randomOnly.stock.every(p=>p.kind==='fortune'),'weighted offers include the Epic Fortune bucket');const id=s.apothecary.stock[0].id;assert(a.potions.buy(id));assert.equal(a.potions.buy(id),false);assert(a.potions.reroll());assert.equal(JSON.stringify(s.merchant),smith);
});
test('Potion of Fortune is Epic and its offer probability is exactly half the previous rate',()=>{
 const fortune=P.CATALOG.find(p=>p.id==='fortune');assert.equal(fortune.rarity,'Epic');
 const oldProbability=20/100/3,newProbability=P.OFFER_PROBABILITIES.fortune;
 assert.equal(newProbability,1/30);assert.equal(newProbability,oldProbability/2);
 assert(Math.abs(Object.values(P.OFFER_PROBABILITIES).reduce((sum,value)=>sum+value,0)-1)<1e-12);
 assert.deepEqual(Object.fromEntries(Object.entries(P.OFFER_PROBABILITIES).map(([kind,value])=>[kind,+((value*100).toFixed(6))])),{health:25.892857,mana:25.892857,might:10.357143,arcane:10.357143,ironhide:10.357143,haste:6.904762,fortune:3.333333,barrier:6.904762});
});
test('death forfeits unused loaded potions while preparation has not consumed them',()=>{const a=create(63),s=a.state();s.consumables={mana:1};a.potions.select('mana');a.start();assert.equal(s.consumables.mana,1);a.potions.start();a.potions.finish('defeat');assert.equal(s.consumables.mana,0);});
test('Stash stacks count each 99-dose group and reject purchases that exceed slots or the per-type save cap',()=>{
 const a=create(64),s=a.state();s.gold=1000;s.stash=Array.from({length:39},(_,i)=>a.makeItem(1,'belt',null,'loot','Belt','Common'));s.consumables={health:98};s.apothecary={stock:[{id:'partial',kind:'health',price:1},{id:'new-stack',kind:'health',price:1}],refreshCost:1};
 assert(a.potions.buy('partial'));assert.equal(s.consumables.health,99);const gold=s.gold;assert.equal(a.potions.buy('new-stack'),false);assert.equal(s.gold,gold);
 s.stash.pop();assert(a.potions.buy('new-stack'));assert.equal(s.consumables.health,100);
 s.stashCapacity=50;s.consumables.health=99999;s.apothecary.stock=[{id:'cap',kind:'health',price:1}];const cappedGold=s.gold;assert.equal(a.potions.buy('cap'),false);assert.equal(s.gold,cappedGold);
});
test('legacy separate health and mana supplies migrate once into Stash consumables',()=>{
 const a=create(65);a.start();const checkpoint=a.checkpoint.capture();checkpoint.session.supplies={health:2,mana:1};a.checkpoint.restore(checkpoint);
 assert.deepEqual(JSON.parse(JSON.stringify(a.state().consumables)),{health:2,mana:1});const migrated=a.checkpoint.capture();assert.deepEqual(JSON.parse(JSON.stringify(migrated.session.supplies)),{health:0,mana:0});a.checkpoint.restore(migrated);assert.deepEqual(JSON.parse(JSON.stringify(a.state().consumables)),{health:2,mana:1});
});
