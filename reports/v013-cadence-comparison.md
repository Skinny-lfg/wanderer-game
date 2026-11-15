# Weapon cadence calibration

525 seeded RAM-only encounters per version, across seven weapons, E1/E3/E25/E100/E200 and solo, patrol, horde, elite with escort and boss with escorts. Three seeds per combination. Baseline commit 4f76660. The simulator uses the integrated equipment, talent and encounter runtime. No real profiles are read.

E1 uses Common gear. E3 uses a Rare weapon, two Common armor pieces, and the normal offhand where supported. Higher tiers use full typed armor and 15/40/80 available talent points. No attribute points, runes or consumables are granted. These are controlled comparisons, not a complete expedition balance audit.

## E3 sparse gear

|Weapon|Old interval|New interval|Solo seconds|Patrol seconds|20-mob horde seconds|
|---|---:|---:|---:|---:|---:|
|Sword|0.94 s|1.41 s|21.3|28.38|43.49|
|Mace|1.49 s|2 s|19.58|26.99|38.39|
|Bow|0.65 s|1.54 s|25.26|33.99|50.6|
|Daggers|0.47 s|0.83 s|13.97|20.09|32.63|
|Two-Handed|1.18 s|2.63 s|18.7|16.94|29.37|
|Staff|0.91 s|2.13 s|14.15|20.57|42.46|
|Wand|0.85 s|1.52 s|13.24|19.76|30.36|

## Design changes

Weapon base intervals are 1.6s Sword, 2.2s Mace, 2s Bow, 1.15s Daggers, 2.8s Two-Handed, 2.3s Staff and 1.65s Wand. Equipment and talent investment shortens them. Agility above the starting five adds a diminishing speed bonus, speed rating adds 3.5% per point, and Intellect gives a modest diminishing casting-speed bonus. Strength no longer accelerates shield attacks. The previous casting-speed floor and heavy-weapon catch-up are removed. Damage-per-hit coefficients and saved item rolls are preserved.

The prior horde HP increase was excessive after slowing weapons. Horde HP is redistributed to allow visible attacks without making twenty opponents an endurance slog. Elites and bosses retain their previous HP multiplier. Leader rewards now survive killing escorts last, including boss cores.

## Limits

Every comparison starts at full life with a fresh encounter. Early sparse gear can lose against bosses and hordes. These results do not assert equal DPS or equal win rates across weapons. Advanced Daggers remain much faster than Plate builds. The first step is weapon identity and readable progression, with future tuning based on player builds and full expedition attrition.

## Verification

The focused combat/talent/loot/lifecycle/group suite passed 71/71, and the two stat calculation tests passed. The browser test passed boot, crafting, save/reload, expedition entry, group focus and mobile bounds. The broad legacy suite has 82 failures out of 393 on both the baseline and this change; failure names are compared to identify regressions rather than calling this suite green. These existing failures need their own audit.
