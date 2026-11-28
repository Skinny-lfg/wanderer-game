'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),P=require('../scripts/v013-b85-early-recovery.cjs');
test('B8.5 scope and shared seed blocks are fixed',()=>{const m=P.manifest();assert.equal(m.expected,600);assert.equal(m.heldOutSeeds.length,20);assert.equal(m.trainingSeeds.length,5);assert.equal(m.config.maxLevel,3);});
test('Opening relief modifies only E1 solo normals and leaves defense and interval intact',()=>{
 for(const role of ['tank','skirmisher','caster','minion']){
  const a=P.coreProbe('A',1,role)[0],b=P.coreProbe('B',1,role)[0];
  assert(Math.abs(b.maxhp-a.maxhp*.80)<=1);assert(Math.abs(b.atk-a.atk*.85)<=1);assert.equal(b.def,a.def);assert.equal(b.attackEvery,a.attackEvery);
  for(const level of [2,3,10,200])assert.deepEqual(P.coreProbe('A',level,role),P.coreProbe('B',level,role));
  for(const size of [2,4,12,22])assert.deepEqual(P.coreProbe('A',1,role,size),P.coreProbe('B',1,role,size));
 }
});
test('Native candidate loader smoke: no granted XP or equipment and no errors',()=>{
 for(const arm of P.ARMS){const a=P.runAccount(P.IDS[0],arm,0,{...P.CONFIG,maxLevel:1,maxAttempts:1,maxTotalAttempts:1});assert.equal(a.attempts.length,1);assert(!a.attempts[0].error,JSON.stringify(a.attempts[0].diagnostic));assert.equal(a.startXp,0);assert.equal(a.initialGear.starter,3);assert.deepEqual(a.issues,[]);assert.equal(P.summarize([a]).timeouts,0);}
});
