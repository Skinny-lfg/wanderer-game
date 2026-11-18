'use strict';
// Stage 5 stress analysis runs the CURRENT native v0.13 simulator.
// Reporting is descriptive, not a replacement for human playtests or final balance sign-off.
const fs=require('node:fs'),path=require('node:path'),S=require('./simulate-progression.cjs');
const F=globalThis.WandererV013ExpeditionFoundation;
const finite=n=>Number.isFinite(n)?n:0;
const round=(n,p=2)=>Number(finite(n).toFixed(p));
function args(argv){
 const config={seedStart:9101,seedCount:8,levels:[15,50,200],builds:S.BUILDS.map(x=>x.id),points:24,gear:'current',rarity:'Rare',boons:'none',contracts:'none',tickLimit:4500,output:'reports/v013-stage5-stress.json'};
 for(const arg of argv){
  const m=/^--([a-z-]+)=(.+)$/.exec(arg);if(!m)throw Error('Expected --key=value: '+arg);
  const [_,key,val]=m;
  if(key==='seed-start')config.seedStart=Number(val);
  else if(key==='seed-count')config.seedCount=Number(val);
  else if(key==='levels')config.levels=val.split(',').map(Number);
  else if(key==='builds')config.builds=val==='all'?S.BUILDS.map(x=>x.id):val.split(',');
  else if(key==='points')config.points=Number(val);
  else if(key==='gear')config.gear=val;
  else if(key==='rarity')config.rarity=val;
   else if(key==='boons')config.boons=val;
   else if(key==='contracts')config.contracts=val;
  else if(key==='tick-limit')config.tickLimit=Number(val);
  else if(key==='out')config.output=val;
  else throw Error('Unknown option '+key);
 }
 if(!Number.isSafeInteger(config.seedStart)||config.seedStart<1||config.seedStart>0xffffffff-2000||
    !Number.isSafeInteger(config.seedCount)||config.seedCount<1||config.seedCount>128||
    !config.levels.length||config.levels.some(x=>!Number.isSafeInteger(x)||x<1||x>10000)||
    !config.builds.length||config.builds.some(x=>!S.BUILDS.some(b=>b.id===x))||
    !Number.isSafeInteger(config.points)||config.points<0||config.points>100||
    !['current','previous'].includes(config.gear)||!['Common','Uncommon','Rare','Epic'].includes(config.rarity)||!['none','first'].includes(config.boons)||!['none','first'].includes(config.contracts)||
    !Number.isSafeInteger(config.tickLimit)||config.tickLimit<100||config.tickLimit>100000||
    !config.output||config.levels.length*config.builds.length*config.seedCount*3>3000)throw Error('Invalid or excessive Stage 5 scenario matrix (max 3000 dungeons)');
 return config;
}
function wilson(wins,n){
 if(n===0)return [0,100];
 const z=1.95996398454,phat=wins/n,den=1+z*z/n;
 const centre=(phat+z*z/(2*n))/den;
 const half=z*Math.sqrt(phat*(1-phat)/n+z*z/(4*n*n))/den;
 return [round(100*Math.max(0,centre-half),1),round(100*Math.min(1,centre+half),1)];
}
function aggregate(rows){
 const groups=new Map();
 for(const row of rows){
  const key=[row.level,row.build,row.risk,row.conditionId||'missing',row.affinity||'missing'].join('|');
  if(!groups.has(key))groups.set(key,[]);
  groups.get(key).push(row);
 }
 const output=[];
 for(const [key,list] of groups){
  const first=list[0],n=list.length,wins=list.filter(x=>x.won).length,ci=wilson(wins,n),mean=field=>round(list.reduce((a,b)=>a+finite(Number(b[field])),0)/n),totalRooms=list.reduce((a,b)=>a+(b.rooms?.length||0),0);
  const marked=list.reduce((a,b)=>a+finite(b.conditionMarkedRooms),0);
  output.push({level:first.level,build:first.build,risk:first.risk,conditionId:first.conditionId||null,affinity:first.affinity||null,bossName:first.bossName||null,
   n,wins,deaths:list.filter(x=>x.stage==='failed').length,blocked:list.filter(x=>x.stage==='choice').length,
   errors:list.filter(x=>x.error).length,timeouts:list.filter(x=>x.timedOut).length,
   winPct:round(100*wins/n,1),win95Pct:ci,meanSeconds:mean('seconds'),meanDamageTaken:mean('damageTaken'),
   meanMinHpPct:mean('minHpPct'),meanMarkedEncounters:round(marked/n),markedEncounterExposurePct:totalRooms?round(100*marked/totalRooms,1):0,
   meanVeiledPassagesCrossed:mean('conditionPassagesCrossed'),meanBossHealing:mean('bossHealing'),meanBossSummons:mean('bossSummons'),meanEnemyAbilityCasts:mean('enemyAbilityCasts'),meanEssenceNet:mean('essenceNet'),
   meanConditionBarrierGranted:round(list.reduce((v,r)=>v+(r.rooms||[]).reduce((u,x)=>u+finite(x.conditionBarrierGranted),0),0)/n),
   meanSanguineTriggers:round(list.reduce((v,r)=>v+(r.rooms||[]).reduce((u,x)=>u+finite(x.conditionRiteTriggers),0),0)/n)
  });
 }
 return output.sort((a,b)=>a.level-b.level||a.build.localeCompare(b.build)||a.risk-b.risk||a.conditionId.localeCompare(b.conditionId)||(a.affinity||'').localeCompare(b.affinity||''));
}
function percentile(values,p){
 const sorted=values.filter(Number.isFinite).sort((a,b)=>a-b);
 if(!sorted.length)return null;
 const rank=(sorted.length-1)*p,index=Math.floor(rank),weight=rank-index;
 return round(sorted[index]*(1-weight)+sorted[Math.min(sorted.length-1,index+1)]*weight);
}
function rollups(rows,dimension){
 const fields={condition:'conditionId',difficulty:'risk',build:'build',level:'level',affinity:'affinity',boss:'bossAffinity'};
 const field=fields[dimension];
 if(!field)throw Error('Unknown rollup dimension');
 const buckets=new Map();
 for(const row of rows){const key=String(row[field]??'missing');if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(row);}
 return [...buckets].map(([key,group])=>{
  const n=group.length,wins=group.filter(x=>x.won).length;
  return {key,n,wins,winPct:round(100*wins/n,1),win95Pct:wilson(wins,n),deaths:group.filter(x=>x.stage==='failed').length,
   errors:group.filter(x=>x.error).length,timeouts:group.filter(x=>x.timedOut).length,blocked:group.filter(x=>x.stage==='choice').length,
   meanSeconds:round(group.reduce((a,x)=>a+finite(x.seconds),0)/n),
   p50Seconds:percentile(group.map(x=>x.seconds),.5),p90Seconds:percentile(group.map(x=>x.seconds),.9),
   p10MinHpPct:percentile(group.map(x=>x.minHpPct),.1),
   meanDamageTaken:round(group.reduce((a,x)=>a+finite(x.damageTaken),0)/n),
    meanBossHealing:round(group.reduce((a,x)=>a+finite(x.bossHealing),0)/n),meanBossSummons:round(group.reduce((a,x)=>a+finite(x.bossSummons),0)/n),meanEnemyAbilityCasts:round(group.reduce((a,x)=>a+finite(x.enemyAbilityCasts),0)/n)};
 }).sort((a,b)=>Number.isFinite(+a.key)&&Number.isFinite(+b.key)?+a.key-+b.key:a.key.localeCompare(b.key));
}
function run(config){
 const simulation=S.simulate({...S.DEFAULTS,mode:'conditions',levels:config.levels,builds:config.builds,seeds:Array.from({length:config.seedCount},(_,i)=>config.seedStart+i),points:config.points,gear:config.gear,rarity:config.rarity,boons:config.boons,contracts:config.contracts,tickLimit:config.tickLimit});
 const rows=simulation.rows,byCondition=Object.fromEntries(F.CATALOG.conditions.map(x=>[x.id,rows.filter(r=>r.conditionId===x.id).length]));
 const report={schemaVersion:2,method:'Current v0.13 Dungeon routes with Stage 7 rewards, six Affinity Bosses and Stage 8 creature skills; deterministic seeded replay. Observational, not a paired causal estimate.',sourceSha256:simulation.sourceSha256,settings:config,
 summary:{cases:rows.length,wins:rows.filter(r=>r.won).length,deaths:rows.filter(r=>r.stage==='failed').length,
   blocked:rows.filter(r=>r.stage==='choice').length,errors:rows.filter(r=>r.error).length,timeouts:rows.filter(r=>r.timedOut).length,conditionCoverage:byCondition,
   coverageComplete:Object.values(byCondition).every(n=>n>0),bossAffinities:simulation.summary.exposures.bossAffinities,warnings:[]},
 groups:aggregate(rows),rollups:{condition:rollups(rows,'condition'),difficulty:rollups(rows,'difficulty'),build:rollups(rows,'build'),level:rollups(rows,'level'),affinity:rollups(rows,'affinity'),boss:rollups(rows,'boss')},rows};
 if(!report.summary.coverageComplete)report.summary.warnings.push('Not all six conditions appeared. Increase seed count before inferring fairness.');
 if(report.groups.some(x=>x.n<100))report.summary.warnings.push('Detailed cohorts have fewer than 100 cases; do not use them for final balance decisions.');
 if(report.rollups.condition.some(x=>x.n<100))report.summary.warnings.push('At least one pooled Condition has fewer than 100 cases; this cannot support a final Condition fairness verdict.');
 report.summary.warnings.push('Natural conditions co-vary with the six selected Affinity Bosses, risk, routes and enemy compositions; pooled rates are observational, not randomized causal effects.');
 if(report.summary.blocked)report.summary.warnings.push('Some short routes lack sufficient steps; inspect travel paths before calling them unwinnable maps.');
 if(config.points>0)report.summary.warnings.push('Fixed synthetic permanent talents: these points are not naturally earned at E1; rerun --points=0 for a bare progression comparison.');
 return report;
}
function main(argv=process.argv.slice(2)){
 const config=args(argv),report=run(config),dest=path.resolve(process.cwd(),config.output);
 fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({output:dest,cases:report.summary.cases,wins:report.summary.wins,blocked:report.summary.blocked,errors:report.summary.errors,timeouts:report.summary.timeouts,conditionCoverage:report.summary.conditionCoverage,warnings:report.summary.warnings},null,2));
 if(report.summary.errors||report.summary.timeouts)process.exitCode=1;
 return report;
}
if(require.main===module)main();
module.exports={args,wilson,aggregate,rollups,percentile,run,main};
