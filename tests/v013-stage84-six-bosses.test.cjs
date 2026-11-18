'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
require('../online/v013-boss-infrastructure.js');require('../online/v013-boss-abilities.js');
const I=globalThis.WandererV013BossInfrastructure,A=globalThis.WandererV013BossAbilities;
const styles={blood:'leech',decay:'matriarch',vitality:'devourer',aegis:'guardian',fury:'berserker',magic:'conductor'};
function boss(style){return {name:style,boss:true,role:'boss',bossStyle:style,hp:1000,maxhp:1000,barrier:0,atk:50,attackEvery:1.62,groupClock:0,stunnedUntil:0};}
function mob(role='skirmisher'){return {name:role,role,hp:100,maxhp:100,def:20,baseDef:20,atk:25,attackEvery:1.7,barrier:0,groupClock:0};}
function run(style='guardian',count=0){
 const e=boss(style),enemies=[e,...Array.from({length:count},()=>mob())];
 const r={status:'fight',enemy:e,encounterLeader:e,enemies,groupReserve:[],totalMobCount:enemies.length,combatSeconds:0,
  maxhp:900,hp:900,barrier:0,planeFamily:'blood'};
 I.attach(r,e);assert(A.attach(r));return r;
}
function step(r,now){r.combatSeconds=now;return A.tick(r,now,I.tick(r,now));}
function newMinion(){return mob('minion');}
function castSummon(r,threshold,time=0){
 r.encounterLeader.hp=r.encounterLeader.maxhp*threshold;
 const prep=step(r,time);assert(prep.some(x=>x.type==='prepare'),JSON.stringify(prep));
 const ready=step(r,time+.75).find(x=>x.type==='summon');assert(ready,'expected summon');
 const result=A.spawned(r,ready,newMinion);return {event:ready,result};
}
test('Six named affinity bosses have unique IDs, styles and combat-readable profiles',()=>{
 assert.equal(Object.keys(A.PROFILES).length,6);
 assert.equal(new Set(Object.values(A.PROFILES).map(x=>x.id)).size,6);
 for(const [family,style]of Object.entries(styles)){
  const p=A.profileFor(family);assert.equal(p.style,style);
  assert.equal(A.profileForStyle(style),p);
  assert(p.description&&p.image&&p.attack);
 }
 assert.equal(A.profileFor('invalid'),null);
});
test('Aegis Guardian Ward Cycle restores 8% every 12s and breaking Barrier creates a real 3s lockout',()=>{
 const r=run(),e=r.enemy;e.barrier=90;
 assert.equal(step(r,11.9).filter(x=>x.type==='ward').length,0);
 assert.equal(step(r,12).filter(x=>x.type==='ward').length,0,'no stacking while Barrier exists');
 assert(A.barrierChanged(r,e,90,0));e.barrier=0;
 assert.equal(A.status(e,r,12).label,'Vulnerable');
 assert(!step(r,14.9).some(x=>x.type==='ward'));
 assert(!step(r,23.9).some(x=>x.type==='ward'));
 assert.equal(step(r,24).find(x=>x.type==='ward').barrier,80);
 assert.equal(e.barrier,80);
 assert.equal(A.barrierChanged(r,e,0,0),null);
});
test('Blood Offering spawns a named Thrall on field and sacrifices after 10s for 5% boss HP',()=>{
 const r=run('leech',3),e=r.enemy;const {result}=castSummon(r,.69);
 assert.equal(result.spawned,1);assert.equal(result.field,1,'priority summon must be attackable, not hidden in reserve');
 assert.equal(r.enemies.length,4);assert.equal(r.groupReserve.length,1);
 const thrall=r.enemies.find(x=>x.stage84Minion==='blood');assert.equal(thrall.name,'Blood Thrall');
 step(r,1);assert.equal(thrall.stage84ThrallAppearedAt,1);
 assert(!step(r,10.99).some(x=>x.type==='offering'));
 assert.equal(step(r,11).find(x=>x.type==='offering').healed,50);
 assert.equal(e.hp,740);assert.equal(thrall.hp,0);
 assert.equal(step(r,11.1).filter(x=>x.type==='offering').length,0);
});
test('Dead Blood Thrall cannot be offered; Blood uses only two threshold summons',()=>{
 const r=run('leech');
 let first=castSummon(r,.69);assert.equal(first.result.spawned,1);
 const thrall=r.enemies.find(x=>x.stage84Minion==='blood');thrall.hp=0;thrall.groupDefeated=true;
 step(r,12);assert.equal(r.bossInfrastructure.healed,0);
 r.enemy.hp=340;const second=castSummon(r,.34,13);
 assert.equal(second.result.spawned,1);assert.equal(r.bossInfrastructure.summoned,2);
 assert.equal(I.summon(r,r.enemy,1,newMinion).spawned,0);
});
test('Decay Brood counts only visible living summoned Minions for 15% less direct damage',()=>{
 const r=run('matriarch',1);const {result}=castSummon(r,.74);
 assert.equal(result.spawned,2);assert.equal(A.directFactor(r,r.enemy),.85);
 assert.equal(A.status(r.enemy,r,1).label,'Brood Guard');
 const target=r.enemies.find(x=>x.stage84Minion==='decay');target.hp=0;
 assert.equal(A.directFactor(r,r.enemy),1);
 assert.equal(A.directFactor(r,mob()),1);
});
test('Vitality Death Bloom grants 5% per killed Bloomling, capped at 15% across four Minions',()=>{
 const r=run('devourer');
 assert.equal(castSummon(r,.69).result.spawned,2);
 for(const x of r.enemies.filter(x=>x.stage84Minion==='vitality')){x.hp=0;assert.equal(I.onMinionDeath(r,x).healed,50);x.groupDefeated=true;}
 r.enemy.hp=340;
 assert.equal(castSummon(r,.34,10).result.spawned,2);
 const next=r.enemies.filter(x=>x.stage84Minion==='vitality'&&x.hp>0);
 assert.equal(next.length,2);
 next[0].hp=0;assert.equal(I.onMinionDeath(r,next[0]).healed,50);
 next[1].hp=0;assert.equal(I.onMinionDeath(r,next[1]).healed,0);
 assert.equal(r.bossInfrastructure.healed,150);
 assert.equal(I.onMinionDeath(r,next[0]).counted,false);
});
test('Fury Furnace Strike has 1.5s telegraph, charged next attack, 18% cap and interruption',()=>{
 const r=run('berserker'),e=r.enemy;
 assert(!step(r,11.9).length);
 assert.equal(step(r,12).find(x=>x.type==='prepare').ability,'Furnace Strike');
 assert(!step(r,13.49).some(x=>x.type==='charge'));
 assert.equal(step(r,13.5).find(x=>x.type==='charge').type,'charge');
 assert.equal(A.status(e,r,13.6).label,'Furnace Strike');
 assert.deepEqual(A.chargedStrike(e,13.6),{multiplier:2,capFraction:.18,ability:'Furnace Strike'});
 assert.equal(A.chargedStrike(e,13.7),null);
 e.stage84Charge={until:30};assert.equal(A.interruptCharge(r).type,'disarmed');assert.equal(e.stage84Charge,undefined);
});
test('Magic Arcane Convergence has 2s channel, 7% maxHP hit through Barrier and 12s cooldown',()=>{
 const r=run('conductor'),e=r.enemy;r.barrier=20;
 assert.equal(step(r,12).find(x=>x.type==='prepare').ability,'Arcane Convergence');
 assert.equal(I.tick(r,13.9).length,0);
 const ev=step(r,14).find(x=>x.type==='pulse');
 assert.equal(ev.absorbed,20);assert.equal(ev.damage,43);assert.equal(r.hp,857);
 assert(!step(r,25.99).some(x=>x.type==='prepare'));
 assert(step(r,26).some(x=>x.type==='prepare'));
});
test('Storm Node becomes attackable, cancels next discharge and weakens Boss for 6s',()=>{
 const r=run('conductor',3),e=r.enemy;
 r.combatSeconds=0;e.hp=640;
 assert(step(r,0).some(x=>x.type==='prepare'));
 const summon=step(r,.75).find(x=>x.type==='summon');assert(summon);
 const result=A.spawned(r,summon,newMinion);assert.equal(result.spawned,1);assert.equal(result.field,1);
 const node=r.enemies.find(x=>x.stage84Node);assert.equal(node?.name,'Storm Node');assert.equal(node.atk,0);
 node.hp=0;r.combatSeconds=1;
 const event=A.onDeath(r,node);assert.equal(event.type,'node_broken');
 assert.equal(A.incomingFactor(r,e,2),.8);assert.equal(A.incomingFactor(r,e,7),1);
 assert.equal(step(r,12).find(x=>x.type==='canceled').type,'canceled');
 assert(!step(r,14).some(x=>x.type==='pulse'));
 assert(step(r,24).some(x=>x.type==='prepare'));
 assert.equal(A.onDeath(r,node),null);
});
test('Normal waves and defeated Bosses cannot perform Boss abilities',()=>{
 const r=run('guardian');r.enemy.hp=0;assert.deepEqual(step(r,12),[]);
 assert.equal(A.attach({status:'fight',enemy:mob(),bossInfrastructure:{}}),null);
});
test('Native Dungeon selects Boss matching the chosen Affinity and uses real Stage 8.4 state',()=>{
 const create=require('./v012-economy-harness.cjs');
 const a=create(8417,undefined,{}, {skipPersistence:true});
 a.setup(35,'Sword','Rare');a.setUnlocked(35);a.start(35,true);
 const c=a.controller(),g=c.state,card=g.dungeon.cards[0];
 c.chooseRealm(card.id);card.nodes[1].kind='boss';card.nodes[1].escorts=1;
 assert.equal(c.visitRoom(1),true);assert.equal(a.enter(),true);
 const r=a.state().run;assert.equal(r.enemy.bossStyle,styles[card.family]);
 assert.equal(r.stage84Boss.affinity,card.family);
 assert.equal(r.encounterLeader,r.enemy);
 assert.equal(r.stage84Boss.style,r.enemy.bossStyle);
});
test('HTML/docs, Stage 8.3 and preview build load six Boss assets and ability code',()=>{
 const html=fs.readFileSync('index.html','utf8'),docs=fs.readFileSync('docs/index.html','utf8');
 for(const h of [html,docs]){
  assert(h.includes('online/v013-boss-abilities.js'));
  assert(h.includes('Carrion Matriarch')&&h.includes('Heartroot Devourer')&&h.includes('Stormglass Conductor'));
  assert(h.includes("esc(globalThis.WandererV013BossAbilities?.profileFor(c.family)?.name||t.enemy)"),'Realm choice Boss label must reflect the six Affinity Bosses');
  assert(h.includes('WandererV013BossAbilities?.status(enemy,state.run,now)'));
 }
 assert.equal(fs.readFileSync('online/v013-boss-abilities.js','utf8'),fs.readFileSync('docs/online/v013-boss-abilities.js','utf8'));
 assert.equal(fs.readFileSync('combat/v012-combat-runtime.js','utf8'),fs.readFileSync('docs/combat/v012-combat-runtime.js','utf8'));
 assert.equal(fs.readFileSync('online/v012-expedition-runtime.js','utf8'),fs.readFileSync('docs/online/v012-expedition-runtime.js','utf8'));
 assert(fs.readFileSync('scripts/prepare-automatic-preview.mjs','utf8').includes("'online/v013-boss-abilities.js'"));
});
