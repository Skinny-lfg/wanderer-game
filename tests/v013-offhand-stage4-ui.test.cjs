'use strict';
// Off-Hand Stage 4: exact native-effect presentation and honest cross-type comparisons.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
require('../combat/v012-gear-stats.js');require('../economy/v013-crafting.js');
const G=globalThis.WandererV012GearStats,C=globalThis.WandererV013Crafting,create=require('./v012-economy-harness.cjs');
function item(type,trait){return {slot:'offhand',subtype:type,rarity:'Epic',tier:35,...(trait?{v013Trait:trait}:{})};}
test('Off-Hand projections use native formulas, cooldowns, Ward bonus and Epic improvements without changing Power',()=>{
 const s={maxhp:1000,spellPower:200,wardBonus:.10,mana:50,power:123};
 const orb=G.offhandEffect(item('Orb'),s),epicOrb=G.offhandEffect(item('Orb','ward'),s);
 assert.equal(orb.title,'Orb Ward');assert.equal(orb.interval,6);assert.equal(orb.unit,'Barrier');
 assert.equal(orb.amount,33,'2% HP + 5% SP, multiplied by Ward bonus exactly once');
 assert.equal(orb.epic,null);
 assert.equal(epicOrb.amount,33,'Epic recipe does not replace native Orb Ward');
 assert.equal(epicOrb.epicAmount,22,'separate funded-cast Arcane Ward');
 assert.equal(G.offhandEffect(item('Orb','ward'),{...s,mana:0}).epicAvailable,false);
 const tome=G.offhandEffect(item('Tome'),s),echo=G.offhandEffect(item('Tome','echoing_recall'),s);
 assert.equal(tome.amount,3);assert.equal(echo.amount,5);
 assert.equal(echo.interval,6);assert.equal(echo.unit,'Mana');
 assert.match(G.offhandEffect(item('Tome'),{...s,mana:0}).condition,/Inactive/);
 const charm=G.offhandEffect(item('Charm'),s),heart=G.offhandEffect(item('Charm','heartbloom'),s);
 assert.equal(charm.amount,15);assert.equal(heart.amount,20);
 assert.equal(heart.interval,8);assert.equal(heart.unit,'HP');
 assert.match(heart.condition,/Healing debuffs/);
 assert.equal(s.power,123,'presenting proc values cannot alter stat estimator');
 assert.equal(G.offhandEffect({slot:'offhand',subtype:'Shield'},s),null);
 assert.equal(G.offhandEffect({...item('Orb'),slot:'ring1'},s),null);
});
test('Inventory comparison shows both passives and Epic traits, with Ward/Mana secondary stat deltas',()=>{
 const a=create(94201,undefined,{}, {skipPersistence:true});
 a.setup(35,'Sword','Rare');
 const orb=a.makeItem(35,'offhand',null,'loot','Orb','Epic');
 const tome=a.makeItem(35,'offhand',null,'loot','Tome','Epic');tome.v013Trait='echoing_recall';tome.manaRegenBonus=.35;orb.wardBonus=.03;
 a.state().equip.offhand=orb;
 const html=a.gear.itemComparison(tome);
 assert(html.includes('Off-Hand effects · excluded from Gear Power'));
 assert(html.includes('Orb Ward')&&html.includes('Tome Recall'),'show old and new identities together');
 assert(html.includes('Echoing Recall'),'show Epic-only upgrade');
 assert(html.includes('Different passives'),'no misleading winner declaration');
 assert(html.includes('Mana regeneration')||html.includes('Barrier strength'),'secondary stats must show when different');
 assert(html.includes('Gear Power')&&html.includes('stat estimate'),'power diagnostic remains separate');
 assert(a.gear.gearTrend(tome).includes('Compare Off-Hand passive'),'inventory does not rank different procs by Power');
});
test('Equivalent passive comparisons still show precise source and current scaled values',()=>{
 const a=create(94202,undefined,{}, {skipPersistence:true});
 a.setup(35,'Sword','Rare');
 const first=a.makeItem(35,'offhand',null,'loot','Charm','Epic');
 const next=a.makeItem(35,'offhand',null,'loot','Charm','Epic');next.v013Trait='heartbloom';
 a.state().equip.offhand=first;
 const html=a.gear.itemComparison(next);
 assert(html.includes('Charm Renewal')&&html.includes('Heartbloom Renewal'));
 assert(html.includes('2% Max HP')&&html.includes('1.5% Max HP'));
 assert(html.includes('Up to')&&html.includes('HP per proc'));
 assert(a.gear.detailEffectHtml(next).includes('Heartbloom Renewal'));
});
test('Pure physical Aegis + Orb uses Spell Power; Tome without Mana is accurately disclosed',()=>{
 const a=create(94203,undefined,{}, {skipPersistence:true});
 a.setup(35,'Sword','Rare');
 const orb=a.makeItem(35,'offhand',null,'loot','Orb','Rare'),tome=a.makeItem(35,'offhand',null,'loot','Tome','Epic');
 const baseline=a.baseStats({weapon:a.state().equip.weapon,offhand:orb});
 assert(baseline.spellPower>0,'Orb activates defensive Spell Power');
 assert.equal(baseline.mana,0,'Orb does not grant Mana');
 assert(G.offhandEffect(tome,a.baseStats({weapon:a.state().equip.weapon,offhand:tome})).condition.includes('Inactive'));
 assert(a.gear.offhandEffectPanel(orb,baseline).includes('Orb Ward'));
 assert(a.gear.offhandEffectPanel(tome,a.baseStats({weapon:a.state().equip.weapon,offhand:tome})).includes('Inactive'));
});
test('Removed empty UI helpers and stale Wand-only Barrier claims have no remaining consumers',()=>{
 const source=fs.readFileSync('index.html','utf8'),pages=fs.readFileSync('docs/index.html','utf8');
 for(const name of ['affinityBadge(','barrierSource(','lostSetTiers(']){
  assert(!source.includes(name),name+' source');assert(!pages.includes(name),name+' Pages');
 }
 assert(!source.includes('Pair with an Orb for Ward.'));
 assert(source.includes('offhandComparePanel(')&&pages.includes('offhandComparePanel('));
 assert(source.includes('Different Off-Hand passive: compare effects before equipping'));
 assert(source.includes('Gear Power is a partial stat estimate, not DPS or overall build strength'));
 assert(pages.includes('offhandEffectPanel('));
});
test('Native helper and generated Pages mirror stay byte-identical',()=>{
 const native=fs.readFileSync('combat/v012-gear-stats.js','utf8');
 assert.equal(fs.readFileSync('docs/combat/v012-gear-stats.js','utf8'),native);
 assert.equal(fs.readFileSync('docs/online/v013-gear-qol.css','utf8'),fs.readFileSync('online/v013-gear-qol.css','utf8'));
});
