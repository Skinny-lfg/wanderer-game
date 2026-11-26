'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {attunementMismatch}=require('../scripts/v013-b12c1-advanced-agent-audit.cjs');
const owned=['affinity_arcane','element_choice'];
test('native implicit Arcane is valid with null, absent, or explicit Arcane storage',()=>{
 for(const mode of [null,undefined,'arcane'])assert.equal(attunementMismatch('arcane',owned,mode),false);
});
test('wrong explicit or implicit attunement remains a violation',()=>{
 for(const mode of ['fire','frost','lightning']){
  assert.equal(attunementMismatch('arcane',owned,mode),true);
  assert.equal(attunementMismatch(mode,owned,null),true);
  assert.equal(attunementMismatch(mode,owned,mode),false);
  for(const other of ['arcane','fire','frost','lightning'].filter(x=>x!==mode))assert.equal(attunementMismatch(mode,owned,other),true);
 }
});
test('unearned attunement or unspecified profile is not a mismatch',()=>{
 assert.equal(attunementMismatch('fire',['affinity_arcane'],null),false);
 assert.equal(attunementMismatch(null,owned,'fire'),false);
});
