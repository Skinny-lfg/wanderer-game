# Between Realms UI refresh

- The v2 shared reroll balance appears once beside “Select the next Realm” (3/3 through 0/3). Each card's button says “Replace Realm”; its existing handler still rerolls only that card. The legacy v1 per-card balance is retained for old runs.
- The selected card has a stronger gold border and a visible Selected label. Enter Realm now follows the Realm cards; Extract & Leave remains secondary.
- The top status panel, heading, and action spacing are tighter. Artwork still uses its existing assets and aspect ratio.

## Validation

- `npm run test:browser`: PASS, including complete Expedition global rerolls, card selection and responsive Inventory/Between Realms at 360, 390 and 430 px. The full browser suite also covered wider layouts.
- `npm test`: 30 suites PASS, 3 suites FAIL (`private-preview`, `v012-runtime-integration`, `v012-unified-gear-potions`). These are previously observed failures; they are not marked as passing.
- Inline game script syntax and `git diff --check`: PASS.
- Captures: [390 px](after-mobile-390.jpg), [1280 px](after-desktop-1280.jpg). Compare with the repository's existing UI audit screenshots.

The browser suite initially exposed a duplicate Enter Realm button from the layout move. It was removed before the successful rerun. No gameplay or save logic was changed.
