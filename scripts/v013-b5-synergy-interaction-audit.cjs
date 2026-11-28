'use strict';
// B5: matched native equal-cost synergy audit and Red Guillotine candidate confirmation. No combat/agent overrides.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),assert=require('node:assert/strict'),Module=require('node:module'),{execFileSync}=require('node:child_process');
const ROOT=path.resolve(__dirname,'..'),OLD='f598fdb8056be59291b23baa36728c8865addfdc',FROZEN=OLD,OUT=path.join(ROOT,'reports/b5'),SEEDS=50;
const sha=x=>crypto.createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');
const git=(root,...args)=>execFileSync('git',['-C',root,...args],{encoding:'utf8'}).trim();
const SC=[{id:'solo',kind:'normal',size:1},{id:'group12',kind:'normal',size:12},{id:'elite',kind:'elite',elite:'tank'},{id:'boss',kind:'boss'}];
const FAMILIES=['blood','fury','radiance','aegis','arcane','decay'];
const {plan}=require('./v013-b5-synergy-plan.cjs');
function replaceOnce(s,a,b){assert.equal(s.split(a).length,2,'Instrumentation anchor '+a);return s.replace(a,b);}
function compile(file,source){const m=new Module(file,module);m.filename=file;m.paths=Module._nodeModulePaths(path.dirname(file));m._compile(source,file);return m.exports;}
function frozen(){
 const changed=git(ROOT,'diff','--name-only',FROZEN,'HEAD','--','combat','online','economy','index.html','docs','scripts/simulate-progression.cjs','scripts/v013-agent-strategy.cjs','scripts/v013-natural-progression.cjs','scripts/v013-b32c-equipment-policy.cjs','scripts/v013-b32d7-combat-aware-policy.cjs','tests/v012-economy-harness.cjs','tests/v013-current-talent-helper.cjs','scripts/v013-b4-individual-ability-audit.cjs','scripts/v013-b42-ability-rework-validation.cjs','scripts/v013-b43-targeted-ability-corrections.cjs').split('\n').filter(Boolean).sort();
 const expected=['combat/v012-buildcraft.js','combat/talent-catalog.js'].flatMap(x=>[x,'docs/'+x]).sort();
 assert.deepEqual(changed,expected,'Unexpected gameplay/agent drift');
 for(const f of expected.filter(x=>!x.startsWith('docs/'))){
  const before=git(ROOT,'show',FROZEN+':'+f),after=fs.readFileSync(path.join(ROOT,f),'utf8').trim();
  const a=f.includes('buildcraft')?'Math.min(.80,.08*stacks)':'8% pre-critical base hit damage per active Bleed stack';
  const b=f.includes('buildcraft')?'Math.min(.80,.16*stacks)':'16% pre-critical base hit damage per active Bleed stack';
  assert.equal(after,replaceOnce(before,a,b),'Unexpected runtime diff '+f);
  assert.equal(fs.readFileSync(path.join(ROOT,f),'utf8'),fs.readFileSync(path.join(ROOT,'docs',f),'utf8'));
 }
}
// Instrument only the simulator observation loop; native game modules remain byte-identical.
// Count direct enemy attack resolutions using the runtime's fresh lastImpact object (includes parry/dodge).
function observedSimulator(root){
 const file=path.join(root,'scripts/simulate-progression.cjs');let src=fs.readFileSync(file,'utf8');
 src=replaceOnce(src,'let firstKillSeconds=null;let ticks=0','let observed={enemyAttacks:0,actorSeconds:0,chilledActorSeconds:0,frozenActorSeconds:0,rotSixActorSeconds:0,peakBarrier:Number(r.barrier)||0,peakPools:{}};let firstKillSeconds=null;let ticks=0');
 src=replaceOnce(src,'  a.tick();ticks++;',String.raw`  const priorImpact=r.lastImpact,clock=(Number(r.phase1ClockBase)||0)+beforeTime;
  const states=activeBefore.map(e=>({chilled:e.slowTime>0,frozen:!e.boss&&e.frostFrozenUntil>clock,rotSix:(e.v012Rot?.length||0)>=6}));
  a.tick();ticks++;
  if(r.lastImpact&&r.lastImpact!==priorImpact)observed.enemyAttacks++;
  const observedDt=Math.max(0,(r.combatSeconds||0)-beforeTime);
  observed.actorSeconds+=states.length*observedDt;
  for(const z of states){if(z.chilled)observed.chilledActorSeconds+=observedDt;if(z.frozen)observed.frozenActorSeconds+=observedDt;if(z.rotSix)observed.rotSixActorSeconds+=observedDt;}
  observed.peakBarrier=Math.max(observed.peakBarrier,Number(r.barrier)||0);
  for(const [k,v] of Object.entries(r.barrierPools||{}))observed.peakPools[k]=Math.max(observed.peakPools[k]||0,Number(v)||0);`);
 src=replaceOnce(src,' row.pierced=Math.round(metrics.pierced||0);',String.raw` row.pierced=Math.round(metrics.pierced||0);
 row.b42Observation={...observed,nativeMetrics:Object.fromEntries(Object.entries(metrics).filter(([k,v])=>Number.isFinite(v))),procs:{...(metrics.procs||{})}};`);
 return {S:compile(file,src),observer:sha(src)};
}
function worker(root,input,output){
 const {case:c,scenarios,count,arm,revision}=JSON.parse(fs.readFileSync(input,'utf8'));process.chdir(root);
 assert.equal(git(root,'rev-parse','HEAD'),revision);const {S,observer}=observedSimulator(root),T=globalThis.WandererAutomaticTalents,t=c[arm];
 assert(T.valid(t),'Invalid legal talent state in '+revision+' '+c.key+'/'+arm);
 const nativeSha=sha(fs.readFileSync(path.join(root,'combat/v012-combat-runtime.js'),'utf8')),rows=[];
 for(const sc of scenarios)for(let i=0;i<count;i++){
  const seed=125000057+i*157,family=FAMILIES[(i+SC.findIndex(s=>s.id===sc.id))%6];let native=null;
  const build={id:'b5-'+c.key,weapon:c.weapon,families:c.families,skills:[],...(c.mode==='arcane'?{}:{element:c.mode})};
  const opts={mode:'encounter',points:30,gear:'current',rarity:'Rare',runes:false,contracts:'none',targetPolicy:'mechanics',measure:true,tickLimit:13000,lockScenarioStreams:true,controlledTalents:t,armorType:c.armor,offhandType:c.offhand,stageB31ALoadout:c.weapon,stageB31EquipmentAudit:true,recordModules:es=>{native=es.find(e=>e.file==='combat/v012-combat-runtime.js');},...(sc.elite?{stage619EliteType:sc.elite}:{})};
  const x=S.encounter(10,build,seed,sc.kind,opts,undefined,undefined,family,1,sc.size);
  assert(native&&!native.overridden&&native.sha256===nativeSha,'Runtime mismatch');
  assert.equal(x.level,10);assert.equal(x.affinity,family);assert.equal(x.pointsSpent,t.nodes.length);assert.equal(x.talentXp,t.xp);assert.deepEqual(x.controlledTalentNodes,t.nodes);
  assert.equal(x.weaponType,c.weapon);assert.equal(x.offhandType,c.offhand);assert.equal(x.armorType,c.armor);assert.equal(Number(x.won)+Number(x.died)+Number(x.timedOut),1);
  if(sc.elite)assert.equal(x.eliteType,sc.elite);if(sc.kind==='boss')assert.equal(x.bossAffinity,family);if(sc.size)assert.equal(x.requestedGroupSize,sc.size);
  const gear=sha(Object.keys(x.equipmentAudit).sort().map(k=>{const it=x.equipmentAudit[k];if(!it)return[k,null];const {id,...rest}=it;return[k,rest];}));
  const scenario=sha([x.resolvedSeed,x.affinity,x.risk,x.roster,x.initialRoles,x.traitId,x.conditionId,x.conditionMarked,x.bossModifierIds,x.eliteType,x.bossId]);
  const m=x.affinityMetrics||{},o=x.b42Observation;assert(o&&Number.isFinite(o.enemyAttacks),'Missing observer');
  rows.push({sc:sc.id,trial:i,seed,gear,scenario,won:x.won,timeout:x.timedOut,seconds:x.seconds,damage:x.damageDealt,taken:x.damageTaken,hp:x.hpEnd,maxHp:x.hpMax,mp:x.mpEnd,maxMp:x.mpMax,healing:m.healingActual,barrierEntry:m.barrierAtEntry,barrierGenerated:m.barrierGenerated,absorbed:x.absorbed,starved:m.manaStarvedSeconds,paid:x.manaSpent,funded:x.fundedCasts,unfunded:x.unfundedCasterAttacks,dot:m.dotDamageActual,aoe:x.secondaryTargetDamage,firstKill:x.firstKillSeconds,stats:x.heroBaseStats,active:m.passiveActivations,observation:o});
 }
 fs.writeFileSync(output,JSON.stringify({revision,nativeSha,observer,rows}));
}
function runCase(c,scenarios,count){
 const oldRoot=process.env.B5_BASELINE_DIR;assert(oldRoot,'B5_BASELINE_DIR required');assert.equal(git(oldRoot,'rev-parse','HEAD'),OLD);
 const current=git(ROOT,'rev-parse','HEAD'),dir=fs.mkdtempSync(path.join(os.tmpdir(),'b5-'));const input=path.join(dir,'input.json'),output=path.join(dir,'output.json');
 const variants=[['newBefore',ROOT,current,'before'],['newAlternative',ROOT,current,'alternative'],['newExtra',ROOT,current,'extra'],['newAfter',ROOT,current,'after'],...(c.red?[['oldBefore',oldRoot,OLD,'before'],['oldAlternative',oldRoot,OLD,'alternative'],['oldExtra',oldRoot,OLD,'extra'],['oldAfter',oldRoot,OLD,'after']]:[])];
 const arms={};try{
  for(const [name,root,revision,arm] of variants){
   fs.writeFileSync(input,JSON.stringify({case:c,scenarios,count,arm,revision}));
   execFileSync(process.execPath,[__filename,'worker',root,input,output],{stdio:['ignore','inherit','inherit'],timeout:25*60*1000});
   arms[name]=JSON.parse(fs.readFileSync(output,'utf8'));assert.equal(arms[name].rows.length,scenarios.length*count);
  }
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
 const rows=arms.newBefore.rows.map((r,i)=>{
  const pair=Object.fromEntries(Object.entries(arms).map(([k,v])=>[k,v.rows[i]]));
  for(const [k,v] of Object.entries(pair)){assert.equal(v.gear,r.gear,'Gear mismatch '+c.key+'/'+k);assert.equal(v.scenario,r.scenario,'Opponent mismatch '+c.key+'/'+k);assert.equal(v.seed,r.seed);assert.equal(v.sc,r.sc);assert.equal(v.trial,r.trial);}
  return {sc:r.sc,trial:r.trial,...pair};
 });
 return {case:c,baseline:OLD,commit:current,source:Object.fromEntries(Object.entries(arms).map(([k,v])=>[k,{nativeSha:v.nativeSha,observer:v.observer}])),rows};
}
const mean=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:null;
function sumMaps(maps){const o={};for(const m of maps)for(const[k,v]of Object.entries(m||{}))if(Number.isFinite(v))o[k]=(o[k]||0)+v;return o;}
function summary(rows,arm){
 const all=rows.map(r=>r[arm]).filter(Boolean),xs=all.filter(x=>!x.timeout),avg=f=>mean(xs.map(f).filter(Number.isFinite)),per=(k,x)=>x.seconds>0?x.observation[k]/x.seconds:null;
 return {n:all.length,timeouts:all.length-xs.length,wins:xs.filter(x=>x.won).length,winPct:xs.length?100*xs.filter(x=>x.won).length/xs.length:null,dps:avg(x=>x.seconds>0?x.damage/x.seconds:0),winSeconds:mean(xs.filter(x=>x.won).map(x=>x.seconds)),hpPct:avg(x=>100*x.hp/Math.max(1,x.maxHp)),manaPct:avg(x=>x.maxMp>0?100*x.mp/x.maxMp:null),damageTaken:avg(x=>x.taken),healing:avg(x=>x.healing),barrierEntry:avg(x=>x.barrierEntry),barrierGenerated:avg(x=>x.barrierGenerated),absorbed:avg(x=>x.absorbed),peakBarrier:avg(x=>x.observation.peakBarrier),enemyAttacks:avg(x=>x.observation.enemyAttacks),enemyAttacksPerSecond:avg(x=>per('enemyAttacks',x)),chilledActorPct:avg(x=>x.observation.actorSeconds?100*x.observation.chilledActorSeconds/x.observation.actorSeconds:null),frozenActorPct:avg(x=>x.observation.actorSeconds?100*x.observation.frozenActorSeconds/x.observation.actorSeconds:null),rotSixActorPct:avg(x=>x.observation.actorSeconds?100*x.observation.rotSixActorSeconds/x.observation.actorSeconds:null),dot:avg(x=>x.dot),aoe:avg(x=>x.aoe),paid:avg(x=>x.paid),funded:avg(x=>x.funded),unfunded:avg(x=>x.unfunded),starved:avg(x=>x.starved),firstKill:avg(x=>x.firstKill),activations:sumMaps(xs.map(x=>x.active)),entryStats:Object.fromEntries(['attack','defense','maxhp','spellPower','attacksPerSec','crit','blockChance','mana','manaRegen','barrierPower'].map(k=>[k,avg(x=>x.stats?.[k])])),nativeMetrics:sumMaps(xs.map(x=>x.observation.nativeMetrics)),procs:sumMaps(xs.map(x=>x.observation.procs))};
}
function pair(rows,a,b){
 const valid=rows.filter(r=>r[a]&&r[b]&&!r[a].timeout&&!r[b].timeout),d=valid.map(r=>Number(r[b].won)-Number(r[a].won)),n=d.length,m=mean(d),se=n>1?Math.sqrt(d.reduce((s,x)=>s+(x-m)**2,0)/(n-1)/n):null;
 return {n,unresolved:rows.length-n,gains:d.filter(x=>x===1).length,losses:d.filter(x=>x===-1).length,deltaPP:n?100*m:null,approx95CI:se===null?null:[Math.max(-100,100*(m-1.96*se)),Math.min(100,100*(m+1.96*se))]};
}
function brief(x,rs){
 const keys=['newBefore','newAlternative','newExtra','newAfter',...(x.case.red?['oldBefore','oldAlternative','oldExtra','oldAfter']:[])];
 const arms=Object.fromEntries(keys.map(k=>[k,summary(rs,k)]));
 const factorial=Object.fromEntries((x.case.red?['old','new']:['new']).map(p=>{const [n,a,b,ab]=['Before','Alternative','Extra','After'].map(k=>p+k);
  const complete=rs.filter(r=>[n,a,b,ab].every(k=>r[k]&&!r[k].timeout));
  const delta=f=>{
   const values=complete.map(r=>f(r[ab])-f(r[a])-f(r[b])+f(r[n])),m=mean(values),samples=values.length,se=samples>1?Math.sqrt(values.reduce((s,v)=>s+(v-m)**2,0)/(samples-1)/samples):null;
   return {mean:m,approx95CI:se===null?null:[m-1.96*se,m+1.96*se]};
  };
  return [p,{n:complete.length,aWithoutB:pair(rs,n,a),aWithB:pair(rs,b,ab),bWithoutA:pair(rs,n,b),bWithA:pair(rs,a,ab),winInteractionPP:delta(z=>100*Number(z.won)),dpsInteraction:delta(z=>z.damage/Math.max(.001,z.seconds)),hpInteractionPP:delta(z=>100*z.hp/Math.max(1,z.maxHp)),manaSpentInteraction:delta(z=>z.paid||0),barrierAbsorbedInteraction:delta(z=>z.absorbed||0)}];
 }));
 return {arms,versionDelta:x.case.red?pair(rs,'oldAfter','newAfter'):null,redCandidate:x.case.red?{lowCrit:pair(rs,'oldExtra','newExtra'),highCrit:pair(rs,'oldAfter','newAfter'),unpreparedLow:pair(rs,'oldBefore','newBefore'),unpreparedHigh:pair(rs,'oldAlternative','newAlternative')}:null,factorial};
}
function write(name,x){fs.mkdirSync(OUT,{recursive:true});fs.writeFileSync(path.join(OUT,name+'.json'),JSON.stringify(x));}
function aggregate(){
 const cs=plan(),commit=git(ROOT,'rev-parse','HEAD'),results=cs.map(c=>JSON.parse(fs.readFileSync(path.join(OUT,c.key+'.json'),'utf8')));
 for(let i=0;i<results.length;i++){const r=results[i];assert.deepEqual(r.case,cs[i]);assert.equal(r.commit,commit);assert.equal(r.baseline,OLD);assert.equal(r.rows.length,SEEDS*SC.length);assert.equal(new Set(r.rows.map(x=>x.sc+'/'+x.trial)).size,r.rows.length);}
 const rows=results.flatMap(r=>r.rows),armKeys=['oldBefore','oldAfter','newBefore','newAfter','newAlternative','oldAlternative','oldExtra','newExtra'],fights=rows.reduce((s,r)=>s+armKeys.filter(k=>r[k]).length,0),timeouts=rows.reduce((s,r)=>s+armKeys.filter(k=>r[k]?.timeout).length,0);
 const report={baseline:OLD,candidate:commit,harness:commit,scope:'Controlled E10, 30 legal points, Rare, fixed mechanics target policy, independent paired seeds. Each 2x2 compares equal-cost talent choices with shared prerequisites and explicit stat alternatives, not pure mechanical effects. Each build has its own kit; no pooled natural rates. Red Guillotine only compares old and new revisions across four cells. Approximate exploratory paired intervals are not multiple-testing adjusted. Full raw telemetry and timeouts retained.',seeds:SEEDS,cases:cs.length,pairs:rows.length,fights,timeouts,results:results.map(x=>({case:x.case,source:x.source,...brief(x,x.rows),scenarios:SC.map(sc=>({id:sc.id,...brief(x,x.rows.filter(r=>r.sc===sc.id))}))}))};
 write('summary',report);console.log('B5_OVERVIEW='+JSON.stringify({...report,results:undefined}));for(const x of report.results)console.log('B5_CASE='+JSON.stringify({key:x.case.key,factorial:x.factorial.new,redCandidate:x.redCandidate,arms:Object.fromEntries(Object.entries(x.arms).map(([k,a])=>[k,{wins:a.wins,dps:a.dps,hp:a.hpPct}]))}));
 if(timeouts)process.exitCode=1;
}
const [cmd,a,b,c]=process.argv.slice(2);
if(cmd==='worker')worker(a,b,c);else{
 frozen();
 if(cmd==='plan'){const cs=plan();write('plan',cs);console.log('B5_PLAN='+JSON.stringify(cs.map(x=>({key:x.key,kit:[x.weapon,x.offhand,x.armor],rank:x.rank,points:[x.before.nodes.length,x.after.nodes.length],alternative:x.alternativeId}))));}
 else if(cmd==='smoke'){const cs=plan(),results=cs.map(x=>runCase(x,[SC[1]],1));write('smoke',results);const timeouts=results.flatMap(x=>x.rows).reduce((s,r)=>s+['oldBefore','oldAfter','newBefore','newAfter','newAlternative','oldAlternative','oldExtra','newExtra'].filter(k=>r[k]?.timeout).length,0);assert.equal(timeouts,0);console.log('B5_SMOKE='+results.length);}
 else if(cmd==='run'){const selected=plan().find(x=>x.key===a);assert(selected,'Unknown case '+a);const r=runCase(selected,SC,SEEDS);write(a,r);console.log('B5_SHARD='+JSON.stringify({key:a,rows:r.rows.length}));}
 else if(cmd==='aggregate')aggregate();else throw Error('Unknown command');
}
