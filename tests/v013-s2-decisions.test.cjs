'use strict';
// Stage S2: fixtures provide controlled owned objects / materials solely to
// exercise existing native game transactions. Natural cohorts earn everything.
const test=require('node:test'),assert=require('node:assert/strict');
const create=require('./v012-economy-harness.cjs');
const N=require('../scripts/v013-natural-progression.cjs');
const make=(seed=10401)=>create(seed,undefined,{}, {skipPersistence:true,now:1720000000000+seed});

test('S2: diverse natural archetypes include focused and mixed Cloth/Leather/Plate plans',()=>{
 for(const id of ['plate-warden','leather-duelist','cloth-battlemage','hexblade-hybrid','arcane-fire','arcane-frost','arcane-lightning']){
  const p=N.PROFILES[id];assert(p,id);
  assert(['Cloth','Leather','Plate'].includes(p.armor));
  assert(['mixed','focused'].includes(p.style));
  assert(p.weapons.length>0);
 }
 const base={slot:'armor',rarity:'Uncommon',tier:2,def:8,hp:8,str:2,end:2,agi:2,int:2};
 for(const armor of ['Plate','Leather','Cloth']){
  const profile=Object.values(N.PROFILES).find(p=>p.armor===armor);
  assert(N.gearScore({...base,armorType:armor},profile)>
   N.gearScore({...base,armorType:({Plate:'Cloth',Leather:'Plate',Cloth:'Leather'})[armor]},profile));
 }
 const flame=N.PROFILES['arcane-fire'];
 assert(N.gearScore({slot:'weapon',subtype:'Wand',spell:8,int:2,rarity:'Common',tier:1},flame)>
  N.gearScore({slot:'weapon',subtype:'Sword',spell:8,int:2,rarity:'Common',tier:1},flame));
});

test('S2: every native potion kind has a build-specific decision score',()=>{
 const a=make(),all=a.potions.catalog;
 assert.equal(all.length,13);
 assert.equal(new Set(all.map(p=>p.id)).size,13);
 for(const kind of all.map(p=>p.id)){
  assert(Number.isFinite(N.potionScore(kind,N.PROFILES['arcane-fire'])),kind);
  assert(Number.isFinite(N.potionScore(kind,N.PROFILES['plate-warden'])),kind);
 }
 assert(N.potionScore('arcane',N.PROFILES['arcane-fire'])>
  N.potionScore('arcane',N.PROFILES['plate-warden']));
 assert(N.potionScore('might',N.PROFILES['plate-warden'])>
  N.potionScore('might',N.PROFILES['arcane-fire']));
 assert(N.potionScore('mana',N.PROFILES['arcane-fire'])>
  N.potionScore('mana',N.PROFILES['leather-duelist']));
});

test('S2: the actual three-slot potion API changes loadout without minting inventory',()=>{
 const a=make(10402),s=a.state(),catalog=a.potions.catalog;
 s.consumables=Object.fromEntries(catalog.map(p=>[p.id,1]));
 const before=JSON.stringify(s.consumables);
 const out=N.selectEarnedPotions(a,N.PROFILES['arcane-frost']);
 assert(out.some(x=>x.action==='loadout'));
 assert.equal(s.potionSelection.length,3);
 assert.equal(new Set(s.potionSelection).size,3);
 assert.equal(JSON.stringify(s.consumables),before);
 assert.equal(N.selectEarnedPotions(a,N.PROFILES['arcane-frost']).length,0);
});

test('S2: Apothecary purchases and replacement offers use real gold costs',()=>{
 const a=make(10403),s=a.state();
 s.gold=120;s.apothecary={stock:[
  {id:'offer-1',kind:'health',price:14},
  {id:'offer-2',kind:'arcane',price:22},
  {id:'offer-3',kind:'might',price:22},
  {id:'offer-4',kind:'scout',price:22}],refreshCost:999};
 const initial=s.gold;
 const result=N.buyEarnedPotions(a,N.PROFILES['arcane-fire'],1);
 const buys=result.filter(x=>x.action==='buy');
 assert(buys.length>=1);
 assert.equal(initial-s.gold,buys.reduce((n,x)=>n+x.cost,0));
 for(const p of buys)assert((s.consumables[p.kind]||0)>0);
 assert(s.potionSelection.length<=3);
 assert.equal(s.apothecary.stock.length,4);
});

test('S2: rune scoring favors relevant stats; boss rewards no longer use a selection dialog',()=>{
 const a=make(10404);
 const families=['might','swiftness','wisdom','fortitude','fortune','fury','warding','radiance'];
 const runes=families.map((family,i)=>a.makeRune(family,10+i));
 for(const rune of runes)assert(Number.isFinite(N.runeScore(rune,N.PROFILES['plate-warden'])));
 const wisdom=a.makeRune('wisdom',10),swiftness=a.makeRune('swiftness',10);
 assert(N.runeScore(wisdom,N.PROFILES['arcane-fire'])>N.runeScore(swiftness,N.PROFILES['arcane-fire']));
 assert(N.runeScore(swiftness,N.PROFILES['leather-duelist'])>N.runeScore(wisdom,N.PROFILES['leather-duelist']));
});

test('S2: only owned Rune IDs are equipped and duplicates recycled via native confirmation',()=>{
 const a=make(10405),s=a.state();
 s.runes=['might','wisdom','fortitude','fury','swiftness','radiance'].map((kind,i)=>a.makeRune(kind,10+i));
 s.runes.push(a.makeRune('wisdom',2),a.makeRune('might',2));
 const originalIds=new Set(s.runes.map(r=>r.id)),before=s.fragments,initial=s.runes.length;
 const actions=N.manageEarnedRunes(a,N.PROFILES['arcane-fire']);
 assert(s.runeSlots.filter(Boolean).length===3);
 for(const id of s.runeSlots)if(id)assert(originalIds.has(id));
 assert.equal(new Set(s.runeSlots.map(id=>s.runes.find(r=>r.id===id)?.family)).size,3);
 assert(actions.some(x=>x.action==='equip'));
 assert(actions.some(x=>x.action==='recycle'));
 assert(s.fragments>before);
 assert(s.runes.length<initial);
 for(const id of s.runeSlots)if(id)assert(s.runes.some(r=>r.id===id));
});

test('S2: native Forge uses the standard recipe cost and never forces armor attribute',()=>{
 const a=make(10406),s=a.state(),id='green_gloves_plate';
 assert.equal(a.forge.focuses,undefined);
 assert.equal(a.forge.tierPreview,undefined);
 assert.equal(a.forge.reinforce,undefined);
 const price=a.forge.progress(id,1);assert(price);
 s.fragments=price.cost.fragments;s.crafting.essence=price.cost.essence;
 const preview=a.forge.preview(id,1);assert(preview);
 assert.equal(preview.recipeId,id);
 const crafted=a.forge.craft(id,1);
 assert(crafted&&crafted.recipeId===id);
 assert.equal(crafted.slot,'gloves');
 assert.equal(crafted.armorType,'Plate');
 assert.equal(crafted.v013CraftFocus,undefined);
 assert.equal(s.fragments,0);assert.equal(s.crafting.essence,0);
 assert(s.stash.some(x=>x.id===crafted.id));
});
test('S2: native reagent refinement consumes 6 Essence and 3 dry-room marks',()=>{
 const a=make(10407),s=a.state();
 assert.equal(a.forge.refine('epic_ember_branch'),false);
 s.crafting.dryRooms.arcane=3;s.crafting.essence=6;
 assert.equal(a.forge.refine('epic_ember_branch'),false,'needs an earned Epic blueprint');
 s.crafting.learnedRecipes.push('epic_ember_branch');
 const before=s.crafting.cores.arcane;
 assert.equal(a.forge.refine('epic_ember_branch'),true);
 assert.equal(s.crafting.essence,0);
 assert.equal(s.crafting.dryRooms.arcane,0);
 assert.equal(s.crafting.cores.arcane,before+1);
 assert.equal(a.forge.refine('epic_ember_branch'),false);
});

test('S2: Solar Rebuke target diversion only occurs during true reflect windows',()=>{
 const thorn={id:'thorn',hp:50,miniboss:true,stage82:{type:'the_gilded',rebukeUntil:20}};
 const minion={id:'other',hp:20,role:'caster'};
 const run={status:'fight',combatSeconds:15,enemy:thorn,encounterLeader:thorn,enemies:[thorn,minion]};
 assert.equal(N.selectThornAwareTarget(run,N.PROFILES.cautious),minion);
 run.combatSeconds=21;
 assert.equal(N.selectThornAwareTarget(run,N.PROFILES.cautious),thorn);
 run.combatSeconds=15;minion.hp=0;
 assert.equal(N.selectThornAwareTarget(run,N.PROFILES.cautious),thorn);
});

test('S2: natural plate and magic account seeds start without fabricated XP, gear or resources',()=>{
 const opts={...N.DEFAULTS,seeds:[20401],profiles:['plate-warden','arcane-fire'],
  maxLevel:1,maxAttempts:1,maxTotalAttempts:1};
 const report=N.run(opts);
 assert.equal(report.coverage.errors,0);
 for(const account of report.accounts){
  const attempt=account.attempts[0];
  assert.equal(account.startXp,0);
  assert.equal(attempt.before.xp,0);
  assert.equal(attempt.camp.refined.length,0);
  assert.equal(Object.hasOwn(attempt.camp,'reinforced'),false);
  assert.equal(Object.hasOwn(attempt.camp,'upgraded'),false);
 }
});
