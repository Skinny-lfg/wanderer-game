# Stage 6.14 follow-up — Retest the three positive one-node cases with new seeded enemies

**Canonical starting checkpoint:** `audit/v013-stage6` at `9d5b3a58d195780494d6416498a01fb5bdf337a7`.

## Why

Stage 6.14 isolated individual Talent purchases for six seeds per skill. Exactly three preselected one-node cases had any previously gained victory: `unbreakable` (+2/6), `arcane_focus` (+1/6), and `brace_rank2` (+1/6). The question now is **whether these previously selected observations replicate on new, genuinely different RNG seeds and alternative native opponent styles**. This is a *follow-up selected on observed positive outcomes*, with an explicit selection bias; results must not be reported as independent proof of global talent strength.

## Registered source cases and opponents

All six *original node snapshots* (baseline and treatment per target), point budgets, source agent plans and equipment are recovered by matching their immutable Stage 6.14 hash fingerprints and validated again through `WandererAutomaticTalents.valid`, `earned` and `allocate`. The study refuses to run if the original legal tree or plan has drifted.

| One native purchase | Exactly retained source setup | Original enemy | Same category, different Affinity | Different category |
| --- | --- | --- | --- | --- |
| **Unbreakable, rank 1** | `route:unbreakable`, E15, 24 available points, 23/24 spent, Wand + Orb, Plate | Elite / Decay | Elite / Magic | Boss / Decay |
| **Arcane Focus, rank 1** | `profile:decay-magic-aegis`, E15, 24 available points, 23/24 spent, Staff, Leather | Normal / Vitality | Normal / Decay | Elite / Vitality |
| **Brace, rank 2** | `route:arcane_bastion`, E70, 60 available points, 59/60 spent, Two-Handed, Cloth | Boss / Decay | Boss / Aegis | Elite / Decay |

*Every item is a real native deterministic RNG roll. Item access, chosen rarity, high-level progress and Talent XP are artificial fixtures, never an earned E1 account.*

Within a paired match: **identical full gear roll fingerprint, enemy roster, resolved seed, Affinity, encounter, Conditions, Boss modifiers, other talents, element, prepared ability, and fixed targeting policy**. Only **one legal node/rank purchase** changes. Baseline leaves one point unspent. Across separate independent seeds, gear and enemy rosters can change normally.

The pilot uses **4 seeds per each of 9 registered strata** = 36 pairs / 72 real native fights. The final confirmatory run uses **32 new seeds per stratum** = 288 pairs / 576 real fights. The smaller pilot is a deterministic **subset** of the 32-seed run; never add pilot numbers to final as independent evidence. These seed starts are disjoint from the Stage 6.14 original six.

## Readouts

- For each *node × opponent* stratum separately: baseline wins, wins with purchased node, node-only wins, baseline-only wins, both wins/losses, and **paired win delta** in percentage points.
- Additional native telemetry: mean health-end fraction change, Barrier generated/absorbed, healing, DoT, Mana, and median time delta only on pairs in which **both versions won**.
- Never pool different Boss/Normal/Elite categories to claim one global node effect; per-node totals only convey total actually tested cases. Do not label a non-flip as evidence of zero impact.
- Explicit caveat: the study was chosen because these cases looked beneficial in Stage 6.14, so regression to the mean and false-positive selection are possible. Replaying on 32 new seeds improves diagnostics but is still insufficient to prove balance.

## Acceptance gates

- Unit tests verify **exact original source identity**, genuine native Talent legality, all preplanned enemy strata and seed uniqueness, non-Talent match equality, and source+configuration locked resume.
- Previous Stage 6.10–6.14 tests must pass unchanged.
- Pilot followed by full 576 actual native fights with no timeout, unsupported encounter, invalid Talent state, mismatched equipment/opponent, or unexpected skipped case.
- Report actual measured results, including contradictory/negative outcomes, not just favorable ones.
- No edits to game combat coefficients, enemy abilities, saves, assets, main or Firebase; no deployment.
