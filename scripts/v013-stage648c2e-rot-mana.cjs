'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const S=require('./simulate-progression.cjs'),P=require('./v013-stage648c2b-persistent-corruption.cjs'),C=require('./v013-stage648c2c-offensive-scaling.cjs');
const {T,buy}=require('../tests/v013-current-talent-helper.cjs');
const W={daggers:['Daggers','Off-Hand Dagger','Leather'],sword:['Sword','Shield','Plate'],twohand:['Two-Handed',null,'Plate'],bow:['Bow',null,'Leather'],wand:['Wand','Tome','Cloth'],staff:['Staff',null,'Cloth']};
const ROT=['native','persistent','rot3','rot4','rot5','persistent-no-cycle','rot4-no-cycle'],MAGIC=['arcane','fire','frost','lightning'];
const MANA=[...Object.keys(W).flatMap(w=>['decay-'+w,'newdecay-'+w]),...MAGIC.flatMap(m=>['sword','wand','staff'].map(w=>m+'-'+w))];
const IDS=[...ROT.map(m=>'rot:'+m),...MANA.map(m=>'mana:'+m)];
const SC=[{id:'solo',kind:'normal',size:1},{id:'group4',kind:'normal',size:4},{id:'group8',kind:'normal',size:8},{id:'boss',kind:'boss'}],N=50,POINTS=24;
const RT=fs.readFileSync('combat/v012-combat-runtime.js','utf8');
function rep(s,a,b){assert.equal(s.split(a).length,2,'anchor '+a.slice(0,100));return s.replace(a,b);}
function weaponBase(stats){
 const kind=stats.main?.subtype||'Unarmed',sp=Math.max(0,Number(stats.spellPower)||0),ap=Math.max(0,Number(stats.attack)||0);
 return kind==='Wand'?sp*1.05:kind==='Staff'?sp*1.32:ap*({'Two-Handed':1.70,Mace:1.4,Bow:1.08,Daggers:.80,Sword:1.12}[kind]||1);
}
function rotSource(mode){
 assert(ROT.includes(mode));let s=P.diagnosticSource(mode==='native'?'baseline':'persistent-after');
 if(mode.endsWith('-no-cycle'))s=rep(s,"if(specialized(b,'corruption_cycle')&&e.hp>0&&e.v012Rot?.length>=3","if(false&&specialized(b,'corruption_cycle')&&e.hp>0&&e.v012Rot?.length>=3");
 if(mode.startsWith('rot')){
  s=rep(s,'function applyRot(b,c,power,origin=null){',weaponBase.toString()+'\nfunction applyRot(b,c,power,origin=null){');
  s=rep(s,"base*.065+Math.max(0,c.power||0)*.025,'paid_primary_toxic_touch'","(weaponBase(c.player.stats)+Math.max(0,Number(c.player.stats.spellPower)||0))*"+(Number(mode[3])/100)+",'paid_primary_toxic_touch'");
  const factor="power*(1+.15*rank(b,'virulent_rot')+(b.runtime.talentBonuses?.rotBonus||0))";
  s=rep(s,"damage:Math.max(1,Math.round("+factor+"))","damage:origin==='paid_primary_toxic_touch'?Math.max(0,"+factor+"):Math.max(1,Math.round("+factor+"))");
 }
 s=rep(s,"  const baseRot=rot.reduce((sum,s)=>sum+s.damage,0);","  const baseRot=rot.reduce((sum,s)=>sum+s.damage,0);\n  const paid=rot.filter(primaryPaidRot);c.metric?.('decayPrimaryPaidStageETickCount',1);c.metric?.('decayPrimaryPaidStageEStackSeconds',paid.length);c.metric?.('decayPrimaryPaidStageERawPrimaryTick',paid.reduce((n,d)=>n+d.damage,0));c.metric?.('decayPrimaryPaidStageETicksAt'+paid.length,1);");
 return s;
}
function manaRuntime(){
 let s=RT;
 s=rep(s,"if(s.caster||r.phase1Magic||s.phase2Decay)r.mp=Math.min(r.maxmp,r.mp+dt*s.manaRegen);","if(s.caster||r.phase1Magic||s.phase2Decay){const before=r.mp,potential=dt*s.manaRegen;r.mp=Math.min(r.maxmp,r.mp+potential);ports.phase6Metric(r,'stage648ManaRegenPotential',potential);ports.phase6Metric(r,'stage648ManaRegenActual',r.mp-before);}");
 s=rep(s,"mana(amount){r.mp=Math.min(r.maxmp,r.mp+Math.max(0,amount));},","mana(amount){const before=r.mp,potential=Math.max(0,amount);r.mp=Math.min(r.maxmp,r.mp+potential);ports.phase6Metric(r,'stage648ManaRefundPotential',potential);ports.phase6Metric(r,'stage648ManaRefundActual',r.mp-before);},");
 s=rep(s," const restored=Math.max(0,Math.min(manaPerRecall,r.maxmp-r.mp));"," const restored=Math.max(0,Math.min(manaPerRecall,r.maxmp-r.mp));ports.phase6Metric(r,'stage648ManaRefundPotential',manaPerRecall);ports.phase6Metric(r,'stage648ManaRefundActual',restored);");
 s=rep(s,"if(r.mp<cost)return false;r.mp-=cost;ports.phase6Metric(r,'manaSpent',cost);","if(r.mp<cost){ports.phase6Metric(r,'stage648ManaDarkDenied',1);return false;}r.mp-=cost;ports.phase6Metric(r,'stage648ManaDarkSpent',cost);ports.phase6Metric(r,'manaSpent',cost);");
 s=rep(s,"ports.phase6Metric(r,'manaSpent',cost);ports.phase6Metric(r,'fundedCasts',1);r.mp-=cost;cast=true;","ports.phase6Metric(r,'stage648ManaWeaponSpent',cost);ports.phase6Metric(r,'manaSpent',cost);ports.phase6Metric(r,'fundedCasts',1);r.mp-=cost;cast=true;");
 s=rep(s,"r.mp-=cost;ports.phase6Metric(r,'manaSpent',cost);ports.phase6Metric(r,'infusionActivations',1);","r.mp-=cost;ports.phase6Metric(r,'stage648ManaInfusionSpent',cost);ports.phase6Metric(r,'manaSpent',cost);ports.phase6Metric(r,'infusionActivations',1);");
 s=rep(s,"b.runtime.lastSpellAt=ctx.now;ports.phase6Metric(r,'manaSpent',cost);","b.runtime.lastSpellAt=ctx.now;ports.phase6Metric(r,'stage648ManaElementalSpent',cost);ports.phase6Metric(r,'manaSpent',cost);");
 return s;
}
function magicTalent(element){
 const skill={arcane:'arcane_resonance',fire:'kindling',frost:'deep_winter',lightning:'overcharge'}[element];
 let t=buy(['arcane_focus','mana_spring','element_choice',skill],{xp:POINTS*T.POINT_XP,element:element==='arcane'?undefined:element});
 for(let pass=0;pass<POINTS&&t.nodes.length<POINTS;pass++){
  let changed=false;for(const n of T.NODES){if(t.nodes.length>=POINTS)break;if(n.family!=='arcane'||t.nodes.includes(n.id)||n.element&&n.element!==element||n.advanced)continue;const next=T.allocate(t,n.id);if(next){t=next;changed=true;}}
  if(!changed)break;
 }
 assert(T.valid(t));assert.equal(t.nodes.length,POINTS);assert.equal(t.element||'arcane',element);return t;
}
function cell(w,mode,sc,i,audit=false,research={}){
 const [weapon,offhandType,armorType]=W[w],family=MAGIC.includes(mode)?'arcane':'decay',t=research.talents||(family==='arcane'?magicTalent(mode):C.talent('decay'));
 const build={id:'controlled-'+family+'-'+w,weapon,families:research.families||[family],skills:[],...(family==='arcane'?{element:mode}:{})};
 const opts={mode:'encounter',points:POINTS,gear:'current',rarity:'Rare',runes:false,contracts:'none',targetPolicy:'mechanics',measure:true,tickLimit:6500,lockScenarioStreams:true,controlledTalents:t,armorType,offhandType,...(family==='decay'?{stage648c1BuildcraftSource:rotSource(mode)}:{}),...(audit?{stage648c2eManaRuntimeSource:manaRuntime(),stage648ManaAudit:true}:{}),...(research.buildcraftSource?{stage648c1BuildcraftSource:research.buildcraftSource}:{}),...(research.gearSource?{stage648c2cGearStatsSource:research.gearSource}:{})};
 const x=S.encounter(10,build,64823000+i*101,sc.kind,opts,undefined,undefined,'blood',1,sc.size);
 assert.equal(x.pointsSpent,POINTS);assert.equal(x.offhandType,offhandType);assert.deepEqual(x.controlledTalentNodes,t.nodes);assert(x.won||x.died||x.timedOut);
 const d=x.decayTalentMetrics||{},m=x.affinityMetrics||{},ledger=x.manaAudit;
 if(audit){assert(ledger);assert(Math.abs(ledger.residual)<1e-6,'Mana conservation');assert(ledger.regenWasted>=-1e-6&&ledger.refundWasted>=-1e-6);}
 return {w,mode,scenario:sc.id,trial:i,seed:x.resolvedSeed,gear:x.gearFingerprint,roster:x.roster,nodes:x.controlledTalentNodes,stats:x.heroBaseStats,won:x.won,died:x.died,timeout:x.timedOut,seconds:x.seconds,damage:x.damageDealt,dps:x.seconds?x.damageDealt/x.seconds:0,rot:d.decayPrimaryPaidDiagnosticAllRotDamage||0,apps:d.decayPrimaryPaidApplications||0,rawStack:d.decayPrimaryPaidDiagnosticRawPerStack||0,rawTick:d.decayPrimaryPaidStageERawPrimaryTick||0,stackSeconds:d.decayPrimaryPaidStageEStackSeconds||0,rotTicks:d.decayPrimaryPaidStageETickCount||0,stackHistogram:Array.from({length:7},(_,i)=>d['decayPrimaryPaidStageETicksAt'+i]||0),cap:d.decayPrimaryPaidPersistentPrimaryCapReached||0,capSeconds:d.decayPrimaryPaidPersistentPrimaryCapSeconds||0,cycle:d.corruptionCycleActivations||0,cycleDamage:d.corruptionCycleDamage||0,nova:d.corruptionNovaDamage||0,secondary:x.secondaryTargetDamage,mpStart:x.mpStart,mpEnd:x.mpEnd,mpMax:x.mpMax,paid:m.manaSpent||0,funded:x.fundedCasts,unfunded:x.unfundedCasterAttacks,starved:m.manaStarvedSeconds||0,ledger,focus:Object.fromEntries(Object.entries(d).filter(([k])=>k.startsWith('decayPrimaryPaidStageE1Focus'))),stageE2:Object.fromEntries(Object.entries(d).filter(([k])=>k.startsWith('decayPrimaryPaidStageE2')))};
}
function pair(a,b){for(const k of ['w','scenario','trial','seed','gear','roster','nodes','stats'])assert.deepEqual(a[k],b[k],'paired '+k);}
function parity(a,b){pair(a,b);for(const k of ['won','died','timeout','seconds','damage','rot','apps','mpStart','mpEnd','paid','funded','unfunded'])assert.equal(a[k],b[k],'observer changed '+k);}
function write(p,x){fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,JSON.stringify(x,null,2)+'\n');}
function run(id,smoke=false){
 assert(IDS.includes(id));const [kind,key]=id.split(':'),rows=[];
 const variants=kind==='rot'?Object.keys(W).map(w=>[w,key]):[[key.split('-')[1],key.startsWith('newdecay-')?'rot4':key.startsWith('decay-')?'native':key.split('-')[0]]];
 for(const [w,mode] of variants)for(const sc of SC)for(let i=0;i<(smoke?1:N);i++){
  const row=cell(w,mode,sc,i,kind==='mana');rows.push(row);
  if(smoke&&kind==='mana')parity(cell(w,mode,sc,i,false),row);
 }
 if(!smoke)write('reports/stage648c2e/'+id.replace(':','-')+'.json',{id,complete:true,source:S.sourceFingerprint().sha256,rows});
 console.log('STAGE648C2E_SHARD='+JSON.stringify({id,smoke,summary:summary(rows)}));
}
function summary(a){
 const sum=k=>a.reduce((n,x)=>n+(x[k]||0),0),n=a.length,sec=sum('seconds'),apps=sum('apps'),cap=sum('cap'),ticks=sum('rotTicks'),mean=k=>sum(k)/n;
 const led=k=>a.reduce((n,x)=>n+(x.ledger?.[k]||0),0),metric=k=>a.reduce((n,x)=>n+(x.ledger?.metrics?.[k]||0),0);
 return {n,wins:a.filter(x=>x.won).length,winPct:100*a.filter(x=>x.won).length/n,timeouts:a.filter(x=>x.timeout).length,seconds:sec/n,dps:mean('dps'),rotDps:sec?sum('rot')/sec:0,appsPerMinute:sec?60*apps/sec:0,meanStack:apps?sum('rawStack')/apps:null,meanPrimaryTick:ticks?sum('rawTick')/ticks:null,meanPrimaryStacks:ticks?sum('stackSeconds')/ticks:null,stackHistogram:Array.from({length:7},(_,i)=>a.reduce((n,r)=>n+r.stackHistogram[i],0)),cap,capSeconds:cap?sum('capSeconds')/cap:null,cycle:sum('cycle'),cycleDps:sec?sum('cycleDamage')/sec:0,novaDps:sec?sum('nova')/sec:0,secondaryDps:sec?sum('secondary')/sec:0,meanAP:a.reduce((n,x)=>n+x.stats.attack,0)/n,meanSP:a.reduce((n,x)=>n+x.stats.spellPower,0)/n,meanAS:a.reduce((n,x)=>n+x.stats.attacksPerSec,0)/n,meanRegen:a.reduce((n,x)=>n+x.stats.manaRegen,0)/n,mpStart:mean('mpStart'),mpEnd:mean('mpEnd'),mpMax:mean('mpMax'),endPct:a.reduce((n,x)=>n+(x.mpMax?100*x.mpEnd/x.mpMax:0),0)/n,paid:mean('paid'),paidPerSecond:sec?sum('paid')/sec:0,funded:mean('funded'),unfunded:mean('unfunded'),starvedSeconds:mean('starved'),...(a[0].ledger?{minMana:led('min')/n,regenPotential:led('regenPotential')/n,regenActual:led('regen')/n,regenWasted:led('regenWasted')/n,refundPotential:led('refundPotential')/n,refundActual:led('refundActual')/n,refundWasted:led('refundWasted')/n,otherGain:led('otherGain')/n,otherLoss:led('otherLoss')/n,atCapPct:100*led('atCapSeconds')/sec,belowOneSeconds:led('belowOneSeconds')/n,weaponPaid:metric('stage648ManaWeaponSpent')/n,infusionPaid:metric('stage648ManaInfusionSpent')/n,elementalPaid:metric('stage648ManaElementalSpent')/n,darkPaid:metric('stage648ManaDarkSpent')/n,darkDenied:metric('stage648ManaDarkDenied')/n}: {})};
}
function aggregate(){
 const all=IDS.map(id=>{const x=JSON.parse(fs.readFileSync('reports/stage648c2e/'+id.replace(':','-')+'.json','utf8'));assert(x.complete&&x.id===id);assert.equal(x.rows.length,(id.startsWith('rot:')?6:1)*SC.length*N);assert.equal(new Set(x.rows.map(r=>r.w+'/'+r.scenario+'/'+r.trial)).size,x.rows.length);return x;});
 assert.equal(new Set(all.map(x=>x.source)).size,1);const base=all.find(x=>x.id==='rot:native').rows;
 for(const a of all.filter(x=>x.id.startsWith('rot:')))a.rows.forEach((r,i)=>pair(base[i],r));
 for(const a of all.filter(x=>/^mana:(new)?decay-/.test(x.id))){
  const control=all.find(x=>x.id==='rot:'+(a.id.startsWith('mana:newdecay-')?'rot4':'native')).rows.filter(r=>r.w===a.rows[0].w);
  a.rows.forEach((r,i)=>parity(control[i],r));
 }
 const report={stage:'6.48C.2E',fights:all.reduce((n,x)=>n+x.rows.length,0),source:all[0].source,rot:{},mana:{}};
 for(const a of all){const g=a.id.startsWith('rot:')?report.rot:report.mana;g[a.id.split(':')[1]]={overall:summary(a.rows),byWeapon:Object.fromEntries([...new Set(a.rows.map(x=>x.w))].map(w=>[w,summary(a.rows.filter(x=>x.w===w))])),byScenario:Object.fromEntries(SC.map(sc=>[sc.id,summary(a.rows.filter(x=>x.scenario===sc.id))]))};}
 write('reports/v013-stage648c2e-rot-mana.json',report);
 console.log('STAGE648C2E_ROT='+JSON.stringify({fights:all.filter(x=>x.id.startsWith('rot:')).reduce((n,x)=>n+x.rows.length,0),modes:Object.fromEntries(Object.entries(report.rot).map(([k,v])=>[k,{overall:v.overall,weapons:Object.fromEntries(Object.entries(v.byWeapon).map(([w,a])=>[w,{wins:a.wins,dps:a.dps,rotDps:a.rotDps,appsPerMinute:a.appsPerMinute,meanStack:a.meanStack,meanPrimaryStacks:a.meanPrimaryStacks,cap:a.cap,cycle:a.cycle}])),scenarios:Object.fromEntries(Object.entries(v.byScenario).map(([k,a])=>[k,{n:a.n,wins:a.wins}]))}]))}));
 console.log('STAGE648C2E_MANA='+JSON.stringify({fights:all.filter(x=>x.id.startsWith('mana:')).reduce((n,x)=>n+x.rows.length,0),profiles:Object.fromEntries(Object.entries(report.mana).map(([k,v])=>[k,v.overall]))}));
}
if(require.main===module){const [cmd,id]=process.argv.slice(2);if(cmd==='run')run(id);else if(cmd==='smoke'){for(const id of IDS)run(id,true);}else if(cmd==='aggregate')aggregate();else throw Error('Unknown command');}
module.exports={rotSource,manaRuntime,weaponBase,magicTalent,ROT,IDS,SC,cell,summary};
