'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const D=require('../scripts/v013-b12d-clean-natural-rebaseline.cjs'),B=require('../scripts/v013-b1-e10-rebaseline.cjs'),N=require('../scripts/v013-natural-progression.cjs'),H=require('../scripts/v013-b12c5-decision-isolation.cjs');
test('all 28 approved H profiles are exact prior policy, not strict or bundled F',()=>{
 assert.equal(B.NATURAL.length,28);
 for(const id of B.NATURAL){const p=D.approvedProfile(id);assert.deepEqual(p,H.profile(id,'H'));assert.equal(N.handPairEnabled(p),true);assert.equal(N.softIdentityEnabled(p),false);assert.equal(p.agentCompatibilityOnly,true);assert.equal(p.strictResearchIdentity,false);}
});
test('100 fixed new shared seeds do not overlap previous B1 training or selected seeds',()=>{
 const seeds=Array.from({length:D.PER},(_,i)=>D.seed(i));assert.equal(seeds.length,100);assert.equal(new Set(seeds).size,100);assert.equal(D.BATCH*D.BATCHES,100);
 for(const s of seeds){assert(s>76200001+49*101);assert(s>76100001+49*101);}
 assert.equal(D.CONFIG.maxLevel,10);assert.equal(D.CONFIG.maxAttempts,12);assert.equal(D.CONFIG.maxTotalAttempts,60);assert.equal(D.CONFIG.surrenderPolicy,'observed-stalemate-v1');
});
test('resolved defeats and surrenders stay losses; technical timeout stays unresolved',()=>{
 const c=D.counts([{won:true},{died:true},{surrendered:true},{timedOut:true}]);assert.deepEqual(c,{attempted:4,resolved:3,wins:1,deaths:1,surrenders:1,timeouts:1});
 assert.deepEqual(D.outcomes(c),{...c,winPct:33.33,unresolved:1,allUnresolvedAsLoss:25,allUnresolvedAsWin:50});
 assert.equal(D.outcomes(D.counts([])).winPct,null);
});
test('seed-block bootstrap handles repeated fights and empty denominators',()=>{
 const rs=[{index:0,c:{wins:3,resolved:3}},{index:0,c:{wins:1,resolved:1}},{index:1,c:{wins:0,resolved:4}}];
 const x=D.clusterCI(rs,r=>r.c);assert.deepEqual(x,[0,100]);assert.equal(D.clusterCI(rs,r=>({wins:0,resolved:0})),null);
});
test('paid offhand incompatibility checks actual and intended two-handed weapon',()=>{
 const p=D.approvedProfile('smart-blood-two-handed'),t={before:{gear:{items:[{slot:'weapon',subtype:'Sword'}]}},camp:{crafted:[{slot:'offhand',recipe:'blue_orb',weaponAtDecision:'Sword'}],bought:[{slot:'offhand',name:'Orb',weaponAtDecision:'Sword'}]}};
 assert.equal(D.compatibilityIssues(t,p).length,2);
});
