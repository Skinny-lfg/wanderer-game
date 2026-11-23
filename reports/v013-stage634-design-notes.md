# Stage 6.34 — curva de dificuldade baseada em crescimento real

Estado: **validação da implementação aprovada**, mas **balanceamento de combate por validar**. PR #138 em draft; nenhum merge ou deploy.

## Fonte e representatividade
A execução 45174790906 da Stage 6.32 terminou com sucesso. O artefacto agregado 14819297712 contém 100 configurações legais × 5 sementes: 500 contas E1-born, 3156 checkpoints, 398 contas que chegaram a E2 e 102 a E20. Os níveis não alcançados são censurados. As contas são agentes heurísticos, não uma amostra aleatória de jogadores.

SHA-256 do agregado: `f2071426ff284f1cdcec6603bdf39e272e21673c09bf784c060804248a8159bb`. Os 19 pares de medianas, contagens e a metodologia constam de `reports/v013-stage634-growth-input.json`.

| Transição | Contas que fizeram ambas | Mediana ΔHP | Mediana ΔAttack |
|---|---:|---:|---:|
| E1→E2 | 398 | +14,286% | +11,111% |
| E2→E3 | 280 | +9,449% | +12,250% |
| E3→E4 | 177 | +11,511% | +13,333% |
| E4→E5 | 141 | +9,392% | +8,889% |
| E5→E6 | 131 | +4,633% | +6,977% |
| E6→E7 | 123 | +1,307% | +2,326% |
| E7→E8 | 116 | +0,463% | +1,926% |
| E8→E9 | 116 | 0% | 0% |
| E19→E20 | 102 | 0% | 0% |

Não se usa o DPS observado como substituto direto da evolução dos atributos porque muda também com o adversário. Não se inventa Effective HP, Spell Power comum a todas as builds nem um score universal de power.

## Curva única e suave

Para `x=E−1`, a referência nativa em todas as Expeditions é:

`R(E)=0.775 * exp(0.014*x + 1.07777514*(1-exp(-x/2.75370775)))`

A forma funcional mantém-se igual de E1 a E200, sem exceções nos níveis de equipamento, sem cortes e sem multiplicadores específicos para Elites ou Bosses.

A calibração minimiza os desvios quadráticos ponderados entre o crescimento logarítmico por conta, em HP e Attack, e o crescimento da referência base do inimigo `HP=27+14*R` e `ATK=4+3*R`. O peso depende do número de pares reais observados em cada transição. O script `scripts/v013-stage634-player-growth-fit.cjs` reproduz e verifica o ajuste.

| E | Stage 6.31 | Stage 6.34 |
|---|---:|---:|
| 1 | 0,775 | 0,775 |
| 2 | 1,650 | 1,091 |
| 3 | 2,635 | 1,390 |
| 5 | 4,239 | 1,871 |
| 20 | 6,487 | 2,968 |
| 200 | 38,559 | 36,925 |

**Atenção:** `lateLogGrowth=0.014` é uma escolha provisória para extrapolar E20→E200, onde esta amostra não mede poder. Preserva aproximadamente a pressão em E200 da Stage 6.31; não é uma estimativa comprovada pelos 500 percursos.

## O que fica por concluir

A E1 mantém exatamente a referência anterior. A Stage 6.33 encontrou agentes que não conseguiram superar E1 no pequeno ensaio; portanto não se pode alegar que o problema inicial ficou resolvido.

As bases dos quatro tipos de criaturas normais, dos oito Elites e dos seis Bosses continuam constantes entre Expeditions. A Stage 6.34 **não** altera essas bases arbitrariamente para simular o cumprimento das metas.

Os objetivos 80–90% para normais, 60–70% para Elites e 35–45% para Bosses serão medidos num censo nativo E1–E5 com as mesmas 100 configurações × 5 sementes, estratificado por Realm e grupos solo/pequenos/hordas. Resultados só são aceites depois de todas as 500 contas serem reconciliadas; resultados de combate não resolvidos contam como censurados. Esse ensaio usa progressão legal desde E1, não vitórias ou desbloqueios fabricados.

## Verificação

- Stage 6.34: [CI inicial aprovado](https://github.com/Skinny-lfg/wanderer-game/actions/runs/45177881015)
- Matriz completa: GitHub Actions `Wanderer Stage 6.34 — player-power fitted common enemy curve (NO DEPLOY)`
- PR #138 permanece em draft, sem merge nem deploy
