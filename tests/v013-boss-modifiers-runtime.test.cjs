'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const create=require('./v012-economy-harness.cjs');
require('../combat/v013-expedition-foundation.js');
const F=globalThis.WandererV013ExpeditionFoundation;
require('../online/v013-boss-modifiers.js');
const run=(ids=[],style='leech',risk=0,seed=7103)=>{
 const a=create(seed,undefined,{}, {skipPersistence:true});a.setup(35,'Sword','Rare');a.setUnlocked(35);a.start(35,true);
 const c=a.controller(),g=c.state,card=g.dungeon.cards[risk];c.chooseRealm(card.id);
 g.bossId=({guardian:'guardian',leech:'rift',berserker:'ember'})[style];
 const manifest=g.dungeon.foundationManifest.cards.find(x=>x.realmId===card.id);
 manifest.bossModifierIds=[...ids];g.dungeon.foundationState.conditionId='relentless_hunt';
 // Diagnostic boss placement only; actual generated maps keep boss in final room.
 card.nodes[1].kind='boss';card.nodes[1].escorts=risk;
 assert.equal(c.visitRoom(1),true);assert.equal(a.enter(),true);
 return {a,c,g,card,r:a.state().run};
};
test('native final-boss spawn receives planned modifiers, while its guards do not',()=>{
 const {r}=run(['bone_ward','graven_hide','gravebound_retinue'],'leech',2);
 assert.equal(r.bossModifierIds.length,3);assert.equal(r.enemies.length,4);
 assert.equal(r.totalMobCount,4);assert.equal(r.enemy.boss,true);assert(r.enemy.barrier>0);
 assert(r.enemies.slice(1).every(x=>!x.boss&&!x.bossModifiersApplied));
});
test('native Bone Ward + Graven Hide change only boss statistics in matched seeds',()=>{
 const base=run([],'leech',0,7001),enhanced=run(['bone_ward','graven_hide'],'leech',0,7001);
 assert.equal(base.r.enemy.maxhp,enhanced.r.enemy.maxhp);
 assert.equal(enhanced.r.enemy.barrier-base.r.enemy.barrier,Math.round(base.r.enemy.maxhp*.15));
 assert.equal(enhanced.r.enemy.def,Math.round(base.r.enemy.def*1.12));
 assert.equal(enhanced.r.enemy.baseDef,Math.round(base.r.enemy.baseDef*1.12));
});
test('native Soul Drain applies the reduced healing in the real runtime',()=>{
 const base=run([],'leech',0,7002),drain=run(['soul_drain'],'leech',0,7002);
 base.r.hp=Math.floor(base.r.maxhp/2);drain.r.hp=Math.floor(drain.r.maxhp/2);
 const plain=base.a.heal(base.r,100),reduced=drain.a.heal(drain.r,100);
 assert.equal(plain,100);assert.equal(reduced,85);
});
test('native Sanguine Frenzy triggers only once when boss crosses 50% HP',()=>{
 const {a,r}=run(['sanguine_frenzy'],'leech',0,7003);
 const before=r.enemy.attackEvery;
 r.enemy.hp=Math.round(r.enemy.maxhp*.4);a.tick();
 assert(r.enemy.sanguineFrenzyActive);assert(r.enemy.attackEvery<before);
 assert.equal(r.metrics.bossFrenzyTriggers,1);
 a.tick();assert.equal(r.metrics.bossFrenzyTriggers,1);
});
test('native Profane Pulse uses combat time, Barrier, and the established death transition',()=>{
 const {a,c,r}=run(['profane_pulse'],'leech',0,7004);
 r.hp=5;r.barrier=0;r.combatSeconds=14.99;
 a.tick();assert.equal(r.metrics.bossPulseTriggers,1);
 assert.equal(c.state.stage,'failed');assert.equal(a.state().run,null);
 const safe=run(['profane_pulse'],'leech',0,7005);
 safe.r.barrier=Math.ceil(safe.r.maxhp*.05);safe.r.combatSeconds=14.99;
 const before=safe.r.hp;safe.a.tick();
 assert.equal(safe.r.hp,before);assert(safe.r.metrics.absorbed>0);
});
test('native Guardian/Berserker already have unique patterns and incompatible modifiers are refused',()=>{
 assert.throws(()=>run(['bone_ward'],'guardian',0));
 assert.throws(()=>run(['sanguine_frenzy'],'berserker',0));
});
test('boss properties appear in the preview, map and battle while hidden IDs remain unknown before fight',()=>{
 const source=fs.readFileSync('index.html','utf8');
 assert(source.includes('Known boss omen:'));
 assert(source.includes('bossKnownOmen'));
 assert(source.includes('Boss properties:'));
 assert(source.indexOf('online/v013-boss-modifiers.js')<source.indexOf('online/v012-expedition-controller.js'));
 const {r,g,card}=run(['bone_ward','graven_hide'],'leech',0,7110);
 const M=globalThis.WandererV013BossModifiers;
 assert.equal(M.known(g,card.id).id,'bone_ward');assert.deepEqual([...r.bossModifierIds],['bone_ward','graven_hide']);
});
test('Boss Modifiers do not apply to native normal combat',()=>{
 const a=create(7104,undefined,{}, {skipPersistence:true});a.setup(35,'Sword','Rare');a.setUnlocked(35);a.start(35,true);
 const c=a.controller(),card=c.state.dungeon.cards[1];c.chooseRealm(card.id);assert.equal(c.visitRoom(1),true);assert.equal(a.enter(),true);
 assert.deepEqual([...a.state().run.bossModifierIds],[]);
});
