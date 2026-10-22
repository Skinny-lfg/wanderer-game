# Wanderer v0.12 — UI.4e: Rarity Frames + Potion Equipment

## Implementação

- Integrados os cinco frames v3.5 Common–Legendary em caixas quadradas 1:1, com transparência, em Equipment/Camp, Inventory/Stash, Merchant, Forge, Compare, combat loot, Between Realms Bag e Extraction summary.
- Os dados de raridade, tint, badges, seleção, estado equipado e bloqueios continuam no componente anfitrião. Os frames deixam de ser esticados sobre cartões retangulares.
- Os três slots de poção continuam a usar a seleção e os callbacks existentes. Foram colocados sob a personagem em Camp/Equipment; os vazios mostram a Health Potion a 25% sem texto, e os três conservam frame Common. Stacks, quantidades, remoção, consumo e persistência permanecem no sistema existente.
- Não foram alterados runtime, efeitos, preços, quantidades, economia ou saves.

### Assets

Drive: `Wanderer / 05 - UI & Navigation / Wanderer_UI_Kit_Rarity_Frames / Wanderer_Rarity_Frames_Simplified_v3_5_PNGs.zip`. O pacote contém apenas PNGs RGBA 512×512; não contém WebP. Os cinco PNGs nomeados foram convertidos para WebP RGBA 256×256, mantendo transparência. Os assets resultantes têm cerca de 17–19 KB cada. Os nomes do pacote confirmam o mapeamento solicitado.

## Capturas

| Área | Antes | Depois |
|---|---|---|
| Camp, mobile | [UI.4 / 390 px](ui4-screenshots/camp-after-390.png) | [UI.4e / 390 px](ui4e-screenshots/camp-390.png) |
| Camp, desktop | [UI.4 / 1280 px](ui4-screenshots/camp-after-1280.png) | [UI.4e / 1280 px](ui4e-screenshots/camp-1280.png) |
| Equipment/Inventory, mobile | [UI.4 / 390 px](ui4-screenshots/inventory-after-390.png) | [UI.4e / 390 px](ui4e-screenshots/inventory-390.png) |
| Equipment/Inventory, desktop | [UI.4 / 1280 px](ui4-screenshots/inventory-after-1280.png) | [UI.4e / 1280 px](ui4e-screenshots/inventory-1280.png) |

## Validação

- **PASS** — `tests/v012-ui4e-browser.cjs`: frames das cinco raridades; slots vazios, parciais e completos; seleção, remoção, limite de 3; toque em 360/390 px; compra Apothecary e atualização de stacks; save/reload isolado; sem scroll horizontal nos viewports 360, 390, 768, 1280 e 1440 px.
- **PASS** — `tests/v012-ui1-browser.cjs`: Camp/Inventory e seleção de poções em 360, 390, 768, 1024, 1280 e 1440 px.
- **PASS** — `tests/v012-ui4d-browser.cjs`: categorias Merchant, alternância, compare/buy, navegação Camp e save/reload isolado.
- **PASS** — `tests/v012-ui4c-browser.cjs`: regressões UI em seis viewports, incluindo combate e Between Realms.
- **PASS** — `tests/v012-complete-browser.cjs`: uso manual da poção durante a Expedition, retorno, save/reload e resumo final em 390/1280 px. O fixture passou a preparar ofertas Health/Mana determinísticas; o stock de produção não foi alterado.
- **PASS** — `node --test tests/v012-complete-potions.test.cjs tests/v012-complete-compat.test.cjs tests/v012-save.test.mjs`.
- **PASS** — capturas antes/depois guardadas em `docs/ui4e-screenshots/`.
- **PENDENTE** — Safari/WebKit. A validação desta execução foi feita em Chromium; não foi declarado suporte Safari.

## Ficheiros

`index.html`, `online/v012-ui4e.css`, cinco frames em `assets/ui-kit/rarity/v3_5/`, `tests/v012-ui4e-browser.cjs`, fixture determinístico ajustado em `tests/v012-complete-browser.cjs`, este relatório e quatro capturas em `docs/ui4e-screenshots/`.
