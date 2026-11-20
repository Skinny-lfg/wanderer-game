'use strict';
// Audit actual E1→E20 natural accounts, not staged battles. An Expedition
// never entered is censored, not a zero-percent success rate.
const fs=require('node:fs'),path=require('node:path');
const C=require('./v013-stage02-run-cohort.cjs');
const expected=C.SEEDS.flatMap(seed=>Object.keys(C.GROUPS).map(group=>seed+'-'+group));
const sum=(xs,fn=x=>x)=>xs.reduce((n,x)=>n+(Number(fn(x))||0),0);
const round=x=>Number.isFinite(x)?Math.round(x*100)/100:null;
const median=xs=>xs.length?round((a=>a.length%2?a[(a.length-1)/2]:(a[a.length/2-1]+a[a.length/2])/2)([...xs].sort((a,b)=>a-b))):null;
const p90=xs=>xs.length?[...xs].sort((a,b)=>a-b)[Math.ceil(xs.length*.9)-1]:null;
const freq=xs=>Object.fromEntries([...new Set(xs)].sort().map(k=>[k,xs.filter(x=>x===k).length]));
function assert(ok,msg){if(!ok)throw Error('Stage02 integrity: '+msg);}
function validateCohort(data,seed,group){
 const id=seed+'-'+group,profiles=C.GROUPS[group];
 assert(profiles&&C.SEEDS.includes(seed),'unknown cohort '+id);
 assert(data.stage02?.cohort===id,'cohort label '+id);
 assert(data.settings?.maxLevel===20&&data.settings?.maxAttempts===18&&
  data.settings?.maxTotalAttempts===360&&data.settings?.decisionModel==='adaptive',
  'incorrect 20/18/360/adaptive policy '+id);
 assert(data.settings.seeds.length===1&&data.settings.seeds[0]===seed,'seed config '+id);
 assert(data.accounts?.length===5&&data.coverage?.accounts===5,'five accounts required '+id);
 assert(data.integrity?.noFabricatedXp&&data.integrity?.noForcedEquipment&&
  data.integrity?.noForcedLevelUnlock&&data.integrity?.noForcedEncounter&&
  data.integrity?.noDamageOverride,'native integrity fields '+id);
 assert(new Set(data.accounts.map(a=>a.profile)).size===5&&
  profiles.every(p=>data.accounts.some(a=>a.profile===p)),'profile mismatch '+id);
 assert(sum(data.accounts,a=>a.attempts?.length)===data.coverage?.attempts,'coverage attempts '+id);
 for(const a of data.accounts){
  const label=id+'/'+a.profile,bought=new Set(),byLevel=new Map();
  assert(a.seed===seed&&profiles.includes(a.profile),'account identity '+label);
  assert(a.startXp===0,'synthetic starting XP '+label);
  assert(a.initialGear?.total>0&&a.initialGear.total===a.initialGear.starter,
   'nonstarter original gear '+label);
  assert(a.attempts?.length>0&&a.attempts.length<=360,'account attempt count '+label);
  assert(a.reached?.[0]===1&&a.reached.every((E,i)=>E===i+1&&E<=20),
   'sequential native levels '+label);
  for(const t of a.attempts){
   assert(t.level>=1&&t.level<=20&&Number.isInteger(t.level),'level '+label);
   assert(t.attempt===(byLevel.get(t.level)||0)+1&&t.attempt<=18,
    'nonsequential or excessive attempts '+label+' E'+t.level);
   byLevel.set(t.level,t.attempt);
   assert(a.reached.includes(t.level),'attempted locked level '+label);
   assert(t.level===1||bought.has(t.level-1),'skipped Boss unlock '+label);
   assert(!bought.has(t.level),'repeated attempt after Boss defeated '+label);
   if(t.bossWon){
    assert(t.status==='victory'&&t.after?.unlocked>=t.level+1,
     'unverified native victory '+label+' E'+t.level);
    bought.add(t.level);
   }else assert(t.status!=='victory','unrecognized Boss victory '+label);
   if(t.before&&t.after)assert(t.after.xp>=t.before.xp,'XP decreased '+label);
  }
  assert(a.endLevel===Math.max(0,...bought)+1,'endLevel did not follow native wins '+label);
  assert(a.reached.length===Math.min(20,a.endLevel),'reached ledger mismatch '+label);
 }
 return true;
}
function stopClass(a){
 if(a.attempts.some(t=>t.error||t.status==='error'))return 'technical_error';
 if(a.attempts.some(t=>t.level===20&&t.bossWon))return 'completed_E20';
 if(a.stopReason?.startsWith('Total natural-attempt budget'))return 'total_budget_censored';
 if(/unbeaten after \d+ native attempts/.test(a.stopReason||''))return 'attempt_limit_E';
 if(a.stopReason?.includes('limitation'))return 'simulator_limitation';
 return 'other';
}
function accountRow(a){
 const ts=a.attempts;
 const byE=Array.from({length:20},(_,i)=>{
  const E=i+1,t=ts.filter(t=>t.level===E),win=t.find(x=>x.bossWon);
  const entered=a.reached.includes(E);
  return {E,entered,attempts:t.length,cleared:!!win,
   triesToClear:win?win.attempt:null,
   outcome:!entered?'not_reached':win?'cleared':
    t.some(x=>x.error||x.status==='error')?'technical_error':
    stopClass(a)==='total_budget_censored'?'total_budget_censored':'attempt_limit_or_other'};
 });
 const milestones=Object.fromEntries([5,10,15,20].map(E=>{
  const reached=a.reached.includes(E),cleared=byE[E-1].cleared;
  return ['E'+E,{reached,cleared,
   triesToReach:reached?ts.filter(t=>t.level<E).length:null,
   triesToClear:cleared?ts.filter(t=>t.level<=E).length:null}];
 }));
 return {seed:a.seed,profile:a.profile,highestReached:Math.max(...a.reached),
  highestCleared:Math.min(20,a.endLevel-1),unlocked:a.endLevel,
  totalAttempts:ts.length,stopClass:stopClass(a),stopReason:a.stopReason||null,
  finalXp:a.xp,finalNodes:a.talents?.length||0,
  finalGear:a.finalGear,finalGold:a.gold,finalFragments:a.fragments,
  talentResets:sum(ts,t=>t.camp?.resets?.length),
  changesOfStyle:sum(ts,t=>t.camp?.resets?.length),
  pivoted:ts.some(t=>t.before?.strategy?.endsWith('-pivot')),
  potionsUsed:sum(ts,t=>t.potions?.length),crafts:sum(ts,t=>t.camp?.crafted?.length),
  deaths:ts.filter(t=>t.status==='defeat').length,
  extractions:ts.filter(t=>t.status==='extracted').length,
  bossFights:sum(ts,t=>(t.rooms||[]).filter(r=>r.roomType==='boss').length),
  milestones,perExpedition:byE,
  errors:ts.filter(t=>t.error||t.status==='error').map(t=>({
   E:t.level,attempt:t.attempt,error:t.error,diagnostic:t.diagnostic||null
  }))};
}
function audit(shards,options={}){
 const seeds=options.seeds||C.SEEDS,groups=options.groups||Object.keys(C.GROUPS);
 const scheduled=seeds.flatMap(seed=>groups.map(group=>seed+'-'+group));
 assert(shards.length===scheduled.length,
  'expected '+scheduled.length+' shards, received '+shards.length);
 const seen=new Set(),refs=new Set(),runners=new Set(),strategies=new Set(),accounts=[];
 for(const d of shards){
  const {seed,group}=d.stage02||{},key=seed+'-'+group;
  assert(scheduled.includes(key)&&!seen.has(key),'duplicate/unscheduled '+key);
  validateCohort(d,seed,group);seen.add(key);
  refs.add(d.source);runners.add(d.runnerSha256);strategies.add(d.agentStrategySha256);
  accounts.push(...d.accounts);
 }
 assert(refs.size===1&&runners.size===1&&strategies.size===1,'mixed source fingerprints');
 assert(accounts.length===seeds.length*groups.length*5,'missing native accounts');
 assert(new Set(accounts.map(a=>a.seed+'/'+a.profile)).size===accounts.length,'duplicate native account');
 const rows=accounts.map(accountRow),allAttempts=accounts.flatMap(a=>a.attempts);
 const issues=rows.flatMap(a=>a.errors);
 const perE=Array.from({length:20},(_,i)=>{
  const E=i+1,entered=rows.filter(a=>a.perExpedition[i].entered);
  const cleared=entered.filter(a=>a.perExpedition[i].cleared);
  const tries=cleared.map(a=>a.perExpedition[i].triesToClear);
  const attempts=allAttempts.filter(t=>t.level===E);
  return {E,entered:entered.length,notReached:rows.length-entered.length,
   clears:cleared.length,conditionalClearPct:entered.length?round(100*cleared.length/entered.length):null,
   attempts:attempts.length,deaths:attempts.filter(t=>t.status==='defeat').length,
   extractions:attempts.filter(t=>t.status==='extracted').length,
   errors:attempts.filter(t=>t.error||t.status==='error').length,
   bossReached:attempts.filter(t=>t.bossReached).length,
   meanTriesToClear:tries.length?round(sum(tries)/tries.length):null,
   medianTriesToClear:median(tries),p90TriesToClear:p90(tries),
   stoppedHere:entered.filter(a=>a.stopClass==='attempt_limit_E'&&a.highestReached===E).length,
   totalBudgetCensoredHere:entered.filter(a=>a.stopClass==='total_budget_censored'&&a.highestReached===E).length,
   status:entered.length?'observed':'not_reached'};
 });
 const milestones=Object.fromEntries([5,10,15,20].map(E=>{
  const values=rows.map(a=>a.milestones['E'+E]),
   reached=values.filter(m=>m.reached),cleared=values.filter(m=>m.cleared);
  return ['E'+E,{reached:reached.length,cleared:cleared.length,
   medianTriesToReach:median(reached.map(m=>m.triesToReach)),
   p90TriesToReach:p90(reached.map(m=>m.triesToReach)),
   medianTriesToClear:median(cleared.map(m=>m.triesToClear)),
   p90TriesToClear:p90(cleared.map(m=>m.triesToClear))}];
 }));
 const profiles=Object.fromEntries([...new Set(rows.map(r=>r.profile))].sort().map(profile=>{
  const arr=rows.filter(r=>r.profile===profile);
  return [profile,{accounts:arr.length,
   highestReached:Math.max(...arr.map(a=>a.highestReached)),
   entered:Object.fromEntries([5,10,15,20].map(E=>['E'+E,
    arr.filter(a=>a.milestones['E'+E].reached).length])),
   cleared:Object.fromEntries([1,5,10,15,20].map(E=>['E'+E,
    arr.filter(a=>a.perExpedition[E-1].cleared).length])),
   medianTotalAttempts:median(arr.map(a=>a.totalAttempts)),
   attempts:sum(arr,a=>a.totalAttempts),stops:freq(arr.map(a=>a.stopClass)),
   resets:sum(arr,a=>a.talentResets),crafts:sum(arr,a=>a.crafts)}];
 }));
 const result={stage:'Stage 02 / 50 native accounts from E1 toward E20',
  provenance:{engineSource:[...refs][0],runnerSha256:[...runners][0],
   agentStrategySha256:[...strategies][0],seeds,groups,shards:scheduled,
   attemptsPerLevel:18,totalAttemptsCap:360,policy:'adaptive'},
  coverage:{accounts:rows.length,shards:shards.length,attempts:allAttempts.length,
   errors:issues.length,highestReached:Math.max(...rows.map(a=>a.highestReached)),
   highestCleared:Math.max(...rows.map(a=>a.highestCleared)),
   reachedE20:milestones.E20.reached,clearedE20:milestones.E20.cleared,
   stopClasses:freq(rows.map(a=>a.stopClass))},
  milestones,perExpedition:perE,profiles,accounts:rows,errors:issues,
  limitations:[
   'An Expedition never entered is censored, not a 0% clear rate.',
   'A level without entrants has null conditional clear rate and null attempts-to-clear distribution.',
   'Attempts-to-clear medians use successful accounts only and exclude incomplete/censored accounts.',
   'Stopping at 18 attempts or 360 total attempts is a bounded simulation outcome, not proof the build cannot win.',
   'Profiles are scripted heuristics rather than actual human-player success probabilities.',
   'No synthetic XP, equipment, unlocked levels, Boss victories or hidden-map peeking.'
  ]};
 assert(issues.length===0,'native runtime errors found: '+issues.length+' (raw shards retain diagnostic state)');
 return result;
}
function markdown(r){
 const lines=['# Wanderer v0.13 — Stage 02 native E1–E20 audit','',
  '**50 fresh accounts; actual XP, drops, talents, map choices and Boss victories.**',
  '', 'Accounts: **'+r.coverage.accounts+'** · Attempts: **'+r.coverage.attempts+
  '** · Technical errors: **'+r.coverage.errors+'**.',
  '', 'Highest E reached: **E'+r.coverage.highestReached+'**. Highest E Boss defeated: **E'+
   r.coverage.highestCleared+'**.',
  '','## Milestones',
  '| Goal | Reached | Boss defeated | Median attempts to reach | P90 to reach | Median cumulative attempts to defeat |',
  '|---|---:|---:|---:|---:|---:|',
  ...Object.entries(r.milestones).map(([k,v])=>'| '+k+' | '+v.reached+' | '+v.cleared+
   ' | '+(v.medianTriesToReach??'—')+' | '+(v.p90TriesToReach??'—')+
   ' | '+(v.medianTriesToClear??'—')+' |'),
  '','## Funnel: all Expeditions',
  '| E | Accounts entering | Cleared | Clear among entrants | Attempts | Median attempts to defeat E | P90 | Deaths | Extractions | Errors |',
  '|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|',
  ...r.perExpedition.map(x=>'| E'+x.E+' | '+x.entered+' | '+x.clears+' | '+
   (x.conditionalClearPct===null?'**not reached**':x.conditionalClearPct+'%')+
   ' | '+x.attempts+' | '+(x.medianTriesToClear??'—')+
   ' | '+(x.p90TriesToClear??'—')+' | '+x.deaths+' | '+x.extractions+' | '+x.errors+' |'),
  '','## Profiles',
  '| Profile | E1 cleared | E5 reached | E10 reached | E15 reached | E20 reached | E20 defeated | Attempts |',
  '|---|---:|---:|---:|---:|---:|---:|---:|',
  ...Object.entries(r.profiles).map(([profile,s])=>'| '+profile+
   ' | '+s.cleared.E1+' | '+s.entered.E5+' | '+s.entered.E10+' | '+s.entered.E15+
   ' | '+s.entered.E20+' | '+s.cleared.E20+' | '+s.attempts+' |'),
  '','## Per-account outcomes',
  '| Seed | Profile | Highest entered | Highest cleared | Total attempts | Exit classification |',
  '|---:|---|---:|---:|---:|---|',
  ...r.accounts.map(a=>'| '+a.seed+' | '+a.profile+' | E'+a.highestReached+' | '+
   (a.highestCleared?'E'+a.highestCleared:'none')+' | '+a.totalAttempts+' | '+a.stopClass+' |'),
  '','## Interpretation','',...r.limitations.map(x=>'- '+x),
  '','Detailed combat, loot, gear and Camp actions remain in the ten original cohort JSON artifacts.',''];
 return lines.join('\n');
}
function main(argv=process.argv.slice(2)){
 const dir=path.resolve(argv[0]||'reports/stage02');
 const dest=path.resolve(argv[1]||'reports/stage02/stage02-report.json');
 const files=fs.readdirSync(dir).filter(n=>/^raw-\d+-[AB]\.json$/.test(n)).sort();
 const shards=files.map(n=>JSON.parse(fs.readFileSync(path.join(dir,n),'utf8')));
 const data=audit(shards);
 fs.mkdirSync(path.dirname(dest),{recursive:true});
 fs.writeFileSync(dest,JSON.stringify(data,null,2)+'\n');
 fs.writeFileSync(dest.replace(/\.json$/,'.md'),markdown(data)+'\n');
 console.log('STAGE02_FINAL='+JSON.stringify({
  coverage:data.coverage,milestones:data.milestones,
  levels:data.perExpedition.map(x=>({E:x.E,entered:x.entered,clears:x.clears,
   attempts:x.attempts,medianTriesToClear:x.medianTriesToClear,errors:x.errors})),
  profiles:Object.fromEntries(Object.entries(data.profiles).map(([k,v])=>[k,{
   entered:v.entered,cleared:v.cleared,attempts:v.attempts}]))
 }));
}
if(require.main===module)main();
module.exports={expected,validateCohort,stopClass,accountRow,audit,markdown,median,p90};
