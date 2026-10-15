# Wanderer — Equipment, Combat Feedback, Boss Loot and Dungeon Art

Implementation branch: `development`. No changes to `main`.

## UI and inventory
- Item details now place the Equip / Other Ring / Lock / Salvage and Unequip actions directly below the item header (before comparisons).
- Stash items show ▲, ▼ or ≈ for **base-stat weighted value** versus the equipped item in the same slot (not an absolute build upgrade: ignores affinity and set synergies). Empty equipment slots show ▲.
- Merchant cards display the actual currently equipped item (name and icon) and a dedicated side-by-side comparison based on that slot.
- Equipped character slots and Tavern summary slots show item source dungeon level `D#`.

## Combat feedback
- Expedition Log reports actual drain/regen healing, shield barrier gain and damage absorbed, periodic damage and received HP damage.
- Combat HUD updates enemy active statuses: Poison, Bleed and Burn with applied-stack counters; Slow in seconds; and Sunder as current DEF reduction. Applied-stack counts are a lightweight HUD counter, not an overhaul of underlying DoT potency.
- Boss reward on D10, D20, ...: guaranteed one Rare (71%), Epic (25%) or Legendary (4%) piece; 35% chance of an additional normal item; modest Gold / Fragments bonus and increased valuable-drop chance. Item generation uses the forced rarity **before** stats are calculated.

## Dungeons and mobs
- Expanded randomized dungeon theme pool from 10 to 13: Stormglass Spire (Crit), Drowned Vault (Drain), Obsidian Quarry (Sunder), using unique backgrounds.
- All 13 dungeon themes have two assigned PNG 256×256 concept monsters, 26 total; only the themed monster pool is selected for normal encounters. Existing dungeon backgrounds remain unchanged.
- Boss logic remains the Abyssal Guardian at each multiple of 10; newly created mob sprites do not replace the boss artwork.
- `assets/dungeons/dungeon_mob_map.json` documents IDs, sprite paths, affinities and the source pack. Concept artwork may need later polish. Suggested unique attack mechanics for each monster are NOT implemented; existing theme affinity is reused.
- Images are addressed via relative URLs `assets/mobs/...png`, `assets/dungeons/...png`; existing equipment assets are preserved.

## Validation
- JavaScript parses successfully.
- Runtime-mock tests passed: 13 theme ids, 26 unique mob paths, correctly themed enemy selection, boss flag at D10, base UI markers, merchant equipped comparison, guaranteed boss loot and rewards, five debuff types, barrier/healing/regen logs.
- Source art checked: 26 mob PNGs in RGBA 256×256 and 3 backgrounds 1024×576.
- Desktop/mobile browser rendering, actual gameplay balancing and visual polish remain pending user verification.

## Preservation
- Existing save-reset version unchanged; old saves are not intentionally cleared.
- Equipment icon variants, Stash capacity/upgrade feature, and rarity odds from prior development commit remain.
- No merge, publish, force push or `main` changes.
