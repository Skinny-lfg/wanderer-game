'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const A=require('../scripts/v013-stage66-expedition-audit.cjs');
function account(seed,profile){
 const starter={total:3,starter:3,items:[{slot:'weapon',subtype:'Sword',startingGear:true}]};
 const room={roomType:'combat',hpStart:110,hpEnd:50,hpMax:110,won:true,died:false,
  damageTaken:60,seconds:20};
 return {seed,profile,startXp:0,initialGear:starter,reached:[1],endLevel:1,
  attempts:[{level:1,attempt:1,before:{earned:0,spent:0,xp:0,gear:starter},
   status:'extracted',bossWon:false,bossReached:false,rooms:[room],decisions:[
    {type:'extract',reason:'protect_carried_loot'}]}]};
}
const report=(accounts,source='abc')=>({source,runnerSha256:'run',accounts});
test('Stage 6.6 derives the REAL diminishing enemy reference, rather than arbitrary rates',()=>{
 const a=A.summarize([report([account(1,'magic-fire'),account(1,'balanced')])]);
 assert.equal(a.sourceReference[0].reference,1);
 assert.equal(a.sourceReference[4].reference,5);
 assert(Math.abs(a.sourceReference[9].reference-(5+Math.log(2)))<0.00001);
 assert.equal(a.e1FirstAttempt.bySeed[0].uniqueHpLossPct,1);
 assert.equal(a.levels[0].extractions,2);
 assert.equal(a.levels[0].bossEntries,0);
 assert.equal(a.levels[9].accountsEntered,0);
 assert.equal(a.levels[0].encounters.combat.fights,2);
 assert.match(A.markdown(a),/not a Magic-only issue/);
});
test('Duplicate identities, cross-source mixing, invalid unlock and tampered starter gear fail closed',()=>{
 const x=account(1,'balanced');
 assert.throws(()=>A.summarize([report([x,x])]),/Duplicate native account/);
 assert.throws(()=>A.summarize([report([x]),report([account(2,'balanced')],'new')]),/Different Stage/);
 const bad=account(2,'magic-fire');bad.attempts.push({...bad.attempts[0],level:2});
 assert.throws(()=>A.summarize([report([bad])]),/Non-native Expedition unlock/);
 const free=account(2,'magic-fire');free.startXp=100;
 assert.throws(()=>A.summarize([report([free])]),/clean slate/);
 const error=account(2,'magic-fire');error.attempts[0].status='error';
 assert.throws(()=>A.summarize([report([error])]),/Native attempt failed/);
});
test('Analyzer is read-only and cannot alter combat/equipment',()=>{
 const source=fs.readFileSync('scripts/v013-stage66-expedition-audit.cjs','utf8');
 for(const verb of ['setUnlocked(','.makeItem(','.award(','.encounter(','.hp=0'])
  assert(!source.includes(verb),verb);
});
