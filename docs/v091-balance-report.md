# Wanderer v0.9.1 balance report

Branch: development. Baseline: `db3d5b0`, integrating remote `f457130` plus existing save guards. Before delivery, integrated remote `3f34bc1` through `284eede` (new save validation/account retries/mobile tests); combat and reward formulas were unchanged by that integration. No main merge, game publication, Firebase deployment or player-data access.

## Method and scope

The offline VM runs the production item generator, cumulative sets, totalStats, enemyFor, nextEncounter, updateFight, damage-over-time and reward functions. It replaces DOM, timers, persistence, death UI and logs only. Each expedition uses the real four normal waves plus fifth boss wave; mana and HP carry across waves. Death terminates the trial without modifying equipment. Successful final extraction is assumed for reported rewards, without selling valuables. No intermediate extraction/healing strategy is simulated.

100 seeded trials per scenario (seeds 1001–1100), balanced across all four elites (25 each). Seven weapon/build combinations: critical Daggers (offense), Mace/Shield (defense), drain Wand/Orb (sustain), poison Sword/Shield (balanced), bleed Two-Handed, fire Staff and critical Bow. All generated slots retain real stats, with a deliberately optimized single affinity; no hand-edited stat inflation. These are archetypal builds, not a claim to exhaust all builds. Daggers lack Shield defense but still wear normal armor.

D10/D50/D100/D200 × seven builds × four investment levels: Rare at 80% dungeon tier, Rare at equal tier, Epic at equal tier, Legendary at equal tier. **11,200 trials per version**. Another **1,200 trials per version** check Epic Daggers/Two-Handed/Staff at D9/D49/D99/D199. Total 24,800 final before/after trials. Exploratory candidate tuning was discarded. No timeouts in the final main matrix.

The full compact matrix is [v091-balance-results.csv](v091-balance-results.csv). Win = complete dungeon; alive includes survivors at timeout (none). HP is the unconditional average remaining percentage, including zero for deaths. Damage is post-Barrier damage including overkill, DoT and counters, not net HP change; vampire healing can increase damage required. Reward averages count failed full expeditions as zero: they are risk-adjusted opportunities, not currency actually written to a save. Gear Power is diagnostic only and never scales enemies.

Reproduce from repository root:

```sh
git show db3d5b0:index.html > /tmp/wanderer-v091-before.html
node scripts/simulate-v091.cjs /tmp/wanderer-v091-before.html > /tmp/before.json
npm run simulate:balance --silent > /tmp/after.json
node scripts/simulate-v091.cjs --boundaries /tmp/wanderer-v091-before.html
node scripts/simulate-v091.cjs --boundaries
```

## Three supported problems and exact changes

1. **High-tier speed compounds growing hit damage.** Epic critical Daggers completed D200 with 100% average HP remaining, versus 47% at D10. This is combat scaling, not evidence that real players cheated. Apply diminishing returns only above 2.5 attacks/sec: `2.5 + (raw - 2.5) / (1 + 0.2 * (raw - 2.5))`. Below the threshold speed is identical; above it investment still helps, approaching 7.5 attacks/sec. Critical chance continues to use the original raw speed denominator, preventing a compensating crit buff. Shield, healing and DoT proc frequency follow actual attack frequency. Bleed's temporary haste remains intact. No defense, regeneration, enemy or global difficulty multiplier changed.
2. **Two-Handed suffers disproportionate early/mid attrition.** Its low attack speed, blocked Off-Hand and previous damage reduction left Epic D10/D50 win rates at 7%/8%, versus 100% for several equal-investment peers. Raise the physical hit coefficient **1.48 → 1.70 (+14.9% before defense)**, retaining speed, restrictions and stats. It remains vulnerable to enemy burst and benefits from gear investment.
3. **Staff has a similar early/mid bottleneck.** Epic D50 had zero full clears in this sample, versus 100% for Wand. Raise the paid spell coefficient **1.12 → 1.32 (+17.9%)**. Keep 13 Mana cost, mana regeneration, slow speed, no Off-Hand and weak out-of-mana attacks. Legendary and set-triggered damage use the same existing paths; their caps/cooldowns are unchanged.

No item rerolls, migration, new abilities or reward changes. Generated public/PvP stats use the same speed formula. The practice arena retains its existing separate hit-resolution model.

## Before / after (equal-tier Epic)

| Dungeon | Build | Win % before → after | HP % before → after | Combat seconds before → after |
|---|---|---:|---:|---:|
| D10 | offense | 100 → 100 | 47.38 → 47.38 | 12.41 → 12.41 |
| D10 | defense | 100 → 100 | 56.36 → 56.36 | 24.58 → 24.58 |
| D10 | sustain | 100 → 100 | 63.39 → 63.39 | 20.39 → 20.39 |
| D10 | balanced | 99 → 99 | 29.06 → 29.06 | 22.68 → 22.68 |
| D10 | heavy | 7 → 36 | 0.26 → 3.01 | 20.42 → 19.28 |
| D10 | caster | 26 → 44 | 0.9 → 1.94 | 20.12 → 19.2 |
| D10 | ranged | 100 → 100 | 42.06 → 42.06 | 14.56 → 14.56 |
| D50 | offense | 100 → 100 | 25.09 → 25.09 | 11.33 → 11.33 |
| D50 | defense | 100 → 100 | 47.71 → 47.71 | 20.61 → 20.61 |
| D50 | sustain | 100 → 100 | 63.96 → 63.96 | 16.89 → 16.89 |
| D50 | balanced | 99 → 99 | 25.7 → 25.7 | 20.13 → 20.13 |
| D50 | heavy | 8 → 26 | 0.49 → 2.32 | 15.05 → 14.51 |
| D50 | caster | 0 → 15 | 0 → 1.12 | 15.33 → 15.39 |
| D50 | ranged | 100 → 100 | 26.6 → 26.6 | 11.71 → 11.71 |
| D100 | offense | 100 → 98 | 74.19 → 36.96 | 7.68 → 10.22 |
| D100 | defense | 100 → 100 | 74.91 → 74.91 | 14.2 → 14.2 |
| D100 | sustain | 100 → 100 | 85.41 → 85.53 | 13.03 → 13.09 |
| D100 | balanced | 100 → 100 | 59.28 → 59.28 | 13.66 → 13.66 |
| D100 | heavy | 94 → 99 | 17.11 → 31.05 | 12.32 → 10.85 |
| D100 | caster | 87 → 98 | 11.8 → 15.79 | 14.34 → 12.84 |
| D100 | ranged | 100 → 100 | 56.27 → 56.27 | 8.84 → 8.84 |
| D200 | offense | 100 → 100 | 100 → 79.53 | 3.76 → 7.51 |
| D200 | defense | 100 → 100 | 87.8 → 87.8 | 9.76 → 9.76 |
| D200 | sustain | 100 → 100 | 99.96 → 81.17 | 6.32 → 9.49 |
| D200 | balanced | 100 → 100 | 67.87 → 67.87 | 10.26 → 10.26 |
| D200 | heavy | 100 → 100 | 79.47 → 90.2 | 7.73 → 6.94 |
| D200 | caster | 89 → 99 | 21.36 → 44.53 | 10.51 → 9.37 |
| D200 | ranged | 100 → 100 | 97.63 → 97.63 | 5.9 → 5.9 |

## Investment, elites and progression

The Rare 80%-tier vs Rare equal-tier comparison isolates tier investment; equal-tier Rare/Epic/Legendary isolates rarity. Stat multipliers remain Common 1, Uncommon 1.25, Rare 1.57, Epic 2.1, Legendary 2.6. Existing Legendary first-strike +32% and Sword's generated extra attack remain unchanged. For example, before tuning D200 critical Daggers won 0% with D160 Rare equipment versus 100% with D200 Rare equipment. After tuning, those rates are 0% and 63%; equal-tier Epic still wins 100%. Flat enemy Defense is subtracted from physical hit damage, so under-tier fast weapons can reach the one-damage floor. This gear threshold is an important remaining progression concern, not merely unlucky elite RNG. Strong Legendary investment can legitimately make D200 fast. This patch does not establish an artificial cap or identify individual player exploits.

Berserker burst is the most dangerous elite for weak Staff/Two-Handed samples; Tank extends combat, Vampire punishes insufficient damage, and Caster reduces direct damage. The matrix includes each elite's win rate. No elite constant was changed: improving the weak weapons addresses the underlying disparity without reducing risk for everyone.

Boss boundaries add a fifth encounter with no automatic heal. Normal enemy HP/attack/defense scale linearly with tier, with fixed wave multipliers. There is no Gear Power rubber-banding. The boundary sample below checks the preceding four-wave dungeon; compare against the boss rows above. Different rotating boss identities and integer rounding also affect outcomes.

| Version | Dungeon | Weapon | Win % | Seconds | Expected Gold | Expected Fragments |
|---|---|---|---:|---:|---:|---:|
| before | D9 | Daggers | 100 | 9.67 | 37.84 | 19.04 |
| before | D9 | Two-Handed | 86 | 18.34 | 32.67 | 16.38 |
| before | D9 | Staff | 83 | 17.56 | 31.66 | 15.91 |
| before | D49 | Daggers | 100 | 8.86 | 118.41 | 55.36 |
| before | D49 | Two-Handed | 63 | 13.87 | 74.13 | 34.45 |
| before | D49 | Staff | 44 | 14.44 | 51.98 | 24.10 |
| before | D99 | Daggers | 100 | 5.98 | 218.32 | 103.26 |
| before | D99 | Two-Handed | 100 | 9.66 | 217.59 | 103.00 |
| before | D99 | Staff | 95 | 11.48 | 206.62 | 97.78 |
| before | D199 | Daggers | 100 | 2.94 | 418.21 | 199.37 |
| before | D199 | Two-Handed | 100 | 6.02 | 417.59 | 198.95 |
| before | D199 | Staff | 100 | 8.38 | 417.51 | 198.98 |
| after | D9 | Daggers | 100 | 9.67 | 37.84 | 19.04 |
| after | D9 | Two-Handed | 100 | 16.25 | 38.11 | 18.73 |
| after | D9 | Staff | 100 | 16.13 | 38.01 | 18.93 |
| after | D49 | Daggers | 100 | 8.86 | 118.41 | 55.36 |
| after | D49 | Two-Handed | 89 | 12.42 | 104.95 | 48.74 |
| after | D49 | Staff | 88 | 13.19 | 103.66 | 48.23 |
| after | D99 | Daggers | 100 | 8.99 | 218.31 | 103.25 |
| after | D99 | Two-Handed | 100 | 8.35 | 217.67 | 102.88 |
| after | D99 | Staff | 100 | 10 | 217.99 | 102.74 |
| after | D199 | Daggers | 100 | 5.87 | 418.21 | 199.32 |
| after | D199 | Two-Handed | 100 | 5.36 | 417.71 | 198.98 |
| after | D199 | Staff | 100 | 7.32 | 417.67 | 199.08 |

Rewards remain linear: each victory gives 3–6 + floor(D×0.5) Gold and 1–3 + floor(D×0.24) Fragments, plus elite/boss bonuses. Fifth-wave bosses add Gold/Fragments, extra loot opportunity and permanent rune selection. Forge cost remains 10 + 10×tier; high-tier equipment recovery remains costly relative to one run. Reward tables, rarity odds, Merchant, salvage and two protected items are unchanged. Increased expected rewards in weak builds come from surviving more often, not larger rewards per victory.

## Regression results

- `npm test`: passed, including gear/loot, cumulative sets, elites and bosses, rune rewards/persistence, save migration, stale-tab prevention, profiles and practice PvP, plus the new v091 tests.
- New tests verify monotonic bounded speed across all seven weapon types, unchanged speed below threshold, unchanged Critical calculation, exact Staff/Two-Handed damage, Mana expenditure, immutable old Legendary item records and deterministic D1/D10/D50/D100/D200 outcomes at 1× and 4× simulation speed.
- `npm run test:browser`, `test:assets`, `test:recovery`, `test:pvp`: passed again after final remote integration. Firebase boundaries are mocked and all saves are synthetic.
- No CSS/layout changes in the balance patch. The Critical display uses the same raw-speed denominator as the engine.
- Firestore emulator/rules not certified here: the prior environment attempt to download the emulator received HTTP 403. No rules were deployed. Existing remote rule changes were preserved during development integration, not authored or activated by this balance patch.

## Remaining concerns and recommendation

- Early/mid Staff and Two-Handed remain riskier than peers, especially without Legendary investment. They improve but are not fully equalized. A broader buff requires more path/build sampling; this patch deliberately avoids another redesign.
- This is one neutral dungeon theme, optimized single-affinity gear, no runes and no between-wave extraction choices. It does not exhaust mixed 3+2 builds, all themes, all rune investment or player behavior. Rune/set correctness is covered by existing regression tests, not an exhaustive strength search.
- 100 trials give roughly ±10 percentage points worst-case sampling uncertainty; elite subsets have only 25 trials. One-point differences are not balance evidence.
- Fixed 110ms attack quantization, signature damage feeding subsequent affinity applications, and the extra Legendary Sword stat merit future targeted investigation. No unbounded proc recursion or immortal sustain was demonstrated by this matrix; that is not proof that every possible build is safe.
- Saves keep the same schema and reset version. Runtime-derived speed/Gear Power can decrease; stored item stats, currency, progress, profiles and rune ownership are unchanged. No real saves were used.
- Feedback continues using the existing Firebase `0.9` protocol value because changing accepted metadata would require coordinated rule deployment. The visible game version is 0.9.1.

Recommendation: ready for development playtesting, with the remaining early/mid weapon gap disclosed. This report is not authorization to release or certification of live Firebase rules.

## Files and final integration checks

- `index.html`: three balance adjustments, correct raw Critical display, visible version and existing home changelog text.
- `online/pvp-stats.mjs`: regenerated shared stat calculations.
- `scripts/simulate-v091.cjs`: reusable offline matrix and boundary simulations.
- `tests/v091-balance.cjs`: targeted regressions; `tests/merchant-combat-balance.cjs` updated coefficients; `tests/online-model.test.mjs` accepts the newer precise invalid-attack error message.
- `package.json`: includes regression and simulation commands. No dependency changes.
- `CHANGELOG.md`, this report, CSV results and the corrected historical stress report document scope and provenance.

Latest remote mobile/account work was integrated before final validation. The full after matrix was rerun after integration and matched byte-for-byte. Tests for mobile elite/boss warnings and loot placement passed at 320/390/650/768/1440 px; recovery passed 32 synthetic Guest/Google/local/cloud/conflict scenarios at 320/390/768/1440 px. Assets passed at 390/1440 px, and PvP profiles/practice passed at 320/390/1440 px. The initial new account-browser invocation used its upstream default port 8010; rerun uses `WANDERER_TEST_URL=http://127.0.0.1:8012`, matching the local server and CI.

Final account-browser rerun passed at 1440/390/320 px, including fresh-session cloud revision restoration and retry after profile fetch failure. All listed test commands completed with exit code 0. No production deployment was invoked.
