# Wanderer Dev Agent

Private repository marketplace plugin for `Skinny-lfg/wanderer-game`.

## Included

- `skills/wanderer-dev-agent`: project guardrails and workflows for GitHub, Drive, Firebase emulators, and Playwright.
- `mcp/server.mjs`: local preflight, allow-listed project checks, and isolated screenshot capture.
- `hooks/hooks.json`: read-only preflight context before each submitted prompt.
- `scripts/`: deterministic preflight and synthetic private-preview screenshots.

## Install in Codex desktop

The repository marketplace is `.agents/plugins/marketplace.json`, and `.codex/config.toml` enables this plugin for the project. Restart the Codex desktop app, open the Plugins Directory, select the `wanderer-local` marketplace, and install **Wanderer Dev Agent**. Review and trust its `UserPromptSubmit` hook when Codex prompts; the hook only runs the local read-only preflight. The hook and local stdio MCP require the local project to remain trusted.

The Plugin Creator app integration is optional for this manually packaged plugin. Its connection is not embedded in or required by this repository package.

## Safety

- Emulator operations use `demo-wanderer` and an isolated CLI config directory under `/tmp`.
- The preview screenshots use random, in-memory credentials, localhost-only requests, and synthetic local storage.
- No Firebase CLI login, production save access, deploy, or Rules publication is performed.
- GitHub and Google Drive use the user's connected Codex integrations; credentials are not copied into this package.
