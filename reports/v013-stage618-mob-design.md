# Wanderer v0.13 — Stage 6.18: implement native normal-mob roster balance

## Why this changes gameplay

Stage 6.16 observed six native mobs inflicting only ~22 median damage vs 98 for four mobs, while very large swarms were trivial. Stage 6.17 isolated the two causes in 960 native battles: too few principal roles and too aggressive 6+ principal stat scaling. Both maximum-strength trial changes at E5 were too hard (33/48 player wins, 68.8%), so neither full 6.17 combined experiment nor a blanket HP/ATK buff should go live.

## The actual source change

`online/v013-enemy-roster.js` now changes **only normal mob roster planning and principal-role scaling**:

- Solo/duo/triple/four enemy composition and their scaling remain unchanged, including E1 opening mobs.
- Five enemies: 2–3 principal Tank/Caster/Skirmisher roles, remainder Minions.
- Six: 2–3 principals (seeded 60% probability for three) plus 3–4 Minions.
- Eight: three principals and five Minions.
- 9–12: three or four principals; 13–17: three/four; 18–22: three/four, with only the first four visible slots reserved for principal roles.
- Preserves the Realm-specific weighted role distribution, deterministic RNG, existing unique mob names and art; no generic automatic enemy HP/ATK increases.
- For principal roles in groups of size 6–12, interpolate per-mob scale **HP 0.53 → 0.40**, **ATK 0.45 → 0.34**, **DEF 0.70 → 0.64**. For 12–20, interpolate **HP 0.40 → 0.29**, **ATK 0.34 → 0.25**, **DEF 0.64 → 0.60**. Above twenty, clamp to the twenty-mob endpoint.
- The original weak Minion scaling and all solo/small-group scales are unchanged.
- No change to Elite/Boss mechanics, player progression, consumables, loot, UI, artwork or save migration.

## Comparison and test plan

The Stage 6.17 original live roster rule is reconstructed **only inside the test runner's isolated VM** (checked byte-for-byte against the historical original file). This allows exact pre/post same-seed native fights without keeping an obsolete alternate gameplay module in the live folder.

- Pilot: 48 matched hero states × five normal group sizes (4,6,8,12,20) × before/after = **480 native fights**.
- Full: 96 matched hero states × five sizes × before/after = **960 native fights**; pilot subset of full.
- Coverage: six Affinities × E5, E15, E35, E70 legal Talent budgets × two existing real-build profiles × one/two deterministic seeded starts. Dangerous Risk, Rare natural gear rolls at synthetic level, fixed focus policy.
- Unit and integration regressions: 1/2/3/4 preserved exactly; 5–22 deterministic principal/Minion counts and role weighting; six-plus stat curve smooth; Stage 6.17 baseline reproducibility; E1 native first enemy not Minion; Stage 8.1 mob abilities, Stage 8.2 Elites, Stage 8.4 Bosses, native integration.
- Separate limited native-account **E1–E2 earned progression smoke** via the established Stage 6.11 campaign runner; must not be conflated with synthetic full battle percentages.
- Decision gates: E5 six-mob player wins ≥80%, within 12 pp of four-mob E5 wins, six-mob median player damage at least 60% of four-mob median; roles 2+ principals. Failing gates means revise the formula, not approve it blindly.
- All tests/CI are **NO DEPLOY**. Only merge to the canonical `audit/v013-stage6` development branch after evidence passes.

## Status

Gameplay implementation committed to a dedicated Stage 6.18 PR branch. Full results and verification will follow CI; this document deliberately claims no unexecuted outcomes.

## Calibration note — first full checkpoint

The first full matched 960-combat run completed successfully at https://github.com/Skinny-lfg/wanderer-game/actions/runs/44911608248, with 96/96 player equality checks and 4 earned-account E1/E2 smoke samples (11 native rooms). Four mobs were unchanged and showed 99 damage median; six rose from 22 to 57.5, eight from 25.5 to 69.5, twelve from 34 to 59.5 and twenty from 44 to 55.5. **One predeclared gate failed**: six/ four median damage = 58.1%, below 60%. E5 six survived 24/24, so a carefully constrained increase to **principal role** scaling (not Minions) was made as a second iteration. The latest source requires a fresh full CI check; do not report the earlier test as proof of the final tuning.
