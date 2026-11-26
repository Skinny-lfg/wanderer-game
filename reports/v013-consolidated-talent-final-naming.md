# Consolidation — Talent Tree Final Naming & Affinity Identity

Baseline: 55d94640e1d14b4b905a962df27468f1df50488d. Lore Bible §§12, 25, 30, 33–35. This is a presentation-only checkpoint, not the final clean-sheet ID migration. No mechanics, progression, requirements or balance edits. All 420 graph nodes were loaded and compared before and after; every field except the intended display name is identical.

## Approved display names and canonical ID migration still required

| Current live ID | Approved display name | Target ID (pending) |
|---|---|---|
| blood_transfer | Sanguine Echo | sanguine_echo |
| toxic_touch | Corrupting Touch | corrupting_touch |
| blight | Blightburst | blightburst |
| relentless_assault | Sundering Assault | sundering_assault |
| arcane_echo | Elemental Echo | elemental_echo |
| crimson_rush | Crimson Onslaught | crimson_onslaught |
| fury_recovery | Defiant Surge | defiant_surge |
| storm_mastery | Forked Lightning | forked_lightning |
| spell_echo | Resonant Sequence | resonant_sequence |
| crimson_feast | Third Cut | third_cut |

Sanguine Echo was the missing approved display name. Other approved display names already existed. Resonant Sequence and Corruption Overflow combat log labels now match the graph. Core Precision and Lifeweave/Lifeweaver are absent from the actual graph; Fury Precision and Storm Conductor remain distinct. Blood Transfer as a gear trait and Crimson Rush as a mob skill are separate identities. Do not replace those keys globally. Approved canonical ID migration is not applied in this checkpoint because a full branch-wide consumer audit is still necessary, including simulator scripts, derived gate/rank IDs and historical-vs-active fixtures. No aliases added.

## Current ability naming audit

Proposals below are **not approved** and are **not applied**. Radiance is restorative light, but ordinary Health/recovery terms need not be renamed. Grasping Roots and Heart of the Wild have the clearest botanical conflict. Arcane, Fire, Frost and Lightning remain distinct modes; do not introduce a new damage type.

### blood

| Current ID | Current display name | Editorial status |
|---|---|---|
| bleeding_edge | Bleeding Edge | Retain for now |
| deep_cuts | Deep Cuts | Retain for now |
| executioner | Executioner | Retain for now |
| blood_drinker | Blood Drinker | Retain for now |
| sanguine_fury | Sanguine Fury | Retain for now |
| blood_transfer | Sanguine Echo | Approved name, retain |
| blood_harvest | Blood Harvest | Retain for now |
| crimson_feast | Third Cut | Approved name, retain |
| heart_of_carnage | Heart of Carnage | Retain for now |
| crimson_rush | Crimson Onslaught | Approved name, retain |
| reapers_cadence | Rupture | Retain for now |
| red_guillotine | Red Guillotine | Retain for now |
| cleave_mastery | Sweeping Force | Retain for now |
| accelerated_bleeding | Accelerated Bleeding | Retain for now |
| sanguine_reserve | Blood Pursuit | Retain for now |

### fury

| Current ID | Current display name | Editorial status |
|---|---|---|
| quick_hands | Quick Hands | Retain for now |
| precision | Precision | Approved name, retain |
| brutal_crit | Brutal Critical | Retain for now |
| double_strike | Double Strike | Retain for now |
| adrenaline | Adrenaline | Retain for now |
| relentless | Relentless Aim | Retain for now |
| battle_tempo | Battle Tempo | Retain for now |
| relentless_assault | Sundering Assault | Approved name, retain |
| unchained_fury | Unchained Fury | Approved name, retain |
| fervent_life | Fervent Life | Retain for now |
| redline | Redline | Retain for now |
| fury_recovery | Defiant Surge | Approved name, retain |
| bow_pierce | Piercing | Retain for now |
| fan_of_blades | Fan of Blades | Retain for now |
| single_target_mastery | Focused Assault | Retain for now |

### radiance

| Current ID | Current display name | Editorial status |
|---|---|---|
| strong_heart | Strong Heart | Retain for now |
| renewal | Renewal | Retain for now |
| last_stand | Last Stand | Retain for now |
| second_breath | Second Breath | Retain for now |
| life_bloom | Life Bloom | Proposal: Wellspring (needs approval) |
| second_pulse | Second Pulse | Retain for now |
| living_recovery | Living Recovery | Retain for now |
| overflowing_life | Overflowing Life | Retain for now |
| heart_of_the_wild | Heart of the Wild | Proposal: Second Dawn (needs approval) |
| sanctuary | Sanctuary | Retain for now |
| guardians_oath | Guardian's Oath | Retain for now |
| last_bastion | Last Bastion | Retain for now |
| vital_pulse | Vital Pulse | Proposal: Radiant Pulse (needs approval) |
| living_force | Living Force | Retain for now |
| grasping_roots | Grasping Roots | Proposal: Radiant Haze (needs approval) |

### aegis

| Current ID | Current display name | Editorial status |
|---|---|---|
| guarded_block | Guarded Block | Retain for now |
| barrier_pulse | Barrier Pulse | Retain for now |
| brace | Brace | Retain for now |
| iron_skin | Iron Skin | Retain for now |
| fortified | Fortified | Retain for now |
| retaliation | Retaliation | Retain for now |
| steadfast_guard | Steadfast Guard | Retain for now |
| stored_force | Stored Force | Retain for now |
| unbreakable | Unbreakable | Retain for now |
| runic_shield | Runic Shield | Retain for now |
| prismatic_rebound | Prismatic Rebound | Retain for now |
| arcane_bastion | Arcane Bastion | Retain for now |
| sword_sweep | Shielded Sweep | Retain for now |
| mace_shockwave | Concussive Swing | Retain for now |
| ward_echo | Ward Echo | Retain for now |

### arcane

| Current ID | Current display name | Editorial status |
|---|---|---|
| arcane_focus | Arcane Focus | Retain for now |
| mana_spring | Mana Spring | Retain for now |
| efficient_cast | Efficient Casting | Retain for now |
| arcane_echo | Elemental Echo | Approved name, retain |
| elemental_force | Elemental Force | Retain for now |
| spell_echo | Resonant Sequence | Approved name, retain |
| hex_bolt | Hex Bolt | Retain for now |
| elemental_blight | Elemental Blight | Retain for now |
| grave_bloom | Grave Bloom | Retain for now |
| arcane_resonance | Arcane Resonance | Retain for now |
| arcane_surge | Arcane Surge | Retain for now |
| arcane_mastery | Arcane Mastery | Retain for now |
| kindling | Kindling | Retain for now |
| fire_spread | Wildfire | Retain for now |
| combustion | Combustion | Retain for now |
| deep_winter | Deep Winter | Retain for now |
| frost_spread | Winter Field | Retain for now |
| shatter | Shatter | Retain for now |
| overcharge | Overcharge | Retain for now |
| storm_mastery | Forked Lightning | Approved name, retain |
| chain_discharge | Chain Discharge | Retain for now |
| arcane_nova | Arcane Nova | Retain for now |
| mana_convergence | Mana Convergence | Retain for now |
| controlled_burn | Controlled Burn | Retain for now |
| cinder_focus | Cinder Focus | Retain for now |
| frost_resonance | Frost Resonance | Retain for now |
| glacial_echo | Glacial Echo | Retain for now |
| static_focus | Static Focus | Retain for now |
| storm_conductor | Storm Conductor | Approved name, retain |

### decay

| Current ID | Current display name | Editorial status |
|---|---|---|
| toxic_touch | Corrupting Touch | Approved name, retain |
| virulent_rot | Virulent Rot | Retain for now |
| blight | Blightburst | Approved name, retain |
| wasting_curse | Wasting Curse | Retain for now |
| wither | Withering Hex | Retain for now |
| incubation | Incubation | Retain for now |
| lingering_rot | Lingering Rot | Retain for now |
| corruption_cycle | Corruption Cycle | Retain for now |
| plagueheart | Plagueheart | Retain for now |
| plague_spread | Contagion | Retain for now |
| carrion_detonation | Carrion Detonation | Retain for now |
| septic_wound | Reaper's Cadence | Retain for now |
| contagious_touch | Contagious Touch | Retain for now |
| corruption_nova | Corruption Overflow | Retain for now |
| soul_drain | Soul Drain | Retain for now |
| rotguard | Rotguard | Retain for now |

## Verification and open issues

- Previous CI: talent graph 87 passed; complementary native tests 24 passed, 2 failed. Corrected Crimson Onslaught string expectation. Frozen Stage 3 cohort comparator still uses historical Vitality/Magic build IDs and requires an explicit historical-data-only normalization; frozen evidence must not be overwritten.
- Previous focused Legendary CI 9 passed; historical diagnostic 3 passed, 21 failed (many synthetic fixture entry failures). The fixture now bypasses persistence as other isolated combat fixtures do; rerun required. No combat regression fixed by changing an assertion except explicitly stale presentation string.
- Native CI, full consumer audit, canonical ID migration, and Chromium–CLI parity remain pending. No deploy.
