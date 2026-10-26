import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const result=spawnSync(process.execPath,[path.join(root,'plugins/wanderer-dev-agent/scripts/preflight.mjs')],{cwd:root,encoding:'utf8',timeout:25000,stdio:['ignore','pipe','ignore']});
const summary=(result.stdout||'').trim();
process.stdout.write(JSON.stringify({hookSpecificOutput:{hookEventName:'UserPromptSubmit',additionalContext:`Wanderer Dev Agent automatic local preflight (read-only):\n${summary||'Preflight could not return a report.'}\nVerify GitHub and Drive through connected integrations before use. Firebase is emulator-only; never use production auth or real saves.`}})+'\n');
