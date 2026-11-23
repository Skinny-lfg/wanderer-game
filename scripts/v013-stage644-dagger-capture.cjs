'use strict';
// Fresh E1-born E10 dual-dagger research capture using the native game progression
// and NO free XP, items, or enemy tuning. Different source provenance from Stage 6.42.
const fs=require('node:fs'),path=require('node:path');
const N=require('./v013-natural-progression.cjs');
const D=require('./v013-stage628-postcap-difficulty.cjs');
const S=require('./simulate-progression.cjs');
const profileId='smart-fury-daggers';
const native=N.PROFILES[profileId];
if(!native)throw Error('No native Dagger strategic profile');
const original={...native,plan:'fury-daggers',risk:0,healAt:.70,retreatAt:.45,shop:true,target:'mechanics',
 weapons:['Daggers'],researchGearPreference:true};
const seeds=[9861,9863,9871,9873],accounts=[];
for(const seed of seeds){
 let snapshot=null,result=null;
 try{
  const a=N.simulateAccount(seed,profileId,
   {...N.DEFAULTS,maxLevel:10,maxAttempts:24,maxTotalAttempts:240},
   {researchProfiles:{[profileId]:original},decisionModel:'adaptive',onCamp:probe=>{
     if(probe.level===10&&probe.attempt===1){if(snapshot)throw Error('Duplicate earned E10');snapshot=D.checkpoint(probe,[10]);}
   }});
  const errors=a.attempts.filter(x=>x.error&&x.error!=='Native combat timeout');
  if(errors.length)throw Error('Native account error '+errors.map(x=>x.error).join('; '));
  result={seed,reachedE10:!!snapshot,endLevel:a.endLevel,attempts:a.attempts.length,
   weapon:snapshot?.state.equip.weapon?.subtype||null,
   talentPoints:snapshot?.talentSpent||null,
   snapshot:snapshot?.state.equip.weapon?.subtype==='Daggers'?snapshot:null};
  if(snapshot&&snapshot.state.equip.weapon?.subtype!=='Daggers')result.note='E10 reached but original earned weapon is not Daggers';
 }catch(e){result={seed,reachedE10:false,error:String(e.stack||e).slice(0,1100),snapshot:null};}
 accounts.push(result);
 console.log('STAGE644_DAGGER_CAPTURE_PROGRESS='+JSON.stringify({seed,reached:result.reachedE10,weapon:result.weapon||null,points:result.talentPoints||null,error:result.error||null}));
}
const eligible=accounts.filter(a=>a.snapshot);
if(!eligible.length)throw Error('No independently earned E10 character using Daggers; cannot simulate Fan of Blades fairly');
const file=process.argv[2]||'reports/stage644/dagger-capture.json';
fs.mkdirSync(path.dirname(file),{recursive:true});
fs.writeFileSync(file,JSON.stringify({phase:'capture',profileId,source:S.sourceFingerprint().sha256,
 caveat:'New E1-born current-source Daggers account, NOT same 6.42 frozen source',
 accounts},null,2)+'\n');
console.log('STAGE644_DAGGER_CAPTURE='+JSON.stringify({eligible:eligible.length,
 actors:eligible.map(x=>({seed:x.seed,weapon:x.weapon,points:x.talentPoints})),
 attempted:seeds.length}));
