# Wanderer v0.12 — 24 Normal Mob Roles (visual asset review)

All 24 normal-mob animation **preview PNGs** and attack file names were reviewed. The original GIF files remain unchanged (their frame-by-frame motion was not manually scrubbed). Classification follows depicted armor/body size, claws/leaps versus spell/elemental imagery and the asset attack names. Role is assigned **per creature**, never by its position as the first or second mob in a Realm.

| Realm | Creature A | Role | Creature B | Role |
| --- | --- | --- | --- | --- |
| Venomreach | Blight Mantis | Skirmisher | Spore Toad | Caster |
| Crimson Dominion | Crimson Courtier | Skirmisher | Bloodfang Ravager | Skirmisher |
| Bloodscar Wastes | Sanguine Leech | Skirmisher | Bonewaste Burrower | Tank |
| Gravewind Barrens | Carrion Harrier | Skirmisher | Gravewind Howler | Skirmisher |
| Ironbound Frontier | Chainmaw Brute | Tank | Ironhorn Charger | Tank |
| Ashen Aether | Cinder Hexer | Caster | Aether Wyrm | Caster |
| Umbral Hollow | Hollow Shade | Caster | Grave Lantern | Skirmisher |
| Warded Marches | Sigil Squire | Tank | Bulwark Scarab | Tank |
| Verdant Wilds | Thornback Stag | Tank | Canopy Stalker | Skirmisher |
| Everroot Vale | Rootbound Hermit | Caster | Bloom Wisp | Caster |
| Stormglass Beyond | Shardspark Moth | Caster | Tempest Prism | Caster |
| Drowned Bastion | Barnacle Legionnaire | Tank | Tidebound Shellbeast | Tank |

**Total:** 8 Tank, 8 Skirmisher, 8 Caster.

## Mechanics
- Tank (existing Bruiser profile, renamed): 108% HP, standard ATK/DEF, 1.72s attack, physical.
- Skirmisher (existing profile): 92% HP, 108% ATK, standard DEF, 1.42s attack, physical.
- Caster (conservative new profile): 95% HP, 100% ATK, standard DEF, 1.72s attack, spell.
- Normal Casters launch the **existing wand projectile VFX** in their Realm element (regen → nature). No mana costs, debuffs, heals, elite barriers, extra drop rolls or new RNG calls. The original mob attack GIF still plays.
- Spell attacks use the existing attack-type logic, so physical Dodge does not avoid them. Defense, Block and Barrier still mitigate them. Bosses and Elites are not reclassified, and the Elite Caster's Weakened is unchanged.
- Preserves loot rates, spawn odds, encounter counts, saves and item/affinity rules.

## Balance guard
A deterministic **aggregate proxy** benchmark compares mean HP and estimated outgoing damage per second against the prior 12 Bruiser + 12 Skirmisher mapping, for physical Dodge 0%, 20% and 30%. Differences must be within 3% for HP and 10% for threat. This is a **guardrail, not a complete 10k-run combat simulation**. Run the full suite + browser checks and actual E1/E50/E200 survivability comparisons before considering the game balanced or merging into main. The 21 historical runtime-parity checksum failures predate this change; don't update digests to disguise a behavioral change.

## Native paired simulation audit (2026-10-25)

Run with `node --test tests/v012-normal-mob-balance.test.cjs` (also included in the v0.12 checks). The tool reconstructs the previous role assignment in memory from the current sources; it does **not** edit or inspect actual player saves.

**48 pairs:** four builds (Staff/Cloth, Sword/Plate, Bow/Leather, Daggers/Leather) × E1/E50/E200 × four deterministic seeds. Source engine, gear, runes, RNG seeds, rewards and passive algorithms are identical except for the explicitly changed normal-mob roles and spell attack tags.

| Difficulty | Old mean Realm | Classified mean Realm | Wins old | Wins classified | Total damage taken old → classified |
| --- | ---: | ---: | ---: | ---: | ---: |
| E1 | 15.00 | 15.00 | 16/16 | 16/16 | 480 → 398 |
| E50 | 13.00 | 13.31 | 5/16 | 6/16 | 29,104 → 28,695 |
| E200 | 15.00 | 15.00 | 8/16 | 11/16 | 94,393 → 78,917 |

This shows modest **aggregate** progression differences but noticeable seed-level swings. It is not proof of general population balance. In particular the high-E200 group improved three wins; inspect larger cohorts before future tuning. Unit guardrails: difference of no more than one average Realm, four wins out of 16, or 25% total damage taken per sampled tier.

### Controlled D.7 native simulation rebaseline

The existing D.7 test was written for the old Bruiser/Skirmisher positional assignment; expected values changed because normal mobs now have explicit attack types. For traceability, these are original and updated deterministic triplets `[reached, damage dealt, weapon attacks]`:

| Loadout / E | Previous | Classified |
| --- | --- | --- |
| Staff E200 | 9 / 71033 / 41 | 8 / 53993 / 30 |
| Wand E200 | 9 / 66654 / 37 | 15 / 114864 / 59 |
| Wand E300 | 7 / 96843 / 34 | 10 / 135399 / 48 |
| Sword E200 | 14 / 115192 / 75 | 12 / 99545 / 68 |
| Sword E300 | 13 / 160073 / 67 | 15 / 187769 / 75 |
| Mace E200 | 15 / 99668 / 53 | 15 / 96198 / 50 |
| Mace E300 | 15 / 171032 / 55 | 15 / 170297 / 52 |
| Daggers E200 | 15 / 102570 / 103 | 15 / 98532 / 95 |
| Daggers E300 | 15 / 200525 / 137 | 15 / 191810 / 130 |
| Bow E200 | 15 / 145897 / 144 | 15 / 141937 / 138 |
| Two-Handed E200 | 15 / 112294 / 54 | 15 / 114490 / 52 |

Only the D.7 deterministic reference for this **intentional new combat version** was updated after reproducing every old reference with the prior role mapping and matching seed. The unrelated 21 pre-existing runtime-parity fixture mismatches remain unchanged and must not be disguised.
