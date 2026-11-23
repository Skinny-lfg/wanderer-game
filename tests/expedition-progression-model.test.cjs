'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
require('../combat/expedition-progression.js');const P=globalThis.WandererExpeditionProgression;
test('equipment tier names remain stable beyond Expedition 100',()=>{for(const [level,id] of [[1,'adventurer'],[4,'adventurer'],[5,'veteran'],[15,'ascendant'],[35,'ancient'],[70,'exalted'],[1000,'exalted']])assert.equal(P.gearTier(level).id,id);});
test('enemy reference increases beyond E100 without a gameplay cap',()=>{const levels=[1,5,15,35,70,100,250,1000];for(let i=1;i<levels.length;i++)assert(P.enemyReference(levels[i])>P.enemyReference(levels[i-1]));assert(P.enemyReference(5)<1,'Uniform E1-based growth must make E5 softer than the old E5 anchor');assert.throws(()=>P.enemyReference(1000000),/finite range/);});
test('invalid expedition levels are rejected',()=>{for(const value of [0,-1,1.5,NaN,Infinity,'100']){assert.throws(()=>P.gearTier(value));assert.throws(()=>P.enemyReference(value));}});
test('experimental dungeon can start and unlock beyond E5 and E100',()=>{const create=require('./v012-economy-harness.cjs');for(const level of [5,100,1000]){const a=create(123,undefined,{}, {skipPersistence:true}),c=a.controller();c.state.unlocked=level;a.start(level,true);const g=c.state;assert.equal(g.expedition,level);assert(g.dungeon);const card=g.dungeon.cards[0];c.chooseRealm(card.id);g.stage='combat';g.selected={node:card.nodes.length-1,boss:true};const result=c.waveWon();assert(result.expeditionComplete);assert.equal(g.unlocked,level+1);}});
test('real gear generation uses a fixed named tier above E70',()=>{const a=require('./v012-economy-harness.cjs')(123,undefined,{}, {skipPersistence:true});const first=a.makeItem(1,'weapon',null,'loot','Sword','Rare'),late=a.makeItem(70,'weapon',null,'loot','Sword','Rare'),endless=a.makeItem(1000,'weapon',null,'loot','Sword','Rare');assert.equal(first.tier,1);assert.equal(late.tier,70);assert.equal(endless.tier,70);assert.equal(late.atk,endless.atk);assert(late.atk>first.atk);});
test('real enemy calculation uses the continuous reference above E100',()=>{require('../combat/v012-combat-core.js');const C=globalThis.WandererV012CombatCore,a=C.estimateEnemy(100,1),b=C.estimateEnemy(1000,1);assert(b.hp>a.hp);assert(b.atk>a.atk);assert(b.hp>a.hp*3,'The deliberate exponential growth must not be capped to a logarithmic <2x tail');assert(Number.isFinite(b.hp));});


// v0.13 gear roll budgets increase with tier, while stat layouts are intentionally variable.
test('E1–E5 generated Swords keep their distinct tiers and consistent rarity budgets',()=>{
 const a=require('./v012-economy-harness.cjs')(124,undefined,{}, {skipPersistence:true});
 let lastBudget=0;
 for(let level=1;level<=5;level++){
  const item=a.makeItem(level,'weapon',null,'loot','Sword','Rare');
  const expected=Math.round((2+level*.91)*1.7*100)/100;
  assert.equal(item.tier,level);
  assert.equal(item.v013Budget,expected);
  assert(item.v013StatCount>=2&&item.v013StatCount<=4);
  assert(item.atk>0);
  assert(item.v013Budget>lastBudget);
  lastBudget=item.v013Budget;
 }
});
test('later named tiers never downgrade the underlying rarity budget despite different affix layouts',()=>{
 const a=require('./v012-economy-harness.cjs')(125,undefined,{}, {skipPersistence:true});
 const tiers=[5,6,14,15,35,70,100,1000];
 const swords=tiers.map(level=>a.makeItem(level,'weapon',null,'loot','Sword','Rare'));
 const staffs=tiers.map(level=>a.makeItem(level,'weapon',null,'loot','Staff','Rare'));
 const plates=tiers.map(level=>a.makeItem(level,'armor',null,'loot','Plate','Common'));
 for(const items of [swords,staffs,plates])for(let i=1;i<items.length;i++)
  assert(items[i].v013Budget>=items[i-1].v013Budget,'budget cannot fall at E'+tiers[i]);
 assert.equal(swords[1].tier,5);
 assert.equal(swords.at(-1).tier,70);
 assert.equal(swords.at(-1).v013Budget,swords.at(-2).v013Budget);
 assert(plates.every(item=>!['str','agi','int','end','cha'].some(stat=>item[stat]>0)),'White Plate has no primary stats');
});
test('crafting retains distinct E1-E5 prices before switching to named tiers',()=>{
 require('../economy/v013-crafting.js');const C=globalThis.WandererV013Crafting;
 assert.deepEqual([1,2,3,4,5,6,14,15,34,35,69,70,1000].map(C.tierBand),[1,2,3,4,5,5,5,15,15,35,35,70,70]);
});
