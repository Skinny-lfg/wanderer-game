'use strict';
// Diagnostic VM overrides only. No production code is edited.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const S=require('./simulate-progression.cjs'),G=require('./v013-global-e10.cjs'),{T}=require('../tests/v013-current-talent-helper.cjs');
const IDS=['vitality-sword','vitality-mace','vitality-wand','aegis-sword','aegis-mace','aegis-orb','hybrid-vitality-aegis','hybrid-aegis-magic','hybrid-fury-vitality','blood-daggers','magic-fire-wand'];
const CROSS={'vitality-mace':['Leather'],'aegis-mace':['Leather']};
const SC=['normal-1','normal-4','normal-8','normal-12','elite','boss'];
const F=['blood','decay','vitality','aegis','fury','magic'],ELITES=G.SC.filter(x=>x.kind==='elite').map(x=>x.elite);
const N=100,OUT='reports/e10-defensive-sources';
const gear=fs.readFileSync('combat/v012-gear-stats.js','utf8'),runtime=fs.readFileSync('combat/v012-combat-runtime.js','utf8'),buildcraft=fs.readFileSync('combat/v012-buildcraft.js','utf8');
function rep(s,a,b){assert.equal(s.split(a).length,2,'missing or ambiguous source anchor: '+a);return s.replace(a,b);}
let observer=rep(runtime,"  const attackType=ports.enemyAttackType(e);","  const attackType=ports.enemyAttackType(e);\n  ports.phase6Metric(r,'auditEnemyAttacks',1);ports.phase6Metric(r,attackType==='physical'?'auditPhysicalAttacks':'auditNonPhysicalAttacks',1);ports.phase6Metric(r,'auditPreAvoidDamage',raw);");
observer=rep(observer,"   ports.phase6Metric(r,'dodges',1);","   ports.phase6Metric(r,'dodges',1);ports.phase6Metric(r,'auditDodgePrevented',raw);");
const beforeTalent=" if(state?.automaticTalents?.nodes?.length&&root.WandererAutomaticTalents)root.WandererAutomaticTalents.apply(s,state.automaticTalents);";
function graphOff(keys){return rep(gear,beforeTalent,' const auditBefore={...s};\n'+beforeTalent+'\n for(const key of '+JSON.stringify(keys)+')s[key]=auditBefore[key];');}
const allKeys=['defense','maxhp','barrierPower','healingPower','blockChance','blockReduction'];
const variants={
 native:{},
 'no-defense-nodes':{gear:graphOff(['defense'])},
 'no-iron-skin':{build:rep(buildcraft,'s.defense=Math.round(s.defense*(1+.12*Math.sqrt(a)));','s.defense=Math.round(s.defense);')},
 'no-defense-talents':{gear:graphOff(['defense']),build:rep(buildcraft,'s.defense=Math.round(s.defense*(1+.12*Math.sqrt(a)));','s.defense=Math.round(s.defense);')},
 'no-barrier-power-nodes':{gear:graphOff(['barrierPower'])},
 'no-hp-nodes':{gear:graphOff(['maxhp'])},
 'no-strong-heart':{build:rep(buildcraft,'s.maxhp=Math.round(s.maxhp*(1+.10*Math.sqrt(h)));','s.maxhp=Math.round(s.maxhp);')},
 'no-healing-power-nodes':{gear:graphOff(['healingPower'])},
 'no-regen-nodes':{build:rep(buildcraft,'const basicRegenRate=Math.min(.0035,Math.max(0,Number(b.runtime.talentBonuses?.healthRegen)||0));',"const basicRegenRate=b.runtime.specializations?.includes('affinity_vitality')?.0015:0;")},
 'no-guard-nodes':{gear:graphOff(['blockChance','blockReduction'])},
 'no-guarded-block':{build:rep(buildcraft,'s.blockChance=Math.min(65,(s.blockChance||0)+Math.round(24*(1-Math.exp(-rank(b,\'guarded_block\')/4))));','s.blockChance=Math.min(65,s.blockChance||0);')},
 'no-fortified':{build:rep(buildcraft,'+.04*rank(b,\'fortified\')+','+0+')},
 'no-all-defensive-nodes':{gear:graphOff(allKeys),build:rep(buildcraft,'const basicRegenRate=Math.min(.0035,Math.max(0,Number(b.runtime.talentBonuses?.healthRegen)||0));',"const basicRegenRate=b.runtime.specializations?.includes('affinity_vitality')?.0015:0;")},
 // Mechanism controls, not proposed balance changes. Only calls through these native ports.
 'no-barrier-port':{runtime:rep(observer,'function setBarrier(r,amount){','function setBarrier(r,amount){return 0;')},
 'no-heal-port':{runtime:rep(observer,'function setHeal(r,amount,reserveRelease=false){','function setHeal(r,amount,reserveRelease=false){return 0;')}
};
const ARMS=Object.keys(variants);
function armors(id){return [G.profile(id).armorType,...(CROSS[id]||[])];}
function profiles(){return IDS.flatMap(id=>armors(id).map(armor=>({id,armor})));}
function runCell(id,armor,sc,i,arm,observe=true){
 const p=G.profile(id),kind=sc.startsWith('normal')?'normal':sc,groupSize=kind==='normal'?Number(sc.split('-')[1]):undefined;
 const family=F[i%F.length],elite=kind==='elite'?ELITES[i%ELITES.length]:undefined,seed=65901001+i*101;
 const build={id:p.id,weapon:p.weapon,families:p.families,skills:[],...(p.element?{element:p.element}:{})};
 const opts={mode:'encounter',points:30,gear:'current',rarity:'Rare',runes:false,contracts:'none',targetPolicy:'mechanics',measure:true,tickLimit:6500,lockScenarioStreams:true,controlledTalents:p.t,armorType:p.armorType,offhandType:p.offhandType,...(armor!==p.armorType?{stageE10ArmorVariant:armor}:{}),...(elite?{stage619EliteType:elite}:{}),...(observe?{stageArmorRuntimeSource:variants[arm].runtime||observer}:{}),...(variants[arm].gear?{stage648c2cGearStatsSource:variants[arm].gear}:{}),...(variants[arm].build?{stage648c1BuildcraftSource:variants[arm].build}:{})};
 const x=S.encounter(10,build,seed,kind,opts,undefined,undefined,family,1,groupSize);
 assert.equal(x.level,10);assert.equal(x.pointsSpent,30);assert.deepEqual(Array.from(x.controlledTalentNodes),Array.from(p.t.nodes));assert.equal(x.armorType,armor);assert.equal(x.offhandType,p.offhandType);assert.equal(x.affinity,family);assert(x.won||x.died||x.timedOut);
 if(elite)assert.equal(x.eliteType,elite);if(kind==='boss')assert.equal(x.bossAffinity,family);if(groupSize)assert.equal(x.requestedGroupSize,groupSize);
 const m=x.affinityMetrics||{};
 return {seed,resolved:x.resolvedSeed,realm:family,gear:x.gearFingerprint,nonArmorGear:x.nonArmorGearFingerprint,roster:x.roster,roles:x.initialRoles,trait:x.traitId,condition:x.conditionId,bossMods:x.bossModifierIds,elite:x.eliteType,boss:x.bossId,won:x.won,died:x.died,timeout:x.timedOut,seconds:x.seconds,damage:x.damageDealt,taken:x.damageTaken,hpEnd:x.hpEnd,hpMax:x.hpMax,stats:x.heroBaseStats,healed:m.healingActual||0,barrier:m.barrierGenerated||0,absorbed:x.absorbed||0,def:m.defensiveAudit||{},activations:m.passiveActivations||{}};
}
function paired(b,r,arm){
 for(const k of ['seed','resolved','realm','gear','nonArmorGear','roster','roles','trait','condition','bossMods','elite','boss'])assert.deepEqual(r[k],b[k],arm+' changed '+k);
 const allowed=new Set(['power']);
 if(arm.includes('defense-')||arm==='no-iron-skin'||arm==='no-all-defensive-nodes')allowed.add('defense');
 if(arm==='no-hp-nodes'||arm==='no-strong-heart'||arm==='no-all-defensive-nodes')allowed.add('maxhp');
 if(arm==='no-barrier-power-nodes'||arm==='no-all-defensive-nodes')allowed.add('barrierPower');
 if(arm==='no-healing-power-nodes'||arm==='no-all-defensive-nodes')allowed.add('healingPower');
 if(arm==='no-guard-nodes'||arm==='no-guarded-block'||arm==='no-all-defensive-nodes'){allowed.add('blockChance');allowed.add('blockReduction');}
 for(const k of Object.keys(b.stats))if(!allowed.has(k))assert.equal(r.stats[k],b.stats[k],arm+' changed '+k);
 if(arm==='no-barrier-power-nodes'||arm==='no-all-defensive-nodes')assert.equal(r.stats.barrierPower,0);
 if(arm==='no-healing-power-nodes'||arm==='no-all-defensive-nodes')assert.equal(r.stats.healingPower,0);
}
function trial(id,armor,sc,i){
 const rows={};for(const arm of ARMS){rows[arm]=runCell(id,armor,sc,i,arm);if(arm!=='native')paired(rows.native,rows[arm],arm);}
 return {sc,i,rows};
}
function summarize(cases){
 const out={};for(const arm of ARMS){
 const rs=cases.map(c=>c.rows[arm]),n=rs.length,sum=(f)=>rs.reduce((s,r)=>s+(Number(f(r))||0),0),d=k=>sum(r=>r.def[k]);
 out[arm]={n,wins:sum(r=>r.won),winPct:100*sum(r=>r.won)/n,meanRating:sum(r=>r.stats.evasionRating)/n,meanAgi:sum(r=>r.stats.agi)/n,meanDefense:sum(r=>r.stats.defense)/n,meanHP:sum(r=>r.stats.maxhp)/n,meanBarrierPower:sum(r=>r.stats.barrierPower)/n,meanHealingPower:sum(r=>r.stats.healingPower)/n,meanGuard:sum(r=>r.stats.blockChance)/n,healing:sum(r=>r.healed),barrierGenerated:sum(r=>r.barrier),absorbed:sum(r=>r.absorbed),healedPerSecond:sum(r=>r.healed)/Math.max(.01,sum(r=>r.seconds)),absorbedPerSecond:sum(r=>r.absorbed)/Math.max(.01,sum(r=>r.seconds)),physical:d('auditPhysicalAttacks'),dodges:d('dodges'),dodgePct:d('auditPhysicalAttacks')?100*d('dodges')/d('auditPhysicalAttacks'):0,dodgeDamage:d('auditDodgePrevented'),armorPrevented:d('armor'),shieldPrevented:d('shield'),damageTaken:sum(r=>r.taken),damageDealt:sum(r=>r.damage),seconds:sum(r=>r.seconds),timeouts:sum(r=>r.timeout),pairedGains:cases.filter(c=>!c.rows.native.won&&c.rows[arm].won).length,pairedLosses:cases.filter(c=>c.rows.native.won&&!c.rows[arm].won).length};
 }
 return out;
}
function talentSources(id){const p=G.profile(id),byId=new Map(T.NODES.map(n=>[n.id,n]));const keys=['pctArmor','pctLife','health','barrierPower','healingPower','healthRegen','guardChance','passiveId','effectId'];return p.t.nodes.map(id=>({id,...Object.fromEntries(keys.filter(k=>byId.get(id.replace(/_rank\d+$/,''))?.[k]).map(k=>[k,byId.get(id.replace(/_rank\d+$/,''))[k]]))})).filter(n=>Object.keys(n).length>1);}
function write(name,obj){fs.mkdirSync(OUT,{recursive:true});fs.writeFileSync(path.join(OUT,name),JSON.stringify(obj)+'\n');}
function smoke(){
 for(const v of Object.values(variants))for(const src of Object.values(v))new Function(src);new Function(observer);
 for(const {id,armor} of profiles()){
 const c=trial(id,armor,'normal-1',0),native=runCell(id,armor,'normal-1',0,'native',false);
 for(const k of ['stats','won','died','timeout','seconds','damage','taken','hpEnd','gear','roster'])assert.deepEqual(c.rows.native[k],native[k],'observer parity '+id+'/'+armor+'/'+k);
 console.log('DEFENSIVE_SOURCE_SMOKE='+JSON.stringify({id,armor,talents:talentSources(id),stats:Object.fromEntries(ARMS.map(a=>[a,c.rows[a].stats]))}));
 }
 console.log('DEFENSIVE_SOURCE_SMOKE_OK');
}
function run(id,armor){
 assert(IDS.includes(id)&&armors(id).includes(armor));const cases=[];
 for(const sc of SC)for(let i=0;i<N;i++)cases.push(trial(id,armor,sc,i));
 const grouped=Object.fromEntries(['all','normal',...SC].map(sc=>[sc,summarize(cases.filter(c=>sc==='all'||(sc==='normal'?c.sc.startsWith('normal'):c.sc===sc)))]));
 const obj={id,armor,source:S.sourceFingerprint().sha256,talents:talentSources(id),grouped,cases};
 write(id+'-'+armor+'.json',obj);
 console.log('DEFENSIVE_SOURCE_RESULT='+JSON.stringify({...obj,cases:undefined}));
}
function aggregate(){
 const profiles=[];let n=0;const sources=new Set();
 for(const id of IDS){
 const set=armors(id).map(a=>JSON.parse(fs.readFileSync(path.join(OUT,id+'-'+a+'.json'))));
 for(const x of set){
 assert.equal(x.cases.length,N*SC.length);assert.equal(new Set(x.cases.map(c=>c.sc+'/'+c.i)).size,N*SC.length);
 sources.add(x.source);n+=x.cases.length*ARMS.length;
 for(const c of x.cases)for(const arm of ARMS.slice(1))paired(c.rows.native,c.rows[arm],arm);
 for(let i=0;i<x.cases.length;i++)for(const k of ['seed','resolved','realm','nonArmorGear','roster','roles','trait','condition','bossMods','elite','boss'])assert.deepEqual(x.cases[i].rows.native[k],set[0].cases[i].rows.native[k],id+' cross armor '+k);
 profiles.push({...x,cases:undefined});
 console.log('DEFENSIVE_SOURCE_PROFILE='+JSON.stringify(profiles.at(-1)));
 }
 }
 assert.equal(sources.size,1);write('summary.json',{n,profiles});console.log('DEFENSIVE_SOURCE_OVERVIEW='+JSON.stringify({n,profiles:profiles.length,arms:ARMS}));
}
const [cmd,id,armor]=process.argv.slice(2);if(cmd==='smoke')smoke();else if(cmd==='run')run(id,armor);else if(cmd==='aggregate')aggregate();else throw Error('unknown command');
