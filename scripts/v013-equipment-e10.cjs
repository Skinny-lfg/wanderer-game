'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),G=require('./v013-global-e10.cjs'),H=require('./v013-survival-e10.cjs'),S=require('./simulate-progression.cjs');
const LEVEL=10,POINTS=30,N=50,FAMILIES=['blood','decay','radiance','aegis','fury','arcane'];
const IDS=G.IDS.filter(id=>/^(blood-|fury-|decay-)/.test(id)),SC=H.SC;
const source=fs.readFileSync('combat/v012-gear-stats.js','utf8'),anchor='result.power=power(result);';
assert.equal(source.split(anchor).length,2);
const cache=new Map();
function damageSource(factor){assert([1.25,1.4,1.5,1.65,1.75].includes(factor));if(!cache.has(factor))cache.set(factor,source.replace(anchor,"if(state?.automaticTalents?.nodes?.some(id=>['affinity_blood','affinity_decay','affinity_fury'].includes(id))&&!state.automaticTalents.nodes.some(id=>['affinity_aegis','affinity_radiance'].includes(id))){result.attack*="+factor+";if(Number.isFinite(result.spellPower))result.spellPower*="+factor+";}"+anchor));return cache.get(factor);}
function arms(p){
 const base={id:'pure',factor:1,armor:p.armorType,offhand:p.offhandType},out=[base];
 for(const factor of p.families[0]==='decay'?[1.5,1.65,1.75]:[1.25,1.4,1.5])out.push({...base,id:'damage-'+Math.round((factor-1)*100),factor});
 for(const armor of ['Cloth','Leather','Plate'])if(armor!==p.armorType)out.push({...base,id:'armor-'+armor,armor});
 if(!['Bow','Staff','Two-Handed'].includes(p.weapon))for(const offhand of ['Shield','Orb','Charm','Tome'])if(offhand!==p.offhandType)out.push({...base,id:'offhand-'+offhand,offhand});
 return out;
}

function nativeCell(p,sc,i,arm){
 const family=sc.family||FAMILIES[i%FAMILIES.length],seed=64823000+i*101;
 const build={id:p.id,weapon:p.weapon,families:p.families,skills:[],...(p.element?{element:p.element}:{})};
 const opts={...(arm.factor!==1?{stage648c2cGearStatsSource:damageSource(arm.factor)}:{}),...(arm.armor!==p.armorType?{stageE10ArmorVariant:arm.armor}:{}),mode:'encounter',points:POINTS,gear:'current',rarity:'Rare',runes:false,contracts:'none',targetPolicy:'mechanics',measure:true,tickLimit:6500,lockScenarioStreams:true,controlledTalents:p.t,armorType:p.armorType,offhandType:arm.offhand,...(sc.elite?{stage619EliteType:sc.elite}:{})};
 const x=S.encounter(LEVEL,build,seed,sc.kind,opts,undefined,undefined,family,1,sc.size);
 assert.equal(x.level,LEVEL);assert.equal(x.pointsSpent,POINTS);assert.deepEqual(x.controlledTalentNodes,p.t.nodes);assert.equal(x.affinity,family);assert.equal(x.offhandType,arm.offhand);assert.equal(x.armorType,arm.armor);assert(x.won||x.died||x.timedOut);
 if(sc.elite)assert.equal(x.eliteType,sc.elite);if(sc.family)assert.equal(x.bossAffinity,sc.family);if(sc.size)assert.equal(x.requestedGroupSize,sc.size);
 const m=x.affinityMetrics||{};
 return {id:p.id,sc:sc.id,kind:sc.kind,trial:i,seed,resolved:x.resolvedSeed,realm:family,gear:x.gearFingerprint,otherGear:x.otherGearFingerprint,nonArmorGear:x.nonArmorGearFingerprint,armor:x.armorType,offhand:x.offhandType,roster:x.roster,roles:x.initialRoles,trait:x.traitId,condition:x.conditionId,bossMods:x.bossModifierIds,elite:x.eliteType,boss:x.bossId,won:x.won,died:x.died,timeout:x.timedOut,seconds:x.seconds,damage:x.damageDealt,secondary:x.secondaryTargetDamage,taken:x.damageTaken,absorbed:x.absorbed,healed:m.healingActual||0,hpEnd:x.hpEnd,hpMax:x.hpMax,mpEnd:x.mpEnd,mpMax:x.mpMax,paid:m.manaSpent||0,unfunded:x.unfundedCasterAttacks,starved:m.manaStarvedSeconds||0,firstKill:x.firstKillSeconds??null,orbBarrier:m.offhandOrbBarrier||0,charmHealing:m.offhandCharmHealing||0,tomeMana:m.offhandTomeMana||0,stats:x.heroBaseStats};
}

function paired(base,row,arm){
 for(const key of ['id','sc','kind','trial','seed','resolved','realm','roster','roles','trait','condition','bossMods','elite','boss'])assert.deepEqual(row[key],base[key],'pair '+base.id+' '+base.sc+' '+base.trial+' '+key);
 if(arm.id.startsWith('armor-')){assert.equal(row.nonArmorGear,base.nonArmorGear,'non-armor gear drift');assert.equal(row.offhand,base.offhand);}
 else if(arm.id.startsWith('offhand-')){assert.equal(row.otherGear,base.otherGear,'non-offhand gear drift');assert.equal(row.armor,base.armor);}
 else {assert.equal(row.gear,base.gear);for(const [k,v] of Object.entries(base.stats)){if(k==='power')continue;assert.equal(row.stats[k],['attack','spellPower'].includes(k)&&typeof v==='number'?v*arm.factor:v,base.id+' '+arm.id+' '+k);}}
}
function trial(p,sc,i){const rows={};for(const arm of arms(p)){rows[arm.id]=nativeCell(p,sc,i,arm);if(arm.id!=='pure')paired(rows.pure,rows[arm.id],arm);}return {sc:sc.id,i,rows};}
function avg(rows,k){return rows.reduce((s,r)=>s+(r[k]||0),0)/rows.length;}
function summarize(cases,arm){const s=H.summarize(cases,arm),rows=cases.map(c=>c.rows[arm]);return {...s,meanEvasion:rows.reduce((n,x)=>n+(x.stats.evasionRating||0),0)/rows.length,meanBlock:rows.reduce((n,x)=>n+(x.stats.blockChance||0),0)/rows.length,orbBarrier:avg(rows,'orbBarrier'),charmHealing:avg(rows,'charmHealing'),tomeMana:avg(rows,'tomeMana')};}
function group(cases,ids){const groups={overall:cases,normal:cases.filter(x=>x.sc.startsWith('normal-')),elite:cases.filter(x=>x.sc.startsWith('elite-')),boss:cases.filter(x=>x.sc.startsWith('boss-')),...Object.fromEntries(SC.map(s=>[s.id,cases.filter(x=>x.sc===s.id)]))};return Object.fromEntries(Object.entries(groups).map(([k,v])=>[k,Object.fromEntries(ids.map(a=>[a,summarize(v,a)]))]));}
function write(file,obj){fs.mkdirSync(require('node:path').dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(obj));}
function run(id){assert(IDS.includes(id));const p=G.profile(id),cases=[];for(const sc of SC)for(let i=0;i<N;i++)cases.push(trial(p,sc,i));write('reports/equipment-e10/'+id+'.json',{id,source:S.sourceFingerprint().sha256,nodes:p.t.nodes,arms:arms(p),cases});console.log('EQUIPMENT_E10_SHARD='+JSON.stringify({id,n:cases.length*arms(p).length}));}
function smoke(){for(const id of IDS)trial(G.profile(id),SC[0],0);for(const sc of SC)trial(G.profile('decay-cycle-wand'),sc,1);console.log('EQUIPMENT_E10_SMOKE='+JSON.stringify({profiles:IDS.length,scenarios:SC.length}));}
function aggregate(){
 const all=IDS.map(id=>{const x=JSON.parse(fs.readFileSync('reports/equipment-e10/'+id+'.json','utf8'));assert.equal(x.id,id);assert.equal(x.cases.length,N*SC.length);assert.equal(new Set(x.cases.map(c=>c.sc+'/'+c.i)).size,x.cases.length);assert.deepEqual(x.arms,arms(G.profile(id)));for(const c of x.cases){assert.equal(Object.keys(c.rows).length,x.arms.length);for(const a of x.arms.slice(1))paired(c.rows.pure,c.rows[a.id],a);}return x;});assert.equal(new Set(all.map(x=>x.source)).size,1);
 const profiles=Object.fromEntries(all.map(x=>[x.id,{nodes:x.nodes,arms:x.arms,...group(x.cases,x.arms.map(a=>a.id))}]));
 const damage={};for(const f of ['blood','fury','decay-cycle','decay-focus']){const items=all.filter(x=>x.id.startsWith(f+'-'));damage[f]=group(items.flatMap(x=>x.cases),items[0].arms.filter(a=>a.id==='pure'||a.id.startsWith('damage-')).map(a=>a.id));}
 const n=all.reduce((s,x)=>s+x.cases.length*x.arms.length,0);const report={n,source:all[0].source,damage,profiles};write('reports/v013-equipment-e10.json',report);
 const compact=s=>({n:s.n,wins:s.wins,winPct:+s.winPct.toFixed(2),timeouts:s.timeouts,dps:+s.meanDps.toFixed(2),damage:Math.round(s.meanDamage),hp:Math.round(s.meanHP),def:+s.meanDefense.toFixed(2),ap:+s.meanAP.toFixed(2),sp:+s.meanSP.toFixed(2),evasion:+s.meanEvasion.toFixed(2),block:+s.meanBlock.toFixed(2),taken:+s.takenPerSecond.toFixed(2),absorbed:+s.meanAbsorbed.toFixed(2),healed:+s.meanHealed.toFixed(2),orbBarrier:+s.orbBarrier.toFixed(2),charmHealing:+s.charmHealing.toFixed(2),tomeMana:+s.tomeMana.toFixed(2),mana:s.manaEndPct===null?null:+s.manaEndPct.toFixed(2),deathSec:s.meanDeathSeconds===null?null:+s.meanDeathSeconds.toFixed(2),rescued:s.lossToWin,lost:s.winToLoss});
 const brief=g=>Object.fromEntries(['overall','normal','elite','boss',...SC.map(s=>s.id)].map(k=>[k,Object.fromEntries(Object.entries(g[k]).map(([a,v])=>[a,compact(v)]))]));
 console.log('EQUIPMENT_E10_DAMAGE='+JSON.stringify({n,damage:Object.fromEntries(Object.entries(damage).map(([f,v])=>[f,brief(v)]))}));
 for(const [id,p] of Object.entries(profiles)){const v=brief(p);console.log('EQUIPMENT_E10_PROFILE='+JSON.stringify({id,arms:p.arms,overall:v.overall,normal:v.normal,elite:v.elite,boss:v.boss,scenarios:Object.fromEntries(SC.map(s=>[s.id,Object.fromEntries(Object.entries(p[s.id]).map(([a,v])=>[a,{wins:v.wins,n:v.n,dps:+v.meanDps.toFixed(2)}]))]))}));}
}
if(require.main===module){const [cmd,id]=process.argv.slice(2);if(cmd==='run')run(id);else if(cmd==='smoke')smoke();else if(cmd==='aggregate')aggregate();else throw Error('command');}
module.exports={arms,trial,IDS,SC,damageSource};
