'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
require('../combat/v013-expedition-foundation.js');
require('../online/v013-map-intelligence.js');
require('../online/v013-expedition-conditions.js');
require('../online/v013-expedition-boons.js');
require('../online/v012-consumables.js');
const create=require('./v012-economy-harness.cjs');
const F=globalThis.WandererV013ExpeditionFoundation;
const B=globalThis.WandererV013ExpeditionBoons;
const C=globalThis.WandererV013ExpeditionConditions;
const P=globalThis.WandererV012Consumables;
const clone=value=>JSON.parse(JSON.stringify(value));
function fresh(seed=7400){
 const a=create(seed,undefined,{}, {skipPersistence:true});
 a.start(1,true);
 const c=a.controller(),card=c.state.dungeon.cards[0];
 c.chooseRealm(card.id);
 return {a,c,card,d:c.state.dungeon};
}
function direct(seed=7410){
 for(let n=seed;n<seed+50;n++){const env=fresh(n);if(env.card.boonShrines[0]===4)return env;}
 throw Error('Could not find an adjacent Shrine');
}
test('Stage 7.4 catalog includes three new named potions with normalized offers',()=>{
 for(const id of ['purifying','veilsight','fate'])assert(P.CATALOG.some(p=>p.id===id),id);
 assert.equal(P.CATALOG.length,13);
 assert.equal(P.OFFER_PROBABILITIES.fortune,1/30);
 assert(Math.abs(Object.values(P.OFFER_PROBABILITIES).reduce((n,p)=>n+p,0)-1)<1e-12);
 assert.equal(P.selection({fate:1},['fate']).length,1);
});
test('Stage 7.4 purchases auto-equip new types, duplicate purchases go to Stash, and full loadouts stay unchanged',()=>{
 const a=create(7460,undefined,{}, {skipPersistence:true}),s=a.state();
 s.gold=1000;s.stashCapacity=40;s.stash=Array.from({length:40},(_,i)=>({id:'placeholder'+i}));
 s.consumables={};s.potionSelection=[];
 s.apothecary={stock:[{id:'first',kind:'fate',price:40},{id:'second',kind:'fate',price:40},{id:'third',kind:'scout',price:22},{id:'fourth',kind:'mana',price:14}],refreshCost:12};
 assert.equal(a.potions.buy('first'),true,'equipping a purchase does not require a Stash slot');
 assert.deepEqual(clone(s.potionSelection),['fate']);assert.equal(s.consumables.fate,1);
 const gold=s.gold;
 assert.equal(a.potions.buy('second'),false,'duplicate must fit in Stash, not replace equipped potion');
 assert.equal(s.gold,gold);assert.equal(s.consumables.fate,1);
 s.stash.pop();
 assert.equal(a.potions.buy('second'),true);
 assert.deepEqual(clone(s.potionSelection),['fate']);assert.equal(s.consumables.fate,2);
 assert.equal(a.potions.buy('third'),true,'free loadout slot permits purchase even with one Stash stack');
 assert.deepEqual(clone(s.potionSelection),['fate','scout']);
 assert.equal(a.potions.buy('fourth'),true);
 assert.deepEqual(clone(s.potionSelection),['fate','scout','mana']);
 s.apothecary.stock=[{id:'fifth',kind:'health',price:14}];s.stash.pop();
 assert.equal(a.potions.buy('fifth'),true,'full loadout sends the newly purchased kind to Stash');
 assert.deepEqual(clone(s.potionSelection),['fate','scout','mana']);
 assert.equal(s.consumables.health,1);
});
test('Stage 7.4 Shrine reroll is deterministic, costs a dose, is one-use, and replays on restore',()=>{
 const {a,c,card,d}=direct(7480),s=a.state();
 // A Fate dose is equipped in Camp, then loaded at the first discovered Shrine.
 s.consumables={fate:1};s.potionSelection=['fate'];
 assert(c.visitRoom(card.boonShrines[0],['blood']));
 const before=clone(d.boonOffer.ids);
 assert.equal(a.potions.use(0),true);
 const after=clone(c.state.dungeon.boonOffer.ids);
 assert.notDeepEqual(after,before);
 assert.equal(c.state.dungeon.boonOffer.rerolled,true);
 assert.equal(c.rerollBoon(),false,'same Shrine cannot be rerolled twice');
 assert.equal(a.potions.use(0),false,'used Fate dose cannot be reused');
 assert.equal(B.validateOffer(c.state.dungeon,c.state),true);
 const checkpoint=clone(c.state);
 assert.deepEqual(clone(c.restore(clone(checkpoint)).dungeon.boonOffer.ids),after);
 const forged=clone(checkpoint);forged.dungeon.boonOffer.rerolled=false;
 assert.throws(()=>c.restore(forged),/Invalid/);
 c.chooseBoon(after[0]);
 assert.equal(B.validateOffer(c.state.dungeon,c.state),true);
 assert.doesNotThrow(()=>c.restore(clone(c.state)));
});
test('Stage 7.4 Veilsight discovers both Shrines and routes through replayable scouting decisions',()=>{
 const {a,c,card}=fresh(7501),s=a.state();
 s.consumables={veilsight:1};s.potionSelection=['veilsight'];
 assert.equal(a.potions.use(0),true);
 const d=c.state.dungeon;
 assert(card.boonShrines.every(room=>d.scouted.includes(room)));
 assert(d.scouted.length>=2);
 assert.deepEqual(clone(d.scouted),clone(d.foundationState.knownRooms.slice(1)));
 assert(d.foundationState.decisions.some(action=>action.type==='reveal_room'));
 assert.doesNotThrow(()=>c.restore(clone(c.state)));
 assert.equal(a.potions.use(0),false);
});
test('Stage 7.4 Scout Tonic can discover a Shrine and cannot consume a dose when no target remains',()=>{
 const {a,c,card}=fresh(7502),s=a.state();s.consumables={scout:1};s.potionSelection=['scout'];
 assert.equal(a.potions.use(0,'shrine'),true);
 const d=c.state.dungeon;
 assert(card.boonShrines.some(room=>d.scouted.includes(room)));
 assert.doesNotThrow(()=>c.restore(clone(c.state)));
 assert.equal(a.potions.use(0,'shrine'),false);
});
test('Stage 7.4 Purifying halves combat penalties for precisely two encounters',()=>{
 const nodes=Array.from({length:22},(_,i)=>({kind:i===0?'entrance':i===21?'boss':'combat',count:3}));
 const card={id:'forge',family:'blood',risk:2,nodes,edges:Array.from({length:21},(_,i)=>[i,i+1]),shortcut:4};
 const d={foundationManifest:{seed:9101,cards:[{realmId:'forge',conditionId:'relentless_hunt'}]},conditionEdgesUsed:[]};
 const marked=C.forDungeon(card,d).rooms[0];
 const foe={atk:100,maxhp:1000,hp:1000,attackEvery:2,boss:false};
 const run={status:'fight',conditionMitigation:.5};
 C.applyEncounter(run,[foe],{node:marked,boss:false},card,d);
 assert(Math.abs(foe.attackEvery-2/1.075)<1e-10);
 const a=create(7560,undefined,{}, {skipPersistence:true}),s=a.state();
 s.consumables={purifying:1};s.potionSelection=['purifying'];a.start(1,true);
 const c=a.controller(),chosen=c.state.dungeon.cards.find(card=>{
  const id=c.state.dungeon.foundationManifest.cards.find(x=>x.realmId===card.id).conditionId;
  return id!=='veiled_passages';
 });
 c.chooseRealm(chosen.id);
 assert.equal(a.potions.use(0),true);
 assert.equal(a.events.run().effects.purifying.remaining,2);
 a.potions.tick();assert.equal(a.events.run().effects.purifying.remaining,1);
 a.potions.tick();assert.equal(a.events.run().effects.purifying.remaining,0);
 assert.equal(a.potions.use(0),false);
});
