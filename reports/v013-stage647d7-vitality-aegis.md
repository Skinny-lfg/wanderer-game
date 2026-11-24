# Stage 6.47D.7 — Vitality and Aegis

Gameplay commit: 3232cbc7f1126cd9a1ec61e98c1809696d7c603e. Existing balance branch only, no merge or deploy. Four new abilities and their paths are now enabled; 419 total graph nodes, 28 pending nodes (Decay and Magic). Weapon abilities Sword Sweep and Mace Shockwave unchanged.

## Initial implementation parameters (not final balance)
- Vital Pulse: every 4 combat seconds, raw 2% player maximum HP against up to four living active enemies.
- Grasping Roots: every 8 seconds, raw 1.5% maximum HP against up to four active enemies. Normal enemies only gain 15% longer attack intervals for 2 seconds. Root slow is independent of Chill and uses the stronger factor, not a multiplicative combination. No slow applied to elites/bosses.
- Ward Echo: every 4 seconds while Barrier exists, raw 1% maximum HP + 15% Defense against up to four living active enemies. Does not scale with or consume current Barrier. Missed pulses are not banked.
- All three pulses cap raw per-target damage at 4% normal / 1.25% elite / 0.5% boss maximum HP, before existing direct combat modifiers and Barrier. No critical rolls, status applications, weapon or recursive procs. No reserves or stage84 nodes.
- Living Force: accumulate 20% effective healing, capped at 5% player maximum HP. Encounter-local charge; eligible main attack releases charge on a living target, 4s cooldown; raw enemy-class caps 5%/2%/1%. No overheal, secondary or recursive activation. 
- Second Breath retains encounter healing (1.5% player maximum HP at first rank, +0.4 percentage points per additional rank); remove old periodic Vital Strike bonus to avoid overlapping new Living Force.
- Stored Force unchanged: 30% blocked/absorbed input, 25% player Max HP threshold; added telemetry for generated/accepted charge, activation count and raw burst. Existing carry behavior not changed. Measure actual activation frequency before adjusting.
- Retaliation and Fortified positions unchanged until matched tests justify a swap.

## Validation
CI run 45395882254: both jobs completed successfully. Targeted contracts 29/29; full npm test 380 + 8 + 84 + 79 = 551/551, zero failures. Stage 6.42 AoE safeguards run 45395783104 succeeded. Simulator native output now includes defensiveTalentMetrics; no fresh matched E10 defensive balance comparison performed. Canonical files and docs mirrors updated. New numeric choices are provisional calibration defaults. 
