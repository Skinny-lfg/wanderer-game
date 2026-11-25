'use strict';
// Current v0.13 Evasion coverage; old always-positive Leather assumptions retired.
const {test}=require('node:test'),assert=require('node:assert/strict');
const create=require('./v012-economy-harness.cjs');

function dungeon(seed=55){
 const a=create(seed,undefined,{}, {skipPersistence:true});
 a.start(1,true);
 const c=a.controller();
 c.chooseRealm(c.state.dungeon.cards[0].id);
 assert(c.visitRoom(1));
 assert(a.enter());
 return {a,r:a.state().run};
}

test('v13 Leather rolls use an explicit optional Evasion stat, not legacy fallback',()=>{
 const a=create(556,undefined,{}, {skipPersistence:true});
 for(const tier of [1,5,200])for(const rarity of ['Common','Uncommon','Rare','Epic']){
  const leather=a.makeItem(tier,'armor',null,'forge','Leather',rarity);
  assert.equal(typeof leather.evasionRating,'number');
  assert(leather.evasionRating>=0,'Current gear budget permits zero Evasion');
  const raw=JSON.stringify(leather),equipped={armor:leather};
  assert.equal(a.baseStats(equipped).evasionRating,leather.evasionRating);
  assert.equal(JSON.stringify(leather),raw,'Stat projections must not mutate gear');
  const missing={...leather};delete missing.evasionRating;
  assert.equal(a.baseStats({armor:missing}).evasionRating,0);
  assert.equal(a.baseStats({armor:{...leather,armorType:'Plate'}}).evasionRating,0);
 }
});

test('dodge chance is finite, diminishing, capped at 45%, and weaker against higher E',()=>{
 const a=create(556,undefined,{}, {skipPersistence:true}),f=a.gear.evasionChance;
 assert(f(2,5)>f(1,5));
 assert(f(3,5)-f(2,5)<f(2,5)-f(1,5));
 assert(f(10,200)<f(10,5));
 assert.equal(f(Number.MAX_VALUE,1),.45);
 for(const bad of [0,-1,NaN,Infinity])assert.equal(f(bad,5),0);
});

test('modern Dungeon physical Dodge logs avoidance without changing health or Barrier',()=>{
 const {a,r}=dungeon(557);
 assert(r?.enemy,'Current Dungeon encounter is loaded');
 const initial={hp:r.hp,barrier:r.barrier,enemyHp:r.enemy.hp};
 r.stats.evasionRating=100000;
 const feedback=a.feedback(); // Activate the harness event collector before the Dodge.
 a.rng(0);
 const ok=a.gear.tryDodge(r,'physical');
 assert.equal(ok,true);
 assert.equal(r.hp,initial.hp);
 assert.equal(r.barrier,initial.barrier);
 assert.equal(r.enemy.hp,initial.enemyHp);
 assert(feedback.logs.some(x=>x.text.includes('DODGE')));
 assert(feedback.floats.some(x=>x.value==='DODGE'&&x.target==='hero'));
});

test('spells and DoTs never Dodge; failed physical rolls do not trigger avoidance',()=>{
 const {a,r}=dungeon(558);
 r.stats.evasionRating=100000;
 for(const attack of ['spell','dot','unknown'])assert.equal(a.gear.tryDodge(r,attack),false);
 a.rng(.99);
 assert.equal(a.gear.tryDodge(r,'physical'),false);
 assert.equal(a.gear.enemyAttackType({eliteType:'caster'}),'spell');
 assert.equal(a.gear.enemyAttackType({bossStyle:'leech'}),'spell');
 assert.equal(a.gear.enemyAttackType({}),'physical');
});

test('equipment comparison and character stats display explicitly rolled Evasion',()=>{
 const a=create(559,undefined,{}, {skipPersistence:true}),item=a.makeItem(5,'belt',null,'forge','Leather','Rare');
 item.evasionRating=12;
 assert.match(a.gear.itemComparison(item),/Evasion Rating/);
 const widget=a.gear.statsWidget(a.baseStats({belt:item}));
 assert(widget.includes('Evasion'));
 assert(widget.includes('rating'));
 assert(widget.includes('% vs E1'));
});
