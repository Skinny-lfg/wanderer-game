'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const S=require('./simulate-progression.cjs'),P=require('./v013-stage648c2b-persistent-corruption.cjs');
const {T,buy}=require('../tests/v013-current-talent-helper.cjs');
const WEAPONS={
 daggers:{weapon:'Daggers',offhandType:'Off-Hand Dagger',armorType:'Leather'},
 sword:{weapon:'Sword',offhandType:'Shield',armorType:'Plate'},
 twohand:{weapon:'Two-Handed',offhandType:null,armorType:'Plate'},
 bow:{weapon:'Bow',offhandType:null,armorType:'Leather'},
 wand:{weapon:'Wand',offhandType:'Tome',armorType:'Cloth'},
 staff:{weapon:'Staff',offhandType:null,armorType:'Cloth'}
};
const COHORTS=['blood','decay','persistent'].flatMap(f=>Object.keys(WEAPONS).map(w=>f+'-'+w));
const ARMS={base:null,speed:'attacksPerSec',attack:'attack',spell:'spellPower'};
const SCENARIOS=[{id:'solo',kind:'normal',size:1},{id:'group4',kind:'normal',size:4},{id:'boss',kind:'boss'}];
const N=20,LEVEL=10,POINTS=24;
const GEAR=fs.readFileSync('combat/v012-gear-stats.js','utf8');
function statSource(arm){
 assert(Object.hasOwn(ARMS,arm));if(arm==='base')return GEAR;
 const k=ARMS[arm],anchor='result.power=power(result);';
 assert.equal(GEAR.split(anchor).length,2);
 return GEAR.replace(anchor,(k==='attacksPerSec'?'result.attacksPerSec=Math.min(4.2,result.attacksPerSec*1.25);':'result.'+k+'=result.'+k+'*1.25;')+anchor);
}
function talent(family){
 const f=family==='blood'?'blood':'decay';
 const ids=f==='blood'?['accelerated_bleeding','third_cut','blood_harvest']:['corruption_cycle','corruption_nova','soul_drain'];
 const t=buy(ids,{xp:POINTS*T.POINT_XP});
 assert(T.valid(t));assert.equal(T.earned(t),POINTS);assert(t.nodes.includes('affinity_'+f));
 assert(t.nodes.every(id=>!id.startsWith('affinity_')||id==='affinity_'+f));
 // Fill only purchasable neutral / same-family nodes; avoid introducing a second affinity.
 let result=t;
 for(let pass=0;pass<POINTS&&result.nodes.length<POINTS;pass++){
  let changed=false;
  for(const n of T.NODES){if(result.nodes.length>=POINTS)break;
   if(n.family&&n.family!==f||result.nodes.includes(n.id)||n.id.startsWith('affinity_')&&n.id!=='affinity_'+f)continue;
   const next=T.allocate(result,n.id);if(next){result=next;changed=true;}
  }if(!changed)break;
 }
 assert(T.valid(result));assert.equal(result.nodes.length,POINTS);
 assert(result.nodes.every(id=>!id.startsWith('affinity_')||id==='affinity_'+f));
 return result;
}
function write(file,data){fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(data,null,2)+'\n');}
function runCell(id,sc,i,arm){
 const [f,w]=id.split('-'),cfg=WEAPONS[w],t=talent(f),family=f==='blood'?'blood':'decay';
 const build={id:'controlled-'+family+'-'+w,weapon:cfg.weapon,families:[family],skills:[]};
 const opts={mode:'encounter',points:POINTS,gear:'current',rarity:'Rare',runes:false,contracts:'none',targetPolicy:'mechanics',measure:true,tickLimit:6500,lockScenarioStreams:true,controlledTalents:t,armorType:cfg.armorType,offhandType:cfg.offhandType,stage648c2cGearStatsSource:statSource(arm),stage648c1BuildcraftSource:P.diagnosticSource(f==='persistent'?'persistent-after':'baseline')};
 const x=S.encounter(LEVEL,build,64823000+i*101,sc.kind,opts,undefined,undefined,'blood',1,sc.size);
 assert.equal(x.pointsSpent,POINTS);assert.equal(x.level,LEVEL);assert.equal(x.offhandType,cfg.offhandType);
 assert.deepEqual(x.controlledTalentNodes,t.nodes);
 assert(x.won||x.died||x.timedOut);
 const m=x.affinityMetrics||{},d=x.decayTalentMetrics||{};
 return {id,scenario:sc.id,trial:i,arm,seed:x.resolvedSeed,gear:x.gearFingerprint,roster:x.roster,nodes:x.controlledTalentNodes,stats:x.heroBaseStats,won:x.won,died:x.died,timeout:x.timedOut,seconds:x.seconds,damage:x.damageDealt,dps:x.seconds>0?x.damageDealt/x.seconds:0,periodic:m.dotDamageActual||0,rot:d.decayPrimaryPaidDiagnosticAllRotDamage||0,cycle:d.corruptionCycleActivations||0,cycleDamage:d.corruptionCycleDamage||0,nova:d.corruptionNovaDamage||0,rotApplications:d.decayPrimaryPaidApplications||0,bleedApplications:m.passiveActivations?.bleeding_edge||0,attacks:m.attackCalls||0,healing:m.healingActual||0,mana:x.manaSpent,starved:m.manaStarvedSeconds||0,cap:d.decayPrimaryPaidPersistentPrimaryCapReached||0,capSeconds:d.decayPrimaryPaidPersistentPrimaryCapSeconds||0,secondary:x.secondaryTargetDamage,hpEnd:x.hpEnd,passives:m.passiveActivations||{}};
}
function verify(base,row){
 for(const k of ['id','scenario','trial','seed','gear','roster','nodes'])assert.deepEqual(row[k],base[k],'paired '+k);
 const target=ARMS[row.arm];
 for(const [key,v] of Object.entries(base.stats)){
  if(key==='power')continue;
  const expected=key===target?(key==='attacksPerSec'?Math.min(4.2,v*1.25):v*1.25):v;
  assert.equal(row.stats[key],expected,'isolated stat '+key+' '+row.id+' '+row.arm);
 }
}
function run(id,smoke=false){
 assert(COHORTS.includes(id));const rows=[],file='reports/stage648c2c/'+id+'.json';
 for(const sc of (smoke?SCENARIOS.slice(0,1):SCENARIOS))for(let i=0;i<(smoke?1:N);i++){
  const base=runCell(id,sc,i,'base');rows.push(base);
  for(const arm of ['speed','attack','spell']){const row=runCell(id,sc,i,arm);verify(base,row);rows.push(row);}
 }
 if(!smoke)write(file,{id,complete:true,source:S.sourceFingerprint().sha256,rows});
 console.log('STAGE648C2C_COHORT='+JSON.stringify({id,smoke,fights:rows.length,summary:summarize(rows)}));
}
function summarize(rows){
 const means=(a,k)=>a.reduce((n,x)=>n+(x[k]||0),0)/a.length;
 const sum=(a,k)=>a.reduce((n,x)=>n+(x[k]||0),0);
 const arms={};for(const arm of Object.keys(ARMS)){
  const a=rows.filter(x=>x.arm===arm),b=rows.filter(x=>x.arm==='base');
  if(!a.length)continue;const byKey=new Map(b.map(x=>[x.scenario+'/'+x.trial,x]));
  const target=ARMS[arm],effective=target?a.map(x=>{const v=byKey.get(x.scenario+'/'+x.trial).stats[target];return v>0?100*(x.stats[target]/v-1):null;}).filter(x=>x!==null):[];
  const seconds=sum(a,'seconds'),baseSeconds=sum(b,'seconds');
  const perSecond=k=>seconds?sum(a,k)/seconds:0,basePerSecond=k=>baseSeconds?sum(b,k)/baseSeconds:0;
  arms[arm]={n:a.length,wins:a.filter(x=>x.won).length,timeouts:a.filter(x=>x.timeout).length,winPct:100*a.filter(x=>x.won).length/a.length,dps:means(a,'dps'),dpsPct:means(b,'dps')?100*(means(a,'dps')/means(b,'dps')-1):null,periodicPerSecond:perSecond('periodic'),periodicPct:basePerSecond('periodic')?100*(perSecond('periodic')/basePerSecond('periodic')-1):null,rotPerSecond:perSecond('rot'),rotPct:basePerSecond('rot')?100*(perSecond('rot')/basePerSecond('rot')-1):null,rotApplicationsPerSecond:perSecond('rotApplications'),bleedApplicationsPerSecond:perSecond('bleedApplications'),attackCallsPerSecond:perSecond('attacks'),cycle:sum(a,'cycle'),cycleDamage:sum(a,'cycleDamage'),nova:sum(a,'nova'),healingPerSecond:perSecond('healing'),manaPerSecond:perSecond('mana'),starvedSeconds:means(a,'starved'),cap:sum(a,'cap'),capMeanSeconds:sum(a,'cap')?sum(a,'capSeconds')/sum(a,'cap'):null,actualStatPct:effective.length?effective.reduce((n,x)=>n+x,0)/effective.length:null,zeroBaseStat:target?a.length-effective.length:0,baseAttack:means(a.map(x=>x.stats),'attack'),baseSpell:means(a.map(x=>x.stats),'spellPower'),baseSpeed:means(a.map(x=>x.stats),'attacksPerSec'),lossToWin:a.filter(x=>x.won&&byKey.get(x.scenario+'/'+x.trial).died).length,winToLoss:a.filter(x=>x.died&&byKey.get(x.scenario+'/'+x.trial).won).length};
 }
 return arms;
}
function aggregate(){
 const all=COHORTS.map(id=>{const x=JSON.parse(fs.readFileSync('reports/stage648c2c/'+id+'.json','utf8'));assert(x.complete&&x.id===id);assert.equal(x.rows.length,N*SCENARIOS.length*4);assert.equal(new Set(x.rows.map(r=>r.scenario+'/'+r.trial+'/'+r.arm)).size,x.rows.length);return x;});
 assert.equal(new Set(all.map(x=>x.source)).size,1);
 for(const w of Object.keys(WEAPONS)){
  const a=all.find(x=>x.id==='decay-'+w),b=all.find(x=>x.id==='persistent-'+w);
  for(let i=0;i<a.rows.length;i++)for(const k of ['scenario','trial','arm','seed','gear','roster','nodes','stats'])assert.deepEqual(a.rows[i][k],b.rows[i][k],'Decay matched mode '+k);
 }
 const report={stage:'6.48C.2C',source:all[0].source,fights:all.reduce((n,x)=>n+x.rows.length,0),cohorts:Object.fromEntries(all.map(x=>[x.id,{overall:summarize(x.rows),byScenario:Object.fromEntries(SCENARIOS.map(sc=>[sc.id,summarize(x.rows.filter(r=>r.scenario===sc.id))]))}]))};
 write('reports/v013-stage648c2c-offensive-scaling.json',report);
 // Keep log compact; full detailed rows and scenario report are artifacts.
 console.log('STAGE648C2C='+JSON.stringify({fights:report.fights,cohorts:Object.fromEntries(Object.entries(report.cohorts).map(([k,v])=>[k,v.overall]))}));
}
if(require.main===module){const [cmd,id]=process.argv.slice(2);if(cmd==='run')run(id);else if(cmd==='smoke')for(const x of ['blood-daggers','decay-twohand','persistent-wand'])run(x,true);else if(cmd==='aggregate')aggregate();else throw Error('Unknown command');}
module.exports={statSource,talent,COHORTS,ARMS,verify};
