'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const create=require('./v012-economy-harness.cjs');

function nativeLegendary(id,slot='offhand'){
 const a=create(99511,undefined,{}, {skipPersistence:true});
 a.setup(50,'Sword','Epic');
 const item=a.state().equip[slot];
 assert(item,'Missing equipment slot '+slot);
 item.rarity='Legendary';item.legendaryId=id;item.name=id;
 a.setUnlocked(50);a.start(50,true);
 const c=a.controller(),card=c.state.dungeon.cards[0];c.chooseRealm(card.id);
 assert(c.visitRoom(1));assert(a.enter());
 const r=a.state().run;
 r.enemy.hp=r.enemy.maxhp=100000;r.enemy.atk=100;r.enemy.barrier=0;
 r.stats.evasionRating=0;r.stats.blockChance=0;r.tPlayer=0;r.tDot=0;r.tEnemy=0;
 return {a,r};
}
test('current v0.13 Dungeon: Oathwall performs one real-block counterattack',()=>{
 const {a,r}=nativeLegendary('oathwall');
 r.stats.blockChance=100;r.tEnemy=100;
 a.rng(.99);
 const before=r.enemy.hp;
 a.tick();
 assert(r.enemy.hp<before,'Shield counter should damage enemy on a real Block');
 assert((r.metrics?.procs?.['Legendary: oathwall']||0)>0,'Oathwall must count its proc');
 assert(r.metrics?.procs?.['Legendary: oathwall']<=1,'A block cannot recursively proc Oathwall');
});
test('current v0.13 Dungeon: Veil creates one Barrier rather than repeatedly granting it each tick',()=>{
 const {a,r}=nativeLegendary('veil-thousand-seals','belt');
 // Native phase1Enter() already runs legendaryRealmStart; do not assume tick creates it.
 const initialBarrier=r.barrier;
 const granted=r.legendaryState?.veilBarrier||0;
 assert(granted>0,'Veil must grant real Barrier during encounter entry');
 assert(initialBarrier>0,'The awarded Barrier must be present in combat state');
 assert.equal(r.metrics?.procs?.['Legendary: veil-thousand-seals: barrier'],1);
 a.tick();a.tick();
 assert.equal(r.metrics?.procs?.['Legendary: veil-thousand-seals: barrier'],1,
   'Veil must not re-issue initial Barrier during same encounter');
});
