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
 const groups=baseline.groups.map(x=>({...x}));
 for(const x of groups.filter(x=>x.build==='aegis-magic'))x.meanBarrierAtEntry+=1;
 return {summary:{valid:48,errors:0,timeouts:0,groups}};
}
test('Stage 2 comparison enforces benefit for Aegis + Magic and no unrelated drift',()=>{
 assert.equal(Comparator.compare(baseline,fixture()).length,24);
 const drift=fixture();drift.summary.groups.find(x=>x.build==='pure-aegis').meanBarrierGenerated+=1;
 assert.throws(()=>Comparator.compare(baseline,drift),/Physical Aegis/);
 const wrong=fixture();wrong.summary.groups.find(x=>x.build==='pure-magic').meanBarrierGenerated+=1;
 assert.throws(()=>Comparator.compare(baseline,wrong),/pure-magic/);
 const noGain=fixture();noGain.summary.groups.find(x=>x.build==='aegis-magic').meanBarrierAtEntry-=1;
 assert.throws(()=>Comparator.compare(baseline,noGain),/Aegis \+ Magic/);
});
