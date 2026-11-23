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

test('E2 gradually retains group relief rather than jumping to unreduced Stage 6.39 pressure', () => {
  const unreduced = { caster: [7, 163], skirmisher: [7, 174], tank: [6, 239], minion: [4, 64] };
  const group = mixedRoom(2);
  assert.equal(group.length, 8);
  assert.equal(group.filter(enemy => enemy.role === 'minion').length, 5);
  for (const enemy of group) {
    assert(enemy.atk >= 1 && enemy.atk <= unreduced[enemy.role][0]);
    if (enemy.role === 'minion') {
      assert(enemy.maxhp < unreduced.minion[1]);
    } else {
      // This continuity pass changes attack pressure, not principal HP/DEF.
      assert.equal(enemy.maxhp, unreduced[enemy.role][1]);
    }
  }
  assert(group.some(enemy => enemy.atk < unreduced[enemy.role][0]));
});
