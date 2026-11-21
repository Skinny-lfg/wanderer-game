'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const H=require('../scripts/v013-stage615-enemy-hierarchy.cjs');
const M=require('../scripts/v013-stage612-controlled-combat.cjs');
const T=globalThis.WandererAutomaticTalents;

test('Stage 6.15 plans four budgets, all six Boss affinities and matched normal/elite/boss native combats',()=>{
 const p=H.plan({...H.DEFAULTS,seedsPerCell:8});
 assert.equal(p.triples,384);
 assert.equal(p.actualNativeFights,1152);
 assert.equal(new Set(p.rows.map(x=>x.seed)).size,384);
 assert.equal(new Set(p.rows.map(x=>x.id)).size,384);
 assert.equal(p.distinctArchetypes>=6,true);
 assert.deepEqual(new Set(p.families),new Set(H.FAMILIES));
 assert.deepEqual(p.budgets,[12,24,36,60]);
 for(const f of H.FAMILIES)
  for(const budget of p.budgets){
   const rows=p.rows.filter(r=>r.realm===f&&r.budget===budget);
   assert.equal(rows.length,16);
   assert.equal(rows.filter(r=>r.aligned).length,8);
   assert.equal(rows.filter(r=>!r.aligned).length,8);
   assert(rows.every(x=>T.valid(x.talents)&&T.earned(x.talents)===budget));
  }
});
test('Pilot is exactly first two seeds from the full hierarchy design; not extra data',()=>{
 const p=H.plan({...H.DEFAULTS,seedsPerCell:2});
 const full=H.plan({...H.DEFAULTS,seedsPerCell:8});
 assert.equal(p.triples,96);assert.equal(p.actualNativeFights,288);
 for(const x of p.rows){
  const y=full.rows.find(r=>r.id===x.id);
  assert(y);
  assert.equal(x.seed,y.seed);
  assert.deepEqual(x.gear,y.gear);
  assert.deepEqual(x.talents,y.talents);
  assert.equal(x.realm,y.realm);
 }
});
test('Only enemy class changes inside matched triple: gear and Talent allocation are untouched',()=>{
 const p=H.plan({...H.DEFAULTS,seedsPerCell:1});
 const row=p.rows[0];
 const a=H.nativeOptions(row,'normal',H.DEFAULTS);
 const b=H.nativeOptions(row,'elite',H.DEFAULTS);
 const c=H.nativeOptions(row,'boss',H.DEFAULTS);
 const cleanup=o=>Object.fromEntries(Object.entries(o).filter(([k])=>k!=='mode'));
 assert.deepEqual(cleanup(a),cleanup(b));
 assert.deepEqual(cleanup(b),cleanup(c));
 assert.equal(a.targetPolicy,'focus');
 assert.equal(b.lockScenarioStreams,true);
 assert.equal(c.controlledTalents,row.talents);
 assert.deepEqual(H.KINDS,['normal','elite','boss']);
});
test('One actual native normal→elite→boss triple verifies the SAME native rolled gear and player snapshot',()=>{
 const row=H.plan({...H.DEFAULTS,seedsPerCell:1,budgets:[24]}).rows[0];
 const r=H.triple(row,H.DEFAULTS);
 assert.equal(r.lockedPlayerAndRealm,true);
 assert.equal(Object.keys(r.checks).length,12);
 assert(Object.values(r.checks).every(Boolean));
 assert.deepEqual(H.KINDS.map(k=>r.arms[k].native.nativeEncounter),H.KINDS);
 const games=H.KINDS.map(k=>r.arms[k].native);
 assert.equal(new Set(games.map(x=>x.gearFingerprint)).size,1);
 assert.equal(new Set(games.map(x=>x.resolvedSeed)).size,1);
 assert.equal(new Set(games.map(x=>x.plannedConditionId)).size,1);
 assert.equal(new Set(games.map(x=>x.hpMax)).size,1);
 assert(games.every(x=>x.risk===1));
 assert(games.every(x=>x.pointsBudget===24));
 assert.equal(r.gap.eliteBeatsBoss,r.arms.elite.won&&!r.arms.boss.won);
 const s=H.summary([r]);
 assert.equal(s.triples,1);
 assert.equal(s.nativeFights,3);
 assert.equal(s.matchingPlayerEquipment,1);
 assert.equal(s.byClass.triples,1);
});
test('Cross-kind matching rejects player equipment, talent, seed, Realm and starting HP drift',()=>{
 const row=H.plan({...H.DEFAULTS,seedsPerCell:1,budgets:[24]}).rows[0];
 const r=H.triple(row,H.DEFAULTS);
 const changed=(kind,field,value)=>({...r.arms,[kind]:{
  ...r.arms[kind],native:{...r.arms[kind].native,[field]:value}}});
 assert.throws(()=>H.verifyMatched(row,changed('boss','gearFingerprint','BAD')),/completePlayerGear/);
 assert.throws(()=>H.verifyMatched(row,changed('elite','resolvedSeed',42)),/sameSeedAndResolvedRealm/);
 assert.throws(()=>H.verifyMatched(row,changed('boss','controlledTalentNodes',[])),/sameExactTalentNodes/);
 assert.throws(()=>H.verifyMatched(row,changed('elite','affinity','bad')),/sameFamilyRiskLevel/);
 assert.throws(()=>H.verifyMatched(row,changed('normal','hpMax',1234567)),/samePlayerProtection/);
});
test('Win gap summaries are paired native outcomes, not unpaired comparisons',()=>{
 const row=H.plan({...H.DEFAULTS,seedsPerCell:1,budgets:[24]}).rows[0];
 const r=H.triple(row,H.DEFAULTS);
 const all=H.group([r]);
 assert.equal(all.eliteWinsBossLoses,Number(r.arms.elite.won&&!r.arms.boss.won));
 assert.equal(all.eliteLosesBossWins,Number(!r.arms.elite.won&&r.arms.boss.won));
 assert.equal(all.normalWinsEliteLoses,Number(r.arms.normal.won&&!r.arms.elite.won));
 assert.equal(all.eliteMinusBossWinPP,100*(Number(r.arms.elite.won)-Number(r.arms.boss.won)));
 assert(Number.isFinite(all.medianBossToEliteEnemyHpRatio));
 assert(Number.isFinite(all.medianBossToEliteEnemyAttackRatio));
});
test('Source-locked hierarchy evidence refuses tampered resume data',()=>{
 const row=H.plan({...H.DEFAULTS,seedsPerCell:1,budgets:[24]}).rows[0];
 const r=H.triple(row,H.DEFAULTS);
 const input={stage:'6.15',configHash:'abc',plannedIds:[r.id]};
 const old={...input,completed:1,results:[r]};
 assert.doesNotThrow(()=>H.checkpointGuard(old,input));
 assert.throws(()=>H.checkpointGuard(old,{...input,configHash:'xyz'}),/Unsafe/);
 assert.throws(()=>H.checkpointGuard({...old,results:[{...r,id:'bad'}]},input),/Corrupt/);
 assert.throws(()=>H.checkpointGuard({...old,results:[{...r,checks:{
  ...r.checks,completePlayerGear:false}}]},input),/Corrupt/);
});
test('Bounded CLI fails closed for invalid seed ranges, risk and controlled budgets',()=>{
 assert.throws(()=>H.parse(['--seeds-per-cell=99']),/Invalid/);
 assert.throws(()=>H.parse(['--risk=3']),/Invalid/);
 assert.throws(()=>H.parse(['--budgets=200']),/Invalid/);
 assert.throws(()=>H.parse(['--seed-start=8']),/Invalid/);
 assert.throws(()=>H.parse(['--mode=balance']),/Unsupported/);
 assert.throws(()=>H.parse(['--out=no.txt']),/Unsupported/);
 const x=H.parse(['--mode=matrix','--seeds-per-cell=8','--risk=1']);
 assert.equal(x.mode,'matrix');assert.equal(x.seedsPerCell,8);
});
