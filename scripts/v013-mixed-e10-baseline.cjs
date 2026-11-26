'use strict';
// Native consolidated combat; only normal group size is controlled for the baseline.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
const S=require('./simulate-progression.cjs'),G=require('./v013-global-e10.cjs');
const LEVEL=10,POINTS=30,N=60,FAMILIES=['blood','decay','radiance','aegis','fury','arcane'];
const HYBRID=["hybrid-blood-fury","hybrid-fury-radiance","hybrid-radiance-aegis","hybrid-aegis-arcane","hybrid-arcane-decay","hybrid-decay-blood"],EXTRAS=[["mix-blood-aegis",["blood","aegis"],"sword",["blood_drinker","barrier_pulse"]],["mix-blood-radiance",["blood","radiance"],"daggers",["blood_harvest","renewal"]],["mix-blood-arcane",["blood","arcane"],"wand",["deep_cuts","arcane_focus"],"arcane"],["mix-decay-aegis",["decay","aegis"],"mace",["contagious_touch","guarded_block"]],["mix-decay-radiance",["decay","radiance"],"wand",["soul_drain","renewal"]],["mix-decay-fury",["decay","fury"],"bow",["contagious_touch","quick_hands"]],["mix-fury-aegis",["fury","aegis"],"mace",["brutal_crit","guarded_block"]],["mix-fury-arcane",["fury","arcane"],"staff",["precision","arcane_focus"],"arcane"],["mix-radiance-arcane",["radiance","arcane"],"orb",["life_bloom","arcane_focus"],"arcane"]],CONTROLS=["blood-daggers","decay-cycle-wand","fury-bow","radiance-sword","aegis-mace","arcane-lightning-wand"];
for(const [id,families,w,skills,element] of EXTRAS)G.P[id]={id,families,w,skills,role:'mixed',element};
const IDS=[...HYBRID,...EXTRAS.map(x=>x[0]),...CONTROLS];
const SC=[...[1,4,8,12,16,22].map(size=>({id:'normal-'+size,kind:'normal',size})),...G.SC.filter(x=>x.kind!=='normal')];
const OUT='reports/mixed-e10-baseline',E=fs.readFileSync('online/v012-expedition-runtime.js','utf8');
const anchor="(!statOnly&&conditions&&conditionCard?conditions.countFor(g.selected,conditionCard,g.dungeon,conditionMitigation):(g.selected.mobCount||3))";
assert.equal(E.split(anchor).length,2);const EXACT_SIZE=E.replace(anchor,'(g.selected.mobCount||3)');
function cell(p,sc,i){
 const family=sc.family||FAMILIES[i%FAMILIES.length],seed=64823000+i*101;
 const build={id:p.id,weapon:p.weapon,families:p.families,skills:[],...(p.element?{element:p.element}:{})};
 const opts={mode:'encounter',points:POINTS,gear:'current',rarity:'Rare',runes:false,contracts:'none',targetPolicy:'mechanics',measure:true,tickLimit:6500,lockScenarioStreams:true,controlledTalents:p.t,armorType:p.armorType,offhandType:p.offhandType,...(sc.elite?{stage619EliteType:sc.elite}:{}),stage648b1ExpeditionSource:EXACT_SIZE};
 const x=S.encounter(LEVEL,build,seed,sc.kind,opts,undefined,undefined,family,1,sc.size);
 assert.equal(x.level,LEVEL);assert.equal(x.pointsSpent,POINTS);assert.deepEqual(x.controlledTalentNodes,p.t.nodes);assert.equal(x.affinity,family);assert.equal(x.offhandType,p.offhandType);assert.equal(x.armorType,p.armorType);assert.equal(Number(x.won)+Number(x.died)+Number(x.timedOut),1);
 if(sc.elite)assert.equal(x.eliteType,sc.elite);if(sc.family)assert.equal(x.bossAffinity,sc.family);if(sc.size){assert.equal(x.requestedGroupSize,sc.size);assert.equal(x.initialEnemies,sc.size);assert.equal(x.roster.length,sc.size);assert(x.peakVisibleEnemies<=4);if(x.won){assert.equal(x.groupPressure.remainingReserve,0);assert.equal(x.groupPressure.remainingActors,0);}}
 const m=x.affinityMetrics||{};
 return {id:p.id,sc:sc.id,kind:sc.kind,trial:i,seed,resolved:x.resolvedSeed,realm:family,gear:x.gearFingerprint,roster:x.roster,roles:x.initialRoles,trait:x.traitId,condition:x.conditionId,bossMods:x.bossModifierIds,elite:x.eliteType,boss:x.bossId,won:x.won,died:x.died,timeout:x.timedOut,seconds:x.seconds,damage:x.damageDealt,secondary:x.secondaryTargetDamage,taken:x.damageTaken,absorbed:x.absorbed,healed:m.healingActual||0,hpEnd:x.hpEnd,hpMax:x.hpMax,mpEnd:x.mpEnd,mpMax:x.mpMax,paid:m.manaSpent||0,unfunded:x.unfundedCasterAttacks,starved:m.manaStarvedSeconds||0,firstKill:x.firstKillSeconds??null,stats:x.heroBaseStats,dotDamage:m.dotDamageActual||0,barrierGenerated:m.barrierGenerated||0,barrierAtEntry:m.barrierAtEntry||0,passiveActivations:m.passiveActivations||{},weaponStatus:x.weaponStatusMetrics||{},decayMetrics:x.decayTalentMetrics||{},graveBloom:x.graveBloomMetrics||{},defensiveMetrics:x.defensiveTalentMetrics||{},magicMetrics:x.magicAdaptiveMetrics||{},actualSize:x.initialEnemies,conditionMarked:x.conditionMarked,vanguard:x.vanguardEncounter,initialPrincipals:x.groupPressure?.initialPrincipals??null};
}

function profile(id){assert(IDS.includes(id));return G.profile(id);}
function stats(rows){
 const s=G.summary(rows),sum=k=>rows.reduce((n,r)=>n+(Number(r[k])||0),0),sec=sum('seconds'),activations={};
 for(const r of rows)for(const [k,n] of Object.entries(r.passiveActivations))activations[k]=(activations[k]||0)+n;
 return {...s,dotDps:sec?sum('dotDamage')/sec:0,barrierGeneratedPerSecond:sec?sum('barrierGenerated')/sec:0,passiveActivations:activations};
}
function group(rows){return Object.fromEntries([['overall',rows],...['normal','elite','boss'].map(k=>[k,rows.filter(r=>r.kind===k)]),...SC.map(sc=>[sc.id,rows.filter(r=>r.sc===sc.id)])].map(([k,v])=>[k,stats(v)]));}
function arm(id,scenario,file){
 const p=profile(id),sc=SC.find(s=>s.id===scenario);assert(sc);
 const rows=Array.from({length:N},(_,i)=>cell(p,sc,i));
 fs.writeFileSync(file,JSON.stringify({id,scenario,source:S.sourceFingerprint().sha256,rows}));
 console.log('MIXED_E10_ARM='+JSON.stringify({id,scenario,n:rows.length,summary:stats(rows)}));
}
function run(id){
 const p=profile(id),tmp=fs.mkdtempSync(path.join(os.tmpdir(),'mixed-e10-')),rows=[];
 try{for(const sc of SC){
  const file=path.join(tmp,'arm.json'),child=spawnSync(process.execPath,['--max-old-space-size=4096',__filename,'arm',id,sc.id,file],{stdio:'inherit'});
  if(child.error)throw child.error;assert.equal(child.status,0,id+'/'+sc.id);
  const x=JSON.parse(fs.readFileSync(file,'utf8'));assert.equal(x.id,id);assert.equal(x.scenario,sc.id);assert.equal(x.source,S.sourceFingerprint().sha256);assert.equal(x.rows.length,N);rows.push(...x.rows);fs.unlinkSync(file);
 }
 fs.mkdirSync(OUT,{recursive:true});fs.writeFileSync(path.join(OUT,id+'.json'),JSON.stringify({id,families:p.families,weapon:p.weapon,armor:p.armorType,offhand:p.offhandType,skills:p.skills,nodes:p.t.nodes,element:p.t.element||null,prepared:p.t.prepared||null,source:S.sourceFingerprint().sha256,rows}));
 }finally{fs.rmSync(tmp,{recursive:true,force:true});}
}
function smoke(){
 const pairs=new Set();
 for(const id of IDS){const p=profile(id);assert.equal(p.t.nodes.length,30);if(p.families.length===2)pairs.add(p.families.slice().sort().join('/'));}
 assert.equal(pairs.size,15);assert.equal(IDS.length,21);
 for(const id of IDS){const p=profile(id);for(const sc of [SC[0],SC[5],SC.find(s=>s.id==='elite-tank'),SC.find(s=>s.id==='boss-blood')])cell(p,sc,0);}
 console.log('MIXED_E10_SMOKE_OK '+IDS.length+' profiles / 15 pairs');
}
function aggregate(){
 const profiles=IDS.map(id=>{const x=JSON.parse(fs.readFileSync(path.join(OUT,id+'.json'),'utf8')),p=profile(id);assert.equal(x.id,id);assert.equal(x.rows.length,N*SC.length);assert.equal(new Set(x.rows.map(r=>r.sc+'/'+r.trial)).size,x.rows.length);assert.deepEqual(x.nodes,p.t.nodes);return x;});
 assert.equal(new Set(profiles.map(p=>p.source)).size,1);const n=profiles.reduce((s,p)=>s+p.rows.length,0);assert.equal(n,IDS.length*SC.length*N);
 const base=new Map(profiles[0].rows.map(r=>[r.sc+'/'+r.trial,r])),gear=new Map(),pairing={cases:0,encounterMatches:0,gearComparisons:0,gearMatches:0,mismatches:[]};
 for(const p of profiles)for(const r of p.rows){const key=r.sc+'/'+r.trial,b=base.get(key);assert(b);const dif=['seed','resolved','realm','roster','roles','trait','condition','conditionMarked','bossMods','elite','boss','vanguard'].filter(k=>JSON.stringify(r[k])!==JSON.stringify(b[k]));pairing.cases++;if(!dif.length)pairing.encounterMatches++;else if(pairing.mismatches.length<20)pairing.mismatches.push({id:p.id,key,dif});
  const gk=[p.weapon,p.armor,p.offhand,key].join('/');if(gear.has(gk)){pairing.gearComparisons++;if(gear.get(gk)===r.gear)pairing.gearMatches++;else if(pairing.mismatches.length<20)pairing.mismatches.push({id:p.id,key,dif:['gear']});}else gear.set(gk,r.gear);
 }
 const short=s=>({n:s.n,wins:s.wins,win:s.winPct,timeouts:s.timeouts,seconds:s.meanSeconds,dps:s.meanDps,dotDps:s.dotDps,aoe:s.secondaryDps,taken:s.takenPerSecond,heal:s.healedPerSecond,absorbed:s.absorbedPerSecond,barrier:s.barrierGeneratedPerSecond,mana:s.manaEndPct,paid:s.paidPerSecond,starved:s.starved,unfunded:s.unfunded,hp:s.hpEndPct,activations:s.passiveActivations});
 const results=profiles.map(({rows,...p})=>({...p,results:group(rows)}));
 const mixed=group(profiles.filter(p=>p.families.length===2).flatMap(p=>p.rows)),pure=group(profiles.filter(p=>p.families.length===1).flatMap(p=>p.rows));
 const result={n,source:profiles[0].source,config:{level:LEVEL,points:POINTS,nPerCell:N,rarity:'Rare',runes:false,contracts:'none',risk:1,scenarios:SC},pairing,profiles:results,mixed,pure};
 fs.writeFileSync(path.join(OUT,'summary.json'),JSON.stringify(result));
 console.log('MIXED_E10_OVERVIEW='+JSON.stringify({n,pairing,config:result.config,mixed:Object.fromEntries(Object.entries(mixed).map(([k,v])=>[k,short(v)])),pure:Object.fromEntries(Object.entries(pure).map(([k,v])=>[k,short(v)]))}));
 for(const p of results)console.log('MIXED_E10_PROFILE='+JSON.stringify({...p,results:Object.fromEntries(Object.entries(p.results).map(([k,v])=>[k,short(v)]))}));
}
if(require.main===module){const [cmd,id,sc,file]=process.argv.slice(2);if(cmd==='smoke')smoke();else if(cmd==='run')run(id);else if(cmd==='arm')arm(id,sc,file);else if(cmd==='aggregate')aggregate();else throw Error('unknown command');}
