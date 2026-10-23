# Wanderer v0.12 — UI Polish, Responsiveness & Final Audit

Estado: **PARTIAL** · Branch `development` · sem push, merge ou deploy.

O trabalho foi guardado em checkpoints locais por secção. As capturas de comparação estão em [`screenshots/before`](v012-ui-polish/screenshots/before) e [`screenshots/after`](v012-ui-polish/screenshots/after).

## Checkpoints

| Secção | Commit | Alterações |
|---|---|---|
| 1. Componentes globais | `6ccbd01` | Fill partilhado, tabs, painéis secundários, Health/Mana retangulares e molduras de componentes equivalentes. |
| 2. Camp | `e9b82c0` | Slots/interações de equipamento e personagem; clique no logótipo regressa ao Camp. |
| 3. Inventory | `28581ff` | Ações de Inventory expostas, NEW removido apenas do item equipado, atributos principais alinhados e grelha responsiva. |
| 4. Between Realms | `c87dee6` | Ações antes das tabs, equipamento reutilizado, Bag quadrada e sem slots de poções no painel de gear. |
| 5. Expedition / Combat | `972e67b` | Painéis alinhados, passivos recolhíveis e abaixo da arena, feedback discreto de dano/loot e bloqueio de avanço com Bag 12/12. |
| 6. City Center | `850fd10` | Compra de poção substitui só o slot comprado; os outros permanecem iguais. |
| 7. Shrine | `23db7f4` | Placeholder artístico reutilizado, proporção preservada, sem bloco Back to Camp extra. |
| 8. Extraction Complete | `24dee8e` | Removido o Last Realm Combat Log do resumo final; apresentados apenas totais de Expedition já registados pelo runtime. |
| 9–10. Auditoria e relatório | pendente | Este relatório e correções de expectativas obsoletas nos testes. |

## Limites das métricas da extração

O resumo mostra damage dealt, damage taken, mana spent, mana-funded casts e total de procs apenas quando os totais são válidos e positivos. A implementação atual não regista totais separados de dano físico/mágico/DoT, dano mitigado/bloqueado, cura ou barrier absorvida; não foram estimados nem inventados. Não foi alterada a resolução de combate.

## Validação executada

- Chromium Camp interaction: 390×844 e 1440×900 — **PASS**.
- UI.1: 360×800, 390×844, 768×1024, 1024×768, 1280×720 e 1440×900 — **PASS**.
- UI.2, incluindo Between Realms, slots, tabs, Bag e combate: 360×800, 390×844, 768×1024, 1024×768 e 1280×720 — **PASS**.
- UI.3, incluindo Blacksmith, Merchant, Apothecary, affinities e extração — os mesmos seis viewports — **PASS**.
- UI.4c, incluindo Camp, Merchant, combate, Between Realms e resumo — os mesmos seis viewports — **PASS**.
- UI.4e, poções/refresh/persistência isolada: 375×812, 430×932, 768×1024, 1440×900 e 1920×1080 — **PASS**.
- Shrine placeholder: 390×844 e 1280×800 — **PASS**.
- Testes unitários direcionados de Equipment: 15/15 — **PASS**; Combat e Potions: 2/2 — **PASS**.
- `npm test` — **PARTIAL**. A verificação da affinity foi corrigida para limitar a ausência de arte ao modal de affinity; o placeholder do Shrine é esperado noutra página. Continuam falhas nos testes/harnesses `v012-economy`, `v012-phase-d-endless` e `v012-runtime-integration` (incluindo traces que não terminam sob a regra atual de Bag cheia). Não alterei regras de jogo para fazer esses testes passar.
- `npm run test:browser` — **PARTIAL/FAIL**. O browser completo passou as Expeditions sintéticas em 390 e 1280 px e os testes de Evasion; a cadeia para em `v0120-equipment-browser.cjs` durante Forge, porque a fixture chega com `saveBlocked` e não abre o diálogo de crafting. O restante workflow encadeado não foi executado por causa dessa falha. Os testes focados de UI listados acima passaram.
- Safari/WebKit — **PENDENTE**; não havia Safari real/WebKit disponível nesta validação.

## Pendências

1. Corrigir a fixture `v0120-equipment-browser.cjs` para começar com um snapshot válido e verificar Forge sem contornar a proteção `saveBlocked`.
2. Atualizar os harnesses de economia/Endless/runtime para conseguirem resolver Bag cheia respeitando o estado permitido, e diagnosticar as divergências restantes.
3. Instrumentar métricas de combate adicionais somente numa tarefa aprovada; até lá, o resumo limita-se aos totais existentes.
4. Executar validação manual em Safari/WebKit.

Os screenshots de “before” reutilizam o estado local imediatamente anterior ao trabalho, guardado no stash no início desta tarefa; “after” são capturas Chromium feitas após as alterações. Os dois conjuntos não são capturas sincronizadas frame-a-frame.
