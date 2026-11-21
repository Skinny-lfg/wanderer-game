# Stage 6.15 — Native Normal → Elite → Boss gap audit, without balance edits

**Canonical starting SHA:** `2a1abfdfb87724392bb6e264e9978ebeb7d59273` on `audit/v013-stage6`.

## Why we're returning to enemy balance

Earlier native runs found a major difficulty gap between Elites and Bosses; Stage 6.11 genuinely earned accounts won just **5 of 27 Boss fights** (24 accounts/164 attempts/297 fights), while synthetic advanced builds in Stage 6.12 won only **6 of 48 sampled Boss fights**. Neither campaign offered a **strict same-gear, same-build, same seed and same Realm** normal-vs-Elite-vs-Boss hierarchy contrast. The late Stage 6.14 node-ablation retests similarly mixed enemy types in different contexts. This stage fills that gap before considering skill opportunity-cost or combat balance coefficients.

## Preplanned controlled study

- 6 real Boss/Realm Affinities: Blood, Decay, Vitality, Aegis, Fury, Magic.
- 4 synthetic legal v15 Talent point budgets at E5, E15, E35 and E70: 12, 24, 36 and 60.
- 2 strategy profile styles per Realm: matching-primary Affinity and off-primary mixed comparison, both selected from existing native-legal Stage 6.12 strategy profiles. **No random Talent point spending**.
- 8 distinct native gear RNG seed starts per exact Realm × budget × build case.
- **384 matched triples / 1,152 actual native combats**, each triple comparing the **same player + same Native rolled gear + identical Talent graph + same Realm + same Danger risk/conditions + same initial seed** against (1) a native room group of 3 Normal mobs, (2) a native Elite, and (3) a real Affinity Boss.
- Pilot is 2 of the 8 seeds per cell: **96 triples / 288 real fights**. Pilot is a subset of final matrix; don't count twice.
- Use actual game engine `S.encounter` and real enemy ability/AI code; no enemy-stat overrides and no artificial damage formula. Same fixed `focus` target selection across groups; real game behavior continues to vary by enemy class.
- Danger risk 1 and Rare gear; not evidence for Normal/Deadly risk, but isolates the baseline enemy hierarchy. Even under same seed the enemies **cannot** have identical rosters by class, and actual combat RNG consumption can diverge.

## Measured dimensions

- Paired victory rates by Normal / Elite / Boss, **per Realm/Boss Affinity and separately by E tier and source profile alignment**.
- Most important direct indicator: percent-point gap Elite win vs Boss win, plus exact number of paired instances where Elite won but Boss killed the same build. Also reverse anomalies where Boss was beaten but Elite not.
- Normal encounter includes 3 native mobs; log actual role counts, including whether a Tank mob spawned. A normal three-mob group is not an isolated **tank-only duel**; avoid calling it that.
- Actual initial enemy roster HP/ATK ratios Boss vs Elite, (Elite vs normal mob group), boss/elite ability casts, Boss minions/healing/wards and player damage taken; log full rosters and actual elite types/Boss IDs seen.
- Breakdown at 4 levels and 6 Boss affinities, including aligned and off-affinity player builds, to reveal whether the gap only occurs with underbuilt players or persists into later E.
- Correlate stat scale and mechanics, but do not automatically attribute causality to raw HP, ATK or a specific Boss ability without isolated follow-up experiments.

## Key limitations

**This is a comparative synthetic fixture, NOT earned-account E1 Expedition progression.** Both advanced Talent points and native rolled gear are artificially supplied. Bosses are staged in an early native combat room without 15-Realm traversal or optional Boss-preparation earned bonuses, which can exaggerate Boss difficulty compared with natural prepared final fights. Boss modifiers and abilities are real and NOT manually turned off. The initial group of 3 Normal enemies and the single Elite/Boss leader differ by actual design; we compare native encounter designs, not matched number of enemy actors.

Because Stage 6.11 natural accounts struggled to reach beyond E2, synthetic controlled high-E tests and genuine earned progression must be reported separately. The next stage should test Boss preparation/access if it materially changes this gap, then consider targeted individual-stat changes only after reproducible evidence. Do not apply one global multiplier to all Bosses or all Elites.

**Strict no-change boundary:** new simulator, tests, reports and no-deploy CI only. Don't change actual enemies, talent coefficients, saves, production main, Firebase, or approved art.
