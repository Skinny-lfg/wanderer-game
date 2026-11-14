# v0.13 — reorganização da árvore permanente

## Alterações

- Pequenos nós de stats mantidos, incluindo stats repetidos para progredir e ligar famílias.
- Percursos definidos por função em cada família, em vez de distribuição automática por ordem de catálogo. Exemplo Blood: Bleeding Edge → Deep Cuts → Executioner; rotas paralelas para Blood Drinker e Sanguine Fury.
- Ranks adicionais em pequenas ramificações laterais, com número visível; o primeiro rank permite seguir para a próxima habilidade.
- Oito pares de especialização usam dois nós de stats partilhados antes da escolha. As alternativas têm o mesmo custo de acesso e mantêm exclusão mútua.
- Lightning passa por Overcharge e pelo caminho Lightning; talentos mistos continuam a exigir as duas raízes e os dois caminhos de stats.
- Layout mais próximo das raízes, sem nós sobrepostos nem ligações a passar sobre outros nós nas verificações geométricas, incluindo arcos centrais e cópias de raízes mistas.
- Grupos mistos em três colunas, com as affinities repetidas claramente identificadas como o mesmo talento, sem linhas a atravessar a árvore principal.
- Selecionar inspeciona; botão Allocate confirma o gasto. O painel mostra descrição, requisitos e custo restante do percurso, que fica destacado.
- Navegação por família, arrasto, zoom, centro ajustado ao ecrã, inspeção touch e navegação por setas com uma entrada de teclado na árvore.
- Atributos e elemento mantêm-se disponíveis numa secção expansível. Totais dos stats e bónus coloridos mantidos.
- Corrigidos os dois pontos iniciais: disponíveis na árvore, sem conceder atributos adicionais.

## Custos de acesso

Valores desde zero nós atribuídos; incluem todos os requisitos, não apenas o nó final. Os pontos iniciais fazem parte deste investimento.

| Alternativas | Pontos para qualquer uma |
|---|---|
| Hemorrhage / Bloodshed | 11 |
| Corruption / Contagion | 8 |
| Recovery / Endurance | 8 |
| Bulwark / Reprisal | 11 |
| Focused Assault / Momentum | 8 |
| Smoldering Heart / Wildfire | 9 |
| Biting Cold / Winter Field | 9 |
| Focused Discharge / Storm Conductor | 9 |

## Validação e limites

84 testes v0.13 passam. Testes incluem todos os talentos alcançáveis dentro do orçamento, dependências sem ciclos, igualdade de custos, barreiras de elementos/híbridos, pontos iniciais e geometria. Chrome: compras sem gasto acidental na inspeção/arrasto, reload, desktop/mobile, touch, teclado, mapa, combate, crafting e extração. Screenshots revistos.

Suite histórica: 394 testes, 312 passam e 82 falham, como antes. Estes resultados verificam estrutura e funcionamento; não demonstram equilíbrio de DPS, eficiência económica ou preferência dos jogadores. Sem alterações a animações ou taxas de loot.
