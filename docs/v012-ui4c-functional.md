# Wanderer v0.12 — UI.4c Funcional

Estado: **implementada e validada localmente em `development`; publicação pendente de autorização**. Base: auditoria UI.5 `2030314e8cef2efaf0674fdf09847c85593ec539` (UI.4 publicada em `4f7b12d`).

## Alterações

- Merchant já fornecia 4 itens por categoria; confirmado que Weapons, Armor e Accessories mostram 4 cada, alternar tabs mantém os mesmos 12 IDs e não cria stock. Restock, preço, compra e regras não foram alterados.
- Camp mostra sempre ATK, DEF, HP, Hits/sec, Crit, Gear Power, Evasion, STR, AGI, INT, END e CHA; Block, Mana, Spell Power e Mana Regen aparecem quando existem.
- Between Realms usa ordem HP/Mana, stats, affinities, passivos, buffs, poções e Bag. A estrela do passive inicial foi removida da apresentação. Tooltips mantêm nome/rank/affinity/descrição. A Bag fica recolhida abaixo da capacidade, com os 12 slots disponíveis ao abrir; overflow continua expandido.
- Combat mostra uma faixa acima da arena com Affinities, Active Passives e Active Buffs. Cada passivo mantém o detalhe acessível por toque/teclado; a faixa não cobre a arena.
- As escolhas de passivos estão centradas, com cartões uniformes, descrição em três linhas e detalhe completo expansível. Valores de melhoria e rank continuam a vir do preview real.
- Forge e Legendary Reinforcement agora são subtabs mutuamente exclusivas. Crafting Odds continuam na Forge com os cálculos existentes.
- Extraction conserva os dados, agrupa as métricas e mantém Return to Camp destacado. As secções vazias são compactas e Combat Log continua expansível.

## Capturas

As capturas desktop/mobile foram feitas com estado sintético local, após UI.4c:

| Ecrã | Desktop 1280px | Mobile 390px |
|---|---|---|
| Camp e stats | [Camp](ui4c-screenshots/camp-1280.png) | [Camp](ui4c-screenshots/camp-390.png) |
| Blacksmith | [Forge tab](ui4c-screenshots/blacksmith-1280.png) | [Forge tab](ui4c-screenshots/blacksmith-390.png) |
| Merchant | [Merchant](ui4c-screenshots/merchant-1280.png) | [Merchant](ui4c-screenshots/merchant-390.png) |
| Combat | [Combat](ui4c-screenshots/combat-1280.png) | [Combat](ui4c-screenshots/combat-390.png) |
| Passive selection | [Passives](ui4c-screenshots/passives-1280.png) | [Passives](ui4c-screenshots/passives-390.png) |
| Between Realms | [Between](ui4c-screenshots/between-1280.png) | [Between](ui4c-screenshots/between-390.png) |
| Combat build | [Build strip](ui4c-screenshots/combat-build-1280.png) | [Build strip](ui4c-screenshots/combat-build-390.png) |
| Extraction | [Summary](ui4c-screenshots/extraction-1280.png) | [Summary](ui4c-screenshots/extraction-390.png) |

## Testes

| Teste | Resultado |
|---|---|
| `tests/v012-ui4c-browser.cjs`: Camp, stats, Merchant stock, subtabs Blacksmith, combate/build, passive details, ordem Between Realms, Bag e Extraction em 1440, 1280, 1024, 768, 390 e 360px | PASS 6/6 |
| Regressão `v012-ui0-browser.cjs` | PASS 6/6 |
| Regressão `v012-ui1-browser.cjs` | PASS 6/6 |
| Regressão `v012-ui2-browser.cjs` | PASS 5/5 |
| Regressão `v012-ui3-browser.cjs` | PASS 6/6 |
| Regressão `v012-ui4-browser.cjs` | PASS 6/6 |
| Regressão C.3 `v012-phase-c3-treasures-browser.cjs` | PASS 390px e 1280px |
| Save, economia e poções (`v012-save.test.mjs`, `v012-economy.test.cjs`, `v012-complete-potions.test.cjs`) | PASS 26/26 |
| `node --check tests/v012-ui4c-browser.cjs`; `git diff --check` | PASS |

Sem scroll horizontal nos seis viewports UI.4c. Safari continua pendente porque WebKit não está instalado no ambiente Linux. A auditoria UI.5 documenta falhas dos harnesses antigos de DOM/save; não foram alteradas mecânicas para contorná-las. Não foram criados PNGs, assets novos ou alterações artísticas UI.4d. Gameplay, balanceamento, economia, Firebase, saves reais e deploys não foram alterados.

Ficheiros UI.4c: `index.html`, `online/v012-ui4c.css`, `tests/v012-ui3-browser.cjs`, `tests/v012-ui4c-browser.cjs`, este relatório e 16 capturas em `docs/ui4c-screenshots/`.
