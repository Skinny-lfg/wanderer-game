# Playable talent inventory

Generated from the release graph. Requirements use graph IDs. Every row with alternatives requires at least one of those alternatives.

## blood

| Name | ID | Effect | Required | Alternatives |
|---|---|---|---|---|
| Attack Power | root_blood | +2% Attack Power. |  |  |
| blood | affinity_blood | Attacks have a 42% chance to inflict Bleed for 16% of the hit per tick, including critical scaling on primary applications (0.6s cooldown). Stacks last 4s, refresh together on new applications, and have no cap. Secondary weapon hits have half chance and potency with separate per-target cooldowns. | root_blood |  |
| Attack Power | outer_blood_-1_1 | +2% Attack Power. | affinity_blood |  |
| Bleed Damage | outer_blood_-1_2 | +2% Bleed Damage. | outer_blood_-1_1 |  |
| Critical Chance | outer_blood_1_1 | +2% Critical Chance (percentage points). | affinity_blood |  |
| Attack Speed | outer_blood_1_2 | +1% Attack Speed. | outer_blood_1_1 |  |
| Attack Power | basic_path_blood_0_1 | +2% Attack Power. | affinity_blood |  |
| Bleed Damage | gate_bleeding_edge | +2% Bleed Damage. | basic_path_blood_0_1 |  |
| Bleeding Edge | bleeding_edge | Increase the affinity Bleed application chance by 4 percentage points per rank. Primary Bleed damage scales with the triggering hit including critical damage. | gate_bleeding_edge |  |
| Bleed Damage | basic_path_blood_0_2 | +2.5% Bleed Damage. |  | bleeding_edge, sanguine_reserve |
| Bleed Damage | gate_deep_cuts | +2.5% Bleed Damage. | basic_path_blood_0_2 |  |
| Deep Cuts | deep_cuts | Bleed you inflict deals 15% more damage per rank. | gate_deep_cuts |  |
| Attack Power | basic_path_blood_0_3 | +4% Attack Power. |  | deep_cuts, basic_detour_blood_0 |
| Attack Power | gate_executioner | +4% Attack Power. | basic_path_blood_0_3 |  |
| Executioner | executioner | At 30% HP or less, deal 150% of one combined tick of all active Bleed stacks without consuming them (4s cooldown). | gate_executioner |  |
| Healing Power | basic_path_blood_1_1 | +1% Healing Power. | affinity_blood |  |
| Healing Power | gate_blood_drinker | +1% Healing Power. | basic_path_blood_1_1 |  |
| Blood Drinker | blood_drinker | Hits on bleeding foes heal up to 0.8% Max HP at rank 1 (+0.25 percentage points per rank; 4s cooldown). Healing reduction applies. | gate_blood_drinker |  |
| Critical Chance | basic_path_blood_1_2 | +3% Critical Chance (percentage points). |  | blood_drinker, cleave_mastery |
| Critical Chance | gate_sanguine_fury | +3% Critical Chance (percentage points). | basic_path_blood_1_2 |  |
| Sanguine Fury | sanguine_fury | Critical hits inflict Bleed for 14% of the critical-scaled hit per tick and deal 8% direct damage (+2 percentage points per rank; 2.5s cooldown). | gate_sanguine_fury |  |
| Attack Speed | basic_path_blood_1_3 | +2% Attack Speed. |  | sanguine_fury, basic_detour_blood_1 |
| Bleed Damage | gate_blood_transfer | +3% Bleed Damage. | basic_path_blood_1_3 |  |
| Blood Transfer | blood_transfer | On a bleeding kill, transfer all active Bleed stacks to one living active enemy at 50% potency, deal one combined transferred tick immediately, and refresh Bleed. Transferred stacks can transfer again at half potency; zero-damage copies are discarded. | gate_blood_transfer |  |
| Bleed Damage | focus_branch_blood_0_1 | +2% Bleed Damage. |  | basic_path_blood_0_1, accelerated_bleeding |
| Attack Speed | focus_branch_blood_1_1 | +1% Attack Speed. |  | basic_path_blood_1_1, accelerated_bleeding |
| Healing Power | gate_blood_harvest | +1% Healing Power. | focus_branch_blood_0_1, focus_branch_blood_1_1 |  |
| Blood Harvest | blood_harvest | Bleeding kills restore 3% maximum Health. | gate_blood_harvest |  |
| Healing Power | focus_branch_blood_0_2 | +1.5% Healing Power. |  | focus_bridge_blood_0_2, gate_deep_cuts, sanguine_reserve |
| Critical Chance | focus_branch_blood_1_2 | +3% Critical Chance (percentage points). |  | focus_bridge_blood_1_2, gate_sanguine_fury, cleave_mastery |
| Attack Speed | gate_crimson_feast | +1.5% Attack Speed. | focus_branch_blood_0_2, focus_branch_blood_1_2 |  |
| Crimson Feast | crimson_feast | Every third hit against a bleeding enemy deals 45% bonus damage. | gate_crimson_feast |  |
| Critical Chance | focus_branch_blood_0_3 | +4% Critical Chance (percentage points). |  | focus_bridge_blood_0_3, gate_executioner |
| Attack Power | focus_branch_blood_1_3 | +4% Attack Power. |  | focus_bridge_blood_1_3, gate_blood_transfer |
| Attack Power | gate_heart_of_carnage | +4% Attack Power. | focus_branch_blood_0_3, focus_branch_blood_1_3 | blood_harvest, crimson_feast |
| Heart of Carnage | heart_of_carnage | Below half Health, hit a bleeding enemy for 40% bonus damage, or 60% if the enemy is below half Health (3s cooldown). | gate_heart_of_carnage |  |
| Critical Chance | mixed_path_blood_fury_blood_1 | +2% Critical Chance (percentage points). |  | outer_blood_1_2, blood_drinker |
| Critical Chance | gate_crimson_rush | +2% Critical Chance (percentage points). | mixed_path_blood_fury_blood_1, mixed_path_blood_fury_fury_1 |  |
| Crimson Rush | crimson_rush | Critical strikes against bleeding foes deal 15% bonus damage. | gate_crimson_rush |  |
| Bleed Damage | mixed_path_blood_fury_blood_2 | +2.5% Bleed Damage. |  | mixed_path_blood_fury_blood_1, crimson_rush, sanguine_fury |
| Bleed Damage | gate_reapers_cadence | +2.5% Bleed Damage. | mixed_path_blood_fury_blood_2, mixed_path_blood_fury_fury_2 |  |
| Rupture | reapers_cadence | Attacks against enemies with Bleed and Fury Sunder deal damage equal to two ticks of the strongest Bleed, capped at 3% enemy maximum Health (5s cooldown). Bleed is not consumed. | gate_reapers_cadence |  |
| Attack Power | mixed_path_blood_fury_blood_3 | +4% Attack Power. |  | mixed_path_blood_fury_blood_2, reapers_cadence, blood_transfer |
| Bleed Damage | gate_red_guillotine | +3% Bleed Damage. | mixed_path_blood_fury_blood_3, mixed_path_blood_fury_fury_3 | crimson_rush, reapers_cadence |
| Red Guillotine | red_guillotine | Prepared: every fourth strike consumes up to three Bleeds for their remaining damage. A kill spreads one stack. | gate_red_guillotine |  |
| Attack Power | mixed_path_decay_blood_blood_1 | +2% Attack Power. |  | outer_blood_-1_2, bleeding_edge |
| Bleed Damage | mixed_path_decay_blood_blood_2 | +2.5% Bleed Damage. |  | mixed_path_decay_blood_blood_1, plague_spread, deep_cuts |
| Critical Chance | mixed_path_decay_blood_blood_3 | +4% Critical Chance (percentage points). |  | mixed_path_decay_blood_blood_2, carrion_detonation, executioner |
| Attack Power | weapon_path_cleave_mastery_1 | +3% Attack Power. | basic_path_blood_1_1 |  |
| Attack Power | weapon_path_cleave_mastery_2 | +4% Attack Power. | weapon_path_cleave_mastery_1 |  |
| Attack Power | gate_cleave_mastery | +4% Attack Power. | weapon_path_cleave_mastery_2 |  |
| Sweeping Force | cleave_mastery | Two-Handed cleave deals 60% instead of 40% damage to secondary targets. | gate_cleave_mastery |  |
| Healing Power | focus_bridge_blood_0_2 | +1.5% Healing Power. | focus_branch_blood_0_1 |  |
| Critical Chance | focus_bridge_blood_0_3 | +4% Critical Chance (percentage points). | focus_branch_blood_0_2 |  |
| Critical Chance | focus_bridge_blood_1_2 | +3% Critical Chance (percentage points). | focus_branch_blood_1_1 |  |
| Attack Power | focus_bridge_blood_1_3 | +4% Attack Power. | focus_branch_blood_1_2 |  |
| Attack Power | basic_detour_blood_0 | +4% Attack Power. | gate_deep_cuts, focus_branch_blood_0_2 |  |
| Attack Speed | basic_detour_blood_1 | +2% Attack Speed. | gate_sanguine_fury, focus_branch_blood_1_2 |  |
| Bleed Damage | weapon_path_accelerated_bleeding_1 | +2% Bleed Damage. | affinity_blood |  |
| Bleed Damage | weapon_path_accelerated_bleeding_2 | +2% Bleed Damage. | weapon_path_accelerated_bleeding_1 |  |
| Bleed Damage | gate_accelerated_bleeding | +2% Bleed Damage. | weapon_path_accelerated_bleeding_2 |  |
| Accelerated Bleeding | accelerated_bleeding | Original primary Bleed stacks tick every 0.75s instead of 1s over their 4s duration. Secondary, spread and transferred stacks retain normal cadence. | gate_accelerated_bleeding |  |
| Maximum HP | weapon_path_sanguine_reserve_1 | +2% Maximum HP. | basic_path_blood_0_1 |  |
| Healing Power | weapon_path_sanguine_reserve_2 | +1% Healing Power. | weapon_path_sanguine_reserve_1 |  |
| Healing Power | gate_sanguine_reserve | +1% Healing Power. | weapon_path_sanguine_reserve_2 |  |
| Blood Pursuit | sanguine_reserve | Killing a bleeding enemy grants two charges for 5s in the same encounter. The next two physical main attacks apply an additional guaranteed Bleed at 50% normal potency. New kills renew the charges and duration. | gate_sanguine_reserve |  |

## fury

| Name | ID | Effect | Required | Alternatives |
|---|---|---|---|---|
| Attack Power | root_fury | +2% Attack Power. |  |  |
| fury | affinity_fury | Direct attacks have a 15% chance to apply Sunder, reducing enemy base Defense by 4% per application, up to 20% from Fury (1s cooldown per enemy). | root_fury |  |
| Critical Chance | outer_fury_-1_1 | +2% Critical Chance (percentage points). | affinity_fury |  |
| Attack Power | outer_fury_-1_2 | +2% Attack Power. | outer_fury_-1_1 |  |
| Attack Speed | outer_fury_1_1 | +1% Attack Speed. | affinity_fury |  |
| Attack Power | outer_fury_1_2 | +2% Attack Power. | outer_fury_1_1 |  |
| Attack Speed | basic_path_fury_0_1 | +1% Attack Speed. | affinity_fury |  |
| Attack Speed | gate_quick_hands | +1% Attack Speed. | basic_path_fury_0_1 |  |
| Quick Hands | quick_hands | Attack speed increases by 8% per rank. | gate_quick_hands |  |
| Critical Chance | basic_path_fury_0_2 | +3% Critical Chance (percentage points). |  | quick_hands, single_target_mastery |
| Critical Chance | gate_precision | +3% Critical Chance (percentage points). | basic_path_fury_0_2 |  |
| Precision | precision | Gain Critical Chance with diminishing returns: approximately +5 percentage points at rank 1, up to +19 points asymptotically. Total Critical Chance cannot exceed 100%. | gate_precision |  |
| Critical Chance | basic_path_fury_0_3 | +4% Critical Chance (percentage points). |  | precision, basic_detour_fury_0 |
| Critical Chance | gate_brutal_crit | +4% Critical Chance (percentage points). | basic_path_fury_0_3 |  |
| Brutal Critical | brutal_crit | Critical hits add 12% base damage at Rank 1; smaller gains at higher ranks. Bonus damage cannot trigger passives. | gate_brutal_crit |  |
| Attack Speed | basic_path_fury_1_1 | +1% Attack Speed. | affinity_fury |  |
| Attack Speed | gate_double_strike | +1% Attack Speed. | basic_path_fury_1_1 |  |
| Double Strike | double_strike | Each hit has a 10% chance at Rank 1 to deal one extra hit for 30% base damage; chance gains get smaller at higher ranks. Extra hits cannot trigger passives. | gate_double_strike |  |
| Critical Chance | basic_path_fury_1_2 | +3% Critical Chance (percentage points). |  | double_strike, bow_pierce |
| Critical Chance | gate_adrenaline | +3% Critical Chance (percentage points). | basic_path_fury_1_2 |  |
| Adrenaline | adrenaline | Critical hits grant 10% attack speed at rank 1 (+2.5 percentage points per rank) for 3s (3s cooldown). | gate_adrenaline |  |
| damage against Sundered enemies | basic_path_fury_1_3 | +3% damage against Sundered enemies. |  | adrenaline, basic_detour_fury_1 |
| Attack Speed | gate_relentless | +2% Attack Speed. | basic_path_fury_1_3 |  |
| Relentless Aim | relentless | Every fourth attack on the same target deals +10% damage per rank. | gate_relentless |  |
| damage against Sundered enemies | focus_branch_fury_0_1 | +2% damage against Sundered enemies. |  | basic_path_fury_0_1, fan_of_blades |
| Critical Chance | focus_branch_fury_1_1 | +2% Critical Chance (percentage points). |  | basic_path_fury_1_1, fan_of_blades |
| Attack Speed | gate_battle_tempo | +1% Attack Speed. | focus_branch_fury_0_1, focus_branch_fury_1_1 |  |
| Battle Tempo | battle_tempo | Consecutive attacks build attack speed, up to 15%. | gate_battle_tempo |  |
| Attack Speed | focus_branch_fury_0_2 | +1.5% Attack Speed. |  | focus_bridge_fury_0_2, gate_precision, single_target_mastery |
| Attack Power | focus_branch_fury_1_2 | +3% Attack Power. |  | focus_bridge_fury_1_2, gate_adrenaline, bow_pierce |
| damage against Sundered enemies | gate_relentless_assault | +2.5% damage against Sundered enemies. | focus_branch_fury_0_2, focus_branch_fury_1_2 |  |
| Relentless Assault | relentless_assault | Attacks against Sundered enemies deal 20% bonus damage every 3 seconds. | gate_relentless_assault |  |
| damage against Sundered enemies | focus_branch_fury_0_3 | +3% damage against Sundered enemies. |  | focus_bridge_fury_0_3, gate_brutal_crit |
| damage against Sundered enemies | focus_branch_fury_1_3 | +3% damage against Sundered enemies. |  | focus_bridge_fury_1_3, gate_relentless |
| Attack Power | gate_unchained_fury | +4% Attack Power. | focus_branch_fury_0_3, focus_branch_fury_1_3 | battle_tempo, relentless_assault |
| Unchained Fury | unchained_fury | Every fifth consecutive attack opens a 3-second window in which attacks deal 25% bonus damage. | gate_unchained_fury |  |
| Critical Chance | mixed_path_blood_fury_fury_1 | +2% Critical Chance (percentage points). |  | outer_fury_-1_2, quick_hands |
| damage against Sundered enemies | mixed_path_blood_fury_fury_2 | +2.5% damage against Sundered enemies. |  | mixed_path_blood_fury_fury_1, crimson_rush, precision |
| Attack Power | mixed_path_blood_fury_fury_3 | +4% Attack Power. |  | mixed_path_blood_fury_fury_2, reapers_cadence, brutal_crit |
| Critical Chance | mixed_path_fury_vitality_fury_1 | +2% Critical Chance (percentage points). |  | outer_fury_1_2, double_strike |
| Critical Chance | gate_fervent_life | +2% Critical Chance (percentage points). | mixed_path_fury_vitality_fury_1, mixed_path_fury_vitality_vitality_1 |  |
| Fervent Life | fervent_life | Critical strikes restore 2% Max HP + 3% Attack Power; overhealing grants Barrier (4s cooldown). | gate_fervent_life |  |
| Attack Speed | mixed_path_fury_vitality_fury_2 | +1.5% Attack Speed. |  | mixed_path_fury_vitality_fury_1, fervent_life, adrenaline |
| Attack Power | gate_redline | +3% Attack Power. | mixed_path_fury_vitality_fury_2, mixed_path_fury_vitality_vitality_2 |  |
| Redline | redline | Below half Health, attacks deal 33% bonus damage every 8s, but you take 10% more damage for 3s. | gate_redline |  |
| Critical Chance | mixed_path_fury_vitality_fury_3 | +4% Critical Chance (percentage points). |  | mixed_path_fury_vitality_fury_2, redline, relentless |
| Maximum HP | gate_fury_recovery | +4% Maximum HP. | mixed_path_fury_vitality_fury_3, mixed_path_fury_vitality_vitality_3 | fervent_life, redline |
| Fury Recovery | fury_recovery | Prepared: once per encounter, attacking below 35% Health restores 8% maximum Health and grants 12% attack speed for 4 seconds. | gate_fury_recovery |  |
| Attack Power | weapon_path_bow_pierce_1 | +3% Attack Power. | basic_path_fury_1_1 |  |
| Critical Chance | weapon_path_bow_pierce_2 | +4% Critical Chance (percentage points). | weapon_path_bow_pierce_1 |  |
| Attack Power | gate_bow_pierce | +4% Attack Power. | weapon_path_bow_pierce_2 |  |
| Piercing | bow_pierce | Bow hits one additional foe for 100% instead of 66% damage. Secondary weapon hits apply eligible statuses at reduced chance and potency. | gate_bow_pierce |  |
| Attack Power | weapon_path_fan_of_blades_1 | +3% Attack Power. | affinity_fury |  |
| Attack Speed | weapon_path_fan_of_blades_2 | +2% Attack Speed. | weapon_path_fan_of_blades_1 |  |
| Attack Speed | gate_fan_of_blades | +2% Attack Speed. | weapon_path_fan_of_blades_2 |  |
| Fan of Blades | fan_of_blades | Daggers strike up to two additional enemies for 22% damage each. | gate_fan_of_blades |  |
| Attack Power | weapon_path_single_target_mastery_1 | +3% Attack Power. | basic_path_fury_0_1 |  |
| Attack Power | weapon_path_single_target_mastery_2 | +4% Attack Power. | weapon_path_single_target_mastery_1 |  |
| Attack Power | gate_single_target_mastery | +4% Attack Power. | weapon_path_single_target_mastery_2 |  |
| Focused Assault | single_target_mastery | Deal 15% more direct physical weapon damage (not spells or caster fallback attacks) when one enemy remains and no reinforcements are waiting. | gate_single_target_mastery |  |
| Attack Speed | focus_bridge_fury_0_2 | +1.5% Attack Speed. | focus_branch_fury_0_1 |  |
| damage against Sundered enemies | focus_bridge_fury_0_3 | +3% damage against Sundered enemies. | focus_branch_fury_0_2 |  |
| Attack Power | focus_bridge_fury_1_2 | +3% Attack Power. | focus_branch_fury_1_1 |  |
| damage against Sundered enemies | focus_bridge_fury_1_3 | +3% damage against Sundered enemies. | focus_branch_fury_1_2 |  |
| Critical Chance | basic_detour_fury_0 | +4% Critical Chance (percentage points). | gate_precision, focus_branch_fury_0_2 |  |
| damage against Sundered enemies | basic_detour_fury_1 | +3% damage against Sundered enemies. | gate_adrenaline, focus_branch_fury_1_2 |  |

## Radiance

| Name | ID | Effect | Required | Alternatives |
|---|---|---|---|---|
| Maximum HP | root_vitality | +2% Maximum HP. |  |  |
| Radiance | affinity_vitality | Regenerate 0.15% maximum Health per combat second. Your basic regeneration is capped at 0.35% maximum Health per second before Recovery/Reserve specialisations. | root_vitality |  |
| Healing Power | outer_vitality_-1_1 | +1% Healing Power. | affinity_vitality |  |
| Maximum HP | outer_vitality_-1_2 | +2% Maximum HP. | outer_vitality_-1_1 |  |
| Maximum HP | outer_vitality_1_1 | +2% Maximum HP. | affinity_vitality |  |
| Barrier Power | outer_vitality_1_2 | +2% Barrier Power. | outer_vitality_1_1 |  |
| Maximum HP | basic_path_vitality_0_1 | +2% Maximum HP. | affinity_vitality |  |
| Maximum HP | gate_strong_heart | +2% Maximum HP. | basic_path_vitality_0_1 |  |
| Strong Heart | strong_heart | Max Health +10% at Rank 1; smaller gains at higher ranks. | gate_strong_heart |  |
| Max HP regeneration per second | basic_path_vitality_0_2 | +0.075% Max HP regeneration per second. |  | strong_heart, grasping_roots |
| Max HP regeneration per second | gate_renewal | +0.075% Max HP regeneration per second. | basic_path_vitality_0_2 |  |
| Renewal | renewal | Heal 0.55% Max HP per second at Rank 1; smaller gains at higher ranks. Healing reduction applies. | gate_renewal |  |
| Maximum HP | basic_path_vitality_0_3 | +4% Maximum HP. |  | renewal, basic_detour_vitality_0 |
| Maximum HP | gate_last_stand | +4% Maximum HP. | basic_path_vitality_0_3 |  |
| Last Stand | last_stand | Once per Expedition, survive a lethal hit and recover 6% Max HP. | gate_last_stand |  |
| Healing Power | basic_path_vitality_1_1 | +1% Healing Power. | affinity_vitality |  |
| Maximum HP | gate_second_breath | +2% Maximum HP. | basic_path_vitality_1_1 |  |
| Second Breath | second_breath | Heal after each completed encounter: 1.5% Max HP at rank 1 (+0.4 percentage points per rank). | gate_second_breath |  |
| Healing Power | basic_path_vitality_1_2 | +1.5% Healing Power. |  | second_breath, living_force |
| Healing Power | gate_life_bloom | +1.5% Healing Power. | basic_path_vitality_1_2 |  |
| Life Bloom | life_bloom | Each combat second, restore 0.25% Max HP and 1.5 Mana at rank 1; gains become smaller at higher ranks, up to 0.6% Health and 3.4 Mana. | gate_life_bloom |  |
| Max HP regeneration per second | basic_path_vitality_1_3 | +0.1% Max HP regeneration per second. |  | life_bloom, basic_detour_vitality_1 |
| Healing Power | gate_second_pulse | +2% Healing Power. | basic_path_vitality_1_3 |  |
| Second Pulse | second_pulse | Crossing below half Health heals 1% per rank each second for 3s, once per room. | gate_second_pulse |  |
| Max HP regeneration per second | focus_branch_vitality_0_1 | +0.05% Max HP regeneration per second. |  | basic_path_vitality_0_1, vital_pulse |
| Healing Power | focus_branch_vitality_1_1 | +1% Healing Power. |  | basic_path_vitality_1_1, vital_pulse |
| Healing Power | gate_living_recovery | +1% Healing Power. | focus_branch_vitality_0_1, focus_branch_vitality_1_1 |  |
| Living Recovery | living_recovery | Below half Health, restore 0.5% maximum Health each second. | gate_living_recovery |  |
| Maximum HP | focus_branch_vitality_0_2 | +3% Maximum HP. |  | focus_bridge_vitality_0_2, gate_renewal, grasping_roots |
| Defense | focus_branch_vitality_1_2 | +3% Defense. |  | focus_bridge_vitality_1_2, gate_life_bloom, living_force |
| Barrier Power | gate_overflowing_life | +3% Barrier Power. | focus_branch_vitality_0_2, focus_branch_vitality_1_2 |  |
| Overflowing Life | overflowing_life | Effective healing grants Barrier equal to 15% of Health restored, up to 10% maximum Health. | gate_overflowing_life |  |
| Healing Power | focus_branch_vitality_0_3 | +2% Healing Power. |  | focus_bridge_vitality_0_3, gate_last_stand |
| Barrier Power | focus_branch_vitality_1_3 | +4% Barrier Power. |  | focus_bridge_vitality_1_3, gate_second_pulse |
| Maximum HP | gate_heart_of_the_wild | +4% Maximum HP. | focus_branch_vitality_0_3, focus_branch_vitality_1_3 | living_recovery, overflowing_life |
| Heart of the Wild | heart_of_the_wild | Below 30% Health, restore 12% maximum Health once per encounter. | gate_heart_of_the_wild |  |
| Healing Power | mixed_path_fury_vitality_vitality_1 | +1% Healing Power. |  | outer_vitality_-1_2, strong_heart |
| Maximum HP | mixed_path_fury_vitality_vitality_2 | +3% Maximum HP. |  | mixed_path_fury_vitality_vitality_1, fervent_life, renewal |
| Healing Power | mixed_path_fury_vitality_vitality_3 | +2% Healing Power. |  | mixed_path_fury_vitality_vitality_2, redline, last_stand |
| Barrier Power | mixed_path_vitality_aegis_vitality_1 | +2% Barrier Power. |  | outer_vitality_1_2, second_breath |
| Barrier Power | gate_sanctuary | +2% Barrier Power. | mixed_path_vitality_aegis_vitality_1, mixed_path_vitality_aegis_aegis_1 |  |
| Sanctuary | sanctuary | Recovering Health grants Barrier equal to 20% of the heal. | gate_sanctuary |  |
| Maximum HP | mixed_path_vitality_aegis_vitality_2 | +3% Maximum HP. |  | mixed_path_vitality_aegis_vitality_1, sanctuary, life_bloom |
| Healing Power | gate_guardians_oath | +1.5% Healing Power. | mixed_path_vitality_aegis_vitality_2, mixed_path_vitality_aegis_aegis_2 |  |
| Guardian's Oath | guardians_oath | When your Barrier breaks, restore 4.5% maximum Health once per encounter. | gate_guardians_oath |  |
| Healing Power | mixed_path_vitality_aegis_vitality_3 | +2% Healing Power. |  | mixed_path_vitality_aegis_vitality_2, guardians_oath, second_pulse |
| Barrier Power | gate_last_bastion | +4% Barrier Power. | mixed_path_vitality_aegis_vitality_3, mixed_path_vitality_aegis_aegis_3 | sanctuary, guardians_oath |
| Last Bastion | last_bastion | Prepared: once per expedition, survive lethal damage and gain Barrier for 4s. Recover half its absorbed damage. | gate_last_bastion |  |
| Maximum HP | focus_bridge_vitality_0_2 | +3% Maximum HP. | focus_branch_vitality_0_1 |  |
| Healing Power | focus_bridge_vitality_0_3 | +2% Healing Power. | focus_branch_vitality_0_2 |  |
| Defense | focus_bridge_vitality_1_2 | +3% Defense. | focus_branch_vitality_1_1 |  |
| Barrier Power | focus_bridge_vitality_1_3 | +4% Barrier Power. | focus_branch_vitality_1_2 |  |
| Maximum HP | basic_detour_vitality_0 | +4% Maximum HP. | gate_renewal, focus_branch_vitality_0_2 |  |
| Max HP regeneration per second | basic_detour_vitality_1 | +0.1% Max HP regeneration per second. | gate_life_bloom, focus_branch_vitality_1_2 |  |
| Maximum HP | weapon_path_vital_pulse_1 | +2% Maximum HP. | affinity_vitality |  |
| Maximum HP | weapon_path_vital_pulse_2 | +2% Maximum HP. | weapon_path_vital_pulse_1 |  |
| Maximum HP | gate_vital_pulse | +2% Maximum HP. | weapon_path_vital_pulse_2 |  |
| Vital Pulse | vital_pulse | Every 4 seconds, deal damage equal to 2% Max HP to up to four living active enemies; class caps apply. | gate_vital_pulse |  |
| Healing Power | weapon_path_living_force_1 | +1% Healing Power. | basic_path_vitality_1_1 |  |
| Healing Power | weapon_path_living_force_2 | +1% Healing Power. | weapon_path_living_force_1 |  |
| Healing Power | gate_living_force | +1% Healing Power. | weapon_path_living_force_2 |  |
| Living Force | living_force | Store 20% effective healing up to 5% Max HP per encounter. Release that charge on the next main attack (4s cooldown; enemy class caps). | gate_living_force |  |
| Maximum HP | weapon_path_grasping_roots_1 | +2% Maximum HP. | basic_path_vitality_0_1 |  |
| Maximum HP | weapon_path_grasping_roots_2 | +2% Maximum HP. | weapon_path_grasping_roots_1 |  |
| Maximum HP | gate_grasping_roots | +2% Maximum HP. | weapon_path_grasping_roots_2 |  |
| Grasping Roots | grasping_roots | Every 8 seconds, deal 1.5% Max HP damage to up to four active enemies. Normal enemies have 15% longer attack intervals for 2s; no leader slow or stacking with stronger Chill. | gate_grasping_roots |  |

## aegis

| Name | ID | Effect | Required | Alternatives |
|---|---|---|---|---|
| Defense | root_aegis | +2% Defense. |  |  |
| aegis | affinity_aegis | Gain 5% Max HP + 8% Spell Power as Barrier at each encounter start. Barrier from Aegis, Orb and other sources stacks freely; remaining Barrier disappears after every encounter. | root_aegis |  |
| Maximum HP | outer_aegis_-1_1 | +2% Maximum HP. | affinity_aegis |  |
| Guard Chance | outer_aegis_-1_2 | +1% Guard Chance (percentage points). | outer_aegis_-1_1 |  |
| Spell Power | outer_aegis_1_1 | +2% Spell Power. | affinity_aegis |  |
| Barrier Power | outer_aegis_1_2 | +2% Barrier Power. | outer_aegis_1_1 |  |
| Guard Chance | basic_path_aegis_0_1 | +1% Guard Chance (percentage points). | affinity_aegis |  |
| Guard Chance | gate_guarded_block | +1% Guard Chance (percentage points). | basic_path_aegis_0_1 |  |
| Guarded Block | guarded_block | Raises Guard Chance, even without a shield. Total Guard Chance cannot exceed 65%; a successful Guard reduces damage according to equipment. | gate_guarded_block |  |
| Barrier Power | basic_path_aegis_0_2 | +3% Barrier Power. |  | guarded_block, mace_shockwave |
| Barrier Power | gate_barrier_pulse | +3% Barrier Power. | basic_path_aegis_0_2 |  |
| Barrier Pulse | barrier_pulse | Gain Barrier every 6s: 3% Max HP + 6% Spell Power at rank 1 (+0.6% HP and +1.2% Spell Power per rank). Barrier stacks without a maximum and resets between encounters. | gate_barrier_pulse |  |
| Defense | basic_path_aegis_0_3 | +4% Defense. |  | barrier_pulse, basic_detour_aegis_0 |
| Defense | gate_brace | +4% Defense. | basic_path_aegis_0_3 |  |
| Brace | brace | Reduce incoming elite and boss strikes by 4% per rank. | gate_brace |  |
| Defense | basic_path_aegis_1_1 | +2% Defense. | affinity_aegis |  |
| Defense | gate_iron_skin | +2% Defense. | basic_path_aegis_1_1 |  |
| Iron Skin | iron_skin | Defense +12% at Rank 1; smaller gains at higher ranks. | gate_iron_skin |  |
| Maximum HP | basic_path_aegis_1_2 | +3% Maximum HP. |  | iron_skin, sword_sweep |
| Defense | gate_fortified | +3% Defense. | basic_path_aegis_1_2 |  |
| Fortified | fortified | Reduce incoming damage by 4% per rank, within the combined 28% cap. | gate_fortified |  |
| Guard Chance | basic_path_aegis_1_3 | +2% Guard Chance (percentage points). |  | fortified, basic_detour_aegis_1 |
| Barrier Power | gate_retaliation | +4% Barrier Power. | basic_path_aegis_1_3 |  |
| Retaliation | retaliation | When Barrier absorbs damage, your next hit deals 30% more base hit damage (4s cooldown). | gate_retaliation |  |
| Guard Chance | focus_branch_aegis_0_1 | +1% Guard Chance (percentage points). |  | basic_path_aegis_0_1, ward_echo |
| Maximum HP | focus_branch_aegis_1_1 | +2% Maximum HP. |  | basic_path_aegis_1_1, ward_echo |
| Guard Chance | gate_steadfast_guard | +1% Guard Chance (percentage points). | focus_branch_aegis_0_1, focus_branch_aegis_1_1 |  |
| Steadfast Guard | steadfast_guard | While you have Barrier, gain 15 percentage points of Block chance (maximum 65%), even without a shield. A block prevents part of the hit before Barrier absorbs the remainder. Each block also grants 3% damage reduction for 5 seconds, up to 3 stacks. | gate_steadfast_guard |  |
| Defense | focus_branch_aegis_0_2 | +3% Defense. |  | focus_bridge_aegis_0_2, gate_barrier_pulse, mace_shockwave |
| Spell Power | focus_branch_aegis_1_2 | +3% Spell Power. |  | focus_bridge_aegis_1_2, gate_fortified, sword_sweep |
| Guard Chance | gate_stored_force | +1.5% Guard Chance (percentage points). | focus_branch_aegis_0_2, focus_branch_aegis_1_2 |  |
| Stored Force | stored_force | Store 30% of damage blocked or absorbed by Barrier. At 25% maximum Health stored, release the stored damage against all enemies immediately. | gate_stored_force |  |
| Barrier Power | focus_branch_aegis_0_3 | +4% Barrier Power. |  | focus_bridge_aegis_0_3, gate_brace |
| Guard Chance | focus_branch_aegis_1_3 | +2% Guard Chance (percentage points). |  | focus_bridge_aegis_1_3, gate_retaliation |
| Barrier Power | gate_unbreakable | +4% Barrier Power. | focus_branch_aegis_0_3, focus_branch_aegis_1_3 | steadfast_guard, stored_force |
| Unbreakable | unbreakable | Once per Expedition, survive a fatal hit with 1 Health and gain a Barrier equal to 20% of maximum Health. Attack speed is reduced by 20% for 5 seconds. | gate_unbreakable |  |
| Barrier Power | mixed_path_vitality_aegis_aegis_1 | +2% Barrier Power. |  | outer_aegis_-1_2, guarded_block |
| Guard Chance | mixed_path_vitality_aegis_aegis_2 | +1.5% Guard Chance (percentage points). |  | mixed_path_vitality_aegis_aegis_1, sanctuary, barrier_pulse |
| Defense | mixed_path_vitality_aegis_aegis_3 | +4% Defense. |  | mixed_path_vitality_aegis_aegis_2, guardians_oath, brace |
| Spell Power | mixed_path_aegis_magic_aegis_1 | +2% Spell Power. |  | outer_aegis_1_2, iron_skin |
| Spell Power | gate_runic_shield | +2% Spell Power. | mixed_path_aegis_magic_aegis_1, mixed_path_aegis_magic_magic_1 |  |
| Runic Shield | runic_shield | Funded Magic spells or Arcane Infusion activations grant 2% Max HP + 8% Spell Power as Barrier (3s cooldown). | gate_runic_shield |  |
| Barrier Power | mixed_path_aegis_magic_aegis_2 | +3% Barrier Power. |  | mixed_path_aegis_magic_aegis_1, runic_shield, fortified |
| Barrier Power | gate_prismatic_rebound | +3% Barrier Power. | mixed_path_aegis_magic_aegis_2, mixed_path_aegis_magic_magic_2 |  |
| Prismatic Rebound | prismatic_rebound | Barrier absorption charges your next Magic cast, up to 6% Max HP + 10% Spell Power. | gate_prismatic_rebound |  |
| Defense | mixed_path_aegis_magic_aegis_3 | +4% Defense. |  | mixed_path_aegis_magic_aegis_2, prismatic_rebound, retaliation |
| Spell Power | gate_arcane_bastion | +4% Spell Power. | mixed_path_aegis_magic_aegis_3, mixed_path_aegis_magic_magic_3 | runic_shield, prismatic_rebound |
| Arcane Bastion | arcane_bastion | Prepared: absorbing damage with Barrier charges the next funded cast or Arcane Infusion hit to deal 30% Spell Power and grant Barrier equal to 3% Max HP + 6% Spell Power (6s cooldown). | gate_arcane_bastion |  |
| Attack Power | weapon_path_sword_sweep_1 | +3% Attack Power. | basic_path_aegis_1_1 |  |
| Attack Power | weapon_path_sword_sweep_2 | +4% Attack Power. | weapon_path_sword_sweep_1 |  |
| Attack Power | gate_sword_sweep | +4% Attack Power. | weapon_path_sword_sweep_2 |  |
| Shielded Sweep | sword_sweep | Sword and Shield attacks hit one additional enemy for 25% damage. | gate_sword_sweep |  |
| Attack Power | weapon_path_mace_shockwave_1 | +3% Attack Power. | basic_path_aegis_0_1 |  |
| Attack Power | weapon_path_mace_shockwave_2 | +4% Attack Power. | weapon_path_mace_shockwave_1 |  |
| Attack Power | gate_mace_shockwave | +4% Attack Power. | weapon_path_mace_shockwave_2 |  |
| Concussive Swing | mace_shockwave | Mace attacks deal 30% damage to one additional enemy and slow its attacks for one second. | gate_mace_shockwave |  |
| Defense | focus_bridge_aegis_0_2 | +3% Defense. | focus_branch_aegis_0_1 |  |
| Barrier Power | focus_bridge_aegis_0_3 | +4% Barrier Power. | focus_branch_aegis_0_2 |  |
| Spell Power | focus_bridge_aegis_1_2 | +3% Spell Power. | focus_branch_aegis_1_1 |  |
| Guard Chance | focus_bridge_aegis_1_3 | +2% Guard Chance (percentage points). | focus_branch_aegis_1_2 |  |
| Defense | basic_detour_aegis_0 | +4% Defense. | gate_barrier_pulse, focus_branch_aegis_0_2 |  |
| Guard Chance | basic_detour_aegis_1 | +2% Guard Chance (percentage points). | gate_fortified, focus_branch_aegis_1_2 |  |
| Spell Power | weapon_path_ward_echo_1 | +2% Spell Power. | affinity_aegis |  |
| Barrier Power | weapon_path_ward_echo_2 | +2% Barrier Power. | weapon_path_ward_echo_1 |  |
| Defense | gate_ward_echo | +2% Defense. | weapon_path_ward_echo_2 |  |
| Ward Echo | ward_echo | Every 4 seconds while Barrier exists, deal 1% Max HP + 15% Defense damage to up to four active enemies. Does not scale with current Barrier; class caps apply. | gate_ward_echo |  |

## Arcane

| Name | ID | Effect | Required | Alternatives |
|---|---|---|---|---|
| Spell Power | root_magic | +2% Spell Power. |  |  |
| Arcane | affinity_magic | Increase Spell Power by 8%. Spend 10–20 Mana (depending on element) for Arcane Infusion: empower the next 2 main attacks (6s cooldown, 7s duration). +85% Spell Power per hit with physical weapons, +35% with Wand, +95% with Staff. Elemental attunements keep Infusion and unlock elemental casts. | root_magic |  |
| Spell Power | outer_magic_-1_1 | +2% Spell Power. | affinity_magic |  |
| Barrier Power | outer_magic_-1_2 | +2% Barrier Power. | outer_magic_-1_1 |  |
| Critical Chance | outer_magic_1_1 | +2% Critical Chance (percentage points). | affinity_magic |  |
| Mana Regeneration | outer_magic_1_2 | +1% Mana Regeneration. | outer_magic_1_1 |  |
| Spell Power | basic_path_magic_0_1 | +2% Spell Power. | affinity_magic |  |
| Spell Power | gate_arcane_focus | +2% Spell Power. | basic_path_magic_0_1 |  |
| Arcane Focus | arcane_focus | Spell Power +15% at rank 1, including Arcane Infusion; gains decrease at higher ranks. | gate_arcane_focus |  |
| Mana Regeneration | basic_path_magic_0_2 | +1.5% Mana Regeneration. | arcane_focus |  |
| Mana Regeneration | gate_mana_spring | +1.5% Mana Regeneration. | basic_path_magic_0_2 |  |
| Mana Spring | mana_spring | Mana regeneration +12% at Rank 1; smaller gains at higher ranks. | gate_mana_spring |  |
| Mana Cost Reduction | basic_path_magic_0_3 | +2% Mana Cost Reduction. |  | mana_spring, basic_detour_magic_0 |
| Mana Cost Reduction | gate_efficient_cast | +2% Mana Cost Reduction. | basic_path_magic_0_3 |  |
| Efficient Casting | efficient_cast | Magic casts cost 1 less Mana per rank, down to a minimum of 3. | gate_efficient_cast |  |
| Spell Power | basic_path_magic_1_1 | +2% Spell Power. | affinity_magic |  |
| Spell Power | gate_arcane_echo | +2% Spell Power. | basic_path_magic_1_1 |  |
| Arcane Echo | arcane_echo | Every fourth funded Magic or Arcane Infusion hit echoes for 25% Spell Power (+5 percentage points per rank; no recursive effects). | gate_arcane_echo |  |
| Spell Power | basic_path_magic_1_2 | +3% Spell Power. | arcane_echo |  |
| Spell Power | gate_elemental_force | +3% Spell Power. | basic_path_magic_1_2 |  |
| Elemental Force | elemental_force | Funded Magic casts and Arcane Infusion gain 12% power per rank. | gate_elemental_force |  |
| Maximum Mana | basic_path_magic_1_3 | +4% Maximum Mana. |  | elemental_force, basic_detour_magic_1 |
| Spell Power | gate_spell_echo | +4% Spell Power. | basic_path_magic_1_3 |  |
| Spell Echo | spell_echo | Every third funded cast or Arcane Infusion hit echoes for 10% damage per rank. | gate_spell_echo |  |
| Spell Power | mixed_path_aegis_magic_magic_1 | +2% Spell Power. |  | outer_magic_-1_2, arcane_focus |
| Barrier Power | mixed_path_aegis_magic_magic_2 | +3% Barrier Power. |  | mixed_path_aegis_magic_magic_1, runic_shield, mana_spring |
| Spell Power | mixed_path_aegis_magic_magic_3 | +4% Spell Power. |  | mixed_path_aegis_magic_magic_2, prismatic_rebound, efficient_cast |
| Spell Power | mixed_path_magic_decay_magic_1 | +2% Spell Power. |  | outer_magic_1_2, arcane_echo |
| Spell Power | gate_hex_bolt | +2% Spell Power. | mixed_path_magic_decay_magic_1, mixed_path_magic_decay_decay_1 |  |
| Hex Bolt | hex_bolt | Funded spells or Arcane Infusion hits against Rot deal 25% Spell Power plus one Rot tick (3s cooldown). | gate_hex_bolt |  |
| Mana Regeneration | mixed_path_magic_decay_magic_2 | +1.5% Mana Regeneration. |  | mixed_path_magic_decay_magic_1, hex_bolt, elemental_force |
| Spell Power | gate_elemental_blight | +3% Spell Power. | mixed_path_magic_decay_magic_2, mixed_path_magic_decay_decay_2 |  |
| Elemental Blight | elemental_blight | Fire consumes Rot for damage, Frost extends it, Lightning consumes it for damage, and Arcane deals damage based on active Rot without consuming it (7s cooldown). | gate_elemental_blight |  |
| Mana Cost Reduction | mixed_path_magic_decay_magic_3 | +2% Mana Cost Reduction. |  | mixed_path_magic_decay_magic_2, elemental_blight, spell_echo |
| Spell Power | gate_grave_bloom | +4% Spell Power. | mixed_path_magic_decay_magic_3, mixed_path_magic_decay_decay_3 | hex_bolt, elemental_blight |
| Grave Bloom | grave_bloom | Prepared: each paid Arcane Infusion hit applies 2 Rot stacks, deals a burst equal to one tick of all active Rot on the target, then spreads up to 2 stacks at 75% strength to each of 2 active enemies. Rot is not consumed. | gate_grave_bloom |  |
| Arcane Attunement | element_choice | All elements keep Arcane Infusion. Arcane strengthens it by +10 percentage points Spell Power per hit and reduces the cost from 12 to 10 Mana; Fire, Frost or Lightning add their own funded spells. Changing mode refunds mode-specific skills. | affinity_magic |  |
| Spell Power | magic_side_0_1 | +2% Spell Power. |  | element_choice, basic_path_magic_0_1 |
| Maximum Mana | magic_side_1_1 | +2% Maximum Mana. |  | element_choice, basic_path_magic_1_1 |
| Mana Regeneration | magic_side_0_2 | +1.5% Mana Regeneration. |  | magic_bridge_0_2, gate_mana_spring, arcane_nova, controlled_burn, frost_resonance, static_focus |
| Mana Regeneration | magic_bridge_0_2 | +1.5% Mana Regeneration. | magic_side_0_1 |  |
| Critical Chance | magic_side_1_2 | +3% Critical Chance (percentage points). |  | magic_bridge_1_2, gate_elemental_force, mana_convergence, cinder_focus, glacial_echo, storm_conductor |
| Critical Chance | magic_bridge_1_2 | +3% Critical Chance (percentage points). | magic_side_1_1 |  |
| Mana Cost Reduction | magic_side_0_3 | +2% Mana Cost Reduction. |  | magic_bridge_0_3, gate_efficient_cast |
| Mana Cost Reduction | magic_bridge_0_3 | +2% Mana Cost Reduction. | magic_side_0_2 |  |
| Spell Power | magic_side_1_3 | +4% Spell Power. |  | magic_bridge_1_3, gate_spell_echo |
| Spell Power | magic_bridge_1_3 | +4% Spell Power. | magic_side_1_2 |  |
| Spell Power | gate_arcane_resonance | +2% Spell Power. | element_choice, magic_side_0_1, magic_side_1_1 |  |
| Arcane Resonance | arcane_resonance | Increase Spell Power by 5% and maximum Mana by 3. | gate_arcane_resonance |  |
| Mana Regeneration | gate_arcane_surge | +1.5% Mana Regeneration. | element_choice, magic_side_0_2, magic_side_1_2 |  |
| Arcane Surge | arcane_surge | Increase Spell Power by 8% and Mana Regeneration by 0.25 per second. | gate_arcane_surge |  |
| Spell Power | gate_arcane_mastery | +4% Spell Power. | element_choice, magic_side_0_3, magic_side_1_3 | arcane_resonance, arcane_surge |
| Arcane Mastery | arcane_mastery | Increase Spell Power by 12%. Arcane Infusion hits or paid Arcane weapon casts restore 2 Mana every 5 seconds. | gate_arcane_mastery |  |
| Spell Power | gate_kindling | +2% Spell Power. | element_choice, magic_side_0_1, magic_side_1_1 |  |
| Kindling | kindling | Funded Fire casts apply Burn. | gate_kindling |  |
| Spell Power | gate_fire_spread | +3% Spell Power. | element_choice, magic_side_0_2, magic_side_1_2 |  |
| Wildfire | fire_spread | Funded Fire casts spread Burn to two additional foes at 65% strength for up to three seconds and deal immediate splash. | gate_fire_spread |  |
| Spell Power | gate_combustion | +4% Spell Power. | element_choice, magic_side_0_3, magic_side_1_3 | kindling, fire_spread |
| Combustion | combustion | Fire casts apply Burn if needed; casts against burning enemies deal 20% Spell Power bonus damage every 4 seconds. | gate_combustion |  |
| Spell Power | gate_deep_winter | +2% Spell Power. | element_choice, magic_side_0_1, magic_side_1_1 |  |
| Deep Winter | deep_winter | Funded Frost casts Chill. Chilled foes take a Spell Power burst every 4s (18% at rank 1, +3 percentage points per rank; capped at 5% of normal foes’ Max HP or 1.5% of bosses’). Boss Chill lasts at most 1.2s. | gate_deep_winter |  |
| Spell Power | gate_frost_spread | +3% Spell Power. | element_choice, magic_side_0_2, magic_side_1_2 |  |
| Winter Field | frost_spread | Funded Frost casts Chill up to two additional enemies for two seconds. | gate_frost_spread |  |
| Spell Power | gate_shatter | +4% Spell Power. | element_choice, magic_side_0_3, magic_side_1_3 | deep_winter, frost_spread |
| Shatter | shatter | Frost casts apply Chill if needed; casts against chilled foes deal 25% Spell Power bonus damage every 4 seconds. | gate_shatter |  |
| Spell Power | gate_overcharge | +2% Spell Power. | element_choice, magic_side_0_1, magic_side_1_1 |  |
| Overcharge | overcharge | Funded Lightning casts bounce up to five times for 60%, 45%, 33%, 23%, then 16% of the primary hit. Each jump leaves a Static Mark that detonates when a later chain revisits. Every 4 charges discharge for 32% Spell Power at rank 1 (+6 percentage points per rank), capped at 3.5% of the foe’s Max HP. Charges persist between Realms. | gate_overcharge |  |
| Spell Power | gate_storm_mastery | +3% Spell Power. | element_choice, magic_side_0_2, magic_side_1_2 |  |
| Forked Lightning | storm_mastery | Funded Lightning chains bounce up to six times for 68%, 53%, 40%, 29%, 21%, 15% damage. Returning chains detonate prior Static Marks. | gate_storm_mastery |  |
| Spell Power | gate_chain_discharge | +4% Spell Power. | element_choice, magic_side_0_3, magic_side_1_3 | overcharge, storm_mastery |
| Chain Discharge | chain_discharge | Every fourth Lightning cast deals 35% Spell Power bonus damage. | gate_chain_discharge |  |
| Mana Cost Reduction | basic_detour_magic_0 | +2% Mana Cost Reduction. | gate_mana_spring, magic_side_0_2 |  |
| Maximum Mana | basic_detour_magic_1 | +4% Maximum Mana. | gate_elemental_force, magic_side_1_2 |  |
| Spell Power | gate_arcane_nova | +2% Spell Power. | magic_side_0_1, element_choice |  |
| Arcane Nova | arcane_nova | Each consumed Arcane Infusion charge deals 35% of its damage to up to two other living enemies, unless Grave Bloom activated on that charge. Raw class caps apply. | gate_arcane_nova |  |
| Mana Cost Reduction | gate_mana_convergence | +1% Mana Cost Reduction. | magic_side_1_1, element_choice |  |
| Mana Convergence | mana_convergence | A funded Arcane cast or Infusion activation below 30% Mana refunds up to 4 Mana, once every 8s. | gate_mana_convergence |  |
| Spell Power | gate_controlled_burn | +2% Spell Power. | magic_side_0_1, element_choice |  |
| Controlled Burn | controlled_burn | Eligible paid primary Burn gains 25% tick damage; Fire Spread and Conflagration use 75% of original unboosted potency, including Wildfire. New standalone Burn cannot propagate. No additional targets. | gate_controlled_burn |  |
| Spell Power | gate_cinder_focus | +2% Spell Power. | magic_side_1_1, element_choice |  |
| Cinder Focus | cinder_focus | Paid Fire casts against an already burning isolated enemy burst for one strongest original Burn tick, once every 5s. No reserves may remain. | gate_cinder_focus |  |
| Spell Power | gate_frost_resonance | +2% Spell Power. | magic_side_0_1, element_choice |  |
| Frost Resonance | frost_resonance | Paid Frost casts against an already chilled enemy pulse for 25% effective Spell Power to up to two other chilled active enemies, once every 4s. | gate_frost_resonance |  |
| Spell Power | gate_glacial_echo | +2% Spell Power. | magic_side_1_1, element_choice |  |
| Glacial Echo | glacial_echo | Paid Frost casts against an already chilled enemy deal 30% effective Spell Power bonus damage to that enemy, once every 5s. | gate_glacial_echo |  |
| Spell Power | gate_static_focus | +2% Spell Power. | magic_side_0_1, element_choice |  |
| Static Focus | static_focus | Redirect 25% of secondary Lightning chain and mark damage toward the primary target, capped at 30% chain base and class limits. No new jumps or marks. | gate_static_focus |  |
| Spell Power | gate_storm_conductor | +2% Spell Power. | magic_side_1_1, element_choice |  |
| Storm Conductor | storm_conductor | Paid Lightning casts against one living enemy and no reserves deal 30% effective Spell Power bonus damage every 5s. No extra chain. | gate_storm_conductor |  |

## decay

| Name | ID | Effect | Required | Alternatives |
|---|---|---|---|---|
| Attack Power | root_decay | +2% Attack Power. |  |  |
| decay | affinity_decay | Attacks may spend 4 Mana to inflict persistent Rot: 4% of base weapon damage plus Spell Power combined per tick, up to six stacks. Unlock Mana, Mana Regeneration and Spell Power with any weapon. Secondary weapon hits have half application chance and potency, finite duration and normal Mana costs. | root_decay |  |
| Spell Power | outer_decay_-1_1 | +2% Spell Power. | affinity_decay |  |
| Maximum Mana | outer_decay_-1_2 | +2% Maximum Mana. | outer_decay_-1_1 |  |
| Attack Power | outer_decay_1_1 | +2% Attack Power. | affinity_decay |  |
| Rot Damage | outer_decay_1_2 | +2% Rot Damage. | outer_decay_1_1 |  |
| Attack Power | basic_path_decay_0_1 | +2% Attack Power. | affinity_decay |  |
| Rot Damage | gate_toxic_touch | +2% Rot Damage. | basic_path_decay_0_1 |  |
| Toxic Touch | toxic_touch | Increase the affinity Rot application chance by 4 percentage points per rank. Each application costs 4 Mana; primary stacks persist and scale with base weapon damage plus Spell Power. | gate_toxic_touch |  |
| Rot Damage | basic_path_decay_0_2 | +2.5% Rot Damage. |  | toxic_touch, soul_drain |
| Rot Damage | gate_virulent_rot | +2.5% Rot Damage. | basic_path_decay_0_2 |  |
| Virulent Rot | virulent_rot | New Rot stacks deal 15% more damage per rank. | gate_virulent_rot |  |
| Spell Power | basic_path_decay_0_3 | +4% Spell Power. |  | virulent_rot, basic_detour_decay_0 |
| Spell Power | gate_blight | +4% Spell Power. | basic_path_decay_0_3 |  |
| Blight | blight | On hit, spend 8 Mana to apply one persistent Rot stack and deal 38% base hit damage plus 35% Spell Power, capped at 2.5% enemy Max HP (7s cooldown). | gate_blight |  |
| Maximum Mana | basic_path_decay_1_1 | +2% Maximum Mana. | affinity_decay |  |
| enemy Defense reduction while Rot is active | gate_wasting_curse | 2% less enemy Defense while Rot is active (maximum 10%). | basic_path_decay_1_1 |  |
| Wasting Curse | wasting_curse | Rotted enemies deal 4% less damage per rank. Combined damage reduction cannot exceed 28%. | gate_wasting_curse |  |
| Mana Regeneration | basic_path_decay_1_2 | +1.5% Mana Regeneration. |  | wasting_curse, corruption_nova |
| Rot Damage | gate_wither | +2.5% Rot Damage. | basic_path_decay_1_2 |  |
| Withering Hex | wither | Rotted foes heal 20% less at rank 1 (+10% per rank) and deal 2% less attack damage per rank. Player healing is unaffected. | gate_wither |  |
| Mana Regeneration | basic_path_decay_1_3 | +2% Mana Regeneration. |  | wither, basic_detour_decay_1 |
| Rot Damage | gate_incubation | +3% Rot Damage. | basic_path_decay_1_3 |  |
| Incubation | incubation | Every third consecutive Rot tick deals 12% more damage per rank. | gate_incubation |  |
| Attack Power | focus_branch_decay_0_1 | +2% Attack Power. |  | basic_path_decay_0_1, contagious_touch |
| Spell Power | focus_branch_decay_1_1 | +2% Spell Power. |  | basic_path_decay_1_1, contagious_touch |
| Rot Damage | gate_lingering_rot | +2% Rot Damage. | focus_branch_decay_0_1, focus_branch_decay_1_1 |  |
| Lingering Rot | lingering_rot | Finite Rot from secondary hits and Contagious Touch lasts six ticks instead of four. Paid primary Rot already persists. | gate_lingering_rot |  |
| enemy Defense reduction while Rot is active | focus_branch_decay_0_2 | 2.5% less enemy Defense while Rot is active (maximum 10%). |  | focus_bridge_decay_0_2, gate_virulent_rot, soul_drain |
| Mana Cost Reduction | focus_branch_decay_1_2 | +1.5% Mana Cost Reduction. |  | focus_bridge_decay_1_2, gate_wither, corruption_nova |
| Spell Power | gate_corruption_cycle | +3% Spell Power. | focus_branch_decay_0_2, focus_branch_decay_1_2 |  |
| Corruption Cycle | corruption_cycle | On attack, spend 10 Mana to apply two persistent Rot stacks, then consume three eligible stacks if available for six equivalent ticks of their damage plus 20% AP and 20% SP. Cooldown scales with Attack Speed (2.5–10s), even without a burst. Propagated and independent ability stacks qualify. | gate_corruption_cycle |  |
| enemy Defense reduction while Rot is active | focus_branch_decay_0_3 | 3% less enemy Defense while Rot is active (maximum 10%). |  | focus_bridge_decay_0_3, gate_blight |
| Spell Power | focus_branch_decay_1_3 | +4% Spell Power. |  | focus_bridge_decay_1_3, gate_incubation |
| Rot Damage | gate_plagueheart | +3% Rot Damage. | focus_branch_decay_0_3, focus_branch_decay_1_3 | lingering_rot, corruption_cycle |
| Plagueheart | plagueheart | Pure Decay only. Each Rot tick has a 30% chance to spend 2 + 2 Mana per stack for 200% extra base tick damage; one activation per global tick, preserving 15% Max Mana. Other affinities refund this talent. | gate_plagueheart |  |
| Spell Power | mixed_path_magic_decay_decay_1 | +2% Spell Power. |  | outer_decay_-1_2, toxic_touch |
| Mana Regeneration | mixed_path_magic_decay_decay_2 | +1.5% Mana Regeneration. |  | mixed_path_magic_decay_decay_1, hex_bolt, virulent_rot |
| Spell Power | mixed_path_magic_decay_decay_3 | +4% Spell Power. |  | mixed_path_magic_decay_decay_2, elemental_blight, blight |
| Attack Power | mixed_path_decay_blood_decay_1 | +2% Attack Power. |  | outer_decay_1_2, wasting_curse |
| Rot Damage | gate_plague_spread | +2% Rot Damage. | mixed_path_decay_blood_decay_1, mixed_path_decay_blood_blood_1 |  |
| Contagion | plague_spread | On kill, spread one active Bleed and Rot at 50% strength to up to two enemies. Active recipients take five transferred ticks instantly; effects cannot spread again. | gate_plague_spread |  |
| Rot Damage | mixed_path_decay_blood_decay_2 | +2.5% Rot Damage. |  | mixed_path_decay_blood_decay_1, plague_spread, wither |
| Attack Power | gate_carrion_detonation | +3% Attack Power. | mixed_path_decay_blood_decay_2, mixed_path_decay_blood_blood_2 |  |
| Carrion Detonation | carrion_detonation | Weapon hits charge an enemy affected by Bleed and Rot using actual Health damage. At 150% Attack Power, release a burst equal to 75% of the threshold (35% on the marked foe), spreading weaker Bleed and Rot to active nearby foes. 1.5s cooldown per enemy. | gate_carrion_detonation |  |
| Attack Power | mixed_path_decay_blood_decay_3 | +4% Attack Power. |  | mixed_path_decay_blood_decay_2, carrion_detonation, incubation |
| Rot Damage | gate_septic_wound | +3% Rot Damage. | mixed_path_decay_blood_decay_3, mixed_path_decay_blood_blood_3 | plague_spread, carrion_detonation |
| Reaper's Cadence | septic_wound | Prepared: attacks against enemies with Bleed and Rot deal damage equal to one tick of the strongest stack of each, capped at 4% enemy maximum Health (6s cooldown). Neither stack is consumed. | gate_septic_wound |  |
| enemy Defense reduction while Rot is active | focus_bridge_decay_0_2 | 2.5% less enemy Defense while Rot is active (maximum 10%). | focus_branch_decay_0_1 |  |
| enemy Defense reduction while Rot is active | focus_bridge_decay_0_3 | 3% less enemy Defense while Rot is active (maximum 10%). | focus_branch_decay_0_2 |  |
| Mana Cost Reduction | focus_bridge_decay_1_2 | +1.5% Mana Cost Reduction. | focus_branch_decay_1_1 |  |
| Spell Power | focus_bridge_decay_1_3 | +4% Spell Power. | focus_branch_decay_1_2 |  |
| Spell Power | basic_detour_decay_0 | +4% Spell Power. | gate_virulent_rot, focus_branch_decay_0_2 |  |
| Mana Regeneration | basic_detour_decay_1 | +2% Mana Regeneration. | gate_wither, focus_branch_decay_1_2 |  |
| Rot Damage | weapon_path_contagious_touch_1 | +2% Rot Damage. | affinity_decay |  |
| Rot Damage | weapon_path_contagious_touch_2 | +2% Rot Damage. | weapon_path_contagious_touch_1 |  |
| Rot Damage | gate_contagious_touch | +2% Rot Damage. | weapon_path_contagious_touch_2 |  |
| Contagious Touch | contagious_touch | Every second paid primary Toxic Touch application spreads one persistent stack at 100% potency to up to three other living active enemies. Global 3s cooldown. Inactive with Carrion Detonation or prepared Grave Bloom. | gate_contagious_touch |  |
| Rot Damage | weapon_path_corruption_nova_1 | +2% Rot Damage. | basic_path_decay_1_1 |  |
| Rot Damage | weapon_path_corruption_nova_2 | +2% Rot Damage. | weapon_path_corruption_nova_1 |  |
| Rot Damage | gate_corruption_nova | +2% Rot Damage. | weapon_path_corruption_nova_2 |  |
| Corruption Overflow | corruption_nova | On attack, spend 6 Mana to apply one persistent Rot stack. With at least three eligible stacks, deal two equivalent ticks of their total damage to the target and distribute its actual HP damage among up to three other infected living active enemies. Does not consume stacks. Global 4s cooldown even without a burst; secondary class caps apply. Inactive with Carrion Detonation or prepared Grave Bloom. | gate_corruption_nova |  |
| Mana Regeneration | weapon_path_soul_drain_1 | +1% Mana Regeneration. | basic_path_decay_0_1 |  |
| Mana Cost Reduction | weapon_path_soul_drain_2 | +1% Mana Cost Reduction. | weapon_path_soul_drain_1 |  |
| Mana Cost Reduction | gate_soul_drain | +1% Mana Cost Reduction. | weapon_path_soul_drain_2 |  |
| Soul Drain | soul_drain | Four paid primary Toxic Touch applications recover up to 4 Mana; global 5s cooldown. Counters reset each encounter. Secondary, free and propagated Rot do not count. | gate_soul_drain |  |
| Rotguard | rotguard | At encounter start spend 50% of current Mana (rounded down) to gain equal Barrier, modified by Barrier Power. While this portion absorbs damage, the attacker has a 30% chance to receive a finite Rot stack at half normal potency (2s per enemy). Does not count as a paid primary application or replace existing stacks at the cap. | soul_drain |  |
