'use strict';
// Stage 6.10 — read-only catalogue, pairwise design and native performance pilot.
// A planned scenario is NOT a legal earned-account build or a simulated fight.
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const S=require('./simulate-progression.cjs');
const P=require('./v013-build-planner.cjs');
require('../online/v013-enemy-roster.js');
const F=globalThis.WandererV013ExpeditionFoundation;
const G=globalThis.WandererTalentGraph;
const T=globalThis.WandererAutomaticTalents;
const R=globalThis.WandererV013EnemyRoster;
const B=globalThis.WandererV013BossAbilities;
const EA=globalThis.WandererV013EliteAbilities;
const sha=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
const uniq=xs=>[...new Set(xs)];
const sorted=xs=>uniq(xs).sort();
function catalogue(){
 const ids=new Set(T.NODES.map(n=>n.id));
 const paths=[];
 for(const family of G.FAMILIES){
  if(!Array.isArray(G.BASICS[family])||G.BASICS[family].length!==6||
     !Array.isArray(G.FOCUSED[family])||G.FOCUSED[family].length!==3)
   throw Error('Unexpected current TalentGraph lanes: '+family);
  for(let lane=0;lane<2;lane++)
   paths.push({id:'basic:'+family+':'+lane,kind:'basic',families:[family],
    milestoneIds:G.BASICS[family].slice(lane*3,lane*3+3)});
  paths.push({id:'focused:'+family,kind:'focused',families:[family],
   milestoneIds:[...G.FOCUSED[family]]});
 }
 for(const mixed of G.MIXED){
  if(mixed.length!==5)throw Error('Unexpected native Mixed path');
  paths.push({id:'mixed:'+mixed[0]+'+'+mixed[1],kind:'mixed',
   families:mixed.slice(0,2),milestoneIds:mixed.slice(2)});
 }
 for(const entry of paths)
  for(const id of entry.milestoneIds)if(!ids.has(id))
   throw Error('Structural path refers to missing live node '+id);
 const weapons=sorted(S.BUILDS.map(b=>b.weapon));
 const armor=sorted(Object.values(P.BUILDS).map(b=>b.armor).filter(Boolean));
 const affinities=[...F.AFFINITIES];
 const roles=[...R.ROLES];
 const bosses=Object.entries(B.PROFILES).map(([family,info])=>({family,id:info.id,name:info.name}));
 const elitesWithDedicatedAbility=Object.keys(EA.DEFINITIONS);
 const boons=F.CATALOG.boons.map(b=>b.id);
 if(paths.length!==24||weapons.length!==7||armor.length!==3||affinities.length!==6||
    roles.length!==4||bosses.length!==6)
  throw Error('Game catalog changed; review coverage dimensions before testing');
 return {sourceSha256:S.sourceFingerprint().sha256,version:'6.10',
  talentPaths:paths,liveTalentNodeCount:T.NODES.length,weapons,armor,
  affinities,roles,bosses,boons,difficulties:F.DIFFICULTIES.map(x=>x.id),
  elites:{withDedicatedAbility:elitesWithDedicatedAbility,completeRoster:false,
   note:'This list is NOT all live Elite types. Do not claim complete Elite coverage until the encounter spawn catalog is inventoried.'},
  caveats:['These are 24 structural routes, not all legal rank/point/respec combinations.',
   'Weapon and armor families are dimension labels, not earned item instances.',
   'A crossed row may be impossible for a particular point budget, seed or Expedition.',
   'No assumed Boon, potion, item, opponent or boss access counts as tested.']};
}
function dimensions(c=catalogue()){
 return {path:c.talentPaths.map(x=>x.id),weapon:c.weapons,armor:c.armor,
  realmAffinity:c.affinities,difficulty:c.difficulties,boonState:['none','present'],
  opponent:[...c.roles.map(x=>'role:'+x),...c.bosses.map(x=>'boss:'+x.family)]};
}
const pairKey=(a,va,b,vb)=>a+'='+va+'||'+b+'='+vb;
function allPairs(dims){
 const keys=Object.keys(dims),pairs=new Set();
 for(let i=0;i<keys.length;i++)for(let j=i+1;j<keys.length;j++)
  for(const a of dims[keys[i]])for(const b of dims[keys[j]])
   pairs.add(pairKey(keys[i],a,keys[j],b));
 return pairs;
}
function rowPairs(row,keys){
 const out=[];
 for(let i=0;i<keys.length;i++)for(let j=i+1;j<keys.length;j++)
  out.push(pairKey(keys[i],row[keys[i]],keys[j],row[keys[j]]));
 return out;
}
function pairwisePlan(dims=dimensions(),limit=5000){
 const keys=Object.keys(dims);
 for(const k of keys)if(!dims[k]?.length||new Set(dims[k]).size!==dims[k].length)
  throw Error('Invalid or duplicate dimension '+k);
 const pending=allPairs(dims),total=pending.size,rows=[];
 while(pending.size){
  if(rows.length>=limit)throw Error('Pairwise planning budget insufficient; '+pending.size+' pairs remain');
  const first=pending.values().next().value;
  const parts=first.split('||').map(x=>x.split('='));
  const row=Object.fromEntries(parts.map(x=>[x[0],x[1]]));
  for(const k of keys){
   if(Object.hasOwn(row,k))continue;
   let best=null,bestGain=-1;
   for(const v of dims[k]){
    let gain=0;
    for(const prev of keys){
     if(prev===k||!Object.hasOwn(row,prev))continue;
     const a=keys.indexOf(prev)<keys.indexOf(k)?[prev,row[prev],k,v]:[k,v,prev,row[prev]];
     if(pending.has(pairKey(...a)))gain++;
    }
    if(gain>bestGain){bestGain=gain;best=v;}
   }
   row[k]=best;
  }
  let removed=0;
  for(const p of rowPairs(row,keys))if(pending.delete(p))removed++;
  if(!removed)throw Error('Pairwise planner made no progress');
  rows.push(row);
 }
 return {algorithm:'deterministic pairwise candidate design; not native validation',
  dimensions:dims,totalPairs:total,coveredPairs:total,missingPairs:pending.size,
  candidateRows:rows.length,rows,warning:'Unrealized design only; native legality, earned gear, enemy access and point budgets must be verified before execution.'};
}
function earnedCoverage(shards,c=catalogue()){
 const known=new Set(),observed=[],source=new Set(),identity=new Set();
 for(const shard of shards){
  if(!shard?.result||shard.stage!=='6.9'||!shard.gameSourceSha256)
   throw Error('Expected exact native Stage 6.9 JSON shard');
  source.add(shard.gameSourceSha256);
  const r=shard.result;
  for(const [variant,v] of Object.entries(r.variants||{})){
   const key=r.level+':'+r.seed+':'+variant;
   if(identity.has(key))throw Error('Duplicate earned-account variant '+key);
   identity.add(key);
   if(!v||v.inputSha256!==r.initialFingerprint||v.historySha256!==r.historySha256||
      v.original?.gearSha256!==r.variants.baseline?.original?.gearSha256)
    throw Error('Unmatched earned-account input '+key);
   const trial=(r.nativeEncounterComparison||[]).find(x=>x.variant===variant);
   if(!trial||trial.sameFirstEncounter!==true)
    throw Error('First native encounter not matched '+key);
   const affinity=v.actual?.affinity,weapon=r.realWeapon;
   if(!c.affinities.includes(affinity)||!weapon)throw Error('Unknown source affinity or weapon');
   observed.push({level:r.level,seed:r.seed,variant,weapon,
    affinity,risk:v.actual.risk,firstEncounterType:v.actual.first?.type||null,
    won:!!v.actual.first?.won,
    armor:'unknown',boon:'unknown',eliteId:'unknown',bossId:'unknown',
    provenance:'real earned-account E1–E'+(r.level-1)+' replay, native matched opening'});
   known.add('weapon='+weapon+'|affinity='+affinity);
  }
 }
 if(source.size>1)throw Error('Different native source SHA across Stage 6.9 shards');
 const pairs=[];
 for(const weapon of c.weapons)for(const affinity of c.affinities)
  pairs.push({weapon,affinity,covered:known.has('weapon='+weapon+'|affinity='+affinity)});
 return {kind:'observed-earned-only',sourceSha256:[...source][0]||null,
  shards:shards.length,matchedFirstEncounters:observed.length,observations:observed,
  coverage:{weaponAffinity:{covered:pairs.filter(x=>x.covered).length,total:pairs.length,
   missing:pairs.filter(x=>!x.covered)}},
  excludedFromClaims:['24 path routes','armour type','each Elite and Boss',
   'Boon presence/absence','item rarity and affixes','full Expedition encounter parity'],
  note:'No observed data is promoted into full build/path coverage without actual native evidence.'};
}
function parse(args){
 const opts={mode:'inventory',out:'reports/v013-stage610.json',runs:2,
  seedStart:9901,inputs:[],resume:false};
 for(const arg of args){
  const m=/^--([a-z-]+)=(.*)$/.exec(arg);if(!m)throw Error('Invalid argument '+arg);
  if(m[1]==='mode'&&['inventory','plan','coverage','benchmark'].includes(m[2]))opts.mode=m[2];
  else if(m[1]==='out'&&m[2].endsWith('.json'))opts.out=m[2];
  else if(m[1]==='runs')opts.runs=Number(m[2]);
  else if(m[1]==='seed-start')opts.seedStart=Number(m[2]);
  else if(m[1]==='inputs')opts.inputs=m[2].split(',').filter(Boolean);
  else if(m[1]==='resume'&&['true','false'].includes(m[2]))opts.resume=m[2]==='true';
  else throw Error('Unknown argument '+arg);
 }
 if(!Number.isSafeInteger(opts.runs)||opts.runs<1||opts.runs>20)
  throw Error('Benchmark runs must be 1–20');
 if(!Number.isSafeInteger(opts.seedStart)||opts.seedStart<1||opts.seedStart>0xffffffff-opts.runs)
  throw Error('Invalid seed range');
 if(opts.mode==='coverage'&&!opts.inputs.length)throw Error('Coverage requires Stage 6.9 shard inputs');
 return opts;
}
function atomicWrite(dest,data){
 const file=path.resolve(dest);fs.mkdirSync(path.dirname(file),{recursive:true});
 const temp=file+'.tmp-'+process.pid;
 fs.writeFileSync(temp,JSON.stringify(data,null,2)+'\n');fs.renameSync(temp,file);
}
function nativeBenchmark(opts){
 // Sample complete real account starts; no setup(), artificial gear, XP or unlocks.
 const N=require('./v013-natural-progression.cjs');
 const profile='smart-blood-fury-radiance',sourceSha256=S.sourceFingerprint().sha256;
 const config=N.parseArgs(['--seeds='+opts.seedStart,'--profiles='+profile,
  '--max-level=1','--max-attempts=1','--max-total-attempts=1']);
 const report={stage:'6.10',kind:'native-e1-benchmark',sourceSha256,
  profile,seedStart:opts.seedStart,requested:opts.runs,completed:0,
  samples:[],totalMs:0,totalCombatRooms:0,combatRoomsPerSecond:null,
  warning:'E1 actual native attempts only. Not a 1-to-1 proxy for boss or E10 computational cost.'};
 if(opts.resume&&fs.existsSync(opts.out)){
  const prior=JSON.parse(fs.readFileSync(opts.out,'utf8'));
  if(prior.kind!==report.kind||prior.sourceSha256!==sourceSha256||
     prior.seedStart!==opts.seedStart||prior.requested!==opts.runs||
     prior.profile!==profile||!Array.isArray(prior.samples)||
     prior.samples.some((v,i)=>v.seed!==opts.seedStart+i||v.error))
   throw Error('Checkpoint mismatch; cannot resume');
  report.samples=prior.samples;report.completed=prior.samples.length;
 }
 for(let i=report.completed;i<opts.runs;i++){
  const seed=opts.seedStart+i,before=process.hrtime.bigint();
  const a=N.simulateAccount(seed,profile,config,{decisionModel:'adaptive'});
  const durationMs=Number(process.hrtime.bigint()-before)/1e6;
  const errors=a.attempts.filter(x=>x.error||x.status==='error');
  if(errors.length)throw Error('Native benchmark error seed '+seed+': '+JSON.stringify(errors));
  const combats=a.attempts.reduce((sum,t)=>sum+(t.rooms||[])
   .filter(r=>Number(r.initialEnemies)>0).length,0);
  if(combats<1)throw Error('Native run returned no measurable combat rooms seed '+seed);
  report.samples.push({seed,durationMs:Number(durationMs.toFixed(3)),combatRooms:combats,
   attempts:a.attempts.length,finalStatus:a.attempts.at(-1)?.status||null,
   heapUsedBytes:process.memoryUsage().heapUsed});
  report.completed++;
  report.totalMs=Number(report.samples.reduce((n,s)=>n+s.durationMs,0).toFixed(3));
  report.totalCombatRooms=report.samples.reduce((n,s)=>n+s.combatRooms,0);
  report.combatRoomsPerSecond=Number((1000*report.totalCombatRooms/report.totalMs).toFixed(3));
  atomicWrite(opts.out,report);
 }
 return report;
}
function markdown(r){
 const lines=['# Stage 6.10 — '+(r.kind||r.version),'',
  'Source: '+(r.sourceSha256||'not available'),'',];
 if(r.talentPaths)lines.push('Structural paths: '+r.talentPaths.length,
  'Weapons: '+r.weapons.join(', '),'Armour families: '+r.armor.join(', '),
  'Live Talent nodes: '+r.liveTalentNodeCount,'',
  'Elite catalogue complete: **no**. Do not claim every Elite is accounted for.','');
 if(r.candidateRows!==undefined)lines.push('Pairwise candidates: '+r.candidateRows,
  'Coverage of designed pairs: '+r.coveredPairs+'/'+r.totalPairs,
  '**No fights have been executed.**','');
 if(r.coverage)lines.push('Native matched first encounters: '+r.matchedFirstEncounters,
  'Weapon × Affinity covered: '+r.coverage.weaponAffinity.covered+'/'+r.coverage.weaponAffinity.total,
  '**Other axes are unknown, not zero-buff or assumed coverage.**','');
 if(r.samples)lines.push('Completed native E1 samples: '+r.completed+'/'+r.requested,
  'Measured combat rooms: '+r.totalCombatRooms,
  'Measured combat rooms/s (including Camp, movement, decisions): '+r.combatRoomsPerSecond,
  'Do not extrapolate this directly to E10 or Boss fights.','');
 return lines.join('\n')+'\n';
}
function main(args=process.argv.slice(2)){
 const opts=parse(args);
 let out;
 if(opts.mode==='inventory')out=catalogue();
 if(opts.mode==='plan')out={stage:'6.10',sourceSha256:catalogue().sourceSha256,...pairwisePlan()};
 if(opts.mode==='coverage')out={stage:'6.10',...earnedCoverage(opts.inputs.map(file=>
  JSON.parse(fs.readFileSync(file,'utf8'))))};
 if(opts.mode==='benchmark')out=nativeBenchmark(opts);
 atomicWrite(opts.out,out);
 fs.writeFileSync(opts.out.replace(/\.json$/,'.md'),markdown(out));
 console.log('STAGE610='+JSON.stringify({mode:opts.mode,out:opts.out,
  sourceSha256:out.sourceSha256,paths:out.talentPaths?.length,
  plannedRows:out.candidateRows,completed:out.completed,
  observed:out.matchedFirstEncounters}));
 return out;
}
if(require.main===module)main();
module.exports={catalogue,dimensions,allPairs,pairwisePlan,earnedCoverage,
 parse,nativeBenchmark,main};
