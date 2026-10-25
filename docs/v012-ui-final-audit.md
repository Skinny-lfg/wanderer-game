# Wanderer v0.12 — UI.5 Auditoria final

Data: 22 outubro 2026
Branch: `development`
Estado: **PARTIAL — regressões Chromium resolvidas; integração em `main` fica NO-GO até validar Safari nos fluxos UI.4e e restantes ecrãs.**

## Estado das fases

| Fase | Estado | Evidência |
|---|---|---|
| UI.0–UI.3 | PASS anterior | Regressões e capturas de cada fase; sem novas falhas reproduzidas nesta auditoria. |
| UI.4 | PASS Chromium anterior | UI Kit e regressões da fase aprovadas; sem falhas novas. |
| UI.4d | PASS | Chromium UI.4d passou. O utilizador informa que validou UI.4d manualmente em Safari; registado como validação manual do utilizador, não como teste executado por esta auditoria. |
| UI.4e | PASS Chromium; Safari pendente | Frames Common–Legendary, slots e poções, compra, uso e persistência passaram nos viewports suportados. |
| C.3 | PASS | Browser C.3 passou em 390 e 1280 px; os seis treasures renderizam e Sell All preserva o total. |

## Resultados por área

| Área | Resultado | Observações |
|---|---|---|
| Camp, Equipment e Inventory | **PASS** | Sem colisão de slots em 360, 390, 768, 1280 e 1440 px; dez slots de equipamento e três slots de poções. |
| Frames de raridade e poções | **PASS Chromium** | Cinco raridades, frames quadrados, slots vazios/parciais/completos, seleção, remoção, consumo, compra no Apothecary e save/reload. |
| City Center / Merchant | **PASS** | Weapons, Armor e Accessories filtram o stock real; quatro ofertas por categoria; alternância, Compare, Buy e restock mantidos. |
| Forge / Apothecary | **PASS** | Craft, compra e integração do stock de poções com o Stash passaram nos fluxos browser/unitários. |
| Expedition / Between Realms / Bag | **PASS** | Ciclos completos, eventos, drafts, slots de equipamento, loot, troca de equipamento, retorno do item deslocado ao Bag e uso de poção passaram. |
| Extraction / Save / Load | **PASS** | Round-trip e restauro de estado, extração, morte, vitória, Rune de boss, bloqueio de escrita concorrente, save corrompido e quota foram testados com armazenamento sintético isolado. |
| Safari | **PENDENTE PARCIAL** | UI.4d foi validada manualmente pelo utilizador. UI.4e e os restantes fluxos não foram testados em Safari/WebKit neste ambiente. Não se declara Safari PASS. |

### Testes executados

- **PASS** — `tests/v0120-equipment-browser.cjs`: equipamento e City Center em 360, 390, 768, 1280 e 1440 px; nenhuma interseção geométrica entre slots.
- **PASS** — `tests/v012-ui4d-browser.cjs`: quatro ofertas por categoria, alternância repetida, Compare/Buy, retorno ao Camp, reload e colisão de validation slot.
- **PASS** — `tests/v012-ui4e-browser.cjs`: cinco raridades, slots de poção vazios/parciais/completos, compra, consumo e persistência em 360, 390, 768, 1280 e 1440 px.
- **PASS** — `tests/v012-complete-browser.cjs`: ciclo Expedition em 390 e 1280 px, eventos, poções, preparação, combate, vitória/Rune e retorno.
- **PASS** — `tests/v012-events-browser.cjs`: 15 Realms, quatro eventos, 14 escolhas de passive, descarte de loot e conclusão em 390 e 1280 px; capacidade Bag validada como 12.
- **PASS** — `tests/v012-save-browser.cjs`: migração sintética, morte, abandono, vitória e Rune em 390/1280 px; escrita concorrente, corrupt save, quota e proteção de sentinelas locais.
- **PASS** — `tests/v0120-persistence-browser.cjs`: checkpoint/reload, recompensas sem duplicação, extração, morte e boss Rune.
- **PASS** — `tests/v012-phase3-browser.cjs` e `tests/v012-phase-c3-treasures-browser.cjs`: equipamento, loot, poção, tesouros, Stash e Sell All.
- **PASS** — testes unitários direcionados: 7/7 ficheiros, incluindo eventos, poções, equipamentos, saves, persistência e C.3.

Não foram executadas simulações de combate/balanceamento nem suítes completas. Os testes browser usam Chromium e fixtures locais sintéticas; não abrem contas nem escrevem em saves reais.

## Falhas reproduzidas, causa e correção

1. **Equipment mobile (regressão visual, P2):** em 390 px as caixas de slots vizinhos cruzavam-se por 0,375 px por causa da distância de 19% entre filas face à altura renderizada. As filas foram espaçadas em incrementos de 20%; a geometria foi repetida nos cinco viewports acima e passou. Nenhum slot ou mecânica foi alterado.
2. **Mocks DOM obsoletos (testes, sem regressão de produto):** o harness inerte não disponibilizava `window` e `Element.before`. O mock agora expõe `window` e `before()` sem-op. Os testes de fluxo, equipamento e treasures passaram.
3. **Harnesses de fluxo obsoletos (testes, sem regressão de produto):** os fixtures esperavam estado antigo após Realm clear, botões antigos, markup antigo de evento, stock Merchant único, chave de save anterior, passive inicial gratuito e comportamento de equipamento diferente do contrato atual. Foram atualizados para refletir os controlos/estado atuais: `EXIT REALM`, declínio como ação separada, categorias Merchant, chave de validação versionada, passives ganhos após vitória e equipamento atualmente equipado protegido na morte. Os verificadores de produto não foram enfraquecidos.

## Pendências e diferenças da especificação

- **P2 — Safari:** não há Safari nem Playwright WebKit disponível no ambiente Linux. Validar UI.4e, responsividade e os fluxos restantes num Safari real antes de integração. O estado manual da UI.4d é informação fornecida pelo utilizador e não cobre as restantes fases.
- **P2 — arte de NPC:** o City Center ainda usa o placeholder documentado, pois não há artwork aprovado de NPC no projeto.
- Os testes das seis fases anteriores não foram todos repetidos em cada viewport; esta auditoria reutilizou os relatórios existentes e executou novamente os testes direcionados às pendências. Não se repetiram testes de balanceamento.

## Capturas atuais

Chromium, estado local sintético:

- [Camp mobile 390 px](ui4e-screenshots/camp-390.png)
- [Camp desktop 1280 px](ui4e-screenshots/camp-1280.png)
- [Equipment/Inventory mobile 390 px](ui4e-screenshots/inventory-390.png)
- [Equipment/Inventory desktop 1280 px](ui4e-screenshots/inventory-1280.png)
- Capturas anteriores de [Combat](ui5-screenshots/wanderer-ui2-combat-390.png), [Between Realms](ui5-screenshots/wanderer-ui2-between-390.png), [Merchant](ui4-screenshots/merchant-after-390.png), [Extraction](ui4-screenshots/extraction-after-390.png) e [eventos](ui5-screenshots/events-390.png).

## Prontidão para `main`

**NO-GO por agora.** Os problemas Chromium reproduzidos foram resolvidos e os testes dirigidos passam. Falta validação manual Safari para UI.4e e restantes fluxos. Nenhuma alteração foi feita em `main`, Firebase, saves reais ou deploys.
