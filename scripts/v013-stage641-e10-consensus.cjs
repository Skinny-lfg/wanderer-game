'use strict';
// Stage 6.41: E10 reference from genuinely earned E1-born accounts.
// Lab encounters only reuse real E10 Camp equipment/XP/talents; no grants,
// no forced Expedition unlocks, no combat-stat substitutions, no deploy.
const fs=require('node:fs');
const path=require('node:path');
const N=require('./v013-natural-progression.cjs');
const D=require('./v013-stage628-postcap-difficulty.cjs');
const P=require('./v013-stage632-player-power.cjs');
const A=require('./v013-stage639-earned-aoe-comparison.cjs');
const S=require('./simulate-progression.cjs');
const PROFILES=Object.freeze({
  balanced:'hybrid', 'hexblade-hybrid':'hybrid',
  'leather-duelist':'single-target', 'smart-blood-pure':'single-target',
  'smart-fury-bow':'aoe', 'smart-blood-two-handed':'aoe', 'magic-fire':'aoe',
  'magic-lightning':'aoe', 'plate-warden':'hybrid'
});
// Stage 6.41 research-only policies: safer early routing and stable specialization,
// while ALL equipment, XP, talents and Expedition unlocks are genuinely earned.
const CALIBRATED_PROFILES=Object.freeze(Object.fromEntries(Object.keys(PROFILES).map(id=>{
 const base=P.PROFILES[id];
 const overrides=id==='magic-fire'?{plan:'magic-fire-pure',element:'fire'}:
  id==='magic-lightning'?{plan:'magic-lightning-pure',element:'lightning'}:{};
 return [id,Object.freeze({...base,...overrides,risk:0,healAt:.70,retreatAt:.45,
  target:'mechanics',shop:true,researchGearPreference:true})];
})));
const SEEDS=Object.freeze([9861,9863]);
const SIZES=Object.freeze([1,2,3,4,5,8,12]);
const ELITES=Object.freeze(['tank','berserker','vampire','caster','gravecaller','oathbound_exarch','briarspine_horror','ashen_executioner']);
const BOSSES=Object.freeze(['blood','decay','vitality','aegis','fury','magic']);
const source=()=>S.sourceFingerprint().sha256;
const rate=arr=>{
 const valid=arr.filter(x=>x.won||x.died);
 return {n:valid.length,wins:valid.filter(x=>x.won).length,
  pct:valid.length?Math.round(1000*valid.filter(x=>x.won).length/valid.length)/10:null,
  timedOut:arr.length-valid.length};
};
function sample(id,seed){
 if(!Object.hasOwn(PROFILES,id)||!SEEDS.includes(seed)||!P.PROFILES[id])
  throw Error('Unsupported stage641 profile/seed');
 let snapshot=null;
 const account=N.simulateAccount(seed,id,{
  ...N.DEFAULTS,seeds:[seed],profiles:[id],maxLevel:10,
  maxAttempts:24,maxTotalAttempts:240
 },{researchProfiles:CALIBRATED_PROFILES,decisionModel:'adaptive',onCamp:probe=>{
  if(probe.level!==10||probe.attempt!==1)return;
  if(snapshot)throw Error('Repeated E10 Camp checkpoint');
  snapshot=D.checkpoint(probe,[10]);
 }});
 const errors=account.attempts.filter(x=>x.error&&x.error!=='Native combat timeout');
 if(errors.length)throw Error('Native account failure '+id+' '+seed+': '+JSON.stringify(errors.map(x=>x.error)));
 const output={stage:'6.41',kind:'earned-e10-reference',source:source(),id,seed,
  intended:PROFILES[id],reachedE10:!!snapshot,
  reached:account.reached||[],endLevel:account.endLevel,
  attempts:account.attempts.length,stopReason:account.stopReason,
  naturalTimeouts:account.attempts.filter(x=>x.error==='Native combat timeout').length,
  checkpoint:null,rooms:[]};
 if(!snapshot)return output;
 const skill=A.aoeState(snapshot);
 output.checkpoint={E:10,earned:true,
  xp:snapshot.xp,talentEarned:snapshot.talentEarned,talentSpent:snapshot.talentSpent,
  gearPieces:snapshot.equipPieces,rarity:snapshot.equippedRarity,
  stats:snapshot.statSnapshot,fingerprint:snapshot.fingerprint,
  aoePotential:skill.aoePotential,aoeNodes:skill.aoeNodes,
  weapon:skill.weapon,element:skill.element,talentNodes:[...snapshot.state.automaticTalents.nodes]};
 const first=snapshot.state.automaticTalents.nodes.find(x=>x.startsWith('affinity_'));
 const realm=first?first.slice(9):'blood';
 const scenarios=[...SIZES.map(size=>({id:'normal-'+size,type:'normal',realm,size})),
  ...ELITES.map(identity=>({id:identity,type:'elite',realm})),
  ...BOSSES.map(family=>({id:'boss-'+family,type:'boss',realm:family}))];
 encounters: for(let trial=0;trial<2;trial++){
  const fightSeed=6410000+seed*19+trial*727;
  for(const scenario of scenarios){
   const r=D.native(snapshot,scenario,fightSeed);
   if(!r.timedOut&&!r.won&&!r.died)throw Error('Inconsistent native E10 outcome '+id+' '+seed+' '+scenario.id);
   output.rooms.push({trial,encounter:scenario.id,kind:scenario.type,size:scenario.size||1,
    identity:scenario.type==='normal'?null:scenario.id,realm:scenario.realm,
    won:!!r.won,died:!!r.died,timeout:!!r.timedOut,seconds:r.seconds,
    taken:r.damageTaken,secondary:r.secondaryTargetDamage,secondaryDot:r.secondaryDotDamage||0,
    damage:r.damageDealt,fundedCasts:r.fundedCasts,manaSpent:r.manaSpent,
    hits:r.secondaryTargetHits,bossSummons:r.bossSummons,eliteSummons:r.eliteSummons,
    enemyAbilityCasts:r.enemyAbilityCasts,
    elite:r.eliteType||null,boss:r.bossStyle||null,
    roles:r.initialRoles||{},heroStats:r.heroBaseStats,
    gear:r.gearFingerprint});
   if(r.timedOut){
    // A fight that exhausts the native tick budget is censored, never a loss.
    // Preserve the partial observed matrix and stop expensive further replays.
    output.censoredAt=scenario.id;
    output.censoredTrial=trial;
    output.censoredReason='Native controlled encounter exceeded tick limit';
    break encounters;
   }
  }
 }
 if(!output.censoredAt&&output.rooms.length!==42)throw Error('Incomplete E10 native room matrix');
 return output;
}
function aggregate(dir){
 const data=fs.readdirSync(dir).filter(f=>/^stage641-.+\.json$/.test(f))
  .map(f=>JSON.parse(fs.readFileSync(path.join(dir,f),'utf8')))
  .filter(x=>x.kind==='earned-e10-reference');
 const expected=Object.keys(PROFILES).flatMap(id=>SEEDS.map(seed=>id+'|'+seed));
 const keys=data.map(x=>x.id+'|'+x.seed);
 if(data.length!==expected.length||new Set(keys).size!==expected.length||
  keys.some(x=>!expected.includes(x)))throw Error('Missing/duplicate E10 cohort results '+data.length+'/'+expected.length);
 if(new Set(data.map(x=>x.source)).size!==1)throw Error('Mixed source versions');
 const reached=data.filter(x=>x.reachedE10);
 const rows=reached.flatMap(x=>x.rooms.map(r=>({...r,profile:x.id,
  intended:x.intended,actual:x.checkpoint.aoePotential?'aoe-capable':'no-aoe'})));
 const groups=SIZES.map(size=>({size,
  all:rate(rows.filter(x=>x.kind==='normal'&&x.size===size)),
  aoe:rate(rows.filter(x=>x.kind==='normal'&&x.size===size&&x.actual==='aoe-capable')),
  noAoe:rate(rows.filter(x=>x.kind==='normal'&&x.size===size&&x.actual==='no-aoe')),
  secondaryDamage:rows.filter(x=>x.kind==='normal'&&x.size===size).reduce((sum,x)=>sum+(x.secondary||0),0),
  secondaryDotDamage:rows.filter(x=>x.kind==='normal'&&x.size===size).reduce((sum,x)=>sum+(x.secondaryDot||0),0)}));
 const identities=kind=>(kind==='elite'?ELITES:BOSSES).map(id=>({
  id, ...rate(rows.filter(x=>x.kind===kind&&x.identity===(kind==='boss'?'boss-'+id:id)))}));
 const result={stage:'6.41',source:data[0].source,accounts:data.length,reachedE10:reached.length,
  aoeAtE10:reached.filter(x=>x.checkpoint.aoePotential).length,
  censoredControlledAccounts:reached.filter(x=>x.censoredAt).map(x=>({id:x.id,seed:x.seed,
   encounter:x.censoredAt,trial:x.censoredTrial,observedFights:x.rooms.length})),
  aoeObservedAtE10:reached.filter(x=>x.checkpoint.aoePotential&&
   x.rooms.some(r=>r.kind==='normal'&&r.size>1&&r.secondary>0)).length,
  minE10SamplesForFinalTuning:12,
  maturity:reached.map(x=>({id:x.id,seed:x.seed,intended:x.intended,
   actual:x.checkpoint.aoePotential?'aoe-capable':'no-aoe',
   points:x.checkpoint.talentSpent,gear:x.checkpoint.gearPieces,
   weapon:x.checkpoint.weapon,rarity:x.checkpoint.rarity,stats:x.checkpoint.stats,
   nodes:x.checkpoint.talentNodes,element:x.checkpoint.element,
   observedSecondary:x.rooms.filter(r=>r.kind==='normal'&&r.size>1).reduce((sum,r)=>sum+(r.secondary||0),0)})),
  groups,elites:identities('elite'),bosses:identities('boss'),
  missing:data.filter(x=>!x.reachedE10).map(x=>({id:x.id,seed:x.seed,endLevel:x.endLevel,
   attempts:x.attempts,reason:x.stopReason})),
  caveats:['A reached E10 checkpoint is earned; unreached E10 is censored, not a loss.',
   'Controlled first-ring Risk 1 encounters are not natural Expedition success rates.',
   'Two repeats per identity per reached account are a pilot, not independent player samples.',
   'Actual AoE classification is based on equipped gear and earned talents; intended specialization may not be online.',
   'Observed secondary target damage separately validates actual AoE during controlled fights.',
   'Optimized research agents allow 24 attempts per Expedition; do not compare E10 reach directly to the 12-attempt baseline.',
   'Do not change enemy stats based on sparse per-identity samples or a survivor-selected cohort.']};
 const lines=['# Stage 6.41 — E10 reference / consensus pilot','',
  'Native source: '+result.source,
  'Accounts: '+result.accounts+'; reached E10: '+result.reachedE10+'; actual AoE available: '+result.aoeAtE10+'; observed AoE damage: '+result.aoeObservedAtE10+'; censored controlled accounts: '+result.censoredControlledAccounts.length,'',
  '| Enemies | All | AoE equipped | No AoE | Secondary damage (including Burn) |','|---:|---:|---:|---:|---:|',
  ...groups.map(g=>'| '+g.size+' | '+g.all.wins+'/'+g.all.n+' | '+g.aoe.wins+'/'+g.aoe.n+' | '+g.noAoe.wins+'/'+g.noAoe.n+' | '+g.secondaryDamage+' (Burn '+g.secondaryDotDamage+') |'),
  '','## Elites','| Name | Wins |','|---|---:|',
  ...result.elites.map(x=>'| '+x.id+' | '+x.wins+'/'+x.n+' |'),
  '','## Bosses','| Name | Wins |','|---|---:|',
  ...result.bosses.map(x=>'| '+x.id+' | '+x.wins+'/'+x.n+' |'),
  '','## Maturity','| Profile | Seed | Intended | Actual | Points | Gear | Weapon | Secondary damage |',
  '|---|---:|---|---|---:|---:|---|---:|',
  ...result.maturity.map(x=>'| '+x.id+' | '+x.seed+' | '+x.intended+' | '+x.actual+
   ' | '+x.points+' | '+x.gear+' | '+x.weapon+' | '+x.observedSecondary+' |'),
  '','## Not reached E10',...result.missing.map(x=>'- '+x.id+' / '+x.seed+
   ': E'+x.endLevel+' after '+x.attempts+' attempts ('+x.reason+')'),
  '','## Interpretation',...result.caveats.map(x=>'- '+x),''];
 fs.writeFileSync(path.join(dir,'stage641-summary.json'),JSON.stringify(result,null,2)+'\n');
 fs.writeFileSync(path.join(dir,'stage641-summary.md'),lines.join('\n'));
 console.log('STAGE641_E10_SUMMARY='+JSON.stringify({source:result.source,
  accounts:result.accounts,reachedE10:result.reachedE10,
  aoeAtE10:result.aoeAtE10,aoeObservedAtE10:result.aoeObservedAtE10,
  censoredControlledAccounts:result.censoredControlledAccounts,groups:result.groups,elites:result.elites,bosses:result.bosses,
  missing:result.missing}));
}
if(require.main===module){
 try{
  if(process.argv[2]==='--aggregate')aggregate(process.argv[3]||'reports/stage641');
  else{
   const [id,seedArg,out]=process.argv.slice(2),seed=Number(seedArg);
   if(!out||!/\.json$/.test(out))throw Error('Usage: node stage641-e10-consensus.cjs PROFILE SEED OUTPUT.json');
   const report=sample(id,seed);
   fs.mkdirSync(path.dirname(out),{recursive:true});
   fs.writeFileSync(out,JSON.stringify(report));
   console.log('STAGE641_E10_ACCOUNT='+JSON.stringify({id,seed,reachedE10:report.reachedE10,
    endLevel:report.endLevel,attempts:report.attempts,stop:report.stopReason,
    points:report.checkpoint?.talentSpent,gear:report.checkpoint?.gearPieces,
    actualAoE:report.checkpoint?.aoePotential,controlledFights:report.rooms.length}));
  }
 }catch(e){console.error('STAGE641_ERROR '+String(e.stack||e));process.exitCode=1;}
}
module.exports={PROFILES,CALIBRATED_PROFILES,SEEDS,SIZES,ELITES,BOSSES,sample,aggregate,rate};
