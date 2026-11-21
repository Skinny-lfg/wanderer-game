# Wanderer v0.13 — Focused Stage 6.14 retest of Unbreakable, Arcane Focus and Brace rank 2

**Completed:** 2026-11-21  
**Exact canonical starting checkpoint:** `audit/v013-stage6` at `9d5b3a58d195780494d6416498a01fb5bdf337a7`  
**Scoped PR:** https://github.com/Skinny-lfg/wanderer-game/pull/111  
**Final passing CI:** https://github.com/Skinny-lfg/wanderer-game/actions/runs/44897838733  
**Raw GitHub Actions artifact:** `stage614-retest-three-full-288-pairs-576-fights`  
**Native game SHA-256:** `5b271f2e9bd8eeccd888db7426811db6794e4697cebfbf4a0331fcb8bffec921`

## Executive finding

**Unbreakable rank 1 and Arcane Focus rank 1 replicated previously observed win improvements with 32 new independently preselected seeds per enemy matchup, even against different native enemy Affinities and roles. Brace rank 2 did not reproduce its original win-only flip across any of the nine new cohorts, but recorded modest defensive effects under Boss pressure.**

This finding is **strictly conditional on the three exact pre-existing TalentGraph states**, the artificially chosen equipment, the generated enemies and the fixed target policy. It is NOT a global skill ranking, a claim about naturally earned builds, or grounds to alter balance constants yet.

## Native execution audit

| Measure | Verified result |
| --- | ---: |
| Original Stage 6.14 preselected source cases recovered by exact Talent hashes | 3 of 3 |
| Original native-legal baseline/treatment Talent states verified | 6 of 6 |
| Opponent classes × Realm strata actually executed | 9 |
| New independent deterministic seed starts per stratum | 32 |
| Unique fresh seed starts across the complete study | 288 |
| Matched native pairs actually executed | **288** |
| Native combat executions actually completed | **576** |
| All full-gear/starting-roster/seed/condition/rules pairing checks passed | **288 / 288** |
| Both versions won | 145 |
| Both versions lost | 112 |
| Only purchased-talent version won | **31** |
| Only baseline won | **0** |
| Combat timeouts, failed native fixtures or missing pairs | **0** |
| Normal / Elite / Boss paired fights | 64 / 128 / 96 |

The earlier four-seed, nine-stratum pilot ran **36 pairs / 72 native combats**, all valid, with five node-only wins and zero baseline-only wins. **Those 36 paired comparisons are the first four seeds of the final 288, not independent additional evidence.** The prior Stage 6.14 six-seed study is also separate and its wins must not be added to this study's new-seed counts.

## Exact results separated by target and opponent

Baseline and treatment retain the **exact original E level, weapon, armor class, Off-Hand, complete other Talent tree, attunement and prepared skill** for that target. Each target's three opponent groups were registered before knowing the new seed results. Each comparison is a genuine native combat replay of the native opponent, not formula-estimated damage.

| Added node / rank | Native enemy | Baseline wins /32 | With node wins /32 | Gained | Lost | Paired win delta |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| **Unbreakable rank 1** | Elite Decay — original matchup | 19 | 28 | **9** | 0 | +28.1 pp |
| Unbreakable rank 1 | Elite Magic — different Affinity | 29 | 32 | **3** | 0 | +9.4 pp |
| Unbreakable rank 1 | Boss Decay — harder enemy role | 0 | 6 | **6** | 0 | +18.8 pp |
| **Arcane Focus rank 1** | Normal Vitality — original matchup | 20 | 26 | **6** | 0 | +18.8 pp |
| Arcane Focus rank 1 | Normal Decay — different Affinity | 22 | 26 | **4** | 0 | +12.5 pp |
| Arcane Focus rank 1 | Elite Vitality — harder enemy role | 14 | 17 | **3** | 0 | +9.4 pp |
| **Brace rank 2** | Boss Decay — original matchup | 6 | 6 | 0 | 0 | 0 pp |
| Brace rank 2 | Boss Aegis — different Affinity | 5 | 5 | 0 | 0 | 0 pp |
| Brace rank 2 | Elite Decay — different enemy role | 30 | 30 | 0 | 0 | 0 pp |

Across all three enemy strata **descriptively, NOT as one universal estimate**:
- Unbreakable: 48 baseline victories versus 66 with node, **+18 /96** paired flips, zero opposite.
- Arcane Focus: 56 baseline victories versus 69 with node, **+13 /96** paired flips, zero opposite.
- Brace rank 2: 41 versus 41 victories, **0 /96** paired flips.

**Interpretation:** Unbreakable and Arcane Focus reproduced favorable *win changes* under multiple preselected native challenges. Brace rank 2's single prior positive flip among six seeds was **not repeated** among 96 fresh paired replays. That is weak replication evidence for a *win-rate* effect in this fixed build; it does **not** prove the rank has no useful effect or is underpowered.

## Mechanics and secondary metrics (native engine measurements)

The engine recorded actual generated/absorbed Barrier, effective healing, DoT, consumed Mana, remaining HP fraction and fight duration. The sign and magnitude can vary because different Talents alter attack timing and thus status/AI/RNG consumption.

| Change / opponent | Mean extra Barrier generated | Mean extra Barrier absorbed | Mean end-HP fraction difference | Median fight time difference when **both won** |
| --- | ---: | ---: | ---: | ---: |
| Unbreakable / Elite Decay | +27.63 | +14.96 | +0.0011 | 0s |
| Unbreakable / Elite Magic | +7.25 | +2.44 | +0.0003 | 0s |
| Unbreakable / Boss Decay | +76.21 | +65.61 | +0.0006 | not applicable (baseline won 0/32) |
| Arcane Focus / Normal Vitality | 0 | 0 | +0.0813 | **−3.08s** |
| Arcane Focus / Normal Decay | 0 | 0 | +0.0776 | **−3.69s** |
| Arcane Focus / Elite Vitality | 0 | 0 | +0.0412 | **−1.93s** |
| Brace rank 2 / Boss Decay | +2.27 | +2.27 | +0.0068 | 0s |
| Brace rank 2 / Boss Aegis | +3.55 | +3.55 | +0.0072 | 0s |
| Brace rank 2 / Elite Decay | 0 | 0 | +0.0322 | 0s |

**Mechanistic reading, not proof:** Unbreakable's benefit is consistent with increased Barrier and absorption in harder encounters, particularly Decay Bosses. Arcane Focus's effect is consistent with shorter favorable fights and more remaining Health, despite no Barrier changes. Brace rank 2 still produces small Barrier absorption and HP survival differences in Boss fixtures despite no changed victory outcomes. Confirm activations and pathways in additional targeted telemetry before deciding any actual balance change. Comparisons of mean HP end fraction include fights ending in death and therefore can mask defensive benefits.

## Evidence integrity and limitations

1. **The three talents were selected from *previous positive win-flips*.** Regression to the mean, selective discovery and multiple comparisons in the Stage 6.14 screen matter. The follow-up's new seeds are preselected and disjoint but do not erase the selection process.
2. **Controlled XP is not earned:** the baseline has the same hypothetical available points as the node-purchased arm, with **one fewer invested** point. Native Talent validation ensures both legal but full-account E1–E20 progression, earned gear and natural boss access were not tested.
3. **Matched setup is per-seed, not across every seed:** weapon/offhand class and other Talents are fixed for each target, while actual native gear rolls, modifiers and roster can vary between independently seeded fixtures. All 288 before/after paired fixtures passed the full 14 native equality checks.
4. **All three enemy strata differ intentionally:** Boss vs Elite vs Normal and Realm Affinity can change outcomes substantially. Don't pool as a global node win rate or infer enemy-by-enemy balance from 32 seeds alone.
5. **Combat RNG consumption may diverge after the first skill activates** even with matched starting combat seeds; different ability timings are part of the genuine combat treatment.
6. **Only one original full TalentGraph context was tested per target.** Different weapons, prepared abilities, potions, Boons or Affinity mixtures could reverse relative impacts. No universally optimal or deficient skill conclusion follows.
7. **Do not adjust game damage, Boss HP/attack, loot, gear or talent coefficients from this study alone.** Best next step is an ability-activation and enemy-pressure mechanism check for Unbreakable, Arcane Focus and Brace, and a separate improved genuine E1 account progression campaign.

## Validation and reproducibility

- `npm run test:v013:stage614:retest` — 7 tests, all passed
- `npm run test:v013:stage614` — 9 tests, all passed
- `npm run test:v013:stage613` — 10 tests, all passed
- `npm run test:v013:stage612` — 10 tests, all passed
- `npm run test:v013:stage611` — 8 tests, all passed
- `npm run test:v013:stage610` — 6 tests, all passed
- `npm run audit:v013:stage614:retest:pilot` — 72 actual native combats, 36/36 pairs valid
- `npm run audit:v013:stage614:retest:matrix` — **576 actual native combats, 288/288 pairs valid**
- Full native JSON and per-stratum Markdown retained as GitHub Actions artifact `stage614-retest-three-full-288-pairs-576-fights`.

**No gameplay coefficients, enemy data, saved game state, player accounts, UI/art, Firebase or production `main` were changed by the retest.**
