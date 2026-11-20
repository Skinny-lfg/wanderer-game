'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const create=require('./v012-economy-harness.cjs');

test('Forge and Merchant prices use Expedition unlocks without touching legacy progress',()=>{
 const a=create(14),s=a.state();a.setUnlocked(80);s.fragments=10000;s.gold=10000;
 s.crafting.essence=4;const id='green_armor_plate',cost=a.forge.progress(id,80).cost;const crafted=a.forge.craft(id,80);
 assert.equal(crafted.tier,70);assert.equal(crafted.source,'forge');assert.notEqual(crafted.rarity,'Legendary');
 assert.equal(crafted.craftPrice,cost.fragments);assert.equal(s.fragments,10000-cost.fragments);assert(a.sale(crafted)<=Math.floor(cost.fragments*.25));
 a.rollShop();a.buy(0);assert.equal(s.stash.at(-1).tier,70);assert.equal(s.stash.at(-1).source,'merchant');
 assert.equal(s.maxDungeon,1);assert.equal(s.onlineProgress.deepestCleared,0);
 const stock=s.merchant.stock.map(i=>i.id).join(),gold=s.gold;
 a.refresh('sigils');assert.equal(s.merchant.stock.map(i=>i.id).join(),stock);assert.equal(s.gold,gold);
 const sigils=s.merchant.sigils.join();a.refresh('gear');assert.equal(s.merchant.sigils.join(),sigils);
 assert.equal(a.build(),null,'gear Sigils do not grant temporary families');
});

test('Camp salvage remains available with secured bag overflow without discarding loot',()=>{
 const a=create(7302),s=a.state();s.gold=s.fragments=50000;
 const chosen=a.makeItem(1,'belt',null,'loot','Belt','Common');s.stash.push(chosen);
 a.controller().state.stage='failed';
 for(let i=0;i<13;i++)a.bag.mark(a.makeItem(1,'helm',null,'loot','Helm','Common'));
 assert(a.bag.overflow()>0);assert.equal(a.economyCanAct(),true);
 const retained=a.bag.items().map(item=>item.id).sort();a.salvage([chosen.id]);
 assert(!s.stash.some(item=>item.id===chosen.id));
 assert.deepEqual(a.bag.items().map(item=>item.id).sort(),retained);
});
