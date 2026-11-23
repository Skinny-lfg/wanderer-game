'use strict';
// Stage 6.33: stat-only calibration in an isolated disposable native VM.
// The live game and published Pages keep their special-ability logic enabled.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const N=require('./v013-natural-progression.cjs');
const S=require('./simulate-progression.cjs');
const FILE='combat/expedition-progression.js';
const INPUT=fs.readFileSync(path.resolve(__dirname,'../'+FILE),'utf8');
const FLAG='const CALIBRATION_STAT_ONLY=false;';
if(INPUT.split(FLAG).length!==2)throw Error('Missing unique Stage 6.33 calibration toggle');
const STAT_ONLY_SOURCE=INPUT.replace(FLAG,'const CALIBRATION_STAT_ONLY=true;');
const TARGETS=['balanced','smart-magic-arcane-pure','smart-aegis-vitality'];
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
function run(opts={}){
 const {seed=6331,maxLevel=2,maxAttempts=6,maxTotalAttempts=18,
  out='reports/v013-stage633-stat-only-smoke.json'}=opts;
 if(!Number.isInteger(seed)||seed<1||seed>1000000||
  !Number.isInteger(maxLevel)||maxLevel<1||maxLevel>20||
  !Number.isInteger(maxAttempts)||maxAttempts<1||maxAttempts>36||
  !Number.isInteger(maxTotalAttempts)||maxTotalAttempts<1||maxTotalAttempts>400||
  !/^reports\/v013-stage633-[a-z0-9-]+\.json$/.test(out))throw Error('Unsafe calibration inputs');
 const accounts=TARGETS.map(profile=>{
  const settings={...N.DEFAULTS,seeds:[seed],profiles:[profile],maxLevel,
   maxAttempts,maxTotalAttempts};
  const run=N.run(settings,{decisionModel:'adaptive',
   moduleOverrides:{[FILE]:STAT_ONLY_SOURCE}});
  const a=run.accounts[0];
  if(run.accounts.length!==1||a.seed!==seed||a.profile!==profile)
   throw Error('Calibration account mismatched');
  const errors=a.attempts.filter(x=>x.error&&x.error!=='Native combat timeout');
  if(errors.length)throw Error('Unexpected stat-only native error '+JSON.stringify(errors.map(x=>x.error)));
  return {profile,seed,attempts:a.attempts.length,unlocked:a.endLevel,
   stopReason:a.stopReason,earnedXp:a.xp,errors:errors.length,
   rooms:a.attempts.flatMap(x=>x.rooms||[]).length,
   wins:a.attempts.filter(x=>x.bossWon).length,
   bossFights:a.attempts.flatMap(x=>x.rooms||[]).filter(r=>r.roomType==='boss').length};
 });
 const data={stage:'6.33',kind:'calibration-native-smoke',source:S.sourceFingerprint().sha256,
  policy:sha(STAT_ONLY_SOURCE),settings:{seed,maxLevel,maxAttempts,maxTotalAttempts},
  statOnly:true,noInventedXp:true,noInventedEquipment:true,
  accounts,caveats:[
   'Only the isolated VM disables enemy abilities, Boss modifiers, encounter Traits, Conditions and named enemy specials.',
   'Actual live game remains ability-enabled, and normal GitHub integration tests keep their native mechanics.',
   'Enemy identity bases are fixed and groups retain unscaled per-enemy stats in both native modes.',
   'These three short earned-account profiles are smoke coverage, not E2/E3 or E200 acceptance rates.',
   'No enemies, player items, XP, TalentGraph, rewards or native unlocks were fabricated.'
  ]};
 fs.mkdirSync(path.dirname(path.resolve(out)),{recursive:true});
 fs.writeFileSync(out,JSON.stringify(data,null,2)+'\n');
 console.log('STAGE633='+JSON.stringify(data.accounts));
 return data;
}
function cli(args){
 const out={};
 for(const arg of args){
  const m=/^--(seed|max-level|max-attempts|max-total-attempts|out)=(.+)$/.exec(arg);
  if(!m)throw Error('Invalid Stage 6.33 CLI '+arg);
  out[m[1].replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=m[1]==='out'?m[2]:Number(m[2]);
 }
 return out;
}
module.exports={FILE,INPUT,STAT_ONLY_SOURCE,TARGETS,run,cli};
if(require.main===module){try{run(cli(process.argv.slice(2)));}catch(e){console.error(String(e.stack||e));process.exitCode=1;}}
