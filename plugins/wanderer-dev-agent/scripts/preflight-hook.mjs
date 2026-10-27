import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const result=spawnSync(process.execPath,[path.join(root,'plugins/wanderer-dev-agent/scripts/preflight.mjs')],{cwd:root,encoding:'utf8',timeout:25000,stdio:['ignore','pipe','ignore']});
// Keep the on-prompt context small. Full diagnostics remain available via the MCP preflight.
let summary='Preflight could not return a report.';
try {
 const report=JSON.parse(result.stdout||'');
 const project=report.checks?.project||{};
 summary=JSON.stringify({
  ok:report.ok,
  branch:project.branch,
  head:project.head,
  remoteTrackingDevelopment:project.remoteTrackingDevelopment,
  localHeadMatchesRemoteTracking:project.localHeadMatchesRemoteTracking,
  workingTree:project.workingTree,
  version:{assessment:project.version?.assessment,explicitCandidates:project.version?.explicitCandidates},
  architecture:{canonicalEntrypoint:project.architecture?.canonicalEntrypoint,directScriptLoads:project.architecture?.directScriptLoads?.slice(0,12)},
  readiness:{node:report.checks?.runtime?.nodeStatus,firebaseEmulators:report.checks?.firebase?.emulatorStatus,playwright:report.checks?.browser?.playwrightStatus},
  note:'Run the full preflight only if a relevant check fails or more environment detail is necessary.'
 },null,2);
} catch {
 summary=(result.stdout||'').trim().slice(0,1200)||summary;
}
process.stdout.write(JSON.stringify({hookSpecificOutput:{hookEventName:'UserPromptSubmit',additionalContext:`Wanderer Dev Agent automatic local preflight (read-only):\n${summary||'Preflight could not return a report.'}\nVerify GitHub and Drive through connected integrations before use. Firebase is emulator-only; never use production auth or real saves.`}})+'\n');
