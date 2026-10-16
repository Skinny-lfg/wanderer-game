# Wanderer v0.9.2 — Global Fresh Start (release runbook)

**Decision:** all gameplay progress and all public scores start again at zero in v0.9.2. Keep Firebase Authentication accounts (including anonymous Guest identities), `nicknames`, `publicProfiles` and cosmetic characters to avoid locking players out of their names.

## Fresh namespaces

- Private account saves: `players/{uid}/saves/v092` (**not** the old `saves/current`).
- Speedrun and progression rankings: `testSeasons/v092-launch-1/speedruns/{uid}` and `testSeasons/v092-launch-1/deepest/{uid}`.
- Public gear loadouts: `publicLoadoutsV092/{uid}`.
- Account browser storage: `wanderer_account_{uid}_v092`; old Guest / account local save keys are not migrated.
- Old `test-open-1` boards and former public loadouts are denied by the new `firestore.rules`.

The live build cannot read the former progress and cannot reuse an old fastest-D200 time. These are new, empty namespaces. The old documents remain stored in Firestore until the owner deliberately performs an Admin-SDK/Console data purge. This release does **not** perform a destructive Firebase operation.

## Owner's required Firebase operations (before release to players)

1. In Firebase Console, choose the **existing** Wanderer project from `online/firebase-config.mjs` (do not create a different project).
2. Firestore Database → **Rules**: replace the rules with the repository's v0.9.2 `firestore.rules` (main/development commit), and click **Publish**. Confirm the publication succeeded.
3. Ensure Google and Anonymous sign-in remain enabled in Authentication, and validate one existing Google account and one Guest in a non-production test context.
4. Open the new live v0.9.2 game and verify: same nickname, fresh D1, empty rune/inventory, Gold=0 and Fragments=0; Fastest D200 has no old records; fresh scores and equipment publish without permission errors.
5. Verify browser reload, cross-device save, new Guest login and reset-new-speedrun (within the new season). Run Firestore Emulator security tests when available.
6. Only after the new build is healthy, consider purging historical `testSeasons/test-open-1`, old `publicLoadouts` and `players/{uid}/saves/current` with an authenticated administrative maintenance tool, after taking a backup. Never delete `players` as a parent collection after v0.9.2 is live, since it contains new saves. Do not delete `publicProfiles`, `nicknames` or Firebase Auth unless the owner expressly wants identity deletion.

## Why namespaces instead of deleting players at merge time

The GitHub repository cannot delete documents in the live Firebase project. A backend-side deletion alone would also allow cached browser saves to be uploaded again. Versioned save keys/paths plus restrictive Security Rules give a reliable gameplay reset even for players who retain old localStorage.

## Operational caution

Publishing `main` before the Firebase rules are updated may result in temporary permission-denied errors when accounts attempt to create new-season saves or leaderboard entries. After updating the rules, ask players to reload. The new leaderboard still contains unverified client-reported elapsed active-play-time claims, not trusted server timestamps for anti-cheat.
