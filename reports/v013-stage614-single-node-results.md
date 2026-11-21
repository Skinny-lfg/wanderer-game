# Wanderer v0.13 — Stage 6.14 final balanced single-node/rank ablation evidence

**Date:** 2026-11-21  
**Canonical merge target:** `audit/v013-stage6`  
**Implementation PR:** https://github.com/Skinny-lfg/wanderer-game/pull/110  
**Final passing experimental CI:** https://github.com/Skinny-lfg/wanderer-game/actions/runs/44896840431  
**Native game source fingerprint:** `5b271f2e9bd8eeccd888db7426811db6794e4697cebfbf4a0331fcb8bffec921`

## What is actually isolated?

The single difference inside each actual **matched native combat pair** is one **legally repurchased** v15 TalentGraph node or rank. The baseline is a complete valid native Talent state with **one point unused**; the treatment has one additional legally allocated Talent. They have the same *hypothetical available XP budget*, **not the same invested node count**, by design. Requiring equal invested points would force a second changed node and break one-variable isolation.

Both arms keep the same native item roll fingerprint, seed and resolved seed, initial opponent actors and their stats, Realm, Boss modifiers, Conditions, full remaining Talent graph, element mode, prepared ability and fixed player target-policy. The game executes actual combat and can thereafter consume RNG differently because different abilities alter action timing.

All Talent XP/gear/E unlocks are **synthetic controlled fixtures** and must never be described as earned E1–E20 character progress.

## Completed and verified (final balanced cohort only)

| Evidence | Verified result |
| --- | ---: |
| Legal candidate **designs** from 192 native strategy snapshots | **4,715** (not executed fights) |
| Distinct legal one-purchase ablations actually executed | **24** |
| Newly purchased node cases | **12** |
| Legitimate rank-upgrade cases | **12** |
| Native seeded repeats per exact case | **6** |
| Unique scenario seeds across the matrix | **144** |
| Total native matched comparisons | **144** |
| Total native battle executions | **288** |
| Exact non-Talent initial setup checks passed | **144 / 144** |
| Normal / Elite / Boss paired encounters | **48 / 48 / 48** |
| All six Affinities represented | **yes** |
| Talent budgets exercised | **12, 24, 36, 60** |
| Distinct native weapon families sampled | **7** |
| Both arms won | **83 pairs** |
| Both arms lost | **57 pairs** |
| Only the arm with the node purchased won | **4 pairs** |
| Only the baseline with the node unspent won | **0 pairs** |
| Runtime errors / unresolved native fights / pair mismatches | **0** |

The final corrected cohort supersedes two earlier experimental samples: (1) an initial sample built exclusively from existing rank-1 profile allocations, without true rank upgrade coverage; (2) a 24-case first expansion in which **22/24 targets were ranks**. The accepted balanced matrix has **12/12 first-purchase vs rank upgrade cases**, enforced by a dedicated regression test.

The first-pilot numbers from earlier exploratory selections are **not additive** evidence. The final corrected six-case smoke had 18 matched pairs / 36 fights, ten both-win and eight both-loss, and its exact six cases use the same deterministic case selection as the final matrix.

## Three nodes that actually changed a loss into a win

| Node / change | Actual opponent setup | Budget | Baseline wins / six | Purchased-node wins / six | Gained |
| --- | --- | ---: | ---: | ---: | ---: |
| **Unbreakable — initial purchase** | Elite, Decay; Wand + Orb, Plate | 24 | 4 | 6 | **2** |
| **Arcane Focus — initial purchase** | Normal, Vitality; Staff, Leather | 24 | 5 | 6 | **1** |
| **Brace — rank 2** | Boss, Decay; Two-Handed, Cloth | 60 | 1 | 2 | **1** |

**These are not general rankings or evidence for an immediate buff/nerf.** Each skill was observed in one precise full build / level / enemy configuration with six deterministic seeds. That is far too few independently seeded observations to conclude global strength. Other settings, runes, gear traits, prepared ability activations and enemy combinations can change the marginal effect.

## Native secondary metrics

Across 144 matched seed pairs, the number of pairs where the numeric difference exceeded 0.001 was:

| Actual measured metric | Paired differences |
| --- | ---: |
| Native combat duration | 36 |
| End Health fraction | 30 |
| Periodic damage (DoT) | 38 |
| Mana consumed | 22 |
| Generated Barrier | 16 |
| Actual healing | 17 |
| Absorbed Barrier | 17 |

A zero difference in a specific metric or identical win outcome is **not** evidence that the ability is useless. It might affect other stats, have context/trigger requirements, or be irrelevant in the tested encounter. Some combats ended too early for additional ranks to activate.

## Methodological constraints

- **One-point baseline difference is intentional**: one point available but not purchased vs exactly one native legal node/rank purchased. Both are valid TalentGraph states.
- Every attempted removal of a prerequisite, invalid rank chain or prepared ability that would make the state invalid is rejected by the **live native v15** graph. The candidate count excludes duplicates and failed repurchases.
- We isolate an added single-node benefit **conditional on the rest of one existing valid build**, including its prerequisite chain, current attunement and prepared skill. This is not a globally optimal build selection or node-wide estimate.
- Across the six seed repeats, item rolls and native enemy composition may vary. What remains fixed is the setup **within each seed's paired trial**; all six repeats are not identical gear.
- Initial RNG stream seeds are matched within a pair; subsequent random-number consumption can diverge because Talents modify actual combat. Do not claim per-action RNG equality.
- Fixed focus targeting removes the adaptive strategy-policy variable used by previous stages, but it is a particular player targeting assumption, not a complete optimal adaptive agent.
- No potion selection, Boons, full Realm navigation, between-battle inventory upgrades, learned account progress or late-run trait resets were simulated in this specific ablation cohort.
- Do not adjust all Bosses/Elites with arbitrary global multipliers from these numbers. A dedicated larger seeded matched experiment per suspicious node/boss matchup plus natural E1 progression work is still necessary.

## Exact reproduction

Run from the repository root:

- `npm run test:v013:stage614`
- `npm run audit:v013:stage614:plan`
- `npm run audit:v013:stage614:pilot`
- `npm run audit:v013:stage614:matrix`

The final GitHub Actions workflow passed dedicated **9/9 Stage 6.14** tests, prior **10/10 Stage 6.13**, **10/10 Stage 6.12**, **8/8 Stage 6.11**, and **6/6 Stage 6.10** tests, plus native pilot and final 288-fight matrix. The complete final JSON and generated per-node Markdown are preserved in workflow artifact `stage614-24-nodes-144-pairs-288-native-fights`.

**No live gameplay balance edit, no guaranteed loot, no production deploy, no save migration, no Firebase changes.**

## Final merged development checkpoint

- Scoped PR #110: https://github.com/Skinny-lfg/wanderer-game/pull/110
- Merged commit: `0745d43493723d608f104aa5baa82a5c51eb0e87`
- **Exact tree identity** between tested PR and merger: both tree SHA `58d34591c36c050125e94357965b01e96046c3c0`. Approved v0.13 art and all prior Stage 6.11–6.13 features remain preserved.
- Passed final balanced Stage 6.14 CI: https://github.com/Skinny-lfg/wanderer-game/actions/runs/44896840431 — 9/9 Stage 6.14, 10/10 Stage 6.13, 10/10 Stage 6.12, 8/8 Stage 6.11, 6/6 Stage 6.10, the 18-pair pilot and 144-pair native matrix.
- At time of merge the checked Stage 9.7, Stage 5, Stage 4.5.5, Stage 4.5.6, Gravecaller, integration and browser workflows were green; optional Stage 9.8 deep campaign remained in progress and is **not** claimed as passed.
- Production `main` SHA `7cd2a91f03844fe6586f84f11fa45723dd9a6001` was unaffected. No live deploy, balance update, save change or Firebase operation.
- This integration note and AGENTS.md header are documentation-only changes following the already tested commit tree.
