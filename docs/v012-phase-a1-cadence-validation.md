# Wanderer v0.12 — Fase A.1: validação da cadência

Data: 2026-10-20  |  Branch: `development`  |  Escopo: relógio de ataques do jogador.

## Alteração

`updateFight()` agora mantém o tempo excedente e subtrai um período por ataque. O acumulador do jogador é tratado como progresso fracionário do ciclo ao mudar a velocidade temporária; a mudança de buff não inventa progresso e cada tick pode emitir no máximo um ataque. O período efetivo continua limitado a 4,2 ataques/s, também sob buffs. O relógio `tEnemy` tem o mesmo padrão de acumular e zerar, portanto também perde o excedente; foi inspecionado e deliberadamente não alterado nesta fase, conforme pedido para medir seu impacto antes.

A chamada existente `weaponAttack(r)` permanece única e no mesmo caminho, mantendo cooldowns, procs, críticos e Double Strike. Saves antigos sem o novo `playerAttackPeriod` inicializam o período anterior como o período atual e preservam o tempo válido já acumulado. Não foram alterados AGI 0,25, Wand 0,95, Strength, Aegis, HP inimigo, Legendaries, Runas ou outras fórmulas.

## Testes de cadência

Simulação determinística de 120,01 s por taxa, usando o passo real de 0,11 s. A taxa observada é ataques executados / tempo simulado.

| Configurada | Observada | Erro relativo | Resultado |
|---:|---:|---:|:---:|
| 1.0 | 0.9999 | 0.008% | PASS |
| 2.0 | 1.9998 | 0.008% | PASS |
| 3.0 | 2.9998 | 0.008% | PASS |
| 4.2 | 4.1997 | 0.008% | PASS |

Teste adicional: 1.000 mudanças alternadas entre 2 e 4 ataques/s sem tempo decorrido preservam a fração do ciclo, sem ataque; taxa de entrada 100/s continua limitada a 4,2/s. Teste de fonte confirma que a cadência inimiga permanece num contador separado.

## Comparação pareada — Fase A anterior → Fase A.1

672 execuções A.1, emparelhadas com 672 linhas “pós-Fase A” do relatório anterior: E50/E100/E200 × 7 configurações × Rare/Epic × 8 repetições × estratégias `triple`/`random`. Seeds, equipamentos Rare/Epic completos, Runas equivalentes, escolhas, políticas e scripts foram mantidos. Sem os 12 Legendaries novos. Seeds e chaves de configuração coincidem em todas as linhas; 0 erros e 0 timeouts. As métricas são médias das 16 execuções por célula.

O maior valor individual `weaponAttacks / seconds` foi 4,138/s (Rare Leather Dual Daggers, E200), abaixo do limite de 4,2/s; nenhuma das 672 execuções excedeu o teto.

### E50

| Raridade | Configuração / arma | Vitórias (16) | Realms média | DPS médio | Ataques/s real |
|:--|:--|--:|--:|--:|--:|
| Rare | Cloth Staff | 0 → 0 | 3.69 → 3.69 | 531.5 → 534.5 | 1.263 → 1.270 |
| Rare | Cloth Wand/Orb | 0 → 0 | 2.44 → 2.44 | 421.4 → 421.8 | 1.257 → 1.258 |
| Rare | Plate Mace/Shield | 0 → 0 | 3.56 → 3.56 | 288.6 → 303.0 | 0.692 → 0.726 |
| Rare | Plate Sword/Shield | 0 → 0 | 2.88 → 3.38 | 277.4 → 304.4 | 0.989 → 1.096 |
| Rare | Leather Dual Daggers | 0 → 0 | 4.44 → 7.13 | 490.9 → 614.9 | 3.016 → 3.769 |
| Rare | Leather Bow | 0 → 0 | 5.94 → 6.25 | 576.9 → 717.6 | 2.455 → 3.008 |
| Rare | Leather Two-Handed | 0 → 0 | 7.06 → 7.00 | 661.1 → 661.9 | 1.316 → 1.325 |
| Epic | Cloth Staff | 0 → 0 | 7.31 → 7.31 | 625.0 → 632.6 | 1.261 → 1.273 |
| Epic | Cloth Wand/Orb | 0 → 0 | 4.25 → 4.31 | 477.4 → 479.4 | 1.273 → 1.277 |
| Epic | Plate Mace/Shield | 0 → 0 | 9.44 → 9.69 | 365.4 → 382.5 | 0.741 → 0.770 |
| Epic | Plate Sword/Shield | 0 → 0 | 6.88 → 7.94 | 351.7 → 383.8 | 1.046 → 1.148 |
| Epic | Leather Dual Daggers | 0 → 1 | 11.69 → 11.75 | 663.2 → 826.6 | 3.017 → 3.784 |
| Epic | Leather Bow | 0 → 5 | 10.88 → 14.50 | 761.5 → 947.5 | 2.483 → 3.174 |
| Epic | Leather Two-Handed | 7 → 7 | 14.31 → 14.44 | 869.1 → 872.0 | 1.371 → 1.385 |

### E100

| Raridade | Configuração / arma | Vitórias (16) | Realms média | DPS médio | Ataques/s real |
|:--|:--|--:|--:|--:|--:|
| Rare | Cloth Staff | 0 → 0 | 6.06 → 6.25 | 1270.1 → 1323.1 | 1.538 → 1.600 |
| Rare | Cloth Wand/Orb | 0 → 0 | 2.25 → 2.25 | 897.8 → 948.4 | 1.482 → 1.561 |
| Rare | Plate Mace/Shield | 0 → 0 | 5.56 → 5.81 | 730.5 → 736.8 | 0.902 → 0.917 |
| Rare | Plate Sword/Shield | 0 → 0 | 4.00 → 4.63 | 607.5 → 675.4 | 1.135 → 1.267 |
| Rare | Leather Dual Daggers | 0 → 0 | 3.94 → 4.94 | 911.5 → 1204.8 | 3.015 → 3.978 |
| Rare | Leather Bow | 0 → 0 | 6.63 → 8.25 | 1314.2 → 1496.5 | 3.012 → 3.428 |
| Rare | Leather Two-Handed | 0 → 0 | 4.94 → 6.31 | 1205.6 → 1354.8 | 1.308 → 1.442 |
| Epic | Cloth Staff | 3 → 4 | 8.94 → 9.81 | 1448.2 → 1555.4 | 1.545 → 1.629 |
| Epic | Cloth Wand/Orb | 0 → 0 | 5.63 → 5.50 | 1116.3 → 1174.9 | 1.501 → 1.574 |
| Epic | Plate Mace/Shield | 2 → 4 | 11.44 → 12.06 | 910.3 → 935.5 | 0.954 → 0.991 |
| Epic | Plate Sword/Shield | 0 → 0 | 7.63 → 10.94 | 764.0 → 875.9 | 1.160 → 1.356 |
| Epic | Leather Dual Daggers | 0 → 0 | 8.63 → 13.69 | 1259.7 → 1657.4 | 3.014 → 3.998 |
| Epic | Leather Bow | 2 → 7 | 12.94 → 13.88 | 1725.7 → 2001.7 | 3.025 → 3.534 |
| Epic | Leather Two-Handed | 5 → 9 | 12.31 → 14.81 | 1714.1 → 1850.4 | 1.413 → 1.541 |

### E200

| Raridade | Configuração / arma | Vitórias (16) | Realms média | DPS médio | Ataques/s real |
|:--|:--|--:|--:|--:|--:|
| Rare | Cloth Staff | 1 → 1 | 5.75 → 5.75 | 2862.6 → 2868.0 | 1.780 → 1.783 |
| Rare | Cloth Wand/Orb | 0 → 0 | 4.00 → 4.00 | 2311.1 → 2322.9 | 1.776 → 1.785 |
| Rare | Plate Mace/Shield | 0 → 0 | 9.94 → 9.44 | 1785.3 → 1892.2 | 1.181 → 1.265 |
| Rare | Plate Sword/Shield | 0 → 0 | 5.00 → 5.00 | 1567.5 → 1648.2 | 1.557 → 1.638 |
| Rare | Leather Dual Daggers | 0 → 0 | 4.63 → 5.88 | 1786.2 → 2424.8 | 3.000 → 4.104 |
| Rare | Leather Bow | 0 → 0 | 6.44 → 8.81 | 2526.9 → 3175.6 | 3.005 → 3.842 |
| Rare | Leather Two-Handed | 0 → 0 | 7.19 → 8.75 | 2958.6 → 3195.8 | 1.584 → 1.743 |
| Epic | Cloth Staff | 3 → 3 | 11.25 → 11.25 | 3312.6 → 3317.1 | 1.774 → 1.780 |
| Epic | Cloth Wand/Orb | 1 → 0 | 7.94 → 8.19 | 2659.8 → 2727.0 | 1.773 → 1.819 |
| Epic | Plate Mace/Shield | 6 → 8 | 14.25 → 14.69 | 2219.6 → 2439.6 | 1.210 → 1.338 |
| Epic | Plate Sword/Shield | 3 → 1 | 12.44 → 13.00 | 1989.7 → 2114.2 | 1.604 → 1.709 |
| Epic | Leather Dual Daggers | 0 → 0 | 9.06 → 13.94 | 2441.4 → 3225.3 | 3.017 → 4.049 |
| Epic | Leather Bow | 0 → 16 | 12.75 → 15.00 | 3376.0 → 4290.3 | 3.025 → 3.931 |
| Epic | Leather Two-Handed | 12 → 16 | 14.88 → 15.00 | 3843.4 → 4272.7 | 1.702 → 1.881 |

### Diferença agregada por configuração/arma

| Configuração / arma | Vitórias (96) | Δ Realms média | Δ DPS médio | Δ ataques/s real |
|:--|--:|--:|--:|--:|
| Cloth Staff | 7 → 8 | +0.18 | +30.1 | +0.029 |
| Cloth Wand/Orb | 1 → 0 | +0.03 | +31.8 | +0.035 |
| Plate Mace/Shield | 8 → 12 | +0.18 | +65.0 | +0.054 |
| Plate Sword/Shield | 3 → 1 | +1.01 | +74.0 | +0.121 |
| Leather Dual Daggers | 0 → 1 | +2.49 | +400.1 | +0.934 |
| Leather Bow | 2 → 28 | +1.85 | +391.3 | +0.652 |
| Leather Two-Handed | 24 → 32 | +0.94 | +159.3 | +0.104 |

As diferenças agregadas resumem o efeito da cadência recuperada, incluindo mais ataques, procs e dano sustentado. Mudanças em vitórias/Realms refletem também a duração alterada das expedições; não foram aplicadas propostas ou ajustes de balanceamento. Os resultados por célula preservam a comparação emparelhada por seed.

## Validação de regressão

- `node --test tests/v012-runtime-integration.test.cjs`: PASS (paridade atualizada para 21 cenários e testes novos).
- Matriz A.1: PASS, 672/672 execuções, sem erro ou timeout.
- `npm test`: 21/22 ficheiros de teste PASS; o único FAIL é `tests/private-preview.test.mjs`, que recebe `listen EPERM` ao tentar abrir `127.0.0.1` neste ambiente restrito. Execução direta confirmou os mesmos quatro casos bloqueados pelo loopback, coerente com falha ambiental; os demais testes da suite passaram.

## Limitações e segurança dos dados

A comparação reutiliza os resultados pós-Fase A preservados em `/tmp/wanderer-phase-a-after.json`; portanto, compara especificamente a correção de cadência sobre aquela versão do runtime. São 16 observações por célula, adequadas à comparação determinística emparelhada solicitada, mas não a inferências robustas de taxa populacional. Não houve alterações em `main`, Firebase, deploys ou saves reais.
