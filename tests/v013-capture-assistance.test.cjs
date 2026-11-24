'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {createScaler,policy}=require('../scripts/v013-capture-assistance.cjs');
function enemy(hp=100,atk=20){return {hp,maxhp:hp,atk,def:10,barrier:5};}
test('Assisted capture scales each active and reserve actor once, without affecting other attributes',()=>{
 const a=enemy(),b=enemy(),r={enemy:a,enemies:[a],groupReserve:[b]},s=createScaler(9,'assisted');s.apply(r);s.apply(r);
 assert.equal(a.hp,70);assert.equal(a.maxhp,70);assert.equal(a.atk,14);assert.equal(a.def,10);assert.equal(a.barrier,5);assert.equal(b.hp,70);assert.equal(s.metrics.scaledActors,2);
 const c=enemy();r.enemies.push(c);s.apply(r);assert.equal(c.hp,70);assert.equal(s.metrics.scaledActors,3);
 const node=enemy(100,0);r.enemies.push(node);s.apply(r);assert.equal(node.atk,0);assert.equal(node.hp,70);
});
test('E10 and natural capture have an exact no-op boundary',()=>{
 for(const [e,m] of [[1,'natural'],[9,'natural'],[10,'assisted'],[200,'assisted']]){
  const a=enemy(),r={enemy:a,enemies:[a]},prior=JSON.stringify(r),s=createScaler(e,m);s.apply(r);assert.equal(JSON.stringify(r),prior);assert.equal(s.metrics.scaledActors,0);assert.equal(s.metrics.hpFactor,1);
 }
 assert.throws(()=>policy('other'));
});
test('Assistance remains outside browser sources; harness preserves all dotDamage args',()=>{
 const html=fs.readFileSync('index.html','utf8'),h=fs.readFileSync('tests/v012-economy-harness.cjs','utf8');
 assert(!html.includes('v013-capture-assistance'));assert(h.includes('return native(...args);'));
 for(const f of ['combat/v012-combat-runtime.js','combat/v012-buildcraft.js','combat/talent-catalog.js'])assert.equal(fs.readFileSync(f,'utf8'),fs.readFileSync('docs/'+f,'utf8'));
});
