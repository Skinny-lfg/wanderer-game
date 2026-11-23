'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
require('../combat/expedition-progression.js');
require('../combat/v012-combat-core.js');
require('../online/v013-boss-infrastructure.js');
require('../online/v013-boss-abilities.js');
require('../online/v013-elite-abilities.js');
const P=globalThis.WandererExpeditionProgression;
const C=globalThis.WandererV012CombatCore;
const Audit=require('../scripts/v013-stage624c-curve-audit.cjs');
const ELITES=Object.keys(P.ELITE_GROWTH),BOSSES=Object.keys(P.BOSS_PROTECTION);
test('Single native scaling owner, 8 Elites and 6 Bosses; retired scaling owners absent',()=>{
 assert.equal(ELITES.length,8);assert.equal(BOSSES.length,6);
 assert.equal(new Set(ELITES.map(id=>JSON.stringify(P.ELITE_GROWTH[id]))).size,8);
 assert.equal(new Set(BOSSES.map(id=>JSON.stringify(P.BOSS_PROTECTION[id]))).size,6);
 assert.equal(globalThis.WandererV013EliteAbilities.scalingFor,undefined);
 assert.equal(globalThis.WandererV013EliteAbilities.ELITE_SCALING,undefined);
 assert.equal(globalThis.WandererV013BossAbilities.earlyScale,undefined);
 assert.equal(globalThis.WandererV013BossAbilities.EARLY_BOSS_PRESSURE,undefined);
 const runtime=fs.readFileSync('combat/v012-combat-runtime.js','utf8');
 assert(runtime.includes('WandererExpeditionProgression.enemyScaling('));
 assert(!runtime.includes('eliteGrowth='));assert(!runtime.includes('bossEarly='));
});
test('Elite curve continuous through E6, E35, E70, E200 and E201; E5 exact native parity',()=>{
 const checkpoints=[1,5,6,14,15,16,34,35,36,69,70,71,99,100,101,199,200,201,500,1000];
 for(const id of ELITES){
  for(let level=1;level<=5;level++)assert.deepEqual(P.enemyScaling(level,'elite',id),{hp:1,atk:1,def:1});
  let last=null;
  for(const level of checkpoints){
   const val=P.enemyScaling(level,'elite',id);
   for(const k of ['hp','atk','def']){
    assert(Number.isFinite(val[k])&&val[k]>=1);
    if(last)assert(val[k]>=last[k],id+' '+k+' monotone at E'+level);
   }
   last=val;
  }
  const gains=P.ELITE_GROWTH[id],p70=P.enemyScaling(70,'elite',id);
  for(const key of ['hp','atk','def']){
   assert(Math.abs(p70[key]-(1+gains[key]))<1e-12,id+' E70 '+key);
   assert(P.enemyScaling(6,'elite',id)[key]<p70[key]);
   assert(P.enemyScaling(200,'elite',id)[key]>p70[key]);
   assert(P.enemyScaling(201,'elite',id)[key]>P.enemyScaling(200,'elite',id)[key]);
   for(const edge of [5,14,15,34,35,69,70,199,200]){
    const prev=P.enemyScaling(edge,'elite',id)[key],next=P.enemyScaling(edge+1,'elite',id)[key];
    assert(next/prev<1.05,'Unintended abrupt jump E'+edge+'→'+(edge+1)+' '+id+'/'+key);
   }
  }
 }
 assert.equal(P.eliteProgress(5),0);assert.equal(P.eliteProgress(70),1);
 assert(P.eliteProgress(201)>P.eliteProgress(200));
 assert(P.eliteProgress(100000)<95/65,'bounded but never clamped after E70');
});
test('Six Boss reductions identical to Stage 6.21 at all levels, no global Boss buffs',()=>{
 for(const style of BOSSES)for(const level of [1,2,3,4,5,6,15,29,30,31,35,70,200,201,1000]){
  const p=P.BOSS_PROTECTION[style],q=Math.max(0,Math.min(1,(30-level)/29));
  assert.deepEqual(P.enemyScaling(level,'boss',style),
   {hp:1-p.hp*q,atk:1-p.atk*q,def:1});
 }
 for(const level of [1,2,5,15,70,100,200,201]){
  assert.deepEqual(P.enemyScaling(level,'normal','tank'),{hp:1,atk:1,def:1});
  assert.deepEqual(P.enemyScaling(level,'normal','caster'),{hp:1,atk:1,def:1});
 }
});
test('Native reference/gear policy matches E1–E5 and still progresses beyond E200',()=>{
 assert.deepEqual([1,2,3,4,5].map(P.enemyReference),[1,2,3,4,5]);
 assert.deepEqual([1,5,15,35,70,100,200,201,1000].map(x=>P.gearTier(x).id),
 ['adventurer','veteran','ascendant','ancient','exalted','exalted','exalted','exalted','exalted']);
 assert(P.enemyReference(201)>P.enemyReference(200));
 assert(P.enemyReference(1000)>P.enemyReference(201));
 for(const L of [1,5,6,15,35,70,100,200,201,1000]){
  const n=C.estimateEnemy(L,1),e=C.estimateEnemy(L,4);
  assert(n.hp>0&&n.atk>0&&e.hp>n.hp&&e.atk>n.atk);
 }
});
test('Invalid classes, identities and levels are rejected without fallback to wrong enemy',()=>{
 for(const level of [NaN,Infinity,-1,0,1.5,'5'])
  assert.throws(()=>P.enemyScaling(level,'elite','tank'));
 for(const args of [[5,'elite','wrong'],[5,'boss','wrong'],[5,'normal','wrong'],[5,'wrong',null]])
  assert.throws(()=>P.enemyScaling(...args));
});
test('A/B audit cannot invent legal gear or endgame XP; native E5 matches before/after',()=>{
 assert.equal(Audit.LEVELS.length,6);
 assert.equal(Audit.plan(5).length,12);
 assert.equal(Audit.plan(200).length,12);
 const row=Audit.plan(5)[0];
 assert.equal(row.level,5);
 const x=Audit.compare(row,'elite','briarspine_horror');
 assert.equal(x.old.won,x.new.won);
 assert.equal(x.old.roster[0].maxHp,x.new.roster[0].maxHp);
 assert.equal(x.old.roster[0].atk,x.new.roster[0].atk);
 assert.equal(x.old.roster[0].def,x.new.roster[0].def);
 assert.throws(()=>Audit.plan(1));
 assert.throws(()=>Audit.summarize([]),/Incomplete/);
});
