'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const crypto=require('node:crypto');
require('../combat/expedition-progression.js');
require('../combat/v012-combat-core.js');
const P=globalThis.WandererExpeditionProgression;
const C=globalThis.WandererV012CombatCore;
const S=require('../scripts/simulate-progression.cjs');
const NORMAL=['minion','tank','skirmisher','caster'];
const BOSSES=['leech','matriarch','guardian','conductor','berserker','devourer'];
test('Stage 6.33: fixed identity bases with one common smooth Expedition reference',()=>{
 assert(P.CALIBRATION_STAT_ONLY);
 assert.deepEqual(Object.keys(P.NORMAL_BASE).sort(),NORMAL.sort());
 assert.deepEqual(Object.keys(P.BOSS_BASE).sort(),BOSSES.sort());
 assert.equal(P.ELITE_IDENTITIES.length,8);
 for(const unused of ['ELITE_GROWTH','BOSS_GROWTH','BOSS_PROTECTION','eliteProgress','bossProgress'])
  assert.equal(Object.hasOwn(P,unused),false,'obsolete scaling source '+unused);
 assert.equal(new Set(BOSSES.map(id=>JSON.stringify(P.BOSS_BASE[id]))).size,6);
 for(const E of [1,2,3,4,5,6,15,35,70,100,200,201,500]){
  for(const role of NORMAL)assert.deepEqual(P.enemyScaling(E,'normal',role),{hp:1,atk:1,def:1});
  for(const id of P.ELITE_IDENTITIES)assert.deepEqual(P.enemyScaling(E,'elite',id),{hp:1,atk:1,def:1});
  for(const id of BOSSES)assert.deepEqual(P.enemyScaling(E,'boss',id),{hp:1,atk:1,def:1});
 }
 for(const invalid of [[1,'normal','ghost'],[5,'elite','ghost'],[70,'boss','ghost'],[10,'unknown',null],[0,'normal','tank']])
  assert.throws(()=>P.enemyScaling(...invalid));
 for(let E=2;E<=200;E++)assert(P.enemyReference(E)>P.enemyReference(E-1));
});
test('Stage 6.33: count never changes HP/ATK/DEF, including first four and reserves',()=>{
 const make=(role='tank')=>({role,name:'Fixed '+role,hp:100,maxhp:100,atk:40,def:27,baseDef:27,attackEvery:1.72});
 for(const count of [1,2,3,4,5,6,8,12,18,20,22]){
  const group=C.createEnemyGroup(i=>make(i%3===0?'tank':'minion'),count);
  assert.equal(group.length,count);
  for(const e of group){assert.equal(e.maxhp,100);assert.equal(e.hp,100);assert.equal(e.atk,40);assert.equal(e.def,27);assert.equal(e.baseDef,27);}
  if(count>1)assert.deepEqual(group.slice(0,Math.min(4,count)).map(e=>e.groupSlot),
   Array.from({length:Math.min(4,count)},(_,i)=>i));
 }
 assert.throws(()=>C.createEnemyGroup(make,12,{scale:{hp:.1,atk:.1}}),/removed/);
 assert.throws(()=>C.createEnemyGroup(make,12,{scaleFor:()=>({hp:.1,atk:.1})}),/removed/);
 assert.equal(C.applyEscortStats,undefined);
});
function native(E,groupSize,realm='aegis',risk=0,boss=false,elite=false){
 const opts={...S.DEFAULTS,points:0};
 const {a,c,g,card}=S.prepare(E,S.BUILDS[1],633000+E*37+groupSize,opts,risk,realm);
 const node=card.edges.filter(([from])=>from===0).map(([,to])=>to).find(id=>card.nodes[id]?.kind==='combat');
 assert.notEqual(node,undefined);
 assert(c.visitRoom(node));assert(a.enter());
 const r=a.encounter({count:groupSize,boss,elite});
 const actors=[...(r.enemies?.length?r.enemies:[r.enemy]),...(r.groupReserve||[])];
 return {r,actors};
}
test('Stage 6.33: actual native role stats are equal across solo/3/12/22 at same E and risk',()=>{
 for(const E of [1,2,5,35,70,200]){
  for(const count of [1,3,12,22]){
   const {r,actors}=native(E,count);
   assert.equal(actors.length,count);
   for(const e of actors){
    const id=P.NORMAL_BASE[e.role],v=C.estimateEnemy(E);
    assert(id,'unknown native role '+e.role);
    assert.equal(e.maxhp,Math.round(Math.round(v.hp*id.hp)*3),'native role HP differs from count-invariant budget');
    assert.equal(e.atk,Math.max(1,Math.round(Math.round(v.atk*id.atk)*.65)),'native role ATK differs from count-invariant budget');
    assert.equal(e.def,Math.round(v.def*id.def),'native role DEF differs from count-invariant budget');
    assert.equal(e.barrier,0);
    assert.equal(e.stage81,undefined);
    assert.equal(e.stage82,undefined);
   }
   assert.equal(r.encounterTraitId,null);
  }
 }
});
test('Stage 6.33: Boss and Elite specials suppressed during calibration, bases remain distinct',()=>{
 for(const realm of ['blood','decay','vitality','aegis','fury','magic']){
  const {r,actors}=native(2,1,realm,0,true,false);
  assert.equal(actors[0].boss,true);
  assert.equal(actors[0].barrier,0);
  assert.equal(r.stage84Boss,undefined);
  assert.equal(r.bossModifierIds?.length,0);
  assert.equal(r.bossInfrastructure,undefined);
 }
 const {r,actors}=native(2,1,'blood',0,false,true);
 assert(actors[0].miniboss);
 assert.equal(actors[0].stage82,undefined);
 assert.equal(actors[0].barrier,0);
 assert.equal(r.encounterTraitId,null);
});
test('Stage 6.33: Pages mirrored sources and content-addressed runtime scripts',()=>{
 const paths=['combat/expedition-progression.js','combat/v012-combat-core.js',
  'combat/v012-combat-runtime.js','online/v013-enemy-roster.js','online/v012-expedition-runtime.js'];
 const page=fs.readFileSync('docs/index.html','utf8');
 for(const file of paths){
  const src=fs.readFileSync(file,'utf8');
  assert.equal(fs.readFileSync('docs/'+file,'utf8'),src,'Pages mismatch '+file);
  const sha=crypto.createHash('sha256').update(src).digest('hex').slice(0,12);
  assert(page.includes(file+'?v='+sha),'Stale preview '+file);
 }
});
