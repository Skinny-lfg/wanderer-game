'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const A=require('../scripts/v013-affinity-baseline.cjs');
const S=require('../scripts/simulate-progression.cjs');
test('Stage 1 profiles cover six pure and six adjacent hybrid Affinities',()=>{
 assert.equal(A.BUILDS.length,12);
 assert.equal(A.BUILDS.filter(x=>x.families.length===1).length,6);
 assert.equal(A.BUILDS.filter(x=>x.families.length===2).length,6);
 const pure=new Set(A.BUILDS.filter(x=>x.families.length===1).map(x=>x.families[0]));
 assert.deepEqual([...pure].sort(),['aegis','blood','decay','fury','arcane','radiance'].sort());
 for(const b of A.BUILDS){assert(b.skills.every(x=>S.talentPlan(b,24).nodes.includes(x)||x==='arcane_bastion'&&b.families.length===2),
  b.id+' has unavailable requested talent');}
});
test('Stage 1 CLI is bounded and remains separate from native progression mode',()=>{
 assert.deepEqual(A.parseArgs(['--mode=affinities','--levels=5,35','--seeds=9101','--builds=pure-aegis,aegis-arcane']).builds,['pure-aegis','aegis-arcane']);
 for(const bad of [['--mode=invalid'],['--levels=0'],['--points=101'],['--builds=missing'],['--enemy-affinity=void'],['--out=../unsafe.json']])assert.throws(()=>A.parseArgs(bad));
 assert.equal(S.parseArgs(['--mode=encounter']).mode,'encounter');
});
test('Stage 1 reports real Aegis Barrier and Arcane/Decay resources with fixed gear fingerprints',()=>{
 const cfg=A.parseArgs(['--levels=15','--seeds=9101','--builds=pure-aegis,aegis-arcane,arcane-decay','--points=24']);
 const r=A.run(cfg);
 assert.equal(r.summary.errors,0,JSON.stringify(r.rows.filter(x=>x.error)));
 assert.equal(r.rows.length,3);
 for(const row of r.rows){
  assert.equal(row.pointsSpent,24,'profile point budget must equal actual allocated points');
  assert(row.gearFingerprint?.length===64,'must preserve deterministic gear identity');
  assert(row.selectedAffinities.length===row.affinities.length,'all requested Affinities must be present');
  assert(['cleared','died'].includes(row.status),'native combat must finish');
  for(const field of ['barrierAtEntry','barrierGenerated','barrierAbsorbed','healingActual','dotDamageActual','manaSpent','spellPower','maxHealth','seconds']){
   assert(Number.isFinite(row[field])&&row[field]>=0,row.build+': '+field);
  }
  assert.equal(typeof row.passiveActivations,'object');
  assert(row.nativeEncounter.affinity==='aegis');
 }
 assert(r.rows.find(x=>x.build==='pure-aegis').barrierAtEntry>0);
 assert(r.rows.find(x=>x.build==='aegis-arcane').spellPower>0);
 assert(r.rows.find(x=>x.build==='arcane-decay').spellPower>0);
 const replay=A.run(cfg);
 assert.equal(replay.replaySha256,r.replaySha256,'fixed seed, gear and talents must be reproducible');
});
