# Wanderer v0.12 — UI Polish, Responsiveness & Final Audit

Estado: **PASS técnico / PARTIAL Safari** · Branch `development` · sem push, merge ou deploy.

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
| 9–10. Auditoria e relatório | concluído | Diagnóstico comparado com `ed341b4`; fixtures/harnesses corrigidos sem alterar produção. |

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
- Comparação ao estado anterior aos checkpoints (`ed341b4`): `v012-phase-d-endless` passou 9/9 e `v012-runtime-integration` passou 25/25. `v012-economy` já falhava 1/7: o fixture elevava `unlocked` sem sincronizar o checkpoint local, o que bloqueava compras após persistência. A alteração do checkpoint `972e67b` passou a bloquear entrada com Bag 12/12; os simuladores não descartavam loot e falhavam/inacabavam por isso. A regra de produção está correta; os harnesses não reproduziam a ação de descartar.
- `npm test` — **PASS, 293/293**. Inclui harnesses de Economy/Endless/Runtime Integration e a validação da affinity delimitada ao modal (o placeholder do Shrine fora do modal é esperado).
- `npm run test:browser` — **PASS**. Expedition completa (390/1280), Evasion (390/1280), Equipment/Forge/Merchant (360/390/768/1280/1440), private preview (390/1280), treasures/Extraction (390/1280) e Shrine (375/430/768/1440/1920). A fixture de equipamento agora navega de volta à Inventory após equipar e cria progresso sintético consistente; o save local antes/depois do Merchant é inspecionado e mantém `saveBlocked=false`. A fixture do private preview fecha o modal pela ação própria antes de usar Back.
- Harnesses de UI anteriores — **PASS**: Camp 390×844 e 1440×900; UI.1 seis viewports; UI.2 cinco; UI.3 seis; UI.4c cinco; UI.4e cinco, incluindo compra, uso e save/reload de poções.
- Capturas: os testes de browser geraram as capturas nos caminhos temporários previstos pelos harnesses; as comparações persistidas estão em [`screenshots/before`](v012-ui-polish/screenshots/before) e [`screenshots/after`](v012-ui-polish/screenshots/after). Não foram adicionadas capturas novas ao repositório nesta correção.
- Safari/WebKit — **PENDENTE**. Chromium está instalado; o browser WebKit do Playwright e Safari real não estão disponíveis neste ambiente.

## Pendências

1. Executar validação manual em Safari/WebKit.
2. Instrumentar métricas de combate adicionais somente numa tarefa aprovada; até lá, o resumo limita-se aos totais existentes.

## Diagnóstico e correções desta validação

- `tests/v012-economy.test.cjs` e `tests/v0120-equipment-browser.cjs`: as fixtures alteravam o nível desbloqueado do controlador sem atualizar o payload sintético `expedition.completed/unlocked/attempts`. O validador rejeitava corretamente a inconsistência. A fixture agora constrói um checkpoint coerente e verifica o payload persistido sem enfraquecer validação.
- `tests/v0120-equipment-browser.cjs`: o fluxo já regressava ao Camp após equipar, mas o teste continuava a procurar filtros da Inventory. O teste volta a abrir Inventory e verifica a compra e o save Merchant antes/depois.
- `tests/private-preview-browser.cjs`: tentava clicar em Back por trás do modal de affinity aberto. O teste fecha o modal pelo botão Close, depois usa Back; a modal continua modal e os cliques de fundo permanecem bloqueados corretamente.
- `tests/v012-runtime-trace.cjs` e `scripts/v012-affinity-combat-sim.cjs`: agora descartam loot sintético quando a Bag atinge a capacidade de 12, usando a ação normal do runtime. O fixture de hashes foi regenerado com os mesmos cenários e estratégia de descarte; o harness Endless voltou a terminar e as métricas D.7 mantiveram-se.

Não houve alterações de produção, economia, progressão, probabilidades, saves ou Firebase. O snapshot de referência `ed341b4` foi extraído para `/tmp` apenas para comparação; saves reais não foram lidos nem escritos.

## Estado do Git e publicação

As alterações locais anteriores em `index.html`, `online/v012-ui4c.css` e capturas anteriores foram preservadas e ficam fora deste commit. O commit local desta correção contém apenas fixtures, harnesses de teste, a referência determinística e este relatório. Não houve push, merge, deploy nem alteração de `main`.

Os screenshots de “before” reutilizam o estado local imediatamente anterior ao trabalho, guardado no stash no início desta tarefa; “after” são capturas Chromium feitas após as alterações. Os dois conjuntos não são capturas sincronizadas frame-a-frame.
