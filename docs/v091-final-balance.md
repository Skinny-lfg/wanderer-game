# Wanderer v0.9.1 — Final targeted balance pass

Branch: development. Compared production-engine simulations using legal equipment. This final pass changes computed Staff/Two-Handed speed only; it does not alter enemy scaling, reward tables, loot odds, saves, or existing item records. No deployment or main merge.

## Approach and choice

Two alternatives were evaluated against the previous v0.9.1 baseline:

1. Permanent speed multipliers: Staff 0.69 to 0.91, Two-Handed 0.50 to 0.70.
2. Selected: a diminishing low-speed catch-up. Staff adds max(0, 0.56 − 0.25 × baseSpeed) to raw attacks/second. Two-Handed adds max(0, 0.43 − 0.25 × baseSpeed). Other weapon families are unchanged.

The selected approach preserves the previous weapon coefficients and the existing attack-speed soft cap beyond 2.5 attacks/second. The bonus smoothly disappears at base speeds of 2.24 (Staff) or 1.72 (Two-Handed). Because the added rate has slope −0.25 until it reaches zero, total raw speed still increases monotonically as gear speed increases. Critical chance continues to use the pre-softcap speed denominator.

The permanent-speed alternative increased D100/D200 power as well, whereas the chosen catch-up improved weaker early/mid builds without changing measured D200 clear rates.

## Before and after — legal equipment

100 seeded trials per scenario, four elite types (25 each), same neutral dungeon theme. Gear is generated through the real equipment generator with legal item affinities. The Epic-3 profile uses all-Epic gear at the dungeon tier and 3 primary affinity points. Mixed-high rotates Rare/Epic/Legendary items across 80/90/100% dungeon tiers with 3 primary affinity points. All simulated dungeons here are multiples of ten, including a boss wave. No runes or interim extraction. Win percentages below are complete dungeon clears.

| Dungeon | Profile | Staff baseline → selected | Two-Handed baseline → selected |
| --- | --- | ---: | ---: |
| D10 | Epic-3 | 40% → 100% | 30% → 100% |
| D30 | Epic-3 | 3% → 74% | 21% → 90% |
| D50 | Epic-3 | 6% → 59% | 24% → 91% |
| D100 | Epic-3 | 94% → 95% | 99% → 100% |
| D200 | Epic-3 | 98% → 98% | 100% → 100% |
| D10 | Mixed-high | 15% → 74% | 16% → 96% |
| D30 | Mixed-high | 0% → 23% | 2% → 59% |
| D50 | Mixed-high | 13% → 28% | 21% → 55% |
| D100 | Mixed-high | 42% → 49% | 51% → 70% |
| D200 | Mixed-high | 84% → 84% | 96% → 96% |

These are scenario-specific results rather than real-world player win probabilities. Staff continues to struggle when gear is mixed, and the patch does not eliminate all progression bottlenecks.

## Three-plus-two vs full five-piece

For a targeted affinity comparison, equal-tier Epic gear with 3 primary affinity points plus a legal 2-point Regen set was compared with a legal 5-point primary set. These are distinct practical builds, not an isolated estimate of the fifth-point proc.

| Dungeon | Weapon | 3+2 clears | 5-piece clears |
| --- | --- | ---: | ---: |
| D30 | Staff | 87% | 69% |
| D30 | Wand | 71% | 35% |
| D30 | Daggers | 90% | 100% |
| D50 | Staff | 72% | 54% |
| D50 | Wand | 94% | 93% |
| D50 | Daggers | 100% | 100% |
| D100 | Staff | 100% | 75% |
| D100 | Wand | 100% | 79% |
| D100 | Daggers | 100% | 77% |

**Decision: no set powers changed.** A 3+2 Regen build can trade specialization for healing and barrier sustain. That makes the five-piece arrangement riskier in certain matchups but is not by itself proof of a broken proc. Further set balancing should compare damage, proc frequency, survival and clear speed across several themes before numerical changes.

## Regression and reproducibility

- index.html and online/pvp-stats.mjs use matching computed-speed formulas.
- Existing Critical, attack-speed soft cap, Mana usage, damage coefficients, rarity, saves and enemy scaling are unchanged.
- Existing targeted speed tests were updated for all seven weapon families, including monotonic capped speed, full formula checks and 1×/4× determinism.
- Run npm test for the normal development suite. Run npm run compare:balance for the 100-seed JSON comparison: baseline, permanent-speed and selected catch-up, including 3+2/5-piece cases.
- The fixed-seed simulation is one theme, hand-selected legal gear profiles, 100 trial seeds and no runes. Sampling uncertainty can approach ±10 percentage points around 50% win rate.

Release recommendation: playtest v0.9.1 on development, especially Staff/Two-Handed D10–D50. Do not infer readiness to merge main or deploy Firestore rules solely from this report.
