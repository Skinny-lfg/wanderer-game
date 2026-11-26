'use strict';
// Stage 1, before any Affinity coefficient changes: a reproducible native
// combat baseline. This is NOT an earned-player progression simulation.
// Run through the canonical engine:
// node scripts/simulate-progression.cjs --mode=affinities
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const S=require('./simulate-progression.cjs');
const FAMILIES=Object.freeze(['blood','fury','radiance','aegis','arcane','decay']);
const BUILDS=Object.freeze([
 {id:'pure-blood',name:'Blood',weapon:'Sword',families:['blood'],skills:['affinity_blood','bleeding_edge','deep_cuts','blood_drinker']},
 {id:'pure-fury',name:'Fury',weapon:'Daggers',families:['fury'],skills:['affinity_fury','quick_hands','precision','double_strike']},
 {id:'pure-radiance',name:'Radiance',weapon:'Mace',families:['radiance'],skills:['affinity_radiance','strong_heart','renewal','life_bloom']},
 {id:'pure-aegis',name:'Aegis',weapon:'Mace',families:['aegis'],skills:['affinity_aegis','guarded_block','barrier_pulse','iron_skin']},
 {id:'pure-arcane',name:'Magic (Arcane)',weapon:'Wand',families:['arcane'],skills:['affinity_arcane','element_choice','arcane_focus','mana_spring','arcane_resonance'],element:'arcane'},
 {id:'pure-decay',name:'Decay',weapon:'Daggers',families:['decay'],skills:['affinity_decay','corrupting_touch','virulent_rot','blightburst']},
 {id:'blood-fury',name:'Blood + Fury',weapon:'Daggers',families:['blood','fury'],skills:['affinity_blood','affinity_fury','bleeding_edge','quick_hands','crimson_onslaught']},
 {id:'fury-radiance',name:'Fury + Radiance',weapon:'Daggers',families:['fury','radiance'],skills:['affinity_fury','affinity_radiance','quick_hands','renewal','fervent_life']},
 {id:'radiance-aegis',name:'Radiance + Aegis',weapon:'Mace',families:['radiance','aegis'],skills:['affinity_radiance','affinity_aegis','strong_heart','barrier_pulse','sanctuary']},
 {id:'aegis-arcane',name:'Aegis + Magic',weapon:'Wand',families:['aegis','arcane'],skills:['affinity_aegis','affinity_arcane','element_choice','barrier_pulse','arcane_focus','runic_shield'],element:'arcane'},
 {id:'arcane-decay',name:'Magic + Decay',weapon:'Wand',families:['arcane','decay'],skills:['affinity_arcane','affinity_decay','element_choice','arcane_focus','corrupting_touch','hex_bolt'],element:'arcane'},
 {id:'decay-blood',name:'Decay + Blood',weapon:'Daggers',families:['decay','blood'],skills:['affinity_decay','affinity_blood','corrupting_touch','bleeding_edge','plague_spread']}
].map(x=>Object.freeze({...x,families:Object.freeze(x.families),skills:Object.freeze(x.skills)})));
const DEFAULTS=Object.freeze({
 levels:[5,35],seeds:[9101,9201],points:24,rarity:'Rare',gear:'current',
 runes:false,enemyAffinity:'aegis',risk:0,mobs:3,tickLimit:4500,
 targetPolicy:'focus',builds:BUILDS.map(x=>x.id),
 output:'reports/v013-affinity-current.json'
});
const round=(n,d=2)=>Number(Number(n).toFixed(d));
function integers(value,name,min=1,max=10000){
 const a=[...new Set(value.split(',').map(Number))];
 if(!a.length||a.some(x=>!Number.isSafeInteger(x)||x<min||x>max))throw Error('Invalid '+name+': '+value);
 return a;
}
function parseArgs(args=[]){
 const cfg={...DEFAULTS,levels:[...DEFAULTS.levels],seeds:[...DEFAULTS.seeds],builds:[...DEFAULTS.builds]};
 for(const arg of args){
  const m=/^--([a-z-]+)=(.+)$/.exec(arg);if(!m)throw Error('Expected --key=value: '+arg);
  const [,key,value]=m;
  if(key==='mode'&&value==='affinities')continue;
  if(key==='levels')cfg.levels=integers(value,key,1,1000);
  else if(key==='seeds')cfg.seeds=integers(value,key,1,4000000000);
  else if(key==='builds'){
   cfg.builds=[...new Set(value.split(','))];
   if(!cfg.builds.length||cfg.builds.some(id=>!BUILDS.some(b=>b.id===id)))throw Error('Unknown Stage 1 build');
  }else if(['points','risk','mobs','tick-limit'].includes(key)){
   const n=Number(value),limit={points:[0,100],risk:[0,2],mobs:[1,22],'tick-limit':[100,100000]}[key];
   if(!Number.isSafeInteger(n)||n<limit[0]||n>limit[1])throw Error('Invalid '+key);
   cfg[key==='tick-limit'?'tickLimit':key]=n;
  }else if(key==='enemy-affinity'&&FAMILIES.includes(value))cfg.enemyAffinity=value;
  else if(key==='rarity'&&['Common','Uncommon','Rare','Epic'].includes(value))cfg.rarity=value;
  else if(key==='gear'&&['current','previous'].includes(value))cfg.gear=value;
  else if(key==='runes'&&['true','false'].includes(value))cfg.runes=value==='true';
  else if(key==='target-policy'&&['focus','mechanics','adds'].includes(value))cfg.targetPolicy=value;
  else if(key==='out'&&value.endsWith('.json')&&!path.isAbsolute(value)&&!value.includes('..'))cfg.output=value;
  else throw Error('Unsupported Stage 1 argument: '+arg);
 }
 if(cfg.points!==24)throw Error('Stage 1 fixed-budget comparison requires exactly 24 actually allocated points');
 if(cfg.levels.length*cfg.seeds.length*cfg.builds.length>240)throw Error('Stage 1 pilot limited to 240 native encounters');
 return cfg;
}
function summaries(rows){
 const groups=[];
 for(const id of [...new Set(rows.map(x=>x.build))])for(const level of [...new Set(rows.filter(x=>x.build===id).map(x=>x.level))]){
  const selected=rows.filter(x=>x.build===id&&x.level===level&&!x.error),n=selected.length;
  if(!n)continue;
  const mean=k=>round(selected.reduce((v,x)=>v+(Number(x[k])||0),0)/n);
  const activationTotals={};
  for(const r of selected)for(const [key,count] of Object.entries(r.passiveActivations||{}))activationTotals[key]=(activationTotals[key]||0)+count;
  groups.push({build:id,level,n,
   wins:selected.filter(x=>x.won).length,deaths:selected.filter(x=>x.died).length,
   meanBarrierAtEntry:mean('barrierAtEntry'),meanBarrierGenerated:mean('barrierGenerated'),
   meanBarrierAbsorbed:mean('barrierAbsorbed'),meanHealing:mean('healingActual'),
   meanDotDamage:mean('dotDamageActual'),meanManaSpent:mean('manaSpent'),
   meanSeconds:mean('seconds'),meanBarrierPerSecond:mean('barrierPerSecond'),
   meanHealingPerSecond:mean('healingPerSecond'),meanDotPerSecond:mean('dotPerSecond'),
   meanSpellPower:mean('spellPower'),meanMaxHealth:mean('maxHealth'),
   totalPassiveActivations:activationTotals
  });
 }
 return groups;
}
function run(cfg){
 const started=Date.now(),rows=[],builds=cfg.builds.map(id=>BUILDS.find(b=>b.id===id));
 const options={...S.DEFAULTS,points:cfg.points,gear:cfg.gear,rarity:cfg.rarity,runes:cfg.runes,
  mode:'affinities',measure:true,lockScenarioStreams:true,
  tickLimit:cfg.tickLimit,targetPolicy:cfg.targetPolicy,boons:'none',contracts:'none'};
 const plans=new Map();
 for(const build of builds){
  const progress=S.talentPlan(build,cfg.points);
  const selected=build.families.filter(f=>progress.nodes.includes('affinity_'+f));
  if(selected.length!==build.families.length)throw Error('Unrepresented build '+build.id+': '+selected.join(','));
  if(progress.nodes.length!==cfg.points)throw Error('Incomplete baseline allocation '+build.id+': '+progress.nodes.length+'/'+cfg.points);
  plans.set(build.id,{selectedAffinities:selected,pointsUsed:progress.nodes.length,chosen:progress.nodes,
   hybridSkillActive:build.families.length===2?build.skills.some(id=>!id.startsWith('affinity_')&&progress.nodes.includes(id)):null});
 }
 for(const level of cfg.levels)for(const build of builds)for(const seed of cfg.seeds){
  try{
   const row=S.encounter(level,build,seed,'normal',options,undefined,undefined,cfg.enemyAffinity,cfg.risk,cfg.mobs);
   const m=row.affinityMetrics;
   if(!m)throw Error('Native measurement instrumentation not connected');
   const duration=row.seconds>0?row.seconds:null;
   const item={
    level,seed,build:build.id,affinities:[...build.families],weapon:build.weapon,gearFingerprint:row.gearFingerprint,
    resolvedSeed:row.resolvedSeed,pointsSpent:row.pointsSpent,selectedAffinities:plans.get(build.id).selectedAffinities,
    status:row.status,won:row.won,died:row.died,timedOut:row.timedOut,seconds:row.seconds,
    maxHealth:m.maxHealth,spellPower:m.spellPower,attackPower:m.attackPower,
    initialHp:row.hpStart,finalHp:row.hpEnd,initialMp:row.mpStart,finalMp:row.mpEnd,
    barrierAtEntry:m.barrierAtEntry,barrierGenerated:m.barrierGenerated,
    barrierAtExit:m.barrierAtExit,barrierAbsorbed:m.barrierAbsorbed,
    healingActual:m.healingActual,dotDamageActual:m.dotDamageActual,manaSpent:m.manaSpent,
    barrierPerSecond:duration?round(m.barrierGenerated/duration,3):null,
    healingPerSecond:duration?round(m.healingActual/duration,3):null,
    dotPerSecond:duration?round(m.dotDamageActual/duration,3):null,
    passiveActivations:m.passiveActivations,plagueSpreadTransfers:row.plagueSpreadTransfers||0,damageDealt:row.damageDealt,damageTaken:row.damageTaken,
    nativeEncounter:{affinity:row.affinity,risk:row.risk,groupSize:row.groupSize,kind:row.nativeEncounter},
    initialStateSha256:row.initialStateSha256,
    ...(row.timedOut?{error:'Native combat timed out'}:{})
   };
   if(Object.values(item).some(x=>typeof x==='number'&&!Number.isFinite(x)))throw Error('Non-finite Stage 1 measurement');
   rows.push(item);
  }catch(error){rows.push({level,seed,build:build.id,error:String(error.message||error)});}
 }
 const summary={total:rows.length,valid:rows.filter(x=>!x.error).length,
  errors:rows.filter(x=>x.error).length,timeouts:rows.filter(x=>x.timedOut).length,
  wins:rows.filter(x=>x.won).length,deaths:rows.filter(x=>x.died).length,
  pureBuilds:builds.filter(b=>b.families.length===1).length,
  hybridBuilds:builds.filter(b=>b.families.length===2).length,
  groups:summaries(rows)};
 const settings={...cfg,builds:[...cfg.builds]};
 const replay=crypto.createHash('sha256').update(JSON.stringify({settings,plans:[...plans],rows})).digest('hex');
 const source=S.sourceFingerprint();
 return {schemaVersion:1,stage:'affinity-coherence-stage1',game:'Wanderer v0.13',
  sourceSha256:source.sha256,replaySha256:replay,settings,plans:Object.fromEntries(plans),
  notes:[
   'Controlled native 3-mob room from a real generated Aegis (or configured Affinity) Realm card. Same seeds, risk and target policy; native actors are initialized through the simulator controlled encounter adapter.',
   'Gear tiers, rarity, RNG streams and fixed talent-point budget are specified and reproducible; each weapon profile has its own native deterministic gear rolls. Gear is fixed throughout each encounter. Cross-build item fingerprints can differ.',
   'Talents are synthetic legal v15 allocations, not earned E1 progression; do not interpret success rates as account progression or final balance.',
   'Barrier generated and actual healing come from the harness native setBarrier/setHeal instrumentation. Opening Barrier is recorded separately. Periodic damage is the native capped periodicDamage metric including Bleed, Burn and Rot.',
   'Passive activations cover Buildcraft activated() only, not all passive stat nodes or uninstrumented specialisations.',
   'Mana spent is measured; total Mana restored is not instrumented in Stage 1. Mana start/end are available, but net change is not a restoration count.',
   'Real player potions, Boons, Contracts, manual skill decisions and adaptive target switching are disabled by the fixed diagnostic policy.',
   'The frozen original Stage 1 results live in reports/v013-stage1-affinity-summary.json. This diagnostic records the rules from the current source revision and must never overwrite the original.'
  ],summary,rows,durationMs:Date.now()-started};
}
function markdown(r){
 const lines=['# Wanderer v0.13 — Current Affinity diagnostic','',
  'Native controlled-combat snapshot at the current source revision. Original Stage 1 is frozen in the repository.','',
  '**Source SHA256:** '+r.sourceSha256,'**Replay SHA256:** '+r.replaySha256,
  '**Scenarios:** '+r.summary.valid+'/'+r.summary.total+' valid; '+r.summary.errors+' errors; '+r.summary.timeouts+' timeouts.','',
  '## Setup','',...Object.entries(r.settings).map(([k,v])=>'- '+k+': '+JSON.stringify(v)),'',
  '## Selected talents per build','',
  ...Object.entries(r.plans).map(([id,p])=>'- **'+id+'**: '+p.pointsUsed+' nodes; '+p.selectedAffinities.join(' + ')+'; '+p.chosen.filter(x=>!x.startsWith('gate_')).slice(0,20).join(', ')),'',
  '## Measured outcomes','',
  '| Build | E | N | Wins | Barrier entry | Barrier generated | Barrier absorbed | Healing/s | Periodic damage/s | Mana spent |',
  '|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|',
  ...r.summary.groups.map(g=>'| '+g.build+' | '+g.level+' | '+g.n+' | '+g.wins+' | '+g.meanBarrierAtEntry+' | '+g.meanBarrierGenerated+' | '+g.meanBarrierAbsorbed+' | '+g.meanHealingPerSecond+' | '+g.meanDotPerSecond+' | '+g.meanManaSpent+' |'),
  '','## Method and limitations','',...r.notes.map(x=>'- '+x),'',
  'Individual seeds, actual item fingerprints, raw counts and activation maps are in the JSON companion.',''];
 return lines.join('\n');
}
function main(args=process.argv.slice(2)){
 const cfg=parseArgs(args),report=run(cfg),out=path.resolve(process.cwd(),cfg.output);
 fs.mkdirSync(path.dirname(out),{recursive:true});
 fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');
 fs.writeFileSync(out.replace(/\.json$/,'.md'),markdown(report));
 console.log('STAGE1_AFFINITY_SUMMARY='+JSON.stringify({
  out:cfg.output,source:report.sourceSha256,replay:report.replaySha256,
  total:report.summary.total,valid:report.summary.valid,errors:report.summary.errors,
  timeouts:report.summary.timeouts,groups:report.summary.groups
 }));
 if(report.summary.errors)console.log('STAGE1_ERRORS='+JSON.stringify(report.rows.filter(x=>x.error).slice(0,12)));
 if(report.summary.errors||report.summary.timeouts)process.exitCode=1;
 return report;
}
module.exports={BUILDS,DEFAULTS,parseArgs,run,markdown,main};
if(require.main===module)main();
