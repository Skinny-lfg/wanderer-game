'use strict';
// Stage 6.15 — controlled NATIVE hierarchy audit: normal (three mobs) vs
// Elite vs Boss, keeping exactly the SAME player snapshot and gear/seed/Realm
// in each matched triple. NO changes to game balance or enemy data.
// Synthetic Talent XP, gear and first-ring encounter access are NOT earned.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const S=require('./simulate-progression.cjs');
const M=require('./v013-stage612-controlled-combat.cjs');
const T=globalThis.WandererAutomaticTalents;
const sha=x=>crypto.createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');
const unique=a=>[...new Set(a)];
const FAMILIES=['blood','decay','radiance','aegis','fury','arcane'];
const BUDGET_LEVEL=Object.freeze({12:5,24:15,36:35,60:70});
const KINDS=['normal','elite','boss'];
const DEFAULTS=Object.freeze({mode:'pilot',seedsPerCell:2,budgets:[12,24,36,60],
 seedStart:6150011,rarity:'Rare',risk:1,tickLimit:4500,
 out:'reports/v013-stage615-hierarchy-pilot.json',resume:false});
function provenance(){
 const names=['./simulate-progression.cjs','./v013-stage612-controlled-combat.cjs',
  './v013-stage615-enemy-hierarchy.cjs'];
 return {game:S.sourceFingerprint().sha256,
  scripts:Object.fromEntries(names.map(n=>[n,sha(fs.readFileSync(require.resolve(n)))]))};
}
function profiles(){
 const all=M.archetypes().filter(x=>x.kind==='strategic-profile');
 const byFamily=new Map(FAMILIES.map(f=>[f,all.filter(x=>x.primary===f)]));
 for(const [f,arr]of byFamily)
  if(!arr.length)throw Error('No legal native profile for Affinity '+f);
 return byFamily;
}
function plan(settings=DEFAULTS){
 if(!Number.isSafeInteger(settings.seedsPerCell)||settings.seedsPerCell<1||
   settings.seedsPerCell>16||!Number.isSafeInteger(settings.seedStart)||
   settings.seedStart<6000000||settings.seedStart>0x7fffffff-900000)
  throw Error('Invalid independent hierarchy cohort');
 if(!Array.isArray(settings.budgets)||!settings.budgets.length||
    unique(settings.budgets).length!==settings.budgets.length||
    settings.budgets.some(b=>!Object.hasOwn(BUDGET_LEVEL,b)))
  throw Error('Unsupported native budget');
 if(![0,1,2].includes(settings.risk))throw Error('Invalid real Realm risk');
 const byFamily=profiles(),rows=[];
 for(const [fi,realm]of FAMILIES.entries())
  for(const [bi,budget]of settings.budgets.entries())
   for(let slot=0;slot<2;slot++){
    const family=slot===0?realm:FAMILIES[(fi+1)%FAMILIES.length];
    const arr=byFamily.get(family);
    const archetype=arr[slot===0?0:Math.min(1,arr.length-1)];
    const spec=M.buildTalent(archetype,budget);
    if(!T.valid(spec.talents)||T.earned(spec.talents)!==budget)
     throw Error('Illegal native v15 Talent profile');
    const gear=M.equipment(archetype,fi,bi,0);
    if(!gear?.weapon||!gear?.armor||gear.offhand===undefined)
     throw Error('Invalid native gear selector');
    const build={id:'stage615-'+archetype.key,weapon:gear.weapon,
     families:[archetype.primary,...(archetype.secondary?[archetype.secondary]:[])],skills:[]};
    for(let i=0;i<settings.seedsPerCell;i++){
     const seed=settings.seedStart+fi*100000+bi*10000+slot*1000+i*61;
     rows.push({id:'hierarchy-'+realm+'-'+budget+'-'+slot+'-s'+String(i).padStart(2,'0'),
      realm,budget,level:BUDGET_LEVEL[budget],risk:settings.risk,seed,
      slot,aligned:slot===0,sourceArchetype:archetype.key,
      sourceFamily:archetype.primary,spent:spec.spent,
      talentHash:spec.talentSha256,talents:spec.talents,
      unlocked:spec.unlocked,gear,build});
    }
   }
 if(rows.length!==FAMILIES.length*settings.budgets.length*2*settings.seedsPerCell||
    unique(rows.map(r=>r.id)).length!==rows.length||
    unique(rows.map(r=>r.seed)).length!==rows.length)
  throw Error('Duplicated or skipped matched hierarchy triple');
 return {triples:rows.length,actualNativeFights:rows.length*3,
  rows,distinctArchetypes:unique(rows.map(r=>r.sourceArchetype)).length,
  families:FAMILIES,budgets:settings.budgets,perCell:settings.seedsPerCell};
}
function nativeOptions(row,kind,settings){
 return {mode:kind==='boss'?'bosses':'encounter',
  points:row.budget,gear:'current',rarity:settings.rarity,runes:false,
  contracts:'none',targetPolicy:'focus',measure:true,tickLimit:settings.tickLimit,
  lockScenarioStreams:true,controlledTalents:row.talents,
  armorType:row.gear.armor,offhandType:row.gear.offhand};
}
function fightKind(row,kind,settings=DEFAULTS){
 if(!KINDS.includes(kind))throw Error('Unknown native class '+kind);
 const native=S.encounter(row.level,row.build,row.seed,kind,
  nativeOptions(row,kind,settings),undefined,undefined,row.realm,row.risk);
 if(native.timedOut||native.status==='timeout'||!native.won&&!native.died)
  throw Error('Unresolved real native '+kind+' encounter: '+row.id);
 if(native.affinity!==row.realm||native.nativeEncounter!==kind||
    native.risk!==row.risk||native.level!==row.level||
    native.pointsBudget!==row.budget||native.pointsSpent!==row.spent||
    native.gearRarity!==settings.rarity||native.armorType!==row.gear.armor||
    native.offhandType!==(row.gear.offhand||null)||
    native.targetPolicy!=='focus'||
    JSON.stringify(native.controlledTalentNodes)!==JSON.stringify(row.talents.nodes)||
    native.controlledTalentMode!==(row.talents.element||'arcane'))
  throw Error('Drift in native player/Realm fixture for '+kind+' '+row.id);
 const r=native.roster;
 if(!Array.isArray(r)||!r.length||r.some(e=>!Number.isFinite(e.maxHp)||e.maxHp<=0||
  !Number.isFinite(e.attack)||!Number.isFinite(e.defense)))
  throw Error('Invalid real enemy roster stats '+row.id+' '+kind);
 if(kind==='elite'&&native.type!=='elite'||kind==='boss'&&native.type!=='boss')
  throw Error('Wrong native enemy combat classification '+kind);
 return {won:native.won,died:native.died,seconds:native.seconds,
  endHpFraction:Number((native.hpEnd/native.hpMax).toFixed(5)),
  damageTaken:native.damageTaken,damageDealt:native.damageDealt,
  bossSummons:native.bossSummons,eliteSummons:native.eliteSummons,
  bossHealing:native.bossHealing,bossWards:native.bossWards,
  enemyAbilityCasts:native.enemyAbilityCasts,
  initialRoles:native.initialRoles,bossId:native.bossId,
  eliteType:native.eliteType,roster:native.roster,
  initialRosterHp:r.reduce((v,e)=>v+e.maxHp,0),
  initialRosterAttack:r.reduce((v,e)=>v+e.attack,0),
  native};
}
function verifyMatched(row,arms){
 const n=arms.normal.native,e=arms.elite.native,b=arms.boss.native;
 const vals=[n,e,b];
 const checks={
  completePlayerGear:vals.every(x=>x.gearFingerprint===n.gearFingerprint),
  completeNonOffhandGear:vals.every(x=>x.otherGearFingerprint===n.otherGearFingerprint),
  sameOffhand:vals.every(x=>x.offhandType===n.offhandType&&x.offhandTrait===n.offhandTrait),
  samePlayerBuild:vals.every(x=>x.build===n.build&&x.build===row.build.id),
  sameNativeTalentBudget:vals.every(x=>x.pointsBudget===n.pointsBudget&&x.pointsSpent===n.pointsSpent),
  sameExactTalentNodes:vals.every(x=>
   JSON.stringify(x.controlledTalentNodes)===JSON.stringify(n.controlledTalentNodes)),
  sameTalentAttunement:vals.every(x=>x.controlledTalentMode===n.controlledTalentMode),
  sameSeedAndResolvedRealm:vals.every(x=>x.seed===n.seed&&x.resolvedSeed===n.resolvedSeed&&x.seedShift===n.seedShift),
  sameFamilyRiskLevel:vals.every(x=>x.affinity===n.affinity&&x.risk===n.risk&&x.level===n.level),
  sameStartingCondition:vals.every(x=>x.plannedConditionId===n.plannedConditionId),
  samePlayerProtection:vals.every(x=>x.hpMax===n.hpMax),
  threeDifferentNativeRoles:n.nativeEncounter==='normal'&&e.nativeEncounter==='elite'&&b.nativeEncounter==='boss'
 };
 const failures=Object.entries(checks).filter(([,v])=>!v).map(([k])=>k);
 if(failures.length)throw Error('Unmatched native hierarchy triple '+row.id+': '+failures.join(', '));
 return checks;
}
function triple(row,settings=DEFAULTS){
 const arms=Object.fromEntries(KINDS.map(kind=>[kind,fightKind(row,kind,settings)]));
 const checks=verifyMatched(row,arms);
 const n=arms.normal,e=arms.elite,b=arms.boss;
 const ratio=(top,bot)=>bot>0?Number((top/bot).toFixed(3)):null;
 const gap={
  normalBeatsElite:n.won&&!e.won,
  eliteBeatsBoss:e.won&&!b.won,
  eliteLosesBossWins:!e.won&&b.won,
  normalLosesEliteWins:!n.won&&e.won,
  eliteAndBossLose:!e.won&&!b.won,
  normalAndEliteWinBossLoses:n.won&&e.won&&!b.won,
  initialBossToEliteHealth:ratio(b.initialRosterHp,e.initialRosterHp),
  initialBossToEliteAttack:ratio(b.initialRosterAttack,e.initialRosterAttack),
  eliteToNormalGroupHealth:ratio(e.initialRosterHp,n.initialRosterHp),
  bossVsEliteDamageTaken:Number((b.damageTaken-e.damageTaken).toFixed(3)),
  bossVsEliteAbilityCasts:b.enemyAbilityCasts-e.enemyAbilityCasts
 };
 return {id:row.id,seed:row.seed,realm:row.realm,budget:row.budget,
  level:row.level,risk:row.risk,sourceArchetype:row.sourceArchetype,
  sourceFamily:row.sourceFamily,aligned:row.aligned,weapon:row.gear.weapon,
  armor:row.gear.armor,offhand:row.gear.offhand,spent:row.spent,
  talentHash:row.talentHash,lockedPlayerAndRealm:true,checks,
  gearFingerprint:n.native.gearFingerprint,
  resolvedSeed:n.native.resolvedSeed,arms,gap,
  warning:'Same player, rolled gear, native seed and Realm/Risk; different native enemy types. Enemy roster cannot be identical between types.'};
}
const total=(a,k)=>a.reduce((n,x)=>n+Number(!!k(x)),0);
function median(a){
 if(!a.length)return null;const s=a.slice().sort((x,y)=>x-y);
 const m=Math.floor(s.length/2);return s.length%2?s[m]:(s[m-1]+s[m])/2;
}
function group(rows){
 if(!rows.length)return null;
 const ratio=k=>median(rows.map(x=>x.gap[k]).filter(Number.isFinite));
 return {triples:rows.length,fights:rows.length*3,
  normalWins:total(rows,x=>x.arms.normal.won),
  eliteWins:total(rows,x=>x.arms.elite.won),
  bossWins:total(rows,x=>x.arms.boss.won),
  normalWinPct:Number((100*total(rows,x=>x.arms.normal.won)/rows.length).toFixed(1)),
  eliteWinPct:Number((100*total(rows,x=>x.arms.elite.won)/rows.length).toFixed(1)),
  bossWinPct:Number((100*total(rows,x=>x.arms.boss.won)/rows.length).toFixed(1)),
  eliteMinusBossWinPP:Number((100*(total(rows,x=>x.arms.elite.won)-total(rows,x=>x.arms.boss.won))/rows.length).toFixed(1)),
  normalMinusEliteWinPP:Number((100*(total(rows,x=>x.arms.normal.won)-total(rows,x=>x.arms.elite.won))/rows.length).toFixed(1)),
  eliteWinsBossLoses:total(rows,x=>x.gap.eliteBeatsBoss),
  eliteLosesBossWins:total(rows,x=>x.gap.eliteLosesBossWins),
  normalWinsEliteLoses:total(rows,x=>x.gap.normalBeatsElite),
  normalLosesEliteWins:total(rows,x=>x.gap.normalLosesEliteWins),
  allThreeWon:total(rows,x=>x.arms.normal.won&&x.arms.elite.won&&x.arms.boss.won),
  normalEliteWinBossLoses:total(rows,x=>x.gap.normalAndEliteWinBossLoses),
  bossAndEliteLose:total(rows,x=>x.gap.eliteAndBossLose),
  medianBossToEliteEnemyHpRatio:ratio('initialBossToEliteHealth'),
  medianBossToEliteEnemyAttackRatio:ratio('initialBossToEliteAttack'),
  medianEliteToNormalGroupHpRatio:ratio('eliteToNormalGroupHealth'),
  normalTankRooms:total(rows,x=>(x.arms.normal.initialRoles?.tank||0)>0),
  eliteTypes:unique(rows.map(x=>x.arms.elite.eliteType).filter(Boolean)).sort(),
  bossIds:unique(rows.map(x=>x.arms.boss.bossId).filter(Boolean)).sort(),
  medianBossOnlyDamageTaken:median(rows.map(x=>x.arms.boss.damageTaken)),
  medianEliteOnlyDamageTaken:median(rows.map(x=>x.arms.elite.damageTaken)),
  medianBossAbilityCasts:median(rows.map(x=>x.arms.boss.enemyAbilityCasts)),
  medianEliteAbilityCasts:median(rows.map(x=>x.arms.elite.enemyAbilityCasts))};
}
function summary(rows){
 const byFamily=Object.fromEntries(FAMILIES.map(f=>[f,group(rows.filter(x=>x.realm===f))]));
 const budgets=unique(rows.map(r=>r.budget)).sort((a,b)=>a-b);
 return {triples:rows.length,nativeFights:rows.length*3,
  matchingPlayerEquipment:total(rows,x=>x.lockedPlayerAndRealm&&Object.values(x.checks).every(Boolean)),
  familiesObserved:unique(rows.map(r=>r.realm)).sort(),
  budgetsObserved:budgets,
  archetypesObserved:unique(rows.map(r=>r.sourceArchetype)).sort(),
  byClass:group(rows),byFamily,
  byBudget:Object.fromEntries(budgets.map(b=>[String(b),group(rows.filter(x=>x.budget===b))])),
  byAlignment:{aligned:group(rows.filter(x=>x.aligned)),crossFamily:group(rows.filter(x=>!x.aligned))},
  distinctObservedBosses:unique(rows.map(x=>x.arms.boss.bossId).filter(Boolean)).sort(),
  distinctObservedEliteTypes:unique(rows.map(x=>x.arms.elite.eliteType).filter(Boolean)).sort(),
  missingHeroicFullProgression:true};
}
function atomicWrite(file,data){
 const abs=path.resolve(file),tmp=abs+'.tmp-'+process.pid;
 fs.mkdirSync(path.dirname(abs),{recursive:true});
 fs.writeFileSync(tmp,JSON.stringify(data,null,2)+'\n');fs.renameSync(tmp,abs);
}
function checkpointGuard(old,input){
 if(old.stage!=='6.15'||old.configHash!==input.configHash||
    old.plannedIds?.join('|')!==input.plannedIds.join('|')||
    !Array.isArray(old.results)||old.results.length!==old.completed||
    old.completed>input.plannedIds.length||
    unique(old.results.map(x=>x.id)).length!==old.completed)
  throw Error('Unsafe hierarchy resume: source, settings or scenario order changed');
 for(let i=0;i<old.completed;i++){
  const x=old.results[i];
  if(x.id!==input.plannedIds[i]||!x.lockedPlayerAndRealm||
     Object.keys(x.checks||{}).length!==12||!Object.values(x.checks).every(Boolean)||
     !KINDS.every(k=>x.arms?.[k]&&
      Number.isFinite(x.arms[k].native?.seconds)&&!x.arms[k].native.timedOut))
    throw Error('Corrupt or unmatched native hierarchy evidence checkpoint');
 }
}
function run(settings=DEFAULTS){
 const p=plan(settings),prov=provenance();
 const options={seedsPerCell:settings.seedsPerCell,budgets:settings.budgets,
  seedStart:settings.seedStart,rarity:settings.rarity,risk:settings.risk,
  tickLimit:settings.tickLimit};
 const input={stage:'6.15',kind:'matched-native-enemy-hierarchy-combat',
  plannedIds:p.rows.map(x=>x.id),
  configHash:sha({prov,options,ids:p.rows.map(x=>x.id)})};
 let report={...input,provenance:prov,options,
  planned:{nativeTriples:p.triples,nativeFights:p.actualNativeFights,
   archetypes:p.distinctArchetypes},completed:0,results:[],
  caveats:[
   'The same native v15 Talent allocation, player gear rolls and starting Realm/Risk are used within each NORMAL/ELITE/BOSS comparison.',
   'Enemy encounters intentionally contain DIFFERENT native enemies; comparing the same enemy roster between classes would be invalid.',
   'Normal combat uses the real default group of three enemies; Elite and Boss use their real native single-leader encounter setup.',
   'Dangerous risk is controlled for this study; no claims across Normal/Deadly risk levels.',
   'A Boss may have preparation, modifiers and mechanics absent from the Elite: no manual equalization or fake mob stats.',
   'The first-ring Boss is spawned through the native combat API, not obtained after completing 15 naturally traversed Realms or collecting boss-preparation rewards.',
   'Gear rarity Rare, synthetic Talent XP and high-E access are selected fixtures, not earned live accounts.',
   'Even within an exactly matched triple, the enemy class causes different RNG consumption after combat begins.',
   'Normal group may have Tank mobs; role distributions are observed from real native rosters, not forced into exact Tank-only fights.',
   'Paired class win differences diagnose an imbalance, not prove what coefficient should change. Do not buff/nerf automatically.'
  ]};
 if(settings.resume&&fs.existsSync(settings.out)){
  const old=JSON.parse(fs.readFileSync(settings.out,'utf8'));
  checkpointGuard(old,input);report=old;
 }
 for(let i=report.completed;i<p.rows.length;i++){
  report.results.push(triple(p.rows[i],settings));
  report.completed=report.results.length;
  if(report.completed%6===0||report.completed===p.rows.length){
   report.summary=summary(report.results);atomicWrite(settings.out,report);
  }
 }
 report.summary=summary(report.results);
 atomicWrite(settings.out,report);
 return report;
}
function parse(args=[]){
 const opts={...DEFAULTS,budgets:[...DEFAULTS.budgets]};
 for(const arg of args){
  const m=/^--([a-z-]+)=(.+)$/.exec(arg);
  if(!m)throw Error('Expected --key=value: '+arg);
  const [,key,value]=m;
  if(key==='mode'&&['pilot','matrix','plan'].includes(value))opts.mode=value;
  else if(key==='seeds-per-cell')opts.seedsPerCell=Number(value);
  else if(key==='budgets')opts.budgets=unique(value.split(',').map(Number));
  else if(key==='seed-start')opts.seedStart=Number(value);
  else if(key==='risk')opts.risk=Number(value);
  else if(key==='tick-limit')opts.tickLimit=Number(value);
  else if(key==='rarity'&&['Uncommon','Rare','Epic'].includes(value))opts.rarity=value;
  else if(key==='resume'&&['true','false'].includes(value))opts.resume=value==='true';
  else if(key==='out'&&value.endsWith('.json'))opts.out=value;
  else throw Error('Unsupported hierarchy CLI option: '+arg);
 }
 if(!Number.isSafeInteger(opts.tickLimit)||opts.tickLimit<100||opts.tickLimit>20000||
  !['Uncommon','Rare','Epic'].includes(opts.rarity))
  throw Error('Invalid hierarchy native fixture');
 if(!Number.isSafeInteger(opts.seedsPerCell)||opts.seedsPerCell<1||opts.seedsPerCell>16||
   !Number.isSafeInteger(opts.seedStart)||opts.seedStart<6000000||
   opts.seedStart>0x7fffffff-900000||![0,1,2].includes(opts.risk))
  throw Error('Invalid hierarchy seed cohort');
 if(!opts.budgets.length||unique(opts.budgets).length!==opts.budgets.length||
    opts.budgets.some(b=>!Object.hasOwn(BUDGET_LEVEL,b)))
  throw Error('Invalid hierarchy budget');
 return opts;
}
function markdown(report){
 const s=report.summary,format=(g)=>g?[
  g.triples,g.normalWins,g.eliteWins,g.bossWins,g.normalWinPct.toFixed(1)+'%',
  g.eliteWinPct.toFixed(1)+'%',g.bossWinPct.toFixed(1)+'%',
  g.eliteMinusBossWinPP.toFixed(1)+'pp',g.medianBossToEliteEnemyHpRatio,
  g.medianBossToEliteEnemyAttackRatio].join(' | '):'';
 return ['# Stage 6.15 — Measured gap: normal mobs vs Elite vs Boss (REAL native fights)','',
  'This is synthetic gear/XP, first-ring controlled actual native encounters; NOT genuine player Expedition progress.','',
  'Native source SHA-256: '+report.provenance.game,
  'Matched class triples completed: '+s.triples,
  'Real native combat fights: '+s.nativeFights,
  'Player gear, native TalentGraph, seed, Realm/Risk identical: '+s.matchingPlayerEquipment+'/'+s.triples,
  'Distinct observed Boss IDs: '+s.distinctObservedBosses.join(', '),
  'Distinct observed Elite Types (not exhaustive unless separately verified): '+s.distinctObservedEliteTypes.join(', '),'',
  '## Direct same-player, same-seed hierarchy','',
  '| Group | Triples | Normal W | Elite W | Boss W | Normal % | Elite % | Boss % | Elite–Boss Gap | Boss/Elite HP | Boss/Elite ATK |',
  '|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|',
  '| All | '+format(s.byClass)+' |',
  ...Object.entries(s.byFamily).map(([f,g])=>'| '+f+' | '+format(g)+' |'),
  ...Object.entries(s.byBudget).map(([b,g])=>'| '+b+' available points | '+format(g)+' |'),
  '',
  '## Matched outcome patterns','',
  '- Elite win / Boss loss: '+s.byClass.eliteWinsBossLoses,
  '- Boss win / Elite loss (unexpected hierarchy inversion): '+s.byClass.eliteLosesBossWins,
  '- Normal win / Elite loss: '+s.byClass.normalWinsEliteLoses,
  '- Elite win / Normal loss (normal group can be more dangerous): '+s.byClass.normalLosesEliteWins,
  '- Normal + Elite win / Boss loss: '+s.byClass.normalEliteWinBossLoses,
  '- Normal groups containing ≥1 native Tank: '+s.byClass.normalTankRooms+'/'+s.triples,
  '',
  '## Interpretation constraints','',
  ...report.caveats.map(x=>'- '+x),''].join('\n');
}
function main(argv=process.argv.slice(2)){
 const opts=parse(argv);
 if(opts.mode==='plan'){
  const p=plan(opts);
  const out={stage:'6.15',kind:'planned-only',triples:p.triples,fights:p.actualNativeFights,
   perCell:p.perCell,archetypes:p.distinctArchetypes,
   families:p.families,budgets:p.budgets,
   rows:p.rows.map(x=>({id:x.id,realm:x.realm,budget:x.budget,level:x.level,
    sourceArchetype:x.sourceArchetype,gear:x.gear,seed:x.seed,aligned:x.aligned}))};
  atomicWrite(opts.out,out);
  console.log('STAGE615_PLAN='+JSON.stringify({triples:out.triples,fights:out.fights,
   archetypes:out.archetypes,seedStarts:p.rows.length}));
  return out;
 }
 const r=run(opts);fs.writeFileSync(opts.out.replace(/\.json$/,'.md'),markdown(r));
 console.log('STAGE615='+JSON.stringify({mode:opts.mode,triples:r.summary.triples,
  fights:r.summary.nativeFights,matches:r.summary.matchingPlayerEquipment,
  bossIds:r.summary.distinctObservedBosses,elites:r.summary.distinctObservedEliteTypes,
  normalWins:r.summary.byClass.normalWins,eliteWins:r.summary.byClass.eliteWins,
  bossWins:r.summary.byClass.bossWins,gapPP:r.summary.byClass.eliteMinusBossWinPP,
  hpRatio:r.summary.byClass.medianBossToEliteEnemyHpRatio,
  atkRatio:r.summary.byClass.medianBossToEliteEnemyAttackRatio,
  bossInversion:r.summary.byClass.eliteLosesBossWins,
  perFamily:Object.fromEntries(Object.entries(r.summary.byFamily).map(([k,x])=>
   [k,{triples:x.triples,normal:x.normalWins,elite:x.eliteWins,boss:x.bossWins,
    bossEliteGapPP:x.eliteMinusBossWinPP}])),out:opts.out}));
 return r;
}
if(require.main===module){try{main();}catch(e){console.error('STAGE615_ERROR',e.stack||e);process.exitCode=1;}}
module.exports={DEFAULTS,FAMILIES,BUDGET_LEVEL,KINDS,provenance,profiles,plan,
 nativeOptions,fightKind,verifyMatched,triple,group,summary,checkpointGuard,
 run,parse,markdown,main};
