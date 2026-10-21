'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
require('../online/v012-treasures.js');require('../online/v012-save.js');
const create=require('./v012-economy-harness.cjs'),S=globalThis.WandererV012Save;
const LEVELS=[199,200,201,500,1000];

test('D: enemy stats use E200 reference and only the approved post-200 multiplier',()=>{
 const context={};require('node:vm').runInNewContext(fs.readFileSync('combat/v012-combat-core.js','utf8'),context);
 const estimate=context.WandererV012CombatCore.estimateEnemy,base=estimate(200,4);
 for(const level of LEVELS){const actual=estimate(level,4);assert(Object.values(actual).every(Number.isFinite));if(level>200)for(const key of ['hp','atk','def'])assert.equal(actual[key],Math.round(base[key]*(1+.005*(level-200))));}
 assert.notDeepEqual(estimate(199,4),base);
});

test('D: Forge and boss Rune rewards accept Endless tiers',()=>{
 for(const level of [201,500,1000]){
  const a=create(22);a.controller().state.unlocked=level;a.state().fragments=20000;
  a.craft(level,0,'weapon','Sword');
  assert.equal(a.state().stash.at(-1).tier,level);
  assert.equal(a.state().stash.at(-1).craftPrice,a.craftCost(level));
  a.offerBossRunes(level);
  assert.equal(a.state().pendingRuneReward.tier,level);
  assert.equal(a.state().pendingRuneReward.options.length,3);
  assert(a.state().pendingRuneReward.options.every(r=>r.tier===level&&r.value>0));
 }
});

test('D: gear and Runes scale once; costs continue; attack speed is not multiplied',()=>{
 const a=create(18),base=a.makeItem(200,'weapon',null,'loot','Sword','Epic');
 for(const level of LEVELS){
  const item=a.makeItem(level,'weapon',null,'loot','Sword','Epic');
  const rune=a.makeRune('might',level),factor=1+.004*Math.max(0,level-200);
  if(level>200){assert.equal(item.atk,Math.round(base.atk*factor));assert.equal(item.str,Math.round(base.str*factor));assert.equal(rune.value,+(21*factor).toFixed(2));}
  if(level===200)assert.equal(item.atk,base.atk);
  assert.equal(item.spd,base.spd);assert.equal(a.craftCost(level),10+10*level);
  assert.equal(a.economy.upgradeCost(level,0),25+4*level);
  assert.equal(item.tier,level);
 }
 const leather=a.makeItem(500,'armor',null,'loot','Leather','Epic');
 assert.equal(leather.evasionRating,Math.round(a.makeItem(200,'armor',null,'loot','Leather','Epic').evasionRating*2.2));
 assert.equal(a.makeItem(1000,'weapon',null,'loot','Staff','Epic').atk,1);
});

test('D: every completed Expedition unlocks the next one, including E200 and E1000',()=>{
 for(const level of LEVELS){const a=create(19),controller=a.controller();controller.state.unlocked=level;controller.start(level);
  controller.chooseInitial('blood');controller.restore(JSON.parse(JSON.stringify(controller.state)));
  controller.state.planeIndex=15;controller.state.stage='combat';controller.state.selected={boss:true,waves:3};controller.state.wave=3;
  assert.equal(controller.waveWon().expeditionComplete,true);assert.equal(controller.state.unlocked,level+1);
 }
});

test('D: isolated schema 13 accepts high tiers and does not read schema 12 keys',()=>{
 assert.equal(S.VERSION,13);assert.match(S.key('local'),/endless/);
 for(const level of LEVELS){const a=create(20);a.setup(level,'Sword','Epic');const rune=a.makeRune('might',level);a.state().runes=[rune];a.state().runeSlots=[rune.id,null,null];const save=S.create({...a.state(),run:null});
  save.expedition={...save.expedition,completed:level-1,unlocked:level,attempts:level-1,lastOutcome:'victory'};
  const validated=S.validate(save);assert.equal(validated.expedition.unlocked,level);assert.equal(validated.profile.equip.weapon.tier,level);assert.equal(validated.profile.runes[0].tier,level);
  const previous={...save,schemaVersion:12};assert.throws(()=>S.validate(previous),/unsupported schema/);
 }
});

test('D: exhausted passive pool offers zero, one or two distinct legal choices',()=>{
 const B=create(21).buildcraft;
 for(const count of [0,1,2]){const build=B.create();build.families=['fury'];build.unlockedFamilies=['fury'];build.initialFamily='fury';build.initialPassive='quick_hands';build.realmIndex=8;
  const open=['quick_hands','precision'].slice(0,count);
  for(const passive of B.CATALOG.filter(p=>p.family==='fury'&&!p.requires.length))if(!open.includes(passive.id))build.picks.push(...Array(passive.max).fill(passive.id));
  const choices=B.options(build,'fury',()=>.4);assert.equal(choices.length,count);assert.equal(new Set(choices.map(p=>p.id)).size,count);
 }
});

test('D: personal leaderboard milestones continue beyond E200',()=>{
 const source=fs.readFileSync('index.html','utf8'),start=source.indexOf('function phase5MilestoneMarkup('),end=source.indexOf('function phase3CampMarkup(',start);
 const context={};require('node:vm').runInNewContext(source.slice(start,end)+'\nglobalThis.milestones=phase5MilestoneMarkup;',context);
 assert.match(context.milestones(200),/Next milestone: E225/);
 assert.match(context.milestones(1000),/Next milestone: E1025/);
 assert.match(context.milestones(1000),/E1000/);
});
