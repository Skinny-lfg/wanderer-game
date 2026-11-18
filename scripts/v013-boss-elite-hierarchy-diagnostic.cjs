'use strict';
// Diagnostic ONLY: no game logic changes. Compare Boss vs Elite in controlled
// native E1 combat at equal selected Affinity, account build, gear and seed.
// This is not a natural expedition win-rate estimate (no route attrition).
const fs=require('node:fs'),path=require('node:path');
const S=require('./simulate-progression.cjs');
const FAMILIES={
 blood:'blood-fury',
 decay:'blood-decay',
 vitality:'aegis-vitality',
 aegis:'aegis-sword',
 fury:'fury-bow',
 magic:'magic-decay'
};
const runs=[],failures=[];
const seedStart=Number(process.argv[2]||10510),seedCount=Number(process.argv[3]||8);
if(!Number.isSafeInteger(seedStart)||!Number.isSafeInteger(seedCount)||seedCount<1||seedCount>20)throw Error('bad args');
function mean(items,k){return items.length?+(items.reduce((s,v)=>s+(Number(v[k])||0),0)/items.length).toFixed(2):null;}
for(const rarity of ['Common','Rare']){
 for(const [family,buildId] of Object.entries(FAMILIES)){
  const build=S.BUILDS.find(x=>x.id===buildId);
  for(let i=0;i<seedCount;i++){
   const seed=seedStart+i;
   const opts={...S.DEFAULTS,mode:'bosses',levels:[1],seeds:[seed],builds:[buildId],
    points:0,rarity,gear:'current',runes:false,tickLimit:4500,targetPolicy:'focus'};
   try{
    const boss=S.encounter(1,build,seed,'boss',opts,undefined,undefined,family);
    const elite=S.encounter(1,build,seed,'elite',opts,undefined,undefined,family);
    if(boss.error||elite.error||boss.resolvedSeed!==elite.resolvedSeed||boss.affinity!==elite.affinity||boss.risk!==elite.risk){
     throw Error('paired controlled native encounters differ in seed/realm/risk or failed to run: '+JSON.stringify({boss:{error:boss.error,seed:boss.resolvedSeed,family:boss.affinity,risk:boss.risk},elite:{error:elite.error,seed:elite.resolvedSeed,family:elite.affinity,risk:elite.risk}}));
    }
    runs.push({seed,rarity,buildId,family,selectedRisk:boss.risk,resolvedSeed:boss.resolvedSeed,boss,elite});
   }catch(e){failures.push({seed,rarity,family,error:String(e.stack||e)})}
  }
 }
}
const cells=[];
for(const rarity of ['Common','Rare'])for(const family of Object.keys(FAMILIES)){
 const p=runs.filter(x=>x.rarity===rarity&&x.family===family);
 const sum=(key)=>p.reduce((a,x)=>a+(x[key].won?1:0),0);
 cells.push({rarity,family,pairs:p.length,bossWins:sum('boss'),eliteWins:sum('elite'),
  bossDamageTaken:mean(p.map(x=>x.boss),'damageTaken'),
  eliteDamageTaken:mean(p.map(x=>x.elite),'damageTaken'),
  bossSeconds:mean(p.map(x=>x.boss),'seconds'),eliteSeconds:mean(p.map(x=>x.elite),'seconds'),
  bossAbilityCasts:mean(p.map(x=>x.boss),'enemyAbilityCasts'),
  eliteAbilityCasts:mean(p.map(x=>x.elite),'enemyAbilityCasts'),
  bossSummons:mean(p.map(x=>x.boss),'bossSummons'),
  eliteSummons:mean(p.map(x=>x.elite),'eliteSummons'),
  uniqueEliteTypes:[...new Set(p.map(x=>x.elite.eliteType))]});
}
const overall=['Common','Rare'].map(rarity=>{
 const p=runs.filter(x=>x.rarity===rarity);
 return {rarity,pairs:p.length,bossWins:p.filter(x=>x.boss.won).length,eliteWins:p.filter(x=>x.elite.won).length,
  bossDamageTaken:mean(p.map(x=>x.boss),'damageTaken'),eliteDamageTaken:mean(p.map(x=>x.elite),'damageTaken'),
  bossSeconds:mean(p.map(x=>x.boss),'seconds'),eliteSeconds:mean(p.map(x=>x.elite),'seconds')}
});
const out={scope:'Stage 9.5 hierarchy check, current integration branch',method:'Native controlled first-room Boss vs Elite injection, 6 affinity-specific bosses, zero synthetic talents, same controlled gear and resolved seed within each pair; no pre-boss route attrition.',seedStart,seedCount,overall,cells,failures,runs};
const file=path.resolve('reports/v013-stage95-boss-vs-elite-hierarchy.json');fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(out,null,2)+'\n');
const lines=['# Stage 9.5 — Are Bosses truly above Elites?','',
'**Controlled encounters only, not natural Expedition boss win rates.** Both fights use the native engine, same Affinity, player gear, zero synthetic talent points and matched resolved seed. Boss fights include their native affinities, escorts and active mechanisms; the selected first-room is a diagnostic injection.','',
'| Gear | Pairs | Boss wins | Elite wins | Boss dmg to player | Elite dmg to player | Boss fight seconds | Elite fight seconds |',
'|---|---:|---:|---:|---:|---:|---:|---:|',
...overall.map(o=>'| '+o.rarity+' | '+o.pairs+' | '+o.bossWins+' | '+o.eliteWins+' | '+o.bossDamageTaken+' | '+o.eliteDamageTaken+' | '+o.bossSeconds+' | '+o.eliteSeconds+' |'),'',
'## Boss Affinity breakdown','',
'| Gear | Affinity | Pairs | Boss wins | Elite wins | Boss dmg | Elite dmg | Boss time | Elite time |',
'|---|---|---:|---:|---:|---:|---:|---:|',
...cells.map(o=>'| '+o.rarity+' | '+o.family+' | '+o.pairs+' | '+o.bossWins+' | '+o.eliteWins+' | '+o.bossDamageTaken+' | '+o.eliteDamageTaken+' | '+o.bossSeconds+' | '+o.eliteSeconds+' |'),
'','**Limitations:** these are short, seeded scenarios, not independent natural Expedition paths; Boss combat includes native escorts and abilities, while Elite spawn does not automatically gain normal mob ability traits. Damage to player is bounded by current hero HP. Individual archetypes and gear can invert mean rankings.','Errors: '+failures.length,''];
fs.writeFileSync(file.replace(/\.json$/,'.md'),lines.join('\n'));
console.log('HIERARCHY='+JSON.stringify({overall,cells,failures:failures.slice(0,2)}));
if(failures.length||runs.length<seedCount*6*2)process.exitCode=1;
