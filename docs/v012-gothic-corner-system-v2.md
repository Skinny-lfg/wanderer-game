# Gothic Corner System v2

Branch: `development`

Status: visual implementation complete; Safari remains unverified.

## Cause and implementation

The previous panels drew their fill with a clipped polygon and assembled the outline from eight independent CSS gradients. Antialiasing and separate geometry caused corner seams and cropped strokes. The new system removes those polygon fills and segmented strokes from the large panels and dialogs. Panels keep their existing dark Home Stats surface, dimensions, shadows, and content; the panel shape is square with a continuous 1px CSS border.

Two transparent Drive assets are now stored in `assets/ui-kit/gothic-corners/`. `online/v012-gothic-panels.js` classifies large windows as ornate and dialogs as standard or ornate by their rendered size. It adds four independent, pointer-transparent images and observes later-rendered UI. Each corner keeps its 1:1 proportions; the left and lower corners use CSS transforms. `online/v012-gothic-panels.css` defines the shared panel styles, responsive image sizes, background preservation, and removal of the old clipped layers. Existing dialog scrolling and positioning are preserved.

## Screenshots

Before and after captures are under `docs/v012-gothic-corners-screenshots/`:

* Camp: `before/camp-390.jpg` → `after/camp-390.jpg`; `before/camp-1440.jpg` → `after/camp-1440.jpg`.
* Small item dialog: `before/item-dialog-390.jpg` → `after/item-dialog-390.jpg`; desktop equivalent at 1440px.
* The after captures also include the Magic Element dialog and City Center/Merchant at 390px and 1440px.

## Validation

* `node tests/v012-ui-fix-pass-browser.cjs` — PASS at 390×844 and 1440×900. Verified all four loaded square PNGs, their mirroring, Standard/Ornate selection, removal of clipped CSS layers, dark fill, shadows, no horizontal overflow, modal rendering, and navigation through Merchant/Apothecary.
* `node tests/ui-gothic-gold-camp-browser.cjs` — PASS at 375×812, 430×932, 768×1024, 1440×900, and 1920×1080; equipment, potion slots, sticky CTA, and navigation remain usable.
* `node --test tests/v012-ui-fix-pass.test.cjs` — PASS, 4/4.
* `npm test` — PARTIAL, 284/292 tests passed. Eight unrelated existing failures remain in five files: potion purchase fixtures, Forge/economy item generation, C.3 treasure rendering assertion, Endless Forge/Rune generation, and Belt/merchant equipment fixtures. The private-preview tests initially hit sandbox loopback `EPERM`; rerunning that file with local loopback permission passed 4/4.
* Safari/WebKit — not available in this validation environment; pending manual/browser validation.

No gameplay, balance, economy, save, Firebase, button, rarity-frame, or scene-background changes were made.
