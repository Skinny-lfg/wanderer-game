'use strict';
const assert=require('node:assert/strict'),test=require('node:test'),fs=require('node:fs');
const crypto=require('node:crypto'),path=require('node:path');
const sim=require('../scripts/simulate-progression.cjs');
const fixture=path.join(__dirname,'fixtures','v013-scaling-baseline.json');
const scenarios=[
 [1,1,'normal','blood',0,null],[1,4,'normal','aegis',1,'armored'],
 [6,12,'normal','fury',2,'frenzied'],[6,20,'normal','magic',1,'sigilbound'],
 [1,1,'elite','decay',0,null],[6,1,'elite','blood',2,null],
 [1,1,'boss','vitality',0,null],[6,1,'boss','magic',2,null],
 [6,12,'marked','blood',1,'armored'],
 [1,4,'neutral','aegis',0,null],[1,4,'vanguard','aegis',0,null]
];
function observe([level,count,kind,family,risk,trait],i){
 const opts={...sim.DEFAULTS,points:0};
 const {a,c,g,card,resolvedSeed}=sim.prepare(level,sim.BUILDS[1],501+(i>=9?9:i),opts,risk,family);
 const condition=globalThis.WandererV013ExpeditionConditions.forDungeon(card,g.dungeon);
 const node=kind==='marked'?condition.rooms.find(n=>card.nodes[n]?.kind==='combat'):
  card.edges.filter(([from])=>from===0).map(([,to])=>to).find(n=>card.nodes[n].kind==='combat');
 assert.notEqual(node,undefined);
 card.nodes[node].traitId=trait;
 if(!c.visitRoom(node)){
  assert.equal(kind,'marked');g.dungeon.visited.push(node);g.dungeon.current=node;assert(c.visitRoom(node));
 }
 assert(a.enter());
 // Controlled pair: bypass condition metadata for this room only. Both runs
 // have identical input streams; node also participates in roster generation.
 if(kind==='neutral'||kind==='vanguard'){
  g.dungeon.foundationManifest.cards=g.dungeon.foundationManifest.cards.filter(m=>m.realmId!==card.id);
  a.state().run.conditionId=null;
  if(kind==='vanguard'){g.selected.node=2;g.selected.vanguard=card.nodes[2].vanguard;}
 }
 const r=a.encounter({count,boss:kind==='boss',elite:kind==='elite'});
 const enteredNode=g.selected.node;
 const actors=[...(r.enemies||[r.enemy]),...(r.groupReserve||[])];
 const stats=actors.map(e=>[e.eliteType||e.bossStyle||e.role,e.maxhp,e.atk,e.def,e.barrier,e.attackEvery]);
 const trace=crypto.createHash('sha256'),tick=a.tick;
 a.tick=()=>{tick();trace.update(JSON.stringify(r));trace.update('\n');};
 const result=sim.fight(a,c,5000,'focus');
 assert(!result.timedOut);
 return {level,requested:count,kind,family,risk,seed:resolvedSeed,node:enteredNode,trait:r.encounterTraitId,
  condition:r.conditionId,marked:r.conditionMarked,stats,trace:trace.digest('hex'),
  seconds:result.seconds,damageTaken:result.damageTaken,damageDealt:result.damageDealt,status:result.status,
  casts:[result.enemyAbilityCasts,result.bossCastPreparations],reserveEntries:result.reinforcementsSpawned};
}
if(process.argv.includes('--capture-baseline'))fs.writeFileSync(fixture,JSON.stringify(scenarios.map(observe),null,1)+'\n',{flag:'wx'});
else{
 const baseline=JSON.parse(fs.readFileSync(fixture));
 for(const [i,scenario] of scenarios.entries())test('scaling '+scenario.join('/'),()=>assert.deepEqual(observe(scenario,i),baseline[i]));
}
