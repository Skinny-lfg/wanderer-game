'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const C=require('../scripts/v013-stage63-native-magic-comparison.cjs');
const base={level:5,seed:123,mode:'arcane',weapon:'Wand',gearFingerprint:'same',hpMax:100,mpMax:30,
 realm:'Realm',risk:1,pointsSpent:24,groupSize:3,won:true,dps:50,damageDealt:500,damageTaken:60,manaSpent:30,infusionHits:0,infusionDamage:0,seconds:10,hpEnd:40};
test('Stage 6.3 demands exact native initial fixture matching before attributing damage differences',()=>{
 const a={rows:[base]},b={rows:[{...base,dps:70,damageDealt:700,damageTaken:50,manaSpent:35,infusionHits:3,infusionDamage:80}]};
 const result=C.compare(a,b);assert.equal(result.rows.length,1);assert.equal(result.groups[0].meanDeltaDps,20);
 assert.equal(result.groups[0].meanDeltaDamageTaken,-10);
 assert.equal(result.groups[0].meanDeltaManaSpent,5);
 for(const key of ['gearFingerprint','hpMax','mpMax','realm','risk','pointsSpent','groupSize']){
  assert.throws(()=>C.compare(a,{rows:[{...b.rows[0],[key]:key==='gearFingerprint'?'different':99}]}),key);
 }
});
