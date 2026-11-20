'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const A=require('../scripts/v013-agent-strategy.cjs');
const N=require('../scripts/v013-natural-progression.cjs');
const create=require('./v012-economy-harness.cjs');
const build=(weapon,talentIds=[],extra={})=>A.classify({
 equipment:{weapon:{slot:'weapon',subtype:weapon},...(extra.equipment||{})},
 talents:{nodes:talentIds,element:extra.element||null,prepared:extra.prepared||null},
 build:{picks:[]}
});
test('No free AoE capacity from profile names or unearned target wishes',()=>{
 const raw=build('Wand',[],{element:'fire'});
 assert.equal(raw.areaReady,false);
 assert.equal(raw.role!=='aoe',true);
 assert.equal(build('Staff',['fire_spread'],{element:'frost'}).areaReady,false);
});
test('Real Two-Handed, Bow, Lightning Chain, Wildfire and Fan of Blades count as AoE',()=>{
 for(const sample of [
  build('Two-Handed'),build('Bow'),
  build('Staff',['overcharge'],{element:'lightning'}),
  build('Wand',['fire_spread'],{element:'fire'}),
  build('Daggers',['fan_of_blades'])
 ])assert(sample.areaReady,JSON.stringify(sample));
});
test('Focus, hybrid and defense are measured from actual owned kit',()=>{
 assert.equal(build('Wand',['lightning_focus'],{element:'lightning'}).role,'single-target');
 assert.equal(build('Two-Handed',['double_strike']).role,'hybrid');
 assert.equal(build('Mace',[],{equipment:{armor:{armorType:'Plate'},offhand:{subtype:'Shield'}}}).role,'defensive');
 assert.equal(build('Staff',['overcharge','lightning_focus'],{element:'lightning'}).areaReady,false,
  'Focused Discharge removes Lightning chaining');
});
test('Realm preference sees known Boss counters but no hidden modifiers',()=>{
 const cap=build('Staff',['overcharge'],{element:'lightning'});
 const a=A.realmPreference(cap,{family:'decay',risk:0},{conditionId:'relentless_hunt'});
 const b=A.realmPreference(cap,{family:'vitality',risk:0},{conditionId:'relentless_hunt'});
 assert(a.score>b.score,'area combat should value Matriarch brood more than Mawbuds');
 assert(!Object.keys(a).includes('unknownBossModifierIds'));
 const focus=build('Wand',['lightning_focus'],{element:'lightning'});
 assert(A.realmPreference(focus,{family:'vitality'},{}).score>A.realmPreference(cap,{family:'vitality'},{}).score);
});
test('Adaptive route chooses actual AoE-friendly visible group, baseline still prefers solo',()=>{
 const card={nodes:[{kind:'entrance'},{kind:'combat',range:[1,1]},{kind:'combat',range:[6,12]},{kind:'boss'}],
  edges:[[0,1],[0,2],[1,3],[2,3]]};
 const state={stage:'choice',dungeon:{realm:'test',cards:[card],current:0,visited:[0],cleared:[0],scouted:[],steps:12,discoveredSecrets:[]}};
 const c={state,realmMap:()=>card,travelPath:i=>i===1||i===2?[0,i]:[],
  travelCost:p=>p.length-1};
 const vitals={hp:100,maxhp:100},profile=N.PROFILES.cautious;
 const baseline=N.selectRoom(c,profile,vitals);
 assert.equal(baseline.room,1);
 const trueAoe=N.selectRoom(c,profile,vitals,{capabilities:build('Staff',['overcharge'],{element:'lightning'})});
 assert.equal(trueAoe.room,2,'earn AoE before actively preferring grouped rooms');
 const weak=N.selectRoom(c,profile,vitals,{capabilities:build('Wand',[],{element:'fire'})});
 assert.equal(weak.room,1);
 const lowHp=N.selectRoom(c,profile,{hp:26,maxhp:100},{capabilities:build('Staff',['overcharge'],{element:'lightning'})});
 assert.equal(lowHp.room,1,'even AoE should favour survival when near death');
});
test('Target selection handles live Gravecaller minions, Matriarch brood, Heartroot and Stormglass anchor',()=>{
 const boss=(style)=>({hp:100,boss:true,bossStyle:style});
 const minion=(kind)=>({hp:20,role:'minion',stage84Minion:kind});
 const cap=build('Sword');
 const leader=boss('matriarch'),m1=minion('decay'),m2=minion('decay');
 assert.equal(A.selectTarget({status:'fight',enemies:[leader,m1,m2]},cap,leader),m1);
 const heart=boss('devourer');assert.equal(A.selectTarget({status:'fight',enemies:[heart,minion('vitality')]},cap,heart),heart);
 const storm=boss('conductor'),anchor={hp:10,role:'minion',stage84Node:true};
 assert.equal(A.selectTarget({status:'fight',enemies:[storm,anchor]},cap,storm),anchor);
 const elite={hp:90,miniboss:true,eliteType:'gravecaller'},summon={hp:16,role:'minion'};
 assert.equal(A.selectTarget({status:'fight',enemies:[elite,summon]},cap,elite),summon);
});
test('Combat attribution uses observed net HP/barrier and does not mutate combat',()=>{
 const boss={hp:100,barrier:12,boss:true},add={hp:32,barrier:0,role:'minion'};
 const r={enemies:[boss,add]},before=A.snapshot(r);
 boss.hp=91;boss.barrier=5;add.hp=22;
 const change=A.changes(before,A.snapshot(r),boss);
 assert.equal(change.roles.boss,9);assert.equal(change.roles.minion,10);
 assert.equal(change.wards.boss,7);assert.equal(change.nonFocusedHp,10);
 assert.equal(boss.hp,91);assert.equal(add.hp,22);
});
test('Natural adaptive E1 uses real equipment, visible offers and native combat telemetry',()=>{
 const config=N.parseArgs(['--seeds=9421','--profiles=magic-lightning','--max-level=1','--max-attempts=1']);
 const report=N.run(config),attempt=report.accounts[0].attempts[0];
 assert.equal(report.coverage.errors,0,JSON.stringify(attempt.error));
 assert.equal(attempt.realmEvaluations.length,3);
 assert(attempt.initialCapabilities);
 assert.equal(attempt.realmEvaluations.filter(x=>x.visibleOmen!==null).length,3);
 assert(attempt.rooms.length>0);
 for(const room of attempt.rooms){
  assert(room.capabilities);
  assert(['aoe','single-target','hybrid','defensive','developing'].includes(room.capabilities.role));
  assert.equal(room.strategy,'adaptive');
  assert(Number.isFinite(room.observedNonFocusedHealthLost));
  assert(Number.isFinite(room.observedHealthLostByRole.boss));
 }
 assert.equal(attempt.before.xp,0);
 assert.equal(attempt.before.earned,0);
});
