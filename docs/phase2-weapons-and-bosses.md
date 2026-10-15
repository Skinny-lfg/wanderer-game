# Wanderer — Phase 2 weapons, elemental combat, boss patterns and animation

Implemented exclusively on `development`. This phase completes the planned high-priority weapon mechanics while retaining the already integrated 13 dungeon backgrounds, 26 mob PNGs, 37 equipment icons, and Tier Bonuses-only combat footer.

## Equipment and saves
- Loot, Forge and Merchant can now create **Two-Handed** main-hand weapons and physical **Off-Hand Dagger** items.
- Two-Handed takes the Weapon slot and reserves Off-Hand. Equipping it returns any displaced Weapon and Off-Hand items to Stash, without deleting them; using an Off-Hand is blocked until switching to another weapon. Equipping a regular main-hand weapon returns the Two-Handed item to Stash.
- Equipment previews, Merchant comparison and Set Bonuses model the mutually exclusive slots; Two-Handed contributes only once. The character/Tavern Off-Hand slot visibly says “2H occupied/locked” while reserved.
- If a legacy save contains a Two-Handed main-hand and another Off-Hand, the latter goes back into Stash on load.
- Existing save key and **SAVE_RESET_VERSION='2026-10-15-combat-balance-reset-2'** are unchanged. No new reset.

## Weapon profiles and balance (testing values)
- Two-Handed: about 2.1× generated weapon base ATK, -2 SPD, 0.53× weapon attack-rate factor, 1.85× heavy strike multiplier, and stronger but less frequent status applications (26% proc; 1.7× DoT scaling).
- Off-Hand Dagger: physical ATK, AGI and SPD; a secondary strike on regular physical attack, with its own 34% affinity proc and 0.65× potency.
- Shield: 13% base + END/tier-based Block Chance, capped at 48%; normal Block mitigates 58% of that hit, increasing to 67% and +7 percentage points with Mace.
- Defense mitigation now diminishes smoothly with a maximum 75% reduction; enemies still deal at least 24% of their basic attack before Shield Block / Barrier. This prevents high-defense permanent immunity. Boss difficulty needs playtesting.
- Generated Staff/Wand remain the **only** casters that consume Mana for spells. Caster fallback basic attacks occur when mana is insufficient. Orbs/Tomes/Charms can amplify a matching element by 30% or occasionally apply a secondary element without consuming Mana. Physical weapons do not cast spells.

## DoTs and status
- Poison/Bleed/Burn application potency now scales from the actual triggering hit (15%/18%/17% baseline per second, respectively), with three-second duration and at most 12 simultaneous stacks per effect.
- Daggers apply smaller effects more frequently; Two-Handed applies stronger effects less frequently.
- Stacks and displayed damage totals use synchronized active stack arrays rather than the former 'potency minus one forever' decay. Existing enemy status HUD continues to display Poison ×N etc.
- Boss shields stop procs when they entirely absorb the main hit.
- Player Barrier generation is capped at 30% max HP (minimum cap 8) to prevent extreme Attack Speed + Shield Set scaling.

## Three boss styles
- D10, D40... **The Abyssal Guardian**: periodic personal barrier restoration.
- D20, D50... **Rift Harbinger**: drains health on landed attacks.
- D30, D60... **Ember Sovereign**: enrages below half HP, dealing 35% more damage.
- Styles rotate every 10 dungeons. Boss reward guarantees Rare+ remain unchanged. Rift/Ember use existing themed monster sprites pending bespoke boss illustrations; this is not final concept art.
- Regular mobs now have modest bruiser/skirmisher HP/attack-speed differences within each dungeon theme.

## Visual
- CSS-only animations for Slash, Smash, Double Slash, Heavy Slash, Bow projectile and elemental spell projectile, plus incoming attacks and Shield Block. Respect reduced-motion settings.
- Character stats under the portrait stay in combat; the lower combat square only shows Tier Bonuses, as already integrated on the latest development version.
- Existing backgrounds for all thirteen dungeons were verified in `assets/dungeons/backgrounds/`; no art regeneration was necessary for this commit.

## Verification
- JavaScript syntax compilation and multiple mocked runtime smoke tests: Two-Handed equip/swap/save, Off-Hand Dagger, magic item generation and casting, Mace + Shield Block, stack scaling/cap/expiry, barrier cap, bosses D10/D20/D30 and rewards, 13 theme/26 mob retention, physical attack+Block execution.
- Reproducible quick tests committed as `tests/phase2-smoke.cjs` (run `node tests/phase2-smoke.cjs`).
- **Remaining QA:** desktop and Safari/iPhone layouts, actual animations, proc probabilities and encounter balance across D10/D20/D30 and high-defense builds. Do not publish to `main` without user review.
