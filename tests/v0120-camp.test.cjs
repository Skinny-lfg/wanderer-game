const {test}=require('node:test'),assert=require('node:assert/strict'),create=require('./v012-economy-harness.cjs');
function preparation(a,weapon='Sword'){
 a.setup(5,weapon);a.rollShop();a.start(1);a.initial('blood');a.controller().state.planeIndex=2;
}
function loot(a,slot='belt',overflow=false){const item=a.makeItem(5,slot,null,'loot',slot==='weapon'?'Sword':'Leather','Rare');a.bag.mark(item,overflow);return item;}
test('nine-slot bag has explicit overflow; next Realm waits for manual discard without currency rewards',()=>{
 const a=create(7);preparation(a);const s=a.state(),home=s.equip.weapon;
 const items=Array.from({length:11},()=>loot(a));assert.equal(a.bag.items().length,11);assert.equal(a.bag.overflow(),2);
 a.select(a.controller().state.offers[0].id);assert.equal(a.enter(),false);assert.equal(s.run,null);
 const gold=s.gold,fragments=s.fragments;assert.equal(a.bag.discard(home.id),false);
 assert.equal(a.bag.discard(items[0].id),true);assert.equal(a.bag.discard(items[0].id),false);assert.equal(a.bag.discard(items[1].id),true);
 assert.equal(a.bag.items().length,9);assert.equal(a.bag.overflow(),0);assert.equal(s.gold,gold);assert.equal(s.fragments,fragments);
 assert.equal(a.enter(),true);assert(s.run);assert.equal(a.bag.discard(items[2].id),false,'combat cannot discard loot');
});
test('active Expedition can equip only its loot; displaced home gear stays safe and cannot be re-equipped',()=>{
 const a=create(8);preparation(a);const s=a.state(),home=s.equip.weapon;
 const stored=a.makeItem(5,'weapon',null,'loot','Mace','Rare');s.stash.push(stored);assert.equal(a.equip(stored.id),false);assert.equal(s.equip.weapon.id,home.id);
 const item=loot(a,'weapon');a.equip(item.id);assert.equal(s.equip.weapon.id,item.id);assert(s.stash.some(o=>o.id===home.id));assert.equal(a.bag.items().length,0);
 assert.equal(a.equip(home.id),false);a.unequip('weapon');assert.equal(s.equip.weapon,null);assert.equal(a.bag.items().length,1);
 const ids=[...s.stash,...Object.values(s.equip).filter(Boolean),...s.expeditionOverflow].map(o=>o.id);assert.equal(new Set(ids).size,ids.length);
});
test('overflow loot equips without duplication and two-hand swaps obey global Stash capacity',()=>{
 const a=create(10);preparation(a);const s=a.state(),item=loot(a,'belt',true);a.equip(item.id);
 assert.equal(s.equip.belt.id,item.id);assert(!s.expeditionOverflow.some(o=>o.id===item.id));assert.equal(a.bag.items().length,0);
 const two=a.makeItem(5,'weapon',null,'loot','Two-Handed','Rare');a.bag.mark(two);
 while(s.stash.length<s.stashCapacity)s.stash.push(a.makeItem(1,'belt',null,'loot','Leather','Common'));
 const original=s.equip.weapon.id;assert.equal(a.equip(two.id),false);assert.equal(s.equip.weapon.id,original);assert(s.stash.some(o=>o.id===two.id));
});
test('Forge, Merchant, salvage and stale inventory paths cannot spend or convert items during an Expedition',()=>{
 const a=create(11);preparation(a);const s=a.state();s.gold=s.fragments=10000;const item=loot(a),count=s.stash.length;
 assert.equal(a.economyCanAct(),false);a.craft(1,0,'belt','Leather');a.buy(0);a.salvage([item.id]);
 assert.equal(s.gold,10000);assert.equal(s.fragments,10000);assert.equal(s.stash.length,count);assert(s.stash.some(o=>o.id===item.id));
});
test('native Wave award populates the bag once; prior Expedition loot never enters the next bag',()=>{
 const a=create(12);a.start(1);a.initial('blood');a.select(a.controller().state.offers.find(o=>o.family==='blood').id);a.enter();a.rng(0);
 a.state().run.enemy.hp=0;a.win();const ids=a.bag.ids();assert.equal(ids.length,1);a.win();assert.deepEqual(a.bag.ids(),ids);
 a.abandon();a.start(1);assert.equal(a.bag.items().length,0);assert.equal(a.bag.ids().length,0);assert(a.state().stash.some(o=>o.id===ids[0]));
});
test('potion slots retain existing recovery and dose rules, with a per-potion double-click guard',()=>{
 const a=create(13);a.setup(5,'Staff');assert.equal(a.potion('health'),false);a.start(1);a.initial('blood');assert.equal(a.potion('health'),false);
 a.controller().state.planeIndex=2;const stats=a.stats();a.setVitals({hp:stats.maxhp*.5,mp:stats.mana*.25,maxmp:stats.mana});
 assert.equal(a.potion('health'),true);const hp=a.vitals().hp;assert.equal(a.potion('health'),false);assert.equal(a.vitals().hp,hp);
 assert.equal(a.potion('mana'),true);const mp=a.vitals().mp;assert.equal(a.potion('mana'),false);assert.equal(a.vitals().mp,mp);
 assert.match(a.bag.passives(),/Initial passive/);assert.match(a.bag.passives(),/phase3PassiveSlot/);
});
test('overflow at Expedition end cannot be bypassed by starting a new attempt or opening vendors',()=>{
 const a=create(14);preparation(a);const items=Array.from({length:10},()=>loot(a));a.abandon();
 assert.equal(a.start(1),false);assert.equal(a.economyCanAct(),false);
 const fragments=a.state().fragments;a.salvage([items[0].id]);assert.equal(a.state().fragments,fragments);assert.equal(a.bag.items().length,10);
 assert.equal(a.equip(items[0].id),false);assert.equal(a.bag.discard(items[9].id),true);
 assert.equal(a.bag.overflow(),0);assert.equal(a.economyCanAct(),true);a.start(1);assert.equal(a.bag.items().length,0);
});
