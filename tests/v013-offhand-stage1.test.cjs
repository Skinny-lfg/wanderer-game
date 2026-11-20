'use strict';
// Stage 1 Off-Hand identities: test the real integrated Dungeon combat engine.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const create=require('./v012-economy-harness.cjs');
function fight(weapon,offhand,seed=27183){
 const a=create(seed,undefined,{}, {skipPersistence:true});
 a.setup(35,weapon,'Rare');
 if(!['Bow','Staff','Two-Handed'].includes(weapon))a.state().equip.offhand=a.makeItem(35,'offhand',null,'loot',offhand,'Rare');
 a.setUnlocked(35);a.start(35,true);
 const c=a.controller(),card=c.state.dungeon.cards[0];
 c.chooseRealm(card.id);assert(c.visitRoom(1));assert(a.enter());
 const r=a.state().run;
 r.enemy.hp=r.enemy.maxhp=100000000;r.enemy.def=r.enemy.baseDef=r.enemy.barrier=0;
 r.stats.crit=0;r.stats.wardBonus=0;
 a.rng(.5);
 return {a,r};
}
test('Wand + Orb grants 2% Max HP + 5% Spell Power once per six seconds',()=>{
 const {a,r}=fight('Wand','Orb');
 assert.equal(r.stats.off?.subtype,'Orb');
 r.barrier=0;r.maxmp=r.mp=1000;
 a.gear.weaponAttack(r);
 const first=r.barrier;
 assert(Math.abs(first-(r.maxhp*.02+r.stats.spellPower*.05))<.001);
 r.combatSeconds+=1;a.gear.weaponAttack(r);
 assert.equal(r.barrier,first,'same cooldown stops repeated attacks');
 r.combatSeconds+=6;a.gear.weaponAttack(r);
 assert(Math.abs(r.barrier-first*2)<.001);
 assert.equal(r.metrics?.procs?.['Off-Hand: Orb Ward'],2);
});
test('Sword + Orb uses same formula without requiring Magic or Decay',()=>{
 const {a,r}=fight('Sword','Orb');
 r.barrier=0;r.stats.phase2Magic=false;r.stats.phase2Decay=false;r.stats.spellPower=0;
 a.gear.weaponAttack(r);assert(Math.abs(r.barrier-r.maxhp*.02)<.001,'pure physical gains Orb Ward');
 const first=r.barrier;
 r.combatSeconds+=1;a.gear.weaponAttack(r);assert.equal(r.barrier,first);
 r.combatSeconds+=6;r.stats.spellPower=80;a.gear.weaponAttack(r);
 assert(Math.abs(r.barrier-first-(r.maxhp*.02+4))<.001);
 assert.equal(r.metrics?.procs?.['Off-Hand: Orb Ward'],2);
});
test('Aegis entrance Barrier and Sword + Orb Ward stack above 200% Max HP',()=>{
 const a=create(44201,undefined,{}, {skipPersistence:true});
 a.setup(35,'Sword','Rare');
 a.state().equip.offhand=a.makeItem(35,'offhand',null,'loot','Orb','Rare');
 a.state().automaticTalents=require('./v013-current-talent-helper.cjs').buy(['affinity_aegis']);
 a.setUnlocked(35);a.start(35,true);
 const c=a.controller(),card=c.state.dungeon.cards[0];
 c.chooseRealm(card.id);assert(c.visitRoom(1));assert(a.enter());
 const r=a.state().run;
 assert.equal(r.stats.off?.subtype,'Orb');
 assert(r.barrier>=r.maxhp*.05,'fresh Aegis Barrier granted at encounter entry');
 r.enemy.hp=r.enemy.maxhp=1e8;r.enemy.def=r.enemy.baseDef=r.enemy.barrier=0;r.stats.crit=0;r.stats.wardBonus=0;
 const before=r.barrier,expected=r.maxhp*.02+(r.stats.spellPower||0)*.05;
 a.rng(.5);a.gear.weaponAttack(r);
 assert(Math.abs(r.barrier-before-expected)<.001,'independent grants accumulate');
 r.combatSeconds=7;r.barrier=r.maxhp*2;
 a.gear.weaponAttack(r);
 assert(r.barrier>r.maxhp*2,'no max Barrier cap even at 200% HP');
});
test('Barrier is cleared at encounter entry and immediately after victory',()=>{
 const {a,r}=fight('Sword','Orb',99101);
 r.barrier=r.maxhp*3;
 a.encounter({count:1});
 assert.equal(r.barrier,0,'next encounter cannot inherit any Barrier');
 r.barrier=r.maxhp*2;
 r.enemy.hp=0;if(r.enemies)for(const enemy of r.enemies)enemy.hp=0;r.groupReserve=[];
 a.win();
 assert.equal(r.barrier,0,'victory discards remaining Barrier');
});
test('Tome restores 3 Mana on the third paid Wand cast, not on free attacks',()=>{
 const {a,r}=fight('Wand','Tome');
 assert.equal(r.stats.off?.subtype,'Tome');
 r.maxmp=r.mp=1000;
 for(let i=0;i<3;i++){r.combatSeconds=i;a.gear.weaponAttack(r);}
 assert.equal(r.metrics?.offhandTomeMana,3);
 assert.equal(r.metrics?.procs?.['Off-Hand: Tome Recall'],1);
 for(let i=3;i<6;i++){r.combatSeconds=i;a.gear.weaponAttack(r);}
 assert.equal(r.metrics?.offhandTomeMana,3,'6s cooldown prevents extra mana loops');
 r.combatSeconds=8;a.gear.weaponAttack(r);r.combatSeconds=9;a.gear.weaponAttack(r);r.combatSeconds=10;a.gear.weaponAttack(r);
 assert.equal(r.metrics?.offhandTomeMana,6);
});
test('Charm heals after real main-hand damage; not at full HP; respects 8s cooldown',()=>{
 const {a,r}=fight('Sword','Charm');
 assert.equal(r.stats.off?.subtype,'Charm');
 r.hp=r.maxhp;
 a.gear.weaponAttack(r);
 assert.equal(r.metrics?.offhandCharmHealing||0,0);
 r.hp=r.maxhp*.5;r.combatSeconds=1;
 a.gear.weaponAttack(r);
 const first=r.metrics?.offhandCharmHealing;
 assert(first>0&&first<=r.maxhp*.015+.001,'healing uses native cap');
 r.combatSeconds=2;a.gear.weaponAttack(r);
 assert.equal(r.metrics?.offhandCharmHealing,first);
 r.combatSeconds=10;a.gear.weaponAttack(r);
 assert(r.metrics.offhandCharmHealing>first);
});
test('Tome and Charm do not trigger the other Off-Hand procs',()=>{
 const t=fight('Sword','Tome',17284),c=fight('Wand','Charm',19284);
 t.r.hp=t.r.maxhp*.5;t.r.maxmp=t.r.mp=1000;
 t.a.gear.weaponAttack(t.r);
 assert.equal(t.r.metrics?.offhandCharmHealing||0,0);
 assert.equal(t.r.metrics?.offhandTomeMana||0,0);
 c.r.maxmp=c.r.mp=1000;c.r.barrier=0;c.r.hp=c.r.maxhp*.5;
 c.a.gear.weaponAttack(c.r);
 assert.equal(c.r.metrics?.offhandOrbBarrier||0,0);
 assert((c.r.metrics?.offhandCharmHealing||0)>0);
});
test('Stage 1 native runtime and generated Pages mirrors stay identical',()=>{
 const src=fs.readFileSync('combat/v012-combat-runtime.js','utf8');
 assert.equal(fs.readFileSync('docs/combat/v012-combat-runtime.js','utf8'),src);
 assert(src.includes("offhandPaidAction(r);ctx.power="),'automatic Magic casts consume the same Tome hook');
 assert(src.includes("if(cost>0)offhandPaidAction(r)"),'Decay spendMana is funded too');
});
