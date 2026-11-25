'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const create=require('./v012-economy-harness.cjs');
const LEVELS=[199,200,201,500,1000];

test('D: enemy stats use E200 reference and only the approved post-200 multiplier',()=>{
 const context={};require('node:vm').runInNewContext(fs.readFileSync('combat/v012-combat-core.js','utf8'),context);
 const estimate=context.WandererV012CombatCore.estimateEnemy,base=estimate(200,4);
 for(const level of LEVELS){const actual=estimate(level,4);assert(Object.values(actual).every(Number.isFinite));if(level>200)for(const key of ['hp','atk','def'])assert.equal(actual[key],Math.round(base[key]*(1+.005*(level-200))));}
 assert.notDeepEqual(estimate(199,4),base);
});

test('D: Forge and boss Rune rewards accept Endless tiers',()=>{
 for(const level of [201,500,1000]){
  const a=create(22);a.setUnlocked(level);a.state().fragments=20000;a.state().crafting.essence=4;
  const price=a.forge.progress('green_sword',level).cost;a.forge.craft('green_sword',level);
  assert.equal(a.state().stash.at(-1).tier,70);
  assert.equal(a.state().stash.at(-1).craftPrice,price.fragments);
  const rune=a.offerBossRunes(level);
  assert.equal(a.state().pendingRuneReward,null);
  assert.equal(a.state().runes.length,1);
  assert.equal(a.state().runes[0].id,rune.id);
  assert.equal(rune.tier,level);assert(rune.value>0);
  assert(a.state().runeSlots.every(id=>id===null));
 }
});

test('D.7: Endless weapon damage bonus excludes dual daggers and preserves other loadouts',()=>{
 const context={};require('node:vm').runInNewContext(fs.readFileSync('combat/v012-combat-core.js','utf8'),context);
 const bonus=context.WandererV012CombatCore.endlessWeaponDamageBonus;
 const loadouts=[['Sword','Shield',.20],['Mace','Shield',.30],['Wand','Orb',.15]];
 for(const [main,off,maximum] of loadouts)for(const [level,share] of [[199,0],[200,0],[201,.01],[250,.5],[300,1],[1000,1]]){
  assert(Math.abs(bonus(level,{subtype:main},{subtype:off})-maximum*share)<1e-12,`${main}/${off} E${level}`);
 }
 for(const [main,off] of [['Daggers',null],['Daggers','Daggers'],['Daggers','Off-Hand Dagger'],['Daggers','Shield'],['Sword',null],['Sword','Orb'],['Mace','Orb'],['Wand',null],['Wand','Shield'],['Staff','Orb'],['Bow',null],['Two-Handed',null]]){
  assert.equal(bonus(1000,{subtype:main},off&&{subtype:off}),0,`${main}/${off}`);
 }
});
