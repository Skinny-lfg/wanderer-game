'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
require('../online/v013-elite-abilities.js');
const A=globalThis.WandererV013EliteAbilities;
function elite(type,hp=100){return {name:type,eliteType:type,miniboss:true,hp,maxhp:100,atk:20,attackEvery:2,barrier:0};}
function mob(name,role='skirmisher',hp=100){return {name,role,hp,maxhp:100,barrier:0};}
function run(...enemies){return {enemy:enemies[0],enemies,status:'fight',combatSeconds:0,maxhp:1000,hp:1000};}
function move(r,t){r.combatSeconds=t;return A.tick(r,t);}
test('Four Stage 8.2 roles are defined and normal/boss enemies are excluded',()=>{
 assert.deepEqual(Object.keys(A.DEFINITIONS),['gravecaller','the_shepherd','the_gilded','the_headsman']);
 for(const id of Object.keys(A.DEFINITIONS))assert(A.info(elite(id)).description);
 assert.equal(A.attach(mob('normal')),null);
 assert.equal(A.attach({...elite('gravecaller'),miniboss:false,boss:true}),null);
 assert.equal(A.info(elite('tank')),null);
});
test('Gravecaller: 85% and 40% HP cast two 1s interruptible waves without overlapping Minions',()=>{
 const e=elite('gravecaller'),r=run(e);A.attach(e);
 assert.equal(move(r,1).length,0);
 e.hp=86;assert.equal(move(r,2).length,0);
 e.hp=85;assert.equal(move(r,3)[0].type,'prepare');
 assert.equal(A.status(e,3.3).kind,'casting');
 assert.equal(move(r,3.5).length,0);
 const first=move(r,4);
 assert.equal(first.length,1);
 assert.equal(first[0].type,'summon');
 assert.equal(first[0].count,2);
 assert.equal(first[0].wave,1);
 assert.equal(e.stage82.summonPhase,1);
 const undead1={...mob('undead1','minion'),stage83Summoned:true,stage83Summoner:'elite'};
 const undead2={...mob('undead2','minion'),stage83Summoned:true,stage83Summoner:'elite'};
 r.enemies.push(undead1,undead2);
 assert.equal(A.livingSummons(r),2);
 assert.equal(A.deathboundStatus(r),null,'summons alone do not protect or infect');
 e.hp=40;
 assert.equal(move(r,5).length,0,'must not start second ritual while two summons survive');
 undead1.hp=0;
 assert.equal(A.livingSummons(r),1);
 assert.equal(move(r,6)[0].type,'prepare');
 const second=move(r,7)[0];
 assert.equal(second.type,'summon');
 assert.equal(second.count,1,'second wave only fills a free living slot');
 assert.equal(second.wave,2);
 assert.equal(move(r,10).length,0,'no third wave');
 undead2.hp=0;
 assert.equal(A.deathboundStatus(r),null,'no infection without successful summoned-undead hits');
});
test('Deathbound Ritual: only live summoned undead infect the player on successful damage',()=>{
 const g=elite('gravecaller'),normal=mob('normal','minion');
 const undead={...mob('raised','minion'),stage83Summoned:true,stage83Summoner:'elite'};
 const r=run(g,normal,undead);r.encounterLeader=g;r.barrier=0;
 assert.equal(A.applyDeathbound(r,normal,15),null);
 assert.equal(A.applyDeathbound(r,undead,0),null,'blocked attacks do not infect');
 assert.equal(A.applyDeathbound(r,g,12),null);
 const infected=A.applyDeathbound(r,undead,5);
 assert.equal(infected.stacks,1);
 assert.equal(infected.remaining,4);
 assert.equal(A.deathboundStatus(r).stacks,1);
 move(r,.8);assert.equal(A.tickDeathbound(r),null);
 move(r,1);const first=A.tickDeathbound(r);
 assert.deepEqual({damage:first.damage,absorbed:first.absorbed,stacks:first.stacks},{damage:7,absorbed:0,stacks:1});
 assert.equal(r.hp,993);
 r.barrier=12;
 move(r,1.1);
 for(let i=0;i<8;i++)A.applyDeathbound(r,undead,10);
 assert.equal(A.deathboundStatus(r).stacks,4,'stacks capped at four');
 move(r,2.1);const second=A.tickDeathbound(r);
 assert.equal(second.absorbed,12);
 assert.equal(second.damage,16);
 assert.equal(r.hp,977);
 assert.equal(r.barrier,0);
 undead.hp=0;
 assert.equal(A.deathboundStatus(r),null,'last undead death cancels active Decay immediately');
 assert.equal(A.tickDeathbound(r).ended,true);
 assert.equal(r.deathboundDecay,undefined);
 assert.equal(A.tickDeathbound(r),null,'no lingering tick after last undead dies');
});
test('Deathbound status expires after four combat seconds and is isolated per encounter',()=>{
 const g=elite('gravecaller'),u={...mob('raised','minion'),stage83Summoned:true,stage83Summoner:'elite'};
 const r=run(g,u);r.encounterLeader=g;
 A.applyDeathbound(r,u,3);
 assert(A.deathboundStatus(r));
 move(r,4);
 assert.equal(A.deathboundStatus(r),null);
 assert.equal(A.tickDeathbound(r).ended,true);
 assert.equal(r.hp,1000,'expired Decay never deals a late tick');
 A.applyDeathbound(r,u,3);
 g.hp=0;
 assert.equal(A.deathboundStatus(r),null,'the ritual ends when the Gravecaller dies');
 assert.equal(A.tickDeathbound(r).ended,true);
 const r2=run(elite('gravecaller'),{...u,hp:100});
 assert.equal(A.deathboundStatus(r2),null,'new encounter never inherits stacks');
});
test('Gravecaller: Stun and attack delay interrupt ritual without consuming its wave',()=>{
 const e=elite('gravecaller'),r=run(e);A.attach(e);
 e.hp=84;
 assert.equal(move(r,1)[0].type,'prepare');
 e.stunnedUntil=2.2;
 const interrupted=move(r,1.1)[0];
 assert.equal(interrupted.type,'interrupted');
 assert.equal(e.stage82.summonPhase,0);
 assert.equal(e.stage82.castingUntil,0);
 assert.equal(A.status(e,1.15).kind,'interrupted');
 e.stunnedUntil=0;
 assert.equal(move(r,4.09).length,0);
 assert.equal(move(r,4.1)[0].type,'prepare');
 assert.equal(A.interrupt(e,r,'delay').type,'interrupted');
 assert.equal(e.stage82.summonPhase,0);
 assert.equal(move(r,7.1)[0].type,'prepare');
 assert.equal(move(r,8.1)[0].wave,1);
 e.hp=0;
 assert.equal(move(r,9).length,0,'a dead Gravecaller must not complete a new ritual');
});
test('Undead summon infrastructure respects max two alive and four total',()=>{
 require('../online/v013-boss-infrastructure.js');
 const Infra=globalThis.WandererV013BossInfrastructure;
 const e=elite('gravecaller'),r=run(e);r.encounterLeader=e;r.totalMobCount=1;
 r.stage83EliteSummons={summoned:0,maxSummons:4,maxLivingMinions:2};
 const factory=()=>({name:'Undead',role:'minion',hp:100,maxhp:100,atk:20,def:4,baseDef:4,attackEvery:2});
 const opts={family:'decay',hpFactor:.48,atkFactor:.34,defFactor:.35,intervalFactor:1.20};
 const first=Infra.summon(r,e,2,factory,opts);
 assert.equal(first.spawned,2);
 assert.equal(r.stage83EliteSummons.summoned,2);
 const spawned=r.enemies.filter(x=>x.stage83Summoned);
 assert.equal(spawned.length,2);
 assert.equal(spawned[0].maxhp,48);
 assert.equal(spawned[0].atk,7);
 assert.equal(spawned[0].attackEvery,2.4);
 assert.equal(Infra.summon(r,e,2,factory,opts).spawned,0,'two alive cap');
 spawned[0].hp=0;
 const second=Infra.summon(r,e,2,factory,opts);
 assert.equal(second.spawned,1,'only one live slot');
 assert.equal(r.stage83EliteSummons.summoned,3);
 const third=Infra.summon(r,e,2,factory,opts);
 assert.equal(third.spawned,0,'full cap still active');
 const live=r.enemies.filter(x=>x.hp>0&&x.stage83Summoned);
 assert.equal(live.length,2);
});
test('Exarch shields a living ally by at most 15% max HP, three times with real 10s cooldown',()=>{
 const e=elite('the_shepherd'),friend=mob('escort','caster'),r=run(e,friend);A.attach(e);
 assert.equal(move(r,2).length,0);
 assert.equal(move(r,3)[0].type,'prepare');
 assert.equal(A.status(e,3.1).kind,'casting');
 assert.equal(move(r,3.75)[0].type,'activate');assert.equal(friend.barrier,15);
 assert.equal(move(r,13.74).length,0);
 assert.equal(move(r,13.75)[0].type,'prepare');
 assert.equal(move(r,14.5)[0].type,'activate');
 assert.equal(move(r,24.5)[0].type,'prepare');
 assert.equal(move(r,25.25)[0].type,'activate');
 assert.equal(e.stage82.castCount,3);assert.equal(friend.barrier,15);
 assert.equal(move(r,100).length,0);
});
test('Exarch shields itself when alone, then prioritizes a living ally',()=>{
 const e=elite('the_shepherd'),r=run(e);A.attach(e);
 assert.equal(move(r,4)[0].type,'prepare');assert.equal(e.barrier,0);
 const first=move(r,4.75)[0];assert.equal(first.type,'activate');assert.equal(first.target,e);
 assert.equal(e.barrier,15);assert.equal(e.stage82.castCount,1);
 const friend=mob('arrived');r.enemies.push(friend);
 assert.equal(move(r,14.74).length,0);
 assert.equal(move(r,14.75)[0].type,'prepare');
 const second=move(r,15.5)[0];assert.equal(second.type,'activate');assert.equal(second.target,friend);
 assert.equal(friend.barrier,15);assert.equal(e.stage82.castCount,2);
});
test('Executioner: 1.5s telegraph, one 2.4x strike with 18% cap; stun and attack delay interrupt',()=>{
 const e=elite('the_headsman'),r=run(e);A.attach(e);
 assert.equal(move(r,3.49).length,0);
 assert.equal(move(r,3.5)[0].type,'prepare');
 assert.equal(move(r,4.99).length,0);
 assert.equal(move(r,5)[0].type,'activate');
 assert.equal(A.status(e,5).label,'Heavy Strike');
 assert.deepEqual(A.consumeStrike(e,5.1),{multiplier:2.4,capFraction:.18,ability:'Ashen Sentence'});
 assert.equal(A.consumeStrike(e,5.2),null);
 assert.equal(move(r,15)[0].type,'prepare');
 e.stunnedUntil=16;
 assert.equal(move(r,15.1)[0].type,'interrupted');
 assert.equal(e.stage82.castingUntil,0);
 e.stunnedUntil=0;
 assert.equal(move(r,18.1)[0].type,'prepare');
 assert.equal(A.interrupt(e,r,'delay').type,'interrupted');
 assert.equal(move(r,18.2).length,0);
});
test('Stage 8.2 is loaded in the arena with all eight Elites registered',()=>{
 for(const p of ['index.html']){
  const html=fs.readFileSync(p,'utf8');
  assert(html.includes('online/v013-elite-abilities.js'));
  assert(html.includes('WandererV013EliteAbilities?.status(enemy,now)'));
  for(const id of ['tank','berserker','vampire','caster','gravecaller','the_shepherd','the_gilded','the_headsman']){
   assert(html.includes(id+":{id:'"+id+"'"),p+' missing '+id);
   assert.match(html,new RegExp(id+":'assets/(elites|mobs)/animated/"));
  }
 }
 const combat=fs.readFileSync('combat/v012-combat-runtime.js','utf8');
 assert(combat.includes("event.type==='summon'"));
 assert(combat.includes('ledger.maxLivingMinions=spec.maxLiving'));
 assert(!combat.includes('WandererV013EliteAbilities?.incomingFactor'));
 assert(combat.includes('WandererV013EliteAbilities?.applyDeathbound'));
 assert(combat.includes('WandererV013EliteAbilities?.tickDeathbound'));
 assert(combat.includes('deathboundApplications'));
 assert(combat.includes('hpFactor:spec.hpFactor,atkFactor:spec.atkFactor'));
 assert(!combat.includes('10% protection while they live'));
 assert(fs.readFileSync('index.html','utf8').includes('Deathbound Decay ×'));
 assert(fs.readFileSync('docs/index.html','utf8').includes('Deathbound Decay ×'));
 assert(combat.includes('if(stage82Strike)raw=cappedStrikeDamage(raw,stage82Strike,r.maxhp)'),'Elite charge uses the shared capped damage path');
 assert(combat.includes('heroMaxHp*strike.capFraction'),'Shared charged strike helper caps damage against hero maximum Health');
 assert(combat.includes('WandererV013EliteAbilities?.interrupt'));
 const encounter=fs.readFileSync('online/v012-expedition-runtime.js','utf8');
 assert(encounter.includes('if(!statOnly&&last&&g.selected.elite&&!g.selected.boss)globalThis.WandererV013EliteAbilities?.attach'));
});
test('Solar Rebuke starts at 9s, telegraphs for 1s and protects for 4s with per-hit and cycle caps',()=>{
 const e=elite('the_gilded'),r=run(e);A.attach(e);
 assert.deepEqual(move(r,8.99),[]);assert.equal(move(r,9)[0].type,'prepare');
 assert.equal(A.status(e,9.5).label,'Casting');assert.equal(A.solarRebukeDamage(e,9.9,1000,1000),0);
 assert.equal(move(r,10)[0].type,'activate');
 assert.equal(A.solarRebukeDamage(e,10,20,1000),3);
 assert.deepEqual(Array.from({length:5},()=>A.solarRebukeDamage(e,11,900,1000)),[15,15,15,12,0]);
 assert.equal(A.status(e,14),null);assert.equal(A.solarRebukeDamage(e,14,900,1000),0);
 assert.equal(move(r,21)[0].type,'prepare');move(r,22);assert.equal(A.solarRebukeDamage(e,22,900,1000),15);
});

function horrorFixture(build){
 const sim=require('../scripts/simulate-progression.cjs');
 const {a,c,card}=sim.prepare(1,sim.BUILDS.find(b=>b.id===build),501,{...sim.DEFAULTS,points:12});
 const room=card.edges.filter(([from])=>from===0).map(([,to])=>to).find(n=>card.nodes[n].kind==='combat');
 assert(c.visitRoom(room));assert(a.enter());a.state().run.eliteType='the_gilded';
 const r=a.encounter({elite:true,count:1});return {a,c,r,sim};
}
test('native Horror encounters resolve with speed, paired daggers, DoT, magic and tank loadouts',()=>{
 for(const build of ['fury-bow','blood-fury','blood-decay','arcane-decay','aegis-radiance']){
  const {a,c,r,sim}=horrorFixture(build);
  assert.equal(r.enemy.eliteType,'the_gilded');
  const row=sim.fight(a,c,2000);
  assert(!row.timedOut,build);assert(row.won||row.died,build);
 }
});
test('reflection uses actual primary HP loss, mitigates through block and Barrier, and settles a lethal trade once',()=>{
 const {a,c,r}=horrorFixture('aegis-radiance'),e=r.enemy;
 r.combatSeconds=13;e.stage82.rebukeUntil=17;e.stage82.reflected=0;
 r.stats.blockChance=100;r.stats.blockReduction=.5;r.barrier=100;a.rng(.5);
 e.hp=e.maxhp=1000;e.barrier=9999;
 a.gear.weaponAttack(r);assert.equal(r.metrics.solarRebukeHits||0,0);
 e.barrier=0;const before=r.hp;
 a.gear.weaponAttack(r);assert.equal(r.metrics.solarRebukeHits,1);
 assert.equal(r.hp,before);assert(r.barrier<100);
 assert(100-r.barrier<=e.stage82.reflected*.5+1e-9);
 r.barrier=0;r.stats.blockChance=0;r.hp=.001;e.hp=1;
 a.gear.weaponAttack(r);assert.equal(c.state.stage,'failed');assert(e.hp<=0);
 assert.equal(a.results().summary.outcome,'defeat');
});
test('periodic damage during Solar Rebuke does not trigger reflection',()=>{
 const {a,r}=horrorFixture('blood-decay'),e=r.enemy;
 e.stage82.rebukeUntil=17;e.stage82.reflected=0;r.combatSeconds=13;
 r.stats.attacksPerSec=0;r.tPlayer=0;r.tDot=1;
 e.dots.bleed=[{damage:4,remaining:2}];e.bleed=4;e.bleedStacks=1;
 const hp=e.hp;
 // A fresh Bleed starts its own clock on the first native tick.
 for(let i=0;i<30&&e.hp===hp;i++)a.tick();
 assert(e.hp<hp);assert(r.combatSeconds<e.stage82.rebukeUntil);assert.equal(r.metrics.solarRebukeHits||0,0);
});
