'use strict';
// B2.3 independent confirmation. Pinned old native source is only loaded by VM arms.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const S=require('./simulate-progression.cjs'),G=require('./v013-global-e10.cjs'),N=require('./v013-natural-progression.cjs'),D=require('./v013-b12d-clean-natural-rebaseline.cjs'),A=require('./v013-b12c1-advanced-agent-audit.cjs'),B=require('./v013-b1-e10-rebaseline.cjs');
const OUT='reports/b23',NSEEDS=100,OLD='51b6814bd9e39ef7236dc672c42714af29875e28',PRE_SP='0b880189793948b89ff1a7d4bd15cc20d4f98e46';
const R='combat/v012-combat-runtime.js',BC='combat/v012-buildcraft.js',GS='combat/v012-gear-stats.js',F=['blood','decay','radiance','aegis','fury','arcane'];
const specs=[
 {id:'blood-sword'},{id:'aegis-mace'},{id:'fury-daggers'},{id:'decay-cycle-daggers',rot:true},{id:'arcane-arcane-wand'},{id:'aegis-mace',cloth:true},{id:'blood-sword',cloth:true,orb:true},{id:'blood-sword',weapon:'Mace'},{id:'decay-cycle-daggers',weapon:'Mace',rot:true}
],scenarios=[{id:'solo',kind:'normal',size:1},{id:'group12',kind:'normal',size:12},{id:'boss',kind:'boss'}];
const agentIds=['smart-blood-sword','smart-decay-cycle-daggers','smart-decay-cycle-wand','smart-fury-daggers','smart-radiance-pure','pure-aegis','smart-arcane-arcane-pure','hybrid-decay-blood'];
const old=(commit,file)=>execFileSync('git',['show',commit+':'+file],{encoding:'utf8',maxBuffer:10*1024*1024});
const sha=x=>crypto.createHash('sha256').update(x).digest('hex'),json=JSON.stringify,write=(file,x)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(x,null,2));};
function replace(s,a,b){assert.equal(s.split(a).length,2,'Source anchor '+a);return s.replace(a,b);}
function baselineRuntime(){
 let r=old(OLD,R);
 r=replace(r,'function weaponAttack(r,offhandStrike=false){',"function weaponAttack(r,offhandStrike=false){\n ports.phase6Metric(r,offhandStrike?'secondaryEquipmentStatusOffhandStrikes':'secondaryEquipmentStatusMainStrikes',1);");
 return replace(r,' const real=Math.max(0,Math.min(e.hp,damage));\n ports.phase6Metric(r,'," const real=Math.max(0,Math.min(e.hp,damage));\n if(offhandStrike)ports.phase6Metric(r,'secondaryEquipmentStatusOffhandDamage',real);\n ports.phase6Metric(r,");
}
function rotSource(factor){
 assert([.8,.4].includes(factor));
 return replace(fs.readFileSync(BC,'utf8')," if(!kind)return Math.max(0,Number(c.base)||ap);"," if(c.offhand)return ap*"+factor+";\n if(!kind)return Math.max(0,Number(c.base)||ap);");
}
function sources(){return {oldRuntime:baselineRuntime(),oldBuild:old(OLD,BC),oldGear:old(PRE_SP,GS),ownFull:rotSource(.8),ownHalf:rotSource(.4)};}
function compact(x){const m=x.weaponStatusMetrics||{};return {won:x.won,died:x.died,timedOut:x.timedOut,seconds:x.seconds,damage:x.damageDealt,taken:x.damageTaken,firstKill:x.firstKillSeconds,hpEnd:x.hpEnd,mpEnd:x.mpEnd,manaSpent:x.manaSpent,stats:x.heroBaseStats,healing:x.affinityMetrics?.healingActual,barrier:x.affinityMetrics?.barrierGenerated,absorbed:x.affinityMetrics?.barrierAbsorbed,dot:x.affinityMetrics?.dotDamageActual,offHits:m.secondaryEquipmentStatusOffhandStrikes||0,offDamage:m.secondaryEquipmentStatusOffhandDamage||0,offBleed:m.secondaryEquipmentStatusOffhandBleedApplications||0,offRot:m.secondaryEquipmentStatusOffhandRotApplications||0,mainHits:m.secondaryEquipmentStatusMainStrikes||0,abilities:x.decayTalentMetrics,passives:x.affinityMetrics?.passiveActivations};}
function controlled(pi,si,src=sources(),replay=null){
 const spec=specs[pi],sc=scenarios[si];assert(spec&&sc);const p=G.profile(spec.id);
 const build={id:p.id,weapon:spec.weapon||p.weapon,families:p.families,skills:[],element:p.element};
 const opts={...S.DEFAULTS,mode:'encounter',points:p.t.nodes.length,gear:'current',rarity:'Rare',runes:false,contracts:'none',boons:'none',targetPolicy:'mechanics',measure:true,tickLimit:13000,lockScenarioStreams:true,controlledTalents:p.t,armorType:spec.cloth?'Cloth':p.armorType,offhandType:spec.cloth?(spec.orb?'Orb':p.offhandType):'Off-Hand Dagger'};
 const arms={old:{stageArmorRuntimeSource:src.oldRuntime,stage648c1BuildcraftSource:src.oldBuild,stage648c2cGearStatsSource:src.oldGear},approved:{},...(spec.rot?{ownFull:{stage648c1BuildcraftSource:src.ownFull},ownHalf:{stage648c1BuildcraftSource:src.ownHalf}}:{})};
 const indices=replay?.indices??Array.from({length:NSEEDS},(_,i)=>i),diagnostics=[];
 const rows=indices.map(i=>{
  const seed=100300001+i*103,family=F[i%F.length];const variants=Object.fromEntries(Object.entries(arms).map(([id,opt])=>[id,S.encounter(10,build,seed,sc.kind,{...opts,...opt},undefined,undefined,family,1,sc.size)]));
  const baseline=variants.old;
  for(const [id,x] of Object.entries(variants)){
   for(const k of ['gearFingerprint','roster','resolvedSeed','controlledTalentNodes','armorType','offhandType','conditionId','conditionMarked','traitId','bossModifierIds','initialEnemies'])assert.equal(json(x[k]),json(baseline[k]),id+'/'+k);
   assert.equal([x.won,x.died,x.timedOut].filter(Boolean).length,1);
   if(id.startsWith('own'))assert.deepEqual(x.heroBaseStats,variants.approved.heroBaseStats);
  }
  if(replay)diagnostics.push({i,seed,arms:Object.fromEntries(Object.entries(variants).map(([k,x])=>[k,{...compact(x),roster:x.roster,realm:x.realm,affinity:x.affinity,trait:x.traitId,traitRegrowthHealing:x.traitRegrowthHealing,condition:x.conditionId,conditionMarked:x.conditionMarked,enemyAbilityCasts:x.enemyAbilityCasts,targetSwitches:x.targetSwitches,remainingActors:x.groupPressure?.remainingActors,barrierAtExit:x.affinityMetrics?.barrierAtExit}]))});
  return {i,seed,gearHash:baseline.gearFingerprint,rosterHash:sha(json(baseline.roster)),arms:Object.fromEntries(Object.entries(variants).map(([k,x])=>[k,compact(x)]))};
 });
 const source={...Object.fromEntries(Object.entries(src).map(([k,v])=>[k,sha(v)])),native:S.sourceFingerprint().sha256};const payload={pi,si,spec,sc,source,commit:process.env.GITHUB_SHA||null,rows,...(replay?{diagnostics}:{})};write((replay?.out||OUT)+'/controlled-'+pi+'-'+si+'.json',payload);return payload;
}
function nativeCampProbe(a){return {legal:a.talents.valid(a.state().automaticTalents),stats:{...a.baseStats()}};}
function agent(pi,replay=null){
 const id=agentIds[pi];assert(id);const rows=[];
 for(const i of replay?.indices??[0,1,2,3,4]){
  const seed=100400001+i*107,variants={};
  for(const arm of ['H','H23']){
   const p={...D.approvedProfile(id),...(arm==='H23'?{offhandPolicy:'b23'}:{})},observations=[];
   const acc=N.simulateAccount(seed,id,{...N.DEFAULTS,...D.CONFIG,tickLimit:13000},{researchProfiles:{[id]:p},decisionModel:'adaptive',equipEarnedRunes:true,onCamp:({a,level,attempt})=>{
    const cap=N.capabilities(a);observations.push({level,attempt,points:a.state().automaticTalents.nodes.length,weapon:cap.weapon,offhand:cap.offhand,dagger:cap.offhandDagger,mana:a.baseStats().mana,stats:{attack:a.baseStats().attack,spellPower:a.baseStats().spellPower}});return nativeCampProbe(a);
   }});
   const audit=A.audit(id,[acc]),issues=[...audit.issues];
   for(const t of acc.attempts)for(const m of D.compatibilityIssues(t,p))issues.push({level:t.level,attempt:t.attempt,message:m});
   variants[arm]={endLevel:acc.endLevel,errors:audit.errors,issues,observations,attempts:acc.attempts.length,stopReason:acc.stopReason,surrenders:acc.attempts.filter(t=>t.surrendered).length};
  }
  rows.push({i,seed,variants});
 }
 const payload={pi,id,commit:process.env.GITHUB_SHA||null,native:S.sourceFingerprint().sha256,rows};write((replay?.out||OUT)+'/agent-'+pi+'.json',payload);return payload;
}
const mean=(x,f)=>{const a=x.map(f).filter(Number.isFinite);return a.length?+(a.reduce((n,v)=>n+v,0)/a.length).toFixed(3):null;};
function metrics(x){const valid=x.filter(r=>!r.timedOut);return {n:x.length,resolved:valid.length,wins:valid.filter(r=>r.won).length,losses:valid.filter(r=>r.died).length,timeouts:x.filter(r=>r.timedOut).length,winPct:mean(valid,r=>100*Number(r.won)),DPS:mean(valid,r=>r.seconds>0?r.damage/r.seconds:null),seconds:mean(valid,r=>r.seconds),offhandRate:mean(valid,r=>r.seconds>0?r.offHits/r.seconds:null),offhandDamage:mean(valid,r=>r.offDamage),offhandBleed:mean(valid,r=>r.offBleed),offhandRot:mean(valid,r=>r.offRot),dot:mean(valid,r=>r.dot),mana:mean(valid,r=>r.manaSpent),barrier:mean(valid,r=>r.barrier),SP:mean(valid,r=>r.stats?.spellPower)};}
function delta(rows,a,b){
 const ds=rows.filter(r=>!r.arms[a].timedOut&&!r.arms[b].timedOut).map(r=>100*(Number(r.arms[b].won)-Number(r.arms[a].won)));
 if(!ds.length)return {n:0,delta:null,CI:null};let state=731;
 const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
 const draws=Array.from({length:1000},()=>mean(ds,()=>ds[Math.floor(random()*ds.length)])).sort((a,b)=>a-b);
 return {n:ds.length,delta:mean(ds,x=>x),CI:[draws[24],draws[974]],gains:ds.filter(x=>x>0).length,losses:ds.filter(x=>x<0).length};
}
function aggregate(){
 const cs=[],as=[],missing=[],read=f=>{if(!fs.existsSync(f)){missing.push(f);return null;}return JSON.parse(fs.readFileSync(f,'utf8'));};
 for(let pi=0;pi<specs.length;pi++)for(let si=0;si<scenarios.length;si++){const x=read(OUT+'/controlled-'+pi+'-'+si+'.json');if(x)cs.push(x);}
 for(let pi=0;pi<agentIds.length;pi++){const x=read(OUT+'/agent-'+pi+'.json');if(x)as.push(x);}
 const commit=process.env.GITHUB_SHA||null,native=S.sourceFingerprint().sha256;
 for(const x of cs){assert.equal(x.commit,commit);assert.equal(x.source.native,native);assert.deepEqual(x.spec,specs[x.pi]);assert.deepEqual(x.sc,scenarios[x.si]);assert.equal(x.rows.length,NSEEDS);assert.equal(new Set(x.rows.map(r=>r.seed)).size,NSEEDS);for(const r of x.rows)assert.deepEqual(Object.keys(r.arms),x.spec.rot?['old','approved','ownFull','ownHalf']:['old','approved']);}
 for(const x of as){assert.equal(x.commit,commit);assert.equal(x.native,native);assert.equal(x.id,agentIds[x.pi]);assert.equal(x.rows.length,5);}
 const control=cs.map(x=>({spec:x.spec,scenario:x.sc.id,arms:Object.fromEntries(Object.keys(x.rows[0].arms).map(k=>[k,metrics(x.rows.map(r=>r.arms[k]))])),paired:delta(x.rows,'old','approved'),...(x.spec.rot?{ownFull:delta(x.rows,'approved','ownFull'),ownHalf:delta(x.rows,'approved','ownHalf')}:{})}));
 const agents=as.map(x=>({id:x.id,arms:Object.fromEntries(['H','H23'].map(k=>{const a=x.rows.map(r=>r.variants[k]),obs=a.flatMap(r=>r.observations),developed=obs.filter(o=>o.points>=10);return [k,{accounts:a.length,meanLevel:mean(a,r=>r.endLevel),reachedE10:a.filter(r=>r.endLevel>=10).length,clearedE10:a.filter(r=>r.endLevel>=11).length,errors:a.flatMap(r=>r.errors).length,issues:a.flatMap(r=>r.issues).length,developed:developed.length,dagger:obs.filter(o=>o.dagger.active).length,daggerDeveloped:developed.filter(o=>o.dagger.active).length,bleed:developed.filter(o=>o.dagger.bleed).length,rot:developed.filter(o=>o.dagger.rot).length}];}))}));
 const fights=cs.reduce((n,x)=>n+x.rows.reduce((m,r)=>m+Object.keys(r.arms).length,0),0),timeouts=control.reduce((n,x)=>n+Object.values(x.arms).reduce((m,v)=>m+v.timeouts,0),0),errors=agents.reduce((n,x)=>n+Object.values(x.arms).reduce((m,v)=>m+v.errors+v.issues,0),0);
 const overview={fights,expectedFights:6600,agentAccounts:as.reduce((n,x)=>n+x.rows.length*2,0),expectedAgentAccounts:80,timeouts,errors,missing,scope:'Controlled held-out confirmation; Rot alternatives unapproved, separate natural gear-policy pilot; no global natural baseline.'};
 write(OUT+'/summary.json',{overview,control,agents});for(const x of control)console.log('B23_CONTROL='+json(x));for(const x of agents)console.log('B23_AGENT='+json(x));console.log('B23_OVERVIEW='+json(overview));
 if(fights!==6600||overview.agentAccounts!==80||timeouts||errors||missing.length)process.exitCode=1;
}

const RECOVERY_BASE='807ea48da38b837586eb288a3a9430b8801ea14b',RECOVERY_OUT='reports/b23a';
function recovery(){
 const read=name=>JSON.parse(fs.readFileSync(OUT+'/'+name+'.json','utf8')),native=S.sourceFingerprint().sha256,src=sources(),expectedSources={...Object.fromEntries(Object.entries(src).map(([k,v])=>[k,sha(v)])),native};
 const controls=[],accounts=[],histIssues={},timeoutSeeds=[];
 let fights=0,agentAccounts=0,issues=0,runtimeErrors=0;
 for(let pi=0;pi<specs.length;pi++)for(let si=0;si<scenarios.length;si++){
  const x=read('controlled-'+pi+'-'+si);
  assert.equal(x.commit,RECOVERY_BASE);assert.deepEqual(x.source,expectedSources);assert.equal(x.pi,pi);assert.equal(x.si,si);assert.deepEqual(x.spec,specs[pi]);assert.deepEqual(x.sc,scenarios[si]);assert.equal(x.rows.length,NSEEDS);
  const keys=x.spec.rot?['old','approved','ownFull','ownHalf']:['old','approved'];
  x.rows.forEach((r,i)=>{assert.equal(r.i,i);assert.equal(r.seed,100300001+i*103);assert.deepEqual(Object.keys(r.arms),keys);
   for(const [arm,v] of Object.entries(r.arms)){assert.equal([v.won,v.died,v.timedOut].filter(Boolean).length,1);fights++;if(v.timedOut)timeoutSeeds.push({pi,si,i,seed:r.seed,arm});}});
  controls.push(x);
 }
 for(let pi=0;pi<agentIds.length;pi++){
  const x=read('agent-'+pi);assert.equal(x.commit,RECOVERY_BASE);assert.equal(x.native,native);assert.equal(x.id,agentIds[pi]);assert.equal(x.pi,pi);assert.equal(x.rows.length,5);
  x.rows.forEach((r,i)=>{assert.equal(r.i,i);assert.equal(r.seed,100400001+i*107);assert.deepEqual(Object.keys(r.variants),['H','H23']);for(const [arm,v] of Object.entries(r.variants)){
   agentAccounts++;runtimeErrors+=v.errors.length;
   for(const q of v.issues){issues++;const k=arm+': '+q.message;histIssues[k]=(histIssues[k]||0)+1;}
  }});accounts.push(x);
 }
 const oldSummary=read('summary');assert.equal(fights,6600);assert.equal(agentAccounts,80);assert.equal(issues,2310);assert.equal(runtimeErrors,0);assert.equal(timeoutSeeds.length,6);
 assert.deepEqual(histIssues,{'H: native talent validity not confirmed':1140,'H23: native talent validity not confirmed':1170});
 assert.equal(oldSummary.overview.fights,fights);assert.equal(oldSummary.overview.errors,issues);assert.equal(oldSummary.overview.timeouts,timeoutSeeds.length);assert.equal(oldSummary.overview.agentAccounts,agentAccounts);assert.deepEqual(oldSummary.overview.missing,[]);
 assert.deepEqual(timeoutSeeds.map(x=>[x.pi,x.si,x.i,x.arm]),[21,45,69].flatMap(i=>['old','approved'].map(a=>[5,0,i,a])));
 // Only the three affected matched seeds; do not extend the combat budget or alter mechanics.
 const timeoutReplay=controlled(5,0,src,{indices:[21,45,69],out:RECOVERY_OUT}),historic=controls.find(x=>x.pi===5&&x.si===0);
 for(const r of timeoutReplay.rows)assert.deepEqual(r,historic.rows[r.i],'Timeout replay drift');
 for(const d of timeoutReplay.diagnostics)console.log('B23A_TIMEOUT='+json(d));
 // One account per profile/policy (hybrid seed 1 has developed dagger coverage).
 const checks=[];
 for(let pi=0;pi<agentIds.length;pi++){
  const i=pi===7?1:0,run=agent(pi,{indices:[i],out:RECOVERY_OUT}),before=accounts[pi].rows[i],after=run.rows[0];
  assert.equal(after.seed,before.seed);
  for(const arm of ['H','H23']){
   const {issues:oldIssues,...prior}=before.variants[arm],{issues:newIssues,...now}=after.variants[arm];
   assert(oldIssues.every(q=>q.message==='native talent validity not confirmed'));assert.deepEqual(newIssues,[],'Unresolved replay audit issue');assert.deepEqual(now.errors,[]);assert.deepEqual(now,prior,'Agent replay drift');
   checks.push({id:run.id,seed:after.seed,arm,oldIssues:oldIssues.length,newIssues:newIssues.length,attempts:now.attempts,unchanged:true});
  }
 }
 const summary={sourceRun:45983097723,sourceCommit:RECOVERY_BASE,recoveryCommit:process.env.GITHUB_SHA||null,native,
  historical:{fights,agentAccounts,issues:histIssues,runtimeErrors,timeoutSeeds},replayed:{fights:6,agentAccounts:checks.length,checks,timeouts:timeoutReplay.diagnostics},
  verdict:'RECOVERY_VALIDATED_NOT_BALANCE_APPROVAL',remaining:['Six unresolved controlled outcomes (three matched seeds); diagnose encounter mechanics before any tuning.','H23 natural developed dagger coverage insufficient; no global natural baseline.','Historical agent artifacts preserved: missing probe evidence is not retroactively replaced.']};
 write(RECOVERY_OUT+'/summary.json',summary);console.log('B23A_OVERVIEW='+json({...summary,replayed:{...summary.replayed,timeouts:timeoutSeeds}}));
}

if(require.main===module){const [cmd,p,s]=process.argv.slice(2);if(cmd==='controlled')controlled(Number(p),Number(s));else if(cmd==='agent')agent(Number(p));else if(cmd==='aggregate')aggregate();else if(cmd==='recovery')recovery();else throw Error('Unknown command');}
module.exports={rotSource,specs,scenarios,agentIds,nativeCampProbe};
