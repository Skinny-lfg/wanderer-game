'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const create=require('./v012-economy-harness.cjs');
require('../economy/v013-crafting.js');
const C=globalThis.WandererV013Crafting;

test('Stage 7.1 level one starts with no free talent points',()=>{
 const a=create(7101),T=a.talents,p=T.create();
 assert(T.valid(p));assert.equal(T.earned(p),0);assert.equal(T.allocate(p,'root_blood'),null);
 const one=T.award(p,100);assert.equal(T.earned(one),1);assert(T.allocate(one,'root_blood'));
 assert(!Object.prototype.hasOwnProperty.call(p,'starterPoints'),'new characters must not have a starter bonus');
});
test('Stage 7.1 Blueprints unlock only once and never just by clearing a Realm',()=>{
 let p=C.create();assert(C.valid(p));assert(C.unlocked(p,'green_sword'));assert(!C.unlocked(p,'blue_sword'));
 p=C.award(p,{family:'blood',boss:true});assert(!C.unlocked(p,'blue_sword'));
 const next=C.discover(p,'blue_sword');assert(next);assert(C.unlocked(next,'blue_sword'));assert(!C.unlocked(p,'blue_sword'));
 assert.equal(C.discover(next,'blue_sword'),null);
 assert.equal(C.discover(next,'green_sword'),null);
 assert(!C.valid({...next,learnedRecipes:['blue_sword','blue_sword']}));
});
test('Stage 7.1 UI only exposes preview Forge with named equipment tiers',()=>{
 const source=fs.readFileSync('index.html','utf8');
 assert(source.includes("if(PHASE1_PREVIEW){phase3BlacksmithOperation='forge';renderForge();}"));
 assert(source.includes('Known Blueprints:'));
 assert(!fs.readFileSync('online/v012-expedition-runtime.js','utf8').includes('targetRecipe'),'old tracked route targeting removed');
 assert(source.includes('Undiscovered Blueprints'));
 assert(!source.includes('id="v013TrackRecipe"'));
 assert(!source.includes('starterPoints:2'));
 assert(source.includes("Example stat roll · '+esc(WandererExpeditionProgression.gearTier(price.tier).name)+'"));
});
