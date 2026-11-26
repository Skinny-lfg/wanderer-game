# Anchor Realms — A1 campaign foundation
Source: consolidated playtest 4e83f4b; packaging commit 3aa617c.
Design reference: [Lore Bible sections 21–23, 28, 33–34](https://docs.google.com/document/d/1BgU51XFK7LFyM22nZAGJAabOiDNHmuX6G_VG9wtt2nc/edit).
Art: placeholders only. No new asset production.

## Implemented as isolated pure module
- Six approved sets and 18 distinct physical Runestone Shard identities. Radiance uses the previous approved names as explicit temporary labels pending editorial replacement.
- Serializable campaign state and validation; no save integration yet.
- Accept distinct secured pieces; no duplicate grants; Shrine assembly transaction opens the persistent portal, with the three shards represented by the opened state.
- One active attempt with unique monotonic token; defeat retains the portal. First victory alone advances unfinished Anchor difficulty step (0–5). Six conquests unlock the seventh Realm flag.
- Conquered portals cannot be started in this isolated prototype; repeatability remains a design decision. No gameplay retry cost imposed.

## Still undecided and intentionally unwired
- Actual loot/drop rates, pity, extraction/death retention, Bag/Stash capacity and transfer policy, save integration, UI, portal travel, progression coefficient, Boss encounters, seventh Realm encounter, and rewards.
- 1% / 15% / 35%, pity at fifth Boss and one shard per Expedition are test hypotheses, not live rules. E60 is the target to unlock six portals, not defeat them.
- No changes to normal Expeditions, wallet Fragments, equippable Runes, RNG, balancing, existing saves, or production.
- Proposed next: A2 drop/Bag/settlement design; A3 Shrine portal UX using simple placeholders; A4 first playable Anchor with unique mechanics. Test first Blood prototype before expanding.
