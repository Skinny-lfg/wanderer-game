'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
require('../online/v013-elite-abilities.js');
const E=globalThis.WandererV013EliteAbilities;
const IDS=['tank','berserker','vampire','caster','gravecaller','oathbound_exarch','briarspine_horror','ashen_executioner'];
test('Current eight Elite scaling curves retain independent growth after Stages 6.20 and 6.21',()=>{
 assert.deepEqual(Object.keys(E.ELITE_SCALING).sort(),[...IDS].sort());
 assert.equal(new Set(IDS.map(id=>JSON.stringify(E.ELITE_SCALING[id]))).size,8);
 for(const id of IDS){
  for(const level of [1,5])assert.deepEqual(E.scalingFor(id,level),{hp:1,atk:1,def:1});
  for(const stat of ['hp','atk','def']){
   const p15=E.scalingFor(id,15)[stat],p35=E.scalingFor(id,35)[stat],p70=E.scalingFor(id,70)[stat];
   assert(p15>1&&p15<p35&&p35<p70&&p70<2.6,id+' '+stat);
   assert.equal(E.scalingFor(id,100)[stat],p70);
  }
 }
 assert.throws(()=>E.scalingFor('invalid',35),/Invalid/);
});
test('Current native runtime uses Elite-specific growth and keeps Boss-only E1 reduction isolated',()=>{
 const source=fs.readFileSync('combat/v012-combat-runtime.js','utf8');
 assert.match(source,/eliteGrowth=elite\?root\.WandererV013EliteAbilities\.scalingFor\(elite\.id,level\):null/);
 assert.match(source,/elite\?elite\.hp\*eliteGrowth\.hp/);
 assert.match(source,/elite\?elite\.atk\*eliteGrowth\.atk/);
 assert.match(source,/elite\?elite\.def\*eliteGrowth\.def/);
 assert.match(source,/bossEarly\?\.hp/);
 assert.match(source,/bossEarly\?\.atk/);
});
