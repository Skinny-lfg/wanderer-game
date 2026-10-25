# Wanderer v0.12 — Fase B.3: calibração direcionada

Data: 2026-10-21 · Branch: `development` · Base: `15e8bd8`

## Método

O harness B.1 foi executado sobre um arquivo limpo de `15e8bd8`, sem as alterações UX do worktree. Foram usados equipamento Epic em todos os slots aplicáveis e três Runas equivalentes (Vitality, Warding e Wisdom para Staff/Wand, Might para os restantes), sem poções, Legendaries, troca de equipamento nem benefícios de eventos. As escolhas de eventos foram recusadas. Inimigos mantiveram HP, Attack e Defense atuais. Cada combinação de arma, perfil de affinities, E50/E100/E200 e política (`triple` ou `random`) usou 64 seeds. As streams de combate, ofertas, passivos e controlo do harness são independentes. O mesmo par de seed/política/nível/arma foi usado nos dois perfis e no controlo/variante.

Os cinco candidatos foram aplicados exclusivamente por substituição de fonte no VM do harness. Cada substituição verifica que encontra exatamente um ponto de intervenção no runtime de base. Nenhum candidato foi combinado com outro. A evasão dos Daggers aplica Barrier só após um dodge físico, usa `setReady` com 6 s e `setBarrier` com o cap nativo. O contra-ataque da Sword mantém `setDirectEnemyDamage`, que não desencadeia procs recursivos. Staff e Mace são controlos sem variantes. Os perfis são apenas cenários de teste, sem restrições de affinities no jogo.

`Vitórias` indica completar 15 Realms; Realm média inclui a Realm em que a run morreu. DPS é dano total dividido pelos segundos de combate. HP restante é medido só nas vitórias; as derrotas contam como zero quando calculamos a diferença pareada de HP. Dano recebido inclui dano efetivamente aplicado depois de Block/Evasion, e o orçamento EHP observado soma HP máximo, cura e Barrier efetivamente absorvida. Uma alteração de DPS pode também refletir diferença na duração/sobrevivência, por isso é interpretada junto das restantes métricas. Para verificar o pareamento, comparamos o prefixo comum das rotas e dos passivos de cada par; rotas adicionais são esperadas quando uma variante chega mais longe.

## Perfis comparados

| Arma | Perfil A | Perfil B |
|:--|:--|:--|
| Staff | Magic/Aegis/Decay | Magic/Aegis/Vitality |
| Wand + Orb | Magic/Aegis/Decay | Magic/Aegis/Vitality |
| Sword + Shield | Vitality/Aegis/Fury | Blood/Decay/Magic |
| Mace + Shield | Vitality/Aegis/Fury | controlo único |
| Dual Daggers | Decay/Fury/Blood | Blood/Decay/Vitality |
| Bow | Decay/Fury/Blood | Fury/Magic/Blood |
| Two-Handed | Decay/Fury/Blood | Blood/Decay/Magic |

## Candidatos isolados

| Arma | Valor atual | Candidato em memória |
|:--|:--|:--|
| Daggers | Sem Barrier no dodge | Dodge físico por Evasion: 3% Max HP de Barrier, cooldown 6 s |
| Wand + Orb | Spell Power do Orb = `power` | Spell Power do Orb = `round(power × 1,12)` |
| Sword + Shield | Contra-ataque = 45% do dano-base, cooldown 2,5 s | 65% do dano-base, mesmo cooldown |
| Bow | Attack do item = `round(power × 1,18) + 5` | `round(power × 1,12) + 5` |
| Two-Handed | Attack do item = `round(power × 1,75) + 7` | `round(power × 1,65) + 7` |

## Resultados e decisão

**Recomendação para uma fase posterior:** levar à implementação apenas os candidatos de Wand + Orb, Sword + Shield e Dual Daggers, com uma nova regressão antes de alterar produção. Conservar os coeficientes atuais de Bow e Two-Handed. Esta fase não aplica nenhum deles ao jogo.

| Arma | Decisão | Evidência pareada, 768 runs por candidato |
|:--|:--|:--|
| Staff | Conservar (controlo) | As duas rotas mudam pouco as vitórias em E50/E100; Magic/Aegis/Vitality melhora 44→49/128 em E200, sem justificar ajuste da arma. |
| Wand + Orb | Recomendar `Orb ×1,12` | 41→51 vitórias, Realm média +0,37 e DPS +40,87; 11 ganhos contra uma perda pareada. A melhoria é sobretudo E200; em E50 há 0 vitórias nos dois perfis, logo não resolve a fraqueza inicial. |
| Sword + Shield | Recomendar contra-ataque de 65% | 74→79 vitórias, Realm média +0,27 e DPS +17,07. A rota Vitality/Aegis/Fury concentra os ganhos; Blood/Decay/Magic continua fraca. O ganho de vitória é pequeno (16 ganhos, 11 perdas pareadas), mas a progressão sobe de forma consistente sem dominância. |
| Mace + Shield | Conservar (controlo) | Sem variante; serve de referência da armadura Plate e da rota Vitality/Aegis/Fury. |
| Dual Daggers | Recomendar Barrier de dodge | 13→16 vitórias e Realm média +0,31, sem elevar DPS (−0,30). Barrier/s sobe em média +7,33 e nenhuma vitória pareada é perdida. A sobrevivência melhora, mas a taxa em E200 permanece muito baixa; este único passivo não basta. |
| Bow | Conservar `×1,18` | O nerf reduz 420→381 vitórias, mas a Realm média cai só 0,07. Em E50 retira 12 vitórias ao perfil Decay/Fury/Blood e nenhuma ao perfil Fury/Magic/Blood, ampliando a dependência da affinity; em E200 Bow continua dominante. |
| Two-Handed | Conservar `×1,75` | O nerf reduz 258→189 vitórias, Realm média −0,38 e HP pareado −119; penaliza ambos os perfis, inclusive o mais fraco em E50/E100. |

O efeito do perfil é materialmente maior que o de vários candidatos: Sword em E200 tem 48/128 vitórias com Vitality/Aegis/Fury e 7/128 com Blood/Decay/Magic; Bow em E100 tem 36/128 com Decay/Fury/Blood e 91/128 com Fury/Magic/Blood. Estes resultados são de perfis de teste, não implicam afinidades obrigatórias por arma. As diferenças de HP nas tabelas seguintes devem ser lidas com as vitórias, pois uma nova vitória altera o conjunto usado na média de HP dos vencedores.

### Efeito do perfil de affinities, sem alterar armas

Cada célula mostra vitórias/128 (triple + random), Realm média, DPS e HP restante médio nas vitórias. As políticas mantêm 64 seeds cada.

| E | Arma | Perfil A: vitórias · Realm · DPS · HP | Perfil B: vitórias · Realm · DPS · HP |
|--:|:--|:--|:--|
| 50 | Staff | 3/128 · 8.1 · 634.4 · 284.5 | 4/128 · 8.6 · 632.9 · 236.9 |
| 50 | Wand + Orb | 0/128 · 6.4 · 561.8 · 0 | 0/128 · 6.5 · 559.4 · 0 |
| 50 | Sword + Shield | 1/128 · 9.5 · 437.3 · 283.5 | 0/128 · 8.4 · 440.5 · 0 |
| 50 | Mace + Shield | 0/128 · 8.4 · 380 · 0 | controlo único |
| 50 | Dual Daggers | 6/128 · 12.5 · 763.5 · 227.1 | 2/128 · 11.5 · 738.5 · 169.1 |
| 50 | Bow | 32/128 · 13.1 · 873.7 · 326.6 | 59/128 · 14.2 · 948.2 · 336.7 |
| 50 | Two-Handed | 27/128 · 13.2 · 808.3 · 343.1 | 11/128 · 13.2 · 769.2 · 188.3 |
| 100 | Staff | 8/128 · 9.1 · 1499.3 · 984.2 | 7/128 · 9.4 · 1483.3 · 847.7 |
| 100 | Wand + Orb | 1/128 · 7.9 · 1341.2 · 51 | 0/128 · 8.2 · 1341.3 · 0 |
| 100 | Sword + Shield | 18/128 · 12.5 · 971.7 · 743.3 | 0/128 · 10.5 · 948.9 · 0 |
| 100 | Mace + Shield | 19/128 · 12.1 · 923.5 · 901.9 | controlo único |
| 100 | Dual Daggers | 1/128 · 11.4 · 1511 · 152 | 2/128 · 11.6 · 1508.7 · 949.3 |
| 100 | Bow | 36/128 · 13.2 · 1832.2 · 625.7 | 91/128 · 14.9 · 1989.4 · 816.1 |
| 100 | Two-Handed | 34/128 · 13.3 · 1673.3 · 505.2 | 23/128 · 13.4 · 1591.9 · 547.7 |
| 200 | Staff | 44/128 · 12.2 · 3448.8 · 1665 | 49/128 · 12.5 · 3434.6 · 1997 |
| 200 | Wand + Orb | 18/128 · 10.9 · 3152.8 · 1050.5 | 22/128 · 10.9 · 3124 · 954.5 |
| 200 | Sword + Shield | 48/128 · 14.4 · 2380 · 1678.9 | 7/128 · 13.2 · 2337.7 · 884.6 |
| 200 | Mace + Shield | 48/128 · 14.4 · 2460.5 · 1460 | controlo único |
| 200 | Dual Daggers | 1/128 · 11.1 · 3017.8 · 35 | 1/128 · 11.7 · 3028.5 · 1089.3 |
| 200 | Bow | 92/128 · 15 · 3969.3 · 1742.9 | 110/128 · 15 · 4170.5 · 1936.9 |
| 200 | Two-Handed | 91/128 · 14.8 · 3926.9 · 2013.5 | 72/128 · 14.8 · 3719 · 1659.5 |

### Candidatos isolados contra o controlo atual

Cada linha reúne 128 pares (64 triple + 64 random). Vitórias mostram o total e, entre parênteses, triple/random separadamente. HP é a média nas vitórias; dano recebido e Barrier/s são médias de todas as corridas. Prefixo mostra quantos dos 128 pares mantiveram as mesmas escolhas de rotas e passivos enquanto ambas as runs estavam ativas.

| E | Arma · perfil | Vitórias C → V (triple/random) | Realm C → V | DPS C → V | HP C → V | Dano recebido C → V | Barrier/s C → V | Prefixo rota/passivo |
|--:|:--|:--|:--|:--|:--|:--|:--|:--|
| 50 | Wand + Orb · magic/aegis/decay | 0/128 → 0/128 (0→0 / 0→0) | 6.4 → 6.7 | 561.8 → 580.4 | 0 → 0 | 1726.7 → 1723.6 | 7.9 → 8 | 128/128 |
| 50 | Wand + Orb · magic/aegis/vitality | 0/128 → 0/128 (0→0 / 0→0) | 6.5 → 6.8 | 559.4 → 577.2 | 0 → 0 | 1766.1 → 1777.9 | 7.9 → 8 | 128/128 |
| 50 | Sword + Shield · vitality/aegis/fury | 1/128 → 2/128 (0→1 / 1→1) | 9.5 → 10 | 437.3 → 448.9 | 283.5 → 295.3 | 2529.4 → 2577.4 | 1.7 → 1.9 | 128/128 |
| 50 | Sword + Shield · blood/decay/magic | 0/128 → 0/128 (0→0 / 0→0) | 8.4 → 8.8 | 440.5 → 448.5 | 0 → 0 | 2044.5 → 2060.4 | 0.3 → 0.2 | 128/128 |
| 50 | Dual Daggers · decay/fury/blood | 6/128 → 7/128 (5→5 / 1→2) | 12.5 → 12.6 | 763.5 → 762.7 | 227.1 → 233.6 | 1653.3 → 1712.3 | 0.4 → 3.8 | 128/128 |
| 50 | Dual Daggers · blood/decay/vitality | 2/128 → 2/128 (2→2 / 0→0) | 11.5 → 12 | 738.5 → 738.8 | 169.1 → 244.4 | 1746.9 → 1830.5 | 0.3 → 3.8 | 128/128 |
| 50 | Bow · decay/fury/blood | 32/128 → 20/128 (24→16 / 8→4) | 13.1 → 12.8 | 873.7 → 860.8 | 326.6 → 327.9 | 1583 → 1603.8 | 0.3 → 0.2 | 128/128 |
| 50 | Bow · fury/magic/blood | 59/128 → 59/128 (40→40 / 19→19) | 14.2 → 14.1 | 948.2 → 936.8 | 336.7 → 280.6 | 1489.2 → 1513.5 | 0.3 → 0.3 | 128/128 |
| 50 | Two-Handed · decay/fury/blood | 27/128 → 18/128 (24→18 / 3→0) | 13.2 → 12.8 | 808.3 → 788 | 343.1 → 278.5 | 1713.6 → 1742.1 | 6.9 → 6.8 | 128/128 |
| 50 | Two-Handed · blood/decay/magic | 11/128 → 5/128 (4→2 / 7→3) | 13.2 → 12.8 | 769.2 → 752 | 188.3 → 354.8 | 1799.8 → 1807.9 | 6.7 → 6.7 | 128/128 |
| 100 | Wand + Orb · magic/aegis/decay | 1/128 → 1/128 (1→1 / 0→0) | 7.9 → 8.3 | 1341.2 → 1374.3 | 51 → 686 | 3262.1 → 3291.4 | 15.6 → 15.8 | 128/128 |
| 100 | Wand + Orb · magic/aegis/vitality | 0/128 → 0/128 (0→0 / 0→0) | 8.2 → 8.6 | 1341.3 → 1374.9 | 0 → 0 | 3376.4 → 3420.2 | 16.1 → 16.2 | 128/128 |
| 100 | Sword + Shield · vitality/aegis/fury | 18/128 → 21/128 (15→15 / 3→6) | 12.5 → 12.6 | 971.7 → 983.3 | 743.3 → 718.5 | 5252.7 → 5224.9 | 5.8 → 5.8 | 128/128 |
| 100 | Sword + Shield · blood/decay/magic | 0/128 → 0/128 (0→0 / 0→0) | 10.5 → 10.9 | 948.9 → 962.5 | 0 → 0 | 3997.6 → 3988.4 | 0.8 → 0.9 | 128/128 |
| 100 | Dual Daggers · decay/fury/blood | 1/128 → 1/128 (0→0 / 1→1) | 11.4 → 11.8 | 1511 → 1510.6 | 152 → 317.6 | 3059.4 → 3180.5 | 0.8 → 7.3 | 128/128 |
| 100 | Dual Daggers · blood/decay/vitality | 2/128 → 3/128 (1→1 / 1→2) | 11.6 → 12 | 1508.7 → 1509.5 | 949.3 → 803.4 | 3286.2 → 3404.4 | 1.3 → 8 | 128/128 |
| 100 | Bow · decay/fury/blood | 36/128 → 37/128 (27→24 / 9→13) | 13.2 → 13.2 | 1832.2 → 1803.8 | 625.7 → 741.5 | 2894 → 2850.2 | 0.9 → 0.9 | 128/128 |
| 100 | Bow · fury/magic/blood | 91/128 → 80/128 (46→42 / 45→38) | 14.9 → 14.9 | 1989.4 → 1953.3 | 816.1 → 818.3 | 2420.4 → 2556 | 0.9 → 1 | 128/128 |
| 100 | Two-Handed · decay/fury/blood | 34/128 → 21/128 (25→17 / 9→4) | 13.3 → 12.6 | 1673.3 → 1632.1 | 505.2 → 530 | 3218.4 → 3258.2 | 12.6 → 12.7 | 128/128 |
| 100 | Two-Handed · blood/decay/magic | 23/128 → 13/128 (10→7 / 13→6) | 13.4 → 13.1 | 1591.9 → 1555.3 | 547.7 → 323.9 | 3373 → 3441.1 | 12.6 → 12.7 | 128/128 |
| 200 | Wand + Orb · magic/aegis/decay | 18/128 → 25/128 (4→7 / 14→18) | 10.9 → 11.2 | 3152.8 → 3226.3 | 1050.5 → 1135.5 | 6376.7 → 6243 | 33.5 → 33.7 | 128/128 |
| 200 | Wand + Orb · magic/aegis/vitality | 22/128 → 25/128 (8→7 / 14→18) | 10.9 → 11.3 | 3124 → 3192.6 | 954.5 → 1164.2 | 6661.5 → 6612.1 | 34 → 34.4 | 128/128 |
| 200 | Sword + Shield · vitality/aegis/fury | 48/128 → 49/128 (31→33 / 17→16) | 14.4 → 14.4 | 2380 → 2412.8 | 1678.9 → 1830.3 | 10139.1 → 9981.3 | 11.9 → 12 | 128/128 |
| 200 | Sword + Shield · blood/decay/magic | 7/128 → 7/128 (1→0 / 6→7) | 13.2 → 13.4 | 2337.7 → 2362.6 | 884.6 → 1470.3 | 7993.5 → 8042.9 | 2.5 → 3 | 128/128 |
| 200 | Dual Daggers · decay/fury/blood | 1/128 → 2/128 (1→1 / 0→1) | 11.1 → 11.4 | 3017.8 → 3018.6 | 35 → 198.4 | 5988.2 → 6211.1 | 1.9 → 14 | 128/128 |
| 200 | Dual Daggers · blood/decay/vitality | 1/128 → 1/128 (0→0 / 1→1) | 11.7 → 11.9 | 3028.5 → 3025.9 | 1089.3 → 1148.1 | 6465 → 6675 | 1.4 → 13.2 | 128/128 |
| 200 | Bow · decay/fury/blood | 92/128 → 82/128 (49→40 / 43→42) | 15 → 14.9 | 3969.3 → 3903.2 | 1742.9 → 1727.7 | 4658.6 → 4851.2 | 1.8 → 1.8 | 128/128 |
| 200 | Bow · fury/magic/blood | 110/128 → 103/128 (60→54 / 50→49) | 15 → 15 | 4170.5 → 4091.3 | 1936.9 → 1910.3 | 3984.9 → 4175.4 | 1.6 → 1.6 | 128/128 |
| 200 | Two-Handed · decay/fury/blood | 91/128 → 77/128 (54→45 / 37→32) | 14.8 → 14.7 | 3926.9 → 3789.7 | 2013.5 → 1842 | 4743.9 → 5202.1 | 25 → 25 | 128/128 |
| 200 | Two-Handed · blood/decay/magic | 72/128 → 55/128 (28→21 / 44→34) | 14.8 → 14.6 | 3719 → 3593.5 | 1659.5 → 1605.8 | 5482.6 → 5765.7 | 25.1 → 24.7 | 128/128 |

Nota: a média de HP das vitórias pode mudar quando o conjunto de vencedores muda. A diferença de HP pareada com derrotas a zero, as mudanças de Realm e dano recebido foram consultadas antes das decisões.


## Validação e limites

Foram gerados **138 chunks × 64 seeds = 8.832 corridas** (4.992 controlos, 3.840 candidatos). Não houve erros ou timeouts. Os 3.840 pares controlo/candidato conservaram o mesmo prefixo de rotas e passivos (`3.840/3.840` para ambos), incluindo os casos em que uma run acabou antes da outra. A comparação entre perfis usa a mesma seed, mas as escolhas de affinities diferentes conduzem naturalmente a rotas e drafts diferentes: apenas 399/2.304 pares mantiveram o prefixo das rotas e 395/2.304 o dos passivos. Por isso, o efeito do perfil não foi atribuído ao coeficiente da arma. O script de agregação rejeita chunks incompletos e casos com erro/timeout.

No arquivo limpo, os testes direcionados `v012-affinity-phase-b1`, `v012-runtime-integration`, `v0120-evasion` e `v0120-equipment` passaram **4/4**. `npm test` passou **22/23** ficheiros; `private-preview.test.mjs` falhou antes das asserções porque o sandbox não permite `listen(127.0.0.1)` (`EPERM`). Esse teste já era um limite ambiental conhecido na B.2 e não é coberto por esta validação local. Os três scripts `.cjs` passam `node --check` e o shell passa `bash -n`.

Limites: 64 seeds por célula/política ainda geram amostras pequenas quando a taxa de vitória é quase zero; perfis e políticas aqui não cobrem todas as decisões possíveis dos jogadores. O harness usa equipamento sintético Epic da base e recusa eventos; não mede o efeito de poções, Legendaries, gear swaps ou benefícios de eventos. O teste do Orb aplica o arredondamento nativo do item (`round(power × 1,12)`), sem alterar o Spell Power total de outras fontes. A Barrier dos Daggers fica sujeita ao cap nativo. A opção de Sword mantém 2,5 s e usa dano direto, sem procs recursivos. Nenhuma alteração foi feita a HP, Attack ou Defense dos inimigos, a saves, Firebase, Railway ou UI.
