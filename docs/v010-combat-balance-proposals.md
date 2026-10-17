# Wanderer v0.10 — combat balance proposals (offline A/B)

**Status:** research, 17 October 2026. No production gameplay, Firebase, player save or `main` change. Audited `development` commit `bb8ec1d7f550713e992d38482e30002fa9baeaca` and the production inline combat in `index.html`, with `combat/legendary.js` loaded in the VM. The source SHA-256 and all aggregates are in [the results JSON](v010-combat-balance-results.json).

## Baseline and method

The attached `v093-balance-audit-v2.md` supplies the prior reference (D100 profile B: Dark 75/100, Regen 74/100, Shield 49/100, Poison 35/100, Two-Handed 6/100, Bow 3/100, Daggers/Staff/Fire 0/100, Frost 3/100). **Its runner `audit-v093-v2.cjs` and `v093-balance-audit-v2-results.json` are absent from this repository and local artifacts.** We could not replay its exact gear draw or progression policies. Our legal mixed fixture uses 80/90/100% tier, a repeating Uncommon/Rare/Rare/Rare/Epic rarity pattern, and up to five primary affinity points. It is a comparison fixture, not the v0.9.3 profile B population. The Epic fixture uses same-tier Epic gear. Both use native item generation and legal affinities; no Legendary was forced. Four themes and all four elites rotate; no runes in either arm.

The existing `simulate-v091.cjs` VM drives real `startDungeon`, `nextEncounter`, `updateFight`, `weaponAttack`, affix procs, set effects and `winEncounter` in 0.11-second ticks. The v0.10 script edits only the **in-memory VM source** for each proposal, with exact anchor checks. Paired arms regenerate the same equipment and start with the same RNG seed, theme and elite. Proc changes consume RNG differently later, so trajectories are matched at entry, not exact counterfactuals. A baseline replay smoke passes. `die` remains a measurement hook; extraction, owned gear across runs, Forge/merchant decisions and save persistence are outside this harness.

**12,000 combat trials, 394 groups; no timeouts.** At D100, initial isolated screens use 48 trials per build/profile (12 per elite, rotating themes). Speed screens use 24 per build/profile/level at D20/40/60/100/160/200. The combined screen uses 24 per cell at D100/D200, paired with 24 new baselines. Wilson 95% intervals, mean HP (deaths = 0), duration including deaths, outgoing and incoming HP damage, healing, Barrier gained, prevented Block/Barrier damage, death wave and elite wins are saved in JSON. Damage includes overkill. Barrier gained is not identical to Barrier actually consumed. Small screens and many exploratory comparisons do not support a release claim.

## D100 isolated screens — mixed gear

Each entry is wins/48; the same offset/seed is used within each row. The prior v0.9.3 reference above is **not** pooled with these results.

| Build | Current | Candidate 1 | Candidate 2 | Stronger diagnostic |
|---|---:|---:|---:|---:|
| Fire Staff | 0 | Burn ratio .17→.21: **0** | Burn ratio .17→.25: **0** | Fire cast damage ×1.35: **4**; ×1.60: **16** |
| Frost Staff | 4 | Chill interval +25→35%: **4** | +45%: **5** | +60%: **18**; +80%: **27** |
| Bow | 0 | Critical grants 3% HP Barrier /6s: **0** | 5%: **0**, 7%: **1** | 12%: **15**; 20%: **37** |
| Daggers | 0 | Critical grants 3% HP Barrier /4s: **0** | 5%/7%/12%: **0** | 20%: **5** |
| Two-Handed | 3 | Heavy Guard 2.5→5% HP Barrier /6s: **4** | 8%: **4**; hit factor 1.70→1.90: **5** | hit factor 2.00: **11**; 2.20: **27** |
| Storm Staff | 0 | Arcane Guard 3.5→5% HP Barrier /6s: **0** | 8%: **1**; mana cost 13→11: **0** | 12%: **3**; 15%: **7** |
| Fire Wand | 0 | spell factor .77→.90: **1** | 1.00: **6** | 1.15: **26** |

Other isolated tests: Fire +15% direct main-hit damage against a burning enemy won **0/48**. Frost's chilled-enemy reduction 8→12% won **5/48**. No tested small change alone solved Daggers or ordinary Staff. Some stronger candidates are too generous to Epic gear: at D100 Fire ×1.60 raises Epic remaining HP from 22% to 87%, Frost +80% from 45% to 93%, Bow 20% Barrier from 60% to 92%, and Wand factor 1.15 from 53% to 98% (all 48/48 wins both before and after). These are diagnostic bounds, not release proposals.

## Defensive builds and passive gear

Armor and accessories share one 14% proc roll with a two-second cooldown. `tryPassiveGearAffinity` sends potency `.45` to `applyAffinity`, but Regen and Shield ignore it on parts of their effect. A = current; B applies `.45` to their passive healing/Barrier; C applies `.70` Regen and `.75` Shield only when potency is below one. Main-hand effects remain unchanged.

| D100 mixed build | A wins/48 | B wins/48 | C wins/48 | A→B effective healing / Barrier gained |
|---|---:|---:|---:|---|
| Dark | 46 | 46 | 46 | 2,257→2,257 HP / 0→0 |
| Regen | 37 | 37 | 37 | 227→174 HP / 111→109 Barrier |
| Shield | 27 | 26 | 26 | 0→0 HP / 608→569 Barrier |

Dark's large healing comes principally from its active Drain path in this fixture, so adjusting Regen/Shield passive potency does not narrow its advantage. The measured effect of either potency alternative is too small to justify a numerical sustain nerf. The current tooltip's “reduced potency” statement remains inaccurate for these paths; a later implementation decision should settle intent and wording together. D100 mixed baseline combat duration: Dark 15.3s, Regen 21.4s, Shield 20.3s. Healing and Barrier counters are expedition totals, not HP/second or effective health on their own.

## Late attack speed and the 0.11-second tick

The current speed curve uses `2.5 + excess/(1 + .2×excess)` above 2.5 attacks/s. A tested `.3` and `.4` in place of `.2`; B subtracted `.004` speed per weapon tier above 100; C preserved speed and added up to 15% enemy HP from D100 to D200. Every option was tested alone at D20/40/60/100/160/200 with mixed and Epic Bow, Two-Handed, Regen and Fire (24/cell). D20/40 are unchanged because speeds are below the threshold and the late changes start above D100. D60 changes to displayed Bow speed are too small to change realized attack ticks in these fixtures.

At D200 Epic, Bow baseline is **100% wins, 97% HP, 5.8s**. The `.3` curve yields 100%, 60% HP, 8.7s; `.4` yields the same realized duration and HP despite lower displayed APS (4.26 versus 4.00). The tier rule yields 100%, 60% HP, 8.7s; +15% enemy HP yields 100%, 96% HP, 6.6s. Thus different numeric attack speeds can map to the **same actual tick interval**. D200 mixed Bow falls from 9/24 wins to **0/24** under either stronger diminishing-return curve or the tier rule; late enemy HP gives 5/24. The tier rule also hurts slow Two-Handed and Fire. **No speed option passed the mixed-gear guardrail.** The evidence supports addressing late acceleration, but not shipping these coefficients.

## Combined pilot and progression impact

A single combined diagnostic used Fire cast ×1.35, Frost interval +60%, Bow critical Barrier 12%/6s, Two-Handed hit factor 2.00, Staff Arcane Guard 12%/6s and Wand spell factor 1.00. At D100 mixed (24/cell), wins changed: Fire **0→7**, Frost **1→20**, Bow **0→8**, Two-Handed **1→5**, Storm Staff **0→3**, Wand **0→23**. At D200 mixed: Fire **1→18**, Frost **9→22**, Bow **8→12**, Two-Handed **4→13**, Staff **2→6**, Wand **0→24**. These combinations also make several Epic builds much safer; D200 Epic Fire rises from 46% to 95% HP and Frost, Bow and Wand approach 100% HP. The combined pilot is **too strong for a final patch**, particularly Wand and Frost.

The prior attached v0.9.3 audit measured D200 completion of Casual 4/20, Experienced 20/20 and speed-oriented 18/20 within 600 expeditions. There is **no v0.10 A/B progression result**: the v0.9.3 progression runner and saved player states are missing, and the existing single-expedition harness cannot retain acquisition, death, protection, Forge, Merchant or recovery. We did not invent 20-player trajectories or extrapolate combat wins to completion rates. Those three historic completion rates are reference figures only. This is the principal release blocker for any numerical patch.

## RECOMMENDED v0.10 BALANCE PATCH

**Candidate for a subsequent progression test, not approval to implement in production.** Strongest support here is for the *direction* of bounded Bow defense and heavier Two-Handed hits. The exact numbers below have only combat-screen evidence. The rest either needs a narrower search or should retain current behavior. No complete configuration has been validated for D1–D200 progression.

| Mechanic | Current value | Proposed value for next test | Reason / confidence |
|---|---:|---:|---|
| Bow critical guard | none | 12% max-HP Barrier, once/6 combat seconds; 30% global Barrier cap | D100 mixed 0→15/48; Epic remains 48/48 but gains 21 HP points. **Experimental.** |
| Two-Handed physical hit factor | 1.70 | 2.00 | D100 mixed 3→11/48, Epic duration 9.4→8.4s. **Experimental.** |
| Fire funded cast damage | ×1.00 | ×1.35 for Burn element only | D100 mixed 0→4/48, Epic HP 22→68%. High quality risk; **speculative**. |
| Frost 2-piece slow interval | +25% | +60%, existing 2.9s Chill / Deep Freeze cooldowns retained | D100 mixed 4→18/48; Epic HP 45→76%. D200 interaction with Staff guard remains risky; **speculative**. |
| Staff Arcane Guard | 3.5% max-HP Barrier/6s | 12%/6s | D100 mixed 0→3/48, Epic HP 22→39%. Still weak; **speculative**. |
| Wand funded-spell factor | .77 | retain .77 | 1.00 gives D100 mixed 6/48 but Epic 96% remaining HP; combined D200 mixed 24/24. |
| Daggers critical guard | none | retain none pending a narrower candidate | 12%/4s gives 0/48; 20% gives 5/48 while making Epic nearly full HP. |
| Regen/Shield passive potency | mixed, some `.45` ignored | retain until intent and tooltip are settled | Uniform scaling changes D100 mixed Regen 37→37/48, Shield 27→26/48; does not address Dark. |
| High-speed diminishing coefficient | .2 | retain .2 pending tick-aware design | .3/.4 make D200 mixed Bow 9→0/24 despite 100% Epic wins. |
| Late enemy HP modifier | none | retain none pending acquired-gear test | +15% by D200 also harms mixed builds and barely challenges Epic Bow. |

Before implementing any row, restore the v0.9.3 persistent progression harness or equivalent archived scripts/results, reproduce its starting states, and compare at least 20 independent players per Casual, Experienced and speed-oriented strategy. Measure deaths, acquired gear, farming and currency ledger alongside completion. Retain death losses and the two protected items. A later tick-aware speed design must be tested against ordinary Bow/Daggers and slower weapons. No Affinity Core proposal is included.

## Validation and limits

`node scripts/v010-balance-ab.cjs` reproduces the JSON and enforces 8,000–12,000 trials; `node tests/v010-ab-smoke.cjs` verifies deterministic replay. `node tests/v093-buildcraft.cjs` passes. The old `tests/v092-simulation-smoke.cjs` fails its hardcoded **21 Legendary** catalog assertion because current production has **22**; this is a stale existing test, unrelated to the v0.10 variants, and was left unchanged. No browser, account or save test was run for this research-only change. No live data was touched.
