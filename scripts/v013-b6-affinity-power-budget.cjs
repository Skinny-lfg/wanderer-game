'use strict';
// B6: compare actual legal E10 build packages, not inferred natural player rates.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),assert=require('node:assert/strict'),Module=require('node:module'),{execFileSync}=require('node:child_process');
const ROOT=path.resolve(__dirname,'..'),FROZEN='7a6518e22120ba2aff61aac22f52e1d6000bdee4',ANCHOR='e2c10733794bad2bcadcc66ae6d01bd9cf68ce8c',OUT=path.join(ROOT,'reports/b6');
const sha=x=>crypto.createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');
const git=(root,...args)=>execFileSync('git',['-C',root,...args],{encoding:'utf8'}).trim();
const write=(name,x)=>{fs.mkdirSync(OUT,{recursive:true});fs.writeFileSync(path.join(OUT,name+'.json'),JSON.stringify(x));};
const read=name=>JSON.parse(fs.readFileSync(path.join(OUT,name+'.json'),'utf8'));
function replaceOnce(s,a,b){assert.equal(s.split(a).length,2,'Instrumentation anchor '+a);return s.replace(a,b);}
function compile(file,source){const m=new Module(file,module);m.filename=file;m.paths=Module._nodeModulePaths(path.dirname(file));m._compile(source,file);return m.exports;}
function frozen(){assert.equal(git(ROOT,'diff','--name-only',FROZEN,'HEAD','--','combat','online','economy','index.html','docs','scripts/simulate-progression.cjs','scripts/v013-agent-strategy.cjs','scripts/v013-natural-progression.cjs','scripts/v013-global-e10.cjs','scripts/v013-b32c-equipment-policy.cjs','scripts/v013-b32d7-combat-aware-policy.cjs','tests'),'','Unexpected gameplay/agent drift');}
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
 const {p,scenarios,count,revision,families,allSc}=JSON.parse(fs.readFileSync(input,'utf8'));
 process.chdir(root);assert.equal(git(root,'rev-parse','HEAD'),revision);
 const {S,observer}=observedSimulator(root),T=globalThis.WandererAutomaticTalents,A=require(path.join(root,'scripts/v013-agent-strategy.cjs'));
 assert(T.valid(p.t),'Invalid talent state '+revision+'/'+p.id);assert.equal(p.t.nodes.length,30);
 const required=['combat/v012-combat-runtime.js','combat/v012-buildcraft.js','combat/talent-graph-next.js','combat/talent-catalog.js'];
 const hashes=Object.fromEntries(required.map(k=>[k,sha(fs.readFileSync(path.join(root,k),'utf8'))])),rows=[];
 for(const sc of scenarios)for(let i=0;i<count;i++){
  const seed=126000059+i*163,family=families[(i+allSc.findIndex(s=>s.id===sc.id))%6];
  let modules=null,trace=[],decision=null;
  const audit={observe(r,tick,stage){
   if(tick%250!==0)return null;
   const point=A.combatTracePoint(r,tick,stage);trace.push(point);
   if(sc.kind==='normal'&&r.status==='fight'&&r.enemy&&!r.enemy.boss&&!r.enemy.miniboss&&point.active.length===1&&!point.reserve.length)decision=A.surrenderDecision(trace);
   return decision;
  }};
  const build={id:p.id,weapon:p.weapon,families:p.families,skills:[],...(p.element?{element:p.element}:{})};
  const opts={mode:'encounter',points:30,gear:'current',rarity:'Rare',runes:false,contracts:'none',boons:'none',targetPolicy:'mechanics',measure:true,tickLimit:13000,lockScenarioStreams:true,controlledTalents:p.t,armorType:p.armorType,offhandType:p.offhandType,stageB31ALoadout:p.weapon,stageB31EquipmentAudit:true,recordModules:es=>{modules=es;},stalemateAudit:audit,...(sc.elite?{stage619EliteType:sc.elite}:{})};
  const x=S.encounter(10,build,seed,sc.kind,opts,undefined,undefined,family,1,sc.size);
  assert(modules,'No native module records');
  for(const [file,hash] of Object.entries(hashes)){const m=modules.find(e=>e.file===file);assert(m&&!m.overridden&&m.sha256===hash,'Runtime mismatch '+file);}
  assert.equal(x.level,10);assert.equal(x.affinity,family);assert.equal(x.pointsSpent,30);assert.equal(x.talentXp,p.t.xp);assert.deepEqual(x.controlledTalentNodes,p.t.nodes);
  assert.equal(x.weaponType,p.weapon);assert.equal(x.offhandType,p.offhandType);assert.equal(x.armorType,p.armorType);
  assert.equal([x.won,x.died,x.timedOut,!!x.surrendered].filter(Boolean).length,1);
  if(x.surrendered){assert.equal(x.surrenderSettlement?.outcome,'defeat');assert.equal(x.surrenderSettlement?.stage,'failed');assert.equal(x.surrenderDecision?.reason,'observed_solo_stalemate');}
  if(sc.elite)assert.equal(x.eliteType,sc.elite);if(sc.kind==='boss')assert.equal(x.bossAffinity,family);if(sc.size)assert.equal(x.requestedGroupSize,sc.size);
  const gear=sha(Object.keys(x.equipmentAudit).sort().map(k=>{const it=x.equipmentAudit[k];if(!it)return[k,null];const {id,...rest}=it;return[k,rest];}));
  const scenario=sha([x.resolvedSeed,x.affinity,x.risk,x.roster,x.initialRoles,x.traitId,x.conditionId,x.conditionMarked,x.bossModifierIds,x.eliteType,x.bossId]);
  const m=x.affinityMetrics||{},o=x.b42Observation;assert(o&&Number.isFinite(o.enemyAttacks),'Missing observer');
  rows.push({sc:sc.id,kind:sc.kind,trial:i,seed,family,gear,scenario,roster:x.roster,won:x.won,died:x.died,timeout:x.timedOut,surrendered:!!x.surrendered,seconds:x.seconds,damage:x.damageDealt,taken:x.damageTaken,hp:x.hpEnd,maxHp:x.hpMax,mp:x.mpEnd,maxMp:x.mpMax,healing:m.healingActual,barrierEntry:m.barrierAtEntry,barrierGenerated:m.barrierGenerated,absorbed:x.absorbed,starved:m.manaStarvedSeconds,paid:x.manaSpent,funded:x.fundedCasts,unfunded:x.unfundedCasterAttacks,dot:m.dotDamageActual,aoe:x.secondaryTargetDamage,firstKill:x.firstKillSeconds,stats:x.heroBaseStats,adaptiveStats:x.adaptiveStats,active:m.passiveActivations,observation:o,...(x.timedOut||x.surrendered?{trace,decision,settlement:x.surrenderSettlement||null}:{})});
 }
 fs.writeFileSync(output,JSON.stringify({revision,hashes,observer,rows}));
}
function runProfile(p,scenarios,count,allSc,families,historical){
 const current=git(ROOT,'rev-parse','HEAD'),dir=fs.mkdtempSync(path.join(os.tmpdir(),'b6-')),input=path.join(dir,'input.json'),output=path.join(dir,'output.json');
 const variants=[['current',ROOT,current]];
 if(historical){const anchorRoot=process.env.B6_ANCHOR_DIR;assert(anchorRoot,'B6_ANCHOR_DIR required');assert.equal(git(anchorRoot,'rev-parse','HEAD'),ANCHOR);variants.push(['anchor',anchorRoot,ANCHOR]);}
 const arms={};try{
  for(const [key,root,revision] of variants){
   fs.writeFileSync(input,JSON.stringify({p,scenarios,count,revision,families,allSc}));
   execFileSync(process.execPath,[__filename,'worker',root,input,output],{stdio:['ignore','inherit','inherit'],timeout:45*60*1000});
   arms[key]=JSON.parse(fs.readFileSync(output,'utf8'));assert.equal(arms[key].rows.length,scenarios.length*count);
  }
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
 if(arms.anchor)for(let i=0;i<arms.current.rows.length;i++){const a=arms.anchor.rows[i],b=arms.current.rows[i];for(const k of ['sc','trial','seed','family','gear','scenario'])assert.equal(a[k],b[k],p.id+' historical mismatch '+k);}
 return {id:p.id,p,commit:current,baseline:FROZEN,anchor:historical?ANCHOR:null,arms};
}
const mean=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:null;
function sumMaps(maps){const o={};for(const m of maps)for(const[k,v]of Object.entries(m||{}))if(Number.isFinite(v))o[k]=(o[k]||0)+v;return o;}
function summary(rows){
 const n=rows.length,xs=rows.filter(x=>!x.timeout),wins=xs.filter(x=>x.won).length,unknown=n-xs.length,avg=f=>mean(xs.map(f).filter(Number.isFinite)),per=(k,x)=>x.seconds>0&&Number.isFinite(x[k])?x[k]/x.seconds:null;
 return {n,resolved:xs.length,wins,defeats:xs.length-wins,surrenders:xs.filter(x=>x.surrendered).length,timeouts:unknown,winPct:xs.length?100*wins/xs.length:null,winBounds:n?[100*wins/n,100*(wins+unknown)/n]:null,dps:avg(x=>per('damage',x)),aoeDps:avg(x=>per('aoe',x)),dotDps:avg(x=>per('dot',x)),takenPerSecond:avg(x=>per('taken',x)),healedPerSecond:avg(x=>per('healing',x)),absorbedPerSecond:avg(x=>per('absorbed',x)),hpPct:avg(x=>100*x.hp/Math.max(1,x.maxHp)),manaPct:avg(x=>x.maxMp>0?100*x.mp/x.maxMp:null),manaSpentPerSecond:avg(x=>per('paid',x)),unfunded:avg(x=>x.unfunded),starved:avg(x=>x.starved),winSeconds:mean(xs.filter(x=>x.won).map(x=>x.seconds)),firstKill:avg(x=>x.firstKill),barrierEntry:avg(x=>x.barrierEntry),barrierGenerated:avg(x=>x.barrierGenerated),absorbed:avg(x=>x.absorbed),peakBarrier:avg(x=>x.observation.peakBarrier),enemyAttacksPerSecond:avg(x=>x.seconds>0?x.observation.enemyAttacks/x.seconds:null),frozenActorPct:avg(x=>x.observation.actorSeconds?100*x.observation.frozenActorSeconds/x.observation.actorSeconds:null),chilledActorPct:avg(x=>x.observation.actorSeconds?100*x.observation.chilledActorSeconds/x.observation.actorSeconds:null),rotSixActorPct:avg(x=>x.observation.actorSeconds?100*x.observation.rotSixActorSeconds/x.observation.actorSeconds:null),stats:Object.fromEntries(['attack','spellPower','defense','maxhp','attacksPerSec','crit','blockChance','manaRegen','barrierPower','healingPower'].map(k=>[k,avg(x=>x.stats?.[k])])),activations:sumMaps(xs.map(x=>x.active)),nativeMetrics:sumMaps(xs.map(x=>x.observation.nativeMetrics))};
}
function paired(a,b){
 assert.equal(a.length,b.length);
 const d=a.map((r,i)=>[r,b[i]]).filter(([x,y])=>!x.timeout&&!y.timeout).map(([x,y])=>100*(Number(y.won)-Number(x.won))),n=d.length,m=mean(d),se=n>1?Math.sqrt(d.reduce((s,v)=>s+(v-m)**2,0)/(n-1)/n):null;
 return {n,unresolved:a.length-n,gains:d.filter(x=>x>0).length,losses:d.filter(x=>x<0).length,deltaPP:m,approx95CI:se===null?null:[m-1.96*se,m+1.96*se]};
}
function grouped(rows,SC){return {overall:summary(rows),normal:summary(rows.filter(r=>r.kind==='normal')),elite:summary(rows.filter(r=>r.kind==='elite')),boss:summary(rows.filter(r=>r.kind==='boss')),scenarios:Object.fromEntries(SC.map(s=>[s.id,summary(rows.filter(r=>r.sc===s.id))]))};}
function equalProfile(profiles){
 const metrics=['winPct','dps','aoeDps','dotDps','takenPerSecond','healedPerSecond','absorbedPerSecond','hpPct','manaPct','manaSpentPerSecond','starved','winSeconds','enemyAttacksPerSecond'];
 return Object.fromEntries(metrics.map(k=>[k,mean(profiles.map(p=>p[k]).filter(Number.isFinite))]));
}
function aggregate(G){
 const commit=git(ROOT,'rev-parse','HEAD'),all=G.IDS.map(id=>read(id)),base=new Map(all[0].arms.current.rows.map(r=>[r.sc+'/'+r.trial,r])),gears=new Map(),profiles={},unresolved=[],historical={};
 let fights=0,anchorFights=0,gearChecks=0,encounterChecks=0;
 for(const x of all){
  const p=G.profile(x.id);assert.deepEqual(x.p,JSON.parse(JSON.stringify(p)));assert.equal(x.commit,commit);assert.equal(x.baseline,FROZEN);assert.equal(x.arms.current.revision,commit);assert.equal(x.arms.current.rows.length,G.N*G.SC.length);assert.equal(new Set(x.arms.current.rows.map(r=>r.sc+'/'+r.trial)).size,G.N*G.SC.length);
  const kit=[p.weapon,p.offhandType,p.armorType].join('/');
  for(const r of x.arms.current.rows){const key=r.sc+'/'+r.trial,b=base.get(key);assert(b);for(const k of ['scenario','seed','family'])assert.equal(r[k],b[k],x.id+' encounter '+key+' '+k);encounterChecks++;
   const gk=kit+'/'+key;if(gears.has(gk)){assert.equal(r.gear,gears.get(gk),x.id+' gear '+key);gearChecks++;}else gears.set(gk,r.gear);
   if(r.timeout)unresolved.push({id:x.id,revision:'current',...r});
  }
  fights+=x.arms.current.rows.length;profiles[x.id]={families:p.families,kit,weapon:p.weapon,role:p.role,element:p.element||null,nodes:p.t.nodes,prepared:p.t.prepared||null,...grouped(x.arms.current.rows,G.SC)};
  if(G.HISTORICAL.includes(x.id)){
   const a=x.arms.anchor;assert(a);assert.equal(a.revision,ANCHOR);assert.equal(a.rows.length,x.arms.current.rows.length);anchorFights+=a.rows.length;
   for(let i=0;i<a.rows.length;i++){const r=a.rows[i],b=x.arms.current.rows[i];for(const k of ['sc','trial','seed','family','gear','scenario'])assert.equal(r[k],b[k]);if(r.timeout)unresolved.push({id:x.id,revision:'anchor',...r});}
   historical[x.id]={before:grouped(a.rows,G.SC),after:profiles[x.id],paired:paired(a.rows,x.arms.current.rows),scenarios:Object.fromEntries(G.SC.map(s=>[s.id,paired(a.rows.filter(r=>r.sc===s.id),x.arms.current.rows.filter(r=>r.sc===s.id))]))};
  }else assert(!x.arms.anchor);
 }
 assert.equal(fights,20400);assert.equal(anchorFights,4800);assert.equal(new Set(all.map(x=>JSON.stringify(x.arms.current.hashes))).size,1);assert.equal(new Set(all.filter(x=>x.arms.anchor).map(x=>JSON.stringify(x.arms.anchor.hashes))).size,1);
 const groups={};for(const f of G.FAMILIES){const ps=Object.values(profiles).filter(p=>p.families.length===1&&p.families[0]===f);groups[f]={profiles:ps.length,...Object.fromEntries(['overall','normal','elite','boss'].map(k=>[k,equalProfile(ps.map(p=>p[k]))])),scenarios:Object.fromEntries(G.SC.map(s=>[s.id,equalProfile(ps.map(p=>p.scenarios[s.id]))]))};}
 const arcane={};for(const e of ['arcane','fire','frost','lightning']){const ps=Object.values(profiles).filter(p=>p.families.length===1&&p.families[0]==='arcane'&&p.element===e);arcane[e]={profiles:ps.length,...Object.fromEntries(['overall','normal','elite','boss'].map(k=>[k,equalProfile(ps.map(p=>p[k]))]))};}
 // Same-kit pure parents vs hybrid packages: report only when the exact kit exists.
 const hybridComparisons={};for(const [id,p] of Object.entries(profiles).filter(([id,p])=>p.families.length===2)){
  const parents=Object.entries(profiles).filter(([k,q])=>q.families.length===1&&p.families.includes(q.families[0])&&q.kit===p.kit);
  hybridComparisons[id]={kit:p.kit,parents:Object.fromEntries(parents.map(([k,q])=>[k,{winDeltaPP:p.overall.winPct-q.overall.winPct,dpsDelta:p.overall.dps-q.overall.dps,hpDeltaPP:p.overall.hpPct-q.overall.hpPct,normalDeltaPP:p.normal.winPct-q.normal.winPct,eliteDeltaPP:p.elite.winPct-q.elite.winPct,bossDeltaPP:p.boss.winPct-q.boss.winPct}]))};
 }
 const report={stage:'B6 Affinity Power Budget',commit,baseline:FROZEN,historicalAnchor:ANCHOR,scope:'Controlled E10 profile packages; 30 points and Rare native gear, 50 seeds, no runes or economy changes. Pure affinity means equally weighted within each affinity, not natural populations. Cross-kit comparisons confound equipment; same-kit parent comparisons are descriptive build choices. Boss family rotates; three elite types; group sizes 1/4/12/22. No universal power score. Surrender uses existing conservative solo-normal policy and counts defeat; unresolved timeouts retain win bounds. Historical comparison uses identical plans, gear and scenarios on pre-B4.1 engine, 12 preselected profiles; not all historical balance drift or natural population.',profilesCount:all.length,fights,anchorFights,totalFights:fights+anchorFights,encounterChecks,gearChecks,timeouts:unresolved.length,surrenders:all.reduce((s,x)=>s+Object.values(x.arms).reduce((a,y)=>a+y.rows.filter(r=>r.surrendered).length,0),0),nativeHashes:all[0].arms.current.hashes,groups,arcane,profiles,hybridComparisons,historical,unresolved};
 write('summary',report);console.log('B6_OVERVIEW='+JSON.stringify({commit,fights,anchorFights,totalFights:report.totalFights,timeouts:report.timeouts,surrenders:report.surrenders,encounterChecks,gearChecks,groups,arcane}));for(const [id,p] of Object.entries(profiles))console.log('B6_PROFILE='+JSON.stringify({id,kit:p.kit,overall:p.overall.winPct,normal:p.normal.winPct,elite:p.elite.winPct,boss:p.boss.winPct,dps:p.overall.dps,hp:p.overall.hpPct,mana:p.overall.manaPct,timeout:p.overall.timeouts}));for(const [id,p] of Object.entries(historical))console.log('B6_HISTORICAL='+JSON.stringify({id,paired:p.paired,before:p.before.overall.winPct,after:p.after.overall.winPct,beforeDps:p.before.overall.dps,afterDps:p.after.overall.dps}));
 if(unresolved.length)process.exitCode=1;
}
const [cmd,a,b]=process.argv.slice(2);
if(cmd==='worker')worker(a,process.argv[4],process.argv[5]);else{
 frozen();const G=require('./v013-b6-affinity-plan.cjs');
 if(cmd==='plan'){const ps=G.IDS.map(G.profile);write('plan',{profiles:ps,scenarios:G.SC,historical:G.HISTORICAL});console.log('B6_PLAN='+JSON.stringify({profiles:ps.length,scenarios:G.SC.length,historical:G.HISTORICAL.length}));}
 else if(cmd==='smoke'){const ps=G.IDS.map(G.profile);const xs=ps.map(p=>runProfile(p,[G.SC[2]],1,G.SC,G.FAMILIES,G.HISTORICAL.includes(p.id)));const all=xs.flatMap(x=>Object.values(x.arms).flatMap(a=>a.rows));assert.equal(all.filter(r=>r.timeout).length,0);write('smoke',xs);console.log('B6_SMOKE='+all.length);}
 else if(cmd==='run'){assert(G.IDS.includes(a));const x=runProfile(G.profile(a),G.SC,G.N,G.SC,G.FAMILIES,G.HISTORICAL.includes(a));write(a,x);console.log('B6_SHARD='+JSON.stringify({id:a,counts:Object.fromEntries(Object.entries(x.arms).map(([k,v])=>[k,v.rows.length]))}));}
 else if(cmd==='aggregate')aggregate(G);else throw Error('Unknown command');
}
