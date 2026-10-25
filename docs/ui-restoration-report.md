# UI Restoration & Code Architecture Audit — Results

Branch: `development`
Baseline: `53f5a22`

## Result

**PASS — Chromium and automated regression checks. Safari remains pending.**

Restored a consistent Gothic visual system using CSS and the HTML already in the game. Preserved the approved Start Expedition artwork at its left and right ends; its center tile is clipped inside the button so the pattern does not extend beyond the ends. Retained Camp, dungeon, character, enemy, item, potion, treasure and affinity art.

## Changes

- Consolidated shared surfaces, typography, buttons, focus/disabled/selected states, resource bars and comparison styling in the existing UI stylesheet. Removed nine-slice borders, decorative UI-kit frames, title dividers, comparison badge art and raster rarity frames from active CSS.
- Replaced rarity-frame images with CSS rarity colors/glows on the existing square item frame. Kept item images and rarity labels.
- Removed duplicate panel, resource-bar and rarity sizing rules from the later UI/Camp sheets, and removed dead `border-image` overrides from Inventory.
- Removed the external Google Fonts stylesheet link. The same Grenze and Alegreya Sans font files are served locally by existing `@font-face` rules, so offline/browser tests do not request Google Fonts.
- Updated UI browser tests for the five requested widths and current visual behavior. Corrected the UI.4c fixture to read the existing runtime context and select a non-event route for its passive-specific assertion. Mobile passive cards are checked for overflow rather than equal heights in a vertical stack.

No gameplay, combat, balance, economy, save, Firebase or deploy code changed.

## Files changed

- `index.html`
- `online/v012-ui4.css`
- `online/v012-ui4e.css`
- `online/v012-ui4f.css`
- `online/v012-ui5-camp.css`
- `online/v012-ui6-unified-inventory.css`
- `tests/v012-complete-browser.cjs`
- `tests/v012-global-ui-audit-browser.cjs`
- `tests/v012-typography.test.cjs`
- `tests/v012-ui4-browser.cjs`
- `tests/v012-ui4b-assets.test.cjs`
- `tests/v012-ui4c-browser.cjs`
- `tests/v012-ui4e-browser.cjs`
- `docs/ui-restoration-audit.md`
- `docs/ui-restoration-report.md`
- `docs/ui-restoration-screenshots/` (before/after Chromium captures)

## Visual evidence

Representative before/after screenshots are in `docs/ui-restoration-screenshots/`:

- [Camp, mobile before](ui-restoration-screenshots/before/camp-430.png) · [Camp, mobile after](ui-restoration-screenshots/after/camp-430.png)
- [Camp, desktop before](ui-restoration-screenshots/before/camp-1440.png) · [Camp, desktop after](ui-restoration-screenshots/after/camp-1440.png)
- [Inventory, mobile before](ui-restoration-screenshots/before/inventory-430.png) · [Inventory, mobile after](ui-restoration-screenshots/after/inventory-430.png)
- [Merchant, mobile before](ui-restoration-screenshots/before/merchant-430.png) · [Merchant, mobile after](ui-restoration-screenshots/after/merchant-430.png)
- [Extraction, mobile before](ui-restoration-screenshots/before/extraction-430.png) · [Extraction, mobile after](ui-restoration-screenshots/after/extraction-430.png)
- [Shrine, desktop after](ui-restoration-screenshots/after/shrine-1440.jpg)

The global UI browser checks passed at 375×812, 430×932, 768×1024, 1440×900 and 1920×1080. The UI.4c flow additionally passed at 360×800, 390×844, 768×1024, 1024×768, 1280×720 and 1440×900. UI.4 and potion browser checks passed at 375×812, 430×932, 768×1024, 1440×900 and 1920×1080. Captures are actual Chromium screenshots; no visual testing is claimed for Safari.

## Validation

| Check | Result | Notes |
|---|---|---|
| `npm test` | PASS | 290 tests, 0 failures |
| `npm run test:browser` | PASS | Complete Expedition, Evasion, gear, private preview, C.3 treasures and global UI checks |
| `node tests/v012-ui4-browser.cjs` | PASS | Responsive Gothic controls and bounded CTA artwork |
| `node tests/v012-ui4e-browser.cjs` | PASS | Five viewports, Apothecary purchase, potion use, isolated save/reload |
| `node tests/v012-ui4c-browser.cjs` | PASS | City, Merchant category stock, Camp, passives, Between Realms, extraction and return; six viewports |
| `node tests/v012-global-ui-audit-browser.cjs` | PASS | Shrine and responsive overflow checks; five viewports |
| Asset/style and JavaScript syntax checks | PASS | Local CSS URLs resolve; changed browser scripts parse; `git diff --check` clean |
| Safari/WebKit | PENDING | No real Safari or WebKit validation environment was available |

The complete browser suite writes screenshots into older shared test-output folders; those generated changes were discarded. Only the before/after captures under this report are retained.

## Remaining limitations

- Safari-specific font rendering, `dialog`, focus and touch behavior still needs a real Safari/WebKit pass.
- The retained Start Expedition cap/center artwork remains the sole raster UI-kit dependency. Other decorative UI-kit assets are not reintroduced.
- Before/after captures cover the Camp, Inventory, Merchant and Extraction representative screens; Shrine, Blacksmith, Apothecary, Combat and Between Realms were validated in the browser suites, but not every state has a paired capture.

No `main` changes, merge, push, deploy, Firebase change or real-save write was performed.
