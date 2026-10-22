// Prepare only the public v0.12 development website for isolated Firebase Hosting.
import { readFile, mkdir, readdir, copyFile, lstat, rm, access } from 'node:fs/promises';
import { join, dirname, extname } from 'node:path';

const PROJECT = 'wanderer-development-8e3ee';
const OUTPUT = 'hosting-dist';
const publicDirs = {
  assets: new Set(['.json', '.png', '.webp', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.avif', '.woff', '.woff2']),
  online: new Set(['.mjs', '.js', '.css']),
  combat: new Set(['.mjs', '.js', '.json']),
  economy: new Set(['.mjs', '.js', '.json'])
};
const assert = (condition, reason) => { if (!condition) throw new Error('Development Hosting blocked: ' + reason); };

assert(!process.env.GITHUB_ACTIONS || process.env.GITHUB_REF === 'refs/heads/development', 'requires development branch');
assert(process.env.FIREBASE_PROJECT_ID === PROJECT, 'target must be the isolated development project');

const cfg = await readFile('online/firebase-config.mjs', 'utf8');
assert(/projectId:\s*['"]wanderer-development-8e3ee['"]/.test(cfg), 'wrong Web App project');
assert(/authDomain:\s*['"]wanderer-development-8e3ee\.firebaseapp\.com['"]/.test(cfg), 'wrong Web App auth domain');
assert(!/projectId:\s*['"]wanderer-play['"]/.test(cfg), 'refusing production Web App');

const html = await readFile('index.html', 'utf8');
assert(/<title>Wanderer v0\.12<\/title>/.test(html), 'wrong site/version');
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
for (const required of [
  'index.html', 'auth-action.html', 'online/firebase-config.mjs',
  'online/vendor/firebase-sdk.mjs', 'online/v012-ui4e.css'
]) {
  await access(join(OUTPUT, required));
}
await access(join(OUTPUT, 'assets/ui-kit/rarity/v3_5'));
console.log('Prepared ' + count + ' public Wanderer v0.12 files for ' + PROJECT);
