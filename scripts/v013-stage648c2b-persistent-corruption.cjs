'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const D=require('./v013-stage628-postcap-difficulty.cjs'),S=require('./simulate-progression.cjs');
const MODES=['baseline','persistent','persistent-after','persistent-burst'],SIZES=[4,5,8,12];
const SOURCE=fs.readFileSync('combat/v012-buildcraft.js','utf8');
function replace(s,a,b){assert.equal(s.split(a).length,2,'source anchor '+a.slice(0,100));return s.replace(a,b);}
function diagnosticSource(mode){
 assert(MODES.includes(mode));
 let s=SOURCE;
 const triggerStart=" if(specialized(b,'corruption_cycle')&&e.hp>0&&e.v012Rot?.length>=3";
 const start=s.indexOf(triggerStart),end=s.indexOf(" if(b.runtime.specialReprisal",start);
 assert(start>=0&&end>start);
 const trigger=s.slice(start,end);
 assert(trigger.includes("corruptionCycleConsumedRawRot"));
 const toxic=" if(rank(b,'toxic_touch')&&(c.player?.mp||0)>=1&&(b.cooldowns.toxicTouch??-1e10)<=c.now&&c.random()<values('toxic_touch',rank(b,'toxic_touch')).chance&&spendDarkMana(c,1)&&ready(b,'toxicTouch',c.now,1.3)&&activated(b,'toxic_touch'))applyRot(b,c,base*.065+Math.max(0,c.power||0)*.025,'paid_primary_toxic_touch');";
 // All counters are observer-only. Neither sampling nor target tracking consumes game RNG.
 const check=" if(specialized(b,'corruption_cycle')){const stacks=e.v012Rot?.length||0;const m=(k,v=1)=>c.metric?.('corruptionCycleDiagnostic'+k,v);m('AttackChecks');m('Stacks'+Math.min(6,stacks));if(e.hp<=0)m('DeadTarget');else if(stacks<3)m('InsufficientStacks');else if((c.player?.mp||0)<4)m('InsufficientMana');else if((b.cooldowns.corruptionCycle??-1e10)>c.now)m('Cooldown');else m('Eligible');}\n";
 const persistent=mode!=='baseline',isAfter=mode==='persistent-after'||mode==='persistent-burst',burst=mode==='persistent-burst';
 const cycle=burst?replace(trigger,"const rot=e.v012Rot.shift(),remaining=rot.damage*rot.remaining,raw=remaining+Math.max(0,c.power||0)*.20;","const spent=e.v012Rot.splice(0,3),remaining=spent.reduce((n,d)=>n+d.damage*(primaryPaidRot(d)?2:Math.min(2,d.remaining)),0),raw=remaining+Math.max(0,c.power||0)*.20;c.metric?.('decayPrimaryPaidPersistentBurstStacksConsumed',spent.length);"):trigger;
 s=replace(s,trigger,isAfter?'':check+cycle);
 s=replace(s,toxic,toxic+"\n if(rank(b,'toxic_touch')&&e.hp>0){const n=e.v012Rot?.length||0;c.metric?.('decayPrimaryPaidDiagnosticPostAttack'+Math.min(6,n),1);}\n"+(isAfter?check+cycle:''));
 // Instrument the pre-existing primary paid application, not free/secondary Rot.
 s=replace(s," if(d.primaryPaid)paidRotApplied(b,c,d);"," if(d.primaryPaid){c.metric?.('decayPrimaryPaidDiagnosticAppliedWithStacks'+Math.min(6,stacks.length),1);c.metric?.('decayPrimaryPaidDiagnosticRawPerStack',d.damage);c.metric?.('decayPrimaryPaidDiagnosticScheduledTicks',d.remaining);paidRotApplied(b,c,d);}");
 // Keep a finite original tick budget as the legacy detonation/transfer reference.
 // Only paid primary Toxic Touch stacks stop expiring. Never use Infinity.
 if(persistent){
  s=replace(s,"if(rot.every(s=>s.remaining<=1))e.incubationTicks=0;","if(rot.every(s=>!primaryPaidRot(s)&&s.remaining<=1))e.incubationTicks=0;");
  s=replace(s,"remaining:s.remaining-1,ticks:(s.ticks||0)+1","remaining:primaryPaidRot(s)?s.remaining:s.remaining-1,ticks:(s.ticks||0)+1");
  s=replace(s,"else if(b.element==='frost')e.v012Rot[0].remaining=","else if(b.element==='frost'&&!primaryPaidRot(e.v012Rot[0]))e.v012Rot[0].remaining=");
 }
 // Observer: first full stack cap per enemy, elapsed combat time and primary cap separately.
 s=replace(s," stacks.push(d);"," stacks.push(d);\n if(d.primaryPaid){const cap=6;const elapsed=Math.max(0,Number(c.player.combatSeconds??c.now)||0);if(stacks.length===cap&&!e.stage648c2bAnyCap){e.stage648c2bAnyCap=true;c.metric?.('decayPrimaryPaidPersistentAnyCapReached',1);c.metric?.('decayPrimaryPaidPersistentAnyCapSeconds',elapsed);}if(stacks.filter(primaryPaidRot).length===cap&&!e.stage648c2bPrimaryCap){e.stage648c2bPrimaryCap=true;c.metric?.('decayPrimaryPaidPersistentPrimaryCapReached',1);c.metric?.('decayPrimaryPaidPersistentPrimaryCapSeconds',elapsed);}}");
 s=replace(s,"  const rot=e.v012Rot;\n  const baseRot=","  const rot=e.v012Rot;\n  const expired=rot.filter(d=>primaryPaidRot(d)&&d.remaining<=1).length;\n  if(expired)c.metric?.('decayPrimaryPaidDiagnosticExpired',expired);\n  const hpBeforeRot=e.hp;\n  const baseRot=");
 if(persistent)s=replace(s,"const expired=rot.filter(d=>primaryPaidRot(d)&&d.remaining<=1).length;","const expired=0;");
 s=replace(s,"  c.dotDamage(damage,'☠ Rot',secondaryFraction);","  c.dotDamage(damage,'☠ Rot',secondaryFraction);\n  const actual=Math.max(0,hpBeforeRot-Math.max(0,e.hp));c.metric?.('decayPrimaryPaidDiagnosticAllRotDamage',actual);c.metric?.('decayPrimaryPaidDiagnosticRotTickEvents',1);");
 return s;
}
function read(dir,id){const files=fs.readdirSync(dir,{recursive:true}).filter(f=>path.basename(f)===id+'.json');assert.equal(files.length,1);return JSON.parse(fs.readFileSync(path.join(dir,files[0]),'utf8'));}
function write(file,data){fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(data,null,2)+'\n');}
function row(x){return {seed:x.resolvedSeed,gear:x.gearFingerprint,roster:x.roster,won:x.won,died:x.died,timeout:x.timedOut,seconds:x.seconds,hpEnd:x.hpEnd,hpMax:x.hpMax,damage:x.damageDealt,taken:x.damageTaken,secondary:x.secondaryTargetDamage,secondaryDot:x.secondaryDotDamage,targetSwitches:x.targetSwitches,manaSpent:x.manaSpent,funded:x.fundedCasts,unfunded:x.unfundedCasterAttacks,starved:x.affinityMetrics?.manaStarvedSeconds,healed:x.affinityMetrics?.healingActual,metrics:x.decayTalentMetrics,passives:x.affinityMetrics?.passiveActivations};}
function cases(){
 const earned=read('input/earned','decay-wand'),b=read('input/baseline','decay-wand');
 assert.equal(earned.id,'decay-wand');assert.equal(earned.source,'686cd06098af3ee950363030c809d08383832e4021f23568e2aa4bbf161b550f');
 assert(earned.complete&&b.complete);assert.equal(b.id,earned.id);assert.equal(b.rows.length,200);
 const actors=earned.accounts.filter(a=>a.snapshot);assert.equal(actors.length,2);
 assert.equal(actors.filter(a=>a.snapshot.state.automaticTalents.nodes.includes('corruption_cycle')).length,1);
 const cells=b.rows.map(c=>{const a=actors.find(a=>a.seed===c.actor);assert(a);return {key:'group/'+c.trial+'/'+c.size,a,scenario:{id:'normal-'+c.size,type:'normal',realm:'blood',size:c.size},seed:64791000+c.trial*101,old:c.calibrated};});
 for(const a of actors)for(let i=0;i<20;i++)for(const scenario of [{id:'normal-1',type:'normal',realm:'blood',size:1},{id:'tank',type:'elite',realm:'blood'},{id:'boss-decay',type:'boss',realm:'decay'}]){
  cells.push({key:scenario.id+'/'+a.seed+'/'+i,a,scenario,seed:64821000+i*101});
 }
 assert.equal(cells.length,320);assert.equal(new Set(cells.map(c=>c.key)).size,cells.length);
 return cells;
}
function run(mode,smoke=false){
 const source=diagnosticSource(mode);new Function(source);
 let cells=cases();if(smoke)cells=cells.filter(c=>c.a.snapshot.state.automaticTalents.nodes.includes('corruption_cycle')).slice(0,4);
 const rows=[],file='reports/stage648c2b/'+mode+'.json';
 for(const c of cells){
  try{
   const x=D.native(c.a.snapshot,{...c.scenario,researchBuildcraftSource:source},c.seed),v=row(x);
   if(c.old){
    assert.equal(v.seed,c.old.seed);assert.equal(v.gear,c.old.gear);
    if(mode==='baseline')for(const [k,k2] of [['won','won'],['died','died'],['timeout','timeout'],['damage','damage'],['secondary','secondary']])assert.equal(v[k],c.old[k2],'observer changed '+k);
   }
   const m=v.metrics||{},get=k=>m['corruptionCycleDiagnostic'+k]||0;
   assert.equal(get('AttackChecks'),get('DeadTarget')+get('InsufficientStacks')+get('InsufficientMana')+get('Cooldown')+get('Eligible'));
   assert((m.corruptionCycleActivations||0)<=get('Eligible'));
   rows.push({key:c.key,actor:c.a.seed,ownsCycle:c.a.snapshot.state.automaticTalents.nodes.includes('corruption_cycle'),scenario:c.scenario.id,...v});
  }catch(error){write(file,{mode,complete:false,rows,failure:{key:c.key,error:String(error)}});throw error;}
  if(rows.length%40===0)write(file,{mode,complete:false,rows});
 }
 write(file,{mode,complete:true,smoke,rows,source:S.sourceFingerprint().sha256});
 console.log('STAGE648C2B_ARM='+JSON.stringify({mode,smoke,fights:rows.length,owner:summarize(rows.filter(x=>x.ownsCycle)),other:summarize(rows.filter(x=>!x.ownsCycle))}));
}
function summarize(a){
 const resolved=a.filter(x=>x.won||x.died),mean=k=>a.length?a.reduce((n,x)=>n+(x[k]||0),0)/a.length:null;
 const sums={};for(const r of a)for(const [k,v]of Object.entries(r.metrics||{}))if(Number.isFinite(v))sums[k]=(sums[k]||0)+v;
 const get=k=>sums[k]||0;
 return {n:a.length,wins:a.filter(x=>x.won).length,winPct:resolved.length?100*a.filter(x=>x.won).length/resolved.length:null,timeouts:a.filter(x=>x.timeout).length,seconds:mean('seconds'),damage:mean('damage'),taken:mean('taken'),secondary:mean('secondary'),hpEnd:mean('hpEnd'),manaSpent:mean('manaSpent'),targetSwitches:mean('targetSwitches'),cycleActiveFights:a.filter(r=>r.metrics?.corruptionCycleActivations>0).length,cycleActivations:get('corruptionCycleActivations'),cycleDamage:get('corruptionCycleDamage'),dps:a.length?a.reduce((n,x)=>n+(x.seconds>0?x.damage/x.seconds:0),0)/a.length:null,primaryCapReached:get('decayPrimaryPaidPersistentPrimaryCapReached'),primaryCapMeanSeconds:get('decayPrimaryPaidPersistentPrimaryCapReached')?get('decayPrimaryPaidPersistentPrimaryCapSeconds')/get('decayPrimaryPaidPersistentPrimaryCapReached'):null,anyCapReached:get('decayPrimaryPaidPersistentAnyCapReached'),anyCapMeanSeconds:get('decayPrimaryPaidPersistentAnyCapReached')?get('decayPrimaryPaidPersistentAnyCapSeconds')/get('decayPrimaryPaidPersistentAnyCapReached'):null,burstStacksConsumed:get('decayPrimaryPaidPersistentBurstStacksConsumed'),rawRotDamage:get('decayPrimaryPaidDiagnosticAllRotDamage'),paidApplications:get('decayPrimaryPaidApplications'),expired:get('decayPrimaryPaidDiagnosticExpired'),sums};
}
function aggregate(){
 const arms=Object.fromEntries(MODES.map(mode=>{const a=JSON.parse(fs.readFileSync('reports/stage648c2b/'+mode+'.json','utf8'));assert(a.complete&&!a.smoke&&a.mode===mode);assert.equal(a.rows.length,320);assert.equal(new Set(a.rows.map(r=>r.key)).size,320);return [mode,a];}));
 assert.equal(new Set(Object.values(arms).map(a=>a.source)).size,1);
 const baseline=arms.baseline.rows,report={stage:'6.48C.2B',source:arms.baseline.source,fights:1280,byArm:{}};
 for(const mode of MODES){
  const a=arms[mode].rows;
  for(let i=0;i<a.length;i++){const x=a[i],b=baseline[i];for(const k of ['key','actor','ownsCycle','scenario','seed','gear'])assert.equal(x[k],b[k],'pair '+k);assert.deepEqual(x.roster,b.roster,'pair roster');}
  // Without owning Cycle, moving its check must have no gameplay effect.
  if(mode==='persistent-after'||mode==='persistent-burst'){const control=arms[mode==='persistent-after'?'persistent':'persistent-after'].rows;for(let i=0;i<a.length;i++)if(!a[i].ownsCycle)for(const k of ['won','died','timeout','damage','secondary','seconds'])assert.equal(a[i][k],control[i][k],'non-owner order drift '+k);}
  report.byArm[mode]={owner:summarize(a.filter(x=>x.ownsCycle)),other:summarize(a.filter(x=>!x.ownsCycle)),byScenario:Object.fromEntries([...new Set(a.map(x=>x.scenario))].map(sc=>[sc,{owner:summarize(a.filter(x=>x.scenario===sc&&x.ownsCycle)),other:summarize(a.filter(x=>x.scenario===sc&&!x.ownsCycle))}])),lossToWin:a.filter((x,i)=>x.won&&baseline[i].died).length,winToLoss:a.filter((x,i)=>x.died&&baseline[i].won).length};
 }
 write('reports/v013-stage648c2b-persistent-corruption.json',report);
 console.log('STAGE648C2B='+JSON.stringify(report));
}
if(require.main===module){const [cmd,mode]=process.argv.slice(2);if(cmd==='run')run(mode);else if(cmd==='smoke')for(const m of MODES)run(m,true);else if(cmd==='aggregate')aggregate();else throw Error('unknown command');}
module.exports={diagnosticSource,MODES,summarize};
