'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
require('../combat/v013-expedition-foundation.js');
require('../online/v013-enemy-abilities.js');
const A=globalThis.WandererV013EnemyAbilities;
const FAMILY=['blood','decay','vitality','aegis','fury','magic'];
function mob(role,name=role){return {name,role,hp:100,maxhp:100,barrier:0,atk:25,attackEvery:2,groupClock:0};}
function run(...enemies){return {enemies,enemy:enemies[0],status:'fight',phase1:true,combatSeconds:0,phase1ClockBase:0,hp:100,maxhp:100,mp:60,maxmp:60,playerDebuffUntil:0,playerHealingDebuffUntil:0};}
function advance(run,enemy,now,absolute=now){run.combatSeconds=now;return A.tick(run,absolute).filter(e=>e.enemy===enemy);}
test('18 unique active abilities, six thematic Minion passives and short sensible timings',()=>{
 const names=new Set();
 for(const family of FAMILY){
  for(const role of ['tank','skirmisher','caster']){
   const spec=A.DEFINITIONS[family][role];
   assert(spec?.name&&spec?.description&&spec?.type);assert(!names.has(spec.name),spec.name);
   names.add(spec.name);
  }
  assert(A.PASSIVES[family]?.name&&A.PASSIVES[family]?.bonus<=.07);
 }
 assert.equal(names.size,18);
 assert(A.TIMINGS.skirmisher.first<3&&A.TIMINGS.caster.first<=3);
 assert(A.TIMINGS.caster.cooldown<=7&&A.TIMINGS.skirmisher.cooldown<6);
});
test('Class setup is deterministic, boss/elite unaffected, Minions never cast',()=>{
 const units=[mob('minion'),mob('tank'),mob('skirmisher'),mob('caster'),
  {...mob('tank','Elite'),miniboss:true},{...mob('caster','Boss'),boss:true}];
 A.attach(units,'aegis',2);
 assert.equal(units[0].stage81.passive,'Ward Pack');
 assert.equal(units[1].stage81.nextAt,2+A.TIMINGS.tank.first+.3);
 assert.equal(units[2].stage81.nextAt,2+A.TIMINGS.skirmisher.first+.6);
 assert.equal(units[3].stage81.nextAt,2+A.TIMINGS.caster.first);
 assert(!units[4].stage81&&!units[5].stage81);
 const r=run(...units);r.combatSeconds=100;
 const events=A.tick(r,100);assert(events.every(e=>e.enemy.role!=='minion'&&!e.enemy.miniboss&&!e.enemy.boss));
 assert.throws(()=>A.attach(units,'unknown'),/Invalid/);
});
test('Telegraph resolves after windup, then cooldown; no duplicate activation in one timestamp',()=>{
 const tank=mob('tank'),ally=mob('caster');const r=run(tank,ally);
 A.attach(r.enemies,'aegis');
 const before=tank.stage81.nextAt;
 assert.equal(advance(r,tank,before-.1).length,0);
 const warning=advance(r,tank,before);assert.equal(warning.length,1);assert.equal(warning[0].type,'prepare');
 assert.equal(A.status(tank,r.combatSeconds).label,'Casting');
 assert.equal(advance(r,tank,before+.2).length,0);
 const done=advance(r,tank,before+A.TIMINGS.tank.cast+.01);
 assert.equal(done.length,1);assert.equal(done[0].type,'activate');
 assert.equal(done[0].target,ally,'Tank should protect a priority caster');
 assert(ally.barrier>0&&ally.barrier<=ally.maxhp*.12);
 assert.equal(advance(r,tank,r.combatSeconds).length,0);
 assert(A.status(tank,r.combatSeconds));
 const next=tank.stage81.nextAt;
 assert(next-r.combatSeconds>=6.8,'true cooldown is not elapsed during windup');
 assert.equal(advance(r,tank,next+.01).at(0)?.type,'prepare');
});
test('Stun interrupts an enemy cast, postpones it and preserves manual counterplay',()=>{
 const e=mob('caster'),r=run(e);A.attach([e],'decay');
 const start=e.stage81.nextAt;assert.equal(advance(r,e,start)[0].type,'prepare');
 e.stunnedUntil=start+.95;
 const interrupted=advance(r,e,start+.2,start+.2);
 assert.equal(interrupted[0].type,'interrupted');
 assert.equal(A.status(e,r.combatSeconds).label,'Interrupted');
 assert.equal(advance(r,e,start+.3,start+.3).length,0);
 const delayed=e.stage81.nextAt;assert(delayed>start+2);
 assert.equal(advance(r,e,delayed,delayed)[0].type,'prepare');
 assert.equal(r.playerDebuffUntil,0,'interrupted cast must not apply its debuff');
});
test('Affinity Tank support stays capped, Vitality healing respects max HP',()=>{
 const tank=mob('tank'),caster=mob('caster');caster.hp=54;
 const r=run(tank,caster);A.attach(r.enemies,'vitality');
 advance(r,tank,tank.stage81.nextAt);
 advance(r,tank,tank.stage81.castingUntil+.01);
 assert(caster.hp>54&&caster.hp<=60,'Heartwood Mend is small and limited');
 const t=mob('tank'),c=mob('caster');const rr=run(t,c);A.attach(rr.enemies,'aegis');
 for(let cycle=0;cycle<3;cycle++){
  advance(rr,t,t.stage81.nextAt);advance(rr,t,t.stage81.castingUntil+.01);
  assert(c.barrier<=Math.round(c.maxhp*.12),'Barriers never accumulate without limit');
 }
});
test('Fury rally and skirmisher rush are bounded queued attacks, not permanent DPS multipliers',()=>{
 const tank=mob('tank'),fighter=mob('skirmisher'),r=run(tank,fighter);A.attach(r.enemies,'fury');
 fighter.stage81.nextAt=100;
 advance(r,tank,tank.stage81.nextAt);
 advance(r,tank,tank.stage81.castingUntil+.01);
 assert.equal(fighter.stage81.charges,1);
 assert(A.status(fighter,r.combatSeconds).label==='Enraged');
 const bonus=A.consumeStrike(fighter,r.combatSeconds);assert(bonus?.bonus>.1);
 assert.equal(A.consumeStrike(fighter,r.combatSeconds),null);
 fighter.stage81.nextAt=r.combatSeconds+.2;
 advance(r,fighter,fighter.stage81.nextAt);
 advance(r,fighter,fighter.stage81.castingUntil+.01);
 assert.equal(fighter.stage81.charges,2);
 assert(A.consumeStrike(fighter,r.combatSeconds)?.bonus>.1);
 assert(A.consumeStrike(fighter,r.combatSeconds)?.bonus>.1);
 assert.equal(A.consumeStrike(fighter,r.combatSeconds),null);
});
test('Six Affinity class effects have different consequences and respect caps',()=>{
 const fighter=mob('skirmisher'),r=run(fighter);
 A.attach([fighter],'blood');
 fighter.hp=80;const siphon=A.onHit(fighter,r,30,0,{secondary:'siphon'});
 assert(siphon>0&&siphon<=3&&fighter.hp<=83);
 r.mp=10;assert.equal(A.onHit(fighter,r,10,0,{secondary:'mana'}),2);
 assert.equal(r.mp,8);
 assert.equal(A.onHit(fighter,r,10,0,{secondary:'wound'}),1);
 assert(r.playerHealingDebuffUntil>0);
 const caster=mob('caster'),rr=run(caster);A.attach([caster],'decay');
 advance(rr,caster,caster.stage81.nextAt);
 advance(rr,caster,caster.stage81.castingUntil+.01);
 assert(rr.playerDebuffUntil>rr.combatSeconds);
 const blood=mob('caster'),rb=run(blood);A.attach([blood],'blood');
 advance(rb,blood,blood.stage81.nextAt);
 advance(rb,blood,blood.stage81.castingUntil+.01);
 assert(rb.playerHealingDebuffUntil>rb.combatSeconds);
});
test('Minion passives require at least two living Minions of same Affinity and stay at most +7%',()=>{
 for(const family of FAMILY){
  const one=mob('minion','a'),two=mob('minion','b'),tank=mob('tank');
  const r=run(one,two,tank);A.attach(r.enemies,family);
  const factor=A.packFactor(r,one);
  assert(factor>1&&factor<=1.07);
  assert.equal(A.packFactor(r,tank),1);
  two.hp=0;assert.equal(A.packFactor(r,one),1);
 }
});
test('Stage 8.1 UI includes live Casting/Guarding/Enraged indicators and class tooltips',()=>{
 const src=fs.readFileSync('index.html','utf8');
 const css=fs.readFileSync('online/v013-combat-arena.css','utf8');
 assert(src.includes('online/v013-enemy-abilities.js'));
 assert(src.includes('enemyAbilityMarkup(enemy,run.combatSeconds||0)'));
 assert(src.includes('enemyAbilityMarkup(e,state.run?.combatSeconds||0)'));
 assert(src.includes('data-enemy-ability'));
 assert(src.includes('WandererV013EnemyAbilities?.describe(enemy)'));
 for(const kind of ['casting','guarding','enraged','interrupted'])assert(css.includes('.is-'+kind));
});
test('Native Expedition role abilities activate without changing base boss or Elite mechanics',()=>{
 const create=require('./v012-economy-harness.cjs'),a=create(8181),c=a.controller();
 a.start(1,true);const realm=c.state.dungeon.cards[0];c.chooseRealm(realm.id);c.offerContracts();c.chooseContract(null);
 assert(c.visitRoom(1));assert(a.enter());
 const r=a.state().run;
 assert(r?.enemy?.stage81?.name);
 assert(!r.enemy.boss&&!r.enemy.miniboss);
 r.hp=r.maxhp=50000;r.stats.attacksPerSec=0;r.enemy.hp=r.enemy.maxhp=100000;
 for(let i=0;i<44;i++)a.tick();
 assert(r.enemy.stage81.cycle>=1,'enemy should execute first short ability');
 assert.equal(r.status,'fight');
});
