'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {failedNames,analyze}=require('../scripts/v013-legacy-audit.cjs');
const baseline=JSON.parse(fs.readFileSync(path.join(__dirname,'../reports/v013-stage45-3-general-suite-baseline.json'),'utf8'));
test('historical failure inventory lists 106 distinct failures from the actual incomplete checkout',()=>{
 assert.equal(baseline.items.length,106);
 assert.equal(new Set(baseline.items.map(item=>item.name)).size,106);
 assert.equal(baseline.failing,106);
 assert.match(baseline.environment,/incomplete local source/);
});
test('comparison explicitly detects a new failure without hiding historical red tests',()=>{
 const tap=['TAP version 13','# Subtest: old',`not ok 1 - ${baseline.items[0].name}`,'  ---','  ...',
  '# Subtest: new','not ok 2 - a genuinely new failure','  ---','  ...'].join('\n');
 assert.deepEqual(failedNames(tap),[baseline.items[0].name,'a genuinely new failure']);
 const report=analyze(tap,baseline);
 assert.deepEqual(report.newFailures,['a genuinely new failure']);
 assert.equal(report.resolvedFailures.length,105);
 assert.equal(report.currentFailures,2);
});
test('comparison does not call a known red suite green, even without new failures',()=>{
 const tap=baseline.items.map((item,i)=>`not ok ${i+1} - ${item.name}`).join('\n');
 const report=analyze(tap,baseline);
 assert.equal(report.currentFailures,106);
 assert.deepEqual(report.newFailures,[]);
 assert.deepEqual(report.resolvedFailures,[]);
});
