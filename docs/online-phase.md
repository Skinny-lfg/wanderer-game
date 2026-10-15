# Online test phase — implementation log

Source of truth: supplied GDD, archived verbatim in `design/gdd-source-2026-10-15.txt`, sections 12.6–12.7 and the latest user instructions. This document is the implementation addendum; the Google Drive document has not been edited.

## Stage 1 — characters and save foundation
- Integrated the supplied five full-body images and five portraits without regenerating art; names/IDs follow the supplied manifest. All characters are cosmetic.
- Preserved Two-Handed, Off-Hand Dagger, Block, bosses, equipment and economy.
- Removed the automatic reset-on-version-mismatch behavior. Valid legacy saves migrate without resetting progress. Corrupt saves are retained rather than overwritten; the Account UI will offer raw export.
- Added separate guest/account slots, backups before switching/replacing, and stale-tab write protection. Legacy progress has no invented historical completion times.
- Tests: `node tests/phase2-smoke.cjs`, `node tests/online-save-compat.cjs`, `node --test tests/online-model.test.mjs`.
- Previous uncommitted UI work is preserved in Git stash `Preserve earlier local UI changes before online phase audit`, plus `/tmp/wanderer-pre-online-backup/`; latest remote development already supersedes this old base. No main changes.

## Stage 2 — Google profiles and explicit Cloud Save
- Public Firebase configuration targets `wanderer-test-8f062` / Wanderer Web. Google popup authentication; Guest play does not create a Firebase anonymous user.
- Five cosmetic characters are shown during profile creation and can be changed later. Profile nicknames are normalized to lowercase, 3–20 ASCII letters/numbers/underscores; immutable for now. A Firestore transaction atomically reserves a nickname and creates the profile. No email/photoURL is published.
- Saves live privately under `players/{uid}/saves/current`, separate from the public profile. Signing in/restoring authentication never downloads a save over the current game or uploads guest data automatically. The player sees both summaries and explicitly chooses a source.
- Guest and account saves have independent local keys. Backups are stored locally before switching/replacing and can be exported. Manual imports validate shape and preserve a recovery copy. Existing reset-version differences no longer trigger deletion. Invalid original data is preserved and exportable.
- Cloud writes use transactions and optimistic revisions; a changed remote revision pauses sync instead of merging inventory/currencies or silently replacing either version. Network/permission errors keep local data and pause sync for review. Uploads do not queue blind overwrites offline.
- Cloud auto-sync is throttled to at most once per 30 seconds while changes exist, with a manual Sync now button. Active expeditions stay local and cloud upload waits until extraction/death. Switching accounts/saves is blocked during a run. Leaving the page before sync completes can leave changes local: check the status or use Sync now before changing devices.
- Foreground play time is collected in 5-second increments while the tab is visible/focused. It is an untrusted test metric, not proof of activity. Existing saves receive no invented completion timestamps and are ineligible for historical fastest-progression times.

### Verification so far
- Existing weapon/combat smoke tests: passed.
- Legacy save migration, corrupt data preservation, Guest/account isolation and stale-tab protection: passed.
- Pure-model validation/conflict tests: passed.
- Browser tests at 1440×950, 390×950, 320×950: passed with a mocked Firebase boundary. Covered all five characters, nickname collision errors, explicit first upload, conflicting cloud revision, explicit download, offline handling, sign-out, preserved Two-Handed gear, character art in Tavern/Equipment/Combat, early extraction, and test ranking screens.
- These browser tests do **not** claim successful real Google OAuth, live Firestore integration, or Security Rules validation. Production Firebase API requests and official emulator downloads are blocked by this environment's network policy (403 Domain forbidden).
