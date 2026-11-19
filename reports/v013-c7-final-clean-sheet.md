# Wanderer v0.13 — Stage C7: encerramento da limpeza histórica

**Data:** 19 de novembro de 2026  
**Branch:** `audit/v013`  
**Último commit funcional verificado:** `cd24b866edd861488130f5c873b586fa98b89888`  
**Gate final obrigatório:** [GitHub Actions 44621778866](https://github.com/Skinny-lfg/wanderer-game/actions/runs/44621778866) — **SUCESSO, 4/4 jobs**.  
**Merge, deploy, alterações a `main`, bases de dados ou saves de jogadores:** **não realizados**.

## Objetivo

Eliminar os últimos resíduos do sistema anterior de escolha inicial de Affinity, passivos após Realms, rerolls de cartas, migrações de drafts e controlos de interface associados. Não acrescentar compatibilidade com saves antigos. Preservar integralmente Dungeon v2, Talent Tree v15 (343 nós), Builds permanentes, escolhas de Boons/Contracts, combate e validação de identidade/anti-duplicação.

## Alterações verificadas

1. **Runtime** — em `online/v012-expedition-runtime.js`, foram eliminadas `phase2ChooseInitial`, `phase1Choose`, `phase3Reroll`, `phase2EnterInitialRealm`, `phase2ChooseElement`, `phase2ChoosePassive`, `phase6PassiveOptions` e `phase6UnlockBase`; removeu-se o ramo alternativo de entrada e preparação de uma Realm clássica. `phase1Enter` mantém exclusivamente a entrada nativa pelo Dungeon.
2. **Interface** — em `index.html`, foram eliminados o modal de Affinity inicial, o modal de escolha de elemento antigo, o ecrã de draft dos passivos, o popup de passivos, os blocos de renderização/classificação associados, os guards de `phase1Draft` e os respectivos exports de runtimeContext. O Talent iframe, as habilidades permanentes e o mapa atual continuam.
3. **Checkpoints** — em `online/v012-persistence-runtime.js`, a sessão deixou de escrever `draft` e a recuperação deixou de tentar ressuscitar drafts históricos. Em `online/v012-save.js`, o campo histórico `draft` é agora rejeitado de forma explícita. Não houve migração de saves nem acesso a dados de produção.
4. **Harness** — `tests/v012-economy-harness.cjs` deixou de expor ações clássicas `initial`, `select`, `passive`, `element` e `reroll`, continuando a disponibilizar `enter`, escolhas atuais de Dungeon, combate e checkpoints.
5. **CSS de interface descontinuada** — eliminadas **160 regras e 22.845 bytes** de CSS histórico em dez ficheiros, removendo apenas seletores de Affinity inicial, antigos passivos e drafts. Mais dois ficheiros perderam selectores obsoletos em regras partilhadas, preservando as propriedades destinadas aos tooltips atuais.
6. **Novos guards de regressão** — criado `tests/v013-c7-legacy-retirement.test.cjs`, integrado no obrigatório `npm run test:v013`; valida parsing do JavaScript inline, ausência de métodos/ecrãs antigos, sessão sem `draft`, API atual do Dungeon e ausência de CSS de drafts. `scripts/v013-c6-final-audit.cjs` agora falha em presença de chamadas a controladores eliminados.
7. **Pages mirror** — `docs/` sincronizado deterministicamente na branch isolada. O gate C7 aceita alterações em `docs/**` no filtro de paths, mantendo a comparação obrigatória código/docs.

## Prova dos testes na revisão de código

| Suite | Resultado |
|---|---:|
| Jogo v0.13 atual, incluindo quatro novos guards C7 | 276/276 |
| Simulação nativa | 7/7 |
| Árvore de talentos v15 | 79/79 |
| Bosses, Elites, builds e decisões | 89/89 |
| Integração, economia e checkpoints | 83/83 |
| Saves, autenticação, segurança de conta | 51/51 |
| Regras Firestore em emuladores | 11/11 |
| Chromium desktop/mobile, Talent/Forge/Bag/Dungeon | PASS |
| Browser profundo: Oracle, Marked Elite, final Boss e extração | PASS |
| `docs/` vs. fonte | `C4_SOURCE_DOCS_PARITY=true` |

O scanner final inspecionou **93 ficheiros de origem ativos, 82 referências HTML de entrada**, sem ficheiros ou imports relativos em falta, sem chamadas dos métodos removidos, sem referências executáveis aos módulos históricos e sem estilos órfãos das classes antigas identificadas. Em concreto: `removedMethods=0`, `missingEntries=0`, `missingImports=0`, `retiredRefs=0`, `deadCss=[]`, `historicalTree=0`. **Quatro** ocorrências da classificação genérica `oldPaths` referem-se a sinais de estado ainda válidos do Dungeon (como `freeBuild`), não ao gerador antigo.

Durante a edição, os primeiros testes apanharam dois erros de sintaxe introduzidos pelo refactor (uma string do botão Exit Realm e um delimitador do harness). Foram corrigidos **antes** do gate final; a última execução é inteiramente verde. Houve também falhas transitórias de paridade enquanto a sincronização `docs/` ainda não tinha terminado. A última execução foi feita sobre o commit já sincronizado e aprovou a paridade.

## Limites e decisões deliberadas

- O repositório continua a conter ficheiros com nomes `v012` que **implementam a arquitetura atual**; não foram apagados apenas devido ao nome.
- O flag `freeBuild` ainda participa no formato e validação nativa de Dungeon v2 e foi preservado.
- A verificação de alcançabilidade é forte mas não uma prova formal de ausência de todos os caminhos órfãos em dependências externas, texto histórico ou código dinâmico.
- A qualidade da política dos agentes de progressão natural E1–E20 e o balanceamento continuam assuntos separados. Não foram alterados coeficientes de combate, equipas, recompensas ou probabilidades de loot.
- O `npm ci` na CI indicou avisos de segurança nas dependências (33 advisories no momento da execução). **Não foram objeto desta limpeza**, não foram atribuídos a este patch e merecem auditoria de dependências própria antes de qualquer release.

**Resultado C7:** a limpeza histórica pedida encontra-se concluída na `audit/v013`, com o gate técnico 4/4 aprovado. Os dados reais, a versão publicada e o branch `main` permaneceram intactos.
