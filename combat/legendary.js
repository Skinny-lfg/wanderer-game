(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 root.WandererLegendary=api;
})(globalThis,function(){
 'use strict';
 // Each identity gets one bounded, deterministic, non-recursive effect.
 // All cooldowns are combat seconds and are scoped to the expedition.
 const DEFINITIONS={
  'soul-reaver':{affinity:'drain',name:'Soul Harvest',cooldown:10,description:'Main attack against an enemy below 50% HP restores 3% max HP. 10s cooldown.'},
  'runeforged-eclipse':{affinity:'crystal',name:'Eclipse Breaker',cooldown:12,description:'Main attack strips enemy Barrier equal to 35% of a normal hit. Requires Barrier. 12s cooldown.'},
  'the-eternal-oath':{affinity:'shield',name:'Oathbound Riposte',cooldown:10,description:'Blocking retaliates for 18% of normal main-hit damage, without applying affinities. 10s cooldown.'},
  'heart-of-shadows':{affinity:'drain',name:'Umbral Refuge',cooldown:14,description:'After surviving HP damage at or below 50% HP, recover 4% max HP. 14s cooldown.'},
  'starweaver-relic':{affinity:'shock',name:'Starfall',cooldown:9,description:'Every third mana-funded spell gains 20% normal-hit bonus damage. 9s cooldown.'},
  'helm-of-the-dawnwarden':{affinity:'shield',name:'Dawnward',cooldown:14,description:'After surviving HP damage with no Barrier remaining, gain 5% max HP Barrier. 14s cooldown.'},
  'cuirass-of-the-last-sunrise':{affinity:'regen',name:'Last Sunrise',cooldown:15,description:'After surviving an HP hit of at least 12% max HP, gain 6% max HP Barrier. 15s cooldown.'},
  'grasp-of-the-sunbound':{affinity:'burn',name:'Searing Grip',cooldown:8,description:'Critical main attack against a Burning enemy deals 16% extra normal-hit damage. 8s cooldown.'},
  'sunstride-sabatons':{affinity:'shock',name:'Thunderstep',cooldown:8,description:'Every fourth main attack deals 14% extra normal-hit damage. 8s cooldown.'},
  'pendant-of-the-first-flame':{affinity:'burn',name:'Kindled Heart',cooldown:10,description:'Against a Burning enemy, main attack deals 16% extra normal-hit damage and heals 1% max HP. 10s cooldown.'},
  'signet-of-the-dawnforged':{affinity:'crit',name:'Golden Focus',cooldown:10,description:'Landing a Critical main attack grants 2.5% max HP Barrier. 10s cooldown.'},
  'aegis-of-the-dawnstar':{affinity:'shield',name:'Dawnstar Bulwark',cooldown:12,description:'Blocking with less than 10% max HP in Barrier grants 7% max HP Barrier. 12s cooldown.'},
  'blade-of-the-first-dawn':{affinity:'crit',name:'First Light',cooldown:10,description:'Main attack against an enemy above 70% HP deals 18% extra normal-hit damage. 10s cooldown.'},
  'hammer-of-the-sunforge':{affinity:'sunder',name:'Forgebreaker',cooldown:10,description:'Main attack against an enemy with reduced Armor deals 22% extra normal-hit damage. 10s cooldown.'},
  'sunpiercer-longbow':{affinity:'nature',name:'Wildroot Volley',cooldown:12,description:'Main attack against an enemy below 50% HP deals 18% extra normal-hit damage and heals 1% max HP. 12s cooldown.'},
  'fang-of-the-sunbreaker':{affinity:'poison',name:'Toxic Fang',cooldown:8,description:'Main attack against an enemy with 3+ Poison stacks deals 22% extra normal-hit damage. 8s cooldown.'},
  'scepter-of-the-emberstar':{affinity:'burn',name:'Emberstar Flare',cooldown:10,description:'A mana-funded spell against a Burning enemy deals 20% extra normal-hit damage. 10s cooldown.'},
  'crescent-of-the-emberveil':{affinity:'bleed',name:'Crimson Crescent',cooldown:7,description:'Main attack against a Bleeding enemy deals 14% extra normal-hit damage. 7s cooldown.'},
  'orb-of-the-solar-heart':{affinity:'tide',name:'Solar Current',cooldown:8,description:'While Barrier remains, main attack deals 12% extra normal-hit damage and restores 1.5% max HP Barrier. 8s cooldown.'},
  'tome-of-the-eternal-flame':{affinity:'burn',name:'Infernal Script',cooldown:12,description:'Main attack against an enemy with 3+ Burn stacks deals 24% extra normal-hit damage. 12s cooldown.'},
  'charm-of-the-dawnstar':{affinity:'nature',name:'Dawnstar Bloom',cooldown:10,description:'Main attack below 75% HP restores 2.5% max HP. 10s cooldown.'}
 };
 function resolve(item){
  if(!item||item.rarity!=='Legendary')return null;
  return DEFINITIONS[item.legendaryId]||null;
 }
 // Ratios refer to the ordinary base hit/max HP, never damage after a proc.
 function attack(id,c){
  const e=c.enemyHpRatio,h=c.hpRatio;
  switch(id){
   case 'soul-reaver': return e<.5?{heal:.03}:null;
   case 'runeforged-eclipse': return c.enemyBarrier>0?{removeBarrier:.35}:null;
   case 'starweaver-relic': return c.cast&&c.castCount%3===0?{damage:.20}:null;
   case 'grasp-of-the-sunbound': return c.critical&&c.burn>=1?{damage:.16}:null;
   case 'sunstride-sabatons': return c.attackCount%4===0?{damage:.14}:null;
   case 'pendant-of-the-first-flame': return c.burn>=1?{damage:.16,heal:.01}:null;
   case 'signet-of-the-dawnforged': return c.critical?{barrier:.025}:null;
   case 'blade-of-the-first-dawn': return e>.7?{damage:.18}:null;
   case 'hammer-of-the-sunforge': return c.enemyArmorRatio<1?{damage:.22}:null;
   case 'sunpiercer-longbow': return e<.5?{damage:.18,heal:.01}:null;
   case 'fang-of-the-sunbreaker': return c.poison>=3?{damage:.22}:null;
   case 'scepter-of-the-emberstar': return c.cast&&c.burn>=1?{damage:.20}:null;
   case 'crescent-of-the-emberveil': return c.bleed>=1?{damage:.14}:null;
   case 'orb-of-the-solar-heart': return c.barrierRatio>0?{damage:.12,barrier:.015}:null;
   case 'tome-of-the-eternal-flame': return c.burn>=3?{damage:.24}:null;
   case 'charm-of-the-dawnstar': return h<.75?{heal:.025}:null;
   default:return null;
  }
 }
 function defense(id,c){
  switch(id){
   case 'the-eternal-oath':return c.blocked>0?{retaliate:.18}:null;
   case 'heart-of-shadows':return c.hit>0&&c.hpRatio>0&&c.hpRatio<=.5?{heal:.04}:null;
   case 'helm-of-the-dawnwarden':return c.hit>0&&c.hpRatio>0&&c.barrierRatio<=0?{barrier:.05}:null;
   case 'cuirass-of-the-last-sunrise':return c.hit>=.12*c.maxhp&&c.hpRatio>0?{barrier:.06}:null;
   case 'aegis-of-the-dawnstar':return c.blocked>0&&c.barrierRatio<.10?{barrier:.07}:null;
   default:return null;
  }
 }
 return {DEFINITIONS,resolve,attack,defense};
});
