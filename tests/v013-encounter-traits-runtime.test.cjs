'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const create=require('./v012-economy-harness.cjs');
const E=require('../combat/v013-expedition-foundation.js');
const prepare=(id,seed=111)=>{
 const a=create(seed,undefined,{}, {skipPersistence:true});a.setup(15,'Sword','Rare');a.setUnlocked(15);a.start(15,true);
 const c=a.controller(),card=c.state.dungeon.cards[0];c.chooseRealm(card.id);
 card.nodes[1].traitId=id;assert.equal(c.visitRoom(1),true);assert.equal(a.enter(),true);
 return {a,c,card,r:a.state().run};
};
test('native fight receives marked encounter trait, stat changes and accessible log',()=>{
 const normal=prepare(null),armored=prepare('armored');
 assert.equal(normal.r.encounterTraitId,null);assert.equal(armored.r.encounterTraitId,'armored');
 assert.equal(normal.r.totalMobCount,armored.r.totalMobCount);
 assert.equal(normal.r.enemy.maxhp>armored.r.enemy.maxhp,true);
 assert.equal(normal.r.enemy.def<armored.r.enemy.def,true);
 assert.match(fs.readFileSync('online/v012-expedition-runtime.js','utf8'),/Encounter trait:/);
});
test('native Ambush starts enemy attacks earlier but does not alter subsequent cadence',()=>{
 const normal=prepare(null),ambush=prepare('ambush');
 assert.equal(normal.r.enemy.attackEvery,ambush.r.enemy.attackEvery);
 assert(ambush.r.enemy.groupClock>normal.r.enemy.groupClock);
});
test('native Sigilbound and Frenzied effects reach the actual enemy instances',()=>{
 const normal=prepare(null),shielded=prepare('sigilbound'),frantic=prepare('frenzied');
 assert(shielded.r.enemy.barrier>normal.r.enemy.barrier);
 assert(shielded.r.enemy.atk<normal.r.enemy.atk);
 assert(frantic.r.enemy.attackEvery<normal.r.enemy.attackEvery);
});
test('rewards are only enhanced in regular marked encounters and retain base risk scaling',()=>{
 const html=fs.readFileSync('online/v012-expedition-runtime.js','utf8');
 assert.match(html,/groupReward\*\(r\.encounterTraitId\?1\.10:1\)/);
 assert.match(html,/r\.encounterTraitId=traitId/);
 assert.match(html,/g\.selected\.boss&&!g\.selected\.elite/); // condition from spawn guard is negated per expression
});
test('simulator harness loads same module and marks scenario traits without separate physics',()=>{
 const html=fs.readFileSync('tests/v012-economy-harness.cjs','utf8');
 assert.match(html,/online\/v013-encounter-traits\.js/);
 const sim=fs.readFileSync('scripts/simulate-progression.cjs','utf8');
 assert.match(sim,/traitId:r\.encounterTraitId\|\|null/);
 const page=fs.readFileSync('index.html','utf8');
 assert(page.indexOf('online/v013-encounter-traits.js')<page.indexOf('online/v012-expedition-controller.js'));
 assert(page.includes('encounterTraitBadge'));
 assert(page.includes('const hazard=trait?'));
});
test('native wave gives exactly 10% bonus Fragments and never increases Gold',()=>{
 const base=prepare(null,9002),marked=prepare('armored',9002);
 // Complete matching seeded waves without advancing combat RNG.
 base.r.enemy.hp=0;marked.r.enemy.hp=0;
 base.a.win();marked.a.win();
 assert.equal(base.r.status,'cleared');assert.equal(marked.r.status,'cleared');
 assert.equal(marked.r.gold,base.r.gold);
 assert.equal(marked.r.fragments,Math.round(base.r.fragments*1.10));
});
test('native Death Throes causes bounded real damage and can cause defeat on final kill',()=>{
 const {a,c,r}=prepare('death_throes',1500);
 r.barrier=0;const before=r.hp;
 r.enemy.hp=0;a.win();
 const expected=Math.round(r.maxhp*.02);
 assert.equal(before-r.hp,expected);
 assert.equal(r.metrics.traitDeathPulse,1);
 assert.equal(r.metrics.damageTaken,expected);
 const fatal=prepare('death_throes',1501);
 fatal.r.hp=1;fatal.r.barrier=0;fatal.r.enemy.hp=0;fatal.a.win();
 assert.equal(fatal.c.state.stage,'failed');
 assert.equal(fatal.a.state().run,null);
});
test('native Regrowth is called inside normal combat tick without extra cooldown resets',()=>{
 const {a,r}=prepare('unhallowed_regrowth',1900);
 assert.equal(r.encounterTraitId,'unhallowed_regrowth');
 const enemy=r.enemy;enemy.hp=Math.floor(enemy.maxhp*.6);
 a.tick();assert(enemy.traitRegenAt>5);
 const before=enemy.hp;r.combatSeconds=enemy.traitRegenAt-.11;r.tPlayer=0;
 a.tick(); // one native 110ms combat tick crosses the 5-second interval
 assert(enemy.hp>=before,'native regrowth unexpectedly injured the enemy');
 assert((r.metrics?.traitRegrowthHealing||0)>0,'native combat tick did not apply regrowth');
});
