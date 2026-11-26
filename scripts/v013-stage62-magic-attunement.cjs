'use strict';
// Stage 6.2: experimental Arcane Attunement contract and coefficient sweep.
// Never loaded by native combat or talent UI. Gameplay changes require Stage 6.3.
const fs=require('node:fs'),path=require('node:path');
const stage61=require('./v013-stage61-arcane-infusion.cjs');
require('../combat/v012-buildcraft.js');
require('../combat/talent-catalog.js');
require('../combat/talent-graph-next.js');
require('../combat/talent-graph-bridge.js');
require('../combat/talent-graph-runtime.js');
const T=globalThis.WandererAutomaticTalents;
const MODES=Object.freeze({
 unattuned:Object.freeze({name:'Unattuned Magic',kind:'infusion',source:'affinity_arcane',manaCost:6,description:'A Mana-paid, Spell-Power-based weapon enchantment; no independent Arcane cast.'}),
 arcane:Object.freeze({name:'Arcane',kind:'enhanced_infusion',source:'element_choice',manaCost:5,bonusSpellPowerFractionAdd:.10,description:'Empowers the baseline enchantment and reduces its cost by 1 Mana. No standalone projectile.'}),
 fire:Object.freeze({name:'Fire',kind:'elemental_cast',element:'fire',source:'element_choice',manaCost:8,initialCast:'Fire spell',status:'burn',description:'Immediately unlocks a funded Fire spell; following nodes specialize Burn.'}),
 frost:Object.freeze({name:'Frost',kind:'elemental_cast',element:'frost',source:'element_choice',manaCost:8,initialCast:'Frost spell',status:'chill',description:'Immediately unlocks a funded Frost spell; following nodes specialize control.'}),
 lightning:Object.freeze({name:'Lightning',kind:'elemental_cast',element:'lightning',source:'element_choice',manaCost:8,initialCast:'Lightning spell',status:'shock',description:'Immediately unlocks a funded Lightning spell; following nodes specialize chains.'})
});
function attunement(p){
 if(!T.valid(p))throw Error('Invalid v15 progress');
 if(!p.nodes.includes('affinity_arcane'))return null;
 if(!p.nodes.includes('element_choice'))return MODES.unattuned;
 return MODES[p.element||'arcane'];
}
function choose(progress,mode){return ['arcane','fire','frost','lightning'].includes(mode)?T.selectElement(progress,mode):null;}
function mean(a){return +(a.reduce((x,y)=>x+y,0)/a.length).toFixed(2);}
function sweep(){
 const rows=stage61.nativeCases(),coefficients=[.30,.45,.60,.70,.75,.80,.85,.90,1,1.10];
 return coefficients.map(factor=>{
  const results=rows.map(row=>{
   const out=stage61.simulate(row.scenario,'infusion',{bonusSpellPowerFraction:factor});
   return {weapon:row.scenario.weapon,damageDelta:out.totalDamage-row.baseline.totalDamage,manaDelta:out.manaSpent-row.baseline.manaSpent};
  });
  const physical=results.filter(x=>['Sword','Mace','Daggers'].includes(x.weapon)),casters=results.filter(x=>['Wand','Staff'].includes(x.weapon));
  return {factor,physicalMeanDamageDelta:mean(physical.map(x=>x.damageDelta)),casterMeanDamageDelta:mean(casters.map(x=>x.damageDelta)),
   physicalMeanManaDelta:mean(physical.map(x=>x.manaDelta)),casterMeanManaDelta:mean(casters.map(x=>x.manaDelta))};
 });
}
function run(){
 const candidates=sweep(),closest=[...candidates].sort((a,b)=>Math.abs(a.physicalMeanDamageDelta)-Math.abs(b.physicalMeanDamageDelta))[0];
 const report={stage:'6.2',scope:'isolated-candidate-not-native-combat',
  modes:MODES,coefficientSweep:candidates,
  recommendation:{physicalDamageClosestMultiplier:closest.factor,physicalDelta:closest.physicalMeanDamageDelta,casterDelta:closest.casterMeanDamageDelta,
   caution:'Diagnostic coefficient only. Same multiplier may favor casters; native full combat and cross-Affinity triggers required before approval.'},
  limits:[
   'Actual Magic gameplay still casts Arcane before element choice. This Stage 6.2 module is not loaded in combat.',
   'Mode selection is validated against the existing native v15 talent tree; unique mode bonuses remain an experimental contract.',
   '60s timings use actual seeded Magic stats but ignore enemy defense, statuses, target changes, crits and enemy attacks.',
   'Stage 6.3 must integrate the buff, casts, hybrid callbacks and player descriptions atomically to avoid broken builds.'
  ]};
 const file=path.resolve('reports/stage62-arcane-attunement.json');fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(report,null,2)+'\n');
 const md=['# Stage 6.2 — Arcane Attunement candidate, not yet live','',
 'Affinity Magic grants Arcane Infusion. Each element choice has an immediate reason to spend a point. Arcane improves the enchantment, while Fire/Frost/Lightning each unlock a spell.','',
 '| Infusion coefficient | Mean physical damage delta / 60s | Mean caster damage delta / 60s | Mean physical Mana spent delta |',
 '|---:|---:|---:|---:|',
 ...candidates.map(x=>'| '+Math.round(x.factor*100)+'% | '+x.physicalMeanDamageDelta+' | '+x.casterMeanDamageDelta+' | '+x.physicalMeanManaDelta+' |'),
 '', 'Physical closest-match coefficient: '+Math.round(closest.factor*100)+'% Spell Power per charge. NOT approved for live balance.','',
 '## Choice contract', ...Object.entries(MODES).map(([k,v])=>'- '+k+': '+v.description),
 '', '## Limits', ...report.limits.map(x=>'- '+x),''];
 fs.writeFileSync(file.replace(/\.json$/,'.md'),md.join('\n'));
 console.log('STAGE62_MAGIC='+JSON.stringify({cases:15,closest,coefficients:candidates}));
 return report;
}
if(require.main===module)run();
module.exports={MODES,T,attunement,choose,sweep,run};
