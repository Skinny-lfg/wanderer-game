'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const N=require('./v013-natural-progression.cjs'),M=require('./v013-stage647d9f-synergy.cjs'),D=require('./v013-stage628-postcap-difficulty.cjs');
const IDS=["smart-fury-daggers","smart-fury-bow","smart-blood-two-handed","decay-two-handed","decay-wand","decay-staff","decay-daggers","magic-daggers-infusion","aegis-mace-shield","aegis-wand-orb","vitality-staff"];
function identityProfile(id){
 const p=M.profile(id);
 return {...p,strictResearchIdentity:true,...(id==='smart-fury-daggers'?{offhands:['Daggers']}: {})};
}
function write(file,data){fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(data,null,2)+'\n');}
function read(dir,id){const a=fs.readdirSync(dir,{recursive:true}).filter(p=>path.basename(p)===id+'.json');assert.equal(a.length,1);return JSON.parse(fs.readFileSync(path.join(dir,a[0]),'utf8'));}
function identity(s,p){
 const e=s.equip;
 const armorSlots=['helm','armor','gloves','boots','belt'];
 const mismatches=['weapon','offhand',...armorSlots].filter(slot=>N.identityMatch(e[slot],p,slot)===false);
 return {weapon:e.weapon?.subtype||null,offhand:e.offhand?.subtype||null,armor:e.armor?.armorType||null,weaponMatch:N.identityMatch(e.weapon,p,'weapon'),offhandMatch:N.identityMatch(e.offhand,p,'offhand'),armorMatch:N.identityMatch(e.armor,p,'armor'),mismatches,element:s.automaticTalents.element||null,nodes:s.automaticTalents.nodes,prepared:s.automaticTalents.prepared||null};
}
function capture(id){
 assert(IDS.includes(id));const p=identityProfile(id),previous=read('input/earned',id),accounts=[],file='reports/stage648c1/'+id+'.json';
 assert.equal(previous.id,id);assert(previous.complete);assert.equal(previous.accounts.length,5);
 for(const seed of M.SEEDS){
  let snap=null,last=null,identityByLevel={};
  const acc=N.simulateAccount(seed,id,{...N.DEFAULTS,maxLevel:10,maxAttempts:24,maxTotalAttempts:216,tickLimit:6500},{researchProfiles:{[id]:p},decisionModel:'adaptive',moduleOverrides:{'combat/expedition-progression.js':M.candidateSource()},stopAtCampLevel:10,onCamp:probe=>{
   const state=probe.a.state();last=identity(state,p);identityByLevel[probe.level]=last;
   if(probe.level===10&&probe.attempt===1)snap=D.checkpoint(probe,[10]);
  }});
  const errors=acc.attempts.filter(x=>x.error).map(x=>({E:x.level,error:x.error}));
  const prior=previous.accounts.find(x=>x.seed===seed);assert(prior);
  accounts.push({seed,E:acc.endLevel,attempts:acc.attempts.length,stopReason:acc.stopReason,errors,previousE:prior.endLevel,previous:prior.snapshot?identity(prior.snapshot.state,p):null,last,identityByLevel,snapshot:snap});
  write(file,{id,complete:false,accounts});
  assert(!errors.some(x=>x.error!=='Native combat timeout'),JSON.stringify(errors));
 }
 write(file,{id,complete:true,accounts});
 console.log('STAGE648C1_CAPTURE='+JSON.stringify({id,accounts:accounts.map(({snapshot,identityByLevel,...a})=>({...a,reached:!!snapshot}))}));
}
function diagnosticSource(){
 const source=fs.readFileSync('combat/v012-buildcraft.js','utf8');
 const anchor=" if(specialized(b,'corruption_cycle')&&e.hp>0&&e.v012Rot?.length>=3&&(c.player?.mp||0)>=4&&(b.cooldowns.corruptionCycle??-1e10)<=c.now){";
 assert.equal(source.split(anchor).length,2);
 const before=" if(specialized(b,'corruption_cycle')){const stacks=e.v012Rot?.length||0;const m=(k,v=1)=>c.metric?.('corruptionCycleDiagnostic'+k,v);m('AttackChecks');m('Stacks'+Math.min(6,stacks));if(e.hp<=0)m('DeadTarget');else if(stacks<3)m('InsufficientStacks');else if((c.player?.mp||0)<4)m('InsufficientMana');else if((b.cooldowns.corruptionCycle??-1e10)>c.now)m('Cooldown');else m('Eligible');}";
 return source.replace(anchor,before+'\n'+anchor);
}
function diagnose(){
 const a=read('input/earned','decay-wand'),b=read('input/baseline','decay-wand'),actors=a.accounts.filter(x=>x.snapshot),source=diagnosticSource(),rows=[],file='reports/stage648c1-trigger.json';
 new Function(source);assert(b.complete);
 for(const cell of b.rows){
  const actor=actors.find(x=>x.seed===cell.actor);assert(actor);
  if(!actor.snapshot.state.automaticTalents.nodes.includes('corruption_cycle'))continue;
  const sc={id:'normal-'+cell.size,type:'normal',realm:'blood',size:cell.size,researchBuildcraftSource:source};
  const x=D.native(actor.snapshot,sc,64791000+cell.trial*101),old=cell.calibrated;
  for(const [v,w] of [[x.resolvedSeed,old.seed],[x.gearFingerprint,old.gear],[x.won,old.won],[x.died,old.died],[x.timedOut,old.timeout],[x.damageDealt,old.damage],[x.secondaryTargetDamage,old.secondary]])assert.equal(v,w,'diagnostic changed combat');
  const metrics=x.decayTalentMetrics||{};
  const get=k=>metrics['corruptionCycleDiagnostic'+k]||0;
  assert.equal(get('AttackChecks'),get('DeadTarget')+get('InsufficientStacks')+get('InsufficientMana')+get('Cooldown')+get('Eligible'));
  assert((metrics.corruptionCycleActivations||0)<=get('Eligible'));
  rows.push({trial:cell.trial,size:cell.size,actor:cell.actor,won:x.won,seconds:x.seconds,metrics});
 }
 assert.equal(rows.length,100);const sums={};for(const r of rows)for(const [k,v]of Object.entries(r.metrics))if(Number.isFinite(v))sums[k]=(sums[k]||0)+v;
 write(file,{rows,sums});console.log('STAGE648C1_TRIGGER='+JSON.stringify({fights:rows.length,sums}));
}
function aggregate(){
 const dir='reports/stage648c1',profiles=fs.readdirSync(dir).filter(x=>x.endsWith('.json')).map(x=>JSON.parse(fs.readFileSync(path.join(dir,x),'utf8')));
 const valid=profiles.filter(x=>x.complete);assert.equal(new Set(profiles.map(x=>x.id)).size,profiles.length);
 const missing=IDS.filter(id=>!valid.some(x=>x.id===id));const report={missing,profiles:valid.map(p=>({id:p.id,reached:p.accounts.filter(a=>a.snapshot).length,accounts:p.accounts.map(({snapshot,identityByLevel,...a})=>({...a,reached:!!snapshot}))}))};
 write('reports/v013-stage648c1-identity-summary.json',report);console.log('STAGE648C1_SUMMARY='+JSON.stringify(report));assert.equal(missing.length,0);
}
if(require.main===module){const [cmd,id]=process.argv.slice(2);if(cmd==='capture')capture(id);else if(cmd==='diagnose')diagnose();else if(cmd==='aggregate')aggregate();else throw Error('unknown command');}
module.exports={identityProfile,identity,diagnosticSource};
