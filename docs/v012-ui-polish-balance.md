# Wanderer v0.12 — UI Polish & Apothecary Balance

## Alterações

- Apothecary usa os cartões compactos, frames de raridade, imagens 1:1 e hierarquia do Merchant. Mantém Buy, omite Compare e a compra substitui apenas a oferta comprada.
- Passivos das Affinities agora ficam recolhidos por defeito. O resumo mostra apenas o nome do passivo (Magic indica as três opções); a descrição completa só aparece ao expandir. A seleção continua separada do disclosure.
- Potion of Fortune passou de Rare a Epic. Efeito, duração, preço base e valor de drop mantêm-se: **+25% relativo à chance de drop de equipamento**, durante o período já definido.
- A camada PNG partilhada dos pop-ups acompanha agora a caixa do `<dialog>` sem depender de um `transform` que alterava o containing block.
- A hitbox de trocar personagem no Camp ficou menor e transparente, sem bloquear os slots. Os ícones de equipamento ocupam melhor a área útil dos botões.
- Inventory e Between Realms mobile posicionam a composição de equipamento 10 px mais acima; os cinco atributos permanecem dentro do painel.

## Probabilidade da Potion of Fortune

O stock é gerado por slot através do mesmo `offer()` tanto na geração inicial como na reposição após compra.

| Medida | Antes | Agora |
|---|---:|---:|
| Chance por slot | 20% da raridade Rare ÷ 3 = **6,6667%** | **3,3333%** (metade) |
| Chance de aparecer pelo menos uma vez nas quatro ofertas | **24,12%** | **12,68%** |

Para manter a soma dos pesos a 100%, as restantes ofertas foram renormalizadas proporcionalmente: cada probabilidade individual aumenta 3,5714% em termos relativos; nenhuma outra poção mudou de raridade ou efeito.

## Validação

- `npm test`: **PASS — 294/294**.
- `npm run test:browser`: **PASS** — regressões existentes e teste Chromium novo.
- Teste direcionado de poções: **PASS — 6/6**.
- Chromium: Apothecary, Camp e pop-up em 360×780, 390×844, 430×932 e 1280×800; Inventory e Between Realms em 360, 390 e 430 px; Affinity dropdown e seleção em 390 px.
- Testados: quatro cartões e frames, ausência de Compare, compra/reposição apenas do slot comprado, Fortune Epic e efeito +25%, hitbox transparente sem interseção com slots, centro e bounds dos cantos do popup, disclosure fechado/aberto e seleção independente, ausência de overflow horizontal.
- WebKit/Safari não está disponível nesta validação; permanece pendente.

## Capturas Chromium

| Área | Antes | Depois |
|---|---|---|
| Apothecary mobile | [Antes](v012-ui-polish-balance/screenshots/before/apothecary-390.png) | [Depois](v012-ui-polish-balance/screenshots/after/apothecary-390.png) |
| Apothecary desktop | [Antes](v012-ui-polish-balance/screenshots/before/apothecary-1280.png) | [Depois](v012-ui-polish-balance/screenshots/after/apothecary-1280.png) |
| Affinity dropdown | [Antes](v012-ui-polish-balance/screenshots/before/affinity-dropdown-390.png) | [Depois](v012-ui-polish-balance/screenshots/after/affinity-dropdown-390.png) |
| Camp / hitbox | [Antes](v012-ui-polish-balance/screenshots/before/camp-390.png) | [Depois](v012-ui-polish-balance/screenshots/after/camp-390.png) |
| Camp desktop | [Antes](v012-ui-polish-balance/screenshots/before/camp-1280.png) | [Depois](v012-ui-polish-balance/screenshots/after/camp-1280.png) |
| Popup e cantos | [Antes](v012-ui-polish-balance/screenshots/before/account-popup-390.png) | [Depois](v012-ui-polish-balance/screenshots/after/account-popup-390.png) |
| Popup desktop | [Antes](v012-ui-polish-balance/screenshots/before/account-popup-1280.png) | [Depois](v012-ui-polish-balance/screenshots/after/account-popup-1280.png) |
| Between Realms | [Antes](v012-ui-polish-balance/screenshots/before/between-equipment-390.png) | [Depois](v012-ui-polish-balance/screenshots/after/between-equipment-390.png) |

Métricas de posição mobile: [depois](v012-ui-polish-balance/screenshots/after/mobile-layout-metrics.json) e [antes](v012-ui-polish-balance/screenshots/before/mobile-layout-metrics.json).

## Ficheiros

Código/UI: `index.html`, `online/ux39.css`, `online/v012-consumables.js`, `online/v012-gothic-panels.css`, `online/v012-gothic-panels.js`, `online/v012-phase1.css`, `online/v012-ui4.css`, `online/v012-ui5-camp.css`, `online/v012-ui6-unified-inventory.css`.

Testes: `tests/v012-complete-potions.test.cjs`, `tests/v012-ui-polish-browser.cjs`, e inclusão do novo browser test em `package.json`.

Não foram alterados gameplay, saves, Firebase ou deploys. As capturas de auditorias anteriores já modificadas no worktree foram preservadas fora deste relatório.
