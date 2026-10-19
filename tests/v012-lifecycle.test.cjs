const {test}=require('node:test'),assert=require('node:assert/strict'),create=require('./v012-economy-harness.cjs');
function enter(a){a.select(a.controller().state.offers[0].id);if(a.draft().step==='element')a.element('fire');a.passive(a.draft().options[0].id);}
test('gear/Rune swaps cannot refill Mana or Health between Planes',()=>{
 const a=create(126),s=a.state();a.setup(20,'Staff');a.start(1);a.controller().state.planeIndex=2;
 const stats=a.stats(),staff=s.equip.weapon;a.setVitals({hp:stats.maxhp/2,mp:stats.mana/4,maxmp:stats.mana});
 const sword=a.makeItem(20,'weapon',null,'loot','Sword','Rare');s.stash.push(sword);a.equip(sword.id);
 assert.equal(a.vitals().mp,0);const clipped=a.vitals().hp;a.equip(staff.id);
 assert(a.vitals().maxmp>0);assert.equal(a.vitals().mp,0);assert(a.vitals().hp<=clipped);
});
test('classic Second Wind, set/Legendary cooldowns and funded cast counters survive Plane changes',()=>{
 const a=create(127),s=a.state();a.start(1);enter(a);let r=s.run;r.combatSeconds=2;
 r.secondWindUsed=true;r.legendaryCastCount=2;r.legendaryAttackCount=3;
 assert.equal(a.ready(r,'legendary:fixture',10),true);assert.equal(a.ready(r,'legendary:fixture',10),false);
 while(s.run){s.run.enemy.hp=0;a.win();a.flush();}
 assert.equal(a.controller().state.stage,'choice');enter(a);r=s.run;
 assert.equal(r.secondWindUsed,true,'once per Expedition, not once per Plane');
 assert.equal(r.legendaryCastCount,2);assert.equal(r.legendaryAttackCount,3);
 assert.equal(a.now(r),2);assert.equal(a.ready(r,'legendary:fixture',10),false,'Plane change must not reset a cooldown');
 r.combatSeconds=11;assert.equal(a.ready(r,'legendary:fixture',10),true);
 a.abandon();a.start(1);enter(a);assert.equal(s.run.secondWindUsed,false);assert.equal(a.ready(s.run,'legendary:fixture',10),true);
});
test('Elite debuffs use the same Expedition clock as healing, damage and status expiry',()=>{
 for(const elite of ['tank','caster']){
  const a=create(128),s=a.state();a.start(1);enter(a);const r=s.run;
  r.phase1ClockBase=100;r.combatSeconds=2;r.hp=r.maxhp*.5;r.enemy.hp=100000;r.enemy.atk=30;r.enemy.eliteType=elite;
  r.stats.blockChance=0;r.barrier=0;r.tEnemy=100;r.tPlayer=0;
  a.tick();
  const until=elite==='tank'?r.playerHealingDebuffUntil:r.playerDebuffUntil;
  assert(Math.abs(until-a.now(r)-(elite==='tank'?5:3))<1e-6);
  if(elite==='tank'){const before=r.hp;a.heal(r,10);assert(Math.abs(r.hp-before-6)<1e-6);}
 }
});
