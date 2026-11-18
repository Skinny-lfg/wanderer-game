'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const S=require('../scripts/simulate-progression.cjs');
const opts={...S.DEFAULTS,tickLimit:4500,gear:'current',runes:false,points:24};

test('current v0.13 E1/E50/E200 native encounters: seven modern weapon/build profiles resolve deterministically without invalid numbers',()=>{
 let tested=0;
 for(const level of [1,50,200]){
  for(const build of S.BUILDS){
   const one=S.encounter(level,build,9101,'normal',opts);
   const again=S.encounter(level,build,9101,'normal',opts);
   assert.deepEqual(one,again,'Same build, level and seed must replay: '+level+'/'+build.id);
   assert.equal(one.tier,level);
   assert.equal(one.unlocked,level);
   assert.equal(one.build,build.id);
   assert.equal(one.timedOut,false,'Real encounter must terminate: '+level+'/'+build.id);
   assert(['cleared','died'].includes(one.status),'Unexpected outcome: '+one.status);
   for(const field of ['ticks','hpStart','hpEnd','hpMax','mpStart','mpEnd','mpMax','damageDealt','damageTaken','seconds','enemies']){
    assert(Number.isFinite(one[field]),'Non-finite '+field+' at E'+level+'/'+build.id);
    assert(one[field]>=0,'Negative '+field+' at E'+level+'/'+build.id);
   }
   assert(one.enemies>=1);
   tested++;
  }
 }
 assert.equal(tested,S.BUILDS.length*3,'Every current profile × three reference levels');
});
