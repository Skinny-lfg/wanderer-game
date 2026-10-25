# WANDERER v0.12 — POST-REWORK COMBAT SIMULATION AUDIT
**Date:** 2026-10-20  
**Repository:** Skinny-lfg/wanderer-game  
**Read branch:** development  
**Observed branch head after reads:** `5c1861c1b3c020720de3516ed80b020d1db678b1`  
**Purpose:** validate phases A/B/C implemented by Codex, Toxic Touch→Rot, gear/runes, 15-Realm combat, and hypothetical E∞ curves.  
**Status:** ANALYSIS ONLY. No gameplay changes, no merge, no Firebase changes, no save operations, no Railway deploy.

## 1. Counts and methodology
**5,376 completed, error-free simulated Expeditions**, divided into:
- **840 production-range runs:** E1/E10/E50/E100/E200 × 4 strategies × 6 initial families × 7 weapon classes, Epic gear and three equipped runes at Expedition tier.
- **4,032 hypothetical endless runs:** 4 growth models × E200/E300/E500/E1000 × tier multipliers 1.00/1.25 × 3 selection strategies × 6 families × 7 weapons. At E200 the 4 models coincide, so E200 rows repeat the same underlying scenarios and must NOT be treated as independent samples.
- **504 rune-ablation runs:** challenge model E300/E500/E1000 × 2 tier ratios × 42 starting family/weapon combinations × rune equipped/not equipped.

**Engine:** loaded actual development JavaScript modules `combat/v012-buildcraft.js`, combat/runtime/controller/economy/gear/runes and the original inline application from `index.html`. Each run went through real Realm offers, events (declined), gear stats, waves, enemy attacks, temporary passives, ranks, draft selection, 15-Realm controller, boss, rune bonuses and death/win. Input/environment were isolated in-memory, with stubbed DOM/persistence and deterministic seeded random; NOT browser E2E or Node npm test. No persistent user data was accessed. Gear was pre-created as fully equipped Epic; 3 matching-tier runes were initially owned/equipped; neither gearing progression nor farming across multiple Expeditions was simulated. The bag was trimmed when full, with no item swaps or event exploitation. Three-card draft was chosen automatically via synthetic heuristics, NOT by an optimally planned player.

**Weapons:** Sword, Mace, Bow, Daggers, Two-Handed, Staff, Wand. **Starting affinities:** Blood, Decay, Vitality, Aegis, Fury, Magic (Magic uses Fire in these trials). **Strategies:** random picks/Realms; “focus” preferentially chooses starting family/passives, avoids hybrids; “two” targets a mechanical pair; “three/synergy” targets three families and ranks/hybrids via a priority list. The pair plans were Blood+Decay, Decay+Blood, Vitality+Aegis, Aegis+Vitality, Fury+Magic, Magic+Fury, with Fury or Blood as third family. Real offers remain RNG-limited, so targeted agents frequently could not realize their desired combo. Independent deterministic decision RNG was used, with identical initial world seeds for paired cells; diverging actions can change later RNG consumption.

**Hypothetical E∞ patch ONLY inside simulation:** remove E200 caps, DUNGEON_CAP=5000, and modify enemy scaling. No actual code files were changed. Models:
- CAPPED: equipment/runes at tier 200 while enemy remains linear at E.
- LINEAR: gear+enemy effective tier E.
- CHALLENGE: enemy effective tier = 200+180 ln(1+(E−200)/180); gear tier = 200+130 ln(1+(E−200)/130).
- GENTLE: enemy = 200+130 ln(1+(E−200)/130); gear = 200+160 ln(1+(E−200)/160).
- Gear ratio 1.25 means **+25% tier**, NOT +25% stats; E200 gear tier 250 and future rune tiers are hypothetical and currently not player-obtainable. The rune-ablation E500 ratio1.25 rounds to 444 under the separate arithmetic route versus 445 in the main model, a minor one-tier methodological discrepancy, so comparisons must be within each rune-ablation pair, not between independent tables.

## 2. Code and scope checks
- Catalog currently contains **63 IDs (33 standard + 30 hybrids)**, of which 29 standard passives have Rank5, 4 standard unique passives have Rank1, and 30 hybrids have Rank1.
- New `options()` offers Upgrade/Synergy/Discovery categories, caps are checked by `eligible()` and `choose()`, and contextual hybrid pity replaces the old fixed Realm6/8/10-only window. The runtime exposes the actual newer draft and `version:3`.
- `toxic_touch` and `toxic_precision` apply **Rot only** in `onAttack()`; these no longer apply Poison in the temporary v0.12 buildcraft flow. Legacy `poison` identifiers are still found in combat/UI/saved status compatibility (including `migrateEnemyDots`), so do not claim the word/legacy system was globally deleted.
- The connected repo contains specific node test files for phases A/B/C and Decay. **This audit did NOT execute the complete npm test/CI suite**; direct simulation success is not proof of all unit/browser tests or per-skill proc correctness.
- All 5,376 accepted full-run trajectories reached finished/failed without thrown harness errors; two earlier setup attempts that rejected/failed to execute were excluded as invalid simulator setups, not counted as gameplay failures.

## 3. Production range, Epic gear+3 runes at matching level
All values are victories out of **42** per mode at each level.

| Expedition | Random | Focus 1 affinity | Intentional 2-family | Intentional 3-family |
|---|---:|---:|---:|---:|
| E1 | 42/42 | 41/42 | 41/42 | 40/42 |
| E10 | 0/42 | 0/42 | 0/42 | 0/42 |
| E50 | 0/42 | 0/42 | 0/42 | 0/42 |
| E100 | 6/42 | 4/42 | 3/42 | 4/42 |
| E200 | 12/42 | 8/42 | 9/42 | 8/42 |

**Mean Realms completed by E / [random, focus, 2-family, 3-family]:**
- E1: [15, 14.98, 14.98, 14.95].
- E10: [9.05, 8.38, 8.86, 8.24].
- E50: [6.33, 6.05, 6.12, 6.29].
- E100: [7.40, 7.26, 6.62, 7.52].
- E200: [8.48, 7.93, 8.36, 8.55].

**Mean hybrid picks E200:** random **0.74**, focus **0.12**, 2-family **0.45**, 3-family **1.33**. Thus purposeful three-family builds **do obtain more hybrid cards**, yet in this synthetic policy they do not clear more consistently. E10 and E50 no-wins is a serious balance signal for this particular fully-equipped synthetic setup but does not establish real player win rates or longitudinal progression difficulty.

## 4. Hypothetical E∞ — challenge softcap

**Tier ratio 100%, wins/42 in order RANDOM / FOCUS / SYNERGY**

| Level | Gear tier | Random | Focus | Synergy | Mean Realms (R/F/S) |
| --- | ---: | ---: | ---: | ---: | --- |
| E200 | 200 | 15 | 15 | 15 | 10.31 / 9.69 / 9.76 |
| E300 | 274 | 20 | 18 | 16 | 10.38 / 10.12 / 10.43 |
| E500 | 356 | 22 | 16 | 18 | 11.24 / 11.07 / 11.21 |
| E1000 | 456 | 20 | 17 | 17 | 10.93 / 9.98 / 10.43 |

**Tier ratio 125% (hypothetical), wins/42 RANDOM / FOCUS / SYNERGY**

| Level | Gear tier | Random | Focus | Synergy |
| --- | ---: | ---: | ---: | ---: |
| E200 | 250 | 34 | 33 | 34 |
| E300 | 343 | 31 | 30 | 32 |
| E500 | 445 | 32 | 32 | 32 |
| E1000 | 570 | 34 | 32 | 32 |

**Mean hybrid picks at ratio 100%, challenge:** E200 1.29 / 0.00 / 1.64; E300 1.17 / 0.07 / 1.79; E500 1.40 / 0.14 / 1.95; E1000 1.48 / 0.05 / 1.88. RNG strategies already pick many hybrids.

## 5. Other three E∞ models (tier ratio 100%)

| Model | E | Random wins/42 | Focus wins/42 | Synergy wins/42 |
| --- | ---: | ---: | ---: | ---: |
| CAPPED | 200 | 15 | 15 | 15 |
| CAPPED | 300 | 1 | 1 | 2 |
| CAPPED | 500 | 0 | 0 | 0 |
| CAPPED | 1000 | 0 | 0 | 0 |
| LINEAR | 300 | 22 | 23 | 22 |
| LINEAR | 500 | 30 | 28 | 30 |
| LINEAR | 1000 | 31 | 30 | 28 |
| GENTLE | 300 | 22 | 21 | 23 |
| GENTLE | 500 | 33 | 31 | 27 |
| GENTLE | 1000 | 31 | 31 | 30 |

**With ratio 125%:** capped E300 4/3/4, capped E500 & E1000 all zero; linear E300 32/32/32, E500 32/32/32, E1000 34/34/34; gentle E300 32/32/32, E500 33/32/32, E1000 34/34/34. These ratios are so overpowered that many differences between decisions disappear.

**Interpretation:** an item power cap at 200 with linearly growing enemies makes E500+ effectively impossible. Gentle/linear scaling with proportional full-Epic gear is often easy at very high level. Challenge is comparatively harder, but full Epic gear at elevated tier substantially flattens strategic differences. Do not finalize E∞ coefficients before testing realistic gear acquisition and genuinely optimized builds.

## 6. Rune ablation: 504 paired trials
Challenge model; focused initial family; the same full set of generated runes was created in both arms to preserve most initial RNG consumption, then equipped in one and left unequipped in the other. Differences in resulting combat timings can still cause later RNG divergence.

| E | Gear ratio | Runes OFF wins/42 | Runes ON wins/42 | Average completed Realms OFF→ON | Pre-run base Power OFF→ON |
|---|---:|---:|---:|---|---|
| E300 | 100% | 16 | 18 | 9.74→10.12 | 12,327→12,720 |
| E500 | 100% | 14 | 16 | 10.67→11.07 | 15,895→16,401 |
| E1000 | 100% | 14 | 17 | 9.12→9.98 | 20,293→20,938 |
| E300 | 125% | 31 | 30 | 12.10→12.50 | 15,331→15,820 |
| E500 | 125% | 32 | 32 | 12.24→12.52 | 19,742→20,371 |
| E1000 | 125% | 31 | 32 | 12.52→12.67 | 25,215→26,018 |

Three equipped runes increase **base Power ~3.2%** across this specific set (Vitality, Warding, Might/Wisdom); generally improve Realm progression, but may not improve the binary win result in every small paired cell. This is not a comprehensive rune optimization analysis.

## 7. Main conclusion / issues to investigate
1. **Design goal not confirmed:** random builds are still equal/better than scripted purposeful builds across many matched cells. The result is robust as an observation about THESE agents but **does not prove real optimal builds are weak**: the “synergy” strategy is heuristic and does not solve passives mathematically or prioritize enough defense/survival.
2. **Opportunity cost and offer RNG:** powerful hybrids arrive after multiple Realm unlocks and prerequisites. Our 3-family agents pick ~1.8–2.0 hybrids at E300–1000 challenge, vs random ~1.2–1.5, but win no more. Must inspect activation counts/amounts, defensive coverage, prerequisites, how many combats remain after activation, and whether most benefit is already obtainable from uncorrelated passive triggers.
3. **Real early/midgame difficulty:** E10 and E50 fully Epic matching-tier setups had zero wins, compared with E1 near-automatic win. Investigate scaling, supply/HP continuity and gear power interactions before declaring any tier curve fair; isolated synthetic tier E gear differs from real obtainable equipment.
4. **Potential reward/draft distortion:** even if A/B/C behave correctly, new random discovery and hybrid offerings may offer many passive synergies without deliberate decisions. Track how much value comes from starters vs hybrids vs generic defensive passives; revisit free starters or gating only if telemetry shows this is responsible.
5. **Rune power small relative to gear:** +3.2% base Power in this loadout. Test specialized runes, affinitized equipment and real acquisition pacing later.
6. **Need action:** run a more focused 2–3 build-optimized combat A/B (Blood+Decay bleed/rot, Vitality+Aegis survival, Fury+Magic cast/hit), with matched gear/runes, item synergies, passive activation telemetry and equal observed Realms. Compare DPS, healing, Barrier, deaths, status uptime and late-Boss success. Do not blindly increase all hybrid numbers or nerf random picks; only adjust verified weak interactions.

## 8. Recommended next work for Codex (requires user authorization)
- Audit activation telemetry of **all 30 hybrids**, particularly effects that were selected but never fired in remaining Realms; distinguish weak amount vs unavailable trigger vs late arrival.
- Add reproducible deterministic build-optimized agents that can PLAN eligible pickups instead of choosing family labels only, with realistic opportunities. Include gear affinity, rune choice and late-game survival.
- Audit whether tooltip/upgrades accurately reflect effective values under caps and whether Rot/Poison fallback is solely legacy.
- Preserve P3 max hybrid and Rank1/5; keep the 15-Realm structure.
- **Do not implement balance changes from this report without approval.** Re-run matched seeded sim suite after each proposed targeted correction.

### Caveats
Source revision of individual files was read from `development` in the same session. The branch head above is the observed head after simulation; if Codex pushes more changes, re-check hashes before interpreting numbers. This analysis did **not** run the entire npm/CI/browser suite, did **not** simulate full loot progression/rarity mix and did **not** produce statistically optimized builds. No physical player saves were accessed or modified.
