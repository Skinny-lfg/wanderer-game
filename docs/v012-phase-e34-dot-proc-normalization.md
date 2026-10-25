# Wanderer v0.12 — E.3.4 DoT split and normalized passive proc rates

**PASS técnico — 180 native combat simulations, zero errors.**
GitHub Actions: https://github.com/Skinny-lfg/wanderer-game/actions/runs/39679496706

## Method

Six variants with 30 paired E200 synthetic seeds each, as E.3.3. Copies of the simulator and runtime are instrumented only in memory. At every native periodic tick, the harness records pre-tick Bleed and Burn stack damage, then apportions the **HP-capped applied damage** proportionally between them. Reports also count passive proc events per 100 recorded main-hand direct attacks. These are events-per-100 attacks, not bounded individual activation probabilities; a single attack may cause more than one event.

| Build | Wins/30 | Main hits | Bleed allocated | Burn allocated | Total periodic reported |
|---|---:|---:|---:|---:|---:|
| Dual Daggers | 30 | 3683 | 30782 | 7353 | 38199 |
| Single Dagger | 2 | 3987 | 34054 | 1374 | 35746 |
| Wand + Orb | 15 | 2050 | 2510 | 146586 | 149096 |
| Wand only | 0 | 1354 | 732 | 61616 | 62348 |
| Sword + Shield | 15 | 2844 | 3162 | 836 | 4055 |
| Sword only | 0 | 571 | 0 | 209 | 247 |

Amounts rounded; the sum of apportioned Bleed and Burn may not equal the total periodic metric for some ticks. This is because not all damage events in the aggregate can be attributed to those two stack arrays by the current instrumented path; **do not label residual as Rot**.

## Procs per 100 Main Hand attacks

| Event | Dual Daggers | Single Dagger | Wand + Orb | Wand only | Sword + Shield |
|---|---:|---:|---:|---:|---:|
| Double Strike | 22.70 | 23.23 | — | — | — |
| Bleed application | 12.00 | 11.46 | 0.78 | 0.37 | 0.49 |
| Burn application | 2.96 | 2.06 | 26.63 | 19.79 | 1.34 |
| Spellblade | — | — | 18.15 | 2.07 | — |
| Static Discharge | 0.52 | 0.40 | 6.10 | 4.51 | — |
| Shield Counterattack | — | — | — | — | 8.37 |
| Counterstrike | — | — | — | — | 2.43 |

## Findings and limitations

- Dual Daggers' higher win rate is **not explained by a major difference in main-hand normalized Double Strike proc rate** in this sample. Off-hand direct damage, previously measured at 1 407 427 over 30 runs, remains important. The rates normalized on main-hand strikes do **not** reflect events per total strikes including Off-Hand, and do not isolate contributions per hand.
- Wand + Orb has much stronger Spellblade and Burn metrics, but removing Orb also changes stats and RNG; this is not yet a controlled attribute-isolated counterfactual.
- **Rot remains unmeasured as a separate damage category.** The runtime's `tickDots` loop covers Bleed and Burn arrays; some Rot damage comes through separate buildcraft/event pipelines and requires dedicated instrumentation at its own application functions. No Rot amount should be invented.
- Bleed/Burn attribution uses proportional allocation of capped aggregate DoT to active stacks. It is a model-based attribution, not a new combat rule.
- The periodic aggregate and allocated component totals have small residual differences (e.g., Dual 38199 aggregate vs 38135 allocated) that should be reconciled before claiming exact full accounting.
- No changes to `main`, Firebase, real saves, live economy, battle formulas, equipment power, or probabilities.

**Next phase proposed: E.3.5** — instrument Rot and every DoT path at the precise damage application boundary, reconcile totals with battle damage metrics, and compare normalized procs per Main and total weapon strikes with controlled stats. Hold all balance changes until then.
