'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const C=require('../scripts/v013-stage648c2c-offensive-scaling.cjs');
test('all isolated gear projections compile',()=>{for(const arm of Object.keys(C.ARMS))new Function(C.statSource(arm));});
test('both pure talent paths have 24 legal points and no other affinity',()=>{for(const f of ['blood','decay','persistent'])assert.equal(C.talent(f).nodes.length,24);assert.deepEqual(C.talent('decay'),C.talent('persistent'));});
test('matrix has six weapons per mode',()=>assert.equal(new Set(C.COHORTS).size,18));
