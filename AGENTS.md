## Current v0.13 checkpoint — Stage 6.11 merged (2026-11-21)

- Canonical development branch: audit/v013-stage6; fetch its **current HEAD** before any further work.
- **Stage 6.11 merged via PR #107 at 536603fe180cd77b7ee3def9d51caaf362ba947d.**
- Retain both Stage 6.10 and Stage 6.11 tooling: legal native v15 TalentGraph target snapshots, 21 agent strategy profiles, adaptive genuine E1 accounts, source fingerprints and independent evidence reports.
- Evidence: 488 structural candidates (280 legal, 208 insufficient points, 0 unresolved); 24 genuinely earned account runs, 164 attempts, 297 combat rooms, 27 Boss fights, 73 Elite fights, 5 Boss victories. Structural budgets are **not** earned builds.
- Historical evidence barrier: only four shared unique seeds in the 24-account campaign, maximum **8** actually earned talent points; no multi-Affinity progression, ability resets or E4–E5 encounters were genuinely observed.
- Do not call high-budget synthetic legal paths realistic player progression. No balance changes were made in Stage 6.11.
- Stage 6.11 test & CI results and exact cohort SHA are documented in reports/v013-stage611-native-results.md.
- Keep one canonical development line and one scoped PR at a time; merge and verify SHA before starting another stage. No production deployment without approval.


---

# Wanderer v0.13 branch governance — 2026-11-21

**Canonical v0.13 integration branch: `audit/v013-stage6`.**
The reviewed consolidation is PR #106, merged at `05aa9237c808f2a3fb7fddcf37b71613986a23f0`.
`main` remains the isolated v0.12 production line. Do not merge v0.13 into `main` or deploy without explicit approval.

## Development rules (v0.13)

- **Never start a new numbered Stage from an old feature/visual/diagnostic branch.** Fetch and verify the HEAD of `audit/v013-stage6` first.
- Avoid accumulating long-lived Stage branches. Prefer one scoped, short-lived PR at a time, merge into the canonical branch after the applicable quality gates, and record its SHA before proceeding to the next Stage.
- Preserve *all* approved v0.13 work already integrated: Stage 6.9's legitimately earned account comparison; Stage 6.10 coverage/benchmarks; the 28 restored original equipment portraits; native hero equipment rendering; current saturated/side-lit character UI and soft contact shadows; Pages mirroring.
- Do **not** blindly cherry-pick or merge divergent historical branches. See `reports/v013-consolidation-preservation-checkpoint.md` for the 31-PR audit and branches still awaiting semantic review.
- For visual changes, keep `online/` and `docs/online/` and `index.html`/`docs/index.html` in intentional parity. Use existing assets; do not regenerate art or discard user-approved revisions without approval.
- For simulator/agent changes, use the live TalentGraph v15 and real rewards/XP/items for earned-account claims. A pairwise design matrix does not count as executed tests. Check source fingerprints, seed replayability, and observed vs synthetic evidence.
- Run focused checks for each change; at consolidation checkpoints, run `npm run test:v013:gate`, `npm run test:v013:stage610`, `node --test tests/v013-character-portraits.test.cjs tests/v013-c8-ui-wiring.test.cjs`, and relevant native/browser workflows. Never call pending/failed tests “passed.”
- No force pushes, deleting historical branches, overwriting player saves, Firebase deploy, or production merge without explicit user instruction. Preserve checkpoint SHAs and write factual validation results.

---

# Wanderer v0.12 release guidance

## Product
Wanderer v0.12 Expedition is the production release. `development` is the integration branch; `main` is the reviewed release branch.

## Rules
- Promote `development` to `main` through a reviewed release pull request. Do not force-push either branch.
- Do not deploy Firebase, change Firestore Rules, read/write real saves, or migrate production accounts unless the owner explicitly authorizes the release operation.
- Keep only current v0.12 behavior in the release. Historical material stays in Git history and the owner's backup.
- Preserve the 15-Realm Expedition, 3–4 events, three shared rerolls, boss and guaranteed 1-of-3 Rune on each victory; Static, passives, equipment and potions; and protected isolated saves.
- Retain tests for current gameplay, authentication/security and save isolation. Use synthetic saves only.

## Quality gates
Run `npm test`, browser tests, Auth/Firestore Rules Emulator tests, Save/Reload, E1 boss Rune, bag capacity, potion loadout and confirm Classic never bootstraps on the v0.12 entrypoint.
