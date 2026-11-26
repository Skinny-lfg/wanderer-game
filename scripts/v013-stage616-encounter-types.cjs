'use strict';
// Stage 6.16 -- granular native encounter study across normal group sizes,
// plus per-Elite-subtype and per-Boss-ID. All execution is real native combat.
// Existing Stage 6.15 build planner is reused; game code is NOT mutated.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const H=require('./v013-stage615-enemy-hierarchy.cjs');
const S=require('./simulate-progression.cjs');
const T=globalThis.WandererAutomaticTalents;
const ALL_GROUPS=Object.freeze([1,2,3,4,6,8,12,20]);
const KINDS=Object.freeze([...ALL_GROUPS.map(n=>'normal-'+n),'elite','boss']);
// Display labels only; stable native IDs remain unchanged for combat and raw JSON.
const ELITE_DISPLAY_NAMES=Object.freeze({
 tank:'The Pallbearer',
 berserker:'Bloodscar Ravager',
 vampire:'The Thirst',
 caster:'Voidborne Hexer',
 gravecaller:'Gravecaller',
 oathbound_exarch:'The Shepherd',
 the_gilded:'The Gilded',
 ashen_executioner:'Ashen Executioner'
});
const eliteDisplayName=id=>ELITE_DISPLAY_NAMES[id]||id;
const DEFAULTS=Object.freeze({mode:'pilot',seedsPerCell:2,seedStart:6160011,
 budgets:[12,24,36,60],risk:1,rarity:'Rare',tickLimit:4500,
 out:'reports/v013-stage616-encounter-pilot.json',resume:false});
const sha=x=>crypto.createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');
const uniq=a=>[...new Set(a)];
function settingsSafe(settings){
 const opts={...H.DEFAULTS,...settings};
 if(![1,2,4,8,12,16].includes(opts.seedsPerCell)||
  !Number.isSafeInteger(opts.seedStart)||opts.seedStart<6000000||
  opts.seedStart>0x7fffffff-900000||opts.risk!==1||
  opts.rarity!=='Rare'||opts.tickLimit!==4500)
  throw Error('Unreviewed native fixture settings; only Dangerous risk, Rare gear, 4500 ticks');
 return opts;
}
function plan(settings=DEFAULTS){
 const h=H.plan(settingsSafe(settings));
 if(h.rows.length!==H.FAMILIES.length*settings.budgets.length*2*settings.seedsPerCell)
  throw Error('Unexpected canonical six Realms/four budgets/two strategies cohort size');
 for(const row of h.rows)
  if(!T.valid(row.talents)||T.earned(row.talents)!==row.budget)
   throw Error('Illegal native v15 profile '+row.id);
 return {rows:h.rows,matchedSets:h.rows.length,
  fights:h.rows.length*KINDS.length,
  budgets:h.budgets,groups:[...ALL_GROUPS],
  seedStarts:uniq(h.rows.map(r=>r.seed)).length,
  distinctProfiles:h.distinctArchetypes};
}
function nativeFight(row,kind,settings){
 const isNormal=kind.startsWith('normal-');
 const size=isNormal?Number(kind.slice(7)):null;
 if(!KINDS.includes(kind)||isNormal&&!ALL_GROUPS.includes(size))
  throw Error('Unplanned encounter kind '+kind);
 const nativeKind=isNormal?'normal':kind;
 const opts=H.nativeOptions(row,nativeKind,settings);
 const x=S.encounter(row.level,row.build,row.seed,nativeKind,opts,
  undefined,undefined,row.realm,row.risk,isNormal?size:undefined);
 if(x.timedOut||x.status==='timeout'||!x.won&&!x.died)throw Error('Invalid native combat outcome '+row.id+' '+kind);
 if(x.affinity!==row.realm||x.nativeEncounter!==nativeKind||
  x.risk!==row.risk||x.level!==row.level||
  x.pointsBudget!==row.budget||x.pointsSpent!==row.spent||
  x.gearRarity!==settings.rarity||x.armorType!==row.gear.armor||
  (x.offhandType||null)!==(row.gear.offhand||null)||
  x.targetPolicy!=='focus'||
  JSON.stringify(x.controlledTalentNodes)!==JSON.stringify(row.talents.nodes)||
  x.controlledTalentMode!==(row.talents.element||'arcane')||
  isNormal&&(x.requestedGroupSize!==size||x.groupSize!==size)||
  !isNormal&&x.requestedGroupSize!==1)
  throw Error('Broken native per-kind size/talent/Realm fixture: '+row.id+' '+kind+' '+JSON.stringify({
   req:x.requestedGroupSize,real:x.groupSize,kind:x.nativeEncounter,size}));
 const initial=x.roster;
 if(!Array.isArray(initial)||initial.length<1||initial.some(e=>!e.name||
  !Number.isFinite(e.attack)||!Number.isFinite(e.maxHp)))
  throw Error('Missing real initial mob roster: '+row.id+' '+kind);
 return {kind,groupSize:isNormal?size:1,won:x.won,died:x.died,
  seconds:x.seconds,hpEnd:x.hpEnd,hpMax:x.hpMax,
  damageTaken:x.damageTaken,damageDealt:x.damageDealt,
  enemyAbilityCasts:x.enemyAbilityCasts,eliteSummons:x.eliteSummons,
  bossSummons:x.bossSummons,bossHealing:x.bossHealing,bossWards:x.bossWards,
  eliteType:x.eliteType,bossId:x.bossId,
  roles:x.initialRoles,initial,
  initialRosterHp:initial.reduce((n,e)=>n+e.maxHp,0),
  initialRosterAttack:initial.reduce((n,e)=>n+e.attack,0),
  prepared:x.bossPreparation||null,
  equalGearFingerprint:x.gearFingerprint,
  equalStartingHp:x.hpStart,equalStartingMp:x.mpStart,
  equalHeroHpMax:x.hpMax,equalHeroMpMax:x.mpMax,
  exactTalentNodes:x.controlledTalentNodes,
  exactTalentMode:x.controlledTalentMode,
  exactBudget:x.pointsBudget,exactSpent:x.pointsSpent,
  resolvedSeed:x.resolvedSeed,seedShift:x.seedShift,
  condition:x.plannedConditionId,
  enemyRosterAttackAtStart:initial.map(e=>e.attack),
  enemyRosterMaxHpAtStart:initial.map(e=>e.maxHp),
  native:x};
}
function verify(row,arms){
 const entries=KINDS.map(k=>arms[k]);
 const first=entries[0],src=first.native;
 const tests={
  sameRolledGear:entries.every(e=>e.equalGearFingerprint===first.equalGearFingerprint),
  samePlayerHitPoints:entries.every(e=>e.equalStartingHp===first.equalStartingHp&&e.equalHeroHpMax===first.equalHeroHpMax),
  samePlayerMana:entries.every(e=>e.equalStartingMp===first.equalStartingMp&&e.equalHeroMpMax===first.equalHeroMpMax),
  samePointBudget:entries.every(e=>e.exactBudget===first.exactBudget&&e.exactSpent===first.exactSpent),
  sameTalentNodes:entries.every(e=>JSON.stringify(e.exactTalentNodes)===JSON.stringify(first.exactTalentNodes)),
  sameTalentAttunement:entries.every(e=>e.exactTalentMode===first.exactTalentMode),
  sameSeed:entries.every(e=>e.resolvedSeed===first.resolvedSeed&&e.seedShift===first.seedShift&&e.native.seed===src.seed),
  sameRealm:entries.every(e=>e.native.affinity===src.affinity&&e.native.risk===src.risk&&e.native.level===src.level),
  sameCondition:entries.every(e=>e.condition===first.condition),
  sameWeapon:entries.every(e=>e.native.build===src.build&&e.native.armorType===src.armorType&&e.native.offhandType===src.offhandType),
  actualRequestedGroupSize:ALL_GROUPS.every(n=>arms['normal-'+n].native.requestedGroupSize===n&&arms['normal-'+n].native.groupSize===n),
  nativeEliteAndBoss:arms.elite.native.type==='elite'&&arms.boss.native.type==='boss',
  noTimeouts:entries.every(e=>!e.native.timedOut),
  completeTenArms:entries.length===10&&KINDS.every(k=>!!arms[k])
 };
 const fails=Object.entries(tests).filter(([,v])=>!v).map(([k])=>k);
 if(fails.length)throw Error('Stage 6.16 mismatch '+row.id+': '+fails.join(', '));
 return tests;
}
function matched(row,settings=DEFAULTS){
 const arms=Object.fromEntries(KINDS.map(k=>[k,nativeFight(row,k,settings)]));
 const tests=verify(row,arms);
 return {id:row.id,seed:row.seed,realm:row.realm,budget:row.budget,level:row.level,
  profile:row.sourceArchetype,sourceFamily:row.sourceFamily,aligned:row.aligned,
  weapon:row.gear.weapon,armor:row.gear.armor,offhand:row.gear.offhand,
  talentHash:row.talentHash,checks:tests,arms,
  conditions:'Native same player/gear/Talents/Realm/seed; only size/type of opponent changes. Full native RNG may diverge after spawning.'};
}
const sum=a=>a.reduce((x,y)=>x+y,0);
const count=(a,fn)=>a.filter(fn).length;
const pct=(w,n)=>n?Number((100*w/n).toFixed(1)):null;
function median(a){
 const n=a.slice().filter(Number.isFinite).sort((x,y)=>x-y);
 if(!n.length)return null;const h=n.length>>1;
 return n.length%2?n[h]:(n[h-1]+n[h])/2;
}
function collect(rows,fn){
 const xs=rows.filter(fn),win=count(xs,x=>x.arm.won),n=xs.length;
 return {n,wins:win,losses:n-win,winPct:pct(win,n),
  meanEnemyCount:n?Number((sum(xs.map(x=>x.arm.groupSize))/n).toFixed(2)):null,
  medianPlayerDamageTaken:median(xs.map(x=>x.arm.damageTaken)),
  medianFightSeconds:median(xs.map(x=>x.arm.seconds)),
  meanMinions:n?Number((sum(xs.map(x=>x.arm.roles?.minion||0))/n).toFixed(2)):null,
  meanTanks:n?Number((sum(xs.map(x=>x.arm.roles?.tank||0))/n).toFixed(2)):null,
  meanCasters:n?Number((sum(xs.map(x=>x.arm.roles?.caster||0))/n).toFixed(2)):null,
  meanSkirmishers:n?Number((sum(xs.map(x=>x.arm.roles?.skirmisher||0))/n).toFixed(2)):null};
}
function summary(rows){
 const all=rows.flatMap(row=>KINDS.map(k=>({row,arm:row.arms[k],kind:k})));
 const kinds=Object.fromEntries(KINDS.map(k=>[k,collect(all,x=>x.kind===k)]));
 const byBudget=Object.fromEntries([12,24,36,60].map(p=>[p,Object.fromEntries(
  KINDS.map(k=>[k,collect(all,x=>x.kind===k&&x.row.budget===p)]))]));
 const byRealm=Object.fromEntries(H.FAMILIES.map(f=>[f,Object.fromEntries(
  KINDS.map(k=>[k,collect(all,x=>x.kind===k&&x.row.realm===f)]))]));
 const elites=uniq(all.filter(x=>x.kind==='elite').map(x=>x.arm.eliteType).filter(Boolean)).sort();
 const bosses=uniq(all.filter(x=>x.kind==='boss').map(x=>x.arm.bossId).filter(Boolean)).sort();
 const solo=all.filter(x=>x.kind==='normal-1');
 const soloNames=uniq(solo.flatMap(x=>x.arm.initial.map(e=>e.name))).sort();
 const roles=['minion','tank','caster','skirmisher'];
 const byElite=Object.fromEntries(elites.map(t=>[t,collect(all,x=>x.kind==='elite'&&x.arm.eliteType===t)]));
 const byBoss=Object.fromEntries(bosses.map(t=>[t,collect(all,x=>x.kind==='boss'&&x.arm.bossId===t)]));
 const bySoloRole=Object.fromEntries(roles.map(t=>[t,collect(solo,x=>x.arm.initial.some(e=>e.role===t))]));
 const bySoloName=Object.fromEntries(soloNames.map(t=>[t,{
  ...collect(solo,x=>x.arm.initial.some(e=>e.name===t)),
  role:solo.find(x=>x.arm.initial.some(e=>e.name===t))?.arm.initial.find(e=>e.name===t)?.role||null}]));
 const anyBossIds=bosses.length===6,anyEliteTypes=elites.length===8;
 const perGroup=ALL_GROUPS.map(n=>{
  const current=kinds['normal-'+n],elite=kinds.elite,boss=kinds.boss;
  return {size:n,...current,
   normalBeatEliteSameBuild:count(rows,r=>r.arms['normal-'+n].won&&!r.arms.elite.won),
   eliteBeatGroupSameBuild:count(rows,r=>!r.arms['normal-'+n].won&&r.arms.elite.won),
   bossBeatGroupSameBuild:count(rows,r=>r.arms['normal-'+n].won&&!r.arms.boss.won),
   groupBeatBossSameBuild:count(rows,r=>!r.arms['normal-'+n].won&&r.arms.boss.won),
   eliteWinRate:elite.winPct,bossWinRate:boss.winPct};
 });
 return {matchedSets:rows.length,actualFights:rows.length*KINDS.length,
  matchedVerified:count(rows,x=>Object.values(x.checks).every(Boolean)),
  coveredRealms:uniq(rows.map(r=>r.realm)).sort(),
  perGroup,kinds,byBudget,byRealm,byElite,byBoss,bySoloRole,bySoloName,
  distinctDedicatedBosses:bosses,distinctObservedEliteTypes:elites,
  allSixBossesSeen:anyBossIds,allEightEliteLabelsSeen:anyEliteTypes,
  perGroupNote:'Exact native count requested/observed, includes minions in larger groups. Do not interpret 20-mob swarm as 20 full-strength Tanks.',
  caveat:'Pooled percentages are conditional on synthetic valid Talent points, Rare native rolled gear, Dangerous Risk and fixed Focus targeting. Not natural progression odds.'};
}
function provenance(){
 const paths=['./simulate-progression.cjs','./v013-stage612-controlled-combat.cjs',
  './v013-stage615-enemy-hierarchy.cjs','./v013-stage616-encounter-types.cjs'];
 return {game:S.sourceFingerprint().sha256,
  scripts:Object.fromEntries(paths.map(s=>[s,sha(fs.readFileSync(require.resolve(s)))]))};
}
function atomicWrite(file,data){
 const f=path.resolve(file),tmp=f+'.tmp-'+process.pid;
 fs.mkdirSync(path.dirname(f),{recursive:true});
 fs.writeFileSync(tmp,JSON.stringify(data,null,2)+'\n');
 fs.renameSync(tmp,f);
}
function reportInput(opts,p){
 const options={seedsPerCell:opts.seedsPerCell,budgets:opts.budgets,seedStart:opts.seedStart,
  risk:opts.risk,rarity:opts.rarity,tickLimit:opts.tickLimit};
 return {stage:'6.16',type:'ten-way-native-enemy-granular-audit',
  provenance:provenance(),options,plannedIds:p.rows.map(r=>r.id),
  configHash:sha({options,game:S.sourceFingerprint().sha256,sourceFile:provenance().scripts,
   ids:p.rows.map(r=>r.id)})};
}
function guardCheckpoint(r,input){
 if(r.stage!==input.stage||r.type!==input.type||r.configHash!==input.configHash||
  r.plannedIds?.join('|')!==input.plannedIds.join('|')||
  !Array.isArray(r.results)||r.results.length!==r.completed||
  r.completed>input.plannedIds.length||
  uniq(r.results.map(x=>x.id)).length!==r.results.length)
  throw Error('Unsafe Stage 6.16 evidence resume');
 for(let i=0;i<r.completed;i++){
  const x=r.results[i];
  if(x.id!==input.plannedIds[i]||!KINDS.every(k=>x.arms[k]&&
   !x.arms[k].native?.timedOut&&Number.isFinite(x.arms[k].native?.seconds))||
   Object.keys(x.checks||{}).length!==14||!Object.values(x.checks).every(Boolean))
   throw Error('Corrupt Stage 6.16 evidence checkpoint');
 }
}
function run(settings=DEFAULTS){
 const opts=settingsSafe(settings),p=plan(opts),input=reportInput(opts,p);
 let r={...input,planned:{matchedSets:p.matchedSets,actualFights:p.fights,
  groupSizes:p.groups,distinctProfiles:p.distinctProfiles},
  completed:0,results:[],summary:null,
  limitations:[
   'Normal 1,2,3,4,6,8,12,20 groups use REAL native Stage 8 spawn compositions, including minions and real Realm weights.',
   'Elite and Boss are native random spawns from same starting seeded Realm; elite type is observed, never injected/forced.',
   'Ten encounter types are each tested on an identical legal player/rolled gear/Talent build and native seed.',
   'Bosses spawned first-ring are unprepared, not naturally progressed final Expedition fights.',
   'Risk 1 and Rare gear only. No human play, natural E1-20 progression, Boon/potion usage, or different targeting.',
   'Boss, Elite and Normal may spawn their own native reinforcements/reserves; the normal count is the intended initial roster count.',
   'One mob uses native role weights and cannot roll a Minion; minions normally appear in native groups of 2+.',
   'Small per-name solo mob samples must not be ranked conclusively; observe per-role and per-group before individual action.',
   'No game balance data or AI code changed. All native enemies may consume RNG differently after starting.'
  ]};
 if(opts.resume&&fs.existsSync(opts.out)){const old=JSON.parse(fs.readFileSync(opts.out,'utf8'));guardCheckpoint(old,input);r=old;}
 for(let i=r.completed;i<p.rows.length;i++){
  r.results.push(matched(p.rows[i],opts));r.completed=r.results.length;
  if(r.completed%8===0||r.completed===p.rows.length){
   r.summary=summary(r.results);atomicWrite(opts.out,r);
  }
 }
 return r;
}
function parse(args=[]){
 const o={...DEFAULTS,budgets:[...DEFAULTS.budgets]};
 for(const arg of args){
  const m=/^--([a-z-]+)=(.+)$/.exec(arg);if(!m)throw Error('Invalid --key=value '+arg);
  const [,k,v]=m;
  if(k==='mode'&&['pilot','matrix','plan'].includes(v))o.mode=v;
  else if(k==='seeds-per-cell')o.seedsPerCell=Number(v);
  else if(k==='seed-start')o.seedStart=Number(v);
  else if(k==='budgets')o.budgets=uniq(v.split(',').map(Number));
  else if(k==='risk')o.risk=Number(v);
  else if(k==='rarity')o.rarity=v;
  else if(k==='tick-limit')o.tickLimit=Number(v);
  else if(k==='resume'&&['true','false'].includes(v))o.resume=v==='true';
  else if(k==='out'&&v.endsWith('.json'))o.out=v;
  else throw Error('Unsupported Stage 6.16 option '+arg);
 }
 if(!Number.isSafeInteger(o.seedsPerCell)||!Number.isSafeInteger(o.seedStart)||
  o.seedsPerCell<1||o.seedsPerCell>16||o.seedStart<6000000||
  o.seedStart>0x7fffffff-900000||o.risk!==1||o.rarity!=='Rare'||o.tickLimit!==4500||
  !o.budgets.length||o.budgets.some(b=>!Object.hasOwn(H.BUDGET_LEVEL,b)))
  throw Error('Invalid Stage 6.16 native fixture');
 return o;
}
function table(report){
 const s=report.summary,rows=[
 '# Stage 6.16 — Granular native enemy win rates: all mob group sizes, Elite types and 6 Bosses','',
 '**Source:** real native game engine; same controlled legal Hero+gear+Talents+seed for each 10-way encounter family. Not naturally earned E1–E70.','',
 'Native source SHA256: '+report.provenance.game,
 'Matched ten-way hero scenarios: '+s.matchedSets,
 'Real native fights: '+s.actualFights,
 'Strict same-hero/gear/seed validations: '+s.matchedVerified+'/'+s.matchedSets,'',
 '## Mob groups, same-hero measurements','',
 '| Initial mobs | Native wins | Win % | Mean minions | Mean tanks | Mean casters | Median damage taken |',
 '|---:|---:|---:|---:|---:|---:|---:|'];
 for(const x of s.perGroup)
  rows.push('| '+x.size+' | '+x.wins+'/'+x.n+' | '+x.winPct+'% | '+x.meanMinions+' | '+x.meanTanks+' | '+x.meanCasters+' | '+x.medianPlayerDamageTaken+' |');
 rows.push('','## Eight named Elites observed (display names)','',
  '| Elite | Wins | Win % |', '|---|---:|---:|');
 for(const [name,x]of Object.entries(s.byElite))
  rows.push('| '+eliteDisplayName(name)+' | '+x.wins+'/'+x.n+' | '+x.winPct+'% |');
 rows.push('','## Real native Boss identities (UNPREPARED first-ring fixtures)','',
  '| Native Boss id | Wins | Win % |','|---|---:|---:|');
 for(const [name,x]of Object.entries(s.byBoss))
  rows.push('| '+name+' | '+x.wins+'/'+x.n+' | '+x.winPct+'% |');
 rows.push('','## Single mob native combat by role','',
  '| Solo mob role | Wins | Win % |','|---|---:|---:|');
 for(const [name,x]of Object.entries(s.bySoloRole))
  rows.push('| '+name+' | '+x.wins+'/'+x.n+' | '+(x.winPct===null?'not spawned':x.winPct+'%')+' |');
 rows.push('','## Individual solo mob types: caution small samples','',
  '| Solo enemy name | Role | Wins | Win % |','|---|---|---:|---:|');
 for(const [name,x]of Object.entries(s.bySoloName))
  rows.push('| '+name+' | '+x.role+' | '+x.wins+'/'+x.n+' | '+x.winPct+'% |');
 rows.push('','## Enemy groups by actual legal synthetic Talent budget','');
 for(const [budget,g]of Object.entries(s.byBudget)){
  rows.push('### '+budget+' legal synthetic points');
  rows.push('| Opponent | Wins | Win % |','|---|---:|---:|');
  for(const k of KINDS)rows.push('| '+k+' | '+g[k].wins+'/'+g[k].n+' | '+g[k].winPct+'% |');
  rows.push('');
 }
 rows.push('## Caveats','',...report.limitations.map(x=>'- '+x),'',
  '**Action gate:** Compare these observed win rates to user-selected Elite win target 60–70%. Before buff/nerf individual enemies, ensure reasonable samples across E and varied build types. Prepared Boss difficulty is a separate test.','');
 return rows.join('\n');
}
function main(argv=process.argv.slice(2)){
 const o=parse(argv);
 if(o.mode==='plan'){const p=plan(o);atomicWrite(o.out,{stage:'6.16',kind:'planned-only',matchedSets:p.matchedSets,fights:p.fights,
  seeds:p.seedStarts,groups:p.groups,profiles:p.distinctProfiles,
  rows:p.rows.map(x=>({id:x.id,seed:x.seed,realm:x.realm,budget:x.budget,
   profile:x.sourceArchetype,weapon:x.gear.weapon}))});
  console.log('STAGE616_PLAN='+JSON.stringify({sets:p.matchedSets,fights:p.fights,groups:p.groups}));return p;}
 const r=run(o),s=r.summary;
 fs.writeFileSync(o.out.replace(/\.json$/,'.md'),table(r)+'\n');
 console.log('STAGE616='+JSON.stringify({mode:o.mode,completed:s.matchedSets,
  nativeFights:s.actualFights,verified:s.matchedVerified,
  bySize:Object.fromEntries(s.perGroup.map(x=>[x.size,x.wins+'/'+x.n+' ('+x.winPct+'%)'])),
  elites:Object.fromEntries(Object.entries(s.byElite).map(([k,v])=>[eliteDisplayName(k),v.wins+'/'+v.n+' ('+v.winPct+'%)'])),
  bosses:Object.fromEntries(Object.entries(s.byBoss).map(([k,v])=>[k,v.wins+'/'+v.n+' ('+v.winPct+'%)'])),
  soloRoles:Object.fromEntries(Object.entries(s.bySoloRole).map(([k,v])=>[k,v.wins+'/'+v.n+' ('+v.winPct+'%)'])),
  distinctSoloNames:Object.keys(s.bySoloName).length,out:o.out}));
 return r;
}
if(require.main===module){try{main();}catch(e){console.error('STAGE616_ERROR',e.stack||e);process.exitCode=1;}}
module.exports={ALL_GROUPS,KINDS,ELITE_DISPLAY_NAMES,eliteDisplayName,DEFAULTS,settingsSafe,plan,nativeFight,verify,matched,
 collect,summary,provenance,reportInput,guardCheckpoint,run,parse,table,main};
