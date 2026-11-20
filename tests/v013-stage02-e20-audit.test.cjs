'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const C=require('../scripts/v013-stage02-run-cohort.cjs');
const A=require('../scripts/v013-stage02-aggregate.cjs');
const N=require('../scripts/v013-natural-progression.cjs');
const create=require('./v012-economy-harness.cjs');
function fakeShard(seed,group){
 const profiles=C.GROUPS[group],accounts=profiles.map((profile,i)=>{
  const long=seed===9811&&group==='A'&&i===0;
  const end=long?5:2,reached=Array.from({length:end},(_,n)=>n+1);
  const attempts=[];
  for(let E=1;E<=end;E++){
   const won=E<end;
   attempts.push({level:E,attempt:1,status:won?'victory':'defeat',
    bossWon:won,bossReached:true,before:{xp:(E-1)*100,unlocked:E},
    after:{xp:E*100,unlocked:won?E+1:E}});
  }
  return {seed,profile,startXp:0,initialGear:{total:3,starter:3},
   reached,endLevel:end,attempts,stopReason:'fixture only',
   xp:end*100,talents:[],finalGear:{total:4,starter:1},gold:0,fragments:0};
 });
 return {source:'combat-source',runnerSha256:'runner',agentStrategySha256:'agent',
  stage02:{seed,group,cohort:seed+'-'+group},
  settings:{seeds:[seed],profiles,maxLevel:20,maxAttempts:18,
   maxTotalAttempts:360,tickLimit:12000,decisionModel:'adaptive'},
  integrity:{noFabricatedXp:true,noForcedEquipment:true,noForcedLevelUnlock:true,
   noForcedEncounter:true,noDamageOverride:true},
  coverage:{accounts:5,attempts:accounts.reduce((n,a)=>n+a.attempts.length,0),errors:0},
  accounts};
}
const all=()=>C.SEEDS.flatMap(seed=>Object.keys(C.GROUPS).map(group=>fakeShard(seed,group)));
test('Stage 02 cohort exactly partitions 50 persistent native accounts',()=>{
 const allProfiles=Object.values(C.GROUPS).flat();
 assert.equal(allProfiles.length,10);assert.equal(new Set(allProfiles).size,10);
 assert.equal(C.SEEDS.length,5);
 assert.equal(A.expected.length,10);
 for(const seed of C.SEEDS)for(const group of Object.keys(C.GROUPS)){
  const c=C.configuration(seed,group);
  assert.equal(c.maxLevel,20);assert.equal(c.maxAttempts,18);
  assert.equal(c.maxTotalAttempts,360);assert.equal(c.tickLimit,12000);assert.equal(c.profiles.length,5);
 }
 assert.throws(()=>C.configuration(1,'A'),/Unknown Stage 02 seed/);
 assert.throws(()=>C.configuration(9811,'missing'),/Unknown Stage 02 group/);
});
test('Aggregate shows unreached E20 as censored rather than zero-percent success',()=>{
 const r=A.audit(all());
 assert.equal(r.coverage.accounts,50);
 assert.equal(r.coverage.shards,10);
 assert.equal(r.perExpedition.length,20);
 assert.equal(r.perExpedition[0].entered,50);
 assert.equal(r.perExpedition[0].clears,50);
 assert.equal(r.perExpedition[1].entered,50);
 assert.equal(r.perExpedition[1].clears,1);
 assert.equal(r.perExpedition[4].entered,1);
 assert.equal(r.perExpedition[5].entered,0);
 assert.equal(r.perExpedition[19].status,'not_reached');
 assert.equal(r.perExpedition[19].conditionalClearPct,null);
 assert.equal(r.perExpedition[19].medianTriesToClear,null);
 assert.equal(r.milestones.E20.reached,0);
 assert.equal(r.milestones.E20.medianTriesToReach,null);
 assert.match(A.markdown(r),/not reached/);
});
test('Milestones count attempts cumulatively, with per-E success distribution conditional on entrants',()=>{
 const r=A.audit(all());
 assert.equal(r.coverage.highestReached,5);
 assert.equal(r.coverage.highestCleared,4);
 assert.equal(r.milestones.E5.reached,1);
 assert.equal(r.milestones.E5.cleared,0);
 assert.equal(r.milestones.E5.medianTriesToReach,4);
 assert.equal(r.perExpedition[1].conditionalClearPct,2);
 assert.equal(r.perExpedition[1].medianTriesToClear,1);
 assert.equal(r.accounts.length,50);
});
test('Missing and duplicate cohort artifacts fail closed',()=>{
 assert.throws(()=>A.audit(all().slice(1)),/expected 10 shards/);
 const duplicate=all();duplicate[1]=duplicate[0];
 assert.throws(()=>A.audit(duplicate),/duplicate\/unscheduled/);
});
test('Forged E-level unlock or native Boss victory is rejected',()=>{
 const cohort=fakeShard(9811,'A'),account=cohort.accounts[1];
 account.attempts[1].bossWon=true;
 assert.throws(()=>A.validateCohort(cohort,9811,'A'),/unverified native victory/);
 account.attempts[1].bossWon=false;
 account.attempts[1].level=3;
 assert.throws(()=>A.validateCohort(cohort,9811,'A'),/skipped Boss unlock|attempted locked/);
});
test('Mixed runner revisions and duplicate accounts cannot enter consolidated report',()=>{
 const cohorts=all();cohorts[3].runnerSha256='new-runner';
 assert.throws(()=>A.audit(cohorts),/mixed source fingerprints/);
 const same=all();same[0].accounts[0].profile=same[0].accounts[1].profile;
 assert.throws(()=>A.audit(same),/profile mismatch/);
});
test('A technical error is not silently counted as a death or valid clear',()=>{
 const cohorts=all(),a=cohorts[0].accounts[0];
 a.attempts.at(-1).status='error';a.attempts.at(-1).error='Invalid talent progress';
 assert.throws(()=>A.audit(cohorts),/native runtime errors found/);
 assert.equal(A.stopClass(a),'technical_error');
 assert.equal(a.attempts.at(-1).bossWon,false);
});
test('Attempts-to-clear statistics use winning accounts, not censored accounts',()=>{
 assert.equal(A.median([]),null);assert.equal(A.p90([]),null);
 assert.equal(A.median([5,1,2,4]),3);
 assert.equal(A.p90([1,2,3,4,5,6,7,8,9,10]),9);
});

test('Native Forge preview alone is not permission to craft when Stash is full',()=>{
 const a=create(9814,undefined,{}, {skipPersistence:true});
 const st=a.state(),cap=st.stashCapacity;
 assert(a.forge.canCraft());
 st.stashCapacity=1;
 st.stash.push(a.makeItem(1,'helm',null,'loot','Helm','Common'));
 assert.equal(a.forge.canCraft(),false,'native capacity restriction should match actual UI');
 const before={fragments:st.fragments,essence:st.crafting.essence};
 const result=N.investEarnedGear(a,N.PROFILES['plate-warden'],16);
 assert.deepEqual(result,{crafted:[]});
 assert.equal(st.fragments,before.fragments);
 assert.equal(st.crafting.essence,before.essence);
 st.stashCapacity=cap;
});
