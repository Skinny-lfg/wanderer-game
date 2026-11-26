'use strict';
// Stage 5 diagnostic: paired native Off-Hand encounters, plus separate earned accounts.
const fs=require('node:fs'),path=require('node:path');
const S=require('./simulate-progression.cjs'),N=require('./v013-natural-progression.cjs');
const TYPES=['Shield','Orb','Tome','Charm'];
const LEVELS=[{E:1,rarity:'Common',points:0},{E:5,rarity:'Uncommon',points:4},{E:10,rarity:'Rare',points:10},{E:20,rarity:'Epic',points:18}];
const SEEDS=[94101,94102,94103],KINDS=['normal','elite','boss'];
const pick=id=>{const b=S.BUILDS.find(x=>x.id===id);if(!b)throw Error('Unknown build '+id);return b;};
const BUILDS=[
 {...pick('aegis-sword'),id:'aegis-sword'},
 {...pick('aegis-radiance'),id:'aegis-mace'},
 {...pick('arcane-decay'),id:'arcane-wand'},
 {...pick('blood-fury'),id:'blood-daggers'},
 {...pick('arcane-decay'),id:'hexblade-sword',weapon:'Sword'},
 {id:'pure-blood-sword',name:'Pure Blood Sword',weapon:'Sword',families:['blood'],skills:['bleeding_edge','deep_cuts','blood_drinker']}
];
function parseArgs(args=[]){
 const options={mode:'smoke',out:'reports/v013-offhand-stage5-smoke.json'};
 for(const arg of args){const m=/^--([a-z-]+)=(.*)$/.exec(arg);if(!m)throw Error('Expected --key=value: '+arg);
  if(m[1]==='mode'&&['smoke','paired','natural'].includes(m[2]))options.mode=m[2];
  else if(m[1]==='out'&&/^reports\/[a-z0-9-]+\.json$/.test(m[2]))options.out=m[2];
  else throw Error('Invalid argument: '+arg);
 }
 return options;
}
const val=n=>Number(n)||0,avg=(arr,key)=>arr.length?+(arr.reduce((t,r)=>t+val(r[key]),0)/arr.length).toFixed(2):null;
function metrics(r){
 const m=r.affinityMetrics||{};
 return {barrierEntry:val(m.barrierAtEntry),barrierGenerated:val(m.barrierGenerated),
  barrierAbsorbed:val(m.barrierAbsorbed),healing:val(m.healingActual),
  orbBarrier:val(m.offhandOrbBarrier),tomeMana:val(m.offhandTomeMana),
  charmHealing:val(m.offhandCharmHealing),spellPower:val(m.spellPower),
  manaSpent:val(m.manaSpent),offhandProcCounts:m.offhandProcs||{}};
}
function summaries(rows,keys){
 const map=new Map();
 for(const r of rows){const key=keys.map(k=>r[k]).join(' / ');if(!map.has(key))map.set(key,[]);map.get(key).push(r);}
 return [...map].map(([label,v])=>({label,n:v.length,wins:v.filter(r=>r.won).length,deaths:v.filter(r=>r.died).length,
  timeouts:v.filter(r=>r.timedOut).length,winPct:+(100*v.filter(r=>r.won).length/v.length).toFixed(1),
  meanSecondsOnWins:avg(v.filter(r=>r.won),'seconds'),meanMinHpPct:avg(v,'minHpPct'),
  meanDamageTaken:avg(v,'damageTaken'),meanAbsorbed:avg(v,'absorbed'),
  meanBarrierGenerated:avg(v,'barrierGenerated'),meanOrbBarrier:avg(v,'orbBarrier'),
  meanTomeMana:avg(v,'tomeMana'),meanCharmHealing:avg(v,'charmHealing'),
  meanManaSpent:avg(v,'manaSpent')}));
}
function pairedReport(options={}){
 const small=options.mode==='smoke',levels=small?[LEVELS[1]]:LEVELS;
 const builds=small?[BUILDS[0]]:BUILDS,kinds=small?['normal']:KINDS,seeds=small?[SEEDS[0]]:SEEDS;
 const rows=[],pairs=[],issues=[],epicTrials=[],preparedBosses=[];
 for(const tier of levels)for(const build of builds)for(const kind of kinds)for(const seed of seeds){
  const cohort=[];
  for(const offhand of TYPES){
   try{
    const opts={...S.DEFAULTS,mode:'encounter',gear:'current',rarity:tier.rarity,
      points:tier.points,runes:false,tickLimit:4500,targetPolicy:'mechanics',
      lockScenarioStreams:true,measure:true,offhandType:offhand};
    const r=S.encounter(tier.E,build,seed,kind,opts);
    const row={build:build.id,weapon:build.weapon,level:tier.E,rarity:tier.rarity,
      points:tier.points,kind,seed,offhand,otherGearFingerprint:r.otherGearFingerprint,
      gearFingerprint:r.gearFingerprint,realm:r.realm,affinity:r.affinity,
      groupSize:r.groupSize,status:r.status,won:r.won,died:r.died,timedOut:r.timedOut,
      seconds:r.seconds,damageDealt:r.damageDealt,damageTaken:r.damageTaken,
      absorbed:r.absorbed,minHpPct:r.minHpPct,hpEnd:r.hpEnd,mpEnd:r.mpEnd,...metrics(r)};
    rows.push(row);cohort.push(row);
    if(r.offhandType!==offhand)issues.push({kind:'wrong_offhand',build:build.id,offhand,actual:r.offhandType});
    if(r.timedOut||!r.won&&!r.died)issues.push({kind:'unresolved',build:build.id,level:tier.E,kindEncounter:kind,seed,offhand,status:r.status});
   }catch(error){issues.push({kind:'native_error',build:build.id,level:tier.E,kindEncounter:kind,seed,offhand,error:String(error.stack||error).slice(0,1400)});}
  }
  if(cohort.length!==4)continue;
  for(const key of ['otherGearFingerprint','realm','affinity','groupSize']){
   if(new Set(cohort.map(r=>r[key])).size!==1)
    issues.push({kind:'unpaired_'+key,build:build.id,level:tier.E,kindEncounter:kind,seed,values:cohort.map(r=>r[key])});
  }
  const shield=cohort[0];
  for(const row of cohort.slice(1))pairs.push({build:build.id,level:tier.E,kindEncounter:kind,seed,offhand:row.offhand,
   winDelta:Number(row.won)-Number(shield.won),
   secondsDeltaIfBothWin:row.won&&shield.won?+(row.seconds-shield.seconds).toFixed(2):null,
   barrierAbsorbedDelta:+(row.barrierAbsorbed-shield.barrierAbsorbed).toFixed(2),
   healingDelta:+(row.healing-shield.healing).toFixed(2),
   manaSpentDelta:+(row.manaSpent-shield.manaSpent).toFixed(2)});
 }
 if(!small){
  const cases=[{build:BUILDS[2],offhand:'Tome',trait:'echoing_recall'},
   {build:BUILDS[0],offhand:'Charm',trait:'heartbloom'},
   {build:BUILDS[2],offhand:'Orb',trait:'ward'}];
  for(const c of cases)for(const seed of SEEDS)for(const upgraded of [false,true]){
   try{
    const r=S.encounter(20,c.build,seed,'boss',{...S.DEFAULTS,mode:'encounter',
      gear:'current',rarity:'Epic',points:18,runes:false,tickLimit:4500,
      targetPolicy:'mechanics',lockScenarioStreams:true,measure:true,offhandType:c.offhand,
      offhandEpicTrait:upgraded?c.trait:null});
    epicTrials.push({build:c.build.id,offhand:c.offhand,trait:upgraded?c.trait:'unmodified-epic',
     actualTrait:r.offhandTrait,seed,won:r.won,died:r.died,timedOut:r.timedOut,
     seconds:r.seconds,otherGearFingerprint:r.otherGearFingerprint,metrics:metrics(r)});
    if(r.offhandTrait!==(upgraded?c.trait:null))
     issues.push({kind:'epic_wrong_trait',offhand:c.offhand,seed,upgraded,actual:r.offhandTrait});
    if(r.timedOut)issues.push({kind:'epic_timeout',offhand:c.offhand,seed,upgraded});
   }catch(error){issues.push({kind:'epic_error',offhand:c.offhand,seed,upgraded,error:String(error.stack||error).slice(0,1200)});}
  }
 }
 if(!small){
  // Separate high-investment, prepared-boss sensitivity run. These are
  // controlled fixtures, NOT claimed as naturally earned E5/E10/E20 gear.
  for(const tier of LEVELS.slice(1))for(const build of BUILDS)for(const seed of SEEDS){
   const cohort=[];
   for(const offhand of TYPES){
    try{
     const r=S.bossPreparationEncounter(tier.E,build,seed,{
      ...S.DEFAULTS,mode:'bossprep',gear:'current',rarity:'Epic',points:24,
      runes:true,lockScenarioStreams:true,measure:true,tickLimit:4500,
      targetPolicy:'mechanics',offhandType:offhand
     },'both');
     const row={build:build.id,weapon:build.weapon,level:tier.E,
      rarity:'Epic',points:24,kind:'prepared-boss',seed,offhand,
      otherGearFingerprint:r.otherGearFingerprint,gearFingerprint:r.gearFingerprint,
      affinity:r.affinity,realm:r.realm,groupSize:r.initialEnemies,
      status:r.status,won:r.won,died:r.died,timedOut:r.timedOut,seconds:r.seconds,
      damageDealt:r.damageDealt,damageTaken:r.damageTaken,absorbed:r.absorbed,
      minHpPct:r.minHpPct,hpEnd:r.hpEnd,mpEnd:r.mpEnd,...metrics(r)};
     cohort.push(row);preparedBosses.push(row);
     if(r.timedOut||!r.won&&!r.died)issues.push({kind:'prepared_unresolved',build:build.id,E:tier.E,seed,offhand,status:r.status});
    }catch(error){issues.push({kind:'prepared_error',build:build.id,E:tier.E,seed,offhand,error:String(error.stack||error).slice(0,1400)});}
   }
   if(cohort.length===4)for(const field of ['otherGearFingerprint','affinity','realm','groupSize'])
    if(new Set(cohort.map(x=>x[field])).size!==1)
     issues.push({kind:'prepared_unpaired_'+field,build:build.id,E:tier.E,seed,values:cohort.map(x=>x[field])});
  }
 }
 return {stage:'offhand-stage5',schemaVersion:1,mode:small?'smoke':'paired',
  source:S.sourceFingerprint().sha256,
  settings:{levels,builds:builds.map(x=>({id:x.id,weapon:x.weapon,families:x.families})),
   kinds,seeds,offhands:TYPES,pairedScenarioStreams:true,runes:false,
   fixedTalentBudget:true,earnedAccount:false},
  coverage:{expected:levels.length*builds.length*kinds.length*seeds.length*4,
   completed:rows.length,pairedGroups:pairs.length/3,
   wins:rows.filter(r=>r.won).length,deaths:rows.filter(r=>r.died).length,
   timeouts:rows.filter(r=>r.timedOut).length,
   preparedBosses:preparedBosses.length,preparedBossWins:preparedBosses.filter(r=>r.won).length,
   issues:issues.length},
  groupSummaries:summaries(rows,['level','kind','offhand']),
  buildSummaries:summaries(rows,['build','offhand']),
  pairs,epicTrials,preparedBossSummaries:summaries(preparedBosses,['level','offhand']),
  preparedBossBuildSummaries:summaries(preparedBosses,['build','offhand']),
  preparedBosses,issues,rows,
  limitations:[
   'All four Off-Hand choices are controlled genuine native item rolls; not naturally earned loot.',
   'Only E1 uses a naturally accurate zero talent budget. E5/E10/E20 use fixed synthetic 4/10/18-point builds, not guaranteed earned XP.',
   'Scenario streams, other equipment, generated Realm and opponent type are paired. The Off-Hand and its effects are the deliberate variables.',
   'Three seeds per build/level/kind: outcomes are exploratory, not statistically conclusive win rates.',
   'Elapsed seconds count only on wins when comparing speed. Early death is not faster progress.',
   'Epic trait cases use a trait-free Epic control versus an otherwise identical guaranteed Epic recipe trait. They are diagnostic fixtures, not naturally earned items.',
   'Prepared-boss stress is a separate 216-fight high-investment cohort: native Epic gear, 24 synthetic Talent points, three Runes, marked Elite and Reliquary preparation. It does not represent earned progression.',
   'Real offhand proc telemetry is read from the combat engine; Gear Power is not used as a surrogate for combat performance.'
  ]};
}
function naturalReport(){
 const cfg=N.parseArgs(['--seeds=9101,9201','--profiles=cautious,arcane-fire,hexblade-hybrid,leather-duelist',
  '--max-level=20','--max-attempts=4','--max-total-attempts=12','--tick-limit=4500']);
 const data=N.run(cfg);
 const accounts=data.accounts.map(a=>{
  const equipped=a.finalGear?.items?.find(i=>i.slot==='offhand')||null;
  const choices=a.attempts.flatMap(x=>[...(x.camp?.equipped||[]),...(x.equipped||[])])
   .filter(x=>x.slot==='offhand');
  const rooms=a.attempts.flatMap(x=>x.rooms||[]);
  return {seed:a.seed,profile:a.profile,endLevel:a.endLevel,stopReason:a.stopReason,
    attempts:a.attempts.length,reached:a.reached,
    finalOffhand:equipped?.subtype||null,finalTrait:equipped?.v013Trait||null,
    finalRarity:equipped?.rarity||null,offhandChanges:choices.length,choices,
    fights:rooms.length,elites:rooms.filter(x=>x.roomType==='elite').length,
    bosses:rooms.filter(x=>x.roomType==='boss').length,
    bossWins:a.attempts.filter(x=>x.bossWon).length,errors:a.attempts.filter(x=>x.error).length};
 });
 return {stage:'offhand-stage5-natural',schemaVersion:1,mode:'natural',source:data.source,
  settings:data.settings,integrity:data.integrity,coverage:data.coverage,
  accounts,levels:data.levels,limitations:[
   ...data.limitations,
   'Only genuine earned Off-Hand changes are observed. This is not a controlled four-way randomization.',
   'Unreached E levels are censored; an account which never unlocks E20 has no E20 outcome.'
  ]};
}
function markdown(report){
 const lines=['# Wanderer v0.13 Off-Hand Stage 5: '+report.mode,'',
  'Source fingerprint: '+report.source,'',
  'Coverage: '+JSON.stringify(report.coverage),''];
 if(report.groupSummaries){
  lines.push('## By level, enemy tier and Off-Hand','','| Cohort | N | Wins | Deaths | Win-only mean seconds | Absorbed | Orb Barrier | Tome Mana | Charm healing |',
   '|---|---:|---:|---:|---:|---:|---:|---:|---:|');
  for(const g of report.groupSummaries)lines.push('| '+g.label+' | '+g.n+' | '+g.wins+' | '+g.deaths+' | '+(g.meanSecondsOnWins??'-')+' | '+g.meanAbsorbed+' | '+g.meanOrbBarrier+' | '+g.meanTomeMana+' | '+g.meanCharmHealing+' |');
  lines.push('','## By build','','| Build/Off-Hand | N | Wins | Deaths | Win % | Barrier generated | Damage taken |',
   '|---|---:|---:|---:|---:|---:|---:|');
  for(const g of report.buildSummaries)lines.push('| '+g.label+' | '+g.n+' | '+g.wins+' | '+g.deaths+' | '+g.winPct+' | '+g.meanBarrierGenerated+' | '+g.meanDamageTaken+' |');
  if(report.preparedBossSummaries?.length){
   lines.push('','## High-investment prepared Boss stress (separate synthetic cohort)','',
    '| E and Off-Hand | N | Wins | Deaths | Barrier absorbed | Orb Barrier | Tome Mana | Charm healing |',
    '|---|---:|---:|---:|---:|---:|---:|---:|');
   for(const g of report.preparedBossSummaries)
    lines.push('| '+g.label+' | '+g.n+' | '+g.wins+' | '+g.deaths+' | '+g.meanAbsorbed+' | '+g.meanOrbBarrier+' | '+g.meanTomeMana+' | '+g.meanCharmHealing+' |');
  }
 }else if(report.accounts){
  lines.push('## Earned accounts','','| Profile | Attempts | Highest E reached | Final Off-Hand | Off-Hand changes | Boss wins | Errors |',
  '|---|---:|---:|---|---:|---:|---:|');
  for(const a of report.accounts)lines.push('| '+a.profile+' | '+a.attempts+' | E'+a.endLevel+' | '+(a.finalOffhand||'none')+' | '+a.offhandChanges+' | '+a.bossWins+' | '+a.errors+' |');
 }
 lines.push('','## Limitations','',...report.limitations.map(x=>'- '+x),'',
  'Raw per-seed paired comparisons and Epic trial observations are retained in the JSON evidence.','');
 return lines.join('\n');
}
function main(args=process.argv.slice(2)){
 const cfg=parseArgs(args),report=cfg.mode==='natural'?naturalReport():pairedReport(cfg);
 const file=path.resolve(process.cwd(),cfg.out);
 fs.mkdirSync(path.dirname(file),{recursive:true});
 fs.writeFileSync(file,JSON.stringify(report,null,2)+'\n');
 fs.writeFileSync(file.replace(/\.json$/,'.md'),markdown(report));
 console.log('OFFHAND_STAGE5='+JSON.stringify({mode:cfg.mode,source:report.source,coverage:report.coverage,
  byBuild:report.buildSummaries||null,accounts:report.accounts||null,issues:report.issues?.slice(0,8)||[]}));
 if(report.coverage.issues||report.coverage.timeouts||report.coverage.errors)process.exitCode=1;
 return report;
}
if(require.main===module)main();
module.exports={TYPES,LEVELS,KINDS,SEEDS,BUILDS,parseArgs,metrics,summaries,pairedReport,naturalReport,markdown,main};
