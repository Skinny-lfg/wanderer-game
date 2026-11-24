'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),G=require('./v013-global-e10.cjs'),H=require('./v013-survival-e10.cjs'),S=require('./simulate-progression.cjs');
const LEVEL=10,POINTS=30,N=50,FAMILIES=['blood','decay','vitality','aegis','fury','magic'];
const IDS=G.IDS.filter(id=>/^(blood-|fury-|decay-)/.test(id)),SC=H.SC,ARMS=['pure','double'];
const source=fs.readFileSync('combat/v012-gear-stats.js','utf8'),anchor='result.power=power(result);';
assert.equal(source.split(anchor).length,2);
const doubleSource=source.replace(anchor,"if(state?.automaticTalents?.nodes?.some(id=>['affinity_blood','affinity_decay','affinity_fury'].includes(id))&&!state.automaticTalents.nodes.some(id=>['affinity_aegis','affinity_vitality'].includes(id))){result.attack*=2;if(Number.isFinite(result.spellPower))result.spellPower*=2;}"+anchor);

function nativeCell(p,sc,i,arm){
 const family=sc.family||FAMILIES[i%FAMILIES.length],seed=64823000+i*101;
 const build={id:p.id,weapon:p.weapon,families:p.families,skills:[],...(p.element?{element:p.element}:{})};
 const opts={...(arm==='double'?{stage648c2cGearStatsSource:doubleSource}:{}),mode:'encounter',points:POINTS,gear:'current',rarity:'Rare',runes:false,contracts:'none',targetPolicy:'mechanics',measure:true,tickLimit:6500,lockScenarioStreams:true,controlledTalents:p.t,armorType:p.armorType,offhandType:p.offhandType,...(sc.elite?{stage619EliteType:sc.elite}:{})};
 const x=S.encounter(LEVEL,build,seed,sc.kind,opts,undefined,undefined,family,1,sc.size);
 assert.equal(x.level,LEVEL);assert.equal(x.pointsSpent,POINTS);assert.deepEqual(x.controlledTalentNodes,p.t.nodes);assert.equal(x.affinity,family);assert.equal(x.offhandType,p.offhandType);assert.equal(x.armorType,p.armorType);assert(x.won||x.died||x.timedOut);
 if(sc.elite)assert.equal(x.eliteType,sc.elite);if(sc.family)assert.equal(x.bossAffinity,sc.family);if(sc.size)assert.equal(x.requestedGroupSize,sc.size);
 const m=x.affinityMetrics||{};
 return {id:p.id,sc:sc.id,kind:sc.kind,trial:i,seed,resolved:x.resolvedSeed,realm:family,gear:x.gearFingerprint,roster:x.roster,roles:x.initialRoles,trait:x.traitId,condition:x.conditionId,bossMods:x.bossModifierIds,elite:x.eliteType,boss:x.bossId,won:x.won,died:x.died,timeout:x.timedOut,seconds:x.seconds,damage:x.damageDealt,secondary:x.secondaryTargetDamage,taken:x.damageTaken,absorbed:x.absorbed,healed:m.healingActual||0,hpEnd:x.hpEnd,hpMax:x.hpMax,mpEnd:x.mpEnd,mpMax:x.mpMax,paid:m.manaSpent||0,unfunded:x.unfundedCasterAttacks,starved:m.manaStarvedSeconds||0,firstKill:x.firstKillSeconds??null,stats:x.heroBaseStats};
}

function pair(id,sc,i){const p=G.profile(id);assert(p.families.length===1&&['blood','decay','fury'].includes(p.families[0]));const rows={pure:nativeCell(p,sc,i,'pure'),double:nativeCell(p,sc,i,'double')};H.paired(rows.pure,rows.double);for(const [k,v] of Object.entries(rows.pure.stats)){if(k==='power')continue;const expected=['attack','spellPower'].includes(k)&&typeof v==='number'?v*2:v;assert.equal(rows.double.stats[k],expected,id+' '+k);}return {sc:sc.id,i,rows};}
function group(cases){const groups={overall:cases,normal:cases.filter(x=>x.sc.startsWith('normal-')),elite:cases.filter(x=>x.sc.startsWith('elite-')),boss:cases.filter(x=>x.sc.startsWith('boss-')),...Object.fromEntries(SC.map(s=>[s.id,cases.filter(x=>x.sc===s.id)]))};return Object.fromEntries(Object.entries(groups).map(([k,v])=>[k,Object.fromEntries(ARMS.map(a=>[a,H.summarize(v,a)]))]));}
function write(file,data){fs.mkdirSync(require('node:path').dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(data));}
function run(id){assert(IDS.includes(id));const cases=[];for(const sc of SC)for(let i=0;i<N;i++)cases.push(pair(id,sc,i));write('reports/offense-e10/'+id+'.json',{id,source:S.sourceFingerprint().sha256,nodes:G.profile(id).t.nodes,cases});console.log('OFFENSE_E10_SHARD='+JSON.stringify({id,overall:group(cases).overall}));}
function smoke(){for(const id of IDS)pair(id,SC[0],0);for(const sc of SC)pair('decay-cycle-wand',sc,1);console.log('OFFENSE_E10_SMOKE='+JSON.stringify({profiles:IDS.length,scenarios:SC.length}));}
function aggregate(){
 const all=IDS.map(id=>{const x=JSON.parse(fs.readFileSync('reports/offense-e10/'+id+'.json','utf8'));assert.equal(x.id,id);assert.equal(x.cases.length,N*SC.length);assert.equal(new Set(x.cases.map(c=>c.sc+'/'+c.i)).size,x.cases.length);for(const c of x.cases)H.paired(c.rows.pure,c.rows.double);return x;});assert.equal(new Set(all.map(x=>x.source)).size,1);
 const collect=pred=>group(all.filter(x=>pred(x.id)).flatMap(x=>x.cases));
 const profiles=Object.fromEntries(all.map(x=>[x.id,{nodes:x.nodes,...group(x.cases)}]));
 const families=Object.fromEntries(['blood','fury','decay-cycle','decay-focus'].map(f=>[f,collect(id=>id.startsWith(f+'-'))]));
 const matched=collect(id=>!id.startsWith('decay-focus-')),overall=collect(()=>true),report={source:all[0].source,n:all.length*SC.length*N*2,pairedComparisons:all.length*SC.length*N,overall,matched,families,profiles};
 write('reports/v013-offense-e10.json',report);
 const compact=s=>({n:s.n,wins:s.wins,winPct:+s.winPct.toFixed(2),timeouts:s.timeouts,dps:+s.meanDps.toFixed(2),damage:Math.round(s.meanDamage),hp:Math.round(s.meanHP),def:+s.meanDefense.toFixed(2),taken:+s.takenPerSecond.toFixed(2),healed:Math.round(s.meanHealed),mana:s.manaEndPct===null?null:+s.manaEndPct.toFixed(2),deathSec:s.meanDeathSeconds===null?null:+s.meanDeathSeconds.toFixed(2),rescued:s.lossToWin,lost:s.winToLoss,bothDiedDelta:s.bothDiedDeltaSeconds===null?null:+s.bothDiedDeltaSeconds.toFixed(2)});
 const brief=g=>Object.fromEntries(['overall','normal','elite','boss',...SC.map(x=>x.id)].map(k=>[k,Object.fromEntries(ARMS.map(a=>[a,compact(g[k][a])]))]));
 console.log('OFFENSE_E10_OVERVIEW='+JSON.stringify({n:report.n,pairedComparisons:report.pairedComparisons,overall:brief(overall),matched:brief(matched),families:Object.fromEntries(Object.entries(families).map(([k,v])=>[k,brief(v)]))}));
 for(const f of Object.keys(families))console.log('OFFENSE_E10_'+f.toUpperCase().replace('-','_')+'='+JSON.stringify(Object.fromEntries(Object.entries(profiles).filter(([k])=>k.startsWith(f+'-')).map(([k,v])=>[k,brief(v)]))));
}
if(require.main===module){const [cmd,id]=process.argv.slice(2);if(cmd==='run')run(id);else if(cmd==='smoke')smoke();else if(cmd==='aggregate')aggregate();else throw Error('command');}
module.exports={pair,IDS,SC,ARMS,doubleSource};
