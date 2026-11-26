'use strict';
// E10 diagnostics only. No production source edits and no fabricated natural progression.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const S=require('./simulate-progression.cjs'),G=require('./v013-global-e10.cjs'),{T,buy}=require('../tests/v013-current-talent-helper.cjs');
const OUT='reports/e10-evasion-identity',N=100,POINTS=30,LEVEL=10;
const F=['blood','decay','radiance','aegis','fury','arcane'],ELITES=G.SC.filter(x=>x.kind==='elite').map(x=>x.elite);
const SC=['normal-1','normal-4','normal-8','normal-12','elite','boss'];
const IDS=['blood-daggers','blood-twohand','fury-daggers','fury-bow','fury-twohand','decay-cycle-daggers','decay-cycle-wand','radiance-mace','aegis-mace','arcane-fire-wand','arcane-lightning-staff','hybrid-blood-fury'];
const ARMOR=['Cloth','Leather','Plate'],CROSS=new Set(['fury-daggers','fury-bow','fury-twohand','decay-cycle-wand','arcane-lightning-staff','radiance-mace']);
const PHANTOM=new Set(['fury-daggers','fury-twohand','blood-daggers','arcane-lightning-staff']);
const gear=fs.readFileSync('combat/v012-gear-stats.js','utf8'),core=fs.readFileSync('combat/v012-combat-core.js','utf8'),runtime=fs.readFileSync('combat/v012-combat-runtime.js','utf8');
const replace=(s,a,b)=>{assert.equal(s.split(a).length,2,'source anchor '+a.slice(0,120));return s.replace(a,b);};
let observer=replace(runtime,"  const attackType=ports.enemyAttackType(e);","  const attackType=ports.enemyAttackType(e);\n  ports.phase6Metric(r,'auditEnemyAttacks',1);ports.phase6Metric(r,attackType==='physical'?'auditPhysicalAttacks':'auditNonPhysicalAttacks',1);ports.phase6Metric(r,'auditPreAvoidDamage',raw);");
observer=replace(observer,"   ports.phase6Metric(r,'dodges',1);","   ports.phase6Metric(r,'dodges',1);ports.phase6Metric(r,'auditDodgePrevented',raw);");
const cores=new Map();
function curve(k){
 if(!k)return core;
 if(!cores.has(k))cores.set(k,replace(core,'return Math.min(.45,1/(1+scale/(12*rating)));','const half='+k+'*(2+referenceLevel(level)*.91)/(2+referenceLevel(10)*.91);return .45*rating/(rating+half);'));
 return cores.get(k);
}
const boostedLeather=replace(gear,'return Number.isFinite(value)&&value>0?value:0;','return Number.isFinite(value)&&value>0?value*2:0;');
const phantom=[{family:'phantom',tier:5,rarity:'Rare'}];
const cache=new Map();
function profile(id){if(!cache.has(id))cache.set(id,G.profile(id));return cache.get(id);}
function arms(id){
 const p=profile(id),base=p.armorType,leather=base==='Leather',a=[{id:'native',armor:base},{id:'smooth8',armor:base,k:8},{id:'smooth12',armor:base,k:12}];
 if(leather)a.push({id:'smooth8-leather2',armor:base,k:8,leather2:true},{id:'smooth12-leather2',armor:base,k:12,leather2:true});
 if(CROSS.has(id))for(const armor of ARMOR.filter(x=>x!==base)){
  a.push({id:'native-'+armor.toLowerCase(),armor},{id:'identity-'+armor.toLowerCase(),armor,k:8,leather2:armor==='Leather'});
 }
 if(PHANTOM.has(id)){
  a.push({id:'native-phantom',armor:base,phantom:true},{id:'identity-phantom',armor:base,k:8,leather2:leather,phantom:true});
 }
 return a;
}
function opts(p,a,mode){
 return {mode,points:POINTS,gear:'current',rarity:'Rare',runes:false,contracts:'none',targetPolicy:'mechanics',measure:true,tickLimit:6500,lockScenarioStreams:true,controlledTalents:p.t,armorType:p.armorType,offhandType:p.offhandType,stageArmorRuntimeSource:observer,...(a.k?{stageArmorCoreSource:curve(a.k)}:{}),...(a.leather2?{stage648c2cGearStatsSource:boostedLeather}:{}),...(a.armor!==p.armorType?{stageE10ArmorVariant:a.armor}:{}),...(a.phantom?{anchorRuneFixture:phantom}:{})};
}
function build(p){return {id:p.id,weapon:p.weapon,families:p.families,skills:[],...(p.element?{element:p.element}:{})};}
function cell(id,a,sc,i){
 const p=profile(id),kind=sc.startsWith('normal')?'normal':sc,groupSize=kind==='normal'?Number(sc.split('-')[1]):undefined;
 const family=F[i%F.length],elite=kind==='elite'?ELITES[i%ELITES.length]:undefined,seed=65901001+i*101;
 const x=S.encounter(LEVEL,build(p),seed,kind,{...opts(p,a,'encounter'),...(elite?{stage619EliteType:elite}:{})},undefined,undefined,family,1,groupSize);
 assert.equal(x.level,LEVEL);assert.equal(x.pointsSpent,POINTS);assert.deepEqual(Array.from(x.controlledTalentNodes),Array.from(p.t.nodes));assert.equal(x.armorType,a.armor);assert.equal(x.offhandType,p.offhandType);assert.equal(x.affinity,family);assert(x.won||x.died||x.timedOut);
 if(elite)assert.equal(x.eliteType,elite);if(kind==='boss')assert.equal(x.bossAffinity,family);if(groupSize)assert.equal(x.requestedGroupSize,groupSize);
 const m=x.affinityMetrics||{},r={id,sc,i,seed,resolved:x.resolvedSeed,realm:family,gear:x.gearFingerprint,nonArmorGear:x.nonArmorGearFingerprint,armor:x.armorType,roster:x.roster,roles:x.initialRoles,trait:x.traitId,condition:x.conditionId,bossMods:x.bossModifierIds,elite:x.eliteType,boss:x.bossId,won:x.won,died:x.died,timeout:x.timedOut,seconds:x.seconds,damage:x.damageDealt,secondary:x.secondaryTargetDamage,taken:x.damageTaken,absorbed:x.absorbed,healed:m.healingActual||0,hpEnd:x.hpEnd,hpMax:x.hpMax,mpStart:x.mpStart,mpEnd:x.mpEnd,mpMax:x.mpMax,paid:m.manaSpent||0,unfunded:x.unfundedCasterAttacks,funded:x.fundedCasts,infusions:x.infusionActivations,starved:m.manaStarvedSeconds||0,stats:x.heroBaseStats,activations:m.passiveActivations||{},barrier:m.barrierGenerated||0,defensiveAudit:m.defensiveAudit||{}};
 return r;
}
function paired(base,r,a){
 for(const k of ['id','sc','i','seed','resolved','realm','roster','roles','trait','condition','bossMods','elite','boss'])assert.deepEqual(r[k],base[k],r.id+'/'+a.id+'/'+r.sc+'/'+k);
 assert.equal(r.armor,a.armor);
 if(r.armor===base.armor){assert.equal(r.gear,base.gear);for(const k of Object.keys(base.stats))if(k!=='evasionRating'&&k!=='power')assert.equal(r.stats[k],base.stats[k],a.id+' changed '+k);}
 else assert.equal(r.nonArmorGear,base.nonArmorGear);
 if(r.armor===base.armor&&!a.leather2&&!a.phantom)assert.equal(r.stats.evasionRating,base.stats.evasionRating);
}
function trial(id,sc,i){
 const rows={},aa=arms(id);for(const a of aa){rows[a.id]=cell(id,a,sc,i);if(a.id!=='native')paired(rows.native,rows[a.id],a);}
 for(const a of aa.filter(x=>x.phantom)){
  const b=rows[a.k?(a.leather2?'smooth8-leather2':'smooth8'):'native'],r=rows[a.id];
  assert(Math.abs(r.stats.evasionRating-b.stats.evasionRating-5.175)<1e-6,'Rare Veteran Phantom rating must be exactly +5.175');
 }
 return {sc,i,rows};
}
const mean=(rs,fn)=>rs.length?rs.reduce((s,r)=>s+fn(r),0)/rs.length:null;
function summary(rows){
 const n=rows.length,base=G.summary(rows),deaths=rows.filter(r=>r.died);
 const counts={},defensive={};for(const r of rows){for(const [k,v] of Object.entries(r.activations))counts[k]=(counts[k]||0)+v;for(const [k,v] of Object.entries(r.defensiveAudit))defensive[k]=(defensive[k]||0)+v;}
 return {...base,meanHP:mean(rows,r=>r.hpMax),meanDefense:mean(rows,r=>r.stats.defense),meanRegen:mean(rows,r=>r.stats.manaRegen),meanMana:mean(rows,r=>r.mpMax),funded:mean(rows,r=>r.funded),infusions:mean(rows,r=>r.infusions),starvedPct:100*rows.reduce((s,r)=>s+r.starved,0)/Math.max(.01,rows.reduce((s,r)=>s+r.seconds,0)),deathSeconds:mean(deaths,r=>r.seconds),barrier:mean(rows,r=>r.barrier),evasionRating:mean(rows,r=>r.stats.evasionRating),guardChance:mean(rows,r=>r.stats.blockChance),dodgePct:defensive.auditPhysicalAttacks?100*defensive.dodges/defensive.auditPhysicalAttacks:0,dodgePreventedPerSecond:(defensive.auditDodgePrevented||0)/Math.max(.01,rows.reduce((n,r)=>n+r.seconds,0)),defensive,activations:counts};
}
function grouped(id,cases){
 const filters={all:()=>true,normal:r=>r.sc.startsWith('normal'),...Object.fromEntries(SC.map(sc=>[sc,r=>r.sc===sc]))};
 return Object.fromEntries(Object.entries(filters).map(([k,f])=>[k,Object.fromEntries(arms(id).map(a=>{const selected=cases.filter(f),rows=selected.map(r=>r.rows[a.id]),b=arms(id)[0].id;return [a.id,{...summary(rows),pairedGains:selected.filter(r=>!r.rows[b].won&&r.rows[a.id].won).length,pairedLosses:selected.filter(r=>r.rows[b].won&&!r.rows[a.id].won).length}];}))]));
}
function write(name,v){fs.mkdirSync(OUT,{recursive:true});fs.writeFileSync(path.join(OUT,name),JSON.stringify(v)+'\n');}
function curves(){
 // Evaluate the actual candidate core functions with the native progression reference.
 const progression=fs.readFileSync('combat/expedition-progression.js','utf8');
 const table={};
 for(const k of [8,12]){
  const env={};new Function('globalThis',progression)(env);new Function('globalThis',curve(k))(env);
  const ev=env.WandererV012CombatCore.evasionChance;
  for(const E of [1,5,10,20,35,70,100,200,300]){
   let last=0;
   for(const r of [0,1,2,4,8,12,16,24,32,64,128,10000]){
    const v=ev(r,E,1,.45);assert(v>=last&&v<.45&&Number.isFinite(v));last=v;
   }
   if(E===10)assert(Math.abs(ev(k,E,1,.45)-.225)<1e-12);
  }
  table[k]=Object.fromEntries([1,5,10,20,35,70,100,200,300].map(E=>[E,Object.fromEntries([2,4,8,12,16,24,32,64].map(r=>[r,ev(r,E,1,.45)]))]));
 }
 return table;
}
function run(id){
 assert(IDS.includes(id));const p=profile(id),cases=[];for(const sc of SC)for(let i=0;i<N;i++)cases.push(trial(id,sc,i));
 const result={id,source:S.sourceFingerprint().sha256,nodes:p.t.nodes,arms:arms(id),cases};
 write(id+'.json',result);console.log('EVASION_IDENTITY_SHARD='+JSON.stringify({id,n:cases.length*arms(id).length,all:grouped(id,cases).all}));
}
function smoke(){
 new Function(observer);new Function(boostedLeather);console.log('EVASION_CURVES='+JSON.stringify(curves()));
 for(const id of IDS){const p=profile(id);assert(T.valid(p.t));assert.equal(p.t.nodes.length,POINTS);console.log('EVASION_PLAN='+JSON.stringify({id,nodes:p.t.nodes,arms:arms(id)}));trial(id,'normal-1',0);}
 for(const sc of SC)for(const id of ['fury-twohand','fury-daggers','arcane-lightning-staff'])trial(id,sc,1);
 console.log('EVASION_IDENTITY_SMOKE_OK');
}
function aggregate(){
 const all=IDS.map(id=>JSON.parse(fs.readFileSync(path.join(OUT,id+'.json'))));assert.equal(new Set(all.map(x=>x.source)).size,1);
 for(const x of all){assert.equal(x.cases.length,N*SC.length);assert.equal(new Set(x.cases.map(c=>c.sc+'/'+c.i)).size,x.cases.length);assert.deepEqual(x.arms,arms(x.id));for(const c of x.cases)for(const a of arms(x.id).slice(1))paired(c.rows.native,c.rows[a.id],a);}
 const profiles=Object.fromEntries(all.map(x=>[x.id,{nodes:x.nodes,arms:x.arms,scenarios:grouped(x.id,x.cases)}]));
 const n=all.reduce((s,x)=>s+x.cases.length*arms(x.id).length,0);
 write('summary.json',{n,source:all[0].source,curves:curves(),profiles});
 console.log('EVASION_IDENTITY_OVERVIEW='+JSON.stringify({n,profiles:IDS.length,arms:all.reduce((s,x)=>s+x.arms.length,0)}));
 for(const [id,p] of Object.entries(profiles))console.log('EVASION_IDENTITY_PROFILE='+JSON.stringify({id,...p}));
}
if(require.main===module){const [cmd,id]=process.argv.slice(2);if(cmd==='smoke')smoke();else if(cmd==='run')run(id);else if(cmd==='aggregate')aggregate();else throw Error('unknown command');}
