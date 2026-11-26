'use strict';
// Stage 6 controlled tactical comparison, separate from natural progression.
// Fixed level/loadout/talent budget is a TEST FIXTURE, never an earned account.
const fs=require('node:fs'),path=require('node:path');
const S=require('./simulate-progression.cjs');
const A=require('./v013-agent-strategy.cjs');
const Bosses=['blood','decay','radiance','aegis','fury','arcane'];
const Elites=['gravecaller','oathbound_exarch','the_gilded','ashen_executioner'];
const Policies=['focus','mechanics','adaptive'];
const Seeds=[9761,9762];
const Builds=['blood-fury','blood-decay','arcane-storm'];
const flags=Object.fromEntries(process.argv.slice(2).filter(x=>x.startsWith('--'))
 .map(x=>x.slice(2).split('=')));
const level=Number(flags.level||5),risk=Number(flags.risk??1),
 rarity=flags.rarity||'Rare',points=Number(flags.points||24);
if(![1,5,10].includes(level)||![0,1,2].includes(risk)||
 !['Rare','Epic'].includes(rarity)||![24,36].includes(points))
 throw Error('Controlled scenario uses E1/E5/E10, risk 0–2, Rare/Epic, 24/36 talent points');
const optsBase={...S.DEFAULTS,mode:'bosses',points,rarity,
 lockScenarioStreams:true,tickLimit:4500};
const rows=[];
function runBoss(family,build,seed,policy){
 const opts={...optsBase,targetPolicy:policy};
 const result=S.encounter(level,build,seed,'boss',opts,
  undefined,undefined,family,risk);
 return {test:'boss',family,build:build.id,seed,policy,
  loadoutFingerprint:result.gearFingerprint,scenarioSeed:result.resolvedSeed,
  ...result};
}
function runElite(type,build,seed,policy){
 const opts={...optsBase,targetPolicy:policy};
 const {a,c,card,resolvedSeed}=S.prepare(level,build,seed,opts,0);
 const candidate=card.edges.filter(([from])=>from===0).map(([,to])=>to)
  .find(i=>card.nodes[i].kind==='combat');
 if(candidate===undefined||!c.visitRoom(candidate)||!a.enter())
  throw Error('Controlled Elite fixture could not enter real native room');
 // Deliberately select the named Elite archetype for controlled coverage.
 // The following actor is made by the unchanged native enemy/skill system.
 const r=a.state().run;r.eliteType=type;
 const native=a.encounter({count:1,elite:true});
 if(native.encounterLeader?.eliteType!==type)
  throw Error('Requested Elite archetype was not used by native combat: '+type);
 const result=S.fight(a,c,opts.tickLimit,policy,true);
 return {test:'elite',eliteType:type,build:build.id,seed,policy,scenarioSeed:resolvedSeed,
  ...result};
}
const buildById=id=>S.BUILDS.find(b=>b.id===id);
for(const family of Bosses)for(const id of Builds)for(const seed of Seeds)for(const policy of Policies){
 try{rows.push(runBoss(family,buildById(id),seed,policy));}
 catch(e){rows.push({test:'boss',family,build:id,seed,policy,error:e.message});}
}
for(const type of Elites)for(const id of Builds)for(const seed of Seeds)for(const policy of Policies){
 try{rows.push(runElite(type,buildById(id),seed,policy));}
 catch(e){rows.push({test:'elite',eliteType:type,build:id,seed,policy,error:e.message});}
}
const pairs=new Map(),pairErrors=[];
for(const r of rows){
 const key=[r.test,r.family||r.eliteType,r.build,r.seed].join('/');
 if(!pairs.has(key))pairs.set(key,[]);
 pairs.get(key).push(r);
}
let goodPairs=0,failedPairs=0;
for(const [key,pair]of pairs){
 if(pair.length!==Policies.length){pairErrors.push('missing '+key);failedPairs++;continue;}
 const valid=pair.filter(r=>!r.error);
 if(valid.length!==Policies.length){failedPairs++;continue;}
 if(new Set(valid.map(r=>r.initialStateSha256)).size!==1){
  pairErrors.push('initial native state differed between target policies: '+key);failedPairs++;
 }else goodPairs++;
}
const round=x=>Math.round(x*100)/100;
function summarize(group){
 return Object.fromEntries(Policies.map(policy=>{
  const all=group.filter(x=>x.policy===policy),good=all.filter(r=>!r.error);
  const sum=k=>good.reduce((n,r)=>n+(Number(r[k])||0),0);
  return [policy,{fights:all.length,errors:all.length-good.length,
   wins:good.filter(r=>r.won).length,deaths:good.filter(r=>r.died).length,
   timeouts:good.filter(r=>r.timedOut).length,targetsChanged:sum('targetSwitches'),
   bossSummons:sum('bossSummons'),bossHealing:sum('bossHealing'),
   avgDamageTaken:good.length?round(sum('damageTaken')/good.length):null,
   avgSeconds:good.length?round(sum('seconds')/good.length):null}];
 }));
}
const bossRows=rows.filter(r=>r.test==='boss'),eliteRows=rows.filter(r=>r.test==='elite');
const report={
 fixture:'synthetic fixed E'+level+' '+rarity+' gear, native '+points+'-point valid talent graph, real native skill/combat execution',
 source:S.sourceFingerprint().sha256,
 limitation:'Controlled first-ring Boss/Elite substitution; no natural E1/E2 journey, XP/gear acquisition or 15-Realm route. Comparison isolates player target clicks only, not full strategy.',
 byBossAffinity:Object.fromEntries(Bosses.map(f=>[f,summarize(bossRows.filter(r=>r.family===f))])),
 byEliteType:Object.fromEntries(Elites.map(t=>[t,summarize(eliteRows.filter(r=>r.eliteType===t))])),
 bossSummary:summarize(bossRows),eliteSummary:summarize(eliteRows),
 replay:{level,rarity,points,builds:Builds,seeds:Seeds,policies:Policies,risk},
 pairs:{good:goodPairs,invalid:failedPairs,errors:pairErrors},
 rows
};
const file=path.resolve(process.argv.find(x=>x.endsWith('.json'))||'reports/stage6-target-controlled.json');
fs.mkdirSync(path.dirname(file),{recursive:true});
fs.writeFileSync(file,JSON.stringify(report,null,2)+'\n');
const md=['# Stage 6 — Controlled native tactical Boss / Elite comparison','',
 '**Fixture, not natural account progression**: E'+level+', '+rarity+' rolled equipment, valid native '+points+'-point graph, risk '+risk+'; same initial scenario across target policies.',
 '',report.limitation,'','Paired scenarios with identical initial native state: '+goodPairs+'; invalid comparisons: '+failedPairs+'.','',
 '| Encounter | Policy | Fights | Wins | Deaths | Timeouts | Errors |',
 '|---|---|---:|---:|---:|---:|---:|'];
for(const [type,groups]of [['Boss',report.byBossAffinity],['Elite',report.byEliteType]])for(const [label,values]of Object.entries(groups))
 for(const [policy,r]of Object.entries(values))md.push('| '+type+' '+label+' | '+policy+' | '+r.fights+' | '+r.wins+' | '+r.deaths+' | '+r.timeouts+' | '+r.errors+' |');
md.push('','No AI/damage changes are made to the actual Wanderer game. Script records errors and comparisons with mismatched initial states.','');
fs.writeFileSync(file.replace(/\.json$/,'.md'),md.join('\n'));
console.log('STAGE6_CONTROLLED='+JSON.stringify({
 pairs:report.pairs,boss:report.bossSummary,elite:report.eliteSummary,
 byBoss:Object.fromEntries(Object.entries(report.byBossAffinity).map(([k,v])=>[k,Object.fromEntries(
 Object.entries(v).map(([p,s])=>[p,{wins:s.wins,errors:s.errors,avgDamageTaken:s.avgDamageTaken}]))])),
 byElite:Object.fromEntries(Object.entries(report.byEliteType).map(([k,v])=>[k,Object.fromEntries(
 Object.entries(v).map(([p,s])=>[p,{wins:s.wins,errors:s.errors,avgDamageTaken:s.avgDamageTaken}]))]))
}));
if(rows.some(r=>r.error)||pairErrors.length)process.exitCode=1;
