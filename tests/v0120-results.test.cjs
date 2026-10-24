// Isolated v0.12 result transitions. No live saves, economy changes or balance simulation.
const {test}=require('node:test'),assert=require('node:assert/strict'),create=require('./v012-economy-harness.cjs');
require('../online/v012-save.js');
require('../online/v012-treasures.js');
const Save=globalThis.WandererV012Save;
const plain=value=>JSON.parse(JSON.stringify(value));

function begin(a,level=1,family='blood'){
 a.start(level);a.initial(family);
 if(family==='magic')a.element('frost');
 const offer=a.controller().state.offers.find(p=>p.family===family);
 assert(offer,`seeded ${family} Realm offer`);offer.waves=1;a.select(offer.id);assert.equal(a.enter(),true);
}
function persistPresentation(profile,presentation){
 const save=Save.create(profile);save.expedition.presentation=plain(presentation);
 const restored=Save.validate(JSON.stringify(save));
 assert.deepEqual(plain(restored.expedition.presentation),plain(presentation));
 return restored;
}

test('Realm clear remains available through its passive choice and cannot pay twice',()=>{
 const a=create(501);begin(a);const state=a.state();state.run.combatSeconds=7.5;state.run.enemy.hp=0;a.win();a.flush();
 const pending=a.results();
 // In v0.12 the reward draft owns the screen first; the Realm snapshot is
 // retained while review stays null so the result modal cannot cover the draft.
 assert.equal(pending.review,null);assert.equal(pending.realm.outcome,'cleared');assert.equal(pending.realm.seconds,7.5);
 assert.equal(a.draft().kind,'reward');const gold=state.gold,fragments=state.fragments,earned=JSON.stringify(pending.earned);
 assert.equal(a.exitResult(),false,'cannot leave before claiming the Realm reward');
 assert.equal(a.passive(a.draft().options[0].id),true);
 assert.equal(a.state().run.status,'cleared');assert.equal(a.exitResult(),true);
 assert.equal(a.results().realm.outcome,'cleared','result snapshot remains in memory until the next Expedition');
 assert.equal(a.exitResult(),false);a.win();
 assert.equal(state.gold,gold);assert.equal(state.fragments,fragments);assert.equal(JSON.stringify(a.results().earned),earned);
 assert.equal(a.build().picks.length,2);
 persistPresentation(state,a.results());
});

test('Death summary keeps newly equipped loot and home gear, and reports only discarded Bag items as discarded',()=>{
 const a=create(502);a.setup(5,'Sword');a.start();a.initial('blood');const state=a.state(),home=plain(state.equip);
 a.controller().state.planeIndex=2;
 const sword=a.makeItem(2,'weapon',null,'loot','Sword','Rare');a.bag.mark(sword);a.recordItem(sword);assert.equal(a.equip(sword.id),true);
 const belt=a.makeItem(2,'belt',null,'loot','Leather','Rare');a.bag.mark(belt);a.recordItem(belt);assert.equal(a.bag.discard(belt.id),true);
 a.select(a.controller().state.offers[0].id);assert.equal(a.enter(),true);state.run.combatSeconds=3;a.death();
 const result=a.results();assert.equal(result.review,'summary');assert.equal(result.realm.outcome,'defeat');assert.equal(result.summary.outcome,'defeat');
 assert.deepEqual(Array.from(result.summary.kept,item=>item.id),[sword.id]);
 assert.deepEqual(Array.from(result.summary.lost,item=>item.id),[home.weapon.id]);
 assert.deepEqual(Array.from(result.summary.discarded,item=>item.id),[belt.id]);
 assert.equal(state.equip.weapon.id,sword.id);
 assert(!state.stash.some(item=>item.id===home.weapon.id),'the displaced home weapon was lost with the Expedition Bag');
 assert.equal(a.exitResult(),true);assert.equal(a.results().review,null);assert.equal(a.exitResult(),false);
 persistPresentation(state,result);
});

test('Extraction summary is a snapshot and grants no boss Rune or progression credit',()=>{
 const a=create(503);begin(a);a.state().run.enemy.hp=0;a.win();a.flush();
 assert.equal(a.passive(a.draft().options[0].id),true);assert.equal(a.exitResult(),true);
 const before=plain(a.state()),earned=plain(a.results().earned);
 assert.equal(a.checkpoint.extract(),true);const result=a.results();
 assert.equal(result.review,'summary');assert.equal(result.summary.realms,1);assert.equal(result.summary.outcome,'extracted');
 assert.equal(result.summary.runeTier,null);assert.equal(a.controller().state.unlocked,1);
 assert.deepEqual(plain(result.summary.kept),earned);assert.deepEqual(plain(a.state().stash),before.stash);
 const gold=a.state().gold,fragments=a.state().fragments;assert.equal(a.exitResult(),true);
 assert.equal(a.checkpoint.extract(),false);assert.equal(a.state().gold,gold);assert.equal(a.state().fragments,fragments);
 persistPresentation(a.state(),result);
});

test('Expedition boss result preserves the actual Magic build and one-time Rune claim',()=>{
 const a=create(504),g=a.controller().state;g.unlocked=10;a.start(10);a.initial('magic');a.element('frost');
 // A Magic starter passive is awarded by the first completed Realm. Seed that
 // valid build state through the same buildcraft API before the synthetic boss.
 assert.equal(a.initialPassive(a.build(),'magic').id,'deep_winter');
 g.planeIndex=15;g.history=Array.from({length:14},(_,index)=>({plane:index+1}));
 const p=g.offers.find(offer=>offer.family==='magic');p.boss=true;p.waves=3;
 a.select(p.id);assert.equal(a.enter(),true);
 const run=a.state().run;g.wave=3;run.phase1Plane=15;run.enc=3;run.enemy.boss=true;run.enemy.hp=0;run.combatSeconds=4;
 a.win();a.flush();const result=a.results();
 assert.equal(result.review,'summary');assert.equal(result.summary.outcome,'victory');assert.equal(result.summary.realms,15);
 assert.equal(result.summary.seconds,4);assert.equal(result.summary.element,'frost');
 assert.deepEqual(Array.from(result.summary.picks),['deep_winter']);assert.equal(result.summary.runeTier,10);assert.equal(g.unlocked,11);
 const rune=a.state().pendingRuneReward.options[0];assert.equal(a.claimRune(rune.id),true);
 assert.equal(result.summary.runeName,rune.name);assert.equal(a.claimRune(rune.id),false);assert.equal(a.state().runes.length,1);
 persistPresentation(a.state(),result);
});

test('Malformed persisted results are rejected without mutating the original save',()=>{
 const a=create(505),save=Save.create(a.state());
 save.expedition.presentation={version:1,review:'realm',realm:null,summary:null,earned:[],gold:0,fragments:0};
 const before=JSON.stringify(save);assert.throws(()=>Save.validate(save),/missing Realm result/);assert.equal(JSON.stringify(save),before);
 save.expedition.presentation.review=null;assert.doesNotThrow(()=>Save.validate(save));
 save.expedition.presentation.gold=-1;assert.throws(()=>Save.validate(save),/result loot/);
});
