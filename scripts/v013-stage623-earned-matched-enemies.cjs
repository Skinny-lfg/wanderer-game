'use strict';
// Stage 6.23 — genuine E1-earned account checkpoints replayed against native
// solo Tanks, ALL eight named Elites and unprepared Affinity Boss, same hero
// state/seed/Realm/Risk/Condition; NO game balance or earned account changes.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const N=require('./v013-natural-progression.cjs');
const S=require('./simulate-progression.cjs');
const E=require('./v013-stage619-elite-balance.cjs');
const ROOT=path.resolve(__dirname,'..');
const FAMILIES=Object.freeze(['blood','decay','vitality','aegis','fury','magic']);
const ELITES=[...E.IDS];
const hash=v=>crypto.createHash('sha256').update(typeof v==='string'?v:JSON.stringify(v)).digest('hex');
const pct=(n,d)=>d?Number((n*100/d).toFixed(1)):null;
const median=arr=>{const v=arr.filter(Number.isFinite).sort((a,b)=>a-b);return v.length?v.length%2?v[(v.length-1)/2]:(v[v.length/2-1]+v[v.length/2])/2:null;};
function safePath(v){if(typeof v!=='string'||!v.startsWith('reports/')||!v.endsWith('.json')||v.includes('..'))throw Error('Unsafe Stage 6.23 report path');return v;}
function parse(argv=[]){
 const opts={mode:'cohort',seeds:'9701',profiles:'cautious,balanced,smart-blood-fury-vitality',
  maxAttempts:12,maxTotalAttempts:60,trials:1,
  out:'reports/v013-stage623-seed9701.json',inputs:null};
 for(const arg of argv){
  const m=/^--([a-z-]+)=(.+)$/.exec(arg);if(!m)throw Error('Stage 6.23 expects --name=value: '+arg);
  const [,key,val]=m;
  if(key==='mode')opts.mode=val;
  else if(key==='seeds')opts.seeds=val;
  else if(key==='profiles')opts.profiles=val;
  else if(key==='max-attempts')opts.maxAttempts=Number(val);
  else if(key==='max-total-attempts')opts.maxTotalAttempts=Number(val);
  else if(key==='trials')opts.trials=Number(val);
  else if(key==='out')opts.out=val;
  else if(key==='inputs')opts.inputs=val;
  else throw Error('Unsupported Stage 6.23 option '+key);
 }
 safePath(opts.out);
 if(!['cohort','aggregate'].includes(opts.mode))throw Error('Invalid Stage 6.23 mode');
 if(opts.mode==='aggregate'){
  if(!opts.inputs||!opts.inputs.startsWith('reports/')||opts.inputs.includes('..'))throw Error('Invalid shard directory');
  return opts;
 }
 if(!Number.isInteger(opts.trials)||opts.trials<1||opts.trials>2||
  !Number.isInteger(opts.maxAttempts)||opts.maxAttempts<1||opts.maxAttempts>12||
  !Number.isInteger(opts.maxTotalAttempts)||opts.maxTotalAttempts<1||opts.maxTotalAttempts>60)
  throw Error('Invalid bounded Stage 6.23 natural cohort');
 const native=N.parseArgs(['--seeds='+opts.seeds,'--profiles='+opts.profiles,
  '--max-level=5','--max-attempts='+opts.maxAttempts,
  '--max-total-attempts='+opts.maxTotalAttempts,'--out='+opts.out]);
 if(native.seeds.length*native.profiles.length>3)throw Error('One Stage 6.23 shard has at most 3 accounts');
 return {...opts,native};
}
function checkpoint({a,seed,profile,level,attempt}){
 if(![4,5].includes(level)||attempt!==1)return null;
 const s=a.state(),g=a.controller().state,p=s.automaticTalents;
 if(g.unlocked<level||!a.talents.valid(p))throw Error('Checkpoint not naturally earned');
 const state={level,unlocked:g.unlocked,
  equip:JSON.parse(JSON.stringify(s.equip)),
  automaticTalents:JSON.parse(JSON.stringify(p)),
  runes:JSON.parse(JSON.stringify(s.runes||[])),
  runeSlots:JSON.parse(JSON.stringify(s.runeSlots||[]))};
 const equip=Object.values(state.equip).filter(Boolean);
 if(!equip.length||!state.equip.weapon||
  equip.some(x=>!x.id||!x.slot||!x.rarity)||
  state.runeSlots.some(id=>!state.runes.some(r=>r.id===id)))
  throw Error('Invalid actual earned equipment or equipped runes');
 return {seed,profileId:profile.variantId||null,level,attempt,state,
  talentsEarned:a.talents.earned(p),equipmentPieces:equip.length,
  remainingStarter:equip.filter(x=>x.startingGear).length,
  nativeCampDigest:hash({state}),gearFingerprint:hash(state.equip),
  initialWeapon:state.equip.weapon.subtype};
}
function collect(seed,profiles=['cautious','balanced','smart-blood-fury-vitality'],attempts=12,total=60){
 const found=new Map();
 const cfg=N.parseArgs(['--seeds='+seed,'--profiles='+profiles.join(','),
   '--max-level=5','--max-attempts='+attempts,
   '--max-total-attempts='+total]);
 const natural=N.run(cfg,{onCamp:probe=>{
   const snap=checkpoint(probe);
   if(snap){
    const key=probe.seed+'|'+probe.profile.plan+'|'+probe.level+'|'+probe.attempt;
    // Profile aliases/plan IDs are never used as a match key.
    found.set(probe.seed+'|'+probe.level+'|'+probe.attempt+'|'+(probe.profile.name||''),snap);
   }
 }});
 if(natural.coverage.errors)throw Error('Natural-account progression had engine errors');
 const snapshots=[];
 for(const ac of natural.accounts){
  if(!ac.attempts.every(a=>!a.error))throw Error('Native account attempt failed');
  for(const level of [4,5]){
   const first=ac.attempts.find(a=>a.level===level&&a.attempt===1);
   if(!first)continue; // E not reached: censored, NEVER synthetic.
   const key=ac.seed+'|'+level+'|1|'+(N.PROFILES[ac.profile]?.name||'');
   const snap=found.get(key);
   if(!snap)throw Error('Missing checkpoint for naturally reached E'+level+'/'+ac.profile);
   if(first.before?.unlocked!==level||
      first.before?.xp!==snap.state.automaticTalents.xp||
      first.before?.earned!==snap.talentsEarned||
      first.before?.gear?.total!==snap.equipmentPieces||
      JSON.stringify(first.before?.talentNodes)!==JSON.stringify(snap.state.automaticTalents.nodes))
     throw Error('Checkpoint drift relative to native account attempt at E'+level);
   snapshots.push({...snap,profile:ac.profile,
    sourceTrialRealm:first.affinity,sourceTrialRisk:first.risk,
    sourceTrialStatus:first.status,checkpointKey:ac.seed+'|'+ac.profile+'|E'+level});
  }
 }
 if(new Set(snapshots.map(s=>s.checkpointKey)).size!==snapshots.length)
  throw Error('Duplicate earned E4/E5 Camp checkpoints');
 return {source:natural.source,
  coverage:{accounts:natural.accounts.length,
   reachedE4:natural.accounts.filter(a=>a.reached.includes(4)).length,
   reachedE5:natural.accounts.filter(a=>a.reached.includes(5)).length,
   reachedE4Snapshots:snapshots.filter(s=>s.level===4).length,
   reachedE5Snapshots:snapshots.filter(s=>s.level===5).length,
   attempts:natural.coverage.attempts,errors:natural.coverage.errors},
  accounts:natural.accounts.map(a=>({seed:a.seed,profile:a.profile,reached:a.reached,
   endLevel:a.endLevel,stopReason:a.stopReason,
   attempts:a.attempts.length,
   naturalE4E5:a.attempts.filter(x=>[4,5].includes(x.level)).map(x=>({
    level:x.level,attempt:x.attempt,status:x.status,affinity:x.affinity,bossReached:x.bossReached,bossWon:x.bossWon}))})),
  snapshots};
}
function model(snap){
 const p=snap.state.automaticTalents,weapon=snap.initialWeapon;
 const ids=p.nodes.filter(n=>n.startsWith('affinity_')).map(n=>n.slice(9));
 return {id:'earned-'+snap.checkpointKey,weapon,
  families:ids.length?ids:['blood'],skills:[]};
}
function options(snap,kind,eliteType=null){
 return {mode:kind==='boss'?'bosses':'encounter',
  points:snap.talentsEarned,gear:'current',rarity:'Common',runes:false,
  contracts:'none',targetPolicy:'mechanics',measure:true,tickLimit:4500,
  lockScenarioStreams:true,
  controlledTalents:snap.state.automaticTalents,
  earnedCheckpoint:snap.state,
  ...(eliteType?{stage619EliteType:eliteType}:{})};
}
function duel(snap,kind,seed,eliteType=null){
 const row=S.encounter(snap.level,model(snap),seed,kind,
  options(snap,kind,eliteType),undefined,undefined,undefined,1,
  kind==='normal'?1:undefined);
 if(!row||row.timedOut||(!row.won&&!row.died)||
  row.level!==snap.level||row.risk!==1||
  !FAMILIES.includes(row.affinity)||row.hpMax<=0||
  row.pointsBudget!==snap.talentsEarned||
  row.pointsSpent!==snap.state.automaticTalents.nodes.length||
  JSON.stringify(row.controlledTalentNodes)!==JSON.stringify(snap.state.automaticTalents.nodes)||
  row.offhandType!==(snap.state.equip.offhand?.subtype||null)||
  row.nativeEncounter!==kind||!row.gearFingerprint||!row.roster?.length)
  throw Error('Native earned matched fight integrity failed '+snap.checkpointKey+' '+kind);
 if(kind==='elite'&&row.eliteType!==eliteType)throw Error('Named Elite was not native '+eliteType);
 if(kind==='normal'&&(row.initialEnemies!==1||row.roster[0]?.role!=='tank'||
  row.initialRoles?.tank!==1))return null;
 return row;
}
function short(row){
 return {kind:row.nativeEncounter,win:!!row.won,died:!!row.died,
  hpMax:row.hpMax,hpStart:row.hpStart,hpEnd:row.hpEnd,
  mpMax:row.mpMax,mpStart:row.mpStart,
  damageTaken:row.damageTaken,seconds:row.seconds,
  initialRosterHp:row.roster.reduce((n,e)=>n+e.maxHp,0),
  initialRosterAtk:row.roster.reduce((n,e)=>n+e.attack,0),
  roster:row.roster,eliteType:row.eliteType,bossName:row.bossName,
  bossId:row.bossId,bossModifierIds:row.bossModifierIds,
  bossSummons:row.bossSummons,bossHealing:row.bossHealing,
  eliteSummons:row.eliteSummons,enemyAbilityCasts:row.enemyAbilityCasts,
  gearFingerprint:row.gearFingerprint,
  otherGearFingerprint:row.otherGearFingerprint,
  resolvedSeed:row.resolvedSeed,seedShift:row.seedShift,
  affinity:row.affinity,risk:row.risk,conditionId:row.plannedConditionId,
  traitId:row.traitId,initialRoles:row.initialRoles,
  talentNodes:row.controlledTalentNodes,talentMode:row.controlledTalentMode,
  offhandType:row.offhandType,offhandTrait:row.offhandTrait,
  targetPolicy:row.targetPolicy};
}
function verify(snap,normal,elite,boss){
 const values=[normal,elite,boss],n=normal;
 const checks={
  sameEarnedEquipment:values.every(x=>x.gearFingerprint===n.gearFingerprint),
  sameOffhandAndTrait:values.every(x=>x.offhandType===n.offhandType&&x.offhandTrait===n.offhandTrait),
  sameTalentAllocation:values.every(x=>JSON.stringify(x.talentNodes)===JSON.stringify(n.talentNodes)),
  sameElement:values.every(x=>x.talentMode===n.talentMode),
  sameRealScenarioSeed:values.every(x=>x.resolvedSeed===n.resolvedSeed&&x.seedShift===n.seedShift),
  sameNativeRealmAndRisk:values.every(x=>x.affinity===n.affinity&&x.risk===n.risk),
  sameCondition:values.every(x=>x.conditionId===n.conditionId),
  samePlayerFullHpMp:values.every(x=>x.hpMax===n.hpMax&&x.hpStart===n.hpStart&&
    x.mpMax===n.mpMax&&x.mpStart===n.mpStart),
  correctNativeRoles:n.initialRoles.tank===1&&elite.initialRoles.elite===1&&boss.initialRoles.boss===1,
  sameTargetPolicy:values.every(x=>x.targetPolicy==='mechanics')
 };
 const fail=Object.entries(checks).filter(([,ok])=>!ok).map(([key])=>key);
 if(fail.length)throw Error('Unmatched earned hero/realm: '+fail.join(', '));
 return checks;
}
function series(snap,trial=0,maxScan=32){
 const base=6230011+(snap.seed*997)+(snap.level*359)+
  ['cautious','balanced','smart-blood-fury-vitality'].indexOf(snap.profile)*7333+
  trial*30001;
 if(!Number.isSafeInteger(base)||base<1)throw Error('Invalid Stage 6.23 seed base');
 let solo=null,seed=null,scanned=0;
 for(let i=0;i<maxScan;i++){
  scanned++;
  const candidate=base+i*101;
  const result=duel(snap,'normal',candidate);
  if(result){solo=result;seed=candidate;break;}
 }
 if(!solo)throw Error('No real native solo Tank found in '+maxScan+' seeded Dungeon cards for '+snap.checkpointKey);
 const boss=duel(snap,'boss',seed);
 const elites=Object.fromEntries(ELITES.map(id=>[id,duel(snap,'elite',seed,id)]));
 const native={tank:short(solo),boss:short(boss),
  elites:Object.fromEntries(ELITES.map(id=>[id,short(elites[id])]))};
 const checks=Object.fromEntries(ELITES.map(id=>[id,verify(snap,native.tank,native.elites[id],native.boss)]));
 return {id:snap.checkpointKey+'-trial'+trial,
  checkpointKey:snap.checkpointKey,seed:snap.seed,profile:snap.profile,level:snap.level,
  trial,arenaSeed:seed,scannedTankCandidates:scanned,
  nativeRealm:native.tank.affinity,nativeRisk:native.tank.risk,
  sourceTrialRealm:snap.sourceTrialRealm,sourceTrialRisk:snap.sourceTrialRisk,
  equipmentDigest:snap.gearFingerprint,earnedStateDigest:snap.nativeCampDigest,
  spentTalents:snap.state.automaticTalents.nodes.length,
  totalEarnedPoints:snap.talentsEarned,weapon:snap.initialWeapon,
  acquiredEquipmentCount:snap.equipmentPieces,
  remainingStarterEquipment:snap.remainingStarter,
  samePlayerAndRealm:true,checks,native,
  inversions:{tankLosesBossWins:!solo.won&&boss.won,
   tankLosesAnyEliteWins:!solo.won&&ELITES.some(id=>elites[id].won),
   bossBeatenEliteLost:ELITES.filter(id=>!elites[id].won&&boss.won),
   eliteBeatenBossLost:ELITES.filter(id=>elites[id].won&&!boss.won),
   tankBeatenEliteLost:ELITES.filter(id=>solo.won&&!elites[id].won)}
 };
}
function summarize(result){
 const rows=result.series||[],levelStats=[4,5].map(level=>{
  const pairs=rows.filter(x=>x.level===level),tanks=pairs.map(x=>x.native.tank),
   bosses=pairs.map(x=>x.native.boss),
   elites=ELITES.flatMap(id=>pairs.map(p=>({id,arm:p.native.elites[id],pair:p})));
  return {level,earnedCheckpoints:new Set(pairs.map(x=>x.checkpointKey)).size,
   nativeSeries:pairs.length,nativeFights:pairs.length*(2+ELITES.length),
   bossWins:bosses.filter(x=>x.win).length,bossWinPct:pct(bosses.filter(x=>x.win).length,bosses.length),
   tankWins:tanks.filter(x=>x.win).length,tankWinPct:pct(tanks.filter(x=>x.win).length,tanks.length),
   eliteWins:elites.filter(x=>x.arm.win).length,eliteWinPct:pct(elites.filter(x=>x.arm.win).length,elites.length),
   tankDamageMedian:median(tanks.map(x=>x.damageTaken)),
   bossDamageMedian:median(bosses.map(x=>x.damageTaken)),
   eliteDamageMedian:median(elites.map(x=>x.arm.damageTaken)),
   eliteBossInversions:elites.filter(x=>x.arm.win&&!x.pair.native.boss.win).length,
   bossEliteInversions:elites.filter(x=>!x.arm.win&&x.pair.native.boss.win).length,
   eliteById:Object.fromEntries(ELITES.map(id=>{
    const vals=pairs.map(x=>({elite:x.native.elites[id],boss:x.native.boss,tank:x.native.tank}));
    return [id,{n:vals.length,eliteWins:vals.filter(v=>v.elite.win).length,
      winPct:pct(vals.filter(v=>v.elite.win).length,vals.length),
      tankBeatenEliteLost:vals.filter(v=>v.tank.win&&!v.elite.win).length,
      bossBeatenEliteLost:vals.filter(v=>v.boss.win&&!v.elite.win).length,
      eliteBeatenBossLost:vals.filter(v=>v.elite.win&&!v.boss.win).length,
      damageMedian:median(vals.map(v=>v.elite.damageTaken))}];
   })),
   bossByAffinity:Object.fromEntries(FAMILIES.map(f=>[f,{entries:bosses.filter((b,i)=>pairs[i].nativeRealm===f).length,
    wins:bosses.filter((b,i)=>pairs[i].nativeRealm===f&&b.win).length}])),
   nativeArmor:Array.from(new Set(pairs.map(x=>x.weapon))).sort()};
 });
 return {...result,summary:{coverage:{...result.coverage,
    actualNativeFights:rows.length*(2+ELITES.length),
    matchedScenarios:rows.length,allChecksPassed:rows.every(x=>x.samePlayerAndRealm&&
     Object.values(x.checks).every(group=>Object.values(group).every(Boolean))),
    elapsedNativeScenarioSeeds:rows.map(x=>x.arenaSeed),
    level4:levelStats[0],level5:levelStats[1]},
  cautions:[
   'All gear, runes, XP and Talents come from naturally progressed E1 accounts, but isolated Boss/Elite/Tank rooms are deliberately staged for causal enemy-class comparison',
   'Each scenario starts at fresh full HP/MP and uses no earned Boons/potions or elite/reliquary preparation; not representative naturally prepared Boss win rates',
   'One Boss fight is paired to each of eight Elites; do NOT count the same Boss outcome eight times as independent Boss fights',
   'Forced named Elite identity is diagnostic only and native ability engine remains unchanged; solo Tank is selected by observing and filtering naturally rolled native single-mob rooms',
   'The native Realm/Risk/Condition are matched within a scenario, but do not necessarily equal the first naturally played Expedition for that earned account',
   'Repeated scenarios from same source seed/profiles are correlated; aggregate rates are conditional on E4/E5 reach and are NOT human player success probabilities',
   'Tiny per-Boss and per-Elite denominators prevent definitive individual-stat buffs/nerfs. No gameplay changes in this Stage'
  ]};
}
function aggregate(shards){
 if(!shards.length)throw Error('Stage 6.23 aggregate has no completed shards');
 const sources=[...new Set(shards.map(x=>x.source))];
 if(sources.length!==1||!sources[0])throw Error('Stage 6.23 native source fingerprint drift');
 const keys=new Set(),snapshots=new Map(),series=[];
 for(const shard of shards){
  if(shard.coverage?.errors)throw Error('Shard had native engine errors');
  for(const s of shard.snapshots||[]){
   if(snapshots.has(s.checkpointKey))throw Error('Duplicate earned checkpoint '+s.checkpointKey);
   snapshots.set(s.checkpointKey,s);
  }
  for(const x of shard.series||[]){
   if(keys.has(x.id))throw Error('Duplicate matched enemy scenario '+x.id);
   if(!x.samePlayerAndRealm||Object.values(x.checks).some(v=>Object.values(v).some(ok=>!ok)))
    throw Error('Unmatched enemy arms in shard '+x.id);
   keys.add(x.id);series.push(x);
  }
 }
 return summarize({stage:'6.23',mode:'aggregate',source:sources[0],
  coverage:{shards:shards.length,accounts:shards.reduce((n,x)=>n+x.coverage.accounts,0),
   errors:0,distinctSeeds:new Set(shards.flatMap(x=>x.accounts.map(y=>y.seed))).size,
   reachedE4:shards.reduce((n,x)=>n+x.coverage.reachedE4,0),
   reachedE5:shards.reduce((n,x)=>n+x.coverage.reachedE5,0),
   realCheckpoints:snapshots.size},snapshots:[...snapshots.values()],series});
}
function markdown(report){
 const out=['# Stage 6.23 — Matched native Tank / eight Elites / Boss at earned E4–E5','','Source: '+report.source,
  '', 'Each matched scenario uses **one verified earned Camp state** from a real E1-started account, identical gear and legal talent XP, plus native seed, Realm, Risk and Condition. Solo Tank and all eight Elite identities/one Boss are staged first-ring controlled fights, not claims that the account walked to their natural rooms.', '',
  '## Coverage','',JSON.stringify(report.summary.coverage),'',
  '| E | Earned checkpoints | Matched scenarios | Real combat fights | Tank wins | Elites wins | Boss wins | Tank median dmg | Elite median dmg | Boss median dmg |',
  '|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|'];
 for(const x of [report.summary.level4,report.summary.level5])out.push('| '+x.level+' | '+x.earnedCheckpoints+' | '+x.nativeSeries+' | '+x.nativeFights+
  ' | '+x.tankWins+'/'+x.nativeSeries+' | '+x.eliteWins+'/'+(x.nativeSeries*ELITES.length)+
  ' | '+x.bossWins+'/'+x.nativeSeries+' | '+(x.tankDamageMedian??'n/a')+
  ' | '+(x.eliteDamageMedian??'n/a')+' | '+(x.bossDamageMedian??'n/a')+' |');
 for(const x of [report.summary.level4,report.summary.level5]){
  out.push('','## E'+x.level+' — eight native Elite archetypes','',
   '| Elite | Fights | Elite victories | Player defeated Tank but lost Elite | Player defeated Boss but lost Elite | Player defeated Elite but lost Boss | Median damage taken |',
   '|---|---:|---:|---:|---:|---:|---:|');
  for(const id of ELITES){const r=x.eliteById[id];out.push('| '+(E.NAMES[id]||id)+' | '+r.n+
   ' | '+r.eliteWins+' | '+r.tankBeatenEliteLost+' | '+r.bossBeatenEliteLost+
   ' | '+r.eliteBeatenBossLost+' | '+(r.damageMedian??'n/a')+' |');}
  out.push('','Boss affinity counts (only naturally generated risk-1 cards in controlled fixtures): '+JSON.stringify(x.bossByAffinity),
   'Mixed-class inversions: player loses Elite but beats same-seed Boss = '+x.bossEliteInversions+
   '; beats Elite but loses Boss = '+x.eliteBossInversions+
   '. These counts repeat one Boss against 8 Elites, NOT independent Boss sample sizes.');
 }
 out.push('','## Important methodological limits','',...report.cautions.map(x=>'- '+x),
  '', 'No buffs/nerfs or player changes were applied in this Stage.','');
 return out.join('\n');
}
function write(dest,obj){const file=path.resolve(ROOT,safePath(dest));
 fs.mkdirSync(path.dirname(file),{recursive:true});
 fs.writeFileSync(file,JSON.stringify(obj,null,2)+'\n');
 fs.writeFileSync(file.replace(/\.json$/,'.md'),markdown(obj)+'\n');return file;}
function main(argv=process.argv.slice(2)){
 const args=parse(argv);let out;
 if(args.mode==='cohort'){
  if(args.native.seeds.length!==1)throw Error('A Stage 6.23 executable cohort must have one natural seed');
  const r=collect(args.native.seeds[0],args.native.profiles,args.maxAttempts,args.maxTotalAttempts);
  if(r.source!==S.sourceFingerprint().sha256)throw Error('Changed native fingerprint between account and combat');
  const series=r.snapshots.flatMap(s=>Array.from({length:args.trials},(_,i)=>series(s,i)));
  out=summarize({stage:'6.23',mode:'cohort',source:r.source,settings:args.native,
    coverage:{...r.coverage,realCheckpoints:r.snapshots.length,distinctSeeds:1},
    accounts:r.accounts,snapshots:r.snapshots,series});
 }else{
  const dir=path.resolve(ROOT,args.inputs);
  const files=fs.readdirSync(dir).filter(f=>/^v013-stage623-seed\d+\.json$/.test(f)).sort();
  if(!files.length)throw Error('No Stage 6.23 shard JSON files');
  out=aggregate(files.map(f=>JSON.parse(fs.readFileSync(path.join(dir,f),'utf8')))));
 }
 const file=write(args.out,out);
 if(!out.summary.coverage.allChecksPassed||out.summary.coverage.errors)
  throw Error('Stage 6.23 paired integrity check failed');
 console.log('STAGE623='+JSON.stringify({file,source:out.source,
  coverage:out.summary.coverage,
  e4:((r)=>({scenarios:r.nativeSeries,fights:r.nativeFights,tankWins:r.tankWins,
   eliteWins:r.eliteWins,bossWins:r.bossWins,eliteById:r.eliteById,bossByAffinity:r.bossByAffinity,
   bossEliteInversions:r.bossEliteInversions}))(out.summary.level4),
  e5:((r)=>({scenarios:r.nativeSeries,fights:r.nativeFights,tankWins:r.tankWins,
   eliteWins:r.eliteWins,bossWins:r.bossWins,eliteById:r.eliteById,bossByAffinity:r.bossByAffinity,
   bossEliteInversions:r.bossEliteInversions}))(out.summary.level5)}));
 return out;
}
module.exports={ELITES,FAMILIES,parse,checkpoint,collect,model,options,duel,short,verify,series,summarize,aggregate,markdown,main};
if(require.main===module){try{main();}catch(e){console.error('STAGE623_ERROR '+(e.stack||e));process.exitCode=1;}}
