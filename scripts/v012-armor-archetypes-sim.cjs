// Wanderer v0.12 native integrated comparison of player-like gear archetypes.
// Simulation-only: no game rule overrides, item stat boosts, save writes or deployments.
const fs=require('node:fs'),{performance}=require('node:perf_hooks');
const {run}=require('./v012-affinity-combat-sim.cjs');
const variants=[
 {name:'Cloth Staff',archetype:'Cloth / Magic + Aegis + Decay',armorType:'Cloth',family:'magic',targetFamilies:['magic','aegis','decay'],weapon:'Staff',offhandType:null},
 {name:'Cloth Wand/Orb',archetype:'Cloth / Magic + Aegis + Decay',armorType:'Cloth',family:'magic',targetFamilies:['magic','aegis','decay'],weapon:'Wand',offhandType:'Orb'},
 {name:'Plate Mace/Shield',archetype:'Plate / Vitality + Aegis + Fury',armorType:'Plate',family:'vitality',targetFamilies:['vitality','aegis','fury'],weapon:'Mace',offhandType:'Shield'},
 {name:'Plate Sword/Shield',archetype:'Plate / Vitality + Aegis + Fury',armorType:'Plate',family:'vitality',targetFamilies:['vitality','aegis','fury'],weapon:'Sword',offhandType:'Shield'},
 {name:'Leather Dual Daggers',archetype:'Leather / Decay + Fury + Blood',armorType:'Leather',family:'decay',targetFamilies:['decay','fury','blood'],weapon:'Daggers',offhandType:'Daggers'},
 {name:'Leather Bow',archetype:'Leather / Decay + Fury + Blood',armorType:'Leather',family:'decay',targetFamilies:['decay','fury','blood'],weapon:'Bow',offhandType:null}
];
const levels=[1,5,10,25,50,100,200],rarities=['Rare','Epic'],policies=['triple','random'];
const reps=Math.min(24,Math.max(1,Number(process.env.WANDERER_ARCH_REPETITIONS||8)));
const seedOffset=Number(process.env.WANDERER_ARCH_SEED_OFFSET||0),rows=[],problems=[],start=performance.now();
const numeric=(arr,fn,places=2)=>arr.length?+(arr.reduce((sum,x)=>sum+(Number(fn(x))||0),0)/arr.length).toFixed(places):null;
const pct=(a,n)=>n?+(a*100/n).toFixed(1):0;
for(const E of levels)for(const variant of variants)for(const rarity of rarities)for(let rep=0;rep<reps;rep++)for(const strategy of policies){
 // Variant-specific gear seed stays matched across decision policies. No under-the-hood fake passives.
 const seed=(2601020+seedOffset+E*1009+variants.indexOf(variant)*173+rarities.indexOf(rarity)*557+rep*99991)>>>0;
 try{
  const r=run({E,...variant,rarity,seed,strategy,runes:true});
  rows.push({...r,rep});
  if(r.error||r.timeout)problems.push({E,variant:variant.name,rarity,rep,strategy,seed,error:r.error,timeout:r.timeout});
 }catch(e){problems.push({E,variant:variant.name,rarity,rep,strategy,seed,error:String(e?.stack||e)});}
 if(rows.length&&rows.length%200===0)process.stderr.write('Armor archetypes completed '+rows.length+'\n');
}
function summarize(items){
 const n=items.length,fight=items.map(r=>r.firstFight).filter(Boolean);
 return {n,wins:items.filter(r=>r.win).length,winPct:pct(items.filter(r=>r.win).length,n),
  meanRealm:numeric(items,r=>r.reached),bossReached:items.filter(r=>r.bossReached).length,
  allThreeUnlocked:items.filter(r=>r.allTargetsUnlocked).length,
  meanDps:numeric(items,r=>r.dps),meanHealSec:numeric(items,r=>r.healPerSecond,3),
  meanBarrierSec:numeric(items,r=>r.barrierPerSecond,3),meanRotAndBleedDamage:numeric(items,r=>r.dot),
  meanPlayerAttacks:numeric(items,r=>r.weaponAttacks),
  meanMaxHP:numeric(fight,r=>r.playerMaxHP),meanAttack:numeric(fight,r=>r.playerAttack),
  meanDefense:numeric(fight,r=>r.playerDefense),meanSpellPower:numeric(fight,r=>r.playerSpellPower),
  meanBlockPct:numeric(fight,r=>r.playerBlockChance),meanEvasionRating:numeric(fight,r=>r.playerEvasionRating),
  meanAttackSpeed:numeric(fight,r=>r.playerSpeed),
  hybridRuns:items.filter(r=>r.hybrids.length).length,
  totalHybrids:numeric(items,r=>r.hybrids.length),
  hybridActivations:items.reduce((n,r)=>n+Object.values(r.telemetry||{}).reduce((x,p)=>x+(p.activations||0),0),0),
  errors:items.filter(r=>r.error).length,timeouts:items.filter(r=>r.timeout).length};
}
const byArchetype=[],byVariant=[],byRarity=[];
for(const E of levels){
 for(const variant of variants)for(const rarity of rarities)for(const strategy of policies){
  const items=rows.filter(r=>r.E===E&&r.name===variant.name&&r.rarity===rarity&&r.strategy===strategy);
  byRarity.push({E,variant:variant.name,rarity,strategy,...summarize(items)});
 }
 for(const variant of variants)for(const strategy of policies){
  const items=rows.filter(r=>r.E===E&&r.name===variant.name&&r.strategy===strategy);
  byVariant.push({E,variant:variant.name,archetype:variant.archetype,strategy,...summarize(items)});
 }
 for(const archetype of [...new Set(variants.map(x=>x.archetype))])for(const strategy of policies){
  const items=rows.filter(r=>r.E===E&&r.archetype===archetype&&r.strategy===strategy);
  byArchetype.push({E,archetype,strategy,...summarize(items)});
 }
}
const meta={version:'Wanderer v0.12 native integrated',date:'2026-10-20',cases:rows.length,problems:problems.length,seconds:+((performance.now()-start)/1000).toFixed(1),
 levels,reps,seedOffset,rarities,policies,variants,
 method:'Full 5-piece armor family on helm/armor/gloves/belt/boots. 2 actual matching weapons per archetype (two-hand lock respected). Full same-tier Rare or Epic gear in all slots, three same-tier Runes; magic gets wisdom rune, physical might. Real item stats including Cloth INT, Leather evasion and Plate STR; Shield real DEF/HP/block; no armor/class restriction. Exactly targeted initial family and draft/route policy vs random picks/routes on matched initial seeds. No potions, events declined, no gear swaps, no player save/Firebase or main changes. 15-Realms.'
};
const data={meta,byArchetype,byVariant,byRarity,problems:problems.slice(0,12)};
fs.writeFileSync(process.argv[2]||'/tmp/wanderer-v012-armor-archetypes.json',JSON.stringify({...data,rows})+'\n');
console.log('ARMOR_ARCHETYPE_SUMMARY_BEGIN');
console.log(JSON.stringify(data));
console.log('ARMOR_ARCHETYPE_SUMMARY_END');
if(problems.length)process.exitCode=1;
