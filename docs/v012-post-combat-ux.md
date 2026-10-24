# Wanderer v0.12 — Post-combat UX corrections

This change is based on the prepared UI/UX commit `d946523564bd9225045fa85692c90f3ac0912b1c` and is **not** automatically published.

## Three fixes
1. **EXIT REALM immediately accessible after combat:** when the final wave has cleared and the mandatory passive reward is complete, the same single Exit control moves before the arena, with a full-width touch target on mobile. Result screens place their existing Exit/Return button directly under the outcome heading, above metrics.
2. **Realm artwork persists:** use the exact C3 Realm illustration used in combat as the arena background, retaining its gradient. The Realm result and final Expedition result are given the matching last Realm backdrop without mutating result/checkpoint data. If no matching theme can be resolved (legacy data), existing styling is retained.
3. **One death result:** on defeat, keep the existing Realm metrics, rewards, loss accounting, potion return and save transaction, but open only the final Expedition loss summary (`review='summary'`). The intermediate `YOU DIED` Realm screen is skipped. Death is processed once, without extra rewards.

## Verification
Added `tests/v012-post-combat-ux.test.cjs`: validates the one Exit control, action placement, Realm art binding, one button per result, and executes the extracted death transition with a mocked state to verify single processing and final review choice.

This is a detached GitHub commit, not a branch update. GitHub Actions, `npm test`, `npm run test:browser` and visual screenshots are not executed by preparing the commit. The pre-existing runtime parity failures must still be addressed separately. Do not claim release readiness before those runs.
