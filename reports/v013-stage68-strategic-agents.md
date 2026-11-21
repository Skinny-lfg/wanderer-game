# Wanderer v0.13 — Stage 6.8: Strategic Agent Builds / Native Progression Audit

**2026-11-21. Status: implemented and validated as simulator-only logic.**  
Branch: `audit/v013-stage6`. Tested commit: `2a64914fcfe505bcc294b2ccd61a8d0421440f67`.  
Validated CI: https://github.com/Skinny-lfg/wanderer-game/actions/runs/44859523149

## What changed

- Added `scripts/v013-build-planner.cjs`, reading the **real v15 talent graph** and associated skill descriptions and prerequisites. Native Camp actions are used for every earned Talent point, reset, choice and equipment transaction. No ability, XP, gear, loot or Expedition unlock is created artificially.
- Strategies can focus on one Affinity; open second after 12–14 earned points; open third after 28–30 earned points; choose a fixed third, or add defensive Vitality/Aegis in response to real combat pressure. Once an adaptive third Affinity has been earned, temporary improvement does not remove it.
- The planner selects a functioning opening skill first (the actual tree needs five points to reach this skill), then scores nodes and legal prerequisite routes. When an important milestone is **affordable with earned points** but current nodes block it, the agent can use a *native full reset* and rebuild (up to two planned resets). The goal is coherent heuristics, not a proof of globally optimal talent allocations.
- Added 21 separate `smart-*` profiles, including pure, two-way, Mixed two/three-way and **three Affinities explicitly without Mixed nodes**, weapon pairs Sword/Two-Handed, Daggers/Bow, Wand/Staff, and offensive/defensive pre-Boss potion preferences. Different profile styles are compared, rather than silently replacing their Affinity by an arbitrary pivot after a couple of failures.
- Gear scoring considers genuine item affixes and role synergy. Preferred weapons cannot be forced to drop, craft or buy, and starter gear remains unchanged. Agent potion loadouts use actual merchant stock and legal inter-room use before Elites and Bosses; no mid-combat potion consumption.
- Old simulator policies are retained, unmodified, for a baseline comparison. **No game combat, loot, talent graph, boss, balancing, save or published-game code was changed.**

## Validation

- 35/35 automated tests **PASS** (talent graph, legal native purchases, thresholds, preservation of an earned third Affinity, specializations without Mixed nodes, weapon/potion scoring, other simulator regressions).
- 5 GitHub Actions parallel cohorts and aggregate **PASS**.
- **84 persistent native accounts, 21 policies × 4 shared seeds 9701–9704, 2,760 attempts, 0 runtime/progression errors.** Each account starts naturally at E1, with XP=0 and weak real starter gear; must win each previous native Expedition Boss to progress. Censored Expeditions are not simulated with injected gear.
- Native summary + complete raw traces available as `stage68-strategic-global-audit` and `stage68-smart-*` GitHub Actions artifacts on the run linked above.

## Selected real-account results

Each profile has four seed accounts. E10 clears mean **number of accounts clearing E10 within bounded native progression**, not independent player's win probability.

| Strategy | E1 clears / 4 | E5 clears / 4 | E10 clears / 4 |
|---|---:|---:|---:|
| Blood pure | 4 | 3 | 3 |
| Blood + Fury | 4 | 3 | 3 |
| Blood + Fury + adaptive Vitality, Mixed allowed | **4** | **4** | **4** |
| Blood + Fury + fixed Vitality, **no Mixed nodes** | 4 | 3 | 3 |
| Aegis + Vitality | 4 | 3 | 3 |
| Vitality pure | 4 | 4 | 4 |
| Blood Sword preference | 4 | 4 | 4 |
| Blood Two-Handed preference | 3 | 1 | 0 |
| Fury Daggers preference | 2 | 1 | 1 |
| Fury Bow preference | 1 | 0 | 0 |
| Magic Arcane pure | 0 | 0 | 0 |
| Magic Fire + Aegis | 1 | 1 | 1 |
| Magic Frost + Vitality | 0 | 0 | 0 |
| Magic Lightning pure | 0 | 0 | 0 |
| Magic Wand preference | 2 | 1 | 1 |
| Magic Staff preference | 0 | 0 | 0 |
| Magic Wand, offensive potion policy | 2 | 1 | 1 |
| Magic Wand, defensive potion policy | 2 | 1 | 1 |
| Fury pure | 1 | 0 | 0 |
| Fury + Blood + Aegis | 0 | 0 | 0 |
| Decay + Magic + Aegis | 3 | 0 | 0 |

**All policies:** 45/84 accounts cleared E1, and 29/84 cleared E10. This remains a very small, shared-seed agent pilot, not a robust population estimate.

## Did agents really use more than one Affinity?

Yes. Inspecting the **full original physical-shard JSON** for the Mixed Blood/Fury/Vitality strategy:

| Seed | Final owned Affinities | Final owned Mixed skills | E10 cleared? |
|---|---|---|---|
| 9701 | Blood, Fury, Vitality | Crimson Rush, Reaper's Cadence | Yes |
| 9702 | Blood, Fury, Vitality | Crimson Rush, Reaper's Cadence | Yes |
| 9703 | Blood, Fury, Vitality | Crimson Rush, Reaper's Cadence, Red Guillotine | Yes |
| 9704 | Blood, Fury, Vitality | Crimson Rush, Reaper's Cadence, Red Guillotine | Yes |

In the **No-Mixed** three-Affinity variant, seeds 9702, 9703 and 9704 owned Blood, Fury, Vitality, used **zero Mixed nodes**, and cleared E10. Seed 9701 finished E3 only and had unlocked Blood + Fury, so it had not yet acquired the third Affinity.

**Interpretation:** 4/4 versus 3/4 is an observed difference across the two policy configurations, **not proof that Mixed talents are numerically better**. The third-Affinity selection rule differs (adaptive vs fixed), and earned gear, talents and tactical resource use diverge. Isolate Mix eligibility only in a separate matched test before claiming causality.

## Did agents reset intelligently?

Native reset events were actually seen, with recorded reasons such as `affordable_milestone_blood_harvest`, `affordable_milestone_reapers_cadence`, `affordable_milestone_crimson_feast`, `affordable_milestone_heart_of_carnage`, `affordable_milestone_arcane_surge`, `affordable_milestone_arcane_mastery`. Resets retain original XP and must re-buy all legal prereqs via game actions. Example aggregate counts over full cohorts: Blood/Fury/Vitality Mixed 7 resets, no-Mixed 3, Blood Sword 8, Magic Wand 3.

## Equipment and consumables: actual rather than invented

- Blood Sword policy spent all 175 recorded attempt entries using Sword; Blood Two-Handed wore Two-Handed in 153 entries and Sword in 17, so it genuinely acquired/equipped its preferred weapon but was much less successful. This is not yet a controlled equal-stat weapon comparison.
- Magic Wand profile: actual Wand in 131 attempt entries and Sword in 16; Magic Staff: Staff 50, Wand 6 and Sword 16. **Preferred-weapon ratio is per attempt**, not share of independently geared player accounts; starter Sword can inflate a Sword profile.
- Real potion uses were recorded before Boss/Elite encounters. Blood/Fury/Vitality Mixed: 17 uses with pre-Boss reasons, 10 with pre-Elite reasons; Blood Sword: 21 / 13; Magic Wand: 8 / 5. The stock and number of available doses vary naturally.
- Different Wand potion policies all cleared E10 **1/4** under these four seeds. The actual items consumed differ, so this does not establish superiority of an offensive or defensive potion policy.
- Full native traces include the legal potion loadout, actual source, purchased/equipped gear, XP, talent paths and encounter outcomes.

## Conclusions and remaining gaps

1. **The new agent framework is substantially better organized** than the previous static-target policy: it understands real skill dependencies, explicitly stages Affinities, preserves a chosen third path, uses legal reset-to-milestone strategies and evaluates genuine gear and potions. However **no claim of global build optimality** is supported: agent node scoring is a deterministic heuristic, not an exhaustive DPS/survival search.
2. **The early Expedition bottleneck still dominates.** Magic pure, Staff, Bow and Fury profiles frequently fail E1 before having enough XP to invest in their intended skills or mixed strategies. **Do not interpret E10=0 as isolated evidence that those complete builds are inherently weak**.
3. **Next needed before changing enemy stats:** improve independent fair-build tests using legitimately obtained (not invented) loadouts or matched fixed real account checkpoints at later levels; test skill-node order and respec ablations; compare equal-stat weapons and pre-Boss potions with same native fights. Extend seeds. Decompose enemy HP/Attack/Defense/skills per role only after reliable benchmarks.
4. Keep `audit/v013-stage6` isolated; **no merge and no deploy**.

## Source and reproducibility

- `scripts/v013-build-planner.cjs`
- `scripts/v013-natural-progression.cjs`
- `scripts/v013-stage68-agent-evaluation.cjs`
- `tests/v013-strategic-build-agents.test.cjs`
- `.github/workflows/v013-stage68-strategic-agents.yml`
- CI: https://github.com/Skinny-lfg/wanderer-game/actions/runs/44859523149
