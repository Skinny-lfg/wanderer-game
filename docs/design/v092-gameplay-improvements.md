# Wanderer v0.9.2 — Gameplay Improvements (design and validation note)

**Branch:** `development` only. **Status:** implemented, tested by smoke suite, pending full prerelease review and player feedback. No `main` merge, Firebase rule deployment or real-save mutation.

## 1. Rune Recycling

Runes are boss rewards separate from the equipment Stash, remain after death and only one per family can be equipped. Players may **Recycle** an owned and unequipped rune to receive Fragments; selling an equipped rune is rejected, and selling during a dungeon or an unresolved rune reward is rejected.

**Value:** `5 + 2 × floor(rune tier / 10)` Fragments: D10 → 7; D50 → 15; D100 → 25; D200 → 45. Only valid boss tiers D10–D200 qualify. No changes to existing boss reward probabilities or Forge item cost.

The **Recycle spare duplicates** action retains the highest-tier rune in each family plus every currently equipped rune; other unused runes may be sold in one confirmed transaction. No transaction can sell the same rune twice. Existing rune arrays and slots are preserved.

## 2. Legendary Hunt guide

The player can choose one of the 21 existing Legendary identities from the dungeon selection panel. The choice is saved as an optional `legendaryHuntId`, safe for legacy saves. For each of the three currently offered paths, the guide computes:

`P(target identity | an equipment item rolled Legendary) = P(item's subtype in that path) / number of compatible Legendary identities`.

It displays the exact category preference from `dungeonEquipmentOdds`, highlights the best currently offered path, and makes clear that **no odds are increased**. Choice of target persists across reload; the guide neither forces rerolls nor pays Fragments. A separate targeted loot/pity mechanic is **not introduced** in v0.9.2.

Rationale: player agency via dungeon selection, without globally increasing Legendary drop count (prior studies found 94 observed vs 94.61 expected across 5,000 victory reward samples).

## 3. Extraction and early-game recovery

Dungeon entry explains that two protected equipped items survive death. Between waves, the risk panel explains the precise trade-off: extracting secures run loot, Gold and Fragments but will not unlock the next dungeon; continuing risks unprotected equipment, with a more prominent warning below 45% current HP. Nothing is auto-extracted or auto-protected, and existing dungeon unlock rules remain unchanged.

The **Training Sword** is now restored immediately on death if the player has no equipped items and an empty Stash. This is the same recovery provision that `load()` already offered after refreshing the page. It does **not** provide a high-level catch-up weapon and cannot generate repeated copies while the Stash contains one.

## 4. Crystal documentation

Crystal at 2 pieces grants +8% main-hand base-hit damage. At 3 pieces, every third *main attack* adds +15% base-hit damage (count restarts each wave). At 5, an eligible third main attack additionally triggers +35% damage when a **10 combat-second expedition cooldown** has elapsed. No combat stats or Crystal triggers changed in this task, only tooltips. This resolves the mismatch in `docs/v092-stress-test-phase2.md`.

## 5. Measured Staff / Two-Handed adjustment

Existing pilot evidence (D50: Staff 5/8 wins, Two-Handed 6/8) warranted narrow experiments before changing global difficulty. Reused production functions, **48 trials per weapon per level**, 12 of each elite Tank/Berserker/Vampire/Caster, at D30/D40/D50/D60. Both baseline and proposed changes use the same seeds and fully equipped legal Epic gear with a 3-piece primary affinity (no runes). This is an **equipment-equalized screening**, not a realistic gear-acquisition trajectory.

The adopted changes add a small defensive window, **not extra DPS**:
- Staff — **Arcane Guard:** after a successful mana-consuming cast, grant 3.5% maximum HP as Barrier, at most once every 6 combat seconds across the expedition.
- Two-Handed — **Heavy Guard:** on a main strike, grant 2.5% maximum HP Barrier, at most once every 6 combat seconds across the expedition.

The existing maximum Barrier cap and cooldown accounting are reused. Values scale with current max HP; once-per-window behavior is not multiplied by attack speed.

| Weapon | Dungeon | Baseline clears / 48 | Guard clears / 48 |
|---|---:|---:|---:|
| Staff | D30 | 40 | 45 |
| Staff | D40 | 30 | 37 |
| Staff | D50 | 30 | 39 |
| Staff | D60 | 47 | 47 |
| Two-Handed | D30 | 42 | 43 |
| Two-Handed | D40 | 43 | 44 |
| Two-Handed | D50 | 44 | 44 |
| Two-Handed | D60 | 39 | 46 |

The outcomes are **matched-seed, small samples**, not proof of balanced win rates for other builds, rarities, runes, elites, theme combinations or D200. Staff/Two-Handed remain vulnerable to extreme burst; review real player feedback and fresh midgame measurements rather than assuming these changes are universally optimal.

## 6. Explicit non-goals / future candidates

This change does **not** implement 21 unique Legendary combat powers, Affinity Cores, a new quality-boost Forge currency, a pity timer, global Legendary drop-rate changes or late-game enemy scaling. Those design ideas were previously discussed for future progression updates, but the simulation evidence does not yet support releasing all simultaneously. Keep them as separate balance initiatives with test gates, rather than shipping many uncontrolled RNG and power changes together.

The phase 3 audit could not credibly estimate real D200 completion-time distribution; this remains open until a stateful, player-policy validated simulator is available.

## Testing and release gate

Dedicated test: `node tests/v092-gameplay-upgrades.cjs`. Smoke CI includes this via `npm test`. Also review `tests/phase2-smoke.cjs`, `tests/cumulative-set-combat.cjs`, `tests/online-save-compat.cjs` and browser/emulator suites before release. None of the checks use real player saves or deploy Firebase rules.

**Do not merge to main until manual mobile/desktop testing and release authorization.**

A full isolated pre-release GitHub Actions audit is requested for this commit. Its pass/fail status must be inspected separately; this document alone does not imply approval for release.
