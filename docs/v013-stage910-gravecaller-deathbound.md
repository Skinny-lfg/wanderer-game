# Wanderer v0.13 — Stage 9.10: Gravecaller Deathbound Ritual

## Purpose

Stage 9.9 improved Gravecaller summons but duplicated the Carrion Matriarch's
protection-by-living-minions mechanic. Stage 9.10 **removes that duplicated
10% incoming-damage reduction entirely**, retaining the two interruptible
summoning waves and native undead statistics. Deathbound Ritual gives the
Gravecaller an independent, offensive "kill the adds" identity.

## Runtime rules

- Call of the Fallen: 1.0s interruptible rituals at 85% and 40% HP.
- Each ritual summons up to 2 real native Realm undead; max 4 lifetime and
  2 alive simultaneously. Existing HP 50%, ATK 35%, attack interval 1.20×
  multipliers are unchanged.
- A successfully landed undead attack that damages the player's **HP**
  applies or refreshes **Deathbound Decay**. Dodged/parried/fully
  blocked/Barrier-absorbed attacks do not apply it.
- Decay has **up to four stacks**, lasts **four combat seconds** after the
  most recent qualifying attack, and ticks **once per combat second**.
  Each stack contributes **0.75% of player max HP per tick** (rounded once
  per tick, minimum one when active). This is a deliberately bounded
  first calibration; not a globally balanced damage target.
- Periodic Decay damage is absorbed by Barrier before HP, reports dedicated
  \`deathboundApplications\`, \`deathboundTicks\` and \`deathboundDamage\`
  counters, and uses the existing lethal-survival resolution.
- A death of the final summoned undead, death of its Gravecaller, or combat
  end stops the pressure. No effect carries between encounters.
- Visible in the player debuff strip as \`Deathbound Decay ×N · Ns\`, with
  decay-colored combat link and logs for stack changes, ticks and cleanse.
- No direct HP/ATK boosts to the Gravecaller and no modification to
  Carrion Matriarch's existing 15% damage reduction.

## Validation

Native Stage 8.2 tests cover successful hits, blocked hits, stack caps,
combat-time ticks, Barrier mitigation, expiry, last-minion cleanse, owner
death and encounter isolation.

The previous Stage 9.9 30-seed same-roster, same-start-seed Starter/Common
Gravecaller-vs-Tank comparisons are rerun in GitHub Actions. Do not
treat first-ring controlled wins as natural E1–E8 player outcomes.

**Release scope:** Preview branch only. No Firebase production, player saves,
loot rules, global difficulty or other Elite/Boss mechanics changed.
