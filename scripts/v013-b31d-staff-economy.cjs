'use strict';
// Staff SP and mana economics: no shipped Staff changes. Native physical compensation is approved.
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const S=require('./simulate-progression.cjs'),A=require('./v013-b31a-twohand-budget.cjs'),B=require('./v013-b31b-twohand-compensation.cjs'),C=require('./v013-b31c-compensation-validation.cjs');
const BASE='d308c11b51307d9df0d5b61bccf15f110843e2ba',OUT='reports/b31d',N=50,SEED=101500001,GEAR=fs.readFileSync('combat/v012-gear-stats.js','utf8');
const specs=[['arcane-staff','arcane-arcane-staff'],['decay-staff','decay-cycle-staff'],['fire-staff','arcane-fire-staff'],['frost-staff','arcane-frost-staff'],['lightning-staff','arcane-lightning-staff'],['hybrid-arcane-decay-staff','hybrid-arcane-decay'],['hybrid-aegis-arcane-staff','hybrid-aegis-arcane']].map(([id,profile])=>({id,profile,weapon:'Staff',armor:'Cloth',kind:'staff'}));
const SC=A.scenarios.filter(s=>['solo','group12','boss'].includes(s.id));
const arm=(id,factor=1.32,spell=1,cost=1)=>({id,factor,spell,cost,loadout:[id,'Staff',null]});
const ARMS=[arm('native'),arm('hit175',1.75),arm('cost75',1.32,1,.75),arm('spell150',1.32,1.5),arm('spell200',1.32,2),arm('spell150+cost75',1.32,1.5,.75),arm('spell200+cost75',1.32,2,.75),arm('hit175+cost75',1.75,1,.75),{id:'Wand+Orb',factor:1.32,spell:1,cost:1,reference:true,loadout:['Wand+Orb','Wand','Orb']},{id:'Wand+Tome',factor:1.32,spell:1,cost:1,reference:true,loadout:['Wand+Tome','Wand','Tome']}];
const hash=x=>crypto.createHash('sha256').update(x).digest('hex'),mean=(rows,f)=>rows.length?rows.reduce((n,x)=>n+f(x),0)/rows.length:null;
function gearSource(factor){
 assert([1,1.5,2].includes(factor));
 if(factor===1)return GEAR;
 const anchor='s[dest]+=itemStatValue(item,key)*factor;';
 assert.equal(GEAR.split(anchor).length,2);
 // Only the Staff item spell affix. No multiplication of global SP, Intellect,
 // armor, runes, mana or defense. Test-only derived contribution; raw items unchanged.
 return GEAR.replace(anchor,'s[dest]+=itemStatValue(item,key)*factor*(slot===\'weapon\'&&item.subtype===\'Staff\'&&key===\'spell\'?'+factor+':1);');
}
function cell(st,sc,i,a,seedBase=SEED,audit=true,forceGear=null){
 const src=B.sources('Staff',a),runtime=audit?C.manaRuntime(src.runtime,a.cost):src.runtime,gear=gearSource(forceGear??a.spell);
 const r=A.cell(st,sc,i,a.loadout,null,{id:a.id,seedBase,runtime,buildcraft:src.buildcraft,gearSource:gear,manaAudit:audit,recordWeaponSpell:true});
 assert(r.directActual<=r.directRaw+1e-6&&r.directActual<=r.damage+1e-6);
 if(audit){
  const l=r.manaLedger;assert(l);assert(Math.abs(l.residual)<1e-6);assert(l.regenWasted>=-1e-6&&l.refundWasted>=-1e-6);
  const named=['Weapon','Dark','Infusion','Elemental','Rotguard'].reduce((n,k)=>n+(l.metrics['stage648Mana'+k+'Spent']||0),0);assert(named<=l.paid+1e-6);r.otherPaid=l.paid-named;
 }
 return {...r,reference:!!a.reference,factor:a.factor,spell:a.spell,cost:a.cost,sourceHash:hash(runtime),gearSourceHash:hash(gear),buildcraftHash:hash(src.buildcraft)};
}
function otherStats(s){return Object.fromEntries(Object.entries(s).filter(([k])=>!['spellPower','power'].includes(k)));}
function pair(st,sc,i){
 const rows=ARMS.map(a=>cell(st,sc,i,a)),base=rows[0];
 for(const r of rows){
  assert.equal(r.resolved,base.resolved);assert.equal(r.rosterHash,base.rosterHash);assert.equal(r.nonHands,base.nonHands);assert.deepEqual(r.nodes,base.nodes);
  if(!r.reference){
   assert.equal(r.gearHash,base.gearHash);assert.equal(r.weaponSpell,base.weaponSpell);assert.deepEqual(otherStats(r.stats),otherStats(base.stats),'Non-SP stat drift');
   if(r.spell===1)assert.deepEqual(r.stats,base.stats);
   else assert(r.stats.spellPower>=base.stats.spellPower,'Staff item SP did not increase');
  }
 }
 return {seed:base.seed,rows};
}
function write(name,x){fs.mkdirSync(OUT,{recursive:true});fs.writeFileSync(OUT+'/'+name+'.json',JSON.stringify(x,null,2));}
function run(si,ci){
 const st=specs[si],sc=SC[ci];assert(st&&sc);const cases=Array.from({length:N},(_,i)=>pair(st,sc,i));write('staff-'+si+'-'+ci,{si,ci,study:st.id,scenario:sc.id,commit:process.env.GITHUB_SHA||null,native:S.sourceFingerprint().sha256,cases});
}
function metrics(rows){
 return {...C.metrics(rows),weaponSpell:mean(rows,r=>r.weaponSpell),weaponSpellContribution:mean(rows,r=>r.weaponSpell*r.spell),barrierGeneratedPerSec:mean(rows,r=>r.seconds?r.barrier/r.seconds:0),actualSP:mean(rows,r=>r.stats.spellPower),damagePerPaidCast:mean(rows.filter(r=>r.manaLedger.metrics.stage648ManaWeaponCasts>0),r=>r.damage/r.manaLedger.metrics.stage648ManaWeaponCasts)};
}
function aggregate(){
 const xs=specs.flatMap((st,si)=>SC.map((sc,ci)=>JSON.parse(fs.readFileSync(OUT+'/staff-'+si+'-'+ci+'.json','utf8'))));assert.equal(new Set(xs.map(x=>x.native)).size,1);const results=[],all=xs.flatMap(x=>x.cases.flatMap(c=>c.rows));
 const gearBudget=JSON.parse(fs.readFileSync(OUT+'/gear-budget.json','utf8'));assert.equal(gearBudget.commit,process.env.GITHUB_SHA);assert.equal(gearBudget.rolls,24000);
 const replay=JSON.parse(fs.readFileSync(OUT+'/physical-parity.json','utf8'));assert.equal(replay.commit,process.env.GITHUB_SHA);assert.equal(replay.replayed,72);assert.equal(replay.matched,72);
 for(const x of xs){assert.equal(x.commit,process.env.GITHUB_SHA);assert.equal(x.cases.length,N);assert.equal(new Set(x.cases.map(c=>c.seed)).size,N);for(const c of x.cases)assert.deepEqual(c.rows.map(r=>r.id),ARMS.map(a=>a.id));
  const by=Object.fromEntries(ARMS.map(a=>[a.id,{...metrics(x.cases.map(c=>c.rows.find(r=>r.id===a.id))),paired:A.paired(x.cases,'native',a.id),vsOrb:A.paired(x.cases,'Wand+Orb',a.id),vsTome:A.paired(x.cases,'Wand+Tome',a.id)}]));
  for(const a of Object.values(by))assert.equal(a.wins+a.deaths+a.surrenders+a.timeout,a.n);
  const interaction=Object.fromEntries(['spell150','spell200','hit175'].map(k=>[k,{DPS:by[k+'+cost75'].DPS-by[k].DPS-by.cost75.DPS+by.native.DPS,winPct:by[k+'+cost75'].winPctAll-by[k].winPctAll-by.cost75.winPctAll+by.native.winPctAll}]));
  const row={study:x.study,scenario:x.scenario,arms:by,interaction};results.push(row);
  console.log('B31D_STUDY='+JSON.stringify({study:x.study,scenario:x.scenario,arms:Object.fromEntries(Object.entries(by).map(([id,v])=>[id,{n:v.n,wins:v.wins,timeout:v.timeout,DPS:v.DPS,actualSP:v.actualSP,weaponSpell:v.weaponSpell,weaponSpellContribution:v.weaponSpellContribution,basePerMainHit:v.basePerMainHit,effectiveMainHit:v.effectiveMainHit,secondaryDPS:v.secondaryDPS,secondaryDotDPS:v.secondaryDotDPS,takenPerSec:v.takenPerSec,absorbedPerSec:v.absorbedPerSec,barrierGeneratedPerSec:v.barrierGeneratedPerSec,manaRemaining:v.manaRemaining,mana:v.mana,paired:v.paired,vsOrb:v.vsOrb,vsTome:v.vsTome}])),interaction}));
 }
 assert.equal(all.length,10500);const summary={baseline:BASE,commit:process.env.GITHUB_SHA,native:xs[0].native,fights:all.length,timeouts:all.filter(x=>x.timeout).length,surrenders:all.filter(x=>x.surrendered).length,physicalParity:replay,gearBudget:{rolls:gearBudget.rolls,tiers:gearBudget.tiers,rarities:gearBudget.rarities,source:gearBudget.source},results,scope:'50 new matched seeds, fixed legal E10 Rare builds; Staff variants VM only; physical changes explicitly approved. No natural global balance claim.'};write('summary',summary);console.log('B31D_OVERVIEW='+JSON.stringify({...summary,results:undefined}));if(summary.timeouts)process.exitCode=1;
}
function physicalParity(){
 const checks=[],oldDir='reports/b31c-physical-reference';
 for(let i=0;i<C.physical.length;i++)for(const ci of [0,3]){
  const st=C.physical[i],sc=A.scenarios[ci],x=JSON.parse(fs.readFileSync(oldDir+'/physical-'+i+'-'+ci+'.json','utf8'));
  assert.equal(x.commit,BASE);assert.equal(x.study,st.id);assert.equal(x.scenario,sc.id);assert.equal(x.cases.length,100);
  // Current native (not a second application of the old candidate override).
  // All fields shared with the historical candidate must match exactly.
  for(const j of [0,49]){const old=x.cases[j].rows.find(r=>r.id==='candidate'),src=B.sources(st.weapon,{factor:B.configs[st.weapon].base}),next=A.cell(st,sc,j,['candidate',st.weapon,null],null,{id:'candidate',seedBase:101200001,...src});
   for(const k of Object.keys(next))assert.deepEqual(next[k],old[k],st.id+'/'+sc.id+'/'+j+'/'+k);
   checks.push({study:st.id,scenario:sc.id,seed:next.seed,arm:'candidate'});
  }
  const old=x.cases[0].rows.find(r=>r.reference),src=B.sources(st.weapon,{factor:B.configs[st.weapon].base,reference:true}),next=A.cell(st,sc,0,st.ref[0],null,{id:old.id,seedBase:101200001,...src});
  for(const k of Object.keys(next))assert.deepEqual(next[k],old[k],st.id+'/'+sc.id+'/reference/'+k);checks.push({study:st.id,scenario:sc.id,seed:next.seed,arm:next.id});
 }
 assert.equal(checks.length,72);write('physical-parity',{commit:process.env.GITHUB_SHA,replayed:checks.length,matched:checks.length,checks});console.log('B31D_PHYSICAL_PARITY='+JSON.stringify({matched:checks.length,sourceRun:45999563616}));
}
function smoke(){
 const changed=execFileSync('git',['diff','--name-only',BASE,'HEAD','--','combat','online','economy','index.html','docs/index.html','docs/combat','docs/online','docs/economy'],{encoding:'utf8'}).trim().split('\n').sort();
 assert.deepEqual(changed,['combat/v012-buildcraft.js','combat/v012-combat-runtime.js','docs/combat/v012-buildcraft.js','docs/combat/v012-combat-runtime.js']);
 for(const p of ['combat/v012-buildcraft.js','combat/v012-combat-runtime.js'])assert.equal(fs.readFileSync(p,'utf8'),fs.readFileSync('docs/'+p,'utf8'));
 const fields=['won','died','surrendered','timeout','seconds','damage','taken','directBase','directRaw','directActual','manaSpent','mpEnd','unfunded','mainHits'];
 for(const st of specs){
  const cases=[pair(st,SC[0],0),pair(st,SC[1],1)];
  assert(cases.some(c=>c.rows.find(r=>r.id==='spell200').stats.spellPower>c.rows[0].stats.spellPower),'No Staff SP increase '+st.id);
  for(const a of ARMS.filter(a=>a.reference)){const old=cell(st,SC[0],0,a),next=cell(st,SC[0],0,a,SEED,true,2);for(const k of fields)assert.deepEqual(old[k],next[k],'Wand changed '+k);assert.deepEqual(old.stats,next.stats);}
  const old=cell(st,SC[0],0,ARMS[0],SEED,false),next=cell(st,SC[0],0,ARMS[0]);for(const k of fields)assert.deepEqual(old[k],next[k],'Observer drift '+st.id+' '+k);
 }
 console.log('B31D_SMOKE='+JSON.stringify({studies:specs.length,physicalOnlyProductionDiff:true,staffOverridesOnly:true,wandControl:true,manaObserverParity:true}));
}
if(require.main===module){const [cmd,si,ci]=process.argv.slice(2);if(cmd==='smoke')smoke();else if(cmd==='parity')physicalParity();else if(cmd==='study')run(Number(si),Number(ci));else if(cmd==='aggregate')aggregate();else throw Error('Unknown command');}
