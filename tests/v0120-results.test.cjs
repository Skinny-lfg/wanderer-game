// Synthetic state transitions only. No combat or balance simulation.
const {test}=require('node:test'),assert=require('node:assert/strict'),create=require('./v012-economy-harness.cjs');
function begin(a){a.start();a.initial('blood');const p=a.controller().state.offers.find(p=>p.family==='blood');p.waves=1;a.select(p.id);a.enter();}
test('Realm result persists until exit; review never mints another reward or passive',()=>{
 const a=create(501);begin(a);const s=a.state();s.run.combatSeconds=7.5;s.run.enemy.hp=0;a.win();a.flush();
 const result=a.results();assert.equal(result.review,'realm');assert.equal(result.realm.outcome,'cleared');assert.equal(result.realm.seconds,7.5);assert.equal(a.draft().kind,'reward');
 const gold=s.gold,frags=s.fragments,items=s.stash.length;assert.equal(a.exitResult(),false);a.passive(a.draft().options[0].id);assert.equal(a.exitResult(),true);assert.equal(a.exitResult(),false);a.win();
 assert.equal(s.gold,gold);assert.equal(s.fragments,frags);assert.equal(s.stash.length,items);assert.equal(a.build().picks.length,2);
});
test('defeat recap distinguishes equipped new loot from discarded items and protects home',()=>{
 const a=create(502);a.start();a.initial('blood');const s=a.state(),home=s.equip.weapon.id;a.controller().state.planeIndex=2;
 const sword=a.makeItem(2,'weapon',null,'loot','Sword','Rare');a.bag.mark(sword);a.recordItem(sword);a.equip(sword.id);
 const belt=a.makeItem(2,'belt',null,'loot','Leather','Rare');a.bag.mark(belt);a.recordItem(belt);a.bag.discard(belt.id);
 a.select(a.controller().state.offers[0].id);a.enter();if(a.draft()?.step==='element')a.element('fire');s.run.combatSeconds=3;a.death();
 assert.equal(a.results().review,'realm');const result=a.results().summary;assert.equal(result.outcome,'defeat');assert.deepEqual(Array.from(result.lost,i=>i.id),[sword.id]);assert.deepEqual(Array.from(result.discarded,i=>i.id),[belt.id]);assert.equal(result.kept.length,0);assert.equal(s.equip.weapon.id,home);
 a.exitResult();assert.equal(a.results().review,'summary');a.exitResult();assert.equal(a.results().review,null);assert.equal(a.exitResult(),false);
});
test('extraction recap is a snapshot, with no boss Rune or progression credit',()=>{
 const a=create(503);begin(a);a.state().run.enemy.hp=0;a.win();a.flush();a.passive(a.draft().options[0].id);a.exitResult();
 assert.equal(a.checkpoint.extract(),true);const r=a.results();assert.equal(r.review,'summary');assert.equal(r.summary.realms,1);assert.equal(r.summary.outcome,'extracted');assert.equal(r.summary.runeTier,null);assert.equal(a.controller().state.unlocked,1);
 const gold=a.state().gold;a.exitResult();assert.equal(a.checkpoint.extract(),false);assert.equal(a.state().gold,gold);
});
test('eligible final boss recap preserves build and Rune choice; claiming records the actual Rune once',()=>{
 const a=create(504),g=a.controller().state;g.unlocked=10;a.start(10);a.initial('magic');a.element('frost');
 const p=g.offers.find(p=>p.family==='magic');p.boss=true;p.waves=3;a.select(p.id);a.enter();g.planeIndex=15;g.history=Array.from({length:14},(_,i)=>({...p,plane:i+1,boss:false}));
 const r=a.state().run;g.wave=3;r.phase1Plane=15;r.enc=3;r.enemy.boss=true;r.enemy.hp=0;r.combatSeconds=4;a.win();a.flush();
 const result=a.results().summary;assert.equal(result.outcome,'victory');assert.equal(result.realms,15);assert.equal(result.seconds,4);assert.equal(result.element,'frost');assert.deepEqual(Array.from(result.picks),['deep_winter']);assert.equal(result.runeTier,10);assert.equal(g.unlocked,11);
 const rune=a.state().pendingRuneReward.options[0];assert.equal(a.claimRune(rune.id),true);assert.equal(result.runeName,rune.name);assert.equal(a.claimRune(rune.id),false);assert.equal(a.state().runes.length,1);
});
test('malformed persisted results fail validation without changing the original save',()=>{
 require('../online/v012-save.js');const S=globalThis.WandererV012Save,a=create(505),save=S.create(a.state());
 save.expedition.presentation={version:1,review:'realm',realm:null,summary:null,earned:[],gold:0,fragments:0};
 assert.throws(()=>S.validate(save),/missing Realm result/);assert.equal(save.revision,0);
 save.expedition.presentation.review=null;assert.doesNotThrow(()=>S.validate(save));
 save.expedition.presentation.gold=-1;assert.throws(()=>S.validate(save),/result loot/);
});
