# Passive Affinity and Gothic Panel Fixes

**Branch:** `development` · **Base:** `7804a63`

## Corrections

- `options()` now creates its pool only from passives eligible for the completed Realm's affinity. Upgrade, Synergy, Discovery, valid primary-affinity hybrids, ranks, and pair-based hybrid pity remain intact. If the pool has fewer than three cards, only those cards are returned.
- Realm reward creation already passed `plane.family`. During restore, old v3 reward drafts are now filtered to that family; saved picks and build data are unchanged. The isolated checkpoint test covers this compatibility path.
- The panel seam came from a clipped outline pseudo-element combined with `mask-composite`/`-webkit-mask-composite`. Those masks were removed. Main panels and dialogs now share a clipped fill polygon and eight independently drawn CSS stroke segments using the same fixed 11px bevel. The panel host remains unclipped, so its existing outer shadow is preserved. The Camp's illustrated background remains visible.

## Screenshots

Chromium captures compare committed CSS (`before`) with the correction (`after`):

| Viewport | Camp | Item dialog |
| --- | --- | --- |
| 390 × 844 | [Before](v012-ui-fix-pass-screenshots/before/camp-390.jpg) · [After](v012-ui-fix-pass-screenshots/after/camp-390.jpg) | [Before](v012-ui-fix-pass-screenshots/before/item-dialog-390.jpg) · [After](v012-ui-fix-pass-screenshots/after/item-dialog-390.jpg) |
| 1440 × 900 | [Before](v012-ui-fix-pass-screenshots/before/camp-1440.jpg) · [After](v012-ui-fix-pass-screenshots/after/camp-1440.jpg) | [Before](v012-ui-fix-pass-screenshots/before/item-dialog-1440.jpg) · [After](v012-ui-fix-pass-screenshots/after/item-dialog-1440.jpg) |

The browser test also captured the affinity selection dialogs at both sizes.

## Validation

- `tests/v012-buildcraft.test.cjs`: **PASS, 10/10**. Covers all affinities with several affinities unlocked, categories, upgrade-only and hybrid offers, exhausted pools, and save validation.
- `tests/v012-affinity-phase-b.test.cjs`: **PASS, 7/7**, including 1,200 deterministic drafts and restore of an old cross-affinity reward draft without changing saved picks.
- `tests/v012-runtime-integration.test.cjs`: **PASS, 25/25** after refreshing the deterministic trace fixture for the intentional reward-choice change.
- D.7 Endless deterministic comparison: **PASS** with expected traces refreshed for the changed passive choices; no weapon coefficients changed.
- Chromium UI test: **PASS** at 390 × 844 and 1440 × 900. Verified complete panel outline, shared fill/stroke geometry, no mask composite, intact shadow, no horizontal overflow, and working Camp, affinity and item-dialog navigation.
- `npm test`: **PARTIAL, 284/292 passed**. The remaining eight failures were reproduced on the pre-change `HEAD` (`7804a63`): two potion purchase tests, the Forge/Merchant economy test, C.3 Sell All, the Endless high-tier Forge/Rune test, and three equipment/Merchant tests. They are outside this change's touched systems.
- WebKit executable is not installed in this environment; Safari validation remains pending.

## Files in this change

`combat/v012-buildcraft.js`, `online/v012-persistence-runtime.js`, `online/v012-ui4f.css`, `online/v012-ui5-camp.css`, targeted affinity/buildcraft/browser/Endless tests, the deterministic runtime trace fixture, screenshots, and this report.

Pre-existing local modifications to `index.html` and `online/v012-ui4c.css` were not included.
