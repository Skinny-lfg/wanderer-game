'use strict';
// Stage 6.36 — Does earned player growth/real gear matter in the native fight?
// All checkpoints are earned from E1 and replay at their actual unlocked E.
// The paired variant removes ONE *already owned* non-weapon item in an
// isolated native combat fixture; it is explicitly NOT another earned account.
// Live game, gear tiers, talents, XP, enemies and rewards are never modified.
const fs=require('node:fs'),path=require('node:path');
const N=require('./v013-natural-progression.cjs');
const B=require('./v013-stage632-player-power.cjs');
const D=require('./v013-stage628-postcap-difficulty.cjs');
const S=require('./simulate-progression.cjs');
const LEVELS=Object.freeze([2,5,10,20,35,70,100,150,200]);
const PROFILES=Object.freeze([
 'smart-blood-pure','smart-fury-pure','smart-radiance-pure','smart-aegis-radiance',
 'smart-arcane-arcane-pure','smart-arcane-lightning-pure',
 'smart-decay-arcane-aegis','smart-blood-fury-radiance',
 'cloth-battlemage','leather-duelist','plate-warden','hexblade-hybrid']);
const SEEDS=Object.freeze([9861,9863]);
const JOBS=Object.freeze(PROFILES.flatMap(id=>SEEDS.map(seed=>Object.freeze({id,seed}))));
const KINDS=Object.freeze(['solo','trio','elite','boss']);
const valid=n=>typeof n==='number'&&Number.isFinite(n);
const med=a=>B.distribution(a).median;
const round=n=>valid(n)?Number(n.toFixed(4)):null;
const pct=(a,b)=>b>0?round(100*a/b):null;
const copy=x=>JSON.parse(JSON.stringify(x));
function parse(argv=process.argv.slice(2)){
 const cfg={mode:'cohort',batch:0,maxLevel:200,maxAttempts:12,maxTotalAttempts:400,
  out:'reports/v013-stage636-cohort-0.json',inputs:'reports/stage636-shards'};
 for(const arg of argv){
  const m=/^--([a-z-]+)=(.+)$/.exec(arg);
  if(!m)throw Error('Unsupported Stage6.36 argument '+arg);
  if(['mode','out','inputs'].includes(m[1]))cfg[m[1]]=m[2];
  else if(['batch','max-level','max-attempts','max-total-attempts'].includes(m[1]))
   cfg[m[1].replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=Number(m[2]);
  else throw Error('Unknown Stage6.36 CLI option '+m[1]);
 }
 if(!['cohort','aggregate'].includes(cfg.mode)||
  !/^reports\/v013-stage636-[a-z0-9-]+\.json$/.test(cfg.out)||
  !/^reports\/[a-z0-9/-]+$/.test(cfg.inputs)||cfg.inputs.includes('..'))
  throw Error('Unsafe Stage6.36 path or mode');
 if(cfg.mode==='cohort'&&(!Number.isInteger(cfg.batch)||cfg.batch<0||cfg.batch>=JOBS.length||
  !Number.isInteger(cfg.maxLevel)||cfg.maxLevel<2||cfg.maxLevel>200||
  !Number.isInteger(cfg.maxAttempts)||cfg.maxAttempts<1||cfg.maxAttempts>24||
  !Number.isInteger(cfg.maxTotalAttempts)||cfg.maxTotalAttempts<2||cfg.maxTotalAttempts>500))
  throw Error('Unsafe or invalid Stage6.36 natural cohort settings');
 return cfg;
}
function bestOwnedNonWeapon(snap){
 const equipment=Object.entries(snap.state.equip)
  .filter(([slot,item])=>slot!=='weapon'&&item&&typeof item.id==='string');
 if(!equipment.length)return null;
 // Compare the loss of a REAL item already owned, not a made-up upgrade.
 const withBudget=equipment.filter(([,item])=>valid(item.v013Budget));
 const options=withBudget.length?withBudget:equipment;
 options.sort((a,b)=>(Number(b[1].v013Budget)||0)-(Number(a[1].v013Budget)||0)||
  a[0].localeCompare(b[0]));
 const [slot,item]=options[0];
 return {slot,id:item.id,rarity:item.rarity,budget:valid(item.v013Budget)?item.v013Budget:null,
  subtype:item.subtype,starter:!!item.startingGear};
}
function withoutOneItem(snap,pick){
 if(!pick||pick.slot==='weapon'||!snap.state.equip[pick.slot]||
  snap.state.equip[pick.slot].id!==pick.id)
  throw Error('Can only remove a real currently equipped non-weapon item');
 const alt=copy(snap);
 alt.state.equip[pick.slot]=null;
 if(!alt.state.equip.weapon||alt.state.automaticTalents.xp!==snap.xp)
  throw Error('Counterfactual gear fixture changed native progression');
 return alt;
}
function scenarioSet(snap,index,seed){
 const f=snap.state.automaticTalents.nodes
  .find(x=>x.startsWith('affinity_'))?.slice('affinity_'.length)||'blood';
 if(!D.FAMILIES.includes(f))throw Error('Unknown earned Affinity '+f);
 const elite=D.ELITES[(index+seed+snap.level)%D.ELITES.length];
 return [
  {id:'normal-1',type:'normal',size:1,realm:f},
  {id:'normal-3',type:'normal',size:3,realm:f},
  {id:elite,type:'elite',realm:f},
  {id:'boss-'+f,type:'boss',realm:f}
 ];
}
function short(x){
 return {
  won:!!x.won,died:!!x.died,timeout:!!x.timedOut,
  seconds:valid(x.seconds)?round(x.seconds):null,
  endHpPct:valid(x.hpMax)&&x.hpMax>0?round(100*x.hpEnd/x.hpMax):null,
  minHpPct:valid(x.minHpPct)?x.minHpPct:null,
  dmgDealt:x.damageDealt,dmgTaken:x.damageTaken,absorbed:x.absorbed,
  manaSpent:x.manaSpent,infusionHits:x.infusionHits,fundedCasts:x.fundedCasts,
  power:round(x.heroBaseStats.power),
  hp:round(x.heroBaseStats.maxhp),attack:round(x.heroBaseStats.attack),
  defense:round(x.heroBaseStats.defense),
  spell:round(x.heroBaseStats.spellPower),
  atksPerSec:round(x.heroBaseStats.attacksPerSec)
 };
}
function match(snap,scenario,seed,pick){
 const earned=D.native(snap,scenario,seed,false);
 const reduced=D.native(withoutOneItem(snap,pick),scenario,seed,false);
 // Staging must NOT alter opponents, risk, Condition, timing rules or RNG
 // between the native earned and isolated one-item-removed variants.
 for(const key of ['level','resolvedSeed','seedShift','nativeEncounter',
  'initialEnemies','initialRoles','roster','bossId','eliteType','risk','affinity','plannedConditionId']){
  if(JSON.stringify(earned[key])!==JSON.stringify(reduced[key]))
   throw Error('Stage6.36 nonmatching enemy fixture '+key+' '+scenario.id+' E'+snap.level);
 }
 if(earned.gearFingerprint===reduced.gearFingerprint||
  earned.talentXp!==snap.xp||reduced.talentXp!==snap.xp||
  earned.talentPointsEarned!==snap.talentEarned||reduced.talentPointsEarned!==snap.talentEarned||
  JSON.stringify(earned.controlledTalentNodes)!==JSON.stringify(reduced.controlledTalentNodes))
  throw Error('Stage6.36 counterfactual changed progression or failed to vary gear');
 const a=short(earned),b=short(reduced);
 const jointlyWon=a.won&&b.won&&a.seconds>0&&b.seconds>0;
 const timeSavedPct=jointlyWon?round(100*(b.seconds-a.seconds)/b.seconds):null;
 return {E:snap.level,scenario:scenario.id,type:scenario.type,
  realm:scenario.realm,group:scenario.size||null,seed,removed:pick,
  nativeAccountState:true,comparativeItemRemoval:true,earned:a,minusItem:b,
  bothWon:jointlyWon,winFlip:a.won&&!b.won,reverseFlip:!a.won&&b.won,
  savedTimePct:timeSavedPct,
  powerGainPct:valid(b.power)&&b.power>0?round(100*(a.power/b.power-1)):null,
  enemyIdentityMatched:true};
}
function cohort(cfg){
 if(PROFILES.some(id=>!B.PROFILES[id])||JOBS.length!==24)
  throw Error('Stage6.36 stratified legal profile census drift');
 const {id,seed}=JOBS[cfg.batch],snapshots=new Map();
 const settings={...N.DEFAULTS,seeds:[seed],profiles:[id],
  maxLevel:cfg.maxLevel,maxAttempts:cfg.maxAttempts,maxTotalAttempts:cfg.maxTotalAttempts};
 const account=N.simulateAccount(seed,id,settings,{
  researchProfiles:B.PROFILES,decisionModel:'adaptive',onCamp:probe=>{
   if(!LEVELS.includes(probe.level)||probe.attempt!==1)return null;
   const snap=D.checkpoint(probe,LEVELS);
   if(snapshots.has(snap.level))throw Error('Duplicate natural Stage6.36 E'+snap.level);
   snapshots.set(snap.level,snap);
   return null;
  }
 });
 const errors=account.attempts.filter(a=>a.error&&a.error!=='Native combat timeout');
 if(errors.length)throw Error('Native natural-account error '+JSON.stringify(errors.map(x=>x.error)));
 const rows=[],skipped=[];
 for(const E of LEVELS){
  const snap=snapshots.get(E);
  if(!snap){skipped.push({E,reason:'not naturally unlocked'});continue;}
  const first=account.attempts.find(a=>a.level===E&&a.attempt===1);
  if(!first||first.before?.xp!==snap.xp||first.before?.earned!==snap.talentEarned)
   throw Error('Stage6.36 checkpoint not actually earned by account '+id+'/E'+E);
  const pick=bestOwnedNonWeapon(snap);
  if(!pick){skipped.push({E,reason:'no eligible owned non-weapon gear'});continue;}
  const scenarios=scenarioSet(snap,cfg.batch,seed);
  for(const [i,scenario] of scenarios.entries()){
   const fightSeed=(6360001+seed*47+E*283+cfg.batch*619+i*719)>>>0;
   rows.push(match(snap,scenario,fightSeed,pick));
  }
 }
 return {stage:'6.36',kind:'cohort',source:S.sourceFingerprint().sha256,
  settings:cfg,complete:cfg.maxLevel===200&&cfg.maxAttempts===12&&cfg.maxTotalAttempts===400,
  id,seed,profileFamily:B.PROFILES[id].families[0],
  strategy:id.startsWith('smart-')?'planner':'preexisting',
  account:{endLevel:account.endLevel,attempts:account.attempts.length,
   stops:account.stopReason,observed:[...snapshots.keys()],skipped,
   timeoutAttempts:account.attempts.filter(x=>x.error==='Native combat timeout').length},
  rows,errors:0};
}
function outcome(rows,key){
 const xs=rows.map(x=>x[key]);
 const wins=xs.filter(x=>x.won).length,deaths=xs.filter(x=>x.died).length,
  timeouts=xs.filter(x=>x.timeout).length;
 return {n:xs.length,wins,deaths,timeouts,
  winPctResolved:pct(wins,wins+deaths),
  medianWinSeconds:med(xs.filter(x=>x.won).map(x=>x.seconds)),
  medianWinEndHpPct:med(xs.filter(x=>x.won).map(x=>x.endHpPct))};
}
function group(rows){
 const measurable=rows.filter(x=>x.bothWon);
 const power=rows.filter(x=>x.powerGainPct!==null);
 return {n:rows.length,
  earned:outcome(rows,'earned'),minusOneOwnedItem:outcome(rows,'minusItem'),
  itemPowerGainPct:B.distribution(power.map(x=>x.powerGainPct)),
  bothWon:measurable.length,
  savedTimePct:B.distribution(measurable.map(x=>x.savedTimePct)),
  timeImprovementAtLeast5Pct:measurable.length?
   pct(measurable.filter(x=>x.savedTimePct>=5).length,measurable.length):null,
  timeImprovementAtLeast10Pct:measurable.length?
   pct(measurable.filter(x=>x.savedTimePct>=10).length,measurable.length):null,
  winFlips:rows.filter(x=>x.winFlip).length,
  reverseFlips:rows.filter(x=>x.reverseFlip).length,
  smallPowerDeltaExamples:rows.filter(x=>x.powerGainPct!==null&&
    x.powerGainPct>=0&&x.powerGainPct<=1.5).length
 };
}
function aggregate(shards){
 if(!shards.length)throw Error('Missing Stage6.36 paired native evidence');
 const source=new Set(shards.map(x=>x.source)),seen=new Set(),rows=[];
 for(const shard of shards){
  if(shard.stage!=='6.36'||shard.kind!=='cohort'||!shard.complete||shard.errors||
   shard.settings.maxLevel!==200||shard.settings.maxAttempts!==12||
   shard.settings.maxTotalAttempts!==400)throw Error('Incomplete Stage6.36 shard');
  const key=shard.id+'|'+shard.seed;
  if(!JOBS.some(x=>x.id===shard.id&&x.seed===shard.seed)||seen.has(key))
   throw Error('Unknown/duplicate native account '+key);
  seen.add(key);
  if(shard.rows.some(r=>!r.nativeAccountState||!r.enemyIdentityMatched||!r.comparativeItemRemoval||
   !LEVELS.includes(r.E)||!KINDS.includes(r.type==='normal'?
    r.group===1?'solo':r.group===3?'trio':'bad':r.type)))
   throw Error('Mislabelled or unpaired native combat row '+key);
  rows.push(...shard.rows.map(x=>({...x,id:shard.id,accountSeed:shard.seed,
   profileFamily:shard.profileFamily,strategy:shard.strategy})));
 }
 if(seen.size!==JOBS.length||source.size!==1)throw Error(
  'Incomplete or mixed-source Stage6.36 cohort '+seen.size+'/'+JOBS.length+' sources='+source.size);
 const perE=LEVELS.map(E=>{
  const sub=rows.filter(x=>x.E===E);
  return {E,accounts:shards.filter(x=>x.account.observed.includes(E)).length,
   comparisons:sub.length,all:group(sub),
   normalSolo:group(sub.filter(x=>x.type==='normal'&&x.group===1)),
   normalTrio:group(sub.filter(x=>x.type==='normal'&&x.group===3)),
   elite:group(sub.filter(x=>x.type==='elite')),
   boss:group(sub.filter(x=>x.type==='boss')),
   byStrategy:Object.fromEntries(['planner','preexisting'].map(s=>[
    s,group(sub.filter(x=>x.strategy===s))]))};
 });
 const byElite=Object.fromEntries(D.ELITES.map(id=>[id,group(rows.filter(r=>r.type==='elite'&&r.scenario===id))]));
 const byBoss=Object.fromEntries(D.FAMILIES.map(f=>[f,group(rows.filter(r=>r.type==='boss'&&r.realm===f))]));
 return {stage:'6.36',kind:'aggregate',
  source:[...source][0],
  coverage:{accounts:shards.length,profiles:PROFILES.length,seeds:SEEDS,
   actualReachedE200:perE.at(-1).accounts,
   actualStages:perE.map(x=>({E:x.E,accounts:x.accounts,comparisons:x.comparisons})),
   nativeCombatPairs:rows.length,nativeReplays:rows.length*2,
   mixedRosterPairs:0},
  perE,byElite,byBoss,rows,limits:[
   'These 24 accounts use 12 diverse natural strategies and two seeds; they are a deliberately selected diagnostic sample, NOT the 500-account Stage6.35 full growth census or representative player population.',
   'Every actual player state was observed at first Camp before the first attempt at the legal native Expedition. Unreached levels are CENSORED and produce no staged fight.',
   'Normal 1, Normal 3, one of eight Elites and a natural-affinity Boss are CONTROLLED first-ring native fights at Risk 1; they are not naturally traversed rooms and do not imply Expedition completion.',
   'The counterfactual differs solely by UNEQUIPPING one genuinely owned non-weapon item (largest native v013Budget or first available starter). It is NOT a hypothetical upgraded item or another earned account.',
   'Enemy roster, initial HP, attack, role, AI, realm, native mechanics, seed and Condition were checked identical in each pair. Both runs keep earned XP, attributes, TalentGraph and other gear.',
   'Only fights where BOTH variants won contribute to percent combat-time saved. Wins that flip, losses and timeouts are reported separately; censoring losses avoids fabricated time-to-kill improvements.',
   'A win flip after removal does not prove the gear is a +1% marginal upgrade: real earned items can contribute much more than 1%. Small-Power examples have explicit n counts.',
   'Each replay is one RNG seed per case; broad claims about optimal human strategies, individual Boss strength and target rates require more matched seeds and account policies.',
   'The UI Power score is NOT a combat-effective universal measure. Compare native combat time, death, remaining HP, spells and different enemy types before setting enemy growth.',
   'No gameplay constants, player stats, Enemy growth, loot, item rarity, affix budgets, XP, unlocks, rewards or published Pages were changed.'
  ]};
}
const fmt=x=>x===null||x===undefined?'—':typeof x==='number'?String(round(x)):String(x);
function markdown(x){
 const out=['# Stage 6.36 — Actual item importance and native combat perceptibility','',
  'NO gameplay changes. **An owned non-weapon item is removed ONLY inside an isolated matched combat counterfactual.**','',
  'Source fingerprint: '+x.source,'',
  '## Coverage and matched fights','',
  'Accounts: '+x.coverage.accounts+' (12 diverse strategies × 2 seeds), native combat pairs: '+x.coverage.nativeCombatPairs+
  ', replays: '+x.coverage.nativeReplays,'',
  '| E | Earned accounts | Matched pairs | Real win % (resolved) | Without item win % (resolved) | Median item Power premium % | Both-win TTK improvement % | Win flips earned vs no item |',
  '|---:|---:|---:|---:|---:|---:|---:|---:|'];
 for(const r of x.perE){
  const g=r.all;
  out.push('| E'+r.E+' | '+r.accounts+' | '+g.n+' | '+
   fmt(g.earned.winPctResolved)+' | '+fmt(g.minusOneOwnedItem.winPctResolved)+
   ' | '+fmt(g.itemPowerGainPct.median)+' | '+fmt(g.savedTimePct.median)+
   ' | '+g.winFlips+' |');
 }
 out.push('','## Interpreting marginal perceptibility','',
  'Combat time reduction is calculated only when both variants win. 5% and 10% are descriptive thresholds, not claims that all players perceive them. A 1% Power gain is NOT automatically a 1% DPS gain.','',
  '### Individual enemy family and group diagnostics','',
  '| Enemy type | n | Native win % | No-item win % | Both-win combat time reduction median % |',
  '|---|---:|---:|---:|---:|');
 for(const [name,g] of [
  ['Solo',group(x.rows.filter(r=>r.type==='normal'&&r.group===1))],
  ['Trio',group(x.rows.filter(r=>r.type==='normal'&&r.group===3))],
  ...D.ELITES.map(id=>['Elite '+id,x.byElite[id]]),
  ...D.FAMILIES.map(id=>['Boss '+id,x.byBoss[id]])
 ]){
  out.push('| '+name+' | '+g.n+' | '+fmt(g.earned.winPctResolved)+' | '+
   fmt(g.minusOneOwnedItem.winPctResolved)+' | '+fmt(g.savedTimePct.median)+' |');
 }
 out.push('','## Limitations','',...x.limits.map(s=>'- '+s),'',
  'Decision: measure effective build delta and survival before calibrating common enemy-reference slope or tuning individual enemy base statistics. No direct enemy rate changes authorized by the instrumentation alone.','');
 return out.join('\n');
}
function main(argv=process.argv.slice(2)){
 const cfg=parse(argv),result=cfg.mode==='cohort'?cohort(cfg):aggregate(
  fs.readdirSync(cfg.inputs).filter(x=>/^v013-stage636-cohort-\d+\.json$/.test(x))
   .map(name=>JSON.parse(fs.readFileSync(path.join(cfg.inputs,name),'utf8'))));
 fs.mkdirSync(path.dirname(cfg.out),{recursive:true});
 fs.writeFileSync(cfg.out,JSON.stringify(result,null,2)+'\n');
 if(cfg.mode==='aggregate')fs.writeFileSync(cfg.out.replace(/\.json$/,'.md'),markdown(result)+'\n');
 console.log('STAGE636='+JSON.stringify(cfg.mode==='cohort'?{
  profile:result.id,seed:result.seed,reached:result.account.observed,
  paired:result.rows.length,complete:result.complete}:result.coverage));
 return result;
}
module.exports={LEVELS,PROFILES,SEEDS,JOBS,KINDS,parse,bestOwnedNonWeapon,withoutOneItem,
 scenarioSet,short,match,cohort,outcome,group,aggregate,markdown,main};
if(require.main===module){try{main();}catch(e){console.error('STAGE636_ERROR '+String(e.stack||e));process.exitCode=1;}}
