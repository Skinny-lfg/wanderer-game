# Wanderer UI Fix Pass

Branch `development` · visual-only changes.

## Corrections

- Chamfer borders remain on a separate masked pseudo-element; panels and dialogs stay unclipped so their outer shadows remain visible. The outline layer now uses border-box sizing to match the panel exactly.
- Dialogs reuse `--ui4-home-stats-bg`. Internal cards and button surfaces were shifted from burgundy/gold-heavy gradients to neutral charcoal; primary buttons have restrained trim and crimson pressed feedback. The illustrated Start Expedition button is unchanged.
- Camp Health keeps its dynamic values and fill, with a fitted 24px track and crimson fill aligned within the frame.
- Merchant and inspection frames now stay square at responsive widths. Apothecary potion art uses a centered 1:1 image area with `object-fit: contain`.

## Screenshots

Chromium captures before and after at 390×844 and 1440×900:

- Camp: [before](v012-ui-fix-pass-screenshots/before/camp-390.jpg) · [after](v012-ui-fix-pass-screenshots/after/camp-390.jpg) · [desktop before](v012-ui-fix-pass-screenshots/before/camp-1440.jpg) · [desktop after](v012-ui-fix-pass-screenshots/after/camp-1440.jpg)
- Affinity / Magic: [before affinity](v012-ui-fix-pass-screenshots/before/affinity-390.jpg) · [after affinity](v012-ui-fix-pass-screenshots/after/affinity-390.jpg) · [before Magic](v012-ui-fix-pass-screenshots/before/magic-element-390.jpg) · [after Magic](v012-ui-fix-pass-screenshots/after/magic-element-390.jpg)
- Merchant / Apothecary: [before Merchant](v012-ui-fix-pass-screenshots/before/merchant-1440.jpg) · [after Merchant](v012-ui-fix-pass-screenshots/after/merchant-1440.jpg) · [before Apothecary](v012-ui-fix-pass-screenshots/before/apothecary-1440.jpg) · [after Apothecary](v012-ui-fix-pass-screenshots/after/apothecary-1440.jpg)
- Item popup: [before](v012-ui-fix-pass-screenshots/before/item-dialog-390.jpg) · [after](v012-ui-fix-pass-screenshots/after/item-dialog-390.jpg) · [desktop after](v012-ui-fix-pass-screenshots/after/item-dialog-1440.jpg)

## Validation

- PASS — `tests/v012-ui-fix-pass.test.cjs` (4 checks).
- PASS — `tests/v012-item-popup.test.cjs` and `tests/v012-global-ui-audit.test.cjs` (5 checks).
- PASS — isolated Playwright/Chromium flows at 390×844 and 1440×900: Camp, initial-affinity/Magic choice, Merchant, Apothecary and equipped-item dialog. Checked square art frames, complete separate chamfer outline, console errors and horizontal overflow.
- A separate legacy UI audit browser script stops on its old expectation for a Shrine artwork placeholder that is absent from the current UI. The targeted browser flow above passed. Safari was not available and remains unverified.

No gameplay, persistence, economy, navigation, Firebase, or account data was changed. No push or deploy was performed.
