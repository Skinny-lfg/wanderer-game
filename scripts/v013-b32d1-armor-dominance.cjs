'use strict';
// B3.2D.1: native controlled combat, no agent selection or gameplay overrides.
const fs=require('node:fs'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const S=require('./simulate-progression.cjs'),G=require('./v013-global-e10.cjs'),A=require('./v013-b31a-twohand-budget.cjs'),AI=require('./v013-b32c-equipment-policy.cjs'),{observer}=require('./v013-b23b-stalemate.cjs');
const BASE='1688bec1c55c4f75be95757d169812c7a89e09df',OUT='reports/b32d1',N=50,SEED=105500001;
const IDS=['blood-sword','fury-daggers','fury-bow','decay-cycle-daggers','decay-cycle-wand','radiance-mace','aegis-mace','aegis-orb','arcane-arcane-wand','arcane-fire-staff','arcane-frost-wand','arcane-lightning-staff'];
const F=['blood','decay','radiance','aegis','fury','arcane'],ELITES=['tank','berserker','vampire','caster','gravecaller','the_shepherd','the_gilded','the_headsman'],SLOTS=['helm','armor','gloves','boots','belt'];
const SC=[{id:'solo',kind:'normal',size:1},{id:'group12',kind:'normal',size:12},{id:'elite',kind:'elite'},{id:'boss',kind:'boss'}];
const ARMS=[['Cloth',5,0,0],['Leather',0,5,0],['Plate',0,0,5],['Cloth3Plate2',3,0,2],['Leather3Plate2',0,3,2],['Cloth3Leather2',3,2,0]];
const COST={atk:1,def:1.1,hp:.25,spd:3.5,str:2.2,agi:2.2,int:2.2,end:2.2,cha:2.2,mana:.25,spell:1.1,evasionRating:1.2,critBonus:6,blockBonus:6,manaRegenBonus:15,wardBonus:100};
const hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex'),mean=(rows,f)=>rows.length?rows.reduce((n,x)=>n+f(x),0)/rows.length:null;
const clean=x=>Object.fromEntries(Object.entries(x).filter(([k])=>k!=='id'));
function mix(arm,i){const [id,c,l,p]=arm,types=[...Array(c).fill('Cloth'),...Array(l).fill('Leather'),...Array(p).fill('Plate')];return SLOTS.map((_,j)=>types[(j+i%5)%5]);}
function cell(p,sc,i,arm){
 const types=mix(arm,i),seed=SEED+i*113,family=F[i%F.length],elite=sc.kind==='elite'?ELITES[i%ELITES.length]:null;
 const build={id:p.id,weapon:p.weapon,families:p.families,skills:[],...(p.element?{element:p.element}:{})};
 const opts={...S.DEFAULTS,mode:'encounter',points:30,gear:'current',rarity:'Rare',runes:false,contracts:'none',boons:'none',targetPolicy:'mechanics',measure:true,tickLimit:13000,lockScenarioStreams:true,controlledTalents:p.t,armorType:p.armorType,offhandType:p.offhandType,stageB31EquipmentAudit:true,stageB32D1ArmorMix:types,...(elite?{stage619EliteType:elite}:{}),...(sc.id==='solo'?{stalemateAudit:observer(true)}:{})};
 const x=S.encounter(10,build,seed,sc.kind,opts,undefined,undefined,family,1,sc.size);
 assert.equal(x.level,10);assert.equal(x.pointsSpent,30);assert.deepEqual(x.controlledTalentNodes,p.t.nodes);
 assert.equal(x.affinity,family);assert.equal(x.weaponType,p.weapon);assert.equal(x.offhandType,p.offhandType);
 assert.equal([x.won,x.died,x.timedOut,!!x.surrendered].filter(Boolean).length,1);if(x.surrendered)assert.equal(x.surrenderSettlement.outcome,'defeat');
 if(elite)assert.equal(x.eliteType,elite);if(sc.size)assert.equal(x.requestedGroupSize,sc.size);
 const e=x.equipmentAudit,items=SLOTS.map(k=>e[k]),m=x.affinityMetrics||{},stats=x.heroBaseStats;
 assert.deepEqual(items.map(q=>q.armorType),types);assert(items.every(q=>q.rarity==='Rare'&&Number.isFinite(q.v013Budget)));
 const nominal=items.reduce((n,q)=>n+q.v013Budget,0),rawCost=items.reduce((n,q)=>n+Object.entries(COST).reduce((a,[k,v])=>a+(Number(q[k])||0)*v,0),0);
 const proxy=AI.adaptiveFeatures({stats,adaptiveStats:x.adaptiveStats,weapon:p.weapon,off:p.offhandType,nodes:p.t.nodes,equipment:e},p.element||'arcane',10);
 const proxyScore=.25*(.65*Math.log(proxy.single)+.35*Math.log(proxy.normalDurability))+.40*(.55*Math.log(proxy.group)+.45*Math.log(proxy.normalDurability))+.35*(.42*Math.log(proxy.single)+.58*Math.log(proxy.bossDurability));
 // B32D's small loot-quality and Legendary credits are omitted here: all Rare,
 // loot quality is not in the existing stat snapshot. This is its combat proxy only.
 assert(Number.isFinite(proxyScore));
 return {id:arm[0],seed,resolved:x.resolvedSeed,rosterHash:hash([x.roster,x.initialRoles,x.conditionId,x.conditionMarked,x.traitId,x.bossModifierIds,x.bossId,x.eliteType]),nonArmor:x.nonArmorGearFingerprint,armor:items.map(clean),nominal,rawCost,stats,proxy,proxyScore,won:x.won,died:x.died,surrendered:!!x.surrendered,timeout:x.timedOut,seconds:x.seconds,damage:x.damageDealt,taken:x.damageTaken,absorbed:x.absorbed,healing:m.healingActual||0,barrier:m.barrierGenerated||0,dot:m.dotDamageActual||0,manaSpent:x.manaSpent,mpStart:x.mpStart,mpEnd:x.mpEnd,mpMax:x.mpMax,funded:x.fundedCasts,unfunded:x.unfundedCasterAttacks,starved:m.manaStarvedSeconds||0,hpEnd:x.hpEnd,hpMax:x.hpMax,firstKill:x.firstKillSeconds,secondary:x.secondaryTargetDamage};
}
function pair(p,sc,i){
 const rows=ARMS.map(a=>cell(p,sc,i,a)),b=rows[0];
 for(const r of rows){assert.equal(r.seed,b.seed);assert.equal(r.resolved,b.resolved);assert.equal(r.rosterHash,b.rosterHash,'Encounter drift');assert.equal(r.nonArmor,b.nonArmor,'Non-armor drift');assert(Math.abs(r.nominal-b.nominal)<1e-8,'Nominal armor budget drift');
  for(const q of rows)for(let k=0;k<SLOTS.length;k++)if(r.armor[k].armorType===q.armor[k].armorType)assert.deepEqual(r.armor[k],q.armor[k],'Native shared armor roll drift');
 }
 return {seed:b.seed,rows};
}
function write(name,x){fs.mkdirSync(OUT,{recursive:true});fs.writeFileSync(OUT+'/'+name+'.json',JSON.stringify(x));}
function run(pi,ci){const p=G.profile(IDS[pi]),sc=SC[ci];assert(p&&sc);const cases=Array.from({length:N},(_,i)=>pair(p,sc,i));write('study-'+pi+'-'+ci,{pi,ci,profile:p.id,scenario:sc.id,weapon:p.weapon,offhand:p.offhandType,nodes:p.t.nodes,commit:process.env.GITHUB_SHA,source:S.sourceFingerprint().sha256,cases});}
function metrics(rows){
 const n=rows.length,m=k=>mean(rows,r=>Number(r[k])||0),s=k=>mean(rows,r=>Number(r.stats[k])||0),rate=k=>mean(rows,r=>r.seconds>0?(Number(r[k])||0)/r.seconds:0),wins=rows.filter(r=>r.won),mana=rows.filter(r=>r.mpMax>0),casts=rows.reduce((v,r)=>v+(r.funded||0)+(r.unfunded||0),0);
 return {n,wins:wins.length,deaths:rows.filter(r=>r.died).length,surrenders:rows.filter(r=>r.surrendered).length,timeouts:rows.filter(r=>r.timeout).length,winPct:100*wins.length/n,DPS:rate('damage'),secondaryDPS:rate('secondary'),dotDPS:rate('dot'),takenPerSec:rate('taken'),absorbedPerSec:rate('absorbed'),healingPerSec:rate('healing'),barrierPerSec:rate('barrier'),HPendPct:mean(rows,r=>100*r.hpEnd/Math.max(1,r.hpMax)),seconds:m('seconds'),winSeconds:mean(wins,r=>r.seconds),firstKill:mean(rows.filter(r=>r.firstKill!=null),r=>r.firstKill),AP:s('attack'),SP:s('spellPower'),APS:s('attacksPerSec'),HP:s('maxhp'),Defense:s('defense'),Evasion:s('evasionRating'),Guard:s('blockChance'),Mana:s('mana'),Regen:s('manaRegen'),manaSpentPerSec:rate('manaSpent'),manaEndPct:mean(mana,r=>100*r.mpEnd/r.mpMax),starvedPct:mean(mana,r=>100*r.starved/Math.max(.001,r.seconds)),fundedPerSec:rate('funded'),unfundedPct:casts?100*rows.reduce((v,r)=>v+(r.unfunded||0),0)/casts:null,nominalBudget:m('nominal'),realizedCost:m('rawCost')};
}
function compare(cases,base,id){return A.paired(cases,base,id);}
function rank(cases,ids){
 const chosen=cases.map(c=>[...c.rows].filter(r=>ids.includes(r.id)).sort((a,b)=>b.proxyScore-a.proxyScore||a.id.localeCompare(b.id))[0]);
 const misses=cases.filter((c,i)=>!chosen[i].won&&c.rows.some(r=>ids.includes(r.id)&&r.won)).length;
 const picks=Object.fromEntries(ids.map(id=>[id,chosen.filter(r=>r.id===id).length]));
 return {picks,metrics:metrics(chosen),missedWinningAlternative:misses};
}
function aggregate(){
 const xs=IDS.flatMap((id,pi)=>SC.map((sc,ci)=>JSON.parse(fs.readFileSync(OUT+'/study-'+pi+'-'+ci+'.json','utf8'))));assert.equal(new Set(xs.map(x=>x.source)).size,1);const results=[],all=xs.flatMap(x=>x.cases.flatMap(c=>c.rows)),ids=ARMS.map(a=>a[0]);
 for(const x of xs){assert.equal(x.commit,process.env.GITHUB_SHA);assert.equal(x.cases.length,N);assert.equal(new Set(x.cases.map(c=>c.seed)).size,N);for(const c of x.cases)assert.deepEqual(c.rows.map(r=>r.id),ids);
  const arms=Object.fromEntries(ids.map(id=>[id,metrics(x.cases.map(c=>c.rows.find(r=>r.id===id)))]));
  for(const a of Object.values(arms))assert.equal(a.wins+a.deaths+a.surrenders+a.timeouts,a.n);
  const r={profile:x.profile,scenario:x.scenario,weapon:x.weapon,offhand:x.offhand,arms,plateVsCloth:compare(x.cases,'Cloth','Plate'),plateVsLeather:compare(x.cases,'Leather','Plate'),mixedVsCloth:compare(x.cases,'Cloth','Cloth3Plate2'),mixedVsLeather:compare(x.cases,'Leather','Leather3Plate2'),proxy:rank(x.cases,ids.slice(0,3)),proxyAll:rank(x.cases,ids)};
  results.push(r);console.log('B32D1_STUDY='+JSON.stringify(r));
 }
 // Verify blind ranks and exact gear across scenario categories on same pool.
 let blindChecks=0;
 for(let pi=0;pi<IDS.length;pi++){const panels=xs.filter(x=>x.pi===pi);for(let i=0;i<N;i++){const b=panels[0].cases[i];for(const x of panels.slice(1)){const c=x.cases[i];assert.equal(c.seed,b.seed);for(const [j,r] of c.rows.entries()){const q=b.rows[j];assert.equal(r.nonArmor,q.nonArmor);assert.deepEqual(r.armor,q.armor);assert.deepEqual(r.stats,q.stats);assert.equal(r.proxyScore,q.proxyScore);blindChecks++;}}}}
 const pooled=Object.fromEntries(['all',...SC.map(x=>x.id)].map(sc=>{const cases=xs.filter(x=>sc==='all'||x.scenario===sc).flatMap(x=>x.cases);return [sc,Object.fromEntries(ids.map(id=>[id,metrics(cases.map(c=>c.rows.find(r=>r.id===id)))]))];}));
 assert.equal(all.length,14400);
 const summary={baseline:BASE,commit:process.env.GITHUB_SHA,source:xs[0].source,profiles:IDS.length,scenarios:SC.length,seedCount:N,fights:all.length,timeouts:all.filter(r=>r.timeout).length,surrenders:all.filter(r=>r.surrendered).length,blindChecks,pooled,results,scope:'Controlled E10 Rare gear, 30 legal talents, same native armor pool and nominal budgets. Pure and three mixed masks; slot rotation by seed. Equal nominal budget is not equal realized affixes or acquisition cost. Pooled rates descriptive, same seed repeated across scenarios/profiles; not natural balance target. Combat-only agent proxy, not actual economic policy. No tuning.'};
 write('summary',summary);console.log('B32D1_OVERVIEW='+JSON.stringify({...summary,results:undefined}));if(summary.timeouts)process.exitCode=1;
}
function smoke(){
 assert.equal(execFileSync('git',['diff','--name-only',BASE,'HEAD','--','combat','online','economy','index.html','docs/index.html','docs/combat','docs/online','docs/economy','scripts/v013-b32c-equipment-policy.cjs','scripts/v013-natural-progression.cjs'],{encoding:'utf8'}).trim(),'','Native or agent drift');
 for(const id of IDS){const p=G.profile(id);pair(p,SC[0],0);}
 for(const sc of SC.slice(1))pair(G.profile('arcane-fire-staff'),sc,1);
 console.log('B32D1_SMOKE='+JSON.stringify({profiles:IDS.length,fights:(IDS.length+SC.length-1)*ARMS.length,productionDrift:false}));
}
const [cmd,pi,ci]=process.argv.slice(2);if(cmd==='smoke')smoke();else if(cmd==='study')run(Number(pi),Number(ci));else if(cmd==='aggregate')aggregate();else throw Error('Unknown command');
