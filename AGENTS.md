# Wanderer — development v0.12 only

## Product
Wanderer v0.12 Expedition. Keep **only current v0.12 behavior** in development. Main and historical backups are independent.

## Rules
- Work on `development` only. Never modify/merge/publish `main`.
- Do not deploy Railway/Firebase, change Firebase rules, read/write real saves, or migrate production accounts without explicit separate authorization.
- No more classic/v0.8–v0.11 feature branches or tests maintained in `development`. Historical material stays in Git history and the owner's backup.
- The current Expedition must retain the 15-Realm, 3–4 events, three shared rerolls, boss and guaranteed 1-of-3 Rune on each victory; Static, 63 passives, equipment and potions; protected isolated saves.
- Do not delete shared native engine functions merely because they are named after old versions. First extract/repoint the current v0.12 callers, test, then remove unused source.
- Retain tests for modern functionality, critical auth/security and save isolation; do not add legacy compatibility requirements back.
- No new features during cleanup; report removed files/dependencies, passing current tests and remaining inline legacy coupling.

## Quality gates
`npm test`, isolated Chromium v0.12 Expedition tests, Save/Reload, E1 boss Rune, bag 6, potion loadout 3, Classic never bootstrapped on the development entrypoint. Use synthetic saves only.

## References
`docs/v012-complete-integration-report.md`, `docs/v012-complete-sim-results.json`, `docs/v012-post-integration-backlog.md`.
