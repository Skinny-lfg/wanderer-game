const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const create=require('./v012-economy-harness.cjs');
require('../online/v012-save.js');
const entries=[
 ['crimson-fang','Daggers','weapon','blood'],['chalice-hollow-king','Daggers','amulet','blood'],
 ['gravewake','Two-Handed','weapon','decay'],['eye-of-morrow','Two-Handed','ring1','decay'],
 ['verdant-oath','Sword','weapon','vitality'],['heartroot-carapace','Sword','armor','vitality'],
 ['oathwall','Sword','offhand','aegis'],['veil-thousand-seals','Sword','belt','aegis'],
 ['kingsbreaker','Mace','weapon','fury'],['tempest-talon','Bow','weapon','fury'],
 ['astrafall','Staff','weapon','magic'],['voidglass','Wand','weapon','magic']
];
function fight(weapon,slot,id,affinity){const a=create(871);a.setup(50,weapon,'Epic');if(weapon==='Sword'||weapon==='Mace')a.state().equip.offhand=a.makeItem(50,'offhand',null,'loot','Shield','Epic');const item=a.state().equip[slot];item.rarity='Legendary';item.legendaryId=id;item.name=id;a.start(1);a.initial('blood');a.build().unlockedFamilies=affinity?[affinity]:[];a.select(a.controller().state.offers.find(p=>p.family==='blood').id);a.enter();a.build().unlockedFamilies=affinity?[affinity]:[];const r=a.state().run;r.enemy.hp=r.enemy.maxhp=100000;r.enemy.def=0;r.enemy.barrier=0;r.enemy.atk=100;r.enemy.effect=null;r.stats.evasionRating=0;r.stats.blockChance=0;r.tPlayer=r.tDot=r.tEnemy=0;r.mp=r.maxmp;return {a,r};}
function count(r,id){return r.metrics?.procs?.['Legendary: '+id]||0;}
for(const [id,weapon,slot,family]of entries){test(`${id} activates with and without its affinity; cooldown or per-Realm limit applies`,()=>{
 for(const empowered of [false,true]){const {a,r}=fight(weapon,slot,id,empowered?family:null);const e=r.enemy;
  if(id==='chalice-hollow-king'){e.dots.bleed.push({damage:1,remaining:4});e.bleedStacks=1;r.hp=r.maxhp*.5;}
  if(id==='eye-of-morrow')e.v012Rot=[{damage:1,remaining:4,ticks:0}];
  if(id==='heartroot-carapace')r.hp=r.maxhp*.5;
  if(id==='oathwall'){r.stats.blockChance=100;r.tEnemy=100;}
  if(id==='veil-thousand-seals'){r.tEnemy=100;}
  if(id==='tempest-talon')a.rng(0);
  if(id==='astrafall')r.legendaryState={astraCasts:1};if(id==='voidglass')r.legendaryState={voidCasts:1};
  if(id==='verdant-oath'||id==='kingsbreaker'||id==='tempest-talon'||id==='eye-of-morrow'){a.gear.legendaryAttackBonus(r,100,id==='tempest-talon',false);}
  else if(id==='heartroot-carapace'||id==='oathwall'||id==='veil-thousand-seals')a.tick();
  else {r.tPlayer=100;a.tick();}
  assert((id==='veil-thousand-seals'?r.metrics?.procs?.['Legendary: veil-thousand-seals: barrier']:count(r,id))>0,`${id} ${empowered?'with':'without'} ${family}`);
  const before=count(r,id);if(id==='heartroot-carapace')assert(r.hp>r.maxhp*.5);else if(id!=='veil-thousand-seals'){if(id==='oathwall')r.tEnemy=100;else if(id==='astrafall'||id==='voidglass')r.legendaryCastCount=1;else r.tPlayer=100;a.tick();assert.equal(count(r,id),before,`${id} cooldown`);}
 }
});}
test('only the twelve current Legendary identities drop in every slot',()=>{
 const a=create(5);
 for(const slot of a.slots)for(let i=0;i<8;i++){
  const item=a.makeItem(50,slot,null,'loot','random','Legendary');
  assert(entries.some(([id])=>id===item.legendaryId),slot+': '+item.legendaryId);
 }
});
test('Heartroot calibrated healing rate and Realm cap apply with and without Vitality',()=>{
 for(const [affinity,rate]of [[null,.002],['vitality',.003]]){
  const {a,r}=fight('Sword','armor','heartroot-carapace',affinity);
  r.hp=r.maxhp*.5;r.enemy.atk=0;r.stats.attacksPerSec=0;
  a.tick();
  assert(Math.abs(r.legendaryState.heartrootHealed-r.maxhp*rate*.11)<1e-6);
  for(let n=0;n<1000;n++)a.tick();
  assert(Math.abs(r.legendaryState.heartrootHealed-r.maxhp*.10)<1e-6);
 }
});
test('new IDs roundtrip locally; removed Legendary abilities are not recognized',()=>{
 const a=create(3);a.setup(50,'Sword','Epic');const item=a.state().equip.weapon;item.rarity='Legendary';item.legendaryId='verdant-oath';item.name='Verdant Oath';assert.equal(a.gear.itemImg(item),'assets/legendary/verdant-oath.webp');
 const profile={characterId:'wanderer',maxDungeon:1,chosen:1,gold:0,fragments:0,stashCapacity:40,stash:[{...item,id:'stash-copy'}],equip:a.state().equip,run:null,runes:[],runeSlots:[null,null,null],sigils:[],merchant:null,valuables:[]};
 const saved=globalThis.WandererV012Save.create(profile),restored=globalThis.WandererV012Save.validate(JSON.stringify(saved));assert.equal(restored.profile.equip.weapon.legendaryId,'verdant-oath');assert.equal(restored.profile.stash[0].legendaryId,'verdant-oath');
 const old={...item,legendaryId:'blade-of-the-first-dawn',name:'Blade of the First Dawn'};assert.equal(a.gear.legendaryDescription(old),'');
});
test('Crimson Fang works in offhand with two real hits but only one proc per cooldown',()=>{
 const {a,r}=fight('Daggers','weapon','crimson-fang',null);const off=a.state().equip.offhand;off.rarity='Legendary';off.legendaryId='crimson-fang';off.name='Crimson Fang';a.rng(.99);r.tPlayer=100;a.tick();assert.equal(count(r,'crimson-fang'),1);assert.equal(r.enemy.dots.bleed.length,1);assert.equal(r.legendaryAttackCount,2);assert.equal(r.lastLegendaryEncounter,undefined,'new ID must not activate generic +32% fallback');
 const other=fight('Daggers','amulet','chalice-hollow-king',null);const main=other.a.state().equip.weapon;main.rarity='Epic';delete main.legendaryId;const offhand=other.a.state().equip.offhand;offhand.rarity='Legendary';offhand.legendaryId='crimson-fang';offhand.name='Crimson Fang';other.a.rng(.99);other.r.tPlayer=100;other.a.tick();assert.equal(count(other.r,'crimson-fang'),1);assert.equal(other.r.legendaryAttackCount,2);
});
test('Bleed and Rot caps, Eye enemy cap, Heartroot Realm budget, and Barrier cap',()=>{
 const blood=fight('Daggers','weapon','crimson-fang','blood');blood.r.enemy.dots.bleed=Array.from({length:12},()=>({damage:1,remaining:4}));blood.r.tPlayer=100;blood.a.tick();assert.equal(blood.r.enemy.dots.bleed.length,12);assert.equal(blood.r.enemy.dots.bleed.at(-1).remaining,4);
 const decay=fight('Two-Handed','weapon','gravewake','decay');decay.r.enemy.v012Rot=Array.from({length:6},()=>({damage:1,remaining:4,ticks:0}));decay.r.tPlayer=100;decay.a.tick();assert.equal(decay.r.enemy.v012Rot.length,6);
 const eye=fight('Two-Handed','ring1','eye-of-morrow','decay');eye.r.enemy.v012Rot=[{damage:1,remaining:4,ticks:0}];eye.r.enemy.maxhp=1000;assert(eye.a.gear.legendaryAttackBonus(eye.r,1000,false,false)<=25);
 const heart=fight('Sword','armor','heartroot-carapace','vitality');heart.r.hp=heart.r.maxhp*.1;heart.r.enemy.atk=0;heart.r.stats.attacksPerSec=0;for(let n=0;n<1000;n++)heart.a.tick();assert(Math.abs(heart.r.legendaryState.heartrootHealed-heart.r.maxhp*.10)<0.001);
 const veil=fight('Sword','belt','veil-thousand-seals','aegis');assert(veil.r.barrier>0);assert(veil.r.barrier<=Math.round(veil.r.maxhp*.3));
});
test('Oathwall replaces the base counter and cannot recurse',()=>{
 const {a,r}=fight('Sword','offhand','oathwall','aegis');r.stats.attack=100;r.stats.blockChance=100;r.stats.blockReduction=0;r.enemy.def=0;r.tEnemy=100;const hp=r.enemy.hp;a.rng(0);a.tick();assert.equal(hp-r.enemy.hp,110);assert.equal(count(r,'oathwall'),1);assert.equal(r.setCooldowns.shieldBaseCounter,undefined);r.tEnemy=100;a.tick();assert.equal(hp-r.enemy.hp,110);
});
test('numerical affinity scaling for all twelve effects',()=>{
 function measure(id,weapon,slot,family,fn){return [false,true].map(empowered=>{const f=fight(weapon,slot,id,empowered?family:null);return fn(f.a,f.r);});}
 let x=measure('crimson-fang','Daggers','weapon','blood',(a,r)=>{r.tPlayer=100;a.tick();return r.enemy.dots.bleed.at(-1).damage;});assert(x[1]>x[0]);
 x=measure('chalice-hollow-king','Daggers','amulet','blood',(a,r)=>{r.hp=r.maxhp*.5;r.enemy.dots.bleed=[{damage:1,remaining:4}];r.enemy.bleedStacks=1;const h=r.hp;r.tPlayer=100;a.tick();return r.hp-h;});assert(x[1]>x[0]);
 x=measure('gravewake','Two-Handed','weapon','decay',(a,r)=>{r.tPlayer=100;a.tick();return r.enemy.v012Rot.at(-1).damage;});assert(x[1]>x[0]);
 x=measure('eye-of-morrow','Two-Handed','ring1','decay',(a,r)=>{r.enemy.v012Rot=[{damage:1,remaining:4}];r.enemy.maxhp=100000;return a.gear.legendaryAttackBonus(r,100,false,false);});assert.deepEqual(x,[60,85]);
 x=measure('verdant-oath','Sword','weapon','vitality',(a,r)=>{a.gear.legendaryAttackBonus(r,100,false,false);return r.legendaryState.verdantReady;});assert.deepEqual(x,[.6,.9]);
 x=measure('heartroot-carapace','Sword','armor','vitality',(a,r)=>{r.hp=r.maxhp*.5;const h=r.hp;a.tick();return r.hp-h;});assert(x[1]>x[0]);
 x=measure('oathwall','Sword','offhand','aegis',(a,r)=>{r.stats.attack=100;r.stats.blockChance=100;r.stats.blockReduction=0;r.enemy.def=0;r.tEnemy=100;const h=r.enemy.hp;a.rng(0);a.tick();return h-r.enemy.hp;});assert.deepEqual(x,[75,110]);
 x=measure('veil-thousand-seals','Sword','belt','aegis',(a,r)=>{a.tick();return r.barrier;});assert(x[1]>x[0]);
 x=measure('kingsbreaker','Mace','weapon','fury',(a,r)=>a.gear.legendaryAttackBonus(r,100,false,false));assert.deepEqual(x,[80,110]);
 x=measure('tempest-talon','Bow','weapon','fury',(a,r)=>a.gear.legendaryAttackBonus(r,100,true,false));assert.deepEqual(x,[25,35]);
 x=measure('astrafall','Staff','weapon','magic',(a,r)=>{r.legendaryState={astraCasts:1};return a.gear.legendaryAttackBonus(r,100,false,true);});assert(x[1]>x[0]);
 x=measure('voidglass','Wand','weapon','magic',(a,r)=>{r.legendaryState={voidCasts:1};r.legendaryFundedCost=20;r.mp=10;const bonus=a.gear.legendaryAttackBonus(r,100,false,true);return [bonus,r.mp];});assert(x[1][0]>x[0][0]&&x[1][1]>x[0][1]);
});
test('checkpoint restore retains new item IDs',()=>{
 const {a,r}=fight('Sword','weapon','verdant-oath',null);r.tPlayer=100;a.tick();const cp=a.checkpoint.capture();assert.equal(cp.profile.equip.weapon.legendaryId,'verdant-oath');a.checkpoint.restore(cp);assert.equal(a.state().equip.weapon.legendaryId,'verdant-oath');
});
test('Mana cast counters require two funded casts and survive cooldown',()=>{
 for(const [id,weapon,counter]of [['astrafall','Staff','astraCasts'],['voidglass','Wand','voidCasts']]){
  const {a,r}=fight(weapon,'weapon',id,'magic');r.legendaryFundedCost=20;r.mp=10;
  assert.equal(a.gear.legendaryAttackBonus(r,100,false,true),0);assert.equal(count(r,id),0);assert.equal(r.legendaryState[counter],1);
  assert(a.gear.legendaryAttackBonus(r,100,false,true)>0);assert.equal(count(r,id),1);assert.equal(r.legendaryState[counter],0);
  a.gear.legendaryAttackBonus(r,100,false,true);a.gear.legendaryAttackBonus(r,100,false,true);assert.equal(count(r,id),1);assert.equal(r.legendaryState[counter],2);
  r.combatSeconds=5;assert(a.gear.legendaryAttackBonus(r,100,false,true)>0);assert.equal(count(r,id),2);assert.equal(r.legendaryState[counter],0);
 }
});
test('Veil empowers only after its own Barrier absorbs and respects its offensive cooldown',()=>{
 for(const empowered of [false,true]){const {a,r}=fight('Sword','belt','veil-thousand-seals',empowered?'aegis':null);assert(r.legendaryState.veilBarrier>0);r.enemy.atk=1;r.tEnemy=100;a.tick();assert.equal(count(r,'veil-thousand-seals'),1);assert.equal(a.gear.legendaryAttackBonus(r,100,false,false),empowered?45:30);r.tEnemy=100;a.tick();assert.equal(count(r,'veil-thousand-seals'),1);assert.equal(a.gear.legendaryAttackBonus(r,100,false,false),0);}
});
test('Veil Realm Barrier uses the Sword + Shield rate only for that equipment',()=>{
 for(const [affinity,swordRate,otherRate]of [[null,.025,.04],['aegis',.04,.06]]){
  for(const [weapon,expected]of [['Sword',swordRate],['Mace',otherRate],['Staff',otherRate],['Wand',otherRate],['Daggers',otherRate]]){
   const {r}=fight(weapon,'belt','veil-thousand-seals',affinity);
   assert(Math.abs(r.legendaryState.veilBarrier/r.maxhp-expected)<1e-6,`${weapon} ${affinity||'no Aegis'}`);
  }
 }
});
test('Voidglass Mana refund and Chalice healing cannot exceed resource caps',()=>{
 const wand=fight('Wand','weapon','voidglass','magic');wand.r.legendaryState={voidCasts:1};wand.r.legendaryFundedCost=20;wand.r.mp=wand.r.maxmp-1;wand.a.gear.legendaryAttackBonus(wand.r,100,false,true);assert.equal(wand.r.mp,wand.r.maxmp);
 const chalice=fight('Daggers','amulet','chalice-hollow-king','blood');chalice.r.hp=chalice.r.maxhp;chalice.r.enemy.dots.bleed=[{damage:1,remaining:4}];chalice.r.enemy.bleedStacks=1;chalice.r.tPlayer=100;chalice.a.tick();assert.equal(chalice.r.hp,chalice.r.maxhp);
});
