'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const D=require('./v013-stage628-postcap-difficulty.cjs'),S=require('./simulate-progression.cjs');
const IDS=["cautious","balanced","plate-warden","cloth-battlemage","leather-duelist","hexblade-hybrid","smart-blood-pure","smart-fury-daggers","smart-vitality-pure","smart-aegis-vitality","smart-magic-arcane-pure","smart-magic-fire-pure","magic-frost","smart-magic-lightning-pure","smart-decay-magic-aegis","smart-blood-sword","smart-blood-fury","smart-blood-fury-vitality","smart-blood-fury-vitality-no-mixed","smart-fury-blood-aegis","smart-fury-pure","smart-magic-fire-aegis","smart-magic-frost-vitality","smart-magic-wand","smart-magic-staff","smart-magic-wand-offense","smart-magic-wand-defense","decay-wand","decay-two-handed","aegis-sword-shield","aegis-mace-shield","aegis-wand-orb","vitality-sword-charm","vitality-staff","magic-sword-infusion"],SIZES=[4,5,8,12],TRIALS=50,OLD='686cd06098af3ee950363030c809d08383832e4021f23568e2aa4bbf161b550f';

// Pure experimental scheduling, used only inside the isolated native VM.
function isPrincipal(e){return !!e&&['tank','skirmisher','caster'].includes(e.role)&&!e.boss&&!e.miniboss;}
function schedule(group,random,cap,keepFirst=false){
 const list=group.slice(),locked=keepFirst?1:0;
 if(list.length>4)for(let i=list.length-1;i>locked;i--){const j=locked+Math.floor(random()*(i-locked+1));[list[i],list[j]]=[list[j],list[i]];}
 const field=[],reserve=[];let principals=0;
 for(const e of list){
  if(field.length<4&&(!cap||!isPrincipal(e)||principals<cap)){field.push(e);if(isPrincipal(e))principals++;}
  else reserve.push(e);
 }
 return {field,reserve};
}
function nextReinforcement(queue,field,cap){
 if(!queue?.length)return null;
 const count=field.filter(e=>e.hp>0&&isPrincipal(e)).length;
 const i=cap&&count>=cap?queue.findIndex(e=>!isPrincipal(e)):0;
 return i<0?null:queue.splice(i,1)[0];
}

const runtimeSource=fs.readFileSync('online/v012-expedition-runtime.js','utf8');
function candidate(mode){
 assert(['random','cap2'].includes(mode));
 const cap=mode==='cap2'?2:0;
 const anchor='function create(ports){';
 assert.equal(runtimeSource.split(anchor).length,2);
 let s=runtimeSource.replace(anchor,[isPrincipal,schedule,nextReinforcement].map(f=>f.toString()).join('\n')+'\n'+anchor);
 const start=' const fieldCount=Math.min(4,group.length);';
 assert.equal(s.split(start).length,2);
 s=s.replace(start," let fieldCount=Math.min(4,group.length);\n r.stage648b1Cap=0;\n if(!g.selected.boss&&!g.selected.elite&&group.length>=4){\n  const random=globalThis.WandererV013ExpeditionFoundation.rng(g.dungeon?.foundationManifest?.seed??0,'stage648b1_schedule_'+theme.id+'_'+(g.selected.node??g.planeIndex)+'_'+group.length);\n  const ordered=schedule(group,random,@CAP@,hasVanguard);\n  group.splice(0,group.length,...ordered.field,...ordered.reserve);fieldCount=ordered.field.length;\n  group.forEach((e,i)=>{e.groupSlot=i<fieldCount?i:-1;});\n  r.stage648b1Cap=@CAP@;\n }".replaceAll('@CAP@',String(cap)));
 const refill='for(const fallen of dead){const replacement=r.groupReserve?.shift();';
 assert.equal(s.split(refill).length,2);
 s=s.replace(refill,'for(const fallen of (r.stage648b1Cap?r.enemies.filter(e=>e.hp<=0&&e.groupDefeated):dead)){const replacement=r.stage648b1Cap?nextReinforcement(r.groupReserve,r.enemies,r.stage648b1Cap):r.groupReserve?.shift();');
 return s;
}

function selftest(){
 const rng=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 let checked=0,held=0,distributed=0;
 for(let n=4;n<=22;n++)for(let seed=1;seed<=40;seed++){
  const count=Math.min(n,2+seed%3),group=Array.from({length:n},(_,i)=>({id:i,role:i<count?'tank':'minion',hp:10}));
  for(const cap of [0,2]){
   const out=schedule(group,rng(seed),cap,seed%2===0),field=out.field,queue=out.reserve;
   assert.equal(new Set([...field,...queue]).size,n);assert.equal(field.length+queue.length,n);
   if(cap)assert(field.filter(isPrincipal).length<=2);
   if(seed%2===0)assert.equal(field[0],group[0]);
   if(!cap&&n>4&&queue.some(isPrincipal))distributed++;
   const killed=new Set();
   while(field.some(e=>e.hp>0)){
    const living=field.filter(e=>e.hp>0),target=(cap?living.find(e=>!isPrincipal(e)):null)||living[0];
    target.hp=0;killed.add(target.id);
    for(let i=0;i<field.length;i++)if(field[i].hp<=0){
     const next=nextReinforcement(queue,field,cap);
     if(next)field[i]=next;else if(queue.length)held++;
    }
    if(cap)assert(field.filter(e=>e.hp>0&&isPrincipal(e)).length<=2);
   }
   assert.equal(queue.length,0,'stranded reserve');assert.equal(killed.size,n,'lost actor');
   for(const e of group)e.hp=10;checked++;
  }
 }
 assert(held>0&&distributed>0);
 for(const mode of ['random','cap2'])new Function(candidate(mode));
 console.log('STAGE648B1_SELFTEST='+JSON.stringify({checked,held,distributed}));
}
const num=x=>Number.isFinite(x)?x:null;
function mean(xs,key){const a=xs.map(x=>x[key]).filter(Number.isFinite);return a.length?a.reduce((s,n)=>s+n,0)/a.length:null;}
function metric(r,k){return num(r.affinityMetrics?.[k]);}
function row(r){
 const p=r.groupPressure,sec=r.seconds||0;
 return {won:r.won,died:r.died,timeout:r.timedOut,seconds:sec,firstKill:r.firstKillSeconds,
  firstPrincipalKill:p?.firstPrincipalKill,firstMinionKill:p?.firstMinionKill,peakPrincipals:p?.peakPrincipals,initialPrincipals:p?.initialPrincipals,initialReservePrincipals:p?.initialReservePrincipals,principalsEntered:p?.principalsEntered,underfilledSeconds:p?.underfilledSeconds,remainingReserve:p?.remainingReserve,remainingActors:p?.remainingActors,principalSeconds:p?.principalSeconds,threePrincipalSeconds:p?.threePrincipalSeconds,minionOnlySeconds:p?.minionOnlySeconds,
  damage:r.damageDealt,secondary:r.secondaryTargetDamage,secondaryDot:r.secondaryDotDamage,secondaryDps:sec?r.secondaryTargetDamage/sec:0,secondaryShare:r.damageDealt?r.secondaryTargetDamage/r.damageDealt:0,
  taken:r.damageTaken,absorbed:r.absorbed,healed:metric(r,'healingActual'),barrierGenerated:metric(r,'barrierGenerated'),healingPerSecond:sec&&metric(r,'healingActual')!==null?metric(r,'healingActual')/sec:null,barrierAbsorbedPerSecond:sec?r.absorbed/sec:0,
  hpMax:r.hpMax,hpEnd:r.hpEnd,minHpPct:r.minHpPct,guardEvents:metric(r,'guardLogEvents'),attackCalls:metric(r,'attackCalls'),
  initialRoles:r.initialRoles,initialVisible:r.initialVisible,reinforcements:r.reinforcementsSpawned,rosterHp:r.roster.reduce((a,x)=>a+x.maxHp,0),
  initialPrincipalAttack:r.roster.filter(x=>x.role!=='minion').reduce((a,x)=>a+x.attack,0),passives:r.affinityMetrics?.passiveActivations||{},decay:r.decayTalentMetrics,magic:r.magicAdaptiveMetrics,defensive:r.defensiveTalentMetrics,seed:r.resolvedSeed,gear:r.gearFingerprint};
}
function stats(a){
 const v=a.filter(x=>x.won||x.died);
 const out={n:a.length,wins:v.filter(x=>x.won).length,winPct:v.length?100*v.filter(x=>x.won).length/v.length:null,timeouts:a.filter(x=>x.timeout).length};
 for(const key of ['seconds','firstKill','firstPrincipalKill','firstMinionKill','peakPrincipals','initialPrincipals','initialReservePrincipals','principalsEntered','underfilledSeconds','remainingReserve','remainingActors','principalSeconds','threePrincipalSeconds','minionOnlySeconds','damage','secondary','secondaryDot','secondaryDps','secondaryShare','taken','absorbed','healed','barrierGenerated','healingPerSecond','barrierAbsorbedPerSecond','hpMax','hpEnd','minHpPct','guardEvents','attackCalls','rosterHp','initialPrincipalAttack','reinforcements'])out[key]=mean(v,key);
 return out;
}
function write(file,data){fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(data,null,2)+'\n');}
function load(id){
 const files=fs.readdirSync('input/earned',{recursive:true}).filter(x=>path.basename(x)===id+'.json');
 assert.equal(files.length,1,'missing prior shard '+id);
 const a=JSON.parse(fs.readFileSync(path.join('input/earned',files[0]),'utf8'));
 assert.equal(a.id,id);assert.equal(a.source,OLD);assert(a.complete);assert.equal(a.trials,100);
 assert.equal(a.accounts.length,5);
 const actors=a.accounts.filter(x=>x.snapshot);assert(actors.length,'missing E10 snapshots '+id);
 const previousFiles=fs.readdirSync('input/baseline',{recursive:true}).filter(x=>path.basename(x)===id+'.json');
 assert.equal(previousFiles.length,1);
 const previous=JSON.parse(fs.readFileSync(path.join('input/baseline',previousFiles[0]),'utf8'));
 assert.equal(previous.id,id);assert(previous.complete);assert.equal(previous.trials,TRIALS);assert.equal(previous.rows.length,TRIALS*SIZES.length);
 return {a,actors,previous};
}

function pair(a,previous,actor,i,size){
 const sc={id:'normal-'+size,type:'normal',realm:'blood',size},seed=64791000+i*101;
 const old=a.rows.find(x=>x.trial===i&&x.scenario===sc.id);
 const oldPair=previous.rows.find(x=>x.trial===i&&x.size===size);
 assert(old&&oldPair&&old.naturalSeed===actor.seed&&oldPair.actor===actor.seed,'baseline provenance');
 const b=oldPair.baseline;
 assert.equal(b.seed,old.seed,'baseline seed drift');assert.equal(b.gear,old.gear,'baseline gear drift');
 assert.equal(b.won,old.won,'baseline win drift');assert.equal(b.died,old.died,'baseline death drift');assert.equal(b.timeout,old.timeout,'baseline timeout drift');
 assert.equal(b.secondary,old.secondary,'baseline AoE drift');assert.equal(b.damage,old.damage,'baseline damage drift');
 const nativeBase=i===0?D.native(actor.snapshot,sc,seed):null;
 if(nativeBase){assert.equal(nativeBase.won,b.won);assert.equal(nativeBase.damageDealt,b.damage);assert.equal(nativeBase.secondaryTargetDamage,b.secondary);}
 const sorted=x=>x.roster.map(e=>JSON.stringify(e)).sort();
 const variants={};let previousNative=null;
 for(const mode of ['random','cap2']){
  const c=D.native(actor.snapshot,{...sc,researchExpeditionSource:candidate(mode)},seed);
  assert.equal(c.resolvedSeed,old.seed);assert.equal(c.gearFingerprint,old.gear);assert.equal(c.initialEnemies,size);
  assert.deepEqual(c.controlledTalentNodes,actor.snapshot.state.automaticTalents.nodes);
  assert.deepEqual(c.initialRoles,b.initialRoles,'roster counts changed');
  assert.equal(c.roster.reduce((sum,e)=>sum+e.maxHp,0),b.rosterHp,'roster HP changed');
  assert.equal(c.roster.filter(e=>e.role!=='minion').reduce((sum,e)=>sum+e.attack,0),b.initialPrincipalAttack,'principal attack changed');
  if(nativeBase)assert.deepEqual(sorted(c),sorted(nativeBase),'native roster changed');
  if(previousNative)assert.deepEqual(sorted(c),sorted(previousNative),'variant roster changed');
  if(mode==='cap2')assert(c.groupPressure.peakPrincipals<=2,'cap violation');
  if(c.won){assert.equal(c.groupPressure.remainingReserve,0,'premature win: reserves');assert.equal(c.groupPressure.remainingActors,0,'premature win: actors');}
  assert(c.peakVisibleEnemies<=4,'arena overflow');
  variants[mode]=row(c);previousNative=c;
 }
 return {trial:i,size,actor:actor.seed,baseline:nativeBase?row(nativeBase):b,reducedTotal:oldPair.cap2,...variants};
}
function summarize(rows){
 const out={};
 for(const v of ['baseline','random','cap2','reducedTotal']){
  const a=rows.map(x=>x[v]);out[v]=stats(a);out[v+'Wins']=stats(a.filter(x=>x.won));out[v+'Losses']=stats(a.filter(x=>x.died));
  if(v!=='baseline')out[v+'Transitions']={lossToWin:rows.filter(x=>x.baseline.died&&x[v].won).length,winToLoss:rows.filter(x=>x.baseline.won&&x[v].died).length};
 }
 return out;
}
function oldSummary(a){
 const rr=a.rows.filter(x=>['normal-4','normal-5','normal-8','normal-12'].includes(x.scenario)).map(x=>({scenario:x.scenario,won:x.won,died:x.died,timeout:x.timeout,seconds:x.seconds,secondary:x.secondary,secondaryDot:x.secondaryDot,secondaryDps:x.seconds?x.secondary/x.seconds:0,secondaryShare:x.damage?x.secondary/x.damage:0,taken:x.taken,healed:num(x.metrics?.healingActual),barrierGenerated:num(x.metrics?.barrierGenerated),absorbed:num(x.metrics?.barrierAbsorbed)}));
 return Object.fromEntries(SIZES.map(size=>{const s=rr.filter(x=>x.scenario==='normal-'+size);return [size,{all:stats(s),wins:stats(s.filter(x=>x.won)),losses:stats(s.filter(x=>x.died))}];}));
}
function run(id,trials=TRIALS){
 assert(IDS.includes(id));assert(Number.isInteger(trials)&&trials>=1&&trials<=TRIALS);
 const {a,actors,previous}=load(id),rows=[],file='reports/stage648b1/'+id+'.json',old=oldSummary(a);
 const accountDetails=actors.map(x=>({seed:x.seed,weapon:x.snapshot.state.equip.weapon?.subtype,offhand:x.snapshot.state.equip.offhand?.subtype,armor:x.snapshot.state.equip.armor?.armorType,nodes:x.snapshot.state.automaticTalents.nodes,prepared:x.snapshot.state.automaticTalents.prepared,element:x.snapshot.state.automaticTalents.element,stats:x.snapshot.statSnapshot,capability:x.capability}));
 for(let i=0;i<trials;i++){for(const size of SIZES){
  try{rows.push(pair(a,previous,actors[i%actors.length],i,size));}catch(error){write(file,{id,complete:false,rows,old,accountDetails,failure:{trial:i,size,error:String(error)}});throw error;}
 }if(i%10===9)write(file,{id,complete:false,rows,old,accountDetails});}
 write(file,{id,complete:true,trials,rows,old,accountDetails});
 console.log('STAGE648B1_PROFILE='+JSON.stringify({id,actors:actors.length,results:Object.fromEntries(SIZES.map(size=>[size,summarize(rows.filter(r=>r.size===size))]))}));
}
function aggregate(){
 const dir='reports/stage648b1',a=fs.readdirSync(dir,{recursive:true}).filter(x=>x.endsWith('.json')).map(x=>JSON.parse(fs.readFileSync(path.join(dir,x),'utf8')));
 assert.equal(new Set(a.map(x=>x.id)).size,a.length);const valid=a.filter(x=>x.complete);
 for(const x of valid){assert.equal(x.trials,TRIALS);assert.equal(x.rows.length,TRIALS*SIZES.length);assert.equal(new Set(x.rows.map(r=>r.trial+'/'+r.size)).size,x.rows.length);}
 const rows=valid.flatMap(x=>x.rows),missing=IDS.filter(id=>!valid.some(x=>x.id===id));
 const compact=x=>({n:x.n,winPct:x.winPct,timeouts:x.timeouts,seconds:x.seconds,secondaryDps:x.secondaryDps,secondaryShare:x.secondaryShare,healed:x.healed,absorbed:x.absorbed,initialPrincipals:x.initialPrincipals,initialReservePrincipals:x.initialReservePrincipals,peakPrincipals:x.peakPrincipals,threePrincipalSeconds:x.threePrincipalSeconds,underfilledSeconds:x.underfilledSeconds,principalsEntered:x.principalsEntered});
 const reduce=x=>Object.fromEntries(Object.entries(x).map(([k,v])=>[k,k.endsWith('Transitions')?v:compact(v)]));
 const report={stage:'6.48B.1',baselineRun:45440574236,earnedRun:45430920656,baselineFingerprint:OLD,source:S.sourceFingerprint().sha256,missing,pairs:rows.length,profiles:valid.map(x=>({id:x.id,accounts:x.accountDetails,original100:x.old,results:Object.fromEntries(SIZES.map(size=>[size,summarize(x.rows.filter(r=>r.size===size))]))})),all:Object.fromEntries(SIZES.map(size=>[size,summarize(rows.filter(r=>r.size===size))]))};
 write('reports/v013-stage648b1-distribution.json',report);
 console.log('STAGE648B1='+JSON.stringify({...report,profiles:report.profiles.map(x=>({id:x.id,accounts:x.accounts.length,results:Object.fromEntries(SIZES.map(size=>[size,reduce(x.results[size])]))})),all:Object.fromEntries(SIZES.map(size=>[size,reduce(report.all[size])]))}));
 assert.equal(missing.length,0,'missing cohorts '+missing.join(', '));
}
if(require.main===module){const [cmd,id,n]=process.argv.slice(2);if(cmd==='run')run(id,n===undefined?TRIALS:Number(n));else if(cmd==='aggregate')aggregate();else if(cmd==='smoke'){selftest();run('balanced',2);}else if(cmd==='selftest')selftest();else throw Error('unknown command');}
module.exports={candidate,row,stats,summarize,schedule,nextReinforcement,selftest};
