'use strict';
// Genuine E1-born E10 checkpoints; study Blood/Decay Rot spread and Arcane/Decay
// Grave Bloom without injected points, gear, victories, or combat-stat changes.
const fs=require('node:fs'),path=require('node:path');
const N=require('./v013-natural-progression.cjs');
const D=require('./v013-stage628-postcap-difficulty.cjs');
const A=require('./v013-stage639-earned-aoe-comparison.cjs');
const S=require('./simulate-progression.cjs');
const VARIANTS=Object.freeze({
 'decay-blood-spread':Object.freeze({
  name:'Decay + Blood DoT Spread E10 Research',risk:0,
  targets:['corrupting_touch','bleeding_edge','plague_spread'],
  families:['decay','blood'],armor:'Leather',weapons:['Sword','Daggers'],
  style:'focused',healAt:.72,retreatAt:.46,target:'mechanics',shop:true,
  researchGearPreference:true
 }),
 'arcane-decay-bloom':Object.freeze({
  name:'Magic + Decay Grave Bloom E10 Research',risk:0,
  targets:['arcane_focus','corrupting_touch','hex_bolt','elemental_blight','grave_bloom'],
  families:['arcane','decay'],element:'arcane',armor:'Cloth',weapons:['Wand','Staff'],
  style:'focused',healAt:.72,retreatAt:.46,target:'mechanics',shop:true,
  researchGearPreference:true
 })
});
const SEEDS=Object.freeze([9861,9863]),SIZES=Object.freeze([1,3,5,8,12]);
function sample(id,seed){
 if(!Object.hasOwn(VARIANTS,id)||!SEEDS.includes(seed))throw Error('Invalid E10 DoT research id/seed');
 const profile=VARIANTS[id];let snap=null;
 const a=N.simulateAccount(seed,id,{
  ...N.DEFAULTS,seeds:[seed],profiles:[id],maxLevel:10,maxAttempts:24,maxTotalAttempts:240
 },{researchProfiles:{[id]:profile},decisionModel:'adaptive',onCamp:probe=>{
  if(probe.level===10&&probe.attempt===1){
   if(snap)throw Error('Duplicate E10 research checkpoint');
   snap=D.checkpoint(probe,[10]);
  }
 }});
 const errors=a.attempts.filter(x=>x.error&&x.error!=='Native combat timeout');
 if(errors.length)throw Error('Native progression errors: '+errors.map(x=>x.error).join(' | '));
 const result={stage:'6.42',kind:'e10-dot-spread-earned',source:S.sourceFingerprint().sha256,
  id,seed,reachedE10:!!snap,highestUnlocked:a.endLevel,attempts:a.attempts.length,
  stopReason:a.stopReason,checkpoint:null,encounters:[]};
 if(!snap)return result;
 const nodes=[...snap.state.automaticTalents.nodes],skill=A.aoeState(snap);
 result.checkpoint={xp:snap.xp,points:snap.talentSpent,gearPieces:snap.equipPieces,
  weapon:snap.state.equip.weapon?.subtype||null,offhand:snap.state.equip.offhand?.subtype||null,
  nodes,prepared:snap.state.automaticTalents.prepared||null,
  hasPlagueSpread:nodes.includes('plague_spread'),
  hasGraveBloom:nodes.includes('grave_bloom'),
  actualAoE:skill.aoePotential};
 const first=nodes.find(x=>x.startsWith('affinity_'));
 const family=first?.slice(9)||'decay';
 for(let trial=0;trial<2;trial++)for(const size of SIZES){
  const seedFight=6425000+seed*19+trial*727;
  const r=D.native(snap,{id:'normal-'+size,type:'normal',realm:family,size},seedFight);
  result.encounters.push({trial,size,won:!!r.won,died:!!r.died,timeout:!!r.timedOut,
   secondaryDamage:r.secondaryTargetDamage||0,secondaryDotDamage:r.secondaryDotDamage||0,
   plagueSpreadTransfers:r.plagueSpreadTransfers||0,secondaryHits:r.secondaryTargetHits||0,
   totalDamage:r.damageDealt||0,periodicDamage:r.periodicDamage||0,
   seconds:r.seconds,initialRoles:r.initialRoles||{}});
 }
 return result;
}
if(require.main===module){
 try{
  const [id,seedArg,out]=process.argv.slice(2),seed=Number(seedArg);
  if(!out||!out.endsWith('.json'))throw Error('Usage: node v013-stage642-e10-dot-coverage.cjs BUILD SEED OUT.json');
  const r=sample(id,seed);
  fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(r,null,2)+'\n');
  console.log('STAGE642_DOT_E10='+JSON.stringify({id,seed,entered:r.reachedE10,
   exp:r.highestUnlocked,attempts:r.attempts,points:r.checkpoint?.points,
   plague:r.checkpoint?.hasPlagueSpread,bloom:r.checkpoint?.hasGraveBloom,
   totalSecondary:r.encounters.reduce((sum,x)=>sum+x.secondaryDamage,0),
   secondaryDot:r.encounters.reduce((sum,x)=>sum+x.secondaryDotDamage,0),
   spreadTransfers:r.encounters.reduce((sum,x)=>sum+x.plagueSpreadTransfers,0)}));
 }catch(e){console.error('STAGE642_DOT_ERROR '+String(e.stack||e));process.exitCode=1;}
}
module.exports={VARIANTS,SEEDS,SIZES,sample};
