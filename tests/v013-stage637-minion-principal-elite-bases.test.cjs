'use strict';
// Stage 6.42 regression: previous Stage 6.37 escort pass is retired.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
require('../combat/expedition-progression.js');require('../combat/v012-combat-core.js');
const C=globalThis.WandererV012CombatCore,P=globalThis.WandererExpeditionProgression;
const make=(role)=>({role,atk:40,def:20,baseDef:20,hp:200,maxhp:200,attackEvery:1.72});
const group=(p,m)=>[...Array.from({length:p},()=>make('tank')),...Array.from({length:m},()=>make('minion'))];
test('No obsolete escort, Minion or solo passes remain in the production core',()=>{
 assert.equal(C.applyMinionEscortRelief,undefined);
 assert.equal(C.applyNormalRoomMinionProfile,undefined);
 assert.equal(C.applySoloNormalReinforcement,undefined);
 assert.equal(typeof C.applyNormalRoomBudget,'function');
});
test('Mixed-room identities use exactly one stat pass, including reserve Minions',()=>{
 for(const E of [1,2,5,10,70])for(const m of [1,2,5,9,18]){
  const g=group(3,m),state=C.applyNormalRoomBudget(g,E);
  assert.equal(state.minions,m);assert.equal(state.affected,g.length);
  assert(g.every(x=>x.normalRoomBudgetApplied&&x.hp===x.maxhp));
  assert(g.slice(3).every(x=>x.maxhp<200&&x.def<20));
  assert.throws(()=>C.applyNormalRoomBudget(g,E),/twice/);
 }
});
test('Eight Elite identities have complete opening and mature native budgets',()=>{
 const html=fs.readFileSync('index.html','utf8');
 const segment=html.slice(html.indexOf('const ELITE_ARCHETYPES={'),html.indexOf('\n};',html.indexOf('const ELITE_ARCHETYPES={')));
 assert.equal(P.ELITE_IDENTITIES.length,8);
 for(const id of P.ELITE_IDENTITIES){
  assert(segment.includes(id+':{'));
  const opening=P.OPENING_ELITE_BASE[id];assert(opening);
  for(const x of ['hp','atk','def','interval'])assert(Number.isFinite(opening[x])&&opening[x]>0);
  const mature={hp:1.8,atk:1.2,def:1,interval:1.7};
  assert.deepEqual(P.leaderIdentityBudget(mature,1,null,id),opening);
  assert.strictEqual(P.leaderIdentityBudget(mature,10,null,id),mature);
 }
});
