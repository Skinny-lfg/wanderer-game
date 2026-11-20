'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const create=require('./v012-economy-harness.cjs');
require('../economy/v013-crafting.js');
const C=globalThis.WandererV013Crafting;

test('Native loot Daggers equip into either hand; two-handed main prevents offhand',()=>{
 const a=create(8,undefined,{}, {skipPersistence:true});
 a.setup(5,'Sword');
 const dagger=a.makeItem(5,'weapon',null,'loot','Daggers','Rare');
 a.state().stash.push(dagger);
 assert.equal(a.equip(dagger.id,'offhand'),true);
 assert.equal(a.state().equip.offhand.id,dagger.id);
 assert.equal(a.state().equip.weapon.subtype,'Sword',
  'equipping a secondary dagger should not replace the main weapon');
 const second=a.makeItem(5,'weapon',null,'loot','Daggers','Rare');
 a.state().stash.push(second);
 assert.equal(a.equip(second.id,'weapon'),true);
 assert.equal(a.state().equip.weapon.id,second.id);
 const heavy=a.makeItem(5,'weapon',null,'loot','Two-Handed','Rare');
 a.state().stash.push(heavy);
 assert.equal(a.equip(heavy.id,'weapon'),true);
 assert.equal(a.state().equip.offhand,null,'heavy weapon clears an equipped offhand');
 const third=a.makeItem(5,'weapon',null,'loot','Daggers','Rare');
 a.state().stash.push(third);
 assert.equal(a.equip(third.id,'offhand'),false,
  'heavy main hand cannot be combined with a secondary dagger');
 const html=fs.readFileSync('index.html','utf8');
 assert.match(html,/isDagger\(item\)\?\[\['weapon','Equip Main Hand'\],\['offhand','Equip Off-Hand'\]\]/);
});

test('Current Forge offers native offhands and rejects removed historical recipe IDs',()=>{
 for(const subtype of ['Shield','Orb','Tome','Charm'])
  for(const rarity of ['Uncommon','Rare'])
   assert(C.RECIPES.some(r=>r.slot==='offhand'&&r.subtype===subtype&&r.rarity===rarity));
 assert(!C.RECIPES.some(r=>r.subtype==='Off-Hand Dagger'),
  'secondary Daggers remain normal loot rather than a deprecated Forge recipe');
 const rare=C.RECIPES.find(r=>r.slot==='offhand'&&r.subtype==='Orb'&&r.rarity==='Rare');
 assert(rare&&C.valid({...C.create(),learnedRecipes:[rare.id]}),
  'legal current recipes must remain valid');
 assert(!C.valid({...C.create(),learnedRecipes:['blue_offdagger']}),
  'clean-sheet v0.13 must not validate removed historical recipe names');
});
