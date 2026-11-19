# Stage 3 validation

Executed locally on audit/v013. All sessions used synthetic data.

| Command | Observed result |
|---|---|
| node --test tests/v013-runtime-parity.test.cjs | 2 passed. Ordered source and override sensitivity; Edge Chromium vs CLI initial, per-update and final state for one group of 12. |
| node --test tests/v0120-results.test.cjs | 5 passed. Before test corrections 2 passed, 3 failed. Covers automatic settlement and repeat reward prevention, extraction, death summary, Boss rune claim and malformed presentation. |
| node scripts/simulate-progression.cjs --mode=enemies --levels=1 --seeds=501 --builds=blood-fury --group-sizes=3 --points=0 --out="$env:TEMP/wanderer-s3-one.json" | One case, win, zero errors/timeouts, 182 updates, 20.02 native seconds, focus policy. |
 
The browser test ran with NODE_PATH pointing to the already-installed Playwright dependency in wanderer-production/node_modules and WANDERER_BROWSER pointing to the installed Edge executable. The other checkout was only read. Normal Playwright installations can use the default Chromium executable. Intermediate checks: one update for initial state SHA, three updates for native time (0.33 s), three updates under adds policy. The first high-gear browser fixture killed enemies before any cast; the final Common gear fixture explicitly requires and compares a timed cast. No campaign, production account or remote write.
