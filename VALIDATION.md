# Stage 3 validation

Executed locally on audit/v013. All sessions used synthetic data.

| Command | Observed result |
|---|---|
| node --test tests/v013-runtime-parity.test.cjs | 2 passed. Ordered source and override sensitivity; Edge Chromium vs CLI initial, per-update and final state for one group of 12. |
| node --test tests/v0120-results.test.cjs | 5 passed. Before test corrections 2 passed, 3 failed. Covers automatic settlement and repeat reward prevention, extraction, death summary, Boss rune claim and malformed presentation. |
| node scripts/simulate-progression.cjs --mode=enemies --levels=1 --seeds=501 --builds=blood-fury --group-sizes=3 --points=0 --out="$env:TEMP/wanderer-s3-one.json" | One case, win, zero errors/timeouts, 182 updates, 20.02 native seconds, focus policy. |
 
The browser test ran with NODE_PATH pointing to the already-installed Playwright dependency in wanderer-production/node_modules and WANDERER_BROWSER pointing to the installed Edge executable. The other checkout was only read. Normal Playwright installations can use the default Chromium executable. Intermediate checks: one update for initial state SHA, three updates for native time (0.33 s), three updates under adds policy. The first high-gear browser fixture killed enemies before any cast; the final Common gear fixture explicitly requires and compares a timed cast. No campaign, production account or remote write.

## Stage 4 — scaling regression
- Original revision d48af993. Ran node tests/v013-scaling-regression.test.cjs --capture-baseline before the first production edit. For the final two scenarios, ran the same command against a temporary git archive of d48af993. The capture command creates a new file exclusively; normal tests never rewrite it.
- Ran node --test tests/v013-scaling-regression.test.cjs after centralizing pressure and escort rules (9/9), then with the additional no-condition and Vanguard fixtures (11/11).
- Ran node --test tests/v013-scaling-regression.test.cjs tests/v013-runtime-parity.test.cjs tests/v013-stage80-enemy-roster.test.cjs after sharing strike caps (20/20 at that point, including the Chromium trace). Browser dependency configuration as above.
- Eleven final fixtures, E1/E6, all three risk levels and six affinity families. Initial ordered stats and the SHA-256 of the sequence of native run states after every update match the original. The run includes actor order, group clocks, HP, barrier, timed abilities, damage metrics, reserve and logs. Also compared final elapsed time, damage, cast counters, reserve entries and outcome separately. Two Boss identities and two Elite archetypes are represented; not an exhaustive balance survey.

## Stage 4.5 targeted verification
- node --test tests/v013-stage81-enemy-abilities.test.cjs — 15/15. Exercised all five ordinary ward abilities below, at and above their own strength, actual grant delta, and additive hero grants including the over-cap case. Expected results come from protection semantics, not baseline equivalence.
- node --test tests/v013-scaling-regression.test.cjs tests/v013-map-ui.test.cjs tests/v013-dungeon-checkpoint-integrity.test.cjs — 35/35 at this point, including existing native scaling fixtures and checkpoint/map tests.
- node --test --test-name-pattern="Vanguard" tests/v013-dungeon-checkpoint-integrity.test.cjs — 1/1 additional test. Moved the marker from node 2 to node 1 on identical generated input, restored the checkpoint and checked simulated metadata, actual HP/ATK (round ×1.8; ceil ×1.2), and absence of the effect on unmarked node 2.
