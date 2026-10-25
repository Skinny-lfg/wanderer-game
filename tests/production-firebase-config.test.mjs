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
