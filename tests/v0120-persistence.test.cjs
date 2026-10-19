// Targeted transactions and fixed-entry replay; no balance or gameplay simulation.
const {test}=require('node:test'),assert=require('node:assert/strict'),create=require('./v012-economy-harness.cjs');
require('../online/v012-save.js');const S=globalThis.WandererV012Save;
function begin(a){a.start(1);a.initial('blood');a.select(a.controller().state.offers.find(o=>o.family==='blood').id);}
function planning(a){begin(a);a.controller().state.planeIndex=2;}
function reward(a,slot='weapon'){const item=a.makeItem(5,slot,null,'loot',slot==='weapon'?'Sword':'Leather','Rare');a.bag.mark(item);return item;}
const plain=x=>JSON.parse(JSON.stringify(x));
function envelope(cp){const save=S.create(cp.profile);save.idCounter=cp.session.idCounter;save.expedition={...save.expedition,attempts:1,lastOutcome:'active',active:{attempt:1,level:cp.session.controller.expedition,plane:cp.session.controller.planeIndex,wave:cp.session.controller.wave,stage:cp.session.controller.stage},session:cp.session};return save;}
test('death removes only Expedition loot, including equipped items, and restores exact original equipment',()=>{
 const a=create(301);a.setup(5,'Sword');const s=a.state(),home=plain(s.equip);planning(a);
 const sword=reward(a),belt=reward(a,'belt');a.equip(sword.id);assert.equal(s.equip.weapon.id,sword.id);
 s.gold=123;s.fragments=456;a.select(a.controller().state.offers[0].id);a.enter();if(a.draft()?.step==='element')a.element('fire');
 a.death();assert.deepEqual(plain(s.equip),home);assert(!s.stash.some(o=>[sword.id,belt.id].includes(o.id)));assert.equal(s.gold,123);assert.equal(s.fragments,456);assert.equal(a.controller().state.unlocked,1);
 const after=JSON.stringify(s);a.death();assert.equal(JSON.stringify(s),after);assert.equal(a.vitals().hp,a.vitals().maxhp);
});
test('extraction is between completed Realms only, retains loot, never unlocks or awards a Rune',()=>{
 const a=create(302);a.start();assert.equal(a.checkpoint.extract(),false);a.initial('blood');assert.equal(a.checkpoint.extract(),false);
 a.controller().state.planeIndex=2;const item=reward(a),s=a.state();a.equip(item.id);const gold=s.gold,fragments=s.fragments;
 assert.equal(a.checkpoint.extract(),true);assert.equal(s.equip.weapon.id,item.id);assert.equal(a.controller().state.unlocked,1);assert.equal(s.runes.length,0);assert.equal(s.pendingRuneReward,null);assert.equal(s.gold,gold);assert.equal(s.fragments,fragments);assert.equal(a.checkpoint.extract(),false);
});
test('unfinished Realm restores exact entry, seed, IDs, loot rolls and resources without duplicating partial rewards',()=>{
 const a=create(303);begin(a);a.enter();const cp=a.checkpoint.capture(),initial=JSON.stringify(cp.profile);
 const firstEnemy=plain(a.state().run.enemy),roll=plain(a.makeItem(5,'belt'));
 a.state().gold+=999;a.state().fragments+=888;reward(a,'belt');
 a.checkpoint.restore(cp);assert.equal(a.state().run,null);assert.equal(JSON.stringify({...a.state(),run:null}),initial);assert.equal(a.potion('health'),false);assert.equal(a.checkpoint.extract(),false);
 assert.equal(a.checkpoint.resume(),true);assert.deepEqual(plain(a.state().run.enemy),firstEnemy);assert.deepEqual(plain(a.makeItem(5,'belt')),roll);assert.equal(a.checkpoint.resume(),false);
});
test('choice checkpoint retains initial passive, Magic element, per-card rerolls and fixed offers',()=>{
 const a=create(304);a.start();a.initial('magic');a.element('frost');a.reroll(1);const cp=a.checkpoint.capture();
 const before=JSON.stringify(cp.session.controller.offers);a.reroll(2);a.checkpoint.restore(cp);
 assert.equal(JSON.stringify(a.controller().state.offers),before);assert.equal(a.controller().state.rerollsByRealm[0][1],2);assert.equal(a.controller().state.rerollsByRealm[0][2],3);assert.deepEqual(Array.from(a.build().picks),['deep_winter']);assert.equal(a.build().element,'frost');assert.equal(a.initial('magic'),false);
});
test('versioned save sessions round-trip, old checkpoints remain compatible, corrupt provenance and reroll rollback fail',()=>{
 const a=create(305);begin(a);const cp=a.checkpoint.capture(),save=envelope(cp);assert.equal(S.recover(save).save.expedition.lastOutcome,'active');
 const storage={data:new Map(),getItem(k){return this.data.get(k)??null;},setItem(k,v){this.data.set(k,v);}},store=S.createStore(storage);store.load();let persisted=store.commit(save);
 const raw=JSON.stringify(persisted);assert.deepEqual(S.createStore(storage).load(),persisted);
 const bad=plain(persisted);bad.expedition.session.lootIds=[bad.profile.equip.weapon.id];assert.throws(()=>S.validate(bad),/loot ownership/);assert.equal(JSON.stringify(persisted),raw);
 persisted.expedition.session.controller.rerollsByRealm[0][0]=2;persisted=store.commit(persisted);persisted.expedition.session.controller.rerollsByRealm[0][0]=3;assert.throws(()=>store.commit(persisted),/reroll rollback/);
 const legacy=plain(save);delete legacy.expedition.session;assert.equal(S.recover(legacy).save.expedition.lastOutcome,'interrupted');
 const future=plain(save);future.expedition.session.version=99;assert.throws(()=>S.validate(future),/checkpoint version/);
});
