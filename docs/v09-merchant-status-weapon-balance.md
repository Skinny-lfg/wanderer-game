# Merchant, dungeon affinity & combat layout balance (development)

- All favored dungeon equipment is now neutral: no red icons, no missing-slot calculation or tooltip based on equipped gear. Affinity is an informational drop preference.
- Merchant stock renders as compact cards in a responsive list. The comparison is generated only after clicking a single **Compare** button (for rings, Ring 1 and Ring 2 comparisons are available inside the modal). Gold purchases and stash capacity checks are unchanged.
- Combat now uses top-of-portrait status lanes for both combatants. Empty lanes remain visually reserved but show no `No debuffs` label. Existing enemy Poison/Bleed/Burn/Slow/Sunder/Barrier/Enrage move into enemy lane, and player lane renders current Barrier/Focus/Heat/Soul/Haste/Counters; future debuffs can use the same player component.
- Two-Handed, Bow and Staff were overperforming due to strong generated base stats *and* strong multipliers. Balance changes apply at **combat runtime** and attack rate to all existing and newly generated weapons. No item/save migration needed.

| Weapon | Before speed multiplier | After speed multiplier | Before damage factor | After damage factor |
|---|---:|---:|---:|---:|
| Two-Handed | 0.53 | 0.50 | 1.85 | 1.48 |
| Bow | 1.26 | 1.15 | 1.30 | 1.08 |
| Staff | 0.72 | 0.69 | 1.45 | 1.12 |

Estimated effective damage/sec change holding all other stats equal: Two-Handed ~-24.5%, Bow ~-24.1%, Staff ~-26.0%. Enemy mitigation, crit, damage-over-time procs and mana can alter actual outcomes; no global changes to sword, mace, daggers, wand or affixes. Weapon base stats on saved gear remain untouched.

`npm test` includes neutral affinity UI and combat/merchant regression tests. Browser/mobile visual review still required.
