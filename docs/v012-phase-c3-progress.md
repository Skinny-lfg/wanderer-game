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

## C.3.3 — optimized Dungeon backgrounds
- Integrated 12 desktop and 12 mobile WebP assets from Drive's 10 - Game Ready (WebP).
- Retained all 12 existing dungeon IDs, affinities, enemies, progression and loot.
- Theme-to-image manifest at `assets/dungeons/c3/manifest.json`; browser selects mobile art at widths up to 650px.
- Source PNGs remain preserved in Drive. Still no deployment.

## C.3.2 — optimized armor assets
- 30 WebP assets (Cloth: Astral and Bloodweave; Leather: Nightstalker and Wayfarer; Plate: Dawnward and Ironbound) are mapped for all five armor slots.
- Typed gear selects one of two variants deterministically by existing item ID; no RNG consumption and no save migration. Items without valid armorType retain previous art or placeholder.
- Legacy assets were not physically removed; no authoritative list of removed equipment IDs has been verified, so active item-generation IDs are unchanged for save safety.
