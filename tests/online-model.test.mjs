import test from 'node:test';import assert from 'node:assert/strict';
import {CHARACTERS,nicknameKey,validateSave,syncDecision,cloudRecord,compareRevision,safeProgress} from '../online/model.mjs';
const save={gold:8,fragments:3,maxDungeon:10,stash:[],equip:{},run:null};
test('five cosmetic characters and normalized unique nickname keys',()=>{assert.equal(CHARACTERS.length,5);assert.equal(nicknameKey(' Tester_1 '),'tester_1');assert.throws(()=>nicknameKey('a/b'));});
test('no empty cloud or signed-in account silently replaces local progress',()=>{assert.equal(syncDecision(save,null),'choose-upload');assert.equal(syncDecision(save,{payload:JSON.stringify({...save,gold:0})}),'choose-conflict');assert.equal(syncDecision(save,{payload:JSON.stringify(save)}),'identical');});
test('revision conflict and save validation',()=>{assert.throws(()=>compareRevision({revision:3},2));assert.equal(cloudRecord(save,3).revision,4);assert.throws(()=>validateSave({...save,run:{}}));assert.throws(()=>validateSave({...save,gold:-1}));assert.throws(()=>validateSave({...save,equip:[]}));assert.deepEqual(validateSave(save),save);});
test('legacy import never invents timed clears or D100 completion',()=>{const p=safeProgress({...save,maxDungeon:100});assert.equal(p.deepestCleared,99);assert.equal(p.timingEligible,false);assert.deepEqual(p.milestones,{});});
