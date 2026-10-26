---
name: wanderer-dev-agent-setup
description: Set up and verify the local Wanderer Dev Agent plugin after installation.
---

Run the MCP `preflight` tool and review its status. Verify the GitHub connector against `Skinny-lfg/wanderer-game` and its `development` branch, and verify Google Drive using a read-only search if it is connected. Do not print OAuth or CLI credentials. Run the Firebase rules suite only against `demo-wanderer` emulators. Do not run Firebase login, production project commands, deploys, or Rules publication. Finish by reporting which connections actually responded and any checks that need the user's Codex app hook review/trust.
