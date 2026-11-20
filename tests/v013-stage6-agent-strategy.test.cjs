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

test('Controlled native Two-Handed combat actually produces measurable non-focused damage',()=>{
 // Controlled fixture only, NOT a natural-account progression result.
 const a=create(9477,undefined,{}, {skipPersistence:true});
 a.setup(35,'Two-Handed','Legendary');
 a.setUnlocked(35);
 a.start(35,true);
 const c=a.controller(),card=c.state.dungeon.cards[0];
 c.chooseRealm(card.id);
 assert(c.visitRoom(2),'native 2–4 enemy Vanguard room is reachable');
 assert(a.enter());
 const before=N.capabilities(a);
 assert.equal(before.weapon,'Two-Handed');
 assert(before.areaReady);
 assert(a.state().run.totalMobCount>1,'native room must contain a group');
 const fight=N.fightNatural(a,N.PROFILES.daring,4500,{decisionModel:'adaptive',capabilities:before});
 assert(fight.updateCalls>0);
 assert(fight.observedNonFocusedHealthLost>0,'native built-in Cleave must reach live non-focused enemies');
 assert(fight.damageDealt>=fight.observedNonFocusedHealthLost);
});

test('Multi-Affinity progression and AoE/single-target hybrid are different dimensions',()=>{
 const two=build('Wand',['affinity_magic','affinity_decay','hex_bolt'],{element:'frost'});
 assert.equal(two.affinityComposition,'mixed');
 assert.deepEqual(two.affinities,['magic','decay']);
 assert.equal(two.synergyStage,'mixed-skill-unlocked');
 assert.equal(two.role,'developing','owning a mixed Affinity skill does not invent multi-target damage');
 const unformed=build('Wand',['root_magic','root_decay'],{element:'arcane'});
 assert.equal(unformed.affinityComposition,'unformed','mere roots do not grant Affinity abilities');
 const cleave=build('Two-Handed',['double_strike','affinity_blood']);
 assert.equal(cleave.role,'hybrid','both damage modes can occur within one Affinity');
 assert.equal(cleave.affinityComposition,'focused');
});
test('Single-target player finishes wounded enemies, only switches toward a caster when needed',()=>{
 const current={hp:15,maxhp:80,role:'tank'},caster={hp:40,maxhp:40,role:'caster'};
 const cap=build('Daggers',['double_strike','precision']);
 assert.equal(cap.focusReady,true);
 const run={status:'fight',enemy:current,enemies:[current,caster]};
 assert.equal(A.selectTarget(run,cap,caster),current);
 current.hp=80;
 assert.equal(A.selectTarget(run,cap,current),caster);
});
test('Read-only telemetry includes a native kill removed from active enemy roster',()=>{
 const focused={hp:60,boss:true},other={hp:18,role:'minion'};
 const run={enemies:[focused,other]},before=A.snapshot(run);
 other.hp=0;run.enemies.splice(1,1);
 const value=A.changes(before,A.snapshot(run),focused);
 assert.equal(value.nonFocusedHp,18);
 assert.equal(value.roles.minion,18);
 assert.equal(value.disappeared,1);
});
test('Decision-component isolation never grants AoE or alters native gear',()=>{
 const original=N.policyFlags('risk-aware');
 const modes=['adaptive-realms','adaptive-rooms','adaptive-targets','adaptive-retreat'];
 const parts=['realm','rooms','targets','retreat'];
 assert(parts.every((part,i)=>N.policyFlags(modes[i])[part]===true));
 assert(parts.every(part=>original[part]===false));
 assert(parts.every(part=>N.policyFlags('adaptive')[part]===true));
 assert.throws(()=>N.policyFlags('everything-free'),/Unknown/);
});
