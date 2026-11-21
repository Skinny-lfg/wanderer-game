# Wanderer v0.13 — Stage 6.17: isolating the four-to-six mob inversion

## Scope and pre-registered objective

Stage 6.16 observed **98 median player damage** against four native mobs versus **22** against six, even though the player won 375/384 four-mob fights versus 384/384 six-mob fights. Two **separate native** design choices might contribute:

1. **Composition:** the Stage 8 roster sharply decreases the number of principal Tank/Skirmisher/Caster roles at six mobs, filling most slots with weaker Minions.
2. **Scaling:** `v013-enemy-roster.js/scaleFor` uses different, generally reduced, individual mob stats when `count>=6` compared with `count<=4`.

The target is **not** to make all normal rooms 60–70% win rate. That provisional benchmark was for Elites. The Stage 6.17 question is whether increasing the number of mobs can stop **reducing** difficulty, without making early E5 rooms unfair.

## Controlled five-arm study

Each hero, native seed, Realm, Condition, legal v15 Talents, Rare equipment roll, Risk 1, start HP/MP, focus target policy and combat engine is matched.

| Arm | Enemy count | Only change |
|---|---:|---|
| `four_native` | 4 | None; original game |
| `six_native` | 6 | None; original game |
| `six_three_principals` | 6 | Exactly three native principal roles and three Minions; existing 6+ scaling preserved |
| `six_small_group_scaling` | 6 | Existing six-mob composition; **individual mob scaleFor** follows the existing 2–4 scaling branch |
| `six_both` | 6 | Both experimental rules to check interaction; **not** an isolated single-rule claim |

The experimental changes exist **only in the in-memory roster module passed into the isolated native test VM**. The real encounter and combat logic, item rolls, native enemy abilities, attack cadence, player policy and other modules are not patched. The variant's module source hash is included in the output. The actual game's `online/v013-enemy-roster.js` is not modified.

## Sample and execution gates

- Pilot: six Realms × four synthetic legal point budgets (12/E5, 24/E15, 36/E35, 60/E70) × two strategic profiles × two independent seeded starts = **96 matched five-way hero sets / 480 real native combat executions**.
- Full: same matrix with four seed starts = **192 matched five-way hero sets / 960 native combat executions**.
- The pilot is a **subset of the full**; never add 480 and 960 as independent evidence.
- Check strict parity of native gear fingerprint, starting HP/max HP, TalentGraph+element, seed/resolved seed, Realm/risk and Condition, and exact 4/6 enemy counts. Validate the three-principal arms actually spawn three non-Minion principal roles.
- Record wins/losses, *median player damage*, battle duration, actual principal/Minion counts and total starting enemy HP/attack by arm and E tier; also paired damage/win flips and per-Realm splits.
- Do not interpret E15/E35/E70 ceilings of near-100% victory as proof of equal difficulty. Damage/role mix and E5 survival matter more.

## Decision rule

**Proceed to a targeted implementation next** if a single isolated rule removes the counterintuitive 4-to-6 difficulty drop without producing excessive E5 deaths. Prefer the smallest role-composition correction over universal HP/ATK bonuses. Otherwise document that composition alone is insufficient, and evaluate the isolated scaling result before considering their combination.

Before live gameplay changes: test the winning rule again for groups 4, 6, 8, 12 and 20 with real native roles and a low-level naturally earned progression sample. Never deploy directly or merge to production `main` based on synthetic accounts.

## Status

Design and automated runner are committed to a scoped feature branch for native CI testing. **No Stage 6.17 victory rates are asserted by this document prior to a successful run.** Game balance, Elite/Boss abilities, Talents, art, saves, Firebase and production remain untouched.
