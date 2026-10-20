# Wanderer v0.12 — Cloth / Plate / Leather triple-affinity simulation

**Date:** 2026-10-20  
**Branch:** `development`  
**Source revision:** `feb5908a0700004de648c69200e060d1a81aa5f1`.  
**Live gameplay changes:** none. All changes are simulation scripts and a conditional CI job. No edits to `main`, deployment, Firebase, or real saves.  
**CI:** [GitHub Actions run 39491256085](https://github.com/Skinny-lfg/wanderer-game/actions/runs/39491256085) — armor-audit PASS, 1,344 runs, zero simulation errors; 220/220 production regression tests PASS.

## 1. Tested characters

"Defense" interpreted as **Aegis** and "Decoy"/"Decau" interpreted as **Decay**.

| Archetype | All five armor pieces | Target affinities, in priority order | Tested legal weapons/offhand |
|---|---|---|---|
| Mage / Dark Guardian | Cloth | Magic → Aegis → Decay | Staff 2H; Wand + Orb |
| Guardian / Paladin | Plate | Vitality → Aegis → Fury | Mace + Shield; Sword + Shield |
| Rogue / Hunter | Leather | Decay → Fury → Blood | Daggers + offhand Daggers (no independent second strike); Bow 2H |

The game treats armor class as a gear attribute, **not as a character class lock**: Cloth converts the available armor primary-attribute budget into INT; Leather into AGI and gives Evasion Rating; Plate into STR. Five slots are `helm, armor, gloves, boots, belt`. Actual Shield HP/DEF/block rules and 2H/offhand restrictions apply.

## 2. Methodology and limits

- Native v0.12 runtime via the isolated in-memory seeded JS harness: `scripts/v012-affinity-combat-sim.cjs` plus `scripts/v012-armor-archetypes-sim.cjs`.
- E1/E5/E10/E25/E50/E100/E200, **8 seeded repetitions × 2 gear rarities (Rare and Epic) × 2 allowed weapon configurations × 2 passive/route policies** for each archetype; 1,344 simulations total.
- The triple-target policy chooses the requested starting family and preferentially seeks the other two families via legitimate Realm offers, then selects useful passives/hybrids. A separate random route/passive policy provides a control and uses paired initial seeds for the same gear configuration.
- The three families are **not given for free at the start**; unlocking depends on surviving successive Realms and receiving valid offers. The `allThreeUnlocked` count is important.
- Full same-tier Rare or Epic gear in every slot, three same-tier Runas (Vitality, Warding, plus Wisdom for Staff/Wand or Might for physical weapons), no potions used, decline events, no equipment swaps/forging/merchant throughout the Expedition, 15 Realms. Magic element chosen across Fire/Frost/Lightning based on the seed.
- Synthetic on-tier full gear is deliberately optimistic and **not a simulation of acquisition difficulty or a typical real player's inventory**. No forced affinity gear sets, no unique Legendaries. Eight independent seeds per exact weapon/rarity/E/strategy cell; results must not be overinterpreted as game-wide player win probabilities.

## 3. Targeted triple-affinity strategy — clear rates

Each cell = successful 15-Realm clears **out of 32** attempts (2 weapons × 2 rarities × 8 seeds).

| Expedition | Full Cloth, Magic+Aegis+Decay | Full Plate+Shield, Vitality+Aegis+Fury | Full Leather, Decay+Fury+Blood |
|---|---:|---:|---:|
| E1 | 32/32 | 32/32 | 32/32 |
| E5 | 5/32 | 26/32 | 17/32 |
| E10 | 1/32 | 1/32 | 2/32 |
| E25 | 0/32 | 0/32 | 2/32 |
| E50 | 0/32 | 0/32 | 7/32 |
| E100 | 0/32 | 0/32 | 7/32 |
| E200 | 0/32 | 0/32 | 8/32 |

Mean Realm reached (higher is better, maximum 15):

| E | Cloth | Plate+Shield | Leather |
|---|---:|---:|---:|
| E5 | 13.16 | 14.72 | 14.91 |
| E10 | 7.94 | 9.88 | 12.06 |
| E25 | 3.72 | 6.16 | 9.97 |
| E50 | 3.16 | 4.81 | 10.16 |
| E100 | 2.91 | 5.22 | 11.50 |
| E200 | **2.53** | **5.44** | **12.44** |

Runs which **actually unlocked all three target families**:

| E | Cloth | Plate | Leather |
|---|---:|---:|---:|
| E10 | 17/32 | 16/32 | 21/32 |
| E50 | 5/32 | 6/32 | 12/32 |
| E200 | 6/32 | 11/32 | 21/32 |

Because many early deaths occur before unlocking all three families, this is partly a **build assembly and pacing problem**, not just the isolated full-power matchup of completed builds.

## 4. Weapon choice is crucial

Targeted-policy clears by weapon, each **out of 16** runs (8 Rare + 8 Epic):

| Expedition | Cloth Staff | Cloth Wand/Orb | Plate Mace/Shield | Plate Sword/Shield | Leather dual Daggers | Leather Bow |
|---|---:|---:|---:|---:|---:|---:|
| E5 | 5 | 0 | 13 | 13 | 8 | 9 |
| E10 | 1 | 0 | 0 | 1 | 0 | 2 |
| E25 | 0 | 0 | 0 | 0 | 0 | 2 |
| E50 | 0 | 0 | 0 | 0 | 2 | 5 |
| E100 | 0 | 0 | 0 | 0 | 2 | 5 |
| E200 | 0 | 0 | 0 | 0 | 0 | **8** |

At **E200** all 8 wins for the Leather/Bow build occurred in the **Epic Bow** subgroup (8/8); Leather/Bow Rare is 0/8 (though Rare Bow reaches Realm 13.75 on average). Dual Daggers Epic is 0/8 at E200, despite reaching Realm 14.25 on average. So the result should NOT be interpreted as "any Leather beats any Plate"; armor+weapon+rarity matter.

At **E50**, Leather Epic Bow 5/8 wins; Leather Epic dual Daggers 2/8; all Rare Leather weapons 0/8. Full Cloth and Plate never clear the whole Expedition even at Epic E50 in this sample.

## 5. Mechanical explanation — attribute conversion → attack speed scaling

The native gear rules give Cloth primary INT, Plate primary STR and Leather primary AGI. Attack speed formula depends strongly on Agility:

`speed = .78 + AGI * .032 + flatSpeed * .046`, then weapon multiplier, with diminishing returns above 2.5; speed passives also apply. Leather can reach the combat speed cap of 5 attacks/s as the tier rises, while the other sets gain little AGI with level.

Average first-fight character metrics across the two weapons and two rarities at E200:

| E200 stat | Cloth | Plate + Shield | Leather |
|---|---:|---:|---:|
| Starting max HP | 4,713 | 6,277 | 4,713 |
| Defense | 1,067 | 1,516 | 1,073 |
| Attack/s | 1.13 | 0.80 | **5.00** |
| Block chance | 0% | **48%** | 0% |
| Evasion rating | 0 | 0 | **1,688** |
| Measured combat DPS | 1,419 | 1,015 | **3,712** |
| Healing per combat second | 0 | 17.44 | 0.28 |

At E200 the exact tested weapons have these starting speeds: Cloth Staff 1.07/s, Cloth Wand 1.18/s; Plate Mace 0.62/s, Plate Sword 0.99/s; Leather dual Daggers and Bow **5/s**. The current Evasion cap is **30% for eligible physical attacks** (rating is not equivalent to percentage), whereas Plate reaches the Shield's **48% block chance**. These metrics illustrate why Leather's offensive tempo can outpace more durable characters.

This does **not** prove the stats are perfectly gear-normalized, nor that Evasion alone causes Leather wins. Leather also uses particularly suitable fast weapon types, while Plate and Cloth have different damage channels.

### Build-specific diagnosis

**Cloth / Magic+Aegis+Decay:** high intelligence and magic damage potential, but Staff/Wand attack frequency stays low while enemy HP/attack scale. Aegis offers Barrier but the character lacks Shield Block; with Wand+Orb it earns almost no Barrier and dies before assembling synergies. Staff consistently outperforms Wand in simulated progress. No completed E50–E200 runs.

**Plate + Shield / Vitality+Aegis+Fury:** large initial HP/Defense and Shield Block, very high early E5 consistency (26/32), and healing/Barrier. But very slow Mace/Sword attacks mean damage throughput fails to keep pace. E200 Plate lasts longer than Cloth (5.44 vs 2.53 Realms) but never clears the Expedition even with Epic gear in this small sample.

**Leather / Decay+Fury+Blood:** high AGI results in rapid attacks (cap 5/s) and Evasion, enabling more on-hit effects and more opportunities to pick passives. Bow + Epic gear performs extremely well relative to other tested archetypes, especially E200. However the zero-healing profile is vulnerable if enemy damage lands; Rare leather never clears E200 and Daggers never clear E200 here, so the item quality and weapon interaction matter.

## 6. Random-policy control and interpretation

A random-route/passive control on exactly the same starting loadouts also gives at E200:
- Cloth 0/32 wins, Plate 0/32, Leather 8/32.
- In contrast, targeted triples actually unlocked all families in Cloth 6/32 vs random 1/32; Plate 11/32 vs random 3/32; Leather 21/32 vs random 3/32.

**Interpretation:** actively pursuing the triple setup vastly improves the *chance to assemble it*, but doesn't cure the Cloth/Plate late-level DPS/tempo shortfall. For Leather, many successful runs can clear without fully assembling its three-family synergy, suggesting raw gear/weapon speed is heavily contributing to wins.

## 7. Proposed further balance tests (not applied)

1. **Isolate armor type from weapon:** same weapon, same gear tier/rarity, same passives, compare all Cloth/Leather/Plate variants with identical starting seeds. Separately isolate Bow's synergy with AGI, as currently weapon mix confounds the armor comparison.
2. **Test a controlled non-Leather speed catch-up** (test-only): improve ability to attack/cast as equipment tier rises, without erasing Leather's speed identity. Examine how much DPS is necessary for E50/E100/E200 while retaining defensive strengths.
3. **Check Wand and Staff mana/cast cadence and spell power** as well as Aegis Barrier procs without a Shield. Don't buff spell damage before checking low attack frequency and lack of trigger opportunities.
4. **Run recovery and potion scenarios with realistic gear**; existing tests use no potions and full on-tier Rare/Epic loadouts, not normal player economy.
5. **Compare hybrid activation conditioned on actually acquiring all three families**, rather than averaging deaths at early Realms into late-game build-effectiveness statistics.
6. If restricting armors by class later, audit build viability first: enforcing Cloth would currently penalize Magic heavily under this synthetic simulation. Avoid implementing a hard armor/class lock without balancing.

All numbers are exploratory model runs, **not certified live win rates** or a release approval. No production balance, save, main or deployment changes made.
