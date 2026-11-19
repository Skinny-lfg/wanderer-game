'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const N=require('../scripts/v013-natural-progression.cjs');
const R=require('../scripts/v013-stage5-longitudinal.cjs');
function a(level,status='extracted',attempt=1){
 return {level,status,attempt,bossWon:status==='victory',bossReached:status==='victory',
  fightsWon:1,rooms:[],camp:{crafted:[],bought:[]},before:{gear:{starter:3},earned:0},
  potions:[]};
}
function fixture(){
 const first={seed:1,profile:'cautious',startXp:0,initialGear:{},
  attempts:[a(1,'victory'),a(2,'victory'),a(3,'victory'),a(4,'victory'),a(5,'extracted')],
  reached:[1,2,3,4,5],endLevel:5,stopReason:'E5 unbeaten after 1 native attempts',
  xp:320,talents:['vitality'],finalGear:{total:4,starter:2},gold:20,fragments:14};
 const second={...first,seed:2,
  attempts:[a(1,'extracted'),a(1,'victory',2),a(2,'defeat')],
  reached:[1,2],endLevel:2,stopReason:'E2 unbeaten after 1 native attempts'};
 return {first,second};
}
test('E5 unlocked after E4 Boss win; first entering E5 does not mean defeating E5',()=>{
 const {first}=fixture(),m=R.milestone(first,5);
 assert.equal(m.unlocked,true);assert.equal(m.entered,true);assert.equal(m.cleared,false);
 assert.equal(m.totalAttemptsToUnlock,4);
 assert.equal(m.totalAttemptsToClear,null);
 assert.equal(m.attemptsAtThisLevel,1);
 assert.equal(R.milestone(first,10).unlocked,false);
 assert.equal(R.milestone(first,20).totalAttemptsToUnlock,null);
});
test('Account can reach E20 only with nineteenth chronological Boss victory',()=>{
 const account={attempts:Array.from({length:20},(_,i)=>a(i+1,'victory')),
  endLevel:21,reached:Array.from({length:20},(_,i)=>i+1)};
 assert.equal(R.milestone(account,5).totalAttemptsToUnlock,4);
 assert.equal(R.milestone(account,10).totalAttemptsToUnlock,9);
 assert.equal(R.milestone(account,20).totalAttemptsToUnlock,19);
 assert.equal(R.milestone(account,20).totalAttemptsToClear,20);
});
test('Non-reached levels are not claimed to have a zero-percent success rate',()=>{
 const {first,second}=fixture();
 const report=N.analyze([first,second],N.parseArgs(['--max-level=20','--max-attempts=1']));
 const summary=R.summarize(report);
 assert.equal(summary.milestones.E5.unlocked,1);
 assert.equal(summary.milestones.E5.entered,1);
 assert.equal(summary.milestones.E5.cleared,0);
 assert.equal(summary.milestones.E10.unlocked,0);
 assert.equal(summary.milestones.E20.unlocked,0);
 assert.equal(summary.milestones.E20.unlockAttempts.median,null);
 assert.equal(summary.byLevel[19].coverageStatus,'not_observed');
 assert.match(R.markdown(summary),/not observed/);
});
test('Narrow total-attempt budget stops a native account without skipping levels',()=>{
 const opts=N.parseArgs(['--max-level=20','--max-attempts=24','--max-total-attempts=1',
  '--seeds=9101','--profiles=cautious']);
 const r=N.run(opts),account=r.accounts[0];
 assert.equal(r.coverage.errors,0,account.stopReason);
 assert(account.attempts.length<=1);
 assert(account.endLevel<=2);
 assert.equal(R.summarize(r).milestones.E20.unlocked,0);
});
test('Longitudinal code never creates gear, directly advances level or manufactures XP',()=>{
 const src=fs.readFileSync('scripts/v013-stage5-longitudinal.cjs','utf8');
 for(const forbidden of ['.setup(','.setUnlocked(','.encounter(','.makeItem(','.award('])
  assert(!src.includes(forbidden),forbidden);
});
