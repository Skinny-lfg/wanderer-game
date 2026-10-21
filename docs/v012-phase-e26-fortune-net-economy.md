# Wanderer v0.12 — E.2.6 Fortune: compras nativas, Gold líquido e loot conservado

**PASS técnico, sustentabilidade condicionada ao investimento inicial sintético.**
GitHub Actions: https://github.com/Skinny-lfg/wanderer-game/actions/runs/39670238003

## Método
96 Expeditions E200: quatro estratégias, 24 seeds emparelhadas cada. Compra de poções pelo método real do Apothecary; quando indisponível, refresh real; seleção nos 3 slots e utilização pelo simulador nos intervalos entre Realms, com consumo e devolução/perda do runtime. Para garantir liquidez nos testes, 30 000 Gold **sintéticos** iniciais por seed (não trajetória E1–199); outros atributos mantêm a fixture Bow/Leather E196–200 com Runas E190/195/199. Nenhum ajuste de produção.

| Cenário | Vitórias / 24 | Loot mantido | Loot perdido | Treasure mantido | Gold recompensas | Gold compras | Gold rerolls | Saldo Gold recompensas - custos |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Sem poções | 18 | 149 | 58 | 66 | 50 897 | 0 | 0 | +50 897 |
| Fortune + Health + Haste | 23 | 226 | 10 | 78 | 51 443 | 51 600 | 24 304 | -24 461 |
| Fortune + Might + Ironhide | 16 | 159 | 89 | 49 | 50 665 | 51 600 | 30 128 | -31 063 |
| 3 Health | 24 | 213 | 0 | 83 | 51 571 | 25 200 | 4 256 | +22 115 |

Todas as 96 execuções: 0 erros, 0 timeouts.

## Conclusões
- Fortune + Health + Haste recuperou mais loot **fisicamente retido**, mas perdeu Gold líquido, sobretudo devido a compras e rerolls.
- Três Health maximizou sobrevivência nesta pequena amostra e exigiu menos Gold.
- Fortune + Might + Ironhide mostrou risco de perder loot apesar do aumento de itens *gerados*. Isto não significa que Fortune reduza vitórias: a comparação altera várias poções de uma só vez.
- Fortune aumenta apenas a probabilidade de drop relativa em 25% (cap 100%); não altera diretamente raridade.
- O Gold líquido não equivale a lucro total, pois não foi atribuído valor de venda de equipamento ao loot.
- A despesa contabiliza a aquisição inicial das 3 poções, incluindo as devolvidas após vitória. Em *uso repetido* o custo marginal poderá ser inferior: não se executou stock persistente ao longo de múltiplas Expeditions no mesmo jogador.
- O resultado depende de Gold inicial artificialmente elevado e do número de rerolls necessários para encontrar kits específicos. Nem todas estas compras seriam alcançáveis com a reserva E200 inicial das auditorias anteriores.
- A raridade no kit Arcane/Mana não foi avaliada nesta fase.

## Recomendação
**Não alterar balanceamento nem preços já.** Próximo experimento: trajetórias persistentes com 4 000 Gold iniciais, compras quando há Gold, aproveitar stock devolvido, estratégia Fortune quando acessível e custo marginal por vitória. Comparar survival e Fortune com decisões *económicas* e não compras forçadas em cada tentativa.
