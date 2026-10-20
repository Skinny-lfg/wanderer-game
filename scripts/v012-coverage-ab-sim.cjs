// V0.12: experiment-only paired decision policies. No buffs, no enemy overrides.
// Both arms use the same gear, rune configuration, initial seed, weapon, family and rarity.
const fs=require('node:fs'),{performance}=require('node:perf_hooks');
const {run}=require('./v012-affinity-combat-sim.cjs');
const levels=[10,50,100,200];
const plans=[
 {name:'Blood + Decay',family:'blood',hybrids:['plague_rupture','carrion_detonation'],utility:'Vitality'},
 {name:'Vitality + Aegis',family:'vitality',hybrids:['sanctuary','guardians_oath'],utility:'Fury'},
 {name:'Fury + Magic',family:'fury',hybrids:['spellblade','spell_surge'],utility:'Vitality'}
];
const weapons=['Sword','Mace','Bow','Daggers','Two-Handed','Staff','Wand'];
const rarities=['Rare','Epic'];
const repeat=Math.max(1,Math.min(8,Number(process.env.WANDERER_COVERAGE_REPETITIONS||3)));
const limit=Number(process.env.WANDERER_COVERAGE_LIMIT||0);
const rows=[],problems=[],started=performance.now();
const round=(n,d=2)=>+n.toFixed(d),sum=(items,fn)=>items.reduce((s,x)=>s+(fn(x)||0),0),avg=(items,fn)=>items.length?round(sum(items,fn)/items.length):null;
outer:for(const E of levels)for(const plan of plans)for(const weapon of weapons)for(const rarity of rarities)for(let rep=0;rep<repeat;rep++){
 // Same seeds for matched arms, with randomized world that does not depend on policy.
 const seed=(20261020+E*701+weapons.indexOf(weapon)*43+rarities.indexOf(rarity)*911+rep*100003)>>>0;
 for(const coverage of ['baseline','utility']){
  try{
   const r=run({E,weapon,rarity,family:plan.family,strategy:'dual',runes:true,seed,coverage});
   rows.push({...r,plan:plan.name,rep});
   if(r.error||r.timeout)problems.push({E,plan:plan.name,weapon,rarity,rep,seed,coverage,error:r.error,timeout:r.timeout});
  }catch(e){problems.push({E,plan:plan.name,weapon,rarity,rep,seed,coverage,error:String(e?.stack||e)});}
 }
 if(rows.length&&rows.length%168===0)process.stderr.write('Coverage AB completed '+rows.length+' simulated Expeditions\n');
 if(limit&&rows.length>=limit)break outer;
}
function aggregate(items,plan){
 const n=items.length,wins=items.filter(r=>r.win).length;
 const active=items.filter(r=>r.targetHybrids?.some(id=>plan.hybrids.includes(id))).length;
 return {n,wins,winPct:n?round(100*wins/n,1):0,meanRealms:avg(items,r=>r.reached),
  bossReached:items.filter(r=>r.bossReached).length,
  meanDps:avg(items,r=>r.dps),meanHealSec:avg(items,r=>r.healPerSecond),meanBarrierSec:avg(items,r=>r.barrierPerSecond),
  targetedHybridRuns:active,
  hybridProcs:sum(items,r=>plan.hybrids.reduce((n,id)=>n+(r.telemetry?.[id]?.activations||0),0)),
  utilityPicks:sum(items,r=>r.utilityPicks?.length||0),
  utilityPickedRuns:items.filter(r=>r.utilityPicks?.length).length,
  utilityUnlockedRuns:items.filter(r=>r.utilityUnlocked).length,
  primaryUnlockedRuns:items.filter(r=>r.primaryUnlocked).length,
  errors:items.filter(r=>r.error).length,timeouts:items.filter(r=>r.timeout).length};
}
const summary=[];
for(const E of levels)for(const plan of plans){
 const b=rows.filter(r=>r.E===E&&r.plan===plan.name&&r.coverage==='baseline');
 const u=rows.filter(r=>r.E===E&&r.plan===plan.name&&r.coverage==='utility');
 if(!b.length&&!u.length)continue;
 const key=x=>[x.E,x.plan,x.weapon,x.rarity,x.rep,x.seed].join('|');
 const byBase=new Map(b.map(r=>[key(r),r]));
 let gained=0,lost=0,same=0,improvedRealm=0,lostRealm=0;
 for(const r of u){const v=byBase.get(key(r));if(!v)continue;
  if(r.win&&!v.win)gained++;else if(v.win&&!r.win)lost++;else same++;
  if(r.reached>v.reached)improvedRealm++;else if(r.reached<v.reached)lostRealm++;
 }
 summary.push({E,plan:plan.name,utility:plan.utility,baseline:aggregate(b,plan),coverage:aggregate(u,plan),paired:{winGained:gained,winLost:lost,winSame:same,realmImproved:improvedRealm,realmWorse:lostRealm}});
}
const data={experiment:'existing-affinity-utility-only',notes:'No production balance modifications. Baseline dual-family priority vs same priority plus up to 2 selected utility passives after a permitted third-family route. Actual Realm offers/RNG and triggers apply. Full Rare/Epic same-tier gear and 3 runes. No potion use, event rewards, gear farming or mid-run equipment swaps. 15 Realms.',levels,plans:plans.map(x=>x.name),weapons,rarities,repetitions:repeat,cases:rows.length,problems:problems.length,wallSeconds:round((performance.now()-started)/1000),summary,problemSamples:problems.slice(0,10)};
const dest=process.argv[2]||'/tmp/wanderer-v012-coverage-ab.json';
fs.writeFileSync(dest,JSON.stringify({data,rows})+'\n');
console.log('COVERAGE_AB_SUMMARY_BEGIN');
console.log(JSON.stringify(data));
console.log('COVERAGE_AB_SUMMARY_END');
if(problems.length)process.exitCode=1;
