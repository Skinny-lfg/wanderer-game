# Wanderer v0.12 — Fase A.2: calibração final das armas

Data: 2026-10-20  |  Branch: `development`  |  Base de comparação: Fase A.1.

## Coeficientes aplicados

| Sistema | Fase A.1 | Fase A.2 |
|:--|--:|--:|
| Bow: Attack do item | `power × 1.40 + 5` | `power × 1.18 + 5` |
| Two-Handed: Attack do item | `power × 2.10 + 7` | `power × 1.75 + 7` |
| Daggers: dano por golpe | `0.72 × Attack` | `0.80 × Attack` |
| Sword: dano por golpe | `1.00 × Attack` | `1.12 × Attack` |
| Wand: multiplicador mágico | `0.95` | `1.05` |
| Wand: Spell Power do item | `power + 2` | `power × 1.15 + 2` |
| Wand + Orb: Barrier por cast financiado | — | `2.5% Max HP`, cooldown de 6 s |
| Sword + Shield: Block Reduction | `58%` | `62%` |

Staff, Mace, velocidade das armas e cadência A.1 (incluindo o teto efetivo de 4,2 ataques/s) ficaram inalterados. Mace manteve 67% Block Reduction. Bow, Two-Handed, Dagger, Sword e Wand mantiveram os restantes atributos do item inalterados. A Barrier do Orb usa o helper existente, respeitando o cap atual.

## Método e controle de afinidades

Foram executadas 672 simulações A.2, emparelhadas por chave e seed com as 672 linhas Rare/Epic E50/E100/E200 de Fase A.1: 7 builds × 3 níveis × 2 raridades × 8 repetições × estratégias `triple` e `random`. Seed offset `29000000`; mesmas Runas equivalentes, equipamentos por raridade, estratégias e script de simulação. Sem os 12 Legendaries novos, poções, eventos escolhidos ou gear swaps. A matriz teve 0 erros e 0 timeouts.

Os 672 pares mantiveram o mesmo `targetFamilies` intencional. A rota de affinities efetivamente percorrida teve prefixo igual até ao menor Realm alcançado em **234/672 pares**. Combates e maior progressão alteram o consumo aleatório e podem alterar escolhas/rotas seguintes. Assim, as tabelas abaixo mostram outcomes da execução pareada e separam explicitamente os pares com a mesma sequência de rotas; vitórias, Realms e DPS totais não devem ser atribuídos exclusivamente ao coeficiente da arma quando o prefixo de rota difere.

Métricas: ataques/s real = weapon attacks ÷ combat seconds; DPS inclui dano direto e DoT; survivability budget observado = Max HP + cura efetiva + Barrier absorvida. O último não inclui dano evitado por Block. Block chance permaneceu igual; Sword + Shield teve o fator de redução alterado de 58% para 62%.

## E50

| Raridade | Build | Vitórias /16 (A.1→A.2) | Realms médios | DPS médio | Ataques/s real | Cura/s | Barrier/s | Budget sobrevivência | Rotas iguais /16 |
|:--|:--|--:|--:|--:|--:|--:|--:|--:|--:|
| Rare | Cloth Staff | 0 → 0 | 3.69 → 3.69 | 534.5 → 534.5 | 1.270 → 1.270 | 0.02 → 0.02 | 7.17 → 7.17 | 1273 → 1273 | 16/16 |
| Rare | Cloth Wand/Orb | 0 → 0 | 2.44 → 3.06 | 421.8 → 478.1 | 1.258 → 1.264 | 0.00 → 0.04 | 0.00 → 5.39 | 1150 → 1226 | 6/16 |
| Rare | Plate Mace/Shield | 0 → 0 | 3.56 → 3.56 | 303.0 → 303.0 | 0.726 → 0.726 | 3.45 → 3.45 | 0.00 → 0.00 | 1813 → 1813 | 16/16 |
| Rare | Plate Sword/Shield | 0 → 0 | 3.38 → 4.38 | 304.4 → 344.5 | 1.096 → 1.100 | 2.97 → 3.61 | 0.68 → 1.33 | 1787 → 1855 | 4/16 |
| Rare | Leather Dual Daggers | 0 → 0 | 7.13 → 6.00 | 614.9 → 680.6 | 3.769 → 3.656 | 0.46 → 0.00 | 0.40 → 0.40 | 1205 → 1162 | 0/16 |
| Rare | Leather Bow | 0 → 0 | 6.25 → 7.00 | 717.6 → 673.1 | 3.008 → 3.033 | 0.26 → 0.80 | 0.18 → 0.04 | 1182 → 1209 | 0/16 |
| Rare | Leather Two-Handed | 0 → 0 | 7.00 → 7.44 | 661.9 → 613.7 | 1.325 → 1.329 | 0.26 → 0.35 | 5.68 → 5.13 | 1307 → 1285 | 1/16 |
| Epic | Cloth Staff | 0 → 0 | 7.31 → 7.31 | 632.6 → 632.6 | 1.273 → 1.273 | 0.14 → 0.14 | 9.72 → 9.72 | 1706 → 1706 | 16/16 |
| Epic | Cloth Wand/Orb | 0 → 0 | 4.31 → 5.50 | 479.4 → 538.7 | 1.277 → 1.280 | 0.00 → 0.17 | 0.95 → 7.35 | 1500 → 1661 | 2/16 |
| Epic | Plate Mace/Shield | 0 → 0 | 9.69 → 9.69 | 382.5 → 382.5 | 0.770 → 0.770 | 8.46 → 8.46 | 2.28 → 2.28 | 2841 → 2841 | 16/16 |
| Epic | Plate Sword/Shield | 0 → 0 | 7.94 → 8.50 | 383.8 → 419.0 | 1.148 → 1.126 | 6.64 → 6.68 | 2.06 → 1.49 | 2614 → 2589 | 1/16 |
| Epic | Leather Dual Daggers | 1 → 6 | 11.75 → 14.88 | 826.6 → 932.7 | 3.784 → 3.804 | 0.07 → 1.92 | 0.71 → 0.27 | 1514 → 1590 | 0/16 |
| Epic | Leather Bow | 5 → 2 | 14.50 → 14.19 | 947.5 → 889.3 | 3.174 → 3.188 | 2.77 → 1.56 | 0.34 → 0.48 | 1718 → 1596 | 0/16 |
| Epic | Leather Two-Handed | 7 → 1 | 14.44 → 13.25 | 872.0 → 801.3 | 1.385 → 1.387 | 2.68 → 1.29 | 6.97 → 7.13 | 1823 → 1790 | 0/16 |

## E100

| Raridade | Build | Vitórias /16 (A.1→A.2) | Realms médios | DPS médio | Ataques/s real | Cura/s | Barrier/s | Budget sobrevivência | Rotas iguais /16 |
|:--|:--|--:|--:|--:|--:|--:|--:|--:|--:|
| Rare | Cloth Staff | 0 → 0 | 6.25 → 6.25 | 1323.1 → 1323.1 | 1.600 → 1.600 | 0.06 → 0.06 | 13.76 → 13.76 | 2356 → 2356 | 16/16 |
| Rare | Cloth Wand/Orb | 0 → 0 | 2.25 → 2.81 | 948.4 → 1097.6 | 1.561 → 1.566 | 0.00 → 0.06 | 0.00 → 9.81 | 2136 → 2320 | 6/16 |
| Rare | Plate Mace/Shield | 0 → 0 | 5.81 → 5.81 | 736.8 → 736.8 | 0.917 → 0.917 | 7.86 → 7.86 | 1.31 → 1.31 | 3511 → 3511 | 16/16 |
| Rare | Plate Sword/Shield | 0 → 0 | 4.63 → 5.63 | 675.4 → 766.8 | 1.267 → 1.300 | 5.81 → 6.70 | 0.90 → 1.86 | 3381 → 3475 | 2/16 |
| Rare | Leather Dual Daggers | 0 → 0 | 4.94 → 5.63 | 1204.8 → 1386.6 | 3.978 → 3.997 | 0.50 → 0.22 | 0.00 → 0.26 | 2150 → 2191 | 1/16 |
| Rare | Leather Bow | 0 → 0 | 8.25 → 7.25 | 1496.5 → 1335.7 | 3.428 → 3.342 | 0.00 → 0.32 | 0.42 → 0.17 | 2149 → 2180 | 1/16 |
| Rare | Leather Two-Handed | 0 → 0 | 6.31 → 6.44 | 1354.8 → 1263.0 | 1.442 → 1.438 | 0.20 → 0.27 | 9.53 → 9.37 | 2344 → 2286 | 5/16 |
| Epic | Cloth Staff | 4 → 4 | 9.81 → 9.81 | 1555.4 → 1555.4 | 1.629 → 1.629 | 0.41 → 0.41 | 17.83 → 17.83 | 3203 → 3203 | 16/16 |
| Epic | Cloth Wand/Orb | 0 → 1 | 5.50 → 7.38 | 1174.9 → 1364.1 | 1.574 → 1.601 | 0.35 → 0.11 | 2.38 → 13.40 | 2840 → 3092 | 2/16 |
| Epic | Plate Mace/Shield | 4 → 4 | 12.06 → 12.06 | 935.5 → 935.5 | 0.991 → 0.991 | 20.27 → 20.27 | 4.40 → 4.40 | 5650 → 5650 | 16/16 |
| Epic | Plate Sword/Shield | 0 → 2 | 10.94 → 11.06 | 875.9 → 983.3 | 1.356 → 1.361 | 17.46 → 15.52 | 5.17 → 1.87 | 5545 → 5156 | 0/16 |
| Epic | Leather Dual Daggers | 0 → 5 | 13.69 → 14.69 | 1657.4 → 1842.2 | 3.998 → 3.982 | 0.52 → 5.93 | 1.61 → 1.75 | 2836 → 3115 | 0/16 |
| Epic | Leather Bow | 7 → 2 | 13.88 → 12.19 | 2001.7 → 1803.8 | 3.534 → 3.447 | 2.07 → 2.46 | 1.98 → 0.26 | 2971 → 2946 | 0/16 |
| Epic | Leather Two-Handed | 9 → 3 | 14.81 → 13.81 | 1850.4 → 1684.7 | 1.541 → 1.556 | 4.77 → 2.95 | 12.93 → 12.82 | 3405 → 3257 | 0/16 |

## E200

| Raridade | Build | Vitórias /16 (A.1→A.2) | Realms médios | DPS médio | Ataques/s real | Cura/s | Barrier/s | Budget sobrevivência | Rotas iguais /16 |
|:--|:--|--:|--:|--:|--:|--:|--:|--:|--:|
| Rare | Cloth Staff | 1 → 1 | 5.75 → 5.75 | 2868.0 → 2868.0 | 1.783 → 1.783 | 0.58 → 0.58 | 28.58 → 28.58 | 4572 → 4572 | 16/16 |
| Rare | Cloth Wand/Orb | 0 → 0 | 4.00 → 4.75 | 2322.9 → 2571.6 | 1.785 → 1.769 | 0.00 → 0.32 | 1.75 → 21.88 | 4161 → 4485 | 3/16 |
| Rare | Plate Mace/Shield | 0 → 0 | 9.44 → 9.44 | 1892.2 → 1892.2 | 1.265 → 1.265 | 17.93 → 17.93 | 2.00 → 2.00 | 7232 → 7232 | 16/16 |
| Rare | Plate Sword/Shield | 0 → 0 | 5.00 → 6.88 | 1648.2 → 1818.4 | 1.638 → 1.616 | 11.57 → 11.76 | 1.11 → 3.59 | 6564 → 6758 | 1/16 |
| Rare | Leather Dual Daggers | 0 → 0 | 5.88 → 5.38 | 2424.8 → 2769.2 | 4.104 → 4.062 | 0.56 → 0.62 | 0.00 → 0.72 | 4163 → 4250 | 0/16 |
| Rare | Leather Bow | 0 → 0 | 8.81 → 6.38 | 3175.6 → 2943.3 | 3.842 → 3.843 | 1.33 → 0.00 | 1.38 → 0.00 | 4220 → 4241 | 1/16 |
| Rare | Leather Two-Handed | 0 → 2 | 8.75 → 9.31 | 3195.8 → 3023.6 | 1.743 → 1.755 | 0.50 → 1.60 | 19.56 → 19.67 | 4704 → 4601 | 5/16 |
| Epic | Cloth Staff | 3 → 3 | 11.25 → 11.25 | 3317.1 → 3317.1 | 1.780 → 1.780 | 9.43 → 9.43 | 37.25 → 37.25 | 6574 → 6574 | 16/16 |
| Epic | Cloth Wand/Orb | 0 → 3 | 8.19 → 11.13 | 2727.0 → 3091.0 | 1.819 → 1.838 | 0.54 → 2.74 | 3.82 → 33.90 | 5537 → 6364 | 1/16 |
| Epic | Plate Mace/Shield | 8 → 8 | 14.69 → 14.69 | 2439.6 → 2439.6 | 1.338 → 1.338 | 53.13 → 53.13 | 8.85 → 8.85 | 11530 → 11530 | 16/16 |
| Epic | Plate Sword/Shield | 1 → 6 | 13.00 → 14.00 | 2114.2 → 2390.7 | 1.709 → 1.729 | 39.27 → 43.83 | 17.30 → 10.07 | 11415 → 11066 | 0/16 |
| Epic | Leather Dual Daggers | 0 → 7 | 13.94 → 15.00 | 3225.3 → 3678.5 | 4.049 → 4.091 | 1.95 → 5.12 | 1.52 → 2.11 | 5521 → 5681 | 0/16 |
| Epic | Leather Bow | 16 → 13 | 15.00 → 15.00 | 4290.3 → 3963.4 | 3.931 → 3.889 | 8.53 → 7.50 | 2.82 → 1.67 | 5846 → 5879 | 0/16 |
| Epic | Leather Two-Handed | 16 → 11 | 15.00 → 15.00 | 4272.7 → 3914.3 | 1.881 → 1.834 | 6.38 → 6.22 | 25.04 → 25.13 | 6028 → 6172 | 0/16 |

## Leitura dos resultados por build

| Build | E50 vitórias /32; Realm; DPS | E100 vitórias /32; Realm; DPS | E200 vitórias /32; Realm; DPS | Prefixo de affinities igual (E50/E100/E200, /32) |
|:--|:--|:--|:--|--:|
| Cloth Staff | 0→0; 5.50→5.50; 584→584 | 4→4; 8.03→8.03; 1439→1439 | 4→4; 8.50→8.50; 3093→3093 | 32 / 32 / 32 |
| Cloth Wand/Orb | 0→0; 3.38→4.28; 451→508 | 0→1; 3.88→5.09; 1062→1231 | 0→3; 6.09→7.94; 2525→2831 | 8 / 8 / 4 |
| Plate Mace/Shield | 0→0; 6.63→6.63; 343→343 | 4→4; 8.94→8.94; 836→836 | 8→8; 12.06→12.06; 2166→2166 | 32 / 32 / 32 |
| Plate Sword/Shield | 0→0; 5.66→6.44; 344→382 | 0→2; 7.78→8.34; 776→875 | 1→6; 9.00→10.44; 1881→2105 | 5 / 2 / 1 |
| Leather Dual Daggers | 1→6; 9.44→10.44; 721→807 | 0→5; 9.31→10.16; 1431→1614 | 0→7; 9.91→10.19; 2825→3224 | 0 / 1 / 0 |
| Leather Bow | 5→2; 10.38→10.59; 833→781 | 7→2; 11.06→9.72; 1749→1570 | 16→13; 11.91→10.69; 3733→3453 | 0 / 1 / 1 |
| Leather Two-Handed | 7→1; 10.72→10.34; 767→707 | 9→3; 10.56→10.13; 1603→1474 | 16→13; 11.88→12.16; 3734→3469 | 1 / 5 / 5 |

## Problemas ainda existentes

- **Bow:** apesar de item Attack mais baixo, alguns E50/E100 resultados Rare/Epic divergem com as rotas; E200 agregado cai de 16/32 para 13/32 vitórias e DPS médio de 3733 para 3453. A amostra com sequência de affinities igual é limitada, portanto esta diferença é sinal de avaliação e não estima isolada do nerf.
- **Two-Handed:** a redução de Attack diminui DPS e clears agregados em E50/E100/E200; ainda alcança Realm 15 em muitas execuções Epic E200. Confirmar se a perda de vitórias em E100/E200 é aceitável com uma bateria maior.
- **Daggers:** o aumento para 0,80 melhora E100/E200 em clears agregados (E200 0/32 → 7/32) e DPS. Continua uma build de alta cadência, com resultados dependentes dos procs e das rotas.
- **Wand + Orb:** Barrier/s sobe substancialmente pela nova proteção por cast: em E200, Rare passa de 1.75 para 21.88 e Epic de 3.82 para 33.90. Observar cap e sobrevivência em maior amostra. A build permanece menos estável nos níveis baixos.
- **Sword + Shield:** 62% de Block Reduction melhora a mitigação do hit bloqueado sem aumentar a chance de Block; E200 Rare/Epic wins agregadas mudam de 1/32 para 6/32. Block não foi alterado em Mace + Shield.
- A comparação tem 16 execuções por célula; a composição efetiva de affinities diverge em muitos pares. Para conclusões finais isoladas dos stats de arma, ampliar seeds e repetir com rotas e picks de affinities fixados.

Staff e Mace não receberam coeficientes A.2; as diferenças medidas nas suas linhas devem ser zero no paired run. Agility, Strength, Intelligence, Evasion, chances de Block, inimigos, loot, Runas, Legendaries e fórmulas de cadência também não foram alterados.

## Regressão

- `node --test tests/v0120-equipment.test.cjs`: PASS, incluindo coeficientes de item, dano por golpe, wand/orb, cap/cooldown da Barrier, Sword/Shield e projeção PvP de Block Reduction.
- `node --test tests/v012-runtime-integration.test.cjs`: PASS em snapshot limpo com fixtures A.2, 21 cenários.
- `node scripts/build-pvp-stats.cjs --check`: PASS.
- `npm test` em snapshot limpo: 21/22 ficheiros passaram; somente `tests/private-preview.test.mjs` falhou por `listen EPERM` em `127.0.0.1` no ambiente sandbox. Os testes de combate, equipamento, saves e compatibilidade passaram.
- Simulação pareada: 672/672 execuções PASS, sem erro/timeouts.

A versão A.1 base foi o commit `0043764`. Os resultados A.1 usados estão em `/tmp/wanderer-phase-a1-results.json`; os A.2 em `/tmp/wanderer-phase-a2-results.json` durante a validação. Nenhuma alteração foi feita em `main`, Firebase, Railway ou saves reais.
