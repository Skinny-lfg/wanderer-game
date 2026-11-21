'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const N=require('../scripts/v013-natural-progression.cjs');
const B=require('../scripts/v013-stage69-earned-paired.cjs');
const create=require('./v012-economy-harness.cjs');
const C=require('../scripts/v013-build-planner.cjs');
test('Five talent-only variants preserve a genuine shared earned-source policy',()=>{
 assert.equal(B.SOURCE,'smart-blood-fury-vitality');
 assert.deepEqual(Object.keys(B.VARIANTS),['baseline','blood-pure','blood-fury',
  'triple-no-mixed','vitality-pure']);
 for(const plan of Object.values(B.VARIANTS))if(plan)assert(C.BUILDS[plan]);
});
test('E5, E8 and E10 only and no synthetic item/XP fixture options',()=>{
 assert.equal(B.parse(['--seed=9702','--level=8']).level,8);
 assert.throws(()=>B.parse(['--level=4']),/Only E5/);
 assert.throws(()=>B.parse(['--seed=0']),/Invalid native seed/);
 assert.throws(()=>B.parse(['--points=100']),/Unknown CLI/);
});
test('A real Camp reset buys only legal graph nodes with earned budget',()=>{
 const a=create(9711,undefined,{}, {skipPersistence:true,now:1720000009711});
 const state=a.state(),starter=JSON.stringify(state.equip),gold=state.gold;
 state.automaticTalents=a.talents.award(state.automaticTalents,3200); // UNIT FIXTURE ONLY
 const result=B.nativeRespec(a,'blood-fury',[]);
 assert.equal(result.earned,32);
 assert.equal(a.state().automaticTalents.xp,3200);
 assert(a.talents.valid(state.automaticTalents));
 assert(state.automaticTalents.nodes.includes('affinity_blood'));
 assert(state.automaticTalents.nodes.includes('affinity_fury'));
 assert.deepEqual(JSON.stringify(state.equip),starter);
 assert.equal(state.gold,gold);
});
test('An unearned third Affinity cannot be granted by a diagnostic onCamp splice',()=>{
 const cfg=N.parseArgs(['--seeds=9407','--profiles=smart-blood-fury-vitality',
  '--max-level=1','--max-attempts=1']);
 const a=N.simulateAccount(9407,'smart-blood-fury-vitality',cfg,{
  probeLevel:1,onCamp:({a})=>{
   assert.equal(a.talents.earned(a.state().automaticTalents),0);
   assert.equal(a.talentActions.allocate('affinity_vitality'),false);
   return {safety:'no-free-points'};
  }
 });
 assert.equal(a.attempts.length,1);
 assert.notEqual(a.attempts[0].status,'error');
 assert.equal(a.attempts[0].earnedProbe.safety,'no-free-points');
 assert.equal(a.attempts[0].before.earned,0);
 assert.equal(a.attempts[0].before.spent,0);
});
test('Earned Camp callback rejects attempts to mutate resources or grant gold',()=>{
 const cfg=N.parseArgs(['--seeds=9408','--profiles=smart-blood-fury-vitality',
  '--max-level=1','--max-attempts=1']);
 const a=N.simulateAccount(9408,'smart-blood-fury-vitality',cfg,{
  probeLevel:1,onCamp:({a})=>{a.state().gold++;return {attempted:'free-gold'};}
 });
 assert.equal(a.attempts[0].status,'error');
 assert.match(a.attempts[0].error,/Earned checkpoint test changed equipment, resources, XP, unlocks/);
});
test('No fake equipment, XP or Boss outcomes inside the isolated earned-account tester',()=>{
 const source=fs.readFileSync('scripts/v013-stage69-earned-paired.cjs','utf8');
 for(const s of ['a.setup(','.setUnlocked(','.encounter(','.makeItem(','.award(','.hp=0'])
  assert(!source.includes(s),s);
});
