'use strict';
// Off-Hand Stage 3: Epic blueprints and their real native combat effects.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
require('../economy/v013-crafting.js');
const C=globalThis.WandererV013Crafting,create=require('./v012-economy-harness.cjs');
const EPICS=[
 ['epic_aether_orb','Orb','magic','ward','spell'],
 ['epic_echoing_tome','Tome','magic','echoing_recall','mana'],
 ['epic_heartbloom_charm','Charm','vitality','heartbloom','hp']
];
const close=(value,expected,label)=>assert(Math.abs(value-expected)<1e-7,label+': '+value+' vs '+expected);
function afford(a,id,tier=35){
 const recipe=C.RECIPES.find(x=>x.id===id);assert(recipe,id);
 const cost=C.cost(id,tier),c=C.discover(C.create(),id);assert(c,'new Blueprint discovery');
 c.essence=cost.essence;c.cores[recipe.family]=cost.cores;
 const state=a.state();state.fragments=cost.fragments;state.crafting=c;
 return {cost,recipe,state};
}
function craft(a,id,tier=35){
 const {cost,recipe,state}=afford(a,id,tier),snapshot=JSON.stringify(state);
 const preview=C.previewCraft(id,tier,(...args)=>a.makeItem(...args,true));
 assert(preview,id+' preview');
 assert.equal(JSON.stringify(state),snapshot,'preview never alters state');
 const transaction=C.prepareCraft(state,id,tier,a.makeItem);
 assert(transaction,'materials/Blueprint suffice for '+id);
 assert.equal(JSON.stringify(state),snapshot,'craft preparation is transactional');
 const item=transaction.item;
 assert.equal(item.recipeId,id);assert.equal(item.rarity,'Epic');
 assert.equal(item.slot,'offhand');assert.equal(item.subtype,recipe.subtype);
 assert.equal(item.v013Trait,recipe.trait);assert.equal(item.affixes[0],{Orb:'spell',Tome:'mana',Charm:'hp'}[item.subtype]);
 assert.equal(item.crafted,true);
 assert.equal(transaction.fragments,state.fragments-cost.fragments);
 assert.equal(transaction.crafting.essence,state.crafting.essence-cost.essence);
 assert.equal(transaction.crafting.cores[recipe.family],state.crafting.cores[recipe.family]-cost.cores);
 for(const field of ['subtype','slot','rarity','v013Trait','recipeId','tier'])
  assert.equal(preview[field],item[field],id+' preview agrees on '+field);
 state.fragments=transaction.fragments;state.crafting=transaction.crafting;
 return item;
}
function fight(weapon,offhand,{seed=27331,recipe=null}={}){
 const a=create(seed,undefined,{}, {skipPersistence:true});
 a.setup(35,weapon,'Rare');
 const off=recipe?craft(a,recipe,35):a.makeItem(35,'offhand',null,'loot',offhand,'Epic');
 a.state().equip.offhand=off;
 a.setUnlocked(35);a.start(35,true);
 const c=a.controller(),card=c.state.dungeon.cards[0];
 c.chooseRealm(card.id);assert(c.visitRoom(1));assert(a.enter());
 const r=a.state().run;
 assert.equal(r.stats.off?.subtype,offhand);
 assert.equal(r.stats.off?.v013Trait,off.v013Trait,'equipped recipe trait reaches native combat');
 r.enemy.hp=r.enemy.maxhp=1e8;r.enemy.def=r.enemy.baseDef=r.enemy.barrier=0;
 r.stats.crit=0;r.stats.wardBonus=0;a.rng(.5);
 return {a,r,off};
}
test('Epic Orb, Tome and Charm have three unique lore-aligned recipe identities and functional traits',()=>{
 const ids=C.RECIPES.map(x=>x.id);
 assert.equal(ids.length,new Set(ids).size,'all Blueprint identifiers remain unique');
 for(const [id,subtype,family,trait,main] of EPICS){
  const r=C.RECIPES.find(x=>x.id===id);
  assert(r&&r.rarity==='Epic',id+' Epic exists');
  assert.equal(r.slot,'offhand');assert.equal(r.subtype,subtype);assert.equal(r.family,family);assert.equal(r.trait,trait);
  assert.equal(r.description,C.TRAITS[trait].description,'trait text is generated from live catalog');
  assert(C.TRAITS[trait].name&&C.TRAITS[trait].description);
  assert.match(r.source,/optional Dungeon Contract/,'Blueprint stays discoverable, not a guaranteed drop');
  const a=create(101+id.length),item=craft(a,id,35);
  assert(item[main]>0,id+' retains the subtype main stat');
 }
 assert.equal(C.RECIPES.filter(r=>r.rarity==='Epic'&&['Orb','Tome','Charm'].includes(r.subtype)).length,3);
});
test('New Epic Blueprints require explicit discovery and normal costs; resources do not unlock them',()=>{
 for(const [id,,family] of EPICS){
  const p=C.create(),price=C.cost(id,35);
  const baseline=C.cost('epic_aether_orb',35);
  assert.equal(price.fragments,baseline.fragments);assert.equal(price.essence,55);
  assert.equal(price.cores,4);assert.equal(price.coreFamily,family);
  p.essence=price.essence;p.cores[family]=price.cores;
  const s={fragments:price.fragments,crafting:p};
  assert.equal(C.progress(s,id,35).ready,false,'materials alone cannot unlock Blueprints');
  let calls=0;
  assert.equal(C.prepareCraft(s,id,35,()=>{calls++;throw Error('must not roll locked gear')}),null);
  assert.equal(calls,0);
  const discovered=C.discover(p,id);assert(discovered&&C.unlocked(discovered,id));
  assert.equal(C.discover(discovered,id),null,'duplicate Blueprint discovery does not grant another');
  assert.equal(C.progress({...s,crafting:discovered},id,35).ready,true);
  const notEnough={...s,crafting:{...discovered,cores:{...discovered.cores,[family]:3}}};
  assert.equal(C.progress(notEnough,id,35).ready,false,'one missing reagent blocks Forge');
 }
});
test('Epic preview remains pure and uses the same native roll/trait as Forge at E1, E35 and E201',()=>{
 const a=create(44190,undefined,{}, {skipPersistence:true,now:1700000000000});
 a.state().fragments=1e8;
 a.state().crafting={...C.create(),essence:100000,
  cores:Object.fromEntries(C.FAMILIES.map(f=>[f,100])),
  realmFamilies:[...C.FAMILIES],bossFamilies:[...C.FAMILIES],
  learnedRecipes:C.RECIPES.filter(r=>r.rarity!=='Uncommon').map(r=>r.id)};
 for(const tier of [1,35,201])for(const [id,subtype,,trait] of EPICS){
  const original=JSON.stringify(a.state());
  const preview=C.previewCraft(id,tier,(...args)=>a.makeItem(...args,true));
  const result=C.prepareCraft(a.state(),id,tier,a.makeItem);
  assert(result,id+' at E'+tier);
  assert.equal(JSON.stringify(a.state()),original,'preview and preparation do not consume state');
  for(const field of ['subtype','rarity','slot','v013Trait','tier','recipeId'])
   assert.equal(preview[field],result.item[field],id+'/'+field);
  assert.equal(result.item.subtype,subtype);assert.equal(result.item.v013Trait,trait);
  assert(result.item.v013StatCount>=3&&result.item.v013StatCount<=4);
  assert.equal(result.item.v013Budget,preview.v013Budget);
 }
});
test('Echoing Tome changes the real paid-action Recall from 3 to 5 Mana with one 6s cooldown',()=>{
 const {a,r}=fight('Wand','Tome',{recipe:'epic_echoing_tome'});
 r.maxmp=r.mp=1000;
 for(let i=0;i<3;i++){r.combatSeconds=i;a.gear.weaponAttack(r);}
 assert.equal(r.metrics.offhandTomeMana,5);
 assert.equal(r.metrics?.procs?.['Off-Hand: Tome Recall'],1);
 for(let i=3;i<6;i++){r.combatSeconds=i;a.gear.weaponAttack(r);}
 assert.equal(r.metrics.offhandTomeMana,5,'Epic Tome cannot bypass cooldown');
 for(let i=8;i<11;i++){r.combatSeconds=i;a.gear.weaponAttack(r);}
 assert.equal(r.metrics.offhandTomeMana,10,'second eligible Recall is also boosted');
 const base=fight('Wand','Tome',{seed:27332});
 base.r.maxmp=base.r.mp=1000;
 for(let i=0;i<3;i++){base.r.combatSeconds=i;base.a.gear.weaponAttack(base.r);}
 assert.equal(base.r.metrics.offhandTomeMana,3,'ordinary Epic Tome keeps normal passive');
 assert(!['echoing_recall','heartbloom'].includes(base.off.v013Trait),'exclusive recipe traits do not randomly appear');
});
test('Echoing Tome has no free trigger on pure physical attacks and never exceeds Max Mana',()=>{
 const {a,r}=fight('Sword','Tome',{recipe:'epic_echoing_tome',seed:27335});
 r.maxmp=r.mp=1000;
 for(let i=0;i<8;i++){r.combatSeconds=i;a.gear.weaponAttack(r);}
 assert.equal(r.metrics?.offhandTomeMana||0,0,'no funded spell or Mana action');
 const wand=fight('Wand','Tome',{recipe:'epic_echoing_tome',seed:27336});
 wand.r.maxmp=1000;wand.r.mp=1000;
 for(let i=0;i<3;i++){wand.r.combatSeconds=i;wand.a.gear.weaponAttack(wand.r);}
 assert(wand.r.mp<=wand.r.maxmp,'actual Mana pool must not overfill');
});
test('Heartbloom Charm increases Renewal to 2% Max HP while respecting 8s cooldown and healing wound',()=>{
 const {a,r}=fight('Sword','Charm',{recipe:'epic_heartbloom_charm',seed:27333});
 r.hp=r.maxhp*.5;r.combatSeconds=0;
 a.gear.weaponAttack(r);
 close(r.metrics.offhandCharmHealing,r.maxhp*.02,'heartbloom initial heal');
 assert.equal(r.metrics?.procs?.['Off-Hand: Charm Renewal'],1);
 const first=r.metrics.offhandCharmHealing;
 r.combatSeconds=1;a.gear.weaponAttack(r);
 assert.equal(r.metrics.offhandCharmHealing,first,'no second heal during cooldown');
 r.combatSeconds=8;r.hp=r.maxhp*.5;r.playerHealingDebuffUntil=30;
 a.gear.weaponAttack(r);
 close(r.metrics.offhandCharmHealing-first,r.maxhp*.02*.60,'native healing wound affects the trait');
 const second=r.metrics.offhandCharmHealing;
 r.combatSeconds=16;r.hp=r.maxhp;
 a.gear.weaponAttack(r);
 assert.equal(r.metrics.offhandCharmHealing,second,'full HP does not generate Renewal');
 r.combatSeconds=17;r.hp=r.maxhp*.5;r.enemy.barrier=1e9;
 a.gear.weaponAttack(r);
 assert.equal(r.metrics.offhandCharmHealing,second,'blocked HP damage does not trigger Renewal');
 const natural=fight('Sword','Charm',{seed:27334});
 natural.r.hp=natural.r.maxhp*.5;
 natural.a.gear.weaponAttack(natural.r);
 close(natural.r.metrics.offhandCharmHealing,natural.r.maxhp*.015,'ordinary Epic Charm keeps the base passive');
 assert(!['echoing_recall','heartbloom'].includes(natural.off.v013Trait));
});
test('New Epic effects are tied to the equipped Off-Hand, not other items or hidden global procs',()=>{
 const {a,r}=fight('Wand','Tome',{recipe:'epic_echoing_tome',seed:27337});
 // Even if a trait string exists elsewhere on equipped gear, only the matching Off-Hand receives the upgrade.
 r.stats.off.v013Trait='focused';a.state().equip.offhand.v013Trait='focused';
 a.state().equip.ring1={slot:'ring1',subtype:'Ring',v013Trait:'echoing_recall'};
 r.maxmp=r.mp=1000;
 for(let i=0;i<3;i++){r.combatSeconds=i;a.gear.weaponAttack(r);}
 assert.equal(r.metrics.offhandTomeMana,3,'equipped Ring must not grant the Tome-specific Epic modifier');
 const heart=fight('Sword','Charm',{recipe:'epic_heartbloom_charm',seed:27338});
 heart.r.stats.off.v013Trait='focused';heart.a.state().equip.offhand.v013Trait='focused';
 heart.a.state().equip.ring1={slot:'ring1',subtype:'Ring',v013Trait:'heartbloom'};
 heart.r.hp=heart.r.maxhp*.5;
 heart.a.gear.weaponAttack(heart.r);
 close(heart.r.metrics.offhandCharmHealing,heart.r.maxhp*.015,'a Ring cannot upgrade Charm Renewal');
});
test('Epic recipes and native runtime retain exact generated Pages mirrors',()=>{
 for(const path of ['economy/v013-crafting.js','combat/v012-combat-runtime.js'])
  assert.equal(fs.readFileSync('docs/'+path,'utf8'),fs.readFileSync(path,'utf8'),path);
});
