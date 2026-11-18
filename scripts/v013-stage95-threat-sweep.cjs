'use strict';
// CI diagnostic only. Each candidate edits ONLY its temporary GitHub Actions
// runner checkout; the runner restores original files even if a trial fails.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const runtime=path.resolve(__dirname,'../online/v012-expedition-runtime.js');
const original=fs.readFileSync(runtime,'utf8');
const RE1="const endurance=enemy.boss?1.8:3;";
const RE2="enemy.atk*(enemy.miniboss?.75:.65)";
if(!original.includes(RE1)||!original.includes(RE2))throw Error('Native runtime changed: abort sweep');
const configurations=[
 {name:'current',hp:3,atk:.75},
 {name:'attack-first',hp:3.05,atk:1.12},
 {name:'special-threat',hp:3.1,atk:1.25},
 {name:'durable-threat',hp:3.4,atk:1.16}
];
const inspect=[
"const C=require('./scripts/v013-elite-tank-parity.cjs');",
"const x=C.compare({seedStart:9470,scan:160,pairCap:24,gearModes:['starter','common']});",
"const t={};for(const gear of ['starter','common']){",
" const p=x.pairs.filter(x=>x.gear===gear);",
" const mean=(rows,role,k)=>rows.length?+(rows.reduce((v,q)=>v+q[role][k],0)/rows.length).toFixed(2):null;",
" t[gear]={summary:x.summary[gear],archetypes:{}};",
" for(const type of new Set(p.map(q=>q.elite.initial.eliteType))){",
"  const rows=p.filter(q=>q.elite.initial.eliteType===type);",
"  t[gear].archetypes[type]={n:rows.length,eliteWins:rows.filter(q=>q.elite.won).length,tankWins:rows.filter(q=>q.tank.won).length,",
"   eliteMeanDamage:mean(rows,'elite','damageTaken'),tankMeanDamage:mean(rows,'tank','damageTaken'),",
"   eliteMeanSeconds:mean(rows,'elite','seconds'),tankMeanSeconds:mean(rows,'tank','seconds')};",
" }",
"}",
"console.log('SWEEP_RESULT='+JSON.stringify({results:t,errors:x.errors,skipped:x.skippedNonTank}));"
].join('\n');
const outcomes=[];
try{
 for(const c of configurations){
  const modified=original.replace(RE1,"const endurance=enemy.boss?1.8:enemy.miniboss?"+c.hp+":3;").replace(RE2,"enemy.atk*(enemy.miniboss?"+c.atk+":.65)");
  if(modified===original)throw Error('No modification for '+c.name);
  fs.writeFileSync(runtime,modified);
  const child=cp.spawnSync(process.execPath,['-e',inspect],{cwd:path.resolve(__dirname,'..'),encoding:'utf8',maxBuffer:16*1024*1024,timeout:240000});
  const found=child.stdout.match(/^SWEEP_RESULT=(.*)$/m);
  if(child.status!==0||!found)throw Error(c.name+' failed: '+(child.stderr||'')+'\n'+(child.stdout||'').slice(-1000));
  const obj=JSON.parse(found[1]);
  if(obj.errors.length)throw Error(c.name+' encounter errors: '+JSON.stringify(obj.errors.slice(0,2)));
  outcomes.push({config:c,...obj});
  console.log('SWEEP_COMPLETED '+JSON.stringify({name:c.name,starter:obj.results.starter.summary,common:obj.results.common.summary}));
 }
}finally{fs.writeFileSync(runtime,original)}
const data={stage:'9.5',purpose:'select a true Elite danger profile relative to matched normal solo Tanks; no gameplay changes persisted by sweep',outcomes};
const dest=path.resolve(__dirname,'../reports/v013-stage95-threat-sweep.json');fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,JSON.stringify(data,null,2)+'\n');
const lines=['# Stage 9.5 — matched native Tank vs Elite threat tuning sweep','',
 'Native E1, 24 same-seed Tank/Elite pairs per gear and preset; actual role=Tank enemies, native combat, no natural account or artificial wins. Archetype subsets are small; examine the raw report.','',
 '| Variant | Elite HP | Elite ATK | Starter: Tank dmg | Starter: Elite dmg | Starter: Elite wins | Common: Tank dmg | Common: Elite dmg | Common: Elite wins |',
 '|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|'];
for(const p of outcomes)lines.push('| '+p.config.name+' | '+p.config.hp+' | '+p.config.atk+' | '+p.results.starter.summary.tankMeanDamageTaken+' | '+p.results.starter.summary.eliteMeanDamageTaken+' | '+p.results.starter.summary.eliteWins+'/24 | '+p.results.common.summary.tankMeanDamageTaken+' | '+p.results.common.summary.eliteMeanDamageTaken+' | '+p.results.common.summary.eliteWins+'/24 |');
lines.push('','Native ability use and death rates must be reviewed for each of seven Elite types; means across archetypes can hide weak designs. These are controlled trials, not natural E1–E8 win rates.','');
fs.writeFileSync(dest.replace(/\.json$/,'.md'),lines.join('\n'));
console.log('SWEEP_COMPLETE '+JSON.stringify(outcomes.map(p=>({name:p.config.name,starter:p.results.starter.summary,common:p.results.common.summary}))));
