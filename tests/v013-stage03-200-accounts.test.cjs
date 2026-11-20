'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const S=require('../scripts/v013-stage03-run-seed.cjs');
const A=require('../scripts/v013-stage03-aggregate.cjs');
function fixture(seed){
 const accounts=S.PROFILES.map((profile,i)=>{
  const long=seed===9901&&i===0,end=long?21:2;
  const attempts=Array.from({length:end===21?20:2},(_,n)=>{
   const E=n+1,won=long||E===1;
   return {level:E,attempt:1,bossReached:true,bossWon:won,
    status:won?'victory':'defeat',xpEarned:15,rooms:[],
    before:{xp:15*n,unlocked:E},after:{xp:15*(n+1),unlocked:won?E+1:E}};
  });
  return {seed,profile,startXp:0,initialGear:{total:4,starter:4},
   attempts,endLevel:end,reached:Array.from({length:end===21?20:2},(_,i)=>i+1),
   stopReason:long?null:'fixture stopped',xp:15*attempts.length,
   talents:[],gold:5,fragments:3,finalGear:{total:4,starter:2}};
 });
 return {stage03:{stage:'main-200-account-E20-audit',seed},
  settings:{seeds:[seed],profiles:[...S.PROFILES],maxLevel:20,
   maxAttempts:18,maxTotalAttempts:360,tickLimit:12000,decisionModel:'adaptive'},
  integrity:{noFabricatedXp:true,noForcedEquipment:true,noForcedEncounter:true,
   noForcedLevelUnlock:true,noDamageOverride:true},
  coverage:{accounts:10,attempts:accounts.reduce((n,a)=>n+a.attempts.length,0),errors:0},
  source:'source-native',runnerSha256:'runner',agentStrategySha256:'agent',accounts};
}
const all=()=>S.SEEDS.map(fixture);
test('20 seeds x ten distinct profiles = 200 genuine starting accounts',()=>{
 assert.equal(S.SEEDS.length,20);assert.equal(S.PROFILES.length,10);
 assert.equal(new Set(S.SEEDS).size,20);assert.equal(new Set(S.PROFILES).size,10);
 assert.equal(S.options(9901).maxLevel,20);
 assert.equal(S.options(9901).maxAttempts,18);
 assert.equal(S.options(9901).maxTotalAttempts,360);
 assert.equal(S.options(9901).tickLimit,12000);
 assert.throws(()=>S.options(9811),/Unscheduled/);
});
test('Audit retains 200 accounts and treats E20 as censored for unreached builds',()=>{
 const result=A.audit(all());
 assert.equal(result.coverage.accounts,200);
 assert.equal(result.coverage.shards,20);
 assert.equal(result.coverage.clearedE20,1);
 assert.equal(result.milestones.E1.cleared,200);
 assert.equal(result.milestones.E20.reached,1);
 assert.equal(result.milestones.E20.cleared,1);
 assert.equal(result.perExpedition[19].entered,1);
 assert.equal(result.perExpedition[19].notReached,199);
 assert.equal(result.perExpedition[19].medianAttemptsToClear,1);
 assert.equal(result.perExpedition[9].entered,1);
 assert.equal(result.profiles[S.PROFILES[0]].accounts,20);
 assert.equal(result.profiles[S.PROFILES[0]].cleared.E20,1);
 assert.equal(result.profiles[S.PROFILES[1]].cleared.E20,0);
 assert.equal(result.milestones.E20.medianAttemptsToClear,20);
});
test('No observed E20 becomes null conditional clear, not fake 0% win rate',()=>{
 const f=all();f[0].accounts[0]=f[1].accounts[0];
 // restore duplicate identity by constructing a standalone original E2 trajectory
 const copy=fixture(9901).accounts[1];
 f[0].accounts[0]={...copy,profile:S.PROFILES[0]};
 f[0].coverage.attempts=f[0].accounts.reduce((n,a)=>n+a.attempts.length,0);
 const result=A.audit(f);
 assert.equal(result.perExpedition[19].conditionalClearPct,null);
 assert.equal(result.perExpedition[19].medianAttemptsToClear,null);
 assert.equal(result.milestones.E20.reached,0);
 assert.match(A.markdown(result),/Não observado/);
});
test('Unplayed Expedition, forged Boss clear and non-native starting state fail closed',()=>{
 const ds=all(),a=ds[0].accounts[1];
 a.attempts[1].level=3;
 assert.throws(()=>A.audit(ds),/attempted locked Expedition|skipped preceding Boss/);
 a.attempts[1].level=2;
 a.attempts[1].bossWon=true;
 assert.throws(()=>A.audit(ds),/synthetic Boss victory/);
 a.attempts[1].bossWon=false;a.startXp=50;
 assert.throws(()=>A.audit(ds),/not a fresh native account/);
});
test('Full cohort count and profile duplicates are checked before aggregation',()=>{
 assert.throws(()=>A.audit(all().slice(1)),/expected exactly 20/);
 const shards=all();shards[2].accounts[0].profile=shards[2].accounts[1].profile;
 assert.throws(()=>A.audit(shards),/missing\/duplicate profile/);
});
test('Heterogeneous agent SHA and runner errors are retained, never called defeats',()=>{
 const mixed=all();mixed[3].agentStrategySha256='other-agent';
 assert.throws(()=>A.audit(mixed),/mixed agent or runner versions/);
 const failed=all();failed[3].accounts[0].attempts[1].status='error';
 failed[3].accounts[0].attempts[1].error='Invalid talent progress';
 failed[3].coverage.errors=1;
 const result=A.audit(failed);
 assert.equal(result.coverage.errors,1);
 assert.equal(result.perExpedition[1].errors,1);
 assert.equal(result.accounts.filter(a=>a.stopClass==='technical_error').length,1);
});
test('20 provenance manifests must match exact Git, Node patch and native file SHA',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'stage03-'));
 const shards=all();
 const paths=[
 'scripts/v013-natural-progression.cjs','scripts/v013-agent-strategy.cjs',
 'scripts/v013-stage03-run-seed.cjs','scripts/v013-stage03-aggregate.cjs',
 'tests/v012-economy-harness.cjs','combat/v012-gear-stats.js'];
 const fingerprints=paths.map((_,i)=>String(i+1).repeat(64));
 try{
  for(const shard of shards){
   const seed=shard.stage03.seed;
   shard.runnerSha256=fingerprints[0];shard.agentStrategySha256=fingerprints[1];
   const text=['revision='+'b'.repeat(40),'node=v22.23.5','seed='+seed,
    ...paths.map((p,i)=>fingerprints[i]+'  '+p)].join('\n');
   fs.writeFileSync(path.join(dir,'raw-'+seed+'.provenance.txt'),text);
  }
  assert.equal(A.verifyProvenance(dir,shards).nodeVersion,'v22.23.5');
  const file=path.join(dir,'raw-9911.provenance.txt');
  fs.writeFileSync(file,fs.readFileSync(file,'utf8').replace('node=v22.23.5','node=v22.23.4'));
  assert.throws(()=>A.verifyProvenance(dir,shards),/mixed Git commits or Node patch versions/);
  fs.writeFileSync(file,fs.readFileSync(file,'utf8').replace('node=v22.23.4','node=v22.23.5')
    .replace(fingerprints[5],'f'.repeat(64)));
  assert.throws(()=>A.verifyProvenance(dir,shards),/source file hash drift/);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
