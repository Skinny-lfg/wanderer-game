'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const C=require('../scripts/v013-stage631-smooth-curve.cjs');
const D=require('../scripts/v013-stage628-postcap-difficulty.cjs');
const N=require('../scripts/v013-natural-progression.cjs');
const S=require('../scripts/simulate-progression.cjs');
const P=globalThis.WandererExpeditionProgression;
const T=globalThis.WandererAutomaticTalents;
const create=require('./v012-economy-harness.cjs');
const digest=x=>crypto.createHash('sha256').update(x).digest('hex').slice(0,12);
test('Stage6.31: one continuously compounded native reference, no E5/E35/E36/gear-tier changes',()=>{
 const g=P.ENEMY_EXPONENTIAL_GROWTH;
 assert.deepEqual(g,{initialReference:.775,lateLogGrowth:.009901141066605541,
  earlyLogGrowthBoost:1.9367547131703917,relaxationExpeditions:2.0572942012233146});
 assert.equal(P.enemyReference(1),g.initialReference);
 assert(P.enemyReference(5)<C.oldValue(5));
 assert(Math.abs(P.enemyReference(2)-C.oldValue(2))<.001);
 assert(Math.abs(P.enemyReference(3)-C.oldValue(3))<.001);
 assert(P.enemyReference(200)>20);
 for(let E=1;E<=1000;E++){
  const value=P.enemyReference(E);
  assert(Number.isFinite(value)&&value>0,'nonfinite E'+E);
  if(E>1)assert(value>P.enemyReference(E-1),'nonmonotone E'+E);
 }
 const rate=x=>g.lateLogGrowth+
  (g.earlyLogGrowthBoost/g.relaxationExpeditions)*Math.exp(-x/g.relaxationExpeditions);
 for(let E=1;E<=200;E++){
  const x=E-1;
  const expected=g.initialReference*Math.exp(g.lateLogGrowth*x+
   g.earlyLogGrowthBoost*(-Math.expm1(-x/g.relaxationExpeditions)));
  assert(Math.abs(P.enemyReference(E)/expected-1)<1e-12,'hidden level step E'+E);
  if(E>=2){
   const growth=P.enemyReference(E)/P.enemyReference(E-1);
   const previous=P.enemyReference(E-1)/P.enemyReference(Math.max(1,E-2));
   assert(growth>1);
   if(E>2)assert(growth<=previous+1e-12,'unexpected manual percentage ramp E'+E);
  }
 }
 for(const E of [2,3,5,6,14,15,16,34,35,36,69,70,71,100,150,199,200]){
  const before=rate(E-1-1e-8),after=rate(E-1+1e-8);
  assert(Math.abs(before-after)<1e-7,'rate discontinuity E'+E);
 }
 assert.throws(()=>P.enemyReference(1000000),/finite range/);
});
test('Stage6.31: all 34 real strategies and six Realms; valid target win rates',()=>{
 assert.equal(C.ALL.length,34);
 assert.equal(new Set(C.ALL).size,34);
 assert.deepEqual([...C.REALMS].sort(),
  ['aegis','blood','decay','fury','arcane','radiance'].sort());
 assert.deepEqual(C.TARGETS,{normal:[80,90],elite:[60,70],boss:[35,45]});
 assert.equal(C.DEEP.length,12);
 assert(C.ALL.every(id=>N.PROFILES[id]));
 assert.equal(C.validate().length,16);
 for(const [k,v] of Object.entries(C.BATCHES)){
  assert(v.length);
  assert.equal(C.config(['--mode=pilot','--batch='+k,
   '--out=reports/v013-stage631-pilot-'+k+'-9861.json']).batch,k);
 }
 assert.throws(()=>C.config(['--mode=deep','--profile=not-a-real-build']));
 assert.throws(()=>C.config(['--out=../../secret.json']));
 assert.throws(()=>C.aggregate([]),/Missing/);
});
test('Stage6.31: Preview matches native code and hash, E1–E5 equipment budget independent of enemy curve',()=>{
 const native=fs.readFileSync('combat/expedition-progression.js','utf8');
 assert.equal(fs.readFileSync('docs/combat/expedition-progression.js','utf8'),native);
 assert(fs.readFileSync('docs/index.html','utf8')
  .includes('combat/expedition-progression.js?v='+digest(native)));
 const source=fs.readFileSync('economy/v012-equipment-runtime.js','utf8');
 assert(source.includes('progressTier=baseTier<=5?baseTier:'));
 assert.equal(fs.readFileSync('docs/economy/v012-equipment-runtime.js','utf8'),source);
 const a=create(63112,undefined,{}, {skipPersistence:true});
 const previous=[];
 for(let E=1;E<=5;E++){
  const r=a.makeItem(E,'weapon',null,'loot','Sword','Rare');
  assert(Number.isFinite(r.v013Budget)&&r.v013Budget>=1);
  previous.push(r.v013Budget);
 }
 for(let i=1;i<previous.length;i++)assert(previous[i]>previous[i-1]);
});
function fixture(E){
 const a=create(63114,undefined,{}, {skipPersistence:true,now:1720000063114});
 const state=a.state(),talent=T.create();
 return {level:E,seed:63114,profile:'Labeled unit test fixture',xp:0,talentEarned:0,
  attributeEarned:0,attributeSpent:0,attributes:T.attributes(talent),
  state:{level:E,unlocked:E,equip:JSON.parse(JSON.stringify(state.equip)),
   automaticTalents:talent,runes:[],runeSlots:[]}};
}
function fight(E,prior=false){
 const snap=fixture(E),opts=D.fixtures(snap);
 if(prior)opts.stage624cProgressionSource=C.PREVIOUS;
 return S.encounter(E,D.build(snap),63195,'normal',opts,undefined,undefined,'blood',1,1);
}
test('Stage6.31 native E2 E3 power stays near baseline and E5 eases with same player',()=>{
 for(const E of [2,3,5]){
  const old=fight(E,true),now=fight(E,false);
  for(const k of ['hpStart','hpMax','talentXp','pointsBudget',
   'gearFingerprint','resolvedSeed','affinity','initialEnemies'])
   assert.deepEqual(now[k],old[k],'Native identity drift '+k+' E'+E);
  assert(now.roster[0].maxHp<=old.roster[0].maxHp,'enemy HP should not rise E'+E);
  assert(now.roster[0].attack<=old.roster[0].attack,'enemy attack should not rise E'+E);
  if(E===5)assert(now.roster[0].maxHp<old.roster[0].maxHp||
   now.roster[0].attack<old.roster[0].attack,'E5 enemy was not eased');
 }
});
test('Stage6.31 optional E2/E3 checkpoints truly require first reached native Camp, no synthetic level',()=>{
 for(const E of [2,3]){
  assert.equal(D.checkpoint({level:E,attempt:2},[2,3]),null);
  assert.equal(D.checkpoint({level:E,attempt:1},[]),null);
 }
 const errors={coverage:{errors:1},accounts:[{profile:'cautious',seed:9861,
  attempts:[{level:3,attempt:1,error:'Native combat timeout'}]}]};
 assert.deepEqual(C.classify(errors,'cautious',9861),
  [{level:3,attempt:1,error:'Native combat timeout'}]);
 const bad={...errors,accounts:[{...errors.accounts[0],attempts:[{
  level:3,attempt:1,error:'Unrecognized game exception'}]}]};
 assert.throws(()=>C.classify(bad,'cautious',9861),/Unexpected native failure/);
});
