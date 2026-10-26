---
name: wanderer-dev-agent-setup
description: Set up and verify the local Wanderer Dev Agent plugin after installation.
---

Run MCP `preflight` and review its local version evidence and architecture snapshot. Then read the current remote `development` ref through GitHub and compare the SHA; if local and remote differ, inspect the code/docs at the remote SHA without overwriting local changes. Resolve conflicting code/documentation version signals before describing the product state. Verify Google Drive with a read-only search when connected and relevant. Do not print OAuth or CLI credentials. Run Firebase Rules tests only against local demo emulators. Do not run Firebase login, production project commands, deploys, or Rules publication. Report which integrations responded and whether Codex still needs the user to review/trust its local preflight hook.
