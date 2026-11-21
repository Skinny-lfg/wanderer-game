'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const R=require('../scripts/v013-stage614-rerun-three.cjs');
const M=require('../scripts/v013-stage614-single-node-ablation.cjs');
const T=globalThis.WandererAutomaticTalents;

test('Exactly the three confirmed Stage 6.14 source cases are recovered with unchanged legal native nodes',()=>{
 const originals=R.oldCases();
 assert.deepEqual(originals.map(x=>x.key),['unbreakable','arcane-focus','brace-rank2']);
 assert.deepEqual(originals.map(x=>x.caseId),['ablation-016','ablation-012','ablation-011']);
 for(const o of originals){
  const x=o.source;
  assert.equal(x.beforeHash,o.beforeHash);
  assert.equal(x.afterHash,o.afterHash);
  assert.equal(x.sourceArchetype,o.sourceArchetype);
  assert.equal(x.budget,o.budget);
  assert.equal(x.target,o.target);
  assert.equal(x.rank,o.rank);
  assert(T.valid(x.before)&&T.valid(x.after));
  assert(M.verifyAblation(x.before,x.after,o.target));
  assert.equal(x.after.nodes.length,x.before.nodes.length+1);
  assert.equal(T.earned(x.before),T.earned(x.after));
  assert.deepEqual(x.before.element||'arcane',x.after.element||'arcane');
  assert.equal(x.before.prepared||null,x.after.prepared||null);
 }
});
test('All three native enemy variations preserve source build and equipment, plus original matchup',()=>{
 const p=R.plan({...R.DEFAULTS,seedsPerOpponent:32});
 assert.equal(p.sourceCases.length,3);
 assert.equal(p.opponentStrata,9);
 assert.equal(p.rows.length,288);
 assert.equal(p.nativeFights,576);
 assert.equal(p.uniqueSeeds,288);
 assert.equal(new Set(p.rows.map(x=>x.seed)).size,288);
 assert.equal(new Set(p.rows.map(x=>x.id)).size,288);
 assert(p.rows.every(x=>x.seed>7000000));
 for(const original of R.oldCases()){
  const rows=p.rows.filter(x=>x.key===original.key);
  assert.equal(rows.length,96);
  const groups=[...new Set(rows.map(x=>x.variant))];
  assert.equal(groups.length,3);
  assert(rows.some(x=>x.encounter===original.original.encounter&&
   x.affinity===original.original.affinity));
  for(const variant of original.opponents)
   assert.equal(rows.filter(x=>x.variant===variant.key).length,32);
  for(const x of rows){
   assert.equal(x.sourceBeforeHash,original.beforeHash);
   assert.equal(x.sourceAfterHash,original.afterHash);
   assert.equal(x.weapon,original.weapon);
   assert.equal(x.armor,original.armor);
   assert.equal(x.offhand,original.offhand);
   assert.equal(x.level,original.source.level);
   assert.equal(x.before,original.source.before);
   assert.equal(x.after,original.source.after);
  }
 }
});
test('The exact pilot is a subset of the final 32-seed fixed study, not additional evidence',()=>{
 const small=R.plan({...R.DEFAULTS,seedsPerOpponent:4});
 const large=R.plan({...R.DEFAULTS,seedsPerOpponent:32});
 assert.equal(small.rows.length,36);
 assert.equal(small.nativeFights,72);
 for(const row of small.rows){
  const other=large.rows.find(x=>x.id===row.id);
  assert(other);
  assert.equal(row.seed,other.seed);
  assert.equal(row.affinity,other.affinity);
  assert.equal(row.encounter,other.encounter);
 }
 assert.deepEqual(small.rows.map(x=>x.id+'|'+x.seed),
  R.plan({...R.DEFAULTS,seedsPerOpponent:4}).rows.map(x=>x.id+'|'+x.seed));
});
test('Three skills cannot be silently changed to a different source build/node/gear',()=>{
 const originals=R.oldCases();
 for(const o of originals){
  const c=o.source;
  assert.equal(c.before.nodes.length+1,c.after.nodes.length);
  assert.notEqual(o.beforeHash,o.afterHash);
  assert(c.target===o.target);
 }
 assert.throws(()=>R.plan({...R.DEFAULTS,seedsPerOpponent:0}),/Invalid independent/);
 assert.throws(()=>R.plan({...R.DEFAULTS,seedsPerOpponent:65}),/Invalid independent/);
 assert.throws(()=>R.plan({...R.DEFAULTS,seedStart:615000}),/Invalid independent/);
});
test('One actual native new-seed replay checks the exact non-talent gear/enemy/seed identity',()=>{
 const row=R.plan({...R.DEFAULTS,seedsPerOpponent:1}).rows[0];
 const result=R.verifiedPair(row);
 assert.equal(result.sourceCaseId,'ablation-016');
 assert.equal(result.targetKey,'unbreakable');
 assert.equal(result.opponentVariant,'original');
 assert.equal(result.before.spent+1,result.after.spent);
 assert.equal(result.sameNonTalentSetup,true);
 assert.equal(Object.keys(result.checks).length,14);
 assert(Object.values(result.checks).every(Boolean));
 assert.equal(result.before.native.gearFingerprint,result.after.native.gearFingerprint);
 assert.deepEqual(result.before.native.roster,result.after.native.roster);
 assert.equal(result.before.native.resolvedSeed,result.after.native.resolvedSeed);
 const summary=R.summary([result]);
 assert.equal(summary.nativePairs,1);
 assert.equal(summary.nativeFights,2);
 assert.equal(summary.matched,1);
 assert.equal(summary.opponentStrata,1);
});
test('Strict resume fails closed on swapped seeds, altered source and unverified outcomes',()=>{
 const row=R.plan({...R.DEFAULTS,seedsPerOpponent:1}).rows[0];
 const x=R.verifiedPair(row);
 const input={stage:'6.14-rerun-three',
  kind:'independent-seed-native-skill-ablation-retest',
  configHash:'expected',plannedIds:[x.id]};
 const previous={...input,completed:1,results:[x]};
 assert.doesNotThrow(()=>R.verifyResume(previous,input));
 assert.throws(()=>R.verifyResume(previous,{...input,configHash:'other'}),/Cannot resume/);
 assert.throws(()=>R.verifyResume({...previous,results:[{...x,id:'bad'}]},input),/Corrupted/);
 assert.throws(()=>R.verifyResume({...previous,results:[{...x,checks:{
  ...x.checks,sameSeed:false}}]},input),/Corrupted/);
});
test('CLI bounds prevent unapproved large cohorts or unsupported changes',()=>{
 assert.throws(()=>R.parse(['--seeds-per-opponent=80']),/Invalid seeds/);
 assert.throws(()=>R.parse(['--mode=balance']),/Unknown/);
 assert.throws(()=>R.parse(['--seed-start=12']),/Invalid seed/);
 assert.throws(()=>R.parse(['--out=bad.txt']),/Unknown/);
 const opts=R.parse(['--mode=matrix','--seeds-per-opponent=32',
  '--seed-start=7150011','--rarity=Rare']);
 assert.equal(opts.seedsPerOpponent,32);
 assert.equal(opts.mode,'matrix');
});
