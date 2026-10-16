# v0.9.2 stress test — Phase 3 of 4

**Baseline:** development `b9da1c3`. This phase changes no gameplay, balance, dependencies, saves, Firebase data or `main`.

## Method and scope

Phase 3 audited the production progression paths (`winEncounter`, `extract`, `die`, Forge, salvage, dungeon unlocks and boss rewards) and reused the bounded Phase 1/2 evidence. The existing Node harness faithfully runs one expedition, but deliberately replaces extraction and death with terminal results. It does not maintain a player's inventory, spending policy, protected-item choices or recovery across expeditions. A longitudinal D1–D200 result from that harness would therefore be a synthetic economy rather than production behavior.

For that reason this phase did **not** build a second combat engine or publish unsupported P10/P50/P90 completion times. The defensible sample remains 200 production-combat trials and 5,000 production reward samples from Phase 2. Existing deterministic save tests cover one-shot extraction, D1–D200 unlock ordering and interrupted-run recovery, but they do not model human gear decisions.

## Production progression rules confirmed

- A dungeon has four normal waves and a fifth boss wave at multiples of ten.
- Only a completed run at the highest unlocked dungeon unlocks the next dungeon, up to D200. Farming an earlier dungeon never skips progression.
- Rewards remain inside the expedition until extraction. Calling extraction twice cannot grant the same reward twice.
- Death discards unextracted loot, Gold, Fragments and all equipped items except the two IDs protected at expedition start. Stash items, town currency and permanent runes remain safe.
- Closing during an expedition restores the last valid town save and discards unextracted rewards instead of resuming a partly completed reward state.
- Forge cost is `10 + 10 × tier` Fragments. Forge cannot roll Legendary and crafted salvage is capped at 25% of its recorded craft price.
- Wave gear-drop chances are 18%, 28%, 42%, 80% and 100%; bosses also receive a 35% extra gear roll. Bosses offer a permanent rune reward.

## Measured progression evidence

The Phase 2 reward study produced 3,152 equipment drops from 5,000 victories, including 94 Legendary items. Against an equal-tier Epic Sword/Shield Poison-3 reference, 276 drops (8.76%) raised Gear Power by more than 1%; only 127 (4.03%) also retained the reference weapon, shield and three Poison points. This is 2.54 conservative build-retaining candidates per 100 sampled wave victories. It is an item-level proxy, not the probability of a useful upgrade per expedition.

Equal-tier combat became faster at high levels for several representative builds. Sword changed from 19.94 seconds and 35.1% remaining HP at D10 to 13.32 seconds and 54.6% at D100. Mace/Shield changed from 24.59 seconds and 59.4% HP to 14.11 seconds and 74.7%. Enemy HP grows approximately linearly while player attributes, attack rate and affinity effects compound. This is evidence of late-tier relative easing at high investment, but it does not measure a fresh player's acquisition time.

Staff and Two-Handed showed a D50 bottleneck in the small screen: Staff won 5/8 and Two-Handed 6/8, while most comparison builds won 8/8. D10 catch-up worked (both won 8/8), and both recovered at D100 in this sample. Staff recorded zero Mana fallback attacks, pointing to tempo and incoming burst rather than Mana starvation.

## Time to D200

A measured D200 completion-time distribution is **not defensible with the current harness**. Production requires at least 199 successful highest-dungeon unlock expeditions from D1 to open D200, plus any farming, deaths and recovery. Real time depends on four-versus-five-wave duration, 1×/4× speed, extraction choices, inventory management and gear farming. The current evidence can provide combat time for isolated tiers, but multiplying those values across 200 levels would hide missing acquisition and death behavior behind assumptions.

No P10/P50/P90 figures are reported. Phase 4 browser work can measure interaction overhead, while a future progression study should add a small persistent policy layer around production state transitions and validate it against browser saves before estimating D200 time.

## Economy and bottlenecks

1. **Useful-upgrade scarcity for an established build.** Only 4.03% of sampled drops passed the conservative build-retaining proxy. Affinity and subtype requirements can make the practical farming burden much higher than the raw drop rate suggests.
2. **Midgame weapon volatility.** D50 Staff and Two-Handed results were materially weaker than their D10 and D100 screens. The sample is too small for a numeric balance patch, but it identifies D30–D60 and elite burst as the next targeted measurement.
3. **Late-tier relative easing.** At equal-tier Epic investment, player scaling outpaced enemy scaling between D10 and D100. This can shorten the back half for well-geared accounts and helps explain why some players reach D200 while others stall earlier.

Fragments earned versus spent, Forge success per player, equipment loss per death and Legendary drops per full trajectory were not measured faithfully. Reward-only samples cannot decide when a player crafts, salvages, protects or replaces an item.

## Exploit review

Existing deterministic tests cover one-shot extraction and ordered D1–D200 unlocking. Production also caps crafted-item salvage and gives recovery starter items zero salvage value. No duplicate-reward, progression-skip or infinite-currency exploit was demonstrated by the bounded Phase 1/2 work. Multi-tab cloud writes and live account conflict behavior remain outside the Node combat harness and require isolated browser/emulator validation; no live player save was used.

## Three recommendations — not implemented

1. Add a persistent progression policy adapter that calls production extraction, death, protection, equip, salvage and Forge transitions. Validate short D1–D10 traces against browser snapshots before extending beyond D50.
2. Run a narrow D30/D40/D50/D60 study for Staff and Two-Handed, split by elite, mixed tier and incomplete sets. Do not change global scaling until that bottleneck is separated from equipment quality and RNG.
3. Measure late progression with realistic under-tier equipment and acquisition histories. If relative easing remains after that control, adjust one late-tier scaling constant conservatively rather than reducing player build identity or imposing Gear Power scaling.

## Validation and stop condition

The report reconciles only previously bounded production results and audited state transitions. It introduces no simulator, balance number or gameplay edit. Phase 4 was not started, `main` was not modified, and no Firebase operation or player-save write occurred.
