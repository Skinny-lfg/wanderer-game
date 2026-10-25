# Wanderer v0.12 — Gothic UI final polish

## Correções

- A moldura exterior do Camp era recortada pelo `overflow:hidden` do próprio painel. O shell agora deixa os ornamentos visíveis, mantendo a imagem de fundo e as dimensões existentes.
- O wrapper do conteúdo do City Center também usava `overflow:hidden`, podendo cortar a decoração dos seus descendentes. Foi alterado para `overflow:visible`; os limites de largura e `min-width:0` continuam aplicados.
- Os cantos MEDIUM/standard passaram de offsets de 9%/10% para 12%/13%, para se ancorarem mais junto à linha da moldura.
- O modal de affinities usava largura exterior mais padding, causando overflow interno. Agora usa `border-box`, largura limitada ao viewport e colunas `minmax(0,1fr)`. Em mobile conserva 3 colunas por 2 linhas.
- Os botões convencionais recebem o PNG SMALL numa camada própria, em escala proporcional e dentro da caixa do controlo. A camada não substitui bordas, fundos, tipografia ou estados existentes. Start Expedition e controlos/tiles especializados permanecem excluídos.

## Validação

Chromium/Playwright, com dados de playtest isolados:

| Viewport | Camp / quatro cantos | Affinities | Overflow horizontal |
| --- | --- | --- | --- |
| 360 × 780 | PASS | PASS — 3 × 2 | PASS |
| 390 × 844 | PASS | PASS — 3 × 2 | PASS |
| 768 × 1024 | PASS | PASS — 6 × 1 | PASS |
| 1024 × 768 | PASS | PASS — 6 × 1 | PASS |
| 1440 × 900 | PASS | PASS — 6 × 1 | PASS |

Nas capturas anteriores, o modal de 390 px reportava `scrollWidth 377` para `clientWidth 372`; após a correção ambos são 368 px. As seis caixas ficam dentro da área de conteúdo do modal.

Também passaram a navegação, abas do City Center, operações Forge/Reinforcement, categorias e ações Merchant, botões Apothecary, contagem de quatro ornamentos por controlo e ausência de erros de página/recursos. O asset original de Start Expedition continua intacto. O teste de regressão `node tests/v012-gothic-three-tier-browser.cjs` passou em 390 e 1440 px. `node --check online/v012-gothic-panels.js` e `git diff --check` passaram.

Safari/WebKit permanece pendente: o executável WebKit não está instalado neste ambiente. Não foi declarado como validado.

## Capturas

Comparação anterior/depois em mobile e desktop:

- Camp [antes 390](v012-gothic-final-polish-screenshots/before/camp-390.jpg) · [depois 390](v012-gothic-final-polish-screenshots/after/camp-390.jpg)
- Camp [antes 1440](v012-gothic-final-polish-screenshots/before/camp-1440.jpg) · [depois 1440](v012-gothic-final-polish-screenshots/after/camp-1440.jpg)
- Affinity [antes 390](v012-gothic-final-polish-screenshots/before/affinity-390.jpg) · [depois 390](v012-gothic-final-polish-screenshots/after/affinity-390.jpg)
- Affinity [antes 1440](v012-gothic-final-polish-screenshots/before/affinity-1440.jpg) · [depois 1440](v012-gothic-final-polish-screenshots/after/affinity-1440.jpg)

Capturas adicionais pós-correção: 360, 768 e 1024 px; Blacksmith, Reinforcement, Merchant e Apothecary em 390 e 1440 px, na pasta `v012-gothic-final-polish-screenshots/after/`.

## Ficheiros da fase

- `online/v012-core.css`
- `online/v012-gothic-panels.css`
- `online/v012-gothic-panels.js`
- `online/v012-ui4.css`
- `online/v012-ui5-camp.css`
- `tests/v012-gothic-three-tier-browser.cjs`
- `docs/v012-gothic-final-polish-screenshots/`

Sem alterações de gameplay, economia, saves ou Firebase. Nenhuma publicação ou deploy foi efetuado.
