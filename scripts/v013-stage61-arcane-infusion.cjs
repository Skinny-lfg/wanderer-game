'use strict';
// Stage 6.1: isolated deterministic mechanic prototype, NEVER wired into gameplay.
// Uses real v0.13 derived player stats but intentionally omits enemy AI/DEF, crit,
// DoTs, target changes, gear procs and weapon-borne effects. Not a native fight.
const fs=require('node:fs'),path=require('node:path');
const create=require('../tests/v012-economy-harness.cjs');
const B=require('../tests/v013-current-talent-helper.cjs');
const STEP=.02,EPS=1e-8;
const FACTORS=Object.freeze({Sword:1.12,Mace:1.4,Daggers:.8,Bow:1.08,'Two-Handed':1.7,Wand:.55,Staff:.55});
function simulate(input,variant='baseline',candidate={}){
 const config={costMana:6,cooldownSeconds:6,durationSeconds:7,charges:2,bonusSpellPowerFraction:.30,...candidate};
 if(!(config.costMana>0&&config.costMana<=20&&config.cooldownSeconds>0&&config.cooldownSeconds<=30&&config.durationSeconds>0&&config.durationSeconds<=30&&Number.isInteger(config.charges)&&config.charges>=1&&config.charges<=6&&config.bonusSpellPowerFraction>=0&&config.bonusSpellPowerFraction<=2))throw Error('Invalid candidate coefficients');
 if(!['baseline','infusion'].includes(variant))throw Error('Unknown Stage 6.1 scenario');
 const s={...input},caster=['Wand','Staff'].includes(s.weapon);
 if(!(s.seconds>0&&s.seconds<=120&&s.speed>=0&&s.speed<=5&&s.spellPower>=0&&s.attack>=0&&s.maxMana>=0&&s.manaRegen>=0))throw Error('Invalid controlled input');
 const interval=s.speed>0?1/s.speed:Infinity,castCost=s.weapon==='Staff'?13:9;
 const output={variant,totalDamage:0,weaponDamage:0,arcaneDamage:0,infusionDamage:0,manaSpent:0,weaponCasts:0,arcaneCasts:0,attacks:0,infusions:0,empoweredMainHits:0,expiredCharges:0,starvedWeaponAttacks:0,manaEnd:0};
 let mp=s.maxMana,nextAttack=0,nextArcane=0,nextInfusion=0,expires=-1,charges=0;
 const consume=n=>{if(mp+EPS<n)return false;mp-=n;output.manaSpent+=n;return true;};
 for(let i=0;i<=Math.floor(s.seconds/STEP);i++){
  const t=+(i*STEP).toFixed(5);
  if(i)mp=Math.min(s.maxMana,mp+s.manaRegen*STEP);
  if(variant==='infusion'&&charges>0&&t+EPS>=expires){output.expiredCharges+=charges;charges=0;}
  if(variant==='infusion'&&t+EPS>=nextInfusion&&charges===0&&consume(config.costMana)){
   charges=config.charges;expires=t+config.durationSeconds;nextInfusion=t+config.cooldownSeconds;output.infusions++;
  }
  if(t+EPS>=nextAttack){
   nextAttack=t+interval;output.attacks++;
   let mainDamage;
   if(caster&&consume(castCost)){mainDamage=Math.max(1,Math.round(s.spellPower*(s.weapon==='Staff'?1.32:1.05)));output.weaponCasts++;}
   else {mainDamage=Math.max(1,Math.round(s.attack*(FACTORS[s.weapon]||1)));if(caster)output.starvedWeaponAttacks++;}
   output.weaponDamage+=mainDamage;output.totalDamage+=mainDamage;
   if(variant==='infusion'&&charges>0&&t<expires-EPS){
    const bonus=Math.round(s.spellPower*config.bonusSpellPowerFraction);
    output.infusionDamage+=bonus;output.totalDamage+=bonus;charges--;output.empoweredMainHits++;
   }
   // Off-Hand Dagger is deliberately excluded from the proposed charge consumer.
  }
  if(variant==='baseline'&&!caster&&t+EPS>=nextArcane&&consume(8)){
   nextArcane=t+2.5;
   const damage=Math.max(1,Math.round(s.spellPower*.70));
   output.arcaneDamage+=damage;output.totalDamage+=damage;output.arcaneCasts++;
  }
 }
 output.manaEnd=+Math.max(0,mp).toFixed(2);
 return output;
}
function nativeCases(){
 const rows=[];
 for(const seed of [101,211,307])for(const weapon of ['Sword','Daggers','Mace','Wand','Staff']){
  const a=create(seed,undefined,{}, {skipPersistence:true});
  a.state().automaticTalents=B.buy(['affinity_magic']);
  const item=a.makeItem(seed===101?1:35,'weapon',null,'loot',weapon,seed===101?'Common':'Rare');
  const stats=a.baseStats({weapon:item});
  if(!stats.phase2Magic||stats.spellPower<=0||stats.mana<=0)throw Error('Native Magic stats missing: '+weapon);
  const scenario={seed,weapon,rarity:item.rarity,seconds:60,attack:stats.attack,speed:stats.attacksPerSec,spellPower:stats.spellPower,maxMana:stats.mana,manaRegen:stats.manaRegen};
  const before=simulate(scenario,'baseline'),after=simulate(scenario,'infusion');
  rows.push({scenario,baseline:before,infusion:after,deltaDamage:after.totalDamage-before.totalDamage,deltaMagicContribution:(after.arcaneDamage+after.infusionDamage)-(before.arcaneDamage+before.infusionDamage)});
 }
 return rows;
}
function run(){
 const rows=nativeCases();
 const summary=Object.fromEntries(['Sword','Daggers','Mace','Wand','Staff'].map(weapon=>{
  const group=rows.filter(r=>r.scenario.weapon===weapon),avg=key=>+(group.reduce((n,r)=>n+r[key],0)/group.length).toFixed(2);
  return [weapon,{cases:group.length,meanDeltaTotalDamage:avg('deltaDamage'),meanDeltaMagicDamage:avg('deltaMagicContribution'),
   totalBaselineArcaneCasts:group.reduce((n,r)=>n+r.baseline.arcaneCasts,0),totalProposedInfusions:group.reduce((n,r)=>n+r.infusion.infusions,0)}];
 }));
 const report={stage:'6.1',label:'theory-controlled-60s-native-stats-not-native-encounter',candidate:{costMana:6,cooldownSeconds:6,durationSeconds:7,charges:2,bonusSpellPowerFraction:.30},baseline:{arcaneIntervalSeconds:2.5,arcaneManaCost:8,arcaneSpellPowerFraction:.70},summary,rows,
  limits:['Stats obtained from the native game with legit Magic affinity and seeded real rolled equipment. The prototype itself is not connected to the live combat engine.',
  'No enemy defense, resistance, dodge, crit, DoTs, crowd control, passive callbacks, spell effects, target swapping, gear traits or decision policy.',
  'Wand and Staff keep their own Mana-funded weapon casts; new Infusion competes for Mana. Off-hand dagger hits do not consume or trigger charges.',
  'Damage is a first-order diagnostic, not actual player win probabilities or an approved balance adjustment.']};
 const out=path.resolve('reports/stage61-arcane-infusion.json');fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');
 const text=['# Stage 6.1 — isolated Arcane Infusion prototype','',
  'No change to the native gameplay. All 60s scenarios use real seeded, legal Magic native stats but simplified deterministic combat scheduling.','',
  '| Main weapon | Cases | Avg proposed minus current total damage | Avg magic damage delta |',
  '|---|---:|---:|---:|',
  ...Object.entries(summary).map(([name,x])=>'| '+name+' | '+x.cases+' | '+x.meanDeltaTotalDamage+' | '+x.meanDeltaMagicDamage+' |'),
  '', '### Prototype assumptions', ...report.limits.map(x=>'- '+x),'','Numbers are candidate diagnostics, not approved gameplay coefficients.',''];
 fs.writeFileSync(out.replace(/\.json$/,'.md'),text.join('\n'));
 console.log('STAGE61_ARCANE='+JSON.stringify({cases:rows.length,summary,output:out}));
 return report;
}
if(require.main===module)run();
module.exports={simulate,nativeCases,run};
