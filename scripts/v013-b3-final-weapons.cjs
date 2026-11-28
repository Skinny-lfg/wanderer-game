'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const S=require('./simulate-progression.cjs'),G=require('./v013-global-e10.cjs'),{T}=require('../tests/v013-current-talent-helper.cjs');
const BASE='ee95b4f59c3b46b9f9158f108f0d52815f22eb4f',OUT='reports/b3-final',SEED=120800001,COUNT=6;
const original=fs.readFileSync('combat/v012-combat-runtime.js','utf8'),old=execFileSync('git',['show',BASE+':combat/v012-combat-runtime.js'],{encoding:'utf8'}),sources={old};
const hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex'),n=x=>Number(x)||0;
assert.equal(original,old.replace("s.main?.subtype==='Sword'&&ports.gameRandom()<.18","s.main?.subtype==='Sword'&&ports.gameRandom()<.12").replace("kind==='Daggers'&&!['Daggers','Off-Hand Dagger'].includes(off?.subtype)&&damage>0&&e.hp>0&&ports.gameRandom()<.25","kind==='Daggers'&&damage>0&&e.hp>0&&ports.gameRandom()<.25"));
assert.equal(original,fs.readFileSync('docs/combat/v012-combat-runtime.js','utf8'));
assert.equal(execFileSync('git',['diff','--name-only',BASE,'HEAD','--','scripts/v013-b32d7-combat-aware-policy.cjs','scripts/v013-b32c-equipment-policy.cjs','scripts/v013-natural-progression.cjs','economy','online'],{encoding:'utf8'}).trim(),'');
const HANDS=[['Sword/Shield','Sword','Shield'],['Sword/Dagger','Sword','Off-Hand Dagger'],['Daggers/Dagger','Daggers','Off-Hand Dagger'],['Mace/Shield','Mace','Shield']];
const SC=[{id:'solo',kind:'normal',size:1},{id:'large',kind:'normal',size:12},{id:'elite-tank',kind:'elite',elite:'tank'},{id:'boss',kind:'boss'}],FAMILIES=['blood','decay','radiance','aegis','fury','arcane'];
const IDS=['blood-sword','fury-daggers','decay-cycle-daggers'];
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

const rows=[];
for(const id of IDS){const p=profile(id,10);for(const h of HANDS)for(const sc of SC)for(let i=0;i<COUNT;i++){
 const a=cell(p,h,sc,i,'old'),b=cell(p,h,sc,i,'native');assert.equal(a.gear,b.gear);assert.equal(a.scenario,b.scenario);
 if(h[1]==='Mace'){const {variant:av,...ar}=a,{variant:bv,...br}=b;assert.deepEqual(ar,br,'Unchanged Mace control drift');}
 rows.push({id,package:h[0],scenario:sc.id,trial:i,old:a,native:b});
}}
const summary={base:BASE,commit:process.env.GITHUB_SHA,pairs:rows.length,fights:rows.length*2,timeouts:rows.reduce((s,r)=>s+Number(r.old.timeout)+Number(r.native.timeout),0),packages:HANDS.map(h=>{const rs=rows.filter(r=>r.package===h[0]);return {package:h[0],n:rs.length,oldWins:rs.filter(r=>r.old.won).length,newWins:rs.filter(r=>r.native.won).length,oldOnly:rs.filter(r=>r.old.won&&!r.native.won).length,newOnly:rs.filter(r=>r.native.won&&!r.old.won).length,oldParries:rs.reduce((s,r)=>s+n(r.old.defense?.parries),0),newParries:rs.reduce((s,r)=>s+n(r.native.defense?.parries),0)};}),rows};
fs.mkdirSync(OUT,{recursive:true});fs.writeFileSync(OUT+'/summary.json',JSON.stringify(summary,null,2));
console.log('B3_FINAL='+JSON.stringify({...summary,rows:undefined}));assert.equal(summary.timeouts,0);
