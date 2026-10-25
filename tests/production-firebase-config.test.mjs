import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { firebaseConfig, assertProductionFirebaseConfig } from '../online/firebase-config-production.mjs';

test('production Firebase config is explicitly bound to wanderer-play', () => {
  assert.equal(assertProductionFirebaseConfig().projectId, 'wanderer-play');
  assert.equal(firebaseConfig.authDomain, 'wanderer-play.firebaseapp.com');
  assert.equal(firebaseConfig.appId, '1:761358319947:web:23a35ecd7ac5e0b4b968ce');
  assert.throws(() => assertProductionFirebaseConfig({ ...firebaseConfig, projectId: 'wanderer-development-8e3ee' }), /approved wanderer-play/);
});

test('production publisher is manual, secret-gated, and Hosting-only', async () => {
  const workflow = await readFile(new URL('../.github/workflows/publish-firebase-development.yml', import.meta.url), 'utf8');
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /inputs\.target == 'production'/);
  assert.match(workflow, /github\.ref == 'refs\/heads\/main'/);
  assert.match(workflow, /inputs\.production_confirmation == 'DEPLOY wanderer-play'/);
  assert.match(workflow, /FIREBASE_SERVICE_ACCOUNT_WANDERER_PLAY/);
  assert.match(workflow, /channelId: live/);
  assert.doesNotMatch(workflow, /firestore:|deploy --only firestore/i);
  assert.match(workflow, /deploy-production:[\s\S]*?event_name == 'workflow_dispatch'/);
  assert.match(workflow, /deploy-production:[\s\S]*?inputs\.target == 'production'/);
  assert.doesNotMatch(workflow, /event_name == 'push'[^\n]*production/);
});

test('production publisher builds assets from the correct public directories', async () => {
  const script = await readFile(new URL('../scripts/prepare-hosting-production.mjs', import.meta.url), 'utf8');
  for (const dir of ['assets', 'online', 'combat', 'economy']) assert.match(script, new RegExp(`${dir}: new Set`));
  assert.match(script, /referenced assets are missing from hosting-dist/);
  assert.match(script, /firebase-config-production\.mjs/);
  assert.match(script, /online\/vendor\/firebase-sdk\.mjs/);
});

test('public entrypoint displays the released Wanderer version', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /<title>Wanderer v0\.12<\/title>/);
  assert.match(html, /<div class="version">v0\.12\.0<\/div>/);
});


test('production Firebase client validates wanderer-play and does not apply the development-only guard', async () => {
  const client = await readFile(new URL('../online/firebase-client.mjs', import.meta.url), 'utf8');
  assert.match(client, /firebaseEnvironment==='production'\?assertProductionFirebaseConfig:assertDevFirebaseConfig/);
  assert.match(client, /assertFirebaseConfig\(firebaseConfig\)/);
  assert.match(client, /firebase-config\.mjs\?v=v012-production-config-4/);
});

test('v0.12 homepage exposes account and feedback controls without the local playtest badge', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const css = await readFile(new URL('../online/v012-phase1.css', import.meta.url), 'utf8');
  assert.doesNotMatch(html, /v0\.12\.0 · Local playtest/);
  assert.match(html, /data-online-action="account"/);
  assert.match(html, /data-online-action="feedback"/);
  assert.match(html, /v012-account\.mjs\?v=v012-account-ui-1/);
  assert.match(html, /v012-feedback\.mjs\?v=v012-feedback-ui-1/);
  assert.doesNotMatch(css, /data-online-action="feedback"\]\{display:none!important\}/);
});
