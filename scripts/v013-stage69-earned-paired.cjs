'use strict';
// Stage 6.9: compare talent decisions on the SAME REAL earned-account Camp
// state. Progression to the probe point is fully native, never pre-geared.
// Counterfactual: legal full Talent respec at Camp, nothing else changes.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const N=require('./v013-natural-progression.cjs');
const P=require('./v013-build-planner.cjs');
const S=require('./simulate-progression.cjs');
const SOURCE='smart-blood-fury-radiance';
const VARIANTS=Object.freeze({
 baseline:null,
 'blood-pure':'blood-pure',
 'blood-fury':'blood-fury',
 'triple-no-mixed':'blood-fury-radiance-no-mixed',
 'radiance-pure':'radiance-pure'
});
const sha=x=>crypto.createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');
const r2=n=>Number(Number(n).toFixed(2));
const weapon=a=>a.before?.gear?.items?.find(i=>i.slot==='weapon')?.subtype||'none';
const kind=(r)=>r?.kind||r?.roomType||'none';
function snapshot(a,previous,seed,level,attempt){
 const s=a.state(),prog=s.automaticTalents,gears=N.gearSnapshot(a);
 const data={seed,level,attempt,xp:prog.xp,nodes:[...prog.nodes],
  element:prog.element||'arcane',prepared:prog.prepared||null,gear:gears,
  gold:s.gold,fragments:s.fragments,essence:s.crafting?.essence||0,
  consumables:s.consumables,potionSelection:s.potionSelection,unlocked:a.controller().state.unlocked};
 return {digest:sha(data),historySha256:sha(previous),
  originalXp:prog.xp,originalTalentNodes:prog.nodes.length,
  originalAffinities:prog.nodes.filter(x=>x.startsWith('affinity_')),
  gearSha256:sha(gears),weapon:gears.items.find(i=>i.slot==='weapon')?.subtype||null,
  gearRarities:gears.rarity,originalPrepared:prog.prepared||null};
}
function nativeRespec(a,target,previousAttempts){
 const s=a.state(),T=a.talents,old=s.automaticTalents,earned=T.earned(old);
 const targetProgress=T.reset(old); // pure candidate planning only, NOT an account write
 const planned=P.propose(T,targetProgress,target,previousAttempts,0);
 if(planned.earned!==earned||planned.spent>earned||planned.expectedNodes.length>earned)
  throw Error('Counterfactual talent proposal exceeded ACTUAL earned points');
 if(!a.talentActions.reset())throw Error('Native Camp reset was rejected');
 for(const id of planned.purchases){
  if(!a.talentActions.allocate(id))throw Error('Native Camp talent allocation rejected '+id);
  if(id==='element_choice'&&planned.expectedElement!=='arcane'){
   if(!a.talentActions.element(planned.expectedElement))throw Error('Native Camp element switch rejected');
  }
 }
 const newState=s.automaticTalents;
 if(!T.valid(newState)||newState.xp!==old.xp||
   JSON.stringify(newState.nodes)!==JSON.stringify(planned.expectedNodes)||
   (newState.element||'arcane')!==planned.expectedElement)
  throw Error('Real earned-point allocation did not reproduce strategic planned build');
 const adv=planned.expectedNodes.find(id=>T.NODES.find(n=>n.id===id)?.advanced);
 if(adv&&!a.talentActions.prepare(adv))throw Error('Native prepared ability rejected '+adv);
 return {from:old.nodes.length,to:newState.nodes.length,earned,model:planned.model,
  primary:planned.plan,allowed:planned.allowed,chosenMilestone:planned.milestone,
  prepared:adv||null,spent:planned.spent,unspent:earned-planned.spent,
  mixedNodes:newState.nodes.filter(id=>T.NODES.find(n=>n.id===id)?.kind==='mixed'),
  affinityNodes:newState.nodes.filter(id=>id.startsWith('affinity_'))};
}
function encounterSignature(t){
 const first=t.rooms?.[0];
 if(!first)return null;
 return {
  realm:t.realm,affinity:t.affinity,risk:t.risk,
  condition:t.realmCondition,contract:t.contract,room:first.room,
  kind:first.roomType,initialEnemies:first.initialEnemies,
  bossStyle:first.bossStyle,eliteType:first.eliteType
 };
}
function observed(t){
 const f=t.rooms?.[0];
 return {status:t.status,level:t.level,attempt:t.attempt,realm:t.realm,risk:t.risk,
  affinity:t.affinity,weapon:weapon(t),spent:t.before?.spent,
  actualTalentNodes:t.before?.talentNodes,actualGearSha:sha(t.before?.gear),
  bossReached:t.bossReached,bossWon:t.bossWon,
  totalRooms:t.rooms?.length||0,damageTaken:t.damageTaken,seconds:t.seconds,
  totalDeaths:(t.rooms||[]).filter(r=>r.died).length,
  eliteFights:(t.rooms||[]).filter(r=>r.roomType==='elite').length,
  bossFights:(t.rooms||[]).filter(r=>r.roomType==='boss').length,
  potionUses:(t.potions||[]).map(p=>({kind:p.kind,reason:p.reason})),
  first:f?{room:f.room,type:kind(f),initialEnemies:f.initialEnemies,
    won:f.won,died:f.died,timedOut:f.timedOut,
    hpStart:f.hpStart,hpEnd:f.hpEnd,hpMax:f.hpMax,
    hpLossPct:f.hpMax>0?r2(100*(f.hpStart-f.hpEnd)/f.hpMax):null,
    damageTaken:f.damageTaken,damageDealt:f.damageDealt,seconds:f.seconds,
    enemyAbilityCasts:f.enemyAbilityCasts}:null,
  encounterSignature:encounterSignature(t)};
}
function parse(args){
 const out={seed:9701,level:8,output:'reports/stage69-earned-paired.json'};
 for(const arg of args){
  const m=/^--([a-z-]+)=(.+)$/.exec(arg);if(!m)throw Error('Invalid CLI '+arg);
  if(m[1]==='seed')out.seed=Number(m[2]);
  else if(m[1]==='level')out.level=Number(m[2]);
  else if(m[1]==='out')out.output=m[2];
  else throw Error('Unknown CLI '+m[1]);
 }
 if(!Number.isSafeInteger(out.seed)||out.seed<1)throw Error('Invalid native seed');
 if(![5,8,10].includes(out.level))throw Error('Only E5, E8 and E10 native checkpoints');
 if(!out.output.endsWith('.json'))throw Error('Output must be JSON');
 return out;
}
function compare(opts){
 const entries={};
 const nativeSettings=N.parseArgs(['--seeds='+opts.seed,'--profiles='+SOURCE,
  '--max-level='+opts.level,'--max-attempts=18','--max-total-attempts=85']);
 for(const [variant,target]of Object.entries(VARIANTS)){
  const current={meta:null,respec:null,applied:0};
  const acc=N.simulateAccount(opts.seed,SOURCE,nativeSettings,{
   decisionModel:'adaptive',probeLevel:opts.level,
   onCamp({a,seed,level,attempt,previousAttempts}){
    if(level!==opts.level||attempt!==1)return null;
    current.applied++;
    const snap=snapshot(a,previousAttempts,seed,level,attempt);
    let respec=null;
    if(target)respec=nativeRespec(a,target,previousAttempts);
    current.meta=snap;
    current.respec=respec;
    return {variant,inputSha256:snap.digest,originalXp:snap.originalXp,
     originalNodes:snap.originalTalentNodes,reset:!!respec,
     respec};
   }
  });
  if(acc.attempts.some(t=>t.error||t.status==='error'))
   throw Error(variant+' native attempt failed: '+JSON.stringify(acc.attempts.filter(t=>t.error).map(t=>({
    E:t.level,attempt:t.attempt,error:t.error,diagnostic:t.diagnostic?.stack?.slice(0,650)}))));
  const t=acc.attempts.find(t=>t.level===opts.level&&t.attempt===1);
  if(!t||current.applied!==1)
   throw Error(variant+' did not naturally reach an earned E'+opts.level+' account');
  if(t.earnedProbe?.inputSha256!==current.meta.digest)
   throw Error('Recorded native checkpoint source mismatch');
  entries[variant]={variant,fromRealAccount:SOURCE,seed:opts.seed,targetLevel:opts.level,
   historySha256:current.meta.historySha256,inputSha256:current.meta.digest,
   original:current.meta,counterfactual:current.respec,
   actual:observed(t),
   beforeXp:t.before.xp,afterXp:t.after.xp,
   gameUnlockedAfter:aSafeUnlocked(acc),earned:Tearn(t.before),
   nativeEarlier:acc.attempts.filter(x=>x.level<opts.level).map(x=>({
    E:x.level,attempt:x.attempt,status:x.status,bossWon:x.bossWon}))};
 }
 const original=entries.baseline,all=Object.values(entries);
 const originSignature=original.actual.encounterSignature;
 const checkInput=all.every(x=>x.inputSha256===original.inputSha256&&
  x.historySha256===original.historySha256&&x.original.gearSha256===original.original.gearSha256);
 if(!checkInput)throw Error('Matched native earned account histories/gear/XP differ before the respec');
 for(const x of all){
  if(x.beforeXp!==original.beforeXp||x.earned!==original.earned)
   throw Error('Respec changed earned XP or point budget '+x.variant);
  if(!x.actual.actualGearSha||x.actual.actualGearSha!==original.actual.actualGearSha)
   throw Error('Talents-only trial changed equipped real gear '+x.variant);
  if(x.actual.spent>x.earned)throw Error('More Talent nodes than truly earned: '+x.variant);
 }
 const row={seed:opts.seed,level:opts.level,initialFingerprint:original.inputSha256,
  historySha256:original.historySha256,earnedXp:original.beforeXp,
  earnedPoints:original.earned,realWeapon:original.actual.weapon,
  matchedEarlyProgression:true,matchedEarnedGear:true,matchedEarnedXp:true,
  nativeEncounterComparison:all.map(x=>({variant:x.variant,
   sameFirstEncounter:JSON.stringify(x.actual.encounterSignature)===JSON.stringify(originSignature),
   inputSignature:x.actual.encounterSignature,first:x.actual.first,
   bossReached:x.actual.bossReached,bossWon:x.actual.bossWon,
   status:x.actual.status,rooms:x.actual.totalRooms,
   potency:{damageTaken:x.actual.damageTaken,seconds:x.actual.seconds},
   potionsUsed:x.actual.potionUses.length,
   spent:x.actual.spent,
   hasMixed:x.actual.actualTalentNodes.some(id=>id==='crimson_rush'||id==='reapers_cadence'),
   affinities:x.actual.actualTalentNodes.filter(id=>id.startsWith('affinity_'))})),
  variants:entries,limitation:'Exact source gear and E1–E'+(opts.level-1)+' history. Identical first enemy guaranteed only when first encounter signatures match. Other rooms, tactics, potion stock and future RNG can diverge following legal respec.'};
 return row;
}
const Tearn=b=>b?.earned;
const aSafeUnlocked=a=>a.endLevel;
function main(args=process.argv.slice(2)){
 const opts=parse(args),result=compare(opts);
 fs.mkdirSync(path.dirname(opts.output),{recursive:true});
 fs.writeFileSync(opts.output,JSON.stringify({stage:'6.9',gameSourceSha256:S.sourceFingerprint().sha256,
  runner:'native simulator with onCamp safety gate',result},null,2)+'\n');
 const brief=result.nativeEncounterComparison.map(v=>({variant:v.variant,match:v.sameFirstEncounter,
  success:v.first?.won,firstHp:v.first?.hpLossPct,dps:v.first?.seconds>0?r2(v.first.damageDealt/v.first.seconds):null,
  boss:v.bossWon,bossReached:v.bossReached,status:v.status,spent:v.spent}));
 console.log('STAGE69_EARNED_MATCH='+JSON.stringify({seed:opts.seed,level:opts.level,
  xp:result.earnedXp,points:result.earnedPoints,weapon:result.realWeapon,
  matchedInput:result.matchedEarlyProgression&&result.matchedEarnedGear&&result.matchedEarnedXp,
  results:brief}));
 return result;
}
if(require.main===module)main();
module.exports={VARIANTS,SOURCE,parse,nativeRespec,snapshot,compare,main};
