'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const E=require('../scripts/v013-stage616-encounter-types.cjs');
const T=globalThis.WandererAutomaticTalents;
test('Exact eight real native group sizes plus Elite and Boss are distinct',()=>{
 assert.deepEqual(E.ALL_GROUPS,[1,2,3,4,6,8,12,20]);
 assert.deepEqual(E.KINDS,[...'1234681220'].length===-1?[]:
  ['normal-1','normal-2','normal-3','normal-4','normal-6','normal-8','normal-12','normal-20','elite','boss']);
 assert.equal(new Set(E.KINDS).size,10);
});
test('Stage 6.16 report maps all eight native Elite IDs to in-game names only for display',()=>{
 const expected={
  tank:'Gravebound Bulwark',
  berserker:'Bloodscar Ravager',
  vampire:'Sanguine Wraith',
  caster:'Voidborne Hexer',
  gravecaller:'Gravecaller',
  oathbound_exarch:'Oathbound Exarch',
  briarspine_horror:'Briarspine Horror',
  ashen_executioner:'Ashen Executioner'
 };
 assert.deepEqual(E.ELITE_DISPLAY_NAMES,expected);
 for(const [id,name] of Object.entries(expected))assert.equal(E.eliteDisplayName(id),name);
 assert.equal(E.eliteDisplayName('unknown-native-id'),'unknown-native-id');
});
test('Pilot subset and 8-seed matrix cover six Realms, four legal E budgets, two profiles, eight sizes',()=>{
 const pilot=E.plan(E.DEFAULTS);
 const full=E.plan({...E.DEFAULTS,seedsPerCell:8});
 assert.equal(pilot.matchedSets,96);assert.equal(pilot.fights,960);
 assert.equal(full.matchedSets,384);assert.equal(full.fights,3840);
 assert.equal(full.seedStarts,384);
 assert.deepEqual(full.budgets,[12,24,36,60]);
 assert.equal(full.distinctProfiles>=6,true);
 for(const r of pilot.rows){
  const f=full.rows.find(x=>x.id===r.id);assert(f);
  assert.equal(r.seed,f.seed);assert.deepEqual(r.gear,f.gear);
  assert.deepEqual(r.talents,f.talents);
 }
 for(const r of full.rows){
  assert.equal(T.valid(r.talents),true);
  assert.equal(T.earned(r.talents),r.budget);
 }
});
test('One true native ten-way encounter family matches ALL player gear/Talents/Realm/seed/condition',()=>{
 const r=E.plan({...E.DEFAULTS,seedsPerCell:1,budgets:[24]}).rows[0];
 const fights=E.matched(r,E.DEFAULTS);
 assert.equal(Object.keys(fights.checks).length,14);
 assert(Object.values(fights.checks).every(Boolean));
 assert.equal(Object.keys(fights.arms).length,10);
 assert.deepEqual(E.ALL_GROUPS.map(n=>fights.arms['normal-'+n].native.groupSize),E.ALL_GROUPS);
 assert.equal(fights.arms.boss.native.bossId!==null,true);
 assert.equal(fights.arms.elite.native.eliteType!==null,true);
 for(const kind of E.KINDS){
  assert.equal(fights.arms[kind].native.nativeEncounter,kind.startsWith('normal-')?'normal':kind);
  assert.equal(fights.arms[kind].native.risk,1);
  assert.equal(fights.arms[kind].native.pointsBudget,24);
  assert.equal(fights.arms[kind].native.timedOut,false);
 }
 const s=E.summary([fights]);
 assert.equal(s.matchedSets,1);assert.equal(s.actualFights,10);
 assert.equal(s.matchedVerified,1);
 assert.equal(s.perGroup.length,8);
 assert.equal(s.kinds.elite.n,1);
 assert.equal(s.kinds.boss.n,1);
 assert.equal(Object.values(s.byBoss).reduce((a,x)=>a+x.n,0),1);
 assert.equal(Object.values(s.byElite).reduce((a,x)=>a+x.n,0),1);
 assert.equal(Object.values(s.bySoloRole).reduce((a,x)=>a+x.n,0),1);
});
test('Cross-kind drift to gear, Talent and native count is immediately rejected',()=>{
 const r=E.plan({...E.DEFAULTS,seedsPerCell:1,budgets:[24]}).rows[0];
 const a=E.matched(r,E.DEFAULTS),clone=()=>({...a.arms});
 let arms=clone();arms.boss={...arms.boss,equalGearFingerprint:'INVALID'};
 assert.throws(()=>E.verify(r,arms),/sameRolledGear/);
 arms=clone();arms.elite={...arms.elite,exactTalentNodes:[]};
 assert.throws(()=>E.verify(r,arms),/sameTalentNodes/);
 arms=clone();arms['normal-12']={...arms['normal-12'],native:{...arms['normal-12'].native,groupSize:3}};
 assert.throws(()=>E.verify(r,arms),/actualRequestedGroupSize/);
});
test('Source and CLI are locked to real native Risk=1 and Rare synthetic rarity',()=>{
 assert.throws(()=>E.parse(['--risk=2']),/Invalid/);
 assert.throws(()=>E.parse(['--rarity=Epic']),/Invalid/);
 assert.throws(()=>E.parse(['--tick-limit=20000']),/Invalid/);
 assert.throws(()=>E.parse(['--seeds-per-cell=20']),/Invalid/);
 assert.throws(()=>E.parse(['--budgets=200']),/Invalid/);
 assert.throws(()=>E.parse(['--mode=balance']),/Unsupported/);
 assert.throws(()=>E.parse(['--out=file.csv']),/Unsupported/);
 const good=E.parse(['--mode=matrix','--seeds-per-cell=8','--risk=1']);
 assert.equal(good.mode,'matrix');assert.equal(good.seedsPerCell,8);
});
test('Per-name solo mobs are only counted on real native solo encounters',()=>{
 const r=E.plan({...E.DEFAULTS,seedsPerCell:1,budgets:[24]}).rows[0],m=E.matched(r,E.DEFAULTS);
 const s=E.summary([m]),solo=m.arms['normal-1'].initial[0];
 assert.equal(s.bySoloName[solo.name].n,1);
 assert.equal(s.bySoloName[solo.name].role,solo.role);
 assert.equal(s.bySoloName[solo.name].wins,Number(m.arms['normal-1'].won));
 for(const [name,v] of Object.entries(s.bySoloName))
  assert.equal(v.n,Object.values(m.arms).filter(x=>x.kind==='normal-1'&&x.initial.some(e=>e.name===name)).length);
 assert.equal(s.bySoloRole.minion.n,0);
});
test('Strict native checkpoint integrity forbids lying about test count or player parity',()=>{
 const row=E.plan({...E.DEFAULTS,seedsPerCell:1,budgets:[24]}).rows[0],m=E.matched(row,E.DEFAULTS);
 const inp={stage:'6.16',type:'ten-way-native-enemy-granular-audit',configHash:'abc',plannedIds:[m.id]};
 const prev={...inp,completed:1,results:[m]};
 assert.doesNotThrow(()=>E.guardCheckpoint(prev,inp));
 assert.throws(()=>E.guardCheckpoint({...prev,completed:2},inp),/Unsafe/);
 assert.throws(()=>E.guardCheckpoint({...prev,results:[{...m,id:'ALTERED'}]},inp),/Corrupt/);
 assert.throws(()=>E.guardCheckpoint({...prev,results:[{...m,checks:{...m.checks,sameRolledGear:false}}]},inp),/Corrupt/);
});
