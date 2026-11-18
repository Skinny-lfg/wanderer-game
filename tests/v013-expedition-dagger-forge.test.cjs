const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const create=require('./v012-economy-harness.cjs');
require('../economy/v013-crafting.js');const C=globalThis.WandererV013Crafting;
test('Expedition loot dagger can equip in either hand, and two-handed weapons block off-hand',()=>{
 const a=create(8);a.setup(5,'Sword');a.rollShop();a.start(1);a.initial('blood');a.controller().state.planeIndex=2;
 const dagger=a.makeItem(5,'weapon',null,'loot','Daggers','Rare');a.bag.mark(dagger);assert.equal(a.equip(dagger.id,'offhand'),true);assert.equal(a.state().equip.offhand.id,dagger.id);
 const second=a.makeItem(5,'weapon',null,'loot','Daggers','Rare');a.bag.mark(second);assert.equal(a.equip(second.id,'weapon'),true);assert.equal(a.state().equip.weapon.id,second.id);
 const heavy=a.makeItem(5,'weapon',null,'loot','Two-Handed','Rare');a.bag.mark(heavy);assert.equal(a.equip(heavy.id,'weapon'),true);const third=a.makeItem(5,'weapon',null,'loot','Daggers','Rare');a.bag.mark(third);assert.equal(a.equip(third.id,'offhand'),false);
 const html=fs.readFileSync('index.html','utf8');assert.match(html,/isDagger\(item\)\?\[\['weapon','Equip Main Hand'\],\['offhand','Equip Off-Hand'\]\]/);
});
test('Forge offers both missing offhands while preserving old learned recipe validation',()=>{
 for(const subtype of ['Shield','Orb','Tome','Charm'])for(const rarity of ['Uncommon','Rare'])assert(C.RECIPES.some(r=>r.slot==='offhand'&&r.subtype===subtype&&r.rarity===rarity));
 assert(!C.RECIPES.some(r=>r.subtype==='Off-Hand Dagger'));assert(C.valid({...C.create(),learnedRecipes:['blue_offdagger']}));
});
