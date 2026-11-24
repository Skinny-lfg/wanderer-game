# Stage 6.47D.9B — Percentage-only decision

User selected pure percentage stat nodes after the matched native pilot (run 45407138467, commit 8654bc6833a493f48cb1624b12137b80e9b64f35).
Attack, Defense, Max HP and Spell Power: 2/3/4% by tier. Additive per attribute against the same pre-graph stat; existing affinity/ability modifiers follow as before. Evasion, attack speed, mana, mana regen, barrier, primary attributes and status effects unchanged. Node IDs, tree layout and save schema unchanged. Planner uses normalized percentage-point weights rather than retired flat values. Historical 9A/9B scripts and reports remain reproducible at their original commits, not against the new graph.

Pilot E10 controlled win rates (normal/elite/boss): current 94.83/94.63/88.17%; percent-only 90/89.13/81%. E100 all resolved wins; percentage-only boss damage received 107.41 vs 145.82 current. Only four E10 and three E100 actors; no E200. This choice is a design decision, not a claim of balance. Natural progression validation is required before calibration/deploy.
