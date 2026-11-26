'use strict';
// Stage 6.22: earned-account E3–E5 diagnosis. No combat or economy overrides.
// Every observed fight, Boon, potion, item and Boss is from the live v0.13 runtime.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const N=require('./v013-natural-progression.cjs');
const ROOT=path.resolve(__dirname,'..');
const LEVELS=[1,2,3,4,5],KINDS=['combat','elite','boss'];
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const round=(n,p=1)=>Number(n.toFixed(p));
const rate=(wins,n)=>n?round(100*wins/n):null;
const median=values=>{const xs=values.filter(finite).sort((a,b)=>a-b);return xs.length?round(xs.length%2?xs[(xs.length-1)/2]:(xs[xs.length/2-1]+xs[xs.length/2])/2):null;};
const count=(items,fn)=>items.filter(fn).length;
const histogram=items=>Object.fromEntries([...new Set(items)].sort().map(k=>[k,count(items,v=>v===k)]));
const ratio=(a,b)=>finite(a)&&finite(b)&&b>0?round(100*a/b):null;
function classify(a){
 if(a.error||a.status==='error')return 'runtime_error';
 if(a.bossWon&&a.status==='victory')return 'boss_victory';
 if(a.status==='extracted')return 'safe_extraction';
 if(a.status==='defeat'){
  const death=(a.rooms||[]).findLast(r=>r.died);
  return death?.roomType==='boss'?'boss_death':death?.roomType==='elite'?'elite_death':
   death?.roomType==='combat'?'normal_room_death':'unclassified_death';
 }
 return 'unresolved_outcome';
}
function extractionReason(a){
 return (a.decisions||[]).findLast(d=>d.type==='extract')?.reason||
  (a.status==='extracted'?'automatic_end_of_route':null);
}
function bossEncounter(a){
 const r=(a.rooms||[]).find(r=>r.roomType==='boss');
 if(!r)return null;
 return {level:a.level,seed:a.seed,profile:a.profile,affinity:a.affinity,
  risk:a.risk,won:!!r.won,heroHpStartPct:ratio(r.hpStart,r.hpMax),
  heroHpEndPct:ratio(r.hpEnd,r.hpMax),damageTaken:r.damageTaken??null,
  bossInitialHP:a.bossInitialHP??null,
  bossStyle:r.bossStyle||null,seconds:r.seconds??null,
  markedElite:!!a.prepAtBoss?.markedElite,reliquary:!!a.prepAtBoss?.reliquary,
  initialModifiers:a.bossInitialModifiers||[],summons:r.bossSummons||0,
  initialHeroTalents:a.before?.spent??null,
  initialGearPieces:a.before?.gear?.total??null,
  startingEquipment:a.before?.gear?.items||[]};
}
function analyze(accounts,source,settings={}){
 if(!Array.isArray(accounts)||!accounts.length)throw Error('No native accounts to diagnose');
 const keys=new Set();
 for(const account of accounts){
  if(!Number.isSafeInteger(account.seed)||!N.PROFILES[account.profile]||
    !Array.isArray(account.attempts)||!Array.isArray(account.reached)||
    !Number.isInteger(account.endLevel))throw Error('Invalid native account');
  const key=account.seed+'|'+account.profile;
  if(keys.has(key))throw Error('Duplicate persistent account '+key);
  keys.add(key);
  if(!account.reached.includes(1))throw Error('Fresh account E1 missing');
  for(const a of account.attempts){
   if(!LEVELS.includes(a.level)||!account.reached.includes(a.level)||
     !['victory','defeat','extracted','error'].includes(a.status))throw Error('Invalid native attempt');
   if(a.before?.unlocked!==a.level)throw Error('Illegal pre-attempt Expedition unlock');
   if(a.bossWon!== (a.status==='victory'&&a.bossReached))throw Error('Native Boss win mismatch');
   if(a.contractPaid&&!['victory','extracted'].includes(a.status))
    throw Error('Contract paid on unsafe exit');
  }
 }
 const attempts=accounts.flatMap(ac=>ac.attempts.map(a=>({...a,seed:ac.seed})));
 const byLevel=LEVELS.map(level=>{
  const aa=attempts.filter(a=>a.level===level),rooms=aa.flatMap(a=>a.rooms||[]),
   boss=aa.map(bossEncounter).filter(Boolean),reached=accounts.filter(a=>a.reached.includes(level)),
   extracts=aa.filter(a=>a.status==='extracted'),deaths=aa.filter(a=>a.status==='defeat');
  const first=aa.map(a=>(a.rooms||[])[0]).filter(Boolean);
  const critical=aa.filter(a=>a.level===level).map(a=>a.before?.spent).filter(finite);
  const enteredBoss=aa.filter(a=>a.bossReached);
  const prep=boss.map(b=>b.markedElite?b.reliquary?'both':'marked':b.reliquary?'reliquary':'none');
  const gear=aa.map(a=>a.before?.gear).filter(Boolean);
  const reason=histogram(extracts.map(extractionReason));
  const encounterWins=Object.fromEntries(KINDS.map(k=>[k,{fights:count(rooms,r=>r.roomType===k),
   wins:count(rooms,r=>r.roomType===k&&r.won),deaths:count(rooms,r=>r.roomType===k&&r.died)}]));
  const allBossFights=rooms.filter(r=>r.roomType==='boss');
  return {
   level,accountsEntered:reached.length,attempts:aa.length,
   attemptedBosses:enteredBoss.length,bossWins:count(aa,a=>a.bossWon),
   bossWinPctConditional:rate(count(aa,a=>a.bossWon),enteredBoss.length),
   extractions:extracts.length,deaths:deaths.length,errors:count(aa,a=>!!a.error),
   failureClasses:histogram(aa.map(classify)),
   extractionReasons:reason,
   playerTalentsSpentMedian:median(critical),gearPiecesMedian:median(gear.map(g=>g.total)),
   starterPiecesMedian:median(gear.map(g=>g.starter)),
   firstRoomHpLossPctMedian:median(first.map(r=>ratio(r.hpStart-r.hpEnd,r.hpMax))),
   bossEntryHpPctMedian:median(boss.map(b=>b.heroHpStartPct)),
   bossInitialHpMedian:median(boss.map(b=>b.bossInitialHP)),
   prepAtBoss:histogram(prep),bossModifiers:histogram(boss.flatMap(b=>b.initialModifiers)),
   bossSummons:allBossFights.reduce((n,r)=>n+(r.bossSummons||0),0),
   fights:encounterWins,boonsTaken:aa.reduce((n,a)=>n+(a.boons?.length||0),0),
   potionsUsed:aa.reduce((n,a)=>n+(a.potions?.length||0),0),
   contractOptionsChosen:count(aa,a=>!!a.contract),
   contractsCompleted:count(aa,a=>a.contractCompleted),
   contractPayouts:count(aa,a=>a.contractPaid),
   earlyExtractedBeforeBoss:count(extracts,a=>!a.bossReached),
   gearUpgrades:aa.reduce((n,a)=>n+(a.equipped?.length||0)+(a.camp?.equipped?.length||0),0),
   bossByAffinity:Object.fromEntries([...new Set(boss.map(b=>b.affinity))].sort().map(family=>{
    const fights=boss.filter(b=>b.affinity===family);
    return [family,{entries:fights.length,wins:count(fights,b=>b.won),
     startingHeroHpMedian:median(fights.map(b=>b.heroHpStartPct)),
     bossHpMedian:median(fights.map(b=>b.bossInitialHP)),
     prepared:count(fights,b=>b.markedElite||b.reliquary)}];
   }))
  };
 });
 const e3e5=attempts.filter(a=>a.level>=3&&a.level<=5);
 const perAccount=accounts.map(ac=>({
  seed:ac.seed,profile:ac.profile,endLevel:ac.endLevel,stopReason:ac.stopReason,
  attempts:ac.attempts.length,totalEarnedXP:ac.xp,
  finalTalentNodes:ac.talents?.length,finalGearPieces:ac.finalGear?.total,
  e3e5:ac.attempts.filter(a=>a.level>=3&&a.level<=5).map(a=>({
   level:a.level,attempt:a.attempt,status:a.status,class:classify(a),
   affinity:a.affinity,risk:a.risk,extractionReason:extractionReason(a),
   fights:(a.rooms||[]).length,gear:a.before?.gear?.total||0,
   starter:a.before?.gear?.starter||0,points:a.before?.spent||0,
   xp:a.before?.xp??null,bossReached:a.bossReached,bossWon:a.bossWon,
   boss:bossEncounter({...a,seed:ac.seed}),boons:a.boons?.length||0,potions:a.potions?.length||0,
   contract:a.contract,contractPaid:a.contractPaid?.kind||null,
   lastRoom:(a.rooms||[]).at(-1)?.roomType||null
  }))
 }));
 return {stage:'6.22',mode:'diagnostic',source,settings,
  coverage:{accounts:accounts.length,distinctSeeds:new Set(accounts.map(a=>a.seed)).size,
   attempts:attempts.length,e3e5Attempts:e3e5.length,
   e4Accounts:byLevel[3].accountsEntered,e4BossEntries:byLevel[3].attemptedBosses,
   errors:count(attempts,a=>!!a.error),nativeBossFights:attempts.reduce((n,a)=>n+count(a.rooms||[],r=>r.roomType==='boss'),0)},
  byLevel,perAccount,limitations:[
   'No forced items, XP, wins, Boss room or level: only actual earned, persistent accounts from E1',
   'Agent behavior and repeat attempts within one account are correlated; fights are NOT independent player samples',
   'E4 and E5 results exclude accounts that cannot reach the level (censored), not automatic zero-win combats',
   'Boss rate is conditional on the agent actually reaching a Boss and must not be confused with per-Expedition success',
   'A small cohort cannot identify the causal effect of one stat, boss skill, build or contract without matched ablation',
   'This stage changes no combat, item, player or enemy balancing value'
  ]};
}
function merge(shards){
 if(!Array.isArray(shards)||!shards.length)throw Error('No completed shards supplied');
 const versions=[...new Set(shards.map(s=>s.source))];
 if(versions.length!==1||!versions[0])throw Error('Native runtime fingerprints differ across shards');
 const accounts=shards.flatMap(s=>s.accounts||[]);
 const aggregate=analyze(accounts,versions[0],{shards:shards.length,
  seeds:[...new Set(accounts.map(a=>a.seed))].sort((a,b)=>a-b),
  profiles:[...new Set(accounts.map(a=>a.profile))].sort()});
 return {...aggregate,mode:'aggregate',
  coverage:{...aggregate.coverage,shards:shards.length},
  sourceFiles:shards.map(s=>s.output||null)};
}
function markdown(data){
 const lines=['# Stage 6.22 — E3–E5 earned-player bottleneck audit','',
  'Native runtime SHA256: '+data.source,'',
  'Accounts '+data.coverage.accounts+'; seeds '+data.coverage.distinctSeeds+
  '; attempts '+data.coverage.attempts+'; native errors '+data.coverage.errors+'.','',
  '| E | Accounts reached | Attempts | Boss entries | Boss wins | Boss wins / entry | Extractions | Deaths | Normal deaths | Elite deaths | Boss deaths | Median Boss-entry HP % |',
  '|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|'];
 for(const x of data.byLevel)lines.push('| E'+x.level+' | '+x.accountsEntered+' | '+x.attempts+' | '+
  x.attemptedBosses+' | '+x.bossWins+' | '+(x.bossWinPctConditional===null?'n/a':x.bossWinPctConditional+'%')+' | '+
  x.extractions+' | '+x.deaths+' | '+(x.failureClasses.normal_room_death||0)+' | '+
  (x.failureClasses.elite_death||0)+' | '+(x.failureClasses.boss_death||0)+' | '+
  (x.bossEntryHpPctMedian??'n/a')+' |');
 for(const x of data.byLevel.filter(x=>x.level>=3)){
  lines.push('','## E'+x.level,'',
   'Account reach: '+x.accountsEntered+'; Boss entries: '+x.attemptedBosses+
   '; actual Boss wins: '+x.bossWins+'. Conditional rate is **not** general player win chance.',
   'Failure categories: '+JSON.stringify(x.failureClasses),
   'Extraction decisions: '+JSON.stringify(x.extractionReasons),
   'Elite/normal/Boss encounters: '+JSON.stringify(x.fights),
   'Boss family exposure (no invented missing Boss cells): '+JSON.stringify(x.bossByAffinity),
   'Preparation at Boss: '+JSON.stringify(x.prepAtBoss),
   'Boss modifiers: '+JSON.stringify(x.bossModifiers),
   'Median earned allocated Talent nodes: '+(x.playerTalentsSpentMedian??'n/a')+
   '; native gear pieces: '+(x.gearPiecesMedian??'n/a')+
   '; starting pieces retained: '+(x.starterPiecesMedian??'n/a'),
   'Native potions used: '+x.potionsUsed+'; Boons selected: '+x.boonsTaken+
   '; actual gear upgrades: '+x.gearUpgrades+
   '; contracts paid: '+x.contractPayouts);
 }
 lines.push('','## Individual persistent accounts','');
 for(const ac of data.perAccount)lines.push('- Seed '+ac.seed+' / '+ac.profile+
  ': unlocked E'+ac.endLevel+' after '+ac.attempts+' attempts; E3–E5 attempts '+ac.e3e5.length+
  '; '+(ac.stopReason||'target reached'));
 lines.push('','## Evidence caveats','',...data.limitations.map(x=>'- '+x),'',
  'No gameplay balance changes were made in Stage 6.22.','');
 return lines.join('\n');
}
function parse(argv=[]){
 const x={mode:'cohort',seeds:'9701',profiles:'cautious,balanced,smart-blood-fury-radiance',
  maxLevel:5,maxAttempts:12,maxTotalAttempts:60,out:'reports/v013-stage622-seed9701.json',inputs:null};
 for(const arg of argv){
  const m=/^--([a-z-]+)=(.+)$/.exec(arg);if(!m)throw Error('Invalid Stage 6.22 CLI argument '+arg);
  const [,key,val]=m;
  if(key==='mode')x.mode=val;
  else if(key==='seeds')x.seeds=val;
  else if(key==='profiles')x.profiles=val;
  else if(key==='max-level')x.maxLevel=Number(val);
  else if(key==='max-attempts')x.maxAttempts=Number(val);
  else if(key==='max-total-attempts')x.maxTotalAttempts=Number(val);
  else if(key==='out')x.out=val;
  else if(key==='inputs')x.inputs=val;
  else throw Error('Unknown Stage 6.22 option '+key);
 }
 if(!['cohort','aggregate'].includes(x.mode)||!x.out.startsWith('reports/')||
  !x.out.endsWith('.json')||x.out.includes('..'))throw Error('Invalid Stage 6.22 mode/path');
 if(x.mode==='aggregate'){
  if(!x.inputs||x.inputs.includes('..')||!x.inputs.startsWith('reports/'))throw Error('Invalid shard input path');
  return x;
 }
 if(x.maxLevel!==5||!Number.isSafeInteger(x.maxAttempts)||x.maxAttempts<1||x.maxAttempts>12||
  !Number.isSafeInteger(x.maxTotalAttempts)||x.maxTotalAttempts<1||x.maxTotalAttempts>60)
  throw Error('Invalid bounded E1–E5 earned-account cohort');
 const native=N.parseArgs(['--seeds='+x.seeds,'--profiles='+x.profiles,
  '--max-level=5','--max-attempts='+x.maxAttempts,
  '--max-total-attempts='+x.maxTotalAttempts,'--out='+x.out]);
 if(native.seeds.length*native.profiles.length>3)throw Error('One shard may contain at most three independent accounts');
 return {...x,native};
}
function writeJson(file,data){const p=path.resolve(ROOT,file);fs.mkdirSync(path.dirname(p),{recursive:true});
 fs.writeFileSync(p,JSON.stringify(data,null,2)+'\n');
 fs.writeFileSync(p.replace(/\.json$/,'.md'),markdown(data)+'\n');
 return p;
}
function main(argv=process.argv.slice(2)){
 const o=parse(argv);
 let data;
 if(o.mode==='cohort'){
  const result=N.run(o.native);
  if(result.coverage.errors)throw Error('Natural accounts had '+result.coverage.errors+' runtime errors');
  data={...analyze(result.accounts,result.source,o.native),mode:'cohort',
   accounts:result.accounts,output:o.out};
 }else{
  const dir=path.resolve(ROOT,o.inputs);
  const files=fs.readdirSync(dir).filter(f=>/^v013-stage622-seed\d+\.json$/.test(f)).sort();
  if(!files.length)throw Error('No native Stage 6.22 shards in '+o.inputs);
  const shards=files.map(f=>JSON.parse(fs.readFileSync(path.join(dir,f),'utf8')));
  data=merge(shards);
 }
 const outfile=writeJson(o.out,data);
 const summary={out:outfile,mode:data.mode,source:data.source,coverage:data.coverage,
  e3e5:data.byLevel.filter(v=>v.level>=3).map(v=>({
   E:v.level,accounts:v.accountsEntered,attempts:v.attempts,bossEntries:v.attemptedBosses,
   bossWins:v.bossWins,deathKinds:v.failureClasses,
   extractions:v.extractions,reasons:v.extractionReasons,byBoss:v.bossByAffinity,
   medianEarnedTalents:v.playerTalentsSpentMedian,medianHeroBossEntryHp:v.bossEntryHpPctMedian
  }))};
 console.log('STAGE622='+JSON.stringify(summary));
 return data;
}
module.exports={LEVELS,rate,median,ratio,classify,extractionReason,bossEncounter,analyze,merge,markdown,parse,main};
if(require.main===module){try{main();}catch(e){console.error('STAGE622_ERROR',e.stack||e);process.exitCode=1;}}
