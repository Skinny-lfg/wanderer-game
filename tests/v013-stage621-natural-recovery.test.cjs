'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const C=require('../scripts/v013-stage621-natural-recovery.cjs');
const N=require('../scripts/v013-natural-progression.cjs');
require('../online/v013-boss-infrastructure.js');
require('../online/v013-boss-abilities.js');
const Boss=globalThis.WandererV013BossAbilities;
test('Pre-stage 6.21 native combat baseline is reconstructed byte-exact without shipping a legacy gameplay engine',()=>{
 const before=C.baselineSource();
 assert.notEqual(before,C.LIVE_SOURCE);
 assert.equal(C.gitBlobSha(before),C.PRE_STAGE621_GIT_BLOB);
 assert(before.includes(C.ORIGINAL_ATTACK));
 assert(!before.includes('bossEarly=boss?'));
 assert(C.LIVE_SOURCE.includes('WandererV013BossAbilities.earlyScale(variant.style,level)'));
});
test('Six actual Boss early scales are independent and have no effects on E35/E70',()=>{
 assert.equal(Object.keys(Boss.EARLY_BOSS_PRESSURE).length,6);
 const gains=new Set(Object.values(Boss.EARLY_BOSS_PRESSURE).map(v=>JSON.stringify(v)));
 assert.equal(gains.size,6);
 for(const style of Object.keys(Boss.EARLY_BOSS_PRESSURE)){
  const first=Boss.earlyScale(style,1),five=Boss.earlyScale(style,5),
    mid=Boss.earlyScale(style,15),late=Boss.earlyScale(style,35),
    end=Boss.earlyScale(style,70);
  for(const field of ['hp','atk']){
   assert(first[field]>0.5&&first[field]<five[field]);
   assert(five[field]<mid[field]&&mid[field]<1);
   assert.equal(Boss.earlyScale(style,30)[field],1);
   assert.equal(late[field],1);
   assert.equal(end[field],1);
  }
 }
 assert.throws(()=>Boss.earlyScale('not-a-real-boss',5),/Unknown/);
 assert.throws(()=>Boss.earlyScale('leech',NaN),/Invalid/);
});
test('Experimental normal role attack policy remains test-only, independent of six native Boss reductions',()=>{
 const norm=C.candidateSource(),boss=C.bossCandidateSource(),both=C.combinedSource();
 assert(norm.includes('!boss&&!miniboss&&level<=2'));
 assert(norm.includes('earlyNormalAttack'));
 assert(!norm.includes('bossEarly=boss?'));
 assert(boss.includes('bossEarly=boss?'));
 assert(!boss.includes('earlyNormalAttack'));
 assert(both.includes('earlyNormalAttack'));
 assert(both.includes('bossEarly=boss?'));
 assert.equal(norm.split(C.EARLY_ATTACK).length,2);
});
test('Native cohort and output modes are bounded',()=>{
 assert.equal(C.parse().native.maxLevel,3);
 for(const mode of ['baseline','candidate','boss-only','combined','retest'])
  assert.equal(C.parse(['--mode='+mode]).mode,mode);
 assert.throws(()=>C.parse(['--mode=bad']),/Invalid/);
 assert.throws(()=>C.parse(['--out=../escape.json']),/Invalid/);
 assert.throws(()=>C.parse(['--seeds=1,2,3,4,5,6,7,8,9,10','--profiles=cautious,balanced']),/cohort|large|Invalid/);
});
test('Fresh persistent native accounts have zero XP and only starter gear in before/after Boss builds',()=>{
 const opts=N.parseArgs(['--seeds=9712','--profiles=cautious','--max-level=2',
 '--max-attempts=1','--max-total-attempts=1']);
 const before=N.run(opts,{moduleOverrides:{'combat/v012-combat-runtime.js':C.baselineSource()}});
 const after=N.run(opts);
 for(const run of [before,after]){
  assert.equal(run.coverage.accounts,1);
  assert.equal(run.coverage.errors,0);
  assert.equal(run.accounts[0].startXp,0);
  assert.equal(run.accounts[0].initialGear.starter,run.accounts[0].initialGear.total);
  assert(run.accounts[0].attempts.every(x=>x.level===1&&x.before.earned<=x.after.earned));
 }
});
