# Stage 6.39 — Solo normals, earned AoE and 14 individually reviewed Elite/Boss identities

## Status

**PROVISIONAL native candidate.** Gameplay source changed on a new draft branch based on Stage6.38. No merge/deploy. Previous Stage6.38 [full 500-account native run](https://github.com/Skinny-lfg/wanderer-game/actions/runs/45210902220) is the before-change baseline. The 500 fresh accounts and actual E1 Boss identities require an independent Stage6.39 census.

## 1. Solo normal mobs

Stage6.38 E1: solo 4,121/4,287 (96.1% player wins), normal 2–4 978/2,267 (43.1%), normal 5+ 82/599 (13.7%). Applying the same base buff to all normal enemies would worsen the latter two groups.

**Only one NORMAL principal enemy in a room** receives an isolation strength modifier after Risk pressure:
- Tank: HP ×1.28, Attack ×1.15
- Skirmisher: HP ×1.36, Attack ×1.20
- Caster: HP ×1.34, Attack ×1.18

No buff for Minions, groups 2–4 or 5+, Elites, Bosses, summons. No new E-specific scaling; Stage6.38 single smooth function still defines all Expedition progression.

## 2. Actual AoE test, not just character names

Native combat instrumentation records actual SECONDARY TARGET HP damage and the number of secondary targets hit, independently of existing total damage. The legal natural-account runner also records:
- Equipment subtype at the encounter, offhand and element;
- Real earned AoE-related Talent nodes, and whether they enable an AoE-capable attack;
- Total initial Minions and principals including reserves, actual 5+ group size;
- Observed non-focused HP lost (wider but non-source-attributed evidence), damage taken and combat duration.

**Two-Handed** and **Bow** have innate secondary hits. **Daggers/Fan of Blades**, **Mace/Shockwave**, **Sword+Shield/Sweep**, **Lightning Chain**, **Fire Spread** and **Plague Spread** depend on actual earned talents. Some prepared abilities and AoE damage-over-time are *not* captured by the direct secondary-hit metric; non-focused HP loss is complementary, not a complete source attribution.

An AoE-capable group victory and an ST group loss cannot by themselves prove causation: different characters have different gear, Talents, XP, time, target decisions and rooms. Quantify AoE-capable vs no AoE sample sizes before interpreting.

## 3. Eight Elite E1 identity bases — individually assessed

Stage6.38 native 500 E1-born account results and provisional candidate base changes:

| Elite | E1 before player wins | HP prior → candidate | ATK prior → candidate | DEF prior → candidate |
|---|---:|---:|---:|---:|
| Gravebound Bulwark | 31/104 (29.8%) | 1.88 → 1.52 | 0.76 → 0.65 | 1.26 → 1.19 |
| Bloodscar Ravager | 126/163 (77.3%) | 0.80 → 0.89 | 1.30 → 1.37 | 0.88 → 0.90 |
| Sanguine Wraith | 199/266 (74.8%) | 1.12 → 1.19 | 1.10 → 1.16 | 1.03 → 1.04 |
| Voidborne Hexer | 119/198 (60.1%) | unchanged 1.02 | unchanged 1.03 | unchanged 0.92 |
| Gravecaller | 80/155 (51.6%) | 1.12 → 1.04 | 0.82 → 0.76 | 0.88 → 0.86 |
| Oathbound Exarch | 126/161 (78.3%) | 1.36 → 1.50 | 0.77 → 0.87 | 1.15 → 1.18 |
| Briarspine Horror | 178/245 (72.7%) | 1.33 → 1.39 | 0.95 → 1.01 | 1.03 → 1.04 |
| Ashen Executioner | 55/96 (57.3%) | 1.18 → 1.16 | 1.22 → 1.20 | unchanged 0.93 |

This is a **moderate starting hypothesis** to bring named Elite E1 victory rates toward 60–70%; it is NOT a mathematical calibration of each identity's exact win probabilities. Unique abilities, cooldowns, summon skills and global continuous curve remain unchanged.

## 4. Six Boss E1 bases — individually assessed

Stage6.38 observed Boss player victory by the **player's primary profile family**, which is not guaranteed to equal the actual Boss style. Use this only as provisional guidance; the Stage6.39 census records the **actual Boss style** for every fight.

| Boss actual style | Primary-profile E1 Boss proxy | HP prior → candidate | ATK prior → candidate |
|---|---:|---:|---:|
| Rift Harbinger / leech | Blood 80/168 (47.6%) | 1.26 → 1.31 | 1.56 → 1.62 |
| Carrion Matriarch / matriarch | Decay 14/37 (37.8%) | unchanged 1.22 | unchanged 1.54 |
| Heartroot Devourer / devourer | Vitality 21/38 (55.3%) | 1.68 → 1.85 | 1.80 → 1.91 |
| Abyssal Guardian / guardian | Aegis 23/41 (56.1%) | 1.42 → 1.58 | 1.64 → 1.75 |
| Ember Sovereign / berserker | Fury 24/123 (19.5%) | 1.64 → 1.43 | 1.78 → 1.58 |
| Stormglass Conductor / conductor | Magic 79/250 (31.6%) | 1.44 → 1.38 | 1.64 → 1.59 |

Defense remains at native 2 for all six. Named mechanics (summons, ward, healing, charged attacks) are untouched pending per-Boss actually observed win-rate and encounter evidence. A Boss's difficulty is not fully summarized by HP/ATK.

## Validation gates

1. `npm test` complete, native solo identity tests E1/E5/E10, 8 named Elite bases and 6 Boss bases, no per-E patches, Pages mirror/hash identity.
2. Repeat **exactly 100 legal profiles ×5 seeds = 500 real E1-born accounts** E1–E5 with genuine equipment, XP, no forced success/unlocks. Report named Boss (actual style) and Elite win rates per E; AoE-capable vs no-AoE normal groups 2–4 and 5+ with denominators, direct secondary-target damage, weapon and initial group makeup.
3. **Acceptance target**, not assertion: normal encounters 80–90% for representative progression; Elites 60–70%, Bosses 35–45%, recognizing that solo normals can be easier than 5+ hordes. Check E2/E5 reach and per-class balance.
4. Do not claim all character builds are equivalently viable: only agents who legitimately reach an E enter that E's denominator. AoE and ST groups are *observational*, not paired causal interventions.
5. Compare later E5–E12 with naturally earned checkpoints before claiming durable balance or changing the single shared 3-regime curve.

**No merge, deployment, equipment tier changes, talent changes, or save migration.**
