'use strict';
// Stage 5: actual native E1 accounts, up to six earned attempts per policy.
// Only isolated VM-loaded starter item definitions differ between arms.
// Gameplay files, loot odds, future item rolls and talent progression are unchanged.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const N=require('./v013-natural-progression.cjs');
const create=require('../tests/v012-economy-harness.cjs');

const ROOT=path.resolve(__dirname,'..');
const STARTER_PATH='economy/v013-gear-rolls.js';
const SOURCE=fs.readFileSync(path.join(ROOT,STARTER_PATH),'utf8');
const sha=source=>crypto.createHash('sha256').update(source).digest('hex');
const SEEDS=Object.freeze(Array.from({length:12},(_,i)=>9101+i));
const PROFILES=Object.freeze(['cautious','balanced']);
const MAX_ATTEMPTS=6;

function adjustedStarterSource(source=SOURCE){
 const replacements=[
  ["if(slot==='weapon')return {...base,subtype:'Sword',name:'Old Sword',atk:3};",
   "if(slot==='weapon')return {...base,subtype:'Sword',name:'Old Sword',atk:4};"],
  ["if(slot==='armor')return {...base,subtype:'Armor',armorType:'Cloth',name:'Worn Tunic',def:1};",
   "if(slot==='armor')return {...base,subtype:'Armor',armorType:'Cloth',name:'Worn Tunic',def:2};"],
  ["if(slot==='helm')return {...base,subtype:'Helm',armorType:'Cloth',name:'Worn Hood',hp:4};",
   "if(slot==='helm')return {...base,subtype:'Helm',armorType:'Cloth',name:'Worn Hood',hp:8};"]
 ];
 let modified=source;
 for(const [from,to] of replacements){
  assert.equal(modified.split(from).length-1,1,'Starter rule drift; refuse experimental patch: '+from);
  modified=modified.replace(from,to);
 }
 assert.notEqual(modified,source);
 return modified;
}
function gearProbe(overrides={}){
 const account=create(7001,undefined,overrides,{skipPersistence:true,now:1720000007001});
 const slots=['weapon','armor','helm'];
 const items=slots.map(slot=>{
  const item=account.state().equip[slot];
  assert(item&&item.startingGear&&item.recoveryStarter&&item.rarity==='Common');
  return {slot,name:item.name,subtype:item.subtype,atk:item.atk||0,def:item.def||0,hp:item.hp||0,
   startingGear:!!item.startingGear,recoveryStarter:!!item.recoveryStarter};
 });
 const stats=account.baseStats();
 return {items,hero:{maxhp:stats.maxhp,attack:stats.attack,defense:stats.defense,
  attacksPerSec:Math.round(stats.attacksPerSec*1000000)/1000000}};
}
function round(value,digits=2){return Number(value.toFixed(digits));}
function mean(numbers){const values=numbers.filter(Number.isFinite);return values.length?round(values.reduce((a,b)=>a+b,0)/values.length):null;}
function accountSummary(account){
 const attempts=account.attempts.filter(a=>a.level===1);
 const won=attempts.find(a=>a.bossWon);
 const firstFights=attempts.map(a=>(a.rooms||[])[0]).filter(Boolean);
 const drops=attempts.flatMap(a=>(a.rooms||[]).flatMap(r=>r.loot||[]));
 return {
  seed:account.seed,profile:account.profile,
  attempts:attempts.length,
  won:!!won,wonOnAttempt:won?.attempt||null,
  bossReached:attempts.filter(a=>a.bossReached).length,
  deaths:attempts.filter(a=>a.status==='defeat').length,
  extractions:attempts.filter(a=>a.status==='extracted').length,
  errors:attempts.filter(a=>a.error||a.status==='error').length,
  fightsWon:attempts.reduce((n,a)=>n+(a.fightsWon||0),0),
  firstFights:firstFights.length,
  firstFightLossPct:mean(firstFights.filter(f=>f.hpMax>0).map(f=>100*(f.hpStart-f.hpEnd)/f.hpMax)),
  firstFightSeconds:mean(firstFights.map(f=>f.seconds)),
  drops:drops.length,greyDrops:drops.filter(x=>x.rarity==='Common').length,
  earnedXp:account.xp,finalGear:account.finalGear.total,
  starterRemaining:account.finalGear.starter,
  talents:account.talents.length,
  attemptsDetail:attempts.map(a=>({
   attempt:a.attempt,status:a.status,bossReached:!!a.bossReached,bossWon:!!a.bossWon,
   fightsWon:a.fightsWon||0,damageTaken:a.damageTaken||0,
   rooms:(a.rooms||[]).length,earnedXp:a.xpEarned||0,
   beforePoints:a.before?.earned??null,
   beforeStarterGear:a.before?.gear?.starter??null,
   afterStarterGear:a.gearAfter?.starter??null,
   drops:(a.rooms||[]).reduce((n,r)=>n+(r.loot||[]).length,0),
   firstRoom:(a.rooms||[]).length?{
    role:a.rooms[0].roomType,enemies:a.rooms[0].initialEnemies,
    hpLossPct:a.rooms[0].hpMax>0?round(100*(a.rooms[0].hpStart-a.rooms[0].hpEnd)/a.rooms[0].hpMax):null,
    seconds:a.rooms[0].seconds,won:a.rooms[0].won
   }:null
  }))
 };
}
function cohortSummary(accounts){
 const rows=accounts.map(accountSummary);
 const group=list=>{
  const all=list.flatMap(a=>a.attemptsDetail);
  const victory=list.filter(a=>a.won);
  const loss=list.filter(a=>!a.won);
  const first=list.flatMap(a=>a.attemptsDetail.map(x=>x.firstRoom).filter(Boolean));
  return {
   accounts:list.length,completedE1:victory.length,notCompletedE1:loss.length,
   victoryOnAttempt:mean(victory.map(a=>a.wonOnAttempt)),
   attempts:all.length,errors:list.reduce((n,a)=>n+a.errors,0),
   deaths:list.reduce((n,a)=>n+a.deaths,0),
   extractions:list.reduce((n,a)=>n+a.extractions,0),
   bossEncounters:list.reduce((n,a)=>n+a.bossReached,0),
   totalFightsWon:list.reduce((n,a)=>n+a.fightsWon,0),
   meanFirstFightLossPct:mean(first.map(x=>x.hpLossPct)),
   meanFirstFightSeconds:mean(first.map(x=>x.seconds)),
   drops:list.reduce((n,a)=>n+a.drops,0),greyDrops:list.reduce((n,a)=>n+a.greyDrops,0),
   meanEarnedXp:mean(list.map(x=>x.earnedXp)),
   meanStarterRemaining:mean(list.map(x=>x.starterRemaining)),
   meanTalents:mean(list.map(x=>x.talents)),
   afterAttempt:[1,2,3,4,5,6].map(k=>({
    attempt:k,
    accountsWithThatAttempt:list.filter(a=>a.attempts>=k).length,
    victoriesByThisAttempt:list.filter(a=>a.won&&a.wonOnAttempt<=k).length,
    accountsStillWithoutE1Win:list.filter(a=>!a.won||a.wonOnAttempt>k).length,
    avgStarterItemsAfterAttempt:mean(list.map(a=>a.attemptsDetail[Math.min(k,a.attempts)-1]?.afterStarterGear))
   }))
  };
 };
 return {all:group(rows),byProfile:Object.fromEntries(PROFILES.map(id=>[id,group(rows.filter(a=>a.profile===id))])),
  accounts:rows};
}
function pairSummary(control,adjusted){
 const a=new Map(control.accounts.map(x=>[x.seed+':'+x.profile,x]));
 const b=new Map(adjusted.accounts.map(x=>[x.seed+':'+x.profile,x]));
 assert.deepEqual([...a.keys()].sort(),[...b.keys()].sort(),'Matched seed and profile cohort');
 const cases=[...a.entries()].map(([key,x])=>{
  const y=b.get(key);
  return {key,seed:x.seed,profile:x.profile,
   before:{won:x.won,wonOnAttempt:x.wonOnAttempt,starterRemaining:x.starterRemaining,
    firstFightLossPct:x.firstFightLossPct},
   adjusted:{won:y.won,wonOnAttempt:y.wonOnAttempt,starterRemaining:y.starterRemaining,
    firstFightLossPct:y.firstFightLossPct}};
 });
 return {matched:cases.length,
  bothWin:cases.filter(x=>x.before.won&&x.adjusted.won).length,
  improvedOnly:cases.filter(x=>!x.before.won&&x.adjusted.won).length,
  worsenedOnly:cases.filter(x=>x.before.won&&!x.adjusted.won).length,
  neitherWins:cases.filter(x=>!x.before.won&&!x.adjusted.won).length,
  bothWinSoonerAdjusted:cases.filter(x=>x.before.won&&x.adjusted.won&&x.adjusted.wonOnAttempt<x.before.wonOnAttempt).length,
  bothWinLaterAdjusted:cases.filter(x=>x.before.won&&x.adjusted.won&&x.adjusted.wonOnAttempt>x.before.wonOnAttempt).length,
  meanPairedFirstFightLossDifference:mean(cases.filter(x=>x.before.firstFightLossPct!==null&&x.adjusted.firstFightLossPct!==null)
   .map(x=>x.adjusted.firstFightLossPct-x.before.firstFightLossPct)),
  cases};
}
function markdown(result){
 const c=result.control.summary.all,a=result.adjusted.summary.all,p=result.paired;
 const out=[
  '# Stage 5 — Starter-only comparison: E1 through six real attempts','',
  'The adjusted arm changes only three **starter** items through the isolated VM loader. No loot, rarity, enemy, XP, talent, potion or permanent-stat rule is changed.','',
  '- Original source SHA-256: '+result.starterSourceHashes.control,
  '- Experimental source SHA-256: '+result.starterSourceHashes.adjusted,
  '- Native runner SHA-256: '+result.runnerSha256,
  '- Matched cohort: '+p.matched+' seed/profile pairs, '+result.settings.maxAttempts+' attempted E1 entries max per account.','',
  '| Metric | Current | Starter adjusted |',
  '|---|---:|---:|',
  '| E1 victories within 6 tries | '+c.completedE1+'/'+c.accounts+' | '+a.completedE1+'/'+a.accounts+' |',
  '| Mean attempt of E1 victory (winners only) | '+c.victoryOnAttempt+' | '+a.victoryOnAttempt+' |',
  '| Native E1 attempts | '+c.attempts+' | '+a.attempts+' |',
  '| Deaths / extractions | '+c.deaths+' / '+c.extractions+' | '+a.deaths+' / '+a.extractions+' |',
  '| Boss encounters | '+c.bossEncounters+' | '+a.bossEncounters+' |',
  '| Mean first-fight HP loss (percentage points of max HP) | '+c.meanFirstFightLossPct+' | '+a.meanFirstFightLossPct+' |',
  '| Total native equipment drops | '+c.drops+' | '+a.drops+' |',
  '| Mean remaining starter items after run | '+c.meanStarterRemaining+' | '+a.meanStarterRemaining+' |',
  '| Mean earned XP / talents | '+c.meanEarnedXp+' / '+c.meanTalents+' | '+a.meanEarnedXp+' / '+a.meanTalents+' |',
  '| Simulator errors | '+c.errors+' | '+a.errors+' |','',
  '## Matched E1 victory changes','',
  '- Both won: '+p.bothWin,
  '- Adjustment-only wins: '+p.improvedOnly,
  '- Control-only wins: '+p.worsenedOnly,
  '- Neither won: '+p.neitherWins,
  '- Mean paired first-fight HP-loss delta: '+p.meanPairedFirstFightLossDifference+' percentage points','',
  '## Progress by attempt','',
  '| Attempt | Control wins by then | Adjusted wins by then | Control starter remaining | Adjusted starter remaining |',
  '|---:|---:|---:|---:|---:|'];
 for(let i=0;i<6;i++){
  const x=c.afterAttempt[i],y=a.afterAttempt[i];
  out.push('| '+x.attempt+' | '+x.victoriesByThisAttempt+' | '+y.victoriesByThisAttempt+
   ' | '+x.avgStarterItemsAfterAttempt+' | '+y.avgStarterItemsAfterAttempt+' |');
 }
 out.push('','## Interpretation guardrails','',
  '- A matched seed starts with the same map RNG seed, but combat outcomes can change subsequent RNG consumption and route decisions. This is paired account comparison, not a frozen identical encounter sequence.',
  '- Different route, loot and shopping choices are legitimate downstream effects; do not attribute all changes exclusively to the first encounter.',
  '- Some accounts win before attempt 4 or 5, so later attempted-entry samples are censored. The by-attempt win totals use all starting accounts.',
  '- Report is a deterministic heuristic-player survey, not a measure of human victory odds. Review per-account attempts and actual gear replacement before choosing any change.',
  '- None of the experimental item attributes has been applied to the published game.','');
 return out.join('\n');
}
function runComparison(){
 const opts=N.parseArgs([
  '--seeds='+SEEDS.join(','),'--profiles='+PROFILES.join(','),
  '--max-level=1','--max-attempts='+MAX_ATTEMPTS,
  '--out=reports/stage5-starter-comparison.json'
 ]);
 const changed=adjustedStarterSource();
 const modified={[STARTER_PATH]:changed};
 const originalProbe=gearProbe();
 const adjustedProbe=gearProbe(modified);
 assert.deepEqual(originalProbe.items.map(x=>[x.atk,x.def,x.hp]),[[3,0,0],[0,1,0],[0,0,4]]);
 assert.deepEqual(adjustedProbe.items.map(x=>[x.atk,x.def,x.hp]),[[4,0,0],[0,2,0],[0,0,8]]);
 const controlRaw=N.run(opts);
 const adjustedRaw=N.run(opts,{moduleOverrides:modified});
 const control=cohortSummary(controlRaw.accounts),adjusted=cohortSummary(adjustedRaw.accounts);
 const report={
  protocol:'Native E1 repeated-account matched starter comparison, not a gameplay change',
  settings:{seeds:SEEDS,profiles:PROFILES,maxAttempts:MAX_ATTEMPTS,maxLevel:1},
  starterSourceHashes:{control:sha(SOURCE),adjusted:sha(changed)},
  engineFingerprint:controlRaw.source,runnerSha256:controlRaw.runnerSha256,
  probes:{control:originalProbe,adjusted:adjustedProbe},
  control:{summary:control,raw:controlRaw},
  adjusted:{summary:adjusted,raw:adjustedRaw},
  paired:pairSummary(control,adjusted)
 };
 const out=path.join(ROOT,'reports','stage5-starter-comparison.json');
 fs.mkdirSync(path.dirname(out),{recursive:true});
 fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');
 fs.writeFileSync(out.replace(/\.json$/,'.md'),markdown(report));
 const brief={probes:report.probes,starterSourceHashes:report.starterSourceHashes,
  engineFingerprint:report.engineFingerprint,settings:report.settings,
  control:control.all,adjusted:adjusted.all,
  paired:Object.fromEntries(Object.entries(report.paired).filter(([k])=>k!=='cases'))};
 fs.writeFileSync(out.replace(/\.json$/,'-summary.json'),JSON.stringify(brief,null,2)+'\n');
 console.log('STAGE5_STARTER_COMPARISON='+JSON.stringify({
  baselineWins:control.all.completedE1,adjustedWins:adjusted.all.completedE1,
  controlFirstFightLoss:control.all.meanFirstFightLossPct,
  adjustedFirstFightLoss:adjusted.all.meanFirstFightLossPct,
  controlStarterRemaining:control.all.meanStarterRemaining,
  adjustedStarterRemaining:adjusted.all.meanStarterRemaining,
  paired:Object.fromEntries(Object.entries(report.paired).filter(([k])=>k!=='cases')),
  controlErrors:control.all.errors,adjustedErrors:adjusted.all.errors
 }));
 if(control.all.errors||adjusted.all.errors)process.exitCode=1;
 return report;
}
module.exports={SOURCE,SEEDS,PROFILES,MAX_ATTEMPTS,adjustedStarterSource,gearProbe,accountSummary,cohortSummary,pairSummary,markdown,runComparison};
if(require.main===module)runComparison();
