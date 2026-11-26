'use strict';
// Stage 3 controlled native-combat comparison against the exact Stage 2
// artifact frozen before the Radiance and Decay changes. No alternate combat
// formulas; A.run drives the production HTML runtime through its test adapter.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const A=require('./v013-affinity-baseline.cjs');
const BEFORE=require('../reports/v013-stage2-affinity-freeze.json');
const DEFAULT_OUT='reports/v013-stage3-affinity-comparison.json';
const FIELDS=Object.freeze(['meanHealingPerSecond','meanDotPerSecond','meanBarrierAtEntry','meanBarrierGenerated','meanBarrierAbsorbed','meanManaSpent','meanSpellPower']);
const RADIANCE=Object.freeze(['pure-radiance','fury-radiance','radiance-aegis']);
const UNTOUCHED=Object.freeze(['pure-blood','pure-fury','pure-aegis','pure-arcane','pure-decay','blood-fury','aegis-arcane','arcane-decay','decay-blood']);
const round=n=>Number(Number(n).toFixed(2));
function compare(before,after,{postBarrierReset=false,postOffhandReroll=false}={}){
 assert.equal(before.schemaVersion,1);
 assert.equal(before.cases.valid,48);
 assert.equal(after.summary.valid,48);
 assert.equal(after.summary.errors,0,'Native Stage 3 errors');
 assert.equal(after.summary.timeouts,0,'Native Stage 3 timeouts');
 assert.equal(after.summary.groups.length,24);
 const settings={...after.settings};delete settings.output;
 assert.deepEqual(settings,before.settings,'Builds, seeds, gear, points or scenario changed');
 const index=new Map(before.groups.map(g=>[g.build+'|'+g.level,g]));
 assert.equal(index.size,before.groups.length);
 const groups=after.summary.groups.map(g=>{
  const previous=index.get(g.build+'|'+g.level);
  assert(previous,'Missing frozen Stage 2 cohort: '+g.build);
  assert.equal(g.n,previous.n,'Seed count changed');
  const old=Object.fromEntries(FIELDS.map(k=>[k,previous[k]]));
  const current=Object.fromEntries(FIELDS.map(k=>[k,g[k]]));
  const delta=Object.fromEntries(FIELDS.map(k=>[k,round(g[k]-previous[k])]));
  return {build:g.build,level:g.level,n:g.n,wins:{old:previous.wins,new:g.wins},before:old,after:current,delta};
 });
 if(postBarrierReset){
  // New live Barrier rules alter encounter duration, healing and Mana use.
  // Frozen Stage 2 numbers remain visible, but are not equality contracts.
  for(const g of groups){
   if(postOffhandReroll)assert(Number.isFinite(g.after.meanSpellPower)&&g.after.meanSpellPower>=0,'Invalid current Spell Power: '+g.build);
   else assert.equal(g.delta.meanSpellPower,0,'Unrelated gear/talent Spell Power drift: '+g.build);
   for(const k of ['meanBarrierAtEntry','meanBarrierGenerated','meanBarrierAbsorbed'])
    assert(Number.isFinite(g.after[k])&&g.after[k]>=0,'Invalid current Barrier: '+g.build+' '+k);
  }
 }else for(const g of groups.filter(x=>UNTOUCHED.includes(x.build))){
  for(const k of FIELDS)assert.equal(g.delta[k],0,'Unrelated '+g.build+' '+g.level+' drift in '+k);
 }
 const radiance=groups.filter(x=>RADIANCE.includes(x.build));
 assert.equal(radiance.length,6);
 assert(radiance.some(x=>x.delta.meanHealingPerSecond!==0),'Radiance regeneration must change at least one native result');
 // Toxic Precision was an unreachable Decay/Fury relic and is retired, not
 // added to the six real adjacent combinations. Active Corrupting Touch and
 // Hex Bolt SP scaling are covered by production Buildcraft tests.
 return groups;
}
function markdown(result){
 const lines=['# Stage 3 — Radiance Max HP regeneration / active Decay coherence','',
  'Native controlled-combat comparison against the frozen Stage 2 artifact.',
  '',
  '**Stage 2 fingerprint:** '+result.sourceBefore,
  '**Stage 3 fingerprint:** '+result.sourceAfter,
  '**Replay fingerprint:** '+result.replayAfter,
  '**Encounters:** '+result.summary.valid+'/'+result.summary.total+'; '+result.summary.errors+' errors; '+result.summary.timeouts+' timeouts.',
  '',
  '| Build | E | Healing/s before → after | DoT/s before → after | Barrier generated before → after | Mana spent before → after | Wins before → after |',
  '|---|---:|---:|---:|---:|---:|---:|'];
 for(const g of result.groups){
  lines.push('| '+[g.build,g.level,
   g.before.meanHealingPerSecond+' → '+g.after.meanHealingPerSecond,
   g.before.meanDotPerSecond+' → '+g.after.meanDotPerSecond,
   g.before.meanBarrierGenerated+' → '+g.after.meanBarrierGenerated,
   g.before.meanManaSpent+' → '+g.after.meanManaSpent,
   g.wins.old+' → '+g.wins.new].join(' | ')+' |');
 }
 lines.push('','## Controls / interpretation','',
  '- Stage 2 frozen source and replay are sourced from C7 run 44730440325, artifact 14625987443.',
  '- Same E5/E35 levels, 9101/9201 seeds, 12 legal 24-point builds, Rare current gear, no Runes/Boons/Contracts, focus targets and three normal Aegis enemies.',
  '- Frozen Stage 2 is historical: Barrier resets, uncapped Barrier and distinct Orb/Tome/Charm rolls intentionally affect survivability and Spell Power. Cohort definitions remain invariant.',
  '- Radiance base regeneration now uses 0.15% Max HP/s plus tiered percentage nodes, with 0.35% Max HP/s pre-fork cap and Recovery/Reserve modifiers.',
  '- The retired Toxic Precision Decay/Fury passive was not reachable in v15 and its hidden runtime/catalogue path has been removed, not reintroduced. Active Corrupting Touch (hit + Spell Power) and Arcane/Decay Hex Bolt scaling are verified by production Buildcraft tests; no Decay coefficient was changed.',
  '- Changes in actual healing/s are limited by real damage taken, overheal, combat duration and different gear; these are observations, not theoretical healing potential.',
  '- The 48 encounters are intentionally easy and do not establish Elite/Boss balance. Stage 4+ should extend stress scenarios.',
  '');
 return lines.join('\n');
}
function run(out=DEFAULT_OUT){
 const current=A.run(A.parseArgs(['--mode=affinities','--out=reports/v013-stage3-affinity-current.json']));
 const groups=compare(BEFORE,current,{postBarrierReset:true,postOffhandReroll:true});
 const payload={schemaVersion:1,stage:'radiance-decay-coherence-stage3',comparisonMode:'post-uncapped-barrier-and-offhand-reroll',sourceBefore:BEFORE.sourceSha256,
  sourceAfter:current.sourceSha256,replayAfter:current.replaySha256,
  frozenStage2:{validatedCommit:BEFORE.artifact.validatedCommit,runId:BEFORE.artifact.runId,artifactId:BEFORE.artifact.artifactId},
  settings:current.settings,summary:current.summary,groups,rows:current.rows};
 const dest=path.resolve(process.cwd(),out);fs.mkdirSync(path.dirname(dest),{recursive:true});
 fs.writeFileSync(dest,JSON.stringify(payload,null,2)+'\n');
 fs.writeFileSync(dest.replace(/\.json$/,'.md'),markdown(payload)+'\n');
 const changes=groups.filter(x=>RADIANCE.includes(x.build)).map(g=>({build:g.build,level:g.level,
  healBefore:g.before.meanHealingPerSecond,healAfter:g.after.meanHealingPerSecond,healDelta:g.delta.meanHealingPerSecond,
  barrierDelta:g.delta.meanBarrierGenerated,absorbedDelta:g.delta.meanBarrierAbsorbed}));
 console.log('STAGE3_RADIANCE_DECAY_COMPARISON='+JSON.stringify({out,valid:current.summary.valid,
  errors:current.summary.errors,timeouts:current.summary.timeouts,
  source:current.sourceSha256,replay:current.replaySha256,changes}));
 return payload;
}
module.exports={compare,run,markdown,DEFAULT_OUT,FIELDS};
if(require.main===module){try{run(process.argv[2]||DEFAULT_OUT)}catch(e){console.error('STAGE3_COMPARISON_FAILED='+e.stack);process.exitCode=1}}
