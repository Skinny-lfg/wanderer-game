# Wanderer v0.12 — private online test hosting

**Do not publish the development branch to GitHub Pages to restrict access.** GitHub Pages is public for normal personal repositories. A JavaScript login overlay, password included in HTML/JS, or hashed password in a public repo **cannot** protect the source or the game from other visitors.

This repository provides a server-side protected preview in \`preview/private-server.mjs\`, running on any Node 22-compatible HTTPS host (for example Railway). The server returns neither the game HTML nor any game assets until the owner logs in. It deliberately disables the classic Firebase online login in the preview document and launches the integrated v0.12 Expedition game with isolated local validation saves.

## Deploy on a HTTPS Node host

1. Create a **separate preview service** from the \`development\` branch. **Do not point the production game domain or production hosting to this service.**
2. Set the service start command to \`npm run preview:private\`. The service reads the provider's \`PORT\` variable and listens on \`0.0.0.0\`.
3. Create the following **secret environment variables in the hosting dashboard**, never in source control, PR descriptions or public CI logs:
   - \`PREVIEW_USERNAME\` — your desired tester username.
   - \`PREVIEW_PASSWORD\` — a new, unique, strong password of 12–256 characters.
4. Turn on HTTPS (the public preview refuses to run over plain HTTP). Open the domain; the server displays a dark fantasy username/password form. After login, it redirects to \`/?expeditionPhase1=1&expeditionSave=1\`.
5. Verify that an unauthenticated private window cannot access \`/\`, \`/online/v012-engine.mjs\`, or \`/assets/...\` — all must redirect to the login page.
6. Do not point an unprotected public static host at these source files, since that would bypass the login server. Even with protected hosting, the code remains visible in the public GitHub repository.

**Important:** If a credential was pasted into a chat or message, use a different password for actual deployment. Do not commit it to GitHub. The password is validated against a host environment variable on the server using timing-safe hash comparisons. There is a 12-failure/15-minute limit per source address, a 12-hour HttpOnly SameSite session cookie, and no client-side password list.

The authenticated preview is deliberately a **single-test-user service**. Integrated progression is stored only under the `wanderer_v012_validation_v1_` prefix; classic and prototype saves are not imported. Closing during an Expedition restores its saved checkpoint; an unfinished Realm resumes from its fixed entry. Completed rewards and passive choices are not awarded again. The preview does not write cloud saves, Firebase rules or production profiles. Browser storage is per browser/device; this is **not** cross-device cloud sync.

## Development-only local smoke

\`\`\`bash
PREVIEW_USERNAME=exampleowner PREVIEW_PASSWORD="replace-with-a-unique-long-value" PREVIEW_DEV_HTTP=1 PORT=8080 npm run preview:private
\`\`\`

Visit \`http://localhost:8080\`. **PREVIEW_DEV_HTTP=1 is only for localhost!** Remove it on actual hosting, which must have HTTPS.

\`\`\`bash
npm run test:preview
npm run test:v012
npm run test:v012:browser
\`\`\`

## What it does not do

- Does not make GitHub source code private or protect an existing public GitHub Pages URL.
- Does not set user-supplied credentials in the hosting provider: the owner must configure secret environment variables in the connected hosting account.
- Does not deploy anywhere automatically. An authorized hosting connector or manual deployment is required.
- Does not switch production \`main\`, cloud authentication, or saved player profiles to the v0.12 system.
