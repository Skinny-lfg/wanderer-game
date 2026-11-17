# Wanderer v0.13 — Stage 4.5.5 · Release gate

**Date:** 2026-11-17. **Base:** Stage 4.5.4, PR #50, commit `16e00ed14a2c940b385f4004e4091a5b94799585`. **Policy:** no merge, no production deployment, no cloud account/save changes.

## Verified baseline, not assumptions

- The GitHub Actions runs tied to PR #50's head completed successfully: `44171691759` (v0.13 integration) and `44171691662` (isolated Chromium browser QA).
- Stage 4.5.4 exercised the real desktop and emulated mobile Chrome UI: Camp, Talents, Realm Cards, map, fight, checkpoint, Reliquary, HP sacrifice and modifier disable with reload. Combat duration was accelerated by a test-only hook.
- Native integration already exercises natural Oracle, marked Elite, boss preparation, direct boss and completion paths (`tests/v013-full-expedition-integration.test.cjs`); this **does not** prove the equivalent full browser-click paths.
- Historical `npm test`: the previous QA report records 106 failures. This is an inherited baseline, **not** release-green evidence.
- Prior `npm ci` reported 41 dependency findings (19 moderate, 21 high, 1 critical). Findings require direct exposure assessment; their severity counts alone do not prove exploitability.

## New evidence collection in this stage

The workflow `.github/workflows/v013-stage45-5-release-evidence.yml`:
1. Re-runs `npm run test:v013:gate` (native + simulator, blocking).
2. Re-runs isolated Chromium Playwright browser QA (blocking).
3. Captures the legacy `npm test` log + actual exit code (non-blocking only for evidence, explicitly **not** accepted as passing).
4. Captures `npm audit --json` + exit code (non-blocking only for triage, explicitly **not** security approval).
5. Uploads evidence artifacts; read-only workflow, no deploy credentials or permission to write to the repository.

**No UI/device claim is made on the basis of the new workflow until its run completes.**

## Release acceptance matrix

| Area | Evidence and acceptance requirement | Status at creation |
| --- | --- | --- |
| v0.13 logic + progression simulations | New workflow `test:v013:gate` must pass | PENDING NEW RUN |
| Existing browser flow | New workflow `test:v013:stage45-browser` must pass, screenshots inspected | PENDING NEW RUN |
| Oracle of Paths | Natural-route browser clicks; verify revelation/scouting, reload, no repeat grants | **OPEN** (native test only) |
| Marked Elite | Browser-visible marker, natural travel/fight, reward/preparation exactly once, reload | **OPEN** (native test only) |
| Final boss/extraction | Natural route to final boss via UI; modifiers match choices, victory, unlock and extraction/checkpoint | **OPEN** (native test only) |
| Safari/iPhone | Actual Safari/iOS device test for map scroll, click, iframe, save/reload | **OPEN** (not tested) |
| Android | Android Chrome device test, including touch and overflow | **OPEN** (not tested) |
| Legacy suite | Classify each of 106 historical failures as stale, environmental or genuine regression; block on genuine regressions | **OPEN** |
| Dependency security | Triage full `npm audit` data; distinguish dev-only/build tooling vs reachable production bundles, address exploitable critical/high | **OPEN** |
| Accessibility/mobile | Touch targets, scroll, readable labels, keyboard and screen reader spot-checks | **OPEN** |

## GO / NO-GO decision

**Current verdict: NO-GO for merge/deployment and NOT YET APPROVED for Stage 5.** Existing integration green is not sufficient while full boss/Oracle/Elite browser QA, real-device QA, legacy failures and dependency security are unclassified.

Acceptance requires new workflow passing **and** documented handling of all open release-critical items. A conscious risk acceptance can be recorded separately for non-critical device variations or dev-only dependency findings, but must never be silently inferred from a green workflow.

## Guardrails

Keep all map branches and travel choices, existing difficulties, Talent Tree diagonal edges, run balance, player saves and production infrastructure intact. Do not merge or publish without explicit approval.
