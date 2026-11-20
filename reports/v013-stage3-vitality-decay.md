# Wanderer v0.13 — Stage 3: Vitality e Decay

**Estado:** implementado e validado em 20-11-2026, exclusivamente na `audit/v013`. **Código validado:** [`3ee98385c4`](https://github.com/Skinny-lfg/wanderer-game/commit/3ee98385c4c40df2c63831aa7ec303ca0fef798c).

- [C7 completo — 4/4 jobs SUCCESS](https://github.com/Skinny-lfg/wanderer-game/actions/runs/44732589453).
- [Clean Sheet/Pages — 3/3 jobs SUCCESS](https://github.com/Skinny-lfg/wanderer-game/actions/runs/44732589448).
- [Stage 3: 48 combates nativos, JSON e Markdown](https://github.com/Skinny-lfg/wanderer-game/actions/runs/44732589453/artifacts/14627391073).
- Stage 2 congelado em `reports/v013-stage2-affinity-freeze.json`, extraído do artefacto de C7 run 44730440325.

## Regras de Vitality efetivamente alteradas

| Origem | Antes | Depois |
|---|---|---|
| Afinidade Vitality | 0,2 HP/s fixos | 0,15% do Max HP/s |
| Nó de regeneração tier 1 | 0,10 HP/s | +0,05% do Max HP/s |
| Nó de regeneração tier 2 | 0,15 HP/s | +0,075% do Max HP/s |
| Nó de regeneração tier 3 | 0,20 HP/s | +0,10% do Max HP/s |
| Agregado de regeneração básica | Sem cap percentual dedicado | 0,35% do Max HP/s antes das especializações |

`Recovery` continua a multiplicar por 1,25 e `Reserve` por 0,75; agora estes modificadores também abrangem o agregado de regeneração básica. O limite de 0,35% é verificado **antes** destes multiplicadores. Renewal, Life Bloom, Heart of the Wild e a cura geral mantêm as próprias fórmulas; não foi adicionado Spell Power à cura. O que conta como cura efetiva continua limitado pela vida em falta, resistências e debuffs de healing.

As descrições da árvore v15 e dos nós de regeneração apresentam percentagens, com valores originais absolutos eliminados do código de combate e dos tooltips ativos.

## Decay: decisão de coerência e limpeza

A análise do código revelou que **Toxic Precision não existe na árvore v15**: trata-se de uma habilidade antiga Decay/Fury, combinação não disponível entre os seis híbridos vizinhos desta versão. Alterar o coeficiente teria criado uma melhoria inacessível ao jogador.

Por isso, foram **eliminados** o registo `toxic_precision` do catálogo Buildcraft e o seu caminho `onAttack`, incluindo as cópias geradas em `docs/`. Os testes verificam expressamente que a mecânica não existe no catálogo nem na árvore atual, em vez de preservar lógica morta. Não foram inseridos controlos de UI ou árvores alternativas.

Os caminhos ativos existentes estão coerentes e continuam iguais: `Toxic Touch` aplica Rot a partir de **6,5% do hit + 2,5% Spell Power**, custa 1 Mana e tem cooldown de 1,3 s; `Hex Bolt` (Magic + Decay) combina Spell Power com o dano de Rot presente. Foram adicionados testes destas capacidades, incluindo regeneração, cooldowns, Mana e preservação de stacks. **Nenhum coeficiente de dano de Decay foi alterado neste Stage.**

## Simulador atualizado e resultados

O novo `scripts/v013-stage3-coherence-compare.cjs` compara os mesmos **48 combates nativos** do Stage 2 (12 builds, E5/E35, seeds 9101 e 9201, 24 pontos efetivos, gear Rare atual, três inimigos normais Aegis e targeting focus). Gera os ficheiros `reports/v013-stage3-affinity-comparison.json` e `.md`; execução: `npm run simulate:v013:affinities:stage3`.

**48/48 cenários válidos, 0 erros, 0 timeouts.** As nove builds de controlo sem alteração prevista mantiveram os valores médios de geração inicial de Barrier, Barrier gerada, cura/s, DoT/s, consumo de Mana e Spell Power. A comparação não verifica uma inexistente ativação de Toxic Precision; a sua eliminação é coberta diretamente nos testes de código.

| Build | Nível | Cura efetiva/s Stage 2 → Stage 3 | Δ Barrier gerada |
|---|---:|---:|---:|
| Vitality | E5 | 2,71 → 2,71 | 0 |
| Vitality | E35 | 3,36 → 3,38 | 0 |
| Fury + Vitality | E5 | 2,49 → 2,80 | 0 |
| Fury + Vitality | E35 | 3,16 → 3,56 | 0 |
| Vitality + Aegis | E5 | 0,38 → 0,37 | +0,49 |
| Vitality + Aegis | E35 | 0,80 → 0,79 | +0,63 |

As pequenas alterações em Vitality + Aegis decorrem de cura efetiva, overheal, Sanctuary/Barrier e dano recebido, não de um nerf nominal na fórmula. A cura efetiva durante combates fáceis não é igual ao potencial máximo de regeneração. As 48 lutas não determinam o equilíbrio contra Bosses, Elites nem o desempenho de progressão natural E1–E20.

### Evidência de regressão

- [C7 execução final](https://github.com/Skinny-lfg/wanderer-game/actions/runs/44732589453): 4/4 jobs **SUCCESS**, incluindo **320/320 testes principais**, **7/7 simulador**, **79/79 Talent Tree**, **94/94 combate/Elite/Boss**, integração e economia, emuladores e Chromium.
- [Clean Sheet, browser e sincronização Pages](https://github.com/Skinny-lfg/wanderer-game/actions/runs/44732589448): 3/3 **SUCCESS**.
- Stage 3 `sourceSha256`: `cbe3167edf06a357c30dd059ca4f24b40d5b95955e664ce9188fb17a42c2d49e`.
- Stage 3 `replaySha256`: `062f1861888bc5cff7029509604bd61b83d2fc7ddcd37bb846eee6e60c9a11c3`.
- [Artefacto com todas as linhas individuais e comparação](https://github.com/Skinny-lfg/wanderer-game/actions/runs/44732589453/artifacts/14627391073).

**Sem merge para `main`, sem deploy, sem alteração de saves, de probabilidades de loot ou dos atributos de itens.** Stage 4 poderá estudar sinergias entre as seis Affinities com os valores agora definidos, sem refazer a árvore.
