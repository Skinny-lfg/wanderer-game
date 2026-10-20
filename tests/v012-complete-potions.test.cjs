const {test}=require('node:test'),assert=require('node:assert/strict'),create=require('./v012-economy-harness.cjs');require('../online/v012-consumables.js');const P=globalThis.WandererV012Consumables;
test('three individual owned potions, duplicates except Fortune, no free supplies, atomic return',()=>{
 const a=create(61),s=a.state();s.consumables={health:2,mana:1,fortune:1};assert(a.potions.select('health'));assert(a.potions.select('health'));assert(a.potions.select('mana'));assert.equal(a.potions.select('fortune'),false);a.start();assert.deepEqual(JSON.parse(JSON.stringify(a.potions.supplies())),{health:0,mana:0});assert(a.potions.start());assert.equal(s.consumables.health,0);a.potions.finish('extracted');assert.equal(s.consumables.health,2);a.potions.finish('extracted');assert.equal(s.consumables.health,2);
 assert.throws(()=>P.selection({fortune:2},['fortune','fortune']));
});
test('Apothecary and Blacksmith stocks/rerolls are independent; purchase cannot repeat',()=>{
 const a=create(62),s=a.state();s.gold=1000;a.rollShop();const smith=JSON.stringify(s.merchant);s.apothecary=a.potions.shop();assert.equal(s.apothecary.stock.length,4);assert(s.apothecary.stock.some(p=>p.kind==='health'));assert(s.apothecary.stock.some(p=>p.kind==='mana'));const id=s.apothecary.stock[0].id;assert(a.potions.buy(id));assert.equal(a.potions.buy(id),false);assert(a.potions.reroll());assert.equal(JSON.stringify(s.merchant),smith);
});
test('death forfeits unused loaded potions while preparation has not consumed them',()=>{const a=create(63),s=a.state();s.consumables={mana:1};a.potions.select('mana');a.start();assert.equal(s.consumables.mana,1);a.potions.start();a.potions.finish('defeat');assert.equal(s.consumables.mana,0);});
