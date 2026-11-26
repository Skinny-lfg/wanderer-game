'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
require('../economy/v013-crafting.js');require('../online/v012-consumables.js');
const P=globalThis.WandererV012Consumables,C=globalThis.WandererV013Crafting,create=require('./v012-economy-harness.cjs');
const clone=x=>JSON.parse(JSON.stringify(x));
function setup(seed=8600){const a=create(seed,undefined,{}, {skipPersistence:true}),s=a.state();s.crafting=C.create();s.crafting.essence=100;for(const f of C.FAMILIES)s.crafting.cores[f]=10;s.consumables={};s.potionSelection=[];s.gold=777;s.fragments=99;return {a,s};}
test('R7B has exactly one fixed known recipe per catalog entry and calibrated reagent requirements',()=>{
 assert.equal(P.RECIPES.length,21);assert.deepEqual(P.RECIPES.map(r=>r.id),P.CATALOG.map(p=>p.id));
 for(const r of P.RECIPES){const p=P.CATALOG.find(p=>p.id===r.id);assert.equal(r.essence,({Common:2,Uncommon:3,Rare:5,Epic:8})[p.rarity]);assert.equal(Object.keys(r.reagents).length,p.rarity==='Common'||r.id==='prospector'?0:p.rarity==='Uncommon'?1:2);for(const [f,n] of Object.entries(r.reagents)){assert(C.FAMILIES.includes(f));assert.equal(n,1);}}
 const approved={wisdom:['radiance','arcane'],rejuvenation:['radiance','arcane'],withering:['blood','decay'],precision:['fury','blood'],phantom:['fury','aegis'],prospector:[],executioner:['fury','decay'],renewal:['radiance']};
 for(const [id,pair] of Object.entries(approved))assert.deepEqual(Object.keys(P.RECIPES.find(r=>r.id===id).reagents),pair);
});
test('all 21 native crafts pay exactly their resources and grant exactly one dose',()=>{
 for(const r of P.RECIPES){const {a,s}=setup();const prior=clone(s.crafting),shop=JSON.stringify(s.apothecary);assert(a.potions.craft(r.id),r.id);assert.equal(s.consumables[r.id],1);assert.deepEqual(clone(s.potionSelection),[r.id]);assert.equal(s.crafting.essence,prior.essence-r.essence);for(const f of C.FAMILIES)assert.equal(s.crafting.cores[f],prior.cores[f]-(r.reagents[f]||0));assert.equal(s.gold,777);assert.equal(s.fragments,99);assert.equal(JSON.stringify(s.apothecary),shop);assert(C.valid(s.crafting));}
});
test('same reagent pair crafts only the explicitly selected potion',()=>{
 const {a,s}=setup();assert(a.potions.craft('wisdom'));assert.equal(s.consumables.wisdom,1);assert.equal(s.consumables.rejuvenation,undefined);assert(a.potions.craft('rejuvenation'));assert.equal(s.consumables.rejuvenation,1);assert.equal(s.crafting.essence,87);assert.equal(s.crafting.cores.radiance,8);assert.equal(s.crafting.cores.arcane,8);
});
test('missing Essence or either Reagent rejects atomically; unknown IDs rejected',()=>{
 for(const missing of ['essence','blood','decay']){const {a,s}=setup();if(missing==='essence')s.crafting.essence=4;else s.crafting.cores[missing]=0;const before=JSON.stringify(s);assert.equal(a.potions.craft('withering'),false);assert.equal(JSON.stringify(s),before);assert.equal(a.potions.craft('nonexistent'),false);}
});
test('full loadout and Stash honor partial stacks, capacity, unique and per-type cap',()=>{
 const {a,s}=setup();s.consumables={health:99,mana:1,wisdom:1};s.potionSelection=['health','mana','wisdom'];s.stash=Array.from({length:a.storage.capacity()-1},(_,i)=>a.makeItem(1,'belt',null,'loot','Belt','Common'));
 assert.equal(a.storage.occupied(),a.storage.capacity());assert(a.potions.craft('health'));assert.equal(s.consumables.health,100);assert.equal(a.potions.craft('health'),false);assert.equal(a.potions.craft('phantom'),false);assert.deepEqual(clone(s.potionSelection),['health','mana','wisdom']);
 s.stash.pop();assert(a.potions.craft('phantom'));assert.equal(s.consumables.phantom,1);s.consumables.health=99999;assert.equal(a.potions.craft('health'),false);
});
test('a free slot accepts a new type even with full Stash, duplicate unique dose stays in Stash',()=>{
 const {a,s}=setup();s.stash=Array.from({length:a.storage.capacity()},(_,i)=>a.makeItem(1,'belt',null,'loot','Belt','Common'));assert(a.potions.craft('wisdom'));assert.equal(a.potions.craft('wisdom'),false);s.stash.pop();assert(a.potions.craft('wisdom'));assert.equal(s.consumables.wisdom,2);assert.deepEqual(clone(s.potionSelection),['wisdom']);
});
test('craft blocked during expedition and save failure rolls back every paid material and dose',()=>{
 const {a,s}=setup();const before=JSON.stringify(s);a.potions.failPersistence();assert.equal(a.potions.craft('withering'),false);assert.equal(JSON.stringify(s),before);
 const env=setup(8601);env.a.start(1,true);const active=JSON.stringify(env.s);assert.equal(env.a.potions.craft('withering'),false);assert.equal(JSON.stringify(env.s),active);
});
test('craft preview shows selected recipe, live material availability and disabled action',()=>{
 const {a,s}=setup();s.crafting.cores.blood=0;const markup=a.potions.craftMarkup('withering');assert.match(markup,/data-potion-material="blood"/);assert.match(markup,/Blood Reagent · 0 \/ 1/);assert.match(markup,/data-potion-material="decay"/);assert.match(markup,/data-potion-craft="withering" disabled/);assert.match(markup,/Missing crafting materials/);assert.equal((markup.match(/<option value=/g)||[]).length,21);
 s.crafting.cores.blood=1;assert.doesNotMatch(a.potions.craftMarkup('withering'),/data-potion-craft="withering" disabled/);
});
test('prepared craft is pure and can be persisted through existing checkpoint restore',()=>{
 const {a,s}=setup();const before=JSON.stringify(s);const next=P.prepareCraft(s,'renewal',true);assert(next);assert.equal(JSON.stringify(s),before);
 assert(a.potions.craft('renewal'));a.start(1,true);const cp=a.checkpoint.capture();a.checkpoint.restore(cp);assert.equal(a.state().consumables.renewal,1);assert.equal(a.state().crafting.essence,97);assert.equal(a.state().crafting.cores.radiance,9);assert.equal(a.state().crafting.cores.blood,10);
});
