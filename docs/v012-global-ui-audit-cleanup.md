# Wanderer v0.12 — Global UI Audit, CSS Cleanup & Responsive Fixes

Data: 22 outubro 2026
Branch: `development`
Estado: **PARTIAL — Chromium e testes funcionais PASS; Safari/WebKit pendente.**
Integração em `main`: **NO-GO até validação Safari manual.**

## Problemas encontrados e corrigidos

1. **CSS inline e tokens repetidos:** extraí o bloco core de estilos do `index.html` para [`online/v012-core.css`](../online/v012-core.css), mantendo a ordem de cascata. Os estilos ativos da versão atual de `development` foram preservados, os quatro blocos `:root` foram consolidados num só e os URLs de assets foram ajustados à nova localização.
2. **Moldura de janela antiga:** removi de `online/v012-ui4.css` as regras e o reset `!important` substituídos pelo frame atual. Os estilos `online/v012-ui4f.css` e `online/v012-ui5-camp.css` estavam presentes na branch atual e foram preservados/carregados depois do UI Kit.
3. **Apothecary — preço e Buy sobrepostos:** a última linha dos cartões deixava 44 px, embora o botão pudesse ocupar 62 px. Agora a linha adapta-se ao conteúdo; os seis viewports não mostraram colisões.
4. **Shrine sem área de artwork:** adicionei à esquerda das escolhas a imagem Shrine já existente em `assets/dungeons/backgrounds/shrine.webp`; em mobile, fica acima das escolhas. As seis opções e os respetivos handlers não foram alterados.
5. **Mana 0/0 na Camp:** a linha de Mana agora fica oculta quando não existe Mana máxima.
6. **Slots do Stash demasiado largos:** um único item chegava a 157 px. Limitei os tracks a 86 px, mantendo o tamanho touch e o fluxo responsivo.
7. **Navegação durante Expedition:** Inventory, City Center e Shrine já indicam estado disabled quando a navegação é bloqueada; Between Realms continua disponível.
8. **Cabeçalho mobile:** os botões Account/Leaderboard eram forçados visíveis e o hambúrguer oculto por um override; além disso, o botão não tinha handler. Removi o override de visibilidade e liguei abrir/fechar ao `aria-expanded`; a seleção de Account/Leaderboard fecha o painel antes de abrir a ação.
9. **Harnesses desatualizados:** alinhei as fixtures com o bootstrap UI.5, mock de listeners da janela, CTA sticky, frames atuais, nomes de navegação, passivo concedido após vitória, rerolls globais e Bag de 12 itens. As divergências eram expectativas antigas, não falhas de engine.

Estilos dinâmicos de estado e `ui-kit/wanderer-ui.css` foram mantidos. Não removi folhas sem confirmar os seus consumidores. Os `!important` restantes pertencem principalmente às camadas de moldura/9-slice e a prioridades do UI Kit.

## Ficheiros alterados

- `index.html`, `online/v012-core.css`, `online/v012-phase1.css`, `online/ux39.css`, `online/v012-ui4.css`, `package.json`.
- Novos testes: `tests/v012-global-ui-audit.test.cjs`, `tests/v012-global-ui-audit-browser.cjs`.
- Harnesses corrigidos: `tests/v012-economy-harness.cjs`, `tests/v012-complete-browser.cjs`, `tests/v012-economy-browser.cjs`, `tests/v012-events-browser.cjs`, `tests/v012-expedition-browser.cjs`, `tests/v012-phase3-browser.cjs`, `tests/v012-save-browser.cjs`, `tests/v012-phase-c3-treasures-browser.cjs`, `tests/v012-ui0-browser.cjs` até `tests/v012-ui4e-browser.cjs`, `tests/v0120-camp-browser.cjs`, `tests/v0120-equipment-browser.cjs`, `tests/v0120-evasion-browser.cjs`, `tests/v0120-persistence-browser.cjs`, `tests/v0120-realms-browser.cjs`, `tests/v0120-rune-checkpoint-browser.cjs`, `tests/v0120-start-browser.cjs` e `tests/private-preview-browser.cjs`.
- Capturas: `docs/v012-global-ui-screenshots/{before,after}/`.
- Este relatório.

## Resultados Chromium por viewport

| Viewport | Resultado | Cobertura principal |
|---|---|---|
| 360 × 780 | PASS | Camp, Shrine, Inventory, City Center, Apothecary, slots e overflow |
| 390 × 844 | PASS | Fluxos touch, Camp/Inventory/City Center/Shrine, eventos e save sintético |
| 768 × 1024 | PASS | Camp, Shrine, Inventory e UI.0–UI.4e |
| 1024 × 768 | PASS | Camp, Shrine, Inventory e UI.0–UI.4e |
| 1440 × 900 | PASS | Camp, Inventory, Blacksmith, Merchant, Apothecary e Shrine |
| 1280 × 720/900 | PASS | Combat, Between Realms, eventos, Extraction e save/reload |

Nos cinco viewports especificados: sem overflow horizontal, erros JavaScript ou imagens/CSS ausentes nas páginas auditadas. Foram verificadas molduras, proporções, scroll, tabs, foco, comparação, compra, poções e retorno ao Camp. A Camp/Inventory foi exercitada em seis larguras, incluindo 360/390 px; o Stash mantém células até 86 px mesmo com um único item.

### Capturas antes/depois

- Camp: [antes 390](v012-global-ui-screenshots/before/camp-390.jpg) · [depois 390](v012-global-ui-screenshots/after/camp-390.jpg) · [antes 1440](v012-global-ui-screenshots/before/camp-1440.jpg) · [depois 1440](v012-global-ui-screenshots/after/camp-1440.jpg)
- Inventory: [antes 390](v012-global-ui-screenshots/before/inventory-390.jpg) · [depois 390](v012-global-ui-screenshots/after/inventory-390.jpg) · [antes 1440](v012-global-ui-screenshots/before/inventory-1440.jpg) · [depois 1440](v012-global-ui-screenshots/after/inventory-1440.jpg)
- Apothecary: [antes 1440](v012-global-ui-screenshots/before/city-apothecary-1440.jpg) · [depois 1440](v012-global-ui-screenshots/after/city-apothecary-1440.jpg)
- Shrine: [antes 1440](v012-global-ui-screenshots/before/shrine-1440.jpg) · [depois 1440](v012-global-ui-screenshots/after/shrine-1440.jpg) · [depois 360](v012-global-ui-screenshots/after/shrine-360.jpg)
- Eventos: [antes 390](v012-global-ui-screenshots/before/events-390.jpg) · [depois 390](v012-global-ui-screenshots/after/event-390.jpg) · [depois 1280](v012-global-ui-screenshots/after/event-1280.jpg)
- Combat, Between Realms, passivos e Extraction: capturas mobile/desktop `ui4c-*` na pasta [after](v012-global-ui-screenshots/after/).

## Testes executados

- **PASS — `npm test`: 282/282.**
- **PASS — `npm run test:browser`:** Expedition completa, Evasion, Equipment, hosting privado, treasures e audit Shrine/recursos.
- **PASS — regressões Chromium UI.0–UI.4e:** Merchant, Apothecary, Forge, Shrine, combate, Between Realms, poções, save/reload e ciclos de Expedition. O menu mobile também passou nos fluxos Account e Leaderboard em 320/390 px; estado `aria-expanded` acompanha abrir/fechar.
- **PASS — fluxos UI.5/C.3:** Bag de 12 itens e overflow, loot em combate, passivo após vitória, retorno ao Camp, treasure loot/Sell All/Extraction e armazenamento sintético.
- **PASS — `git diff --check`.** A primeira tentativa sandbox de `npm test`/browser não podia escutar loopback (`EPERM`); repetidos com permissão de execução local, ambos passaram. Não foram executadas simulações de balanceamento nem acessados saves reais.

## Pendências e severidade

- **P2 — Safari/WebKit:** Safari não existe neste ambiente Linux e o executável Playwright WebKit não está instalado. Compatibilidade Safari permanece pendente de validação manual num Mac.
- **P2 — screenshots:** Account/Leaderboard, tooltips e algumas variações de modal não têm nova captura antes/depois, embora os fluxos cobertos por testes funcionais tenham sido exercitados.
- **Sem P0/P1 conhecidos em Chromium.** O NPC do City Center continua com o placeholder de arte previamente aprovado/documentado.

O trabalho começou em `26dc83f`; preservei os commits UI.5/6 que chegaram a `development` durante a auditoria. Não foram alterados gameplay, balanceamento, economia, Firebase, saves reais, `main` ou deploys.
