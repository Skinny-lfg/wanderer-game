import test from 'node:test';import assert from 'node:assert/strict';
import {CHARACTERS,nicknameKey,validateSave,recoverInterruptedSave,syncDecision,cloudRecord,compareRevision,safeProgress,completedD200Time} from '../online/model.mjs';
const save={gold:8,fragments:3,maxDungeon:10,stash:[],equip:{},run:null};
test('five cosmetic characters and normalized unique nickname keys',()=>{assert.deepEqual(CHARACTERS.map(c=>c.name),['Paladin','Ranger','Warrior','Wizard','Rogue']);assert.equal(CHARACTERS.length,5);assert.equal(nicknameKey(' Tester_1 '),'tester_1');assert.throws(()=>nicknameKey('a/b'));});
test('no empty cloud or signed-in account silently replaces local progress',()=>{assert.equal(syncDecision(save,null),'choose-upload');assert.equal(syncDecision(save,{payload:JSON.stringify({...save,gold:0})}),'choose-conflict');assert.equal(syncDecision(save,{payload:JSON.stringify(save)}),'identical');});
test('revision conflict and save validation',()=>{assert.throws(()=>compareRevision({revision:3},2));assert.equal(cloudRecord(save,3).revision,4);assert.throws(()=>validateSave({...save,run:{}}));assert.throws(()=>validateSave({...save,gold:-1}));assert.throws(()=>validateSave({...save,equip:[]}));assert.deepEqual(validateSave(save),save);});
test('legacy import never invents timed clears or D100 completion',()=>{const p=safeProgress({...save,maxDungeon:100});assert.equal(p.deepestCleared,99);assert.equal(p.timingEligible,false);assert.deepEqual(p.milestones,{});});
test('explicit zero cleared depth survives even with D100 unlocked',()=>{
 const reset={...save,maxDungeon:100,onlineProgress:{attemptId:'reset',deepestCleared:0}};
 assert.equal(safeProgress(reset).deepestCleared,0);
 assert.equal(safeProgress({...reset,onlineProgress:{}}).deepestCleared,99,'legacy missing field still infers unlocked progress');
});

test('resume interrupted run preserves existing progress and rejects active run in normal validation',()=>{
 const original={...save,run:{tier:10,status:'fight',loot:[{id:'unextracted'}],gold:500},gold:124,fragments:40,
  stash:[{id:'safe',name:'Extracted',slot:'helm',tier:6}],equip:{weapon:{id:'weapon',name:'Sword',slot:'weapon',tier:8}}};
 const raw=JSON.stringify(original),result=recoverInterruptedSave(raw);
 assert.equal(result.interrupted,true);assert.equal(result.save.run,null);
 assert.equal(result.save.gold,124);assert.equal(result.save.fragments,40);
 assert.equal(result.save.stash[0].id,'safe');assert.equal(result.save.equip.weapon.id,'weapon');
 assert.equal(JSON.parse(raw).run.gold,500);
 assert.throws(()=>validateSave(original),/Finish or extract/);
 assert.equal(recoverInterruptedSave(result.save).interrupted,false);
 assert.throws(()=>recoverInterruptedSave({...save,run:'bad'}),/Finish or extract/);
 assert.throws(()=>recoverInterruptedSave({...save,gold:-1,run:{status:'fight'}}),/Invalid gold/);
});

test('cloud validation rejects nonfinite item stats and duplicate identities without mutating input',()=>{
 const item={id:'same',name:'Sword',slot:'weapon',tier:1,atk:5};
 const duplicate={...save,stash:[item],equip:{weapon:{...item}}};const original=JSON.stringify(duplicate);assert.throws(()=>validateSave(duplicate),/Duplicate/);assert.equal(JSON.stringify(duplicate),original);
 for(const atk of ['Infinity','NaN',Infinity])assert.throws(()=>validateSave({...save,stash:[{...item,atk}]}),/Invalid item atk/);
});

test('D200 speedrun time requires an eligible completed D200 milestone',()=>{
 const base={...save,maxDungeon:200,onlineProgress:{attemptId:'run-a',deepestCleared:200,activeMs:7200000,timerMetric:'combat-v1',timingEligible:true,milestones:{200:{activeMs:6660000}}}};
 assert.equal(completedD200Time(base),6660000);
 assert.equal(completedD200Time({...base,onlineProgress:{...base.onlineProgress,timerMetric:'legacy-active'}}),null,'old timed browser runs cannot enter combat leaderboard');
 assert.equal(safeProgress(base).attemptId,'run-a');
 assert.equal(completedD200Time({...base,onlineProgress:{...base.onlineProgress,deepestCleared:199}}),null);
 assert.equal(completedD200Time({...base,onlineProgress:{...base.onlineProgress,timingEligible:false}}),null);
 assert.equal(completedD200Time({...base,onlineProgress:{...base.onlineProgress,milestones:{}}}),null);
 assert.equal(completedD200Time({...save,maxDungeon:200}),null,'legacy saves must not invent a completion time');
 assert.equal(safeProgress(save).attemptId,'legacy','old saves remain readable');
 assert.throws(()=>validateSave({...base,onlineProgress:{...base.onlineProgress,attemptId:'a/b'}}),/attempt ID/);
});
test('Belt and armor category validation stays compatible with legacy saves',()=>{
 const belt={id:'belt',name:'Woven Belt',slot:'belt',subtype:'Belt',armorType:'Leather',tier:5,rarity:'Rare',agi:1,def:11,hp:20};
 const profile={...save,equip:{belt}};
 assert.deepEqual(validateSave(profile),profile);assert.deepEqual(validateSave(save),save);
 assert.throws(()=>validateSave({...save,equip:{belt:{...belt,armorType:'Hybrid'}}}),/armor type/);
 assert.throws(()=>validateSave({...save,stash:[{...belt,slot:'weapon'}]}),/armor type/);
});
test('optional Leather Evasion Rating accepts old saves and rejects invalid new values',()=>{
 const item={id:'leather',name:'Leather Vest',slot:'armor',armorType:'Leather',tier:5,rarity:'Rare',evasionRating:10};
 assert.equal(validateSave({...save,stash:[item]}).stash[0].evasionRating,10);
 for(const evasionRating of [-1,Infinity,NaN,false])assert.throws(()=>validateSave({...save,stash:[{...item,evasionRating}]}),/Evasion/);
 assert.throws(()=>validateSave({...save,stash:[{...item,armorType:'Cloth'}]}),/Evasion/);
});
