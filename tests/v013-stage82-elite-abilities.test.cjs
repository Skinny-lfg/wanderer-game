'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
require('../online/v013-elite-abilities.js');
const A=globalThis.WandererV013EliteAbilities;
function elite(type,hp=100){return {name:type,eliteType:type,miniboss:true,hp,maxhp:100,atk:20,attackEvery:2,barrier:0};}
function mob(name,role='skirmisher',hp=100){return {name,role,hp,maxhp:100,barrier:0};}
function run(...enemies){return {enemy:enemies[0],enemies,status:'fight',combatSeconds:0,maxhp:1000,hp:1000};}
function move(r,t){r.combatSeconds=t;return A.tick(r,t);}
test('Three Stage 8.2 roles are defined and normal/boss enemies are excluded',()=>{
 assert.deepEqual(Object.keys(A.DEFINITIONS),['gravecaller','rotbound_exarch','ashen_executioner']);
 for(const id of Object.keys(A.DEFINITIONS))assert(A.info(elite(id)).description);
 assert.equal(A.attach(mob('normal')),null);
 assert.equal(A.attach({...elite('gravecaller'),miniboss:false,boss:true}),null);
 assert.equal(A.info(elite('tank')),null);
});
test('Gravecaller invokes two minions precisely once at 65% Health',()=>{
 const e=elite('gravecaller'),r=run(e);A.attach(e);
 assert.equal(move(r,1).length,0);e.hp=66;assert.equal(move(r,2).length,0);
 e.hp=65;const events=move(r,3);assert.equal(events.length,1);
 assert.equal(events[0].type,'summon');assert.equal(events[0].count,2);
 assert.equal(A.status(e,3.1).label,'Summoning');
 assert.equal(move(r,4).length,0);
 e.hp=0;assert.equal(move(r,5).length,0);
});
test('Exarch shields a living ally by at most 15% max HP, three times with real 10s cooldown',()=>{
 const e=elite('rotbound_exarch'),friend=mob('escort','caster'),r=run(e,friend);A.attach(e);
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
test('Exarch casts a self-Barrier in solo Elite rooms, but protects allies first when present',()=>{
 const e=elite('rotbound_exarch'),r=run(e);A.attach(e);
 assert.equal(move(r,2).length,0);
 assert.equal(move(r,3)[0].type,'prepare');
 const ward=move(r,3.75)[0];
 assert.equal(ward.type,'activate');
 assert.equal(ward.target,e);
 assert.equal(e.barrier,15,'native Guarded solo Exarch has a useful ability');
 assert.equal(A.status(e,3.8).label,'Self Ward');
 const ally=mob('arrived');r.enemies.push(ally);
 assert.equal(move(r,13.75)[0].type,'prepare');
 const protect=move(r,14.5)[0];
 assert.equal(protect.target,ally,'Exarch supports an actual ally when one is present');
 assert.equal(ally.barrier,15);
});
test('Executioner: 1.5s telegraph, one 2.4x strike with 18% cap; stun and attack delay interrupt',()=>{
 const e=elite('ashen_executioner'),r=run(e);A.attach(e);
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
test('Stage 8.2 is loaded in game and docs with four legacy Elites retained',()=>{
 for(const p of ['index.html','docs/index.html']){
  const html=fs.readFileSync(p,'utf8');
  assert(html.includes('online/v013-elite-abilities.js'));
  assert(html.includes('WandererV013EliteAbilities?.status(enemy,now)'));
  for(const id of ['tank','berserker','vampire','caster','gravecaller','rotbound_exarch','ashen_executioner']){
   assert(html.includes(id+":{id:'"+id+"'"),p+' missing '+id);
   assert(html.includes(id+":'assets/elites/animated/"),p+' sprite '+id);
  }
 }
 assert.equal(fs.readFileSync('online/v013-elite-abilities.js','utf8'),fs.readFileSync('docs/online/v013-elite-abilities.js','utf8'));
 const combat=fs.readFileSync('combat/v012-combat-runtime.js','utf8');
 assert(combat.includes("event.type==='summon'"));
 assert(combat.includes('stage82Strike.capFraction'));
 assert(combat.includes('WandererV013EliteAbilities?.interrupt'));
 const encounter=fs.readFileSync('online/v012-expedition-runtime.js','utf8');
 assert(encounter.includes('if(last&&g.selected.elite&&!g.selected.boss)globalThis.WandererV013EliteAbilities?.attach'));
});
