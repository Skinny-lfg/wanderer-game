'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const C=require('../scripts/v013-stage621-natural-recovery.cjs');
const N=require('../scripts/v013-natural-progression.cjs');
test('Native E1 experiment is isolated and cannot grant loot or earned progression',()=>{
 const source=C.candidateSource();
 assert.notEqual(source,C.LIVE_SOURCE);
 assert(source.includes("!boss&&!miniboss&&level<=2"));
 assert(source.includes("level===1?({tank:.86,skirmisher:.78,caster:.80,minion:.86}"));
 assert(source.includes("level===2")||source.includes("({tank:.95,skirmisher:.93"));
 assert.equal(source.split(C.EARLY_ATTACK).length,2);
 assert.equal(C.LIVE_SOURCE.split(C.ORIGINAL_ATTACK).length,2);
});
test('Bounded native cohort and output modes are validated',()=>{
 assert.equal(C.parse().native.maxLevel,3);
 assert.equal(C.parse(['--mode=candidate']).mode,'candidate');
 assert.throws(()=>C.parse(['--mode=bad']),/Invalid/);
 assert.throws(()=>C.parse(['--out=../escape.json']),/Invalid/);
 assert.throws(()=>C.parse(['--seeds=1,2,3,4,5,6,7,8,9,10','--profiles=cautious,balanced']),/cohort|large|Invalid/);
});
test('Actual persistent native candidate never forges items, XP or unlocks',()=>{
 const c=N.parseArgs(['--seeds=9712','--profiles=cautious','--max-level=2',
 '--max-attempts=1','--max-total-attempts=1']);
 const baseline=N.run(c),candidate=N.run(c,{moduleOverrides:{
  'combat/v012-combat-runtime.js':C.candidateSource()
 }});
 for(const run of [baseline,candidate]){
  assert.equal(run.coverage.accounts,1);
  assert.equal(run.coverage.errors,0);
  assert.equal(run.accounts[0].startXp,0);
  assert.equal(run.accounts[0].initialGear.starter,run.accounts[0].initialGear.total);
  assert(run.accounts[0].attempts.every(a=>a.level===1&&a.before.earned<=a.after.earned));
 }
});
