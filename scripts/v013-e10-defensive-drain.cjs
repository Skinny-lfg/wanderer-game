'use strict';
// E10 diagnostics only. No production source edits and no fabricated natural progression.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const S=require('./simulate-progression.cjs'),G=require('./v013-global-e10.cjs'),{T,buy}=require('../tests/v013-current-talent-helper.cjs');
const OUT='reports/e10-defensive-drain',N=100,ROUTES=30,POINTS=30,LEVEL=10;
const F=['blood','decay','vitality','aegis','fury','magic'],ELITES=G.SC.filter(x=>x.kind==='elite').map(x=>x.elite);
const SC=['normal-1','normal-4','normal-8','normal-12','elite','boss'];
const MAGIC=['fire','lightning'].flatMap(e=>['wand','staff'].map(w=>'magic-'+e+'-'+w));
const FURY=['fury-daggers','fury-bow','fury-twohand'];
const BLOOD=FURY.map(id=>id.replace('fury-','blood-'));
const AUDIT='audit-twohand',IDS=[...MAGIC,...FURY,...BLOOD,AUDIT];
const gear=fs.readFileSync('combat/v012-gear-stats.js','utf8'),runtime=fs.readFileSync('combat/v012-combat-runtime.js','utf8');
const replace=(s,a,b)=>{assert.equal(s.split(a).length,2,'source anchor '+a.slice(0,120));return s.replace(a,b);};
let observer=replace(runtime,"  const attackType=ports.enemyAttackType(e);","  const attackType=ports.enemyAttackType(e);\n  ports.phase6Metric(r,'auditEnemyAttacks',1);ports.phase6Metric(r,attackType==='physical'?'auditPhysicalAttacks':'auditNonPhysicalAttacks',1);ports.phase6Metric(r,'auditPreAvoidDamage',raw);");
observer=replace(observer,"   ports.phase6Metric(r,'dodges',1);","   ports.phase6Metric(r,'dodges',1);ports.phase6Metric(r,'auditDodgePrevented',raw);");
const SUPPORT={blood:['blood_drinker','bleeding_edge'],vitality:['strong_heart','renewal'],aegis:['guarded_block','barrier_pulse']};
const drainExtras={basic:[],harvest:['blood_harvest'],feast:['crimson_feast'],both:['blood_harvest','crimson_feast'],mixed:['crimson_rush']};
const M=['pure','vitality','aegis'].map(id=>({id}));
const U=['pure','basic','harvest','feast','both','mixed'].map(id=>({id}));
const B=['basic','harvest','feast','both'].map(id=>({id}));
const A=[{id:'pure'},...['blood','vitality','aegis','blood-vitality'].map(id=>({id})),...['blood','vitality','aegis','blood-vitality'].map(base=>({id:base+'-equal-evasion',base,restore:true})),{id:'pure-minus-evasion',base:'pure',remove:true}];
const nodesById=new Map(T.NODES.map(n=>[n.id,n]));
const rating=t=>t.nodes.reduce((n,id)=>n+(nodesById.get(id.replace(/_rank\d+$/,''))?.flatAvoid||0),0);
const cache=new Map();
function fill(p,families,mandatory){
 let t=buy(mandatory,{xp:POINTS*T.POINT_XP,...(p.element&&p.element!=='arcane'?{element:p.element}:{})});
 assert(t.nodes.length<=POINTS);
 // Prioritize rank investment in the shared drain skill, then the original
 // offensive route; no free ranks, and no unintended extra specializations.
 if(families.includes('blood'))for(let i=0;i<4&&t.nodes.length<POINTS;i++){const next=T.allocate(t,'blood_drinker');if(!next)break;t=next;}
 for(const id of p.t.nodes){if(t.nodes.length>=POINTS)break;if(t.nodes.includes(id))continue;
  const n=nodesById.get(id.replace(/_rank\d+$/,''));if(!n||!families.includes(n.family)||n.pair||n.advanced||n.pending)continue;
  // Keep Blood Harvest and Third Cut separate unless explicitly requested.
  if(['blood_harvest','crimson_feast','crimson_rush'].includes(n.id)&&!mandatory.includes(n.id))continue;
  const next=T.allocate(t,id);if(next)t=next;
 }
 const candidates=T.NODES.filter(n=>n.kind==='stat'&&families.includes(n.family)&&!n.pair&&!n.pending&&(!n.element||n.element===(p.element||'arcane')));
 while(t.nodes.length<POINTS){const n=candidates.find(n=>!t.nodes.includes(n.id)&&T.allocate(t,n.id));assert(n,'no legal filler');t=T.allocate(t,n.id);}
 assert(T.valid(t));assert.equal(t.nodes.length,POINTS);for(const skill of mandatory)assert(t.nodes.includes(skill),'missing '+skill);
 assert.deepEqual(Array.from(t.nodes.filter(n=>n.startsWith('affinity_'))).sort(),families.map(f=>'affinity_'+f).sort());
 return t;
}
function prefixSupport(p,id){
 if(id==='pure')return {...p,coreCount:POINTS,supportSkills:[],retainedOffense:p.skills,sacrificedOffense:[]};
 const support=id==='blood-vitality'?['blood','vitality']:[id],mandatory=support.flatMap(f=>SUPPORT[f]),supportPath=buy(mandatory,{xp:POINTS*T.POINT_XP});
 const coreCount=POINTS-supportPath.nodes.length,core=p.t.nodes.slice(0,coreCount);
 let t={...p.t,nodes:[...core]};assert(T.valid(t));assert(core.includes(p.skills[0]));
 for(const node of supportPath.nodes){const next=T.allocate(t,node);assert(next,'support '+node);t=next;}
 assert(T.valid(t));assert.equal(t.nodes.length,POINTS);
 const families=[p.families[0],...support];
 assert.deepEqual(Array.from(t.nodes.filter(n=>n.startsWith('affinity_'))).sort(),families.map(f=>'affinity_'+f).sort());
 return {...p,t,families,coreCount,supportSkills:mandatory,retainedOffense:p.skills.filter(x=>core.includes(x)),sacrificedOffense:p.skills.filter(x=>!core.includes(x))};
}
function profile(id,arm){
 const key=id+'/'+arm.id;if(cache.has(key))return cache.get(key);
 let p;
 if(id===AUDIT){
  const pure=G.profile('fury-twohand'),base=arm.base||arm.id;
  p=prefixSupport(pure,base);
  const delta=arm.restore?rating(pure.t)-rating(p.t):arm.remove?rating(prefixSupport(pure,'blood').t)-rating(pure.t):0;
  p={...p,id,evasionDelta:delta,nativeTalentEvasion:rating(p.t),expectedTalentEvasion:rating(p.t)+delta};
 }else if(MAGIC.includes(id)){
  p=prefixSupport(G.profile(id),arm.id);assert(p.sacrificedOffense.length===0,id+' lost element identity');
 }else{
  const fury=id.startsWith('fury-'),w=id.split('-').at(-1);
  // Native blood-bow is not a catalogue profile; borrow the Fury Bow
  // weapon/armor fixture, but allocate exclusively Blood talents.
  const original=G.profile('fury-'+w);
  if(fury&&arm.id==='pure')p=original;
  else{
   const families=fury?['fury','blood']:['blood'],mandatory=[...(fury?['affinity_fury',original.skills[0],'quick_hands']:[]),'affinity_blood',...SUPPORT.blood,...drainExtras[arm.id]];
   const template=fury?original:(w==='bow'?G.profile('blood-daggers'):G.profile('blood-'+w));
   const t=fill(template,families,mandatory);
   p={...original,id,t,families,supportSkills:mandatory.filter(n=>!n.startsWith('affinity_')),retainedOffense:original.skills.filter(n=>t.nodes.includes(n)),sacrificedOffense:original.skills.filter(n=>!t.nodes.includes(n))};
  }
 }
 cache.set(key,p);return p;
}
function arms(id){return id===AUDIT?A:MAGIC.includes(id)?M:id.startsWith('blood-')?B:U;}
function opts(p,a,mode){
 const delta=p.evasionDelta||0;
 const overlay=delta?replace(gear,';result.power=power(result);',';result.evasionRating=Math.max(0,result.evasionRating+('+delta+'));result.power=power(result);'):null;
 return {mode,points:POINTS,gear:'current',rarity:'Rare',runes:false,contracts:'none',targetPolicy:'mechanics',measure:true,tickLimit:6500,lockScenarioStreams:true,controlledTalents:p.t,armorType:p.armorType,offhandType:p.offhandType,stageArmorRuntimeSource:observer,...(overlay?{stage648c2cGearStatsSource:overlay}:{})};
}
function build(p){return {id:p.id,weapon:p.weapon,families:p.families,skills:[],...(p.element?{element:p.element}:{})};}
function cell(id,a,sc,i){
 const p=profile(id,a),kind=sc.startsWith('normal')?'normal':sc,groupSize=kind==='normal'?Number(sc.split('-')[1]):undefined;
 const family=F[i%F.length],elite=kind==='elite'?ELITES[i%ELITES.length]:undefined,seed=65901001+i*101;
 const x=S.encounter(LEVEL,build(p),seed,kind,{...opts(p,a,'encounter'),...(elite?{stage619EliteType:elite}:{})},undefined,undefined,family,1,groupSize);
 assert.equal(x.level,LEVEL);assert.equal(x.pointsSpent,POINTS);assert.deepEqual(Array.from(x.controlledTalentNodes),Array.from(p.t.nodes));assert.equal(x.armorType,p.armorType);assert.equal(x.offhandType,p.offhandType);assert.equal(x.affinity,family);assert(x.won||x.died||x.timedOut);
 if(elite)assert.equal(x.eliteType,elite);if(kind==='boss')assert.equal(x.bossAffinity,family);if(groupSize)assert.equal(x.requestedGroupSize,groupSize);
 const m=x.affinityMetrics||{},r={id,sc,i,seed,resolved:x.resolvedSeed,realm:family,gear:x.gearFingerprint,roster:x.roster,roles:x.initialRoles,trait:x.traitId,condition:x.conditionId,bossMods:x.bossModifierIds,elite:x.eliteType,boss:x.bossId,won:x.won,died:x.died,timeout:x.timedOut,seconds:x.seconds,damage:x.damageDealt,secondary:x.secondaryTargetDamage,taken:x.damageTaken,absorbed:x.absorbed,healed:m.healingActual||0,hpEnd:x.hpEnd,hpMax:x.hpMax,mpStart:x.mpStart,mpEnd:x.mpEnd,mpMax:x.mpMax,paid:m.manaSpent||0,unfunded:x.unfundedCasterAttacks,funded:x.fundedCasts,infusions:x.infusionActivations,starved:m.manaStarvedSeconds||0,stats:x.heroBaseStats,activations:m.passiveActivations||{},barrier:m.barrierGenerated||0,defensiveAudit:m.defensiveAudit||{}};
 return r;
}
function paired(base,r,a){
 for(const k of ['id','sc','i','seed','resolved','realm','gear','roster','roles','trait','condition','bossMods','elite','boss'])assert.deepEqual(r[k],base[k],r.id+'/'+a.id+'/'+r.sc+'/'+k);
 if(a.restore)assert.equal(r.stats.evasionRating,base.stats.evasionRating,'restored Evasion differs from pure');
}
function trial(id,sc,i){const rows={};for(const a of arms(id)){rows[a.id]=cell(id,a,sc,i);if(a!==arms(id)[0])paired(rows[arms(id)[0].id],rows[a.id],a);}if(id===AUDIT){for(const a of A.filter(x=>x.restore||x.remove)){const original=rows[a.base],changed=rows[a.id],p=profile(id,a);for(const k of Object.keys(original.stats))if(k!=='evasionRating'&&k!=='power')assert.equal(changed.stats[k],original.stats[k],a.id+' changed '+k);assert.equal(changed.stats.evasionRating,Math.max(0,original.stats.evasionRating+p.evasionDelta));}}return {sc,i,rows};}
function route(id,a,i){
 const p=profile(id,a),x=S.dungeon(LEVEL,build(p),65951001+i*101,opts(p,a,'dungeon'),1);
 assert.equal(x.pointsSpent,POINTS);
 return {i,gear:x.gearFingerprint,realm:x.affinity,route:x.route,won:x.won,bossReached:x.bossReached,error:x.error,timeout:x.timedOut,rooms:x.rooms.map(r=>({kind:r.kind,won:r.won,mpStart:r.mpStart,mpEnd:r.mpEnd,mpMax:r.mpMax,hpStart:r.hpStart,hpEnd:r.hpEnd,seconds:r.seconds,paid:r.manaSpent,unfunded:r.unfundedCasterAttacks,funded:r.fundedCasts,starved:r.affinityMetrics?.manaStarvedSeconds??null,healed:r.affinityMetrics?.healingActual??null,absorbed:r.affinityMetrics?.barrierAbsorbed??null}))};
}
const mean=(rs,fn)=>rs.length?rs.reduce((s,r)=>s+fn(r),0)/rs.length:null;
function summary(rows){
 const n=rows.length,base=G.summary(rows),deaths=rows.filter(r=>r.died);
 const counts={},defensive={};for(const r of rows){for(const [k,v] of Object.entries(r.activations))counts[k]=(counts[k]||0)+v;for(const [k,v] of Object.entries(r.defensiveAudit))defensive[k]=(defensive[k]||0)+v;}
 return {...base,meanHP:mean(rows,r=>r.hpMax),meanDefense:mean(rows,r=>r.stats.defense),meanRegen:mean(rows,r=>r.stats.manaRegen),meanMana:mean(rows,r=>r.mpMax),funded:mean(rows,r=>r.funded),infusions:mean(rows,r=>r.infusions),starvedPct:100*rows.reduce((s,r)=>s+r.starved,0)/Math.max(.01,rows.reduce((s,r)=>s+r.seconds,0)),deathSeconds:mean(deaths,r=>r.seconds),barrier:mean(rows,r=>r.barrier),evasionRating:mean(rows,r=>r.stats.evasionRating),guardChance:mean(rows,r=>r.stats.blockChance),defensive,activations:counts};
}
function routeSummary(rs){const rooms=rs.flatMap(r=>r.rooms),later=rs.flatMap(r=>r.rooms.slice(1)).filter(r=>r.mpMax>0);return {n:rs.length,wins:rs.filter(r=>r.won).length,bossReached:rs.filter(r=>r.bossReached).length,errors:rs.filter(r=>r.error).map(r=>r.error),timeouts:rs.filter(r=>r.timeout).length,rooms:rooms.length,laterManaEntryPct:mean(later,r=>100*r.mpStart/r.mpMax),funded:mean(rooms,r=>r.funded),unfunded:mean(rooms,r=>r.unfunded),starvedPct:100*rooms.reduce((s,r)=>s+(r.starved||0),0)/Math.max(.01,rooms.reduce((s,r)=>s+r.seconds,0)),healed:mean(rooms,r=>r.healed||0),absorbed:mean(rooms,r=>r.absorbed||0)};}
function grouped(id,cases){
 const filters={all:()=>true,normal:r=>r.sc.startsWith('normal'),...Object.fromEntries(SC.map(sc=>[sc,r=>r.sc===sc]))};
 return Object.fromEntries(Object.entries(filters).map(([k,f])=>[k,Object.fromEntries(arms(id).map(a=>{const selected=cases.filter(f),rows=selected.map(r=>r.rows[a.id]),b=arms(id)[0].id;return [a.id,{...summary(rows),pairedGains:selected.filter(r=>!r.rows[b].won&&r.rows[a.id].won).length,pairedLosses:selected.filter(r=>r.rows[b].won&&!r.rows[a.id].won).length}];}))]));
}
function write(name,v){fs.mkdirSync(OUT,{recursive:true});fs.writeFileSync(path.join(OUT,name),JSON.stringify(v)+'\n');}
function run(id){
 assert(IDS.includes(id));const cases=[];for(const sc of SC)for(let i=0;i<N;i++)cases.push(trial(id,sc,i));
 const routes=MAGIC.includes(id)?Object.fromEntries(M.map(a=>[a.id,Array.from({length:ROUTES},(_,i)=>route(id,a,i))])):null;
 if(routes)for(const a of M.slice(1))for(let i=0;i<ROUTES;i++)for(const k of ['i','gear','realm','route'])assert.deepEqual(routes[a.id][i][k],routes.pure[i][k],id+'/'+a.id+' route '+k);
 const result={id,source:S.sourceFingerprint().sha256,profiles:Object.fromEntries(arms(id).map(a=>{const p=profile(id,a);return [a.id,{nodes:p.t.nodes,families:p.families,coreCount:p.coreCount??null,supportSkills:p.supportSkills??[],retainedOffense:p.retainedOffense??p.skills,sacrificedOffense:p.sacrificedOffense??[],talentEvasion:rating(p.t),evasionDelta:p.evasionDelta||0}];})),cases,routes};
 write(id+'.json',result);console.log('DEFENSIVE_DRAIN_SHARD='+JSON.stringify({id,n:cases.length*arms(id).length,all:grouped(id,cases).all,routes:routes&&Object.fromEntries(Object.entries(routes).map(([k,rs])=>[k,routeSummary(rs)]))}));
}
function smoke(){
 new Function(observer);
 for(const id of IDS){for(const a of arms(id)){const p=profile(id,a);console.log('DEFENSIVE_PLAN='+JSON.stringify({id,arm:a.id,n:p.t.nodes.length,nodes:p.t.nodes,families:p.families,rating:rating(p.t),delta:p.evasionDelta||0}));}trial(id,'normal-1',0);}
 for(const sc of SC){trial(AUDIT,sc,1);trial('magic-lightning-staff',sc,1);}
 const rs=M.map(a=>route('magic-fire-wand',a,0));for(const r of rs){assert(!r.error,r.error);assert.deepEqual(r.route,rs[0].route);assert.equal(r.gear,rs[0].gear);}
 console.log('DEFENSIVE_DRAIN_SMOKE_OK');
}
function aggregate(){
 const all=IDS.map(id=>JSON.parse(fs.readFileSync(path.join(OUT,id+'.json'))));
 assert.equal(new Set(all.map(x=>x.source)).size,1);
 for(const x of all){assert.equal(x.cases.length,N*SC.length);assert.equal(new Set(x.cases.map(c=>c.sc+'/'+c.i)).size,x.cases.length);for(const c of x.cases)for(const a of arms(x.id).slice(1))paired(c.rows[arms(x.id)[0].id],c.rows[a.id],a);if(x.routes)for(const a of M)assert.equal(x.routes[a.id].length,ROUTES);}
 const profiles=Object.fromEntries(all.map(x=>[x.id,{plans:x.profiles,scenarios:grouped(x.id,x.cases),routes:x.routes&&Object.fromEntries(Object.entries(x.routes).map(([k,rs])=>[k,routeSummary(rs)]))}]));
 const n=all.reduce((s,x)=>s+x.cases.length*arms(x.id).length,0),routeN=all.reduce((s,x)=>s+Object.values(x.routes||{}).flat().length,0);
 write('summary.json',{n,routeN,source:all[0].source,profiles});
 console.log('DEFENSIVE_DRAIN_OVERVIEW='+JSON.stringify({n,routeN,profiles:IDS.length}));
 for(const [id,p] of Object.entries(profiles))console.log('DEFENSIVE_DRAIN_PROFILE='+JSON.stringify({id,plans:p.plans,...p}));
}
if(require.main===module){const [cmd,id]=process.argv.slice(2);if(cmd==='smoke')smoke();else if(cmd==='run')run(id);else if(cmd==='aggregate')aggregate();else throw Error('unknown command');}
