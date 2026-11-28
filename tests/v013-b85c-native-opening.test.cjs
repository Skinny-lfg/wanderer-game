'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),P=require('../scripts/v013-b85c-native-opening-validation.cjs');
test('Native B2 equals the approved experimental source, all unrelated budgets unchanged',()=>{const r=P.staticGate();assert.equal(r.cases,672);assert.equal(r.changed,2);assert.equal(r.unchanged,670);});
