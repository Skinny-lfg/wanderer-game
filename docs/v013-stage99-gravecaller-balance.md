# Wanderer v0.13 — Stage 9.9 Gravecaller threat calibration

## Why this is separate

Stage 9.8 found **30/30 controlled Starter wins against Gravecaller**, versus
2/30 Rotbound Exarch and 0/30 Vampire. The user explicitly wants to **raise
the weaker Elites to a comparable threat first**, before a later global
difficulty reduction. Do not globally nerf Elites/Bosses or make E1 easier
in this stage.

## Live changes (only Gravecaller)

- Call of the Fallen is a **1.0 combat-second interruptible ritual**. The
  Gravecaller starts the first ritual on reaching **85% HP** and the second
  after reaching **40% HP**.
- Each ritual summons up to two real native Realm Minions. Hard caps:
  **4 summoned over its lifetime; 2 alive at once**. The second ritual
  waits until a living slot opens; a stopped ritual retries after 3s.
  Stun or attack delay interrupts the cast without consuming the wave.
- Summoned Minion HP factor: **0.42 → 0.50**; attack factor:
  **0.25 → 0.35**; attack interval: **1.35 → 1.20**
  versus its normal archetype.
- While at least one Gravecaller summon is alive (including reserve), the
  Gravecaller receives **10% less incoming damage**. This factor applies
  to normal attacks, direct on-hit effects, multi-target attacks and native
  periodic damage; disappears when all summoned undead die.
- Existing combat log, ability status and native link effect announce the
  casting and arrival. Descriptions match the actual two-wave mechanics.

No normal Enemy, Tank, other Elite, Boss, loot or account progression
multipliers are changed. Its native attack and HP remain unchanged.

## Verification

- Stage 8.2 focused tests exercise thresholds, 1s warning, interrupt, retry,
  reserve/live minion protection and native summon infrastructure caps.
- All existing Stage 8.2 Exarch and Executioner tests remain in the suite.
- The native Stage 9.8 runner accepts a targeted
  \`--elite-type=gravecaller\` filter **without forcing a specific Elite**.
  It inspects seeded native encounters and only simulates matches where
  the genuine random Elite subtype is Gravecaller and the native normal
  reference is a real Tank.
- Pull request CI compares **30 matched seeds in Starter and 30 in Common**
  with the same seed-start and selection procedure as Stage 9.8:

~~~bash
npm run diagnose:v013:stage98 -- \
  --mode=elites --elite-type=gravecaller --gear=starter \
  --target=30 --scan=3600 --seed-start=16001 \
  --out=reports/stage99-gravecaller-starter.json
~~~

Do not interpret an increased difficulty in this one controlled encounter as
an improvement in natural E1–E8 completion. A future checkpoint should test
the *entire* corrected Elite hierarchy together with earned-account progress.
