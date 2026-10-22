# Camp layout refinement

**Branch:** `development`  
**Scope:** Camp presentation only; gameplay, equipment and potion behavior are unchanged.

## Changes

- Shifted the Camp backdrop upward and strengthened its lower gradient to keep the taller layout legible.
- Reduced the character artwork uniformly to make room for the compact name and stacked Health/Mana bars above it. The player name is larger; Health appears above Mana.
- Kept the ten equipment slots and three potion slots in the existing panel.
- Limited `Your Journey` to the left-hand column on desktop and tablet, leaving the lower center/right space open. Mobile keeps its existing vertical order.
- Updated the Camp browser checks for the new layout and HUD order.

## Chromium measurements

Character panel dimensions in CSS pixels; portrait measurements are the rendered artwork bounds.

| Viewport | Panel before → after | Portrait before → after |
|---|---:|---:|
| 375×812 | 329×461 → 329×485 | 212×224 → 195×206 |
| 768×1024 | 389×548 → 389×597 | 275×290 → 253×267 |
| 1440×900 | 476×561 → 476×617 | 356×376 → 327×345 |
| 1920×1080 | 476×655 → 476×717 | 356×376 → 327×345 |

The panel grew vertically to fit the HUD row and more evenly spaced slots; the portrait itself is smaller. Tests also covered 360×780, 390×844, 430×932 and 1024×768, checking horizontal overflow, image proportions, slot interactions, and `Your Journey` placement.

## Screenshots

Playwright/Chromium captures use the same synthetic fixture before and after:

- [Camp desktop 1440 before](v012-character-equipment-layout/screenshots/before/camp-1440.png) · [after](v012-character-equipment-layout/screenshots/after/camp-1440.png)
- [Camp desktop 1920 before](v012-character-equipment-layout/screenshots/before/camp-1920.png) · [after](v012-character-equipment-layout/screenshots/after/camp-1920.png)
- [Camp mobile 375 before](v012-character-equipment-layout/screenshots/before/camp-375.png) · [after](v012-character-equipment-layout/screenshots/after/camp-375.png)
- Character crops for 360, 375, 390, 430, 768, 1024, 1440 and 1920 are in the corresponding `before/` and `after/` directories.

## Validation

- `node tests/v012-ui8b-camp-browser.cjs` — **PASS**, 8 viewports (360×780 through 1920×1080).
- `node tests/v012-ui8-camp-browser.cjs` — **PASS**, 5 viewports (360×780 through 1440×900).
- `git diff --check` — **PASS**.
- Safari — not tested.

Browser tests used synthetic data and did not touch real saves. Changes remain local on `development`, without commit or push.
