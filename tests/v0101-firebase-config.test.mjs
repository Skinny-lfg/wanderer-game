import test from 'node:test';
import assert from 'node:assert/strict';
import {firebaseConfig,assertProductionFirebaseConfig,firebaseEnvironment} from '../online/firebase-config.mjs';

test('new production uses only wanderer-play Firebase Web App',()=>{
 assert.equal(firebaseEnvironment,'production');
 assert.equal(firebaseConfig.projectId,'wanderer-play');
 assert.equal(firebaseConfig.authDomain,'wanderer-play.firebaseapp.com');
 assert.equal(firebaseConfig.messagingSenderId,'761358319947');
 assert.equal(assertProductionFirebaseConfig(firebaseConfig),firebaseConfig);
});
test('production refuses old project, development project, or mixed Web App identifiers',()=>{
 for(const projectId of ['wanderer-development-8e3ee','wanderer-test-8f062','SET_DEVELOPMENT_PROJECT_ID']){
  assert.throws(()=>assertProductionFirebaseConfig({...firebaseConfig,projectId}),/dedicated wanderer-play/);
 }
 assert.throws(()=>assertProductionFirebaseConfig({...firebaseConfig,authDomain:'wanderer-development-8e3ee.firebaseapp.com'}),/dedicated wanderer-play/);
 assert.throws(()=>assertProductionFirebaseConfig({...firebaseConfig,messagingSenderId:'180691461185'}),/dedicated wanderer-play/);
 assert.throws(()=>assertProductionFirebaseConfig({...firebaseConfig,apiKey:'PLACEHOLDER'}),/dedicated wanderer-play/);
});
