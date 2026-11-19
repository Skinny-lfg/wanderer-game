'use strict';
// Stage 9.2: Progression-sensitivity diagnosis. This file changes NO gameplay constants.
// Uses the current native v0.13 simulator; all talent points and gear are controlled counterfactuals.
const fs=require('node:fs');
const path=require('node:path');
const S=require('./simulate-progression.cjs');
const COHORTS=Object.freeze([
 {id:'e1-start',level:1,points:0,rarity:'Common',boss:true},
 {id:'e5-zero',level:5,points:0,rarity:'Common',boss:true},
 {id:'e5-talents',level:5,points:4,rarity:'Common',boss:true},
 {id:'e5-geared',level:5,points:4,rarity:'Uncommon',boss:true},
 {id:'e15-zero',level:15,points:0,rarity:'Common',boss:true},
 {id:'e15-talents',level:15,points:8,rarity:'Common',boss:true},
 {id:'e15-geared',level:15,points:8,rarity:'Rare',boss:true},
 {id:'e15-high-talents',level:15,points:24,rarity:'Rare',boss:true},
 {id:'e35-low',level:35,points:8,rarity:'Uncommon',boss:false},
 {id:'e35-talents',level:35,points:16,rarity:'Uncommon',boss:false},
 {id:'e35-geared',level:35,points:16,rarity:'Rare',boss:false}
]);
const CONTRASTS=Object.freeze([
 {from:'e5-zero',to:'e5-talents',axis:'talents'},
 {from:'e5-talents',to:'e5-geared',axis:'gear'},
 {from:'e15-zero',to:'e15-talents',axis:'talents'},
 {from:'e15-talents',to:'e15-geared',axis:'gear'},
 {from:'e15-geared',to:'e15-high-talents',axis:'talents'},
 {from:'e35-low',to:'e35-talents',axis:'talents'},
 {from:'e35-talents',to:'e35-geared',axis:'gear'}
]);
const DEFAULTS=Object.freeze({
 builds:['blood-fury','aegis-vitality','magic-decay'],
 seeds:[9101,9201],targetPolicy:'focus',
 bossAffinities:['blood','aegis'],bossRisks:[0],
 output:'reports/v013-stage92-progression-diagnosis.json'
});
const MAX_CASES=260;
const round=(x,d=2)=>Number(Number(x).toFixed(d));
const mean=(rows,field)=>rows.length?round(rows.reduce((s,r)=>s+Number(r[field]||0),0)/rows.length):null;
const pct=(numerator,denominator)=>denominator?round(numerator*100/denominator,1):null;
const inArray=(value,values)=>values.includes(value);
function parseArgs(args=[]){
 const out={...DEFAULTS,builds:[...DEFAULTS.builds],seeds:[...DEFAULTS.seeds],
  bossAffinities:[...DEFAULTS.bossAffinities],bossRisks:[...DEFAULTS.bossRisks]};
 for(const arg of args){
  const m=/^--([a-z-]+)=(.*)$/.exec(arg);if(!m)throw Error('Expected --option=value: '+arg);
  const [,k,v]=m;
  if(k==='builds'){out.builds=[...new Set(v.split(','))];if(!out.builds.length||out.builds.some(x=>!S.BUILDS.some(b=>b.id===x)))throw Error('Invalid builds');}
  else if(k==='seeds'){out.seeds=[...new Set(v.split(',').map(Number))];if(!out.seeds.length||out.seeds.some(x=>!Number.isSafeInteger(x)||x<1))throw Error('Invalid seeds');}
  else if(k==='boss-affinities'){out.bossAffinities=[...new Set(v.split(','))];if(!out.bossAffinities.length||out.bossAffinities.some(x=>!S.DEFAULTS.affinities.includes(x)))throw Error('Invalid boss affinities');}
  else if(k==='boss-risks'){out.bossRisks=[...new Set(v.split(',').map(Number))];if(!out.bossRisks.length||out.bossRisks.some(x=>![0,1,2].includes(x)))throw Error('Invalid boss risks');}
  else if(k==='target-policy'&&['focus','mechanics','adds'].includes(v))out.targetPolicy=v;
  else if(k==='out'&&v.endsWith('.json'))out.output=v;
  else throw Error('Unsupported Stage 9.2 option: '+arg);
 }
 out.expectedCases=COHORTS.reduce((n,c)=>n+out.builds.length*out.seeds.length*(2+(c.boss?out.bossAffinities.length*out.bossRisks.length:0)),0);
 if(out.expectedCases>MAX_CASES)throw Error('Stage 9.2 pilot exceeds '+MAX_CASES+' fights; narrow builds/seeds/affinities/risks');
 return out;
}
function optionsFor(cohort,mode,settings){
 const native=S.parseArgs([
  '--mode='+mode,'--levels='+cohort.level,'--seeds='+settings.seeds.join(','),
  '--builds='+settings.builds.join(','),'--points='+cohort.points,
  '--rarity='+cohort.rarity,'--gear=current','--runes=false',
  '--target-policy='+settings.targetPolicy,
  ...(mode==='enemies'?['--group-sizes=3']:[]),
  ...(mode==='bosses'?['--affinities='+settings.bossAffinities.join(','),'--risks='+settings.bossRisks.join(',')]:[])
 ]);
 // Public gameplay RNG remains unchanged; the native test harness splits streams.
 return {...native,lockScenarioStreams:true};
}
function identity(r){
 // Full natural encounter identity, not merely input seed. Different gear rolls may
 // shift generated cards/rooms even with the same input RNG seed.
 return JSON.stringify([r.mode,r.level,r.build,r.seed,r.resolvedSeed,r.affinity,
  r.risk??null,r.mode==='enemies'?r.groupSize:null,
  r.mode==='bosses'?r.bossAffinity:null,r.targetPolicy||'focus',
  r.mode==='dungeon'?r.route:null]);
}
function resolved(r){return !r.error&&!r.timedOut&&(r.won||r.died||r.stage==='failed'||r.status==='died'||r.status==='cleared'||r.stage==='finished');}
function independent(rows){
 const kept=new Map();let duplicates=0;
 for(const r of rows.filter(resolved)){
  const key=JSON.stringify([r.resolvedSeed??r.seed,r.affinity??null,r.risk??null,
   r.mode==='enemies'?r.groupSize:null]);
  if(kept.has(key)){duplicates++;continue;}
  kept.set(key,r);
 }
 return {rows:[...kept.values()],duplicates};
}
function outcome(r){
 return {won:!!r.won,damageTaken:Number(r.damageTaken||0),
  seconds:Number(r.seconds||0),minHpPct:Number(r.minHpPct||0),
  endHpPct:r.mode==='dungeon'?Number(r.lastHpPct||0):(r.hpMax?round(100*r.hpEnd/r.hpMax):null),
  rooms:r.mode==='dungeon'?(r.rooms||[]).length:1,
  bossReached:!!r.bossReached};
}
function groupKey(r){return JSON.stringify([r.cohort,r.mode,r.build,r.mode==='bosses'?r.bossAffinity:'all',r.mode==='bosses'?r.risk:null]);}
function summarize(rows){
 const groups=new Map();
 for(const r of rows){const k=groupKey(r);if(!groups.has(k))groups.set(k,[]);groups.get(k).push(r);}
 return [...groups.values()].map(original=>{
  const a=original[0],d=independent(original),items=d.rows.map(outcome);
  const errors=original.filter(r=>r.error).length,timeouts=original.filter(r=>r.timedOut).length;
  const wins=items.filter(r=>r.won).length,deaths=d.rows.filter(r=>r.died||r.stage==='failed'||r.status==='died').length;
  const flags=[];
  if(errors)flags.push('runtime_error');
  if(timeouts)flags.push('timeout');
  if(d.duplicates)flags.push('duplicate_native_seed');
  if(items.length<5)flags.push('small_sample');
  if(!items.length)flags.push('no_resolved_fights');
  if(items.length&&wins===0)flags.push('floor_effect');
  if(items.length&&wins===items.length)flags.push('ceiling_effect');
  return {
   cohort:a.cohort,mode:a.mode,level:a.level,points:a.pointsBudget,rarity:a.gearRarity,
   build:a.build,bossAffinity:a.mode==='bosses'?a.bossAffinity:null,
   risk:a.mode==='bosses'?a.risk:null,
   observedAffinities:[...new Set(original.map(x=>x.affinity).filter(Boolean))].sort(),
   requested:original.length,resolved:items.length,duplicates:d.duplicates,errors,timeouts,
   wins,deaths,winPct:pct(wins,items.length),
   meanSeconds:mean(items,'seconds'),meanDamageTaken:mean(items,'damageTaken'),
   meanMinHpPct:mean(items,'minHpPct'),meanEndHpPct:mean(items,'endHpPct'),
   meanRooms:mean(items,'rooms'),
   bossReachedPct:a.mode==='dungeon'?pct(items.filter(x=>x.bossReached).length,items.length):null,
   flags
  };
 }).sort((a,b)=>COHORTS.findIndex(c=>c.id===a.cohort)-COHORTS.findIndex(c=>c.id===b.cohort)||
  a.mode.localeCompare(b.mode)||a.build.localeCompare(b.build)||String(a.bossAffinity).localeCompare(String(b.bossAffinity)));
}
function pairedContrast(left,right,axis){
 const old=new Map();
 for(const r of left.filter(resolved)){const key=identity(r);if(!old.has(key))old.set(key,r);}
 const pairs=[],usedNative=new Set();
 for(const r of right.filter(resolved)){
  const a=old.get(identity(r));if(!a)continue;
  const native=JSON.stringify([r.mode,r.level,r.build,r.resolvedSeed,r.affinity,r.risk,r.groupSize]);
  if(usedNative.has(native))continue;
  usedNative.add(native);pairs.push([outcome(a),outcome(r)]);
 }
 const delta=field=>pairs.length?round(pairs.reduce((v,[a,b])=>v+((b[field]??0)-(a[field]??0)),0)/pairs.length):null;
 return {axis,leftAttempts:left.length,rightAttempts:right.length,pairs:pairs.length,
  unpairedLeft:left.length-pairs.length,unpairedRight:right.length-pairs.length,
  deltaWinPct:pairs.length?pct(pairs.filter(([a,b])=>b.won).length,pairs.length)-pct(pairs.filter(([a,b])=>a.won).length,pairs.length):null,
  deltaDamageTaken:delta('damageTaken'),deltaSeconds:delta('seconds'),
  deltaMinHpPct:delta('minHpPct'),deltaEndHpPct:delta('endHpPct'),
  deltaRooms:delta('rooms'),
  deltaBossReachedPct:pairs.length?round(100*pairs.reduce((n,[a,b])=>n+Number(b.bossReached)-Number(a.bossReached),0)/pairs.length,1):null,
  warning:pairs.length<5?'Fewer than 5 matched independent encounters. Exploratory only.':null};
}
function compare(rows){
 const comparisons=[];
 for(const c of CONTRASTS){
  const a=COHORTS.find(x=>x.id===c.from),b=COHORTS.find(x=>x.id===c.to);
  if(a.level!==b.level)throw Error('Invalid cross-expedition causal contrast '+c.from);
  if(c.axis==='talents'&&(a.rarity!==b.rarity||a.points===b.points))throw Error('Talent contrast changes gear');
  if(c.axis==='gear'&&(a.points!==b.points||a.rarity===b.rarity))throw Error('Gear contrast changes talents');
  for(const mode of ['enemies','dungeon','bosses']){
   const source=rows.filter(r=>r.cohort===a.id&&r.mode===mode);
   const target=rows.filter(r=>r.cohort===b.id&&r.mode===mode);
   if(!source.length||!target.length)continue;
   for(const build of [...new Set(source.map(r=>r.build))]){
    const subsets=new Set(source.filter(r=>r.build===build).map(r=>mode==='bosses'?r.bossAffinity+':'+r.risk:'all'));
    for(const subset of subsets){
     const filter=r=>r.build===build&&(mode!=='bosses'||r.bossAffinity+':'+r.risk===subset);
     comparisons.push({from:a.id,to:b.id,level:a.level,mode,build,
      boss:mode==='bosses'?subset:null,...pairedContrast(source.filter(filter),target.filter(filter),c.axis)});
    }
   }
  }
 }
 return comparisons;
}
function analyze(runs,settings){
 if(!runs.length)throw Error('Missing simulator executions');
 const fingerprint=runs[0].report.sourceSha256;
 if(!fingerprint||runs.some(x=>x.report.sourceSha256!==fingerprint))throw Error('Native source fingerprint mismatch');
 const rows=runs.flatMap(({cohort,report})=>report.rows.map(r=>({...r,cohort:cohort.id})));
 if(rows.length!==settings.expectedCases)throw Error('Missing Stage 9.2 cases: expected '+settings.expectedCases+', got '+rows.length);
 const groups=summarize(rows),comparisons=compare(rows);
 const errors=rows.filter(r=>r.error),timeouts=rows.filter(r=>r.timedOut);
 return {schemaVersion:1,stage:'9.2',sourceSha256:fingerprint,sourceModules:runs[0].report.sourceModules,
  objective:'Determine whether first Expedition pressure and later relief correlate with earned-like talent/gear investment, without adjusting gameplay',
  assumptions:{
   progression:'E1, E5, E15, E35 are separate native Expedition tiers; cross-E comparisons are descriptive, not causal.',
   interventions:'Talent budgets are synthetic, NOT earned or expected at these Expeditions. Rarity changes are controlled generated gear, NOT natural loot rates.',
   encounters:'Natural shortest-path Dungeon vs controlled first-ring group of 3 and selected first-ring Bosses; these are not full 15-Realm expeditions.',
   bossScope:'Exploratory blood/aegis Normal Boss subset (configurable); not an assessment of all six Bosses or other risks.',
   playstyle:'Automatic combat, targetPolicy='+settings.targetPolicy+', no potion use/equip upgrades between rooms, no adaptive real-player strategy.',
   rng:'Scenario streams are re-seeded after native gear generation so rarity cannot change map/encounter identity. Combat formulas and game RNG outside the simulator remain untouched.',
   matching:'Within the SAME E, a comparison requires identical native resolvedSeed, Affinity, risk, room route (Dungeon), build, encounter kind and targeting. Unpaired observations are NOT effects.',
   performance:'Pairs with fewer than 5 fights are exploratory. No broad stat changes until larger seeds and manual play confirm.',
   focus:'Includes both early bottleneck and performance uplift from talents versus armour, separately where matches exist.'
  },settings:{...settings,cohorts:COHORTS,contrasts:CONTRASTS},coverage:{
   requested:settings.expectedCases,completed:rows.length,executions:runs.length,
   errors:errors.length,timeouts:timeouts.length,unresolved:rows.filter(r=>!r.error&&!r.timedOut&&!resolved(r)).length,
   byMode:Object.fromEntries(['enemies','dungeon','bosses'].map(m=>[m,rows.filter(r=>r.mode===m).length])),
   independentByMode:Object.fromEntries(['enemies','dungeon','bosses'].map(m=>[m,groups.filter(g=>g.mode===m).reduce((n,g)=>n+g.resolved,0)])),
   duplicateAttemptsByMode:Object.fromEntries(['enemies','dungeon','bosses'].map(m=>[m,groups.filter(g=>g.mode===m).reduce((n,g)=>n+g.duplicates,0)])),
   matchedPairs:comparisons.reduce((n,c)=>n+c.pairs,0),
   zeroPairContrasts:comparisons.filter(c=>c.pairs===0).length
  },groups,comparisons,rows,
  recommendation:'Do not nerf/buff based on this exploratory report. Verify natural player talent/gear progression, potions, tactics, and 30+ independent paired seeds before mechanical tuning.'};
}
function run(settings=parseArgs(),simulate=S.simulate){
 const runs=[];
 for(const cohort of COHORTS){
  for(const mode of ['enemies','dungeon',...(cohort.boss?['bosses']:[])]){
   const opts=optionsFor(cohort,mode,settings);
   const report=simulate(opts);
   runs.push({cohort,report});
  }
 }
 return analyze(runs,settings);
}
function markdown(data){
 const f=v=>v===null||v===undefined?'—':String(v);
 const out=['# Wanderer v0.13 — Stage 9.2: curva de progressão (diagnóstico)',
  '', '**Sem alterações de balanceamento.** Motor nativo v0.13; resultados exploratórios.',
  '', 'Fingerprint: '+data.sourceSha256,
  '', '## Cobertura', '',
  '- '+data.coverage.completed+'/'+data.coverage.requested+' combates; '+JSON.stringify(data.coverage.byMode),
  '- Erros: '+data.coverage.errors+'; timeouts: '+data.coverage.timeouts+'; unresolved: '+data.coverage.unresolved,
  '- Combates independentes por modo: '+JSON.stringify(data.coverage.independentByMode)+'; repetições de RNG: '+JSON.stringify(data.coverage.duplicateAttemptsByMode),
  '- Pares válidos: '+data.coverage.matchedPairs+'; contrastes sem pares: '+data.coverage.zeroPairContrasts,
  '', '## Resultados por nível, investimento, combate e build', '',
  '| E / investimento | Tipo | Build | Boss | n | Vitórias | HP mín. % | Dano recebido | Salas | Boss alcançado | Flags |',
  '|---|---|---|---|---:|---:|---:|---:|---:|---:|---|'];
 for(const g of data.groups){
  out.push('| E'+g.level+' '+g.points+'pt '+g.rarity+' | '+g.mode+' | '+g.build+' | '+f(g.bossAffinity)+' | '+g.resolved+' | '+f(g.winPct)+'% | '+f(g.meanMinHpPct)+' | '+f(g.meanDamageTaken)+' | '+f(g.meanRooms)+' | '+f(g.bossReachedPct)+'% | '+g.flags.join(', ')+' |');
 }
 out.push('','## Comparações causais dentro da MESMA Expedition','',
  'São comparáveis apenas lutas com a mesma seed nativa, Affinity, risco, rota (Dungeon) e build. Diferenças são o resultado **de pares válidos**, nunca simples comparações entre níveis.',
  '','| Alteração | E | Modo | Build / Boss | Pares | Δ vitórias (pp) | Δ dano recebido | Δ HP mín. (pp) | Δ salas |',
  '|---|---:|---|---|---:|---:|---:|---:|---:|');
 for(const c of data.comparisons)out.push('| '+c.from+' → '+c.to+' ('+c.axis+') | '+c.level+' | '+c.mode+' | '+c.build+(c.boss?' / '+c.boss:'')+' | '+c.pairs+' | '+f(c.deltaWinPct)+' | '+f(c.deltaDamageTaken)+' | '+f(c.deltaMinHpPct)+' | '+f(c.deltaRooms)+' |');
 out.push('','## Interpretação obrigatória','',
  '- **E1→E5→E15→E35:** variação de nível, encontro, drops e poderes. Não é uma comparação causal. Serve apenas para desenhar a curva.',
  '- **Talentos:** compare pontos diferentes, mesma raridade e mesmo E; são pontos sintéticos, não progressão ganha de verdade.',
  '- **Equipamento:** compare raridade diferente, mesmos talentos e mesmo E; não é a distribuição real de loot.',
  '- **Dungeon:** caminho nativo até ao boss, sem potions automáticas, sem trocar equipamento e sem gastar talentos durante a run.',
  '- **Boss:** diagnóstico isolado do primeiro anel; não equivale a enfrentar o boss depois de ganhar boons e recompensas.',
  '- **Pares:** descartar resultados com Affinity, seed nativa, risco ou rota diferente. Zero pares significa **sem evidência emparelhada**, não ausência de efeito.',
  '- **Floor/ceiling effect:** 0% ou 100% de vitórias com duas seeds não demonstra balanceamento. Não extrapolar.',
  '- **Decisão:** nenhum nerf ou buff automático. Próxima expansão: células difíceis, estratégias manuais, timing de poções e progressão realmente acumulada.',
  '');
 return out.join('\n');
}
function main(args=process.argv.slice(2)){
 const cfg=parseArgs(args),report=run(cfg);
 const dst=path.resolve(process.cwd(),cfg.output),md=dst.replace(/\.json$/,'.md');
 fs.mkdirSync(path.dirname(dst),{recursive:true});
 fs.writeFileSync(dst,JSON.stringify(report,null,2)+'\n');
 fs.writeFileSync(md,markdown(report));
 console.log('STAGE92_SUMMARY='+JSON.stringify({cases:report.coverage.completed,mode:report.coverage.byMode,
  errors:report.coverage.errors,timeouts:report.coverage.timeouts,matchedPairs:report.coverage.matchedPairs,
  zeroPairContrasts:report.coverage.zeroPairContrasts,fingerprint:report.sourceSha256,
  json:cfg.output,markdown:path.relative(process.cwd(),md)}));
 if(report.coverage.errors||report.coverage.timeouts||report.coverage.unresolved)process.exitCode=1;
 return report;
}
module.exports={COHORTS,CONTRASTS,MAX_CASES,parseArgs,optionsFor,identity,resolved,independent,outcome,summarize,pairedContrast,compare,analyze,run,markdown,main};
if(require.main===module)main();
