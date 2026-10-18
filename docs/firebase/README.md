# Wanderer — Firebase v0.11.0

## Production — new reset, new accounts

Production uses Firebase project `wanderer-play` for Authentication and an empty Firestore `(default)`. Hosting is https://wanderer-play.web.app once deployed. All newly registered players start from D1; old accounts, saves and leaderboards in `wanderer-test-8f062` are deliberately **not migrated**. **Never erase** old records to release the new project.

Production client config: `online/firebase-config.mjs`. Firebase Web App config is public; never check a service-account JSON key into the repository.

The `main` Hosting release is deliberately a **manual GitHub Actions** workflow: Actions → Publish Wanderer to Firebase Hosting (manual) → Run workflow → type `wanderer-play`. The Google service-account JSON resides in GitHub secret `FIREBASE_SERVICE_ACCOUNT_WANDERER_PLAY` (configured by owner). Hosting publishes the built `hosting-dist/` allowlist, not the entire repository.

**Hosting deployment does NOT deploy Firestore Rules.** In the `wanderer-play` project, the owner must review and publish the root `firestore.rules` in Firebase Console / an explicitly approved rules-only deployment. Do not open the database with temporary public rules. Verify Google and Email/Password sign-in in Firebase Auth settings, authorize `wanderer-play.web.app`, and test password reset + email verification.

Custom email action page: `/auth-action.html`, with Firebase Auth → Templates → Customize action URL set to `https://wanderer-play.web.app/auth-action.html` **only after** the Hosting site is available. Configure sender name/subjects to Wanderer.

## Development — local only

The `development` branch remains configured exclusively to `wanderer-development-8e3ee` and can run in localhost. Use `development` for new changes and test saves; do not point development to `wanderer-play`.

## Release checks

- `npm test`, `npm run test:rules`, relevant browser/mobile and save sync tests; no real player writes during automated validation.
- After Hosting deploy, sign up a new user and verify sign-in/out/reload/sync, forged Save write denial, Guild/Leaderboards, Forge and Sigils, Dungeon progression, browser icons and branded email action links.
- Disable the old GitHub Pages site only after the new site is confirmed functional.
