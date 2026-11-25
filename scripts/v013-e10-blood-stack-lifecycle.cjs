'use strict';
// Research only: native combat with one payload removed at a time, retaining legal talent allocation.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const S=require('./simulate-progression.cjs'),G=require('./v013-global-e10.cjs'),Balance=require('./v013-balance-criteria.cjs');
const CUSTOM=[['blood-bow','bow',['blood_transfer','sanguine_fury','executioner']],['blood-mace','mace',['blood_drinker','heart_of_carnage','sanguine_reserve']],['blood-sword-reserve','sword',['sanguine_reserve','blood_drinker','blood_harvest']],['blood-daggers-crit','daggers',['sanguine_fury','executioner','bleeding_edge']],['blood-twohand-transfer','twohand',['blood_transfer','cleave_mastery','deep_cuts']]];
for(const [id,w,skills] of CUSTOM)G.P[id]={id,families:['blood'],w,skills,role:'audit'};
const IDS=['blood-daggers','blood-sword','blood-twohand',...CUSTOM.map(x=>x[0])];
const ABILITIES=['bleeding_edge','deep_cuts','executioner','blood_drinker','sanguine_fury','blood_transfer','blood_harvest','crimson_feast','heart_of_carnage','accelerated_bleeding','cleave_mastery','sanguine_reserve'];
const N=100,SC=['normal-1','normal-4','normal-8','normal-12','elite','boss'],F=['blood','decay','vitality','aegis','fury','magic'],ELITES=G.SC.filter(x=>x.kind==='elite').map(x=>x.elite);
const OUT='reports/e10-blood-stack-lifecycle';
const B=fs.readFileSync('combat/v012-buildcraft.js','utf8'),R=fs.readFileSync('combat/v012-combat-runtime.js','utf8');
function rep(s,a,b){assert.equal(s.split(a).length,2,'missing/ambiguous source anchor '+a);return s.replace(a,b);}
function owned(p,id){return p.t.nodes.includes(id);}
function arms(p){return ['native','affinity-bleed','minor-bleed-bonus',...ABILITIES.filter(id=>owned(p,id))];}

function runtimeSource(){
 let s=R;
 const helpers="const bloodObserved=new WeakMap(),bloodEverCap=new WeakSet(),bloodEverApplied=new WeakSet();\nfunction bloodCount(r,e,key,n=1){if(!r||!Number.isFinite(n)||!n)return;const m=r.bloodStackAudit??={};m[key]=(m[key]||0)+n;const kind=e?.boss?'boss':e?.miniboss?'elite':'normal';const k=kind+'_'+key;m[k]=(m[k]||0)+n;}\nfunction bloodN(e){return (e.dots?.bleed||[]).filter(d=>d.remaining>0).length;}\nfunction bloodObserve(e){const r=ports.state.run;if(!r||e.hp<=0)return;const n=bloodN(e),before=bloodObserved.get(e)||0;bloodObserved.set(e,n);if(n>0&&!bloodEverApplied.has(e)){bloodEverApplied.add(e);bloodCount(r,e,'enemiesBled');}if(n>=12&&before<12){bloodCount(r,e,'capEntries');if(!bloodEverCap.has(e)){bloodEverCap.add(e);bloodCount(r,e,'uniqueCapEnemies');}}if(n>before)bloodCount(r,e,'positiveStackTransitions',n-before);const m=r.bloodStackAudit??={};m.peakStacks=Math.max(m.peakStacks||0,n);}\nfunction bloodExpire(r,e,before,after){if(before<=after)return;bloodCount(r,e,'expiredStacks',before-after);if(after===0){bloodCount(r,e,e.hp>0?'expiredToZeroAlive':'expiredToZeroLethal');}}\nfunction bloodSample(r,dt){for(const e of r.enemies||[r.enemy])if(e&&e.hp>0){const n=bloodN(e);bloodCount(r,e,'observedEnemySeconds',dt);bloodCount(r,e,'stackSeconds',n*dt);if(n>0)bloodCount(r,e,'bleedingEnemySeconds',dt);if(n>=12)bloodCount(r,e,'atCapSeconds',dt);bloodCount(r,e,'hist_'+Math.min(12,n),dt);}}\n";
 s=rep(s,"function synchronizeDots(enemy){",helpers+"function synchronizeDots(enemy){");
 s=rep(s," enemy[key+'Stacks']=active.length;\n }\n}"," enemy[key+'Stacks']=active.length;\n }\n bloodObserve(enemy);\n}");
 s=rep(s,"const dots=enemy.dots?.bleed||[];let raw=0;","const dots=enemy.dots?.bleed||[],before=bloodN(enemy);let raw=0;");
 s=rep(s,"enemy.hp-=damage;ports.phase6Metric(r,'damageDealt',actual);","enemy.hp-=damage;bloodExpire(r,enemy,before,bloodN(enemy));ports.phase6Metric(r,'damageDealt',actual);");
 s=rep(s,"const applied=Math.round(ports.tickDots(e)*(root.WandererV013ExpeditionBoons?.dotFactor(r)||1));","const before=bloodN(e),applied=Math.round(ports.tickDots(e)*(root.WandererV013ExpeditionBoons?.dotFactor(r)||1));");
 s=rep(s,"e.hp-=applied;ports.addLog('☠️ Damage over time: '","e.hp-=applied;bloodExpire(r,e,before,bloodN(e));ports.addLog('☠️ Damage over time: '");
 s=rep(s,"const rawDots=ports.tickDots(mob);","const before=bloodN(mob),rawDots=ports.tickDots(mob);");
 s=rep(s,"mob.hp-=damage;if(damage>0)ports.floatText(damage,'enemy',false,bleeding?","mob.hp-=damage;bloodExpire(r,mob,before,bloodN(mob));if(damage>0)ports.floatText(damage,'enemy',false,bleeding?");
 s=rep(s," advanceAcceleratedBleed(r,dt);"," bloodSample(r,dt);advanceAcceleratedBleed(r,dt);");
 return s;
}
const OBS=runtimeSource();new Function(OBS);
function cell(p,sc,i,arm){
 const kind=sc.startsWith('normal')?'normal':sc,size=kind==='normal'?Number(sc.split('-')[1]):undefined;
 const family=F[i%F.length],elite=kind==='elite'?ELITES[i%ELITES.length]:undefined,seed=65901001+i*101;
 const build={id:p.id,weapon:p.weapon,families:p.families,skills:[]};
 
 const opts={mode:'encounter',points:30,gear:'current',rarity:'Rare',runes:false,contracts:'none',targetPolicy:'mechanics',measure:true,tickLimit:6500,lockScenarioStreams:true,controlledTalents:p.t,armorType:p.armorType,offhandType:p.offhandType,...(elite?{stage619EliteType:elite}:{}),...(arm?{stageArmorRuntimeSource:OBS}:{})};
 const x=S.encounter(10,build,seed,kind,opts,undefined,undefined,family,1,size);
 assert.equal(x.level,10);assert.equal(x.pointsSpent,30);assert.deepEqual(x.controlledTalentNodes,p.t.nodes);assert.equal(x.affinity,family);assert.equal(x.armorType,p.armorType);assert.equal(x.offhandType,p.offhandType);assert(x.won||x.died||x.timedOut);
 if(elite)assert.equal(x.eliteType,elite);if(kind==='boss')assert.equal(x.bossAffinity,family);if(size)assert.equal(x.requestedGroupSize,size);
 return {sc,seed,resolved:x.resolvedSeed,realm:family,gear:x.gearFingerprint,roster:x.roster,roles:x.initialRoles,trait:x.traitId,condition:x.conditionId,bossMods:x.bossModifierIds,elite:x.eliteType,boss:x.bossId,won:x.won,died:x.died,timeout:x.timedOut,seconds:x.seconds,damage:x.damageDealt,taken:x.damageTaken,secondary:x.secondaryTargetDamage,secondaryDot:x.secondaryDotDamage,healed:x.affinityMetrics?.healingActual||0,hpEnd:x.hpEnd,hpMax:x.hpMax,stats:x.heroBaseStats,metrics:x.bloodStackAudit||{},passives:x.affinityMetrics?.passiveActivations||{},attacks:x.affinityMetrics?.attackCalls||0};
}

const EXPECTED={'blood-daggers':[291,41,27],'blood-sword':[360,65,47],'blood-twohand':[203,9,19],'blood-bow':[180,17,17],'blood-mace':[317,64,50],'blood-sword-reserve':[347,61,45],'blood-daggers-crit':[305,56,39],'blood-twohand-transfer':[272,16,28]};
function compare(a,b){for(const k of Object.keys(a))if(k!=='metrics')assert.deepEqual(a[k],b[k],'observer drift '+k);}
function summarize(rows){
 const sums={};for(const r of rows)for(const [k,v] of Object.entries(r.metrics)){assert(Number.isFinite(v)&&v>=0,k);if(k==='peakStacks')sums[k]=Math.max(sums[k]||0,v);else sums[k]=(sums[k]||0)+v;}
 const sum=k=>sums[k]||0, n=rows.length;const metrics={...sums,capEntries:sum('capEntries'),uniqueCapEnemies:sum('uniqueCapEnemies'),expiredToZeroAlive:sum('expiredToZeroAlive'),expiredToZeroLethal:sum('expiredToZeroLethal'),expiredStacks:sum('expiredStacks'),enemiesBled:sum('enemiesBled'),fightsAtCap:rows.filter(r=>r.metrics.capEntries>0).length,fightsWithExpiry:rows.filter(r=>r.metrics.expiredToZeroAlive>0).length,meanStacks:sum('stackSeconds')/Math.max(1e-12,sum('observedEnemySeconds')),meanWhileBleeding:sum('stackSeconds')/Math.max(1e-12,sum('bleedingEnemySeconds')),uptimePct:100*sum('bleedingEnemySeconds')/Math.max(1e-12,sum('observedEnemySeconds')),histogram:Array.from({length:13},(_,i)=>sum('hist_'+i))};
 assert(metrics.peakStacks<=12);assert(metrics.uniqueCapEnemies<=metrics.enemiesBled);assert(metrics.uniqueCapEnemies<=metrics.capEntries);assert(metrics.expiredToZeroAlive+metrics.expiredToZeroLethal<=metrics.expiredStacks);
 assert(Math.abs(metrics.histogram.reduce((a,b)=>a+b,0)-sum('observedEnemySeconds'))<1e-5*Math.max(1,sum('observedEnemySeconds')));
 return {n,wins:rows.filter(r=>r.won).length,metrics};
}
function run(id,n=N){const p=G.profile(id),rows=[];for(const sc of SC)for(let i=0;i<n;i++){const a=cell(p,sc,i,'observe');if(i===0)compare(a,cell(p,sc,i,null));rows.push(a);}
 const grouped=Object.fromEntries(['all','normal',...SC].map(sc=>[sc,summarize(rows.filter(r=>sc==='all'||(sc==='normal'?r.sc.startsWith('normal'):r.sc===sc)))]));
 if(n===N)assert.deepEqual(['normal','elite','boss'].map(k=>grouped[k].wins),EXPECTED[id],'baseline drift from completed Blood audit');
 const x={id,n,source:S.sourceFingerprint().sha256,grouped,rows};fs.mkdirSync(OUT,{recursive:true});fs.writeFileSync(path.join(OUT,id+'.json'),JSON.stringify(x));console.log('BLOOD_STACK_PROFILE='+JSON.stringify({...x,rows:undefined}));
}
function smoke(){for(const id of IDS)run(id,1);console.log('BLOOD_STACK_SMOKE_OK');}
function aggregate(){const profiles=IDS.map(id=>JSON.parse(fs.readFileSync(path.join(OUT,id+'.json'))));assert.equal(new Set(profiles.map(x=>x.source)).size,1);for(const x of profiles){assert.equal(x.n,N);assert.equal(x.rows.length,N*SC.length);assert.equal(new Set(x.rows.map(r=>r.sc+'/'+r.seed)).size,x.rows.length);console.log('BLOOD_STACK_PROFILE='+JSON.stringify({...x,rows:undefined}));}
 const summary={n:profiles.reduce((n,x)=>n+x.rows.length,0),overall:summarize(profiles.flatMap(x=>x.rows)),profiles:profiles.map(({rows,...x})=>x)};fs.writeFileSync(path.join(OUT,'summary.json'),JSON.stringify(summary));console.log('BLOOD_STACK_OVERVIEW='+JSON.stringify({n:summary.n,overall:summary.overall}));}
const [cmd,id]=process.argv.slice(2);if(cmd==='smoke')smoke();else if(cmd==='run')run(id);else if(cmd==='aggregate')aggregate();else throw Error('unknown command');
