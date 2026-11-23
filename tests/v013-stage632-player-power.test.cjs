'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const A=require('../scripts/v013-stage632-player-power.cjs');
const N=require('../scripts/v013-natural-progression.cjs');
const PLANNER=require('../scripts/v013-build-planner.cjs');
test('Stage 6.32: exactly 100 distinct legal agent configurations, no gameplay change',()=>{
 assert.equal(A.ORIGINAL_IDS.length,34);
 assert.equal(A.PLANS.length,21);
 assert.equal(A.IDS.length,100);
 assert.equal(A.BATCHES.length,20);
 assert.equal(new Set(A.IDS).size,100);
 assert.equal(new Set(A.BATCHES.flat()).size,100);
 assert.equal(A.BATCHES.reduce((s,b)=>s+b.length,0),100);
 assert(A.ORIGINAL_IDS.every(id=>A.PROFILES[id]===N.PROFILES[id]));
 for(const [id,p] of Object.entries(A.RESEARCH)){
  assert(id.startsWith('research-'));
  assert(Object.hasOwn(PLANNER.BUILDS,p.plan));
  assert.equal(p.researchGearPreference,true);
  assert(['Cloth','Leather','Plate'].includes(p.armor));
  assert(p.weapons.length&&p.weapons.every(w=>['Sword','Two-Handed','Daggers','Bow','Mace','Wand','Staff'].includes(w)));
  assert(['focus','mechanics'].includes(p.target));
  assert(p.risk>=0&&p.risk<=2);
  assert(p.families.length>=1);
 }
});
test('Stage 6.32: safe configuration and deliberate five-seed coverage',()=>{
 assert.deepEqual(A.SEEDS,[9861,9863,9865,9867,9869]);
 assert.equal(A.settings(['--batch=19','--seed=9869']).batch,19);
 assert.equal(A.settings(['--batch=19','--seed=9869']).take,5);
 assert.throws(()=>A.settings(['--batch=20']),/Invalid cohort/);
 assert.throws(()=>A.settings(['--seed=0']),/Invalid cohort/);
 assert.throws(()=>A.settings(['--take=0']),/Invalid cohort/);
 assert.throws(()=>A.settings(['--max-level=21']),/Invalid cohort/);
 assert.throws(()=>A.settings(['--out=../../bad.json']),/Unsafe/);
 assert.throws(()=>A.settings(['--inputs=reports/../x']),/Unsafe/);
 assert.throws(()=>A.settings(['--mode=pilot']),/Unsafe/);
});
test('Stage 6.32: percentile and paired growth; zero baseline never fabricated',()=>{
 assert.deepEqual(A.distribution([]),{n:0,p25:null,median:null,mean:null,p75:null});
 assert.deepEqual(A.distribution([10,30,50,70]),{n:4,p25:25,median:40,mean:40,p75:55});
 const accounts=[{id:'test',seed:1,checkpoints:[
  {E:1,stats:{maxhp:100,spellPower:0},fights:{normal:{observedDps:25}}},
  {E:2,stats:{maxhp:125,spellPower:10},fights:{normal:{observedDps:30}}}
 ]}];
 assert.equal(A.describePairs(accounts,1,'maxhp').median,25);
 assert.equal(A.describePairs(accounts,1,'observedDps').median,20);
 assert.equal(A.describePairs(accounts,1,'spellPower').pairs,0);
 assert.equal(A.describePairs(accounts,2,'maxhp').pairs,0);
});
test('Stage 6.32: aggregate refuses incomplete or fabricated cohorts',()=>{
 assert.throws(()=>A.aggregate([]),/Incomplete/);
 assert.throws(()=>A.aggregate([{stage:'6.32',kind:'cohort',complete:false,
  coverage:{errors:0},accounts:[],settings:{take:1,maxLevel:2}}]),/Invalid incomplete/);
});
