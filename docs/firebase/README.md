# Wanderer — Firebase deployment and login (v0.11.0)

**Development branch only.** Nothing described here automatically deploys rules, resets data, or modifies the `main` branch. Production currently uses Firebase project `wanderer-test-8f062`. The **development** branch is configured with its own Firebase Web App under project `wanderer-development-8e3ee` and refuses to connect to the production project. Creating/configuring Authentication and Firestore in the new Firebase Console is still required.

## Two independent projects

| Environment | App branch | Firebase Auth | Firestore saves / rankings |
| --- | --- | --- | --- |
| Production | `main` | Existing production project | Existing players, unchanged until launch |
| Development | `development` | **New** Firebase project that you create | Independent development players and test saves |

You can use the same Google account or email address in both projects. These are **separate Firebase Authentication users**, normally with different UIDs. Signing in on development does not grant access to your production account's profile, rankings or saves. Account email is not used as a cross-project database key.

For local tests, each browser account slot is namespaced by `projectId` and `uid`, so an accidental UID collision also cannot select a production browser save. Legacy anonymous/browser saves are never automatically imported.

### Required Firebase Console setup (development only)

1. **DONE:** Independent Firebase project **`wanderer-development-8e3ee`** created by the owner. Ensure you have selected **this** project in the Console.
2. **DONE:** Its Web App settings have been copied into **`online/firebase-config.mjs` on `development` only**; production's config remains on `main`. The optional `measurementId` is intentionally omitted because Analytics is not initialized. This Web config is not a private key. **Never commit service-account secrets, private keys or admin credentials**.
3. Authentication → **Sign-in method**: enable **Google** (choose a support email) and **Email/Password**. Do **not** enable Anonymous; the v0.10.1 app has removed Guest sign-in.
4. Authentication → **Settings → Authorized domains**: authorize the actual preview domain and `localhost` or `127.0.0.1` for local testing, when the Console allows it. Firebase does not automatically authorize localhost on all new projects. For GitHub Pages, use the relevant `*.github.io` hostname; do not confuse a path with a hostname.
5. Authentication → **Templates / Email action links**: customize and test **Verify email** and **Reset password** emails. Set the appropriate action URL/authorized domain; do not send players from the dev email into the production site. Configure an email sender/branding if available.
6. Firestore Database → create a new database in this **development** project. Use production-like restrictions; do not temporarily grant `allow read, write: if true`.
7. Run **rules emulator tests**, review `firestore.rules` and deploy rules **only to the NEW development project**, with its explicit project ID. Example: `npx firebase deploy --only firestore:rules --project YOUR_NEW_DEV_PROJECT_ID`. **Never deploy rules to the production project from this branch.**
8. Test sign-up, verify-email gate, password recovery, Google sign-in, profile creation with a **chosen public nickname**, save sync, logging out/in, cross-device sync and isolation from the existing production project.

### SDK build

The game keeps the pinned Firebase 11.10.0 build under `online/vendor/firebase-sdk.mjs` (the Firebase Console's SDK 13.0.0 setup snippet is not needed by Wanderer). The source entry now includes Email/Password, verification and password-reset methods. Until you regenerate the bundle with `npm ci && npm run build:firebase` and commit the new vendor asset, the development adapter loads **the matching official Firebase CDN ES modules** as an explicit fallback. The CDN fallback is online-only and must be tested on the deployed development hostname. Rebuilding the local pinned bundle is recommended for final release and to avoid an extra external asset dependency.

### Rules and verification

Development rules reject anonymous identities for player writes and require verified email for Email/Password accounts. Google accounts use their normal Firebase provider identity. Client-side verification alone is not sufficient; deploy the reviewed development rules before real testing. Public nickname entries do not contain an email or Google display name.

### Privacy and profile identity

- **Players choose a unique public nickname** (3–20 lowercase ASCII letters/numbers/underscores), independently of their Google account name. Their name or email is not copied into public profile documents, leaderboard text or public equipment.
- Internal Firebase user IDs remain identifiers in Firestore record paths and may be visible to technically skilled viewers or network inspectors. This is **not** perfect identity anonymity; do not store personal data in publicly readable documents.
- Nicknames are **not editable** under the current Firestore Rules because ownership/uniqueness would require an atomic rename flow. Do not promise nickname changing until it has been designed and tested.
- Email/passwords are managed by Firebase Authentication and are not saved in game documents. Password-reset emails are only for email-password accounts; Google sign-in is managed by the Google account provider.
- Firestore saves are writable by their owner and are protected by revision checks and size limits, but **player-owned save files and leaderboard results are not server-verified or cheat-proof**. A secure public competition would need a trusted backend.

## Production launch / reset is intentionally deferred

**DO NOT RESET ANYTHING NOW.** Before v0.10.1 goes to `main`, decide with the owner exactly what resets: all existing season progress, leaderboard, profiles, account identities, or only player saves. The safest approach often resets the season/save namespace while **preserving recoverable account identities**, but the owner must approve this explicitly.

Before launch: export backups of production Firestore and required authentication records; verify the preview with independent test users; confirm account migration/registration policy, Google/Auth providers, authorized domains, new rules and a recovery/rollback plan; announce any progress reset to existing players; then perform the approved reset in a controlled release. Simply merging the branch or changing the Web App config does **not** reset the production database.

## Local checks

```sh
npm ci
npm run build:firebase
npm test
python3 -m http.server 8000 --bind 127.0.0.1
# In a second terminal, with Chromium installed:
npm run test:browser
npm run test:rules
```

For rules tests, the scripts use an emulator demo project and do not write to production. Test that the dev app fails closed when its Web App config is missing or still points to the production Firebase project.


### Development setup status (v0.11.0)

- Firebase Web config: **completed** for `wanderer-development-8e3ee`.
- Authentication provider activation (Google + Email/Password): **not verified / Console action required**.
- Firestore database creation and dev-only rules deployment: **not verified / Console action required**.
- Local SDK bundle rebuild, browser verification and emulator tests: **pending**.
- Production release/reset: **not performed**.

## Branded Firebase emails and branded verification/password page (v0.11.0)

**Email sender name / “thanks your project 998484”:** this is set **in Firebase Console**, not in the website source.
With `wanderer-development-8e3ee` selected, open **Authentication → Settings** and set the public-facing app name to **Wanderer** (where shown). Next go to **Authentication → Templates**: edit both **Email address verification** and **Password reset**. Set the subject to e.g. **Verify your Wanderer account** / **Reset your Wanderer password**, replace the default template with clear copy, and keep the built-in **%LINK%** placeholder so buttons actually work. Do not paste a raw verification token into any visible website.

Suggested verification email:
- Subject: **Verify your Wanderer account**
- Message: **Welcome to Wanderer! Confirm your email using the link below to unlock your account and start your journey. If you did not register, you can safely ignore this message.**
- Link label: **Verify my email** (using Firebase's original `%LINK%` link).

Suggested password email:
- Subject: **Reset your Wanderer password**
- Message: **We received a request to reset your Wanderer password. Use the link below to choose a new one. If you did not request this change, you can ignore this email.**
- Link label: **Reset password** (using the Firebase-generated `%LINK%` link).

The **custom branded action page is implemented but NOT YET LIVE** in `auth-action.html` and `online/auth-action.mjs`. It handles Firebase `verifyEmail`, `resetPassword` and `recoverEmail` actions with official Firebase 11.10.0 ES modules. It uses the **development** Firebase config, checks the action belongs to the correct Firebase project and never displays or logs reset tokens. The verification action is completed with `applyActionCode` and the password reset with `verifyPasswordResetCode`/`confirmPasswordReset`. A password is never saved by Wanderer.

**To activate it without risking production:**
1. Publish the dev webpage and `online/` files on a separate HTTPS **development preview hostname** that serves `https://<your-dev-host>/auth-action.html`. A URL on `localhost` cannot be opened from another device's email app; a GitHub Pages site attached to `main` would not serve the development files automatically.
2. In the **development** Firebase project only, go to **Authentication → Settings → Authorized domains** and authorize the exact preview hostname (without the path).
3. Go to **Authentication → Templates**, edit an email template and use **Customize action URL** to set `https://<your-dev-host>/auth-action.html`. Firebase will append secure `mode` and `oobCode` parameters. This customization may apply to all templates in that dev project.
4. Send fresh email verification and password-reset messages and test real links, including expired/used code errors and the Return to Wanderer link. Old emails that were already sent still use their original handler URL.

**Do not configure this custom action URL in the production Firebase until its own production-hosted page and rules have been separately reviewed.** The normal Firebase action pages remain functional until a custom URL is configured.

For a branded sender-domain/email address such as `noreply@yourdomain`, Firebase may require verified ownership of a custom domain and DNS records; changing the app's public-facing name does not by itself change the sender's domain. See [Firebase custom email action handler](https://firebase.google.com/docs/auth/custom-email-handler) and [Firebase email template settings](https://support.google.com/firebase/answer/7000714).

## Nickname sign-in (development-only implementation)

Nickname + password sign-in is implemented in `development`, but it requires a
server-side Firebase callable and an explicitly reviewed rules deployment. It is
**not active** until deployed and verified. It never reveals email addresses in
public nickname lookups. See [setup, security and rollout steps](nickname-login.md).
