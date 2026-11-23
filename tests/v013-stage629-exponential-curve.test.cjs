'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const M=require('../scripts/v013-stage629-exponential-curve.cjs');
const P=globalThis.WandererExpeditionProgression;
const T=globalThis.WandererAutomaticTalents;
const create=require('./v012-economy-harness.cjs');
test('One authoritative exponential reference: smooth E1–E5 arc with E5 anchored and no E6 discontinuity',()=>{
 const g=P.ENEMY_EXPONENTIAL_GROWTH;
 assert.deepEqual(g,{rate:.015,weight:2,earlyRate:.12,shoulderLevels:.4});
 for(let E=1;E<5;E++)assert(P.enemyReference(E)>0&&P.enemyReference(E)<E,
  'Early exponential must ease E'+E);
 assert.equal(P.enemyReference(5),5);
 for(let E=1;E<=1000;E++){
  const x=P.enemyReference(E);
  assert(Number.isFinite(x)&&x>0);
  if(E>1)assert(x>P.enemyReference(E-1),'must increase at E'+E);
  if(E>=5&&E<200){
   const n=P.enemyReference(E+1);
   assert(n/x<(E<10?1.25:1.05),'unexpected enemy stat jump E'+E);
  }
 }
 const old=M.oldReference;
 const derivLeft=5*g.earlyRate*Math.exp(5*g.earlyRate)/Math.expm1(5*g.earlyRate);
 const derivRight=1/5+(derivLeft-1/5);
 assert(Math.abs(derivLeft-derivRight)<1e-12,'the two continuous E5 tangents must agree');
 for(const E of [1,2,3,4,5,6,20,35,55,70,100,150,200]){
  const ratio=P.enemyReference(E)/old(E);
  if(E<5)assert(ratio<1,'easier E'+E);
  if(E===5)assert.equal(ratio,1);
  if(E>5)assert(ratio>=1,'the exponential E5 bridge remains monotone E'+E);
 }
 assert(P.enemyReference(200)>old(200)*4);
 assert(P.enemyReference(200)<old(200)*5);
 assert(Math.abs(P.enemyReference(1)-.775)<.02);
 assert(Math.abs(P.enemyReference(2)-1.650)<.02);
 assert(Math.abs(P.enemyReference(70)-9.443)<.025);
 assert(Math.abs(P.enemyReference(100)-11.913)<.025);
 assert(Math.abs(P.enemyReference(200)-38.559)<.025);
 assert.throws(()=>P.enemyReference(1000000),/finite range/);
});
test('Eight individual Elites, six individual Bosses, all normal roles retain their own identity multipliers',()=>{
 assert.equal(Object.keys(P.ELITE_GROWTH).length,8);
 assert.equal(Object.keys(P.BOSS_PROTECTION).length,6);
 for(const role of ['minion','tank','skirmisher','caster'])
  assert.deepEqual(P.enemyScaling(200,'normal',role),{hp:1,atk:1,def:1});
 for(const id of Object.keys(P.ELITE_GROWTH)){
  const gain=P.ELITE_GROWTH[id],s=P.enemyScaling(200,'elite',id);
  assert(Math.abs(s.hp-(1+gain.hp))<1e-10);
  assert(Math.abs(s.atk-(1+gain.atk))<1e-10);
 }
 for(const id of Object.keys(P.BOSS_PROTECTION)){
  const s=P.enemyScaling(200,'boss',id),g=P.BOSS_GROWTH[id];
  assert(Math.abs(s.hp-(1+g.hp))<1e-10);
 }
});
function controlledSnap(E=5){
 // Synthetic one-off QA fixture. Never presented as an earned Expedition.
 const a=create(62901,undefined,{}, {skipPersistence:true,now:1720000062901});
 const s=a.state();
 const state={level:E,unlocked:E,equip:JSON.parse(JSON.stringify(s.equip)),
  automaticTalents:T.create(),runes:[],runeSlots:[]};
 return {level:E,seed:62901,profile:'synthetic-QA',state,xp:0,
  talentEarned:0,attributeEarned:0,attributeSpent:0,
  attributes:T.attributes(state.automaticTalents),equippedRarity:{Common:3}};
}
test('E5 old/new native encounter is bitwise-identical when only reference is changed',()=>{
 const snap=controlledSnap(5);
 const result=M.matched(snap,{id:'group-3',type:'normal',size:3,realm:'blood'},629001);
 assert.equal(result.old.win,result.new.win);
 assert.equal(result.old.damageTaken,result.new.damageTaken);
 assert.equal(result.old.enemyHp,result.new.enemyHp);
 assert.equal(result.old.enemyAtk,result.new.enemyAtk);
 assert(Object.values(result.invariants).every(Boolean));
});
test('E200 matched native opponents become stronger against unchanged player, legal combat state preserved',()=>{
 const snap=controlledSnap(200);
 const scenario={id:'gravecaller',type:'elite',realm:'blood'};
 const result=M.matched(snap,scenario,629002);
 assert(result.new.enemyHp>result.old.enemyHp*3);
 assert(result.new.enemyAtk>result.old.enemyAtk*3);
 assert.equal(result.new.hpMax,result.old.hpMax);
 assert.equal(result.old.gear,result.new.gear);
 assert(Object.values(result.invariants).every(Boolean));
});
test('Stage 6.29 strictly rejects fabricated CLI parameters and validates old source identity',()=>{
 const base=M.parse(['--seed=9861','--profile=balanced','--max-level=200']);
 assert.equal(base.maxLevel,200);
 assert.throws(()=>M.parse(['--max-level=201']));
 assert.throws(()=>M.parse(['--profile=invalid']));
 assert.throws(()=>M.parse(['--out=../../unsafe.json']));
 assert(M.LEGACY.includes('Math.log1p'));
 assert(M.INPUT.includes('Math.expm1'));
 assert.notEqual(M.LEGACY,M.INPUT);
});
