// Build an allowlisted static Hosting artifact; never deploy developer files.
import { readFile, mkdir, readdir, copyFile, lstat, rm, access } from 'node:fs/promises';
import { join, dirname } from 'node:path';

const output = 'hosting-dist';
const publicDirs = {
  assets: new Set(['.json', '.png', '.webp', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.avif', '.woff', '.woff2']),
  online: new Set(['.mjs', '.js', '.css']),
  combat: new Set(['.js', '.mjs', '.json']),
  economy: new Set(['.js', '.mjs', '.json']),
};
const required = [
  'index.html',
  'auth-action.html',
  'online/firebase-config.mjs',
  'online/vendor/firebase-sdk.mjs',
  'assets/releases/v0110-home-banner.webp',
  'assets/branding/wanderer-icon-32.png',
];

function assert(condition, reason) {
  if (!condition) throw new Error('Refusing Firebase Hosting release: ' + reason);
}
if (process.env.GITHUB_ACTIONS) {
  assert(process.env.GITHUB_REF === 'refs/heads/main', 'only main may publish');
}
assert(!process.env.FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID === 'wanderer-play',
  'wrong target Firebase project');

const config = await readFile('online/firebase-config.mjs', 'utf8');
assert(/\bprojectId\s*:\s*['"]wanderer-play['"]/.test(config), 'production Web App must use wanderer-play');
assert(/\bauthDomain\s*:\s*['"]wanderer-play\.firebaseapp\.com['"]/.test(config),
  'production authDomain must match wanderer-play');
assert(!/wanderer-development-8e3ee|wanderer-test-8f062/.test(config),
  'old or development project detected in production configuration');

const index = await readFile('index.html', 'utf8');
assert(/<title>\s*Wanderer v0\.11\.0\s*<\/title>/.test(index),
  'main must contain the reviewed v0.11.0 release before publication');
assert(/online\/auth-action\.mjs/i.test(await readFile('auth-action.html', 'utf8')),
  'custom email handler must exist');

await rm(output, {recursive: true, force: true});
await mkdir(output, {recursive: true});
let count = 0;

async function copySafely(src, dest) {
  const metadata = await lstat(src);
  assert(!metadata.isSymbolicLink(), 'symlinks are forbidden in public files: ' + src);
  if (metadata.isDirectory()) {
    await mkdir(dest, {recursive: true});
    for (const entry of await readdir(src)) {
      if (entry.startsWith('.')) continue;
      await copySafely(join(src, entry), join(dest, entry));
    }
    return;
  }
  assert(metadata.isFile(), 'unexpected public file type: ' + src);
  const top = src.split('/')[0];
  const ext = src.slice(src.lastIndexOf('.')).toLowerCase();
  if (!publicDirs[top]?.has(ext)) return;
  if (src === 'online/firebase-sdk-source.mjs') return; // Build-time source, not a runtime asset.
  await mkdir(dirname(dest), {recursive: true});
  await copyFile(src, dest);
  count++;
}

for (const dir of Object.keys(publicDirs)) {
  await copySafely(dir, join(output, dir));
}
for (const name of ['index.html', 'auth-action.html']) {
  await copyFile(name, join(output, name));
  count++;
}
for (const file of required) {
  await access(join(output, file));
}
console.log('Release v0.11.0: prepared ' + count + ' static files in ' + output);
