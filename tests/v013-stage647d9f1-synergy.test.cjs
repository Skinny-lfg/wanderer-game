'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const create=require('./v012-economy-harness.cjs'),{buy}=require('./v013-current-talent-helper.cjs');
const A=require('../scripts/v013-agent-strategy.cjs');
require('../combat/v012-combat-runtime.js');
const R=globalThis.WandererV012CombatRuntime;
test('Camp capability classifier tolerates null combat build',()=>{assert.doesNotThrow(()=>A.classify({build:null,talents:{nodes:[]}}));});
test('Guard bonus works with unlocked shieldless Guard but not with zero Guard',()=>{
 const a=create(3301);for(const slot of Object.keys(a.state().equip))a.state().equip[slot]=null;
 a.state().equip.weapon=a.makeItem(1,'weapon',null,'loot','Sword','Rare');const item=a.state().equip.weapon;
 item.blockBonus=0;assert.equal(a.baseStats().blockChance,0);
 item.blockBonus=8;assert.equal(a.baseStats().blockChance,0);
 a.state().automaticTalents=buy(['guarded_block']);item.blockBonus=0;const before=a.baseStats();
 assert(before.blockChance>0);item.blockBonus=8;const after=a.baseStats();
 assert.equal(after.blockChance,Math.min(65,before.blockChance+8));assert.equal(after.blockReduction,.35);
});
test('direct spell crit 0/100 percent and no random roll at guaranteed limits',()=>{
 let calls=0;const api=R.create({gameRandom:()=>{calls++;return .3;},phase6Metric:()=>{}});
 const r={stats:{crit:0}};assert.equal(api.spellCriticalDamage(r,100),100);
 r.stats.crit=100;assert.equal(api.spellCriticalDamage(r,100),150);assert.equal(calls,0);
 r.stats.crit=40;assert.equal(api.spellCriticalDamage(r,100),150);assert.equal(calls,1);
});
test('legendary paid Magic action counter triggers once per two paid actions and refunds actual discounted cost',()=>{
 const runtime={},r={stats:{spellPower:100},mp:20,maxmp:100};
 const api=R.create({legendaryRuntime:()=>runtime,legendaryHas:id=>id==='voidglass'||id==='astrafall',legendaryProc:()=>true,legendaryEmpowered:()=>false});
 assert.equal(api.legendaryFundedBonus(r,0),0);assert.equal(api.legendaryFundedBonus(r,8),0);
 assert.equal(api.legendaryFundedBonus(r,4),165);assert.equal(r.mp,21);assert.equal(r.legendaryCastCount,2);
});
