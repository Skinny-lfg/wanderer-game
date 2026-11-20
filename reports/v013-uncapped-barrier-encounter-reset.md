# Wanderer v0.13 — Uncapped Barrier and encounter reset

**Branch:** `audit/v013` only. **Production:** no merge/deploy.
**Implementation:** `c71e88fe7b484bd34b91a12f539a1812f99b6ffa`.
**Docs preview synchronization:** `4490718f205e7a0b89c72998c531f46799292928`.
**Test correction:** `c30e1b4b4fe3bfed6fead21459436269382953f8`.
**Historical simulation-comparison protocol:** `53c62e0a00319566fcc53ccf29039c8925026e07`.

## New authoritative rules

1. **No global hero Barrier cap.** The native `setBarrier` accumulates all positive Barrier grants in one pool, including Aegis, Orb, talent, gear, preparation and Legendary effects. Ward Strength is applied once. The obsolete `barrierCap` API has been removed; this does not remove ability-specific cooldowns or other separately constrained resources.
2. **One Orb identity for every eligible one-handed weapon and Affinity.** When a main-hand attack actually damages enemy HP, or an automatic funded Magic cast on a physical weapon damages enemy HP, generate `2% Max HP + 5% Spell Power` Barrier, once per 6 seconds. No Wand-only percentage and no Magic/Decay gating. Attacks stopped entirely by an enemy's Barrier do not trigger the on-hit Orb effect. Tome and Charm remain unchanged.
3. **Additive Aegis + Orb.** Aegis's `5% Max HP + 8% Spell Power` initial grant is independent from Orb's offensive trigger; subsequent effects add rather than replace each other.
4. **Clear after every completed encounter.** At victory, the surviving Barrier is set to zero after combat metrics are captured. New `phase1StartWave` also clears any residual Barrier *before* applying fresh entry grants. Reentering a new fight never carries the previous shield pool.
5. **Preserve fresh entry sources.** The prepared Barrier effect and Veil Legendary are applied *after* the entry reset so Aegis, Talents and Legendary mechanics still work as intended. A build with Aegis may therefore show Barrier immediately at the start of combat—this is newly generated, not carried from the prior fight. Health/Mana progression remains unchanged.
6. **Remove stale descriptions.** Talent Graph and Barrier Pulse no longer describe the removed HP/SP Barrier cap; the generated Pages iframe and source assets are synchronized.

## Native tests and simulation

[GitHub Actions C7 run 44741993308](https://github.com/Skinny-lfg/wanderer-game/actions/runs/44741993308): **all four mandatory jobs succeeded**.

- Native gameplay: **340/340**, including new Orb independence, additive Aegis and 200%+ HP stack, encounter entry and victory resets.
- Simulator tests: **7/7**.
- Talent Graph: **79/79**.
- Current combat, Elite and Boss suites: **94/94**.
- Current integration/economy: **85/85**.
- 48/48 current controlled affinity comparisons valid in Stages 2, 3 and 4; zero errors/timeouts.
- Stage 4 Elite/Boss stress: **96 cases**, 78 wins, 18 deaths, **0 errors, 0 timeouts**. This is exploratory, not a balancing sign-off.
- Security/account, real Chromium browser journey, natural progression pilot and exact Pages source parity: **pass**.

### Frozen historical comparisons

Stage 1/2/3 frozen affinity reports predate the new global Barrier/encounter reset rule. Comparing their Barrier and survival-derived quantities as exact equalities is invalid after this deliberately global change. These reports are *retained, not overwritten*. The current Stage 2–4 simulation runners explicitly mark `comparisonMode=post-uncapped-encounter-reset`, preserve fixed scenarios/builds/seeds, reject simulator errors/timeouts and Spell Power drift, and report the measured historical differences. Their original strict historical comparator APIs remain available and covered by frozen-fixture unit tests. This is **not** a claim that unrelated balance statistics are unchanged.

## Deferred

No broad balance adjustments and no changes to offhand item stat/affix distribution, recipes or detailed UI item descriptions in this iteration. Stage 2 of the Off-Hand design can address item profiles before global tuning.
