# Wanderer v0.12 — C.3.1: Legendary + affinity asset integration

**Date:** 2026-10-21 · **Branch:** `development` · **Status:** PARTIAL (first of three asset batches).

## Integrated
- 12 new Legendary images from Drive, bound to the 12 existing `legendaryId` entries; no old Legendary was restored.
- 6 isolated affinity icons: Blood, Decay, Vitality, Aegis, Fury and Magic.
- 3 Magic element choices: Fire, Frost and Lightning.
- Manifest `assets/c3-assets.json` records each Drive source ID and repository path.
- Small-icon layout styles and lazy decoding; the original 13 combat effect sprite glyphs remain functional.
- `tests/v012-phase-c3-assets.test.cjs` verifies every image exists, is PNG and is referenced by the expected ID.

## Deferred
- **C.3.2:** Cloth/Leather/Plate gear art, 30 named assets, removal of truly obsolete equipment from new generation and save-safe fallback for legacy gear. The Drive source art has not yet been replaced with optimized assets (currently 1–2 MB per piece).
- **C.3.3:** the 12 dungeon background images. The Drive originals total roughly **37.4 MB**; the game's existing backgrounds remain in service until web-optimized versions can be integrated.
- Passive images: waiting for artist; original placeholders remain.

**Safety:** No rebalance, no drop-rate changes, no save schema migration, no `main` changes, no Firebase/Railway deploy. Source PNGs remain in Drive. The newly imported Legendary PNGs are around 0.4–0.9 MB each and should be replaced by optimized versions for performance before a public release.
