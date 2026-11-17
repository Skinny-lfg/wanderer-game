'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const create=require('./v012-economy-harness.cjs');
require('../economy/v013-crafting.js');require('../economy/v013-item-rolls.js');
const C=globalThis.WandererV013Crafting,R=globalThis.WandererV013ItemRolls;
const attrs=['str','agi','int','end','cha'];
const clone=x=>JSON.parse(JSON.stringify(x));
test('5.1 fresh starting kit is identical across RNG seeds, weak and has zero primary attributes',()=>{
 const kits=[create(1).state().equip,create(2).state().equip,create(301).state().equip];
 const keep=x=>['weapon','armor','helm'].map(sl=>{const i=x[sl];return {name:i.name,slot:i.slot,subtype:i.subtype,armorType:i.armorType,atk:i.atk,def:i.def,hp:i.hp,str:i.str,agi:i.agi,int:i.int,end:i.end,cha:i.cha,rarity:i.rarity,startingGear:i.startingGear};});
 assert.deepEqual(keep(kits[0]),keep(kits[1]));assert.deepEqual(keep(kits[0]),keep(kits[2]));
 assert.equal(kits[0].weapon.atk,3);assert.equal(kits[0].weapon.str,0);
 assert.equal(kits[0].armor.def,1);assert.equal(kits[0].helm.def,1);
 for(const item of ['weapon','armor','helm'].map(s=>kits[0][s])){assert.equal(item.rarity,'Common');assert(item.startingGear);for(const key of attrs)assert.equal(item[key]||0,0);}
});
test('5.1 white gear has one budgeted primary flat stat, no STR/AGI/INT/END/CHA',()=>{
 const a=create(41),cases=[['weapon','Sword'],['weapon','Wand'],['weapon','Staff'],['weapon','Bow'],['offhand','Shield'],['armor','Cloth'],['armor','Leather'],['armor','Plate'],['ring1','Ring'],['amulet','Amulet']];
 for(const [slot,type]of cases)for(const tier of [1,5,35]){
  const item=a.makeItem(tier,slot,null,'loot',type,'Common');
  assert.equal(item.affixes.length,1,slot+' '+type);
  assert(item.v013RollBudget>0);for(const attr of attrs)assert.equal(Number(item[attr])||0,0,'Common '+slot+' '+type+' must not roll '+attr);
 }
});
test('5.1 rarity controls number of stat lines, with full budget on two-stat items',()=>{
 const a=create(132);
 for(const rarity of ['Uncommon','Rare','Epic','Legendary'])for(const subtype of ['Sword','Bow','Wand','Mace','Daggers']){
  const item=a.makeItem(35,'weapon',null,'loot',subtype,rarity);
  const range=R.COUNT[rarity];assert(item.affixes.length>=range[0]&&item.affixes.length<=range[1]);
  assert.equal(new Set(item.affixes).size,item.affixes.length);
  assert(item.affixes.every(key=>R.poolFor(item).includes(key)),subtype);
  assert(item.v013RollBudget>0);
 }
 // Exactly the same base budget is distributed over two or three separate lines.
 const small={slot:'ring1',subtype:'Ring',rarity:'Rare'};
 const one=R.roll({...small},{referenceLevel:5,random:()=>.9});
 const two=R.roll({...small},{referenceLevel:5,random:()=>.1});
 assert.equal(one.v013RollBudget,two.v013RollBudget);
 assert([one.affixes.length,two.affixes.length].sort().join(',')==='2,3');
});
test('5.1 weapons obey meaningful pools; physical weapons can roll cross attributes',()=>{
 const a=create(9102),records={Sword:new Set(),Daggers:new Set(),Mace:new Set(),Bow:new Set()};
 for(let i=0;i<120;i++){
  for(const type of ['Sword','Daggers','Mace','Bow','Staff','Wand']){
   const item=a.makeItem(15,'weapon',null,'loot',type,'Rare');
   if(records[type])item.affixes.forEach(key=>records[type].add(key));
   if(['Staff','Wand'].includes(type)){assert.equal(item.str,0);assert.equal(item.agi,0);assert(!item.affixes.includes('atk'));}
  }
 }
 assert(records.Sword.has('int'),'Sword INT roll available');
 assert(records.Daggers.has('int'),'Daggers INT roll available');
 assert(records.Mace.has('end')&&records.Mace.has('hp'),'Mace END and HP rolls available');
 assert(records.Bow.has('str'),'Bow STR roll available');
});
test('5.1 Rings and Amulets vary naturally, and repeat crafts have legal distinct rolls',()=>{
 const a=create(7711),sets={ring1:new Set(),ring2:new Set(),amulet:new Set()};
 for(let i=0;i<50;i++)for(const slot of Object.keys(sets)){
  const item=a.makeItem(15,slot,null,'loot',slot.startsWith('ring')?'Ring':'Amulet','Rare');
  sets[slot].add(item.affixes.join(','));
 }
 for(const [slot,choices]of Object.entries(sets))assert(choices.size>=5,slot+' rolls should not be fixed');
 const state=a.state();state.fragments=1000000;state.crafting={...C.create(),essence:1000000,cores:Object.fromEntries(C.FAMILIES.map(x=>[x,100])),realmFamilies:[...C.FAMILIES],bossFamilies:[...C.FAMILIES]};
 for(const id of ['blue_sword_magic','blue_daggers_magic','blue_bow_blood']){
  assert(C.RECIPES.some(r=>r.id===id));const r=C.RECIPES.find(x=>x.id===id),item=C.prepareCraft(state,id,15,a.makeItem).item;
  assert(item);assert(item[r.profile]>0,'guaranteed recipe attribute '+r.profile);
  assert(item.affixes.every(key=>R.poolFor(item).includes(key)));
 }
 const crafted=new Set();
 for(let i=0;i<20;i++){
  const item=C.prepareCraft(state,'blue_ring',15,a.makeItem).item;
  crafted.add(item.affixes.join(','));
  assert(item.cha>0,'Ring crafting recipe promises CHA');
 }
 assert(crafted.size>=3,'Repeated crafted Rings need variable affixes');
});
function enterFirst(a,level=15){
 a.setup(level,'Sword','Rare');a.setUnlocked(level);a.start(level,true);
 const c=a.controller(),card=c.state.dungeon.cards[0];c.chooseRealm(card.id);
 assert(c.visitRoom(1));assert(a.enter());return {c,card,r:a.state().run};
}
test('5.1 first cleared native dungeon combat awards equipment to Bag and once-only ledger',()=>{
 const a=create(123456,undefined,{}, {skipPersistence:true}),{r}=enterFirst(a,15);
 for(let i=0;r.status==='fight'&&i<100;i++){for(const enemy of r.enemies?.length?r.enemies:[r.enemy])if(enemy)enemy.hp=0;a.win();a.flush();}
 assert.equal(r.status,'cleared');
 const found=a.bag.items().filter(i=>i.slot==='weapon'||i.slot==='armor'||i.slot==='helm'||i.slot==='belt'||i.slot==='offhand'||i.slot==='boots'||i.slot==='gloves'||i.slot==='amulet'||['ring1','ring2'].includes(i.slot));
 assert(found.length>=1,'First completed fight must fill Bag with at least one item');
 assert(found.some(i=>a.results().earned.some(x=>x.id===i.id)),'Item must also be in award ledger');
 assert.equal(new Set(found.map(i=>i.id)).size,found.length);
});
test('5.1 dual daggers have exactly two strikes over two mains; offhand is 50% damage at 50% cadence',()=>{
 const a=create(789,undefined,{}, {skipPersistence:true});a.setup(5,'Daggers','Rare');a.setUnlocked(5);a.start(5,true);
 const c=a.controller(),card=c.state.dungeon.cards[0];c.chooseRealm(card.id);assert(c.visitRoom(1));assert(a.enter());
 const r=a.state().run;assert(['Daggers','Off-Hand Dagger'].includes(r.stats.off.subtype));
 r.stats.attack=100;r.stats.crit=0;r.stats.bonus={};r.enemy.hp=r.enemy.maxhp=1000000;r.enemy.def=r.enemy.baseDef=0;r.enemy.barrier=0;
 a.rng(0);const before=r.enemy.hp;a.gear.weaponAttack(r);const first=before-r.enemy.hp;
 assert.equal(r.offhandStrikes||0,0,'Offhand cannot attack each main attack');
 const next=r.enemy.hp;a.gear.weaponAttack(r);const second=next-r.enemy.hp;
 assert.equal(r.offhandStrikes,1,'One offhand after two main attacks');
 assert.equal(r.offhandCadence,0);
 assert(second>first,'second main should also include a separate offhand strike');
 assert(Math.abs((second-first)-first*.5)<=3,'offhand hit should be about half main damage, after mitigation');
 assert.equal(r.metrics?.procs?.['🗡 Double Strike!']||0,0,'Dual wield must never trigger an extra third strike');
});
test('5.1 HUD, talents indicator and forge description follow new gameplay rules',()=>{
 const src=fs.readFileSync('index.html','utf8');
 for(const needle of ['stage51TalentPointIndicator','stage51Essence','stage51Reagents','src="economy/v013-item-rolls.js"','Example roll (stats vary)'])assert(src.includes(needle),needle);
 assert(src.includes("PHASE1_PREVIEW?'':o?'E'+o.tier:''"),'Old E1/E2 badge must not show on slot tiles');
});
