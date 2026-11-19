'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const C=require('../scripts/v013-elite-tank-parity.cjs');
test('Controlled native E1 one-vs-one starts from real starter gear without bonus levels or XP',()=>{
 const n=C.scenario(9501,'tank','starter'),e=C.scenario(9501,'elite','starter');
 assert.equal(n.initial.playerHp,e.initial.playerHp);
 assert.equal(n.family,e.family);
 assert.equal(n.initial.eliteType,null);
 assert(e.initial.eliteType&&e.initial.role==='miniboss');
 assert.equal(n.initial.playerMaxHp,e.initial.playerMaxHp);
 assert(n.seconds>0&&e.seconds>0);
 assert(n.hpMax===e.hpMax);
 assert(n.initial.hp>0&&e.initial.hp>0);
 assert(n.gearFingerprint&&e.gearFingerprint);
});
test('Common fixed-gear diagnostic keeps same native hero starting HP between Tank and Elite',()=>{
 const n=C.scenario(9502,'tank','common'),e=C.scenario(9502,'elite','common');
 assert.equal(n.initial.playerHp,e.initial.playerHp);
 assert.equal(n.initial.playerDefense,e.initial.playerDefense);
 assert.equal(n.initial.playerMaxHp,e.initial.playerMaxHp);
 assert(e.initial.stage82===true||e.initial.stage82===false);
});
test('Paired cohort records truly native tank-roster encounters and does not manufacture wins',()=>{
 const x=C.compare({seedStart:9520,scan:35,pairCap:2,gearModes:['starter']});
 assert.equal(x.errors.length,0,JSON.stringify(x.errors));
 assert.equal(x.pairs.length,2);
 for(const {tank,elite} of x.pairs){
  assert.equal(tank.initial.role,'tank');
  assert.equal(elite.initial.role,'miniboss');
  assert.equal(tank.initial.playerHp,elite.initial.playerHp);
  assert.equal(tank.won,tank.status==='cleared');
  assert.equal(elite.won,elite.status==='cleared');
 }
});

test('E1 Elites must be more dangerous than normal Tanks in independent paired native combat cohorts',()=>{
 const coverage=C.scanEliteCoverage({seedStart:9470,scan:500,expected:8});
 assert.equal(coverage.errors.length,0,JSON.stringify(coverage.errors.slice(0,2)));
 assert.equal(Object.keys(coverage.counts).length,8,'all eight archetypes must appear in an independent, larger native-seed coverage scan');
 const result=C.compare({seedStart:9470,scan:160,pairCap:24,gearModes:['starter','common']});
 assert.equal(result.errors.length,0,JSON.stringify(result.errors.slice(0,2)));
 for(const gear of ['starter','common']){
  const row=result.summary[gear];
  assert.equal(row.pairs,24,'both comparisons need sufficient native Tanks');
  assert(Object.keys(row.byEliteType||{}).every(id=>coverage.counts[id]>0),
   'all types reported in the 24-pair sample must be genuine members of the native eight-type roster');
  assert.equal(Object.values(row.byEliteType).reduce((sum,r)=>sum+r.pairs,0),24,
   'per-archetype reports must account for every matched pair');
  assert(row.eliteMeanDamageTaken>row.tankMeanDamageTaken,
   gear+' Elites should cause more damage than the exact same-seed solo Tanks: '+JSON.stringify(row));
  assert(row.eliteMeanSeconds<row.tankMeanSeconds,
   gear+' Elite threat should not be produced solely by longer HP-sponge fights');
 }
 assert(result.summary.starter.eliteWins<=result.summary.starter.tankWins,
  'Elites must not be safer to defeat than the normal Tank under native E1 starter conditions');
});
