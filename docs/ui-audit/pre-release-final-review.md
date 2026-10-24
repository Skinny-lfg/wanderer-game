# Wanderer v0.12 — Final Pre-Release UI/UX Review

**Data:** 2026-10-24  
**Branch:** `development`  
**HEAD verificado:** `358e242019d2c71f04a2f7a8a9ba741c36147cc5`  
**Decisão:** **NOT READY**

## 1. Resumo executivo

A revisão confirmou que as alterações desta passagem não introduziram falhas nos caminhos de UI que foram testados. Foi validada a correção do texto do Shrine contra o runtime, corrigido o contraste do valor sobre a barra de Mana e repetida a suite browser e a auditoria Axe. Porém, ficam bloqueios pré-release: `npm test` continua com 22 falhas (21 fingerprints de fixtures de runtime e uma expectativa antiga de geometria), os testes de resultados continuam com 3 falhas, não foi possível validar zoom real a 200%, e o backup continua sem cópia externa persistente conhecida. Não declarar conformidade WCAG 2.2 AA global.

## 2. Git e alterações pendentes

O trabalho começou em `development` no HEAD conhecido `2e406705a4328bd96a3aa9b3a1b69857db24672f`. O HEAD atual é `358e242`; não houve checkout, reset ou descarte de alterações. Foram criados estes commits locais:

| Commit | Conteúdo |
|---|---|
| `70d5f21` | Corrige o texto de frequência das Runes do Shrine, após confirmar o runtime. |
| `358e242` | Melhora contraste/alinhamento dos valores nas barras HP/Mana; inclui as capturas Axe after atualizadas. |
| *(este relatório)* | Documenta a revisão final e o inventário de alterações locais. |

O antigo hunk Shrine em `index.html` já não está pendente: foi comparado com o runtime e isolado em `70d5f21`. Na versão atual, controller inicia `version: 2`; o runtime concede Runas ao derrotar o boss final da Expedition. Versões antigas usam marcos de tier, incluindo múltiplos de dez. O texto agora descreve o comportamento da versão atual sem alterar recompensa ou progressão. Teste direcionado: `node tests/v012-complete-runes.test.cjs`, **PASS (2/2)**.

Depois dos testes e capturas, `git status --porcelain=v1 --untracked-files=all` apresentou **233 entradas locais** (tracked modificadas e untracked), principalmente screenshots e documentação de fases anteriores. Não foram staged em massa nem incluídas nos commits desta revisão. O inventário exato capturado antes da criação deste relatório está em [`pre-release-working-tree-manifest.txt`](pre-release-working-tree-manifest.txt); o próprio manifesto e este relatório não aparecem nesse snapshot. Alguns testes de browser reescreveram capturas existentes na árvore de trabalho, que permanecem locais e não staged.

## 3. Revisão visual global

Foi feita inspeção visual de capturas representativas mobile/desktop já produzidas pelas fases, e do conjunto Axe before/after. O resultado foi consistente com a hierarquia aprovada; não foi encontrado clipping, distorção de PNG, overflow horizontal novo ou regressão visual que justificasse alteração adicional. A correção deste review afeta apenas a etiqueta numérica central das barras de recursos.

| Interface | Resultado desta revisão | Referência de capturas |
|---|---|---|
| Camp / Inventory | Personagem, slots e atributos preservados; sem regressão observada. Sticky Start Expedition e os dois seletores foram preservados. | [`accessibility/before/`](accessibility/before/) e [`accessibility/after/`](accessibility/after/), `camp-*`, `inventory-*`; capturas anteriores em `phase2h-*`. |
| Combat | HP/valores continuam junto da arte; etiqueta numérica da barra agora tem fundo escuro para legibilidade. Sem mudança de cor/cálculo da barra. | `accessibility/before/combat-*` e `accessibility/after/combat-*`; `combat-special-after/`. |
| Passive Selection | Cartões e conteúdo mecânico preservados; sem regressão observada. | `passive-phase2c-after/`, `combat-special-after/`. |
| Between Realms | Equipamento, stats e passivos visíveis; sem regressão observada. | `accessibility/after/between-realms-*`, `phase2d-after/`. |
| Forge / Blacksmith | Sem regressão observada nas capturas; decoração existente mantida. | `accessibility/after/forge-*`, `phase2e-after/`. |
| Merchant / Apothecary | Ofertas e preços mantidos; sem regressão observada. | `accessibility/before/{merchant,apothecary}-*`, `accessibility/after/`; `phase2f-after/`. |
| Event Decisions | Hierarquia e estados atuais preservados; sem regressão observada. | `phase2g-after/`, capturas de validação existentes em `screenshots/`. |
| Results & Pop-ups | Sem alteração nesta revisão; capturas sintéticas permanecem disponíveis. | `screenshots/results/`, `phase2i-after/`. |
| Affinity / Magic | Fluxo sequencial e dimensões preservados. | `accessibility/after/{initial-affinity-dialog,magic-element-dialog}-*`, `phase2a-after/`. |
| Shrine | Texto alinhado ao runtime atual; layout sem alteração. | `accessibility/after/shrine-*`, `validation-after/shrine/runes/`. |
| Leaderboard | Sem regressão observada. | `accessibility/after/leaderboard-dialog-*`. |
| City Center | Placeholders NPC foram preservados. | `accessibility/after/city-center-*`. |

As capturas são estado visual representativo e não substituem inspeção física em todos os dispositivos. Os nomes e subpastas de screenshots são relativos a `docs/ui-audit/` salvo indicação acima.

## 4. Axe, contraste e acessibilidade

`node tests/v012-accessibility-audit-browser.cjs` passou em 48 estados (12 interfaces × 390×844, 768×1024, 1440×900 e 1920×1080), com **0 violações Axe** após. O comparativo guardado em `accessibility/axe-before.json` / `axe-after.json` regista queda de 131 nós com violações para zero nas regras verificadas: `aria-prohibited-attr`, `heading-order`, `image-redundant-alt`, `region`, `page-has-heading-one` e `label-content-name-mismatch`. Reflow complementar a 320 e 720 CSS px passou em Camp, Inventory e City Center.

Contraste calculado pela fórmula relativa WCAG para pares de cores sólidos:

| Texto / fundo | Rácio | Critério aplicável |
|---|---:|---|
| `#e9dfd9` / `#302d30` | 10.38:1 | AA normal: 4.5:1 |
| `#e9dfd9` / `#252326` | 11.89:1 | AA normal: 4.5:1 |
| `#c5b7b3` / `#302d30` | 7.00:1 | AA normal: 4.5:1 |
| `#c5b7b3` / `#252326` | 8.02:1 | AA normal: 4.5:1 |
| `#d6b37c` / `#302d30` | 6.87:1 | AA normal: 4.5:1 |
| `#ffe7c8` / `#65403b` (tab selecionada) | 7.45:1 | AA normal: 4.5:1 |
| `#e9dfd9` / `#211820` (input) | 13.17:1 | AA normal: 4.5:1 |
| `#fff4dd` / `#3474d4` (valor antigo sobre centro da barra Mana) | 4.19:1 | Abaixo de 4.5:1 |
| Texto branco / chip corrigido, pior caso de fundo branco sob o alpha | 12.26:1 | AA normal: 4.5:1 |

A nova etiqueta escura semiopaca da barra foi calculada sobre o pior fundo branco possível e excede 4.5:1. Os rácios dos tokens e backgrounds lisos são verificáveis, mas Axe deixou **1.724 casos de contraste em `incomplete`** para inspeção manual agregada, sobretudo fundos com imagens, transparências, gradientes, antialiasing e sobreposições. Os rácios acima não provam contraste em todos os pixels nem em hover/focus/disabled. Portanto, o resultado não sustenta conformidade WCAG 2.2 AA completa.

## 5. Zoom e reflow

O reflow a **320 CSS px** foi verificado, mas não é equivalente a browser zoom. Zoom real a 200% **não foi validado**: o ambiente é headless, sem `DISPLAY`, Xvfb, `xdotool` ou browser com UI gráfica. A tentativa por atalho em Chromium headless não alterou `innerWidth`/DPR, portanto não conta como teste de zoom.

**Validação manual necessária:** abrir a aplicação num desktop com Chrome/Firefox gráfico; aumentar o zoom do browser até a UI indicar 200% (não apenas redimensionar viewport); percorrer Camp, Inventory, Combat, Passive Selection, Between Realms, Forge, City Center, Event Decisions, Results e pop-ups. Confirmar reflow/scroll, foco visível, botões acessíveis, texto sem clipping e modais roláveis. Registar browser/OS, screenshots e problemas encontrados.

## 6. Testes e baseline

| Validação | Resultado |
|---|---|
| `npm run test:browser` | **PASS**, após correção CSS; log de trabalho `/tmp/wanderer-browser-final2.log`. |
| `node tests/v012-accessibility-audit-browser.cjs` | **PASS**, 48 combinações; 0 violações Axe reportadas. |
| `node tests/v012-complete-runes.test.cjs` | **PASS**, 2/2; frequência do Shrine confirmada no runtime. |
| `npm test` | **FAIL**, 273 passed / 22 failed (295 total). Detalhe abaixo. |
| `node tests/v0120-results.test.cjs` | **FAIL**, 2 passed / 3 failed; sem código de resultados alterado nesta revisão. |
| `git diff --check` | **PASS**. |
| Interações de fases anteriores | UI.3 (Magic), e testes direcionados de Camp/Inventory/City/Combat e teclado/touch passaram conforme logs anteriores; não repetem toda a validação manual física. |

As 22 falhas da suite principal são **21 folhas + uma asserção geométrica**. As 21 falhas de runtime são hashes esperados divergentes em 3 tiers (`E1`, `E50`, `E200`) × 7 combinações de arma/build (Sword/Blood, Daggers/Decay, Staff/Magic Lightning, Wand/Magic Frost, Bow/Fury, Mace/Aegis, Two-Handed/Vitality). A outra falha está em `tests/v012-unified-gear-potions.test.cjs:30`: espera cinco linhas de `78px`, enquanto o CSS runtime dimensiona pelas variáveis de slot e resulta em `68px`. A falha da suite agregadora conta como um destes resultados, não uma falha adicional. Hashes/snapshots não foram atualizados.

Comparação isolada com o baseline `b089b94` (worktree/arquivo temporário `/tmp/wanderer-review-baseline-XWwt5r`) confirmou que os testes direcionados que contêm as falhas já falhavam antes: `v012-runtime-integration` tinha 21 falhas e 4 sucessos; `v012-unified-gear-potions` tinha 1 falha e 3 sucessos. `private-preview` passou 4/4 no baseline e na execução atual com loopback autorizado; sem essa autorização, o sandbox devolve `listen EPERM 127.0.0.1`, uma limitação ambiental. O resumo antigo de “20 fingerprints” estava incorreto; são **21** fingerprints individuais, mais uma geometria stale. Não foi executada a suite completa `npm test` no baseline; a comparação foi feita nas suites direcionadas que explicam as 22 falhas.

Os 3 testes de resultados são: “Realm result persists until exit” (`review` esperado, obtido `null`), defeat recap (`lost` esperado, obtido `[]`) e final boss recap (passive picks esperados, obtidos `[]`). A comparação reproduzida contra `d7a5dfd` já apresentava os mesmos resultados; runtime de resultados não foi tocado nesta revisão. Esta suite continua a falhar e não deve ser tratada como PASS.

## 7. Backup e segurança

Backup local verificado: `/workspace/wanderer-backups/v012-pre-uiux-20261024-182508d-working-tree.zip`; SHA-256 `d4eae8005eb3e825664eba4fb1af3b7c60c11de383991ea42eaee5787c85cce6`; 1.524 entradas; integridade ZIP confirmada. Branch/tag locais `backup/v012-pre-uiux-20261024-182508d` e `v012-pre-uiux-20261024-182508d` apontam para `182508d72d17fc3702e369480b15eeb3162c04a9`. Recuperação em [`backup-recovery.md`](backup-recovery.md).

O ZIP encontra-se fora do repositório, mas dentro do workspace `/workspace`; não há evidência de cópia externa persistente. O push do backup não foi feito porque não foi possível garantir ausência de gatilhos de serviços externos. Assim, a segurança do snapshot é boa dentro deste ambiente e insuficiente como única garantia entre ambientes temporários. Copiar o ZIP e validar o SHA-256 num armazenamento durável autorizado antes de confiar nele para recuperação futura.

Não foram alterados `main`, Firebase Rules, saves reais, economia, loot, progressão ou mecânicas. Não houve push, merge ou deploy.

## 8. Pendências e severidade

| Severidade | Pendência | Critério para fechar |
|---|---|---|
| **Alta / bloqueio** | 21 divergências de fingerprint de runtime e uma asserção geométrica antiga mantêm `npm test` vermelho. Embora reproduzidas no baseline, o impacto das divergências deve ser explicado/aceite antes de publicação. | Rever origem dos fixtures e documentar decisão; corrigir só defeito confirmado, sem mascarar hashes. Atualizar relatório de testes após validação. |
| **Alta / bloqueio** | Zoom real a 200% não executado. | Validação headed manual documentada acima, sem clipping/falhas funcionais. |
| **Média** | 3 falhas da suite de resultados seguem abertas. | Confirmar contrato correto dos fixtures/runtime e registar aceitação ou correção antes da publicação. |
| **Média** | Backup ZIP não tem cópia externa verificada. | Copiar para armazenamento persistente permitido e verificar SHA-256. |
| **Média** | Casos de contraste em fundos compostos permanecem incompletos; inspeção manual e leitor de ecrã físico não foram realizados. | Medição/inspeção manual representativa para os estados críticos e registo dos resultados. |

## 9. Checklist de publicação

- [x] Confirmar branch e HEAD; preservar alterações locais.
- [x] Separar commits locais das duas correções desta revisão.
- [x] Validar texto Shrine com runtime e teste direcionado.
- [x] Executar suite browser e Axe, sem novas violações Axe nos estados cobertos.
- [x] Confirmar que não foi feito push, merge ou deploy.
- [ ] Resolver/aceitar formalmente as falhas preexistentes de `npm test` e resultados.
- [ ] Completar zoom real a 200% num browser headed.
- [ ] Rever manualmente os contrastes de fundos compostos e controlos transitórios.
- [ ] Criar e verificar cópia de backup fora do ambiente temporário.
- [ ] Reavaliar a decisão de release depois das pendências acima.

## Decisão

**NOT READY.** A revisão não encontrou regressões novas nas áreas exercitadas e corrigiu um contraste insuficiente na barra de Mana. Ainda há falhas de testes conhecidas por classificar/aceitar, uma suite funcional de resultados vermelha, zoom real a 200% pendente e falta de backup externo persistente. Zero violações Axe automáticas não são, por si só, evidência suficiente para publicar.
