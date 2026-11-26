'use strict';
// Stage 6.32 — measure REAL player progression; no gameplay balance changes.
// Every sample is an E1-born native account. No synthetic XP, gear, unlocks or DPS.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const N=require('./v013-natural-progression.cjs');
const D=require('./v013-stage628-postcap-difficulty.cjs');
const PLANNER=require('./v013-build-planner.cjs');
const S=require('./simulate-progression.cjs');
const LEVELS=Object.freeze(Array.from({length:20},(_,i)=>i+1));
const ORIGINAL_IDS=Object.keys(N.PROFILES).sort();
const PLANS=Object.keys(PLANNER.BUILDS).sort();
const METRICS=Object.freeze(['maxhp','attack','defense','spellPower','attacksPerSec','crit','blockChance','evasionRating','power']);
const VARIANTS=Object.freeze({
 heavy:{armor:'Plate',risk:0,target:'mechanics',healAt:.76,retreatAt:.50},
 skirmish:{armor:'Leather',risk:1,target:'focus',healAt:.46,retreatAt:.23},
 caster:{armor:'Cloth',risk:0,target:'mechanics',healAt:.63,retreatAt:.41},
 bold:{risk:2,target:'focus',healAt:.37,retreatAt:.16}
});
function researchProfile(planId,variant){
 const origin=N.PROFILES['smart-'+planId],plan=PLANNER.BUILDS[planId],v=VARIANTS[variant];
 if(!origin||!plan||!v)throw Error('Invalid research template '+planId+'/'+variant);
 const weapons=variant==='skirmish'?[plan.weapons.at(-1)]:
  variant==='caster'&&plan.weapons.some(w=>['Wand','Staff'].includes(w))?
   plan.weapons.filter(w=>['Wand','Staff'].includes(w)):
  variant==='bold'?plan.weapons.slice(0,1):[...plan.weapons];
 return Object.freeze({...origin,...v,plan:planId,weapons,armor:v.armor||origin.armor,
  name:'Research '+planId+' / '+variant,researchGearPreference:true,
  cohortVariant:variant,shop:true});
}
const RESEARCH=Object.freeze(Object.fromEntries([
 ...['heavy','skirmish','caster'].flatMap(variant=>PLANS.map(id=>[
  'research-'+variant+'-'+id,researchProfile(id,variant)])),
 ...['blood-pure','arcane-arcane-pure','radiance-pure'].map(id=>[
  'research-bold-'+id,researchProfile(id,'bold')])
]));
const PROFILES=Object.freeze({...N.PROFILES,...RESEARCH});
const IDS=Object.freeze([...ORIGINAL_IDS,...Object.keys(RESEARCH).sort()]);
const BATCHES=Object.freeze(Array.from({length:20},(_,i)=>
 Object.freeze(IDS.slice(i*5,i*5+5))));
const SEEDS=Object.freeze([9861,9863,9865,9867,9869]);
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const round=(x,n=3)=>Number(x.toFixed(n));
const valid=x=>typeof x==='number'&&Number.isFinite(x);
const percentile=(values,p)=>{
 const a=values.filter(valid).sort((x,y)=>x-y);
 if(!a.length)return null;
 const i=(a.length-1)*p,lo=Math.floor(i),hi=Math.ceil(i);
 return round(a[lo]+(a[hi]-a[lo])*(i-lo));
};
function distribution(values){
 const a=values.filter(valid);
 return {n:a.length,p25:percentile(a,.25),median:percentile(a,.5),
  mean:a.length?round(a.reduce((s,x)=>s+x,0)/a.length):null,
  p75:percentile(a,.75)};
}
function settings(argv=process.argv.slice(2)){
 const cfg={mode:'cohort',batch:0,seed:9861,take:5,maxLevel:20,
  maxAttempts:12,maxTotalAttempts:240,out:'reports/v013-stage632-cohort-0-9861.json',
  inputs:'reports/stage632-shards'};
 for(const arg of argv){
  const m=/^--([a-z-]+)=(.+)$/.exec(arg);
  if(!m)throw Error('Unsupported Stage 6.32 argument '+arg);
  const [,k,value]=m;
  if(['mode','out','inputs'].includes(k))cfg[k]=value;
  else if(['batch','seed','take','max-level','max-attempts','max-total-attempts'].includes(k))
   cfg[k.replace(/-([a-z])/g,(_,ch)=>ch.toUpperCase())]=Number(value);
  else throw Error('Unsupported Stage 6.32 argument '+k);
 }
 if(!['cohort','aggregate'].includes(cfg.mode)||
    !/^reports\/v013-stage632-[a-z0-9-]+\.json$/.test(cfg.out)||
    !/^reports\/[a-z0-9/-]+$/.test(cfg.inputs)||cfg.inputs.includes('..'))
  throw Error('Unsafe Stage 6.32 output');
 if(cfg.mode==='cohort'&&(!Number.isInteger(cfg.batch)||cfg.batch<0||cfg.batch>=BATCHES.length||
    !SEEDS.includes(cfg.seed)||!Number.isInteger(cfg.take)||cfg.take<1||cfg.take>5||
    !Number.isInteger(cfg.maxLevel)||cfg.maxLevel<1||cfg.maxLevel>20||
    !Number.isInteger(cfg.maxAttempts)||cfg.maxAttempts<1||cfg.maxAttempts>36||
    !Number.isInteger(cfg.maxTotalAttempts)||cfg.maxTotalAttempts<1||cfg.maxTotalAttempts>400))
  throw Error('Invalid cohort settings');
 return cfg;
}
// Only first Camp entry at an ACTUALLY unlocked Expedition. Each snapshot is
// immutable observational data. The native runner verifies the probe did not
// alter XP, equipment, Gold, inventory, Talents or unlocks.
function observation(probe){
 const snap=D.checkpoint(probe,LEVELS);
 if(!snap)throw Error('Missing first-attempt earned Camp checkpoint E'+probe.level);
 const base=probe.a.baseStats(),s=probe.a.state();
 return {E:snap.level,seed:probe.seed,profile:probe.profile.name,
  xp:snap.xp,talentEarned:snap.talentEarned,talentSpent:snap.talentSpent,
  attributeEarned:snap.attributeEarned,attributeSpent:snap.attributeSpent,
  nodes:[...s.automaticTalents.nodes],element:s.automaticTalents.element||null,
  prepared:s.automaticTalents.prepared||null,
  attributes:snap.attributes,gearCount:snap.equipPieces,starterGear:snap.starterPieces,
  gearRarity:snap.equippedRarity,gearFingerprint:snap.fingerprint,
  weapon:s.equip.weapon?.subtype||null,offhand:s.equip.offhand?.subtype||null,
  armor:s.equip.armor?.armorType||null,
  stats:Object.fromEntries(METRICS.map(k=>[k,valid(base[k])?round(base[k],6):null]))};
}
function performance(account,E){
 const attempts=account.attempts.filter(a=>a.level===E);
 const rooms=attempts.flatMap(a=>a.rooms||[]);
 const completed=rooms.filter(r=>r.won&&r.seconds>0&&!r.timedOut&&
  valid(r.damageDealt)&&valid(r.damageTaken));
 const normal=completed.filter(r=>r.roomType==='combat');
 const forRooms=rs=>{
  const seconds=rs.reduce((s,r)=>s+r.seconds,0);
  const dealt=rs.reduce((s,r)=>s+r.damageDealt,0);
  const affected=rs.reduce((s,r)=>s+(r.observedNonFocusedHealthLost||0),0);
  return {fights:rs.length,seconds:round(seconds),observedDps:seconds?round(dealt/seconds):null,
   nonFocusedDamagePerSec:seconds?round(affected/seconds):null,
   minHpPct:distribution(rs.map(r=>r.minHpPct)),
   damageTaken:distribution(rs.map(r=>r.damageTaken))};
 };
 return {attempts:attempts.length,bossWins:attempts.filter(a=>a.bossWon).length,
  errors:attempts.filter(a=>a.error||a.status==='error').map(a=>a.error||a.status),
  normal:forRooms(normal),solo:forRooms(normal.filter(r=>r.initialEnemies===1)),
  small:forRooms(normal.filter(r=>r.initialEnemies>=2&&r.initialEnemies<=4)),
  swarm:forRooms(normal.filter(r=>r.initialEnemies>=5)),
  elite:forRooms(completed.filter(r=>r.roomType==='elite')),
  boss:forRooms(completed.filter(r=>r.roomType==='boss'))};
}
function cohort(cfg){
 if(IDS.length!==100||new Set(IDS).size!==100||ORIGINAL_IDS.length!==34||PLANS.length!==21)
  throw Error('Stage 6.32 agent catalogue drift; expected 34 existing + 66 legal variations');
 const profiles=BATCHES[cfg.batch].slice(0,cfg.take),accounts=[];
 for(const id of profiles){
  const checkpoints=[];
  const profile=PROFILES[id];
  const opts={...N.DEFAULTS,seeds:[cfg.seed],profiles:[id],
   maxLevel:cfg.maxLevel,maxAttempts:cfg.maxAttempts,
   maxTotalAttempts:cfg.maxTotalAttempts};
  const account=N.simulateAccount(cfg.seed,id,opts,{
   researchProfiles:PROFILES,decisionModel:'adaptive',
   onCamp:probe=>{
    if(probe.attempt!==1)return null;
    const obs=observation(probe);
    if(checkpoints.some(x=>x.E===obs.E))throw Error('Repeated E'+obs.E+' checkpoint');
    checkpoints.push(obs);return null;
   }
  });
  const bad=account.attempts.filter(a=>a.error&&a.error!=='Native combat timeout');
  if(bad.length)throw Error('Unexpected native simulator errors '+id+': '+JSON.stringify(bad.map(a=>a.error)));
  if(!checkpoints.length||checkpoints[0].E!==1||
   checkpoints.some(x=>!account.attempts.some(a=>a.level===x.E&&a.attempt===1&&
    a.before?.xp===x.xp&&a.before?.earned===x.talentEarned)))
   throw Error('Checkpoint provenance did not match E1-born account '+id);
  const encountered=checkpoints.map(x=>({...x,fights:performance(account,x.E)}));
  const observedIds=new Set(encountered.map(x=>x.E));
  if(observedIds.size!==encountered.length)throw Error('Duplicate checkpoint');
  accounts.push({id,variant:profile.cohortVariant||'existing',plan:profile.plan||null,
   family:profile.families[0],families:profile.families,armorPreference:profile.armor,
   weaponPreference:profile.weapons,riskPreference:profile.risk,
   source:'native-earned-account',endLevel:account.endLevel,stopReason:account.stopReason,
   attempts:account.attempts.length,checkpoints:encountered,
   censoredAt:LEVELS.filter(E=>E<=cfg.maxLevel&&!observedIds.has(E))});
  process.stdout.write('STAGE632_ACCOUNT='+JSON.stringify({id,seed:cfg.seed,
   observed:encountered.length,endLevel:account.endLevel,attempts:account.attempts.length})+'\n');
 }
 return {stage:'6.32',kind:'cohort',source:S.sourceFingerprint().sha256,
  complete:cfg.take===5&&cfg.maxLevel===20&&cfg.maxTotalAttempts>=240,
  settings:cfg,expected:profiles,accounts,
  coverage:{accounts:accounts.length,checkpoints:accounts.reduce((s,a)=>s+a.checkpoints.length,0),
   errors:0}};
}
function describePairs(accounts,E,field){
 const pairs=accounts.flatMap(a=>{
  const curr=a.checkpoints.find(x=>x.E===E),next=a.checkpoints.find(x=>x.E===E+1);
  if(!curr||!next)return [];
  let v0=curr.stats[field],v1=next.stats[field];
  if(field==='observedDps'){v0=curr.fights.normal.observedDps;v1=next.fights.normal.observedDps;}
  if(!valid(v0)||!valid(v1)||v0<=0)return [];
  return [{id:a.id,seed:a.seed,pct:100*(v1/v0-1)}];
 });
 return {pairs:pairs.length,...distribution(pairs.map(x=>x.pct))};
}
function aggregate(shards){
 if(IDS.length!==100)throw Error('Profile catalogue drift');
 const expected=new Set(SEEDS.flatMap(seed=>IDS.map(id=>id+'|'+seed))),seen=new Set(),accounts=[];
 let source=null;
 for(const x of shards){
  if(x.stage!=='6.32'||x.kind!=='cohort'||!x.complete||x.coverage.errors||
   x.accounts.length!==5||x.settings.take!==5||
   x.settings.maxLevel!==20)throw Error('Invalid incomplete Stage 6.32 shard');
  if(source!==null&&source!==x.source)throw Error('Mixed native game fingerprints');
  source=x.source;
  for(const a of x.accounts){
   const key=a.id+'|'+x.settings.seed;
   if(!expected.has(key)||seen.has(key))throw Error('Duplicate or unexpected account '+key);
   seen.add(key);accounts.push({...a,seed:x.settings.seed});
  }
 }
 if(seen.size!==expected.size)
  throw Error('Incomplete Stage 6.32 cohort '+seen.size+'/'+expected.size+
   '; missing '+[...expected].filter(x=>!seen.has(x)).slice(0,6).join(','));
 const levels=LEVELS.map(E=>{
  const rows=accounts.map(a=>a.checkpoints.find(x=>x.E===E)).filter(Boolean);
  const metricSummary=Object.fromEntries(METRICS.map(field=>[
   field,distribution(rows.map(x=>x.stats[field]))]));
  const observedDps=distribution(rows.map(x=>x.fights.normal.observedDps));
  return {E,reached:rows.length,censored:accounts.length-rows.length,
   actuallyEarned:distribution(rows.map(x=>x.talentEarned)),
   rarityAndGear:distribution(rows.map(x=>x.gearCount)),
   stats:metricSummary,normalObservedDps:observedDps};
 });
 const growth=LEVELS.slice(0,-1).map(E=>{
  const paired=accounts.filter(a=>a.checkpoints.some(x=>x.E===E)&&a.checkpoints.some(x=>x.E===E+1));
  return {from:E,to:E+1,paired:paired.length,attr:Object.fromEntries(
   [...METRICS,'observedDps'].map(k=>[k,describePairs(paired,E,k)]))};
 });
 const originals=accounts.filter(a=>a.variant==='existing').length;
 return {stage:'6.32',kind:'aggregate',source,cohort:{distinctProfiles:IDS.length,originalProfiles:ORIGINAL_IDS.length,
   researchVariants:Object.keys(RESEARCH).length,seeds:SEEDS,nativeAccounts:accounts.length,
   originalAccounts:originals,accountsReachedE2:levels[1].reached,
   accountsReachedE20:levels.at(-1).reached,
   totalCheckpoints:levels.reduce((s,x)=>s+x.reached,0)},
  levels,growth,accounts:accounts.map(a=>({id:a.id,seed:a.seed,variant:a.variant,
   plan:a.plan,family:a.family,armorPreference:a.armorPreference,
   weaponPreference:a.weaponPreference,progressedTo:a.endLevel,
   observed:a.checkpoints.map(x=>x.E),stopReason:a.stopReason})),
  caveats:[
   'Every player starts at real E1 with real drops, XP, Camp purchases, talent allocations and unlocks. No level or gear has been fabricated.',
   'E2–E20 samples include ONLY accounts that legitimately unlocked the level; unreached data are censored, not counted as zero power.',
   'The 100 profiles are 34 existing plus 66 new legal gear/risk/strategy variants drawn from 21 valid talent plans. They are NOT 100 independently designed talent trees.',
   'DPS is observational damage in completed natural fights divided by their elapsed combat seconds. Changing enemies, mechanics and target selection confound cross-E comparisons.',
   'Non-focused health loss per second is a lower-bound AoE proxy; enemy despawns and healing within ticks may cause undercounting.',
   'Max HP, DEF, block, evade, barriers and healing do not combine linearly into an honest EHP index; this report does not invent a universal power number.',
   'Solo, small and swarm fight metrics are kept separate. DPS means of mixed fights must not be used as a sole scaling target.',
   'Changes between consecutive Expeditions are within-player paired observations, not cross-sectional means. Report number of pairs and distribution.',
   'These heuristic agents and seed distribution are not a measured representative population of real players.',
   'No enemy curves, elite/boss multipliers, mechanics or rewards were changed. No recommendation to rebalance without sufficient E-level coverage.'
  ]};
}
const fmt=x=>x===null||x===undefined?'—':String(x);
function markdown(x){
 const a=['# Stage 6.32 — Real, earned player power progression (100 profiles × 5 seeds)','',
  'Status: measurement and diagnosis ONLY; enemy and gameplay difficulty unchanged.','',
  'Native source fingerprint: '+x.source,
  'Accounts: '+x.cohort.nativeAccounts+'; legitimate checkpoints: '+x.cohort.totalCheckpoints+
  '; reached E2: '+x.cohort.accountsReachedE2+'; reached E20: '+x.cohort.accountsReachedE20,'',
  '## Snapshot medians by Expedition (only reached E)','',
  '| E | Players | Talent points | HP | ATK | DEF | Spell | Attacks/s | UI Power (diagnostic) | Observed natural DPS |',
  '|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|'];
 for(const r of x.levels)a.push('| E'+r.E+' | '+r.reached+' | '+fmt(r.actuallyEarned.median)+
  ' | '+fmt(r.stats.maxhp.median)+' | '+fmt(r.stats.attack.median)+
  ' | '+fmt(r.stats.defense.median)+' | '+fmt(r.stats.spellPower.median)+
  ' | '+fmt(r.stats.attacksPerSec.median)+' | '+fmt(r.stats.power.median)+
  ' | '+fmt(r.normalObservedDps.median)+' |');
 a.push('','## Same-character increases, previous Expedition → next Expedition','',
  '| Transition | Paired players | HP p25/median/p75 % | ATK p25/median/p75 % | DEF p25/median/p75 % | Normal observed DPS p25/median/p75 % |',
  '|---|---:|---|---|---|---|');
 const span=d=>d.n?fmt(d.p25)+' / '+fmt(d.median)+' / '+fmt(d.p75)+' ('+d.n+')':'—';
 for(const r of x.growth)a.push('| E'+r.from+' → E'+r.to+' | '+r.paired+
  ' | '+span(r.attr.maxhp)+' | '+span(r.attr.attack)+
  ' | '+span(r.attr.defense)+' | '+span(r.attr.observedDps)+' |');
 a.push('','## Interpretation and limitations','',
  ...x.caveats.map(c=>'- '+c),'',
  'Decision: no exponential enemy-rate change is authorized by these data alone.','');
 return a.join('\n');
}
function main(argv=process.argv.slice(2)){
 const cfg=settings(argv);
 let out;
 if(cfg.mode==='cohort')out=cohort(cfg);
 else{
  const names=fs.readdirSync(cfg.inputs).filter(f=>/^v013-stage632-cohort-\d+-\d+\.json$/.test(f));
  const shards=names.map(n=>JSON.parse(fs.readFileSync(path.join(cfg.inputs,n),'utf8')));
  out=aggregate(shards);
 }
 fs.mkdirSync(path.dirname(cfg.out),{recursive:true});
 fs.writeFileSync(cfg.out,JSON.stringify(out,null,2)+'\n');
 if(cfg.mode==='aggregate')fs.writeFileSync(cfg.out.replace(/\.json$/,'.md'),markdown(out)+'\n');
 process.stdout.write('STAGE632='+JSON.stringify(cfg.mode==='aggregate'?out.cohort:
  {accounts:out.coverage.accounts,checkpoints:out.coverage.checkpoints,complete:out.complete})+'\n');
 return out;
}
module.exports={LEVELS,ORIGINAL_IDS,PLANS,METRICS,VARIANTS,RESEARCH,PROFILES,IDS,BATCHES,SEEDS,
 researchProfile,settings,observation,performance,distribution,describePairs,cohort,aggregate,markdown,main};
if(require.main===module){try{main();}catch(e){console.error('STAGE632_ERROR '+String(e.stack||e));process.exitCode=1;}}
