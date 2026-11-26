'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const baseline=require('../reports/v013-stage1-affinity-summary.json');
const Comparator=require('../scripts/v013-stage2-barrier-compare.cjs');
test('Stage 2 uses a frozen Stage 1 fingerprint and 48 complete baseline observations',()=>{
 assert.equal(baseline.cases.valid,48);
 assert.equal(baseline.cases.errors,0);
 assert.equal(baseline.cases.timeouts,0);
 assert.equal(baseline.groups.length,24);
 assert.equal(baseline.settings.pointsSpentPerBuild,24);
 assert.match(baseline.sourceSha256,/^[a-f0-9]{64}$/);
});
function fixture(){
 const groups=baseline.groups.map(x=>({...x,build:Comparator.archivedBuildId(x.build)}));
 for(const x of groups.filter(x=>x.build==='aegis-arcane'))x.meanBarrierAtEntry+=1;
 return {summary:{valid:48,errors:0,timeouts:0,groups}};
}
test('Stage 2 comparison enforces benefit for Aegis + Magic and no unrelated drift',()=>{
 assert.equal(Comparator.compare(baseline,fixture()).length,24);
 const drift=fixture();drift.summary.groups.find(x=>x.build==='pure-aegis').meanBarrierGenerated+=1;
 assert.throws(()=>Comparator.compare(baseline,drift),/Physical Aegis/);
 const wrong=fixture();wrong.summary.groups.find(x=>x.build==='pure-arcane').meanBarrierGenerated+=1;
 assert.throws(()=>Comparator.compare(baseline,wrong),/pure-arcane/);
 const noGain=fixture();noGain.summary.groups.find(x=>x.build==='aegis-arcane').meanBarrierAtEntry-=1;
 assert.throws(()=>Comparator.compare(baseline,noGain),/Aegis \+ Magic/);
});

test('Stage 2 historical comparison permits intentional Off-Hand Spell Power rerolls only with explicit new mode',()=>{
 const drift=fixture();
 drift.summary.groups.find(x=>x.build==='pure-arcane').meanSpellPower+=2;
 assert.throws(()=>Comparator.compare(baseline,drift,{postBarrierReset:true}),/Spell Power/);
 assert.equal(Comparator.compare(baseline,drift,{postBarrierReset:true,postOffhandReroll:true}).length,24);
 drift.summary.groups.find(x=>x.build==='pure-arcane').meanSpellPower=NaN;
 assert.throws(()=>Comparator.compare(baseline,drift,{postBarrierReset:true,postOffhandReroll:true}),/Invalid current Spell Power/);
});
