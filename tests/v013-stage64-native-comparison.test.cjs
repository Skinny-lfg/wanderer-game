'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const C=require('../scripts/v013-stage64-native-comparison.cjs');
const a={key:'x',level:5,seed:1,encounter:'group-10',mode:'arcane',weapon:'Staff',build:'arcane-staff',gearFingerprint:'X',
 pointsSpent:24,realm:'Aegis',risk:1,groupSize:10,rosterHash:'hash',hpMax:100,mpStart:80,mpMax:80,
 won:true,dps:30,damageTaken:40,manaSpent:50,hpEnd:60,seconds:10};
test('Stage 6.4 pairs only identical native gear, roster, Mana and seeds',()=>{
 const b={...a,won:false,dps:20,damageTaken:60,manaSpent:70,hpEnd:0,unfundedCasterAttacks:4,infusionHits:2,infusionDamage:20};
 const result=C.compare({rows:[a],errors:[]},{rows:[b],errors:[]});
 assert.equal(result.records,1);assert.equal(result.groups[0].deltaDps,-10);
 assert.equal(result.groups[0].meanFallbackAttacks,4);
 for(const key of ['seed','gearFingerprint','hpMax','mpMax','rosterHash','groupSize','pointsSpent'])
  assert.throws(()=>C.compare({rows:[a],errors:[]},{rows:[{...b,[key]:'different'}],errors:[]}),key);
});
