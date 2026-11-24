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

Use multiple genuinely distinct E10 actors (target at least 5–10 per build where feasible) as well as matched combat seeds, to reduce dependence on two survivors. Preserve existing historical frozen snapshots for paired tests already underway. Any new assisted capture must remain separate from the historical paired matrix. This capture protocol is proposed, not yet executed or implemented in the game.
