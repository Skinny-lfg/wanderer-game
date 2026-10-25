import test from 'node:test';
import assert from 'node:assert/strict';
import {firebaseConfig,assertDevFirebaseConfig} from '../online/firebase-config.mjs';

test('development Firebase config is accepted and both known production projects are blocked',()=>{
 assert.equal(assertDevFirebaseConfig(firebaseConfig),firebaseConfig);
 for(const projectId of ['wanderer-play','wanderer-test-8f062']){
  assert.throws(()=>assertDevFirebaseConfig({...firebaseConfig,projectId,authDomain:projectId+'.firebaseapp.com'}),/production Firebase/);
 }
});
