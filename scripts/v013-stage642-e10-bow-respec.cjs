'use strict';
// Matched E10 Bow comparison: same genuinely earned XP/equipment, legal Talent
// respec, same combat RNG seeds. 100 repeats/size (two cohorts ×50).
// This is an E10 laboratory counterfactual, NOT a newly earned natural loadout.
const fs=require('node:fs'),path=require('node:path');
require('./v013-natural-progression.cjs');
const T=globalThis.WandererAutomaticTalents;
const P=require('./v013-build-planner.cjs');
const D=require('./v013-stage628-postcap-difficulty.cjs');
const S=require('./simulate-progression.cjs');
const SIZES=Object.freeze([4,8,12]),SEEDS=Object.freeze([9861,9863]),SHARDS=2,PER_SHARD=50;
function assert(ok,msg){if(!ok)throw Error(msg);}
function makeRespec(checkpoint){
 const old=checkpoint.state.automaticTalents;
 assert(T.valid(old),'Original earned TalentGraph invalid under repaired v15');
 const reset=T.reset(old);
 const plan=P.propose(T,reset,'fury-bow');
 const progress={...reset,nodes:plan.expectedNodes};
 if(plan.expectedElement&&plan.expectedElement!=='arcane')progress.element=plan.expectedElement;
 assert(T.valid(progress),'Illegal Bow research respec');
 assert(progress.xp===old.xp&&progress.nodes.length<=T.earned(old),'Minted Bow points');
 assert(progress.nodes.includes('bow_pierce'),'Deep Pierce still not purchased');
 assert(!old.nodes.includes('bow_pierce'),'This snapshot already had Deep Pierce');
 return {...checkpoint,talentSpent:progress.nodes.length,
  state:{...checkpoint.state,automaticTalents:progress}};
}
function sample(shard,snapFile,out){
 assert(Number.isInteger(shard)&&shard>=0&&shard<SHARDS,'Invalid shard');
 const raw=JSON.parse(fs.readFileSync(snapFile,'utf8'));
 assert(raw.profileId==='smart-fury-bow'&&raw.accounts.length===2,'Unexpected Bow checkpoints');
 const actors=raw.accounts.filter(x=>x.snapshot);
 assert(actors.length===2,'Need two independently earned Bow E10 checkpoints');
 for(const a of actors)assert(a.snapshot.state.equip.weapon?.subtype==='Bow','Not a Bow');
 const rows=[],stats=[];
 const before=actors.map(a=>a.snapshot),after=before.map(makeRespec);
 for(let i=0;i<2;i++)stats.push({seed:actors[i].seed,weapon:before[i].state.equip.weapon.subtype,
  earnedXP:before[i].xp,earnedPoints:before[i].talentEarned,
  oldNodes:before[i].state.automaticTalents.nodes.length,
  newNodes:after[i].state.automaticTalents.nodes.length,
  ability:after[i].state.automaticTalents.nodes.includes('bow_pierce'),
  equipmentHash:before[i].fingerprint});
 for(let j=0;j<PER_SHARD;j++){
  const k=shard*PER_SHARD+j,idx=k%2,seed=6430000+k*101;
  for(const size of SIZES){
   const scenario={id:'normal-'+size,type:'normal',size,realm:'blood'};
   const a=D.native(before[idx],scenario,seed),b=D.native(after[idx],scenario,seed);
   assert(a.won||a.died||a.timedOut,'Unresolved before Bow fight');
   assert(b.won||b.died||b.timedOut,'Unresolved after Bow fight');
   assert(a.gearFingerprint===b.gearFingerprint,'Earned weapon/gear drift');
   assert(a.talentXp===b.talentXp&&a.talentPointsEarned===b.talentPointsEarned,'XP budget drift');
   assert(JSON.stringify(a.initialRoles)===JSON.stringify(b.initialRoles),'Mob roster role drift');
   assert(JSON.stringify(a.roster)===JSON.stringify(b.roster),'Enemy roster and stats drift');
   rows.push({k,seed,naturalSeed:actors[idx].seed,size,
    before:{won:!!a.won,died:!!a.died,timeout:!!a.timedOut,
     secondary:a.secondaryTargetDamage||0,damage:a.damageDealt||0,seconds:a.seconds},
    after:{won:!!b.won,died:!!b.died,timeout:!!b.timedOut,
     secondary:b.secondaryTargetDamage||0,damage:b.damageDealt||0,seconds:b.seconds}});
  }
 }
 const data={stage:'6.42',kind:'matched-earned-bow-respec',source:S.sourceFingerprint().sha256,
  shard,stats,rows};
 fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(data,null,2)+'\n');
 console.log('STAGE642_BOW_RESPEC='+JSON.stringify({shard,stats:stats.map(x=>({seed:x.seed,xp:x.earnedXP,points:x.earnedPoints,unlocked:x.ability})),
  groups:Object.fromEntries(SIZES.map(size=>{
   const rr=rows.filter(x=>x.size===size);
   return [size,{fights:rr.length,before:rr.filter(x=>x.before.won).length,
    after:rr.filter(x=>x.after.won).length,
    oldSecondary:rr.reduce((a,x)=>a+x.before.secondary,0),
    newSecondary:rr.reduce((a,x)=>a+x.after.secondary,0)}];
  }))}));
}
function aggregate(dir,out){
 const files=fs.readdirSync(dir).filter(x=>/^bow-respec-[01]\.json$/.test(x));
 assert(files.length===2,'Need both replay shards');
 const pieces=files.map(f=>JSON.parse(fs.readFileSync(path.join(dir,f),'utf8')));
 assert(new Set(pieces.map(x=>x.source)).size===1&&new Set(pieces.map(x=>x.shard)).size===2,'Mixed source or shard');
 const rows=pieces.flatMap(p=>p.rows);
 const groups=SIZES.map(size=>{
  const r=rows.filter(x=>x.size===size);assert(r.length===100,'Incomplete Bow cohort');
  const wins=which=>r.filter(x=>x[which].won).length;
  const total=which=>r.reduce((acc,x)=>acc+x[which].secondary,0);
  return {size,n:100,winBefore:wins('before'),winAfter:wins('after'),
   secondaryBefore:total('before'),secondaryAfter:total('after'),
   timeoutsBefore:r.filter(x=>x.before.timeout).length,
   timeoutsAfter:r.filter(x=>x.after.timeout).length};
 });
 const result={source:pieces[0].source,method:'Same earned E10 XP/gear and enemy seeds; legal reset-and-repurchase only',groups};
 fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n');
 console.log('STAGE642_BOW_RESPEC_SUMMARY='+JSON.stringify(result));
}
if(require.main===module){
 try{
  const [mode,...args]=process.argv.slice(2);
  if(mode==='sample'&&args.length===3)sample(Number(args[0]),args[1],args[2]);
  else if(mode==='aggregate'&&args.length===2)aggregate(...args);
  else throw Error('Usage: sample SHARD SNAPSHOT OUT | aggregate IN_DIR OUT');
 }catch(e){console.error('STAGE642_BOW_RESPEC_ERROR '+String(e.stack||e));process.exitCode=1;}
}
module.exports={makeRespec,sample,aggregate};
