# Wanderer v0.10.0 — Website backgrounds

**Source:** Google Drive `Wanderer / 02 - Assets / Packs / Wanderer_Website_Backgrounds`

| Use | Desktop | Mobile |
|---|---|---|
| Dungeon combat scene | `assets/backgrounds/dungeon-desktop.webp` · 1600 × 900 | `assets/backgrounds/dungeon-mobile.webp` · 960 × 540 |
| Tavern homepage banner | `assets/backgrounds/tavern-desktop.webp` · 1600 × 900 | `assets/backgrounds/tavern-mobile.webp` · 960 × 540 |

- Use the supplied compressed WebP rather than the archival PNG for faster delivery.
- CSS `background-size: cover` and centered positioning. Mobile swaps assets at 650 px and below; the existing dark overlays preserve text legibility.
- **Dungeon path preview thumbnails remain unchanged.** The new Dungeon Background is the central combat scene backdrop, not the individual dungeon offers.
- Tests check WebP signatures, CSS paths, real browser responsive selection and image-load dimensions in Chromium at 390 px and 1280 px.
- Development only: no merge to main, no Firebase rules changes, no save changes. Release remains subject to visual approval.
