'use strict';

// Run from the checked-out project. A different project root can be supplied to
// compare versions with exactly the same measuring code, profiles and RNG seeds.
const fs = require('node:fs');
const path = require('node:path');
const { Worker, isMainThread, parentPort, workerData } = require('node:worker_threads');
const profiles = ['balanced', 'smart-fury-bow', 'leather-duelist', 'plate-warden', 'hexblade-hybrid'];
const seeds = [9861, 9863, 9865, 9867, 9869];

function accountRows(root, jobs) {
  const sim = require(path.join(root, 'scripts/v013-natural-progression.cjs'));
  const catalog = require(path.join(root, 'scripts/v013-stage632-player-power.cjs'));
  const accounts = [];
  for (const { id, seed } of jobs) {
    const account = sim.simulateAccount(seed, id, {
      ...sim.DEFAULTS, seeds: [seed], profiles: [id], maxLevel: 2,
      maxAttempts: 12, maxTotalAttempts: 24
    }, { researchProfiles: catalog.PROFILES, decisionModel: 'adaptive' });
    const rooms = [];
    for (const attempt of account.attempts) {
      if (attempt.error && attempt.error !== 'Native combat timeout') throw Error(attempt.error);
      for (const room of attempt.rooms) {
        rooms.push({
          level: attempt.level, attempt: attempt.attempt, kind: room.kind,
          size: room.initialEnemies, minions: room.initialMinions, roles: room.initialRoleCounts,
          elite: room.eliteType, boss: room.bossStyle, weapon: room.actualWeapon,
          aoe: room.aoePotential, secondaryDamage: room.secondaryTargetDamage,
          won: room.won, died: room.died, timeout: room.timedOut, seconds: room.seconds
        });
      }
    }
    accounts.push({ id, seed, reachedE2: account.attempts.some(a => a.level === 2), rooms });
  }
  return accounts;
}

async function main() {
  const [output, rootArg = '.', mode = 'pilot'] = process.argv.slice(2);
  if (!output || !['pilot', 'full'].includes(mode)) throw Error('Usage: node scripts/v013-stage640-calibration.cjs OUTPUT.json [PROJECT_ROOT] [pilot|full]');
  const root = path.resolve(rootArg);
  const catalog = require(path.join(root, 'scripts/v013-stage632-player-power.cjs'));
  const source = require(path.join(root, 'scripts/simulate-progression.cjs')).sourceFingerprint().sha256;
  const ids = mode === 'full' ? catalog.IDS : profiles;
  const jobs = ids.flatMap(id => seeds.map(seed => ({ id, seed })));
  const workers = Math.min(6, jobs.length);
  const batches = Array.from({ length: workers }, (_, i) => jobs.filter((_, j) => j % workers === i));
  const parts = await Promise.all(batches.map(jobs => new Promise((resolve, reject) => {
    const worker = new Worker(__filename, { workerData: { jobs, root } });
    worker.once('message', resolve);
    worker.once('error', reject);
    worker.once('exit', code => { if (code) reject(Error('Worker exited ' + code)); });
  })));
  const accounts = parts.flat().sort((a, b) => a.id.localeCompare(b.id) || a.seed - b.seed);
  if (require(path.join(root, 'scripts/simulate-progression.cjs')).sourceFingerprint().sha256 !== source) throw Error('Native source changed during the run');
  fs.writeFileSync(output, JSON.stringify({ stage: '6.40', mode, source, seeds, accounts }));
  for (const level of [1, 2]) {
    const rows = accounts.flatMap(a => a.rooms.filter(r => r.level === level));
    const groups = {};
    for (const r of rows) {
      const labels = [r.kind, r.kind + '/' + (r.elite || r.boss || 'n' + Math.min(5, r.size))];
      for (const label of labels) {
        const v = groups[label] ||= [0, 0];
        v[0] += Number(!!r.won);
        v[1] += Number(!!(r.won || r.died));
      }
    }
    console.log('E' + level, JSON.stringify(groups));
  }
}
if (isMainThread) main().catch(e => { console.error(e); process.exitCode = 1; });
else parentPort.postMessage(accountRows(workerData.root, workerData.jobs));
