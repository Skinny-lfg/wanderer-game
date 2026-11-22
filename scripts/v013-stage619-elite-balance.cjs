'use strict';
// Stage 6.19: each named Elite is tested explicitly against the current
// native runtime with per-Elite additional growth disabled/enabled.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const H=require('./v013-stage615-enemy-hierarchy.cjs');
const S=require('./simulate-progression.cjs');
const T=globalThis.WandererAutomaticTalents;
const IDS=Object.freeze(['tank','berserker','vampire','caster','gravecaller','oathbound_exarch','briarspine_horror','ashen_executioner']);
const NAMES=Object.freeze({tank:'Gravebound Bulwark',berserker:'Bloodscar Ravager',
 vampire:'Sanguine Wraith',caster:'Voidborne Hexer',gravecaller:'Gravecaller',
 oathbound_exarch:'Oathbound Exarch',briarspine_horror:'Briarspine Horror',ashen_executioner:'Ashen Executioner'});
const DEFAULTS=Object.freeze({mode:'pilot',seedsPerCell:1,seedStart:6190011,
 budgets:[12,24,36,60],rarity:'Rare',risk:1,tickLimit:4500,
 out:'reports/v013-stage619-elites-pilot.json'});
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const LIVE_RUNTIME=fs.readFileSync(path.resolve(__dirname,'../combat/v012-combat-runtime.js'),'utf8');
// Native Stage 6.19 growth A/B on the CURRENT combat runtime. The historical
// 6.19 pre-change runtime cannot be replayed against later Boss/Elite fixes.
// Toggle only the optional growth factor while retaining every other mechanic.
const EXTRA_GROWTH_LINE=' const eliteGrowth=elite?root.WandererV013EliteAbilities.scalingFor(elite.id,level):null;';
const BASE_GROWTH_LINE=' const eliteGrowth=elite?{hp:1,atk:1,def:1}:null;';
if(LIVE_RUNTIME.split(EXTRA_GROWTH_LINE).length!==2)
 throw Error('Native Stage 6.19 Elite growth line changed; refuse stale controlled comparison');
const BASELINE_RUNTIME=LIVE_RUNTIME.replace(EXTRA_GROWTH_LINE,BASE_GROWTH_LINE);
const SOURCE_HASH=Object.freeze({before:sha(BASELINE_RUNTIME),after:sha(LIVE_RUNTIME)});
const med=a=>{const x=a.filter(Number.isFinite).slice().sort((a,b)=>a-b),i=x.length>>1;
 return !x.length?null:x.length%2?x[i]:(x[i-1]+x[i])/2;};
const pct=(wins,n)=>n?Number((100*wins/n).toFixed(1)):null;
const round=x=>Number(x.toFixed(2));
function safe(settings=DEFAULTS){
 if(!['pilot','matrix','plan'].includes(settings.mode)||![1,2,4].includes(settings.seedsPerCell)||
  settings.risk!==1||settings.rarity!=='Rare'||settings.tickLimit!==4500||
  !Number.isSafeInteger(settings.seedStart)||settings.seedStart<6000000||
  JSON.stringify(settings.budgets)!=='[12,24,36,60]'||
  typeof settings.out!=='string'||!settings.out.startsWith('reports/')||
  !settings.out.endsWith('.json'))throw Error('Invalid Stage 6.19 registered native fixture');
 return {...DEFAULTS,...settings};
}
function plan(settings=DEFAULTS){
 const s=safe(settings),p=H.plan(s);
 if(p.rows.length!==6*4*2*s.seedsPerCell||p.rows.some(r=>!T.valid(r.talents)||T.earned(r.talents)!==r.budget))
  throw Error('Stage 6.19 invalid controlled native legal talents');
 if(SOURCE_HASH.before===SOURCE_HASH.after)throw Error('No Stage 6.19 gameplay implementation detected');
 return {sets:p.rows.length,fights:p.rows.length*IDS.length*2,rows:p.rows,elites:IDS};
}
function fight(row,id,version,settings=DEFAULTS){
 if(!IDS.includes(id)||!['before','after'].includes(version))throw Error('Invalid native Elite arm');
 const opts={...H.nativeOptions(row,'elite',safe(settings)),stage619EliteType:id};
 if(version==='before')opts.stage619BaselineRuntime=BASELINE_RUNTIME;
 const x=S.encounter(row.level,row.build,row.seed,'elite',opts,
  undefined,undefined,row.realm,row.risk);
 if(x.timedOut||!x.won&&!x.died||x.nativeEncounter!=='elite'||
  x.eliteType!==id||x.affinity!==row.realm||x.level!==row.level||
  x.risk!==row.risk||x.requestedGroupSize!==1||
  x.gearRarity!==settings.rarity||x.armorType!==row.gear.armor||
  (x.offhandType||null)!==(row.gear.offhand||null)||
  x.pointsBudget!==row.budget||x.pointsSpent!==row.spent||
  JSON.stringify(x.controlledTalentNodes)!==JSON.stringify(row.talents.nodes)||
  x.controlledTalentMode!==(row.talents.element||'arcane')||
  x.targetPolicy!=='focus')throw Error('Stage 6.19 invalid real native Elite outcome '+row.id+'/'+id+'/'+version);
 const elite=x.roster.find(v=>v.role==='elite');
 if(!elite||!elite.name.includes(NAMES[id])||!Number.isFinite(elite.maxHp)||elite.maxHp<1)
  throw Error('Native Elite identity absent from initial enemy roster');
 return {won:x.won,died:x.died,damageTaken:x.damageTaken,damageDealt:x.damageDealt,
  seconds:x.seconds,hpStart:x.hpStart,hpMax:x.hpMax,mpStart:x.mpStart,mpMax:x.mpMax,
  roster:x.roster,eliteHp:elite.maxHp,eliteAttack:elite.attack,eliteDefense:elite.defense,
  eliteType:x.eliteType,enemyAbilityCasts:x.enemyAbilityCasts,eliteSummons:x.eliteSummons,
  gearFingerprint:x.gearFingerprint,seed:x.seed,resolvedSeed:x.resolvedSeed,
  seedShift:x.seedShift,budget:x.pointsBudget,talents:x.controlledTalentNodes,
  element:x.controlledTalentMode,condition:x.plannedConditionId,
  sourceSha:SOURCE_HASH[version]};
}
function matched(row,settings=DEFAULTS){
 const arms=Object.fromEntries(IDS.flatMap(id=>['before','after'].map(v=>
  [id+'_'+v,fight(row,id,v,settings)])));
 const all=Object.values(arms),first=all[0];
 const checks={
  sameGear:all.every(x=>x.gearFingerprint===first.gearFingerprint),
  sameHero:all.every(x=>x.hpStart===first.hpStart&&x.hpMax===first.hpMax&&x.mpStart===first.mpStart&&x.mpMax===first.mpMax),
  sameSeed:all.every(x=>x.seed===first.seed&&x.resolvedSeed===first.resolvedSeed&&x.seedShift===first.seedShift),
  sameTalents:all.every(x=>JSON.stringify(x.talents)===JSON.stringify(first.talents)&&x.element===first.element),
  sameCondition:all.every(x=>x.condition===first.condition),
  sameSource:IDS.every(id=>arms[id+'_before'].sourceSha===SOURCE_HASH.before&&arms[id+'_after'].sourceSha===SOURCE_HASH.after),
  sameAllEight:IDS.every(id=>arms[id+'_before'].eliteType===id&&arms[id+'_after'].eliteType===id),
  sameE5:row.budget!==12||IDS.every(id=>{
   const b=arms[id+'_before'],a=arms[id+'_after'];
   return b.eliteHp===a.eliteHp&&b.eliteAttack===a.eliteAttack&&b.eliteDefense===a.eliteDefense&&
    b.won===a.won&&b.damageTaken===a.damageTaken&&b.seconds===a.seconds;
  })
 };
 if(Object.values(checks).some(x=>!x))throw Error('Stage 6.19 mismatched native arm '+row.id+': '+JSON.stringify(checks));
 return {id:row.id,realm:row.realm,level:row.level,budget:row.budget,
  sourceProfile:row.sourceArchetype,seed:row.seed,checks,arms};
}
function collect(rows,id,version){
 const xs=rows.map(r=>r.arms[id+'_'+version]),n=xs.length,w=xs.filter(x=>x.won).length;
 return {n,wins:w,losses:n-w,winPct:pct(w,n),
  medianDamageTaken:med(xs.map(x=>x.damageTaken)),
  medianSeconds:med(xs.map(x=>x.seconds)),
  medianEliteHp:med(xs.map(x=>x.eliteHp)),
  medianEliteAttack:med(xs.map(x=>x.eliteAttack)),
  medianEliteDefense:med(xs.map(x=>x.eliteDefense)),
  meanAbilityCasts:round(xs.reduce((t,x)=>t+(x.enemyAbilityCasts||0),0)/n),
  meanSummons:round(xs.reduce((t,x)=>t+(x.eliteSummons||0),0)/n)};
}
function summary(rows){
 const byElite=Object.fromEntries(IDS.map(id=>[id,Object.fromEntries(
  ['before','after'].map(v=>[v,collect(rows,id,v)]))]));
 const byBudget=Object.fromEntries([12,24,36,60].map(b=>[b,Object.fromEntries(
  IDS.map(id=>[id,Object.fromEntries(['before','after'].map(v=>
   [v,collect(rows.filter(r=>r.budget===b),id,v)]))]))]));
 const byRealm=Object.fromEntries(H.FAMILIES.map(f=>[f,Object.fromEntries(
  IDS.map(id=>[id,Object.fromEntries(['before','after'].map(v=>
   [v,collect(rows.filter(r=>r.realm===f),id,v)]))]))]));
 const e5=byBudget[12],all=Object.values(e5).every(x=>x.before.wins===x.after.wins&&x.before.medianDamageTaken===x.after.medianDamageTaken);
 const revived=IDS.filter(id=>byElite[id].before.wins>byElite[id].after.wins);
 const gate={e5FullyUnchanged:all,eliteEightAllCovered:Object.keys(byElite).length===8,
  noHealthyE5Regression:IDS.every(id=>e5[id].after.winPct>=e5[id].before.winPct),
  differentiatedScaling:IDS.some(id=>byElite[id].after.medianEliteHp>byElite[id].before.medianEliteHp)};
 return {sets:rows.length,fights:rows.length*IDS.length*2,
  verified:rows.filter(r=>Object.values(r.checks).every(Boolean)).length,
  byElite,byBudget,byRealm,revived,gate,sourceSha:SOURCE_HASH};
}
function markdown(evidence){
 const s=evidence.summary,lines=[
 '# Wanderer Stage 6.19 — eight named Elites, native per-E before/after',
 '',
 'Fully native matched hero states: '+s.sets+'; genuine combat executions: '+s.fights+
 '; all-player parity checks: '+s.verified+'/'+s.sets+'.',
 'Original combat runtime SHA256 '+SOURCE_HASH.before+'; final runtime SHA256 '+SOURCE_HASH.after+'.',
 'Synthetic legal talents/rare rolled gear, 6 Affinities, E5/E15/E35/E70, Dangerous risk; not an earned Expedition campaign.','',
 '| Named Elite | Before wins | After wins | Before damage received | After damage received | Before Elite HP | After Elite HP |',
 '|---|---:|---:|---:|---:|---:|---:|'
 ];
 for(const id of IDS){const x=s.byElite[id],b=x.before,a=x.after;
  lines.push('| '+NAMES[id]+' | '+b.wins+'/'+b.n+' | '+a.wins+'/'+a.n+' | '+b.medianDamageTaken+
   ' | '+a.medianDamageTaken+' | '+b.medianEliteHp+' | '+a.medianEliteHp+' |');
 }
 for(const [budget,cells] of Object.entries(s.byBudget)){
  lines.push('','## E'+({12:5,24:15,36:35,60:70}[budget])+' (synthetic '+budget+' legal points)','',
   '| Elite | Before win % | After win % | Before player damage | After player damage |',
   '|---|---:|---:|---:|---:|');
  for(const id of IDS){
   const x=cells[id];lines.push('| '+NAMES[id]+' | '+x.before.winPct+'% | '+x.after.winPct+
    '% | '+x.before.medianDamageTaken+' | '+x.after.medianDamageTaken+' |');
  }
 }
 lines.push('','## Preconditions / gates',...Object.entries(s.gate).map(([k,v])=>'- '+k+': '+(v?'PASS':'REQUIRES REVIEW')),'',
 'The eight Elites were forced only as **legal native encounter identity** in the isolated simulator. Their combat abilities, timing and basic mechanics are unchanged; no generic HP/ATK buffs were applied to mobs or Bosses.',
 'At synthetic high E levels, fight win-rate saturation may remain; evaluate elapsed fight time, damage and survival, not only wins. No claim that a 60–70% victory target has been reached without evidence.','');
 return lines.join('\n');
}
function parse(args){
 const o={...DEFAULTS};
 for(const a of args){
  const m=/^--([a-z-]+)=(.*)$/.exec(a);if(!m)throw Error('Invalid Stage 6.19 CLI '+a);
  if(m[1]==='mode'&&['pilot','matrix','plan'].includes(m[2]))o.mode=m[2];
  else if(m[1]==='seeds-per-cell')o.seedsPerCell=Number(m[2]);
  else if(m[1]==='out')o.out=m[2];
  else throw Error('Unsupported Stage 6.19 CLI '+a);
 }
 return safe(o);
}
function main(argv=process.argv.slice(2)){
 const settings=parse(argv),p=plan(settings);
 const evidence={stage:'6.19',settings,sourceSha:SOURCE_HASH,
  plannedSets:p.sets,plannedFights:p.fights,gameSourceHash:S.sourceFingerprint().sha256};
 if(settings.mode==='plan'){console.log('STAGE619_PLAN='+JSON.stringify(evidence));return evidence;}
 const rows=p.rows.map(r=>matched(r,settings));
 evidence.results=rows;evidence.summary=summary(rows);
 const dest=path.resolve(settings.out);fs.mkdirSync(path.dirname(dest),{recursive:true});
 fs.writeFileSync(dest,JSON.stringify(evidence,null,2)+'\n');
 fs.writeFileSync(dest.replace(/\.json$/,'.md'),markdown(evidence)+'\n');
 console.log('STAGE619='+JSON.stringify({sets:rows.length,fights:evidence.summary.fights,
  verified:evidence.summary.verified,byElite:evidence.summary.byElite,
  byBudget:evidence.summary.byBudget,gate:evidence.summary.gate,out:settings.out}));
 return evidence;
}
if(require.main===module){try{main();}catch(e){console.error('STAGE619_ERROR',e.stack||e);process.exitCode=1;}}
module.exports={IDS,NAMES,DEFAULTS,LIVE_RUNTIME,BASELINE_RUNTIME,SOURCE_HASH,
 safe,plan,fight,matched,collect,summary,markdown,parse,main};
