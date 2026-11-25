'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),G=require('./v013-global-e10.cjs'),H=require('./v013-survival-e10.cjs'),S=require('./simulate-progression.cjs');
const LEVEL=10,POINTS=30,N=50,FAMILIES=['blood','decay','vitality','aegis','fury','magic'];
const LEATHER=['blood-daggers','fury-daggers','fury-bow','decay-cycle-daggers','decay-cycle-bow','decay-focus-daggers','decay-focus-bow'];
const MAGIC=G.IDS.filter(id=>id.startsWith('magic-')||/^decay-(cycle|focus)-(wand|staff|sword)$/.test(id));
const IDS=[...LEATHER,...MAGIC],SC=H.SC;
const CLOTH={A:[.25,.25,1.5],B:[.4,.4,2],C:[.6,.5,2.5]},MANA={A:[1,.15,6],B:[.5,.1,9]};
const COST={arcane:[9,13,10,0],frost:[10,15,12,8],fire:[13,18,18,12],lightning:[14,20,20,14]};
const gear=fs.readFileSync('combat/v012-gear-stats.js','utf8'),core=fs.readFileSync('combat/v012-combat-core.js','utf8'),runtime=fs.readFileSync('combat/v012-combat-runtime.js','utf8');
function replace(s,a,b){assert.equal(s.split(a).length,2,'source anchor '+a);return s.replace(a,b);}
function gearSource(arm){
 let s=gear;
 if(arm.evasion)s=replace(s,'return Number.isFinite(value)&&value>0?value:0;','return Number.isFinite(value)&&value>0?value*'+arm.evasion+':0;');
 if(arm.cloth||arm.mana){
  const [sp,pool,mult]=CLOTH[arm.cloth]||[0,0,1], [base,int,cap]=MANA[arm.mana]||[1.5,.23,3];
  s=replace(s,' const gearBonus=key=>',' const clothFraction=Object.values(equipped).filter(item=>item?.armorType==="Cloth"&&["helm","armor","gloves","boots","belt"].includes(item.slot)).length/5;\n const gearBonus=key=>');
  assert.equal(s.split('+(1.5+s.int*.23).toFixed(1)').length,3);s=s.replaceAll('+(1.5+s.int*.23).toFixed(1)','+('+base+'+s.int*'+int+').toFixed(1)');
  s=replace(s,"if(s.mana)s.manaRegen+=Math.min(3,Math.max(0,gearBonus('manaRegenBonus')));","if(s.mana)s.manaRegen+=Math.min("+cap+",Math.max(0,gearBonus('manaRegenBonus')))*(1+clothFraction*"+(mult-1)+");");
  s=replace(s,' if(magic)s.phase2Magic=true;',' if(s.mana){s.mana=Math.round(s.mana*(1+clothFraction*'+pool+'));s.spellPower=Math.round(s.spellPower*(1+clothFraction*'+sp+'));}\n if(magic)s.phase2Magic=true;');
 }
 return s;
}
function runtimeSource(){
 let s=runtime;
 const helper='function stageElementCost(b,kind,base){const mode=WandererV012Buildcraft.magicMode(b),table='+JSON.stringify(COST)+';const row=table[mode];if(!row)return base;return row[{Wand:0,Staff:1,infusion:2,automatic:3}[kind]]??base;}\n';
 s=replace(s,'function v013FundedCost(baseCost,r=ports.state.run){',helper+'function v013FundedCost(baseCost,r=ports.state.run){');
 s=replace(s,"baseCost=kind==='Staff'?13:kind==='Wand'?9:0;","baseCost=stageElementCost(ports.phase1Build,kind,kind==='Staff'?13:kind==='Wand'?9:0);");
 // Non-caster weapons do not acquire a Mana cost from the table.
 s=replace(s,'WandererV012Buildcraft.nextCost(b,config.cost)','WandererV012Buildcraft.nextCost(b,stageElementCost(b,"infusion",config.cost))');
 s=replace(s,'WandererV012Buildcraft.nextCost(b,8),r);if(r.mp<cost)return;','WandererV012Buildcraft.nextCost(b,stageElementCost(b,"automatic",8)),r);if(r.mp<cost)return;');
 s=replace(s,"if(s.caster&&r.mp<v013FundedCost(s.main.subtype==='Staff'?13:9,r))","if(s.caster&&r.mp<v013FundedCost(ports.isPhase1Run()&&ports.phase1Build?.element?WandererV012Buildcraft.nextCost(ports.phase1Build,stageElementCost(ports.phase1Build,s.main.subtype,s.main.subtype==='Staff'?13:9)):stageElementCost(ports.phase1Build,s.main.subtype,s.main.subtype==='Staff'?13:9),r))");
 return s;
}
const cache=new Map();
function overrides(arm){const k=JSON.stringify([arm.evasion,arm.cloth,arm.mana,arm.cost]);if(!cache.has(k)){const o={};if(arm.evasion||arm.cloth||arm.mana)o.stage648c2cGearStatsSource=gearSource(arm);if(arm.evasion)o.stageArmorCoreSource=replace(core,'Math.min(EVASION_CAP,1/(1+scale/rating))','Math.min(.45,1/(1+scale/rating))');if(arm.cost)o.stageArmorRuntimeSource=runtimeSource();cache.set(k,o);}return cache.get(k);}
function arms(p){
 const base={id:'native',armor:LEATHER.includes(p.id)?'Leather':'Cloth',offhand:p.offhandType};
 const add=(id,extra)=>({...base,id,...extra});
 if(LEATHER.includes(p.id))return [base,add('plate-native',{armor:'Plate'}),...([2,3,4].map(evasion=>add('leather-x'+evasion,{evasion})))];
 const out=[base,add('plate-native',{armor:'Plate'}),...Object.keys(CLOTH).map(cloth=>add('cloth-'+cloth,{cloth})),...Object.keys(MANA).map(mana=>add('mana-'+mana,{mana}))];
 if(p.families.includes('magic'))out.push(add('cost-only',{cost:true}));
 out.push(add('pilot-cloth',{cloth:'B',mana:'A',cost:true}),add('pilot-plate',{armor:'Plate',cloth:'B',mana:'A',cost:true}));
 return out;
}

function nativeCell(p,sc,i,arm){
 const family=sc.family||FAMILIES[i%FAMILIES.length],seed=64823000+i*101;
 const build={id:p.id,weapon:p.weapon,families:p.families,skills:[],...(p.element?{element:p.element}:{})};
 const opts={...overrides(arm),...(arm.armor!==p.armorType?{stageE10ArmorVariant:arm.armor}:{}),mode:'encounter',points:POINTS,gear:'current',rarity:'Rare',runes:false,contracts:'none',targetPolicy:'mechanics',measure:true,tickLimit:6500,lockScenarioStreams:true,controlledTalents:p.t,armorType:p.armorType,offhandType:arm.offhand,...(sc.elite?{stage619EliteType:sc.elite}:{})};
 const x=S.encounter(LEVEL,build,seed,sc.kind,opts,undefined,undefined,family,1,sc.size);
 assert.equal(x.level,LEVEL);assert.equal(x.pointsSpent,POINTS);assert.deepEqual(x.controlledTalentNodes,p.t.nodes);assert.equal(x.affinity,family);assert.equal(x.offhandType,arm.offhand);assert.equal(x.armorType,arm.armor);assert(x.won||x.died||x.timedOut);
 if(sc.elite)assert.equal(x.eliteType,sc.elite);if(sc.family)assert.equal(x.bossAffinity,sc.family);if(sc.size)assert.equal(x.requestedGroupSize,sc.size);
 const m=x.affinityMetrics||{};
 return {id:p.id,sc:sc.id,kind:sc.kind,trial:i,seed,resolved:x.resolvedSeed,realm:family,gear:x.gearFingerprint,otherGear:x.otherGearFingerprint,nonArmorGear:x.nonArmorGearFingerprint,armor:x.armorType,offhand:x.offhandType,roster:x.roster,roles:x.initialRoles,trait:x.traitId,condition:x.conditionId,bossMods:x.bossModifierIds,elite:x.eliteType,boss:x.bossId,won:x.won,died:x.died,timeout:x.timedOut,seconds:x.seconds,damage:x.damageDealt,secondary:x.secondaryTargetDamage,taken:x.damageTaken,absorbed:x.absorbed,healed:m.healingActual||0,hpEnd:x.hpEnd,hpMax:x.hpMax,mpEnd:x.mpEnd,mpMax:x.mpMax,paid:m.manaSpent||0,unfunded:x.unfundedCasterAttacks,starved:m.manaStarvedSeconds||0,firstKill:x.firstKillSeconds??null,funded:x.fundedCasts,infusions:x.infusionActivations,mpStart:x.mpStart,orbBarrier:m.offhandOrbBarrier||0,charmHealing:m.offhandCharmHealing||0,tomeMana:m.offhandTomeMana||0,stats:x.heroBaseStats};
}

function paired(a,b,arm){
 for(const k of ['id','sc','kind','trial','seed','resolved','realm','roster','roles','trait','condition','bossMods','elite','boss'])assert.deepEqual(a[k],b[k],a.id+' '+arm.id+' '+k);
 assert.equal(a.offhand,b.offhand);
 if(a.armor===b.armor)assert.equal(a.gear,b.gear);else assert.equal(a.nonArmorGear,b.nonArmorGear);
 if(arm.evasion){for(const k of Object.keys(a.stats))if(k!=='evasionRating'&&k!=='power')assert.equal(a.stats[k],b.stats[k],k);assert(b.stats.evasionRating>=a.stats.evasionRating);}
 if(arm.cost&&!arm.cloth&&!arm.mana)assert.deepEqual(a.stats,b.stats);
}
function trial(p,sc,i){const rows={};for(const a of arms(p)){rows[a.id]=nativeCell(p,sc,i,a);if(a.id!=='native')paired(rows.native,rows[a.id],a);}return {sc:sc.id,i,rows};}
function avg(rows,f){return rows.length?rows.reduce((n,x)=>n+f(x),0)/rows.length:0;}
function summary(cases,arm){
 const rows=cases.map(x=>x.rows[arm]),base=G.summary(rows),wins=rows.filter(x=>x.won);
 return {...base,hp:avg(rows,r=>r.hpMax),mana:avg(rows,r=>r.mpMax),regen:avg(rows,r=>r.stats.manaRegen||0),evasion:avg(rows,r=>r.stats.evasionRating||0),funded:avg(rows,r=>r.funded||0),infusions:avg(rows,r=>r.infusions||0),unfunded:avg(rows,r=>r.unfunded||0),starved:avg(rows,r=>r.starved||0),winSeconds:avg(wins,r=>r.seconds),tomeMana:avg(rows,r=>r.tomeMana),orbBarrier:avg(rows,r=>r.orbBarrier),charmHealing:avg(rows,r=>r.charmHealing)};
}
function group(cases,ids){const groups={overall:cases,normal:cases.filter(x=>x.sc.startsWith('normal-')),elite:cases.filter(x=>x.sc.startsWith('elite-')),boss:cases.filter(x=>x.sc.startsWith('boss-')),...Object.fromEntries(SC.map(s=>[s.id,cases.filter(x=>x.sc===s.id)]))};return Object.fromEntries(Object.entries(groups).map(([k,v])=>[k,Object.fromEntries(ids.map(id=>[id,summary(v,id)]))]));}
const ROUTE_IDS=['magic-arcane-wand','magic-fire-wand','magic-lightning-wand','magic-frost-staff','magic-fire-sword','magic-lightning-staff','decay-cycle-wand','decay-focus-staff'];
function routeTrial(p,a,i){
 const build={id:p.id,weapon:p.weapon,families:p.families,skills:[],...(p.element?{element:p.element}:{})};
 const opts={...overrides(a),...(a.armor!==p.armorType?{stageE10ArmorVariant:a.armor}:{}),mode:'dungeon',points:POINTS,gear:'current',rarity:'Rare',runes:false,contracts:'none',targetPolicy:'mechanics',measure:false,tickLimit:6500,lockScenarioStreams:true,controlledTalents:p.t,armorType:p.armorType,offhandType:a.offhand};
 const x=S.dungeon(LEVEL,build,64823000+i*101,opts,1);
 return {i,gear:x.gearFingerprint,realm:x.affinity,route:x.route,error:x.error,won:x.won,bossReached:x.bossReached,timeout:x.timedOut,rooms:x.rooms.map(r=>({room:r.room,kind:r.kind,won:r.won,mpStart:r.mpStart,mpEnd:r.mpEnd,mpMax:r.mpMax,hpStart:r.hpStart,hpEnd:r.hpEnd,seconds:r.seconds,manaSpent:r.manaSpent,unfunded:r.unfundedCasterAttacks,funded:r.fundedCasts}))};
}
function routes(p){if(!ROUTE_IDS.includes(p.id))return null;const list=arms(p).filter(a=>['native','plate-native','pilot-cloth','pilot-plate'].includes(a.id));return Object.fromEntries(list.map(a=>[a.id,Array.from({length:20},(_,i)=>routeTrial(p,a,i))]));}
function routeSummary(routes){if(!routes)return null;return Object.fromEntries(Object.entries(routes).map(([id,rs])=>{const rooms=rs.flatMap(x=>x.rooms),later=rs.flatMap(x=>x.rooms.slice(1)).filter(r=>r.mpMax>0);return [id,{n:rs.length,wins:rs.filter(x=>x.won).length,bossReached:rs.filter(x=>x.bossReached).length,errors:rs.filter(x=>x.error).map(x=>x.error),timeouts:rs.filter(x=>x.timeout).length,rooms:rooms.length,laterManaEntryPct:later.length?avg(later,r=>100*r.mpStart/r.mpMax):null,unfunded:avg(rooms,r=>r.unfunded||0),manaSpent:avg(rooms,r=>r.manaSpent||0)}];}));}
function write(file,obj){fs.mkdirSync(require('node:path').dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(obj));}
function run(id){assert(IDS.includes(id));const p=G.profile(id),cases=[];for(const sc of SC)for(let i=0;i<N;i++)cases.push(trial(p,sc,i));write('reports/armor-mana-e10/'+id+'.json',{id,source:S.sourceFingerprint().sha256,nodes:p.t.nodes,arms:arms(p),cases,routes:routes(p)});console.log('ARMOR_MANA_SHARD='+JSON.stringify({id,n:cases.length*arms(p).length}));}
function smoke(){for(const id of IDS)trial(G.profile(id),SC[0],0);for(const sc of SC)trial(G.profile('magic-fire-wand'),sc,1);const p=G.profile('magic-lightning-wand'),r=routeTrial(p,arms(p).find(x=>x.id==='pilot-cloth'),0);console.log('ARMOR_MANA_ROUTE_SMOKE='+JSON.stringify(r));}
function aggregate(){
 const all=IDS.map(id=>{const x=JSON.parse(fs.readFileSync('reports/armor-mana-e10/'+id+'.json','utf8'));assert.equal(x.id,id);assert.equal(x.cases.length,N*SC.length);assert.equal(new Set(x.cases.map(c=>c.sc+'/'+c.i)).size,x.cases.length);assert.deepEqual(x.arms,arms(G.profile(id)));for(const c of x.cases)for(const a of x.arms.slice(1))paired(c.rows.native,c.rows[a.id],a);return x;});assert.equal(new Set(all.map(x=>x.source)).size,1);
 const profiles=Object.fromEntries(all.map(x=>[x.id,{arms:x.arms,nodes:x.nodes,...group(x.cases,x.arms.map(a=>a.id)),routes:routeSummary(x.routes)}]));
 const n=all.reduce((s,x)=>s+x.cases.length*x.arms.length,0),routeN=all.reduce((s,x)=>s+Object.values(x.routes||{}).flat().length,0);
 write('reports/v013-armor-mana-e10.json',{n,routeN,source:all[0].source,profiles});
 const compact=s=>({n:s.n,wins:s.wins,winPct:+s.winPct.toFixed(2),timeouts:s.timeouts,dps:+s.meanDps.toFixed(2),sp:+s.meanSP.toFixed(2),hp:+s.hp.toFixed(2),def:+s.meanDefense.toFixed(2),evasion:+s.evasion.toFixed(2),mana:+s.mana.toFixed(2),regen:+s.regen.toFixed(2),manaEnd:s.manaEndPct===null?null:+s.manaEndPct.toFixed(2),paid:+s.paidPerSecond.toFixed(2),funded:+s.funded.toFixed(2),infusions:+s.infusions.toFixed(2),unfunded:+s.unfunded.toFixed(2),starved:+s.starved.toFixed(2),taken:+s.takenPerSecond.toFixed(2),winSeconds:+s.winSeconds.toFixed(2)});
 console.log('ARMOR_MANA_OVERVIEW='+JSON.stringify({n,routeN,profiles:IDS.length}));
 for(const [id,p] of Object.entries(profiles))console.log('ARMOR_MANA_PROFILE='+JSON.stringify({id,arms:p.arms,overall:Object.fromEntries(Object.entries(p.overall).map(([a,s])=>[a,compact(s)])),categories:Object.fromEntries(['normal','elite','boss',...SC.map(s=>s.id)].map(k=>[k,Object.fromEntries(Object.entries(p[k]).map(([a,s])=>[a,{wins:s.wins,n:s.n,winPct:+s.winPct.toFixed(2),dps:+s.meanDps.toFixed(2)}]))])),routes:p.routes}));
}
if(require.main===module){const [cmd,id]=process.argv.slice(2);if(cmd==='run')run(id);else if(cmd==='smoke')smoke();else if(cmd==='aggregate')aggregate();else throw Error('command');}
module.exports={arms,trial,IDS,SC,LEATHER,MAGIC,COST,CLOTH,MANA,gearSource,runtimeSource,overrides};
