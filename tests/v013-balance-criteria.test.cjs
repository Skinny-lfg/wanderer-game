'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),B=require('../scripts/v013-balance-criteria.cjs');
test('approved ideal and acceptable ranges use 7.5 percentage points on each extreme',()=>{
 assert.equal(B.TOLERANCE_PP,7.5);
 assert.deepEqual(B.TARGETS,{normal:{idealMin:80,idealMax:90,acceptableMin:72.5,acceptableMax:97.5},elite:{idealMin:60,idealMax:70,acceptableMin:52.5,acceptableMax:77.5},boss:{idealMin:35,idealMax:45,acceptableMin:27.5,acceptableMax:52.5}});
 for(const [k,v] of Object.entries(B.TARGETS)){
  for(const p of [v.idealMin,v.idealMax])assert.equal(B.classify(k,p,100).status,'ideal');
  for(const p of [v.acceptableMin,v.acceptableMax,v.idealMin-.01,v.idealMax+.01])assert.equal(B.classify(k,p,100).status,'acceptable');
  assert.equal(B.classify(k,v.acceptableMin-.01,100).status,'below');
  assert.equal(B.classify(k,v.acceptableMax+.01,100).status,'above');
 }
});
test('empty and mixed encounter cohorts are not misclassified',()=>{
 assert.equal(B.classify('boss',null,0).status,'no-data');
 assert.equal(B.classify('boss',0,0).status,'no-data');
 assert.equal(B.classify('boss',0,100).status,'below');
 assert.equal(B.summarize([{sc:'normal-1'},{sc:'normal-12'}],97.5).status,'acceptable');
 assert.equal(B.summarize([{sc:'elite-tank'}],70).status,'ideal');
 assert.equal(B.summarize([{sc:'boss-blood'}],53).status,'above');
 assert.equal(B.summarize([{sc:'boss'},{sc:'normal-1'}],50).status,'not-applicable');
 assert.equal(B.summarize([],null).status,'not-applicable');
});
