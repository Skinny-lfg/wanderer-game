'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const B=require('../scripts/v013-stage624b-base-audit.cjs');
const A=require('../scripts/v013-stage624-e1-e5-baseline.cjs');
test('Native Stage 6.24B proposal replaces only known E1-onward coefficients, all modules remain native',()=>{
 const x=B.candidate();
 assert.equal(Object.keys(x.files).length,4);
 assert.equal(Object.keys(x.hashes).length,4);
 assert.match(x.files['index.html'],/hp:\.93,atk:\.70,def:\.86/);
 assert.match(x.files['index.html'],/hp:1\.28,atk:\.89,def:1\.00/);
 assert.match(x.files['online/v013-elite-abilities.js'],/damagePerStack:\.006/);
 assert.match(x.files['online/v013-elite-abilities.js'],/hpFactor:\.42,atkFactor:\.30/);
 assert.match(x.files['online/v013-enemy-roster.js'],/between\(\.59,\.46,t\)/);
 assert.match(x.files['combat/v012-combat-runtime.js'],/Math\.round\(hit\*\.30\)/);
 assert.throws(()=>B.replaceOnce('abc','xx','y','test'),/drift/);
 assert.throws(()=>B.replaceOnce('xx xx','xx','y','test'),/drift/);
});
test('Stage 6.24B matched cohort aggregation rejects duplicated seed, mismatched source, missing player',()=>{
 const base={stage:'6.24B',mode:'seed',seed:9701,source:'native',
  candidateHashes:{a:'sha'},coverage:{errors:0,controlledBattles:0},
  pairs:[{key:'real-E1',level:1,oldTank:true,oldBoss:false,
   elites:Object.fromEntries(require('../scripts/v013-stage623-earned-matched-enemies.cjs').ELITES.map(
    id=>[id,{oldWin:false,newWin:true,oldDamage:11,newDamage:10,oldHp:100,newHp:90}])),
   groups:Object.fromEntries(A.groups.map(n=>[n,{oldWin:true,newWin:true,oldDamage:2,newDamage:3}]))}]};
 const o=B.aggregate([base]);
 assert.equal(o.coverage.earnedSnapshots,1);
 assert.equal(o.levels[1].byElite.gravecaller.before,0);
 assert.equal(o.levels[1].byElite.gravecaller.after,1);
 assert.throws(()=>B.aggregate([base,base]),/Incompatible/);
 assert.throws(()=>B.aggregate([{...base,seed:9702},base]),/Duplicate earned/);
 assert.throws(()=>B.aggregate([base,{...base,seed:9702,source:'other',pairs:[]}]),/Incompatible/);
});
