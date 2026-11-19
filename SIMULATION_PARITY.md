# Stage 3 preparation — simulator differences

Analysis only. Preserve the existing manual target control and all coefficients.

| Boundary | Browser | Simulator | Proposed correction and acceptance |
|---|---|---|---|
| Initialization | index.html calls phase1Init, restores screen state and renders. The account entrypoint attaches persistence. | tests/v012-economy-harness.cjs:6–34,119–122 replaces bootstrap and UI and provides isolated storage, seeded randomness and inert timers. scripts/simulate-progression.cjs:150–188 prepares fixtures. | Record fixture type and seed streams. Compare native post-entry state for identical gear, build, actors, card and decisions. Keep accounts isolated. |
| Clock | combat/v012-combat-runtime.js updateFight advances a fixed .11 per eligible update; browser schedules updates. | The harness invokes updateFight directly; the CLI counts calls and independently converts ticks to seconds. | Read elapsed combat time from the native run and report call count separately. Verify early exit, pause and timeout without comparing wall-clock time. |
| Modules | Ordered script tags include tier upgrade and other browser modules. | Harness maintains a separate list plus discovered runtime scripts. Current fingerprint includes browser sources and omits the harness. | Record actual loaded modules in order plus overrides, harness, entrypoint and scenario settings. Distinguish UI-only omissions from missing mechanics. Verify fingerprints change on an actual dependency edit. |
| Target selection | Manual arena selection checks a living visible target and updates enemy and its clock before redraw. | CLI focus/mechanics/adds policies assign enemy and tEnemy directly before tick. | Share the validated target-change action only; keep strategy exclusively in CLI and redraw exclusively in browser. Compare target and clock after the same manual decisions, including death and reinforcement. |

Use one bounded deterministic trace for identical initial state and explicit decisions; compare HP, barrier, status clocks, reserve, outcome and ledger at each relevant event. The existing tests show native tick reuse, not end-to-end parity. Deployment snapshots and simulator sources were not changed.
