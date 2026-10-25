# Wanderer v0.12 Firebase integration report

**Recommendation: NOT READY**

Branch: `development`
Base: `af5e0d917913e01ae03cf426ddbd7864f5dcb009`
No commit, push, merge, deployment, production access, or Rules publication was performed.

## Previous architecture

`online/firebase-client.mjs` already initialized the development Firebase project and supported Google and email/password sign-in, public profiles, feedback, and a private `players/{uid}/saves/v092` document. The v0.12 game used `online/v012-save.js` and `online/v012-persistence-runtime.js` for local, isolated saves; its account UI described local preview behavior. Firestore Rules were closed by default outside the existing v092, profile, feedback, and unverified playtest collections. The private preview transforms its HTML and removes online modules.

The local Firebase SDK bundle lacked several auth and Firestore methods required by the new flows, so `createBackend()` could fall back to Firebase CDN modules. The bundle source and generated bundle now include the missing methods; public authentication no longer needs that CDN fallback. The private preview strips the account module and does not load Firebase.

## Authentication and existing accounts

- Reused the existing Firebase app/auth/database client. Added anonymous Guest auth, Google/email linking, and UID-scoped v0.12 save methods.
- The public account module watches Firebase Auth on startup, restores the existing session, and loads that same UID's v0.12 save. Google/password users retain their Firebase UID when signing into the same development Firebase Auth project. Existing public profile nicknames are read and displayed as the game nickname when available.
- Guest linking uses Firebase linking APIs on the current anonymous user, which preserves its UID. `credential-already-in-use` and email conflicts are shown without switching UID or attempting a save merge. Email verification/reset APIs remain available in the shared client; account creation still sends verification.
- Logout flushes pending saves before sign-out. A failed flush keeps its UID-specific outbox and prevents a success indication.

Production account continuity was not tested: only the development configuration was used, and no production project or account was accessed.

## Cloud Saves v0.12

The new document is `players/{uid}/saves/v012`, separate from `v092`. The payload uses `wanderer-expedition`, schema 13, and the v0.12 save validator. A transaction creates revision 1 only when the v0.12 document is absent; existing documents are loaded and validated. No `v092` read, migration, or write was added. A new account gets `WandererV012Save.create(game.newSave(), ...)`, which produces fresh starting progress and resources.

Writes are debounced by 600 ms and serialized by an envelope revision compare-and-set. The local outbox is scoped by UID. It is retried on reconnection; after restart it is applied only when its recorded base revision still matches cloud, or discarded when cloud already contains the same payload. Diverged revisions stop automatic overwrite and retain the local recovery copy. Refresh restores the full validated Expedition profile/checkpoint, including award ledger and active session.

The browser cannot reliably finish an asynchronous Firestore operation during process termination. The outbox is the recovery mechanism for that case. A conflict can require manual recovery; the UI reports a save error rather than claiming the write succeeded.

## Firestore Rules and security

- Added owner-only authenticated access for `players/{uid}/saves/v012`, schema 13 and format checks, bounded payload, immutable creation time, revision 1 on create, strictly next revision on update, and denied deletion. Anonymous users can access only their own v0.12 save.
- Added a create-only v0.12 feedback collection. A per-UID rate-limit document must be atomically updated with the report; Rules enforce a 60-second interval. Reports cannot be read by clients.
- The emulator tests passed for owner isolation, invalid version/size, revision checks, no deletion, Guest Auth, UID-preserving email link, credential conflict preservation, and private/rate-limited feedback.
- Rules can validate the envelope but cannot parse/semantically validate the JSON payload. A modified client can replay or fabricate its own save while increasing revision. Gold, Fragments, equipment, rewards, run outcomes, and client-submitted scores are therefore **not server-authoritative and not protected against cheating**. PvP remains absent from the v0.12 public entrypoint and no PvP endpoint was added.
- Feedback metadata is bounded and excludes save contents. The client records recent sanitized JavaScript/unhandled-rejection messages and cloud-save failure events. App Check and a trusted server-side reporting endpoint are not configured; anonymous accounts can be recreated to evade per-UID rate limits.

Rules were tested in the local Emulator Suite, not published. Firebase project/database edition and staging configuration could not be confirmed because Firebase CLI project metadata access was unauthenticated. No staging Auth/Firestore calls or OAuth against real accounts were made.

## Performance and costs

Save writes coalesce for 600 ms; each confirmed save uses one Firestore transaction read and one document write, plus one initial server read on login. Sustained gameplay mutations may delay the debounce until a quiet interval, while the local outbox retains the latest snapshot. No listener is held after auth/save lifecycle ends. Feedback uses a transaction reading the per-user lock and report ID, then writes the report and lock atomically. No volume-based dollar estimate is possible without traffic and region data.

Payload limit is 700,000 characters in the local validator and Firestore rule. Confirm the maximum UTF-8 encoded document size with representative real v0.12 snapshots before staging; Firestore's document limit is byte-based.

## Feedback, UI, and private preview

Feedback can be sent from a registered or Guest session and includes UID, category, description, reproduction steps, version, commit, screen, viewport, optional browser string, and a short sanitized recent-error summary. Browser cooldown is retained as a convenience; server Rules enforce the per-UID interval. The report cannot block gameplay. Account/character UI stays in the existing compact dialog, with save status displayed in the online bar. Existing public profiles remain untouched.

The private preview strips `online/v012-account.mjs` as well as feedback/account bootstraps, hides online controls, and continues to use its isolated local validation save. Browser tests observed no Firebase module/CDN request from that mode. PvP remains unavailable.

## Validation results

- `npm test`: **370/370 PASS** on the current final tree.
- `npm run test:browser`: **PASS**, all browser commands completed after the local Firebase bundle and snapshot compatibility fixes.
- `npm run test:rules`: **10/10 PASS**, local Auth + Firestore emulator.
- `node --test tests/v012-cloud-save.test.mjs`: **PASS** after adding the offline outbox restart case; this targeted test was rerun on the current code.
- `node --check` on the new/changed JavaScript modules: **PASS**.
- `git diff --check`: **PASS** on the final source patch.

The browser/test runs generated screenshot artifacts in existing documentation folders. They are test outputs and are not part of the intended integration patch. They could not be restored after the automatic approval review rejected a broad cleanup command as potentially destructive; the original worktree was clean before these test runs. The generated artifacts are excluded from the prepared patch.

## Files changed for the integration

`firebase.json`, `firestore.rules`, `index.html`, `online/firebase-client.mjs`, `online/firebase-sdk-source.mjs`, `online/vendor/firebase-sdk.mjs`, `online/v012-account.mjs`, `online/v012-cloud-save.mjs`, `online/v012-feedback.mjs`, `online/v012-persistence-runtime.js`, `package.json`, `preview/private-server.mjs`, `tests/firestore-rules.test.mjs`, `tests/v012-auth-emulator.test.mjs`, and `tests/v012-cloud-save.test.mjs`.

## Remaining before release validation

1. Obtain authenticated access to the isolated development/staging Firebase project; confirm Firestore edition/database and Google OAuth configuration.
2. Run end-to-end auth/save/feedback tests against that isolated staging project using synthetic accounts and saves.
3. Rerun `npm test`, `npm run test:browser`, `npm run test:rules`, targeted tests, and `git diff --check` on the exact final tree.
4. Validate worst-case UTF-8 save document size and test the cloud recovery UI for a divergent offline outbox.
5. Review production identity continuity separately before any future main/release work. Do not publish Rules or deploy until separately authorized.

**NOT READY** — local implementation and emulator validation pass, but authenticated staging validation, project edition confirmation, final full suite after the last test addition, and recovery UX for diverged saves remain incomplete. Client-authoritative economy also remains unsuitable for competitive/anti-cheat claims.
