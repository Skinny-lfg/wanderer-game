# Wanderer v0.12 — UI Corrections Follow-up

Validação em `development`. As correções foram aplicadas sem alterar regras de jogo, saves ou economia.

| Alteração | Estado | Validação |
|---|---|---|
| Inventory/Shrine sem a barra Back to Camp nem espaço residual | PASS | Renderização e screenshots desktop/mobile; confirmação do conteúdo subir |
| Ícones e legendas de equipamento/poções no Camp | PASS | Screenshot Camp 1280/390; dimensões exteriores dos slots preservadas |
| Cantos intermédios na janela Expedition | PASS | Classe MEDIUM confirmada; screenshot Camp |
| Cores Common/Uncommon/Rare no Apothecary | PASS | Captura com três raridades; moldura e nome correspondem à raridade |
| Detalhes de passivos de affinity recolhidos por defeito | PASS | Teste funcional expande e recolhe por toque; seleção não é ativada pelo accordion |
| Bag de combate compacta, slots quadrados e espaçamento superior | PASS | Teste e screenshots em 5 viewports |
| Between Realms: Bag compacta, 5 atributos numa linha, HP/Mana sem caixa decorativa | PASS | Teste e screenshots; a faixa de atributos foi movida para a largura do painel de equipamento para permanecer legível em mobile |
| Sell All inclui Valuables elegíveis | PASS | Testes C.3 existentes verificam venda dos seis treasures, limpeza da lista e crédito de 175 Gold; não foi necessária alteração de produção |

## Implementação

- Removida a criação do container `phase3ReturnBar` para Inventory (`equipment`) e Shrine (`runes`); permanece nas vistas para as quais já era previsto.
- Aumentadas as imagens e legendas dos slots do Camp sem alterar a área dos botões; removidos o contorno decorativo dos slots e os fundos/contornos dos botões de poção.
- A janela de Expedition passou de ornamento LARGE para MEDIUM.
- Apothecary agora utiliza os helpers existentes de frame/imagem de raridade, aplicando a cor real da raridade também ao nome. Os estilos atualizam-se com a renderização após compra/restock.
- Os detalhes completos de passivos usam `<details>` recolhido por defeito, separado do botão de seleção da affinity.
- A largura da Expedition Bag foi limitada a 296px nos pontos em que uma regra anterior a expandia; os tiles mantêm `aspect-ratio: 1/1`. Foi adicionado espaçamento superior ao layout de combate e estilo Gothic carmesim ao botão Exit Realm.
- Os cinco atributos primários passaram a ocupar a largura da zona de equipamento em Between Realms, em vez da coluna estreita ao lado do modelo.
- Atualizados os testes browser UI.2 e UI.3 para cobrir estes estados.

## Testes

- `npm test` — **PASS**, 293/293 testes.
- `npm run test:browser` — **PASS**, todas as etapas do script concluídas, incluindo Expedition, equipamentos, hosting privado, treasures/Sell All e Shrine.
- `node tests/v012-ui2-browser.cjs` — **PASS**, 1280×720, 1024×768, 768×1024, 390×844 e 360×800.
- `node tests/v012-ui3-browser.cjs` — **PASS**, 1440×900, 1280×720, 1024×768, 768×1024, 390×844 e 360×800.
- Chromium foi usado para screenshots e interações. Safari/WebKit não estava disponível e permanece pendente.

## Capturas

Capturas reais após as correções:

| Área | Desktop | Mobile |
|---|---|---|
| Camp / equipamentos e poções | [1280px](v012-ui-corrections-followup/screenshots/camp-1280.png) | [390px](v012-ui-corrections-followup/screenshots/camp-390.png) |
| Inventory | [1280px](v012-ui-corrections-followup/screenshots/inventory-1280.png) | [390px](v012-ui-corrections-followup/screenshots/inventory-390.png) |
| Shrine | [1280px](v012-ui-corrections-followup/screenshots/shrine-1280.png) | [390px](v012-ui-corrections-followup/screenshots/shrine-390.png) |
| Apothecary / raridades | [1280px](v012-ui-corrections-followup/screenshots/apothecary-1280.png) | [390px](v012-ui-corrections-followup/screenshots/apothecary-390.png) |
| Escolha de affinities | [1280px](v012-ui-corrections-followup/screenshots/affinities-1280.png) | [390px](v012-ui-corrections-followup/screenshots/affinities-390.png) |
| Detalhes de passive expandidos | — | [390px](v012-ui-corrections-followup/screenshots/affinity-details-expanded-390.png) |
| Arena / combate e Bag | [1280px](v012-ui-corrections-followup/screenshots/combat-1280.png) | [390px](v012-ui-corrections-followup/screenshots/combat-390.png) |
| Between Realms | [1280px](v012-ui-corrections-followup/screenshots/between-realms-1280.png) | [390px](v012-ui-corrections-followup/screenshots/between-realms-390.png) |
| Between Realms / equipamento e atributos | [1280px](v012-ui-corrections-followup/screenshots/between-equipment-1280.png) | [390px](v012-ui-corrections-followup/screenshots/between-equipment-390.png) |

## Pendências

- Safari real/WebKit: validação não executada por indisponibilidade no ambiente.
- A suíte autónoma antiga `v012-gothic-three-tier-browser.cjs` ainda contém uma comparação de padding entre stats compartilhadas e stats do Camp que falha; não faz parte de `npm run test:browser`, e não foi alterada neste follow-up. As suítes obrigatórias acima passaram.

As imagens anteriores existentes no repositório foram preservadas e não foram substituídas; este relatório inclui capturas novas da execução atual.
