'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const H=require('../scripts/v013-stage611-legal-adaptive.cjs');
const P=require('../scripts/v013-build-planner.cjs');
const T=globalThis.WandererAutomaticTalents;
const G=globalThis.WandererTalentGraph;

test('Target inventory is sourced from the live graph including replaced Magic arcane route',()=>{
 const {coreCount,targets}=H.pathTargets();
 assert.equal(coreCount,27);
 assert.equal(new Set(targets.map(x=>x.id)).size,targets.length);
 assert(targets.some(x=>x.id==='arcane_mastery'&&x.kind==='focused'));
 assert(targets.some(x=>x.id==='chain_discharge'&&x.kind==='magic-element'));
 assert(targets.some(x=>x.id==='red_guillotine'&&x.kind==='mixed'));
 assert(!targets.some(x=>x.id==='arcane_infusion_old'));
});
test('All candidate snapshots use actual T.valid at the exact point budget',()=>{
 const r=H.enumerateLegal([0,2,6,12,24,36,60,100]);
 assert.equal(r.coreRouteTargets,27);
 assert.equal(r.budgets.length,8);
 assert(r.rowCount>=27*8);
 assert(r.legal>0);
 assert(r.profileCoverage.profiles===Object.keys(P.BUILDS).length);
 assert(r.profileCoverage.rows>=r.profileCoverage.profiles*8);
 for(const x of r.rows){
  assert.equal(x.nativeValid,true);
  assert.equal(x.actualNodes.length,x.spent);
  assert(x.spent<=x.availablePoints);
  const p={xp:x.availablePoints*T.POINT_XP,nodes:x.actualNodes,treeVersion:15};
  if(x.mode!=='arcane')p.element=x.mode;
  assert(T.valid(p),x.target+': '+x.status+' @'+x.availablePoints);
  if(x.status==='native-legal'){
   assert(x.actualNodes.some(id=>id===x.target||id.startsWith(x.target+'_rank')));
   assert(x.spent>=x.requiredRouteCost);
  }
  if(x.status==='unresolved-route')assert(x.reason);
 }
 for(const x of r.profileCoverage.observations){
  assert(x.valid);
  assert(x.spent<=x.budget);
  assert(x.actuallyUnlocked.every(f=>x.allowedAffinities.includes(f)));
  const p={xp:x.budget*T.POINT_XP,nodes:x.actualNodes,treeVersion:15};
  if(x.mode!=='arcane')p.element=x.mode;
  assert(T.valid(p),x.profile+' @'+x.budget);
 }
});
test('Zero-point E1 can never own a single talent or fake Affinity',()=>{
 const cases=['blood_harvest','arcane_mastery','red_guillotine','grave_bloom'];
 for(const id of cases){
  const c=H.candidate(id,0);
  assert.equal(c.spent,0);
  assert.deepEqual(c.actualNodes,[]);
  assert.notEqual(c.status,'native-legal');
 }
 const p=H.profileCandidate('blood-fury-vitality',0);
 assert.equal(p.spent,0);assert.deepEqual(p.actuallyUnlocked,[]);
});
test('Profile family thresholds and pressure do not directly grant nodes',()=>{
 const id='blood-fury-vitality',low=H.profileCandidate(id,0,{pressure:true}),
  high=H.profileCandidate(id,100,{pressure:true});
 assert(low.actuallyUnlocked.length===0);
 assert(high.allowedAffinities.includes('vitality'));
 assert(high.spent<=100);
 assert(high.actuallyUnlocked.every(f=>high.allowedAffinities.includes(f)));
});
test('No unknown IDs, invalid budget, synthetic account claims or invalid CLI accepted',()=>{
 assert.throws(()=>H.candidate('not_real',24),/Unknown/);
 assert.throws(()=>H.candidate('arcane_mastery',101),/budget/);
 assert.throws(()=>H.profileCandidate('wrong',20),/Invalid profile/);
 assert.throws(()=>H.parse(['--mode=campaign','--sample-budget=1000']),/budget/);
 assert.throws(()=>H.parse(['--mode=campaign','--profiles=smart-fake']),/profiles/);
 assert.throws(()=>H.parse(['--mode=surprise']),/Unknown/);
 assert.equal(H.parse(['--mode=campaign','--sample-budget=2','--seeds=9701,9702']).sampleBudget,2);
});
test('Adaptive prioritizer is deterministic and does not infer guaranteed loot',()=>{
 const jobs=[{seed:9701,profile:'smart-blood-pure'},{seed:9701,profile:'smart-fury-daggers'}];
 const first=H.chooseAdaptiveJob(jobs,[]);
 assert.deepEqual(H.chooseAdaptiveJob(jobs,[]),first);
 assert(jobs.some(x=>x.profile===first.profile&&x.seed===first.seed));
 const done=[{profile:first.profile,observedAxes:['actualWeapon=Sword']}];
 const other=H.chooseAdaptiveJob(jobs.filter(x=>x.profile!==first.profile),done);
 assert.notEqual(other.profile,first.profile);
 assert(other.reason.newProfile);
});
test('Native runner evidence guards reject synthetic or inconsistent accounts',()=>{
 assert.throws(()=>H.verifyAccount({seed:1,profile:'smart-blood-pure',
  startXp:100,initialGear:{total:1,starter:1},attempts:[]},'smart-blood-pure',1),
 /provenance/);
 assert.throws(()=>H.verifyAccount({seed:1,profile:'smart-blood-pure',startXp:0,
  initialGear:{total:1,starter:1},attempts:[{error:'forced loot'}]},
 'smart-blood-pure',1),/produced an error/);
});
