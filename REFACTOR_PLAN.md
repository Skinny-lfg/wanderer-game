# Wanderer v0.13 refactor plan

Stages are local and sequential unless noted. Preserve baseline rounding and seeded decisions until a deliberate design change is approved.

| Priority | Stage and dependency | Risk | Acceptance |
|---|---|---|---|
| P0 | Record the actual simulator module graph, harness and scenario options in fingerprints; independent | Low | Editing a loaded harness or rule changes fingerprint. Report distinguishes controlled equipment, targeting and real route. |
| P0 | Build deterministic comparison fixtures before relocating formulas; after fingerprint | Medium | Same actors, RNG, controls and elapsed time yield matching target, HP, barrier, status, cooldown, reserve, outcome and reward. Separate browser clock test. |
| P1 | Replace legacy profile conversion with a fresh current-schema constructor before deleting migration/history paths | High | Synthetic new account, local/cloud isolation, checkpoint reload, reset and duplicate award rejection pass; old saves may be rejected. |
| P1 | Remove unreachable guard, old forge branch and no-op legendary hooks after validating dynamic exports and preview generators | Low | Supported entrypoints load; active legendary triggers and current forge retain behavior. |
| P1 | Make encounter assembly explicit in current order (base role, group budget, risk/endurance, boss preparation, trait, escorts, condition, ability attachment); depends on parity fixtures | High | Compare intermediate and final actors at counts 1,3,6,12,18,22, including rounding and reserve. Preserve six affinity identities, manual targeting and escort exceptions. |
| P2 | Use the existing totalStats pipeline for UI and simulator, share affinity-resource calculation, retain both family flags | Medium | Check two-hand/offhand, physical Magic/Decay, combined affinities, rune uniqueness/boost and capped speed against snapshots. |
| P2 | Trace remaining economy and UI readers before deleting historical fields and v0.12 simulator tools | Medium | Fresh crafting, potion, reward and reload paths covered; CI, deployment copies and diagnostic entrypoints accounted for. |

Design review before numerical changes: confirm the Boss .65 attack factor, Elite Tank exception, node-2 Vanguard and separate escort budget. Assess encounter threat using representative bounded samples only after structural parity passes; adjust values in a separate change.

## Prioritized decision list (supersedes stage order where prerequisites overlap)

1. **Proven corrections without intentional gameplay change.** Fix potion inspect rarity, feedback version, Guardian/Convergence text, reward snapshot appearance and simulator provenance. Use the existing potion catalog, appearance resolver and actual loaded module list. Low risk apart from validating reward snapshots after selling/discarding. Accept when identical items/potions retain identity across surfaces and changing the harness changes the report fingerprint.
2. **Structural simplifications.** Share stash occupancy first, then target switching and simulation elapsed time. Reuse current rules for equipment art, rune values, talent requirements and recipe price. Consolidate Magic/Decay resource initialization and remove empty hooks after checking dynamic ports. Isolate fresh-save construction before removing compatibility. Accept with boundary inventory cases, unchanged manual target clocks and fresh-save restore. Preserve independent regression expectations.
3. **Changes with possible balance effects.** Reordering encounter modifiers, changing rounded intermediate stats, sharing damage paths across barrier/DoT/direct effects or applying normal scaling to escorts can change outcomes. Preserve order first. Require controlled parity fixtures before changing any coefficient; measure balance separately.
4. **Design approval required.** Boss attack factor, Elite Tank threat, fixed node-2 Vanguard and escort budget are separate decisions. Decide whether minion passives warrant persistent HUD badges, distinct from correcting inaccurate ability copy. Approval is required for changing mechanics, not for describing current ones accurately.
