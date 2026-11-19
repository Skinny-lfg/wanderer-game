# Wanderer v0.13 — Stage C4 release-gate evidence

**Date:** 19 November 2026  
**Branch:** `audit/v013` (not merged or deployed)  
**Verified source:** `daaba84ea4ca156de6ca5f2df11eca6f9757b5c2`  
**Workflow:** [C4 clean-sheet release gate — run 44606688365](https://github.com/Skinny-lfg/wanderer-game/actions/runs/44606688365)  
**Technical gate:** PASS (4/4 mandatory jobs)  
**Release decision:** **NO-GO until the natural progression bottleneck and remaining obsolete-code scope are reviewed.**

## Mandatory verification

| Job | Result | Grounded coverage |
|---|---|---|
| `current-native` | PASS | 327/327 current v0.13 gameplay cases; 7/7 simulator cases; 89/89 Boss/Elite/combat/agent tests; 85/85 economy, extraction, events and checkpoint cases — **508 passing** |
| `security-account` | PASS | 51/51 save generation, cloud revision, owner-bound restore and account/native checks; 11/11 Firebase Authentication + Firestore emulator rules cases |
| `browser-journey` | PASS | Real Chromium current v15 343-node iframe, Forge, Inventory, Dungeon on 1280px and 390px; mandatory deep Stage 4.5.4 talent purchase/reload, map, combat; mandatory Stage 4.5.5 Oracle, Marked Elite, Boss and extraction/reload |
| `natural-and-source-parity` | PASS | Real native-account bounded progression with no forced gear/XP/unlocks, no test crashes; `npm run build:pages` regenerated zero changes against tracked `docs/` |

The native gate initially exposed stale pre-clean-sheet tests expecting historical 15-Realm checkpoint restoration, an old local-save key, and manual attribute allocation. These assertions were corrected to verify the deliberate rejection of old checkpoints and absence of the removed API. A Stage 8.2 test was then updated to verify the **existing** shared charged-strike damage cap instead of a deleted inline expression. Gameplay coefficients were not modified.

**Browser evidence:** [C4 Chromium screenshots and logs](https://github.com/Skinny-lfg/wanderer-game/actions/runs/44606688365/artifacts/14568689666)  
**Natural-account evidence:** [Native-account JSON and Markdown](https://github.com/Skinny-lfg/wanderer-game/actions/runs/44606688365/artifacts/14570512923)

## Natural-account progression: observed, not fabricated

The agents choose actual equipment, paths, optional contracts and fights. They may extract or die instead of winning; no forced loot, talents, combat deaths or level unlocks.

| Cohort | E1 attempts | E1 victories | Reached E1 boss | Extracted | Died | Higher Expedition progress |
|---|---:|---:|---:|---:|---:|---|
| 2 seeds × Cautious/Balanced | 32 | **0** | 3 | 24 | 8 | None reached E2 |
| 1 seed × Daring | 9 | **1** | 1 | 5 | 3 | E2 reached |

For the Daring account, there were **12 further E2 attempts**, with **zero E2 victories**, 2 Boss visits, 9 extractions and 3 deaths. The E1/E2 observations are real outcomes of the current native simulation, but the small sample and unvalidated agent policies **do not establish a gameplay balance verdict**. The large proportion of early extractions may reflect agent risk thresholds or map decisions, or underlying difficulty. Inspect per-attempt choices and rewards before changing balance.

**E5, E10 and E20 were not reached.** Both workflows supported higher horizons, but actual account progression was censored by E1/E2. Never report these levels as 0%-win-rate samples.

## What the gate does *not* prove

- No real production Firestore users or sessions were changed or tested. Firebase security testing used isolated emulators and current save/cloud fixture logic.
- No historical saves are required or migrated; `saveGeneration:'c2-clean-sheet'` continues to intentionally reset the profile on login after deployment, with original user account identity retained.
- The old `combat/automatic-talents.js` golden-master fixture and obsolete non-Dungeon route generator are still present in source/tests. They are not part of the active v15/Dungeon gameplay flow but should be pruned only after current reference/reachability analysis, not blindly.
- Earlier pre-v0.13 treasure tests remain 3/5 failing because of retired historical expectations. They are diagnostic only, not included in the 508 current passing native tests.
- Browser coverage is deep but not an exhaustive run for every affinity, weapon/armor build, viewport or combat seed. Natural-agent simulations have not calibrated player behavior, class/focus/hybrid distribution, respec patterns or E5–E20 completion times.

## Release decision and recommended sequence

**C4 test implementation and verification are complete. The clean-sheet release remains NO-GO as a gameplay-quality signoff, not because the four CI jobs failed.** Before merge/publication:

1. Investigate why Cautious/Balanced extract before Boss (3 Boss reaches from 32 E1 attempts) and why the one Daring player stalled at E2. Distinguish an agent policy flaw from game balance by reviewing native actions; then expand seeds and realistic class/build strategies.
2. Confirm old-only graph/runtime and 15-Realm generator code can be retired without losing live Dungeon functions or simulator coverage. Active save revision, anti-duplication, Firebase auth and Talent Tree v15 must stay.
3. Repeat a representative E1→E5→E10→E20 natural-progression cohort **only if** the agents actually unlock those levels, plus parity sweeps across Boss, Elite, Tank and weapon/armor/affinity builds.
4. Re-run the four mandatory gates after any related gameplay or runtime change and decide separately whether to merge or deploy.

No merge, GitHub Pages publish, Firebase deploy, production account reset or balance changes were performed during Stage C4.
