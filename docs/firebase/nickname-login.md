# Nickname + password sign-in (development only)

**Status:** code committed to `development`, **NOT deployed**. Production `main` and
`wanderer-play` are untouched. Existing player accounts, saves and nicknames are not migrated or reset.

## Why a server function is necessary

Firebase Authentication signs in with an email/password or a federated provider, not
directly with a nickname. Wanderer intentionally stores only `nicknames/{nickname}: {uid}`
and a public profile. The registered email must remain private, so the browser must
**never** resolve a public nickname to its owner's email.

The `signInWithNickname` callable runs in `europe-west1`. It validates and lowercases
the nickname, privately looks up its UID and Firebase Auth email through Admin SDK,
asks Firebase Auth to validate the supplied password, checks that the UID matches,
and gives the browser a short-lived **custom sign-in token** for the existing UID.
The response contains **no email**, password, refresh token or other identity details.
Firestore Rules accept that custom sign-in provider **only** when it includes the
restricted `wandererNicknameLogin` claim and `email_verified: true`. Ordinary
Google and email sign-in remain unchanged.

An account created with Google alone has no Wanderer password and cannot use
nickname + password until a password is explicitly linked to that same Firebase
account (no linking UI is included in this change). Password reset always requires
the account's **email**, never the nickname.

## Required setup, strictly in the development Firebase project

1. **Billing:** Firebase Cloud Functions require an eligible project/billing plan
   (typically Blaze). Do not enable billing/deploy as part of a routine merge.
2. In `functions/`, install dependencies and copy the example environment file:
   ```sh
   cd functions
   npm install
   cp .env.example .env.wanderer-development-8e3ee
   ```
   Replace `YOUR_DEVELOPMENT_WEB_API_KEY` with the **public** `apiKey` from
   `online/firebase-config.mjs` on `development`. Do not commit the environment
   file, any service-account key or your Firebase admin credentials. `npm install`
   may generate a lockfile; review and commit it separately for reproducible builds.
3. From repository root, run `npm test` and `npm run test:rules` with the isolated
   Firestore emulator. Do not test nickname login using real player credentials
   from production.
4. Deploy the updated `firestore.rules` **only** to project
   `wanderer-development-8e3ee`, after reviewing emulator results:
   ```sh
   npx firebase-tools deploy --only firestore:rules --project wanderer-development-8e3ee
   ```
   This is a manual operator step, **not performed by this code change**. The new
   rules are required for callable custom-token logins to read/write their own saves.
5. Then deploy the callable **only to the development project**:
   ```sh
   npx firebase-tools deploy --only functions:signInWithNickname --project wanderer-development-8e3ee
   ```
   Check Functions logs if Firebase Admin custom-token signing needs an IAM
   `Service Account Token Creator` permission on its signing service account.
6. Build website Firebase SDK (`npm run build:firebase`), publish the **development
   preview** (not production) and test on desktop/iOS:
   - email/password sign-in unchanged; Google sign-in unchanged
   - an email-verified registered user's nickname + correct password opens the
     **same UID**, profile and save on a second device
   - wrong nickname / wrong password has the same generic error, and never exposes email
   - unknown nickname, unverified email, Google-only user and old Guest identity
     cannot authenticate with a nickname
   - nickname normalization (uppercase/whitespace) and password reset by email
   - refresh, cross-device cloud sync, Firestore permissions and sign-out

## Security and operational constraints

- Never store plaintext emails in `nicknames` or `publicProfiles`; never send
  emails to unauthenticated clients or store the password in logs/Firestore.
- The callable is public so players can use it before authentication. Firebase
  Authentication applies its usual password-abuse protection; `maxInstances: 2`
  bounds concurrency but is **not** a complete anti-abuse/rate-limiting solution.
  Before a public production rollout, enable Firebase App Check (and a suitable
  abuse-control/rate-limit plan), test malformed and abusive requests, and
  monitor function usage/billing.
- This development-only server function rejects any project ID other than
  `wanderer-development-8e3ee`. Do **not** merge it unchanged into `main`.
  Production deployment requires a separate reviewed production function,
  IAM/configuration, security checks, and explicit authorization.
- Firestore account/profile changes are not required. No saves are rewritten.
