'use strict';
// Stage 6.18: live mob composition/scaling correction compared with frozen
// Stage 6.17 original roster, same native player/gear/Talent/Realm/seed.
// Only the live online/v013-enemy-roster.js is used for the "after" arm.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const H=require('./v013-stage615-enemy-hierarchy.cjs');
const S=require('./simulate-progression.cjs');
const B=require('./v013-stage617-roster-ablation.cjs');
const T=globalThis.WandererAutomaticTalents;
const SIZES=Object.freeze([4,6,8,12,20]);
const DEFAULTS=Object.freeze({mode:'pilot',seedsPerCell:1,seedStart:6180011,
 budgets:[12,24,36,60],rarity:'Rare',risk:1,tickLimit:4500,
 out:'reports/v013-stage618-implementation-pilot.json'});
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const LIVE_SOURCE=fs.readFileSync(path.resolve(__dirname,'../online/v013-enemy-roster.js'),'utf8');
const BEFORE_SOURCE=B.NATIVE_SOURCE;
const SOURCE_SHA=Object.freeze({before:hash(BEFORE_SOURCE),after:hash(LIVE_SOURCE)});
const median=values=>{const a=values.filter(Number.isFinite).slice().sort((x,y)=>x-y),p=a.length>>1;
 return !a.length?null:a.length%2?a[p]:(a[p-1]+a[p])/2;};
const pct=(wins,n)=>n?Number((100*wins/n).toFixed(1)):null;
const round=x=>Number(x.toFixed(2));
function settingsSafe(settings=DEFAULTS){
 if(!['pilot','matrix','plan'].includes(settings.mode)||
  ![1,2,4].includes(settings.seedsPerCell)||
  settings.risk!==1||settings.rarity!=='Rare'||settings.tickLimit!==4500||
  !Number.isSafeInteger(settings.seedStart)||settings.seedStart<6000000||
  JSON.stringify(settings.budgets)!=='[12,24,36,60]'||
  typeof settings.out!=='string'||!settings.out.startsWith('reports/')||
  !settings.out.endsWith('.json'))throw Error('Invalid Stage 6.18 native fixture');
 return {...DEFAULTS,...settings};
}
function plan(settings=DEFAULTS){
 const o=settingsSafe(settings),p=H.plan(o);
 if(p.rows.length!==6*4*2*o.seedsPerCell||p.rows.some(x=>!T.valid(x.talents)||T.earned(x.talents)!==x.budget))
  throw Error('Illegal Stage 6.18 native legal-account synthetic fixture');
 if(SOURCE_SHA.before===SOURCE_SHA.after)throw Error('Stage 6.18 gameplay roster not modified');
 return {rows:p.rows,sets:p.rows.length,fights:p.rows.length*SIZES.length*2,sizes:SIZES,
  realms:H.FAMILIES,profiles:p.distinctArchetypes};
}
function fight(row,size,version,settings=DEFAULTS){
 if(!SIZES.includes(size)||!['before','after'].includes(version))throw Error('Unregistered group-size arm');
 const options=H.nativeOptions(row,'normal',settingsSafe(settings));
 if(version==='before')options.stage617RosterSource=BEFORE_SOURCE;
 const x=S.encounter(row.level,row.build,row.seed,'normal',options,
  undefined,undefined,row.realm,row.risk,size);
 if(x.timedOut||!x.won&&!x.died||x.level!==row.level||
  x.nativeEncounter!=='normal'||x.groupSize!==size||x.requestedGroupSize!==size||
  x.affinity!==row.realm||x.risk!==row.risk||x.pointsBudget!==row.budget||
  x.pointsSpent!==row.spent||x.gearRarity!==settings.rarity||
  x.armorType!==row.gear.armor||(x.offhandType||null)!==(row.gear.offhand||null)||
  JSON.stringify(x.controlledTalentNodes)!==JSON.stringify(row.talents.nodes)||
  x.controlledTalentMode!==(row.talents.element||'arcane')||
  x.targetPolicy!=='focus')
  throw Error('Stage 6.18 combat drift '+row.id+'/'+size+'/'+version);
 const principal=(x.initialRoles.tank||0)+(x.initialRoles.caster||0)+(x.initialRoles.skirmisher||0);
 if(principal+(x.initialRoles.minion||0)!==size)throw Error('Native roster does not match requested size');
 return {won:x.won,died:x.died,damageTaken:x.damageTaken,seconds:x.seconds,
  hpStart:x.hpStart,hpMax:x.hpMax,mpStart:x.mpStart,mpMax:x.mpMax,
  damageDealt:x.damageDealt,initialRoles:x.initialRoles,principals:principal,
  roster:x.roster,rosterHp:x.roster.reduce((n,v)=>n+v.maxHp,0),
  gearFingerprint:x.gearFingerprint,seed:x.seed,resolvedSeed:x.resolvedSeed,
  seedShift:x.seedShift,pointsBudget:x.pointsBudget,talents:x.controlledTalentNodes,
  element:x.controlledTalentMode,conditionId:x.plannedConditionId,
  sourceSha:SOURCE_SHA[version]};
}
function matched(row,settings=DEFAULTS){
 const arms=Object.fromEntries(SIZES.flatMap(size=>['before','after'].map(v=>
  [size+'_'+v,fight(row,size,v,settings)])));
 const all=Object.values(arms),initial=all[0];
 const checks={
  sameGear:all.every(x=>x.gearFingerprint===initial.gearFingerprint),
  sameHero:all.every(x=>x.hpStart===initial.hpStart&&x.hpMax===initial.hpMax&&
   x.mpStart===initial.mpStart&&x.mpMax===initial.mpMax),
  sameSeed:all.every(x=>x.seed===initial.seed&&x.resolvedSeed===initial.resolvedSeed&&x.seedShift===initial.seedShift),
  sameTalents:all.every(x=>JSON.stringify(x.talents)===JSON.stringify(initial.talents)&&x.element===initial.element),
  sameBudget:all.every(x=>x.pointsBudget===initial.pointsBudget),
  sameCondition:all.every(x=>x.conditionId===initial.conditionId),
  sameSource:all.every((x,i)=>x.sourceSha===SOURCE_SHA[i%2?'after':'before']),
  sameCounts:SIZES.every(size=>['before','after'].every(v=>
   arms[size+'_'+v].roster.length===size)),
  same4Roles:arms['4_before'].principals===arms['4_after'].principals&&
   JSON.stringify(arms['4_before'].roster)===JSON.stringify(arms['4_after'].roster)
 };
 if(Object.values(checks).some(v=>!v))throw Error('Stage 6.18 native mismatch '+row.id+'/'+JSON.stringify(checks));
 return {id:row.id,realm:row.realm,budget:row.budget,level:row.level,
  profile:row.sourceArchetype,seed:row.seed,arms,checks};
}
function collect(rows,size,version){
 const xs=rows.map(r=>r.arms[size+'_'+version]),n=xs.length,wins=xs.filter(x=>x.won).length;
 return {n,wins,losses:n-wins,winPct:pct(wins,n),
  medianDamageTaken:median(xs.map(x=>x.damageTaken)),
  medianSeconds:median(xs.map(x=>x.seconds)),
  medianRosterHp:median(xs.map(x=>x.rosterHp)),
  meanPrincipals:round(xs.reduce((s,x)=>s+x.principals,0)/n),
  meanMinions:round(xs.reduce((s,x)=>s+(x.initialRoles.minion||0),0)/n)};
}
function summary(rows){
 const all=Object.fromEntries(SIZES.map(size=>[size,
  Object.fromEntries(['before','after'].map(v=>[v,collect(rows,size,v)]))]));
 const byBudget=Object.fromEntries([12,24,36,60].map(b=>[b,
  Object.fromEntries(SIZES.map(size=>[size,
   Object.fromEntries(['before','after'].map(v=>[v,collect(rows.filter(r=>r.budget===b),size,v)]))]))]));
 const byRealm=Object.fromEntries(H.FAMILIES.map(f=>[f,
  Object.fromEntries(SIZES.map(size=>[size,
   Object.fromEntries(['before','after'].map(v=>[v,collect(rows.filter(r=>r.realm===f),size,v)]))]))]));
 const paired=Object.fromEntries(SIZES.map(size=>[size,{
  gainedPlayerWins:rows.filter(r=>!r.arms[size+'_before'].won&&r.arms[size+'_after'].won).length,
  lostPlayerWins:rows.filter(r=>r.arms[size+'_before'].won&&!r.arms[size+'_after'].won).length,
  moreDamage:rows.filter(r=>r.arms[size+'_after'].damageTaken>r.arms[size+'_before'].damageTaken).length
 }]));
 const e5=byBudget[12],four=e5[4].after,six=e5[6].after;
 return {sets:rows.length,fights:rows.length*SIZES.length*2,
  verified:rows.filter(r=>Object.values(r.checks).every(Boolean)).length,
  bySize:all,byBudget,byRealm,paired,
  gates:{
   e5SixNormalRoomNotEliteDifficulty:six.winPct>=80,
   e5SixVsFourNotLargeDiscontinuity:six.winPct>=four.winPct-12,
   sixMobDamageNotTiny:all[6].after.medianDamageTaken>=all[4].after.medianDamageTaken*.60,
   roleCountsReasonable:[6,8,12,20].every(n=>all[n].after.meanPrincipals>=2),
   noNormalMobStatOverflow:Object.values(all).every(v=>v.after.medianRosterHp>0)
  },
  sourceSha:SOURCE_SHA};
}
function markdown(r){
 const s=r.summary,rows=[
 '# Wanderer Stage 6.18 — Live mob roster implementation vs original native baseline','',
 '**Executed fights:** '+s.fights+'; matched hero configurations: '+s.sets+
 '; strict checks: '+s.verified+'/'+s.sets+'.',
 '**Source hashes:** before '+SOURCE_SHA.before+', after '+SOURCE_SHA.after+'.',
 '**Scope:** six Realms, E5/E15/E35/E70 legal synthetic player states, same Rare rolled gear and Dangerous Risk. No natural E1 proof from these synthetic fights.','',
 '| Mob count | Original wins | Updated wins | Original median damage | Updated median damage | Updated principal roles |',
 '|---:|---:|---:|---:|---:|---:|'
 ];
 for(const size of SIZES){
  const b=s.bySize[size].before,a=s.bySize[size].after;
  rows.push('| '+size+' | '+b.wins+'/'+b.n+' | '+a.wins+'/'+a.n+
   ' | '+b.medianDamageTaken+' | '+a.medianDamageTaken+' | '+a.meanPrincipals+' |');
 }
 rows.push('','## E5/12 synthetic points gate','','| Mob count | Original player wins | Updated player wins | Original damage | Updated damage |','|---:|---:|---:|---:|---:|');
 for(const size of SIZES){
  const b=s.byBudget[12][size].before,a=s.byBudget[12][size].after;
  rows.push('| '+size+' | '+b.wins+'/'+b.n+' | '+a.wins+'/'+a.n+' | '+b.medianDamageTaken+' | '+a.medianDamageTaken+' |');
 }
 rows.push('','## Preliminary implementation gates','',
 ...Object.entries(s.gates).map(([k,v])=>'- '+k+': '+(v?'PASS':'NEEDS RETUNING')),'',
 '**Caveat:** current code corrects the native gameplay roster, while the baseline is test-only in-memory original Stage 6.17 source. Progression and actual earned gear are not represented by synthetic E5/E70 budgets.','');
 return rows.join('\n');
}
function parse(args){
 const o={...DEFAULTS};
 for(const arg of args){
  const m=/^--([a-z-]+)=(.*)$/.exec(arg);
  if(!m)throw Error('Invalid Stage 6.18 flag '+arg);
  if(m[1]==='mode'&&['pilot','matrix','plan'].includes(m[2]))o.mode=m[2];
  else if(m[1]==='seeds-per-cell')o.seedsPerCell=Number(m[2]);
  else if(m[1]==='out')o.out=m[2];
  else throw Error('Unsupported Stage 6.18 flag '+arg);
 }
 return settingsSafe(o);
}
function main(argv=process.argv.slice(2)){
 const settings=parse(argv),p=plan(settings);
 const evidence={stage:'6.18',settings,sourceSha:SOURCE_SHA,planned:p.sets,fights:p.fights,
  gameSourceHash:S.sourceFingerprint().sha256};
 if(settings.mode==='plan'){console.log('STAGE618_PLAN='+JSON.stringify(evidence));return evidence;}
 const rows=p.rows.map(r=>matched(r,settings));
 evidence.results=rows;evidence.summary=summary(rows);
 const dest=path.resolve(settings.out);fs.mkdirSync(path.dirname(dest),{recursive:true});
 fs.writeFileSync(dest,JSON.stringify(evidence,null,2)+'\n');
 fs.writeFileSync(dest.replace(/\.json$/,'.md'),markdown(evidence)+'\n');
 console.log('STAGE618='+JSON.stringify({sets:rows.length,fights:evidence.summary.fights,
  verified:evidence.summary.verified,bySize:evidence.summary.bySize,
  e5:evidence.summary.byBudget[12],gates:evidence.summary.gates,paired:evidence.summary.paired,
  byRealm:evidence.summary.byRealm,out:settings.out}));
 return evidence;
}
if(require.main===module){try{main();}catch(e){console.error('STAGE618_ERROR',e.stack||e);process.exitCode=1;}}
module.exports={SIZES,DEFAULTS,SOURCE_SHA,BEFORE_SOURCE,LIVE_SOURCE,
 settingsSafe,plan,fight,matched,collect,summary,markdown,parse,main};
