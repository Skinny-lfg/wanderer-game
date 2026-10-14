# Dungeon background refresh & combat tier-bonus panel — v0.9 concept

Branch `development` only; main is unchanged.

- Combat panel under the battlefield now contains only **Tier Bonuses** (existing `setDetails(stats)`), removing repeated Stats Grid and STR/AGI/INT/END/CHA. The ATK / DEF / Crit / SPD labels directly under the character are preserved.
- The 13 existing dungeon themes now use 13 distinct new WebP environment illustrations, all 1024×576, at `assets/dungeons/backgrounds/{theme-id}.webp`. The same background is used in path-selection cards and combat via `dungeonImage()`.
- Visual direction based on the game's original three embedded splash artworks (poison-green temple, lava-red forge and blue crystalline ruins). Images are dark fantasy environment concept art without UI titles or labels. Four are cropped from a larger four-scene render; the other nine are scene crops from wider compositions and upscaled to the same output size, suitable for prototype testing but not final full-resolution concept masters.
- All previously integrated enemy sprites and old dungeon backgrounds remain present. Current enemy, loot, balance and saved-progress mechanics unchanged (existing one-time reset marker retained).
- Corresponding Drive pack: `Wanderer_Dungeon_Backgrounds_v0_9.zip` and folder `02 - Assets / Wanderer_Dungeon_Backgrounds_v0_9`.
- Checks: 13 paths unique, JavaScript compiles, combat panel includes set bonus only, character stats remain, save version unchanged, assets verified. Visual validation in desktop/mobile browser still recommended.
