'use strict';
// Diagnostic VM overrides only. No production code is edited.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const S=require('./simulate-progression.cjs'),G=require('./v013-global-e10.cjs'),{T}=require('../tests/v013-current-talent-helper.cjs');
const IDS=['fury-daggers','fury-bow','fury-twohand','blood-daggers','decay-cycle-daggers'];
const ARMORS=['Cloth','Leather','Plate'],SC=['normal-1','normal-4','normal-8','normal-12','elite','boss'];
const F=['blood','decay','vitality','aegis','fury','magic'],ELITES=G.SC.filter(x=>x.kind==='elite').map(x=>x.elite);
const N=100,OUT='reports/e10-evasion-sources';
const gear=fs.readFileSync('combat/v012-gear-stats.js','utf8'),runtime=fs.readFileSync('combat/v012-combat-runtime.js','utf8');
function rep(s,a,b){assert.equal(s.split(a).length,2,'missing or ambiguous source anchor: '+a);return s.replace(a,b);}
let observer=rep(runtime,"  const attackType=ports.enemyAttackType(e);","  const attackType=ports.enemyAttackType(e);\n  ports.phase6Metric(r,'auditEnemyAttacks',1);ports.phase6Metric(r,attackType==='physical'?'auditPhysicalAttacks':'auditNonPhysicalAttacks',1);ports.phase6Metric(r,'auditPreAvoidDamage',raw);");
observer=rep(observer,"   ports.phase6Metric(r,'dodges',1);","   ports.phase6Metric(r,'dodges',1);ports.phase6Metric(r,'auditDodgePrevented',raw);");
const noDodge=rep(observer,"  const chance=type==='physical'?ports.evasionChance(run.stats.evasionRating||0,run.tier):0;","  const chance=0;");
const beforeTalent=" if(state?.automaticTalents?.nodes?.length&&root.WandererAutomaticTalents)root.WandererAutomaticTalents.apply(s,state.automaticTalents);";
const beforeMods=" let result=s;";
const afterMods=" // A shieldless character must unlock Guard before gear can improve it.";
const finalStats="result.power=power(result);";
const variants={
 native:gear,
 'no-armor-rating':rep(gear,'return Number.isFinite(value)&&value>0?value:0;','return 0;'),
 'no-talent-rating':rep(gear,beforeTalent,' const auditRating=s.evasionRating;\n'+beforeTalent+'\n s.evasionRating=auditRating;'),
 'no-buildcraft-rating':rep(rep(gear,beforeMods,' const auditRating=s.evasionRating;\n'+beforeMods),afterMods,' result.evasionRating=auditRating;\n'+afterMods),
 // Test only direct AGI dependency in late stat projection, not AGI's offensive benefits.
 'agi-neutral-projection':rep(rep(gear,beforeTalent,' const auditAgi=s.agi;s.agi=5;\n'+beforeTalent),afterMods,' result.agi=auditAgi;\n'+afterMods),
 'zero-rating':rep(gear,finalStats,'result.evasionRating=0;'+finalStats),
 'no-dodge':gear,
 'no-defense':rep(gear,finalStats,'result.defense=0;'+finalStats),
 'no-defense-no-dodge':rep(gear,finalStats,'result.defense=0;'+finalStats)
};
const ARMS=Object.keys(variants);
function runCell(id,armor,sc,i,arm,observe=true){
 const p=G.profile(id),kind=sc.startsWith('normal')?'normal':sc,groupSize=kind==='normal'?Number(sc.split('-')[1]):undefined;
 const family=F[i%F.length],elite=kind==='elite'?ELITES[i%ELITES.length]:undefined,seed=65901001+i*101;
 const build={id:p.id,weapon:p.weapon,families:p.families,skills:[],...(p.element?{element:p.element}:{})};
 const opts={mode:'encounter',points:30,gear:'current',rarity:'Rare',runes:false,contracts:'none',targetPolicy:'mechanics',measure:true,tickLimit:6500,lockScenarioStreams:true,controlledTalents:p.t,armorType:p.armorType,offhandType:p.offhandType,...(armor!==p.armorType?{stageE10ArmorVariant:armor}:{}),...(elite?{stage619EliteType:elite}:{}),...(observe?{stageArmorRuntimeSource:arm.includes('no-dodge')?noDodge:observer}:{}),...(variants[arm]!==gear?{stage648c2cGearStatsSource:variants[arm]}:{})};
 const x=S.encounter(10,build,seed,kind,opts,undefined,undefined,family,1,groupSize);
 assert.equal(x.level,10);assert.equal(x.pointsSpent,30);assert.deepEqual(Array.from(x.controlledTalentNodes),Array.from(p.t.nodes));assert.equal(x.armorType,armor);assert.equal(x.offhandType,p.offhandType);assert.equal(x.affinity,family);assert(x.won||x.died||x.timedOut);
 if(elite)assert.equal(x.eliteType,elite);if(kind==='boss')assert.equal(x.bossAffinity,family);if(groupSize)assert.equal(x.requestedGroupSize,groupSize);
 const m=x.affinityMetrics||{};
 return {seed,resolved:x.resolvedSeed,realm:family,gear:x.gearFingerprint,nonArmorGear:x.nonArmorGearFingerprint,roster:x.roster,roles:x.initialRoles,trait:x.traitId,condition:x.conditionId,bossMods:x.bossModifierIds,elite:x.eliteType,boss:x.bossId,won:x.won,died:x.died,timeout:x.timedOut,seconds:x.seconds,damage:x.damageDealt,taken:x.damageTaken,hpEnd:x.hpEnd,hpMax:x.hpMax,stats:x.heroBaseStats,def:m.defensiveAudit||{},activations:m.passiveActivations||{}};
}
function paired(b,r,arm){
 for(const k of ['seed','resolved','realm','gear','nonArmorGear','roster','roles','trait','condition','bossMods','elite','boss'])assert.deepEqual(r[k],b[k],arm+' changed '+k);
 for(const k of Object.keys(b.stats))if(!['evasionRating','defense','power'].includes(k))assert.equal(r.stats[k],b.stats[k],arm+' changed '+k);
 if(!arm.includes('no-defense'))assert.equal(r.stats.defense,b.stats.defense);
 if(arm==='zero-rating')assert.equal(r.stats.evasionRating,0);
 if(arm.includes('no-defense'))assert.equal(r.stats.defense,0);
 if(arm.includes('no-dodge')||arm==='zero-rating')assert.equal(r.def.dodges||0,0);
}
function trial(id,armor,sc,i){
 const rows={};for(const arm of ARMS){rows[arm]=runCell(id,armor,sc,i,arm);if(arm!=='native')paired(rows.native,rows[arm],arm);}
 return {sc,i,rows};
}
function summarize(cases){
 const out={};for(const arm of ARMS){
 const rs=cases.map(c=>c.rows[arm]),n=rs.length,sum=(f)=>rs.reduce((s,r)=>s+(Number(f(r))||0),0),d=k=>sum(r=>r.def[k]);
 out[arm]={n,wins:sum(r=>r.won),winPct:100*sum(r=>r.won)/n,meanRating:sum(r=>r.stats.evasionRating)/n,meanAgi:sum(r=>r.stats.agi)/n,meanDefense:sum(r=>r.stats.defense)/n,physical:d('auditPhysicalAttacks'),dodges:d('dodges'),dodgePct:d('auditPhysicalAttacks')?100*d('dodges')/d('auditPhysicalAttacks'):0,dodgeDamage:d('auditDodgePrevented'),armorPrevented:d('armor'),shieldPrevented:d('shield'),damageTaken:sum(r=>r.taken),damageDealt:sum(r=>r.damage),seconds:sum(r=>r.seconds),timeouts:sum(r=>r.timeout),pairedGains:cases.filter(c=>!c.rows.native.won&&c.rows[arm].won).length,pairedLosses:cases.filter(c=>c.rows.native.won&&!c.rows[arm].won).length};
 }
 return out;
}
function talentSources(id){const p=G.profile(id),byId=new Map(T.NODES.map(n=>[n.id,n]));return p.t.nodes.map(id=>({id,rating:byId.get(id.replace(/_rank\d+$/,''))?.flatAvoid||0})).filter(n=>n.rating);}
function write(name,obj){fs.mkdirSync(OUT,{recursive:true});fs.writeFileSync(path.join(OUT,name),JSON.stringify(obj)+'\n');}
function smoke(){
 for(const src of [...Object.values(variants),observer,noDodge])new Function(src);
 for(const id of IDS)for(const armor of ARMORS){
 const c=trial(id,armor,'normal-1',0),native=runCell(id,armor,'normal-1',0,'native',false);
 for(const k of ['stats','won','died','timeout','seconds','damage','taken','hpEnd','gear','roster'])assert.deepEqual(c.rows.native[k],native[k],'observer parity '+id+'/'+armor+'/'+k);
 console.log('EVASION_SOURCE_SMOKE='+JSON.stringify({id,armor,talents:talentSources(id),stats:Object.fromEntries(ARMS.map(a=>[a,c.rows[a].stats.evasionRating]))}));
 }
 console.log('EVASION_SOURCE_SMOKE_OK');
}
function run(id,armor){
 assert(IDS.includes(id)&&ARMORS.includes(armor));const cases=[];
 for(const sc of SC)for(let i=0;i<N;i++)cases.push(trial(id,armor,sc,i));
 const grouped=Object.fromEntries(['all','normal',...SC].map(sc=>[sc,summarize(cases.filter(c=>sc==='all'||(sc==='normal'?c.sc.startsWith('normal'):c.sc===sc)))]));
 const obj={id,armor,source:S.sourceFingerprint().sha256,talents:talentSources(id),grouped,cases};
 write(id+'-'+armor+'.json',obj);
 console.log('EVASION_SOURCE_RESULT='+JSON.stringify({...obj,cases:undefined}));
}
function aggregate(){
 const profiles=[];let n=0;const sources=new Set();
 for(const id of IDS){
 const set=ARMORS.map(a=>JSON.parse(fs.readFileSync(path.join(OUT,id+'-'+a+'.json'))));
 for(const x of set){
 assert.equal(x.cases.length,N*SC.length);assert.equal(new Set(x.cases.map(c=>c.sc+'/'+c.i)).size,N*SC.length);
 sources.add(x.source);n+=x.cases.length*ARMS.length;
 for(const c of x.cases)for(const arm of ARMS.slice(1))paired(c.rows.native,c.rows[arm],arm);
 for(let i=0;i<x.cases.length;i++)for(const k of ['seed','resolved','realm','nonArmorGear','roster','roles','trait','condition','bossMods','elite','boss'])assert.deepEqual(x.cases[i].rows.native[k],set[0].cases[i].rows.native[k],id+' cross armor '+k);
 profiles.push({...x,cases:undefined});
 console.log('EVASION_SOURCE_PROFILE='+JSON.stringify(profiles.at(-1)));
 }
 }
 assert.equal(sources.size,1);write('summary.json',{n,profiles});console.log('EVASION_SOURCE_OVERVIEW='+JSON.stringify({n,profiles:profiles.length,arms:ARMS}));
}
const [cmd,id,armor]=process.argv.slice(2);if(cmd==='smoke')smoke();else if(cmd==='run')run(id,armor);else if(cmd==='aggregate')aggregate();else throw Error('unknown command');
