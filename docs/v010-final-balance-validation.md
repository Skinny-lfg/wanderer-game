# Wanderer v0.10 — final balance validation (offline, no gameplay changes)

## Decision

**Carry forward only Bow Critical Barrier at 8% maximum HP on a critical hit, with a 6-second cooldown, for a future gameplay review.** It improved the weak acquired Bow samples while paired full progression moved only from 8/60 to 10/60 D200 completions. This is an experimental recommendation, **not an implemented balance change**. Do not bundle it with the Two-Handed or Frost increases. No Fire, Staff, or Daggers change is sufficiently supported for this release.

## Method and reproducibility

The restored `scripts/simulate-v091.cjs` campaign adapter keeps the production `state` across expeditions and calls production dungeon offers, combat, loot, extraction, death, protection, equip, rune, item, and stat functions. Merchant and Forge UI callbacks are mirrored using production price, item, and capacity functions. `scripts/v010-progression.cjs` applies explicit Casual, Experienced, and Speed-oriented policies to 20 seeded players each, for up to 600 expeditions per player. Baseline and variants use identical policy seeds. Baseline inventory snapshots at D20/40/60/100/160/200 include actual acquired gear and runes. `scripts/v010-final-validation.cjs` replays each eligible snapshot in production combat with eight matched seeds spanning four paths and four elite types; 4,880 trials total. No full-Epic loadouts or live saves are used.

Run `node scripts/v010-progression.cjs baseline`, `node scripts/v010-final-validation.cjs`, `node scripts/v010-progression.cjs finalBow8`, or `node scripts/v010-progression.cjs finalCandidate`. Artifacts are `docs/v010-progression-*.json` and `docs/v010-final-ab-results.json`. The previous fixture-based A/B is in `docs/v010-combat-balance-proposals.md` and `docs/v010-combat-balance-results.json`; it is context, not the acquired-gear result.

These are **policy simulations**, not measured human time-to-D200. They omit manual tactical decisions, human decision time, network sync and PvP. Town purchases and crafting follow a fixed heuristic. Completion estimates depend on that heuristic and the 600-expedition horizon; the 20-player groups are small. Outcomes can diverge after a variant consumes RNG differently. The previous v0.9.3 reports used different policies, so their completion totals are not directly comparable.

## Earned inventories and matched combat

At D20/40/60/100/160/200 the baseline provided 51/39/26/15/9/8 distinct acquired inventories. D200 gear had median tier 180; among 65 equipped items, 42 were Epic, 9 Legendary, 12 Rare and 2 Uncommon. It was not an assumed full-Epic build. The table gives wins/trials (rounded percentages) for the relevant acquired inventories; each inventory has eight trials.

| Dungeon | Bow: base → 8/10/12% Barrier | Two-Handed: base → 1.85/1.90/2.00 factor | Frost: base → 40/50/60% slow bonus |
| --- | --- | --- | --- |
| D20 | 19 → 50/56/75% (n=16) | 56 → 73/80/87% (n=136) | 66 → 86/88/89% (n=56) |
| D40 | 72 → 88/94/97% (n=32) | 68 → 81/91/92% (n=96) | 77 → 77/79/81% (n=48) |
| D60 | 57 → 85/95/95% (n=40) | 72 → 85/85/93% (n=80) | 81 → 81/81/84% (n=32) |
| D100 | 100 → 100/100/100% (n=8) | 72 → 93/95/96% (n=80) | 79 → 79/83/83% (n=24) |
| D160 | no acquired Bow | 100 → 100/100/100% (n=40) | no eligible Frost set |
| D200 | no acquired Bow | 100 → 100/100/100% (n=32) | 100 → 100/100/100% (n=8) |

The 10% and 12% Bow variants approach ceiling wins by D40–60 and add much more remaining HP. The 8% version improves Bow but remains the least aggressive. The Two-Handed baseline already wins all tested D160/D200 combats, so even 1.85 adds surplus HP there; its D100 win rate jumps 21 points. Frost +40% has almost no effect after D20 and the single D200 Frost inventory is already at a ceiling. The small/high-level samples cannot establish Bow or Frost viability at D200.

Alternative screens on acquired gear: Fire direct +15% versus burning targets moved D20 wins 69→74% (72 trials) but made no win-rate difference at D60/D100; raising burn coefficient 0.17→0.21 likewise had negligible wins. Staff mana cost 13→11 had no win-rate effect at D40/D60/D100; Staff Barrier 3.5→8% max HP pushed D40 wins 63→84%, although Staff was already strong at D60–D200. Daggers critical Barrier 3%/4s moved D60 wins 58→83% (24 trials), but there was only one acquired D100 Daggers inventory and none at D160/D200. None has adequate late-game progression evidence for recommendation.

## Persistent D1–D200 progression

| Configuration | Casual D200 | Experienced D200 | Speed D200 | Total | Median deaths C/E/S | Median farming runs C/E/S |
| --- | ---: | ---: | ---: | ---: | --- | --- |
| v0.9.3 baseline | 0/20 | 3/20 | 5/20 | 8/60 | 3 / 8 / 35 | 456 / 413 / 451 |
| Bow Barrier 8% only | 0/20 | 4/20 | 6/20 | 10/60 | 3 / 6 / 35 | 449 / 409 / 451 |
| Bow 8% + Two-Handed 1.85 + Frost 40% | 1/20 | 9/20 | 9/20 | 19/60 | 3 / 5 / 33 | 442 / 328 / 348 |

The Bow-only improvement is concentrated in the Bow-preference cohort: 2/9 → 4/9 reached D200, versus Two-Handed preference 3/9 → 3/9. Those players can still switch weapons when an acquired item is better; this is a policy preference, not a Bow-only lock. The combined candidate sharply raises experienced/speed completion and collapses their farming demand. **Reject the combined candidate** as too likely to trivialize late progression.

Resource use remains finite. Median crafts and Fragments spent (Casual/Experienced/Speed) were 75/380/361 and 16,260/120,070/106,610 at baseline; Bow-only was 75/383/347 and 17,110/135,770/102,340. The median final equipped power was 1,742/3,134/2,188 at baseline and 1,896/3,316/2,000 with Bow-only. No negative currency or impossible unlock was seen in these runs. The Casual policy rarely advances because its conservative extraction and farming rules consume the 600-run budget; this is a model-policy bottleneck, not proof that the live game cannot reach D200.

## Validation and limits

`node --test tests/v010-progression.test.cjs` and `node tests/v091-legal-builds.cjs` pass. The existing `tests/v092-simulation-smoke.cjs` has a stale hard-coded Legendary catalog count (expects 21; production has 22); that unrelated assertion fails with either baseline or this harness. No production `index.html`, gameplay values, Firebase data/rules, or player saves were changed. Bow at D160/D200, late Frost/Daggers, manual skill use, and alternative town policies need more acquired-inventory coverage before any broader balance decision.
