# Wanderer v0.9.3 — Pre-simulation polish (development only)

Three quality-of-life additions were made **before balance simulations**. This is a development-only update: no main merge, Firebase rules deployment, global leaderboard reset or modification of real player saves.

## Five new character images from Google Drive
Source: Wanderer project packs, updated 2026-10-16.
The Drive preview explicitly maps the portrait files to the existing game IDs:

| Game ID | Updated full-body asset | Face PNG, 256×256 | Drive source face |
|---|---|---|---|
| wanderer | full/wanderer.webp | avatars/wanderer.png | warrior.png |
| ranger | full/ranger.webp | avatars/ranger.png | archer.png |
| knight | full/knight.webp | avatars/knight.png | dark_warrior.png |
| spellblade | full/spellblade.webp | avatars/spellblade.png | old_mage.png |
| duelist | full/duelist.webp | avatars/duelist.png | rogue.png |

All paths above are relative to `assets/characters/`. Full-body WebP files are replaced in place. Face PNG files are added and referenced from the canonical `online/model.mjs` character catalogue and Tavern; equipment/duel portraits continue to use the full-body WebP. The old face WebPs remain as backwards-compatible resources, but the current UI uses PNG. Character IDs, stats, and save selection remain unchanged.

## Inventory filters
- Combine existing Slot filtering with a new **Affinity** dropdown (all 13 affinities, including Crystal, plus No affinity).
- Sort by **Item power (stats)** (weighted base attributes, the existing `baseStatScore` heuristic), Item Level, Date looted or Fragment value; ascending/descending supported.
- Added **Clear filters** and updated the empty-results explanation.
- Bulk salvage, NEW markers, locked gear, slot selection and equipment comparison continue to use the original stash item IDs. Power sorting deliberately sorts raw item-stat power, not simulated win chance or full equipped set synergy.

## D200 completion and safe new attempt
- Finishing/extracting a victorious D200 expedition sets `attemptCompleted=true`. Merely unlocking D200 does **not** finish the attempt.
- Completing D200 returns the player to the Tavern and displays **Start New Attempt** with an explanation of which items/progress reset and which profile and record data survive.
- Dungeon listing and both confirm/start entry points refuse further expeditions after D200 completion, including old previously cleared levels. This remains true across reloads.
- Old saves are migrated non-destructively: historical completed `onlineProgress.deepestCleared>=200` is treated as completed, but `maxDungeon===200` alone is not.
- Clicking Start New Attempt opens the existing Account & Character flow and invokes its already confirmed cloud-safe **Reset Progress** dialog, requiring the user to type `RESET`. It requires a synced account save, preserves nickname/character and existing fastest-D200 personal best in its own leaderboard record; it does not create a second unverified reset path. Guest profiles with synced saves use the same safe account flow.
- The new `newSave()` defaults to `attemptCompleted:false`, so approved resets begin at D1.
- No Firebase schema or security rule changes.

## Validation
`tests/v093-postgame-ui.cjs` is included in `npm test` and checks asset signatures and dimensions, catalogue bindings, D199 to D200 unlock, D200 extraction lock, new-try entry blocking and affinity/raw-item-power filtering. Existing gameplay/online regression suites remain enabled. Run `npm test` after obtaining the development commit, followed by one focused mobile visual smoke before a main release. **Do not treat the new tests as passing until actually executed in a local or CI runner.**
