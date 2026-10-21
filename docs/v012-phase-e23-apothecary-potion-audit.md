# Wanderer v0.12 — E.2.3 Apothecary: paired E200 potion experiment

**PASS técnico / evidência preliminar de eficácia; economia ainda não validada.**

Run: https://github.com/Skinny-lfg/wanderer-game/actions/runs/39668444584

## Método
120 execuções E200 com as mesmas 24 seeds em cinco grupos: sem poções, sobrevivência [health,ironhide,barrier], ofensivo [might,haste,health], três health, especializado [health,barrier,haste]. São perfis sintéticos Bow/Leather E196–E200, Rune E190/195/199, política de combate triple com afinidades planeadas. Aplicam-se poções pelo caminho nativo entre Realms; não se aplicam diretamente os efeitos nem se altera balanceamento.

**Limitações:** As poções são disponibilizadas no inventário inicial de teste, sem compra ao Apothecary. `selectedGold` é custo teórico do conjunto selecionado, **não custo efetivo**: o simulador ainda não conta devoluções ao fim nem poções não consumidas. `reached` reportou 15 também para derrotas, pelo que não é métrica adequada para evolução de progresso neste ensaio; usar apenas vitória/derrota. As políticas usam poções não-Health assim que o motor permite, em vez de otimização perfeita de timing. A diferença é observacional neste conjunto de seeds, não causalmente atribuída a cada poção individual.

| Cenário | Vitórias /24 | Usos aceites pelo motor | Custo teórico total de seleção |
| --- | ---: | ---: | ---: |
| Base | 18 | 0 | 0 |
| Sobrevivência | 24 | 59 | 39 600 Gold |
| Ofensivo | 23 | 61 | 39 600 Gold |
| Três Health | 24 | 16 | 25 200 Gold |
| Especializado | 24 | 59 | 44 400 Gold |

Todos os grupos: zero erros, zero timeouts. A comparação aponta para um efeito forte de Health e defensivos neste perfil, mas pode haver saturação de vitória no teto da amostra. Não ajustar HP, danos, drops ou preços com estes números.

## Próximo teste necessário
1. Compra de poções via `phase6BuyPotion` usando stock verdadeiro do Apothecary, contabilizando rerolls, preço, consumo, devolução e loss em derrota.
2. Instrumentação de HP no começo e fim de cada Realm, dano fatal e ações de poções; validar que as políticas de utilização são coerentes.
3. Expandir para perfis Leather/Plate/Cloth com builds relevantes e regiões E200–E225, com seeds pareadas e amostra maior.

Nenhuma mudança de produção, saves, Firebase ou main.
