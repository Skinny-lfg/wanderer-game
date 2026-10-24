# UI/UX implementation — estado parcial

Branch: `development`. Estado original: `182508d72d17fc3702e369480b15eeb3162c04a9`.

## Backup

Ver [instruções de recuperação](backup-recovery.md). Branch local `backup/v012-pre-uiux-20261024-182508d`, tag `v012-pre-uiux-20261024-182508d`, ZIP verificado em `/workspace/wanderer-backups/v012-pre-uiux-20261024-182508d-working-tree.zip`. Backup remoto pendente por não haver comprovação completa dos gatilhos externos.

## Alterações nesta sessão

- `index.html`: copy do Shrine corrigido para indicar Rune após o boss final de uma Expedition, incluindo o estado vazio. A frequência foi conferida com o runtime de Rune; nenhuma regra de recompensa mudou.
- `index.html`: slots de poções recebem `role="group"` para que o nome ARIA tenha um papel válido.
- `docs/ui-audit/backup-recovery.md`: snapshot e recuperação.

| Texto anterior | Texto novo | Motivo |
|---|---|---|
| “When you fell the final boss of every tenth Expedition...” | “When you fell the final boss of an Expedition...” | A recompensa ocorre em cada vitória contra o boss final. |
| “Fell the final boss of a tenth Expedition...” | “Fell the final boss of an Expedition...” | Mesmo erro no estado vazio. |

## Validação e pendências

`git diff --check` passou. A investigação detalhada está abaixo. Screenshots comparativas, Axe, zoom e validação WebKit ainda estão pendentes. A auditoria visual e a implementação das restantes fases também estão pendentes. Não há commits desta implementação, push, merge ou deploy.

As 112 alterações tracked preexistentes eram screenshots; foram preservadas. O ZIP de imagens e `docs/ui-audit/` preexistentes também foram preservados.

## Diagnóstico de validação (segunda etapa)

O baseline foi montado num worktree isolado em `/tmp/wanderer-uiux-baseline`, destacado no commit `182508d`. O ZIP do backup contém o mesmo `index.html`, os três ficheiros de teste e o CSS de Inventory que esse commit; as alterações locais anteriores eram capturas e documentação. Assim, para estes testes, o worktree reproduz o baseline local pré implementação. Nenhum reset ou limpeza foi executado.

| Ficheiro / teste exato | Erro e local | Comparação com baseline | Classificação |
|---|---|---|---|
| `tests/private-preview.test.mjs`: quatro subtestes de proteção/login/CSRF | `listen EPERM: operation not permitted 127.0.0.1` em `start()`/`server.listen(0, '127.0.0.1')` (linha 20). | Falha idêntica no baseline no sandbox padrão. Com permissão de rede, **4/4 PASS** na árvore atual. | Problema do ambiente. |
| `tests/v012-unified-gear-potions.test.cjs`: `Camp and Inventory keep three potion slots in the same portrait grid` | Assertion da linha 30 espera `grid-template-rows:repeat(5,var(--gear-row)) 78px` em `online/v012-ui6-unified-inventory.css`; o CSS atual usa outras dimensões. Os outros 3 subtestes passam. | Falha idêntica em `182508d`; o ficheiro CSS e o teste não foram modificados nesta fase. | Problema preexistente: expectativa de geometria desatualizada. |
| `tests/v012-runtime-integration.test.cjs`: 20 casos `runtime parity c3-six-treasure-catalog-v012-realm-affinity-rewards` | `assert.equal` do digest SHA-256 na linha 6; por exemplo E200 Mace/aegis: atual `cfc7c1f4…`, referência `a3c7a75d…`. Cinco testes do ficheiro passam. `tests/v012-runtime-trace.cjs` produz o traço e `tests/fixtures/v012-runtime-reference.json` guarda o digest esperado. | Mesmo padrão de falha em `182508d`. Nem runtime nem fixture foram alterados nesta fase. | Problema preexistente: digests de referência divergentes; a causa histórica da divergência não foi investigada nesta etapa. |

### Browser e rede

No sandbox padrão, qualquer servidor de teste que chama `listen(0, '127.0.0.1')` recebe `EPERM`. Um servidor HTTP mínimo iniciou corretamente com a permissão de rede do executor, sem mudança persistente de configuração. `npm run test:browser` executado nessa permissão ultrapassou o bloqueio de rede e falhou no primeiro script, `tests/v012-complete-browser.cjs:43`: `getComputedStyle(document.querySelector(s))` recebeu `null` em `bg()`. A mesma falha foi reproduzida no worktree `182508d`. A cadeia `&&` impede que os scripts de browser seguintes executem depois dessa falha; não há PASS para eles.

Para repetir num ambiente compatível: permitir bind de loopback a `127.0.0.1`, instalar as dependências com `npm ci`, disponibilizar Chromium ao Playwright e executar `npm test` e `npm run test:browser` na raiz do projeto. O problema do seletor ausente continuará a exigir investigação própria, independentemente do ambiente.

### Correções já implementadas e segurança do backup

O diff de produção desta fase limita-se a duas frases de UI no Shrine e ao `role="group"` das slots de poções em `index.html`. A geração de Rune, gameplay, saves, CSS e assets não mudaram. O teste `tests/v012-complete-runes.test.cjs` passou na execução global; a reprodução das três falhas no baseline demonstra que não foram introduzidas por estas alterações. Ainda falta uma captura visual depois das mudanças e uma nova verificação Axe da semântica ARIA, portanto não se declara PASS visual ou WCAG.

A branch e a tag locais de backup continuam em `182508d72d17fc3702e369480b15eeb3162c04a9`. O ZIP em `/workspace/wanderer-backups/v012-pre-uiux-20261024-182508d-working-tree.zip` passou `ZipFile.testzip()` (1 524 ficheiros) e SHA-256 `d4eae8005eb3e825664eba4fb1af3b7c60c11de383991ea42eaee5787c85cce6`. Os patches tracked/staged estão na mesma pasta, e o working tree mantém as alterações locais anteriores. A pasta está fora do repositório mas pertence ao **ambiente de execução atual**; não há garantia de persistência quando o ambiente for substituído. O backup remoto permanece pendente e não foi feito push.

**Decisão:** não há regressão introduzida comprovada que impeça a próxima fase de implementação, mas a validação completa continua bloqueada por duas falhas preexistentes e pelo primeiro harness de browser. Avançar só com validação dirigida de cada próximo grupo de mudanças e sem declarar a suite global PASS.

## Desbloqueio dirigido da validação

O erro `getComputedStyle(null)` estava em `tests/v012-complete-browser.cjs:43`, no seletor `.combatLayout .token`. O HUD de Gold e Fragments é apresentado em `#wallet .token`, fora de `.combatLayout`; não faltava um elemento da interface. O harness passou a exigir pelo menos dois tokens em `#wallet` e a comparar o fundo de cada um com o fundo do painel de combate. Se um token desaparecer, a assertion falha explicitamente. Esta foi a única correção de teste; não foi adicionado HTML de produção.

Depois desta correção, `v012-complete-browser.cjs` **passou em 390 px** e parou em desktop numa assertion preexistente que exige `rgb(58, 37, 45)` para a tab selecionada; o `backgroundColor` computado é transparente. Esta exigência já não corresponde à implementação visual atual e não foi alterada nesta etapa. A cadeia `npm run test:browser` termina nesse ponto; não é um PASS global.

Com loopback permitido pelo executor, os seis scripts seguintes foram executados individualmente e passaram: `v0120-evasion-browser`, `v0120-equipment-browser`, `private-preview-browser`, `v012-phase-c3-treasures-browser`, `v012-global-ui-audit-browser` e `v012-ui-polish-browser`. O teste de Shrine de `v012-global-ui-audit-browser` passou em 768, 1440 e 1920 px.

`npm test` com loopback permitido: **273/294 PASS; 21 FAIL**. Os 21 são os 20 casos preexistentes de digest em `v012-runtime-integration.test.cjs` e a assertion preexistente de geometria em `v012-unified-gear-potions.test.cjs`. Os quatro casos de `private-preview.test.mjs` passaram com essa permissão. Não foram alterados hashes, snapshots nem fórmulas.

A validação dirigida com Chromium e Axe em Camp, Inventory e Shrine, a 390 × 844 e 1440 × 900, guardou seis capturas em [validation-after](validation-after/) e [diagnóstico JSON](validation-after/render-checks.json). `aria-prohibited-attr`: **0/6**; antes surgia em Camp/Inventory. Também foram observados **0 erros de página, 0 imagens em falta e 0 overflow horizontal** nestes seis estados. Permanecem as outras violações Axe já descritas no relatório de auditoria; isto não prova WCAG AA. As capturas atuais têm as mesmas dimensões em pixels que as seis capturas anteriores; Camp e Inventory só apresentam variação mínima de renderização, enquanto Shrine mostra o texto corrigido. A inspeção visual não indicou mudança de layout ou de ornamentos.

O ZIP de backup passou nova verificação de integridade e SHA-256. O exame dos nomes internos não encontrou `.env`, `node_modules`, `.git`, ficheiros de service account, chaves privadas ou `credentials.json`. Está pronto para download em `/workspace/wanderer-backups/v012-pre-uiux-20261024-182508d-working-tree.zip` (SHA-256 `d4eae8005eb3e825664eba4fb1af3b7c60c11de383991ea42eaee5787c85cce6`). **Ainda não há confirmação de uma cópia fora do ambiente temporário**; a próxima fase visual aguarda esse passo. Nenhum push, merge ou deploy foi feito.

## Fase 2A — Affinity e Magic

O mesmo `<dialog>` apresenta agora a escolha da affinity e, ao escolher Magic, os três elementos. Back e Escape regressam à grelha de affinities, com foco de volta no botão Magic; Close fecha o fluxo. A seleção de Fire/Frost/Lightning continua a chamar as mesmas funções de runtime (`phase2ChooseInitial`, `phase2ChooseElement`, `phase2EnterInitialRealm`). `showModal` atribui um ID de título único a cada diálogo. Não houve alterações de progressão, dano ou efeitos.

Em 390 px, Fire e Frost formam a primeira linha e Lightning ocupa a largura da segunda; o texto passou a 14 px. Em desktop, o passo Magic mantém uma janela compacta de 760 px. Os PNGs, a moldura e as cores atuais foram preservados. O texto técnico sobre “existing Expedition progression” foi removido da escolha inicial.

| Texto anterior | Texto novo | Motivo |
|---|---|---|
| “This choice uses the existing Expedition progression.” | Removido | Fala da implementação, não da decisão do jogador. |
| “Choose one of Fire, Frost or Lightning. Its element stays fixed for this Expedition.” | “Choose Fire, Frost, or Lightning. Your choice is fixed for this Expedition.” | Instrução curta com a consequência. |
| “Funded Fire casts apply Burn damage over time.” | “Mana-funded Fire casts inflict Burn damage over time.” | O runtime desconta Mana quando a magia é financiada. |
| “Funded Frost casts Chill foes. Chilled foes take a Spell Power burst every 4s.” | “Mana-funded Frost casts Chill foes. Chilled foes take a Spell Power burst every 4s.” | Explicita a fonte; preserva condição e intervalo. |
| “Funded Lightning casts add Static. Every 4 charges discharge bonus Spell Power damage.” | “Mana-funded Lightning casts add Static. At 4 charges, Static deals bonus Spell Power damage.” | Preserva o limiar e torna o sujeito claro. |

Antes: [Magic mobile](screenshots/dialogs/magic-element/magic-element-mobile-390x844.jpg) e [desktop](screenshots/dialogs/magic-element/magic-element-desktop-1440x900.jpg). Depois: [Magic mobile](phase2a-after/dialogs/magic-element/magic-element-mobile-390x844.jpg) e [desktop](phase2a-after/dialogs/magic-element/magic-element-desktop-1440x900.jpg). As capturas de Affinity inicial estão nas mesmas pastas antes/depois. O diagnóstico [Playwright/Axe](phase2a-after/render-checks.json) regista quatro capturas, sem erro de página, overflow horizontal ou violação Axe no modal capturado.

Validação funcional dirigida em Chromium: **11 fluxos PASS** — seis affinities, três elementos Magic, Escape, Back e Close. Também foi verificado que Magic usa um único diálogo e que o foco regressa ao botão Magic após Back/Escape. `npm test`: **273/294 PASS, 21 falhas preexistentes** (20 hashes e uma expectativa antiga de CSS), igual à etapa anterior. `v012-complete-browser.cjs` passa o fluxo de 390 px; a execução desktop continua bloqueada pela assertion preexistente que exige a cor sólida vinho da tab selecionada. `v012-ui-polish-browser.cjs` passou em Camp/Apothecary/Popup a 360, 390, 430 e 1280 px, Inventory/Between Realms a 360, 390 e 430 px, e no dropdown/seleção de affinity. Não se atribui PASS à suite global de browser.

## Fase 2C — Passive Selection UI/UX

Os cartões do popup de passivos agora mostram a affinity junto do tipo, mantêm a descrição e a comparação de rank disponíveis no próprio cartão, e usam descrições a 14 px. Em 390 px, a grelha apresenta duas opções lado a lado e a terceira em largura total para manter espaço de leitura e toque. Mantive os textos mecânicos existentes: esta fase não reescreveu efeitos, percentagens, cooldowns ou limites.

Capturas antes: [mobile](screenshots/expedition/passive-choice/passive-choice-mobile-390x844.jpg), [tablet](screenshots/expedition/passive-choice/passive-choice-tablet-768x1024.jpg), [desktop](screenshots/expedition/passive-choice/passive-choice-desktop-1440x900.jpg), [wide](screenshots/expedition/passive-choice/passive-choice-wide-1920x1080.jpg). Depois: [passive-phase2c-after](passive-phase2c-after/); Axe/render checks em [JSON](passive-phase2c-after/render-checks.json). Os quatro viewports tiveram 0 overflow, 0 erros JS, 0 imagens em falta e nenhuma violação Axe no estado capturado. `v012-global-ui-audit.test.cjs` e `v012-complete-events.test.cjs`: **2 PASS**. Fixtures incluem escolhas novas de famílias distintas e um upgrade; estados sem upgrades não foram capturados nesta execução. Zoom real a 200% e navegação touch em aparelho real não foram testados.

Commit local da Fase 2A: `Refine initial affinity and Magic selection flow` em `development`. As alterações anteriores do Shrine/slots de poções e as capturas locais anteriores continuam no working tree, fora deste commit.

## Fase 1 — Combat Readability (implementação global, primeiro grupo)

Em `online/v012-core.css`, aumentei o contraste e o tamanho do texto HP atual/máximo para 14 px em mobile e 15 px em desktop, alinhei os números com as barras, dei mais presença à wave e tornei os efeitos ativos mais legíveis sem criar espaço de estado vazio. Ícones e arte não foram alterados; os efeitos continuam anexados ao respetivo combatente e com scroll próprio quando numerosos. Nenhum cálculo ou dado de combate mudou.

Capturas baseline: [mobile 390](screenshots/expedition/combat/combat-mobile-390x844.jpg), [tablet 768](screenshots/expedition/combat/combat-tablet-768x1024.jpg), [desktop 1440](screenshots/expedition/combat/combat-desktop-1440x900.jpg), [wide 1920](screenshots/expedition/combat/combat-wide-1920x1080.jpg). Capturas depois: [390](combat-phase1-after/expedition/combat/combat-mobile-390x844.jpg), [768](combat-phase1-after/expedition/combat/combat-tablet-768x1024.jpg), [1440](combat-phase1-after/expedition/combat/combat-desktop-1440x900.jpg), [1920](combat-phase1-after/expedition/combat/combat-wide-1920x1080.jpg). Axe e verificações de overflow estão em [JSON](combat-phase1-after/render-checks.json).

Validação: Chromium capturou os quatro viewports; **0 overflow horizontal, 0 erros de página e 0 imagens em falta**. Axe manteve somente `page-has-heading-one` e `region`, já reportadas nas auditorias anteriores; não surgiram violações novas no combate. O conteúdo desta captura é uma fixture de combate normal; HP baixo, todos os buffs/debuffs, mana e 4× não foram montados nesta execução. `npm test` está em execução no momento deste registo. Não considerar a fase global concluída até validar esses estados e recolher o resultado da suite.

### Validação adicional de estados especiais

Fixture sintética isolada: HP do jogador a 8%, mana a 42%, barreira ativa, Haste em duas stacks, Focus, Second Wind usado; inimigo a 22% HP com Bleed ×3, Burn ×2, Rot ×3, Shock 3/4, Chill, Boss Barrier e Enraged. Velocidade configurada para 4×. As quatro resoluções foram capturadas em [combat-special-after](combat-special-after/), com evidência Axe em [render-checks.json](combat-special-after/render-checks.json). Verificados: **0 overflow horizontal, 0 erros JS, 0 imagens em falta e 0 novas violações Axe**; `page-has-heading-one` e `region` continuam preexistentes. Axe inicialmente detetou `scrollable-region-focusable` no lane de debuffs do inimigo em desktop; ambos os lanes de efeitos receberam `tabindex="0"` e nome acessível. Repetição: a violação desapareceu nos quatro viewports.

Testes dirigidos `v012-global-ui-audit.test.cjs` e `v012-item-popup.test.cjs`: **2 PASS**. Fixtures cobrem HP cheio no screenshot base e HP crítico com efeitos simultâneos; Mana com valor reduzido, e a branch física sem Mana permanece visível no screenshot base. Não foram exercitados separadamente todos os tipos normal/elite/boss, nem teclado de scroll em browser real. Zoom de navegador a 200% e `npm test` global não foram repetidos nesta etapa. Limitação: o screenshot “especial” combina vários estados no mesmo inimigo boss/elite para verificar densidade e contenção, não mede cada combinação de inimigo isoladamente.
