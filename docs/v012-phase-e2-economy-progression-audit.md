# Wanderer v0.12 — E.2, auditoria sintética da economia e progressão E200+

**Execução: PASS técnico, auditoria de sustentabilidade: INCONCLUSIVA.** Amostra sem deploy, apenas `development`.

## Método

270 Expeditions genuínas (30 tentativas por 9 estados sintéticos), três seeds por perfil A Normal, B Otimizado, C Recuperação. Estado Bow/Leather E196–200 e Runas E190/E195/E199 de E.1.3. O harness preservou equipamento, inventário, Runas, desbloqueios e recursos entre tentativas. Estratégias económicas e escolhas de Affinity diferem conforme o perfil. Nenhum ajuste de dificuldade, preços ou drops.

- Execução inicial: https://github.com/Skinny-lfg/wanderer-game/actions/runs/39666022736
- Artefacto de trajetórias da execução inicial: https://github.com/Skinny-lfg/wanderer-game/actions/runs/39666022736/artifacts/12377338765
- Reexecução com agregados económicos: https://github.com/Skinny-lfg/wanderer-game/actions/runs/39666213186
- Ambas produziram 270 tentativas, 137 vitórias, 133 derrotas, zero erros e zero timeouts. E.1.2 T1–T5 regressaram com sucesso.

## Progressão observada

| Perfil | Tentativas | Vitórias | Derrotas | Níveis desbloqueados finais |
| --- | ---: | ---: | ---: | --- |
| A Normal | 90 | 39 | 51 | E213, E208, E218 |
| B Otimizado | 90 | 52 | 38 | E217, E217, E218 |
| C Recuperação | 90 | 46 | 44 | E218, E210, E210 |
| TOTAL | 270 | 137 | 133 | máximo E218 |

Nenhuma trajetória atingiu E225. O perfil C realizou 14 repetições de níveis anteriores, pelo que vitórias não equivalem necessariamente a avanços.

## Economia agregada (três seeds por perfil)

| Métrica | A | B | C |
| --- | ---: | ---: | ---: |
| Crafts | 24 | 42 | 10 |
| Melhorias equipadas | 5 | 18 | 5 |
| Runas reclamadas | 37 | 51 | 45 |
| Gold ganho | 234586 | 203282 | 206238 |
| Gold gasto | 0 | 0 | 0 |
| Gold final | 246586 | 215282 | 218238 |
| Fragments ganhos incluindo salvage | 442308 | 519833 | 418278 |
| Fragments gastos | 49740 | 176620 | 20860 |
| Fragments finais | 401568 | 352213 | 406418 |
| Derrotas com telemetria fatal preenchida | 51/51 | 38/38 | 44/44 |

O Gold é acumulado e não gasto pela política atual. Isto **não prova** que a economia real de Gold seja demasiado generosa: o simulador não usa Merchant, e a política inicial deliberadamente não compra equipamento. Os Fragments acumulam também, mas esta política não permite concluir sustentabilidade económica geral. Melhorias por craft (incluindo melhorias de loot) não equivalem a qualidade de craft; é necessário rastrear a origem do item melhorado para custo estritamente por craft efetivo.

Os itens finais médios por seed (tier): A [200.6,197.9,198.8], B [204.8,203.6,204.8], C [202.6,198.2,198.2]. A telemetria do tick fatal existe em todas as 133 derrotas.

## Conclusões e limites

**PASS da instrumentação e progressão além de E200**, não PASS de economia sustentável até E225–E300. Com 9 estados sintéticos, apenas Bow/Leather, sem política de Merchant e sem históricos E1–199, a validade externa continua limitada. A estratégia B parece mais consistente nestas seeds, mas ainda não justifica ajustar dificuldade ou preços. Nenhuma mudança em gameplay/economia recomendada.

Próximo passo proposto: E.2.1 auditar gasto de Gold via Merchant e comparar ganhos/gastos líquidos com políticas explícitas; expandir a E225 com novas seeds, respeitando que as repetições C não desbloqueiam níveis. Não chamar simulações E225/E300 concluídas enquanto os níveis não forem observados.
