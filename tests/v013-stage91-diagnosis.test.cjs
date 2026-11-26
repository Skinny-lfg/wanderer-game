'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const D=require('../scripts/v013-stage91-diagnosis.cjs');
function opts(extra=[]){
 return D.parseArgs(['--levels=15','--seeds=9101,9102','--builds=blood-fury',
  '--affinities=blood','--risks=1','--group-sizes=3',...extra]);
}
function result(mode,seeds=[9101,9102],badSeed=null){
 return {sourceSha256:'native-fingerprint',sourceModules:['index.html'],
  assumptions:{mode,pointsAvailable:24},
  rows:seeds.map(seed=>{
   const common={mode,kind:mode==='bosses'?'blood':mode==='enemies'?'swarm-3':'elite',
    level:15,build:'blood-fury',seed,resolvedSeed:seed,seedShift:0,
    affinity:'blood',risk:1,pointsBudget:24,targetPolicy:'focus',
    seconds:25,damageTaken:100,damageDealt:900,absorbed:24,
    manaSpent:10,enemyAbilityCasts:3,bossHealing:6,bossSummons:1,
    bossCastInterruptions:0,minHpPct:34,hpEnd:80,hpMax:200,
    won:true,died:false,timedOut:false};
   if(mode==='bosses')Object.assign(common,{bossAffinity:'blood',bossName:'The Creditor',bossStyle:'leech'});
   if(mode==='enemies')Object.assign(common,{groupSize:3});
   if(mode==='elites')Object.assign(common,{eliteType:'berserker'});
   if(seed===badSeed)Object.assign(common,{error:'native-runtime-crash',won:false});
   return common;
  })};
}
test('Stage 9.1 defaults run limited, reproducible native scenario matrix',()=>{
 const x=D.parseArgs();
 assert.equal(x.expectedCases,132);
 assert.deepEqual(x.builds,['blood-fury','aegis-radiance','arcane-decay']);
 assert.deepEqual(x.risks,[0,1,2]);
 assert.equal(x.affinities.length,6);
 assert.equal(x.seeds.length,2);
 assert.throws(()=>D.parseArgs(['--seeds='+Array.from({length:12},(_,i)=>9000+i).join(',')]),/SMALL diagnostic/);
 assert.throws(()=>D.parseArgs(['--out=results.txt']),/must end with .json/);
});
test('Native group separation and p50/p90 are deterministic',()=>{
 const d=D.analyze([result('bosses'),result('enemies'),result('elites')],opts());
 assert.equal(d.coverage.completed,6);
 assert.equal(d.coverage.bosses,2);
 assert.equal(d.coverage.enemies,2);
 assert.equal(d.coverage.elites,2);
 assert.deepEqual(d.coverage.observedBosses,['blood']);
 assert.deepEqual(d.coverage.observedEliteTypes,['berserker']);
 const b=d.groups.find(x=>x.mode==='bosses');
 assert.equal(b.winPctResolved,100);
 assert.equal(b.durationP50,25);
 assert.equal(b.durationP90,25);
 assert.equal(b.damageTakenMean,100);
 assert.equal(b.enemyAbilityCastsPerMinute,null);
 assert.deepEqual(d.groups.map(g=>g.mode).sort(),['bosses','elites','enemies']);
 assert(D.markdown(d).includes('The Creditor'));
});
test('Failed simulations never count as legitimate deaths or lower real win rates',()=>{
 const d=D.analyze([result('bosses',[9101,9102],9102),result('enemies'),result('elites')],opts());
 const b=d.groups.find(g=>g.mode==='bosses');
 assert.equal(b.n,2);assert.equal(b.resolved,1);assert.equal(b.errors,1);
 assert.equal(b.deaths,0);assert.equal(b.winPctResolved,100);
 assert(b.flags.includes('simulation_error'));
 assert.equal(d.coverage.errorCount,1);
});
test('Unmatched module fingerprints and incomplete scenarios are blocked',()=>{
 const o=opts();const results=[result('bosses'),result('enemies'),result('elites')];
 results[1].sourceSha256='old-engine';
 assert.throws(()=>D.analyze(results,o),/fingerprint mismatch/);
 results[1].sourceSha256='native-fingerprint';results[2].rows.pop();
 assert.throws(()=>D.analyze(results,o),/Missing scenarios/);
});
test('Timeout is distinct from defeat and statistics ignore unresolved combat',()=>{
 const r=[result('bosses'),result('enemies'),result('elites')];
 const t=r[0].rows[0];t.won=false;t.timedOut=true;t.status='timeout';t.seconds=500;
 const d=D.analyze(r,opts()),b=d.groups.find(g=>g.mode==='bosses');
 assert.equal(b.timeouts,1);assert.equal(b.deaths,0);assert.equal(b.resolved,1);
 assert.equal(b.durationP50,25);assert.equal(b.winPctResolved,100);
 assert(b.flags.includes('timeout'));
});

test('Shifted RNG seeds collapsing to one native Realm are NOT counted as independent evidence',()=>{
 const r=[result('bosses'),result('enemies'),result('elites')];
 r[0].rows[1].resolvedSeed=r[0].rows[0].resolvedSeed;
 const d=D.analyze(r,opts()),b=d.groups.find(x=>x.mode==='bosses');
 assert.equal(b.n,2);assert.equal(b.resolvedAttempts,2);assert.equal(b.resolved,1);
 assert.equal(b.duplicateResolvedSeeds,1);assert.equal(b.wins,1);
 assert.equal(d.coverage.independentBossFights,1);
 assert.equal(d.coverage.duplicateBossAttempts,1);
 assert(b.flags.includes('duplicate_resolved_seed'));
 assert(D.markdown(d).includes('tentativas duplicadas: 1'));
});
test('Boss general cast telemetry is not confused with regular enemy ability casts',()=>{
 const d=D.analyze([result('bosses'),result('enemies'),result('elites')],opts());
 const b=d.groups.find(x=>x.mode==='bosses'),e=d.groups.find(x=>x.mode==='enemies');
 assert.equal(b.enemyAbilityCastsMean,null);
 assert.equal(b.enemyAbilityCastsPerMinute,null);
 assert.equal(e.enemyAbilityCastsPerMinute,7.2);
});
