'use strict';
// B7: situational build identity, reuse verified B6.1 current rows and fill only missing cells.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),assert=require('node:assert/strict'),Module=require('node:module'),{execFileSync}=require('node:child_process');
const ROOT=path.resolve(__dirname,'..'),FROZEN='2a7301edda4c40226f2acdc3bc5e3e7d1de9df5a',OUT=path.join(ROOT,'reports/b71b');
const sha=x=>crypto.createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');
const git=(root,...args)=>execFileSync('git',['-C',root,...args],{encoding:'utf8'}).trim();
const write=(name,x)=>{fs.mkdirSync(OUT,{recursive:true});fs.writeFileSync(path.join(OUT,name+'.json'),JSON.stringify(x));};
const read=name=>JSON.parse(fs.readFileSync(path.join(OUT,name+'.json'),'utf8'));
function replaceOnce(s,a,b){assert.equal(s.split(a).length,2,'Instrumentation anchor '+a);return s.replace(a,b);}
function compile(file,source){const m=new Module(file,module);m.filename=file;m.paths=Module._nodeModulePaths(path.dirname(file));m._compile(source,file);return m.exports;}
const G=require('./v013-b71-plagueheart-plan.cjs'),C=require('./v013-b71-plagueheart-candidates.cjs'),ARMS=['current','outbreak'];
function anchorRoot(){const r=process.env.B71_BASELINE_DIR;assert(r,'B71_BASELINE_DIR required');assert.equal(git(r,'rev-parse','HEAD'),FROZEN);return r;}
function frozen(){
 const expected=['.github/workflows/v013-b23-offhand-consolidation.yml','research/B7.1B-outbreak-integration.md','scripts/v013-b71b-outbreak-validation.cjs','tests/talent-graph-combat.test.cjs','tests/v013-b61-power-redistribution.test.cjs','tests/v013-b71b-outbreak.test.cjs',...['combat/v012-buildcraft.js','combat/v012-combat-runtime.js','combat/talent-catalog.js'].flatMap(x=>[x,'docs/'+x])].sort();
 assert.deepEqual(git(ROOT,'diff','--name-only',FROZEN,'HEAD').split('\n').filter(Boolean).sort(),expected);
 for(const f of ['combat/v012-buildcraft.js','combat/v012-combat-runtime.js','combat/talent-catalog.js'])assert.equal(fs.readFileSync(path.join(ROOT,f),'utf8'),fs.readFileSync(path.join(ROOT,'docs',f),'utf8'));
 const base=anchorRoot(),candidate=C.sources(base,'outbreak');
 for(const [f,v] of Object.entries(candidate))assert.equal(fs.readFileSync(path.join(ROOT,f),'utf8'),v.replaceAll('b71Outbreak','outbreakTick').replaceAll('b71CheckedAt','outbreakCheckedAt').replaceAll('b71PulseAt','outbreakPulseAt'),'Native integration differs from tested candidate '+f);
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
 const {p,scenarios,count,revision,arm}=JSON.parse(fs.readFileSync(input,'utf8'));
 process.chdir(root);assert.equal(git(root,'rev-parse','HEAD'),revision);
 const {S,observer}=observedSimulator(root),T=globalThis.WandererAutomaticTalents,A=require(path.join(root,'scripts/v013-agent-strategy.cjs'));
 assert(T.valid(p.t),'Invalid talent state '+revision+'/'+p.id);assert.equal(p.t.nodes.length,30);
 const required=['combat/v012-combat-runtime.js','combat/v012-buildcraft.js','combat/talent-graph-next.js','combat/talent-catalog.js'];
 const overrides={},hashes=Object.fromEntries(required.map(k=>[k,sha(overrides[k]??fs.readFileSync(path.join(root,k),'utf8'))])),rows=[];let moduleGraph=null;
 for(const sc of scenarios)for(let i=0;i<count;i++){
  const seed=127200091+i*179,family=G.family(sc,i);
  let modules=null,trace=[],decision=null;
  const audit={observe(r,tick,stage){
   if(tick%250!==0)return null;
   const point=A.combatTracePoint(r,tick,stage);trace.push(point);
   if(sc.kind==='normal'&&r.status==='fight'&&r.enemy&&!r.enemy.boss&&!r.enemy.miniboss&&point.active.length===1&&!point.reserve.length)decision=A.surrenderDecision(trace);
   return decision;
  }};
  const build={id:p.id,weapon:p.weapon,families:p.families,skills:[],...(p.element?{element:p.element}:{})};
  const opts={mode:'encounter',points:30,gear:'current',rarity:'Rare',runes:false,contracts:'none',boons:'none',targetPolicy:'mechanics',measure:true,tickLimit:13000,lockScenarioStreams:true,controlledTalents:p.t,armorType:p.baseArmor||p.armorType,...(p.baseArmor?{stageE10ArmorVariant:p.armorType}:{}),offhandType:p.offhandType,...(overrides[C.BUILD]?{stage648c1BuildcraftSource:overrides[C.BUILD]}:{}),...(overrides[C.RUNTIME]?{stageArmorRuntimeSource:overrides[C.RUNTIME]}:{}),stageB31ALoadout:p.weapon,stageB31EquipmentAudit:true,recordModules:es=>{modules=es;},stalemateAudit:audit,...(sc.elite?{stage619EliteType:sc.elite}:{})};
  const x=S.encounter(10,build,seed,sc.kind,opts,undefined,undefined,family,1,sc.size);
  assert(modules,'No native module records');
  for(const [file,hash] of Object.entries(hashes)){const m=modules.find(e=>e.file===file);assert(m&&m.overridden===Object.hasOwn(overrides,file)&&m.sha256===hash,'Runtime mismatch '+file);}
  if(moduleGraph)assert.deepEqual(modules,moduleGraph);else moduleGraph=modules;
  assert.equal(x.level,10);assert.equal(x.affinity,family);assert.equal(x.pointsSpent,30);assert.equal(x.talentXp,p.t.xp);assert.deepEqual(x.controlledTalentNodes,p.t.nodes);
  assert.equal(x.weaponType,p.weapon);assert.equal(x.offhandType,p.offhandType);assert.equal(x.armorType,p.armorType);
  assert.equal([x.won,x.died,x.timedOut,!!x.surrendered].filter(Boolean).length,1);
  if(x.surrendered){assert.equal(x.surrenderSettlement?.outcome,'defeat');assert.equal(x.surrenderSettlement?.stage,'failed');assert.equal(x.surrenderDecision?.reason,'observed_solo_stalemate');}
  if(sc.elite)assert.equal(x.eliteType,sc.elite);if(sc.kind==='boss')assert.equal(x.bossAffinity,family);if(sc.size)assert.equal(x.requestedGroupSize,sc.size);
  const gear=sha(Object.keys(x.equipmentAudit).sort().map(k=>{const it=x.equipmentAudit[k];if(!it)return[k,null];const {id,...rest}=it;return[k,rest];}));
  const scenario=sha([x.resolvedSeed,x.affinity,x.risk,x.roster,x.initialRoles,x.traitId,x.conditionId,x.conditionMarked,x.bossModifierIds,x.eliteType,x.bossId]);
  const m=x.affinityMetrics||{},o=x.b42Observation;assert(o&&Number.isFinite(o.enemyAttacks),'Missing observer');
  rows.push({sc:sc.id,kind:sc.kind,trial:i,seed,family,gear,nonArmorGear:x.nonArmorGearFingerprint,scenario,roster:x.roster,minHpPct:x.minHpPct,won:x.won,died:x.died,timeout:x.timedOut,surrendered:!!x.surrendered,seconds:x.seconds,damage:x.damageDealt,taken:x.damageTaken,hp:x.hpEnd,maxHp:x.hpMax,mp:x.mpEnd,maxMp:x.mpMax,healing:m.healingActual,barrierEntry:m.barrierAtEntry,barrierGenerated:m.barrierGenerated,absorbed:x.absorbed,starved:m.manaStarvedSeconds,paid:x.manaSpent,funded:x.fundedCasts,unfunded:x.unfundedCasterAttacks,dot:m.dotDamageActual,aoe:x.secondaryTargetDamage,firstKill:x.firstKillSeconds,stats:x.heroBaseStats,adaptiveStats:x.adaptiveStats,active:m.passiveActivations,observation:o,...(x.timedOut||x.surrendered?{trace,decision,settlement:x.surrenderSettlement||null}:{})});
 }
 fs.writeFileSync(output,JSON.stringify({revision,arm,hashes,moduleGraph,observer,rows}));
}

function runProfile(id,count,scenarios){
 const p=G.profile(id),current=git(ROOT,'rev-parse','HEAD'),dir=fs.mkdtempSync(path.join(os.tmpdir(),'b71b-')),input=path.join(dir,'input.json'),output=path.join(dir,'output.json'),arms={};
 try{for(const arm of ARMS){
  const root=arm==='current'?anchorRoot():ROOT,revision=arm==='current'?FROZEN:current;
  fs.writeFileSync(input,JSON.stringify({p,scenarios,count,revision,arm}));
  execFileSync(process.execPath,[__filename,'worker',root,input,output],{stdio:['ignore','inherit','inherit'],timeout:45*60*1000});
  arms[arm]=JSON.parse(fs.readFileSync(output,'utf8'));assert.equal(arms[arm].rows.length,count*scenarios.length);
 }}finally{fs.rmSync(dir,{recursive:true,force:true});}
 return {id,p,commit:current,baseline:FROZEN,arms};
}
const mean=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:null;
function sum(xs,k){return xs.reduce((s,r)=>s+(Number(r.observation.nativeMetrics[k])||0),0);}
function stat(xs,k){return mean(xs.map(r=>r.stats?.[k]).filter(Number.isFinite));}
function summary(rows){
 const xs=rows.filter(r=>!r.timeout),wins=xs.filter(r=>r.won),avg=f=>mean(xs.map(f).filter(Number.isFinite)),per=(k,r)=>r.seconds>0&&Number.isFinite(r[k])?r[k]/r.seconds:null;
 const rotTicks=sum(xs,'decayPrimaryPaidRotTicks'),stackSum=sum(xs,'decayPrimaryPaidRotStackSum'),procs=sum(xs,'decayPrimaryPaidPlagueheartActivations'),paid=sum(xs,'decayPrimaryPaidPlagueheartMana'),actor=xs.reduce((s,r)=>s+r.observation.actorSeconds,0);
 return {n:rows.length,resolved:xs.length,wins:wins.length,winPct:xs.length?100*wins.length/xs.length:null,winBounds:[100*wins.length/rows.length,100*(wins.length+rows.length-xs.length)/rows.length],timeouts:rows.length-xs.length,surrenders:xs.filter(r=>r.surrendered).length,dps:avg(r=>per('damage',r)),dotDps:avg(r=>per('dot',r)),aoeDps:avg(r=>per('aoe',r)),hpPct:avg(r=>100*r.hp/Math.max(1,r.maxHp)),minHpPct:avg(r=>r.minHpPct),manaPct:avg(r=>r.maxMp>0?100*r.mp/r.maxMp:null),manaSpent:avg(r=>r.paid),manaSpentPerSecond:avg(r=>per('paid',r)),starved:avg(r=>r.starved),damageTaken:avg(r=>r.taken),absorbed:avg(r=>r.absorbed),healing:avg(r=>r.healing),firstKill:avg(r=>r.firstKill),winSeconds:mean(wins.map(r=>r.seconds)),timeAll:avg(r=>r.seconds),rotTicks,averageStacksPerRotTick:rotTicks?stackSum/rotTicks:null,sixStackActorPct:actor?100*xs.reduce((s,r)=>s+r.observation.rotSixActorSeconds,0)/actor:null,plagueheartProcs:procs,plagueheartMana:paid,procsPerFight:xs.length?procs/xs.length:null,manaPerFight:xs.length?paid/xs.length:null,amplifiedTargets:sum(xs,'b71AmplifiedTargets'),amplifiedStacks:sum(xs,'b71AmplifiedStacks'),rawBonus:sum(xs,'b71RawBonus'),extraSeeds:sum(xs,'b71ExtraRotSeeds'),globalRolls:sum(xs,'b71GlobalRolls'),paymentAttempts:sum(xs,'b71PaymentAttempts'),rotDamage:sum(xs,'decayPrimaryPaidTotalRotDamage'),stats:Object.fromEntries(['attack','spellPower','defense','maxhp','attacksPerSec','mana','manaRegen','blockChance','evasionRating'].map(k=>[k,stat(xs,k)]))};
}
function paired(a,b,f){
 assert.equal(a.length,b.length);
 const ds=a.map((r,i)=>[r,b[i]]).filter(([x,y])=>!x.timeout&&!y.timeout).map(([x,y])=>{const a=f(x),b=f(y);return Number.isFinite(a)&&Number.isFinite(b)?b-a:null;}).filter(Number.isFinite),n=ds.length,m=mean(ds),se=n>1?Math.sqrt(ds.reduce((s,x)=>s+(x-m)**2,0)/(n-1)/n):null;
 return {n,delta:m,approx95CI:se===null?null:[m-1.96*se,m+1.96*se]};
}
function contrast(a,b){return {winPP:paired(a,b,r=>100*Number(r.won)),dps:paired(a,b,r=>r.seconds>0?r.damage/r.seconds:null),dotDps:paired(a,b,r=>r.seconds>0?r.dot/r.seconds:null),hpPP:paired(a,b,r=>100*r.hp/Math.max(1,r.maxHp)),manaPP:paired(a,b,r=>r.maxMp>0?100*r.mp/r.maxMp:null),jointWinTimeDelta:mean(a.map((r,i)=>[r,b[i]]).filter(([x,y])=>x.won&&y.won&&!x.timeout&&!y.timeout).map(([x,y])=>y.seconds-x.seconds))};}
function verify(x,count,scenarios){
 const base=x.arms.current;
 assert.equal(x.commit,git(ROOT,'rev-parse','HEAD'));assert.equal(x.baseline,FROZEN);assert.deepEqual(JSON.parse(JSON.stringify(x.p)),JSON.parse(JSON.stringify(G.profile(x.id))));
 for(const arm of ARMS){
  const a=x.arms[arm],root=arm==='current'?anchorRoot():ROOT;assert.equal(a.revision,arm==='current'?FROZEN:x.commit);assert.equal(a.arm,arm);assert.equal(a.observer,base.observer);
  assert.deepEqual(a.moduleGraph,base.moduleGraph.map(m=>({...m,overridden:false,sha256:sha(fs.readFileSync(path.join(root,m.file),'utf8'))})));
  assert(a.moduleGraph.every(m=>!m.overridden));
  assert.equal(a.rows.length,count*scenarios.length);
  assert.equal(new Set(a.rows.map(r=>r.sc+'/'+r.trial)).size,a.rows.length);
  for(let i=0;i<a.rows.length;i++){const r=a.rows[i],b=base.rows[i],sc=scenarios.find(s=>s.id===r.sc);assert(sc);assert.equal(r.seed,127200091+r.trial*179);assert.equal(r.family,G.family(sc,r.trial));for(const k of ['sc','trial','seed','family','gear','nonArmorGear','scenario'])assert.equal(r[k],b[k],x.id+' '+arm+' mismatch '+k);}
  if(x.p.control)assert.deepEqual(a.rows,base.rows,'Unchanged control diverged: '+x.id+'/'+arm);
 }
}
function aggregate(){
 const all=G.IDS.map(read),profiles={},unresolved=[],raw={},opponents=new Map();let fights=0,surrenders=0;
 for(const x of all){
  verify(x,G.N,G.SC);raw[x.id]=x.arms;const base=x.arms.current.rows,profile={kit:[x.p.weapon,x.p.offhandType,x.p.armorType].join('/'),talents:x.p.t.nodes,control:x.p.control,arms:{},contrasts:{}};
  for(const arm of ARMS){
   const rows=x.arms[arm].rows;fights+=rows.length;surrenders+=rows.filter(r=>r.surrendered).length;
   for(const r of rows){const key=r.sc+'/'+r.trial;if(opponents.has(key))assert.equal(r.scenario,opponents.get(key),'Encounter drift '+x.id+'/'+arm+'/'+key);else opponents.set(key,r.scenario);if(r.timeout)unresolved.push({id:x.id,arm,...r});}
   profile.arms[arm]={overall:summary(rows),scenarios:Object.fromEntries(G.SC.map(sc=>[sc.id,summary(rows.filter(r=>r.sc===sc.id))]))};
   if(arm!=='current')profile.contrasts[arm]={overall:contrast(base,rows),scenarios:Object.fromEntries(G.SC.map(sc=>[sc.id,contrast(base.filter(r=>r.sc===sc.id),rows.filter(r=>r.sc===sc.id))]))};
  }
  profiles[x.id]=profile;
 }
 const armorComparisons=G.ARMOR_PAIRS.map(([a,b])=>{
  const arms={};for(const arm of ARMS){
   const p=raw[a][arm].rows,q=raw[b][arm].rows;
   for(let i=0;i<p.length;i++)for(const k of ['sc','trial','seed','family','scenario','nonArmorGear'])assert.equal(p[i][k],q[i][k],'Armor pair mismatch '+k);
   arms[arm]={overall:contrast(p,q),scenarios:Object.fromEntries(G.SC.map(s=>[s.id,contrast(p.filter(r=>r.sc===s.id),q.filter(r=>r.sc===s.id))]))};
  }return {a,b,arms};
 });
 assert.equal(fights,7000);assert.equal(opponents.size,G.N*G.SC.length);
 const report={stage:'B7.1B Native Outbreak Integration',commit:git(ROOT,'rev-parse','HEAD'),baseline:FROZEN,scope:'Native before/after commits, zero VM combat overrides. Exact source parity with B7.1 Outbreak candidate except internal function and state names. 50 fresh matched seeds, 30 legal points, Rare gear, same 10 profiles and seven scenarios. Armor comparisons retain non-armor gear; no natural population estimate. Raw bonus telemetry is pre-multiplier; baseline lacks candidate-only counters.',fights,profilesCount:all.length,scenarios:G.SC,arms:ARMS,controls:G.CONTROLS,armorComparisons,profiles,timeouts:unresolved.length,surrenders,unresolved};
 write('summary',report);console.log('B71B_OVERVIEW='+JSON.stringify({fights,profiles:all.length,timeouts:unresolved.length,surrenders,controls:G.CONTROLS}));
 for(const [id,p] of Object.entries(profiles))console.log('B71B_PROFILE='+JSON.stringify({id,kit:p.kit,arms:Object.fromEntries(ARMS.map(a=>[a,p.arms[a].overall]))}));
 if(unresolved.length)process.exitCode=1;
}
const [cmd,a]=process.argv.slice(2);
if(cmd==='worker')worker(a,process.argv[4],process.argv[5]);else{
 frozen();
 if(cmd==='plan'){const profiles=G.IDS.map(G.profile);write('plan',{profiles,scenarios:G.SC,arms:ARMS});console.log('B71B_PLAN='+profiles.length);}
 else if(cmd==='smoke'){const xs=G.IDS.map(id=>runProfile(id,1,[G.SC[2]]));write('smoke',xs);for(const x of xs){verify(x,1,[G.SC[2]]);assert(ARMS.every(a=>x.arms[a].rows.every(r=>!r.timeout)));}const byId=new Map(xs.map(x=>[x.id,x]));for(const [a,b] of G.ARMOR_PAIRS){for(const arm of ARMS){const p=byId.get(a).arms[arm].rows[0],q=byId.get(b).arms[arm].rows[0];for(const k of ['sc','trial','seed','family','scenario','nonArmorGear'])assert.equal(p[k],q[k],'Smoke armor pair mismatch '+a+'/'+b+'/'+arm+'/'+k);}}console.log('B71B_SMOKE='+xs.length*ARMS.length);}
 else if(cmd==='run'){assert(G.IDS.includes(a));const x=runProfile(a,G.N,G.SC);verify(x,G.N,G.SC);write(a,x);console.log('B71B_SHARD='+a);}
 else if(cmd==='aggregate')aggregate();else throw Error('Unknown command');
}
