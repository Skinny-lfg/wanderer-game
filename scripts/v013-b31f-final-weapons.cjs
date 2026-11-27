'use strict';
// B3.1F — independent confirmation of +50% item ATK and approved Staff candidate.
// No production changes. Reuse the validated B3.1D fixture and mana ledger.
const fs=require('node:fs'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const S=require('./simulate-progression.cjs'),A=require('./v013-b31a-twohand-budget.cjs'),B=require('./v013-b31b-twohand-compensation.cjs'),D=require('./v013-b31d-staff-economy.cjs'),P=require('./v013-b31d-physical-stack.cjs');
const BASE='93493e74f211646d8d44982aeef10b0ec1f0c46d',OUT='reports/b31f',PHYS_N=100,STAFF_N=100,SEED=102500001;
const SC=A.scenarios.filter(s=>['solo','group12','boss'].includes(s.id));
const specs={physical:P.specs,staff:D.specs};
const arm=(id,factor,spell,cost)=>({id,factor,spell,cost,loadout:[id,'Staff',null]});
const STAFF_ARMS=[arm('hit132-spell100-cost100',1.32,1,1),arm('hit160-spell200-cost75',1.6,2,.75),...D.ARMS.filter(a=>a.reference)];
const STAFF_BASE='hit132-spell100-cost100';
const mean=(a,f)=>a.length?a.reduce((n,x)=>n+f(x),0)/a.length:null;
function arms(kind,st){return kind==='staff'?STAFF_ARMS:P.arms(st).filter(a=>a.id==='approved'||a.id==='approved+atk125'||a.id==='approved+atk150'||a.reference);}
function cell(kind,st,sc,i,a,seedBase=SEED){return kind==='staff'?D.cell(st,sc,i,a,seedBase,true,null,true):P.cell(st,sc,i,a,seedBase);}
function pair(kind,st,sc,i,seedBase=SEED){
 const rows=arms(kind,st).map(a=>cell(kind,st,sc,i,a,seedBase)),b=rows[0];
 for(const r of rows){
  assert.equal(r.resolved,b.resolved);assert.equal(r.rosterHash,b.rosterHash);assert.equal(r.nonHands,b.nonHands);assert.deepEqual(r.nodes,b.nodes);
  assert.equal([r.won,r.died,r.timeout,r.surrendered].filter(Boolean).length,1);
  if(!r.reference){
   assert.equal(r.gearHash,b.gearHash);
   const other=kind==='staff'?D.otherStats:P.otherStats;assert.deepEqual(other(r.stats),other(b.stats));
   if(kind==='staff'){assert.equal(r.weaponSpell,b.weaponSpell);if(r.spell===1)assert.deepEqual(r.stats,b.stats);else assert(r.stats.spellPower>=b.stats.spellPower);}
   else if(r.atk===1)assert.deepEqual(r.stats,b.stats);else assert(r.stats.attack>=b.stats.attack);
  }
  if(kind==='staff')assert(r.abilityMetrics&&r.manaLedger);
 }
 return {seed:b.seed,rows};
}
function write(name,x){fs.mkdirSync(OUT,{recursive:true});fs.writeFileSync(OUT+'/'+name+'.json',JSON.stringify(x,null,2));}
function run(kind,si,ci){
 const st=specs[kind][si],sc=SC[ci],n=kind==='staff'?STAFF_N:PHYS_N;assert(st&&sc);
 const cases=Array.from({length:n},(_,i)=>pair(kind,st,sc,i));write(kind+'-'+si+'-'+ci,{kind,si,ci,study:st.id,scenario:sc.id,commit:process.env.GITHUB_SHA||null,native:S.sourceFingerprint().sha256,cases});
}
function metrics(kind,rows){
 const m=kind==='staff'?D.metrics(rows):B.metrics(rows);
 if(kind!=='staff')return m;
 const sec=rows.reduce((n,r)=>n+r.seconds,0),rate=f=>sec>0?rows.reduce((n,r)=>n+(Number(f(r))||0),0)/sec:null;
 const rates={};for(const group of ['decay','magic','graveBloom','defensive']){
  const keys=[...new Set(rows.flatMap(r=>Object.keys(r.abilityMetrics[group])))].sort();
  rates[group]=Object.fromEntries(keys.map(k=>[k,{perSecond:rate(r=>r.abilityMetrics[group][k]),observedRows:rows.filter(r=>Object.hasOwn(r.abilityMetrics[group],k)).length}]));
 }
 return {...m,mainHitsPerSec:rate(r=>r.mainHits),paidWeaponCastsPerSec:rate(r=>r.manaLedger.metrics.stage648ManaWeaponCasts),unfundedMainPerSec:rate(r=>r.unfunded),infusionActivationsPerSec:rate(r=>r.infusionActivations),infusionHitsPerSec:rate(r=>r.infusionHits),abilityMetricRates:rates};
}
function aggregate(kind){
 const xs=specs[kind].flatMap((st,si)=>SC.map((sc,ci)=>JSON.parse(fs.readFileSync(OUT+'/'+kind+'-'+si+'-'+ci+'.json','utf8'))));assert.equal(new Set(xs.map(x=>x.native)).size,1);const results=[],all=xs.flatMap(x=>x.cases.flatMap(c=>c.rows));
 const base=kind==='staff'?STAFF_BASE:'approved',n=kind==='staff'?STAFF_N:PHYS_N;
 for(const x of xs){const st=specs[kind][x.si],aa=arms(kind,st),ids=aa.map(a=>a.id),refs=aa.filter(a=>a.reference).map(a=>a.id);assert.equal(x.commit,process.env.GITHUB_SHA);assert.equal(x.cases.length,n);assert.equal(new Set(x.cases.map(c=>c.seed)).size,n);for(const c of x.cases)assert.deepEqual(c.rows.map(r=>r.id),ids);
  const by=Object.fromEntries(ids.map(id=>[id,{...metrics(kind,x.cases.map(c=>c.rows.find(r=>r.id===id))),paired:A.paired(x.cases,base,id),...(kind==='physical'?{vsAtk125:A.paired(x.cases,'approved+atk125',id)}:{}),vsReference:Object.fromEntries(refs.map(ref=>[ref,A.paired(x.cases,ref,id)]))}]));
  for(const a of Object.values(by))assert.equal(a.wins+a.deaths+a.surrenders+a.timeout,a.n);
  const row={study:x.study,scenario:x.scenario,arms:by,interaction:null};results.push(row);
  console.log('B31F_STUDY='+JSON.stringify({kind,study:x.study,scenario:x.scenario,arms:Object.fromEntries(Object.entries(by).map(([id,v])=>[id,{n:v.n,wins:v.wins,timeout:v.timeout,AP:v.AP,SP:v.SP,DPS:v.DPS,basePerMainHit:v.basePerMainHit,effectiveMainHit:v.effectiveMainHit,secondaryDPS:v.secondaryDPS,secondaryDotDPS:v.secondaryDotDPS,takenPerSec:v.takenPerSec,absorbedPerSec:v.absorbedPerSec,barrierPerSec:v.barrierPerSec,mana:v.mana,mainHitsPerSec:v.mainHitsPerSec,paidWeaponCastsPerSec:v.paidWeaponCastsPerSec,unfundedMainPerSec:v.unfundedMainPerSec,rotAppsPerSec:v.abilityMetricRates?.decay?.decayPrimaryPaidApplications?.perSecond,rotDamagePerSec:v.abilityMetricRates?.decay?.decayPrimaryPaidTotalRotDamage?.perSecond,cyclePerSec:v.abilityMetricRates?.decay?.corruptionCycleActivations?.perSecond,paired:v.paired,vsAtk125:v.vsAtk125,vsReference:v.vsReference}])),interaction:row.interaction}));
 }
 assert.equal(all.length,kind==='staff'?8400:14400);const summary={kind,baseline:BASE,commit:process.env.GITHUB_SHA,native:xs[0].native,fights:all.length,timeouts:all.filter(x=>x.timeout).length,surrenders:all.filter(x=>x.surrendered).length,results,scope:kind==='staff'?'100 fresh matched seeds; approved Staff candidate G vs native and full Wand controls; fixed legal E10 Rare builds.':'100 fresh matched seeds; approved physical versus +25% and +50% item ATK, and one-hand control. Fixed legal E10 Rare builds.'};write(kind+'-summary',summary);console.log('B31F_OVERVIEW='+JSON.stringify({...summary,results:undefined}));if(summary.timeouts)process.exitCode=1;
}
function smoke(kind){
 assert.equal(execFileSync('git',['diff','--name-only',BASE,'HEAD','--','combat','online','economy','index.html','docs/index.html','docs/combat','docs/online','docs/economy'],{encoding:'utf8'}).trim(),'','Production drift');
 assert.equal(STAFF_ARMS.length,4);assert.equal(new Set(STAFF_ARMS.map(a=>a.id)).size,4);
 for(const st of specs[kind]){
  const x=pair(kind,st,SC[0],0),y=pair(kind,st,SC[1],1);
  if(kind==='staff'){
   assert([x,y].some(c=>c.rows.find(r=>r.id==='hit160-spell200-cost75').stats.spellPower>c.rows[0].stats.spellPower));
   assert([x,y].some(c=>c.rows.find(r=>r.id==='hit160-spell200-cost75').directBase>0));
  }else {assert([x,y].some(c=>c.rows[1].stats.attack>c.rows[0].stats.attack));assert([x,y].some(c=>c.rows[2].stats.attack>c.rows[1].stats.attack));}
  // Existing B31D native and new observed native must have the same outcome.
  if(kind==='staff'){
   const old=D.cell(st,SC[0],0,D.ARMS[0],SEED),now=x.rows[0];
   for(const k of Object.keys(old))if(k!=='id')assert.deepEqual(now[k],old[k],'Native observer drift '+st.id+' '+k);
  }
 }
 console.log('B31F_SMOKE='+JSON.stringify({kind,profiles:specs[kind].length,productionDrift:false,fixtureMatched:true}));
}
if(require.main===module){const [cmd,kind,si,ci]=process.argv.slice(2);assert(Object.hasOwn(specs,kind));if(cmd==='smoke')smoke(kind);else if(cmd==='study')run(kind,Number(si),Number(ci));else if(cmd==='aggregate')aggregate(kind);else throw Error('Unknown command');}
