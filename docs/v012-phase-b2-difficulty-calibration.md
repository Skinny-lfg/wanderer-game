# Wanderer v0.12 — Fase B.2: calibração da dificuldade

Data: 2026-10-21  |  Branch: `development`  |  Base: `62519a0`

## Recomendação

**Manter os multiplicadores de HP e Attack dos inimigos em 100% em E10, E50, E100 e E200.** Nenhuma das duas curvas globais satisfaz os objetivos por build: a curva B aproxima as médias dos intervalos pedidos, mas torna Bow e Two-Handed dominantes em E50. A curva A é menos extrema, mas deixa várias políticas/builds abaixo das taxas pretendidas. As duas curvas são rejeitadas; não foram alterados coeficientes permanentes.

A próxima calibração deve isolar as combinações de affinities e os builds E50 que divergiram mais — Bow, Two-Handed e Dual Daggers contra Wand/Orb e Plate Sword/Shield — antes de propor coeficientes de armas ou armaduras. Os dados desta experiência não justificam um novo multiplicador global nem atribuem a diferença a um único coeficiente de arma.

## Método

Foram executadas **21,504 corridas** no runtime de B.1, carregado de um arquivo limpo do commit `62519a0`. A worktree com alterações UX locais não foi usada. Cada build/política/perfil/nível/curva teve 64 seeds; current, A e B reutilizam a mesma seed dentro do par. As streams de combate, ofertas de rotas, drafts de passivos e escolhas de controlo são independentes e reproduzíveis.

Cada build usou equipamento Epic nos slots aplicáveis, três Runas equivalentes do harness anterior (Vitality, Warding e Might; Wisdom em Staff/Wand), sem poções, novos Legendaries, gear swaps nem benefícios de eventos. Eventos foram recusados. As combinações abaixo são perfis de teste e não restringem affinities no jogo. As políticas foram `triple` (prioriza as famílias indicadas) e `random` (escolhas aleatórias existentes).

| Perfil | Staff/Wand | Sword/Shield | Mace/Shield | Daggers/Bow | Two-Handed |
|:--|:--|:--|:--|:--|:--|
| A.2 | Magic → Aegis → Decay | Vitality → Aegis → Fury | Vitality → Aegis → Fury | Decay → Fury → Blood | Decay → Fury → Blood |
| B.1 | Magic → Fury → Aegis | Blood → Decay → Magic | Aegis → Vitality → Fury | Fury → Magic → Blood | Blood → Decay → Magic |

Os fatores foram aplicados **uma vez ao HP/Attack do inimigo já gerado**, antes do combate. Equipment e Defense não foram multiplicados. Interpolação smoothstep cúbica entre âncoras; E1 = 100%; a partir de E200, fator = 100% e a fórmula original é preservada.

| E | Atual HP/Attack | Curva A HP/Attack | Curva B HP/Attack |
|--:|:--:|:--:|:--:|
| 1 | 100% / 100% | 100% / 100% | 100% / 100% |
| 10 | 100% / 100% | 95% / 95% | 90% / 92% |
| 50 | 100% / 100% | 90% / 92% | 82% / 87% |
| 100 | 100% / 100% | 97% / 97% | 95% / 95% |
| 200+ | 100% / 100% | 100% / 100% | 100% / 100% |

`Vitórias` significa completar 15 Realms; a Realm média segue a métrica do simulador B.1 e inclui o Realm em que a run morreu. Dano recebido é o dano efetivamente aplicado a HP e Barrier depois de Block/Evasion, sem contar dano evitado. Cura/s e Barrier/s são quantidades efetivas do runtime. `Boss` é a percentagem que chegou a qualquer boss.

## Resultados agregados por perfil e política

Cada célula de curva apresenta: **vitórias/n (%) · Realm média · DPS · dano recebido · cura/s · Barrier/s · boss alcançado**. Cada política agrega 7 builds × 64 seeds (n=448).

| Perfil | E | Política | Atual | A | B |
|:--|--:|:--|:--|:--|:--|
| A.2 | 10 | triple | 81/448 (18.1%) · 14.1 · 145.3 · 597 · 0.90 · 1.50 · 65.9% | 148/448 (33.0%) · 14.6 · 144.7 · 573 · 0.91 · 1.53 · 78.6% | 235/448 (52.5%) · 14.8 · 143.4 · 540 · 0.93 · 1.55 · 88.0% |
| A.2 | 10 | random | 42/448 (9.4%) · 12.3 · 140.4 · 596 · 1.16 · 1.16 · 34.4% | 89/448 (19.9%) · 13.4 · 140.6 · 611 · 1.33 · 1.23 · 54.9% | 147/448 (32.8%) · 14.1 · 139.5 · 600 · 1.47 · 1.25 · 67.4% |
| A.2 | 50 | triple | 45/448 (10.0%) · 11.3 · 644.7 · 1948 · 2.69 · 4.26 · 35.7% | 130/448 (29.0%) · 13.2 · 644.3 · 1872 · 3.12 · 4.67 · 58.9% | 223/448 (49.8%) · 14.3 · 645.6 · 1719 · 3.38 · 5.08 · 77.0% |
| A.2 | 50 | random | 15/448 (3.3%) · 9.2 · 626.3 · 1887 · 2.22 · 3.82 · 15.0% | 75/448 (16.7%) · 11.9 · 631.5 · 1954 · 3.54 · 4.06 · 43.7% | 184/448 (41.1%) · 13.6 · 633.8 · 1856 · 4.40 · 4.33 · 65.9% |
| A.2 | 100 | triple | 83/448 (18.5%) · 12.3 · 1411.3 · 3748 · 6.76 · 8.83 · 46.7% | 103/448 (23.0%) · 12.9 · 1408.4 · 3722 · 6.83 · 8.97 · 54.2% | 128/448 (28.6%) · 13.3 · 1405.5 · 3652 · 6.92 · 9.20 · 60.1% |
| A.2 | 100 | random | 30/448 (6.7%) · 10.2 · 1374.2 · 3693 · 6.20 · 7.31 · 23.9% | 53/448 (11.8%) · 11.2 · 1373.7 · 3761 · 7.10 · 7.56 · 34.4% | 67/448 (15.0%) · 11.9 · 1372.8 · 3803 · 7.82 · 7.72 · 41.3% |
| A.2 | 200 | triple | 179/448 (40.0%) · 13.5 · 3185.6 · 6462 · 13.23 · 18.63 · 69.0% | 179/448 (40.0%) · 13.5 · 3185.6 · 6462 · 13.23 · 18.63 · 69.0% | 179/448 (40.0%) · 13.5 · 3185.6 · 6462 · 13.23 · 18.63 · 69.0% |
| A.2 | 200 | random | 162/448 (36.2%) · 13.0 · 3189.8 · 6934 · 19.57 · 15.61 · 62.1% | 162/448 (36.2%) · 13.0 · 3189.8 · 6934 · 19.57 · 15.61 · 62.1% | 162/448 (36.2%) · 13.0 · 3189.8 · 6934 · 19.57 · 15.61 · 62.1% |
| B.1 | 10 | triple | 111/448 (24.8%) · 14.0 · 151.9 · 544 · 0.28 · 1.47 · 66.3% | 204/448 (45.5%) · 14.6 · 152.2 · 508 · 0.29 · 1.49 · 80.4% | 279/448 (62.3%) · 14.8 · 150.2 · 472 · 0.29 · 1.51 · 89.1% |
| B.1 | 10 | random | 55/448 (12.3%) · 12.7 · 147.3 · 573 · 0.72 · 1.27 · 40.6% | 105/448 (23.4%) · 13.7 · 147.1 · 568 · 0.82 · 1.32 · 55.8% | 190/448 (42.4%) · 14.3 · 146.1 · 550 · 0.91 · 1.36 · 74.8% |
| B.1 | 50 | triple | 56/448 (12.5%) · 11.1 · 661.7 · 1847 · 0.78 · 4.69 · 38.6% | 141/448 (31.5%) · 13.4 · 668.0 · 1775 · 1.12 · 5.13 · 59.8% | 246/448 (54.9%) · 14.4 · 665.9 · 1596 · 1.22 · 5.43 · 78.3% |
| B.1 | 50 | random | 32/448 (7.1%) · 9.5 · 648.6 · 1863 · 1.78 · 4.05 · 21.7% | 117/448 (26.1%) · 11.9 · 650.4 · 1831 · 2.71 · 4.33 · 42.9% | 200/448 (44.6%) · 13.4 · 651.5 · 1689 · 3.22 · 4.67 · 59.2% |
| B.1 | 100 | triple | 100/448 (22.3%) · 12.8 · 1450.5 · 3413 · 1.90 · 9.62 · 53.8% | 131/448 (29.2%) · 13.4 · 1449.0 · 3332 · 2.04 · 9.81 · 64.3% | 149/448 (33.3%) · 13.7 · 1444.7 · 3302 · 2.09 · 9.93 · 70.3% |
| B.1 | 100 | random | 71/448 (15.8%) · 11.0 · 1422.6 · 3465 · 3.96 · 8.27 · 33.0% | 96/448 (21.4%) · 11.8 · 1422.1 · 3461 · 4.44 · 8.46 · 42.0% | 109/448 (24.3%) · 12.3 · 1415.3 · 3477 · 5.05 · 8.51 · 47.5% |
| B.1 | 200 | triple | 187/448 (41.7%) · 14.0 · 3275.5 · 6166 · 4.31 · 19.43 · 76.6% | 187/448 (41.7%) · 14.0 · 3275.5 · 6166 · 4.31 · 19.43 · 76.6% | 187/448 (41.7%) · 14.0 · 3275.5 · 6166 · 4.31 · 19.43 · 76.6% |
| B.1 | 200 | random | 150/448 (33.5%) · 12.9 · 3235.1 · 6452 · 10.62 · 17.12 · 56.0% | 150/448 (33.5%) · 12.9 · 3235.1 · 6452 · 10.62 · 17.12 · 56.0% | 150/448 (33.5%) · 12.9 · 3235.1 · 6452 · 10.62 · 17.12 · 56.0% |

## Resultados por build

### Taxa de vitória por perfil

Cada par mostra `triple/random`; cada valor é `vitórias/64 seeds`. Isto separa o efeito do perfil de affinities do resultado da curva.

| E | Build | A.2 atual | A.2 A | A.2 B | B.1 atual | B.1 A | B.1 B |
|--:|:--|:--:|:--:|:--:|:--:|:--:|:--:|
| 10 | Cloth Staff | 1/64 (1.6%) / 10/64 (15.6%) | 3/64 (4.7%) / 14/64 (21.9%) | 10/64 (15.6%) / 24/64 (37.5%) | 27/64 (42.2%) / 10/64 (15.6%) | 39/64 (60.9%) / 15/64 (23.4%) | 48/64 (75%) / 33/64 (51.6%) |
| 10 | Cloth Wand + Orb | 2/64 (3.1%) / 6/64 (9.4%) | 2/64 (3.1%) / 10/64 (15.6%) | 14/64 (21.9%) / 20/64 (31.3%) | 15/64 (23.4%) / 5/64 (7.8%) | 22/64 (34.4%) / 14/64 (21.9%) | 39/64 (60.9%) / 25/64 (39.1%) |
| 10 | Plate Sword + Shield | 17/64 (26.6%) / 5/64 (7.8%) | 36/64 (56.3%) / 16/64 (25%) | 51/64 (79.7%) / 26/64 (40.6%) | 0/64 (0%) / 2/64 (3.1%) | 1/64 (1.6%) / 3/64 (4.7%) | 4/64 (6.3%) / 9/64 (14.1%) |
| 10 | Plate Mace + Shield | 15/64 (23.4%) / 2/64 (3.1%) | 28/64 (43.8%) / 8/64 (12.5%) | 42/64 (65.6%) / 17/64 (26.6%) | 15/64 (23.4%) / 3/64 (4.7%) | 37/64 (57.8%) / 10/64 (15.6%) | 46/64 (71.9%) / 17/64 (26.6%) |
| 10 | Leather Dual Daggers | 12/64 (18.8%) / 5/64 (7.8%) | 24/64 (37.5%) / 11/64 (17.2%) | 38/64 (59.4%) / 14/64 (21.9%) | 22/64 (34.4%) / 11/64 (17.2%) | 41/64 (64.1%) / 12/64 (18.8%) | 57/64 (89.1%) / 30/64 (46.9%) |
| 10 | Leather Bow | 12/64 (18.8%) / 5/64 (7.8%) | 19/64 (29.7%) / 10/64 (15.6%) | 29/64 (45.3%) / 17/64 (26.6%) | 22/64 (34.4%) / 8/64 (12.5%) | 41/64 (64.1%) / 21/64 (32.8%) | 50/64 (78.1%) / 32/64 (50%) |
| 10 | Leather Two-Handed | 22/64 (34.4%) / 9/64 (14.1%) | 36/64 (56.3%) / 20/64 (31.3%) | 51/64 (79.7%) / 29/64 (45.3%) | 10/64 (15.6%) / 16/64 (25%) | 23/64 (35.9%) / 30/64 (46.9%) | 35/64 (54.7%) / 44/64 (68.8%) |
| 50 | Cloth Staff | 0/64 (0%) / 2/64 (3.1%) | 1/64 (1.6%) / 7/64 (10.9%) | 5/64 (7.8%) / 20/64 (31.3%) | 1/64 (1.6%) / 0/64 (0%) | 15/64 (23.4%) / 7/64 (10.9%) | 29/64 (45.3%) / 19/64 (29.7%) |
| 50 | Cloth Wand + Orb | 0/64 (0%) / 0/64 (0%) | 0/64 (0%) / 0/64 (0%) | 0/64 (0%) / 7/64 (10.9%) | 0/64 (0%) / 0/64 (0%) | 5/64 (7.8%) / 0/64 (0%) | 21/64 (32.8%) / 5/64 (7.8%) |
| 50 | Plate Sword + Shield | 4/64 (6.3%) / 0/64 (0%) | 10/64 (15.6%) / 2/64 (3.1%) | 25/64 (39.1%) / 9/64 (14.1%) | 0/64 (0%) / 0/64 (0%) | 0/64 (0%) / 0/64 (0%) | 0/64 (0%) / 4/64 (6.3%) |
| 50 | Plate Mace + Shield | 3/64 (4.7%) / 0/64 (0%) | 14/64 (21.9%) / 2/64 (3.1%) | 26/64 (40.6%) / 10/64 (15.6%) | 1/64 (1.6%) / 1/64 (1.6%) | 14/64 (21.9%) / 3/64 (4.7%) | 31/64 (48.4%) / 8/64 (12.5%) |
| 50 | Leather Dual Daggers | 2/64 (3.1%) / 0/64 (0%) | 14/64 (21.9%) / 7/64 (10.9%) | 42/64 (65.6%) / 25/64 (39.1%) | 6/64 (9.4%) / 3/64 (4.7%) | 27/64 (42.2%) / 25/64 (39.1%) | 57/64 (89.1%) / 55/64 (85.9%) |
| 50 | Leather Bow | 19/64 (29.7%) / 9/64 (14.1%) | 44/64 (68.8%) / 31/64 (48.4%) | 64/64 (100%) / 62/64 (96.9%) | 43/64 (67.2%) / 22/64 (34.4%) | 62/64 (96.9%) / 56/64 (87.5%) | 64/64 (100%) / 64/64 (100%) |
| 50 | Leather Two-Handed | 17/64 (26.6%) / 4/64 (6.3%) | 47/64 (73.4%) / 26/64 (40.6%) | 61/64 (95.3%) / 51/64 (79.7%) | 5/64 (7.8%) / 6/64 (9.4%) | 18/64 (28.1%) / 26/64 (40.6%) | 44/64 (68.8%) / 45/64 (70.3%) |
| 100 | Cloth Staff | 2/64 (3.1%) / 8/64 (12.5%) | 2/64 (3.1%) / 9/64 (14.1%) | 4/64 (6.3%) / 11/64 (17.2%) | 21/64 (32.8%) / 12/64 (18.8%) | 22/64 (34.4%) / 15/64 (23.4%) | 26/64 (40.6%) / 18/64 (28.1%) |
| 100 | Cloth Wand + Orb | 1/64 (1.6%) / 1/64 (1.6%) | 1/64 (1.6%) / 3/64 (4.7%) | 1/64 (1.6%) / 6/64 (9.4%) | 8/64 (12.5%) / 2/64 (3.1%) | 12/64 (18.8%) / 8/64 (12.5%) | 17/64 (26.6%) / 8/64 (12.5%) |
| 100 | Plate Sword + Shield | 13/64 (20.3%) / 2/64 (3.1%) | 16/64 (25%) / 1/64 (1.6%) | 20/64 (31.3%) / 4/64 (6.3%) | 0/64 (0%) / 0/64 (0%) | 0/64 (0%) / 1/64 (1.6%) | 0/64 (0%) / 3/64 (4.7%) |
| 100 | Plate Mace + Shield | 12/64 (18.8%) / 2/64 (3.1%) | 17/64 (26.6%) / 6/64 (9.4%) | 23/64 (35.9%) / 8/64 (12.5%) | 14/64 (21.9%) / 3/64 (4.7%) | 24/64 (37.5%) / 3/64 (4.7%) | 22/64 (34.4%) / 3/64 (4.7%) |
| 100 | Leather Dual Daggers | 0/64 (0%) / 0/64 (0%) | 0/64 (0%) / 3/64 (4.7%) | 1/64 (1.6%) / 3/64 (4.7%) | 2/64 (3.1%) / 3/64 (4.7%) | 4/64 (6.3%) / 2/64 (3.1%) | 9/64 (14.1%) / 8/64 (12.5%) |
| 100 | Leather Bow | 33/64 (51.6%) / 12/64 (18.8%) | 33/64 (51.6%) / 17/64 (26.6%) | 39/64 (60.9%) / 16/64 (25%) | 47/64 (73.4%) / 38/64 (59.4%) | 54/64 (84.4%) / 47/64 (73.4%) | 56/64 (87.5%) / 47/64 (73.4%) |
| 100 | Leather Two-Handed | 22/64 (34.4%) / 5/64 (7.8%) | 34/64 (53.1%) / 14/64 (21.9%) | 40/64 (62.5%) / 19/64 (29.7%) | 8/64 (12.5%) / 13/64 (20.3%) | 15/64 (23.4%) / 20/64 (31.3%) | 19/64 (29.7%) / 22/64 (34.4%) |
| 200 | Cloth Staff | 22/64 (34.4%) / 33/64 (51.6%) | 22/64 (34.4%) / 33/64 (51.6%) | 22/64 (34.4%) / 33/64 (51.6%) | 43/64 (67.2%) / 32/64 (50%) | 43/64 (67.2%) / 32/64 (50%) | 43/64 (67.2%) / 32/64 (50%) |
| 200 | Cloth Wand + Orb | 3/64 (4.7%) / 11/64 (17.2%) | 3/64 (4.7%) / 11/64 (17.2%) | 3/64 (4.7%) / 11/64 (17.2%) | 24/64 (37.5%) / 12/64 (18.8%) | 24/64 (37.5%) / 12/64 (18.8%) | 24/64 (37.5%) / 12/64 (18.8%) |
| 200 | Plate Sword + Shield | 27/64 (42.2%) / 14/64 (21.9%) | 27/64 (42.2%) / 14/64 (21.9%) | 27/64 (42.2%) / 14/64 (21.9%) | 0/64 (0%) / 1/64 (1.6%) | 0/64 (0%) / 1/64 (1.6%) | 0/64 (0%) / 1/64 (1.6%) |
| 200 | Plate Mace + Shield | 32/64 (50%) / 19/64 (29.7%) | 32/64 (50%) / 19/64 (29.7%) | 32/64 (50%) / 19/64 (29.7%) | 30/64 (46.9%) / 7/64 (10.9%) | 30/64 (46.9%) / 7/64 (10.9%) | 30/64 (46.9%) / 7/64 (10.9%) |
| 200 | Leather Dual Daggers | 0/64 (0%) / 2/64 (3.1%) | 0/64 (0%) / 2/64 (3.1%) | 0/64 (0%) / 2/64 (3.1%) | 4/64 (6.3%) / 2/64 (3.1%) | 4/64 (6.3%) / 2/64 (3.1%) | 4/64 (6.3%) / 2/64 (3.1%) |
| 200 | Leather Bow | 45/64 (70.3%) / 42/64 (65.6%) | 45/64 (70.3%) / 42/64 (65.6%) | 45/64 (70.3%) / 42/64 (65.6%) | 55/64 (85.9%) / 52/64 (81.3%) | 55/64 (85.9%) / 52/64 (81.3%) | 55/64 (85.9%) / 52/64 (81.3%) |
| 200 | Leather Two-Handed | 50/64 (78.1%) / 41/64 (64.1%) | 50/64 (78.1%) / 41/64 (64.1%) | 50/64 (78.1%) / 41/64 (64.1%) | 31/64 (48.4%) / 44/64 (68.8%) | 31/64 (48.4%) / 44/64 (68.8%) | 31/64 (48.4%) / 44/64 (68.8%) |

### Métricas por build

Valores agregam os dois perfis e as duas políticas (n=256 por build/curva/nível). Cada célula apresenta **vitórias/n (%) · Realm média · DPS · dano recebido · cura/s · Barrier/s · boss alcançado**.

| E | Build | Atual | A | B |
|--:|:--|:--|:--|:--|
| 10 | Cloth Staff | 48/256 (18.8%) · 13.3 · 164 · 542 · 0.28 · 2.99 · 44.2% | 71/256 (27.7%) · 14.0 · 164 · 529 · 0.31 · 3.04 · 57.0% | 115/256 (44.9%) · 14.4 · 162 · 506 · 0.34 · 3.05 · 69.5% |
| 10 | Cloth Wand + Orb | 28/256 (10.9%) · 12.5 · 150 · 544 · 0.18 · 2.67 · 36.7% | 48/256 (18.8%) · 13.7 · 149 · 545 · 0.23 · 2.75 · 54.3% | 98/256 (38.3%) · 14.2 · 148 · 524 · 0.26 · 2.81 · 72.3% |
| 10 | Plate Sword + Shield | 24/256 (9.4%) · 12.8 · 113 · 694 · 1.63 · 0.45 · 39.5% | 56/256 (21.9%) · 13.8 · 113 · 696 · 1.79 · 0.50 · 57.8% | 90/256 (35.2%) · 14.5 · 114 · 679 · 1.90 · 0.53 · 74.6% |
| 10 | Plate Mace + Shield | 35/256 (13.7%) · 12.0 · 93 · 776 · 1.91 · 1.09 · 45.3% | 83/256 (32.4%) · 13.4 · 95 · 766 · 2.10 · 1.20 · 62.5% | 122/256 (47.7%) · 14.1 · 93 · 752 · 2.25 · 1.23 · 74.6% |
| 10 | Leather Dual Daggers | 50/256 (19.5%) · 14.2 · 170 · 476 · 0.42 · 0.15 · 70.3% | 88/256 (34.4%) · 14.6 · 169 · 455 · 0.43 · 0.17 · 78.9% | 139/256 (54.3%) · 14.8 · 169 · 418 · 0.49 · 0.17 · 89.8% |
| 10 | Leather Bow | 47/256 (18.4%) · 13.8 · 172 · 476 · 0.39 · 0.14 · 57.5% | 91/256 (35.5%) · 14.3 · 174 · 452 · 0.43 · 0.15 · 75.0% | 128/256 (50.0%) · 14.7 · 170 · 426 · 0.46 · 0.17 · 85.9% |
| 10 | Leather Two-Handed | 57/256 (22.3%) · 14.4 · 162 · 534 · 0.54 · 1.94 · 69.2% | 109/256 (42.6%) · 14.8 · 160 · 512 · 0.57 · 1.96 · 86.3% | 159/256 (62.1%) · 14.9 · 158 · 479 · 0.57 · 1.96 · 91.8% |
| 50 | Cloth Staff | 3/256 (1.2%) · 8.6 · 649 · 1790 · 0.33 · 9.75 · 7.4% | 30/256 (11.7%) · 11.1 · 663 · 1790 · 0.84 · 10.06 · 24.6% | 73/256 (28.5%) · 13.0 · 661 · 1729 · 1.05 · 10.57 · 47.6% |
| 50 | Cloth Wand + Orb | 0/256 (0.0%) · 6.6 · 572 · 1728 · 0.17 · 7.59 · 1.9% | 5/256 (2.0%) · 9.5 · 583 · 1772 · 0.50 · 8.23 · 10.6% | 33/256 (12.9%) · 12.0 · 594 · 1791 · 0.77 · 9.02 · 30.5% |
| 50 | Plate Sword + Shield | 4/256 (1.6%) · 8.4 · 434 · 2259 · 3.85 · 1.05 · 7.4% | 12/256 (4.7%) · 11.3 · 431 · 2383 · 5.07 · 1.37 · 19.9% | 38/256 (14.8%) · 13.7 · 437 · 2509 · 6.45 · 1.70 · 54.7% |
| 50 | Plate Mace + Shield | 5/256 (2.0%) · 8.7 · 377 · 2464 · 4.98 · 3.29 · 13.3% | 33/256 (12.9%) · 12.3 · 389 · 2699 · 6.95 · 4.04 · 42.2% | 75/256 (29.3%) · 13.7 · 383 · 2675 · 7.65 · 4.45 · 64.9% |
| 50 | Leather Dual Daggers | 11/256 (4.3%) · 12.5 · 792 · 1668 · 1.06 · 0.43 · 44.1% | 73/256 (28.5%) · 14.4 · 782 · 1595 · 1.58 · 0.57 · 82.4% | 179/256 (69.9%) · 15.0 · 773 · 1308 · 1.85 · 0.68 · 98.0% |
| 50 | Leather Bow | 93/256 (36.3%) · 14.1 · 911 · 1520 · 1.37 · 0.59 · 77.7% | 193/256 (75.4%) · 14.9 · 903 · 1175 · 1.65 · 0.72 · 98.4% | 254/256 (99.2%) · 15.0 · 895 · 727 · 1.68 · 0.74 · 100.0% |
| 50 | Leather Two-Handed | 32/256 (12.5%) · 13.0 · 782 · 1775 · 1.32 · 6.71 · 42.2% | 117/256 (45.7%) · 14.6 · 788 · 1589 · 1.77 · 6.85 · 81.2% | 201/256 (78.5%) · 14.9 · 802 · 1266 · 1.92 · 6.99 · 94.9% |
| 100 | Cloth Staff | 43/256 (16.8%) · 9.8 · 1547 · 3212 · 1.08 · 18.89 · 26.2% | 48/256 (18.8%) · 10.6 · 1544 · 3198 · 1.29 · 19.06 · 32.0% | 59/256 (23.0%) · 11.2 · 1548 · 3192 · 1.43 · 19.21 · 37.5% |
| 100 | Cloth Wand + Orb | 12/256 (4.7%) · 8.6 · 1385 · 3249 · 0.93 · 15.60 · 14.1% | 24/256 (9.4%) · 9.5 · 1390 · 3248 · 1.18 · 15.89 · 20.3% | 32/256 (12.5%) · 10.0 · 1395 · 3232 · 1.34 · 16.22 · 25.4% |
| 100 | Plate Sword + Shield | 15/256 (5.9%) · 11.0 · 967 · 4514 · 10.36 · 2.52 · 24.2% | 18/256 (7.0%) · 11.9 · 964 · 4598 · 11.19 · 2.67 · 32.5% | 27/256 (10.5%) · 12.7 · 965 · 4685 · 12.25 · 2.90 · 37.9% |
| 100 | Plate Mace + Shield | 31/256 (12.1%) · 12.0 · 920 · 5000 · 13.49 · 7.84 · 44.5% | 50/256 (19.5%) · 12.7 · 913 · 5033 · 14.20 · 8.16 · 54.7% | 56/256 (21.9%) · 13.0 · 908 · 5026 · 14.56 · 8.32 · 57.0% |
| 100 | Leather Dual Daggers | 5/256 (2.0%) · 12.1 · 1549 · 3135 · 2.38 · 0.67 · 32.0% | 9/256 (3.5%) · 13.1 · 1543 · 3209 · 2.92 · 0.88 · 48.0% | 21/256 (8.2%) · 13.6 · 1533 · 3230 · 3.37 · 0.85 · 59.8% |
| 100 | Leather Bow | 130/256 (50.8%) · 14.0 · 1916 · 2623 · 1.80 · 1.01 · 79.3% | 151/256 (59.0%) · 14.4 · 1914 · 2477 · 1.82 · 1.15 · 84.0% | 158/256 (61.7%) · 14.6 · 1902 · 2411 · 2.06 · 1.19 · 85.5% |
| 100 | Leather Two-Handed | 48/256 (18.8%) · 13.4 · 1619 · 3325 · 2.89 · 13.02 · 55.1% | 83/256 (32.4%) · 14.1 · 1624 · 3219 · 3.12 · 13.10 · 69.6% | 100/256 (39.1%) · 14.4 · 1616 · 3133 · 3.28 · 13.20 · 80.5% |
| 200 | Cloth Staff | 130/256 (50.8%) · 12.7 · 3584 · 5557 · 5.03 · 39.20 · 62.9% | 130/256 (50.8%) · 12.7 · 3584 · 5557 · 5.03 · 39.20 · 62.9% | 130/256 (50.8%) · 12.7 · 3584 · 5557 · 5.03 · 39.20 · 62.9% |
| 200 | Cloth Wand + Orb | 50/256 (19.5%) · 10.7 · 3183 · 6158 · 1.77 · 32.84 · 39.5% | 50/256 (19.5%) · 10.7 · 3183 · 6158 · 1.77 · 32.84 · 39.5% | 50/256 (19.5%) · 10.7 · 3183 · 6158 · 1.77 · 32.84 · 39.5% |
| 200 | Plate Sword + Shield | 42/256 (16.4%) · 13.9 · 2341 · 8962 · 25.22 · 6.89 · 60.2% | 42/256 (16.4%) · 13.9 · 2341 · 8962 · 25.22 · 6.89 · 60.2% | 42/256 (16.4%) · 13.9 · 2341 · 8962 · 25.22 · 6.89 · 60.2% |
| 200 | Plate Mace + Shield | 88/256 (34.4%) · 14.4 · 2462 · 9383 · 32.10 · 16.41 · 75.8% | 88/256 (34.4%) · 14.4 · 2462 · 9383 · 32.10 · 16.41 · 75.8% | 88/256 (34.4%) · 14.4 · 2462 · 9383 · 32.10 · 16.41 · 75.8% |
| 200 | Leather Dual Daggers | 8/256 (3.1%) · 11.7 · 3055 · 5969 · 4.17 · 0.97 · 26.6% | 8/256 (3.1%) · 11.7 · 3055 · 5969 · 4.17 · 0.97 · 26.6% | 8/256 (3.1%) · 11.7 · 3055 · 5969 · 4.17 · 0.97 · 26.6% |
| 200 | Leather Bow | 194/256 (75.8%) · 15.0 · 4067 · 4541 · 8.03 · 2.42 · 98.8% | 194/256 (75.8%) · 15.0 · 4067 · 4541 · 8.03 · 2.42 · 98.8% | 194/256 (75.8%) · 15.0 · 4067 · 4541 · 8.03 · 2.42 · 98.8% |
| 200 | Leather Two-Handed | 166/256 (64.8%) · 14.9 · 3859 · 4955 · 7.18 · 25.15 · 97.7% | 166/256 (64.8%) · 14.9 · 3859 · 4955 · 7.18 · 25.15 · 97.7% | 166/256 (64.8%) · 14.9 · 3859 · 4955 · 7.18 · 25.15 · 97.7% |

## Affinities desbloqueadas

A primeira affinity foi sempre a inicial da build. Para a segunda e terceira famílias pretendidas, os resultados foram reproduzíveis entre curvas, como esperado: alterar HP/Attack não muda as streams de ofertas/passivos. A tabela agrega as três curvas e os sete builds, n=1.344 por perfil/nível/política; mostra desbloqueios e Realm média apenas entre runs que desbloquearam a família pretendida.

| Perfil | E | Política | Affinities médias | 2.ª pretendida: desbloqueios @ Realm média | 3.ª pretendida: desbloqueios @ Realm média |
|:--|--:|:--|--:|:--|:--|
| A.2 | 10 | triple | 2.99 | 1165/1344 @ 3.1 | 1152/1344 @ 3.1 |
| A.2 | 10 | random | 3.00 | 540/1344 @ 3.1 | 553/1344 @ 3.0 |
| A.2 | 50 | triple | 2.96 | 1127/1344 @ 3.0 | 1068/1344 @ 3.0 |
| A.2 | 50 | random | 2.96 | 548/1344 @ 2.9 | 521/1344 @ 3.0 |
| A.2 | 100 | triple | 2.98 | 1081/1344 @ 2.9 | 1086/1344 @ 3.0 |
| A.2 | 100 | random | 2.97 | 481/1344 @ 2.9 | 536/1344 @ 3.0 |
| A.2 | 200 | triple | 2.99 | 1080/1344 @ 3.2 | 1131/1344 @ 3.1 |
| A.2 | 200 | random | 2.99 | 519/1344 @ 3.0 | 555/1344 @ 3.0 |
| B.1 | 10 | triple | 2.99 | 1148/1344 @ 3.1 | 1110/1344 @ 3.1 |
| B.1 | 10 | random | 3.00 | 594/1344 @ 3.0 | 555/1344 @ 3.1 |
| B.1 | 50 | triple | 2.95 | 1089/1344 @ 3.0 | 1074/1344 @ 2.9 |
| B.1 | 50 | random | 2.96 | 515/1344 @ 3.0 | 511/1344 @ 2.9 |
| B.1 | 100 | triple | 2.97 | 1119/1344 @ 3.0 | 1087/1344 @ 3.0 |
| B.1 | 100 | random | 2.96 | 604/1344 @ 3.1 | 495/1344 @ 3.0 |
| B.1 | 200 | triple | 2.98 | 1107/1344 @ 3.0 | 1104/1344 @ 3.0 |
| B.1 | 200 | random | 2.98 | 519/1344 @ 2.9 | 537/1344 @ 2.9 |

## Critérios de vitória

A média de cada célula de política abaixo agrega as sete builds, mas mantém o perfil A.2/B.1 separado. O intervalo do objetivo está na segunda coluna.

| E | Objetivo | Perfil/política | Atual | A | B |
|--:|:--:|:--|--:|--:|--:|
| 10 | 40–60% | A.2 / triple | 81/448 (18.1%) | 148/448 (33.1%) | 235/448 (52.5%) |
| 10 | 40–60% | A.2 / random | 42/448 (9.4%) | 89/448 (19.9%) | 147/448 (32.8%) |
| 10 | 40–60% | B.1 / triple | 111/448 (24.8%) | 204/448 (45.5%) | 279/448 (62.3%) |
| 10 | 40–60% | B.1 / random | 55/448 (12.3%) | 105/448 (23.4%) | 190/448 (42.4%) |
| 50 | 30–50% | A.2 / triple | 45/448 (10.1%) | 130/448 (29.0%) | 223/448 (49.8%) |
| 50 | 30–50% | A.2 / random | 15/448 (3.4%) | 75/448 (16.7%) | 184/448 (41.1%) |
| 50 | 30–50% | B.1 / triple | 56/448 (12.5%) | 141/448 (31.5%) | 246/448 (54.9%) |
| 50 | 30–50% | B.1 / random | 32/448 (7.2%) | 117/448 (26.1%) | 200/448 (44.6%) |
| 100 | 25–45% | A.2 / triple | 83/448 (18.5%) | 103/448 (23.0%) | 128/448 (28.6%) |
| 100 | 25–45% | A.2 / random | 30/448 (6.7%) | 53/448 (11.9%) | 67/448 (15.0%) |
| 100 | 25–45% | B.1 / triple | 100/448 (22.3%) | 131/448 (29.3%) | 149/448 (33.3%) |
| 100 | 25–45% | B.1 / random | 71/448 (15.9%) | 96/448 (21.4%) | 109/448 (24.3%) |
| 200 | 20–40% | A.2 / triple | 179/448 (40.0%) | 179/448 (40.0%) | 179/448 (40.0%) |
| 200 | 20–40% | A.2 / random | 162/448 (36.2%) | 162/448 (36.2%) | 162/448 (36.2%) |
| 200 | 20–40% | B.1 / triple | 187/448 (41.7%) | 187/448 (41.7%) | 187/448 (41.7%) |
| 200 | 20–40% | B.1 / random | 150/448 (33.5%) | 150/448 (33.5%) | 150/448 (33.5%) |

Por média geral (todos os perfis/políticas/builds), a curva B fica dentro ou junto aos intervalos agregados nos quatro níveis; isso esconde falhas grandes por build/política. A curva B em E50 eleva Bow/Two-Handed/Daggers muito acima do intervalo: veja a tabela anterior. A curva A não chega à meta média em E10 e fica aquém em algumas políticas E50/E100. Em E200 todas as curvas são idênticas ao atual e a média não elimina a grande diferença entre builds.

## Causas de morte


| Perfil | Curva | Mortes | Causas mais frequentes (contagem) |
|:--|:--|--:|:--|
| A.2 | current | 836 | boss: Rift Harbinger (82); elite: vampire (44); elite: berserker (43); boss: The Abyssal Guardian (43); boss: Ember Sovereign (42); Ember Imp (37) |
| A.2 | A | 691 | boss: Rift Harbinger (117); boss: The Abyssal Guardian (70); boss: Ember Sovereign (68); elite: vampire (30); Cinder Demon (27); Ancient Rootkeeper (25) |
| A.2 | B | 489 | boss: Rift Harbinger (86); boss: Ember Sovereign (74); boss: The Abyssal Guardian (73); Tempest Hawk (24); Ember Imp (17); elite: vampire (14) |
| B.1 | current | 808 | boss: Rift Harbinger (70); boss: Ember Sovereign (67); boss: The Abyssal Guardian (45); Ember Imp (36); Stormglass Knight (36); elite: vampire (34) |
| B.1 | A | 638 | boss: Ember Sovereign (77); boss: Rift Harbinger (72); boss: The Abyssal Guardian (53); Sanguine Leech (26); Ember Imp (24); Cinder Demon (24) |
| B.1 | B | 450 | boss: Rift Harbinger (62); boss: Ember Sovereign (57); boss: The Abyssal Guardian (51); Ember Imp (24); Cinder Demon (20); Venom Spider (19) |

Em E50, bosses são a maior causa agregada. A curva B reduz essas mortes, mas também permite que Bow, Two-Handed e Daggers concluam quase todas as corridas, enquanto Wand/Orb e Plate Sword continuam abaixo da meta. Uma redução geral não corrige essa dispersão.

## Recomendação numérica e limitações

- **E10:** HP 100%, Attack 100%. A curva B aproxima a média, mas combina runs B.1/triple acima do alvo com A.2/random abaixo.
- **E50:** HP 100%, Attack 100%. Rejeitar A e B: B produz Bow/Two-Handed/Daggers dominantes, enquanto Wand/Orb e Plate Sword continuam muito abaixo do alvo; A também amplia a vantagem de Bow.
- **E100:** HP 100%, Attack 100%. B aproxima a média geral, mas a política random continua abaixo da banda em ambos os perfis e Bow permanece acima das outras builds.
- **E200+:** HP 100%, Attack 100%; preserva a fórmula original. A diferença de vitórias entre builds continua alta, logo uma escala comum de inimigos não a resolve.

Os resultados não suportam propor novos números de arma/armadura nesta fase: o desempenho de cada build muda materialmente entre os perfis A.2 e B.1, portanto qualquer alteração de arma confundiria o efeito de affinity. Recomendo primeiro uma experiência controlada de build/affinity focada em Bow, Two-Handed, Daggers, Wand/Orb e Plate Sword/Shield; só depois testar uma alteração numérica específica de item. Esta recomendação não altera valores permanentes.

| E | Média atual | Média A | Média B | Menor–maior taxa individual na curva B |
|--:|--:|--:|--:|:--|
| 10 | 289/1792 (16.1%) | 546/1792 (30.5%) | 851/1792 (47.5%) | 35.2–62.1% (Leather Two-Handed) |
| 50 | 148/1792 (8.3%) | 463/1792 (25.8%) | 853/1792 (47.6%) | 12.9–99.2% (Leather Bow) |
| 100 | 284/1792 (15.8%) | 383/1792 (21.4%) | 453/1792 (25.3%) | 8.2–61.7% (Leather Bow) |
| 200 | 678/1792 (37.8%) | 678/1792 (37.8%) | 678/1792 (37.8%) | 3.1–75.8% (Leather Bow) |

## Validação e segurança

- Simulação: 21,504 corridas, 64 seeds/célula, **0 erros e 0 timeouts**; os 336 blocos foram agregados sem seeds repetidas.
- Regressão no snapshot limpo B.1: 22/23 test files passaram; `private-preview` falhou porque este sandbox bloqueia bind a `127.0.0.1` (reproduzido como EPERM). Na worktree com UX local, 21/23 passaram; além da limitação de loopback, `runtime-integration` não corresponde ao fixture trace UX de poções. O teste de runtime integração passou no snapshot limpo.
- Scripts do B.2 alteram apenas o harness de simulação; nenhuma regra de combate/economia foi aplicada permanentemente. Não houve alteração de `main`, deploy, Firebase, Railway ou saves.

Fonte das métricas: `/tmp/v012-phase-b2-calibration-clean.json` gerada pelo runner B.2 a partir do snapshot limpo B.1. A matriz completa é reproduzível com `scripts/v012-difficulty-calibration-run.sh`; parâmetros das âncoras estão no próprio runner.
