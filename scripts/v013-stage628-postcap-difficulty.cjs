'use strict';
// Stage 6.28 — E1→E200 difficulty sweep with genuinely earned Camp snapshots.
// Native enemies/gear/talents/attributes. The paired "no post-cap stats"
// alternative is a labelled, isolated counterfactual (NOT an earned account).
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const N=require('./v013-natural-progression.cjs');
const S=require('./simulate-progression.cjs');
const T=globalThis.WandererAutomaticTalents;
const FAMILIES=Object.freeze(['blood','decay','vitality','aegis','fury','magic']);
const ELITES=Object.freeze(['tank','berserker','vampire','caster','gravecaller',
 'oathbound_exarch','briarspine_horror','ashen_executioner']);
const LEVELS=Object.freeze([1,5,20,35,55,70,100,150,200]);
const BANDS=Object.freeze([[1,5],[6,20],[21,35],[36,55],[56,70],[71,100],[101,150],[151,200]]);
const GROUPS=Object.freeze([1,2,3,6,12]);
const SHA=s=>crypto.createHash('sha256').update(typeof s==='string'?s:JSON.stringify(s)).digest('hex');
const clone=x=>JSON.parse(JSON.stringify(x));
const pct=(wins,n)=>n?Number((100*wins/n).toFixed(1)):null;
const mean=a=>a.length?Number((a.reduce((n,v)=>n+v,0)/a.length).toFixed(1)):null;
const med=a=>{const z=a.filter(Number.isFinite).sort((a,b)=>a-b);if(!z.length)return null;const m=z.length>>1;return z.length%2?z[m]:(z[m-1]+z[m])/2};
const safePath=p=>typeof p==='string'&&/^reports\/[a-z0-9-]+\.json$/.test(p);
function parse(args=process.argv.slice(2)){
 const cfg={seed:9861,profile:'cautious',maxLevel:200,maxAttempts:24,
  maxTotalAttempts:360,trials:1,mode:'cohort',
  out:'reports/v013-stage628-postcap-9861-cautious.json',inputs:null};
 for(const a of args){
  const m=/^--([a-z-]+)=(.+)$/.exec(a);if(!m)throw Error('Invalid Stage6.28 CLI '+a);
  const k=m[1],v=m[2];
  if(k==='seed')cfg.seed=Number(v);
  else if(k==='profile')cfg.profile=v;
  else if(k==='max-level')cfg.maxLevel=Number(v);
  else if(k==='max-total-attempts')cfg.maxTotalAttempts=Number(v);
  else if(k==='max-attempts')cfg.maxAttempts=Number(v);
  else if(k==='trials')cfg.trials=Number(v);
  else if(k==='mode')cfg.mode=v;
  else if(k==='inputs')cfg.inputs=v;
  else if(k==='out')cfg.out=v;
  else throw Error('Unknown Stage6.28 argument '+k);
 }
 if(!['cohort','aggregate'].includes(cfg.mode)||!safePath(cfg.out))throw Error('Invalid Stage6.28 mode/output');
 if(cfg.mode==='aggregate'){
  if(!/^reports\/[a-z0-9/-]+$/.test(cfg.inputs||'')||cfg.inputs.includes('..'))
   throw Error('Unsafe Stage6.28 shards');
  return cfg;
 }
 if(!Number.isSafeInteger(cfg.seed)||cfg.seed<1||cfg.seed>1000000||
  !N.PROFILES[cfg.profile]||!Number.isSafeInteger(cfg.maxLevel)||cfg.maxLevel<5||cfg.maxLevel>200||
  !Number.isSafeInteger(cfg.maxAttempts)||cfg.maxAttempts<1||cfg.maxAttempts>36||
  !Number.isSafeInteger(cfg.maxTotalAttempts)||cfg.maxTotalAttempts<10||cfg.maxTotalAttempts>400||
  !Number.isSafeInteger(cfg.trials)||cfg.trials<1||cfg.trials>3)
  throw Error('Invalid Stage6.28 sample bounds');
 return cfg;
}
function checkpoint({a,seed,profile,level,attempt},extraCheckpointLevels=[]){
 if(!(LEVELS.includes(level)||extraCheckpointLevels.includes(level))||attempt!==1)return null;
 const s=a.state(),p=s.automaticTalents,g=a.controller().state;
 if(g.unlocked!==level||!T.valid(p)||T.earned(p)!==Math.min(100,Math.floor(p.xp/100)))
  throw Error('Stage6.28 does not accept unearned or invalid Camp checkpoint');
 const equip=clone(s.equip),gear=Object.values(equip).filter(Boolean);
 if(!equip.weapon||gear.some(x=>!x.id||!x.slot||!x.rarity))throw Error('Invalid native gear checkpoint E'+level);
 const state={level,unlocked:g.unlocked,equip,automaticTalents:clone(p),
  runes:clone(s.runes||[]),runeSlots:clone(s.runeSlots||[])};
 for(const id of state.runeSlots)if(id&&!state.runes.some(r=>r.id===id))
  throw Error('Invented/missing equipped Rune in native account');
 const stats=a.baseStats();
 return {seed,profile:profile.name,level,attempt,state,
  xp:p.xp,characterLevel:Math.floor(p.xp/T.POINT_XP)+1,
  talentEarned:T.earned(p),talentSpent:p.nodes.length,
  attributeEarned:T.attributeBudget(p),attributeSpent:T.spentAttributes(p),
  attributes:T.attributes(p),
  statSnapshot:Object.fromEntries(['str','agi','int','end','cha','attack','defense',
   'maxhp','attacksPerSec','spellPower','crit','blockChance','blockReduction','evasionRating','mana','manaRegen','wardBonus','barrierPower','healingPower','manaCostReduction','power'].map(k=>[k,stats[k]??null])),
  equipPieces:gear.length,starterPieces:gear.filter(x=>x.startingGear).length,
  equippedRarity:Object.fromEntries([...new Set(gear.map(x=>x.rarity))]
   .map(r=>[r,gear.filter(x=>x.rarity===r).length])),
  fingerprint:SHA(state)};
}
function collect(cfg,{moduleOverrides=null,allowNativeCombatTimeouts=false}={}){
 const snapshots=new Map();
 const opts={...N.DEFAULTS,seeds:[cfg.seed],profiles:[cfg.profile],
  maxLevel:cfg.maxLevel,maxAttempts:cfg.maxAttempts,
  maxTotalAttempts:cfg.maxTotalAttempts};
 const natural=N.run(opts,{decisionModel:'adaptive',
  ...(moduleOverrides?{moduleOverrides}:{}),onCamp:probe=>{
  const c=checkpoint(probe,cfg.extraCheckpointLevels||[]);if(c){
   const key=c.level;
   if(snapshots.has(key))throw Error('Duplicate E'+key+' natural Camp checkpoint');
   snapshots.set(key,c);
  }
 }});
 const naturalErrors=natural.accounts.flatMap(a=>a.attempts.filter(x=>x.error)
  .map(x=>({E:x.level,attempt:x.attempt,error:x.error,
   stack:x.diagnostic?.stack?.slice(0,1000)})));
 const nativeCombatTimeouts=naturalErrors.filter(x=>x.error==='Native combat timeout');
 if(natural.coverage.errors&&(!allowNativeCombatTimeouts||
  naturalErrors.some(x=>x.error!=='Native combat timeout')||
  naturalErrors.length!==natural.coverage.errors))
  throw Error('Native natural-account failures '+JSON.stringify(naturalErrors));
 // A bounded unresolved encounter is CENSORED in optional Stage6.30 studies.
 // Never count it as a victory, defeat, successful unlock or engine regression.
 if(nativeCombatTimeouts.length&&
  nativeCombatTimeouts.some(x=>!Number.isInteger(x.E)||x.E<1))
  throw Error('Native timeout missing Expedition identity');
 const account=natural.accounts[0];
 if(natural.accounts.length!==1||account.seed!==cfg.seed||account.profile!==cfg.profile)
  throw Error('Unexpected natural cohort composition');
 for(const [E,c] of snapshots){
  const first=account.attempts.find(x=>x.level===E&&x.attempt===1);
  if(!first||first.before.xp!==c.xp||first.before.earned!==c.talentEarned||
   first.before.attributeSpent!==c.attributeSpent||
   JSON.stringify(first.before.attributes)!==JSON.stringify(c.attributes)||
   JSON.stringify(first.before.talentNodes)!==JSON.stringify(c.state.automaticTalents.nodes))
   throw Error('Natural E'+E+' checkpoint drifted from actual first attempt');
 }
 const reached=[...new Set([...LEVELS,...(cfg.extraCheckpointLevels||[])])]
  .sort((a,b)=>a-b).filter(E=>snapshots.has(E));
 if(reached.length===0||reached[0]!==1)throw Error('No E1 snapshot');
 const checkpoints=reached.map(E=>snapshots.get(E));
 return {account,checkpoints,natural,nativeCombatTimeouts};
}
function build(snap){
 const fam=snap.state.automaticTalents.nodes
  .filter(x=>/^affinity_/.test(x)).map(x=>x.slice('affinity_'.length));
 return {id:'earned-E'+snap.level+'-'+snap.seed+'-'+snap.profile,
  weapon:snap.state.equip.weapon.subtype,families:fam.length?fam:['blood'],skills:[]};
}
function fixtures(snap,without=false){
 const original=snap.state;
 const state=without?{...original,automaticTalents:{
  ...original.automaticTalents,attributes:{}}}:original;
 if(!T.valid(state.automaticTalents)||T.earned(state.automaticTalents)!==snap.talentEarned)
  throw Error('Invalid native earned/counterfactual XP or Talents');
 return {mode:'encounter',points:snap.talentEarned,
  gear:'current',rarity:'Common',runes:false,contracts:'none',
  targetPolicy:'mechanics',measure:true,tickLimit:6500,
  lockScenarioStreams:true,controlledTalents:state.automaticTalents,
  earnedCheckpoint:state};
}
function record(x){
 return {win:!!x.won,loss:!!x.died,timeout:!!x.timedOut,
  seconds:x.seconds,damageTaken:x.damageTaken,damageDealt:x.damageDealt,
  hpStart:x.hpStart,hpMax:x.hpMax,hpEnd:x.hpEnd,
  atk:x.heroBaseStats.attack,def:x.heroBaseStats.defense,
  str:x.heroBaseStats.str,agi:x.heroBaseStats.agi,
  int:x.heroBaseStats.int,end:x.heroBaseStats.end,cha:x.heroBaseStats.cha,
  mana:x.mpMax,spell:x.heroBaseStats.spellPower,power:x.heroBaseStats.power,
  enemies:x.initialEnemies,roles:x.initialRoles,
  rosterHp:x.roster.reduce((n,e)=>n+e.maxHp,0),
  leaderHp:x.roster[0]?.maxHp??null,leaderAtk:x.roster[0]?.attack??null,
  boss:x.bossId??null,elite:x.eliteType??null,
  gearFingerprint:x.gearFingerprint,seed:x.resolvedSeed,
  risk:x.risk,realm:x.affinity,condition:x.plannedConditionId,
  attributeEarned:x.permanentAttributesEarned,
  attributeSpent:x.permanentAttributesSpent,
  attributes:x.permanentAttributes};
}
function native(snap,scenario,seed,without=false){
 const opts=fixtures(snap,without);
 if(scenario.type==='elite')opts.stage619EliteType=scenario.id;
 const kind=scenario.type==='normal'||scenario.type==='tank'?'normal':scenario.type;
 const x=S.encounter(snap.level,build(snap),seed,kind,opts,undefined,undefined,
  scenario.realm,1,kind==='normal'?scenario.size:undefined);
 const checks={
  level:x.level===snap.level,kind:x.nativeEncounter===kind,
  talentBudget:x.pointsBudget===snap.talentEarned,
  earnedXP:x.talentXp===snap.xp,earnedTalents:x.talentPointsEarned===snap.talentEarned,
  earnedStatBudget:x.permanentAttributesEarned===snap.attributeEarned,
  spentStats:x.permanentAttributesSpent===(without?0:snap.attributeSpent),
  allocatedSTR:x.permanentAttributes.str===(without?0:(snap.attributes.str||0)),
  nativeAffinity:x.affinity===scenario.realm,nativeRisk:x.risk===1,
  nativeOffhand:x.offhandType===(snap.state.equip.offhand?.subtype||null),
  treeUnchanged:JSON.stringify(x.controlledTalentNodes)===JSON.stringify(snap.state.automaticTalents.nodes),
  statProjection:Number.isFinite(x.heroBaseStats.attack)
 };
 const failures=Object.entries(checks).filter(([,ok])=>!ok).map(([key])=>key);
 if(failures.length)throw Error('Invalid native earned-stat fixture '+scenario.id+' E'+snap.level+
  ': '+failures.join(', ')+'; actual='+JSON.stringify({level:x.level,kind:x.nativeEncounter,
   budget:x.pointsBudget,XP:x.talentXp,earned:x.talentPointsEarned,
   attrBudget:x.permanentAttributesEarned,attrSpent:x.permanentAttributesSpent,
   attrs:x.permanentAttributes,affinity:x.affinity,risk:x.risk,
   offhand:x.offhandType,stats:x.heroBaseStats}).slice(0,850));
 if(scenario.type==='elite'&&x.eliteType!==scenario.id)throw Error('Wrong native named Elite');
 if(kind==='normal'&&x.initialEnemies!==scenario.size)throw Error('Wrong normal group size');
 if(scenario.type==='tank'&&x.initialRoles?.tank!==1)
  throw Error('A Tank must be an actual native solo Tank, not an arbitrary mob');
 return x;
}
function paired(snap,scenario,seed){
 const enhanced=native(snap,scenario,seed,false);
 const baseline=snap.attributeSpent>0?native(snap,scenario,seed,true):null;
 if(baseline){
  const fields=['gearFingerprint','otherGearFingerprint','resolvedSeed','seedShift','affinity',
   'risk','plannedConditionId','nativeEncounter','initialEnemies','eliteType','bossId',
   'talentXp','talentPointsEarned','pointsBudget','pointsSpent'];
  for(const key of fields)if(JSON.stringify(enhanced[key])!==JSON.stringify(baseline[key]))
   throw Error('Stage6.28 paired native baseline drift '+key+' '+scenario.id+' E'+snap.level);
  if(JSON.stringify(enhanced.roster)!==JSON.stringify(baseline.roster))
   throw Error('Different enemy AI/HP/ATK at same initial native seed');
  if(JSON.stringify(enhanced.controlledTalentNodes)!==JSON.stringify(baseline.controlledTalentNodes))
   throw Error('Different earned TalentGraph in paired counterfactual');
 }
 return {id:scenario.id,type:scenario.type,realm:scenario.realm,
  E:snap.level,seed,attributes:snap.attributeSpent,
  actual:record(enhanced),noStats:baseline?record(baseline):null,
  identicalByConstruction:!baseline,enemyIdentityVerified:!!baseline};
}
function windows(attempts){
 const tally=arr=>{const fights=arr.flatMap(x=>x.rooms||[]),kinds=['combat','elite','boss'];
  const groups=Object.fromEntries(kinds.map(k=>{
   const rs=fights.filter(x=>x.roomType===k);
   return [k,{n:rs.length,wins:rs.filter(x=>x.won).length,
    deaths:rs.filter(x=>x.died).length,timeouts:rs.filter(x=>x.timedOut).length,
    winPct:pct(rs.filter(x=>x.won).length,rs.length)}];
  }));
  return {attempts:arr.length,bossWins:arr.filter(x=>x.bossWon).length,
   deaths:arr.filter(x=>x.status==='defeat').length,
   extractions:arr.filter(x=>x.status==='extracted').length,
   fights:fights.length,groups};
 };
 return BANDS.map(([lo,hi])=>({band:'E'+lo+'–E'+hi,from:lo,to:hi,
  ...tally(attempts.filter(x=>x.level>=lo&&x.level<=hi))}));
}
function scenarios(snap){
 const first=snap.state.automaticTalents.nodes.find(x=>x.startsWith('affinity_'));
 const realm=first?first.slice(9):'blood';
 const scenarios=[
  ...GROUPS.map(size=>({id:'group-'+size,type:'normal',size,realm})),
  ...ELITES.map(id=>({id,type:'elite',realm})),
  ...FAMILIES.map(f=>({id:'boss-'+f,type:'boss',realm:f}))
 ];
 return scenarios;
}
function audit(cfg){
 if(T.MAX_POINTS!==100||T.POINT_XP!==100)throw Error('Unexpected native Talent XP cap');
 const source=S.sourceFingerprint().sha256,{account,checkpoints,natural,nativeCombatTimeouts}=collect(cfg,
  {allowNativeCombatTimeouts:cfg.allowNativeCombatTimeouts===true});
 if(natural.source!==source)throw Error('Natural and combat runtime source mismatch');
 const rows=[],tanks=[];
 for(const snap of checkpoints){
  const seed=6280011+snap.seed*101+snap.level*283;
  for(let trial=0;trial<cfg.trials;trial++){
   const initialSeed=seed+trial*37717;
   for(const scenario of scenarios(snap))
    rows.push(paired(snap,scenario,initialSeed));
   // A Tank is an actual native solo role, not automatically every solo.
   // Record missing matched tanks as UNSAMPLED, never invent or force a role.
   let found=null,scanned=0;
   for(let scan=0;scan<14;scan++){
    scanned++;
    const trialSeed=initialSeed+scan*83;
    const candidate=native(snap,{id:'tank',type:'normal',size:1,realm:scenarios(snap)[0].realm},trialSeed);
    if(candidate.initialRoles?.tank===1){found=trialSeed;break;}
   }
   if(found!==null){
    const sample=paired(snap,{id:'solo-tank',type:'tank',size:1,realm:scenarios(snap)[0].realm},found);
    rows.push(sample);tanks.push({E:snap.level,seed:found,found:true,scanned});
   }else tanks.push({E:snap.level,seed:initialSeed,found:false,scanned});
  }
 }
 const out={stage:'6.28',kind:'earned-Camp-checkpoints-matched-native-enemy-matrix',
  source,settings:cfg,account:{
   seed:cfg.seed,profile:cfg.profile,attempts:account.attempts.length,
   endLevel:account.endLevel,stopReason:account.stopReason,
   bossWins:account.attempts.filter(x=>x.bossWon).length,startingXp:account.startXp,finalXp:account.xp},
  checkpointLevels:checkpoints.map(x=>x.level),
  checkpoints:checkpoints.map(({state,...rest})=>({
   ...rest,gearFingerprint:SHA(state.equip),talentFingerprint:SHA(state.automaticTalents.nodes),
   state})),
  naturalWindowDifficulty:windows(account.attempts),
  matchedFights:rows,tankFinds:tanks,
  coverage:{nativeAccountAttempts:account.attempts.length,
   checkpoints:checkpoints.length,encounters:rows.length,
   nativeFights:rows.length+rows.filter(r=>r.noStats).length+
     tanks.reduce((n,x)=>n+x.scanned,0),
   counterfactualFights:rows.filter(r=>r.noStats).length,
   searchedSoloTankFights:tanks.reduce((n,x)=>n+x.scanned,0),
   missingTanks:tanks.filter(x=>!x.found).length,
   naturalCombatTimeouts:nativeCombatTimeouts.length,
   errors:0},
  limits:[
   'Natural account progression is genuinely earned from E1, and missed Expeditions are censored.',
   'Matched fights reuse exact earned Camp gear, runes, talent nodes, XP and post-100 STR/AGI/INT/END/CHA.',
   'Enemy encounters are CONTROLLED first-ring native fights at Risk 1, without earned boss preparation, consumables or Boons.',
   'The no-attributes matched arm is an explicitly synthetic counterfactual, not a historical pre-change account.',
   'Only one encounter seed per Level/character and 1–3 trials; small per-Boss sample sizes cannot set final tuning.',
   'Normal solo is not a Tank. Solo Tank appears only when native role matches; missing ones are unsampled.',
   'Native agent policies are deterministic heuristics, not verified real-player decisions.',
   'Optional bounded natural combat timeouts are CENSORED, not wins, losses, or game engine errors.',
   'Rarity distribution is actually earned. This study does not substitute arbitrary Epic gear for starter/loot gear.'
  ]};
 return out;
}
function byType(rows,key){
 const a=rows.map(r=>r[key]||(r.identicalByConstruction?r.actual:null))
  .filter(Boolean),wins=a.filter(x=>x.win).length,loss=a.filter(x=>x.loss).length,
  timeout=a.filter(x=>x.timeout).length;
 return {n:a.length,wins,losses:loss,timeouts:timeout,
  winPct:pct(wins,a.length),winPctResolved:pct(wins,wins+loss),
  damageMedian:med(a.map(x=>x.damageTaken)),
  hpMedian:med(a.map(x=>x.hpMax)),
  leaderHpMedian:med(a.map(x=>x.leaderHp))};
}
function summary(shards){
 const rows=shards.flatMap(x=>x.matchedFights),cp=shards.flatMap(x=>x.checkpoints);
 const levels=[...new Set(rows.map(r=>r.E))].sort((a,b)=>a-b);
 const kinds=['group-1','group-2','group-3','group-6','group-12','solo-tank',
  ...ELITES.map(id=>'elite:'+id),...FAMILIES.map(f=>'boss:'+f)];
 function ident(r){return r.type==='elite'?'elite:'+r.id:
  r.type==='boss'?'boss:'+r.realm:r.id;}
 function one(rows){
  return {real:byType(rows,'actual'),withoutPostcap:byType(rows,'noStats')};
 }
 const perE=levels.map(E=>{
  const sub=rows.filter(x=>x.E===E),s=cp.filter(x=>x.level===E);
  const individual=Object.fromEntries(kinds.map(k=>[k,one(sub.filter(x=>ident(x)===k))]));
  return {E,accounts:s.length,earnedTalentMedian:med(s.map(x=>x.talentEarned)),
   talentSpentMedian:med(s.map(x=>x.talentSpent)),
   attributeEarnedMedian:med(s.map(x=>x.attributeEarned)),
   attributeSpentMedian:med(s.map(x=>x.attributeSpent)),
   actualByKind:individual,
   normal1:one(sub.filter(r=>r.id==='group-1')),
   normal3:one(sub.filter(r=>r.id==='group-3')),
   normal6:one(sub.filter(r=>r.id==='group-6')),
   normal12:one(sub.filter(r=>r.id==='group-12')),
   tanks:one(sub.filter(r=>r.type==='tank')),
   elites:one(sub.filter(r=>r.type==='elite')),
   bosses:one(sub.filter(r=>r.type==='boss'))};
 });
 const bands=BANDS.map(([lo,hi])=>{
  const from=shards.flatMap(x=>x.naturalWindowDifficulty.filter(y=>y.from===lo&&y.to===hi));
  const names=['combat','elite','boss'];
  return {band:'E'+lo+'–E'+hi,accountsObserved:from.filter(x=>x.attempts>0).length,
   attempts:from.reduce((n,x)=>n+x.attempts,0),
   bossWins:from.reduce((n,x)=>n+x.bossWins,0),
   ...Object.fromEntries(names.map(k=>{
    const n=from.reduce((a,x)=>a+x.groups[k].n,0),wins=from.reduce((a,x)=>a+x.groups[k].wins,0),
     deaths=from.reduce((a,x)=>a+x.groups[k].deaths,0);
    return [k,{n,wins,deaths,winPct:pct(wins,n)}];
   }))};
 });
 return {stage:'6.28',kind:'aggregate-earned-and-controlled-counterfactual',
  sources:[...new Set(shards.map(x=>x.source))],cohorts:shards.length,
  coverage:{naturalAccounts:shards.length,nativeAttempts:shards.reduce((n,x)=>n+x.account.attempts,0),
   matchedScenarios:rows.length,actualFights:rows.length,
   pairedCounterfactualFights:rows.filter(x=>x.noStats).length,
   bossFights:rows.filter(x=>x.type==='boss').length,
   eliteFights:rows.filter(x=>x.type==='elite').length,
   tankFights:rows.filter(x=>x.type==='tank').length,
   errors:shards.reduce((n,x)=>n+x.coverage.errors,0),
   E200Reached:shards.filter(x=>x.checkpointLevels.includes(200)).length},
  checkpoints:perE,naturalBands:bands,
  cohorts:shards.map(x=>({seed:x.account.seed,profile:x.account.profile,
   endLevel:x.account.endLevel,attempts:x.account.attempts,
   E100Talent:x.checkpoints.find(c=>c.level===100)?.talentEarned??null,
   E200Stats:x.checkpoints.find(c=>c.level===200)?.attributeSpent??null,
   stopReason:x.account.stopReason})),
  caveats:['Observed wins in matched Arena are not full-Dungeon clear rates.',
   'One Boss per family per character and checkpoint per trial is a tiny sample.',
   'Difficulty gaps reflect archetypes, real gear rarity, affixes, skills, targeting and no-preparation, not just postcap stats.',
   'Elites and bosses are deliberately matched vs SAME Hero/gear/Talents/seed per family; normal-group roles remain native.',
   'No gameplay balance coefficients were modified.']};
}
function markdown(r){
 const fmt=x=>x.n?x.wins+'/'+x.n+' ('+x.winPct+'%)':'—';
 const a=['# Stage 6.28 — Post-cap XP/attributes and real difficulty curve E1→E200','',
  '**Full native earned accounts** plus labelled paired counterfactual no-attributes at the *same native combat seed*. No enemy rebalance.','',
  'Game source SHA-256: '+r.sources.join(', '),
  'Native accounts: '+r.coverage.naturalAccounts+'; attempts '+r.coverage.nativeAttempts+
  '; checkpoints '+r.checkpoints.length+'; controlled native fights '+(r.coverage.actualFights+r.coverage.pairedCounterfactualFights),
  'E200 naturally reached: '+r.coverage.E200Reached+'/'+r.coverage.naturalAccounts,'',
  '| E | Talent earned | Talent spent | Post-cap stats invested | Normal 1 | Normal 3 | Normal 6 | Normal 12 | Tanks | Elites | Bosses |',
  '|---:|---:|---:|---:|---|---|---|---|---|---|---|'];
 for(const x of r.checkpoints)a.push('| E'+x.E+' | '+x.earnedTalentMedian+' | '+x.talentSpentMedian+
  ' | '+x.attributeSpentMedian+' | '+fmt(x.normal1.real)+' | '+fmt(x.normal3.real)+
  ' | '+fmt(x.normal6.real)+' | '+fmt(x.normal12.real)+' | '+fmt(x.tanks.real)+
  ' | '+fmt(x.elites.real)+' | '+fmt(x.bosses.real)+' |');
 a.push('','## Actual win rates: with versus without post-100 attribute allocation (matched native fights)','',
  '| E | Group 3 with / without | Elite with / without | Boss with / without |',
  '|---:|---|---|---|');
 for(const x of r.checkpoints)a.push('| E'+x.E+' | '+fmt(x.normal3.real)+' / '+fmt(x.normal3.withoutPostcap)+
  ' | '+fmt(x.elites.real)+' / '+fmt(x.elites.withoutPostcap)+
  ' | '+fmt(x.bosses.real)+' / '+fmt(x.bosses.withoutPostcap)+' |');
 a.push('','## Natural dungeon fights; full economy, routes, rewards, preparations and extractions','',
  '| Band | Active accounts | Attempts | Regular wins | Elite wins | Boss wins |',
  '|---|---:|---:|---|---|---|');
 for(const b of r.naturalBands)
  a.push('| '+b.band+' | '+b.accountsObserved+' | '+b.attempts+
   ' | '+fmt(b.combat)+' | '+fmt(b.elite)+' | '+fmt(b.boss)+' |');
 a.push('','## Exact named Elites and Affinity Bosses','');
 for(const x of r.checkpoints){
  a.push('### E'+x.E+' — '+x.accounts+' earned character(s)');
  for(const [name,v] of Object.entries(x.actualByKind))
   if(name.startsWith('elite:')||name.startsWith('boss:'))
    a.push('- '+name+': '+fmt(v.real)+'; no-attributes '+fmt(v.withoutPostcap));
 }
 a.push('','## Account and sampling limitations','',
  ...r.cohorts.map(c=>'- '+c.profile+' seed '+c.seed+': unlocked E'+c.endLevel+
   ', '+c.attempts+' native attempts, E200 invested stats: '+(c.E200Stats??'censored')+
   (c.stopReason?' ('+c.stopReason+')':'')),
  ...r.caveats.map(c=>'- '+c),'',
  '**Decision:** This report diagnoses the curve; no automatic enemy buffs/nerfs.','');
 return a.join('\n');
}
function write(out,obj){if(!safePath(out))throw Error('Unsafe output path');
 const dest=path.resolve(out);fs.mkdirSync(path.dirname(dest),{recursive:true});
 fs.writeFileSync(dest,JSON.stringify(obj,null,2)+'\n');return dest;}
function main(argv=process.argv.slice(2)){
 const cfg=parse(argv);
 let report;
 if(cfg.mode==='cohort'){
  report=audit(cfg);
  const global=summary([report]);
  write(cfg.out,report);
  fs.writeFileSync(cfg.out.replace(/\.json$/,'.md'),markdown(global)+'\n');
  console.log('STAGE628='+JSON.stringify({source:report.source,account:report.account,
   coverage:report.coverage,snapshotE:report.checkpointLevels,
   E200:global.checkpoints.find(x=>x.E===200)||null,
   checkpoints:global.checkpoints.map(x=>({E:x.E,talents:x.earnedTalentMedian,
    stats:x.attributeSpentMedian,normal3:x.normal3.real,elites:x.elites.real,
    bosses:x.bosses.real,bossNoStats:x.bosses.withoutPostcap.real})),
   naturalBands:global.naturalBands}));
 }else{
  const dir=path.resolve(cfg.inputs);
  const files=fs.readdirSync(dir).filter(x=>/^v013-stage628-postcap-\d+-[a-z-]+\.json$/.test(x));
  if(!files.length)throw Error('No Stage6.28 cohort shards in '+cfg.inputs);
  const shards=files.map(f=>JSON.parse(fs.readFileSync(path.join(dir,f),'utf8')));
  if(shards.some(x=>x.stage!=='6.28'||x.kind!=='earned-Camp-checkpoints-matched-native-enemy-matrix'||
   x.coverage.errors)||new Set(shards.map(x=>x.source)).size!==1)
   throw Error('Mixed or invalid Stage6.28 cohort shards');
  if(new Set(shards.map(x=>x.account.seed+'|'+x.account.profile)).size!==shards.length)
   throw Error('Duplicate Stage6.28 seed/profile');
  report=summary(shards);
  write(cfg.out,report);fs.writeFileSync(cfg.out.replace(/\.json$/,'.md'),markdown(report)+'\n');
  console.log('STAGE628_AGG='+JSON.stringify({coverage:report.coverage,
   curve:report.checkpoints.map(x=>({E:x.E,stats:x.attributeSpentMedian,
    normal3:x.normal3.real.winPct,elite:x.elites.real.winPct,
    boss:x.bosses.real.winPct,
    eliteNoStats:x.elites.withoutPostcap.winPct,bossNoStats:x.bosses.withoutPostcap.winPct})),
   natural:report.naturalBands}));
 }
 return report;
}
module.exports={FAMILIES,ELITES,LEVELS,BANDS,GROUPS,parse,checkpoint,collect,build,
 fixtures,record,native,paired,windows,scenarios,audit,summary,markdown,main};
if(require.main===module){try{main();}catch(e){console.error('STAGE628_ERROR '+String(e.stack||e));process.exitCode=1;}}
