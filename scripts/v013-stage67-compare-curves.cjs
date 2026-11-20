'use strict';
const fs=require('node:fs'),path=require('node:path');
const V=require('./v013-stage67-enemy-curve-sweep.cjs');
const keys=Object.keys(V.CURVES);
const count=(a,f)=>a.filter(f).length;
const sum=(a,f)=>a.reduce((n,x)=>n+(Number(f(x))||0),0);
const ratio=(x,y)=>y?Number((100*x/y).toFixed(1)):null;
const avg=(a)=>a.length?Number((a.reduce((n,x)=>n+x,0)/a.length).toFixed(1)):null;
function aggregate(shards){
 if(shards.length!==3)throw Error('Expected three distinct native cohort shards');
 const sha=new Set(shards.map(s=>s.originalProgressionSha256));
 if(sha.size!==1)throw Error('Mixed original progression versions');
 const refs=JSON.stringify(shards[0].references);
 if(shards.some(s=>JSON.stringify(s.references)!==refs))throw Error('Candidate reference mismatch');
 const groups={};
 for(const id of keys){
  const parts=shards.map(s=>s.variants?.[id]);
  if(parts.some(x=>!x||x.errors||x.id!==id))throw Error('Missing/invalid variant '+id);
  if(new Set(parts.map(x=>x.sourceHash)).size!==1)throw Error('Mismatched candidate source');
  const entries=parts.flatMap(x=>x.entries);
  const seen=new Set();for(const a of entries){const k=a.seed+':'+a.profile;if(seen.has(k))throw Error('Duplicate '+k);seen.add(k);}
  if(entries.length!==48)throw Error('Incomplete candidate '+id+' '+entries.length);
  const levels=Array.from({length:10},(_,i)=>{
   const rr=parts.map(x=>x.levels[i]);
   if(rr.some(x=>x.E!==i+1))throw Error('Invalid level ordering');
   const kind=Object.fromEntries(['combat','elite','boss'].map(k=>{
    const rows=rr.map(x=>x.kinds[k]);
    const n=sum(rows,x=>x.n),deaths=sum(rows,x=>x.deaths);
    return [k,{fights:n,deaths,wins:sum(rows,x=>x.wins),deathPct:ratio(deaths,n)}];
   }));
   const entriesCount=sum(rr,x=>x.accounts),attempts=sum(rr,x=>x.attempts);
   return {E:i+1,accounts:entriesCount,attempts,clears:sum(rr,x=>x.clears),
    deaths:sum(rr,x=>x.deaths),extractions:sum(rr,x=>x.extractions),
    bossReach:sum(rr,x=>x.bossReach),kinds:kind,
    meanFirstHpLossPct:avg(rr.filter(x=>x.meanFirstHpLossPct!==null).map(x=>x.meanFirstHpLossPct))};
  });
  groups[id]={id,accounts:entries.length,attempts:sum(parts,x=>x.attempts),
   sourceHash:parts[0].sourceHash,entries,levels,
   stalls:parts.flatMap(x=>x.stalls||[]),
   E6Reached:count(entries,x=>x.E6Reached),E7Reached:count(entries,x=>x.E7Reached),
   E10Cleared:count(entries,x=>x.E10Cleared),
   lateAttempts:sum(entries,x=>x.attemptsAfter5),
   lateBossDeaths:sum(levels.slice(5),x=>x.kinds.boss.deaths),
   lateBossFights:sum(levels.slice(5),x=>x.kinds.boss.fights),
   lateEliteDeaths:sum(levels.slice(5),x=>x.kinds.elite.deaths),
   lateEliteFights:sum(levels.slice(5),x=>x.kinds.elite.fights),
   lateNormalDeaths:sum(levels.slice(5),x=>x.kinds.combat.deaths),
   lateNormalFights:sum(levels.slice(5),x=>x.kinds.combat.fights)};
 }
 const base=groups.baseline;
 if(base.attempts!==1640||base.E6Reached!==19||base.E10Cleared!==18)
  throw Error('Stage 6.5 baseline changed unexpectedly: '+JSON.stringify({attempts:base.attempts,E6:base.E6Reached,E10:base.E10Cleared}));
 for(const id of keys.slice(1)){
  const v=groups[id];
  for(const a of v.entries){
   const b=base.entries.find(x=>x.seed===a.seed&&x.profile===a.profile);
   if(!b||a.earlyHash!==b.earlyHash||a.E6Reached!==b.E6Reached||JSON.stringify(a.firstE6)!==JSON.stringify(b.firstE6))
    throw Error('E1–E5 or E6 starting character changed '+id+' '+a.seed+' '+a.profile);
  }
  for(let i=0;i<5;i++){
   const x=v.levels[i],y=base.levels[i];
   for(const k of ['accounts','attempts','clears','deaths','extractions','bossReach'])
    if(x[k]!==y[k])throw Error('E1-E5 counts diverged '+id+' E'+(i+1)+' '+k);
  }
 }
 const result={stage:'6.7-pilot',input:'native E1-E10 accounts, E6+ enemy reference overridden in isolated VM only',
  sourceSha256:[...sha][0],references:shards[0].references,
  seeds:[9701,9702,9703,9704],profiles:12,accountsPerCandidate:48,
  E1toE5VerifiedIdentical:true,E6StartingAccountVerifiedIdentical:true,
  noGameplayFilesModified:true,variants:groups,
  caveats:['Only 4 shared seeds (48 profile–seed account runs) and 19 accounts unlocked E6 in the fixed E1–E5 baseline.',
   'Identical E1–E5 histories and E6 starting earned loadouts are confirmed, but native RNG/loot and tactics may diverge after the change.',
   'E6–E10 outcomes are conditional on E6 entrants from this hard E1–E5 baseline, not human win probabilities.',
   'Do not treat the 72% early Boss encounter death fraction as a target for all later Bosses; E1–E5 itself needs separate balance work.',
   'Candidate curves are temporary module overrides, not gameplay stat patches or a deploy.',
   'Normal encounters are mixed-role; match actual Tanks vs Elites separately to validate hierarchy.']};
 return result;
}
function markdown(r){
 const base=r.variants.baseline;
 const out=['# Wanderer v0.13 — Stage 6.7 pilot: Should enemies scale faster after E5?','',
 '**Controlled intervention:** E1–E5 preserved byte-for-byte, including every natural native attempt. E6 entrants begin with identical earned gear, talents and XP. Only the enemy-reference formula for E6+ changes inside an isolated test VM. **No gameplay patch.**',
 '','## Enemy reference targets (source-derived, not enemy final damage)','',
 '| E | Current | Mild | Firm | Linear continuation |','|---|---:|---:|---:|---:|',
 ...r.references.baseline.map((_,i)=>'| E'+(i+1)+' | '+r.references.baseline[i]+' | '+r.references.mild[i]+' | '+r.references.firm[i]+' | '+r.references.linear[i]+' |'),
 '','## Native campaign outcomes for the same 48 initial accounts','',
 '| Curve | E6 entered | E7 entered | E10 completed | E6–E10 attempts | Unresolved fights (tick cap) | Boss deaths / fights | Elite deaths / fights | Normal deaths / fights |',
 '|---|---:|---:|---:|---:|---:|---:|---:|---:|',
 ...Object.values(r.variants).map(v=>'| '+v.id+' | '+v.E6Reached+' | '+v.E7Reached+' | '+v.E10Cleared+' | '+v.lateAttempts+' | '+v.stalls.length+' | '+v.lateBossDeaths+'/'+v.lateBossFights+' | '+v.lateEliteDeaths+'/'+v.lateEliteFights+' | '+v.lateNormalDeaths+'/'+v.lateNormalFights+' |'),
 '','## Accounts reaching and clearing each Expedition','',
 '| E | Baseline entered / cleared | Mild entered / cleared | Firm entered / cleared | Linear entered / cleared |',
 '|---|---:|---:|---:|---:|',
 ...Array.from({length:10},(_,i)=>'| E'+(i+1)+' | '+['baseline','mild','firm','linear'].map(id=>r.variants[id].levels[i].accounts+' / '+r.variants[id].levels[i].clears).join(' | ')+' |'),
 '','## Separating normal, Elite and Boss pressure by Expedition','',
 ...['baseline','mild','firm','linear'].flatMap(id=>[
 '### '+id,
 '| E | Normal deaths/fights | Elite deaths/fights | Boss deaths/fights | First combat HP-loss (%) |',
 '|---|---:|---:|---:|---:|',
 ...r.variants[id].levels.slice(5).map(x=>'| E'+x.E+' | '+x.kinds.combat.deaths+'/'+x.kinds.combat.fights+' | '+x.kinds.elite.deaths+'/'+x.kinds.elite.fights+' | '+x.kinds.boss.deaths+'/'+x.kinds.boss.fights+' | '+(x.meanFirstHpLossPct??'n/a')+' |'),'' ]),
 '## Timed-out native fights (neither deaths nor victories)','',
 ...Object.values(r.variants).flatMap(v=>v.stalls.map(x=>'- '+v.id+': '+x.profile+' seed '+x.seed+' E'+x.level+' attempt '+x.attempt+' — '+x.error)),
 '','## Interpretation and caveats','',
 '- The experiment does not change affinities, weapons, player stats, drops, talents or Boss-specific abilities. It changes raw enemy HP, Attack and Defense *via the original reference consumer*, retaining all role/risk/encounter multipliers.',
 '- It is appropriate to test a late-game ramp before adjusting builds. Identical E1–E5 progression makes the comparison causal for these exact accounts and agent policies.',
 '- The design objective is a **coherent increase in challenge**, NOT matching E1–E5 extreme death rates. A healthy curve may remain less deadly in later Expeditions as players unlock new tactical options.',
 ...r.caveats.map(x=>'- '+x),'','**No merge, deploy or balance coefficient update.**'];
 return out.join('\n')+'\n';
}
function main(args=process.argv.slice(2)){
 const [output,...files]=args;
 if(!output?.endsWith('.json')||files.length!==3)throw Error('Usage: node scripts/v013-stage67-compare-curves.cjs OUT.json THREE_SHARD_SUMMARY.json');
 const r=aggregate(files.map(x=>JSON.parse(fs.readFileSync(x,'utf8'))));
 fs.mkdirSync(path.dirname(output),{recursive:true});
 fs.writeFileSync(output,JSON.stringify(r,null,2)+'\n');
 fs.writeFileSync(output.replace(/\.json$/,'.md'),markdown(r));
 const projection=Object.fromEntries(Object.entries(r.variants).map(([k,x])=>[k,{
  E6:x.E6Reached,E7:x.E7Reached,E10:x.E10Cleared,
  lateAttempts:x.lateAttempts,stalls:x.stalls,
  boss:x.lateBossDeaths+'/'+x.lateBossFights,
  elite:x.lateEliteDeaths+'/'+x.lateEliteFights,
  normal:x.lateNormalDeaths+'/'+x.lateNormalFights,
  e6to10:x.levels.slice(5).map(t=>({E:t.E,entered:t.accounts,won:t.clears,attempts:t.attempts,
   bDeaths:t.kinds.boss.deaths,eDeaths:t.kinds.elite.deaths,nDeaths:t.kinds.combat.deaths,firstHp:t.meanFirstHpLossPct}))
 }]));
 console.log('STAGE67_GLOBAL='+JSON.stringify({matched:true,variants:projection}));
 return r;
}
if(require.main===module)main();
module.exports={aggregate,markdown,main};
