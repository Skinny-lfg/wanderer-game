# Inventory & equipment UX — October 2026

Development branch implementation, with no public deployment or save reset.

- **Tier Bonus Changes** in equipment comparisons now lists only affinities whose active tier changes at 2, 3 or 5 pieces. Unchanged tiers are omitted.
- **Set Bonus Progress** on the Equipment/Inventory overview uses 2/3/5-piece milestone rows. Inactive tiers are greyed out but show the actual future bonus stats calculated by the existing set formulas; the next tier is identified. Combat and public loadouts retain existing active-only bonus displays.
- Rings in Stash show explicit **Equip Ring 1** and **Equip Ring 2** actions, each with its own comparison. Replaced rings return to the Stash and no automatic ring slot is chosen.
- With a Two-Handed, Bow or Staff equipped, the Off-Hand slot is reserved; dungeon favored gear icons do not show it as missing, even if a shield/orb exists in Stash.
- Equipping an Off-Hand when Two-Handed/Bow/Staff is equipped now returns the former main-hand weapon to Stash, equips the Off-Hand, and shows a warning in the item comparison. Saves persist both.
- Equipment swaps remain blocked during expeditions; no changes to item rarity, set thresholds, protection rules or cloud save schema.

Test script: `tests/equipment-ux-smoke.cjs`, included in `npm test`.
