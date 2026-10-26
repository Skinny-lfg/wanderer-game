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

## Wanderer Dev Agent preflight
- At the start of every user task, run the `wanderer-dev-agent` preflight. The enabled plugin also runs `.codex/hooks/user-prompt-submit.mjs` via a trusted `UserPromptSubmit` hook.
- Confirm branch `development`, local working-tree state, Git remote, Firebase CLI/emulator readiness, and Playwright/Chromium availability before editing.
- Verify remote services through their connected integrations: GitHub repository/ref read access and `push` permission; Google Drive profile and a relevant read-only search when Drive is in scope. Never report a service connected based only on local credentials or config.
- Firebase checks and rules tests use the local Emulator Suite with project `demo-wanderer`. Do not run Firebase CLI login or select/deploy to a production project as part of preflight. Do not access real saves.
- Browser screenshots and automated gameplay use the authenticated private-preview wrapper and synthetic browser contexts only. Save screenshots under ignored `test-results/wanderer-dev-agent/`.
- Git writes and pushes require an explicit request for that task, target `development` only, and a verified fast-forward remote head. Never force-push or modify `main`.

## References

## References
`docs/v012-complete-integration-report.md`, `docs/v012-complete-sim-results.json`, `docs/v012-post-integration-backlog.md`.
