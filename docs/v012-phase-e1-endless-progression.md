# Wanderer v0.12 — E.1: auditoria da progressão Endless

**Estado: FAIL da validação, sem conclusão de balanceamento.** `development` em `a58c928` (D.6 `74f372b` e ícones dos passivos). Nenhuma regra de produção foi alterada.

## A. Sistemas reais

| Mecânica | Regra implementada | Origem / limite |
| --- | --- | --- |
| Recompensas e drops | Cada wave vencida concede `round(roll(3,6)+floor(E×0.5)+bónus)` Gold e `round(roll(1,3)+floor(E×0.24)+bónus)` Fragments. Probabilidade de gear por wave: 22%, 32%, 47%, 84%, 100%; boss garante drop. Raridades variam por wave e CHA. | `online/v012-expedition-runtime.js`, `economy/v012-loot-rules.js`. |
| Tier e raridade | Loot tem o tier da Expedition jogada, não da máxima desbloqueada. Gear gerado acima de E200 escala atributos numéricos apropriados por `1+0.0048×(tier−200)`. Forge e Merchant usam até ao tier desbloqueado. | `online/v012-expedition-runtime.js`, `economy/v012-equipment-runtime.js`, `combat/v012-combat-core.js`. |
| Forge | Standard custa `10+10×tier` Fragments; High Quality 2× e Masterwork 3×. No tier desbloqueado, Epic tem 6%/12%/15% de probabilidade nestas três qualidades; Forge não produz Legendary. Craft E200: 2010/4020/6030 Fragments; E300: 3010/6020/9030. Reforço só de Legendary, custo `round((25+4×tier)×1.14^rank)`, até rank 10. | `economy/v012-loot-rules.js`, `economy/v012-equipment-runtime.js`, `economy/v0101.js`, `index.html`. |
| Runas | Uma vitória oferece três Runas distintas do tier vencido; o jogador escolhe uma. Existem três slots, equipar substitui sem destruir a Rune anterior. | `economy/v012-equipment-runtime.js`, `online/v012-expedition-runtime.js`, `combat/v012-runes.js`. |
| Moeda e valuables | Gold/Fragments de waves permanecem após derrota; loot/valuables da Bag são perdidos. Vender valuables protegidos converte os valores fixos do catálogo (8–55 Gold). O cálculo local de `worth` dependente do tier antes de criar o treasure é atualmente ignorado. | `online/v012-expedition-runtime.js`, `online/v012-treasures.js`, `economy/v012-equipment-runtime.js`. |
| Recuperação | Gear equipado é protegido; apenas os itens físicos da Bag se perdem. É permitido iniciar qualquer Expedition entre E1 e a máxima desbloqueada. Bag: 12 itens; Stash base: 40 slots. | `online/v012-persistence-runtime.js`, `online/v012-expedition-controller.js`, `index.html`. |
| Limites | Não há cap de gameplay E200. Forge, drops e Runas aceitam tiers superiores; Stash pode crescer até 300 e inventário de Runas está limitado a 300. | `combat/v012-combat-core.js`, `index.html`, `economy/v012-equipment-runtime.js`. |

## B. Tentativa de progressão e validade

Foram executadas **300 novas Expeditions**, três seeds por perfil, com combate, eventos, loot, perda por derrota, Forge e salvamento em memória do runtime real. Os nove estados iniciais eram **hipóteses**, pois não existe uma distribuição de saves de jogadores E200 nesta auditoria: Bow/Leather com nove peças de loot E190–E199 (7 Epic, 2 Rare), sem Legendaries, três Runas E190/E194/E198, 4000 Gold e 3000 Fragments por seed. Estes recursos são plausíveis face às fórmulas de recompensa, mas não foram reconstruídos de uma história completa E1–E199. A escolheu passivos aleatoriamente e Forge Standard ocasional; B planeou Affinities e usou High Quality; C reservou crafts para recuperar de derrotas. Os eventos foram declinados.

**Falha da instrumentação:** o harness de combate existente recriava Runas ao nível da Expedition em cada chamada. Embora equipamento, moeda e desbloqueios tenham persistido, as Runas iniciais foram substituídas por Runas E200 (e E201 após o único desbloqueio), sem vitória nem compra correspondente. As corridas seguintes não representam a progressão solicitada. Os números abaixo são apenas diagnósticos da execução inválida; não sustentam uma conclusão sobre dificuldade ou sustentabilidade.

| Perfil | Tentativas | Vitórias / derrotas | Máxima desbloqueada | Realm média alcançada | Gear final médio | Runas finais* | Gold obtido / gasto | Fragments obtidos / gastos | Crafts / equipadas | Repetições | Bag perdida |
| --- | ---: | ---: | ---: | ---: | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| A — Normal | 102 | 0 / 102 | E200 | 5,9 | E194,1 | E200 | 95 822 / 0 | 58 290 / 54 270 | 27 / 0 | 0 | 604 itens |
| B — Otimizado | 99 | 1 / 98 | E201 | 9,4 | E194,4 | E200–E201 | 125 290 / 0 | 82 740 / 80 540 | 20 / 1 | 0 | 738 itens |
| C — Recuperação | 99 | 0 / 99 | E200 | 9,3 | E194,1 | E200 | 124 830 / 0 | 78 213 / 80 400 | 40 / 0 | 0 | 768 itens |

\* Runas finais incorretas por causa do harness. O perfil C não pôde repetir uma Expedition anterior para recuperar, pois não ultrapassou E200 nesta execução. E225, E250, E275 e E300 **não foram observados**. A duração registada é apenas de combate, não tempo real de jogo: A 2055 s, B 2432 s, C 2408 s, agregados por perfil.

## C. Problemas e D. Recomendações para E.2

| Classe | Causa e consequência | Próximo passo / impacto esperado |
| --- | --- | --- |
| **TEST LIMITATION — bloqueante** | O harness repõe `s.runes` a E em cada corrida. Gera poder sem progressão real e invalida as trajetórias. | Remover apenas essa reposição na cópia isolada do harness e verificar que inventário, slots e IDs de Rune persistem entre tentativas. Repetir a matriz em tarefa separada com novo limite autorizado; não alterar produção. |
| **TEST LIMITATION** | 300 tentativas para nove trajetórias permitem, mesmo com 100% de vitórias, no máximo cerca de 33 avanços por trajetória. E300 requer 100 vitórias por trajetória a partir de E200. | Avaliar primeiro E200–E225 com três seeds/perfil; para observar E300 em todos os nove percursos seriam necessárias **pelo menos 900 vitórias**, além das derrotas e repetições. Declarar explicitamente um novo orçamento antes de expandir. |
| **TEST LIMITATION** | Estados E200 plausíveis foram gerados a partir de fórmulas, mas sem histórico E1–E199; o Merchant não foi usado e nenhuma repetição anterior ocorreu. | Fixar estados iniciais reproduzíveis ou amostrar uma distribuição sintética derivada de uma auditoria histórica separada; incluir políticas de compra e recuperação no próximo teste. Não inferir suficiência de Gold desta execução. |
| **BALANCE — risco por confirmar** | Forge no tier E200 custa 2010–6030 Fragments por tentativa, enquanto gear da Bag se perde em derrota. A execução inválida fez muitos crafts e quase nenhuma melhoria equipada. | Medir custo por melhoria **efetivamente equipada** e tentativas por avanço no harness corrigido. Não recomendar preço, drop rate ou coeficiente novo com estes dados. |
| **DESIGN — risco por confirmar** | Valuables têm worth fixo 8–55 Gold mesmo acima de E200; existe um cálculo de worth escalado que não chega ao item. A taxa real de Gold depende sobretudo das waves. | Confirmar se a economia pretendida usa os valores fixos aprovados em C.3; só então avaliar o impacto de Gold em E200–E300. Não mudar a fórmula nesta fase. |

**Decisão:** auditoria E.1 inconclusiva por falha de instrumentação e limite de execução atingido. O aparente bloqueio em E200 **não é prova de bloqueio de gameplay**. Nenhum ajuste de balanceamento é recomendado antes de repetir trajetórias válidas.
