# Wanderer v0.12 — E.2.4 Apothecary economy, purchases and settlement

**PASS técnico de compras, seleção e tratamento das poções após vitória/derrota; impacto económico por vitória real ainda por validar.**

Execution: https://github.com/Skinny-lfg/wanderer-game/actions/runs/39669282046

## O que foi testado

24 seeds de harness isolado, com nível E200 e Gold sintético de teste. Cada seed consulta a loja real do Apothecary, faz rerolls até encontrar Health, Ironhide e Barrier, compra as três pelo método real, confirma débito de Gold e inventário, seleciona três potions e executa início nativo da preparação. Metade das seeds chama a rotina de retorno com estado de vitória e metade com derrota. A rotina é chamada diretamente: **não houve vitória/derrota obtida por combate** nesta bateria.

| Métrica | Resultado |
| --- | ---: |
| Seeds | 24 |
| Compras de poções bem-sucedidas | 72/72 |
| Rerolls reais | 178 |
| Gold gasto nas compras + rerolls | 59.536 |
| Poções devolvidas (12 settlements como vitória) | 36/36 |
| Poções perdidas (12 settlements como derrota) | 36/36 |
| Erros/assertions | 0 |

## Interpretação

A política artificial de procura pode gastar muito Gold em rerolls para encontrar conjuntos específicos e não representa o comportamento médio de compradores. As três poções estavam sempre por usar antes da liquidação, de modo que não se mediu o efeito de poções consumidas numa Expedition real. O valor 59.536 é custo de **compra/reposição inicial**, não custo líquido por vitória. O comportamento nativo confirma que poções não usadas regressam com vitória e deixam de estar disponíveis com derrota. Em E.2.3, os 120 combates A/B mediram efeito positivo com poções sintéticas, mas o custo de compra não foi debitado; estes dois testes não devem ser somados como se fossem uma única trajetória integrada.

## Próximo passo

Combinar compra real + três slots + consumo durante intervalos + vitória/derrota natural + devolução/perda + custo por vitória no mesmo harness, mantendo seeds pareadas, sem alterar a produção; incluir uso dos recursos persistente entre tentativas, com preço observado e custos de reroll separados. Não ajustar Blacksmith, Apothecary ou combate antes disso.
