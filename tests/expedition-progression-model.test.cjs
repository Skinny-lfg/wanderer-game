'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
require('../combat/expedition-progression.js');const P=globalThis.WandererExpeditionProgression;
test('equipment tier names remain stable beyond Expedition 100',()=>{for(const [level,id] of [[1,'adventurer'],[4,'adventurer'],[5,'veteran'],[15,'ascendant'],[35,'ancient'],[70,'exalted'],[1000,'exalted']])assert.equal(P.gearTier(level).id,id);});
test('enemy reference increases beyond E100 without a gameplay cap',()=>{const levels=[1,5,15,35,70,100,250,1000,1000000];for(let i=1;i<levels.length;i++)assert(P.enemyReference(levels[i])>P.enemyReference(levels[i-1]));assert.equal(P.enemyReference(5),5);});
test('invalid expedition levels are rejected',()=>{for(const value of [0,-1,1.5,NaN,Infinity,'100']){assert.throws(()=>P.gearTier(value));assert.throws(()=>P.enemyReference(value));}});
test('experimental dungeon can start and unlock beyond E5 and E100',()=>{const create=require('./v012-economy-harness.cjs');for(const level of [5,100,1000]){const a=create(123,undefined,{}, {skipPersistence:true}),c=a.controller();c.state.unlocked=level;a.start(level,true);const g=c.state;assert.equal(g.expedition,level);assert(g.dungeon);const card=g.dungeon.cards[0];c.chooseRealm(card.id);g.stage='combat';g.selected={node:card.nodes.length-1,boss:true};const result=c.waveWon();assert(result.expeditionComplete);assert.equal(g.unlocked,level+1);}});
test('real gear generation uses a fixed named tier above E70',()=>{const a=require('./v012-economy-harness.cjs')(123,undefined,{}, {skipPersistence:true});const first=a.makeItem(1,'weapon',null,'loot','Sword','Rare'),late=a.makeItem(70,'weapon',null,'loot','Sword','Rare'),endless=a.makeItem(1000,'weapon',null,'loot','Sword','Rare');assert.equal(first.tier,1);assert.equal(late.tier,70);assert.equal(endless.tier,70);assert.equal(late.v013RollBudget,endless.v013RollBudget);assert(late.v013RollBudget>first.v013RollBudget);});
test('real enemy calculation uses the continuous reference above E100',()=>{require('../combat/v012-combat-core.js');const C=globalThis.WandererV012CombatCore,a=C.estimateEnemy(100,1),b=C.estimateEnemy(1000,1);assert(b.hp>a.hp);assert(b.atk>a.atk);assert(b.hp<a.hp*2);});


// Stage 5.1: gear-tier progression remains monotonic, but rarity-specific affixes
// deliberately replace the legacy all-stats-on-every-item formula.
test('E1–E5 equipment tiers retain their levels and grow the stat budget, not fixed legacy affixes',()=>{
 const a=require('./v012-economy-harness.cjs')(124,undefined,{}, {skipPersistence:true});
 let last=0;
 for(let level=1;level<=5;level++){
  const item=a.makeItem(level,'weapon',null,'loot','Sword','Rare');
  assert.equal(item.tier,level);
  assert(item.v013RollBudget>last);
  assert(item.affixes.length>=2&&item.affixes.length<=3);
  last=item.v013RollBudget;
 }
});
test('named-tier stat budgets never downgrade after E5, while individual affix rolls can differ',()=>{
 const a=require('./v012-economy-harness.cjs')(125,undefined,{}, {skipPersistence:true});
 const tiers=[5,6,14,15,35,70,100,1000];
 for(const [slot,type,rarity] of [['weapon','Sword','Rare'],['weapon','Staff','Rare'],['armor','Plate','Common']]){
  const items=tiers.map(level=>a.makeItem(level,slot,null,'loot',type,rarity));
  for(let i=1;i<tiers.length;i++)assert(items[i].v013RollBudget>=items[i-1].v013RollBudget,type+' at E'+tiers[i]);
  assert.equal(items[1].tier,5);
  assert.equal(items.at(-1).tier,70);
  assert.equal(items.at(-1).v013RollBudget,items.at(-2).v013RollBudget);
 }
});
test('crafting retains distinct E1-E5 prices before switching to named tiers',()=>{
 require('../economy/v013-crafting.js');const C=globalThis.WandererV013Crafting;
 assert.deepEqual([1,2,3,4,5,6,14,15,34,35,69,70,1000].map(C.tierBand),[1,2,3,4,5,5,5,15,15,35,35,70,70]);
});
