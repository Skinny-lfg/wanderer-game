# Wanderer v0.12 — Fase UI.1: Camp e Inventory

Estado: **implementada e validada localmente em `development`; publicação pendente de autorização**. Base remota: UI.2 `67b3d8d`. Capturas: `docs/ui1-screenshots/` (Camp e Inventory, 1280px e 390px).

## Alterações

- Camp: composição com estado, personagem/equipamento e Expedition em proporções aproximadas de 22/43/35 no desktop. Health, Mana quando aplicável, ATK, DEF, resumo dos set bonuses e Your Journey expansível ficam na coluna de estado. Mantidos o modelo, dez slots e três slots de poções; arte da Expedition reduzida e Start permanece visível em 1280×720.
- Inventory: os três slots de poções ficam abaixo do equipamento; o Stash mantém stacks e os handlers de equipar/remover. Stats principais ocupam duas linhas e os valores avançados permanecem acessíveis por expansão. As células do Stash têm mínimo de 78px em desktop. A comparação já existente com item equipado, atributos, compatibilidade e ações aparece somente após uma seleção. Seleção múltipla, limpeza de NEW e reset de filtros ficam em More actions. Valuables vazios ocupam uma linha compacta. Em mobile, Equipment e Stash têm atalhos de navegação sem perder o item selecionado.
- Os cálculos, regras de equipamento, consumíveis, economia, slots, persistência e saves não foram alterados. O resumo de set bonuses apresenta “none active” porque o runtime atual devolve uma lista vazia.

## Validação

| Verificação | Resultado |
|---|---|
| Sintaxe do script inline (`node --check`) e `git diff --check` | PASS |
| `node tests/v012-ui1-browser.cjs`: Camp/Inventory em 1440×900, 1280×720, 1024×768, 768×1024, 390×844 e 360×800 | PASS (6/6) |
| Camp: dez slots, três poções, sem Mana 0/0, Start e poções visíveis em 1280×720 | PASS |
| Inventory: comparação contextual, seleção sem salto de scroll, seleção múltipla, stacks, equipar/remover poção e navegação mobile | PASS |
| Regressão `tests/v012-ui0-browser.cjs` | PASS (6/6) |
| Regressão `tests/v012-ui2-browser.cjs` | PASS (5/5) |
| Regressão `tests/v012-phase-c3-treasures-browser.cjs` | PASS (390px e 1280px) |
| Safari | **Pendente**: indisponível neste ambiente |

Os testes usam apenas uma personagem e um item sintéticos em memória; não acedem a contas ou saves reais. Não houve deploy nem alteração a `main`, Firebase, regras ou dados reais. O cabeçalho mobile global conserva o comportamento existente; a sua revisão pertence à fase de navegação geral.

Ficheiros desta fase: `index.html`, `online/ux39.css`, `tests/v012-ui1-browser.cjs`, este relatório e quatro capturas em `docs/ui1-screenshots/`.
