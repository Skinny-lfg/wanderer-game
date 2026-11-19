'use strict';
// Matched native progression comparison, only simulated player decisions vary.
const N=require('./v013-natural-progression.cjs');
const fs=require('node:fs');
const path=require('node:path');
const SEEDS=Object.freeze(Array.from({length:12},(_,i)=>9101+i));
const PROFILES=Object.freeze(['cautious','balanced']);
const average=values=>values.length?Math.round(values.reduce((a,b)=>a+b,0)/values.length*100)/100:null;
function summarize(report){
 const accounts=report.accounts,attempts=accounts.flatMap(a=>a.attempts);
 const decisions=attempts.flatMap(a=>a.decisions||[]);
 const firstFights=attempts.flatMap(a=>(a.rooms||[]).slice(0,1));
 const crafts=attempts.flatMap(a=>a.camp?.crafted||[]);
 const buys=attempts.flatMap(a=>a.camp?.bought||[]);
 const potions=attempts.flatMap(a=>a.potions||[]);
 const campPotions=attempts.flatMap(a=>a.camp?.potions||[]);
 const reasons={};
 for(const d of decisions.filter(x=>x.type==='extract')){
  reasons[d.reason]=(reasons[d.reason]||0)+1;
 }
 const attempts4and5=attempts.filter(a=>a.attempt===4||a.attempt===5);
 return {
  accounts:accounts.length,attempts:attempts.length,
  wins:accounts.filter(a=>a.attempts.some(x=>x.bossWon)).length,
  bossReached:attempts.filter(a=>a.bossReached).length,
  deaths:attempts.filter(a=>a.status==='defeat').length,
  extractions:attempts.filter(a=>a.status==='extracted').length,
  errors:attempts.filter(a=>a.error||a.status==='error').length,
  extractionReasons:reasons,
  riskedEasyRoomWithoutBag:decisions.filter(d=>d.riskAssessment?.reason==='risk_easy_room_no_bag').length,
  protectedBagExits:decisions.filter(d=>d.type==='extract'&&d.bagItems>0).length,
  firstEncounterHpLossPct:average(firstFights.filter(x=>x.hpMax>0).map(x=>100*(x.hpStart-x.hpEnd)/x.hpMax)),
  gearBought:buys.length,gearCrafted:crafts.length,
  gearCraftsEquipped:crafts.filter(x=>x.equipped).length,
  fragmentsSpentOnCrafts:crafts.reduce((n,x)=>n+x.fragmentsSpent,0),
  essenceSpentOnCrafts:crafts.reduce((n,x)=>n+x.essenceSpent,0),
  campPotionActions:campPotions.length,consumableUses:potions.length,
  actualGearDrops:attempts.reduce((n,a)=>n+(a.rooms||[]).reduce((k,r)=>k+(r.loot||[]).length,0),0),
  meanFinalStarterItems:average(accounts.map(a=>a.finalGear.starter)),
  meanFinalTalents:average(accounts.map(a=>a.talents.length)),
  meanFinalGold:average(accounts.map(a=>a.gold)),
  meanFinalFragments:average(accounts.map(a=>a.fragments)),
  meanFinalEarnedXp:average(accounts.map(a=>a.xp)),
  attempts4and5:{count:attempts4and5.length,
   gearCrafted:attempts4and5.reduce((n,a)=>n+(a.camp?.crafted?.length||0),0),
   gearBought:attempts4and5.reduce((n,a)=>n+(a.camp?.bought?.length||0),0),
   meanStarterAtEntry:average(attempts4and5.map(a=>a.before?.gear?.starter).filter(Number.isFinite)),
   avgEarnedTalentPoints:average(attempts4and5.map(a=>a.before?.earned).filter(Number.isFinite))},
  perAttempt:[1,2,3,4,5,6].map(k=>{
   const rows=attempts.filter(a=>a.attempt===k);
   return {attempt:k,trials:rows.length,won:rows.filter(a=>a.bossWon).length,
    deaths:rows.filter(a=>a.status==='defeat').length,
    extractions:rows.filter(a=>a.status==='extracted').length,
    crafted:rows.reduce((n,a)=>n+(a.camp?.crafted?.length||0),0),
    merchant:rows.reduce((n,a)=>n+(a.camp?.bought?.length||0),0),
    potionUses:rows.reduce((n,a)=>n+(a.potions?.length||0),0),
    meanStarterAtEntry:average(rows.map(a=>a.before?.gear?.starter).filter(Number.isFinite))};
  })
 };
}
function main(){
 const opts=N.parseArgs(['--seeds='+SEEDS.join(','),'--profiles='+PROFILES.join(','),
  '--max-level=1','--max-attempts=6','--out=reports/stage5-decision-comparison.json']);
 const old=N.run(opts,{decisionModel:'legacy'});
 const current=N.run(opts,{decisionModel:'risk-aware'});
 const original=summarize(old),improved=summarize(current);
 const paired=[];
 for(const a of old.accounts){
  const b=current.accounts.find(x=>x.seed===a.seed&&x.profile===a.profile);
  if(!b)throw Error('Missing matched account');
  paired.push({seed:a.seed,profile:a.profile,
   old:{wins:a.attempts.filter(x=>x.bossWon).length,attempts:a.attempts.length,
    startingGear:a.finalGear.starter,earnedXP:a.xp,remainingGold:a.gold,fragments:a.fragments},
   new:{wins:b.attempts.filter(x=>x.bossWon).length,attempts:b.attempts.length,
    startingGear:b.finalGear.starter,earnedXP:b.xp,remainingGold:b.gold,fragments:b.fragments}});
 }
 const report={identity:'decision-policy-only; identical unchanged real native starter gear',
  settings:opts,oldSource:old.runnerSha256,newSource:current.runnerSha256,
  legacy:{summary:original,accounts:old.accounts},riskAware:{summary:improved,accounts:current.accounts},
  paired};
 const out=path.resolve(__dirname,'../reports/stage5-decision-comparison.json');
 fs.mkdirSync(path.dirname(out),{recursive:true});
 fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');
 const markdown=[
  '# Stage 5 — Camp investment and loot-aware extraction',
  '',
  '**Native E1 progression; 12 identical seeds × 2 profiles × up to 6 attempts per account per policy. No gameplay balance changes.**','',
  '| Metric | Previous policy | Loot-aware policy |','|---|---:|---:|',
  ...[['E1 wins','wins'],['Total attempts','attempts'],['Deaths','deaths'],
    ['Extractions','extractions'],['Boss encounters','bossReached'],
    ['Gear bought with Gold','gearBought'],['Gear forged with Fragments + Essence','gearCrafted'],
    ['Forge Fragments spent','fragmentsSpentOnCrafts'],
    ['Potion uses','consumableUses'],['Mean starter items remaining','meanFinalStarterItems'],
    ['Mean talents earned','meanFinalTalents'],['Mean earned XP','meanFinalEarnedXp'],
    ['Errors','errors']].map(([label,key])=>'| '+label+' | '+original[key]+' | '+improved[key]+' |'),
  '',
  '## Why the new policy extracts','',
  ...Object.entries(improved.extractionReasons).map(([reason,n])=>'- '+reason+': '+n),
  '',
  '## Attempt 4–5 checkpoint','',
  'Legacy: '+JSON.stringify(original.attempts4and5),
  '',
  'Updated: '+JSON.stringify(improved.attempts4and5),
  '',
  '## Limitations','',
  '- Real economy API uses exactly earned money, Fragments and Essence; Forge requires all native resources and prerequisites. No guaranteed loot or fabricated inventory.',
  '- Only the physical Bag is at risk on death. Secured Gold, Fragments and XP are not treated as lost.',
  '- All RNG streams are seeded, but changing player choices changes subsequent RNG consumption, routes, loot and encounters.',
  '- Policies are deterministic heuristic agents, not observed players; do not tune permanent power based on these cohorts.',
  '- Repeated E1 accounts stop after the real Boss unlock or six attempts. The report has per-account decision traces.',''
 ];
 fs.writeFileSync(out.replace(/\.json$/,'.md'),markdown.join('\n'));
 console.log('STAGE5_DECISION_COMPARISON='+JSON.stringify({legacy:original,riskAware:improved,
  matching:paired.length,sourceStable:old.source===current.source}));
 if(old.coverage.errors||current.coverage.errors)process.exitCode=1;
 return report;
}
module.exports={SEEDS,PROFILES,summarize,main};
if(require.main===module)main();
