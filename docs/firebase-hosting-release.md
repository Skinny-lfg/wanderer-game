# Wanderer v0.11 — Firebase Hosting (manual production release)

- **Production GitHub branch:** `main`.
- **Production Firebase project:** `wanderer-play` → https://wanderer-play.web.app (after first deploy).
- **Development branch:** `development` → localhost, using **only** `wanderer-development-8e3ee`.
- **Old live Firebase:** `wanderer-test-8f062`, preserved for rollback/archival. Do not delete it yet.

## Before first production release

1. Keep the old public site up until the new Hosting site is tested.
2. Bring the *reviewed* v0.11.0 code and artwork to `main` with a dedicated release change. The current `main` is older; do **not** blindly merge diverged branches.
3. Update **only the production** `main/online/firebase-config.mjs` to use Web App `wanderer-play`. Do not change the `development` config. The Hosting builder refuses mismatched Firebase IDs and requires v0.11.0 and the new email action page.
4. In Firebase Console project `wanderer-play`, enable **Authentication → Google and Email/Password**, select a support email and verify **Authorized domains** for `wanderer-play.web.app` and `localhost` only if actually used by that project.
5. Ensure a new **Firestore (default)** database exists, with reviewed access rules. Test Firestore rules locally and **deploy them separately, only to `wanderer-play`**, after explicit release approval. This GitHub workflow **only deploys Hosting**, never Firestore rules.
6. Configure Authentication email templates, app display name Wanderer, verification and reset-password action URL `https://wanderer-play.web.app/auth-action.html` **after** the custom page is hosted and tested. Never embed service account credentials in client source.
7. Decide the reset scope before release: everyone registers again and starts at D1 in `wanderer-play`. Old Firebase data remains untouched in the old project.

## Create an access-limited GitHub secret (no Node.js required on your Mac)

1. Open [Google Cloud Console > Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts?project=wanderer-play) and verify the selected project is **wanderer-play**.
2. Create a **dedicated** deploy-only service account such as `wanderer-github-hosting`, granting **Firebase Hosting Admin** and **API Keys Viewer** roles. Do not grant Owner/Editor, Firestore Admin, or any production database permissions. The Firebase action documentation additionally lists **Firebase Authentication Admin** to add *preview* domains, but this workflow uses the live channel only, so do not grant it without demonstrated need.
3. Create a JSON key for that *dedicated* account and save it securely. **Never paste this JSON into chat or commit it.**
4. In [GitHub repository Actions secrets](https://github.com/Skinny-lfg/wanderer-game/settings/secrets/actions), add repository secret named **`FIREBASE_SERVICE_ACCOUNT_WANDERER_PLAY`** with the entire JSON contents.
5. In GitHub [Environments settings](https://github.com/Skinny-lfg/wanderer-game/settings/environments), optionally create `production` and require reviewers before deploy for an extra safeguard.
6. The manual workflow only appears under **Actions** after its file is merged to GitHub's **default branch** (expected `main`). It will never execute on ordinary pushes.

## Publish on demand

Once **all** release conditions are met:

1. Go to [GitHub Actions](https://github.com/Skinny-lfg/wanderer-game/actions) → **Publish Wanderer to Firebase Hosting (manual)**.
2. Click **Run workflow**, choose **main**, enter **`wanderer-play`** as confirmation.
3. It runs `npm ci`, rebuilds Firebase's browser bundle, executes `npm test`, checks that the *main* release really is v0.11.0 and targets only `wanderer-play`, then creates the allowlisted `hosting-dist/` bundle and deploys the **Hosting** site only.
4. Verify on desktop/mobile: email/Google login, email verification/reset, saves/cloud sync across devices, progress D1→, leaderboard/feedback, Forge/Merchant/dungeons, security of protected data, and favicon/banner.
5. Only **after** successful verification, retire the old GitHub Pages site. Keep old projects intact until any rollback window is over.

## Safety characteristics

- The workflow does not run on pushes, tags or development.
- The deployment builds on GitHub runners; it requires **no npm, Node.js or Firebase CLI installed on the Mac**.
- All nonruntime files (`scripts/`, `tests/`, `docs/`, `package.json`, `firestore.rules`, `.github/`, `node_modules/`) are excluded. Only `index.html`, `auth-action.html`, and runtime assets from `assets/`, `online/`, `combat/` and `economy/` enter `hosting-dist`.
- Firebase credentials are supplied through GitHub Secrets and a purpose-specific Google service account; Firebase Web App `apiKey` is only a public app identifier.
- No Firestore rules deployment, database reset, or account deletion is in this pipeline.
- A failed regression or incomplete v0.11.0 release **blocks** publication.
