'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
require('../combat/v013-gauntlet.js');
const G=globalThis.WandererV013Gauntlet;
test('Gauntlet flag is restricted to the local preview and approved counts',()=>{
 for(const count of [8,10,12])assert.equal(G.localCount(true,'localhost',`?gauntlet=${count}`),count);
 assert.equal(G.localCount(false,'localhost','?gauntlet=8'),0);
 assert.equal(G.localCount(true,'wanderer.example','?gauntlet=8'),0);
 assert.equal(G.localCount(true,'localhost','?gauntlet=9'),0);
});
test('mob IDs and wave-stat distribution are deterministic and never award mobs directly',()=>{
 const a=G.create({attempt:4,plane:7,seed:1234,count:8,waves:3}),b=G.create({attempt:4,plane:7,seed:1234,count:8,waves:3});
 assert.deepEqual(a,b);
 assert.deepEqual(Array.from({length:8},(_,i)=>G.baselineWave(a,i)),[1,2,3,1,2,3,1,2]);
 for(let i=0;i<a.count;i++){
  const id=G.mobId(a);assert.equal(id,G.mobId(b));
  assert.equal(G.recordKill(a,id),true);assert.equal(G.recordKill(a,id),false);
  assert.equal(G.recordKill(b,id),true);
 }
 assert.equal(a.index,8);assert.equal(a.kills.length,8);assert.equal(G.valid(a),true);
 assert.equal(G.award(a,'4:7:gauntlet:reward:1'),true);
 assert.equal(G.award(a,'4:7:gauntlet:reward:1'),false);
});
test('incomplete and unrelated checkpoints cannot grant a reward',()=>{
 const g=G.create({attempt:1,plane:1,seed:10,count:10,waves:2});
 assert.throws(()=>G.award(g,'1:1:gauntlet:reward:1'),/incomplete/);
 assert.equal(G.recordKill(g,'wrong-id'),false);
});
