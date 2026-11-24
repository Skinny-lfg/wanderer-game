# Stage 6.47D.8 — Decay integration

Gameplay commit a5ce44567fbee3c5b969a5d1fd06e9ce5483e64c. Same balance branch only; no merge or deploy. Graph remains 419 nodes; 16 pending nodes (eight Magic abilities and eight gates).

## Provisional implementation
- Contagious Touch (6 points): each third successful primary paid Toxic Touch application copies the latest stack to up to two living active enemies with room under native Rot cap, at half damage (native integer rounding, minimum one) and at most three ticks. Global 4s cooldown; counter saturates until an eligible application with a recipient. No reserve targets, no recursive applications.
- Corruption Nova (7): at six-second encounter intervals, choose the active enemy with highest total original paid Rot tick damage. One pulse of 75% that sum to source and up to two other living active enemies. Raw per-target caps: 6% normal, 2% elite, 1% boss max HP; existing direct modifiers and Barrier still apply. No stack consumption, no additional procs. No pulse when no qualifying source.
- Soul Drain (7): every four successful paid primary Toxic Touch applications refund up to 2 Mana, global 5s cooldown. Counter saturates until eligible. Actual refund recorded, no secondary/free/propagated credit. Counters reset per encounter.
- Explicit primaryPaid provenance applied only on successful paid primary Toxic Touch. Free Gravewake, Grave Bloom seeds and secondary weapon Rot do not receive this tag; spread copies never gain it. Legacy spore-mark copy explicitly clears it and marks transferred. Existing mixed burst formula remains unchanged.
- Provisional guardrail: Contagious Touch and Corruption Nova inactive with owned Carrion Detonation or prepared Grave Bloom. Soul Drain remains available. Tooltip explains it. This is a design choice for testing, not proof of balance; assess dead investment/alternative routes and mixed builds before finalizing.
- Blight/Virulent Rot position and values unchanged pending comparison. Corruption Cycle keeps 4 Mana/5s, consumes one oldest stack at three or more, damage = remaining stack damage +20% SP; fix cooldown order on failed payment, exclude dead target. Native telemetry now reports consumed raw Rot, paid Mana, burst and actual HP damage. Oldest-stack selection remains unchanged.
- Native simulation rows export decayTalentMetrics. No new matched E10 win-rate claims.

## Validation
CI run 45396486176 triggered; inspect final jobs before claiming validation. Targeted contract fixtures use actual buildcraft and combat resolver with injected ports. Full npm test and architecture regression run separately. No new browser capture or matched E10 comparison in this stage.
