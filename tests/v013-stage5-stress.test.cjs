'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const M=require('../scripts/v013-stage5-stress.cjs');
test('Stage 5 stress matrix rejects invalid or excessive scope, preserves selected profiles',()=>{
 const config=M.args(['--seed-start=9101','--seed-count=2','--levels=15,50','--builds=blood-fury,magic-decay','--gear=previous']);
 assert.deepEqual(config.levels,[15,50]);assert.deepEqual(config.builds,['blood-fury','magic-decay']);assert.equal(config.gear,'previous');assert.equal(config.contracts,'none');
 for(const invalid of ['--seed-count=0','--seed-count=9999','--levels=0','--builds=unknown','--out=','--untrusted=1','--seed-start=-1','--levels=1,15,30000'])
  assert.throws(()=>M.args([invalid]),invalid);
});
test('Stage 5 win confidence interval handles zero, intermediate and perfect success correctly',()=>{
 assert.deepEqual(M.wilson(0,0),[0,100]);
 const empty=M.wilson(0,100),perfect=M.wilson(100,100),half=M.wilson(50,100);
 assert.equal(empty[0],0);assert(empty[1]>0&&empty[1]<5);
 assert.equal(perfect[1],100);assert(perfect[0]>95);
 assert(half[0]<50&&half[1]>50);
});
test('Stage 5 stress report separates wins, route-blocked runs, mechanic exposure and missing coverage',()=>{
 const config=M.args(['--seed-start=9101','--seed-count=1','--levels=15','--builds=blood-fury']);
 const report=M.run(config);
 assert.equal(report.summary.cases,3);
 assert.equal(report.groups.length,3);
 assert.equal(report.rows.length,3);
 assert(report.groups.every(g=>Array.isArray(g.win95Pct)&&g.win95Pct.length===2));
 assert(report.rows.every(x=>x.conditionId));
 assert.equal(report.rollups.difficulty.length,3);
 assert.equal(report.rollups.build.length,1);
 assert.equal(report.rollups.level.length,1);
 assert.equal(report.rollups.condition.reduce((n,x)=>n+x.n,0),3);
 assert.equal(report.rollups.affinity.reduce((n,x)=>n+x.n,0),3);
 assert.equal(report.rollups.boss.reduce((n,x)=>n+x.n,0),3);
 assert(report.groups.every(x=>x.affinity&&x.bossName));
 assert(report.rollups.affinity.every(x=>Number.isFinite(x.meanEnemyAbilityCasts)));
 assert(report.rollups.condition.every(x=>x.p50Seconds!==null&&x.p90Seconds>=x.p50Seconds&&x.win95Pct.length===2));
 assert.equal(report.summary.errors,0);
 assert.equal(report.summary.timeouts,0);
 assert(report.summary.warnings.some(s=>s.includes('balance decisions')));
});

test('Stage 5 pooled reports count actual deaths and events without hiding errors',()=>{
 const rows=[
  {conditionId:'carrion_swarm',risk:2,build:'blood-fury',level:15,won:false,stage:'failed',seconds:12,damageTaken:80,minHpPct:0},
  {conditionId:'carrion_swarm',risk:2,build:'blood-fury',level:15,won:true,stage:'finished',seconds:24,damageTaken:40,minHpPct:33},
  {conditionId:'carrion_swarm',risk:2,build:'blood-fury',level:15,won:false,error:'simulated issue',stage:'choice',seconds:0}
 ];
 const result=M.rollups(rows,'condition');
 assert.equal(result.length,1);assert.equal(result[0].n,3);assert.equal(result[0].wins,1);
 assert.equal(result[0].deaths,1);assert.equal(result[0].errors,1);assert.equal(result[0].blocked,1);
 assert.equal(result[0].p50Seconds,12);assert.equal(result[0].p90Seconds,21.6);
 assert.throws(()=>M.rollups(rows,'invalid'));
});
