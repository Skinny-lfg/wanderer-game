# Wanderer v0.12 — UI.5 Auditoria final

Data: 22 outubro 2026
Branch: `development`
UI.4 auditada: `4f7b12d0bb8cf603517fe8f2c32d8b0530437cb3`
Estado: **PARTIAL — integração em `main` não recomendada até à revalidação dos fluxos de persistência e do teste de geometria mobile.**

## Estado das fases

| Fase | Estado observado |
|---|---|
| UI.0 — correções críticas | Publicada; regressão Chromium 6/6 PASS |
| UI.1 — Camp e Inventory | Publicada; regressão Chromium 6/6 PASS |
| UI.2 — Combat e Between Realms | Publicada; regressão Chromium 5/5 PASS |
| UI.3 — City Center, affinities e Extraction | Publicada; regressão Chromium 6/6 PASS |
| UI.4 — UI Kit e polimento | Publicada; regressão Chromium 6/6 PASS; moldura 9-slice carregada |
| C.3 — treasures | Browser regression em 390px e 1280px PASS |

## Auditoria visual

As capturas recentes mostram Camp, Inventory, Merchant, Extraction, Combat, Between Realms, Blacksmith, Apothecary, affinities, passivos e eventos. Os testes UI.0–UI.4 cobrem 1440×900, 1280×720, 1024×768, 768×1024, 390×844 e 360×800, conforme a fase. Não houve scroll horizontal nos fluxos cobertos. A UI.2 isolada usa cinco larguras e ainda não foi repetida em 1440px.

| Ecrã | Capturas atuais |
|---|---|
| Camp / Inventory | [Camp 1280](ui4-screenshots/camp-after-1280.png), [Camp 390](ui4-screenshots/camp-after-390.png), [Inventory 1280](ui4-screenshots/inventory-after-1280.png), [Inventory 390](ui4-screenshots/inventory-after-390.png) |
| City Center | [Blacksmith 1280](ui5-screenshots/wanderer-ui3-blacksmith-1280.png), [Merchant 1280](ui4-screenshots/merchant-after-1280.png), [Merchant 390](ui4-screenshots/merchant-after-390.png), [Apothecary 390](ui5-screenshots/wanderer-ui3-apothecary-390.png) |
| Shrine / affinities | [Affinities 1280](ui5-screenshots/wanderer-ui3-affinities-1280.png), [Affinities 390](ui5-screenshots/wanderer-ui3-affinities-390.png) |
| Combat / Between Realms | [Combat 1280](ui5-screenshots/wanderer-ui2-combat-1280.png), [Combat 390](ui5-screenshots/wanderer-ui2-combat-390.png), [Between 1280](ui5-screenshots/wanderer-ui2-between-1280.png), [Between 390](ui5-screenshots/wanderer-ui2-between-390.png) |
| Passivos / eventos | [Passivos 390](ui5-screenshots/passives-390.png), [Evento 1280](ui5-screenshots/events-1280.png), [Evento 390](ui5-screenshots/events-390.png) |
| Extraction | [Extraction 1280](ui4-screenshots/extraction-after-1280.png), [Extraction 390](ui4-screenshots/extraction-after-390.png) |

As capturas foram feitas com Chromium e estado local sintético. Algumas capturas mobile incluem o menu de conta aberto pelo fixture; ele não bloqueou as verificações de layout, mas essas imagens não representam uma composição de menu fechado.

## Funcionalidade e testes

| Verificação | Resultado |
|---|---|
| Regressões browser UI.0, UI.1, UI.2, UI.3, UI.4 | PASS: 6/6, 6/6, 5/5, 6/6, 6/6 |
| C.3 treasures: imagem, Stash, Sell All, resumo | PASS: 390px e 1280px |
| Merchant: 4 ofertas/categoria, alternância sem stock novo, Compare, Buy, Restock | PASS em UI.3 browser regression |
| Blacksmith Craft / Apothecary Buy e Reroll / afinidades Blood e Magic / extração e Return to Camp | PASS em regressões UI.3 |
| Save unit tests e migração/serialização | PASS na suíte unitária |
| `npm test` com rede permitida | 24/27 PASS; três falhas em harnesses DOM descritas abaixo |
| Browser Save/Load | PARTIAL: `v012-save-browser.cjs` termina em `choice` em vez de `finished` após 200 passos; `v0120-persistence-browser.cjs` excede timeout ao aguardar a segunda vitória sintética |
| Browser de equipamento | FAIL em 390px: as caixas de slots vizinhos cruzam-se por cerca de 0,375px vertical; em 1280px o teste não foi alcançado nesta execução |
| Browser de eventos | FAIL no teste legado: espera capacidade 6, mas a Bag atual tem 12; com a expectativa atualizada, o harness pára em `choice` no Realm 2 |
| Browser `v012-phase3` | FAIL: timeout à espera de `#phase5ExitResult` na corrida sintética |
| Safari / WebKit | **Pendente**: WebKit do Playwright não está instalado neste ambiente Linux |

Falhas da suíte Node (harness, sem evidência de regressão visual):

- `v012-complete-flow.test.cjs`: `window is not defined` durante `markAllAsSeen` → `renderStash`.
- `v012-phase-c3-treasures.test.cjs`: `arena.before is not a function` ao renderizar o combate simulado.
- `v0120-equipment.test.cjs`: `window is not defined` no caminho de salvamento após `salvage`.

O teste `private-preview.test.mjs` falhou quando executado sem permissão de loopback e passou quando repetido com rede local permitida. O teste de eventos existente espera a capacidade antiga da Bag; a capacidade atual de 12 é requisito do produto.

## Diferenças face à especificação

- A tab **Shrine** existente continua a ser o altar de Runas. A escolha inicial de affinity é apresentada após Start Expedition, onde o fluxo atual a cria; não foi criada uma segunda seleção.
- O City Center mantém placeholders/silhuetas de NPC porque não há artwork de NPC aprovado nos assets disponíveis.
- O Blacksmith usa os painéis e âncoras Forge/Reinforcement da UI.3; os dois blocos permanecem no mesmo documento.
- As capturas antigas não cobrem todos os estados de modal em cada viewport. A inspeção visual completa em Safari não foi possível.

## Problemas por prioridade

| Prioridade | Problema | Impacto |
|---|---|---|
| P0 | Nenhum problema crítico de UI confirmado nesta auditoria | — |
| P1 | Persistência em browser não ficou demonstrada pelos harnesses sintéticos; os fluxos de Save/Load falham por stalls/timeouts | Revalidar com fixture atualizado antes de integração em `main` |
| P2 | Teste de geometria reporta interseções de cerca de 0,375px entre slots verticais no Equipment mobile | Não bloqueia interação visível, mas convém ajustar e repetir o teste |
| P2 | Harness de eventos usa expectativa Bag 6 e não conclui o ciclo no Realm 2 com capacidade 12 | Atualizar harness; as regras/eventos unitários passam |
| P2 | Três testes unitários dependem de `window`/`Element.before` sem DOM completo | Corrigir mocks ou executar em ambiente DOM/browser |
| P2 | Safari não foi validado; artwork de NPC continua ausente | Validar em Mac e integrar asset aprovado quando existir |

## Prontidão para `main`

**PARTIAL.** Regressões visuais e interações principais passam em Chromium. Recomendo revalidar Save/Load e a geometria dos slots em browser e executar Safari antes do merge. Nenhuma alteração foi feita em `main`, Firebase, saves reais ou deploys.
