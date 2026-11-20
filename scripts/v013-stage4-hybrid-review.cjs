'use strict';
// Stage 4: evaluate all six genuine adjacent Affinity links, using the native
// combat simulator, fixed talent allocations and the immutable Stage 3 evidence.
// Fury + Vitality is the only intentional coefficient change in this stage.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const A=require('./v013-affinity-baseline.cjs');
const S=require('./simulate-progression.cjs');
const FROZEN=require('../reports/v013-stage3-affinity-freeze.json');
const PAIRS=Object.freeze([
 ['blood-fury','crimson_rush','blood','fury'],
 ['fury-vitality','fervent_life','fury','vitality'],
 ['vitality-aegis','sanctuary','vitality','aegis'],
 ['aegis-magic','runic_shield','aegis','magic'],
 ['magic-decay','hex_bolt','magic','decay'],
 ['decay-blood','plague_spread','decay','blood']
]);
const FIELDS=Object.freeze(['meanHealingPerSecond','meanBarrierAtEntry','meanBarrierGenerated','meanBarrierAbsorbed','meanDotPerSecond','meanManaSpent','meanSpellPower']);
const OUTPUT='reports/v013-stage4-hybrid-review.json';
const round=(v,d=3)=>Number(Number(v).toFixed(d));
function frozenGroups(){
 assert.equal(FROZEN.schemaVersion,1);
 assert.equal(FROZEN.cases.valid,48);
 assert.equal(FROZEN.values.length,24);
 return new Map(FROZEN.values.map(row=>{
  const data=Object.fromEntries(FROZEN.fields.map((key,i)=>[key,row[i]]));
  return [data.build+'|'+data.level,data];
 }));
}
function compare(current){
 const before=frozenGroups(),settings={...current.settings};
 delete settings.output;
 assert.deepEqual(settings,FROZEN.settings,'Stage 4 must use exact Stage 3 scenarios');
 assert.equal(current.summary.valid,48,'Native baseline cases changed');
 assert.equal(current.summary.errors,0);
 assert.equal(current.summary.timeouts,0);
 assert.equal(current.summary.groups.length,24);
 const groups=current.summary.groups.map(g=>{
  const old=before.get(g.build+'|'+g.level);
  assert(old,'Missing frozen Stage 3 cohort '+g.build+' E'+g.level);
  assert.equal(g.n,old.n,'Seed count changed');
  const delta=Object.fromEntries(FIELDS.map(k=>[k,round(g[k]-old[k],2)]));
  if(g.build!=='fury-vitality'){
   for(const k of FIELDS)assert.equal(delta[k],0,'Unrelated Affinity drift: '+g.build+' E'+g.level+' '+k);
   assert.equal(g.wins,old.wins,'Unrelated Affinity outcome changed');
  }
  return {build:g.build,level:g.level,n:g.n,winsBefore:old.wins,winsAfter:g.wins,
   healingBefore:old.meanHealingPerSecond,healingAfter:g.meanHealingPerSecond,
   barrierBefore:old.meanBarrierGenerated,barrierAfter:g.meanBarrierGenerated,
   activationCounts:g.totalPassiveActivations||{},delta};
 });
 assert.equal(groups.filter(g=>g.build==='fury-vitality').length,2);
 return groups;
}
function verifyTalentGraph(){
 const ids=new Set(S.talentPlan(A.BUILDS[0],24).nodes),pairs=[];
 for(const [buildId,skill,first,second] of PAIRS){
  const build=A.BUILDS.find(b=>b.id===buildId);
  assert(build,'Unknown hybrid build '+buildId);
  assert.deepEqual([...build.families].sort(),[first,second].sort());
  const plan=S.talentPlan(build,24);
  assert.equal(plan.nodes.length,24,'24 earned, legal nodes for '+buildId);
  for(const id of ['affinity_'+first,'affinity_'+second,skill])assert(plan.nodes.includes(id),'Missing actual graph node '+id+' for '+buildId);
  pairs.push({id:buildId,first,second,skill,points:plan.nodes.length,active:plan.nodes.includes(skill)});
 }
 assert.equal(pairs.length,6);
 assert(ids.has('affinity_blood'),'Native Talent Graph not ready');
 return pairs;
}
function stress(current){
 const opts={...S.DEFAULTS,mode:'affinities',points:24,gear:'current',rarity:'Rare',runes:false,
  boons:'none',contracts:'none',measure:true,lockScenarioStreams:true,targetPolicy:'mechanics',tickLimit:4500};
 const builds=A.BUILDS,rows=[];
 for(const build of builds)for(const level of FROZEN.settings.levels)for(const seed of FROZEN.settings.seeds)for(const kind of ['elite','boss']){
  try{
   const raw=S.encounter(level,build,seed,kind,opts,undefined,undefined,'aegis',0);
   assert(raw.affinity==='aegis','Native Realm mismatch');
   assert.equal(raw.pointsSpent,24,'Native selected legal Talent Points');
   assert.match(raw.gearFingerprint,/^[a-f0-9]{64}$/);
   const m=raw.affinityMetrics||{};
   rows.push({build:build.id,kind,level,seed,resolvedSeed:raw.resolvedSeed,gearFingerprint:raw.gearFingerprint,
    status:raw.status,won:raw.won,died:raw.died,timedOut:raw.timedOut,seconds:raw.seconds,
    minHpPct:raw.minHpPct,damageDealt:raw.damageDealt,damageTaken:raw.damageTaken,
    attackPower:m.attackPower,spellPower:m.spellPower,barrierGenerated:m.barrierGenerated,
    barrierAbsorbed:m.barrierAbsorbed,healingActual:m.healingActual,dotDamageActual:m.dotDamageActual,
    manaSpent:m.manaSpent,passiveActivations:m.passiveActivations||{},
    bossAffinity:raw.bossAffinity||null,bossStyle:raw.bossStyle||null,
    initialStateSha256:raw.initialStateSha256});
  }catch(e){
   rows.push({build:build.id,kind,level,seed,status:'error',error:String(e?.message||e)});
  }
 }
 const groups=[];
 for(const build of builds)for(const kind of ['elite','boss']){
  const subset=rows.filter(r=>r.build===build.id&&r.kind===kind),valid=subset.filter(r=>!r.error);
  const mean=key=>valid.length?round(valid.reduce((v,x)=>v+(Number(x[key])||0),0)/valid.length,2):null;
  const activations={};
  for(const r of valid)for(const [name,count] of Object.entries(r.passiveActivations))activations[name]=(activations[name]||0)+count;
  groups.push({build:build.id,kind,n:subset.length,errors:subset.filter(r=>r.error).length,
   wins:subset.filter(r=>r.won).length,deaths:subset.filter(r=>r.died).length,
   timeouts:subset.filter(r=>r.timedOut).length,meanSeconds:mean('seconds'),
   meanMinHpPct:mean('minHpPct'),meanDamageDealt:mean('damageDealt'),meanDamageTaken:mean('damageTaken'),
   meanHealing:mean('healingActual'),meanBarrier:mean('barrierGenerated'),meanDot:mean('dotDamageActual'),
   meanManaSpent:mean('manaSpent'),passiveActivations:activations});
 }
 return {rows,groups,total:rows.length,errors:rows.filter(x=>x.error).length,
  timeouts:rows.filter(x=>x.timedOut).length,wins:rows.filter(x=>x.won).length,deaths:rows.filter(x=>x.died).length};
}
function marginalEstimate(previousRows){
 // Observed Stage 3 activations, not extra guaranteed healing. Excess healing
 // converts to a capped Ward and combat timing may change after the proposal.
 const eligible=previousRows.filter(r=>r.build==='fury-vitality');
 return eligible.map(r=>({level:r.level,seed:r.seed,attackPower:r.attackPower,
  maxHealth:r.maxHealth,actualHealingBefore:r.healingActual,
  triggers:r.passiveActivations?.fervent_life||0,
  theoreticalAdditionalHealing:round((r.passiveActivations?.fervent_life||0)*Math.max(0,r.attackPower||0)*.03)}));
}
function markdown(report){
 const lines=['# Stage 4 — Six adjacent Affinity hybrid links','',
  'Matched combat evidence, using current v0.13 native simulator and a frozen Stage 3 baseline.',
  '', '**Stage 3 source:** '+report.stage3Source,'**Stage 4 source:** '+report.currentSource,
  '**Stage 4 replay:** '+report.currentReplay,
  '**Normal paired cases:** '+report.normal.valid+'/48; **stress cases:** '+report.stress.total+' (elite/boss).',
  '',
  '## Normal encounters compared with Stage 3', '',
  '| Build | E | Heal/s before → after | Barrier delta | DoT delta | Mana delta |',
  '|---|---:|---:|---:|---:|---:|'];
 for(const g of report.normalGroups)lines.push('| '+[g.build,g.level,g.healingBefore+' → '+g.healingAfter,g.delta.meanBarrierGenerated,g.delta.meanDotPerSecond,g.delta.meanManaSpent].join(' | ')+' |');
 lines.push('','## Elite and Boss stress (two levels × two seeds = four cases per build/kind)', '',
  '| Build | Kind | W/L | Timeouts | Avg seconds | Avg min HP % | Actual healing | Barrier generated | DoT |',
  '|---|---|---:|---:|---:|---:|---:|---:|---:|');
 for(const g of report.stress.groups)lines.push('| '+[g.build,g.kind,g.wins+'/'+g.n,g.timeouts,g.meanSeconds,g.meanMinHpPct,g.meanHealing,g.meanBarrier,g.meanDot].join(' | ')+' |');
 lines.push('','## Conditional link coverage', '',
  '| Pair | First mixed node | Real v15 points | Observed measured activations in stress |',
  '|---|---|---:|---:|');
 for(const p of report.pairs){
  const activations=report.stress.groups.filter(g=>g.build===p.id).reduce((n,g)=>n+(g.passiveActivations[p.skill]||0),0);
  lines.push('| '+[p.first+' + '+p.second,p.skill,p.points,p.skill==='plague_spread'?'Not in Buildcraft telemetry (implemented at Dungeon kill hook)':activations].join(' | ')+' |');
 }
 lines.push('','## Fervent Life candidate — Stage 3 observed triggers','',
  '| E | Seed | Attack Power | Fervent procs | Extra heal ceiling at +3% AP |',
  '|---|---:|---:|---:|---:|');
 for(const r of report.marginalEstimates)lines.push('| '+[r.level,r.seed,r.attackPower,r.triggers,r.theoreticalAdditionalHealing].join(' | ')+' |');
 lines.push('','## Interpretation / limits','',
  '- First mixed talents are purchased through the real v15 graph, never granted for free.',
  '- Both levels E5/E35, seeds 9101/9201, Rare native gear, no Runes/Boons/Contracts, 24 talent points, native enemy AI.',
  '- Elite/Boss stress uses a controlled first-ring Aegis card at Normal risk and real enemy archetypes. This is not earned account progression.',
  '- A win rate over only four cases per build and kind is exploratory, not a balance verdict. Boss and Elite target policy is mechanics.',
  '- All unaffected 11 builds must match Stage 3 on native Normal encounters; Fury+Vitality is the only intended coefficient change.',
  '- The real Fervent Life proc remains critical-hit-only, retains its four-second cooldown, and overheal converts to Barrier under the existing cap.',
  '- Plague Spread is processed at the Dungeon enemy-death hook, not via Buildcraft. Buildcraft telemetry cannot count it; do not call it inactive.',
  '- Raw individual rows with deterministic item fingerprints and seed are included in the JSON artifact.',
  '');
 return lines.join('\n');
}
function run(output=OUTPUT){
 const pairs=verifyTalentGraph();
 const current=A.run(A.parseArgs(['--mode=affinities','--out=reports/v013-stage4-affinity-current.json']));
 const normalGroups=compare(current);
 const stage3Rows=FROZEN.ferventLifeCases;
 assert.equal(stage3Rows.length,4,'Frozen Fervent Life proc cases missing');
 const stressResults=stress(current);
 const summary={total:current.summary.total,valid:current.summary.valid,
  errors:current.summary.errors,timeouts:current.summary.timeouts,wins:current.summary.wins};
 const outputData={schemaVersion:1,stage:'six-hybrid-affinity-review-stage4',stage3Source:FROZEN.sourceSha256,
  stage3Replay:FROZEN.replaySha256,currentSource:current.sourceSha256,currentReplay:current.replaySha256,
  settings:current.settings,pairs,normal:summary,normalGroups,stress:stressResults,
  marginalEstimates:marginalEstimate(stage3Rows)};
 const digest=crypto.createHash('sha256').update(JSON.stringify({normalGroups,stress:stressResults.rows,pairs})).digest('hex');
 outputData.replaySha256=digest;
 const absolute=path.resolve(output);
 fs.mkdirSync(path.dirname(absolute),{recursive:true});
 fs.writeFileSync(absolute,JSON.stringify(outputData,null,2)+'\n');
 fs.writeFileSync(absolute.replace(/\.json$/,'.md'),markdown(outputData)+'\n');
 const log={out:output,normal:summary,stress:{total:stressResults.total,errors:stressResults.errors,
  timeouts:stressResults.timeouts,wins:stressResults.wins,deaths:stressResults.deaths},
  furyVitality:normalGroups.filter(g=>g.build==='fury-vitality').map(g=>({level:g.level,healingBefore:g.healingBefore,healingAfter:g.healingAfter,delta:g.delta})),
  linkProcs:pairs.map(p=>({id:p.id,skill:p.skill,observed:stressResults.groups.filter(g=>g.build===p.id).reduce((n,g)=>n+(g.passiveActivations[p.skill]||0),0)})),
  source:current.sourceSha256,replay:digest};
 console.log('STAGE4_HYBRID_REVIEW='+JSON.stringify(log));
 if(stressResults.errors||stressResults.timeouts)process.exitCode=1;
 return outputData;
}
module.exports={PAIRS,FIELDS,frozenGroups,compare,verifyTalentGraph,stress,marginalEstimate,markdown,run};
if(require.main===module){try{run(process.argv[2]||OUTPUT)}catch(e){console.error('STAGE4_FAILED='+e.stack);process.exitCode=1}}
