'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const D=require('./v013-stage628-postcap-difficulty.cjs'),S=require('./simulate-progression.cjs');
const IDS=["cautious","balanced","plate-warden","cloth-battlemage","leather-duelist","hexblade-hybrid","smart-blood-pure","smart-fury-daggers","smart-vitality-pure","smart-aegis-vitality","smart-magic-arcane-pure","smart-magic-fire-pure","magic-frost","smart-magic-lightning-pure","smart-decay-magic-aegis","smart-blood-sword","smart-blood-fury","smart-blood-fury-vitality","smart-blood-fury-vitality-no-mixed","smart-fury-blood-aegis","smart-fury-pure","smart-magic-fire-aegis","smart-magic-frost-vitality","smart-magic-wand","smart-magic-staff","smart-magic-wand-offense","smart-magic-wand-defense","decay-wand","decay-two-handed","aegis-sword-shield","aegis-mace-shield","aegis-wand-orb","vitality-sword-charm","vitality-staff","magic-sword-infusion"],SIZES=[4,5,8,12],TRIALS=50,OLD='686cd06098af3ee950363030c809d08383832e4021f23568e2aa4bbf161b550f';
const source=fs.readFileSync('online/v013-enemy-roster.js','utf8');
function candidate(){
 const anchor=' return roles.map(role=>{';
 assert.equal(source.split(anchor).length,2);
 const end='  return {name:chosen.name,image:chosen.image,role};\n });';
 assert.equal(source.split(end).length,2);
 return source.replace(anchor,' const roster=roles.map(role=>{').replace(end,end+`
 let retained=0;
 // Keep the first two original principal slots, all original Minions and native roster RNG.
 // Convert only surplus principals to a native Minion of this realm; no stat overrides.
 return roster.map(m=>{if(m.role==='minion'||++retained<=2)return m;
  const minion=catalog.find(x=>x.role==='minion');return {name:minion.name,image:minion.image,role:minion.role};});
 `);
}
const num=x=>Number.isFinite(x)?x:null;
function mean(xs,key){const a=xs.map(x=>x[key]).filter(Number.isFinite);return a.length?a.reduce((s,n)=>s+n,0)/a.length:null;}
function metric(r,k){return num(r.affinityMetrics?.[k]);}
function row(r){
 const p=r.groupPressure,sec=r.seconds||0;
 return {won:r.won,died:r.died,timeout:r.timedOut,seconds:sec,firstKill:r.firstKillSeconds,
  firstPrincipalKill:p?.firstPrincipalKill,firstMinionKill:p?.firstMinionKill,peakPrincipals:p?.peakPrincipals,principalSeconds:p?.principalSeconds,threePrincipalSeconds:p?.threePrincipalSeconds,minionOnlySeconds:p?.minionOnlySeconds,
  damage:r.damageDealt,secondary:r.secondaryTargetDamage,secondaryDot:r.secondaryDotDamage,secondaryDps:sec?r.secondaryTargetDamage/sec:0,secondaryShare:r.damageDealt?r.secondaryTargetDamage/r.damageDealt:0,
  taken:r.damageTaken,absorbed:r.absorbed,healed:metric(r,'healingActual'),barrierGenerated:metric(r,'barrierGenerated'),healingPerSecond:sec&&metric(r,'healingActual')!==null?metric(r,'healingActual')/sec:null,barrierAbsorbedPerSecond:sec?r.absorbed/sec:0,
  hpMax:r.hpMax,hpEnd:r.hpEnd,minHpPct:r.minHpPct,guardEvents:metric(r,'guardLogEvents'),attackCalls:metric(r,'attackCalls'),
  initialRoles:r.initialRoles,initialVisible:r.initialVisible,reinforcements:r.reinforcementsSpawned,rosterHp:r.roster.reduce((a,x)=>a+x.maxHp,0),
  initialPrincipalAttack:r.roster.filter(x=>x.role!=='minion').reduce((a,x)=>a+x.attack,0),passives:r.affinityMetrics?.passiveActivations||{},decay:r.decayTalentMetrics,magic:r.magicAdaptiveMetrics,defensive:r.defensiveTalentMetrics,seed:r.resolvedSeed,gear:r.gearFingerprint};
}
function stats(a){
 const v=a.filter(x=>x.won||x.died);
 const out={n:a.length,wins:v.filter(x=>x.won).length,winPct:v.length?100*v.filter(x=>x.won).length/v.length:null,timeouts:a.filter(x=>x.timeout).length};
 for(const key of ['seconds','firstKill','firstPrincipalKill','firstMinionKill','peakPrincipals','principalSeconds','threePrincipalSeconds','minionOnlySeconds','damage','secondary','secondaryDot','secondaryDps','secondaryShare','taken','absorbed','healed','barrierGenerated','healingPerSecond','barrierAbsorbedPerSecond','hpMax','hpEnd','minHpPct','guardEvents','attackCalls','rosterHp','initialPrincipalAttack','reinforcements'])out[key]=mean(v,key);
 return out;
}
function write(file,data){fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(data,null,2)+'\n');}
function load(id){
 const files=fs.readdirSync('input',{recursive:true}).filter(x=>path.basename(x)===id+'.json');
 assert.equal(files.length,1,'missing prior shard '+id);
 const a=JSON.parse(fs.readFileSync(path.join('input',files[0]),'utf8'));
 assert.equal(a.id,id);assert.equal(a.source,OLD);assert(a.complete);assert.equal(a.trials,100);
 assert.equal(a.accounts.length,5);
 const actors=a.accounts.filter(x=>x.snapshot);assert(actors.length,'missing E10 snapshots '+id);
 return {a,actors};
}
function pair(a,actor,i,size){
 const sc={id:'normal-'+size,type:'normal',realm:'blood',size},seed=64791000+i*101;
 const old=a.rows.find(x=>x.trial===i&&x.scenario===sc.id);
 assert(old&&old.naturalSeed===actor.seed,'baseline provenance');
 const b=D.native(actor.snapshot,sc,seed);
 assert.equal(b.resolvedSeed,old.seed,'baseline seed drift');
 assert.equal(b.gearFingerprint,old.gear,'baseline gear drift');
 assert.equal(b.won,old.won,'baseline win drift');assert.equal(b.died,old.died,'baseline death drift');assert.equal(b.timedOut,old.timeout,'baseline timeout drift');
 assert.equal(b.secondaryTargetDamage,old.secondary,'baseline AoE drift');assert.equal(b.damageDealt,old.damage,'baseline damage drift');
 const c=D.native(actor.snapshot,{...sc,researchRosterSource:candidate()},seed);
 for(const key of ['resolvedSeed','gearFingerprint','talentXp','pointsSpent','affinity','risk','initialEnemies'])assert.deepEqual(c[key],b[key],'paired '+key);
 assert.deepEqual(c.controlledTalentNodes,b.controlledTalentNodes);
 assert(c.groupPressure.peakPrincipals<=2,'more than two active principals');
 const principals=b.roster.filter(x=>x.role!=='minion');
 if(principals.length<=2){assert.deepEqual(c.roster,b.roster,'unchanged group roster drift');assert.equal(c.won,b.won,'unchanged group outcome drift');assert.equal(c.damageDealt,b.damageDealt,'unchanged group damage drift');}
 return {trial:i,size,actor:actor.seed,baseline:row(b),cap2:row(c)};
}
function summarize(rows){
 const baseline=rows.map(x=>x.baseline),cap2=rows.map(x=>x.cap2);
 const changed=rows.filter(x=>x.baseline.peakPrincipals>2);
 const details={baseline:stats(baseline),cap2:stats(cap2),changed:changed.length,lossToWin:rows.filter(x=>x.baseline.died&&x.cap2.won).length,winToLoss:rows.filter(x=>x.baseline.won&&x.cap2.died).length};
 for(const v of ['baseline','cap2']){const a=rows.map(x=>x[v]);details[v+'Wins']=stats(a.filter(x=>x.won));details[v+'Losses']=stats(a.filter(x=>x.died));}
 return details;
}
function oldSummary(a){
 const rr=a.rows.filter(x=>['normal-4','normal-5','normal-8','normal-12'].includes(x.scenario)).map(x=>({scenario:x.scenario,won:x.won,died:x.died,timeout:x.timeout,seconds:x.seconds,secondary:x.secondary,secondaryDot:x.secondaryDot,secondaryDps:x.seconds?x.secondary/x.seconds:0,secondaryShare:x.damage?x.secondary/x.damage:0,taken:x.taken,healed:num(x.metrics?.healingActual),barrierGenerated:num(x.metrics?.barrierGenerated),absorbed:num(x.metrics?.barrierAbsorbed)}));
 return Object.fromEntries(SIZES.map(size=>{const s=rr.filter(x=>x.scenario==='normal-'+size);return [size,{all:stats(s),wins:stats(s.filter(x=>x.won)),losses:stats(s.filter(x=>x.died))}];}));
}
function run(id,trials=TRIALS){
 assert(IDS.includes(id));assert(Number.isInteger(trials)&&trials>=1&&trials<=TRIALS);
 const {a,actors}=load(id),rows=[],file='reports/stage648b/'+id+'.json',old=oldSummary(a);
 const accountDetails=actors.map(x=>({seed:x.seed,weapon:x.snapshot.state.equip.weapon?.subtype,offhand:x.snapshot.state.equip.offhand?.subtype,armor:x.snapshot.state.equip.armor?.armorType,nodes:x.snapshot.state.automaticTalents.nodes,prepared:x.snapshot.state.automaticTalents.prepared,element:x.snapshot.state.automaticTalents.element,stats:x.snapshot.statSnapshot,capability:x.capability}));
 for(let i=0;i<trials;i++){for(const size of SIZES){
  try{rows.push(pair(a,actors[i%actors.length],i,size));}catch(error){write(file,{id,complete:false,rows,old,accountDetails,failure:{trial:i,size,error:String(error)}});throw error;}
 }if(i%10===9)write(file,{id,complete:false,rows,old,accountDetails});}
 write(file,{id,complete:true,trials,rows,old,accountDetails});
 console.log('STAGE648B_PROFILE='+JSON.stringify({id,actors:actors.length,results:Object.fromEntries(SIZES.map(size=>[size,summarize(rows.filter(r=>r.size===size))]))}));
}
function aggregate(){
 const dir='reports/stage648b',a=fs.readdirSync(dir,{recursive:true}).filter(x=>x.endsWith('.json')).map(x=>JSON.parse(fs.readFileSync(path.join(dir,x),'utf8')));
 assert.equal(new Set(a.map(x=>x.id)).size,a.length);const valid=a.filter(x=>x.complete);
 for(const x of valid){assert.equal(x.trials,TRIALS);assert.equal(x.rows.length,TRIALS*SIZES.length);assert.equal(new Set(x.rows.map(r=>r.trial+'/'+r.size)).size,x.rows.length);}
 const rows=valid.flatMap(x=>x.rows),missing=IDS.filter(id=>!valid.some(x=>x.id===id));
 const compact=x=>({n:x.n,winPct:x.winPct,seconds:x.seconds,secondaryDps:x.secondaryDps,secondaryShare:x.secondaryShare,healed:x.healed,absorbed:x.absorbed,firstPrincipalKill:x.firstPrincipalKill,threePrincipalSeconds:x.threePrincipalSeconds});
 const reduce=x=>({baseline:compact(x.baseline),cap2:compact(x.cap2),changed:x.changed,lossToWin:x.lossToWin,winToLoss:x.winToLoss,baselineWins:compact(x.baselineWins),baselineLosses:compact(x.baselineLosses),cap2Wins:compact(x.cap2Wins),cap2Losses:compact(x.cap2Losses)});
 const report={stage:'6.48B',baselineRun:45430920656,baselineFingerprint:OLD,source:S.sourceFingerprint().sha256,missing,pairs:rows.length,profiles:valid.map(x=>({id:x.id,accounts:x.accountDetails,original100:x.old,results:Object.fromEntries(SIZES.map(size=>[size,summarize(x.rows.filter(r=>r.size===size))]))})),all:Object.fromEntries(SIZES.map(size=>[size,summarize(rows.filter(r=>r.size===size))]))};
 write('reports/v013-stage648b-aoe-sustain.json',report);
 console.log('STAGE648B='+JSON.stringify({...report,profiles:report.profiles.map(x=>({id:x.id,accounts:x.accounts.length,results:Object.fromEntries(SIZES.map(size=>[size,reduce(x.results[size])]))})),all:Object.fromEntries(SIZES.map(size=>[size,reduce(report.all[size])]))}));
 assert.equal(missing.length,0,'missing cohorts '+missing.join(', '));
}
if(require.main===module){const [cmd,id,n]=process.argv.slice(2);if(cmd==='run')run(id,n===undefined?TRIALS:Number(n));else if(cmd==='aggregate')aggregate();else if(cmd==='smoke')run('balanced',2);else throw Error('unknown command');}
module.exports={candidate,row,stats,summarize};
