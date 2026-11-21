# Wanderer v0.13 — Stage 6.16: actual native enemy win rates by Boss, Elite and mob group size

**Completed:** 2026-11-21
**Source branch:** `audit/v013-stage616-enemy-granular-20261121`, based on the canonical Stage 6.15 development checkpoint `3202016dc07ba1228378e3c66b5719e023697344`.
**Scoped PR:** https://github.com/Skinny-lfg/wanderer-game/pull/113
**Passing GitHub Actions:** https://github.com/Skinny-lfg/wanderer-game/actions/runs/44901448572
**Complete raw JSON and per-name native mob table:** GitHub Actions artifact `stage616-full-3840-native-group-elite-boss-fights`, containing `v013-stage616-encounter-matrix.json` and `.md`.

## Executive answer

**User-selected preliminary target for Elites: the player should win approximately 60–70% of reasonable Elite fights.** Native Stage 6.16 evidence shows the current Elite categories generally much easier than that target when mixing synthetically advanced builds, but some E5 Elites are already challenging. **Do not buff all Elites globally**: differentiate by E tier, real Elite type, and opportunity for player strategy.

The most surprising additional finding is a **severe group-composition discontinuity at 4→6 normal mobs**. Real native combat with **6, 8, 12 or 20 mobs was won in ALL 384 comparable attempts at each group size**, while four-mob encounters caused nine losses. Median player damage TAKEN **fell from 98 against 4 mobs to 22 against 6 mobs**, because native roster rules replace strong principal roles with multiple weaker Minions. This is not a legitimate monotonic difficulty curve.

Six unprepared real Bosses varied substantially. Decay (Carrion Matriarch), Blood (Rift Harbinger), and Aegis (Abyssal Guardian) were the hardest in this new cohort; Vitality (Heartroot Devourer) was the easiest. Boss preparation from naturally traversed Expeditions was NOT available.

### Integrity and real executed counts

- **Six real Realm families × four legal synthetic E/point budgets × two existing native strategic profile selections × eight independent native seeds = 384 matched ten-way scenario sets**.
- Every set executed native Normal mob counts **1, 2, 3, 4, 6, 8, 12, 20**, plus a **native Elite** and native six-Affinity **Boss**, giving **3,840 real native combats**.
- **384/384 matched setups passed 14 strict checks** of full rolled hero equipment, starting HP/MP/maximum stats, native legal v15 Talents, point budget, attunement, seed/resolved seed, native Realm/Risk/Condition, true requested normal mob count and native encounter classifications. The game engine, enemy roster logic and all abilities were original.
- The 96-scenario **960-combat pilot is contained in the 384-scenario full cohort**, not additional independent samples. Every dedicated Stage 6.16 test (7/7) and Stage 6.15/6.14/6.13/6.12/6.11/6.10 regression suites passed in the same CI run.
- New seed starts 6160011 onward differ from the previous Stage 6.15 source seed starts.
- No gameplay buffs, nerfs, HP/attack coefficients, AI/roster or player progression changes.

## 1. Normal mobs — individual real native group sizes

| Native initial mob count | Player wins | Observed win % | Mean real Minions in group | Mean real Tanks | Median damage taken by player |
|---:|---:|---:|---:|---:|---:|
| **1** | 381/384 | **99.2%** | 0 | 0.24 | 76 |
| **2** | 382/384 | **99.5%** | 1.00 | 0.28 | 83 |
| **3** | 381/384 | **99.2%** | 1.00 | 0.52 | 90 |
| **4** | 375/384 | **97.7%** | 1.52 | 0.76 | 98 |
| **6** | 384/384 | **100.0%** | 4.76 | 0.28 | 22 |
| **8** | 384/384 | **100.0%** | 6.79 | 0.31 | 25 |
| **12** | 384/384 | **100.0%** | 10.70 | 0.30 | 31 |
| **20** | 384/384 | **100.0%** | 17.68 | 0.69 | 38 |

**Likely source of the 4→6 discontinuity:** `online/v013-enemy-roster.js` uses `normalCount=count-(1 or 2)` for a count of four; for a count of six and above, it sharply reduces the number of non-Minion roles to 1–3. This is a real native **roster-composition/scaling design choice**, not a simulator bug or fabricated enemy stat. Native Minions have weaker health, attack and defense. A group of 20 is NOT 20 full-stat Tanks. **Causal ablation with fixed composition and matched seed would be needed before pinpointing the right exact roster formula**, but this discontinuity is strong direct evidence to improve the composition rule.

### By controlled legal E/point tier

Each cell contains **96 actual native fights**. These are not naturally earned points.

| E / synthetic points | Solo 1 | Two | Three | Four | Six | Eight | Twelve | Twenty | Elite | Unprepared Boss |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| E5 / 12 | 95/96 | 94/96 | 94/96 | **87/96** | **96/96** | 96/96 | 96/96 | 96/96 | **61/96** | **0/96** |
| E15 / 24 | 94/96 | 96/96 | 95/96 | 96/96 | **96/96** | 96/96 | 96/96 | 96/96 | **89/96** | **7/96** |
| E35 / 36 | 96/96 | 96/96 | 96/96 | 96/96 | 96/96 | 96/96 | 96/96 | 96/96 | **93/96** | 36/96 |
| E70 / 60 | 96/96 | 96/96 | 96/96 | 96/96 | 96/96 | 96/96 | 96/96 | 96/96 | **95/96** | 61/96 |

E5's four-mob fights killed nine of 96 characters, while 6/8/12/20 did not kill any. **Normal groups were already virtually harmless for controlled E15+ builds**. A heroic RPG may intentionally have easy solo mobs, but the **inversion of difficulty with extra enemies** should be reviewed.

### One mob: role and named-mob observations

Solo 1 native roster randomly spawns a principal role — **Tank 90/93 (96.8%)**, **Caster 147/147 (100%)**, **Skirmisher 144/144 (100%)**. The real native Stage 8.0 solo roster **does not select Minions**.

The new audit observed **43 distinct native solo mob names** across Realms, with only 26 names having ≥8 samples and four having ≥15 samples. Example: `Bulwark Scarab` Tank 6/8 (75.0%), `Barnacle Legionnaire` Tank 10/11 (90.9%), `Spore Toad` Caster 21/21 (100%); these **small and unevenly selected samples** cannot establish a global difficulty ranking for each named mob. The full `matrix.md` artifact contains every 43-name rate and denominator. Do not call all caster names individually tested at sufficient statistical power.

## 2. Elites — exact native archetypes as observed (native encounter, no forced Elite ID)

| Real native Elite type | Player wins | Win % | Initial diagnosis against 60–70% goal |
|---|---:|---:|---|
| **Oathbound Exarch** | 52/53 | **98.1%** | Very easy |
| **Briarspine Horror** | 57/60 | **95.0%** | Very easy |
| **Ashen Executioner** | 35/38 | **92.1%** | Very easy |
| Berserker | 48/53 | **90.6%** | Easy |
| Tank (generic role subtype) | 35/40 | **87.5%** | Easy |
| Caster (generic role subtype) | 42/49 | **85.7%** | Easy |
| Gravecaller | 34/43 | **79.1%** | Above provisional target |
| Vampire | 35/48 | **72.9%** | Closest to goal |

Four `v013-elite-abilities.js` dedicated Elite ability types are **Gravecaller, Oathbound Exarch, Briarspine Horror and Ashen Executioner**. `tank` and `caster` are generic role subtype labels, not additional dedicated names/artwork. Berserker and Vampire are also native archetype labels whose behavior must be evaluated from real abilities, not assumed dedicated Stage 8.2 skills. The cohort uses natural seed-generated Elite type assignment; subtypes have different counts and possible Realm/level distribution imbalance.

### Why global Elite buffs would be a mistake

- **At E5 / 12 synthetic points**, Elites were beaten **61/96 (63.5%)**, already *within* the user's rough 60–70% target. E5 native subtype differences were stark: Briarspine Horror 11/13 (84.6%), Oathbound Exarch 13/14 (92.9%), whereas Gravecaller 7/15 (46.7%) and Berserker 5/10 (50%). This is an important early-E exception to pooled ease.
- **At E15 / 24 synthetic points**, Elites were beaten **89/96 (92.7%)**.
- **At E35 / 36 points**, **93/96 (96.9%)**.
- **At E70 / 60 points**, **95/96 (99.0%)**.

Thus **the biggest Elite problem is that the difficulty stops scaling appropriately with player growth**, with some dedicated Elite types already too weak at E5. A blanket +HP/+Attack applied to every Elite might break the E5 progression while only partially addressing E70.

## 3. Six native Bosses (unprepared first-ring controlled encounter)

Each Boss is genuinely native and observed **64 times**: four budgets × two player profiles × eight seed starts.

| Actual Boss | Realm | Player wins | Win % |
|---|---|---:|---:|
| **Carrion Matriarch** | Decay | 11/64 | **17.2%** |
| **Rift Harbinger** | Blood | 12/64 | **18.8%** |
| **The Abyssal Guardian** | Aegis | 15/64 | **23.4%** |
| **Stormglass Conductor** | Magic | 18/64 | **28.1%** |
| **Ember Sovereign** | Fury | 21/64 | **32.8%** |
| **Heartroot Devourer** | Vitality | 27/64 | **42.2%** |

Bosses were increasingly beatable at higher synthetic E: E5 0/96, E15 7/96, E35 36/96, E70 61/96. **Unprepared Boss performance must not be equated to naturally prepared 15-Realm Boss fights**; the next controlled study needs legal marked-Elite/Reliquary preparation, and ideally a full earned account progression campaign.

### Target hierarchy and next balance steps

1. **Enemy group-generation balance before raw HP tweaks:** inspect `v013-enemy-roster.js` threshold 4→6 and mix of principal Tank/Caster/Skirmisher roles versus Minions. Hold mob count, hero, seed and Realm fixed for causal composition experiments; change one rule at a time, measure difficulty slope and native damage, not merely win %.
2. **Elite progression scaling:** keep E5 survivable and maintain user's goal of ~60–70% in calibrated target encounters. Avoid raising every Elite equally; compare dedicated weak types first (Exarch, Briarspine, Executioner), and re-test Vampire/Gravecaller separately because E5 may already be challenging.
3. **Boss mechanics/preparation:** targeted unprepared vs prepared Boss experiments, six separate Boss identities; investigate damage cadence, minions, Barriers and distinct fight conditions. Do not buff players globally because it would make Elites/mobs even easier.
4. **Earned progression validation:** current E level and high Talent budgets are synthetic, obtained without real loot or full Expedition; native game engine and actual enemy stats are real but no players earn these bundles automatically. Stage 6.11 natural-account E1 bottleneck must be independently resolved.

### CI and reproducibility

- GitHub Actions: https://github.com/Skinny-lfg/wanderer-game/actions/runs/44901448572 — **success**.
- Stage 6.16 native matcher tests **7/7**; Stage 6.15 **8/8**, Stage 6.14 follow-up **7/7**, Stage 6.14 **9/9**, Stage 6.13 **10/10**, Stage 6.12 **10/10**, Stage 6.11 **8/8**, Stage 6.10 **6/6**. No failed pilot/native fixture checks.
- Pilot 96 matched ten-way sets / 960 native combats **is a subset** of full 384 sets / 3,840 native combats.
- Raw full 47.3 MB native JSON, plus per-name/relevant class Markdown in the `stage616-full-3840-native-group-elite-boss-fights` GitHub Actions artifact.
- No game code, individual enemy roster stats, Boss skills, Talent weights, saves, art, Firebase or production `main` were changed. All changes are diagnostic simulator, tests, CI and documentation only.

## Canonical integration verification

- Native full GitHub Actions run `44901448572` completed successfully.
- PR #113 was merged into `audit/v013-stage6` at `a56e2a6976e5076953bc03bfcef278ad3c978cbc`.
- Exact tested Git tree remained unchanged by integration: `cfacb94f862c1f13e2b54cdc276a296065091aa2` for both reviewed PR HEAD and merge tree.
- This follow-up checkpoint changes only `AGENTS.md` and the Stage 6.16 result documentation, not source code or tests. Production `main` remained unchanged at verification.
