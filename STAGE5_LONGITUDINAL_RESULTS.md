# Stage 5 — Native longitudinal progression E1–E20

**Status:** Completed and validated, 19 November 2026. **Branch:** `audit/v013`.
**Workflow:** https://github.com/Skinny-lfg/wanderer-game/actions/runs/44580281284
**Revision tested:** `27e97fb239d7878d3668126e35d9a6eb7585eec7`.
**Source:** two raw GitHub Actions artifacts `stage5-e1-e20-cohort-A` and
`stage5-e1-e20-cohort-B`. Both jobs passed.

## Test protocol

- 16 independent seeded accounts paired with two behavior profiles per seed:
  8 seeds cautious/balanced, 8 seeds balanced/daring = 32 trajectories.
- Begin each at native E1, starter gear and zero XP; enter E2+ only after
  winning the preceding Boss through native game rules.
- Across **1,903 native Expedition attempts**, retain legitimately earned XP,
  talents, equipment, Gold, Fragments, Essence and potion purchases.
- Camp uses native Merchant, Apothecary, Forge, salvage and extraction. Full
  Stash is managed through genuine salvage and recovery of overflow items.
- Maximum 24 attempts within a level and 90 cumulative attempts per account.
  These are censorship limits, not a proof an account is unable to progress.
- **Zero native simulation errors, no fabricated equipment, XP, unlocks,
  drops, combat damage, player stats or enemy scaling changes.**
- Never use synthetic fully-equipped E20 builds to claim actual progression.
  Outcomes are deterministic heuristic policies, not measured human win rates.

## Unlocked milestones and cost to reach them

| Milestone | Accounts unlocked | Median total native attempts to unlock | Range among achievers |
|---|---:|---:|---:|
| E5 | 30 / 32 | **28** | 22–61 |
| E10 | 30 / 32 | **43** | 33–76 |
| E20 | 27 / 32 | **55** | 45–89 |

Each unlocked milestone was also entered. All **30** accounts entering E5
and E10 eventually defeated the Boss within the allowed budgets; all **27**
accounts entering E20 defeated the Boss **on their first E20 attempt**.
Across the 27 E20 completers, the median total attempts **through E20**
was **56**. The sample does not cover every Affinity/risk combination.

## Where the difficulty peaks

The following measure is *observed attempts divided by accounts entering that
Expedition*, **not** an unbiased mean time-to-victory when some trajectories
were censored.

| Expedition | Accounts entering | Native attempts | Mean attempts per account entering | Completed Boss |
|---|---:|---:|---:|---:|
| E1 | 32 | 331 | 10.34 | 32 |
| E2 | 32 | 315 | 9.84 | 30 |
| E3 | 30 | 251 | 8.37 | 30 |
| E4 | 30 | 120 | 4.00 | 30 |
| E5 | 30 | 179 | 5.97 | 30 |
| E6 | 30 | 83 | 2.77 | 30 |
| E7 | 30 | 91 | 3.03 | 30 |
| E8 | 30 | 46 | 1.53 | 30 |
| E9 | 30 | 49 | 1.63 | 30 |
| E10 | 30 | 48 | 1.60 | 30 |
| E11 | 30 | 66 | 2.20 | 30 |
| E12 | 30 | 43 | 1.43 | 30 |
| E13 | 30 | 50 | 1.67 | 30 |
| E14 | 30 | 37 | 1.23 | 30 |
| E15 | 30 | 46 | 1.53 | 29 |
| E16 | 29 | 33 | 1.14 | 29 |
| E17 | 27 | 31 | 1.15 | 27 |
| E18 | 27 | 29 | 1.07 | 27 |
| E19 | 27 | 28 | 1.04 | 27 |
| E20 | 27 | 27 | **1.00** | **27** |

Peaks: severe E1–E3, a secondary E5 increase, smaller E7/E11
bumps, then very weak resistance from E14–E20 in these agents.

## Results by scripted profile

| Profile | Accounts | E5 unlocked | E10 unlocked | E20 unlocked |
|---|---:|---:|---:|---:|
| Cautious | 8 | 8 | 8 | 8 |
| Balanced | 16 | 16 | 16 | 16 |
| Daring | 8 | 6 | 6 | 3 |

The five non-E20 paths were **all Daring**: two failed to clear E2 within
24 attempts; three exhausted the 90-total-attempt budget at E15 (one) or
E17 (two). They are **censored**, not evidence of mathematically
unwinnable levels.

## Progression power and encounter attrition

- On entering E1: native starter equipment is 3 pieces, with 0 earned talent
  points. On first entering E5, the 30 surviving accounts averaged **10
  equipped pieces**, **0 starter pieces**, and approximately **21.5 earned
  talent points**. On first entering E10: ~35.2 earned points; E20: ~49.1.
- Average first-room HP lost per attempt: E1 ~42%, E5 ~25%,
  E10 ~15%, E20 ~7%. These values include the gear that each account
  legitimately accumulated by that point.
- E19 Boss: 27 wins in 28 attempts; E20 Boss: **27 wins in 27 attempts**,
  with zero deaths in E20. This is a potentially significant endgame
  difficulty **under the tested policies**, not proof for all players.
- Risk exposure at E20: 24 encounters at risk **0**, 3 at risk **1**;
  **none at risk 2**. Controlled high-risk, all-Affinity and Boss-mechanic
  tests remain necessary.
- Enemy reference scaling in `combat/expedition-progression.js` becomes
  logarithmic after E5, while earned talents and equipment continue growing.
  This is a **candidate explanation** for relative endgame weakness, not yet
  an isolated causal finding.

## Harness issue found and fixed

The first E1–E20 attempt stopped 30 trajectories because native Expedition
entry was rejected when Camp inventory was not managed for long campaigns.
The runner formerly salvaged only obsolete grey drops; accumulated surplus
gear and overflow eventually prevented starting the next Expedition.

- Added native Stash salvage and claim-overflow management. This uses
  the same Camp transaction and Fragment prices as gameplay.
- Focused tests verified capacity release, actual Fragment accounting,
  overflow item recovery, and no free resources.
- Re-ran both cohorts. **The final 1,903-attempt campaign has zero
  simulator errors**. The earlier interrupted run must **not** be used
  for E20 win-rate conclusions.

## Balance implications and next independent checks

1. **Do not buff global Wanderer stats or nerf enemy damage** to fix
   E1. The cumulative XP/equipment strength eventually overtakes threat.
2. Retest E1–E3 progression difficulty only after confirming that the
   player-decision heuristics match real player behavior. Starter-only
   changes may be considered separately, not blindly applied.
3. Investigate enemy vs character scaling at E8, E15, E20 using equal
   native accounts and the actual first-room/Boss combats, particularly
   boss attack frequency, escorts, incoming DPS, regen and barrier.
4. Run controlled **risk 2** and per-Affinity Boss/Elite cases before
   adjusting difficulty or asserting all E20 modes are easy.
5. Preserve all raw per-account logs, artifact provenance and seed lists
   so changes can be regression-tested against the same accounts.

**Nothing was merged, deployed or numerically rebalanced in gameplay.**
