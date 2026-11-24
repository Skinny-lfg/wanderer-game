'use strict';
// Stage 6.46 live-code replay. Never patch or replace the active engine.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
require('./v013-natural-progression.cjs');
const {respec,SCENARIOS}=require('./v013-stage645-blood-decay-piercing.cjs');
const D=require('./v013-stage628-postcap-difficulty.cjs'),S=require('./simulate-progression.cjs');
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const [profile,variant,shardArg,input,output]=process.argv.slice(2);
const shard=Number(shardArg),cfg=SCENARIOS[variant];
if(!cfg||![0,1].includes(shard))throw Error('Invalid replay variant or shard');
const capture=JSON.parse(fs.readFileSync(input,'utf8'));
if(capture.profileId!==profile||capture.phase!=='capture')throw Error('Mismatched capture');
const entries=capture.accounts.filter(x=>x.snapshot).map(x=>{
 const s=respec(x.snapshot,cfg);if(!s)return null;
 const p=s.state.automaticTalents;
 return {seed:x.seed,s,weapon:s.state.equip.weapon?.subtype,offhand:s.state.equip.offhand?.subtype||null,
  nodes:p.nodes,points:p.nodes.length,gear:hash(JSON.stringify(s.state.equip)),xp:p.xp};
}).filter(Boolean);
if(!entries.length)throw Error('No eligible E10 actors');
const rows=[],sizes=[1,4,8,12];
for(let i=0;i<50;i++){
 const j=50*shard+i,a=entries[j%entries.length],seed=6430000+j*101;
 for(const size of sizes){
  const x=D.native(a.s,{id:'normal-'+size,type:'normal',realm:'blood',size},seed);
  if(!(x.won||x.died||x.timedOut)||x.peakVisibleEnemies>4)throw Error('Unresolved encounter or arena overflow');
  rows.push({seed,actor:a.seed,size,won:!!x.won,timeout:!!x.timedOut,seconds:x.seconds,firstKill:x.firstKillSeconds,
   damage:x.damageDealt,secondary:x.secondaryTargetDamage,dot:x.secondaryDotDamage,mana:x.manaSpent,taken:x.damageTaken,
   effects:x.weaponStatusMetrics||{},roster:hash(JSON.stringify(x.roster)),gear:x.gearFingerprint,xp:x.talentXp});
 }
}
const result={stage:'6.46',profile,variant,shard,source:S.sourceFingerprint().sha256,entries:entries.map(({s,...e})=>e),rows};
fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n');
console.log('STAGE646_SHARD='+JSON.stringify({profile,variant,shard,source:result.source,groups:sizes.map(size=>{
 const a=rows.filter(r=>r.size===size);return {size,n:a.length,wins:a.filter(r=>r.won).length,timeouts:a.filter(r=>r.timeout).length,
  bursts:a.reduce((n,r)=>n+(r.effects.carrionBursts||0),0),gearStatus:a.reduce((n,r)=>n+(r.effects.secondaryEquipmentStatusApplied||0),0)};
})}));
