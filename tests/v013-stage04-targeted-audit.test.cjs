'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const N=require('../scripts/v013-natural-progression.cjs');
const C=require('../scripts/v013-stage04-run-cohort.cjs');
const A=require('../scripts/v013-stage04-aggregate.cjs');
function fixture(seed,policy){
 const accounts=C.PROFILES.map((profile,i)=>{
  const complete=seed===11001&&profile===C.PROFILES[0]&&policy==='adaptive';
  const max=complete?20:2;
  const attempts=Array.from({length:max},(_,i)=>{
   const level=i+1,win=complete||level===1;
   return {level,attempt:1,status:win?'victory':'defeat',
    bossReached:win,bossWon:win,
    before:{xp:(level-1)*25,unlocked:level},
    after:{xp:level*25,unlocked:win?level+1:level},
    rooms:[{roomType:level===1?'combat':'boss',initialEnemies:level===1?4:1,
     capabilities:{role:'single-target',affinityComposition:'unformed',
      synergyStage:'not-yet'},won:win,died:!win,timedOut:false,
     seconds:12,hpMax:70,damageTaken:10,damageDealt:45,
     targetSwitches:1,observedNonFocusedHealthLost:7}],
    decisions:[],gold:2};
  });
  return {seed,profile,initialGear:{total:1,starter:1,
   items:[{slot:'weapon',tier:1,rarity:'Common',subtype:'Sword',startingGear:true}]},
   startXp:0,attempts,endLevel:complete?21:2,
   reached:Array.from({length:complete?20:2},(_,i)=>i+1),
   stopReason:complete?null:'E2 unbeaten after 18 native attempts',
   xp:25*max,talents:[],gold:0,fragments:0};
 });
 return {stage04:{seed,policy,accounts:10,kind:'natural-native-E1-E20-decision-ablation'},
  settings:{seeds:[seed],decisionModel:policy,maxLevel:20,maxAttempts:18,
   maxTotalAttempts:360,tickLimit:12000},
  integrity:{noFabricatedXp:true,noForcedEquipment:true,noForcedEncounter:true,
   noForcedLevelUnlock:true,noDamageOverride:true},
  accounts,coverage:{accounts:10,attempts:accounts.reduce((n,a)=>n+a.attempts.length,0),errors:0},
  runnerSha256:'runner',agentStrategySha256:'agent',source:'source'};
}
const all=()=>C.SEEDS.flatMap(seed=>C.POLICIES.map(policy=>fixture(seed,policy)));
test('12 seeds x 10 native profiles x three precise policy alternatives',()=>{
 assert.equal(C.SEEDS.length,12);assert.equal(C.POLICIES.length,3);
 assert.equal(C.PROFILES.length,10);assert.equal(A.KEYS.length,36);
 assert.equal(new Set(C.PROFILES).size,10);
 assert.equal(C.configuration(11001,'adaptive-no-targets').tickLimit,12000);
 assert.equal(C.configuration(11001,'adaptive-no-rooms').maxTotalAttempts,360);
 assert.throws(()=>C.configuration(11001,'invalid'),/Unscheduled/);
});
test('Ablations only switch one decision dimension; never stats or rules',()=>{
 const all=N.policyFlags('adaptive');
 const noTargets=N.policyFlags('adaptive-no-targets');
 const noRooms=N.policyFlags('adaptive-no-rooms');
 assert.deepEqual({...all,targets:false},noTargets);
 assert.deepEqual({...all,rooms:false},noRooms);
 assert.equal(all.targets,true);assert.equal(noTargets.targets,false);
 assert.equal(noRooms.rooms,false);
});
test('Full aggregate counts 360 accounts and conditional Boss exposure properly',()=>{
 const report=A.summarize(all());
 assert.equal(report.coverage.shards,36);
 assert.equal(report.coverage.accounts,360);
 assert.equal(report.byPolicy.adaptive.accounts,120);
 assert.equal(report.byPolicy.adaptive.E20,1);
 assert.equal(report.byPolicy['adaptive-no-targets'].E20,0);
 assert.equal(report.byPolicy['adaptive-no-rooms'].E1,120);
 assert.equal(report.paired['adaptive-no-targets'].E20.lost,1);
 assert.equal(report.paired['adaptive-no-rooms'].E20.lost,1);
 assert.equal(report.coverage.nativeErrors,0);
 assert.equal(report.coverage.combatTimeouts,0);
 assert.equal(report.nativeCombat.groupsByRoleAndSize['adaptive/single-target/2-4/E1-E5'].fights,120);
 assert.match(A.markdown(report),/AoE/);
});
test('Incomplete or duplicate shard/account/level attempt fails closed',()=>{
 assert.throws(()=>A.summarize(all().slice(1)),/exactly 36/);
 const duplicate=all();duplicate[1]=duplicate[0];
 assert.throws(()=>A.summarize(duplicate),/unexpected\/duplicate shard/);
 const bad=all();bad[0].accounts[2].startXp=50;
 assert.throws(()=>A.summarize(bad),/non-native starting/);
 const invalid=all();invalid[0].accounts[2].attempts[1].level=5;
 assert.throws(()=>A.summarize(invalid),/attempted locked E/);
});
test('True initial native equipment must match across policies for same seed/profile',()=>{
 const bad=all();const pick=bad.find(d=>d.stage04.seed===11001&&d.stage04.policy==='adaptive-no-rooms');
 pick.accounts[0].initialGear.items[0].tier=99;
 assert.throws(()=>A.summarize(bad),/starting character differs/);
});
test('Captured combat roles, multi-enemy groups and earned mixed synergy are separate axes',()=>{
 const ds=all();const room=ds[0].accounts[1].attempts[0].rooms[0];
 room.capabilities={role:'hybrid',affinityComposition:'mixed',
  synergyStage:'prepared-mixed-ability'};
 room.observedNonFocusedHealthLost=15;
 const report=A.summarize(ds);
 assert(report.nativeCombat.mixedByEarnedStage['adaptive/prepared-mixed-ability/hybrid/E1-E5']);
 assert(report.nativeCombat.groupsByRoleAndSize['adaptive/hybrid/2-4/E1-E5']);
 assert.equal(report.nativeCombat.groupsByRoleAndSize['adaptive/hybrid/2-4/E1-E5'].observedNonFocusedHealthLoss,15);
});
test('Combat errors are never quietly interpreted as defeat or Boss win',()=>{
 const ds=all();
 ds[0].accounts[1].attempts[1].status='error';
 ds[0].accounts[1].attempts[1].error='Native combat timeout';
 ds[0].coverage.errors=1;
 assert.throws(()=>A.summarize(ds),/native simulation errors/);
});
test('File SHA and exact Node patch are verified in all 36 shards',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'stage04-'));
 const ds=all();
 const names=['scripts/v013-natural-progression.cjs','scripts/v013-agent-strategy.cjs',
  'scripts/v013-stage04-run-cohort.cjs','scripts/v013-stage04-aggregate.cjs',
  'tests/v012-economy-harness.cjs','combat/v012-gear-stats.js'];
 const hashes=names.map((_,i)=>String(i+1).repeat(64));
 try{
  for(const d of ds){
   const key=d.stage04.seed+'-'+d.stage04.policy;
   d.runnerSha256=hashes[0];d.agentStrategySha256=hashes[1];
   fs.writeFileSync(path.join(dir,'raw-'+key+'.provenance.txt'),
    ['revision='+'f'.repeat(40),'node=v22.23.5','cohort='+key,
     ...names.map((x,i)=>hashes[i]+'  '+x)].join('\n'));
  }
  assert.equal(A.verifyProvenance(dir,ds).nodeVersion,'v22.23.5');
  const file=path.join(dir,'raw-11001-adaptive.provenance.txt');
  fs.writeFileSync(file,fs.readFileSync(file,'utf8').replace('node=v22.23.5','node=v22.23.4'));
  assert.throws(()=>A.verifyProvenance(dir,ds),/mixed Git revisions/);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('Boss/Elite target switches must be counted even when median is zero',()=>{
 const rows=all();
 const r=rows[0].accounts[1].attempts[1].rooms[0];
 r.roomType='boss';r.bossStyle='leech';
 r.targetSwitches=3;r.bossSummons=2;r.peakLiveEnemies=4;
 const report=A.summarize(rows);
 const b=report.nativeCombat.bossByTypeAndLevel['adaptive/leech/E1-E5'];
 assert.equal(b.totalTargetSwitches,3);
 assert.equal(b.fightsWithTargetSwitch,1);
 assert.equal(b.totalObservedBossSummons,2);
 assert.equal(b.maxPeakLiveEnemies,4);
});
test('Repeated fights from one character cannot inflate unique mixed-build coverage',()=>{
 const rows=all();
 const account=rows[0].accounts[1];
 for(const t of account.attempts){
  t.rooms[0].capabilities={role:'hybrid',affinityComposition:'mixed',
   synergyStage:'prepared-mixed-ability'};
 }
 const r=A.summarize(rows);
 assert.equal(r.nativeCombat.uniqueAccountsByMixedStage.adaptive['prepared-mixed-ability'],1);
 assert.equal(r.nativeCombat.uniqueAccountsByRole.adaptive.hybrid,1);
 assert.equal(r.nativeCombat.mixedByEarnedStage['adaptive/prepared-mixed-ability/hybrid/E1-E5'].fights,2);
});
