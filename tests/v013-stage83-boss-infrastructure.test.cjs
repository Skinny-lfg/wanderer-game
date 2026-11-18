'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
require('../online/v013-boss-infrastructure.js');
const B=globalThis.WandererV013BossInfrastructure;
function boss(style='guardian'){return {name:'Boss',boss:true,bossStyle:style,hp:1000,maxhp:1000,barrier:0,atk:50,attackEvery:2};}
function guard(role='skirmisher'){return {name:role,role,hp:100,maxhp:100,atk:25,def:20,baseDef:20,barrier:0,attackEvery:2,groupClock:0};}
function run(e=boss(),escorts=[]){
 const r={enemy:e,encounterLeader:e,enemies:[e,...escorts],groupReserve:[],totalMobCount:1+escorts.length,
  status:'fight',combatSeconds:0,hp:900,maxhp:900,mp:50};B.attach(r,e);return r;
}
function minion(i){return {...guard('minion'),name:'Summon '+i};}
test('Boss infrastructure is inert until explicitly configured, and is unavailable on normal waves',()=>{
 const e=boss(),r=run(e,[guard()]);assert(r.bossInfrastructure);
 assert.equal(r.bossInfrastructure.cast,null);
 assert.deepEqual(B.tick(r,50),[]);
 assert.equal(B.status(e,r,0),null);
 assert.equal(B.attach({enemy:guard()},guard()),null);
 assert.equal(B.prepare(r,{id:'invalid',name:'',cast:0,cooldown:1,maxUses:0}),null);
 assert.equal(B.configure(r,{healOnMinionDeath:.5}),false);
 assert.equal(r.bossInfrastructure.healOnMinionDeath,0);
});
test('Summons occupy four visible slots, then bounded reserve, without duplicates or additional loot',()=>{
 const e=boss(),r=run(e,[guard(),guard(),guard()]);
 assert.equal(r.enemies.length,4);
 const first=B.summon(r,e,3,minion);
 assert.deepEqual([first.spawned,first.field,first.reserve],[3,0,3]);
 assert.equal(r.groupReserve.length,3);
 assert.equal(r.totalMobCount,7);
 assert.equal(B.summon(r,e,3,minion).spawned,1,'four living Minions maximum');
 assert.equal(r.totalMobCount,8);
 assert.equal(r.groupReserve.length,4);
 assert.equal(B.summon(r,e,1,minion).spawned,0);
 assert.equal(r.encounterLeader,e);
 assert(r.groupReserve.every(x=>x.stage83Summoner==='boss'&&x.role==='minion'));
});
test('Summon limits persist across deaths, preventing infinite reinforcements',()=>{
 const e=boss(),r=run(e);
 assert.equal(B.summon(r,e,4,minion).spawned,4);
 const dead=r.enemies[1];dead.hp=0;dead.groupDefeated=true;
 assert.equal(B.onMinionDeath(r,dead).counted,true);
 assert.equal(B.onMinionDeath(r,dead).counted,false,'single death, single event');
 const next=B.summon(r,e,2,minion);
 assert.equal(next.spawned,1,'only one free living Minion slot');
 assert.equal(next.field,1,'reuses settled dead slot');
 assert.equal(r.bossInfrastructure.summoned,5);
 r.enemies[2].hp=0;r.enemies[2].groupDefeated=true;
 B.onMinionDeath(r,r.enemies[2]);
 assert.equal(B.summon(r,e,2,minion).spawned,1,'6 total summons cap');
 assert.equal(B.summon(r,e,1,minion).spawned,0);
 assert.equal(r.totalMobCount,7);
});
test('Boss healing is bounded to 8% per use, 20% total, never overheals or revives',()=>{
 const e=boss(),r=run(e);
 e.hp=400;
 assert.equal(B.recover(r,10000),80);
 assert.equal(B.recover(r,10000),80);
 assert.equal(B.recover(r,10000),40);
 assert.equal(B.recover(r,10000),0);
 assert.equal(e.hp,600);
 assert.equal(r.bossInfrastructure.healed,200);
 e.hp=0;assert.equal(B.recover(r,10000),0);
});
test('Minion death hook is opt-in, idempotent and returns observed Boss healing',()=>{
 const e=boss(),r=run(e),s=B.summon(r,e,2,minion);
 assert.equal(s.spawned,2);
 e.hp=500;
 const first=r.enemies[1];first.hp=0;
 assert.deepEqual(B.onMinionDeath(r,first),{counted:true,healed:0,minionDeaths:1},'default has no hidden healing');
 const second=r.enemies[2];assert(B.configure(r,{healOnMinionDeath:.06}));
 second.hp=0;
 const effect=B.onMinionDeath(r,second);
 assert.equal(effect.healed,60);assert.equal(effect.minionDeaths,2);
 assert.equal(e.hp,560);
 assert.equal(B.onMinionDeath(r,second).counted,false);
 const ordinary=guard('minion');ordinary.hp=0;
 assert.equal(B.onMinionDeath(r,ordinary).counted,false);
});
test('Preparation uses combat seconds, cooldown and use limits; stun/delay interrupt',()=>{
 const e=boss(),r=run(e);
 const spell={id:'ominous_pulse',name:'Ominous Pulse',cast:1.5,cooldown:8,maxUses:2};
 assert.equal(B.prepare(r,spell)?.type,'prepare');
 assert.equal(B.prepare(r,spell),null,'cannot prepare two spells at once');
 r.combatSeconds=1.49;assert.deepEqual(B.tick(r,1.49),[]);
 assert.equal(B.status(e,r,1.49).label,'Preparing');
 r.combatSeconds=1.5;assert.equal(B.tick(r,1.5)[0].type,'ready');
 assert.deepEqual(B.tick(r,1.5),[],'no duplicate resolve');
 assert.equal(B.prepare(r,spell),null,'cooldown begins after completion');
 r.combatSeconds=9.5;assert.equal(B.prepare(r,spell)?.type,'prepare');
 e.stunnedUntil=10;
 r.combatSeconds=9.6;assert.equal(B.tick(r,9.6)[0].type,'interrupted');
 assert.equal(B.status(e,r,9.6).kind,'interrupted');
 r.combatSeconds=12.6;e.stunnedUntil=0;assert.equal(B.prepare(r,spell)?.type,'prepare');
 assert.equal(B.interrupt(r,'delay').reason,'delay');
 assert.equal(B.interrupt(r,'delay'),null);
 r.combatSeconds=15.6;assert.equal(B.prepare(r,spell)?.type,'prepare');
 r.combatSeconds=17.1;assert.equal(B.tick(r,17.1)[0].type,'ready');
 assert.equal(B.prepare(r,spell),null,'maxUses reached');
});
test('Invalid summoned actors are rejected; non-leaders and dead Bosses cannot summon',()=>{
 const e=boss(),r=run(e);const g=guard();r.enemies.push(g);r.totalMobCount++;
 assert.equal(B.summon(r,g,2,minion).spawned,0);
 assert.throws(()=>B.summon(r,e,1,()=>guard('caster')),/valid summoned Minions/);
 e.hp=0;assert.equal(B.summon(r,e,1,minion).spawned,0);
});
test('Native Expedition attaches Boss infrastructure and resolves summoned Minion deaths once',()=>{
 const create=require('./v012-economy-harness.cjs'),a=create(8301,undefined,{}, {skipPersistence:true});
 a.setup(35,'Sword','Rare');a.setUnlocked(35);a.start(35,true);
 const c=a.controller(),g=c.state,card=g.dungeon.cards[0];
 c.chooseRealm(card.id);g.bossId='rift';card.nodes[1].kind='boss';card.nodes[1].escorts=1;
 assert.equal(c.visitRoom(1),true);assert.equal(a.enter(),true);
 const r=a.state().run,lead=r.encounterLeader;assert(lead?.boss&&r.bossInfrastructure,JSON.stringify({selected:g.selected,enc:r.enc,enemyRole:r.enemy?.role,enemyBoss:r.enemy?.boss,leaderBoss:lead?.boss,bossInfrastructure:!!r.bossInfrastructure,groupSize:r.enemies?.length}));
 assert.equal(r.bossInfrastructure.cast,null);
 assert.equal(B.configure(r,{healOnMinionDeath:.05}),true);
 const sp=B.summon(r,lead,1,minion);
 assert.equal(sp.spawned,1);
 const target=r.enemies.find(x=>x.stage83Summoned);assert(target);
 lead.hp=Math.floor(lead.maxhp*.5);
 const hpBefore=lead.hp;
 target.hp=0;
 r.stats.attacksPerSec=0;r.hp=r.maxhp=100000;
 a.tick();
 assert.equal(r.bossInfrastructure.minionDeaths,1);
 assert(lead.hp>hpBefore);
 assert.equal(r.bossInfrastructure.healed,lead.hp-hpBefore);
 assert.equal(r.encounterLeader,lead);
});
test('Game, docs and isolated Pages build reference infrastructure consistently',()=>{
 const base=fs.readFileSync('index.html','utf8'),docs=fs.readFileSync('docs/index.html','utf8');
 for(const html of [base,docs]){
  assert(html.includes('online/v013-boss-infrastructure.js'));
  assert(html.includes('WandererV013BossInfrastructure?.status(enemy,state.run,now)'));
 }
 assert.equal(fs.readFileSync('online/v013-boss-infrastructure.js','utf8'),fs.readFileSync('docs/online/v013-boss-infrastructure.js','utf8'));
 assert.equal(fs.readFileSync('combat/v012-combat-runtime.js','utf8'),fs.readFileSync('docs/combat/v012-combat-runtime.js','utf8'));
 assert.equal(fs.readFileSync('online/v012-expedition-runtime.js','utf8'),fs.readFileSync('docs/online/v012-expedition-runtime.js','utf8'));
 assert(fs.readFileSync('scripts/prepare-automatic-preview.mjs','utf8').includes("'online/v013-boss-infrastructure.js'"));
});
