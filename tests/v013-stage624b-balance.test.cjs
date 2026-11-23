'use strict';
// Stage 6.24B approved base changes. Keep the live game, preview and simulator
// pointing at exactly one source; no test-only coefficient survives merge.
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),crypto=require('node:crypto');
require('../scripts/simulate-progression.cjs');
require('../online/v013-enemy-roster.js');
const R=globalThis.WandererV013EnemyRoster,A=globalThis.WandererV013EliteAbilities,P=globalThis.WandererExpeditionProgression;
const sha=s=>crypto.createHash('sha256').update(s).digest('hex').slice(0,12);
const read=p=>fs.readFileSync(p,'utf8');
test('Stage 6.24B changes native initial archetype bases (not E6-only multipliers)',()=>{
 const html=read('index.html'),docs=read('docs/index.html');
 for(const entry of [
  'hp:1.01,atk:.98,def:1.00',
  'hp:1.00,atk:.735,def:.86',
  'hp:1.20,atk:.84,def:1.00'
 ]){assert(html.includes(entry));assert(docs.includes(entry));}
 for(const old of ['hp:1.10,atk:1.02,def:1.00','hp:1.03,atk:.75,def:.86','hp:1.12,atk:.78,def:1.00']){
  assert(!html.includes(old),'old base remains: '+old);
  assert(!docs.includes(old),'old preview base remains: '+old);
 }
 for(const type of ['gravecaller','vampire','briarspine_horror']){
  assert.deepEqual(P.enemyScaling(1,'elite',type),{hp:1,atk:1,def:1});
  assert.deepEqual(P.enemyScaling(5,'elite',type),{hp:1,atk:1,def:1});
  assert(P.enemyScaling(6,'elite',type).hp>1,'Stage 6.24C unified curve starts smoothly after E5');
 }
});
test('Gravecaller bound souls and Deathbound remain native, with adjusted base pressure',()=>{
 const src=read('online/v013-elite-abilities.js');
 assert.match(src,/cast:1,hpFactor:\.48,atkFactor:\.34/);
 assert.match(src,/damagePerStack:\.0070/);
 assert.equal(A.DEFINITIONS.gravecaller.hpFactor,.48);
 assert.equal(A.DEFINITIONS.gravecaller.atkFactor,.34);
 assert.equal(A.DEATHBOUND.maxStacks,4);
 assert.equal(A.DEATHBOUND.damagePerStack,.0070);
 assert.deepEqual(A.DEFINITIONS.gravecaller.thresholds,[.85,.40]);
 assert.equal(A.DEFINITIONS.gravecaller.maxLiving,2);
 assert.equal(A.DEFINITIONS.gravecaller.maxSummons,4);
});
test('Briarspine first telegraph occurs at 9 seconds, cooldown/reflection caps unchanged',()=>{
 const spec=A.DEFINITIONS.briarspine_horror;
 assert.equal(spec.first,9);assert.equal(spec.cooldown,12);
 assert.equal(spec.cast,1);assert.match(spec.description,/first at 9s/);
});
test('Sanguine Wraith changes only native HP-hit lifesteal within full combat pipeline',()=>{
 const src=read('combat/v012-combat-runtime.js');
 assert(src.includes('Math.round(hit*.33)),Math.max(1,Math.round(e.maxhp*.055))'));
 assert(!src.includes('Math.round(hit*.38)),Math.max(1,Math.round(e.maxhp*.06))'));
 assert(src.includes("if(e.eliteType==='vampire')"));
});
test('Large normal rooms become modestly more dangerous without modifying solo or six-mob baseline',()=>{
 const role={role:'tank'};
 const base=n=>({hp:(1.65+.045*(n-6))/n,atk:n>=18?.12:.16});
 assert.equal(R.scaleFor(role,1,{hp:1,atk:1}),null);
 assert.equal(R.scaleFor(role,6,base(6)).hp,.53);
 assert.equal(R.scaleFor(role,6,base(6)).atk,.45);
 assert.equal(R.scaleFor(role,12,base(12)).hp,.43);
 assert.equal(R.scaleFor(role,12,base(12)).atk,.37);
 const n12=R.scaleFor({role:'minion'},12,base(12));
 assert.equal(n12.hp,base(12).hp*.95);
 assert.equal(n12.atk,base(12).atk*.92);
});
test('Pages preview is byte-identical for all three modified runtime modules and cache-busted',()=>{
 const paths=['online/v013-elite-abilities.js','online/v013-enemy-roster.js',
  'combat/v012-combat-runtime.js'];
 const page=read('docs/index.html');
 for(const p of paths){
  const src=read(p),preview=read('docs/'+p);
  assert.equal(preview,src,'Preview out of sync '+p);
  assert(page.includes(p+'?v='+sha(src)),'Missing content-addressed preview cache key '+p);
 }
 assert(!page.includes('v=5485bad8daad'));
 assert(!page.includes('v=133b8b557f2c'));
 assert(!page.includes('v=9d4fbfbc58bd'));
});
