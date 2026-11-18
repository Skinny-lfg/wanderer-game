'use strict';
// Stage 9.1: small, reproducible observation only. NO balance constants changed.
// Uses the Stage 7/8 native v0.13 simulator, not legacy v0.12 simulation scripts.
const fs=require('node:fs');
const path=require('node:path');
const S=require('./simulate-progression.cjs');
const DEFAULT_ARGS=[
 '--mode=bosses','--levels=15','--seeds=9101,9102',
 '--builds=blood-fury,aegis-vitality,magic-decay',
 '--risks=0,1,2','--affinities=blood,decay,vitality,aegis,fury,magic',
 '--points=24','--out=reports/v013-stage91-diagnosis.json'
];
const MAX_CASES=240;
const round=(n,d=2)=>Number(Number(n).toFixed(d));
const num=x=>Number.isFinite(Number(x))?Number(x):0;
const avg=(items,key)=>items.length?round(items.reduce((s,x)=>s+num(x[key]),0)/items.length):null;
function pct(n,den){return den?round(100*n/den,1):null;}
function quantile(values,p){
 if(!values.length)return null;
 const sorted=values.map(Number).filter(Number.isFinite).sort((a,b)=>a-b);
 if(!sorted.length)return null;
 const at=(sorted.length-1)*p,a=Math.floor(at),b=Math.ceil(at);
 return round(sorted[a]+(sorted[b]-sorted[a])*(at-a));
}
function parseArgs(args=[]){
 const opts=S.parseArgs([...DEFAULT_ARGS,...args]);
 const cases=opts.levels.length*opts.seeds.length*opts.builds.length*
  (opts.affinities.length*opts.risks.length+opts.groupSizes.length+1);
 if(cases>MAX_CASES)throw Error('Stage 9.1 is a SMALL diagnostic: '+cases+' > '+MAX_CASES+
  ' cases. Filter levels/builds/risks/seeds, or use later targeted cohorts.');
 if(!opts.output.endsWith('.json'))throw Error('--out must end with .json');
 return {...opts,mode:'bosses',expectedCases:cases};
}
function contextKey(r){
 const affinity=r.bossAffinity||r.affinity||null;
 return JSON.stringify([
  r.mode,r.level,r.build,affinity,r.risk??null,
  r.mode==='enemies'?(r.groupSize??r.kind):r.mode==='elites'?(r.eliteType||'unknown'):null,
  r.pointsBudget??null,r.gearRarity||null,r.targetPolicy||null
 ]);
}
function summarize(rows){
 const groups=new Map();
 for(const row of rows){const key=contextKey(row);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(row);}
 const out=[];
 for(const sample of groups.values()){
  const first=sample[0],resolved=sample.filter(r=>!r.error&&!r.timedOut&&
   (r.won||r.died||r.stage==='failed'||r.status==='died'||r.status==='cleared'));
  const wins=resolved.filter(r=>r.won).length,deaths=resolved.filter(r=>r.died||r.stage==='failed'||r.status==='died').length;
  const sec=resolved.map(r=>r.seconds),hp=resolved.map(r=>r.minHpPct);
  const netHp=resolved.map(r=>r.hpMax>0?round(r.hpEnd/r.hpMax*100,1):null).filter(x=>x!==null);
  const casts=resolved.reduce((n,r)=>n+num(r.enemyAbilityCasts),0);
  const seconds=resolved.reduce((n,r)=>n+num(r.seconds),0);
  const flags=[];
  if(sample.some(r=>r.error))flags.push('simulation_error');
  if(sample.some(r=>r.timedOut))flags.push('timeout');
  if(!resolved.length)flags.push('no_resolved_fights');
  if(resolved.length<5)flags.push('small_sample');
  if(resolved.length>=2&&pct(deaths,resolved.length)>=50)flags.push('survival_pressure_candidate');
  if(sec.length&&quantile(sec,.5)>=90)flags.push('long_fight_candidate');
  if(hp.length&&quantile(hp,.5)<=15)flags.push('low_health_candidate');
  out.push({
   mode:first.mode,level:first.level,build:first.build,
   affinity:first.bossAffinity||first.affinity||null,bossName:first.bossName||null,
   bossStyle:first.bossStyle||null,risk:first.risk??null,
   groupSize:first.mode==='enemies'?(first.groupSize||null):null,
   eliteType:first.mode==='elites'?(first.eliteType||null):null,
   targetPolicy:first.targetPolicy||'focus',
   n:sample.length,resolved:resolved.length,wins,deaths,
   errors:sample.filter(r=>r.error).length,timeouts:sample.filter(r=>r.timedOut).length,
   winPctResolved:pct(wins,resolved.length),
   durationP50:quantile(sec,.5),durationP90:quantile(sec,.9),
   damageTakenMean:avg(resolved,'damageTaken'),damageDealtMean:avg(resolved,'damageDealt'),
   absorbedMean:avg(resolved,'absorbed'),manaSpentMean:avg(resolved,'manaSpent'),
   minHpPctP50:quantile(hp,.5),endHpPctP50:quantile(netHp,.5),
   enemyAbilityCastsMean:avg(resolved,'enemyAbilityCasts'),
   enemyAbilityCastsPerMinute:seconds>0?round(casts*60/seconds):null,
   bossSummonsMean:avg(resolved,'bossSummons'),
   bossHealingMean:avg(resolved,'bossHealing'),
   bossWardsMean:avg(resolved,'bossWards'),
   bossCastPreparationsMean:avg(resolved,'bossCastPreparations'),
   bossCastInterruptionsMean:avg(resolved,'bossCastInterruptions'),
   bossArcanePulsesMean:avg(resolved,'bossArcanePulses'),
   bossNodeDestroyedMean:avg(resolved,'bossNodeDestroyed'),
   eliteSummonsMean:avg(resolved,'eliteSummons'),
   targetSwitchesMean:avg(resolved,'targetSwitches'),
   flags
  });
 }
 return out.sort((a,b)=>a.mode.localeCompare(b.mode)||a.level-b.level||
  String(a.affinity).localeCompare(String(b.affinity))||String(a.build).localeCompare(String(b.build))||
  (a.risk??0)-(b.risk??0)||num(a.groupSize)-num(b.groupSize));
}
function analyze(modeResults,opts){
 if(!Array.isArray(modeResults)||modeResults.length!==3)throw Error('Expected bosses, enemies and elites reports');
 const fingerprint=modeResults[0].sourceSha256;
 if(!fingerprint||modeResults.some(r=>r.sourceSha256!==fingerprint))throw Error('Native source fingerprint mismatch');
 const rows=modeResults.flatMap(r=>r.rows);
 const actual={bosses:rows.filter(r=>r.mode==='bosses').length,
  enemies:rows.filter(r=>r.mode==='enemies').length,
  elites:rows.filter(r=>r.mode==='elites').length};
 if(rows.length!==opts.expectedCases)throw Error('Missing scenarios: expected '+opts.expectedCases+', got '+rows.length);
 const bosses=['aegis','blood','decay','fury','magic','vitality'];
 const seen=[...new Set(rows.filter(r=>r.mode==='bosses'&&!r.error).map(r=>r.bossAffinity))].sort();
 const missing=bosses.filter(b=>opts.affinities.includes(b)&&!seen.includes(b));
 const errors=rows.filter(r=>r.error),timeouts=rows.filter(r=>r.timedOut);
 const groups=summarize(rows);
 const flags=groups.flatMap(g=>g.flags.filter(f=>f!=='small_sample').map(f=>({
  flag:f,mode:g.mode,boss:g.bossName,affinity:g.affinity,build:g.build,risk:g.risk,level:g.level
 })));
 if(missing.length)flags.push({flag:'missing_boss_coverage',affinities:missing});
 return {
  schemaVersion:1,stage:'9.1',sourceSha256:fingerprint,sourceModules:modeResults[0].sourceModules,
  assumptions:{...modeResults[0].assumptions,
   scope:'Controlled native first-ring Boss, 3/12/20-enemy rooms and seeded Elite fights; not campaign or full natural dungeon',
   comparisons:'Each row keeps its level, resolvedSeed, Affinity, risk, build and targeting; seed shifts across Affinities are NOT paired',
   sampleWarning:'Exploratory only. Do not calibrate numbers on groups below 30 independent seeds per cell.',
   talentWarning:'24 points are synthetic at E15, not naturally earned; use --points=0 --levels=1 for E1 baseline.',
   abilityWarning:'Casts, summons, healing, wards and interrupts are exposure/proxy metrics; direct damage by each ability is NOT attributed.',
   thresholds:'Flags are triage signals (>=90s median, <=15% median minimum HP, >=50% deaths with n>=2), not validated balance targets.'},
  matrix:{levels:opts.levels,seeds:opts.seeds,builds:opts.builds,affinities:opts.affinities,risks:opts.risks,
   groupSizes:opts.groupSizes,points:opts.points,targetPolicy:opts.targetPolicy},
  coverage:{...actual,requested:opts.expectedCases,completed:rows.length,observedBosses:seen,
   missingBosses:missing,observedEliteTypes:[...new Set(rows.map(r=>r.eliteType).filter(Boolean))].sort(),
   errorCount:errors.length,timeoutCount:timeouts.length},
  groups,flags,rows,
  limitations:[
   'Combat is native; Boss encounters are moved to a controlled first-ring room and are not full 15-Realm runs.',
   'One or two seeds are diagnostics, not statistically meaningful balance percentages.',
   'No automatic potion timing, equipment upgrades during route, or complete manual player input.',
   'All results use explicit synthetic talent budgets; generated gear is seeded, not standardized item-by-item.',
   'Elite type is seed-dependent; an unobserved archetype must be checked in a later targeted cohort.'
  ]
 };
}
function run(opts,simulate=S.simulate){
 const results=['bosses','enemies','elites'].map(mode=>simulate({...opts,mode}));
 return analyze(results,opts);
}
function markdown(report){
 const c=report.coverage;
 const lines=[
  '# Wanderer v0.13 — Stage 9.1: primeiro diagnóstico',
  '',
  'Source SHA-256: '+report.sourceSha256,
  '',
  '**Controlado, exploratório e sem alterar valores de combate.** Motor nativo v0.13; não são usadas simulações v0.12.',
  '',
  '## Cobertura',
  '',
  '- Casos: '+c.completed+' / '+c.requested+' (Boss '+c.bosses+', swarm '+c.enemies+', Elite '+c.elites+')',
  '- Bosses observados: '+(c.observedBosses.join(', ')||'nenhum')+'. Em falta: '+(c.missingBosses.join(', ')||'nenhum'),
  '- Tipos Elite observados: '+(c.observedEliteTypes.join(', ')||'nenhum'),
  '- Erros: '+c.errorCount+'; timeouts: '+c.timeoutCount,
  '- Builds: '+report.matrix.builds.join(', ')+'; risks: '+report.matrix.risks.join(', '),
  '- Seeds: '+report.matrix.seeds.join(', ')+'; level(s): '+report.matrix.levels.join(', '),
  '',
  '## Resultados agrupados por Boss/Affinity/build/dificuldade',
  '',
  '| Tipo | Boss/Affinity | Build | Risco | n (concl.) | Vitórias | Duração p50/p90 (s) | Dano recebido médio | HP mín. p50 | Casts/min | Flags |',
  '|---|---|---|---:|---:|---:|---:|---:|---:|---:|---|'
 ];
 for(const g of report.groups){
  const fmt=n=>n===null?'—':String(n);
  const name=(g.bossName||g.affinity||g.eliteType||'normal').replace(/\|/g,'/');
  lines.push('| '+g.mode+(g.groupSize?' ('+g.groupSize+')':'')+' | '+name+' | '+g.build+
   ' | '+fmt(g.risk)+' | '+g.n+' ('+g.resolved+') | '+fmt(g.winPctResolved)+'% | '+
   fmt(g.durationP50)+' / '+fmt(g.durationP90)+' | '+fmt(g.damageTakenMean)+' | '+
   fmt(g.minHpPctP50)+'% | '+fmt(g.enemyAbilityCastsPerMinute)+' | '+g.flags.join(', ')+' |');
 }
 lines.push('','## Sinais a investigar (não são recomendações de nerf/buff)','');
 if(report.flags.length)for(const x of report.flags)lines.push('- '+x.flag+': '+[x.mode,x.boss||x.affinity,x.build,'risk '+x.risk,'E'+x.level].filter(Boolean).join(' / '));
 else lines.push('Sem flags além de amostras pequenas; **não** significa equilíbrio confirmado.');
 lines.push('','## Leitura correta','',
  '- Win rate usa apenas lutas concluídas. Erros e timeouts ficam separados, nunca como derrotas.',
  '- p50/p90, danos, HP e casts usam apenas lutas concluídas.',
  '- Eficácia de habilidades é apenas observada indiretamente: casts, summons, wards, healing, interrupts; sem atribuição de dano por habilidade.',
  '- Bosses de Affinities diferentes podem exigir resolvedSeed diferente: não comparar como A/B emparelhado.',
  '- 24 talent points são uma build sintética. E1 exige diagnóstico separado com --points=0.',
  '- Não ajustar parâmetros de jogo até repetir os casos suspeitos com 30–100 seeds por célula e validar manualmente.',
  '',
  '## Próximo passo',
  '',
  'Repetir apenas flags confirmadas com sementes emparelhadas, isolando build, dificuldade, Boss e política de alvo. Cobrir Elites não observados. Depois avaliar potions, progressão real e telegraphs no jogo.',
  '');
 return lines.join('\n');
}
function main(args=process.argv.slice(2)){
 const opts=parseArgs(args),report=run(opts);
 const dest=path.resolve(process.cwd(),opts.output),md=dest.replace(/\.json$/,'.md');
 fs.mkdirSync(path.dirname(dest),{recursive:true});
 fs.writeFileSync(dest,JSON.stringify(report,null,2)+'\n');
 fs.writeFileSync(md,markdown(report));
 console.log('STAGE91_SUMMARY='+JSON.stringify({json:opts.output,markdown:path.relative(process.cwd(),md),
  cases:report.coverage.completed,bosses:report.coverage.observedBosses,eliteTypes:report.coverage.observedEliteTypes,
  errors:report.coverage.errorCount,timeouts:report.coverage.timeoutCount,triageFlags:report.flags.length,
  sourceSha256:report.sourceSha256}));
 if(report.coverage.errorCount||report.coverage.timeoutCount||report.coverage.missingBosses.length)process.exitCode=1;
 return report;
}
module.exports={DEFAULT_ARGS,MAX_CASES,parseArgs,contextKey,quantile,summarize,analyze,run,markdown,main};
if(require.main===module)main();
