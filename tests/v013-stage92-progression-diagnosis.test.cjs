'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const D=require('../scripts/v013-stage92-progression-diagnosis.cjs');
function fakeSim(opts){
 const rows=[];
 for(const level of opts.levels)for(const build of opts.builds)for(const seed of opts.seeds){
  const scenarios=opts.mode==='bosses'?
   opts.affinities.flatMap(affinity=>opts.risks.map(risk=>({affinity,risk}))):
   opts.mode==='enemies'?opts.groupSizes.map(groupSize=>({affinity:'blood',risk:0,groupSize})):
   [{affinity:'blood',risk:0}];
  for(const v of scenarios){
   const won=opts.points>=4,room=opts.mode==='dungeon',out={
    mode:opts.mode,level,build,seed,resolvedSeed:seed,affinity:v.affinity,risk:v.risk,
    kind:opts.mode==='bosses'?v.affinity:opts.mode==='enemies'?'swarm-3':'route',
    bossAffinity:opts.mode==='bosses'?v.affinity:null,groupSize:v.groupSize,
    targetPolicy:opts.targetPolicy,gearRarity:opts.rarity,pointsBudget:opts.points,
    won,died:!won,stage:won?'finished':'failed',status:won?'cleared':'died',
    seconds:won?25:30,damageTaken:won?50:100,minHpPct:won?60:0,
    hpMax:100,hpEnd:won?65:0,lastHpPct:won?65:0,
    ...(room?{rooms:won?[{kind:'combat'},{kind:'boss'}]:[{kind:'combat'}],
      route:[0,1,2],bossReached:won}: {})
   };rows.push(out);
  }
 }
 return {sourceSha256:'native-stage92',sourceModules:['index.html'],rows};
}
test('Stage 9.2 pilot bounds are explicit and small',()=>{
 const cfg=D.parseArgs();
 assert.equal(cfg.expectedCases,228);
 assert.equal(cfg.builds.length,3);
 assert.equal(cfg.seeds.length,2);
 assert.equal(cfg.bossAffinities.length,2);
 assert.throws(()=>D.parseArgs(['--seeds='+Array.from({length:8},(_,i)=>9101+i).join(',')]),/exceeds/);
 assert.throws(()=>D.parseArgs(['--boss-affinities=imaginary']),/Invalid boss affinities/);
});
test('Stage 9.2 runs real simulator scenarios without changing combat settings',()=>{
 const cfg=D.parseArgs(['--builds=blood-fury','--seeds=9101']);
 const report=D.run(cfg,fakeSim);
 assert.equal(report.stage,'9.2');
 assert.equal(report.coverage.requested,38);
 assert.equal(report.coverage.completed,38);
 assert.deepEqual(report.coverage.byMode,{enemies:11,dungeon:11,bosses:16});
 assert.equal(report.coverage.errors,0);
 assert.equal(report.coverage.timeouts,0);
 assert(report.coverage.matchedPairs>0);
 assert(D.markdown(report).includes('Sem alterações de balanceamento'));
});
test('Matched native A/B finds isolated talent change but no cross-expedition pairs',()=>{
 const common={mode:'enemies',level:5,build:'blood-fury',seed:9101,resolvedSeed:9101,
  affinity:'blood',risk:0,groupSize:3,targetPolicy:'focus',gearRarity:'Common',
  status:'died',died:true,won:false,hpMax:100,hpEnd:0,damageTaken:100,minHpPct:0,seconds:30};
 const before={...common,cohort:'e5-zero',pointsBudget:0};
 const after={...common,cohort:'e5-talents',pointsBudget:4,won:true,died:false,
  status:'cleared',hpEnd:80,damageTaken:50,minHpPct:60,seconds:25};
 const result=D.pairedContrast([before],[after],'talents');
 assert.equal(result.pairs,1);
 assert.equal(result.deltaWinPct,100);
 assert.equal(result.deltaDamageTaken,-50);
 assert.equal(result.deltaMinHpPct,60);
 assert.equal(D.pairedContrast([before],[{...after,level:15}],'talents').pairs,0);
});
test('Generated Realm differences, native seed drift, risk or Dungeon route changes invalidate pairing',()=>{
 const base={mode:'dungeon',level:15,build:'aegis-vitality',seed:9101,resolvedSeed:9102,
  affinity:'aegis',risk:1,route:[0,1,4],targetPolicy:'focus',won:true,stage:'finished',
  rooms:[{},{}],minHpPct:50,lastHpPct:90,damageTaken:100,seconds:50};
 for(const change of [{affinity:'blood'},{resolvedSeed:9103},{risk:2},{route:[0,2,4]}]){
  assert.equal(D.pairedContrast([base],[{...base,...change}],'gear').pairs,0);
 }
 assert.equal(D.pairedContrast([base],[{...base}],'gear').pairs,1);
});
test('Repeated resolved seeds never count as independent samples',()=>{
 const row={cohort:'e5-talents',mode:'enemies',level:5,build:'blood-fury',
  seed:9101,resolvedSeed:9200,affinity:'blood',risk:0,groupSize:3,won:true,
  status:'cleared',seconds:10,hpMax:100,hpEnd:90,minHpPct:70};
 const d=D.independent([row,{...row,seed:9102}]);
 assert.equal(d.rows.length,1);assert.equal(d.duplicates,1);
 const g=D.summarize([row,{...row,seed:9102}])[0];
 assert.equal(g.resolved,1);assert.equal(g.duplicates,1);
 assert(g.flags.includes('small_sample'));
});
test('Source fingerprint mismatch and missing scenarios cause hard failure',()=>{
 const cfg=D.parseArgs(['--builds=blood-fury','--seeds=9101']);
 const runs=D.COHORTS.flatMap(c=>['enemies','dungeon',...(c.boss?['bosses']:[])].map(mode=>({
  cohort:c,report:fakeSim(D.optionsFor(c,mode,cfg))})));
 assert.equal(D.analyze(runs,cfg).coverage.completed,38);
 runs[1].report.sourceSha256='drift';
 assert.throws(()=>D.analyze(runs,cfg),/fingerprint mismatch/);
 runs[1].report.sourceSha256='native-stage92';runs[0].report.rows.pop();
 assert.throws(()=>D.analyze(runs,cfg),/Missing Stage 9.2 cases/);
});

test('Native RNG streams lock the same Dungeon and Boss encounters across rarity changes',()=>{
 const S=require('../scripts/simulate-progression.cjs');
 const cfg=D.parseArgs(['--builds=blood-fury','--seeds=9101','--boss-affinities=blood']);
 const common=D.COHORTS.find(c=>c.id==='e5-talents');
 const better=D.COHORTS.find(c=>c.id==='e5-geared');
 for(const mode of ['enemies','dungeon','bosses']){
  const a=S.simulate(D.optionsFor(common,mode,cfg)).rows[0];
  const b=S.simulate(D.optionsFor(better,mode,cfg)).rows[0];
  assert.equal(a.error,undefined,'baseline failed: '+a.error);
  assert.equal(b.error,undefined,'upgrade failed: '+b.error);
  assert.equal(a.resolvedSeed,b.resolvedSeed,mode+' must use identical native seed');
  assert.equal(a.affinity,b.affinity,mode+' must preserve Realm Affinity');
  assert.equal(a.risk,b.risk,mode+' must preserve risk');
  if(mode==='dungeon')assert.deepEqual(a.route,b.route,'route must match');
  if(mode==='bosses')assert.equal(a.bossStyle,b.bossStyle,'Boss style must match');
 }
});
