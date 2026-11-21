'use strict';
// Wanderer Stage 6.14 — NATIVE one-node/one-rank ablation with repeated seeds.
// Same point budget but baseline has ONE UNUSED point. Comparing the native
// graph states never grants a node for free and never rewrites prerequisites.
// Controlled E access, XP, rolled gear and room are NOT earned progression.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const S=require('./simulate-progression.cjs');
const Q=require('./v013-stage613-matched-talents.cjs');
const T=globalThis.WandererAutomaticTalents;
const sha=x=>crypto.createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');
const unique=a=>[...new Set(a)];
const NODES=new Map(T.NODES.map(n=>[n.id,n]));
const E_BY_BUDGET=Object.freeze({12:5,24:15,36:35,60:70});
const REALMS=['blood','decay','vitality','aegis','fury','magic'];
const WEAPONS=['Sword','Daggers','Mace','Wand','Staff','Bow','Two-Handed'];
const ARMORS=['Cloth','Leather','Plate'];
const OFFHANDS=['Shield','Orb','Tome','Charm','Off-Hand Dagger'];
const DEFAULTS=Object.freeze({mode:'pilot',cases:6,seedsPerCase:3,
 budgets:[12,24,36,60],seedStart:614001,rarity:'Rare',tickLimit:4500,
 out:'reports/v013-stage614-pilot.json',resume:false});
const nodeBase=id=>id.replace(/_rank[0-9]+$/,'');
const ranks=id=>Number(id.match(/_rank([0-9]+)$/)?.[1]||1);
const compareNodes=(a,b)=>JSON.stringify([...a].sort())===JSON.stringify([...b].sort());
function provenance(){
 const filenames=['./simulate-progression.cjs','./v013-stage611-legal-adaptive.cjs',
  './v013-stage612-controlled-combat.cjs','./v013-stage613-matched-talents.cjs',
  './v013-stage614-single-node-ablation.cjs'];
 return {game:S.sourceFingerprint().sha256,
  code:Object.fromEntries(filenames.map(f=>[f,sha(fs.readFileSync(require.resolve(f)))]))};
}
function verifyAblation(before,after,target){
 if(!T.valid(before)||!T.valid(after))throw Error('Invalid native TalentGraph state for single-node ablation');
 if(before.xp!==after.xp||T.earned(before)!==T.earned(after)||
    (before.element||'arcane')!==(after.element||'arcane')||
    (before.prepared||null)!==(after.prepared||null))
  throw Error('Unexpected change in Talent XP, element or prepared ability');
 if(after.nodes.length!==before.nodes.length+1)throw Error('Ablation must change exactly one spent point');
 const expected=[...before.nodes,target];
 if(!compareNodes(after.nodes,expected))throw Error('Ablation changed other Talent nodes/ranks');
 const base=nodeBase(target);
 if(!NODES.has(base)||base.startsWith('affinity_')||base==='element_choice')
  throw Error('Unsupported ablation target');
 const recovered=T.allocate(before,base);
 if(!recovered||!T.valid(recovered)||!compareNodes(recovered.nodes,after.nodes)||
    (recovered.element||'arcane')!==(after.element||'arcane')||
    (recovered.prepared||null)!==(after.prepared||null))
  throw Error('Removed rank cannot be repurchased through the native tree');
 return true;
}
function legalCandidates(budgets=DEFAULTS.budgets){
 const entries=Q.talentInventory(budgets),rejections={invalidAfterRemoval:0,
  protectedPrepared:0,invalidRepurchase:0,structuralOnly:0,duplicate:0};
 const candidates=[],seen=new Set();
 for(const source of entries){
  for(const [i,target] of source.talents.nodes.entries()){
   const base=nodeBase(target),node=NODES.get(base);
   if(!node||base.startsWith('affinity_')||base==='element_choice'){
    rejections.structuralOnly++;continue;
   }
   if(source.prepared===base){rejections.protectedPrepared++;continue;}
   const before={...source.talents,
    nodes:source.talents.nodes.filter((_,j)=>j!==i)};
   if(!T.valid(before)){rejections.invalidAfterRemoval++;continue;}
   const recovered=T.allocate(before,base);
   if(!recovered||!T.valid(recovered)||!compareNodes(recovered.nodes,source.talents.nodes)){
    rejections.invalidRepurchase++;continue;
   }
   verifyAblation(before,source.talents,target);
   const token=sha([source.budget,source.talents.nodes.slice().sort(),target,
    source.element,source.prepared||null]);
   if(seen.has(token)){rejections.duplicate++;continue;}
   seen.add(token);
   candidates.push({key:token.slice(0,20),target,base,rank:ranks(target),
    nodeKind:node.kind||'unknown',nodeName:node.name||base,
    nodeFamily:node.family||source.primary,
    budget:source.budget,spentAfter:source.spent,
    spentBefore:source.spent-1,
    sourceArchetype:source.archetype,sourceFamily:source.primary,
    sourceAffinities:source.unlocked,prepared:source.prepared||null,
    before,after:source.talents,
    beforeHash:sha({nodes:before.nodes,element:before.element||'arcane',
     prepared:before.prepared||null}),
    afterHash:sha({nodes:source.talents.nodes,element:source.element,
     prepared:source.prepared||null})});
  }
 }
 return {sourceSnapshots:entries.length,eligible:candidates.length,rejections,candidates};
}
function selectCases(budgets=DEFAULTS.budgets,limit=DEFAULTS.cases){
 if(!Number.isSafeInteger(limit)||limit<1||limit>48)throw Error('Case budget must be 1–48');
 const inventory=legalCandidates(budgets);
 if(inventory.candidates.length<limit)throw Error('Insufficient legal native one-node candidates');
 const chosen=[],used=new Set(),counts=new Map();
 const count=(k,v)=>counts.get(k+'='+v)||0;
 const novelty=(k,v,w)=>w/(1+3*count(k,v));
 for(let i=0;i<limit;i++){
  let best=null,max=-Infinity;
  for(const candidate of inventory.candidates){
   if(used.has(candidate.key))continue;
   // Favor one distinct base ability per case; duplicate ranks are legal but
   // do not displace coverage of a genuinely different active skill.
   let score=novelty('base',candidate.base,210)+
    novelty('family',candidate.nodeFamily,105)+
    novelty('budget',candidate.budget,95)+
    novelty('kind',candidate.nodeKind,45)+
    novelty('source',candidate.sourceArchetype,30)+
    novelty('rank',String(candidate.rank>1),28)+
    novelty('prepared',String(!!candidate.prepared),25);
   if(candidate.nodeKind==='stat'||candidate.base.startsWith('gate_'))score-=85;
   if(candidate.rank>1)score+=30;
   if(candidate.prepared)score+=8;
   if(candidate.sourceAffinities.length>1)score+=7;
   if(score>max||score===max&&candidate.key<(best?.key||'')){
    best=candidate;max=score;
   }
  }
  const encounter=['normal','elite','boss'][i%3];
  const armor=ARMORS[Math.floor(i/3)%3];
  const weapon=WEAPONS[(i*5)%WEAPONS.length];
  const affinity=REALMS[(i+Math.floor(i/5))%REALMS.length];
  const offhand=['Bow','Staff','Two-Handed'].includes(weapon)?null:
   weapon==='Wand'?'Orb':weapon==='Daggers'?'Off-Hand Dagger':
   OFFHANDS[Math.floor(i/7)%OFFHANDS.length];
  chosen.push({...best,caseId:'ablation-'+String(i).padStart(3,'0'),
   encounter,armor,weapon,affinity,offhand,level:E_BY_BUDGET[best.budget]});
  used.add(best.key);
  for(const [k,v] of [['base',best.base],['family',best.nodeFamily],
   ['budget',best.budget],['kind',best.nodeKind],['source',best.sourceArchetype],
   ['rank',String(best.rank>1)],['prepared',String(!!best.prepared)]])
    counts.set(k+'='+v,count(k,v)+1);
 }
 const distinct=k=>unique(chosen.map(x=>x[k])).sort();
 return {sourceSnapshots:inventory.sourceSnapshots,eligible:inventory.eligible,
  rejections:inventory.rejections,selected:chosen,
  distinctNodes:distinct('base'),families:distinct('nodeFamily'),
  budgets:distinct('budget'),encounters:distinct('encounter'),
  armor:distinct('armor'),weapons:distinct('weapon'),
  ranks:chosen.filter(x=>x.rank>1).length,
  limitations:['The selection is deterministic and coverage-driven, not exhaustive.',
   'An ablation removes ONE native-legal purchase, leaving one point unspent in the baseline.',
   'Paired results share scenario setup; each independent seed may roll different gear or enemies.']};
}
function plan(opts=DEFAULTS){
 if(!Number.isSafeInteger(opts.seedStart)||opts.seedStart<1||opts.seedStart>0x7fffffff||
    !Number.isSafeInteger(opts.seedsPerCase)||opts.seedsPerCase<1||opts.seedsPerCase>12)
  throw Error('Invalid native RNG seed cohort');
 if(opts.cases*opts.seedsPerCase>576)throw Error('Ablation combat budget too large');
 const selected=selectCases(opts.budgets,opts.cases),rows=[];
 for(const [i,c] of selected.selected.entries())
  for(let si=0;si<opts.seedsPerCase;si++){
   const seed=opts.seedStart+i*109+si*17;
   rows.push({...c,seed,seedIndex:si,id:c.caseId+'|s'+si});
  }
 if(new Set(rows.map(x=>x.seed)).size!==rows.length)throw Error('Paired seed cohort must have distinct source seeds');
 return {...selected,rows,totalNativePairs:rows.length,
  totalNativeFights:rows.length*2,seedsPerCase:opts.seedsPerCase};
}
function fixture(row,talents,opts){
 if(!T.valid(talents)||T.earned(talents)!==row.budget)
  throw Error('Ablation fixture has illegal v15 Talent progress');
 const oneHand=!['Bow','Staff','Two-Handed'].includes(row.weapon);
 if(!WEAPONS.includes(row.weapon)||!ARMORS.includes(row.armor)||
  !REALMS.includes(row.affinity)||!['normal','elite','boss'].includes(row.encounter)||
  (oneHand?(!OFFHANDS.includes(row.offhand)):row.offhand!==null))
  throw Error('Invalid controlled native ablation loadout');
 return {build:{id:'stage614-fixed-build-context',weapon:row.weapon,
   families:[row.sourceFamily],skills:[]},
  options:{mode:row.encounter==='boss'?'bosses':'encounter',
   points:row.budget,rarity:opts.rarity,gear:'current',runes:false,
   contracts:'none',targetPolicy:'focus',measure:true,
   tickLimit:opts.tickLimit,lockScenarioStreams:true,
   armorType:row.armor,offhandType:row.offhand,
   controlledTalents:talents}};
}
function executeArm(row,progress,opts){
 const f=fixture(row,progress,opts);
 const native=S.encounter(row.level,f.build,row.seed,row.encounter,
  f.options,undefined,undefined,row.affinity);
 if(native.timedOut||native.status==='timeout'||!native.won&&!native.died)
  throw Error('Native controlled ablation combat timed out or unresolved: '+row.id);
 if(native.pointsBudget!==row.budget||native.pointsSpent!==progress.nodes.length||
  native.nativeEncounter!==row.encounter||native.affinity!==row.affinity||
  native.armorType!==row.armor||native.offhandType!==(row.offhand||null)||
  native.controlledTalentMode!==(progress.element||'arcane')||
  !compareNodes(native.controlledTalentNodes,progress.nodes))
  throw Error('Native ablation fixture drift: '+row.id);
 return {won:native.won,died:native.died,
  spent:native.pointsSpent,seconds:native.seconds,
  remainingHp:native.hpEnd,maxHp:native.hpMax,
  telemetry:native.affinityMetrics||{},native};
}
function assertMatched(a,b,row){
 const x=a.native,y=b.native;
 const checks={
  completeGear:x.gearFingerprint===y.gearFingerprint,
  nonOffhandGear:x.otherGearFingerprint===y.otherGearFingerprint,
  sameSeed:x.seed===y.seed&&x.resolvedSeed===y.resolvedSeed&&x.seedShift===y.seedShift,
  sameOpponent:x.nativeEncounter===y.nativeEncounter&&x.affinity===y.affinity&&x.risk===y.risk,
  sameInitialEnemyRoster:JSON.stringify(x.roster)===JSON.stringify(y.roster),
  sameConditions:x.plannedConditionId===y.plannedConditionId&&x.traitId===y.traitId,
  sameBossModifiers:JSON.stringify(x.bossModifierIds)===JSON.stringify(y.bossModifierIds),
  sameBuildcraft:x.build===y.build,
  sameOffhand:x.offhandType===y.offhandType&&x.offhandTrait===y.offhandTrait,
  sameGroup:x.groupSize===y.groupSize&&x.initialReserve===y.initialReserve,
  sameXPBudget:x.pointsBudget===y.pointsBudget&&x.pointsBudget===row.budget,
  exactlyOnePurchasedPoint:y.pointsSpent===x.pointsSpent+1&&y.pointsSpent===row.spentAfter,
  exactlyOneChangedNode:compareNodes(y.controlledTalentNodes,
   [...x.controlledTalentNodes,row.target]),
  sameElement:x.controlledTalentMode===y.controlledTalentMode
 };
 const failed=Object.entries(checks).filter(([,ok])=>!ok).map(([k])=>k);
 if(failed.length)throw Error('Stage 6.14 non-talent fixture mismatch: '+failed.join(', '));
 return checks;
}
function paired(row,opts=DEFAULTS){
 verifyAblation(row.before,row.after,row.target);
 const baseline=executeArm(row,row.before,opts),
  withNode=executeArm(row,row.after,opts);
 const checks=assertMatched(baseline,withNode,row);
 const x=baseline.telemetry,y=withNode.telemetry;
 const round=(v,d=3)=>Number(Number(v).toFixed(d));
 const metricDelta=key=>round((y[key]||0)-(x[key]||0));
 const delta={
  durationSeconds:round(withNode.seconds-baseline.seconds),
  hpFraction:round(withNode.remainingHp/withNode.maxHp-
   baseline.remainingHp/baseline.maxHp,5),
  barrierGenerated:metricDelta('barrierGenerated'),
  healingActual:metricDelta('healingActual'),
  dotDamageActual:metricDelta('dotDamageActual'),
  manaSpent:metricDelta('manaSpent'),
  barrierAbsorbed:metricDelta('barrierAbsorbed')
 };
 const outcome=baseline.won===withNode.won?
  (baseline.won?'both-win':'both-lose'):
  (withNode.won?'node-only-win':'baseline-only-win');
 return {id:row.id,caseId:row.caseId,seed:row.seed,seedIndex:row.seedIndex,
  node:row.base,nodeName:row.nodeName,rank:row.rank,
  kind:row.nodeKind,family:row.nodeFamily,
  budget:row.budget,spentBefore:row.spentBefore,spentAfter:row.spentAfter,
  level:row.level,sourceArchetype:row.sourceArchetype,
  originalAffinities:row.sourceAffinities,
  weapon:row.weapon,armor:row.armor,offhand:row.offhand,
  encounter:row.encounter,affinity:row.affinity,prepared:row.prepared,
  beforeHash:row.beforeHash,afterHash:row.afterHash,
  change:{removed:[],added:[row.target],elementChanged:false,preparedChanged:false},
  sameNonTalentSetup:true,checks,
  gearSha256:baseline.native.gearFingerprint,
  rosterSha256:sha(baseline.native.roster),
  before:baseline,after:withNode,delta,outcome,
  provenance:'REAL native combat; ONE valid native TalentGraph node/rank purchase added, using ONE unused synthetic point. Not earned account progression.'};
}
function median(numbers){
 if(!numbers.length)return null;
 const a=numbers.slice().sort((a,b)=>a-b),m=Math.floor(a.length/2);
 return a.length%2?a[m]:(a[m-1]+a[m])/2;
}
function caseSummary(rows){
 if(!rows.length)throw Error('Cannot summarize empty case');
 const n=rows[0],count=kind=>rows.filter(r=>r.outcome===kind).length;
 const bothWin=rows.filter(r=>r.outcome==='both-win');
 return {caseId:n.caseId,target:n.node,rank:n.rank,family:n.family,
  kind:n.kind,budget:n.budget,encounter:n.encounter,affinity:n.affinity,
  totalSeeds:rows.length,distinctSeeds:unique(rows.map(r=>r.seed)).length,
  baselineWins:rows.filter(r=>r.before.won).length,
  withNodeWins:rows.filter(r=>r.after.won).length,
  gainedVictories:count('node-only-win'),lostVictories:count('baseline-only-win'),
  bothWin:count('both-win'),bothLose:count('both-lose'),
  medianWinDurationDeltaSeconds:median(bothWin.map(r=>r.delta.durationSeconds)),
  meanBarrierGeneratedDelta:Number((rows.reduce((s,r)=>s+r.delta.barrierGenerated,0)/rows.length).toFixed(3)),
  meanHealingDelta:Number((rows.reduce((s,r)=>s+r.delta.healingActual,0)/rows.length).toFixed(3)),
  meanDotDelta:Number((rows.reduce((s,r)=>s+r.delta.dotDamageActual,0)/rows.length).toFixed(3)),
  classification:'Single-node contrast in fixed build context; not a global node power ranking'};
}
function summarize(rows){
 const ids=unique(rows.map(r=>r.caseId)),cases=ids.map(id=>caseSummary(rows.filter(r=>r.caseId===id)));
 const count=outcome=>rows.filter(r=>r.outcome===outcome).length;
 return {nativePairs:rows.length,nativeFights:rows.length*2,
  validatedMatches:rows.filter(r=>r.sameNonTalentSetup).length,
  distinctAblations:ids.length,distinctNodes:unique(rows.map(r=>r.node)).length,
  uniqueNativeSeeds:unique(rows.map(r=>r.seed)).length,
  nodeOnlyWins:count('node-only-win'),baselineOnlyWins:count('baseline-only-win'),
  bothWin:count('both-win'),bothLose:count('both-lose'),
  rankUpgradePairs:rows.filter(r=>r.rank>1).length,
  bossPairs:rows.filter(r=>r.encounter==='boss').length,
  elitePairs:rows.filter(r=>r.encounter==='elite').length,
  normalPairs:rows.filter(r=>r.encounter==='normal').length,
  budgets:unique(rows.map(r=>r.budget)).sort((a,b)=>a-b),
  families:unique(rows.map(r=>r.family)).sort(),
  nodes:unique(rows.map(r=>r.node)).sort(),caseResults:cases};
}
function atomicWrite(dest,data){
 const file=path.resolve(dest),tmp=file+'.tmp-'+process.pid;
 fs.mkdirSync(path.dirname(file),{recursive:true});
 fs.writeFileSync(tmp,JSON.stringify(data,null,2)+'\n');fs.renameSync(tmp,file);
}
function checkpointGuard(stored,input){
 if(stored.stage!=='6.14'||stored.configHash!==input.configHash||
    stored.plannedIds?.join('|')!==input.plannedIds.join('|')||
    !Array.isArray(stored.results)||stored.completed!==stored.results.length||
    stored.completed>input.plannedIds.length)
  throw Error('Stage 6.14 resume source/settings/plan mismatch');
 if(new Set(stored.results.map(r=>r.id)).size!==stored.completed)
  throw Error('Duplicate native ablation checkpoint pairs');
 for(let i=0;i<stored.completed;i++){
  const x=stored.results[i];
  if(x.id!==input.plannedIds[i]||!x.sameNonTalentSetup||
     !Object.keys(x.checks||{}).length||Object.values(x.checks).some(v=>v!==true)||
     x.spentAfter!==x.spentBefore+1||
     !Number.isFinite(x.before?.native?.seconds)||!Number.isFinite(x.after?.native?.seconds))
   throw Error('Invalid matched native ablation checkpoint row');
 }
}
function run(settings=DEFAULTS){
 const p=plan(settings),source=provenance();
 const options={cases:settings.cases,seedsPerCase:settings.seedsPerCase,
  seedStart:settings.seedStart,budgets:settings.budgets,rarity:settings.rarity,
  tickLimit:settings.tickLimit};
 const input={stage:'6.14',kind:'controlled-native-single-node-rank-ablation',
  configHash:sha({source,options,ids:p.rows.map(r=>r.id)}),
  plannedIds:p.rows.map(r=>r.id)};
 let report={...input,source,options,planned:{sourceSnapshots:p.sourceSnapshots,
  eligible:p.eligible,rejections:p.rejections,caseCount:p.selected.length,
  distinctNodes:p.distinctNodes,families:p.families,budgets:p.budgets,
  ranks:p.ranks,seedsPerCase:p.seedsPerCase},
  completed:0,results:[],
  caveats:[
   'The baseline has ONE intentionally unspent point; withNode legally purchases exactly ONE terminal node/rank.',
   'Native Talent XP is identical within the pair and synthetic in both arms: no player earned this gear, access or XP.',
   'A removed prerequisite, element-choice, prepared-ability node, or non-repurchasable rank is excluded rather than faked.',
   'No other Talents, prepared abilities, element choices, item rolls, enemy roster, starting combat seed or fixed target policy change inside a pair.',
   'Independent seeds can roll different native item/enemy sets between repetitions. Each seed is independently paired.',
   'Damage, AI and ability execution are native. No PoTions, Boons, full route traversal or long-run reallocation is modeled.',
   'Small cohorts diagnose potential node effects; they are not population win rates or sufficient for a balance change.'
  ]};
 if(settings.resume&&fs.existsSync(settings.out)){
  const old=JSON.parse(fs.readFileSync(settings.out,'utf8'));
  checkpointGuard(old,input);report=old;
 }
 for(let i=report.completed;i<p.rows.length;i++){
  const result=paired({...p.rows[i]},{...settings});
  report.results.push(result);report.completed=report.results.length;
  report.summary=summarize(report.results);atomicWrite(settings.out,report);
 }
 report.summary=summarize(report.results);
 atomicWrite(settings.out,report);
 return report;
}
function parse(argv=[]){
 const s={...DEFAULTS,budgets:[...DEFAULTS.budgets]};
 for(const arg of argv){
  const m=/^--([a-z-]+)=(.+)$/.exec(arg);if(!m)throw Error('Expected --key=value argument');
  const [,k,v]=m;
  if(k==='mode'&&['pilot','matrix','plan'].includes(v))s.mode=v;
  else if(k==='cases')s.cases=Number(v);
  else if(k==='seeds-per-case')s.seedsPerCase=Number(v);
  else if(k==='budgets')s.budgets=unique(v.split(',').map(Number));
  else if(k==='seed-start')s.seedStart=Number(v);
  else if(k==='tick-limit')s.tickLimit=Number(v);
  else if(k==='rarity'&&['Common','Uncommon','Rare','Epic'].includes(v))s.rarity=v;
  else if(k==='resume'&&['true','false'].includes(v))s.resume=v==='true';
  else if(k==='out'&&v.endsWith('.json'))s.out=v;
  else throw Error('Unknown Stage 6.14 argument '+arg);
 }
 if(!Number.isSafeInteger(s.cases)||s.cases<1||s.cases>48)throw Error('Invalid case count');
 if(!Number.isSafeInteger(s.seedsPerCase)||s.seedsPerCase<1||s.seedsPerCase>12||
    s.cases*s.seedsPerCase>576)throw Error('Invalid native seed cohort size');
 if(!s.budgets.length||s.budgets.some(b=>!Object.hasOwn(E_BY_BUDGET,b)))
  throw Error('Invalid v15 Talent point budget');
 if(!Number.isSafeInteger(s.seedStart)||s.seedStart<1||s.seedStart>0x7fffffff)
  throw Error('Invalid initial seed');
 if(!Number.isSafeInteger(s.tickLimit)||s.tickLimit<100||s.tickLimit>20000)
  throw Error('Invalid native tick cap');
 return s;
}
function markdown(report){
 const s=report.summary;
 return ['# Stage 6.14 — single-node/rank native combat ablations','',
  '**Native battles with legally purchased single Talent, but synthetic XP, gear and E unlocks.**','',
  'Native source SHA-256: '+report.source.game,
  'Planned legal candidate ablations: '+report.planned.eligible,
  'Actually tested distinct one-purchase cases: '+s.distinctAblations,
  'Actual independent paired seeds: '+s.uniqueNativeSeeds,
  'Completed matched native pairs: '+s.nativePairs,
  'Completed native combat fights: '+s.nativeFights,
  'All non-Talent match checks passed: '+s.validatedMatches+'/'+s.nativePairs,'',
  'Node purchase exclusively won: '+s.nodeOnlyWins,
  'Baseline exclusively won: '+s.baselineOnlyWins,
  'Both won: '+s.bothWin,
  'Both lost: '+s.bothLose,'',
  '## Per-node cohorts (same exact Talent state and setup, multiple seeds)','',
  '| Target | Rank | Budget | Enemy | Seeds | Baseline W | With node W | Gained | Lost |',
  '|---|---:|---:|---|---:|---:|---:|---:|---:|',
  ...s.caseResults.map(x=>'| '+x.target+' | '+x.rank+' | '+x.budget+' | '+x.encounter+
    ' | '+x.totalSeeds+' | '+x.baselineWins+' | '+x.withNodeWins+
    ' | '+x.gainedVictories+' | '+x.lostVictories+' |'),
  '',
  '## Evidence limits','',...report.caveats.map(x=>'- '+x),''].join('\n');
}
function main(args=process.argv.slice(2)){
 const opts=parse(args);
 if(opts.mode==='plan'){
  const p=plan(opts);
  const out={stage:'6.14',kind:'planned-only',eligible:p.eligible,
   sourceSnapshots:p.sourceSnapshots,caseCount:p.selected.length,
   plannedPairs:p.totalNativePairs,distinctNodes:p.distinctNodes,
   families:p.families,budgets:p.budgets,
   selected:p.selected.map(c=>({caseId:c.caseId,sourceArchetype:c.sourceArchetype,
    node:c.base,rank:c.rank,kind:c.nodeKind,budget:c.budget,
    spentBefore:c.spentBefore,spentAfter:c.spentAfter,
    encounter:c.encounter,armor:c.armor,weapon:c.weapon,affinity:c.affinity}))};
  atomicWrite(opts.out,out);
  console.log('STAGE614_PLAN='+JSON.stringify({cases:out.caseCount,
   eligible:out.eligible,plannedPairs:out.plannedPairs,nodes:out.distinctNodes.length}));
  return out;
 }
 const r=run(opts);
 fs.writeFileSync(opts.out.replace(/\.json$/,'.md'),markdown(r));
 console.log('STAGE614='+JSON.stringify({mode:opts.mode,out:opts.out,
  cases:r.summary.distinctAblations,pairs:r.summary.nativePairs,
  fights:r.summary.nativeFights,matchConfirmed:r.summary.validatedMatches,
  distinctNodes:r.summary.distinctNodes,
  rankUpgradePairs:r.summary.rankUpgradePairs,
  nodeOnlyWins:r.summary.nodeOnlyWins,baselineOnlyWins:r.summary.baselineOnlyWins,
  bothWin:r.summary.bothWin,bothLose:r.summary.bothLose,
  budgets:r.summary.budgets,families:r.summary.families}));
 return r;
}
if(require.main===module){try{main();}catch(e){console.error('STAGE614_ERROR',e.stack||e);process.exitCode=1;}}
module.exports={DEFAULTS,provenance,verifyAblation,legalCandidates,selectCases,plan,fixture,
 executeArm,assertMatched,paired,caseSummary,summarize,checkpointGuard,run,parse,markdown,main};
