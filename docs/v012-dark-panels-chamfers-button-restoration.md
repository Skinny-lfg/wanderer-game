# UI Refinement — Dark Panels, Chamfers and Button Restoration

Branch: `development`
Status: **PARTIAL** — visual changes implemented and focused Camp/Inventory checks pass; unrelated and stale regression gates remain failing.

## Changes

- Restored button colors, fills, borders, hover states, and radii from the parent of the last visual commit (`c569934`): primary/ghost buttons, Camp navigation, potion slots, and realm/passive offers. The illustrated Expedition CTA continues using its existing PNG assets; no image files changed.
- Replaced clipped host borders with a masked pseudo-element border on Gothic surfaces. The host retains its box shadow and focus outline; the contour follows all four 45° corner cuts.
- Reused the exact Stats surface gradient as `--ui4-home-stats-bg`: `linear-gradient(145deg, rgba(48,43,46,.94), rgba(23,21,25,.92))`. Applied it to main panels and the Camp Stats/Expedition panels. Existing page scenery remains intact; nested cards keep their existing dark fills.
- Applied the chamfer contour to main windows, Inventory/Equipment item frames, Merchant/Forge cards, Between Realms and Combat panels, Shrine/Rune panels, and extraction/result surfaces. Circular indicators, rarity-colored borders, illustrated assets, bars, and ordinary buttons remain as before.

## Screenshots

Captured with Chromium using an isolated local playtest fixture. Before images load the UI CSS from the pre-change Git commit; after images load the working CSS. Viewports: 390×844 and 1440×900.

| Screen | Mobile before / after | Desktop before / after |
|---|---|---|
| Camp | [Before](v012-ui-refinement-screenshots/before/camp-390.png) · [After](v012-ui-refinement-screenshots/after/camp-390.png) | [Before](v012-ui-refinement-screenshots/before/camp-1440.png) · [After](v012-ui-refinement-screenshots/after/camp-1440.png) |
| Inventory | [Before](v012-ui-refinement-screenshots/before/inventory-390.png) · [After](v012-ui-refinement-screenshots/after/inventory-390.png) | [Before](v012-ui-refinement-screenshots/before/inventory-1440.png) · [After](v012-ui-refinement-screenshots/after/inventory-1440.png) |
| Blacksmith | [Before](v012-ui-refinement-screenshots/before/blacksmith-390.png) · [After](v012-ui-refinement-screenshots/after/blacksmith-390.png) | [Before](v012-ui-refinement-screenshots/before/blacksmith-1440.png) · [After](v012-ui-refinement-screenshots/after/blacksmith-1440.png) |
| Merchant | [Before](v012-ui-refinement-screenshots/before/merchant-390.png) · [After](v012-ui-refinement-screenshots/after/merchant-390.png) | [Before](v012-ui-refinement-screenshots/before/merchant-1440.png) · [After](v012-ui-refinement-screenshots/after/merchant-1440.png) |
| Apothecary | [Before](v012-ui-refinement-screenshots/before/apothecary-390.png) · [After](v012-ui-refinement-screenshots/after/apothecary-390.png) | [Before](v012-ui-refinement-screenshots/before/apothecary-1440.png) · [After](v012-ui-refinement-screenshots/after/apothecary-1440.png) |
| Shrine / Runes | [Before](v012-ui-refinement-screenshots/before/shrine-390.png) · [After](v012-ui-refinement-screenshots/after/shrine-390.png) | [Before](v012-ui-refinement-screenshots/before/shrine-1440.png) · [After](v012-ui-refinement-screenshots/after/shrine-1440.png) |

## Validation

- **PASS:** `git diff --check`.
- **PASS:** `tests/ui-gothic-gold-camp-browser.cjs` at 375×812, 430×932, 768×1024, 1440×900, and 1920×1080; includes Camp equipment/potion slots, CTA visibility, navigation, clipping/overflow, and click interactions.
- **PASS:** `tests/v012-ui1-browser.cjs` at 1440×900, 1280×720, 1024×768, 768×1024, 390×844, and 360×800; includes Inventory selection, equipment/potion actions, scroll position, and dialogs.
- **PASS:** `tests/v012-global-ui-audit.test.cjs` (unit test, part of `npm test`).
- **PARTIAL:** `npm test -- --test-concurrency=1`: 24 passed, 7 failed: `private-preview`, `complete-potions`, `economy`, `phase-c3-treasures`, `phase-d-endless`, `runtime-integration`, `v0120-equipment`. These are non-visual suites; no gameplay files were changed.
- **FAIL, reproduced with the pre-change CSS:** `tests/v012-ui0-browser.cjs` reports “realm actions overlap cards at 390”.
- **FAIL, reproduced with the pre-change CSS:** `tests/v012-ui3-browser.cjs` reports “Return to Camp failed”.
- **FAIL:** `tests/v012-ui2-browser.cjs` times out waiting for `.phase3BetweenBag summary`; its selector does not match the current Between Realms view.
- **FAIL, outdated flow expectation:** `tests/v012-global-ui-audit-browser.cjs` expects the former Shrine page after starting an Expedition, while affinity selection now uses a modal.
- Safari was not tested; the visual validation used Chromium.

The screenshot/browser failures above were not changed because they concern existing Expedition flows or outdated selectors, outside this CSS-only refinement.
