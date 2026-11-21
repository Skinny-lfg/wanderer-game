# Wanderer v0.13 — Stage 6.21: early Boss pressure and genuinely earned E1–E15 follow-up

**Date:** 2026-11-21. **PR:** https://github.com/Skinny-lfg/wanderer-game/pull/118. **Successful matched native A/B:** https://github.com/Skinny-lfg/wanderer-game/actions/runs/44951071013. **Successful naturally earned E1–E15 campaign:** https://github.com/Skinny-lfg/wanderer-game/actions/runs/44951104663.

## What was changed in actual gameplay

The six named Affinity Bosses have **separate early HP/Attack reductions**, applied in their native combat spawn. The corrections are largest at E1, taper linearly and become **exactly zero at E30 and above**. They are designed to improve a weak-account entry bottleneck without turning later Bosses into weaker enemies than the balanced Stage 6.19 Elites.

| Boss | E1 HP reduction | E1 Attack reduction | E30+ |
|---|---:|---:|---|
| Carrion Matriarch (Decay) | 39% | 23% | Unchanged |
| Rift Harbinger (Blood) | 37% | 22% | Unchanged |
| The Abyssal Guardian (Aegis) | 29% | 18% | Unchanged |
| Stormglass Conductor (Magic) | 28% | 18% | Unchanged |
| Ember Sovereign (Fury) | 18% | 11% | Unchanged |
| Heartroot Devourer (Vitality) | 16% | 10% | Unchanged |

Two independent, readable implementation sites: `online/v013-boss-abilities.js` stores the per-style early curve and `combat/v012-combat-runtime.js` applies the HP and Attack scaling *only to native Bosses*. There are **no changes to normal mobs**, the approved individual Elite Stage 6.19 progression, boss unique mechanics, status effects, gear/loot chances, saved characters, Talents, XP, potions, Firebase, or production `main`. `docs/` runtime copies and asset-cache versions were updated for later previews.

## Strict native persistent-account four-way comparison

Six persistent fresh E1 accounts: **seeds 9701/9702 × cautious, balanced, magic-fire**, each starting with actual starter equipment and **zero earned XP/Talent points**. At most eight attempts per E, 16 total; first E1 Boss win required for E2, and another Boss win for E3. True native maps, Gold/Forge, merchant stock, earned loot, consumables, Boon discoveries, real talent allocations and player decisions throughout.

The previous `combat/v012-combat-runtime.js` is **reconstructed byte-exact** (Git blob SHA `6cf97b10add8610589e225bddbf6b7cc1ad10389`) in a test-only VM for matched old/new playthroughs. In experimental alternatives the additional normal-attack adjustment is also test-VM-local, and **was not added to gameplay**.

| Experiment (same seeds, profiles, legal caps) | Accounts unlocking E2 | Accounts unlocking E3 | Fresh first-fight HP lost | Boss combat deaths | Elite combat deaths |
|---|---:|---:|---:|---:|---:|
| Original live combat | 2/6 | 1/6 | 52.1% | 9 | 8 |
| Normal mobs E1–E2 damage reduced only | 2/6 | 2/6 | 37.0% | 9 | 11 |
| **Individual low-E Boss tuning only — chosen** | **4/6** | **3/6** | **52.1%** | **5** | **8** |
| Both adjustments | 4/6 | 2/6 | 37.0% | 4 | 14 |

**Decision:** the normal enemy damage alternative reduced opening HP attrition but did not increase E2 account clears and shifted deaths onto Elites. The combined variant did not improve E2 reach relative to Boss-only and reduced E3 reach. Consequently, only the **six Boss-specific lower-E scaling corrections** were promoted. Other experimental arms remain isolated tests. These six accounts reuse two seeds across three policies, so they prove a reproducible bounded improvement on this cohort, **not a universal win-rate guarantee**. Do not claim the normal-room E1 attrition problem is solved: it remains 52.1% in the chosen variant.

Validation: https://github.com/Skinny-lfg/wanderer-game/actions/runs/44951071013 — **success**, strict Stage 6.21 structural native tests, zero runtime errors, and repeatable 4-arm persistent-account outcomes. Raw original/candidate/Boss-only/combined histories in artifact `stage621-baseline-native-earned-e1-e3`.

## Second test: E1→E15 using genuinely earned permanent accounts

Four **fresh** accounts (seeds 9701 and 9702 × cautious/balanced) with maximum **18 attempts per Expedition, 100 attempts total**. They used the *actual corrected game code*, no test-only gameplay override, no free item, forced loot, synthetic Talent XP, forced Boss placement, arbitrary level unlock or automatic victory. They chose actual native map routes, bought with earned Gold, equipped natural/forged gear, obtained native Boons/potions and fought actual Bosses. Each E advance followed winning the previous Boss.

**131 attempted Expeditions, 0 native runner errors.** All four cleared E1 and E2. Only **one** reached E5 and, on that same long-running persistent account, reached and won E15.

| E | Accounts actually entering | Native attempts | Boss encounters | Boss wins | Extractions | Deaths |
|---|---:|---:|---:|---:|---:|---:|
| E1 | 4 | 21 | 7 | **4** | 12 | 5 |
| E2 | 4 | 19 | 6 | **4** | 11 | 4 |
| E3 | 4 | 28 | 4 | **3** | 17 | 8 |
| E4 | 3 | 50 | 13 | **1** | 31 | 18 |
| E5 | 1 | 2 | 1 | **1** | 1 | 0 |
| E6 | 1 | 2 | 2 | **1** | 0 | 1 |
| E7–E15 | 1 per E | 1 per E | 1 per E | **1 per E** | 0 | 0 |

**All three accounts not reaching E5 are censored, not losses at E5 or E15.** The survivor's E5/E15 wins are **genuine** but represent only **one survivor-selected account** and cannot determine a calibrated win percentage for the population at those levels. At **E5**, the single Boss entry was **genuinely prepared by defeating the marked Elite** (no Reliquary), and won; across its two E5 attempts, the account selected **four Boons**, used **one potion**, and made two real gear upgrades. At **E15**, the single Boss entry had **both marked-Elite and Reliquary preparation**, and the winning attempt included **one earned Boon, one legally used potion and one gear upgrade**. The account brought its earned persistent gear and Talents in both cases. The unselected or failed build routes were not given artificial gear/XP to reach E5 or E15.

Account outcomes:
- Seed 9701 / cautious: E4 unlocked; unable to beat E4 in 18 attempts.
- Seed 9701 / balanced: E3 unlocked; unable to beat E3 in 18 attempts.
- Seed 9702 / cautious: E4 unlocked; unable to beat E4 in 18 attempts.
- Seed 9702 / balanced: **E16 unlocked** after beating E15 naturally.

Full native traces archived in artifact `stage621-real-native-earned-e1-to-e15-accounts`, CI https://github.com/Skinny-lfg/wanderer-game/actions/runs/44951104663 — **success**.

## Findings and next decision

1. **Early Boss pressure, not just normal-room damage, was the clearest immediate fix** for the E1→E2 gate in tested accounts. The correction works in native code and leaves E35/E70 gameplay Boss power unchanged.
2. **E4 is the new dominant bottleneck** for this small cohort: 50 attempts for three accounts, only one Boss victory out of 13 entered Boss encounters (five of those 13 had legitimate marked-Elite or Reliquary preparation) and 31 extractions. The severe per-attempt challenge of E4 needs focused diagnosis by Boss identity, affixes, escorts, and gear before another numeric change.
3. **Late levels may be too easy for survivor builds**, but E7–E15 observations are 1/1 per level from the same well-equipped survivor and absolutely do **not** justify increasing all late Boss HP/Attack or declaring final balance.
4. **E1 normal-room attrition is still high** (~52% first fight), and Magic Fire did not clear E1 within the 8-attempt comparison. However its normal-mob HP/Attack experiment did not improve E2 reach and increased Elite deaths, so further global early mob nerfs were rejected.
5. Next focused stage should study E3–E5 natural blockers and preserve the user's hierarchy Boss > Elite > Tank > regular. Correct by named Boss/encounter where evidence supports it, not by broad group modifiers. Any claims of naturally prepared Boss odds need more truly independent seeds with complete preparation and earned potion/boon access.

**No production deploy**. The canonical `audit/v013-stage6` branch and the existing approved Stages 6.18–6.20 are preserved.
