'use strict';
// B3.1C: predeclared independent validation, and separate Staff resource diagnosis.
// All interventions are VM source overrides. No production balance changes.
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const S=require('./simulate-progression.cjs'),A=require('./v013-b31a-twohand-budget.cjs'),B=require('./v013-b31b-twohand-compensation.cjs');
const BASE='4a6acf2890431aeb98b8e3fd74f67a645e871fea',OUT='reports/b31c',PHYS_N=100,STAFF_N=50,SEED=101200001;
const sword=['Sword+Dagger','Sword','Off-Hand Dagger'],shield=['Sword+Shield','Sword','Shield'],daggers=['Dual Daggers','Daggers','Off-Hand Dagger'],orb=['Wand+Orb','Wand','Orb'],tome=['Wand+Tome','Wand','Tome'];
const physical=[
 ['blood-bow','blood-sword','Plate','Bow',sword],
 ['decay-bow','decay-cycle-bow','Leather','Bow',daggers],
 ['fury-bow','fury-bow','Leather','Bow',daggers],
 ['blood-twohand','blood-twohand','Plate','Two-Handed',sword],
 ['decay-twohand','decay-cycle-twohand','Leather','Two-Handed',daggers],
 ['fury-twohand','fury-twohand','Leather','Two-Handed',daggers],
 ['radiance-bow','radiance-sword','Plate','Bow',shield],
 ['radiance-twohand','radiance-mace','Plate','Two-Handed',shield],
 ['aegis-bow','aegis-sword','Plate','Bow',shield],
 ['aegis-twohand','aegis-mace','Plate','Two-Handed',['Mace+Shield','Mace','Shield']],
 ['hybrid-blood-fury-bow','hybrid-blood-fury','Leather','Bow',daggers],
 ['hybrid-decay-blood-twohand','hybrid-decay-blood','Plate','Two-Handed',sword]
].map(([id,profile,armor,weapon,ref])=>({id,profile,armor,weapon,ref:[ref],kind:'physical'}));
const staff=[
 ['arcane-staff','arcane-arcane-staff'],['decay-staff','decay-cycle-staff'],['fire-staff','arcane-fire-staff'],['hybrid-arcane-decay-staff','hybrid-arcane-decay']
].map(([id,profile])=>({id,profile,armor:'Cloth',weapon:'Staff',ref:[orb,tome],kind:'staff'}));
const mean=(rows,f)=>rows.length?rows.reduce((n,x)=>n+f(x),0)/rows.length:null;
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
function replace(s,a,b){assert.equal(s.split(a).length,2,'Source anchor '+a);return s.replace(a,b);}
function arms(st){
 const base=B.configs[st.weapon].base;
 const primary=(id,factor,extra={})=>({id,factor,loadout:[id,st.weapon,null],...extra});
 const candidates=st.kind==='physical'?[primary('native',base),primary('candidate',st.weapon==='Bow'?1.4:2.1,{status:st.weapon==='Bow'})]:[
 primary('native',base),primary('damage',1.75),primary('cost75',base,{cost:.75}),primary('damage+cost75',1.75,{cost:.75}),primary('damage+cost50-diagnostic',1.75,{cost:.5})];
 return [...candidates,...st.ref.map(loadout=>({id:loadout[0],factor:base,reference:true,loadout}))];
}
function manaRuntime(s,cost=1){
 // Apply the Staff-only cost factor at the shared base-price function; the
 // same value then reaches affordability, actual payment and starvation checks.
 if(cost!==1){
  assert([.75,.5].includes(cost));
  s=replace(s,"return row?.[{Wand:0,Staff:1,infusion:2,automatic:3}[kind]]??base;}","const price=row?.[{Wand:0,Staff:1,infusion:2,automatic:3}[kind]]??base;return kind==='Staff'?price*"+cost+":price;}");
 }
 s=replace(s,"if(s.caster||r.phase1Magic||s.phase2Decay)r.mp=Math.min(r.maxmp,r.mp+dt*s.manaRegen);","if(s.caster||r.phase1Magic||s.phase2Decay){const before=r.mp,potential=dt*s.manaRegen;r.mp=Math.min(r.maxmp,r.mp+potential);ports.phase6Metric(r,'stage648ManaRegenPotential',potential);ports.phase6Metric(r,'stage648ManaRegenActual',r.mp-before);}");
 s=replace(s,"mana(amount){r.mp=Math.min(r.maxmp,r.mp+Math.max(0,amount));},","mana(amount){const before=r.mp,potential=Math.max(0,amount);r.mp=Math.min(r.maxmp,r.mp+potential);ports.phase6Metric(r,'stage648ManaRefundPotential',potential);ports.phase6Metric(r,'stage648ManaRefundActual',r.mp-before);},");
 s=replace(s," const restored=Math.max(0,Math.min(manaPerRecall,r.maxmp-r.mp));"," const restored=Math.max(0,Math.min(manaPerRecall,r.maxmp-r.mp));ports.phase6Metric(r,'stage648ManaRefundPotential',manaPerRecall);ports.phase6Metric(r,'stage648ManaRefundActual',restored);");
 s=replace(s,"if(r.mp<cost)return false;r.mp-=cost;ports.phase6Metric(r,'manaSpent',cost);","if(r.mp<cost){ports.phase6Metric(r,'stage648ManaDarkDenied',1);return false;}r.mp-=cost;ports.phase6Metric(r,'stage648ManaDarkSpent',cost);ports.phase6Metric(r,'manaSpent',cost);");
 s=replace(s,"ports.phase6Metric(r,'manaSpent',cost);ports.phase6Metric(r,'fundedCasts',1);r.mp-=cost;cast=true;","ports.phase6Metric(r,'stage648ManaWeaponSpent',cost);ports.phase6Metric(r,'stage648ManaWeaponCasts',1);ports.phase6Metric(r,'manaSpent',cost);ports.phase6Metric(r,'fundedCasts',1);r.mp-=cost;cast=true;");
 s=replace(s,"r.mp-=cost;ports.phase6Metric(r,'manaSpent',cost);ports.phase6Metric(r,'infusionActivations',1);","r.mp-=cost;ports.phase6Metric(r,'stage648ManaInfusionSpent',cost);ports.phase6Metric(r,'manaSpent',cost);ports.phase6Metric(r,'infusionActivations',1);");
 s=replace(s,"b.runtime.lastSpellAt=ctx.now;ports.phase6Metric(r,'manaSpent',cost);","b.runtime.lastSpellAt=ctx.now;ports.phase6Metric(r,'stage648ManaElementalSpent',cost);ports.phase6Metric(r,'manaSpent',cost);");
 s=replace(s,"r.mp-=cost;ports.phase6Metric(r,'manaSpent',cost);ports.phase6Metric(r,'rotguardMana',cost);","r.mp-=cost;ports.phase6Metric(r,'stage648ManaRotguardSpent',cost);ports.phase6Metric(r,'manaSpent',cost);ports.phase6Metric(r,'rotguardMana',cost);");
 s=replace(s,"r.mp=Math.min(r.maxmp,r.mp+3);ports.addLog('🌀 Soul Sip restores Mana.'","const before=r.mp;r.mp=Math.min(r.maxmp,r.mp+3);ports.phase6Metric(r,'stage648ManaRefundPotential',3);ports.phase6Metric(r,'stage648ManaRefundActual',r.mp-before);ports.addLog('🌀 Soul Sip restores Mana.'");
 return s;
}
function cell(st,sc,i,arm,{seedBase=SEED,audit=st.kind==='staff',override=null}={}){
 const src=B.sources(st.weapon,override||arm),runtime=audit?manaRuntime(src.runtime,arm.cost||1):src.runtime;
 const r=A.cell(st,sc,i,arm.loadout,null,{id:arm.id,seedBase,runtime,buildcraft:src.buildcraft,manaAudit:audit});
 assert(r.directActual<=r.directRaw+1e-6&&r.directActual<=r.damage+1e-6);
 if(audit){
  const l=r.manaLedger;assert(l,'Missing mana ledger');assert(Math.abs(l.residual)<1e-6,'Mana conservation');assert(l.regenWasted>=-1e-6&&l.refundWasted>=-1e-6);
  const named=['Weapon','Dark','Infusion','Elemental','Rotguard'].reduce((n,k)=>n+(l.metrics['stage648Mana'+k+'Spent']||0),0);
  assert(named<=l.paid+1e-6,'Mana debit categories exceed total');r.otherPaid=l.paid-named;
 }
 return {...r,reference:!!arm.reference,factor:arm.factor,cost:arm.cost||1,status:!!arm.status,sourceHash:hash(runtime),buildcraftHash:hash(src.buildcraft)};
}
function pair(st,sc,i){
 const aa=arms(st),rows=aa.map(a=>cell(st,sc,i,a)),b=rows[0];
 for(const r of rows){
  assert.equal(r.resolved,b.resolved);assert.equal(r.rosterHash,b.rosterHash);assert.equal(r.nonHands,b.nonHands);assert.deepEqual(r.nodes,b.nodes);
  if(!r.reference){assert.equal(r.gearHash,b.gearHash);assert.deepEqual(r.stats,b.stats);}
 }
 return {seed:b.seed,rows};
}
function scenarios(st){return st.kind==='physical'?A.scenarios:A.scenarios.filter(s=>['solo','group12','boss'].includes(s.id));}
function write(name,x){fs.mkdirSync(OUT,{recursive:true});fs.writeFileSync(OUT+'/'+name+'.json',JSON.stringify(x,null,2));}
function run(kind,si,ci){
 const st=(kind==='physical'?physical:staff)[si],sc=scenarios(st)[ci],n=kind==='physical'?PHYS_N:STAFF_N;assert(st&&sc);
 const cases=Array.from({length:n},(_,i)=>pair(st,sc,i));write(kind+'-'+si+'-'+ci,{kind,si,ci,study:st.id,scenario:sc.id,commit:process.env.GITHUB_SHA||null,native:S.sourceFingerprint().sha256,cases});
}
function metrics(rows){
 const m=B.metrics(rows);
 if(!rows[0].manaLedger)return m;
 const sum=f=>rows.reduce((n,r)=>n+f(r),0),sec=sum(r=>r.seconds),led=k=>mean(rows,r=>r.manaLedger[k]),met=k=>mean(rows,r=>r.manaLedger.metrics['stage648Mana'+k]||0);
 return {...m,mana:{pool:led('pool'),baseRegen:mean(rows,r=>r.stats.manaRegen),regenActual:led('regen'),regenWasted:led('regenWasted'),refundActual:led('refundActual'),refundWasted:led('refundWasted'),otherGain:led('otherGain'),otherLoss:led('otherLoss'),min:led('min'),atCapPct:100*sum(r=>r.manaLedger.atCapSeconds)/sec,belowOnePct:100*sum(r=>r.manaLedger.belowOneSeconds)/sec,starvedPct:100*sum(r=>r.manaStarvedSeconds)/sec,weaponSpent:met('WeaponSpent'),weaponCasts:met('WeaponCasts'),darkSpent:met('DarkSpent'),darkDenied:met('DarkDenied'),infusionSpent:met('InfusionSpent'),elementalSpent:met('ElementalSpent'),rotguardSpent:met('RotguardSpent'),otherPaid:mean(rows,r=>r.otherPaid),unfundedPct:sum(r=>r.mainHits)?100*sum(r=>r.unfunded)/sum(r=>r.mainHits):null,paidPerSec:sum(r=>r.manaLedger.paid)/sec,maxResidual:Math.max(...rows.map(r=>Math.abs(r.manaLedger.residual)))}};
}
function aggregate(){
 const xs=[...physical.flatMap((st,si)=>scenarios(st).map((sc,ci)=>['physical',si,ci])),...staff.flatMap((st,si)=>scenarios(st).map((sc,ci)=>['staff',si,ci]))].map(([k,i,j])=>JSON.parse(fs.readFileSync(OUT+'/'+k+'-'+i+'-'+j+'.json','utf8')));
 assert.equal(new Set(xs.map(x=>x.native)).size,1);const results=[],all=xs.flatMap(x=>x.cases.flatMap(c=>c.rows));
 for(const x of xs){
  const st=(x.kind==='physical'?physical:staff)[x.si],n=x.kind==='physical'?PHYS_N:STAFF_N,ids=arms(st).map(a=>a.id);assert.equal(x.commit,process.env.GITHUB_SHA);assert.equal(x.cases.length,n);assert.equal(new Set(x.cases.map(c=>c.seed)).size,n);for(const c of x.cases)assert.deepEqual(c.rows.map(r=>r.id),ids);
  const by=Object.fromEntries(ids.map(id=>[id,{...metrics(x.cases.map(c=>c.rows.find(r=>r.id===id))),paired:A.paired(x.cases,'native',id)}]));
  for(const a of Object.values(by))assert.equal(a.wins+a.deaths+a.surrenders+a.timeout,a.n);
  const ref=ids.filter(id=>!['native','candidate','damage','cost75','damage+cost75','damage+cost50-diagnostic'].includes(id));
  const referencePairs=Object.fromEntries(ref.map(id=>[id,Object.fromEntries(ids.filter(k=>!ref.includes(k)).map(k=>[k,A.paired(x.cases,id,k)]))]));
  const interaction=x.kind==='staff'?{DPS:by['damage+cost75'].DPS-by.damage.DPS-by.cost75.DPS+by.native.DPS,winPct:by['damage+cost75'].winPctAll-by.damage.winPctAll-by.cost75.winPctAll+by.native.winPctAll}:null;
  const out={kind:x.kind,study:x.study,scenario:x.scenario,arms:by,referencePairs,interaction};results.push(out);
  console.log('B31C_STUDY='+JSON.stringify({kind:x.kind,study:x.study,scenario:x.scenario,arms:Object.fromEntries(Object.entries(by).map(([id,v])=>[id,{n:v.n,wins:v.wins,timeout:v.timeout,DPS:v.DPS,basePerMainHit:v.basePerMainHit,effectiveMainHit:v.effectiveMainHit,secondaryDPS:v.secondaryDPS,secondaryDotDPS:v.secondaryDotDPS,takenPerSec:v.takenPerSec,absorbedPerSec:v.absorbedPerSec,unfunded:v.unfunded,manaRemaining:v.manaRemaining,mana:v.mana,paired:v.paired}])),interaction,referencePairs}));
 }
 assert.equal(all.length,22200);const summary={baseline:BASE,commit:process.env.GITHUB_SHA,native:xs[0].native,fights:all.length,timeouts:all.filter(x=>x.timeout).length,surrenders:all.filter(x=>x.surrendered).length,results,scope:'100 independent matched seeds physical candidates; 50 matched Staff diagnostic seeds; fixed legal talents per panel, contextual references not independently optimized. VM only; no natural global balance claim.'};write('summary',summary);console.log('B31C_OVERVIEW='+JSON.stringify({...summary,results:undefined}));if(summary.timeouts)process.exitCode=1;
}
function smoke(){
 assert.equal(execFileSync('git',['diff','--name-only',BASE,'HEAD','--','combat','online','economy','index.html','docs/index.html','docs/combat','docs/online','docs/economy'],{encoding:'utf8'}).trim(),'','Production drift');
 const outcome=['won','died','surrendered','timeout','seconds','damage','taken','directBase','directRaw','directActual','manaSpent','mpEnd','unfunded','mainHits'];
 for(const st of [...physical,...staff]){
  const sc=scenarios(st)[0],aa=arms(st);pair(st,sc,0);pair(st,scenarios(st)[1],1);
  // Compare observer to uninstrumented resource accounting on identical source and seed.
  if(st.kind==='staff'){for(const a of aa.filter(x=>!x.cost)){const old=cell(st,sc,0,a,{audit:false}),next=cell(st,sc,0,a);for(const k of outcome)assert.deepEqual(next[k],old[k],'Mana observer drift '+st.id+' '+k);}}
  // Non-targeted one-handed reference must be unaffected by the candidate sources.
  const reference=aa.find(a=>a.reference),control=cell(st,sc,0,reference),experimental=cell(st,sc,0,reference,{override:aa[1]});
  for(const k of outcome)assert.deepEqual(experimental[k],control[k],'One-handed control drift '+st.id+' '+k);
 }
 console.log('B31C_SMOKE='+JSON.stringify({physical:physical.length,staff:staff.length,productionDrift:false,oneHandControls:true,manaObserverParity:true}));
}
if(require.main===module){const [cmd,kind,si,ci]=process.argv.slice(2);if(cmd==='smoke')smoke();else if(cmd==='study')run(kind,Number(si),Number(ci));else if(cmd==='aggregate')aggregate();else throw Error('Unknown command');}

module.exports={manaRuntime,metrics,physical,staff,arms};
