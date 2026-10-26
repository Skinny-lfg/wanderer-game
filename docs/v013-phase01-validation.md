# Wanderer v0.13 — Fase 0.1: recuperação, integração e validação

Data: 2026-10-26. Repositório: `Skinny-lfg/wanderer-game`. Branch de trabalho: `development`.

## Estado inicial e fontes consultadas

- Workspace limpo criado a partir da `development` remota em `8fa391c68058bea81df4c7bdb0711d1c07800dd7`. O GitHub confirmou esse SHA novamente antes dos commits locais.
- Checkout anterior preservado em `/workspace/wanderer-game`, em `6fa3c289556b669dff36bd8960eef44aad8bf08c`, com seis commits locais e alterações pendentes. Não foi limpo, alterado, rebaseado nem descartado.
- Lidos `AGENTS.md` e a Skill `plugins/wanderer-dev-agent/skills/wanderer-dev-agent/SKILL.md` no workspace Cloud.
- Os relatórios anteriores estavam disponíveis apenas no checkout preservado: `docs/v013-main-parity-audit.md` e `docs/v013-main-parity-validation.md`. Também estavam disponíveis `docs/v013-implementation-masterplan.md`, `docs/v013-main-parity-codex-handoff.md`, `docs/v012-current-only-cleanup.md` e `docs/v012-engine-unification.md` na branch limpa.
- O código ativo continua a arrancar por `index.html`; o protótipo do mapa v0.13 permanece isolado, sem carregamento pelo entrypoint. Não foi implementado mapa novo nem mecânica de combate v0.13.

## Recuperação seletiva

Os commits abaixo não existiam na história remota `8fa391c`; as diferenças relevantes foram reaplicadas por cherry-pick, preservando os commits originais no checkout anterior:

| Commit anterior | Commit local preparado | Conteúdo recuperado |
|---|---|---|
| `9718615` | `b0cf0c9` | Conta registada, Google/email, nickname, recuperação, cloud saves privados, Feedback/Community e perfil público com allowlist de equipamento equipado/Runes. |
| `9e0d68f` | `5e44eea` | Regras e testes de identidade registada, Auth Emulator e privacidade pública. |
| `f3f605e` | `9c8a043` | Orquestração do simulador que resolve escolhas obrigatórias sem forçar estados; regressão determinística E1/seed 2. |
| `4bcf311` | `3fff472` | Desbloqueio do preview local e adaptação do smoke VFX à rota atual pelo runtime de combate. |

O cherry-pick de VFX encontrou conflito porque a branch remota já tinha movido a atribuição dos efeitos para `combat/v012-combat-runtime.js`. A resolução manteve a verificação do motor (`animateEnemyStrike`) e a sincronização com o dano, sem reintroduzir expectativas de chamadas literais no HTML.

Não foram reaplicados `bdaaa22` e `6fa3c28`: são snapshots de relatórios anteriores, cujo conteúdo foi consultado e consolidado neste documento. Não foi necessário reaplicar as alterações pendentes de plugin, `AGENTS.md` e scripts do agente: já estavam na branch remota. O suporte MIME `font/ttf` e o respetivo teste do preview também já estavam presentes.

## Funcionalidades e segurança

| Área | Evidência | Resultado |
|---|---|---|
| Conta registada por email, login e recuperação | Auth Emulator e `profile-restore` | **PASS** em emulador e unit tests. Não prova funcionamento do projeto Firebase live. |
| Google | Botão visível em 360–1440 px e implementação `signInGoogle` presente | **PARTIAL**. Não foi feito OAuth real nem interação com conta Google. |
| Guest | UI não oferece Guest; Rules/Auth Emulator recusam identidades anónimas | **NOT SUPPORTED** pela arquitetura atual, intencionalmente registada-only. Não satisfaz o pedido de validar “Google e Guest”. |
| Nickname e ownership | Transação atómica e Rules Emulator | **PASS** nos testes locais. |
| Cloud saves / isolamento | Unit tests de save coordinator, binding UID, revisão, restore e Rules Emulator | **PASS** em testes isolados. Nenhum save real foi lido ou alterado. |
| Feedback e Bug Report | Formulário/model tests e Rules Emulator: payload limitado, identidade registada, lock de rate limit, sem leitura/spoofing | **PASS** em mocks e emulador. Serviço live não testado. |
| Leaderboard e perfis públicos | Testes de modelo, serialização e Rules Emulator | **PASS** para nickname, personagem e allowlist pública. Equipamento/Rune são apenas os efetivamente equipados; inventário, moedas e save privado são rejeitados/omitidos. |
| Autoridade da pontuação | Submissão do cliente continua marcada como não verificada | **PENDENTE**: não considerar resultados do leaderboard autoritativos sem validação server-side. |
| Rules de produção / OAuth live | Excluídos pelo âmbito e pelas proteções de `AGENTS.md` | **NOT TESTED**. Rules não foram publicadas. |

O jogo clássico e os módulos antigos não foram reintroduzidos. O preview usa dados sintéticos e armazenamento local isolado; os emuladores foram executados apenas em `demo-wanderer`.

## Bloqueios da validação anterior e correções

1. **E1 / seed 2 / Bow / Decay / Realm 13 preso em `choice`:** a máquina de estados estava corretamente a exigir o draft passivo. O simulador não resolvia o draft/recompensa antes de selecionar a oferta seguinte e podia reentrar em caminhos já processados. A correção resolve escolhas obrigatórias e ofertas legais com fluxos determinísticos. Regressão E1 completada, sem bypass de validação ou mudança de balanceamento.
2. **Preview privado oculto:** o servidor local removia os módulos de Account/Auth para impedir Firebase real, mas o `v012Preboot` continuava a esconder a aplicação, pois o Account de produção era quem o removia. A correção remove essa classe apenas no HTML servido pelo preview autenticado local. Login real e cloud saves continuam fora do preview.
3. **Smoke VFX desatualizado:** o engine atribui o efeito ao ataque e chama `animateEnemyStrike` no runtime canónico. O smoke foi alinhado a essa arquitetura; os testes de boss/mob validam o efeito visual e a sincronização. Dano e timings não foram alterados.
4. **Browser UI polish:** o servidor de teste servia `.mjs` como `application/octet-stream`, bloqueando o módulo local de Account e deixando o preboot activo. O MIME do fixture foi corrigido para `text/javascript`; a auditoria UI passou.
5. **Extração com Bag cheia:** foi acrescentado um teste browser dedicado. Confirma que a entrada no Realm seguinte fica bloqueada, a extração permanece permitida, os tesouros aparecem como retidos no resumo e nenhuma Rune é concedida.
6. **Preflight:** corrigida a comparação que confrontava SHA curto local com SHA completo remoto. A indicação de igualdade só é falsa agora quando os commits realmente diferem.

## Testes executados

| Comando / cenário | Resultado |
|---|---|
| `npm test` | **PASS — 375/375**, 0 falhas. Inclui saves/reload, cloud coordinator, privacidade, UI, economia e regressão E1. |
| `npm run test:preview` | **PASS — 4/4**, servidor privado e fontes TTF, isolamento de paths, CSRF e rate limits. |
| `npm run test:rules` | **PASS — 10/10** em Auth + Firestore Emulators com `demo-wanderer`; sem login CLI, Firebase live ou saves reais. |
| `npm run test:browser` | **PASS** após corrigir o harness. Login gate, Camp/Apothecary, Expedition completa, Save/Reload, Evasion, equipamento, preview, treasures, Shrine, VFX e UI polish em desktop/mobile. Os testes verificam erros de página e assets onde aplicável. |
| `tests/v013-full-bag-extraction-browser.cjs` (integrado em `test:browser`) | **PASS** em 390×844 e 1280×800; sem erros de página. |
| `npm run test:assets` | **PASS** — 29 PNGs transparentes, mapeamentos Staff/Wand e routing VFX no engine. |
| `npm run simulate:v012` | **PASS** — 174 casos, 0 timeouts, 61 vitórias. |
| `npm run wanderer:screenshots` | **PASS** — Camp e Combat em 390×844 e 1280×800; `pageErrors`, `failedResponses` e `externalRequests` vazios. Capturas em `test-results/wanderer-dev-agent/`. |
| Login gate browser | **PASS** — Google/email visíveis, Guest ausente, gameplay fechado sem autenticação; viewports 360–1440 px. |
| `npm run wanderer:preflight` | **PASS** como relatório manual. Branch `development`; HEAD local avançado sobre o último SHA remoto confirmado; ferramentas locais prontas. Há sinais de versão históricos divergentes nos títulos/docs. |
| `npm run wanderer:test:agent` | **FAIL no executor Cloud** — o teste do hook tenta iniciar outro processo Node e o Cloud devolve `EPERM`; o preflight executado diretamente funciona. |
| Tentativa exploratória do antigo `tests/v012-ui2-browser.cjs` | **NOT PASS — harness legado incompatível**. Após ajustes temporários de seletores, falhou porque `phase1Controller` não existe no contexto injetado. Não está na cadeia configurada `test:browser`; o fluxo crítico Bag cheia foi coberto pelo novo teste dedicado PASS. Todas as edições temporárias foram revertidas. |
| OAuth Google live, Guest login, Firebase live, saves reais e Rules publicadas | **NOT TESTED** por segurança. Guest está explicitamente bloqueado pelas Rules atuais. |

Na primeira execução de `npm test`, o sandbox bloqueou o listener localhost do preview; a repetição com loopback autorizado passou 375/375. As screenshots que os testes geraram em diretórios versionados foram restauradas; screenshots isoladas ficaram em `test-results/`.

## Diferenças e alterações locais

- A `development` remota continua no SHA `8fa391c68058bea81df4c7bdb0711d1c07800dd7`. Os commits recuperados são quatro commits locais fast-forward sobre esse SHA; não houve push.
- A paridade de Account/Feedback/Leaderboard descrita nos relatórios anteriores foi recuperada seletivamente; os hotfixes de 25/10 já estavam presentes na branch remota e foram revalidados.
- Ficheiros de produção alterados pelos commits recuperados: `firestore.rules`, `index.html`, `online/firebase-client.mjs`, `online/v012-account.mjs`, `online/v012-cloud-save.mjs`, `online/v012-community.mjs`, `online/v012-feedback.mjs`, `online/v012-public-equipment.mjs`, `online/v012-required-auth.css` e `scripts/v012-complete-sim.cjs`.
- Testes atualizados/novos: `tests/firestore-rules.test.mjs`, `tests/v013-auth-emulator.test.mjs`, `tests/v013-public-equipment.test.mjs`, `tests/v013-economy-seed-regression.test.cjs`, `tests/v012-account-ui-browser.cjs`, `tests/v012-expedition-browser.cjs`, `tests/private-preview.test.mjs`, `tests/vfx-affinity-enemy-smoke.cjs`, `tests/v012-ui-polish-browser.cjs` e `tests/v013-full-bag-extraction-browser.cjs`; scripts de teste correspondentes em `package.json`.
- Ferramenta atualizada: `plugins/wanderer-dev-agent/scripts/project-snapshot.mjs` compara SHAs completos.
- A branch remota também mantém o protótipo de mapa v0.13 isolado; esta fase não o alterou nem ligou ao entrypoint.

## Commits locais preparados

- `b0cf0c9` — `feat(v0.13): restore registered accounts and private cloud saves`
- `5e44eea` — `test(v0.13): cover registered Firebase identity and public privacy`
- `9c8a043` — `fix(sim): resolve required expedition choices`
- `3fff472` — `fix(preview): unblock isolated local game boot`
- `20a4a9e` — `test(v0.13): cover full-bag extraction in browser`
- `12166f1` — `fix(dev-agent): compare complete development SHAs`
- Este relatório será o commit local final; não fazer push sem autorização.

## Pendências e prontidão

**NOT READY para declarar a Fase 0 totalmente fechada e iniciar a Fase 1 sob todos os requisitos pedidos.** A regressão crítica de simulação, preview, VFX e extração com Bag cheia está corrigida e validada. Permanecem bloqueios funcionais/validação explícitos:

1. O pedido inclui login Guest, mas a arquitetura atual deliberadamente exige contas registadas e as Rules recusam Anonymous. É necessário decidir se Guest deve ser suportado antes de alterar a política de autenticação e Rules.
2. OAuth Google e o comportamento de saves num projeto Firebase real não foram testados; apenas UI, mocks e emuladores locais passaram.
3. O leaderboard aceita pontuação declarada pelo cliente como não verificada; falta validação server-side para resultados autoritativos.
4. O teste automático do hook do agente não consegue iniciar subprocessos no executor Cloud (`EPERM`); preflight manual passou.

Não foi feito push, deploy, publicação de Rules, alteração à `main`, acesso a conta/saves reais ou implementação de mecânicas da v0.13.
