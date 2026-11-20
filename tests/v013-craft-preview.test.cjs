'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),create=require('./v012-economy-harness.cjs');
require('../economy/v013-crafting.js');
const C=globalThis.WandererV013Crafting;
test('all Forge recipes preview type, tier, rarity and Epic trait; attribute values are illustrative',()=>{
 const a=create(421,undefined,{}, {now:1700000000000});
 a.state().fragments=10000000;
 a.state().crafting={...C.create(),essence:1000000,
  cores:Object.fromEntries(C.FAMILIES.map(f=>[f,100])),
  realmFamilies:[...C.FAMILIES],bossFamilies:[...C.FAMILIES],
  learnedRecipes:C.RECIPES.filter(r=>r.rarity!=='Uncommon').map(r=>r.id)};
 for(const tier of [1,6,201])for(const recipe of C.RECIPES){
  const before=JSON.stringify(a.state());
  const example=C.previewCraft(recipe.id,tier,(...args)=>a.makeItem(...args,true));
  assert(example,recipe.id);
  assert.equal(JSON.stringify(a.state()),before,'preview must not mutate save');
  const result=C.prepareCraft(a.state(),recipe.id,tier,a.makeItem);
  assert(result,recipe.id);
  const actual=result.item;
  for(const key of ['armorType','v013Trait','tier','slot','subtype','rarity','recipeId'])
   assert.equal(example[key],actual[key],recipe.id+' '+key);
  assert.equal(actual.v013CraftFocus,undefined);
  assert.equal(recipe.profile,undefined,'recipes must not force primary stats');
  assert(actual.affixes.length>=2&&actual.affixes.length<=5);
  assert.equal(JSON.stringify(a.state()),before,'preparing a craft is transactional');
 }
});
test('browsing previews consumes neither gameplay RNG nor item IDs',()=>{
 const a=create(422,undefined,{}, {now:1700000000000}),b=create(422,undefined,{}, {now:1700000000000});
 for(const recipe of C.RECIPES)C.previewCraft(recipe.id,1,(...args)=>a.makeItem(...args,true));
 assert.equal(JSON.stringify(a.makeItem(6,'weapon',null,'loot','random')),JSON.stringify(b.makeItem(6,'weapon',null,'loot','random')));
});
test('armor type keeps its base defense while primary stats are free to vary',()=>{
 const a=create(423),seen={Cloth:new Set(),Leather:new Set(),Plate:new Set()};
 for(const type of Object.keys(seen)){
  for(let i=0;i<150;i++){
   const x=a.makeItem(20,'armor',null,'loot',type,'Rare');
   assert.equal(x.armorType,type);assert(x.def>0);
   for(const key of ['str','agi','int','end','cha'])if(x[key]>0)seen[type].add(key);
  }
  assert(seen[type].has('int'),type+' can roll Intellect');
  assert(seen[type].size>=3,type+' rolls multiple primary types');
 }
});
