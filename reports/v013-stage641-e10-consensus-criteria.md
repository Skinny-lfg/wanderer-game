# Stage 6.41 — E10 first, practical balancing consensus

**Status:** agreed design targets; new E10 pilot underway; no balance values accepted from it yet. No merge/deploy.

## Why E10

E10 is the intended reference *only if* real E1-born characters have earned enough gear and usable talents to express distinct Single Target, AoE and hybrid strategies. Do not assume builds are mature merely because they reached E10. Record XP, equipped rarity, gear pieces, affinities, AoE mechanics and the count of genuinely reached accounts.

## Practical targets (directional ranges, not hard per-fight quotas)

| Normal mob group | Deliberately specialized Single Target | Deliberately specialized AoE | Balanced/hybrid |
|---|---:|---:|---:|
| 1 | 90–95% | 55–70% | 75–90% |
| 2 | 80–90% | 65–80% | 70–85% |
| 3 | 70–80% | 75–90% | 70–85% |
| 4 | 55–70% | 80–95% | 65–85% |
| 5+ | 20–45% | 85–95% | 55–80% |

These ranges are **design guidance**, not statistical predictions. A build only counts as AoE-specialized after its actually equipped and earned kit demonstrates meaningful secondary-target damage; lacking AoE at E10 is a maturity finding. Large swarms (8/12+) require separate evaluation and need not achieve exactly the same success rate as 5-mob encounters.

Natural progression (mixed population) targets: normals roughly 80–90%, Elites 60–70%, Bosses 35–45%. For an initial candidate, **±10 percentage points around aggregate targets** is a practical discussion band; individual identities can vary more when their mechanics favour different builds. Prioritize outliers >15 pp instead of microtuning 2–3 pp differences.

## Evaluation gates

1. Source-provenance and 16 E1-born characters; any E10 not reached is **censored**, not a failed E10 fight.
2. At least 8 genuine E10 checkpoints with gear/talents recorded for a useful initial comparison. If fewer, conclude E10 readiness is **not established**, without fabricating endgame loadouts.
3. Separate (a) intended specialization, (b) actual equipped AoE, (c) true secondary-target damage and (d) same-character matched encounters. Avoid causal claims from observational cohort rates.
4. Use fixed E10 Camp snapshots to test 1/2/3/4/5/8/12 mobs and each of 8 Elites and 6 Bosses. Two combat seeds per snapshot in the pilot; increase seeds only for borderline or outlying results.
5. Adjust **individual mob roles, Elite identities and Boss mechanics** around stable E10 reference. Retest enemy hierarchy and player survivability; avoid blanket global nerfs/buffs.
6. Fit one **smooth E1→E10 inverse difficulty curve** using earned player-power checkpoints, gear rarity and unlock timing. Do not introduce E-specific manual plateaus or abrupt special protections that disappear at E2.
7. Validate interpolation with E1/E2/E3/E5/E8/E10 samples, including a no-AoE early character. Preserve the intended Single Target versus AoE tradeoff.
8. Once E1–E10 is stable, sample E20/E35/E70/E200 to verify no later curve collapse. E10 cannot prove E200 is balanced.

## Reproducibility

- Simulator: `scripts/v013-stage641-e10-consensus.cjs`
- CI workflow: `.github/workflows/v013-stage641-e10-consensus.yml`
- 8 predefined profile intents × 2 seeds, first-run fixed checkpoint and 42 controlled fights per actual E10 entrant.
- CI outputs a summary and a full JSON artifact. A passing CI status indicates code execution completed, **not** that target percentages have been achieved.

No gameplay stat changes in Stage 6.41 until the pilot is interpreted and follow-up controls are compared.
