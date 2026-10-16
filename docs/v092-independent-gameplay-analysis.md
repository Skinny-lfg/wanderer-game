# Wanderer v0.9.2 — Independent gameplay, loot and progression analysis

**Date:** 2026-10-16  
**Branch:** development only  
**Production code audited:** index.html blob `1698b0e1aa6e7776c156c6069c550d6959fb5886`  
**Status:** analysis only. No changes to gameplay code, drop rates, Firebase, saves or main.

## Executive findings

1. **The critical uncertainty is gear acquisition and death recovery, not raw combat time.** A fresh equal-tier Epic Sword/Shield-3-point fixture won D1–D199 in 39.08 minutes of simulated combat (9.77 minutes at 4x), but this assumes a completely new Epic loadout at every level and excludes all farming, extraction, menus and defeats. **It is not a player completion-time estimate.**
2. **Progression is very sensitive to extraction decisions.** In 1,440 stateful, scripted expeditions (12 runs of 120 attempts, paired seeds), a cautious extraction policy reached unlocked depth D10–D14 without dying; more aggressive policies often lost unprotected equipment and stalled before D10. These are narrow Sword/Shield policies, not real-player statistics.
3. **Legendary overall rarity did not decrease when the catalog grew to 21 items.** Based on production odds, a clean, no-farming D1–D199 route has roughly 6.95 expected Legendary drops at CHA 5, or 7.86 at CHA 55. Specific identities may therefore be hard to obtain.
4. **Scaling depends heavily on equipment quality.** The single-seed-per-level ideal Epic Sword screen cleared 199/199 levels, but a scripted mixed-rarity, under-tier Sword setup won only 8/199 independently constructed attempts. This does *not* quantify a player's odds of progressing: inventory acquisition, runes and optimal builds were excluded.
5. **Do not ship a global drop-rate or enemy-scaling change on this evidence alone.** First correct Crystal's tooltip discrepancy and gather measured save-aware progression traces / actual player outcomes.

## Methods and reproducibility notes

This analysis executed the actual inline production JavaScript extracted from index.html, using an isolated JavaScript execution environment. Calls to `startDungeon`, `nextEncounter`, `updateFight`, `winEncounter`, `extract`, `die`, `equipItem`, `getPaths`, `totalStats`, `comparisonEquip`, `makeItem`, `craftCost` and `salvageOne` retained production implementations (except as stated). Random numbers used a seeded LCG: `seed=(imul(seed,1664525)+1013904223)>>>0`, divided by 2^32. UI, timers, animation and save writes were no-ops. No live accounts, Firebase data or browser saves were touched.

This is **not** a validated full-player simulator: purchase decisions, click overhead, human recovery, cloud conflicts and real menu flows are not faithfully modeled. Existing Phase 2 results (200 combat trials; 5,000 victory reward samples) and Phase 3 audit supplied the prior baseline; the measurements below are additional, separate runs.

### A — Idealized D1–D199 combat screen

- Every dungeon level was created as an independent encounter fixture, **not** a continuous inventory trajectory.
- Each fixture had nine compatible, equal-level Epic items (eight for two-handed builds), a 3-piece primary affinity, no runes, and a genuine production combat / loot-resolution loop.
- Seeds used `730000+97*level` with seeded gear generation and a separate combat seed; one elite assignment and one realization per level. Bosses occurred at production multiples of ten.
- Death was reduced to a terminal simulated failure, so this test explicitly does not model recovery after defeat.

| Main weapon | Independent D1–D199 clears | Total simulated combat time incl. failures | Time divided by 4 |
|---|---:|---:|---:|
| Sword Epic | 199 / 199 | 39.08 min | 9.77 min |
| Mace Epic | 199 / 199 | 42.78 min | 10.69 min |
| Staff Epic | 193 / 199 | 32.60 min | 8.15 min |
| Two-Handed Epic | 196 / 199 | 28.16 min | 7.04 min |
| Sword mixed (Uncommon/Rare/Epic, tier .75–1.0×) | 8 / 199 | 42.13 min | 10.53 min |
| Sword lower (Common/Uncommon/Rare, tier .6–1.0×) | 4 / 199 | 28.27 min | 7.07 min |

**Important:** The failure rows do not yield complete route times; dividing their combat sums by four is merely a timer conversion. Even the 199/199 successful Epic cases **cannot** be achieved through the actual acquisition economy without more evidence.

Sword Epic cumulative combat time, if every level is already appropriately geared: to finish D10 145.6 s; D25 405.1 s; D50 809.2 s; D100 1,442.9 s; D150 1,951.2 s; D199 2,344.6 s.

An unlock route to D200 needs **199 highest-unlocked successful clears**, totaling **815 waves** (180 four-wave dungeons and 19 five-wave boss dungeons). Clearing D200 adds one more five-wave boss run. There are at least 815 manual wave-start events in this route, plus dungeon selection, entering and extracting; none of that interface time is included in the measured combat values.

### B — Persistent, policy-driven early progression pilots

- Three *paired* seeds: **2200, 2201, 2202**. Four strategies × 120 expedition attempts = **1,440 full stateful attempts**.
- The same production combat, rewards, extraction, death equipment loss, protection, inventory equip, dungeon offers and salvage functions were used. A simplified Forge policy deducted the actual production Fragment cost and called `makeItem(..., 'forge', ...)`, matching the production Forge handler.
- All policies were **Sword/Shield focused**, replaced equipment when production Gear Power increased, protected their sword and next most valuable worn item, chose from the three actual available dungeon offers favoring missing slots, and automatically claimed the first offered boss rune. Merchant purchases, selling valuables, player-click overhead and human judgment were absent.
- Extraction was triggered after a cleared wave at under **58% current HP** (cautious), **38%** (balanced/craft-heavy), or **12%** (risky). Forge budgets per expedition were 2/2/5/2 attempts respectively for cautious/balanced/craft-heavy/risky, limited by actual Fragments.

| Policy | Highest unlocked dungeon, seeds 2200 / 2201 / 2202 | Deaths across 360 attempts | Early extractions across 360 | Result |
|---|---|---:|---:|---|
| Cautious + Forge | D10 / D10 / D14 | 0 | 329 | Slow, but accumulates safe equipment |
| Balanced + Forge | D5 / D5 / D7 | 184 | 162 | Significant unprotected gear loss |
| Risky + Forge | D4 / D2 / D1 | 342 | 14 | Repeated losses and resource starvation |
| Craft-heavy, 38% HP threshold | D5 / D5 / D7 | 184 | 162 | **Identical** to balanced in these seeds: limited by available Fragments, not craft-attempt budget |

Only the cautious seed 2202 completed D10 within 120 attempts: at attempt 88, after 25.6 minutes of cumulative simulated 1x combat (about 6.4 minutes of 4x combat before menus). Others had not finished D10 by 120 attempts. **These are not estimated times for real players or percentile completion distributions.** A player could make better decisions, choose different items, use merchant, change weapons, or actively farm an earlier dungeon. The automated thresholds can be overly cautious or recklessly inefficient; small seed samples do not justify extrapolation to D200.

An additional separate exploratory cautious run with seed 2200 and a **150-attempt** cap reached unlocked D15 (14 clears, 136 early extractions, 0 deaths, 50 Forge crafts, 2 Legendary drops, 2,449.15 s of cumulative combat). Do not pool this result with the paired 120-attempt table.

**Early-game observed trace:** a protected Training Sword alone at D1 with seed 1234 fell from 115/115 HP at entry to 85 after wave 1, 52 after wave 2, and 16 after wave 3, then died before completing wave 4. This illustrates why timely extraction and gear upgrades matter, but one seed is not a universal failure probability.

**Recovery caveat:** the browser's production `load()` restores a Training Sword when both equipped gear and stash are empty. The in-process simulator did not simulate refreshing the page, so permanently gearless policy stalls would be overstated if interpreted as actual account softlocks.

## Legendary economy: expected drops on a straight route

These results were calculated directly using production `waveLootOdds` and `dungeonEquipmentOdds`. A 'straight route' assumes every dungeon from D1 through D199 completes once, with no bonus farming, restarts or discarded loot.

| Character CHA | Expected Legendary drops per normal 4-wave clear | Expected per 5-wave boss clear, incl. 35% extra roll | Total expectation before unlocking D200 |
|---|---:|---:|---:|
| 5 | 0.02978 | 0.08378 | **6.95** |
| 55 | 0.03254 | 0.10544 | **7.86** |

With 21 catalog identities, overall Legendary rarity and specific-name rarity are different questions. If the 13 dungeon themes were equally represented and Legendary drops independently used their current weighted category distributions, the *conditional* chance that a Legendary drop has one given identity would average approximately:

| Example identity | Mean share of Legendary drops across equal-weight themes | Most favorable dungeon |
|---|---:|---|
| Crescent of the Emberveil (Off-Hand Dagger) | 1.34% | Any available theme only weakly favors this subtype |
| Blade of the First Dawn (Sword) | 2.94% | Venomous Temple: 25% conditional |
| Cuirass of the Last Sunrise (Armor) | 9.93% | Iron Bastion / other armor-favored themes: 20% conditional |

These are **not actual player acquisition probabilities**, since dungeon offers, route choices, repeat runs and RNG introduce selection effects. They show why simply having 21 Legendary names does not guarantee each feels accessible. A global Legendary buff would also increase all other drops; themed targeting, exchange or limited duplicate protection can improve agency more precisely.

The previously collected Phase 2 sample of 5,000 victory rewards observed **94 Legendary drops vs. 94.61 expected**, consistent with correct configured rarity. The independently computed straight-route expectations above do not contradict it; the samples have different distributions of waves, tiers and CHA.

## Prior confirmed findings carried forward

- **Crystal set tooltip:** the wording implies every third charged strike; code applies the proc on every third main attack, with a 10-second Crystal Burst cooldown. Align text with observed behavior before release; change balance only if separately approved.
- **21 unique names/art != 21 unique skills:** Legendary main weapons use the existing first-attack damage mechanic, but every identity does not have an exclusive ability.
- **D30–D60 Staff and Two-Handed:** Phase 2 saw 5/8 and 6/8 wins at D50 respectively under matched Epic fixtures. Too few observations for a balance patch; test elite burst and mixed-tier gear more thoroughly.
- **High-investment late-tier relative easing:** matched full-Epic setups become faster and safer at higher tiers; this is not evidence that a naturally acquired, under-tier loadout can cruise to D200.

## Recommendations in priority order

1. **Do not change global Legendary odds yet.** First define the intended rarity of a *specific* Legendary and whether themed farming / future affinity crafting should mitigate duplicates. Validate against per-player histories, not pooled loot.
2. **Fix Crystal's tooltip and verify 2/3/5 set affordances.** This is a focused consistency bug and does not require a broad combat rework.
3. **Make extraction and protection very clear in the first few dungeons.** Fresh-gear death loops are possible when players push too early; leaving safely and building a stash is part of the core learning curve.
4. **Improve midgame tuning via focused matched-seed trials.** Reproduce D30/D40/D50/D60 Staff and Two-Handed failures before any numeric buff. Evaluate real runes and partly outdated gear.
5. **Only then evaluate late-tier enemy scaling and D200 speedrun time.** The most important missing measurement is how good equipment becomes *available*, not how fast an assumed perfect character clears.

## What this study cannot claim

- No statistically defensible P10/P50/P90 *player* times to D200; none of the stateful policies completed that progression.
- No measurement of actual menu/click delay, network/cloud saves, player learning or official leaderboard active time.
- No prediction of real-player retention, a 'best' weapon or a guaranteed Legendary rate.
- No proof that the D200 players observed in the wild used an exploit.
- The policy trials are heuristic comparisons (three seeds each) and not representative samples of all possible builds or skill levels.

**Release decision:** keep gameplay values unchanged pending targeted follow-up; this report is diagnostic rather than a v0.9.2 release authorization.
