'use strict';
// Native end-to-end route integration: uses real generated maps and decisions.
// Only enemy HP is shortened, to isolate the map / event / reward / boss pipeline
// from lengthy balance fights (those have their own combat and simulator tests).
const {test}=require('node:test'),assert=require('node:assert/strict');
const create=require('./v012-economy-harness.cjs');
require('../combat/v013-expedition-foundation.js');
require('../online/v013-map-intelligence.js');
require('../online/v013-boss-preparation.js');
const I=globalThis.WandererV013MapIntelligence;
const P=globalThis.WandererV013BossPreparation;
const clone=x=>JSON.parse(JSON.stringify(x));
function fresh(risk,seed=1){
 const a=create(seed,undefined,{}, {skipPersistence:true});
 a.setup(35,'Sword','Legendary');a.setUnlocked(35);a.start(35,true);
 const c=a.controller(),g=c.state,card=g.dungeon.cards[risk];c.chooseRealm(card.id);
 return {a,c,g,card,risk,events:[],fights:[],costs:[]};
}
function shortest(card,from,to,avoid=[]){
 const queue=[[from]],seen=new Set([from]);
 for(const path of queue){const last=path.at(-1);if(last===to)return path;
  for(const next of I.neighbors(card,{visited:[],discoveredSecrets:[]},last))if(!seen.has(next)&&!avoid.includes(next)){
   seen.add(next);queue.push([...path,next]);
  }
 }
 throw Error('No normal route from '+from+' to '+to);
}
function move(s,path,reliquaryChoice=0,oracleChoice=2){
 const {a,c,g,card}=s;
 for(const room of path.slice(1)){
  assert.equal(g.stage,'choice','must finish previous room before next move');
  const before=g.dungeon.steps,planned=c.travelCost(c.travelPath(room));
  assert(c.visitRoom(room),'legal map route must be available to '+room);
  assert.equal(before-g.dungeon.steps,planned,'charge precisely the shown step cost');
  s.costs.push(planned);
  if(g.dungeon.cleared.includes(room))continue;
  assert(a.enter(),'native room entry '+room);
  if(a.events.run()?.event){
   const event=a.events.run().event.id,choice=event==='forgotten_reliquary'?reliquaryChoice:event==='oracle_of_paths'?oracleChoice:2;
   const beforeVitals=clone(a.vitals());
   assert(a.events.choose(choice),'native event resolution '+event);
   s.events.push({room,event,choice,beforeVitals,afterVitals:clone(a.vitals())});
   continue;
  }
  const r=a.state().run;
  assert(r?.status==='fight');
  s.fights.push({room,kind:card.nodes[room].kind,bossSnapshot:r.enemy?.boss?{
   modifiers:[...(r.bossModifierIds||[])],preparation:clone(r.bossPreparation),
   escorts:r.totalMobCount-1,attack:r.enemy.atk,bossId:g.bossId
  }:null});
  for(let turns=0;r.status==='fight';turns++){
   assert(turns<100,'native combat should settle a HP-zeroed wave');
   for(const mob of r.enemies?.length?r.enemies:[r.enemy])if(mob)mob.hp=0;
   a.win();a.flush();
  }
  assert.equal(r.status,'cleared');
  assert(a.exitResult(),'clear room result without extra rewards');
 }
}
function finishThrough(s,targets,{reliquaryChoice=0,oracleChoice=2,checkpoints=false,avoidObjective=false}={}){
 let at=0;
 for(const target of targets){
  move(s,shortest(s.card,at,target,avoidObjective?[s.card.objective]:[]),reliquaryChoice,oracleChoice);
  at=target;
  if(checkpoints&&s.g.stage==='choice'){
   const before=clone(s.g),cp=clone(s.a.checkpoint.capture());
   s.a.checkpoint.restore(cp);
   assert.deepEqual(clone(s.c.state),before,'full session restore is idempotent');
   assert.equal(s.c.state.dungeon.steps,before.dungeon.steps,'restore cannot repay travel');
  }
 }
 return s;
}
// Optional rooms and Oracle are naturally seed-dependent. Test on the first
// fully viable natural map, never by injecting an event or changing the graph.
function naturalRoute(risk,targets,options={},seedFilter=()=>true){
 const rejected=[];
 for(let seed=1;seed<=32;seed++){
  const state=fresh(risk,seed);
  assert.equal(state.g.dungeon.foundationState.revealedBossModifiers.length,0,'new natural card must start without revealed modifiers');
  if(!seedFilter(state.card))continue;
  try{finishThrough(state,targets(state.card),options);state.testSeed=seed;return state;}
  catch(error){rejected.push(seed+': '+error.message);}
 }
 throw Error('No natural viable optional route in 32 seeds at risk '+risk+'; '+rejected.slice(0,4).join(' | '));
}
test('native Guarded map: optional marked Elite + real Reliquary weaken actual boss and earn one victory',()=>{
 const s=fresh(0,1),{card,g}=s,original=clone(g.dungeon.foundationManifest);
 finishThrough(s,[card.objective,card.reliquaryRoom,card.nodes.length-1],{checkpoints:true});
 assert.equal(g.stage,'finished');assert.equal(g.unlocked,36);
 assert.deepEqual(clone(g.dungeon.foundationManifest),original,'optional choices cannot rewrite the seed manifest');
 assert.equal(g.dungeon.foundationState.bossPreparation.markedElite,true);
 assert.equal(g.dungeon.foundationState.bossPreparation.reliquary,true);
 assert.equal(s.events.filter(x=>x.event==='forgotten_reliquary').length,1);
 const boss=s.fights.find(x=>x.kind==='boss')?.bossSnapshot;
 assert(boss);assert.equal(boss.preparation.bossAttackFactor,.9);
 assert.equal(boss.modifiers.length,0,'Guarded one modifier must be disabled');
 assert.equal(s.a.results().summary?.outcome,'victory');
 assert(g.dungeon.steps>=0);
});
test('native Dangerous map: actual optional route removes escort and disables one modifier',()=>{
 const s=naturalRoute(1,c=>[c.objective,c.reliquaryRoom,c.nodes.length-1],{checkpoints:true}),{card,g}=s,mods=[...g.dungeon.foundationState.bossModifierIds];
 const boss=s.fights.find(x=>x.kind==='boss')?.bossSnapshot;
 assert.equal(g.stage,'finished');assert.equal(boss.modifiers.length,1);
 assert.deepEqual(boss.modifiers,mods.slice(1));
 assert.equal(boss.escorts,1+Number(boss.modifiers.includes('gravebound_retinue'))-1,'only active Gravebound Retinue can add an escort after the Reliquary seals one property');
 assert.equal(boss.preparation.escortsRemoved,1);
 const event=s.events.find(x=>x.event==='forgotten_reliquary');
 assert(event);assert.equal(event.beforeVitals.hp-event.afterVitals.hp,Math.ceil(event.beforeVitals.maxhp*.15));
 assert.equal(g.dungeon.foundationState.decisions.filter(d=>d.source==='markedElite').length,1);
 assert.equal(g.dungeon.foundationState.decisions.filter(d=>d.source==='reliquary').length,1);
});
test('native Brutal map: both optional preparations and boss remain achievable within 12 steps',()=>{
 const s=naturalRoute(2,c=>[c.objective,c.reliquaryRoom,c.nodes.length-1],{checkpoints:true}),{card,g}=s;
 assert.equal(card.stepLimit,12);
 const boss=s.fights.find(x=>x.kind==='boss')?.bossSnapshot;
 assert.equal(g.stage,'finished');assert(g.dungeon.steps>=0&&g.dungeon.steps<=12,'the 12-step limit must be obeyed');
 assert.equal(boss.modifiers.length,2);
 assert.equal(boss.escorts,2+Number(boss.modifiers.includes('gravebound_retinue'))-1);
 assert(boss.escorts<=3);
});
test('native direct boss route retains full modifiers when both optional objectives are skipped',()=>{
 const s=fresh(2,1),{card,g}=s;
 finishThrough(s,[card.nodes.length-1]);
 const boss=s.fights.find(x=>x.kind==='boss')?.bossSnapshot;
 assert.equal(g.stage,'finished');
 assert.equal(g.dungeon.foundationState.bossPreparation.markedElite,false);
 assert.equal(g.dungeon.foundationState.bossPreparation.reliquary,false);
 assert.equal(boss.modifiers.length,3);
 assert(boss.escorts<=3);
 assert(g.dungeon.steps>=0);
});
test('native Reliquary supplies choice does not disable boss properties or deduct HP',()=>{
 const s=fresh(1,1),{card,g,a}=s;
 let initialHP=a.vitals().hp;
 finishThrough(s,[card.reliquaryRoom,card.nodes.length-1],{reliquaryChoice:1});
 const event=s.events.find(x=>x.event==='forgotten_reliquary');
 assert(event);
 assert(event.afterVitals.hp>=event.beforeVitals.hp,'supplies must heal, not sacrifice HP');
 assert.equal(g.dungeon.foundationState.bossPreparation.reliquary,false);
 assert.equal(s.fights.find(x=>x.kind==='boss').bossSnapshot.modifiers.length,2);
 assert(g.dungeon.steps>=0);assert(a.vitals().hp>0);
});

test('native Oracle event scouts real rooms and reveals exactly one additional boss property',()=>{
 const s=naturalRoute(1,c=>[c.nodes.findIndex(x=>x.event==='oracle_of_paths'),c.nodes.length-1],{oracleChoice:0,reliquaryChoice:2,checkpoints:true},c=>c.nodes.some(n=>n.event==='oracle_of_paths')),{card,g}=s,oracle=card.nodes.findIndex(x=>x.event==='oracle_of_paths');
 assert(oracle>0,'selected natural map must include Oracle');
 assert.equal(g.stage,'finished');
 assert.equal(s.events.filter(x=>x.event==='oracle_of_paths'&&x.choice===0).length,1);
 assert.equal(g.dungeon.foundationState.revealedBossModifiers.length,1);
 assert.equal(g.dungeon.foundationState.decisions.filter(d=>d.type==='reveal_boss').length,1);
 assert(g.dungeon.scouted.length>0);
 assert.equal(s.fights.find(x=>x.kind==='boss').bossSnapshot.modifiers.length,2);
});
test('24 natural direct expeditions across all risks preserve steps, rewards and unchanged boss properties',()=>{
 for(let risk=0;risk<3;risk++)for(let seed=1;seed<=8;seed++){
  const s=fresh(risk,seed),{g,card}=s;
  finishThrough(s,[card.nodes.length-1],{reliquaryChoice:2,avoidObjective:true});
  assert.equal(g.stage,'finished',`risk=${risk} seed=${seed}`);
  assert(g.dungeon.steps>=0&&g.dungeon.steps<card.stepLimit);
  assert.equal(g.dungeon.foundationState.bossPreparation.reliquary,false);
  assert.equal(g.dungeon.foundationState.bossPreparation.markedElite,false);
  const boss=s.fights.find(x=>x.kind==='boss')?.bossSnapshot;
  assert(boss);assert.equal(boss.modifiers.length,1+risk);
  assert(boss.escorts<=3);
 }
});
