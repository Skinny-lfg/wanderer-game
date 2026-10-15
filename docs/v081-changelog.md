# Wanderer v0.8.1 — Dungeon QoL, 5-piece Sets, Protected Gear

Status: implemented on `development` only; not published to `main`.

## Dungeon selection
- The Dungeons selector uses a rolling window of 9 levels with the selected dungeon centered. For example, D22 shows D18–D26 and unlocking D23 shifts to D19–D27. Newly appearing levels are locked; older ones slide out but remain reachable with Previous/Next pages.
- On mobile the 9 levels are arranged in a 3×3 grid so the selected level is visually central; missing levels at the D1/D100 boundaries are empty placeholders.
- Selecting an earlier dungeon for farming centers that level when reopening the Dungeons screen without changing progress or saved dungeon type.
- Manually selecting an earlier dungeon preserves that dungeon level and its chosen path after wins or early extraction, so players can farm repeatedly.
- Clearing the highest unlocked dungeon unlocks and **automatically selects the next level**, including opening fresh path choices for the new level.
- Death also preserves dungeon level and path; selections survive saves, reloads, and account switching.
- Level/path changes and path rerolls continue to behave normally.

## Loot distribution & two-handed weapons
- Previous loot and Merchant slot selection was uniform among nine physical slots. With two Ring slots this meant Rings = 22.2% combined, Amulet = 11.1%, other slots = 11.1% each.
- New category weights (applied to loot and Merchant, not directly chosen Forge slots): Helm 13%, Amulet 9%, Armor 13%, Gloves 13%, Weapon 15%, Off-Hand 13%, Rings 11% combined (5.5% each), Boots 13%. Overall equipment-drop frequency and rarity probabilities are unchanged.
- Bow and Staff are now **two-handed weapons** alongside Two-Handed Greatsword, reserving Weapon + Off-Hand. Existing saves displace incompatible Off-Hand gear to the Stash; no items deleted. Public loadouts and PvP respect the same equipment restriction.
- Bow: higher base attack and hit strength, fast attack speed, weaker damage per hit than Two-Handed. Staff: heavier magic spell damage than Wand even with a matching Orb, slower casting.
- Existing saved weapon stats are not rerolled; new weapons receive new base values and all Bow/Staff receive the revised combat multipliers and hand rules.

## Tier Sets
- Equipment affinity bonuses have thresholds at 2, 3, and now **5** matching items.
- Values at 2 and 3 are unchanged; 5 items grant stronger effects.
- 5-item bonus values: Poison 9, Bleed 9, Sunder 7, Critical +21pp, Shield 9, Regen 7, Fire 7, Frost +48% interval, Dark +45% healing.
- Set displays and equipment comparison correctly show the next threshold, including 4/5 -> 5/5.

## Protected Equipment
- On the Dungeons screen, **Enter Dungeon** and **Reroll** buttons, together with the normal-dungeon entry preference, appear **above** Protected Equipment to minimize scrolling.
- A prominent red warning next to the entry controls appears with **0/2 or 1/2 items protected** and disappears when **2/2** are protected. This is a warning, not an entry blocker; counts update when a protected item is toggled.
- Before each expedition, select **up to two equipped items** for protection in the Dungeons panel. The entry confirmation also permits toggling protection.
- The selection is free; protected equipment stays equipped after death. All unprotected equipped gear and unextracted run rewards are lost as before.
- Choices are saved and restored, and automatically pruned if equipment is changed or removed. Each run snapshots its protected item IDs.
- Existing Stash salvage-locks remain separate from expedition protection.
- Normal dungeon entry confirmation may still be disabled: protection remains available directly in the Dungeons panel.

- Protected Gear selection now displays each item's **D-level, rarity, and affinity name/icon**, including an explicit “No affinity” label, in both selection surfaces.

## Verification
- JavaScript syntax checked before committing; dedicated regression smoke test added to `npm test`.
- No hosting deployment, Firestore rule change, or main branch merge.
