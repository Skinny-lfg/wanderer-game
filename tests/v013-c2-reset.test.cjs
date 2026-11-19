'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
require('../combat/v013-expedition-foundation.js');
require('../online/v013-map-intelligence.js');
require('../economy/v013-crafting.js');
require('../online/v013-expedition-contracts.js');
require('../combat/v012-gear-stats.js');
require('../online/v012-save.js');
const C=WandererV013Crafting,K=WandererV013ExpeditionContracts,G=WandererV012GearStats,S=WandererV012Save;
const create=require('./v012-economy-harness.cjs');
const clone=x=>JSON.parse(JSON.stringify(x));
test('C2: legacy Off-Hand Dagger crafting recipes are unavailable',()=>{
 assert.equal(C.LEGACY_RECIPES,undefined);
 assert(!C.RECIPES.some(r=>['blue_offdagger','green_offdagger'].includes(r.id)));
 assert.equal(C.valid({...C.create(),learnedRecipes:['blue_offdagger']}),false);
 assert.equal(C.discover(C.create(),'blue_offdagger'),null);
 assert.throws(()=>C.cost('blue_offdagger'),/Unknown recipe/);
 assert.equal(C.progress({fragments:100,crafting:C.create()},'blue_offdagger'),null);
});
test('C2: contract plans cannot accept retired Blueprint identifiers',()=>{
 const a=create(9571,undefined,{}, {skipPersistence:true});a.start(1,true);
 const c=a.controller(),card=c.state.dungeon.cards[0],seed=c.state.dungeon.foundationManifest.seed;
 assert.throws(()=>K.plan(seed,card,['blue_offdagger']),/Invalid/);
 const current=K.plan(seed,card,[]);
 assert.equal(current.knownRecipes.length,0);
 assert.deepEqual(clone(K.plan(seed,card,[])),clone(current));
});
test('C2: absent legacy Leather rating and Orb spell fields are never boosted',()=>{
 const context={ARMOR_SLOTS:['helm','armor','gloves','boots','belt']};
 const leather={tier:200,slot:'armor',armorType:'Leather',rarity:'Legendary',upgradeRank:10};
 assert.equal(G.gearEvasionRating(leather,context),0);
 assert.equal(G.gearEvasionRating({...leather,evasionRating:15},context),15);
 assert.equal(G.gearEvasionRating({...leather,evasionRating:15,armorType:'Plate'},context),0);
 const orb={slot:'offhand',subtype:'Orb',spell:20};
 assert.equal(G.itemStatValue(orb,'spell',context),20);
 assert.equal(G.itemStatValue({...orb,orbSpellB4:true},'spell',context),20);
});
test('C2: old or non-Dungeon checkpoint formats are rejected without mutation',()=>{
 const a=create(9701,undefined,{}, {skipPersistence:true});a.start(1,true);
 const c=a.controller(),saved=clone(c.state);
 assert(c.restore(saved));
 for(const old of [{...saved,version:1},{...saved,dungeon:null}]){
  assert.throws(()=>c.restore(old),/Unsupported Expedition checkpoint/);
  assert.deepEqual(clone(c.state),saved);
 }
});
test('C2: fresh local namespace ignores all old local save keys',()=>{
 assert.equal(S.VERSION,13); // Firestore rules still require the existing schema.
 assert.equal(S.PREFIX,'wanderer_v013_c2_clean_sheet_v1_');
 const storage=new Map([['wanderer_v013_stage74_preview_v1_alice','an-old-save']]);
 const db={getItem:key=>storage.get(key)??null,setItem:(key,v)=>storage.set(key,v),removeItem:key=>storage.delete(key)};
 assert.equal(S.createStore(db,'alice').load(),null);
 const a=create(9702,undefined,{}, {skipPersistence:true});
 const fresh=S.create({...a.state(),run:null},{binding:'alice'});
 assert.equal(S.validate(fresh,'alice').schemaVersion,13);
 assert.throws(()=>S.validate({...fresh,schemaVersion:12},'alice'),/unsupported schema/);
});
test('C2: cloud reset is only enabled in the development project',()=>{
 const account=fs.readFileSync('online/v012-account.mjs','utf8'),cloud=fs.readFileSync('online/v012-cloud-save.mjs','utf8');
 assert.match(account,/backend\.projectId==='wanderer-development-8e3ee'\)fresh\.previewGeneration='c2-clean-sheet'/);
 assert.match(cloud,/projectId==='wanderer-development-8e3ee'&&initialSave\?\.previewGeneration==='c2-clean-sheet'/);
 assert.doesNotMatch(cloud,/stage74_cloud_outbox|previewGeneration==='stage74'/);
 assert.match(cloud,/wanderer_v013_c2_clean_sheet_cloud_outbox_/);
});
