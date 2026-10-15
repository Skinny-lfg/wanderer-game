> **Guest update (2026-10-15):** The development build offers Firebase Anonymous Authentication plus nicknames on the test leaderboard. Enable **Authentication → Sign-in method → Anonymous** in Firebase Console before a real test. Existing Firestore Rules use the authenticated UID and support anonymous accounts, but still require review/deployment. Signing out or clearing browser data may lose guest-account access; Google linking is not implemented. No Firebase console changes or deployment were made by this code change.

> Current account flow: Google sign-in is required. Account saves restore and sync automatically; only conflicting saves request a choice. Recovery copies remain internal. Leaderboard submissions are automatic and still stored as `verified:false` in the test namespace, although the private-test UI no longer displays warnings. The earlier Guest/manual-review/export instructions below describe the previous interface and no longer apply. Server verification is still pending; this update does not make the rankings competitively trustworthy.

# Firebase online test environment

Status: **implemented locally on development; not deployed**. No Firebase rules, billing setting, Google provider setting, GitHub Pages configuration, or main branch was changed.

## Project and prerequisites

Public config: `online/firebase-config.mjs`, project `wanderer-test-8f062`, app Wanderer Web. This object is public, not an Admin SDK credential. No Analytics, Cloud Storage, Functions or Hosting SDK is initialized.

The supplied GDD reports Google Auth and Firestore already enabled on Spark. These settings could not be independently checked from this environment. Before an authorized live test:

1. Confirm Authentication → Sign-in method → Google is enabled and the support email is configured.
2. Confirm the actual test hostname is under Authentication → Settings → Authorized domains. GitHub Pages uses `skinny-lfg.github.io`. For local testing add `localhost` or `127.0.0.1` as appropriate; new Firebase projects may not authorize localhost by default.
3. Test the proposed `firestore.rules` with the emulator. After approval, deploy **only the reviewed rules**, explicitly targeting `wanderer-test-8f062`. Existing GDD rules for `/players/{uid}` are insufficient for the new profile/nickname/save paths. Do not temporarily open the database to make a test work.
4. Review browser tests and deployment separately. Publishing the app or rules is not performed by `npm run build:firebase` or any test script.

An operator with project permission can deploy reviewed rules later using:

```sh
npx firebase deploy --only firestore:rules --project wanderer-test-8f062
```

Do not commit Firebase CLI login files, service account keys or other private credentials.

## Build and local validation

Node 22 LTS is recommended for the Firebase CLI dependency tree; the application/unit/browser checks here also passed on Node 24.19.0. Java 21 is available for the Firestore emulator.

```sh
npm ci
npm run build:firebase
npm test
python3 -m http.server 8010 --bind 127.0.0.1
# In another terminal:
npm run test:browser
npm run test:rules
```

Browser tests use Chromium at `/usr/bin/chromium`; set `CHROMIUM_PATH` if different. `WANDERER_TEST_URL` can override the local URL. Firebase interactions are mocked in browser tests via Playwright routes; no test hook exists in the production application. Rules tests use **demo-wanderer**, never the live project.

The minified Firebase bundle is generated from pinned npm dependencies; no external CDN is required to load Guest mode. `package-lock.json` pins dependency integrity. Regenerate the bundle when upgrading Firebase. The game remains a static application; a runtime Node server is not required.

## Data model and access

- `publicProfiles/{uid}`: immutable normalized nickname, cosmetic character, server-created/updated timestamps. Public `get`, no email, no Google profile data, no direct collection listing. Only owner may change character.
- `nicknames/{normalized}`: immutable UID reservation, atomically paired with profile creation through `getAfter` rules. Three to twenty lowercase ASCII letters/digits/underscores. Case variants cannot claim a second spelling.
- `players/{uid}/saves/current`: private JSON snapshot, schemaVersion, revision, server timestamp. Owner only, requires profile. Creates start at revision 1; updates increment exactly once. This does not overwrite an existing root `players/{uid}` document.
- `testSeasons/test-open-1/deepest/{uid}` and `testSeasons/test-open-1/milestones/{milestone}/entries/{uid}`: public **unverified** claims. Owner-only bounded writes; server receipt timestamps; milestone receipts immutable. The client cannot set `verified:true` or write another user's row.
- `verifiedSeasons/**`: denied to all browser clients. Not used by the UI or this release.

Rules protect account boundaries and basic shape. They do **not** make client-owned saves or test progression cheat-proof. A player can manipulate their own browser; every displayed result is labeled unverified.

## Sync and recovery policy

Sign-in never replaces a save automatically. On each authentication restoration the player reviews local/cloud snapshots before enabling sync. The account's local slot takes priority over Guest when preparing the comparison; Guest remains untouched in its original key. A missing or empty cloud save never wins automatically. No item/currency merge occurs.

Uploads compare the expected cloud revision inside a Firestore transaction. If another device has written, sync pauses and requires a new choice. Before replacing either version, the browser retains recovery backups, exportable under Account. Explicit cloud downloads recheck the selected revision. Network errors preserve local play; there is no blind offline write queue.

Sync waits during active expeditions and resumes after extraction/death. A crash mid-expedition retains the game's previous local recovery behavior; this phase does not promise cross-device resume of a live fight. Autosync is throttled to one write attempt per 30 seconds; manual Sync now is available. Check the status before moving devices. Backups are local, so export before clearing browser storage. Concurrent local-tab writes are detected by comparing stored content; stale tabs are blocked and a recovery snapshot is retained.

## Live acceptance checklist — pending

- Real Google sign-in, cancellation, popup blocking, expired auth and unauthorized-domain handling.
- Two Google accounts cannot read/write each other's private saves, or claim the same nickname.
- Two real devices editing the same account trigger a revision conflict with no silent overwrite.
- Existing non-empty Guest → new account preserves currencies, Stash upgrades, equipment, affinities, Two-Handed/Off-Hand, settings and progress.
- Empty cloud never silently replaces a non-empty local save; explicit import/export/recovery works.
- Character changes persist in profile and render in Tavern, Equipment and Combat.
- Run all rules tests before deploying rules. Verify production rules deployment matches the reviewed file.

## Costs and billing boundaries

- Google Sign-In and Cloud Firestore can support this test feature set on **Spark within the applicable quotas**. Quota exhaustion still causes errors; there is no guarantee of unlimited free usage.
- Auto-sync, profile reads and top-50 leaderboard reads consume Firestore quotas. No real-time listeners or polling leaderboard are used; each opening/metric switch performs a bounded query plus public profile reads.
- Deploying **Cloud Functions for Firebase requires Blaze**. Cloud Run also requires a billing-enabled Google Cloud project. Neither is created, enabled or deployed here.
- The current test scoreboard does not require Functions. Trusted competition needs an authoritative backend described in `server-validation.md`; do not substitute browser validation for it.
- Character images are served as static repository assets. Cloud Storage is not used; review its current billing requirements before adopting it.
- Budgets/alerts are not hard spending caps. Before enabling a paid backend, approve its region, quotas, concurrency, max instances and zero minimum instances; measure execution/read/write costs first.

Official references (network access to these pages was blocked during implementation):
- https://firebase.google.com/pricing
- https://firebase.google.com/docs/functions/get-started
- https://firebase.google.com/docs/auth/web/google-signin
- https://firebase.google.com/docs/rules/unit-tests
