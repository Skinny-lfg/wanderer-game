'use strict';
// B8.3 exploratory native earned progression. Same seed blocks across profiles;
// repeated fights are not independent. No runtime overrides, tuning or synthetic grants.
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const R=require('./v013-b82-natural-readiness.cjs'),D=require('./v013-b12d-clean-natural-rebaseline.cjs'),A=require('./v013-b12c1-advanced-agent-audit.cjs'),N=require('./v013-natural-progression.cjs'),S=require('./simulate-progression.cjs'),Balance=require('./v013-balance-criteria.cjs');
const BASE='8eda78e7c7b5f9a6b16faeb216533134dd80e6c8',OUT='reports/b83',SEEDS=Object.freeze(Array.from({length:5},(_,i)=>138300091+i*173)),KINDS=['normal','elite','boss'];
const sum=(xs,f)=>xs.reduce((n,x)=>n+f(x),0),pct=(w,n)=>n?+(100*w/n).toFixed(2):null;
const count=(xs,f)=>{const a={};for(const x of xs){const k=f(x)??'none';a[k]=(a[k]||0)+1;}return a;};
const kind=r=>r.roomType==='combat'?'normal':r.roomType,rooms=ts=>ts.flatMap(t=>t.rooms||[]);
const write=(name,x)=>{fs.mkdirSync(OUT,{recursive:true});fs.writeFileSync(path.join(OUT,name),JSON.stringify(x,null,2)+'\n');};
const zip=(name,x)=>{fs.mkdirSync(OUT,{recursive:true});fs.writeFileSync(path.join(OUT,name),zlib.gzipSync(JSON.stringify(x)));};
const read=name=>JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(OUT,name))));
const sha=()=>execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
function manifest(){
 const m=R.manifest();assert.equal(m.native,'c7b33228eec7acce9917468a1a7a6452d9938493f13d44ac8b79a1c551327210');
 assert.equal(R.CONFIG.maxLevel,10);assert.equal(R.CONFIG.maxAttempts,12);assert.equal(R.CONFIG.maxTotalAttempts,60);
 assert.equal(SEEDS.length,5);assert(!SEEDS.includes(R.SEED));
 return {...m,commit:sha(),base:BASE,seeds:SEEDS,accounts:SEEDS.length*R.IDS.length,scope:'Exploratory natural pilot, five matched starting seed blocks, E1–E10; no population balance acceptance'};
}
function account(id,index){
 const seed=SEEDS[index],p=R.profile(id),events=[];
 try{
  const a=N.simulateAccount(seed,id,{...N.DEFAULTS,...R.CONFIG},{researchProfiles:{[id]:{...p,equipmentTrace:e=>events.push(e)}},decisionModel:'adaptive',equipEarnedRunes:true,onCamp:({a})=>({legal:a.talents.valid(a.state().automaticTalents),stats:a.baseStats()})});
  assert.equal(a.startXp,0);assert(a.initialGear.items.every(x=>x.startingGear));assert(a.attempts.length<=60);
  const audit=A.audit(id,[a]),issues=[...audit.issues];
  for(const t of a.attempts)for(const message of D.compatibilityIssues(t,p))issues.push({level:t.level,attempt:t.attempt,message});
  for(const t of a.attempts){
   if(t.attempt>12)issues.push({level:t.level,message:'Attempt budget exceeded'});
   for(const r of t.rooms||[]){if(!KINDS.includes(kind(r)))issues.push({level:t.level,message:'Unknown combat room '+r.roomType});if(kind(r)==='normal'&&(!Number.isInteger(r.initialEnemies)||r.initialEnemies<1||r.initialEnemies>22))issues.push({level:t.level,message:'Unknown normal roster '+r.initialEnemies});}
  }
  return {...a,id,index,seed,issues,coverage:audit.coverage.all,events};
 }catch(e){return {id,index,seed,profile:id,endLevel:null,reached:[],stopReason:'Harness exception',attempts:[{level:null,status:'error',error:e.message,diagnostic:{stack:String(e.stack).slice(0,6000)},rooms:[]}],issues:[],events};}
}
function record(a){
 const ts=a.attempts,rs=rooms(ts);
 return {id:a.id,index:a.index,seed:a.seed,endLevel:a.endLevel,unlockedE10:a.endLevel>=10,enteredE10:ts.some(t=>t.level===10),clearedE10:a.endLevel>=11,attempts:ts.length,stopReason:a.stopReason||'cleared-horizon',xp:a.xp??null,finalGear:a.finalGear??null,gold:a.gold??null,fragments:a.fragments??null,talents:a.talents??[],errors:ts.filter(t=>t.error||t.status==='error').map(t=>({level:t.level,attempt:t.attempt,error:t.error,diagnostic:t.diagnostic})),issues:a.issues,timeouts:rs.filter(r=>r.timedOut).length,surrenders:ts.filter(t=>t.surrendered).length};
}
function category(as,level,filter){
 const per=as.map(a=>({a,rooms:rooms(a.attempts.filter(t=>t.level===level)).filter(filter)}));
 const c=D.counts(per.flatMap(x=>x.rooms)),o=D.outcomes(c);
 return {...o,contributingAccounts:per.filter(x=>D.counts(x.rooms).resolved>0).length,contributingSeedBlocks:new Set(per.filter(x=>D.counts(x.rooms).resolved>0).map(x=>x.a.index)).size};
}
function progression(as){
 return Array.from({length:10},(_,i)=>{
  const level=i+1,ts=as.flatMap(a=>a.attempts.filter(t=>t.level===level)),rs=rooms(ts);
  const byType=Object.fromEntries(KINDS.map(k=>[k,category(as,level,r=>kind(r)===k)]));
  const owned=count(ts.flatMap(t=>[...new Set(t.before?.talentNodes||[])]),x=>x);
  const passive={},abilityMetrics={};for(const r of rs)for(const [dest,src] of [[passive,r.passiveActivations],[abilityMetrics,r.abilityMetrics]])for(const [k,v] of Object.entries(src||{}))if(Number.isFinite(v))dest[k]=(dest[k]||0)+v;
  const gear=slot=>ts.map(t=>t.before?.gear?.items?.find(x=>x.slot===slot)).filter(Boolean);
  return {level,unlocked:as.filter(a=>a.endLevel>=level).length,entered:as.filter(a=>a.attempts.some(t=>t.level===level)).length,cleared:as.filter(a=>a.endLevel>level).length,attempts:ts.length,bossWins:ts.filter(t=>t.bossWon).length,deaths:ts.filter(t=>t.status==='defeat'&&!t.surrendered).length,surrenders:ts.filter(t=>t.surrendered).length,extractions:ts.filter(t=>t.status==='extracted').length,errors:ts.filter(t=>t.error||t.status==='error').length,byType,
   normalBySize:Object.fromEntries([1,4,8,12,16,22].map((n,j,ns)=>[n,category(as,level,r=>kind(r)==='normal'&&r.initialEnemies>(ns[j-1]||0)&&r.initialEnemies<=n)])),
   elites:Object.fromEntries([...new Set(rs.filter(r=>kind(r)==='elite').map(r=>r.eliteType))].map(k=>[k,category(as,level,r=>kind(r)==='elite'&&r.eliteType===k)])),
   bosses:Object.fromEntries([...new Set(rs.filter(r=>kind(r)==='boss').map(r=>r.bossStyle))].map(k=>[k,category(as,level,r=>kind(r)==='boss'&&r.bossStyle===k)])),
   identity:{weapon:count(gear('weapon'),x=>x.subtype),offhand:count(gear('offhand'),x=>x.subtype),armor:count(gear('armor'),x=>x.armorType),owned,passive,abilityMetrics,unspentPoints:sum(ts,t=>Math.max(0,(t.before?.earned||0)-(t.before?.spent||0))),manaSpent:sum(rs,r=>Number(r.manaSpent)||0),fundedCasts:sum(rs,r=>Number(r.fundedCasts)||0),unfundedCasterAttacks:sum(rs,r=>Number(r.unfundedCasterAttacks)||0)},
   economy:{merchantPurchases:count(ts.flatMap(t=>t.camp?.bought||[]),x=>x.slot),forgeCrafts:count(ts.flatMap(t=>t.camp?.crafted||[]),x=>x.recipe),potionCrafts:count(ts.flatMap(t=>t.camp?.potions||[]).filter(x=>x.action==='craft'),x=>x.kind),potionPurchases:count(ts.flatMap(t=>t.camp?.potions||[]).filter(x=>x.action==='buy'),x=>x.kind),potionUse:count(ts.flatMap(t=>t.potions||[]),x=>x.kind),runeEquips:count(ts.flatMap(t=>t.camp?.runes||[]).filter(x=>x.action==='equip'),x=>x.family),boons:count(ts.flatMap(t=>t.boons||[]),x=>x.id),contractsPaid:ts.filter(t=>t.contractPaid).length,refines:ts.flatMap(t=>t.camp?.refined||[]).length}};
 });
}
function shard(index){
 const id=R.IDS[index];assert(id);const m=manifest(),accounts=SEEDS.map((_,i)=>account(id,i));
 zip('profile-'+index+'.json.gz',{manifest:m,index,id,accounts});
 console.log('B83_SHARD='+JSON.stringify({id,accounts:accounts.map(a=>{const r=record(a);return {seed:r.seed,endLevel:r.endLevel,attempts:r.attempts,errors:r.errors.map(e=>e.error),issues:r.issues.length,timeouts:r.timeouts};})}));
}
function aggregate(){
 const m=manifest(),as=[],missing=[],invalid=[];
 for(const [i,id] of R.IDS.entries()){
  try{const x=read('profile-'+i+'.json.gz');assert.deepEqual(x.manifest,m);assert.equal(x.id,id);assert.equal(x.index,i);assert.equal(x.accounts.length,SEEDS.length);for(const [j,a] of x.accounts.entries()){assert.equal(a.id,id);assert.equal(a.index,j);assert.equal(a.seed,SEEDS[j]);}as.push(...x.accounts);}
  catch(e){(e.code==='ENOENT'?missing:invalid).push({id,index:i,error:e.message});}
 }
 const records=as.map(record),levels=progression(as);
 const coverage={accounts:records.length,expectedAccounts:m.accounts,unlockedE10:records.filter(r=>r.unlockedE10).length,enteredE10:records.filter(r=>r.enteredE10).length,clearedE10:records.filter(r=>r.clearedE10).length,attempts:sum(records,r=>r.attempts),fights:rooms(as.flatMap(a=>a.attempts)).length,accountsWithErrors:records.filter(r=>r.errors.length).length,errors:sum(records,r=>r.errors.length),issues:sum(records,r=>r.issues.length),timeouts:sum(records,r=>r.timeouts),surrenders:sum(records,r=>r.surrenders)};
 const profiles=R.IDS.map(id=>{const accounts=as.filter(a=>a.id===id),recs=records.filter(r=>r.id===id),progress=progression(accounts);return {id,accounts:accounts.length,unlockedE10:recs.filter(r=>r.unlockedE10).length,enteredE10:recs.filter(r=>r.enteredE10).length,clearedE10:recs.filter(r=>r.clearedE10).length,errors:sum(recs,r=>r.errors.length),issues:sum(recs,r=>r.issues.length),timeouts:sum(recs,r=>r.timeouts),stopReasons:count(recs,r=>r.stopReason),progression:progress,coverage:accounts.map(a=>({seed:a.seed,coverage:a.coverage||null}))};});
 const naturalBalance=Object.fromEntries(KINDS.map(k=>{const v=levels[9].byType[k];return [k,{...v,balance:Balance.classify(k,v.winPct,v.resolved)}];}));
 const clean=coverage.accounts===m.accounts&&!missing.length&&!invalid.length&&!coverage.errors&&!coverage.issues&&!coverage.timeouts;
 const result={manifest:m,coverage,clean,qualityGate:clean?'TECHNICAL PASS — exploratory only':'FAIL — incomplete or unresolved evidence',naturalBalance,levels,profiles,accounts:records,missing,invalid,limitations:['Only five independent shared seed blocks; descriptive pilot, no reliable population confidence interval or balance acceptance.','E10 fight rates conditional on reaching E10 and chosen encounters; reach and clear separately measured.','Timeouts remain unresolved, deaths and surrenders are resolved losses. Unknown outcomes are audited.','Native room initialEnemies is total roster, not simultaneous visible actors.','No forced gear, talent, resources or encounters. No claim of human representativeness.']};
 write('summary.json',result);
 for(const p of profiles)console.log('B83_PROFILE='+JSON.stringify({id:p.id,accounts:p.accounts,unlockedE10:p.unlockedE10,enteredE10:p.enteredE10,clearedE10:p.clearedE10,errors:p.errors,issues:p.issues,timeouts:p.timeouts,stopReasons:p.stopReasons,e10:p.progression[9].byType,progression:p.progression.map(l=>({E:l.level,entered:l.entered,cleared:l.cleared,attempts:l.attempts}))}));
 console.log('B83_OVERVIEW='+JSON.stringify({coverage,clean,naturalBalance,levels:levels.map(l=>({E:l.level,unlocked:l.unlocked,entered:l.entered,cleared:l.cleared,attempts:l.attempts,byType:l.byType})),missing,invalid}));
 if(!clean)process.exitCode=1;
}
module.exports={SEEDS,manifest,record,category,progression};
if(require.main===module){const [cmd,i]=process.argv.slice(2);if(cmd==='plan'){const m=manifest();write('manifest.json',m);console.log('B83_PLAN='+JSON.stringify({profiles:R.IDS.length,seeds:SEEDS,accounts:m.accounts,policy:m.policy}));}else if(cmd==='shard')shard(Number(i));else if(cmd==='aggregate')aggregate();else throw Error('Unknown command');}
