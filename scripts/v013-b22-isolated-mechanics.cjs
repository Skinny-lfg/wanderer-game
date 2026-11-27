'use strict';
// Research-only variants, never written to browser runtime files.
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const S=require('./simulate-progression.cjs'),G=require('./v013-global-e10.cjs'),B=require('./v013-b1-e10-rebaseline.cjs');
const RUNTIME='combat/v012-combat-runtime.js',GEAR='combat/v012-gear-stats.js',runtime=fs.readFileSync(RUNTIME,'utf8'),gear=fs.readFileSync(GEAR,'utf8');
const out='reports/b22',F=['blood','decay','radiance','aegis','fury','arcane'],N=20;
const specs=[
 {id:'blood-sword',study:'dagger'},{id:'aegis-mace',study:'dagger'},{id:'fury-daggers',study:'dagger'},{id:'decay-cycle-daggers',study:'dagger'},{id:'arcane-arcane-wand',study:'dagger'},
 {id:'aegis-mace',study:'sp'},{id:'blood-sword',study:'sp',orb:true}
];
const scenarios=[{id:'solo',kind:'normal',size:1},{id:'group12',kind:'normal',size:12},{id:'boss',kind:'boss'}];
function replace(s,a,b){assert.equal(s.split(a).length,2,'Source anchor '+a.slice(0,100));return s.replace(a,b);}
function originalGear(){
 return replace(gear,' // Cloth amplifies active Spell Power independently of whether the build has Mana.\n if(s.mana)s.mana=Math.round(s.mana*(1+.4*clothFraction));\n if(s.spellPower)s.spellPower=Math.round(s.spellPower*(1+.4*clothFraction));',' if(s.mana){s.mana=Math.round(s.mana*(1+.4*clothFraction));s.spellPower=Math.round(s.spellPower*(1+.4*clothFraction));}');
}
function daggerSource(independent,observer=true){
 let s=runtime;
 if(observer){
  // Use the existing weaponStatusMetrics transport for explicitly named B2
  // counters; these are not new equipment/status effects.
  s=replace(s,'function weaponAttack(r,offhandStrike=false){','function weaponAttack(r,offhandStrike=false){\n ports.phase6Metric(r,offhandStrike?"secondaryEquipmentStatusB2OffhandStrikes":"secondaryEquipmentStatusB2MainStrikes",1);');
  s=replace(s,' const real=Math.max(0,Math.min(e.hp,damage));\n ports.phase6Metric(r,',' const real=Math.max(0,Math.min(e.hp,damage));\n if(offhandStrike)ports.phase6Metric(r,"secondaryEquipmentStatusB2OffhandDamage",real);\n ports.phase6Metric(r,');
 }
 if(!independent)return s;
 // Preserve all native strike logic and half damage; only replace cadence.
 const cadence=" if(!offhandStrike&&['Daggers','Off-Hand Dagger'].includes(off?.subtype)){\n  // Any one-handed main weapon can trigger a Dagger off-hand strike after every two main attacks. Its damage remains 50%.\n  r.offhandCadence=((r.offhandCadence||0)+1)%2;\n  if(r.offhandCadence===0&&e.hp>0){r.offhandStrikes=(r.offhandStrikes||0)+1;weaponAttack(r,true);}\n }";
 s=replace(s,cadence,' // B2: independent offhand attacks are scheduled by the combat clock.');
 s=replace(s,"dual&&(r.offhandCadence||0)===1","dual&&!!r.b2OffhandDue");
 const main=" if(advancePlayerAttackClock(r,dt,s.attacksPerSec*haste)){r.autoUses=(r.autoUses||0)+1;ports.weaponAttack(r);if(r.hp<=0)return;if(e.hp<=0||hasUnsettledGroupDeaths(r)){ports.winEncounter(true);return;}}";
 const clock=" // Independent offhand: half the Dagger's own nominal attack rate, with the same current global speed multipliers and cap.\n r.b2OffhandDue=false;\n if(['Daggers','Off-Hand Dagger'].includes(s.off?.subtype)&&!['Two-Handed','Bow','Staff'].includes(s.main?.subtype)){\n  const nominal=root.WandererV012GearStats.attackSpeed('Daggers',s.agi,s.spdFlat,s.int);\n  const mainRaw=Math.max(.000001,Number(s.rawAttackSpeed)||Number(s.attacksPerSec)||1);\n  const rate=.5*Math.min(4.2,nominal*(s.attacksPerSec/mainRaw)*haste);\n  r.b2OffhandClock??={tPlayer:0};r.b2OffhandDue=advancePlayerAttackClock(r.b2OffhandClock,dt,rate);\n }\n"+main+"\n if(r.b2OffhandDue&&r.enemy?.hp>0&&r.hp>0&&r.status==='fight'){\n  r.offhandStrikes=(r.offhandStrikes||0)+1;weaponAttack(r,true);r.b2OffhandDue=false;\n  if(r.hp<=0)return;if(e.hp<=0||hasUnsettledGroupDeaths(r)){ports.winEncounter(true);return;}\n }";
 return replace(s,main,clock);
}
function blockSource(clamp,zero){
 let s=runtime;
 if(zero)s=replace(s,"  let damageBlocked=0;","  // B2 boundary injection: synthetic post-mitigation zero damage, not a naturally generated encounter.\n  raw=0;\n  let damageBlocked=0;");
 if(clamp)s=replace(s,"damageBlocked=Math.max(1,Math.round(raw*(barrierGuard?(s.blockReduction||.35):s.blockReduction)));","damageBlocked=Math.min(raw,Math.max(1,Math.round(raw*(barrierGuard?(s.blockReduction||.35):s.blockReduction))));");
 return s;
}
const sha=s=>crypto.createHash('sha256').update(s).digest('hex'),serial=x=>JSON.stringify(x),write=(p,x)=>{fs.mkdirSync(require('node:path').dirname(p),{recursive:true});fs.writeFileSync(p,JSON.stringify(x,null,2));};
function cell(spec,sc,i){
 const p=G.profile(spec.id),seed=99300001+i*101,family=F[i%F.length],offhandType=spec.study==='dagger'?'Off-Hand Dagger':spec.orb?'Orb':p.offhandType,armorType=spec.study==='sp'?'Cloth':p.armorType;
 const build={id:p.id,weapon:p.weapon,families:p.families,skills:[],element:p.element};
 const opts={...S.DEFAULTS,mode:'encounter',points:p.t.nodes.length,gear:'current',rarity:'Rare',runes:false,contracts:'none',boons:'none',targetPolicy:'adaptive',measure:true,tickLimit:13000,lockScenarioStreams:true,controlledTalents:p.t,armorType,offhandType};
 const arms=spec.study==='dagger'?[
  {stageArmorRuntimeSource:daggerSource(false),stage648c2cGearStatsSource:originalGear()},
  {stageArmorRuntimeSource:daggerSource(true),stage648c2cGearStatsSource:originalGear()}
 ]:[{stage648c2cGearStatsSource:originalGear()},{}];
 const rows=arms.map(arm=>S.encounter(10,build,seed,sc.kind,{...opts,...arm},undefined,undefined,family,1,sc.size));
 const [a,b]=rows;
 for(const k of ['gearFingerprint','roster','resolvedSeed','controlledTalentNodes','armorType','offhandType','conditionId','conditionMarked','traitId','bossModifierIds','initialEnemies'])assert.equal(serial(a[k]),serial(b[k]),spec.id+' '+sc.id+' '+k);
 if(spec.study==='dagger')assert.deepEqual(a.heroBaseStats,b.heroBaseStats,'Dagger candidate changed gear stats');
 else for(const [k,v]of Object.entries(a.heroBaseStats))if(!['spellPower','power'].includes(k))assert.deepEqual(b.heroBaseStats[k],v,'SP separation changed '+k);
 const compact=x=>({won:x.won,died:x.died,timedOut:x.timedOut,seconds:x.seconds,firstKillSeconds:x.firstKillSeconds,damage:x.damageDealt,taken:x.damageTaken,hpEnd:x.hpEnd,mpEnd:x.mpEnd,mpMax:x.mpMax,manaSpent:x.manaSpent,stats:x.heroBaseStats,healing:x.affinityMetrics?.healingActual,barrier:x.affinityMetrics?.barrierGenerated,absorbed:x.affinityMetrics?.barrierAbsorbed,dotDamage:x.affinityMetrics?.dotDamageActual,offhandStrikes:x.weaponStatusMetrics?.secondaryEquipmentStatusB2OffhandStrikes||0,offhandDamage:x.weaponStatusMetrics?.secondaryEquipmentStatusB2OffhandDamage||0,mainStrikes:x.weaponStatusMetrics?.secondaryEquipmentStatusB2MainStrikes||0,activations:x.affinityMetrics?.passiveActivations,abilityMetrics:{...x.decayTalentMetrics,...x.weaponStatusMetrics,...x.defensiveTalentMetrics}});
 return {i,seed,resolvedSeed:a.resolvedSeed,gearHash:a.gearFingerprint,rosterHash:sha(serial(a.roster)),baseline:compact(a),candidate:compact(b)};
}
function run(index){
 assert(Number.isInteger(index)&&specs[index]);const spec=specs[index],groups=scenarios.map(sc=>({sc,rows:Array.from({length:N},(_,i)=>cell(spec,sc,i))}));
 write(out+'/shard-'+index+'.json',{index,spec,commit:process.env.GITHUB_SHA||null,source:{runtime:sha(runtime),gear:sha(gear),oldGear:sha(originalGear()),coupled:sha(daggerSource(false)),independent:sha(daggerSource(true))},groups});
}
function summarize(rows){
 const mean=(xs,f)=>{const a=xs.map(f).filter(Number.isFinite);return a.length?+(a.reduce((n,x)=>n+x,0)/a.length).toFixed(3):null;};
 const summary=key=>{const x=rows.map(r=>r[key]),v=x.filter(r=>!r.timedOut);return {n:x.length,wins:v.filter(r=>r.won).length,deaths:v.filter(r=>r.died).length,timeouts:x.filter(r=>r.timedOut).length,winPct:v.length?100*v.filter(r=>r.won).length/v.length:null,seconds:mean(v,r=>r.seconds),dps:mean(v,r=>r.seconds>0?r.damage/r.seconds:null),offhandPerSecond:mean(v,r=>r.seconds>0?r.offhandStrikes/r.seconds:null),mainPerSecond:mean(v,r=>r.seconds>0?r.mainStrikes/r.seconds:null),offhandDamage:mean(v,r=>r.offhandDamage),dotDamage:mean(v,r=>r.dotDamage),manaSpent:mean(v,r=>r.manaSpent),barrier:mean(v,r=>r.barrier),healing:mean(v,r=>r.healing),SP:mean(v,r=>r.stats?.spellPower)};};
 return {baseline:summary('baseline'),candidate:summary('candidate'),paired:{winGain:rows.filter(r=>!r.baseline.timedOut&&!r.candidate.timedOut&&!r.baseline.won&&r.candidate.won).length,winLoss:rows.filter(r=>!r.baseline.timedOut&&!r.candidate.timedOut&&r.baseline.won&&!r.candidate.won).length}};
}
function aggregate(){
 const shards=specs.map((spec,i)=>{const s=JSON.parse(fs.readFileSync(out+'/shard-'+i+'.json','utf8'));assert.equal(s.index,i);assert.deepEqual(s.spec,spec);assert.equal(s.groups.length,scenarios.length);for(const g of s.groups){assert.equal(g.rows.length,N);assert.equal(new Set(g.rows.map(r=>r.seed)).size,N);}return s;});
 assert(shards.every(s=>s.commit===shards[0].commit&&serial(s.source)===serial(shards[0].source)));
 const overview=shards.map(s=>({spec:s.spec,groups:s.groups.map(g=>({sc:g.sc,...summarize(g.rows)}))}));
 const timeouts=overview.reduce((n,s)=>n+s.groups.reduce((m,g)=>m+g.baseline.timeouts+g.candidate.timeouts,0),0);
 write(out+'/summary.json',{overview,timeouts,pairedTrials:specs.length*scenarios.length*N,shards,scope:'Controlled E10 exploratory screening, no natural rates; independent cadence not approved; post-approval SP change is separate.'});
 for(const s of overview)console.log('B22_PROFILE='+JSON.stringify(s));
 console.log('B22_OVERVIEW='+JSON.stringify({pairedTrials:specs.length*scenarios.length*N,timeouts,scope:'screening only'}));
 if(timeouts)process.exitCode=1;
}
if(require.main===module){if(process.argv[2]==='aggregate')aggregate();else run(Number(process.argv[2]));}
module.exports={daggerSource,blockSource,originalGear,specs,scenarios,cell};
