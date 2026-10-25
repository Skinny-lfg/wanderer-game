# Wanderer v0.12 — Fase UI.4: UI Kit e polimento visual

Estado: **implementada e validada localmente em `development`; publicação pendente de nova autorização**. Base remota: UI.3 `c7b879ec836ccb418d02f0ae3481a41e6469915d`.

## Alterações

- `online/v012-ui4.css` concentra tokens de cores, superfícies, espaçamento, foco e tipografia. A folha é carregada após os estilos existentes e mantém o polimento visual no modo v0.12.
- O asset aprovado `assets/ui-kit/gothic-frame.svg` foi aplicado como 9-slice aos painéis principais de Camp, Between Realms, City Center, escolha inicial de affinity e Extraction. Os cenários e ilustrações permanecem visíveis.
- Primary, Ghost, Danger, Disabled, Hover, Selected e Focus têm estados consistentes; dropdowns e modais recebem acabamento comum.
- Slots e itens do Inventory partilham cantos e bordas de raridade. Marcadores NEW, affinity e Legendary mantêm camadas legíveis. Merchant e Apothecary usam o mesmo tratamento de superfície sem alterar stock ou ações.

## Capturas antes/depois

| Área | Antes | Depois |
|---|---|---|
| Camp | [desktop](ui1-screenshots/camp-1280.png) · [mobile](ui1-screenshots/camp-390.png) | [desktop](ui4-screenshots/camp-after-1280.png) · [mobile](ui4-screenshots/camp-after-390.png) |
| Inventory | [desktop](ui1-screenshots/inventory-1280.png) · [mobile](ui1-screenshots/inventory-390.png) | [desktop](ui4-screenshots/inventory-after-1280.png) · [mobile](ui4-screenshots/inventory-after-390.png) |
| Merchant | [desktop](ui3-screenshots/merchant-1280.png) · [mobile](ui3-screenshots/merchant-390.png) | [desktop](ui4-screenshots/merchant-after-1280.png) · [mobile](ui4-screenshots/merchant-after-390.png) |
| Extraction | [desktop](ui3-screenshots/extraction-1280.png) · [mobile](ui3-screenshots/extraction-390.png) | [desktop](ui4-screenshots/extraction-after-1280.png) · [mobile](ui4-screenshots/extraction-after-390.png) |

## Validação

| Teste | Resultado |
|---|---|
| `node tests/v012-ui4-browser.cjs`: Camp, Inventory, City Center e Extraction em 1440×900, 1280×720, 1024×768, 768×1024, 390×844 e 360×800; frame, foco, slots e ausência de scroll horizontal | PASS 6/6 |
| `node tests/v012-ui0-browser.cjs` | PASS 6/6 |
| `node tests/v012-ui1-browser.cjs` | PASS 6/6 |
| `node tests/v012-ui2-browser.cjs` | PASS 5/5 |
| `node tests/v012-ui3-browser.cjs` | PASS 6/6 |
| `node tests/v012-phase-c3-treasures-browser.cjs` | PASS 390px e 1280px |
| `node --check tests/v012-ui4-browser.cjs`; `git diff --check` | PASS |
| Safari | **Pendente:** ambiente Linux, sem WebKit instalado |

As verificações usam personagens sintéticas em memória. Não foram alterados gameplay, balanceamento, economia, Firebase, saves reais, `main` ou deploys. Não há artwork de NPC confirmado em `assets/`; os placeholders existentes continuam no City Center. A inspeção visual manual foi feita nas capturas Chromium desktop/mobile; Safari requer validação posterior.

Ficheiros desta fase: `index.html`, `online/v012-ui4.css`, `tests/v012-ui4-browser.cjs`, este relatório e oito capturas em `docs/ui4-screenshots/`.
