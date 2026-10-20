# Wanderer v0.12 — Twelve NEW Legendary effects: native-VM A/B build audit

**Date:** 2026-10-20  
**Branch:** development only  
**Status:** Both simulations completed; no gameplay Legendary/catalogue changed. The old 22 Legendaries still exist in the actual game.  
**Run A:** [GitHub Actions 39498302116](https://github.com/Skinny-lfg/wanderer-game/actions/runs/39498302116), commit `bd248b24f0337c6e026d1de87cfc1efe042b71f7`.  
**Run B:** [GitHub Actions 39498686275](https://github.com/Skinny-lfg/wanderer-game/actions/runs/39498686275), commit `bd5b09f17d265095b89a95df22e7a9fe2ea93b2c`.

## 1. Scope

Simulated *all 12* proposed replacement Legendary effects, **not the existing catalogue**:

- Blood: Crimson Fang (Daggers: 4 Bleed ticks, ICD 3.5s), Chalice of the Hollow King (1–1.5% MaxHP heal on hit vs Bleed, ICD 6s)
- Decay: Gravewake (4 Rot ticks, ICD 4s), Eye of Morrow (+0.75–1.05 base hit vs 2+ Rot stacks, ICD 7s; enemy HP caps)
- Vitality: Verdant Oath (Sword: 0.8–1.2% MaxHP heal; next hit +0.60–0.90 base, ICD 6s), Heartroot Carapace (regen below 80% MaxHP, 0.45–0.70% MaxHP/s)
- Aegis: Oathwall (Shield: counterattack 0.75–1.10 base after real Block, ICD 3s), Veil of a Thousand Seals (Belt: starting wave Barrier 6–9% MaxHP; after absorption, next hit +0.40–0.60 base, ICD 8s)
- Fury: Kingsbreaker (Mace: +1.00–1.30 base hit, ICD 4s), Tempest Talon (Bow: first qualifying crit +0.35–0.50 base, ICD 6s)
- Magic: Astrafall (Staff: fourth funded spell echo 1.0–1.4 Spell Power, ICD 5s), Voidglass (Wand: third funded spell 1.10–1.50 Spell Power and refund 20–30% cost, ICD 3s)

The lower/upper effect numbers depend on whether the corresponding affinity is **legitimately unlocked during the Expedition**, as proposed. No passive rank or hybrid was granted. The tests execute a simulation-only patch of `combat/v012-combat-runtime.js` **in an isolated Node VM**, leaving the production module untouched. Damage echoes/counters are direct non-recursive damage; actual heal, Barrier and DOT implementations/caps are respected.

### Tested packages (3 experimental Legendaries per character)

| Character | Actual gear | Three experimental powers |
|---|---|---|
| Cloth Staff | Full Cloth, Staff; Magic/Aegis/Decay | Astrafall, Veil, Eye of Morrow |
| Cloth Wand | Full Cloth, Wand + Orb; Magic/Aegis/Decay | Voidglass, Veil, Eye of Morrow |
| Plate Sword | Full Plate, Sword + Shield; Vitality/Aegis/Fury | Verdant Oath, Oathwall, Heartroot |
| Plate Mace | Full Plate, Mace + Shield; Vitality/Aegis/Fury | Kingsbreaker, Oathwall, Heartroot |
| Leather Daggers | Full Leather, dual Daggers; Decay/Fury/Blood | Crimson Fang, Chalice, Eye of Morrow |
| Leather Bow | Full Leather, Bow; Decay/Fury/Blood | Tempest Talon, Chalice, Eye of Morrow |
| Leather 2H | Full Leather, Two-Handed; Decay/Fury/Blood | Gravewake, Chalice, Eye of Morrow |

## 2. Experimental controls and important limitations

Native combat, enemy scaling, item generation, 15 Realms, real draft and affinities, 3 tier-matched Runas, no potions, no events, no mid-run loot upgrades and no real Firebase/save reads/writes. Eight runs per rarity/weapon/E/policy in batch A, twelve **independent-seed** runs per rarity/weapon/E/policy in B. E10/E50/E100/E200 in A and E50/E200 in B. Both arms use the same tier, rarity, armour types, weapon and initial seed, with no numerical gear-stat differences; equipped proposed Legendaries are experimental flags attached to **otherwise identical Rare/Epic items**. This isolates effects, but does **not** test actual Legendary base stats or probability of finding three compatible Legendaries. No native generic +32% first-attack fallback is used. Routes may diverge after effects change encounter timing and combat RNG.

**Run A:** 1,568 A/B total runs, zero failures, 222/222 Node tests pass.  
**Run B:** 840 A/B total runs, zero failures, 222/222 Node tests pass.  
**Combined: 2,408 successful runs; zero runtime/test failures.** Results are exploratory, not live-player rates or confidence-certified.

## 3. Pooled independent results: complete 15-Realm clears

Run A plus Run B, with denominators per build differing because Leather has three weapon variants vs two Cloth/Plate variants.

| Tier | Gear & affinity package | Without new effects | With 3 new effects |
|---|---|---:|---:|
| E50 | Cloth Magic+Aegis+Decay | 0/80 | **6/80 (7.5%)** |
| E50 | Plate Vitality+Aegis+Fury | 0/80 | **9/80 (11.3%)** |
| E50 | Leather Decay+Fury+Blood | 17/120 (14.2%) | 28/120 (23.3%) |
| E200 | Cloth Magic+Aegis+Decay | 0/80 | **5/80 (6.3%)** |
| E200 | Plate Vitality+Aegis+Fury | 0/80 | **12/80 (15.0%)** |
| E200 | Leather Decay+Fury+Blood | 65/120 (54.2%) | 68/120 (56.7%) |

## 4. Average Realms reached, maximum 15

| Tier | Gear | Without | With |
|---|---|---:|---:|
| E50 | Cloth | 3.36 | **9.74** |
| E50 | Plate | 4.59 | **9.68** |
| E50 | Leather | 10.30 | **10.88** |
| E200 | Cloth | 2.95 | **7.42** |
| E200 | Plate | 4.94 | **9.71** |
| E200 | Leather | 13.18 | **13.25** |

Legendaries substantially narrow mean Realm gap in E50, but E200 Cloth and Plate still lag. Leather gets strong baseline completions without the new items.

## 5. Matched variants, Run B (independent seeds)

**24 runs per weapon at E200 (12 Rare and 12 Epic):**

| E200 | Baseline clears | 3 Legendary clears | Mean Realms before → after |
|---|---:|---:|---:|
| Cloth Staff | 0/24 | 4/24 | 3.79 → 8.04 |
| Cloth Wand/Orb | 0/24 | 0/24 | 2.38 → 6.33 |
| Plate Sword/Shield | 0/24 | 2/24 | 4.83 → 9.25 |
| Plate Mace/Shield | 0/24 | 4/24 | 4.71 → 10.92 |
| Leather Daggers | 3/24 | 4/24 | 9.96 → 10.17 |
| Leather Bow | 13/24 | 15/24 | 14.04 → 14.21 |
| Leather Two-Handed | **24/24** | **24/24** | 15 → 15 |

The Leather Two-Handed result flags a serious **baseline** armour/weapon scaling issue: it already succeeds across the 24 tests *without* any new Legendary effects. This is a reason not to tune the entire late game solely via Legendary powers.

## 6. Individual-item directional findings

A separate small-matrix test **compared each item's prototype independently** at E50/E200 (8 total E/variant per item in A; further one repetition per gear rarity in B). These individual samples are diagnostic, not reliable win-rate estimates.

- **Veil of a Thousand Seals** has by far the most meaningful Cloth sustain effect: E200 Staff Realm mean **3.63 → 8.00** when added *alone* in the first solo battery; Wand **1.88 → 3.38**. The Barrier generated at every wave is very potent. It is largely responsible for the full Cloth kit's large progress improvement and risks creating Legendary dependence.
- **Astrafall** added damage but almost no solitary progress improvement in E200 (Staff 3.63 → 3.75), likely because the mage dies before a fourth funded spell per window can materially matter.
- **Voidglass** helps Wand DPS/progress a little (solo E200 1.88 → 3.13) but not enough to clear 15 Realms. The current Wand gap is not solved.
- **Heartroot Carapace** significantly increases Plate longevity (E200 Mace 6.38 → 9.25 Realms alone). **Kingsbreaker** also helps Plate Mace (6.38 → 8.13 Realms alone); Oathwall does provide additional counterattacks but less mean progress in isolation.
- **Verdant Oath** improves Sword marginally, but Mace/Shield remains considerably stronger once full package assembled.
- **Eye of Morrow** rarely procs with Cloth because 2 Rot stacks often are not obtained before early death. If it stays as designed, it is mostly a late-assembly item; avoid claiming all 12 are equally useful.
- **Crimson Fang**, **Gravewake**, **Chalice** and **Tempest Talon** all activate in the right situations, but on already-strong Leather most have minor impact on win rate; no numerical buff indicated.

## 7. Recommended concrete changes before actual implementation

1. **Keep the twelve-item replacement idea, but do not ship all proposed values unchanged as a balance patch.** They improve item identity and make Cloth/Plate progress possible but do not eliminate E200 difference.
2. **Avoid increasing Leather damage further**, especially for Bow/Two-Handed. The current 5-attacks/s AGI synergy and inherent weapon scaling should be evaluated without Legendaries. Treat Tempest Talon as flavour, not a DPS-scaling multiplier.
3. **Test baseline attack/cast cadence separately:** ensure INT converts to meaningful funded spell throughput, and STR/Shield or slow weapons can deal damage while blocking. Avoid balancing classes by making a rare belt essential.
4. **Veil and Heartroot need special attention**, as defensive Legendaries drive the most Realm gain. Do not nerf reflexively from this experiment; first test improved Cloth/Plate baseline and then reevaluate them for excessive stacking.
5. **Magic Staff Astrafall needs earlier trigger opportunity:** candidate experiment 2 funded casts, 75% Spell Power, 4s cooldown instead of 4 funded casts, 140% SP at 5s. This trades larger rare burst for more reliable activity; test, don't apply blindly.
6. **Magic Wand Voidglass needs testing paired with base Wand cadence and mana**, rather than simply increasing the cast-damage multiplier. An option is 2 funded casts, 90% Spell Power, 25% mana refund, 3s cooldown.
7. **Eye of Morrow** could trigger on 1 Rot stack with a lower multiplier, e.g. 60% base damage, 7s cooldown; rerun its activation rate before implementation.
8. **Re-evaluate replacing 22 existing Legendaries safely** only after balancing results. Save migration must preserve current owned items/IDs and use a deterministic swap; never simply remove IDs from live player profiles.

## 8. Implementation and file safety

New test-only scripts:
- `scripts/v012-legendary-prototype-patch.cjs` — injects prototype effects into the in-memory combat module loaded in a temporary VM. **Production combat file is untouched**.
- `scripts/v012-legendary-build-ab-sim.cjs` — builds, controls, individual-items A/B and full JSON output.
- `scripts/v012-affinity-combat-sim.cjs` — optional prototype equipped test flags, no changed live rules.
- `.github/workflows/development-tests.yml` — conditional `[legendary]` job archives full JSON results on audit commits.

No edits to production `combat/legendary.js`, in-game Legendary definitions/catalogue, `main`, Railway, Firebase rules or real player saves. The new 12 Legendary effects are NOT yet available in Wanderer.
