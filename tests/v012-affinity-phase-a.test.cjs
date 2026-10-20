const {test}=require('node:test'),assert=require('node:assert/strict');const {api,build,context,base}=require('./v012-affinity-fixture.cjs');
for(const p of api.CATALOG.filter(p=>!p.requires.length))test('A '+p.id+' ranks, executed effect and serialization',()=>{
 assert([1,5].includes(p.max));const prereq={deep_cuts:['bleeding_edge'],virulent_rot:['toxic_touch'],elemental_force:['overcharge']};let last;
 for(let r=1;r<=p.max;r++){
  const b=build([...(prereq[p.id]||[]),...Array(r).fill(p.id)],['blood','decay','magic']);b.families=[...new Set([p.family,...(p.family==='magic'?[]:['blood','decay'])])].slice(0,3);b.unlockedFamilies=[...b.families];b.element=p.family==='magic'?(p.element||'lightning'):null;
  const {c,calls}=context(b);api.onDefend(b,c,5,5);api.onAttack(b,c);const attackSpeed=api.speed(b,c.now);for(let i=0;i<4;i++){c.now+=4;api.onCast(b,c);}api.onSecond(b,c);api.onKill(b,c);api.survive(b,c);
  const stats=api.mods(b,base),effect={attackSpeed,stats,cost:api.nextCost(b),reduction:api.incoming(b,c,10000),enemyHeal:api.enemyHealMultiplier(b,c.enemy),speed:api.speed(b,c.now),calls};
  assert(Number.isFinite(stats.maxhp));assert.equal(api.rank(b,p.id),r);assert.equal(api.rank(api.validate(JSON.parse(JSON.stringify(b))),p.id),r);
  // Probability-only ranks are measured by their actual threshold, not a lucky fixed RNG outcome.
  if(last&&['bleeding_edge','toxic_touch','double_strike'].includes(p.id))assert(api.values(p.id,r).chance>api.values(p.id,r-1).chance);
  else if(last)assert.notEqual(JSON.stringify(effect),last,'rank must change an executed effect');last=JSON.stringify(effect);
 }
 const b=build(Array(p.max).fill(p.id),[p.family],p.element||'lightning');assert(!api.eligible(b,p.family).some(x=>x.id===p.id));assert.throws(()=>api.choose(b,p.family,p.id,[p]));
});
test('A catalog has exactly 29 scalable and four unique normals; caps and legacy ranks',()=>{
 const normal=api.CATALOG.filter(p=>!p.requires.length);assert.equal(normal.length,33);assert.equal(normal.filter(p=>p.max===5).length,29);
 for(const [id,stats]of [['precision',{crit:65}],['guarded_block',{blockChance:65}],['quick_hands',{attacksPerSec:5}]])assert.equal(api.preview(build(),id,stats).useful,false);
 const b=build(Array(8).fill('bleeding_edge'),['blood']);b.version=2;assert.equal(api.rank(api.validate(b),'bleeding_edge'),5);assert.equal(b.picks.length,8);b.version=3;assert.throws(()=>api.validate(b),/rank/);
});
test('A paid-only Static, echo and cost ranks; unique Last Stand and once-only Wave healing',()=>{
 const b=build(['overcharge','arcane_echo','last_stand','second_breath'],['magic','vitality']);const {c,calls}=context(b);
 c.funded=false;for(let i=0;i<8;i++)api.onCast(b,c);assert.equal(b.runtime.staticCharges,0);assert.equal(calls.length,0);
 c.funded=true;for(let i=0;i<3;i++)api.onCast(b,c);const saved=api.validate(JSON.parse(JSON.stringify(b)));api.onCast(saved,c);assert.equal(saved.runtime.staticCharges,0);assert(calls.some(x=>x[2]?.includes('Static')));
 api.onKill(b,c);const hp=c.player.hp;api.onKill(b,c);assert.equal(c.player.hp,hp);assert(api.survive(b,c));assert(!api.survive(JSON.parse(JSON.stringify(b)),c));
 for(let r=1;r<=5;r++)assert.equal(api.nextCost(build(Array(r).fill('efficient_cast'))),8-r);
});
