'use strict';
// Stage 6.14 focused follow-up: independently seeded repeats of exactly the
// three *previously observed* one-node combat flips, against controlled native
// opponents. No gameplay balance mutation and no earned-progression claims.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const M=require('./v013-stage614-single-node-ablation.cjs');
const S=require('./simulate-progression.cjs');
const T=globalThis.WandererAutomaticTalents;
const sha=x=>crypto.createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');
const unique=arr=>[...new Set(arr)];
const SPEC=Object.freeze([
 {key:'unbreakable',caseId:'ablation-016',target:'unbreakable',rank:1,
  beforeHash:'ab6daa0df75f71bb937e1f9c96d6a03bc27683df4415095680d320b27fbd405c',
  afterHash:'014a4492a0800c5ee9d10425f8ca2ade543cb3a639ec4cdfcc33230d0b20884b',
  sourceArchetype:'route:unbreakable',budget:24,weapon:'Wand',armor:'Plate',offhand:'Orb',
  original:{encounter:'elite',affinity:'decay'},
  opponents:[{key:'original',encounter:'elite',affinity:'decay'},
   {key:'same-role-other-affinity',encounter:'elite',affinity:'arcane'},
   {key:'boss-original-affinity',encounter:'boss',affinity:'decay'}]},
 {key:'arcane-focus',caseId:'ablation-012',target:'arcane_focus',rank:1,
  beforeHash:'54e9414371746a3c6e68498f35a0a63b2ca08cd543eee85461f0586c40c32cd6',
  afterHash:'99d69d518b79d7dbd10e0d2f9806677428aa46a17c265177dfee0865c33e1a8a',
  sourceArchetype:'profile:decay-arcane-aegis',budget:24,weapon:'Staff',armor:'Leather',offhand:null,
  original:{encounter:'normal',affinity:'radiance'},
  opponents:[{key:'original',encounter:'normal',affinity:'radiance'},
   {key:'same-role-other-affinity',encounter:'normal',affinity:'decay'},
   {key:'elite-original-affinity',encounter:'elite',affinity:'radiance'}]},
 {key:'brace-rank2',caseId:'ablation-011',target:'brace_rank2',rank:2,
  beforeHash:'029bee28a0974e1d4c587736483586334b0fff977527b4a842765c5480f4a481',
  afterHash:'83b5697f41e8ee3993c12959099ae19d55cf6e2f3feaedb6b96b6e53c6620908',
  sourceArchetype:'route:arcane_bastion',budget:60,weapon:'Two-Handed',armor:'Cloth',offhand:null,
  original:{encounter:'boss',affinity:'decay'},
  opponents:[{key:'original',encounter:'boss',affinity:'decay'},
   {key:'same-role-other-affinity',encounter:'boss',affinity:'aegis'},
   {key:'elite-original-affinity',encounter:'elite',affinity:'decay'}]}
]);
const DEFAULTS=Object.freeze({mode:'pilot',seedsPerOpponent:4,seedStart:7150011,
 rarity:'Rare',tickLimit:4500,resume:false,
 out:'reports/v013-stage614-retest-pilot.json'});
function oldCases(){
 // Use exactly the committed deterministic Stage 6.14 final balanced
 // selection: not a reconstructed arbitrary build or a convenient new path.
 const all=M.selectCases([12,24,36,60],24).selected;
 if(all.length!==24)throw Error('Canonical Stage 6.14 24-node experiment changed');
 return SPEC.map(spec=>{
  const old=all.find(c=>c.caseId===spec.caseId);
  if(!old||old.base!==spec.target.replace(/_rank[0-9]+$/,'')||
   old.target!==spec.target||old.rank!==spec.rank||
   old.beforeHash!==spec.beforeHash||old.afterHash!==spec.afterHash||
   old.sourceArchetype!==spec.sourceArchetype||old.budget!==spec.budget||
   old.weapon!==spec.weapon||old.armor!==spec.armor||
   old.offhand!==spec.offhand||
   old.encounter!==spec.original.encounter||old.affinity!==spec.original.affinity)
   throw Error('Canonical Stage 6.14 source case drift: '+spec.key);
  M.verifyAblation(old.before,old.after,old.target);
  if(!T.valid(old.before)||!T.valid(old.after)||
   T.earned(old.before)!==spec.budget||
   T.earned(old.after)!==spec.budget)
    throw Error('Invalid native original talent allocation');
  return {...spec,source:old};
 });
}
function plan(settings=DEFAULTS){
 const {seedsPerOpponent,seedStart}=settings;
 if(!Number.isSafeInteger(seedsPerOpponent)||seedsPerOpponent<1||seedsPerOpponent>64||
    !Number.isSafeInteger(seedStart)||seedStart<7000000||seedStart>0x7fffffff-500000)
  throw Error('Invalid independent seed cohort parameters');
 const originals=oldCases(),rows=[];
 for(const [i,original] of originals.entries()){
  for(const [j,opponent] of original.opponents.entries()){
   for(let n=0;n<seedsPerOpponent;n++){
    // 59 > max 48 native Realm-card resolution shifts; stratum buckets
    // are separated by 10k and each talent starts 100k apart.
    const seed=seedStart+i*100000+j*10000+n*59;
    const caseId='retest-'+original.key+'-'+opponent.key;
    rows.push({...original.source,caseId,id:caseId+'|s'+String(n).padStart(2,'0'),
     sourceCaseId:original.caseId,
     sourceBeforeHash:original.beforeHash,sourceAfterHash:original.afterHash,
     key:original.key,variant:opponent.key,
     encounter:opponent.encounter,affinity:opponent.affinity,
     seed,seedIndex:n});
   }
  }
 }
 if(rows.length!==9*seedsPerOpponent||
    unique(rows.map(x=>x.id)).length!==rows.length||
    unique(rows.map(x=>x.seed)).length!==rows.length)
  throw Error('Duplicated or missing paired native scenario cohort');
 return {sourceCases:originals.map(o=>({key:o.key,caseId:o.caseId,target:o.target,
  rank:o.rank,budget:o.budget,beforeHash:o.beforeHash,afterHash:o.afterHash,
  sourceArchetype:o.sourceArchetype,weapon:o.weapon,armor:o.armor,
  offhand:o.offhand,opponents:o.opponents})),
  rows,selectedCases:3,opponentStrata:9,uniqueSeeds:rows.length,
  nativePairs:rows.length,nativeFights:rows.length*2};
}
function provenance(){
 const f=['./simulate-progression.cjs','./v013-stage611-legal-adaptive.cjs',
  './v013-stage612-controlled-combat.cjs','./v013-stage613-matched-talents.cjs',
  './v013-stage614-single-node-ablation.cjs','./v013-stage614-rerun-three.cjs'];
 return {nativeGame:S.sourceFingerprint().sha256,
  modules:Object.fromEntries(f.map(p=>[p,sha(fs.readFileSync(require.resolve(p)))]))};
}
function verifiedPair(row,settings=DEFAULTS){
 const result=M.paired(row,{...M.DEFAULTS,rarity:settings.rarity,
  tickLimit:settings.tickLimit});
 if(!result.sameNonTalentSetup||
   Object.keys(result.checks||{}).length!==14||
   !Object.values(result.checks).every(Boolean)||
   result.before.spent+1!==result.after.spent||
   result.before.native.resolvedSeed!==result.after.native.resolvedSeed||
   result.before.native.gearFingerprint!==result.after.native.gearFingerprint)
  throw Error('Native follow-up could not verify matched one-node treatment');
 if(result.node!==row.base||result.rank!==row.rank||result.seed!==row.seed||
   result.encounter!==row.encounter||result.affinity!==row.affinity||
   result.beforeHash!==row.sourceBeforeHash||result.afterHash!==row.sourceAfterHash)
  throw Error('Stage 6.14 source or opponent fixture drift');
 return {...result,sourceCaseId:row.sourceCaseId,targetKey:row.key,
  opponentVariant:row.variant,sourceExperiment:'Stage 6.14 final, six-seed cohort',
  followupExperiment:'independent deterministic seeds, one legal purchase per pair'};
}
function median(v){
 if(!v.length)return null;
 const a=v.slice().sort((x,y)=>x-y),n=a.length;
 return n%2?a[(n-1)/2]:(a[n/2-1]+a[n/2])/2;
}
function group(rows){
 if(!rows.length)throw Error('Cannot summarize empty opponent cohort');
 const x=rows[0],n=rows.length;
 const count=o=>rows.filter(r=>r.outcome===o).length;
 const winsBoth=rows.filter(r=>r.outcome==='both-win');
 const avg=k=>Number((rows.reduce((s,r)=>s+r.delta[k],0)/n).toFixed(4));
 const distinctEnemyActors=unique(rows.map(r=>r.rosterSha256)).length;
 const b=count('baseline-only-win'),a=count('node-only-win');
 const changed=key=>rows.filter(r=>Math.abs(r.delta[key])>0.001).length;
 return {target:x.targetKey,sourceCaseId:x.sourceCaseId,
  opponent:x.opponentVariant,encounter:x.encounter,affinity:x.affinity,
  level:x.level,budget:x.budget,weapon:x.weapon,armor:x.armor,offhand:x.offhand,
  seeds:n,baselineWins:rows.filter(r=>r.before.won).length,
  treatmentWins:rows.filter(r=>r.after.won).length,
  gain:a,loss:b,bothWin:count('both-win'),bothLose:count('both-lose'),
  pairedWinDifferencePercent:Number(((a-b)*100/n).toFixed(2)),
  medianBothWinDurationDeltaSeconds:median(winsBoth.map(r=>r.delta.durationSeconds)),
  meanHpFractionDelta:avg('hpFraction'),
  meanBarrierGeneratedDelta:avg('barrierGenerated'),
  meanBarrierAbsorbedDelta:avg('barrierAbsorbed'),
  meanHealingDelta:avg('healingActual'),
  meanDotDamageDelta:avg('dotDamageActual'),
  meanManaSpentDelta:avg('manaSpent'),
  measurableChanges:{seconds:changed('durationSeconds'),hpFraction:changed('hpFraction'),
   barrierGenerated:changed('barrierGenerated'),barrierAbsorbed:changed('barrierAbsorbed'),
   healing:changed('healingActual'),dotDamage:changed('dotDamageActual'),
   manaSpent:changed('manaSpent')},
  distinctNativeRosterFingerprints:distinctEnemyActors,
  confidence:'Exploratory, controlled native paired diagnostic; NOT a causal global node ranking'};
}
function summary(rows){
 const targetKeys=SPEC.map(s=>s.key),strata=[];
 for(const t of targetKeys)
  for(const opp of SPEC.find(s=>s.key===t).opponents){
   const found=rows.filter(r=>r.targetKey===t&&r.opponentVariant===opp.key);
   if(found.length)strata.push(group(found));
  }
 const totals=targetKeys.map(k=>{
  const matched=rows.filter(r=>r.targetKey===k);
  if(!matched.length)return null;
  const n=matched.length;
  return {target:k,pairedSeeds:n,perOpponent:SPEC.find(s=>s.key===k).opponents.length,
   winsBaseline:matched.filter(r=>r.before.won).length,
   winsWithNode:matched.filter(r=>r.after.won).length,
   gain:matched.filter(r=>r.outcome==='node-only-win').length,
   loss:matched.filter(r=>r.outcome==='baseline-only-win').length,
   pooledAcrossDifferentOpponentsOnlyForDescription:true};
 }).filter(Boolean);
 const total=k=>rows.filter(r=>r.outcome===k).length;
 return {nativePairs:rows.length,nativeFights:2*rows.length,
  matched:rows.filter(r=>r.sameNonTalentSetup).length,
  uniqueSeeds:unique(rows.map(r=>r.seed)).length,
  differentTargetNodes:unique(rows.map(r=>r.targetKey)).length,
  opponentStrata:strata.length,
  bossPairs:rows.filter(r=>r.encounter==='boss').length,
  elitePairs:rows.filter(r=>r.encounter==='elite').length,
  normalPairs:rows.filter(r=>r.encounter==='normal').length,
  gain:total('node-only-win'),loss:total('baseline-only-win'),
  bothWin:total('both-win'),bothLose:total('both-lose'),
  strata,targetSummary:totals};
}
function atomicWrite(file,data){
 const abs=path.resolve(file),temp=abs+'.tmp-'+process.pid;
 fs.mkdirSync(path.dirname(abs),{recursive:true});
 fs.writeFileSync(temp,JSON.stringify(data,null,2)+'\n');fs.renameSync(temp,abs);
}
function verifyResume(previous,input){
 if(previous.stage!=='6.14-rerun-three'||
   previous.kind!==input.kind||
   previous.configHash!==input.configHash||
   previous.plannedIds?.join('|')!==input.plannedIds.join('|')||
   !Array.isArray(previous.results)||previous.results.length!==previous.completed||
   previous.completed>input.plannedIds.length||
   unique(previous.results.map(r=>r.id)).length!==previous.completed)
   throw Error('Cannot resume with changed node, source code, RNG cohort or combat parameters');
 for(let i=0;i<previous.completed;i++){
  const x=previous.results[i];
  if(x.id!==input.plannedIds[i]||x.sameNonTalentSetup!==true||
   Object.keys(x.checks||{}).length!==14||Object.values(x.checks).some(v=>v!==true)||
   x.spentAfter!==x.spentBefore+1||
   !Number.isFinite(x.before?.native?.seconds)||!Number.isFinite(x.after?.native?.seconds))
   throw Error('Corrupted or unmatched completed native cohort');
 }
}
function run(settings=DEFAULTS){
 const p=plan(settings),prov=provenance();
 const config={seedStart:settings.seedStart,
  seedsPerOpponent:settings.seedsPerOpponent,rarity:settings.rarity,
  tickLimit:settings.tickLimit,sourceCases:p.sourceCases};
 const input={stage:'6.14-rerun-three',
  kind:'independent-seed-native-skill-ablation-retest',
  configHash:sha({prov,config,ids:p.rows.map(r=>r.id)}),
  plannedIds:p.rows.map(r=>r.id)};
 let report={...input,source:prov,config,
  planned:{targets:p.selectedCases,strata:p.opponentStrata,
   matchedPairs:p.nativePairs,nativeFights:p.nativeFights},
  completed:0,results:[],
  cautions:[
   'PRE-SELECTED: exact three Stage 6.14 positive-flip node states selected before these seed results; not a blind exploratory sample.',
   'The three cases were selected BECAUSE of prior positive observations: avoid winner-selection bias and regression-to-the-mean claims.',
   'All test XP, high-E access and native item rolls are controlled fixtures, not earned from E1. The baseline leaves one point unspent.',
   'Each pair has identical RNG starting seed, full gear fingerprint and initial enemy roster; action-dependent RNG consumption can diverge.',
   'Across independent seeds native enemy and gear rolls can vary. Never claim all 32 repeats share identical equipment.',
   'Different opponent strata are kept separate; aggregated per-talent counts are only descriptive, not general effectiveness estimates.',
   'A confirmed win flip does not isolate whether a damage, shield, AI or timing mechanic is the mediating cause.',
   '32 seeds per stratum provide a stronger diagnostic than six, but cannot prove ability balance, causality across all builds, or global rankings.',
   'No consumables, Boons, progression XP economy, build swaps, or changes to native game damage/AI/balance rules.'
  ]};
 if(settings.resume&&fs.existsSync(settings.out)){
  const old=JSON.parse(fs.readFileSync(settings.out,'utf8'));
  verifyResume(old,input);report=old;
 }
 for(let i=report.completed;i<p.rows.length;i++){
  report.results.push(verifiedPair(p.rows[i],settings));
  report.completed=report.results.length;
  report.summary=summary(report.results);
  atomicWrite(settings.out,report);
 }
 report.summary=summary(report.results);atomicWrite(settings.out,report);
 return report;
}
function parse(args=[]){
 const out={...DEFAULTS};
 for(const a of args){
  const m=/^--([a-z-]+)=(.+)$/.exec(a);
  if(!m)throw Error('Expected --key=value: '+a);
  const [,k,v]=m;
  if(k==='mode'&&['pilot','matrix','plan'].includes(v))out.mode=v;
  else if(k==='seeds-per-opponent')out.seedsPerOpponent=Number(v);
  else if(k==='seed-start')out.seedStart=Number(v);
  else if(k==='tick-limit')out.tickLimit=Number(v);
  else if(k==='rarity'&&['Uncommon','Rare','Epic'].includes(v))out.rarity=v;
  else if(k==='resume'&&['true','false'].includes(v))out.resume=v==='true';
  else if(k==='out'&&v.endsWith('.json'))out.out=v;
  else throw Error('Unknown focused retest parameter '+a);
 }
 if(!Number.isSafeInteger(out.tickLimit)||out.tickLimit<100||out.tickLimit>20000)
  throw Error('Invalid native tick cap');
 if(!Number.isSafeInteger(out.seedsPerOpponent)||out.seedsPerOpponent<1||
  out.seedsPerOpponent>64)throw Error('Invalid seeds-per-opponent cohort');
 if(!Number.isSafeInteger(out.seedStart)||out.seedStart<7000000||
  out.seedStart>0x7fffffff-500000)throw Error('Invalid seed-start');
 return out;
}
function markdown(report){
 const s=report.summary;
 return ['# Focused Stage 6.14 retest — three previously positive nodes','',
 '## Scope / actual evidence','',
 'Full native game SHA-256: '+report.source.nativeGame,
 'Actual completed matched seed pairs: '+s.nativePairs,
 'Actual native battle executions: '+s.nativeFights,
 'Match guardrails all passed: '+s.matched+'/'+s.nativePairs,
 'Different nodes: '+s.differentTargetNodes,
 'Enemy strata: '+s.opponentStrata,
 'Unique planned seed starts: '+s.uniqueSeeds,
 'Gained wins with node: '+s.gain,'Lost wins with node: '+s.loss,
 'Both won: '+s.bothWin,'Both lost: '+s.bothLose,'',
 '## Per-node, per-opponent results (do NOT pool as global win rates)','',
 '| Talent | Opponent | Affinity | Seeds | Baseline W | With node W | Gained | Lost | Win Δ (pp) | Barrier Δ | HP fraction Δ |',
 '|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|',
 ...s.strata.map(x=>'| '+x.target+' | '+x.encounter+' | '+x.affinity+
 ' | '+x.seeds+' | '+x.baselineWins+' | '+x.treatmentWins+' | '+x.gain+
 ' | '+x.loss+' | '+x.pairedWinDifferencePercent+' | '+
 x.meanBarrierGeneratedDelta+' | '+x.meanHpFractionDelta+' |'),'',
 '## Guardrails and inferential cautions','',
 ...report.cautions.map(x=>'- '+x),''].join('\n');
}
function main(argv=process.argv.slice(2)){
 const settings=parse(argv);
 if(settings.mode==='plan'){
  const p=plan(settings);
  const out={stage:'6.14-rerun-three',kind:'planned-only',
   nodes:p.sourceCases,opponentStrata:p.opponentStrata,
   plannedPairs:p.nativePairs,plannedFights:p.nativeFights,
   requestedIndependentSeedStarts:p.uniqueSeeds};
  atomicWrite(settings.out,out);
  console.log('RETEST_PLAN='+JSON.stringify({nodes:3,strata:p.opponentStrata,
   plannedPairs:p.nativePairs,nativeFights:p.nativeFights}));
  return out;
 }
 const report=run(settings);
 fs.writeFileSync(settings.out.replace(/\.json$/,'.md'),markdown(report));
 console.log('RETEST_ACTUAL='+JSON.stringify({mode:settings.mode,out:settings.out,
  pairs:report.summary.nativePairs,fights:report.summary.nativeFights,
  allMatched:report.summary.matched,strata:report.summary.opponentStrata,
  gain:report.summary.gain,loss:report.summary.loss,
  bothWin:report.summary.bothWin,bothLose:report.summary.bothLose,
  byOpponent:report.summary.strata.map(x=>({target:x.target,
   kind:x.encounter,affinity:x.affinity,n:x.seeds,baseline:x.baselineWins,
   withNode:x.treatmentWins,gain:x.gain,loss:x.loss}))}));
 return report;
}
if(require.main===module){try{main();}catch(e){console.error('RETEST_ERROR',e.stack||e);process.exitCode=1;}}
module.exports={SPEC,DEFAULTS,oldCases,plan,verifiedPair,group,summary,verifyResume,
 provenance,run,parse,markdown,main};
