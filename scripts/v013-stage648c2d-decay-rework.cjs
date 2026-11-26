'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const S=require('./simulate-progression.cjs'),P=require('./v013-stage648c2b-persistent-corruption.cjs'),C=require('./v013-stage648c2c-offensive-scaling.cjs');
const WEAPONS={
 daggers:{weapon:'Daggers',offhandType:'Off-Hand Dagger',armorType:'Leather'},
 sword:{weapon:'Sword',offhandType:'Shield',armorType:'Plate'},
 twohand:{weapon:'Two-Handed',offhandType:null,armorType:'Plate'},
 bow:{weapon:'Bow',offhandType:null,armorType:'Leather'},
 wand:{weapon:'Wand',offhandType:'Tome',armorType:'Cloth'},
 staff:{weapon:'Staff',offhandType:null,armorType:'Cloth'}
};
const MODES=['native','persistent','max','sum','hybrid','clock','cap-one','cap-three','cap-none','cap-one-speed','cap-one-attack','cap-one-spell'];
const SCENARIOS=[{id:'solo',kind:'normal',size:1},{id:'group4',kind:'normal',size:4},{id:'group8',kind:'normal',size:8},{id:'boss',kind:'boss'}];
const N=20,LEVEL=10,POINTS=24;
function replace(s,a,b){assert.equal(s.split(a).length,2,'anchor '+a.slice(0,100));return s.replace(a,b);}
function formulaSource(mode){
 assert(MODES.includes(mode));
 if(mode==='native')return P.diagnosticSource('baseline');
 let s=P.diagnosticSource('persistent-after');
 if(mode==='persistent')return s;
 const formula=mode==='max'?'0.10*Math.max(ap,sp)':mode==='sum'?'0.08*(ap+sp)':'0.10*Math.max(ap,sp)+0.03*Math.min(ap,sp)';
 s=replace(s,'function applyRot(b,c,power,origin=null){','function stage648c2dPower(c){const ap=Math.max(0,Number(c.player.stats?.attack)||0),sp=Math.max(0,Number(c.player.stats?.spellPower)||0);return '+formula+';}\nfunction applyRot(b,c,power,origin=null){');
 const original=" if(rank(b,'corrupting_touch')&&(c.player?.mp||0)>=1&&(b.cooldowns.corruptingTouch??-1e10)<=c.now&&c.random()<values('corrupting_touch',rank(b,'corrupting_touch')).chance&&spendDarkMana(c,1)&&ready(b,'corruptingTouch',c.now,1.3)&&activated(b,'corrupting_touch'))applyRot(b,c,base*.065+Math.max(0,c.power||0)*.025,'paid_primary_corrupting_touch');";
 const revised=original.replace('base*.065+Math.max(0,c.power||0)*.025','stage648c2dPower(c)');
 const clock=mode==='clock'||mode.startsWith('cap-');
 if(clock){
  s=replace(s,original,'');
  // A single target-independent opportunity per native second, on the current target.
  // Preserve cost, ICD and rank scaling; no off-hand / extra-attack opportunities.
  const tick='const e=migrateEnemyDots(c.enemy);corruptionNova(b,c);if(e.hp>0)tickRot(b,c);';
  const chance="Math.min(.95,values('corrupting_touch',rank(b,'corrupting_touch')).chance*.75)";
  const pulse=revised.replace("if(rank(b,'corrupting_touch')","if(e.hp>0&&c.player.hp>0&&rank(b,'corrupting_touch')").replace("values('corrupting_touch',rank(b,'corrupting_touch')).chance",chance);
  s=replace(s,tick,tick+'\n'+pulse);
 }else s=replace(s,original,revised);
 if(mode.startsWith('cap-')){
  // Only paid primary stacks qualify; propagated / free stacks cannot fund the burst.
  s=replace(s,'const stacks=e.v012Rot?.length||0;const m=','const stacks=(e.v012Rot||[]).filter(primaryPaidRot).length;const m=');
  s=replace(s,'else if(stacks<3)m(', "else if(stacks<6)m(");
  s=replace(s,'e.v012Rot?.length>=3',"(e.v012Rot||[]).filter(primaryPaidRot).length>=6");
  const old="const rot=e.v012Rot.shift(),remaining=rot.damage*rot.remaining,raw=remaining+Math.max(0,c.power||0)*.20;";
  const consume=mode==='cap-none'?0:mode==='cap-three'?3:1;
  const code="const paid=e.v012Rot.filter(primaryPaidRot),spent=paid.slice(0,"+consume+");"+
   (consume?"e.v012Rot=e.v012Rot.filter(d=>!spent.includes(d));":"")+
   "const remaining="+(consume===0?"paid.reduce((n,d)=>n+d.damage,0)":consume===3?"spent.reduce((n,d)=>n+d.damage*2,0)":"spent.reduce((n,d)=>n+d.damage*d.remaining,0)")+
   ",raw=remaining+Math.max(0,c.power||0)*.20;c.metric?.('decayPrimaryPaidStageDConsumed',spent.length);";
  s=replace(s,old,code);
 }
 return s;
}
function statArm(mode){return mode==='cap-one-speed'?'speed':mode==='cap-one-attack'?'attack':mode==='cap-one-spell'?'spell':'base';}
function write(file,data){fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(data,null,2)+'\n');}
function runCell(mode,w,sc,i){
 const cfg=WEAPONS[w],t=C.talent('decay'),build={id:'controlled-decay-'+w,weapon:cfg.weapon,families:['decay'],skills:[]};
 const opts={mode:'encounter',points:POINTS,gear:'current',rarity:'Rare',runes:false,contracts:'none',targetPolicy:'mechanics',measure:true,tickLimit:6500,lockScenarioStreams:true,controlledTalents:t,armorType:cfg.armorType,offhandType:cfg.offhandType,stage648c2cGearStatsSource:C.statSource(statArm(mode)),stage648c1BuildcraftSource:formulaSource(mode)};
 const x=S.encounter(LEVEL,build,64823000+i*101,sc.kind,opts,undefined,undefined,'blood',1,sc.size);
 assert.equal(x.pointsSpent,POINTS);assert.equal(x.level,LEVEL);assert.equal(x.offhandType,cfg.offhandType);
 assert.deepEqual(x.controlledTalentNodes,t.nodes);
 assert(x.won||x.died||x.timedOut);
 const m=x.affinityMetrics||{},d=x.decayTalentMetrics||{};
 assert((d.corruptionCycleActivations||0)<=(d.corruptionCycleDiagnosticEligible||0));
 const n=d.decayPrimaryPaidApplications||0,raw=d.decayPrimaryPaidDiagnosticRawPerStack||0;
 return {mode,w,scenario:sc.id,trial:i,seed:x.resolvedSeed,gear:x.gearFingerprint,roster:x.roster,nodes:x.controlledTalentNodes,stats:x.heroBaseStats,won:x.won,died:x.died,timeout:x.timedOut,seconds:x.seconds,damage:x.damageDealt,dps:x.seconds>0?x.damageDealt/x.seconds:0,rot:d.decayPrimaryPaidDiagnosticAllRotDamage||0,cycle:d.corruptionCycleActivations||0,cycleDamage:d.corruptionCycleDamage||0,consumed:d.decayPrimaryPaidStageDConsumed||0,nova:d.corruptionNovaDamage||0,apps:n,rawStackSum:raw,attacks:m.attackCalls||0,healing:m.healingActual||0,mana:x.manaSpent,starved:m.manaStarvedSeconds||0,cap:d.decayPrimaryPaidPersistentPrimaryCapReached||0,capSeconds:d.decayPrimaryPaidPersistentPrimaryCapSeconds||0,secondary:x.secondaryTargetDamage,hpEnd:x.hpEnd,spread:d.contagiousTouchSpread||0,soul:d.soulDrainMana||0};
}
function verify(base,row){
 for(const k of ['w','scenario','trial','seed','gear','roster','nodes'])assert.deepEqual(row[k],base[k],'paired '+k);
 const target=C.ARMS[statArm(row.mode)];
 for(const [key,v] of Object.entries(base.stats)){
  if(key==='power')continue;
  const expected=key===target?(key==='attacksPerSec'?Math.min(4.2,v*1.25):v*1.25):v;
  assert.equal(row.stats[key],expected,'isolated stat '+key+' '+row.mode);
 }
}
function summary(a){
 const sum=k=>a.reduce((n,x)=>n+(x[k]||0),0),n=a.length,sec=sum('seconds'),apps=sum('apps'),cap=sum('cap'),cycle=sum('cycle');
 const rate=k=>sec?sum(k)/sec:0;
 return {n,wins:a.filter(x=>x.won).length,timeouts:a.filter(x=>x.timeout).length,winPct:100*a.filter(x=>x.won).length/n,dps:sum('dps')/n,rotPerSecond:rate('rot'),applicationsPerSecond:rate('apps'),meanAppliedStackDamage:apps?sum('rawStackSum')/apps:null,cycle,cyclePerSecond:rate('cycle'),cycleDamage:sum('cycleDamage'),cycleDamagePerSecond:rate('cycleDamage'),consumed:sum('consumed'),novaPerSecond:rate('nova'),manaPerSecond:rate('mana'),starvedSeconds:sum('starved')/n,cap,capMeanSeconds:cap?sum('capSeconds')/cap:null,spreadPerSecond:rate('spread'),soulPerSecond:rate('soul'),seconds:sec/n};
}
function run(mode,smoke=false){
 assert(MODES.includes(mode));new Function(formulaSource(mode));
 const rows=[],file='reports/stage648c2d/'+mode+'.json';
 for(const w of (smoke?['daggers','twohand','wand']:Object.keys(WEAPONS)))for(const sc of (smoke?SCENARIOS.slice(0,1):SCENARIOS))for(let i=0;i<(smoke?1:N);i++){
  rows.push(runCell(mode,w,sc,i));
  if(!smoke&&rows.length%80===0)write(file,{mode,complete:false,rows});
 }
 if(!smoke)write(file,{mode,complete:true,source:S.sourceFingerprint().sha256,rows});
 console.log('STAGE648C2D_ARM='+JSON.stringify({mode,smoke,...summary(rows)}));
}
function aggregate(){
 const all=MODES.map(mode=>{const x=JSON.parse(fs.readFileSync('reports/stage648c2d/'+mode+'.json','utf8'));assert(x.complete&&x.mode===mode);assert.equal(x.rows.length,Object.keys(WEAPONS).length*SCENARIOS.length*N);assert.equal(new Set(x.rows.map(r=>r.w+'/'+r.scenario+'/'+r.trial)).size,x.rows.length);return x;});
 assert.equal(new Set(all.map(x=>x.source)).size,1);
 const baseline=all.find(x=>x.mode==='persistent').rows;
 for(const a of all)for(let i=0;i<a.rows.length;i++)verify(baseline[i],a.rows[i]);
 const report={stage:'6.48C.2D.1',source:all[0].source,fights:all.reduce((n,x)=>n+x.rows.length,0),arms:{}};
 for(const a of all){const rows=a.rows;report.arms[a.mode]={overall:summary(rows),byWeapon:Object.fromEntries(Object.keys(WEAPONS).map(w=>[w,summary(rows.filter(x=>x.w===w))])),byScenario:Object.fromEntries(SCENARIOS.map(sc=>[sc.id,summary(rows.filter(x=>x.scenario===sc.id))])),lossToWin:rows.filter((x,i)=>x.won&&baseline[i].died).length,winToLoss:rows.filter((x,i)=>x.died&&baseline[i].won).length};}
 write('reports/v013-stage648c2d-decay-rework.json',report);
 console.log('STAGE648C2D='+JSON.stringify({fights:report.fights,arms:Object.fromEntries(Object.entries(report.arms).map(([k,v])=>[k,{overall:v.overall,byWeapon:Object.fromEntries(Object.entries(v.byWeapon).map(([w,x])=>[w,{wins:x.wins,dps:x.dps,rotPerSecond:x.rotPerSecond,applicationsPerSecond:x.applicationsPerSecond,meanAppliedStackDamage:x.meanAppliedStackDamage,cap:x.cap,cycle:x.cycle,cycleDamagePerSecond:x.cycleDamagePerSecond}])),byScenario:Object.fromEntries(Object.entries(v.byScenario).map(([w,x])=>[w,{wins:x.wins,n:x.n}])),lossToWin:v.lossToWin,winToLoss:v.winToLoss}]))}));
}
if(require.main===module){const [cmd,mode]=process.argv.slice(2);if(cmd==='run')run(mode);else if(cmd==='smoke')for(const m of MODES)run(m,true);else if(cmd==='aggregate')aggregate();else throw Error('Unknown command');}
module.exports={formulaSource,MODES,statArm,verify};
