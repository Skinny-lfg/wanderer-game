'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
require('../economy/v013-crafting.js');require('../online/v012-consumables.js');
const C=globalThis.WandererV013Crafting,P=globalThis.WandererV012Consumables,create=require('./v012-economy-harness.cjs');
const clone=x=>JSON.parse(JSON.stringify(x));
function setup(seed=8730){const a=create(seed,undefined,{}, {skipPersistence:true}),s=a.state();s.crafting=C.create();s.crafting.essence=100;for(const f of C.FAMILIES)s.crafting.cores[f]=10;s.consumables={};s.potionSelection=[];s.gold=777;s.fragments=999;return {a,s};}
test('Camp purchase, restock and potion selection roll back on synchronous persistence rejection',()=>{
 const {a,s}=setup();s.consumables={health:1};s.apothecary={stock:[{id:'p',kind:'mana',price:16}],refreshCost:13};
 const before=JSON.stringify(s);a.potions.failPersistence();assert.equal(a.potions.buy('p'),false);assert.equal(JSON.stringify(s),before);
 assert.equal(a.potions.reroll(),false);assert.equal(JSON.stringify(s),before);assert.equal(a.potions.select('health'),false);assert.equal(JSON.stringify(s),before);
});
test('removing a potion cannot create a new stack in a full Stash, but can fill an existing stack',()=>{
 const {a,s}=setup();s.consumables={health:1};s.potionSelection=['health'];s.stash=Array.from({length:a.storage.capacity()},(_,i)=>a.makeItem(1,'belt',null,'loot','Belt','Common'));
 const prior=JSON.stringify(s);assert.equal(a.potions.select('health',true),false);assert.equal(JSON.stringify(s),prior);
 s.stash.pop();assert(a.potions.select('health',true));assert.equal(a.storage.occupied(),a.storage.capacity());assert(a.potions.select('health'));assert.equal(a.storage.occupied(),a.storage.capacity()-1);
 s.consumables.health=2;assert.equal(a.storage.occupied(),a.storage.capacity());assert(a.potions.select('health',true));assert.equal(a.storage.occupied(),a.storage.capacity());
});
test('native craft and Forge share precisely the same Reagents and Essence',()=>{
 const {a,s}=setup();const r=C.RECIPES.find(r=>r.rarity==='Rare'),price=C.cost(r.id,1);
 s.crafting.learnedRecipes=[r.id];s.crafting.essence=price.essence+3;for(const f of C.FAMILIES)s.crafting.cores[f]=price.reagents[f]||0;
 const kind=P.CATALOG.find(p=>p.rarity==='Uncommon'&&Object.keys(P.RECIPES.find(q=>q.id===p.id).reagents).some(f=>price.reagents[f])).id;
 const reagent=Object.keys(P.RECIPES.find(q=>q.id===kind).reagents)[0];assert(a.forge.progress(r.id,1).ready);
 assert(a.potions.craft(kind));assert.equal(s.crafting.essence,price.essence);assert.equal(s.crafting.cores[reagent],price.reagents[reagent]-1);assert.equal(a.forge.progress(r.id,1).ready,false);assert.equal(a.forge.craft(r.id,1),null);
});
function marked(seed=8733){const {a,s}=setup(seed);a.start(1,true);const c=a.controller(),card=c.state.dungeon.cards[0];c.chooseRealm(card.id);c.state.dungeon.cleared.push(card.objective);return {a,s,c,card,d:c.state.dungeon};}
test('marked Elite settlement is once only, safe-exit only and respects wallet caps',()=>{
 const {a,s,card,d}=marked();s.crafting.essence=999999999;s.crafting.cores[card.family]=1000000000;
 const before=JSON.stringify(s.crafting);a.events.settle('defeat');assert.equal(JSON.stringify(s.crafting),before);assert(!d.contractPaid);
 a.events.settle('extracted');assert.equal(s.crafting.essence,1000000000);assert.equal(s.crafting.cores[card.family],1000000000);assert(C.valid(s.crafting));assert(d.contractPaid);
 const paid=JSON.stringify(s.crafting);a.events.settle('extracted');assert.equal(JSON.stringify(s.crafting),paid);
});
function normal(seed,prospector,roll,bounty=false,cap=false){
 const {a,s}=setup(seed);s.crafting=C.create();s.crafting.essence=cap?999999999:8;
 if(prospector)assert(a.potions.craft('prospector'));
 a.start(1,true);const c=a.controller(),card=c.state.dungeon.cards[0];c.chooseRealm(card.id);
 assert(c.visitRoom(1));assert(a.enter());const r=s.run;r.phase6Bounty=bounty;a.rng(roll);
 while(r.status==='fight'){r.enemy.hp=0;a.win();}
 return {a,s,card,c};
}
test('crafted Prospector reaches real encounter reward path at the new random threshold',()=>{
 const base=normal(8734,false,.24),boost=normal(8734,true,.24);
 assert.equal(base.s.crafting.cores[base.card.family],0);assert.equal(boost.s.crafting.cores[boost.card.family],1);assert.equal(boost.s.crafting.essence,1);assert.equal(boost.s.consumables.prospector,0);
 assert.equal(boost.a.events.run().effects.prospector,true);
 const high=normal(8735,true,.28);assert.equal(high.s.crafting.cores[high.card.family],0);
});
test('native Bounty bonus cannot overflow the valid Essence wallet',()=>{
 const {s}=normal(8736,false,.9,true,true);assert.equal(s.crafting.essence,1000000000);assert(C.valid(s.crafting));
});
