# Gothic Ornament Alignment Fix

## Causa e correção

Os PNGs têm margens transparentes e a linha desenhada fica recuada dentro da imagem. Como cada canto começava exatamente no limite do painel, essa linha aparecia para dentro do contorno CSS. A camada também ficava atrás do banner da Expedition, e a regra original da Expedition usava `overflow: hidden`, cortando os ornamentos inferiores.

O sistema partilhado agora usa offsets negativos calibrados por tier para alinhar as linhas dos assets com a moldura exterior. A borda CSS dourada continua contínua; a camada PNG fica acima do fundo e abaixo do conteúdo interativo, com `pointer-events: none`. O shell permite overflow visível. A regra original da Expedition foi corrigida para deixar de recortar os cantos, e o banner fica atrás da camada decorativa.

| Tier | Offset horizontal | Offset vertical |
| --- | --- | --- |
| LARGE | 6% do tamanho do canto | 17% |
| MEDIUM | 9% | 10% |
| SMALL | máximo de 1,5 px ou 5% | 10% |

Os espelhamentos TL/TR/BL/BR foram preservados. Não foram alterados layout, padding do conteúdo, gameplay ou botões.

## Ficheiros

- `online/v012-gothic-panels.css` — offsets, camada decorativa e overflow do shell.
- `online/v012-ui5-camp.css` — overflow da Expedition e ordem de pintura do banner.
- `tests/v012-gothic-three-tier-browser.cjs` — verificações de geometria, borda contínua, clipping e capturas.
- `docs/v012-gothic-ornament-alignment-screenshots/` — screenshots comparativos.

## Validação

Playwright/Chromium passou nos viewports 390×900 e 1440×900, antes e depois. Foram verificados Camp, Attributes/Combat Stats, Expedition, Equipment, Inventory, City Center, Initial Affinity, Magic Element e controlos SMALL. Os testes confirmaram os quatro cantos fora dos limites do painel, `overflow: visible`, borda contínua, orientação e proporção dos assets, sem overflow horizontal ou erros JavaScript. `node --check` e `git diff --check` também passaram.

Safari/WebKit não foi executado neste ambiente; fica pendente.

## Capturas comparativas — mobile

- Camp: [antes](v012-gothic-ornament-alignment-screenshots/before/camp-390.jpg) · [depois](v012-gothic-ornament-alignment-screenshots/after/camp-390.jpg)
- Attributes: [antes](v012-gothic-ornament-alignment-screenshots/before/attributes-390.jpg) · [depois](v012-gothic-ornament-alignment-screenshots/after/attributes-390.jpg)
- Inventory: [antes](v012-gothic-ornament-alignment-screenshots/before/inventory-390.jpg) · [depois](v012-gothic-ornament-alignment-screenshots/after/inventory-390.jpg)
- City Center: [antes](v012-gothic-ornament-alignment-screenshots/before/city-center-390.jpg) · [depois](v012-gothic-ornament-alignment-screenshots/after/city-center-390.jpg)
- Expedition: [antes](v012-gothic-ornament-alignment-screenshots/before/expedition-390.jpg) · [depois](v012-gothic-ornament-alignment-screenshots/after/expedition-390.jpg)

As mesmas capturas foram guardadas para 1440 px.
