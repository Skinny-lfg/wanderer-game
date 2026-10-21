# Wanderer v0.12 — UI.0: correções críticas

**Estado:** implementado em `development`, sem deploy. Reaplicado sobre `1bf970e`, preservando as alterações mais recentes ao Apothecary, Merchant e City Center. Âmbito: apresentação e acesso às decisões; combate, Affinities, economia, stock e saves não foram alterados.

## Alterações

- Apothecary: os quatro cartões reutilizam os assets e ofertas existentes, agora com imagem, nome, raridade, resumo do efeito, preço e Buy em linhas consistentes. Mudar de tab preserva os IDs do stock; o stock atual mantém quatro ofertas aleatórias e Reroll continua a gerar uma nova seleção.
- Passivos: cartões da página e do modal usam a mesma hierarquia de ícone, nome, categoria, efeito, mudança de valor e rank. Nomes e categorias têm espaçamento próprio; descrições apresentadas trocam “ICD” por “cooldown”. O modal tem scroll interno e apresenta uma coluna em mobile.
- Combat Log: apenas a string mostrada arredonda frações com mais de duas casas; os valores do motor e as entradas guardadas permanecem inalterados.
- Between Realms: nomes e metadados dos cartões quebram linha sem se sobrepor. Enter Realm e Extract & Leave ficam juntos no topo da seleção; no mobile, as opções aparecem antes dos detalhes de equipamento. O estado disabled e a confirmação de extração são os existentes.

## Validação

| Verificação | Resultado |
| --- | --- |
| Sintaxe do script principal; `git diff --check` | PASS |
| `node --test tests/v012-complete-flow.test.cjs tests/v012-complete-potions.test.cjs` | PASS, 2 ficheiros |
| `node tests/v012-complete-browser.cjs` | PASS na base anterior da UI.0. No HEAD remoto atual, FAIL por pressupor Health Potion garantida; o stock agora é inteiramente aleatório. Falha anterior ao fluxo alterado pela UI.0. |
| `node tests/v012-ui0-browser.cjs` | PASS em 1440×900, 1280×720, 1024×768, 768×1024, 390×844 e 360×800: 4 cartões sem sobreposição, stock estável ao trocar de tab, sem scroll horizontal; Realm e modal inspecionados em 390px e 1280px |
| Formatação visual do log | PASS: `5.069999999999999` → `5.07`; `12.34567%` → `12.35%` |

O teste direcionado UI.0 passou após a reaplicação sobre `1bf970e`. O browser local precisou de permissão de rede para escutar `127.0.0.1`; a primeira tentativa no sandbox devolveu `EPERM`. Chromium passou após essa permissão. Safari não estava disponível neste ambiente.

## Capturas

- [Apothecary mobile](ui0-screenshots/apothecary-390.png)
- [Modal de passivos mobile](ui0-screenshots/passive-390.png)
- [Between Realms desktop](ui0-screenshots/realm-1280.png)

## Limites

A UI.0 corrige os pontos críticos de legibilidade e acesso. O redesenho completo de Camp, Inventory, Combat, Between Realms, City Center, Shrine, Extraction e UI Kit permanece nas fases UI.1–UI.4 propostas. O Merchant 4×3 já estava implementado no HEAD remoto e foi preservado, sem alterações pela UI.0. A validação visual foi automatizada em Chromium; falta inspeção manual em Safari. Nenhuma alteração do outro worktree UX foi incluída.
