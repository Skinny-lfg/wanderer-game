# Wanderer — Equipment / Stash / Combat QoL & Balance (2026-10-14)

Branch: `development`. Gameplay and UI text remains in English.

## Implemented

- Click a character equipment slot to filter the Stash by its slot; rings show both ring slots. Click again to clear. Tavern quick-slot shortcuts also filter.
- Remove the redundant "Currently Equipped" strip from Equipment Inventory. The character paper remains the single equipment-slot display.
- Shorten item comparison to two item cards, changed base attributes, estimated Gear Power difference and Set Bonus Changes; remove the second total-stats table.
- Display combat build stats, D&D attributes and active Set Bonuses without an expandable disclosure.
- Show the affinity badge over an expedition-loot item's corner, like the Stash.
- Empty character/Tavern slots use existing icons grayscale with 50% opacity.
- Add Stash capacity: 40 slots initially; upgrade by 10 for Gold. First upgrade 60 Gold, each subsequent upgrade costs 40 more, maximum 300 slots. The number of slots is persisted on existing saves without changing the save-reset version.
- Full Stash blocks new runs, buying and forging until salvaging or upgrading. **Extraction always keeps every loot item even beyond capacity**, showing an overflow notice and requiring resolution before another run. Unequipping never destroys equipment.
- Legendary drop rarity (conditional on an equipment drop) raised from 0.5% to 1.5%; 1 percentage point moved from Common. Merchant still does not offer Legendary and Forge still cannot craft Legendary.
- Catch-up forging improvement: 1.2 percentage points per dungeon-tier gap, max 24 points shifted from Common to Rare (35% of boost) and Epic (65% of boost). Forged item stats remain those of the chosen tier.
- Critical hits: effective crit chance now uses `rawChance / sqrt(max(1, attacksPerSec / 1.3))` with a 65% cap; crit damage x1.5 instead of x1.7. This reduces stacking crit and very high speed while still rewarding fast weapons.

## Checks performed

- JavaScript syntax compilation.
- Mocked JavaScript state/UI checks: old-save capacity migration, upgrades and Gold deduction, odds normalization and no Legendary forging, crit chance under faster attack speed, slot filtering and comparison, always-visible combat stats and loot affinity, full-Stash purchase/craft/run guards, and lossless overflow extraction including Legendary.
- Remaining manual checks: desktop and mobile browser layout, actual clicks, and gameplay balance across D10/D20/D30.

Do not merge to `main` before a user review.
