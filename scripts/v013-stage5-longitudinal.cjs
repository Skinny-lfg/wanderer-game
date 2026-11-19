'use strict';
// Native chronological E1 -> E20: no forced unlock, no fabricated resources.
const fs=require('node:fs');
const path=require('node:path');
const N=require('./v013-natural-progression.cjs');
const TARGETS=[5,10,20];
const sum=(rows,fn)=>rows.reduce((n,x)=>n+fn(x),0);
const avg=v=>v.length?Math.round(100*sum(v,x=>x)/v.length)/100:null;
const median=v=>{
 if(!v.length)return null;
 const a=[...v].sort((x,y)=>x-y),i=Math.floor(a.length/2);
 return a.length%2?a[i]:avg([a[i-1],a[i]]);
};
function milestone(account,level){
 const attempts=account.attempts||[];
 const unlockedAt=level===1?-1:attempts.findIndex(a=>a.level===level-1&&a.bossWon);
 const clearedAt=attempts.findIndex(a=>a.level===level&&a.bossWon);
 return {level,
  unlocked:level===1||unlockedAt>=0,
  entered:attempts.some(a=>a.level===level),
  cleared:clearedAt>=0,
  totalAttemptsToUnlock:level===1?0:unlockedAt<0?null:unlockedAt+1,
  totalAttemptsToClear:clearedAt<0?null:clearedAt+1,
  attemptsAtThisLevel:attempts.filter(a=>a.level===level).length};
}
function accountSummary(account){
 const attempts=account.attempts||[];
 return {
  seed:account.seed,profile:account.profile,
  totalAttempts:attempts.length,deepestUnlocked:account.endLevel,
  completedExpeditions:attempts.filter(a=>a.bossWon).map(a=>a.level),
  stoppedAt:account.stopReason||null,
  cappedByTotalBudget:/budget/i.test(account.stopReason||''),
  nativeErrors:attempts.filter(a=>a.error||a.status==='error').length,
  deaths:attempts.filter(a=>a.status==='defeat').length,
  extractions:attempts.filter(a=>a.status==='extracted').length,
  bossReached:attempts.filter(a=>a.bossReached).length,
  earnedXp:account.xp,permanentTalents:account.talents?.length||0,
  remainingStarterGear:account.finalGear?.starter??null,
  equippedGear:account.finalGear?.total??null,
  gold:account.gold,fragments:account.fragments,
  totalForged:sum(attempts,a=>a.camp?.crafted?.length||0),
  totalMerchant:sum(attempts,a=>a.camp?.bought?.length||0),
  totalPotionUses:sum(attempts,a=>a.potions?.length||0),
  milestones:Object.fromEntries(TARGETS.map(level=>['E'+level,milestone(account,level)]))
 };
}
function levelSummary(accounts,level){
 const arriving=accounts.filter(a=>a.attempts.some(x=>x.level===level));
 const trials=arriving.flatMap(a=>a.attempts.filter(x=>x.level===level));
 const winners=arriving.filter(a=>a.attempts.some(x=>x.level===level&&x.bossWon));
 const attemptsToClear=winners.map(a=>a.attempts.filter(x=>x.level===level).length);
 const first=trials.flatMap(a=>(a.rooms||[]).slice(0,1)).filter(x=>x.hpMax>0);
 return {
  level,accountsReached:arriving.length,accountsSucceeded:winners.length,
  accountsNotSucceeded:arriving.length-winners.length,
  attempts:trials.length,
  errors:trials.filter(a=>a.error||a.status==='error').length,
  deaths:trials.filter(a=>a.status==='defeat').length,
  extractions:trials.filter(a=>a.status==='extracted').length,
  bossReached:trials.filter(a=>a.bossReached).length,
  eliteFights:sum(trials,a=>(a.rooms||[]).filter(r=>r.roomType==='elite').length),
  eliteWins:sum(trials,a=>(a.rooms||[]).filter(r=>r.roomType==='elite'&&r.won).length),
  gearDrops:sum(trials,a=>sum(a.rooms||[],r=>(r.loot||[]).length)),
  gearForged:sum(trials,a=>a.camp?.crafted?.length||0),
  gearPurchased:sum(trials,a=>a.camp?.bought?.length||0),
  potionUses:sum(trials,a=>a.potions?.length||0),
  medianAttemptsToClearAmongWinners:median(attemptsToClear),
  averageAttemptsToClearAmongWinners:avg(attemptsToClear),
  firstFightHpLossPct:avg(first.map(x=>100*(x.hpStart-x.hpEnd)/x.hpMax)),
  meanStarterGearOnFirstEntry:avg(arriving.map(a=>a.attempts.find(x=>x.level===level)?.before?.gear?.starter).filter(Number.isFinite)),
  meanTalentPointsOnFirstEntry:avg(arriving.map(a=>a.attempts.find(x=>x.level===level)?.before?.earned).filter(Number.isFinite)),
  coverageStatus:!arriving.length?'not_observed':!winners.length?'reached_but_no_victories_observed':'has_observed_victories'
 };
}
function summarize(native){
 const accounts=native.accounts.map(accountSummary),settings=native.settings;
 const byLevel=Array.from({length:settings.maxLevel},(_,i)=>levelSummary(native.accounts,i+1));
 const milestoneReports=Object.fromEntries(TARGETS.map(level=>{
  const k='E'+level,unlocked=accounts.filter(a=>a.milestones[k].unlocked),
   cleared=accounts.filter(a=>a.milestones[k].cleared);
  const toUnlock=unlocked.map(a=>a.milestones[k].totalAttemptsToUnlock);
  const toClear=cleared.map(a=>a.milestones[k].totalAttemptsToClear);
  return [k,{
   milestone:level,accounts:accounts.length,unlocked:unlocked.length,
   entered:accounts.filter(a=>a.milestones[k].entered).length,cleared:cleared.length,
   unlockAttempts:{observations:toUnlock.length,median:median(toUnlock),mean:avg(toUnlock),
    min:toUnlock.length?Math.min(...toUnlock):null,max:toUnlock.length?Math.max(...toUnlock):null,
    individual:toUnlock},
   clearAttempts:{observations:toClear.length,median:median(toClear),mean:avg(toClear),
    min:toClear.length?Math.min(...toClear):null,max:toClear.length?Math.max(...toClear):null,
    individual:toClear}
  }];
 }));
 const stopped={};for(const a of accounts){
  if(!a.stoppedAt)continue;
  const category=a.nativeErrors?'native_error':a.cappedByTotalBudget?'total_attempt_cap':'level_attempt_cap';
  const k='E'+a.deepestUnlocked+':'+category;
  stopped[k]=(stopped[k]||0)+1;
 }
 return {
  method:'One persistent native account per seed/profile, E1 through E20, no skipped levels.',
  settings,evidence:{accountCount:accounts.length,
   independentMapSeeds:new Set(accounts.map(a=>a.seed)).size,
   profiles:[...new Set(accounts.map(a=>a.profile))],
   totalAttempts:sum(accounts,a=>a.totalAttempts),
   nativeErrors:sum(accounts,a=>a.nativeErrors),
   totalBudgetCensored:accounts.filter(a=>a.cappedByTotalBudget).length,
   engineSha256:native.source,runnerSha256:native.runnerSha256,
   noFakeUnlocks:native.integrity.noForcedLevelUnlock,
   noFakeEquipment:native.integrity.noForcedEquipment},
  milestones:milestoneReports,byLevel,stopped,accounts
 };
}
function markdown(r){
 const out=[
  '# Wanderer v0.13 — longitudinal natural account progression E1-E20','',
  'Progression is chronological and uses native Boss victories to unlock the next Expedition. Every failed attempt returns to Camp with its genuinely retained equipment, permanent XP and resources.','',
  'Unblocked / entered / cleared milestones are separate. If an expedition was not reached there is no measured win rate for it.','',
  '- Distinct map seeds: '+r.evidence.independentMapSeeds,
  '- Policies: '+r.evidence.profiles.join(', '),
  '- Accounts: '+r.evidence.accountCount,
  '- Total attempts: '+r.evidence.totalAttempts,
  '- Simulator errors: '+r.evidence.nativeErrors,
  '- Budget-censored accounts: '+r.evidence.totalBudgetCensored,'',
  '## Milestone outcomes','',
  '| Milestone | Unlocked | Entered | Cleared | Median total attempts to unlock (only achievers) |','|---|---:|---:|---:|---:|'
 ];
 for(const target of TARGETS){
  const v=r.milestones['E'+target];
  out.push('| E'+target+' | '+v.unlocked+'/'+v.accounts+' | '+v.entered+'/'+v.accounts+
   ' | '+v.cleared+'/'+v.accounts+' | '+(v.unlockAttempts.median??'not observed')+' |');
 }
 out.push('','## Every Expedition','',
  '| E | Accounts entering | Boss wins | Attempt count | Median attempts to clear (winners only) | Deaths | Extractions | Mean first-fight HP lost |',
  '|---:|---:|---:|---:|---:|---:|---:|---:|');
 for(const x of r.byLevel){
  out.push('| '+x.level+' | '+x.accountsReached+' | '+x.accountsSucceeded+' | '+x.attempts+
   ' | '+(x.medianAttemptsToClearAmongWinners??'not observed')+
   ' | '+x.deaths+' | '+x.extractions+' | '+(x.firstFightHpLossPct??'—')+' |');
 }
 out.push('','## Stopping points','');
 for(const [k,n] of Object.entries(r.stopped))out.push('- '+k+': '+n+' accounts');
 out.push('','## Interpretation limits','',
  '- Each seed is one persistent account; profiles are scripted strategies, not human-player behavior.',
  '- Each account has a finite per-Expedition and total-attempt budget. Budget-censored levels are not permanent failures.',
  '- The same seed and native code reproduce the trajectory; player decisions change later RNG consumption.',
  '- No fabricated progress, forced E5/E10/E20 entry, loot guarantee, XP injection, enemy nerfs or permanent hero buffs.',
  '- Interpret later levels only where they have sufficient observed accounts. Empty levels remain explicitly unobserved.','');
 return out.join('\n');
}
function run(args=process.argv.slice(2)){
 const opts=N.parseArgs(args);
 if(opts.maxLevel!==20)throw Error('Longitudinal milestone campaign requires --max-level=20');
 const native=N.run(opts,{decisionModel:'risk-aware'}),report=summarize(native);
 const out=path.resolve(opts.output);
 fs.mkdirSync(path.dirname(out),{recursive:true});
 fs.writeFileSync(out,JSON.stringify({summary:report,native},null,2)+'\n');
 fs.writeFileSync(out.replace(/\.json$/,'.summary.json'),JSON.stringify(report,null,2)+'\n');
 fs.writeFileSync(out.replace(/\.json$/,'.md'),markdown(report)+'\n');
 console.log('STAGE5_LONGITUDINAL='+JSON.stringify({
  coverage:report.evidence,milestones:report.milestones,stopped:report.stopped,
  firstTen:report.byLevel.slice(0,10).map(x=>({level:x.level,
   accounts:x.accountsReached,wins:x.accountsSucceeded,attempts:x.attempts,errors:x.errors}))
 }));
 if(report.evidence.nativeErrors)process.exitCode=1;
 return report;
}
module.exports={TARGETS,milestone,accountSummary,levelSummary,summarize,markdown,run};
if(require.main===module)run();
