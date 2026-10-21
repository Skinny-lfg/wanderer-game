// Paired native-runtime comparison for B.1. The harness splits route/draft/control
// randomness from combat rolls; production RNG behavior is unchanged.
const fs=require('node:fs'),crypto=require('node:crypto'),{performance}=require('node:perf_hooks');
const {run}=require('./v012-affinity-combat-sim.cjs');
const builds=[
 {name:'Cloth Staff',weapon:'Staff',armorType:'Cloth',family:'magic'},
 {name:'Cloth Wand + Orb',weapon:'Wand',armorType:'Cloth',family:'magic',offhandType:'Orb'},
 {name:'Plate Sword + Shield',weapon:'Sword',armorType:'Plate',family:'blood',offhandType:'Shield'},
 {name:'Plate Mace + Shield',weapon:'Mace',armorType:'Plate',family:'aegis',offhandType:'Shield'},
 {name:'Leather Dual Daggers',weapon:'Daggers',armorType:'Leather',family:'fury',offhandType:'Off-Hand Dagger'},
 {name:'Leather Bow',weapon:'Bow',armorType:'Leather',family:'fury'},
 {name:'Leather Two-Handed',weapon:'Two-Handed',armorType:'Leather',family:'blood'}
];
const partners={blood:['decay','magic'],aegis:['vitality','fury'],fury:['magic','blood'],magic:['fury','aegis']};
function mean(a,key){return a.length?+(a.reduce((s,x)=>s+(Number(x[key])||0),0)/a.length).toFixed(3):null;}
function summarize(rows){
 const grouped=new Map();for(const row of rows){const key=[row.routeMode,row.E,row.buildName,row.strategy].join('|');if(!grouped.has(key))grouped.set(key,[]);grouped.get(key).push(row);}
 return [...grouped].map(([key,a])=>{
  const target=a[0].targetFamilies,unlocked={};for(const f of target){const got=a.map(r=>r.unlockedAt[f]).filter(Number.isFinite);unlocked[f]={runs:got.length,meanRealm:got.length?+(got.reduce((s,n)=>s+n,0)/got.length).toFixed(2):null};}
  const hybridCounts={};for(const r of a)for(const id of r.hybrids)hybridCounts[id]=(hybridCounts[id]||0)+1;
  return {key,n:a.length,wins:a.filter(r=>r.win).length,winRate:+(100*a.filter(r=>r.win).length/a.length).toFixed(1),meanRealm:mean(a,'reached'),meanDps:mean(a,'dps'),meanHealPerSecond:mean(a,'healPerSecond'),meanSurvivalBudget:mean(a,'observedEhpBudget'),meanCombatSeconds:mean(a,'seconds'),meanUnlockedFamilies:mean(a.map(r=>({...r,n:r.unlockedFamilies.length})),'n'),targetUnlocks:unlocked,meanTargetsNotUnlocked:mean(a.map(r=>({...r,n:r.missing.filter(f=>target.includes(f)).length})),'n'),meanOffPlanFamilies:mean(a.map(r=>({...r,n:r.unplannedFamilies.length})),'n'),meanHybridCount:mean(a.map(r=>({...r,n:r.hybrids.length})),'n'),hybridRuns:a.filter(r=>r.hybrids.length).length,hybridIds:hybridCounts,errors:a.filter(r=>r.error).length,timeouts:a.filter(r=>r.timeout).length};
 });
}
const rows=[],start=performance.now(),seeds=16;
for(const E of [10,50,100,200])for(let bi=0;bi<builds.length;bi++){
 const build=builds[bi],target=[build.family,...partners[build.family]];
 for(let rep=0;rep<seeds;rep++)for(const strategy of ['triple','random'])for(const routeMode of ['current','planned']){
  const seed=62000000+E*100003+bi*997+rep*17;
  const r=run({E,...build,buildName:build.name,rarity:'Epic',family:build.family,strategy,runes:true,seed,controlSeed:seed,routeMode,targetFamilies:target});
  rows.push(r);if(rows.length%112===0)process.stderr.write(`completed ${rows.length} / ${4*builds.length*seeds*2*2}\n`);
 }
}
const result={type:'v012-phase-b1-controlled-affinity-plan',baseCommit:'06b924e',cases:rows.length,seedsPerBuildLevelStrategy:seeds,policies:['triple','random'],levels:[10,50,100,200],rarity:'Epic',builds,control:'Matched route, draft, reward and combat seeds per case. Harness route/draft/control streams are independent of combat-only draws; current vs planned differs only by optional route-plan offer guarantees. No balance changes, potions or selected events.',sourceHashes:{controller:crypto.createHash('sha256').update(fs.readFileSync('online/v012-expedition-controller.js')).digest('hex'),combat:crypto.createHash('sha256').update(fs.readFileSync('combat/v012-combat-runtime.js')).digest('hex'),buildcraft:crypto.createHash('sha256').update(fs.readFileSync('combat/v012-buildcraft.js')).digest('hex')},wallSeconds:+((performance.now()-start)/1000).toFixed(1),groups:summarize(rows),rows};
const output=process.argv[2]||'/tmp/v012-affinity-plan-results.json';fs.writeFileSync(output,JSON.stringify(result)+'\n');
console.log(JSON.stringify({cases:rows.length,wallSeconds:result.wallSeconds,errors:rows.filter(r=>r.error).length,timeouts:rows.filter(r=>r.timeout).length,output}));
if(rows.some(r=>r.error||r.timeout))process.exitCode=1;
