import test from 'node:test';import assert from 'node:assert/strict';
import {CHARACTERS,nicknameKey,validateSave,recoverInterruptedSave,syncDecision,cloudRecord,compareRevision,safeProgress} from '../online/model.mjs';
const save={gold:8,fragments:3,maxDungeon:10,stash:[],equip:{},run:null};
test('five cosmetic characters and normalized unique nickname keys',()=>{assert.equal(CHARACTERS.length,5);assert.equal(nicknameKey(' Tester_1 '),'tester_1');assert.throws(()=>nicknameKey('a/b'));});
test('no empty cloud or signed-in account silently replaces local progress',()=>{assert.equal(syncDecision(save,null),'choose-upload');assert.equal(syncDecision(save,{payload:JSON.stringify({...save,gold:0})}),'choose-conflict');assert.equal(syncDecision(save,{payload:JSON.stringify(save)}),'identical');});
test('revision conflict and save validation',()=>{assert.throws(()=>compareRevision({revision:3},2));assert.equal(cloudRecord(save,3).revision,4);assert.throws(()=>validateSave({...save,run:{}}));assert.throws(()=>validateSave({...save,gold:-1}));assert.throws(()=>validateSave({...save,equip:[]}));assert.deepEqual(validateSave(save),save);});
test('legacy import never invents timed clears or D100 completion',()=>{const p=safeProgress({...save,maxDungeon:100});assert.equal(p.deepestCleared,99);assert.equal(p.timingEligible,false);assert.deepEqual(p.milestones,{});});

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
 for(const atk of ['Infinity','NaN',Infinity])assert.throws(()=>validateSave({...save,stash:[{...item,atk}]}),/stats/);
});
