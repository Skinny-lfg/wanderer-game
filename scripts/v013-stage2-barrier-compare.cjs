'use strict';
// Stage 2: deterministic paired native-combat comparison against frozen Stage 1.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const A=require('./v013-affinity-baseline.cjs');
const baselinePath=path.resolve(__dirname,'../reports/v013-stage1-affinity-summary.json');
const defaultOut='reports/v013-stage2-affinity-comparison.json';
const round=n=>Number(Number(n).toFixed(2));
function compare(before,after){
 assert.equal(before.schemaVersion,1);
 assert.equal(after.summary.errors,0,'Stage 2 may not produce native errors');
 assert.equal(after.summary.timeouts,0,'Stage 2 may not produce timeouts');
 assert.equal(after.summary.valid,before.cases.valid,'All 48 baseline scenarios must remain valid');
 const baseline=new Map(before.groups.map(g=>[g.build+'|'+g.level,g]));
 const metrics=['meanBarrierAtEntry','meanBarrierGenerated','meanBarrierAbsorbed','meanHealingPerSecond','meanDotPerSecond','meanManaSpent','meanSpellPower'];
 const groups=after.summary.groups.map(now=>{
  const prev=baseline.get(now.build+'|'+now.level);assert(prev,'Missing frozen Stage 1 cell: '+now.build);
  assert.equal(now.n,prev.n,'Number of seeds changed');
  return {build:now.build,level:now.level,n:now.n,oldWins:prev.wins,newWins:now.wins,
   before:Object.fromEntries(metrics.map(k=>[k,prev[k]])),
   after:Object.fromEntries(metrics.map(k=>[k,now[k]])),
   delta:Object.fromEntries(metrics.map(k=>[k,round(now[k]-prev[k])]))};
 });
 const pick=id=>groups.filter(g=>g.build===id);
 for(const r of pick('pure-aegis')){
  assert.equal(r.before.meanSpellPower,0,'Physical Aegis has no Spell Power');
  assert.equal(r.delta.meanBarrierAtEntry,0,'Physical Aegis initial Barrier drift');
  assert.equal(r.delta.meanBarrierGenerated,0,'Physical Aegis generated Barrier drift');
 }
 for(const id of ['pure-blood','pure-fury','pure-vitality','pure-magic','pure-decay'])for(const r of pick(id)){
  assert.equal(r.delta.meanBarrierAtEntry,0,id+' initial Barrier drift');
  assert.equal(r.delta.meanBarrierGenerated,0,id+' generated Barrier drift');
 }
 const hybrids=pick('aegis-magic');
 assert(hybrids.length>=2&&hybrids.every(r=>r.delta.meanBarrierAtEntry>0),'Aegis + Magic must gain initial Barrier from Spell Power');
 assert(hybrids.every(r=>r.after.meanSpellPower>0),'Hybrid lacks Spell Power');
 return groups;
}
function markdown(out){
 const lines=['# Stage 2 — Aegis Barrier + Spell Power','',
  'Paired native-combat comparison against the frozen Stage 1 snapshot.','',
  '**Stage 1 source:** '+out.baselineSource,'**Stage 2 source:** '+out.currentSource,
  '**Stage 2 replay:** '+out.currentReplay,
  '**Cases:** '+out.summary.valid+'/'+out.summary.total+'; errors '+out.summary.errors+'; timeouts '+out.summary.timeouts,
  '','| Build | E | Barrier start before → after | Generated before → after | Absorbed before → after | Heal/s delta | DoT/s delta | Mana delta |',
  '|---|---:|---:|---:|---:|---:|---:|---:|'];
 for(const r of out.groups)lines.push('| '+[r.build,r.level,r.before.meanBarrierAtEntry+' → '+r.after.meanBarrierAtEntry,r.before.meanBarrierGenerated+' → '+r.after.meanBarrierGenerated,r.before.meanBarrierAbsorbed+' → '+r.after.meanBarrierAbsorbed,r.delta.meanHealingPerSecond,r.delta.meanDotPerSecond,r.delta.meanManaSpent].join(' | ')+' |');
 lines.push('','## Limits','',
  '- The frozen Stage 1 report in reports/v013-stage1-affinity-summary.json is never overwritten.',
  '- Each run uses 12 legal 24-point builds, fixed E5/E35 levels, two seeds, current Rare gear, and controlled three-enemy Aegis normal rooms.',
  '- Gear is deterministic per build/weapon, not identical between all weapons.',
  '- Actual Barrier granted may be capped. Changes in absorbed Barrier can alter duration and downstream resource metrics.',
  '- Pure non-Aegis control builds must retain Barrier generation; physical Aegis with zero Spell Power must remain unchanged.',
  '- The same encounter was easy (48/48 wins) before the change; do not interpret victory rate as balance approval.',
  '- Wand + Orb remains unchanged. Aegis, Pulse, Runic Shield, Arcane Bastion and the Aegis global cap gain Spell Power scaling.',
  '');
 return lines.join('\n');
}
function run(out=defaultOut){
 const before=JSON.parse(fs.readFileSync(baselinePath,'utf8'));
 const cfg=A.parseArgs(['--mode=affinities','--out=reports/v013-stage2-affinity-current.json']);
 const after=A.run(cfg),groups=compare(before,after);
 const payload={schemaVersion:1,stage:'aegis-barrier-spellpower-stage2',baselineSource:before.sourceSha256,
  currentSource:after.sourceSha256,currentReplay:after.replaySha256,settings:after.settings,
  summary:after.summary,groups,rows:after.rows};
 const dest=path.resolve(process.cwd(),out);
 fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,JSON.stringify(payload,null,2)+'\n');
 fs.writeFileSync(dest.replace(/\.json$/,'.md'),markdown(payload)+'\n');
 console.log('STAGE2_BARRIER_COMPARISON='+JSON.stringify({out,source:payload.currentSource,
  valid:payload.summary.valid,errors:payload.summary.errors,timeouts:payload.summary.timeouts,
  aegisMagic:groups.filter(g=>g.build==='aegis-magic').map(g=>({level:g.level,entry:g.after.meanBarrierAtEntry,entryDelta:g.delta.meanBarrierAtEntry,generatedDelta:g.delta.meanBarrierGenerated,absorbedDelta:g.delta.meanBarrierAbsorbed})),
  pureAegis:groups.filter(g=>g.build==='pure-aegis').map(g=>({level:g.level,entryDelta:g.delta.meanBarrierAtEntry,generatedDelta:g.delta.meanBarrierGenerated}))}));
 return payload;
}
module.exports={compare,run,markdown,defaultOut};
if(require.main===module){try{run(process.argv[2]||defaultOut)}catch(e){console.error('STAGE2_COMPARISON_FAILED='+e.stack);process.exitCode=1}}
