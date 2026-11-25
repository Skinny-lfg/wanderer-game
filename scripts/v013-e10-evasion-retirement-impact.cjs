'use strict';
// Diagnostic VM overrides only. No production code is edited.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const S=require('./simulate-progression.cjs'),G=require('./v013-global-e10.cjs'),{T}=require('../tests/v013-current-talent-helper.cjs');
const IDS=['fury-daggers','fury-bow','fury-twohand','blood-daggers','decay-cycle-daggers'];
const EXTRA=[['decay-cycle-wand','Cloth'],['vitality-mace','Plate'],['aegis-mace','Plate'],['magic-fire-wand','Cloth']];
const ARMORS=['Cloth','Leather','Plate'],SC=['normal-1','normal-4','normal-8','normal-12','elite','boss'];
const F=['blood','decay','vitality','aegis','fury','magic'],ELITES=G.SC.filter(x=>x.kind==='elite').map(x=>x.elite);
const N=100,OUT=process.env.AUDIT_OUT||'reports/e10-evasion-retirement-impact';
const gear=fs.readFileSync('combat/v012-gear-stats.js','utf8'),runtime=fs.readFileSync('combat/v012-combat-runtime.js','utf8');
function rep(s,a,b){assert.equal(s.split(a).length,2,'missing or ambiguous source anchor: '+a);return s.replace(a,b);}
let observer=rep(runtime,"  const attackType=ports.enemyAttackType(e);","  const attackType=ports.enemyAttackType(e);\n  ports.phase6Metric(r,'auditEnemyAttacks',1);ports.phase6Metric(r,attackType==='physical'?'auditPhysicalAttacks':'auditNonPhysicalAttacks',1);ports.phase6Metric(r,'auditPreAvoidDamage',raw);");
observer=rep(observer,"   ports.phase6Metric(r,'dodges',1);","   ports.phase6Metric(r,'dodges',1);ports.phase6Metric(r,'auditDodgePrevented',raw);");
function runCell(id,armor,sc,i,arm,observe=true){
 const p=G.profile(id),kind=sc.startsWith('normal')?'normal':sc,groupSize=kind==='normal'?Number(sc.split('-')[1]):undefined;
 const family=F[i%F.length],elite=kind==='elite'?ELITES[i%ELITES.length]:undefined,seed=65901001+i*101;
 const build={id:p.id,weapon:p.weapon,families:p.families,skills:[],...(p.element?{element:p.element}:{})};
 const opts={mode:'encounter',points:30,gear:'current',rarity:'Rare',runes:false,contracts:'none',targetPolicy:'mechanics',measure:true,tickLimit:6500,lockScenarioStreams:true,controlledTalents:p.t,armorType:p.armorType,offhandType:p.offhandType,...(armor!==p.armorType?{stageE10ArmorVariant:armor}:{}),...(elite?{stage619EliteType:elite}:{}),...(observe?{stageArmorRuntimeSource:observer}:{}),...(arm==='no-talent-rating'?{stage648c2cGearStatsSource:noTalentGear}:{})};
 const x=S.encounter(10,build,seed,kind,opts,undefined,undefined,family,1,groupSize);
 assert.equal(x.level,10);assert.equal(x.pointsSpent,30);assert.deepEqual(Array.from(x.controlledTalentNodes),Array.from(p.t.nodes));assert.equal(x.armorType,armor);assert.equal(x.offhandType,p.offhandType);assert.equal(x.affinity,family);assert(x.won||x.died||x.timedOut);
 if(elite)assert.equal(x.eliteType,elite);if(kind==='boss')assert.equal(x.bossAffinity,family);if(groupSize)assert.equal(x.requestedGroupSize,groupSize);
 const m=x.affinityMetrics||{};
 return {seed,resolved:x.resolvedSeed,realm:family,gear:x.gearFingerprint,nonArmorGear:x.nonArmorGearFingerprint,roster:x.roster,roles:x.initialRoles,trait:x.traitId,condition:x.conditionId,bossMods:x.bossModifierIds,elite:x.eliteType,boss:x.bossId,won:x.won,died:x.died,timeout:x.timedOut,seconds:x.seconds,damage:x.damageDealt,taken:x.damageTaken,hpEnd:x.hpEnd,hpMax:x.hpMax,mpEnd:x.mpEnd,mpMax:x.mpMax,manaSpent:m.manaSpent||0,healing:m.healingActual||0,absorbed:x.absorbed||0,stats:x.heroBaseStats,def:m.defensiveAudit||{},activations:m.passiveActivations||{}};
}

const BASE='2246a9c791d48e4753071465bb8afcc2099f2ea2',AFTER='8381b97eb0c47e319187b343b2a9591ead90438f';
const REPLACEMENTS={outer_fury_1_2:['pctAttack',.02],weapon_path_fan_of_blades_1:['pctAttack',.03],focus_branch_fury_0_2:['pctSpeed',.015],focus_bridge_fury_0_2:['pctSpeed',.015],focus_branch_fury_0_3:['sunderDamage',.03],focus_bridge_fury_0_3:['sunderDamage',.03],basic_path_decay_1_1:['pctMana',.02],basic_path_decay_1_3:['pctRegen',.02],basic_detour_decay_1:['pctRegen',.02]};
const ARMS=['native','no-talent-rating','after'];
const beforeTalent=" if(state?.automaticTalents?.nodes?.length&&root.WandererAutomaticTalents)root.WandererAutomaticTalents.apply(s,state.automaticTalents);";
const noTalentGear=rep(gear,beforeTalent,' const auditRating=s.evasionRating;\n'+beforeTalent+'\n s.evasionRating=auditRating;');
const profiles=()=>[...IDS.flatMap(id=>ARMORS.map(armor=>[id,armor])),...EXTRA];
function write(name,obj){fs.mkdirSync(OUT,{recursive:true});fs.writeFileSync(path.join(OUT,name),JSON.stringify(obj)+'\n');}
function read(name){return JSON.parse(fs.readFileSync(path.join(OUT,name),'utf8'));}
function checkVersion(side){
 const expected=Object.entries(REPLACEMENTS);
 const found=T.NODES.filter(n=>n.flatAvoid);
 assert.equal(T.NODES.length,420);
 if(side==='before'){assert.equal(found.length,9);assert.deepEqual(found.map(n=>n.id).sort(),expected.map(([id])=>id).sort());}
 else{assert.equal(found.length,0);for(const [id,[key,val]] of expected)assert.equal(T.NODES.find(n=>n.id===id)[key],val,id);}
 new Function(observer);new Function(noTalentGear);
}
function run(id,armor,side,n){
 assert(profiles().some(([a,b])=>a===id&&b===armor));assert(['before','after'].includes(side));assert(Number.isInteger(n)&&n>=1&&n<=N);checkVersion(side);
 const p=G.profile(id),nodes=Array.from(p.t.nodes),selected=nodes.filter(n=>Object.hasOwn(REPLACEMENTS,n));
 const cases=[];for(const sc of SC)for(let i=0;i<n;i++){
  const rows={};for(const arm of side==='before'?ARMS.slice(0,2):['after'])rows[arm]=runCell(id,armor,sc,i,arm);
  if(i===0&&sc==='normal-1'){const unobserved=runCell(id,armor,sc,i,side==='before'?'native':'after',false),observed=rows[side==='before'?'native':'after'];for(const k of ['stats','won','died','timeout','seconds','damage','taken','hpEnd','gear','roster'])assert.deepEqual(observed[k],unobserved[k],side+' observer parity '+id+'/'+armor+'/'+k);}
  cases.push({sc,i,rows});
 }
 write(id+'-'+armor+'-'+side+'.json',{id,armor,n,side,source:S.sourceFingerprint().sha256,nodes,selected,cases});
 console.log('EVASION_IMPACT_SHARD='+JSON.stringify({id,armor,side,n:cases.length,selected}));
}
const sameFields=['seed','resolved','realm','gear','nonArmorGear','roster','roles','trait','condition','bossMods','elite','boss'];
function pairCase(b,a,selected){
 assert.equal(b.sc,a.sc);assert.equal(b.i,a.i);
 const rows={...b.rows,...a.rows},native=rows.native,neutral=rows['no-talent-rating'],after=rows.after;
 for(const r of [neutral,after])for(const k of sameFields)assert.deepEqual(r[k],native[k],'pair drift '+k);
 for(const k of Object.keys(native.stats))if(!['evasionRating','power'].includes(k))assert.equal(neutral.stats[k],native.stats[k],'ablation drift '+k);
 const changed=new Set(selected.map(id=>REPLACEMENTS[id][0])),allowed=new Set(['power','evasionRating']);
 for(const [key,stat] of [['pctAttack','attack'],['pctSpeed','attacksPerSec'],['pctMana','mana'],['pctRegen','manaRegen']])if(changed.has(key))allowed.add(stat);
 for(const k of Object.keys(native.stats))if(!allowed.has(k))assert.equal(after.stats[k],native.stats[k],'unexpected stat change '+k);
 assert.equal(after.stats.evasionRating,neutral.stats.evasionRating,'equipment evasion changed');
 if(!selected.length)for(const k of ['won','died','timeout','seconds','damage','taken','hpEnd','mpEnd','stats','def'])assert.deepEqual(after[k],native[k],'unaffected control drift '+k);
 return {sc:b.sc,i:b.i,rows};
}
function summarize(cases){
 const out={};for(const arm of ARMS){
 const rs=cases.map(c=>c.rows[arm]),n=rs.length,sum=f=>rs.reduce((s,r)=>s+(Number(f(r))||0),0),d=k=>sum(r=>r.def[k]),sec=sum(r=>r.seconds),wins=sum(r=>r.won);
 out[arm]={n,wins,winPct:100*wins/n,rating:sum(r=>r.stats.evasionRating)/n,attack:sum(r=>r.stats.attack)/n,speed:sum(r=>r.stats.attacksPerSec)/n,mana:sum(r=>r.stats.mana)/n,regen:sum(r=>r.stats.manaRegen)/n,defense:sum(r=>r.stats.defense)/n,dodgePct:d('auditPhysicalAttacks')?100*d('dodges')/d('auditPhysicalAttacks'):0,dps:sec?sum(r=>r.damage)/sec:0,takenPerSecond:sec?sum(r=>r.taken)/sec:0,meanSeconds:sec/n,healingPerSecond:sec?sum(r=>r.healing)/sec:0,absorbedPerSecond:sec?sum(r=>r.absorbed)/sec:0,manaSpentPerSecond:sec?sum(r=>r.manaSpent)/sec:0,hpEndPct:sum(r=>r.hpMax?100*r.hpEnd/r.hpMax:0)/n,timeouts:sum(r=>r.timeout),pairedGains:cases.filter(c=>!c.rows.native.won&&c.rows[arm].won).length,pairedLosses:cases.filter(c=>c.rows.native.won&&!c.rows[arm].won).length};
 }
 return out;
}
function pair(id,armor,n){
 const prefix=id+'-'+armor,b=read(prefix+'-before.json'),a=read(prefix+'-after.json');
 assert.equal(b.n,n);assert.equal(a.n,n);assert.equal(a.cases.length,n*SC.length);assert.equal(b.cases.length,a.cases.length);
 assert.deepEqual(a.nodes,b.nodes,'talent allocation changed');assert.deepEqual(a.selected,b.selected);
 const cases=b.cases.map((c,i)=>pairCase(c,a.cases[i],b.selected));
 assert.equal(new Set(cases.map(c=>c.sc+'/'+c.i)).size,n*SC.length);
 const grouped=Object.fromEntries(['all','normal',...SC].map(sc=>[sc,summarize(cases.filter(c=>sc==='all'||(sc==='normal'?c.sc.startsWith('normal'):c.sc===sc)))]));
 const obj={id,armor,n,baseline:BASE,afterCommit:AFTER,sources:[b.source,a.source],nodes:b.nodes,selected:b.selected,grouped,cases};write(prefix+'-paired.json',obj);
 console.log('EVASION_IMPACT_PROFILE='+JSON.stringify({...obj,cases:undefined,nodes:undefined}));
}
function aggregate(){
 const all=profiles().map(([id,armor])=>{const x=read(id+'-'+armor+'-paired.json');assert.equal(x.id,id);assert.equal(x.armor,armor);assert.equal(x.n,N);assert.equal(x.baseline,BASE);assert.equal(x.afterCommit,AFTER);assert.equal(x.cases.length,N*SC.length);return x;});
 assert.equal(new Set(all.map(x=>x.sources.join('/'))).size,1);
 for(const x of all){const b=all.find(y=>y.id===x.id);for(let i=0;i<x.cases.length;i++)for(const k of sameFields.filter(k=>k!=='gear'))assert.deepEqual(x.cases[i].rows.native[k],b.cases[i].rows.native[k],x.id+' cross armor '+k);}
 const result={n:all.reduce((s,x)=>s+x.cases.length*ARMS.length,0),pairedCases:all.reduce((s,x)=>s+x.cases.length,0),baseline:BASE,afterCommit:AFTER,profiles:all.map(({cases,...x})=>x)};
 write('summary.json',result);for(const x of result.profiles)console.log('EVASION_IMPACT_PROFILE='+JSON.stringify({...x,nodes:undefined}));console.log('EVASION_IMPACT_OVERVIEW='+JSON.stringify({n:result.n,pairedCases:result.pairedCases,profiles:all.length,arms:ARMS}));
}
const [cmd,id,armor,side,arg]=process.argv.slice(2);
if(cmd==='run')run(id,armor,side,Number(arg||N));else if(cmd==='pair')pair(id,armor,Number(side||N));else if(cmd==='aggregate')aggregate();else if(cmd==='profiles')console.log(JSON.stringify(profiles()));else throw Error('unknown command');
