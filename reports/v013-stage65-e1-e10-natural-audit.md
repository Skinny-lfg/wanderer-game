# Wanderer v0.13 — Stage 6.5: Natural progression E1–E10

**Date:** 2026-11-20  
**Status:** Complete native campaign; functional simulator verified; balance **NOT READY**.  
**Branch:** audit/v013-stage6  
**Tested revision:** 37a1752031cf0f146e15eb05b3aef82dca0e1867  
**CI and downloadable original traces:** https://github.com/Skinny-lfg/wanderer-game/actions/runs/44820875805

## Test design

- 48 independent persistent native E1 accounts, 12 strategies over four shared seeds (9701–9704), using actual starter equipment and **zero starting talent points**.
- Native progression to E10 only via defeating the actual previous Expedition Boss; XP, earned loot, Forge, Merchant, talents, Gold and potions persist between attempts. **No guaranteed loot, fabricated XP/gear or forced unlock.**
- Up to 18 attempts per Expedition and 85 attempts total per account; unreachable levels are **censored**, never treated as defeats.
- Native decision agent with legal room paths, actual target clicks, native combat, potions and Camp actions. Agent decisions do not represent measured human play.
- Production Stage 6.4: Magic Infusion available in every element; cost 12 Mana, Arcane specialization 10 Mana; physical 85% SP / Wand 35% SP / Staff 95% SP. Empty-Mana Wand/Staff autoattack uses weak physical damage.
- **1,640 native attempts; 0 runner errors.** The validation and six cohorts completed successfully; aggregate CI passed.

## Progression by Expedition

| E | Accounts entered | Attempts | Accounts clearing E | Boss encounters | Boss combat deaths |
|---|---:|---:|---:|---:|---:|
| 1 | 48 | 670 | 28 | 107 | 79 |
| 2 | 28 | 208 | 24 | 75 | 51 |
| 3 | 24 | 214 | 21 | 71 | 50 |
| 4 | 21 | 190 | 21 | 82 | 61 |
| 5 | 21 | 171 | 19 | 68 | 49 |
| 6 | 19 | 59 | 18 | 30 | 12 |
| 7 | 18 | 24 | 18 | 22 | 4 |
| 8 | 18 | 41 | 18 | 31 | 13 |
| 9 | 18 | 31 | 18 | 22 | 4 |
| 10 | 18 | 32 | **18** | 20 | 2 |

**Observation:** 20/48 accounts never cleared E1; another 10 stalled between E2 and E6. All 18 that cleared E6 eventually cleared E10 within the budget. Do not confuse eventual account clears with a 100% per-attempt success rate: E10 alone contained 20 Boss encounters with 18 victories and two Boss deaths, in a survivor-selected subset.

## By build (account clears / 4)

| Profile | E1 | E3 | E5 | E10 |
|---|---:|---:|---:|---:|
| Balanced | 4 | 4 | 4 | 4 |
| Cautious | 4 | 4 | 4 | 4 |
| Plate Warden | 4 | 4 | 4 | 4 |
| Magic Fire | 2 | 1 | 1 | 1 |
| Magic Frost | 2 | 2 | 2 | 1 |
| Magic Lightning | 1 | 0 | 0 | 0 |
| Magic Arcane | 2 | 1 | 0 | 0 |
| Magic Staff (Fire preference) | 2 | 2 | 2 | 2 |
| Magic Wand (Fire preference) | 2 | 2 | 1 | 1 |
| Cloth Battlemage (Magic + Aegis) | 2 | 1 | 1 | 1 |
| Hexblade Hybrid (Magic + Decay) | 1 | 0 | 0 | 0 |
| Leather Duelist | 2 | 0 | 0 | 0 |

**Defensive progression gap:** Balanced, Cautious and Plate Warden reached E10 in 12/12 accounts combined, vs 6/36 among the remaining nine profiles. This reflects both build choices and scripted tactical/retreat policies, not an isolated Armor or Affinity coefficient experiment.

**Caster E10 feasibility verified with real equipment:** Magic Staff completed E10 with an actual Staff equipped in seeds 9701 and 9704; Magic Wand won E10 while wielding Wand in seed 9704. Magic Fire's E10 winner wielded Staff, and Magic Frost's E10 winner wielded Wand. All such equipment was obtained naturally.

## Actual early Mana pressure

Only combats whose equipped main weapon was **Wand or Staff** are included below. Funded attacks are native paid weapon casts, while fallback hits are automatically used weak physical attacks because of insufficient Mana.

| E | Funded Wand/Staff casts | Low-Mana fallback attacks | Fallback share |
|---|---:|---:|---:|
| 1 | 4,213 | 2,301 | **35.3%** |
| 2 | 892 | 101 | 10.2% |
| 3 | 2,058 | 303 | 12.8% |
| 4 | 1,785 | 31 | 1.7% |
| 5 | 1,709 | 5 | 0.3% |
| 6–10 | 1,471 | 0 | 0% |

These are **attacks**, not independent player samples. Insufficient Mana is a real pressure point in E1–E3 but essentially disappears by E5 among the observed surviving accounts. Therefore raising the Arcane Infusion cost further could disproportionately penalize early Magic without changing late-game damage.

## Talent and equipment progression

Across six pure Magic profiles (Fire, Frost, Lightning, Arcane, Staff-specialist and Wand-specialist), only **201 of 380 E1 attempts (52.9%)** actually entered the Expedition wearing Wand/Staff; the other 179 E1 attempts used a physical main weapon. Weapon preferences in the agent are not guaranteed loot. Magic Fire's E1 attempts entered with the Magic Affinity root in **33/61**, and with Element Choice in **18/61**. Many early failures happen before the intended caster talent and gear combinations have fully formed.

Magic Staff and Magic Fire have correlated early behavior under shared seeds, so their rows are not independent replications. The four seeds are shared across all 12 profiles; 48 account runs do not mean 48 independent map seeds.

## Recommendations (before Stage 6.6)

1. **Do not globally buff Magic or nerf all Bosses yet.** Pure casters can reach E10, but early survival/resource access is poor.
2. Conduct controlled native E1–E3 same-seed comparisons of early Mana costs/regen, legally earned talent paths, real equipment-acquisition policies and target/retreat strategy. Make one change at a time. **Do not introduce guaranteed loot.**
3. Specifically test whether Arcane Infusion's 12/10 Mana cost is too restrictive at E1 while preserving the weak zero-Mana autoattack.
4. Investigate Boss-entry HP and boss/Elite targeting in E1–E5; 79 of 107 E1 Boss encounters ended in death and account-level E1 progression is the principal bottleneck.
5. Reassess E6–E10 scaling only after accounting for survivor selection and the accumulated native gear/talent advantages of those 18 accounts.
6. Run more independent seeds before changing definitive damage coefficients. Historical Stage 6 E1/E2 results are not direct A/B comparisons because game mechanics and natural agent versions have changed.

**Limits:** fixed finite retries, scripted rather than human decisions, shared seeds, correlated progression, no direct randomized isolation of Mana versus Armor/gear, and only 18 E10-reaching accounts. No gameplay balance, loot probability, branch merge, deployment or real player saves were changed in this diagnostic.

**Artifacts:** the GitHub Actions run contains six individual original account JSON trace archives, source SHA-256 provenance, plus the combined machine-readable/Markdown Stage 6.5 summary.
