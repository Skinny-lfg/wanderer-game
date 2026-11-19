'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const natural=require('../scripts/v013-natural-progression.cjs');

function mockFight({leader,extra,policy}){
 const run={
  status:'fight',hp:100,maxhp:100,mp:0,maxmp:0,combatSeconds:4.5,
  enemies:[leader,extra],enemy:leader,encounterLeader:leader,totalMobCount:2,
  metrics:{damageTaken:0,damageDealt:11,enemyAbilityCasts:1}
 };
 const calls=[];
 const game={
  state:()=>({run}),
  controller:()=>({state:{stage:'combat'}}),
  selectCombatTarget:(current,target)=>{
   calls.push(target);
   if(current.status!=='fight'||!target||target.hp<=0||current.enemy===target||
      !current.enemies.includes(target))return false;
   current.enemy=target;current.tEnemy=target.groupClock;return true;
  },
  tick(){
   run.combatSeconds+=0.37;
   if(run.combatSeconds>=5.2)run.status='cleared';
  }
 };
 return {result:natural.fightNatural(game,{target:policy},10),calls,run};
}

test('Stage 5: natural E1 uses shared target action and native combat clock',()=>{
 const leader={hp:20,maxhp:20,role:'skirmisher',groupClock:.2};
 const caster={hp:15,maxhp:15,role:'caster',groupClock:.3};
 const {result,calls,run}=mockFight({leader,extra:caster,policy:'mechanics'});
 assert.equal(result.won,true);
 assert.equal(result.updateCalls,2);
 assert.equal(result.seconds,0.74,'native delta rather than updateCalls * 0.11');
 assert.equal(result.targetSwitches,1);
 assert.equal(run.enemy,caster);
 assert.equal(run.tEnemy,.3);
 assert.deepEqual(calls,[caster]);
});

test('Stage 5: summoned-minion focus duration follows native clock',()=>{
 const boss={hp:50,maxhp:50,boss:true,groupClock:.2};
 const summon={hp:8,maxhp:8,role:'minion',groupClock:.3,
  stage83Summoned:true,stage83Summoner:'elite'};
 const {result,run}=mockFight({leader:boss,extra:summon,policy:'adds'});
 assert.equal(result.updateCalls,2);
 assert.equal(result.targetSwitches,1);
 assert.equal(result.minionFocusSwitches,1);
 assert.equal(result.minionFocusSeconds,0.74);
 assert.equal(run.enemy,summon);
});

test('Stage 5: report fingerprints native engine and natural runner separately',()=>{
 const report=natural.analyze([],natural.parseArgs(['--max-level=1','--max-attempts=1']));
 assert.match(report.source,/^[a-f0-9]{64}$/);
 assert.match(report.runnerSha256,/^[a-f0-9]{64}$/);
 assert.match(natural.markdown(report),/Natural runner SHA-256/);
});
