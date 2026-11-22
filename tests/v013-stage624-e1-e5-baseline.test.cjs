'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const A=require('../scripts/v013-stage624-e1-e5-baseline.cjs');
const N=require('../scripts/v013-natural-progression.cjs');
const create=require('./v012-economy-harness.cjs');
test('Stage 6.24A traces all native enemy types, gear thresholds and levels without changing gameplay',()=>{
 const r=A.formulas();
 assert.equal(r.rows.length,A.traceLevels.length);
 assert.equal(r.source.native.length,64);
 assert.deepEqual(r.gearTierThresholds,[1,5,15,35,70]);
 for(const level of A.levels){
  const row=r.rows.find(x=>x.level===level);
  assert(row.reference>0);
  assert(row.normalBase.hp>0);
  assert(row.normalBase.atk>0);
  assert.deepEqual(Object.keys(row.eliteExtras).sort(),
   [...require('../scripts/v013-stage623-earned-matched-enemies.cjs').ELITES].sort());
  for(const scale of Object.values(row.eliteExtras))
   assert.deepEqual(scale,{hp:1,atk:1,def:1});
 }
 for(let i=1;i<5;i++){
  const now=r.rows[i],prev=r.rows[i-1];
  assert(now.reference>prev.reference);
  assert(now.normalBase.hp>prev.normalBase.hp);
  assert(now.normalBase.atk>prev.normalBase.atk);
 }
 assert(r.rows.find(x=>x.level===6).eliteExtras.gravecaller.hp>1);
 const rift=(E)=>r.rows.find(x=>x.level===E).bossExtras.rift.hp;
 assert(rift(1)<rift(5));
 assert(rift(5)<rift(35));
 assert.equal(rift(35),1);
});
test('CLI refuses unbounded/unsafe content and changes no game files',()=>{
 assert.equal(A.parse(['--seed=9701']).seed,9701);
 assert.equal(A.parse(['--mode=aggregate','--inputs=reports/input']).mode,'aggregate');
 assert.throws(()=>A.parse(['--seed=0']),/seed/);
 assert.throws(()=>A.parse(['--mode=aggregate']),/inputs/);
 assert.throws(()=>A.parse(['--out=../../foo.json']),/Unsafe/);
 assert.throws(()=>A.parse(['--anything=x']),/Unsupported/);
});
test('E1 Camp native snapshot uses real weak starter gear, zero Talent XP and no mutation',()=>{
 const a=create(624001,undefined,{}, {skipPersistence:true,now:172000624001});
 const original=JSON.stringify(a.state());
 const snap=A.checkpoint({a,seed:624001,level:1,attempt:1,profile:N.PROFILES.cautious});
 assert.equal(snap.level,1);
 assert.equal(snap.state.automaticTalents.xp,0);
 assert.equal(snap.talentsEarned,0);
 assert(snap.remainingStarter>=3);
 assert.equal(snap.player.maxhp,a.baseStats().maxhp);
 assert.equal(JSON.stringify(a.state()),original);
 assert.equal(A.checkpoint({a,seed:624001,level:1,attempt:2,profile:N.PROFILES.cautious}),null);
 assert.throws(()=>A.checkpoint({a,seed:624001,level:5,attempt:1,profile:N.PROFILES.cautious}),/legitimately unlocked/);
});
test('Native group matching and E1-E5 aggregation reject drift, duplicates and missing checkpoints',()=>{
 const fake={stage:'6.24A',mode:'cohort',seed:9701,source:'sha',
  model:{source:{native:'sha'},rows:[]},coverage:{errors:0},accounts:[],
  snapshots:[],rows:[]};
 const empty=A.aggregate([fake]);
 assert.equal(empty.coverage.seeds,1);
 assert.equal(empty.coverage.fights,0);
 assert.deepEqual(empty.byLevel.map(x=>x.E),A.levels);
 assert.throws(()=>A.aggregate([fake,fake]),/duplicate shard/i);
 const diff={...fake,seed:9702,source:'different'};
 assert.throws(()=>A.aggregate([fake,diff]),/source/i);
 const bad={...fake,snapshots:[{checkpointKey:'x'}]};
 assert.throws(()=>A.aggregate([bad]),/Missing E1-E5/);
});
