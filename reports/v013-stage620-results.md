# Wanderer v0.13 — Stage 6.20 COMPLETE: six Bosses, native preparation effects

**Date:** 2026-11-21. **PR:** https://github.com/Skinny-lfg/wanderer-game/pull/117. **Final successful native CI:** https://github.com/Skinny-lfg/wanderer-game/actions/runs/44925912083.

## Exact scope and what was executed

**192 matched native player configurations × 4 preparation-effect strategies = 768 genuine Boss combats** across six Affinities and E5/E15/E35/E70 synthetic legal TalentGraph budgets, two strategic builds, and two native target policies (**focus** and **mechanics**). Two independent seed starts per cell. The earlier 384-fight pilot is part of the 768, not additive evidence.

All **192/192 strict preparation and matchup checks passed**: each arm actually spawns the named native Boss for the registered Realm, with the same native rolled Rare gear, build, legal point budget, deterministic seed, Risk 1 Dangerous and Condition. Boss identity, base Boss HP and attack are matched. The one native escort removed by defeating a marked Elite is verified, including optional Gravebound Retinue extra escort behavior. The Reliquary disables exactly one real selected Boss modifier and takes **15% maximum player HP**, confirmed by the difference in native starting HP. The four arms have different **actual** starting HP by design; no fake equal-HP assertion.

**Important limitation:** the Boss is deliberately staged in an accessible first-ring room with legal preparation **decision-ledger effects**. This is **not** a naturally completed 15-room Expedition; neither the effort/cost of killing the marked Elite nor loot, Boons, healing during later exploration, consumables or the natural timing of the Reliquary were simulated. In particular, the Reliquary fee is deducted immediately before the Boss here, which likely understates the value of using it earlier and healing afterwards. Results are a diagnosis of *preparation effects with controlled heroes*, NOT naturally prepared Boss win rates or evidence that the optional decision should be deleted.

## Actual observed Boss victory rates — full 32 native configs per Boss/strategy

| Boss | Neither (unprepared) | Marked Elite | Reliquary (15% HP fee) | Both |
|---|---:|---:|---:|---:|
| Rift Harbinger (Blood) | 2/32 (6.3%) | **5/32 (15.6%)** | 2/32 (6.3%) | 1/32 (3.1%) |
| Carrion Matriarch (Decay) | 1/32 (3.1%) | **3/32 (9.4%)** | 0/32 (0%) | 0/32 (0%) |
| Heartroot Devourer (Vitality) | 10/32 (31.3%) | **12/32 (37.5%)** | 10/32 (31.3%) | 8/32 (25%) |
| The Abyssal Guardian (Aegis) | 8/32 (25%) | **10/32 (31.3%)** | 8/32 (25%) | 8/32 (25%) |
| Ember Sovereign (Fury) | 10/32 (31.3%) | **8/32 (25%)** | 10/32 (31.3%) | 6/32 (18.8%) |
| Stormglass Conductor (Magic) | 6/32 (18.8%) | **8/32 (25%)** | 4/32 (12.5%) | 8/32 (25%) |
| **All Bosses (192 per strategy)** | **37/192 (19.3%)** | **46/192 (24.0%)** | **34/192 (17.7%)** | **31/192 (16.1%)** |

The Marked Elite removed one escort for every tested Boss and netted **17 extra wins versus 8 lost wins** on matched fixtures: modest improvement, not a guarantee of victory. Removing a modifier while **immediately** charging 15% player HP was not a reliable net benefit here: only **2 gained wins vs 5 lost**. *Both* produced 6 gains but 12 losses vs baseline. These are deterministic battle outcomes under different native encounter/RNG paths, not exact individual probabilities or proof the Reliquary design is wrong.

### By E tier — 48 matched Boss configs per strategy and tier

| Controlled tier | Neither | Marked Elite | Reliquary | Both |
|---|---:|---:|---:|---:|
| E5 / 12 legal Talent points | 0/48 (0%) | 0/48 (0%) | 0/48 (0%) | 0/48 (0%) |
| E15 / 24 legal Talent points | 2/48 (4.2%) | 5/48 (10.4%) | 2/48 (4.2%) | 2/48 (4.2%) |
| E35 / 36 legal Talent points | 18/48 (37.5%) | 19/48 (39.6%) | 18/48 (37.5%) | 12/48 (25%) |
| E70 / 60 legal Talent points | 17/48 (35.4%) | **22/48 (45.8%)** | 14/48 (29.2%) | 17/48 (35.4%) |

Risk 1 native Boss at E5: **median Boss HP 752 vs median hero starting HP 205**, and baseline fight duration **10.34s** before defeat. An E5 player can lose before the important 12s Boss timed abilities (Furnace Strike, Ward Cycle and Arcane Convergence) activate. This explains why a blanket change to a late Boss skill is unlikely to fix E5; early Boss challenge may currently be largely a high-HP/high-attack + escort barrier rather than a distinguishable ability encounter. **These are synthetic legal E5 fixtures with Rare gear, not actual earned E5 accounts.**

### Targeting policy control

| Policy | Neither | Marked Elite | Reliquary | Both |
|---|---:|---:|---:|---:|
| Focus Boss | 19/96 (19.8%) | 26/96 (27.1%) | 16/96 (16.7%) | 15/96 (15.6%) |
| Mechanics-aware | 18/96 (18.8%) | 20/96 (20.8%) | 18/96 (18.8%) | 16/96 (16.7%) |

A policy that targets certain Boss minions is not **universally** superior; depends on Blood Vessel/Convergence Anchor/Vitality Mawbud rules and build strength. Do not silently force a winning policy or a single boss-specific exploitation in all agents.

## Stage 6.20 findings and decision

1. **The actual native preparation decisions work correctly and were strictly verified**. There was no evidence of a broken Boss preparation calculation. The Marked Elite's reduction of one Dangerous escort has a meaningful but small effect.
2. **Avoid shipping an ungrounded global Boss nerf** based solely on these first-ring fixtures: E35 and E70 marked-Elite battles are already ~40–46% player-win, within the provisional prepared-Boss difficulty target. Such a nerf could make late Bosses too easy, undermining the Boss > Elite hierarchy established after Stage 6.19.
3. **E5 and E15 need focused work:** in these controlled fixtures Bosses are nearly unwinnable. The six-Boss ranking still puts Decay and Blood as most punishing and Vitality/Fury as comparatively easier. Distinguish enemy HP/Attack/escorts, early survival time and ability activation before individually adjusting.
4. **Reliquary opportunity cost needs a natural route study**, with access to actual healing/consumables between the event and Boss. The immediate-pre-Boss fee fixture is a conservative stress case; no Reliquary cost or effect was modified in gameplay from this incomplete context.
5. **Realistic progression is a blocker:** Stage 6.18 natural-account E1–E2 smoke reached E2 in 0/4 capped accounts. A release-level Boss balance claim requires progressing accounts from E1 with earned gear, Boons, potion stock, and a legitimate reached Boss encounter. Next high-priority task is to fix early natural progression and then retest prepared Bosses. If early Bosses still block naturally equipped players, tune individually at E5/E15 rather than increase/decrease every Boss group-wide.
6. **Stage 6.20 did not change Boss base stats or abilities.** It implemented the missing controlled same-Affinity comparison facility and created a repeatable strict native test suite to support a later, justified change.

## Engineering work completed

- `scripts/simulate-progression.cjs`: backward-compatible optional native Boss Affinity selection in `bossPreparationEncounter`, so the same intended Boss is actually tested under all four native preparation states. Earlier simulator callers retain their previous behavior.
- `scripts/v013-stage620-boss-preparation.cjs`: checked real six-Boss, four-state, two-policy cohort with per-Boss/per-E evidence, source fingerprint, full JSON and Markdown outputs.
- `tests/v013-stage620-boss-preparation.test.cjs` and `.github/workflows/v013-stage620-boss-preparation.yml`: integration guards, native ability tests, 384 pilot + 768 full fights. CI: https://github.com/Skinny-lfg/wanderer-game/actions/runs/44925912083, **SUCCESS**. Raw evidence archived in artifact `stage620-full-768-native-preparation-boss-fights`.
- **Corrected a pre-existing Pages preview mismatch:** `docs/combat/v012-combat-runtime.js`, `docs/online/v013-elite-abilities.js`, and `docs/online/v013-enemy-roster.js` are now byte-identical to their current canonical Stage 6.19 and 6.18 gameplay modules; updated `docs/index.html` cache versions accordingly. The Stage 8.3 Pages equivalence regression that initially failed is now passing. The preview copies were **not** previously updated when Stage 6.18/6.19 were merged.
- No new gameplay Boss values, no normal/Elite rebalancing, no production `main` changes, no Firebase edits, no deploy, no merge into production. This study's conclusion does not claim to have simulated naturally prepared Boss victory rates.
