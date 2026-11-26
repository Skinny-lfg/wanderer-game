'use strict';
// Stage 6.3 native combat, legal but synthetic 24-point builds, not earned E1 progression.
const fs=require('node:fs'),path=require('node:path');
const S=require(process.env.STAGE63_NATIVE_ROOT?path.resolve(process.env.STAGE63_NATIVE_ROOT,'scripts/simulate-progression.cjs'):'./simulate-progression.cjs');
const cases=[
 {mode:'arcane',skills:['element_choice','arcane_focus','mana_spring','arcane_resonance'],families:['arcane'],weapons:['Sword','Mace','Daggers','Wand','Staff']},
 {mode:'fire',skills:['element_choice','arcane_focus','mana_spring','kindling'],families:['arcane'],weapons:['Sword','Wand','Staff']},
 {mode:'frost',skills:['element_choice','arcane_focus','mana_spring','deep_winter'],families:['arcane'],weapons:['Sword','Wand','Staff']},
 {mode:'lightning',skills:['element_choice','arcane_focus','mana_spring','overcharge'],families:['arcane'],weapons:['Sword','Wand','Staff']},
 {mode:'arcane-decay',skills:['affinity_decay','element_choice','arcane_focus','corrupting_touch','hex_bolt'],families:['arcane','decay'],weapons:['Sword','Wand','Staff']},
 {mode:'arcane-aegis',skills:['affinity_aegis','element_choice','arcane_focus','guarded_block','runic_shield'],families:['arcane','aegis'],weapons:['Sword','Wand','Staff']}
];
const PROFILES=Object.freeze(cases.flatMap(o=>o.weapons.map(weapon=>Object.freeze({
 id:o.mode+'-'+weapon.toLowerCase(),name:o.mode+' / '+weapon,mode:o.mode,weapon,
 families:o.families,skills:o.skills,element:['fire','frost','lightning'].includes(o.mode)?o.mode:'arcane'
}))));
function mean(a){return a.length?+(a.reduce((n,x)=>n+x,0)/a.length).toFixed(2):null;}
function run({levels=[5,35],seeds=[9201,9202],tickLimit=2500}={}){
 const rows=[],errors=[],opts={...S.DEFAULTS,mode:'affinities',gear:'current',
  rarity:'Rare',points:24,measure:true,lockScenarioStreams:true,boons:'none',
  contracts:'none',tickLimit,targetPolicy:'mechanics'};
 for(const level of levels)for(const seed of seeds)for(const build of PROFILES){
  try{
   const r=S.encounter(level,build,seed,'normal',opts,undefined,undefined,undefined,1,3);
   if(r.error||!['cleared','died','timeout'].includes(r.status))throw Error('Invalid native status '+r.status+' / '+r.error);
   if(r.pointsSpent!==24)throw Error('Not all 24 legal Talent points were allocated');
   rows.push({level,seed,mode:build.mode,weapon:build.weapon,build:build.id,
    won:r.won,died:r.died,timedOut:r.timedOut,seconds:r.seconds,damageDealt:r.damageDealt,
    damageTaken:r.damageTaken,dps:r.seconds>0?+(r.damageDealt/r.seconds).toFixed(2):0,
    hpMax:r.hpMax,hpEnd:r.hpEnd,mpMax:r.mpMax,mpEnd:r.mpEnd,manaSpent:r.manaSpent,
    infusionActivations:Number(r.infusionActivations)||0,infusionHits:Number(r.infusionHits)||0,
    infusionDamage:Number(r.infusionDamage)||0,fundedCasts:Number(r.fundedCasts)||0,
    gearFingerprint:r.gearFingerprint,pointsSpent:r.pointsSpent,
    realm:r.realm,risk:r.risk,groupSize:r.groupSize});
  }catch(err){errors.push({level,seed,build:build.id,error:err.stack||err.message});}
 }
 const groups=[];
 for(const level of levels)for(const mode of [...new Set(PROFILES.map(x=>x.mode))])
  for(const weapon of [...new Set(PROFILES.filter(x=>x.mode===mode).map(x=>x.weapon))]){
   const selected=rows.filter(x=>x.level===level&&x.mode===mode&&x.weapon===weapon);
   if(!selected.length)continue;
   groups.push({level,mode,weapon,n:selected.length,wins:selected.filter(x=>x.won).length,
    meanDps:mean(selected.map(x=>x.dps)),meanDamageDealt:mean(selected.map(x=>x.damageDealt)),
    meanDamageTaken:mean(selected.map(x=>x.damageTaken)),meanManaSpent:mean(selected.map(x=>x.manaSpent)),
    meanInfusionHits:mean(selected.map(x=>x.infusionHits)),meanInfusionDamage:mean(selected.map(x=>x.infusionDamage)),
    meanFundedCasts:mean(selected.map(x=>x.fundedCasts)),meanMaxHP:mean(selected.map(x=>x.hpMax))});
  }
 const report={stage:'6.3',model:'native-combat-synthetic-legally-allocated-24-point-builds',
  sourceSha256:S.sourceFingerprint().sha256,settings:{levels,seeds,rarity:'Rare',risk:'Dangerous',mobs:3,tickLimit,points:24},
  groups,rows,errors,limitations:[
   'Weapon types use different legitimately rolled equipment, not matched-stat A/B tests.',
   '24 legal points are synthetic and are not earned E1/E2 progression.',
   'Only the first fight is staged. Native enemy AI, damage, Mana and combat are executed.',
   'Do not equate raw DPS with balance: survivability, resources, status and AoE matter.',
   'Preview branch only: no merge or deploy.'
  ],success:errors.length===0&&rows.length===levels.length*seeds.length*PROFILES.length};
 const file=path.resolve(process.env.STAGE63_REPORT_FILE||'reports/stage63-native-arcane-matrix.json');
 fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(report,null,2)+'\n');
 const md=['# Stage 6.3 — Native Magic weapon matrix','',
 '24 legal points, real Rare gear, deterministic seeds and Dangerous three-enemy encounters; NOT natural account progress.','',
 '| E | Magic path | Weapon | Victories | Mean DPS | Mean incoming damage | Max HP | Infusion hits | Infusion damage | Funded casts |',
 '|---|---|---|---:|---:|---:|---:|---:|---:|---:|',
 ...groups.map(g=>'| '+g.level+' | '+g.mode+' | '+g.weapon+' | '+g.wins+'/'+g.n+' | '+g.meanDps+' | '+g.meanDamageTaken+' | '+g.meanMaxHP+' | '+g.meanInfusionHits+' | '+g.meanInfusionDamage+' | '+g.meanFundedCasts+' |'),
 '','## Limits',...report.limitations.map(x=>'- '+x),'','Errors: '+errors.length,''];
 fs.writeFileSync(file.replace(/\.json$/,'.md'),md.join('\n'));
 console.log('STAGE63_NATIVE='+JSON.stringify({success:report.success,cases:rows.length,errors:errors.slice(0,3),groups:groups.map(x=>({level:x.level,mode:x.mode,weapon:x.weapon,wins:x.wins,n:x.n,dps:x.meanDps,infusion:x.meanInfusionDamage}))}));
 if(!report.success)process.exitCode=1;return report;
}
if(require.main===module)run();
module.exports={PROFILES,run};
