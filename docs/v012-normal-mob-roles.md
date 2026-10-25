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
