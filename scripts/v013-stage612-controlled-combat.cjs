'use strict';
// Wanderer Stage 6.12 — controlled advanced-build combat on the REAL native
// combat engine. Fixtures are artificial; XP, gear and map reachability are
// NEVER credited to the earned native-account progression campaign.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const S=require('./simulate-progression.cjs');
const L=require('./v013-stage611-legal-adaptive.cjs');
const P=require('./v013-build-planner.cjs');
const C=require('./v013-stage610-coverage-benchmark.cjs');
const T=globalThis.WandererAutomaticTalents;
const sha=x=>crypto.createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');
const unique=a=>[...new Set(a)];
const CATALOG=C.catalogue();
const WEAPONS=CATALOG.weapons;
const ARMOR=CATALOG.armor;
const AFFINITIES=CATALOG.affinities;
const TWO_HANDS=new Set(['Bow','Staff','Two-Handed']);
const OFFHANDS=['Shield','Orb','Tome','Charm','Off-Hand Dagger'];
const BUDGET_TO_E=Object.freeze({12:5,24:15,36:35,60:70});
const DEFAULTS=Object.freeze({mode:'pilot',limit:18,paired:10,
 budgets:[12,24,36,60],seedStart:612001,rarity:'Rare',tickLimit:4500,
 out:'reports/v013-stage612-controlled-pilot.json',resume:false});
const allGraph=new Map(T.NODES.map(n=>[n.id,n]));
const core=L.pathTargets().targets.filter(x=>x.kind!=='agent-milestone');
function archetypes(){
 const out=[];
 for(const [id,p] of Object.entries(P.BUILDS))
  out.push({key:'profile:'+id,kind:'strategic-profile',id,primary:p.primary,
   secondary:p.secondary||null,element:p.element||'arcane',armor:p.armor,weapons:[...p.weapons],
   model:p.model});
 for(const target of core)
  out.push({key:'route:'+target.id,kind:'native-target-route',id:target.id,
   primary:target.plan.primary,secondary:target.plan.secondary||null,
   element:target.plan.element||'arcane',target});
 if(out.length!==Object.keys(P.BUILDS).length+27||new Set(out.map(x=>x.key)).size!==out.length)
  throw Error('Current native route/strategic archetype inventory drifted');
 return out;
}
function profileArmor(family){
 return ['magic','decay'].includes(family)?'Cloth':['aegis','vitality'].includes(family)?'Plate':'Leather';
}
function defaultWeapon(family){
 return ({blood:'Sword',fury:'Daggers',vitality:'Mace',aegis:'Sword',magic:'Wand',decay:'Wand'})[family];
}
function buildTalent(archetype,budget){
 if(!Object.hasOwn(BUDGET_TO_E,budget))throw Error('Unsupported point budget '+budget);
 let nodes,mode,targetReached=null,targetId=null,legalPlan;
 if(archetype.kind==='strategic-profile'){
  const def=P.getPlan(archetype.id);
  const v=L.profileCandidate(archetype.id,budget,{
   pressure:def.model==='adaptive'&&budget>=(def.thirdAt||1000)});
  nodes=[...v.actualNodes];mode=v.mode;legalPlan=v;
 }else{
  targetId=archetype.id;
  const v=L.candidate(archetype.target,budget);
  if(v.status==='unresolved-route')throw Error('Target native prerequisite route unresolved '+targetId);
  const progress={xp:budget*T.POINT_XP,nodes:[...v.actualNodes],treeVersion:15};
  if(v.mode!=='arcane')progress.element=v.mode;
  const plan={...archetype.target.plan,model:archetype.target.plan.model||'focused',
   milestones:[targetId],focus:'spell'};
  const proposal=P.propose(T,progress,plan);
  nodes=[...proposal.expectedNodes];mode=proposal.expectedElement;
  targetReached=nodes.some(x=>x===targetId||x.startsWith(targetId+'_rank'));
  legalPlan={targetId,initialRouteStatus:v.status,actuallyReached:targetReached,
   milestones:[targetId],earnedPoints:budget,allowed:proposal.allowed};
 }
 const talents={xp:budget*T.POINT_XP,nodes,treeVersion:15};
 if(mode!=='arcane')talents.element=mode;
 const advanced=nodes.filter(id=>allGraph.get(id)?.advanced);
 if(advanced.length){
  const preferred=targetId&&advanced.includes(targetId)?targetId:
   archetype.kind==='strategic-profile'?
    (P.getPlan(archetype.id).milestones||[]).find(x=>advanced.includes(x)):null;
  talents.prepared=preferred||advanced.at(-1);
 }
 if(!T.valid(talents)||T.earned(talents)!==budget||talents.nodes.length>budget)
  throw Error('Advanced controlled build is not a legal v15 allocation '+archetype.key);
 const unlocked=unique(nodes.filter(x=>x.startsWith('affinity_')).map(x=>x.slice('affinity_'.length)));
 return {talents,unlocked,mode,prepared:talents.prepared||null,spent:nodes.length,
  targetReached,legalPlan,talentSha256:sha({nodes,mode,prepared:talents.prepared||null})};
}
function equipment(archetype,index,budgetIndex,variation){
 const preferred=archetype.weapons||[defaultWeapon(archetype.primary)];
 const weapon=variation===0?preferred[0]:
  variation===1?WEAPONS[(index+budgetIndex*3+1)%WEAPONS.length]:
  preferred.at(-1)||WEAPONS[(index+budgetIndex*3+4)%WEAPONS.length];
 const armor=variation===0?(archetype.armor||profileArmor(archetype.primary)):
  ARMOR[(index+budgetIndex+variation)%ARMOR.length];
 let offhand=null;
 if(!TWO_HANDS.has(weapon)){
  if(variation===0)offhand=weapon==='Wand'?'Orb':archetype.primary==='aegis'?'Shield':
   weapon==='Daggers'?'Off-Hand Dagger':archetype.primary==='magic'?'Tome':'Shield';
  else offhand=OFFHANDS[(index+budgetIndex+variation)%OFFHANDS.length];
 }
 if(!WEAPONS.includes(weapon)||!ARMOR.includes(armor)||
  (offhand!==null&&!OFFHANDS.includes(offhand))||
  (TWO_HANDS.has(weapon)&&offhand!==null))
  throw Error('Controlled equipment combination not physically legal');
 return {weapon,armor,offhand};
}
function candidates(budgets=DEFAULTS.budgets,seedStart=DEFAULTS.seedStart){
 const defs=archetypes(),out=[];
 if(!Array.isArray(budgets)||!budgets.length||budgets.some(x=>!Object.hasOwn(BUDGET_TO_E,x)))
  throw Error('Unsupported Stage 6.12 budgets');
 // Each real enemy class is crossed with EACH generated equipment variant.
 // Previous v1 accidentally tied Plate to Boss in the selected shortlist.
 for(const [i,a] of defs.entries())
  for(const [bi,budget] of unique(budgets).entries())
   for(let variation=0;variation<3;variation++)
    for(const encounter of ['normal','elite','boss']){
     const gear=equipment(a,i,bi,variation);
     const ki=['normal','elite','boss'].indexOf(encounter);
     const affinity=AFFINITIES[(i+2*bi+variation+ki*3)%AFFINITIES.length];
     const risk=(i+bi+ki)%3;
     const seed=seedStart+i*131+bi*29+variation*5+ki;
     const row={id:a.key+'|'+budget+'|'+variation+'|'+encounter,
      key:a.key,kind:a.kind,archetypeId:a.id,points:budget,
      level:BUDGET_TO_E[budget],variation,seed,encounter,affinity,risk,
      rarity:'Rare',...gear};
     out.push(row);
    }
 return out;
}
function axes(row){
 return {archetype:row.key,kind:row.kind,points:String(row.points),
  weapon:row.weapon,armor:row.armor,offhand:row.offhand||'none',
  opponent:row.encounter,realm:row.affinity,risk:String(row.risk),
  budgetWeapon:row.points+' / '+row.weapon,
  weaponArmor:row.weapon+' / '+row.armor,
  weaponOffhand:row.weapon+' / '+(row.offhand||'none'),
  archetypeBudget:row.key+' / '+row.points,
  opponentRealm:row.encounter+' / '+row.affinity,
  opponentArmor:row.encounter+' / '+row.armor,
  opponentWeapon:row.encounter+' / '+row.weapon,
  budgetOpponent:row.points+' / '+row.encounter};
}
function chooseScenarios(pool,limit){
 if(!Number.isSafeInteger(limit)||limit<1||limit>pool.length)throw Error('Invalid actual controlled fight budget');
 const selected=[],seen=new Set(),counts=new Map();
 const weights={archetype:300,archetypeBudget:24,kind:30,points:30,
  weapon:35,armor:18,offhand:25,opponent:40,realm:30,risk:9,
  budgetWeapon:6,weaponArmor:8,weaponOffhand:8,opponentRealm:22,
  opponentArmor:175,opponentWeapon:35,budgetOpponent:35};
 const covered={};
 const pairKeys=['points','weapon','armor','offhand','opponent','realm'];
 const pairs=x=>{
  const a=axes(x),arr=[];
  for(let i=0;i<pairKeys.length;i++)for(let j=i+1;j<pairKeys.length;j++)
   arr.push(pairKeys[i]+':'+a[pairKeys[i]]+'|'+pairKeys[j]+':'+a[pairKeys[j]]);
  return arr;
 };
 const coveredPair=new Set();
 for(let step=0;step<limit;step++){
  let winner=null,top=-Infinity;
  for(const row of pool){
   if(seen.has(row.id))continue;
   const a=axes(row);let score=0;
   for(const [key,value] of Object.entries(a)){
    const n=counts.get(key+'='+value)||0;
    score+=(weights[key]||1)/(1+n*2);
   }
   const uncovered=pairs(row).filter(p=>!coveredPair.has(p)).length;
   score+=uncovered*5.5;
   if(score>top||score===top&&row.id.localeCompare(winner.id)<0){
    winner=row;top=score;
   }
  }
  if(!winner)break;
  selected.push({...winner,selectionScore:+top.toFixed(3)});
  seen.add(winner.id);
  for(const [k,v] of Object.entries(axes(winner))){
   const key=k+'='+v;counts.set(key,(counts.get(key)||0)+1);
  }
  for(const p of pairs(winner))coveredPair.add(p);
 }
 for(const row of selected)
  for(const [k,v] of Object.entries(axes(row))) (covered[k]??=new Set()).add(v);
 return {poolSize:pool.length,selected,
  plannedCoverage:Object.fromEntries(Object.entries(covered).map(([k,v])=>[k,[...v].sort()])),
  selectedArchetypes:unique(selected.map(x=>x.key)).length,
  plannedPairKeys:coveredPair.size,
  opponentArmorCounts:Object.fromEntries(unique(selected.map(x=>x.encounter+' / '+x.armor))
   .sort().map(k=>[k,selected.filter(x=>x.encounter+' / '+x.armor===k).length])),
  limitations:['Greedy finite subset, not exhaustive pairwise or triple-wise coverage.',
   'Scenario access is controlled; native Boss/Elite fights are not natural account progression.']};
}
function options(row,build){
 return {mode:row.encounter==='boss'?'bosses':'encounter',
  points:row.points,gear:'current',rarity:row.rarity||'Rare',runes:false,contracts:'none',
  tickLimit:build.tickLimit||4500,targetPolicy:'adaptive',measure:true,
  lockScenarioStreams:true,controlledTalents:build.talents,
  armorType:row.armor,offhandType:row.offhand};
}
function execute(row,{tickLimit=DEFAULTS.tickLimit,offhandOverride}={}){
 const a=archetypes().find(x=>x.key===row.key);
 if(!a)throw Error('Unknown Stage 6.12 archetype '+row.key);
 if(!['normal','elite','boss'].includes(row.encounter)||!AFFINITIES.includes(row.affinity))
  throw Error('Invalid native encounter type or real Realm');
 const spec=buildTalent(a,row.points);
 const weapon=row.weapon,offhand=offhandOverride===undefined?row.offhand:offhandOverride;
 if(!WEAPONS.includes(weapon)||!ARMOR.includes(row.armor)||
    (offhand!==null&&!OFFHANDS.includes(offhand))||TWO_HANDS.has(weapon)&&offhand!==null)
  throw Error('Illegal controlled weapon / armor / off-hand combination');
 const build={id:row.key,weapon,families:[a.primary,...(a.secondary?[a.secondary]:[])],
  skills:[]};
 const native=S.encounter(row.level,build,row.seed,row.encounter,
  options({...row,offhand},{talents:spec.talents,tickLimit}),
  undefined,undefined,row.affinity);
 if(native.timedOut||native.type==='timeout'||native.status==='timeout')
  throw Error('Native combat timeout '+row.id);
 if(native.pointsBudget!==row.points||native.pointsSpent!==spec.spent||
   native.gearRarity!==row.rarity||native.armorType!==row.armor||
   (native.offhandType||null)!==offhand||
   JSON.stringify(native.controlledTalentNodes)!==JSON.stringify(spec.talents.nodes)||
   native.controlledTalentMode!==spec.mode||native.affinity!==row.affinity||
   native.nativeEncounter!==row.encounter)
  throw Error('Native fixture did not match verified legal build '+row.id);
 if(!Number.isFinite(native.hpMax)||!Number.isFinite(native.seconds)||native.hpMax<=0)
  throw Error('Invalid native combat measurements');
 return {scenarioId:row.id,planKey:row.key,kind:a.kind,points:row.points,level:row.level,
  talentSha256:spec.talentSha256,mode:spec.mode,prepared:spec.prepared,
  targetReached:spec.targetReached,unlockedAffinities:spec.unlocked,spent:spec.spent,
  rawTalentNodes:spec.talents.nodes,weapon,armor:row.armor,offhand,
  seed:row.seed,encounter:row.encounter,affinity:row.affinity,risk:native.risk,
  won:native.won,died:native.died,timedOut:native.timedOut,
  durationSeconds:native.seconds,native};
}
function provenance(){
 const filenames=[
  './simulate-progression.cjs','./v013-stage611-legal-adaptive.cjs',
  './v013-build-planner.cjs','./v013-stage612-controlled-combat.cjs'
 ];
 return {game:S.sourceFingerprint().sha256,
  scripts:Object.fromEntries(filenames.map(p=>[p,sha(fs.readFileSync(require.resolve(p)))]))};
}
function summary(rows){
 const dims={};
 for(const key of ['planKey','talentSha256','weapon','armor','offhand','points','encounter','affinity','mode']){
  dims[key]=unique(rows.map(x=>x[key]??'none')).sort();
 }
 const count=(f)=>rows.filter(f).length;
 return {nativeFights:rows.length,distinctArchetypes:dims.planKey.length,
  distinctTalentAllocations:dims.talentSha256.length,
  distinctLegalLoadouts:unique(rows.map(x=>sha([x.talentSha256,x.weapon,x.armor,x.offhand]))).length,
  nativeWins:count(r=>r.won),nativeDeaths:count(r=>r.died),
  nativeBossFights:count(r=>r.encounter==='boss'),nativeBossWins:count(r=>r.encounter==='boss'&&r.won),
  nativeEliteFights:count(r=>r.encounter==='elite'),
  nativeNormalFights:count(r=>r.encounter==='normal'),
  advancedPreparedFights:count(r=>!!r.prepared),
  mixedAffinityFights:count(r=>r.unlockedAffinities.length>=2),
  tripleAffinityFights:count(r=>r.unlockedAffinities.length>=3),
  observed:dims,byBudget:Object.fromEntries(dims.points.map(p=>[p,{
   fights:count(r=>String(r.points)===String(p)),
   wins:count(r=>String(r.points)===String(p)&&r.won)}]))};
}
function verifyCheckpoint(report,input){
 if(report.kind!==input.kind||report.configHash!==input.configHash||
  report.plannedIds?.join('|')!==input.plannedIds.join('|')||
  !Array.isArray(report.results)||report.completed!==report.results.length)
  throw Error('Controlled cohort resume source/config/plan mismatch');
 if(new Set(report.results.map(x=>x.scenarioId)).size!==report.completed)
  throw Error('Duplicate prior simulation record in checkpoint');
 for(const row of report.results){
  if(report.plannedIds[report.results.indexOf(row)]!==row.scenarioId||row.timedOut||
    !Number.isFinite(row.native?.seconds))throw Error('Invalid stored native scenario record');
 }
}
function atomicWrite(dest,obj){
 fs.mkdirSync(path.dirname(path.resolve(dest)),{recursive:true});
 const tmp=path.resolve(dest)+'.tmp-'+process.pid;
 fs.writeFileSync(tmp,JSON.stringify(obj,null,2)+'\n');
 fs.renameSync(tmp,path.resolve(dest));
}
function run(settings=DEFAULTS){
 const plan=chooseScenarios(candidates(settings.budgets,settings.seedStart),settings.limit);
 const input={kind:'controlled-native-combat',configHash:sha({provenance:provenance(),
  settings:{budgets:settings.budgets,limit:settings.limit,rarity:settings.rarity,
   tickLimit:settings.tickLimit,seedStart:settings.seedStart}}),
  plannedIds:plan.selected.map(x=>x.id)};
 let report={stage:'6.12',kind:input.kind,configHash:input.configHash,settings,
  provenance:provenance(),design:{poolSize:plan.poolSize,selected:plan.selected.length,
   archetypes:archetypes().length,budgets:settings.budgets,
   plannedCoverage:plan.plannedCoverage,plannedPairs:plan.plannedPairKeys,
   opponentArmorCounts:plan.opponentArmorCounts},
  plannedIds:input.plannedIds,results:[],completed:0,
  strictOrigin:'CONTROLLED synthetic Talent XP and native-rolled gear; not naturally earned accounts.',
  cautions:['Native combat and enemy AI only; map Boss/Elite room is controlled, not naturally traveled.',
   'Talent states come from native v15 allocations and are NEVER counted as earned progression.',
   'Gear uses the actual native affix generator but is force-rolled at the requested tier/rarity; not obtained from drops.',
   'Selection is deliberate coverage sampling, not representative player strategy or independent outcome statistics.',
   'No balance constants, damage, saves, Firebase or production are changed.']};
 if(settings.resume&&fs.existsSync(settings.out)){
  const old=JSON.parse(fs.readFileSync(settings.out,'utf8'));
  verifyCheckpoint(old,input);report=old;
 }
 for(let i=report.completed;i<plan.selected.length;i++){
  const row={...plan.selected[i],rarity:settings.rarity};
  const result=execute(row,{tickLimit:settings.tickLimit});
  report.results.push(result);report.completed=report.results.length;
  report.summary=summary(report.results);atomicWrite(settings.out,report);
 }
 report.summary=summary(report.results);atomicWrite(settings.out,report);
 return report;
}
function runMatchedOffhands(settings=DEFAULTS){
 const pool=chooseScenarios(candidates(settings.budgets,settings.seedStart),Math.max(settings.paired*4,36)).selected
  .filter(x=>!TWO_HANDS.has(x.weapon));
 if(pool.length<settings.paired)throw Error('Insufficient legal one-hand matched controls');
 const pairs=[['Shield','Orb'],['Orb','Tome'],['Charm','Off-Hand Dagger'],['Shield','Charm']];
 const results=[];
 for(let i=0;i<settings.paired;i++){
  const row={...pool[i],rarity:settings.rarity};
  const [a,b]=pairs[i%pairs.length];
  const left=execute(row,{tickLimit:settings.tickLimit,offhandOverride:a});
  const right=execute(row,{tickLimit:settings.tickLimit,offhandOverride:b});
  if(left.native.otherGearFingerprint!==right.native.otherGearFingerprint||
   left.native.resolvedSeed!==right.native.resolvedSeed||
   left.talentSha256!==right.talentSha256||left.seed!==right.seed||
   left.affinity!==right.affinity)
   throw Error('Matched Off-Hand pair changed other gear, talents, enemy seed or Realm');
  results.push({scenarioId:row.id,pair:[a,b],seed:row.seed,points:row.points,
   level:row.level,weapon:row.weapon,armor:row.armor,
   sameNonOffhandGear:true,sameResolvedSeed:true,
   comparison:{firstWon:left.won,secondWon:right.won,
    firstSeconds:left.durationSeconds,secondSeconds:right.durationSeconds},
   controls:[left,right]});
 }
 return {stage:'6.12',kind:'matched-offhand-native-fixtures',provenance:provenance(),
  pairs:results.length,actualFights:results.length*2,results,
  caveat:'Matched synthetic Off-Hand fixtures, not natural loot. Non-Off-Hand native rolled gear and real encounter seed are held constant.'};
}
function parse(args=[]){
 const v={...DEFAULTS,budgets:[...DEFAULTS.budgets]};
 for(const arg of args){
  const m=/^--([a-z-]+)=(.+)$/.exec(arg);if(!m)throw Error('Expected --key=value: '+arg);
  const [_,key,value]=m;
  if(key==='mode'&&['pilot','matrix','pairs','plan'].includes(value))v.mode=value;
  else if(key==='limit')v.limit=Number(value);
  else if(key==='paired')v.paired=Number(value);
  else if(key==='budgets')v.budgets=unique(value.split(',').map(Number));
  else if(key==='seed-start')v.seedStart=Number(value);
  else if(key==='tick-limit')v.tickLimit=Number(value);
  else if(key==='rarity'&&['Uncommon','Rare','Epic'].includes(value))v.rarity=value;
  else if(key==='resume'&&['true','false'].includes(value))v.resume=value==='true';
  else if(key==='out'&&value.endsWith('.json'))v.out=value;
  else throw Error('Unsupported Stage 6.12 option '+arg);
 }
 if(!Number.isSafeInteger(v.limit)||v.limit<1||v.limit>600)throw Error('Controlled fight budget must be 1–600');
 if(!Number.isSafeInteger(v.paired)||v.paired<1||v.paired>40)throw Error('Matched pair budget must be 1–40');
 if(!Array.isArray(v.budgets)||!v.budgets.length||v.budgets.some(x=>!Object.hasOwn(BUDGET_TO_E,x)))
  throw Error('Invalid legal talent point budgets');
 if(!Number.isSafeInteger(v.seedStart)||v.seedStart<1||v.seedStart>0xffffff00)throw Error('Invalid seed');
 if(!Number.isSafeInteger(v.tickLimit)||v.tickLimit<300||v.tickLimit>20000)throw Error('Invalid native combat update cap');
 return v;
}
function markdown(report){
 const s=report.summary,lines=['# Stage 6.12 — controlled native advanced combat','',
  '**Synthetic native-validated Talents and real rolled equipment: NOT naturally earned.**','',
  'Source fingerprint: '+report.provenance.game,
  'Fights: '+s.nativeFights,'Distinct archetypes: '+s.distinctArchetypes,
  'Distinct legal Talent states: '+s.distinctTalentAllocations,
  'Distinct legal Talent + equipment loadouts: '+s.distinctLegalLoadouts,
  'Boss fights: '+s.nativeBossFights+' (wins '+s.nativeBossWins+')',
  'Elite fights: '+s.nativeEliteFights,'Normal fights: '+s.nativeNormalFights,
  'Prepared ability fights: '+s.advancedPreparedFights,
  'Dual Affinity fights: '+s.mixedAffinityFights,
  'Triple Affinity fights: '+s.tripleAffinityFights,'',
  'All wins are controlled native battles, never natural account progression or win-rate estimates.','',
  '## Evidence integrity','',...report.cautions.map(x=>'- '+x),''];
 return lines.join('\n')+'\n';
}
function main(argv=process.argv.slice(2)){
 const opts=parse(argv);
 if(opts.mode==='plan'){
  const p=chooseScenarios(candidates(opts.budgets,opts.seedStart),opts.limit);
  const out={stage:'6.12',kind:'scenario-design-only',...p};
  atomicWrite(opts.out,out);console.log('STAGE612_PLAN='+JSON.stringify({
   candidates:p.poolSize,selected:p.selected.length,archetypes:p.selectedArchetypes}));
  return out;
 }
 const report=opts.mode==='pairs'?runMatchedOffhands(opts):run(opts);
 atomicWrite(opts.out,report);
 if(report.summary)fs.writeFileSync(opts.out.replace(/\.json$/,'.md'),markdown(report));
 console.log('STAGE612='+JSON.stringify({mode:opts.mode,out:opts.out,
  completed:report.completed??report.actualFights,summary:report.summary||null}));
 return report;
}
if(require.main===module){try{main();}catch(e){console.error('STAGE612_ERROR',e.stack||e);process.exitCode=1;}}
module.exports={DEFAULTS,archetypes,buildTalent,equipment,candidates,axes,chooseScenarios,execute,
 provenance,summary,verifyCheckpoint,run,runMatchedOffhands,parse,markdown,main};
