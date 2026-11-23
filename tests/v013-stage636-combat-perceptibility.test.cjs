'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const P=require('../scripts/v013-stage636-combat-perceptibility.cjs');
const fs=require('node:fs');
const KEY='reports/v013-stage636-cohort-0.json';
test('Stage6.36: exactly 12 legal diverse profiles × 2 seeds; selected E2..E200 only',()=>{
 assert.equal(P.PROFILES.length,12);
 assert.equal(P.JOBS.length,24);
 assert.deepEqual(P.SEEDS,[9861,9863]);
 assert.deepEqual(P.LEVELS,[2,5,10,20,35,70,100,150,200]);
 const B=require('../scripts/v013-stage632-player-power.cjs');
 for(const id of P.PROFILES)assert(B.PROFILES[id],id);
 assert.deepEqual(P.parse(['--batch=23','--max-level=200']).batch,23);
 for(const bad of ['--batch=24','--batch=-1','--max-level=201',
   '--max-level=1','--max-attempts=0','--max-total-attempts=501',
   '--out=../../escape.json','--inputs=../escape','--mode=fake','--foo=bar']){
  assert.throws(()=>P.parse([bad]),bad);
 }
});
const snap={
 level:35,xp:3500,state:{equip:{
  weapon:{id:'native-w',slot:'weapon',rarity:'Rare',subtype:'Sword',v013Budget:50},
  armor:{id:'native-a',slot:'armor',rarity:'Uncommon',v013Budget:11},
  helm:{id:'native-h',slot:'helm',rarity:'Rare',v013Budget:22},
  offhand:null
 },automaticTalents:{xp:3500,nodes:['affinity_blood']}}
};
test('Stage6.36: remove only ONE previously owned nonweapon item, without changing original',()=>{
 const pick=P.bestOwnedNonWeapon(snap);
 assert.equal(pick.slot,'helm');
 const alt=P.withoutOneItem(snap,pick);
 assert(alt.state.equip.weapon);
 assert(alt.state.equip.armor);
 assert.equal(alt.state.equip.helm,null);
 assert(snap.state.equip.helm?.id==='native-h');
 assert.equal(alt.state.automaticTalents.xp,snap.xp);
 assert.throws(()=>P.withoutOneItem(snap,{...pick,slot:'weapon'}));
 assert.throws(()=>P.withoutOneItem(snap,{...pick,id:'fabricated'}));
});
test('Stage6.36: same-seed reporting never recasts losses as time saved',()=>{
 const r=[{
  earned:{won:true,died:false,timeout:false,seconds:11,endHpPct:50},
  minusItem:{won:true,died:false,timeout:false,seconds:12,endHpPct:40},
  bothWon:true,savedTimePct:8.3333,powerGainPct:1.3,
  winFlip:false,reverseFlip:false
 },{
  earned:{won:false,died:true,timeout:false,seconds:20,endHpPct:0},
  minusItem:{won:false,died:true,timeout:false,seconds:20,endHpPct:0},
  bothWon:false,savedTimePct:null,powerGainPct:0.5,
  winFlip:false,reverseFlip:false
 }];
 const g=P.group(r);
 assert.equal(g.n,2);
 assert.equal(g.bothWon,1);
 assert.equal(g.savedTimePct.n,1);
 assert.equal(g.savedTimePct.median,8.3333);
 assert.equal(g.timeImprovementAtLeast5Pct,100);
 assert.equal(g.earned.winPctResolved,50);
 assert.equal(g.smallPowerDeltaExamples,2);
});
test('Stage6.36: one player natural snapshot and all live enemy abilities remain enabled',()=>{
 const native=fs.readFileSync('combat/expedition-progression.js','utf8');
 assert(native.includes('const CALIBRATION_STAT_ONLY=false;'));
 assert(native.includes('lateLogGrowth:.014'));
 const script=fs.readFileSync('scripts/v013-stage636-combat-perceptibility.cjs','utf8');
 assert(script.includes("D.checkpoint(probe,LEVELS)"));
 assert(script.includes('D.native(snap,scenario,seed,false)'));
 assert(script.includes("snap.state.equip[pick.slot].id!==pick.id"));
 assert.throws(()=>P.aggregate([]),/Missing Stage6.36/);
});
