'use strict';
// Capture genuinely earned E10 states; no modified game source, synthetic XP,
// injected gear or forced unlocks. Separate, explicit capture populations.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const N=require('./v013-natural-progression.cjs'),D=require('./v013-stage628-postcap-difficulty.cjs'),S=require('./simulate-progression.cjs');
const CAP=require('./v013-capture-assistance.cjs');
const special={
 'arcane-decay-bloom':{name:'Magic + Decay caster',risk:0,targets:['arcane_focus','toxic_touch','hex_bolt','elemental_blight','grave_bloom'],families:['arcane','decay'],element:'arcane',armor:'Cloth',weapons:['Wand','Staff'],style:'focused',healAt:.72,retreatAt:.46,target:'mechanics',shop:true,researchGearPreference:true,preparedTargets:['grave_bloom']},
 'arcane-decay-infusion':{name:'Magic + Decay physical Infusion',risk:0,targets:['arcane_focus','toxic_touch','hex_bolt','elemental_blight','grave_bloom'],families:['arcane','decay'],element:'arcane',armor:'Leather',weapons:['Sword'],offhands:['Tome'],style:'focused',healAt:.72,retreatAt:.46,target:'mechanics',shop:true,researchGearPreference:true,preparedTargets:['grave_bloom']}
};
function profileFor(id){const p=special[id]||N.PROFILES[id];if(!p)throw Error('Unknown capture profile '+id);return p;}
function capture(profileId,mode,seeds,out){
 const policy=CAP.policy(mode),profile=profileFor(profileId),accounts=[];
 for(const seed of seeds){
  let snap=null,acc=null;
  try{
   acc=N.simulateAccount(seed,profileId,{...N.DEFAULTS,maxLevel:10,maxAttempts:24,maxTotalAttempts:216},{researchProfiles:{[profileId]:profile},decisionModel:'adaptive',captureMode:mode,stopAtCampLevel:10,onCamp:probe=>{
    if(probe.level===10&&probe.attempt===1){
     if(snap)throw Error('Duplicate E10 camp');
     snap=D.checkpoint(probe,[10]);
    }
   }});
   if(acc.attempts.some(a=>a.level>=10))throw Error('Capture attempted E10 instead of stopping at camp');
   const errors=acc.attempts.filter(a=>a.error&&a.error!=='Native combat timeout');
   if(errors.length)throw Error('Native account failure: '+errors.map(a=>a.error).join('; '));
   const fights=acc.attempts.flatMap(a=>a.rooms||[]),scaled=fights.reduce((n,r)=>n+(r.captureAssistance?.scaledActors||0),0);
   if(mode==='natural'&&scaled!==0)throw Error('Natural cohort unexpectedly scaled actors');
   if(mode==='assisted'&&fights.length&&!scaled)throw Error('Assisted cohort never applied policy');
   accounts.push({seed,snapshot:snap,reachedE10:!!snap,attempts:acc.attempts.length,endLevel:acc.endLevel,stopReason:acc.stopReason,scaledActors:scaled,fights:fights.length,errors:acc.attempts.filter(a=>a.error).map(a=>a.error),weapon:snap?.state.equip.weapon?.subtype||null,offhand:snap?.state.equip.offhand?.subtype||null,points:snap?.talentSpent||0});
  }catch(e){accounts.push({seed,snapshot:null,reachedE10:false,attempts:acc?.attempts?.length||0,endLevel:acc?.endLevel||null,error:String(e.stack||e).slice(0,2000)});}
 }
 const result={stage:'6.47C',phase:'capture',profileId,captureMode:mode,policy,source:S.sourceFingerprint().sha256,accounts};
 fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(result,null,2));
 console.log('CAPTURE647C='+JSON.stringify({profileId,mode,accounts:accounts.map(({snapshot,...x})=>x)}));
 return result;
}
function main(){
 const [profile,mode,shardText,out]=process.argv.slice(2),shard=Number(shardText);
 if(!Number.isInteger(shard)||shard<0||shard>49||!out)throw Error('Invalid shard/output');
 // Two independent accounts per shard, same account seeds for both cohorts.
 capture(profile,mode,[12001+2*shard,12002+2*shard],out);
}
if(require.main===module)main();
module.exports={capture,profileFor};
