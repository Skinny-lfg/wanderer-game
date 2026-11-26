'use strict';
// Read existing earned snapshots and combat rows only. No simulations.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const M=require('./v013-stage647d9f-synergy.cjs'),P=require('./v013-build-planner.cjs');
const T=globalThis.WandererAutomaticTalents;
const graph=new Map(T.NODES.map(n=>[n.id,n]));
const buildcraft=fs.readFileSync('combat/v012-buildcraft.js','utf8');
const explicit=new Set([...buildcraft.matchAll(/activated\(b,'([^']+)'\)/g)].map(m=>m[1]));
// Explicitly instrumented dynamic pulse IDs, not every passive in the tree.
for(const id of ['vital_pulse','grasping_roots','ward_echo','arcane_nova','frost_resonance','glacial_echo','cinder_focus','static_focus','storm_conductor']){
 if(new RegExp("defensivePulse\\(b,c,'"+id+"'").test(buildcraft))explicit.add(id);
}
const expectedSource='686cd06098af3ee950363030c809d08383832e4021f23568e2aa4bbf161b550f';
const num=n=>Number.isFinite(n)?n:null;
function mean(a,key){const x=a.map(r=>typeof key==='function'?key(r):r[key]).filter(Number.isFinite);return x.length?x.reduce((s,n)=>s+n,0)/x.length:null;}
function pct(n,d){return d?100*n/d:null;}
function tally(xs){const r={};for(const x of xs)r[x]=(r[x]||0)+1;return r;}
function read(dir,id,required=true){const files=fs.readdirSync(dir,{recursive:true}).filter(f=>path.basename(f)===id+'.json');if(!required&&!files.length)return null;assert.equal(files.length,1,'artifact '+id);return JSON.parse(fs.readFileSync(path.join(dir,files[0]),'utf8'));}
function stats(rows){
 const valid=rows.filter(r=>r.won||r.died);
 return {n:rows.length,wins:valid.filter(r=>r.won).length,winPct:pct(valid.filter(r=>r.won).length,valid.length),timeouts:rows.filter(r=>r.timeout).length,
 seconds:mean(valid,'seconds'),damage:mean(valid,'damage'),secondary:mean(valid,'secondary'),secondaryDps:mean(valid,r=>r.seconds>0?r.secondary/r.seconds:null),secondaryShare:mean(valid,r=>r.damage>0?r.secondary/r.damage:null),taken:mean(valid,'taken'),healed:mean(valid,'healed'),absorbed:mean(valid,'absorbed'),guardEvents:mean(valid,'guardEvents'),attackCalls:mean(valid,'attackCalls'),manaSpent:mean(valid,'manaSpent'),funded:mean(valid,'funded'),unfunded:mean(valid,'unfunded'),manaStarvedSeconds:mean(valid,r=>num(r.metrics?.manaStarvedSeconds)),};
}
function intended(id){const p=M.profile(id),plan=p.plan?P.BUILDS[p.plan]:null;
 return {families:p.families,weapons:p.weapons,armor:p.armor,offhands:p.offhands||[],element:p.element||null,plan:p.plan||null,targets:[...new Set([...(p.targets||[]),...(plan?.milestones||[]),...(p.preparedTargets||[])])],preparedTargets:(p.preparedTargets||[]).filter(id=>graph.get(id)?.advanced)};
}
function evaluateAccount(a,intent,rows,oldRows){
 const snap=a.snapshot;if(!snap)return {seed:a.seed,reached:false,E:a.endLevel,attempts:a.attempts,stopReason:a.stopReason,errors:a.errors};
 assert(T.valid(snap.state.automaticTalents),'invalid earned tree');const p=snap.state.automaticTalents,nodes=p.nodes,set=new Set(nodes),eq=snap.state.equip,weapon=eq.weapon?.subtype||null,offhand=eq.offhand?.subtype||null,armor=eq.armor?.armorType||eq.armor?.subtype||null;
 const actualFamilies=nodes.filter(x=>x.startsWith('affinity_')).map(x=>x.slice(9));
 const skillNodes=nodes.filter(id=>{const n=graph.get(id);return n&&(explicit.has(id)||intent.targets.includes(id)||n.advanced);});
 const bySize=Object.fromEntries([4,5,8,12].map(n=>[n,stats(rows.filter(r=>r.size===n).map(r=>r.calibrated))]));
 const current=rows.map(r=>r.calibrated),old=oldRows.filter(r=>r.kind==='normal');
 const observed=new Set([...current.flatMap(r=>Object.keys(r.passives||{})),...old.flatMap(r=>Object.keys(r.metrics?.passiveActivations||{}))]);
 const activationIds=[...new Set([...skillNodes,...observed])].sort();
 const talents=activationIds.map(id=>{
  const owned=set.has(id),observedCurrent=current.filter(r=>Number(r.passives?.[id])>0),observedOld=old.filter(r=>Number(r.metrics?.passiveActivations?.[id])>0);
  const instrumented=explicit.has(id)||observed.has(id),advanced=!!graph.get(id)?.advanced,prepared=p.prepared===id;
  return {id,owned,advanced,prepared,scope:instrumented?'activation counter observed or explicit':'not established',currentFights:current.length,currentActive:observedCurrent.length,currentCount:observedCurrent.reduce((n,r)=>n+Number(r.passives[id]),0),historicalFights:old.length,historicalActive:observedOld.length,
   status:!owned?'observed without owned node: inspect affinity alias':advanced&&!prepared?'not prepared':observedCurrent.length?'activated':!instrumented?'not instrumented / stat or other trigger':current.length?'owned; no observed activation in sampled groups':'no current sample'};
 });
 const metrics={};for(const r of current)for(const type of ['decay','arcane','defensive'])for(const [k,v]of Object.entries(r[type]||{}))if(Number.isFinite(v))metrics[k]=(metrics[k]||0)+v;
 const matchingOffhand=offhand==='Off-Hand Dagger'?'Daggers':offhand;
 return {seed:a.seed,reached:true,E:a.endLevel,attempts:a.attempts,points:snap.talentSpent,weapon,offhand,armor,element:p.element||null,prepared:p.prepared||null,actualFamilies,
  weaponMatch:intent.weapons.includes(weapon),offhandMatch:intent.offhands.length?intent.offhands.includes(matchingOffhand):null,armorMatch:armor?armor===intent.armor:null,elementMatch:intent.element?intent.element===(p.element||'arcane'):null,
  intendedTargets:intent.targets,acquiredTargets:intent.targets.filter(id=>set.has(id)),missingTargets:intent.targets.filter(id=>!set.has(id)),nodes,talents,metrics,bySize,
  currentGroups:stats(current),historicalNormal:stats(old),historicalSolo:stats(old.filter(r=>r.scenario==='normal-1')),historicalElite:stats(oldRows.filter(r=>r.kind==='elite')),historicalBoss:stats(oldRows.filter(r=>r.kind==='boss')),
  gear:Object.fromEntries(Object.entries(eq).filter(([,x])=>x).map(([slot,x])=>[slot,{id:x.id,name:x.name,subtype:x.subtype,armorType:x.armorType,rarity:x.rarity,legendaryId:x.legendaryId||null,trait:x.v013Trait||null,stats:Object.fromEntries(Object.entries(x).filter(([k,v])=>typeof v==='number'))}])),
  stats:snap.statSnapshot,capability:a.capability};
}
function audit(){
 const profiles=[];let source=null;
 for(const id of M.PROFILES){
  const a=read('input/earned',id),b=read('input/calibrated',id,false),intent=intended(id);
  assert.equal(a.id,id);assert.equal(a.source,expectedSource);assert(a.complete);assert.equal(a.accounts.length,5);assert.equal(a.trials,100);
  const actors=a.accounts.filter(a=>a.snapshot);
  assert.equal(a.rows.length,actors.length?2100:0,'historical replay count');
  assert.equal(!!b,actors.length>0,'current shard coverage');
  if(b){assert.equal(b.id,id);assert(b.complete);assert.equal(b.trials,50);assert.equal(b.rows.length,200);assert.equal(b.actors,actors.length);if(source)assert.equal(b.source,source);else source=b.source;}
  const rows=b?.rows||[],seen=new Set();for(const r of rows){const k=r.trial+'/'+r.size;assert(!seen.has(k));seen.add(k);assert.equal(r.actor,actors[r.trial%actors.length].seed);assert.equal([r.calibrated.won,r.calibrated.died,r.calibrated.timeout].filter(Boolean).length,1);}
  const accounts=a.accounts.map(x=>evaluateAccount(x,intent,rows.filter(r=>r.actor===x.seed),a.rows.filter(r=>r.naturalSeed===x.seed)));
  const reached=accounts.filter(x=>x.reached);
  const talents={};
  for(const x of reached)for(const t of x.talents){
   if(!t.owned)continue;
   const z=talents[t.id]??={owners:0,prepared:0,instrumented:false,activeOwners:0,fights:0,activeFights:0,activations:0,historicalActive:0};
   z.owners++;z.prepared+=Number(t.prepared);z.instrumented||=t.scope==='activation counter observed or explicit';z.activeOwners+=Number(t.currentActive>0);z.fights+=t.currentFights;z.activeFights+=t.currentActive;z.activations+=t.currentCount;z.historicalActive+=t.historicalActive;
  }
  const current=rows.map(r=>r.calibrated),historical=a.rows.filter(r=>r.kind==='normal');
  const report={id,intent,invalidTargets:intent.targets.filter(id=>!graph.has(id)),reached:reached.length,accounts,talents,
   equipment:{weapon:tally(reached.map(x=>x.weapon)),offhand:tally(reached.map(x=>x.offhand)),armor:tally(reached.map(x=>x.armor)),element:tally(reached.map(x=>x.element)),weaponMatches:reached.filter(x=>x.weaponMatch).length,offhandMatches:reached.filter(x=>x.offhandMatch===true).length,armorMatches:reached.filter(x=>x.armorMatch===true).length},
   currentGroups:Object.fromEntries([4,5,8,12].map(n=>[n,stats(rows.filter(r=>r.size===n).map(r=>r.calibrated))])),
   currentWins:stats(current.filter(r=>r.won)),currentLosses:stats(current.filter(r=>r.died)),historicalNormal:stats(historical),historicalSolo:stats(historical.filter(r=>r.scenario==='normal-1'))};
  profiles.push(report);
  console.log('STAGE648C_PROFILE='+JSON.stringify({...report,accounts:accounts.map(x=>x.reached?{seed:x.seed,E:x.E,reached:true,points:x.points,weapon:x.weapon,offhand:x.offhand,armor:x.armor,element:x.element,prepared:x.prepared,families:x.actualFamilies,acquired:x.acquiredTargets,missing:x.missingTargets,nodes:x.nodes,stats:x.stats,metrics:x.metrics,g8:x.bySize[8],oldMana:{funded:x.historicalNormal.funded,unfunded:x.historicalNormal.unfunded,spent:x.historicalNormal.manaSpent,starved:x.historicalNormal.manaStarvedSeconds}}:x)}));
 }
 const accounts=profiles.flatMap(p=>p.accounts),reached=accounts.filter(x=>x.reached);
 const report={stage:'6.48C',earnedRun:45430920656,calibratedRun:45446227838,source,scope:{current:'7000 native E10 normal fights from 6.48B.2',historical:'6.48A.1 pre-roster change; do not pool with current',activation:'explicit Buildcraft activation counters; missing counters do not establish broken skills',mana:'historical only; zero reported starvation not evidence of sufficient mana',noE10:'no saved final talent/equipment state available for accounts not reaching E10'},profiles};
 assert.equal(profiles.length,42);assert.equal(accounts.length,210);assert.equal(reached.length,120);
 assert.equal(profiles.reduce((n,p)=>n+Object.values(p.currentGroups).reduce((s,r)=>s+r.n,0),0),7000);
 fs.mkdirSync('reports',{recursive:true});fs.writeFileSync('reports/v013-stage648c-build-identity.json',JSON.stringify(report,null,2)+'\n');
 console.log('STAGE648C_SUMMARY='+JSON.stringify({profiles:profiles.length,accounts:accounts.length,reached:reached.length,withoutE10:profiles.filter(p=>!p.reached).map(p=>p.id),mismatchedWeapons:profiles.filter(p=>p.equipment.weaponMatches<p.reached).map(p=>({id:p.id,reached:p.reached,matched:p.equipment.weaponMatches,weapons:p.equipment.weapon})),invalidTargets:profiles.filter(p=>p.invalidTargets.length).map(p=>({id:p.id,targets:p.invalidTargets})),explicitActivationCounters:[...explicit].sort(),source}));
}
if(require.main===module)audit();
