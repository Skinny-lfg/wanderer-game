'use strict';
// Stage 6.13 — actual matched native combat that changes ONLY native v15
// TalentGraph allocation/attunement/prepared ability per pair. Controlled
// XP, gear and encounter access are NOT naturally earned progression.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const S=require('./simulate-progression.cjs');
const M=require('./v013-stage612-controlled-combat.cjs');
const T=globalThis.WandererAutomaticTalents;
const sha=v=>crypto.createHash('sha256').update(typeof v==='string'?v:JSON.stringify(v)).digest('hex');
const unique=a=>[...new Set(a)];
const WEAPONS=['Sword','Mace','Two-Handed','Daggers','Bow','Wand','Staff'];
const ARMORS=['Cloth','Leather','Plate'];
const REALMS=['blood','decay','radiance','aegis','fury','arcane'];
const ENCOUNTERS=['normal','elite','boss'];
const OFFHANDS=['Shield','Orb','Tome','Charm','Off-Hand Dagger'];
const E_BY_BUDGET=Object.freeze({12:5,24:15,36:35,60:70});
const DEFAULTS=Object.freeze({mode:'pilot',pairs:12,budgets:[12,24,36,60],
 seedStart:613001,rarity:'Rare',tickLimit:4500,
 out:'reports/v013-stage613-pilot.json',resume:false});

function provenance(){
 return {nativeGame:S.sourceFingerprint().sha256,
  stage612:sha(fs.readFileSync(require.resolve('./v013-stage612-controlled-combat.cjs'))),
  simulator:sha(fs.readFileSync(require.resolve('./simulate-progression.cjs'))),
  stage613:sha(fs.readFileSync(__filename))};
}
function talentInventory(budgets=DEFAULTS.budgets){
 if(!Array.isArray(budgets)||!budgets.length||
  budgets.some(b=>!Object.hasOwn(E_BY_BUDGET,b)))throw Error('Invalid controlled point budgets');
 const entries=[];
 for(const budget of unique(budgets)){
  for(const a of M.archetypes()){
   const spec=M.buildTalent(a,budget);
   if(!T.valid(spec.talents)||T.earned(spec.talents)!==budget)
    throw Error('Invalid native v15 talent inventory '+a.key);
   entries.push({archetype:a.key,kind:a.kind,primary:a.primary,
    secondary:a.secondary||null,model:a.model||null,element:spec.mode,
    budget,spent:spec.spent,unlocked:spec.unlocked,prepared:spec.prepared,
    talents:spec.talents,hash:spec.talentSha256,
    targetReached:spec.targetReached});
  }
 }
 return entries;
}
function compareKind(a,b){
 if(a.primary===b.primary&&a.element!==b.element&&a.primary==='arcane')return 'element-switch';
 const pa=a.unlocked.length,pb=b.unlocked.length;
 if(a.primary===b.primary&&(pa!==pb))return 'affinity-investment';
 if(a.primary===b.primary&&a.model!==b.model)return 'same-primary-different-plan';
 if(a.primary===b.primary)return 'same-primary-route';
 if(pa===3||pb===3)return 'cross-primary-triple';
 return 'cross-primary-talent-build';
}
function changedTalentNodes(a,b){
 const l=new Set(a.talents.nodes),r=new Set(b.talents.nodes);
 return {removed:[...l].filter(x=>!r.has(x)),added:[...r].filter(x=>!l.has(x)),
  changedElement:a.element!==b.element,changedPrepared:a.prepared!==b.prepared};
}
function pairPool(budgets=DEFAULTS.budgets){
 const entries=talentInventory(budgets),pool=[];
 for(let i=0;i<entries.length;i++)
  for(let j=i+1;j<entries.length;j++){
   const a=entries[i],b=entries[j];
   if(a.budget!==b.budget||a.spent!==b.spent||a.hash===b.hash||a.spent<2)continue;
   const diff=changedTalentNodes(a,b);
   if(diff.removed.length+diff.added.length<2&&!diff.changedElement)continue;
   const kind=compareKind(a,b);
   pool.push({id:a.budget+'|'+a.archetype+'|'+b.archetype,
    budget:a.budget,spent:a.spent,kind,left:a,right:b,diff,
    uniqueTalents:unique([...a.unlocked,...b.unlocked]),
    threeAffinities:a.unlocked.length===3||b.unlocked.length===3});
  }
 return {entries,pool};
}
function choosePairs(budgets=DEFAULTS.budgets,limit=DEFAULTS.pairs,seedStart=DEFAULTS.seedStart){
 if(!Number.isSafeInteger(limit)||limit<1||limit>200||!Number.isSafeInteger(seedStart)||seedStart<1||seedStart>0x7fffffff)
  throw Error('Invalid paired comparison budget or seed');
 const {entries,pool}=pairPool(budgets);
 if(limit>pool.length)throw Error('Too few legal equal-spent point pairs');
 const picked=[],selected=new Set(),counts=new Map();
 const scoreItem=(key,value,weight)=>{
  const n=counts.get(key+'='+value)||0;
  return weight/(1+n*3);
 };
 for(let i=0;i<limit;i++){
  let best=null,score=-Infinity;
  for(const candidate of pool){
   if(selected.has(candidate.id))continue;
   const a=candidate.left,b=candidate.right;
   let s=scoreItem('archetype',a.archetype,80)+scoreItem('archetype',b.archetype,80)+
    scoreItem('budget',candidate.budget,50)+scoreItem('kind',candidate.kind,45)+
    scoreItem('affinity',a.primary,20)+scoreItem('affinity',b.primary,20)+
    scoreItem('prepared',String(!!a.prepared||!!b.prepared),13)+
    scoreItem('third',String(candidate.threeAffinities),16)+
    scoreItem('mode',a.element+'~'+b.element,10);
   if(a.primary===b.primary)s+=25;
   // Prefer changed skills rather than a mere alternate cosmetic profile.
   s+=Math.min(18,candidate.diff.removed.length+candidate.diff.added.length)*0.4;
   if(s>score||s===score&&candidate.id<(best?.id||'')){best=candidate;score=s;}
  }
  if(!best)throw Error('Selected no valid matched pair');
  const encounter=ENCOUNTERS[i%3],armor=ARMORS[Math.floor(i/3)%3],
   weapon=WEAPONS[Math.floor(i/9)%WEAPONS.length],
   affinity=REALMS[Math.floor(i/7)%REALMS.length],
   offhand=['Bow','Staff','Two-Handed'].includes(weapon)?null:
    OFFHANDS[Math.floor(i/9)%OFFHANDS.length];
  const row={id:'match-'+String(i).padStart(3,'0'),designId:best.id,
   archetypes:[best.left.archetype,best.right.archetype],
   kind:best.kind,budget:best.budget,spent:best.spent,level:E_BY_BUDGET[best.budget],
   seed:seedStart+i*37,encounter,armor,weapon,offhand,affinity,rarity:'Rare',
   backgroundFamily:best.left.primary,
   changed:best.diff,left:best.left,right:best.right,score:+score.toFixed(3)};
  picked.push(row);selected.add(best.id);
  for(const [k,v] of [['archetype',best.left.archetype],['archetype',best.right.archetype],
   ['budget',best.budget],['kind',best.kind],['affinity',best.left.primary],
   ['affinity',best.right.primary],['prepared',String(!!best.left.prepared||!!best.right.prepared)],
   ['third',String(best.threeAffinities)],['mode',best.left.element+'~'+best.right.element]]){
   const key=k+'='+v;counts.set(key,(counts.get(key)||0)+1);
  }
 }
 const count=(key)=>Object.fromEntries(unique(picked.map(x=>x[key])).sort()
  .map(value=>[String(value),picked.filter(x=>x[key]===value).length]));
 return {entries:entries.length,eligible:pool.length,selected:picked,
  distinctArchetypes:unique(picked.flatMap(x=>x.archetypes)).length,
  counts:{kind:count('kind'),budget:count('budget'),encounter:count('encounter'),
   armor:count('armor'),weapon:count('weapon'),affinity:count('affinity')},
  caveat:'Selected candidate pairs share actual spent points and hypothetical XP, but XP, gear and encounter were controlled fixtures, not earned.'};
}
function fixture(row,talent){
 if(!T.valid(talent)||T.earned(talent)!==row.budget||talent.nodes.length!==row.spent)
  throw Error('Matched Talent state does not meet native equal-investment conditions');
 if(!WEAPONS.includes(row.weapon)||!ARMORS.includes(row.armor)||
    !ENCOUNTERS.includes(row.encounter)||!REALMS.includes(row.affinity)||
    (['Bow','Staff','Two-Handed'].includes(row.weapon)?row.offhand!==null:!OFFHANDS.includes(row.offhand)))
  throw Error('Invalid native gear / encounter for paired trial');
 // EXACT SAME complete Buildcraft descriptor for both variants. Only
 // controlledTalents below differs across each trial arm.
 const build={id:'stage613-controlled-same-build',weapon:row.weapon,
  families:[row.backgroundFamily||row.left.primary],skills:[]};
 return {level:row.level,build,seed:row.seed,encounter:row.encounter,
  options:{mode:row.encounter==='boss'?'bosses':'encounter',
   points:row.budget,rarity:row.rarity,gear:'current',
   runes:false,contracts:'none',targetPolicy:'adaptive',measure:true,
   tickLimit:row.tickLimit||4500,lockScenarioStreams:true,
   armorType:row.armor,offhandType:row.offhand,controlledTalents:talent},
  family:row.affinity};
}
function executeArm(row,entry,tickLimit){
 const f=fixture({...row,tickLimit},entry.talents);
 const native=S.encounter(f.level,f.build,f.seed,f.encounter,f.options,
  undefined,undefined,f.family);
 if(native.timedOut||native.status==='timeout'||!native.won&&!native.died)
  throw Error('Native combat failed or timed out '+row.id+' '+entry.archetype);
 if(native.pointsSpent!==row.spent||native.pointsBudget!==row.budget||
    native.nativeEncounter!==row.encounter||native.affinity!==row.affinity||
    native.armorType!==row.armor||native.offhandType!==(row.offhand||null)||
    native.controlledTalentMode!==(entry.talents.element||'arcane')||
    JSON.stringify(native.controlledTalentNodes)!==JSON.stringify(entry.talents.nodes))
  throw Error('Native combat fixture drift '+row.id+' '+entry.archetype);
 return {archetype:entry.archetype,talentHash:entry.hash,points:row.budget,
  spent:row.spent,mode:entry.element,prepared:entry.prepared,
  activeAffinities:entry.unlocked,wins:native.won,dies:native.died,
  seconds:native.seconds,remainingHp:native.hpEnd,maxHp:native.hpMax,
  native};
}
function comparable(a,b){
 const x=a.native,y=b.native,checks={
  fullGear:x.gearFingerprint===y.gearFingerprint,
  nonOffhandGear:x.otherGearFingerprint===y.otherGearFingerprint,
  sameSeed:x.seed===y.seed&&x.resolvedSeed===y.resolvedSeed&&x.seedShift===y.seedShift,
  sameOpponent:x.nativeEncounter===y.nativeEncounter&&x.affinity===y.affinity&&x.risk===y.risk,
  sameRoster:JSON.stringify(x.roster)===JSON.stringify(y.roster),
  sameCondition:x.plannedConditionId===y.plannedConditionId&&x.traitId===y.traitId,
  sameBossModifiers:JSON.stringify(x.bossModifierIds)===JSON.stringify(y.bossModifierIds),
  sameBuildDescriptor:x.build===y.build,
  sameMainOffhand:x.offhandType===y.offhandType&&x.offhandTrait===y.offhandTrait,
  sameGroup:x.groupSize===y.groupSize&&x.initialReserve===y.initialReserve,
  sameBudget:x.pointsBudget===y.pointsBudget&&x.pointsSpent===y.pointsSpent,
  differentTalents:a.talentHash!==b.talentHash
 };
 const failed=Object.entries(checks).filter(([,ok])=>!ok).map(([k])=>k);
 if(failed.length)throw Error('Unmatched encounter: '+failed.join(', '));
 return checks;
}
function pairedResult(row,{tickLimit=DEFAULTS.tickLimit}={}){
 const left=executeArm(row,row.left,tickLimit);
 const right=executeArm(row,row.right,tickLimit);
 const checks=comparable(left,right);
 const l=left.native.affinityMetrics||{},r=right.native.affinityMetrics||{};
 const delta={seconds:Number((right.seconds-left.seconds).toFixed(3)),
  remainingHpPct:Number(((right.remainingHp/right.maxHp)-(left.remainingHp/left.maxHp)).toFixed(4)),
  barrierGenerated:Number(((r.barrierGenerated||0)-(l.barrierGenerated||0)).toFixed(3)),
  healingActual:Number(((r.healingActual||0)-(l.healingActual||0)).toFixed(3)),
  dotDamageActual:Number(((r.dotDamageActual||0)-(l.dotDamageActual||0)).toFixed(3)),
  manaSpent:Number(((r.manaSpent||0)-(l.manaSpent||0)).toFixed(3))};
 const wins=[left.wins,right.wins];
 const outcome=wins[0]===wins[1]?(wins[0]?'both-win':'both-lose'):
  wins[0]?'left-only-win':'right-only-win';
 return {scenarioId:row.id,designId:row.designId,kind:row.kind,
  level:row.level,budget:row.budget,spent:row.spent,
  seed:row.seed,weapon:row.weapon,armor:row.armor,offhand:row.offhand,
  backgroundFamily:row.backgroundFamily,
  opponent:row.encounter,affinity:row.affinity,changed:row.changed,
  sameSetup:true,checks,fullGearFingerprint:left.native.gearFingerprint,
  opponentRosterSha256:sha(left.native.roster),
  left,right,delta,outcome,
  caveat:'Only legal TalentGraph nodes/element/prepared differ. Both builds receive the SAME controlled native item rolls, enemy/seed and synthetic XP budget; not naturally earned.'};
}
function summary(results){
 const count=fn=>results.filter(fn).length;
 const distinct=key=>unique(results.map(x=>x[key])).sort();
 return {nativePairs:results.length,nativeFights:results.length*2,
  matchConfirmed:count(r=>r.sameSetup),
  leftOnlyWin:count(r=>r.outcome==='left-only-win'),
  rightOnlyWin:count(r=>r.outcome==='right-only-win'),
  bothWin:count(r=>r.outcome==='both-win'),
  bothLose:count(r=>r.outcome==='both-lose'),
  bossPairs:count(r=>r.opponent==='boss'),
  elitePairs:count(r=>r.opponent==='elite'),
  normalPairs:count(r=>r.opponent==='normal'),
  advancedPreparedArms:results.reduce((n,r)=>n+Number(!!r.left.prepared)+Number(!!r.right.prepared),0),
  threeAffinityArms:results.reduce((n,r)=>n+Number(r.left.activeAffinities.length>=3)+Number(r.right.activeAffinities.length>=3),0),
  differentTalentStates:unique(results.flatMap(r=>[r.left.talentHash,r.right.talentHash])).length,
  comparedArchetypes:unique(results.flatMap(r=>[r.left.archetype,r.right.archetype])).length,
  kinds:Object.fromEntries(unique(results.map(r=>r.kind)).map(k=>[k,count(r=>r.kind===k)])),
  points:distinct('budget'),weapons:distinct('weapon'),armors:distinct('armor'),realms:distinct('affinity'),
  byBudget:Object.fromEntries(unique(results.map(r=>r.budget)).sort((a,b)=>a-b)
   .map(p=>[String(p),{pairs:count(r=>r.budget===p),discordant:count(r=>r.budget===p&&
    (r.outcome==='left-only-win'||r.outcome==='right-only-win'))}]))};
}
function atomicWrite(dest,obj){
 const p=path.resolve(dest);fs.mkdirSync(path.dirname(p),{recursive:true});
 const tmp=p+'.tmp-'+process.pid;fs.writeFileSync(tmp,JSON.stringify(obj,null,2)+'\n');fs.renameSync(tmp,p);
}
function checkpointGuard(previous,current){
 if(previous.stage!=='6.13'||previous.configHash!==current.configHash||
    previous.plannedIds?.join('|')!==current.plannedIds.join('|')||
    !Array.isArray(previous.results)||previous.results.length!==previous.completed)
  throw Error('Cannot resume mixed code/config/native evidence checkpoint');
 if(previous.completed>current.plannedIds.length||
    new Set(previous.results.map(x=>x.scenarioId)).size!==previous.completed)
  throw Error('Duplicate or excess matched checkpoint rows');
 for(let i=0;i<previous.completed;i++){
  const x=previous.results[i];
  if(x.scenarioId!==current.plannedIds[i]||!x.sameSetup||
     Object.values(x.checks||{}).some(x=>x!==true)||
     !Number.isFinite(x.left?.native?.seconds)||!Number.isFinite(x.right?.native?.seconds))
   throw Error('Unsafe prior matched result in checkpoint');
 }
}
function run(opts=DEFAULTS){
 const planned=choosePairs(opts.budgets,opts.pairs,opts.seedStart);
 const prov=provenance();
 const settings={budgets:opts.budgets,pairs:opts.pairs,seedStart:opts.seedStart,
  rarity:opts.rarity,tickLimit:opts.tickLimit};
 const input={stage:'6.13',kind:'matched-legal-native-talent-combat',
  configHash:sha({prov,settings,ids:planned.selected.map(x=>x.id)}),
  plannedIds:planned.selected.map(x=>x.id)};
 let report={...input,provenance:prov,settings,planned:{
  eligible:planned.eligible,archetypes:planned.entries,distinctArchetypes:planned.distinctArchetypes,
  counts:planned.counts},completed:0,results:[],
  cautions:['FIXTURE: talent XP, chosen rolled gear and opponent are controlled, not earned in an account.',
   'Only native-legal v15 talent nodes, element attunement and prepared ability differ inside each pair.',
   'Exactly equal available and actually invested points, and the same native gear, RNG seed and starting enemy roster per pair.',
   'A different combat outcome can be attributed to changing the talent allocation in this paired fixture, not a general population win rate.',
   'Do not pool incomparable pair types to claim a global best talent, especially at different levels/gear and encounter roles.',
   'No consumable selection, expedition traversal, enemy balancing, player saves or production changes.']};
 if(opts.resume&&fs.existsSync(opts.out)){
  const previous=JSON.parse(fs.readFileSync(opts.out,'utf8'));
  checkpointGuard(previous,input);report=previous;
 }
 for(let i=report.completed;i<planned.selected.length;i++){
  const result=pairedResult({...planned.selected[i],rarity:opts.rarity},{tickLimit:opts.tickLimit});
  report.results.push(result);report.completed=report.results.length;
  report.summary=summary(report.results);atomicWrite(opts.out,report);
 }
 report.summary=summary(report.results);atomicWrite(opts.out,report);
 return report;
}
function parse(args=[]){
 const v={...DEFAULTS,budgets:[...DEFAULTS.budgets]};
 for(const arg of args){
  const m=/^--([a-z-]+)=(.+)$/.exec(arg);
  if(!m)throw Error('Expected --key=value: '+arg);
  const [_,key,value]=m;
  if(key==='mode'&&['pilot','matrix','plan'].includes(value))v.mode=value;
  else if(key==='pairs')v.pairs=Number(value);
  else if(key==='budgets')v.budgets=unique(value.split(',').map(Number));
  else if(key==='seed-start')v.seedStart=Number(value);
  else if(key==='tick-limit')v.tickLimit=Number(value);
  else if(key==='rarity'&&['Uncommon','Rare','Epic'].includes(value))v.rarity=value;
  else if(key==='resume'&&['true','false'].includes(value))v.resume=value==='true';
  else if(key==='out'&&value.endsWith('.json'))v.out=value;
  else throw Error('Unknown Stage 6.13 option '+arg);
 }
 if(!Number.isSafeInteger(v.pairs)||v.pairs<1||v.pairs>200)throw Error('Paired budget must be 1–200');
 if(v.budgets.some(b=>!Object.hasOwn(E_BY_BUDGET,b)))throw Error('Unsupported controlled point budget');
 if(!Number.isSafeInteger(v.seedStart)||v.seedStart<1||v.seedStart>0x7fffffff)throw Error('Invalid seed');
 if(!Number.isSafeInteger(v.tickLimit)||v.tickLimit<100||v.tickLimit>20000)throw Error('Invalid native tick cap');
 return v;
}
function markdown(r){
 const s=r.summary;
 return ['# Stage 6.13 — matched native TalentGraph combat','',
  '**Native battle executions, but Talent points/gear/encounter access are controlled fixtures, NOT earned.**','',
  'Native game source SHA-256: '+r.provenance.nativeGame,'',
  'Candidate eligible legal pairs: '+r.planned.eligible,
  'Executed matched pairs: '+s.nativePairs,
  'Executed native fights: '+s.nativeFights,
  'All identical non-talent setup checks passed: '+(s.matchConfirmed===s.nativePairs?'yes':'NO'),
  'Compared strategic/route archetypes: '+s.comparedArchetypes,
  'Distinct v15 talent states in measured pairs: '+s.differentTalentStates,'',
  'Boss pairs: '+s.bossPairs,
  'Elite pairs: '+s.elitePairs,
  'Normal pairs: '+s.normalPairs,
  'Both won: '+s.bothWin,
  'Both lost: '+s.bothLose,
  'Only left build won: '+s.leftOnlyWin,
  'Only right build won: '+s.rightOnlyWin,'',
  'These are measured matched-fixture contrasts, not player build win rates or a globally best Affinity.','',
  '## Guardrails','',...r.cautions.map(x=>'- '+x),''].join('\n');
}
function main(argv=process.argv.slice(2)){
 const opts=parse(argv);
 if(opts.mode==='plan'){
  const p=choosePairs(opts.budgets,opts.pairs,opts.seedStart);
  const out={stage:'6.13',kind:'planned-only',eligible:p.eligible,
   candidateArchetypes:p.entries,plannedPairs:p.selected.length,
   counts:p.counts,distinctArchetypes:p.distinctArchetypes,
   selected:p.selected.map(x=>({id:x.id,budget:x.budget,spent:x.spent,
    archetypes:x.archetypes,kind:x.kind,seed:x.seed,encounter:x.encounter,armor:x.armor,
    weapon:x.weapon,affinity:x.affinity,backgroundFamily:x.backgroundFamily}))};
  atomicWrite(opts.out,out);console.log('STAGE613_PLAN='+JSON.stringify({
   eligible:out.eligible,selected:out.plannedPairs,distinctArchetypes:out.distinctArchetypes,counts:out.counts}));
  return out;
 }
 const r=run(opts);fs.writeFileSync(opts.out.replace(/\.json$/,'.md'),markdown(r));
 console.log('STAGE613='+JSON.stringify({mode:opts.mode,pairs:r.summary.nativePairs,
  fights:r.summary.nativeFights,matchConfirmed:r.summary.matchConfirmed,
  bossPairs:r.summary.bossPairs,elitePairs:r.summary.elitePairs,
  comparedArchetypes:r.summary.comparedArchetypes,distinctTalents:r.summary.differentTalentStates,
  leftOnlyWin:r.summary.leftOnlyWin,rightOnlyWin:r.summary.rightOnlyWin,
  bothWin:r.summary.bothWin,bothLose:r.summary.bothLose,out:opts.out}));
 return r;
}
if(require.main===module){try{main();}catch(e){console.error('STAGE613_ERROR',e.stack||e);process.exitCode=1;}}
module.exports={DEFAULTS,provenance,talentInventory,changedTalentNodes,pairPool,compareKind,
 choosePairs,fixture,executeArm,comparable,pairedResult,summary,checkpointGuard,run,parse,markdown,main};
