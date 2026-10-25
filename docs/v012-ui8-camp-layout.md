# Wanderer v0.12 — UI.8 Camp Character Layout

**Estado: PASS em Chromium; Safari/WebKit pendente.** Implementado apenas em `development`; sem alterações de gameplay, economia, balanceamento, autenticação, Firebase ou saves reais.

## Alterações

- Consolidada a geometria do painel Camp em [v012-ui5-camp.css](../online/v012-ui5-camp.css): equipamento distribuído em cinco linhas e duas colunas laterais, legendas espelhadas com subtipo por baixo e retrato centrado. As três poções ocupam a sexta linha da grelha de equipamento já existente, sem painel adicional. Área tátil medida ≥44 px.
- Health/Mana agora ficam acima da personagem, entre as colunas de equipamento. As barras usam os PNG existentes com proporções intrínsecas, moldura `contain` e preenchimento confinado à área interior. Mana 0/0 permanece oculta. A validação também confirma que o preenchimento não ultrapassa a moldura.
- Nome provisório `wanderer` centrado através de `phase3CampDisplayName()`, sem ligação à conta/autenticação.
- Títulos principais e secundários usam Grenze 500; texto e stats usam Alegreya Sans. As fontes estão servidas localmente com licenças OFL em `assets/ui-kit/fonts/`; não dependem de Google Fonts em runtime. Logótipo original preservado.
- O botão Start fixo do mobile oculta-se apenas quando cobrir controlos do Camp e regressa numa zona livre.
- O layout de Inventory continua em `online/v012-ui6-unified-inventory.css`; não foi alterado. `phase3PaperMarkup()` preserva o seu modo Inventory sem identidade/HUD de Camp.

## Capturas

| Viewport | Antes | Depois |
|---|---|---|
| 360 × 780 | [camp-360.png](v012-ui8-camp-screenshots/before/camp-360.png) | [camp-360.png](v012-ui8-camp-screenshots/after/camp-360.png) |
| 1440 × 900 | [camp-1440.png](v012-ui8-camp-screenshots/before/camp-1440.png) | [camp-1440.png](v012-ui8-camp-screenshots/after/camp-1440.png) |

## Validação

- `npm test`: **PASS, 287/287**. A primeira execução sem permissão de loopback marcou `private-preview.test.mjs` como falha ambiental; repetição com loopback autorizado passou os quatro testes e a execução final completa passou.
- Regras Camp substituídas/consolidadas: dimensões de slots e colunas, texto centrado antigo, HUD 18px sem moldura e `display:contents` da linha de poções. As restantes regras de poções do Inventory/Between Realms foram preservadas.
- [Teste Chromium UI.8](../tests/v012-ui8-camp-browser.cjs): **PASS** em 360×780, 390×844, 768×1024, 1024×768 e 1440×900. Verifica fontes carregadas, subtítulos, área dos slots, proporções das imagens/barras, ausência de Mana 0/0 e overflow horizontal.
- [Regressão UI.1](../tests/v012-ui1-browser.cjs): **PASS** em 1440×900, 1280×720, 1024×768, 768×1024, 390×844 e 360×800; inclui Equipment, Stash e interações de poções.
- [Regressão UI.4e](../tests/v012-ui4e-browser.cjs): **PASS** em cinco viewports; compra no Apothecary, atualização do Stash, consumo em Between Realms e save/reload isolado preservando loadout/quantidades.
- `git diff --check`: **PASS**.
- Safari/WebKit: **pendente**. Playwright não tem o executável WebKit instalado neste ambiente; não foi declarada compatibilidade Safari.

Sem problemas funcionais conhecidos nesta validação. O ecrã foi verificado em Chromium; uma verificação manual de Safari ainda é necessária.
