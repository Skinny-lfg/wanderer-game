'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
require('../combat/expedition-progression.js');
require('../combat/v012-combat-core.js');
const P=globalThis.WandererExpeditionProgression,C=globalThis.WandererV012CombatCore;
const S=require('../scripts/simulate-progression.cjs');
const A=require('../scripts/v013-stage639-aoe-diagnostic.cjs');
const newBosses={
 leech:{hp:1.31,atk:1.62,def:2},
 matriarch:{hp:1.22,atk:1.54,def:2},
 guardian:{hp:1.58,atk:1.75,def:2},
 conductor:{hp:1.38,atk:1.59,def:2},
 berserker:{hp:1.43,atk:1.58,def:2},
 devourer:{hp:1.85,atk:1.91,def:2}
};
function make(role='tank'){return {role,maxhp:100,hp:100,atk:30,def:10,baseDef:10,attackEvery:1.6};}
test('Stage6.39: strictly solo normal role buffs, never Minions, groups or Bosses',()=>{
 for(const [role,coeff]of Object.entries(C.SOLO_NORMAL_BASE)){
  const e=make(role),d=C.applySoloNormalReinforcement([e]);
  assert.equal(d.affected,1);assert.equal(e.maxhp,Math.round(100*coeff.hp));
  assert.equal(e.hp,e.maxhp);assert.equal(e.atk,Math.round(30*coeff.atk));
  assert.equal(e.def,10);assert.equal(e.attackEvery,1.6);
  assert.throws(()=>C.applySoloNormalReinforcement([e]),/twice/);
  const g=Array.from({length:7},()=>make(role)),before=JSON.stringify(g);
  assert.equal(C.applySoloNormalReinforcement(g).affected,0);
  assert.equal(JSON.stringify(g),before);
 }
 for(const special of ['minion','boss','miniboss']){
  const e=make('minion');
  if(special!=='minion')e[special]=true;
  const before=JSON.stringify(e);
  assert.equal(C.applySoloNormalReinforcement([e]).affected,0);
  assert.equal(JSON.stringify(e),before);
 }
});
test('Stage6.39: six individual Boss E1 identities and shared strictly continuous growth',()=>{
 assert.deepEqual(Object.keys(P.BOSS_BASE).sort(),Object.keys(newBosses).sort());
 for(const [id,coeff] of Object.entries(newBosses)){
  const b=P.BOSS_BASE[id];
  assert.equal(b.hp,coeff.hp);assert.equal(b.atk,coeff.atk);assert.equal(b.def,coeff.def);
  for(const E of [1,2,5,10,20,70,200])assert.deepEqual(P.enemyScaling(E,'boss',id),{hp:1,atk:1,def:1});
 }
 for(let E=2;E<=200;E++)assert(P.enemyReference(E)>P.enemyReference(E-1));
 assert.equal(P.enemyReference(1),.775);
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
test('Stage6.39: actual E1/E5/E10 solo normal receives identity boost and groups do not',()=>{
 for(const E of [1,5,10]){
  const s=native(E,1),roles=s.actors.map(x=>x.role);
  assert.equal(s.actors.length,1);
  assert(['tank','skirmisher','caster'].includes(roles[0]),'solo enemy principal');
  assert.equal(s.actors[0].soloNormalReinforcementApplied,true);
  for(const size of [2,4,6,12]){
   const x=native(E,size);assert.equal(x.actors.length,size);
   for(const a of x.actors)assert.equal(a.soloNormalReinforcementApplied,undefined);
  }
 }
});
test('Stage6.39: no solo normal reinforcement on native Elite/Boss',()=>{
 for(const typ of ['elite','boss'])for(const E of [1,5]){
  const x=native(E,1,typ);
  assert.equal(x.actors.length,1);
  assert.equal(x.actors[0].soloNormalReinforcementApplied,undefined);
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
 const src=fs.readFileSync('scripts/v013-natural-progression.cjs','utf8');
 assert(src.includes('aoePotential,aoeTalentIds:aoePrepared'));
 assert(src.includes('secondaryTargetDamage:Math.round(measured'));
 assert(src.includes('initialMinions,initialNormals,initialRoleCounts'));
 const combat=fs.readFileSync('combat/v012-combat-runtime.js','utf8');
 assert(combat.includes("phase6Metric(r,'secondaryTargetDamage',actual)"));
});
