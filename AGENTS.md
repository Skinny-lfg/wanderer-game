# Wanderer Dev Agent — project guidance

## Start every task with a current project snapshot

The trusted `UserPromptSubmit` hook runs a read-only preflight and adds the current branch, version evidence, entrypoint, loaded modules, standalone experiments, relevant documentation and local tool readiness to task context. Review that snapshot before planning or editing. When the version signals disagree, report the conflict and establish the active product state from the current branch's code and authoritative documentation; do not infer the version from an old filename or cached instruction.

Version numbers in titles, filenames and module names are historical/project identifiers, not permanent rules. Reassess the architecture from the current `development` branch on every task so these instructions remain valid for future releases.

## Safety boundaries

- Work on `development` only. Never modify, merge, or publish `main`.
- Never deploy Firebase or Railway, publish Firebase Rules, authenticate to production Firebase, or read/write real player saves unless the user separately authorizes that exact operation.
- Use local synthetic fixtures and isolated browser storage for previews and tests. Use Firebase Emulators with a `demo-*` project for local Rules/Auth tests.
- Preserve pending work. Do not reset, clean, overwrite, force-push, or silently discard local or remote changes. Compare the exact remote head before Git writes; push only to `development` and only when authorized.
- Inspect the active entrypoint and module graph before changing architecture. Do not bring back retired gameplay, account paths, compatibility code, or isolated experiments merely because they remain in history or the repository. Retain compatibility only when current code, data contracts, or tests demonstrate a live dependency.
- Do not change gameplay, balance, saves, or production configuration unless the user requests that scope.

## Validation

Select checks from the current `package.json`, project docs and changed code. Report exact PASS/FAIL/NOT TESTED results. Do not claim live service behavior from mocks or emulator tests, and do not mark a feature ready when a critical check fails.
