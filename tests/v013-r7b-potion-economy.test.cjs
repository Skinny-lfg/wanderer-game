'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
require('../economy/v013-crafting.js');require('../online/v012-consumables.js');
const P=globalThis.WandererV012Consumables,C=globalThis.WandererV013Crafting,create=require('./v012-economy-harness.cjs');
const clone=x=>JSON.parse(JSON.stringify(x));
test('R7B rarity weights and exact deterministic boundaries retain four independent offers',()=>{
 assert.deepEqual(P.RARITY_OFFER_WEIGHTS,{Common:4800,Uncommon:3000,Rare:1600,Epic:600});
 for(const [roll,rarity] of [[0,'Common'],[.47999,'Common'],[.48,'Uncommon'],[.77999,'Uncommon'],[.78,'Rare'],[.93999,'Rare'],[.94,'Epic'],[.99999,'Epic']]){
  const values=[roll,0],kind=P.offer(()=>values.shift());assert.equal(P.CATALOG.find(p=>p.id===kind).rarity,rarity);assert.equal(values.length,0);
 }
 for(const id of ['fortune','wisdom','prospector'])assert.equal(P.OFFER_PROBABILITIES[id],.02);
 const values=[.1,0,.5,0,.8,0,.95,0];let id=0;const shop=P.shop(10,()=>values.shift(),()=>String(++id));assert.equal(shop.stock.length,4);assert.deepEqual(shop.stock.map(p=>P.CATALOG.find(q=>q.id===p.kind).rarity),['Common','Uncommon','Rare','Epic']);
 assert.equal(shop.refreshCost,17);for(const offer of shop.stock)assert.equal(offer.price,Math.ceil(P.CATALOG.find(p=>p.id===offer.kind).base*2.2));
 assert.equal(values.length,0);
});
test('Uncommon uses exactly its approved thematic Reagent, Prospector uses Essence only',()=>{
 const expected={might:'blood',arcane:'arcane',ironhide:'aegis',trail:'fury',scout:'fury',purifying:'radiance',renewal:'radiance'};
 for(const [id,family] of Object.entries(expected)){const r=P.RECIPES.find(q=>q.id===id);assert.deepEqual(r.reagents,{[family]:1});assert.equal(r.essence,3);}
 const r=P.RECIPES.find(q=>q.id==='prospector');assert.deepEqual(r.reagents,{});assert.equal(r.essence,8);
});
test('native crafting with no Reagents permits Prospector but rejects ordinary Rare and Epic',()=>{
 const a=create(8701,undefined,{}, {skipPersistence:true}),s=a.state();s.crafting=C.create();s.crafting.essence=8;s.gold=100;s.fragments=100;s.consumables={};s.potionSelection=[];
 assert.equal(a.potions.craft('wisdom'),false);assert.equal(a.potions.craft('withering'),false);const before=clone(s.crafting.cores);
 assert(a.potions.craft('prospector'));assert.equal(s.crafting.essence,0);assert.deepEqual(clone(s.crafting.cores),before);assert.equal(s.consumables.prospector,1);assert.equal(s.gold,100);assert.equal(s.fragments,100);assert.equal(a.potions.craft('prospector'),false);
});
test('native single-Reagent Uncommon payment is exact and cannot consume unrelated families',()=>{
 const a=create(8702,undefined,{}, {skipPersistence:true}),s=a.state();s.crafting=C.create();s.crafting.essence=3;s.crafting.cores.radiance=1;s.consumables={};s.potionSelection=[];
 assert(a.potions.craft('renewal'));assert.equal(s.crafting.essence,0);assert.equal(s.crafting.cores.radiance,0);assert.equal(s.crafting.cores.blood,0);assert.equal(s.consumables.renewal,1);
});
