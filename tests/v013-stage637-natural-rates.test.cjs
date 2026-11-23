'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const A=require('../scripts/v013-stage637-natural-rates.cjs');
const B=require('../scripts/v013-stage632-player-power.cjs');
test('Stage6.37: deterministic 500 E1-born legal accounts, 8 real named Elites',()=>{
 assert.equal(B.IDS.length,100);assert.equal(B.SEEDS.length,5);
 assert.equal(A.E.length,8);
 assert.deepEqual(A.LV,[1,2,3,4,5]);
 assert.equal(A.options(['--batch=19','--seed=9869','--max-level=5']).batch,19);
 for(const a of ['--batch=20','--seed=42','--max-level=6','--max-attempts=0',
  '--max-total-attempts=181','--take=6','--mode=illegal','--out=../outside.json',
  '--inputs=../../outside','--unknown=3'])
  assert.throws(()=>A.options([a]),a);
});
test('Stage6.37: reject partial or synthetic cohort aggregation, never use absent levels',()=>{
 assert.throws(()=>A.aggregate([]),/Missing or mixed/);
 assert.throws(()=>A.aggregate([{stage:'6.34',kind:'cohort'}]),/Incomplete/);
});
