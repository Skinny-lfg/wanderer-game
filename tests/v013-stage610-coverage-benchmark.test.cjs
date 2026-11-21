'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const C=require('../scripts/v013-stage610-coverage-benchmark.cjs');

test('Live TalentGraph provides exactly 12 basic, 6 focused and 6 mixed structural paths',()=>{
 const c=C.catalogue();
 assert.equal(c.talentPaths.length,24);
 assert.equal(c.talentPaths.filter(x=>x.kind==='basic').length,12);
 assert.equal(c.talentPaths.filter(x=>x.kind==='focused').length,6);
 assert.equal(c.talentPaths.filter(x=>x.kind==='mixed').length,6);
 assert.equal(c.weapons.length,7);
 assert.deepEqual(c.armor,['Cloth','Leather','Plate']);
 assert.equal(c.roles.length,4);
 assert.equal(c.bosses.length,6);
 assert.equal(c.affinities.length,6);
 assert.equal(c.elites.completeRoster,false,'do not confuse four special mechanics with complete Elite roster');
 assert(c.caveats.some(x=>x.includes('not all legal')));
});
test('Pairwise planner covers every required pair without claiming actual fights',()=>{
 const dims={talent:['blood','fury','decay'],weapon:['Sword','Wand'],
  realm:['blood','magic'],boon:['none','present']};
 const plan=C.pairwisePlan(dims);
 assert.equal(plan.missingPairs,0);
 assert.equal(plan.coveredPairs,C.allPairs(dims).size);
 assert(plan.rows.length>0&&plan.rows.length<100);
 const keys=Object.keys(dims),seen=new Set();
 for(const r of plan.rows){
  for(const k of keys)assert(dims[k].includes(r[k]));
  for(let i=0;i<keys.length;i++)for(let j=i+1;j<keys.length;j++)
   seen.add(keys[i]+'='+r[keys[i]]+'||'+keys[j]+'='+r[keys[j]]);
 }
 assert.deepEqual(seen,C.allPairs(dims));
 assert.match(plan.warning,/Unrealized/);
});
test('Actual candidate plan has full pair coverage and only design status',()=>{
 const result=C.pairwisePlan();
 assert.equal(result.missingPairs,0);
 assert(result.candidateRows>0);
 assert.equal(result.rows.length,result.candidateRows);
 assert(result.totalPairs>100);
 assert.match(result.algorithm,/not native/);
});
function shard(seed=9701,weapon='Sword'){
 const prefix={inputSha256:'input1',historySha256:'history1',
  original:{gearSha256:'gear1'},actual:{affinity:'blood',risk:1,
   first:{type:'normal',won:true}}};
 return {stage:'6.9',gameSourceSha256:'source1',result:{
  seed,level:5,initialFingerprint:'input1',historySha256:'history1',realWeapon:weapon,
  variants:{baseline:{...prefix},'blood-pure':{...prefix}},
  nativeEncounterComparison:[{variant:'baseline',sameFirstEncounter:true},
   {variant:'blood-pure',sameFirstEncounter:true}] }};
}
test('Matched earned results track only real observations, leaving unavailable axes unknown',()=>{
 const c=C.catalogue(),result=C.earnedCoverage([shard()],c);
 assert.equal(result.matchedFirstEncounters,2);
 assert.equal(result.coverage.weaponAffinity.covered,1);
 assert.equal(result.coverage.weaponAffinity.total,42);
 assert.equal(result.observations[0].armor,'unknown');
 assert.equal(result.observations[0].boon,'unknown');
 assert.equal(result.observations[0].bossId,'unknown');
 assert(result.excludedFromClaims.includes('24 path routes'));
});
test('Earned coverage rejects unmatched or duplicated evidence',()=>{
 const bad=shard();
 bad.result.nativeEncounterComparison[0].sameFirstEncounter=false;
 assert.throws(()=>C.earnedCoverage([bad]),/not matched/);
 assert.throws(()=>C.earnedCoverage([shard(),shard()]),/Duplicate/);
 const drift=shard(9702);drift.gameSourceSha256='different';
 assert.throws(()=>C.earnedCoverage([shard(),drift]),/Different native source/);
});
test('CLI blocks invalid parameter sets and missing earned evidence',()=>{
 assert.throws(()=>C.parse(['--mode=coverage']),/requires/);
 assert.throws(()=>C.parse(['--runs=1000']),/1–20/);
 assert.throws(()=>C.parse(['--fake-gear=legendary']),/Unknown/);
 assert.equal(C.parse(['--mode=benchmark','--runs=2','--seed-start=9902']).runs,2);
});
