'use strict';
const fs=require('node:fs'),path=require('node:path');
const avg=a=>a.length?+(a.reduce((n,x)=>n+x,0)/a.length).toFixed(2):null;
const KEYS=['level','seed','encounter','mode','weapon','build','gearFingerprint',
 'pointsSpent','realm','risk','groupSize','rosterHash','hpMax','mpStart','mpMax'];
function compare(before,after){
 if(before.rows.length!==after.rows.length||before.errors.length||after.errors.length)throw Error('Native cohorts incomplete');
 const old=new Map(before.rows.map(row=>[row.key,row])),rows=[];
 if(old.size!==before.rows.length)throw Error('Repeated baseline key');
 for(const r of after.rows){
  const a=old.get(r.key);if(!a)throw Error('Missing paired fixture '+r.key);
  for(const key of KEYS)if(a[key]!==r[key])throw Error('Paired initial fixture drift on '+key+': '+r.key+' '+a[key]+' != '+r[key]);
  rows.push({key:r.key,level:r.level,seed:r.seed,encounter:r.encounter,mode:r.mode,weapon:r.weapon,
   oldWin:a.won,newWin:r.won,
   oldDps:a.dps,newDps:r.dps,deltaDps:+(r.dps-a.dps).toFixed(2),
   oldDamageTaken:a.damageTaken,newDamageTaken:r.damageTaken,deltaDamageTaken:r.damageTaken-a.damageTaken,
   oldMana:a.manaSpent,newMana:r.manaSpent,deltaMana:r.manaSpent-a.manaSpent,
   oldHpEnd:a.hpEnd,newHpEnd:r.hpEnd,deltaHpEnd:r.hpEnd-a.hpEnd,
   oldSeconds:a.seconds,newSeconds:r.seconds,
   infusionHits:r.infusionHits,infusionDamage:r.infusionDamage,
   fallbackAttacks:r.unfundedCasterAttacks,
   gearFingerprint:r.gearFingerprint});
 }
 const grouped=[...new Set(rows.map(r=>[r.level,r.encounter,r.mode,r.weapon].join('|')))].map(key=>{
  const rs=rows.filter(r=>[r.level,r.encounter,r.mode,r.weapon].join('|')===key),a=rs[0];
  return {level:a.level,encounter:a.encounter,mode:a.mode,weapon:a.weapon,n:rs.length,
   beforeWins:rs.filter(r=>r.oldWin).length,afterWins:rs.filter(r=>r.newWin).length,
   oldDps:avg(rs.map(r=>r.oldDps)),newDps:avg(rs.map(r=>r.newDps)),
   deltaDps:avg(rs.map(r=>r.deltaDps)),deltaMana:avg(rs.map(r=>r.deltaMana)),
   deltaDamageTaken:avg(rs.map(r=>r.deltaDamageTaken)),deltaHpEnd:avg(rs.map(r=>r.deltaHpEnd)),
   meanFallbackAttacks:avg(rs.map(r=>r.fallbackAttacks)),meanInfusionHits:avg(rs.map(r=>r.infusionHits))};
 });
 return {stage:'6.4',type:'native-paired-before-after',sourceBefore:'7cfa96a198632c2d602ee8159c2ddc3d4f6975e8',
  records:rows.length,groups:grouped,rows,
  caveats:[
   'Same generated gear, initial HP and Mana, level, risk, enemy roster and seed for each pair; combat RNG may diverge after first different action.',
   '24 legally allocated but synthetic points; not E1-E10 natural progression.',
   'Two seeds per cell and controlled rooms/Bosses; do not call this an approved global balance or player win rate.'
  ]};
}
function main(){
 const before=JSON.parse(fs.readFileSync('reports/stage64-native-before.json','utf8'));
 const after=JSON.parse(fs.readFileSync('reports/stage64-native-after.json','utf8'));
 if(!before.success||!after.success)throw Error('Native matrix incomplete');
 const result=compare(before,after),file=path.resolve('reports/stage64-native-comparison.json');
 fs.writeFileSync(file,JSON.stringify(result,null,2)+'\n');
 const md=['# Wanderer Stage 6.4 — Native Magic before/after','',
 'Same generated gear, HP/Mana, enemy roster and seed. Real combat, synthetic legal 24-point builds.','',
 '| E | Encounter | Magic mode | Weapon | Wins prior → new | DPS prior → new | Mana delta | Damage taken delta | Unfunded caster attacks |',
 '|---|---|---|---|---:|---:|---:|---:|---:|',
 ...result.groups.map(g=>'| '+g.level+' | '+g.encounter+' | '+g.mode+' | '+g.weapon+' | '+g.beforeWins+'/'+g.n+' → '+g.afterWins+'/'+g.n+' | '+g.oldDps+' → '+g.newDps+' | '+g.deltaMana+' | '+g.deltaDamageTaken+' | '+g.meanFallbackAttacks+' |'),
 '','## Limits',...result.caveats.map(x=>'- '+x),''];
 fs.writeFileSync(file.replace(/\.json$/,'.md'),md.join('\n'));
 console.log('STAGE64_PAIRED='+JSON.stringify({pairs:result.records,highlights:result.groups.filter(g=>g.level===35&&g.encounter==='group-10'&&['arcane','fire','lightning'].includes(g.mode))
  .map(g=>({mode:g.mode,weapon:g.weapon,wins:g.beforeWins+'/'+g.afterWins,dps:g.oldDps+'/'+g.newDps,manaDelta:g.deltaMana,damageDelta:g.deltaDamageTaken,fallbacks:g.meanFallbackAttacks}))}));
 return result;
}
if(require.main===module)main();
module.exports={compare,main};
