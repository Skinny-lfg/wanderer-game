import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {collectProjectSnapshot} from '../plugins/wanderer-dev-agent/scripts/project-snapshot.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');


test('private plugin package, marketplace and project enablement are valid references',async()=>{
 const manifest=JSON.parse(await readFile(path.join(root,'plugins/wanderer-dev-agent/plugin.json'),'utf8'));
 const marketplace=JSON.parse(await readFile(path.join(root,'.agents/plugins/marketplace.json'),'utf8'));
 const mcp=JSON.parse(await readFile(path.join(root,'plugins/wanderer-dev-agent/mcp.json'),'utf8'));
 const hooks=JSON.parse(await readFile(path.join(root,'plugins/wanderer-dev-agent/hooks/hooks.json'),'utf8'));
 assert.equal(manifest.name,'wanderer-dev-agent');
 assert.equal(marketplace.plugins[0].name,manifest.name);
 assert.equal(marketplace.plugins[0].source.path,'./plugins/wanderer-dev-agent');
 assert.ok(mcp.mcpServers['wanderer-dev-agent']);
 assert.ok(hooks.hooks.UserPromptSubmit);
 assert.match(await readFile(path.join(root,'.codex/config.toml'),'utf8'),/wanderer-dev-agent@wanderer-local/);
});



test('new-prompt hook reports dynamically discovered version and architecture evidence',async()=>{
 const snapshot=collectProjectSnapshot();
 assert.ok(snapshot.head);
 assert.match(snapshot.head,/^[0-9a-f]{40}$/,'local HEAD must be full SHA to compare with origin tracking');
 const localHead=spawnSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'});
 assert.equal(snapshot.head,localHead.stdout.trim());
 assert.ok(snapshot.version.assessment);
 assert.ok(Array.isArray(snapshot.version.evidence));
 assert.equal(snapshot.architecture.canonicalEntrypoint,'index.html');
 assert.ok(Array.isArray(snapshot.architecture.directScriptLoads));
 assert.ok(Array.isArray(snapshot.architecture.standaloneOrPrototypeFiles));
 const hook=spawnSync(process.execPath,[path.join(root,'plugins/wanderer-dev-agent/scripts/preflight-hook.mjs')],{cwd:root,encoding:'utf8',timeout:30000});
 assert.equal(hook.status,0,hook.stderr);
 const event=JSON.parse(hook.stdout);
 assert.equal(event.hookSpecificOutput.hookEventName,'UserPromptSubmit');
 assert.match(event.hookSpecificOutput.additionalContext,/version/i);
 assert.match(event.hookSpecificOutput.additionalContext,/directScriptLoads/i);
});

test('persistent project guidance contains no fixed game-version gate',async()=>{
 const paths=['AGENTS.md','plugins/wanderer-dev-agent/skills/wanderer-dev-agent/SKILL.md','plugins/wanderer-dev-agent/skills/setup/SKILL.md'];
 for(const file of paths){
  const text=await readFile(path.join(root,file),'utf8');
  assert.doesNotMatch(text,/keep the v0\.12|only v0\.12|unrequested v0\.13 mechanics/i,file);
 }
});
