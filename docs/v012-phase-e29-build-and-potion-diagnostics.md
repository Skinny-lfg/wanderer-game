# Wanderer v0.12 — E.2.9 Initial builds and Apothecary diagnostics

**PASS técnico — 450 simulações, 0 erros/timeouts. As conclusões anteriores sobre os kits completos não são isoladas pela E.2.8.**
Run: https://github.com/Skinny-lfg/wanderer-game/actions/runs/39674828225

## Metodologia
Repetiu-se a matriz E.2.8 de cinco builds, três políticas de poções, três agentes por combinação e dez tentativas por agente (450 runs). Nova telemetria regista atributos iniciais, subtipo e armaduras, planos de poções, seleção real, faltas e utilizações reconhecidas pela API. Sem alterar mecânicas de produção.

| Build | Power inicial (3 seeds) | Attack | Defense | SpellPower | Evasion Rating | Block Chance |
| --- | --- | --- | --- | --- | --- | --- |
| Archer | 7540–7558 | 1108–1110 | 1106–1110 | 0 | 1809–1817 | 0 |
| Mage | 8510–8532 | 526–528 | 1100–1104 | 1304–1308 | 0 | 0 |
| Battlemage | 8961–8994 | 570–572 | 1100–1109 | 1505–1507 | 0 | 0 |
| Tank | 10335–10366 | 1381–1387 | 1592–1601 | 0 | 0 | 48 |
| Assassin | 7514–7551 | 1081–1083 | 1106–1115 | 0 | 1810–1819 | 0 |

All five armor pieces have the intended Cloth, Leather or Plate category; the two-handed Bow/Staff have no Off-Hand, Battlemage has Orb, Tank has Shield, Assassin has Off-Hand Dagger. The raw aggregate Power score **must not** be considered equal combat effectiveness; abilities, affinities, damage pacing, and survival may dominate.

## Actual potion selection (30 runs per combination)
| Build | Adapted: full kits | Adapted: empty | Fortune: full kits | Fortune actually selected |
| --- | ---: | ---: | ---: | ---: |
| Archer | 3 | 4 | 1 | 11 |
| Mage | 1 | 1 | 1 | 9 |
| Battlemage | 0 | 3 | 3 | 8 |
| Tank | 2 | 18 | 1 | 9 |
| Assassin | 0 | 2 | 1 | 8 |

Mage adapted: Arcane selected 4 times and used 4; Mana selected 29 times but **zero uses**, Barrier selected/used 6 times. Battlemage adapted: Arcane selected/used 5, Mana selected 27 times and zero uses, Barrier selected/used 3. Under current simulation policy, Mana is only attempted between Realms when MP fraction < 60%, explaining lack of attempted use *if* that threshold is never met; must verify exact MP snapshots. Fortune is consumed automatically on entry and is **excluded** from `potionsUsed` counters.

Archer adapted: selected Health 26, Barrier 10, Ironhide 7. Tank adapted: selected Barrier 5, Ironhide 6, Health 12; full kit only 2/30, empty 18/30. Assassin adapted: Might 1, Haste 5, Health 28; full kit 0/30.

## Interpretation
The dominant observed issue is **the simulated procurement policy, not an established defect in combat mechanics**. The agent only refreshes a limited set of times, requires affordability, and may start with partial/no kits, preventing a fair head-to-head test of exact three-potion kits. Results also lack strictly normalized combat effectiveness across builds. Tank has the highest initial aggregate power and still underperformed in E.2.8; not sufficient to infer armor or shields are faulty. The Assassin performed much better despite raw Power near Archer; this is a reason to inspect actual combat performance, not nerf without causal tests.

## Next step (E.3 or E.2.10)
Run controlled exact-kit comparisons with preloaded inventory (separate from economy tests), log MP/HP in each between-Realm decision and direct damage/mitigation telemetry; compare Tank/Assassin and Mage/Battlemage with normalised combat seeds and relevant affinity/talent combinations. Then use E.2.7 for real economic feasibility. No production adjustment until confidence improves.
