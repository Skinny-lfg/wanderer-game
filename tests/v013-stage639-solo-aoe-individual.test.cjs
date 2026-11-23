'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
require('../combat/expedition-progression.js');
require('../combat/v012-combat-core.js');
const P=globalThis.WandererExpeditionProgression,C=globalThis.WandererV012CombatCore;
const S=require('../scripts/simulate-progression.cjs');
const A=require('../scripts/v013-stage639-aoe-diagnostic.cjs');
function make(role='tank'){return {role,maxhp:100,hp:100,atk:30,def:10,baseDef:10,attackEvery:1.6};}
test('Stage 6.42: one budget handles solo regulars and never Bosses or Elites',()=>{
 for(const role of ['tank','skirmisher','caster']){
  const e=make(role),r=C.applyNormalRoomBudget([e],1),opening=C.NORMAL_ROOM_BUDGET.solo[role];
  assert.equal(r.affected,1);assert.equal(e.maxhp,Math.round(100*opening.hp));
  assert.equal(e.atk,Math.round(30*opening.atk));assert.equal(e.hp,e.maxhp);
  assert.throws(()=>C.applyNormalRoomBudget([e],1),/twice/);
 }
 for(const type of ['boss','miniboss']){
  const e=make('tank');e[type]=true;
  const before=JSON.stringify(e);assert.equal(C.applyNormalRoomBudget([e],1).affected,0);
  assert.equal(JSON.stringify(e),before);
 }
});
test('Six direct mature Boss budgets smoothly interpolate E1 to E10',()=>{
 assert.equal(Object.keys(P.BOSS_BASE).length,6);
 for(const [id,b] of Object.entries(P.BOSS_BASE)){
  const opening=P.OPENING_BOSS_BASE[id];assert(opening);
  assert.equal(P.leaderIdentityBudget(b,1,id,null).hp,opening.hp);
  assert.strictEqual(P.leaderIdentityBudget(b,10,id,null),b);
  for(let E=2;E<=9;E++){
   const v=P.leaderIdentityBudget(b,E,id,null);
   for(const stat of ['hp','atk','def','interval'])
    assert(v[stat]>=Math.min(opening[stat],b[stat])-1e-10&&v[stat]<=Math.max(opening[stat],b[stat])+1e-10);
  }
  assert.deepEqual(P.enemyScaling(10,'boss',id),{hp:1,atk:1,def:1});
 }
});
function native(E,n,type='normal'){
 const settings={...S.DEFAULTS,points:0,gear:'current',runes:false};
 const {a,c,card}=S.prepare(E,S.BUILDS[1],639037+E*47+n*31,settings,0);
 const room=card.edges.filter(([from])=>from===0).map(([,to])=>to)
  .find(id=>card.nodes[id]?.kind==='combat');
 assert.notEqual(room,undefined);assert(c.visitRoom(room));assert(a.enter());
 const r=a.encounter({count:n,boss:type==='boss',elite:type==='elite'});
 const actors=[...(r.enemies?.length?r.enemies:[r.enemy]),...(r.groupReserve||[])];
 return {r,actors};
}
test('Native E1/E2/E10 normals have one budget; leaders have none',()=>{
 for(const E of [1,2,10])for(const size of [1,2,4,8]){
  const group=native(E,size);assert.equal(group.actors.length,size);
  assert(group.actors.every(x=>x.normalRoomBudgetApplied));
 }
 for(const type of ['boss','elite'])for(const E of [1,10]){
  const x=native(E,1,type);assert(x.actors.every(a=>!a.normalRoomBudgetApplied));
 }
});
test('Stage6.39: complete real 100 profiles x 5 seeds and AoE observational caveats',()=>{
 const B=require('../scripts/v013-stage632-player-power.cjs');
 assert.equal(B.IDS.length,100);assert.equal(B.SEEDS.length,5);
 assert.equal(A.BOSSES.length,6);assert.equal(A.ELITES.length,8);
 assert.equal(A.options(['--batch=19','--seed=9869','--out=reports/v013-stage639-diagnostic-19-9869.json']).batch,19);
 for(const s of ['--batch=20','--seed=1','--take=6','--max-level=6','--out=../bad.json',
  '--inputs=../../bad','--max-total-attempts=61','--mode=bad'])
  assert.throws(()=>A.options([s]));
 assert.throws(()=>A.aggregate([]),/Missing/);
 const historical=require('../scripts/v013-stage634-natural-rates.cjs');
 assert.equal(typeof historical.summaryAccount,'function');
 assert.equal(typeof historical.rate,'function');
 const diagnostic=fs.readFileSync('scripts/v013-stage639-aoe-diagnostic.cjs','utf8');
 assert(diagnostic.includes('R.summaryAccount(natural,id,profile,cfg.seed)'));
 assert(diagnostic.includes('const data=R.rate(rooms)'));
 const src=fs.readFileSync('scripts/v013-natural-progression.cjs','utf8');
 assert(src.includes('aoePotential,aoeTalentIds:aoePrepared'));
 assert(src.includes('secondaryTargetDamage:Math.round(measured'));
 assert(src.includes('initialMinions,initialNormals,initialRoleCounts'));
 const combat=fs.readFileSync('combat/v012-combat-runtime.js','utf8');
 assert(combat.includes("phase6Metric(r,'secondaryTargetDamage',actual)"));
});
