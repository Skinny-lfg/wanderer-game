'use strict';
const fs=require('node:fs');
const {run}=require('./v012-affinity-combat-sim.cjs');
const levels=[50,200,201,300],repetitions=16,rows=[];
for(const E of levels)for(let n=0;n<repetitions;n++){
 const seed=731000+E*31+n*17;
 for(const setup of [
  {loadout:'Dual Daggers',offhandType:'Off-Hand Dagger'},
  {loadout:'Single Dagger',offhandType:false}
 ]){
  const r=run({E,weapon:'Daggers',armorType:'Leather',rarity:'Epic',family:'blood',strategy:'triple',runes:true,
   offhandType:setup.offhandType,seed,controlSeed:seed});
  if(r.error||r.timeout)throw Error(`Simulation failed at E${E} seed ${seed}: ${r.error||'timeout'}`);
  rows.push({E,seed,loadout:setup.loadout,win:r.win,realm:r.reached,damage:r.damage,damageReceived:r.damageReceived,
   seconds:r.seconds,attackCycles:r.weaponAttacks});
 }
}
function mean(values){return values.reduce((a,b)=>a+b,0)/values.length;}
const groups=levels.map(E=>{
 const subset=rows.filter(r=>r.E===E),summary={E,n:repetitions};
 for(const loadout of ['Dual Daggers','Single Dagger']){
  const a=subset.filter(r=>r.loadout===loadout);
  summary[loadout]={wins:a.filter(r=>r.win).length,meanRealm:+mean(a.map(r=>r.realm)).toFixed(2),
   meanDamage:Math.round(mean(a.map(r=>r.damage))),meanDamageReceived:Math.round(mean(a.map(r=>r.damageReceived))),
   meanSeconds:+mean(a.map(r=>r.seconds)).toFixed(2),meanAttackCycles:+mean(a.map(r=>r.attackCycles)).toFixed(1)};
 }
 return summary;
});
const lines=['# D.7 — Dual Dagger combat comparison','','Date: 2026-10-21  |  Branch: `development`','','## Method',
 'Paired synthetic runs using the integrated v0.12 combat harness. Each level uses 16 shared seeds for Dual Daggers and a single Dagger. Epic Leather gear, Blood → Decay → Magic route steering, three comparable Runes, no potions, and declined events. E50 and E200 are normal levels; E201 and E300 are Endless. No saves, network services, or deployed systems were used.',
 '', 'The simulation records aggregate damage dealt and received, Realm reached (out of 15), combat duration, and attack clock cycles. A cycle can contain two distinct dagger impacts; the cycle count is not a count of individual hits.', '', '## Results',
 '| Level | Loadout | Wins / 16 | Mean Realm | Mean damage | Mean damage received | Mean seconds | Mean attack cycles |',
 '|--:|:--|--:|--:|--:|--:|--:|--:|'];
for(const g of groups)for(const loadout of ['Dual Daggers','Single Dagger']){const x=g[loadout];lines.push(`| E${g.E} | ${loadout} | ${x.wins} | ${x.meanRealm} | ${x.meanDamage} | ${x.meanDamageReceived} | ${x.meanSeconds} | ${x.meanAttackCycles} |`);}
lines.push('', '## Interpretation',
 'The off-hand now contributes a distinct half-strength strike during a dagger attack cycle. The separate hit uses the dagger weapon path and can apply its ordinary hit effects; it cannot recursively roll Double Strike. The former Dual Dagger only +30% Endless multiplier is removed. Other weapon and shield Endless bonuses are unchanged.',
 '', 'Detailed paired rows are available in the generated JSON artifact when the simulation is run with an output path. These results compare the weapon configuration only; they do not validate representative E200 character builds (E.1.3 remains separate).','');
const out=process.argv[2]||'docs/v012-d7-dual-dagger-results.md';
fs.writeFileSync(out,lines.join('\n'));
if(process.argv[3])fs.writeFileSync(process.argv[3],JSON.stringify({method:'paired-synthetic-integrated-combat',repetitions,groups,rows},null,2)+'\n');
console.log(JSON.stringify({cases:rows.length,groups,markdown:out}));
