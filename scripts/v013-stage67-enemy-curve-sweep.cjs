'use strict';
// Stage 6.7 pilot: isolated, native, deterministic E6-E10 enemy-reference sweeps.
// E1-E5, loot, skills, gear, XP and Boss unlock rules must stay byte-identical.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm');
const N=require('./v013-natural-progression.cjs');
const PROGRESSION_FILE='combat/expedition-progression.js';
const ORIGINAL=fs.readFileSync(path.join(__dirname,'..',PROGRESSION_FILE),'utf8');
const OLD='return level<=5?level:5*(1+.2*Math.log1p((level-5)/5));';
if(ORIGINAL.split(OLD).length!==2)throw Error('Enemy reference anchor changed; do not apply experimental override');
const CURVES=Object.freeze({
 baseline:null,
 mild:'return level<=5?level:5+.35*(level-5)+.05*(level-5)*(level-5);',
 firm:'return level<=5?level:5+.55*(level-5)+.07*(level-5)*(level-5);',
 linear:'return level<=5?level:5+(level-5);'
});
const hash=o=>crypto.createHash('sha256').update(typeof o==='string'?o:JSON.stringify(o)).digest('hex');
const variants=Object.keys(CURVES);
const count=(a,fn)=>a.filter(fn).length;
const sum=(a,fn)=>a.reduce((n,x)=>n+(Number(fn(x))||0),0);
const mean=a=>a.length?Number((a.reduce((n,x)=>n+x,0)/a.length).toFixed(2)):null;
function sourceFor(id){
 if(!Object.hasOwn(CURVES,id))throw Error('Unknown curve '+id);
 return id==='baseline'?ORIGINAL:ORIGINAL.replace(OLD,CURVES[id]);
}
function referenceFor(id,level){
 const sandbox={};
 vm.runInNewContext(sourceFor(id),sandbox,{timeout:3000});
 return sandbox.WandererExpeditionProgression.enemyReference(level);
}
function checkCurves(){
 for(const id of variants){
  const reference=Array.from({length:10},(_,i)=>referenceFor(id,i+1));
  for(let E=1;E<=5;E++)if(reference[E-1]!==E)throw Error(id+' alters E1–E5');
  if(id!=='baseline')for(let E=6;E<=10;E++)
   if(reference[E-1]<referenceFor('baseline',E))throw Error(id+' is weaker than current E'+E);
  for(let i=1;i<reference.length;i++)if(!(reference[i]>reference[i-1]))throw Error('Non-increasing curve '+id);
 }
 for(let E=6;E<=10;E++)if(!(referenceFor('mild',E)<referenceFor('firm',E)&&referenceFor('firm',E)<referenceFor('linear',E)))
  throw Error('Curve ordering invalid at E'+E);
 return Object.fromEntries(variants.map(id=>[id,Array.from({length:10},(_,i)=>Number(referenceFor(id,i+1).toFixed(3)))]));
}
function earlyHash(a){return hash(a.attempts.filter(t=>t.level<=5));}
function summarize(report,id){
 const accounts=report.accounts;
 if(report.coverage?.errors)throw Error('Native runtime error in '+id);
 const seen=new Set();
 for(const a of accounts){
  const key=a.seed+':'+a.profile;
  if(seen.has(key))throw Error('Duplicate account '+key);seen.add(key);
  if(a.startXp!==0||a.initialGear?.total!==a.initialGear?.starter)throw Error('Non-native starting account '+key);
  for(const t of a.attempts){
   if(t.error||t.status==='error')throw Error('Native attempt error '+key);
   if(t.level>1&&!a.attempts.some(prior=>prior.level===t.level-1&&prior.bossWon))
    throw Error('Forced unlock '+key+' E'+t.level);
  }
 }
 const levels=Array.from({length:10},(_,i)=>{
  const E=i+1,at=accounts.flatMap(a=>a.attempts.filter(t=>t.level===E)),fights=at.flatMap(t=>t.rooms||[]);
  const kinds=Object.fromEntries(['combat','elite','boss'].map(kind=>{
   const rows=fights.filter(x=>x.roomType===kind);
   return [kind,{n:rows.length,wins:count(rows,x=>x.won),deaths:count(rows,x=>x.died),
    meanDuration:mean(rows.map(x=>x.seconds)),meanHpLostPct:mean(rows.filter(x=>x.hpMax>0).map(x=>100*(x.hpStart-x.hpEnd)/x.hpMax))}];
  }));
  const first=at.map(t=>t.rooms?.[0]).filter(x=>x?.hpMax>0);
  return {E,accounts:count(accounts,a=>a.reached.includes(E)),attempts:at.length,
   clears:count(at,t=>t.bossWon),deaths:count(at,t=>t.status==='defeat'),
   extractions:count(at,t=>t.status==='extracted'),bossReach:count(at,t=>t.bossReached),
   meanFirstHpLossPct:mean(first.map(x=>100*(x.hpStart-x.hpEnd)/x.hpMax)),
   meanTalentNodes:mean(at.map(x=>x.before?.spent).filter(Number.isFinite)),
   kinds};
 });
 return {id,sourceHash:hash(sourceFor(id)),sourceFingerprint:report.source,accounts:accounts.length,
  attempts:report.coverage.attempts,errors:report.coverage.errors,
  levels,
  entries:accounts.map(a=>({seed:a.seed,profile:a.profile,earlyHash:earlyHash(a),
   E6Reached:a.reached.includes(6),E7Reached:a.reached.includes(7),
   E10Reached:a.reached.includes(10),
   E10Cleared:a.attempts.some(t=>t.level===10&&t.bossWon),
   maxUnlocked:a.endLevel,totalAttempts:a.attempts.length,
   attemptsAfter5:count(a.attempts,t=>t.level>=6),
   firstE6:a.attempts.find(t=>t.level===6)?.before?{
    spent:a.attempts.find(t=>t.level===6).before.spent,
    gear:hash(a.attempts.find(t=>t.level===6).before.gear),
    xp:a.attempts.find(t=>t.level===6).before.xp,
    gold:a.attempts.find(t=>t.level===6).before.gold
   }:null}))};
}
function proveSamePreE6(baseline,alternative){
 if(baseline.entries.length!==alternative.entries.length)throw Error('Mismatched cohort size');
 const origins=new Map(baseline.entries.map(x=>[x.seed+':'+x.profile,x]));
 for(const a of alternative.entries){
  const b=origins.get(a.seed+':'+a.profile);
  if(!b||a.earlyHash!==b.earlyHash)throw Error('E1-E5 diverged: '+a.profile+' seed '+a.seed+' '+alternative.id);
  if(a.E6Reached!==b.E6Reached)throw Error('E6 eligibility diverged: '+a.profile+' seed '+a.seed);
  if(JSON.stringify(a.firstE6)!==JSON.stringify(b.firstE6))
   throw Error('E6 initial earned account changed before enemy curve: '+a.profile+' seed '+a.seed);
 }
}
function parse(args){
 const cfg={seeds:[9701,9702,9703,9704],profiles:['balanced','cautious'],
  maxLevel:10,maxAttempts:18,maxTotalAttempts:85,output:'reports/stage67'};
 for(const arg of args){
  const m=/^--([a-z-]+)=(.+)$/.exec(arg);if(!m)throw Error('Invalid option '+arg);
  if(m[1]==='profiles')cfg.profiles=m[2].split(',');
  else if(m[1]==='seeds')cfg.seeds=m[2].split(',').map(Number);
  else if(m[1]==='out-prefix')cfg.output=m[2];
  else throw Error('Unexpected option '+arg);
 }
 const native=N.parseArgs(['--profiles='+cfg.profiles.join(','),'--seeds='+cfg.seeds.join(','),
  '--max-level=10','--max-attempts=18','--max-total-attempts=85','--out='+cfg.output+'.native.json']);
 return {native,output:cfg.output};
}
function run(args=process.argv.slice(2)){
 const cfg=parse(args),references=checkCurves(),results={stage:'6.7',references,
  experimentalOverrides:true,gameplayFilesModified:false,
  originalProgressionSha256:hash(ORIGINAL),
  settings:cfg.native,variants:{}};
 for(const id of variants){
  const overrides=id==='baseline'?{}:{[PROGRESSION_FILE]:sourceFor(id)};
  const report=N.run(cfg.native,{moduleOverrides:overrides});
  const s=summarize(report,id);
  results.variants[id]=s;
  if(id!=='baseline')proveSamePreE6(results.variants.baseline,s);
  const raw=cfg.output+'-'+id+'.native.json';
  fs.mkdirSync(path.dirname(raw),{recursive:true});
  fs.writeFileSync(raw,JSON.stringify(report)+'\n');
  console.log('STAGE67_VARIANT='+JSON.stringify({id,accounts:s.accounts,attempts:s.attempts,
   E6Reached:count(s.entries,a=>a.E6Reached),E10Cleared:count(s.entries,a=>a.E10Cleared),
   late:s.levels.slice(5).map(x=>({E:x.E,reached:x.accounts,attempts:x.attempts,
    bossDeaths:x.kinds.boss.deaths,eliteDeaths:x.kinds.elite.deaths,
    normalDeaths:x.kinds.combat.deaths}))}));
 }
 const outfile=cfg.output+'-summary.json';
 fs.writeFileSync(outfile,JSON.stringify(results,null,2)+'\n');
 return results;
}
if(require.main===module)run();
module.exports={CURVES,OLD,sourceFor,referenceFor,checkCurves,summarize,proveSamePreE6,parse,run};
