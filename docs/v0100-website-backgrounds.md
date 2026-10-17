# Wanderer v0.10.0 — Website backgrounds

**Source:** Google Drive `Wanderer / 02 - Assets / Packs / Wanderer_Website_Backgrounds`

| Use | Desktop | Mobile |
|---|---|---|
| **Entire website/game background** | `assets/backgrounds/dungeon-desktop.webp` · 1600 × 900 | `assets/backgrounds/dungeon-mobile.webp` · 960 × 540 |
| Tavern homepage banner | `assets/backgrounds/tavern-desktop.webp` · 1600 × 900 | `assets/backgrounds/tavern-mobile.webp` · 960 × 540 |

- Use the supplied compressed WebP rather than the archival PNG for faster delivery.
- **Correction after visual feedback:** Dungeon Background covers the entire website, including homepage and surrounding navigation. The previous version applied it only to the combat scene. Tavern Homepage remains in its own banner.
- CSS `background-size: cover` and centered positioning. Mobile swaps assets at 650 px and below; a subtle dark gradient protects text legibility.
- **Dungeon path preview thumbnails remain unchanged.** The new Dungeon Background is the site-wide backdrop and remains inside combat, not a replacement for dungeon offers.
- Tests check WebP signatures, CSS paths, real browser responsive selection and image-load dimensions in Chromium at 390 px and 1280 px.
- Development only: no merge to main, no Firebase rules changes, no save changes. Release remains subject to visual approval.
