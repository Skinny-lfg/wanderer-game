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

## Stage 3 — experimental rankings and security boundary
- Added three explicitly **UNVERIFIED** test boards: completed/extracted dungeon depth; first server receipt of each milestone; foreground time to milestone (legacy imports excluded from historical timing).
- Results are shared only by an explicit player action after choosing/syncing an account save. The test namespace never accepts `verified:true`. Production UI has no verified-results endpoint.
- Proposed owner-only private save Rules, immutable nickname reservation, server timestamps, monotonic revision updates and bounded public test claims are in `firestore.rules`. No live rules were deployed.
- Future server-authoritative inventory/run validation and cost gates are documented in `firebase/server-validation.md`. This is a strategy, not a claim that secure competitive validation is implemented.
- Setup, quota/billing boundaries and pending real-service acceptance tests: `firebase/README.md`.

### Final local test report
- Game smoke suite: passed (Two-Handed, Off-Hand Dagger, Mace/Shield Block, DoT, boss styles, theme count, save compatibility).
- Save compatibility/recovery suite: passed (old version preserved; invalid original retained; Guest/account slots; stale-tab write rejected).
- Model suite: 4 tests passed.
- Chromium browser matrix: 1440×950, 390×950, 320×950 passed with mocked Firebase boundary. Includes imports only after confirmation, protected-save recovery, backups, conflict/offline preservation, five characters, combat, profile errors, three board views. No JavaScript errors or document horizontal overflow.
- Real bundled Firebase SDK Guest startup: passed; five supplied character images decode. This check performs no login or cloud write.
- Firestore emulator Security Rules suite: **not executed**. The CLI could not download the official emulator JAR from `storage.googleapis.com` (403 Domain forbidden). Tests are committed for an environment with access; no substitute passing check is claimed.
- Live Google OAuth / Firestore reads/writes / two real devices: **not executed**. `identitytoolkit.googleapis.com` and `firestore.googleapis.com` are blocked by this environment. Provider/domain settings require confirmation and reviewed Rules must be deployed before live tests.
- No paid service, Firebase deployment, GitHub push, main change, or Pages publication performed in this phase.


## Account UI simplification — follow-up

This update supersedes the earlier Guest/manual-sync UI described above.

- Google sign-in and a profile are now required to access gameplay. Signing out returns to the login screen; the legacy local slot remains available only for safe migration.
- Account shows nickname, five cosmetic characters and sign-out. Removed routine sync information, manual sync/review actions, backup/import controls and Guest controls. Internal recovery snapshots and stale-tab protection remain.
- Login automatically restores a known clean account save or uploads local progress when the cloud has not changed. Missing cloud data never replaces local progress. Divergent copies, unknown migration histories or regressed cloud dungeon progress still require a one-off choice.
- New accounts on a shared device start fresh after the legacy slot has been claimed; another account's progress is never copied into them.
- Saves automatically sync after expeditions, throttled to 30 seconds. Transient network errors retain local data and retry. Sign-out waits for pending progress to be saved; errors remain visible only when action is needed.
- Rankings automatically submit changed progress after successful sync. Removed the sharing button, warning banner and per-row Unverified labels as requested for private testing. Storage still uses testSeasons and verified:false; server-authoritative competitive verification is still not implemented. No Rules or security boundary changed.
- The existing smoke test assumed every dagger used an external filename. It now also accepts the existing embedded dagger art, eliminating the random false failure without changing artwork.

Validation: game smoke, save compatibility and four model tests pass. Mocked Firebase browser flows cover required login, profile errors, all cosmetics, legacy migration, automatic sync/results, duplicate-score suppression, concurrent-save conflicts, offline retry, sign-out/return and desktop/mobile layout. Live Google/Firestore acceptance and emulator Rules tests remain separate pending checks; no deployment performed.


## Profile restoration fix

Profile loading now distinguishes loading, failed, confirmed missing and existing profiles. A read error never opens nickname registration; Retry reloads the existing profile. Cached missing documents are not treated as proof that a profile is absent. Repeated profile creation restores the account's original nickname and character without writes; an orphan nickname reservation can only be reused by its owning UID, never another Google account. No rules or saves are reset.

The account screen still has no Local backup section. Versioned module URLs refresh the account code when the new HTML is served; they do not publish development to main/Pages.

Validation: production adapter tested with an in-memory SDK boundary for existing profiles, duplicate requests, cached absence, same-owner nickname recovery and other-owner rejection. Browser coverage includes a full page reload with persisted mock authentication/profile/cloud data, and permission-denied profile reads followed by Retry. Real Firebase service diagnosis remains unverified in this environment.


## Equipment / combat VFX pack and account nickname

Integrated the user-provided `Wanderer_Equipment_and_Combat_VFX_2026_10_15_v2.zip`: 15 equipment PNGs and 8 static transparent combat effect PNGs. Original PNG pixels are preserved. Armor, helmets, gloves, boots and both ring slots use three stable variants; rarity affects the frame, independently of artwork. Existing weapon and amulet artwork is preserved. No item data or saves are rewritten.

Single-frame VFX are animated with CSS for sword, mace, both dagger paths, Two-Handed, bow, staff, wand and Block. Effects are absolute overlays, capped at eight, cleaned up after animation and respect reduced motion. Combat calculations and timing are unchanged. The account button displays the authenticated profile nickname and resets to Account & Character on sign-out.

Tests: existing combat/save/model/profile suites; browser checks at 1440px and 390px for slot artwork, all rarity frames, image decoding, all effect entrypoints in the combat scene, reduced motion, nickname and layout stability. No real Firebase integration or deployment is implied by mocked browser tests.

## Player profiles and first practice PvP

See [the PvP GDD addendum](pvp-stage.md). This adds exact nickname lookup, public equipment inspection and practice duels. The owner selected theft rewards but confirmed Spark; actual Gold transfers are deliberately not enabled without a trusted backend/economy. New public-loadout Firestore Rules are prepared, not deployed. No main changes or billing activation.

## Guest nicknames and compact public profile icons — 2026-10-15

- Account now offers **Sign in with Google** and **Play as Guest**. Guest uses Firebase Anonymous Authentication, receives an anonymous UID while browser auth persistence is retained, and reserves a unique 3–20 character nickname using the same atomic profile transaction. Anonymous users share private cloud saves, test leaderboards, player lookup and practice PvP with Google users; no fake local-only public rankings.
- Guest sign-out warns that account access (nickname/cloud save) may be lost; guest-to-Google linking/recovery is not implemented. The existing Google account and legacy-save safeguards remain.
- Firebase Console **Authentication → Sign-in method → Anonymous** must be enabled by the project administrator. No auth provider setting, live security rule or production Pages setting is deployed here.
- Player profile avatars: 42px desktop / 36px mobile. Public equipment icons: 28px desktop / 24px mobile; inventory artwork unaffected. Page cache version updated.
- Browser test double exercises anonymous nickname signup, leaderboard visibility, sign-out warning and icon sizing. Real Firebase Auth / Firestore integration remains pending. `online/firebase-sdk-source.mjs` exports the official `signInAnonymously` for future `npm run build:firebase`; the checked-in vendor currently exposes its SDK-internal equivalent.

- **Guest browser restart regression (2026-10-15):** signed-in anonymous player reload restores the same account, nickname, dungeon progress and Gold. Saved in-flight dungeon is closed safely by existing startup migration. Duplicate auth events for the already restored UID do not reopen the Account modal or disable controls. Module URL cache-buster advanced. This is a test/robustness change only, not a live hosting deployment; deployed old builds may still show previous errors.
