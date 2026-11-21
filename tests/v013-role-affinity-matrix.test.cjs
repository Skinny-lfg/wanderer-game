'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const S=require('../scripts/simulate-progression.cjs');

test('role matrix parses Affinity × room size without altering combat settings',()=>{
 const o=S.parseArgs(['--mode=roles','--levels=1','--seeds=9101','--builds=blood-fury','--affinities=blood,decay','--group-sizes=1,4,12,20','--role-effects=baseline,trait,condition,both','--points=0']);
 assert.equal(o.mode,'roles');
 assert.deepEqual(o.affinities,['blood','decay']);
 assert.deepEqual(o.groupSizes,[1,4,12,20]);
 assert.equal(o.targetPolicy,'focus');
 assert.deepEqual(o.roleEffects,['baseline','trait','condition','both']);
});

test('role matrix captures real roster, Affinity skills and live/reinforcement limits',()=>{
 const o=S.parseArgs(['--mode=roles','--levels=1','--seeds=9101','--builds=blood-fury','--affinities=blood,magic','--group-sizes=4,12','--role-effects=baseline','--points=0','--tick-limit=900']);
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

test('native role matrix combines compatible Traits and map Conditions without gameplay constants',()=>{
 const o=S.parseArgs(['--mode=roles','--levels=1','--seeds=9101','--builds=blood-fury',
  '--affinities=blood,decay','--group-sizes=4','--role-effects=baseline,trait,condition,both',
  '--points=0','--tick-limit=900']);
 const report=S.simulate(o);
 assert.equal(report.summary.cases,8);
 assert.equal(report.summary.errors,0,JSON.stringify(report.rows.filter(r=>r.error)));
 assert.equal(new Set(report.rows.map(r=>r.roleEffect)).size,4);
 const F=globalThis.WandererV013ExpeditionFoundation;
 for(const row of report.rows){
  assert.equal(row.requestedGroupSize,4);
  assert.equal(row.groupSize,row.initialEnemies,'native Conditions may change enemy count');
  assert.equal(row.roster.length,row.initialEnemies);
  assert(F.lookup('conditions',row.plannedConditionId).families.includes(row.affinity));
  const expectTrait=['trait','both'].includes(row.roleEffect);
  assert.equal(!!row.traitId,expectTrait);
  assert.equal(row.traitFixtureInjected,expectTrait);
  if(expectTrait)assert(F.lookup('encounterTraits',row.traitId).families.includes(row.affinity));
  if(row.conditionNaturallyMarked)assert(['condition','both'].includes(row.roleEffect));
  if(row.roleEffect==='baseline')assert.equal(row.conditionNaturallyMarked,false);
  assert.equal(row.initialReserve,row.initialEnemies-row.initialVisible);
 }
});

test('all seven weapon archetypes work with native talents and optional runes',()=>{
 const weapons=new Set(S.BUILDS.map(b=>b.weapon));
 assert.deepEqual([...weapons].sort(),['Sword','Mace','Two-Handed','Daggers','Bow','Wand','Staff'].sort());
 for(const [label,points,runes,rarity] of [['common',0,false,'Common'],['geared',24,true,'Rare']]){
  const o=S.parseArgs(['--mode=roles','--levels=1','--seeds=9101',
   '--builds='+S.BUILDS.map(b=>b.id).join(','),
   '--affinities=blood','--group-sizes=4','--role-effects=baseline',
   '--points='+points,'--runes='+runes,'--rarity='+rarity,'--tick-limit=900']);
  const result=S.simulate(o);
  // Seven distinct weapon families are exercised by eight current native
  // simulation archetypes (two different Staff talent paths).
  assert.equal(result.rows.length,S.BUILDS.length,label);
  assert.equal(new Set(result.rows.map(row=>S.BUILDS.find(b=>b.id===row.build)?.weapon)).size,7,label+' weapon families');
  assert.equal(result.summary.errors,0,label+': '+JSON.stringify(result.rows.filter(r=>r.error)));
  for(const row of result.rows){
   assert.equal(row.runes,runes);
   assert.equal(row.pointsBudget,points);
   assert.equal(row.roster.length,4);
  }
 }
});
