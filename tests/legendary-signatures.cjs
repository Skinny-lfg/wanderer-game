// Production combat, catalog, migration, and UI regressions, without network or real saves.
const assert=require('node:assert/strict'),fs=require('node:fs');
const {DEFINITIONS,GENERIC_IDS}=require('../combat/legendary.js');
const harness=require('./combat-harness.cjs'),h=harness(),a=h.combatAccess,state=a.getState(),catalog=a.LEGENDARY_CATALOG;
assert.equal(catalog.length,22);assert.equal(new Set(catalog.map(x=>x.id)).size,22);
assert.equal(Object.keys(DEFINITIONS).length,19);assert.equal(GENERIC_IDS.length,3);
function item(id){const c=catalog.find(x=>x.id===id);return {...a.makeItem(40,c.slot==='ring'?'ring1':c.slot,null,'loot',c.subtype,'Rare'),...c,slot:c.slot==='ring'?'ring1':c.slot,rarity:'Legendary',legendaryId:id,effect:DEFINITIONS[id]?.affinity||'poison',magic:['Staff','Wand'].includes(c.subtype)?DEFINITIONS[id]?.affinity||'poison':null};}
function setup(ids){state.equip=a.makeSlots();for(const id of ids){const o=item(id);state.equip[o.slot]=o;}
 const stats=a.totalStats();const r=state.run={enc:1,tier:40,status:'fight',stats,maxhp:1000,hp:500,maxmp:100,mp:20,barrier:0,combatSeconds:1,tPlayer:0,tEnemy:0,tDot:0,enemy:{hp:100000,maxhp:100000,atk:100,attackEvery:2,def:100,baseDef:100,barrier:0,slowTime:0,poisonStacks:0,bleedStacks:0,burnStacks:0,dots:{poison:[],bleed:[],burn:[]}}};return r;}
for(const c of catalog){let found=false;const effects=new Set();for(let i=0;i<160;i++){const o=a.makeItem(40,c.slot==='ring'?'ring1':c.slot,null,'loot',c.subtype,'Legendary');if(o.legendaryId!==c.id)continue;found=true;effects.add(o.effect);const d=DEFINITIONS[c.id];if(d){assert.equal(o.effect,d.affinity);assert.equal(a.legendarySignature(o).identity.id,c.id);}else assert.equal(a.legendarySignature(o),null);}
 assert(found,c.id+' obtainable');if(GENERIC_IDS.includes(c.id))assert(effects.size>1,'generic random affinities');
 const old={...item(c.id),effect:'poison',magic:['Staff','Wand'].includes(c.subtype)?'poison':null,atk:123,legendaryPower:'OLD STALE TEXT'};const restored=a.migrateItem(old);assert.equal(restored.effect,'poison');assert.equal(restored.atk,123);assert.equal(restored.legendaryId,c.id);assert(!a.legendaryDescription(restored).includes('OLD STALE TEXT'));assert(fs.existsSync('assets/legendary/'+c.image));}
let r=setup(['soul-reaver']);a.legendaryAffinity(r,'drain');assert(a.legendaryRuntime(r).armorReady);const first=r.setCooldowns['legendary:soul-reaver'];a.legendaryAffinity(r,'drain');assert.equal(r.setCooldowns['legendary:soul-reaver'],first);a.weaponAttack(r);assert(!a.legendaryRuntime(r).armorReady);
r=setup(['runeforged-eclipse']);r.enemy.barrier=20;a.legendaryAttackBonus(r,100,false,false);assert.equal(r.enemy.barrier,0);assert.equal(r.barrier,6);
r=setup(['starweaver-relic']);for(let i=0;i<2;i++)assert.equal(a.legendaryAttackBonus(r,100,false,true),0);assert.equal(a.legendaryAttackBonus(r,100,false,true),20);assert.equal(r.mp,23.6);
r=setup(['blade-of-the-first-dawn']);assert.equal(a.legendaryAttackBonus(r,100,false,false),0);assert.equal(a.legendaryAttackBonus(r,100,true,false),25);assert.equal(a.legendaryAttackBonus(r,100,true,false),0);
r=setup(['blade-of-the-first-dawn']);a.legendaryAttackBonus(r,100,false,false);r.combatSeconds=8;assert.equal(a.legendaryAttackBonus(r,100,true,false),0);
r=setup(['hammer-of-the-sunforge']);a.applyAffinity('sunder',r.enemy,r.stats);assert.equal(a.legendaryRuntime(r).weaken,.15);
r=setup(['sunpiercer-longbow']);a.applyAffinity('nature',r.enemy,r.stats);assert(a.legendaryRuntime(r).natureHasteUntil>r.combatSeconds);assert(a.playerStatusMarkup(r).includes('Wildroot Volley'));
r=setup(['fang-of-the-sunbreaker']);for(let i=0;i<3;i++)a.applyAffinity('poison',r.enemy,r.stats);a.legendaryAttackBonus(r,100,false,false);assert.equal(r.enemy.poisonStacks,4);a.legendaryAttackBonus(r,100,false,false);assert.equal(r.enemy.poisonStacks,4);
r=setup(['sunstride-sabatons']);for(let i=0;i<4;i++)a.legendaryAttackBonus(r,100,false,false);assert.equal(a.legendaryRuntime(r).thunderHasteUntil,4);
r=setup(['signet-of-the-dawnforged']);a.legendaryAttackBonus(r,100,true,false);assert(a.legendaryRuntime(r).focusReady);r.stats.crit=0;a.weaponAttack(r);assert(!a.legendaryRuntime(r).focusReady);
r=setup(['helm-of-the-dawnwarden','aegis-of-the-dawnstar','orb-of-the-solar-heart']);a.legendaryDefensiveEffects(r,0,10,20,true);assert.equal(r.barrier,0,'only last offhand occupies slot');assert.equal(r.hp,515);assert.equal(a.legendaryRuntime(r).guard,.12);
r=setup(['aegis-of-the-dawnstar']);a.legendaryDefensiveEffects(r,100,0,0,false);assert.equal(r.barrier,0,'block is not barrier break');a.legendaryDefensiveEffects(r,0,0,20,true);assert.equal(r.barrier,70);a.legendaryDefensiveEffects(r,0,0,20,true);assert.equal(r.barrier,70);
r=setup(['cuirass-of-the-last-sunrise']);a.legendaryDefensiveEffects(r,0,200);assert.equal(r.hp,500);for(let i=0;i<30;i++){r.combatSeconds+=.1;a.legendaryTick(r,.1);}assert(Math.abs(r.hp-560)<.0001);
r=setup(['heart-of-shadows']);r.hp=300;a.legendaryDefensiveEffects(r,0,30);assert(a.legendaryRuntime(r).refuge);a.legendaryAttackBonus(r,100,false,false);assert.equal(r.hp,330);
r=setup(['pendant-of-the-first-flame']);a.applyAffinity('burn',r.enemy,r.stats);a.legendaryKill(r);a.legendaryKill(r);assert.equal(r.hp,530);
r=setup(['crescent-of-the-emberveil']);a.applyAffinity('bleed',r.enemy,r.stats);a.legendaryOffhand(r,5);assert.equal(r.enemy.dots.bleed[0].remaining,4);a.legendaryOffhand(r,5);assert.equal(r.enemy.dots.bleed[0].remaining,4);
r=setup(['tome-of-the-eternal-flame']);for(let i=0;i<3;i++)a.applyAffinity('burn',r.enemy,r.stats);a.legendaryAttackBonus(r,100,false,false);assert.equal(r.enemy.burnStacks,2);assert.equal(a.legendaryRuntime(r).weaken,.15);
r=setup(['charm-of-the-dawnstar']);a.setHeal(r,100);assert.equal(a.legendaryRuntime(r).reserve,40);a.legendaryDefensiveEffects(r,0,20);assert.equal(r.hp,640);assert.equal(a.legendaryRuntime(r).reserve,0);r.hp=0;a.legendaryDefensiveEffects(r,0,100);assert.equal(r.hp,0);
r=setup(['winterheart-spire']);r.enemy.slowTime=2;a.legendaryAttackBonus(r,100,false,true);assert.equal(r.enemy.slowTime,3);assert.equal(r.tEnemy,-.5);assert(a.legendaryRuntime(r));
// Enemy-bound marks, mitigation and kill triggers never leak to the next wave.
r.enemy={...r.enemy,dots:{poison:[],bleed:[],burn:[]}};assert.equal(a.legendaryRuntime(r).weaken,0);
const art=fs.readFileSync('assets/legendary/winterheart_spire.png');assert.equal(art.readUInt32BE(16),256);assert.equal(art.readUInt32BE(20),256);assert.equal(art[25],6);
for(const effect of ['poison','burn','slow','drain','nature','shock','tide','sunder','crit','shield','regen','bleed','crystal']){const x=harness().simulate({affinity:effect,seed:7,speed:1}),y=harness().simulate({affinity:effect,seed:7,speed:4});delete x.equipment;delete y.equipment;assert.deepEqual(JSON.parse(JSON.stringify(x)),JSON.parse(JSON.stringify(y)),'1x/4x deterministic '+effect);}
// Exercise every identity in actual combat at both playback speeds, using independent seeded harnesses.
for(const entry of catalog){const ids=[entry.id];const x=harness().simulate({legendaryIds:ids,seed:42,speed:1}),y=harness().simulate({legendaryIds:ids,seed:42,speed:4});delete x.equipment;delete y.equipment;assert.deepEqual(JSON.parse(JSON.stringify(x)),JSON.parse(JSON.stringify(y)),entry.id+' playback invariance');}
// The next affinity roll, rather than the critical hit that primes it, receives Golden Focus.
r=setup(['fang-of-the-sunbreaker','signet-of-the-dawnforged']);r.stats.crit=0;
a.legendaryRuntime(r).focusReady=true;a.setRandom(()=>.6);a.weaponAttack(r);assert.equal(r.enemy.poisonStacks,1);a.weaponAttack(r);assert.equal(r.enemy.poisonStacks,1);
// Blocking with no Barrier neither breaks Barrier nor triggers Dawnward/Aegis.
r=setup(['helm-of-the-dawnwarden','aegis-of-the-dawnstar']);r.stats.attacksPerSec=.0001;r.stats.blockChance=100;r.stats.blockReduction=.5;r.tEnemy=999;a.updateFight();assert.equal(r.barrier,0);assert(!a.legendaryRuntime(r).guard);
// A real Barrier break primes mitigation for the following incoming hit.
r.barrier=1;r.tEnemy=999;a.updateFight();assert(r.barrier>0);assert.equal(a.legendaryRuntime(r).guard,.12);r.tEnemy=999;a.updateFight();assert.equal(a.legendaryRuntime(r).guard,0);
r=setup(['sunpiercer-longbow','aegis-of-the-dawnstar']);a.legendaryDefensiveEffects(r,0,20,10,true);assert.equal(r.barrier,0,'2H reserves offhand signatures');
r=setup(['fang-of-the-sunbreaker']);for(let i=0;i<20;i++)a.applyAffinity('poison',r.enemy,r.stats);assert.equal(r.enemy.poisonStacks,12);a.legendaryAttackBonus(r,100,false,false);assert.equal(r.enemy.poisonStacks,12);
r=setup(['fang-of-the-sunbreaker']);r.stats.bonus.venomBurst=true;for(let i=0;i<5;i++)a.applyAffinity('poison',r.enemy,r.stats);a.legendaryAttackBonus(r,100,false,false);assert.equal(r.enemy.poisonStacks,0,'extra stack feeds bounded Venom Burst');assert(r.setCooldowns.venomBurst>r.combatSeconds);
console.log('PASS 22 Legendary identities, 19 creative effects, 3 generics, saves, UI, cooldowns, no revive and 1x/4x');
