'use strict';
const fs=require('node:fs'),path=require('node:path');
const C=require('./v013-stage04-run-cohort.cjs');
const KEYS=C.SEEDS.flatMap(seed=>C.POLICIES.map(policy=>seed+'-'+policy));
const SHA_FILES=['scripts/v013-natural-progression.cjs','scripts/v013-agent-strategy.cjs',
 'scripts/v013-stage04-run-cohort.cjs','scripts/v013-stage04-aggregate.cjs',
 'tests/v012-economy-harness.cjs','combat/v012-gear-stats.js'];
const sum=(a,k)=>a.reduce((x,r)=>x+(Number(r[k])||0),0);
const median=xs=>{if(!xs.length)return null;const a=[...xs].sort((x,y)=>x-y),n=a.length>>1;return a.length%2?a[n]:Math.round((a[n-1]+a[n])/2*100)/100;};
const pct=(n,d)=>d?Math.round(1e4*n/d)/100:null;
const assert=(v,msg)=>{if(!v)throw Error('Stage04 integrity: '+msg);};
const success=(a,E)=>a.attempts.some(t=>t.level===E&&t.bossWon);
const role=(r)=>r.capabilities?.role||'unknown';
const mixed=(r)=>r.capabilities?.synergyStage||'not-yet';
const composition=(r)=>r.capabilities?.affinityComposition||'unformed';
const Eband=E=>E<=5?'E1-E5':E<=10?'E6-E10':'E11-E20';
const size=n=>n<=1?'solo':n<=4?'2-4':n<=12?'5-12':'13+';
function validate(d){
 const identity=d.stage04||{},seed=identity.seed,policy=identity.policy;
 assert(C.SEEDS.includes(seed)&&C.POLICIES.includes(policy)&&
 identity.kind==='natural-native-E1-E20-decision-ablation','unexpected identity');
 const cfg=d.settings||{};
 assert(cfg.seeds?.length===1&&cfg.seeds[0]===seed&&cfg.decisionModel===policy&&
  cfg.maxLevel===20&&cfg.maxAttempts===18&&cfg.maxTotalAttempts===360&&
  cfg.tickLimit===12000,'invalid policy or limits '+seed+'/'+policy);
 assert(d.integrity?.noFabricatedXp&&d.integrity?.noForcedEquipment&&
 d.integrity?.noForcedEncounter&&d.integrity?.noForcedLevelUnlock&&
 d.integrity?.noDamageOverride,'native integrity flag mismatch');
 assert(d.accounts?.length===10&&d.coverage?.accounts===10,'ten-account count '+seed+'/'+policy);
 const labels=new Set(),attempts=[];
 for(const a of d.accounts){
  const key=seed+'/'+policy+'/'+a.profile;
  assert(a.seed===seed&&C.PROFILES.includes(a.profile)&&!labels.has(a.profile),
   'duplicate or foreign account '+key);
  labels.add(a.profile);
  assert(a.startXp===0&&a.initialGear?.total>0&&
   a.initialGear.total===a.initialGear.starter,'non-native starting loadout '+key);
  assert(a.reached?.length>0&&a.reached[0]===1&&
   a.reached.every((E,i)=>E===i+1&&E<=20),'unearned E unlock '+key);
  assert(a.attempts?.length>0&&a.attempts.length<=360,'attempt cap '+key);
  const wins=new Set(),number=new Map();
  for(const t of a.attempts){
   assert(a.reached.includes(t.level),'attempted locked E '+key);
   const next=(number.get(t.level)||0)+1;
   assert(next<=18&&t.attempt===next,'E attempt ordering '+key);
   number.set(t.level,next);
   assert(t.level===1||wins.has(t.level-1),'skipped native Boss unlock '+key);
   assert(!wins.has(t.level),'attempted E after Boss clear '+key);
   if(t.bossWon){
    assert(t.status==='victory'&&t.after?.unlocked>=t.level+1,'fake Boss victory '+key);
    wins.add(t.level);
   }else assert(t.status!=='victory','untracked win '+key);
   if(t.before&&t.after)assert(t.after.xp>=t.before.xp,'native XP decreased '+key);
   attempts.push(t);
  }
  assert(a.endLevel===Math.max(0,...wins)+1&&
   a.reached.length===Math.min(20,a.endLevel),'invalid native win ledger '+key);
 }
 assert(labels.size===C.PROFILES.length,'missing profile '+seed+'/'+policy);
 assert(d.coverage?.attempts===attempts.length,'attempt count does not match coverage');
 assert(d.coverage?.errors===attempts.filter(t=>t.error||t.status==='error').length,
  'error count does not match coverage');
 return true;
}
function verifyProvenance(dir,shards){
 const revs=new Set(),nodes=new Set(),files=new Set();let expected=null;
 for(const d of shards){
  const key=d.stage04.seed+'-'+d.stage04.policy;
  const fn=path.join(dir,'raw-'+key+'.provenance.txt');
  assert(fs.existsSync(fn),'missing source manifest '+key);
  const lines=fs.readFileSync(fn,'utf8').trim().split(/\r?\n/);
  const get=k=>lines.find(x=>x.startsWith(k+'='))?.slice(k.length+1);
  const revision=get('revision'),node=get('node');
  assert(get('cohort')===key&&/^[a-f0-9]{40}$/.test(revision||'')&&
   /^v\d+\.\d+\.\d+$/.test(node||''),'wrong commit/node/shard '+key);
  revs.add(revision);nodes.add(node);
  const hashes=Object.fromEntries(lines.map(x=>/^([a-f0-9]{64})\s+(\S+)$/.exec(x))
   .filter(Boolean).map(m=>[m[2],m[1]]));
  assert(SHA_FILES.every(f=>/^[a-f0-9]{64}$/.test(hashes[f]||'')),
   'missing SHA file '+key);
  assert(hashes[SHA_FILES[0]]===d.runnerSha256&&
   hashes[SHA_FILES[1]]===d.agentStrategySha256,'mismatched source bytes '+key);
  const fingerprint=Object.fromEntries(SHA_FILES.map(k=>[k,hashes[k]]));
  files.add(JSON.stringify(fingerprint));
  if(!expected)expected=fingerprint;
 }
 assert(revs.size===1&&nodes.size===1&&files.size===1,
  'mixed Git revisions, Node versions or native file hashes');
 return {gitRevision:[...revs][0],nodeVersion:[...nodes][0],fileSha256:expected};
}
function groupRooms(rows,key){
 const groups={};
 for(const r of rows)(groups[key(r)]??=[]).push(r);
 return Object.fromEntries(Object.entries(groups).sort(([a],[b])=>a.localeCompare(b))
  .map(([name,rs])=>{
   const wins=rs.filter(x=>x.room.won).length;
   const get=k=>rs.map(x=>x.room[k]).filter(Number.isFinite);
   return [name,{fights:rs.length,wins,winPct:pct(wins,rs.length),
    deaths:rs.filter(x=>x.room.died).length,
    timeouts:rs.filter(x=>x.room.timedOut).length,
    medianSeconds:median(get('seconds')),
    medianDamageTaken:median(get('damageTaken')),
    medianTargetSwitches:median(get('targetSwitches')),
    observedNonFocusedHealthLoss:Math.round(sum(rs.map(x=>x.room),'observedNonFocusedHealthLost')*100)/100,
    note:'Net non-focused HP deltas are not source-attributed AoE damage'}];
  }));
}
function summarize(shards){
 assert(shards.length===KEYS.length,'expected exactly 36 independent shards, found '+shards.length);
 const map=new Map(),runners=new Set(),agents=new Set();
 for(const d of shards){
  validate(d);const key=d.stage04.seed+'-'+d.stage04.policy;
  assert(KEYS.includes(key)&&!map.has(key),'unexpected/duplicate shard '+key);
  map.set(key,d);runners.add(d.runnerSha256);agents.add(d.agentStrategySha256);
 }
 assert(KEYS.every(x=>map.has(x)),'missing full seed/policy coverage');
 assert(runners.size===1&&agents.size===1,'different code revisions across policies');
 const observations=[],accounts=[];
 for(const [key,d] of map)for(const a of d.accounts){
  const row={seed:a.seed,profile:a.profile,policy:d.stage04.policy,
   attempts:a.attempts.length,highestReached:Math.max(...a.reached),
   E1:success(a,1),E5:success(a,5),E10:success(a,10),E15:success(a,15),
   E20:success(a,20),initialGear:a.initialGear,stop:a.stopReason,
   finalXp:a.xp,finalNodes:a.talents?.length||0};
  accounts.push(row);
  for(const t of a.attempts)for(const room of t.rooms||[])
   observations.push({seed:a.seed,profile:a.profile,policy:d.stage04.policy,
    E:t.level,bucket:Eband(t.level),room});
 }
 assert(accounts.length===360,'expected 360 real native accounts');
 for(const seed of C.SEEDS)for(const profile of C.PROFILES){
  const group=accounts.filter(x=>x.seed===seed&&x.profile===profile);
  assert(group.length===3,'missing matched policy starting account '+seed+'/'+profile);
  const initial=a=>JSON.stringify((a.initialGear?.items||[]).map(x=>({
   slot:x.slot,tier:x.tier,rarity:x.rarity,subtype:x.subtype,
   affixes:x.affixes,stats:x.stats,startingGear:x.startingGear})));
  assert(new Set(group.map(initial)).size===1,
   'same-seed starting character differs before first decision '+seed+'/'+profile);
 }
 const errors=shards.flatMap(d=>d.accounts.flatMap(a=>a.attempts.filter(t=>t.error||t.status==='error')
  .map(t=>({seed:a.seed,profile:a.profile,policy:d.stage04.policy,E:t.level,error:t.error,diagnostic:t.diagnostic}))));
 const timeouts=observations.filter(x=>x.room.timedOut);
 const byPolicy=Object.fromEntries(C.POLICIES.map(policy=>{
  const xs=accounts.filter(a=>a.policy===policy),aa=map.size?shards.filter(d=>d.stage04.policy===policy):[];
  const at=aa.flatMap(d=>d.accounts.flatMap(a=>a.attempts));
  const perE=Array.from({length:20},(_,i)=>{
   const E=i+1,entered=aa.flatMap(d=>d.accounts).filter(a=>a.reached.includes(E));
   const clears=entered.filter(a=>success(a,E)),attempts=at.filter(t=>t.level===E);
   return {E,entered:entered.length,cleared:clears.length,attempts:attempts.length,
    medianTriesToClear:median(clears.map(a=>a.attempts.find(t=>t.level===E&&t.bossWon).attempt)),
    winPctAmongEntrants:pct(clears.length,entered.length)};
  });
  return [policy,{accounts:xs.length,attempts:at.length,E1:xs.filter(x=>x.E1).length,
   E5:xs.filter(x=>x.E5).length,E10:xs.filter(x=>x.E10).length,
   E20:xs.filter(x=>x.E20).length,
   profiles:Object.fromEntries(C.PROFILES.map(profile=>{
    const p=xs.filter(x=>x.profile===profile);
    return [profile,{E1:p.filter(x=>x.E1).length,E5:p.filter(x=>x.E5).length,
     E10:p.filter(x=>x.E10).length,E20:p.filter(x=>x.E20).length,
     attempts:sum(p,'attempts')}];
   })),perExpedition:perE}];
 }));
 const paired=Object.fromEntries(C.POLICIES.filter(x=>x!=='adaptive').map(policy=>{
  const pairs=C.SEEDS.flatMap(seed=>C.PROFILES.map(profile=>{
   const base=accounts.find(a=>a.seed===seed&&a.profile===profile&&a.policy==='adaptive');
   const variant=accounts.find(a=>a.seed===seed&&a.profile===profile&&a.policy===policy);
   return {base,variant};
  }));
  const tally=k=>({baseline:pairs.filter(x=>x.base[k]).length,
   variation:pairs.filter(x=>x.variant[k]).length,
   gained:pairs.filter(x=>!x.base[k]&&x.variant[k]).length,
   lost:pairs.filter(x=>x.base[k]&&!x.variant[k]).length});
  return [policy,{pairs:pairs.length,E1:tally('E1'),E5:tally('E5'),
   E10:tally('E10'),E20:tally('E20')}];
 }));
 const nativeBoss=observations.filter(x=>x.room.roomType==='boss');
 const nativeElite=observations.filter(x=>x.room.roomType==='elite');
 const many=observations.filter(x=>x.room.roomType==='combat'&&x.room.initialEnemies>1);
 const mixedRows=observations.filter(x=>composition(x.room)==='mixed');
 const rawAttempts=shards.flatMap(d=>d.accounts.flatMap(a=>a.attempts.map(t=>({
  policy:d.stage04.policy,attempt:t}))));
 const eliteRoute=Object.fromEntries(C.POLICIES.map(p=>{
  const at=rawAttempts.filter(x=>x.policy===p).map(x=>x.attempt);
  return [p,{eligibleEliteAlternatives:at.flatMap(t=>t.decisions||[])
   .filter(d=>d.eligibleEliteAlternatives?.length).length,
   actualEliteFights:at.flatMap(t=>t.rooms||[]).filter(r=>r.roomType==='elite').length,
   bossPrepared:at.filter(t=>t.bossReached&&
    (t.prepAtBoss?.markedElite||t.prepAtBoss?.reliquary)).length}];
 }));
 const report={
  stage:'Stage 04 — targeted native AoE/ST, Affinities, Elite/Boss ablation',
  settings:{seeds:C.SEEDS,profiles:C.PROFILES,policies:C.POLICIES,
   attemptsPerE:18,totalAttemptCap:360,combatTickLimit:12000},
  coverage:{shards:shards.length,accounts:accounts.length,
   attempts:Object.values(byPolicy).reduce((n,x)=>n+x.attempts,0),
   nativeErrors:errors.length,combatTimeouts:timeouts.length,
   observedFights:observations.length,multiEnemyFights:many.length,
   eliteFights:nativeElite.length,bossFights:nativeBoss.length},
  provenance:{runnerSha256:[...runners][0],agentSha256:[...agents][0]},
  byPolicy,paired,accounts:accounts.map(({initialGear,...rest})=>rest),
  nativeCombat:{
   byRole:groupRooms(observations,x=>x.policy+'/'+role(x.room)),
   groupsByRoleAndSize:groupRooms(many,x=>x.policy+'/'+role(x.room)+'/'+size(x.room.initialEnemies)+'/'+x.bucket),
   mixedByEarnedStage:groupRooms(mixedRows,x=>x.policy+'/'+mixed(x.room)+'/'+role(x.room)+'/'+x.bucket),
   bossByTypeAndLevel:groupRooms(nativeBoss,x=>x.policy+'/'+(x.room.bossStyle||'unknown')+'/'+x.bucket),
   eliteByTypeAndLevel:groupRooms(nativeElite,x=>x.policy+'/'+(x.room.eliteType||'unknown')+'/'+x.bucket),
   eliteRoutes:eliteRoute},
  errors,limitations:[
   'No XP, talent, stat, equipment, loot or enemy overrides; only natural game-progression state.',
   'Matched seed/profile proves same initial character, NOT the same later dungeon or combat after policies diverge.',
   'Native Boss/Elite comparisons are observational and conditional on survival and reaching each encounter.',
   'Combat observations are repeatedly sampled from the same character, not independent human players.',
   'Mixed-Affinity requires earned nodes; merely selecting a hybrid profile is insufficient.',
   'AoE/ST/hybrid are classifier categories, not source-attributed combat DPS.',
   'Non-focused damage is a net HP observation and cannot be attributed exclusively to AoE.',
   'Unreached levels are censored; capped-attempt failure does not prove impossible play.'
  ]};
 assert(errors.length===0,'native simulation errors in '+errors.length+' attempts');
 assert(timeouts.length===0,'native combat tick limit reached '+timeouts.length+' times');
 return report;
}
function markdown(r){
 const lines=['# Stage 04 — AoE / single-target / Affinities / Elites / Bosses','',
  'Native E1–E20 accounts, identical initial seeded characters and only policy variations.','',
  'Accounts: '+r.coverage.accounts+'; attempts: '+r.coverage.attempts+
   '; technical errors: '+r.coverage.nativeErrors+'.',
  '','## Policy ablation: natural account outcomes',
  '| Policy | Accounts | E1 | E5 | E10 | E20 | Attempts |',
  '|---|---:|---:|---:|---:|---:|---:|',
  ...Object.entries(r.byPolicy).map(([k,v])=>'| '+k+' | '+v.accounts+' | '+v.E1+
   ' | '+v.E5+' | '+v.E10+' | '+v.E20+' | '+v.attempts+' |'),
  '','## E20 progression by native starting profile',
  '| Profile | Adaptive | Without target adaptation | Without room adaptation |',
  '|---|---:|---:|---:|',
  ...r.settings.profiles.map(p=>'| '+p+' | '+r.byPolicy.adaptive.profiles[p].E20+
   ' | '+r.byPolicy['adaptive-no-targets'].profiles[p].E20+
   ' | '+r.byPolicy['adaptive-no-rooms'].profiles[p].E20+' |'),
  '','## Change compared with adaptive using same starting seeds',
  '| Ablation | E1 gains | E1 losses | E20 gains | E20 losses |',
  '|---|---:|---:|---:|---:|',
  ...Object.entries(r.paired).map(([k,v])=>'| '+k+' | '+v.E1.gained+' | '+v.E1.lost+
   ' | '+v.E20.gained+' | '+v.E20.lost+' |'),
  '','## Actual native encounters',
  'Fights observed: '+r.coverage.observedFights+
   ', multi-enemy: '+r.coverage.multiEnemyFights+
   ', Elites: '+r.coverage.eliteFights+', Bosses: '+r.coverage.bossFights+'.',
  '','### AoE/ST versus genuine group size',
  '| Policy / role / group size / E | Encounters | Wins | Win % | Median seconds |',
  '|---|---:|---:|---:|---:|',
  ...Object.entries(r.nativeCombat.groupsByRoleAndSize).map(([k,v])=>
   '| '+k+' | '+v.fights+' | '+v.wins+' | '+(v.winPct??'—')+
   ' | '+(v.medianSeconds??'—')+' |'),
  '','### Mixed Affinities: actually earned stages',
  '| Policy / earned mixed stage / role / E | Encounters | Wins | Win % |',
  '|---|---:|---:|---:|',
  ...Object.entries(r.nativeCombat.mixedByEarnedStage).map(([k,v])=>
   '| '+k+' | '+v.fights+' | '+v.wins+' | '+(v.winPct??'—')+' |'),
  '','### Boss styles',
  '| Policy / Boss / E | Fights | Wins | Win % |',
  '|---|---:|---:|---:|',
  ...Object.entries(r.nativeCombat.bossByTypeAndLevel).map(([k,v])=>
   '| '+k+' | '+v.fights+' | '+v.wins+' | '+(v.winPct??'—')+' |'),
  '','### Elite archetypes',
  '| Policy / Elite / E | Fights | Wins | Win % |',
  '|---|---:|---:|---:|',
  ...Object.entries(r.nativeCombat.eliteByTypeAndLevel).map(([k,v])=>
   '| '+k+' | '+v.fights+' | '+v.wins+' | '+(v.winPct??'—')+' |'),
  '','## Interpretation limits',...r.limitations.map(x=>'- '+x),
  '','All original native account paths remain archived separately by seed and policy.',''];
 return lines.join('\n');
}
function main(argv=process.argv.slice(2)){
 const folder=path.resolve(argv[0]||'reports/stage04');
 const dest=path.resolve(argv[1]||'reports/stage04/stage04-targeted.json');
 const files=fs.readdirSync(folder).filter(x=>/^raw-\d+-adaptive(?:-no-targets|-no-rooms)?\.json$/.test(x)).sort();
 const shards=files.map(f=>JSON.parse(fs.readFileSync(path.join(folder,f),'utf8')));
 const result=summarize(shards);
 Object.assign(result.provenance,verifyProvenance(folder,shards));
 fs.mkdirSync(path.dirname(dest),{recursive:true});
 fs.writeFileSync(dest,JSON.stringify(result,null,2)+'\n');
 fs.writeFileSync(dest.replace(/\.json$/,'.md'),markdown(result)+'\n');
 console.log('STAGE04_FINAL='+JSON.stringify({
  coverage:result.coverage,byPolicy:Object.fromEntries(Object.entries(result.byPolicy)
   .map(([p,x])=>[p,{accounts:x.accounts,attempts:x.attempts,E1:x.E1,E5:x.E5,E10:x.E10,E20:x.E20,profiles:x.profiles}])),
  paired:result.paired,eliteRoutes:result.nativeCombat.eliteRoutes,
  nativeBossByStyle:Object.entries(result.nativeCombat.bossByTypeAndLevel)
   .filter(([k])=>k.startsWith('adaptive/')),
  provenance:{gitRevision:result.provenance.gitRevision,nodeVersion:result.provenance.nodeVersion}
 }));
 return result;
}
if(require.main===module)main();
module.exports={KEYS,validate,verifyProvenance,summarize,markdown,groupRooms,main};
