'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const [mode, rootArg, file, output] = process.argv.slice(2);
if (!['capture', 'replay'].includes(mode) || !file || (mode === 'replay' && !output)) {
  throw Error('Usage: capture ROOT SNAPSHOTS.json or replay ROOT SNAPSHOTS.json RESULTS.json');
}
const root = path.resolve(rootArg);
const sim = require(path.join(root, 'scripts/v013-natural-progression.cjs'));
const matrix = require(path.join(root, 'scripts/v013-stage628-postcap-difficulty.cjs'));
const aoe = require(path.join(root, 'scripts/v013-stage639-earned-aoe-comparison.cjs'));
const native = require(path.join(root, 'scripts/simulate-progression.cjs'));
const profiles = ['balanced', 'smart-fury-bow', 'leather-duelist', 'plate-warden', 'hexblade-hybrid'];
const seeds = [9861, 9863, 9865, 9867, 9869];

function snapshot({ a, level, attempt, seed, profile }) {
  const s = a.state(), tree = s.automaticTalents;
  if (level !== 1 || a.controller().state.unlocked !== level || !a.talents.valid(tree)) {
    throw Error('Invalid native E1 checkpoint');
  }
  const state = structuredClone({ level, unlocked: level, equip: s.equip, automaticTalents: tree,
    runes: s.runes, runeSlots: s.runeSlots });
  const talentEarned = a.talents.earned(tree);
  return {
    profile: profile.name, seed, attempt, level, state, xp: tree.xp, talentEarned,
    talentSpent: tree.nodes.length, attributeEarned: a.talents.attributeBudget(tree),
    attributeSpent: a.talents.spentAttributes(tree), attributes: a.talents.attributes(tree),
    equipPieces: Object.values(s.equip).filter(Boolean).length
  };
}

if (mode === 'capture') {
  const snapshots = [];
  for (const id of profiles) for (const seed of seeds) {
    const camps = new Map();
    const acc = sim.simulateAccount(seed, id,
      { ...sim.DEFAULTS, seeds: [seed], profiles: [id], maxLevel: 1, maxAttempts: 12, maxTotalAttempts: 12 },
      { decisionModel: 'adaptive', onCamp(probe) { camps.set(probe.attempt, snapshot(probe)); } });
    const errors = acc.attempts.filter(x => x.error && x.error !== 'Native combat timeout');
    if (errors.length) throw Error(errors[0].error);
    const firstBoss = acc.attempts.find(x => x.rooms.some(r => r.kind === 'boss'));
    const camp = camps.get((firstBoss || acc.attempts.at(-1)).attempt);
    snapshots.push({ id, camp, aoe: aoe.aoeState(camp).aoePotential, reachedBoss: !!firstBoss });
  }
  fs.writeFileSync(file, JSON.stringify(snapshots));
} else {
  const input = fs.readFileSync(file);
  const snapshots = JSON.parse(input), rooms = [];
  for (const { id, camp, aoe: hasAoE } of snapshots) {
    const scenarios = matrix.scenarios(camp);
    const realm = scenarios[0].realm;
    const encounters = [...[1, 2, 3, 4, 5, 8, 12].map(size => ({ id: 'group-' + size, type: 'normal', size, realm })),
      ...scenarios.filter(s => s.type !== 'normal')];
    for (const encounter of encounters) {
      const r = matrix.native(camp, encounter, 640000 + camp.seed * 23, false);
      if (r.timedOut || (!r.won && !r.died)) throw Error('Unresolved controlled fight: ' + encounter.id);
      rooms.push({ id, seed: camp.seed, encounter: encounter.id, kind: encounter.type,
        boss: r.bossStyle, elite: r.eliteType, aoe: hasAoE, gear: r.gearFingerprint,
        leader: r.roster.find(x => x.role === r.nativeEncounter) || r.roster[0],
        roles: r.initialRoles, won: !!r.won, seconds: r.seconds, damage: r.damageTaken,
        casts: r.enemyAbilityCasts, summons: (r.eliteSummons || 0) + (r.bossSummons || 0),
        secondary: r.secondaryTargetDamage, hpStart: r.hpStart, hpEnd: r.hpEnd });
    }
  }
  fs.writeFileSync(output, JSON.stringify({ source: native.sourceFingerprint().sha256,
    snapshots: crypto.createHash('sha256').update(input).digest('hex'), rooms }));
}
