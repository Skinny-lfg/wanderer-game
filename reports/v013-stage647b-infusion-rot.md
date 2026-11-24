# Stage 6.47B — Infusion-driven Grave Bloom

User-directed candidate: a real paid Arcane Infusion hit applies Rot, deals a burst based on all active Rot stacks on the primary target, then spreads Rot to up to two other active enemies. No old every-three-cast trigger, no extra offhand activation, no consumption of original Rot, no reserve effects. Use existing applyRot scaling and cap, base seed potency 16% SP, copied stack potency 75%, at most three remaining ticks. Raw primary burst cap: 22% normal / 7% elite / 3.5% boss maximum HP before combat modifiers. These numerical values are research parameters, not approved final balance.

| Variant | New Rot | Burst (sum of active stack tick damage) | Copies per other target |
|---|---:|---:|---:|
| baseline | old | old | old |
| one-one | 1 | 100% | 1 |
| two-two-half | 2 | 50% | 2 |
| two-two-full | 2 | 100% | 2 |

- [Native matched experiment](https://github.com/Skinny-lfg/wanderer-game/actions/runs/45361087909): 2 profiles, 4 variants, 4 group sizes, 100 matched combat seeds per cell = 3,200 planned fights. Same legal E10 prepared Grave Bloom characters as Stage 6.47. Instrument actual native tickRot for propagated Rot tick count and raw tick damage independently from secondary damage attribution. No game-source patch outside isolated CI.
- [Candidate contracts](https://github.com/Skinny-lfg/wanderer-game/actions/runs/45361164829): six tests written; do not claim pass until verified.
- No definitive gameplay change yet, no merge/deploy.

## Future E10 test population policy — assisted progression

Avoid survival-selection bias from requiring weak/experimental builds to defeat currently uncalibrated E1–E9 before entering E10 research. Keep two separately labeled cohorts:
1. Assisted capture: fixed, documented temporary difficulty reduction E1–E9 exclusively inside isolated capture runner; unchanged legal talent allocation, earned XP, gear, loot, shop and resources. Start with 30% lower enemy HP/Attack, validate capture coverage and record the actual reduction. Remove assistance completely for E10 native evaluation. Record exact capture source, seed, attempts, points/gear, actual combat fingerprints; never mix assisted and unassisted results as if equivalent.
2. Natural progression: current unmodified difficulty; measure genuine attempts, failure rates, resource accumulation and extraction. Retain failures in denominators. Do not use assisted cohort to validate E1–E9 difficulty.

Use multiple genuinely distinct E10 actors (target at least 5–10 per build where feasible) as well as matched combat seeds, to reduce dependence on two survivors. Preserve existing historical frozen snapshots for paired tests already underway. Any new assisted capture must remain separate from the historical paired matrix. This capture protocol is user-approved, not yet executed or implemented in the simulator; see decision below.


## Verified native results

[Run 45361087909](https://github.com/Skinny-lfg/wanderer-game/actions/runs/45361087909): 18/18 jobs passed, 3,200 native matched E10 encounters, zero timeouts. Two legal E10 actors per profile (Wand + Tome and Staff, 25 points each; Sword + Tome, 37 and 24 points). Same original earned snapshots, talent allocations, gear, XP, enemy roster and combat seeds. The approved assisted-capture protocol has not yet been applied to this matrix.

| Profile / variant | 1 mob | 4 mobs | 8 mobs | 12 mobs |
|---|---:|---:|---:|---:|
| Wand/Staff baseline | 100% | 65% | 16% | 21% |
| Wand/Staff one-one | 100% | 77% | 48% | 42% |
| Wand/Staff two-two-half | 100% | 94% | 74% | 73% |
| Wand/Staff two-two-full | 100% | 98% | 85% | 72% |
| Sword + Tome baseline | 98% | 39% | 0% | 0% |
| Sword + Tome one-one | 100% | 60% | 8% | 25% |
| Sword + Tome two-two-half | 100% | 93% | 65% | 56% |
| Sword + Tome two-two-full | 100% | 96% | 76% | 63% |

Eight-mob results for two-two-full: magical 802 activations, 1,604 new Rot applications, 2,772 propagated stacks, 7,214 actual native propagated Rot stack-ticks, 60,188 raw propagated tick damage before combat modifiers, 25,302 actual primary burst damage. Physical 1,181 activations, 2,362 applications, 4,138 propagated stacks, 11,894 native propagated stack-ticks, 52,964 raw propagated tick damage, 21,494 actual primary burst damage. The number of activations equals the recorded number of Infusion hits. Propagated Rot tick processing is confirmed, but the secondaryDotDamage field remains zero in all profiles. Do not equate raw stack-tick sums with actual effective HP damage; attribution still needs a focused repair.

The two-stack design materially outperforms the one-stack design in this sample. The 100% burst candidate is recommended for further testing, not yet promoted: four-mob wins are high and solo fights also become faster (Wand/Staff mean 13.43s to 8.48s, Sword + Tome mean 24.09s to 15.03s). Validate against eight Elites and six Bosses and a larger independent actor cohort before final balance approval. The 72% vs 73% twelve-mob result is only one win difference, not evidence that the stronger burst is intrinsically worse. Six candidate contracts passed in [run 45361164829](https://github.com/Skinny-lfg/wanderer-game/actions/runs/45361164829). No gameplay promotion, merge or deploy.

## User decision — 2026-11-24

User agreed to the assisted-progression simulator changes described above (E1–E9 temporary reduced difficulty solely for capture, E10 unmodified, independently labeled natural and assisted cohorts, more distinct legal actors). Record as approved simulator work, not an already implemented change. The next capture implementation should be reusable across profiles, record the assistance factor and maintain a clean native E10 replay boundary; retain the existing paired historical snapshots. User asked to review the completed experiment, not yet explicitly to select the final Grave Bloom coefficients.
