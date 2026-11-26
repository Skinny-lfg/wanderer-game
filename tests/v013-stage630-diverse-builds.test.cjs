'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),crypto=require('node:crypto');
const C=require('../scripts/v013-stage630-diverse-builds.cjs');
const D=require('../scripts/v013-stage628-postcap-difficulty.cjs');
const S=require('../scripts/simulate-progression.cjs');
const P=globalThis.WandererExpeditionProgression;
const T=globalThis.WandererAutomaticTalents;
const create=require('./v012-economy-harness.cjs');
const hash=x=>crypto.createHash('sha256').update(x).digest('hex').slice(0,12);
test('Stage6.30: complete 34 native profiles in five independent cohorts, six affinities and three armor families',()=>{
 assert.equal(C.validate(),true);
 assert.equal(C.PROFILES.length,34);
 assert.equal(new Set(C.PROFILES).size,34);
 assert.equal(C.DEEP.length,12);
 const ids=Object.keys(C.BATCHES);
 assert.equal(ids.length,5);
 for(const id of ids){
  const cfg=C.parse(['--mode=pilot','--batch='+id,'--seed=9861',
   '--out=reports/v013-stage630-'+id+'-9861-pilot.json']);
  assert.equal(cfg.batch,id);
 }
 const keys=C.PROFILES.map(x=>require('../scripts/v013-natural-progression.cjs').PROFILES[x]);
 const usedFamilies=new Set(keys.flatMap(x=>x.families));
 for(const x of ['blood','decay','fury','aegis','radiance','arcane'])
  assert(usedFamilies.has(x),'Missing '+x);
 const gear=new Set(keys.map(x=>x.armor));
 assert.deepEqual([...gear].sort(),['Cloth','Leather','Plate']);
 assert(keys.some(x=>x.style==='mixed')&&keys.some(x=>x.style==='focused'));
 for(const key of ['arcane-fire','arcane-frost','arcane-lightning','arcane-arcane',
  'smart-fury-bow','smart-fury-daggers','smart-blood-two-handed',
  'smart-arcane-wand-offense','smart-arcane-wand-defense'])
  assert(C.PROFILES.includes(key));
});
test('Stage6.30 early exponential softens E1–E4, anchors E5, and grows continuously to E200',()=>{
 assert.deepEqual(P.ENEMY_EXPONENTIAL_GROWTH,
  {rate:.015,weight:2,earlyRate:.12,shoulderLevels:.4});
 const x=C.curve();
 for(let E=1;E<=200;E++){
  const v=P.enemyReference(E);
  assert(v>0&&Number.isFinite(v));
  if(E>1)assert(v>P.enemyReference(E-1),'nonmonotone at E'+E);
  if(E<=4)assert(v<E,'early E'+E+' should be easier');
  if(E===5)assert.equal(v,5);
 }
 for(const E of [1,2,3,4])assert(x.find(r=>r.E===E).ratio<1);
 for(const E of [6,20,35,70,100,150,200])assert(x.find(r=>r.E===E).ratio>1);
 const last=P.enemyReference(5);
 assert.equal(last,5);
 assert(P.enemyReference(6)>5&&P.enemyReference(6)<6,
  'E6 should rise without a large one-level jump');
 assert(P.enemyReference(200)>38&&P.enemyReference(200)<40);
 assert.throws(()=>P.enemyReference(1000000),/finite range/);
 assert.notEqual(C.BASELINE,C.SOURCE);
 assert(C.BASELINE.includes('if(level<=5)return level'));
 assert(C.SOURCE.includes('shoulderLevels'));
});
test('Preview mirrors the actual exponential native module and hashed Pages link',()=>{
 const src=fs.readFileSync('combat/expedition-progression.js','utf8');
 assert.equal(fs.readFileSync('docs/combat/expedition-progression.js','utf8'),src);
 assert(fs.readFileSync('docs/index.html','utf8')
  .includes('combat/expedition-progression.js?v='+hash(src)));
});
function fixture(E){
 const a=create(63001,undefined,{}, {skipPersistence:true,now:1720000063001});
 const s=a.state();
 const talent=T.create();
 return {level:E,seed:63001,profile:'QA-synthetic-fixture',
  state:{level:E,unlocked:E,equip:JSON.parse(JSON.stringify(s.equip)),
   automaticTalents:talent,runes:[],runeSlots:[]},
  xp:0,talentEarned:0,attributeEarned:0,attributeSpent:0,attributes:T.attributes(talent)};
}
function fight(E,source){
 const snap=fixture(E),options=D.fixtures(snap);
 if(source)options.stage624cProgressionSource=source;
 return S.encounter(E,D.build(snap),63091,'normal',options,
  undefined,undefined,'blood',1,1);
}
test('Stage6.30 E1 native enemy HP/attack decreases with unchanged player, E5 native fight exactly preserved',()=>{
 const e1Old=fight(1,C.BASELINE),e1New=fight(1,null);
 assert.equal(e1Old.hpStart,e1New.hpStart);
 assert.equal(e1Old.talentXp,e1New.talentXp);
 assert.equal(e1Old.gearFingerprint,e1New.gearFingerprint);
 assert.equal(e1Old.resolvedSeed,e1New.resolvedSeed);
 assert(e1Old.roster[0].maxHp>e1New.roster[0].maxHp||
  e1Old.roster[0].attack>e1New.roster[0].attack,'native enemy stats not softer in E1');
 const e5Old=fight(5,C.BASELINE),e5New=fight(5,null);
 assert.deepEqual(e5Old.roster,e5New.roster);
 assert.equal(e5Old.won,e5New.won);
 assert.equal(e5Old.damageTaken,e5New.damageTaken);
});
test('Stage6.30 API rejects unknown profiles and unsafe output, never synthesizes missing accounts',()=>{
 assert.throws(()=>C.parse(['--mode=pilot','--batch=not-real']));
 assert.throws(()=>C.parse(['--mode=deep','--profile=not-real']));
 assert.throws(()=>C.parse(['--out=../../tmp/secret.json']));
 assert.throws(()=>C.parse(['--max-total-attempts=10000']));
 assert.throws(()=>C.aggregate([]),/Missing/);
});

test('Bounded native unresolved combat is censored, non-timeout engine faults still fail',()=>{
 const v={coverage:{errors:1},accounts:[{attempts:[
  {level:5,attempt:2,error:'Native combat timeout'}]}]};
 assert.deepEqual(C.timeoutClassification(v,9861,'balanced'),
  [{E:5,attempt:2,error:'Native combat timeout'}]);
 assert.throws(()=>C.timeoutClassification({...v,accounts:[{attempts:[
  {level:5,attempt:2,error:'Invariant broken'}]}]},9861,'balanced'),
  /Unexpected native error/);
 assert.throws(()=>C.timeoutClassification({...v,coverage:{errors:2}},9861,'balanced'),
  /Unexpected native error/);
});
