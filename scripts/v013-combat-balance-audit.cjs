'use strict';
// Stage 9.7: reproducible balance evidence, never gameplay tuning.
// Controlled native combat, same-seed Tank/Elite pairs, optional earned-account pilot.
const fs=require('node:fs'),path=require('node:path');
const S=require('./simulate-progression.cjs');
const C=require('./v013-elite-tank-parity.cjs');
const N=require('./v013-natural-progression.cjs');
const MODES=['bosses','enemies','elites'];
const ALL_BOSSES=['aegis','blood','decay','fury','magic','vitality'];
const ALL_ELITES=['tank','caster','vampire','berserker','gravecaller','rotbound_exarch','ashen_executioner'];
const DEFAULTS=Object.freeze({
 levels:[1],seeds:[9101,9201],builds:['blood-fury','aegis-vitality','magic-decay'],
 affinities:[...ALL_BOSSES],risks:[1],groupSizes:[3,12,20],
 policies:['mechanics'],points:0,rarity:'Common',gear:'current',runes:false,
 tickLimit:4500,scan:120,pairs:12,natural:false,baseline:null,
 out:'reports/v013-stage97-combat-audit.json'
});
const round=(v,d=2)=>Number(Number(v).toFixed(d));
const mean=values=>values.length?round(values.reduce((a,b)=>a+b,0)/values.length):null;
const num=v=>typeof v==='number'&&Number.isFinite(v)?v:null;
const value=(row,name)=>num(row[name]);
function percentile(values,p){
 const a=values.filter(Number.isFinite).sort((x,y)=>x-y);
 if(!a.length)return null;
 const x=(a.length-1)*p,lo=Math.floor(x),hi=Math.ceil(x);
 return round(a[lo]+(a[hi]-a[lo])*(x-lo));
}
function wilson(wins,total){
 if(!total)return null;
 const z=1.95996398454,p=wins/total,z2=z*z,den=1+z2/total;
 const center=(p+z2/(2*total))/den;
 const margin=z*Math.sqrt(p*(1-p)/total+z2/(4*total*total))/den;
 return [round(100*Math.max(0,center-margin),1),round(100*Math.min(1,center+margin),1)];
}
function numbers(rows,name){
 return rows.map(r=>value(r,name)).filter(x=>x!==null);
}
function csv(s){return [...new Set(s.split(','))];}
function parseArgs(args=[]){
 const cfg={...DEFAULTS,levels:[...DEFAULTS.levels],seeds:[...DEFAULTS.seeds],
  builds:[...DEFAULTS.builds],affinities:[...DEFAULTS.affinities],
  risks:[...DEFAULTS.risks],groupSizes:[...DEFAULTS.groupSizes],policies:[...DEFAULTS.policies]};
 for(const arg of args){
  const m=/^--([a-z-]+)=(.+)$/.exec(arg);
  if(!m)throw Error('Expected --name=value: '+arg);
  const [,k,v]=m;
  if(k==='seeds'||k==='levels'||k==='builds'||k==='affinities'||k==='risks'||k==='group-sizes'){
   cfg[k==='group-sizes'?'groupSizes':k]=csv(v);
  }else if(k==='policies')cfg.policies=csv(v);
  else if(k==='points'||k==='tick-limit'||k==='scan'||k==='pairs')
   cfg[k==='tick-limit'?'tickLimit':k]=Number(v);
  else if(k==='rarity'||k==='gear')cfg[k]=v;
  else if(k==='runes'||k==='natural'){
   if(!['true','false'].includes(v))throw Error('Expected true or false: '+arg);
   cfg[k]=v==='true';
  }else if(k==='out'||k==='baseline')cfg[k]=v;
  else throw Error('Unsupported option: '+arg);
 }
 if(!cfg.policies.length||cfg.policies.some(x=>!['focus','mechanics','adds'].includes(x)))
  throw Error('Invalid target policies');
 if(!Number.isSafeInteger(cfg.scan)||cfg.scan<1||cfg.scan>800||
    !Number.isSafeInteger(cfg.pairs)||cfg.pairs<1||cfg.pairs>150||cfg.pairs>cfg.scan)
  throw Error('Pairs/scan must be positive bounded integers, pairs <= scan');
 if(!cfg.out.endsWith('.json')||cfg.baseline!==null&&!cfg.baseline.endsWith('.json'))
  throw Error('Report paths must end with .json');
 const native=S.parseArgs([
  '--mode=bosses','--levels='+cfg.levels.join(','),'--seeds='+cfg.seeds.join(','),
  '--builds='+cfg.builds.join(','),'--affinities='+cfg.affinities.join(','),
  '--risks='+cfg.risks.join(','),'--group-sizes='+cfg.groupSizes.join(','),
  '--points='+cfg.points,'--rarity='+cfg.rarity,'--gear='+cfg.gear,
  '--runes='+cfg.runes,'--tick-limit='+cfg.tickLimit,'--out='+cfg.out
 ]);
 Object.assign(cfg,{levels:native.levels,seeds:native.seeds,builds:native.builds,
  affinities:native.affinities,risks:native.risks,groupSizes:native.groupSizes,
  points:native.points,tickLimit:native.tickLimit});
 cfg.planned=cfg.levels.length*cfg.seeds.length*cfg.builds.length*cfg.policies.length*
  (cfg.affinities.length*cfg.risks.length+cfg.groupSizes.length+1);
 if(cfg.planned>600)throw Error('Max 600 controlled scenarios per batch; split seeds/policies for independent cohorts');
 if(cfg.natural&&cfg.seeds.length>4)throw Error('Natural account pilot limited to four seeds per audit');
 return cfg;
}
function status(r){
 if(r.error)return 'error';
 if(r.timedOut||r.status==='timeout')return 'timeout';
 if(r.won&&!(r.died||r.stage==='failed'))return 'win';
 if(r.died||r.stage==='failed'||r.status==='died')return 'death';
 return 'unresolved';
}
function cellKey(r){
 return JSON.stringify([
  r.mode,r.level,r.build,r.bossAffinity||r.affinity||null,
  r.mode==='bosses'?r.risk??null:null,
  r.mode==='enemies'?r.groupSize:null,
  r.mode==='elites'?r.eliteType||'unclassified':null,
  r.targetPolicy||'focus',r.pointsBudget,r.gearRarity,r.gear
 ]);
}
function controlledGroups(rows){
 const cells=new Map();
 for(const r of rows){const k=cellKey(r);if(!cells.has(k))cells.set(k,[]);cells.get(k).push(r);}
 const out=[];
 for(const [key,sample] of cells){
  const first=sample[0],valid=sample.filter(r=>['win','death'].includes(status(r)));
  const independent=new Map();
  for(const r of valid){
   const seed=r.resolvedSeed??r.seed;
   if(!independent.has(seed))independent.set(seed,r);
  }
  const selected=[...independent.values()];
  const wins=selected.filter(r=>status(r)==='win').length;
  const errors=sample.filter(r=>status(r)==='error').length;
  const timeouts=sample.filter(r=>status(r)==='timeout').length;
  const unknown=sample.filter(r=>status(r)==='unresolved').length;
  const fraction=selected.map(r=>r.hpMax>0&&num(r.damageTaken)!==null?
   100*r.damageTaken/r.hpMax:null).filter(x=>x!==null);
  const casts=selected.reduce((n,r)=>n+(num(r.enemyAbilityCasts)||0),0);
  const seconds=selected.reduce((n,r)=>n+(num(r.seconds)||0),0);
  const initialRoles=Object.fromEntries(['minion','tank','skirmisher','caster','boss','elite']
   .map(role=>[role,selected.reduce((n,r)=>n+(num(r.initialRoles?.[role])||0),0)]));
  const flags=[];
  if(errors)flags.push('native_error');
  if(timeouts)flags.push('native_timeout');
  if(unknown)flags.push('unresolved_outcome');
  if(valid.length!==selected.length)flags.push('duplicate_native_seed');
  if(selected.length<30)flags.push('insufficient_independent_sample');
  if(selected.length===0)flags.push('no_valid_combat');
  if(selected.some(r=>num(r.seconds)===null||r.seconds<=0||num(r.damageTaken)===null))
   flags.push('missing_or_invalid_metrics');
  out.push({
   key,mode:first.mode,level:first.level,build:first.build,
   affinity:first.bossAffinity||first.affinity||null,risk:first.mode==='bosses'?first.risk??null:null,
   groupSize:first.mode==='enemies'?first.groupSize??null:null,
   eliteType:first.mode==='elites'?first.eliteType||null:null,
   policy:first.targetPolicy||'focus',points:first.pointsBudget,rarity:first.gearRarity,
   attempted:sample.length,validAttempts:valid.length,independent:selected.length,
   duplicateSeeds:valid.length-selected.length,errors,timeouts,unresolved:unknown,
   wins,deaths:selected.length-wins,winPct:selected.length?round(100*wins/selected.length,1):null,
   winWilson95:wilson(wins,selected.length),
   secondsP50:percentile(numbers(selected,'seconds'),.5),
   secondsP90:percentile(numbers(selected,'seconds'),.9),
   damageTakenMean:mean(numbers(selected,'damageTaken')),
   damagePctMaxHpMean:mean(fraction),
   damageDealtMean:mean(numbers(selected,'damageDealt')),
   minHpPctP50:percentile(numbers(selected,'minHpPct'),.5),
   manaSpentMean:mean(numbers(selected,'manaSpent')),
   absorbedMean:mean(numbers(selected,'absorbed')),
   initialRoles,initialEnemiesMean:mean(numbers(selected,'initialEnemies')),
   reinforcementsSpawnedMean:mean(numbers(selected,'reinforcementsSpawned')),
   bossWardsMean:mean(numbers(selected,'bossWards')),
   bossCastInterruptionsMean:mean(numbers(selected,'bossCastInterruptions')),
   castsPerMinute:seconds>0?round(60*casts/seconds):null,
   bossCastPreparationsMean:mean(numbers(selected,'bossCastPreparations')),
   bossHealingMean:mean(numbers(selected,'bossHealing')),
   bossSummonsMean:mean(numbers(selected,'bossSummons')),
   eliteSummonsMean:mean(numbers(selected,'eliteSummons')),
   peakLivingEnemiesP90:percentile(numbers(selected,'peakLivingEnemies'),.9),
   flags
  });
 }
 return out.sort((a,b)=>a.mode.localeCompare(b.mode)||a.level-b.level||
  a.build.localeCompare(b.build)||String(a.affinity).localeCompare(String(b.affinity))||
  String(a.eliteType).localeCompare(String(b.eliteType))||(a.risk??0)-(b.risk??0));
}
function bootstrap95(values,seed=12345){
 if(values.length<20)return null; // Never give false precision to small archetype samples.
 let state=seed>>>0;const averages=[];
 for(let repeat=0;repeat<500;repeat++){
  let sum=0;
  for(let i=0;i<values.length;i++){
   state=(Math.imul(state,1664525)+1013904223)>>>0;
   sum+=values[state%values.length];
  }
  averages.push(sum/values.length);
 }
 return [percentile(averages,.025),percentile(averages,.975)];
}
function pairedGroups(raw){
 const pairs=raw.pairs||[],bad=[],unique=new Map();
 for(const p of pairs){
  const key=JSON.stringify([p.gear,p.seed]);
  const tank=p.tank,elite=p.elite;
  if(unique.has(key)){bad.push({key,reason:'duplicate_pair'});continue;}
  if(!tank||!elite||tank.initial?.role!=='tank'||
    elite.initial?.role!=='miniboss'||!ALL_ELITES.includes(elite.initial.eliteType)||
    tank.initial.playerHp!==elite.initial.playerHp||
    tank.initial.playerMaxHp!==elite.initial.playerMaxHp||
    tank.gearFingerprint!==true||elite.gearFingerprint!==true){
   bad.push({key,reason:'unmatched_tank_elite_fixture'});continue;
  }
  unique.set(key,p);
 }
 const groups=[];
 for(const gear of [...new Set(pairs.map(p=>p.gear))]){
  for(const type of ['all',...ALL_ELITES]){
   const sample=[...unique.values()].filter(p=>p.gear===gear&&
    (type==='all'||p.elite.initial.eliteType===type));
   const valid=sample.filter(p=>['win','death'].includes(status(p.tank))&&
    ['win','death'].includes(status(p.elite)));
   const damage=valid.map(p=>p.elite.damageTaken-p.tank.damageTaken);
   const hpLoss=valid.map(p=>p.elite.hpLossFraction-p.tank.hpLossFraction);
   const duration=valid.map(p=>p.elite.seconds-p.tank.seconds);
   const winDelta=valid.map(p=>Number(p.tank.won)-Number(p.elite.won));
   const rows={
    gear,eliteType:type,pairs:sample.length,resolvedPairs:valid.length,
    timeoutsOrUnresolved:sample.length-valid.length,
    tankWins:valid.filter(p=>p.tank.won).length,
    eliteWins:valid.filter(p=>p.elite.won).length,
    discordantTankWinOnly:valid.filter(p=>p.tank.won&&!p.elite.won).length,
    discordantEliteWinOnly:valid.filter(p=>!p.tank.won&&p.elite.won).length,
    extraEliteDamageMean:mean(damage),
    extraEliteDamageBootstrap95:bootstrap95(damage,4109+type.length),
    extraEliteHpLossFractionMean:mean(hpLoss),
    eliteMinusTankSecondsMean:mean(duration),
    eliteMinusTankSecondsBootstrap95:bootstrap95(duration,2901+type.length),
    tankMinusEliteWinPct:valid.length?round(100*mean(winDelta),1):null,
    flags:[]
   };
   if(valid.length<30)rows.flags.push('insufficient_independent_pairs');
   if(!sample.length)rows.flags.push('unobserved_archetype');
   if(sample.length!==valid.length)rows.flags.push('incomplete_pairs');
   groups.push(rows);
  }
 }
 return {groups,invalidPairs:bad,sourceErrors:raw.errors||[],
  sampledNativeTankMisses:raw.skippedNonTank??null,matched:unique.size};
}
function scenarioKey(r){
 return JSON.stringify([r.mode,r.kind,r.level,r.build,r.seed,r.resolvedSeed,
  r.bossAffinity||r.affinity||null,r.risk??null,r.groupSize??null,
  r.nativeEncounter||null,r.pointsBudget,r.gearRarity,r.gearE,
  r.targetPolicy,r.runes??null]);
}
function compareBaseline(current,previous){
 if(!previous||previous.schemaVersion!==1||!Array.isArray(previous.controlled?.rows))
  throw Error('Baseline must be a Stage 9.7 combat audit JSON report');
 const prior=new Map();
 for(const r of previous.controlled.rows)if(['win','death'].includes(status(r))){
  const key=scenarioKey(r);
  if(!prior.has(key))prior.set(key,r);
 }
 const matched=[],unmatched=[];
 for(const r of current.controlled.rows){
  if(!['win','death'].includes(status(r)))continue;
  const old=prior.get(scenarioKey(r));
  if(!old){unmatched.push(r);continue;}
  matched.push({old,now:r});
 }
 const sameBase=JSON.stringify(current.settings)===JSON.stringify(previous.settings);
 const sameVitals=matched.filter(p=>p.old.hpMax===p.now.hpMax&&p.old.mpMax===p.now.mpMax);
 const clean=sameVitals.filter(p=>typeof p.old.gearFingerprint==='string'&&
  p.old.gearFingerprint===p.now.gearFingerprint);
 const equipmentChanged=sameVitals.filter(p=>typeof p.old.gearFingerprint==='string'&&
  typeof p.now.gearFingerprint==='string'&&p.old.gearFingerprint!==p.now.gearFingerprint).length;
 const equipmentUntracked=sameVitals.length-clean.length-equipmentChanged;
 const byMode={};
 for(const mode of MODES){
  const rows=clean.filter(p=>p.now.mode===mode);
  byMode[mode]={
   comparable:rows.length,
   winDeltaPct:rows.length?round(100*mean(rows.map(p=>Number(p.now.won)-Number(p.old.won))),1):null,
   damageTakenDeltaMean:mean(rows.map(p=>p.now.damageTaken-p.old.damageTaken)),
   secondsDeltaMean:mean(rows.map(p=>p.now.seconds-p.old.seconds))
  };
 }
 return {previousSource:previous.sourceSha256,currentSource:current.sourceSha256,
  identicalSettings:sameBase,matched:matched.length,comparablePlayerHpAndMp:sameVitals.length,
  comparableEquipment:clean.length,playerVitalsChanged:matched.length-sameVitals.length,
  equipmentChanged,equipmentUntracked,unmatched:unmatched.length,
  byMode,warnings:[
   ...(!sameBase?['settings_differ_do_not_infer_causes']:[]),
   ...(matched.length<30?['fewer_than_30_matched_scenarios']:[]),
   ...(matched.length!==sameVitals.length?['native_player_vitals_changed']:[]),
   ...(equipmentChanged?['native_equipment_fingerprint_changed']:[]),
   ...(equipmentUntracked?['native_equipment_fingerprint_unavailable']:[]),
   ...(unmatched.length?['native_scenario_not_matched']:[])
  ]};
}
const PREVIEW_RUNTIME_MODULES=Object.freeze([
 'combat/v012-buildcraft.js','combat/talent-catalog.js',
 'combat/talent-graph-runtime.js','online/v012-expedition-runtime.js',
 'online/v013-boss-abilities.js','online/v013-boss-modifiers.js',
 'online/v013-boss-preparation.js','online/v013-enemy-abilities.js',
 'online/v013-elite-abilities.js','economy/v012-loot-rules.js',
 'economy/v013-crafting.js','economy/v013-gear-rolls.js'
]);
function previewRuntimeParity(root=path.resolve(__dirname,'..')){
 const mismatches=[];
 for(const name of PREVIEW_RUNTIME_MODULES){
  const source=path.join(root,name),preview=path.join(root,'docs',name);
  if(!fs.existsSync(source)||!fs.existsSync(preview)||
    !fs.readFileSync(source).equals(fs.readFileSync(preview)))mismatches.push(name);
 }
 const sourceHtml=path.join(root,'index.html'),previewHtml=path.join(root,'docs/index.html');
 return {checkedModules:PREVIEW_RUNTIME_MODULES.length,mismatches,
  htmlDiffers:!fs.existsSync(sourceHtml)||!fs.existsSync(previewHtml)||
   !fs.readFileSync(sourceHtml).equals(fs.readFileSync(previewHtml)),
  note:'Core native combat/economy module parity only. The source and preview inline HTML may differ (art/layout); this audit cannot prove inline gameplay equivalence.'};
}
function expectedCases(cfg,mode){
 const per=mode==='bosses'?cfg.affinities.length*cfg.risks.length:
  mode==='enemies'?cfg.groupSizes.length:1;
 return cfg.levels.length*cfg.seeds.length*cfg.builds.length*per;
}
function run(cfg=parseArgs(),deps={}){
 const simulate=deps.simulate||S.simulate,compare=deps.compare||C.compare;
 const runNatural=deps.runNatural||N.run;
 const source=deps.fingerprint?deps.fingerprint():S.sourceFingerprint();
 const runs=[],rows=[],issues=[],start=Date.now();
 const preview=deps.previewParity?deps.previewParity():previewRuntimeParity();
 if(preview.mismatches?.length)issues.push('preview_runtime_module_mismatch_'+preview.mismatches.join(','));
 for(const policy of cfg.policies)for(const mode of MODES){
  const opts={...S.DEFAULTS,mode,levels:cfg.levels,seeds:cfg.seeds,
   builds:cfg.builds,affinities:cfg.affinities,risks:cfg.risks,
   groupSizes:cfg.groupSizes,points:cfg.points,rarity:cfg.rarity,gear:cfg.gear,
   runes:cfg.runes,tickLimit:cfg.tickLimit,targetPolicy:policy};
  const out=simulate(opts);
  if(out.sourceSha256!==source.sha256)issues.push('source_fingerprint_mismatch_'+mode+'_'+policy);
  if(!Array.isArray(out.rows)||out.rows.length!==expectedCases(cfg,mode))
   throw Error('Incomplete '+mode+' scenario matrix for '+policy);
  runs.push({mode,policy,cases:out.rows.length,errors:out.summary?.errors??null});
  rows.push(...out.rows);
 }
 const paired=pairedGroups(compare({pairCap:cfg.pairs,scan:cfg.scan,seedStart:9300,
  tickLimit:cfg.tickLimit,gearModes:['starter','common']}));
 const natural=cfg.natural?runNatural(N.parseArgs([
  '--seeds='+cfg.seeds.join(','),'--profiles=cautious,balanced',
  '--max-level=3','--max-attempts=3','--tick-limit='+cfg.tickLimit
 ])):null;
 const groups=controlledGroups(rows);
 const errors=rows.filter(r=>status(r)==='error'),timeouts=rows.filter(r=>status(r)==='timeout');
 const unresolved=rows.filter(r=>status(r)==='unresolved');
 const missingBosses=ALL_BOSSES.filter(k=>cfg.affinities.includes(k)&&
  !rows.some(r=>r.mode==='bosses'&&r.bossAffinity===k&&['win','death'].includes(status(r))));
 const missingEliteTypes=ALL_ELITES.filter(k=>!paired.groups.some(g=>g.eliteType===k&&g.resolvedPairs>0));
 const failures=[...issues,
  ...errors.length?['controlled_errors_'+errors.length]:[],
  ...timeouts.length?['controlled_timeouts_'+timeouts.length]:[],
  ...unresolved.length?['controlled_unresolved_'+unresolved.length]:[],
  ...paired.invalidPairs.length?['invalid_matched_pairs_'+paired.invalidPairs.length]:[],
  ...paired.sourceErrors.length?['paired_engine_errors_'+paired.sourceErrors.length]:[],
  ...paired.groups.filter(x=>x.pairs!==x.resolvedPairs).map(x=>'incomplete_pair_'+x.gear+'_'+x.eliteType),
  ...(natural?.coverage?.errors?['natural_account_errors_'+natural.coverage.errors]:[])
 ];
 const report={
  schemaVersion:1,stage:'9.7',engine:'v0.13 native controlled combat + matched Tank/Elite + optional natural accounts',
  sourceSha256:source.sha256,sourceModules:source.files,settings:{
   levels:cfg.levels,seeds:cfg.seeds,builds:cfg.builds,affinities:cfg.affinities,
   risks:cfg.risks,groupSizes:cfg.groupSizes,policies:cfg.policies,points:cfg.points,
   rarity:cfg.rarity,gear:cfg.gear,runes:cfg.runes,tickLimit:cfg.tickLimit,
   pairs:cfg.pairs,scan:cfg.scan,natural:cfg.natural
  },
  coverage:{planned:cfg.planned,observed:rows.length,
   resolvedIndependent:groups.reduce((n,g)=>n+g.independent,0),
   duplicateResolvedSeeds:groups.reduce((n,g)=>n+g.duplicateSeeds,0),
   errors:errors.length,timeouts:timeouts.length,unresolved:unresolved.length,
   missingBosses,missingEliteTypes,matchedPairs:paired.matched,
   underpoweredCells:groups.filter(g=>g.independent<30).length},
  previewRuntimeParity:preview,
  controlled:{runs,groups,rows},paired,
  natural:natural?{coverage:natural.coverage,levels:natural.levels,accounts:natural.accounts,
   note:'Native earned-account results only, not pooled with controlled encounter wins.'}:null,
  failures,
  interpretation:[
   'Controlled Boss/Elite/swarms are deliberately inserted into a first-ring room with fixed debug gear; NOT representative campaign victories.',
   'Before/after native fights are only comparable when exact rolled equipment fingerprints, player HP/MP and scenario identities match. Changed gear is flagged, not silently averaged.',
   'Wilson intervals apply to native independent-seed fight outcomes, NOT to human player win rates.',
   'Rows with native errors/timeouts/unresolved outcomes are excluded from win denominators, and separately fail data-quality checks.',
   'Do not add together different builds, archetypes or risk groups to choose balance multipliers.',
   'Damage received on fatal hits is capped by actual remaining HP; high lethality is not captured by mean damage alone.',
   'Full E1–E8 progression needs a separate earned-account cohort; unreachable levels are censored, never zero wins.',
   '30 independent seeds per exact cell is a minimum diagnostic threshold, not a guarantee of statistical precision or a balance target.',
   'Per-ability damage attribution and human dodge/timing are not provided by the native runtime counters.',
   'Canonical index.html and GitHub Pages docs/index.html differ; matching external combat modules do not automatically prove identical inline HTML gameplay.'
  ],durationMs:Date.now()-start
 };
 if(cfg.baseline){
  const before=JSON.parse(fs.readFileSync(path.resolve(process.cwd(),cfg.baseline),'utf8'));
  report.baselineComparison=compareBaseline(report,before);
 }
 return report;
}
function markdown(r){
 const c=r.coverage;
 const lines=[
  '# Wanderer v0.13 — Stage 9.7 Combat Balance Audit','',
  'Native source fingerprint: '+r.sourceSha256,'',
  '| Controlled cases | Independent resolved | Duplicate native seeds | Errors | Timeouts | Unresolved |',
  '|---:|---:|---:|---:|---:|---:|',
  '| '+c.observed+' | '+c.resolvedIndependent+' | '+c.duplicateResolvedSeeds+' | '+c.errors+' | '+c.timeouts+' | '+c.unresolved+' |',
  '',
  '## Controlled encounter cells (never natural win rates)','',
  '| Mode | E | Build | Affinity | Elite / Size | Policy | n independent | Wins | Wilson 95% | Damage % max HP | Duration P50/P90 | Flags |',
  '|---|---:|---|---|---|---|---:|---:|---|---:|---|---|'
 ];
 for(const x of r.controlled.groups){
  lines.push('| '+x.mode+' | '+x.level+' | '+x.build+' | '+(x.affinity||'—')+
   ' | '+(x.eliteType||x.groupSize||'—')+' | '+x.policy+' | '+x.independent+
   ' | '+x.wins+' | '+(x.winWilson95?x.winWilson95.join('–')+'%':'n/a')+
   ' | '+(x.damagePctMaxHpMean??'n/a')+' | '+(x.secondsP50??'n/a')+' / '+
   (x.secondsP90??'n/a')+' | '+(x.flags.join(', ')||'—')+' |');
 }
 lines.push('','## Tank vs Elite: only true same-seed 1v1 pairs','',
  '| Gear | Elite subtype | Valid pairs | Tank wins | Elite wins | Elite minus Tank damage | 95% bootstrap | Discordant outcomes |',
  '|---|---|---:|---:|---:|---:|---|---|');
 for(const x of r.paired.groups)lines.push('| '+x.gear+' | '+x.eliteType+
  ' | '+x.resolvedPairs+' | '+x.tankWins+' | '+x.eliteWins+' | '+(x.extraEliteDamageMean??'n/a')+
  ' | '+(x.extraEliteDamageBootstrap95?.join('–')||'n/a; n<20')+
  ' | '+x.discordantTankWinOnly+' / '+x.discordantEliteWinOnly+' |');
 lines.push('','Unobserved Boss affinities: '+(c.missingBosses.join(', ')||'none'),
  'Unobserved Elite types: '+(c.missingEliteTypes.join(', ')||'none'),
  'Underpowered controlled cells (<30 independent seeds): '+c.underpoweredCells,
  'Preview combat module mirrors: '+r.previewRuntimeParity.checkedModules+' checked; mismatches: '+(r.previewRuntimeParity.mismatches.join(', ')||'none')+'; HTML differs: '+r.previewRuntimeParity.htmlDiffers,
  'Quality failures: '+(r.failures.join('; ')||'none'),'');
 if(r.natural)lines.push('## Natural earned-account pilot','',
  'Accounts: '+r.natural.coverage.accounts+', errors: '+r.natural.coverage.errors,
  '. Do not combine these results with the controlled encounter sample.','');
 if(r.baselineComparison)lines.push('## Matched prior-version comparison','',
  'Paired scenarios: '+r.baselineComparison.matched+
  '; comparable player HP/MP: '+r.baselineComparison.comparablePlayerHpAndMp+
  '; identical native equipment: '+r.baselineComparison.comparableEquipment+
  '; unmatched: '+r.baselineComparison.unmatched+
  '; identical settings: '+r.baselineComparison.identicalSettings,'',
  'Interpret with caution: '+r.baselineComparison.warnings.join(', '),'');
 lines.push('## Interpretation limits','',...r.interpretation.map(s=>'- '+s),'');
 return lines.join('\n');
}
function main(args=process.argv.slice(2)){
 const cfg=parseArgs(args),report=run(cfg),dest=path.resolve(process.cwd(),cfg.out);
 fs.mkdirSync(path.dirname(dest),{recursive:true});
 fs.writeFileSync(dest,JSON.stringify(report,null,2)+'\n');
 fs.writeFileSync(dest.replace(/\.json$/,'.md'),markdown(report));
 console.log('COMBAT_AUDIT='+JSON.stringify({file:cfg.out,coverage:report.coverage,
  failures:report.failures,source:report.sourceSha256}));
 if(report.failures.length)process.exitCode=1;
 return report;
}
module.exports={ALL_BOSSES,ALL_ELITES,DEFAULTS,parseArgs,status,wilson,percentile,
 controlledGroups,pairedGroups,bootstrap95,scenarioKey,compareBaseline,previewRuntimeParity,run,markdown,main};
if(require.main===module)main();
