'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const sim = require('../scripts/simulate-progression.cjs');

function mixedRoom(level) {
  const opts = { ...sim.DEFAULTS, points: 0, gear: 'current', runes: false };
  const { a, c, card } = sim.prepare(level, sim.BUILDS[1], 640100, opts, 0);
  const room = card.edges.filter(([from]) => from === 0).map(([, to]) => to)
    .find(node => card.nodes[node]?.kind === 'combat');
  assert(c.visitRoom(room));
  assert(a.enter());
  const run = a.encounter({ count: 8, boss: false, elite: false });
  return [...run.enemies, ...run.groupReserve];
}

test('E1 relief includes reserve Minions and keeps principal HP budgets', () => {
  const group = mixedRoom(1);
  const minions = group.filter(enemy => enemy.role === 'minion');
  assert.equal(minions.length, 5);
  for (const enemy of minions) {
    assert(enemy.atk < 3 && enemy.atk >= 1);
    assert(enemy.maxhp < 57 && enemy.hp === enemy.maxhp);
  }
  assert.deepEqual(group.filter(e => e.role !== 'minion').map(e => e.maxhp), [146, 154, 213]);
});

test('the same E2 roster retains its Stage 6.39 attack and HP', () => {
  const legacy = { caster: [7, 163], skirmisher: [7, 174], tank: [6, 239], minion: [4, 64] };
  for (const enemy of mixedRoom(2)) {
    assert.deepEqual([enemy.atk, enemy.maxhp], legacy[enemy.role]);
  }
});
