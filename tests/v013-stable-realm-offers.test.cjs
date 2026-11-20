'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const create=require('./v012-economy-harness.cjs');
const snapshot=a=>{
 const g=a.controller().state;
 return JSON.parse(JSON.stringify({expedition:g.expedition,cards:g.dungeon.cards,
  bossId:g.bossId,manifest:g.dungeon.foundationManifest}));
};
test('Start -> Back to Camp -> Start preserves all three Realm offers, risk, Boss, conditions and maps',()=>{
 const a=create(81601,undefined,{}, {skipPersistence:true});
 a.start(1,true);const original=snapshot(a);
 assert.equal(a.state().realmOfferSeeds['1']>=0,true);
 assert(a.back());
 for(let i=0;i<4;i++){
  a.start(1,true);assert.deepEqual(snapshot(a),original,'Back to Camp cannot reroll Realm offers');
  assert.equal(a.controller().state.rerolls,0);
  assert(a.back());
 }
});
test('pre-combat selected Realm can return to Camp without regenerating the offers',()=>{
 const a=create(81602,undefined,{}, {skipPersistence:true});
 a.start(1,true);const original=snapshot(a);
 const card=a.controller().state.dungeon.cards[2];
 a.controller().chooseRealm(card.id);
 assert(a.back(),'return allowed before starting a room');
 a.start(1,true);
 assert.deepEqual(snapshot(a),original);
 assert.equal(a.controller().state.dungeon.realm,null,'selection may change, offers may not');
});
test('the same unstarted level retains its offers when a different Expedition is viewed',()=>{
 const a=create(81603,undefined,{}, {skipPersistence:true});
 a.setUnlocked(2);
 a.start(1,true);const first=snapshot(a);assert(a.back());
 a.start(2,true);const second=snapshot(a);assert(a.back());
 a.start(1,true);assert.deepEqual(snapshot(a),first);assert(a.back());
 a.start(2,true);assert.deepEqual(snapshot(a),second);
});
test('first real room entry consumes the offered seed and permits the next attempt to draw fresh Realms',()=>{
 const a=create(81604,undefined,{}, {skipPersistence:true});
 a.start(1,true);const first=snapshot(a),seed=a.state().realmOfferSeeds['1'];
 const card=a.controller().state.dungeon.cards[0];
 a.controller().chooseRealm(card.id);
 assert(a.controller().visitRoom(1));assert(a.enter());
 assert.equal(a.state().realmOfferSeeds['1'],undefined,'offer consumed on entry only');
 assert(a.abandon());
 a.start(1,true);
 assert.notEqual(a.state().realmOfferSeeds['1'],seed);
 assert.notDeepEqual(snapshot(a),first,'new actual attempt can offer a new Expedition');
});
test('preview sessionStorage reload keeps canceled Realm offers stable',()=>{
 const sessionStorage=new Map();
 const a=create(81605,undefined,{}, {sessionStorage});
 a.start(1,true);const offered=snapshot(a);
 assert(a.back());
 const b=create(99999,undefined,{}, {sessionStorage});
 assert.equal(b.controller().state.stage,'camp');
 assert.equal(b.state().realmOfferSeeds['1']>=0,true);
 b.start(1,true);
 assert.deepEqual(snapshot(b),offered,'saved pre-combat offers must survive reload');
});