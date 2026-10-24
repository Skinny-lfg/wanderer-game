# Wanderer v0.12 — UI/UX final polish (development)

## Scope
No gameplay balancing, economy coefficients, RNG, save schema or Firebase rules changed. No merge to main and no explicit hosting-deploy marker.

## Implementation
- Between Realms: larger equipment layout and Expedition Bag in desktop, retained grid structure and existing shared Rerolls.
- Inventory/Expedition Bag: square slots and contained PNG art. Desktop stat labels and values enlarged; conservative mobile overrides.
- Camp: slightly larger equipment frames on wide desktops; Expedition panel illustration uses a shorter translucent gradient treatment.
- Passives: show one Affinity icon below regular artwork, both data-derived Affinity icons below hybrid artwork.
- Event: after a completed event, its **mandatory passive choice** is still required; completing it now returns immediately to Between Realms via the existing exit transition.
- Initial affinity dialog: closing/escaping before any affinity is chosen cancels the unopened Expedition and returns to Camp. Other dialogs are unaffected.
- Mob portraits: only Bloom Wisp is visually scaled down and Sanguine Leech scaled up, using per-creature CSS selectors.
- New approved Drive assets copied, byte-for-byte, into the existing Gothic large corner and the three existing modular Expedition button parts.
- Existing test assertion updated to match the previously introduced flex layout of the three potion slots. Added focused static regression tests under `tests/v012-complete-uiux-polish.test.cjs`.

## Relevant files
`index.html`, `online/v012-expedition-runtime.js`, `online/v012-uiux-polish.css`,
`tests/v012-unified-gear-potions.test.cjs`, `tests/v012-complete-uiux-polish.test.cjs`,
`assets/ui-kit/gothic-corners/ornate-tr.png`,
`assets/ui-kit/original/hud/03_expedition_left.png`,
`assets/ui-kit/original/hud/04_expedition_center_tile.png`,
`assets/ui-kit/original/hud/05_expedition_right.png`.

## Validation status before integration
The previous HEAD `a29e79f` CI reported 283 passed / 22 failed. 21 failures were runtime-parity checksum mismatches and one was a stale layout assertion. The unit test expectation was updated for the existing flex layout; the parity failures must still be diagnosed separately, without silently accepting changed gameplay checksums.

The new implementation was prepared against the current `development` tree via authenticated GitHub reads. Browser screenshots and new CI execution outcomes remain **unverified** until the new commit is tested. Do not mark the UI visually signed off or release-ready without desktop/mobile screenshots and browser checks.
