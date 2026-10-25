# Wanderer v0.12 — E.2.7 Apothecary, economia persistente

**PASS técnico das 1.080 tentativas; conclusão de balanceamento provisória.**

Execução: https://github.com/Skinny-lfg/wanderer-game/actions/runs/39672047907

## Âmbito

Quatro políticas independentes, nove estados iniciais sintéticos por política e 30 Expeditions por personagem; 1.080 tentativas no total. Todas começam com 4.000 Gold, 3.000 Fragments e a base Bow/Leather E196–200, Runas E190/E195/E199. Inventários, equipamentos, ganhos, custos, Forge e desbloqueios são preservados entre tentativas por personagem. As poções são compradas e reabastecidas através da API real do Apothecary; apenas é permitido comprar com Gold disponível, com refresh limitado e baseado em condições. O simulador aplica as poções selecionadas entre Realms segundo a sua política.

| Política | Vitórias /270 | Máximo desbloqueio | Gold recebido | Gold gasto Apothecary | Gold final | Poções compradas | Usos entre Realms | Loot mantido | Loot perdido |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Base | 177 | E225 | 610937 | 0 | 646937 | 0 | 0 | 1642 | 769 |
| Sobrevivência | 222 | E229 | 629440 | 135984 | 529456 | 236 | 230 | 2033 | 400 |
| Fortune | 215 | E229 | 625238 | 150308 | 510930 | 231 | 179 | 2044 | 452 |
| Adaptativa | 211 | E229 | 624477 | 147263 | 513214 | 231 | 190 | 1996 | 494 |

Despesas por compra / reroll:
- Sobrevivência: 113058 / 22926 Gold.
- Fortune: 131814 / 18494 Gold.
- Adaptativa: 129389 / 17874 Gold.

Todas as simulações executadas sem erros ou timeouts.

## Interpretação

Sobrevivência melhorou as vitórias em +45 relativamente à base (222 vs 177), e teve menor volume de perda de loot. Fortune ganhou apenas +11 itens conservados face à sobrevivência (2044 vs 2033), mas venceu 7 vezes menos e gastou mais 14324 Gold. Com esta amostra, não se justifica enfraquecer a Potion of Fortune nem reequilibrar dificuldades.

## Limitações técnicas fundamentais

- `potionUses` conta usos que passam pela API `phase6UsePotion` entre Realms; **não conta o consumo automático da Potion of Fortune no começo da Expedition**. O número de poções consumidas é superior ao reportado nas colunas de usos entre Realms quando Fortune foi selecionada.
- As políticas são heurísticas simples de compra/reabastecimento e não refletem necessariamente jogadores reais. Quando um kit inteiro não está acessível, a política pode entrar com seleção parcial. Compras e rerolls têm limites fixados apenas para o harness.
- Os grupos reutilizam as mesmas sementes iniciais, mas as ações de compra e combate alteram a evolução de RNG, portanto nem todas as trajetórias são estritamente emparelhadas a cada decisão.
- Gold final é soma dos nove agentes, não prova que todos individualmente têm saldo suficiente. Não se calculou custo completo por upgrade útil, ROI monetário real de itens nem valor comercial do equipamento; os itens não têm avaliação única em Gold que permita afirmar lucro líquido total.
- O código de auditoria preserva a mesma política geral de Forge de referência, mas não valida uma gama de builds (Staff, Wand, Shield, Daggers, etc.) nem a progressão além de E229.
- Não há garantia de disponibilidade consistente dos kits no Apothecary, dado que o stock é aleatório.
- A métrica `reached` do simulador não deve ser usada como progresso real; usar o desbloqueio final do controller.

## Decisão

**Não alterar ainda o balanceamento do jogo.** Próxima validação: separar custos e recuperações de cada potion (incluindo Fortune), e comparar builds Bow/Leather e caster, mais resultados de Gold por jogador e margem de poder avançar E230+.
