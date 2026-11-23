# Stage 6.43 — AoE mechanic correction and real TalentGraph audit (E10-first)

**Status: CANDIDATE, not approved for merge or deploy.** No changes to enemy scaling, stats, E1–E9 difficulty, or E10 gear grants. Source branch `balance/stage-6.40-e1-calibration`.

## Acknowledged audit failure from 6.42

Some abilities existed in the Talent Catalog and active combat checks, but were missing from the v15 graph. 6.42 restored six weapon-choice skills (Bow Deep Pierce, Dagger Fan of Blades, Blood Two-Handed Cleave Mastery, Aegis Sword Sweep, Aegis Mace Shockwave, and Fury Single Target Mastery) through legitimate two-step branches and a skill gate. This is a **new v15 layout**, not the legacy `fork_*` progression. The native layout and prerequisite tests passed.

However a **larger automatic reachability audit** now finds **367 active v15 nodes** and **45 distinct string references in combat files that are absent from v15**. This is **not** a declaration of 45 live bugs: a subset consists of intended old/retired abilities, generated prefix strings, or unreachable branches. Source audit: https://github.com/Skinny-lfg/wanderer-game/actions/runs/45282050400. Examples of orphan checks needing a deliberate classification: `fire_focus`, `lightning_focus`, `static_charge`, `stored_impact`, `lifeweaver`, `fury_momentum`, `vitality_recovery`, `vitality_reserve`. Do not blindly resurrect these or delete functions by name; verify each live call path, game design ownership and desired v15 mapping.

## What is now implemented in 6.43 (single existing mechanics, not generic enemy multipliers)

### Lightning / Overcharge and Storm Mastery
- One existing chain implementation was replaced with **five bounded secondary jumps** on Overcharge, **six** on Storm Mastery, with diminishing factors. An arena still has at most four active enemies; after visiting distinct live secondary targets, later hops **bounce** to an already visited live enemy.
- Each Lightning chain impact applies an **8-second Static Mark** on its target. A **subsequent chain** that hits the same marked living enemy detonates it, damaging that enemy and up to two living neighbors. Multiple bounces within the **same cast** cannot detonate a freshly created mark; each marked target can detonate at most once per chain. Marks never affect reserve enemies until those enter the arena.
- Detonation damage is bounded (boss-specific limits), and the code reuses the same secondary-hit armor/barrier/boon/telemetry path used by normal AoE. Counter telemetry: `lightningChainJumps`, `lightningMarksApplied`, `lightningMarksDetonated`, `lightningMarkDamage`. Enemy UI displays the mark and remaining seconds using existing Shock icon.

### Bloodshed and Contagion
- `blood_transfer` (Bloodshed) still transfers one Bleed at 50% on death and cannot spread recursively. It now synchronizes DOT state and deals **three immediate transferred ticks** to an active recipient.
- `plague_spread` (Contagion) still spreads one Bleed and Rot to up to two targets at 50% on death. Its immediate burst was initially raised to **three** ticks and subsequently retuned to **five** transferred ticks *in the same existing code path*, because three ticks did not deliver satisfactory AoE performance. No independent bonus damage engine was created.
- Waiting reinforcements receive transferred DOT but **never instant damage before entry**. Enemy death settlement is still handled by the existing encounter runtime. Telemetry for secondary damage remains active.

### Aegis, Vitality and Grave Bloom — source inspection
- **Aegis has conditional AoE** in `stored_force`: part of blocked/barrier-absorbed damage accumulates toward an area burst; its basic Sword/Shield or Mace can add additional target hits if the weapon forks are legitimately purchased.
- **Vitality currently does not have a dedicated offensive AoE path** in v15; it is primarily healing, regeneration and defensive staying power. Do not silently add an unrelated damage nuke.
- **Grave Bloom remains as in Stage 6.42** while its intended identity is unresolved. The existing third-funded-cast/Infusion Rot seeding + burst should be redesigned deliberately as one coherent mechanic, not enhanced by another coefficient on top.
- Suggested future concepts (not implemented): Grave Bloom as a short-lived Rot seed that bursts when a second Rot is applied or the target dies; Aegis Barrier Shatter as a counterattack that radiates pressure; Vitality Overgrowth as an escalating on-hit root/Thorns effect sustained by healing. Each would need an explicit talent route and separate E10 test.

## Native regression test
New direct functional test `tests/v013-stage643-aoe-mechanics.test.cjs` exercises the **actual extracted runtime functions** and checks number of Lightning bounces, mark persistence and delayed detonation, expiry, reserve safety, Bloodshed three-tick burst, consistent root/docs modules, and Static Mark UI.
**94/94 native tests passed**: https://github.com/Skinny-lfg/wanderer-game/actions/runs/45281842171.

## Measured E10 effect (before five-tick Contagion retune)

This stage's first set of **1,500 actual native combats**: 5 genuinely earned E10 build cohorts × 3 group sizes × 100 matched combat seeds, same characters and equipment as the last 6.42 candidate. Native workflow **12/12 successful**, no timeout: https://github.com/Skinny-lfg/wanderer-game/actions/runs/45281842171.

| Build | Group 4: before → new | Group 8: before → new | Group 12: before → new |
|---|---:|---:|---:|
| Lightning | 37%→78% | 0%→93% | 0%→76% |
| Decay + Blood (three-tick Contagion) | 60%→63% | 14%→26% | 24%→38% |
| Blood Pure | 86%→86% | 78%→79% | 76%→79% |
| Plate Warden | 100%→100% | 77%→77% | 82%→82% |
| Fire | 100%→100% | 91%→91% | 69%→69% |

Lightning is now an E10 group-capable AoE specialization in this limited sample; Blood/Decay still trails Fire/Lightning substantially. Strong relative performance cannot be generalized to all E10 gear states: notably the single Lightning checkpoint had incomplete gear, and `100 combat seeds` are **not 100 independently earned characters**. This is risk-1 first-ring normal-room evidence, not Elite/Boss/Expedition win rates.

## Follow-up / hold conditions
- Compare **five-tick Contagion** against three-tick using exactly the same 100 seeds/group; keep if it improves specialized packs without unacceptably affecting other builds. See https://github.com/Skinny-lfg/wanderer-game/actions/workflows/v013-stage643-contagion-retune.yml.
- Classify every orphan active-code reference: intentionally retired versus active-but-inaccessible. Avoid reviving all 45 legacy signatures.
- Test Aegis `stored_force`, weapon forks and a selected Vitality AoE design on genuinely earned E10 characters before treating them as production-balanced.
- Do **not** merge or deploy while these classifications and normal-encounter balancing remain unresolved.


## Five-tick Contagion retune: verified final Stage 6.43 candidate

Native workflow https://github.com/Skinny-lfg/wanderer-game/actions/runs/45282354553: **8/8 jobs successful**, **900 real combat fights** with exact matched E10 earned states and 100 combat seeds per group. Comparing three→five transferred DOT ticks in the **same existing Contagion handler**:

| E10 build | 4 mobs (3→5 ticks) | 8 mobs (3→5 ticks) | 12 mobs (3→5 ticks) |
|---|---:|---:|---:|
| Decay + Blood | 63%→**65%** | 26%→**34%** | 38%→**49%** |
| Blood Pure control | 86%→86% | 79%→79% | 79%→79% |
| Lightning control | 78%→78% | 93%→93% | 76%→76% |

Measured secondary damage Decay + Blood rose by 10,629→15,847 (4), 21,209→31,045 (8), and 34,743→48,713 (12). The two unchanged controls demonstrate the adjustment did not independently alter the Lightning or Blood Pure cohorts. **Still not sufficient for 8-mob rooms**; further blind multiplication of the death-only burst is not a good fix. If a stronger Decay/Blood AoE is desired, evaluate replacing its *on-kill-only* trigger with a bounded, earlier DOT-combination propagation action rather than adding a second proc layer.

Final candidate Source fingerprint `f0f4be9d74a1c93f9f12f360439d08334312c8975498b4eea953162f9827d612`; previous candidate `1ae0bf22ce2625b8914d27cfce03f874ec22087131d4a90c05f41be6415e06af`. No E1/E2 rescaling, no merge and no deploy.
