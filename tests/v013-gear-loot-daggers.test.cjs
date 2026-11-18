'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
require('../economy/v013-gear-rolls.js');
require('../economy/v013-crafting.js');
const G=globalThis.WandererV013GearRolls,C=globalThis.WandererV013Crafting,create=require('./v012-economy-harness.cjs');
const primary=['str','agi','int','end','cha'];
const positive=item=>G.KEYS.filter(k=>(Number(item[k])||0)>0);
const equivalent=item=>G.KEYS.reduce((n,k)=>n+(Number(item[k])||0)*G.COST[k],0);
test('starter items have identical weak stats in any new profile/seed',()=>{
 const snapshots=[101,999,10001].map(seed=>{
  const s=create(seed).state();
  return ['weapon','armor','helm'].map(slot=>{
   const item=s.equip[slot];assert(item&&item.startingGear&&item.rarity==='Common');
   assert(primary.every(k=>!(item[k]||0)));return [item.name,item.subtype,positive(item).map(k=>[k,item[k]])];
  });
 });
 assert.deepEqual(snapshots[0],snapshots[1]);assert.deepEqual(snapshots[1],snapshots[2]);
 assert.deepEqual(snapshots[0][0][2],[['atk',3]]);
 assert.deepEqual(snapshots[0][1][2],[['def',1]]);
 assert.deepEqual(snapshots[0][2][2],[['hp',4]]);
});
test('white/Common gear never rolls Strength, Agility, Intellect, Endurance or Charisma',()=>{
 const a=create(101);
 for(const [slot,subtype]of [
  ...['Sword','Mace','Bow','Daggers','Two-Handed','Wand','Staff'].map(x=>['weapon',x]),
  ['offhand','Shield'],['offhand','Orb'],['offhand','Off-Hand Dagger'],
  ['ring1','Ring'],['ring2','Ring'],['amulet','Amulet'],
  ...['Cloth','Leather','Plate'].flatMap(type=>['helm','armor','gloves','boots','belt'].map(slot=>[slot,type]))
 ]){
  const item=a.makeItem(1,slot,null,'loot',subtype,'Common');
  assert.equal(positive(item).length,1,slot+'/'+subtype);
  assert(primary.every(k=>!item[k]),slot+'/'+subtype);
 }
});
test('Rare two-stat and four-stat items share the same effective budget, allocated differently',()=>{
 const two={rarity:'Rare',slot:'weapon',subtype:'Sword'},four={...two};
 G.apply(two,10,()=>0);G.apply(four,10,()=>.999);
 assert.equal(positive(two).length,2);assert.equal(positive(four).length,4);
 assert.equal(two.v013StatCount,2);assert.equal(four.v013StatCount,4);
 assert(Math.abs(equivalent(two)-equivalent(four))<6,'Rounding should not turn fewer stats into lower budget');
 assert(two.atk>four.atk,'a two-stat Sword can have higher Attack than a four-stat Sword');
});
test('noncaster weapons can vary primary attributes; caster weapons never roll STR or AGI',()=>{
 const a=create(552);
 const rolled={Sword:new Set(),Mace:new Set(),Bow:new Set(),Daggers:new Set(),Ring:new Set(),Amulet:new Set()};
 for(let seed=0;seed<250;seed++){
  for(const [slot,type] of [['weapon','Sword'],['weapon','Mace'],['weapon','Bow'],['weapon','Daggers'],['ring1','Ring'],['amulet','Amulet']]){
   const item=a.makeItem(15,slot,null,'loot',type,'Rare');
   for(const attr of primary)if(item[attr]>0)rolled[type].add(attr);
   assert(!(item.atk>0&&item.spell>0),type+' must not have high Attack AND Spell Power on same roll');
  }
  for(const type of ['Staff','Wand']){
   const item=a.makeItem(15,'weapon',null,'loot',type,'Epic');
   assert.equal(item.str,0,type);assert.equal(item.agi,0,type);
   assert(item.spell>0,type);
  }
 }
 for(const [type,attribute]of [['Sword','int'],['Mace','end'],['Bow','str'],['Daggers','int'],['Ring','str'],['Ring','int'],['Amulet','end'],['Amulet','cha']])assert(rolled[type].has(attribute),type+' should be able to roll '+attribute);
});
test('actual native Rare accessories and Forge creations have variable stat layouts',()=>{
 const a=create(2026),layouts=new Set(),crafted=new Set();
 for(let i=0;i<30;i++){
  const item=a.makeItem(20,'ring1',null,'loot','Ring','Rare');
  layouts.add(positive(item).sort().join(','));
  const forge=a.makeItem(20,'weapon',null,'forge','Sword','Rare');
  crafted.add(positive(forge).sort().join(','));
 }
 assert(layouts.size>=3,'Ring pools need real variation');assert(crafted.size>=3,'Forge rolls must vary');
 for(const [id,profile]of [['blue_sword_insight','int'],['blue_mace_guard','end'],['blue_bow_might','str'],['blue_ring1_magic','int'],['blue_amulet_blood','str']]){
  const recipe=C.RECIPES.find(r=>r.id===id);assert(recipe&&recipe.profile===profile,id);
  const s=a.state();s.fragments=100000;s.crafting={...C.create(),essence:10000,cores:Object.fromEntries(C.FAMILIES.map(f=>[f,100])),realmFamilies:[...C.FAMILIES],bossFamilies:[...C.FAMILIES],learnedRecipes:C.RECIPES.filter(r=>r.rarity!=='Uncommon').map(r=>r.id)};
  const item=C.prepareCraft(s,id,20,a.makeItem).item;
  assert(item[profile]>0,id);assert(primary.every(k=>k===profile||!item[k]),id);
 }
});
test('native Dungeon: first cleared room guarantees equipment in actual Expedition Bag and reward record',()=>{
 for(const seed of [22,901,18482]){
  const a=create(seed,undefined,{}, {skipPersistence:true});
  a.setUnlocked(1);a.start(1,true);
  const c=a.controller(),card=c.state.dungeon.cards[0];
  c.chooseRealm(card.id);assert(c.visitRoom(1));assert(a.enter());
  const r=a.state().run;
  if(r.enemies)for(const enemy of r.enemies)enemy.hp=0;else r.enemy.hp=0;
  a.win();
  const items=a.bag.items().filter(item=>item.kind!=='valuable');
  assert(items.length>=1,'first natural room should award equipment in Bag');
  assert(items.every(item=>item.id&&a.results().earned.some(e=>e.id===item.id)));
  assert(items.some(item=>item.rarity!=='Common'),'first item should improve on weak starter');
 }
});
test('v0.13 loot rates are distinct from unchanged v0.12 live odds',()=>{
 const fs=require('node:fs'),vm=require('node:vm'),ctx={};
 vm.runInNewContext(fs.readFileSync(require('node:path').resolve('economy/v012-loot-rules.js'),'utf8'),ctx);
 const L=ctx.WandererV012LootRules;
 assert.equal(L.waveLootOdds(1).drop,.04);
 assert.equal(L.waveLootOdds(5).drop,.45);
 assert.equal(L.v013DungeonWaveOdds(1).drop,.28);
 assert.equal(L.v013DungeonWaveOdds(4).drop,.60);
 assert.equal(L.v013DungeonWaveOdds(5).drop,1);
});
test('paired Daggers: only two physical strikes across two attacks, off-hand half damage and half frequency',()=>{
 const a=create(6543,undefined,{}, {skipPersistence:true});
 a.setup(35,'Daggers','Rare');a.setUnlocked(35);a.start(35,true);
 const c=a.controller(),card=c.state.dungeon.cards[0];
 c.chooseRealm(card.id);assert(c.visitRoom(1));assert(a.enter());
 const r=a.state().run;assert.equal(r.stats.main.subtype,'Daggers');
 assert(['Daggers','Off-Hand Dagger'].includes(r.stats.off.subtype));
 r.stats.attack=100;r.stats.crit=0;r.stats.bonus={};r.enemy.hp=r.enemy.maxhp=10000000;r.enemy.def=0;r.enemy.baseDef=0;r.enemy.barrier=0;
 a.rng(0);a.feedback();
 const first=a.gear.weaponAttack(r);
 assert.equal(r.offhandStrikes||0,0,'offhand cannot hit on first main swing');
 const second=a.gear.weaponAttack(r);
 assert.equal(r.offhandStrikes,1,'one offhand strike after two main swings');
 assert.equal(first,second,'two main hits should be equivalent in controlled encounter');
 const logs=a.feedback().logs; // Inspect subsequent direct off-hand for exact isolated damage.
 const e=r.enemy;const before=e.hp;
 const off=a.gear.weaponAttack(r,true);
 assert.equal(off,Math.round(first*.5),'offhand attack should deal half a main-hand hit');
 assert.equal(before-e.hp,off);
});
