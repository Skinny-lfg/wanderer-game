# v0.13 — Talent Tree & Legacy Cleanup

Baseline: 8914dddf7a8577d3ba0fe474bb54c0879bd5a18a. Scope: current canonical v15 graph and core runtime, no balance changes, no deploy.

## Verified graph inventory

The actual graph was evaluated before and after the edits. Serialized graph equality was exact. All 420 nodes were allocated individually using the live requirements planner and runtime allocator, within the 100-point budget; maximum route length 18. 44 Buildcraft passive entries and 37 metadata entries all have live consumers in the graph. No graph node was removed.

| Affinity | Total nodes | Ability nodes |
|---|---:|---:|
| blood | 66 | 15 |
| fury | 66 | 15 |
| radiance | 66 | 15 |
| aegis | 66 | 15 |
| arcane | 89 | 29 |
| decay | 67 | 16 |

## Live abilities by graph family (mixed skills listed under their graph owner)

### blood

| ID | Name | Runtime mapping | Effect |
|---|---|---|---|
| bleeding_edge | Bleeding Edge | Buildcraft: bleeding_edge | Increase the affinity Bleed application chance by 4 percentage points per rank. Primary Bleed damage scales with the triggering hit including critical damage. |
| deep_cuts | Deep Cuts | Buildcraft: deep_cuts | Bleed you inflict deals 15% more damage per rank. |
| executioner | Executioner | Buildcraft: executioner | At 30% HP or less, deal 150% of one combined tick of all active Bleed stacks without consuming them (4s cooldown). |
| blood_drinker | Blood Drinker | Buildcraft: blood_drinker | Hits on bleeding foes heal up to 0.8% Max HP at rank 1 (+0.25 percentage points per rank; 4s cooldown). Healing reduction applies. |
| sanguine_fury | Sanguine Fury | Buildcraft: sanguine_fury | Critical hits inflict Bleed for 14% of the critical-scaled hit per tick and deal 8% direct damage (+2 percentage points per rank; 2.5s cooldown). |
| blood_transfer | Blood Transfer | effect: blood_transfer | On a bleeding kill, transfer all active Bleed stacks to one living active enemy at 50% potency, deal one combined transferred tick immediately, and refresh Bleed. Transferred stacks can transfer again at half potency; zero-damage copies are discarded. |
| blood_harvest | Blood Harvest | effect: blood_harvest | Bleeding kills restore 3% maximum Health. |
| crimson_feast | Third Cut | effect: crimson_feast | Every third hit against a bleeding enemy deals 45% bonus damage. |
| heart_of_carnage | Heart of Carnage | effect: heart_of_carnage | Below half Health, hit a bleeding enemy for 40% bonus damage, or 60% if the enemy is below half Health (3s cooldown). |
| crimson_rush | Crimson Onslaught | Buildcraft: crimson_rush | Critical strikes against bleeding foes deal 15% bonus damage. |
| reapers_cadence | Rupture | Buildcraft: reapers_cadence | Attacks against enemies with Bleed and Fury Sunder deal damage equal to two ticks of the strongest Bleed, capped at 3% enemy maximum Health (5s cooldown). Bleed is not consumed. |
| red_guillotine | Red Guillotine | effect: red_guillotine | Prepared: every fourth strike consumes up to three Bleeds for their remaining damage. A kill spreads one stack. |
| cleave_mastery | Sweeping Force | effect: cleave_mastery | Two-Handed cleave deals 60% instead of 40% damage to secondary targets. |
| accelerated_bleeding | Accelerated Bleeding | effect: accelerated_bleeding | Original primary Bleed stacks tick every 0.75s instead of 1s over their 4s duration. Secondary, spread and transferred stacks retain normal cadence. |
| sanguine_reserve | Blood Pursuit | effect: sanguine_reserve | Killing a bleeding enemy grants two charges for 5s in the same encounter. The next two physical main attacks apply an additional guaranteed Bleed at 50% normal potency. New kills renew the charges and duration. |

### fury

| ID | Name | Runtime mapping | Effect |
|---|---|---|---|
| quick_hands | Quick Hands | Buildcraft: quick_hands | Attack speed increases by 8% per rank. |
| precision | Precision | Buildcraft: precision | Gain Critical Chance with diminishing returns: approximately +5 percentage points at rank 1, up to +19 points asymptotically. Total Critical Chance cannot exceed 100%. |
| brutal_crit | Brutal Critical | Buildcraft: brutal_crit | Critical hits add 12% base damage at Rank 1; smaller gains at higher ranks. Bonus damage cannot trigger passives. |
| double_strike | Double Strike | Buildcraft: double_strike | Each hit has a 10% chance at Rank 1 to deal one extra hit for 30% base damage; chance gains get smaller at higher ranks. Extra hits cannot trigger passives. |
| adrenaline | Adrenaline | Buildcraft: adrenaline | Critical hits grant 10% attack speed at rank 1 (+2.5 percentage points per rank) for 3s (3s cooldown). |
| relentless | Relentless Aim | effect: relentless | Every fourth attack on the same target deals +10% damage per rank. |
| battle_tempo | Battle Tempo | effect: battle_tempo | Consecutive attacks build attack speed, up to 15%. |
| relentless_assault | Sundering Assault | effect: relentless_assault | Attacks against Sundered enemies deal 20% bonus damage every 3 seconds. |
| unchained_fury | Unchained Fury | effect: unchained_fury | Every fifth consecutive attack opens a 3-second window in which attacks deal 25% bonus damage. |
| fervent_life | Fervent Life | Buildcraft: fervent_life | Critical strikes restore 2% Max HP + 3% Attack Power; overhealing grants Barrier (4s cooldown). |
| redline | Redline | Buildcraft: redline | Below half Health, attacks deal 33% bonus damage every 8s, but you take 10% more damage for 3s. |
| fury_recovery | Defiant Surge | effect: fury_recovery | Prepared: once per encounter, attacking below 35% Health restores 8% maximum Health and grants 12% attack speed for 4 seconds. |
| bow_pierce | Piercing | effect: bow_pierce | Bow hits one additional foe for 100% instead of 66% damage. Secondary weapon hits apply eligible statuses at reduced chance and potency. |
| fan_of_blades | Fan of Blades | effect: fan_of_blades | Daggers strike up to two additional enemies for 22% damage each. |
| single_target_mastery | Focused Assault | effect: single_target_mastery | Deal 15% more direct physical weapon damage (not spells or caster fallback attacks) when one enemy remains and no reinforcements are waiting. |

### radiance

| ID | Name | Runtime mapping | Effect |
|---|---|---|---|
| strong_heart | Strong Heart | Buildcraft: strong_heart | Max Health +10% at Rank 1; smaller gains at higher ranks. |
| renewal | Renewal | Buildcraft: renewal | Heal 0.55% Max HP per second at Rank 1; smaller gains at higher ranks. Healing reduction applies. |
| last_stand | Last Stand | Buildcraft: last_stand | Once per Expedition, survive a lethal hit and recover 6% Max HP. |
| second_breath | Second Breath | Buildcraft: second_breath | Heal after each completed encounter: 1.5% Max HP at rank 1 (+0.4 percentage points per rank). |
| life_bloom | Life Bloom | Buildcraft: life_bloom | Each combat second, restore 0.25% Max HP and 1.5 Mana at rank 1; gains become smaller at higher ranks, up to 0.6% Health and 3.4 Mana. |
| second_pulse | Second Pulse | effect: second_pulse | Crossing below half Health heals 1% per rank each second for 3s, once per room. |
| living_recovery | Living Recovery | effect: living_recovery | Below half Health, restore 0.5% maximum Health each second. |
| overflowing_life | Overflowing Life | effect: overflowing_life | Effective healing grants Barrier equal to 15% of Health restored, up to 10% maximum Health. |
| heart_of_the_wild | Heart of the Wild | effect: heart_of_the_wild | Below 30% Health, restore 12% maximum Health once per encounter. |
| sanctuary | Sanctuary | Buildcraft: sanctuary | Recovering Health grants Barrier equal to 20% of the heal. |
| guardians_oath | Guardian's Oath | Buildcraft: guardians_oath | When your Barrier breaks, restore 4.5% maximum Health once per encounter. |
| last_bastion | Last Bastion | effect: last_bastion | Prepared: once per expedition, survive lethal damage and gain Barrier for 4s. Recover half its absorbed damage. |
| vital_pulse | Vital Pulse | effect: vital_pulse | Every 4 seconds, deal damage equal to 2% Max HP to up to four living active enemies; class caps apply. |
| living_force | Living Force | effect: living_force | Store 20% effective healing up to 5% Max HP per encounter. Release that charge on the next main attack (4s cooldown; enemy class caps). |
| grasping_roots | Grasping Roots | effect: grasping_roots | Every 8 seconds, deal 1.5% Max HP damage to up to four active enemies. Normal enemies have 15% longer attack intervals for 2s; no leader slow or stacking with stronger Chill. |

### aegis

| ID | Name | Runtime mapping | Effect |
|---|---|---|---|
| guarded_block | Guarded Block | Buildcraft: guarded_block | Raises Guard Chance, even without a shield. Total Guard Chance cannot exceed 65%; a successful Guard reduces damage according to equipment. |
| barrier_pulse | Barrier Pulse | Buildcraft: barrier_pulse | Gain Barrier every 6s: 3% Max HP + 6% Spell Power at rank 1 (+0.6% HP and +1.2% Spell Power per rank). Barrier stacks without a maximum and resets between encounters. |
| brace | Brace | effect: brace | Reduce incoming elite and boss strikes by 4% per rank. |
| iron_skin | Iron Skin | Buildcraft: iron_skin | Defense +12% at Rank 1; smaller gains at higher ranks. |
| fortified | Fortified | Buildcraft: fortified | Reduce incoming damage by 4% per rank, within the combined 28% cap. |
| retaliation | Retaliation | Buildcraft: retaliation | When Barrier absorbs damage, your next hit deals 30% more base hit damage (4s cooldown). |
| steadfast_guard | Steadfast Guard | effect: steadfast_guard | While you have Barrier, gain 15 percentage points of Block chance (maximum 65%), even without a shield. A block prevents part of the hit before Barrier absorbs the remainder. Each block also grants 3% damage reduction for 5 seconds, up to 3 stacks. |
| stored_force | Stored Force | effect: stored_force | Store 30% of damage blocked or absorbed by Barrier. At 25% maximum Health stored, release the stored damage against all enemies immediately. |
| unbreakable | Unbreakable | effect: unbreakable | Once per Expedition, survive a fatal hit with 1 Health and gain a Barrier equal to 20% of maximum Health. Attack speed is reduced by 20% for 5 seconds. |
| runic_shield | Runic Shield | Buildcraft: runic_shield | Funded Magic spells or Arcane Infusion activations grant 2% Max HP + 8% Spell Power as Barrier (3s cooldown). |
| prismatic_rebound | Prismatic Rebound | Buildcraft: prismatic_rebound | Barrier absorption charges your next Magic cast, up to 6% Max HP + 10% Spell Power. |
| arcane_bastion | Arcane Bastion | effect: arcane_bastion | Prepared: absorbing damage with Barrier charges the next funded cast or Arcane Infusion hit to deal 30% Spell Power and grant Barrier equal to 3% Max HP + 6% Spell Power (6s cooldown). |
| sword_sweep | Shielded Sweep | effect: sword_sweep | Sword and Shield attacks hit one additional enemy for 25% damage. |
| mace_shockwave | Concussive Swing | effect: mace_shockwave | Mace attacks deal 30% damage to one additional enemy and slow its attacks for one second. |
| ward_echo | Ward Echo | effect: ward_echo | Every 4 seconds while Barrier exists, deal 1% Max HP + 15% Defense damage to up to four active enemies. Does not scale with current Barrier; class caps apply. |

### arcane

| ID | Name | Runtime mapping | Effect |
|---|---|---|---|
| arcane_focus | Arcane Focus | Buildcraft: arcane_focus | Spell Power +15% at rank 1, including Arcane Infusion; gains decrease at higher ranks. |
| mana_spring | Mana Spring | Buildcraft: mana_spring | Mana regeneration +12% at Rank 1; smaller gains at higher ranks. |
| efficient_cast | Efficient Casting | Buildcraft: efficient_cast | Magic casts cost 1 less Mana per rank, down to a minimum of 3. |
| arcane_echo | Elemental Echo | Buildcraft: arcane_echo | Every fourth funded Magic or Arcane Infusion hit echoes for 25% Spell Power (+5 percentage points per rank; no recursive effects). |
| elemental_force | Elemental Force | Buildcraft: elemental_force | Funded Magic casts and Arcane Infusion gain 12% power per rank. |
| spell_echo | Resonant Sequence | effect: spell_echo | Every third funded cast or Arcane Infusion hit echoes for 10% damage per rank. |
| hex_bolt | Hex Bolt | Buildcraft: hex_bolt | Funded spells or Arcane Infusion hits against Rot deal 25% Spell Power plus one Rot tick (3s cooldown). |
| elemental_blight | Elemental Blight | Buildcraft: elemental_blight | Fire consumes Rot for damage, Frost extends it, Lightning consumes it for damage, and Arcane deals damage based on active Rot without consuming it (7s cooldown). |
| grave_bloom | Grave Bloom | effect: grave_bloom | Prepared: each paid Arcane Infusion hit applies 2 Rot stacks, deals a burst equal to one tick of all active Rot on the target, then spreads up to 2 stacks at 75% strength to each of 2 active enemies. Rot is not consumed. |
| arcane_resonance | Arcane Resonance | graph stats | Increase Spell Power by 5% and maximum Mana by 3. |
| arcane_surge | Arcane Surge | graph stats | Increase Spell Power by 8% and Mana Regeneration by 0.25 per second. |
| arcane_mastery | Arcane Mastery | graph stats | Increase Spell Power by 12%. Arcane Infusion hits or paid Arcane weapon casts restore 2 Mana every 5 seconds. |
| kindling | Kindling | Buildcraft: kindling | Funded Fire casts apply Burn. |
| fire_spread | Wildfire | effect: fire_spread | Funded Fire casts spread Burn to two additional foes at 65% strength for up to three seconds and deal immediate splash. |
| combustion | Combustion | effect: combustion | Fire casts apply Burn if needed; casts against burning enemies deal 20% Spell Power bonus damage every 4 seconds. |
| deep_winter | Deep Winter | Buildcraft: deep_winter | Funded Frost casts Chill. Chilled foes take a Spell Power burst every 4s (18% at rank 1, +3 percentage points per rank; capped at 5% of normal foes’ Max HP or 1.5% of bosses’). Boss Chill lasts at most 1.2s. |
| frost_spread | Winter Field | effect: frost_spread | Funded Frost casts Chill up to two additional enemies for two seconds. |
| shatter | Shatter | effect: shatter | Frost casts apply Chill if needed; casts against chilled foes deal 25% Spell Power bonus damage every 4 seconds. |
| overcharge | Overcharge | Buildcraft: overcharge | Funded Lightning casts bounce up to five times for 60%, 45%, 33%, 23%, then 16% of the primary hit. Each jump leaves a Static Mark that detonates when a later chain revisits. Every 4 charges discharge for 32% Spell Power at rank 1 (+6 percentage points per rank), capped at 3.5% of the foe’s Max HP. Charges persist between Realms. |
| storm_mastery | Forked Lightning | effect: storm_mastery | Funded Lightning chains bounce up to six times for 68%, 53%, 40%, 29%, 21%, 15% damage. Returning chains detonate prior Static Marks. |
| chain_discharge | Chain Discharge | effect: chain_discharge | Every fourth Lightning cast deals 35% Spell Power bonus damage. |
| arcane_nova | Arcane Nova | effect: arcane_nova | Each consumed Arcane Infusion charge deals 35% of its damage to up to two other living enemies, unless Grave Bloom activated on that charge. Raw class caps apply. |
| mana_convergence | Mana Convergence | effect: mana_convergence | A funded Arcane cast or Infusion activation below 30% Mana refunds up to 4 Mana, once every 8s. |
| controlled_burn | Controlled Burn | effect: controlled_burn | Eligible paid primary Burn gains 25% tick damage; Fire Spread and Conflagration use 75% of original unboosted potency, including Wildfire. New standalone Burn cannot propagate. No additional targets. |
| cinder_focus | Cinder Focus | effect: cinder_focus | Paid Fire casts against an already burning isolated enemy burst for one strongest original Burn tick, once every 5s. No reserves may remain. |
| frost_resonance | Frost Resonance | effect: frost_resonance | Paid Frost casts against an already chilled enemy pulse for 25% effective Spell Power to up to two other chilled active enemies, once every 4s. |
| glacial_echo | Glacial Echo | effect: glacial_echo | Paid Frost casts against an already chilled enemy deal 30% effective Spell Power bonus damage to that enemy, once every 5s. |
| static_focus | Static Focus | effect: static_focus | Redirect 25% of secondary Lightning chain and mark damage toward the primary target, capped at 30% chain base and class limits. No new jumps or marks. |
| storm_conductor | Storm Conductor | effect: storm_conductor | Paid Lightning casts against one living enemy and no reserves deal 30% effective Spell Power bonus damage every 5s. No extra chain. |

### decay

| ID | Name | Runtime mapping | Effect |
|---|---|---|---|
| toxic_touch | Corrupting Touch | Buildcraft: toxic_touch | Increase the affinity Rot application chance by 4 percentage points per rank. Each application costs 4 Mana; primary stacks persist and scale with base weapon damage plus Spell Power. |
| virulent_rot | Virulent Rot | Buildcraft: virulent_rot | New Rot stacks deal 15% more damage per rank. |
| blight | Blightburst | Buildcraft: blight | On hit, spend 8 Mana to apply one persistent Rot stack and deal 38% base hit damage plus 35% Spell Power, capped at 2.5% enemy Max HP (7s cooldown). |
| wasting_curse | Wasting Curse | Buildcraft: wasting_curse | Rotted enemies deal 4% less damage per rank. Combined damage reduction cannot exceed 28%. |
| wither | Withering Hex | Buildcraft: wither | Rotted foes heal 20% less at rank 1 (+10% per rank) and deal 2% less attack damage per rank. Player healing is unaffected. |
| incubation | Incubation | effect: incubation | Every third consecutive Rot tick deals 12% more damage per rank. |
| lingering_rot | Lingering Rot | effect: lingering_rot | Finite Rot from secondary hits and Contagious Touch lasts six ticks instead of four. Paid primary Rot already persists. |
| corruption_cycle | Corruption Cycle | effect: corruption_cycle | On attack, spend 10 Mana to apply two persistent Rot stacks, then consume three eligible stacks if available for six equivalent ticks of their damage plus 20% AP and 20% SP. Cooldown scales with Attack Speed (2.5–10s), even without a burst. Propagated and independent ability stacks qualify. |
| plagueheart | Plagueheart | effect: plagueheart | Pure Decay only. Each Rot tick has a 30% chance to spend 2 + 2 Mana per stack for 200% extra base tick damage; one activation per global tick, preserving 15% Max Mana. Other affinities refund this talent. |
| plague_spread | Contagion | effect: plague_spread | On kill, spread one active Bleed and Rot at 50% strength to up to two enemies. Active recipients take five transferred ticks instantly; effects cannot spread again. |
| carrion_detonation | Carrion Detonation | Buildcraft: carrion_detonation | Weapon hits charge an enemy affected by Bleed and Rot using actual Health damage. At 150% Attack Power, release a burst equal to 75% of the threshold (35% on the marked foe), spreading weaker Bleed and Rot to active nearby foes. 1.5s cooldown per enemy. |
| septic_wound | Reaper's Cadence | effect: septic_wound | Prepared: attacks against enemies with Bleed and Rot deal damage equal to one tick of the strongest stack of each, capped at 4% enemy maximum Health (6s cooldown). Neither stack is consumed. |
| contagious_touch | Contagious Touch | effect: contagious_touch | Every second paid primary Corrupting Touch application spreads one persistent stack at 100% potency to up to three other living active enemies. Global 3s cooldown. Inactive with Carrion Detonation or prepared Grave Bloom. |
| corruption_nova | Corruption Overflow | effect: corruption_nova | On attack, spend 6 Mana to apply one persistent Rot stack. With at least three eligible stacks, deal two equivalent ticks of their total damage to the target and distribute its actual HP damage among up to three other infected living active enemies. Does not consume stacks. Global 4s cooldown even without a burst; secondary class caps apply. Inactive with Carrion Detonation or prepared Grave Bloom. |
| soul_drain | Soul Drain | effect: soul_drain | Four paid primary Corrupting Touch applications recover up to 4 Mana; global 5s cooldown. Counters reset each encounter. Secondary, free and propagated Rot do not count. |
| rotguard | Rotguard | effect: rotguard | At encounter start spend 50% of current Mana (rounded down) to gain equal Barrier, modified by Barrier Power. While this portion absorbs damage, the attacker has a 30% chance to receive a finite Rot stack at half normal potency (2s per enemy). Does not count as a paid primary application or replace existing stacks at the cap. |

## Removed residual references

- Arcane: `fire_focus`, `frost_focus`, `lightning_focus`, `living_inferno`, `absolute_winter` — unreachable gates in the old direct spell multiplier, Lightning chain suppression and Burn potency. Removed only the obsolete conditionals; multiplication by 1 and original rounding are preserved for legal builds.
- Fury: `fury_momentum` — unreachable standalone description.
- Arcane: retired Living Inferno and Absolute Winter standalone descriptions and obsolete test that fabricated those nodes.
- Already absent from the core catalogs/runtime on baseline: `hemovore`, `crimson_pact`, `rot_recovery`, `rot_symbiosis`, `life_conduit`, `lifeweave`, `lifeweaver`.

## Verification boundaries

Graph execution and comparison performed against fetched source; no native Node harness or browser combat was executed in this session. Added automated catalog/route/core-mirror regressions; full native suite and Chromium–CLI combat parity still required. Historical v0.12 fixtures, historical reports and all simulator study scripts have not been comprehensively audited. Do not mark issue #147 complete on this evidence alone.
