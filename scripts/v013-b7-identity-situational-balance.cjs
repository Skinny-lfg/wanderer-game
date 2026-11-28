'use strict';
// B7: situational build identity, reuse verified B6.1 current rows and fill only missing cells.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),assert=require('node:assert/strict'),Module=require('node:module'),{execFileSync}=require('node:child_process');
const ROOT=path.resolve(__dirname,'..'),FROZEN='e29eb23556ffd580f306b684df715d3d7771b222',ANCHOR=FROZEN,OUT=path.join(ROOT,'reports/b7'),REUSE=path.join(ROOT,'reports/b7-b61');
const sha=x=>crypto.createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');
const git=(root,...args)=>execFileSync('git',['-C',root,...args],{encoding:'utf8'}).trim();
const write=(name,x)=>{fs.mkdirSync(OUT,{recursive:true});fs.writeFileSync(path.join(OUT,name+'.json'),JSON.stringify(x));};
const read=name=>JSON.parse(fs.readFileSync(path.join(OUT,name+'.json'),'utf8'));
function replaceOnce(s,a,b){assert.equal(s.split(a).length,2,'Instrumentation anchor '+a);return s.replace(a,b);}
function compile(file,source){const m=new Module(file,module);m.filename=file;m.paths=Module._nodeModulePaths(path.dirname(file));m._compile(source,file);return m.exports;}
function frozen(){
 const changed=git(ROOT,'diff','--name-only',FROZEN,'HEAD').split('\n').filter(Boolean).sort();
 const expected=['.github/workflows/v013-b23-offhand-consolidation.yml','research/B7-build-identity-situational-balance.md','scripts/v013-b7-identity-plan.cjs','scripts/v013-b7-identity-situational-balance.cjs'].sort();
 assert.deepEqual(changed,expected,'Unexpected change from B6.1; no production, policy or test drift allowed');
}
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
  const seed=126100061+i*167,family=families[(i+allSc.findIndex(s=>s.id===sc.id))%6];
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
 const current=git(ROOT,'rev-parse','HEAD'),dir=fs.mkdtempSync(path.join(os.tmpdir(),'b7-')),input=path.join(dir,'input.json'),output=path.join(dir,'output.json');
 const variants=[['current',ROOT,current]];
 if(historical){const anchorRoot=process.env.B61_ANCHOR_DIR;assert(anchorRoot,'B61_ANCHOR_DIR required');assert.equal(git(anchorRoot,'rev-parse','HEAD'),ANCHOR);variants.push(['anchor',anchorRoot,ANCHOR]);}
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

function finiteMean(xs){return mean(xs.filter(Number.isFinite));}
function median(xs){const a=xs.filter(Number.isFinite).sort((a,b)=>a-b);return a.length?(a[(a.length-1)>>1]+a[a.length>>1])/2:null;}
function detail(rows){
 const result=summary(rows),resolved=rows.filter(r=>!r.timeout),wins=resolved.filter(r=>r.won);
 return {...result,winSecondsMedian:median(wins.map(r=>r.seconds)),firstKillMedian:median(resolved.map(r=>r.firstKill)),aoeDamageSharePct:finiteMean(resolved.map(r=>r.damage>0&&Number.isFinite(r.aoe)?100*r.aoe/r.damage:null)),dotDamageSharePct:finiteMean(resolved.map(r=>r.damage>0&&Number.isFinite(r.dot)?100*r.dot/r.damage:null)),enemyActorExposure:finiteMean(resolved.map(r=>r.observation.actorSeconds)),enemyAttacksPerActorSecond:finiteMean(resolved.map(r=>r.observation.actorSeconds>0?r.observation.enemyAttacks/r.observation.actorSeconds:null)),fundedActions:finiteMean(resolved.map(r=>r.funded))};
}
function pairedMetric(a,b,f){
 const values=a.map((r,i)=>[r,b[i]]).filter(([x,y])=>!x.timeout&&!y.timeout).map(([x,y])=>{const p=f(x),q=f(y);return Number.isFinite(p)&&Number.isFinite(q)?q-p:null;}).filter(Number.isFinite);
 const n=values.length,m=mean(values),se=n>1?Math.sqrt(values.reduce((t,v)=>t+(v-m)**2,0)/(n-1)/n):null;
 return {n,delta:m,approx95CI:se===null?null:[m-1.96*se,m+1.96*se]};
}
function matchup(a,b){
 assert.equal(a.length,b.length);for(let i=0;i<a.length;i++)for(const k of ['seed','family','sc','trial','scenario','gear'])assert.equal(a[i][k],b[i][k],'Unmatched same-kit comparison '+k);
 const joint=a.map((r,i)=>[r,b[i]]).filter(([x,y])=>x.won&&y.won&&!x.timeout&&!y.timeout);
 return {wins:paired(a,b),dps:pairedMetric(a,b,r=>r.seconds>0?r.damage/r.seconds:null),hpPP:pairedMetric(a,b,r=>100*r.hp/Math.max(1,r.maxHp)),manaPP:pairedMetric(a,b,r=>r.maxMp>0?100*r.mp/r.maxMp:null),firstKill:pairedMetric(a,b,r=>r.firstKill),jointWins:joint.length,jointWinSecondsDelta:mean(joint.map(([x,y])=>y.seconds-x.seconds)),a:detail(a),b:detail(b)};
}
function aggregate(G){
 const commit=git(ROOT,'rev-parse','HEAD'),all=G.IDS.map(id=>read(id)),profiles={},raw={},gears=new Map(),opponents=new Map(),unresolved=[];
 const key=r=>r.sc+'/'+r.trial;
 let newFights=0,reusedFights=0,encounterChecks=0,gearChecks=0,surrenders=0;
 const ref=all[0].arms.current;
 for(const x of all){
  const id=x.id,p=G.profile(id),current=x.arms.current;
  assert.deepEqual(x.p,JSON.parse(JSON.stringify(p)));assert.equal(x.commit,commit);assert.equal(x.baseline,FROZEN);assert.equal(current.revision,commit);
  assert.deepEqual(current.hashes,ref.hashes);assert.equal(current.observer,ref.observer);
  const isReuse=G.REUSE.includes(id),newSc=isReuse?G.NEW_SC:G.SC;
  assert.equal(current.rows.length,newSc.length*G.N);assert(!x.arms.anchor);newFights+=current.rows.length;
  assert.deepEqual([...new Set(current.rows.map(r=>r.sc))].sort(),newSc.map(s=>s.id).sort());
  let rows=current.rows.slice();
  if(isReuse){
   const old=JSON.parse(fs.readFileSync(path.join(REUSE,id+'.json'),'utf8'));
   assert.equal(old.id,id);assert.equal(old.commit,FROZEN);assert.equal(old.arms.current.revision,FROZEN);
   assert.deepEqual(old.p,x.p);assert.deepEqual(old.arms.current.hashes,current.hashes);assert.equal(old.arms.current.observer,current.observer);
   assert.equal(old.arms.current.rows.length,G.OLD_SC.length*G.N);
   assert.deepEqual([...new Set(old.arms.current.rows.map(r=>r.sc))].sort(),G.OLD_SC.map(s=>s.id).sort());
   reusedFights+=old.arms.current.rows.length;rows.push(...old.arms.current.rows);
  }
  assert.equal(rows.length,G.SC.length*G.N);assert.equal(new Set(rows.map(key)).size,rows.length);
  const kit=[p.weapon,p.offhandType,p.armorType].join('/');
  for(const r of rows){
   const scIndex=G.SC.findIndex(s=>s.id===r.sc);assert(scIndex>=0);assert(Number.isInteger(r.trial)&&r.trial>=0&&r.trial<G.N);
   assert.equal(r.seed,126100061+r.trial*167);assert.equal(r.family,G.FAMILIES[(r.trial+scIndex)%6]);assert.equal(r.kind,G.SC[scIndex].kind);
   const k=key(r),previous=opponents.get(k);
   if(previous){for(const f of ['seed','family','scenario'])assert.equal(r[f],previous[f],id+' encounter '+k+' '+f);encounterChecks++;}else opponents.set(k,r);
   const gk=kit+'/'+k;if(gears.has(gk)){assert.equal(r.gear,gears.get(gk),id+' gear '+k);gearChecks++;}else gears.set(gk,r.gear);
   if(r.timeout)unresolved.push({id,...r});if(r.surrendered)surrenders++;
  }
  raw[id]=rows;const bySc=Object.fromEntries(G.SC.map(s=>[s.id,detail(rows.filter(r=>r.sc===s.id))]));
  const curve=[1,2,4,8,12,16,22].map(size=>({size,...bySc['normal-'+size]}));
  profiles[id]={families:p.families,kit,role:p.role,element:p.element||null,nodes:p.t.nodes,prepared:p.t.prepared||null,reused:isReuse?400:0,newFights:current.rows.length,normal:detail(rows.filter(r=>r.kind==='normal')),elite:detail(rows.filter(r=>r.kind==='elite')),boss:detail(rows.filter(r=>r.kind==='boss')),overall:detail(rows),scenarios:bySc,curve,realm:Object.fromEntries(G.FAMILIES.map(f=>[f,detail(rows.filter(r=>r.family===f))])),soloTo22:{winDeltaPP:bySc['normal-22'].winPct-bySc['normal-1'].winPct,dpsRatio:bySc['normal-1'].dps>0?bySc['normal-22'].dps/bySc['normal-1'].dps:null}};
 }
 assert.equal(newFights,12400);assert.equal(reusedFights,9600);assert.equal(opponents.size,G.SC.length*G.N);
 const comparisons=G.PAIRS.map(([a,b,intent])=>{
  assert.equal(profiles[a].kit,profiles[b].kit,'Pair requires same kit');
  const sc=Object.fromEntries(G.SC.map(s=>[s.id,matchup(raw[a].filter(r=>r.sc===s.id).sort((x,y)=>x.trial-y.trial),raw[b].filter(r=>r.sc===s.id).sort((x,y)=>x.trial-y.trial))]));
  const relativeLarge=mean([8,12,16,22].map(n=>sc['normal-'+n].wins.deltaPP).filter(Number.isFinite));
  return {a,b,intent,kit:profiles[a].kit,scenarios:sc,relativeWinAdvantageShiftPP:Number.isFinite(relativeLarge)&&Number.isFinite(sc['normal-1'].wins.deltaPP)?relativeLarge-sc['normal-1'].wins.deltaPP:null};
 });
 const report={stage:'B7 Build Identity & Situational Balance',commit,baseline:FROZEN,sourceRun:46141656892,scope:'Frozen B6.1 native E10 mechanics, 30 legal points, Rare gear, mechanics target policy. Reuse 24 verified current profile artifacts (not historical arms), extend normal sizes to 1/2/4/8/12/16/22, add 16 profiles with all scenarios. Matched seeds and identical kits within 18 explicit comparisons. Scenario mixes across sizes differ (not identical enemy compositions); relative group effects are descriptive. No reweighted natural progression estimates, no global score. Joint-win TTK differences conditioned on both winning. Approximate exploratory intervals unadjusted for multiplicity; reused seeds not held-out confirmation. Existing surrender policy unchanged.',profilesCount:G.IDS.length,newFights,reusedFights,totalFights:newFights+reusedFights,encounterChecks,gearChecks,timeouts:unresolved.length,surrenders,nativeHashes:ref.hashes,observer:ref.observer,profiles,comparisons,unresolved};
 write('summary',report);console.log('B7_OVERVIEW='+JSON.stringify({commit,newFights,reusedFights,totalFights:report.totalFights,timeouts:report.timeouts,surrenders,encounterChecks,gearChecks,profiles:report.profilesCount,pairs:comparisons.length}));
 for(const [id,p] of Object.entries(profiles))console.log('B7_PROFILE='+JSON.stringify({id,kit:p.kit,role:p.role,curve:p.curve.map(x=>({size:x.size,win:x.winPct,dps:x.dps,aoe:x.aoeDamageSharePct,ttk:x.winSecondsMedian,hp:x.hpPct,mana:x.manaPct})),elite:p.elite.winPct,boss:p.boss.winPct}));
 for(const c of comparisons)console.log('B7_PAIR='+JSON.stringify({a:c.a,b:c.b,intent:c.intent,relativeWinAdvantageShiftPP:c.relativeWinAdvantageShiftPP,scenarios:Object.fromEntries(Object.entries(c.scenarios).map(([k,v])=>[k,{wins:v.wins,dps:v.dps,jointWins:v.jointWins,jointWinSecondsDelta:v.jointWinSecondsDelta,hp:v.hpPP,mana:v.manaPP}]))}));
 if(unresolved.length)process.exitCode=1;
}
const [cmd,a,b]=process.argv.slice(2);
if(cmd==='worker')worker(a,process.argv[4],process.argv[5]);else{
 frozen();const G=require('./v013-b7-identity-plan.cjs');
 if(cmd==='plan'){
  const ps=G.IDS.map(G.profile);for(const [a,b] of G.PAIRS){const x=G.profile(a),y=G.profile(b);assert.deepEqual([x.weapon,x.offhandType,x.armorType],[y.weapon,y.offhandType,y.armorType]);}
  write('plan',{profiles:ps,scenarios:G.SC,reuse:G.REUSE,extra:G.EXTRA,pairs:G.PAIRS});
  console.log('B7_PLAN='+JSON.stringify({profiles:ps.length,scenarios:G.SC.length,reuse:G.REUSE.length,extra:G.EXTRA.length,pairs:G.PAIRS.length}));
 }else if(cmd==='smoke'){
  const ps=G.IDS.map(G.profile);const xs=ps.map(p=>runProfile(p,[G.NEW_SC[0]],1,G.SC,G.FAMILIES,false));assert(xs.every(x=>x.arms.current.rows.length===1&&!x.arms.current.rows[0].timeout));
  const reference=xs[0].arms.current.rows[0];for(const x of xs)assert.equal(x.arms.current.rows[0].scenario,reference.scenario);
  write('smoke',xs);console.log('B7_SMOKE='+xs.length);
 }else if(cmd==='run'){
  assert(G.IDS.includes(a));const x=runProfile(G.profile(a),G.REUSE.includes(a)?G.NEW_SC:G.SC,G.N,G.SC,G.FAMILIES,false);write(a,x);
  console.log('B7_SHARD='+JSON.stringify({id:a,counts:Object.fromEntries(Object.entries(x.arms).map(([k,v])=>[k,v.rows.length]))}));
 }else if(cmd==='aggregate')aggregate(G);else throw Error('Unknown command');
}
