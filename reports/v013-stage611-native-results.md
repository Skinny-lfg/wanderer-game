# Wanderer v0.13 — Stage 6.11 verified results & remaining gaps

**Date:** 2026-11-21  
**Canonical integration target:** audit/v013-stage6 (NO DEPLOY)  
**PR:** https://github.com/Skinny-lfg/wanderer-game/pull/107

## Live native TalentGraph structural legality (CI)

- 27 main endpoints: 12 Basic, 6 current Focused, 6 Mixed and 3 Magic elemental routes.
- 51 unique live targets including real strategic agent milestones.
- 488 candidate target/rank/point-budget rows at budgets 0, 2, 6, 12, 24, 36, 60 and 100.
- **280 legally purchased target snapshots**, **208 point-budget-insufficient**, **0 unresolved prerequisite paths**.
- Every legal snapshot is replayed using the live v15 TalentGraph allocator, with native prerequisites and mode selection. This is a *synthetic point-budget structural check*, NOT 280 actual acquired builds or fights.
- 21 distinct real smart-agent profiles generated **184** v15-legal strategic plan snapshots, including 12 synthetic snapshots where all three Affinities were legally acquired under high point budgets / hypothetical survival pressure.
- Core tests: 8 Stage 6.11 and 6 Stage 6.10 checks passed, no failures.
- Source game fingerprint: b7665e3d73b391cb37038a54b18da302a9989e5e49cad9cd2b61339a8a7d4ff0.

## Actual earned E1–E5 native adaptive campaign

**CI run:** https://github.com/Skinny-lfg/wanderer-game/actions/runs/44887124494  
**Head SHA for this recorded dataset:** 46fe23ef0e92670da00198bcd4d757271ed1a979  
**Archived artifact:** stage611-native-earned-24-accounts (native 5.24 MB JSON, ZIP).

- 24 native accounts = 6 smart strategies × **4 unique shared seeds** (9701–9704); 24 accounts are **not** 24 independent RNG seeds.
- 164 real Expedition attempts, 297 real native combat rooms; zero engine errors.
- 27 native Boss fights (all 6 Boss styles observed), **5 total Boss wins**: 4 wins at E1, one at E2.
- 73 native Elite fights, 8 observed Elite type labels (not necessarily a complete generator roster).
- 24 accounts entered E1; 4 reached E2; **only one reached E3**; none reached E4/E5.
- 37 native potion uses, 198 Boon selections, zero native talent resets.
- Actual equipped weapon families observed: Sword, Daggers, Wand, Mace. No actual Bow, Staff or Two-Handed exposure, even where the profile preferred them: actual acquisition is not forced.
- Observed armour: Cloth, Leather, Plate; all six Realm Affinities appeared across the 24 accounts.
- **Maximum genuinely earned talent points at Camp: 8**; median points on attempt entry: 0. Neither a second nor third Affinity became organically attainable in this cohort because the implemented profile thresholds require 12–14 / 28–30 earned points.
- Profiles: Aegis/Vitality 2 Boss wins, Blood Pure 1, Fury/Daggers 1, Decay/Magic/Aegis 1, Blood/Fury/Vitality 0, Magic/Wand 0. These profile counts are **descriptive only**, not controlled balance rankings.

## What these observations mean

The TalentGraph and high-budget strategic planning can now be **validated without guessing**. Yet early progression suppresses real exposure to multi-Affinity builds, late talents and respec behavior. Enlarging the boss test seed count without addressing how to *reach* Bosses or advanced builds would misrepresent the player's experience.

Do not use the 5/27 Boss-win ratio as a globally representative win probability. The sample reuses four seeds, includes repeat attempts from persistent accounts, adaptive selection and widely different build/equipment progression. Analyze independent account-level outcomes and E-specific reachability separately.

## Still missing / next design decisions

1. Prioritize diagnosis of **E1 completion bottlenecks** before rebalancing enemy stats. The simulator has evidence of low Boss exposure and most accounts failing to unlock E2; it does not yet pinpoint a single cause.
2. For high-budget advanced build vs Boss comparisons, distinguish **controlled native combat with hypothetical equipment** from **earned native progression**. The former can test legal ability interaction but cannot be called an earned E10 build.
3. Increase genuinely independent seeds before statistical claims; retain paired seeds only for explicitly matched comparisons.
4. Inventory the complete native Elite spawn catalog and all legal main/offhand item pairs, then use them to verify constrained scenario combinations.
5. Add genuine reachable E5–E10 native histories or mark late-game build, potion, respec and boss combinations as **not observed**.

**No gameplay balance changes, forced loot/unlocks, legacy save repairs, Firebase changes or production release.**
