# Wanderer v0.12 — UI.4b: integração dos assets PNG originais

**Estado:** implementação preparada num commit Git isolado, com base em `development` `95b67ccc6a233c1254957ca4ee66d62fa557c45c`; **sem atualizar o ref remoto** e sem autorização de publicação adicional.  
**Âmbito:** arte visual apenas. Não altera `index.html`, handlers, regras, economy, combate, Firebase, saves ou `main`.

## Assets da Drive

Integrados **64 PNGs originais**, com a estrutura `assets/ui-kit/original/`:

| Pack | PNGs | Aplicação |
|---|---:|---|
| Nine-slice | 8 | Cantos e lados transparentes sobre as janelas principais, no lugar do border-image SVG |
| Buttons | 4 | Estados Normal/Hover/Pressed/Disabled dos botões primários |
| Tabs, close, arrows | 24 | Tabs funcionais, fechar modal, setas visuais de seletores e ações |
| Rarity | 5 | Molduras por raridade, sem alterar os indicadores de raridade ou o conteúdo |
| Tooltips | 5 | Fundo artístico dos detalhes de equipamento com `data-rarity` |
| Comparison | 6 | Badges e deltas visuais no Quick Compare; mantém valores e ações originais |
| Headers / Dividers | 7 | Ornamentos em títulos e separadores, aplicados seletivamente |
| HUD | 5 | Molduras HP/Mana e Start Expedition de três peças |
| **Total** | **64** | |

O conjunto tem ainda dois ficheiros que **não** foram incluídos no runtime: o exemplo `07_comparison_layout_example_empty.png` (é uma referência de layout, não um componente para o jogador) e `Ash_Stone_Panel_Original.png` (3,3 MB, precisa de versão WebP otimizada para não onerar a interface).

## Alterações de código

- Apenas `online/v012-ui4.css`, adicionando uma camada `UI.4b` depois das regras da UI.4.
- CSS reutiliza diretamente as classes e atributos já existentes (`phase3Camp`, `phase3Between`, `phase3CityCenter`, `phase3AffinityShrine`, `phase5VisualSummary`, `slotTile`, `invItem`, `inspect[data-rarity]`, `itemComparison`, `phase3ResourceTrack`).
- Os `button`, `select` e `data-close` mantêm os elementos HTML e handlers originais.
- Os PNGs são apresentados por CSS com as suas transparências e estados; para leitura em ecrãs pequenos, os ornamentos grandes recuam/reduzem.
- Não foram criadas novas entidades de gameplay, cálculos ou alterações de save.

## Validação / próximos gates

- **PASS (estático):** inventário da árvore Git: 64 PNGs em oito pastas, e 64 URLs únicas do CSS resolvidas contra a árvore preparada; todas as chavetas CSS equilibradas.
- **A executar no worktree após publicação:** `node --test tests/v012-ui4b-assets.test.cjs`; `node tests/v012-ui4-browser.cjs`; regressões UI.0–UI.3 e C.3; `npm test`.
- **Pendente:** screenshots Chromium reais desktop/mobile após integrar os assets; possíveis ajustes de escala/legibilidade nos ecrãs; Safari/WebKit macOS.
- **Bloqueio anterior conhecido:** o `npm test` do HEAD antes da UI.4b falhava 3/278 testes de DOM Node (`window` e `arena.before`), documentados em [UI.5](v012-ui-final-audit.md). Esta fase não corrige esse problema.

Não concluir que a versão está pronta para `main` antes das regressões, análise visual do browser e correção do CI.
