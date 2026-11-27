'use strict';
// Research only. Compare full native loadouts, and isolate Bow piercing damage/status in VM arms.
const fs=require('node:fs'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const S=require('./simulate-progression.cjs'),G=require('./v013-global-e10.cjs'),{observer}=require('./v013-b23b-stalemate.cjs');
const OUT='reports/b31a',BASE='6f09feafc3fd422ae4aea080f9a7f357294c3f9f',N=50,F=['blood','decay','radiance','aegis','fury','arcane'];
const RUNTIME='combat/v012-combat-runtime.js',native=fs.readFileSync(RUNTIME,'utf8');
const phys=[['Bow','Bow',null],['Two-Handed','Two-Handed',null],['Sword+Shield','Sword','Shield'],['Sword+Dagger','Sword','Off-Hand Dagger'],['Mace+Shield','Mace','Shield'],['Mace+Dagger','Mace','Off-Hand Dagger'],['Dual Daggers','Daggers','Off-Hand Dagger']];
const casters=[['Staff','Staff',null],['Wand+Orb','Wand','Orb'],['Wand+Tome','Wand','Tome']];
const studies=[{id:'blood-fixed',profile:'blood-sword',armor:'Plate',arms:phys},{id:'decay-fixed',profile:'decay-cycle-daggers',armor:'Leather',arms:phys},{id:'fury-bow-fixed',profile:'fury-bow',armor:'Leather',arms:phys},{id:'arcane-fixed',profile:'arcane-arcane-wand',armor:'Cloth',arms:casters},{id:'fury-specialized',armor:'Leather',arms:[['Bow','Bow',null,'fury-bow'],['Two-Handed','Two-Handed',null,'fury-twohand'],['Dual Daggers','Daggers','Off-Hand Dagger','fury-daggers']]}];
const scenarios=[{id:'solo',kind:'normal',size:1},{id:'duo',kind:'normal',size:2},{id:'group4',kind:'normal',size:4},{id:'group12',kind:'normal',size:12},{id:'boss',kind:'boss'}];
const variants=[['native',false,false],['full-direct',true,false],['full-status',false,true],['full-both',true,true]];
const hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex'),write=(name,x)=>{fs.mkdirSync(OUT,{recursive:true});fs.writeFileSync(OUT+'/'+name+'.json',JSON.stringify(x,null,2));},read=name=>JSON.parse(fs.readFileSync(OUT+'/'+name+'.json','utf8')),mean=(rows,f)=>rows.length?rows.reduce((n,x)=>n+f(x),0)/rows.length:null;
function replace(s,a,b){assert.equal(s.split(a).length,2,'Source anchor '+a);return s.replace(a,b);}
function source(direct,status){let s=native;
 if(direct)s=replace(s,"ports.state.automaticTalents?.nodes?.includes('bow_pierce')?[1]:[.66]","[1]");
 if(status){
  s=replace(s,'WandererV012Buildcraft.onSecondaryWeaponStatus(ports.phase1Build,ctx,.5,.5);','WandererV012Buildcraft.onSecondaryWeaponStatus(ports.phase1Build,ctx,r.stats.main?.subtype===\'Bow\'?1:.5,r.stats.main?.subtype===\'Bow\'?1:.5);');
  s=replace(s,'ports.gameRandom()>=chance*.5','ports.gameRandom()>=chance*(kind===\'Bow\'?1:.5)');
  s=replace(s,'ports.applyAffinity(effect,e,s,mult,real,.5);','ports.applyAffinity(effect,e,s,mult,real,kind===\'Bow\'?1:.5);');
 }
 return s;
}
function item(x){return x?Object.fromEntries(Object.entries(x).filter(([k])=>k!=='id')):null;}
function cell(st,sc,i,arm,variant=null,research=null){
 const [id,weapon,off,profileId]=arm,p=G.profile(profileId||st.profile),seed=(research?.seedBase??100700001)+i*113,family=F[i%F.length];
 const build={id:p.id,weapon:st.armor==='Cloth'?'Wand':'Sword',families:p.families,skills:[],element:p.element};
 const [v,direct,status]=variant||['native',false,false];
 const x=S.encounter(10,build,seed,sc.kind,{...S.DEFAULTS,mode:'encounter',points:30,gear:'current',rarity:'Rare',runes:false,contracts:'none',boons:'none',targetPolicy:'mechanics',measure:true,tickLimit:13000,lockScenarioStreams:true,controlledTalents:p.t,armorType:st.armor,offhandType:off,stageB31ALoadout:weapon,stageB31EquipmentAudit:true,...(sc.id==='solo'?{stalemateAudit:observer(true)}:{}),...(direct||status?{stageArmorRuntimeSource:source(direct,status)}:{}),...(research?.runtime?{stageArmorRuntimeSource:research.runtime}:{}),...(research?.buildcraft?{stage648c1BuildcraftSource:research.buildcraft}:{})},undefined,undefined,family,1,sc.size);
 assert.equal(x.level,10);assert.equal(x.pointsSpent,30);assert.deepEqual(x.controlledTalentNodes,p.t.nodes);assert.equal(x.weaponType,weapon);assert.equal(x.offhandType,off);assert.equal(x.armorType,st.armor);assert.equal([x.won,x.died,x.timedOut,!!x.surrendered].filter(Boolean).length,1);if(x.surrendered)assert.equal(x.surrenderSettlement.outcome,'defeat');
 if(sc.id==='solo')assert.equal(x.pierced,0);
 const e=x.equipmentAudit,m=x.affinityMetrics||{},w=x.weaponStatusMetrics||{};
 return {id:research?.id??(variant?v:id),profile:p.id,weapon,off,armor:st.armor,nodes:p.t.nodes,seed,resolved:x.resolvedSeed,rosterHash:hash([x.roster,x.initialRoles,x.conditionId,x.conditionMarked,x.traitId,x.bossModifierIds,x.bossId]),nonHands:hash(Object.entries(e).filter(([k])=>!['weapon','offhand'].includes(k)).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>[k,item(v)])),weaponHash:hash(item(e.weapon)),gearHash:x.gearFingerprint,stats:x.heroBaseStats,won:x.won,died:x.died,surrendered:!!x.surrendered,timeout:x.timedOut,seconds:x.seconds,firstKill:x.firstKillSeconds,damage:x.damageDealt,secondary:x.secondaryTargetDamage,secondaryDot:x.secondaryDotDamage,secondaryHits:x.secondaryTargetHits,pierced:x.pierced,taken:x.damageTaken,absorbed:x.absorbed,healing:m.healingActual||0,barrier:m.barrierGenerated||0,orbBarrier:m.offhandOrbBarrier||0,tomeMana:m.offhandTomeMana||0,manaSpent:x.manaSpent,mpEnd:x.mpEnd,mpMax:x.mpMax,unfunded:x.unfundedCasterAttacks,hpEnd:x.hpEnd,hpMax:x.hpMax,mainHits:w.secondaryEquipmentStatusMainStrikes||0,...(research?{directBase:w.secondaryEquipmentStatusB31BMainBase||0,directRaw:w.secondaryEquipmentStatusB31BMainRaw||0,directActual:w.secondaryEquipmentStatusB31BMainActual||0,fundedHits:x.fundedCasts,infusionDamage:x.infusionDamage}:{}),offHits:w.secondaryEquipmentStatusOffhandStrikes||0,offDamage:w.secondaryEquipmentStatusOffhandDamage||0,secondaryBleed:w.secondaryBleedApplied||0,secondaryRot:w.secondaryRotApplied||0,offBleed:w.secondaryEquipmentStatusOffhandBleedApplications||0,offRot:w.secondaryEquipmentStatusOffhandRotApplications||0};
}
function pair(st,sc,i,isStatus=false){
 const rows=isStatus?variants.map(v=>cell(st,sc,i,phys[0],v)):st.arms.map(a=>cell(st,sc,i,a));const a=rows[0];
 for(const r of rows){assert.equal(r.rosterHash,a.rosterHash,'Roster/condition drift');assert.equal(r.resolved,a.resolved);assert.equal(r.nonHands,a.nonHands,'Non-hand gear drift');if(st.profile)assert.deepEqual(r.nodes,a.nodes,'Talent drift');if(isStatus){assert.equal(r.gearHash,a.gearHash);assert.deepEqual(r.stats,a.stats,'Stat drift');}for(const q of rows.filter(x=>x.weapon===r.weapon))assert.equal(q.weaponHash,r.weaponHash,'Primary roll changed with offhand');}
 return {seed:a.seed,rows};
}
function run(si,ci,status=false,n=N){
 const st=studies[si],sc=scenarios[ci];assert(st&&sc);if(status){assert([0,1].includes(si)&&[1,3].includes(ci));}
 const cases=Array.from({length:n},(_,i)=>pair(st,sc,i,status));
 return {kind:status?'status':'loadout',si,ci,study:st.id,scenario:sc.id,commit:process.env.GITHUB_SHA||null,source:S.sourceFingerprint().sha256,cases};
}
function metrics(rows){
 const n=rows.length,wins=rows.filter(x=>x.won).length,timeout=rows.filter(x=>x.timeout).length,avg=k=>mean(rows,x=>Number(x[k])||0),rate=k=>mean(rows,x=>x.seconds>0?(Number(x[k])||0)/x.seconds:0);
 return {n,wins,deaths:rows.filter(x=>x.died).length,surrenders:rows.filter(x=>x.surrendered).length,timeout,winPctAll:100*wins/n,resolvedWinPct:n===timeout?null:100*wins/(n-timeout),seconds:avg('seconds'),DPS:rate('damage'),secondaryDPS:rate('secondary'),secondaryDotDPS:rate('secondaryDot'),piercesPerSec:rate('pierced'),damagePerMainHit:mean(rows.filter(x=>x.mainHits>0),x=>x.damage/x.mainHits),AP:mean(rows,x=>x.stats.attack||0),SP:mean(rows,x=>x.stats.spellPower||0),APS:mean(rows,x=>x.stats.attacksPerSec||0),HP:mean(rows,x=>x.stats.maxhp||0),defense:mean(rows,x=>x.stats.defense||0),block:mean(rows,x=>x.stats.blockChance||0),evasion:mean(rows,x=>x.stats.evasionRating||0),takenPerSec:rate('taken'),absorbedPerSec:rate('absorbed'),healingPerSec:rate('healing'),barrierPerSec:rate('barrier'),orbBarrier:avg('orbBarrier'),tomeMana:avg('tomeMana'),manaSpentPerSec:rate('manaSpent'),manaRemaining:mean(rows.filter(x=>x.mpMax>0),x=>100*x.mpEnd/x.mpMax),unfunded:avg('unfunded'),offHits:avg('offHits'),offDamage:avg('offDamage'),secondaryBleed:avg('secondaryBleed'),secondaryRot:avg('secondaryRot'),offBleed:avg('offBleed'),offRot:avg('offRot')};
}
function paired(cases,base,id){
 const ps=cases.map(c=>[c.rows.find(x=>x.id===base),c.rows.find(x=>x.id===id)]).filter(([a,b])=>!a.timeout&&!b.timeout),ds=ps.map(([a,b])=>100*(Number(b.won)-Number(a.won)));
 let state=731;const rng=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
 const draws=ds.length?Array.from({length:1000},()=>mean(ds,()=>ds[Math.floor(rng()*ds.length)])).sort((a,b)=>a-b):[];
 return {n:ds.length,delta:mean(ds,x=>x),CI:draws.length?[draws[24],draws[974]]:null,gains:ds.filter(x=>x>0).length,losses:ds.filter(x=>x<0).length,DPSDelta:mean(ps,([a,b])=>b.damage/b.seconds-a.damage/a.seconds)};
}
function aggregate(){
 const xs=[...studies.flatMap((_,si)=>scenarios.map((__,ci)=>read('loadout-'+si+'-'+ci))),...[0,1].flatMap(si=>[1,3].map(ci=>read('status-'+si+'-'+ci)))];assert.equal(new Set(xs.map(x=>x.source)).size,1);const results=[],all=xs.flatMap(x=>x.cases.flatMap(c=>c.rows));
 for(const x of xs){assert.equal(x.commit,process.env.GITHUB_SHA);assert.equal(x.cases.length,N);assert.equal(new Set(x.cases.map(c=>c.seed)).size,N);
  const base=x.kind==='status'?'native':x.si===3?'Staff':'Bow',ids=x.kind==='status'?variants.map(v=>v[0]):studies[x.si].arms.map(a=>a[0]);for(const c of x.cases)assert.deepEqual(c.rows.map(r=>r.id),ids);
  const arms=Object.fromEntries(ids.map(id=>[id,{...metrics(x.cases.map(c=>c.rows.find(r=>r.id===id))),paired:paired(x.cases,base,id)}]));
  for(const a of Object.values(arms))assert.equal(a.wins+a.deaths+a.surrenders+a.timeout,a.n);
  const interaction=x.kind==='status'?{DPS:arms['full-both'].DPS-arms['full-direct'].DPS-arms['full-status'].DPS+arms.native.DPS,winPct:arms['full-both'].winPctAll-arms['full-direct'].winPctAll-arms['full-status'].winPctAll+arms.native.winPctAll}:null;
  const row={kind:x.kind,study:x.study,scenario:x.scenario,base,arms,interaction};results.push(row);console.log('B31A_STUDY='+JSON.stringify(row));
 }
 assert.equal(all.length,7550);const summary={baseline:BASE,commit:process.env.GITHUB_SHA,source:xs[0].source,fights:all.length,timeouts:all.filter(x=>x.timeout).length,surrenders:all.filter(x=>x.surrendered).length,results,scope:'Controlled E10 Rare, 50 matched fresh seeds per cell; fixed legal talents or equal-budget Fury specialization; native same-tier items, identical non-hand rolls, not equal realized affixes or acquisition cost. Status variants VM-only. No natural balance claim.'};write('summary',summary);console.log('B31A_OVERVIEW='+JSON.stringify({...summary,results:undefined}));if(summary.timeouts)process.exitCode=1;
}
function smoke(){
 assert.equal(execFileSync('git',['diff','--name-only',BASE,'HEAD','--','combat','online','economy','index.html','docs/index.html','docs/combat','docs/online','docs/economy'],{encoding:'utf8'}).trim(),'','Production drift');
 assert.equal(source(false,false),native);assert.notEqual(source(true,false),native);assert.notEqual(source(false,true),native);
 for(let si=0;si<studies.length;si++)for(const ci of [0,1])pair(studies[si],scenarios[ci],0);
 for(const si of [0,1]){const rows=pair(studies[si],scenarios[1],1,true);assert(rows.rows.some(r=>r.pierced>0),'Missing Bow secondary-hit evidence');}
 console.log('B31A_SMOKE='+JSON.stringify({studies:studies.length,productionDrift:false}));
}
if(require.main===module){const [cmd,si,ci]=process.argv.slice(2);if(cmd==='smoke')smoke();else if(cmd==='loadout'||cmd==='status')write(cmd+'-'+si+'-'+ci,run(Number(si),Number(ci),cmd==='status'));else if(cmd==='aggregate')aggregate();else throw Error('Unknown command');}

module.exports={cell,metrics,paired,scenarios,source};
