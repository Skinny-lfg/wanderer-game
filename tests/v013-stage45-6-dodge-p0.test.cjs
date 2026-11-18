'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const create=require('./v012-economy-harness.cjs');

function fresh(){
 const a=create(99355,undefined,{}, {skipPersistence:true});
 a.setup(5,'Sword','Rare');a.setUnlocked(5);a.start(5,true);
 const c=a.controller(),card=c.state.dungeon.cards[0];
 c.chooseRealm(card.id);
 assert(c.visitRoom(1));assert(a.enter());
 const r=a.state().run;assert.equal(r.status,'fight');
 r.stats.evasionRating=1e9;r.stats.blockChance=0;r.enemy.attackType='physical';
 r.enemy.hp=100000;r.enemy.atk=100;
 return {a,r};
}
test('current Dungeon: physical dodge is possible, logs DODGE and avoids its hit',()=>{
 const {a,r}=fresh(),before={hp:r.hp,barrier:r.barrier,enemyHp:r.enemy.hp};
 const feedback=a.feedback();
 a.rng(0);
 assert.equal(a.gear.tryDodge(r,'physical'),true);
 assert.equal(r.hp,before.hp);assert.equal(r.barrier,before.barrier);
 assert.equal(r.enemy.hp,before.enemyHp);
 assert(feedback.logs.some(x=>x.text.includes('DODGE')));
 assert(feedback.floats.some(x=>x.value==='DODGE'&&x.target==='hero'));
});
test('current Dungeon: magic or damage-over-time never invokes physical dodge',()=>{
 const {a,r}=fresh();a.rng(0);
 for(const type of ['spell','dot','unknown'])assert.equal(a.gear.tryDodge(r,type),false,type);
 assert.equal(a.gear.enemyAttackType({eliteType:'caster'}),'spell');
 assert.equal(a.gear.enemyAttackType({bossStyle:'leech'}),'spell');
 assert.equal(a.gear.enemyAttackType({}),'physical');
});
test('current Dungeon: 30% dodge cap and enemy tier scaling stay finite',()=>{
 const {a}=fresh(),d=a.gear.evasionChance;
 assert.equal(d(Number.MAX_VALUE,1),.30);
 assert(d(30,5)>d(10,5));assert(d(30,200)<d(30,5));
 for(const value of [0,-1,NaN,Infinity])assert.equal(d(value,5),0);
});
