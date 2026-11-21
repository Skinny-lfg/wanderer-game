'use strict';
// Stage 6.11 — legal native TalentGraph proposals and adaptive, earned-account
// simulation scheduling. Never grants XP, loot or unlocks to combat accounts.
// The separate structural planner models earned point BUDGETS, not earned XP.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const S=require('./simulate-progression.cjs');
const P=require('./v013-build-planner.cjs');
const N=require('./v013-natural-progression.cjs');
const C=require('./v013-stage610-coverage-benchmark.cjs');
const G=globalThis.WandererTalentGraph,T=globalThis.WandererAutomaticTalents;
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const unique=x=>[...new Set(x)];
const graph=new Map(T.NODES.map(n=>[n.id,n]));
const DEFAULTS=Object.freeze({
 mode:'legal',budgets:[0,2,6,12,24,36,60,100],
 profiles:['smart-blood-pure','smart-fury-daggers','smart-magic-wand','smart-aegis-vitality',
  'smart-decay-magic-aegis','smart-blood-fury-vitality'],
 seeds:[9701,9702],sampleBudget:4,maxLevel:2,maxAttempts:2,maxTotalAttempts:3,
 out:'reports/v013-stage611.json',resume:false
});
function provenance(){
 return {sourceSha256:S.sourceFingerprint().sha256,
  naturalRunnerSha256:sha(fs.readFileSync(require.resolve('./v013-natural-progression.cjs'))),
  buildPlannerSha256:sha(fs.readFileSync(require.resolve('./v013-build-planner.cjs'))),
  generatorSha256:sha(fs.readFileSync(__filename))};
}
const prefix=id=>id?.replace(/_rank\d+$/,'')||'';
function familyPlan(target,provided={}){
 const node=graph.get(target);
 if(!node)throw Error('Unknown live target '+target);
// Structural reachability is for the ACTUAL target family/pair, not the
 // profile that once mentioned the ability (which may have 3 Affinities).
 const pair=node.pair||provided.pair||null;
 const primary=pair?.[0]||node.family||provided.primary||'blood';
 const secondary=pair?.[1]||null;
 const element=node.element||provided.element||'arcane';
 return {primary,secondary,mix:!!pair,model:pair?'mixed':provided.model||'focused',
  element,milestones:[target],focus:'legal-coverage'};
}
function pathTargets(){
 const targets=[];
 const add=(target,kind,spec={})=>{
  if(!graph.has(target))throw Error('Live target missing for '+kind+': '+target);
  if(targets.some(x=>x.id===target))return;
  targets.push({id:target,kind,plan:familyPlan(target,spec)});
 };
 for(const family of G.FAMILIES){
  for(let lane=0;lane<2;lane++)add(G.BASICS[family][lane*3+2],'basic',{primary:family});
  // The retired Magic focused arcane nodes no longer exist. Live v15 uses
  // arcane_mastery in the shared Magic element/attunement route instead.
  const goal=family==='magic'?'arcane_mastery':G.FOCUSED[family].at(-1);
  add(goal,'focused',{primary:family,element:'arcane'});
 }
 for(const [first,second,...skills] of G.MIXED)
  add(skills.at(-1),'mixed',{primary:first,secondary:second,pair:[first,second]});
 for(const [element,ids] of Object.entries(G.ELEMENTS))
  add(ids.at(-1),'magic-element',{primary:'magic',element});
 const coreCount=targets.length; // 12 basic + 6 current focused + 6 mixed + 3 Magic modes.
 for(const [profileId,p] of Object.entries(P.BUILDS)){
  for(const target of p.milestones||[]){
   if(!graph.has(target))throw Error('Agent has retired milestone '+profileId+': '+target);
   if(!targets.some(x=>x.id===target))
    add(target,'agent-milestone',{primary:p.primary,secondary:p.secondary,
     pair:graph.get(target)?.pair||null,element:p.element||'arcane'});
  }
 }
 if(coreCount!==27)throw Error('Wrong current structural route target count '+coreCount);
 return {coreCount,targets};
}
function hasConflict(node,owned){
 if(node.excludes?.some(id=>owned.has(id)))return true;
 for(const id of owned)if(graph.get(id)?.excludes?.includes(node.id))return true;
 return false;
}
function legalRoute(target,plan){
 const empty=T.create();
 const route=P.routeTo(T,empty,target,plan,unique([plan.primary,plan.secondary].filter(Boolean)));
 if(!route)return {route:null,reason:'planner_no_legal_prerequisite_route'};
 if(new Set(route).size!==route.length||route.at(-1)!==target)
  return {route:null,reason:'planner_route_duplicate_or_nonterminal'};
 for(const id of route)if(!graph.has(id))
  return {route:null,reason:'unrecognized_live_node_'+id};
 // Checking with T.allocate is mandatory: a dependency listing is not proof.
 const p=T.award(T.create(),T.MAX_POINTS*T.POINT_XP),owned=new Set(),seen=[];
 let progress=p;
 for(const id of route){
  const n=graph.get(id);
  if(hasConflict(n,owned))return {route:null,reason:'mutually_exclusive_node_'+id};
  const next=T.allocate(progress,id);
  if(!next)return {route:null,reason:'native_allocation_rejected_'+id};
  progress=next;owned.add(id);seen.push(id);
  if(id==='element_choice'&&plan.element&&plan.element!=='arcane'){
   const selected=T.selectElement(progress,plan.element);
   if(!selected)return {route:null,reason:'native_attunement_rejected_'+plan.element};
   progress=selected;
  }
 }
 if(!T.valid(progress)||!progress.nodes.includes(target))
  return {route:null,reason:'invalid_native_result'};
 return {route,reason:null};
}
function candidate(target,budget,{rank=1}={}){
 if(!Number.isInteger(budget)||budget<0||budget>T.MAX_POINTS)throw Error('Invalid point budget');
 const definition=typeof target==='string'?{id:target,plan:familyPlan(target)}:target;
 const {route,reason}=legalRoute(definition.id,definition.plan);
 const node=graph.get(definition.id),maxRank=node.maxRank||1;
 if(!Number.isInteger(rank)||rank<1||rank>maxRank)throw Error('Invalid target rank '+definition.id+': '+rank);
 const cost=route?route.length+rank-1:null;
 let progress=T.award(T.create(),budget*T.POINT_XP);
 const purchased=[],steps=route?[...route,...Array(rank-1).fill(definition.id)]:[];
 if(route)for(const id of steps){
  if(progress.nodes.length===budget)break;
  const n=graph.get(id),owned=new Set(progress.nodes.map(prefix));
  if(hasConflict(n,owned))throw Error('Unexpected exclusive node '+id);
  const next=T.allocate(progress,id);
  if(!next)throw Error('Planner predicted an illegal purchase at '+id+' for '+definition.id);
  progress=next;purchased.push(id);
  if(id==='element_choice'&&definition.plan.element!=='arcane'){
   const selected=T.selectElement(progress,definition.plan.element);
   if(!selected)throw Error('Impossible attunement transition '+definition.id);
   progress=selected;
  }
 }
 if(!T.valid(progress)||progress.xp!==budget*T.POINT_XP||progress.nodes.length>budget)
  throw Error('Illegal or fabricated candidate progress '+definition.id);
 const owned=progress.nodes.filter(id=>prefix(id)===definition.id).length;
 const status=!route?'unresolved-route':owned>=rank?'native-legal':'point-budget-insufficient';
 return {target:definition.id,kind:definition.kind||null,primary:definition.plan.primary,
  secondary:definition.plan.secondary||null,mode:definition.plan.element,rank,
  availablePoints:budget,requiredRouteCost:cost,spent:progress.nodes.length,
  status,reason:reason||null,orderedNativePurchases:purchased,actualNodes:progress.nodes,
  nativeValid:true,
  caveat:'Synthetic talent-only point budget; not real earned XP, gear, encounter access or a combat simulation.'};
}
function enumerateLegal(budgets=DEFAULTS.budgets){
 if(!Array.isArray(budgets)||!budgets.length||budgets.some(n=>!Number.isInteger(n)||n<0||n>100))
  throw Error('Invalid point budget list');
 const {coreCount,targets}=pathTargets();
 const rows=[];
 for(const b of unique(budgets).sort((x,y)=>x-y)){
  for(const target of targets){
   rows.push(candidate(target,b));
   if((graph.get(target.id).maxRank||1)>1)
    rows.push(candidate(target,b,{rank:Math.min(3,graph.get(target.id).maxRank)}));
  }
 }
 const profiles=enumerateProfiles(budgets);
 const count=status=>rows.filter(x=>x.status===status).length;
 const unresolved=unique(rows.filter(x=>x.reason).map(x=>x.target+': '+x.reason));
 return {stage:'6.11',kind:'native-validated-talent-candidate-inventory',
  provenance:provenance(),budgets:unique(budgets).sort((x,y)=>x-y),
  coreRouteTargets:coreCount,allTargets:targets.length,targetKinds:Object.fromEntries(
   unique(targets.map(x=>x.kind)).map(k=>[k,targets.filter(x=>x.kind===k).length])),
  rowCount:rows.length,legal:count('native-legal'),budgetInsufficient:count('point-budget-insufficient'),profileCoverage:profiles,
  unresolved:count('unresolved-route'),unresolvedReasons:unresolved,rows,
  constraints:['Only actual graph targets and existing T.allocate/T.selectElement operations are used.',
   '21 live strategic agent profiles are also checked at each budget, including adaptive hypothetical survival pressure when applicable.',
   'Each resulting synthetic structural snapshot passes T.valid with exactly the supplied point budget.',
   'These are selected route and rank candidates; NOT exhaustive legal allocations or guaranteed minimum paths.',
   'The talent-only point budget is intentionally synthetic. Only the separate native E1 account campaign supplies genuinely earned XP and gear.',
   'Missing/invalid/out-of-mode routes are reported as unresolved, never invented or counted as legal.',
   'Magic Arcane uses the current arcane_mastery route; the retired Magic focused path is not executed.']};
}

function profileCandidate(profileId,budget,{pressure=false}={}){
 if(!Object.hasOwn(P.BUILDS,profileId)||!Number.isInteger(budget)||budget<0||budget>T.MAX_POINTS)
  throw Error('Invalid profile or talent point budget');
 const plan=P.getPlan(profileId),xp=budget*T.POINT_XP;
 // Adversarial hypothetical history is only for exploring legal three-Affinity
 // path decisions; it never enters or contaminates the native account runner.
 const hypotheticalHistory=pressure?[{status:'defeat',rooms:[]}]:[];
 const proposed=P.propose(T,T.award(T.create(),xp),profileId,hypotheticalHistory,0);
 const progress={xp,nodes:[...proposed.expectedNodes],treeVersion:15};
 if(proposed.expectedElement!=='arcane')progress.element=proposed.expectedElement;
 if(!T.valid(progress))throw Error('Planner made an invalid native profile '+profileId+' at '+budget);
 if(proposed.spent>budget||progress.nodes.length!==proposed.spent)
  throw Error('Profile planner overspent genuine point budget '+profileId);
 const actual=unique(progress.nodes.filter(x=>x.startsWith('affinity_')).map(x=>x.slice(9)));
 if(actual.some(f=>!proposed.allowed.includes(f)))throw Error('Unapproved Affinity in legal profile '+profileId);
 return {profile:profileId,budget,historyCase:pressure?'hypothetical-pressure':'neutral',
  model:plan.model,primary:plan.primary,secondary:plan.secondary||null,third:plan.third||null,
  allowedAffinities:proposed.allowed,actuallyUnlocked:actual,mixedEnabled:!!plan.mix,
  eligibleThird:!!(plan.third&&proposed.allowed.includes(plan.third)),mode:proposed.expectedElement,
  actualNodes:progress.nodes,spent:proposed.spent,unspent:budget-proposed.spent,
  milestone:proposed.milestone,resetRecommended:proposed.resetReason,
  valid:true,
  caveat:'Hypothetical XP budget and optional simulated defeat pressure for legal talent-plan inspection ONLY; no account, gear or combat was simulated.'};
}
function enumerateProfiles(budgets=DEFAULTS.budgets){
 const rows=[];
 for(const id of Object.keys(P.BUILDS))for(const budget of unique(budgets).sort((a,b)=>a-b)){
  rows.push(profileCandidate(id,budget));
  if(P.BUILDS[id].third&&P.BUILDS[id].model==='adaptive')
   rows.push(profileCandidate(id,budget,{pressure:true}));
 }
 return {profiles:Object.keys(P.BUILDS).length,rows:rows.length,
  threeAffinityEligible:rows.filter(x=>x.eligibleThird).length,
  threeAffinityActuallyUnlocked:rows.filter(x=>x.actuallyUnlocked.length===3).length,
  mixedModels:rows.filter(x=>x.mixedEnabled).length,observations:rows};
}

function parse(args=[]){
 const v={...DEFAULTS,budgets:[...DEFAULTS.budgets],profiles:[...DEFAULTS.profiles],seeds:[...DEFAULTS.seeds]};
 const numbers=(s,min,max,label)=>{const x=unique(s.split(',').map(Number));if(!x.length||x.some(n=>!Number.isSafeInteger(n)||n<min||n>max))
  throw Error('Invalid '+label);return x;};
 for(const arg of args){
  const m=/^--([a-z-]+)=(.+)$/.exec(arg);if(!m)throw Error('Expected --key=value: '+arg);
  const [_,key,value]=m;
  if(key==='mode'&&['legal','campaign'].includes(value))v.mode=value;
  else if(key==='budgets')v.budgets=numbers(value,0,100,'budgets');
  else if(key==='profiles'){
   const p=unique(value.split(','));
   if(!p.length||p.some(id=>!id.startsWith('smart-')||!Object.hasOwn(P.BUILDS,id.slice(6))))throw Error('Invalid strategic profiles');
   v.profiles=p;
  }else if(key==='seeds')v.seeds=numbers(value,1,0xffffffff,'seeds');
  else if(key==='sample-budget')v.sampleBudget=Number(value);
  else if(key==='max-level')v.maxLevel=Number(value);
  else if(key==='max-attempts')v.maxAttempts=Number(value);
  else if(key==='max-total-attempts')v.maxTotalAttempts=Number(value);
  else if(key==='resume'&&['true','false'].includes(value))v.resume=value==='true';
  else if(key==='out'&&value.endsWith('.json'))v.out=value;
  else throw Error('Unknown Stage 6.11 argument '+arg);
 }
 if(!Number.isSafeInteger(v.sampleBudget)||v.sampleBudget<1||v.sampleBudget>64)throw Error('Campaign budget must be 1–64 actual accounts');
 if(!Number.isSafeInteger(v.maxLevel)||v.maxLevel<1||v.maxLevel>20)throw Error('Native E1–E20 only');
 if(!Number.isSafeInteger(v.maxAttempts)||v.maxAttempts<1||v.maxAttempts>36)throw Error('Invalid native attempt cap');
 if(!Number.isSafeInteger(v.maxTotalAttempts)||v.maxTotalAttempts<1||v.maxTotalAttempts>400)throw Error('Invalid total attempt cap');
 if(v.mode==='campaign'&&v.sampleBudget>v.profiles.length*v.seeds.length)
  throw Error('Need at least as many unique seed/profile pairs as actual account budget');
 return v;
}
function atomicWrite(file,obj){
 const dest=path.resolve(file),tmp=dest+'.tmp-'+process.pid;
 fs.mkdirSync(path.dirname(dest),{recursive:true});
 fs.writeFileSync(tmp,JSON.stringify(obj,null,2)+'\n');fs.renameSync(tmp,dest);
}
function accountAxes(a){
 const axes=[],seen=new Set();
 for(const t of a.attempts||[]){
  if(t.status==='error'||t.error)continue;
  const weapon=t.before?.gear?.items?.find(i=>i.slot==='weapon')?.subtype||null;
  const armor=t.before?.gear?.items?.find(i=>i.slot==='armor')?.armorType||null;
  const realm=t.affinity||null;
  const add=(key,val)=>{if(!val)return;const code=key+'='+val;if(!seen.has(code)){seen.add(code);axes.push(code);}};
  add('actualWeapon',weapon);add('actualArmor',armor);add('realEncounterAffinity',realm);
  for(const n of t.before?.talentNodes||[])if(n.startsWith('affinity_'))add('realTalentAffinity',n.slice(9));
  for(const r of t.rooms||[]){
   if(r.bossStyle)add('encounteredBossStyle',r.bossStyle);
   if(r.eliteType)add('encounteredEliteType',r.eliteType);
  }
  for(const p of t.potions||[])add('consumedPotion',p.kind);
  for(const b of t.boons||[])add('selectedBoon',b.id);
 }
 return axes;
}
function verifyAccount(account,profile,seed){
 if(account.seed!==seed||account.profile!==profile||account.startXp!==0||
    account.initialGear?.total!==account.initialGear?.starter)
  throw Error('Native initial account provenance rejected '+profile+':'+seed);
 if(account.attempts?.some(t=>t.error||t.status==='error'))
  throw Error('Native account produced an error '+profile+':'+seed+' '+account.attempts.find(t=>t.error)?.error);
 for(const attempt of account.attempts){
  const b=attempt.before;
  if(!b)throw Error('Missing native Camp-before snapshot');
  if(attempt.level>b.unlocked)throw Error('Artificial Expedition unlock');
  if(attempt.level>1&&!account.attempts.some(t=>t.level===attempt.level-1&&t.bossWon))
   throw Error('Level reached without prior native Boss victory');
  const progress={xp:b.xp,nodes:b.talentNodes,treeVersion:15};
  if(b.element)progress.element=b.element;
  if(b.prepared)progress.prepared=b.prepared;
  if(!T.valid(progress)||T.earned(progress)!==b.earned||b.earned<b.spent)
   throw Error('Invalid or invented native talent progress '+profile);
  if(attempt.camp?.plan?.points!==b.earned||
     attempt.camp?.plan?.spent!==b.spent)
   throw Error('Native agent Camp planning differs from earned talent budget');
  if(!attempt.before?.gear?.items?.every(i=>i.rarity&&i.slot&&Number.isFinite(i.tier)))
   throw Error('Invalid native equipped gear snapshot');
  if((attempt.rooms||[]).some(r=>r.timedOut||r.error))
   throw Error('Native combat timeout or runtime error');
 }
 return true;
}
function plannedAxes(profile){
 const p=P.getPlan(profile.slice(6));
 return ['intentPrimary='+p.primary,'intentModel='+p.model,
  ...p.weapons.map(w=>'intentWeapon='+w)];
}
function chooseAdaptiveJob(jobs,done){
 const seen=new Set(done.flatMap(x=>x.observedAxes||[]));
 const counts=new Map();
 for(const x of done)counts.set(x.profile,(counts.get(x.profile)||0)+1);
 return jobs.map(job=>{
  const intent=plannedAxes(job.profile),newIntent=intent.filter(x=>!done.some(d=>d.profile===job.profile)).length;
  const primary=intent.find(x=>x.startsWith('intentPrimary=')),nPrimary=done.filter(d=>
   plannedAxes(d.profile).includes(primary)).length;
  const unseenWeapon=intent.filter(x=>x.startsWith('intentWeapon=')&&!seen.has(
   x.replace('intentWeapon=','actualWeapon='))).length;
  const profileTrials=counts.get(job.profile)||0;
  // Primarily ensure every competing strategic profile gets a chance,
  // then prioritize uncovered actually observed equipment/affinity axes.
  const score=(profileTrials===0?100:0)+unseenWeapon*5+
   9/(1+nPrimary)+7/(1+profileTrials);
  return {...job,score:Number(score.toFixed(5)),
   reason:{newProfile:profileTrials===0,unseenPreferredWeapons:unseenWeapon,
    previouslyRunProfile:profileTrials,newIntendedAxes:newIntent}};
 }).sort((a,b)=>b.score-a.score||a.seed-b.seed||a.profile.localeCompare(b.profile))[0]||null;
}
function campaign(opts){
 const origin=provenance(),settings={profiles:opts.profiles,seeds:opts.seeds,
  sampleBudget:opts.sampleBudget,maxLevel:opts.maxLevel,maxAttempts:opts.maxAttempts,
  maxTotalAttempts:opts.maxTotalAttempts};
 const configHash=sha(JSON.stringify({origin,settings}));
 const jobs=opts.profiles.flatMap(profile=>opts.seeds.map(seed=>({profile,seed})));
 let output={stage:'6.11',kind:'real-native-adaptive-account-pilot',origin,settings,configHash,
  completed:0,samples:[],selectionLog:[],
  caveats:['Every run is a real E1 native account with zero starting talent points and weak starter gear.',
   'Adaptive scheduling selects which legitimate profile/seed to try next; it never forces weapon drops or enemy encounters.',
   'Account results are not independent unconfounded estimates of profile win rate: selection is intentionally adaptive.',
   'A route plan does not guarantee obtaining that weapon or entering the Boss or Elite room.',
   'No extrapolation to E10/E20 from E1/E2; use larger validated cohorts later.']};
 if(opts.resume&&fs.existsSync(opts.out)){
  const old=JSON.parse(fs.readFileSync(opts.out,'utf8'));
  if(old.kind!==output.kind||old.configHash!==configHash||!Array.isArray(old.samples)||
     !Array.isArray(old.selectionLog)||old.completed!==old.samples.length||
     old.samples.length!==old.selectionLog.length||old.completed>opts.sampleBudget)
   throw Error('Checkpoint mismatch — refusing mixed source revision/settings');
  for(const s of old.samples)verifyAccount(s.account,s.profile,s.seed);
  output=old;
 }
 while(output.completed<opts.sampleBudget){
  const picked=new Set(output.samples.map(x=>x.profile+':'+x.seed));
  const pending=jobs.filter(j=>!picked.has(j.profile+':'+j.seed));
  const choice=chooseAdaptiveJob(pending,output.samples);
  if(!choice)throw Error('Not enough unique native account jobs');
  const parsed=N.parseArgs(['--seeds='+choice.seed,'--profiles='+choice.profile,
   '--max-level='+opts.maxLevel,'--max-attempts='+opts.maxAttempts,
   '--max-total-attempts='+opts.maxTotalAttempts]);
  const started=process.hrtime.bigint();
  const account=N.simulateAccount(choice.seed,choice.profile,parsed,{decisionModel:'adaptive'});
  verifyAccount(account,choice.profile,choice.seed);
  const durationMs=Number(process.hrtime.bigint()-started)/1e6;
  const attempts=account.attempts,rooms=attempts.flatMap(t=>t.rooms||[]);
  const observedAxes=accountAxes(account);
  const sample={seed:choice.seed,profile:choice.profile,selectionScore:choice.score,
   selectionReason:choice.reason,observedAxes,
   measuredMs:Number(durationMs.toFixed(2)),actualWeaponTypes:unique(attempts
    .map(t=>t.before?.gear?.items?.find(i=>i.slot==='weapon')?.subtype).filter(Boolean)),
   actualArmorTypes:unique(attempts
    .map(t=>t.before?.gear?.items?.find(i=>i.slot==='armor')?.armorType).filter(Boolean)),
   reaches:account.reached,unlockedLevel:account.endLevel,stopReason:account.stopReason,
   attempts:attempts.length,rooms:rooms.length,
   naturalBossWins:attempts.filter(t=>t.bossWon).length,
   naturalBossFights:rooms.filter(r=>r.kind==='boss').length,
   naturalEliteFights:rooms.filter(r=>r.kind==='elite').length,
   potionsUsed:attempts.reduce((n,t)=>n+(t.potions?.length||0),0),
   boonsChosen:attempts.reduce((n,t)=>n+(t.boons?.length||0),0),
   talentResets:attempts.reduce((n,t)=>n+(t.camp?.resets?.length||0),0),
   preparedUses:rooms.reduce((n,t)=>n+(t.preparedActivations||0),0),
   account};
  output.samples.push(sample);
  output.selectionLog.push({seed:choice.seed,profile:choice.profile,score:choice.score,
   reason:choice.reason});
  output.completed=output.samples.length;
  atomicWrite(opts.out,output);
 }
 output.observedCoverage={
  uniqueAxes:unique(output.samples.flatMap(x=>x.observedAxes)).sort(),
  actualWeapons:unique(output.samples.flatMap(x=>x.actualWeaponTypes)).sort(),
  actualArmor:unique(output.samples.flatMap(x=>x.actualArmorTypes)).sort(),
  nativeCombatRooms:output.samples.reduce((n,x)=>n+x.rooms,0),
  nativeBossFights:output.samples.reduce((n,x)=>n+x.naturalBossFights,0),
  nativeEliteFights:output.samples.reduce((n,x)=>n+x.naturalEliteFights,0),
  nativeBossWins:output.samples.reduce((n,x)=>n+x.naturalBossWins,0),
  resets:output.samples.reduce((n,x)=>n+x.talentResets,0),
  potions:output.samples.reduce((n,x)=>n+x.potionsUsed,0),
  boons:output.samples.reduce((n,x)=>n+x.boonsChosen,0)
 };
 // A complete designed Stage 6.10 pairwise scenario list is never inferred
 // from this much smaller genuinely observed E1–E20 cohort.
 output.coverageNote='Observed native axes above are ONLY those reached and seen in actual accounts. Unreached families, specializations, Bosses and other factor combinations remain unknown.';
 atomicWrite(opts.out,output);
 return output;
}
function markdown(r){
 const out=['# Stage 6.11 — '+r.kind,'',
  '**No gameplay, economy, balance, Firebase or production changes.**','',
  'Native source SHA-256: '+(r.provenance?.sourceSha256||r.origin?.sourceSha256||'unknown'), ''];
 if(r.kind==='native-validated-talent-candidate-inventory'){
  out.push('Live targets: '+r.allTargets+' ('+r.coreRouteTargets+' route endpoints + agent milestones).',
   'Validated strategic profiles: '+r.profileCoverage.profiles,
   'Legal profile snapshots: '+r.profileCoverage.rows,
   'Three-Affinity actual legal snapshots: '+r.profileCoverage.threeAffinityActuallyUnlocked,
   'Point budgets: '+r.budgets.join(', '),
   'Candidate rows: '+r.rowCount,'Native legal targets: '+r.legal,
   'Under budget: '+r.budgetInsufficient,'Unresolved (NOT tested): '+r.unresolved,'',
   '## Unresolved prerequisite routes','',
   ...(r.unresolvedReasons.length?r.unresolvedReasons.map(x=>'- '+x):['None']),
   '','This is a synthetic **talent-only** feasibility audit, NOT a combat or earnable gear simulation.','');
 }else{
  out.push('Native E1 accounts: '+r.completed+'/'+r.settings.sampleBudget,
   'Native combat rooms actually run: '+(r.observedCoverage?.nativeCombatRooms??'unknown'),
   'Natural Boss fights: '+(r.observedCoverage?.nativeBossFights??'unknown'),
   'Natural Elite fights: '+(r.observedCoverage?.nativeEliteFights??'unknown'),
   'Actual weapon types: '+(r.observedCoverage?.actualWeapons.join(', ')||'none'),
   'Talents reset via native Camp: '+(r.observedCoverage?.resets??0),
   'Native potion uses: '+(r.observedCoverage?.potions??0),
   'Boon choices: '+(r.observedCoverage?.boons??0),'',
   'Only actual encounters and earned items count. Missing comparisons are **unknown**, not assumed tested.','');
 }
 out.push('## Evidence constraints','',...(r.constraints||r.caveats||[]).map(x=>'- '+x),'');
 return out.join('\n');
}
function main(args=process.argv.slice(2)){
 const v=parse(args),r=v.mode==='legal'?enumerateLegal(v.budgets):campaign(v);
 atomicWrite(v.out,r);fs.writeFileSync(v.out.replace(/\.json$/,'.md'),markdown(r));
 console.log('STAGE611='+JSON.stringify({mode:v.mode,out:v.out,source:r.provenance?.sourceSha256||r.origin?.sourceSha256,
  candidates:r.rowCount,legal:r.legal,unresolved:r.unresolved,
  nativeAccounts:r.completed,nativeRooms:r.observedCoverage?.nativeCombatRooms}));
 return r;
}
if(require.main===module){try{main();}catch(err){console.error('STAGE611_ERROR:',err.stack||err);process.exitCode=1;}}
module.exports={DEFAULTS,pathTargets,familyPlan,legalRoute,candidate,enumerateLegal,
 profileCandidate,enumerateProfiles,parse,
 provenance,accountAxes,verifyAccount,chooseAdaptiveJob,campaign,markdown,main};
