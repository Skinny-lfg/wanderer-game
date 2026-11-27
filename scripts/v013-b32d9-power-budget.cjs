'use strict';
// B3.2D.9: single-mechanic interventions in detached native combat VM only.
// Production, talents and agent policy remain frozen. No auto approval.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const S=require('./simulate-progression.cjs'),G=require('./v013-global-e10.cjs'),{T}=require('../tests/v013-current-talent-helper.cjs');
const BASE='869f0c6eb079bf1cde5b48883fea292e8c7ba84b',OUT='reports/b32d9',SEED=116900001,COUNT=6,LEVELS=[3,10];
const IDS=['blood-daggers','blood-sword','fury-daggers','fury-bow','decay-cycle-daggers','decay-cycle-wand','radiance-mace','aegis-orb','arcane-arcane-wand','arcane-fire-staff','arcane-frost-wand','arcane-lightning-staff','hybrid-decay-blood','hybrid-blood-fury'];
const HANDS=[['Sword/Shield','Sword','Shield',['no-parry','no-counter']],['Sword/Dagger','Sword','Off-Hand Dagger',['no-parry','no-offhand-clock']],['Daggers/Dagger','Daggers','Off-Hand Dagger',['no-offhand-clock','no-fan','double15','double25']],['Mace/Shield','Mace','Shield',['no-stun','no-guard']],['Bow','Bow',null,['no-pierce']],['Two-Handed','Two-Handed',null,['no-cleave']],['Staff','Staff',null,['no-talents']],['Wand/Orb','Wand','Orb',['no-talents']],['Wand/Tome','Wand','Tome',['no-talents']],['Wand/Charm','Wand','Charm',['no-talents']]];
const SC=[{id:'solo',kind:'normal',size:1},{id:'large',kind:'normal',size:12},{id:'elite-tank',kind:'elite',elite:'tank'},{id:'boss',kind:'boss'}];
const FAMILIES=['blood','decay','radiance','aegis','fury','arcane'];
const original=fs.readFileSync(path.resolve(__dirname,'../combat/v012-combat-runtime.js'),'utf8'),hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex'),n=x=>Number(x)||0,sum=(a,f)=>a.reduce((s,x)=>s+f(x),0),mean=(a,f)=>a.length?sum(a,f)/a.length:null;
function replace(src,a,b){assert.equal(src.split(a).length,2,'Source contract changed: '+a.slice(0,100));return src.replace(a,b);}
function runtime(variant){
 if(variant==='native'||variant==='no-talents')return null;
 let s=original;
 if(variant==='no-parry')s=replace(s,"s.main?.subtype==='Sword'&&ports.gameRandom()<.18","s.main?.subtype==='Sword'&&ports.gameRandom()<.18&&false");
 else if(variant==='no-counter')s=replace(s,"!ports.legendaryHas('oathwall')&&ports.setReady(r,'shieldBaseCounter',2.5)","!ports.legendaryHas('oathwall')&&ports.setReady(r,'shieldBaseCounter',2.5)&&false");
 else if(variant==='no-offhand-clock')s=replace(s,"const offhandRate=root.WandererV012GearStats.offhandDaggerRate(s,haste);","const offhandRate=0; // diagnostic: retain equipped stats, remove independent strikes");
 else if(variant==='no-fan')s=replace(s,"kind==='Daggers'&&ports.state.automaticTalents?.nodes?.includes('fan_of_blades')","kind==='Daggers'&&ports.state.automaticTalents?.nodes?.includes('fan_of_blades')&&false");
 else if(variant==='no-stun')s=replace(s,"kind==='Mace'&&now>=(e.stunImmuneUntil||0)&&ports.gameRandom()<.25","kind==='Mace'&&now>=(e.stunImmuneUntil||0)&&ports.gameRandom()<.25&&false");
 else if(variant==='no-guard')s=replace(s,"const block=blockChance&&ports.gameRandom()<blockChance/100;","const block=blockChance&&ports.gameRandom()<blockChance/100&&false; // all guard events, including talents");
 else if(variant==='no-pierce')s=replace(s,"if(!offhandStrike&&kind==='Bow')groupSecondaryDamage","if(false&&!offhandStrike&&kind==='Bow')groupSecondaryDamage");
 else if(variant==='no-cleave')s=replace(s,"if(!offhandStrike&&kind==='Two-Handed'){const factor=","if(false&&!offhandStrike&&kind==='Two-Handed'){const factor=");
 else if(['double15','double25'].includes(variant)){
  const chance=variant==='double15'?.15:.25;
  // Native direct bonus-hit helper, as used by the legacy single-dagger proc.
  // Main-hand only, dual daggers only, once per eligible swing, no recursive onAttack.
  s=replace(s," // Crescent keeps its cooldown-limited Bleed extension without independent off-hand hits.",` if(!offhandStrike&&kind==='Daggers'&&['Daggers','Off-Hand Dagger'].includes(off?.subtype)&&damage>0&&e.hp>0){
   ports.phase6Metric(r,'secondaryEquipmentStatusDualExtraEligible',1);
   if(ports.gameRandom()<${chance}){
    const hpBeforeExtra=e.hp;
    ports.setDirectEnemyDamage(r,Math.max(1,Math.round(base*.55)),'🗡 Dual Double Attack');
    ports.phase6Metric(r,'secondaryEquipmentStatusDualExtraHits',1);
    ports.phase6Metric(r,'secondaryEquipmentStatusDualExtraHPDamage',Math.max(0,hpBeforeExtra-Math.max(0,e.hp)));
   }
  }
 // Crescent keeps its cooldown-limited Bleed extension without independent off-hand hits.`);
 }else throw Error('Unknown variant '+variant);
 return s;
}
const variants=[...new Set(HANDS.flatMap(h=>h[3]))],sources=Object.fromEntries(variants.map(v=>[v,runtime(v)]));
function profile(id,level){
 const p=G.profile(id),points=level===3?6:30,t=level===3?{...p.t,xp:points*T.POINT_XP,nodes:p.t.nodes.slice(0,points),prepared:null}:p.t;
 assert(T.valid(t),id+' invalid talent budget');assert.equal(T.earned(t),points);assert.equal(t.nodes.length,points);
 return {...p,level,points,t,rarity:level===3?'Uncommon':'Rare'};
}
function cell(p,h,sc,i,variant){
 const [id,weapon,offhand]=h,seed=SEED+p.level*100003+i*131, family=FAMILIES[(i+SC.indexOf(sc))%FAMILIES.length];
 const t=variant==='no-talents'?T.reset(p.t):p.t;assert(T.valid(t));assert.equal(T.earned(t),p.points);
 const build={id:p.id,weapon:p.weapon,families:p.families,skills:[],...(p.t.element?{element:p.t.element}:{})};
 const source=sources[variant];let observedRuntime=null;
 const opts={mode:'encounter',points:p.points,gear:'current',rarity:p.rarity,runes:false,contracts:'none',targetPolicy:'mechanics',measure:true,tickLimit:13000,lockScenarioStreams:true,controlledTalents:t,armorType:p.armorType,offhandType:offhand,stageB31ALoadout:weapon,stageB31EquipmentAudit:true,...(source?{stageArmorRuntimeSource:source}:{}),recordModules:entries=>{observedRuntime=entries.find(e=>e.file==='combat/v012-combat-runtime.js');},...(sc.elite?{stage619EliteType:sc.elite}:{})};
 const x=S.encounter(p.level,build,seed,sc.kind,opts,undefined,undefined,family,1,sc.size);
 assert(observedRuntime,'Missing native runtime manifest');assert.equal(observedRuntime.overridden,!!source,'Unexpected runtime substitution');assert.equal(observedRuntime.sha256,crypto.createHash('sha256').update(source||original).digest('hex'),'Runtime source mismatch');
 assert.equal(x.level,p.level);assert.equal(x.pointsSpent,t.nodes.length);assert.equal(x.talentXp,t.xp);assert.deepEqual(x.controlledTalentNodes,t.nodes);
 assert.equal(x.affinity,family);assert.equal(x.weaponType,weapon);assert.equal(x.offhandType,offhand);assert.equal(x.armorType,p.armorType);assert.equal(Number(x.won)+Number(x.died)+Number(x.timedOut),1);
 if(sc.elite)assert.equal(x.eliteType,sc.elite);if(sc.kind==='boss')assert.equal(x.bossAffinity,family);if(sc.size)assert.equal(x.requestedGroupSize,sc.size);
 const eq=x.equipmentAudit,m=x.affinityMetrics||{},status=x.weaponStatusMetrics||{},strip=it=>{if(!it)return null;const {id,...rest}=it;return rest;};
 const gear=hash(Object.keys(eq).sort().map(k=>[k,strip(eq[k])])),scenario=hash([x.resolvedSeed,x.affinity,x.risk,x.roster,x.initialRoles,x.traitId,x.conditionId,x.conditionMarked,x.bossModifierIds,x.eliteType,x.bossId]);
 if(variant==='no-parry')assert.equal(n(m.defensiveAudit?.parries),0);
 if(variant==='no-offhand-clock')assert.equal(n(status.secondaryEquipmentStatusOffhandStrikes),0);
 if(variant==='no-guard')assert.equal(n(m.defensiveAudit?.shield),0);
 if(!['double15','double25'].includes(variant))assert.equal(n(status.secondaryEquipmentStatusDualExtraHits),0);
 assert(n(status.secondaryEquipmentStatusDualExtraHits)<=n(status.secondaryEquipmentStatusDualExtraEligible));
 return {id:p.id,level:p.level,package:id,variant,sc:sc.id,trial:i,seed,gear,scenario,nodes:t.nodes,spent:t.nodes.length,won:x.won,died:x.died,timeout:x.timedOut,seconds:x.seconds,damage:x.damageDealt,secondary:x.secondaryTargetDamage,dot:m.dotDamageActual,taken:x.damageTaken,hpEnd:x.hpEnd,hpMax:x.hpMax,mpEnd:x.mpEnd,mpMax:x.mpMax,funded:x.fundedCasts,unfunded:x.unfundedCasterAttacks,paid:x.manaSpent,healed:m.healingActual,barrier:m.barrierGenerated,absorbed:x.absorbed,starved:m.manaStarvedSeconds,infusion:x.infusionDamage,stats:x.heroBaseStats,defense:m.defensiveAudit,activations:m.passiveActivations,offhandProcs:m.offhandProcs,status,magic:x.magicAdaptiveMetrics,decay:x.decayTalentMetrics};
}
function group(p,h,sc,i){
 const rows=['native',...h[3]].map(v=>cell(p,h,sc,i,v));assert.equal(new Set(rows.map(r=>r.gear)).size,1,'Gear drift');assert.equal(new Set(rows.map(r=>r.scenario)).size,1,'Scenario drift');return rows;
}
function write(name,x){fs.mkdirSync(OUT,{recursive:true});fs.writeFileSync(OUT+'/'+name+'.json',JSON.stringify(x));}
function run(pi,li){const p=profile(IDS[pi],LEVELS[li]),rows=[];for(const sc of SC)for(let i=0;i<COUNT;i++)for(const h of HANDS)rows.push(...group(p,h,sc,i));write('study-'+pi+'-'+li,{id:p.id,level:p.level,pi,li,commit:process.env.GITHUB_SHA,native:S.sourceFingerprint().sha256,sources:hash(sources),rows});console.log('B32D9_SHARD='+JSON.stringify({id:p.id,level:p.level,fights:rows.length,timeouts:rows.filter(r=>r.timeout).length}));}
function stats(rows){
 const wins=rows.filter(r=>r.won),mana=rows.filter(r=>r.mpMax>0),funded=sum(rows,r=>n(r.funded)),unfunded=sum(rows,r=>n(r.unfunded)),eligible=sum(rows,r=>n(r.status.secondaryEquipmentStatusDualExtraEligible)),extra=sum(rows,r=>n(r.status.secondaryEquipmentStatusDualExtraHits));
 return {n:rows.length,wins:wins.length,timeouts:rows.filter(r=>r.timeout).length,winPct:rows.length?100*wins.length/rows.length:null,winSeconds:mean(wins,r=>r.seconds),dps:mean(rows,r=>r.seconds?n(r.damage)/r.seconds:0),aoeDps:mean(rows,r=>r.seconds?n(r.secondary)/r.seconds:0),dotDps:mean(rows,r=>r.seconds?n(r.dot)/r.seconds:0),hpEndPct:mean(rows,r=>100*r.hpEnd/Math.max(1,r.hpMax)),manaEndPct:mean(mana,r=>100*r.mpEnd/r.mpMax),funded,unfunded,fundedFraction:funded+unfunded?funded/(funded+unfunded):null,starvedSeconds:mean(rows,r=>n(r.starved)),parries:sum(rows,r=>n(r.defense?.parries)),shieldPrevented:sum(rows,r=>n(r.defense?.shield)),offhandHits:sum(rows,r=>n(r.status.secondaryEquipmentStatusOffhandStrikes)),offhandHPDamage:sum(rows,r=>n(r.status.secondaryEquipmentStatusOffhandDamage)),extraEligible:eligible,extraHits:extra,extraRate:eligible?extra/eligible:null,extraHPDamage:sum(rows,r=>n(r.status.secondaryEquipmentStatusDualExtraHPDamage)),meanHealing:mean(rows,r=>n(r.healed)),meanAbsorbed:mean(rows,r=>n(r.absorbed))};
}
function pairs(a,b){const key=r=>[r.id,r.level,r.sc,r.trial].join('/'),map=new Map(a.map(r=>[key(r),r]));assert.equal(a.length,b.length);let controlOnly=0,variantOnly=0,unresolved=0;const both=[];for(const y of b){const x=map.get(key(y));assert(x&&x.gear===y.gear&&x.scenario===y.scenario);if(x.timeout||y.timeout){unresolved++;continue;}if(x.won&&!y.won)controlOnly++;if(!x.won&&y.won)variantOnly++;if(x.won&&y.won)both.push([x,y]);}return {n:b.length,controlOnly,variantOnly,unresolved,bothWinTimeDelta:mean(both,([x,y])=>y.seconds-x.seconds)};}
function summarize(rows){
 return HANDS.map(([id,,,vs])=>{const a=rows.filter(r=>r.package===id&&r.variant==='native');return {package:id,native:stats(a),variants:Object.fromEntries(vs.map(v=>{const b=rows.filter(r=>r.package===id&&r.variant===v);return [v,{...stats(b),paired:pairs(a,b)}];}))};});
}
function aggregate(){
 const xs=IDS.flatMap((id,pi)=>LEVELS.map((level,li)=>JSON.parse(fs.readFileSync(OUT+'/study-'+pi+'-'+li+'.json','utf8'))));assert.equal(new Set(xs.map(x=>x.native)).size,1);assert.equal(new Set(xs.map(x=>x.sources)).size,1);
 const expected=COUNT*SC.length*HANDS.reduce((s,h)=>s+1+h[3].length,0);
 for(const x of xs){assert.equal(x.commit,process.env.GITHUB_SHA);assert.equal(x.rows.length,expected);}
 const rows=xs.flatMap(x=>x.rows),levels=LEVELS.map(level=>({level,packages:summarize(rows.filter(r=>r.level===level)),scenarios:SC.map(sc=>({id:sc.id,packages:summarize(rows.filter(r=>r.level===level&&r.sc===sc.id))}))})),profiles=xs.map(x=>({id:x.id,level:x.level,packages:summarize(x.rows)}));
 const report={baseline:BASE,commit:process.env.GITHUB_SHA,native:xs[0].native,sourceVariants:xs[0].sources,profilesCount:IDS.length,seeds:COUNT,fights:rows.length,timeouts:rows.filter(r=>r.timeout).length,levels,profiles,scope:'Controlled diagnostic native gear rolls and profile armor, 6/30 spent talents, E3/E10. Exact gear/encounter paired within each package. Native vs one isolated VM-only runtime ablation or Dual extra-hit candidate. No-talents is same earned budget unspent, not a legal alternative equal-spent build. Native RNG may diverge after changed event; same initial seed, not identical subsequent RNG draws. No natural progression acceptance, no production or policy changes. Six seeds/profile; correlated scenarios.'};
 write('summary',report);
 console.log('B32D9_OVERVIEW='+JSON.stringify({...report,profiles:undefined,levels:levels.map(({scenarios,...l})=>l)}));
 for(const p of profiles)console.log('B32D9_PROFILE='+JSON.stringify({id:p.id,level:p.level,packages:p.packages.map(x=>({package:x.package,native:{wins:x.native.wins,n:x.native.n,dps:x.native.dps,fundedFraction:x.native.fundedFraction},variants:Object.fromEntries(Object.entries(x.variants).map(([v,m])=>[v,{wins:m.wins,n:m.n,dps:m.dps,fundedFraction:m.fundedFraction,extraRate:m.extraRate,paired:m.paired}]))}))}));
}
function smoke(){
 assert.equal(execFileSync('git',['diff','--name-only',BASE,'HEAD','--','combat','economy','online','index.html','docs','scripts/simulate-progression.cjs','scripts/v013-natural-progression.cjs','scripts/v013-b32c-equipment-policy.cjs','scripts/v013-b32d7-combat-aware-policy.cjs'],{encoding:'utf8'}).trim(),'');
 for(const v of variants)if(sources[v]){assert.notEqual(sources[v],original);new Function(sources[v]);}
 for(const level of LEVELS)for(const id of IDS)profile(id,level);
 let rows=[];for(const level of LEVELS)for(const id of ['fury-daggers','arcane-lightning-staff']){const p=profile(id,level);for(const sc of SC)for(const h of HANDS)rows.push(...group(p,h,sc,0));}
 for(const v of ['double15','double25'])assert(rows.filter(r=>r.variant===v).some(r=>n(r.status.secondaryEquipmentStatusDualExtraHits)>0),'Candidate never fired');
 assert(rows.filter(r=>r.variant==='no-talents').every(r=>r.spent===0));
 console.log('B32D9_SMOKE='+JSON.stringify({fights:rows.length,levels:LEVELS,variants,productionDrift:false,paired:true}));
}
const [cmd,pi,li]=process.argv.slice(2);if(cmd==='smoke')smoke();else if(cmd==='study')run(Number(pi),Number(li));else if(cmd==='aggregate')aggregate();else throw Error('Unknown command');
