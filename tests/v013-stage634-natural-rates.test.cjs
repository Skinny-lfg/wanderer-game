'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const A=require('../scripts/v013-stage634-natural-rates.cjs');
const B=require('../scripts/v013-stage632-player-power.cjs');
test('Stage 6.34: immutable 100×5 earned agent catalog, no unsafe cohort flags',()=>{
 assert.equal(B.IDS.length,100);assert.equal(B.BATCHES.length,20);assert.deepEqual(B.SEEDS,[9861,9863,9865,9867,9869]);
 assert.equal(A.parse(['--mode=cohort','--batch=19','--seed=9869']).batch,19);
 for(const args of [['--batch=20'],['--seed=999'],['--take=6'],
  ['--max-level=6'],['--max-total-attempts=999'],
  ['--out=../../foo.json'],['--inputs=../foo'],['--mode=pilot']])
  assert.throws(()=>A.parse(args));
});
test('Stage 6.34: unresolved combat cannot be counted as win or loss',()=>{
 const x=A.rate([{win:true,death:false,timeout:false,seconds:5},
  {win:false,death:true,timeout:false,seconds:3},
  {win:false,death:false,timeout:true,seconds:4}]);
 assert.deepEqual(x,{fights:3,resolved:2,wins:1,losses:1,censored:1,winPct:50,medianSeconds:5});
 assert.equal(A.rate([]).winPct,null);
 assert.throws(()=>A.aggregate([]),/Incomplete/);
});
test('Stage 6.34: no fabricated E levels, validate genuine native room attribution',()=>{
 const player={attempts:[{level:1,attempt:1,rooms:[
  {roomType:'combat',won:true,died:false,initialEnemies:3,seconds:5},
  {roomType:'boss',won:false,died:true,initialEnemies:1,seconds:12}]}],
  endLevel:1,reached:[1],xp:100,stopReason:'cannot beat E1'};
 const profile={families:['blood'],risk:0,armor:'Leather',weapons:['Sword']};
 const x=A.summaryAccount(player,'balanced',profile,9861);
 assert.equal(x.rooms.length,2);assert.deepEqual(x.reached,[1]);assert.deepEqual(x.bossWins,[]);
 assert.equal(x.rooms[0].enemies,3);
 assert.throws(()=>A.summaryAccount({...player,attempts:[{level:2,attempt:1,rooms:[]}]},'balanced',profile,9861),/E1/);
 assert.throws(()=>A.summaryAccount({...player,attempts:[{level:1,attempt:1,rooms:[
   {roomType:'nonexistent',won:true,died:false}]}]},'balanced',profile,9861),/Invalid native/);
});
