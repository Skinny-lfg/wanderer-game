# Wanderer v0.12 — Fase UI.2: Combat e Between Realms

Estado: **implementada em `development`**. Base: UI.0 `b7a9e65`. Esta fase altera apresentação e reutiliza o controlador, a Expedition Bag, o draft de passivos, os handlers de reroll e a confirmação de extração existentes.

## Alterações

- Combat: arena ocupa cerca de 69% da largura em desktop; velocidade fica no cabeçalho de Realm/Wave. Active Buffs passou para uma faixa própria acima da arena. A Bag real apresenta contador e recolhe quando vazia; o log preserva histórico com scroll interno.
- Between Realms: resumo da personagem com retrato, HP/Mana aplicável, ATK/DEF, poções, efeitos, passivos e Bag; equipamento completo continua disponível por expansão. Três ofertas comparáveis em desktop, com imagem, nome, affinity, encontro e waves; rerolls visíveis no cabeçalho. Enter/Extract ficam juntos após as opções, sem cobrir cartões. A confirmação existente de extração permanece.
- O modal de passivos da UI.0 continua a apresentar a decisão obrigatória sobre o combate; as três escolhas de Realm continuam a usar os handlers originais. As regras de equipamento durante a Expedition continuam a ser aplicadas pelo controlador existente.
- Não foram alterados combate, economia, balanceamento, limite da Bag, seleção, custos de reroll, saves ou serviços externos.

## Validação

| Verificação | Resultado |
|---|---|
| Sintaxe do script inline (`node --check`) | PASS |
| `node tests/v012-ui2-browser.cjs` em Chromium 1280×720, 1024×768, 768×1024, 390×844, 360×800 | PASS (5/5) |
| Arena dominante, velocidade funcional, Bag real 12 slots, log, modal de passivos, três ofertas, seleção/Enter, reroll, Extract, ausência de erros JS e scroll horizontal | PASS nos cinco viewports |
| `node tests/v012-ui0-browser.cjs` após atualização da posição esperada da barra de ações | PASS (6/6) |
| Inspeção visual de Combat 1280px e Between Realms 1280px/390px | PASS; imagens em `docs/ui2-screenshots/` |
| Safari | **Pendente**: navegador indisponível neste ambiente |

As vitórias no teste de navegador foram controladas artificialmente para alcançar o draft e Between Realms; não constituem validação de balanceamento. A barra de ações foi mantida no fluxo após os cartões: durante a inspeção, a posição sticky encobria o terceiro cartão e o seu reroll em mobile. Os botões ficam junto das escolhas e não sobrepostos.

Ficheiros da fase: `index.html`, `online/ux39.css`, `tests/v012-ui2-browser.cjs`, `tests/v012-ui0-browser.cjs`, este relatório e três capturas em `docs/ui2-screenshots/`.
