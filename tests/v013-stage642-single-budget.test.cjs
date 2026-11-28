'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
require('../combat/expedition-progression.js');require('../combat/v012-combat-core.js');
const C=globalThis.WandererV012CombatCore,P=globalThis.WandererExpeditionProgression;
const make=(role)=>({role,atk:40,def:20,baseDef:20,hp:200,maxhp:200,attackEvery:1.72});
const room=(p,m)=>[...Array.from({length:p},()=>make('tank')),...Array.from({length:m},()=>make('minion'))];
test('Single-budget policy: historical stacked functions are gone',()=>{
 for(const name of ['applySoloNormalReinforcement','applyMinionEscortRelief','applyNormalRoomMinionProfile','firstExpeditionLeader'])
  assert.equal(C[name]??P[name],undefined);
 assert.equal(typeof C.applyNormalRoomBudget,'function');
 assert.equal(typeof P.leaderIdentityBudget,'function');
});
test('Solo and Minion roles are handled inside exactly one native normal budget',()=>{
 const e=make('tank');const out=C.applyNormalRoomBudget([e],1);
 assert.equal(out.affected,1);assert.equal(e.hp,e.maxhp);
 // B8.5C: the approved E1 solo Tank budget is applied before rounding.
 assert.equal(e.maxhp,205);assert.equal(e.atk,39);
 assert.throws(()=>C.applyNormalRoomBudget([e],1),/twice/);
 const many=room(3,9),v=C.applyNormalRoomBudget(many,10);
 assert.equal(v.affected,12);assert.equal(v.minions,9);
 assert(v.escort.hp>.6);
 assert(many.every(x=>x.normalRoomBudgetApplied&&x.hp===x.maxhp));
 assert(many.slice(3).every(x=>x.def<20&&x.maxhp<200));
 assert.throws(()=>C.applyNormalRoomBudget(many,10),/twice/);
});
test('Normal budget is never applied to native Bosses or Elites',()=>{
 for(const role of ['boss','miniboss']){
  const a=[make('tank'),make('minion')];a[0][role]=true;
  const before=JSON.stringify(a);assert.equal(C.applyNormalRoomBudget(a,10).affected,0);
  assert.equal(JSON.stringify(a),before);
 }
});
test('No E1→E2 stat discontinuity: budget continuously converges to E10+',()=>{
 const E=[1,2,3,5,8,10,20,70],f=E.map(level=>C.applyNormalRoomBudget(room(3,9),level));
 for(let i=1;i<f.length;i++){
  assert(f[i].opening<f[i-1].opening);
  for(const k of ['hp','atk','def'])
   assert(f[i].escort[k]>=f[i-1].escort[k]-1e-12);
 }
 assert(f.at(-1).escort.hp>=.63);
 for(const [id,mature] of Object.entries(P.BOSS_BASE)){
  assert.deepEqual(P.leaderIdentityBudget(mature,1,id,null),P.OPENING_BOSS_BASE[id]);
  assert.strictEqual(P.leaderIdentityBudget(mature,10,id,null),mature);
  for(let i=2;i<10;i++){
   const a=P.leaderIdentityBudget(mature,i,id,null),b=P.leaderIdentityBudget(mature,i+1,id,null);
   for(const k of ['hp','atk','def','interval'])
    assert(Math.abs(b[k]-a[k])<=Math.abs(mature[k]-P.OPENING_BOSS_BASE[id][k])*.20+1e-10);
  }
 }
});
