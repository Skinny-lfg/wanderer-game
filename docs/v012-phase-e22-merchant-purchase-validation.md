# Wanderer v0.12 — E.2.2 Merchant Purchase Validation

**PASS técnico de compra; suspeita de fraca competitividade das ofertas sustentada nesta amostra.**

GitHub Actions: https://github.com/Skinny-lfg/wanderer-game/actions/runs/39667514121
Commit do workflow: `ce44d1f`.

## Teste realizado

30 seeds, cada uma com Bow E198 Epic e cinco armaduras Leather E198 Epic, acompanhados de outros itens equipados produzidos pelo gerador. O Merchant apresenta quatro itens por stock e executa quatro refreshes por seed: 600 ofertas avaliadas. Só se considera comparação equipável quando slot, subtype e armorType coincidem com o item equipado. O `Power` é calculado pelo motor real do harness. Cada seed conclui também uma **compra de teste real**, mesmo que não seja upgrade, para verificar débito de Gold, entrada no Stash, preservação de identidade do item e substituição de stock.

| Medida | Observado |
| --- | ---: |
| Seeds | 30 |
| Ofertas | 600 |
| Ofertas compatíveis | 223 |
| Ofertas com ganho estritamente positivo de Power | 4 |
| Ofertas positivas por total | 0,67% |
| Ofertas acima de um item loot sintético da mesma raridade e tier no comparador | 0 |
| Compras de teste validadas | 30/30 |
| Gold debitado por compras de teste | 98.658 |

**Limitação do comparador loot:** foi gerado um item loot independente no mesmo tier e raridade de cada oferta, e não foi recolhida uma distribuição real de drops observados nas 270 Expeditions E.2. O resultado 0/600 não prova dominância estatística do loot sobre o Merchant; é um diagnóstico emparelhado de geração, influenciado pelo RNG e pelas regras de raridade.

**Limitação dos números:** as 30 compras foram intencionais, não escolhas económicas racionais; o dinheiro gasto não é custo por upgrade. O Power agregado pode não refletir Affinity, sinergia ou efeitos de combate. O uso de uma build inicial forte Epic E198 torna a exigência elevada. Não atribuir os 4 casos exclusivamente a problemas de raridade sem recolher distribuições de raridade e slot.

## Decisão

O percurso real de compra funciona no harness. Existe evidência de **baixa utilidade marginal** das ofertas para uma build Epic E198 E200: apenas 4/600 melhoravam Power, apesar de 223/600 terem subtipo/armadura compatível. Ainda não ajustar preços, raridades ou chances. E.2.3 deve comparar distribuição de raridades e tiers por origem, identificar rendimento por compra/reroll em perfis Normal/Rare/Epic, e medir sinergias para escolher uma função económica específica para o Merchant (ex.: especialização/afinidades em vez de oferecer simplesmente equipamento mais forte).
