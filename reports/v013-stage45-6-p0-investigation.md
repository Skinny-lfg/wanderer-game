# Wanderer v0.13 — Stage 4.5.6 · P0 gameplay investigation

**Scope:** pre-Stage-5 development audit. **Do not merge/deploy**. v0.12 Firebase/live login/save flows untouched.

## Actual P0 baseline

- The full old `npm test` run fails **96/393**; Stage 4.5.6 generated `classification.json` with **28 P0 candidate failures** (16 combat/effects; 12 loot/economy) on the complete runner. This is **28 failing historical expectations, not 28 confirmed bugs**.
- Stage 4.5.6 native/simulation integration gate passed on run [44179634054](https://github.com/Skinny-lfg/wanderer-game/actions/runs/44179634054), with zero **new failing test names** against the old 106-failure snapshot. That alone is insufficient to clear a P0.
- New current-Dungeon tests are installed in the Stage 4.5.6 workflow. Run [44182703457](https://github.com/Skinny-lfg/wanderer-game/actions/runs/44182703457) initially produced **86/87 independent integration checks passing**. Its only new failure was a **test timing error**: Veil already grants its initial Barrier on encounter entry, not on the next tick; the corrected test subsequently passed.

## Verified latest P0 test checkpoint

[Run 44183314589](https://github.com/Skinny-lfg/wanderer-game/actions/runs/44183314589) is **SUCCESS**:

- Current v0.13 gate: **229/229 native tests** + **7/7 simulations**.
- Independently selected current-version P0/integration tests: **89/89 passed**.
- Added current Dungeon probes of dodge, real Oathwall counter and Veil's once-only entry Barrier, including the corrected test expectation.
- Added full *natural boss route* to completion, reward snapshot preservation, one level unlock, merchant eligibility and purchase after extraction, and protection from duplicate awards after a checkpoint restore.
- The historical `npm test` is deliberately still non-blocking in the audit workflow and remains unresolved; 89/89 only describes the selected modern P0/integration tests.
- The Stage 4.5.5 browser release-evidence workflow [run 44183314491](https://github.com/Skinny-lfg/wanderer-game/actions/runs/44183314491) also passed after a **bounded retry of optional naturally generated Oracle offerings** rather than modifying map nodes.

**Conclusion:** no failure in the expanded current-version scenarios; **not** an assertion that all 28 historical P0 cases are harmless.

## Canonical Talent IDs — fixed in the v0.13 development branch

The two skills remain intentionally **distinct** in effect, position and name:

| Name | Canonical ID | Talent node | Trigger | Cooldown | Damage cap |
| --- | --- | --- | --- | --- | --- |
| **Rupture** (Blood/Fury) | `rupture` | `passive_rupture` in the v0.13 permanent graph; `rupture` in v15 native graph | Bleed + Fury Sunder | 5 seconds | 3% enemy max HP |
| **Reaper's Cadence** (prepared Blood/Decay) | `reapers_cadence` | `reapers_cadence` | Bleed + Rot | 6 seconds | 4% enemy max HP |

Former misleading IDs: `reapers_cadence` (formerly Rupture), `septic_wound` (formerly Reaper's Cadence). They were corrected **together** in `combat/v012-buildcraft.js`, `combat/automatic-talents.js` and `combat/talent-graph-next.js`. Both effect hooks, telemetry counters, the catalog, graph IDs and tests now use their matching canonical identities. Names and numerical effects were **not** changed. The old cooldown bookkeeping keys remain internally stable; cooldown behavior still has explicit tests.

**Verified on GitHub:** a current v0.13 test buys `passive_rupture` along its **15-node** path, verifies no duplicate node IDs, a valid connected prepared Reaper's Cadence route, distinct proc conditions and cooldowns, including serialization and damage caps. The new `T.NODES` no longer advertises retired IDs `passive_reapers_cadence` or `septic_wound`.

**Local save caveat:** v0.13 is unpublished and its old local talent/checkpoint snapshots are not migrated by this PR. A pre-fix v0.13 local draft with either old ID may require a fresh local run. **The live v0.12 hosting/login/saves are not modified or deployed.** Do not merge this PR into live until separately approved.

The historical failing test labelled `C reapers_cadence positive trigger…` is now labelled `C rupture positive trigger…` because of the canonical ID; the audit script matches this **exact** legacy-title rename to the same historical failure, without classifying it as a new gameplay regression or suppressing other new failures.

## P0 coverage currently exercised

| Risk group | Evidence | Interpretation |
| --- | --- | --- |
| Reaper’s Cadence / Rupture | `tests/v013-stage45-6-prepared-cadence.test.cjs`, `tests/v013-stage45-6-combat-contract.test.cjs` | Current status gates, cooldowns, caps and purchase route tested; old expectation names remain misleading |
| Normal combat and Extreme E-levels | `tests/v013-stage45-6-encounter-matrix.test.cjs`, `tests/v013-simulation.test.cjs` | 4 current builds × E1/E50/E200, deterministic outcomes and finite values; does not verify all 7 retired D.7 loadouts |
| Dungeon reward/reload | `tests/v013-stage45-6-economy-p0.test.cjs`, `tests/v013-full-expedition-integration.test.cjs` | One-room checkpoint reward state, 24 naturally generated boss routes and state persistence checked |
| Purchases during an active dungeon | `tests/v013-stage45-6-economy-p0.test.cjs` | Merchant native purchase lock checked; not exhaustive for all Forge/Apothecary UI |
| Dodge | `tests/v013-stage45-6-dodge-p0.test.cjs` | Physical hit avoidance API, log, spell/DoT exclusion and 30% cap verified in current Dungeon; complex defense/effect timing still needs coverage |
| Oathwall / Veil | `tests/v013-stage45-6-legendary-p0.test.cjs` | Native Oathwall counter test passed; Veil initial Barrier, applied at encounter entry, verified in run 44183314589 |
| Marked Elite / optional Reliquary / Oracle / boss | `tests/v013-full-expedition-integration.test.cjs`, `tests/v013-boss-preparation-runtime.test.cjs`, `tests/v013-stage45-5-browser.cjs` | Natural map settlements and once-only modifiers exercised; browser Oracle search now retries natural cards to avoid a false failure when an optional Oracle is absent from a single set |

## Still NOT cleared: high-impact legacy P0 clusters

1. **Legendary combat combinations:** Crimson Fang in the offhand, Oathwall interactions with shield mechanics, Veil Barrier absorption and follow-up damage, Second Wind, cooldowns, and affinity scaling of all 12 Legendaries.
2. **Boss/loot economy:** guaranteed boss Runes, full Bag/Stash and overflow extraction, exactly-once claims, safe merchants/Forge/Salvage after a completed Expedition, treasure/RNG odds and Potion of Fortune.
3. **Damage edge cases:** whole-hit dodge bypassing on-hit/defensive procs, Elite debuff clocks, damage accounting and DoT conversion.
4. **Long-game / legacy parity:** E200/Endless Dual Dagger/Staff numerical contracts, attack-speed scaling, multi-mob vs single-target differences. Current 4-build matrix does not cover every old configuration.

A candidate can move from OPEN only when a **named current-version regression test** verifies the corresponding behavior or there is a documented intentionally changed contract and replacement coverage. Do not waive one of the 28 solely due to green broad test runs.

## Stage 5 verdict — development vs. release

**GO for starting Stage 5 simulation infrastructure and offline gameplay development**, provided the latest PR checks stay green. The modern v0.13 mandatory native tests, independent combat/economy P0 tests, map-to-boss tests, and isolated Chromium QA have passed; there are **no confirmed current v0.13 P0 gameplay regressions** in those exercised paths.

**NOT CLEARED for public launch, production save integration or final balancing sign-off.** The original 28 P0 *historical test signals* remain recorded for targeted verification. In particular, before trusting final balance statistics or publishing, verify **full Bag/Stash overflow**, **guaranteed boss Runes and exactly-once claiming**, **Crimson Fang offhand**, **all 12 Legendary affinity/cooldown interactions**, and **dodge/status timing** through current v0.13 fixtures. The 96 historical failures must not be relabelled green.

**Reasoning:** retrofitting the obsolete v0.12 suite before building the stronger v0.13 simulation harness creates unnecessary work and risks changing working gameplay based on retired mechanics. Stage 5 should incorporate the remaining risk cases as new simulation assertions; genuine modern failures found there must be fixed before balance is accepted.

No PR merge, Firebase live login changes, or deployment occurred.
