# Wanderer v0.8.1 — Dungeon QoL, 5-piece Sets, Protected Gear

Status: implemented on `development` only; not published to `main`.

## Dungeon selection
- Manually selecting an earlier dungeon preserves that dungeon level and its chosen path after wins or early extraction, so players can farm repeatedly.
- Clearing the highest unlocked dungeon unlocks and **automatically selects the next level**, including opening fresh path choices for the new level.
- Death also preserves dungeon level and path; selections survive saves, reloads, and account switching.
- Level/path changes and path rerolls continue to behave normally.

## Tier Sets
- Equipment affinity bonuses have thresholds at 2, 3, and now **5** matching items.
- Values at 2 and 3 are unchanged; 5 items grant stronger effects.
- 5-item bonus values: Poison 9, Bleed 9, Sunder 7, Critical +21pp, Shield 9, Regen 7, Fire 7, Frost +48% interval, Dark +45% healing.
- Set displays and equipment comparison correctly show the next threshold, including 4/5 -> 5/5.

## Protected Equipment
- Before each expedition, select **up to two equipped items** for protection in the Dungeons panel. The entry confirmation also permits toggling protection.
- The selection is free; protected equipment stays equipped after death. All unprotected equipped gear and unextracted run rewards are lost as before.
- Choices are saved and restored, and automatically pruned if equipment is changed or removed. Each run snapshots its protected item IDs.
- Existing Stash salvage-locks remain separate from expedition protection.
- Normal dungeon entry confirmation may still be disabled: protection remains available directly in the Dungeons panel.

- Protected Gear selection now displays each item's **D-level, rarity, and affinity name/icon**, including an explicit “No affinity” label, in both selection surfaces.

## Verification
- JavaScript syntax checked before committing; dedicated regression smoke test added to `npm test`.
- No hosting deployment, Firestore rule change, or main branch merge.
