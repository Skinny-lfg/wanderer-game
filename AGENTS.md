# Wanderer Dev Agent — project guidance

## Start every task with a current project snapshot

The trusted `UserPromptSubmit` hook runs a read-only local preflight and adds the checked-out branch, local version evidence, entrypoint, loaded modules, standalone experiments, relevant documentation and local tool readiness to task context. At every task, also read the current remote `development` ref through the connected GitHub integration and compare its SHA with the local snapshot before edits. If they differ, inspect relevant code/docs at that remote SHA through GitHub or a read-only fetch; preserve local pending work and do not silently merge it. The local hook cannot authenticate to GitHub or Drive. When version signals disagree, report the conflict and establish the active product state from code and authoritative docs at the exact branch SHA; do not infer it from an old filename or cached instruction.

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
