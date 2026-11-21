## Current canonical v0.13 checkpoint — Stage 6.14 (2026-11-21)

- Latest merged Stage: **6.14** through PR #110 into `audit/v013-stage6`, merge commit `0745d43493723d608f104aa5baa82a5c51eb0e87`. Always fetch current `audit/v013-stage6` HEAD before starting another stage.
- Stage 6.14 isolates **one real v15-legal Talent node/rank purchase** per native controlled matchup: the baseline has **one unspent point** and the comparison has that one extra point actually invested. Both have the same *synthetic available XP*; do NOT claim equal spent points or naturally earned XP.
- **24 distinct single-node targets (12 first purchases, 12 rank upgrades)**, **six distinct seeds each**, **144 correctly matched pairs / 288 native fights**. A pool of 4,715 legal candidate designs was **not** all executed.
- Pair validation: complete native item roll fingerprint, starting enemy roster, Realm/Risk/Conditions/Boss modifiers, seed, entire other Talent tree, prepared ability, elemental mode, Buildcraft background and fixed focus targeting are equal. Invalid prerequisites/rank chains are not bypassed.
- Corrected final outcomes: 83 pairs both won, 57 pairs both lost, **four gained wins** from adding a node, zero baseline-only wins; gained cases: Unbreakable initial purchase (2), Arcane Focus initial purchase (1), Brace rank 2 (1). Small six-seed cohorts are diagnostic, NOT global ability rankings.
- The initial 22-rank/2-new-node experiment was superseded by 12/12 stratification; do not mix results or count the 18-pair pilot as independent extra fights.
- Final Stage 6.14 dedicated 9-test suite, Stage 6.13 10, Stage 6.12 10, Stage 6.11 8, Stage 6.10 6, full native matrix and key browser/integration/regression workflows passed. Optional older Stage 9.8 high-volume job was still running at gate; do not claim success without checking.
- The production `main` remains **v0.12**, unchanged; no balance coefficients, native game code, art, saves, Firebase or deployments touched.
- Next: repeat suspicious **exact node + enemy** matchups with many more independent seeds and compare mechanic activation, or address the separate native E1 progression bottleneck before late-game balance decisions.

---

## Current canonical v0.13 checkpoint — Stage 6.13 (2026-11-21)

- **Stage 6.13 merged into `audit/v013-stage6` via PR #109**, commit `53fcecffaac3d944f1efb4e3461b60e9abf8e7f1`. Fetch the latest canonical branch head before another Stage.
- Stage 6.13 evidence: **72 identical non-Talent fixture pairs / 144 actual native fights**, comparing 48 current archetypes and 95 distinct v15-valid Talent allocations. A design pool of 3,637 eligible pair options was **not** fully executed.
- Every pair held **exactly the same available and actually spent Talent points**, native gear fingerprint, level, weapon/armor/offhand, Buildcraft background, resolved seed and initial enemy roster. Only native-legal Talent nodes, elemental selection and/or prepared ability changed.
- Results: 39 both won, 28 both lost, 4 only the first won, 1 only the second won; 24 paired Boss matchups, 24 Elite and 24 Normal. All nine Armor × enemy classes had exactly 8 pairs.
- These are **controlled fixtures**; Talent XP, gear acquisition and opponent accessibility are NOT naturally earned E1 progress. The game AI and damage engine are native. Do not conflate with Stage 6.11 earned account history.
- These contrasts isolate **complete node allocation**, not the effect of *one node*. Stage 6.14, if requested, should target legal single-node or single-rank ablations with larger seed cohorts and a fixed, valid budget.
- The Stage 6.13 10-test suite, prior Stage 6.10–6.12 suites and the corrected 72-pair simulation CI passed. Core integration, browser and regression suites passed; the optional older Stage 9.8 deep campaign was still in progress when the merge was checked.
- No gameplay balance changes, production deployment, saves or Firebase operations took place. Keep all previous approved art and Stage 6.11/6.12 evidence; no force-push or multi-branch cherry-pick.

---

## Current canonical v0.13 — Stage 6.12 merged (2026-11-21)

- Work from latest `audit/v013-stage6` HEAD, not an old `audit/v013-stage612-*` snapshot. Stage 6.12 was merged in PR #108 at commit `b51975d2eac48247cccb41501b0dc18cd755de2b`.
- Keep both kinds of simulation **strictly distinct**: Stage 6.11 E1 earned accounts vs Stage 6.12 synthetic-Talent-budget **controlled native combat**.
- Stage 6.12 verified 48 strategic/route archetypes, 121 distinct v15-valid Talent allocations, 142 distinct Talent+native-rolled-gear loadouts, 144 controlled battles (48 each Normal/Elite/Boss), ten matched Off-Hand swaps (20 further native combat executions).
- **Never claim 1,728 planned matrix candidates were executed**. Only 144 sampled scenarios ran. High-tier builds were simulated with *artificial test budgets* rather than naturally earned XP and loot.
- An initial matrix accidentally coupled Plate armor with Boss opponents; it is superseded. Always use the corrected nine Armor × Encounter strata (15–17 observations each) from `reports/v013-stage612-controlled-results.md`. Assert this balance in future sampling code.
- Zero gameplay balance coefficients, production assets, saves or Firebase data were changed in Stage 6.12. Do not infer that 6/48 controlled Boss wins is a population win probability.
- For the next stage, run matched-seed **talent path** comparisons with the same enemy, rolls, equipment and budget. Keep the E1 progression/attainability bottleneck as a separate issue.
- Stage 6.12 core CI and v0.13 release/role/browser/integration tests passed. Optional historical high-volume Stage 9.8 and role large-sample workflows were still queued when the merge was verified; do not claim their results.
- Retain previously approved portraits and all Stage 6.11 data. Keep one canonical line and avoid branch proliferation.

---

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
