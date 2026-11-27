'use strict';
// B3.2D.9A: natural candidate comparison with actual earned gear, same policy.
// Detached VM overrides only. Candidate mechanics must not reach gameplay files.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const S=require('./simulate-progression.cjs'),N=require('./v013-natural-progression.cjs'),D=require('./v013-b12d-clean-natural-rebaseline.cjs'),A=require('./v013-b12c1-advanced-agent-audit.cjs'),G=require('./v013-global-e10.cjs'),{T}=require('../tests/v013-current-talent-helper.cjs');
const BASE='6ca5b95d1762c89b43cabbf3b44fb2fbdf1e638b',OUT='reports/b32d9a',SEED=119300001,COUNT=12;
const IDS=['smart-blood-sword','smart-arcane-lightning-pure','smart-fury-daggers','smart-fury-bow','pure-aegis','smart-radiance-pure','smart-decay-cycle-daggers','smart-decay-cycle-wand','smart-arcane-arcane-pure','smart-arcane-fire-pure','arcane-frost','hybrid-decay-blood','smart-blood-fury','smart-blood-two-handed'];
const ARMS=[{id:'A',parry:.18,dual:false},{id:'B',parry:.18,dual:true},{id:'C',parry:.15,dual:false},{id:'D',parry:.12,dual:false},{id:'E',parry:.15,dual:true}];
const file='combat/v012-combat-runtime.js',original=fs.readFileSync(path.resolve(__dirname,'..',file),'utf8'),sha=s=>crypto.createHash('sha256').update(s).digest('hex'),n=x=>Number(x)||0,sum=(a,f)=>a.reduce((s,x)=>s+f(x),0),mean=(a,f)=>a.length?sum(a,f)/a.length:null,pct=(a,b)=>b?100*a/b:null;
const count=(a,f)=>a.reduce((s,x)=>{const k=f(x);if(k!=null)s[k]=(s[k]||0)+1;return s;},{});
const seed=(pi,i)=>SEED+pi*100003+i*131,dual=o=>['Daggers','Off-Hand Dagger'].includes(o),packageOf=(w,o)=>w+'/'+(dual(o)?'Dagger':o||'None');
function replace(s,a,b){assert.equal(s.split(a).length,2,'Source contract '+a.slice(0,100));return s.replace(a,b);}
function runtime(arm){
 let s=original;
 // Telemetry for existing single proc in all arms, and identical new dual proc
 // as D9 in B/E. Existing single proc remains enabled and unchanged.
 const start=" if(!offhandStrike&&ports.WANDERER_DOUBLE_STRIKE_ENABLED&&kind==='Daggers'&&!['Daggers','Off-Hand Dagger'].includes(off?.subtype)&&damage>0&&e.hp>0&&ports.gameRandom()<.25){\n  // One ordinary pre-critical main-hand hit, with no further rolls or recursive triggers.\n  ports.setDirectEnemyDamage(r,Math.max(1,Math.round(base*.55)),'🗡 Double Attack!');\n }";
 const next=` if(!offhandStrike&&ports.WANDERER_DOUBLE_STRIKE_ENABLED&&kind==='Daggers'&&damage>0&&e.hp>0){
  const dual=['Daggers','Off-Hand Dagger'].includes(off?.subtype);
  if(!dual||${arm.dual}){
   const key=dual?'secondaryEquipmentStatusB32D9ADual':'secondaryEquipmentStatusB32D9ASingle';
   ports.phase6Metric(r,key+'Eligible',1);
   if(ports.gameRandom()<.25){
    const before=e.hp;
    ports.setDirectEnemyDamage(r,Math.max(1,Math.round(base*.55)),'🗡 Double Attack!');
    ports.phase6Metric(r,key+'Hits',1);
    ports.phase6Metric(r,key+'HPDamage',Math.max(0,before-Math.max(0,e.hp)));
   }
  }
 }`;
 s=replace(s,start,next);
 if(arm.parry!==.18)s=replace(s,"s.main?.subtype==='Sword'&&ports.gameRandom()<.18","s.main?.subtype==='Sword'&&ports.gameRandom()<"+arm.parry);
 return s;
}
const sources=Object.fromEntries(ARMS.map(a=>[a.id,runtime(a)]));
function profile(id){return {...D.approvedProfile(id),offhandPolicy:'b23',equipmentIntelligence:'b32d7-combat-aware'};}
function verifyModules(arm,entries){const m=entries.find(x=>x.file===file);assert(m&&m.overridden);assert.equal(m.sha256,sha(sources[arm.id]));}
function telemetry(rooms){
 const metrics=rooms.flatMap(r=>Object.entries(r.abilityMetrics||{}));
 const keys=['secondaryEquipmentStatusB32D9ASingleEligible','secondaryEquipmentStatusB32D9ASingleHits','secondaryEquipmentStatusB32D9ASingleHPDamage','secondaryEquipmentStatusB32D9ADualEligible','secondaryEquipmentStatusB32D9ADualHits','secondaryEquipmentStatusB32D9ADualHPDamage','secondaryEquipmentStatusOffhandStrikes','secondaryEquipmentStatusOffhandDamage','parries','shield'];
 return Object.fromEntries(keys.map(k=>[k,sum(metrics,([id,v])=>id===k?n(v):0)]));
}
function fights(rs){return {n:rs.length,wins:rs.filter(r=>r.won).length,deaths:rs.filter(r=>r.died).length,surrenders:rs.filter(r=>r.surrendered).length,timeouts:rs.filter(r=>r.timedOut).length,damage:sum(rs,r=>n(r.damageDealt)),seconds:sum(rs,r=>n(r.seconds)),hpEndSum:sum(rs,r=>100*n(r.hpEnd)/Math.max(1,n(r.hpMax))),manaRooms:rs.filter(r=>r.mpMax>0).length,manaEndSum:sum(rs.filter(r=>r.mpMax>0),r=>100*r.mpEnd/r.mpMax),funded:sum(rs,r=>n(r.fundedCasts)),unfunded:sum(rs,r=>n(r.unfundedCasterAttacks)),telemetry:telemetry(rs)};}
const KINDS=['combat','elite','boss'];
function account(pi,arm,i,config=D.CONFIG){
 const id=IDS[pi],p=profile(id),s=seed(pi,i),camps=[];let loaded=false;
 const acc=N.simulateAccount(s,id,{...N.DEFAULTS,...config,tickLimit:13000},{researchProfiles:{[id]:p},decisionModel:'adaptive',equipEarnedRunes:true,moduleOverrides:{[file]:sources[arm.id]},recordModules:entries=>{verifyModules(arm,entries);loaded=true;},onCamp:({a,level,attempt})=>{
  const st=a.state(),w=st.equip.weapon?.subtype,o=st.equip.offhand?.subtype||null,available=[...Object.values(st.equip),...st.stash].filter(Boolean);
  camps.push({level,attempt,weapon:w,offhand:o,preferred:p.weapons.includes(w),ownsPreferred:available.some(x=>x.slot==='weapon'&&p.weapons.includes(x.subtype)),ownsDual:available.some(x=>x.slot==='weapon'&&x.subtype==='Daggers')&&available.some(x=>x.slot==='offhand'&&dual(x.subtype))});
  return {legal:a.talents.valid(st.automaticTalents),stats:a.baseStats()};
 }});
 assert(loaded);assert.equal(acc.startXp,0);assert(acc.initialGear.items.every(x=>x.startingGear));
 const audit=A.audit(id,[acc]),issues=[...audit.issues];for(const t of acc.attempts)issues.push(...D.compatibilityIssues(t,p));
 const errors=acc.attempts.filter(x=>x.error);assert.deepEqual(errors.map(x=>({level:x.level,attempt:x.attempt,error:x.error,diagnostic:x.diagnostic})),[]);assert.deepEqual(audit.errors,[]);assert.deepEqual(issues,[]);
 const rs=acc.attempts.flatMap(t=>(t.rooms||[]).map(r=>({...r,level:t.level}))),m=fights(rs),tc=m.telemetry;
 if(!arm.dual)assert.equal(tc.secondaryEquipmentStatusB32D9ADualHits,0);
 assert(tc.secondaryEquipmentStatusB32D9ADualHits<=tc.secondaryEquipmentStatusB32D9ADualEligible);assert(tc.secondaryEquipmentStatusB32D9ASingleHits<=tc.secondaryEquipmentStatusB32D9ASingleEligible);
 const crafts=acc.attempts.flatMap(t=>t.camp?.crafted||[]),buys=acc.attempts.flatMap(t=>t.camp?.bought||[]);
 const w=acc.finalGear.items.find(x=>x.slot==='weapon')?.subtype,o=acc.finalGear.items.find(x=>x.slot==='offhand')?.subtype||null;
 return {id,pi,i,arm:arm.id,seed:s,startGear:acc.initialGear,endLevel:acc.endLevel,reachedE10:acc.endLevel>=10,clearedE10:acc.endLevel>=11,xp:acc.xp,attempts:acc.attempts.length,stopReason:acc.stopReason,finalWeapon:w,finalOffhand:o,preferred:p.weapons.includes(w),camps,crafts:crafts.length,buys:buys.length,fragmentsSpent:sum(crafts,x=>n(x.fragmentsSpent)),essenceSpent:sum(crafts,x=>n(x.essenceSpent)),goldSpent:sum(buys,x=>n(x.cost)),all:m,e10:fights(rs.filter(r=>r.level===10)),e10Kinds:Object.fromEntries(KINDS.map(k=>[k,fights(rs.filter(r=>r.level===10&&r.kind===k))])),allKinds:Object.fromEntries(KINDS.map(k=>[k,fights(rs.filter(r=>r.kind===k))])),packages:Object.fromEntries([...new Set(rs.map(r=>packageOf(r.actualWeapon,r.actualOffhand)))].map(k=>[k,fights(rs.filter(r=>packageOf(r.actualWeapon,r.actualOffhand)===k))]))};
}
function write(name,x){fs.mkdirSync(OUT,{recursive:true});fs.writeFileSync(OUT+'/'+name+'.json',JSON.stringify(x));}
function run(pi,ai){const arm=ARMS[ai];assert(IDS[pi]&&arm);const rows=Array.from({length:COUNT},(_,i)=>account(pi,arm,i));write('study-'+pi+'-'+ai,{pi,ai,id:IDS[pi],arm:arm.id,commit:process.env.GITHUB_SHA,native:S.sourceFingerprint().sha256,source:sha(sources[arm.id]),rows});console.log('B32D9A_SHARD='+JSON.stringify({id:IDS[pi],arm:arm.id,accounts:rows.length,clears:rows.filter(r=>r.clearedE10).length,timeouts:sum(rows,r=>r.all.timeouts)}));}
function combine(ms){
 const keys=['n','wins','deaths','surrenders','timeouts','damage','seconds','hpEndSum','manaRooms','manaEndSum','funded','unfunded'],r=Object.fromEntries(keys.map(k=>[k,sum(ms,m=>n(m[k]))]));
 const tkeys=[...new Set(ms.flatMap(m=>Object.keys(m.telemetry)))],t=Object.fromEntries(tkeys.map(k=>[k,sum(ms,m=>n(m.telemetry[k]))]));
 return {...r,winPct:pct(r.wins,r.n),dps:r.seconds?r.damage/r.seconds:null,hpEndPct:r.n?r.hpEndSum/r.n:null,manaEndPct:r.manaRooms?r.manaEndSum/r.manaRooms:null,telemetry:t,dualRate:pct(t.secondaryEquipmentStatusB32D9ADualHits,t.secondaryEquipmentStatusB32D9ADualEligible),singleRate:pct(t.secondaryEquipmentStatusB32D9ASingleHits,t.secondaryEquipmentStatusB32D9ASingleEligible)};
}
function stats(rows){
 const camps=rows.flatMap(r=>r.camps),e10=camps.filter(c=>c.level===10),lastE10=rows.map(r=>r.camps.filter(c=>c.level===10).at(-1)).filter(Boolean);
 return {accounts:rows.length,reachedE10:rows.filter(r=>r.reachedE10).length,clearedE10:rows.filter(r=>r.clearedE10).length,meanEndLevel:mean(rows,r=>r.endLevel),meanXp:mean(rows,r=>r.xp),attempts:sum(rows,r=>r.attempts),finalPreferred:rows.filter(r=>r.preferred).length,finalWeapons:count(rows,r=>r.finalWeapon),finalPackages:count(rows,r=>packageOf(r.finalWeapon,r.finalOffhand)),e10Packages:count(lastE10,c=>packageOf(c.weapon,c.offhand)),e10OwnPreferred:lastE10.filter(c=>c.ownsPreferred).length,e10OwnDual:lastE10.filter(c=>c.ownsDual).length,dualCamps:camps.filter(c=>c.weapon==='Daggers'&&dual(c.offhand)).length,preferredCamps:camps.filter(c=>c.preferred).length,crafts:sum(rows,r=>r.crafts),buys:sum(rows,r=>r.buys),fragmentsSpent:sum(rows,r=>r.fragmentsSpent),essenceSpent:sum(rows,r=>r.essenceSpent),goldSpent:sum(rows,r=>r.goldSpent),all:combine(rows.map(r=>r.all)),e10:combine(rows.map(r=>r.e10)),e10Kinds:Object.fromEntries(KINDS.map(k=>[k,combine(rows.map(r=>r.e10Kinds[k]))])),allKinds:Object.fromEntries(KINDS.map(k=>[k,combine(rows.map(r=>r.allKinds[k]))])),packages:Object.fromEntries([...new Set(rows.flatMap(r=>Object.keys(r.packages)))].map(k=>[k,combine(rows.map(r=>r.packages[k]).filter(Boolean))]))};
}
function paired(a,b){assert.equal(a.length,b.length);const dif=b.map((r,i)=>{assert.equal(r.seed,a[i].seed);assert.deepEqual(r.startGear,a[i].startGear);return Number(r.clearedE10)-Number(a[i].clearedE10);});return {n:dif.length,deltaPP:100*mean(dif,x=>x),controlOnly:dif.filter(x=>x===-1).length,candidateOnly:dif.filter(x=>x===1).length,meanEndLevelDelta:mean(b,r=>r.endLevel)-mean(a,r=>r.endLevel)};}
function compact(m){return {accounts:m.accounts,reachedE10:m.reachedE10,clearedE10:m.clearedE10,meanEndLevel:m.meanEndLevel,finalPreferred:m.finalPreferred,finalWeapons:m.finalWeapons,finalPackages:m.finalPackages,e10Packages:m.e10Packages,e10OwnDual:m.e10OwnDual,dualCamps:m.dualCamps,crafts:m.crafts,buys:m.buys,fragmentsSpent:m.fragmentsSpent,all:{n:m.all.n,wins:m.all.wins,winPct:m.all.winPct,timeouts:m.all.timeouts,telemetry:m.all.telemetry},e10Kinds:Object.fromEntries(KINDS.map(k=>[k,{n:m.e10Kinds[k].n,wins:m.e10Kinds[k].wins,winPct:m.e10Kinds[k].winPct}]))};}
function aggregate(){
 const xs=IDS.flatMap((id,pi)=>ARMS.map((arm,ai)=>JSON.parse(fs.readFileSync(OUT+'/study-'+pi+'-'+ai+'.json','utf8'))));assert.equal(new Set(xs.map(x=>x.native)).size,1);for(const x of xs){assert.equal(x.commit,process.env.GITHUB_SHA);assert.equal(x.source,sha(sources[x.arm]));assert.equal(x.rows.length,COUNT);}
 const rows=xs.flatMap(x=>x.rows),results=IDS.map((id,pi)=>{const by=Object.fromEntries(ARMS.map(a=>[a.id,rows.filter(r=>r.pi===pi&&r.arm===a.id)]));return {id,arms:Object.fromEntries(ARMS.map(a=>[a.id,stats(by[a.id])])),paired:Object.fromEntries(ARMS.slice(1).map(a=>[a.id,paired(by.A,by[a.id])]))};});
 const by=Object.fromEntries(ARMS.map(a=>[a.id,rows.filter(r=>r.arm===a.id)])),arms=Object.fromEntries(ARMS.map(a=>[a.id,stats(by[a.id])])),pair=Object.fromEntries(ARMS.slice(1).map(a=>[a.id,paired(by.A,by[a.id])]));
 assert.equal(rows.length,IDS.length*ARMS.length*COUNT);
 const interaction=100*(arms.E.clearedE10-arms.B.clearedE10-arms.C.clearedE10+arms.A.clearedE10)/arms.A.accounts;
 const report={baseline:BASE,commit:process.env.GITHUB_SHA,native:xs[0].native,accounts:rows.length,matchedSeedGroups:by.A.length,arms,paired:pair,interactionClearPP:interaction,results,scope:'Natural E1-E10, twelve independent matched seeds per profile. Combat-Aware decision policy frozen, so does not know the changed candidate coefficients: observed exposure/selection is not a test of updated intelligence. A instrumented native control, B dual Double Attack, C/D parry 15/12, E combined B+C. Same starting gear/seed, later earned equipment and encounter selections may diverge. No automatic acceptance; timeouts distinct; natural E10 room rates conditional on reach and selected encounters.'};
 write('summary',report);console.log('B32D9A_OVERVIEW='+JSON.stringify({...report,results:undefined,arms:Object.fromEntries(ARMS.map(a=>[a.id,compact(arms[a.id])]))}));for(const p of results)console.log('B32D9A_PROFILE='+JSON.stringify({id:p.id,arms:Object.fromEntries(ARMS.map(a=>[a.id,compact(p.arms[a.id])])),paired:p.paired}));if(rows.some(r=>r.all.timeouts))process.exitCode=1;
}
function smoke(){
 // Only approved presentation rename and passive telemetry plumbing may differ.
 const diff=execFileSync('git',['diff','--name-only',BASE,'HEAD','--','combat','economy','online','index.html','docs','scripts/v013-b32c-equipment-policy.cjs','scripts/v013-b32d7-combat-aware-policy.cjs'],{encoding:'utf8'}).trim().split('\n').filter(Boolean).sort();
 assert.deepEqual(diff,['combat/v012-combat-runtime.js','docs/combat/v012-combat-runtime.js','docs/index.html','index.html'].sort());
 const old=execFileSync('git',['show',BASE+':'+file],{encoding:'utf8'});assert.equal(original,replace(old,"'🗡 Double Strike!'","'🗡 Double Attack!'"));
 assert.equal(fs.readFileSync(path.resolve(__dirname,'../docs',file),'utf8'),original);
 for(const id of IDS)profile(id);
 for(const a of ARMS){new Function(sources[a.id]);const r=account(2,a,0,{...D.CONFIG,maxLevel:1,maxAttempts:1,maxTotalAttempts:1});assert.equal(r.attempts,1);}
 const p=G.profile('fury-daggers'),t=p.t,build={id:p.id,weapon:p.weapon,families:p.families,skills:[]};
 const probes=[];
 for(const a of ARMS)for(const offhandType of ['Shield','Off-Hand Dagger']){
  let verified=false;
  const opts={mode:'encounter',points:30,gear:'current',rarity:'Rare',runes:false,contracts:'none',targetPolicy:'mechanics',measure:true,tickLimit:13000,lockScenarioStreams:true,controlledTalents:t,armorType:p.armorType,offhandType,stageB31ALoadout:'Daggers',stageB31EquipmentAudit:true,stageArmorRuntimeSource:sources[a.id],recordModules:e=>{verifyModules(a,e);verified=true;}};
  const r=S.encounter(10,build,SEED+951,'normal',opts,undefined,undefined,'blood',1,12);assert(verified);assert.equal(r.weaponType,'Daggers');assert.equal(r.offhandType,offhandType);
  const m=r.weaponStatusMetrics||{},single=n(m.secondaryEquipmentStatusB32D9ASingleEligible),dualEligible=n(m.secondaryEquipmentStatusB32D9ADualEligible);
  if(offhandType==='Shield'){assert(single>0);assert.equal(dualEligible,0);}else{assert.equal(single,0);assert.equal(dualEligible>0,a.dual);}
  assert.equal(Number(r.won)+Number(r.died)+Number(r.timedOut),1);probes.push({arm:a.id,offhandType,won:r.won,single,dualEligible,hits:n(m.secondaryEquipmentStatusB32D9ADualHits)});
 }
 console.log('B32D9A_SMOKE='+JSON.stringify({profiles:IDS.length,arms:ARMS,probes,renameOnly:true,manifestVerified:true}));
}
const [cmd,pi,ai]=process.argv.slice(2);if(cmd==='smoke')smoke();else if(cmd==='study')run(Number(pi),Number(ai));else if(cmd==='aggregate')aggregate();else throw Error('Unknown command');
