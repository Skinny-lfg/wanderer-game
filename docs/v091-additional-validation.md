# v0.9.1 — Additional validation with legal builds

Baseline: `2703dfe`, development. **No game code, balance numbers, saves or main changes.**

## Method

Reuse the production-engine harness. The only extension accepts per-slot equipment specifications, selects matching items through the real generator (bounded rejection sampling), checks affinity pools and handedness, and optionally records stats/casts. Combat RNG is reseeded separately from gear selection so item rerolls do not shift combat RNG. No item stats or affinities are overwritten. The old synthetic mode is unchanged but is **not evidence of obtainable builds**: it forced affinities even onto incompatible Off-Hands. This report supersedes that aspect of the original report.

17,500 expeditions: 100 seeds (7001–7100) × seven weapons × five profiles × D10/30/50/100/200. Each scenario includes 25 trials per elite. Normal five-wave boss expeditions, same neutral theme, no runes, no interim extraction. Affinities: Sword/Poison, Mace/Shield, Daggers and Bow/Critical, Staff and Wand/Fire, Two-Handed/Bleed; compatible Shield, Dagger or Orb Off-Hands only.

| Profile | Item tiers relative to dungeon | Rarities | Primary affinity points |
|---|---|---|---:|
| mixed-low | 60/75/100% | Common/Uncommon/Rare | 2 |
| mixed-mid | 75/90/100% | Uncommon/Rare/Epic | 3 |
| mixed-high | 80/90/100% | Rare/Epic/Legendary | 3 |
| epic-3 | 100% | Epic | 3 |
| epic-5 | 100% | Epic | 5 |

Mixed profiles rotate the tier/rarity assignment across slots (34/33/33 trials). Remaining affinities are spread legally; incidental 2-piece bonuses can occur. Two-handed main weapons count two affinity points, as in the game. Changing 3→5 also changes incidental bonuses: this is a build comparison, not an isolated estimate of the signature power. Selecting exact gear represents accumulated investment, not the probability of finding it.

## Full-clear rates (%), equal-tier Epic with 3 primary points

| Dungeon | Sword | Mace | Daggers | Bow | Staff | Wand | Two-Handed |
|---|---:|---:|---:|---:|---:|---:|---:|
| D10 | 100 | 100 | 100 | 100 | 37 | 70 | 26 |
| D30 | 96 | 88 | 100 | 81 | 1 | 50 | 28 |
| D50 | 100 | 100 | 100 | 100 | 8 | 90 | 23 |
| D100 | 100 | 100 | 95 | 100 | 92 | 99 | 98 |
| D200 | 100 | 100 | 100 | 100 | 98 | 100 | 100 |

At D50, Staff trails Wand by **82 percentage points**; Two-Handed trails Sword/Mace by **77 points**. At D200 the gaps fall to 2 and 0 points. Successful D200 expeditions average Staff 9.35s, Wand 8.46s, Two-Handed 7.00s and Sword 10.07s. These times exclude deaths; the CSV also includes time-to-death/clear averages.

Mixed investment materially changes the conclusion. With mixed-high gear, D50 rates are Staff **15%**, Two-Handed **22%**, other weapons **49–90%**; at D200, **88%**, **97%**, and **90–100%**. With mixed-mid gear at D200, Staff still wins **0%**, Two-Handed **45%**, Sword **89%**, Mace **98%**, Daggers **2%**, Bow **0%**, Wand **10%**. D200 is not universally easier. Mixed-low gear wins almost nothing at any tested level. Epic-5 averages across weapons do not exceed Epic-3 here; complete sets do not erase investment/weapon disadvantages.

## Why relative difficulty falls at high investment

- **Player damage and speed grow together; enemy HP grows linearly.** Epic-3 Staff spell power grows 81→938 from D10→D200 (11.6×), attack rate 0.857→2.662 (3.1×): approximately **36× raw spell throughput**, before crit/DoT. Normal wave-one base HP grows 328→5541 (**16.9×**). Speed's v0.9.1 diminishing returns limit but do not eliminate this multiplication. Staff/Two-Handed Critical also grows 19%→65%. Enemy attack intervals remain fixed, so faster clears avoid whole enemy attacks.
- **Early slow weapons pay a large defensive cost.** At D50, Two-Handed has 1435 HP/231 Defense versus Sword+Shield's 1891/341, and 0.847 vs 1.850 attacks/sec. Staff has 263 Spell Power at 1.232 attacks/sec; Wand+Orb has 283 at 2.143, plus the existing matching-element 30% spell multiplier. Staff's bigger per-hit coefficient and stronger affinity application do not offset that early throughput gap. **No mana fallback attacks occurred for Staff in epic-3 at any tested level**; blaming early Staff weakness on Mana exhaustion is unsupported here.
- **Burst and tier thresholds amplify the gap.** At D50 epic-3, Staff wins 28% against Tank but 0% against Berserker; Two-Handed wins 44% vs 8% (only 25 trials each). Under-tier physical damage can hit the one-damage floor after subtracting Defense. D30 also uses the enraging Berserker boss, while D10/D100 use Guardian and D50/D200 Leech. Boss rotation confounds a simple monotonic level comparison; D50→D200 retains the same boss identity and still shows a large improvement.

## Tests and limits

`npm test` passed, including the new legal-build tests across every profile/weapon/level: affinity pools, generated tier/rarity/effect, magic consistency, exact 2/3/5 primary thresholds, no unintended higher set, handedness, deterministic repeats, finite outcomes and rejection of illegal Staff/Critical. No simulation timeouts. A separate 100-trial before/after check confirmed the original simulator mode returns identical results. Game files and UI are unchanged; browser suites were not repeated for this test-only addition. No Firebase access or rule deployment.

100 trials give up to roughly ±10 percentage points sampling uncertainty; individual elite samples are noisier. One theme, selected gear, correlated tier/rarity profiles, no rune investment and no tactical extraction are deliberate limits. This is not live-player telemetry or exhaustive optimization. Conclusions support a real early/mid Staff/Two-Handed deficit and conditional late-game acceleration, **not a recommendation to globally increase difficulty**. No numerical adjustment is made.

Reproduce: `npm run validate:balance --silent > /tmp/legal-builds.csv`.
Full measurements: [v091-legal-build-results.csv](v091-legal-build-results.csv).
