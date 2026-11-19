'use strict';
// Controlled 30-seed Gravecaller experiment: same native seed/gear against
// unchanged combat rules, two different player target-selection heuristics.
// No player saves, Firebase, stat tuning or altered spawn probabilities.
const fs=require('node:fs'),path=require('node:path');
const C=require('./v013-elite-tank-parity.cjs');
const A=require('./v013-combat-balance-audit.cjs');
const S=require('./simulate-progression.cjs');
function parseArgs(args=process.argv.slice(2)){
 const o={gear:'starter',seedStart:16001,scan:3600,target:30,tickLimit:4500,
  out:'reports/gravecaller-minions-first-starter.json'};
 for(const arg of args){
  const match=/^--([a-z-]+)=(.+)$/.exec(arg);if(!match)throw Error('Expected --key=value: '+arg);
  const [,k,v]=match;
  if(k==='gear'&&['starter','common'].includes(v))o.gear=v;
  else if(k==='seed-start'||k==='scan'||k==='target'||k==='tick-limit')
   o[k==='seed-start'?'seedStart':k==='tick-limit'?'tickLimit':k]=Number(v);
  else if(k==='out'&&v.endsWith('.json'))o.out=v;
  else throw Error('Invalid option: '+arg);
 }
 if(!Number.isSafeInteger(o.seedStart)||o.seedStart<1||o.seedStart>=4000000000||
  !Number.isSafeInteger(o.scan)||o.scan<1||o.scan>6000||
  !Number.isSafeInteger(o.target)||o.target<1||o.target>100||
  !Number.isSafeInteger(o.tickLimit)||o.tickLimit<100||o.tickLimit>6000)
  throw Error('Bounded positive seed, scan, target and tick limit required');
 return o;
}
const mean=a=>a.length?+(a.reduce((s,n)=>s+n,0)/a.length).toFixed(2):null;
const pct=(n,d)=>d?+(100*n/d).toFixed(1):null;
const resolved=r=>r.won===true?'win':r.died===true?'death':r.timedOut===true?'timeout':'unresolved';
function snapshot(r){
 return {
  policy:r.targetPolicy,status:resolved(r),won:!!r.won,died:!!r.died,
  seconds:r.seconds,hpStart:r.hpStart,hpEnd:r.hpEnd,hpMax:r.hpMax,
  damageTaken:r.damageTaken,damageDealt:r.damageDealt,
  targetSwitches:r.targetSwitches,minionFocusSwitches:r.minionFocusSwitches,
  minionFocusSeconds:r.minionFocusSeconds,
  eliteSummons:r.eliteSummons,deathboundApplications:r.deathboundApplications,
  deathboundTicks:r.deathboundTicks,deathboundDamage:r.deathboundDamage,
  enemyAbilityCasts:r.enemyAbilityCasts
 };
}
function verifyMatch(seed,mechanics,adds){
 if(!mechanics.gearFingerprint||!adds.gearFingerprint||
  mechanics.seed!==seed||adds.seed!==seed||
  mechanics.initial?.eliteType!=='gravecaller'||
  adds.initial?.eliteType!=='gravecaller'||
  mechanics.initial.playerMaxHp!==adds.initial.playerMaxHp||
  mechanics.initial.hp!==adds.initial.hp||
  mechanics.initial.atk!==adds.initial.atk||
  mechanics.initial.def!==adds.initial.def||
  mechanics.family!==adds.family||
  mechanics.gear!==adds.gear||
  mechanics.initial.playerHp!==adds.initial.playerHp)
  throw Error('Native paired fixture drift at seed '+seed);
 if(!['win','death'].includes(resolved(mechanics))||
    !['win','death'].includes(resolved(adds)))
  throw Error('Unresolved policy comparison for seed '+seed);
}
function summarize(rows,key){
 const fights=rows.map(r=>r[key]),wins=fights.filter(r=>r.won).length;
 return {policy:key,n:fights.length,wins,deaths:fights.filter(r=>r.died).length,
  winRatePct:pct(wins,fights.length),wilson95:A.wilson(wins,fights.length),
  meanDamageTaken:mean(fights.map(r=>r.damageTaken)),
  meanDurationSeconds:mean(fights.map(r=>r.seconds)),
  meanDeathboundDamage:mean(fights.map(r=>r.deathboundDamage)),
  meanDeathboundTicks:mean(fights.map(r=>r.deathboundTicks)),
  meanUndeadSummons:mean(fights.map(r=>r.eliteSummons)),
  meanMinionFocusSeconds:mean(fights.map(r=>r.minionFocusSeconds)),
  meanMinionFocusSwitches:mean(fights.map(r=>r.minionFocusSwitches)),
  meanTargetSwitches:mean(fights.map(r=>r.targetSwitches))};
}
function run(options=parseArgs(),deps={}){
 const scenario=deps.scenario||C.scenario;
 const scanned={seeds:0,nonTanks:0,nonGravecaller:0};
 const rows=[],errors=[];
 for(let i=0;i<options.scan&&rows.length<options.target;i++){
  const seed=options.seedStart+i;
  try{
   const tank=scenario(seed,'tank',options.gear,{inspectOnly:true});
   scanned.seeds++;
   if(tank.initial?.role!=='tank'){scanned.nonTanks++;continue;}
   const elite=scenario(seed,'elite',options.gear,{inspectOnly:true});
   if(elite.initial?.eliteType!=='gravecaller'){scanned.nonGravecaller++;continue;}
   const mechanics=scenario(seed,'elite',options.gear,{targetPolicy:'mechanics',tickLimit:options.tickLimit});
   const adds=scenario(seed,'elite',options.gear,{targetPolicy:'adds',tickLimit:options.tickLimit});
   verifyMatch(seed,mechanics,adds);
   rows.push({seed,gear:options.gear,family:mechanics.family,
    mechanics:snapshot(mechanics),adds:snapshot(adds)});
  }catch(err){errors.push({seed,message:err.message});}
 }
 const eligible=rows.length;
 const improvement=rows.filter(p=>!p.mechanics.won&&p.adds.won).length;
 const regression=rows.filter(p=>p.mechanics.won&&!p.adds.won).length;
 const stillLose=rows.filter(p=>!p.mechanics.won&&!p.adds.won).length;
 const bothWin=rows.filter(p=>p.mechanics.won&&p.adds.won).length;
 const summary={
  mechanics:summarize(rows,'mechanics'),
  adds:summarize(rows,'adds'),
  pairedOutcomes:{onlyAddsWins:improvement,onlyMechanicsWins:regression,
   bothLose:stillLose,bothWin},
  meanPairedDamageSaved:mean(rows.map(p=>p.mechanics.damageTaken-p.adds.damageTaken)),
  meanPairedDeathboundDamageSaved:mean(rows.map(p=>p.mechanics.deathboundDamage-p.adds.deathboundDamage)),
  meanPairedDurationDelta:mean(rows.map(p=>p.adds.seconds-p.mechanics.seconds))
 };
 const issues=[];
 if(eligible!==options.target)issues.push('insufficient_matched_gravecaller_seeds_'+eligible);
 if(errors.length)issues.push('native_scenario_errors_'+errors.length);
 if(!S.sourceFingerprint().sha256)issues.push('missing_native_source');
 const result={
  experiment:'stage9.11 gravecaller-target-policy',model:'native E1 controlled first-ring',
  sourceSha256:S.sourceFingerprint().sha256,
  parameters:{...options,policyBaseline:'mechanics',policyTreatment:'adds',
   reactionTicks:8,reactionSeconds:.88},
  coverage:{scanned:scanned.seeds,nonTanks:scanned.nonTanks,
   nonGravecaller:scanned.nonGravecaller,matchedPairs:eligible,
   combatRuns:eligible*2},summary,errors,
  interpretation:[
   'Every pair uses the same actual initial native Gravecaller, seed, realm and gear; only the player target policy changes.',
   'Adds policy prioritizes all non-boss/non-Elite visible enemies; in this 1v1 + summons Gravecaller fixture those are the Gravecaller undead.',
   'The player switches target only every eight 0.11-second combat ticks, not instantaneously.',
   'Different attack decisions cause native RNG consumption to diverge after encounters start; differences are controlled player-policy comparisons, not identical later rolls.',
   'Controlled E1 first-ring fights are not human plays or earned multi-room Expedition progress.',
   'Deathbound is a new game mechanic; this experiment does not prescribe changes to damage or summon rates.'
  ],qualityIssues:issues,success:!issues.length,rows
 };
 return result;
}
function markdown(result){
 const a=result.summary.mechanics,b=result.summary.adds;
 const to=(v)=>v===null?'n/a':String(v);
 const lines=[
  '# Wanderer v0.13 — Gravecaller: focus leader vs kill Minions first','',
  'Native source SHA256: '+result.sourceSha256,
  'Gear: '+result.parameters.gear+'; matched real seeds: '+result.coverage.matchedPairs,
  'Switch reaction: 0.88 combat seconds','',
  '| Measure | Focus Gravecaller (mechanics) | Minions first (adds) |',
  '|---|---:|---:|',
  '| Victories | '+a.wins+'/'+a.n+' | '+b.wins+'/'+b.n+' |',
  '| Deaths | '+a.deaths+' | '+b.deaths+' |',
  '| Wilson 95% win interval | '+(a.wilson95?.join('–')||'n/a')+'% | '+(b.wilson95?.join('–')||'n/a')+'% |',
  '| Mean incoming damage | '+a.meanDamageTaken+' | '+b.meanDamageTaken+' |',
  '| Mean fight duration (s) | '+a.meanDurationSeconds+' | '+b.meanDurationSeconds+' |',
  '| Mean Deathbound damage | '+a.meanDeathboundDamage+' | '+b.meanDeathboundDamage+' |',
  '| Mean Deathbound ticks | '+a.meanDeathboundTicks+' | '+b.meanDeathboundTicks+' |',
  '| Mean summoned undead | '+a.meanUndeadSummons+' | '+b.meanUndeadSummons+' |',
  '| Mean minion-focus seconds | '+a.meanMinionFocusSeconds+' | '+b.meanMinionFocusSeconds+' |',
  '| Mean switches to Minions | '+a.meanMinionFocusSwitches+' | '+b.meanMinionFocusSwitches+' |',
  '',
  'Paired policies, one seed per row: Only adds wins '+result.summary.pairedOutcomes.onlyAddsWins+
   ', only mechanics wins '+result.summary.pairedOutcomes.onlyMechanicsWins+
   ', both lose '+result.summary.pairedOutcomes.bothLose+
   ', both win '+result.summary.pairedOutcomes.bothWin+'.',
  'Mean damage avoided (mechanics - adds): '+to(result.summary.meanPairedDamageSaved),
  'Mean Deathbound damage avoided: '+to(result.summary.meanPairedDeathboundDamageSaved),
  'Quality issues: '+(result.qualityIssues.join('; ')||'none'),'',
  '## Limits','',...result.interpretation.map(x=>'- '+x),'',
  '## Seed-by-seed comparison','',
  '| Seed | Focus wins | Adds wins | Focus damage | Adds damage | Deathbound focus | Deathbound adds | Adds focus seconds |',
  '|---|---|---|---:|---:|---:|---:|---:|'
 ];
 for(const r of result.rows)lines.push('| '+r.seed+' | '+r.mechanics.won+' | '+r.adds.won+
  ' | '+r.mechanics.damageTaken+' | '+r.adds.damageTaken+
  ' | '+r.mechanics.deathboundDamage+' | '+r.adds.deathboundDamage+
  ' | '+r.adds.minionFocusSeconds+' |');
 return lines.join('\n')+'\n';
}
function main(args=process.argv.slice(2)){
 const cfg=parseArgs(args),report=run(cfg),filename=path.resolve(process.cwd(),cfg.out);
 fs.mkdirSync(path.dirname(filename),{recursive:true});
 fs.writeFileSync(filename,JSON.stringify(report,null,2)+'\n');
 fs.writeFileSync(filename.replace(/\.json$/,'.md'),markdown(report));
 console.log('GRAVECALLER_TARGET_RESULTS='+JSON.stringify({gear:cfg.gear,success:report.success,
  coverage:report.coverage,summary:report.summary,issues:report.qualityIssues}));
 if(!report.success)process.exitCode=1;
 return report;
}
module.exports={parseArgs,verifyMatch,snapshot,summarize,run,markdown,main};
if(require.main===module)main();
