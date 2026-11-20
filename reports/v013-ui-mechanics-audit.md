# Wanderer v0.13 — Auditoria UI, falhas históricas e repetição C7

**Data:** 20-11-2026. **Branch isolada:** `audit/v013`. **Checkpoint de partida:** `e0ece4746b842f811adfacd760584426037297df`. **Código validado:** `aad28a098aaefea73ed7f8513ed7dc9730fd0458`. **Sem merge, alteração a `main` ou deploy.** O commit que atualiza este relatório é apenas documental; o código do jogo permanece no SHA validado.

## Resumo verificável — antes versus agora

| Área | Antes (checkpoint) | Repetição / resultado | Conclusão |
|---|---|---|---|
| C7 | 3/4 jobs no `e0ece474`; paridade de `docs/` falhou | [C7 44715694972](https://github.com/Skinny-lfg/wanderer-game/actions/runs/44715694972), **4/4 sucesso** no `aad28a0` | Gate do código validado passou; sem deploy |
| Três suites históricas | 12/32, 20 falhas, sem triagem individual | [Histórico 44715282347](https://github.com/Skinny-lfg/wanderer-game/actions/runs/44715282347): **12/32**, TAP completo preservado no artefacto 14619266764 | 20 casos individualizados abaixo; testes históricos não escondidos |
| Feedback | Teste falhou ao contar diálogo imediatamente após Close | Reprodução Chromium local 29/30 ainda no DOM; correção isolada 50/50; [browser real 44715694756](https://github.com/Skinny-lfg/wanderer-game/actions/runs/44715694756) **sucesso** | Fecho por clique/ESC, envio simulado, cooldown e autenticação testados |
| UI / alcançabilidade | ≥18 superfícies percorridas; inventário em aberto | 18 superfícies antigas consolidadas, feedback acrescentado; [scanner C6 44715694770](https://github.com/Skinny-lfg/wanderer-game/actions/runs/44715694770) **sucesso** | Nenhuma funcionalidade atual inteiramente inacessível foi comprovada no âmbito observado; limites adiante |
| Emuladores | Java local devolvia 3221225781 | Job `security-account` C7 executou **11/11** testes Auth/Firestore nos runners Linux com Java 21 | Bloqueio local de ambiente ultrapassado na CI, sem tocar no Firebase real |
| Pages mirror | 849 ficheiros iguais na comparação intermédia; depois falha por `docs/` não sincronizado | `C4_SOURCE_DOCS_PARITY=true` no C7 repetido | Paridade fonte/docs aprovada no código testado |

## 1. Classificação individual das 20 falhas históricas

**Comando executado pela CI:** `node --test tests/v012-economy.test.cjs tests/v0120-equipment.test.cjs tests/v012-phase-d-endless.test.cjs`. Resultado: **32 testes, 12 passaram, 20 falharam, 0 skipped/cancelled**. Fonte: TAP completo `historical-32.tap` no [artefacto 14619266764](https://github.com/Skinny-lfg/wanderer-game/actions/runs/44715282347/artifacts/14619266764). Os números da primeira coluna seguem a ordem efetiva do TAP.

**Classes:** **O** = teste obsoleto, expectativa de design removida; **F** = fixture incompatível, não chega a testar corretamente a regra atual. Nenhum destes 20 logs demonstra por si uma regressão real de gameplay ou falha de ambiente. Isso **não** prova ausência de regressões ocultas nas verificações que abortaram cedo.

| # | Caso histórico falhado | Evidência imediata do TAP | Classe | Tratamento da regra válida |
|---:|---|---|---|---|
| 2 | Ações de compra/craft durante rota e draft | `a.initial is not a function`, fluxo de draft eliminado | **O** | Bloqueio de compras na Dungeon: `v013-stage45-6-economy-p0` |
| 3 | Cash de waves uma vez e perda de Bag na derrota | `a.initial is not a function` | **F** | Liquidação única: `v013-stage45-6-economy-p0`. Perda de Bag por morte ainda pede assert direto atual |
| 4 | Stash cheia, loot do Boss e overflow uma vez | `a.initial is not a function` | **F** | Integridade da extração e checkpoint: `v013-stage45-6-extraction-p0`; combinação overflow/loot do Boss ainda não demonstrada por este teste |
| 5 | Boss concede Runes com patamar correto | `a.initial is not a function` | **F** | Runes/checkpoint e Boss no percurso nativo; teste antigo não é prova suficiente da recompensa |
| 6 | Cap de Tier/Runes e investimento finito | `a.initial is not a function` | **F** | `v013-crafting` e `v013-gear-roll-diversity` verificam patamares e geração atual |
| 7 | Resultado desbloqueia compras no Camp | `a.initial is not a function` | **F** | `v013-stage45-6-extraction-p0` valida compras reais após vitória |
| 11 | Escalamento Endless de gear e runas | esperava `tier=199`; o item atual tinha `tier=70` | **O** | Cinco bandas atuais de equipamento em `v013-crafting`/`v013-gear-roll-diversity`; Endless de combate testado separadamente |
| 13 | Snapshot antigo de combate Dual Daggers E200 | simulador legado chama `a.initial` | **F** | Matriz nativa `v013-stage45-6-encounter-matrix` em E1/E50/E200 |
| 14 | Boss na antiga sequência de 15 Realms | `Only the deterministic Dungeon is supported` | **O** | `v013-current-dungeon-and-talents` e `v013-full-expedition-integration` |
| 15 | Chave local com sufixo `endless` | chave atual `wanderer_v013_c2_clean_sheet_v1_local` | **O** | `v013-c2-reset` valida namespace clean sheet e rejeição de saves antigos |
| 17 | Marcos do leaderboard E200+ | `state is not defined` num fragmento `vm` isolado | **F** | Precisa de fixture de UI com `state` real; não é evidência de bug do leaderboard |
| 18 | Budget antigo de atributos/tiers em armaduras | comparação `15 !== 20` | **O** | Bandas e afixos aleatórios atuais: `v013-gear-roll-diversity` |
| 19 | Equipamento antigo sem qualquer badge | recebeu `Profile: Intellect`, esperava string vazia | **O** | Perfil de atributos atual é intencional; não reintroduzir expectativa antiga |
| 20 | Belt craft/equip/salvage por Forge anterior | item `undefined` após craft por assinatura histórica | **F** | Forge por receitas e transações: `v013-crafting` e `v013-stage71-forge-talents` |
| 25 | Legendary atual, sem efeitos antigos | `a.initial is not a function` | **F** | `v013-stage45-6-legendary-p0` valida efeitos atuais; snapshot histórico não é utilizável |
| 26 | Sword/Daggers/Staff, sem Poison legado | `a.initial is not a function` | **F** | `v013-stage45-6-encounter-matrix` e testes nativos de combat |
| 27 | Coeficientes fixos antigos das armas | ataque calculado `8` versus `94` esperado | **O** | Sistema agora gera afixos variáveis: `v013-gear-roll-diversity` |
| 29 | Multiplicadores antigos e Wand+Orb Barrier | `a.initial is not a function` | **F** | Matriz nativa cobre combate; a cadência exata de Barrier merece teste específico |
| 31 | Segunda pancada da dagger offhand | `a.initial is not a function` | **F** | Teste histórico #30 ainda passa o 50% do offhand; falta teste nativo isolado para número de impactos |
| 32 | Troca entre Realms e destruição da Bag por morte | `a.initial is not a function` | **F** | Equipamento/extração cobertos em percursos nativos; risco da Bag na derrota requer assert específico atual |

**Totais: 7 testes obsoletos; 13 fixtures incompatíveis; 0 regressões reais demonstradas; 0 falhas de ambiente nesta execução.** Não se alteraram regras nem coeficientes para “pôr os testes antigos verdes”. As três suites foram mantidas como histórico/diagnóstico, não fazem parte do gate atual. As regras ainda válidas foram confrontadas com suites atuais; os pontos de cobertura incompleta estão expressamente identificados, não mascarados.

## 2. Feedback — diagnóstico, correção e testes

No `online/v012-feedback.mjs`, o botão Close executava `dialog.close()` e a remoção do nó acontecia apenas no evento `close`, assíncrono em Chromium. Um teste de ciclo isolado reproduziu a janela em que o diálogo permanece no DOM em **29/30** cliques. A correção executa uma função `cleanup` idempotente no clique (imediata) e conserva o evento `close` para Escape; a reprodução isolada passou **50/50** cliques e Escape.

Foi acrescentado `tests/v013-feedback-close-browser.cjs`, que carrega **o módulo real da branch** numa página HTTP mínima e usa um stub explícito de Firebase. O primeiro teste CI falhou por uma fixture que não isolou o cooldown de 60 segundos depois de um envio bem-sucedido. A fixture foi corrigida, **sem remover o cooldown real**. No [run 44715694756](https://github.com/Skinny-lfg/wanderer-game/actions/runs/44715694756), o job `feedback-browser` passou: 21 aberturas/fechos repetidos, Escape, um envio simulado com payload correto, bloqueio de duplicado por cooldown e rejeição de conta anónima. Não se enviaram mensagens a Firebase de produção nem se testou escrita real.

## 3. Inventário da UI atual e funcionalidades inacessíveis

**Critério:** “Acessível” exige caminho de interface exercitado em Chromium ou teste nativo que usa o controlador atual; “bloqueada” exige condição de progressão/recurso/conta verificável; “inacessível” exige ausência de caminho utilizável para uma funcionalidade válida. As 18 superfícies seguintes foram observadas antes desta retoma em 360/390/768/1280/1440 px conforme o percurso, e os testes C7 atuais repetiram as jornadas críticas a 390 e 1280 px. O feedback é a 19.ª superfície de controlo testada separadamente.

| Funcionalidade/superfícies | Classificação | Evidência e condição |
|---|---|---|
| Acesso, Camp, escolha de personagem | **Acessível** | Auth bloqueia legitimamente acesso sem sessão; personagem Ranger persistiu após reload |
| Talent Tree v15 | **Acessível** | 343 nós, compra e reload; gates de pré-requisitos e XP |
| Forge, receita e resultado | **Acessível** | Craft e débito reais na fixture nativa; Rare/Epic **legitimamente bloqueadas** até descobrir Blueprint, reagente e materiais |
| Merchant e Apothecary | **Acessível** | Compra, Gold, poção, persistência; ações de Camp **legitimamente bloqueadas** durante Dungeon |
| Inventory, equipamento, inspeção de item | **Acessível** | Comparar, equipar, desequipar, filtros, Stash; capacidade/recursos limitam operações |
| Runes / Shrine | **Acessível** | Slot, remoção, reload; decisões de Shrine condicionadas à descoberta da sala e oferta pendente |
| Escolha de Realm e Contracts | **Acessível** | 3 cartas, 2 contratos, aceitar/recusar, bloqueios por decisão pendente |
| Mapa, zoom, névoa, inspeção de sala | **Acessível** | Zoom, custo, sala visível, navegação; fog/steps impedem legitimamente salas não descobertas ou inalcançáveis |
| Arena, resultado de combate, conclusão/extração | **Acessível** | Oracle, Reliquary, Elite, Boss e recuperação por checkpoint; integração e navegador C7 |
| Feedback & Bugs | **Acessível, corrigida** | Fecho, Escape, envio simulado; submissão bloqueada sem conta verificada ou durante cooldown |
| Perfil público / Leaderboard | **Acessível no backend simulado** | Percurso anterior de perfil público; não equivaler a uma prova de leitura/escrita de serviço real |

**Obsoletas e não reativadas:** escolha inicial de Affinity, draft de passivos após Realm, rerolls da rota clássica, antiga Forge por tiers, “High Quality/Masterwork”, módulo `economy/v0101.js`, protótipos alternativos e migrações de saves pré-clean sheet.

**Infraestrutura a preservar:** controladores Dungeon atuais com prefixo `v012`, validações de save, checkpoint/ledger anti-duplicação, custo de salvage, autenticação, Firebase e módulos de combate. Nome histórico de ficheiro não significa código morto.

**Varredura estática complementar:** no [artefacto do clean-sheet scan](https://github.com/Skinny-lfg/wanderer-game/actions/runs/44715282447) foram inspecionados **87 ficheiros ativos, 44 scripts carregados e 186 funções declaradas**; **0 candidatas** assinaladas apenas por referência única. O gate C7 executou `scripts/v013-c6-final-audit.cjs` e obteve **89 ficheiros ativos, 78 entrypoints, 0 ausentes, 0 imports em falta, 0 referências a módulos retirados e 0 chamadas aos controladores removidos**. Os 4 matches de `oldPaths` não equivalem a gerador antigo vivo. Isto é uma análise heurística, não prova matemática de alcançabilidade de todos os callbacks e estados dinâmicos.

**Conclusão de acessibilidade:** no conjunto de superfícies e percursos verificados, **nenhuma funcionalidade atual integralmente inacessível ficou comprovada**. A auditoria não certifica cada combinação de seed, árvore, gear, conta, resolução e estado: esses limites devem permanecer visíveis em vez de afirmar cobertura absoluta.

## 4. Gates efetivamente executados no código `aad28a0`

Workflow [C7 44715694972](https://github.com/Skinny-lfg/wanderer-game/actions/runs/44715694972): **4/4 jobs concluídos com sucesso**.

| Verificação | Resultado observado |
|---|---:|
| `scripts/v013-c6-final-audit.cjs`, dependências e referências | PASS |
| `npm run test:v013:gate` — gameplay atual | 274/274 |
| Simulador nativo | 7/7 |
| Talent Graph v15 | 79/79 |
| Boss, Elite, combate, balanceamento e decisões | 94/94 |
| Integração, economia, eventos e checkpoint | 83/83 |
| Saves, conta e cloud com fixtures | 51/51 |
| Regras Firestore/Auth em emuladores Linux | 11/11 |
| Navegador C3 (390/1280) e jornadas profundas Oracle/Elite/Boss/extração | PASS |
| Progressão natural limitada E1–E5 / E1–E20 (execução, não garantia de alcançar esses níveis) | PASS |
| `npm run build:pages` e `git status --porcelain -- docs` | PASS, `C4_SOURCE_DOCS_PARITY=true` |
| `tests/v013-feedback-close-browser.cjs` no [follow-up 44715694756](https://github.com/Skinny-lfg/wanderer-game/actions/runs/44715694756) | PASS |
| 3 suites históricas (diagnóstico, não gate) | 12/32, 20 falhas **classificadas** |

Os lotes C7 podem conter sobreposição de cobertura e não devem ser simplesmente somados como testes únicos. O runner Linux usou Node 22, Chromium e Java 21. A falha local anterior de Java não representa falha das regras Firebase após a execução válida de CI.

## 5. Limites e pendências residuais explícitas

1. **Não existe regressão atual confirmada entre as 20 falhas históricas**, mas os casos que abortam em `a.initial` não verificam a sua intenção original. Para cobertura fina, ainda são desejáveis regressões nativas independentes para: perda da Bag por morte/troca, interação Boss loot/overflow, número exato de impactos de dagger offhand, cadência Wand+Orb, marcos de leaderboard E200+ e Runes ao terminar o Boss. Não enfraquecer o jogo nem ressuscitar APIs antigas para os satisfazer.
2. **Serviços reais:** autenticação e escrita de feedback em Firebase de produção não foram exercitadas; testou-se stub e emulador. Não houve alteração a contas/saves reais.
3. **Alcançabilidade dinâmica:** 18+1 superfícies verificadas não equivalem a todas as combinações possíveis. O scanner encontrou candidatas mas não prova universal de ausência de funções escondidas.
4. **Progressão e balanceamento:** pilotos de contas naturais não demonstram alcançar E5/E10/E20 nem garantem política perfeita dos agentes. Não se alteraram danos ou probabilidades de loot.
5. **Dependências npm:** `npm ci` indicou 19 vulnerabilidades (14 moderadas, 5 altas) neste runner. Tratamento de dependências é escopo separado; não fazer `npm audit fix --force` indiscriminadamente.

**Decisão:** C7, paridade de fonte/docs, emuladores, jornadas Chromium e feedback passaram no SHA de código indicado. As 20 falhas históricas estão individualmente triadas e preservadas como diagnóstico. A conclusão da UI é **nenhuma inacessibilidade confirmada no âmbito testado**, com lacunas específicas de cobertura assinaladas. `main`, deploy e Firebase de produção permaneceram intocados.


## C8 — encerramento da última limpeza e cobertura (20-11-2026)

**Código validado:** `e9e590ba5ce62bca96e21e1001ca6088613106a7`. [C7 final: 4/4 jobs aprovados](https://github.com/Skinny-lfg/wanderer-game/actions/runs/44718433135). [Scanner clean-sheet: 3/3 jobs aprovados](https://github.com/Skinny-lfg/wanderer-game/actions/runs/44718433114).

As 3 suites históricas foram revistas: **20 falhas antigas retiradas por obsolescência/fixtures incompatíveis, 1 teste de passivos descontinuados também removido e 11 testes válidos preservados e integrados em `test:v013`**. C8 acrescentou **7 testes nativos** (Bag e derrota, overflow, loot real de Boss, Boss Rune, Dual Daggers, Wand/Orb, marcos atuais do Camp) e **3 guards de UI**. O último `npm run test:v013` terminou **295/295, 0 falhas, 0 skipped**; sim 7/7, talentos 79/79, combate 94/94, integração 83/83, saves/conta 51/51, emuladores 11/11, browser e paridade `docs/` passaram.

O teste de fecho de feedback passou a fazer parte do C7 obrigatório no navegador (21 cliques, Escape, submissão simulada, cooldown e rejeição anónima). O inventário estático da UI enumerou 56 marcadores de dados, 38 seletores ligados e 18 metadados; não identificou um controlo atual inteiramente sem handler na amostra analisada. Não equivale a testar todos os estados/combinações dinâmicas nem serviços reais.

**Relatório de fecho:** [v013-c8-final.md](v013-c8-final.md). **Inventários complementares:** [retirada de testes históricos](v013-c8-historical-retirement.md) e [UI](v013-c8-ui-inventory.md). Não houve merge, deploy, alteração a `main` ou migração de saves. O commit destes relatórios é apenas documental e não substitui os testes sobre o código indicado.
