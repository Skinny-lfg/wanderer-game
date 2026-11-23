# Stage 6.41 — E10 anchor pilot: executed findings and decision

**Confirmed GitHub Actions run:** https://github.com/Skinny-lfg/wanderer-game/actions/runs/45249708322

Source fingerprint: `6a74d846dba32ec875e6db30ad3e486722f86e5390bf096cc0b96b7156b63a50`.

Status: **preflight + 16 cohorts + aggregate successful**. Report is a verified native *pilot*, not an approved balance patch. Branch: `balance/stage-6.40-e1-calibration`; no merge or deploy. Full machine-readable output is retained as workflow artifact `stage641-e10-consensus-pilot`.

## Readiness

- 8 of 16 E1-born accounts genuinely reached E10. Eight are censored: Hexblade Hybrid 2/2 stopped E1, Leather Duelist 2/2 stopped E1, Fury Bow 2/2 stopped E1, Magic Fire 1/2 stopped E4, Magic Lightning 1/2 stopped E4.
- **0 of 8 E10 checkpoints had actual AoE capacity** under the existing equipped-gear/earned-talent classifier. The direct controlled samples of Fire and Lightning also recorded **zero secondary-target damage**.
- Reached E10 with 15–23 talent nodes and 8–10 equipped items. Magic E10 builds showed Staff with 15 nodes and 8 equipped items. Reached accounts had mostly Uncommon/Rare gear, with some Common and one Epic.
- This proves E10 readiness is **not established for a balanced ST-versus-AoE sample**, despite 8 successful natural progressions. It does NOT prove AoE is mechanically impossible at E10; agent priorities/pathing and gear acquisition must be audited.

## E10 first-ring Risk 1 controlled matches

Each of eight genuine E10 Camp snapshots was tested twice at the same checkpoint against each native encounter. These 16 fights per row are repeated observations of only **eight characters**; they do not measure natural E10 Expedition completion rates.

| Normal group size | Player wins |
|---|---:|
| 1 | 16/16 |
| 2 | 16/16 |
| 3 | 16/16 |
| 4 | 14/16 |
| 5 | 16/16 |
| 8 | 15/16 |
| 12 | 16/16 |

**All 8 native Elite identities** were defeated in 16/16 matched attempts each: tank, berserker, vampire, caster, gravecaller, oathbound_exarch, briarspine_horror, ashen_executioner.

| Affinity Boss | E10 player wins |
|---|---:|
| Blood / Leech | 12/16 (75.0%) |
| Decay / Matriarch | 16/16 (100%) |
| Vitality / Devourer | 9/16 (56.3%) |
| Aegis / Guardian | 16/16 (100%) |
| Fury / Berserker | 16/16 (100%) |
| Magic / Conductor | 16/16 (100%) |

## Interpretation for the E10-first consensus

1. The surviving non-AoE E10 cohort wins almost every native first-ring fight, including all Elites and four Boss identities. This strongly suggests *these controlled encounters* are too easy for that subset, but the 16 fights per identity are not 16 independent players.
2. The more important immediate blocker is **absence of a genuine AoE E10 comparator**. Applying global enemy buffs now risks making AoE-targeted or fragile agents even less viable at E1–E4.
3. Audit why the dedicated Fire/Lightning agents have zero active AoE at E10 (no observed secondary-target damage) and why Fury Bow, Duelist, Hexblade repeatedly fail E1. Examine earned talent-node paths, equipment, target selection, retreats and failure causes; do not inject free gear/XP to manufacture E10 readiness.
4. Re-run a small **matched E10 specialization** study once legal AoE-capable players can reach E10. Reuse same characters/snapshots across group sizes; classify *actual* AoE separately from intended build.
5. Only then individually tune normal roles/groups, eight Elites and six Bosses around E10. Track player losses/abilities; prefer coarse consensus bands and fix large outliers.
6. Derive E1–E9 relief from a **smooth E10-anchored progression curve** and validate the E1→E2 transition and later E20/E35/E70/E200. Avoid sudden cuts or one-off enemy nerfs by Expedition.

**No further enemy buff or nerf approved or implemented as part of this E10 pilot.** Existing unvalidated Stage 6.40 candidate remains isolated.
