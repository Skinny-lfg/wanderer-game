# v0.9.2 stress test — Phase 2 of 4

**Baseline:** development `87a1bb4` (gameplay from `e399f7e`). No gameplay, balance, dependency, main or Firebase changes. Phase 3 has not started.

## Scope, budgets and reproducibility

Reused the Phase 1 Node VM and legal gear planner. Added only a reward-only hook that calls the actual `winEncounter()` handler with a synthetic defeated enemy; it includes the real item generator, bonus boss drop, valuables and rune-offer RNG. It does not represent fighting or extracting.

- **200 combat trials total:** 168 = seven weapons × D10/D50/D100 × 8; 24 = D50 Wand with 2/3/5 Crystal points × 8; 8 = D50 Sword/Staff with Legendary main weapons × 4. No D200 or sequential progression runs.
- **5,000 victory/reward samples:** 1,000 per wave, covering all 13 themes round-robin, tiers 10/50/100, CHA 5/55 alternated. At most 6,000 gear opportunities including boss bonus rolls. Two additional reward-only replay checks bring total reward samples to **5,002** (at most 6,004 opportunities), under the 10,000 cap.
- Additional deterministic Crystal unit trace: 48 calls to production `setOnAttack`, not complete combat trials. No extra combat reruns or broad test suite.
- All combat fixtures use actual generated, legal, equal-tier Epic equipment, three primary affinity points and incidental legal secondary affinities, except the explicitly named comparisons. No runes. Temple theme, all five waves; Tank/Berserker/Vampire/Caster receive two trials each in n=8 groups, one each in n=4 groups. Eight seeds are hashed from 920200+i; reward seeds from 929000+1000×wave+i. Gear selection and combat streams are separated as in Phase 1.

Reproduce once from repository root: `node scripts/v092-phase2.cjs > /tmp/phase2.json`. The script enforces the 200/5,000 limits and prints aggregates only. [Saved results](v092-phase2-results.json) include seeds' construction in the script, sample counts, damage, cast/fallback counts, elite wins and catalog frequencies. IDs/timestamps are excluded from deterministic replay comparisons.

## Combat screening

Each row: eight trials. HP is average remaining **percentage**, counting deaths as zero. Duration is average simulated time to clear **or die**, not an efficiency ranking when win rates differ. Successful-only durations are in the JSON. GP is the production Gear Power, not a normalized cross-class DPS score.

| Dungeon | Weapon / role | Win % | Seconds | HP % | GP |
|---|---|---:|---:|---:|---:|
| D10 | Sword — physical balanced | 100 | 19.94 | 35.1 | 750 |
| D10 | Mace — Shield defense | 100 | 24.59 | 59.4 | 768 |
| D10 | Daggers — critical offense | 100 | 12.76 | 43.8 | 638 |
| D10 | Bow — ranged offense | 100 | 15.35 | 34.7 | 616 |
| D10 | Staff — magic | 100 | 14.46 | 35.3 | 651 |
| D10 | Wand — magic + Orb | 75 | 16.64 | 9.0 | 658 |
| D10 | Two-Handed — heavy physical | 100 | 14.59 | 28.6 | 639 |
| D50 | Sword — physical balanced | 100 | 16.76 | 35.2 | 2472 |
| D50 | Mace — Shield defense | 100 | 19.14 | 55.7 | 2501 |
| D50 | Daggers — critical offense | 100 | 11.55 | 18.8 | 2007 |
| D50 | Bow — ranged offense | 100 | 11.88 | 19.2 | 1957 |
| D50 | Staff — magic | 62.5 | 13.74 | 9.4 | 2070 |
| D50 | Wand — magic + Orb | 100 | 14.20 | 19.8 | 2119 |
| D50 | Two-Handed — heavy physical | 75 | 11.85 | 16.8 | 2130 |
| D100 | Sword — physical balanced | 100 | 13.32 | 54.6 | 4591 |
| D100 | Mace — Shield defense | 100 | 14.11 | 74.7 | 4602 |
| D100 | Daggers — critical offense | 87.5 | 11.43 | 13.2 | 3675 |
| D100 | Bow — ranged offense | 100 | 8.99 | 44.7 | 3603 |
| D100 | Staff — magic | 100 | 10.86 | 16.3 | 3814 |
| D100 | Wand — magic + Orb | 87.5 | 11.01 | 16.3 | 3916 |
| D100 | Two-Handed — heavy physical | 100 | 9.46 | 32.0 | 3956 |

**Observed trade-offs:** Mace/Shield is slower but retains the most HP in every tested tier; Daggers/Bow clear faster with less health margin. D50 Staff loses 3/8 (including both Berserker samples), Two-Handed 2/8; other weapons win 8/8. Staff has **zero fallback attacks** here, so its losses are not explained by running out of Mana. The current early-speed catch-up is included: D10 Staff and Two-Handed both win 8/8, unlike older baseline reports.

Late-tier acceleration remains visible at equal investment: D10→D100 Sword goes 19.94→13.32 seconds, HP 35.1→54.6%; Mace 24.59→14.11 seconds, HP 59.4→74.7%. Player damage and attack rate compound while enemy HP scaling is linear; these two levels also share Guardian boss style. This does not demonstrate that poorly geared late-game players have easy encounters.

## Crystal 2/3/5 and Legendary versus Epic

| D50 configuration | n | Win % | Seconds | HP % | GP |
|---|---:|---:|---:|---:|---:|
| Sword Epic-3 | 8 | 100 | 16.76 | 35.2 | 2472 |
| Staff Epic-3 | 8 | 62.5 | 13.74 | 9.4 | 2070 |
| Wand Epic-3 | 8 | 100 | 14.20 | 19.8 | 2119 |
| Wand Crystal-2 | 8 | 100 | 13.53 | 19.9 | 2129 |
| Wand Crystal-3 | 8 | 100 | 13.50 | 19.7 | 2121 |
| Wand Crystal-5 | 8 | 100 | 13.45 | 19.9 | 2115 |
| Sword Legendary-main | 4 | 100 | 12.71 | 56.7 | 2628 |
| Staff Legendary-main | 4 | 100 | 12.43 | 19.2 | 2143 |

Crystal uses compatible armor/accessories, **not illegal Crystal weapons**. Primary Fire on Wand/Orb remains; converting armor to Crystal changes other affinity contributions and generated attribute increments. Thus 2/3/5 are practical legal build comparisons, not perfectly isolated signature-power ablations. Differences of <0.1s and <0.3 HP points between the Crystal builds are not evidence of superiority at this sample size.

**Confirmed Crystal discrepancy:** for base hit 100, the production proc trace gives +8 every hit at 2 pieces; at 3 pieces, +23 on hits 3/6/9/12/15; at 5 pieces, +58 on hits 3 and 15, +23 on intervening third hits. Hits are spaced one combat second apart; the 10s cooldown excludes earlier Burst triggers. Resetting encounter temp state keeps the Burst cooldown. The tooltip says every third *charged strike*, but code triggers on every third **main attack** when the cooldown permits, including the very first charged strike. This is a confirmed text/behavior mismatch, not proof of an infinite proc or an approved balance change.

Legendary comparisons change only main-weapon rarity; offhand/armor remain Epic. Legendary Sword shows a substantial damage/clear-time advantage (+tier+4 generated Attack, rarity stats, first-strike ×1.32). Staff also improves in this small sample. The Legendary n=4 seeds overlap the first half of Epic n=8; table compares the complete groups, **not a paired causal effect estimate**. Do not interpret 4/4 as guaranteed victory or conclude all Legendary items dominate Epics. Catalog identities do not implement 21 unique powers; the generic first strike applies to the main weapon, not every equipped Legendary.

## Legendary distribution

CHA 5/55 are equally represented in every wave. Counts include the extra boss drop. Expected counts come directly from `waveLootOdds`: `(base drop + boss 0.35) × conditional Legendary probability`.

| Wave | Reward samples | Items | Legendary observed | Expected Legendary |
|---|---:|---:|---:|---:|
| 1 | 1000 | 207 | 0 | 0.21 |
| 2 | 1000 | 300 | 4 | 1.55 |
| 3 | 1000 | 462 | 6 | 4.50 |
| 4 | 1000 | 827 | 20 | 24.90 |
| 5 | 1000 | 1356 | 64 | 63.45 |

**94 Legendary / 3,152 items (2.98%)**, vs **94.61 expected** across the sampled opportunities. All 21 identities appeared. **73 repeat catalog identities (77.7% of Legendary drops)** after each identity's first occurrence; these are normal repeated item types, not duplicated item instances or a save exploit. One pooled synthetic collection does not predict any individual player's duplicate rate. Wave 1's zero Legendary is compatible with only 0.21 expected.

| Subtype | All items | Legendary |
|---|---:|---:|
| Amulet | 251 | 6 |
| Armor | 299 | 7 |
| Boots | 285 | 6 |
| Bow | 89 | 1 |
| Charm | 96 | 7 |
| Daggers | 184 | 5 |
| Gloves | 285 | 10 |
| Helm | 305 | 13 |
| Mace | 142 | 2 |
| Off-Hand Dagger | 45 | 2 |
| Orb | 150 | 7 |
| Ring | 251 | 4 |
| Shield | 197 | 4 |
| Staff | 108 | 4 |
| Sword | 100 | 3 |
| Tome | 81 | 4 |
| Two-Handed | 144 | 5 |
| Wand | 140 | 4 |

Catalog and subtype frequencies are **not expected to be uniform**: category weights, theme preferences and the number of identities eligible for a subtype differ. The largest identity counts were Helm of the Dawnwarden 13 and Grasp of the Sunbound 10; all per-ID counts are saved. With only 94 Legendary, rare subtype differences are too noisy to diagnose a faulty distribution. Overall frequency is consistent with the configured rates; no duplicate exploit was established.

## Potential equipment upgrade frequency

Each drop was compared independently against a fixed **equal-tier Epic Sword+Shield / Poison-3** reference at D10/D50/D100, using production `comparisonEquip`/`totalStats`, testing both ring destinations. No progressive replacement or farming loop.

- **276/3,152 (8.76%)** increase GP by more than 1%.
- **127/3,152 (4.03%)** also retain Sword, Shield and at least three Poison points: a conservative build-retaining *potential* upgrade, **not a demonstrated combat win-rate upgrade**.
- Those 127 represent 2.54 upgrade items per 100 sampled wave victories (not the probability of at least one per victory, since bosses can give two).
- Retained candidate counts by wave: **5, 5, 13, 35, 69**. Late-wave rewards dominate opportunities for this already-Epic reference.

The proxy misses improvements from proc timing, specialized effects or lower-GP survivability; it can overvalue unused stats. Real useful-upgrade frequency for other builds or under-tier gear is not measured. Rejection-sampled combat fixtures represent already acquired equipment and cannot estimate acquisition cost.

## Suspected issues, limits and validation

1. **Confirmed UX/logic discrepancy:** Crystal Burst description versus third-main-hit implementation, including cooldown behavior. Documented only.
2. **Possible underperformance:** Staff/Two-Handed still have lower D50 survival; zero Mana fallbacks points toward tempo/mitigation and elite burst rather than Mana starvation. Only two trials per elite: further evidence is required.
3. **Potential high-investment strength:** Mace/Shield's survival and the Legendary Sword uplift merit follow-up; neither is proven overpowered. Late-game acceleration is observed but not a reason for a global difficulty change. No infinite healing/damage loop or immortal build was demonstrated; this sample cannot rule them out.

With n=8, one result changes win rate by 12.5 points; with n=4, by 25. Even 8/8 has an approximate 95% Wilson lower bound of 68%. Use these as screening signals, not precise rankings. Different affinities, boss styles and incidental sets confound weapon-only attribution. No exhaustive 13-affinity matrix, mixed-tier matrix, rune builds, all themes in combat, PvP, extraction strategy, death losses, real save/cloud behavior or browser timing was simulated. Combat damage metrics include overkill. Node cannot certify UI, live server security or real-player progression.

**Validation:** the bounded script passed its budget, legal-affinity, catalog mapping, no-timeout and Crystal trace assertions. Two isolated reward replay samples matched after normalizing IDs/timestamps. Aggregate counts reconcile to 200 combats and 5,000 statistical reward samples. `node --check scripts/v092-phase2.cjs` and `node scripts/build-pvp-stats.cjs --check` passed. `index.html`, generated gameplay stats and the lockfile are unchanged. Broad `npm test`/browser suites were deliberately not run: they exceed this phase's combat scope or exercise unrelated behavior.

**Stop after Phase 2. No recommendations implemented. Await approval for further work.**
