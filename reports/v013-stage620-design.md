# Wanderer v0.13 — Stage 6.20: Boss preparation and individual balance decision

## Context

The Stage 6.16 native controlled first-ring, **unprepared** Boss encounters produced uneven player victories: Carrion Matriarch 17.2%, Rift Harbinger 18.8%, Abyssal Guardian 23.4%, Stormglass Conductor 28.1%, Ember Sovereign 32.8%, Heartroot Devourer 42.2%. These results are not natural Boss-fight outcomes. Stage 6.19 has independently raised Elite difficulty after E5, so the Boss-vs-Elite challenge hierarchy deserves a fresh, correctly prepared evaluation rather than broad Boss HP/Attack nerfs.

## Existing legal preparation, verified in actual game code

At **Dangerous Risk 1**, the player's optional native choices are:
- Defeat the **marked Elite**, reducing final Boss escorts by one; does not reduce Boss Attack at Dangerous risk (the -10% Boss Attack benefit applies only at Guarded risk 0).
- Reach the **Forgotten Reliquary** and spend **15% of maximum hero HP** to disable **one known Boss modifier**, selected in the immutable encounter manifest.
- Do both, or do neither. They must be applied through native decision-ledger effects, not fabricated per-Boss damage percentages. Optional Reliquary can instead recover player health/mana, which the study does not model; this is a meaningful opportunity cost.
- Boss abilities and summon cadence remain active in all arms. Bosses can gain escorts from native modifiers; never assume Reliquary changes only defense.

## Controlled native study

Use six canonical Affinity Bosses, **four preparation strategies** (`baseline`, `marked_elite`, `reliquary`, `both`), and **two real player target policies** (`focus`, `mechanics`). Each matched hero has same seeded native Rare rolled equipment, legal v15 TalentGraph nodes/attunement, boss type/Realm, Risk 1, Condition and level. Reliquary differs deliberately in starting HP because it pays the actual sacrifice.

- Pilot: 6 Realms × 4 legal synthetic point budgets E5/12, E15/24, E35/36, E70/60 × 2 strategic builds × 2 targeting policies × 1 independent seed = **96 matched 4-arm hero configurations / 384 genuine native Boss fights**.
- Full: same study, 2 seeded starts = **192 matched hero configurations / 768 native Boss fights**. Pilot is subset, not independent evidence.
- Record per-Boss, per-level, per-target-policy win rate, damage received, Boss attacks, active modifiers, escorts, Boss summons, heals, wards, Convergence discharges, elapsed combat and the HP sacrificed.
- Validate all native identity, per-variant gear, seed and starting HP conditions, one true modifier removed and the actual cost paid, without pretending the four arms start with identical HP.
- **Scope caveat:** A final Boss is **staged in a controlled first-ring room** after applying native legal preparation *effects* through the expedition decision ledger. We have NOT claimed the character naturally cleared the Elite, found the Reliquary, traveled all 15 rooms, collected the resulting loot, or used naturally earned potion stocks. This trial isolates the preparation mechanics, not a real playthrough.

## Implementation decision gate

1. Compare what preparation actually changes per Boss before modifying base attributes or special abilities.
2. Prefer narrowly scoped six-Boss-specific changes; consider removing unwinnable spikes while retaining the hierarchy Boss > Elite > normal mobs. The design target for well-prepared Boss wins (~35–50%) is provisional and should not be applied blindly to E5 synthetic fixtures.
3. If Bosses remain far below target after both preparations, characterize whether extra escorts, Boss properties, minions or Boss ability cadence is the true issue. Do **not** globally nerf everything or buff player stats to solve this.
4. Keep future natural earned-account travel/potion/boon studies distinct. E1–E2 progression remains a known bottleneck.
5. Integrate code only after successful native tests and result review into `audit/v013-stage6`; never deploy `main` here.

## Status

Diagnostic-native comparison runner and CI prepared on a dedicated branch. No Boss ability, HP, ATK, loot, Talents, Realm art, or production gameplay changes have yet been justified by Stage 6.20 evidence.
