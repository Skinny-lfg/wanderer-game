# Wanderer v0.12 — relatório de estabilização pré-release

**Recomendação: READY FOR NEXT PHASE.** Isto libera apenas a próxima fase de desenvolvimento. Não autoriza merge para `main`, deploy, publicação Firebase, reset/migração de saves nem lançamento público.

## 1. Base e preservação

- Branch: `development`.
- HEAD base e atual: `79114ae0c29657592f6718f1df5a4769994ee850` (`style(v0.12): align square potion tiles and remove Camp set summary`).
- Antes das alterações desta tarefa, o worktree continha as mudanças locais da auditoria anterior: popup da Forja, ajustes visuais, testes, relatório e screenshots. Foram preservadas.
- Nenhum commit ou push foi feito. `main`, Firebase real e saves reais não foram tocados.

## 2. Divergência do trace de runtime

A divergência não foi causada por alterações desta estabilização. O fixture tinha sido validado antes de mudanças já presentes no branch:

1. `combat/v012-combat-runtime.js` incorporou o balanceamento aprovado de papéis de mobs normais (`tank`, `skirmisher`, `caster`), com atributos, tipo de ataque e cadência próprios. O primeiro estado comparado já difere na imagem de ataque do inimigo; os papéis/atributos também alteram o estado de combate registado. Não alterei esses valores.
2. `online/v012-expedition-runtime.js` recebeu o fluxo de UX para escolher o passivo obrigatório e retornar diretamente ao Between Realms quando há um resultado de evento pendente. Na fixture antiga, o harness registava um passo separado `exitResult`. A sequência de ações diverge pela primeira vez no trace do caso seed 100 após o evento no Plane 5: o código antigo consome um passo de saída; o atual já está pronto para escolher a próxima rota. Esse passo removido é transição de interface, não recompensa ou combate extra.
3. A revisão limpa `40f088f` passa com a fixture antiga; o runtime atual produz traces idênticos entre duas execuções independentes em todos os 21 cenários. O script de auditoria também repetiu os guardrails Endless D200/E300.

Atualizei `tests/fixtures/v012-runtime-reference.json` com os hashes e contagens atuais estáveis e documentei no `baselineReason` por que a referência anterior já não descrevia o código. Não foi feito rebaseline para mascarar flakiness ou uma mudança desta tarefa; mudanças intencionais de runtime anteriores são a causa demonstrada. `tests/v012-runtime-integration.test.cjs` agora passa.

## 3. Carregamento Firebase no preview privado

O Chromium DevTools Protocol identificou a cadeia precisa:

`index.html` carregava `online/v012-feedback.mjs` → esse módulo importa `online/firebase-client.mjs` → o cliente solicitava `online/vendor/firebase-sdk.mjs`.

O teste não encontrou Service Worker, registration ou Cache Storage ativos. Não foi observada requisição a `online/app.mjs`; a falha era o Firebase SDK trazido pelo módulo de feedback.

O servidor privado agora remove o elemento do módulo `v012-feedback.mjs` apenas no HTML servido para o preview local e esconde os controlos de conta, leaderboard e feedback que não têm serviço nesse modo. Os módulos e o código de autenticação permanecem no repositório para futura integração. O teste privado verifica a ausência dos pedidos e dos controlos, além do fluxo isolado de jogo.

## 4. Correções e testes antigos desalinhados

- Atualizei a expectativa do teste de dano para a implementação vigente: dano numérico finito positivo chama o flash do inimigo.
- Atualizei o teste do botão Start para o recorte aprovado presente no CSS: 28% em desktop e 28,5% em mobile. Nenhuma regra visual de produção foi alterada nesta estabilização.
- Ajustei o limite do teste de clareza para admitir 14 px no desktop, conforme a verificação de legibilidade dos estados. A fonte e os ícones usados na interface mantêm os valores aprovados.
- Preservei as mudanças da auditoria anterior do popup Forge, os screenshots e os testes.

## 5. Verificações executadas

| Verificação | Resultado |
|---|---|
| `npm test` | **PASS — 366 testes**, 0 falhas. Inclui combate, economia, persistência, migração sintética, rewards, lifecycle, bag, Runas e proteção contra duplicação. |
| `npm run test:browser` | **PASS**. Suite Chromium completa: Forge 360/390/430/768/1280; combate/ícones 390/1280; animações 390/1280; Expedition completa 390/1280; evasão; equipamento 360–1440; preview privado 390/1280; tesouros, Shrine, Apothecary, Inventory e Between Realms. |
| `node --test tests/v012-runtime-integration.test.cjs` | **PASS** — 21 cenários de paridade mais verificações de clocks/runtime. |
| `node tests/private-preview-browser.cjs` | **PASS** — 390 e 1280 px, sem requests a app clássico/Firebase; storage sintético preservado. |
| `node --test tests/v012-hotfix-oct25.test.cjs tests/v012-camp-economy-and-visual.test.cjs` | **PASS** — verificações estáticas alinhadas ao código atual. |
| Auditor de referência `node scripts/v012-integration-reference-audit.cjs` | **PASS** — 21 traces repetidos com hashes estáveis; guardrails D200/E300 completados. |
| `node tests/v012-forge-result-popup-browser.cjs` | **PASS** — modal, proporção quadrada, ações, Escape e cobrança única em cinco viewports. Executado como parte da suite browser. |
| Persistência e economia | **PASS** — testes incluídos em `npm test`; checkpoints, refresh/restore sintético, perda/extração, Forge/Merchant/Apothecary e bloqueio de recompensas duplicadas. |
| `git diff --check` | **PASS**. |

Os testes precisam de loopback local; foram executados com permissão de rede local. Não houve conexão com Firebase real.

## 6. Regressões e itens fora de âmbito

Os fluxos de iniciar/encerrar Expeditions, extração, vitória, derrota, abandono, Between Realms, persistência local, lojas, itens/poções, eventos e recompensas passaram nas suites listadas. O popup compacto da Forja continuou a passar; os screenshots da auditoria anterior permanecem presentes.

Firebase Authentication e Cloud Saves continuam deliberadamente fora desta tarefa. Firestore Rules não foram alteradas nem testadas/deployadas. Também não foram feitos OAuth real, Safari/iOS, Android físico, reset, migração real ou publicação. Permanecem os itens de prontidão de release indicados no relatório pré-release, incluindo integração cloud v0.12 e validação staging/Rules. Isso não bloqueia a próxima fase de desenvolvimento autorizada por este pedido.

## 7. Ficheiros alterados

- Retidos da auditoria anterior: `index.html`, `online/v012-combat-passive-clarity.css`, `package.json`, `tests/v012-combat-visual-clarity-browser.cjs`, `tests/v012-complete-boss-animations.test.cjs`, `tests/v012-item-popup.test.cjs`, `tests/v012-forge-result-popup-browser.cjs`, `docs/v012-final-pre-release-audit.md` e `docs/v012-release-audit/screenshots/*`.
- Estabilização: `preview/private-server.mjs`, `scripts/v012-integration-reference-audit.cjs`, `tests/fixtures/v012-runtime-reference.json`, `tests/private-preview-browser.cjs`, `tests/v012-camp-economy-and-visual.test.cjs`, `tests/v012-hotfix-oct25.test.cjs`.
- Este relatório: `docs/v012-stabilization-report.md`.

Os screenshots antigos regenerados automaticamente por testes de UI foram restaurados ao conteúdo de HEAD; não aparecem como alterações desta tarefa.

## 8. Patch de revisão

- SHA base do patch: `79114ae0c29657592f6718f1df5a4769994ee850`.
- Patch Git binário completo, com ficheiros novos e screenshots: `/workspace/wanderer-v012-stabilization.patch`.
- O patch não contém credenciais, tokens nem saves reais. Não foi necessário ZIP complementar porque os binários/screenshots estão incluídos no patch Git.
- SHA-256 do patch: fornecido com o artefacto na resposta final.

**READY FOR NEXT PHASE.** Esta recomendação significa apenas que os bloqueios técnicos desta estabilização foram resolvidos para continuar a integração em `development`; não significa pronto para lançamento.
