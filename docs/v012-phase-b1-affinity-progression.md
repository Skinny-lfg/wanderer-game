# Wanderer v0.12 — Fase B.1: progressão de affinities

Data: 2026-10-21  |  Branch: `development`  |  Base: `06b924e`

## Implementação

O controlador aceita `planAffinities([inicial, segunda, terceira])` no Camp. Exige três affinities distintas; a primeira tem de ser escolhida como inicial. Um plano oferece a segunda desde Realm 2 (até Realm 4) e a terceira desde Realm 3 (até Realm 7). O controlador regista a oportunidade quando a oferta é gerada. Escolher outra Realm ou rejeitar/rerollar continua permitido. Uma affinity só é adquirida quando a rota correspondente é efetivamente iniciada; o limite continua em três.

Sem plano, as ofertas, pity e híbridos mantêm as regras anteriores. O plano não concede ranks, passivos ou affinities grátis, não altera rerolls, custos, recompensas ou fórmulas de combate. Saves antigos sem os campos opcionais são restaurados como `affinityPlan: null`; checkpoints ativos preservam o plano e as oportunidades já apresentadas.

### Integração visual pendente

A seleção visual ainda não foi ligada ao Camp. O `index.html` e CSS da interface têm alterações UX locais não relacionadas nesta worktree; por isso, a alteração B.1 fica no controlador, coberta por testes, com `planAffinities` disponível para a futura interface. A integração visual precisa de uma edição separada quando essas alterações forem consolidadas.

## RNG de teste e método

O harness adiciona streams seeded independentes para rotas, drafts, escolhas não-combate e ticks de combate. As mesmas seeds de rota/draft/política são usadas em cada par current/planned, e a seed de combate também é pareada. O modo é ativado apenas pelo harness; o RNG de produção mantém a função e o caminho existentes por omissão.

Foram executadas **1792 simulações**, sem erros nem timeouts: 7 builds × 4 níveis × 16 seeds × 2 políticas atuais (triple, random) × 2 sistemas. Todas as builds são Epic, com Runas equivalentes, sem poções, eventos escolhidos, upgrades de equipamento ou os novos Legendaries. As seeds são emparelhadas por build/nível/política. Cada célula seguinte agrega 32 corridas (16 por política).

As configurações de affinities usadas foram Staff/Wand: Magic → Fury → Aegis; Sword/Two-Handed: Blood → Decay → Magic; Mace: Aegis → Vitality → Fury; Daggers/Bow: Fury → Magic → Blood. A escolha do plano é a única diferença experimental; armadura e arma seguem as sete builds listadas. DPS, cura e sobrevivência são medidas no runtime real; o budget observado é Max HP + cura efetiva + Barrier absorvida e não inclui dano evitado.

## Resultados pareados

`Rota atual → Planeada`; vitórias são `/32`, Realm média, DPS e cura são médias por corrida. O budget de sobrevivência é uma medida observada do pool de HP/cura/Barrier, não EHP teórico.

| E | Build | Vitórias | Realm média | DPS | Cura/s | Budget sobrevivência |
|:--:|:--|--:|--:|--:|--:|--:|
| 10 | Cloth Staff | 5 → 8 | 13.06 → 13.06 | 170.8 → 171.0 | 0.10 → 0.10 | 530 → 530 |
| 10 | Cloth Wand + Orb | 7 → 9 | 12.59 → 13.25 | 156.1 → 159.4 | 0.20 → 0.15 | 538 → 544 |
| 10 | Plate Sword + Shield | 1 → 2 | 12.81 → 13.22 | 115.9 → 114.1 | 0.48 → 0.42 | 601 → 609 |
| 10 | Plate Mace + Shield | 5 → 4 | 11.59 → 11.97 | 95.6 → 95.8 | 1.23 → 1.56 | 784 → 814 |
| 10 | Leather Dual Daggers | 10 → 12 | 14.50 → 14.72 | 179.0 → 177.9 | 0.19 → 0.40 | 466 → 471 |
| 10 | Leather Bow | 6 → 7 | 13.88 → 13.66 | 181.3 → 180.5 | 0.69 → 0.40 | 497 → 477 |
| 10 | Leather Two-Handed | 1 → 5 | 13.81 → 14.38 | 156.9 → 155.9 | 0.49 → 0.50 | 537 → 531 |
| 50 | Cloth Staff | 2 → 0 | 9.16 → 9.19 | 669.4 → 682.3 | 0.72 → 0.16 | 1779 → 1725 |
| 50 | Cloth Wand + Orb | 0 → 0 | 6.09 → 6.38 | 558.1 → 572.6 | 0.35 → 0.29 | 1680 → 1658 |
| 50 | Plate Sword + Shield | 0 → 0 | 7.69 → 8.13 | 437.2 → 438.4 | 1.11 → 0.30 | 2055 → 1978 |
| 50 | Plate Mace + Shield | 1 → 0 | 9.25 → 8.34 | 376.4 → 372.5 | 3.40 → 2.84 | 2635 → 2545 |
| 50 | Leather Dual Daggers | 1 → 2 | 12.88 → 13.16 | 812.3 → 815.1 | 1.19 → 0.86 | 1584 → 1550 |
| 50 | Leather Bow | 16 → 15 | 14.22 → 14.66 | 954.6 → 950.1 | 1.73 → 1.38 | 1638 → 1593 |
| 50 | Leather Two-Handed | 4 → 4 | 13.47 → 12.28 | 775.3 → 768.4 | 2.17 → 0.98 | 1800 → 1728 |
| 100 | Cloth Staff | 7 → 14 | 10.00 → 11.72 | 1571.5 → 1681.8 | 0.38 → 0.55 | 3273 → 3289 |
| 100 | Cloth Wand + Orb | 4 → 5 | 8.88 → 10.47 | 1419.7 → 1458.8 | 0.38 → 0.54 | 3165 → 3187 |
| 100 | Plate Sword + Shield | 0 → 0 | 9.63 → 10.78 | 930.2 → 947.2 | 2.15 → 3.16 | 3878 → 3976 |
| 100 | Plate Mace + Shield | 5 → 4 | 12.97 → 13.03 | 948.0 → 954.5 | 8.98 → 11.21 | 5207 → 5312 |
| 100 | Leather Dual Daggers | 2 → 4 | 13.22 → 13.78 | 1586.8 → 1593.3 | 6.86 → 4.30 | 3246 → 2998 |
| 100 | Leather Bow | 17 → 19 | 15.00 → 14.97 | 1991.6 → 1965.0 | 2.06 → 3.17 | 2934 → 2975 |
| 100 | Leather Two-Handed | 5 → 6 | 14.34 → 13.81 | 1597.0 → 1593.6 | 3.78 → 1.35 | 3290 → 3219 |
| 200 | Cloth Staff | 19 → 18 | 13.97 → 13.59 | 3668.5 → 3720.5 | 8.85 → 5.20 | 6659 → 6436 |
| 200 | Cloth Wand + Orb | 8 → 11 | 11.22 → 11.97 | 3372.1 → 3384.7 | 2.32 → 2.22 | 6249 → 6306 |
| 200 | Plate Sword + Shield | 0 → 2 | 14.19 → 13.88 | 2348.0 → 2320.9 | 6.20 → 9.87 | 7769 → 8167 |
| 200 | Plate Mace + Shield | 12 → 14 | 14.75 → 14.72 | 2480.4 → 2445.7 | 23.66 → 24.65 | 10590 → 10604 |
| 200 | Leather Dual Daggers | 0 → 0 | 12.53 → 12.84 | 3123.6 → 3118.6 | 6.19 → 6.88 | 5809 → 5958 |
| 200 | Leather Bow | 27 → 26 | 15.00 → 15.00 | 4177.4 → 4173.2 | 4.00 → 3.79 | 5709 → 5660 |
| 200 | Leather Two-Handed | 24 → 24 | 14.97 → 14.69 | 3781.1 → 3769.0 | 7.08 → 6.60 | 6210 → 6079 |

## Affinities efetivamente desbloqueadas e desvio da rota

Cada target mostra `desbloqueios/32 @ Realm média` e considera apenas runs em que ocorreu o desbloqueio. `Faltas` é o número médio de affinities planeadas não visitadas na rota; `fora do plano` é a média de famílias não-planeadas visitadas.

| E | Build | Alvos | Desbloqueios na rota atual | Desbloqueios na rota planeada | Faltas atuais → planeadas | Fora do plano atuais → planeadas |
|:--:|:--|:--|:--|:--|--:|--:|
| 10 | Cloth Staff | magic → fury → aegis | magic 32/32@1.0; fury 21/32@3.2; aegis 18/32@3.0 | magic 32/32@1.0; fury 19/32@2.4; aegis 23/32@2.8 | 0.78 → 0.69 | 0.78 → 0.69 |
| 10 | Cloth Wand + Orb | magic → fury → aegis | magic 32/32@1.0; fury 22/32@2.5; aegis 19/32@3.3 | magic 32/32@1.0; fury 25/32@2.3; aegis 20/32@3.3 | 0.72 → 0.59 | 0.72 → 0.59 |
| 10 | Plate Sword + Shield | blood → decay → magic | blood 32/32@1.0; decay 16/32@2.9; magic 20/32@2.9 | blood 32/32@1.0; decay 21/32@2.8; magic 19/32@2.7 | 0.88 → 0.75 | 0.88 → 0.75 |
| 10 | Plate Mace + Shield | aegis → vitality → fury | aegis 32/32@1.0; vitality 22/32@2.7; fury 24/32@2.8 | aegis 32/32@1.0; vitality 24/32@2.5; fury 25/32@2.9 | 0.56 → 0.41 | 0.56 → 0.41 |
| 10 | Leather Dual Daggers | fury → magic → blood | fury 32/32@1.0; magic 19/32@3.4; blood 17/32@3.4 | fury 32/32@1.0; magic 18/32@2.2; blood 26/32@3.0 | 0.88 → 0.63 | 0.88 → 0.63 |
| 10 | Leather Bow | fury → magic → blood | fury 32/32@1.0; magic 17/32@2.7; blood 18/32@2.8 | fury 32/32@1.0; magic 19/32@2.2; blood 23/32@3.0 | 0.91 → 0.69 | 0.91 → 0.69 |
| 10 | Leather Two-Handed | blood → decay → magic | blood 32/32@1.0; decay 24/32@2.9; magic 19/32@3.1 | blood 32/32@1.0; decay 22/32@2.6; magic 27/32@2.9 | 0.66 → 0.47 | 0.66 → 0.47 |
| 50 | Cloth Staff | magic → fury → aegis | magic 32/32@1.0; fury 19/32@2.8; aegis 18/32@2.6 | magic 32/32@1.0; fury 22/32@2.3; aegis 25/32@2.9 | 0.84 → 0.53 | 0.84 → 0.53 |
| 50 | Cloth Wand + Orb | magic → fury → aegis | magic 32/32@1.0; fury 15/32@2.8; aegis 19/32@2.6 | magic 32/32@1.0; fury 21/32@2.3; aegis 19/32@2.7 | 0.88 → 0.69 | 0.84 → 0.63 |
| 50 | Plate Sword + Shield | blood → decay → magic | blood 32/32@1.0; decay 15/32@3.0; magic 22/32@2.8 | blood 32/32@1.0; decay 19/32@2.8; magic 29/32@2.8 | 0.78 → 0.47 | 0.72 → 0.44 |
| 50 | Plate Mace + Shield | aegis → vitality → fury | aegis 32/32@1.0; vitality 23/32@2.8; fury 16/32@3.2 | aegis 32/32@1.0; vitality 22/32@2.3; fury 20/32@3.1 | 0.78 → 0.69 | 0.78 → 0.69 |
| 50 | Leather Dual Daggers | fury → magic → blood | fury 32/32@1.0; magic 19/32@2.8; blood 22/32@2.9 | fury 32/32@1.0; magic 26/32@2.6; blood 22/32@3.0 | 0.72 → 0.50 | 0.72 → 0.50 |
| 50 | Leather Bow | fury → magic → blood | fury 32/32@1.0; magic 22/32@3.1; blood 19/32@3.2 | fury 32/32@1.0; magic 23/32@2.4; blood 20/32@2.9 | 0.72 → 0.66 | 0.72 → 0.66 |
| 50 | Leather Two-Handed | blood → decay → magic | blood 32/32@1.0; decay 17/32@2.9; magic 17/32@2.9 | blood 32/32@1.0; decay 15/32@2.8; magic 21/32@2.8 | 0.94 → 0.88 | 0.94 → 0.88 |
| 100 | Cloth Staff | magic → fury → aegis | magic 32/32@1.0; fury 15/32@2.7; aegis 23/32@3.3 | magic 32/32@1.0; fury 24/32@2.4; aegis 20/32@3.0 | 0.78 → 0.63 | 0.78 → 0.63 |
| 100 | Cloth Wand + Orb | magic → fury → aegis | magic 32/32@1.0; fury 21/32@2.5; aegis 14/32@3.1 | magic 32/32@1.0; fury 22/32@2.1; aegis 21/32@3.2 | 0.91 → 0.66 | 0.84 → 0.66 |
| 100 | Plate Sword + Shield | blood → decay → magic | blood 32/32@1.0; decay 22/32@2.9; magic 17/32@2.9 | blood 32/32@1.0; decay 22/32@2.3; magic 20/32@3.0 | 0.75 → 0.69 | 0.72 → 0.69 |
| 100 | Plate Mace + Shield | aegis → vitality → fury | aegis 32/32@1.0; vitality 17/32@2.6; fury 20/32@2.8 | aegis 32/32@1.0; vitality 21/32@2.5; fury 22/32@2.8 | 0.84 → 0.66 | 0.84 → 0.59 |
| 100 | Leather Dual Daggers | fury → magic → blood | fury 32/32@1.0; magic 16/32@2.7; blood 23/32@3.1 | fury 32/32@1.0; magic 26/32@2.5; blood 26/32@2.7 | 0.78 → 0.38 | 0.78 → 0.38 |
| 100 | Leather Bow | fury → magic → blood | fury 32/32@1.0; magic 23/32@3.1; blood 18/32@3.7 | fury 32/32@1.0; magic 25/32@2.6; blood 21/32@2.9 | 0.72 → 0.56 | 0.72 → 0.56 |
| 100 | Leather Two-Handed | blood → decay → magic | blood 32/32@1.0; decay 20/32@2.7; magic 25/32@3.1 | blood 32/32@1.0; decay 23/32@2.2; magic 21/32@3.1 | 0.59 → 0.63 | 0.59 → 0.63 |
| 200 | Cloth Staff | magic → fury → aegis | magic 32/32@1.0; fury 17/32@3.6; aegis 23/32@3.0 | magic 32/32@1.0; fury 18/32@2.8; aegis 22/32@2.8 | 0.75 → 0.75 | 0.75 → 0.75 |
| 200 | Cloth Wand + Orb | magic → fury → aegis | magic 32/32@1.0; fury 21/32@3.0; aegis 17/32@3.1 | magic 32/32@1.0; fury 21/32@2.5; aegis 27/32@3.0 | 0.78 → 0.50 | 0.78 → 0.50 |
| 200 | Plate Sword + Shield | blood → decay → magic | blood 32/32@1.0; decay 22/32@2.8; magic 15/32@3.0 | blood 32/32@1.0; decay 20/32@2.2; magic 21/32@2.6 | 0.84 → 0.72 | 0.84 → 0.72 |
| 200 | Plate Mace + Shield | aegis → vitality → fury | aegis 32/32@1.0; vitality 24/32@2.6; fury 21/32@3.1 | aegis 32/32@1.0; vitality 21/32@2.0; fury 21/32@3.4 | 0.59 → 0.69 | 0.59 → 0.69 |
| 200 | Leather Dual Daggers | fury → magic → blood | fury 32/32@1.0; magic 19/32@2.9; blood 22/32@3.0 | fury 32/32@1.0; magic 25/32@2.3; blood 21/32@3.4 | 0.69 → 0.56 | 0.69 → 0.56 |
| 200 | Leather Bow | fury → magic → blood | fury 32/32@1.0; magic 18/32@3.3; blood 20/32@2.6 | fury 32/32@1.0; magic 13/32@3.6; blood 26/32@2.6 | 0.81 → 0.78 | 0.81 → 0.78 |
| 200 | Leather Two-Handed | blood → decay → magic | blood 32/32@1.0; decay 20/32@3.1; magic 17/32@2.2 | blood 32/32@1.0; decay 26/32@2.7; magic 20/32@3.3 | 0.84 → 0.56 | 0.84 → 0.56 |

## Híbridos

- **Rota atual:** 732/896 corridas obtiveram pelo menos um híbrido; média 1.72 híbridos por corrida. Mais frequentes: spell_surge (132), spellblade (122), hemal_sigil (118), hex_bleed (117), crimson_rush (101), runic_shield (82), reapers_cadence (74), plague_rupture (68), carrion_detonation (65), elemental_blight (61), iron_reversal (60), counterstrike (53).
- **Affinities planeadas:** 747/896 corridas obtiveram pelo menos um híbrido; média 1.90 híbridos por corrida. Mais frequentes: hex_bleed (152), spell_surge (147), spellblade (135), hemal_sigil (130), crimson_rush (109), reapers_cadence (95), runic_shield (86), iron_reversal (81), elemental_blight (81), plague_rupture (73), carrion_detonation (66), prismatic_rebound (65).

## Resumo por nível

| E | Sistema | Vitórias /224 | Realm média | DPS | Cura/s | Budget sobrevivência | Faltas de alvos | Famílias fora do plano |
|:--:|:--|--:|--:|--:|--:|--:|--:|--:|
| 10 | Atual | 35/224 | 13.18 | 150.8 | 0.48 | 565 | 0.77 | 0.77 |
| 10 | Planeado | 47/224 | 13.46 | 150.6 | 0.50 | 568 | 0.60 | 0.60 |
| 50 | Atual | 24/224 | 10.39 | 654.8 | 1.53 | 1882 | 0.81 | 0.79 |
| 50 | Planeado | 21/224 | 10.30 | 657.0 | 0.97 | 1825 | 0.63 | 0.62 |
| 100 | Atual | 40/224 | 12.00 | 1435.0 | 3.51 | 3570 | 0.77 | 0.75 |
| 100 | Planeado | 52/224 | 12.65 | 1456.3 | 3.47 | 3565 | 0.60 | 0.59 |
| 200 | Atual | 90/224 | 13.80 | 3278.7 | 8.33 | 6999 | 0.76 | 0.76 |
| 200 | Planeado | 95/224 | 13.81 | 3276.1 | 8.46 | 7030 | 0.65 | 0.65 |

## Leitura dos resultados

- A oportunidade mais cedo reduziu a média de alvos planeados não visitados em cada nível (E10: 0.77→0.60; E50: 0.81→0.63; E100: 0.77→0.60; E200: 0.76→0.65 por corrida). Isto mede mudança de rota, não um buff grátis.
- Vitórias totais (224 corridas por nível e sistema): E10 35→47, E50 24→21, E100 40→52, E200 90→95. Realms, DPS, cura e sobrevivência oscilam por build e política; não aparece uma alteração consistente de DPS que pudesse ser atribuída às armas, cujos coeficientes ficaram iguais.
- Os híbridos mantiveram disponibilidade sob as regras atuais: os pares com affinities efetivamente desbloqueadas continuaram elegíveis, mas a taxa de obtenção não subiu uniformemente. Planeamento de rota não garante híbrido nem pick.
- Os maiores ganhos de vitória aparecem em E100 Staff (7→14/32), E10 Two-Handed (1→5/32) e E200 Wand/Orb (8→11/32). Em E50, Mace/Shield cai 1→0/32. Com 16 seeds por política, são sinais por build, não prova de melhoria global.

## Recomendação numérica para B.2

Não recomendo agora multiplicadores de HP/Attack/Defense dos inimigos: B.1 altera quais affinities ficam disponíveis na rota, e a amostra mostra efeitos diferentes por build (inclusive em sentidos opostos). Para B.2, usar primeiro estes intervalos como **limites de regressão** da mesma matriz Epic, não como novas fórmulas:

| E | Vitórias observadas com plano | Realm média | Intervalo de vitórias a preservar no reteste B.2 |
|:--:|--:|--:|--:|
| 10 | 47/224 (21.0%) | 13.46 | 36–58/224 |
| 50 | 21/224 (9.4%) | 10.30 | 10–32/224 |
| 100 | 52/224 (23.2%) | 12.65 | 41–63/224 |
| 200 | 95/224 (42.4%) | 13.81 | 84–106/224 |

A margem de ±11 vitórias corresponde a aproximadamente ±5 pontos percentuais em 224 corridas. Antes de escolher novos multiplicadores, aumentar B.2 para pelo menos 64 seeds por build/política e manter as mesmas seeds e streams nos pares. Se o objetivo de dificuldade pretendido for diferente destes resultados, definir primeiro a curva de clear-rate esperada; esta validação não determina por si só o balanceamento desejado.

## Regressão, estado e limitações

- Testes B.1: `tests/v012-affinity-phase-b1.test.cjs` PASS (plano, oportunidades, rota alternativa, RNG separado, compatibilidade e caps).
- Regressões do controlador: `tests/v012-complete-schedule.test.cjs` e `tests/v012-complete-compat.test.cjs` PASS.
- Integração determinística: 21 cenários com fixtures B.1 atualizadas.
- Simulação pareada: 1792/1792 PASS; 0 erros, 0 timeouts.
- Pendente: UI do Camp para escolher/limpar o plano e teste visual. A alteração fica pendente porque os ficheiros visuais têm alterações UX locais.

Não foram alterados coeficientes de armas/atributos, velocidades/cooldowns, inimigos, loot, Legendaries, Endless, Firebase, saves reais, deploys ou `main`.
