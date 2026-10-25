# Expedition navigation and primary actions

**Branch:** `development`

**Scope:** Camp navigation and initial affinity presentation. Expedition rules, combat, rewards, saves and economy are unchanged.

## Changes

- Mobile sticky Start Expedition now follows visibility of the original CTA. It hides when that CTA enters the viewport and reappears when it leaves. The sticky includes an Expedition selector synchronized with Camp and invokes the same `phase1Begin` handler, preserving the existing validation path. Its label has no decorative arrow; safe-area spacing is retained. Open dialogs hide the sticky.
- After starting an Expedition, the six initial affinity choices open in a modal over the current page. It reuses the existing affinity cards, icons, passive details and selection handlers. The Shrine illustration was removed from this choice. The modal can close without a choice; the pending screen offers a way to reopen it or return to Camp.
- Primary CTAs use a restrained carmine treatment with discreet gold edges. Secondary and tertiary controls retain their current colors. The illustrated Start Expedition assets remain in place.

## Validation

- `node tests/v012-ui1-browser.cjs` — **PASS**, desktop/tablet/mobile; sticky visibility, mirrored level selection and shared start action verified.
- `node tests/v012-ui3-browser.cjs` — **PASS**, six viewports; modal close/reopen, six affinities, desktop 6-column and mobile 3×2 grids, existing selection behavior and Magic element flow verified.
- `node tests/ui-gothic-gold-camp-browser.cjs` — **PASS**, 375×812, 430×932, 768×1024, 1440×900 and 1920×1080.
- `npm test` — **PASS**, 290 tests.
- `git diff --check` — **PASS**.
- Safari — not tested.

Tests use isolated synthetic browser state and do not access real saves.

## Screenshots

- Camp with mobile sticky: [390×844](v012-expedition-navigation/screenshots/camp-390.png)
- Camp desktop: [1440×900](v012-expedition-navigation/screenshots/camp-1440.png)
- Affinity modal desktop: [1280×720](v012-expedition-navigation/screenshots/affinities-1280.png)
- Affinity modal mobile: [390×844](v012-expedition-navigation/screenshots/affinities-390.png)
