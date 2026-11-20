'use strict';
// Stage 6.3: genuine native before/after gameplay comparison.
// Same rolled gear, seeds, risk, map and legally allocated talents; only combat
// mechanics differ. Diverging in-combat RNG is expected after decisions diverge.
const fs=require('node:fs'),path=require('node:path');
function compare(before,after){
 const keys=r=>[r.level,r.seed,r.mode,r.weapon].join(':');
 const old=new Map(before.rows.map(r=>[keys(r),r])),rows=[];
 if(before.rows.length!==after.rows.length||old.size!==before.rows.length)throw Error('Unmatched cohort size');
 for(const row of after.rows){
  const baseline=old.get(keys(row));if(!baseline)throw Error('No before row for '+keys(row));
  for(const k of ['gearFingerprint','hpMax','mpMax','realm','risk','pointsSpent','groupSize'])
   if(baseline[k]!==row[k])throw Error('Initial matched fixture differs on '+k+' / '+keys(row));
  rows.push({level:row.level,seed:row.seed,mode:row.mode,weapon:row.weapon,
   baseWon:baseline.won,newWon:row.won,baseDps:baseline.dps,newDps:row.dps,
   deltaDps:+(row.dps-baseline.dps).toFixed(2),
   deltaDamageDealt:row.damageDealt-baseline.damageDealt,
   deltaDamageTaken:row.damageTaken-baseline.damageTaken,
   deltaManaSpent:row.manaSpent-baseline.manaSpent,
   infusionHits:row.infusionHits,infusionDamage:row.infusionDamage,
   baseSeconds:baseline.seconds,newSeconds:row.seconds,
   baseHpEnd:baseline.hpEnd,newHpEnd:row.hpEnd,
   fingerprint:row.gearFingerprint});
 }
 const mean=a=>+(a.reduce((sum,x)=>sum+x,0)/a.length).toFixed(2);
 const groupKeys=[...new Set(rows.map(r=>r.level+'|'+r.mode+'|'+r.weapon))];
 const groups=groupKeys.map(key=>{
  const [level,mode,weapon]=key.split('|'),selected=rows.filter(r=>r.level===+level&&r.mode===mode&&r.weapon===weapon);
  return {level:+level,mode,weapon,n:selected.length,baseWins:selected.filter(r=>r.baseWon).length,newWins:selected.filter(r=>r.newWon).length,
   meanBaseDps:mean(selected.map(r=>r.baseDps)),meanNewDps:mean(selected.map(r=>r.newDps)),
   meanDeltaDps:mean(selected.map(r=>r.deltaDps)),meanDeltaDamageTaken:mean(selected.map(r=>r.deltaDamageTaken)),
   meanDeltaManaSpent:mean(selected.map(r=>r.deltaManaSpent)),meanInfusionHits:mean(selected.map(r=>r.infusionHits))};
 });
 return {stage:'6.3',type:'paired-native-before-after',baselineRevision:'945a00c135c08253a1c8d8359b4b102e5296b4c4',
  sameStarterGear:true,rows,groups,limitations:[
   'Legal synthetic 24-point builds, not earned natural E1/E2 account progression.',
   'Same real rolled gear, initial HP/Mana, Realm and risk; in-combat RNG consumption may diverge after mechanics differ.',
   'All profiles include Arcane or elemental attunement. Unattuned path has separate unit tests and is not part of this 24-point comparison.',
   'A high win rate in three-mob rooms does not demonstrate Boss survival or balance; use DPS, duration, damage taken and Mana as diagnostics.'
  ]};
}
function main(){
 const before=JSON.parse(fs.readFileSync('reports/stage63-native-magic-baseline.json','utf8'));
 const after=JSON.parse(fs.readFileSync('reports/stage63-native-magic-matrix.json','utf8'));
 if(!before.success||!after.success)throw Error('One native cohort failed');
 const result=compare(before,after),file=path.resolve('reports/stage63-native-magic-comparison.json');
 fs.writeFileSync(file,JSON.stringify(result,null,2)+'\n');
 const md=['# Stage 6.3 — Matched native Magic before/after','',
 'Same native seed, rolled gear, legal 24-point talents and real combat; not earned Expedition progression.','',
 '| E | Mode | Weapon | Before wins | After wins | Before DPS | After DPS | DPS delta | Damage-taken delta | Mana-spent delta |',
 '|---|---|---|---:|---:|---:|---:|---:|---:|---:|',
 ...result.groups.map(g=>'| '+g.level+' | '+g.mode+' | '+g.weapon+' | '+g.baseWins+'/'+g.n+' | '+g.newWins+'/'+g.n+' | '+g.meanBaseDps+' | '+g.meanNewDps+' | '+g.meanDeltaDps+' | '+g.meanDeltaDamageTaken+' | '+g.meanDeltaManaSpent+' |'),
 '','## Limits',...result.limitations.map(x=>'- '+x),''];
 fs.writeFileSync(file.replace(/\.json$/,'.md'),md.join('\n'));
 console.log('STAGE63_NATIVE_PAIRED='+JSON.stringify({pairs:result.rows.length,groups:result.groups}));
 return result;
}
if(require.main===module)main();
module.exports={compare,main};
