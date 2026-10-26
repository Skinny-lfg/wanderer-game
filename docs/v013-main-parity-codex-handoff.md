# Wanderer v0.13 — Codex handoff: recuperar Account, Feedback e hotfixes da main ANTES de mexer no gameplay

Data: 2026-10-26. Estado: especificação para o Codex. **Só desenvolvimento, nenhuma execução de alterações live autorizada.**
Repository: Skinny-lfg/wanderer-game
Branches revistas: main \`7cd2a91f03844fe6586f84f11fa45723dd9a6001\`; development \`0b69532c484ac5320d48c8f42e649bd7c8b380cb\` no momento da inspeção. Revalidar HEADs antes de começar; elas estão **divergentes**, não fazer merge global, reset, rebase forçado, cherry-pick automático de commits de release, nem publicar main.

## Motivação e prioridades
A branch development foi limpa/isolada para testes v0.12 e prototipagem v0.13. A main contém correções de produção importantes e módulos de Account, Feedback, Leaderboard e perfis públicos que devem entrar no jogo que será a base da v0.13 **antes** da refatoração profunda de mapa, combate e passivos. Recuperar paridade funcional **sem anular o isolamento dos saves de teste**.

### Inventário de commits da main relevante (analisar DIFFS, não aplicar integralmente)
- \`c7fa04c435a6\` / \`f0bae3613a91\` — v0.12 registered-only Account: Google/email, confirmação email, nickname obrigatório, login gate, save cloud-only, feedback autenticado, leaderboard. Também contém alterações a \`firestore.rules\`, mas **NUNCA deployar Rules**.
- \`edd8777b5e27\` e fixes anteriores \`c6ce7132b841\`, \`b5131a6da4d2\`, \`4c4218c9f452\`, \`8fac105a06c7\` — login splash/error recovery e consistência do cache bust de módulos Firebase. Não retroceder para versões intermédias incompletas.
- \`4d6ec98ae99d\` — compactar Merchant/Forge/popups, passivos e buffs/debuffs, mobile Expedition, sincronizar VFX/hit, reformular texto de rank sem símbolo √.
- \`28cb1558787a\` — perfil público ao clicar nos jogadores da leaderboard.
- \`15382296be85\` — permitir Extract com Bag exatamente cheia (sem overflow) e identificação de Bleed/Burn/Rot, sincronismo de ataque elemental.
- \`822b9cd3a8a4\` — mostrar **equipamento e Runes equipadas** nos perfis do leaderboard (não apenas nome/avatar). \`online/v012-public-equipment.mjs\` sanitiza snapshot público; não publicar Stash, moedas, inventário, save completo nem Runes não equipadas.
- \`7cd2a91f0384\` — README/fluxo release atualizado. Não importar mudanças documentais sem verificar contratos atuais.
- Revisar qualquer outro hotfix main posterior ao release inicial por diff de módulo, não só por mensagem.

### Presença de ficheiros verificada nas branches
\`development\` JÁ TEM versões antigas de \`online/v012-account.mjs\`, \`online/v012-feedback.mjs\`, \`online/v012-cloud-save.mjs\`, \`online/firebase-client.mjs\`, \`firestore.rules\`, \`online/v012-uiux-hotfix-oct25.css\`, \`online/v012-feedback-passive-ui.css\`, \`online/v012-persistence-runtime.js\`. **Não substituir ficheiros inteiros cegamente**, pois development também recebeu limpeza/refatoração.
\`development\` AINDA NÃO TEM \`online/v012-leaderboard-ui.mjs\`, \`online/v012-auth-bootstrap.js\`, \`online/v012-required-auth.css\`, \`online/v012-public-equipment.mjs\`, \`tests/v012-leaderboard-profile-browser.cjs\` (tudo existente na main).
A main contém um fluxo de login com conta registada, enquanto development ainda apresenta "Continue as Guest"; harmonizar de acordo com a opção **da main** (registered Google/email, nickname/verified email) mas preservar bypass seguro de testes isolados e private preview.

## Etapa -1: baseline e decisão da integração
1. Confirmar HEAD/current status de ambas as branches e working tree; só mexer em \`development\`. Não sobrescrever trabalho não commitado, nem resetar/refazer limpeza. Guardar \`docs/v013-main-parity-audit.md\` com inventário diff file-by-file.
2. Correr \`npm test\`, \`npm run test:browser\`, \`npm run test:assets\`, \`npm run test:preview\` em checkout limpo, com origem local/fixtures sem acesso a Firebase real. Ler \`AGENTS.md\`, \`docs/v012-current-only-cleanup.md\`, \`docs/v012-engine-unification.md\`, \`docs/v013-implementation-masterplan.md\`.
3. Identificar pontualmente funções e estruturas removidas na development, para não importar de main o runtime clássico ou scaffolding antigo. Compare \`index.html\`, bootstrap, modules, CSS, cloud-saving adapters, \`firestore.rules\`, tests, \`package.json\`.
4. Conferir que existe uma eventual divergência Bag: documentation do AGENTS diz 6, runtime do index na development define 12. Escrever a fonte de verdade, não alterar capacidade apenas para satisfazer texto.

## Etapa 0A: Account e autenticação (prioridade máxima)
- Reintegrar login gate da main (Google/email, criação de conta, verificação email, nickname, sign-out, regressar ao login, retry em falha de script, cache-busting consistente e no-stuck splash).
- Isolamento: em localhost/test/private preview, manter fixture/saves sintéticos e NÃO exigir Firebase real; em produção exige account registada e loading Cloud confirmada.
- Não permitir que falha de cloud save desbloqueie o jogo com save não persistido. Não converter nem substituir automaticamente saves de contas existentes; decisão de conflito explícita e segura.
- Corrigir \`online/firebase-client.mjs\` para separar/configurar dev versus prod (projeto autorizado por ambiente) sem importar configurações de produção em testes ou publicar acidentalmente.
- Verificar que o fluxo Cloud-only do main não suprime persistence da development em fixtures (e vice-versa). Nenhuma escrita em Firebase durante CI.
- Qualquer proposta de Firestore Rules é **source-only** e teste em emulator; **não deployar** nem alterar regras live sem autorização independente do proprietário. Se uma feature depender de Rules ainda não deployadas no ambiente de testes, documentar a dependência e não declarar end-to-end PASS.

## Etapa 0B: Feedback + leaderboard + perfis públicos
- Feedback com categorias bug/idea/balance/general, descrição e steps, envio autenticado com rate limit e feedback privado em coleção separada; opção "Copy report" se indisponível. Nunca modificar save ao enviar feedback.
- Leaderboard v0.12 com player profiles acessíveis ao selecionar nickname, avatar e informação publicamente permitida; perfil deve mostrar **itens realmente equipados e 3 Rune slots equipados**, reutilizando componentes visuais quando possível; não mostrar stash/private runes.
- Transferir o sanitizador allowlist do main \`online/v012-public-equipment.mjs\` e seus testes; publicar/read somente equipamentos e runes equipadas através da autorização e rules equivalentes.
- Performance: cache/versioning correto, estado de loading/error, evitar duplicate backend imports, UI 320/390/768/1280 px, teclado e focus.

## Etapa 0C: restantes hotfixes pós-release
1. Extract com Bag cheia **exatamente capacity** funciona; overflow bloqueia apenas operações que devem ser bloqueadas. Assegurar não duplicar gold/gear, sem mudança não solicitada de capacidade.
2. Dano combat: Bleed, Burn e Rot associados corretamente aos seus floats, log e dano aplicado no mesmo tick; ataque/VFX coincidente; sem alterar coeficientes.
3. UX: popups Forge/Merchant compactos, side-by-side comparador sem topo redundante, passivos sem texto repetido, affinities com fontes legíveis, buffs/debuffs compactos, mobile Start Expedition visível/alinhado, UI mobile funcional; texto de ranks sem √.
4. Validar outros hotfixes de main pós-release por diff; não reintroduzir features retiradas como Classic/sets ou código antigo de produção que contradiga o engine atual.
5. Tests production, fixtures, browsers e CSS verificados em paridade com comportamento main.

## Gates de segurança e entregas
**Separar commits:** A Account/cloud/auth; B Feedback/Leaderboard/Profile sanitizers; C UI/loot/combat hotfixes; D testes e documentação. Documentar arquivo fonte, estratégia de integração e diferença de comportamento perante main.

Executar em \`development\`:
- \`npm test\`
- \`npm run test:preview\`
- \`npm run test:browser\`
- \`npm run test:assets\`
- \`npm run test:rules\` **só com Firebase emulator configurado; NÃO usa projeto real**; relatar NOT TESTED se não executável.
- \`npm run simulate:v012\` e simulações focadas de paridade de combate se a integração tocar runtime.
- Testar auth com fake backend: Google/email confirmed/unconfirmed, nick collision, erro de rede, login splash fallback, save conflict, logout, multi-tab ownership, retorno browser.
- Feedback: submit autenticado, rate-limit, auth erro, Copy report; private fields não publicados.
- Leaderboard: perfil público, gear/equipped runes, bloqueio de Stash/currency/private rune docs; graceful missing public snapshot.
- Bag: full capacity vs overflow, extract/defeat/reload idempotency.
- Mobile: 320/390px e desktop 1280px, sem regressão VFX e popups.
- Anti-legacy: Classic nunca bootstrapped no entrypoint, arquivo antigo não reintroduzido.

**Zero acessos/escritas em contas/saves reais, production Firebase, Firebase Rules, Railway, deployment, main, migrations.**
Se os testes só passarem com alterações de Rules, documentar a proposta e aguardar autorização para eventual deploy **no projeto de desenvolvimento**, nunca produção automaticamente.
**Não iniciar a limpeza profunda do combat engine ou multi-mobs antes de verificar esta paridade.**

## Resultado esperado de Codex
1. \`docs/v013-main-parity-audit.md\`: lista de features main, arquivos e dependências, quais migraram/não migraram.
2. Código/testes na branch development, commits granulares.
3. \`docs/v013-main-parity-validation.md\`: comandos, PASS/FAIL/NOT TESTED, screenshots mobile/desktop, segurança e diferenças restantes.
4. Relatório ao proprietário com HEAD e próximos passos, sem fazer deploy.
5. Só depois desta integração iniciar plano \`docs/v013-implementation-masterplan.md\` fases 0 limpeza → 1 fluxo → 2 mapa → 3 combate → 4 passivos → 5 equilíbrio.
