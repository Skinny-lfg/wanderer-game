'use strict';
// Stage 6.29 — directly compare actual new exponential enemy reference against
// exactly the old logarithmic reference: E1-born native accounts and matched
// old-earned Camp player snapshots (gear, XP, 100 Talents, post-cap attributes).
// All old-progression work is isolated in a disposable native VM. Live game
// uses the new exponential curve. No enemy-specific coefficients changed.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const D=require('./v013-stage628-postcap-difficulty.cjs');
const S=require('./simulate-progression.cjs');
const T=globalThis.WandererAutomaticTalents;
const P=globalThis.WandererExpeditionProgression;
const LEVELS=D.LEVELS;
const GROUPS=D.GROUPS,ELITES=D.ELITES,FAMILIES=D.FAMILIES;
const sha=x=>crypto.createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');
const pct=(x,n)=>n?Number((100*x/n).toFixed(1)):null;
const median=a=>{const v=a.filter(Number.isFinite).sort((x,y)=>x-y);if(!v.length)return null;const m=v.length>>1;return v.length%2?v[m]:(v[m-1]+v[m])/2;};
const INPUT=fs.readFileSync(path.resolve(__dirname,'../combat/expedition-progression.js'),'utf8');
const OLD_REFERENCE='function enemyReference(level){checked(level);return level<=5?level:5*(1+.2*Math.log1p((level-5)/5));}';
function legacySource(){
 const a=INPUT.indexOf('function enemyReference(level){'),b=INPUT.indexOf('\nconst UNITY=',a);
 if(a<0||b<0||INPUT.indexOf('function enemyReference(level){',a+1)!==-1||
  !INPUT.slice(a,b).includes('Math.expm1(rate*x)-rate*x')||
  !INPUT.includes('ENEMY_EXPONENTIAL_GROWTH'))
  throw Error('Unrecognized exponential native reference; refuse stale A/B');
 const old=INPUT.slice(0,a)+OLD_REFERENCE+INPUT.slice(b);
 new Function(old);
 return old;
}
const LEGACY=legacySource();
function oldReference(E){return E<=5?E:5*(1+.2*Math.log1p((E-5)/5));}
function parse(argv=process.argv.slice(2)){
 const cfg={mode:'cohort',seed:9861,profile:'balanced',maxLevel:200,
  maxAttempts:24,maxTotalAttempts:360,trials:1,
  out:'reports/v013-stage629-9861-balanced.json',inputs:'reports/stage629-shards'};
 for(const arg of argv){
  const m=/^--([a-z-]+)=(.+)$/.exec(arg);if(!m)throw Error('Invalid Stage6.29 CLI '+arg);
  const [,k,v]=m;
  if(k==='seed')cfg.seed=Number(v);
  else if(k==='profile')cfg.profile=v;
  else if(k==='max-level')cfg.maxLevel=Number(v);
  else if(k==='max-attempts')cfg.maxAttempts=Number(v);
  else if(k==='max-total-attempts')cfg.maxTotalAttempts=Number(v);
  else if(k==='trials')cfg.trials=Number(v);
  else if(k==='mode')cfg.mode=v;
  else if(k==='inputs')cfg.inputs=v;
  else if(k==='out')cfg.out=v;
  else throw Error('Unrecognized Stage6.29 option '+k);
 }
 if(!/^reports\/[a-z0-9-]+\.json$/.test(cfg.out)||
  !['cohort','aggregate'].includes(cfg.mode))throw Error('Unsafe output/mode');
 if(cfg.mode==='aggregate'){
  if(!/^reports\/[a-z0-9/-]+$/.test(cfg.inputs)||cfg.inputs.includes('..'))throw Error('Unsafe input');
  return cfg;
 }
 if(!Number.isSafeInteger(cfg.seed)||cfg.seed<1||cfg.seed>1000000||
  !require('./v013-natural-progression.cjs').PROFILES[cfg.profile]||
  cfg.maxLevel!==200||!Number.isInteger(cfg.maxAttempts)||cfg.maxAttempts<1||cfg.maxAttempts>36||
  !Number.isInteger(cfg.maxTotalAttempts)||cfg.maxTotalAttempts<100||cfg.maxTotalAttempts>400||
  !Number.isInteger(cfg.trials)||cfg.trials<1||cfg.trials>3)throw Error('Invalid Stage6.29 cohort');
 return cfg;
}
function earlySignature(account){
 return account.attempts.filter(x=>x.level<=5).map(x=>({
  E:x.level,attempt:x.attempt,status:x.status,
  bossWon:!!x.bossWon,xpEarned:x.xpEarned||0,
  beforeXp:x.before?.xp,afterXp:x.after?.xp,
  beforeGear:x.before?.gear?.items?.map(x=>[x.slot,x.rarity,x.subtype]),
  afterUnlocked:x.after?.unlocked
 }));
}
function pick(scenario,snap,seed,legacy){
 const opts=D.fixtures(snap);
 if(legacy)opts.stage624cProgressionSource=LEGACY;
 if(scenario.type==='elite')opts.stage619EliteType=scenario.id;
 const kind=scenario.type==='normal'||scenario.type==='tank'?'normal':scenario.type;
 const x=S.encounter(snap.level,D.build(snap),seed,kind,opts,undefined,undefined,
  scenario.realm,1,kind==='normal'?scenario.size:undefined);
 const expected=T.attributes(snap.state.automaticTalents);
 if(x.timedOut||!x.won&&!x.died||
  x.talentXp!==snap.xp||x.talentPointsEarned!==snap.talentEarned||
  x.permanentAttributesSpent!==snap.attributeSpent||
  Object.entries(expected).some(([k,v])=>x.permanentAttributes[k]!==v)||
  x.affinity!==scenario.realm||x.risk!==1||
  x.nativeEncounter!==kind||
  scenario.type==='elite'&&x.eliteType!==scenario.id||
  kind==='normal'&&x.initialEnemies!==scenario.size)
  throw Error('Invalid Stage6.29 native earned fight '+snap.profile+'/E'+snap.level+
   '/'+scenario.id+'/'+(legacy?'old':'new'));
 return x;
}
function tiny(x){
 return {win:!!x.won,died:!!x.died,timeout:!!x.timedOut,
  seconds:x.seconds,damageTaken:x.damageTaken,damageDealt:x.damageDealt,
  hpStart:x.hpStart,hpMax:x.hpMax,
  heroAttack:x.heroBaseStats.attack,heroDefense:x.heroBaseStats.defense,
  enemyHp:x.roster.reduce((n,e)=>n+e.maxHp,0),
  enemyAtk:x.roster.reduce((n,e)=>n+e.attack,0),
  enemyDef:x.roster.reduce((n,e)=>n+e.defense,0),
  actualEnemyCount:x.initialEnemies,roles:x.initialRoles,
  seed:x.resolvedSeed,gear:x.gearFingerprint,
  offhand:x.offhandType,affinity:x.affinity,condition:x.plannedConditionId,
  boss:x.bossId||null,elite:x.eliteType||null,stats:T.attributes({attributes:x.permanentAttributes})};
}
function matched(snap,scenario,seed){
 const old=pick(scenario,snap,seed,true),newer=pick(scenario,snap,seed,false);
 const invariants={
  seed:old.resolvedSeed===newer.resolvedSeed,
  gear:old.gearFingerprint===newer.gearFingerprint,
  offhand:old.offhandType===newer.offhandType,
  talentNodes:JSON.stringify(old.controlledTalentNodes)===JSON.stringify(newer.controlledTalentNodes),
  player:old.hpStart===newer.hpStart&&old.hpMax===newer.hpMax&&
   JSON.stringify(old.heroBaseStats)===JSON.stringify(newer.heroBaseStats),
  environment:old.affinity===newer.affinity&&old.risk===newer.risk&&
   old.plannedConditionId===newer.plannedConditionId,
  role:JSON.stringify(old.initialRoles)===JSON.stringify(newer.initialRoles),
  identity:old.bossId===newer.bossId&&old.eliteType===newer.eliteType,
  xp:old.talentXp===newer.talentXp&&
   old.permanentAttributesSpent===newer.permanentAttributesSpent
 };
 const failed=Object.entries(invariants).filter(([,ok])=>!ok).map(([k])=>k);
 if(failed.length)throw Error('Stage6.29 A/B comparison altered more than reference: '+
  failed.join(',')+' '+snap.profile+' E'+snap.level+'/'+scenario.id);
 if(snap.level<=5&&
  (JSON.stringify(old.roster)!==JSON.stringify(newer.roster)||
  old.won!==newer.won||old.damageTaken!==newer.damageTaken))
  throw Error('E1–E5 enemy and combat parity broken by curve '+scenario.id);
 return {E:snap.level,scenario:scenario.id,
  type:scenario.type,realm:scenario.realm,seed,
  talentPoints:snap.talentEarned,statPoints:snap.attributeSpent,
  gearRarities:snap.equippedRarity,gearFingerprint:snap.fingerprint,
  old:tiny(old),new:tiny(newer),invariants};
}
function cohort(cfg){
 if(P.ENEMY_EXPONENTIAL_GROWTH.rate!==.015||
  P.ENEMY_EXPONENTIAL_GROWTH.weight!==2||P.enemyReference(5)!==5)
  throw Error('Incorrect exponential candidate parameters');
 const old=D.collect(cfg,{moduleOverrides:{'combat/expedition-progression.js':LEGACY}});
 const next=D.collect(cfg);
 const earlyBefore=earlySignature(old.account),earlyAfter=earlySignature(next.account);
 if(JSON.stringify(earlyBefore)!==JSON.stringify(earlyAfter))
  throw Error('E1–E5 natural account changed; diagnostics refuse comparison: '+
   JSON.stringify({old:earlyBefore.slice(0,5),new:earlyAfter.slice(0,5)}));
 const rows=[],tankSearches=[];
 for(const snap of old.checkpoints){
  const seedBase=6290011+cfg.seed*107+snap.level*223;
  for(let t=0;t<cfg.trials;t++){
   const seed=seedBase+t*40013;
   for(const scene of D.scenarios(snap))rows.push(matched(snap,scene,seed));
   const baseRealm=D.scenarios(snap)[0].realm;
   let tankSeed=null;
   for(let k=0;k<16;k++){
    const trySeed=seed+73*k+1;
    const probe=pick({id:'tank-probe',type:'normal',size:1,realm:baseRealm},snap,trySeed,true);
    if(probe.initialRoles?.tank===1){tankSeed=trySeed;break;}
   }
   if(tankSeed!==null)rows.push(matched(snap,{id:'solo-tank',type:'tank',size:1,realm:baseRealm},tankSeed));
   tankSearches.push({E:snap.level,found:tankSeed!==null});
  }
 }
 const toSummary=(account,checkpoints)=>({
  seed:cfg.seed,profile:cfg.profile,attempts:account.attempts.length,
  reachedE:account.endLevel,stopReason:account.stopReason,
  bossWins:account.attempts.filter(x=>x.bossWon).length,finalXp:account.xp,
  snapshots:checkpoints.map(({state,...rest})=>({
   ...rest,heroStateDigest:sha(state),
   earnedEquipmentDigest:sha(state.equip),earnedTalentDigest:sha(state.automaticTalents)
  })),
  bands:D.windows(account.attempts)
 });
 return {stage:'6.29',kind:'native-new-exponential-vs-original-logarithmic',
  parameter:P.ENEMY_EXPONENTIAL_GROWTH,
  sources:{candidate:sha(INPUT),original:sha(LEGACY),game:S.sourceFingerprint().sha256},
  settings:cfg,cohort:{original:toSummary(old.account,old.checkpoints),
   candidate:toSummary(next.account,next.checkpoints),e1to5Exact:true},
  baselineEarnedSnapshots:old.checkpoints.map(c=>({
   E:c.level,xp:c.xp,talents:c.talentEarned,stats:c.attributeSpent,gear:c.equippedRarity,
   hero:c.statSnapshot,gearDigest:sha(c.state.equip)
  })),
  reference:LEVELS.map(E=>({E,old:oldReference(E),exponential:P.enemyReference(E),
   growth:P.enemyReference(E)/oldReference(E)})),
  matched:rows,tankSearches,
  coverage:{naturalAccounts:2,naturalAttempts:old.account.attempts.length+next.account.attempts.length,
   baselineCheckpoints:old.checkpoints.length,candidateCheckpoints:next.checkpoints.length,
   compared:rows.length,matchedNativeFights:rows.length*2,
   E200EarnedBaseline:old.checkpoints.some(x=>x.level===200),
   E200EarnedNew:next.checkpoints.some(x=>x.level===200),
   errors:0},
  caveats:[
   'Genuinely earned E1 starts and native E+1 unlocks in both curve variants.',
   'Old curve only inside disposable native VM. The published branch has the new reference.',
   'Paired fights use exactly the old naturally earned Camp player with same gear/Talents/XP/attributes across curve versions.',
   'Controlled first-ring Boss without earned Boons/potions/preparation is not a full Expedition outcome.',
   'Natural agent policies are deterministic heuristics, not representative human win rates.',
   'No Hero builds or individual Enemy AI/HP/ATK coefficients modified, only common reference.',
   'E200 candidate reached only if naturally unlocked; baseline checkpoint at E200 can still diagnose prospective balance.'
  ]};
}
function summarize(shards){
 const ids=new Set(),refs=new Set(),results=[],levels=new Set();
 for(const s of shards){
  if(s.stage!=='6.29'||s.kind!=='native-new-exponential-vs-original-logarithmic'||
   !s.cohort.e1to5Exact||s.coverage.errors||s.coverage.compared!==s.matched.length)
   throw Error('Corrupt Stage6.29 baseline/new account audit');
  const id=s.settings.seed+'|'+s.settings.profile;
  if(ids.has(id))throw Error('Duplicate native account '+id);ids.add(id);
  refs.add(JSON.stringify(s.sources));results.push(...s.matched);
  for(const r of s.matched)levels.add(r.E);
 }
 if(refs.size!==1)throw Error('Mixed source versions in Stage6.29 aggregate');
 const classifications=['normal','tank','elite','boss'];
 const byType=(rows,kind)=>{
  const a=rows.filter(x=>x.type===kind);
  const sum=(arm)=>{
   const n=a.length,w=a.filter(x=>x[arm].win).length,d=a.filter(x=>x[arm].died).length;
   return {n,wins:w,deaths:d,winPct:pct(w,n),
    medianTaken:median(a.map(x=>x[arm].damageTaken)),
    medianEnemyHP:median(a.map(x=>x[arm].enemyHp)),
    medianEnemyATK:median(a.map(x=>x[arm].enemyAtk))};
  };
  return {old:sum('old'),new:sum('new')};
 };
 const perLevel=[...levels].sort((a,b)=>a-b).map(E=>{
  const rs=results.filter(x=>x.E===E);
  return {E,heroes:[...new Set(rs.map(x=>x.gearFingerprint))].length,
   statsMedian:median(rs.map(x=>x.statPoints)),talentsMedian:median(rs.map(x=>x.talentPoints)),
   types:Object.fromEntries(classifications.map(k=>[k,byType(rs,k)])),
   normalGroups:Object.fromEntries(GROUPS.map(n=>['group-'+n,byType(rs.filter(x=>x.scenario==='group-'+n),'normal')])),
   namedElites:Object.fromEntries(ELITES.map(id=>[id,byType(rs.filter(x=>x.scenario===id),'elite')])),
   bosses:Object.fromEntries(FAMILIES.map(id=>[id,byType(rs.filter(x=>x.type==='boss'&&x.realm===id),'boss')]))};
 });
 return {stage:'6.29',kind:'aggregate',sources:shards[0].sources,
  parameter:shards[0].parameter,coverage:{
   cohorts:shards.length,nativeAccountRuns:shards.length*2,
   naturalAttempts:shards.reduce((n,x)=>n+x.coverage.naturalAttempts,0),
   matchedScenarios:results.length,nativeMatchedFights:results.length*2,
   oldReachedE200:shards.filter(x=>x.coverage.E200EarnedBaseline).length,
   newReachedE200:shards.filter(x=>x.coverage.E200EarnedNew).length,errors:0},
  samples:shards.map(x=>({seed:x.settings.seed,profile:x.settings.profile,
   original:x.cohort.original,candidate:x.cohort.candidate,e1to5Exact:x.cohort.e1to5Exact})),
  curve:perLevel,reference:shards[0].reference,
  limitations:shards[0].caveats};
}
function fmt(x){return x.n?x.wins+'/'+x.n+' ('+x.winPct+'%)':'—';}
function markdown(r){
 const lines=['# Stage 6.29 — Exponential Enemy Growth: matched E1–E200 balance evidence','',
  'Only the shared native reference changes. The old curve is isolated in disposable VM.','',
  'Candidate growth rate '+r.parameter.rate+'; weight '+r.parameter.weight,
  'Original source '+r.sources.original,
  'Candidate source '+r.sources.candidate,'',
  '| E | Old native base ref | New exponential ref | New/old |',
  '|---:|---:|---:|---:|',
  ...r.reference.map(x=>'| E'+x.E+' | '+x.old.toFixed(2)+' | '+x.exponential.toFixed(2)+' | '+x.growth.toFixed(2)+'× |'),'',
  '## Native E1-born accounts; old/new Expedition reach','',
  '| Policy | Seed | Old reach | New reach | Old Boss wins | New Boss wins | Old attempts | New attempts |',
  '|---|---:|---:|---:|---:|---:|---:|---:|'];
 for(const x of r.samples)lines.push('| '+x.profile+' | '+x.seed+' | E'+x.original.reachedE+
  ' | E'+x.candidate.reachedE+' | '+x.original.bossWins+' | '+x.candidate.bossWins+
  ' | '+x.original.attempts+' | '+x.candidate.attempts+' |');
 lines.push('','## Strict A/B, exactly the same genuinely earned Camp Hero','',
  '| E | Talents | Post100 Stats | Normal | Tank | Elite | Boss |',
  '|---:|---:|---:|---|---|---|---|');
 for(const x of r.curve){
  const one=(key)=>fmt(x.types[key].old)+' → '+fmt(x.types[key].new);
  lines.push('| E'+x.E+' | '+x.talentsMedian+' | '+x.statsMedian+
   ' | '+one('normal')+' | '+one('tank')+' | '+one('elite')+' | '+one('boss')+' |');
 }
 for(const x of r.curve){
  lines.push('','## E'+x.E+' — 8 Elites, six Bosses (old → exponential)','',
   '| Enemy | Old wins | New wins | HP median (old → new) | Attack median (old → new) |',
   '|---|---|---|---|---|');
  for(const [id,g] of Object.entries({...x.namedElites,...Object.fromEntries(
   Object.entries(x.bosses).map(([k,v])=>['Boss: '+k,v]))})){
   lines.push('| '+id+' | '+fmt(g.old)+' | '+fmt(g.new)+' | '+
    (g.old.medianEnemyHP??'—')+' → '+(g.new.medianEnemyHP??'—')+' | '+
    (g.old.medianEnemyATK??'—')+' → '+(g.new.medianEnemyATK??'—')+' |');
  }
 }
 lines.push('','## Experimental limits','',...r.limitations.map(x=>'- '+x),
  '','**No manual build tuning or individual enemy coefficient changes. No merge/deploy.**','');
 return lines.join('\n');
}
function output(file,data){if(!/^reports\/[a-z0-9-]+\.json$/.test(file))throw Error('Unsafe Stage6.29 output');
 const p=path.resolve(file);fs.mkdirSync(path.dirname(p),{recursive:true});
 fs.writeFileSync(p,JSON.stringify(data,null,2)+'\n');
 return p;
}
function main(argv=process.argv.slice(2)){
 const opts=parse(argv);let result;
 if(opts.mode==='cohort'){
  result=cohort(opts);output(opts.out,result);
  const brief=summarize([result]);
  fs.writeFileSync(opts.out.replace(/\.json$/,'.md'),markdown(brief)+'\n');
  console.log('STAGE629='+JSON.stringify({seed:opts.seed,profile:opts.profile,
   source:result.sources,coverage:result.coverage,
   naturalOld:{E:result.cohort.original.reachedE,bosses:result.cohort.original.bossWins},
   naturalNew:{E:result.cohort.candidate.reachedE,bosses:result.cohort.candidate.bossWins},
   fights:brief.curve.map(c=>({E:c.E,stat:c.statsMedian,
    elitesOld:c.types.elite.old.winPct,elitesNew:c.types.elite.new.winPct,
    bossOld:c.types.boss.old.winPct,bossNew:c.types.boss.new.winPct}))}));
 }else{
  const dir=path.resolve(opts.inputs);
  const names=fs.readdirSync(dir).filter(f=>/^v013-stage629-\d+-[a-z-]+\.json$/.test(f));
  if(!names.length)throw Error('No Stage6.29 cohort shards');
  result=summarize(names.map(f=>JSON.parse(fs.readFileSync(path.join(dir,f),'utf8'))));
  output(opts.out,result);
  fs.writeFileSync(opts.out.replace(/\.json$/,'.md'),markdown(result)+'\n');
  console.log('STAGE629_AGG='+JSON.stringify({coverage:result.coverage,
   participants:result.samples.map(s=>({profile:s.profile,seed:s.seed,
    oldE:s.original.reachedE,newE:s.candidate.reachedE,
    oldBossWins:s.original.bossWins,newBossWins:s.candidate.bossWins})),
   reference:result.reference.map(x=>({E:x.E,old:+x.old.toFixed(2),new:+x.exponential.toFixed(2)})),
   curve:result.curve.map(x=>({E:x.E,n:x.types.boss.old.n,stats:x.statsMedian,
    elite:{old:x.types.elite.old.winPct,new:x.types.elite.new.winPct},
    boss:{old:x.types.boss.old.winPct,new:x.types.boss.new.winPct},
    normal:{old:x.types.normal.old.winPct,new:x.types.normal.new.winPct},
    tank:{old:x.types.tank.old.winPct,new:x.types.tank.new.winPct}}))}));
 }
 return result;
}
module.exports={INPUT,LEGACY,LEVELS,GROUPS,ELITES,FAMILIES,legacySource,oldReference,
 parse,earlySignature,pick,tiny,matched,cohort,summarize,markdown,main};
if(require.main===module){try{main();}catch(e){console.error('STAGE629_ERROR '+String(e.stack||e));process.exitCode=1;}}
