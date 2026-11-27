'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const S=require('./simulate-progression.cjs'),G=require('./v013-global-e10.cjs'),{T}=require('../tests/v013-current-talent-helper.cjs');
const BASE='ab4db00cfc1e55b83389e6dc9a4494b8b17e7bcc',OUT='reports/b32d6',LEVELS=[3,10],COUNTS=[8,12],SEED=108100001;
const IDS=['blood-sword','fury-daggers','fury-bow','decay-cycle-daggers','decay-cycle-wand','radiance-mace','aegis-orb','arcane-arcane-wand','arcane-fire-staff','arcane-frost-wand','arcane-lightning-staff','hybrid-decay-blood'];
const HANDS=[['Sword/Shield','Sword','Shield'],['Mace/Shield','Mace','Shield'],['Daggers/Dagger','Daggers','Off-Hand Dagger'],['Two-Handed','Two-Handed',null],['Bow','Bow',null],['Wand/Tome','Wand','Tome'],['Wand/Orb','Wand','Orb'],['Wand/Charm','Wand','Charm'],['Staff','Staff',null]];
const FAMILIES=['blood','decay','radiance','aegis','fury','arcane'];
const SC=[...[1,4,12,22].map(size=>({id:'normal-'+size,kind:'normal',size})),{id:'elite-tank',kind:'elite',elite:'tank'},{id:'elite-caster',kind:'elite',elite:'caster'},{id:'boss-blood',kind:'boss',family:'blood'},{id:'boss-arcane',kind:'boss',family:'arcane'}];
const mean=(a,f)=>a.length?a.reduce((s,x)=>s+f(x),0)/a.length:null,sum=(a,f)=>a.reduce((s,x)=>s+f(x),0),num=x=>Number(x)||0,hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
const strip=it=>{if(!it)return null;const {id,...rest}=it;return rest;};
function profile(pi,li){
 const p=G.profile(IDS[pi]),level=LEVELS[li],points=li?30:6;
 const t=li?p.t:{...p.t,xp:points*T.POINT_XP,nodes:p.t.nodes.slice(0,points),prepared:null};
 assert(T.valid(t),p.id+' E'+level+' illegal talents');assert.equal(T.earned(t),points);assert.equal(t.nodes.length,points);
 const intended=HANDS.find(h=>h[1]===p.weapon&&h[2]===p.offhandType);assert(intended,p.id+' missing package');
 return {...p,level,points,t,intended:intended[0],rarity:li?'Rare':'Uncommon'};
}
function cell(p,h,sc,i){
 const [id,weapon,offhand]=h,seed=SEED+p.level*100003+i*131,family=sc.family||FAMILIES[i%FAMILIES.length];
 const build={id:p.id,weapon:p.weapon,families:p.families,skills:[],...(p.t.element?{element:p.t.element}:{})};
 const opts={mode:'encounter',points:p.points,gear:'current',rarity:p.rarity,runes:false,contracts:'none',targetPolicy:'mechanics',measure:true,tickLimit:13000,lockScenarioStreams:true,controlledTalents:p.t,armorType:p.armorType,offhandType:offhand,stageB31ALoadout:weapon,stageB31EquipmentAudit:true,stageB32D6UtilityAudit:true,...(sc.elite?{stage619EliteType:sc.elite}:{})};
 const x=S.encounter(p.level,build,seed,sc.kind,opts,undefined,undefined,family,1,sc.size);
 assert.equal(x.level,p.level);assert.equal(x.pointsSpent,p.points);assert.deepEqual(x.controlledTalentNodes,p.t.nodes);
 assert.equal(x.affinity,family);assert.equal(x.weaponType,weapon);assert.equal(x.offhandType,offhand);assert.equal(x.armorType,p.armorType);
 assert.equal(Number(x.won)+Number(x.died)+Number(x.timedOut),1);
 if(sc.elite)assert.equal(x.eliteType,sc.elite);if(sc.family)assert.equal(x.bossAffinity,sc.family);if(sc.size)assert.equal(x.requestedGroupSize,sc.size);
 const eq=x.equipmentAudit,u=x.weaponUtilityAudit,m=x.affinityMetrics||{};assert(eq&&u&&Number.isFinite(u.score));
 const nonhands=hash(Object.keys(eq).sort().filter(k=>!['weapon','offhand'].includes(k)).map(k=>[k,strip(eq[k])]));
 const handHash=hash([strip(eq.weapon),strip(eq.offhand)]);
 const scenarioHash=hash([x.resolvedSeed,x.affinity,x.risk,x.roster,x.initialRoles,x.traitId,x.conditionId,x.conditionMarked,x.bossModifierIds,x.eliteType,x.bossId]);
 return {package:id,weapon,offhand,scenario:sc.id,kind:sc.kind,trial:i,seed,nonhands,handHash,scenarioHash,utility:u.score,utilityWithoutPreference:u.withoutPreference,features:u.features,weaponBudget:u.weaponBudget,offhandBudget:u.offhandBudget,won:x.won,died:x.died,timeout:x.timedOut,seconds:x.seconds,hpEnd:x.hpEnd,hpMax:x.hpMax,mpEnd:x.mpEnd,mpMax:x.mpMax,damage:x.damageDealt,secondary:x.secondaryTargetDamage,dot:m.dotDamageActual,taken:x.damageTaken,absorbed:x.absorbed,healed:m.healingActual,barrier:m.barrierGenerated,paid:x.manaSpent,funded:x.fundedCasts,unfunded:x.unfundedCasterAttacks,starved:m.manaStarvedSeconds,infusion:x.infusionDamage,firstKill:x.firstKillSeconds,stats:x.heroBaseStats,activations:m.passiveActivations||{},magic:x.magicAdaptiveMetrics,decay:x.decayTalentMetrics,offhandProcs:m.offhandProcs||{},weaponStatus:x.weaponStatusMetrics};
}
function checkPairs(rows){
 const groups=new Map();
 for(const r of rows){const key=r.scenario+'/'+r.trial;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(r);}
 for(const [key,rs] of groups){assert.equal(rs.length,HANDS.length,key+' missing hands');assert.equal(new Set(rs.map(r=>r.package)).size,HANDS.length);assert.equal(new Set(rs.map(r=>r.nonhands)).size,1,key+' nonhand drift');assert.equal(new Set(rs.map(r=>r.scenarioHash)).size,1,key+' encounter drift');}
 return groups;
}
function write(name,x){fs.mkdirSync(OUT,{recursive:true});fs.writeFileSync(OUT+'/'+name+'.json',JSON.stringify(x));}
function run(pi,li){
 const p=profile(pi,li),rows=[];
 for(const sc of SC)for(let i=0;i<COUNTS[li];i++)for(const h of HANDS)rows.push(cell(p,h,sc,i));
 const pairs=checkPairs(rows);
 write('study-'+pi+'-'+li,{pi,li,id:p.id,level:p.level,intended:p.intended,nodes:p.t.nodes,element:p.t.element||'arcane',armor:p.armorType,commit:process.env.GITHUB_SHA,native:S.sourceFingerprint().sha256,rows});
 console.log('B32D6_SHARD='+JSON.stringify({id:p.id,level:p.level,fights:rows.length,matched:pairs.size,timeouts:rows.filter(r=>r.timeout).length}));
}
function summarize(rows){
 const won=rows.filter(r=>r.won),mana=rows.filter(r=>r.mpMax>0),attempts=sum(rows,r=>num(r.funded)+num(r.unfunded));
 const acts={};for(const r of rows)for(const [k,v] of Object.entries(r.activations))acts[k]=(acts[k]||0)+num(v);
 return {n:rows.length,wins:won.length,winPct:100*won.length/rows.length,timeouts:rows.filter(r=>r.timeout).length,utility:mean(rows,r=>r.utility),utilityWithoutPreference:mean(rows,r=>r.utilityWithoutPreference),proxySingle:mean(rows,r=>r.features.single),proxyGroup:mean(rows,r=>r.features.group),proxyFunded:mean(rows,r=>r.features.funded),proxyNormalDurability:mean(rows,r=>r.features.normalDurability),proxyBossDurability:mean(rows,r=>r.features.bossDurability),
 meanWinSeconds:mean(won,r=>r.seconds),meanDps:mean(rows,r=>r.seconds?r.damage/r.seconds:0),secondaryDps:mean(rows,r=>r.seconds?num(r.secondary)/r.seconds:0),dotDps:mean(rows,r=>r.seconds?num(r.dot)/r.seconds:0),infusionDps:mean(rows,r=>r.seconds?num(r.infusion)/r.seconds:0),hpEndPct:mean(rows,r=>100*r.hpEnd/Math.max(1,r.hpMax)),manaEndPct:mean(mana,r=>100*r.mpEnd/r.mpMax),fundedFraction:attempts?sum(rows,r=>num(r.funded))/attempts:null,unfunded:mean(rows,r=>num(r.unfunded)),starvedSeconds:mean(rows,r=>num(r.starved)),manaSpent:mean(rows,r=>num(r.paid)),healed:mean(rows,r=>num(r.healed)),absorbed:mean(rows,r=>num(r.absorbed)),barrier:mean(rows,r=>num(r.barrier)),firstKillSeconds:mean(rows.filter(r=>r.firstKill!=null),r=>r.firstKill),attack:mean(rows,r=>num(r.stats.attack)),spellPower:mean(rows,r=>num(r.stats.spellPower)),attackSpeed:mean(rows,r=>num(r.stats.attacksPerSec)),mana:mean(rows,r=>num(r.stats.mana)),manaRegen:mean(rows,r=>num(r.stats.manaRegen)),weaponBudget:mean(rows,r=>num(r.weaponBudget)),offhandBudget:mean(rows,r=>num(r.offhandBudget)),activations:acts};
}
function paired(groups,a,b,kind=null){
 const pairs=[...groups.values()].filter(rs=>!kind||rs[0].kind===kind).map(rs=>[rs.find(r=>r.package===a),rs.find(r=>r.package===b)]);
 let aOnly=0,bOnly=0,utilityAgrees=0,utilityDisagrees=0,utilityTies=0,bothWin=0,unresolved=0;const utilityDelta=[],ttkDelta=[];
 for(const [x,y] of pairs){assert(x&&y);utilityDelta.push(x.utility-y.utility);
 if(x.timeout||y.timeout){unresolved++;continue;}if(x.won&&y.won){bothWin++;ttkDelta.push(x.seconds-y.seconds);}if(x.won===y.won)continue;
 if(x.won)aOnly++;else bOnly++;const d=x.utility-y.utility;if(Math.abs(d)<1e-8)utilityTies++;else if((d>0)===x.won)utilityAgrees++;else utilityDisagrees++;}
 return {n:pairs.length,aOnly,bOnly,winDelta:aOnly-bOnly,bothWin,unresolved,meanUtilityDelta:mean(utilityDelta,x=>x),pairedWinTimeDelta:mean(ttkDelta,x=>x),utilityAgrees,utilityDisagrees,utilityTies};
}
function aggregate(){
 const xs=IDS.flatMap((id,pi)=>LEVELS.map((level,li)=>JSON.parse(fs.readFileSync(OUT+'/study-'+pi+'-'+li+'.json','utf8'))));assert.equal(new Set(xs.map(x=>x.native)).size,1);
 const results=[];
 for(const x of xs){assert.equal(x.commit,process.env.GITHUB_SHA);assert.equal(x.rows.length,SC.length*COUNTS[x.li]*HANDS.length);const groups=checkPairs(x.rows);
 const packages=HANDS.map(h=>{const rs=x.rows.filter(r=>r.package===h[0]);return {package:h[0],...summarize(rs),byScenario:Object.fromEntries(SC.map(sc=>[sc.id,summarize(rs.filter(r=>r.scenario===sc.id))]))};});
 const utilityTop=[...packages].sort((a,b)=>b.utility-a.utility)[0].package,bestWins=Math.max(...packages.map(p=>p.wins)),nativeTop=packages.filter(p=>p.wins===bestWins).map(p=>p.package);
 const topCounts={};for(const rs of groups.values()){const top=[...rs].sort((a,b)=>b.utility-a.utility)[0].package;topCounts[top]=(topCounts[top]||0)+1;}
 const pairwise=[];for(let i=0;i<HANDS.length;i++)for(let j=i+1;j<HANDS.length;j++){const a=HANDS[i][0],b=HANDS[j][0];pairwise.push({a,b,...paired(groups,a,b)});}
 const twohandVsIntended=x.intended==='Two-Handed'?null:Object.fromEntries([null,'normal','elite','boss'].map(k=>[k||'all',paired(groups,'Two-Handed',x.intended,k)]));
 results.push({id:x.id,level:x.level,armor:x.armor,nodes:x.nodes,element:x.element,intended:x.intended,utilityTop,nativeTop,topCounts,matchedGroups:groups.size,packages,pairwise,twohandVsIntended});
 console.log('B32D6_PROFILE='+JSON.stringify({id:x.id,level:x.level,intended:x.intended,utilityTop,nativeTop,topCounts,twohandVsIntended,packages:packages.map(({package:pkg,winPct,utility,meanWinSeconds,meanDps,secondaryDps,dotDps,proxyFunded,fundedFraction})=>({package:pkg,winPct,utility,meanWinSeconds,meanDps,secondaryDps,dotDps,proxyFunded,fundedFraction}))}));}
 const levels=LEVELS.map(level=>{const rs=results.filter(x=>x.level===level);return {level,profiles:rs.length,utilityTopTwoHand:rs.filter(x=>x.utilityTop==='Two-Handed').length,nativeTopIncludesTwoHand:rs.filter(x=>x.nativeTop.includes('Two-Handed')).length,nativeSoleTopTwoHand:rs.filter(x=>x.nativeTop.length===1&&x.nativeTop[0]==='Two-Handed').length,utilityTopIsNativeTop:rs.filter(x=>x.nativeTop.includes(x.utilityTop)).length,utilityTopIntended:rs.filter(x=>x.utilityTop===x.intended).length,nativeTopIncludesIntended:rs.filter(x=>x.nativeTop.includes(x.intended)).length,twohandVsIntended:{aOnly:sum(rs,x=>x.twohandVsIntended?.all.aOnly||0),bOnly:sum(rs,x=>x.twohandVsIntended?.all.bOnly||0),utilityAgrees:sum(rs,x=>x.twohandVsIntended?.all.utilityAgrees||0),utilityDisagrees:sum(rs,x=>x.twohandVsIntended?.all.utilityDisagrees||0)}};});
 const all=xs.flatMap(x=>x.rows),report={baseline:BASE,commit:process.env.GITHUB_SHA,native:xs[0].native,profiles:IDS.length,scenarios:SC,packages:HANDS,cohorts:COUNTS,fights:all.length,timeouts:all.filter(r=>r.timeout).length,matchedGroups:sum(results,x=>x.matchedGroups),levels,results,scope:'Controlled synthetic E3/E10 native encounters. Same nonhand gear and talents within profile/seed; different native hand packages, not equal realized affixes or numeric budget. Equal scenario weights descriptive; not natural win-rate calibration. Fixed intended main weapon, not natural multi-weapon preferences. Eight/twelve seeds per scenario are exploratory.'};
 assert.equal(all.length,17280);write('summary',report);console.log('B32D6_OVERVIEW='+JSON.stringify({...report,results:undefined}));if(report.timeouts)process.exitCode=1;
}
function smoke(){
 assert.equal(execFileSync('git',['diff','--name-only',BASE,'HEAD','--','combat','online','economy','index.html','docs','scripts/v013-b32c-equipment-policy.cjs','scripts/v013-natural-progression.cjs','scripts/v013-b32d5-forge-ev.cjs'],{encoding:'utf8'}).trim(),'','Native or policy drift');
 for(let pi=0;pi<IDS.length;pi++)for(let li=0;li<LEVELS.length;li++){const p=profile(pi,li);checkPairs(HANDS.map(h=>cell(p,h,SC[0],0)));}
 const p=profile(7,1);checkPairs(HANDS.map(h=>cell(p,h,SC.at(-1),0)));
 console.log('B32D6_SMOKE='+JSON.stringify({profiles:IDS.length,levels:LEVELS,packages:HANDS.length,paired:true,nativeDrift:false}));
}
const [cmd,pi,li]=process.argv.slice(2);if(cmd==='smoke')smoke();else if(cmd==='study')run(Number(pi),Number(li));else if(cmd==='aggregate')aggregate();else throw Error('Unknown command');
