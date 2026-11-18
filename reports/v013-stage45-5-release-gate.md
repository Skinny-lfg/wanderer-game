# Wanderer v0.13 — Stage 4.5.5 · Release gate

**Date:** 2026-11-17. **Base:** Stage 4.5.4, PR #50, commit `16e00ed14a2c940b385f4004e4091a5b94799585`. **Policy:** no merge, no production deployment, no cloud account/save changes.

## Verified baseline, not assumptions

- The GitHub Actions runs tied to PR #50's head completed successfully: `44171691759` (v0.13 integration) and `44171691662` (isolated Chromium browser QA).
- Stage 4.5.4 exercised the real desktop and emulated mobile Chrome UI: Camp, Talents, Realm Cards, map, fight, checkpoint, Reliquary, HP sacrifice and modifier disable with reload. Combat duration was accelerated by a test-only hook.
- Native integration already exercises natural Oracle, marked Elite, boss preparation, direct boss and completion paths (`tests/v013-full-expedition-integration.test.cjs`); this **does not** prove the equivalent full browser-click paths.
- Historical `npm test`: current CI run 44177794258 reports **393 tests, 297 passes and 96 failures** (previous baseline had 106 failures). This remains **not** release-green evidence.
- Current `npm audit` reports **41 findings** (19 moderate, 21 high, 1 critical). 37 are confined to dependency nodes marked dev-only in the lockfile; four high findings are in the `firebase` / Firestore / `@grpc/grpc-js` runtime dependency chain. Audit severity does not prove production exploitability.

## New evidence collection in this stage

The workflow `.github/workflows/v013-stage45-5-release-evidence.yml`:
1. Re-runs `npm run test:v013:gate` (native + simulator, blocking).
2. Re-runs isolated Chromium Playwright browser QA (blocking).
3. Captures the legacy `npm test` log + actual exit code (non-blocking only for evidence, explicitly **not** accepted as passing).
4. Captures `npm audit --json` + exit code (non-blocking only for triage, explicitly **not** security approval).
5. Uploads evidence artifacts; read-only workflow, no deploy credentials or permission to write to the repository.

The release-evidence run **44177794258 completed successfully**, including current v0.13 gate, the Stage 4.5.4 smoke, and the new Stage 4.5.5 natural-route Playwright test in Chromium (headless desktop plus 390px emulated mobile). It does not test Safari/iOS or physical Android.

## Release acceptance matrix

| Area | Evidence and acceptance requirement | Status at creation |
| --- | --- | --- |
| v0.13 logic + progression simulations | `npm run test:v013:gate` passed in run 44177794258 | **PASS** |
| Existing browser flow | `test:v013:stage45-browser` passed; 390px map screenshot reviewed; full real-device QA separate | **PASS — Chromium** |
| Oracle of Paths | Natural-route UI clicks, revelation/scouting and reload verified by Stage 4.5.5 Playwright | **PASS — Chromium** |
| Marked Elite | UI map ★, natural travel/combat, preparation once and reload verified by Stage 4.5.5 Playwright. Reward payout at extraction remains native-integration evidence. | **PASS — Chromium (reward via native)** |
| Final boss/extraction | Natural browser route, modifiers/escort reduction, victory, one level unlock and persistence after reload verified by Stage 4.5.5 Playwright | **PASS — Chromium** |
| Safari/iPhone | Actual Safari/iOS device test for map scroll, click, iframe, save/reload | **OPEN** (not tested) |
| Android | Android Chrome device test, including touch and overflow | **OPEN** (not tested) |
| Legacy suite | 96 failing cases extracted into per-test triage JSON, none automatically cleared; compare against old v0.12 contracts and fix genuine regressions | **OPEN — 96 failures** |
| Dependency security | 41 advisories grouped; 37 dev-only nodes, 4 high runtime-dependency findings needing bundle/exposure analysis | **OPEN — 4 high runtime-chain** |
| Accessibility/mobile | Touch targets, scroll, readable labels, keyboard and screen reader spot-checks | **OPEN** |

## Measured Stage 4.5.5 evidence (2026-11-17)

- Commit `a8363c4a8be4561f28e5fbd94234cb38acc3a50d`, workflow run **44177794258**: native/simulation gate **success**, Stage 4.5.4 mobile+desktop Chromium **success**, Stage 4.5.5 natural Oracle/Elite/boss+extraction **success**.
- UI paths in the browser log: Marked Elite `0→3→7→11`, boss `11→19`, natural Oracle `0→1→5→9→13→18`. The boss exit state reports `stage=finished`, `result=victory`. Tests verify one unlock and checkpoint persistence.
- Battle duration was shortened by the **temporary test-only** hook; real balance, enemy AI timing and live cloud persistence are **not** established by these browser tests.
- The new browser suite writes `reports/stage45-5-browser/` screenshots and result JSON; workflow upload was amended to include that directory, which needs the next run for archived screenshots.
- `npm test` run: 393 total; 297 pass, 96 fail. Recurring failure signatures include v0.12 save fixture validation (`Invalid v0.12 save: crafting progress`, 7 cases), missing legacy draft options (6), legacy DOM mock `onclick` handling (6), and many old combat/parity expectations. These are **candidate clusters**, not proof that failures are obsolete. The file `legacy-triage.json` lists all 96 and retains manual review flags.
- `npm audit`: 41 (19 moderate / 21 high / 1 critical), with 37 in nodes marked dev-only and four high on `firebase`, `@firebase/firestore`, `@firebase/firestore-compat`, `@grpc/grpc-js`. Critical `tar` is marked dev-only but remains relevant to CI/build supply-chain review. The available npm suggested Firebase replacement is a **major version downgrade** and must **not** be applied automatically.
- No real iOS Safari/Android hardware was accessed. Mobile viewport emulation in Chrome is not device QA.

## GO / NO-GO decision

**Current verdict: NO-GO for merge/deployment and NOT YET APPROVED for Stage 5.** The browser Oracle/Elite/boss cases now pass, but real-device QA, 96 legacy failures and dependency security are not cleared; the stage is **not** a production release approval.

Acceptance requires new workflow passing **and** documented handling of all open release-critical items. A conscious risk acceptance can be recorded separately for non-critical device variations or dev-only dependency findings, but must never be silently inferred from a green workflow.

## Guardrails

Keep all map branches and travel choices, existing difficulties, Talent Tree diagonal edges, run balance, player saves and production infrastructure intact. Do not merge or publish without explicit approval.
