'use strict';
// E10 diagnostics only. No production source edits and no fabricated natural progression.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const S=require('./simulate-progression.cjs'),G=require('./v013-global-e10.cjs'),{T,buy}=require('../tests/v013-current-talent-helper.cjs');
const OUT='reports/e10-mana-survival',N=100,ROUTES=30,POINTS=30,LEVEL=10;
const F=['blood','decay','vitality','aegis','fury','magic'],ELITES=G.SC.filter(x=>x.kind==='elite').map(x=>x.elite);
const SC=['normal-1','normal-4','normal-8','normal-12','elite','boss'];
const MAGIC=['arcane','fire','frost','lightning'].flatMap(e=>['wand','staff'].map(w=>'magic-'+e+'-'+w));
const FURY=['fury-daggers','fury-bow','fury-twohand'],IDS=[...MAGIC,...FURY];
const gear=fs.readFileSync('combat/v012-gear-stats.js','utf8'),runtime=fs.readFileSync('combat/v012-combat-runtime.js','utf8');
const replace=(s,a,b)=>{assert.equal(s.split(a).length,2,'source anchor '+a.slice(0,120));return s.replace(a,b);};
const oldCosts=runtime.replace(/function elementManaCost\(b,kind,base\)\{[^\n]*\}/,'function elementManaCost(b,kind,base){return base;}');
assert.notEqual(oldCosts,runtime);
function gearSource(oldRegen=false,extraAffix=0){
 let s=gear;
 if(oldRegen){assert.equal(s.split('+(1+s.int*.15).toFixed(1)').length,3);s=s.replaceAll('+(1+s.int*.15).toFixed(1)','+(1.5+s.int*.23).toFixed(1)');}
 if(extraAffix)s=replace(s,"Math.min(6,Math.max(0,gearBonus('manaRegenBonus')))","Math.min(6,Math.max(0,gearBonus('manaRegenBonus')+"+extraAffix+"))");
 return s;
}
const runeFixture=['clarity','efficiency','abyss'].map(family=>({family,tier:5,rarity:'Rare'}));
const M=[{id:'current'},{id:'old-regen',regen:true},{id:'old-costs',costs:true},{id:'old-both',regen:true,costs:true},{id:'runes',runes:true},{id:'gear-regen-runes',runes:true,extraAffix:2}];
const U=[{id:'pure'},{id:'blood'},{id:'vitality'},{id:'aegis'},{id:'blood-vitality'}];
const SUPPORT={blood:['blood_drinker','bleeding_edge'],vitality:['strong_heart','renewal'],aegis:['guarded_block','barrier_pulse']};
const optional={blood:['blood_harvest','crimson_rush','deep_cuts'],vitality:['fervent_life','living_recovery','last_stand'],aegis:['iron_skin','fortified','steadfast_guard']};
const profileCache=new Map();
function profile(id,arm){
 const key=id+'/'+arm.id;if(profileCache.has(key))return profileCache.get(key);
 const p=G.profile(id);
 if(MAGIC.includes(id)||arm.id==='pure'){profileCache.set(key,p);return p;}
 const support=arm.id==='blood-vitality'?['blood','vitality']:[arm.id];
 const mandatory=support.flatMap(f=>SUPPORT[f]);
 const supportPath=buy(mandatory,{xp:POINTS*T.POINT_XP});
 const coreCount=POINTS-supportPath.nodes.length;
 assert(coreCount>=p.skills.length&&coreCount>0,id+' insufficient offensive budget');
 // Same native offensive route and skill order; reserve room for mandatory sustain.
 const core=p.t.nodes.slice(0,coreCount);
 let t={...p.t,nodes:[...core]};assert(T.valid(t));
 for(const skill of p.skills)assert(core.includes(skill),id+' core lost '+skill);
 for(const node of supportPath.nodes){const next=T.allocate(t,node);assert(next,id+' support '+node);t=next;}
 assert.equal(t.nodes.length,POINTS);
 assert(T.valid(t));for(const skill of mandatory)assert(t.nodes.includes(skill));
 const families=['fury',...support];
 assert.deepEqual(Array.from(t.nodes.filter(n=>n.startsWith('affinity_'))).sort(),families.map(f=>'affinity_'+f).sort());
 const result={...p,families,t,coreCount,supportSkills:mandatory};profileCache.set(key,result);return result;
}
function arms(id){return MAGIC.includes(id)?M:U;}
function opts(p,a,mode){
 return {mode,points:POINTS,gear:'current',rarity:'Rare',runes:false,contracts:'none',targetPolicy:'mechanics',measure:true,tickLimit:6500,lockScenarioStreams:true,controlledTalents:p.t,armorType:p.armorType,offhandType:p.offhandType,...(a.regen||a.extraAffix?{stage648c2cGearStatsSource:gearSource(!!a.regen,a.extraAffix||0)}:{}),...(a.costs?{stageArmorRuntimeSource:oldCosts}:{}),...(a.runes?{anchorRuneFixture:runeFixture}:{})};
}
function build(p){return {id:p.id,weapon:p.weapon,families:p.families,skills:[],...(p.element?{element:p.element}:{})};}
function cell(id,a,sc,i){
 const p=profile(id,a),kind=sc.startsWith('normal')?'normal':sc,groupSize=kind==='normal'?Number(sc.split('-')[1]):undefined;
 const family=F[i%F.length],elite=kind==='elite'?ELITES[i%ELITES.length]:undefined,seed=65901001+i*101;
 const x=S.encounter(LEVEL,build(p),seed,kind,{...opts(p,a,'encounter'),...(elite?{stage619EliteType:elite}:{})},undefined,undefined,family,1,groupSize);
 assert.equal(x.level,LEVEL);assert.equal(x.pointsSpent,POINTS);assert.deepEqual(Array.from(x.controlledTalentNodes),Array.from(p.t.nodes));assert.equal(x.armorType,p.armorType);assert.equal(x.offhandType,p.offhandType);assert.equal(x.affinity,family);assert(x.won||x.died||x.timedOut);
 if(elite)assert.equal(x.eliteType,elite);if(kind==='boss')assert.equal(x.bossAffinity,family);if(groupSize)assert.equal(x.requestedGroupSize,groupSize);
 const m=x.affinityMetrics||{},r={id,sc,i,seed,resolved:x.resolvedSeed,realm:family,gear:x.gearFingerprint,roster:x.roster,roles:x.initialRoles,trait:x.traitId,condition:x.conditionId,bossMods:x.bossModifierIds,elite:x.eliteType,boss:x.bossId,won:x.won,died:x.died,timeout:x.timedOut,seconds:x.seconds,damage:x.damageDealt,secondary:x.secondaryTargetDamage,taken:x.damageTaken,absorbed:x.absorbed,healed:m.healingActual||0,hpEnd:x.hpEnd,hpMax:x.hpMax,mpStart:x.mpStart,mpEnd:x.mpEnd,mpMax:x.mpMax,paid:m.manaSpent||0,unfunded:x.unfundedCasterAttacks,funded:x.fundedCasts,infusions:x.infusionActivations,starved:m.manaStarvedSeconds||0,stats:x.heroBaseStats,activations:m.passiveActivations||{},barrier:m.barrierGenerated||0};
 return r;
}
function paired(base,r,a){
 for(const k of ['id','sc','i','seed','resolved','realm','gear','roster','roles','trait','condition','bossMods','elite','boss'])assert.deepEqual(r[k],base[k],r.id+'/'+a.id+'/'+r.sc+'/'+k);
 if(a.costs&&!a.regen)assert.deepEqual(r.stats,base.stats);
 if(a.regen&&!a.runes)for(const k of Object.keys(base.stats))if(k!=='manaRegen'&&k!=='power')assert.equal(r.stats[k],base.stats[k],k);
 if(a.regen)assert(r.stats.manaRegen>base.stats.manaRegen);
 if(a.runes){assert(r.stats.mana>base.stats.mana);assert(r.stats.manaCostReduction>base.stats.manaCostReduction);assert(r.stats.manaRegen>base.stats.manaRegen);}
}
function trial(id,sc,i){const rows={};for(const a of arms(id)){rows[a.id]=cell(id,a,sc,i);if(a!==arms(id)[0])paired(rows[arms(id)[0].id],rows[a.id],a);}return {sc,i,rows};}
function route(id,a,i){
 const p=profile(id,a),x=S.dungeon(LEVEL,build(p),65951001+i*101,opts(p,a,'dungeon'),1);
 assert.equal(x.pointsSpent,POINTS);
 return {i,gear:x.gearFingerprint,realm:x.affinity,route:x.route,won:x.won,bossReached:x.bossReached,error:x.error,timeout:x.timedOut,rooms:x.rooms.map(r=>({kind:r.kind,won:r.won,mpStart:r.mpStart,mpEnd:r.mpEnd,mpMax:r.mpMax,hpStart:r.hpStart,hpEnd:r.hpEnd,seconds:r.seconds,paid:r.manaSpent,unfunded:r.unfundedCasterAttacks,funded:r.fundedCasts,starved:r.affinityMetrics?.manaStarvedSeconds??null}))};
}
const mean=(rs,fn)=>rs.length?rs.reduce((s,r)=>s+fn(r),0)/rs.length:null;
function summary(rows){
 const n=rows.length,base=G.summary(rows),deaths=rows.filter(r=>r.died);
 const counts={};for(const r of rows)for(const [k,v] of Object.entries(r.activations))counts[k]=(counts[k]||0)+v;
 return {...base,meanHP:mean(rows,r=>r.hpMax),meanDefense:mean(rows,r=>r.stats.defense),meanRegen:mean(rows,r=>r.stats.manaRegen),meanMana:mean(rows,r=>r.mpMax),funded:mean(rows,r=>r.funded),infusions:mean(rows,r=>r.infusions),starvedPct:100*rows.reduce((s,r)=>s+r.starved,0)/Math.max(.01,rows.reduce((s,r)=>s+r.seconds,0)),deathSeconds:mean(deaths,r=>r.seconds),barrier:mean(rows,r=>r.barrier),activations:counts};
}
function routeSummary(rs){const rooms=rs.flatMap(r=>r.rooms),later=rs.flatMap(r=>r.rooms.slice(1)).filter(r=>r.mpMax>0);return {n:rs.length,wins:rs.filter(r=>r.won).length,bossReached:rs.filter(r=>r.bossReached).length,errors:rs.filter(r=>r.error).map(r=>r.error),timeouts:rs.filter(r=>r.timeout).length,rooms:rooms.length,laterManaEntryPct:mean(later,r=>100*r.mpStart/r.mpMax),funded:mean(rooms,r=>r.funded),unfunded:mean(rooms,r=>r.unfunded),starvedPct:100*rooms.reduce((s,r)=>s+(r.starved||0),0)/Math.max(.01,rooms.reduce((s,r)=>s+r.seconds,0))};}
function grouped(id,cases){
 const filters={all:()=>true,normal:r=>r.sc.startsWith('normal'),...Object.fromEntries(SC.map(sc=>[sc,r=>r.sc===sc]))};
 return Object.fromEntries(Object.entries(filters).map(([k,f])=>[k,Object.fromEntries(arms(id).map(a=>{const selected=cases.filter(f),rows=selected.map(r=>r.rows[a.id]),b=arms(id)[0].id;return [a.id,{...summary(rows),pairedGains:selected.filter(r=>!r.rows[b].won&&r.rows[a.id].won).length,pairedLosses:selected.filter(r=>r.rows[b].won&&!r.rows[a.id].won).length}];}))]));
}
function write(name,v){fs.mkdirSync(OUT,{recursive:true});fs.writeFileSync(path.join(OUT,name),JSON.stringify(v)+'\n');}
function run(id){
 assert(IDS.includes(id));const cases=[];for(const sc of SC)for(let i=0;i<N;i++)cases.push(trial(id,sc,i));
 const routes=MAGIC.includes(id)?Object.fromEntries(M.map(a=>[a.id,Array.from({length:ROUTES},(_,i)=>route(id,a,i))])):null;
 if(routes)for(const a of M.slice(1))for(let i=0;i<ROUTES;i++)for(const k of ['i','gear','realm','route'])assert.deepEqual(routes[a.id][i][k],routes.current[i][k],id+'/'+a.id+' route '+k);
 const result={id,source:S.sourceFingerprint().sha256,profiles:Object.fromEntries(arms(id).map(a=>{const p=profile(id,a);return [a.id,{nodes:p.t.nodes,families:p.families,coreCount:p.coreCount,supportSkills:p.supportSkills}];})),cases,routes};
 write(id+'.json',result);console.log('MANA_SURVIVAL_SHARD='+JSON.stringify({id,n:cases.length*arms(id).length,all:grouped(id,cases).all,routes:routes&&Object.fromEntries(Object.entries(routes).map(([k,rs])=>[k,routeSummary(rs)]))}));
}
function smoke(){
 new Function(oldCosts);new Function(gearSource(true,2));
 for(const id of IDS){for(const a of arms(id))profile(id,a);trial(id,'normal-1',0);}
 for(const sc of SC)trial('magic-lightning-staff',sc,1);
 const rs=M.map(a=>route('magic-fire-wand',a,0));for(const r of rs){assert(!r.error,r.error);assert.deepEqual(r.route,rs[0].route);assert.equal(r.gear,rs[0].gear);}
 console.log('MANA_SURVIVAL_SMOKE_OK');
}
function aggregate(){
 const all=IDS.map(id=>JSON.parse(fs.readFileSync(path.join(OUT,id+'.json'))));
 assert.equal(new Set(all.map(x=>x.source)).size,1);
 for(const x of all){assert.equal(x.cases.length,N*SC.length);assert.equal(new Set(x.cases.map(c=>c.sc+'/'+c.i)).size,x.cases.length);for(const c of x.cases)for(const a of arms(x.id).slice(1))paired(c.rows[arms(x.id)[0].id],c.rows[a.id],a);if(x.routes)for(const a of M)assert.equal(x.routes[a.id].length,ROUTES);}
 const profiles=Object.fromEntries(all.map(x=>[x.id,{plans:x.profiles,scenarios:grouped(x.id,x.cases),routes:x.routes&&Object.fromEntries(Object.entries(x.routes).map(([k,rs])=>[k,routeSummary(rs)]))}]));
 const n=all.reduce((s,x)=>s+x.cases.length*arms(x.id).length,0),routeN=all.reduce((s,x)=>s+Object.values(x.routes||{}).flat().length,0);
 write('summary.json',{n,routeN,source:all[0].source,profiles});
 console.log('MANA_SURVIVAL_OVERVIEW='+JSON.stringify({n,routeN,profiles:IDS.length}));
 for(const [id,p] of Object.entries(profiles))console.log('MANA_SURVIVAL_PROFILE='+JSON.stringify({id,plans:p.plans,...p}));
}
if(require.main===module){const [cmd,id]=process.argv.slice(2);if(cmd==='smoke')smoke();else if(cmd==='run')run(id);else if(cmd==='aggregate')aggregate();else throw Error('unknown command');}
