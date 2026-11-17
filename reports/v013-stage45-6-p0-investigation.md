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

## Reaper’s Cadence: name collision / outdated assumption

The *current prepared* Talent Tree skill is **Reaper’s Cadence**, node ID `septic_wound`. It requires **Bleed + Rot**, deals the sum of one tick of the strongest stack of each (max **4% enemy max HP**) on a **6-second cooldown**, without consuming them.

Separately, the inherited Buildcraft catalog has passive ID `reapers_cadence`, displayed as **Rupture**, requiring **Bleed + Fury Sunder**, dealing two strongest Bleed ticks (max **3% max HP**) on a **5-second cooldown**.

**Verified:** the existing v0.13 Talent Tree still generates `passive_reapers_cadence`, and the native test purchases it along a valid **15-node** route. It is **not** safely described as removed or unreachable. Both distinct runtime activations were covered by successful independent tests in [run 44181827194](https://github.com/Skinny-lfg/wanderer-game/actions/runs/44181827194). The old `v012-affinity-phase-c` fixture assumes a *different* positive-trigger context, which does not prove a v0.13 defect.

**Decision deferred:** whether the intended design keeps *Rupture* as a separate Blood/Fury node or explicitly removes it from new builds. Any removal requires a talent migration/validation decision and must preserve graph topology; do not delete it in an audit-only PR.

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

## Stage 5 verdict

**P0 INVESTIGATION IN PROGRESS; NOT YET CLEARED for Stage 5.** The source-level issue involving two related but distinct Reaper names is now explicit, and the false-negative browser / Veil tests have been corrected. No production code, Firebase service, map layout, balance or player saves were modified by this investigation.
