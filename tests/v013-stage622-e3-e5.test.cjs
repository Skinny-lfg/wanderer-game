'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const D=require('../scripts/v013-stage622-e3-e5-audit.cjs');
const N=require('../scripts/v013-natural-progression.cjs');
const fight=(kind,won=true)=>({roomType:kind,won,died:!won,hpStart:90,
 hpEnd:won?40:0,hpMax:100,damageTaken:50,seconds:8,bossSummons:kind==='boss'?2:0});
const a=(level,status,{room=null,boss=false,contractPaid=null,reason=null}={})=>({
 level,attempt:1,status,bossReached:boss,bossWon:boss&&status==='victory',
 affinity:level===4?'decay':'blood',risk:0,error:null,
 before:{unlocked:level,spent:level*2,gear:{total:3,starter:1},xp:level*100},
 rooms:room?[fight(room,status==='victory')]:[],
 decisions:reason?[{type:'extract',reason}]:[],
 prepAtBoss:boss?{markedElite:true,reliquary:false}:null,
 bossInitialHP:boss?900:null,bossInitialModifiers:boss?['bleak_resonance']:[],
 contractPaid,contractCompleted:!!contractPaid,contract:'monster_hunt',
 boons:[{id:'bastion_oath'}],potions:[],equipped:[],camp:{equipped:[]}
});
const fixtures=()=>{
 const p={seed:9711,profile:'cautious',reached:[1,2,3,4,5],endLevel:5,
  xp:900,talents:['a','b'],finalGear:{total:5},attempts:[
   a(1,'victory',{room:'boss',boss:true}),
   a(2,'victory',{room:'boss',boss:true}),
   a(3,'victory',{room:'boss',boss:true}),
   a(4,'extracted',{room:'combat',reason:'protect_carried_loot'}),
   a(4,'defeat',{room:'elite'}),
   a(4,'defeat',{room:'boss',boss:true}),
   a(4,'victory',{room:'boss',boss:true}),
   a(5,'defeat',{room:'boss',boss:true})
  ]};
 const q={seed:9712,profile:'balanced',reached:[1],endLevel:1,
  xp:0,talents:[],finalGear:{total:3},attempts:[a(1,'defeat',{room:'combat'})]};
 return [p,q];
};
test('Stage 6.22 separates real Boss entries, deaths in Elite rooms, extraction decisions and censored E5',()=>{
 const x=D.analyze(fixtures(),'fingerprint-v622');
 const e4=x.byLevel.find(r=>r.level===4),e5=x.byLevel.find(r=>r.level===5);
 assert.equal(x.coverage.accounts,2);assert.equal(x.coverage.distinctSeeds,2);
 assert.equal(e4.accountsEntered,1);assert.equal(e4.attempts,4);
 assert.equal(e4.attemptedBosses,2);assert.equal(e4.bossWins,1);
 assert.equal(e4.bossWinPctConditional,50);
 assert.equal(e4.failureClasses.elite_death,1);
 assert.equal(e4.failureClasses.boss_death,1);
 assert.equal(e4.extractionReasons.protect_carried_loot,1);
 assert.equal(e4.bossByAffinity.decay.entries,2);
 assert.equal(e4.bossByAffinity.decay.prepared,2);
 assert.equal(e4.playerTalentsSpentMedian,8);
 assert.equal(e5.accountsEntered,1);
 assert.equal(e5.attemptedBosses,1);
 assert.equal(e5.bossWins,0);
 assert.equal(e5.bossWinPctConditional,0,'Only the actually reached E5 Boss counts');
 assert.equal(x.perAccount[1].e3e5.length,0,'E5-unreached account is not a defeat');
 assert.match(D.markdown(x),/E4/);
});
test('Reject duplicate persistent accounts, fabricated level unlock and unsafe paid Contract',()=>{
 const base=fixtures();
 assert.throws(()=>D.analyze([base[0],base[0]],'sha'),/Duplicate/);
 const wrong=structuredClone(base);wrong[0].attempts[1].before.unlocked=3;
 assert.throws(()=>D.analyze(wrong,'sha'),/Illegal/);
 const paid=structuredClone(base);paid[0].attempts[4].contractPaid={kind:'gold',gold:28};
 assert.throws(()=>D.analyze(paid,'sha'),/unsafe/);
 const mismatch=structuredClone(base);mismatch[0].attempts[3].bossWon=true;
 assert.throws(()=>D.analyze(mismatch,'sha'),/Boss win mismatch/);
});
test('Multiple independent shards merge only one native fingerprint and unique seeds/profiles',()=>{
 const first=fixtures()[0],second=fixtures()[1];
 const out=D.merge([{source:'runtime-A',accounts:[first],output:'a.json'},
  {source:'runtime-A',accounts:[second],output:'b.json'}]);
 assert.equal(out.coverage.shards,2);assert.equal(out.coverage.accounts,2);
 assert.equal(out.mode,'aggregate');
 assert.throws(()=>D.merge([{source:'A',accounts:[first]},
  {source:'B',accounts:[second]}]),/fingerprint/);
 assert.throws(()=>D.merge([{source:'A',accounts:[first]},
  {source:'A',accounts:[first]}]),/Duplicate/);
});
test('Bounded native CLI validates maximum 3-account shards and specific safe output paths',()=>{
 const o=D.parse(['--seeds=9701','--profiles=cautious,balanced,smart-blood-fury-radiance']);
 assert.equal(o.native.seeds.length,1);
 assert.equal(o.native.profiles.length,3);
 assert.equal(o.native.maxLevel,5);
 assert.throws(()=>D.parse(['--seeds=9701,9702']),/cohort|shard|large/);
 assert.throws(()=>D.parse(['--max-attempts=18']),/bounded/);
 assert.throws(()=>D.parse(['--out=../escape.json']),/path/);
 assert.throws(()=>D.parse(['--mode=aggregate']),/input/);
});
test('Native E1 smoke creates only honest account with earned XP and no fabricated E3–E5 observations',()=>{
 const cfg=N.parseArgs(['--seeds=9301','--profiles=cautious',
  '--max-level=5','--max-attempts=1','--max-total-attempts=1']);
 const live=N.run(cfg);
 assert.equal(live.coverage.errors,0);
 const result=D.analyze(live.accounts,live.source,cfg);
 assert.equal(result.coverage.accounts,1);
 assert.equal(result.coverage.errors,0);
 assert.equal(result.byLevel[0].attempts,1);
 for(let i=1;i<5;i++)if(result.byLevel[i].accountsEntered===0)
  assert.equal(result.byLevel[i].bossWinPctConditional,null);
});
