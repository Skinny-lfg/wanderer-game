# Wanderer v0.12 — UI.9 Global UI Assets & Layout Cleanup

**Branch:** `development`
**Result:** PASS (Safari/WebKit pending)

## Changes

- Integrated 48 optimized UI Kit assets under `assets/ui-kit/ui9/`: button states, tab/close/arrow states, navigation icons, five v4 rarity frames, and health/mana HUD frames and liquids. Existing seamless 9-slice artwork was already present, so no duplicate was added.
- Replaced the old rarity set, duplicate item outlines and popup toolkit background. Rarity frames now cover the square item hit area once; item art remains proportional and badges remain legible. Corrected the Stash’s later potion-stack rule that forced rectangular buttons and overrode the rarity-frame geometry.
- Applied the 9-slice only to outer panels. Removed a duplicate inner Camp surface while keeping the Camp scene visible.
- Mapped the new button, tab, close, arrow, navigation and HUD states. Combat health fills use current HP/Mana values, clip inside their frames and expose progress values to assistive technology. Player health is green, enemy health red, and mana blue.
- Moved City Center tabs to the left on desktop and into one compact row on mobile. Enlarged passive and affinity icons while retaining the existing selection actions.
- Removed redundant popup decoration and retained item details/actions. Inventory and Shrine continue to omit the redundant Return to Camp action.
- Consolidated contradictory rules in the existing loaded stylesheets; no stylesheet was added. No game rules or economy code was changed.

## Files

- `index.html`
- `online/ux39.css`, `online/v012-core.css`, `online/v012-ui4.css`, `online/v012-ui4c.css`, `online/v012-ui4e.css`, `online/v012-ui4f.css`, `online/v012-ui5-camp.css`, `online/v012-ui6-unified-inventory.css`
- `assets/ui-kit/ui9/` (45 assets)
- `tests/v012-ui9-global-browser.cjs`
- `docs/v012-ui9-screenshots/` (before/after captures)
- `docs/v012-ui9-global-assets-layout.md`

## Screenshots

Chromium screenshots are synthetic local fixtures. The full state set is captured at 390px and 1440px; assertions ran at all five required viewport widths.

| View | Before | After |
|---|---|---|
| Camp, 390px | [before](v012-ui9-screenshots/before/390/camp.jpg) | [after](v012-ui9-screenshots/after/390/camp.jpg) |
| Inventory, 390px | [before](v012-ui9-screenshots/before/390/inventory.jpg) | [after](v012-ui9-screenshots/after/390/inventory.jpg) |
| City Center, 390px | [before](v012-ui9-screenshots/before/390/city-merchant.jpg) | [after](v012-ui9-screenshots/after/390/city-merchant.jpg) |
| Combat, 390px | [before](v012-ui9-screenshots/before/390/combat.jpg) | [after](v012-ui9-screenshots/after/390/combat.jpg) |
| Camp, 1440px | [before](v012-ui9-screenshots/before/1440/camp.jpg) | [after](v012-ui9-screenshots/after/1440/camp.jpg) |
| Inventory, 1440px | [before](v012-ui9-screenshots/before/1440/inventory.jpg) | [after](v012-ui9-screenshots/after/1440/inventory.jpg) |
| City Center, 1440px | [before](v012-ui9-screenshots/before/1440/city-merchant.jpg) | [after](v012-ui9-screenshots/after/1440/city-merchant.jpg) |
| Combat, 1440px | [before](v012-ui9-screenshots/before/1440/combat.jpg) | [after](v012-ui9-screenshots/after/1440/combat.jpg) |

The before captures use the clean pre-UI.9 `development` tree; after captures use the final CSS and local-only synthetic data.

## Validation

- `npm test`: **PASS**, 290 tests, 0 failures.
- `tests/v012-ui9-global-browser.cjs`: **PASS**, 360×780, 390×844, 768×1024, 1024×768, 1440×900. Checked overflow, state navigation, loaded/proportional rarity assets, all rarity levels, Merchant category counts, City Center tab layout, affinity/passive selection, and HP/Mana fill at 100%, 50%, 10%, and 0%.
- `tests/v012-ui4e-browser.cjs`: **PASS** at 360×800, 390×844, 768×1024, 1280×720, 1440×900; Apothecary purchase, Stash update, potion use, and isolated save/reload round-trip passed.
- Related browser regressions for UI.2, UI.4, UI.4c, UI.4d, UI.8b and C.3 were run during this task and passed. The focused UI.9 and UI.4e runs were repeated after the final square-button correction.
- No horizontal overflow or missing UI.9 assets was detected at the five required widths. Screenshots were visually inspected at 390px and 1440px.

## Pending

- Safari/WebKit could not be run: the WebKit Playwright executable is not installed in this environment. Safari compatibility remains unverified.

No production gameplay, balance, Firebase, real saves, `main`, or deployments were changed.
