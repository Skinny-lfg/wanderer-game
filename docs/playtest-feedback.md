# Wanderer Playtest Feedback

Status: implemented on `development`, **NOT DEPLOYED**.

The game now has a **Feedback** button with a short questionnaire for testers to send ideas, bugs, complaints and balance observations. The game UI is English. Signed-in Google and Guest players can submit reports.

## Data flow and privacy

1. Browser -> Firestore `feedbackInbox/{uniqueId}`, with Firebase Auth UID, answer fields, current max dungeon, character ID, app version and timestamp.
2. Firestore rules allow signed-in players with profiles to CREATE bounded reports, but not to read, list, edit or delete submissions.
3. Privileged exporter -> [private owner Sheet](https://docs.google.com/spreadsheets/d/1G6LFiAtkRSKJaNHxZ6LUtZAiwBj4b-aIcxylPNeeqtg/edit). Nicknames are looked up server-side and report IDs are used to deduplicate across executions. The exporter writes values as RAW (not formulas).

**IMPORTANT:** The Google Sheet has been created and its headers formatted, but live submissions and automatic Drive synchronization are NOT yet active. Firestore Rules require a separate deployment. Drive export requires one-time secret/permission setup. No personal information, email or screenshots are requested. Avoid including personal details in feedback.

## Owner setup — Firestore

Deploy the updated `firestore.rules` in Firebase Console or with an administrator-authorized Firebase CLI. Only then can the `Feedback` form submit real reports. Existing Google/Guest login and the cloud save must work.

## Owner setup — optional automatic Google Drive export

1. In your Firebase Google Cloud project create a **dedicated** service account with least-privileged `Cloud Datastore Viewer` IAM role (Firestore read). Do not grant Owner/Editor.
2. Enable the Google Sheets API for the project.
3. Download the service account's JSON credential and add it ONLY in GitHub repository **Actions secret** `WANDERER_FEEDBACK_SERVICE_ACCOUNT_JSON`. Never commit secrets or expose them in the browser.
4. Share the [private feedback Google Sheet](https://docs.google.com/spreadsheets/d/1G6LFiAtkRSKJaNHxZ6LUtZAiwBj4b-aIcxylPNeeqtg/edit) with the service account `client_email` as **Editor**.
5. Set repository secret `WANDERER_FEEDBACK_SHEET_ID` to `1G6LFiAtkRSKJaNHxZ6LUtZAiwBj4b-aIcxylPNeeqtg`. Create repository Actions variable `WANDERER_FEEDBACK_EXPORT_ENABLED` = `true`.
6. `.github/workflows/feedback-export.yml` runs a daily export at 08:10 UTC once that workflow is on the **default branch**. We will NOT merge to `main` without permission. Before a release, `scripts/export-feedback.mjs` can also run manually in an administrative environment with these same environment variables and `firebase-admin` + `googleapis` installed.

The export uses a **read-only Firestore identity** plus specific Editor access to this Sheet. It has no need to expose Drive credentials to players. For initial tests, keep export disabled until Firestore rules and user experience are validated.

## Test coverage

- Mocked browser test submits a bug report and verifies the backend received the values.
- Emulator test validates submission, authentication, input bounds, owner UID, timestamp and read denial.
- Full browser and live Firebase tests have not been run by this change.
