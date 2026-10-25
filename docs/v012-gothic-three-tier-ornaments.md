# Gothic UI — sistema de ornamentos em três níveis

## Alterações

- **LARGE — Gold Ornate:** painéis principais de Camp, City Center, Expedition/Between Realms, Inventory/Equipment e Extraction.
- **MEDIUM — Gold Simple:** Attributes/Combat Stats, Shrine, escolha da affinity inicial, seleção de elemento Magic e modais médios.
- **SMALL — Silver Compact:** tabs secundárias de Between Realms e Blacksmith, e navegação Equipment/Stash. O botão ilustrado Start Expedition mantém os seus PNGs originais.
- O helper atribui uma única classe de hierarquia e uma camada de quatro imagens com `pointer-events:none`. Os cantos esquerdo/superiores e inferiores são espelhados pelos eixos especificados.
- O asset MEDIUM original `Wanderer_Gothic_Corner_TR_Original_Uncropped.png` (1273×1236) mantém a proporção intrínseca; foi localizado no diretório indicado do Drive e copiado para `assets/ui-kit/gothic-corners/medium-gold-tr.png`. O asset SMALL `Wanderer_Gothic_Corner_Silver_Compact_TR.png` (1254×1254) foi copiado para `small-silver-tr.png`. O asset LARGE GameReady existente foi mantido. Todos são renderizados sem deformação.
- Os painéis usam uma borda CSS dourada contínua e o fundo escuro existente. A geometria antiga de fill/stroke com pseudo-elementos foi removida de `v012-ui4f.css`; o cenário do Camp e as sombras dos painéis foram preservados.
- O padding seguro limita a aproximação de títulos aos ornamentos sem escalar conteúdos ou alterar dimensões gerais dos painéis.

## Validação

Playwright/Chromium em fixture isolada, com viewport **390×900** e **1440×900**, comparando o commit base `e43b766` com as alterações:

- Camp/Home: LARGE; Attributes/Combat Stats: MEDIUM; contorno de 1 px e fundo escuro verificados.
- Affinity inicial: MEDIUM; grelha 3×2 no mobile e seis itens numa linha no desktop.
- Magic Element: MEDIUM; três opções e ícones com `object-fit: contain` e proporção preservada.
- Controlo secundário: SMALL; asset prateado e quatro imagens verificados.
- Os quatro cantos MEDIUM mantêm orientação original no topo-direito e usam `scaleX(-1)`, `scaleY(-1)` e `scale(-1,-1)` nos restantes. Sem overflow horizontal ou erros JavaScript.
- Resultado: **PASS Chromium, 4/4 combinações antes/depois**. `node --check online/v012-gothic-panels.js` e `git diff --check`: **PASS**.
- Safari/iOS real não está disponível neste ambiente; validação Safari permanece pendente.

## Capturas

As capturas `before` foram renderizadas a partir do commit base `e43b766`; `after` usa a implementação atual. São screenshots Chromium em dados locais sintéticos.

- [Camp mobile — antes](v012-gothic-three-tier-screenshots/before/camp-390.jpg) · [depois](v012-gothic-three-tier-screenshots/after/camp-390.jpg)
- [Camp desktop — antes](v012-gothic-three-tier-screenshots/before/camp-1440.jpg) · [depois](v012-gothic-three-tier-screenshots/after/camp-1440.jpg)
- [Affinity mobile — antes](v012-gothic-three-tier-screenshots/before/initial-affinity-390.jpg) · [depois](v012-gothic-three-tier-screenshots/after/initial-affinity-390.jpg)
- [Affinity desktop — antes](v012-gothic-three-tier-screenshots/before/initial-affinity-1440.jpg) · [depois](v012-gothic-three-tier-screenshots/after/initial-affinity-1440.jpg)
- [Magic mobile — antes](v012-gothic-three-tier-screenshots/before/magic-element-390.jpg) · [depois](v012-gothic-three-tier-screenshots/after/magic-element-390.jpg)
- [Magic desktop — antes](v012-gothic-three-tier-screenshots/before/magic-element-1440.jpg) · [depois](v012-gothic-three-tier-screenshots/after/magic-element-1440.jpg)
- [Controlos SMALL — depois](v012-gothic-three-tier-screenshots/after/small-controls-390.jpg)

## Pendência

Não foi feita validação Safari/WebKit. A aplicação dos estilos LARGE em City Center e Between Realms usa os seletores atuais do helper; a validação visual desta execução concentrou-se nos ecrãs e modais capturados acima.
