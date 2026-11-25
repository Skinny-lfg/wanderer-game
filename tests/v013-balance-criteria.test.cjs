'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),B=require('../scripts/v013-balance-criteria.cjs');
test('approved targets use 12.5 percentage points from the center',()=>{
 assert.equal(B.TOLERANCE_PP,12.5);
 assert.equal(B.IDEAL_HALF_WIDTH_PP,5);
 assert.deepEqual(B.CENTERS,{normal:85,elite:70,boss:50});
 assert.deepEqual(B.TARGETS,{normal:{target:85,idealMin:80,idealMax:90,acceptableMin:72.5,acceptableMax:97.5},elite:{target:70,idealMin:65,idealMax:75,acceptableMin:57.5,acceptableMax:82.5},boss:{target:50,idealMin:45,idealMax:55,acceptableMin:37.5,acceptableMax:62.5}});
 for(const [k,v] of Object.entries(B.TARGETS)){
  assert.equal(v.target-v.acceptableMin,12.5,k);assert.equal(v.acceptableMax-v.target,12.5,k);
  for(const p of [v.target,v.idealMin,v.idealMax])assert.equal(B.classify(k,p,100).status,'ideal');
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
 assert.equal(B.summarize([{sc:'boss-blood'}],53).status,'ideal');
 assert.equal(B.summarize([{sc:'boss'},{sc:'normal-1'}],50).status,'not-applicable');
 assert.equal(B.summarize([],null).status,'not-applicable');
});

test('new targets classify actual E10 examples consistently',()=>{
 assert.equal(B.classify('normal-4',72.75,100).status,'acceptable');
 assert.equal(B.classify('elite-tank',82,100).status,'acceptable');
 assert.equal(B.classify('elite-tank',83,100).status,'above');
 assert.equal(B.classify('boss-blood',37,100).status,'below');
 assert.equal(B.classify('boss-blood',63,100).status,'above');
 assert.equal(B.classify('boss-blood',57,100).status,'acceptable');
});
