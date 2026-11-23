'use strict';
// Repro of previously censored Daring E5 fixture. Natural XP and gear only.
// Execute this in preflight, not after every full E200 cohort has run.
const {test}=require('node:test'),assert=require('node:assert/strict');
const M=require('../scripts/v013-stage629-exponential-curve.cjs');
const D=require('../scripts/v013-stage628-postcap-difficulty.cjs');
test('Stage6.29 Daring E5 has a classified old-curve native solo encounter',()=>{
 const cfg={seed:9863,profile:'daring',maxLevel:5,maxAttempts:24,maxTotalAttempts:360};
 const old=D.collect(cfg,{moduleOverrides:{'combat/expedition-progression.js':M.LEGACY}});
 const snap=old.checkpoints.find(x=>x.level===5);
 assert(snap,'Daring must legitimately reach E5 in baseline');
 const scenario=Mold(snap);
 const seed=6290011+cfg.seed*107+5*223;
 const row=M.pick(snap,scenario,seed,true);
 assert.equal(row.talentXp,snap.xp);
 assert(row.won||row.died||row.timedOut);
});
function Mold(snap){
 const scenario=D.scenarios(snap).find(x=>x.id==='group-1');
 assert(scenario,'missing first solo normal scenario');return scenario;
}
