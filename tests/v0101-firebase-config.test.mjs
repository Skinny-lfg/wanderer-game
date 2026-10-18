import test from 'node:test';
import assert from 'node:assert/strict';
import {firebaseConfig,assertDevFirebaseConfig} from '../online/firebase-config.mjs';

const dev={
 projectId:'wanderer-dev-test',apiKey:'AIzaDevelopmentOnlyExample',
 authDomain:'wanderer-dev-test.firebaseapp.com',appId:'1:999999:web:development',
 messagingSenderId:'999999',storageBucket:'wanderer-dev-test.firebasestorage.app'
};

test('development rejects blank and placeholder Firebase credentials',()=>{
 assert.throws(()=>assertDevFirebaseConfig(firebaseConfig),/not configured/i);
 assert.throws(()=>assertDevFirebaseConfig({...dev,projectId:'SET_DEVELOPMENT_PROJECT_ID'}),/not configured/i);
 assert.equal(assertDevFirebaseConfig(dev).projectId,'wanderer-dev-test');
});

test('development refuses every known production Firebase identifier',()=>{
 assert.throws(()=>assertDevFirebaseConfig({...dev,projectId:'wanderer-test-8f062'}),/production/i);
 assert.throws(()=>assertDevFirebaseConfig({...dev,authDomain:'wanderer-test-8f062.firebaseapp.com'}),/production/i);
 assert.throws(()=>assertDevFirebaseConfig({...dev,messagingSenderId:'180691461185'}),/production/i);
 assert.throws(()=>assertDevFirebaseConfig({...dev,appId:'1:180691461185:web:3a423d32244aad3e41d2c0'}),/production/i);
});
