# Wanderer v0.13 — Stage 6.6: Global Expedition Difficulty Audit

**Date:** 2026-11-20  
**Status:** COMPLETE — read-only native diagnostic; **no balance coefficient modified**.  
**Branch:** audit/v013-stage6  
**Native input revision:** 37a1752031cf0f146e15eb05b3aef82dca0e1867 (Stage 6.5)  
**Stage 6.6 CI:** https://github.com/Skinny-lfg/wanderer-game/actions/runs/44823710208  
**Native progression CI:** https://github.com/Skinny-lfg/wanderer-game/actions/runs/44820875805  
**Reproducible analyzer:** scripts/v013-stage66-expedition-audit.cjs

## 1. Scope and integrity

Analyzed the original six frozen Stage 6.5 account-trace JSON artifacts: **48 persistent native accounts, four shared seeds (9701–9704), twelve profiles, 1,640 attempts, 3,871 native combat encounters, zero runtime errors**. Each account starts at E1 with exactly starter gear, zero XP and zero Talent points; an actual native Boss win is required to unlock each next Expedition. Repeated attempts maintain earned rewards and equipment. **No guaranteed loot or artificial gear/XP**. CI downloaded the original artifacts by verified GitHub Actions run ID, checked source and native progression integrity, and passed **8/8 tests**.

Counts are from selected fights played by scripted agents, not independent player win rates. Unreached Expeditions are censored. In particular, the E6–E10 sample is survivor-selected; the growing account gear/talent advantage cannot be ignored.

## 2. Verified systemic scaling break

Active source: combat/expedition-progression.js, consumed by combat/v012-combat-core.js and loaded by index.html **before combat**.

The actual enemy reference is:

    E <= 5: R(E) = E
    E >  5: R(E) = 5 + ln(1 + (E-5)/5)

This reference drives the raw enemy HP, Attack and Defense formula. The following values were computed by loading the actual production module, not transcribed from old documentation.

| E | Enemy reference | Raw HP = 27 + 14R | Raw Attack = 4 + 3R | Gear tier |
|---|---:|---:|---:|---|
| 1 | 1.000 | 41.00 | 7.00 | Adventurer |
| 3 | 3.000 | 69.00 | 13.00 | Adventurer |
| 5 | 5.000 | 97.00 | 19.00 | Veteran |
| 6 | 5.182 | 99.55 | 19.55 | Veteran |
| 8 | 5.470 | 103.58 | 20.41 | Veteran |
| 10 | 5.693 | 106.70 | 21.08 | Veteran |

**Structural finding:** from E1 to E5 the enemy reference increases by 4.00 points; from E5 to E10 by just 0.69 points. Meanwhile player talent/gear growth continues. E5 also introduces the Veteran gear tier. The abruptly slower enemy scaling after E5 is a concrete, code-verified explanation *contributing* to reduced relative difficulty; it is NOT proof that all imbalance comes from this one coefficient.

Enemy actual HP/damage also depend on encounter size, role, risk, traits, conditions, Boss modifiers, specials, Barrier and player defenses. The table above is raw source scaling, not actual Boss HP/ATK in combat.

## 3. Real native difficulty over Expeditions

| Expedition | Accounts entered | Attempts | Boss wins | First-fight HP lost (mean) | Normal combat deaths/fights | Elite deaths/fights | Boss deaths/fights |
|---|---:|---:|---:|---:|---:|---:|---:|
| E1 | 48 | 670 | 28 | 47.52% | 109/905 | 95/248 | 79/107 |
| E2 | 28 | 208 | 24 | 29.78% | 8/368 | 14/81 | 51/75 |
| E3 | 24 | 214 | 21 | 32.32% | 23/358 | 10/80 | 50/71 |
| E4 | 21 | 190 | 21 | 27.63% | 4/340 | 15/89 | 61/82 |
| E5 | 21 | 171 | 19 | 31.89% | 8/311 | 9/73 | 49/68 |
| E6 | 19 | 59 | 18 | 23.14% | 0/116 | 2/34 | 12/30 |
| E7 | 18 | 24 | 18 | 13.87% | 0/50 | 0/12 | 4/22 |
| E8 | 18 | 41 | 18 | 17.50% | 0/78 | 0/24 | 13/31 |
| E9 | 18 | 31 | 18 | 17.75% | 0/63 | 0/14 | 4/22 |
| E10 | 18 | 32 | 18 | 14.42% | 0/75 | 0/24 | 2/20 |

- **E1–E5:** normal 152 deaths / 2,282 fights (6.7%); Elite 143 / 571 (25.0%); Boss 290 / 403 (72.0%).
- **E6–E10:** normal 0 / 382; Elite 2 / 108 (1.9%); Boss 35 / 125 (28.0%).
- **E7–E10:** normal 0 / 266; Elite 0 / 74; Boss 23 / 95.

These are **per-fight observed deaths** with correlated repeated attempts and selected routes; do not interpret them as independent victory-rate estimates. Late Elites stopped posing a fatal threat to this surviving population, while Bosses retained meaningful lethality. To validate exact **Boss > Elite > Tank > normal > Minion**, a future *matched native Tank versus Elite* fixture is needed: a normal combat room can include several roles and is NOT synonymous with Tank.

## 4. Fresh E1 and the agent decision problem

The original **first E1 attempt** of each profile always used the actual starter setup (Old Sword, zero earned talents, no profile-specific upgrades). Each of the twelve profiles has an identical **55.25% mean HP lost** in its first real fight across the same four seeds. Within each seed, the value was equal across all profiles. This is direct evidence that initial-room E1 attrition is **global rather than an exclusively Magic-build issue**.

Across all **670 E1 attempts**, **359 extracted** and just **107 reached a Boss**. Recorded E1 extraction reasons:

- Protect carried loot: 269
- Return to Camp for investment: 52
- Avoid dangerous room: 21
- Protect Bag from known threat: 14
- No legal path: 3

Thus a limited Boss nerf would not by itself resolve the high attempts-per-unlock: much of the observed behavior is legitimate attrition, loot preservation, Camp investment and routing before reaching the Boss. These may or may not match human choices and need independent validation.

## 5. Same 18 E10-successful accounts: changing power

Inspect the first attempt at each Expedition **for the same eighteen eventual E10-clearing accounts**, acknowledging that these are survivor-selected and have legitimately gained gear and talents:

| Expedition | Mean talent nodes on entry | Mean HP lost in first fight | First-attempt Boss wins / entries |
|---|---:|---:|---:|
| E1 | 0.00 | 55.32% | 0/0 |
| E3 | 9.28 | 29.77% | 1/6 |
| E5 | 20.22 | 28.34% | 2/6 |
| E6 | 25.44 | 16.08% | 8/12 |
| E7 | 27.50 | 12.70% | 12/16 |
| E10 | 33.00 | 12.98% | 12/14 |

The abrupt drop in relative early-room attrition from E5 to E6 is visible even when the set of accounts is held fixed. It may reflect enemy scaling, accumulated gear/talents, native encounter composition, or their interaction. It cannot be attributed exclusively to one cause without controlled experiments.

## 6. Verdict and proposed Stage 6.7 tests

**Stage 6.6 is an audit, NOT a balance patch.** The evidence identifies three interacting issues and one test gap:

1. **Structural progression curve:** enemy HP/ATK/DEF scaling becomes very flat just after E5 while earned player power continues to grow. The safest first candidate for E6–E10 tuning is to compare alternative enemy-reference curves in disposable worktrees. These must leave real gear, talents, Boss mechanics, rolls and rewards unchanged in each matched comparison.
2. **E1 universal early attrition:** initial rooms already consume ~55% HP for all profiles before they have meaningful builds. Measure the effects of *normal-room pressure* and early resource/route decisions separately. Do not assume Magic is inherently underpowered.
3. **Early Boss pressure and reaching the Boss:** E1–E5 Boss fights remain lethal; extraction policy means many E1 attempts never reach a Boss. Vary Boss combat coefficients, Boss preparation and agent withdrawal logic separately, preserving the actual map and loot mechanisms.
4. **Elite/Tank hierarchy at late levels:** Elites in E7–E10 caused 0 deaths among 74 observed fights; validate real matched Elite-versus-Tank encounters with identical loadout/seeds before changing global Elite multipliers.

**Recommended Stage 6.7:** a frozen Stage 6.4 build baseline and deterministic *paired native* experiment with multiple E1–E10 enemy-reference candidates, plus separate E1 starting-pressure and E5/E7 Elite/Boss stratifications. Only promote values after checking starter survivability, initial gear/talents, deaths per encounter type and natural-account unlock/attempt metrics.

**Not done:** no runtime stat modifications, no build buffs/nerfs, no forced loot, no saved-game migrations, no main merge or deploy.

The complete automatically generated machine-readable + Markdown audit and provenance checks are preserved as the artifact named **stage66-global-difficulty-audit** on the Stage 6.6 GitHub Actions run.
