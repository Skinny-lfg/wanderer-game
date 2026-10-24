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

## Fase 2D — Between Realms

Em `online/ux39.css`, aumentei a distinção entre Realm selecionado e não selecionado com `aria-pressed`, foco visível, destaque do cartão selecionado e maior legibilidade do nome/affinity. O resumo do Realm selecionado e `Enter Realm` receberam hierarquia e área de ação mais claras. Em Stats & Passives, mantive os stats visíveis e aumentei rótulos/valores e a área dos summaries dos passivos. Equipment mantém personagem, slots e proporções dos assets.

Antes/depois em quatro viewports: [Realm antes](screenshots/between-realms/realm/) → [depois](phase2d-after/between-realms/realm/); [Equipment antes](screenshots/between-realms/equipment/) → [depois](phase2d-after/between-realms/equipment/); [Stats & Passives antes](screenshots/between-realms/stats-passives/) → [depois](phase2d-after/between-realms/stats-passives/). Resultados Axe/overflow/imagens: [JSON](phase2d-after/render-checks.json). Nas 12 capturas, 0 overflow horizontal, 0 erros de página e 0 imagens em falta. Axe manteve violações existentes: `region`, `image-redundant-alt` (Equipment) e `heading-order` (Stats & Passives); nenhuma regra nova surgiu. `v012-global-ui-audit.test.cjs` e `v012-complete-flow.test.cjs`: 2 PASS. Fixtures cobrem Realm, Equipment e Stats/Passives. Dispositivo físico, zoom 200% e todos os estados de Realm bloqueado não foram testados. Sem alteração de texto ou runtime.

## Fase 2E — Forge, Blacksmith e Legendary Reinforcement

A interface Forge agora segue uma leitura mais direta: configuração de slot/tier/subtype e preview ficam no primeiro painel; as odds completas e a ação Craft com o custo ficam juntas no painel seguinte. Em mobile, o campo Type ocupa a largura inteira e o preview mantém uma coluna estreita para o PNG, dimensionado com `object-fit: contain`. Percentagens, valores e textos de decisão receberam maior destaque e legibilidade. O painel de odds é agora uma secção nomeada dentro do conteúdo principal, sem landmark complementar aninhado.

Se faltarem recursos, Forge mostra `Need N more Fragments to Craft.` junto do botão desativado. Legendary Reinforcement apresenta a mesma indicação junto da ação. Com recurso suficiente, ambos os botões permanecem ativos conforme o runtime. O estado sem Legendary mantém a instrução existente. A navegação contextual realça a operação selecionada e preserva foco visível. O placeholder `NPC artwork placeholder` foi preservado exatamente. Não alterei fórmulas, tiers, odds, custos, resultados, riscos, saves ou copy mecânica existente.

| Texto | Estado nesta fase |
|---|---|
| Explicação de catch-up tier, subtype aleatório, exclusividade de Legendary, salvaging e uso de Gold pelo Merchant | Mantidos; descrevem condições mecânicas e limitações ainda necessárias para decidir. |
| Estado disabled de Craft sem Fragments | Agora explica a diferença exata: `Need N more Fragments to Craft.` |
| Estado disabled de Reinforcement sem Fragments | Agora explica a diferença exata: `Need N more Fragments to Reinforce.` |
| Estado sem Legendary elegível | Mantido: `Find a Legendary in a dungeon to use this feature.` |

Ficheiros de implementação: `index.html`, `online/v012-core.css` e `online/ux39.css`. O relatório e as capturas da fase estão neste diretório.

### Comparação visual

As capturas anteriores estão em [Forge](screenshots/city-center/forge/), [Blacksmith](screenshots/city-center/blacksmith/) e [Legendary Reinforcement](screenshots/city-center/legendary-reinforcement/). As capturas depois estão em [phase2e-after](phase2e-after/): cada interface foi capturada em 390 × 844, 768 × 1024, 1440 × 900 e 1920 × 1080. Forge também inclui [investimento 3× em mobile](phase2e-after/city-center/forge/forge-high-investment-mobile-390x844.jpg) e [recursos insuficientes em mobile](phase2e-after/city-center/forge/forge-shortage-mobile-390x844.jpg). Reinforcement inclui [estado sem Legendary elegível](phase2e-after/city-center/legendary-reinforcement/reinforcement-no-eligible-mobile-390x844.jpg) e estado com item selecionado nas quatro dimensões.

| Viewport | Forge antes → depois | Blacksmith antes → depois | Reinforcement antes → depois |
|---|---|---|---|
| 390 × 844 | [antes](screenshots/city-center/forge/forge-mobile-390x844.jpg) · [depois](phase2e-after/city-center/forge/forge-mobile-390x844.jpg) | [antes](screenshots/city-center/blacksmith/blacksmith-mobile-390x844.jpg) · [depois](phase2e-after/city-center/blacksmith/blacksmith-mobile-390x844.jpg) | [antes](screenshots/city-center/legendary-reinforcement/reinforcement-mobile-390x844.jpg) · [depois](phase2e-after/city-center/legendary-reinforcement/reinforcement-mobile-390x844.jpg) |
| 768 × 1024 | [antes](screenshots/city-center/forge/forge-tablet-768x1024.jpg) · [depois](phase2e-after/city-center/forge/forge-tablet-768x1024.jpg) | [antes](screenshots/city-center/blacksmith/blacksmith-tablet-768x1024.jpg) · [depois](phase2e-after/city-center/blacksmith/blacksmith-tablet-768x1024.jpg) | [antes](screenshots/city-center/legendary-reinforcement/reinforcement-tablet-768x1024.jpg) · [depois](phase2e-after/city-center/legendary-reinforcement/reinforcement-tablet-768x1024.jpg) |
| 1440 × 900 | [antes](screenshots/city-center/forge/forge-desktop-1440x900.jpg) · [depois](phase2e-after/city-center/forge/forge-desktop-1440x900.jpg) | [antes](screenshots/city-center/blacksmith/blacksmith-desktop-1440x900.jpg) · [depois](phase2e-after/city-center/blacksmith/blacksmith-desktop-1440x900.jpg) | [antes](screenshots/city-center/legendary-reinforcement/reinforcement-desktop-1440x900.jpg) · [depois](phase2e-after/city-center/legendary-reinforcement/reinforcement-desktop-1440x900.jpg) |
| 1920 × 1080 | [antes](screenshots/city-center/forge/forge-wide-1920x1080.jpg) · [depois](phase2e-after/city-center/forge/forge-wide-1920x1080.jpg) | [antes](screenshots/city-center/blacksmith/blacksmith-wide-1920x1080.jpg) · [depois](phase2e-after/city-center/blacksmith/blacksmith-wide-1920x1080.jpg) | [antes](screenshots/city-center/legendary-reinforcement/reinforcement-wide-1920x1080.jpg) · [depois](phase2e-after/city-center/legendary-reinforcement/reinforcement-wide-1920x1080.jpg) |

### Validação

- Fixture Playwright + Axe/Chromium: 12 estados principais (três operações × quatro viewports) e 3 capturas adicionais de estado; **15 screenshots**. Em todos os 12 estados: **0 overflow horizontal, 0 imagens em falta e 0 erros de página**.
- Fluxos funcionais verificados: custo e odds mudam ao passar de 1× (20 Fragments) para 3× (60 Fragments); recursos suficientes ativam Craft e Reinforcement; insuficiência mostra o défice e desativa a ação; estado sem Legendary explica o requisito; tabs Blacksmith respondem a Enter e a touch emulado. Registos: [render-checks.json](phase2e-after/render-checks.json).
- Axe encontrou em todas as capturas as duas violações globais já existentes fora dos componentes ajustados: `landmark-complementary-is-top-level` no sidebar do City Center e `region` no `#wallet`. Não há violações apontadas ao preview, probabilidades, controlos ou ações alterados.
- Testes dirigidos `v012-buildcraft.test.cjs` e `v012-global-ui-audit.test.cjs`: **2 PASS**.
- `npm test`: **28 PASS / 3 FAIL**. As falhas continuam nos harnesses `private-preview.test.mjs`, `v012-runtime-integration.test.cjs` e `v012-unified-gear-potions.test.cjs`; a comparação de baseline já documentada em 182508d as identifica como preexistentes. Não alterei testes nem as funcionalidades abrangidas por essas falhas.
- Comparação visual manual confirmou proporções dos PNGs preservadas e conteúdo dentro dos painéis. Esta fase não executou a suite completa `npm run test:browser` nem uma verificação em Safari/WebKit.

Commit local desta fase criado depois da validação. Nenhum push, merge ou deploy foi feito. Alterações locais anteriores em `index.html` e as capturas fora de `phase2e-after` foram mantidas fora do commit.

## Fase 2F — Merchant & Apothecary

No Merchant, a instrução agora explica a sequência comparar → comprar. O bloco de preço identifica o défice de Gold junto da oferta quando Buy está indisponível. Compare mostra a oferta com nome, raridade, tier/subtipo e preço, mantém a comparação com o equipamento atual e explicita que a compra vai para o Stash sem equipar o item. A janela fica dimensionada para mobile e desktop. O modelo atual de equipamento não guarda Affinity; por isso, não inventei nem apresentei esse dado.

Na Apothecary, o resumo deixa claro que Restock substitui as quatro ofertas e apresenta o custo real de `state.apothecary.refreshCost`; o botão agora diz “Restock” e tem uma área de ação mais evidente. Os cartões mostram preço mais legível e o Gold em falta. Se o bloqueio for capacidade do Stash/limite da pilha, a mensagem explica o motivo. Stock, preços, efeitos, custos, atualização individual após compra e reposição total continuam a usar o runtime existente.

| Texto anterior | Texto novo | Justificação |
|---|---|---|
| “Buy equipment with Gold. Select Compare to inspect one item in detail.” | “Compare an offer with your equipped gear, then buy it with Gold.” | Põe a ordem das ações e o papel de Compare em linguagem direta. |
| “Four randomized potion offers · Restock for a new selection.” | “Four random offers. Restock to replace them.” | Encurta a descrição e clarifica a ação. |
| “Reroll · N Gold” | “Restock · N Gold” | Usa o mesmo termo do resumo e descreve a substituição das quatro ofertas. |
| Sem indicação de Gold em falta | “Need N more Gold.” / “Need N more Gold to Restock.” | Explica o motivo do botão desativado usando os valores atuais do runtime. |
| Sem resultado de compra visível no Compare | “Buying adds this item to your Stash; it does not equip it.” | Explicita o efeito real da compra. |

### Comparação visual

Capturas antes: [Merchant](screenshots/city-center/merchant/) e [Apothecary](screenshots/city-center/apothecary/), nas quatro resoluções da auditoria. Depois: [Merchant](phase2f-after/merchant-mobile-390x844.jpg), [Apothecary](phase2f-after/apothecary-mobile-390x844.jpg), [Merchant Compare mobile](phase2f-after/merchant-compare-mobile-390x844.jpg), [Merchant Compare desktop](phase2f-after/merchant-compare-desktop-1440x900.jpg) e [Stash cheio mobile](phase2f-after/apothecary-stash-full-mobile-390x844.jpg). As restantes capturas estão em [phase2f-after](phase2f-after/). Dados de overflow, imagens, erros e Axe: [phase2f-browser-checks.json](phase2f-after/phase2f-browser-checks.json). Fixtures de insuficiência, Stash cheio e compra/reposição: [mesmo registo](phase2f-after/phase2f-browser-checks.json).

### Validação

- Chromium/Playwright nos dois serviços — Merchant e Apothecary — em 390 × 844, 768 × 1024, 1440 × 900 e 1920 × 1080: **8 capturas**, 0 overflow horizontal, 0 imagens em falta e 0 erros de página.
- Compare: abertura por Enter, fecho por Escape, oferta, item equipado, preço e resultado visíveis; o diálogo cabe em 390 × 844 e 1440 × 900. Compra testada com toque emulado no mobile e click no desktop: Gold deduzido pelo valor real, item adicionado ao Stash, slot do stock substituído e equipamento mantido.
- Apothecary: quatro ofertas; falta de Gold desativa Buy/Restock e mostra o défice; Stash a 40/40 desativa Buy com “Stash full. Free a slot.”; compra substitui somente a oferta escolhida; Restock deduz exatamente o custo anunciado e troca as quatro ofertas. Compra/Restock também foram acionados com toque emulado a 390 px. O estado desativado agora conta os mesmos slots que a função runtime.
- Axe: nenhuma violação no diálogo Compare (executado isoladamente em mobile e desktop), cartões ou resumo Restock. Na página completa persistem apenas `landmark-complementary-is-top-level` no `aside` do shell e `region` no `#wallet`, ambos fora das áreas alteradas.
- Testes de browser adicionais executados individualmente: `v0120-evasion-browser`, `v0120-equipment-browser`, `private-preview-browser`, `v012-phase-c3-treasures-browser`, `v012-global-ui-audit-browser` e `v012-ui-polish-browser`: **6 PASS**. `npm run test:browser` para no primeiro script: o fluxo de 390 px passa, mas a assertion em `tests/v012-complete-browser.cjs:32` exige `backgroundColor` `rgb(58, 37, 45)` na tab selecionada em desktop; o valor atual é transparente. A expectativa não corresponde à implementação visual anterior desta fase e não foi modificada.
- `npm test`: **273/294 PASS, 21 FAIL** com loopback permitido. Passam os quatro casos de `private-preview.test.mjs`; as 21 falhas são as mesmas já classificadas no diagnóstico anterior: 20 digests do `v012-runtime-integration.test.cjs` e uma expectativa antiga de geometria em `v012-unified-gear-potions.test.cjs`. São preexistentes no baseline `182508d`; não alterei testes, fixtures ou regras para os contornar.
- Comparação manual das capturas confirmou layout dentro dos cartões e PNGs sem distorção. Zoom de navegador a 200% e Safari/WebKit não foram verificados.

Ficheiros de runtime/estilo desta fase: `index.html` e `online/ux39.css`. Capturas e checks: `docs/ui-audit/phase2f-after/`. Não houve alteração de gameplay, economia ou saves.

## Fase 2G — Event Decisions UI/UX

As 16 opções de evento agora usam a mesma ordem visual: ação, benefício e, quando aplicável, custo, condição ou risco. A opção selecionada fica destacada e o estado de disponibilidade é explícito. Escolhas sem recursos continuam selecionáveis para que o jogador veja o motivo do bloqueio; a confirmação permanece desativada pelo motivo produzido no runtime. “Change choice” permite voltar à seleção; “Leave event — no reward” mantém a saída sem recompensa existente. Nenhum custo, efeito, recompensa ou regra de evento foi alterado.

| Texto anterior | Texto novo | Justificação |
|---|---|---|
| “Choose an outcome. Decline gives no reward.” | “Choose an option, or leave without a reward.” | Instrução mais curta, alinhada com a ação Leave. |
| “Buy healing: 25 + 3×E Gold for 35% HP” | Ação “Restore health”; benefício “+35% HP”; custo calculado à parte | Separa ação, benefício e custo; o custo continua dinâmico por Expedition. |
| “Buy battle preparation: same Gold for +10% Attack for 3 combats” | “Prepare for battle”; “+10% Attack · 3 combats”; “Cost · N Gold” | Remove “same Gold”, mantendo o valor, o recurso e a duração. |
| “Trade 10 + E Fragments for 40% Mana” | “Restore Mana”; “+40% Mana”; “Cost · N Fragments” | Torna benefício e preço comparáveis sem repetir o custo na ação. |
| “Decline — no reward” / “Cancel” | “Leave event — no reward” / “Change choice” | Distingue sair do evento de alterar a decisão atual. |
| Sem indicação explícita no cartão | “Unavailable” e “Cost · N Gold · Have N Gold” (ou Fragments) | Expõe custo e saldo junto à opção; o status da escolha informa o défice exato e bloqueia Confirm. |

As demais opções apresentam benefícios e consequências compactos a partir dos valores existentes: por exemplo, duração de buffs, penalização de HP, risco de equipamento, passivo afetado e fallback quando o recurso já está cheio ou não existe. Os textos foram conferidos contra `online/v012-expedition-events.js` e `online/v012-expedition-runtime.js`; o código de runtime não foi alterado.

### Capturas comparativas

| Resolução | Antes | Depois |
|---|---|---|
| 390 × 844 | [antes](screenshots/expedition/event-decision/event-decision-mobile-390x844.jpg) | [depois](phase2g-after/event-decision-mobile-390x844.jpg) |
| 768 × 1024 | [antes](screenshots/expedition/event-decision/event-decision-tablet-768x1024.jpg) | [depois](phase2g-after/event-decision-tablet-768x1024.jpg) |
| 1440 × 900 | [antes](screenshots/expedition/event-decision/event-decision-desktop-1440x900.jpg) | [depois](phase2g-after/event-decision-desktop-1440x900.jpg) |
| 1920 × 1080 | [antes](screenshots/expedition/event-decision/event-decision-wide-1920x1080.jpg) | [depois](phase2g-after/event-decision-wide-1920x1080.jpg) |

Estado indisponível por falta de Gold: [depois — mobile](phase2g-after/event-insufficient-gold-mobile-390x844.jpg). Registos detalhados do browser/Axe: [phase2g-browser-checks.json](phase2g-after/phase2g-browser-checks.json).

### Validação e ficheiros

- Fixture Playwright isolada cobriu os **16 eventos** em quatro resoluções. Nas quatro capturas: 0 overflow horizontal, 0 imagens em falta e 0 erros de página. Zoom simulado a 200% em 390 px: cartões dentro do viewport e sem overflow horizontal.
- Fluxos funcionais: estado disponível e insuficiente (Gold e Fragments), confirmação bloqueada por insuficiência, custo do Mercador debitado uma vez com buff de +10%, escolha grátis do Forgotten Arsenal, Leave sem recompensa, item dinâmico do Relic Collector, seleção/confirm por teclado e seleção por touch emulado. Axe no componente `.phase6Event`: **0 violações**. Axe na página completa manteve duas ocorrências globais alheias a esta interface: `page-has-heading-one` e `region` em `#wallet`.
- `node --test tests/v012-complete-events.test.cjs tests/v012-complete-flow.test.cjs`: **2/2 PASS**.
- `node tests/v012-events-browser.cjs`: **PASS** em 390 e 1280 px.
- `npm test`: **273 PASS / 21 FAIL**, sem falhas novas identificadas. São preexistentes no baseline documentado: 20 digests `runtime parity c3-six-treasure-catalog-v012-realm-affinity-rewards` e 1 asserção de geometria antiga em `Camp and Inventory keep three potion slots in the same portrait grid`. O harness private-preview passou com permissão de loopback.
- `npm run test:browser`: primeiro cenário de Expedition passou em 390 px; a suite parou na asserção desktop preexistente de cor da tab (`tests/v012-complete-browser.cjs:32`, actual `rgba(0, 0, 0, 0)`, expected `rgb(58, 37, 45)`). A cadeia não executou os scripts seguintes. O teste isolado de eventos passou, conforme acima.
- `git diff --check`: PASS. Screenshots revistos visualmente nas quatro dimensões; molduras e PNGs mantêm proporção, cartões e ações não ficam cortados.

Ficheiros desta fase: `index.html`, `online/ux39.css`, `online/v012-gothic-panels.js`, este relatório, `phase2g-after/event-decision-*.jpg`, `phase2g-after/event-insufficient-gold-mobile-390x844.jpg` e `phase2g-after/phase2g-browser-checks.json`. A alteração no observador de cantos restringe `.eventOption` ao tipo decorativo pequeno fixo, evitando alternância de tamanho que impedia toque estável; não afeta outras classes de botões.

Sem alterações a gameplay, custos, recompensas, progressão, saves, Firebase Rules ou outras interfaces. Não foi feito push, merge ou deploy.

## Fase 2H — Inventory e Camp

### Alterações

- **Inventory / slots:** rótulos e tiers ficaram mais legíveis sem mudar a personagem, a disposição dos slots ou os PNGs. Em 390 px, os nomes passaram de 9 para 10,5 px e os tiers de 8 para 10 px. Em tablet/desktop, os tiers passaram de 9 para 10 px; os rótulos do Inventory passaram a 10 px.
- **Stash:** corrigi a altura dos trilhos da grelha. Com a capacidade cheia, os botões quadrados antes transbordavam para a linha seguinte e um cartão interceptava o toque no cartão acima. As linhas agora acompanham os cartões de 86 px; os 40 itens ficam separados e continuam dentro da área rolável.
- **Controlos Inventory:** filtros e ações passam a ter 44 px de altura em mobile, preservando as dimensões exteriores dos itens e slots.
- **Camp:** rótulos de equipamento sobem para 10,5 px em 390 px (12 px acima desse breakpoint); tipos de armadura passam a 9,5/10 px; tiers ficam em 10 px. As cinco stats principais mantêm-se numa só linha e os rótulos usam pelo menos 10 px.
- **UX Writing:** “Gear up. Choose your path. Survive.” passou a “Prepare your gear. Choose your Expedition. Survive.” O controlo deste painel escolhe uma Expedition, não um Realm.
- O botão Start Expedition sticky e o botão original foram preservados. Os dois seletores de Expedition continuam presentes e sincronizados. A composição central, o cenário, as proporções dos PNGs e as regras do jogo não mudaram.

### Comparação de screenshots

| Resolução | Camp antes → depois | Inventory antes → depois |
|---|---|---|
| 390 × 844 | [antes](phase2h-before/camp-mobile-390x844.jpg) · [depois](phase2h-after/camp-mobile-390x844.jpg) | [antes](phase2h-before/inventory-mobile-390x844.jpg) · [depois](phase2h-after/inventory-mobile-390x844.jpg) |
| 768 × 1024 | [antes](phase2h-before/camp-tablet-768x1024.jpg) · [depois](phase2h-after/camp-tablet-768x1024.jpg) | [antes](phase2h-before/inventory-tablet-768x1024.jpg) · [depois](phase2h-after/inventory-tablet-768x1024.jpg) |
| 1440 × 900 | [antes](phase2h-before/camp-desktop-1440x900.jpg) · [depois](phase2h-after/camp-desktop-1440x900.jpg) | [antes](phase2h-before/inventory-desktop-1440x900.jpg) · [depois](phase2h-after/inventory-desktop-1440x900.jpg) |
| 1920 × 1080 | [antes](phase2h-before/camp-wide-1920x1080.jpg) · [depois](phase2h-after/camp-wide-1920x1080.jpg) | [antes](phase2h-before/inventory-wide-1920x1080.jpg) · [depois](phase2h-after/inventory-wide-1920x1080.jpg) |

Camp com slots vazios: [depois](phase2h-after/camp-empty-slots-mobile-390x844.jpg). Stash mobile: [antes, 36/40 com cartões sobrepostos](phase2h-before/inventory-stash-mobile-390x844.jpg) · [depois, 40/40 sem sobreposição](phase2h-after/inventory-full-stash-mobile-390x844.jpg) · [vazio](phase2h-after/inventory-empty-stash-mobile-390x844.jpg). As capturas antes foram renderizadas em fixtures equivalentes sobre o commit `a060058`. Medições e Axe: [render-checks.json](phase2h-after/render-checks.json).

### Validação

- Fixture Playwright em Chromium, sem saves reais nem pedidos externos: **PASS** nos quatro viewports. Verificados 10 slots, raridades, tiers, NEW, Stash vazio/40 de 40, filtro por slot, inspeção por teclado e toque, sync dos dois seletores de Expedition e estados do sticky em viewport real. No Stash cheio: 0 pares de cartões sobrepostos.
- Sticky mobile: visível no topo quando o botão original está fora do viewport; oculta-se quando o botão original entra no viewport. No fim da página, o botão original ainda cabe no viewport e o sticky permanece oculto. Nenhuma sobreposição ou conteúdo coberto foi observado.
- Reflow equivalente a 200%: viewport CSS de 195 × 422 (metade de 390 × 844), **0 overflow horizontal**. Não foi possível controlar o zoom nativo do browser por atalho nesta execução.
- Nas quatro resoluções: **0 overflow horizontal, 0 imagens em falta e 0 erros de página**. Axe no Inventory: **0 violações**. Axe no Camp: `heading-order` e `landmark-complementary-is-top-level`, presentes também nas auditorias anteriores; não foram introduzidos nesta fase.
- `node --test tests/v0120-equipment.test.cjs`: **15/15 PASS**.
- `node --test tests/v012-unified-gear-potions.test.cjs`: **FAIL preexistente**, uma assertion em `tests/v012-unified-gear-potions.test.cjs:30` espera a geometria antiga `grid-template-rows: repeat(5, var(--gear-row)) 78px`. A implementação em `a060058` já usava `var(--gear-slot-width)` para essa linha; o teste e essa geometria não foram alterados nesta fase. As outras assertions deste ficheiro não foram executadas separadamente pelo runner.
- `git diff --check`: **PASS**. Os PNGs usam `object-fit: contain`; nenhuma imagem ou funcionalidade de Camp/Inventory foi removida.

### Ficheiros desta fase

`index.html` (apenas a frase de Camp neste commit), `online/v012-core.css`, `online/v012-ui5-camp.css`, `online/v012-ui6-unified-inventory.css`, este relatório e capturas em `phase2h-before/` e `phase2h-after/`.

Os dois hunks locais anteriores de `index.html` (texto do Shrine e `role="group"` nas poções), assim como capturas e documentos locais anteriores, foram preservados fora do commit. Nenhuma alteração a gameplay, saves, economia, Firebase Rules ou outras interfaces. Sem push, merge ou deploy.

Commit local da implementação Fase 2H: `fb16a20` — `Improve Inventory and Camp readability` (branch `development`).

## Fase 2I — Resultados e pop-ups

### Alterações

- O painel de resultado de cada Realm usa agora a mesma hierarquia visual dos resumos finais: desfecho em primeiro plano, métricas em cartões, equipamento e tesouros em grupos separados, log recolhível e ação final isolada no rodapé.
- Em caso de derrota, equipamento perdido recebe tratamento carmesim e os tesouros continuam identificados como “collected · still at risk” até ao resumo final. Em Realm concluído, os itens aparecem como “secured”. A informação deriva dos mesmos campos de resultado; não foram mudadas recompensas, perdas nem progressão.
- Listas vazias deixaram de mostrar “None”: indicam que não há equipamento ou tesouros registados naquele Realm.
- O resumo de Expedition/Extraction ficou limitado a uma largura legível em ecrãs grandes. Os cartões de Gold, Fragments, duração, progresso, equipamento e tesouros mantêm todos os dados existentes; a ação de regressar ao Camp fica numa faixa visual própria.
- Os modais partilhados ganharam títulos, texto e rodapé de ações com hierarquia consistente. Os botões têm 48 px de altura e largura mínima de 96 px. A área de conteúdo mantém scroll interno e o limite de altura mobile.
- O modal nativo continua a usar `aria-labelledby`, foco inicial em Close/Cancel, Escape e retorno do foco ao elemento de abertura. Não foram empilhados novos modais.

### UX Writing

| Antes | Depois | Motivo |
|---|---|---|
| `Combat time: 42.8s · +19 Gold · +11 Fragments` numa frase corrida | Cartões separados `Combat time`, `Gold`, `Fragments` | Leitura rápida de duração e ganhos sem alterar valores. |
| `Realm equipment …` seguido de lista simples | `Realm equipment secured/lost` com cartão de item, tier e raridade | Associação visual clara entre estado e equipamento. |
| `Realm treasures` e lista sem estado | `Realm treasures secured` ou `collected · still at risk`, em cartões com valor | Distinguir recompensa assegurada do loot ainda em risco. |
| `None` | `No equipment/treasures recorded for this Realm.` | Evitar a ambiguidade de um marcador vazio. |
| Log imediatamente visível na página | `Last Realm Combat Log` recolhível | Mantém o detalhe disponível sem competir com o resultado. |

Os textos de Leaderboard foram preservados, incluindo a indicação de que nenhum resultado é submetido durante o playtest. A explicação existente sobre equipamento equipado e moedas preservadas no resumo de derrota também foi mantida.

### Capturas antes/depois

As capturas antes e depois foram produzidas em Chromium com os mesmos dados de fixtures sintéticas: o baseline usa `d7a5dfd`; o depois usa esta implementação. Nenhuma captura altera saves. Os diretórios `phase2i-before/` e `phase2i-after/` contêm os pares comparáveis. Os estados vazios adicionais estão em `phase2i-after/death-empty-mobile-390x844.jpg` e `phase2i-after/extraction-empty-mobile-390x844.jpg`.

| Interface | 390 × 844 | 768 × 1024 | 1440 × 900 | 1920 × 1080 |
|---|---|---|---|---|
| Realm Cleared | [antes](phase2i-before/realm-cleared-mobile-390x844.jpg) · [depois](phase2i-after/realm-cleared-mobile-390x844.jpg) | [antes](phase2i-before/realm-cleared-tablet-768x1024.jpg) · [depois](phase2i-after/realm-cleared-tablet-768x1024.jpg) | [antes](phase2i-before/realm-cleared-desktop-1440x900.jpg) · [depois](phase2i-after/realm-cleared-desktop-1440x900.jpg) | [antes](phase2i-before/realm-cleared-wide-1920x1080.jpg) · [depois](phase2i-after/realm-cleared-wide-1920x1080.jpg) |
| Death | [antes](phase2i-before/death-mobile-390x844.jpg) · [depois](phase2i-after/death-mobile-390x844.jpg) | [antes](phase2i-before/death-tablet-768x1024.jpg) · [depois](phase2i-after/death-tablet-768x1024.jpg) | [antes](phase2i-before/death-desktop-1440x900.jpg) · [depois](phase2i-after/death-desktop-1440x900.jpg) | [antes](phase2i-before/death-wide-1920x1080.jpg) · [depois](phase2i-after/death-wide-1920x1080.jpg) |
| Extraction Summary | [antes](phase2i-before/extraction-summary-mobile-390x844.jpg) · [depois](phase2i-after/extraction-summary-mobile-390x844.jpg) | [antes](phase2i-before/extraction-summary-tablet-768x1024.jpg) · [depois](phase2i-after/extraction-summary-tablet-768x1024.jpg) | [antes](phase2i-before/extraction-summary-desktop-1440x900.jpg) · [depois](phase2i-after/extraction-summary-desktop-1440x900.jpg) | [antes](phase2i-before/extraction-summary-wide-1920x1080.jpg) · [depois](phase2i-after/extraction-summary-wide-1920x1080.jpg) |
| Expedition Completed | [antes](phase2i-before/expedition-completed-mobile-390x844.jpg) · [depois](phase2i-after/expedition-completed-mobile-390x844.jpg) | [antes](phase2i-before/expedition-completed-tablet-768x1024.jpg) · [depois](phase2i-after/expedition-completed-tablet-768x1024.jpg) | [antes](phase2i-before/expedition-completed-desktop-1440x900.jpg) · [depois](phase2i-after/expedition-completed-desktop-1440x900.jpg) | [antes](phase2i-before/expedition-completed-wide-1920x1080.jpg) · [depois](phase2i-after/expedition-completed-wide-1920x1080.jpg) |

Account, Leaderboard, confirmação e inspeção de equipamento: capturas antes/depois em `phase2i-before/` e `phase2i-after/`, com o mesmo conteúdo sintético.

### Validação

- Fixture Playwright/Chromium, sem pedidos externos nem saves: **PASS** em 390 × 844, 768 × 1024, 1440 × 900 e 1920 × 1080. Cobriu Realm Cleared, Death com/sem equipamento e tesouro, Extraction Summary com/sem loot, Expedition Completed, Account, Leaderboard, confirmação e inspeção de equipamento.
- Ações dos modais: **PASS** para foco inicial, retorno do foco a um opener visível, Escape, Cancel e Confirm (callback executado uma vez). Close/Cancel medido com 48 px de altura; somente um modal aberto em cada passo do fluxo testado.
- Axe nos painéis de resultados e nos modais Account, Leaderboard, confirmação e inspeção: **0 violações** nos quatro viewports.
- Resultados: **0 overflow horizontal, 0 imagens em falta e 0 erros de página** nos quatro viewports. As imagens foram aguardadas até ao fim do carregamento, incluindo as lazy.
- `node tests/v012-dialog-centering-browser.cjs`: **PASS**, popup centrado em 390 × 844 e 1280 × 720.
- `node --test tests/v012-item-popup.test.cjs tests/v012-global-ui-audit.test.cjs`: **PASS**, 5/5.
- `node tests/v0120-results.test.cjs`: **FAIL**, 3 de 5 subtestes. Falham “Realm result persists until exit”, “defeat recap distinguishes equipped new loot from discarded items and protects home” e “eligible final boss recap preserves build and Rune choice”; os dois restantes passam. As assertions recebem `review: null` em vez de `realm` e arrays vazios para `lost`/`picks`. São falhas do runtime/harness já presentes no estado-base `d7a5dfd`: nesta fase não foram modificados `online/v012-expedition-runtime.js` nem `tests/v0120-results.test.cjs`; a confirmação de que não houve regressão é também sustentada pelo teste Playwright de apresentação, que injeta fixtures diretamente e não invoca geração nem persistência.
- `git diff --check`: **PASS**. Não foram alterados gameplay, fórmulas, recompensas, saves, Firebase Rules ou o fluxo Affinity → Magic.

### Ficheiros desta fase

- `index.html`: somente o renderer de resultados de Realm nesta fase. Dois hunks locais anteriores (texto do Shrine e `role="group"` das poções) permanecem fora do commit desta fase.
- `online/v012-ui4f.css`: apresentação de resultados e estilos partilhados dos modais.
- `docs/ui-audit/uiux-implementation-report.md` e `docs/ui-audit/phase2i-after/`: relatório, capturas e registo da validação.

Commit de implementação: a registar após o commit; o relatório final de hash será atualizado no commit documental seguinte. Nenhum push, merge ou deploy foi feito.
