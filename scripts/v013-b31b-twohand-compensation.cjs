'use strict';
// Candidate sources are injected into the native VM only. Do not edit shipped coefficients.
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const S=require('./simulate-progression.cjs'),A=require('./v013-b31a-twohand-budget.cjs');
const BASE='a522bd6ffd655c0c72104284abafa5ab62c3422c',OUT='reports/b31b',N=20,SEED=100800001;
const runtime=fs.readFileSync('combat/v012-combat-runtime.js','utf8'),buildcraft=fs.readFileSync('combat/v012-buildcraft.js','utf8');
const specs=[
 {id:'blood-bow',profile:'blood-sword',armor:'Plate',weapon:'Bow',ref:[['Sword+Dagger','Sword','Off-Hand Dagger']]},
 {id:'decay-bow',profile:'decay-cycle-bow',armor:'Leather',weapon:'Bow',ref:[['Dual Daggers','Daggers','Off-Hand Dagger']]},
 {id:'fury-bow',profile:'fury-bow',armor:'Leather',weapon:'Bow',ref:[['Dual Daggers','Daggers','Off-Hand Dagger']]},
 {id:'blood-twohand',profile:'blood-twohand',armor:'Plate',weapon:'Two-Handed',ref:[['Sword+Dagger','Sword','Off-Hand Dagger']]},
 {id:'decay-twohand',profile:'decay-cycle-twohand',armor:'Leather',weapon:'Two-Handed',ref:[['Dual Daggers','Daggers','Off-Hand Dagger']]},
 {id:'fury-twohand',profile:'fury-twohand',armor:'Leather',weapon:'Two-Handed',ref:[['Dual Daggers','Daggers','Off-Hand Dagger']]},
 {id:'arcane-staff',profile:'arcane-arcane-staff',armor:'Cloth',weapon:'Staff',ref:[['Wand+Orb','Wand','Orb'],['Wand+Tome','Wand','Tome']]},
 {id:'decay-staff',profile:'decay-cycle-staff',armor:'Cloth',weapon:'Staff',ref:[['Wand+Orb','Wand','Orb'],['Wand+Tome','Wand','Tome']]}
];
const configs={Bow:{base:1.08,levels:[1.25,1.4,1.55]},'Two-Handed':{base:1.7,levels:[1.9,2.1,2.3]},Staff:{base:1.32,levels:[1.45,1.6,1.75]}};
const mean=(rows,f)=>rows.length?rows.reduce((n,x)=>n+f(x),0)/rows.length:null,hash=x=>crypto.createHash('sha256').update(x).digest('hex');
function replace(s,a,b){assert.equal(s.split(a).length,2,'Source anchor '+a);return s.replace(a,b);}
function arms(st){
 const c=configs[st.weapon],a=[{id:'native',factor:c.base},...c.levels.map(factor=>({id:'factor-'+factor,factor}))];
 if(st.weapon==='Bow')a.push({id:'status-only',factor:c.base,status:true},{id:'1.4+status',factor:1.4,status:true},{id:'1.4+full-piercing',factor:1.4,status:true,direct:true});
 return [...a.map(x=>({...x,loadout:[x.id,st.weapon,null]})),...st.ref.map(loadout=>({id:loadout[0],factor:c.base,loadout,reference:true}))];
}
function sources(weapon,arm){
 // B3.1A status/direct factorial already isolates Bow. Keep native status on all other arms.
 let r=A.source(!!arm.direct,!!arm.status),b=buildcraft;
 const f=String(arm.factor),c=configs[weapon];
 if(!arm.reference&&arm.factor!==c.base){
  if(weapon==='Staff'){
   r=replace(r,"kind==='Staff'?1.32:1.05","kind==='Staff'?"+f+":1.05");
   b=replace(b,"kind==='Staff'?sp*1.32:","kind==='Staff'?sp*"+f+":");
  }else if(weapon==='Bow'){
   r=replace(r,"kind==='Bow'?1.08:","kind==='Bow'?"+f+":");
   r=replace(r,"Bow:1.08,","Bow:"+f+",");
   b=replace(b,"Bow:1.08,","Bow:"+f+",");
  }else{
   r=replace(r,"kind==='Two-Handed'?1.70:","kind==='Two-Handed'?"+f+":");
   r=replace(r,"'Two-Handed':1.70,","'Two-Handed':"+f+",");
   b=replace(b,"'Two-Handed':1.70,","'Two-Handed':"+f+",");
  }
 }
 // Identical passive counters on all arms, including native and one-hand references.
 r=replace(r,' const base=damage;r.lastBaseHit=base;', " const base=damage;r.lastBaseHit=base;\n if(!offhandStrike)ports.phase6Metric(r,'secondaryEquipmentStatusB31BMainBase',base);");
 r=replace(r,' const hpBefore=e.hp,barrierBefore=e.barrier;', " if(!offhandStrike)ports.phase6Metric(r,'secondaryEquipmentStatusB31BMainRaw',damage);\n const hpBefore=e.hp,barrierBefore=e.barrier;");
 r=replace(r," if(offhandStrike)ports.phase6Metric(r,'secondaryEquipmentStatusOffhandDamage',real);"," if(offhandStrike)ports.phase6Metric(r,'secondaryEquipmentStatusOffhandDamage',real);\n else ports.phase6Metric(r,'secondaryEquipmentStatusB31BMainActual',real);");
 return {runtime:r,buildcraft:b};
}
function cell(st,sc,i,arm,seedBase=SEED){
 const src=sources(st.weapon,arm);
 const row=A.cell(st,sc,i,arm.loadout,null,{id:arm.id,seedBase,...src});
 assert(row.mainHits>0||row.directBase===0);assert(row.directActual<=row.directRaw+1e-6);assert(row.directActual<=row.damage+1e-6);assert(!row.off||arm.reference);
 return {...row,factor:arm.factor,status:!!arm.status,direct:!!arm.direct,reference:!!arm.reference,sourceHash:hash(src.runtime),buildcraftHash:hash(src.buildcraft)};
}
function pair(st,sc,i,seedBase=SEED){
 const rows=arms(st).map(a=>cell(st,sc,i,a,seedBase)),b=rows[0];
 for(const r of rows){
  assert.equal(r.resolved,b.resolved);assert.equal(r.rosterHash,b.rosterHash);assert.equal(r.nonHands,b.nonHands);assert.deepEqual(r.nodes,b.nodes);
  if(!r.reference){assert.equal(r.gearHash,b.gearHash);assert.deepEqual(r.stats,b.stats,'Stat drift');}
  // All non-piercing variants remain identical in solo if only secondary status changed.
  if(st.weapon==='Bow'&&sc.id==='solo'&&r.id==='status-only')for(const k of ['won','died','surrendered','timeout','seconds','damage','taken','directBase','directRaw','directActual'])assert.deepEqual(r[k],b[k],'Solo status drift '+k);
 }
 return {seed:b.seed,rows};
}
function write(name,x){fs.mkdirSync(OUT,{recursive:true});fs.writeFileSync(OUT+'/'+name+'.json',JSON.stringify(x,null,2));}
function run(si,ci){
 const st=specs[si],sc=A.scenarios[ci];assert(st&&sc);const cases=Array.from({length:N},(_,i)=>pair(st,sc,i));
 write('study-'+si+'-'+ci,{si,ci,study:st.id,scenario:sc.id,commit:process.env.GITHUB_SHA||null,native:S.sourceFingerprint().sha256,cases});
}
function metrics(rows){
 return {...A.metrics(rows),basePerMainHit:mean(rows.filter(x=>x.mainHits>0),x=>x.directBase/x.mainHits),rawPerMainHit:mean(rows.filter(x=>x.mainHits>0),x=>x.directRaw/x.mainHits),effectiveMainHit:mean(rows.filter(x=>x.mainHits>0),x=>x.directActual/x.mainHits),mainDirectDPS:mean(rows,x=>x.seconds?x.directActual/x.seconds:0),infusionDPS:mean(rows,x=>x.seconds?x.infusionDamage/x.seconds:0),fundedHits:mean(rows,x=>x.fundedHits)};
}
function aggregate(){
 const xs=specs.flatMap((st,si)=>A.scenarios.map((sc,ci)=>JSON.parse(fs.readFileSync(OUT+'/study-'+si+'-'+ci+'.json','utf8'))));assert.equal(new Set(xs.map(x=>x.native)).size,1);const results=[],all=xs.flatMap(x=>x.cases.flatMap(c=>c.rows));
 for(const x of xs){assert.equal(x.commit,process.env.GITHUB_SHA);assert.equal(x.cases.length,N);assert.equal(new Set(x.cases.map(c=>c.seed)).size,N);
  const ids=arms(specs[x.si]).map(a=>a.id);for(const c of x.cases)assert.deepEqual(c.rows.map(r=>r.id),ids);
  const by=Object.fromEntries(ids.map(id=>[id,{...metrics(x.cases.map(c=>c.rows.find(r=>r.id===id))),paired:A.paired(x.cases,'native',id)}]));
  for(const a of Object.values(by))assert.equal(a.wins+a.deaths+a.surrenders+a.timeout,a.n);
  const out={study:x.study,scenario:x.scenario,arms:by};results.push(out);console.log('B31B_STUDY='+JSON.stringify(out));
 }
 assert.equal(all.length,5100);const summary={baseline:BASE,commit:process.env.GITHUB_SHA,native:xs[0].native,fights:all.length,timeouts:all.filter(x=>x.timeout).length,surrenders:all.filter(x=>x.surrendered).length,results,scope:'20-seed screening; full native loadouts, fixed legal talents per panel; VM-only compensation; reference loadouts not specialized; held-out 50-100 seed confirmation required before approval.'};write('summary',summary);console.log('B31B_OVERVIEW='+JSON.stringify({...summary,results:undefined}));if(summary.timeouts)process.exitCode=1;
}
function smoke(){
 assert.equal(execFileSync('git',['diff','--name-only',BASE,'HEAD','--','combat','online','economy','index.html','docs/index.html','docs/combat','docs/online','docs/economy'],{encoding:'utf8'}).trim(),'','Production drift');
 for(const st of specs){
  const sc=A.scenarios[0],a=arms(st)[0],old=A.cell(st,sc,0,a.loadout),next=cell(st,sc,0,a,100700001);
  for(const k of Object.keys(old))assert.deepEqual(next[k],old[k],'Native instrumentation drift '+st.id+' '+k);
  pair(st,sc,0);pair(st,A.scenarios[1],1);
  // A higher coefficient must actually increase observed base hit on at least one of the tested samples.
  const test=pair(st,sc,2).rows;assert(test.slice(1,4).some(r=>r.directBase/r.mainHits>test[0].directBase/test[0].mainHits),'No observed main-hit increase '+st.id);
 }
 console.log('B31B_SMOKE='+JSON.stringify({studies:specs.length,productionDrift:false,unchangedNative:true}));
}
if(require.main===module){const [cmd,si,ci]=process.argv.slice(2);if(cmd==='smoke')smoke();else if(cmd==='study')run(Number(si),Number(ci));else if(cmd==='aggregate')aggregate();else throw Error('Unknown command');}
