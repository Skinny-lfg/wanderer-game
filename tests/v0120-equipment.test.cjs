const {test}=require('node:test'),assert=require('node:assert/strict');
const create=require('./v012-economy-harness.cjs');
const plain=x=>JSON.parse(JSON.stringify(x));
function enter(a){a.start(1);a.initial('blood');a.select(a.controller().state.offers[0].id);a.enter();if(a.draft()?.step==='element')a.element('frost');}

test('armor categories reuse the primary stat budget, rarity and tier; weapons remain untyped',()=>{
 const a=create(42),slots=['helm','armor','gloves','boots','belt'];
 for(const slot of slots)for(const type of ['Cloth','Leather','Plate']){
  const item=a.makeItem(20,slot,null,'forge',type,'Rare');
  assert.equal(item.armorType,type);assert.equal(item.tier,20);assert.equal(item.rarity,'Rare');
  assert.equal(item.effect,null);assert.equal(item.magic,null);
  const expected={helm:1,armor:5,gloves:10,boots:6,belt:1}[slot];
  const key={Cloth:'int',Leather:'agi',Plate:'str'}[type];assert.equal(item[key],expected);
  assert.equal(item.str+item.agi+item.int+item.end,expected);
 }
 assert.equal(a.makeItem(20,'weapon').armorType,undefined);
 const cloth=a.makeItem(20,'armor',null,'forge','Cloth','Rare');
 const staff=a.makeItem(20,'weapon',null,'forge','Staff','Rare');
 const base=a.baseStats({weapon:staff}),withCloth=a.baseStats({weapon:staff,armor:cloth});
 assert(withCloth.int>base.int);assert(withCloth.manaRegen>base.manaRegen);
 const plate=a.makeItem(20,'armor',null,'forge','Plate','Rare');
 assert(a.baseStats({weapon:staff,armor:plate}).defense>withCloth.defense,'existing Strength formula supplies higher Plate Armor');
});
test('legacy gear retains its data but grants neither affinities nor sets',()=>{
 const a=create(3);a.setup(20,'Sword');const s=a.state();
 for(const item of Object.values(s.equip).filter(Boolean)){item.effect='crit';item.magic='poison';}
 const before=JSON.stringify(s.equip),stats=a.baseStats();
 assert.equal(JSON.stringify(s.equip),before);assert.equal(stats.main.effect,null);assert.equal(stats.main.magic,null);
 assert(Object.values(stats.counts).every(n=>n===0));assert.deepEqual(plain(stats.bonus),{});assert.equal(stats.sets.length,0);
 assert.deepEqual(plain(a.gear.setBonuses({crit:10,regen:10}).values),{});
 assert.equal(a.gear.affinityBadge(s.equip.weapon),'');assert.equal(a.gear.detailEffectHtml(s.equip.weapon),'');
});
test('Belt crafts, equips, compares, unequips, drops and sells through existing systems',()=>{
 const a=create(5),s=a.state();s.fragments=1000;
 a.craft(1,0,'belt','Cloth');const belt=s.stash.at(-1);assert.equal(belt.slot,'belt');assert.equal(belt.armorType,'Cloth');
 const before=a.baseStats();a.equip(belt.id);assert.equal(s.equip.belt.id,belt.id);assert(a.baseStats().int>before.int);
 assert(!s.stash.some(i=>i.id===belt.id));a.unequip('belt');assert.equal(s.equip.belt,null);assert(s.stash.some(i=>i.id===belt.id));
 const fragments=s.fragments;a.salvage([belt.id]);assert(s.fragments>fragments);assert(!s.stash.some(i=>i.id===belt.id));
 assert(a.gear.dungeonEquipmentOdds({}).some(x=>x.slot==='belt'&&x.prob>0));
 assert.equal(a.gear.placeholderIcon('belt'),'assets/placeholders/chest.svg');
 assert.equal(a.gear.itemSource({...belt,tier:5}).startsWith('E5'),true);
});
test('Merchant sells a Belt; obsolete Sigil rerolls cannot spend Gold',()=>{
 const a=create(9),s=a.state();s.gold=10000;a.rollShop();
 const belt=a.makeItem(1,'belt',null,'merchant','Leather','Rare');belt.goldPrice=a.merchantCost(belt);s.merchant.stock=[belt];
 const before=s.gold;a.buy(0);assert(s.stash.some(i=>i.id===belt.id));assert.equal(s.gold,before-belt.goldPrice);
 const after=s.gold;a.refresh('sigils');assert.equal(s.gold,after);assert.equal(s.merchant.sigils.length,0);
});
test('independent Legendary attacks survive; dependent abilities name the actual missing source',()=>{
 const a=create(22);a.setup(20,'Sword');const sword=a.makeItem(20,'weapon',null,'loot','Sword','Legendary');a.state().equip.weapon=sword;
 enter(a);const r=a.state().run;r.enemy.barrier=0;
 assert.equal(a.gear.legendaryAttackBonus(r,100,true,false),25);
 assert(a.gear.legendaryDescription({...sword,legendaryId:'blade-of-the-first-dawn'}).includes('First attack marks'));
 const ring=a.makeItem(20,'ring1',null,'loot','Ring','Legendary');
 assert(a.gear.legendaryDescription(ring).includes('inactive after their removal'));
 const bow=a.makeItem(20,'weapon',null,'loot','Bow','Legendary');
 assert(a.gear.legendaryDescription(bow).includes('Nature healing; no current Expedition source'));
});
test('native Sword, Daggers and Staff attacks still damage enemies; old Poison gear cannot apply statuses',()=>{
 for(const weapon of ['Sword','Daggers','Staff']){
  const a=create(31);a.setup(5,weapon);a.state().equip.weapon.effect='poison';a.state().equip.weapon.magic='poison';
  enter(a);a.build().families=[];a.build().picks=[];
  const r=a.state().run;r.enemy.hp=r.enemy.maxhp=100000;r.enemy.barrier=0;
  const mana=r.mp;a.gear.weaponAttack(r);assert(r.enemy.hp<100000);
  assert.equal(r.enemy.poisonStacks||0,0);assert.equal(r.enemy.burnStacks||0,0);
  if(weapon==='Staff')assert.equal(r.mp,mana-13);
 }
});

test('daggers equip in either hand with 50% offhand offense and retain 2H lock',()=>{
 const a=create(27),s=a.state();
 assert(a.types.includes('Daggers'));assert(!a.offhandTypes.includes('Off-Hand Dagger'));
 assert(!a.gear.dungeonEquipmentOdds({}).some(x=>x.subtype==='Off-Hand Dagger'));
 const item=a.makeItem(20,'weapon',null,'loot','Daggers','Rare');
 const main=a.baseStats({weapon:item}),off=a.baseStats({offhand:item});
 assert.equal(off.agi-5,(main.agi-5)/2);
 assert.equal(off.atkFlat,main.atkFlat/2);assert.equal(off.spdFlat,main.spdFlat/2);
 s.stash.push(item);assert.equal(a.equip(item.id,'offhand'),true);
 assert.equal(s.equip.offhand.slot,'offhand');assert.equal(a.unequip('offhand'),true);
 assert.equal(a.equip(item.id,'weapon'),true);assert.equal(s.equip.weapon.slot,'weapon');
 assert.equal(a.unequip('weapon'),true);
 s.equip.weapon=a.makeItem(20,'weapon',null,'loot','Bow','Rare');
 assert.equal(a.equip(item.id,'offhand'),false);assert(s.stash.some(x=>x.id===item.id));
});
test('off-hand daggers never grant an independent strike or Double Strike',()=>{
 const a=create(31);a.setup(5,'Sword');const s=a.state();
 const item=a.makeItem(5,'weapon',null,'loot','Daggers','Rare');
 s.stash.push(item);assert.equal(a.equip(item.id,'offhand'),true);
 enter(a);const r=s.run;r.enemy.hp=r.enemy.maxhp=100000;r.enemy.barrier=0;
 const feedback=a.feedback();a.rng(0);a.gear.weaponAttack(r);
 assert(!feedback.logs.some(x=>/Off-Hand Dagger strikes|Double Strike/.test(x.text)));
});
test('between-Realm swaps return displaced gear to the Bag; death destroys only Bag items',()=>{
 const a=create(81);a.setup(3,'Sword');const home=a.state().equip.weapon;
 a.start();a.initial('blood');a.select(a.controller().state.offers.find(p=>p.family==='blood').id);a.enter();
 let waves=a.state().run.planeWaves;
 for(let i=0;i<waves;i++){a.state().run.enemy.hp=0;a.win();a.flush();}
 assert.equal(a.draft().kind,'reward');assert.equal(a.passive(a.draft().options[0].id),true);assert.equal(a.exitResult(),true);
 const found=a.makeItem(3,'weapon',null,'loot','Mace','Rare');
 a.bag.mark(found);assert.equal(a.equip(found.id),true);
 assert.equal(a.state().equip.weapon.id,found.id);
 assert(a.bag.items().some(item=>item.id===home.id),'previous weapon returned to risk Bag');
 assert(!a.bag.items().some(item=>item.id===found.id),'equipped find leaves the Bag');
 a.select(a.controller().state.offers[0].id);a.enter();if(a.draft()?.step==='element')a.element('fire');
 a.death();
 assert.equal(a.state().equip.weapon.id,found.id,'equipped expedition gear survives death');
 assert(!a.state().stash.some(item=>item.id===home.id),'displaced original weapon is lost from Bag');
 assert(!a.bag.items().some(item=>item.id===home.id),'risk Bag is emptied on defeat');
});
