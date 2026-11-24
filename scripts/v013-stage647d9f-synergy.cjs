'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const N=require('./v013-natural-progression.cjs'),D=require('./v013-stage628-postcap-difficulty.cjs'),S=require('./simulate-progression.cjs'),A=require('./v013-agent-strategy.cjs');
const CUSTOM={
 "decay-sword": {
  "families": [
   "decay"
  ],
  "weapons": [
   "Sword"
  ],
  "armor": "Leather",
  "offhands": [
   "Daggers"
  ],
  "targets": [
   "toxic_touch",
   "virulent_rot",
   "blight",
   "contagious_touch",
   "corruption_nova",
   "soul_drain"
  ]
 },
 "decay-daggers": {
  "families": [
   "decay"
  ],
  "weapons": [
   "Daggers"
  ],
  "armor": "Leather",
  "offhands": [
   "Daggers"
  ],
  "targets": [
   "toxic_touch",
   "virulent_rot",
   "contagious_touch",
   "corruption_nova",
   "soul_drain"
  ]
 },
 "decay-wand": {
  "families": [
   "decay"
  ],
  "weapons": [
   "Wand"
  ],
  "armor": "Cloth",
  "offhands": [
   "Tome"
  ],
  "targets": [
   "toxic_touch",
   "blight",
   "soul_drain",
   "corruption_cycle",
   "corruption_nova"
  ]
 },
 "decay-staff": {
  "families": [
   "decay"
  ],
  "weapons": [
   "Staff"
  ],
  "armor": "Cloth",
  "targets": [
   "toxic_touch",
   "blight",
   "soul_drain",
   "corruption_nova"
  ]
 },
 "decay-two-handed": {
  "families": [
   "decay"
  ],
  "weapons": [
   "Two-Handed"
  ],
  "armor": "Plate",
  "targets": [
   "toxic_touch",
   "virulent_rot",
   "contagious_touch",
   "corruption_nova"
  ]
 },
 "aegis-sword-shield": {
  "families": [
   "aegis"
  ],
  "weapons": [
   "Sword"
  ],
  "armor": "Plate",
  "offhands": [
   "Shield"
  ],
  "targets": [
   "guarded_block",
   "barrier_pulse",
   "iron_skin",
   "sword_sweep",
   "stored_force"
  ]
 },
 "aegis-mace-shield": {
  "families": [
   "aegis"
  ],
  "weapons": [
   "Mace"
  ],
  "armor": "Plate",
  "offhands": [
   "Shield"
  ],
  "targets": [
   "guarded_block",
   "barrier_pulse",
   "mace_shockwave",
   "steadfast_guard",
   "stored_force"
  ]
 },
 "aegis-wand-orb": {
  "families": [
   "aegis",
   "magic"
  ],
  "weapons": [
   "Wand"
  ],
  "armor": "Cloth",
  "offhands": [
   "Orb"
  ],
  "element": "arcane",
  "targets": [
   "guarded_block",
   "barrier_pulse",
   "arcane_focus",
   "runic_shield",
   "ward_echo",
   "arcane_bastion"
  ],
  "preparedTargets": [
   "arcane_bastion"
  ]
 },
 "vitality-sword-charm": {
  "families": [
   "vitality"
  ],
  "weapons": [
   "Sword"
  ],
  "armor": "Plate",
  "offhands": [
   "Charm"
  ],
  "targets": [
   "strong_heart",
   "renewal",
   "vital_pulse",
   "living_force",
   "living_recovery"
  ]
 },
 "vitality-staff": {
  "families": [
   "vitality",
   "magic"
  ],
  "weapons": [
   "Staff"
  ],
  "armor": "Cloth",
  "element": "frost",
  "targets": [
   "strong_heart",
   "renewal",
   "arcane_focus",
   "element_choice",
   "vital_pulse",
   "living_force",
   "deep_winter"
  ]
 },
 "magic-sword-infusion": {
  "families": [
   "magic",
   "decay"
  ],
  "weapons": [
   "Sword"
  ],
  "armor": "Leather",
  "offhands": [
   "Orb"
  ],
  "element": "arcane",
  "targets": [
   "arcane_focus",
   "mana_spring",
   "element_choice",
   "arcane_resonance",
   "toxic_touch",
   "hex_bolt",
   "grave_bloom"
  ],
  "preparedTargets": [
   "grave_bloom"
  ]
 },
 "magic-daggers-infusion": {
  "families": [
   "magic",
   "blood"
  ],
  "weapons": [
   "Daggers"
  ],
  "armor": "Leather",
  "offhands": [
   "Daggers"
  ],
  "element": "arcane",
  "targets": [
   "arcane_focus",
   "mana_spring",
   "element_choice",
   "arcane_nova",
   "bleeding_edge",
   "sanguine_fury"
  ]
 }
};
const PROFILES=["cautious","balanced","plate-warden","cloth-battlemage","leather-duelist","hexblade-hybrid","smart-blood-pure","smart-blood-two-handed","smart-fury-bow","smart-fury-daggers","smart-vitality-pure","smart-aegis-vitality","smart-magic-arcane-pure","smart-magic-fire-pure","magic-frost","smart-magic-lightning-pure","smart-decay-magic-aegis","decay-blood-spread","smart-blood-sword","smart-blood-fury","smart-blood-fury-vitality","smart-blood-fury-vitality-no-mixed","smart-fury-blood-aegis","smart-fury-pure","smart-magic-fire-aegis","smart-magic-frost-vitality","smart-magic-wand","smart-magic-staff","smart-magic-wand-offense","smart-magic-wand-defense","decay-sword","decay-daggers","decay-wand","decay-staff","decay-two-handed","aegis-sword-shield","aegis-mace-shield","aegis-wand-orb","vitality-sword-charm","vitality-staff","magic-sword-infusion","magic-daggers-infusion"];
const SEEDS=[9861,9862,9863,9864,9865],SIZES=[1,2,3,4,5,8,12],TRIALS=100;
const FILE='combat/expedition-progression.js',SOURCE=fs.readFileSync(FILE,'utf8');
function candidateSource(){
 const anchor='const reference=c.initialReference*Math.exp(logGrowth);';
 assert.equal(SOURCE.split(anchor).length,2);
 return SOURCE.replace(anchor,'const t=Math.min(1,(level-1)/9),weight=t*t*(3-2*t);const reference=c.initialReference*Math.exp(logGrowth+Math.log(.50)*(1-weight));');
}
function curve(source){
 const root={};new Function('globalThis',source)(root);return root.WandererExpeditionProgression;
}
function selftest(){
 const a=curve(SOURCE),b=curve(candidateSource());
 assert(Math.abs(b.enemyReference(1)/a.enemyReference(1)-.5)<1e-12);
 for(let E=2;E<=200;E++){assert(b.enemyReference(E)>b.enemyReference(E-1));if(E>=10)assert.equal(a.enemyReference(E),b.enemyReference(E));else assert(b.enemyReference(E)<a.enemyReference(E));}
 for(const E of [1,5,10,20])assert.deepEqual(a.gearTier(E),b.gearTier(E));
 assert(PROFILES.every(id=>N.PROFILES[id]||CUSTOM[id]||id==='decay-blood-spread'));assert.equal(new Set(PROFILES).size,PROFILES.length);assert.doesNotThrow(()=>A.classify({build:null,talents:{nodes:[]}}));
 console.log('STAGE647D9F_CURVE='+JSON.stringify(Array.from({length:10},(_,i)=>({E:i+1,original:a.enemyReference(i+1),capture:b.enemyReference(i+1)}))));
}
function profile(id){
 assert(PROFILES.includes(id),'Unknown campaign profile: '+id);
 const base=N.PROFILES[id]||(CUSTOM[id]?{name:id,style:'focused',...CUSTOM[id]}:null)||{name:'Physical Decay + Blood',families:['decay','blood'],targets:['toxic_touch','bleeding_edge','plague_spread','contagious_touch','septic_wound'],preparedTargets:['septic_wound'],armor:'Leather',weapons:['Sword','Daggers'],style:'mixed',target:'mechanics',shop:true};
 return {...base,synergyAudit:true,fixedResearchBuild:true,researchGearPreference:true,risk:0,healAt:.70,retreatAt:.43,target:'mechanics',shop:true};
}
function write(dest,o){fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,JSON.stringify(o,null,2)+'\n');}
function capture(id,seed){
 let snap=null,cap=null;
 const account=N.simulateAccount(seed,id,{...N.DEFAULTS,maxLevel:10,maxAttempts:24,maxTotalAttempts:216,tickLimit:6500},{researchProfiles:{[id]:profile(id)},decisionModel:'adaptive',moduleOverrides:{[FILE]:candidateSource()},stopAtCampLevel:10,onCamp:probe=>{
  if(probe.level!==10||probe.attempt!==1)return;
  assert(!snap,'duplicate E10 checkpoint');snap=D.checkpoint(probe,[10]);
  cap=A.classify({equipment:probe.a.state().equip,talents:probe.a.state().automaticTalents,build:probe.a.build()||{},stats:probe.a.baseStats()});
 }});
 const errors=account.attempts.filter(x=>x.error).map(x=>({E:x.level,attempt:x.attempt,error:x.error,stack:x.diagnostic?.stack?.slice(0,1500)}));
 if(errors.some(x=>x.error!=='Native combat timeout'))throw Error('Capture error '+JSON.stringify(errors));
 return {seed,endLevel:account.endLevel,attempts:account.attempts.length,stopReason:account.stopReason,errors,snapshot:snap,capability:cap};
}
function smoke(){
 selftest();
 const attempts=[];
 let a=null;
 for(const seed of [9863,9861,9862,9864,9865]){
  const candidate=capture('balanced',seed);
  attempts.push({seed,E:candidate.endLevel,errors:candidate.errors,reached:!!candidate.snapshot});
  if(candidate.snapshot){a=candidate;break;}
 }
 console.log('SMOKE_CAPTURE='+JSON.stringify(attempts));
 assert(a?.snapshot,'No genuine E10 Camp capture in smoke cohort; do not launch expensive matrix');
 const cases=[{id:'normal-1',type:'normal',realm:'blood',size:1},{id:'normal-8',type:'normal',realm:'blood',size:8},{id:'tank',type:'elite',realm:'blood'},{id:'boss-blood',type:'boss',realm:'blood'}];
 const results=cases.map((sc,i)=>{const r=D.native(a.snapshot,sc,64791000+i*101);assert(r.won||r.died||r.timedOut,'unresolved native replay '+sc.id);return {id:sc.id,won:r.won,died:r.died,timeout:r.timedOut,seconds:r.seconds};});
 assert(results.every(r=>!r.timeout),'Native smoke replay timeout; inspect before full matrix');
 console.log('SMOKE_E10='+JSON.stringify({seed:a.seed,points:a.snapshot.talentSpent,weapon:a.snapshot.state.equip.weapon?.subtype,results}));
}
function run(id,trials=TRIALS){
 assert(PROFILES.includes(id));assert(Number.isInteger(trials)&&trials>=1&&trials<=100);
 selftest();
 const accounts=[],source=S.sourceFingerprint().sha256,rows=[];
 const dir='reports/stage647d9f',out=dir+'/'+id+'.json';
 for(const seed of SEEDS){
  let account;
  try{account=capture(id,seed);}
  catch(error){write(out,{id,source,accounts,rows,complete:false,failure:{phase:'capture',naturalSeed:seed,error:String(error)}});throw error;}
  accounts.push(account);
  write(out,{id,source,accounts,rows,complete:false});
 }
 const snaps=accounts.filter(x=>x.snapshot);
 const scenarios=[...SIZES.map(size=>({id:'normal-'+size,type:'normal',size,realm:'blood'})),...D.ELITES.map(id=>({id,type:'elite',realm:'blood'})),...D.FAMILIES.map(f=>({id:'boss-'+f,type:'boss',realm:f}))];
 write(out,{id,source,accounts,rows,complete:false});
 console.log('CAPTURE='+JSON.stringify({id,accounts:accounts.map(a=>({seed:a.seed,endLevel:a.endLevel,attempts:a.attempts,reached:!!a.snapshot,stopReason:a.stopReason,errors:a.errors,weapon:a.snapshot?.state.equip.weapon?.subtype,points:a.snapshot?.talentSpent}))}));
 for(let i=0;i<trials&&snaps.length;i++){
  const a=snaps[i%snaps.length],seed=64791000+i*101;
  for(const sc of scenarios){
   let r;try{r=D.native(a.snapshot,sc,seed);}catch(error){write(out,{id,source,accounts,rows,complete:false,failure:{trial:i,scenario:sc.id,seed,naturalSeed:a.seed,error:String(error)}});throw error;}
   assert(r.won||r.died||r.timedOut,'unresolved native encounter');
   rows.push({trial:i,naturalSeed:a.seed,scenario:sc.id,kind:sc.type,baseSeed:seed,seed:r.resolvedSeed,seedShift:r.seedShift,bossSummons:r.bossSummons,bossHealing:r.bossHealing,bossCastInterruptions:r.bossCastInterruptions,won:!!r.won,died:!!r.died,timeout:!!r.timedOut,seconds:r.seconds,hpEnd:r.hpEnd,hpMax:r.hpMax,damage:r.damageDealt,taken:r.damageTaken,secondary:r.secondaryTargetDamage,secondaryDot:r.secondaryDotDamage,funded:r.fundedCasts,unfunded:r.unfundedCasterAttacks,manaSpent:r.manaSpent,stats:r.heroBaseStats,metrics:r.affinityMetrics,gear:r.gearFingerprint});
  }
  if(i%10===9)write(out,{id,source,accounts,rows,complete:false});
 }
 write(out,{id,source,accounts,rows,complete:true,trials,scenarioCount:scenarios.length});
 console.log('REPLAY='+JSON.stringify({id,snapshots:snaps.length,rows:rows.length,timeouts:rows.filter(r=>r.timeout).length}));
}
function aggregate(){
 const dir='reports/stage647d9f',data=fs.readdirSync(dir).filter(f=>f.endsWith('.json')).map(f=>JSON.parse(fs.readFileSync(path.join(dir,f),'utf8')));
 assert(data.length,'No cohort artifacts');assert.equal(new Set(data.map(x=>x.source)).size,1,'source mismatch');
 assert.equal(new Set(data.map(x=>x.id)).size,data.length,'duplicate cohort artifacts');
 for(const x of data){
  assert(PROFILES.includes(x.id),'unknown cohort '+x.id);
  if(!x.complete)continue;
  assert.deepEqual(x.accounts.map(a=>a.seed).sort((a,b)=>a-b),SEEDS,'invalid capture seeds '+x.id);
  const actors=x.accounts.filter(a=>a.snapshot);
  const scenarios=new Set([...SIZES.map(n=>'normal-'+n),...D.ELITES,...D.FAMILIES.map(f=>'boss-'+f)]);
  assert(Number.isInteger(x.trials)&&x.trials>=1&&x.trials<=TRIALS,'invalid trials '+x.id);
  assert.equal(x.scenarioCount,scenarios.size,'invalid scenario count '+x.id);
  assert.equal(x.rows.length,actors.length?x.trials*scenarios.size:0,'incomplete replay '+x.id);
  const seen=new Set();
  for(const row of x.rows){
   assert(Number.isInteger(row.trial)&&row.trial>=0&&row.trial<x.trials&&scenarios.has(row.scenario),'unknown replay cell '+x.id);
   const key=row.trial+'/'+row.scenario;
   assert(!seen.has(key),'duplicate replay '+x.id+' '+key);
   seen.add(key);
   assert.equal(row.naturalSeed,actors[row.trial%actors.length].seed,'wrong E10 actor '+key);
   assert.equal([row.won,row.died,row.timeout].filter(v=>v===true).length,1,'invalid outcome '+key);
  }
 }
 assert(new Set(data.filter(x=>x.complete).map(x=>x.trials)).size<=1,'mixed trial budgets');
 const mean=(a,k)=>{const v=a.map(x=>x[k]).filter(Number.isFinite);return v.length?v.reduce((s,n)=>s+n,0)/v.length:null;};
 function rate(a){
  const valid=a.filter(x=>x.won||x.died),w=valid.filter(x=>x.won).length;
  return {n:a.length,resolved:valid.length,wins:w,winPct:valid.length?100*w/valid.length:null,timeouts:a.filter(x=>x.timeout).length,meanSeconds:mean(valid,'seconds'),meanTaken:mean(valid,'taken'),meanSecondary:mean(valid,'secondary'),meanFunded:mean(valid,'funded'),meanUnfunded:mean(valid,'unfunded')};
 }
 const profiles=data.map(x=>({id:x.id,complete:x.complete,failure:x.failure||null,accounts:x.accounts.map(({snapshot,capability,...a})=>({...a,checkpoint:snapshot?{xp:snapshot.xp,points:snapshot.talentSpent,weapon:snapshot.state.equip.weapon?.subtype,offhand:snapshot.state.equip.offhand?.subtype||null,armor:snapshot.state.equip.armor?.armorType||null,rarity:snapshot.equippedRarity,stats:snapshot.statSnapshot,nodes:snapshot.state.automaticTalents.nodes,element:snapshot.state.automaticTalents.element,prepared:snapshot.state.automaticTalents.prepared,legendary:Object.values(snapshot.state.equip).filter(i=>i?.legendaryId).map(i=>i.legendaryId),capability}:null})),scenarios:Object.fromEntries([...new Set(x.rows.map(r=>r.scenario))].map(k=>[k,rate(x.rows.filter(r=>r.scenario===k))])),byType:Object.fromEntries(['normal','elite','boss'].map(k=>[k,rate(x.rows.filter(r=>r.kind===k))]))}));
 const rows=data.filter(x=>x.complete).flatMap(x=>x.rows),result={stage:'6.47D.9F',source:data[0].source,requestedProfiles:PROFILES,missingProfiles:PROFILES.filter(p=>!data.some(x=>x.id===p&&x.complete)),profilesWithoutE10:profiles.filter(p=>p.complete&&!p.accounts.some(a=>a.checkpoint)).map(p=>p.id),captures:profiles.flatMap(x=>x.accounts).length,reachedE10:profiles.flatMap(x=>x.accounts).filter(a=>a.checkpoint).length,nativeFights:rows.length,profiles,allByScenario:Object.fromEntries([...new Set(rows.map(r=>r.scenario))].map(k=>[k,rate(rows.filter(r=>r.scenario===k))]))};
 write('reports/v013-stage647d9f-synergy.json',result);
 console.log('STAGE647D9F='+JSON.stringify({...result,profiles:profiles.map(p=>({id:p.id,complete:p.complete,accounts:p.accounts.map(a=>({seed:a.seed,E:a.endLevel,reached:!!a.checkpoint,weapon:a.checkpoint?.weapon,offhand:a.checkpoint?.offhand,points:a.checkpoint?.points,errors:a.errors})),byType:p.byType,scenarios:p.scenarios}))}));
 if(result.missingProfiles.length)throw Error('Incomplete cohort matrix: '+result.missingProfiles.join(', '));
}
if(require.main===module){const [cmd,id,t]=process.argv.slice(2);if(cmd==='selftest')selftest();else if(cmd==='smoke')smoke();else if(cmd==='run')run(id,t===undefined?TRIALS:+t);else if(cmd==='aggregate')aggregate();else throw Error('Unknown command');}
module.exports={PROFILES,SEEDS,SIZES,candidateSource,profile,selftest,run,aggregate};
