# Homepage UI consistency audit

## Estado

**PARTIAL.** Os estilos partilhados e os fluxos visuais selecionados foram validados em Chromium; a suíte completa não ficou verde por uma falha unitária preexistente de economia e um teste browser de Equipment que perde o seletor de filtro após equipar. Safari/WebKit não estava disponível.

## Referência visual da Home

Os valores foram extraídos dos estilos montados da Home/Camp, em `online/v012-ui4.css` e `online/v012-ui5-camp.css`:

| Elemento | Valor de referência |
| --- | --- |
| Painel principal | `linear-gradient(145deg, rgba(48,43,46,.94), rgba(23,21,25,.92))` |
| Campo individual de stat | `linear-gradient(90deg, #11101466, transparent)` |
| Divisor das stats | `1px solid #9e7d4433` |
| Espaçamento dos cartões | `clamp(8px, 1.2vw, 16px)` |
| Botão de navegação Home | `42px`, `8px 14px`, `linear-gradient(155deg,#302b2e,#1d1a1e 72%)` |
| Fonte | Grenze nos títulos/controlos; Alegreya Sans no corpo, conforme os tokens existentes |
| Ornamentos | hierarquias LARGE/MEDIUM/SMALL existentes, sem alteração dos PNG |

A Home não foi redesenhada. O botão Start Expedition e os seus assets também foram preservados.

## Alterações

- Extraídos tokens CSS partilhados para fundos, campos de stats, bordas, espaçamentos e botões convencionais.
- Inventory, Between Realms, Forge, Merchant, Apothecary e cartões informativos reutilizam as superfícies escuras e campos de informação equivalentes aos da Home; cores semânticas de raridade, affinity, vida e mana permanecem específicas.
- Botões convencionais seguem dimensões e superfícies da navegação Home, mantêm o overlay SMALL prateado, estados acessíveis e feedback carmesim ao pressionar.
- Inputs e dropdowns usam controlos escuros alinhados com o seletor de Expedition.
- Removido `clip-path` do estilo-base dos botões, que cortava a geometria quadrada por baixo dos cantos PNG.
- CSS do Camp passou a referenciar os tokens partilhados, preservando os valores já aplicados à Home.
- Atualizados harnesses browser para capturar as páginas atuais e não assumir layouts/modal selectors antigos.

## Ficheiros desta fase

- `online/v012-ui4.css`
- `online/v012-ui4f.css`
- `online/v012-ui5-camp.css`
- `tests/v012-complete-browser.cjs`
- `tests/v012-global-ui-audit-browser.cjs`
- `tests/v012-gothic-three-tier-browser.cjs`

O worktree já continha alterações locais em `index.html` e `online/v012-ui4c.css`; foram preservadas e excluídas desta fase.

## Capturas

Capturas Chromium antes/depois, com a mesma fixture sintética e CSS anterior substituído por `HEAD` no modo “before”:

- [Camp mobile antes](homepage-ui-consistency-screenshots/before/camp-390.jpg) · [depois](homepage-ui-consistency-screenshots/after/camp-390.jpg)
- [Inventory mobile antes](homepage-ui-consistency-screenshots/before/inventory-390.jpg) · [depois](homepage-ui-consistency-screenshots/after/inventory-390.jpg)
- [Merchant desktop antes](homepage-ui-consistency-screenshots/before/city-merchant-1280.jpg) · [depois](homepage-ui-consistency-screenshots/after/city-merchant-1280.jpg)
- [Apothecary mobile depois](homepage-ui-consistency-screenshots/after/city-apothecary-390.jpg)
- [Between Realms mobile depois](homepage-ui-consistency-screenshots/after/between-realms-390.jpg)
- [Combat desktop depois](homepage-ui-consistency-screenshots/after/combat-1280.jpg)
- [Extraction mobile depois](homepage-ui-consistency-screenshots/after/extraction-390.jpg)
- [Conjunto completo](homepage-ui-consistency-screenshots/)

As capturas cobrem Camp, Inventory, Blacksmith, Merchant, Apothecary, Shrine/Runes, afinidade inicial, Magic Element, Combat, Event, Passive, Between Realms e Extraction em 390px e 1280px. Um segundo passe verificou Camp, Inventory e City Center em 375, 430, 768, 1440 e 1920px, e Shrine/Runes nos mesmos viewports.

## Validação

| Verificação | Resultado |
| --- | --- |
| `npm test` | **FAIL parcial:** 291/292. `tests/v012-economy.test.cjs` espera `merchant`, mas recebe `forge` no campo de origem. Nenhum código de economia foi alterado. |
| `npm run test:browser` | **FAIL parcial:** complete Expedition e Evasion passaram em 390/1280px; o alvo agregado parou em `v0120-equipment-browser.cjs` porque `#slotFilter` não está presente após a interação de equipar. |
| `v012-complete-browser.cjs` | **PASS** em 390 e 1280px, antes/depois; cobre shops, poções, afinidades, Magic, eventos, passivos, Between Realms, save/reload, Rune e extraction. |
| `v012-gothic-three-tier-browser.cjs` | **PASS** em 390 e 1440px, incluindo paridade calculada das caixas de stats e geometria/cliques dos ornamentos de botões. |
| `v012-global-ui-audit-browser.cjs` | **PASS** em 375, 430, 768, 1440 e 1920px, sem overflow horizontal nem recursos em falta. |
| Safari/WebKit | **Pendente:** ambiente sem Safari/WebKit real. |

## Pendências

1. Investigar separadamente o seletor `#slotFilter` no teste de Equipment após equipar; o alvo agregado não chega aos testes browser posteriores.
2. Corrigir ou justificar a expectativa de origem `merchant` no teste unitário de economia; não foi alterada nesta fase visual.
3. Fazer validação real em Safari, incluindo safe areas e `focus-visible`.
4. Account/Leaderboard e todos os estados raros de modais não tiveram percursos browser dedicados nesta execução; não declarar auditoria visual integral concluída.

## Ajuste posterior — superfícies do Inventory

Foi identificado que `stashGrid`, `stashCapacityBar` e `inventoryJumpNav` ainda herdavam preenchimentos vinho de regras antigas do `v012-core.css`. Agora reutilizam o preenchimento e a borda discreta do sistema de painéis da Home; o aviso de stash vazio usa a superfície interna escura. Nenhuma cor de raridade ou estado semântico foi alterada.

Verificação adicional: `v012-gothic-three-tier-browser.cjs` **PASS** em 390px e 1440px, comparando fundos/contornos computados; `v012-complete-browser.cjs` **PASS** em 390px e 1280px, com novas capturas do Inventory. Safari continua pendente.

Nenhum teste foi usado como evidência sobre gameplay, economia ou balanceamento.

## Correções visuais adicionais — Shrine, Combat, Between Realms e poções

A verificação das capturas mobile encontrou estilos antigos ainda aplicados aos cartões de Runas do Shrine, blocos de build/Runas de Combat, bag de Between Realms e tokens Gold/Fragments. Essas superfícies agora usam os tokens escuros da Home, mantendo ícones e cores semânticas. No Apothecary, a regra genérica `.potionOffer img` estava a impor 62 px de altura aos quatro PNGs decorativos dos botões; a camada de ornamentos agora preserva o tamanho SMALL calculado e a proporção original.

Validação Chromium: `node tests/v012-complete-browser.cjs` **PASS** em 390px e 1280px. O harness confirma a superfície dos tokens, Shrine, Combat, Between Realms, quatro ornamentos pequenos contidos por botão de poção e os percursos funcionais existentes. Capturas atualizadas: [Shrine mobile](homepage-ui-consistency-screenshots/after/shrine-390.jpg), [Combat mobile](homepage-ui-consistency-screenshots/after/combat-390.jpg), [Between Realms mobile](homepage-ui-consistency-screenshots/after/between-equipment-390.jpg), [Apothecary mobile](homepage-ui-consistency-screenshots/after/city-apothecary-390.jpg). Safari continua pendente.
