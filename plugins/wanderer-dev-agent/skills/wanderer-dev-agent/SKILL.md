---
name: wanderer-dev-agent
description: Use for development, testing, Firebase emulators, GitHub, screenshots, and relevant Drive research in Skinny-lfg/wanderer-game.
---

# Wanderer Dev Agent

Follow repository `AGENTS.md` for safety and authorization. Consume the existing `UserPromptSubmit` local snapshot; invoke MCP `preflight` only when absent, failed, or insufficient for the actual task. It is local evidence, **not** proof of GitHub/Drive access.

Identify the active branch, commit and task-specific modules. The integration target is ordinarily `development`; authorized isolated branches may differ. Verify remote SHA and write permission **before Git writes**, preserve pending changes, and never reset or force-push. Recheck the remote immediately before push. Do not touch `main` or deploy without separate authorization.

Consult README/changelog/current architecture documents selectively if needed; historical version labels are not fixed gates. Use connected Drive only for relevant assets or docs. Never authenticate to production Firebase, inspect real saves, publish Rules or deploy as part of ordinary development; use `demo-*` emulators. Screenshots require an isolated local preview with synthetic state.

For checks, use the existing allow-listed MCP `run_check` suites: `unit`, `preview`, `browser`, `assets`, `simulation`, `rules`. Choose suites based on affected components and risk. Do not repeat full simulations or all-page screenshots per small edit; perform complete release gates only at designated checkpoints. Security, persistence and economic changes still require adequate targeted validation. `capture_preview_screenshots` writes into ignored `test-results/wanderer-dev-agent/`.

Output a compact status summary (branch/SHA, changed files, exact PASS/FAIL/NOT TESTED, blockers and next action); omit verbose logs unless requested. Never expose credentials or generated secrets.
