'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const S=require('../scripts/v013-stage638-natural-rates.cjs');
const V=require('../scripts/v013-stage637-natural-rates.cjs');
test('Stage6.38: preserve 100 native profiles and 5 original seeds',()=>{
 const B=require('../scripts/v013-stage632-player-power.cjs');
 assert.equal(B.IDS.length,100);
 assert.equal(B.SEEDS.length,5);
 assert.equal(S.options(['--batch=19','--seed=9869','--out=reports/v013-stage638-cohort-19-9869.json']).out,
  'reports/v013-stage638-cohort-19-9869.json');
 assert.throws(()=>S.options(['--out=../../wrong.json']),/Unsafe/);
 assert.throws(()=>S.options(['--batch=20']),/Unsafe/);
 assert.throws(()=>S.aggregate([]),/Missing or mixed/);
 assert.throws(()=>S.aggregate([{stage:'6.37'}]),/Incorrect Stage6.38/);
 assert.deepEqual(S.OLD.levels[0].swarm,[0,581]);
 assert.deepEqual(S.OLD.levels[0].solo,[4142,4327]);
 assert.equal(S.OLD.run,45199904168);
 assert.equal(typeof V.summaryAccount,'undefined');
});
