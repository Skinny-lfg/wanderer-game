# Stage S1 — paridade funcional do simulador v0.13

**Branch:** `audit/v013` · **Data:** 19/11/2026 · **Âmbito:** apenas harness, agentes/decisões e testes. **Sem alterações a combate, loot, valores de balanceamento, `main`, publicação, Firebase ou saves de produção.**

## Resumo das alterações implementadas

| Lacuna auditada | Solução S1 | Regra do jogo preservada |
|---|---|---|
| Tier Upgrade não carregado pelo VM | `tests/v012-economy-harness.cjs` carrega `economy/v013-tier-upgrade.js`; `a.forge.tierPreview` e `a.forge.tierUpgrade` expõem as transações do Forge. `scripts/v013-natural-progression.cjs` decide entre investimento em crafting e upgrade de tier. | Usa `WandererV013TierUpgrade.preview/prepare`; E5, E15, E35 e E70 exigem desbloqueio real. Deduz Fragments/Essence, preserva ID, slot, efeitos e equipamento, com rollback em persistência falhada |
| Talentos avançados nunca preparados | `a.talentActions.prepare` espelha a interface de Camp; o agente procura habilidades `advanced` efetivamente compradas, dando prioridade a alvos do perfil. | Nunca prepara uma habilidade não comprada; `WandererAutomaticTalents.valid` verifica o resultado. A escolha entra no `phase1Build.runtime.prepared` ao começar uma expedição |
| Escolhas Magic restritas ou ausentes | `a.talentActions.element` usa `WandererAutomaticTalents.selectElement`; três novos perfis naturais `magic-fire`, `magic-frost` e `magic-lightning`, e uma build controlada `magic-frost` | Cada elemento exige o nó `element_choice` e pré-requisitos. Mudar modo aplica os reembolsos por regras nativas, sem XP gratuito |
| Reset de talentos não exercitado | `a.talentActions.reset` replica a ação gratuita da UI; um agente que falhe pelo menos duas tentativas consecutivas num E pode mudar uma vez de plano, se já tiver quatro nós adquiridos | O reset usa `WandererAutomaticTalents.reset`, preserva XP e apaga escolhas/prepare; permitido apenas fora de expedição. Não força vitória, equipamento nem acesso a E superiores |
| Targets obsoletos em perfis naturais | Retirados `guard`, `might`, `haste`, `vitality` da heurística, que eram IDs inexistentes na árvore v15. Teste de auditoria atualizado de "esperar IDs inválidos" para "não admitir IDs inválidos". | Apenas nós reais da árvore `WandererAutomaticTalents.NODES` são comprados |
| Sem telemetria de novas decisões | Relatório natural passa a contar `tierUpgrades`, `talentResets`, `elementalSelections`, `advancedPrepared`, `preparedActivations` e `strategyPivots`. | Reportar quantidade **não garante ocorrência**; ativação é lida de `r.outerUses[preparedId]`, não inventada |

## Política de decisão — não altera regras

- O modelo de compra no Camp compara a melhoria estimada pelo `gearScore` e os custos reais em Fragments/Essence de um craft ou de um tier-upgrade. A função de prioridade `gain / (fragments + 4 × essence)` é **uma heurística transparente do agente**, não uma fórmula de dano nem uma taxa de conversão do jogo.
- No máximo dois investimentos por Camp nessa política. Crafting real permanece aleatório: o preview **não** garante as stats finais. Os upgrades de tier não fazem reroll.
- A estratégia de reset é limitada: só após duas tentativas não vitoriosas e válidas no mesmo E, a partir da terceira, se já houver pelo menos quatro nós. A mudança é unilateral para aquele agente e é registada. Pode não ocorrer em coortes curtas.
- A escolha `prepared` depende de o nó avançado ter sido realmente comprado. Nenhum perfil começa com pontos, equipamento elevado ou uma habilidade avançada atribuídos gratuitamente.

## Prova automatizada

**<https://github.com/Skinny-lfg/wanderer-game/actions/runs/44631558946> — S1 audit-only: 56 testes aprovados, zero falhas.**

| Suite verificada no GitHub Actions | Aprovados |
|---|---:|
| `tests/v013-s1-parity.test.cjs` — transações, unlocks/custos, três elementos, prepared, reset, pivot, Frost e E1 real | 9/9 |
| `npm run test:v013:sim` — simulador controlado | 7/7 |
| Progressão natural, escolhas, equipamento, árvore de talentos e consistência de perfis v15 | 38/38 |
| `tests/v013-runtime-parity.test.cjs` — Chromium vs VM em um trace real de combate | 2/2 |
| **Total** | **56/56** |

Uma primeira execução da S1 falhou por um **erro no cenário de teste**: 7 Essence deixavam o crafting Uncommon disponível, contrariando a intenção de isolar o Tier Upgrade (que custa apenas 2 Essence para Common E5; crafting Uncommon começa em 4). O cenário foi corrigido para 2 Essence e passou. Esse erro não exigiu alterar as regras de economia.

O teste de paridade Chromium/VM verifica uma trajetória de combate específica, não demonstra equivalência formal de todos os encontros. Os perfis e automatismos da conta natural são heurísticas, não jogadores humanos nem um otimizador exaustivo.

## Distinção essencial: atualização do simulador vs atualização do jogo

Não foi acrescentada nenhuma habilidade, tier, stat, loot ou regra nova ao Wanderer. As mudanças tornam **possíveis e mensuráveis** ações já existentes no jogo para as coortes simuladas. O Firebase continua desnecessário para executar estes testes isolados.

## Limites que ficam para S2/S3

Continuam por cobrir otimização de Runas por família e slots, as 13 poções, Focus Forge, refino, reforços Legendary, todas as combinações armas/armaduras/afinidades, situações de alta dificuldade Brutal e estratégias avançadas de navegação. Atingir E5/E10/E20 depende de vitórias reais nos Bosses; não são atribuídos níveis fictícios. As estatísticas sobre S1 não são prova de balanceamento global.

**Conclusão:** S1 fecha as quatro lacunas funcionais selecionadas e confirma, nos cenários automatizados acima, que as ações são processadas pelo runtime atual. S2 deve trabalhar diversidade e qualidade de decisões antes de simulações de equilíbrio definitivas.
