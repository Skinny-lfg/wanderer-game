# Stage 6.37 — full E1-born native calibration execution

The 8 Elite base coefficients have been modified at E1 in the single live `ELITE_ARCHETYPES` table; the common `enemyReference(E)` remains unchanged for E1–E200. The conditional normal-principal relief is triggered only in normal 5+ rooms with Minions, and counts all Minions including reserves.

## Required validation

- Full native tests E1/E5/E70/E200 of Minion-invariant actors, and eight Elite identities with fixed bases across E.
- Complete `npm test`, plus one legal E1-born smoke without forged resources or unlocks.
- **Exactly 100 legal profiles × 5 independent seeds = 500 E1-born native accounts** for E1–E5, source fingerprint identical across all 100 shards. Compare:
  - Normal solo, 2–4, and 5+ group victories;
  - Named Elite victory rate at E1, E2, E3, E4, E5;
  - Overall Elite and Boss results per E and Realm;
  - Reached E2 and E5 accounts.
- Report failed/censored/optional encounter samples rather than inventing E values, target achieved status, or all-build victory.

## Expectations, not asserted outcomes

Historical Stage6.34: E1 normal 66.9%, normal solo 96.2%, groups 2–4 24.1%, groups 5+ 0%, Elite 76.9%, Boss 37.1%; E5 Elite 100%, Boss 97.9%. E1 target: normals 80–90%, Elite 60–70%, Boss 35–45% in typical progressions.

The Stage6.37 first-pass Elite HP/ATK changes are provisional until these real results are examined. A 500-account sample may still be insufficient to precisely fit all 8 Elites across all Realms.

**No gameplay merge, production deploy or gear changes.**

[run-stage637-full]
