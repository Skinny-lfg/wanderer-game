# Wanderer v0.13 — Stage 6.19: individually scaled native Elites

## Problem and what is actually being implemented

Stage 6.16 independently identified **eight** real named Elites. Pooled victories of synthetically advanced players ranged from Sanguine Wraith 72.9%, Gravecaller 79.1%, Voidborne Hexer 85.7%, Gravebound Bulwark 87.5%, Bloodscar Ravager 90.6%, Ashen Executioner 92.1%, Briarspine Horror 95%, to Oathbound Exarch 98.1%. **Do not interpret unequal natural subtype assignment counts (38–60/type) as a causal eight-way trial.**

The key late-game progression problem is observed native player victory **63.5% at E5 versus 92.7% E15, 96.9% E35 and 99.0% E70** against naturally sampled Elites. E5 is already around the player's provisional 60–70% Elite goal, so a group-wide HP/ATK multiplier would be unsafe.

## Real code correction

The real game now uses a single read-only, per-Elite progression table in `online/v013-elite-abilities.js`, applied only when the actual named Elite spawns in `combat/v012-combat-runtime.js`.

- No effect at E1–E5. From E6 through E35, ramp linearly between 1.0 and the elite's cap. E35+ remains at the cap. This means the extra difficulty is earned with player progression; avoid exponential or endless runaway.
- Individual maximum multiplicative HP/ATK/DEF gains relative to the **existing archetype's base coefficients**, not new absolute stats:

| Elite | Max HP gain | Max ATK gain | Max DEF gain |
|---|---:|---:|---:|
| Gravebound Bulwark | +55% | +23% | +10% |
| Bloodscar Ravager | +38% | +17% | +4% |
| Sanguine Wraith | +20% | +10% | +2% |
| Voidborne Hexer | +52% | +22% | +8% |
| Gravecaller | +16% | +10% | +3% |
| Oathbound Exarch | +62% | +27% | +12% |
| Briarspine Horror | +60% | +25% | +8% |
| Ashen Executioner | +55% | +23% | +8% |

- Preserve all special abilities and interruptions for now. Stage 6.19 focuses on the scaling fault; **only after comparing all eight individual native combats** consider skill timing changes, to avoid confounding HP/ATK growth with ability scheduling.
- HP/ATK/DEF scaling applies only when `enemy.miniboss` and is tied to the canonical eight Elite keys. **No changes to normal mobs, final Bosses, gear, skills, loot, art, Firebase or `main`.**

## Pre-registered evidence

The Stage 6.19 isolated simulator can **force one exact native Elite identity per fight** while executing the unchanged actual native combat, AI, status effects and all eight skill mechanics. It does not force these identities during real gameplay.

Each comparison matches the same hero's native rolled Rare equipment, valid TalentGraph v15 nodes and attunement, seed, selected Realm and Risk, Condition, starting HP/MP and target policy:

- Pilot: six Affinities × four legal synthetic E budgets (E5/12, E15/24, E35/36, E70/60) × two independent build profiles × one seed = **48 matched hero states × eight names × original/new = 768 genuine native fights**.
- Full: two seeds/cell = **96 matched hero states, 1,536 genuine native fights**; the pilot is a subset, not extra evidence.
- The before arm uses the *byte-exact prior Git blob* of `combat/v012-combat-runtime.js`, reconstructed only inside the isolated harness; no obsolete gameplay file or duplicate combat engine.
- Verify every E5 fight is **identical before/after** (initial Elite HP/ATK/DEF, win/loss, damage and duration). Any E5 mismatch fails immediately.
- Compare per-Elite and per-E wins, player damage received, battle duration, real enemy health/attack/defense and ability activations. Check that eight distinct Elites actually appeared 100% of registered arms.
- High-E 60–70% provisional Elite victory goal is **not guaranteed**, and synthetic control builds are not natural E1→E70 accounts. Avoid assuming increased coefficients alone solves every late-game discrepancy. If win rates remain saturated, report that and prioritize specific ability/strategy follow-up.

## Integration requirements

Pilot and full GitHub Actions success, successful native Unit tests for Stage 8.2 Elite abilities and Stage 8.4 Bosses, real-game small mob logic, E5 identical outcomes. Only then merge into canonical `audit/v013-stage6`. **NO DEPLOY**.

The next Stage 6.20 must assess *prepared* final Boss fights separately. E1 earned account progression remains a distinct unresolved bottleneck.
