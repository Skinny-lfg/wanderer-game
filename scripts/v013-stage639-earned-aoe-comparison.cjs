'use strict';
// Stage6.39 experimental CONTROLLED group-size comparison using ONLY original
// real E1-born Camp checkpoints and earned legal talents/gear at E1–E12.
// Same character, current gear, Talents, XP, Risk and family across group arms;
// group sizes intentionally change the native roster. Never claim the
// first-ring staged fights are a natural dungeon clear.
const fs=require('node:fs'),path=require('node:path');
const B=require('./v013-stage632-player-power.cjs');
const N=require('./v013-natural-progression.cjs');
const D=require('./v013-stage628-postcap-difficulty.cjs');
const S=require('./simulate-progression.cjs');
const PROFILES=Object.freeze([
 'cautious','balanced','daring','plate-warden','leather-duelist','hexblade-hybrid',
 'magic-fire','magic-frost','magic-lightning','magic-arcane','magic-staff',
 'smart-fury-bow','smart-fury-daggers','smart-magic-lightning-pure','smart-blood-pure'
]);
const SEEDS=Object.freeze([9861,9863]),CHECKPOINTS=Object.freeze([1,3,5,8,10,12]);
const SIZES=Object.freeze([1,3,5,8,12]);
const JOBS=Object.freeze(PROFILES.flatMap(id=>SEEDS.map(seed=>Object.freeze({id,seed}))));
function options(args=process.argv.slice(2)){
 const o={mode:'cohort',batch:0,maxLevel:12,maxAttempts:12,maxTotalAttempts:144,
  out:'reports/v013-stage639-aoe-pair-0.json',inputs:'reports/stage639-aoe-shards'};
 for(const a of args){
  const m=/^--([a-z-]+)=(.+)$/.exec(a);if(!m)throw Error('Invalid AoE pair argument '+a);
  const key=m[1],v=m[2];
  if(['mode','out','inputs'].includes(key))o[key]=v;
  else if(['batch','max-level','max-attempts','max-total-attempts'].includes(key))
   o[key.replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=Number(v);
  else throw Error('Unsupported AoE pair arg '+key);
 }
 if(!['cohort','aggregate'].includes(o.mode)||
  !/^reports\/v013-stage639-aoe-[a-z0-9-]+\.json$/.test(o.out)||
  !/^reports\/[a-z0-9/-]+$/.test(o.inputs)||o.inputs.includes('..'))
  throw Error('Unsafe AoE pair report path');
 if(o.mode==='cohort'&&(!Number.isInteger(o.batch)||o.batch<0||o.batch>=JOBS.length||
  !Number.isInteger(o.maxLevel)||o.maxLevel<1||o.maxLevel>12||
  !Number.isInteger(o.maxAttempts)||o.maxAttempts<1||o.maxAttempts>12||
  !Number.isInteger(o.maxTotalAttempts)||o.maxTotalAttempts<1||o.maxTotalAttempts>144))
  throw Error('Unsafe earned AoE native samples');
 return o;
}
function aoeState(snap){
 const nodes=snap.state.automaticTalents.nodes||[],weapon=snap.state.equip.weapon?.subtype||null,
  offhand=snap.state.equip.offhand?.subtype||null,
  element=snap.state.automaticTalents.element||null;
 const actual=weapon==='Two-Handed'||weapon==='Bow'||
  weapon==='Daggers'&&nodes.includes('fan_of_blades')||
  weapon==='Mace'&&nodes.includes('mace_shockwave')||
  weapon==='Sword'&&offhand==='Shield'&&nodes.includes('sword_sweep')||
  ['Wand','Staff'].includes(weapon)&&element==='lightning'&&
   (nodes.includes('overcharge')||nodes.includes('storm_mastery'))&&!nodes.includes('lightning_focus')||
  element==='fire'&&nodes.includes('fire_spread')||nodes.includes('plague_spread')||
  nodes.includes('grave_bloom')&&snap.state.automaticTalents.prepared==='grave_bloom';
 return {aoePotential:!!actual,weapon,offhand,element,
  aoeNodes:nodes.filter(x=>['fan_of_blades','mace_shockwave','sword_sweep','cleave_mastery',
   'bow_pierce','fire_spread','frost_spread','plague_spread','grave_bloom','overcharge','storm_mastery'].includes(x)),
  earnedTalents:snap.talentSpent,XP:snap.xp,gearPieces:snap.equipPieces};
}
function cohort(cfg){
 if(PROFILES.some(x=>!B.PROFILES[x])||JOBS.length!==30)
  throw Error('Stage639 diversified earned AOE/ST sample invalid');
 const {id,seed}=JOBS[cfg.batch],profile=B.PROFILES[id],snapshots=new Map();
 const account=N.simulateAccount(seed,id,{...N.DEFAULTS,seeds:[seed],profiles:[id],
  maxLevel:cfg.maxLevel,maxAttempts:cfg.maxAttempts,maxTotalAttempts:cfg.maxTotalAttempts},
 {researchProfiles:B.PROFILES,decisionModel:'adaptive',
  onCamp:probe=>{
   if(probe.attempt!==1||!CHECKPOINTS.includes(probe.level))return null;
   const snap=D.checkpoint(probe,CHECKPOINTS);
   if(!snap)throw Error('No genuine E'+probe.level+' native checkpoint');
   if(snapshots.has(snap.level))throw Error('Duplicate real E'+snap.level+' snapshot');
   snapshots.set(snap.level,snap);return null;
  }});
 const errors=account.attempts.filter(a=>a.error&&a.error!=='Native combat timeout');
 if(errors.length)throw Error('Native E1-born AoE sample failure '+JSON.stringify(errors.map(x=>x.error)));
 const rows=[],skipped=[];
 for(const E of CHECKPOINTS){
  const snap=snapshots.get(E);
  if(!snap){skipped.push(E);continue;}
  const first=account.attempts.find(a=>a.level===E&&a.attempt===1);
  if(!first||first.before.xp!==snap.xp||first.before.earned!==snap.talentEarned)
   throw Error('Fake E'+E+' or invalid Camp checkpoint');
  const skill=aoeState(snap);
  const family=snap.state.automaticTalents.nodes.find(x=>x.startsWith('affinity_'))?.slice(9)||
   profile.families[0];
  const variants=[];
  for(const n of SIZES){
   const seedFight=(6390000+seed*23+E*137+cfg.batch*419)>>>0;
   const r=D.native(snap,{id:'normal-'+n,type:'normal',realm:family,size:n},seedFight,false);
   if(r.initialEnemies!==n||r.nativeEncounter!=='normal'||r.affinity!==family||
    r.talentXp!==snap.xp||r.talentPointsEarned!==snap.talentEarned||
    JSON.stringify(r.controlledTalentNodes)!==JSON.stringify(snap.state.automaticTalents.nodes))
    throw Error('AoE native actor or legal earned Talent drift');
   variants.push({size:n,won:!!r.won,died:!!r.died,timeout:!!r.timedOut,
    seconds:r.seconds,damageTaken:r.damageTaken,damageDealt:r.damageDealt,
    secondaryTargetDamage:r.secondaryTargetDamage||0,secondaryTargetHits:r.secondaryTargetHits||0,
    rosterHp:r.roster.reduce((sum,x)=>sum+x.maxHp,0),
    rosterMinions:r.initialRoles.minion||0,
    rosterPrincipals:(r.initialRoles.tank||0)+(r.initialRoles.skirmisher||0)+(r.initialRoles.caster||0),
    heroMaxHp:r.heroBaseStats.maxhp,heroAttack:r.heroBaseStats.attack,
    heroDefense:r.heroBaseStats.defense,gearFingerprint:r.gearFingerprint});
  }
  for(const x of variants)if(x.gearFingerprint!==variants[0].gearFingerprint||
   x.heroMaxHp!==variants[0].heroMaxHp||x.heroAttack!==variants[0].heroAttack||
   x.heroDefense!==variants[0].heroDefense)
   throw Error('AoE group-size arm did not hold earned player stats and gear fixed');
  rows.push({E,id,seed,family,skill,gearFingerprint:variants[0].gearFingerprint,variants,
   realCheckpoint:true,controlledFirstRing:true});
 }
 return {stage:'6.39',kind:'aoe-earneds',source:S.sourceFingerprint().sha256,
  id,seed,batch:cfg.batch,account:{reached:account.reached,endLevel:account.endLevel,
   attempts:account.attempts.length,skipped,stop:account.stopReason},rows,
  complete:cfg.maxLevel===12&&cfg.maxAttempts===12&&cfg.maxTotalAttempts===144,errors:0};
}
function rate(items){
 const r=items.filter(x=>!x.timeout),wins=r.filter(x=>x.won).length;
 return {n:items.length,resolved:r.length,wins,losses:r.filter(x=>x.died).length,
  censored:items.length-r.length,winPct:r.length?Number((100*wins/r.length).toFixed(1)):null,
  meanSecondaryDamage:items.length?Number((items.reduce((a,b)=>a+b.secondaryTargetDamage,0)/items.length).toFixed(1)):null,
  meanTaken:items.length?Number((items.reduce((a,b)=>a+b.damageTaken,0)/items.length).toFixed(1)):null,
  meanDurationWon:wins?Number((r.filter(x=>x.won).reduce((a,b)=>a+b.seconds,0)/wins).toFixed(1)):null};
}
function aggregate(parts){
 if(parts.length!==JOBS.length)throw Error('Missing earned AoE group samples '+parts.length+'/'+JOBS.length);
 const keys=new Set(),sources=new Set(),rows=[];
 for(const x of parts){
  if(x.stage!=='6.39'||x.kind!=='aoe-earneds'||!x.complete||x.errors)
   throw Error('Invalid Stage639 earned AoE sample');
  sources.add(x.source);
  const key=x.id+'|'+x.seed;
  if(!JOBS.some(j=>j.id===x.id&&j.seed===x.seed)||keys.has(key))
   throw Error('Duplicate or invalid AoE sampled account '+key);
  keys.add(key);rows.push(...x.rows);
 }
 if(sources.size!==1||keys.size!==JOBS.length)throw Error('Mixed-source AoE samples');
 const outcome=CHECKPOINTS.map(E=>{
  const sample=rows.filter(r=>r.E===E);
  return {E,legitAccounts:sample.length,aoeCapable:sample.filter(x=>x.skill.aoePotential).length,
   results:SIZES.map(size=>{
    const subset=sample.map(x=>({...x.variants.find(a=>a.size===size),skill:x.skill}));
    return {size,all:rate(subset),
     aoe:rate(subset.filter(x=>x.skill.aoePotential)),
     noAoe:rate(subset.filter(x=>!x.skill.aoePotential))};
   })};
 });
 return {stage:'6.39',kind:'aoe-aggregate',source:[...sources][0],
  accounts:JOBS.length,checkpoints:rows.length,levels:outcome,rows,
  limits:[
   'Only 30 fresh E1-born native accounts are present; unachieved E checkpoints are censored.',
   'An earned checkpoint is an actual E reached and on-Camp state. The subsequent first-ring Risk1 group fight is a laboratory comparison, not a completed Expedition.',
   'Per player checkpoint all group sizes share exactly the same earned equipment, XP, TalentGraph, Risk and family; the intended enemy count/composition differ.',
   'AoE and non-AoE builds have different earned gear, talents, class and playstyle; their win differences are observational, not a causal proof of AoE skill power.',
   'E1 may have zero AoE-equipped accounts, even in a profile intending AoE later. That is a meaningful negative result, not a failure.',
   'All outcomes are native fights; none of the tests grants free items, levels, XP, talents or forces victories.'
  ]};
}
function markdown(d){
 const fmt=x=>x.resolved?x.wins+'/'+x.resolved+' ('+x.winPct+'%)':'—';
 const o=['# Stage6.39 — legitimately earned AoE and single-target versus 1–12 normal enemies','',
  'Accounts '+d.accounts+', checkpoints '+d.checkpoints+', source '+d.source,'',
  '| E | Accounts | AoE-equipped | 1 normal | 3 normal | 5 | 8 | 12 |',
  '|--:|--:|--:|---|---|---|---|---|'];
 for(const r of d.levels)o.push('| E'+r.E+' | '+r.legitAccounts+' | '+r.aoeCapable+
  ' | '+r.results.map(v=>fmt(v.all)).join(' | ')+' |');
 o.push('','## Actual AoE-capable versus ST at the SAME E and group size','',
  '| E | Size | AoE-capable | Non-AoE | Mean secondary damage AoE |',
  '|--:|--:|---|---|--:|');
 for(const r of d.levels)for(const x of r.results)if(x.size>3)
  o.push('| E'+r.E+' | '+x.size+' | '+fmt(x.aoe)+' | '+fmt(x.noAoe)+
   ' | '+(x.aoe.meanSecondaryDamage??'—')+' |');
 o.push('','## Limitations','',...d.limits.map(x=>'- '+x),'');
 return o.join('\n');
}
function main(argv=process.argv.slice(2)){
 const cfg=options(argv),data=cfg.mode==='cohort'?cohort(cfg):aggregate(
  fs.readdirSync(cfg.inputs).filter(x=>/^v013-stage639-aoe-pair-\d+\.json$/.test(x))
   .map(x=>JSON.parse(fs.readFileSync(path.join(cfg.inputs,x),'utf8'))));
 fs.mkdirSync(path.dirname(cfg.out),{recursive:true});
 fs.writeFileSync(cfg.out,JSON.stringify(data,null,2)+'\n');
 if(cfg.mode==='aggregate')fs.writeFileSync(cfg.out.replace(/\.json$/,'.md'),markdown(data)+'\n');
 console.log('STAGE639_AOE='+JSON.stringify(cfg.mode==='aggregate'?
  {accounts:data.accounts,checkpoints:data.checkpoints}:{id:data.id,seed:data.seed,checkpoints:data.rows.length}));
 return data;
}
module.exports={PROFILES,SEEDS,CHECKPOINTS,SIZES,JOBS,options,aoeState,cohort,aggregate,markdown,main};
if(require.main===module){try{main();}catch(e){console.error('STAGE639_AOE_ERROR '+String(e.stack||e));process.exitCode=1;}}
