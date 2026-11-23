'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../combat/expedition-progression.js');
const policy = globalThis.WandererExpeditionProgression;

test('Stage 6.40 E1 Elite budgets are identity-specific, with no blanket scaling', () => {
  const base = { hp: 1, atk: 1, def: 1, interval: 1 };
  const cases = {
    tank: { hp: 1.78, atk: .75, interval: 1.85 },
    berserker: { atk: 1.01, interval: 1.65 },
    vampire: { atk: .84 },
    caster: { hp: 1.07, atk: 1.07 },
    gravecaller: { hp: 1.04 },
    oathbound_exarch: { hp: 1.18, atk: .87 },
    briarspine_horror: { hp: 1.80, atk: 1.18, interval: 1.72 },
    ashen_executioner: { hp: 1.16, atk: 1.00, interval: 2.27 }
  };
  assert.deepEqual(Object.keys(cases).sort(), [...policy.ELITE_IDENTITIES].sort());
  for (const [identity, overrides] of Object.entries(cases)) {
    assert.deepEqual(policy.firstExpeditionLeader(base, null, identity), { ...base, ...overrides });
  }
  // Expedition 2+ does not call the E1 override; the native identity base
  // remains the source of truth and the shared progression curve is intact.
  assert.equal(policy.firstExpeditionLeader(base, null, 'not_an_elite'), base);
});
