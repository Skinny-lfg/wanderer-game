# Wanderer v0.13 — Stage 6.13: matched legal TalentGraph-only combats

**Canonical base:** `audit/v013-stage6` @ `dbb3b52d48e7a83436420a9bbd8e447578b3c40a`.

## Research question

Stage 6.12 produced 144 real-engine fights from 142 Talent-plus-equipment configurations. That evidence reveals broad difficulty but **does not isolate the value of the Talent Tree**: equipment, E tier, enemy and seed varied.

Stage 6.13 creates matched, controlled comparison pairs that **change only the native-valid v15 TalentGraph allocation**. Every pair holds equal XP point budget **and equal actual number of invested points**, with exactly the same complete native item-roll fingerprint, weapon/armor/offhand, chosen encounter, initial native enemy roster, resolved seed, route risk, conditions, modifiers, Buildcraft background and targeting policy.

Each arm is an independent replay of the actual native combat engine, not a calculated expected-DPS formula. Different talent choices can change hero health/spell/attack/barrier/stats, enemy responses, proc timing and combat outcome. Those changes are the **measured effect of the allocated build in that specific controlled fixture**.

## Real candidate pool and pair selection

- Use all **48 existing v0.13 archetypes** (21 strategically defined smart-agent profiles and 27 current native structural route endpoints) at 12, 24, 36 or 60 point budgets.
- Native Talents are constructed through Stage 6.12 and verified with `T.valid` + `T.earned`. Eligible pairs must use same budget, **same actually spent nodes**, different legitimate Talent snapshots, and at least a meaningful node/element change.
- Prioritize distinct skill/route archetypes, budgets, Affinities, pure/mixed/three-affinity plan variants, elemental attunement comparisons and advanced prepared abilities.
- Deterministically choose fixed equipment and opponent dimensions *per matched pair*, not separately per arm. Sample varied weapons, armor, Off-Hands and Normal/Elite/Boss enemy types; keep each fully fixed inside each pair.
- All candidate comparisons remain **planned-only** until two actual native battles successfully run and the pair integrity checks pass.
- A fixture's common background Buildcraft descriptor uses the primary family of its left-hand plan, fixed for both arms. Cross-family comparisons are conditional on that common context; they are not a general population ranking.

## Execution and provenance

- `npm run test:v013:stage613` — validate legal budget, exact pairing and deliberate mismatches.
- `npm run audit:v013:stage613:plan` — generate design-only 72-pair proposal.
- `npm run audit:v013:stage613:pilot` — 12 real paired comparisons = **24 native fights**.
- `npm run audit:v013:stage613:matrix` — 72 real paired comparisons = **144 native fights**, after pilot passes.
- Resume with identical command plus `--resume=true` only from a matching source/config/plan checkpoint. Fingerprints include current game engine and all underlying planners.
- Save full paired native outcomes and telemetry, gear/roster hashes, node diffs, unique talent states, prepared ability, time, HP ratio, barrier, healing, DoT and Mana metrics.

## How to interpret outcome

Categorize each pair as **left-only win, right-only win, both win or both lose**. Do not treat a simultaneous loss as proof of equal strength, or compare raw fight durations between a win and a death. The differences are paired causal evidence about these **synthetic fixtures only**, not naturally reached account results.

Important limits:

- Only one dimension (**talent allocation including mode and prepared ability**) changes *inside a pair*. Across pairs, level/gear/realm/budget can still vary; do not blindly pool different pair types into a global rank.
- Pairing by shared RNG seed gives common starting randomness; it does not ensure an identical sequence of random calls after two different abilities trigger. Differences in subsequent combat RNG are part of the actual behavior. Do not claim identical per-action random draws.
- Same point budget and invested points is guaranteed by the native state validation. Same node-to-node route length is *not* required; the routes may use different prerequisites, and each player's chosen Talents are genuinely purchased by native allocation.
- Advanced XP, items and Expedition access are **test fixtures**, not something the Stage 6.11 E1 progression agents earned.
- Potions, Boons, Forge optimization, talent resets over a whole account, enemy full-roster completeness and legal loot availability are outside this paired experiment; they remain separate work.
- Absolutely no gameplay balance edit, save migration, Firebase, deploy or production `main` modification.

**Acceptance criteria:** Stage 6.13 tests and Stage 6.10–6.12 tests pass; pilot and matrix complete without timeout, missing encounters or fixture drift. Only then merge the scoped PR to `audit/v013-stage6`.
