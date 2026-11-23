'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs');
require('../combat/expedition-progression.js');
require('../combat/v012-combat-core.js');
const P=globalThis.WandererExpeditionProgression,C=globalThis.WandererV012CombatCore;
const A=require('../scripts/v013-stage634-player-growth-fit.cjs');
const S=require('../scripts/simulate-progression.cjs');
const minion=()=>({role:'minion',hp:200,maxhp:200,atk:40,def:20,baseDef:20,attackEvery:2});
const tank=()=>({role:'tank',hp:200,maxhp:200,atk:40,def:20,baseDef:20,attackEvery:2});
test('Stage 6.38: one smooth three-regime increasing curve, not stepwise E4 or E9 patches',()=>{
 const c=P.ENEMY_EXPONENTIAL_GROWTH;
 assert.equal(P.enemyReference(1),.775,'E1 untouched');
 assert(c.earlyLogGrowth>c.middleLogGrowth&&c.middleLogGrowth>c.lateLogGrowth);
 assert.equal(c.earlyTransitionExpedition,4);
 assert.equal(c.lateTransitionExpedition,9);
 const slopes=[];
 for(let E=1;E<=1000;E++){
  const r=P.enemyReference(E),next=P.enemyReference(E+1);
  assert(Number.isFinite(r)&&r>0);
  assert(next>r,'strictly monotone E'+E);
  const rate=Math.log(next/r);
  assert(rate>=c.lateLogGrowth-1e-12,'slope below steady floor E'+E);
  if(slopes.length)assert(rate<=slopes.at(-1)+1e-12,
   'one continuous derivative must not jump upward E'+E);
  if(slopes.length)assert(slopes.at(-1)-rate<.07,
   'an unreasonably abrupt change in adjacent smooth rates E'+E);
  slopes.push(rate);
 }
 assert(slopes[1]>slopes[4]&&slopes[4]>slopes[9]&&slopes[9]>slopes[29]);
 assert(Math.abs(slopes[800]-c.lateLogGrowth)<1e-7);
 // Old Stage6.34 reference remains independently reproducible.
 assert(P.enemyReference(3)>A.reference(3));
 assert(P.enemyReference(5)>A.reference(5)*1.14);
 assert(P.enemyReference(10)>A.reference(10)*1.25);
 assert(Math.abs(P.enemyReference(200)/A.reference(200)-1)<.04);
 assert.throws(()=>P.enemyReference(1000000),/finite/);
});
test('Stage 6.38: fragile normal Minions in 2–4 rooms; principals unchanged',()=>{
 for(const n of [2,3,4,5,8,20]){
  const a=[tank(),...Array.from({length:n-1},minion)];
  C.applyEncounterPressure(a,0);
  const before=a.map(x=>({...x}));
  const result=C.applyNormalRoomMinionProfile(a);
  assert.equal(result.affected,n-1);
  assert.deepEqual(a[0],before[0],'native principal stays untouched by Minion profile');
  for(let i=1;i<n;i++){
   const b=C.NORMAL_ROOM_MINION_PROFILE,old=before[i],x=a[i];
   assert.equal(x.maxhp,Math.round(old.maxhp*b.hp));
   assert.equal(x.hp,Math.round(old.hp*b.hp));
   assert.equal(x.atk,Math.max(1,Math.round(old.atk*b.atk)));
   assert.equal(x.def,Math.round(old.def*b.def));
   assert.equal(x.baseDef,Math.round(old.baseDef*b.def));
   assert.equal(x.attackEvery,old.attackEvery*b.attackInterval);
  }
  assert.throws(()=>C.applyNormalRoomMinionProfile(a),/twice/);
  const relief=C.applyMinionEscortRelief(a);
  assert.equal(relief.affected,n>=5?1:0);
  assert.equal(a[1].normalRoomMinionProfileApplied,true);
  assert.equal(a[1].minionEscortReliefApplied,undefined);
 }
});
test('Stage 6.38: no normal-room Minion profile inside actual Boss/Elite encounters',()=>{
 for(const flag of ['boss','miniboss']){
  const a=[tank(),minion()];
  a[0][flag]=true;
  C.applyEncounterPressure(a,0);
  const before=JSON.stringify(a);
  assert.equal(C.applyNormalRoomMinionProfile(a).affected,0);
  assert.equal(JSON.stringify(a),before);
 }
});
function native(E,size,opts={}){
 const config={...S.DEFAULTS,points:0,runes:false};
 const {a,c,card}=S.prepare(E,S.BUILDS[1],638000+E*317+size,config,0,'aegis');
 const next=card.edges.filter(([from])=>from===0).map(([,to])=>to)
  .find(id=>card.nodes[id]?.kind==='combat');
 assert(next!==undefined);
 assert(c.visitRoom(next));assert(a.enter());
 const x=a.encounter({count:size,elite:!!opts.elite,boss:!!opts.boss});
 return [x,...(x.enemies?.length?x.enemies:[x.enemy]),...(x.groupReserve||[])];
}
test('Stage 6.38: native E1/E5/E10/E70 normal minions really shrink, all reserves included',()=>{
 for(const E of [1,5,10,70]){
  for(const size of [2,4,6,12]){
   const [run,...actors]=native(E,size),m=actors.filter(e=>e.role==='minion');
   assert.equal(actors.length,size);
   assert(m.length>0);
   for(const x of m){
    assert(x.normalRoomMinionProfileApplied,'missing real native Minion frailty E'+E);
    assert.equal(x.minionEscortReliefApplied,undefined,'a Minion may not inherit principal debuff');
   }
   for(const x of actors.filter(e=>e.role!=='minion'))
    assert.equal(x.normalRoomMinionProfileApplied,undefined);
   assert.equal(run.totalMobCount,size);
  }
 }
 for(const E of [1,5]){
  for(const type of ['elite','boss']){
   const [r,...actors]=native(E,1,{[type]:true});
   assert(actors.every(x=>!x.normalRoomMinionProfileApplied));
  }
 }
});
test('Stage6.38: early player growth evidence is native E1-born and late is extrapolation',()=>{
 const growth=fs.readFileSync('combat/expedition-progression.js','utf8');
 assert(growth.includes('Stage 6.35'));
 assert(growth.includes('calibration CANDIDATE'));
 assert(growth.includes('earlyTransitionExpedition:4'));
 assert(growth.includes('lateTransitionExpedition:9'));
 assert.equal(C.NORMAL_ROOM_MINION_PROFILE.hp,.38);
 assert.equal(C.NORMAL_ROOM_MINION_PROFILE.atk,.60);
});
