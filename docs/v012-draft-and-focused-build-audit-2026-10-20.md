# Wanderer v0.12 — Draft exhausted + E10/E50 and hybrid-pair audit
**Date:** 2026-10-20  
**Scope:** analysis and test-only changes on `development`; no merge to `main`, deploy, Firebase rules or real player saves.  
**Measured code revision:** `3330fe33be2997ebfc0c81d3f14b212dcd725efe`, GitHub Actions [run 39484660124](https://github.com/Skinny-lfg/wanderer-game/actions/runs/39484660124). Newer dual-dagger commits can change future reruns; results here remain pinned to this commit.

## 1. Draft blocking fix

Previously `WandererV012Buildcraft.options()` threw if fewer than three useful eligible passives existed. The checkpoint and restore validators also assumed exactly three.

Implemented in development:
- The draft now presents exactly 1 or 2 distinct legal cards when those are all that remain. It does not repeat capped/illegal skills.
- At zero legal cards, the player is explicitly told no useful upgrade remains and can confirm **CONTINUE EXPEDITION**. No fake skill, reroll, Rank 6 or duplicate reward is created.
- Accepting the exhausted reward requires a real pending reward and a null ID, and persists the cleared state; other fake/duplicate choices remain invalid.
- Saved `version:3` drafts accept 0–3 distinct valid cards; old three-card drafts retain the existing migration path.
- Tests check 0/1/2 and checkpoint restore, duplicate rejection and no unnecessary reroll. The isolated post-fix revision `ae2da0abb` passed 210/210 Node tests before parallel dagger code changes.

## 2. Focused real-engine simulation

**3,780 integrated, error-free, timeout-free Expedition simulations.** Based on the native JS harness, actual 15-Realm controller, actual combat, loot collection, draft rules, enemy effects and full synthetic Rare or Epic same-tier gear. No potions, events declined, no mid-Expedition equipment upgrade or farming across Expeditions.

Matrix: E1/E10/E50/E100/E200 × three starting pairs × seven weapons × two rarities × three matched seeds × random/mono/dual decisions × with/without three corresponding tier Runas. **42 cases for each (E, pair, strategy, runes) cell.** Runs share their initial seeded conditions across strategies and pair families, but later RNG consumption can diverge due to choices. The `dual` policy pursues prerequisites and pairs but is NOT a mathematically optimized human build.

### Aggregated completed Expeditions, WITH runes (wins / 126 per strategy and E)

| Expedition | Random | Mono | Targeted dual-family |
|---|---:|---:|---:|
| E1 | 121 | 122 | 122 |
| E10 | 4 | 5 | 4 |
| E50 | 4 | 4 | 3 |
| E100 | 6 | 6 | 7 |
| E200 | 16 | 16 | 14 |

### Specific target dual-family builds, WITH runes (wins / 42)

| E | Blood + Decay | Vitality + Aegis | Fury + Magic |
|---|---:|---:|---:|
| E1 | 39 | 42 | 41 |
| E10 | 1 | 1 | 2 |
| E50 | 1 | 1 | 1 |
| E100 | 0 | 3 | 4 |
| E200 | 4 | 5 | 5 |

### Do hybrids actually activate?

| Pair | E10 hybrid selected | E10 proc activations | E50 hybrid selected | E50 proc activations |
|---|---:|---:|---:|---:|
| Blood + Decay | 19/42 | 12 | 11/42 | 12 |
| Vitality + Aegis | 25/42 | 203 | 11/42 | 154 |
| Fury + Magic | 21/42 | 197 | 14/42 | 245 |

The dual agents acquire target hybrids far more frequently and activate Vitality+Aegis and Fury+Magic substantially. Yet that is insufficient to convert into boss clears. **This does not establish that every hybrid is numerically weak**: late acquisition, absent triggers, hostile weapon type, choice heuristic and limited post-acquisition Realms all matter. Blood+Decay proc count is especially low; inspect Bleed+Rot coexistence and timing.

### Rune ablation, aggregated dual (out of 126)

| E | 3 Runas equipped | No Runas | Mean Realms with → without |
|---|---:|---:|---:|
| E10 | 4 | 4 | 9.19 → 7.55 |
| E50 | 3 | 1 | 6.78 → 5.89 |
| E100 | 7 | 6 | 6.37 → 5.82 |
| E200 | 14 | 13 | 8.56 → 7.97 |

Runas tend to extend reach without transforming the binary win rate of these builds.

## 3. E10/E50 diagnosis

The opening combat snapshots below are means from **63 Epic + three Rune runs per E** under the same random strategy across pairs, seven weapons and three seeds. They are pre-combat snapshots, not damage actually received.

| E | Player Max HP | Player ATK | Player DEF | Attacks/sec | First enemy HP | First enemy ATK |
|---|---:|---:|---:|---:|---:|---:|
| E1 | 216 | 41 | 36 | 1.16 | 82 | 13 |
| E10 | 467 | 88 | 95 | 1.25 | 325 | 62 |
| E50 | 1,605 | 311 | 363 | 1.91 | 1,387 | 285 |
| E100 | 3,009 | 566 | 692 | 2.07 | 2,769 | 554 |
| E200 | 5,832 | 1,119 | 1,359 | 2.72 | 5,481 | 1,106 |

With equivalent starting gear, success drops from ~96% at E1 to only ~3% at E10/E50, then partially recovers at E200. This indicates a difficult / non-monotonic production curve, **not merely random AI skill selection**. E50 dual builds finish only ~6.8 Realms on average; many die before later synergy picks deliver full value. In these setups, Epic players also start with materially more HP/DEF/ATK than Rare players, while enemies receive the same baseline tier scaling.

Likely areas to instrument before any balance change:
1. **Sustain across waves/Realms:** raw incoming hit and attack frequency, healing received vs capped/overheal and Barrier absorption, HP continuity and potion access.
2. **Speed/power breakpoints:** opening attack speed is 1.25 at E10, 1.91 at E50 and 2.72 at E200 in the Epic sample. Verify whether effective time-to-kill and passive proc opportunities scale discontinuously.
3. **Weapon disparity:** E10/E50 dual Wand remains 0 wins in this small instrumented sample; some Epic Two-Handed/Sword cells win. Keep identical gear rarity, slot constraints and affinizations when comparing.
4. **Draft opportunity cost:** compare exactly matched routes where a target hybrid is actually acquired early and functional, rather than treating all nominal dual builds as successful synergy.
5. **Drop progression:** these tests assume complete Rare/Epic starting sets already on-tier; they do not predict true player progression, farm pacing or Legendaries.

**Do not auto-buff or nerf the live enemy curve from this evidence.** The next focused test should compare real damaging hits and recovery per Realm for selected representative seeds at E10/E50/E100 using same gear, then try targeted changes in test-only simulations.

## 4. CI interpretation

The focused matrix itself completed 3,780/3,780 without errors/timeouts. The full GitHub Actions job subsequently failed in the **separate, old** `scripts/v012-complete-sim.cjs` runner because that script had not acknowledged a `cleared` Realm after its passive was chosen. The underlying code correctly requires EXIT REALM before entering the next room; this was a stale simulator assumption and was patched separately in development. Separate concurrent dagger changes also invalidated older parity fixtures; any final release audit must run on an explicit fixed commit after those changes settle.

**Decision:** draft unblock implemented and functionally tested; E10/E50 investigation and three pair comparison completed. Gameplay enemy stats and passive balance **unchanged pending controlled follow-up**, no release or save mutations.
