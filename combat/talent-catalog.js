// Metadata consumed by the playable talent graph.
(function(root){'use strict';
const ATTRIBUTES=Object.freeze([
  "str",
  "agi",
  "int",
  "end",
  "cha"
]);
const NODES=Object.freeze([
 {"id":"cleave_mastery","name":"Sweeping Force","description":"Two-Handed cleave deals 60% instead of 40% damage to secondary targets."},
 {"id":"fire_spread","name":"Wildfire","description":"Funded Fire casts spread Burn to up to two enemies at 65% damage for up to three seconds, with a small immediate splash."},
 {"id":"frost_spread","name":"Winter Field","description":"Funded Frost casts Chill up to two additional enemies for two seconds."},
 {"id":"plague_spread","name":"Contagion","description":"On kill, spread one active Bleed and Rot at 50% strength to up to two enemies. Active recipients take five transferred ticks instantly; effects cannot spread again."},
 {"id":"bow_pierce","name":"Piercing","description":"Bow hits one additional foe for 100% instead of 66% damage. Secondary weapon hits apply eligible statuses at reduced chance and potency."},
 {"id":"fan_of_blades","name":"Fan of Blades","description":"Daggers strike up to two additional enemies for 22% damage each."},
 {"id":"sword_sweep","name":"Shielded Sweep","description":"Sword and Shield attacks hit one additional enemy for 25% damage."},
 {"id":"mace_shockwave","name":"Concussive Swing","description":"Mace attacks deal 30% damage to one additional enemy and slow its attacks for one second."},
 {"id":"single_target_mastery","name":"Focused Assault","description":"Deal 15% more direct physical weapon damage (not spells or caster fallback attacks) when one enemy remains and no reinforcements are waiting."},
 {"id":"blood_transfer","name":"Blood Transfer","description":"On a bleeding kill, transfer all active Bleed stacks to one living active enemy at 50% potency, deal one combined transferred tick immediately, and refresh Bleed. Transferred stacks can transfer again at half potency; zero-damage copies are discarded."},
 {"id":"relentless","maxRank":5,"icon":"🎯","name":"Relentless Aim","description":"Every fourth attack on the same target deals +10% damage per rank."},
 {"id":"brace","maxRank":5,"icon":"🔰","name":"Brace","description":"Reduce incoming elite and boss strikes by 4% per rank."},
 {"id":"second_pulse","maxRank":5,"icon":"💚","name":"Second Pulse","description":"Crossing below half Health heals 1% per rank each second for 3s, once per room."},
 {"id":"spell_echo","maxRank":5,"icon":"✨","name":"Spell Echo","description":"Every third funded cast or Arcane Infusion hit echoes for 10% damage per rank."},
 {"id":"incubation","maxRank":5,"icon":"🦠","name":"Incubation","description":"Every third consecutive Rot tick deals 12% more damage per rank."},
 {"id":"red_guillotine","advanced":true,"icon":"🪓","name":"Red Guillotine","description":"Prepared: every fourth strike consumes up to three Bleeds for their remaining damage. A kill spreads one stack."},
 {"id":"last_bastion","advanced":true,"icon":"🏰","name":"Last Bastion","description":"Prepared: once per expedition, survive lethal damage and gain Barrier for 4s. Recover half its absorbed damage."},
 {"id":"grave_bloom","advanced":true,"icon":"🕳️","name":"Grave Bloom","description":"Prepared: each paid Arcane Infusion hit applies 2 Rot stacks, deals a burst equal to one tick of all active Rot on the target, then spreads up to 2 stacks at 75% strength to each of 2 active enemies. Rot is not consumed."},
 {"id":"septic_wound","advanced":true,"icon":"🦂","name":"Reaper's Cadence","description":"Prepared: attacks against enemies with Bleed and Rot deal damage equal to one tick of the strongest stack of each, capped at 4% enemy maximum Health (6s cooldown). Neither stack is consumed."},
 {"id":"blood_harvest","icon":"🩸","name":"Blood Harvest","description":"Bleeding kills restore 3% maximum Health."},
 {"id":"crimson_feast","icon":"🫀","name":"Crimson Feast","description":"Every third hit against a bleeding enemy deals 45% bonus damage."},
 {"id":"heart_of_carnage","icon":"🩸","name":"Heart of Carnage","description":"Below half Health, hit a bleeding enemy for 40% bonus damage, or 60% if the enemy is below half Health (3s cooldown)."},
 {"id":"battle_tempo","icon":"⚔️","name":"Battle Tempo","description":"Consecutive attacks build attack speed, up to 15%."},
 {"id":"relentless_assault","icon":"🗡️","name":"Relentless Assault","description":"Attacks against Sundered enemies deal 20% bonus damage every 3 seconds."},
 {"id":"unchained_fury","icon":"🔥","name":"Unchained Fury","description":"Every fifth consecutive attack opens a 3-second window in which attacks deal 25% bonus damage."},
 {"id":"living_recovery","icon":"💚","name":"Living Recovery","description":"Below half Health, restore 0.5% maximum Health each second."},
 {"id":"overflowing_life","icon":"🌿","name":"Overflowing Life","description":"Effective healing grants Barrier equal to 15% of Health restored, up to 10% maximum Health."},
 {"id":"heart_of_the_wild","icon":"🌳","name":"Heart of the Wild","description":"Below 30% Health, restore 12% maximum Health once per encounter."},
 {"id":"lingering_rot","icon":"☠️","name":"Lingering Rot","description":"Finite Rot from secondary hits and Contagious Touch lasts six ticks instead of four. Paid primary Rot already persists."},
 {"id":"corruption_cycle","icon":"🦠","name":"Corruption Cycle","description":"Paid Toxic Touch applies two primary stacks. Consume three for a funded burst with Attack Speed-scaled cooldown."},
 {"id":"plagueheart","icon":"🕷️","name":"Plagueheart","description":"Pure Decay only. Each Rot tick has a 30% chance to spend 2 + 2 Mana per stack for 200% extra base tick damage; one activation per global tick, preserving 15% Max Mana. Other affinities refund this talent."},
 {"id":"combustion","icon":"💥","name":"Combustion","description":"Fire casts against burning enemies deal 20% Spell Power bonus damage every 4 seconds."},
 {"id":"shatter","icon":"💠","name":"Shatter","description":"Frost casts against chilled foes deal 25% Spell Power bonus damage every 4 seconds."},
 {"id":"chain_discharge","icon":"🔗","name":"Chain Discharge","description":"Every fourth Lightning cast deals 35% Spell Power bonus damage."},
 {"id":"steadfast_guard","name":"Steadfast Guard","icon":"🛡️","description":"While you have Barrier, gain 15 percentage points of Block chance (maximum 65%), even without a shield. A block prevents part of the hit before Barrier absorbs the remainder. Each block also grants 3% damage reduction for 5 seconds, up to 3 stacks."},
 {"id":"stored_force","name":"Stored Force","icon":"🔨","description":"Store 30% of damage blocked or absorbed by Barrier. At 25% maximum Health stored, release the stored damage against all enemies immediately."},
 {"id":"unbreakable","name":"Unbreakable","icon":"🏰","description":"Once per Expedition, survive a fatal hit with 1 Health and gain a Barrier equal to 20% of maximum Health. Attack speed is reduced by 20% for 5 seconds."}
].map(Object.freeze));
root.WandererTalentCatalog=Object.freeze({ATTRIBUTES,NODES});
})(globalThis);
