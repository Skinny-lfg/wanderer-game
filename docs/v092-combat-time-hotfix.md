# v0.9.2 Combat Time Hotfix — release notes and operational steps

## What's counted

**Fastest D200** measures the sum of simulated combat ticks divided by playback speed. Combat at 1×, 2× and 4× uses 110ms, 55ms and 27.5ms per processed combat tick respectively. Only live waves count, including waves where the player dies or extracts early.

The timer **does not** run in the Tavern, Forge, Merchant, inventory, while selecting/reviewing dungeon offers or while choosing whether to continue between waves. Hidden browser tabs no longer advance combat. An active encounter is checkpointed to the local save about every 3 seconds of simulated combat time to reduce lost time if the window closes unexpectedly.

## Save preservation and eligibility

**No full reset.** The hotfix retains the existing `players/{uid}/saves/v092` cloud save, current progress, Gold/Fragments, runes, gear, equipment, currencies, account, identity, nickname and cosmetics.

- Fresh attempts created with this hotfix store `onlineProgress.timerMetric='combat-v1'`, use `activeMs` for accumulated combat duration, and can submit a completed D200 result.
- Pre-hotfix attempts lack this version marker. They keep all progress and can still play, but **cannot appear in the combat leaderboard** because their already-elapsed browser time cannot be fairly reconstructed.
- To compete, such players must use **Account → Reset Progress · New Speedrun**. This *voluntary personal reset* creates a new eligible attempt. Existing players do not lose progress simply by opening the game after the hotfix.
- Reset within the new metric retains one's personal best on the new leaderboard.

## New competition namespace

New rankings: `testSeasons/v092-launch-1/combatSpeedruns/{uid}`. The old browser-time `testSeasons/v092-launch-1/speedruns/{uid}` is not read by the updated game and is denied in the accompanying rules. Current Progress remains `testSeasons/v092-launch-1/deepest/{uid}` and is unaffected.

## Owner action on Firebase

1. Open the existing Firebase project → Firestore Database → Rules.
2. Replace the existing rules with the full checked-in `firestore.rules` from this hotfix commit, then click **Publish**.
3. Confirm an existing player can read their old save and maintain progress without a forced reset.
4. In a fresh test account, start a new speedrun, clear and extract D200, then verify `combatSpeedruns` receives the record. Confirm the old browser-time `speedruns` is not displayed.
5. Verify that Account Reset starts another eligible run, retains the new personal best and resets only that player's game progression.

**No deployment of production Firestore rules or modification/deletion of any live Firebase records was performed by the GitHub code change.** The new leaderboard requires rules deployment to accept its writes. No Firebase Auth changes are needed.

## Validation

Core regression, browser save/login, interrupted expedition and cloud conflict recovery, deterministic combat stress, browser/mobile and Firestore emulator suite. `tests/combat-timing-hotfix.cjs` exercises 1× and 4× time, idle period exclusion, tab hiding and version safeguards. Records are still client-submitted/unverified and are not anti-cheat proof.
