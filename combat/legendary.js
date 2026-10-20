(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.WandererLegendary=api;})(globalThis,function(){
'use strict';
const DEFINITIONS={
 "soul-reaver": {
  "affinity": "drain",
  "name": "Soul Harvest",
  "cooldown": 10,
  "description": "Applying Drain primes the next main attack to ignore 20% Armor. 10s cooldown."
 },
 "runeforged-eclipse": {
  "affinity": "crystal",
  "name": "Eclipse Breaker",
  "cooldown": 12,
  "description": "Strip Barrier equal to 35% of a normal hit; gain 30% of Barrier removed. 12s cooldown."
 },
 "starweaver-relic": {
  "affinity": "shock",
  "name": "Spell Echo",
  "cooldown": 10,
  "description": "Every third funded spell refunds 40% of mana cost and echoes 20% normal damage. 10s cooldown; no extra procs."
 },
 "blade-of-the-first-dawn": {
  "affinity": "crit",
  "name": "Dawn Mark",
  "cooldown": 12,
  "description": "First attack marks for 6s. First critical consumes the mark for +25% normal damage. 12s cooldown."
 },
 "hammer-of-the-sunforge": {
  "affinity": "sunder",
  "name": "Armor Crusher",
  "cooldown": 10,
  "description": "Applying Sunder weakens the next enemy attack by 15%. 10s cooldown."
 },
 "sunpiercer-longbow": {
  "affinity": "nature",
  "name": "Wildroot Volley",
  "cooldown": 10,
  "description": "Effective Nature healing grants 10% attack speed for 3s. 10s cooldown; does not stack."
 },
 "fang-of-the-sunbreaker": {
  "affinity": "poison",
  "name": "Toxic Fang",
  "cooldown": 12,
  "description": "Main attack against 3+ Rot stacks adds one Rot stack. Respects the six-stack cap. 12s cooldown."
 },
 "helm-of-the-dawnwarden": {
  "affinity": "shield",
  "name": "Dawnward",
  "cooldown": 14,
  "description": "Barrier breaking primes 12% mitigation for the next enemy attack. 14s cooldown."
 },
 "cuirass-of-the-last-sunrise": {
  "affinity": "regen",
  "name": "Last Sunrise",
  "cooldown": 15,
  "description": "Survive a hit exceeding 12% max HP: recover 30% of HP damage over 3s. 15s cooldown."
 },
 "sunstride-sabatons": {
  "affinity": "shock",
  "name": "Thunderstep",
  "cooldown": 10,
  "description": "Every fourth main attack grants 12% attack speed for 3s. 10s cooldown; does not stack."
 },
 "heart-of-shadows": {
  "affinity": "drain",
  "name": "Umbral Refuge",
  "cooldown": 14,
  "description": "Survive an attack below 35% HP: prime the next main attack to heal 3% max HP. 14s cooldown."
 },
 "pendant-of-the-first-flame": {
  "affinity": "burn",
  "name": "Kindled Heart",
  "cooldown": 0,
  "description": "Kill an enemy with active Burn to heal 3% max HP. Once per encounter."
 },
 "signet-of-the-dawnforged": {
  "affinity": "crit",
  "name": "Golden Focus",
  "cooldown": 12,
  "description": "Critical hit primes +15 percentage points of weapon affinity proc chance for the next main attack, capped at 100%. 12s cooldown."
 },
 "aegis-of-the-dawnstar": {
  "affinity": "shield",
  "name": "Dawnstar Bulwark",
  "cooldown": 12,
  "description": "When incoming damage breaks Barrier, restore 7% max HP Barrier. 12s cooldown."
 },
 "crescent-of-the-emberveil": {
  "affinity": "bleed",
  "name": "Crimson Crescent",
  "cooldown": 9,
  "description": "A damaging main attack extends one Bleed stack by one tick while equipped in either hand, max 6 ticks. 9s cooldown."
 },
 "orb-of-the-solar-heart": {
  "affinity": "tide",
  "name": "Solar Current",
  "cooldown": 12,
  "description": "Barrier absorbing damage heals 1.5% max HP. 12s cooldown."
 },
 "tome-of-the-eternal-flame": {
  "affinity": "burn",
  "name": "Ashen Seal",
  "cooldown": 12,
  "description": "At 3+ Burn stacks, consume one to weaken the next enemy attack by 15%. 12s cooldown."
 },
 "charm-of-the-dawnstar": {
  "affinity": "nature",
  "name": "Dawnstar Bloom",
  "cooldown": 12,
  "description": "Store up to 4% max HP from a heal (including overheal); release after the next surviving HP hit. 12s cooldown; cannot refill itself."
 },
 "winterheart-spire": {
  "affinity": "slow",
  "name": "Winterheart",
  "cooldown": 12,
  "description": "Funded spell against a Chilled enemy extends Chill by 1s (max 4s) and delays its attack by 0.5s (boss 0.2s). Shares delay immunity. 12s cooldown."
 }
};
const GENERIC_IDS=['grasp-of-the-sunbound','scepter-of-the-emberstar','the-eternal-oath'];
function resolve(item){return item?.rarity==='Legendary'?DEFINITIONS[item.legendaryId]||null:null;}
return {DEFINITIONS,GENERIC_IDS,resolve};
});
