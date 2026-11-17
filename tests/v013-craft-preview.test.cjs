'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),create=require('./v012-economy-harness.cjs');
require('../economy/v013-crafting.js');
const C=globalThis.WandererV013Crafting;
test('every Forge recipe previews the same guaranteed profile, rarity, tier and functional trait; stat values are sample rolls',()=>{
 const a=create(421,undefined,{}, {now:1700000000000});
 a.state().fragments=10000000;
 a.state().crafting={...C.create(),essence:1000000,cores:Object.fromEntries(C.FAMILIES.map(f=>[f,100])),realmFamilies:[...C.FAMILIES],bossFamilies:[...C.FAMILIES]};
 for(const tier of [1,6,201])for(const recipe of C.RECIPES){
  const focus=recipe.slot==='armor'?({Cloth:'spellweave',Leather:'quickstep',Plate:'bulwark'}[recipe.subtype]):'none',before=JSON.stringify(a.state());
  const preview=C.previewCraft(recipe.id,tier,(...args)=>a.makeItem(...args,true),focus);
  assert(preview,recipe.id);assert.equal(JSON.stringify(a.state()),before,'preview must not mutate save');
  const crafted=C.prepareCraft(a.state(),recipe.id,tier,a.makeItem,focus).item;
  for(const key of ['armorType','v013Trait','v013CraftFocus','craftingProfile','tier','slot','subtype','rarity','recipeId'])
   assert.equal(preview[key],crafted[key],recipe.id+' '+key);
  const primary=['str','agi','int','end','cha'];
  assert(preview[recipe.profile]>0,recipe.id+' preview should have guaranteed attribute focus');
  assert(crafted[recipe.profile]>0,recipe.id+' crafting should have guaranteed attribute focus');
  assert(primary.filter(k=>k!==recipe.profile).every(k=>!crafted[k]));
  assert.equal(JSON.stringify(a.state()),before,'craft preparation is transactional');
 }
});
test('browsing previews consumes neither gameplay RNG nor item IDs',()=>{
 const a=create(422,undefined,{}, {now:1700000000000}),b=create(422,undefined,{}, {now:1700000000000});
 for(const recipe of C.RECIPES)C.previewCraft(recipe.id,1,(...args)=>a.makeItem(...args,true));
 assert.equal(JSON.stringify(a.makeItem(6,'weapon',null,'loot','random')),JSON.stringify(b.makeItem(6,'weapon',null,'loot','random')));
});
test('armor profiles stay coherent, while Plate chooses Endurance OR Strength instead of having both automatically',()=>{
 const a=create(423);
 for(const [type,keys]of [['Cloth',['int']],['Leather',['agi']],['Plate',['end','str']]]){
  const item=a.makeItem(1,'armor',null,'forge',type,'Uncommon',true);
  assert.equal(item.armorType,type);
  assert(keys.some(k=>item[k]>0),type+' should have an allowed primary stat');
  for(const other of ['str','agi','int','end'])if(!keys.includes(other))assert.equal(item[other],0,type+' should not grant '+other);
 }
});
