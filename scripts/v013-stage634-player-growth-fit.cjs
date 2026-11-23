'use strict';
// Stage 6.34 — deterministic, auditable continuous enemy-reference fit to the
// 500 E1-born player-power observations from Stage 6.32.
// Calibrates HP/ATK growth only; the Boss/Elite win-rate hierarchy requires
// separate real native battles and must NEVER be inferred from this fit.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const INPUT=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../reports/v013-stage634-growth-input.json'),'utf8'));
const POLICY={initialReference:.775,lateLogGrowth:.014,
 earlyLogGrowthBoost:1.07777514,relaxationExpeditions:2.75370775};
function reference(E,params=POLICY){
 if(!Number.isInteger(E)||E<1)throw Error('Invalid Expedition');
 const x=E-1;
 return params.initialReference*Math.exp(params.lateLogGrowth*x+
  params.earlyLogGrowthBoost*(-Math.expm1(-x/params.relaxationExpeditions)));
}
function growthPair(E,params){
 const start=reference(E,params),end=reference(E+1,params);
 return {
  hp:Math.log((27+14*end)/(27+14*start)),
  attack:Math.log((4+3*end)/(4+3*start))
 };
}
function validate(input=INPUT){
 const c=input.cohort,t=input.transitions;
 if(input.inputStage!=='6.32'||c.accounts!==500||c.profiles!==100||c.seeds!==5||
  c.reachedE2!==398||c.reachedE20!==102||c.checkpoints!==3156||
  input.inputGitHubRun!==45174790906||input.inputGitHubArtifact!==14819297712||
  input.inputNativeSourceSHA256!=='53d39d733e18103d1c6e00ae254672e51c5141b6dd66d24d4a3663f78a4abdee'||
  !Array.isArray(t)||t.length!==19||t.some((r,i)=>r.from!==i+1||r.to!==i+2||
  !Number.isSafeInteger(r.paired)||r.paired<100||r.paired>500||
  !Number.isFinite(r.medianHpPct)||!Number.isFinite(r.medianAttackPct)))
  throw Error('Stage 6.32 earned cohort/provenance drift');
 for(let i=1;i<t.length;i++)if(t[i].paired>t[i-1].paired)
  throw Error('Inconsistent same-character paired coverage');
 return true;
}
function score(boost,tau,rate=POLICY.lateLogGrowth){
 if(!(boost>0&&tau>0&&rate>0))return Infinity;
 const params={initialReference:.775,lateLogGrowth:rate,
  earlyLogGrowthBoost:boost,relaxationExpeditions:tau};
 return INPUT.transitions.reduce((loss,row)=>{
  const r=growthPair(row.from,params),hp=Math.log1p(row.medianHpPct/100),
   attack=Math.log1p(row.medianAttackPct/100),weight=row.paired/500;
  return loss+weight*((r.hp-hp)**2+(r.attack-attack)**2);
 },0);
}
function golden(low,high,fn,iterations=54){
 const inv=(Math.sqrt(5)-1)/2;
 let c=high-inv*(high-low),d=low+inv*(high-low),
  fc=fn(c),fd=fn(d);
 for(let j=0;j<iterations;j++){
  if(fc<fd){high=d;d=c;fd=fc;c=high-inv*(high-low);fc=fn(c);}
  else{low=c;c=d;fc=fd;d=low+inv*(high-low);fd=fn(d);}
 }
 return (low+high)/2;
}
function fit(){
 validate();
 const optimizeBoost=tau=>golden(.05,4,boost=>score(boost,tau));
 const tau=golden(.60,15,t=>score(optimizeBoost(t),t));
 const boost=optimizeBoost(tau);
 return {lateLogGrowth:POLICY.lateLogGrowth,earlyLogGrowthBoost:boost,
  relaxationExpeditions:tau,weightedLogGrowthLoss:score(boost,tau),
  proposedWeightedLogGrowthLoss:score(POLICY.earlyLogGrowthBoost,POLICY.relaxationExpeditions)};
}
function diagnostics(){
 const fitted=fit(),levels=[1,2,3,4,5,6,7,8,10,15,20,35,70,100,200,201];
 return {stage:'6.34',inputRun:INPUT.inputGitHubRun,inputArtifact:INPUT.inputGitHubArtifact,
  inputAggregateSHA256:INPUT.inputFullAggregateSHA256,
  inputFileSHA256:crypto.createHash('sha256').update(JSON.stringify(INPUT)).digest('hex'),
  cohort:INPUT.cohort,fit:fitted,coefficients:POLICY,
  reference:levels.map(E=>({E,reference:reference(E),
   nextGrowthPct:100*(reference(E+1)/reference(E)-1)})),
  pairs:INPUT.transitions.map(x=>({from:x.from,to:x.to,n:x.paired,
   hpMedianPct:x.medianHpPct,attackMedianPct:x.medianAttackPct,
   predictedHpPct:100*Math.expm1(growthPair(x.from,POLICY).hp),
   predictedAttackPct:100*Math.expm1(growthPair(x.from,POLICY).attack)})),
  caveats:[
   '500 accounts are genuine E1-born agents, but only 102 ever reach E20. E8+ is survivorship-selected.',
   'Only HP and Attack same-character paired log growth are fitted. Observed DPS, UI Power, Spell Power, EHP, healing, AoE and Boss success are not merged into a fabricated metric.',
   'The later 1.4% log growth parameter is a PROVISIONAL E20–E200 extrapolation chosen to preserve Stage6.31 approximate endgame pressure. It is not an earned-data fit.',
   'The Stage6.33 fixed roles and named Elite/Boss bases are unchanged by this curve fit. Any base changes require independent native combat evidence.',
   'Gear tiers remain unchanged. No E5/E35/E36/E70 piecewise patches, manual nerfs or resets.'
  ]};
}
if(require.main===module){
 try{
  const out=process.argv.find(x=>x.startsWith('--out='))?.slice(6);
  if(process.argv.length>3||process.argv.length===3&&!out||out&&!/^reports\/v013-stage634-[a-z0-9-]+\.json$/.test(out))
   throw Error('Unsafe Stage6.34 diagnostic path');
  const result=diagnostics();
  if(out){fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n');}
  console.log('STAGE634_FIT='+JSON.stringify({loss:result.fit.weightedLogGrowthLoss,
   fitted:result.fit,reference:result.reference,cohort:result.cohort}));
 }catch(e){console.error('STAGE634_ERROR '+String(e.stack||e));process.exitCode=1;}
}
module.exports={INPUT,POLICY,reference,growthPair,validate,score,fit,diagnostics};
