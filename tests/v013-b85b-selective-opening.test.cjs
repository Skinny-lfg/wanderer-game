'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),P=require('../scripts/v013-b85b-selective-opening.cjs'),B=require('../scripts/v013-b85-early-recovery.cjs');
test('B8.5B uses 50 fresh shared blocks and 900 accounts, without changing starter gear',()=>{const m=P.manifest();assert.equal(m.expected,900);assert.equal(m.seeds.length,50);assert.equal(m.config.maxLevel,3);assert.deepEqual(Object.keys(P.overrides('A')),[]);assert.deepEqual(Object.keys(P.overrides('B2')),['combat/v012-combat-core.js']);assert.deepEqual(P.overrides('B'),B.overrides('B'));});
test('Selective relief is exactly scoped to E1 solo Tank and Skirmisher',()=>{
 for(const role of ['tank','skirmisher','caster','minion']){
  const a=P.coreProbe('A',1,role)[0],b=P.coreProbe('B2',1,role)[0];
  const f=role==='tank'?[.8,.85]:role==='skirmisher'?[.9,.9]:[1,1];
  assert(Math.abs(b.maxhp-a.maxhp*f[0])<=1);assert(Math.abs(b.atk-a.atk*f[1])<=1);assert.equal(a.def,b.def);assert.equal(a.attackEvery,b.attackEvery);
  if(f[0]===1)assert.deepEqual(a,b);
  for(const level of [2,3,10,200])assert.deepEqual(P.coreProbe('A',level,role),P.coreProbe('B2',level,role));
  for(const size of [2,4,12,22])assert.deepEqual(P.coreProbe('A',1,role,size),P.coreProbe('B2',1,role,size));
 }
});
test('Native candidate loader smoke with unchanged starter items',()=>{const accounts=P.ARMS.map(arm=>P.runAccount(P.IDS[0],arm,0,{...P.CONFIG,maxLevel:1,maxAttempts:1,maxTotalAttempts:1}));for(const a of accounts){assert.equal(a.attempts.length,1);assert(!a.attempts[0].error,JSON.stringify(a.attempts[0].diagnostic));assert.equal(a.startXp,0);assert.equal(a.initialGear.starter,3);assert.deepEqual(a.issues,[]);assert.equal(P.summarize([a]).timeouts,0);assert.deepEqual(a.initialGear,accounts[0].initialGear);}});
