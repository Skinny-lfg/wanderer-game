# Wanderer v0.13 — Stage 6: adaptive AoE / single-target / hybrid agents

Status: **implemented and regression-validated, balance conclusions NOT READY**.
Branch: audit/v013-stage6. No merge, deployment, stat/balance change or synthetic inventory/XP/unlocks.

## What changed
- New pure decision module \`scripts/v013-agent-strategy.cjs\`, using **currently equipped** native items, earned v15 talent nodes, chosen element and native active build, rather than just profile names.
- Observable role: AoE, single-target, hybrid, defensive, developing; continuous area, focus and defense scores, with named provenance for each recognized capacity.
- Adaptive Realms use only the three visible cards: boss family, known omen #1, visible condition, risk and favored loot. Unknown omens are never consulted for decisions.
- Adaptive room choices respect genuine paths, steps, visible mob ranges, current health and Bag; a character without earned AoE still avoids dangerous groups. No free rerolls.
- Native target clicks (8-tick minimum interval): Blood Vessel, Stormglass Anchor, Carrion Brood, Heartroot Mawbud avoidance, Gravecaller adds, Thornbloom counterplay.
- Native combat telemetry for Boss/Elite/minion/normal **observed net HP / Barrier losses** and non-focused target losses. These are NOT source-attributed AoE DPS: simultaneous healing, enemy removal, DOTs and reserve changes can bias observations.
- New paired-initial-seed comparison script \`scripts/v013-stage6-agent-comparison.cjs\`: no forced encounters, gear, XP, damage, Boss wins or unlocks.

## Validation
GitHub Actions run: https://github.com/Skinny-lfg/wanderer-game/actions/runs/44766485534
**59 passing, 0 failing tests** (50 prior regression tests + 9 agent tests); no errors during 373 baseline and 362 adaptive natural attempts.
Includes a controlled (NOT natural) actual Two-Handed encounter test that observes real non-focused Cleave damage. Runtime and comparison scripts pass Node syntax checks.

## Paired-initial-seed natural E1–E2 pilot
Seeds 9701–9704; five profiles (Balanced, Plate Warden, Leather Duelist, Magic Lightning, Hexblade Hybrid); 4 accounts per profile, 20 per policy; up to 18 attempts/level, native wins required for E2.

| Metric | Original risk-aware agent | New adaptive agent |
|---|---:|---:|
| Accounts | 20 | 20 |
| Total attempts | 373 | 362 |
| E1 Boss clears (distinct accounts) | 13 | 13 |
| E2 Boss clears (distinct accounts) | 9 | 10 |
| Normal fights: solo | 353 | 341 |
| Normal fights: 2–4 enemies | 183 | 191 |
| Normal fights: 5–12 enemies | 17 | 31 |
| Normal fights: 13+ enemies | 8 | 4 |
| Native simulation errors | 0 | 0 |

### Individual profiles: E1/E2 clears

| Profile | Original | Adaptive | Diagnosis |
|---|---|---|---|
| Balanced | 4/4 → 4/4 | 4/4 → 4/4 | Same clears; 58 vs 50 attempts |
| Plate Warden | 4/4 → 4/4 | 4/4 → 4/4 | Same clears; 51 vs 46 attempts |
| Leather Duelist | 3/4 → 1/4 | 1/4 → 0/4 | **Regression; investigate route/target policy before claiming improvement** |
| Magic Lightning | 1/4 → 0/4 | 3/4 → 2/4 | Encouraging pilot, not proof |
| Hexblade Hybrid | 1/4 → 0/4 | 1/4 → 0/4 | Still low progression |

The new agent changes real room decisions and preserves plausible progression, but **is not universally better** in this sample. Both policies start from the same native account seeds, but different actions alter the subsequent RNG streams/loot/path. Encounters within one account are not independent experimental observations.

### Actual build coverage, not profile names
- Original: 21 combat observations as AoE, 45 as hybrid, 32 as single-target, 236 as defensive, 468 as developing.
- Adaptive: 15 as AoE, **zero as hybrid**, 106 as single-target, 278 as defensive, 436 as developing.
- Therefore this E1–E2 pilot **does not substantiate balance or advantage claims for fully realized hybrid builds**. Absence of actual hybrid observations is a coverage gap, not evidence hybrid builds are bad.
- Non-focused net HP loss is recorded, but is not necessarily proportional to actual DPS advantage.

## Remaining issues before balance
1. Investigate Leather Duelist regression and unexpected absence of naturally realized hybrid capability; use per-account decisions to distinguish target switching, risk/route choices, equipment rarity and RNG divergence.
2. Add controlled paired fights against each of the six Bosses and the distinct Elites using legal builds at the same genuine stats/gear (separate from natural-account progression); specifically AoE vs adds and prepared/unprepared Boss.
3. Compare more seeds and higher Expedition levels only after the previously observed E3 talent-state exception is isolated. Do not hide a native game validity bug behind simulator retries.
4. Measure source-attributed secondary damage in a separate **read-only** combat telemetry hook if exact AoE DPS is needed; current net-delta measure is explicitly approximate.
5. Treat the Stage 6 pilot as policy verification, **not ready for gameplay buffs/nerfs**.

Only audit/v013-stage6 changed. main and production are unchanged.
