'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const S=require('../scripts/simulate-progression.cjs');

test('role matrix parses Affinity × room size without altering combat settings',()=>{
 const o=S.parseArgs(['--mode=roles','--levels=1','--seeds=9101','--builds=blood-fury','--affinities=blood,decay','--group-sizes=1,4,12,20','--points=0']);
 assert.equal(o.mode,'roles');
 assert.deepEqual(o.affinities,['blood','decay']);
 assert.deepEqual(o.groupSizes,[1,4,12,20]);
 assert.equal(o.targetPolicy,'focus');
});

test('role matrix captures real roster, Affinity skills and live/reinforcement limits',()=>{
 const o=S.parseArgs(['--mode=roles','--levels=1','--seeds=9101','--builds=blood-fury','--affinities=blood,magic','--group-sizes=4,12','--points=0','--tick-limit=900']);
 const report=S.simulate(o);
 assert.equal(report.summary.cases,4);
 assert.equal(report.summary.errors,0,JSON.stringify(report.rows.filter(r=>r.error)));
 for(const row of report.rows){
  assert.equal(row.mode,'roles');
  assert.equal(row.roster.length,row.groupSize);
  assert(row.initialVisible<=4&&row.initialVisible>=1);
  assert.equal(row.initialReserve,row.groupSize-row.initialVisible);
  assert.equal(Object.values(row.initialRoles).reduce((a,b)=>a+b,0),row.groupSize);
  assert(row.roster.every(e=>e.affinity===row.affinity&&['minion','tank','skirmisher','caster'].includes(e.role)));
  assert(row.roster.filter(e=>e.role!=='minion').every(e=>typeof e.ability==='string'&&e.ability.length>0));
  assert(row.roster.filter(e=>e.role==='minion').every(e=>e.ability===null));
 }
});
