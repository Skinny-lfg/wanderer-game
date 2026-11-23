'use strict';
// Stage 6.38 — reuse the PROVEN 500-account natural traversal and complete
// shard-integrity checks of Stage6.37; only the live native source changes.
// This does not turn historical Stage6.37 samples into new observations.
const fs=require('node:fs'),path=require('node:path');
const V=require('./v013-stage637-natural-rates.cjs');
const OLD=Object.freeze({
 run:45199904168,artifact:14830604150,
 levels:[
  {E:1,solo:[4139,4327],small:[540,2077],swarm:[0,581],elite:[808,1328],boss:[232,583]},
  {E:2,small:[265,720],swarm:[2,141]},
  {E:3,small:[292,454],swarm:[8,91]},
  {E:4,small:[243,329],swarm:[26,97]},
  {E:5,small:[257,346],swarm:[15,71],elite:[169,172],boss:[139,144]}
 ]});
function cohort(cfg){
 const d=V.cohort(cfg);
 if(d.stage!=='6.37'||d.kind!=='cohort')throw Error('Unexpected native Stage6.37 source');
 return {...d,stage:'6.38'};
}
function aggregate(shards){
 if(shards.some(s=>s.stage!=='6.38'))throw Error('Incorrect Stage6.38 native shard');
 // Pure schema adaptation to reuse strict account validation, NOT a
 // transformation of wins, accounts, XP, per-identity outcomes, or sources.
 const verified=V.aggregate(shards.map(s=>({...s,stage:'6.37'})));
 return {...verified,stage:'6.38',previous:OLD,
  notes:[
   'All 500 fresh E1-born native agents use the new live curve and fragile normal Minions. They do not reuse any old Stage6.37 account outcome.',
   'Exact prior 6.37 counts are historical provenance, not a paired causal experiment. Contrast is diagnostic only.',
   'Both modifications are active in this native census. Their individual causal contributions are NOT identified by this single joint trial.',
   'Normal-room Minions are frail at all room sizes, whereas special summoned Minions are preserved.',
   'The single analytic three-regime reference is smooth at E4/E9 and shared by normal mobs, named Elites and Bosses. It is a candidate design, not a proven win-rate fit.',
   'No extra loot, talent points, synthetic E unlocks, or character upgrades. Builds must earn every Expedition.',
   'Targets 80–90% normal, 60–70% Elite, 35–45% Boss are NOT acceptance claims without the measured n and interval checks.',
   'Do not conflate win rate per resolved fight with chance of clearing a full Expedition, or naturally survived builds with all initial players.'
  ]};
}
function fmt(r){return r.resolved?r.wins+'/'+r.resolved+' ('+r.winPct+'%)':'—';}
function markdown(d){
 const out=['# Stage 6.38 — Native Minion frailty and ONE continuous three-regime curve','',
  'Source fingerprint: '+d.source,'',
  'Baseline: Stage6.37 GitHub Actions https://github.com/Skinny-lfg/wanderer-game/actions/runs/'+OLD.run+
  ' artifact ID '+OLD.artifact,'',
  'Accounts: '+d.cohort.accounts+' E1-born, E2 reached '+d.cohort.legitimateE2+
  ', E5 reached '+d.cohort.legitimateE5,'',
  '| E | Natural accounts | Normal solo | Group 2–4 | Group 5+ | Elite | Boss |',
  '|---:|---:|---|---|---|---|---|'];
 for(const r of d.levels)out.push('| E'+r.E+' | '+r.accountsReached+' | '+
  [r.solo,r.small,r.swarm,r.elite,r.boss].map(fmt).join(' | ')+' |');
 out.push('','## Eight Elite identities: victory per native Expedition','',
 '| Elite | E1 | E2 | E3 | E4 | E5 |',
 '|---|---|---|---|---|---|');
 for(const id of V.E)out.push('| '+id+' | '+d.levels.map(r=>fmt(r.byElite[id])).join(' | ')+' |');
 out.push('','## Comparison against the prior Stage6.37 native cohort','',
 '| E | Stage6.37 small | Stage6.38 small | Stage6.37 5+ | Stage6.38 5+ |',
 '|---:|---|---|---|---|');
 for(const r of d.levels){
  const old=OLD.levels.find(x=>x.E===r.E);
  const f=x=>x?x[0]+'/'+x[1]+' ('+Number((100*x[0]/x[1]).toFixed(1))+'%)':'—';
  out.push('| E'+r.E+' | '+f(old.small)+' | '+fmt(r.small)+' | '+
   f(old.swarm)+' | '+fmt(r.swarm)+' |');
 }
 out.push('','## Caveats','',...d.notes.map(s=>'- '+s),'');
 return out.join('\n');
}
function main(argv=process.argv.slice(2)){
 const cfg=V.options(argv),d=cfg.mode==='cohort'?cohort(cfg):aggregate(
  fs.readdirSync(cfg.inputs).filter(n=>/^v013-stage638-cohort-\d+-\d+\.json$/.test(n))
   .map(n=>JSON.parse(fs.readFileSync(path.join(cfg.inputs,n),'utf8'))));
 fs.mkdirSync(path.dirname(cfg.out),{recursive:true});
 fs.writeFileSync(cfg.out,JSON.stringify(d,null,2)+'\n');
 if(cfg.mode==='aggregate')fs.writeFileSync(cfg.out.replace(/\.json$/,'.md'),markdown(d)+'\n');
 console.log('STAGE638='+JSON.stringify(cfg.mode==='aggregate'?d.cohort:
  {n:d.accounts.length,complete:d.complete,seed:cfg.seed,batch:cfg.batch}));
 return d;
}
module.exports={OLD,cohort,aggregate,markdown,main};
if(require.main===module){try{main();}catch(e){console.error('STAGE638_ERROR '+String(e.stack||e));process.exitCode=1;}}
