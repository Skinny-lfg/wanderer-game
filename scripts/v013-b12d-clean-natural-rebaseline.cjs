'use strict';
// B1.2D: approved H policy, independent fixed natural cohort, no runtime overrides.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),zlib=require('node:zlib'),assert=require('node:assert/strict');
const S=require('./simulate-progression.cjs'),N=require('./v013-natural-progression.cjs'),B=require('./v013-b1-e10-rebaseline.cjs'),A=require('./v013-b12c1-advanced-agent-audit.cjs'),H=require('./v013-b12c5-decision-isolation.cjs'),Balance=require('./v013-balance-criteria.cjs');
const T=globalThis.WandererAutomaticTalents,C=globalThis.WandererV013Crafting;
const OUT='reports/b12d',PER=100,BATCH=5,BATCHES=PER/BATCH,SEED_BASE=98200001,SEED_STEP=101;
const CONFIG=Object.freeze({...A.config}),TWO=new Set(['Two-Handed','Bow','Staff']),recipes=new Map(C.RECIPES.map(r=>[r.id,r]));
const KINDS=['normal','elite','boss'],SIZES=[1,4,8,12,16,22],ELITES=B.SC.filter(s=>s.elite),BOSSES={leech:'The Creditor',matriarch:'Carrion Matriarch',devourer:'Gullet',guardian:'Holdfast',berserker:'The Chainbreaker',conductor:'The Measure'};
const sum=(a,f)=>a.reduce((n,x)=>n+f(x),0),round=n=>Number.isFinite(n)?+n.toFixed(2):null,pct=(a,b)=>b?round(100*a/b):null,clone=x=>JSON.parse(JSON.stringify(x));
const seed=i=>SEED_BASE+i*SEED_STEP;
function approvedProfile(id){
 const p=H.profile(id,'H');
 assert(p.agentCompatibilityOnly===true&&p.decisionIsolation==='hands'&&!p.strictResearchIdentity&&!p.agentDecisionQuality&&!p.preferDualDaggers);
 return p;
}
function fingerprint(){
 const files=['v013-natural-progression.cjs','v013-b12c5-decision-isolation.cjs','v013-b12c3-equipment-factorial.cjs','v013-b12c1-advanced-agent-audit.cjs','v013-b1-e10-rebaseline.cjs','v013-balance-criteria.cjs','v013-build-planner.cjs','v013-agent-strategy.cjs',path.basename(__filename)];
 return {commit:process.env.GITHUB_SHA||null,native:S.sourceFingerprint().sha256,files:Object.fromEntries(files.map(x=>[x,crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,x))).digest('hex')]))};
}
function write(file,obj){fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(obj,null,2)+'\n');}
function zip(file,obj){fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,zlib.gzipSync(JSON.stringify(obj)));}
const unzip=file=>JSON.parse(zlib.gunzipSync(fs.readFileSync(file)));
const statsOf=s=>Object.fromEntries(['attack','spellPower','defense','maxhp','mana','manaRegen','attacksPerSec','crit','blockChance','evasionRating','healingPower','barrierPower'].map(k=>[k,s[k]??null]));
function compatibilityIssues(t,p){
 const issues=[],gear=t.before?.gear?.items||[],weapon=gear.find(x=>x.slot==='weapon'),off=gear.find(x=>x.slot==='offhand');
 if(TWO.has(weapon?.subtype)&&off)issues.push('native two-handed loadout has offhand');
 for(const c of t.camp?.crafted||[])if((c.slot==='offhand'||recipes.get(c.recipe)?.slot==='offhand')&&(TWO.has(c.weaponAtDecision)||p.weapons.every(w=>TWO.has(w))))issues.push('incompatible Forge '+c.recipe);
 for(const c of t.camp?.bought||[])if(c.slot==='offhand'&&(TWO.has(c.weaponAtDecision)||p.weapons.every(w=>TWO.has(w))))issues.push('incompatible Merchant '+c.name);
 return issues;
}
function account(id,i,config=CONFIG){
 const p=approvedProfile(id),s=seed(i);let snapshot=null;
 const acc=N.simulateAccount(s,id,{...N.DEFAULTS,...config},{researchProfiles:{[id]:p},decisionModel:'adaptive',equipEarnedRunes:true,onCamp:({a,level,attempt})=>{
  const state=a.state(),talents=state.automaticTalents,stats=statsOf(a.baseStats());
  if(level===10&&attempt===1){
   assert.equal(a.controller().state.unlocked,10);
   snapshot={level,seed:s,xp:talents.xp,earned:T.earned(talents),spent:talents.nodes.length,nodes:[...talents.nodes],element:talents.element||'arcane',prepared:talents.prepared||null,families:talents.nodes.filter(x=>x.startsWith('affinity_')).map(x=>x.slice(9)),gear:N.gearSnapshot(a),stats,runes:clone(state.runes),runeSlots:clone(state.runeSlots),crafting:clone(state.crafting),gold:state.gold,fragments:state.fragments,potions:clone(state.consumables),loadout:clone(state.potionSelection),capability:N.capabilities(a)};
  }
  return {legal:T.valid(talents),stats};
 }});
 assert.equal(acc.startXp,0);assert(acc.initialGear.items.every(x=>x.startingGear));
 const audit=A.audit(id,[acc]),issues=[...audit.issues];
 for(const t of acc.attempts)for(const message of compatibilityIssues(t,p))issues.push({seed:s,level:t.level,attempt:t.attempt,message});
 const attempts=acc.attempts.map(t=>({level:t.level,attempt:t.attempt,status:t.status,surrendered:!!t.surrendered,error:t.error||null,diagnostic:t.diagnostic||null,bossReached:t.bossReached,bossWon:t.bossWon,before:t.before?{potionSelection:t.before.potionSelection}:null,camp:t.camp,potions:t.potions,contractPaid:t.contractPaid,boons:t.boons,rooms:(t.rooms||[]).map(r=>{
  // peakLiveEnemies includes reserve actors; never use it as a visible cap.
  const {peakLiveEnemies,...room}=r;return {...room,peakTrackedActors:peakLiveEnemies};
 })}));
 return {id,index:i,seed:s,profile:id,reachedE10:acc.endLevel>=10,clearedE10:acc.endLevel>=11,endLevel:acc.endLevel,stopReason:acc.stopReason,snapshot,attempts,issues};
}
function manifest(){
 const m=B.manifest(),profiles=B.NATURAL.map(id=>({id,policy:approvedProfile(id),intent:m.natural.find(x=>x.id===id)}));
 assert.equal(profiles.length,28);assert.equal(new Set(Array.from({length:PER},(_,i)=>seed(i))).size,PER);
 return {fingerprint:fingerprint(),config:{...CONFIG,accountsPerProfile:PER,batchSize:BATCH,seedBase:SEED_BASE,seedStep:SEED_STEP,policy:'B1.2C.5 H / compatibility + hand-pair scoring',targets:Balance.TARGETS,idealHalfWidthPP:Balance.IDEAL_HALF_WIDTH_PP,tolerancePP:Balance.TOLERANCE_PP},profiles,seedList:Array.from({length:PER},(_,i)=>seed(i)),historical:{selectedRun:45910929359,approvedArm:'H',commit:'aa20bed7915182fad58d92a222431e85d676ed92',initialBaselineRun:45861310367},scenarios:m.config.scenarios,eliteIdentities:m.config.eliteIdentities,bossStyles:BOSSES};
}
function smoke(){
 const m=manifest();write(OUT+'/manifest.json',m);
 for(const id of B.NATURAL){const a=account(id,0,{...CONFIG,maxLevel:1,maxAttempts:1,maxTotalAttempts:1});assert.equal(a.attempts.length,1);assert(!a.attempts.some(t=>t.error),JSON.stringify({id,attempts:a.attempts.filter(t=>t.error)}));assert.deepEqual(a.issues,[],id);}
 console.log('B12D_SMOKE='+JSON.stringify({profiles:B.NATURAL.length,expected:PER*B.NATURAL.length,policy:m.config.policy,targets:m.config.targets}));
}
function batch(id,b){
 assert(B.NATURAL.includes(id));assert(Number.isInteger(b)&&b>=0&&b<BATCHES);
 const accounts=Array.from({length:BATCH},(_,j)=>{
  const i=b*BATCH+j;
  try{return account(id,i);}
  catch(e){return {id,index:i,seed:seed(i),profile:id,reachedE10:false,clearedE10:false,endLevel:null,stopReason:'Account harness exception',snapshot:null,attempts:[{level:null,attempt:null,status:'error',error:e.message,diagnostic:{stack:String(e.stack).slice(0,6000)},rooms:[]}],issues:[]};}
 });
 zip(OUT+'/batches/'+id+'/batch-'+b+'.json.gz',{id,batch:b,fingerprint:fingerprint(),accounts});
 console.log('B12D_BATCH='+JSON.stringify({id,batch:b,accounts:accounts.map(a=>({seed:a.seed,index:a.index,endLevel:a.endLevel,reachedE10:a.reachedE10,clearedE10:a.clearedE10,attempts:a.attempts.length,errors:a.attempts.filter(t=>t.error).map(t=>({level:t.level,attempt:t.attempt,error:t.error})),issues:a.issues.length}))}));
}
const kind=r=>r.roomType==='combat'?'normal':r.roomType;
function counts(rooms){const valid=rooms.filter(r=>r.won||r.died||r.surrendered);return {attempted:rooms.length,resolved:valid.length,wins:valid.filter(r=>r.won).length,deaths:valid.filter(r=>r.died).length,surrenders:valid.filter(r=>r.surrendered).length,timeouts:rooms.filter(r=>r.timedOut).length};}
const ZERO=Object.freeze(counts([]));
function mergeCounts(xs){return Object.fromEntries(Object.keys(ZERO).map(k=>[k,sum(xs,x=>x[k]||0)]));}
function outcomes(c){return {...c,winPct:pct(c.wins,c.resolved),unresolved:c.attempted-c.resolved,allUnresolvedAsLoss:pct(c.wins,c.attempted),allUnresolvedAsWin:pct(c.wins+c.attempted-c.resolved,c.attempted)};}
function accountRecord(a){
 const rooms=a.attempts.filter(t=>t.level===10).flatMap(t=>t.rooms||[]);
 return {id:a.id,index:a.index,seed:a.seed,endLevel:a.endLevel,reachedE10:a.reachedE10,enteredE10:!!a.snapshot,clearedE10:a.clearedE10,attempts:a.attempts.length,stopReason:a.stopReason,errors:a.attempts.filter(t=>t.error).map(t=>({level:t.level,attempt:t.attempt,error:t.error,diagnostic:t.diagnostic})),issues:a.issues,surrenders:a.attempts.filter(t=>t.surrendered).length,timeouts:sum(a.attempts,t=>(t.rooms||[]).filter(r=>r.timedOut).length),e10:Object.fromEntries(KINDS.map(k=>[k,counts(rooms.filter(r=>kind(r)===k))])),sizes:Object.fromEntries(SIZES.map((n,i)=>[n,counts(rooms.filter(r=>kind(r)==='normal'&&r.initialEnemies>(SIZES[i-1]||0)&&r.initialEnemies<=n))])),exactSizes:Object.fromEntries([...new Set(rooms.filter(r=>kind(r)==='normal').map(r=>r.initialEnemies))].sort((a,b)=>a-b).map(n=>[n,counts(rooms.filter(r=>kind(r)==='normal'&&r.initialEnemies===n))])),elites:Object.fromEntries(ELITES.map(e=>[e.eliteId,counts(rooms.filter(r=>kind(r)==='elite'&&r.eliteType===e.elite))])),bosses:Object.fromEntries(Object.keys(BOSSES).map(b=>[b,counts(rooms.filter(r=>kind(r)==='boss'&&r.bossStyle===b))]))};
}
// Resample whole shared-seed blocks across profiles, not individual fights.
// This retains within-account correlations and cross-profile shared-seed dependence.
function clusterCI(records,get,reps=1000){
 const by=new Map();for(const r of records){const c=get(r),b=by.get(r.index)||{wins:0,resolved:0};b.wins+=c.wins;b.resolved+=c.resolved;by.set(r.index,b);}
 const blocks=[...by.values()];if(blocks.length<2||!sum(blocks,x=>x.resolved))return null;
 let state=9137501;const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
 const vals=[];for(let i=0;i<reps;i++){let w=0,n=0;for(let j=0;j<blocks.length;j++){const b=blocks[Math.floor(random()*blocks.length)];w+=b.wins;n+=b.resolved;}if(n)vals.push(100*w/n);}
 vals.sort((a,b)=>a-b);return vals.length>=reps*.95?[round(vals[Math.floor((vals.length-1)*.025)]),round(vals[Math.floor((vals.length-1)*.975)])]:null;
}
function category(records,get){const total=mergeCounts(records.map(get));return {...outcomes(total),contributingAccounts:records.filter(r=>get(r).resolved>0).length,clusterCI95:clusterCI(records,get)};}
function aggregate(){
 const m=JSON.parse(fs.readFileSync(OUT+'/manifest.json','utf8')),expected=m.fingerprint;assert.deepEqual(expected,fingerprint());
 const missing=[],invalid=[],profiles=[],records=[];
 for(const id of B.NATURAL){
  const accounts=[];
  for(let b=0;b<BATCHES;b++){
   const file=OUT+'/batches/'+id+'/batch-'+b+'.json.gz';
   if(!fs.existsSync(file)){missing.push({id,batch:b});continue;}
   try{const x=unzip(file);assert.deepEqual(x.fingerprint,expected);assert.equal(x.id,id);assert.equal(x.batch,b);assert.equal(x.accounts.length,BATCH);for(const [j,a] of x.accounts.entries()){assert.equal(a.id,id);assert.equal(a.index,b*BATCH+j);assert.equal(a.seed,seed(a.index));}accounts.push(...x.accounts);}
   catch(e){invalid.push({id,batch:b,error:e.message});}
  }
  assert.equal(new Set(accounts.map(a=>a.index)).size,accounts.length);
  const rec=accounts.map(accountRecord);records.push(...rec);
  const p=B.naturalSummary(id,accounts),rooms=accounts.flatMap(a=>a.attempts.filter(t=>t.level===10).flatMap(t=>t.rooms||[]));
  p.enteredE10=p.reachedE10;p.reachedE10=rec.filter(a=>a.reachedE10).length;
  p.issues=rec.flatMap(r=>r.issues);p.accountsWithErrors=rec.filter(r=>r.errors.length).length;p.timeouts=sum(rec,r=>r.timeouts);p.surrenders=sum(rec,r=>r.surrenders);
  p.reachPct=pct(p.reachedE10,p.accounts);p.clearPct=pct(p.clearedE10,p.accounts);
  p.e10ExactSizes=Object.fromEntries([...new Set(rooms.filter(r=>kind(r)==='normal').map(r=>r.initialEnemies))].sort((a,b)=>a-b).map(n=>[n,B.fightSummary(rooms.filter(r=>kind(r)==='normal'&&r.initialEnemies===n))]));
  p.e10ClusterCI=Object.fromEntries(KINDS.map(k=>[k,category(rec,r=>r.e10[k])]));
  p.unknownRoster={normal:rooms.filter(r=>kind(r)==='normal'&&(!Number.isInteger(r.initialEnemies)||r.initialEnemies<1||r.initialEnemies>22)).length,elite:rooms.filter(r=>kind(r)==='elite'&&!ELITES.some(e=>e.elite===r.eliteType)).length,boss:rooms.filter(r=>kind(r)==='boss'&&!Object.hasOwn(BOSSES,r.bossStyle)).length};
  profiles.push(p);
  console.log('B12D_PROFILE='+JSON.stringify({id,accounts:p.accounts,reached:p.reachedE10,entered:p.enteredE10,cleared:p.clearedE10,errors:p.accountsWithErrors,issues:p.issues.length,timeouts:p.timeouts,surrenders:p.surrenders,e10:Object.fromEntries(KINDS.map(k=>[k,{...p.e10ClusterCI[k],meanAP:p.e10[k].meanAP,meanSP:p.e10[k].meanSP}])),identity:{weapon:p.identity.weapon,armor:p.identity.armor,offhand:p.identity.offhand,points:p.identity.points},progression:p.progression.map(x=>({level:x.level,accounts:x.accounts,attempts:x.attempts,bossWins:x.bossWins}))}));
 }
 const expectedAccounts=PER*B.NATURAL.length;
 const coverage={accounts:records.length,expectedAccounts,reachedE10:records.filter(r=>r.reachedE10).length,enteredE10:records.filter(r=>r.enteredE10).length,clearedE10:records.filter(r=>r.clearedE10).length,accountsWithErrors:records.filter(r=>r.errors.length).length,naturalErrors:sum(records,r=>r.errors.length),issues:sum(records,r=>r.issues.length),timeouts:sum(records,r=>r.timeouts),surrenders:sum(records,r=>r.surrenders),missingBatches:missing.length,invalidBatches:invalid.length,unknownRoster:sum(profiles,p=>sum(Object.values(p.unknownRoster),x=>x))};
 const naturalBalance=Object.fromEntries(KINDS.map(k=>{const c=category(records,r=>r.e10[k]);return [k,{...c,balance:Balance.classify(k,c.winPct,c.resolved)}];}));
 const bySize=Object.fromEntries(SIZES.map((n,i)=>[n,{min:(SIZES[i-1]||0)+1,max:n,...category(records,r=>r.sizes[n]||ZERO)}]));
 const exactSizes=Object.fromEntries([...new Set(records.flatMap(r=>Object.keys(r.exactSizes)))].sort((a,b)=>Number(a)-Number(b)).map(n=>[n,category(records,r=>r.exactSizes[n]||ZERO)]));
 const elites=Object.fromEntries(ELITES.map(e=>[e.eliteId,{name:e.name,runtimeId:e.elite,...category(records,r=>r.elites[e.eliteId]||ZERO)}]));
 const bosses=Object.fromEntries(Object.entries(BOSSES).map(([id,name])=>[id,{name,...category(records,r=>r.bosses[id]||ZERO)}]));
 const progression=Array.from({length:10},(_,i)=>({level:i+1,accountsEntering:sum(profiles,p=>p.progression[i].accounts),attempts:sum(profiles,p=>p.progression[i].attempts),bossWins:sum(profiles,p=>p.progression[i].bossWins),deaths:sum(profiles,p=>p.progression[i].deaths),surrenders:sum(profiles,p=>p.progression[i].surrenders),extractions:sum(profiles,p=>p.progression[i].extractions),byType:Object.fromEntries(KINDS.map(k=>[k,outcomes(mergeCounts(profiles.map(p=>p.progression[i].byType[k])))]))}));
 const complete=coverage.accounts===expectedAccounts&&!coverage.missingBatches&&!coverage.invalidBatches;
 const clean=complete&&!coverage.naturalErrors&&!coverage.issues&&!coverage.timeouts&&!coverage.unknownRoster;
 const result={fingerprint:expected,config:m.config,seedList:m.seedList,coverage,complete,clean,qualityGate:clean?'TECHNICAL PASS — independent natural reference; balance acceptance pending review':'FAIL — incomplete or unresolved technical evidence',naturalBalance,bySize,exactSizes,elites,bosses,progression,profiles,missing,invalid,accounts:records,limitations:['Natural E10 results condition on earned progression and chosen encounters; they are not controlled encounter census or human player rates.','Profiles equally represented at start, encounter rates weighted by observed resolved fights; bootstrap uses shared-seed blocks.','Unresolved outcomes included in attempted denominators and sensitivity bounds. No silent exclusions.','Native room initialEnemies includes reserve roster, not simultaneous visible count. Visible cap not measured by this baseline.','Per-fight native telemetry is not a full ability ablation; missing counters do not prove absent effects. Existing per-fight Wilson intervals in profile summaries are descriptive only.']};
 write(OUT+'/summary.json',result);
 const fmt=x=>x.winPct===null?'n/a':x.winPct+'% ('+x.wins+'/'+x.resolved+')';
 const md=['# B1.2D — Clean Natural Rebaseline','',result.qualityGate,'',JSON.stringify(coverage),'','## E10 aggregate (encounter-weighted)','| Kind | Target | Acceptable | Wins/resolved | 95% seed-cluster CI | Status |','|---|---:|---:|---:|---|---|',...KINDS.map(k=>{const v=naturalBalance[k],b=v.balance;return '| '+[k,b.target+'%',b.acceptableMin+'–'+b.acceptableMax+'%',fmt(v),JSON.stringify(v.clusterCI95),b.status].join(' | ')+' |';}),'','## E10 natural roster sizes','| Initial roster | Wins/resolved |','|---|---:|',...Object.values(bySize).map(x=>'| '+x.min+'–'+x.max+' | '+fmt(x)+' |'),'','## Elites and bosses','| Encounter | Wins/resolved |','|---|---:|',...[...Object.values(elites),...Object.values(bosses)].map(x=>'| '+x.name+' | '+fmt(x)+' |'),'','## Profiles','| Profile | Accounts | Reached E10 | Cleared E10 | Normal | Elite | Boss | Errors |','|---|---:|---:|---:|---:|---:|---:|---:|',...profiles.map(p=>'| '+[p.id,p.accounts,p.reachedE10,p.clearedE10,fmt(p.e10.normal),fmt(p.e10.elite),fmt(p.e10.boss),p.accountsWithErrors].join(' | ')+' |'),'','## Limitations',...result.limitations.map(x=>'- '+x)];
 fs.writeFileSync(OUT+'/summary.md',md.join('\n')+'\n');
 console.log('B12D_OVERVIEW='+JSON.stringify({coverage,complete,clean,naturalBalance,bySize,exactSizes,elites,bosses,progression,missing,invalid,qualityGate:result.qualityGate}));
 if(!clean)process.exitCode=1;
}
if(require.main===module){const [cmd,id,b]=process.argv.slice(2);if(cmd==='smoke')smoke();else if(cmd==='batch')batch(id,Number(b));else if(cmd==='aggregate')aggregate();else throw Error('Unknown command');}
module.exports={approvedProfile,seed,PER,BATCH,BATCHES,CONFIG,counts,outcomes,clusterCI,compatibilityIssues,accountRecord};
