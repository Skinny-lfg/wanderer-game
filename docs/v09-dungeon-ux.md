# Wanderer v0.9 — Compact Affinities and Per-Wave Loot Preview

Branch: `development` only. Do not merge or publish to `main` without explicit approval.

## Dungeon selection
- Dungeon names are displayed without an elemental emoji prefix. The existing elemental affinity remains visible as a separate icon + label.
- Favored equipment is displayed as three small actual equipment images, each with its subtype/category name.
- A gear icon turns red when its slot is empty. For Weapon/Off-Hand, a different subtype also counts as missing; both Ring slots are considered when Ring is favored.
- The old `Wave Loot Odds` table has been removed from the dungeon choice screen.
- Path rotation, fragment-powered rerolls, selected dungeon level, protected gear and old saves are unchanged.

## Expedition and risk/reward
- Entering a dungeon begins at `status=ready`, `enc=0` and without an enemy spawned or timer running.
- In the right-side Expedition panel (stacked on mobile), `Next Wave Rewards` shows the drop chance and conditional Common/Uncommon/Rare/Epic/Legendary odds for the next wave, including Charisma modifiers.
- The player must explicitly press `Start Wave 1` to fight the first encounter.
- After each victory, the game pauses with `Continue · Wave N` and `Extract Now`; the side panel updates to **the next wave's** odds.
- During fighting, the side panel switches to `Current Wave Rewards`, avoiding accidental forward-looking claims.
- Miniboss (wave 4) and chapter boss (wave 5 on D10, D20, etc.) previews are labeled. Boss rewards still include the existing rune choice.
- Reaching the dungeon completion state shows the extraction result rather than non-existent next-wave odds.

No loot weights, drop rarity values, dungeon affinities, persistence format, or save-reset version were changed. Browser/mobile visual QA is still recommended.

## Automated coverage
`tests/dungeon-ui-smoke.cjs` checks visual markup, missing-gear detection, no table in selector, deliberate initial wave start, correct next-wave odds after victory, early extraction and miniboss/boss timing.
