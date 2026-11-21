'use strict';
// Stage 6.17: controlled ONE-RULE-AT-A-TIME native mob roster diagnosis.
// Five matched arms: 4 baseline, 6 baseline, 6 composition-only, 6 scaling-only,
// 6 combined. Alternative rules are VM-local; game files remain untouched.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const H=require('./v013-stage615-enemy-hierarchy.cjs');
const S=require('./simulate-progression.cjs');
const T=globalThis.WandererAutomaticTalents;
const ARMS=Object.freeze(['four_native','six_native','six_three_principals','six_small_group_scaling','six_both']);
const DEFAULTS=Object.freeze({mode:'pilot',seedsPerCell:2,seedStart:6170011,
 budgets:[12,24,36,60],risk:1,rarity:'Rare',tickLimit:4500,
 out:'reports/v013-stage617-roster-pilot.json'});
const sourcePath=path.join(__dirname,'../online/v013-enemy-roster.js');
const LIVE_SOURCE=fs.readFileSync(sourcePath,'utf8');
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const count=a=>a.length;
function patchExactly(source,before,after){
 if(source.split(before).length!==2)throw Error('Native roster patch anchor changed: '+before.slice(0,55));
 return source.replace(before,after);
}
const ROLE_RULE=String.raw`const normalCount=count===1?1:count<=4?count-(count===4&&random()<.5?2:1):
   count>=18?2+(random()<.30?1:0):1+(random()<(count>=12?.30:.25)?1:0);`;
const ROLE_TRIAL=String.raw`const normalCount=count===1?1:count<=4?count-(count===4&&random()<.5?2:1):
   count===6?3:count>=18?2+(random()<.30?1:0):1+(random()<(count>=12?.30:.25)?1:0);`;
/* Preserve the Stage 6.17 baseline for reproducible diagnostics after the
 * Stage 6.18 LIVE roster correction, without retaining an obsolete gameplay
 * module. Only this audit runner reconstructs the original rule fragments. */
const STAGE617_SCALING=`if(count>=6){
  if(role==='minion')return {hp:baseHp*.95,atk:baseAtk*.92,def:count<=12?.25:.18};
  return {hp:Math.min(.38,baseHp*1.85),atk:Math.min(.32,baseAtk*1.55),def:.66};
 }`;
function historicalBaseline(source){
 if(source.includes(ROLE_RULE)&&source.includes(STAGE617_SCALING))return source;
 const roleStart=source.indexOf(' // Stage 6.18: keep principal roles');
 const roleEnd=source.indexOf(' const roles=Array(count)',roleStart);
 if(roleStart<0||roleEnd<=roleStart)throw Error('Missing Stage 6.18 composition markers');
 let restored=source.slice(0,roleStart)+' '+ROLE_RULE+'\n'+source.slice(roleEnd);
 const scaleStart=restored.indexOf(' if(count>=6){');
 const scaleEnd=restored.indexOf(" if(role==='minion')return {hp:baseHp*.95,atk:baseAtk*.90,def:.35};",scaleStart);
 if(scaleStart<0||scaleEnd<=scaleStart)throw Error('Missing Stage 6.18 scaling markers');
 restored=restored.slice(0,scaleStart)+' '+STAGE617_SCALING+'\n'+restored.slice(scaleEnd);
 if(!restored.includes(ROLE_RULE)||!restored.includes(STAGE617_SCALING))throw Error('Stage 6.17 baseline reconstruction failed');
 return restored;
}
const NATIVE_SOURCE=historicalBaseline(LIVE_SOURCE);

function rosterSource(arm){
 if(!ARMS.includes(arm))throw Error('Unknown Stage 6.17 arm '+arm);
 if(arm==='four_native'||arm==='six_native')return NATIVE_SOURCE;
 let result=NATIVE_SOURCE;
 if(arm==='six_three_principals'||arm==='six_both')
  result=patchExactly(result,ROLE_RULE,ROLE_TRIAL);
 if(arm==='six_small_group_scaling'||arm==='six_both')
  result=patchExactly(result,'if(count>=6){','if(count>=6&&count!==6){');
 return result;
}
const OVERRIDE_SOURCES=Object.freeze(Object.fromEntries(
 ARMS.filter(a=>!a.endsWith('_native')).map(a=>[a,rosterSource(a)])));
const VARIANT_SHA=Object.freeze(Object.fromEntries(ARMS.map(a=>[a,sha(rosterSource(a))])));
const pct=(w,n)=>n?Number((100*w/n).toFixed(1)):null;
const med=xs=>{const a=xs.filter(Number.isFinite).slice().sort((x,y)=>x-y),m=a.length>>1;
 return !a.length?null:a.length%2?a[m]:(a[m-1]+a[m])/2;};
const round=x=>Number(x.toFixed(2));
function options(settings=DEFAULTS){
 if(!['pilot','matrix','plan'].includes(settings.mode)||
  ![1,2,4,8].includes(settings.seedsPerCell)||
  settings.risk!==1||settings.rarity!=='Rare'||settings.tickLimit!==4500||
  !Number.isSafeInteger(settings.seedStart)||settings.seedStart<6000000||
  !Array.isArray(settings.budgets)||settings.budgets.length!==4||
  [12,24,36,60].some(b=>!settings.budgets.includes(b))||
  typeof settings.out!=='string'||!settings.out.startsWith('reports/'))
  throw Error('Invalid Stage 6.17 preregistered controlled fixture');
 return {...DEFAULTS,...settings};
}
function plan(settings=DEFAULTS){
 const o=options(settings),p=H.plan(o);
 if(p.rows.length!==6*4*2*o.seedsPerCell||new Set(p.rows.map(r=>r.id)).size!==p.rows.length)
  throw Error('Unexpected Stage 6.17 cohort');
 if(p.rows.some(r=>!T.valid(r.talents)||T.earned(r.talents)!==r.budget))
  throw Error('Illegal controlled native talents');
 return {rows:p.rows,sets:p.rows.length,fights:p.rows.length*ARMS.length,
  budgets:[...o.budgets],realms:[...H.FAMILIES],arms:[...ARMS]};
}
function nativeArm(row,arm,settings=DEFAULTS){
 const o=options(settings),size=arm==='four_native'?4:6;
 const opts=H.nativeOptions(row,'normal',o);
 if(Object.hasOwn(OVERRIDE_SOURCES,arm))opts.stage617RosterSource=OVERRIDE_SOURCES[arm];
 const x=S.encounter(row.level,row.build,row.seed,'normal',opts,
  undefined,undefined,row.realm,row.risk,size);
 if(x.timedOut||!x.won&&!x.died||x.nativeEncounter!=='normal'||
    x.groupSize!==size||x.requestedGroupSize!==size||x.level!==row.level||
    x.affinity!==row.realm||x.risk!==row.risk||
    x.gearRarity!==o.rarity||x.armorType!==row.gear.armor||
    (x.offhandType||null)!==(row.gear.offhand||null)||
    x.pointsBudget!==row.budget||x.pointsSpent!==row.spent||
    JSON.stringify(x.controlledTalentNodes)!==JSON.stringify(row.talents.nodes)||
    x.controlledTalentMode!==(row.talents.element||'arcane')||
    x.targetPolicy!=='focus')
  throw Error('Stage 6.17 native fight mismatch: '+row.id+'/'+arm);
 const minions=x.initialRoles?.minion||0;
 const principals=(x.initialRoles?.tank||0)+(x.initialRoles?.caster||0)+(x.initialRoles?.skirmisher||0);
 if(minions+principals!==size)throw Error('Native spawn role count mismatch');
 if(arm==='six_three_principals'||arm==='six_both'){
  if(principals!==3||minions!==3)throw Error('Trial failed to generate exactly 3 principal mobs');
 }
 return {arm,count:size,won:x.won,died:x.died,seconds:x.seconds,
  damageTaken:x.damageTaken,damageDealt:x.damageDealt,
  hpStart:x.hpStart,hpEnd:x.hpEnd,hpMax:x.hpMax,
  gearFingerprint:x.gearFingerprint,seed:x.seed,resolvedSeed:x.resolvedSeed,
  seedShift:x.seedShift,plannedConditionId:x.plannedConditionId,
  exactTalents:x.controlledTalentNodes,element:x.controlledTalentMode,
  roles:x.initialRoles,roster:x.roster,initialRosterHp:x.roster.reduce((a,v)=>a+v.maxHp,0),
  initialRosterAttack:x.roster.reduce((a,v)=>a+v.attack,0),
  moduleSha:VARIANT_SHA[arm]};
}
function matched(row,settings=DEFAULTS){
 const arms=Object.fromEntries(ARMS.map(arm=>[arm,nativeArm(row,arm,settings)]));
 const first=arms.four_native;
 const checks={
  gear:ARMS.every(k=>arms[k].gearFingerprint===first.gearFingerprint),
  hero:ARMS.every(k=>arms[k].hpStart===first.hpStart&&arms[k].hpMax===first.hpMax),
  talents:ARMS.every(k=>JSON.stringify(arms[k].exactTalents)===JSON.stringify(first.exactTalents)&&arms[k].element===first.element),
  seed:ARMS.every(k=>arms[k].seed===first.seed&&arms[k].resolvedSeed===first.resolvedSeed&&arms[k].seedShift===first.seedShift),
  condition:ARMS.every(k=>arms[k].plannedConditionId===first.plannedConditionId),
  groupSizes:ARMS.every(k=>arms[k].count===(k==='four_native'?4:6)),
  realRoster:ARMS.every(k=>arms[k].roster?.length===arms[k].count),
  provenance:ARMS.every(k=>arms[k].moduleSha===VARIANT_SHA[k])
 };
 const failed=Object.keys(checks).filter(k=>!checks[k]);
 if(failed.length)throw Error('Unmatched Stage 6.17 five-way player cohort '+row.id+': '+failed);
 return {id:row.id,realm:row.realm,level:row.level,budget:row.budget,
  profile:row.sourceArchetype,seed:row.seed,checks,arms};
}
function aggregate(rows,arm){
 const xs=rows.map(row=>row.arms[arm]),n=xs.length,wins=xs.filter(x=>x.won).length;
 const mean=key=>n?round(xs.reduce((a,x)=>a+(x.roles[key]||0),0)/n):null;
 return {n,wins,losses:n-wins,winPct:pct(wins,n),
  medianDamageTaken:med(xs.map(x=>x.damageTaken)),
  medianFightSeconds:med(xs.map(x=>x.seconds)),
  medianRosterHp:med(xs.map(x=>x.initialRosterHp)),
  medianRosterAttack:med(xs.map(x=>x.initialRosterAttack)),
  meanMinions:mean('minion'),meanTanks:mean('tank'),
  meanCasters:mean('caster'),meanSkirmishers:mean('skirmisher')};
}
function summary(rows){
 const kinds=Object.fromEntries(ARMS.map(a=>[a,aggregate(rows,a)]));
 const byBudget=Object.fromEntries([12,24,36,60].map(p=>[p,
  Object.fromEntries(ARMS.map(a=>[a,aggregate(rows.filter(r=>r.budget===p),a)]))]));
 const byRealm=Object.fromEntries(H.FAMILIES.map(f=>[f,
  Object.fromEntries(ARMS.map(a=>[a,aggregate(rows.filter(r=>r.realm===f),a)]))]));
 const matched6=rows.map(r=>r.arms.six_native);
 const paired=Object.fromEntries(ARMS.filter(a=>a!=='six_native'&&a!=='four_native').map(arm=>{
  const x=rows.map(r=>[r.arms.six_native,r.arms[arm]]);
  return [arm,{damageMore:x.filter(([a,b])=>b.damageTaken>a.damageTaken).length,
   damageLess:x.filter(([a,b])=>b.damageTaken<a.damageTaken).length,
   identicalDamage:x.filter(([a,b])=>b.damageTaken===a.damageTaken).length,
   gainedPlayerWins:x.filter(([a,b])=>!a.won&&b.won).length,
   lostPlayerWins:x.filter(([a,b])=>a.won&&!b.won).length}];
 }));
 return {sets:rows.length,actualFights:rows.length*ARMS.length,
  verified:rows.filter(r=>Object.values(r.checks).every(Boolean)).length,
  byArm:kinds,byBudget,byRealm,paired,
  modules:{native:sha(NATIVE_SOURCE),variants:VARIANT_SHA},
  caveat:'VM-local roster-rule experiments use native encounter/combat engine; variants are NOT live gameplay, and XP/gear are synthetic.'};
}
function report(r){
 const s=r.summary;
 const out=[
 '# Wanderer Stage 6.17 — native 4→6 mob composition vs scaling ablation','',
 '**Scope:** 6 Realms × 4 artificial legal E budgets × 2 player profiles × '+r.settings.seedsPerCell+' native seed starts.',
 '**Five matched arms per hero:** 4 native, 6 native, 6 with 3 principals, 6 with small-group scaling, 6 with both.',
 '**Native encounters completed:** '+s.actualFights+'; exact matched player checks: '+s.verified+'/'+s.sets+'.',
 '**Game source SHA256:** '+r.gameSourceHash+'. All variants are injected into an isolated test VM; NO live gameplay modification.','',
 '## Outcome by roster-rule arm','',
 '| Arm | Player wins | Win % | Median damage taken | Median enemy HP sum | Median attack sum | Mean Minions |',
 '|---|---:|---:|---:|---:|---:|---:|'
 ];
 for(const arm of ARMS){const x=s.byArm[arm];
  out.push('| '+arm+' | '+x.wins+'/'+x.n+' | '+x.winPct+'% | '+x.medianDamageTaken+
   ' | '+x.medianRosterHp+' | '+x.medianRosterAttack+' | '+x.meanMinions+' |');
 }
 out.push('','## Per-E budget (synthetic; NOT naturally earned)','');
 for(const [budget,group] of Object.entries(s.byBudget)){
  out.push('### '+budget+' legal points (E'+H.BUDGET_LEVEL[budget]+')','','| Arm | Wins | Win % | Median damage taken |',
   '|---|---:|---:|---:|');
  for(const arm of ARMS){const x=group[arm];out.push('| '+arm+' | '+x.wins+'/'+x.n+' | '+x.winPct+'% | '+x.medianDamageTaken+' |');}
  out.push('');
 }
 out.push('## Paired changes vs native 6 mobs','','| Experimental arm | More damage | Less damage | Same damage | Wins gained | Wins lost |','|---|---:|---:|---:|---:|---:|');
 for(const [arm,x] of Object.entries(s.paired))
  out.push('| '+arm+' | '+x.damageMore+' | '+x.damageLess+' | '+x.identicalDamage+' | '+x.gainedPlayerWins+' | '+x.lostPlayerWins+' |');
 out.push('','## Decision gates before implementation','',
 '- Prefer a single roster-composition change if it removes the 4→6 difficulty inversion, including E5, without creating excessive E5 deaths.',
 '- If composition-only fails, evaluate scaling-only and then combined changes. Do not apply an unmeasured global HP/ATK buff.',
 '- At E15+ the ceiling of win rates makes damage taken, enemy stats, and per-Realm behaviour more diagnostic than wins alone.',
 '- Before shipping, run a small native 4/6/8/12/20 regression on the selected formula and a low-level earned-account checkpoint.',
 '- Stage 6.17 is diagnostic. It does not change production game files, talent weights, abilities, loot, saves or artwork.',
 '- Tested stats and talent budgets are legal but synthetically rolled; no natural Expedition preparation or consumable strategy.','');
 return out.join('\n');
}
function parse(args){
 const o={...DEFAULTS};
 for(const arg of args){
  const m=/^--([a-z-]+)=(.*)$/.exec(arg);
  if(!m)throw Error('Invalid Stage 6.17 CLI: '+arg);
  if(m[1]==='mode'&&['pilot','matrix','plan'].includes(m[2]))o.mode=m[2];
  else if(m[1]==='seeds-per-cell')o.seedsPerCell=Number(m[2]);
  else if(m[1]==='out')o.out=m[2];
  else throw Error('Unsupported Stage 6.17 CLI: '+arg);
 }
 return options(o);
}
function main(argv=process.argv.slice(2)){
 const settings=parse(argv),p=plan(settings);
 const result={stage:'6.17',settings,gameSourceHash:S.sourceFingerprint().sha256,
  moduleSourceHashes:VARIANT_SHA,plannedSets:p.sets,plannedFights:p.fights};
 if(settings.mode==='plan'){
  console.log('STAGE617_PLAN='+JSON.stringify(result));return result;
 }
 const rows=p.rows.map(row=>matched(row,settings));
 result.results=rows;result.summary=summary(rows);
 const dest=path.resolve(settings.out);fs.mkdirSync(path.dirname(dest),{recursive:true});
 fs.writeFileSync(dest,JSON.stringify(result,null,2)+'\n');
 fs.writeFileSync(dest.replace(/\.json$/,'.md'),report(result)+'\n');
 console.log('STAGE617='+JSON.stringify({sets:result.summary.sets,nativeFights:result.summary.actualFights,
  checks:result.summary.verified,byArm:result.summary.byArm,byBudget:result.summary.byBudget,
  perRealm:result.summary.byRealm,out:settings.out}));
 return result;
}
if(require.main===module){try{main();}catch(e){console.error('STAGE617_ERROR',e.stack||e);process.exitCode=1;}}
module.exports={ARMS,DEFAULTS,NATIVE_SOURCE,VARIANT_SHA,rosterSource,options,plan,nativeArm,matched,summary,report,parse,main};
