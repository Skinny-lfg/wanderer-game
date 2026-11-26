'use strict';
// E10-only stratified native combat study. 100 combat seeds per size and intended
// build; 2 independently earned E10 Camp snapshots if obtainable, otherwise 1.
// Snapshots are E1-born under a frozen pre-6.42 source to remove E2-E9 survival
// selection caused by enemy tuning. Current combat source is used for all replays.
// This file does NOT change gameplay stats, gear or TalentGraph.
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const PROFILES=Object.freeze([
 'balanced','hexblade-hybrid','leather-duelist','smart-blood-pure',
 'smart-blood-two-handed','smart-fury-bow','arcane-fire','arcane-lightning',
 'plate-warden','decay-blood-spread','arcane-decay-bloom'
]);
const EARNED_SEEDS=Object.freeze([9861,9863]);
const GROUP_SIZES=Object.freeze([4,8,12]);
const N=100, SHARDS=2, PER_SHARD=N/SHARDS;
const REALM='blood'; // same Affinity for every tested build
const BASELINE_REF='449940d08be86de09f7688f0e2a98d4497817b98';
function assert(x,msg){if(!x)throw Error(msg);}
function hash(data){return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');}
function write(out,object){fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(object,null,2)+'\n');}
function dotProfile(id){
 if(id==='decay-blood-spread')return {
  name:'Decay + Blood DoT Spread E10 Research',risk:0,
  targets:['corrupting_touch','bleeding_edge','plague_spread'],
  families:['decay','blood'],armor:'Leather',weapons:['Sword','Daggers'],
  style:'focused',healAt:.72,retreatAt:.46,target:'mechanics',shop:true,
  researchGearPreference:true
 };
 if(id==='arcane-decay-bloom')return {
  name:'Magic + Decay Grave Bloom E10 Research',risk:0,
  targets:['arcane_focus','corrupting_touch','hex_bolt','elemental_blight','grave_bloom'],
  families:['arcane','decay'],element:'arcane',armor:'Cloth',
  weapons:['Wand','Staff'],style:'focused',healAt:.72,retreatAt:.46,
  target:'mechanics',shop:true,researchGearPreference:true
 };
 return null;
}
function capture(profileId,baselineRoot,out){
 assert(PROFILES.includes(profileId),'Unknown build '+profileId);
 const Np=require(path.resolve(baselineRoot,'scripts/v013-natural-progression.cjs'));
 const D=require(path.resolve(baselineRoot,'scripts/v013-stage628-postcap-difficulty.cjs'));
 const E=require(path.resolve(baselineRoot,'scripts/v013-stage641-e10-consensus.cjs'));
 const source=require(path.resolve(baselineRoot,'scripts/simulate-progression.cjs')).sourceFingerprint().sha256;
 const profile=E.CALIBRATED_PROFILES[profileId]||dotProfile(profileId);
 assert(profile,'No baseline research profile '+profileId);
 const accounts=[];
 for(const seed of EARNED_SEEDS){
  let snap=null,acc;
  try{
   acc=Np.simulateAccount(seed,profileId,{
    ...Np.DEFAULTS,maxLevel:10,maxAttempts:24,maxTotalAttempts:240
   },{researchProfiles:{[profileId]:profile},decisionModel:'adaptive',onCamp:probe=>{
    if(probe.level===10&&probe.attempt===1){
     assert(!snap,'Repeated earned E10 Camp checkpoint');
     snap=D.checkpoint(probe,[10]);
    }
   }});
   const errors=acc.attempts.filter(x=>x.error&&x.error!=='Native combat timeout');
   if(errors.length)throw Error('Invalid native account: '+errors.map(x=>x.error).join('; '));
   accounts.push({seed,reachedE10:!!snap,attempts:acc.attempts.length,
    endLevel:acc.endLevel,stopReason:acc.stopReason,snapshot:snap});
  }catch(e){accounts.push({seed,reachedE10:false,error:String(e.stack||e).slice(0,1500),
   attempts:acc?.attempts?.length||0,snapshot:null});}
 }
 const result={stage:'6.42',phase:'capture',profileId,baselineRef:BASELINE_REF,
  baselineSource:source,accounts};
 write(out,result);
 console.log('E10_LARGE_CAPTURE='+JSON.stringify({profileId,source,
  obtained:accounts.filter(a=>a.snapshot).length,
  accounted:accounts.map(x=>({seed:x.seed,reached:x.reachedE10,endLevel:x.endLevel,
   error:x.error||null,points:x.snapshot?.talentSpent,weapon:x.snapshot?.state.equip.weapon?.subtype}))}));
 return result;
}
function replay(profileId,shard,snapFile,out){
 assert(PROFILES.includes(profileId),'Unknown build');
 assert(Number.isInteger(shard)&&shard>=0&&shard<SHARDS,'Invalid shard');
 const input=JSON.parse(fs.readFileSync(snapFile,'utf8'));
 assert(input.profileId===profileId&&input.phase==='capture'&&input.baselineRef===BASELINE_REF,'Wrong snapshot source');
 const snapshots=input.accounts.filter(x=>x.snapshot);
 const D=require('./v013-stage628-postcap-difficulty.cjs');
 const A=require('./v013-stage639-earned-aoe-comparison.cjs');
 const S=require('./simulate-progression.cjs');
 const source=S.sourceFingerprint().sha256;
 const rows=[],snapMeta=snapshots.map(x=>{
  const a=A.aoeState(x.snapshot);
  return {seed:x.seed,id:x.snapshot.fingerprint,earnedPoints:x.snapshot.talentSpent,
   weapon:a.weapon,element:a.element,aoePotential:a.aoePotential,
   prepared:x.snapshot.state.automaticTalents.prepared,
   talentNodes:x.snapshot.state.automaticTalents.nodes,
   gearPieces:x.snapshot.equipPieces};
 });
 for(let k=0;k<PER_SHARD&&snapshots.length;k++){
  const sampleIndex=shard*PER_SHARD+k;
  // Round-robin yields 50 encounters/snapshot/size when both earned states exist.
  const snap=snapshots[sampleIndex%snapshots.length];
  const seed=6430000+sampleIndex*101; // same seed across sizes and builds
  for(const size of GROUP_SIZES){
   const s={id:'normal-'+size,type:'normal',size,realm:REALM};
   const r=D.native(snap.snapshot,s,seed);
   assert(r.won||r.died||r.timedOut,'Native fight unresolved without timeout');
   const roster=r.roster||[];
   rows.push({sampleIndex,seed,naturalSeed:snap.seed,size,
    won:!!r.won,died:!!r.died,timedOut:!!r.timedOut,
    roles:r.initialRoles||{},rosterHp:roster.reduce((a,x)=>a+(x.maxHp||0),0),
    principalHp:roster.filter(x=>x.role!=='minion').reduce((a,x)=>a+(x.maxHp||0),0),
    principalAttack:roster.filter(x=>x.role!=='minion').reduce((a,x)=>a+(x.attack||0),0),
    damageTaken:r.damageTaken||0,damageDealt:r.damageDealt||0,
    secondaryDamage:r.secondaryTargetDamage||0,
    secondaryDotDamage:r.secondaryDotDamage||0,
    plagueTransfers:r.plagueSpreadTransfers||0,
    seconds:r.seconds||0});
  }
 }
 const result={stage:'6.42',phase:'replay',profileId,shard,baselineRef:BASELINE_REF,
  baselineSource:input.baselineSource,source,expectedPerSize:PER_SHARD,
  nEarnedSnapshots:snapshots.length,snapshots:snapMeta,
  failures:input.accounts.filter(x=>!x.snapshot).map(x=>({seed:x.seed,level:x.endLevel,
   reason:x.stopReason,error:x.error||null})),rows};
 write(out,result);
 console.log('E10_LARGE_SHARD='+JSON.stringify({profileId,shard,source,
  snapshots:snapMeta.map(x=>({seed:x.seed,weapon:x.weapon,aoe:x.aoePotential,
   points:x.earnedPoints})),rows:rows.length,
  groups:Object.fromEntries(GROUP_SIZES.map(size=>{
   const a=rows.filter(x=>x.size===size);
   return [size,{n:a.length,wins:a.filter(x=>x.won).length,
    timeout:a.filter(x=>x.timedOut).length,
    secondary:a.reduce((p,x)=>p+x.secondaryDamage,0)}];
  }))}));
 return result;
}
function wilson(w,n){
 if(!n)return {low:null,high:null};
 const z=1.96,p=w/n,z2=z*z,den=1+z2/n;
 const mid=(p+z2/(2*n))/den;
 const spread=z*Math.sqrt((p*(1-p)+z2/(4*n))/n)/den;
 return {low:Math.round((mid-spread)*1000)/10,
  high:Math.round((mid+spread)*1000)/10};
}
function aggregate(dir,out){
 const files=fs.readdirSync(dir).filter(x=>/^stage642-.*-shard-[01]\.json$/.test(x));
 const samples=files.map(x=>JSON.parse(fs.readFileSync(path.join(dir,x),'utf8')));
 const summary={stage:'6.42',source:null,baselineRef:BASELINE_REF,realm:REALM,
  samplesPerBuildAndSize:N,groupSizes:GROUP_SIZES,profiles:[],notes:[
   '100 independent combat RNG seeds, not 100 independent character builds.',
   '1–2 genuinely earned E10 checkpoints per intended build; the same state is replayed with different combat seeds.',
   'All builds face the same Blood-affinity enemy family and Risk 1 at E10.',
   'If no earned checkpoint exists, n=0 and no synthetic gear/talents are created.',
   'Timeouts are censored, excluded from win denominators but explicitly recorded.',
   'Intended build and measured AoE must be interpreted separately.',
   'Normal-room results are single first-ring fights, not Expedition win rates.'
  ]};
 for(const id of PROFILES){
  const shards=samples.filter(x=>x.profileId===id);
  assert(shards.length===SHARDS&&new Set(shards.map(x=>x.shard)).size===SHARDS,
   'Missing/duplicate shards for '+id);
  assert(shards.every(x=>x.baselineRef===BASELINE_REF),'Mixed baseline ref');
  assert(new Set(shards.map(x=>x.baselineSource)).size===1,'Mixed baseline source for '+id);
  assert(new Set(shards.map(x=>x.source)).size===1,'Mixed game source for '+id);
  if(summary.source===null)summary.source=shards[0].source;
  else assert(summary.source===shards[0].source,'Mixed current game source');
  const rows=shards.flatMap(x=>x.rows),snaps=shards[0].snapshots;
  assert(JSON.stringify(snaps)===JSON.stringify(shards[1].snapshots),'Snapshot drift '+id);
  const counts=new Set(GROUP_SIZES.map(size=>rows.filter(x=>x.size===size).length));
  assert(counts.size===1&&[0,N].includes([...counts][0]),'Incomplete 100-seed group '+id);
  const groups=GROUP_SIZES.map(size=>{
   const a=rows.filter(x=>x.size===size),resolved=a.filter(x=>x.won||x.died);
   const wins=resolved.filter(x=>x.won).length,n=resolved.length;
   const roleMeans=Object.fromEntries(['tank','caster','skirmisher','minion'].map(role=>
    [role,a.length?Math.round(a.reduce((sum,x)=>sum+(x.roles[role]||0),0)/a.length*10)/10:null]));
   return {size,attempted:a.length,resolved:n,wins,losses:resolved.filter(x=>x.died).length,
    timeouts:a.length-n,winPct:n?Math.round(wins/n*1000)/10:null,
    ci95:wilson(wins,n),averageRoles:roleMeans,
    meanPrincipalHp:a.length?Math.round(a.reduce((sum,x)=>sum+x.principalHp,0)/a.length):null,
    totalSecondaryDamage:a.reduce((sum,x)=>sum+x.secondaryDamage,0),
    totalSecondaryDotDamage:a.reduce((sum,x)=>sum+x.secondaryDotDamage,0),
    totalPlagueTransfers:a.reduce((sum,x)=>sum+x.plagueTransfers,0)};
  });
  summary.profiles.push({id,nEarnedSnapshots:snaps.length,snapshots:snaps,
   missing:shards[0].failures,groups});
 }
 write(out,summary);
 const csv=['profile,snapshots,group_size,attempted,resolved,wins,losses,timeouts,win_pct,ci_low,ci_high,avg_minions,secondary_damage'];
 for(const x of summary.profiles)for(const g of x.groups)csv.push([
  x.id,x.nEarnedSnapshots,g.size,g.attempted,g.resolved,g.wins,g.losses,g.timeouts,
  g.winPct??'',g.ci95.low??'',g.ci95.high??'',g.averageRoles.minion??'',g.totalSecondaryDamage
 ].join(','));
 fs.writeFileSync(out.replace(/\.json$/,'.csv'),csv.join('\n')+'\n');
 console.log('E10_LARGE_SUMMARY='+JSON.stringify({source:summary.source,
  profiles:summary.profiles.map(p=>({id:p.id,snapshots:p.nEarnedSnapshots,
   groups:p.groups.map(g=>({size:g.size,n:g.resolved,wins:g.wins,winPct:g.winPct,
    ci:g.ci95,timeouts:g.timeouts,avgMinions:g.averageRoles.minion}))}))}));
 return summary;
}
if(require.main===module){
 try{
  const [command,...args]=process.argv.slice(2);
  if(command==='capture'&&args.length===3)capture(...args);
  else if(command==='replay'&&args.length===4)replay(args[0],Number(args[1]),args[2],args[3]);
  else if(command==='aggregate'&&args.length===2)aggregate(...args);
  else throw Error('Usage: capture PROFILE BASELINE_ROOT OUT | replay PROFILE SHARD SNAPSHOT OUT | aggregate DIR OUT');
 }catch(e){console.error('E10_LARGE_ERROR '+String(e.stack||e));process.exitCode=1;}
}
module.exports={PROFILES,EARNED_SEEDS,GROUP_SIZES,N,SHARDS,REALM,BASELINE_REF,wilson,capture,replay,aggregate};
