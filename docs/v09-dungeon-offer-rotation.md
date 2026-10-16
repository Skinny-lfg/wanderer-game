# Wanderer v0.9 — Automatic dungeon offer rotation (development)

## Design decision
When an expedition ends, whether by full victory, early extraction, or death,
the game automatically generates **three new dungeon path offers** for the
dungeon level that was played.

- Previous three offers and the just-played path are excluded from the next
  set when possible (all current 13 themes support this).
- The current dungeon **level** is preserved for farming; if the run unlocked
  the next tier, the existing automatic advance still applies.
- Selected dungeon **type** is cleared on exit; the first refreshed path
  becomes the default when reopening the Dungeons page.
- Rerolling while preparing for a run remains a **paid Fragment action**.
- Free end-of-expedition refresh resets the paid reroll counter to the base
  cost for the newly offered trio. It does not cost Gold or Fragments.
- The refresh is persisted using existing save fields; no save reset or schema
  migration is required.
- On a mere visit to Dungeons or a reload (without ending a run), the three
  offered paths do **not** reshuffle. This avoids rerolling with page refresh.
- Other dungeon levels retain their own previously cached offers, except
  the tier actually played and refreshed.

The change preserves rune rewards, protected equipment, extraction loot,
existing account/cloud saves, and the separation of `development` and `main`.

## Validation
`tests/v081-smoke.cjs` now checks:
- New three distinct offers after death, victory, early extraction, and D100.
- Cached sets replaced, with previous path excluded.
- Old dungeon tiers remain selected for farming.
- Reload preserves newly generated offers and cleared path.
- Paid rerolls still consume Fragments; free refresh resets base cost.
