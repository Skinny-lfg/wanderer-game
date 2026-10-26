---
name: wanderer-dev-agent
description: Use for development, testing, Firebase emulator work, GitHub commits, screenshots, or Google Drive research in Skinny-lfg/wanderer-game.
---

# Wanderer Dev Agent

## Start every task with the current snapshot

1. Read the automatic `UserPromptSubmit` preflight context or call MCP `preflight` if it is missing. It reports the checked-out branch, working tree, version signals, canonical entrypoint, loaded modules, isolated experiments, relevant project docs, Firebase CLI/Emulator configuration and Playwright/Chromium availability.
2. Determine the current product version from current code and authoritative, current-branch docs. Treat README, changelog, HTML title, version badge, and versioned filenames as separate evidence. If they conflict, state that and resolve from code/docs before making version-specific claims. Never assume a fixed release or architecture from these instructions.
3. Inspect the active entrypoint and module loading before edits. Keep standalone prototypes and historical code isolated unless the user asks to integrate them and current project docs support that direction. Do not revive retired gameplay or old account paths by default.
4. Verify GitHub through its connected integration: read repository metadata and the current `development` ref. Confirm `Skinny-lfg/wanderer-game`. For writes, verify permission, compare the exact remote head, preserve pending work, and ensure a fast-forward update to `development` only.
5. When Drive is relevant, verify the connected Google Drive integration, then search/fetch only the documents or assets needed. Do not upload, share or modify Drive files unless directly requested.
6. Use Firebase local emulators by default. Use a `demo-*` project; do not run CLI login, select a production project, deploy, publish Rules or inspect/modify real saves.
7. If browser behavior matters, use the private-preview screenshot tool or isolated browser suites. They use generated synthetic credentials, local-only routing and synthetic storage.

If a check fails, state which path could not be verified and continue independent safe work. Never invent a connected state.

## Repository and change boundaries

- Work only on `development`; `main` is out of bounds.
- Preserve unrelated working-tree and remote changes. Never reset, clean, force-push or overwrite a remote branch.
- Commit/push only when the current user has authorized it. Push `development` only after confirming the remote head and fast-forward safety.
- No Firebase/Railway deploys, production Firebase authentication, Rules publication or real-save access.
- Follow root `AGENTS.md` and the current branch's relevant product/architecture docs. Version-specific instructions must be derived from current evidence, not this skill.
- Do not make gameplay or balance changes unless requested.

## Checks and screenshots

- `run_check` accepts only allow-listed suites (`unit`, `preview`, `browser`, `assets`, `simulation`, `rules`). Rules always run in local demo emulators.
- `capture_preview_screenshots` uses the password-gated private local preview, synthetic browser state, and saves screenshots under ignored `test-results/wanderer-dev-agent/`. It reports page errors, failed responses and external requests.
- Do not expose generated credentials, tokens or environment variable values in tool output.
