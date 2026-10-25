# Wanderer v0.12 — Firebase Development Hosting deploy trigger

Manual, isolated test deployment requested on 2026-10-22.
- Source: `development` branch (includes UI.4e and UI.5).
- Target: `wanderer-development-8e3ee` Firebase Hosting only.
- Never deploy Firestore rules or change production `wanderer-play`.
- GitHub Actions requires `FIREBASE_SERVICE_ACCOUNT_WANDERER_DEVELOPMENT` for this exact project.
