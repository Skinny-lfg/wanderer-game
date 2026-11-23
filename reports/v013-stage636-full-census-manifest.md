# Stage 6.36 — Reproducible 24-account native gear-impact census

**Trigger:** `[run-stage636-full]` in this commit. No deploy.

Validated preflight: https://github.com/Skinny-lfg/wanderer-game/actions/runs/45189511262

- First smoke: `smart-blood-pure`, seed 9861, real unlocked E2; 4 native matched first-ring encounters with the same enemy roster and no artificial E unlock. Removal of an earned armor piece produced +8.7591% UI Power for the equipped hero relative to the one-item-less counterfactual. Of the two pairs where both variants won, **both had 0% difference in combat time**. The other two pairs were double losses. This observation alone is **not** a general upgrade-perception statistic.
- Full matrix: exactly 12 distinct real agent strategy profiles × two account seeds, each grown from E1 naturally to at most E200 (12 attempts / E, 400 attempts / account), 4 scenarios per reached target E and 2 identical native roster/seed variants per scenario.
- E2, E5, E10, E20, E35, E70, E100, E150, E200 observed ONLY if unlocked; missing level => censored.
- Comparison is one-item removal, **not** artificial +1% gear, not a manufactured Epic, and not evidence of a naturally reachable combat route. The agent has their original real gear, talents, XP and permanent attributes. In the explicitly isolated diagnostic run, only one already owned nonweapon item is unequipped.
- Native enemy abilities are enabled. Fail if initial roster, HP, ATK, role, realm, seed, Condition or risk do not match.
- Report simultaneous wins, combat-time differences, wins that flip, timed-out fights, HP remainder, per-Boss/Elite results and diagnostic Power differences. Do not count a defeat as a time-to-kill improvement.

The Stage 6.35 median growth remains the empirical baseline; this Stage is an **additional causal probe of item relevance**. The 24 accounts are a selected exploratory sample, not the full 500-account cohort.

PR: https://github.com/Skinny-lfg/wanderer-game/pull/140

No gameplay changes, merges, deploys, or item inflation.