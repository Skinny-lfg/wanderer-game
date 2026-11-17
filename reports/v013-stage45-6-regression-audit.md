# Wanderer v0.13 — Stage 4.5.6 · Gameplay regression audit

**Scope:** v0.13 local gameplay only, stacked on Stage 4.5.5 PR #51. No merge, no deploy, no changes to the v0.12 Firebase login/cloud-save production flows.

## Purpose and evidence policy

There are **96 failing tests out of 393 historical `npm test` cases**, as observed on the complete GitHub runner in Stage 4.5.5, versus **106 failures** in the earlier *incomplete checkout* baseline. The reduction by ten **does not prove ten bugs were fixed**: checkout and tests differed.

Do **not** delete tests merely because the v0.13 design changed, and do **not** assume old results are obsolete because `npm run test:v013:gate` passes. Each failure must have a reproducible current behavior, an explicit intentional specification change, or a verified environment/mock explanation before closure.

## What this PR adds

- `scripts/v013-stage45-6-classify.cjs` reads the exact full `npm test` TAP output and cross-references test names to `reports/v013-stage45-3-general-suite-baseline.json` with source file and original failure text.
- Every historical failure gets its **own** risk (P0/P1/P2), suspected category, supporting reason, relevant current test probes and **OPEN** status. Candidate categories are *not* accepted as final diagnoses.
- The script identifies **new failures relative to the baseline by name**, even if the total number of failures decreases; it also reports old tests no longer failing separately.
- The GitHub Action runs the current v0.13 gate and independent critical-area tests, records the unmodified failing historical suite and archives the complete classification as JSON and Markdown.
- No Firebase updates, no player-save migration, no balance changes, no production deployment. The Stage 4.5.6 canonical skill-ID fix is confined to this **unmerged** v0.13 development branch.

## Findings that need real gameplay attention

1. **Combat/affinity triggers (P0):** legacy `reapers_cadence` activation, `oathwall`, `Crimson Fang`, `Veil`, elemental ticks, dodge, offhand weapon rules and attack clocks. These are **not cleared** solely by old harness failures; verify actual current v0.13 effects with deterministic seeds.
2. **Loot/economy (P0):** boss Rune payout, once-only claims, Full Stash/Bag overflow, crafting/merchant locking, drops and extraction economy. Re-run on current v0.13 native/UI flows.
3. **Old mob-count runtime parity (P1):** 21 repeated failures at E1/E50/E200 and seven loadouts reference v0.12 combat parity. Test current v0.13 wave and actual enemy contract, not outdated numerical snapshots.
4. **Drafts/rewards, checkpoints and old fixtures (P1):** many failures have `Cannot read properties of null (reading 'options')`, `Invalid v0.12 save: crafting progress` and `$(...).onclick is not a function`. These suggest old fixtures/mocks, but must be reproduced in the current API before dismissing.
5. **Changed event catalog/version (P2):** an old test demands exactly eight events; the current game introduces Oracle and the old test reports nine. This is a **likely intentional contract change**, not yet proof that the event scheduler and no-duplicate constraints still hold.

## Measured Stage 4.5.6 audit (GitHub Actions)

- [Run 44179634054](https://github.com/Skinny-lfg/wanderer-game/actions/runs/44179634054): **SUCCESS** for current v0.13 gate, independently selected native gameplay integrations and automatic per-test triage. The historical suite itself **continues failing**; the audit workflow intentionally records that nonzero exit without treating it as success.
- Historical failures: **96**, all matched to the old 106-item baseline; **0 new test names**, **10 old failures absent** in the complete checkout. This comparison cannot establish why those ten disappeared.
- Provisional risk classification (all initially **OPEN**, not presumed harmless): **28 P0** combat/economy, **59 P1** stale-route/fixture/parity/other, **9 P2** presentation and event-contract issues.
- Major P0 examples: Reaper's Cadence, Oathwall, Veil, Crimson Fang, dodge, Bag overflow, boss Runes and extraction economy. The remaining cases need reproduction or an explicit documented contract replacement before declaring gameplay risk cleared.
- Targeted modern replacement probes added in this PR:
  - `tests/v013-stage45-6-combat-contract.test.cjs`: **Rupture** requires **Bleed + Fury Sunder**; 5-second cooldown survives serialization; 3% HP cap for normal/Elite/boss.
  - `tests/v013-stage45-6-event-contract.test.cjs`: 9 unique event IDs (8 normal scheduled + optional Forgotten Reliquary), 4 normal event categories with no repeats and old removed events still excluded.
  - `tests/v013-stage45-6-encounter-matrix.test.cjs`: deterministic native E1/E50/E200 outcomes for four current v0.13 build profiles, finite metrics, no encounter timeout.
- **Important:** These new probes do not prove all old combat, economy or seven legacy loadout tests are harmless. They verify current contracts in specifically exercised cases. The historical tests remain untouched.

The full `classification.json`, `classification.md` and raw historical TAP log are archived as a GitHub Actions artifact, with an entry for **every failing test** and its next suggested modern probe.

## Stage 5 decision rule

- Mandatory current v0.13, browser, progression and simulation tests: PASS.
- No known **current P0 gameplay regression** outstanding; P0 legacy suspects must have modern reproduction tests and documented decisions.
- Every historical failure assessed, with explicit evidence for any closed/waived case. Unresolved P1/P2 items can be recorded with owner and risk and separated from gameplay blocking, but should not silently disappear.
- Offline/local development does **not** require fixing authentication, Firebase live integration or cloud saves now; production security is a separate future release gate.

**Updated decision: GO for Stage 5 offline simulation development only, after the mandatory native and browser checks pass.** The legacy 96 cases stay documented, with targeted P0 coverage continued as part of Stage 5. **NO-GO for release, final balance sign-off or Firebase/live integration** until the modern equivalents of outstanding high-risk behavior are checked. See `reports/v013-stage45-6-p0-investigation.md` for the canonical Rupture/Reaper's Cadence IDs, verified checks and remaining P0 concerns.

## Reproduction

```bash
npm ci
npm run test:v013:gate
npm test > reports/stage45-6-regression/npm-test.tap 2>&1
node scripts/v013-stage45-6-classify.cjs
```

Expected output: `reports/stage45-6-regression/classification.json` and `classification.md`, with every historical failing case explicitly open pending verification.
