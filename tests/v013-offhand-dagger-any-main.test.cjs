'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const create=require('./v012-economy-harness.cjs');

function nativeCombat(main,offhand='Daggers'){
 const a=create(45112+main.length,undefined,{}, {skipPersistence:true});
 a.setup(35,main,'Rare');
 if(offhand==='Daggers'){
  const dagger=a.makeItem(35,'weapon',null,'loot','Daggers','Rare');
  a.state().stash.push(dagger);
  assert.equal(a.equip(dagger.id,'offhand'),true,
   'native Camp must allow '+main+' + Off-Hand Dagger');
  assert.equal(a.state().equip.offhand?.subtype,'Daggers');
 }else{
  assert.equal(a.state().equip.offhand?.subtype,offhand,
   'native setup should keep the selected non-dagger offhand');
 }
 a.setUnlocked(35);a.start(35,true);
 const c=a.controller(),card=c.state.dungeon.cards[0];
 c.chooseRealm(card.id);assert(c.visitRoom(1));assert(a.enter());
 const r=a.state().run;
 assert.equal(r.stats.main?.subtype,main);
 assert.equal(r.stats.off?.subtype,offhand);
 r.enemy.hp=r.enemy.maxhp=10000000;
 r.enemy.def=0;r.enemy.baseDef=0;r.enemy.barrier=0;
 r.stats.attack=100;r.stats.spellPower=100;r.stats.crit=0;r.stats.bonus={};
 r.offhandStrikes=0;r.offhandCadence=0;
 a.rng(.999);
 return {a,r};
}
test('All one-handed main types allow a true extra dagger hit after 2 mains, never every swing',()=>{
 for(const main of ['Sword','Daggers','Mace','Wand']){
  const {a,r}=nativeCombat(main);
  const first=a.gear.weaponAttack(r);
  assert(first>0,'first main attack must resolve '+main);
  assert.equal(r.offhandStrikes,0,'first swing should not include offhand: '+main);
  assert.equal(r.offhandCadence,1,'first main should advance dagger cadence: '+main);
  const hp=r.enemy.hp;
  const second=a.gear.weaponAttack(r);
  assert(second>0);
  assert.equal(r.offhandStrikes,1,'second swing should trigger offhand: '+main);
  assert.equal(r.offhandCadence,0,'cadence should reset: '+main);
  assert(hp-r.enemy.hp>second,
   'two actual damage instances should occur on trigger swing: '+main);
  a.gear.weaponAttack(r);
  assert.equal(r.offhandStrikes,1,'third swing should not proc offhand: '+main);
  a.gear.weaponAttack(r);
  assert.equal(r.offhandStrikes,2,'fourth swing should proc once again: '+main);
 }
});
test('A dagger strike uses its own 80% dagger attack factor and 50% strike penalty',()=>{
 const {a,r}=nativeCombat('Sword');
 const first=a.gear.weaponAttack(r);
 assert(first>0);
 const hp=r.enemy.hp;
 const actual=a.gear.weaponAttack(r,true);
 assert.equal(actual,40,'offhand hit at 100 Attack: dagger 0.8x then half = 40');
 assert.equal(hp-r.enemy.hp,actual);
 assert.equal(r.offhandStrikes,0,'manual offhand attack must never self-trigger or alter main cadence');
 assert.equal(r.offhandCadence,1);
});
test('Orb and Tome are unchanged: no dagger strike with otherwise identical Sword main hand',()=>{
 for(const offhand of ['Shield','Orb']){
  const {a,r}=nativeCombat(offhand==='Orb'?'Wand':'Sword',offhand);
  for(let n=0;n<4;n++)a.gear.weaponAttack(r);
  assert.equal(r.offhandStrikes,0,offhand+' is not an Off-Hand Dagger');
  assert.equal(r.offhandCadence,0,offhand+' does not advance dagger cadence');
 }
 const a=create(5522,undefined,{}, {skipPersistence:true});
 a.setup(35,'Sword','Rare');
 const tome=a.makeItem(35,'offhand',null,'loot','Tome','Rare');
 a.state().stash.push(tome);assert.equal(a.equip(tome.id,'offhand'),true);
 a.setUnlocked(35);a.start(35,true);
 const c=a.controller(),card=c.state.dungeon.cards[0];
 c.chooseRealm(card.id);assert(c.visitRoom(1));assert(a.enter());
 const r=a.state().run;
 r.enemy.hp=r.enemy.maxhp=10000000;r.enemy.def=0;r.enemy.baseDef=0;r.enemy.barrier=0;
 r.stats.crit=0;r.stats.bonus={};a.rng(.999);
 for(let n=0;n<4;n++)a.gear.weaponAttack(r);
 assert.equal(r.offhandStrikes||0,0,'Tome does not attack');
});
test('Offhand offensive attributes remain half; defensive stats remain full',()=>{
 const a=create(5577,undefined,{}, {skipPersistence:true});
 const sword=a.makeItem(5,'weapon',null,'loot','Sword','Rare');
 const dagger={slot:'offhand',subtype:'Daggers',atk:10,str:6,agi:4,int:8,
  cha:2,spd:6,spell:8,def:10,hp:20,end:2};
 const baseline=a.baseStats({weapon:sword});
 const withDagger=a.baseStats({weapon:sword,offhand:dagger});
 assert.equal(withDagger.atkFlat-baseline.atkFlat,5);
 assert.equal(withDagger.str-baseline.str,3);
 assert.equal(withDagger.agi-baseline.agi,2);
 assert.equal(withDagger.int-baseline.int,4);
 assert.equal(withDagger.cha-baseline.cha,1);
 assert.equal(withDagger.spdFlat-baseline.spdFlat,3);
 assert.equal(withDagger.spellFlat-baseline.spellFlat,4);
 assert.equal(withDagger.defFlat-baseline.defFlat,10);
 assert.equal(withDagger.hpFlat-baseline.hpFlat,20);
 assert.equal(withDagger.end-baseline.end,2);
});
test('Published source, combat rule and UI explain any one-handed pairing consistently',()=>{
 const src=fs.readFileSync('combat/v012-combat-runtime.js','utf8');
 const deployed=fs.readFileSync('docs/combat/v012-combat-runtime.js','utf8');
 assert.equal(deployed,src,'published Pages combat runtime must be in sync');
 assert(src.includes("if(!offhandStrike&&['Daggers','Off-Hand Dagger'].includes(off?.subtype))"));
 assert(!src.includes("weapon?.subtype==='Daggers'&&['Daggers','Off-Hand Dagger'].includes(off?.subtype)"));
 const ui=fs.readFileSync('index.html','utf8');
 const docs=fs.readFileSync('docs/index.html','utf8');
 for(const body of [ui,docs])
  assert(body.includes('Off-Hand Dagger with any one-handed main: one hit at 50% damage every two main hits'),
   'UI must document the new rule');
 const stats=fs.readFileSync('combat/v012-gear-stats.js','utf8');
 assert.equal(stats,fs.readFileSync('docs/combat/v012-gear-stats.js','utf8'));
});
