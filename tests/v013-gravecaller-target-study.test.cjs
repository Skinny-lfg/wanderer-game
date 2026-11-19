'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const F=require('../scripts/v013-gravecaller-target-study.cjs');
const S=require('../scripts/simulate-progression.cjs');

function enemy(id,overrides={}){return {name:id,hp:100,maxhp:100,groupClock:1,...overrides};}
function fakeScenario(seed,type,gear,opts={}){
 const initial={role:type==='tank'?'tank':'miniboss',
  eliteType:type==='elite'?'gravecaller':null,
  playerHp:100,playerMaxHp:100,hp:80,atk:9,def:3};
 if(opts.inspectOnly)return {seed,type,gear,initial,inspected:true};
 const adds=opts.targetPolicy==='adds';
 return {seed,type,gear,initial,gearFingerprint:true,
  family:'decay',targetPolicy:opts.targetPolicy,
  won:adds,died:!adds,timedOut:false,
  seconds:adds?21:30,hpStart:100,hpEnd:adds?40:0,hpMax:100,
  damageTaken:adds?60:100,damageDealt:250,targetSwitches:adds?2:0,
  minionFocusSwitches:adds?2:0,minionFocusSeconds:adds?8:0,
  eliteSummons:2,deathboundApplications:adds?1:4,
  deathboundTicks:adds?1:4,deathboundDamage:adds?3:20,
  enemyAbilityCasts:1};
}
test('Native adds policy explicitly selects real summoned Gravecaller undead',()=>{
 const leader=enemy('gravecaller',{miniboss:true,eliteType:'gravecaller'});
 const undead=enemy('raised',{role:'minion',stage83Summoned:true,stage83Summoner:'elite'});
 const run={status:'fight',enemy:leader,encounterLeader:leader,enemies:[leader,undead]};
 assert.equal(S.selectTarget(run,'mechanics'),leader);
 assert.equal(S.selectTarget(run,'adds'),undead);
 undead.hp=0;
 assert.equal(S.selectTarget(run,'adds'),leader,'leader receives focus after minion dies');
});
test('30 real native seeds can be summarized by two paired policies without pooling encounters',()=>{
 const c=F.parseArgs(['--gear=starter','--target=2','--scan=4','--seed-start=100']);
 const r=F.run(c,{scenario:fakeScenario});
 assert.equal(r.success,true);
 assert.equal(r.coverage.matchedPairs,2);
 assert.equal(r.coverage.combatRuns,4);
 assert.equal(r.summary.mechanics.wins,0);
 assert.equal(r.summary.adds.wins,2);
 assert.equal(r.summary.pairedOutcomes.onlyAddsWins,2);
 assert.equal(r.summary.meanPairedDamageSaved,40);
 assert.equal(r.summary.meanPairedDeathboundDamageSaved,17);
 assert.equal(r.summary.adds.meanMinionFocusSeconds,8);
 assert.match(F.markdown(r),/Minions first/);
 assert.equal(r.rows[0].mechanics.policy,'mechanics');
 assert.equal(r.rows[0].adds.policy,'adds');
});
test('Identical seed, actual initial Gravecaller and same loadout are enforced',()=>{
 const x=fakeScenario(101,'elite','starter',{targetPolicy:'mechanics'});
 const y=fakeScenario(101,'elite','starter',{targetPolicy:'adds'});
 assert.doesNotThrow(()=>F.verifyMatch(101,x,y));
 assert.throws(()=>F.verifyMatch(101,x,{...y,initial:{...y.initial,playerHp:200}}));
 assert.throws(()=>F.verifyMatch(101,x,{...y,gearFingerprint:false}));
 assert.throws(()=>F.verifyMatch(101,x,{...y,won:false,died:false,timedOut:true}));
});
test('Missing native Gravecaller samples fail a balanced report instead of inventing wins',()=>{
 const c=F.parseArgs(['--gear=starter','--target=2','--scan=4','--seed-start=100']);
 const r=F.run(c,{scenario:(seed,type,gear,opts)=>({
  ...fakeScenario(seed,type,gear,opts),
  initial:{...fakeScenario(seed,type,gear,opts).initial,
   ...(type==='tank'?{role:'caster'}:{})}
 })});
 assert.equal(r.success,false);
 assert.equal(r.coverage.matchedPairs,0);
 assert(r.qualityIssues.some(x=>x.startsWith('insufficient_matched_gravecaller_seeds')));
});
test('Reject invalid or unbounded command settings',()=>{
 for(const args of [
  ['--gear=legendary'],['--target=0'],['--target=101'],['--scan=7000'],
  ['--tick-limit=0'],['--seed-start=NaN'],['--out=unsafe.txt'],['--unknown=yes']
 ])assert.throws(()=>F.parseArgs(args),args.join(' '));
});
