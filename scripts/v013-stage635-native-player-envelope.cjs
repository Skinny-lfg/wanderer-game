'use strict';
// Wanderer v0.13 — Stage 6.35: measure same-account, naturally-earned player
// growth up to E200 BEFORE choosing any further enemy scale.
// NO native gameplay changes, XP grants, gear grants, Boss shortcuts or unlocks.
const fs=require('node:fs'),path=require('node:path');
const N=require('./v013-natural-progression.cjs');
const D=require('./v013-stage628-postcap-difficulty.cjs');
const S=require('./simulate-progression.cjs');
const B=require('./v013-stage632-player-power.cjs');
const KINDS=Object.freeze(['maxhp','attack','defense','spellPower','attacksPerSec',
 'crit','blockChance','evasionRating','power','basicAttackThroughput','equippedBudget']);
const ITEM_STATS=Object.freeze(['atk','def','hp','spd','str','agi','int','end','cha','mana','spell',
 'evasionRating','critBonus','blockBonus','manaRegenBonus','wardBonus']);
const RARITIES=Object.freeze(['Common','Uncommon','Rare','Epic','Legendary']);
const valid=v=>typeof v==='number'&&Number.isFinite(v);
const dist=B.distribution;
const round=(v,p=3)=>Number(v.toFixed(p));
function settings(args=process.argv.slice(2)){
 const cfg={mode:'cohort',batch:0,seed:9861,take:5,maxLevel:200,maxAttempts:12,
  maxTotalAttempts:400,out:'reports/v013-stage635-cohort-0-9861.json',
  inputs:'reports/stage635-shards'};
 for(const arg of args){
  const m=/^--([a-z-]+)=(.+)$/.exec(arg);
  if(!m)throw Error('Unsupported Stage6.35 argument '+arg);
  if(['mode','out','inputs'].includes(m[1]))cfg[m[1]]=m[2];
  else if(['batch','seed','take','max-level','max-attempts','max-total-attempts'].includes(m[1]))
   cfg[m[1].replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=Number(m[2]);
  else throw Error('Unsupported Stage6.35 argument '+m[1]);
 }
 if(!['cohort','aggregate'].includes(cfg.mode)||
  !/^reports\/v013-stage635-[a-z0-9-]+\.json$/.test(cfg.out)||
  !/^reports\/[a-z0-9/-]+$/.test(cfg.inputs)||cfg.inputs.includes('..'))
  throw Error('Unsafe Stage6.35 output or mode');
 if(cfg.mode==='cohort'&&(!Number.isInteger(cfg.batch)||cfg.batch<0||cfg.batch>=20||
  !B.SEEDS.includes(cfg.seed)||!Number.isInteger(cfg.take)||cfg.take<1||cfg.take>5||
  !Number.isInteger(cfg.maxLevel)||cfg.maxLevel<1||cfg.maxLevel>200||
  !Number.isInteger(cfg.maxAttempts)||cfg.maxAttempts<1||cfg.maxAttempts>36||
  !Number.isInteger(cfg.maxTotalAttempts)||cfg.maxTotalAttempts<1||cfg.maxTotalAttempts>2000))
  throw Error('Invalid Stage6.35 natural cohort constraints');
 return cfg;
}
function observation(probe){
 if(probe.attempt!==1)throw Error('Stage6.35 may only sample first Camp entry');
 const snap=D.checkpoint(probe,[probe.level]);
 if(!snap||snap.level!==probe.level||snap.unlocked!==undefined)
  throw Error('Stage6.35 checkpoint requires legal unlocked Expedition');
 const gear=Object.values(snap.state.equip).filter(Boolean);
 const stats=probe.a.baseStats();
 const metrics=Object.fromEntries(KINDS.filter(k=>k!=='basicAttackThroughput'&&k!=='equippedBudget')
  .map(k=>[k,valid(stats[k])?round(stats[k],6):null]));
 if(!valid(metrics.maxhp)||metrics.maxhp<=0||!valid(metrics.power)||metrics.power<=0||
  !valid(metrics.attack)||!valid(metrics.attacksPerSec))
  throw Error('Invalid native player stats at E'+probe.level);
 const withBudget=gear.filter(x=>valid(x.v013Budget)),rawBudget=withBudget.reduce((s,x)=>s+x.v013Budget,0);
 metrics.basicAttackThroughput=round(metrics.attack*metrics.attacksPerSec,6);
 metrics.equippedBudget=round(rawBudget,6);
 const itemTotals=Object.fromEntries(ITEM_STATS.map(key=>[key,round(
  gear.reduce((sum,item)=>sum+(valid(item[key])?item[key]:0),0),6)]));
 return {E:snap.level,xp:snap.xp,earnedTalents:snap.talentEarned,
  spentTalents:snap.talentSpent,spentAttributes:snap.attributeSpent,
  equipped:gear.length,starter:gear.filter(x=>x.startingGear).length,
  itemBudgetKnown:withBudget.length,itemBudgetMissing:gear.length-withBudget.length,
  rarities:Object.fromEntries(RARITIES.map(r=>[r,gear.filter(x=>x.rarity===r).length])),
  equipment:snap.state.equip&&Object.entries(snap.state.equip)
   .filter(([,x])=>!!x).map(([slot,x])=>({slot,id:x.id,rarity:x.rarity,
    tier:x.tier,startingGear:!!x.startingGear,budget:valid(x.v013Budget)?x.v013Budget:null,
    subtype:x.subtype||null,trait:x.v013Trait||null,legendaryId:x.legendaryId||null})),
  gearFingerprint:snap.fingerprint,
  itemTotals,metrics,
  selectedAffinity:probe.profile.families[0],weapon:snap.state.equip.weapon?.subtype||null,
  armor:snap.state.equip.armor?.armorType||null};
}
function accountRow(id,seed,account,checkpoints){
 const first=account.attempts[0];
 if(!first||first.level!==1||first.attempt!==1||
  checkpoints[0]?.E!==1||new Set(checkpoints.map(x=>x.E)).size!==checkpoints.length)
  throw Error('Missing or duplicate E1-born native checkpoints '+id);
 for(const obs of checkpoints){
  const before=account.attempts.find(a=>a.level===obs.E&&a.attempt===1)?.before;
  if(!before||before.xp!==obs.xp||before.earned!==obs.earnedTalents||
   before.attributeSpent!==obs.spentAttributes||
   !before.gear?.items||before.gear.items.length!==obs.equipped)
   throw Error('Stage6.35 checkpoint not earned in native account '+id+'/E'+obs.E);
 }
 const profile=B.PROFILES[id];
 return {id,seed,variant:profile.cohortVariant||'existing',plan:profile.plan||null,
  family:profile.families[0],armorPreference:profile.armor,
  endLevel:account.endLevel,reached:[...account.reached],
  attempts:account.attempts.length,stopReason:account.stopReason,checkpoints};
}
function cohort(cfg){
 if(B.IDS.length!==100||B.BATCHES.length!==20||B.SEEDS.length!==5)
  throw Error('Stage6.32 legal agent catalog missing');
 const accounts=[];
 for(const id of B.BATCHES[cfg.batch].slice(0,cfg.take)){
  const checkpoints=[];
  const opts={...N.DEFAULTS,seeds:[cfg.seed],profiles:[id],
   maxLevel:cfg.maxLevel,maxAttempts:cfg.maxAttempts,
   maxTotalAttempts:cfg.maxTotalAttempts};
  const account=N.simulateAccount(cfg.seed,id,opts,{
   researchProfiles:B.PROFILES,decisionModel:'adaptive',onCamp:probe=>{
    if(probe.attempt!==1)return null;
    const cp=observation(probe);
    if(checkpoints.length&&cp.E<=checkpoints.at(-1).E)throw Error('Non-monotone earned checkpoint');
    checkpoints.push(cp);return null;
   }
  });
  const failures=account.attempts.filter(a=>a.error&&a.error!=='Native combat timeout');
  if(failures.length)throw Error('Native player growth simulator error '+id+' '+JSON.stringify(failures.map(x=>x.error)));
  accounts.push(accountRow(id,cfg.seed,account,checkpoints));
  console.log('STAGE635_ACCOUNT='+JSON.stringify({id,seed:cfg.seed,
   reached:checkpoints.length,unlocked:account.endLevel,
   attempts:account.attempts.length,stop:account.stopReason}));
 }
 return {stage:'6.35',kind:'cohort',source:S.sourceFingerprint().sha256,
  settings:cfg,complete:cfg.take===5&&cfg.maxLevel===200&&cfg.maxAttempts===12&&cfg.maxTotalAttempts===400,
  accounts,errors:0};
}
function difference(a,b){
 // Positive increases, negatives and zero are ALL retained. Zero denominator
 // cannot yield a percent; distribution excludes these as missing, not 0%.
 return valid(a)&&valid(b)&&a>0?round(100*(b/a-1),6):null;
}
function paired(a,b){
 if(a.E+1!==b.E)throw Error('Nonconsecutive native checkpoint pair');
 const old=new Map(a.equipment.map(x=>[x.slot,x])),next=new Map(b.equipment.map(x=>[x.slot,x]));
 const changed=[...new Set([...old.keys(),...next.keys()])]
  .filter(slot=>old.get(slot)?.id!==next.get(slot)?.id);
 const usableDelta=a.itemBudgetMissing===0&&b.itemBudgetMissing===0;
 return {E:a.E,
  changes:changed.length,gearReplaced:changed.length>0,
  itemBudgetDelta:usableDelta?round(b.metrics.equippedBudget-a.metrics.equippedBudget):null,
  talentDelta:b.earnedTalents-a.earnedTalents,
  attributeDelta:b.spentAttributes-a.spentAttributes,
  values:Object.fromEntries(KINDS.map(k=>[k,difference(a.metrics[k],b.metrics[k])]))};
}
const safeSummary=pairs=>({
  n:pairs.length,
  medians:Object.fromEntries(KINDS.map(k=>[k,dist(pairs.map(p=>p.values[k]))])),
  equipmentChanges:dist(pairs.map(p=>p.changes)),
  gearChanged: pairs.length?round(100*pairs.filter(p=>p.gearReplaced).length/pairs.length):null,
  equippedBudgetDelta:dist(pairs.map(p=>p.itemBudgetDelta)),
  talentPointsAdded:dist(pairs.map(p=>p.talentDelta)),
  attributePointsAdded:dist(pairs.map(p=>p.attributeDelta))
});
function aggregate(shards,opts={}){
 if(!Array.isArray(shards)||!shards.length)throw Error('No Stage6.35 shards');
 const expected=new Set(B.IDS.flatMap(id=>B.SEEDS.map(seed=>id+'|'+seed)));
 const seen=new Set(),accounts=[],sources=new Set();
 for(const shard of shards){
  if(shard.stage!=='6.35'||shard.kind!=='cohort'||shard.errors||
   shard.complete!==true||shard.accounts.length!==5||shard.settings.take!==5||
   shard.settings.maxLevel!==200||shard.settings.maxAttempts!==12||
   shard.settings.maxTotalAttempts!==400)
   throw Error('Incomplete or nonnative Stage6.35 shard');
  sources.add(shard.source);
  for(const a of shard.accounts){
   const id=a.id+'|'+a.seed;
   if(!expected.has(id)||seen.has(id)||a.checkpoints?.[0]?.E!==1)
    throw Error('Duplicate or forged Stage6.35 E1 account '+id);
   seen.add(id);accounts.push(a);
  }
 }
 if(seen.size!==expected.size||sources.size!==1)
  throw Error('Incomplete native Stage6.35 census '+seen.size+'/500; sources '+sources.size);
 const highest=Math.max(...accounts.map(a=>a.checkpoints.at(-1)?.E||1));
 const levels=Array.from({length:200},(_,i)=>{
  const E=i+1,at=accounts.flatMap(a=>a.checkpoints.filter(c=>c.E===E));
  return {E,observed:at.length,censored:accounts.length-at.length,
   earnedTalentMedian:dist(at.map(c=>c.earnedTalents)).median,
   equippedBudgetMedian:dist(at.filter(c=>c.itemBudgetMissing===0).map(c=>c.metrics.equippedBudget)).median,
   stats:Object.fromEntries(KINDS.map(k=>[k,dist(at.map(c=>c.metrics[k]))]))};
 });
 const transitions=Array.from({length:199},(_,i)=>{
  const E=i+1,pairs=accounts.flatMap(a=>{
   const old=a.checkpoints.find(x=>x.E===E),next=a.checkpoints.find(x=>x.E===E+1);
   return old&&next?[{account:a, ...paired(old,next)}]:[];
  });
  const overall=safeSummary(pairs);
  const byFamily=Object.fromEntries(['blood','decay','radiance','aegis','fury','arcane']
   .map(f=>[f,safeSummary(pairs.filter(p=>p.account.family===f))]));
  const byArmor=Object.fromEntries(['Cloth','Leather','Plate']
   .map(armor=>[armor,safeSummary(pairs.filter(p=>p.account.armorPreference===armor))]));
  // A provisional calibration ENVELOPE, not a universal combat Power or
  // permission to adjust live enemies. Requires adequate paired coverage.
  const sufficient=pairs.length>=50;
  const physical=overall.medians.basicAttackThroughput;
  const hp=overall.medians.maxhp;
  const def=overall.medians.defense;
  return {from:E,to:E+1,paired:pairs.length,adequateEarlyEvidence:sufficient,
   ...overall,byFamily,byArmor,
   provisionalEnemyBudget:sufficient?{
    hpGrowthFromPhysicalBasicPct:physical.n>=30?physical.median:null,
    incomingDamageFromPlayerHpPct:hp.n>=30?hp.median:null,
    defenderArmorGrowthPct:def.n>=30?def.median:null,
    status:'GUIDANCE ONLY — skill damage, magic and true survivability are separate'
   }:null};
 });
 return {stage:'6.35',kind:'aggregate',source:[...sources][0],
  cohort:{profiles:100,seeds:5,accounts:500,highestReached:highest,
   reachedE2:levels[1].observed,reachedE20:levels[19].observed,
   reachedE35:levels[34].observed,reachedE70:levels[69].observed,
   reachedE100:levels[99].observed,reachedE200:levels[199].observed},
  levels,transitions,caveats:[
   '500 legal E1-born accounts, each first-Camp checkpoint after natural prior-E rewards; no fabricated XP, loot, talents, unlocks, enemies or combat victory.',
   'Only consecutive Expedition pairs of the SAME account measure percent changes. Missing levels and zero-denominator metrics are censored, NEVER interpreted as zero player growth.',
   'Median percent changes cannot be multiplied into an exact median player trajectory, because the membership changes by Expedition and medians do not compose.',
   'UI Power is only a game diagnostic and MUST NOT be treated as universal damage/survivability; physical basic throughput excludes crits, mana, spells, proc talents and mechanics.',
   'Spell growth is excluded for players starting with zero Spell Power; report valid n and build families for each metric.',
   'Equipment change means an actual different item ID in a slot, not necessarily an upgrade or a power increase. Missing native item v013Budget is excluded from budget deltas.',
   'Equipment and Talents retain their real current breakpoints/caps; this stage does not change item inflation or make earlier gear obsolete.',
   'At most 400 legal natural attempts per account, 12 attempts per reached Expedition; unreachable E35/E70/E100/E200 produce null medians and are NOT extrapolated.',
   'Candidate enemy HP/Attack references are raw dimension guideposts only, not target win probabilities. Normal/Elite/Boss and group-size tuning must follow separate native combat measurements.',
   'No live enemy coefficients, exponential growth parameters, gear, Player stats or combat mechanics changed.'
  ]};
}
const fmt=v=>v===null||v===undefined?'—':typeof v==='number'?v.toFixed(2).replace(/\.00$/,''):v;
function markdown(data){
 const result=['# Wanderer Stage 6.35 — Empirical per-Expedition player growth','',
  '**500 E1-born native accounts, no forced Expedition unlock or fabricated equipment.**',
  'Source: '+data.source,'',
  '## Genuine reached Expeditions','',
  '| Metric | Accounts |','|---|---:|',
  ...[1,2,5,10,20,35,70,100,200].map(E=>'| Reached E'+E+' | '+data.levels[E-1].observed+' |'),
  '','## Same-character median growth (NOT cross-sectional averages)','',
  '| From → To | Paired | UI Power % | HP % | Attack % | DEF % | Basic ATK×speed % | Spell % | Gear changed % | Median new talent points |',
  '|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|'];
 for(const x of data.transitions){
  const m=k=>fmt(x.medians[k].median);
  result.push('| E'+x.from+'→E'+x.to+' | '+x.paired+
   ' | '+m('power')+' | '+m('maxhp')+' | '+m('attack')+
   ' | '+m('defense')+' | '+m('basicAttackThroughput')+
   ' | '+m('spellPower')+' | '+fmt(x.gearChanged)+' | '+fmt(x.talentPointsAdded.median)+' |');
 }
 result.push('','## Scope and limits','',...data.caveats.map(x=>'- '+x),'',
  'The next Stage should fit a common monotone enemy reference to supported per-metric growth, then tune actual Normal, Elite and Boss identities and group composition using observed combat outcomes. This Stage does not silently apply an enemy nerf or change gear tiers.','');
 return result.join('\n');
}
function main(args=process.argv.slice(2)){
 const cfg=settings(args);
 const result=cfg.mode==='cohort'?cohort(cfg):aggregate(
  fs.readdirSync(cfg.inputs).filter(x=>/^v013-stage635-cohort-\d+-\d+\.json$/.test(x))
   .map(name=>JSON.parse(fs.readFileSync(path.join(cfg.inputs,name),'utf8'))));
 fs.mkdirSync(path.dirname(cfg.out),{recursive:true});
 fs.writeFileSync(cfg.out,JSON.stringify(result,null,2)+'\n');
 if(cfg.mode==='aggregate')fs.writeFileSync(cfg.out.replace(/\.json$/,'.md'),markdown(result)+'\n');
 console.log('STAGE635='+JSON.stringify(cfg.mode==='cohort'?{
  count:result.accounts.length,reached:result.accounts.map(x=>x.checkpoints.length),
  complete:result.complete}:result.cohort));
 return result;
}
module.exports={KINDS,ITEM_STATS,RARITIES,settings,observation,accountRow,cohort,difference,paired,
 safeSummary,aggregate,markdown,main};
if(require.main===module){try{main();}catch(e){console.error('STAGE635_ERROR '+String(e.stack||e));process.exitCode=1;}}
