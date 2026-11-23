'use strict';
// Continuous enemyReference retained; obsolete layered room relief is gone.
const {test}=require('node:test'),assert=require('node:assert/strict');
require('../combat/expedition-progression.js');require('../combat/v012-combat-core.js');
const P=globalThis.WandererExpeditionProgression,C=globalThis.WandererV012CombatCore;
const enemy=(role)=>({role,hp:200,maxhp:200,atk:40,def:20,baseDef:20,attackEvery:2});
test('The Expedition reference is monotonic without E-specific cliffs',()=>{
 assert.equal(P.enemyReference(1),.775);
 const c=P.ENEMY_EXPONENTIAL_GROWTH;
 assert(c.earlyLogGrowth>c.middleLogGrowth&&c.middleLogGrowth>c.lateLogGrowth);
 let previous=Infinity;
 for(let E=1;E<=1000;E++){
  const growth=Math.log(P.enemyReference(E+1)/P.enemyReference(E));
  assert(growth>0&&growth<=previous+1e-12);previous=growth;
 }
});
test('Normal Minions are their own fragile role across E1 to E70',()=>{
 for(const E of [1,2,5,10,70])for(const n of [2,4,5,8,12]){
  const group=[enemy('tank'),...Array.from({length:n-1},()=>enemy('minion'))];
  C.applyNormalRoomBudget(group,E);
  for(const m of group.slice(1)){
   assert(m.hp===m.maxhp&&m.maxhp<200&&m.def<20);
   assert(m.normalRoomBudgetApplied);
  }
  assert(group[0].normalRoomBudgetApplied);
 }
});
test('No normal budget on Bosses or Elites and cannot apply twice',()=>{
 for(const type of ['boss','miniboss']){
  const g=[enemy('tank'),enemy('minion')];g[0][type]=true;
  const before=JSON.stringify(g);assert.equal(C.applyNormalRoomBudget(g,10).affected,0);
  assert.equal(JSON.stringify(g),before);
 }
 const g=[enemy('tank'),enemy('minion')];C.applyNormalRoomBudget(g,1);
 assert.throws(()=>C.applyNormalRoomBudget(g,1),/twice/);
});
