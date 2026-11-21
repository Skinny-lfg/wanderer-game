'use strict';
// Wanderer Stage 6.20: native six-Boss comparison of LEGAL native preparation
// effects: marked Elite, Reliquary, both, or neither. These are controlled
// first-ring fixtures, NOT a claim of completing a 15-room natural expedition.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const S=require('./simulate-progression.cjs');
const H=require('./v013-stage615-enemy-hierarchy.cjs');
const T=globalThis.WandererAutomaticTalents;
const STRATEGIES=Object.freeze(['baseline','marked_elite','reliquary','both']);
const POLICIES=Object.freeze(['focus','mechanics']);
const BOSSES=Object.freeze({blood:'Rift Harbinger',decay:'Carrion Matriarch',
 vitality:'Heartroot Devourer',aegis:'The Abyssal Guardian',
 fury:'Ember Sovereign',magic:'Stormglass Conductor'});
const BOSSES_ID=Object.freeze({blood:'rift',decay:'carrion',vitality:'heartroot',
 aegis:'guardian',fury:'ember',magic:'stormglass'});
const DEFAULTS=Object.freeze({mode:'pilot',seedsPerCell:1,seedStart:6200011,
 budgets:[12,24,36,60],risk:1,rarity:'Rare',tickLimit:4500,
 out:'reports/v013-stage620-boss-preparation-pilot.json'});
const med=x=>{const a=x.filter(Number.isFinite).slice().sort((a,b)=>a-b),i=a.length>>1;
 return a.length===0?null:a.length%2?a[i]:(a[i-1]+a[i])/2;};
const pct=(w,n)=>n?Number((100*w/n).toFixed(1)):null;
const mean=x=>x.length?Number((x.reduce((a,b)=>a+b,0)/x.length).toFixed(2)):null;
function settingsSafe(settings=DEFAULTS){
 if(!['pilot','matrix','plan'].includes(settings.mode)||
  ![1,2,4].includes(settings.seedsPerCell)||
  !Number.isSafeInteger(settings.seedStart)||settings.seedStart<6000000||
  settings.risk!==1||settings.rarity!=='Rare'||settings.tickLimit!==4500||
  JSON.stringify(settings.budgets)!=='[12,24,36,60]'||
  typeof settings.out!=='string'||!settings.out.startsWith('reports/')||
  !settings.out.endsWith('.json'))throw Error('Invalid Stage 6.20 registered native fixture');
 return {...DEFAULTS,...settings};
}
function plan(settings=DEFAULTS){
 const s=settingsSafe(settings),p=H.plan(s),rows=p.rows.flatMap(r=>POLICIES.map(policy=>({...r,policy,id:r.id+'-'+policy})));
 if(rows.length!==6*4*2*POLICIES.length*s.seedsPerCell||
    rows.some(r=>!T.valid(r.talents)||T.earned(r.talents)!==r.budget)||
    new Set(rows.map(x=>x.id)).size!==rows.length)
  throw Error('Stage 6.20 invalid controlled native cohort');
 return {rows,sets:rows.length,fights:rows.length*STRATEGIES.length,
  sixBosses:Object.keys(BOSSES),policies:POLICIES,strategies:STRATEGIES};
}
function fight(row,strategy,settings=DEFAULTS){
 if(!STRATEGIES.includes(strategy)||!POLICIES.includes(row.policy))throw Error('Unknown Boss preparation arm');
 const opts={...H.nativeOptions(row,'boss',settingsSafe(settings)),
  mode:'bossprep',targetPolicy:row.policy};
 const x=S.bossPreparationEncounter(row.level,row.build,row.seed,opts,strategy);
 if(x.timedOut||!x.won&&!x.died||x.mode!=='bossprep'||x.kind!==strategy||
    x.affinity!==row.realm||x.bossAffinity!==row.realm||
    x.bossName!==BOSSES[row.realm]||x.bossId!==BOSSES_ID[row.realm]||
    x.type!=='boss'||x.level!==row.level||x.risk!==row.risk||
    x.pointsBudget!==row.budget||x.pointsSpent!==row.spent||
    x.targetPolicy!==row.policy||!Number.isFinite(x.hpStart)||
    !Number.isFinite(x.damageTaken)||!Number.isFinite(x.hpMax)||
    !Number.isFinite(x.preparationCostHp)||!Number.isFinite(x.initialEnemies))
  throw Error('Unresolved or misclassified native Boss '+row.id+'/'+strategy);
 const leader=x.roster.find(e=>e.role==='boss');
 if(!leader||!Number.isFinite(leader.attack)||!Number.isFinite(leader.maxHp))
  throw Error('Native Boss leader absent '+row.id+'/'+strategy);
 return {won:x.won,died:x.died,seconds:x.seconds,
  damageTaken:x.damageTaken,damageDealt:x.damageDealt,
  hpStart:x.hpStart,hpMax:x.hpMax,mpStart:x.mpStart,mpMax:x.mpMax,
  gearFingerprint:x.gearFingerprint,otherGearFingerprint:x.otherGearFingerprint,
  pointsBudget:x.pointsBudget,pointsSpent:x.pointsSpent,
  seed:x.seed,resolvedSeed:x.resolvedSeed,seedShift:x.seedShift,
  affinity:x.affinity,level:x.level,risk:x.risk,policy:x.targetPolicy,
  bossId:x.bossId,bossStyle:x.bossStyle,bossName:x.bossName,
  condition:x.conditionId,gearTier:x.gearTier,
  offhandType:x.offhandType||null,offhandTrait:x.offhandTrait||null,
  bossModifiers:[...(x.bossModifierIds||[])],bossPrep:x.bossPreparation,
  costHp:x.preparationCostHp,initialEnemies:x.initialEnemies,
  leaderHp:leader.maxHp,leaderAttack:leader.attack,
  leaderDefense:leader.defense,bossSummons:x.bossSummons,
  bossHealing:x.bossHealing,bossWards:x.bossWards,
  bossArcanePulses:x.bossArcanePulses,bossCastInterruptions:x.bossCastInterruptions,
  bossNodeDestroyed:x.bossNodeDestroyed,
  targetSwitches:x.targetSwitches,
  controlledFirstRing:true};
}
function matched(row,settings=DEFAULTS){
 const arms=Object.fromEntries(STRATEGIES.map(strategy=>[strategy,fight(row,strategy,settings)]));
 const n=arms.baseline,e=arms.marked_elite,r=arms.reliquary,b=arms.both;
 const arr=Object.values(arms);
 const prep={nativeBossSame:arr.every(x=>x.bossId===n.bossId&&x.bossStyle===n.bossStyle&&x.bossName===n.bossName),
  playerGearSame:arr.every(x=>x.gearFingerprint===n.gearFingerprint&&x.otherGearFingerprint===n.otherGearFingerprint),
  sameBasePlayer:arr.every(x=>x.hpMax===n.hpMax&&x.mpMax===n.mpMax&&x.mpStart===n.mpStart),
  sameSeed:arr.every(x=>x.seed===n.seed&&x.resolvedSeed===n.resolvedSeed&&x.seedShift===n.seedShift),
  sameLevelRealmRisk:arr.every(x=>x.level===n.level&&x.affinity===n.affinity&&x.risk===n.risk),
  sameCondition:arr.every(x=>x.condition===n.condition),
  sameBuildBudget:arr.every(x=>x.pointsBudget===n.pointsBudget&&x.pointsSpent===n.pointsSpent),
  samePolicy:arr.every(x=>x.policy===row.policy),
  nativeEscorts:e.initialEnemies===n.initialEnemies-1&&b.initialEnemies===r.initialEnemies-1,
  nativeReliquaryModifier:r.bossModifiers.length===n.bossModifiers.length-1&&
   b.bossModifiers.length===e.bossModifiers.length-1,
  nativeCost:r.costHp>0&&r.costHp===b.costHp&&n.costHp===0&&e.costHp===0,
  nativeCharge:n.hpStart===e.hpStart&&r.hpStart===n.hpStart-r.costHp&&b.hpStart===n.hpStart-b.costHp,
  nativeBossLeaderStats:arr.every(x=>x.leaderHp===n.leaderHp&&x.leaderAttack===n.leaderAttack),
  noTimeouts:arr.every(x=>Number.isFinite(x.seconds)&&x.won!==x.died),
  nativePreparedFlags:!n.bossPrep?.markedElite&&!n.bossPrep?.reliquary&&
   !!e.bossPrep?.markedElite&&!e.bossPrep?.reliquary&&
   !!r.bossPrep?.reliquary&&!r.bossPrep?.markedElite&&
   !!b.bossPrep?.reliquary&&!!b.bossPrep?.markedElite
 };
 const failed=Object.entries(prep).filter(([,v])=>!v).map(([k])=>k);
 if(failed.length)throw Error('Stage 6.20 false parity '+row.id+' => '+failed.join(', ')+' '+JSON.stringify({n,e,r,b}).slice(0,1900));
 return {id:row.id,policy:row.policy,realm:row.realm,level:row.level,
  budget:row.budget,seed:row.seed,archetype:row.sourceArchetype,
  gear:row.gear,checks:prep,arms};
}
function aggregate(rows,strategy){
 const xs=rows.map(x=>x.arms[strategy]),n=xs.length,w=xs.filter(x=>x.won).length;
 return {n,wins:w,losses:n-w,winPct:pct(w,n),
  medianDamageTaken:med(xs.map(x=>x.damageTaken)),
  medianDuration:med(xs.map(x=>x.seconds)),
  medianStartingHp:med(xs.map(x=>x.hpStart)),
  medianBossHp:med(xs.map(x=>x.leaderHp)),
  meanEscorts:mean(xs.map(x=>x.initialEnemies-1)),
  meanActiveModifiers:mean(xs.map(x=>x.bossModifiers.length)),
  meanReliquaryCostHp:mean(xs.map(x=>x.costHp)),
  meanBossSummons:mean(xs.map(x=>x.bossSummons||0)),
  meanBossHealing:mean(xs.map(x=>x.bossHealing||0)),
  meanBossWards:mean(xs.map(x=>x.bossWards||0)),
  meanArcanePulses:mean(xs.map(x=>x.bossArcanePulses||0)),
  meanTargetSwitches:mean(xs.map(x=>x.targetSwitches||0))};
}
function group(rows){return Object.fromEntries(STRATEGIES.map(s=>[s,aggregate(rows,s)]));}
function summary(rows){
 const byBoss=Object.fromEntries(H.FAMILIES.map(f=>[f,group(rows.filter(r=>r.realm===f))]));
 const byBudget=Object.fromEntries([12,24,36,60].map(b=>[b,group(rows.filter(r=>r.budget===b))]));
 const byPolicy=Object.fromEntries(POLICIES.map(p=>[p,group(rows.filter(r=>r.policy===p))]));
 const byBossAndPolicy=Object.fromEntries(H.FAMILIES.map(f=>[f,
  Object.fromEntries(POLICIES.map(p=>[p,group(rows.filter(r=>r.realm===f&&r.policy===p))]))]));
 const paired=Object.fromEntries(STRATEGIES.filter(s=>s!=='baseline').map(s=>[s,{
  gainedWins:rows.filter(r=>!r.arms.baseline.won&&r.arms[s].won).length,
  lostWins:rows.filter(r=>r.arms.baseline.won&&!r.arms[s].won).length,
  moreDamage:rows.filter(r=>r.arms[s].damageTaken>r.arms.baseline.damageTaken).length
 }]));
 const e5=rows.filter(r=>r.budget===12);
 return {sets:rows.length,fights:rows.length*STRATEGIES.length,verified:rows.filter(r=>Object.values(r.checks).every(Boolean)).length,
  byBoss,byBudget,byPolicy,byBossAndPolicy,paired,
  gate:{
   sixNativeBosses:Object.keys(byBoss).length===6,
   fourLegalPrepEffects:rows.every(r=>Object.values(r.checks).every(Boolean)),
   explicitReliquaryTradeoff:rows.every(r=>r.arms.reliquary.costHp>0),
   earlyBossNotAutoWin:e5.some(r=>!r.arms.both.won),
   noUnpreparedRegression:rows.every(r=>r.arms.baseline.leaderHp===r.arms.both.leaderHp)
  }};
}
function markdown(e){
 const s=e.summary,lines=[
 '# Wanderer Stage 6.20 — Six native Bosses with preparation',
 '',
 '**Caution:** these are legal native preparation **effects** recorded through the deterministic expedition decision ledger in a controlled first-ring Boss fixture, **not** naturally completed 15-room Expeditions. The Reliquary sacrifice uses native player HP; same starting player HP is therefore deliberately NOT imposed on all arms.',
 '**Native matched hero states:** '+s.sets+'; genuine Boss fights: '+s.fights+'; strict checks: '+s.verified+'/'+s.sets+'.',
 'Six Affinities, E5/E15/E35/E70 synthetic legal points and rolled Rare gear, Risk 1 Dangerous, native Boss + one escort without Marked Elite, policies focus/mechanics. No consumable preparations simulated.','',
 '| Boss | Baseline player wins | Marked Elite | Reliquary | Both | Baseline damage | Both damage |',
 '|---|---:|---:|---:|---:|---:|---:|'
 ];
 for(const family of H.FAMILIES){
  const x=s.byBoss[family];
  lines.push('| '+BOSSES[family]+' | '+x.baseline.wins+'/'+x.baseline.n+
   ' | '+x.marked_elite.wins+'/'+x.marked_elite.n+
   ' | '+x.reliquary.wins+'/'+x.reliquary.n+
   ' | '+x.both.wins+'/'+x.both.n+
   ' | '+x.baseline.medianDamageTaken+' | '+x.both.medianDamageTaken+' |');
 }
 lines.push('','## By synthetic Expedition tier','',
  '| Tier | Baseline | Marked Elite | Reliquary | Both |','|---|---:|---:|---:|---:|');
 for(const [b,x]of Object.entries(s.byBudget)){
  lines.push('| E'+({12:5,24:15,36:35,60:70}[b])+
   ' | '+STRATEGIES.map(k=>x[k].wins+'/'+x[k].n).join(' | ')+' |');
 }
 lines.push('','## Preparation mechanism and strategy checks','',
  'Each checked pair used same canonical Boss, real Realm/Risk/Condition, equipment roll and legal Talents. Marked Elite removes one Dangerous escort without weakening the Boss base attack. Reliquary removes exactly one real Boss modifier and costs 15% native max HP. Both applies both costs/effects.',
  'Matched policy comparison includes player focus vs mechanics-aware target switching; players choose the same class and native seed within each policy.',
  '',
  '## Engineering gates',...Object.entries(s.gate).map(([k,v])=>'- '+k+': '+(v?'PASS':'NEEDS INVESTIGATION')),'',
  '**Interpretation:** Boss percentages are NOT yet player-earned full-Expedition success rates. If E5 fights remain unwinnable, do not blindly lower Boss stats: examine natural E1 progression, real boss placement and consumable/boon preparation separately.',
  '');
 return lines.join('\n');
}
function parse(args){
 const o={...DEFAULTS};
 for(const a of args){
  const m=/^--([a-z-]+)=(.*)$/.exec(a);if(!m)throw Error('Invalid Stage 6.20 argument '+a);
  if(m[1]==='mode'&&['pilot','matrix','plan'].includes(m[2]))o.mode=m[2];
  else if(m[1]==='seeds-per-cell')o.seedsPerCell=Number(m[2]);
  else if(m[1]==='out')o.out=m[2];
  else throw Error('Unsupported Stage 6.20 argument '+a);
 }
 return settingsSafe(o);
}
function main(argv=process.argv.slice(2)){
 const o=parse(argv),p=plan(o),ev={stage:'6.20',settings:o,
  sourceFingerprint:S.sourceFingerprint().sha256,planned:p.sets,plannedFights:p.fights};
 if(o.mode==='plan'){console.log('STAGE620_PLAN='+JSON.stringify(ev));return ev;}
 ev.rows=p.rows.map(r=>matched(r,o));ev.summary=summary(ev.rows);
 const output=path.resolve(o.out);fs.mkdirSync(path.dirname(output),{recursive:true});
 fs.writeFileSync(output,JSON.stringify(ev,null,2)+'\n');
 fs.writeFileSync(output.replace(/\.json$/,'.md'),markdown(ev)+'\n');
 console.log('STAGE620='+JSON.stringify({sets:ev.summary.sets,fights:ev.summary.fights,
  verified:ev.summary.verified,byBoss:ev.summary.byBoss,byBudget:ev.summary.byBudget,
  byPolicy:ev.summary.byPolicy,paired:ev.summary.paired,gate:ev.summary.gate,out:o.out}));
 return ev;
}
if(require.main===module){try{main();}catch(e){console.error('STAGE620_ERROR',e.stack||e);process.exitCode=1;}}
module.exports={STRATEGIES,POLICIES,BOSSES,BOSSES_ID,DEFAULTS,
 settingsSafe,plan,fight,matched,aggregate,summary,markdown,parse,main};
