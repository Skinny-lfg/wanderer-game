# Wanderer v0.12 — Pre-Release Stabilization

Data: 2026-10-24  
Branch: `development`

## Resumo executivo

As 22 falhas originalmente reportadas foram investigadas: 21 eram fingerprints de runtime que incluíam texto descritivo de passivos e uma era uma expectativa CSS obsoleta. A comparação isolada com o baseline confirma que os 21 estados de runtime continuam iguais nos campos funcionais. As três falhas antigas da suite de resultados continham duas expectativas/fixtures desatualizadas e expuseram uma falha real de apresentação: o resumo de morte omitia equipamento deslocado para o Expedition Bag. A apresentação foi corrigida sem mudar o que a mecânica perde ou preserva.

Validação atual: `npm test` passou com 305/305; `npm run test:browser` passou; os testes dirigidos de persistência, resultados e paridade também passaram. Não foi possível validar zoom real de browser a 200%, e o backup continua apenas no workspace temporário. Por essas limitações operacionais, a decisão é **READY WITH LIMITATIONS**: não foram encontrados bloqueios funcionais críticos, mas a validação manual de zoom e a cópia do backup para armazenamento persistente devem ocorrer antes de uma publicação irreversível.

## Estado Git e working tree

- Branch: `development`.
- HEAD após as correções de runtime e testes: `40f088f83d194cf1b9371e5c1d00ef6faf88f754`.
- Commit de correção do resumo de morte: `164eeae` — `Report displaced gear lost with expedition bag`.
- Commit de testes e paridade: `40f088f` — `Stabilize v0.12 result and parity tests`.
- A branch `main` não foi modificada. Não houve push, merge ou deploy.
- O estado committed reproduz o runtime e a suite validados; não há código de aplicação ou teste pendente fora do Git.

O ficheiro `docs/ui-audit/pre-release-working-tree-manifest.txt` contém 233 entradas e corresponde exatamente ao estado local após a validação. São artefactos herdados em `docs/`, que foram preservados e não foram adicionados a estes commits:

- 118 entradas tracked modificadas: capturas (PNG/JPG) e `mobile-layout-metrics.json`.
- 115 entradas untracked: 105 capturas em `docs/ui-audit/screenshots/`, 7 em `docs/ui-audit/validation-after/`, um ZIP de capturas e dois relatórios (`report.md` e `backup-recovery.md`).
- Não há código, testes ou ficheiros temporários entre essas entradas. Os testes de browser escrevem em diretórios de screenshots; os conteúdos locais preexistentes foram restaurados depois da execução.

Os commits existentes para o texto do Shrine e contraste das barras permanecem na história da branch (`70d5f21` e `358e242`, respetivamente). Nenhum ficheiro anterior foi removido ou descartado.

## Diagnóstico das 22 falhas antigas de `npm test`

### 21 fingerprints de runtime

Os 21 casos abaixo falhavam na assertion de digest em `tests/v012-runtime-integration.test.cjs` (linha 3 no ficheiro atual). Os traces incluíam `checkpoint.session.draft.options[*].description`. A revisão de UX Writing alterou essas strings; isso mudou o hash embora combate, RNG, equipamento, recompensas, progressão e demais estado serializado permanecessem iguais.

Para comparação foi criado um worktree/arquivo isolado do commit baseline `7049528`. A suite de integração e a suite de gear/potions passaram nesse baseline (25/25 e 4/4). A comparação dos 21 traces estado a estado mostrou diferenças somente nos campos de descrição dos drafts. A projeção do trace agora exclui somente essas descrições mutáveis; todos os outros campos continuam cobertos pelo fingerprint.

| Caso | Classificação | Evidência / impacto no jogador |
| --- | --- | --- |
| E1 Sword / Blood | Fingerprint obsoleto | Só descrição do draft diferia; sem diferença funcional. |
| E1 Daggers / Decay | Fingerprint obsoleto | Só descrição do draft diferia; sem diferença funcional. |
| E1 Staff / Magic-Lightning | Fingerprint obsoleto | Só descrição do draft diferia; sem diferença funcional. |
| E1 Wand / Magic-Frost | Fingerprint obsoleto | Só descrição do draft diferia; sem diferença funcional. |
| E1 Bow / Fury | Fingerprint obsoleto | Só descrição do draft diferia; sem diferença funcional. |
| E1 Mace / Aegis | Fingerprint obsoleto | Só descrição do draft diferia; sem diferença funcional. |
| E1 Two-Handed / Vitality | Fingerprint obsoleto | Só descrição do draft diferia; sem diferença funcional. |
| E50 Sword / Blood | Fingerprint obsoleto | Só descrição do draft diferia; sem diferença funcional. |
| E50 Daggers / Decay | Fingerprint obsoleto | Só descrição do draft diferia; sem diferença funcional. |
| E50 Staff / Magic-Lightning | Fingerprint obsoleto | Só descrição do draft diferia; sem diferença funcional. |
| E50 Wand / Magic-Frost | Fingerprint obsoleto | Só descrição do draft diferia; sem diferença funcional. |
| E50 Bow / Fury | Fingerprint obsoleto | Só descrição do draft diferia; sem diferença funcional. |
| E50 Mace / Aegis | Fingerprint obsoleto | Só descrição do draft diferia; sem diferença funcional. |
| E50 Two-Handed / Vitality | Fingerprint obsoleto | Só descrição do draft diferia; sem diferença funcional. |
| E200 Sword / Blood | Fingerprint obsoleto | Só descrição do draft diferia; sem diferença funcional. |
| E200 Daggers / Decay | Fingerprint obsoleto | Só descrição do draft diferia; sem diferença funcional. |
| E200 Staff / Magic-Lightning | Fingerprint obsoleto | Só descrição do draft diferia; sem diferença funcional. |
| E200 Wand / Magic-Frost | Fingerprint obsoleto | Só descrição do draft diferia; sem diferença funcional. |
| E200 Bow / Fury | Fingerprint obsoleto | Só descrição do draft diferia; sem diferença funcional. |
| E200 Mace / Aegis | Fingerprint obsoleto | Só descrição do draft diferia; sem diferença funcional. |
| E200 Two-Handed / Vitality | Fingerprint obsoleto | Só descrição do draft diferia; sem diferença funcional. |

### 1 expectativa de layout

`tests/v012-unified-gear-potions.test.cjs` esperava largura literal `78px` para a grelha de equipamento. O CSS atual utiliza `var(--gear-slot-width)` (68 px no layout base e 60 px no mobile). Era uma expectativa estrutural desatualizada, não um defeito visível: o teste agora verifica a variável responsiva e as verificações browser cobrem dimensões e proporções. A assertion corrigida não aceita silenciosamente ausência do elemento.

A contagem anterior de “suite agregadora” estava incorreta. As 22 falhas individuais eram as 21 fingerprints acima mais esta assertion de geometria.

## Três falhas da suite `v0120-results`

1. **Realm result persists until exit** — expectativa obsoleta. Durante a escolha de recompensa, `review` continua `null`, enquanto o snapshot do Realm fica em `results.realm`; só depois da escolha pode sair. O teste agora segue esse fluxo e confirma que recompensa não é paga duas vezes.
2. **Death recap** — a expectativa antiga dizia que o item recém-equipado seria perdido e que o equipamento substituído seria preservado. A mecânica runtime é “only Bag items are lost”: o novo equipamento fica equipado e o equipamento de casa deslocado para o Bag é perdido. A expectativa foi corrigida. A investigação também encontrou um defeito real no resumo: equipamento deslocado para o Bag não constava em `summary.lost`. `online/v012-expedition-runtime.js` agora inclui gear do Bag ausente do ledger de itens ganhos. O teste confirma ainda que item descartado é reportado em `discarded`.
3. **Expedition boss result / Rune** — fixture inválida. O teste injetava `deep_winter` no histórico sem criar a build válida que o runtime exige. A fixture agora estabelece o passive Magic inicial pelo API de buildcraft antes do boss sintético. Não houve alteração de regra, Rune ou progressão.

Os testes são isolados e não usam saves reais. Os testes de persistência verificam round-trip de resultados com `Save.validate` e claim de Rune uma única vez.

## Correções efetivamente realizadas

- Corrigida a composição de `summary.lost` para refletir o equipamento realmente perdido com o Expedition Bag, sem alterar os resultados de morte.
- Atualizada a projeção dos fingerprints para ignorar apenas copy descritiva mutável, mantendo o restante do estado coberto.
- Atualizada a expectativa CSS responsiva do stash.
- Corrigidas as expectativas e fixtures de resultados para representar o runtime atual.
- Integrados os testes de `v0120-results` e `v0120-persistence` em `npm test`.

## Working tree e backup

O backup local é `/workspace/wanderer-backups/v012-pre-uiux-20261024-182508d-working-tree.zip`.

- SHA-256: `d4eae8005eb3e825664eba4fb1af3b7c60c11de383991ea42eaee5787c85cce6`.
- Integridade ZIP: verificada com `ZipFile.testzip()` (sem membro corrompido; 1.524 membros).
- Verificação de conteúdo: não foram encontrados `.env`, `service-account`, `credentials.json` nem `node_modules/` no arquivo.
- Branch e tag locais `backup/v012-pre-uiux-20261024-182508d` e `v012-pre-uiux-20261024-182508d` apontam para `182508d72d17fc3702e369480b15eeb3162c04a9`.
- **Não existe confirmação de cópia externa persistente.** O ZIP está dentro do workspace do Codex e pode desaparecer quando o ambiente for descartado. Copiar para armazenamento persistente antes de depender dele como recuperação durável. Não foi feito push porque não se confirmou que a publicação de uma branch de backup não acionaria automações externas.

## Testes e resultados

| Comando / verificação | Resultado |
| --- | --- |
| `npm test` | PASS — 305 testes, 0 falhas. Inclui paridade, gear/potions, resultados e persistência. |
| `npm run test:browser` | PASS — suites de Expedition, Evasion, gear, private hosting, tesouros, Shrine, Camp/Apothecary/popups, Inventory/Between Realms e affinity. |
| `node tests/v0120-persistence-browser.cjs` | PASS — 390, 1280 e 1440 px; checkpoint, lock entre tabs, recompensas, drafts, extração, Rune de boss, morte e reload. |
| `node tests/v0120-results.test.cjs` | PASS — 5/5. |
| `node tests/v0120-persistence.test.cjs` | PASS — 5/5. |
| `node tests/v012-runtime-integration.test.cjs` | PASS — 25/25. |
| `node tests/v012-unified-gear-potions.test.cjs` | PASS — 4/4. |
| `git diff --check` | PASS antes dos commits de estabilização. |

Os logs completos desta execução estavam em `/tmp/wanderer-stabilization-npm-test.log`, `/tmp/wanderer-stabilization-browser.log` e `/tmp/wanderer-stabilization-results-browser.log`; `/tmp` é temporário e não constitui arquivo de evidências persistente. As suites de browser não geraram screenshots comparativas de resultados. Foram preservados os artefactos anteriores, sem os reescrever.

## Axe, contraste, zoom e limitações visuais

A evidência Axe existente em `docs/ui-audit/accessibility/axe-after.json` cobre 48 estados (12 interfaces × 4 resoluções) e reporta zero violações. A análise automática assinala 1.724 nós de contraste como incompletos para revisão manual; isso não prova conformidade total nem todos esses nós são falhas.

Medições verificáveis de cores sólidas/pares conhecidos:

| Texto / fundo | Contraste |
| --- | ---: |
| `#e9dfd9` / `#302d30` | 10.38:1 |
| `#e9dfd9` / `#252326` | 11.89:1 |
| `#c5b7b3` / `#302d30` | 7.00:1 |
| `#c5b7b3` / `#252326` | 8.02:1 |
| `#d6b37c` / `#302d30` | 6.87:1 |
| selected tab `#ffe7c8` / `#65403b` | 7.45:1 |
| input `#e9dfd9` / `#211820` | 13.17:1 |
| Mana antiga `#fff4dd` sobre azul central `#3474d4` | 4.19:1 |

Os rácios cobrem os pares e amostras indicados, não texto sobre cada fotografia, gradiente, estado hover/disabled/focus ou todas as combinações no runtime. Não se declara conformidade global WCAG 2.2 AA.

**Zoom real a 200%: pendente.** O ambiente não tem `DISPLAY`, browser gráfico, Firefox ou Xvfb; Chromium está disponível somente em headless e não permitiu demonstrar zoom de browser real. Viewport estreito não é equivalente a zoom. Checklist manual antes da publicação:

1. Num Chrome ou Firefox desktop com GUI, abrir a versão local committed, selecionar zoom do browser a 200% e percorrer Camp, Inventory, Combat, escolha de passivos, Between Realms, Forge/City Center, eventos, resultados e modais.
2. Confirmar reflow sem scroll horizontal, clipping, sobreposição, perda de foco ou ações inacessíveis; confirmar scroll interno e fecho por Escape nos modais.
3. Repetir em 100% e com largura CSS de 320 px; em mobile verificar os controlos por toque e conteúdo junto a elementos sticky.
4. Rever texto pequeno e cores sobre imagens/gradientes em estados normal, selected, focus e disabled. Registar browser, OS, screenshots e problemas encontrados.

## Problemas pendentes e decisão

- Cópia do backup fora do workspace: pendente, sob responsabilidade de quem controla armazenamento persistente.
- Zoom real 200%: pendente de ambiente gráfico compatível.
- Contraste de todos os fundos compostos/estados: não medido de forma exaustiva; a evidência sólida está limitada aos pares acima e à auditoria Axe existente.
- Não há falhas automatizadas atuais nem regressão funcional conhecida nesta estabilização.

## Decisão

**READY WITH LIMITATIONS** — os bloqueios funcionais investigados foram resolvidos ou classificados como expectativas obsoletas com evidência de baseline, e as suites automatizadas atuais passam. Antes de publicação irreversível, guardar o ZIP fora do workspace e concluir a checklist de zoom real/contraste composto. Não houve publicação, push, merge nem deploy.
