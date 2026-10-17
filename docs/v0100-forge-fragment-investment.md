# Wanderer v0.10.0 — Forge investment research

**Date:** 2026-10-17  
**Scope:** Research-only simulation. No gameplay, Firebase, main, or player-save edits.  
**Source:** User-supplied v0.10.0 main ZIP, index.html SHA-256 a69bef5e2f1d0842f79b692839012ab9e621a6b07cda0ba4a2fedef858b36126. Subsequent commits are not validated.

## Question and mechanics

Can extra Fragments per Forge craft improve the chance of Rare/Epic without producing Legendary, while reducing repetitive crafting and preserving D1–D200 balance?

All experiments use actual item creation, rarity rules, combat, loot, town, protection, recovery, Merchant and inventory progression in an isolated production-code Node VM. The Forge bonus was **in-memory only** and charged extra Fragments in addition to the actual base cost. It changed rarity odds alone; all source equipment slot/subtype, affinity, stats, and Legendary exclusions were preserved. When an agent lacked the reserve to pay the supplement, it crafted normally. An optional targeted strategy invested heavily only in its weakest eligible slot.

### Experimental Forge chances at tier 100 (frontier 101)

| Mode | Total Fragments | Common | Uncommon | Rare | Epic | Legendary |
|---|---:|---:|---:|---:|---:|---:|
| Normal | 1,010 | 47.8% | 30.0% | 15.4% | 6.8% | 0% |
| +50% cost | 1,515 | 39.8% | 28.0% | 22.4% | 9.8% | 0% |
| +100% cost | 2,020 | 30.8% | 27.0% | 29.4% | 12.8% | 0% |
| +150% cost | 2,525 | 21.8% | 26.0% | 36.4% | 15.8% | 0% |
| Aggressive +100% cost | 2,020 | 23.8% | 24.0% | 35.4% | 16.8% | 0% |

At the same fixed 100,000 Fragment budget and tier 100, expected Epic output is approximately **6.71 / 6.46 / 6.33 / 6.25 / 8.31**, respectively. Thus modest bonuses save crafting *actions*, not Fragments per Epic; the aggressive variant improves Fragment efficiency but carries greater balance risk. These are expectations, not guaranteed counts.

## Persistent D1–D200 comparison

**180 campaigns, 36 per arm, 12 matched seeds (931200–931211) × 3 automated player policies, up to 600 expeditions each.** Same smart decision/town policy for every arm. Five cases: control, +50%, +100%, aggressive +100% and opportunistic max +150%. Divergent RNG consumption after early actions limits strict counterfactual interpretation.

| Arm | D200 /36 | Casual / Experienced / Speed | Median depth | Median crafts | Median extra Fragments invested | Median farming |
|---|---:|---|---:|---:|---:|---:|
| Control | 18 | 5 / 7 / 6 | 191.5 | 409.5 | 0 | 284 |
| +50% | 14 | 4 / 6 / 4 | 136.5 | 298.5 | 64,037.5 | 317 |
| +100% | 20 | 6 / 6 / 8 | 200 | 309.5 | 74,820 | 255 |
| Aggressive +100% | 16 | 3 / 5 / 8 | 190.5 | 315 | 74,315 | 285.5 |
| Opportunistic +150% | 18 | 5 / 7 / 6 | 189.5 | 391.5 | 35,002.5 | 291.5 |

**Paired bootstrap 95% intervals:** 15,000 cluster resamples of 12 seeds; unadjusted for multiple testing. Completion differences vs control:
- +50%: −11.1 percentage points, interval [−38.9, +11.1].
- +100%: +5.6 p.p., interval [−11.1, +22.2].
- Aggressive +100%: −5.6 p.p., interval [−30.6, +16.7].
- Opportunistic +150%: 0.0 p.p., interval [−22.2, +19.4].

**None establishes a reliable increase or decrease in D200 completion.** Crafting activity, however, fell on average by **84.9 / 74.8 / 71.5 / 25.4 crafts** respectively compared with control, with all 95% intervals below zero. The median +100% variant uses ~24% fewer crafts (309.5 vs 409.5), at material Fragment cost.

In the complete campaign batches, rarity Epic among Forge products was **6.95% control, 8.26% (+50%), 8.97% (+100%), 10.38% (aggressive), 7.98% (opportunistic)**; these aggregate mixes include unboosted crafts and different tier/gap distributions, so they are *not* the advertised per-craft probabilities above. No Forge Legendary.

## Verification and safety gates

- 375,000 actual Forge item generations (15,000 per tier × 5 tiers × 5 curves); observed rarity frequencies near expectations; 0 Forge Legendary.
- 144 combinations of dungeon frontier/tier/investment/plan checked for nonnegative normalized rarity odds. The research runner caps transferred probability mass on very old-tier crafts.
- Six control campaign replays matched the earlier no-booster production harness exactly.
- 180 campaigns finished with zero simulation errors and zero negative end-of-run balances. All campaigns enforce nonnegative Gold/Fragments during execution. Unchanged index.html SHA-256.
- No browser/Firebase/network or human-play testing. A 12-seed clustered population is too small for definitive balance decisions. Game code and main branch were never modified.

## Decision

**Do not ship an economy buff yet.** Forge-quality spending is a viable experimental feature and creates a meaningful *quality-per-click versus quality-per-Fragment* tradeoff. The moderate +100% investment is a useful UX prototype, **not** an approved balance coefficient. The aggressive variant may increase Epic availability too much per Fragment. Keep Legendary excluded and display exact price and probabilities at confirmation. Validate real user choices and run independent-seed campaigns before a release.

Next isolated studies, **not tested here**:
1. Legendary item strengthening: compare a maximum of 10 upgrades versus unlimited growth, with increasing Fragment costs and only bounded item-stat scaling; preserve unique skills and affinity.
2. Merchant-bought **Affinity Sigils** (distinct from combat runes): Gold purchases; the Forge spends Sigils plus Fragments to roll a higher chance of changing the affinity of a **non-Legendary** item. Reject affinities outside each item's legal subtype pool. Compare failures that destroy only the Sigil versus failures that also remove the old affinity. Do not allow Legendary affinity rerolls.

Full individual trajectories, exact research scripts, odds sampling, bootstrap inputs, and a Portuguese detailed report are available in the investigation's conversation attachment: Wanderer_v010_Forge_Testes_e_Scripts.zip.
