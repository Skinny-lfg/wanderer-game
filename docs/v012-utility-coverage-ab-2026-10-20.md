# Wanderer v0.12 — Utility coverage A/B for three affinity pairs

**Date:** 20 October 2026  
**Branch:** development only  
**Status:** Experiment complete, gameplay unchanged. No main, deploy, Firebase or real save changes.

## Objective and intervention

Compare a baseline two-affinity build with a policy that prioritises an existing third-family utility skill after the core pair is unlocked, rather than increasing damage/healing coefficients. The two arms keep the same initial seeded world, gear, Runes, weapons, rarity, enemy formulas and valid passive offers.

| Core pair | Utility family | Existing skills sought | Purpose |
|---|---|---|---|
| Blood + Decay | Vitality (+ Blood Drinker from Blood) | Blood Drinker, Renewal, Strong Heart, Life Bloom, Second Breath | More HP recovery |
| Vitality + Aegis | Fury | Quick Hands, Precision, Double Strike, Brutal Crit | More offensive output |
| Fury + Magic | Vitality | Renewal, Strong Heart, Life Bloom, Second Breath | More HP recovery |

The policy *prioritises the first two support picks*; it does not grant them. Real offers and the 3-family cap remain binding. Later support picks may still occur when offers leave few alternatives. It does not represent an optimally planned human character.

**Method:** native 15-Realm controller, real JS combat and draft, 7 weapons, Rare/Epic complete equipment at the Expedition tier, three same-tier Runes, no potions, events declined, no mid-Expedition item upgrades and no farm across runs. Starting seeds and loadouts are paired; later decision/RNG consumption may diverge.

## Completed simulation batches

- **Batch A:** 1,008 simulated Expeditions (E10/E50/E100/E200; 42 per pair/level/arm). Source commit 587f8bfeeee9d40a710695e20c1a3d533808de44. [Actions run 39488588536](https://github.com/Skinny-lfg/wanderer-game/actions/runs/39488588536).
- **Independent Batch B:** 2,016 simulated Expeditions (E50/E200; 168 per pair/level/arm). A separate +17,000,000 seed offset and 12 repeats. Source commit 06ac17ae22688715a67c2db9b3f93e5967d3b9f3. [Actions run 39489001425](https://github.com/Skinny-lfg/wanderer-game/actions/runs/39489001425).
- **Total: 3,024 completed combat runs, 0 errors, 0 timeouts.** The second CI run also passed 220/220 Node tests, 0 failures. Each Actions run archives full trajectory data.

## Batch A — wins per 42 attempts

| Expedition | Pair | Original | Utility policy |
|---|---|---:|---:|
| E10 | Blood + Decay | 1 | 0 |
| E10 | Vitality + Aegis | 1 | 2 |
| E10 | Fury + Magic | 2 | 1 |
| E50 | Blood + Decay | 1 | 1 |
| E50 | Vitality + Aegis | 1 | 1 |
| E50 | Fury + Magic | 1 | 0 |
| E100 | Blood + Decay | 0 | 1 |
| E100 | Vitality + Aegis | 3 | 4 |
| E100 | Fury + Magic | 4 | 3 |
| E200 | Blood + Decay | 4 | 2 |
| E200 | Vitality + Aegis | 5 | 9 |
| E200 | Fury + Magic | 5 | 6 |

## Batch B — independent confirmation (wins per 168 attempts)

| E | Pair | Original | Utility | DPS original → utility | Mean Realms original → utility |
|---|---|---:|---:|---|---|
| E50 | Blood + Decay | 1 | 1 | 444.22 → 439.54 | 5.95 → 5.94 |
| E50 | Vitality + Aegis | 1 | 2 | 428.63 → 441.36 | 6.64 → 6.54 |
| E50 | Fury + Magic | 3 | 3 | 493.49 → 483.11 | 6.57 → 6.17 |
| E200 | Blood + Decay | 22 | 19 | 2529.65 → 2491.20 | 7.98 → 8.04 |
| E200 | Vitality + Aegis | 31 | **37** | 2450.42 → **2578.85** | 8.39 → 8.37 |
| E200 | Fury + Magic | 41 | 39 | 2955.55 → 2906.35 | 9.51 → 9.16 |

**Paired E200 wins gained/lost within Batch B:**
- Blood+Decay: 1 gained, 4 lost; net -3
- Vitality+Aegis: **9 gained, 3 lost; net +6**
- Fury+Magic: 2 gained, 4 lost; net -2

**Effect on actual healing/Barrier in E200 Batch B:**
- Blood+Decay: Heal/s 0.73 → 6.22; Barrier/s 7.16 → 7.27; wins decline 22 → 19.
- Vitality+Aegis: Heal/s 21.14 → 19.88; Barrier/s 11.49 → 10.72; DPS rises ~5.2%, wins rise 31 → 37. Fury was actually unlocked in only **82/168** utility attempts; target-pair hybrids present in 75/168 vs 73/168 baseline.
- Fury+Magic: Heal/s 0 → 3.74; Barrier/s 7.13 → 7.34; DPS declines ~1.7%, wins decline 41 → 39.

## Pooled independent samples, A + B (210 trials per pair/E/arm)

| E | Pair | Original wins | Utility wins |
|---|---|---:|---:|
| E50 | Blood + Decay | 2/210 | 2/210 |
| E50 | Vitality + Aegis | 2/210 | 3/210 |
| E50 | Fury + Magic | 4/210 | 3/210 |
| E200 | Blood + Decay | 26/210 | 21/210 |
| E200 | Vitality + Aegis | **36/210 (17.1%)** | **46/210 (21.9%)** |
| E200 | Fury + Magic | 46/210 | 45/210 |

The positive Vitality+Aegis+Fury signal appears in both independent seed batches. This remains exploratory: the intervention changes route *and* pick priorities, gear is artificially on-tier, and we tried multiple comparisons. Do not infer real-player win rates or attribute the entire effect to one skill.

## Conclusions and next steps

1. **Vitality + Aegis + Fury is worth additional player-realistic testing.** It improves E200 clear rate and DPS with a moderate sustain tradeoff. Test alongside mixed gear, affinitized equipment, items and actual shop/loot progression before changing live balance.
2. **Do not add generic Vitality to Blood + Decay yet.** It improves healing, but mostly costs damage and target-hybrid opportunity. Investigate why Bleed+Rot hybrid activation is rare; inspect status overlap, procs and timing rather than simply buffing multipliers.
3. **Do not add generic Vitality to Fury + Magic yet.** The small healing gain was not worth the DPS/Realm loss. Try existing survival tradeoffs within the pair before introducing a third family.
4. **E10/E50 remain disproportionately difficult.** All six E50 arms clear only 0.6–1.8% of attempts in Batch B. Investigate actual sustain, enemy raw hit damage, HP continuity, potion access, early attack-speed thresholds and rarity/gear acquisition before changing the enemy curve.
5. **No gameplay changes authorised by this experiment.** Keep the production modules, passive values and enemies unchanged; the only edits belong to simulation scripts and a conditional CI audit job. No main branch, Railway, Firebase or real saves touched.

Full trajectories and per-seed results can be retrieved as GitHub Actions artifacts from the linked runs.
