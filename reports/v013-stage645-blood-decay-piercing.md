# Stage 6.45 — Blood/Decay actual weapon-hit charge and one-extra-target Piercing

Status: **experimental, no gameplay source changes committed and no deploy**.

## Baseline and scope

Stage 6.44: [weapon AoE lab](v013-stage644-weapon-aoe-lab.md).
The Stage 6.45 runner patches combat modules and simulator diagnostics **only in the ephemeral CI checkout**, not on the gameplay branch. The committed code is the runner, tests and CI. All measurements are native E10 first-ring Blood Risk 1 fights, at most four active foes, with 1/4/8/12 total enemies and reinforcements. Original equipment and XP are earned E10 checkpoints; research talent builds purchase legal prerequisite routes and fill remaining earned points. Compare only paired scenarios using the same actors, XP, gear and enemy roster.

## Candidates

- Bow: current purchased Deep Pierce vs one extra at 80% or 100% damage, one extra at 100% plus native-rank secondary effects, or 90% plus 50% secondary-target Defense penetration and effects. Untalented one-extra Bow uses 66% as an experimental compensation for existing 42% + 24%; **not an approved live value**.
- Secondary status bridge: uses native Bleeding Edge and Toxic Touch rank/chance/coefficients, native bleed/rot scaling and stack caps, actual paid Rot Mana, native Fury Sunder cap. 50% relative chance and 50% potency, with secondary Bleed/Rot cooldowns per target using original cooldown durations; primary cooldowns are untouched. This is a proposed cooldown policy, not evidence of final balance.
- Carrion: charges per target using actual HP loss from direct weapon hits (including physical secondary hits); requires both active Bleed and Rot; no charge from DoT ticks or explosion recursion. Candidate charge thresholds 1.5x or 2.5x Attack Power, burst 0.75x or 1.1x threshold, 1.5s cooldown, 35% of burst to marked target, full burst to other active targets, capped at 25% normal / 8% elite / 4% boss max HP. Optional weakened copied Bleed/Rot on live extra targets; copies flagged as spread. Do not infer balanced boss values from these normal-room tests.
- Carrion and Contagion are both required on legal mixed cohorts; mixed Bow also requires Deep Pierce. No granted talent points.

## Functional gate

[Stage 6.45 functional contract](https://github.com/Skinny-lfg/wanderer-game/actions/runs/45291461612): **success**, five tests. Candidate helper checks native rank gating and relative chance, secondary cooldown/Mana, actual-damage charge and status requirement, nonrecursive secondary handling, selected target preservation, one extra and reserve protection. These are isolated contracts using controlled contexts, not end-to-end balance evidence.

## Preliminary Bow (50 seeds, shard 0)

[Initial run](https://github.com/Skinny-lfg/wanderer-game/actions/runs/45291334937) completed the following Bow jobs before cancellation/restart. Mixed cases hit a runner bug (non-exported planner allocator); the corrected runner uses exported routeTo and native T.allocate. Do not interpret missing mixed jobs as defeats.

| Purchased Deep Pierce variant | 1 mob | 4 mobs | 8 mobs | 12 mobs |
|---|---:|---:|---:|---:|
| Existing 3 extra | 46/50 | 26/50 | 11/50 | 25/50 |
| Single extra 80% | 46/50 | 24/50 | 2/50 | 10/50 |
| Single extra 100% | 46/50 | 25/50 | 5/50 | 13/50 |
| Single extra 100% + native statuses | 46/50 | 33/50 | 9/50 | 17/50 |
| Single extra 90% + penetration + statuses | 46/50 | 30/50 | 6/50 | 17/50 |

Zero timeouts in the above shards. Both characters used Bow with legally purchased Deep Pierce, 36 spent points. These are preliminary 50-seed shards, not an approved balance decision. Need full matched aggregation and activation/first-death diagnostics.

## Corrected matrix

[Stage 6.45 corrected run](https://github.com/Skinny-lfg/wanderer-game/actions/runs/45291521700): 15 planned configurations, each 100 combat seeds per size (6,000 planned fights). Completion and results not yet verified when this checkpoint was recorded. The aggregate explicitly reports any missing/unaﬀordable cohorts and checks matched actor/talent, gear, roster and XP provenance. Compare marks, burst frequency, burst damage, secondary Bleed/Rot applications, first kill timing and survival, not only win rate.

**No merge, no deploy, no production combat balance modification.**

## Final verified results and design decision (2026-11-23)

[Corrected run 45291521700](https://github.com/Skinny-lfg/wanderer-game/actions/runs/45291521700): **32/32 jobs successful; all 15 configurations present; 6,000 matched native fights; zero timeouts.** 100 combat seeds per group, with two earned E10 actors per profile (not 100 independently progressed accounts).

**User design decision:** Bow Piercing with purchased talent is to hit exactly one additional enemy at 100% secondary damage and transport eligible build statuses. Do not restore three extra targets. The untalented coefficient and secondary status tuning still need explicit calibration. This approves the design direction, not a production implementation or release; the current gameplay modules remain unchanged by this lab.

| Bow variant | 1 | 4 | 8 | 12 |
|---|---:|---:|---:|---:|
| Existing | 95% | 54% | 26% | 49% |
| One extra 80% | 95% | 47% | 3% | 18% |
| One extra 100% | 95% | 54% | 13% | 25% |
| One extra 100% + status | 95% | 59% | 17% | 28% |
| One extra + armor penetration + status | 95% | 56% | 11% | 28% |

| Matched mixed build variant | 1 | 4 | 8 | 12 |
|---|---:|---:|---:|---:|
| Sword + Tome current Carrion + Contagion | 100% | 79% | 53% | 66% |
| Sword + Tome fast Carrion + spread | 100% | 92% | 96% | 84% |
| Two-Handed current Carrion + Contagion | 67% | 50% | 46% | 41% |
| Two-Handed status only | 67% | 53% | 47% | 40% |
| Two-Handed fast Carrion + status | 69% | 65% | 52% | 45% |
| Two-Handed heavy Carrion + status | 68% | 61% | 50% | 41% |
| Two-Handed fast Carrion + spread | 69% | 67% | 57% | 51% |
| Mixed Bow current | 75% | 34% | 1% | 4% |
| Mixed Bow one extra 100% + fast Carrion + spread + status | 77% | 57% | 45% | 48% |

Sword + Tome fast spread, 8 foes: 307 bursts, 772 Bleed and 773 Rot spread applications. All compared mixed actors legally own Carrion and Contagion; the mixed Bow actors also own Deep Pierce. Only one Two-Handed actor owns Sweeping Force. The mixed Bow comparison combines several changes and is not an isolated causal estimate of Piercing. Fast-spread Carrion is a promising candidate, not approved balance. The tested secondary bridge covers native Bleeding Edge, Toxic Touch and Fury Sunder; full weapon affix/status coverage remains to be verified.

No merge or deploy. Next: verify elites and bosses under the new player mechanics, complete the orphan talent audit, validate larger independent player-state samples, and only then tune E10 enemy identities and continuous E1–E200 progression.
