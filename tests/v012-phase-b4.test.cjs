const {test}=require('node:test'),assert=require('node:assert/strict');
const create=require('./v012-economy-harness.cjs');
require('../online/v012-save.js');
const Save=globalThis.WandererV012Save;
function fight(weapon,offhand){const a=create(4711);a.setup(50,weapon,'Epic');if(offhand)a.state().equip.offhand=a.makeItem(50,'offhand',null,'loot',offhand,'Epic');a.start(1);a.initial('blood');a.select(a.controller().state.offers.find(p=>p.family==='blood').id);a.enter();const r=a.state().run;r.enemy.hp=r.enemy.maxhp=100000;r.enemy.def=0;r.enemy.barrier=0;r.enemy.atk=100;r.enemy.effect=null;r.enemy.slowTime=0;r.stats.attacksPerSec=0;r.stats.evasionRating=0;r.tPlayer=r.tDot=0;r.tEnemy=100;return {a,r};}
test('new and restored Orbs have the same single 12% contribution in combat and projection',async()=>{
 const a=create(12),tier=50,power=Math.round((2+tier*.91)*2.1),wand=a.makeItem(tier,'weapon',null,'loot','Wand','Epic'),newOrb=a.makeItem(tier,'offhand',null,'loot','Orb','Epic');
 assert.equal(newOrb.spell,Math.round(power*1.12));assert.equal(newOrb.orbSpellB4,true);
 const oldOrb={...newOrb,id:'old-orb',spell:power};delete oldOrb.orbSpellB4;
 const before=JSON.stringify(oldOrb),oldStats=a.baseStats({weapon:wand,offhand:oldOrb}),newStats=a.baseStats({weapon:wand,offhand:newOrb});
 assert.equal(JSON.stringify(oldOrb),before);assert.equal(oldStats.spellPower,newStats.spellPower);
 assert.equal(a.gear.itemComparison(oldOrb).includes('Spell'),true);
 const {totalStats:publicStats}=await import('../online/pvp-stats.mjs');
 assert.equal(publicStats({weapon:wand,offhand:oldOrb}).spellPower,oldStats.spellPower);
 assert.equal(publicStats({weapon:wand,offhand:newOrb}).spellPower,newStats.spellPower);
 assert.equal(oldStats.spellFlat-a.baseStats({weapon:wand}).spellFlat,Math.round(power*1.12));
 const staff=a.makeItem(tier,'weapon',null,'loot','Staff','Epic');assert.equal(a.baseStats({weapon:staff,offhand:oldOrb}).spellPower,a.baseStats({weapon:staff}).spellPower);
 const profile={characterId:'wanderer',maxDungeon:1,chosen:1,gold:0,fragments:0,stashCapacity:40,stash:[],equip:{weapon:wand,offhand:oldOrb},run:null,runes:[],runeSlots:[null,null,null],sigils:[],merchant:null,valuables:[]};
 const saved=Save.create(profile),raw=JSON.stringify(saved),restored=Save.validate(raw);
 assert.equal(JSON.stringify(saved),raw);assert.equal(restored.profile.equip.offhand.spell,power);assert.equal(restored.profile.equip.offhand.orbSpellB4,undefined);
 assert.equal(a.baseStats(restored.profile.equip).spellPower,newStats.spellPower);
 const latest=Save.create({...profile,equip:{weapon:wand,offhand:newOrb}});assert.equal(Save.validate(JSON.stringify(latest)).profile.equip.offhand.orbSpellB4,true);
});
test('Sword shield base counter is direct 65% damage with 2.5s cooldown; Mace remains 45%',()=>{
 for(const [weapon,rate]of [['Sword',.65],['Mace',.45]]){const {a,r}=fight(weapon,'Shield');r.stats.attack=100;r.stats.blockChance=100;r.stats.blockReduction=0;r.enemy.def=0;const start=r.enemy.hp;a.rng(0);a.tick();const first=start-r.enemy.hp;assert.equal(first,Math.round(Math.round(100*(weapon==='Mace'?1.4:1))*rate));assert.equal(r.setCooldowns.shieldBaseCounter,2.61);assert.equal(a.measured.attacks,0,'counter is not a weapon attack');r.tEnemy=100;a.tick();assert.equal(start-r.enemy.hp,first,'cooldown prevents duplicate');r.combatSeconds=2.5;r.tEnemy=100;a.tick();assert.equal(start-r.enemy.hp,first*2);}
 const {a,r}=fight('Sword','Orb');r.stats.blockChance=100;r.tEnemy=100;a.rng(0);a.tick();assert.equal(r.setCooldowns?.shieldBaseCounter,undefined);
});
test('dual Daggers gain capped Barrier only on successful physical Evasion, every six seconds',()=>{
 const {a,r}=fight('Daggers','Daggers');r.stats.evasionRating=10000;r.stats.blockChance=0;r.barrier=0;a.rng(0);a.tick();assert.equal(r.barrier,r.maxhp*.03);assert.equal(r.setCooldowns.daggerEvasionBarrier,6.11);
 const first=r.barrier;r.tEnemy=100;a.tick();assert.equal(r.barrier,first);r.combatSeconds=6;r.tEnemy=100;a.tick();assert.equal(r.barrier,first*2);
 r.combatSeconds=12;r.barrier=Math.round(r.maxhp*.3)-1;r.tEnemy=100;a.tick();assert.equal(r.barrier,Math.round(r.maxhp*.3));
 for(const [off,type,roll]of [['Shield','physical',0],['Daggers','spell',0],['Daggers','physical',.99]]){const caseRun=fight('Daggers',off);caseRun.r.stats.evasionRating=10000;caseRun.r.enemy.attackType=type;caseRun.r.barrier=0;caseRun.a.rng(roll);caseRun.a.tick();assert.equal(caseRun.r.barrier,0,`${off}/${type}/${roll}`);}
 const blocked=fight('Daggers','Daggers');blocked.r.stats.blockChance=100;blocked.r.barrier=0;blocked.a.rng(.99);blocked.a.tick();assert.equal(blocked.r.barrier,0,'Block cannot trigger dodge Barrier');
});
test('Bow, Two-Handed, Staff and attack speed coefficients remain unchanged',()=>{
 const a=create(33),tier=50,power=Math.round((2+tier*.91)*2.1);
 assert.equal(a.makeItem(tier,'weapon',null,'loot','Bow','Epic').atk,Math.round(power*1.18)+5);
 assert.equal(a.makeItem(tier,'weapon',null,'loot','Two-Handed','Epic').atk,Math.round(power*1.75)+7);
 assert.equal(a.makeItem(tier,'weapon',null,'loot','Staff','Epic').spell,Math.round(power*1.8)+8);
 assert(a.baseStats({weapon:a.makeItem(200,'weapon',null,'loot','Daggers','Epic')}).attacksPerSec<=4.2);
});
