# Wanderer v0.12 — Firebase live validation and release preparation

**Recommendation: NOT READY — pending GitHub secret setup and an explicitly authorized production Hosting release.**

Branch: `development`
HEAD: `af5e0d917913e01ae03cf426ddbd7864f5dcb009`
No account was created, no real save/profile/feedback data was read or written, and no Firebase Rules or Hosting deployment was made. `main` was not changed.

## Project identity and access

Repository configuration identifies:

- Current `main` Web App project: `wanderer-play`, read from `online/firebase-config.mjs` on `main` at commit `b1ad77889871995f9a1ac6ca854776b5080441ba`.
- Current `development` Web App project: `wanderer-development-8e3ee`, from the local config at this branch's HEAD.
- An older development README had named `wanderer-test-8f062` as production. That reference was stale and has been corrected. The development config now refuses both known production IDs.

These are source-level identifiers, not proof of the Firebase Console's current state or of which project contains the accounts. The Firebase CLI reports **no authorized accounts**. `.firebaserc` is absent; the local `firebase.json` configures Firestore Rules and emulators only, with no Hosting site/target. Consequently the following remain unverified: Authentication providers and authorized domains, Firestore database ID/edition, live Rules, Hosting site/channel, OAuth settings, account counts, save counts, profile/feedback counts, backup contents, and production data ownership. No backup was made because there is no authenticated project access and no safe destination was provided.

The GitHub development Hosting workflow is explicitly restricted to `wanderer-development-8e3ee`, deploys channel `live`, and runs only on dispatch or a marked development commit. It is not a preview-channel workflow for the production project. A local Hosting artifact build was checked with a synthetic commit SHA; it was not uploaded. No definitive-project preview was configured or deployed.

## Account preservation and live validation

The code keeps Firebase UIDs when Auth uses the same Firebase project, stores v0.12 under `players/{uid}/saves/v012`, and never reads/imports `v092`. The current `development` and `main` configs point to different Firebase projects, so this work does **not** demonstrate cross-project UID continuity. It also does not demonstrate that existing users are present in `wanderer-play` or that its OAuth domains/providers match the app.

No live test users were created. The requested real-project flows—password registration/login/reset, Google OAuth, Guest/link conflicts, refresh, two-account isolation, cloud save/recovery, feedback, and cross-device behavior—were not run. Creating identifiable synthetic accounts is still awaiting the required explicit authorization. No real data counts, exports, or backups were produced.

## Local fixes and Cloud Saves

- Added a development-config guard for both production project IDs found in repository history/current `main` config.
- Cloud payloads now have a 680,000-byte UTF-8 limit checked before writing, below the Rules' 700,000-byte payload cap.
- Diverged outboxes remain on-device. The Account dialog offers recovery-file export and requires an explicit checkbox before loading the current cloud save and discarding that device's pending copy.
- Feedback now obtains a 20-character commit identifier from the Hosting build artifact instead of recording the Phase 2 base SHA as if it were the deployed commit.
- Local synthetic envelope sizes (payload plus Firestore document fields, approximate JSON byte representation):

| Scenario | Stash items | Payload | Envelope |
| --- | ---: | ---: | ---: |
| New synthetic account | 1 | 1,094 B | 1,405 B |
| Intermediate synthetic account | 40 | 9,344 B | 11,449 B |
| Full supported Stash | 300 | 64,864 B | 78,929 B |

These fixtures include three Runes and a small potion inventory. An advanced active Expedition with worst-case event/combat logs was not measured; add that case before release. No production or user save was used for sizing.

## Rules, feedback, and security

`npm run test:rules` passes 10/10 tests on the local Auth/Firestore Emulator, covering registered/Guest policy, linking and UID preservation, save ownership/version/revisions, feedback privacy and rate limiting. The pre-existing v092/profile behavior also remains covered by the same local Rules suite.

The currently published Rules were not fetched, so there is no live Rules diff or compatibility result. Local Rules are **not approved for production** and were not published. The app remains client-authoritative: an owner can fabricate gameplay/economy state and increment their revision. Rankings and gameplay results must remain unverified or disabled until a separate trusted-server implementation is approved. Anonymous per-UID feedback limits can be evaded by creating new anonymous identities.

Feedback includes UID, category, description, steps, version, build commit, viewport, optional browser information and a short sanitized error summary. Rules deny client reads and enforce an atomic per-UID interval. Live feedback submission and live database permissions were not tested.

## Hosting, UI, and release branch

The existing workflow targets only the development project's `live` channel. No preview channel/site ID was available locally, and there is no authenticated access to list Hosting sites. The local package script validated a synthetic build artifact and commit injection; it does not establish live Hosting behavior. No deployment occurred.

`npm run test:browser` passes, including the Account dialog viewport smoke test at 360×800, 390×900, 430×900, 768×900, 1280×900 and 1440×900, plus the existing Forge, Inventory, Expedition and private-preview tests. The Account smoke test opens the UI only; it does not sign in or contact live Firebase. Save status and recovery UI are rendered in that dialog.

GitHub reports `development` at `af5e0d9` and `main` at `b928b25`. Comparing `main` as base and `development` as head reports **705 commits ahead and 60 behind**, with merge base `197a5449aaad08988d6667d1d5f1a62e8b54e636`. The branches are substantially diverged; no merge plan can be considered validated from this patch alone. PvP remains absent from the v0.12 public entrypoint.

## Test results

- `npm test`: **373/373 PASS**.
- `npm run test:browser`: **PASS**, including six Account dialog viewport checks.
- `npm run test:rules`: **10/10 PASS**, local Firebase Emulator only.
- `node --test tests/v012-cloud-save.test.mjs`: **PASS**, including UTF-8 size and explicit conflict recovery cases.
- Local Hosting artifact preparation with synthetic commit: **PASS**; no upload/deploy.
- `node --check` on changed JavaScript modules and `git diff --check`: **PASS**.
- Firebase live Auth/Firestore/Hosting tests: **NOT RUN** (Firebase CLI has no authorized account).

The browser suite regenerates tracked screenshots. The 63 generated screenshots were restored after confirming they are tracked outputs from the test scripts and existed at HEAD. The generated `docs/v012-ui-polish-balance/screenshots/after/mobile-layout-metrics.json` is not a screenshot and was left untouched after regeneration; it is included in the patch as requested by the patch exclusion rule.

## `main` readiness and release checklist

**NOT READY FOR MAIN VALIDATION.** Before requesting final release approval:

1. Sign in to the Firebase account with read-only access first; confirm `wanderer-play` is the intended account-owning project and identify database edition, Auth providers/domains, Firestore database, Hosting site IDs and published Rules.
2. Agree on a secure backup destination and perform a verified Auth/Firestore backup before any live change. Record counts without exposing user data in this repository.
3. Present the exact synthetic test-account plan (providers, recognizable addresses, number of accounts and cleanup/retention policy) and obtain explicit authorization before creating accounts.
4. Compare local and published Rules, run live compatibility checks using synthetic accounts, and present the Rules diff for approval. Do not publish until separately authorized.
5. Identify the Hosting site and preview channel in the confirmed project, then present the exact target and deployment command for approval. Never target `live` in this validation phase.
6. Validate an active advanced Expedition snapshot's UTF-8 envelope size and the end-to-end conflict-resolution UI on the authorized preview.
7. Reconcile the 705/60 branch divergence, inspect the exact release diff, verify no secrets, and prepare rollback steps for code, Rules and data. Do not merge `main` in this task.

The earlier Phase 2 patch checksum described an intermediate patch only; it does not identify the completed release preparation.

## Controlled production Hosting workflow

The later release preparation adds `online/firebase-config-production.mjs` for the `wanderer-play` Web App while preserving `online/firebase-config.mjs` as the isolated development configuration. The production config is copied into the generated Hosting artifact as `online/firebase-config.mjs`; it does not replace the checked-in development config.

The production packager copies public files from `assets/`, `online/`, `combat/`, and `economy/` into `hosting-dist/`, includes `index.html` and `auth-action.html`, omits the source SDK module, and checks required assets and referenced asset paths. Hosting is configured in the workflow on the runner only, with `public: hosting-dist`; the repository's Firestore Emulator configuration is not changed for this deployment.

The existing Hosting workflow now has a separate production job, so it appears in the repository's existing Actions workflow list without changing `main`. The production job can run only by manually dispatching from `development`, selecting `production`, entering `DEPLOY wanderer-play`, and providing the `FIREBASE_SERVICE_ACCOUNT_WANDERER_PLAY` repository/environment secret for the matching project. Push events cannot run the production job. It runs `npm test`, builds the artifact, and deploys Hosting channel `live` through the GitHub Action. It does not deploy Firestore Rules. No release was dispatched or deployed in this task. Configure a GitHub `production` environment protection reviewer before using the workflow if a second human approval is required at the final release boundary.
