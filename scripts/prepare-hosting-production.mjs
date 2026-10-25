// Build a public-only production Hosting artifact without using the Firebase CLI.
import { access, copyFile, lstat, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, extname, join } from 'node:path';
import { glob } from 'node:fs/promises';

const PROJECT = 'wanderer-play';
const OUTPUT = 'hosting-dist';
const publicDirs = {
  assets: new Set(['.json', '.png', '.webp', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.avif', '.woff', '.woff2']),
  online: new Set(['.mjs', '.js', '.css']),
  combat: new Set(['.mjs', '.js', '.json']),
  economy: new Set(['.mjs', '.js', '.json'])
};
const assert = (condition, reason) => { if (!condition) throw new Error('Production Hosting blocked: ' + reason); };

assert(process.env.GITHUB_ACTIONS === 'true', 'must run in the controlled GitHub Actions workflow');
assert(process.env.GITHUB_REF === 'refs/heads/development', 'requires the development branch');
assert(process.env.FIREBASE_PROJECT_ID === PROJECT, 'target must be wanderer-play');
assert(process.env.PUBLISH_PRODUCTION === 'DEPLOY wanderer-play', 'manual production release confirmation is missing');

const html = await readFile('index.html', 'utf8');
assert(/<title>Wanderer v0\.12<\/title>/.test(html), 'wrong site/version');
const devConfig = await readFile('online/firebase-config.mjs', 'utf8');
assert(/projectId:\s*['"]wanderer-development-8e3ee['"]/.test(devConfig), 'development config changed unexpectedly');
const prodConfig = await readFile('online/firebase-config-production.mjs', 'utf8');
assert(/projectId:\s*['"]wanderer-play['"]/.test(prodConfig), 'production config must target wanderer-play');
assert(!/private_key|client_email/.test(prodConfig), 'service-account credentials must never enter public files');

await rm(OUTPUT, { recursive: true, force: true });
await mkdir(OUTPUT, { recursive: true });
let count = 0;
async function copyPublic(src, dest, extSet) {
  const info = await lstat(src);
  assert(!info.isSymbolicLink(), 'symlink is not allowed: ' + src);
  if (info.isDirectory()) {
    await mkdir(dest, { recursive: true });
    for (const child of await readdir(src)) {
      if (!child.startsWith('.')) await copyPublic(join(src, child), join(dest, child), extSet);
    }
  } else if (info.isFile() && extSet.has(extname(src).toLowerCase()) && src !== 'online/firebase-sdk-source.mjs') {
    await mkdir(dirname(dest), { recursive: true });
    await copyFile(src, dest);
    count++;
  }
}
for (const [dir, extensions] of Object.entries(publicDirs)) {
  await copyPublic(dir, join(OUTPUT, dir), extensions);
}
for (const file of ['index.html', 'auth-action.html']) {
  await copyFile(file, join(OUTPUT, file));
  count++;
}
await copyFile('online/firebase-config-production.mjs', join(OUTPUT, 'online/firebase-config.mjs'));
await writeFile(join(OUTPUT, 'online/v012-build-info.mjs'), 'export const buildCommit=' + JSON.stringify(String(process.env.GITHUB_SHA || '').slice(0, 20)) + ';\n');

for (const required of [
  'index.html', 'auth-action.html', 'online/firebase-config.mjs', 'online/vendor/firebase-sdk.mjs',
  'online/v012-ui4e.css', 'online/v012-build-info.mjs', 'assets/branding/wanderer-icon-32.png',
  'assets/branding/wanderer-icon-192.png', 'assets/ui-kit/rarity/v3_5'
]) await access(join(OUTPUT, required));

const trackedFiles = ['index.html'];
for (const dir of ['online', 'combat', 'economy']) {
  for await (const file of glob(`${dir}/**/*.{html,js,mjs}`, { exclude: ['**/node_modules/**'] })) trackedFiles.push(file);
}
const referencedAssets = new Set();
for (const file of trackedFiles) {
  if (!/\.(html|m?js)$/.test(file)) continue;
  const source = await readFile(file, 'utf8');
  for (const match of source.matchAll(/assets\/[A-Za-z0-9_./-]+/g)) {
    const asset = match[0].replace(/[),;'"`]+$/, '');
    if (/\.[a-z0-9]{2,5}$/i.test(asset)) referencedAssets.add(asset);
  }
}
const missingAssets = [];
for (const asset of referencedAssets) {
  try { await access(join(OUTPUT, asset)); } catch { missingAssets.push(asset); }
}
assert(missingAssets.length === 0, 'referenced assets are missing from hosting-dist: ' + missingAssets.slice(0, 10).join(', '));

const outputConfig = await readFile(join(OUTPUT, 'online/firebase-config.mjs'), 'utf8');
assert(/projectId:\s*['"]wanderer-play['"]/.test(outputConfig), 'production config was not installed in artifact');
assert(!/wanderer-development-8e3ee/.test(outputConfig), 'development config leaked into production artifact');
console.log(`Prepared ${count} public Wanderer v0.12 files for ${PROJECT}`);
