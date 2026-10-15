# Trusted competition — proposed server validation, not activated

## Current release: explicitly experimental

All three boards display an always-visible unverified label. They show at most 50 records:
- **Deepest Dungeon**: highest client-reported level completed **and extracted**, not merely unlocked. A legacy import infers at most `maxDungeon - 1` and cannot infer a D100 victory from D100 unlock.
- **First to Clear**: first **server receipt** of a milestone claim. This is not verified completion time. Imported history is not backdated.
- **Fastest Progression**: client-reported foreground play milliseconds to first successful extraction at the milestone. Only saves with timing instrumentation from creation are eligible; legacy saves lack this history. Time is collected every five seconds while visible/focused; idle focus and client manipulation are possible. The UI states this limitation.

The test namespace is `test-open-1`. Milestones are D10, D20, … D100. This is a storage namespace, not an automatic season/reset system. No seasonal reset exists.

## A secure backend needs authoritative progression, not a score endpoint

A callable function that accepts `uid, dungeon, score` and copies it to a ranking would still be insecure. App Check, client signatures, a timestamp or an ID token alone do not prove a victory. Authentication proves identity only.

Before enabling verified boards:
1. Authenticate every request with Firebase ID tokens; optionally add App Check as abuse reduction, with per-UID/IP rate limits. Derive UID from the token, never from a request body.
2. Maintain a **separate server-owned progression and inventory ledger**. Existing Guest/local/cloud imports can remain casual/test saves but must not be promoted to verified saves without an independently validated history. Otherwise an attacker can import arbitrarily strong equipment and honestly replay an easy victory.
3. `startRun({dungeon,path,loadoutIds,requestId})`: transactionally validate unlocked level, item ownership, no simultaneous active run, Two-Handed exclusivity, and inventory/currency rules against the ledger. Issue a unique expiring run ID, nonce, rules version, seed commitment and server start time. Store the snapshot on the server. Never scale enemy strength to submitted Gear Power.
4. Advance encounters on the authoritative engine, or re-simulate deterministic versioned combat with server-controlled seeds and validated choices. A browser event log is evidence to check, not truth. Validate travel/encounter ordering, allowed choices, mana, cooldowns, loot and elapsed-time bounds. The rules engine must be shared/tested with the game; avoid a duplicate ad-hoc approximation.
5. `finishRun({runId,decision,requestId})`: accept only extraction/death for a server-owned active run. Recompute outcome, apply inventory/currency deltas atomically, then mark the run consumed. Idempotency keys and run status prevent replay/double rewards. Do not accept a user-supplied winner, gear snapshot, score or duration.
6. Only server transactions write `verifiedSeasons/{season}/...`. Deepest is updated from confirmed extractions; first-clear uses the authoritative completion timestamp. Fastest needs an approved definition of active/wall-clock time and disconnect handling; use server milestones and monotonic run clocks. Do not use the browser's `activeMs` as verified time.
7. Version definitions for seasons, combat rules and eligibility. Do not reset or migrate existing seasons automatically. Provide an audit trail and an appeal/replay workflow before public competition.

## Backend readiness and cost gate

No Functions/Cloud Run resources, Admin credentials or verified score APIs are included/deployed. This remains a design gate. An implementation requires approval of a billing-enabled project (Blaze for Cloud Functions), plus budgets, limits, profiling and a separate server-engine validation phase.

Required backend tests: forged equipment/currency, fake victories, replayed requests, concurrent finishes, clock manipulation, expired tickets, cross-user runs, unauthenticated access, rule-version changes, loadout changes mid-run, disconnect/retry behavior, and deterministic replay of all supported weapons/bosses. No verified label should be enabled until these and live security tests pass.
