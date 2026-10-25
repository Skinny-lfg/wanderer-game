# Wanderer v0.12 — C.2.2: balanço final de Veil, Oathwall e Verdant Oath

Data: 2026-10-21. Branch de destino: `development`. **Estado: PASS para a correção C.2.2 medida**, com limitações descritas abaixo.

## Fontes, execução e validação

- Base de produção: C.2.1 `a48329a`; Heartroot já estava em **0,20%/0,30% Max HP/s, cap 10% por Realm**. Não foi revertido.
- Referências: [C.2.1](v012-phase-c21-legendary-calibration-results.md) e [gates C.2.1](v012-phase-c21-review-gates.md). O artefacto C.2.1 completo (`12343612098`) forneceu 576 baselines na triagem e parte das 3.936 linhas reutilizadas na confirmação.
- Simulador `scripts/v012-phase-c22-legendary-balance.cjs`, validação `scripts/v012-phase-c22-review.cjs`, [resumo numérico por perfil, nível e política](v012-phase-c22-results-summary.json). Todas as alterações candidatas foram aplicadas exclusivamente ao módulo VM; só a variante selecionada foi copiada para produção.
- Triagem: **5.280/5.280** linhas, **4.704 corridas novas** e 576 reutilizadas (16 seeds por política). Confirmação: **10.176/10.176** linhas, **6.240 corridas novas** e 3.936 reutilizadas (64 seeds por política nos braços de decisão; 16 nos controlos negativos sem a interação). Total: **10.944 corridas novas**, 4.512 resultados reutilizados, 15.456 linhas avaliadas.
- Gates: **0 erros, 0 timeouts, 0 duplicações de seed**, 1.344/1.344 controlos negativos idênticos e 1.536/1.536 baselines Sword idênticas à C.2.1. Máximo de dois Legendaries equipados em todos os perfis.
- SHA-256 dos resultados completos locais: triagem `33b02b98b17409e44f65bab751d6456924fa94441b8591cafdd74c8beadcf801`; confirmação `cb81eaee50e55f9fd25a010861144996ca9fae0ce410a3632134160719028180`. O resumo versionado tem SHA-256 `179d92b78ca271129620b7f22f395174d48e3bc9e0ce5bc45c002bbd2208b8bd`.
- Commit de implementação: `d8fadd8f0fc2d507230da8f992395b824b55e98f`.

## Método e diagnóstico

E50/E100/E200, equipamento Epic sintético equivalente, três Runas equivalentes, sem poções, benefícios de eventos ou gear swaps. Políticas `triple` e `random` com seeds/streams pareadas e plano de affinity disponível tal como na C.2.1. Métricas por segundo usam tempo de combate; EHP observado é Max HP mais cura e Barrier realmente absorvida. Sobreviver mais pode mudar ofertas e passivos posteriores. São resultados de simulação, não taxas reais de jogadores.

A sequência do runtime é Block → contra-ataque Oathwall → absorção por Barrier → passivos de defesa. Veil concede Barrier por Realm, e a sua absorção pode preparar dano. Verdant cura e prepara o próximo ataque. Aegis acrescenta Block/Barrier e Vitality acrescenta cura; essa combinação alonga o combate e cria mais ocasiões para os efeitos, sem mudar os seus cooldowns.

### Sword + Shield sem Legendary, com um e com dois

Vitórias em 128 seeds; os números são baseline antes do ajuste C.2.2.

| E | Legendaries | Vitórias | Realm média | DPS | Heal/s | Barrier/s | EHP observado |
|---|---|---:|---:|---:|---:|---:|---:|
| E50 | Nenhum | 2 | 10.80 | 455 | 8.4 | 2.6 | 2831 |
| E50 | Veil | 53 | 13.79 | 472 | 10.9 | 20.8 | 4322 |
| E50 | Oathwall | 3 | 10.98 | 462 | 8.5 | 2.6 | 2837 |
| E50 | Verdant | 9 | 12.62 | 494 | 13.3 | 3.1 | 3196 |
| E50 | Oathwall + Veil | 54 | 13.78 | 479 | 11.0 | 21.0 | 4293 |
| E50 | Verdant + Veil | 76 | 14.73 | 510 | 15.4 | 22.1 | 4672 |
| E50 | Verdant + Oathwall | 15 | 12.62 | 499 | 13.4 | 3.1 | 3174 |
| E100 | Nenhum | 18 | 12.27 | 989 | 17.2 | 6.3 | 5531 |
| E100 | Veil | 89 | 14.50 | 1030 | 21.5 | 43.5 | 8159 |
| E100 | Oathwall | 16 | 12.62 | 1008 | 17.6 | 6.3 | 5563 |
| E100 | Verdant | 36 | 13.77 | 1072 | 26.7 | 6.9 | 6211 |
| E100 | Oathwall + Veil | 85 | 14.75 | 1047 | 21.4 | 44.2 | 8212 |
| E100 | Verdant + Veil | 110 | 14.84 | 1100 | 28.6 | 45.9 | 8588 |
| E100 | Verdant + Oathwall | 40 | 13.86 | 1090 | 27.0 | 6.9 | 6215 |
| E200 | Nenhum | 29 | 13.99 | 2429 | 41.2 | 9.5 | 10984 |
| E200 | Veil | 104 | 15.00 | 2480 | 45.8 | 92.6 | 15516 |
| E200 | Oathwall | 40 | 14.07 | 2464 | 41.4 | 9.6 | 10941 |
| E200 | Verdant | 58 | 14.73 | 2574 | 58.8 | 10.6 | 12010 |
| E200 | Oathwall + Veil | 110 | 14.97 | 2511 | 46.0 | 93.8 | 15425 |
| E200 | Verdant + Veil | 121 | 15.00 | 2608 | 58.9 | 96.8 | 16001 |
| E200 | Verdant + Oathwall | 63 | 14.62 | 2598 | 58.2 | 10.6 | 11923 |

Veil sozinho aumentou as vitórias de Sword + Shield de **2→53 em E50**, **18→89 em E100** e **29→104 em E200**. Oathwall sozinho ficou em **3/16/40** e Verdant em **9/36/58**. O salto principal acompanha a Barrier/s, não o DPS: em E50, sem Legendary **2,6 Barrier/s**, com Veil **20,8 Barrier/s**, enquanto DPS muda **455→472**. Verdant + Veil acrescenta cura e DPS ao núcleo defensivo de Veil; Oathwall + Veil acrescenta menos vitórias.

Em E50, a taxa observada de Block permanece próxima de **33%** nos quatro perfis Sword principais: sem Legendary **32,3%**, Veil **32,9%**, Oathwall + Veil **33,1%** e Verdant + Veil **33,0%**. Já o EHP observado passa de **2831** para **4322/4293/4672**, respetivamente. A contagem média por corrida do passivo `sanctuary` passa de **3,2** sem Legendary para **5,7/5,6/6,3** nos mesmos pares; a de `barrier_pulse`, de **1,9** para **2,7/2,6/2,7**. Estas contagens incluem o efeito de sobreviver mais tempo, pelo que não devem ser interpretadas como aumento direto da probabilidade de proc. O diagnóstico aponta para Barrier recorrente de Veil em conjunto com Block e passivos defensivos, com a cura de Verdant a amplificar essa sobrevivência.

## Triagem de hipóteses isoladas — vitórias em 32 seeds

Cada célula é `triple + random` (16 de cada). Traço significa que o poder não existe no perfil. Nenhuma alteração foi combinada nesta fase.

| E | Perfil | Base | Barrier 3/5 | Barrier 2,5/4 | Dano 25/38 | Dano 20/30 | Oathwall 65/95 | Oathwall 60/90 | Verdant cura 0,6/0,9 | Verdant ataque 50/75 |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| E50 | Sword Oathwall + Veil | 12 | 9 | 6 | 11 | 11 | 13 | 13 | — | — |
| E50 | Sword Verdant + Veil | 18 | 11 | 10 | 19 | 18 | — | — | 16 | 18 |
| E50 | Sword Verdant + Oathwall | 4 | — | — | — | — | 4 | 3 | 4 | 4 |
| E50 | Wand Voidglass + Veil | 1 | 0 | 0 | 2 | 2 | — | — | — | — |
| E50 | Staff Veil + Heartroot | 1 | 1 | 1 | 1 | 1 | — | — | — | — |
| E50 | Mace Oathwall + Heartroot | 6 | — | — | — | — | 3 | 2 | — | — |
| E100 | Sword Oathwall + Veil | 20 | 17 | 16 | 21 | 21 | 22 | 19 | — | — |
| E100 | Sword Verdant + Veil | 27 | 25 | 22 | 26 | 25 | — | — | 25 | 26 |
| E100 | Sword Verdant + Oathwall | 11 | — | — | — | — | 11 | 10 | 10 | 10 |
| E100 | Wand Voidglass + Veil | 9 | 9 | 6 | 9 | 9 | — | — | — | — |
| E100 | Staff Veil + Heartroot | 5 | 4 | 3 | 5 | 5 | — | — | — | — |
| E100 | Mace Oathwall + Heartroot | 10 | — | — | — | — | 10 | 10 | — | — |
| E200 | Sword Oathwall + Veil | 31 | 30 | 28 | 30 | 30 | 29 | 29 | — | — |
| E200 | Sword Verdant + Veil | 30 | 30 | 30 | 30 | 30 | — | — | 30 | 31 |
| E200 | Sword Verdant + Oathwall | 19 | — | — | — | — | 18 | 18 | 19 | 20 |
| E200 | Wand Voidglass + Veil | 21 | 19 | 19 | 21 | 21 | — | — | — | — |
| E200 | Staff Veil + Heartroot | 18 | 16 | 16 | 18 | 18 | — | — | — | — |
| E200 | Mace Oathwall + Heartroot | 23 | — | — | — | — | 22 | 21 | — | — |

Os cortes no dano de Veil quase não mexem nas vitórias; os de Oathwall não reduzem consistentemente Sword e prejudicam Mace E50 (6→3 ou 2/32). Reduzir a cura de Verdant tem impacto menor e deixa Veil como fonte principal de sobrevivência. Os dois cortes globais de Barrier atingem Staff/Wand. **Rejeitados**: ambos os danos Veil, ambos os coeficientes Oathwall, cura/dano Verdant e Barrier global forte. A Barrier global moderada passou à confirmação apenas para medir os efeitos colaterais com 64 seeds.

## Confirmação — Veil específico para Sword + Shield

Vitórias em 128 seeds. `Moderada` é Barrier 3%/5%; `forte` é 2,5%/4%, sempre só com Sword + Shield. Dano pós-absorção fica 30%/45%.

| E | Sword + Shield | Antes | Moderada | Forte | Realm antes→forte | DPS antes→forte | Heal/s antes→forte | Barrier/s antes→forte | EHP antes→forte |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| E50 | Veil | 53 | 36 | **32** | 13.79→12.85 | 472→470 | 10.9→10.8 | 20.8→14.6 | 4322→3853 |
| E50 | Oathwall + Veil | 54 | 42 | **30** | 13.78→12.98 | 479→476 | 11.0→11.1 | 21.0→14.8 | 4293→3869 |
| E50 | Verdant + Veil | 76 | 62 | **58** | 14.73→14.17 | 510→506 | 15.4→15.6 | 22.1→15.6 | 4672→4244 |
| E100 | Veil | 89 | 78 | **64** | 14.50→14.11 | 1030→1027 | 21.5→21.7 | 43.5→30.9 | 8159→7453 |
| E100 | Oathwall + Veil | 85 | 74 | **65** | 14.75→14.26 | 1047→1043 | 21.4→22.1 | 44.2→31.6 | 8212→7487 |
| E100 | Verdant + Veil | 110 | 102 | **91** | 14.84→14.76 | 1100→1098 | 28.6→30.0 | 45.9→32.7 | 8588→8011 |
| E200 | Veil | 104 | 97 | **90** | 15.00→14.84 | 2480→2475 | 45.8→47.0 | 92.6→64.3 | 15516→14264 |
| E200 | Oathwall + Veil | 110 | 103 | **89** | 14.97→14.82 | 2511→2508 | 46.0→46.9 | 93.8→65.2 | 15425→14182 |
| E200 | Verdant + Veil | 121 | 117 | **110** | 15.00→14.99 | 2608→2603 | 58.9→61.3 | 96.8→67.0 | 16001→14932 |

A intensidade forte reduz Barrier/s de `Oathwall + Veil` em **21,0→14,8 (E50)**, **44,2→31,6 (E100)** e **93,8→65,2 (E200)**, com DPS praticamente estável. A intensidade moderada deixa `Verdant + Veil` em **117/128 E200**; a forte baixa para **110/128**. Veil sozinho continua acima de Sword sem Legendary em todos os níveis (E50 **32 vs 2**, E100 **64 vs 18**, E200 **90 vs 29**).

### Políticas de affinity: vitórias antes→forte em 64 seeds

| E | Sword + Shield | `triple` | `random` | Pares ganhou/perdeu (128) |
|---|---|---:|---:|---:|
| E50 | Veil | 45→28 | 8→4 | 0/21 |
| E50 | Oathwall + Veil | 46→27 | 8→3 | 1/25 |
| E50 | Verdant + Veil | 58→47 | 18→11 | 2/20 |
| E100 | Veil | 57→48 | 32→16 | 0/25 |
| E100 | Oathwall + Veil | 59→49 | 26→16 | 1/21 |
| E100 | Verdant + Veil | 62→59 | 48→32 | 1/20 |
| E200 | Veil | 60→57 | 44→33 | 2/16 |
| E200 | Oathwall + Veil | 61→57 | 49→32 | 1/22 |
| E200 | Verdant + Veil | 64→61 | 57→49 | 0/11 |

A política `triple` continua significativamente mais favorável à Sword em muitos perfis (por exemplo, `Oathwall + Veil` E50: **27/64 triple** e **3/64 random** após o ajuste). Isso decorre da composição de affinity/passivos, não de uma diferença no coeficiente de Veil por política.

### Controlos de outras builds

A alteração específica teve **0 divergências em 1.344 controlos negativos pareados**: Sword sem Veil, Wand + Orb, Staff, Mace + Shield, Bow, Two-Handed `Gravewake + Eye` e Two-Handed `Veil + Heartroot`, 16 seeds por política e nível para cada variante condicional. Esses controlos cobrem vitórias, Realm, DPS, cura/s, Barrier/s, EHP, dano recebido e procs. O teste unitário acrescenta Daggers e verifica as taxas sem Sword + Shield.

Para demonstrar por que a alternativa global foi rejeitada, a tabela seguinte usa 64 seeds por política e **Heartroot já reduzido**. Todos os valores são vitórias antes→Barrier global moderada (128 corridas).

| Build e par | E50 | E100 | E200 |
|---|---:|---:|---:|
| Wand + Orb: Voidglass + Veil | 13→5 | 41→32 | 85→80 |
| Staff: Veil + Heartroot | 8→7 | 20→16 | 80→69 |
| Bow: Veil + Heartroot | 84→77 | 69→61 | 113→108 |
| Two-Handed: Veil + Heartroot | 75→70 | 75→67 | 121→119 |

`Gravewake + Eye of Morrow` (Two-Handed) foi controlo negativo: o ajuste de Sword + Shield não altera o seu resultado. Oathwall e Verdant mantêm procs reais na confirmação: com a variante forte, `Oathwall + Veil` teve **3.310** ativações de Oathwall e **2.191** de Veil; `Verdant + Veil` teve **3.986** de Verdant e **2.235** de Veil nas 384 corridas por perfil. A contagem muda com a duração da run; não há evidência de novos procs recursivos.

## Decisão e coeficientes finais

| Poder | Condição | Coeficiente final |
|---|---|---|
| Veil Barrier por Realm | Sword + Shield | **2,5% Max HP; 4% com Aegis** |
| Veil Barrier por Realm | Outras configurações | **4% Max HP; 6% com Aegis** (inalterado) |
| Veil ataque após absorção | Todas | **+30% dano-base; +45% com Aegis** (inalterado) |
| Oathwall contra-ataque | Block real | **75% dano-base; 110% com Aegis**, cooldown 3 s (inalterado) |
| Verdant Oath | Cura; próximo ataque | **0,8%/1,2% Max HP; +60%/+90% dano-base**, cooldown 6 s (inalterado) |
| Heartroot Carapace | HP abaixo de 70% | **0,20%/0,30% Max HP/s; cap 10% por Realm** (C.2.1 preservada) |

O ajuste de Veil é apenas um coeficiente condicionado ao equipamento existente; não cria nova mecânica. O limite global de dois Legendaries, os cooldowns, caps, drop rates, loot, Runas, passivos e inimigos ficam com os valores anteriores.

## Limitações e problemas restantes

- O par `Verdant + Veil` ainda ganha **110/128** em E200; Bow/Two-Handed com Veil + Heartroot também são fortes nesse tier. Não há evidência nesta matriz para um nerf global adicional sem prejudicar Cloth.
- Oathwall sozinho oferece ganho pequeno e irregular de vitórias face a Sword sem Legendary, embora cause contra-ataques reais. As hipóteses testadas eram reduções; todas foram rejeitadas. Não foi inventado um buff fora da matriz.
- O teste isola efeitos com atributos Epic sintéticos, políticas fixas e sem economia/eventos/poções; não mede distribuição real de equipamento, drops ou saves. A triagem de 16 seeds orientou a seleção, e apenas as melhores variantes tiveram 64 seeds por política.
- As 12 assinaturas Legendary continuam reconhecidas, mas C.2.2 concentrou-se nos pares enumerados e nos controlos. Não é uma enumeração de todos os pares possíveis.

## Testes e publicação

- `node --check` dos dois scripts C.2.2: **PASS**.
- `node scripts/v012-phase-c22-review.cjs ...`: **PASS**; 5.280+10.176 linhas, zero erros/timeouts, 1.344 controlos negativos e 1.536 baselines C.2.1 sem divergências.
- Paridade integral entre o runtime de produção e a variante VM selecionada: **PASS**; o simulador reconstrói a baseline histórica sem repetir a matriz.
- `node --test tests/v012-phase-c1.test.cjs tests/v012-legendary-limit.test.cjs`: **PASS**; inclui Sword/Mace/Staff/Wand/Daggers, com/sem Aegis, Heartroot e máximo de dois Legendaries.
- `npm test` local: **23/24 grupos PASS**; o teste de preview falhou por `listen EPERM` em `127.0.0.1` no sandbox, como antes da alteração. O workflow remoto executou os testes em ambiente com loopback permitido.
- [GitHub Actions do commit de implementação](https://github.com/Skinny-lfg/wanderer-game/actions/runs/39600258516): **PASS** (`development`, `d8fadd8f0fc2d507230da8f992395b824b55e98f`).
- Sem alteração de `main`, Firebase, saves reais ou Railway; sem deploy.

**Estado final: PASS para C.2.2.** O domínio defensivo Sword + Shield foi reduzido por uma condição medida, preservando os coeficientes e a utilidade das outras builds. Os desequilíbrios gerais de E200 e o ganho limitado de Oathwall isolado ficam documentados para avaliação futura, sem ajuste arbitrário neste commit.
