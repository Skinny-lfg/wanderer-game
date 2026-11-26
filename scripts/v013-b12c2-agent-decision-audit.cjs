'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const B=require('./v013-b1-e10-rebaseline.cjs'),N=require('./v013-natural-progression.cjs'),A=require('./v013-b12c1-advanced-agent-audit.cjs'),S=require('./simulate-progression.cjs');
const selection=require('../reports/v013-b12c1-selection.json');
const C=globalThis.WandererV013Crafting,R=globalThis.WandererV012Runes;
const policy='b12c2-v1',out='reports/b12c2',two=new Set(['Two-Handed','Bow','Staff']);
const recipes=new Map(C.RECIPES.map(r=>[r.id,r]));
const totals=m=>Object.values(m||{}).reduce((a,b)=>a+b,0);
const ratio=(a,b)=>b?+(100*a/b).toFixed(2):null;
const sum=(rows,f)=>rows.reduce((n,r)=>n+f(r),0);
function profile(id){
 const p=B.naturalProfile(id);
 // Restore the explicit dual-dagger identity from Stage 6.48C.1.
 // Other offhand preferences remain as declared by the current profile.
 return {...p,strictResearchIdentity:true,agentDecisionQuality:policy,...(id==='smart-fury-daggers'?{offhands:['Daggers']}:{})};
}
function observe(ctx){
 const observation=A.campObservation(ctx),s=ctx.a.state(),v=ctx.a.vitals();
 const equipped=s.runeSlots.filter(Boolean).map(id=>s.runes.find(r=>r.id===id)).filter(Boolean);
 return {...observation,manaPotionOwned:s.consumables?.mana||0,rejuvenationOwned:s.consumables?.rejuvenation||0,mp:v.mp,maxmp:v.maxmp,
  manaRuneFamilies:equipped.filter(r=>['abyss','clarity','efficiency'].includes(r.family)).map(r=>r.family)};
}
function auditAccount(id,pick){
 const p=profile(id),a=N.simulateAccount(pick.seed,id,{...N.DEFAULTS,...A.config},{researchProfiles:{[id]:p},decisionModel:'adaptive',equipEarnedRunes:true,onCamp:observe});
 assert.equal(a.startXp,0);assert(a.initialGear.items.every(x=>x.startingGear));
 return {...a,historicalEndLevel:pick.historicalEndLevel,index:pick.index};
}
function additional(p,accounts){
 const valid=accounts.flatMap(a=>a.attempts.map(t=>({...t,seed:a.seed}))).filter(t=>t.before&&t.after);
 const result={violations:[],offhandCrafts:0,offhandCraftsEquipped:0,offhandCraftResources:{fragments:0,essence:0},crafts:0,craftsEquipped:0,developedManaCamp:0,manaPotionOwnedNotSelected:0,rejuvenationOwnedNotSelected:0,manaRuneCamp:0,declaredOffhands:p.offhands||[],offhandObserved:0,offhandMatched:0};
 for(const t of valid){
  const gear=t.before.gear.items,w=gear.find(x=>x.slot==='weapon'),off=gear.find(x=>x.slot==='offhand');
  if(two.has(w?.subtype)&&off)result.violations.push({seed:t.seed,level:t.level,attempt:t.attempt,reason:'native two-hand weapon with offhand'});
  for(const c of t.camp?.crafted||[]){
   result.crafts++;if(c.equipped)result.craftsEquipped++;
   if(c.slot==='offhand'){
    result.offhandCrafts++;if(c.equipped)result.offhandCraftsEquipped++;
    result.offhandCraftResources.fragments+=c.fragmentsSpent||0;result.offhandCraftResources.essence+=c.essenceSpent||0;
    if(two.has(c.weaponAtDecision)||p.weapons.every(x=>two.has(x)))result.violations.push({seed:t.seed,level:t.level,attempt:t.attempt,reason:'incompatible offhand craft',recipe:c.recipe});
   }
  }
  if(t.before.spent>=10){
   if(off){result.offhandObserved++;if(p.offhands?.includes(off.subtype==='Off-Hand Dagger'?'Daggers':off.subtype))result.offhandMatched++;}
   if(t.earnedProbe?.maxmp>0){
    result.developedManaCamp++;
    if(t.earnedProbe.manaPotionOwned>0&&!t.before.potionSelection.includes('mana'))result.manaPotionOwnedNotSelected++;
    if(t.earnedProbe.rejuvenationOwned>0&&!t.before.potionSelection.includes('rejuvenation'))result.rejuvenationOwnedNotSelected++;
    if(t.earnedProbe.manaRuneFamilies.length)result.manaRuneCamp++;
   }
  }
 }
 return result;
}
function run(shard){
 assert(Number.isInteger(shard)&&shard>=0&&shard<7);
 assert.deepEqual(selection.profiles.map(x=>x.id),B.NATURAL);
 const results=selection.profiles.slice(shard*4,shard*4+4).map(p=>{
  const accounts=p.picks.map(x=>auditAccount(p.id,x)),r=A.audit(p.id,accounts);
  return {...r,decision:additional(profile(p.id),accounts)};
 });
 fs.mkdirSync(out,{recursive:true});fs.writeFileSync(out+'/shard-'+shard+'.json',JSON.stringify({shard,commit:process.env.GITHUB_SHA||null,native:S.sourceFingerprint().sha256,policy,config:A.config,results},null,2));
 for(const r of results){const d=r.coverage.developed;console.log('B12C2_PROFILE='+JSON.stringify({id:r.id,accounts:r.accounts,errors:r.errors.length,issues:r.issues,decision:r.decision,developed:{attempts:d.attempts,fights:d.fights,weapon:d.weapon,armor:d.armor,offhand:d.offhand,mana:d.mana,stats:d.stats,economy:d.economy},e10:r.coverage.e10.accounts}));}
}
function compact(r){
 const d=r.coverage.developed,a=r.coverage.all,m=d.mana,e=d.economy;
 const twoHandIntent=r.intent.weapons.every(w=>two.has(w));
 const blocked=twoHandIntent?sum(Object.entries(a.economy.forgeCrafts),([id,n])=>recipes.get(id)?.slot==='offhand'?n:0):0;
 return {id:r.id,accounts:r.accounts.map(a=>({seed:a.seed,endLevel:a.endLevel})),errors:r.errors.length,issues:r.issues.length,developedAccounts:d.accounts,e10Accounts:r.coverage.e10.accounts,developedFights:d.fights,weaponMatched:d.weaponMatched,weaponObserved:d.weaponObserved,armorMatched:d.armorMatched,armorObserved:d.armorObserved,weaponMatchPct:ratio(d.weaponMatched,d.weaponObserved),armorMatchPct:ratio(d.armorMatched,d.armorObserved),blockedOffhandRecipeCrafts:blocked,forgeCrafts:totals(a.economy.forgeCrafts),developedMana:{...m,unfundedPct:ratio(m.unfundedCasterAttacks,m.fundedCasts+m.unfundedCasterAttacks)},developedStats:d.stats,developedEconomy:e,outcomes:a.outcomes,...(r.decision?{decision:r.decision}:{})};
}
function aggregate(){
 const shards=Array.from({length:7},(_,i)=>JSON.parse(fs.readFileSync(out+'/shard-'+i+'.json','utf8')));
 assert(shards.every((s,i)=>s.shard===i&&s.commit===shards[0].commit&&s.native===shards[0].native&&s.policy===policy&&JSON.stringify(s.config)===JSON.stringify(A.config)));
 const results=shards.flatMap(s=>s.results);assert.deepEqual(results.map(r=>r.id),B.NATURAL);assert(results.every(r=>r.accounts.length===2));
 const rows=results.map(compact),summary={profiles:rows.length,accounts:sum(rows,r=>r.accounts.length),errors:sum(rows,r=>r.errors),issues:sum(rows,r=>r.issues),incompatibleDecisions:sum(rows,r=>r.decision.violations.length),blockedOffhandRecipeCrafts:sum(rows,r=>r.blockedOffhandRecipeCrafts),e10Accounts:sum(rows,r=>r.e10Accounts),developedAccounts:sum(rows,r=>r.developedAccounts),weaponMatched:sum(rows,r=>r.weaponMatched),weaponObserved:sum(rows,r=>r.weaponObserved),armorMatched:sum(rows,r=>r.armorMatched),armorObserved:sum(rows,r=>r.armorObserved)};
 fs.writeFileSync(out+'/summary.json',JSON.stringify({commit:shards[0].commit,native:shards[0].native,policy,config:A.config,selection,summary,results},null,2));console.log('B12C2_OVERVIEW='+JSON.stringify(summary));
 if(summary.errors||summary.issues||summary.incompatibleDecisions||summary.blockedOffhandRecipeCrafts)process.exitCode=1;
}
function compare(){
 const baseline=JSON.parse(fs.readFileSync('baseline/summary.json','utf8')),candidate=JSON.parse(fs.readFileSync(out+'/summary.json','utf8'));
 assert.deepEqual(baseline.selection,selection);assert.deepEqual(candidate.selection,selection);assert.deepEqual(baseline.config,A.config);
 assert.deepEqual(baseline.results.map(r=>r.id),B.NATURAL);assert.deepEqual(candidate.results.map(r=>r.id),B.NATURAL);
 const rows=candidate.results.map((r,i)=>{
  const a=compact(baseline.results[i]),b=compact(r);
  assert.deepEqual(a.accounts.map(x=>x.seed),b.accounts.map(x=>x.seed));
  return {id:r.id,baseline:a,candidate:b,pairedEndLevel:b.accounts.map((x,j)=>({seed:x.seed,before:a.accounts[j].endLevel,after:x.endLevel,delta:x.endLevel-a.accounts[j].endLevel}))};
 });
 const totalsFor=k=>({e10Accounts:sum(rows,r=>r[k].e10Accounts),developedAccounts:sum(rows,r=>r[k].developedAccounts),blockedOffhandRecipeCrafts:sum(rows,r=>r[k].blockedOffhandRecipeCrafts),weaponMatchPct:ratio(sum(rows,r=>r[k].weaponMatched),sum(rows,r=>r[k].weaponObserved)),armorMatchPct:ratio(sum(rows,r=>r[k].armorMatched),sum(rows,r=>r[k].armorObserved)),errors:sum(rows,r=>r[k].errors),issues:sum(rows,r=>r[k].issues)});
 const pairs=rows.flatMap(r=>r.pairedEndLevel),summary={baseline:totalsFor('baseline'),candidate:totalsFor('candidate'),pairedProgression:{improved:pairs.filter(x=>x.delta>0).length,unchanged:pairs.filter(x=>x.delta===0).length,worse:pairs.filter(x=>x.delta<0).length}};
 fs.writeFileSync(out+'/comparison.json',JSON.stringify({baselineRun:45900893818,baselineCommit:'1cee030a8451ecaa93f507ca4d4c497f30f57b3f',candidateCommit:candidate.commit,scope:'same selected natural account seeds; routes and gear may diverge; no representative win-rate estimate',summary,rows},null,2));console.log('B12C2_COMPARISON='+JSON.stringify(summary));
 for(const r of rows)console.log('B12C2_PAIR='+JSON.stringify({id:r.id,endLevel:r.pairedEndLevel,blocked:[r.baseline.blockedOffhandRecipeCrafts,r.candidate.blockedOffhandRecipeCrafts],weapon:[r.baseline.weaponMatchPct,r.candidate.weaponMatchPct],armor:[r.baseline.armorMatchPct,r.candidate.armorMatchPct],mana:[r.baseline.developedMana.unfundedPct,r.candidate.developedMana.unfundedPct],stats:[r.baseline.developedStats,r.candidate.developedStats],decision:r.candidate.decision}));
}
if(require.main===module){const cmd=process.argv[2];if(cmd==='aggregate')aggregate();else if(cmd==='compare')compare();else run(Number(cmd));}
module.exports={profile,additional};
