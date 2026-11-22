'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const C=require('../scripts/v013-stage623-earned-matched-enemies.cjs');
const N=require('../scripts/v013-natural-progression.cjs');
const S=require('../scripts/simulate-progression.cjs');
const create=require('./v012-economy-harness.cjs');
const clone=x=>JSON.parse(JSON.stringify(x));
const earned=()=>{
 const a=create(6230142,undefined,{}, {skipPersistence:true,now:1720006230142});
 const st=a.state(),p=st.automaticTalents;
 return {level:1,unlocked:1,equip:clone(st.equip),automaticTalents:clone(p),
  runes:clone(st.runes||[]),runeSlots:clone(st.runeSlots||[])};
};
test('Stage 6.23 registered plan requires native E1-to-E5 progress and bounded shards',()=>{
 const p=C.parse(['--seeds=9701','--profiles=cautious,balanced,smart-blood-fury-vitality']);
 assert.equal(p.native.maxLevel,5);
 assert.equal(p.native.maxAttempts,12);
 assert.equal(p.native.maxTotalAttempts,60);
 assert.equal(p.native.seeds.length*p.native.profiles.length,3);
 assert.equal(C.ELITES.length,8);
 assert.throws(()=>C.parse(['--seeds=9701,9702']),/at most 3|Natural cohort too large/);
 assert.throws(()=>C.parse(['--trials=5']),/bounded/);
 assert.throws(()=>C.parse(['--out=../escape.json']),/Unsafe/);
 assert.throws(()=>C.parse(['--mode=aggregate']),/directory/);
});
test('Native earned Camp checkpoint is read-only and accepts only genuine E4/E5 unlocked states',()=>{
 const a=create(6230144,undefined,{}, {skipPersistence:true,now:1720006230144});
 const before=JSON.stringify(a.state());
 const p={a,seed:6230144,profile:N.PROFILES.cautious,level:4,attempt:1};
 assert.throws(()=>C.checkpoint(p),/not naturally earned/);
 assert.equal(C.checkpoint({...p,level:1}),null);
 assert.equal(JSON.stringify(a.state()),before);
});
test('Null empty rune slots are valid native inventory state in an isolated read-only Camp fixture',()=>{
 const a=create(6230146,undefined,{}, {skipPersistence:true,now:1720006230146});
 // Unit-only setup: stage an E4 unlock to check serialization; never an earned-account observation.
 a.setUnlocked(4);
 const previous=JSON.stringify(a.state()),slots=a.state().runeSlots;
 assert(slots.some(id=>id===null));
 const cp=C.checkpoint({a,seed:6230146,profile:N.PROFILES.cautious,level:4,attempt:1});
 assert.equal(cp.level,4);
 assert.deepEqual(cp.state.runeSlots,JSON.parse(JSON.stringify(slots)));
 assert.equal(JSON.stringify(a.state()),previous,'Diagnostic capture cannot mutate the account');
});
test('Native simulation adapter strictly requires the exact earned gear/Talent signature',()=>{
 const e=earned(),build={id:'stage623-earned-smoke',weapon:e.equip.weapon.subtype,families:['blood'],skills:[]};
 const opts={mode:'encounter',points:globalThis.WandererAutomaticTalents.earned(e.automaticTalents),
  gear:'current',rarity:'Common',runes:false,targetPolicy:'mechanics',tickLimit:4500,
  contracts:'none',measure:true,lockScenarioStreams:true,
  controlledTalents:e.automaticTalents,earnedCheckpoint:e};
 assert.equal(e.level,1);
 const r=S.encounter(1,build,6230142,'normal',opts,undefined,undefined,undefined,1,1);
 assert.equal(r.nativeEncounter,'normal');
 assert.equal(r.level,1);
 assert.equal(r.pointsBudget,opts.points);
 assert.equal(r.offhandType,e.equip.offhand?.subtype||null);
 assert(!r.timedOut);
 const bad=clone(e);bad.unlocked=0;
 assert.throws(()=>S.encounter(1,build,6230142,'normal',{...opts,earnedCheckpoint:bad},undefined,undefined,undefined,1,1),/Invalid earned/);
 const blocked=clone(e);blocked.equip.weapon.subtype='Staff';
 assert.throws(()=>S.encounter(1,build,6230142,'normal',{...opts,earnedCheckpoint:blocked},undefined,undefined,undefined,1,1),/Invalid earned/);
});
test('Cross-role parity checks fail on gear, RNG, Affinity, HP and talent drift',()=>{
 const fixture={gearFingerprint:'a',offhandType:'Orb',offhandTrait:null,
  talentNodes:['affinity_magic'],talentMode:'fire',resolvedSeed:55,seedShift:0,
  affinity:'magic',risk:1,conditionId:'veiled_passages',hpMax:120,hpStart:120,
  mpMax:70,mpStart:70,targetPolicy:'mechanics'};
 const normal={...fixture,initialRoles:{tank:1}};
 const elite={...fixture,initialRoles:{elite:1}};
 const boss={...fixture,initialRoles:{boss:1}};
 assert(Object.values(C.verify({},normal,elite,boss)).every(Boolean));
 assert.throws(()=>C.verify({},normal,{...elite,gearFingerprint:'changed'},boss),/sameEarnedEquipment/);
 assert.throws(()=>C.verify({},normal,elite,{...boss,resolvedSeed:56}),/sameRealScenarioSeed/);
 assert.throws(()=>C.verify({},normal,elite,{...boss,affinity:'blood'}),/sameNativeRealmAndRisk/);
 assert.throws(()=>C.verify({},normal,{...elite,hpStart:119},boss),/samePlayerFullHpMp/);
 assert.throws(()=>C.verify({},normal,{...elite,talentNodes:[]},boss),/sameTalentAllocation/);
});
test('Aggregate refuses duplicate earned checkpoints and mismatched native engine versions',()=>{
 const mk=(source,seed)=>({source,coverage:{accounts:1,errors:0,reachedE4:0,reachedE5:0},
  accounts:[{seed,profile:'cautious'}],snapshots:[],series:[]});
 assert.throws(()=>C.aggregate([mk('native-a',1),mk('native-b',2)]),/fingerprint/);
 const valid=C.aggregate([mk('native-a',1),mk('native-a',2)]);
 assert.equal(valid.summary.coverage.accounts,2);
 assert.equal(valid.summary.coverage.actualNativeFights,0);
 assert.equal(valid.summary.level4.bossWinPct,null);
 const duplicate={...mk('native-a',1),snapshots:[{checkpointKey:'same'}]};
 assert.throws(()=>C.aggregate([duplicate,duplicate]),/Duplicate/);
});
